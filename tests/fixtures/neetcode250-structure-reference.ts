/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Oracle } from "./neetcode-sequence-reference";
export type Tree = { val: number; left: Tree | null; right: Tree | null };
export function readTree(values: (number | null)[]): Tree | null {
  if (!values.length || values[0] === null) return null;
  const root: Tree = { val: values[0]!, left: null, right: null },
    q = [root];
  let i = 1;
  for (let j = 0; j < q.length && i < values.length; j++)
    for (const side of ["left", "right"] as const) {
      const v = values[i++];
      if (v != null) {
        const child: Tree = { val: v, left: null, right: null };
        q[j]![side] = child;
        q.push(child);
      }
    }
  return root;
}
export function traversal(t: Tree | null, mode = "in"): number[] {
  return t
    ? [
        ...(mode === "pre" ? [t.val] : []),
        ...traversal(t.left, mode),
        ...(mode === "in" ? [t.val] : []),
        ...traversal(t.right, mode),
        ...(mode === "post" ? [t.val] : []),
      ]
    : [];
}
function serialize(t: Tree | null) {
  if (!t) return [];
  const q: (Tree | null)[] = [t],
    out: (number | null)[] = [];
  for (let i = 0; i < q.length; i++) {
    const node = q[i];
    out.push(node?.val ?? null);
    if (node) q.push(node.left, node.right);
  }
  while (out.at(-1) === null) out.pop();
  return out;
}
export const extendedStructureOracles: Record<string, Oracle> = {
  "single-threaded-cpu": ({ tasks }) => {
    const done = new Set<number>(),
      out: number[] = [];
    let time = 0;
    while (done.size < tasks.length) {
      const available = tasks
        .map((_: any, i: number) => i)
        .filter((i: number) => !done.has(i) && tasks[i][0] <= time)
        .sort((a: number, b: number) => tasks[a][1] - tasks[b][1] || a - b);
      if (!available.length) {
        time = Math.min(
          ...tasks
            .filter((_: any, i: number) => !done.has(i))
            .map(([start]: [number]) => start),
        );
        continue;
      }
      const i = available[0];
      time += tasks[i][1];
      done.add(i);
      out.push(i);
    }
    return out;
  },
  "reorganize-string": ({ s }) => {
    const counts = new Map<string, number>();
    for (const c of s) counts.set(c, (counts.get(c) ?? 0) + 1);
    const f = (p: string): string | null => {
      if (p.length === s.length) return p;
      for (const [c, n] of counts)
        if (n && p.at(-1) !== c) {
          counts.set(c, n - 1);
          const result = f(p + c);
          counts.set(c, n);
          if (result !== null) return result;
        }
      return null;
    };
    return f("") ?? "";
  },
  "longest-happy-string": ({ a, b, c }) => {
    const memo = new Map<string, string>();
    const f = (counts: number[], suffix: string): string => {
      const key = counts.join(",") + suffix;
      if (memo.has(key)) return memo.get(key)!;
      let best = "";
      for (let i = 0; i < 3; i++) {
        const ch = "abc"[i]!;
        if (!counts[i] || suffix === ch + ch) continue;
        const next = [...counts];
        next[i] = next[i]! - 1;
        const candidate = ch + f(next, (suffix + ch).slice(-2));
        if (candidate.length > best.length) best = candidate;
      }
      memo.set(key, best);
      return best;
    };
    return f([a, b, c], "");
  },
  "car-pooling": ({ trips, capacity }) => {
    for (let x = 0; x <= 1000; x++) {
      const count = trips.reduce(
        (s: number, [p, a, b]: [number, number, number]) =>
          s + (a <= x && x < b ? p : 0),
        0,
      );
      if (count > capacity) return false;
    }
    return true;
  },
  ipo: ({ k, w, profits, capital }) => {
    const f = (left: number, money: number, used: Set<number>): number => {
      let best = money;
      if (left)
        for (let i = 0; i < profits.length; i++)
          if (!used.has(i) && capital[i] <= money)
            best = Math.max(
              best,
              f(left - 1, money + profits[i], new Set([...used, i])),
            );
      return best;
    };
    return f(k, w, new Set());
  },
  "meeting-rooms-iii": ({ n, meetings }) => {
    const ends = Array(n).fill(0),
      count = Array(n).fill(0);
    for (const [start, end] of [...meetings].sort((a, b) => a[0] - b[0])) {
      let room = ends.findIndex((v) => v <= start);
      if (room < 0) room = ends.indexOf(Math.min(...ends));
      ends[room] = Math.max(start, ends[room]) + end - start;
      count[room]++;
    }
    return count.indexOf(Math.max(...count));
  },
  "reverse-linked-list-ii": ({ head, left, right }) => [
    ...head.slice(0, left - 1),
    ...head.slice(left - 1, right).reverse(),
    ...head.slice(right),
  ],
  "design-circular-queue": ({ k, ops }) => {
    const a: number[] = [];
    return ops.map(([op, v]: any[]) => {
      switch (op) {
        case "enQueue":
          if (a.length === k) return false;
          a.push(v);
          return true;
        case "deQueue":
          if (!a.length) return false;
          a.shift();
          return true;
        case "Front":
          return a[0] ?? -1;
        case "Rear":
          return a.at(-1) ?? -1;
        case "isEmpty":
          return !a.length;
        case "isFull":
          return a.length === k;
        default:
          throw Error("Unknown op");
      }
    });
  },
  "lfu-cache": ({ capacity, ops }) => {
    const cache = new Map<number, { v: number; f: number; t: number }>();
    let time = 0;
    return ops.map(([op, key, value]: any[]) => {
      time++;
      const old = cache.get(key);
      if (op === "get") {
        if (!old) return -1;
        old.f++;
        old.t = time;
        return old.v;
      }
      if (!capacity) return null;
      if (old) {
        old.v = value;
        old.f++;
        old.t = time;
        return null;
      }
      if (cache.size === capacity) {
        const victim = [...cache].sort(
          (a, b) => a[1].f - b[1].f || a[1].t - b[1].t,
        )[0]![0];
        cache.delete(victim);
      }
      cache.set(key, { v: value, f: 1, t: time });
      return null;
    });
  },
  "binary-tree-inorder-traversal": ({ root }) =>
    traversal(readTree(root), "in"),
  "binary-tree-preorder-traversal": ({ root }) =>
    traversal(readTree(root), "pre"),
  "binary-tree-postorder-traversal": ({ root }) =>
    traversal(readTree(root), "post"),
  "insert-into-a-binary-search-tree": ({ root, val }) => {
    const insert = (t: Tree | null): Tree =>
      !t
        ? { val, left: null, right: null }
        : val < t.val
          ? { ...t, left: insert(t.left) }
          : { ...t, right: insert(t.right) };
    return serialize(insert(readTree(root)));
  },
  "delete-node-in-a-bst": ({ root, key }) => {
    const del = (t: Tree | null, k: number): Tree | null => {
      if (!t) return null;
      if (k < t.val) {
        t.left = del(t.left, k);
        return t;
      }
      if (k > t.val) {
        t.right = del(t.right, k);
        return t;
      }
      if (!t.left) return t.right;
      if (!t.right) return t.left;
      let successor = t.right;
      while (successor.left) successor = successor.left;
      t.val = successor.val;
      t.right = del(t.right, successor.val);
      return t;
    };
    return serialize(del(readTree(root), key));
  },
  "construct-quad-tree": ({ grid }) => {
    const f = (g: number[][]): any => {
      if (g.flat().every((v) => v === g[0]![0]))
        return { isLeaf: true, val: g[0]![0] };
      const h = g.length / 2;
      return {
        isLeaf: false,
        children: [
          g.slice(0, h).map((r) => r.slice(0, h)),
          g.slice(0, h).map((r) => r.slice(h)),
          g.slice(h).map((r) => r.slice(0, h)),
          g.slice(h).map((r) => r.slice(h)),
        ].map(f),
      };
    };
    return f(grid);
  },
  "house-robber-iii": ({ root }) => {
    const f = (t: Tree | null, parentTaken: boolean): number =>
      !t
        ? 0
        : Math.max(
            f(t.left, false) + f(t.right, false),
            parentTaken
              ? -Infinity
              : t.val + f(t.left, true) + f(t.right, true),
          );
    return f(readTree(root), false);
  },
  "delete-leaves-with-a-given-value": ({ root, target }) => {
    const f = (t: Tree | null): Tree | null => {
      if (!t) return null;
      t.left = f(t.left);
      t.right = f(t.right);
      return !t.left && !t.right && t.val === target ? null : t;
    };
    return serialize(f(readTree(root)));
  },
};
