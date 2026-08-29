import { parseServerEnv } from "@/lib/env";

export type AiCoachConfig = {
  apiKey: string;
  model: string;
  provider: "openai";
};

export function getAiCoachConfig(): AiCoachConfig | null {
  const env = parseServerEnv();
  if (!env.AI_COACH_ENABLED || !env.AI_API_KEY) return null;
  const provider = (env.AI_PROVIDER ?? "openai").toLowerCase();
  if (provider !== "openai") return null;
  return {
    apiKey: env.AI_API_KEY,
    model: env.AI_MODEL ?? "gpt-5.4-mini",
    provider: "openai",
  };
}

export function isAiCoachEnabled() {
  return getAiCoachConfig() !== null;
}
