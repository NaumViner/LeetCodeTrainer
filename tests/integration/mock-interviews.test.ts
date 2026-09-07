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
  let problemTopicId = "";
  const problemIdsByDifficulty = new Map<string, string>();
  let interviewId = "";
  let interviewerTranscriptEventId = 0;
  let introEvidenceEventId = 0;
  let lastAbandonedInterviewId = "";
  let masteryBeforeCompletedInterview: number | null = null;
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
      .select("id, difficulty, primary_topic_id")
      .eq("active", true)
      .eq("interview_ready", true)
      .in("difficulty", ["easy", "medium", "hard"]);
    for (const problem of problems ?? []) {
      if (!problemIdsByDifficulty.has(problem.difficulty)) {
        problemIdsByDifficulty.set(problem.difficulty, problem.id);
        if (problem.difficulty === "easy") {
          problemTopicId = problem.primary_topic_id;
        }
      }
    }
    problemId = problemIdsByDifficulty.get("easy") ?? "";
    if (
      !problemId ||
      !problemTopicId ||
      !problemIdsByDifficulty.has("medium") ||
      !problemIdsByDifficulty.has("hard")
    ) {
      throw new Error("Interview inventory is missing a difficulty.");
    }
  });

  it("publishes the canonical NeetCode 150 collection", async () => {
    const { data: collection, error } = await anonymous
      .from("problem_collections")
      .select("*")
      .eq("slug", "neetcode-150")
      .eq("active", true)
      .single();
    expect(error).toBeNull();
    expect(collection).toMatchObject({
      expected_primary_topic_count: 18,
      expected_problem_count: 150,
      version: 1,
    });

    const {
      count,
      data: memberships,
      error: membershipError,
    } = await anonymous
      .from("problem_collection_memberships")
      .select("primary_topic_id", { count: "exact" })
      .eq("collection_id", collection!.id);
    expect(membershipError).toBeNull();
    expect(count).toBe(150);
    expect(
      new Set((memberships ?? []).map((item) => item.primary_topic_id)).size,
    ).toBe(18);

    const { data: readyProblems, error: readyError } = await anonymous
      .from("problems")
      .select(
        "interview_content_provenance, interview_content_version, primary_topic_id, slug",
      )
      .eq("interview_ready", true);
    expect(readyError).toBeNull();
    expect(readyProblems).toHaveLength(18);
    expect(
      new Set((readyProblems ?? []).map((item) => item.primary_topic_id)).size,
    ).toBe(18);
    expect(readyProblems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          interview_content_provenance: "first_party",
          interview_content_version: 1,
        }),
      ]),
    );
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

  it("validates selection and returns only a sanitized active snapshot", async () => {
    const metadata = {
      candidateProblemCount: 4,
      candidateTopicCount: 2,
      reasons: ["Selected from an uncovered topic."],
      recencyFallbackUsed: false,
      repeatFallbackUsed: false,
    } as Json;
    const { data, error } = await learner.rpc("start_mock_interview_v2", {
      p_coding_language: "java",
      p_duration_minutes: 45,
      p_interview_language: "english",
      p_interviewer_level: "beginner",
      p_problem_id: problemId,
      p_requested_difficulties: ["easy", "medium"],
      p_requested_topic_id: null!,
      p_selected_topic_id: problemTopicId,
      p_selection_algorithm_version: 1,
      p_selection_metadata: metadata,
      p_selection_mode: "coverage",
    });
    expect(error).toBeNull();
    const { data: rawInterview, error: readError } = await learner
      .from("mock_interviews")
      .select("*")
      .eq("id", data!)
      .maybeSingle();
    expect(readError).toBeNull();
    expect(rawInterview).toBeNull();
    const { data: interview, error: snapshotError } = await learner.rpc(
      "get_owned_active_mock_interview",
      { p_mock_interview_id: data! },
    );
    expect(snapshotError).toBeNull();
    expect(interview).toMatchObject({
      codingLanguage: "java",
      questionContentVersion: 1,
      voiceActivated: false,
    });
    expect(interview).not.toHaveProperty("problemId");
    expect(interview).not.toHaveProperty("selectionMetadata");
    expect(interview).not.toHaveProperty("selectedTopicId");
    lastAbandonedInterviewId = data!;
    const { error: abandonError } = await learner.rpc(
      "abandon_mock_interview",
      { p_mock_interview_id: data! },
    );
    expect(abandonError).toBeNull();
    expect(
      (
        await learner.rpc("start_mock_interview_v2", {
          p_coding_language: "python",
          p_duration_minutes: 45,
          p_interview_language: "auto",
          p_interviewer_level: "beginner",
          p_problem_id: problemId,
          p_requested_difficulties: ["hard"],
          p_requested_topic_id: null!,
          p_selected_topic_id: problemTopicId,
          p_selection_algorithm_version: 1,
          p_selection_metadata: metadata,
          p_selection_mode: "coverage",
        })
      ).error,
    ).not.toBeNull();

    const { data: unreadyProblem, error: unreadyReadError } = await learner
      .from("problems")
      .select("difficulty, id, primary_topic_id")
      .eq("active", true)
      .eq("interview_ready", false)
      .limit(1)
      .single();
    expect(unreadyReadError).toBeNull();
    expect(
      (
        await learner.rpc("start_mock_interview_v2", {
          p_coding_language: "python",
          p_duration_minutes: 45,
          p_interview_language: "auto",
          p_interviewer_level: "beginner",
          p_problem_id: unreadyProblem!.id,
          p_requested_difficulties: [unreadyProblem!.difficulty],
          p_requested_topic_id: null!,
          p_selected_topic_id: unreadyProblem!.primary_topic_id,
          p_selection_algorithm_version: 1,
          p_selection_metadata: metadata,
          p_selection_mode: "coverage",
        })
      ).error,
    ).not.toBeNull();
  });

  it("starts one private voice-pending session with its timer stopped", async () => {
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
    expect(
      (
        await learner.rpc("delete_owned_mock_interview", {
          p_mock_interview_id: interviewId,
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
    const { data: rawInterview } = await learner
      .from("mock_interviews")
      .select("*")
      .eq("id", interviewId)
      .maybeSingle();
    expect(rawInterview).toBeNull();
    const { data: interview } = await learner.rpc(
      "get_owned_active_mock_interview",
      { p_mock_interview_id: interviewId },
    );
    expect(interview).toMatchObject({
      codingLanguage: "python",
      durationMinutes: 45,
      interviewLanguage: "hebrew",
      interviewerLevel: "faang_tough",
      phase: "intro",
      timerRunning: false,
      voiceActivated: false,
    });
    expect(interview).not.toHaveProperty("problemId");
    expect(interview).not.toHaveProperty("status");
    expect(interview).not.toHaveProperty("userId");
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
    const connectionAttemptId = randomUUID();
    const { error: preparationError } = await learner.rpc(
      "prepare_realtime_interview_connection",
      {
        p_connection_attempt_id: connectionAttemptId,
        p_mock_interview_id: interviewId,
      },
    );
    expect(preparationError).toBeNull();
    const { data: confirmation, error: sessionError } = await learner.rpc(
      "confirm_realtime_interview_connection",
      {
        p_connection_attempt_id: connectionAttemptId,
        p_mock_interview_id: interviewId,
        p_model: "gpt-realtime",
        p_provider: "openai",
        p_provider_call_id: "rtc_test",
      },
    );
    expect(sessionError).toBeNull();
    realtimeSessionId = String(
      (confirmation as { realtimeSessionId: string }).realtimeSessionId,
    );
    const { data: activation, error: activationError } = await learner.rpc(
      "activate_voice_mock_interview",
      { p_mock_interview_id: interviewId },
    );
    expect(activationError).toBeNull();
    expect(activation).toMatchObject({
      elapsedSeconds: 0,
      timerRunning: true,
    });
    expect(
      (
        await learner.rpc("heartbeat_voice_mock_interview", {
          p_mock_interview_id: interviewId,
        })
      ).error,
    ).toBeNull();
    for (const [eventType, phase, content] of [
      ["user_transcript", "intro", "I will clarify the constraints."],
      ["assistant_transcript", "intro", "What assumptions would you check?"],
      ["code_snapshot", "implementation", "function solve() { return 1; }"],
    ] as const) {
      const { data, error } = await learner.rpc(
        "append_realtime_interview_event",
        {
          p_content: content,
          p_event_type: eventType,
          p_mock_interview_id: interviewId,
          p_phase: phase,
        },
      );
      expect(error, eventType).toBeNull();
      if (eventType === "user_transcript") introEvidenceEventId = data!;
      if (eventType === "assistant_transcript") {
        interviewerTranscriptEventId = data!;
      }
    }
    const { data: events } = await learner
      .from("realtime_interview_events")
      .select("event_type, content")
      .eq("session_id", realtimeSessionId)
      .order("id");
    expect(events).toEqual([]);
    expect(introEvidenceEventId).toBeGreaterThan(0);
    const { data: recentTranscript, error: recentTranscriptError } =
      await learner.rpc("get_recent_active_interview_transcript", {
        p_limit: 6,
        p_mock_interview_id: interviewId,
      });
    expect(recentTranscriptError).toBeNull();
    expect(recentTranscript).toEqual([
      expect.objectContaining({
        role: "learner",
        text: "I will clarify the constraints.",
      }),
      expect.objectContaining({
        role: "interviewer",
        text: "What assumptions would you check?",
      }),
    ]);
    expect(
      (
        await other.rpc("get_recent_active_interview_transcript", {
          p_limit: 6,
          p_mock_interview_id: interviewId,
        })
      ).data,
    ).toEqual([]);
    expect(
      (await other.from("realtime_interview_sessions").select("*")).data,
    ).toEqual([]);
    expect(
      (await other.from("realtime_interview_events").select("*")).data,
    ).toEqual([]);
  });

  it("tracks the latest accepted conversational phase without affecting workflow", async () => {
    const { data: context, error: contextError } = await learner.rpc(
      "get_interview_phase_classification_context",
      {
        p_mock_interview_id: interviewId,
        p_transcript_event_id: interviewerTranscriptEventId,
      },
    );
    expect(contextError).toBeNull();
    expect(context).toMatchObject({
      currentObservedPhase: "intro",
      triggerEventId: String(interviewerTranscriptEventId),
      workflowPhase: "intro",
    });
    expect((context as { transcript: unknown[] }).transcript).toHaveLength(2);

    const { data: implementation, error: implementationError } =
      await learner.rpc("record_mock_interview_phase_observation", {
        p_confidence: 0.91,
        p_mock_interview_id: interviewId,
        p_observed_phase: "implementation",
        p_signal: "explicit",
        p_transcript_event_id: interviewerTranscriptEventId,
      });
    expect(implementationError).toBeNull();
    expect(implementation).toMatchObject({
      accepted: true,
      observedPhase: "implementation",
      observedPhaseEventId: String(interviewerTranscriptEventId),
    });

    const { data: staleResult, error: staleError } = await learner.rpc(
      "record_mock_interview_phase_observation",
      {
        p_confidence: 0.95,
        p_mock_interview_id: interviewId,
        p_observed_phase: "clarify",
        p_signal: "explicit",
        p_transcript_event_id: introEvidenceEventId,
      },
    );
    expect(staleError).toBeNull();
    expect(staleResult).toMatchObject({
      accepted: true,
      observedPhase: "implementation",
      observedPhaseEventId: String(interviewerTranscriptEventId),
    });

    const { data: ambiguousEventId, error: ambiguousEventError } =
      await learner.rpc("append_realtime_interview_event", {
        p_content: "Maybe later we can discuss testing.",
        p_event_type: "user_transcript",
        p_mock_interview_id: interviewId,
        p_phase: "intro",
      });
    expect(ambiguousEventError).toBeNull();
    const { data: ambiguousResult, error: ambiguousError } = await learner.rpc(
      "record_mock_interview_phase_observation",
      {
        p_confidence: 0.99,
        p_mock_interview_id: interviewId,
        p_observed_phase: "testing",
        p_signal: "ambiguous",
        p_transcript_event_id: ambiguousEventId!,
      },
    );
    expect(ambiguousError).toBeNull();
    expect(ambiguousResult).toMatchObject({
      accepted: false,
      observedPhase: "implementation",
    });

    expect(
      (
        await other.rpc("get_interview_phase_classification_context", {
          p_mock_interview_id: interviewId,
          p_transcript_event_id: interviewerTranscriptEventId,
        })
      ).error,
    ).not.toBeNull();
    expect(
      (
        await other.rpc("record_mock_interview_phase_observation", {
          p_confidence: 0.99,
          p_mock_interview_id: interviewId,
          p_observed_phase: "testing",
          p_signal: "explicit",
          p_transcript_event_id: interviewerTranscriptEventId,
        })
      ).error,
    ).not.toBeNull();
    expect(
      (await learner.from("mock_interview_phase_observations").select("*"))
        .error,
    ).not.toBeNull();

    const { data: snapshot, error: snapshotError } = await learner.rpc(
      "get_owned_active_mock_interview",
      { p_mock_interview_id: interviewId },
    );
    expect(snapshotError).toBeNull();
    expect(snapshot).toMatchObject({
      observedPhase: "implementation",
      observedPhaseEventId: String(interviewerTranscriptEventId),
      phase: "intro",
    });
  });

  it("rejects phase skipping and persists every ordered stage", async () => {
    const skip = await learner.rpc("advance_mock_interview", {
      p_elapsed_seconds: 1,
      p_mock_interview_id: interviewId,
      p_payload: {} as Json,
      p_target_phase: "optimization",
    });
    expect(skip.error).not.toBeNull();

    const suggestionInput = {
      p_evidence_event_ids: [introEvidenceEventId],
      p_expected_current_phase: "intro",
      p_mock_interview_id: interviewId,
      p_reason_code: "learner_completed_objective",
      p_suggested_next_phase: "clarify",
    };
    const { data: suggestionId, error: suggestionError } = await learner.rpc(
      "suggest_mock_interview_phase",
      suggestionInput,
    );
    expect(suggestionError).toBeNull();
    expect(suggestionId).not.toBeNull();
    const suggestionBurst = await Promise.all(
      Array.from({ length: 12 }, () =>
        learner.rpc("suggest_mock_interview_phase", suggestionInput),
      ),
    );
    expect(suggestionBurst.every((result) => result.error === null)).toBe(true);
    expect(new Set(suggestionBurst.map((result) => result.data))).toEqual(
      new Set([suggestionId]),
    );
    expect(
      (
        await learner.rpc("suggest_mock_interview_phase", {
          ...suggestionInput,
          p_suggested_next_phase: "optimization",
        })
      ).data,
    ).toBeNull();
    expect(
      (await other.rpc("suggest_mock_interview_phase", suggestionInput)).error,
    ).not.toBeNull();

    const { data: firstWorkspaceVersion, error: workspaceError } =
      await learner.rpc("save_mock_interview_workspace", {
        p_code_snapshot: "# first Python draft",
        p_expected_version: 0,
        p_mock_interview_id: interviewId,
        p_scratchpad: "Trace: input -> state -> output",
      });
    expect(workspaceError).toBeNull();
    expect(firstWorkspaceVersion).toBe(1);
    expect(
      (
        await learner.rpc("save_mock_interview_workspace", {
          p_code_snapshot: "# foreign overwrite",
          p_expected_version: 1,
          p_mock_interview_id: interviewId,
          p_scratchpad: "foreign",
        })
      ).error,
    ).toBeNull();
    expect(
      (
        await other.rpc("save_mock_interview_workspace", {
          p_code_snapshot: "# foreign overwrite",
          p_expected_version: 1,
          p_mock_interview_id: interviewId,
          p_scratchpad: "foreign",
        })
      ).error,
    ).not.toBeNull();
    expect(
      (
        await learner.rpc("save_mock_interview_workspace", {
          p_code_snapshot: "# stale overwrite",
          p_expected_version: 0,
          p_mock_interview_id: interviewId,
          p_scratchpad: "stale",
        })
      ).error?.code,
    ).toBe("40001");
    expect(
      (
        await learner.rpc("save_mock_interview_workspace", {
          p_code_snapshot: "pass",
          p_expected_version: 2,
          p_mock_interview_id: interviewId,
          p_scratchpad: "x".repeat(10_001),
        })
      ).error,
    ).not.toBeNull();
    expect(
      (
        await learner.rpc("save_mock_interview_workspace", {
          p_code_snapshot: "x".repeat(30_001),
          p_expected_version: 2,
          p_mock_interview_id: interviewId,
          p_scratchpad: "",
        })
      ).error,
    ).not.toBeNull();

    const steps = [
      ["clarify", {}],
      ["examples", { notes: "What are the constraints?" }],
      ["brute_force", { notes: "Example and expected output" }],
      ["optimization", { notes: "Try every possible candidate" }],
      [
        "implementation",
        { notes: "Maintain one invariant and remove repeated work" },
      ],
    ] as const;
    for (const [index, [target, payload]] of steps.entries()) {
      const { error } = await learner.rpc("advance_mock_interview", {
        p_elapsed_seconds: 100 + index,
        p_mock_interview_id: interviewId,
        p_payload: payload as Json,
        p_target_phase: target,
      });
      expect(error, target).toBeNull();
    }
    const reviewCode =
      "def solve(values):\n    return values[0] if values else None\n";
    const { data: reviewSubmission, error: reviewError } = await learner.rpc(
      "submit_mock_interview_code",
      {
        p_advance_to_testing: false,
        p_code_snapshot: reviewCode,
        p_elapsed_seconds: 300,
        p_expected_version: 2,
        p_mock_interview_id: interviewId,
        p_scratchpad: "Check the empty case before returning.",
      },
    );
    expect(reviewError).toBeNull();
    expect(reviewSubmission).toMatchObject({
      advancedToTesting: false,
      workspaceVersion: 3,
    });
    const finalCode =
      "def solve(values):\n    if not values:\n        return None\n    return values[0]\n";
    const { data: finalSubmission, error: finalError } = await learner.rpc(
      "submit_mock_interview_code",
      {
        p_advance_to_testing: true,
        p_code_snapshot: finalCode,
        p_elapsed_seconds: 301,
        p_expected_version: 3,
        p_mock_interview_id: interviewId,
        p_scratchpad: "Empty and ordinary cases are covered.",
      },
    );
    expect(finalError).toBeNull();
    expect(finalSubmission).toMatchObject({
      advancedToTesting: true,
      workspaceVersion: 4,
    });
    for (const [target, payload, elapsed] of [
      ["complexity", { notes: "Test empty and ordinary input" }, 302],
      [
        "retrospective",
        { spaceComplexity: "O(1)", timeComplexity: "O(n)" },
        303,
      ],
    ] as const) {
      const { error } = await learner.rpc("advance_mock_interview", {
        p_elapsed_seconds: elapsed,
        p_mock_interview_id: interviewId,
        p_payload: payload as Json,
        p_target_phase: target,
      });
      expect(error, target).toBeNull();
    }
    const { data: interview } = await learner.rpc(
      "get_owned_active_mock_interview",
      { p_mock_interview_id: interviewId },
    );
    expect(interview).toMatchObject({
      codeSnapshot: finalCode,
      codingLanguage: "python",
      phase: "retrospective",
      scratchpad: "Empty and ordinary cases are covered.",
      timerRunning: false,
      workspaceVersion: 4,
    });
    const { data: submissions, error: submissionsError } = await learner
      .from("mock_interview_code_submissions")
      .select(
        "coding_language, code_snapshot, phase, snapshot_version, submission_kind",
      )
      .eq("mock_interview_id", interviewId)
      .order("snapshot_version");
    expect(submissionsError).toBeNull();
    expect(submissions).toEqual([]);
    expect(
      (await other.from("mock_interview_code_submissions").select("*")).data,
    ).toEqual([]);
    const { data: phaseEvents, error: phaseEventsError } = await learner
      .from("mock_interview_phase_events")
      .select(
        "code_submission_ids, display_summary, evidence_event_ids, evidence_fields, phase, suggested_phase, transition_type",
      )
      .eq("mock_interview_id", interviewId)
      .order("created_at")
      .order("id");
    expect(phaseEventsError).toBeNull();
    expect(phaseEvents).toEqual([]);
    expect(
      (await other.from("mock_interview_phase_events").select("*")).data,
    ).toEqual([]);
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
    masteryBeforeCompletedInterview = beforeMastery!.overall_score;
    const { error } = await learner.rpc("complete_mock_interview", {
      p_code_quality_rating: 2,
      p_communication_rating: 2,
      p_complexity_rating: 2,
      p_elapsed_seconds: 304,
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
    expect(realtimeSession?.summary).toContain("2 learner turns");
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
      code: {
        source: "interview_state",
        text: expect.stringContaining("def solve(values):"),
      },
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
    expect(
      (
        await other.rpc("delete_owned_mock_interview", {
          p_mock_interview_id: interviewId,
        })
      ).error,
    ).not.toBeNull();
    const { error: directError } = await learner
      .from("mock_interviews")
      .insert({
        difficulty_mode: "easy",
        duration_minutes: 45,
        interview_language: "hebrew",
        problem_id: problemId,
        selected_topic_id: problemTopicId,
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
    const { error: directSubmissionError } = await learner
      .from("mock_interview_code_submissions")
      .insert({
        code_snapshot: "forged",
        coding_language: "python",
        elapsed_seconds: 1,
        mock_interview_id: interviewId,
        phase: "implementation",
        snapshot_version: 99,
        submission_kind: "review",
        user_id: learnerId,
      });
    expect(directSubmissionError?.code).toBe("42501");
    const { error: directPhaseEventError } = await learner
      .from("mock_interview_phase_events")
      .insert({
        mock_interview_id: interviewId,
        phase: "intro",
        source: "learner_action",
        transition_type: "completed",
        user_id: learnerId,
      });
    expect(directPhaseEventError?.code).toBe("42501");
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

  it("deletes owned history, cascades evidence, and removes mastery influence", async () => {
    const { data: deletedTopicId, error } = await learner.rpc(
      "delete_owned_mock_interview",
      { p_mock_interview_id: interviewId },
    );
    expect(error).toBeNull();
    expect(deletedTopicId).toBe(problemTopicId);

    const [
      interviewResult,
      scorecardResult,
      evaluationResult,
      sessionResult,
      eventResult,
      submissionResult,
      phaseEventResult,
      conversationStateResult,
      conversationEventResult,
      masteryResult,
    ] = await Promise.all([
      learner
        .from("mock_interviews")
        .select("id")
        .eq("id", interviewId)
        .maybeSingle(),
      learner
        .from("mock_interview_scorecards")
        .select("mock_interview_id")
        .eq("mock_interview_id", interviewId),
      learner
        .from("mock_interview_evaluations")
        .select("id")
        .eq("mock_interview_id", interviewId),
      learner
        .from("realtime_interview_sessions")
        .select("id")
        .eq("mock_interview_id", interviewId),
      learner
        .from("realtime_interview_events")
        .select("id")
        .eq("session_id", realtimeSessionId),
      learner
        .from("mock_interview_code_submissions")
        .select("id")
        .eq("mock_interview_id", interviewId),
      learner
        .from("mock_interview_phase_events")
        .select("id")
        .eq("mock_interview_id", interviewId),
      learner
        .from("mock_interview_conversation_state")
        .select("mock_interview_id")
        .eq("mock_interview_id", interviewId),
      learner
        .from("mock_interview_conversation_events")
        .select("id")
        .eq("mock_interview_id", interviewId),
      learner
        .from("topic_mastery")
        .select("mock_interview_count, last_interviewed_at, overall_score")
        .eq("topic_id", problemTopicId)
        .single(),
    ]);
    expect(interviewResult.data).toBeNull();
    expect(scorecardResult.data).toEqual([]);
    expect(evaluationResult.data).toEqual([]);
    expect(sessionResult.data).toEqual([]);
    expect(eventResult.data).toEqual([]);
    expect(submissionResult.data).toEqual([]);
    expect(phaseEventResult.data).toEqual([]);
    expect(conversationStateResult.data).toEqual([]);
    expect(conversationEventResult.data).toEqual([]);
    expect(masteryResult.data).toMatchObject({
      last_interviewed_at: null,
      mock_interview_count: 0,
      overall_score: masteryBeforeCompletedInterview,
    });

    const { error: abandonedDeleteError } = await learner.rpc(
      "delete_owned_mock_interview",
      { p_mock_interview_id: lastAbandonedInterviewId },
    );
    expect(abandonedDeleteError).not.toBeNull();
    expect(
      (
        await learner
          .from("mock_interviews")
          .select("id")
          .eq("id", lastAbandonedInterviewId)
      ).data,
    ).toEqual([]);
  });

  it("persists live control state, restores reconnects, and enforces one follow-up", async () => {
    const { data: controlledInterviewId, error: startError } =
      await learner.rpc("start_mock_interview", {
        p_difficulty_mode: "easy",
        p_duration_minutes: 45,
        p_interview_language: "english",
        p_interviewer_level: "faang_tough",
        p_problem_id: problemId,
      });
    expect(startError).toBeNull();

    const failedAttemptId = randomUUID();
    const confirmedAttemptId = randomUUID();
    const competingAttemptId = randomUUID();
    const resumedAttemptId = randomUUID();
    const { data: firstConnection, error: firstConnectionError } =
      await learner.rpc("prepare_realtime_interview_connection", {
        p_connection_attempt_id: failedAttemptId,
        p_mock_interview_id: controlledInterviewId!,
      });
    expect(firstConnectionError).toBeNull();
    expect(firstConnection).toMatchObject({
      connectionAttemptId: failedAttemptId,
      connectionCount: 0,
      connectionMode: "start",
      lifecycle: "primary_question",
      observedPhase: null,
      questionCycle: "primary",
    });
    expect(
      (
        await learner
          .from("mock_interview_conversation_state")
          .select("mock_interview_id")
          .eq("mock_interview_id", controlledInterviewId!)
      ).data,
    ).toEqual([]);
    expect(
      (
        await learner
          .from("mock_interview_conversation_events")
          .select("id")
          .eq("mock_interview_id", controlledInterviewId!)
      ).data,
    ).toEqual([]);

    expect(
      (
        await learner.rpc("prepare_realtime_interview_connection", {
          p_connection_attempt_id: confirmedAttemptId,
          p_mock_interview_id: controlledInterviewId!,
        })
      ).error,
    ).not.toBeNull();
    expect(
      (
        await learner.rpc("cancel_realtime_interview_connection", {
          p_connection_attempt_id: failedAttemptId,
          p_mock_interview_id: controlledInterviewId!,
          p_reason_code: "provider_connection_failed",
        })
      ).data,
    ).toBe(true);

    const competingStarts = await Promise.all([
      learner.rpc("prepare_realtime_interview_connection", {
        p_connection_attempt_id: confirmedAttemptId,
        p_mock_interview_id: controlledInterviewId!,
      }),
      learner.rpc("prepare_realtime_interview_connection", {
        p_connection_attempt_id: competingAttemptId,
        p_mock_interview_id: controlledInterviewId!,
      }),
    ]);
    const successfulStarts = competingStarts.filter((result) => !result.error);
    expect(successfulStarts).toHaveLength(1);
    expect(competingStarts.filter((result) => result.error)).toHaveLength(1);
    const retriedStart = successfulStarts[0]!.data;
    const winningStartAttemptId = (
      retriedStart as { connectionAttemptId: string }
    ).connectionAttemptId;
    expect(retriedStart).toMatchObject({
      connectionCount: 0,
      connectionMode: "start",
    });
    const firstConfirmation = await learner.rpc(
      "confirm_realtime_interview_connection",
      {
        p_connection_attempt_id: winningStartAttemptId,
        p_mock_interview_id: controlledInterviewId!,
        p_model: "test-live-model",
        p_provider: "gemini",
      },
    );
    expect(firstConfirmation.data).toMatchObject({
      connectionCount: 1,
      connectionMode: "start",
    });
    expect(
      (
        await learner.rpc("confirm_realtime_interview_connection", {
          p_connection_attempt_id: winningStartAttemptId,
          p_mock_interview_id: controlledInterviewId!,
          p_model: "test-live-model",
          p_provider: "gemini",
        })
      ).data,
    ).toEqual(firstConfirmation.data);
    expect(
      (
        await learner.rpc("activate_voice_mock_interview", {
          p_mock_interview_id: controlledInterviewId!,
        })
      ).error,
    ).toBeNull();
    const { data: transcriptEventId, error: transcriptError } =
      await learner.rpc("append_realtime_interview_event", {
        p_content: "I will now describe the complete algorithm.",
        p_event_type: "user_transcript",
        p_mock_interview_id: controlledInterviewId!,
        p_phase: "optimization",
      });
    expect(transcriptError).toBeNull();

    const { data: resumedConnection, error: resumedConnectionError } =
      await learner.rpc("prepare_realtime_interview_connection", {
        p_connection_attempt_id: resumedAttemptId,
        p_mock_interview_id: controlledInterviewId!,
      });
    expect(resumedConnectionError).toBeNull();
    expect(resumedConnection).toMatchObject({
      connectionAttemptId: resumedAttemptId,
      connectionCount: 1,
      connectionMode: "resume",
      recentTranscript: [
        expect.objectContaining({
          questionCycle: "primary",
          text: "I will now describe the complete algorithm.",
        }),
      ],
    });
    expect(
      (
        await learner.rpc("confirm_realtime_interview_connection", {
          p_connection_attempt_id: resumedAttemptId,
          p_mock_interview_id: controlledInterviewId!,
          p_model: "test-live-model",
          p_provider: "gemini",
        })
      ).data,
    ).toMatchObject({ connectionCount: 2, connectionMode: "resume" });
    expect(
      (
        await other.rpc("prepare_realtime_interview_connection", {
          p_connection_attempt_id: randomUUID(),
          p_mock_interview_id: controlledInterviewId!,
        })
      ).error,
    ).not.toBeNull();

    const stageCallId = randomUUID();
    const { data: stage, error: stageError } = await learner.rpc(
      "execute_realtime_interview_control",
      {
        p_idempotency_key: stageCallId,
        p_mock_interview_id: controlledInterviewId!,
        p_payload: {
          phase: "optimization",
          questionCycle: "primary",
          reasonCode: "optimized_plan_discussed",
          signal: "explicit",
          transcriptEventId: String(transcriptEventId),
        },
        p_tool_name: "report_current_stage",
      },
    );
    expect(stageError).toBeNull();
    expect(stage).toMatchObject({
      accepted: true,
      observedPhase: "optimization",
    });
    expect(
      (
        await learner.rpc("execute_realtime_interview_control", {
          p_idempotency_key: stageCallId,
          p_mock_interview_id: controlledInterviewId!,
          p_payload: {
            phase: "intro",
            questionCycle: "primary",
            reasonCode: "changed_retry_payload",
            signal: "inferred",
            transcriptEventId: String(transcriptEventId),
          },
          p_tool_name: "report_current_stage",
        })
      ).data,
    ).toEqual(stage);
    expect(
      (
        await admin
          .from("mock_interview_control_receipts")
          .select("id", { count: "exact" })
          .eq("mock_interview_id", controlledInterviewId!)
          .eq("tool_name", "report_current_stage")
          .eq("idempotency_key", stageCallId)
      ).count,
    ).toBe(1);
    expect(
      (
        await learner.rpc("record_live_interview_stage", {
          p_mock_interview_id: controlledInterviewId!,
          p_observed_phase: "intro",
          p_question_cycle: "primary",
          p_reason_code: "bypass_attempt",
          p_signal: "inferred",
          p_transcript_event_id: transcriptEventId!,
        })
      ).error,
    ).not.toBeNull();

    const { data: implementationEventId, error: implementationEventError } =
      await learner.rpc("append_realtime_interview_event", {
        p_content: "I am ready to implement the described algorithm.",
        p_event_type: "user_transcript",
        p_mock_interview_id: controlledInterviewId!,
        p_phase: "implementation",
      });
    expect(implementationEventError).toBeNull();
    expect(
      (
        await learner.rpc("execute_realtime_interview_control", {
          p_idempotency_key: randomUUID(),
          p_mock_interview_id: controlledInterviewId!,
          p_payload: {
            phase: "implementation",
            questionCycle: "primary",
            reasonCode: "implementation_started",
            signal: "explicit",
            transcriptEventId: String(implementationEventId),
          },
          p_tool_name: "report_current_stage",
        })
      ).error,
    ).toBeNull();
    expect(
      (
        await learner.rpc("submit_mock_interview_code", {
          p_advance_to_testing: false,
          p_code_snapshot: "def solve():\n    return None",
          p_elapsed_seconds: 2_100,
          p_expected_version: 0,
          p_mock_interview_id: controlledInterviewId!,
          p_scratchpad: "",
        })
      ).error,
    ).toBeNull();

    const partialReadiness = await learner.rpc(
      "execute_realtime_interview_control",
      {
        p_idempotency_key: randomUUID(),
        p_mock_interview_id: controlledInterviewId!,
        p_payload: {
          algorithmComplete: true,
          complexityConsistent: true,
          correctnessReasoningComplete: false,
          edgeCasesAddressed: true,
          operationOrderComplete: true,
          reasonCode: "correctness_not_explained",
          stateComplete: true,
          transcriptEventId: String(transcriptEventId),
        },
        p_tool_name: "report_solution_readiness",
      },
    );
    expect(partialReadiness.error).toBeNull();
    expect(partialReadiness.data).toMatchObject({ ready: false });
    expect(
      (
        await learner.rpc("execute_realtime_interview_control", {
          p_idempotency_key: randomUUID(),
          p_mock_interview_id: controlledInterviewId!,
          p_payload: {
            reasonCode: "primary_work_complete",
            transcriptEventId: String(transcriptEventId),
          },
          p_tool_name: "complete_primary_question",
        })
      ).error,
    ).not.toBeNull();

    expect(
      (
        await learner.rpc("execute_realtime_interview_control", {
          p_idempotency_key: randomUUID(),
          p_mock_interview_id: controlledInterviewId!,
          p_payload: {
            algorithmComplete: true,
            complexityConsistent: true,
            correctnessReasoningComplete: true,
            edgeCasesAddressed: true,
            operationOrderComplete: true,
            reasonCode: "complete_solution_stated",
            stateComplete: true,
            transcriptEventId: String(transcriptEventId),
          },
          p_tool_name: "report_solution_readiness",
        })
      ).data,
    ).toMatchObject({ ready: true });
    expect(
      (
        await learner.rpc("execute_realtime_interview_control", {
          p_idempotency_key: randomUUID(),
          p_mock_interview_id: controlledInterviewId!,
          p_payload: {
            reasonCode: "primary_work_complete",
            transcriptEventId: String(transcriptEventId),
          },
          p_tool_name: "complete_primary_question",
        })
      ).error,
    ).toBeNull();

    const { data: allowedFollowUp, error: allowedFollowUpError } =
      await learner.rpc("execute_realtime_interview_control", {
        p_idempotency_key: randomUUID(),
        p_mock_interview_id: controlledInterviewId!,
        p_payload: { reasonCode: "additional_evidence_useful" },
        p_tool_name: "request_follow_up",
      });
    expect(allowedFollowUpError).toBeNull();
    expect(allowedFollowUp).toMatchObject({
      allowed: true,
      lifecycle: "follow_up",
      questionCycle: "follow_up",
    });
    expect(
      (allowedFollowUp as { remainingSeconds: number }).remainingSeconds,
    ).toBe(600);
    expect(
      (allowedFollowUp as { followUpPrompt: string }).followUpPrompt.length,
    ).toBeGreaterThan(20);

    const { data: followUpEventId } = await learner.rpc(
      "append_realtime_interview_event",
      {
        p_content: "I completed the follow-up implementation.",
        p_event_type: "user_transcript",
        p_mock_interview_id: controlledInterviewId!,
        p_phase: "implementation",
      },
    );
    expect(
      (
        await learner.rpc("execute_realtime_interview_control", {
          p_idempotency_key: randomUUID(),
          p_mock_interview_id: controlledInterviewId!,
          p_payload: {
            reasonCode: "follow_up_work_complete",
            transcriptEventId: String(followUpEventId),
          },
          p_tool_name: "complete_follow_up_question",
        })
      ).error,
    ).toBeNull();
    expect(
      (
        await learner.rpc("execute_realtime_interview_control", {
          p_idempotency_key: randomUUID(),
          p_mock_interview_id: controlledInterviewId!,
          p_payload: { reasonCode: "another_follow_up" },
          p_tool_name: "request_follow_up",
        })
      ).error,
    ).not.toBeNull();

    const { data: conclusion, error: conclusionError } = await learner.rpc(
      "execute_realtime_interview_control",
      {
        p_idempotency_key: randomUUID(),
        p_mock_interview_id: controlledInterviewId!,
        p_payload: { reasonCode: "follow_up_complete" },
        p_tool_name: "conclude_interview",
      },
    );
    expect(conclusionError).toBeNull();
    expect(conclusion).toMatchObject({ lifecycle: "concluding" });
    const { data: finalSnapshot } = await learner.rpc(
      "get_owned_active_mock_interview",
      { p_mock_interview_id: controlledInterviewId! },
    );
    expect(finalSnapshot).toMatchObject({
      conversationLifecycle: "concluding",
      followUpPrompt: (allowedFollowUp as { followUpPrompt: string })
        .followUpPrompt,
      phase: "retrospective",
      questionCycle: "follow_up",
      timerRunning: false,
    });

    expect(
      (
        await learner
          .from("mock_interview_conversation_state")
          .update({ lifecycle: "primary_question" })
          .eq("mock_interview_id", controlledInterviewId!)
      ).error,
    ).not.toBeNull();
    await learner.rpc("abandon_mock_interview", {
      p_mock_interview_id: controlledInterviewId!,
    });
  });

  it("rejects a follow-up at exactly 9:59 remaining", async () => {
    const { data: boundaryInterviewId, error: startError } = await learner.rpc(
      "start_mock_interview",
      {
        p_difficulty_mode: "easy",
        p_duration_minutes: 30,
        p_interview_language: "english",
        p_interviewer_level: "faang_tough",
        p_problem_id: problemId,
      },
    );
    expect(startError).toBeNull();

    const attemptId = randomUUID();
    expect(
      (
        await learner.rpc("prepare_realtime_interview_connection", {
          p_connection_attempt_id: attemptId,
          p_mock_interview_id: boundaryInterviewId!,
        })
      ).error,
    ).toBeNull();
    expect(
      (
        await learner.rpc("confirm_realtime_interview_connection", {
          p_connection_attempt_id: attemptId,
          p_mock_interview_id: boundaryInterviewId!,
          p_model: "test-live-model",
          p_provider: "gemini",
        })
      ).error,
    ).toBeNull();
    expect(
      (
        await learner.rpc("activate_voice_mock_interview", {
          p_mock_interview_id: boundaryInterviewId!,
        })
      ).error,
    ).toBeNull();

    const { data: transcriptEventId, error: transcriptError } =
      await learner.rpc("append_realtime_interview_event", {
        p_content: "Here is the complete implementation-ready solution.",
        p_event_type: "user_transcript",
        p_mock_interview_id: boundaryInterviewId!,
        p_phase: "implementation",
      });
    expect(transcriptError).toBeNull();
    expect(
      (
        await learner.rpc("execute_realtime_interview_control", {
          p_idempotency_key: randomUUID(),
          p_mock_interview_id: boundaryInterviewId!,
          p_payload: {
            phase: "implementation",
            questionCycle: "primary",
            reasonCode: "implementation_started",
            signal: "explicit",
            transcriptEventId: String(transcriptEventId),
          },
          p_tool_name: "report_current_stage",
        })
      ).error,
    ).toBeNull();
    expect(
      (
        await learner.rpc("submit_mock_interview_code", {
          p_advance_to_testing: false,
          p_code_snapshot: "def solve():\n    return None",
          p_elapsed_seconds: 1_201,
          p_expected_version: 0,
          p_mock_interview_id: boundaryInterviewId!,
          p_scratchpad: "",
        })
      ).error,
    ).toBeNull();
    expect(
      (
        await learner.rpc("execute_realtime_interview_control", {
          p_idempotency_key: randomUUID(),
          p_mock_interview_id: boundaryInterviewId!,
          p_payload: {
            algorithmComplete: true,
            complexityConsistent: true,
            correctnessReasoningComplete: true,
            edgeCasesAddressed: true,
            operationOrderComplete: true,
            reasonCode: "complete_solution_stated",
            stateComplete: true,
            transcriptEventId: String(transcriptEventId),
          },
          p_tool_name: "report_solution_readiness",
        })
      ).error,
    ).toBeNull();
    expect(
      (
        await learner.rpc("execute_realtime_interview_control", {
          p_idempotency_key: randomUUID(),
          p_mock_interview_id: boundaryInterviewId!,
          p_payload: {
            reasonCode: "primary_work_complete",
            transcriptEventId: String(transcriptEventId),
          },
          p_tool_name: "complete_primary_question",
        })
      ).error,
    ).toBeNull();

    const followUp = await learner.rpc("execute_realtime_interview_control", {
      p_idempotency_key: randomUUID(),
      p_mock_interview_id: boundaryInterviewId!,
      p_payload: { reasonCode: "boundary_below_ten_minutes" },
      p_tool_name: "request_follow_up",
    });
    expect(followUp.error).toBeNull();
    expect(followUp.data).toMatchObject({
      allowed: false,
      lifecycle: "primary_completed",
      remainingSeconds: 599,
    });
    expect(
      (
        await learner.rpc("execute_realtime_interview_control", {
          p_idempotency_key: randomUUID(),
          p_mock_interview_id: boundaryInterviewId!,
          p_payload: { reasonCode: "time_low" },
          p_tool_name: "conclude_interview",
        })
      ).error,
    ).toBeNull();
    await learner.rpc("abandon_mock_interview", {
      p_mock_interview_id: boundaryInterviewId!,
    });
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
