/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Oracle } from "./neetcode-sequence-reference";
import { wordExists } from "./neetcode-structure-reference";

const directions = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];
function components(n: number, edges: number[][]): number {
  const adjacency = Array.from({ length: n }, () => [] as number[]);
  for (const [a, b] of edges) {
    adjacency[a!]!.push(b!);
    adjacency[b!]!.push(a!);
  }
  const seen = new Set<number>();
  let count = 0;
  const visit = (v: number) => {
    if (seen.has(v)) return;
    seen.add(v);
    for (const next of adjacency[v]!) visit(next);
  };
  for (let v = 0; v < n; v++)
    if (!seen.has(v)) {
      count++;
      visit(v);
    }
  return count;
}
function orderCourses(n: number, edges: number[][]): number[] {
  const out: number[] = [],
    visited = new Set<number>();
  let failed = false;
  const visit = (v: number, path: Set<number>) => {
    if (path.has(v)) {
      failed = true;
      return;
    }
    if (visited.has(v)) return;
    const next = new Set(path).add(v);
    for (const [a, b] of edges) if (a === v) visit(b!, next);
    visited.add(v);
    out.push(v);
  };
  for (let v = 0; v < n; v++) visit(v, new Set());
  return failed ? [] : out;
}
export const searchOracles: Record<string, Oracle> = {
  "combination-sum": ({ candidates, target }) => {
    const out: number[][] = [];
    const walk = (i: number, left: number, path: number[]) => {
      if (left === 0) {
        out.push([...path].sort((a, b) => a - b));
        return;
      }
      if (i === candidates.length) return;
      for (let count = 0; count * candidates[i] <= left; count++)
        walk(i + 1, left - count * candidates[i], [
          ...path,
          ...Array(count).fill(candidates[i]),
        ]);
    };
    walk(0, target, []);
    return out;
  },
  "combination-sum-ii": ({ candidates, target }) => {
    const result = new Map<string, number[]>();
    for (let mask = 0; mask < 2 ** candidates.length; mask++) {
      const values = candidates.filter(
        (_: number, i: number) => mask & (1 << i),
      );
      if (values.reduce((a: number, b: number) => a + b, 0) === target) {
        values.sort((a: number, b: number) => a - b);
        result.set(JSON.stringify(values), values);
      }
    }
    return [...result.values()];
  },
  permutations: ({ nums }) => {
    const all = (values: number[]): number[][] =>
      values.length
        ? values.flatMap((v, i) =>
            all(values.filter((_, j) => i !== j)).map((t) => [v, ...t]),
          )
        : [[]];
    return all(nums);
  },
  "subsets-ii": ({ nums }) => {
    const out = new Map<string, number[]>();
    for (let mask = 0; mask < 2 ** nums.length; mask++) {
      const s = nums
        .filter((_: number, i: number) => mask & (1 << i))
        .sort((a: number, b: number) => a - b);
      out.set(JSON.stringify(s), s);
    }
    return [...out.values()];
  },
  "generate-parentheses": ({ n }) => {
    const out: string[] = [];
    for (let mask = 0; mask < 2 ** (2 * n); mask++) {
      let balance = 0,
        s = "",
        valid = true;
      for (let i = 0; i < 2 * n; i++) {
        const open = !!(mask & (1 << i));
        s += open ? "(" : ")";
        balance += open ? 1 : -1;
        if (balance < 0) valid = false;
      }
      if (valid && balance === 0) out.push(s);
    }
    return out;
  },
  "word-search": ({ board, word }) => wordExists(board, word),
  "palindrome-partitioning": ({ s }) => {
    const all = (text: string): string[][] => {
      if (!text) return [[]];
      const out: string[][] = [];
      for (let i = 1; i <= text.length; i++) {
        const prefix = text.slice(0, i);
        if (prefix === [...prefix].reverse().join(""))
          for (const suffix of all(text.slice(i)))
            out.push([prefix, ...suffix]);
      }
      return out;
    };
    return all(s);
  },
  "letter-combinations-of-a-phone-number": ({ digits }) => {
    if (!digits) return [];
    const letters: Record<string, string> = {
      2: "abc",
      3: "def",
      4: "ghi",
      5: "jkl",
      6: "mno",
      7: "pqrs",
      8: "tuv",
      9: "wxyz",
    };
    let out = [""];
    for (const d of digits)
      out = out.flatMap((s) => [...letters[d]!].map((c) => s + c));
    return out;
  },
  "n-queens": ({ n }) => {
    const out: string[][] = [];
    const go = (cols: number[]) => {
      if (cols.length === n) {
        out.push(cols.map((c) => ".".repeat(c) + "Q" + ".".repeat(n - c - 1)));
        return;
      }
      for (let c = 0; c < n; c++)
        if (
          cols.every((v, r) => v !== c && Math.abs(v - c) !== cols.length - r)
        )
          go([...cols, c]);
    };
    go([]);
    return out;
  },
  "max-area-of-island": ({ grid }) => {
    const seen = new Set<string>();
    const area = (r: number, c: number): number => {
      const key = `${r},${c}`;
      if (grid[r]?.[c] !== 1 || seen.has(key)) return 0;
      seen.add(key);
      return (
        1 + directions.reduce((s, [dr, dc]) => s + area(r + dr!, c + dc!), 0)
      );
    };
    let best = 0;
    grid.forEach((row: number[], r: number) =>
      row.forEach((_, c) => {
        best = Math.max(best, area(r, c));
      }),
    );
    return best;
  },
  "clone-graph": ({ adj }) => {
    type G = { label: number; neighbors: G[] };
    const original: G[] = adj.map((_: any, i: number) => ({
      label: i + 1,
      neighbors: [],
    }));
    original.forEach((node, i) => {
      node.neighbors = adj[i].map((label: number) => original[label - 1]);
    });
    const map = new Map<G, G>();
    const copy = (n: G): G => {
      if (map.has(n)) return map.get(n)!;
      const result: G = { label: n.label, neighbors: [] };
      map.set(n, result);
      result.neighbors = n.neighbors.map(copy);
      return result;
    };
    if (!original.length) return [];
    copy(original[0]!);
    if ([...map.values()].some((n) => original.includes(n)))
      throw Error("Aliased graph");
    return original.map((n) => map.get(n)!.neighbors.map((v) => v.label));
  },
  "walls-and-gates": ({ grid }) =>
    grid.map((row: number[], r: number) =>
      row.map((v, c) => {
        if (v !== 2147483647) return v;
        const queue = [[r, c, 0]],
          seen = new Set<string>();
        for (let i = 0; i < queue.length; i++) {
          const [a, b, d] = queue[i]!;
          const key = `${a},${b}`;
          if (
            grid[a!]?.[b!] === undefined ||
            grid[a!][b!] === -1 ||
            seen.has(key)
          )
            continue;
          seen.add(key);
          if (grid[a!][b!] === 0) return d;
          for (const [dr, dc] of directions)
            queue.push([a! + dr!, b! + dc!, d! + 1]);
        }
        return v;
      }),
    ),
  "rotting-oranges": ({ grid }) => {
    let current: number[][] = grid.map((r: number[]) => [...r]),
      minutes = 0;
    while (current.some((r) => r.includes(1))) {
      let changed = false;
      const next = current.map((row, r) =>
        row.map((v, c) => {
          if (
            v === 1 &&
            directions.some(([dr, dc]) => current[r + dr!]?.[c + dc!] === 2)
          ) {
            changed = true;
            return 2;
          }
          return v;
        }),
      );
      if (!changed) return -1;
      current = next;
      minutes++;
    }
    return minutes;
  },
  "pacific-atlantic-water-flow": ({ heights }) => {
    const out: number[][] = [];
    for (let r = 0; r < heights.length; r++)
      for (let c = 0; c < heights[0].length; c++) {
        let pacific = false,
          atlantic = false;
        const seen = new Set<string>();
        const flow = (a: number, b: number) => {
          const key = `${a},${b}`;
          if (seen.has(key)) return;
          seen.add(key);
          pacific ||= a === 0 || b === 0;
          atlantic ||= a === heights.length - 1 || b === heights[0].length - 1;
          for (const [dr, dc] of directions) {
            const nr = a + dr!,
              nc = b + dc!;
            if (
              heights[nr]?.[nc] !== undefined &&
              heights[nr][nc] <= heights[a][b]
            )
              flow(nr, nc);
          }
        };
        flow(r, c);
        if (pacific && atlantic) out.push([r, c]);
      }
    return out;
  },
  "surrounded-regions": ({ board }) =>
    board.map((row: string, r: number) =>
      [...row]
        .map((v, c) => {
          if (v === "X") return v;
          const seen = new Set<string>();
          let edge = false;
          const visit = (a: number, b: number) => {
            const key = `${a},${b}`;
            if (board[a]?.[b] !== "O" || seen.has(key)) return;
            seen.add(key);
            edge ||=
              a === 0 ||
              b === 0 ||
              a === board.length - 1 ||
              b === board[0].length - 1;
            for (const [dr, dc] of directions) visit(a + dr!, b + dc!);
          };
          visit(r, c);
          return edge ? "O" : "X";
        })
        .join(""),
    ),
  "course-schedule": ({ numCourses, prerequisites }) =>
    orderCourses(numCourses, prerequisites).length === numCourses,
  "course-schedule-ii": ({ numCourses, prerequisites }) =>
    orderCourses(numCourses, prerequisites),
  "graph-valid-tree": ({ n, edges }) =>
    edges.length === n - 1 && components(n, edges) === 1,
  "number-of-connected-components-in-an-undirected-graph": ({ n, edges }) =>
    components(n, edges),
  "redundant-connection": ({ edges }) => {
    for (let i = edges.length - 1; i >= 0; i--)
      if (
        components(
          edges.length,
          edges
            .filter((_: any, j: number) => i !== j)
            .map(([a, b]: number[]) => [a! - 1, b! - 1]),
        ) === 1
      )
        return edges[i];
    throw Error("No removable edge");
  },
  "word-ladder": ({ beginWord, endWord, wordList }) => {
    const queue: [[string, number]] = [[beginWord, 1]],
      seen = new Set([beginWord]);
    for (let i = 0; i < queue.length; i++) {
      const [word, length] = queue[i]!;
      if (word === endWord) return length;
      for (const next of wordList)
        if (
          !seen.has(next) &&
          [...word].filter((c, j) => c !== next[j]).length === 1
        ) {
          seen.add(next);
          queue.push([next, length + 1]);
        }
    }
    return 0;
  },
  "reconstruct-itinerary": ({ tickets }) => {
    let best: string[] | null = null;
    const go = (path: string[], used: Set<number>) => {
      if (used.size === tickets.length) {
        if (!best || path.join(",") < best.join(",")) best = path;
        return;
      }
      tickets.forEach(([a, b]: string[], i: number) => {
        if (a === path.at(-1) && !used.has(i))
          go([...path, b!], new Set(used).add(i));
      });
    };
    go(["JFK"], new Set());
    return best;
  },
  "min-cost-to-connect-all-points": ({ points }) => {
    const edges: [number, number, number][] = [];
    for (let i = 0; i < points.length; i++)
      for (let j = i + 1; j < points.length; j++)
        edges.push([
          Math.abs(points[i][0] - points[j][0]) +
            Math.abs(points[i][1] - points[j][1]),
          i,
          j,
        ]);
    const parent = points.map((_: any, i: number) => i);
    const find = (v: number): number => (parent[v] === v ? v : find(parent[v]));
    let sum = 0;
    for (const [cost, a, b] of edges.sort((x, y) => x[0] - y[0])) {
      const pa = find(a),
        pb = find(b);
      if (pa !== pb) {
        parent[pa] = pb;
        sum += cost;
      }
    }
    return sum;
  },
  "swim-in-rising-water": ({ grid }) => {
    for (let t = 0; t < grid.length ** 2; t++) {
      const seen = new Set<string>();
      const visit = (r: number, c: number): boolean => {
        const key = `${r},${c}`;
        if (grid[r]?.[c] === undefined || grid[r][c] > t || seen.has(key))
          return false;
        if (r === grid.length - 1 && c === grid.length - 1) return true;
        seen.add(key);
        return directions.some(([dr, dc]) => visit(r + dr!, c + dc!));
      };
      if (visit(0, 0)) return t;
    }
    throw Error("No water path");
  },
  "alien-dictionary": ({ words }) => {
    const letters = [...new Set<string>(words.join(""))].sort(),
      edges = new Set<string>();
    for (let i = 1; i < words.length; i++) {
      const a = words[i - 1],
        b = words[i];
      let j = 0;
      while (j < Math.min(a.length, b.length) && a[j] === b[j]) j++;
      if (j === b.length && a.length > b.length) return "";
      if (j < Math.min(a.length, b.length)) edges.add(a[j] + b[j]);
    }
    const output: string[] = [];
    while (output.length < letters.length) {
      const next = letters.find(
        (l) =>
          !output.includes(l) &&
          [...edges].every((e) => e[1] !== l || output.includes(e[0]!)),
      );
      if (!next) return "";
      output.push(next);
    }
    return output.join("");
  },
  "cheapest-flights-within-k-stops": ({ flights, src, dst, k }) => {
    const walk = (node: number, left: number): number => {
      if (node === dst) return 0;
      if (!left) return Infinity;
      return Math.min(
        Infinity,
        ...flights
          .filter(([from]: number[]) => from === node)
          .map(([, to, price]: number[]) => price! + walk(to!, left - 1)),
      );
    };
    const cost = walk(src, k + 1);
    return cost === Infinity ? -1 : cost;
  },
};
