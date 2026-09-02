import { describe, expect, it } from "vitest";

import { isConfiguredServerSecret, parseServerEnv } from "@/lib/env";
import {
  canUseInterviewSelectionMode,
  getInterviewRolloutConfig,
} from "@/features/mock-interviews/rollout";

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

  it("keeps interview rollout capabilities independently switchable", () => {
    expect(getInterviewRolloutConfig({})).toEqual({
      codingWorkspaceEnabled: true,
      promptContentEnabled: true,
      selectionModesEnabled: true,
    });
    expect(
      getInterviewRolloutConfig({
        INTERVIEW_CODING_WORKSPACE_ENABLED: "false",
        INTERVIEW_PROMPT_CONTENT_ENABLED: "true",
        INTERVIEW_SELECTION_MODES_ENABLED: "false",
      }),
    ).toEqual({
      codingWorkspaceEnabled: false,
      promptContentEnabled: true,
      selectionModesEnabled: false,
    });
    expect(() =>
      getInterviewRolloutConfig({
        INTERVIEW_PROMPT_CONTENT_ENABLED: "gradual",
      }),
    ).toThrow();
  });

  it("allows only adaptive Learning when expanded selection is disabled", () => {
    const config = getInterviewRolloutConfig({
      INTERVIEW_SELECTION_MODES_ENABLED: "false",
    });
    expect(canUseInterviewSelectionMode(config, "learning")).toBe(true);
    expect(canUseInterviewSelectionMode(config, "coverage")).toBe(false);
    expect(canUseInterviewSelectionMode(config, "improvement")).toBe(false);
    expect(canUseInterviewSelectionMode(config, "custom")).toBe(false);
  });

  it("does not treat setup placeholders as configured secrets", () => {
    expect(isConfiguredServerSecret("replace-with-your-gemini-api-key")).toBe(
      false,
    );
    expect(isConfiguredServerSecret("your-api-key")).toBe(false);
    expect(isConfiguredServerSecret("AIza-real-test-key")).toBe(true);
  });
});
