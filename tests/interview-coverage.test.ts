import { describe, expect, it } from "vitest";

import { buildInterviewCoverage } from "@/domain/interview-coverage";
import {
  NEETCODE_150_EXPECTED_PROBLEM_COUNT,
  NEETCODE_150_EXPECTED_TOPIC_COUNT,
} from "@/domain/neetcode-150";

describe("interview topic coverage", () => {
  it("tracks distinct covered topics instead of total interviews", () => {
    const coverage = buildInterviewCoverage({
      completedInterviews: [
        completed("problem-a1", "2026-08-01T10:00:00.000Z"),
        completed("problem-a2", "2026-08-02T10:00:00.000Z"),
        completed("problem-b1", "2026-08-03T10:00:00.000Z"),
      ],
      memberships: [
        membership("problem-a1", "topic-a", 1),
        membership("problem-a2", "topic-a", 2),
        membership("problem-b1", "topic-b", 3),
        membership("problem-c1", "topic-c", 4),
      ],
      topics: [
        topic("topic-a", "arrays", "Arrays"),
        topic("topic-b", "trees", "Trees"),
        topic("topic-c", "graphs", "Graphs"),
      ],
    });

    expect(coverage.coveredTopicCount).toBe(2);
    expect(coverage.totalTopicCount).toBe(3);
    expect(coverage.complete).toBe(false);
    expect(coverage.missingTopics.map((item) => item.id)).toEqual(["topic-c"]);
    expect(coverage.topics[0]?.completedInterviews).toBe(2);
    expect(coverage.recentTopicIds).toEqual(["topic-b", "topic-a"]);
  });

  it("becomes incomplete again when the only interview for a topic is absent", () => {
    const base = {
      memberships: [
        membership("problem-a", "topic-a", 1),
        membership("problem-b", "topic-b", 2),
      ],
      topics: [
        topic("topic-a", "arrays", "Arrays"),
        topic("topic-b", "trees", "Trees"),
      ],
    };
    const complete = buildInterviewCoverage({
      ...base,
      completedInterviews: [
        completed("problem-a", "2026-08-01T10:00:00.000Z"),
        completed("problem-b", "2026-08-02T10:00:00.000Z"),
      ],
    });
    const afterDeletion = buildInterviewCoverage({
      ...base,
      completedInterviews: [completed("problem-a", "2026-08-01T10:00:00.000Z")],
    });

    expect(complete.complete).toBe(true);
    expect(afterDeletion.complete).toBe(false);
    expect(afterDeletion.missingTopics[0]?.id).toBe("topic-b");
  });

  it("ignores completed problems outside the canonical collection", () => {
    const coverage = buildInterviewCoverage({
      completedInterviews: [
        completed("outside-problem", "2026-08-01T10:00:00.000Z"),
      ],
      memberships: [membership("problem-a", "topic-a", 1)],
      topics: [topic("topic-a", "arrays", "Arrays")],
    });

    expect(coverage.coveredTopicCount).toBe(0);
    expect(coverage.missingTopics).toHaveLength(1);
  });

  it("documents the current canonical collection size", () => {
    expect(NEETCODE_150_EXPECTED_PROBLEM_COUNT).toBe(150);
    expect(NEETCODE_150_EXPECTED_TOPIC_COUNT).toBe(18);
  });
});

function completed(problemId: string, completedAt: string) {
  return { completedAt, problemId };
}

function membership(
  problemId: string,
  primaryTopicId: string,
  ordinal: number,
) {
  return { ordinal, primaryTopicId, problemId };
}

function topic(id: string, slug: string, name: string) {
  return { id, name, slug };
}
