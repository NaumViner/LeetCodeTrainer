import { describe, expect, it } from "vitest";

import { parseActiveMockInterviewSnapshot } from "../src/features/mock-interviews/queries";

describe("active mock interview snapshot", () => {
  it("accepts PostgreSQL timestamps with an explicit UTC offset", () => {
    const snapshot = parseActiveMockInterviewSnapshot({
      codeSnapshot: null,
      codingLanguage: "java",
      connectionCount: 0,
      conversationLifecycle: "primary_question",
      durationMinutes: 45,
      elapsedSeconds: 0,
      id: "353e8857-6220-4b97-a756-a09d22c408b7",
      interviewLanguage: "hebrew",
      interviewerLevel: "beginner",
      followUpPrompt: null,
      observedPhase: null,
      observedPhaseEventId: null,
      phase: "intro",
      primaryReadiness: "incomplete",
      questionContentKey: "0123456789abcdef0123456789abcdef",
      questionContentVersion: 1,
      questionCycle: "primary",
      scratchpad: null,
      startedAt: "2026-09-02T13:10:16.521414+00:00",
      timerRunning: false,
      voiceActivated: false,
      workspaceVersion: 0,
    });

    expect(snapshot).toMatchObject({
      effectiveElapsedSeconds: 0,
      startedAt: "2026-09-02T13:10:16.521414+00:00",
      voiceActivated: false,
    });
  });
});
