// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import catalog from "../data/neetcode-250.json";
import {
  APPROVED_INTERVIEW_QUESTION_SLUGS,
  getApprovedInterviewQuestion,
  getLearnerVisibleQuestionContent,
} from "@/features/interview-evaluation/question-content";
import { expansionOracles } from "./fixtures/neetcode-reference";
import {
  readTree,
  traversal,
} from "./fixtures/neetcode250-structure-reference";
import originalCatalog from "../data/problems.json";
import newFollowUps from "../data/neetcode250-follow-ups.json";

// Normalize only permutations explicitly allowed by each problem contract.
// Do not sort paths, coordinates, partition pieces or ordered operation results.
const unorderedOuter = new Set([
  "4sum",
  "majority-element-ii",
  "accounts-merge",
  "minimum-height-trees",
  "combinations",
  "permutations-ii",
  "word-break-ii",
  "top-k-frequent-elements",
  "3sum",
  "group-anagrams",
  "combination-sum",
  "combination-sum-ii",
  "permutations",
  "subsets-ii",
  "generate-parentheses",
  "palindrome-partitioning",
  "letter-combinations-of-a-phone-number",
  "n-queens",
  "k-closest-points-to-origin",
  "word-search-ii",
  "pacific-atlantic-water-flow",
]);
const unorderedInner = new Set([
  "3sum",
  "group-anagrams",
  "combination-sum",
  "combination-sum-ii",
  "subsets-ii",
]);
function normalize(slug: string, value: unknown): unknown {
  if (
    slug === "find-critical-and-pseudo-critical-edges-in-minimum-spanning-tree"
  )
    return (value as number[][]).map((a) => [...a].sort((a, b) => a - b));
  if (slug === "remove-element") {
    const v = value as { k: number; kept: number[] };
    return { k: v.k, kept: [...v.kept].sort((a, b) => a - b) };
  }
  if (!unorderedOuter.has(slug)) return value;
  return (value as unknown[])
    .map((v) =>
      JSON.stringify(
        unorderedInner.has(slug) ? [...(v as unknown[])].sort() : v,
      ),
    )
    .sort();
}

describe("complete NeetCode 250 interview content", () => {
  it("covers the exact pinned 250-question catalog without aliases or omissions", () => {
    expect(catalog.problems).toHaveLength(250);
    expect([...APPROVED_INTERVIEW_QUESTION_SLUGS].sort()).toEqual(
      catalog.problems.map((p) => p.slug).sort(),
    );
    expect(Object.keys(expansionOracles)).toHaveLength(230);
    expect(new Set(catalog.problems.map((p) => p.externalId)).size).toBe(250);
    for (const p of originalCatalog.problems)
      expect(catalog.problems.find((x) => x.slug === p.slug)).toEqual(p);
    expect(Object.keys(newFollowUps).sort()).toEqual(
      catalog.problems
        .filter((p) => !originalCatalog.problems.some((x) => x.slug === p.slug))
        .map((p) => p.slug)
        .sort(),
    );
  });
  for (const [slug, solve] of Object.entries(expansionOracles)) {
    it(`validates original examples and learner boundary: ${slug}`, () => {
      const content = getApprovedInterviewQuestion(slug)!;
      expect(content.contentVersion).toBe(1);
      expect(content.examples.length).toBeGreaterThanOrEqual(2);
      expect(content.constraints.length).toBeGreaterThan(0);
      expect(content.expectedInvariants.length).toBeGreaterThanOrEqual(2);
      expect(getLearnerVisibleQuestionContent(slug)).not.toHaveProperty(
        "expectedInvariants",
      );
      for (const example of content.examples) {
        const input = JSON.parse(example.input),
          expected = JSON.parse(example.output);
        const computed = solve(structuredClone(input));
        if (slug === "reorganize-string") {
          if (computed === "") expect(expected).toBe("");
          else {
            expect([...expected].sort()).toEqual([...input.s].sort());
            for (let i = 1; i < expected.length; i++)
              expect(expected[i]).not.toBe(expected[i - 1]);
          }
        } else if (slug === "longest-happy-string") {
          expect(expected.length).toBe(computed.length);
          expect(expected).toMatch(/^[abc]*$/);
          for (const c of ["a", "b", "c"])
            expect(
              [...expected].filter((x) => x === c).length,
            ).toBeLessThanOrEqual(input[c]);
          expect(expected).not.toMatch(/aaa|bbb|ccc/);
        } else if (slug === "build-a-matrix-with-conditions") {
          if (!computed.length) expect(expected).toEqual([]);
          else {
            expect(expected).toHaveLength(input.k);
            for (const row of expected) expect(row).toHaveLength(input.k);
            expect(
              expected
                .flat()
                .filter((v: number) => v !== 0)
                .sort((a: number, b: number) => a - b),
            ).toEqual(Array.from({ length: input.k }, (_, i) => i + 1));
            const pos = (v: number) => {
              const r = expected.findIndex((row: number[]) => row.includes(v));
              return [r, expected[r].indexOf(v)];
            };
            for (const [a, b] of input.rowConditions)
              expect(pos(a)[0]).toBeLessThan(pos(b)[0]);
            for (const [a, b] of input.colConditions)
              expect(pos(a)[1]).toBeLessThan(pos(b)[1]);
          }
        } else if (
          slug === "insert-into-a-binary-search-tree" ||
          slug === "delete-node-in-a-bst"
        ) {
          const values = traversal(readTree(expected));
          expect(values).toEqual(traversal(readTree(computed)));
          for (let i = 1; i < values.length; i++)
            expect(values[i]).toBeGreaterThan(values[i - 1]!);
        } else if (slug === "evaluate-division") {
          expect(expected).toHaveLength(computed.length);
          expected.forEach((v: number, i: number) =>
            expect(v).toBeCloseTo(computed[i], 5),
          );
        } else if (slug === "course-schedule-ii") {
          if (computed.length === 0) expect(expected).toEqual([]);
          else {
            expect([...expected].sort()).toEqual(
              Array.from({ length: input.numCourses }, (_, i) => i).sort(),
            );
            for (const [course, prerequisite] of input.prerequisites)
              expect(expected.indexOf(prerequisite)).toBeLessThan(
                expected.indexOf(course),
              );
          }
        } else if (slug === "alien-dictionary") {
          if (computed === "") expect(expected).toBe("");
          else {
            expect([...expected].sort()).toEqual(
              [...new Set<string>(input.words.join(""))].sort(),
            );
            for (let i = 1; i < input.words.length; i++) {
              const a = input.words[i - 1] as string,
                b = input.words[i] as string;
              const first = [...a].findIndex((c, j) => c !== b[j]);
              if (first < 0) expect(a.length).toBeLessThanOrEqual(b.length);
              else {
                expect(b[first]).toBeDefined();
                expect(expected.indexOf(a[first])).toBeLessThan(
                  expected.indexOf(b[first]),
                );
              }
            }
          }
        } else {
          expect(
            normalize(slug, expected),
            `${slug}: ${example.input}`,
          ).toEqual(normalize(slug, computed));
        }
      }
    });
  }
});
