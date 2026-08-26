import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { Database } from "../../src/types/database";

type LocalStatus = {
  API_URL: string;
  ANON_KEY?: string;
  PUBLISHABLE_KEY?: string;
  SECRET_KEY?: string;
  SERVICE_ROLE_KEY?: string;
};

function readLocalStatus(): LocalStatus {
  const cliPath = resolve(
    process.cwd(),
    "node_modules/supabase/dist/supabase.js",
  );
  const output = execFileSync(
    process.execPath,
    [cliPath, "status", "-o", "json"],
    { cwd: process.cwd(), encoding: "utf8" },
  );
  return JSON.parse(output) as LocalStatus;
}

function testClient(url: string, key: string) {
  return createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

describe.sequential("curriculum access and lesson progress RLS", () => {
  let admin: SupabaseClient<Database>;
  let anonymous: SupabaseClient<Database>;
  let learnerA: SupabaseClient<Database>;
  let learnerB: SupabaseClient<Database>;
  let learnerAId = "";
  let learnerBId = "";
  let firstLessonId = "";

  beforeAll(async () => {
    const status = readLocalStatus();
    const publicKey = status.PUBLISHABLE_KEY ?? status.ANON_KEY;
    const secretKey = status.SECRET_KEY ?? status.SERVICE_ROLE_KEY;

    if (!publicKey || !secretKey) {
      throw new Error("The local Supabase stack did not expose test API keys.");
    }

    admin = testClient(status.API_URL, secretKey);
    anonymous = testClient(status.API_URL, publicKey);
    learnerA = testClient(status.API_URL, publicKey);
    learnerB = testClient(status.API_URL, publicKey);

    const suffix = randomUUID();
    const [{ data: dataA, error: errorA }, { data: dataB, error: errorB }] =
      await Promise.all([
        learnerA.auth.signUp({
          email: "phase3-a-" + suffix + "@example.com",
          password: "PhaseThree123",
        }),
        learnerB.auth.signUp({
          email: "phase3-b-" + suffix + "@example.com",
          password: "PhaseThree123",
        }),
      ]);

    if (errorA || errorB || !dataA.user || !dataB.user) {
      throw new Error(
        errorA?.message ?? errorB?.message ?? "Test users were not created.",
      );
    }

    learnerAId = dataA.user.id;
    learnerBId = dataB.user.id;
  });

  afterAll(async () => {
    await Promise.all(
      [learnerAId, learnerBId]
        .filter(Boolean)
        .map((userId) => admin.auth.admin.deleteUser(userId)),
    );
  });

  it("publishes the complete active curriculum as read-only metadata", async () => {
    const [topicsResult, lessonsResult, prerequisitesResult] =
      await Promise.all([
        anonymous
          .from("topics")
          .select("id, slug, curriculum_order")
          .order("curriculum_order"),
        anonymous.from("lessons").select("id, content_path"),
        anonymous.from("topic_prerequisites").select("*"),
      ]);

    expect(topicsResult.error).toBeNull();
    expect(lessonsResult.error).toBeNull();
    expect(prerequisitesResult.error).toBeNull();
    expect(topicsResult.data).toHaveLength(21);
    expect(lessonsResult.data).toHaveLength(21);
    expect(prerequisitesResult.data?.length).toBeGreaterThan(20);
    expect(topicsResult.data?.[0]?.slug).toBe("interview-fundamentals");
    firstLessonId =
      lessonsResult.data?.find((lesson) =>
        lesson.content_path.endsWith("interview-fundamentals.md"),
      )?.id ?? "";
    expect(firstLessonId).not.toBe("");
  });

  it("persists completion for the authenticated learner", async () => {
    const completedAt = new Date().toISOString();
    const { error: insertError } = await learnerA
      .from("lesson_progress")
      .insert({
        completed_at: completedAt,
        lesson_id: firstLessonId,
        started_at: completedAt,
        user_id: learnerAId,
      });
    const { data, error } = await learnerA
      .from("lesson_progress")
      .select("lesson_id, completed_at")
      .single();

    expect(insertError).toBeNull();
    expect(error).toBeNull();
    expect(data?.lesson_id).toBe(firstLessonId);
    expect(new Date(data?.completed_at ?? "").toISOString()).toBe(completedAt);
  });

  it("prevents cross-user lesson progress reads, writes, and updates", async () => {
    const { data: readData, error: readError } = await learnerB
      .from("lesson_progress")
      .select("lesson_id")
      .eq("user_id", learnerAId);
    const { error: insertError } = await learnerB
      .from("lesson_progress")
      .insert({
        completed_at: "2026-08-26T00:00:00.000Z",
        lesson_id: firstLessonId,
        started_at: "2026-08-26T00:00:00.000Z",
        user_id: learnerAId,
      });
    const { data: updateData, error: updateError } = await learnerB
      .from("lesson_progress")
      .update({ completed_at: null })
      .eq("user_id", learnerAId)
      .select("lesson_id");

    expect(readError).toBeNull();
    expect(readData).toEqual([]);
    expect(insertError?.code).toBe("42501");
    expect(updateError).toBeNull();
    expect(updateData).toEqual([]);
  });

  it("denies lesson progress access to anonymous clients", async () => {
    const { data, error } = await anonymous
      .from("lesson_progress")
      .select("lesson_id");

    expect(data).toBeNull();
    expect(error?.code).toBe("42501");
  });
});
