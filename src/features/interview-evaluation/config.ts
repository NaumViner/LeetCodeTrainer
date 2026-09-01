import { isConfiguredServerSecret, parseServerEnv } from "@/lib/env";

export type InterviewEvaluatorConfig = {
  apiKey: string;
  model: string;
  provider: "gemini";
};

export function getInterviewEvaluatorConfig(): InterviewEvaluatorConfig | null {
  const env = parseServerEnv();
  if (!env.INTERVIEW_EVALUATOR_ENABLED) return null;
  const provider = (env.INTERVIEW_EVALUATOR_PROVIDER ?? "gemini").toLowerCase();
  if (provider !== "gemini") return null;
  const apiKey = env.GEMINI_API_KEY ?? env.INTERVIEW_EVALUATOR_API_KEY;
  if (!isConfiguredServerSecret(apiKey)) return null;
  return {
    apiKey,
    model: env.INTERVIEW_EVALUATOR_MODEL ?? "gemini-3.5-flash",
    provider: "gemini",
  };
}
