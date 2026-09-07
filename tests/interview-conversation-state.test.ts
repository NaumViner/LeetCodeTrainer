import { describe, expect, it } from "vitest";

import {
  canRequestFollowUp,
  canTransitionConversationLifecycle,
  connectionModeForState,
  isSolutionReady,
} from "@/domain/interview-conversation-state";

describe("interview conversation state", () => {
  it("keeps lifecycle forward-only while allowing conclusion", () => {
    expect(
      canTransitionConversationLifecycle(
        "primary_question",
        "primary_completed",
      ),
    ).toBe(true);
    expect(canTransitionConversationLifecycle("follow_up", "concluding")).toBe(
      true,
    );
    expect(
      canTransitionConversationLifecycle("follow_up", "primary_question"),
    ).toBe(false);
    expect(canTransitionConversationLifecycle("concluding", "follow_up")).toBe(
      false,
    );
  });

  it("requires every readiness item before implementation", () => {
    const complete = {
      algorithm: true,
      complexity: true,
      correctness: true,
      dataStructures: true,
      edgeCases: true,
      operationOrder: true,
    };
    expect(isSolutionReady(complete)).toBe(true);
    expect(isSolutionReady({ ...complete, correctness: false })).toBe(false);
  });

  it("starts only when no connection or transcript exists", () => {
    expect(
      connectionModeForState({ connectionCount: 0, transcriptTurnCount: 0 }),
    ).toBe("start");
    expect(
      connectionModeForState({ connectionCount: 0, transcriptTurnCount: 1 }),
    ).toBe("resume");
    expect(
      connectionModeForState({ connectionCount: 1, transcriptTurnCount: 0 }),
    ).toBe("resume");
  });

  it("allows one eligible follow-up at exactly ten minutes", () => {
    expect(
      canRequestFollowUp({
        hasApprovedPrompt: true,
        lifecycle: "primary_completed",
        remainingSeconds: 600,
      }),
    ).toBe(true);
    expect(
      canRequestFollowUp({
        hasApprovedPrompt: true,
        lifecycle: "primary_completed",
        remainingSeconds: 599,
      }),
    ).toBe(false);
    expect(
      canRequestFollowUp({
        hasApprovedPrompt: true,
        lifecycle: "follow_up_completed",
        remainingSeconds: 900,
      }),
    ).toBe(false);
  });
});
