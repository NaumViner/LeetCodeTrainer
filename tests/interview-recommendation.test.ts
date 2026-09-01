import { describe, expect, it } from "vitest";

import {
  buildInterviewPerformanceProfile,
  type InterviewProfileEvidence,
} from "@/domain/interview-profile";
import {
  buildInterviewFirstRecommendations,
  recommendedInterviewDifficulty,
} from "@/domain/interview-recommendation";
import { INTERVIEW_EVALUATION_DIMENSIONS } from "@/features/interview-evaluation/model";

const now = new Date("2026-09-01T12:00:00.000Z");

describe("interview-first recommendations", () => {
  it("never recommends hard from one strong easy interview", () => {
    const profile = profileFrom([
      session("easy-one", "easy", 100, "arrays", 1),
    ]);
    expect(recommendedInterviewDifficulty(profile)).toBe("easy");
  });

  it("promotes hard only after repeated confident medium evidence", () => {
    const profile = profileFrom([
      session("medium-one", "medium", 85, "arrays", 1),
      session("medium-two", "medium", 90, "trees", 4),
      session("medium-three", "medium", 88, "graphs", 8),
      session("medium-four", "medium", 90, "dp", 12),
    ]);
    expect(profile.allTime.difficulties.medium.confidence).toBeGreaterThan(55);
    expect(recommendedInterviewDifficulty(profile)).toBe("hard");
  });

  it("returns explainable actions, evidence, routes, time, and remediation before follow-up", () => {
    const profile = profileFrom([
      session("one", "medium", 45, "arrays", 1),
      session("two", "medium", 50, "arrays", 5),
    ]);
    const recommendations = buildInterviewFirstRecommendations({
      candidates: [
        {
          difficulty: "easy",
          externalId: "1",
          id: "recent",
          primaryTopicId: "arrays",
          primaryTopicName: "Arrays",
          primaryTopicSlug: "arrays",
          title: "Two Sum",
        },
        {
          difficulty: "medium",
          externalId: "49",
          id: "fresh",
          primaryTopicId: "arrays",
          primaryTopicName: "Arrays",
          primaryTopicSlug: "arrays",
          title: "Group Anagrams",
        },
      ],
      dueProblemIds: new Set(),
      interviewDate: null,
      learningMastery: new Map([["arrays", 40]]),
      now,
      profile,
      recentProblemIds: ["recent"],
    });
    expect(recommendations[0]).toMatchObject({
      directRoute: "/practice?problem=49",
      priority: 1,
    });
    expect(recommendations.some((item) => item.actionType === "lesson")).toBe(
      true,
    );
    expect(
      recommendations.some((item) => item.actionType === "next_interview"),
    ).toBe(true);
    for (const item of recommendations) {
      expect(item.reasons.length).toBeGreaterThan(0);
      expect(item.evidence.length).toBeGreaterThan(0);
      expect(item.directRoute).toMatch(/^\//);
      expect(item.estimatedMinutes).toBeGreaterThan(0);
    }
  });
});

function profileFrom(sessions: ReturnType<typeof session>[]) {
  return buildInterviewPerformanceProfile(sessions, {
    now,
    topicIds: ["arrays", "trees", "graphs", "dp"],
    totalTopicCount: 4,
  });
}

function session(
  id: string,
  difficulty: "easy" | "medium" | "hard",
  rawScore: number,
  topicId: string,
  ageDays: number,
) {
  return {
    completedAt: new Date(now.getTime() - ageDays * 86_400_000).toISOString(),
    confidence: 0.9,
    difficulty,
    dimensions: Object.fromEntries(
      INTERVIEW_EVALUATION_DIMENSIONS.map((dimension) => [
        dimension,
        {
          confidence: dimension === "testing" ? 0.4 : 0.8,
          score:
            dimension === "testing"
              ? 1
              : Math.max(1, Math.min(5, Math.round(rawScore / 20))),
        },
      ]),
    ) as InterviewProfileEvidence["dimensions"],
    evidenceCoverage: {
      hasCode: true,
      hasFirstPartyQuestionContent: false,
      hasTrustedTests: false,
      phaseTimingCount: 6,
      transcriptTurns: 10,
    },
    id,
    interviewerLevel: "beginner" as const,
    primaryTopicId: topicId,
    rawScore,
    recurringSignals: [],
    secondaryTopicIds: [],
  };
}
