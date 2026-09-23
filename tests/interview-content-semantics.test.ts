// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { expansionOracles } from "./fixtures/neetcode-reference";
vi.mock("server-only", () => ({}));

import {
  APPROVED_INTERVIEW_QUESTION_SLUGS,
  getApprovedInterviewQuestion,
} from "@/features/interview-evaluation/question-content";

// Reference calculations deliberately prioritize clarity over the interview's
// required complexity. They check authored examples, never execute user code.
type Solver = (input: string) => unknown;
function parameters(input: string): Record<string, unknown> {
  return Object.fromEntries(
    input.split(/,\s*(?=\w+\s*=)/).map((part) => {
      const split = part.indexOf("=");
      return [part.slice(0, split).trim(), JSON.parse(part.slice(split + 1))];
    }),
  );
}
function array(input: string, name: string) {
  return parameters(input)[name] as number[];
}
function integer(input: string, name: string) {
  return parameters(input)[name] as number;
}
function text(input: string) {
  return parameters(input).text as string;
}
const solvers: Record<string, Solver> = {
  "binary-search": (input) =>
    array(input, "nums").indexOf(integer(input, "target")),
  "best-time-to-buy-and-sell-stock": (input) => {
    const prices = array(input, "prices");
    return Math.max(
      0,
      ...prices.flatMap((buy, i) =>
        prices.slice(i + 1).map((sell) => sell - buy),
      ),
    );
  },
  "climbing-stairs": (input) => {
    const count = (remaining: number): number =>
      remaining < 0
        ? 0
        : remaining === 0
          ? 1
          : count(remaining - 1) + count(remaining - 2);
    return count(integer(input, "n"));
  },
  "contains-duplicate": (input) => {
    const values = array(input, "nums");
    return new Set(values).size !== values.length;
  },
  "implement-trie-prefix-tree": (input) => {
    const words = new Set<string>();
    return [...input.matchAll(/(insert|search|startsWith)\("([^"]+)"\)/g)].map(
      ([, operation, word]) => {
        if (operation === "insert") {
          words.add(word!);
          return null;
        }
        return operation === "search"
          ? words.has(word!)
          : [...words].some((stored) => stored.startsWith(word!));
      },
    );
  },
  "insert-interval": (input) => {
    const values = parameters(input);
    const intervals = [
      ...(values.intervals as number[][]),
      values.newInterval as number[],
    ].sort((a, b) => a[0]! - b[0]!);
    const merged: number[][] = [];
    for (const [start, end] of intervals) {
      const last = merged.at(-1);
      if (last && last[1]! >= start!) last[1] = Math.max(last[1]!, end!);
      else merged.push([start!, end!]);
    }
    return merged;
  },
  "kth-largest-element-in-a-stream": (input) => {
    const match = input.match(/KthLargest\((\d+), (\[[^\]]*\])\)/)!;
    const k = Number(match[1]);
    const values = JSON.parse(match[2]!) as number[];
    return [...input.matchAll(/add\((-?\d+)\)/g)].map((addition) => {
      values.push(Number(addition[1]));
      expect(values.length).toBeGreaterThanOrEqual(k);
      return [...values].sort((a, b) => b - a)[k - 1];
    });
  },
  "maximum-subarray": (input) => {
    const values = array(input, "nums");
    return Math.max(
      ...values.flatMap((_, i) =>
        values
          .slice(i)
          .map((_, length) =>
            values
              .slice(i, i + length + 1)
              .reduce((sum, value) => sum + value, 0),
          ),
      ),
    );
  },
  "network-delay-time": (input) => {
    const { times, n, source } = parameters(input) as {
      times: number[][];
      n: number;
      source: number;
    };
    const distances = Array<number>(n).fill(Infinity);
    distances[source - 1] = 0;
    // Bellman-Ford as an independent reference, regardless of expected solution.
    for (let pass = 1; pass < n; pass++)
      for (const [from, to, cost] of times) {
        distances[to! - 1] = Math.min(
          distances[to! - 1]!,
          distances[from! - 1]! + cost!,
        );
      }
    const maximum = Math.max(...distances);
    return Number.isFinite(maximum) ? maximum : -1;
  },
  "number-of-islands": (input) => {
    const grid = parameters(input).grid as string[][];
    const seen = new Set<string>();
    let islands = 0;
    for (let row = 0; row < grid.length; row++)
      for (let col = 0; col < grid[row]!.length; col++) {
        if (grid[row]![col] !== "1" || seen.has(`${row},${col}`)) continue;
        islands++;
        const pending = [[row, col]];
        while (pending.length) {
          const [r, c] = pending.pop()!;
          const key = `${r},${c}`;
          if (grid[r!]?.[c!] !== "1" || seen.has(key)) continue;
          seen.add(key);
          pending.push([r! - 1, c!], [r! + 1, c!], [r!, c! - 1], [r!, c! + 1]);
        }
      }
    return islands;
  },
  "reverse-linked-list": (input) =>
    input
      .replace("head = ", "")
      .split(" -> ")
      .filter((part) => part !== "null")
      .reverse()
      .concat("null")
      .join(" -> "),
  "rotate-image": (input) => {
    const matrix = parameters(input).matrix as number[][];
    return matrix.map((_, row) =>
      matrix.map((_, col) => matrix[matrix.length - col - 1]![row]),
    );
  },
  // This example specifies a round-trip property, not a particular encoding.
  "serialize-and-deserialize-binary-tree": (input) => parameters(input).root,
  "single-number": (input) => {
    const values = array(input, "nums");
    const singles = values.filter(
      (value) => values.filter((other) => other === value).length === 1,
    );
    expect(singles).toHaveLength(1);
    expect(
      values.every((value) =>
        [1, 2].includes(values.filter((other) => other === value).length),
      ),
    ).toBe(true);
    return singles[0];
  },
  subsets: (input) => {
    const values = array(input, "nums");
    expect(new Set(values).size).toBe(values.length);
    return Array.from({ length: 2 ** values.length }, (_, mask) =>
      values.filter((_, bit) => (mask & (1 << bit)) !== 0),
    );
  },
  "unique-paths": (input) => {
    const { rows, columns } = parameters(input) as {
      rows: number;
      columns: number;
    };
    const moves = rows + columns - 2;
    // Count ways to choose positions for the down moves.
    let combinations = 1;
    for (let i = 1; i < rows; i++)
      combinations = (combinations * (moves - i + 1)) / i;
    return combinations;
  },
  "valid-palindrome": (input) => {
    const normalized = text(input)
      .toLowerCase()
      .replaceAll(/[^a-z0-9]/g, "");
    return normalized === [...normalized].reverse().join("");
  },
  "valid-parentheses": (input) => {
    let remaining = text(input);
    let previous;
    do {
      previous = remaining;
      remaining = remaining.replaceAll(/\(\)|\[\]|\{\}/g, "");
    } while (remaining !== previous);
    return remaining.length === 0;
  },
  "median-of-two-sorted-arrays": (input) => {
    const left = array(input, "left");
    const right = array(input, "right");
    for (const values of [left, right])
      expect(values).toEqual([...values].sort((a, b) => a - b));
    const sorted = [...left, ...right].sort((a, b) => a - b);
    expect(sorted.length).toBeGreaterThan(0);
    return (
      (sorted[Math.floor((sorted.length - 1) / 2)]! +
        sorted[Math.floor(sorted.length / 2)]!) /
      2
    );
  },
  "merge-k-sorted-lists": (input) => {
    const lists = parameters(input).lists as number[][];
    for (const list of lists)
      expect(list).toEqual([...list].sort((a, b) => a - b));
    return lists.flat().sort((a, b) => a - b);
  },
};

function normalizedOutput(slug: string, output: string): unknown {
  if (slug === "reverse-linked-list") return output;
  if (slug === "serialize-and-deserialize-binary-tree")
    return JSON.parse(output.split(" = ")[1]!);
  if (
    ["implement-trie-prefix-tree", "kth-largest-element-in-a-stream"].includes(
      slug,
    )
  )
    return JSON.parse(`[${output}]`);
  return JSON.parse(output);
}
function normalizedSubsets(value: unknown) {
  return (value as number[][])
    .map((subset) => JSON.stringify([...subset].sort((a, b) => a - b)))
    .sort();
}

describe("independent checks of approved interview examples", () => {
  it("has a semantic checker for every approved prompt", () => {
    expect(
      [...Object.keys(solvers), ...Object.keys(expansionOracles)].sort(),
    ).toEqual([...APPROVED_INTERVIEW_QUESTION_SLUGS].sort());
  });
  for (const slug of Object.keys(solvers)) {
    it(slug, () => {
      const content = getApprovedInterviewQuestion(slug)!;
      expect(content.examples.length).toBeGreaterThan(0);
      for (const example of content.examples) {
        const computed = solvers[slug]!(example.input);
        const expected = normalizedOutput(slug, example.output);
        expect(
          slug === "subsets" ? normalizedSubsets(expected) : expected,
          example.input,
        ).toEqual(slug === "subsets" ? normalizedSubsets(computed) : computed);
      }
    });
  }
});
