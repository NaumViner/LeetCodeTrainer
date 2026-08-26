import { z } from "zod";

import { ATTEMPT_PHASES } from "@/domain/practice";

const shortText = z.string().trim().min(1).max(200);
const duration = z.number().int().min(0).max(86_400);

export const attemptIdSchema = z.uuid();

export const timerInputSchema = z.object({
  durationSeconds: duration,
  running: z.boolean(),
});

export const preAttemptInputSchema = timerInputSchema.extend({
  bruteForceApproach: z.string().trim().min(1).max(2000),
  bruteForceComplexity: z.string().trim().min(1).max(120),
  confidenceBefore: z.number().int().min(1).max(5),
  predictedPattern: shortText,
});

export const progressInputSchema = timerInputSchema.extend({
  codeSnapshot: z.string().max(50_000).optional(),
  targetPhase: z.enum(ATTEMPT_PHASES),
});

export const reflectionInputSchema = z.object({
  complexityCorrect: z.boolean().nullable(),
  confidenceAfter: z.number().int().min(1).max(5),
  correctPattern: shortText,
  durationSeconds: duration,
  edgeCasesMissed: z.array(z.string().trim().min(1).max(300)).max(12),
  mistakes: z.array(z.string().trim().min(1).max(300)).max(12),
  recognizedPatternCorrectly: z.boolean(),
  result: z.enum(["solved", "partial", "failed"]),
  spaceComplexity: z.string().trim().min(1).max(120),
  takeaway: z.string().trim().min(1).max(2000),
  timeComplexity: z.string().trim().min(1).max(120),
});

export type PracticeActionResult<T = undefined> =
  { data: T; status: "success" } | { message: string; status: "error" };
