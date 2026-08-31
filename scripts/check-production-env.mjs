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
  requireValue("AI_API_KEY");
  const provider = (environment.AI_PROVIDER ?? "openai").toLowerCase();
  if (provider !== "openai") errors.push("AI_PROVIDER must be openai.");
}

if (enabled("REALTIME_AI_ENABLED")) {
  requireValue("REALTIME_AI_API_KEY");
  const provider = (environment.REALTIME_AI_PROVIDER ?? "openai").toLowerCase();
  if (provider !== "openai") {
    errors.push("REALTIME_AI_PROVIDER must be openai.");
  }
}

if (errors.length) {
  console.error("Production environment validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `Production environment is valid. AI coach: ${environment.AI_COACH_ENABLED === "true" ? "enabled" : "disabled"}; realtime voice: ${environment.REALTIME_AI_ENABLED === "true" ? "enabled" : "disabled"}.`,
);
