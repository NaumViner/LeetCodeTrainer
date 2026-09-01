import { describe, expect, it } from "vitest";

import {
  aggregateAttemptAnalytics,
  overallReadiness,
  preparationReadiness,
} from "@/domain/analytics";
import { scoreAttempt, updateMastery } from "@/domain/mastery";

describe("mastery and analytics domain", () => {
  it("scores all performance dimensions", () => {
    const independent = scoreAttempt({
      complexityCorrect: true,
      durationSeconds: 900,
      estimatedMinutes: 20,
      helpLevel: "none",
      isRepeat: false,
      recognizedPatternCorrectly: true,
      result: "solved",
    });
    const assisted = scoreAttempt({
      complexityCorrect: true,
      durationSeconds: 900,
      estimatedMinutes: 20,
      helpLevel: "full_solution",
      isRepeat: false,
      recognizedPatternCorrectly: true,
      result: "solved",
    });
    const failedFast = scoreAttempt({
      complexityCorrect: false,
      durationSeconds: 30,
      estimatedMinutes: 20,
      helpLevel: "none",
      isRepeat: false,
      recognizedPatternCorrectly: false,
      result: "failed",
    });

    expect(independent.overall).toBe(0.95);
    expect(assisted.overall).toBe(0.71);
    expect(failedFast.speed).toBe(0);
    expect(independent.overall).toBeGreaterThan(assisted.overall);
  });

  it("smooths mastery so one lucky solve cannot produce 100", () => {
    const performance = scoreAttempt({
      complexityCorrect: true,
      durationSeconds: 900,
      estimatedMinutes: 20,
      helpLevel: "none",
      isRepeat: false,
      recognizedPatternCorrectly: true,
      result: "solved",
    });
    const first = updateMastery(null, performance, 0);
    const retained = scoreAttempt({
      complexityCorrect: true,
      durationSeconds: 800,
      estimatedMinutes: 20,
      helpLevel: "none",
      isRepeat: true,
      recognizedPatternCorrectly: true,
      result: "solved",
    });
    const second = updateMastery(first, retained, 1);

    expect(first.overall).toBe(56);
    expect(first.retention).toBe(40.25);
    expect(second.overall).toBeGreaterThan(first.overall);
    expect(second.overall).toBeLessThan(100);
  });

  it("discounts readiness when evidence covers few topics", () => {
    const readiness = overallReadiness(
      [
        {
          complexity: 80,
          independence: 80,
          overall: 80,
          recognition: 80,
          retention: 80,
          speed: 80,
        },
      ],
      18,
    );
    expect(readiness.corePatterns).toBe(80);
    expect(readiness.coverage).toBe(5.6);
    expect(readiness.overall).toBeLessThan(60);
  });

  it("keeps learning and interview readiness explicit", () => {
    const readiness = preparationReadiness({
      interview: { adjustedScore: 72, confidence: 60 },
      learning: { coverage: 50, overall: 64 },
    });
    expect(readiness.learning).toEqual({ confidence: 50, score: 64 });
    expect(readiness.interview).toEqual({ confidence: 60, score: 72 });
    expect(readiness.combined.score).toBeCloseTo(68.4, 1);
    expect(readiness.combined.summary).toContain("separate");
  });

  it("aggregates real attempts without fabricated values", () => {
    const analytics = aggregateAttemptAnalytics(
      [
        {
          completedAt: "2026-08-25T10:00:00.000Z",
          complexityCorrect: true,
          durationSeconds: 600,
          helpLevel: "none",
          id: "first",
          mistakes: ["Off by one"],
          problemId: "problem",
          recognizedPatternCorrectly: true,
          result: "solved",
        },
        {
          completedAt: "2026-08-26T10:00:00.000Z",
          complexityCorrect: false,
          durationSeconds: 900,
          helpLevel: "small_hint",
          id: "second",
          mistakes: ["Off by one"],
          problemId: "problem",
          recognizedPatternCorrectly: false,
          result: "partial",
        },
      ],
      [
        { attemptId: "first", score: 0.7 },
        { attemptId: "second", score: 0.8 },
      ],
    );
    expect(analytics.totalAttempts).toBe(2);
    expect(analytics.independentSolveRate).toBe(50);
    expect(analytics.patternAccuracy).toBe(50);
    expect(analytics.medianDurationSeconds).toBe(750);
    expect(analytics.repeatImprovement).toBe(10);
    expect(analytics.repeatedMistakes).toEqual([
      { count: 2, mistake: "off by one" },
    ]);
  });
});
