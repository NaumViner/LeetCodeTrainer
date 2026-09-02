const environment = process.env;
const errors = [];

function requireValue(name) {
  const value = environment[name]?.trim();
  if (!value) errors.push(`${name} is required.`);
  return value;
}

function requireHttps(name, value) {
  if (!value) return;
  try {
    const url = new URL(value.startsWith("http") ? value : `https://${value}`);
    if (url.protocol !== "https:") {
      errors.push(`${name} must use HTTPS.`);
    }
  } catch {
    errors.push(`${name} must be a valid URL.`);
  }
}

function enabled(name) {
  const value = environment[name];
  if (value && value !== "true" && value !== "false") {
    errors.push(`${name} must be true or false.`);
  }
  return value === "true";
}

function rolloutEnabled(name) {
  return environment[name] === undefined ? true : enabled(name);
}

const appUrl =
  environment.NEXT_PUBLIC_APP_URL?.trim() ||
  (environment.VERCEL_ENV === "preview"
    ? environment.VERCEL_URL?.trim()
    : undefined);
if (!appUrl) {
  errors.push(
    "NEXT_PUBLIC_APP_URL is required for production (Vercel preview URLs are detected automatically).",
  );
}
requireHttps("Application URL", appUrl);

const supabaseUrl = requireValue("NEXT_PUBLIC_SUPABASE_URL");
requireHttps("NEXT_PUBLIC_SUPABASE_URL", supabaseUrl);
if (
  !environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() &&
  !environment.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
) {
  errors.push(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is required (legacy ANON_KEY is accepted).",
  );
}

if (enabled("AI_COACH_ENABLED")) {
  const provider = (
    environment.AI_PROVIDER ??
    (environment.GEMINI_API_KEY ? "gemini" : "openai")
  ).toLowerCase();
  if (!["gemini", "openai"].includes(provider)) {
    errors.push("AI_PROVIDER must be gemini or openai.");
  } else if (provider === "gemini") {
    if (
      !environment.GEMINI_API_KEY?.trim() &&
      !environment.AI_API_KEY?.trim()
    ) {
      errors.push(
        "GEMINI_API_KEY is required when the Gemini AI coach is enabled.",
      );
    }
  } else {
    requireValue("AI_API_KEY");
  }
}

if (enabled("INTERVIEW_EVALUATOR_ENABLED")) {
  const provider = (
    environment.INTERVIEW_EVALUATOR_PROVIDER ?? "gemini"
  ).toLowerCase();
  if (provider !== "gemini") {
    errors.push("INTERVIEW_EVALUATOR_PROVIDER must currently be gemini.");
  } else if (
    !environment.GEMINI_API_KEY?.trim() &&
    !environment.INTERVIEW_EVALUATOR_API_KEY?.trim()
  ) {
    errors.push(
      "GEMINI_API_KEY is required when the post-interview evaluator is enabled.",
    );
  }
}

if (enabled("REALTIME_AI_ENABLED")) {
  const provider = (
    environment.REALTIME_AI_PROVIDER ??
    (environment.GEMINI_API_KEY ? "gemini" : "openai")
  ).toLowerCase();
  if (!["gemini", "openai"].includes(provider)) {
    errors.push("REALTIME_AI_PROVIDER must be gemini or openai.");
  } else if (provider === "gemini") {
    if (
      !environment.GEMINI_API_KEY?.trim() &&
      !environment.REALTIME_AI_API_KEY?.trim()
    ) {
      errors.push(
        "GEMINI_API_KEY is required when Gemini realtime voice is enabled.",
      );
    }
  } else {
    requireValue("REALTIME_AI_API_KEY");
  }
}

const interviewSelectionModesEnabled = rolloutEnabled(
  "INTERVIEW_SELECTION_MODES_ENABLED",
);
const interviewPromptContentEnabled = rolloutEnabled(
  "INTERVIEW_PROMPT_CONTENT_ENABLED",
);
const interviewCodingWorkspaceEnabled = rolloutEnabled(
  "INTERVIEW_CODING_WORKSPACE_ENABLED",
);

if (errors.length) {
  console.error("Production environment validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `Production environment is valid. AI coach: ${environment.AI_COACH_ENABLED === "true" ? "enabled" : "disabled"}; interview evaluator: ${environment.INTERVIEW_EVALUATOR_ENABLED === "true" ? "enabled" : "disabled"}; realtime voice: ${environment.REALTIME_AI_ENABLED === "true" ? "enabled" : "disabled"}; interview selection modes: ${interviewSelectionModesEnabled ? "enabled" : "disabled"}; embedded prompts: ${interviewPromptContentEnabled ? "enabled" : "disabled"}; coding workspace: ${interviewCodingWorkspaceEnabled ? "enabled" : "disabled"}.`,
);
