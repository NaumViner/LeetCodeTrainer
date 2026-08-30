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

async function completeDiagnostic(client: SupabaseClient<Database>) {
  const { data: attemptId, error: beginError } = await client.rpc(
    "begin_diagnostic",
    {
      p_answers: [
        { answer: "d", question_id: "concept-complexity" },
        { answer: "a", question_id: "concept-hash-map" },
        { answer: "a", question_id: "concept-recursion" },
        { answer: "b", question_id: "concept-trees" },
        { answer: "a", question_id: "concept-graphs" },
        { answer: "b", question_id: "pattern-pair-sum" },
        { answer: "c", question_id: "pattern-contiguous" },
        { answer: "a", question_id: "pattern-shortest-path" },
      ] as Json,
    },
  );
  if (beginError || !attemptId)
    throw beginError ?? new Error("Diagnostic start failed.");
  const { error } = await client.rpc("complete_diagnostic", {
    p_answers: [
      { answer: "c", question_id: "coding-binary-search" },
      { answer: "a", question_id: "coding-tree-depth" },
    ] as Json,
    p_attempt_id: attemptId,
  });
  if (error) throw error;
}

describe.sequential("mock interview lifecycle and isolation", () => {
  let admin: SupabaseClient<Database>;
  let anonymous: SupabaseClient<Database>;
  let learner: SupabaseClient<Database>;
  let other: SupabaseClient<Database>;
  let learnerId = "";
  let otherId = "";
  let problemId = "";
  let interviewId = "";
  let realtimeSessionId = "";

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
        email: `interview-${randomUUID()}@example.com`,
        password: "Interview123",
      }),
      other.auth.signUp({
        email: `interview-other-${randomUUID()}@example.com`,
        password: "Interview123",
      }),
    ]);
    if (!first.data.user || !second.data.user)
      throw new Error("Test users failed.");
    learnerId = first.data.user.id;
    otherId = second.data.user.id;
    const setupResults = await Promise.all([
      learner
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("id", learnerId),
      other
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("id", otherId),
    ]);
    const setupError = setupResults.find((result) => result.error)?.error;
    if (setupError) throw setupError;
    await Promise.all([completeDiagnostic(learner), completeDiagnostic(other)]);
    const { data: problem } = await learner
      .from("problems")
      .select("id")
      .eq("difficulty", "easy")
      .limit(1)
      .single();
    if (!problem) throw new Error("Interview problem is missing.");
    problemId = problem.id;
  });

  afterAll(async () => {
    await Promise.all(
      [learnerId, otherId]
        .filter(Boolean)
        .map((id) => admin.auth.admin.deleteUser(id)),
    );
  });

  it("starts one private mandatory-timer session", async () => {
    const { data, error } = await learner.rpc("start_mock_interview", {
      p_difficulty_mode: "easy",
      p_duration_minutes: 45,
      p_problem_id: problemId,
    });
    expect(error).toBeNull();
    interviewId = data!;
    const { data: interview } = await learner
      .from("mock_interviews")
      .select("*")
      .eq("id", interviewId)
      .single();
    expect(interview).toMatchObject({
      duration_minutes: 45,
      phase: "intro",
      status: "active",
      timer_running: true,
      user_id: learnerId,
    });
    expect(
      (
        await learner.rpc("start_mock_interview", {
          p_difficulty_mode: "easy",
          p_duration_minutes: 45,
          p_problem_id: problemId,
        })
      ).error,
    ).not.toBeNull();
    const { error: overlappingPracticeError } = await learner
      .from("attempts")
      .insert({ problem_id: problemId, user_id: learnerId });
    expect(overlappingPracticeError).not.toBeNull();
  });

  it("persists a private realtime transcript and code context", async () => {
    const { data: sessionId, error: sessionError } = await learner.rpc(
      "begin_realtime_interview_session",
      {
        p_mock_interview_id: interviewId,
        p_model: "gpt-realtime",
        p_provider: "openai",
        p_provider_call_id: "rtc_test",
      },
    );
    expect(sessionError).toBeNull();
    realtimeSessionId = sessionId!;
    for (const [eventType, phase, content] of [
      ["user_transcript", "intro", "I will clarify the constraints."],
      ["assistant_transcript", "intro", "What assumptions would you check?"],
      ["code_snapshot", "implementation", "function solve() { return 1; }"],
    ] as const) {
      const { error } = await learner.rpc("append_realtime_interview_event", {
        p_content: content,
        p_event_type: eventType,
        p_mock_interview_id: interviewId,
        p_phase: phase,
      });
      expect(error, eventType).toBeNull();
    }
    const { data: events } = await learner
      .from("realtime_interview_events")
      .select("event_type, content")
      .eq("session_id", realtimeSessionId)
      .order("id");
    expect(events?.map((event) => event.event_type)).toEqual([
      "user_transcript",
      "assistant_transcript",
      "code_snapshot",
    ]);
    expect(
      (await other.from("realtime_interview_sessions").select("*")).data,
    ).toEqual([]);
    expect(
      (await other.from("realtime_interview_events").select("*")).data,
    ).toEqual([]);
  });

  it("rejects phase skipping and persists every ordered stage", async () => {
    const skip = await learner.rpc("advance_mock_interview", {
      p_elapsed_seconds: 1,
      p_mock_interview_id: interviewId,
      p_payload: {} as Json,
      p_target_phase: "optimization",
    });
    expect(skip.error).not.toBeNull();

    const steps = [
      ["clarify", {}],
      ["examples", { notes: "What are the constraints?" }],
      ["brute_force", { notes: "Example and expected output" }],
      ["optimization", { notes: "Try every possible candidate" }],
      [
        "implementation",
        { notes: "Maintain one invariant and remove repeated work" },
      ],
      ["testing", { notes: "function solve(input) { return input; }" }],
      ["complexity", { notes: "Test empty and ordinary input" }],
      ["retrospective", { spaceComplexity: "O(1)", timeComplexity: "O(n)" }],
    ] as const;
    for (const [index, [target, payload]] of steps.entries()) {
      const { error } = await learner.rpc("advance_mock_interview", {
        p_elapsed_seconds: index + 2,
        p_mock_interview_id: interviewId,
        p_payload: payload as Json,
        p_target_phase: target,
      });
      expect(error, target).toBeNull();
    }
    const { data: interview } = await learner
      .from("mock_interviews")
      .select("phase, timer_running, code_snapshot")
      .eq("id", interviewId)
      .single();
    expect(interview).toMatchObject({
      code_snapshot: "function solve(input) { return input; }",
      phase: "retrospective",
      timer_running: false,
    });
    const { data: realtimeSession } = await learner
      .from("realtime_interview_sessions")
      .select("status, summary, ended_at")
      .eq("id", realtimeSessionId)
      .single();
    expect(realtimeSession?.status).toBe("completed");
    expect(realtimeSession?.ended_at).not.toBeNull();
    expect(realtimeSession?.summary).toContain("1 learner turns");
  });

  it("creates a deterministic scorecard and feeds weakness into mastery", async () => {
    const { data: problem } = await learner
      .from("problems")
      .select("primary_topic_id")
      .eq("id", problemId)
      .single();
    const { data: beforeMastery } = await learner
      .from("topic_mastery")
      .select("overall_score")
      .eq("topic_id", problem!.primary_topic_id)
      .single();
    const { error } = await learner.rpc("complete_mock_interview", {
      p_code_quality_rating: 2,
      p_communication_rating: 2,
      p_complexity_rating: 2,
      p_elapsed_seconds: 12,
      p_independence_rating: 2,
      p_mock_interview_id: interviewId,
      p_result: "partial",
      p_retrospective: "I changed direction before validating the invariant.",
    });
    expect(error).toBeNull();
    const [{ data: interview }, { data: scorecard }] = await Promise.all([
      learner
        .from("mock_interviews")
        .select("*")
        .eq("id", interviewId)
        .single(),
      learner
        .from("mock_interview_scorecards")
        .select("*")
        .eq("mock_interview_id", interviewId)
        .single(),
    ]);
    expect(interview).toMatchObject({
      phase: "completed",
      result: "partial",
      status: "completed",
      timer_running: false,
    });
    expect(scorecard?.overall_score).toBeLessThan(60);
    expect(scorecard?.improvements.length).toBeGreaterThan(0);
    const { data: mastery } = await learner
      .from("topic_mastery")
      .select("mock_interview_count, last_interviewed_at, overall_score")
      .eq("topic_id", scorecard!.topic_id)
      .single();
    expect(mastery?.mock_interview_count).toBe(1);
    expect(mastery?.last_interviewed_at).not.toBeNull();
    expect(mastery?.overall_score).toBeLessThan(beforeMastery!.overall_score);
  });

  it("denies anonymous, cross-user, and direct browser access", async () => {
    expect((await other.from("mock_interviews").select("*")).data).toEqual([]);
    expect(
      (await other.from("mock_interview_scorecards").select("*")).data,
    ).toEqual([]);
    const { error: crossError } = await other.rpc("abandon_mock_interview", {
      p_mock_interview_id: interviewId,
    });
    expect(crossError).not.toBeNull();
    const { error: directError } = await learner
      .from("mock_interviews")
      .insert({
        difficulty_mode: "easy",
        duration_minutes: 45,
        problem_id: problemId,
        user_id: learnerId,
      });
    expect(directError?.code).toBe("42501");
    const { error: directRealtimeError } = await learner
      .from("realtime_interview_events")
      .insert({
        content: "forged",
        event_type: "connection",
        phase: "intro",
        session_id: realtimeSessionId,
        user_id: learnerId,
      });
    expect(directRealtimeError?.code).toBe("42501");
    const { error: anonymousError } = await anonymous.rpc(
      "start_mock_interview",
      {
        p_difficulty_mode: "easy",
        p_duration_minutes: 45,
        p_problem_id: problemId,
      },
    );
    expect(anonymousError?.code).toBe("42501");
  });
});
