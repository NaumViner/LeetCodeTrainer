import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { defineConfig } from "vitest/config";

// Deliberately excluded from ordinary CI. Uses only authored synthetic evidence.
if (process.env.RUN_LIVE_EVALUATOR !== "1") {
  throw new Error(
    "Set RUN_LIVE_EVALUATOR=1 to authorize this paid provider check.",
  );
}
// Next intentionally ignores .env.local under NODE_ENV=test. This opt-in suite
// loads only the required key, without changing ordinary test configuration.
if (!process.env.GEMINI_API_KEY) {
  process.env.GEMINI_API_KEY = parseEnv(
    readFileSync(".env.local", "utf8"),
  ).GEMINI_API_KEY;
}
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["tests/live/interview-evaluator.test.ts"],
    testTimeout: 20_000,
    retry: 0,
    maxWorkers: 1,
  },
});
