/* eslint-disable @typescript-eslint/no-explicit-any */
// Small-input independent oracles. Deliberately not optimized interview answers.
export type Oracle = (input: any) => any;
export const sequenceOracles: Record<string, Oracle> = {
  "valid-anagram": ({ s, t }) =>
    [...s].sort().join("") === [...t].sort().join(""),
  "two-sum": ({ nums, target }) => {
    for (let i = 0; i < nums.length; i++)
      for (let j = i + 1; j < nums.length; j++)
        if (nums[i] + nums[j] === target) return [i, j];
    throw Error("No unique pair");
  },
  "group-anagrams": ({ words }) => {
    const groups = new Map<string, string[]>();
    for (const word of words) {
      const key = [...word].sort().join("");
      groups.set(key, [...(groups.get(key) ?? []), word]);
    }
    return [...groups.values()];
  },
  "top-k-frequent-elements": ({ nums, k }) => {
    const counts = new Map<number, number>();
    for (const n of nums) counts.set(n, (counts.get(n) ?? 0) + 1);
    return [...counts]
      .sort((a, b) => b[1] - a[1])
      .slice(0, k)
      .map(([n]) => n);
  },
  "encode-and-decode-strings": ({ words }) => {
    const encoded = words
      .map((word: string) => `${word.length}:${word}`)
      .join("");
    const result = [];
    let i = 0;
    while (i < encoded.length) {
      const end = encoded.indexOf(":", i);
      const length = Number(encoded.slice(i, end));
      result.push(encoded.slice(end + 1, end + 1 + length));
      i = end + 1 + length;
    }
    return result;
  },
  "product-of-array-except-self": ({ nums }) =>
    nums.map((_: number, i: number) =>
      nums.reduce(
        (p: number, v: number, j: number) => (i === j ? p : p * v),
        1,
      ),
    ),
  "valid-sudoku": ({ board }) => {
    const unique = (values: string[]) => {
      const filled = values.filter((x) => x !== ".");
      return new Set(filled).size === filled.length;
    };
    for (let i = 0; i < 9; i++) {
      if (!unique([...board[i]]) || !unique(board.map((r: string) => r[i])))
        return false;
      const box = [];
      for (let r = 0; r < 3; r++)
        for (let c = 0; c < 3; c++)
          box.push(board[Math.floor(i / 3) * 3 + r][(i % 3) * 3 + c]);
      if (!unique(box)) return false;
    }
    return true;
  },
  "longest-consecutive-sequence": ({ nums }) => {
    const sorted = [...new Set<number>(nums)].sort((a, b) => a - b);
    let best = 0,
      run = 0;
    sorted.forEach((x, i) => {
      run = i && x === sorted[i - 1]! + 1 ? run + 1 : 1;
      best = Math.max(best, run);
    });
    return best;
  },
  "two-sum-ii-input-array-is-sorted": ({ numbers, target }) =>
    sequenceOracles["two-sum"]!({ nums: numbers, target }).map(
      (i: number) => i + 1,
    ),
  "3sum": ({ nums }) => {
    const out = new Map<string, number[]>();
    for (let i = 0; i < nums.length; i++)
      for (let j = i + 1; j < nums.length; j++)
        for (let k = j + 1; k < nums.length; k++)
          if (nums[i] + nums[j] + nums[k] === 0) {
            const t = [nums[i], nums[j], nums[k]].sort((a, b) => a - b);
            out.set(JSON.stringify(t), t);
          }
    return [...out.values()];
  },
  "container-with-most-water": ({ height }) => {
    let best = 0;
    for (let i = 0; i < height.length; i++)
      for (let j = i + 1; j < height.length; j++)
        best = Math.max(best, (j - i) * Math.min(height[i], height[j]));
    return best;
  },
  "trapping-rain-water": ({ height }) =>
    height.reduce(
      (sum: number, h: number, i: number) =>
        sum +
        Math.max(
          0,
          Math.min(
            Math.max(...height.slice(0, i + 1)),
            Math.max(...height.slice(i)),
          ) - h,
        ),
      0,
    ),
  "longest-substring-without-repeating-characters": ({ s }) => {
    let best = 0;
    for (let i = 0; i < s.length; i++)
      for (let j = i + 1; j <= s.length; j++) {
        const t = s.slice(i, j);
        if (new Set(t).size === t.length) best = Math.max(best, t.length);
      }
    return best;
  },
  "longest-repeating-character-replacement": ({ s, k }) => {
    let best = 0;
    for (let i = 0; i < s.length; i++)
      for (let j = i + 1; j <= s.length; j++) {
        const t = s.slice(i, j);
        const freq = [...new Set<string>(t)].map(
          (c) => [...t].filter((x) => x === c).length,
        );
        if (t.length - Math.max(...freq) <= k) best = Math.max(best, t.length);
      }
    return best;
  },
  "permutation-in-string": ({ s1, s2 }) => {
    const key = [...s1].sort().join("");
    for (let i = 0; i + s1.length <= s2.length; i++)
      if ([...s2.slice(i, i + s1.length)].sort().join("") === key) return true;
    return false;
  },
  "minimum-window-substring": ({ s, t }) => {
    const covers = (w: string) =>
      [...new Set<string>(t)].every(
        (c) =>
          [...w].filter((x) => x === c).length >=
          [...t].filter((x) => x === c).length,
      );
    for (let length = t.length; length <= s.length; length++)
      for (let i = 0; i + length <= s.length; i++)
        if (covers(s.slice(i, i + length))) return s.slice(i, i + length);
    return "";
  },
  "sliding-window-maximum": ({ nums, k }) =>
    nums
      .slice(k - 1)
      .map((_: number, i: number) => Math.max(...nums.slice(i, i + k))),
  "min-stack": ({ ops }) => {
    const stack: number[] = [];
    return ops.map(([op, v]: any[]) => {
      if (op === "push") {
        stack.push(v);
        return null;
      }
      if (op === "pop") {
        stack.pop();
        return null;
      }
      return op === "top" ? stack.at(-1) : Math.min(...stack);
    });
  },
  "evaluate-reverse-polish-notation": ({ tokens }) => {
    const stack: number[] = [];
    for (const t of tokens) {
      if (["+", "-", "*", "/"].includes(t)) {
        const b = stack.pop()!,
          a = stack.pop()!;
        stack.push(
          t === "+"
            ? a + b
            : t === "-"
              ? a - b
              : t === "*"
                ? a * b
                : Math.trunc(a / b),
        );
      } else stack.push(Number(t));
    }
    return stack[0];
  },
  "daily-temperatures": ({ temperatures }) =>
    temperatures.map((v: number, i: number) => {
      const offset = temperatures.slice(i + 1).findIndex((t: number) => t > v);
      return offset < 0 ? 0 : offset + 1;
    }),
  "car-fleet": ({ target, position, speed }) => {
    const cars = position
      .map((p: number, i: number) => ({ p, time: (target - p) / speed[i] }))
      .sort((a: any, b: any) => b.p - a.p);
    let fleets = 0,
      last = -1;
    for (const car of cars)
      if (car.time > last) {
        fleets++;
        last = car.time;
      }
    return fleets;
  },
  "largest-rectangle-in-histogram": ({ heights }) => {
    let best = 0;
    for (let i = 0; i < heights.length; i++)
      for (let j = i; j < heights.length; j++)
        best = Math.max(
          best,
          (j - i + 1) * Math.min(...heights.slice(i, j + 1)),
        );
    return best;
  },
  "search-a-2d-matrix": ({ matrix, target }) => matrix.flat().includes(target),
  "koko-eating-bananas": ({ piles, h }) => {
    for (let k = 1; k <= Math.max(...piles); k++)
      if (piles.reduce((s: number, p: number) => s + Math.ceil(p / k), 0) <= h)
        return k;
    throw Error("No speed");
  },
  "find-minimum-in-rotated-sorted-array": ({ nums }) => Math.min(...nums),
  "search-in-rotated-sorted-array": ({ nums, target }) => nums.indexOf(target),
  "time-based-key-value-store": ({ ops }) => {
    const writes: { key: string; value: string; time: number }[] = [];
    return ops.map(([op, key, value, time]: any[]) => {
      if (op === "set") {
        writes.push({ key, value, time });
        return null;
      }
      return (
        writes
          .filter((w) => w.key === key && w.time <= value)
          .sort((a, b) => b.time - a.time)[0]?.value ?? ""
      );
    });
  },
  "number-of-1-bits": ({ n }) => n.toString(2).replaceAll("0", "").length,
  "counting-bits": ({ n }) =>
    Array.from(
      { length: n + 1 },
      (_, i) => i.toString(2).replaceAll("0", "").length,
    ),
  "reverse-bits": ({ n }) =>
    parseInt(n.toString(2).padStart(32, "0").split("").reverse().join(""), 2),
  "missing-number": ({ nums }) => {
    for (let i = 0; i <= nums.length; i++) if (!nums.includes(i)) return i;
    throw Error("No missing number");
  },
  "sum-of-two-integers": ({ a, b }) => a + b,
  "reverse-integer": ({ x }) => {
    const v =
      Math.sign(x) *
      Number(Math.abs(x).toString().split("").reverse().join(""));
    return v < -(2 ** 31) || v > 2 ** 31 - 1 ? 0 : v;
  },
};
