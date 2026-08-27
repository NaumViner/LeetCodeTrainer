import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { Database, Json } from "../../src/types/database";

type LocalStatus = {
  API_URL: string;
  ANON_KEY?: string;
  PUBLISHABLE_KEY?: string;
  SECRET_KEY?: string;
  SERVICE_ROLE_KEY?: string;
};

const correctAnswers = {
  "coding-graph-cycle": "d",
  "coding-merge-intervals": "c",
  "coding-top-k": "b",
  "concept-complexity": "d",
  "concept-graphs": "a",
  "concept-hash-map": "a",
  "concept-recursion": "a",
  "concept-trees": "b",
  "pattern-contiguous": "c",
  "pattern-pair-sum": "b",
  "pattern-shortest-path": "a",
} as const;

function localStatus(): LocalStatus {
  const cliPath = resolve(
    process.cwd(),
    "node_modules/supabase/dist/supabase.js",
  );
  return JSON.parse(
    execFileSync(process.execPath, [cliPath, "status", "-o", "json"], {
      cwd: process.cwd(),
      encoding: "utf8",
    }),
  ) as LocalStatus;
}

function client(url: string, key: string) {
  return createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function answers(entries: Record<string, string>) {
  return Object.entries(entries).map(([question_id, answer]) => ({
    answer,
    question_id,
  })) as Json;
}

describe.sequential("diagnostic adaptation, mastery, and isolation", () => {
  let admin: SupabaseClient<Database>;
  let anonymous: SupabaseClient<Database>;
  let learner: SupabaseClient<Database>;
  let other: SupabaseClient<Database>;
  let learnerId = "";
  let otherId = "";
  let attemptId = "";

  beforeAll(async () => {
    const status = localStatus();
    const publicKey = status.PUBLISHABLE_KEY ?? status.ANON_KEY;
    const secretKey = status.SECRET_KEY ?? status.SERVICE_ROLE_KEY;
    if (!publicKey || !secretKey)
      throw new Error("Local API keys are missing.");
    admin = client(status.API_URL, secretKey);
    anonymous = client(status.API_URL, publicKey);
    learner = client(status.API_URL, publicKey);
    other = client(status.API_URL, publicKey);
    const [first, second] = await Promise.all([
      learner.auth.signUp({
        email: `diagnostic-${randomUUID()}@example.com`,
        password: "Diagnostic123",
      }),
      other.auth.signUp({
        email: `diagnostic-other-${randomUUID()}@example.com`,
        password: "Diagnostic123",
      }),
    ]);
    if (!first.data.user || !second.data.user)
      throw new Error("Test users failed.");
    learnerId = first.data.user.id;
    otherId = second.data.user.id;
    const setupResults = await Promise.all([
      learner
        .from("profiles")
        .update({ experience_level: "experienced", onboarding_completed: true })
        .eq("id", learnerId),
      other
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("id", otherId),
    ]);
    const setupError = setupResults.find((result) => result.error)?.error;
    if (setupError)
      throw new Error(`Profile setup failed: ${setupError.message}`);
  });

  afterAll(async () => {
    await Promise.all(
      [learnerId, otherId]
        .filter(Boolean)
        .map((id) => admin.auth.admin.deleteUser(id)),
    );
  });

  it("rejects incomplete or forged first-stage evidence", async () => {
    const { error } = await other.rpc("begin_diagnostic", {
      p_answers: answers({ "concept-complexity": "d" }),
    });
    expect(error).not.toBeNull();
    expect((await other.from("diagnostic_attempts").select("id")).data).toEqual(
      [],
    );
  });

  it("adapts strong evidence to three coding problems without exposing keys", async () => {
    const initialAnswers = Object.fromEntries(
      Object.entries(correctAnswers).filter(
        ([id]) => !id.startsWith("coding-"),
      ),
    );
    const { data, error } = await learner.rpc("begin_diagnostic", {
      p_answers: answers(initialAnswers),
    });
    expect(error).toBeNull();
    attemptId = data!;

    const { data: attempt } = await learner
      .from("diagnostic_attempts")
      .select("*")
      .eq("id", attemptId)
      .single();
    expect(attempt).toMatchObject({
      coding_tier: "advanced",
      concept_score: 100,
      pattern_score: 100,
      status: "coding",
    });
    expect(attempt?.assigned_coding_question_ids).toHaveLength(3);
    const { data: keys, error: keyError } = await learner
      .from("diagnostic_question_keys")
      .select("*");
    expect(keys).toBeNull();
    expect(keyError?.code).toBe("42501");
  });

  it("completes atomically and initializes conservative topic mastery", async () => {
    const codingAnswers = Object.fromEntries(
      Object.entries(correctAnswers).filter(([id]) => id.startsWith("coding-")),
    );
    const { error } = await learner.rpc("complete_diagnostic", {
      p_answers: answers(codingAnswers),
      p_attempt_id: attemptId,
    });
    expect(error).toBeNull();

    const [
      { data: attempt },
      { data: profile },
      { data: masteries },
      { data: responses },
    ] = await Promise.all([
      learner
        .from("diagnostic_attempts")
        .select("*")
        .eq("id", attemptId)
        .single(),
      learner
        .from("profiles")
        .select(
          "diagnostic_completed, diagnostic_completed_at, diagnostic_level",
        )
        .single(),
      learner.from("topic_mastery").select("*"),
      learner
        .from("diagnostic_responses")
        .select("*")
        .eq("diagnostic_attempt_id", attemptId),
    ]);
    expect(attempt).toMatchObject({
      coding_score: 100,
      overall_score: 100,
      placement_level: "independent",
      status: "completed",
    });
    expect(profile).toMatchObject({
      diagnostic_completed: true,
      diagnostic_level: "independent",
    });
    expect(profile?.diagnostic_completed_at).not.toBeNull();
    expect(responses).toHaveLength(11);
    expect(masteries?.length).toBeGreaterThanOrEqual(8);
    expect(masteries?.every((mastery) => mastery.total_attempts === 0)).toBe(
      true,
    );
    expect(
      masteries?.every((mastery) => mastery.diagnostic_score !== null),
    ).toBe(true);
    expect(masteries?.every((mastery) => mastery.overall_score < 100)).toBe(
      true,
    );
  });

  it("denies cross-user reads, direct writes, protected profile updates, and anonymous calls", async () => {
    expect((await other.from("diagnostic_attempts").select("*")).data).toEqual(
      [],
    );
    expect((await other.from("diagnostic_responses").select("*")).data).toEqual(
      [],
    );
    const { error: crossError } = await other.rpc("complete_diagnostic", {
      p_answers: [] as Json,
      p_attempt_id: attemptId,
    });
    expect(crossError).not.toBeNull();
    const { error: insertError } = await learner
      .from("diagnostic_attempts")
      .insert({
        assigned_coding_question_ids: ["coding-two-sum"],
        coding_tier: "foundation",
        concept_score: 0,
        pattern_score: 0,
        user_id: learnerId,
      });
    expect(insertError?.code).toBe("42501");
    const { error: profileError } = await other
      .from("profiles")
      .update({ diagnostic_completed: true })
      .eq("id", otherId);
    expect(profileError?.code).toBe("42501");
    const { error: anonymousError } = await anonymous.rpc("begin_diagnostic", {
      p_answers: [] as Json,
    });
    expect(anonymousError?.code).toBe("42501");
  });
});
