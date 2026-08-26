import { describe, expect, it } from "vitest";

import catalog from "../data/problems.json";
import {
  buildProblemCatalog,
  filterProblems,
  type ProblemRow,
  type ProblemTopic,
} from "@/features/problems/model";

const timestamp = "2026-08-26T00:00:00.000Z";

function topic(id: string, name: string, slug: string): ProblemTopic {
  return {
    active: true,
    created_at: timestamp,
    curriculum_order: id === "arrays" ? 4 : 11,
    id,
    long_description: "A detailed topic description for testing.",
    name,
    short_description: "A short topic description.",
    slug,
    stage: 2,
    updated_at: timestamp,
  };
}

function problem(
  id: string,
  title: string,
  primaryTopicId: string,
  order: number,
): ProblemRow {
  return {
    active: true,
    company_tags: [],
    created_at: timestamp,
    curriculum_level: "guided",
    dataset_order: order,
    difficulty: order === 1 ? "easy" : "medium",
    estimated_minutes: 30,
    external_id: id,
    external_url: "https://leetcode.com/problems/example-" + id + "/",
    id: "problem-" + id,
    pattern_tags: order === 1 ? ["hash-map"] : ["heap", "top-k"],
    premium: false,
    primary_topic_id: primaryTopicId,
    recognition_signals: ["repeated lookup work"],
    slug: "example-" + id,
    source: "leetcode",
    title,
    updated_at: timestamp,
  };
}

describe("problem catalog", () => {
  it("contains 150 unique metadata-only source records", () => {
    expect(catalog.problems).toHaveLength(150);
    expect(new Set(catalog.problems.map((item) => item.externalId)).size).toBe(
      150,
    );
    expect(new Set(catalog.problems.map((item) => item.slug)).size).toBe(150);
    expect(
      new Set(catalog.problems.map((item) => item.primaryTopic)).size,
    ).toBe(18);
    expect(Object.keys(catalog.problems[0] ?? {}).sort()).toEqual([
      "difficulty",
      "externalId",
      "premium",
      "primaryTopic",
      "slug",
      "title",
    ]);
  });

  it("filters by search, difficulty, tags, and secondary topics", () => {
    const arrays = topic("arrays", "Arrays & Hashing", "arrays-and-hashing");
    const heap = topic("heap", "Heap / Priority Queue", "heap-priority-queue");
    const problems = buildProblemCatalog({
      prerequisites: [],
      problems: [
        problem("1", "Two Sum", arrays.id, 1),
        problem("347", "Top K Frequent Elements", arrays.id, 2),
      ],
      secondaryTopics: [{ problem_id: "problem-347", topic_id: heap.id }],
      topics: [arrays, heap],
    });

    expect(filterProblems(problems, { query: "two sum" })).toHaveLength(1);
    expect(filterProblems(problems, { difficulty: "easy" })).toHaveLength(1);
    expect(filterProblems(problems, { tag: "top-k" })).toHaveLength(1);
    expect(
      filterProblems(problems, { topic: "heap-priority-queue" })[0]
        ?.external_id,
    ).toBe("347");
  });
});
