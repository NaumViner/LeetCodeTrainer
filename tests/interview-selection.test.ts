import { describe, expect, it } from "vitest";

import type { InterviewCoverage } from "@/domain/interview-coverage";
import {
  selectCoverageInterview,
  selectCustomInterview,
  selectImprovementInterview,
  selectLearningInterview,
  type InterviewSelectionProblem,
  type InterviewTopicPerformance,
} from "@/domain/interview-selection";
import type {
  RecommendationBreakdown,
  ScoredRecommendation,
} from "@/domain/recommendation";

describe("Coverage interview selection", () => {
  it("chooses only uncovered topics and uses injected randomness", () => {
    const result = selectCoverageInterview({
      ...randomInput([
        problem("a-easy", "topic-a", "easy"),
        problem("b-easy", "topic-b", "easy"),
        problem("c-easy", "topic-c", "easy"),
      ]),
      coverage: coverage([
        topic("topic-a", 1, 2),
        topic("topic-b", 2, 0),
        topic("topic-c", 3, 0),
      ]),
      randomIndex: randomSequence(1, 0),
      selectedDifficulties: ["easy"],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.selectedTopicId).toBe("topic-c");
    expect(result.problem.id).toBe("c-easy");
    expect(result.metadata.candidateTopicCount).toBe(2);
  });

  it("balances on the least-covered topics after full coverage", () => {
    const result = selectCoverageInterview({
      ...randomInput([
        problem("a", "topic-a", "medium"),
        problem("b", "topic-b", "medium"),
        problem("c", "topic-c", "medium"),
      ]),
      coverage: coverage([
        topic("topic-a", 1, 4),
        topic("topic-b", 2, 1),
        topic("topic-c", 3, 2),
      ]),
      randomIndex: zeroRandom,
      selectedDifficulties: ["medium"],
    });

    expect(result.ok && result.selectedTopicId).toBe("topic-b");
  });

  it("avoids the two most recent topics when another target exists", () => {
    const result = selectCoverageInterview({
      ...randomInput([
        problem("a", "topic-a", "easy"),
        problem("b", "topic-b", "easy"),
        problem("c", "topic-c", "easy"),
      ]),
      coverage: coverage(
        [
          topic("topic-a", 1, 0),
          topic("topic-b", 2, 0),
          topic("topic-c", 3, 0),
        ],
        ["topic-a", "topic-b"],
      ),
      randomIndex: zeroRandom,
      selectedDifficulties: ["easy"],
    });

    expect(result.ok && result.selectedTopicId).toBe("topic-c");
    expect(result.ok && result.metadata.recencyFallbackUsed).toBe(false);
  });

  it("records a recency fallback when every eligible topic is recent", () => {
    const result = selectCoverageInterview({
      ...randomInput([
        problem("a", "topic-a", "easy"),
        problem("b", "topic-b", "easy"),
      ]),
      coverage: coverage(
        [topic("topic-a", 1, 0), topic("topic-b", 2, 0)],
        ["topic-a", "topic-b"],
      ),
      randomIndex: zeroRandom,
      selectedDifficulties: ["easy"],
    });

    expect(result.ok && result.metadata.recencyFallbackUsed).toBe(true);
  });

  it("prefers a fresh problem and records the repeat fallback", () => {
    const catalog = [
      problem("used", "topic-a", "easy"),
      problem("fresh", "topic-a", "easy"),
    ];
    const base = {
      ...randomInput(catalog),
      coverage: coverage([topic("topic-a", 1, 0)]),
      randomIndex: zeroRandom,
      selectedDifficulties: ["easy"] as const,
    };
    const freshResult = selectCoverageInterview({
      ...base,
      completedProblemIds: new Set(["used"]),
      selectedDifficulties: [...base.selectedDifficulties],
    });
    const repeatResult = selectCoverageInterview({
      ...base,
      completedProblemIds: new Set(["used", "fresh"]),
      selectedDifficulties: [...base.selectedDifficulties],
    });

    expect(freshResult.ok && freshResult.problem.id).toBe("fresh");
    expect(freshResult.ok && freshResult.metadata.repeatFallbackUsed).toBe(
      false,
    );
    expect(repeatResult.ok && repeatResult.metadata.repeatFallbackUsed).toBe(
      true,
    );
  });

  it("returns an explicit error when difficulty excludes uncovered topics", () => {
    const result = selectCoverageInterview({
      ...randomInput([problem("graph-hard", "graphs", "hard")]),
      coverage: coverage([topic("graphs", 1, 0)]),
      randomIndex: zeroRandom,
      selectedDifficulties: ["easy"],
    });

    expect(result).toMatchObject({
      code: "difficulty_excludes_uncovered_topics",
      ok: false,
    });
  });

  it("rejects empty and duplicate difficulty filters", () => {
    const base = {
      ...randomInput([problem("a", "topic-a", "easy")]),
      coverage: coverage([topic("topic-a", 1, 0)]),
      randomIndex: zeroRandom,
    };

    expect(
      selectCoverageInterview({ ...base, selectedDifficulties: [] }),
    ).toMatchObject({ code: "invalid_difficulty_filter", ok: false });
    expect(
      selectCoverageInterview({
        ...base,
        selectedDifficulties: ["easy", "easy"],
      }),
    ).toMatchObject({ code: "invalid_difficulty_filter", ok: false });
  });
});

describe("Improvement interview selection", () => {
  it("requires full topic coverage", () => {
    const result = selectImprovementInterview({
      ...randomInput([problem("a", "topic-a", "easy")]),
      coverage: coverage([topic("topic-a", 1, 0)]),
      randomIndex: zeroRandom,
      selectedDifficulties: ["easy"],
      topicPerformance: [performance("topic-a", 1, 20)],
    });

    expect(result).toMatchObject({
      code: "improvement_requires_full_coverage",
      ok: false,
    });
  });

  it("chooses only among the bottom three evaluated topics", () => {
    const topics = [
      topic("strong", 1, 1),
      topic("weakest", 2, 1),
      topic("weak", 3, 1),
      topic("medium", 4, 1),
    ];
    const result = selectImprovementInterview({
      ...randomInput(topics.map((item) => problem(item.id, item.id, "medium"))),
      coverage: coverage(topics),
      randomIndex: randomSequence(1, 0),
      selectedDifficulties: ["medium"],
      topicPerformance: [
        performance("strong", 1, 90),
        performance("weakest", 2, 10),
        performance("weak", 3, 20),
        performance("medium", 4, 30),
      ],
    });

    expect(result.ok && result.selectedTopicId).toBe("weak");
    expect(result.ok && result.metadata.candidateTopicCount).toBe(3);
  });

  it("uses confidence, evidence age, and canonical order as tie breakers", () => {
    const topics = [
      topic("a", 1, 1),
      topic("b", 2, 1),
      topic("c", 3, 1),
      topic("d", 4, 1),
    ];
    const result = selectImprovementInterview({
      ...randomInput(topics.map((item) => problem(item.id, item.id, "easy"))),
      coverage: coverage(topics),
      randomIndex: zeroRandom,
      selectedDifficulties: ["easy"],
      topicPerformance: [
        performance("a", 1, 50, 0.8, "2026-08-04T00:00:00.000Z"),
        performance("b", 2, 50, 0.2, "2026-08-04T00:00:00.000Z"),
        performance("c", 3, 50, 0.2, "2026-08-01T00:00:00.000Z"),
        performance("d", 4, 50, 0.2, "2026-08-01T00:00:00.000Z"),
      ],
    });

    expect(result.ok && result.selectedTopicId).toBe("c");
  });

  it("requires comparable evaluated evidence for every covered topic", () => {
    const result = selectImprovementInterview({
      ...randomInput([problem("a", "a", "easy"), problem("b", "b", "easy")]),
      coverage: coverage([topic("a", 1, 1), topic("b", 2, 1)]),
      randomIndex: zeroRandom,
      selectedDifficulties: ["easy"],
      topicPerformance: [performance("a", 1, 20)],
    });

    expect(result).toMatchObject({
      code: "insufficient_improvement_evidence",
      details: { topicIds: ["b"] },
      ok: false,
    });
  });

  it("does not escape the weakest topics to satisfy difficulty", () => {
    const topics = [
      topic("weak-a", 1, 1),
      topic("weak-b", 2, 1),
      topic("weak-c", 3, 1),
      topic("strong", 4, 1),
    ];
    const result = selectImprovementInterview({
      ...randomInput([
        problem("weak-hard", "weak-a", "hard"),
        problem("strong-easy", "strong", "easy"),
      ]),
      coverage: coverage(topics),
      randomIndex: zeroRandom,
      selectedDifficulties: ["easy"],
      topicPerformance: topics.map((item, index) =>
        performance(item.id, item.ordinal, 10 + index * 10),
      ),
    });

    expect(result).toMatchObject({
      code: "difficulty_excludes_weak_topics",
      ok: false,
    });
  });
});

describe("Learning interview selection", () => {
  it("preserves eligibility and adaptive score ordering", () => {
    const catalog = [
      problem("ineligible", "a", "medium", 1),
      problem("eligible-low", "b", "medium", 2),
      problem("eligible-high", "c", "hard", 3),
    ];
    const result = selectLearningInterview({
      catalog,
      collectionProblemIds: ids(catalog),
      rankedRecommendations: [
        recommendation(catalog[0]!, 100, false),
        recommendation(catalog[1]!, 30, true),
        recommendation(catalog[2]!, 70, true),
      ],
      recentProblemIds: new Set(),
    });

    expect(result.ok && result.problem.id).toBe("eligible-high");
  });

  it("falls back to all scores when no recommendation is eligible", () => {
    const catalog = [
      problem("lower", "a", "easy", 1),
      problem("higher", "b", "medium", 2),
    ];
    const result = selectLearningInterview({
      catalog,
      collectionProblemIds: ids(catalog),
      rankedRecommendations: [
        recommendation(catalog[0]!, 10, false),
        recommendation(catalog[1]!, 20, false),
      ],
      recentProblemIds: new Set(),
    });

    expect(result.ok && result.problem.id).toBe("higher");
  });

  it("avoids recently interviewed problems without changing adaptive ranking", () => {
    const catalog = [
      problem("highest", "a", "easy", 1),
      problem("next", "b", "medium", 2),
    ];
    const result = selectLearningInterview({
      catalog,
      collectionProblemIds: ids(catalog),
      rankedRecommendations: [
        recommendation(catalog[0]!, 100, true),
        recommendation(catalog[1]!, 90, true),
      ],
      recentProblemIds: new Set(["highest"]),
    });

    expect(result.ok && result.problem.id).toBe("next");
    expect(result.ok && result.metadata.recencyFallbackUsed).toBe(false);
  });
});

describe("Custom interview selection", () => {
  it("uses the exact canonical topic and difficulty and prefers fresh problems", () => {
    const catalog = [
      problem("used", "arrays", "medium"),
      problem("fresh", "arrays", "medium"),
      problem("wrong-difficulty", "arrays", "hard"),
      problem("wrong-topic", "graphs", "medium"),
    ];
    const result = selectCustomInterview({
      ...randomInput(catalog),
      completedProblemIds: new Set(["used"]),
      randomIndex: zeroRandom,
      requestedDifficulty: "medium",
      requestedTopicId: "arrays",
      validTopicIds: new Set(["arrays", "graphs"]),
    });

    expect(result.ok && result.problem.id).toBe("fresh");
    expect(result.ok && result.metadata.candidateProblemCount).toBe(2);
  });

  it("returns explicit errors for invalid topics and empty combinations", () => {
    const base = {
      ...randomInput([problem("array-easy", "arrays", "easy")]),
      randomIndex: zeroRandom,
      validTopicIds: new Set(["arrays", "graphs"]),
    };

    expect(
      selectCustomInterview({
        ...base,
        requestedDifficulty: "easy",
        requestedTopicId: "not-canonical",
      }),
    ).toMatchObject({ code: "invalid_custom_topic", ok: false });
    expect(
      selectCustomInterview({
        ...base,
        requestedDifficulty: "hard",
        requestedTopicId: "graphs",
      }),
    ).toMatchObject({ code: "custom_combination_unavailable", ok: false });
  });
});

function randomInput(catalog: InterviewSelectionProblem[]) {
  return {
    catalog,
    collectionProblemIds: ids(catalog),
    completedProblemIds: new Set<string>(),
    randomIndex: zeroRandom,
  };
}

function ids(problems: InterviewSelectionProblem[]) {
  return new Set(problems.map((item) => item.id));
}

function problem(
  id: string,
  primaryTopicId: string,
  difficulty: InterviewSelectionProblem["difficulty"],
  datasetOrder = 1,
): InterviewSelectionProblem {
  return {
    active: true,
    datasetOrder,
    difficulty,
    id,
    availableForInterview: true,
    primaryTopicId,
  };
}

function topic(id: string, ordinal: number, completedInterviews: number) {
  return {
    completedInterviews,
    id,
    lastCompletedAt: completedInterviews ? "2026-08-01T00:00:00.000Z" : null,
    name: id,
    ordinal,
    slug: id,
  };
}

function coverage(
  topics: ReturnType<typeof topic>[],
  recentTopicIds: string[] = [],
): InterviewCoverage {
  const missingTopics = topics.filter((item) => item.completedInterviews === 0);
  return {
    complete: topics.length > 0 && missingTopics.length === 0,
    coveredTopicCount: topics.length - missingTopics.length,
    missingTopics,
    recentTopicIds,
    topics,
    totalTopicCount: topics.length,
  };
}

function performance(
  topicId: string,
  ordinal: number,
  adjustedScore: number,
  confidence = 0.5,
  lastEvidenceAt = "2026-08-01T00:00:00.000Z",
): InterviewTopicPerformance {
  return {
    adjustedScore,
    confidence,
    lastEvidenceAt,
    name: topicId,
    ordinal,
    topicId,
  };
}

function recommendation(
  item: InterviewSelectionProblem,
  total: number,
  eligible: boolean,
): ScoredRecommendation {
  return {
    breakdown: { ...emptyBreakdown, total },
    candidate: {
      curriculumLevel: "guided",
      datasetOrder: item.datasetOrder,
      difficulty: item.difficulty,
      id: item.id,
      prerequisiteTopicIds: [],
      primaryTopicId: item.primaryTopicId,
    },
    eligible,
    reasons: [`Adaptive score: ${total}`],
  };
}

const emptyBreakdown: RecommendationBreakdown = {
  curriculumFit: 0,
  difficultyFit: 0,
  dueReview: 0,
  frustrationPenalty: 0,
  interviewUrgency: 0,
  novelty: 0,
  prerequisiteFit: 0,
  recentTopicPenalty: 0,
  repeatedProblemPenalty: 0,
  topicBalance: 0,
  total: 0,
  weakness: 0,
};

function randomSequence(...values: number[]) {
  let index = 0;
  return () => values[index++] ?? 0;
}

function zeroRandom() {
  return 0;
}
