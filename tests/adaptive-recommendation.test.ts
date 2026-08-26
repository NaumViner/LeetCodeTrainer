import { describe, expect, it } from "vitest";

import {
  rankRecommendations,
  recommendProblem,
  scoreRecommendation,
  type RecommendationAttempt,
  type RecommendationCandidate,
  type RecommendationContext,
} from "@/domain/recommendation";

function candidate(
  id: string,
  topicId: string,
  changes: Partial<RecommendationCandidate> = {},
): RecommendationCandidate {
  return {
    curriculumLevel: "foundation",
    datasetOrder: Number(id.replace(/\D/g, "")) || 1,
    difficulty: "easy",
    id,
    prerequisiteTopicIds: [],
    primaryTopicId: topicId,
    ...changes,
  };
}

function attempt(
  problemId: string,
  topicId: string,
  result: RecommendationAttempt["result"] = "solved",
): RecommendationAttempt {
  return {
    completedAt: "2026-08-26T10:00:00.000Z",
    difficulty: "medium",
    helpLevel: "none",
    problemId,
    primaryTopicId: topicId,
    result,
  };
}

function context(
  changes: Partial<RecommendationContext> = {},
): RecommendationContext {
  return {
    attempts: [],
    completedTopicIds: new Set(),
    dueProblemIds: new Set(),
    interviewDate: null,
    now: new Date("2026-08-26T12:00:00.000Z"),
    topicEvidence: new Map(),
    userId: "learner-1",
    ...changes,
  };
}

describe("adaptive recommendation engine", () => {
  it("weights a weak eligible topic above a strong topic", () => {
    const ctx = context({
      topicEvidence: new Map([
        ["weak", { independentSolves: 0, overallScore: 30, topicId: "weak" }],
        [
          "strong",
          { independentSolves: 3, overallScore: 85, topicId: "strong" },
        ],
      ]),
    });
    const ranked = rankRecommendations(
      [candidate("p1", "weak"), candidate("p2", "strong")],
      ctx,
    );

    expect(ranked[0]?.candidate.id).toBe("p1");
    expect(ranked[0]?.breakdown.weakness).toBe(84);
  });

  it("restores topic balance and avoids the most recent topic", () => {
    const ctx = context({ attempts: [attempt("old", "arrays")] });
    const ranked = rankRecommendations(
      [candidate("p1", "arrays"), candidate("p2", "trees")],
      ctx,
    );

    expect(ranked[0]?.candidate.id).toBe("p2");
    expect(ranked[1]?.breakdown.recentTopicPenalty).toBe(15);
  });

  it("minimizes immediate problem repetition", () => {
    const ctx = context({ attempts: [attempt("p1", "arrays")] });
    const ranked = rankRecommendations(
      [candidate("p1", "arrays"), candidate("p2", "arrays")],
      ctx,
    );

    expect(ranked[0]?.candidate.id).toBe("p2");
    expect(ranked[1]?.breakdown.repeatedProblemPenalty).toBe(140);
  });

  it("backs down to an easy recovery problem after repeated failures", () => {
    const ctx = context({
      attempts: [
        attempt("failed-2", "graphs", "failed"),
        attempt("failed-1", "graphs", "partial"),
      ],
      completedTopicIds: new Set(["graphs"]),
      topicEvidence: new Map([
        [
          "graphs",
          { independentSolves: 0, overallScore: 48, topicId: "graphs" },
        ],
      ]),
    });
    const ranked = rankRecommendations(
      [
        candidate("p1", "graphs", {
          curriculumLevel: "guided",
          difficulty: "easy",
        }),
        candidate("p2", "graphs", {
          curriculumLevel: "guided",
          difficulty: "medium",
        }),
      ],
      ctx,
    );

    expect(ranked[0]?.candidate.id).toBe("p1");
    expect(ranked[1]?.breakdown.frustrationPenalty).toBe(100);
    expect(ranked[0]?.reasons).toContain(
      "An easier recovery step follows recent difficulty.",
    );
  });

  it("enforces prerequisite and curriculum gates", () => {
    const ctx = context();
    const blocked = scoreRecommendation(
      candidate("p1", "graphs", {
        curriculumLevel: "independent",
        difficulty: "medium",
        prerequisiteTopicIds: ["arrays"],
      }),
      ctx,
    );
    const ranked = rankRecommendations(
      [blocked.candidate, candidate("p2", "arrays")],
      ctx,
    );

    expect(blocked.eligible).toBe(false);
    expect(blocked.breakdown.prerequisiteFit).toBe(-500);
    expect(ranked[0]?.candidate.id).toBe("p2");
  });

  it("prioritizes a due review without applying repeat penalties", () => {
    const ctx = context({
      attempts: [attempt("due", "arrays")],
      dueProblemIds: new Set(["due"]),
    });
    const ranked = rankRecommendations(
      [candidate("due", "arrays"), candidate("new", "trees")],
      ctx,
    );

    expect(ranked[0]?.candidate.id).toBe("due");
    expect(ranked[0]?.breakdown.dueReview).toBe(100);
    expect(ranked[0]?.breakdown.repeatedProblemPenalty).toBe(0);
  });

  it("promotes interview-level difficulty only after strong evidence", () => {
    const ctx = context({
      completedTopicIds: new Set(["arrays"]),
      topicEvidence: new Map([
        [
          "arrays",
          { independentSolves: 3, overallScore: 86, topicId: "arrays" },
        ],
      ]),
    });
    const ranked = rankRecommendations(
      [
        candidate("p1", "arrays", {
          curriculumLevel: "guided",
          difficulty: "easy",
        }),
        candidate("p2", "arrays", {
          curriculumLevel: "interview",
          difficulty: "hard",
        }),
      ],
      ctx,
    );

    expect(ranked[0]?.candidate.id).toBe("p2");
    expect(ranked[0]?.breakdown.difficultyFit).toBe(40);
  });

  it("keeps controlled selection stable for the same learner day", () => {
    const candidates = [
      candidate("p1", "arrays"),
      candidate("p2", "trees"),
      candidate("p3", "graphs"),
    ];
    const ctx = context();

    const choices = new Set(
      Array.from(
        { length: 10 },
        () => recommendProblem(candidates, ctx)?.candidate.id,
      ),
    );
    expect(choices.size).toBe(1);
  });
});
