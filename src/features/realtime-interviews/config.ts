import { parseServerEnv } from "@/lib/env";

export type RealtimeInterviewConfig = {
  apiKey: string;
  model: string;
  provider: "openai";
  transcriptionModel: string;
  voice: string;
};

export function getRealtimeInterviewConfig(): RealtimeInterviewConfig | null {
  const env = parseServerEnv();
  if (!env.REALTIME_AI_ENABLED || !env.REALTIME_AI_API_KEY) return null;
  const provider = (env.REALTIME_AI_PROVIDER ?? "openai").toLowerCase();
  if (provider !== "openai") return null;
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
