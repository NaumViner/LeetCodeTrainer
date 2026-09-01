import { z } from "zod";

import {
  INTERVIEWER_LEVELS,
  INTERVIEW_LANGUAGES,
  MOCK_INTERVIEW_PHASES,
  normalizeInterviewLanguage,
} from "@/domain/mock-interview";
import type { Problem } from "@/features/problems/model";
import type { Tables } from "@/types/database";

export const INTERVIEW_EVIDENCE_VERSION = 2 as const;
export const MAX_EVIDENCE_TRANSCRIPT_TURNS = 80;
export const MAX_EVIDENCE_TRANSCRIPT_CHARS = 80_000;
export const MAX_EVIDENCE_CODE_CHARS = 30_000;

const boundedText = (maximum: number) => z.string().max(maximum);
const timestampSchema = z.iso.datetime({ offset: true });
const topicSchema = z
  .object({
    id: z.uuid(),
    name: boundedText(120),
    slug: boundedText(120),
  })
  .strict();

export const firstPartyQuestionContentSchema = z
  .object({
    constraints: z.array(boundedText(500)).max(20),
    contentVersion: z.number().int().positive(),
    examples: z
      .array(
        z
          .object({
            explanation: boundedText(1_000).nullable(),
            input: boundedText(2_000),
            output: boundedText(2_000),
          })
          .strict(),
      )
      .max(8),
    expectedInvariants: z.array(boundedText(1_000)).max(12),
    prompt: boundedText(12_000),
  })
  .strict();

const trustedTestResultsSchema = z
  .object({
    compileStatus: z.enum(["not_required", "passed", "failed"]),
    failures: z.array(boundedText(500)).max(5),
    passedTests: z.number().int().min(0).max(1_000),
    runner: boundedText(80),
    totalTests: z.number().int().min(0).max(1_000),
  })
  .strict()
  .refine((value) => value.passedTests <= value.totalTests, {
    message: "Passed tests cannot exceed total tests.",
  });

export const interviewEvidencePackageSchema = z
  .object({
    assembledAt: timestampSchema,
    code: z
      .object({
        source: z.enum(["interview_state", "realtime_event"]).nullable(),
        text: boundedText(MAX_EVIDENCE_CODE_CHARS),
        truncated: z.boolean(),
      })
      .strict(),
    coverage: z
      .object({
        hasCode: z.boolean(),
        hasFirstPartyQuestionContent: z.boolean(),
        hasTrustedTests: z.boolean(),
        phaseTimingCount: z.number().int().min(0).max(9),
        semanticCorrectness: z.enum([
          "unsupported",
          "prompt_only",
          "trusted_tests",
        ]),
        transcriptTruncated: z.boolean(),
        transcriptTurns: z
          .number()
          .int()
          .min(0)
          .max(MAX_EVIDENCE_TRANSCRIPT_TURNS),
        truncatedFields: z.array(boundedText(80)).max(30),
      })
      .strict(),
    interview: z
      .object({
        actualDifficulty: z.enum(["easy", "medium", "hard"]),
        completedAt: timestampSchema,
        difficultyMode: z.enum(["adaptive", "easy", "medium", "hard"]),
        durationMinutes: z.union([z.literal(30), z.literal(45), z.literal(60)]),
        elapsedSeconds: z.number().int().min(0).max(14_400),
        id: z.uuid(),
        interviewerLevel: z.enum(INTERVIEWER_LEVELS),
        language: z.enum(INTERVIEW_LANGUAGES),
        realtime: z
          .object({
            model: boundedText(120),
            provider: boundedText(40),
          })
          .strict()
          .nullable(),
        startedAt: timestampSchema,
      })
      .strict(),
    learnerOutcome: z
      .object({
        result: z.enum(["solved", "partial", "failed"]),
        retrospective: boundedText(4_000),
      })
      .strict(),
    phaseEvidence: z
      .object({
        bruteForce: boundedText(4_000),
        clarification: boundedText(4_000),
        complexity: z
          .object({
            space: boundedText(500),
            time: boundedText(500),
          })
          .strict(),
        examples: boundedText(4_000),
        optimization: boundedText(4_000),
        testing: boundedText(4_000),
      })
      .strict(),
    phaseTimings: z
      .array(
        z
          .object({
            completedAt: timestampSchema,
            durationSeconds: z.number().int().min(0).max(14_400),
            phase: z.enum(MOCK_INTERVIEW_PHASES.slice(0, -1)),
            source: z.literal("realtime_event"),
            startedAt: timestampSchema,
          })
          .strict(),
      )
      .max(9),
    problem: z
      .object({
        externalId: boundedText(80).nullable(),
        id: z.uuid(),
        primaryTopic: topicSchema,
        questionContent: firstPartyQuestionContentSchema.nullable(),
        secondaryTopics: z.array(topicSchema).max(12),
        title: boundedText(300),
      })
      .strict(),
    sessionEvents: z
      .array(
        z
          .object({
            occurredAt: timestampSchema,
            phase: z.enum(MOCK_INTERVIEW_PHASES.slice(0, -1)).nullable(),
            reference: boundedText(500),
            type: z.enum(["connection", "interruption", "help"]),
          })
          .strict(),
      )
      .max(40),
    transcript: z
      .array(
        z
          .object({
            eventId: z.number().int().positive(),
            occurredAt: timestampSchema,
            phase: z.enum(MOCK_INTERVIEW_PHASES.slice(0, -1)).nullable(),
            role: z.enum(["learner", "interviewer"]),
            text: boundedText(1_000),
            truncated: z.boolean(),
          })
          .strict(),
      )
      .max(MAX_EVIDENCE_TRANSCRIPT_TURNS),
    trustedTests: trustedTestResultsSchema.nullable(),
    version: z.literal(INTERVIEW_EVIDENCE_VERSION),
  })
  .strict();

export type FirstPartyQuestionContent = z.infer<
  typeof firstPartyQuestionContentSchema
>;
export type InterviewEvidencePackage = z.infer<
  typeof interviewEvidencePackageSchema
>;
export type TrustedTestResults = z.infer<typeof trustedTestResultsSchema>;

type MockInterviewRow = Tables<"mock_interviews">;
type RealtimeEventRow = Tables<"realtime_interview_events">;
type RealtimeSessionRow = Tables<"realtime_interview_sessions">;

export function buildInterviewEvidencePackage(input: {
  assembledAt: Date;
  interview: MockInterviewRow;
  problem: Problem;
  questionContent: FirstPartyQuestionContent | null;
  realtimeEvents: RealtimeEventRow[];
  realtimeSession: RealtimeSessionRow | null;
  trustedTests?: TrustedTestResults | null;
}): InterviewEvidencePackage | null {
  if (
    input.interview.status !== "completed" ||
    !input.interview.completed_at ||
    !input.interview.result
  ) {
    return null;
  }

  const events = input.realtimeSession
    ? input.realtimeEvents.filter(
        (event) =>
          event.session_id === input.realtimeSession!.id &&
          event.user_id === input.interview.user_id,
      )
    : [];
  const truncatedFields: string[] = [];
  const transcript = buildTranscript(events);
  if (transcript.truncated) truncatedFields.push("transcript");
  const code = latestCode(input.interview.code_snapshot ?? "", events);
  if (code.truncated) truncatedFields.push("code");
  const phaseEvidence = {
    bruteForce: truncate(
      input.interview.brute_force_notes ?? "",
      4_000,
      "phaseEvidence.bruteForce",
      truncatedFields,
    ),
    clarification: truncate(
      input.interview.clarification_notes ?? "",
      4_000,
      "phaseEvidence.clarification",
      truncatedFields,
    ),
    complexity: {
      space: truncate(
        input.interview.submitted_space_complexity ?? "",
        500,
        "phaseEvidence.complexity.space",
        truncatedFields,
      ),
      time: truncate(
        input.interview.submitted_time_complexity ?? "",
        500,
        "phaseEvidence.complexity.time",
        truncatedFields,
      ),
    },
    examples: truncate(
      input.interview.examples_notes ?? "",
      4_000,
      "phaseEvidence.examples",
      truncatedFields,
    ),
    optimization: truncate(
      input.interview.optimization_notes ?? "",
      4_000,
      "phaseEvidence.optimization",
      truncatedFields,
    ),
    testing: truncate(
      input.interview.testing_notes ?? "",
      4_000,
      "phaseEvidence.testing",
      truncatedFields,
    ),
  };
  const trustedTests = input.trustedTests ?? null;
  const phaseTimings = buildPhaseTimings(input.interview.started_at, events);
  const packageValue = {
    assembledAt: input.assembledAt.toISOString(),
    code,
    coverage: {
      hasCode: code.text.length > 0,
      hasFirstPartyQuestionContent: input.questionContent !== null,
      hasTrustedTests: trustedTests !== null,
      phaseTimingCount: phaseTimings.length,
      semanticCorrectness: trustedTests
        ? "trusted_tests"
        : input.questionContent
          ? "prompt_only"
          : "unsupported",
      transcriptTruncated: transcript.truncated,
      transcriptTurns: transcript.entries.length,
      truncatedFields,
    },
    interview: {
      actualDifficulty: input.problem.difficulty,
      completedAt: input.interview.completed_at,
      difficultyMode: input.interview.difficulty_mode,
      durationMinutes: input.interview.duration_minutes,
      elapsedSeconds: input.interview.elapsed_seconds,
      id: input.interview.id,
      interviewerLevel: input.interview.interviewer_level,
      language: normalizeInterviewLanguage(input.interview.interview_language),
      realtime: input.realtimeSession
        ? {
            model: input.realtimeSession.model,
            provider: input.realtimeSession.provider,
          }
        : null,
      startedAt: input.interview.started_at,
    },
    learnerOutcome: {
      result: input.interview.result,
      retrospective: truncate(
        input.interview.retrospective ?? "",
        4_000,
        "learnerOutcome.retrospective",
        truncatedFields,
      ),
    },
    phaseEvidence,
    phaseTimings,
    problem: {
      externalId: input.problem.external_id,
      id: input.problem.id,
      primaryTopic: toTopic(input.problem.primaryTopic),
      questionContent: input.questionContent,
      secondaryTopics: input.problem.secondaryTopics.slice(0, 12).map(toTopic),
      title: input.problem.title,
    },
    sessionEvents: events
      .filter((event) => event.event_type === "connection")
      .slice(-40)
      .map((event) => ({
        occurredAt: event.created_at,
        phase: normalizePhase(event.phase),
        reference: event.content.slice(0, 500),
        type: "connection" as const,
      })),
    transcript: transcript.entries,
    trustedTests,
    version: INTERVIEW_EVIDENCE_VERSION,
  };

  return interviewEvidencePackageSchema.parse(packageValue);
}

function buildTranscript(events: RealtimeEventRow[]) {
  const allEntries = events
    .filter((event) =>
      ["user_transcript", "assistant_transcript"].includes(event.event_type),
    )
    .map((event) => ({
      eventId: event.id,
      occurredAt: event.created_at,
      phase: normalizePhase(event.phase),
      role:
        event.event_type === "user_transcript"
          ? ("learner" as const)
          : ("interviewer" as const),
      text: event.content.slice(0, 1_000),
      truncated: event.content.length > 1_000,
    }));
  const turnLimited =
    allEntries.length <= MAX_EVIDENCE_TRANSCRIPT_TURNS
      ? allEntries
      : [
          ...allEntries.slice(0, MAX_EVIDENCE_TRANSCRIPT_TURNS / 2),
          ...allEntries.slice(-MAX_EVIDENCE_TRANSCRIPT_TURNS / 2),
        ];
  let totalCharacters = 0;
  const entries = turnLimited.flatMap((entry) => {
    const remaining = MAX_EVIDENCE_TRANSCRIPT_CHARS - totalCharacters;
    if (remaining <= 0) return [];
    const text = entry.text.slice(0, remaining);
    totalCharacters += text.length;
    return [
      {
        ...entry,
        text,
        truncated: entry.truncated || text.length < entry.text.length,
      },
    ];
  });
  return {
    entries,
    truncated:
      entries.length < allEntries.length ||
      entries.some((entry) => entry.truncated),
  };
}

function latestCode(interviewCode: string, events: RealtimeEventRow[]) {
  const realtimeCode = [...events]
    .reverse()
    .find((event) => event.event_type === "code_snapshot")?.content;
  const sourceText = realtimeCode ?? interviewCode;
  return {
    source: realtimeCode
      ? ("realtime_event" as const)
      : interviewCode
        ? ("interview_state" as const)
        : null,
    text: sourceText.slice(0, MAX_EVIDENCE_CODE_CHARS),
    truncated: sourceText.length > MAX_EVIDENCE_CODE_CHARS,
  };
}

function buildPhaseTimings(startedAt: string, events: RealtimeEventRow[]) {
  const boundaries = events.filter(
    (event) =>
      event.phase &&
      ["phase_context", "code_snapshot"].includes(event.event_type),
  );
  let currentStart = new Date(startedAt);
  return boundaries.slice(0, 9).flatMap((event) => {
    const completedAt = new Date(event.created_at);
    const phase = normalizePhase(event.phase);
    if (!phase || completedAt.getTime() < currentStart.getTime()) return [];
    const timing = {
      completedAt: completedAt.toISOString(),
      durationSeconds: Math.min(
        14_400,
        Math.floor((completedAt.getTime() - currentStart.getTime()) / 1_000),
      ),
      phase,
      source: "realtime_event" as const,
      startedAt: currentStart.toISOString(),
    };
    currentStart = completedAt;
    return [timing];
  });
}

function normalizePhase(value: string | null) {
  return (
    MOCK_INTERVIEW_PHASES.slice(0, -1).find((phase) => phase === value) ?? null
  );
}

function toTopic(topic: Problem["primaryTopic"]) {
  return { id: topic.id, name: topic.name, slug: topic.slug };
}

function truncate(
  value: string,
  maximum: number,
  field: string,
  truncatedFields: string[],
) {
  if (value.length <= maximum) return value;
  truncatedFields.push(field);
  return value.slice(0, maximum);
}
