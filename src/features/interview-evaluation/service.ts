import "server-only";

import { z } from "zod";

import { getInterviewEvaluatorConfig } from "@/features/interview-evaluation/config";
import {
  INTERVIEW_EVIDENCE_VERSION,
  type InterviewEvidencePackage,
} from "@/features/interview-evaluation/evidence-model";
import { assembleInterviewEvidencePackage } from "@/features/interview-evaluation/evidence";
import { GeminiInterviewEvaluatorProvider } from "@/features/interview-evaluation/gemini-provider";
import type { InterviewEvaluationRun } from "@/features/interview-evaluation/model";
import type { InterviewEvaluatorProvider } from "@/features/interview-evaluation/provider";
import { runInterviewEvaluation } from "@/features/interview-evaluation/runner";
import { createClient } from "@/lib/supabase/server";
import { recordOperationalEvent } from "@/lib/operational-events";
import type { Json } from "@/types/database";

export const INTERVIEW_EVALUATION_VERSION = 1;

const evaluationReservationSchema = z
  .object({
    evaluationId: z.uuid(),
    shouldEvaluate: z.boolean(),
    status: z.enum(["pending", "completed", "provisional", "failed"]),
    version: z.number().int().positive(),
  })
  .strict();

export function createInterviewEvaluatorProvider(): InterviewEvaluatorProvider | null {
  const config = getInterviewEvaluatorConfig();
  return config
    ? new GeminiInterviewEvaluatorProvider(config.apiKey, config.model)
    : null;
}

export async function evaluateCompletedInterview(
  userId: string,
  interviewId: string,
): Promise<InterviewEvaluationRun | null> {
  const evidence = await assembleInterviewEvidencePackage(userId, interviewId);
  return runInterviewEvaluation(evidence, createInterviewEvaluatorProvider());
}

export async function evaluateAndPersistCompletedInterview(
  userId: string,
  interviewId: string,
): Promise<InterviewEvaluationRun | null> {
  const startedAt = Date.now();
  recordOperationalEvent("interview_evaluation_requested", { interviewId });
  try {
    const evidence = await assembleInterviewEvidencePackage(
      userId,
      interviewId,
    );
    const provider = createInterviewEvaluatorProvider();
    const providerName = provider?.name ?? "deterministic";
    const providerModel = provider?.model ?? "deterministic-v1";
    const supabase = await createClient();
    const { data: reservationValue, error: reservationError } =
      await supabase.rpc("reserve_mock_interview_evaluation", {
        p_evaluation_version: INTERVIEW_EVALUATION_VERSION,
        p_evidence_version: INTERVIEW_EVIDENCE_VERSION,
        p_mock_interview_id: interviewId,
        p_model: providerModel,
        p_provider: providerName,
      });
    if (reservationError) {
      throw new Error("Interview evaluation could not be reserved.");
    }
    const reservation = evaluationReservationSchema.parse(reservationValue);
    if (!reservation.shouldEvaluate) return null;

    const run = await runInterviewEvaluation(evidence, provider);
    await persistEvaluationResult(reservation.evaluationId, evidence, run);
    recordOperationalEvent(
      run.status === "provisional"
        ? "interview_evaluation_provisional"
        : "interview_evaluation_completed",
      {
        interviewId,
        latencyMs: Date.now() - startedAt,
        model: run.model,
        provider: run.provider,
        status: run.status,
      },
    );
    return run;
  } catch (error) {
    recordOperationalEvent("interview_evaluation_failed", {
      errorCode: error instanceof Error ? error.message : "unknown_error",
      interviewId,
      latencyMs: Date.now() - startedAt,
    });
    throw error;
  }
}

async function persistEvaluationResult(
  evaluationId: string,
  evidence: InterviewEvidencePackage,
  run: InterviewEvaluationRun,
) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("finalize_mock_interview_evaluation", {
    p_confidence: run.evaluation.confidence,
    p_dimensions: run.evaluation.dimensions as Json,
    p_error_code: run.errorCode ?? "",
    p_evaluation_id: evaluationId,
    p_evidence_coverage: evidence.coverage as Json,
    p_improvements: run.evaluation.improvements,
    p_input_tokens: run.usage.inputTokens,
    p_output_tokens: run.usage.outputTokens,
    p_raw_score: run.evaluation.rawScore,
    p_recommended_actions: run.evaluation.recommendedActions as Json,
    p_recurring_signals: run.evaluation.recurringSignals,
    p_status: run.status,
    p_strengths: run.evaluation.strengths,
    p_summary: run.evaluation.summary,
    p_total_tokens: run.usage.totalTokens,
  });
  if (error) throw new Error("Interview evaluation could not be finalized.");
}
