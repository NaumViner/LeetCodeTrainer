import { z } from "zod";

import {
  INTERVIEWER_LEVELS,
  INTERVIEW_LANGUAGES,
  MOCK_INTERVIEW_PHASES,
} from "@/domain/mock-interview";

export const mockInterviewIdSchema = z.uuid();
export const mockInterviewSetupSchema = z.object({
  difficulty: z.enum(["adaptive", "easy", "medium", "hard"]),
  durationMinutes: z.coerce
    .number()
    .int()
    .pipe(z.union([z.literal(30), z.literal(45), z.literal(60)])),
  interviewerLevel: z.enum(INTERVIEWER_LEVELS),
  interviewLanguage: z.enum(INTERVIEW_LANGUAGES),
});

export type MockInterviewStartActionState = {
  message: string;
  status: "error" | "idle";
};

export const initialMockInterviewStartActionState = {
  message: "",
  status: "idle",
} satisfies MockInterviewStartActionState;

export const mockInterviewAdvanceSchema = z.object({
  elapsedSeconds: z.number().int().min(0).max(14_400),
  notes: z.string().trim().max(50_000).optional(),
  spaceComplexity: z.string().trim().max(120).optional(),
  targetPhase: z.enum(MOCK_INTERVIEW_PHASES),
  timeComplexity: z.string().trim().max(120).optional(),
});

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
