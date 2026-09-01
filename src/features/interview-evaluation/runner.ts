import { ZodError } from "zod";

import type { InterviewEvidencePackage } from "@/features/interview-evaluation/evidence-model";
import { createFallbackInterviewEvaluation } from "@/features/interview-evaluation/fallback";
import {
  finalizeInterviewEvaluation,
  type InterviewEvaluationRun,
} from "@/features/interview-evaluation/model";
import type { InterviewEvaluatorProvider } from "@/features/interview-evaluation/provider";

const emptyUsage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };

export async function runInterviewEvaluation(
  evidence: InterviewEvidencePackage,
  provider: InterviewEvaluatorProvider | null,
): Promise<InterviewEvaluationRun> {
  if (!provider) {
    return {
      errorCode: "provider_unconfigured",
      evaluation: createFallbackInterviewEvaluation(evidence),
      model: "deterministic-v1",
      provider: "deterministic",
      source: "fallback",
      status: "provisional",
      usage: emptyUsage,
    };
  }

  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const result = await provider.evaluate(evidence);
      return {
        errorCode: null,
        evaluation: finalizeInterviewEvaluation(result.data, evidence),
        model: provider.model,
        provider: provider.name,
        source: "ai",
        status: "completed",
        usage: result.usage,
      };
    } catch (error) {
      lastError = error;
    }
  }

  return {
    errorCode: evaluatorErrorCode(lastError),
    evaluation: createFallbackInterviewEvaluation(evidence),
    model: provider.model,
    provider: provider.name,
    source: "fallback",
    status: "provisional",
    usage: emptyUsage,
  };
}

function evaluatorErrorCode(error: unknown) {
  if (error instanceof ZodError || error instanceof SyntaxError) {
    return "invalid_output";
  }
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (message.includes("timeout") || message.includes("aborted")) {
    return "timeout";
  }
  if (message.startsWith("evaluation_") || message.includes("output_missing")) {
    return "invalid_output";
  }
  return "provider_error";
}
