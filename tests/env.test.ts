import { describe, expect, it } from "vitest";

import { parseServerEnv } from "@/lib/env";

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
});
