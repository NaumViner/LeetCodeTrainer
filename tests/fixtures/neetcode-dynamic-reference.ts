import type { Oracle } from "./neetcode-sequence-reference";
const palindrome = (s: string) => s === [...s].reverse().join("");
function subsequences<T>(values: T[]): T[][] {
  return Array.from({ length: 2 ** values.length }, (_, mask) =>
    values.filter((_, i) => mask & (1 << i)),
  );
}
export const dynamicOracles: Record<string, Oracle> = {
  "min-cost-climbing-stairs": ({ cost }) => {
    const walk = (i: number): number =>
      i >= cost.length ? 0 : cost[i] + Math.min(walk(i + 1), walk(i + 2));
    return Math.min(walk(0), walk(1));
  },
  "house-robber": ({ nums }) => {
    const solve = (i: number): number =>
      i >= nums.length ? 0 : Math.max(solve(i + 1), nums[i] + solve(i + 2));
    return solve(0);
  },
  "house-robber-ii": ({ nums }) => {
    let best = 0;
    for (let mask = 0; mask < 2 ** nums.length; mask++) {
      let valid = true,
        sum = 0;
      for (let i = 0; i < nums.length; i++)
        if (mask & (1 << i)) {
          sum += nums[i];
          if (nums.length > 1 && mask & (1 << ((i + 1) % nums.length)))
            valid = false;
        }
      if (valid) best = Math.max(best, sum);
    }
    return best;
  },
  "longest-palindromic-substring": ({ s }) => {
    for (let n = s.length; n > 0; n--)
      for (let i = 0; i + n <= s.length; i++)
        if (palindrome(s.slice(i, i + n))) return s.slice(i, i + n);
    return "";
  },
  "palindromic-substrings": ({ s }) => {
    let count = 0;
    for (let i = 0; i < s.length; i++)
      for (let j = i + 1; j <= s.length; j++)
        if (palindrome(s.slice(i, j))) count++;
    return count;
  },
  "decode-ways": ({ s }) => {
    const solve = (i: number): number => {
      if (i === s.length) return 1;
      if (s[i] === "0") return 0;
      return (
        solve(i + 1) +
        (i + 1 < s.length && Number(s.slice(i, i + 2)) <= 26 ? solve(i + 2) : 0)
      );
    };
    return solve(0);
  },
  "coin-change": ({ coins, amount }) => {
    const queue = [[0, 0]],
      seen = new Set([0]);
    for (let i = 0; i < queue.length; i++) {
      const [value, count] = queue[i]!;
      if (value === amount) return count;
      for (const coin of coins) {
        const next = value! + coin;
        if (next <= amount && !seen.has(next)) {
          seen.add(next);
          queue.push([next, count! + 1]);
        }
      }
    }
    return -1;
  },
  "maximum-product-subarray": ({ nums }) => {
    let best = -Infinity;
    for (let i = 0; i < nums.length; i++)
      for (let j = i + 1; j <= nums.length; j++)
        best = Math.max(
          best,
          nums.slice(i, j).reduce((a: number, b: number) => a * b, 1),
        );
    return best;
  },
  "word-break": ({ s, wordDict }) => {
    const solve = (text: string): boolean =>
      !text ||
      wordDict.some(
        (word: string) =>
          text.startsWith(word) && solve(text.slice(word.length)),
      );
    return solve(s);
  },
  "longest-increasing-subsequence": ({ nums }) =>
    Math.max(
      ...subsequences<number>(nums)
        .filter((seq) => seq.every((n, i) => !i || n > seq[i - 1]!))
        .map((seq) => seq.length),
    ),
  "partition-equal-subset-sum": ({ nums }) => {
    const total = nums.reduce((a: number, b: number) => a + b, 0);
    return subsequences<number>(nums).some(
      (s) => s.reduce((a, b) => a + b, 0) * 2 === total,
    );
  },
  "longest-common-subsequence": ({ text1, text2 }) => {
    const candidates = subsequences<string>([...text1]);
    return Math.max(
      ...candidates
        .filter((seq) => {
          let at = 0;
          for (const c of text2) if (c === seq[at]) at++;
          return at === seq.length;
        })
        .map((seq) => seq.length),
    );
  },
  "best-time-to-buy-and-sell-stock-with-cooldown": ({ prices }) => {
    const solve = (day: number, held: boolean, cool: boolean): number => {
      if (day >= prices.length) return held ? -Infinity : 0;
      const skip = solve(day + 1, held, false);
      return held
        ? Math.max(skip, prices[day] + solve(day + 1, false, true))
        : cool
          ? skip
          : Math.max(skip, -prices[day] + solve(day + 1, true, false));
    };
    return solve(0, false, false);
  },
  "coin-change-ii": ({ amount, coins }) => {
    const solve = (i: number, left: number): number => {
      if (!left) return 1;
      if (i === coins.length) return 0;
      let ways = 0;
      for (let count = 0; count * coins[i] <= left; count++)
        ways += solve(i + 1, left - count * coins[i]);
      return ways;
    };
    return solve(0, amount);
  },
  "target-sum": ({ nums, target }) => {
    const solve = (i: number, sum: number): number =>
      i === nums.length
        ? Number(sum === target)
        : solve(i + 1, sum + nums[i]) + solve(i + 1, sum - nums[i]);
    return solve(0, 0);
  },
  "interleaving-string": ({ s1, s2, s3 }) => {
    const solve = (i: number, j: number): boolean => {
      if (i + j === s3.length) return i === s1.length && j === s2.length;
      return (
        (i < s1.length && s1[i] === s3[i + j] && solve(i + 1, j)) ||
        (j < s2.length && s2[j] === s3[i + j] && solve(i, j + 1))
      );
    };
    return solve(0, 0);
  },
  "longest-increasing-path-in-a-matrix": ({ matrix }) => {
    const visit = (r: number, c: number): number =>
      1 +
      Math.max(
        0,
        ...[
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]
          .filter(([dr, dc]) => matrix[r + dr!]?.[c + dc!] > matrix[r][c])
          .map(([dr, dc]) => visit(r + dr!, c + dc!)),
      );
    return Math.max(
      ...matrix.flatMap((row: number[], r: number) =>
        row.map((_, c) => visit(r, c)),
      ),
    );
  },
  "distinct-subsequences": ({ s, t }) =>
    subsequences<string>([...s]).filter((seq) => seq.join("") === t).length,
  "edit-distance": ({ word1, word2 }) => {
    const solve = (a: string, b: string): number => {
      if (!a || !b) return a.length + b.length;
      if (a[0] === b[0]) return solve(a.slice(1), b.slice(1));
      return (
        1 +
        Math.min(
          solve(a.slice(1), b),
          solve(a, b.slice(1)),
          solve(a.slice(1), b.slice(1)),
        )
      );
    };
    return solve(word1, word2);
  },
  "burst-balloons": ({ nums }) => {
    const solve = (values: number[]): number =>
      values.length
        ? Math.max(
            ...values.map(
              (v, i) =>
                (values[i - 1] ?? 1) * v * (values[i + 1] ?? 1) +
                solve(values.filter((_, j) => i !== j)),
            ),
          )
        : 0;
    return solve(nums);
  },
  "regular-expression-matching": ({ s, p }) => new RegExp(`^(?:${p})$`).test(s),
};
