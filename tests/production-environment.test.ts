import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
const baseline = {
  NODE_ENV: "test" as const,
  NEXT_PUBLIC_APP_URL: "https://interview.test",
  NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "test-public-key",
  SUPABASE_SERVICE_ROLE_KEY: "test-server-key",
  CRON_SECRET: "s".repeat(32),
  GEMINI_API_KEY: "test-provider-key",
  REALTIME_AI_ENABLED: "true",
  REALTIME_AI_PROVIDER: "gemini",
  INTERVIEW_EVALUATOR_ENABLED: "true",
};
function check(overrides: Record<string, string> = {}) {
  return spawnSync(
    process.execPath,
    [resolve("scripts/check-production-env.mjs")],
    {
      env: {
        SystemRoot: process.env.SystemRoot,
        PATH: process.env.PATH,
        ...baseline,
        ...overrides,
      },
      encoding: "utf8",
      timeout: 5000,
    },
  );
}
describe("public-launch environment validation", () => {
  it("accepts a complete configuration without needing OAuth", () =>
    expect(check().status).toBe(0));
  it("rejects missing cleanup credentials and weak cron secrets", () => {
    const result = check({
      SUPABASE_SERVICE_ROLE_KEY: "",
      CRON_SECRET: "short",
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(result.stderr).toContain("CRON_SECRET");
  });
  it("rejects disabling the preserved interview capabilities", () => {
    expect(check({ INTERVIEW_FOLLOW_UP_ENABLED: "false" }).status).toBe(1);
    expect(check({ INTERVIEW_EVALUATOR_ENABLED: "false" }).status).toBe(1);
  });
});
