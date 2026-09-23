/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Oracle } from "./neetcode-sequence-reference";
type Node = { value: number; left: Node | null; right: Node | null };
function tree(values: (number | null)[]): Node | null {
  if (!values.length) return null;
  const root: Node = { value: values[0]!, left: null, right: null },
    queue = [root];
  let i = 1;
  for (let j = 0; j < queue.length && i < values.length; j++)
    for (const side of ["left", "right"] as const) {
      const value = values[i++];
      if (value != null) {
        const child: Node = { value, left: null, right: null };
        queue[j]![side] = child;
        queue.push(child);
      }
    }
  return root;
}
function serialize(root: Node | null): (number | null)[] {
  if (!root) return [];
  const queue: (Node | null)[] = [root],
    out: (number | null)[] = [];
  for (let i = 0; i < queue.length; i++) {
    const node = queue[i];
    out.push(node?.value ?? null);
    if (node) queue.push(node.left, node.right);
  }
  while (out.at(-1) === null) out.pop();
  return out;
}
function depth(root: Node | null): number {
  return root ? 1 + Math.max(depth(root.left), depth(root.right)) : 0;
}
function same(a: Node | null, b: Node | null): boolean {
  return !a || !b
    ? a === b
    : a.value === b.value && same(a.left, b.left) && same(a.right, b.right);
}
function levels(root: Node | null): number[][] {
  if (!root) return [];
  const result: number[][] = [];
  const visit = (n: Node | null, d: number) => {
    if (!n) return;
    (result[d] ??= []).push(n.value);
    visit(n.left, d + 1);
    visit(n.right, d + 1);
  };
  visit(root, 0);
  return result;
}
function inorder(root: Node | null): number[] {
  return root
    ? [...inorder(root.left), root.value, ...inorder(root.right)]
    : [];
}
export const structureOracles: Record<string, Oracle> = {
  "merge-two-sorted-lists": ({ left, right }) =>
    [...left, ...right].sort((a, b) => a - b),
  "linked-list-cycle": ({ values, pos }) => {
    type L = { next: L | null };
    const nodes: L[] = values.map(() => ({ next: null }));
    nodes.forEach((node, i) => {
      node.next = nodes[i + 1] ?? nodes[pos] ?? null;
    });
    const seen = new Set<L>();
    let current = nodes[0];
    while (current) {
      if (seen.has(current)) return true;
      seen.add(current);
      current = current.next ?? undefined;
    }
    return false;
  },
  "reorder-list": ({ values }) => {
    const out = [];
    for (let l = 0, r = values.length - 1; l <= r; l++, r--) {
      out.push(values[l]);
      if (l !== r) out.push(values[r]);
    }
    return out;
  },
  "remove-nth-node-from-end-of-list": ({ values, n }) =>
    values.filter((_: number, i: number) => i !== values.length - n),
  "copy-list-with-random-pointer": ({ nodes }) => {
    type R = { value: number; next: R | null; random: R | null };
    const original: R[] = nodes.map(([value]: any[]) => ({
      value,
      next: null,
      random: null,
    }));
    original.forEach((node, i) => {
      node.next = original[i + 1] ?? null;
      node.random = nodes[i][1] === null ? null : original[nodes[i][1]]!;
    });
    const map = new Map(
      original.map((n) => [
        n,
        { value: n.value, next: null, random: null } as R,
      ]),
    );
    for (const n of original) {
      const copy = map.get(n)!;
      copy.next = map.get(n.next!) ?? null;
      copy.random = map.get(n.random!) ?? null;
    }
    const copied = original.map((n) => map.get(n)!);
    if (copied.some((n) => original.includes(n))) throw Error("Aliased copy");
    return copied.map((n) => [
      n.value,
      n.random === null ? null : copied.indexOf(n.random),
    ]);
  },
  "add-two-numbers": ({ left, right }) =>
    [
      ...(
        BigInt([...left].reverse().join("")) +
        BigInt([...right].reverse().join(""))
      ).toString(),
    ]
      .reverse()
      .map(Number),
  "find-the-duplicate-number": ({ nums }) =>
    nums.find((n: number, i: number) => nums.indexOf(n) !== i),
  "lru-cache": ({ capacity, ops }) => {
    const entries = new Map<number, number>();
    return ops.map(([op, k, v]: any[]) => {
      if (op === "get" && !entries.has(k)) return -1;
      const value = op === "get" ? entries.get(k)! : v;
      entries.delete(k);
      entries.set(k, value);
      if (entries.size > capacity) entries.delete(entries.keys().next().value!);
      return op === "get" ? value : null;
    });
  },
  "reverse-nodes-in-k-group": ({ values, k }) => {
    const out = [];
    for (let i = 0; i < values.length; i += k) {
      const chunk = values.slice(i, i + k);
      out.push(...(chunk.length === k ? chunk.reverse() : chunk));
    }
    return out;
  },
  "invert-binary-tree": ({ root }) => {
    const invert = (n: Node | null): Node | null =>
      n
        ? { value: n.value, left: invert(n.right), right: invert(n.left) }
        : null;
    return serialize(invert(tree(root)));
  },
  "maximum-depth-of-binary-tree": ({ root }) => depth(tree(root)),
  "diameter-of-binary-tree": ({ root }) => {
    const diameter = (n: Node | null): number =>
      n
        ? Math.max(
            depth(n.left) + depth(n.right),
            diameter(n.left),
            diameter(n.right),
          )
        : 0;
    return diameter(tree(root));
  },
  "balanced-binary-tree": ({ root }) => {
    const balanced = (n: Node | null): boolean =>
      !n ||
      (Math.abs(depth(n.left) - depth(n.right)) <= 1 &&
        balanced(n.left) &&
        balanced(n.right));
    return balanced(tree(root));
  },
  "same-tree": ({ p, q }) => same(tree(p), tree(q)),
  "subtree-of-another-tree": ({ root, subRoot }) => {
    const sub = tree(subRoot);
    const has = (n: Node | null): boolean =>
      same(n, sub) || (!!n && (has(n.left) || has(n.right)));
    return has(tree(root));
  },
  "lowest-common-ancestor-of-a-binary-search-tree": ({ root, p, q }) => {
    const path = (n: Node | null, target: number): Node[] => {
      if (!n) return [];
      if (n.value === target) return [n];
      const rest = [...path(n.left, target), ...path(n.right, target)];
      return rest.length ? [n, ...rest] : [];
    };
    const n = tree(root),
      a = path(n, p),
      b = path(n, q);
    let i = 0;
    while (i < Math.min(a.length, b.length) && a[i] === b[i]) i++;
    return a[i - 1]!.value;
  },
  "binary-tree-level-order-traversal": ({ root }) => levels(tree(root)),
  "binary-tree-right-side-view": ({ root }) =>
    levels(tree(root)).map((l) => l.at(-1)),
  "count-good-nodes-in-binary-tree": ({ root }) => {
    const count = (n: Node | null, max: number): number =>
      !n
        ? 0
        : Number(n.value >= max) +
          count(n.left, Math.max(n.value, max)) +
          count(n.right, Math.max(n.value, max));
    return count(tree(root), -Infinity);
  },
  "validate-binary-search-tree": ({ root }) => {
    const values = inorder(tree(root));
    return values.every((v, i) => !i || v > values[i - 1]!);
  },
  "kth-smallest-element-in-a-bst": ({ root, k }) =>
    inorder(tree(root)).sort((a, b) => a - b)[k - 1],
  "construct-binary-tree-from-preorder-and-inorder-traversal": ({
    preorder,
    inorder: order,
  }) => {
    const build = (pre: number[], ino: number[]): Node | null => {
      if (!pre.length) return null;
      const mid = ino.indexOf(pre[0]!);
      return {
        value: pre[0]!,
        left: build(pre.slice(1, mid + 1), ino.slice(0, mid)),
        right: build(pre.slice(mid + 1), ino.slice(mid + 1)),
      };
    };
    return serialize(build(preorder, order));
  },
  "binary-tree-maximum-path-sum": ({ root }) => {
    const adjacency = new Map<Node, Node[]>();
    const visit = (n: Node | null, parent: Node | null) => {
      if (!n) return;
      adjacency.set(
        n,
        [parent, n.left, n.right].filter((v): v is Node => !!v),
      );
      visit(n.left, n);
      visit(n.right, n);
    };
    visit(tree(root), null);
    let best = -Infinity;
    const paths = (n: Node, previous: Node | null, sum: number) => {
      sum += n.value;
      best = Math.max(best, sum);
      for (const other of adjacency.get(n)!)
        if (other !== previous) paths(other, n, sum);
    };
    for (const n of adjacency.keys()) paths(n, null, 0);
    return best;
  },
  "last-stone-weight": ({ stones }) => {
    const s = [...stones];
    while (s.length > 1) {
      s.sort((a, b) => a - b);
      const difference = s.pop()! - s.pop()!;
      if (difference) s.push(difference);
    }
    return s[0] ?? 0;
  },
  "k-closest-points-to-origin": ({ points, k }) =>
    [...points]
      .sort((a, b) => a[0] ** 2 + a[1] ** 2 - b[0] ** 2 - b[1] ** 2)
      .slice(0, k),
  "kth-largest-element-in-an-array": ({ nums, k }) =>
    [...nums].sort((a, b) => b - a)[k - 1],
  "task-scheduler": ({ tasks, n }) => {
    const labels = [...new Set<string>(tasks)],
      counts = labels.map((l) => tasks.filter((t: string) => t === l).length),
      memo = new Map<string, number>();
    const solve = (remaining: number[], cooldown: number[]): number => {
      if (remaining.every((x) => x === 0)) return 0;
      const key = JSON.stringify([remaining, cooldown]);
      if (memo.has(key)) return memo.get(key)!;
      let best = Infinity;
      const tick = cooldown.map((x) => Math.max(0, x - 1));
      for (let i = 0; i < remaining.length; i++)
        if (remaining[i]! > 0 && cooldown[i] === 0) {
          const next = [...remaining],
            after = [...tick];
          next[i]!--;
          after[i] = n;
          best = Math.min(best, 1 + solve(next, after));
        }
      if (best === Infinity) best = 1 + solve(remaining, tick);
      memo.set(key, best);
      return best;
    };
    return solve(
      counts,
      counts.map(() => 0),
    );
  },
  "design-twitter": ({ ops }) => {
    const posts: { user: number; tweet: number }[] = [],
      following = new Map<number, Set<number>>();
    return ops.map(([op, user, value]: any[]) => {
      if (op === "postTweet") posts.push({ user, tweet: value });
      else if (op === "getNewsFeed")
        return posts
          .filter((p) => p.user === user || following.get(user)?.has(p.user))
          .slice(-10)
          .reverse()
          .map((p) => p.tweet);
      else if (user !== value) {
        const set = following.get(user) ?? new Set<number>();
        if (op === "follow") set.add(value);
        else set.delete(value);
        following.set(user, set);
      }
      return null;
    });
  },
  "find-median-from-data-stream": ({ ops }) => {
    const values: number[] = [];
    return ops.map(([op, n]: any[]) => {
      if (op === "addNum") {
        values.push(n);
        return null;
      }
      const sorted = [...values].sort((a, b) => a - b);
      return (
        (sorted[Math.floor((sorted.length - 1) / 2)]! +
          sorted[Math.floor(sorted.length / 2)]!) /
        2
      );
    });
  },
  "design-add-and-search-words-data-structure": ({ ops }) => {
    const words: string[] = [];
    return ops.map(([op, word]: string[]) => {
      if (op === "addWord") {
        words.push(word!);
        return null;
      }
      return words.some(
        (w) =>
          w.length === word!.length &&
          [...w].every((c, i) => word![i] === "." || word![i] === c),
      );
    });
  },
  "word-search-ii": ({ board, words }) =>
    words.filter((word: string) => wordExists(board, word)),
};
export function wordExists(board: string[], word: string): boolean {
  const walk = (
    r: number,
    c: number,
    i: number,
    seen: Set<string>,
  ): boolean => {
    if (i === word.length) return true;
    const key = `${r},${c}`;
    if (board[r]?.[c] !== word[i] || seen.has(key)) return false;
    const next = new Set(seen).add(key);
    return [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ].some(([dr, dc]) => walk(r + dr!, c + dc!, i + 1, next));
  };
  return board.some((row, r) =>
    [...row].some((_, c) => walk(r, c, 0, new Set())),
  );
}
