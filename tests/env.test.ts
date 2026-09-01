import { describe, expect, it } from "vitest";

import { isConfiguredServerSecret, parseServerEnv } from "@/lib/env";

describe("parseServerEnv", () => {
  it("allows optional integrations to remain unconfigured", () => {
    expect(parseServerEnv({})).toEqual({});
  });

  it("rejects malformed application URLs", () => {
    expect(() =>
      parseServerEnv({ NEXT_PUBLIC_APP_URL: "not-a-url" }),
    ).toThrow();
  });

  it("normalizes blank optional values", () => {
    expect(parseServerEnv({ AI_API_KEY: "" })).toEqual({
      AI_API_KEY: undefined,
    });
  });

  it("parses the server-only AI coach feature flag", () => {
    expect(parseServerEnv({ AI_COACH_ENABLED: "true" })).toMatchObject({
      AI_COACH_ENABLED: true,
    });
    expect(() => parseServerEnv({ AI_COACH_ENABLED: "yes" })).toThrow();
  });

  it("parses the post-interview evaluator feature flag", () => {
    expect(
      parseServerEnv({ INTERVIEW_EVALUATOR_ENABLED: "true" }),
    ).toMatchObject({ INTERVIEW_EVALUATOR_ENABLED: true });
    expect(() =>
      parseServerEnv({ INTERVIEW_EVALUATOR_ENABLED: "yes" }),
    ).toThrow();
  });

  it("does not treat setup placeholders as configured secrets", () => {
    expect(isConfiguredServerSecret("replace-with-your-gemini-api-key")).toBe(
      false,
    );
    expect(isConfiguredServerSecret("your-api-key")).toBe(false);
    expect(isConfiguredServerSecret("AIza-real-test-key")).toBe(true);
  });
});
