import { describe, expect, it } from "vitest";

import { selectInterviewProblem } from "@/domain/mock-interview-selection";
import {
  canTransitionMockInterview,
  effectiveInterviewElapsed,
  interviewTextDirection,
  normalizeInterviewerLevel,
  rubricFeedback,
  scoreMockInterview,
} from "@/domain/mock-interview";
import type { ScoredRecommendation } from "@/domain/recommendation";
import { mockInterviewSetupSchema } from "@/features/mock-interviews/schema";

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
  it.each(
    ["adaptive", "easy", "medium", "hard"].flatMap((difficulty) =>
      [30, 45, 60].flatMap((durationMinutes) =>
        ["beginner", "faang_tough"].flatMap((interviewerLevel) =>
          ["auto", "english", "hebrew"].map((interviewLanguage) => ({
            difficulty,
            durationMinutes,
            interviewLanguage,
            interviewerLevel,
          })),
        ),
      ),
    ),
  )(
    "accepts $difficulty, $durationMinutes minutes, $interviewerLevel, and $interviewLanguage",
    (setup) => {
      expect(mockInterviewSetupSchema.safeParse(setup).success).toBe(true);
    },
  );

  it("lets fixed difficulty bypass learning eligibility", () => {
    const selected = selectInterviewProblem({
      catalog: [
        interviewProblem("easy-eligible", "easy", 1),
        interviewProblem("hard-ineligible", "hard", 2),
      ],
      rankedRecommendations: [
        interviewScore("easy-eligible", true, 100),
        interviewScore("hard-ineligible", false, 5),
      ],
      recentProblemIds: new Set(),
      requestedDifficulty: "hard",
    });

    expect(selected?.problem.id).toBe("hard-ineligible");
  });

  it("selects RTL only for explicit Hebrew and preserves automatic direction", () => {
    expect(interviewTextDirection("hebrew")).toBe("rtl");
    expect(interviewTextDirection("english")).toBe("ltr");
    expect(interviewTextDirection("auto")).toBe("auto");
  });

  it("keeps unranked fixed-difficulty catalog problems selectable", () => {
    const selected = selectInterviewProblem({
      catalog: [
        interviewProblem("easy-ranked", "easy", 1),
        interviewProblem("medium-omitted", "medium", 2),
      ],
      rankedRecommendations: [interviewScore("easy-ranked", true, 100)],
      recentProblemIds: new Set(),
      requestedDifficulty: "medium",
    });

    expect(selected).toMatchObject({
      problem: { id: "medium-omitted" },
      score: null,
    });
  });

  it("keeps adaptive selection inside the eligible progression pool", () => {
    const selected = selectInterviewProblem({
      catalog: [
        interviewProblem("hard-ineligible", "hard", 1),
        interviewProblem("easy-eligible", "easy", 2),
      ],
      rankedRecommendations: [
        interviewScore("hard-ineligible", false, 100),
        interviewScore("easy-eligible", true, 10),
      ],
      recentProblemIds: new Set(),
      requestedDifficulty: "adaptive",
    });

    expect(selected?.problem.id).toBe("easy-eligible");
  });

  it("avoids recent problems when an alternative exists and falls back when needed", () => {
    const catalog = [
      interviewProblem("best", "medium", 1),
      interviewProblem("fresh", "medium", 2),
    ];
    const rankedRecommendations = [
      interviewScore("best", false, 100),
      interviewScore("fresh", false, 50),
    ];

    expect(
      selectInterviewProblem({
        catalog,
        rankedRecommendations,
        recentProblemIds: new Set(["best"]),
        requestedDifficulty: "medium",
      })?.problem.id,
    ).toBe("fresh");
    expect(
      selectInterviewProblem({
        catalog,
        rankedRecommendations,
        recentProblemIds: new Set(["best", "fresh"]),
        requestedDifficulty: "medium",
      })?.problem.id,
    ).toBe("best");
  });

  it("never selects an inactive catalog problem", () => {
    expect(
      selectInterviewProblem({
        catalog: [interviewProblem("inactive-hard", "hard", 1, false)],
        rankedRecommendations: [interviewScore("inactive-hard", true, 100)],
        recentProblemIds: new Set(),
        requestedDifficulty: "hard",
      }),
    ).toBeNull();
  });

  it("normalizes persisted interviewer levels safely", () => {
    expect(normalizeInterviewerLevel("faang_tough")).toBe("faang_tough");
    expect(normalizeInterviewerLevel("beginner")).toBe("beginner");
    expect(normalizeInterviewerLevel("unknown")).toBe("beginner");
  });

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

function interviewProblem(
  id: string,
  difficulty: "easy" | "hard" | "medium",
  datasetOrder: number,
  active = true,
) {
  return { active, dataset_order: datasetOrder, difficulty, id };
}

function interviewScore(id: string, eligible: boolean, total: number) {
  return {
    breakdown: { total },
    candidate: { id },
    eligible,
  } as ScoredRecommendation;
}
