import { describe, expect, it } from "vitest";

import {
  codingQuestionIdsByTier,
  codingTierForScores,
  diagnosticLevelForScore,
  diagnosticLevelLabel,
  initialDiagnosticQuestions,
  questionsByIds,
} from "@/domain/diagnostic";

describe("adaptive diagnostic domain", () => {
  it("contains the required concept and pattern coverage", () => {
    expect(
      initialDiagnosticQuestions.filter(
        (question) => question.section === "concept",
      ),
    ).toHaveLength(5);
    expect(
      initialDiagnosticQuestions.filter(
        (question) => question.section === "pattern",
      ),
    ).toHaveLength(3);
    expect(
      new Set(initialDiagnosticQuestions.map((question) => question.topicSlug)),
    ).toEqual(
      new Set([
        "arrays-and-hashing",
        "big-o",
        "graphs",
        "programming-foundations",
        "sliding-window",
        "trees",
      ]),
    );
  });

  it("keeps beginners on one foundation problem", () => {
    expect(codingTierForScores(20, 0, "complete_beginner")).toBe("foundation");
    expect(codingQuestionIdsByTier.foundation).toHaveLength(1);
    expect(questionsByIds(codingQuestionIdsByTier.foundation)[0]?.id).toBe(
      "coding-two-sum",
    );
  });

  it("assigns two intermediate problems for a developing baseline", () => {
    expect(codingTierForScores(60, 34, "basic_programming")).toBe(
      "intermediate",
    );
    expect(codingQuestionIdsByTier.intermediate).toHaveLength(2);
  });

  it("requires strong responses and prior experience for three advanced problems", () => {
    expect(codingTierForScores(100, 100, "experienced")).toBe("advanced");
    expect(codingQuestionIdsByTier.advanced).toHaveLength(3);
    expect(codingTierForScores(100, 100, "complete_beginner")).toBe(
      "intermediate",
    );
  });

  it("maps conservative overall scores to clear starting levels", () => {
    expect(diagnosticLevelForScore(49.99)).toBe("foundation");
    expect(diagnosticLevelForScore(50)).toBe("developing");
    expect(diagnosticLevelForScore(75)).toBe("independent");
    expect(diagnosticLevelLabel("developing")).toBe("Guided development");
  });
});
