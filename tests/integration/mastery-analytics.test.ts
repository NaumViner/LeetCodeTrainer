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

describe.sequential("atomic attempt performance and mastery", () => {
  let admin: SupabaseClient<Database>;
  let anonymous: SupabaseClient<Database>;
  let learner: SupabaseClient<Database>;
  let other: SupabaseClient<Database>;
  let learnerId = "";
  let otherId = "";
  let problemId = "";
  let topicId = "";

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
        email: `mastery-${randomUUID()}@example.com`,
        password: "MasteryPhase123",
      }),
      other.auth.signUp({
        email: `mastery-other-${randomUUID()}@example.com`,
        password: "MasteryPhase123",
      }),
    ]);
    if (!first.data.user || !second.data.user)
      throw new Error("Test users failed.");
    learnerId = first.data.user.id;
    otherId = second.data.user.id;
    const { data: problem, error } = await learner
      .from("problems")
      .select("id, primary_topic_id")
      .eq("external_id", "1")
      .single();
    if (error) throw error;
    problemId = problem.id;
    topicId = problem.primary_topic_id;
  });

  afterAll(async () => {
    await Promise.all(
      [learnerId, otherId]
        .filter(Boolean)
        .map((id) => admin.auth.admin.deleteUser(id)),
    );
  });

  it("creates a performance snapshot and uncertain first mastery atomically", async () => {
    const attemptId = await completeAttempt(
      learner,
      learnerId,
      problemId,
      true,
    );
    const [{ data: performance }, { data: mastery }] = await Promise.all([
      learner
        .from("attempt_performance")
        .select("*")
        .eq("attempt_id", attemptId)
        .single(),
      learner
        .from("topic_mastery")
        .select("*")
        .eq("topic_id", topicId)
        .single(),
    ]);
    expect(performance).toMatchObject({
      complexity_score: 1,
      correctness_score: 1,
      independence_score: 0.9,
      overall_score: 0.92,
      recognition_score: 1,
      retention_score: 0.5,
      speed_score: 1,
    });
    expect(mastery).toMatchObject({
      independent_solves: 0,
      overall_score: 54.95,
      retention_score: 40.25,
      total_attempts: 1,
    });
    expect(mastery!.overall_score).toBeLessThan(100);
  });

  it("uses repeat evidence to improve retention and smoothed mastery", async () => {
    const attemptId = await completeAttempt(
      learner,
      learnerId,
      problemId,
      false,
    );
    const [{ data: performance }, { data: mastery }] = await Promise.all([
      learner
        .from("attempt_performance")
        .select("retention_score, overall_score")
        .eq("attempt_id", attemptId)
        .single(),
      learner
        .from("topic_mastery")
        .select(
          "overall_score, retention_score, total_attempts, independent_solves",
        )
        .eq("topic_id", topicId)
        .single(),
    ]);
    expect(performance).toMatchObject({ overall_score: 1, retention_score: 1 });
    expect(mastery).toMatchObject({
      independent_solves: 1,
      overall_score: 68.47,
      retention_score: 58.18,
      total_attempts: 2,
    });
  });

  it("keeps analytics private and read-only", async () => {
    expect((await other.from("topic_mastery").select("*")).data).toEqual([]);
    expect((await other.from("attempt_performance").select("*")).data).toEqual(
      [],
    );
    const { data, error } = await anonymous.from("topic_mastery").select("*");
    expect(data).toBeNull();
    expect(error?.code).toBe("42501");
    const { error: insertError } = await learner.from("topic_mastery").insert({
      complexity_score: 100,
      correctness_score: 100,
      independence_score: 100,
      overall_score: 100,
      recognition_score: 100,
      retention_score: 100,
      speed_score: 100,
      topic_id: topicId,
      user_id: learnerId,
    });
    expect(insertError?.code).toBe("42501");
  });
});

async function completeAttempt(
  learner: SupabaseClient<Database>,
  userId: string,
  problemId: string,
  useSmallHint: boolean,
) {
  const { data: attempt, error } = await learner
    .from("attempts")
    .insert({ problem_id: problemId, user_id: userId })
    .select("id")
    .single();
  if (error) throw error;
  if (useSmallHint) {
    const { error: hintError } = await learner.from("attempt_hints").insert({
      attempt_id: attempt.id,
      content: "What repeated lookup work could you avoid?",
      help_level: "small_hint",
      ordinal: 1,
      title: "Socratic question",
    });
    if (hintError) throw hintError;
  }
  for (const phase of [
    "planning",
    "coding",
    "testing",
    "reflection",
  ] as const) {
    const { error: phaseError } = await learner
      .from("attempts")
      .update({ phase })
      .eq("id", attempt.id);
    if (phaseError) throw phaseError;
  }
  const { error: completionError } = await learner
    .from("attempts")
    .update({
      completed_at: new Date().toISOString(),
      complexity_correct: true,
      duration_seconds: 90,
      phase: "completed",
      recognized_pattern_correctly: true,
      result: "solved",
      status: "completed",
    })
    .eq("id", attempt.id);
  if (completionError) throw completionError;
  return attempt.id;
}
