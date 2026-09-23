/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Oracle } from "./neetcode-sequence-reference";
function fewestJumps(nums: number[]): number {
  const distances = Array(nums.length).fill(Infinity);
  distances[0] = 0;
  for (let i = 0; i < nums.length; i++)
    for (let step = 1; step <= nums[i]! && i + step < nums.length; step++)
      distances[i + step] = Math.min(distances[i + step], distances[i] + 1);
  return distances.at(-1)!;
}
export const miscellaneousOracles: Record<string, Oracle> = {
  "jump-game": ({ nums }) => Number.isFinite(fewestJumps(nums)),
  "jump-game-ii": ({ nums }) => fewestJumps(nums),
  "gas-station": ({ gas, cost }) => {
    for (let start = 0; start < gas.length; start++) {
      let fuel = 0;
      for (let step = 0; step < gas.length; step++) {
        const i = (start + step) % gas.length;
        fuel += gas[i] - cost[i];
        if (fuel < 0) break;
        if (step === gas.length - 1) return start;
      }
    }
    return -1;
  },
  "hand-of-straights": ({ hand, groupSize }) => {
    const values = [...hand].sort((a, b) => a - b);
    while (values.length) {
      const start = values[0]!;
      for (let i = 0; i < groupSize; i++) {
        const at = values.indexOf(start + i);
        if (at < 0) return false;
        values.splice(at, 1);
      }
    }
    return true;
  },
  "merge-triplets-to-form-target-triplet": ({ triplets, target }) => {
    for (let mask = 1; mask < 2 ** triplets.length; mask++) {
      const chosen = triplets.filter((_: any, i: number) => mask & (1 << i));
      if (
        target.every(
          (v: number, j: number) =>
            Math.max(...chosen.map((t: number[]) => t[j])) === v,
        )
      )
        return true;
    }
    return false;
  },
  "partition-labels": ({ s }) => {
    if (!s) return [];
    let best: number[] = [];
    for (let mask = 0; mask < 2 ** (s.length - 1); mask++) {
      const parts: string[] = [];
      let start = 0;
      for (let i = 0; i < s.length; i++)
        if (i === s.length - 1 || mask & (1 << i)) {
          parts.push(s.slice(start, i + 1));
          start = i + 1;
        }
      const seen = new Set<string>();
      let valid = true;
      for (const part of parts) {
        for (const c of new Set(part)) {
          if (seen.has(c)) valid = false;
          seen.add(c);
        }
      }
      if (valid && parts.length > best.length)
        best = parts.map((p) => p.length);
    }
    return best;
  },
  "valid-parenthesis-string": ({ s }) => {
    const solve = (i: number, balance: number): boolean => {
      if (balance < 0) return false;
      if (i === s.length) return balance === 0;
      return s[i] === "*"
        ? solve(i + 1, balance) ||
            solve(i + 1, balance + 1) ||
            solve(i + 1, balance - 1)
        : solve(i + 1, balance + (s[i] === "(" ? 1 : -1));
    };
    return solve(0, 0);
  },
  "merge-intervals": ({ intervals }) => {
    const out: number[][] = [];
    for (const [start, end] of [...intervals].sort((a, b) => a[0] - b[0])) {
      const last = out.at(-1);
      if (last && start <= last[1]!) last[1] = Math.max(last[1]!, end);
      else out.push([start, end]);
    }
    return out;
  },
  "non-overlapping-intervals": ({ intervals }) => {
    let keep = 0;
    for (let mask = 0; mask < 2 ** intervals.length; mask++) {
      const chosen = intervals
        .filter((_: any, i: number) => mask & (1 << i))
        .sort((a: number[], b: number[]) => a[0]! - b[0]!);
      if (
        chosen.every(
          (v: number[], i: number) => !i || v[0]! >= chosen[i - 1][1],
        )
      )
        keep = Math.max(keep, chosen.length);
    }
    return intervals.length - keep;
  },
  "meeting-rooms": ({ intervals }) =>
    intervals.every(([a, b]: number[], i: number) =>
      intervals.every(
        ([c, d]: number[], j: number) => i === j || b! <= c! || d! <= a!,
      ),
    ),
  "meeting-rooms-ii": ({ intervals }) =>
    Math.max(
      0,
      ...intervals.map(
        ([time]: number[]) =>
          intervals.filter(([a, b]: number[]) => a! <= time! && time! < b!)
            .length,
      ),
    ),
  "minimum-interval-to-include-each-query": ({ intervals, queries }) =>
    queries.map((q: number) => {
      const lengths = intervals
        .filter(([a, b]: number[]) => a! <= q && q <= b!)
        .map(([a, b]: number[]) => b! - a! + 1);
      return lengths.length ? Math.min(...lengths) : -1;
    }),
  "spiral-matrix": ({ matrix }) => {
    const remaining = matrix.map((r: number[]) => [...r]),
      out: number[] = [];
    while (remaining.length) {
      out.push(...remaining.shift()!);
      for (const row of remaining) if (row.length) out.push(row.pop()!);
      if (remaining.length) out.push(...remaining.pop()!.reverse());
      for (let i = remaining.length - 1; i >= 0; i--)
        if (remaining[i].length) out.push(remaining[i].shift()!);
    }
    return out;
  },
  "set-matrix-zeroes": ({ matrix }) =>
    matrix.map((row: number[], r: number) =>
      row.map((v, c) =>
        matrix[r].includes(0) ||
        matrix.some((other: number[]) => other[c] === 0)
          ? 0
          : v,
      ),
    ),
  "happy-number": ({ n }) => {
    const seen = new Set<number>();
    while (n !== 1 && !seen.has(n)) {
      seen.add(n);
      n = [...String(n)].reduce((sum, d) => sum + Number(d) ** 2, 0);
    }
    return n === 1;
  },
  "plus-one": ({ digits }) =>
    [...(BigInt(digits.join("")) + BigInt(1)).toString()].map(Number),
  "powx-n": ({ x, n }) => x ** n,
  "multiply-strings": ({ num1, num2 }) =>
    (BigInt(num1) * BigInt(num2)).toString(),
  "detect-squares": ({ ops }) => {
    const points: number[][] = [];
    return ops.map(([op, p]: any[]) => {
      if (op === "add") {
        points.push(p);
        return null;
      }
      let count = 0;
      for (let a = 0; a < points.length; a++)
        for (let b = a + 1; b < points.length; b++)
          for (let c = b + 1; c < points.length; c++) {
            const all = [p, points[a], points[b], points[c]],
              xs = [...new Set<number>(all.map((v) => v[0]))].sort(
                (a, b) => a - b,
              ),
              ys = [...new Set<number>(all.map((v) => v[1]))].sort(
                (a, b) => a - b,
              );
            if (
              xs.length === 2 &&
              ys.length === 2 &&
              xs[1]! - xs[0]! === ys[1]! - ys[0]! &&
              new Set(all.map((v) => v.join(","))).size === 4
            )
              count++;
          }
      return count;
    });
  },
};
