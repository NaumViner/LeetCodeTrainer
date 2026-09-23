// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import catalog from "../data/neetcode-250.json";
import { buildInterviewCoverage } from "@/domain/interview-coverage";
import {
  selectCoverageInterview,
  type InterviewDifficulty,
} from "@/domain/interview-selection";
import { APPROVED_INTERVIEW_QUESTION_SLUGS } from "@/features/interview-evaluation/question-content";

const ready = new Set(APPROVED_INTERVIEW_QUESTION_SLUGS);
const problems = catalog.problems.map((problem, index) => ({
  active: true,
  availableForInterview: ready.has(problem.slug),
  datasetOrder: index,
  difficulty: problem.difficulty as InterviewDifficulty,
  id: problem.slug,
  primaryTopicId: problem.primaryTopic,
}));
const topics = [...new Set(problems.map((p) => p.primaryTopicId))].map(
  (id) => ({ id, name: id, slug: id }),
);
const memberships = problems.map((p) => ({
  problemId: p.id,
  primaryTopicId: p.primaryTopicId,
  ordinal: p.datasetOrder,
}));

describe("selection against the actual approved beta inventory", () => {
  it("offers at least three Hard prompts across three topics", () => {
    const hard = problems.filter(
      (p) => p.availableForInterview && p.difficulty === "hard",
    );
    expect(hard.length).toBeGreaterThanOrEqual(3);
    expect(
      new Set(hard.map((p) => p.primaryTopicId)).size,
    ).toBeGreaterThanOrEqual(3);
    expect(problems.filter((p) => p.availableForInterview)).toHaveLength(
      ready.size,
    );
  });
  it.each<InterviewDifficulty[][]>(
    [
      ["easy"],
      ["medium"],
      ["hard"],
      ["easy", "medium"],
      ["medium", "hard"],
      ["easy", "medium", "hard"],
    ].map((difficulties) => [difficulties as InterviewDifficulty[]]),
  )(
    "can continue for 300 interviews within %j without faking global coverage",
    (selectedDifficulties) => {
      const completed: { problemId: string; completedAt: string }[] = [];
      let repeated = false;
      let fallback = false;
      for (let index = 0; index < 300; index++) {
        const coverage = buildInterviewCoverage({
          completedInterviews: completed,
          memberships,
          topics,
        });
        const before = JSON.stringify(coverage);
        const result = selectCoverageInterview({
          catalog: problems,
          collectionProblemIds: new Set(problems.map((p) => p.id)),
          completedProblemIds: new Set(completed.map((p) => p.problemId)),
          coverage,
          randomIndex: () => 0,
          selectedDifficulties,
        });
        expect(result.ok).toBe(true);
        if (!result.ok) throw new Error(result.message);
        expect(selectedDifficulties).toContain(result.problem.difficulty);
        expect(ready.has(result.problem.id)).toBe(true);
        expect(JSON.stringify(coverage)).toBe(before);
        repeated ||= result.metadata.repeatFallbackUsed;
        fallback ||= result.metadata.coverageFallbackUsed === true;
        completed.push({
          problemId: result.problem.id,
          completedAt: new Date(Date.UTC(2026, 8, 19, 0, index)).toISOString(),
        });
      }
      const coverage = buildInterviewCoverage({
        completedInterviews: completed,
        memberships,
        topics,
      });
      const eligibleTopics = new Set(
        problems
          .filter(
            (p) =>
              p.availableForInterview &&
              selectedDifficulties.includes(p.difficulty),
          )
          .map((p) => p.primaryTopicId),
      );
      expect(coverage.coveredTopicCount).toBe(eligibleTopics.size);
      expect(coverage.complete).toBe(eligibleTopics.size === topics.length);
      expect(repeated).toBe(true);
      expect(fallback).toBe(eligibleTopics.size < topics.length);
    },
  );
});
