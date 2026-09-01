import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { buildInterviewEvidencePackage } from "../../src/features/interview-evaluation/evidence-model";
import type { Problem } from "../../src/features/problems/model";
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
  const problemIdsByDifficulty = new Map<string, string>();
  let interviewId = "";
  let lastAbandonedInterviewId = "";
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
    // PostgREST can observe a just-issued local JWT one clock tick before Auth.
    await new Promise((resolve) => setTimeout(resolve, 1_100));
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
    const { data: problems } = await learner
      .from("problems")
      .select("id, difficulty")
      .eq("active", true)
      .in("difficulty", ["easy", "medium", "hard"]);
    for (const problem of problems ?? []) {
      if (!problemIdsByDifficulty.has(problem.difficulty)) {
        problemIdsByDifficulty.set(problem.difficulty, problem.id);
      }
    }
    problemId = problemIdsByDifficulty.get("easy") ?? "";
    if (
      !problemId ||
      !problemIdsByDifficulty.has("medium") ||
      !problemIdsByDifficulty.has("hard")
    ) {
      throw new Error("Interview inventory is missing a difficulty.");
    }
  });

  afterAll(async () => {
    await Promise.all(
      [learnerId, otherId]
        .filter(Boolean)
        .map((id) => admin.auth.admin.deleteUser(id)),
    );
  });

  it("accepts every difficulty, duration, and interviewer-level combination", async () => {
    for (const difficulty of ["adaptive", "easy", "medium", "hard"] as const) {
      for (const durationMinutes of [30, 45, 60] as const) {
        for (const interviewerLevel of ["beginner", "faang_tough"] as const) {
          for (const interviewLanguage of [
            "auto",
            "english",
            "hebrew",
          ] as const) {
            const selectedProblemId =
              difficulty === "adaptive"
                ? problemId
                : problemIdsByDifficulty.get(difficulty)!;
            const { data, error } = await learner.rpc("start_mock_interview", {
              p_difficulty_mode: difficulty,
              p_duration_minutes: durationMinutes,
              p_interview_language: interviewLanguage,
              p_interviewer_level: interviewerLevel,
              p_problem_id: selectedProblemId,
            });
            expect(
              error,
              `${difficulty}/${durationMinutes}/${interviewerLevel}/${interviewLanguage}`,
            ).toBeNull();
            lastAbandonedInterviewId = data!;
            const { error: abandonError } = await learner.rpc(
              "abandon_mock_interview",
              { p_mock_interview_id: data! },
            );
            expect(abandonError).toBeNull();
          }
        }
      }
    }
  });

  it("starts one private mandatory-timer session", async () => {
    expect(
      (
        await learner.rpc("start_mock_interview", {
          p_difficulty_mode: "easy",
          p_duration_minutes: 45,
          p_interviewer_level: "unknown",
          p_problem_id: problemId,
        })
      ).error,
    ).not.toBeNull();
    const { data, error } = await learner.rpc("start_mock_interview", {
      p_difficulty_mode: "easy",
      p_duration_minutes: 45,
      p_interview_language: "hebrew",
      p_interviewer_level: "faang_tough",
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
      interview_language: "hebrew",
      interviewer_level: "faang_tough",
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
    const { data: realtimeSession } = await learner
      .from("realtime_interview_sessions")
      .select("status, summary, ended_at")
      .eq("id", realtimeSessionId)
      .single();
    expect(realtimeSession?.status).toBe("completed");
    expect(realtimeSession?.ended_at).not.toBeNull();
    expect(realtimeSession?.summary).toContain("1 learner turns");
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

  it("persists one immutable, ownership-scoped evaluation version", async () => {
    const { error: abandonedError } = await learner.rpc(
      "reserve_mock_interview_evaluation",
      {
        p_evaluation_version: 1,
        p_evidence_version: 1,
        p_mock_interview_id: lastAbandonedInterviewId,
        p_model: "deterministic-v1",
        p_provider: "deterministic",
      },
    );
    expect(abandonedError).not.toBeNull();

    const { data: reservationValue, error: reservationError } =
      await learner.rpc("reserve_mock_interview_evaluation", {
        p_evaluation_version: 1,
        p_evidence_version: 1,
        p_mock_interview_id: interviewId,
        p_model: "deterministic-v1",
        p_provider: "deterministic",
      });
    expect(reservationError).toBeNull();
    const reservation = reservationValue as {
      evaluationId: string;
      shouldEvaluate: boolean;
      status: string;
      version: number;
    };
    expect(reservation).toMatchObject({
      shouldEvaluate: true,
      status: "pending",
      version: 1,
    });

    const invalidFinalize = await learner.rpc(
      "finalize_mock_interview_evaluation",
      {
        p_confidence: 0.3,
        p_dimensions: {} as Json,
        p_error_code: "",
        p_evaluation_id: reservation.evaluationId,
        p_evidence_coverage: { semanticCorrectness: "unsupported" } as Json,
        p_improvements: ["Practice testing with boundary cases."],
        p_input_tokens: 0,
        p_output_tokens: 0,
        p_raw_score: 60,
        p_recommended_actions: [
          { actionType: "testing_drill", title: "Test boundaries" },
        ] as Json,
        p_recurring_signals: [],
        p_status: "provisional",
        p_strengths: [],
        p_summary:
          "A provisional evaluation with intentionally invalid dimensions.",
        p_total_tokens: 0,
      },
    );
    expect(invalidFinalize.error).not.toBeNull();

    const dimensions = interviewEvaluationDimensions();
    const { error: finalizeError } = await learner.rpc(
      "finalize_mock_interview_evaluation",
      {
        p_confidence: 0.3,
        p_dimensions: dimensions,
        p_error_code: "provider_unconfigured",
        p_evaluation_id: reservation.evaluationId,
        p_evidence_coverage: {
          hasTrustedTests: false,
          semanticCorrectness: "unsupported",
        } as Json,
        p_improvements: ["Practice testing with boundary cases."],
        p_input_tokens: 0,
        p_output_tokens: 0,
        p_raw_score: 60,
        p_recommended_actions: [
          {
            actionType: "testing_drill",
            estimatedMinutes: 15,
            priority: 1,
            rationale: "Testing evidence was limited in this interview.",
            target: "testing",
            title: "Test boundary cases",
          },
        ] as Json,
        p_recurring_signals: [],
        p_status: "provisional",
        p_strengths: ["Recorded an optimization path."],
        p_summary:
          "This provisional evaluation uses bounded deterministic interview evidence.",
        p_total_tokens: 0,
      },
    );
    expect(finalizeError).toBeNull();

    const { data: evaluation } = await learner
      .from("mock_interview_evaluations")
      .select("*")
      .eq("id", reservation.evaluationId)
      .single();
    expect(evaluation).toMatchObject({
      confidence: 0.3,
      error_code: "provider_unconfigured",
      is_current: true,
      raw_score: 60,
      source_difficulty: "easy",
      source_duration_minutes: 45,
      source_interviewer_level: "faang_tough",
      status: "provisional",
      version: 1,
    });
    expect(evaluation?.dimensions).toEqual(dimensions);

    const secondFinalize = await learner.rpc(
      "finalize_mock_interview_evaluation",
      {
        p_confidence: 0.3,
        p_dimensions: dimensions,
        p_error_code: "provider_unconfigured",
        p_evaluation_id: reservation.evaluationId,
        p_evidence_coverage: {} as Json,
        p_improvements: ["Practice testing with boundary cases."],
        p_input_tokens: 0,
        p_output_tokens: 0,
        p_raw_score: 60,
        p_recommended_actions: [{ title: "Repeat" }] as Json,
        p_recurring_signals: [],
        p_status: "provisional",
        p_strengths: [],
        p_summary: "Attempt to replace an immutable completed evaluation.",
        p_total_tokens: 0,
      },
    );
    expect(secondFinalize.error).not.toBeNull();

    const { data: secondReservation } = await learner.rpc(
      "reserve_mock_interview_evaluation",
      {
        p_evaluation_version: 1,
        p_evidence_version: 1,
        p_mock_interview_id: interviewId,
        p_model: "deterministic-v1",
        p_provider: "deterministic",
      },
    );
    expect(secondReservation).toMatchObject({
      evaluationId: reservation.evaluationId,
      shouldEvaluate: false,
      status: "provisional",
      version: 1,
    });
    expect(
      (await other.from("mock_interview_evaluations").select("*")).data,
    ).toEqual([]);
  });

  it("assembles canonical evidence from completed learner-owned rows", async () => {
    const [interviewResult, problemResult, sessionResult, eventsResult] =
      await Promise.all([
        learner
          .from("mock_interviews")
          .select("*")
          .eq("id", interviewId)
          .single(),
        learner.from("problems").select("*").eq("id", problemId).single(),
        learner
          .from("realtime_interview_sessions")
          .select("*")
          .eq("mock_interview_id", interviewId)
          .maybeSingle(),
        learner
          .from("realtime_interview_events")
          .select("*")
          .eq("session_id", realtimeSessionId)
          .order("id"),
      ]);
    expect(interviewResult.error).toBeNull();
    expect(problemResult.error).toBeNull();
    const { data: primaryTopic, error: topicError } = await learner
      .from("topics")
      .select("*")
      .eq("id", problemResult.data!.primary_topic_id)
      .single();
    expect(topicError).toBeNull();

    const evidence = buildInterviewEvidencePackage({
      assembledAt: new Date(),
      interview: interviewResult.data!,
      problem: {
        ...problemResult.data!,
        prerequisiteTopics: [],
        primaryTopic: primaryTopic!,
        secondaryTopics: [],
      } satisfies Problem,
      questionContent: null,
      realtimeEvents: eventsResult.data ?? [],
      realtimeSession: sessionResult.data,
    });
    expect(evidence).toMatchObject({
      interview: { id: interviewId },
      learnerOutcome: { result: "partial" },
      version: 2,
    });
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
        interview_language: "hebrew",
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
    const { error: directEvaluationError } = await learner
      .from("mock_interview_evaluations")
      .insert({
        evaluation_version: 1,
        evidence_version: 1,
        mock_interview_id: interviewId,
        model: "forged",
        provider: "forged",
        source_difficulty: "easy",
        source_duration_minutes: 45,
        source_interviewer_level: "faang_tough",
        user_id: learnerId,
        version: 2,
      });
    expect(directEvaluationError?.code).toBe("42501");
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

function interviewEvaluationDimensions(): Json {
  return Object.fromEntries(
    [
      "problemUnderstanding",
      "clarification",
      "approachQuality",
      "optimization",
      "correctness",
      "codeQuality",
      "testing",
      "complexityReasoning",
      "communication",
      "independence",
    ].map((dimension) => [
      dimension,
      {
        confidence: dimension === "correctness" ? 0.25 : 0.4,
        evidence: [
          {
            reference: `Saved ${dimension} phase evidence.`,
            source: "phase_note",
          },
        ],
        rationale: `Bounded saved evidence supports the ${dimension} score provisionally.`,
        score: 3,
      },
    ]),
  ) as Json;
}
