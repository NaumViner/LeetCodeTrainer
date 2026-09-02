import { z } from "zod";

import {
  canTransitionMockInterview,
  INTERVIEWER_LEVELS,
  INTERVIEW_LANGUAGES,
  MOCK_INTERVIEW_PHASES,
} from "@/domain/mock-interview";

export const mockInterviewIdSchema = z.uuid();
const interviewDifficultySchema = z.enum(["easy", "medium", "hard"]);

export const mockInterviewSetupSchema = z
  .object({
    codingLanguage: z.enum(["python", "java"]),
    customDifficulty: interviewDifficultySchema.nullable(),
    difficulties: z.array(interviewDifficultySchema).max(3),
    durationMinutes: z.coerce
      .number()
      .int()
      .pipe(z.union([z.literal(30), z.literal(45), z.literal(60)])),
    interviewerLevel: z.enum(INTERVIEWER_LEVELS),
    interviewLanguage: z.enum(INTERVIEW_LANGUAGES),
    requestedTopicId: z.uuid().nullable(),
    selectionMode: z.enum(["coverage", "improvement", "learning", "custom"]),
  })
  .superRefine((value, context) => {
    if (
      (value.selectionMode === "coverage" ||
        value.selectionMode === "improvement") &&
      (value.difficulties.length === 0 ||
        new Set(value.difficulties).size !== value.difficulties.length)
    ) {
      context.addIssue({
        code: "custom",
        message: "Select at least one unique difficulty.",
        path: ["difficulties"],
      });
    }
    if (
      value.selectionMode === "custom" &&
      (!value.requestedTopicId || !value.customDifficulty)
    ) {
      context.addIssue({
        code: "custom",
        message: "Choose one topic and one exact difficulty.",
        path: ["requestedTopicId"],
      });
    }
  });

export type MockInterviewSetup = z.infer<typeof mockInterviewSetupSchema>;

export type MockInterviewStartActionState = {
  message: string;
  status: "error" | "idle";
};

export const initialMockInterviewStartActionState = {
  message: "",
  status: "idle",
} satisfies MockInterviewStartActionState;

export const mockInterviewDeleteSchema = z.object({
  confirmation: z.literal("delete"),
  interviewId: z.uuid(),
});

export type MockInterviewDeleteActionState = {
  message: string;
  status: "error" | "idle" | "success";
};

export const initialMockInterviewDeleteActionState = {
  message: "",
  status: "idle",
} satisfies MockInterviewDeleteActionState;

export const mockInterviewAdvanceSchema = z.object({
  elapsedSeconds: z.number().int().min(0).max(14_400),
  notes: z.string().trim().max(50_000).optional(),
  spaceComplexity: z.string().trim().max(120).optional(),
  targetPhase: z.enum(MOCK_INTERVIEW_PHASES),
  timeComplexity: z.string().trim().max(120).optional(),
});

export const mockInterviewWorkspaceSaveSchema = z.object({
  codeSnapshot: z.string().max(30_000),
  expectedVersion: z.number().int().min(0),
  scratchpad: z.string().max(10_000),
});

export const mockInterviewCodeSubmissionSchema =
  mockInterviewWorkspaceSaveSchema.extend({
    advanceToTesting: z.boolean(),
    elapsedSeconds: z.number().int().min(0).max(14_400),
  });

export const mockInterviewCodeSubmissionResultSchema = z.object({
  advancedToTesting: z.boolean(),
  submissionId: z.uuid(),
  submittedAt: z.iso.datetime({ offset: true }),
  workspaceVersion: z.number().int().positive(),
});

const activeMockInterviewPhaseSchema = z.enum(
  MOCK_INTERVIEW_PHASES.slice(0, -1),
);

export const mockInterviewPhaseSuggestionSchema = z
  .object({
    evidenceEventIds: z
      .array(
        z
          .string()
          .regex(/^\d+$/)
          .refine((value) => Number.isSafeInteger(Number(value))),
      )
      .min(1)
      .max(12),
    expectedCurrentPhase: activeMockInterviewPhaseSchema,
    reasonCode: z.string().regex(/^[a-z][a-z0-9_]{2,63}$/),
    suggestedNextPhase: activeMockInterviewPhaseSchema,
  })
  .superRefine((value, context) => {
    if (
      !canTransitionMockInterview(
        value.expectedCurrentPhase,
        value.suggestedNextPhase,
      )
    ) {
      context.addIssue({
        code: "custom",
        message: "Only the immediately next interview phase may be suggested.",
        path: ["suggestedNextPhase"],
      });
    }
    if (
      new Set(value.evidenceEventIds).size !== value.evidenceEventIds.length
    ) {
      context.addIssue({
        code: "custom",
        message: "Phase suggestion evidence must be unique.",
        path: ["evidenceEventIds"],
      });
    }
  });

export type MockInterviewPhaseSuggestionActionResult =
  | {
      eventId: string;
      status: "success";
      suggestedNextPhase: z.infer<typeof activeMockInterviewPhaseSchema>;
    }
  | { message: string; status: "error" | "stale" };

export type MockInterviewWorkspaceActionResult =
  | { status: "success"; workspaceVersion: number }
  | { message: string; status: "conflict" | "error" };

export type MockInterviewCodeSubmissionActionResult =
  | {
      advancedToTesting: boolean;
      status: "success";
      submissionId: string;
      submittedAt: string;
      workspaceVersion: number;
    }
  | { message: string; status: "conflict" | "error" };

export const mockInterviewCompletionSchema = z.object({
  codeQualityRating: z.number().int().min(1).max(5),
  communicationRating: z.number().int().min(1).max(5),
  complexityRating: z.number().int().min(1).max(5),
  elapsedSeconds: z.number().int().min(0).max(14_400),
  independenceRating: z.number().int().min(1).max(5),
  result: z.enum(["solved", "partial", "failed"]),
  retrospective: z.string().trim().min(1).max(4_000),
});

export type MockInterviewActionResult =
  { status: "success" } | { message: string; status: "error" };
