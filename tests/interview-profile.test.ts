import { describe, expect, it } from "vitest";

import {
  buildInterviewPerformanceProfile,
  challengeAdjustedInterviewScore,
  interviewProfileLevel,
  type InterviewProfileEvidence,
} from "@/domain/interview-profile";
import { INTERVIEW_EVALUATION_DIMENSIONS } from "@/features/interview-evaluation/model";

const now = new Date("2026-09-01T12:00:00.000Z");

describe("interview performance profile", () => {
  it("uses an expected-performance model instead of a hard-difficulty bonus", () => {
    expect(challengeAdjustedInterviewScore(30, "hard", "beginner")).toBe(57);
    expect(challengeAdjustedInterviewScore(30, "easy", "beginner")).toBe(27);
    expect(challengeAdjustedInterviewScore(90, "easy", "beginner")).toBe(63);
    expect(challengeAdjustedInterviewScore(60, "hard", "faang_tough")).toBe(80);
  });

  it("does not expose a high-certainty level from one interview", () => {
    expect(interviewProfileLevel(98, 99, 1)).toBe("Developing");
    expect(interviewProfileLevel(98, 90, 8)).toBe("Advanced");
  });

  it("calculates all scopes, confidence, trends, and recurring signals", () => {
    const profile = buildInterviewPerformanceProfile(
      [
        evidence("a", 88, "hard", "arrays", 1, ["Missed boundary case"]),
        evidence("b", 82, "medium", "trees", 8, ["Missed boundary case"]),
        evidence("c", 70, "medium", "arrays", 16),
        evidence("d", 55, "easy", "graphs", 24),
        evidence("e", 50, "easy", "graphs", 40),
        evidence("f", 45, "easy", "arrays", 70),
      ],
      {
        now,
        topicIds: ["arrays", "trees", "graphs", "dp"],
        totalTopicCount: 4,
      },
    );

    expect(profile.evaluatedInterviews).toBe(6);
    expect(profile.allTime.overall.sampleSize).toBe(6);
    expect(profile.last30Days.overall.sampleSize).toBe(4);
    expect(profile.last90Days.overall.sampleSize).toBe(6);
    expect(profile.allTime.topics.arrays?.sampleSize).toBe(3);
    expect(profile.allTime.topics.dp?.adjustedScore).toBeNull();
    expect(profile.allTime.difficulties.hard.rawScore).toBe(88);
    expect(profile.allTime.interviewerLevels.faang_tough.sampleSize).toBe(3);
    expect(profile.allTime.dimensions.testing.sampleSize).toBe(6);
    expect(profile.allTime.overall.confidence).toBeGreaterThan(50);
    expect(profile.allTime.overall.trend.direction).toBe("improving");
    expect(profile.recurringSignals).toEqual([
      { count: 2, signal: "Missed boundary case" },
    ]);
  });

  it("excludes future and zero-confidence evaluations", () => {
    const profile = buildInterviewPerformanceProfile(
      [
        evidence("valid", 60, "medium", "arrays", 1),
        { ...evidence("future", 100, "hard", "arrays", -1) },
        { ...evidence("invalid", 100, "hard", "arrays", 1), confidence: 0 },
      ],
      { now, topicIds: ["arrays"], totalTopicCount: 1 },
    );
    expect(profile.evaluatedInterviews).toBe(1);
    expect(profile.allTime.overall.rawScore).toBe(60);
  });
});

function evidence(
  id: string,
  rawScore: number,
  difficulty: InterviewProfileEvidence["difficulty"],
  topicId: string,
  ageDays: number,
  recurringSignals: string[] = [],
): InterviewProfileEvidence {
  return {
    completedAt: new Date(now.getTime() - ageDays * 86_400_000).toISOString(),
    confidence: 0.8,
    difficulty,
    dimensions: Object.fromEntries(
      INTERVIEW_EVALUATION_DIMENSIONS.map((dimension) => [
        dimension,
        { confidence: 0.75, score: Math.max(1, Math.round(rawScore / 20)) },
      ]),
    ) as InterviewProfileEvidence["dimensions"],
    evidenceCoverage: {
      hasCode: true,
      hasFirstPartyQuestionContent: false,
      hasTrustedTests: false,
      phaseTimingCount: 4,
      transcriptTurns: 8,
    },
    id,
    interviewerLevel:
      id === "a" || id === "c" || id === "e" ? "faang_tough" : "beginner",
    primaryTopicId: topicId,
    rawScore,
    recurringSignals,
    secondaryTopicIds: [],
  };
}
