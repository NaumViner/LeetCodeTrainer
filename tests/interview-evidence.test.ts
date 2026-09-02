import { describe, expect, it } from "vitest";

import {
  buildInterviewEvidencePackage,
  interviewEvidencePackageSchema,
  MAX_EVIDENCE_CODE_CHARS,
  MAX_EVIDENCE_TRANSCRIPT_TURNS,
  type FirstPartyQuestionContent,
} from "@/features/interview-evaluation/evidence-model";
import type { Problem } from "@/features/problems/model";
import type { Tables } from "@/types/database";

const learnerId = "018f2468-1234-7abc-8def-123456789abc";
const interviewId = "018f2468-1234-7abc-8def-123456789abd";
const problemId = "018f2468-1234-7abc-8def-123456789abe";
const topicId = "018f2468-1234-7abc-8def-123456789abf";
const sessionId = "018f2468-1234-7abc-8def-123456789ac0";

describe("canonical interview evidence", () => {
  it("assembles only bounded evaluator-safe fields", () => {
    const evidence = buildInterviewEvidencePackage({
      assembledAt: new Date("2026-08-31T12:10:00.000Z"),
      interview: completedInterview(),
      problem: catalogProblem(),
      questionContent: null,
      realtimeEvents: [
        event(1, "user_transcript", "What are the constraints?", "clarify"),
        event(2, "assistant_transcript", "Assume valid input.", "clarify"),
        event(3, "phase_context", "Clarification complete.", "clarify"),
        event(4, "code_snapshot", "function latest() {}", "implementation"),
        event(5, "connection", "Live voice reconnected.", "testing"),
        {
          ...event(6, "user_transcript", "foreign", "testing"),
          user_id: "018f2468-1234-7abc-8def-123456789aff",
        },
      ],
      realtimeSession: realtimeSession(),
    });

    expect(evidence).not.toBeNull();
    expect(evidence?.code).toMatchObject({
      source: "realtime_event",
      text: "function latest() {}",
    });
    expect(evidence?.transcript.map((turn) => turn.role)).toEqual([
      "learner",
      "interviewer",
    ]);
    expect(evidence?.coverage).toMatchObject({
      hasFirstPartyQuestionContent: false,
      hasTrustedTests: false,
      semanticCorrectness: "unsupported",
      transcriptTurns: 2,
    });
    expect(evidence?.phaseTimings).toHaveLength(2);
    expect(evidence?.sessionEvents).toHaveLength(1);
    const serialized = JSON.stringify(evidence);
    expect(serialized).not.toContain("provider_call_id");
    expect(serialized).not.toContain("permanent-provider-secret");
    expect(interviewEvidencePackageSchema.safeParse(evidence).success).toBe(
      true,
    );
  });

  it("bounds transcript, code, phase notes, and event content", () => {
    const interview = completedInterview({
      clarification_notes: "n".repeat(5_000),
      code_snapshot: "fallback",
    });
    const transcriptEvents = Array.from({ length: 100 }, (_, index) =>
      event(
        index + 1,
        index % 2 ? "assistant_transcript" : "user_transcript",
        `turn-${index}-${"x".repeat(1_500)}`,
        "implementation",
      ),
    );
    const evidence = buildInterviewEvidencePackage({
      assembledAt: new Date("2026-08-31T12:10:00.000Z"),
      interview,
      problem: catalogProblem(),
      questionContent: null,
      realtimeEvents: [
        ...transcriptEvents,
        event(
          101,
          "code_snapshot",
          "c".repeat(MAX_EVIDENCE_CODE_CHARS + 100),
          "implementation",
        ),
      ],
      realtimeSession: realtimeSession(),
    });

    expect(evidence?.transcript).toHaveLength(MAX_EVIDENCE_TRANSCRIPT_TURNS);
    expect(evidence?.transcript[0]?.text.length).toBeLessThanOrEqual(1_000);
    expect(evidence?.code.text).toHaveLength(MAX_EVIDENCE_CODE_CHARS);
    expect(evidence?.coverage.transcriptTruncated).toBe(true);
    expect(evidence?.coverage.truncatedFields).toEqual(
      expect.arrayContaining([
        "code",
        "phaseEvidence.clarification",
        "transcript",
      ]),
    );
  });

  it("does not assemble skill evidence for active or abandoned interviews", () => {
    for (const status of ["active", "abandoned"]) {
      expect(
        buildInterviewEvidencePackage({
          assembledAt: new Date(),
          interview: completedInterview({
            completed_at:
              status === "active" ? null : "2026-08-31T12:09:00.000Z",
            result: status === "active" ? null : "failed",
            status,
          }),
          problem: catalogProblem(),
          questionContent: null,
          realtimeEvents: [],
          realtimeSession: null,
        }),
      ).toBeNull();
    }
  });

  it("labels prompt-only and trusted-test correctness evidence explicitly", () => {
    const promptContent: FirstPartyQuestionContent = {
      constraints: ["Input length is between 1 and 100."],
      contentVersion: 1,
      examples: [{ explanation: null, input: "[1]", output: "1" }],
      expectedInvariants: ["The returned value follows the stated rule."],
      prompt: "Return the single value from a one-item list.",
    };
    const base = {
      assembledAt: new Date("2026-08-31T12:10:00.000Z"),
      interview: completedInterview(),
      problem: catalogProblem(),
      questionContent: promptContent,
      realtimeEvents: [],
      realtimeSession: null,
    };

    expect(
      buildInterviewEvidencePackage(base)?.coverage.semanticCorrectness,
    ).toBe("prompt_only");
    expect(
      buildInterviewEvidencePackage({
        ...base,
        trustedTests: {
          compileStatus: "passed",
          failures: [],
          passedTests: 3,
          runner: "isolated-runner-v1",
          totalTests: 3,
        },
      })?.coverage.semanticCorrectness,
    ).toBe("trusted_tests");
  });
});

function completedInterview(
  overrides: Partial<Tables<"mock_interviews">> = {},
): Tables<"mock_interviews"> {
  return {
    brute_force_notes: "Try every item.",
    clarification_notes: "Asked about constraints.",
    code_snapshot: "function fallback() {}",
    code_submitted_at: null,
    code_updated_at: null,
    coding_language: "python",
    completed_at: "2026-08-31T12:09:00.000Z",
    created_at: "2026-08-31T12:00:00.000Z",
    difficulty_mode: "hard",
    duration_minutes: 30,
    elapsed_seconds: 540,
    examples_notes: "Checked a minimal case.",
    id: interviewId,
    interviewer_level: "faang_tough",
    interview_language: "hebrew",
    optimization_notes: "Removed repeated work.",
    phase: "completed",
    problem_id: problemId,
    question_content_version: null,
    requested_difficulties: ["hard"],
    requested_topic_id: null,
    result: "partial",
    retrospective: "I should test earlier.",
    selected_topic_id: topicId,
    selection_algorithm_version: 0,
    selection_metadata: {},
    selection_mode: "legacy",
    scratchpad: null,
    started_at: "2026-08-31T12:00:00.000Z",
    status: "completed",
    submitted_space_complexity: "O(n)",
    submitted_time_complexity: "O(n)",
    testing_notes: "Tested empty and ordinary input.",
    timer_running: false,
    updated_at: "2026-08-31T12:09:00.000Z",
    user_id: learnerId,
    voice_activated_at: "2026-08-31T12:00:00.000Z",
    voice_activation_deadline: "2026-08-31T12:05:00.000Z",
    voice_last_heartbeat_at: "2026-08-31T12:09:00.000Z",
    voice_required: true,
    workspace_updated_at: null,
    workspace_version: 0,
    ...overrides,
  };
}

function catalogProblem(): Problem {
  return {
    active: true,
    company_tags: [],
    created_at: "2026-08-31T12:00:00.000Z",
    curriculum_level: "interview",
    dataset_order: 1,
    difficulty: "hard",
    estimated_minutes: 30,
    external_id: "original-1",
    external_url: "https://example.com/problem",
    id: problemId,
    interview_content_provenance: null,
    interview_content_version: null,
    interview_ready: false,
    pattern_tags: ["hashing"],
    premium: false,
    prerequisiteTopics: [],
    primary_topic_id: topicId,
    primaryTopic: topic(),
    recognition_signals: [],
    secondaryTopics: [],
    slug: "original-question",
    source: "first-party",
    title: "Original Question",
    updated_at: "2026-08-31T12:00:00.000Z",
  };
}

function topic() {
  return {
    active: true,
    created_at: "2026-08-31T12:00:00.000Z",
    curriculum_order: 1,
    id: topicId,
    long_description: "Array interview patterns.",
    name: "Arrays",
    short_description: "Arrays",
    slug: "arrays",
    stage: 1,
    updated_at: "2026-08-31T12:00:00.000Z",
  };
}

function realtimeSession(): Tables<"realtime_interview_sessions"> {
  return {
    connected_at: "2026-08-31T12:00:10.000Z",
    created_at: "2026-08-31T12:00:10.000Z",
    ended_at: "2026-08-31T12:09:00.000Z",
    id: sessionId,
    mock_interview_id: interviewId,
    model: "gemini-live-model",
    provider: "gemini",
    provider_call_id: "permanent-provider-secret",
    status: "completed",
    summary: null,
    updated_at: "2026-08-31T12:09:00.000Z",
    user_id: learnerId,
  };
}

function event(
  id: number,
  eventType: string,
  content: string,
  phase: string | null,
): Tables<"realtime_interview_events"> {
  return {
    content,
    created_at: new Date(Date.UTC(2026, 7, 31, 12, 0, id)).toISOString(),
    event_type: eventType,
    id,
    phase,
    session_id: sessionId,
    user_id: learnerId,
  };
}
