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

describe.sequential("practice attempt persistence and isolation", () => {
  let admin: SupabaseClient<Database>;
  let anonymous: SupabaseClient<Database>;
  let learner: SupabaseClient<Database>;
  let otherLearner: SupabaseClient<Database>;
  let learnerId = "";
  let otherLearnerId = "";
  let attemptId = "";
  let problemId = "";

  beforeAll(async () => {
    const status = localStatus();
    const publicKey = status.PUBLISHABLE_KEY ?? status.ANON_KEY;
    const secretKey = status.SECRET_KEY ?? status.SERVICE_ROLE_KEY;
    if (!publicKey || !secretKey)
      throw new Error("Local API keys are missing.");

    admin = client(status.API_URL, secretKey);
    anonymous = client(status.API_URL, publicKey);
    learner = client(status.API_URL, publicKey);
    otherLearner = client(status.API_URL, publicKey);
    const password = "PracticePhase123";
    const [first, second] = await Promise.all([
      learner.auth.signUp({
        email: "practice-" + randomUUID() + "@example.com",
        password,
      }),
      otherLearner.auth.signUp({
        email: "practice-other-" + randomUUID() + "@example.com",
        password,
      }),
    ]);
    if (!first.data.user || !second.data.user)
      throw new Error("Test users failed.");
    learnerId = first.data.user.id;
    otherLearnerId = second.data.user.id;

    const { data: problem, error } = await learner
      .from("problems")
      .select("id")
      .eq("external_id", "1")
      .single();
    if (error) throw error;
    problemId = problem.id;
  });

  afterAll(async () => {
    await Promise.all(
      [learnerId, otherLearnerId]
        .filter(Boolean)
        .map((id) => admin.auth.admin.deleteUser(id)),
    );
  });

  it("starts one resumable attempt and persists planning and timer state", async () => {
    const { data, error } = await learner
      .from("attempts")
      .insert({ problem_id: problemId, user_id: learnerId })
      .select("*")
      .single();

    expect(error).toBeNull();
    attemptId = data!.id;

    const { error: duplicateError } = await learner.from("attempts").insert({
      problem_id: problemId,
      user_id: learnerId,
    });
    expect(duplicateError?.code).toBe("23505");

    const timerStartedAt = new Date().toISOString();
    const { error: updateError } = await learner
      .from("attempts")
      .update({
        brute_force_approach: "Compare every pair.",
        brute_force_complexity: "O(n^2)",
        confidence_before: 3,
        duration_seconds: 12,
        phase: "planning",
        predicted_pattern: "hash map",
        timer_running: true,
        timer_started_at: timerStartedAt,
      })
      .eq("id", attemptId);
    expect(updateError).toBeNull();

    const { data: persisted } = await learner
      .from("attempts")
      .select("phase, predicted_pattern, duration_seconds, timer_running")
      .eq("id", attemptId)
      .single();
    expect(persisted).toMatchObject({
      duration_seconds: 12,
      phase: "planning",
      predicted_pattern: "hash map",
      timer_running: true,
    });
  });

  it("records progressive help and automatically raises assistance", async () => {
    const { data: hint, error } = await learner
      .from("attempt_hints")
      .insert({
        attempt_id: attemptId,
        content: "What repeated lookup work could you avoid?",
        help_level: "small_hint",
        ordinal: 1,
        title: "Socratic question",
      })
      .select("ordinal")
      .single();
    expect(error).toBeNull();
    expect(hint?.ordinal).toBe(1);

    const { data: attempt } = await learner
      .from("attempts")
      .select("help_level")
      .eq("id", attemptId)
      .single();
    expect(attempt?.help_level).toBe("small_hint");
  });

  it("accounts for private AI coach usage and enforces the daily limit", async () => {
    const { data: interactionId, error: reserveError } = await learner.rpc(
      "reserve_ai_coach_interaction",
      {
        p_attempt_id: attemptId,
        p_interaction_type: "pattern_analysis",
        p_model: "test-model",
        p_provider: "openai",
      },
    );
    expect(reserveError).toBeNull();
    const response = {
      feedback: "The prediction is supported by the lookup signal.",
      nextStep: "State the invariant.",
      question: "What work does the map avoid?",
      verdict: "correct",
    } as Json;
    const { error: finishError } = await learner.rpc(
      "finish_ai_coach_interaction",
      {
        p_error_code: undefined,
        p_input_tokens: 20,
        p_interaction_id: interactionId!,
        p_output_tokens: 10,
        p_response: response,
        p_status: "completed",
        p_total_tokens: 30,
      },
    );
    expect(finishError).toBeNull();
    const { data: ownRows } = await learner
      .from("ai_coach_interactions")
      .select("status, total_tokens, response");
    expect(ownRows).toEqual([
      expect.objectContaining({ status: "completed", total_tokens: 30 }),
    ]);
    expect(
      (await otherLearner.from("ai_coach_interactions").select("id")).data,
    ).toEqual([]);
    expect(
      (
        await learner.from("ai_coach_interactions").insert({
          attempt_id: attemptId,
          interaction_type: "hint",
          model: "forged",
          provider: "openai",
          user_id: learnerId,
        })
      ).error?.code,
    ).toBe("42501");

    for (let count = 1; count < 20; count += 1) {
      const { error } = await learner.rpc("reserve_ai_coach_interaction", {
        p_attempt_id: attemptId,
        p_interaction_type: "hint",
        p_model: "test-model",
        p_provider: "openai",
      });
      expect(error, `reservation ${count + 1}`).toBeNull();
    }
    expect(
      (
        await learner.rpc("reserve_ai_coach_interaction", {
          p_attempt_id: attemptId,
          p_interaction_type: "hint",
          p_model: "test-model",
          p_provider: "openai",
        })
      ).error,
    ).not.toBeNull();
  });

  it("prevents anonymous and cross-learner access", async () => {
    const { data: anonymousRows, error: anonymousError } = await anonymous
      .from("attempts")
      .select("id");
    expect(anonymousRows).toBeNull();
    expect(anonymousError?.code).toBe("42501");

    const { data: otherRows } = await otherLearner
      .from("attempts")
      .select("id")
      .eq("id", attemptId);
    expect(otherRows).toEqual([]);

    const { error: forgedInsertError } = await otherLearner
      .from("attempts")
      .insert({ problem_id: problemId, user_id: learnerId });
    expect(forgedInsertError?.code).toBe("42501");

    const { data: changedRows } = await otherLearner
      .from("attempts")
      .update({ predicted_pattern: "forged" })
      .eq("id", attemptId)
      .select("id");
    expect(changedRows).toEqual([]);
  });

  it("atomically finalizes the structured reflection", async () => {
    const { error: skippedPhaseError } = await learner
      .from("attempts")
      .update({ phase: "reflection" })
      .eq("id", attemptId);
    expect(skippedPhaseError?.code).toBe("P0001");

    for (const phase of ["coding", "testing"] as const) {
      const { error: phaseError } = await learner
        .from("attempts")
        .update({ phase })
        .eq("id", attemptId);
      expect(phaseError).toBeNull();
    }
    const { error: reflectionError } = await learner
      .from("attempts")
      .update({
        duration_seconds: 90,
        phase: "reflection",
        timer_running: false,
        timer_started_at: null,
      })
      .eq("id", attemptId);
    expect(reflectionError).toBeNull();

    const { error } = await learner
      .from("attempts")
      .update({
        code_snapshot: "function twoSum() { return []; }",
        completed_at: new Date().toISOString(),
        complexity_correct: true,
        confidence_after: 4,
        correct_pattern: "hash map",
        duration_seconds: 90,
        edge_cases_missed: ["duplicate values"],
        mistakes: ["looked for indices too late"],
        phase: "completed",
        recognized_pattern_correctly: true,
        result: "solved",
        status: "completed",
        submitted_space_complexity: "O(n)",
        submitted_time_complexity: "O(n)",
        takeaway: "Store each value before checking the next one.",
        timer_running: false,
        timer_started_at: null,
      })
      .eq("id", attemptId);
    expect(error).toBeNull();

    const { data } = await learner
      .from("attempts")
      .select("*")
      .eq("id", attemptId)
      .single();
    expect(data).toMatchObject({
      duration_seconds: 90,
      help_level: "small_hint",
      phase: "completed",
      result: "solved",
      status: "completed",
      takeaway: "Store each value before checking the next one.",
    });
  });
});
