import { z } from "zod";

export const CODE_RUNNER_LANGUAGES = [
  "javascript",
  "typescript",
  "python",
  "java",
  "cpp",
] as const;

export const trustedCodeRunRequestSchema = z
  .object({
    language: z.enum(CODE_RUNNER_LANGUAGES),
    questionContentVersion: z.number().int().positive(),
    questionId: z.string().trim().min(1).max(120),
    source: z.string().max(30_000),
  })
  .strict();

export const trustedCodeRunResultSchema = z
  .object({
    compileStatus: z.enum(["not_required", "passed", "failed"]),
    failures: z.array(z.string().trim().min(1).max(500)).max(5),
    passedTests: z.number().int().min(0).max(1_000),
    runner: z.string().trim().min(1).max(80),
    totalTests: z.number().int().min(0).max(1_000),
  })
  .strict()
  .refine((value) => value.passedTests <= value.totalTests, {
    message: "Passed tests cannot exceed total tests.",
  });

export type TrustedCodeRunRequest = z.infer<typeof trustedCodeRunRequestSchema>;
export type TrustedCodeRunResult = z.infer<typeof trustedCodeRunResultSchema>;
