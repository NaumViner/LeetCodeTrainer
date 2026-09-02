import { afterEach, describe, expect, it, vi } from "vitest";

import { recordOperationalEvent } from "@/lib/operational-events";

afterEach(() => vi.restoreAllMocks());

describe("operational events", () => {
  it("drops learner content and secrets while preserving bounded diagnostics", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    recordOperationalEvent("mock_interview_test", {
      apiKey: "provider-secret",
      codeSnapshot: "class Solution {}",
      interviewId: "00000000-0000-4000-8000-000000000001",
      latencyMs: 42,
      notes: "learner private notes",
      reasonCode: "stale_phase",
      transcript: "private transcript",
    });

    const payload = JSON.parse(String(info.mock.calls[0]?.[0]));
    expect(payload).toMatchObject({
      event: "mock_interview_test",
      interviewId: "00000000-0000-4000-8000-000000000001",
      latencyMs: 42,
      reasonCode: "stale_phase",
    });
    expect(payload).not.toHaveProperty("apiKey");
    expect(payload).not.toHaveProperty("codeSnapshot");
    expect(payload).not.toHaveProperty("notes");
    expect(payload).not.toHaveProperty("transcript");
  });
});
