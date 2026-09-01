import { isConfiguredServerSecret, parseServerEnv } from "@/lib/env";

export type AiCoachConfig = {
  apiKey: string;
  model: string;
  provider: "gemini" | "openai";
};

export function getAiCoachConfig(): AiCoachConfig | null {
  const env = parseServerEnv();
  if (!env.AI_COACH_ENABLED) return null;
  const provider = (
    env.AI_PROVIDER ?? (env.GEMINI_API_KEY ? "gemini" : "openai")
  ).toLowerCase();
  if (provider === "gemini") {
    const apiKey = env.GEMINI_API_KEY ?? env.AI_API_KEY;
    if (!isConfiguredServerSecret(apiKey)) return null;
    return {
      apiKey,
      model: env.AI_MODEL ?? "gemini-3.5-flash",
      provider: "gemini",
    };
  }
  if (provider !== "openai" || !isConfiguredServerSecret(env.AI_API_KEY))
    return null;
  return {
    apiKey: env.AI_API_KEY,
    model: env.AI_MODEL ?? "gpt-5.4-mini",
    provider: "openai",
  };
}

export function isAiCoachEnabled() {
  return getAiCoachConfig() !== null;
}
