import { z } from "zod";

import { MOCK_INTERVIEW_PHASES } from "@/domain/mock-interview";
import {
  INTERVIEW_CONVERSATION_LIFECYCLES,
  INTERVIEW_QUESTION_CYCLES,
} from "@/domain/interview-conversation-state";

export const activeInterviewPhaseSchema = z.enum([
  "intro",
  "clarify",
  "examples",
  "brute_force",
  "optimization",
  "implementation",
  "testing",
  "complexity",
  "retrospective",
]);

export const realtimeSessionRequestSchema = z.object({
  interviewId: z.uuid(),
  sdp: z.string().min(20).max(200_000),
});

export const geminiRealtimeSessionRequestSchema = z.object({
  interviewId: z.uuid(),
});

export const interviewConversationLifecycleSchema = z.enum(
  INTERVIEW_CONVERSATION_LIFECYCLES,
);
export const interviewQuestionCycleSchema = z.enum(INTERVIEW_QUESTION_CYCLES);

export const realtimeConnectionSnapshotSchema = z.object({
  codeSnapshot: z.string().max(30_000),
  concluding: z.boolean(),
  connectionAttemptId: z.uuid(),
  connectionCount: z.number().int().min(0),
  connectionMode: z.enum(["start", "resume"]),
  followUpPrompt: z.string().min(1).max(2_000).nullable(),
  lifecycle: interviewConversationLifecycleSchema,
  observedPhase: activeInterviewPhaseSchema.nullable(),
  observedPhaseEventId: z.string().regex(/^\d+$/).nullable(),
  primaryReadiness: z.enum(["incomplete", "ready", "completed"]),
  questionCycle: interviewQuestionCycleSchema,
  recentTranscript: z
    .array(
      z.object({
        id: z.string().regex(/^\d+$/),
        questionCycle: interviewQuestionCycleSchema,
        role: z.enum(["interviewer", "learner"]),
        text: z.string().min(1).max(8_000),
      }),
    )
    .max(6),
  remainingSeconds: z.number().int().min(0).max(14_400),
  version: z.number().int().min(1),
  workspaceVersion: z.number().int().min(0),
});

const reasonCodeSchema = z.string().regex(/^[a-z][a-z0-9_]{2,63}$/);

export const liveStageReportSchema = z.object({
  phase: activeInterviewPhaseSchema,
  questionCycle: interviewQuestionCycleSchema,
  reasonCode: reasonCodeSchema,
  signal: z.enum(["explicit", "inferred"]),
});

export const solutionReadinessReportSchema = z.object({
  algorithm: z.boolean(),
  complexity: z.boolean(),
  correctness: z.boolean(),
  dataStructures: z.boolean(),
  edgeCases: z.boolean(),
  operationOrder: z.boolean(),
  reasonCode: reasonCodeSchema,
});

export const interviewLifecycleToolSchema = z.object({
  reasonCode: reasonCodeSchema,
});

export const concludeInterviewToolSchema = z.object({
  reasonCode: z.enum([
    "enough_evidence",
    "time_low",
    "primary_complete",
    "follow_up_complete",
    "provider_limit",
  ]),
});

export const realtimeEventInputSchema = z
  .object({
    content: z.string().trim().min(1).max(50_000),
    eventType: z.enum([
      "user_transcript",
      "assistant_transcript",
      "code_snapshot",
      "phase_context",
      "connection",
    ]),
    phase: z.enum(MOCK_INTERVIEW_PHASES.slice(0, -1)).nullable(),
  })
  .superRefine((value, context) => {
    if (value.eventType !== "code_snapshot" && value.content.length > 8_000) {
      context.addIssue({
        code: "too_big",
        maximum: 8_000,
        origin: "string",
        path: ["content"],
        type: "string",
      });
    }
  });

export const realtimeSessionEndSchema = z.object({
  status: z.enum(["disconnected", "error"]),
  summary: z.string().trim().max(2_000).optional(),
});

export const voiceActivationResultSchema = z.object({
  elapsedSeconds: z.number().int().min(0).max(14_400),
  startedAt: z.iso.datetime({ offset: true }),
  timerRunning: z.boolean(),
  voiceActivatedAt: z.iso.datetime({ offset: true }),
});

export const phaseObservationResultSchema = z.object({
  accepted: z.boolean(),
  observedPhase: activeInterviewPhaseSchema,
  observedPhaseEventId: z.string().regex(/^\d+$/).nullable(),
  triggerEventId: z.string().regex(/^\d+$/),
});

export type RealtimeEventInput = z.infer<typeof realtimeEventInputSchema>;
export type ActiveInterviewPhase = z.infer<typeof activeInterviewPhaseSchema>;
export type RealtimeConnectionSnapshot = z.infer<
  typeof realtimeConnectionSnapshotSchema
>;
export type LiveStageReport = z.infer<typeof liveStageReportSchema>;
export type SolutionReadinessReport = z.infer<
  typeof solutionReadinessReportSchema
>;

export type RealtimeTranscriptEntry = {
  id: string;
  role: "interviewer" | "learner";
  text: string;
};

export type RealtimeConnectionState =
  | "idle"
  | "requesting_microphone"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected"
  | "error";
