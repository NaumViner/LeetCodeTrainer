import { isConfiguredServerSecret, parseServerEnv } from "@/lib/env";

type RealtimeInterviewBaseConfig = {
  apiKey: string;
  model: string;
  voice: string;
};

export type RealtimeInterviewConfig =
  | (RealtimeInterviewBaseConfig & {
      provider: "gemini";
    })
  | (RealtimeInterviewBaseConfig & {
      provider: "openai";
      transcriptionModel: string;
    });

export function getRealtimeInterviewConfig(): RealtimeInterviewConfig | null {
  const env = parseServerEnv();
  if (!env.REALTIME_AI_ENABLED) return null;
  const provider = (
    env.REALTIME_AI_PROVIDER ?? (env.GEMINI_API_KEY ? "gemini" : "openai")
  ).toLowerCase();
  if (provider === "gemini") {
    const apiKey = env.GEMINI_API_KEY ?? env.REALTIME_AI_API_KEY;
    if (!isConfiguredServerSecret(apiKey)) return null;
    return {
      apiKey,
      model: env.REALTIME_AI_MODEL ?? "gemini-3.1-flash-live-preview",
      provider: "gemini",
      voice: env.REALTIME_AI_VOICE ?? "Kore",
    };
  }
  if (
    provider !== "openai" ||
    !isConfiguredServerSecret(env.REALTIME_AI_API_KEY)
  )
    return null;
  return {
    apiKey: env.REALTIME_AI_API_KEY,
    model: env.REALTIME_AI_MODEL ?? "gpt-realtime",
    provider: "openai",
    transcriptionModel:
      env.REALTIME_AI_TRANSCRIPTION_MODEL ?? "gpt-4o-mini-transcribe",
    voice: env.REALTIME_AI_VOICE ?? "marin",
  };
}

export function isRealtimeInterviewEnabled() {
  return getRealtimeInterviewConfig() !== null;
}

export function getRealtimeInterviewProviderName() {
  return getRealtimeInterviewConfig()?.provider ?? null;
}
