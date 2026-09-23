/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Oracle } from "./neetcode-sequence-reference";
const sorted = (a: number[]) => [...a].sort((x, y) => x - y);
const sum = (a: number[]) => a.reduce((s, v) => s + v, 0);
const palindrome = (s: string) => s === [...s].reverse().join("");
export const extendedSequenceOracles: Record<string, Oracle> = {
  "concatenation-of-array": ({ nums }) => [...nums, ...nums],
  "longest-common-prefix": ({ words }) => {
    let p = words[0] ?? "";
    while (!words.every((s: string) => s.startsWith(p))) p = p.slice(0, -1);
    return p;
  },
  "remove-element": ({ nums, val }) => {
    const kept = nums.filter((v: number) => v !== val);
    return { k: kept.length, kept };
  },
  "majority-element": ({ nums }) =>
    nums.find(
      (v: number) =>
        nums.filter((x: number) => x === v).length > nums.length / 2,
    ),
  "design-hashset": ({ ops }) => {
    const s = new Set();
    return ops.map(([op, k]: any[]) => {
      if (op === "contains") return s.has(k);
      if (op === "add") s.add(k);
      else s.delete(k);
      return null;
    });
  },
  "design-hashmap": ({ ops }) => {
    const m = new Map();
    return ops.map(([op, k, v]: any[]) => {
      if (op === "get") return m.get(k) ?? -1;
      if (op === "put") m.set(k, v);
      else m.delete(k);
      return null;
    });
  },
  "sort-an-array": ({ nums }) => sorted(nums),
  "sort-colors": ({ nums }) => sorted(nums),
  "range-sum-query-2d-immutable": ({ matrix, queries }) =>
    queries.map(([a, b, c, d]: [number, number, number, number]) => {
      let s = 0;
      for (let r = a; r <= c; r++)
        for (let col = b; col <= d; col++) s += matrix[r][col];
      return s;
    }),
  "best-time-to-buy-and-sell-stock-ii": ({ prices }) => {
    const f = (i: number, holding: boolean): number =>
      i === prices.length
        ? holding
          ? -Infinity
          : 0
        : Math.max(
            f(i + 1, holding),
            (holding ? prices[i] : -prices[i]) + f(i + 1, !holding),
          );
    return f(0, false);
  },
  "majority-element-ii": ({ nums }) =>
    [...new Set(nums)].filter(
      (v) =>
        nums.filter((x: number) => x === v).length >
        Math.floor(nums.length / 3),
    ),
  "subarray-sum-equals-k": ({ nums, k }) => {
    let count = 0;
    for (let i = 0; i < nums.length; i++)
      for (let j = i + 1; j <= nums.length; j++)
        if (sum(nums.slice(i, j)) === k) count++;
    return count;
  },
  "first-missing-positive": ({ nums }) => {
    let v = 1;
    while (nums.includes(v)) v++;
    return v;
  },
  "reverse-string": ({ chars }) => [...chars].reverse(),
  "valid-palindrome-ii": ({ s }) =>
    palindrome(s) ||
    [...s].some((_, i) => palindrome(s.slice(0, i) + s.slice(i + 1))),
  "merge-strings-alternately": ({ word1, word2 }) =>
    Array.from(
      { length: Math.max(word1.length, word2.length) },
      (_, i) => (word1[i] ?? "") + (word2[i] ?? ""),
    ).join(""),
  "merge-sorted-array": ({ nums1, m, nums2 }) =>
    sorted([...nums1.slice(0, m), ...nums2]),
  "remove-duplicates-from-sorted-array": ({ nums }) => {
    const kept = [...new Set(nums)];
    return { k: kept.length, kept };
  },
  "4sum": ({ nums, target }) => {
    const out = new Map();
    for (let a = 0; a < nums.length; a++)
      for (let b = a + 1; b < nums.length; b++)
        for (let c = b + 1; c < nums.length; c++)
          for (let d = c + 1; d < nums.length; d++) {
            const v = sorted([nums[a], nums[b], nums[c], nums[d]]);
            if (sum(v) === target) out.set(JSON.stringify(v), v);
          }
    return [...out.values()];
  },
  "rotate-array": ({ nums, k }) =>
    nums.map(
      (_: number, i: number) =>
        nums[(i - (k % nums.length) + nums.length) % nums.length],
    ),
  "boats-to-save-people": ({ people, limit }) => {
    const f = (a: number[]): number => {
      if (!a.length) return 0;
      let best = 1 + f(a.slice(1));
      for (let j = 1; j < a.length; j++)
        if (a[0]! + a[j]! <= limit)
          best = Math.min(best, 1 + f(a.filter((_, i) => i !== 0 && i !== j)));
      return best;
    };
    return f(people);
  },
  "contains-duplicate-ii": ({ nums, k }) =>
    nums.some((v: number, i: number) =>
      nums.some((w: number, j: number) => j > i && j - i <= k && v === w),
    ),
  "minimum-size-subarray-sum": ({ nums, target }) => {
    let best = Infinity;
    for (let i = 0; i < nums.length; i++)
      for (let j = i + 1; j <= nums.length; j++)
        if (sum(nums.slice(i, j)) >= target) best = Math.min(best, j - i);
    return best === Infinity ? 0 : best;
  },
  "find-k-closest-elements": ({ arr, k, x }) =>
    sorted(
      [...arr]
        .sort((a, b) => Math.abs(a - x) - Math.abs(b - x) || a - b)
        .slice(0, k),
    ),
  "baseball-game": ({ ops }) => {
    const a: number[] = [];
    for (const op of ops) {
      if (op === "C") a.pop();
      else if (op === "D") a.push(a.at(-1)! * 2);
      else if (op === "+") a.push(a.at(-1)! + a.at(-2)!);
      else a.push(Number(op));
    }
    return sum(a);
  },
  "implement-stack-using-queues": ({ ops }) => {
    const a: number[] = [];
    return ops.map(([op, v]: any[]) => {
      if (op === "push") {
        a.push(v);
        return null;
      }
      if (op === "pop") return a.pop();
      if (op === "top") return a.at(-1);
      return a.length === 0;
    });
  },
  "implement-queue-using-stacks": ({ ops }) => {
    const a: number[] = [];
    return ops.map(([op, v]: any[]) => {
      if (op === "push") {
        a.push(v);
        return null;
      }
      if (op === "pop") return a.shift();
      if (op === "peek") return a[0];
      return a.length === 0;
    });
  },
  "asteroid-collision": ({ asteroids }) => {
    const a = [...asteroids];
    for (let i = 0; i + 1 < a.length;) {
      if (a[i] > 0 && a[i + 1] < 0) {
        const [x, y] = [a[i], a[i + 1]];
        a.splice(i, 2, ...(x === -y ? [] : x > -y ? [x] : [y]));
        i = Math.max(0, i - 1);
      } else i++;
    }
    return a;
  },
  "online-stock-span": ({ prices }) =>
    prices.map((v: number, i: number) => {
      let j = i;
      while (j >= 0 && prices[j] <= v) j--;
      return i - j;
    }),
  "simplify-path": ({ path }) => {
    const a: string[] = [];
    for (const part of path.split("/")) {
      if (part === "..") a.pop();
      else if (part && part !== ".") a.push(part);
    }
    return "/" + a.join("/");
  },
  "decode-string": ({ s }) => {
    while (s.includes("["))
      s = s.replace(/(\d+)\[([a-z]*)\]/g, (_: string, n: string, v: string) =>
        v.repeat(Number(n)),
      );
    return s;
  },
  "maximum-frequency-stack": ({ ops }) => {
    const a: number[] = [];
    return ops.map(([op, v]: any[]) => {
      if (op === "push") {
        a.push(v);
        return null;
      }
      const counts = new Map<number, number>();
      for (const x of a) counts.set(x, (counts.get(x) ?? 0) + 1);
      const max = Math.max(...counts.values());
      for (let i = a.length - 1; i >= 0; i--)
        if (counts.get(a[i]!) === max) return a.splice(i, 1)[0];
      throw Error("Empty pop");
    });
  },
  "search-insert-position": ({ nums, target }) => {
    const i = nums.findIndex((v: number) => v >= target);
    return i < 0 ? nums.length : i;
  },
  "guess-number-higher-or-lower": ({ n, hidden }) => {
    let calls = 0;
    const guess = (v: number) => {
      calls++;
      return Math.sign(hidden - v);
    };
    const search = (max: number, api: (v: number) => number) => {
      let lo = 1,
        hi = max;
      while (lo <= hi) {
        const m = lo + Math.floor((hi - lo) / 2),
          r = api(m);
        if (!r) return m;
        if (r > 0) lo = m + 1;
        else hi = m - 1;
      }
      return -1;
    };
    const answer = search(n, guess);
    if (calls > Math.ceil(Math.log2(n + 1)))
      throw Error("Guess budget exceeded");
    return answer;
  },
  sqrtx: ({ x }) => Math.floor(Math.sqrt(x)),
  "capacity-to-ship-packages-within-d-days": ({ weights, days }) => {
    for (let cap = Math.max(...weights); cap <= sum(weights); cap++) {
      let d = 1,
        s = 0;
      for (const v of weights) {
        if (s + v > cap) {
          d++;
          s = 0;
        }
        s += v;
      }
      if (d <= days) return cap;
    }
    throw Error("No capacity");
  },
  "search-in-rotated-sorted-array-ii": ({ nums, target }) =>
    nums.includes(target),
  "split-array-largest-sum": ({ nums, k }) => {
    const f = (i: number, left: number): number => {
      if (left === 1) return sum(nums.slice(i));
      let best = Infinity;
      for (let j = i + 1; j <= nums.length - left + 1; j++)
        best = Math.min(best, Math.max(sum(nums.slice(i, j)), f(j, left - 1)));
      return best;
    };
    return f(0, k);
  },
  "find-in-mountain-array": ({ values, target }) => {
    let calls = 0;
    const api = {
      length: () => values.length,
      get: (i: number) => {
        if (++calls > 100) throw Error("Mountain API budget exceeded");
        if (i < 0 || i >= values.length) throw Error("Out of bounds");
        return values[i] as number;
      },
    };
    return mountainSearch(api, target);
  },
  "add-binary": ({ a, b }) => (BigInt("0b" + a) + BigInt("0b" + b)).toString(2),
  "bitwise-and-of-numbers-range": ({ left, right }) => {
    let shift = 0;
    while (left !== right) {
      left = Math.floor(left / 2);
      right = Math.floor(right / 2);
      shift++;
    }
    return left * 2 ** shift;
  },
  "minimum-array-end": ({ n, x }) => {
    let candidate = BigInt(x),
      found = 1;
    while (found < n) {
      candidate++;
      if ((candidate & BigInt(x)) === BigInt(x)) found++;
    }
    return Number(candidate);
  },
};

export function mountainSearch(
  api: { length: () => number; get: (i: number) => number },
  target: number,
) {
  const cache = new Map<number, number>();
  const get = (i: number) => {
    if (!cache.has(i)) cache.set(i, api.get(i));
    return cache.get(i)!;
  };
  let l = 0,
    r = api.length() - 1;
  while (l < r) {
    const m = Math.floor((l + r) / 2);
    if (get(m) < get(m + 1)) l = m + 1;
    else r = m;
  }
  const peak = l;
  const search = (a: number, b: number, asc: boolean) => {
    while (a <= b) {
      const m = Math.floor((a + b) / 2),
        v = get(m);
      if (v === target) return m;
      if (v < target === asc) a = m + 1;
      else b = m - 1;
    }
    return -1;
  };
  const first = search(0, peak, true);
  return first < 0 ? search(peak + 1, api.length() - 1, false) : first;
}
