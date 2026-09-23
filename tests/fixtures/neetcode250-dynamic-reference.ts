import type { Oracle } from "./neetcode-sequence-reference";
import { gcd } from "./neetcode250-graph-reference";
const sum = (a: number[]) => a.reduce((s, v) => s + v, 0);
export const extendedDynamicOracles: Record<string, Oracle> = {
  "lemonade-change": ({ bills }) => {
    const f = (i: number, five: number, ten: number): boolean => {
      if (i === bills.length) return true;
      if (bills[i] === 5) return f(i + 1, five + 1, ten);
      if (bills[i] === 10) return five > 0 && f(i + 1, five - 1, ten + 1);
      return (
        (five > 0 && ten > 0 && f(i + 1, five - 1, ten - 1)) ||
        (five >= 3 && f(i + 1, five - 3, ten))
      );
    };
    return f(0, 0, 0);
  },
  "maximum-sum-circular-subarray": ({ nums }) => {
    let best = -Infinity;
    for (let i = 0; i < nums.length; i++) {
      let total = 0;
      for (let len = 1; len <= nums.length; len++) {
        total += nums[(i + len - 1) % nums.length];
        best = Math.max(best, total);
      }
    }
    return best;
  },
  "longest-turbulent-subarray": ({ arr }) => {
    let best = 1;
    for (let i = 0; i < arr.length; i++)
      for (let j = i + 1; j < arr.length; j++) {
        let valid = true;
        for (let k = i + 1; k <= j; k++)
          if (
            arr[k] === arr[k - 1] ||
            (k > i + 1 &&
              Math.sign(arr[k] - arr[k - 1]) ===
                Math.sign(arr[k - 1] - arr[k - 2]))
          )
            valid = false;
        if (valid) best = Math.max(best, j - i + 1);
      }
    return best;
  },
  "jump-game-vii": ({ s, minJump, maxJump }) => {
    const seen = new Set([0]);
    for (let i = 0; i < s.length; i++)
      if (seen.has(i))
        for (let j = i + minJump; j <= Math.min(s.length - 1, i + maxJump); j++)
          if (s[j] === "0") seen.add(j);
    return seen.has(s.length - 1);
  },
  "dota2-senate": ({ senate }) => {
    const r: number[] = [],
      d: number[] = [];
    [...senate].forEach((c, i) => (c === "R" ? r : d).push(i));
    while (r.length && d.length) {
      const a = r.shift()!,
        b = d.shift()!;
      if (a < b) r.push(a + senate.length);
      else d.push(b + senate.length);
    }
    return r.length ? "Radiant" : "Dire";
  },
  candy: ({ ratings }) => {
    const a = Array(ratings.length).fill(1);
    let changed = true;
    while (changed) {
      changed = false;
      for (let i = 0; i < a.length; i++)
        for (const j of [i - 1, i + 1])
          if (
            j >= 0 &&
            j < a.length &&
            ratings[i] > ratings[j] &&
            a[i] <= a[j]
          ) {
            a[i] = a[j] + 1;
            changed = true;
          }
    }
    return sum(a);
  },
  "excel-sheet-column-title": ({ columnNumber }) => {
    let out = "";
    while (columnNumber) {
      columnNumber--;
      out = String.fromCharCode(65 + (columnNumber % 26)) + out;
      columnNumber = Math.floor(columnNumber / 26);
    }
    return out;
  },
  "greatest-common-divisor-of-strings": ({ str1, str2 }) => {
    for (let len = Math.min(str1.length, str2.length); len >= 1; len--) {
      const base = str1.slice(0, len);
      if (
        str1.length % len === 0 &&
        str2.length % len === 0 &&
        base.repeat(str1.length / len) === str1 &&
        base.repeat(str2.length / len) === str2
      )
        return base;
    }
    return "";
  },
  "insert-greatest-common-divisors-in-linked-list": ({ head }) =>
    head.flatMap((v: number, i: number) =>
      i + 1 < head.length ? [v, gcd(v, head[i + 1])] : [v],
    ),
  "transpose-matrix": ({ matrix }) =>
    Array.from({ length: matrix[0].length }, (_, c) =>
      matrix.map((row: number[]) => row[c]),
    ),
  "roman-to-integer": ({ s }) => {
    const pairs: [number, string][] = [
      [1000, "M"],
      [900, "CM"],
      [500, "D"],
      [400, "CD"],
      [100, "C"],
      [90, "XC"],
      [50, "L"],
      [40, "XL"],
      [10, "X"],
      [9, "IX"],
      [5, "V"],
      [4, "IV"],
      [1, "I"],
    ];
    for (let n = 1; n <= 3999; n++) {
      let rest = n,
        encoded = "";
      for (const [value, symbol] of pairs)
        while (rest >= value) {
          encoded += symbol;
          rest -= value;
        }
      if (encoded === s) return n;
    }
    throw Error("Invalid Roman numeral");
  },
  "n-th-tribonacci-number": ({ n }) => {
    const a = [0, 1, 1];
    for (let i = 3; i <= n; i++) a[i] = a[i - 1]! + a[i - 2]! + a[i - 3]!;
    return a[n];
  },
  "combination-sum-iv": ({ nums, target }) => {
    const f = (t: number): number =>
      t === 0
        ? 1
        : nums.reduce((s: number, v: number) => s + (v <= t ? f(t - v) : 0), 0);
    return f(target);
  },
  "perfect-squares": ({ n }) => {
    let current = new Set([0]);
    for (let count = 1; count <= n; count++) {
      const next = new Set<number>();
      for (const v of current)
        for (let r = 1; v + r * r <= n; r++) {
          if (v + r * r === n) return count;
          next.add(v + r * r);
        }
      current = next;
    }
    throw Error("No solution");
  },
  "integer-break": ({ n }) => {
    const f = (
      left: number,
      min: number,
      parts: number,
      product: number,
    ): number => {
      if (!left) return parts >= 2 ? product : 0;
      let best = 0;
      for (let v = min; v <= left; v++)
        best = Math.max(best, f(left - v, v, parts + 1, product * v));
      return best;
    };
    return f(n, 1, 0, 1);
  },
  "stone-game-iii": ({ stoneValue }) => {
    const f = (i: number): number => {
      if (i === stoneValue.length) return 0;
      let best = -Infinity,
        taken = 0;
      for (let j = i; j < Math.min(i + 3, stoneValue.length); j++) {
        taken += stoneValue[j];
        best = Math.max(best, taken - f(j + 1));
      }
      return best;
    };
    const d = f(0);
    return d > 0 ? "Alice" : d < 0 ? "Bob" : "Tie";
  },
  "extra-characters-in-a-string": ({ s, dictionary }) => {
    const memo = new Map<number, number>();
    const f = (i: number): number => {
      if (i === s.length) return 0;
      if (memo.has(i)) return memo.get(i)!;
      let best = 1 + f(i + 1);
      for (const w of dictionary)
        if (s.startsWith(w, i)) best = Math.min(best, f(i + w.length));
      memo.set(i, best);
      return best;
    };
    return f(0);
  },
  "unique-paths-ii": ({ obstacleGrid: g }) => {
    const f = (r: number, c: number): number =>
      r >= g.length || c >= g[0].length || g[r][c]
        ? 0
        : r === g.length - 1 && c === g[0].length - 1
          ? 1
          : f(r + 1, c) + f(r, c + 1);
    return f(0, 0);
  },
  "minimum-path-sum": ({ grid: g }) => {
    const f = (r: number, c: number): number =>
      r >= g.length || c >= g[0].length
        ? Infinity
        : r === g.length - 1 && c === g[0].length - 1
          ? g[r][c]
          : g[r][c] + Math.min(f(r + 1, c), f(r, c + 1));
    return f(0, 0);
  },
  "last-stone-weight-ii": ({ stones }) => {
    const f = (a: number[]): number => {
      if (a.length < 2) return a[0] ?? 0;
      let best = Infinity;
      for (let i = 0; i < a.length; i++)
        for (let j = i + 1; j < a.length; j++)
          best = Math.min(
            best,
            f(
              [
                ...a.filter((_, k) => k !== i && k !== j),
                Math.abs(a[i]! - a[j]!),
              ].filter(Boolean),
            ),
          );
      return best;
    };
    return f(stones);
  },
  "stone-game": ({ piles }) => {
    const f = (l: number, r: number): number =>
      l > r ? 0 : Math.max(piles[l] - f(l + 1, r), piles[r] - f(l, r - 1));
    return f(0, piles.length - 1) > 0;
  },
  "stone-game-ii": ({ piles }) => {
    const f = (i: number, m: number): number => {
      if (i >= piles.length) return 0;
      let best = 0;
      for (let x = 1; x <= Math.min(2 * m, piles.length - i); x++)
        best = Math.max(best, sum(piles.slice(i)) - f(i + x, Math.max(m, x)));
      return best;
    };
    return f(0, 1);
  },
};
