import type { MockInterviewPhase } from "@/domain/mock-interview";

export const INTERVIEW_CONVERSATION_LIFECYCLES = [
  "primary_question",
  "primary_completed",
  "follow_up",
  "follow_up_completed",
  "concluding",
] as const;

export const INTERVIEW_QUESTION_CYCLES = ["primary", "follow_up"] as const;

export const SOLUTION_READINESS_ITEMS = [
  "algorithm",
  "dataStructures",
  "operationOrder",
  "correctness",
  "edgeCases",
  "complexity",
] as const;

export type InterviewConversationLifecycle =
  (typeof INTERVIEW_CONVERSATION_LIFECYCLES)[number];
export type InterviewQuestionCycle = (typeof INTERVIEW_QUESTION_CYCLES)[number];
export type ActiveInterviewPhase = Exclude<MockInterviewPhase, "completed">;

export type SolutionReadinessChecklist = {
  algorithm: boolean;
  complexity: boolean;
  correctness: boolean;
  dataStructures: boolean;
  edgeCases: boolean;
  operationOrder: boolean;
};

export function isSolutionReady(checklist: SolutionReadinessChecklist) {
  return SOLUTION_READINESS_ITEMS.every((item) => checklist[item]);
}

export function canTransitionConversationLifecycle(
  current: InterviewConversationLifecycle,
  target: InterviewConversationLifecycle,
) {
  if (current === target) return true;
  const allowed: Record<
    InterviewConversationLifecycle,
    InterviewConversationLifecycle[]
  > = {
    concluding: [],
    follow_up: ["follow_up_completed", "concluding"],
    follow_up_completed: ["concluding"],
    primary_completed: ["follow_up", "concluding"],
    primary_question: ["primary_completed", "concluding"],
  };
  return allowed[current].includes(target);
}

export function connectionModeForState(input: {
  connectionCount: number;
  transcriptTurnCount: number;
}) {
  return input.connectionCount === 0 && input.transcriptTurnCount === 0
    ? ("start" as const)
    : ("resume" as const);
}

export function remainingInterviewSeconds(input: {
  durationMinutes: number;
  elapsedSeconds: number;
}) {
  return Math.max(0, input.durationMinutes * 60 - input.elapsedSeconds);
}

export function canRequestFollowUp(input: {
  lifecycle: InterviewConversationLifecycle;
  hasApprovedPrompt: boolean;
  remainingSeconds: number;
}) {
  return (
    input.lifecycle === "primary_completed" &&
    input.hasApprovedPrompt &&
    input.remainingSeconds >= 600
  );
}
