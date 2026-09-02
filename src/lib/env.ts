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
  GEMINI_API_KEY: optionalString,
  INTERVIEW_EVALUATOR_API_KEY: optionalString,
  INTERVIEW_EVALUATOR_ENABLED: optionalBoolean,
  INTERVIEW_EVALUATOR_MODEL: optionalString,
  INTERVIEW_EVALUATOR_PROVIDER: optionalString,
  INTERVIEW_CODING_WORKSPACE_ENABLED: optionalBoolean,
  INTERVIEW_PROMPT_CONTENT_ENABLED: optionalBoolean,
  INTERVIEW_SELECTION_MODES_ENABLED: optionalBoolean,
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

export function isConfiguredServerSecret(
  value: string | undefined,
): value is string {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return (
    normalized.length > 0 &&
    !normalized.startsWith("replace-with-") &&
    !normalized.startsWith("your-")
  );
}
