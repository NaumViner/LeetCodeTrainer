import { z } from "zod";

import { MOCK_INTERVIEW_PHASES } from "@/domain/mock-interview";

export const mockInterviewIdSchema = z.uuid();
export const mockInterviewSetupSchema = z.object({
  difficulty: z.enum(["adaptive", "easy", "medium", "hard"]),
  durationMinutes: z.coerce
    .number()
    .int()
    .pipe(z.union([z.literal(30), z.literal(45), z.literal(60)])),
});

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
