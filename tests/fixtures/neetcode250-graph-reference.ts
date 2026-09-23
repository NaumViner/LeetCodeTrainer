/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Oracle } from "./neetcode-sequence-reference";
export const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
const sum = (a: number[]) => a.reduce((s, v) => s + v, 0);
export function equalBuckets(nums: number[], k: number) {
  const target = sum(nums) / k;
  if (!Number.isInteger(target)) return false;
  const buckets = Array(k).fill(0);
  const f = (i: number): boolean => {
    if (i === nums.length) return buckets.every((v) => v === target);
    for (let j = 0; j < k; j++) {
      if (buckets[j] + nums[i] > target) continue;
      buckets[j] += nums[i];
      if (f(i + 1)) return true;
      buckets[j] -= nums[i]!;
      if (!buckets[j]) break;
    }
    return false;
  };
  return f(0);
}
export const extendedGraphOracles: Record<string, Oracle> = {
  "path-with-minimum-effort": ({ heights }) => {
    const h = heights.length,
      w = heights[0].length,
      n = h * w;
    const d = Array(n).fill(Infinity);
    d[0] = 0;
    for (let t = 0; t < n; t++)
      for (let i = 0; i < n; i++) {
        const r = Math.floor(i / w),
          c = i % w;
        for (const [nr, nc] of [
          [r + 1, c],
          [r - 1, c],
          [r, c + 1],
          [r, c - 1],
        ] as const)
          if (nr >= 0 && nr < h && nc >= 0 && nc < w)
            d[nr * w + nc] = Math.min(
              d[nr * w + nc],
              Math.max(d[i], Math.abs(heights[r][c] - heights[nr][nc])),
            );
      }
    return d[n - 1];
  },
  "find-critical-and-pseudo-critical-edges-in-minimum-spanning-tree": ({
    n,
    edges,
  }) => {
    let best = Infinity;
    let trees: number[][] = [];
    for (let mask = 0; mask < 2 ** edges.length; mask++) {
      const ids = edges
        .map((_: any, i: number) => i)
        .filter((i: number) => mask & (1 << i));
      if (ids.length !== n - 1) continue;
      const seen = new Set([0]);
      for (let t = 0; t < n; t++)
        for (const i of ids) {
          const [a, b] = edges[i];
          if (seen.has(a)) seen.add(b);
          if (seen.has(b)) seen.add(a);
        }
      if (seen.size !== n) continue;
      const cost = sum(ids.map((i: number) => edges[i][2]));
      if (cost < best) {
        best = cost;
        trees = [];
      }
      if (cost === best) trees.push(ids);
    }
    const all = edges.map((_: any, i: number) => i);
    return [
      all.filter((i: number) => trees.every((t) => t.includes(i))),
      all.filter(
        (i: number) =>
          trees.some((t) => t.includes(i)) &&
          !trees.every((t) => t.includes(i)),
      ),
    ];
  },
  "build-a-matrix-with-conditions": ({ k, rowConditions, colConditions }) => {
    const order = (edges: number[][]) => {
      const out: number[] = [];
      while (out.length < k) {
        const v = Array.from({ length: k }, (_, i) => i + 1).find(
          (v) =>
            !out.includes(v) &&
            edges.every(([a, b]) => b !== v || out.includes(a!)),
        );
        if (v === undefined) return [];
        out.push(v);
      }
      return out;
    };
    const row = order(rowConditions),
      col = order(colConditions);
    if (!row.length || !col.length) return [];
    const m = Array.from({ length: k }, () => Array(k).fill(0));
    for (let v = 1; v <= k; v++) m[row.indexOf(v)]![col.indexOf(v)] = v;
    return m;
  },
  "greatest-common-divisor-traversal": ({ nums }) => {
    const seen = new Set([0]);
    for (let t = 0; t < nums.length; t++)
      for (let i = 0; i < nums.length; i++)
        if (seen.has(i))
          for (let j = 0; j < nums.length; j++)
            if (gcd(nums[i], nums[j]) > 1) seen.add(j);
    return seen.size === nums.length;
  },
  "island-perimeter": ({ grid }) => {
    let p = 0;
    for (let r = 0; r < grid.length; r++)
      for (let c = 0; c < grid[0].length; c++)
        if (grid[r][c])
          for (const [dr, dc] of [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
          ] as const)
            if (!grid[r + dr]?.[c + dc]) p++;
    return p;
  },
  "verifying-an-alien-dictionary": ({ words, order }) => {
    const encode = (s: string) =>
      [...s].map((c) => String.fromCharCode(97 + order.indexOf(c))).join("");
    return words.every(
      (s: string, i: number) => !i || encode(words[i - 1]) <= encode(s),
    );
  },
  "find-the-town-judge": ({ n, trust }) => {
    for (let v = 1; v <= n; v++)
      if (
        trust.filter(([a]: [number]) => a === v).length === 0 &&
        trust.filter(([, b]: [number, number]) => b === v).length === n - 1
      )
        return v;
    return -1;
  },
  "open-the-lock": ({ deadends, target }) => {
    const seen = new Set(deadends);
    if (seen.has("0000")) return -1;
    const q: [string, number][] = [["0000", 0]];
    seen.add("0000");
    for (let i = 0; i < q.length; i++) {
      const [s, d] = q[i]!;
      if (s === target) return d;
      for (let p = 0; p < 4; p++)
        for (const step of [-1, 1]) {
          const v =
            s.slice(0, p) + ((Number(s[p]) + step + 10) % 10) + s.slice(p + 1);
          if (!seen.has(v)) {
            seen.add(v);
            q.push([v, d + 1]);
          }
        }
    }
    return -1;
  },
  "course-schedule-iv": ({ numCourses, prerequisites, queries }) =>
    queries.map(([a, b]: [number, number]) => {
      const seen = new Set<number>();
      const visit = (v: number): boolean => {
        if (v === b) return true;
        if (seen.has(v)) return false;
        seen.add(v);
        return prerequisites.some(
          ([u, w]: [number, number]) => u === v && visit(w),
        );
      };
      if (a >= numCourses) throw Error("Invalid course");
      return visit(a);
    }),
  "accounts-merge": ({ accounts }) => {
    const groups: { name: string; emails: Set<string> }[] = accounts.map(
      ([name, ...emails]: string[]) => ({ name, emails: new Set(emails) }),
    );
    let changed = true;
    while (changed) {
      changed = false;
      outer: for (let i = 0; i < groups.length; i++)
        for (let j = i + 1; j < groups.length; j++)
          if ([...groups[i]!.emails].some((e) => groups[j]!.emails.has(e))) {
            for (const e of groups[j]!.emails) groups[i]!.emails.add(e);
            groups.splice(j, 1);
            changed = true;
            break outer;
          }
    }
    return groups.map((g) => [g.name, ...[...g.emails].sort()]);
  },
  "evaluate-division": ({ equations, values, queries }) => {
    const graph = new Map<string, [string, number][]>();
    equations.forEach(([a, b]: [string, string], i: number) => {
      graph.set(a, [...(graph.get(a) ?? []), [b, values[i]]]);
      graph.set(b, [...(graph.get(b) ?? []), [a, 1 / values[i]]]);
    });
    return queries.map(([a, b]: [string, string]) => {
      if (!graph.has(a) || !graph.has(b)) return -1;
      const seen = new Set<string>();
      const f = (v: string, ratio: number): number => {
        if (v === b) return ratio;
        seen.add(v);
        for (const [w, r] of graph.get(v) ?? [])
          if (!seen.has(w)) {
            const found = f(w, ratio * r);
            if (found !== -1) return found;
          }
        return -1;
      };
      return f(a, 1);
    });
  },
  "minimum-height-trees": ({ n, edges }) => {
    const heights = Array.from({ length: n }, (_, root) => {
      const d = Array(n).fill(Infinity);
      d[root] = 0;
      for (let i = 0; i < n; i++)
        for (const [a, b] of edges) {
          d[a] = Math.min(d[a], d[b] + 1);
          d[b] = Math.min(d[b], d[a] + 1);
        }
      return Math.max(...d);
    });
    return heights.flatMap((v, i) => (v === Math.min(...heights) ? [i] : []));
  },
  "sum-of-all-subset-xor-totals": ({ nums }) => {
    let total = 0;
    for (let mask = 0; mask < 2 ** nums.length; mask++) {
      let x = 0;
      nums.forEach((v: number, i: number) => {
        if (mask & (1 << i)) x ^= v;
      });
      total += x;
    }
    return total;
  },
  combinations: ({ n, k }) => {
    const out: number[][] = [];
    const f = (i: number, a: number[]) => {
      if (a.length === k) {
        out.push(a);
        return;
      }
      for (let j = i; j <= n; j++) f(j + 1, [...a, j]);
    };
    f(1, []);
    return out;
  },
  "permutations-ii": ({ nums }) => {
    const out = new Map<string, number[]>();
    const f = (left: number[], a: number[]) => {
      if (!left.length) out.set(JSON.stringify(a), a);
      left.forEach((v, i) =>
        f(
          left.filter((_, j) => i !== j),
          [...a, v],
        ),
      );
    };
    f(nums, []);
    return [...out.values()];
  },
  "matchsticks-to-square": ({ matchsticks }) => equalBuckets(matchsticks, 4),
  "partition-to-k-equal-sum-subsets": ({ nums, k }) => equalBuckets(nums, k),
  "n-queens-ii": ({ n }) => {
    const f = (cols: number[]): number =>
      cols.length === n
        ? 1
        : Array.from({ length: n }, (_, c) =>
            cols.every(
              (old, r) => c !== old && Math.abs(c - old) !== cols.length - r,
            )
              ? f([...cols, c])
              : 0,
          ).reduce((a, b) => a + b, 0);
    return f([]);
  },
  "word-break-ii": ({ s, wordDict }) => {
    const f = (i: number): string[] =>
      i === s.length
        ? [""]
        : wordDict.flatMap((w: string) =>
            s.startsWith(w, i)
              ? f(i + w.length).map((t) => w + (t ? " " + t : ""))
              : [],
          );
    return f(0);
  },
};
