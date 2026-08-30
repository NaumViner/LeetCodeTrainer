import { z } from "zod";

const optionalUrl = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.url().optional(),
);
const optionalString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().min(1).optional(),
);
const optionalBoolean = z.preprocess(
  (value) =>
    value === "" || value === undefined
      ? undefined
      : value === "true"
        ? true
        : value === "false"
          ? false
          : value,
  z.boolean().optional(),
);

export const serverEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: optionalUrl,
  NEXT_PUBLIC_SUPABASE_URL: optionalUrl,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: optionalString,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: optionalString,
  SUPABASE_SERVICE_ROLE_KEY: optionalString,
  AI_PROVIDER: optionalString,
  AI_MODEL: optionalString,
  AI_API_KEY: optionalString,
  AI_COACH_ENABLED: optionalBoolean,
  REALTIME_AI_PROVIDER: optionalString,
  REALTIME_AI_MODEL: optionalString,
  REALTIME_AI_API_KEY: optionalString,
  REALTIME_AI_ENABLED: optionalBoolean,
  REALTIME_AI_TRANSCRIPTION_MODEL: optionalString,
  REALTIME_AI_VOICE: optionalString,
  ANALYTICS_PROVIDER: optionalString,
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function parseServerEnv(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): ServerEnv {
  return serverEnvSchema.parse(environment);
}
