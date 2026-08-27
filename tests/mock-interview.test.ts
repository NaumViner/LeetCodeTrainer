import { describe, expect, it } from "vitest";

import {
  canTransitionMockInterview,
  effectiveInterviewElapsed,
  rubricFeedback,
  scoreMockInterview,
} from "@/domain/mock-interview";

const strongInput = {
  bruteForceNotes:
    "baseline\ninvariant\ncorrectness\nbottleneck\ncomplexity\ntradeoff\nexample\nedge case",
  clarificationNotes:
    "constraints\nduplicates\ninvalid input\nordering\noutput",
  codeQualityRating: 5,
  codeSnapshot: Array.from({ length: 12 }, (_, index) => `line ${index}`).join(
    "\n",
  ),
  communicationRating: 5,
  complexityRating: 5,
  examplesNotes: "normal\nminimal\nempty\nduplicates\nadversarial",
  independenceRating: 5,
  optimizationNotes:
    "state\ninvariant\nupdate\nrestore\ncorrectness\ncomplexity\ntradeoff\nedge",
  result: "solved" as const,
  spaceComplexity: "O(n)",
  testingNotes:
    "empty\none\nduplicates\nnegative\nlarge\ntrace\ninvariant\noverflow",
  timeComplexity: "O(n)",
};

describe("mock interview domain", () => {
  it("advances only one ordered interview phase", () => {
    expect(canTransitionMockInterview("intro", "clarify")).toBe(true);
    expect(canTransitionMockInterview("clarify", "examples")).toBe(true);
    expect(canTransitionMockInterview("clarify", "optimization")).toBe(false);
    expect(canTransitionMockInterview("testing", "implementation")).toBe(false);
  });

  it("produces a strong ten-part score from complete evidence", () => {
    const score = scoreMockInterview(strongInput);
    expect(score.overall).toBe(100);
    expect(score.problemUnderstanding).toBe(5);
    expect(score.correctness).toBe(5);
    expect(rubricFeedback(score).strengths).toHaveLength(4);
    expect(rubricFeedback(score).improvements).toEqual([]);
  });

  it("keeps weak evidence low and returns actionable feedback", () => {
    const score = scoreMockInterview({
      ...strongInput,
      bruteForceNotes: "guess",
      clarificationNotes: "none",
      codeQualityRating: 1,
      codeSnapshot: "return 0",
      communicationRating: 1,
      complexityRating: 1,
      examplesNotes: "one",
      independenceRating: 1,
      optimizationNotes: "guess",
      result: "failed",
      testingNotes: "none",
    });
    const feedback = rubricFeedback(score);
    expect(score.overall).toBeLessThan(40);
    expect(feedback.improvements.length).toBeGreaterThan(0);
    expect(feedback.improvements[0]).toMatch(/Restate|Ask|State/);
  });

  it("derives refresh-safe elapsed time from the session start", () => {
    expect(
      effectiveInterviewElapsed({
        elapsedSeconds: 20,
        now: new Date("2026-08-27T10:01:00.000Z"),
        startedAt: "2026-08-27T10:00:00.000Z",
        timerRunning: true,
      }),
    ).toBe(60);
    expect(
      effectiveInterviewElapsed({
        elapsedSeconds: 20,
        now: new Date("2026-08-27T10:01:00.000Z"),
        startedAt: "2026-08-27T10:00:00.000Z",
        timerRunning: false,
      }),
    ).toBe(20);
  });
});
