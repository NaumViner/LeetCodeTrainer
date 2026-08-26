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

describe.sequential("problem library dataset and policies", () => {
  let admin: SupabaseClient<Database>;
  let anonymous: SupabaseClient<Database>;
  let learner: SupabaseClient<Database>;
  let learnerId = "";

  beforeAll(async () => {
    const status = readLocalStatus();
    const publicKey = status.PUBLISHABLE_KEY ?? status.ANON_KEY;
    const secretKey = status.SECRET_KEY ?? status.SERVICE_ROLE_KEY;
    if (!publicKey || !secretKey) {
      throw new Error("The local Supabase stack did not expose test API keys.");
    }

    admin = testClient(status.API_URL, secretKey);
    anonymous = testClient(status.API_URL, publicKey);
    learner = testClient(status.API_URL, publicKey);
    const { data, error } = await learner.auth.signUp({
      email: "phase4-" + randomUUID() + "@example.com",
      password: "PhaseFour123",
    });
    if (error || !data.user) {
      throw new Error(error?.message ?? "The test learner was not created.");
    }
    learnerId = data.user.id;
  });

  afterAll(async () => {
    if (learnerId) {
      await admin.auth.admin.deleteUser(learnerId);
    }
  });

  it("publishes exactly 150 complete metadata records across 18 topics", async () => {
    const [problemsResult, topicsResult, secondaryResult, prerequisitesResult] =
      await Promise.all([
        anonymous
          .from("problems")
          .select(
            "external_id, slug, title, difficulty, external_url, primary_topic_id, pattern_tags, recognition_signals, curriculum_level, dataset_order",
          )
          .order("dataset_order"),
        anonymous.from("topics").select("id, slug"),
        anonymous.from("problem_secondary_topics").select("*"),
        anonymous.from("problem_prerequisite_topics").select("*"),
      ]);

    expect(problemsResult.error).toBeNull();
    expect(topicsResult.error).toBeNull();
    expect(secondaryResult.error).toBeNull();
    expect(prerequisitesResult.error).toBeNull();
    expect(problemsResult.data).toHaveLength(150);
    expect(
      new Set(problemsResult.data?.map((problem) => problem.external_id)).size,
    ).toBe(150);
    expect(
      new Set(problemsResult.data?.map((problem) => problem.primary_topic_id))
        .size,
    ).toBe(18);
    expect(secondaryResult.data?.length).toBeGreaterThan(10);
    expect(prerequisitesResult.data?.length).toBeGreaterThan(150);
    expect(
      problemsResult.data?.every(
        (problem, index) =>
          problem.dataset_order === index + 1 &&
          problem.pattern_tags.length > 0 &&
          problem.recognition_signals.length > 0 &&
          problem.external_url ===
            "https://leetcode.com/problems/" + problem.slug + "/",
      ),
    ).toBe(true);
  });

  it("matches the expected core-set difficulty distribution", async () => {
    const counts = await Promise.all(
      ["easy", "medium", "hard"].map((difficulty) =>
        anonymous
          .from("problems")
          .select("*", { count: "exact", head: true })
          .eq("difficulty", difficulty),
      ),
    );

    expect(counts.map((result) => result.count)).toEqual([28, 101, 21]);
  });

  it("allows reads but denies browser-role problem mutations", async () => {
    const { data: readData, error: readError } = await learner
      .from("problems")
      .select("external_id, title")
      .eq("external_id", "1")
      .single();
    const { data: updateData, error: updateError } = await learner
      .from("problems")
      .update({ title: "Changed by learner" })
      .eq("external_id", "1")
      .select("id");

    expect(readError).toBeNull();
    expect(readData?.title).toBe("Two Sum");
    expect(updateData).toBeNull();
    expect(updateError?.code).toBe("42501");
  });
});
