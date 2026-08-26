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

describe.sequential("atomic spaced repetition", () => {
  let admin: SupabaseClient<Database>;
  let learner: SupabaseClient<Database>;
  let other: SupabaseClient<Database>;
  let learnerId = "";
  let otherId = "";
  let problemId = "";
  let unscheduledProblemId = "";
  let topicId = "";

  beforeAll(async () => {
    const status = localStatus();
    const publicKey = status.PUBLISHABLE_KEY ?? status.ANON_KEY;
    const secretKey = status.SECRET_KEY ?? status.SERVICE_ROLE_KEY;
    if (!publicKey || !secretKey)
      throw new Error("Local API keys are missing.");
    admin = client(status.API_URL, secretKey);
    learner = client(status.API_URL, publicKey);
    other = client(status.API_URL, publicKey);
    const [first, second] = await Promise.all([
      learner.auth.signUp({
        email: `reviews-${randomUUID()}@example.com`,
        password: "ReviewPhase123",
      }),
      other.auth.signUp({
        email: `reviews-other-${randomUUID()}@example.com`,
        password: "ReviewPhase123",
      }),
    ]);
    if (!first.data.user || !second.data.user)
      throw new Error("Test users failed.");
    learnerId = first.data.user.id;
    otherId = second.data.user.id;
    const { data: problems, error } = await learner
      .from("problems")
      .select("id, primary_topic_id, external_id")
      .in("external_id", ["1", "2"])
      .order("external_id");
    if (error || !problems || problems.length !== 2)
      throw error ?? new Error("Problems missing.");
    const firstProblem = problems[0];
    const secondProblem = problems[1];
    if (!firstProblem || !secondProblem) throw new Error("Problems missing.");
    problemId = firstProblem.id;
    topicId = firstProblem.primary_topic_id;
    unscheduledProblemId = secondProblem.id;
  });

  afterAll(async () => {
    await Promise.all(
      [learnerId, otherId]
        .filter(Boolean)
        .map((id) => admin.auth.admin.deleteUser(id)),
    );
  });

  it("creates the initial five-day schedule in the completion transaction", async () => {
    const completedAt = "2026-08-26T10:00:00.000Z";
    await completeAttempt({
      completedAt,
      helpLevel: "small_hint",
      learner,
      mode: "practice",
      problemId,
      userId: learnerId,
    });

    const [{ data: review }, { data: topic }, { data: events }] =
      await Promise.all([
        learner
          .from("problem_reviews")
          .select("*")
          .eq("problem_id", problemId)
          .single(),
        learner
          .from("topic_mastery")
          .select("next_review_at")
          .eq("topic_id", topicId)
          .single(),
        learner
          .from("review_events")
          .select("attempt_mode, interval_days, quality_score"),
      ]);
    expect(review).toMatchObject({
      failure_streak: 0,
      interval_days: 5,
      repetition: 1,
    });
    expect(review?.next_review_at).toBe("2026-08-31T10:00:00+00:00");
    expect(topic?.next_review_at).toBe(review?.next_review_at);
    expect(events).toEqual([
      { attempt_mode: "practice", interval_days: 5, quality_score: 5 },
    ]);
  });

  it("allows a scheduled review and expands strong recall to fourteen days", async () => {
    await completeAttempt({
      completedAt: "2026-08-31T10:00:00.000Z",
      helpLevel: "none",
      learner,
      mode: "review",
      problemId,
      userId: learnerId,
    });

    const [{ data: review }, { data: history }] = await Promise.all([
      learner
        .from("problem_reviews")
        .select("*")
        .eq("problem_id", problemId)
        .single(),
      learner
        .from("review_events")
        .select("attempt_mode, interval_days, repetition")
        .eq("attempt_mode", "review")
        .single(),
    ]);
    expect(review).toMatchObject({
      failure_streak: 0,
      interval_days: 14,
      repetition: 2,
    });
    expect(history).toMatchObject({
      attempt_mode: "review",
      interval_days: 14,
      repetition: 2,
    });
  });

  it("keeps schedules private, read-only, and rejects unscheduled review mode", async () => {
    expect((await other.from("problem_reviews").select("*")).data).toEqual([]);
    expect((await other.from("review_events").select("*")).data).toEqual([]);

    const { error: forgedSchedule } = await learner
      .from("problem_reviews")
      .insert({
        easiness_factor: 2.5,
        interval_days: 7,
        last_performance_score: 1,
        next_review_at: new Date().toISOString(),
        problem_id: unscheduledProblemId,
        user_id: learnerId,
      });
    expect(forgedSchedule?.code).toBe("42501");

    const { error: unscheduledReview } = await learner.from("attempts").insert({
      mode: "review",
      problem_id: unscheduledProblemId,
      user_id: learnerId,
    });
    expect(unscheduledReview?.code).toBe("42501");
  });
});

async function completeAttempt({
  completedAt,
  helpLevel,
  learner,
  mode,
  problemId,
  userId,
}: {
  completedAt: string;
  helpLevel: "none" | "small_hint";
  learner: SupabaseClient<Database>;
  mode: "practice" | "review";
  problemId: string;
  userId: string;
}) {
  const { data: attempt, error } = await learner
    .from("attempts")
    .insert({ mode, problem_id: problemId, user_id: userId })
    .select("id")
    .single();
  if (error) throw error;
  if (helpLevel === "small_hint") {
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
      completed_at: completedAt,
      complexity_correct: true,
      confidence_after: 5,
      duration_seconds: 90,
      phase: "completed",
      recognized_pattern_correctly: true,
      result: "solved",
      status: "completed",
    })
    .eq("id", attempt.id);
  if (completionError) throw completionError;
}
