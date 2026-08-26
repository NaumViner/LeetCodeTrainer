import { describe, expect, it } from "vitest";

import {
  buildProgressiveHint,
  canTransitionAttempt,
  effectiveDurationSeconds,
  HELP_LEVEL_SCORES,
  recommendProblem,
} from "@/domain/practice";

describe("practice domain", () => {
  it("recommends an unattempted, unlocked foundation problem deterministically", () => {
    const candidates = [
      {
        curriculumLevel: "foundation",
        datasetOrder: 1,
        id: "attempted",
        primaryTopicId: "arrays",
      },
      {
        curriculumLevel: "foundation",
        datasetOrder: 2,
        id: "recommended",
        primaryTopicId: "arrays",
      },
      {
        curriculumLevel: "guided",
        datasetOrder: 3,
        id: "advanced",
        primaryTopicId: "trees",
      },
    ];

    expect(
      recommendProblem(
        candidates,
        [{ problemId: "attempted", status: "completed" }],
        new Set(["arrays"]),
        "learner-1",
      )?.id,
    ).toBe("recommended");
  });

  it("allows only the current or next attempt phase", () => {
    expect(canTransitionAttempt("planning", "coding")).toBe(true);
    expect(canTransitionAttempt("coding", "coding")).toBe(true);
    expect(canTransitionAttempt("coding", "reflection")).toBe(false);
    expect(canTransitionAttempt("reflection", "planning")).toBe(false);
  });

  it("builds progressive help and keeps assistance scores centralized", () => {
    const context = {
      patternTags: ["two-pointers", "pointer-invariant"],
      primaryTopic: "Two Pointers",
      recognitionSignals: ["ordered pair or opposite ends"],
    };

    expect(buildProgressiveHint(context, 1)).toMatchObject({
      helpLevel: "small_hint",
      ordinal: 1,
      title: "Socratic question",
    });
    expect(buildProgressiveHint(context, 3).content).toContain("Two Pointers");
    expect(buildProgressiveHint(context, 6).helpLevel).toBe("full_solution");
    expect(HELP_LEVEL_SCORES.pattern_hint).toBe(0.65);
  });

  it("recovers elapsed time for a running persisted timer", () => {
    expect(
      effectiveDurationSeconds({
        durationSeconds: 45,
        now: new Date("2026-08-26T12:01:00.000Z"),
        timerRunning: true,
        timerStartedAt: "2026-08-26T12:00:30.000Z",
      }),
    ).toBe(75);
  });
});
