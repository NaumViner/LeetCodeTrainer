import { z } from "zod";

import type { InterviewEvidencePackage } from "@/features/interview-evaluation/evidence-model";

export const INTERVIEW_EVALUATION_DIMENSIONS = [
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
] as const;

export type InterviewEvaluationDimension =
  (typeof INTERVIEW_EVALUATION_DIMENSIONS)[number];

export const interviewEvaluationDimensionLabels: Record<
  InterviewEvaluationDimension,
  string
> = {
  approachQuality: "Approach quality",
  clarification: "Clarification",
  codeQuality: "Code quality",
  communication: "Communication",
  complexityReasoning: "Complexity reasoning",
  correctness: "Correctness",
  independence: "Independence",
  optimization: "Optimization",
  problemUnderstanding: "Problem understanding",
  testing: "Testing",
};

const evidenceReferenceSchema = z
  .object({
    reference: z.string().trim().min(3).max(300),
    source: z.enum(["transcript", "code", "phase_note", "timing", "test"]),
  })
  .strict();

export const dimensionEvaluationSchema = z
  .object({
    confidence: z.number().min(0).max(1),
    evidence: z.array(evidenceReferenceSchema).min(1).max(5),
    rationale: z.string().trim().min(10).max(1_000),
    score: z.union([
      z.literal(1),
      z.literal(2),
      z.literal(3),
      z.literal(4),
      z.literal(5),
    ]),
  })
  .strict();

export const recommendedActionSchema = z
  .object({
    actionType: z.enum([
      "next_interview",
      "problem",
      "topic_drill",
      "testing_drill",
      "complexity_drill",
      "communication_drill",
      "lesson",
      "review",
    ]),
    estimatedMinutes: z.number().int().min(5).max(180),
    priority: z.number().int().min(1).max(5),
    rationale: z.string().trim().min(10).max(500),
    target: z.string().trim().min(2).max(160),
    title: z.string().trim().min(3).max(160),
  })
  .strict();

const dimensionsShape = Object.fromEntries(
  INTERVIEW_EVALUATION_DIMENSIONS.map((dimension) => [
    dimension,
    dimensionEvaluationSchema,
  ]),
) as Record<InterviewEvaluationDimension, typeof dimensionEvaluationSchema>;

export const interviewEvaluationPayloadSchema = z
  .object({
    confidence: z.number().min(0).max(1),
    dimensions: z.object(dimensionsShape).strict(),
    improvements: z.array(z.string().trim().min(3).max(300)).min(1).max(6),
    recommendedActions: z.array(recommendedActionSchema).min(1).max(6),
    recurringSignals: z.array(z.string().trim().min(3).max(300)).max(6),
    strengths: z.array(z.string().trim().min(3).max(300)).max(6),
    summary: z.string().trim().min(10).max(2_000),
  })
  .strict();

export const interviewEvaluationSchema = interviewEvaluationPayloadSchema
  .extend({
    rawScore: z.number().min(0).max(100),
  })
  .strict();

export type DimensionEvaluation = z.infer<typeof dimensionEvaluationSchema>;
export type InterviewEvaluationPayload = z.infer<
  typeof interviewEvaluationPayloadSchema
>;
export type InterviewEvaluation = z.infer<typeof interviewEvaluationSchema>;
export type RecommendedAction = z.infer<typeof recommendedActionSchema>;

export type EvaluatorUsage = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
};

export type InterviewEvaluatorResult = {
  data: InterviewEvaluationPayload;
  usage: EvaluatorUsage;
};

export type InterviewEvaluationRun = {
  errorCode: string | null;
  evaluation: InterviewEvaluation;
  model: string;
  provider: string;
  source: "ai" | "fallback";
  status: "completed" | "provisional";
  usage: EvaluatorUsage;
};

export function finalizeInterviewEvaluation(
  payload: InterviewEvaluationPayload,
  evidence: InterviewEvidencePackage,
): InterviewEvaluation {
  const parsed = interviewEvaluationPayloadSchema.parse(payload);
  validateEvaluationEvidence(parsed, evidence);
  const rawScore =
    Math.round(
      (INTERVIEW_EVALUATION_DIMENSIONS.reduce(
        (total, dimension) => total + parsed.dimensions[dimension].score,
        0,
      ) /
        INTERVIEW_EVALUATION_DIMENSIONS.length) *
        2_000,
    ) / 100;
  return interviewEvaluationSchema.parse({ ...parsed, rawScore });
}

function validateEvaluationEvidence(
  evaluation: InterviewEvaluationPayload,
  evidence: InterviewEvidencePackage,
) {
  const correctness = evaluation.dimensions.correctness;
  const maximumCorrectnessConfidence =
    evidence.coverage.semanticCorrectness === "trusted_tests"
      ? 1
      : evidence.coverage.semanticCorrectness === "prompt_only"
        ? 0.7
        : 0.35;
  if (correctness.confidence > maximumCorrectnessConfidence) {
    throw new Error("evaluation_correctness_confidence_unsupported");
  }

  for (const dimension of INTERVIEW_EVALUATION_DIMENSIONS) {
    for (const reference of evaluation.dimensions[dimension].evidence) {
      if (reference.source === "test" && !evidence.coverage.hasTrustedTests) {
        throw new Error("evaluation_test_evidence_unavailable");
      }
      if (
        reference.source === "transcript" &&
        evidence.coverage.transcriptTurns === 0
      ) {
        throw new Error("evaluation_transcript_evidence_unavailable");
      }
      if (reference.source === "code" && !evidence.coverage.hasCode) {
        throw new Error("evaluation_code_evidence_unavailable");
      }
    }
  }
}
