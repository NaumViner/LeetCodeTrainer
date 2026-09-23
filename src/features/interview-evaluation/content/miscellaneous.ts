import { draft as q } from "./define";

export const miscellaneousQuestions = {
  "jump-game": q(
    "Start at index zero. nums[i] gives the maximum forward jump length from i; any shorter nonnegative jump is allowed. Return whether the last index can be reached.",
    ["1 <= nums.length <= 100,000; 0 <= nums[i] <= 100,000."],
    [
      "Maintain the farthest reachable index using only reachable positions.",
      "A zero is blocking only if earlier jumps cannot pass it.",
    ],
    [{ nums: [2, 0, 2, 0, 1] }, true],
    [{ nums: [1, 0, 2] }, false],
  ),
  "jump-game-ii": q(
    "Starting at index zero, return the fewest forward jumps to reach the last index. nums[i] is the maximum jump length from i. Reaching the end is guaranteed.",
    ["1 <= nums.length <= 100,000; 0 <= nums[i] <= 100,000."],
    [
      "Process the current reachable range as one BFS layer and extend the next range before counting a jump.",
      "A single-element input requires zero jumps; do not count a jump after reaching the last index.",
    ],
    [{ nums: [2, 3, 0, 1, 4] }, 2],
    [{ nums: [0] }, 0],
  ),
  "gas-station": q(
    "Stations form a clockwise circle. At station i collect gas[i] fuel; traveling to the next station costs cost[i]. Start with an empty unlimited-capacity tank. Return the unique feasible starting index, or -1 if impossible. Inputs guarantee at most one feasible start.",
    ["1 <= gas.length = cost.length <= 100,000; 0 <= each entry <= 10,000."],
    [
      "A negative total net fuel makes every start impossible.",
      "When a running segment fails, all starts inside that segment can be skipped; reset at the next station.",
    ],
    [{ gas: [1, 1, 6], cost: [3, 2, 3] }, 2],
    [{ gas: [1, 1], cost: [2, 2] }, -1],
  ),
  "hand-of-straights": q(
    "Partition every card in hand into groups of groupSize cards with consecutive integer values. Return whether this is possible. Repeated values represent separate cards.",
    [
      "1 <= hand.length <= 10,000; 1 <= groupSize <= hand.length; values are integers from 0 to 1,000,000,000.",
    ],
    [
      "The smallest remaining card must begin a group; consume each next required value's multiplicity.",
      "Total length must be divisible by groupSize; never reuse an occurrence.",
    ],
    [{ hand: [1, 2, 2, 3, 3, 4], groupSize: 3 }, true],
    [{ hand: [1, 2, 4, 5], groupSize: 4 }, false],
  ),
  "merge-triplets-to-form-target-triplet": q(
    "You may choose two distinct triplets and replace one by their coordinate-wise maximum, repeating as needed. Return whether any triplet can become target. Existing target triplets already qualify.",
    [
      "1 <= triplets.length <= 100,000; each triplet and target have three positive integers <= 1,000.",
    ],
    [
      "Ignore any triplet exceeding target in any coordinate because maxima cannot reduce it.",
      "Every target coordinate must be supplied by at least one otherwise admissible triplet.",
    ],
    [
      {
        triplets: [
          [2, 1, 3],
          [1, 4, 2],
          [2, 2, 1],
        ],
        target: [2, 4, 3],
      },
      true,
    ],
    [
      {
        triplets: [
          [3, 4, 3],
          [2, 1, 3],
        ],
        target: [2, 4, 3],
      },
      false,
    ],
  ),
  "partition-labels": q(
    "Split s into as many nonempty contiguous parts as possible so each distinct character occurs in at most one part. Return the part lengths in order.",
    ["0 <= s.length <= 100,000; lowercase English letters."],
    [
      "A part must extend through the last occurrence of every character it contains.",
      "Close a part at the earliest index reaching its current farthest last occurrence.",
    ],
    [{ s: "abacddce" }, [3, 4, 1]],
    [{ s: "aaaa" }, [4]],
  ),
  "valid-parenthesis-string": q(
    "Return whether a string of '(', ')' and '*' can represent valid parentheses. Each '*' may independently become '(', ')' or an empty string.",
    ["0 <= s.length <= 100,000."],
    [
      "Track the minimum and maximum possible unmatched-open counts for each prefix.",
      "A negative maximum is impossible; clamp the minimum at zero, and require minimum zero at the end.",
    ],
    [{ s: "(*))" }, true],
    [{ s: "(((*)" }, false],
  ),
  "merge-intervals": q(
    "Merge all overlapping closed intervals and return the disjoint intervals sorted by start. Intervals touching at an endpoint overlap.",
    [
      "0 <= intervals.length <= 10,000; endpoints are signed integers of magnitude <= 1,000,000; start <= end.",
    ],
    [
      "Sort by start; merge a following interval whenever its start <= the current end.",
      "Nested intervals must not shorten the current merged end.",
    ],
    [
      {
        intervals: [
          [5, 8],
          [1, 3],
          [3, 6],
          [10, 11],
        ],
      },
      [
        [1, 8],
        [10, 11],
      ],
    ],
    [{ intervals: [] }, []],
  ),
  "non-overlapping-intervals": q(
    "Return the fewest intervals to remove so the remaining intervals do not overlap. For this task, intervals that only touch at an endpoint are compatible.",
    [
      "0 <= intervals.length <= 100,000; integer endpoints of magnitude <= 1,000,000; start < end.",
    ],
    [
      "Keeping the compatible interval ending earliest leaves the most room for future intervals.",
      "Strict overlap, not endpoint touching, forces a removal.",
    ],
    [
      {
        intervals: [
          [1, 4],
          [2, 3],
          [3, 5],
          [5, 7],
        ],
      },
      1,
    ],
    [
      {
        intervals: [
          [1, 2],
          [2, 3],
        ],
      },
      0,
    ],
  ),
  "meeting-rooms": q(
    "Return whether one person can attend all meetings. Meetings occupy half-open intervals [start,end), so one may begin exactly when another ends.",
    ["0 <= intervals.length <= 10,000; 0 <= start < end <= 1,000,000."],
    [
      "After sorting by start, each start must be at least the preceding end.",
      "Empty and single-meeting schedules are valid.",
    ],
    [
      {
        intervals: [
          [1, 3],
          [3, 5],
          [2, 4],
        ],
      },
      false,
    ],
    [
      {
        intervals: [
          [2, 4],
          [4, 6],
        ],
      },
      true,
    ],
  ),
  "meeting-rooms-ii": q(
    "Return the minimum number of rooms needed for all half-open meetings [start,end). A room can be reused at the exact time its previous meeting ends.",
    ["0 <= intervals.length <= 100,000; 0 <= start < end <= 1,000,000."],
    [
      "The answer is peak concurrent occupancy; process ends before starts at equal times.",
      "A min-heap tracks currently occupied end times, releasing all rooms that have become free.",
    ],
    [
      {
        intervals: [
          [1, 5],
          [2, 3],
          [3, 6],
        ],
      },
      2,
    ],
    [{ intervals: [] }, 0],
  ),
  "minimum-interval-to-include-each-query": q(
    "For each integer query, return the length of the smallest closed interval containing it, or -1 if none does. The length of [a,b] is b-a+1. Return answers in the original query order.",
    [
      "0 <= intervals.length <= 100,000; 1 <= queries.length <= 100,000; 0 <= start <= end <= 10,000,000; queries in that range.",
    ],
    [
      "Sort queries with original indices; activate intervals whose starts are reached and remove expired heap candidates.",
      "A length-ordered heap yields the smallest still-valid covering interval; repeated queries keep their original positions.",
    ],
    [
      {
        intervals: [
          [1, 5],
          [3, 4],
          [7, 7],
        ],
        queries: [4, 7, 6, 2],
      },
      [2, 1, -1, 5],
    ],
    [{ intervals: [], queries: [0] }, [-1]],
  ),
  "spiral-matrix": q(
    "Return a rectangular matrix's elements in clockwise spiral order, beginning at the top-left corner and initially moving right.",
    ["1 <= rows, columns <= 100; entries fit signed 32-bit integers."],
    [
      "Shrink top, right, bottom and left boundaries after traversing them.",
      "Check remaining bounds before bottom/left passes to avoid duplicating a final row or column.",
    ],
    [
      {
        matrix: [
          [1, 2, 3],
          [4, 5, 6],
        ],
      },
      [1, 2, 3, 6, 5, 4],
    ],
    [{ matrix: [[7], [8], [9]] }, [7, 8, 9]],
  ),
  "set-matrix-zeroes": q(
    "For every zero in the original matrix, set its entire row and column to zero. Modify the matrix in place using O(1) auxiliary space. Examples display the final matrix.",
    ["1 <= rows, columns <= 200; entries fit signed 32-bit integers."],
    [
      "Use the first row/column as markers plus separate flags for their original zero status.",
      "Newly written zeroes must not trigger additional rows or columns.",
    ],
    [
      {
        matrix: [
          [1, 2, 3],
          [4, 0, 6],
        ],
      },
      [
        [1, 0, 3],
        [0, 0, 0],
      ],
    ],
    [
      {
        matrix: [
          [0, 2],
          [3, 4],
        ],
      },
      [
        [0, 0],
        [0, 4],
      ],
    ],
  ),
  "happy-number": q(
    "Repeatedly replace a positive decimal integer with the sum of the squares of its digits. Return whether this process reaches 1. If it cycles without reaching 1, return false.",
    ["1 <= n <= 2^31-1."],
    [
      "Detect repeated states or use slow/fast iteration to terminate unhappy cycles.",
      "Square each digit individually rather than the whole number.",
    ],
    [{ n: 7 }, true],
    [{ n: 2 }, false],
  ),
  "plus-one": q(
    "A nonempty digit array represents a nonnegative decimal integer with most significant digit first and no leading zeroes except [0]. Return its digits after adding one, without converting the whole input into a built-in numeric type.",
    ["1 <= digits.length <= 10,000; each digit is 0 through 9."],
    [
      "Propagate carry from the rightmost digit and stop when it is absorbed.",
      "An all-nine input needs a new leading one.",
    ],
    [{ digits: [4, 9, 9] }, [5, 0, 0]],
    [{ digits: [9, 9] }, [1, 0, 0]],
  ),
  "powx-n": q(
    "Compute x raised to integer power n without using a built-in exponentiation function. Return a floating-point value, accepting relative or absolute error of 1e-5.",
    [
      "-100 < x < 100; -2^31 <= n <= 2^31-1; x is nonzero when n <= 0.",
      "The result is finite and representable; 0^0 is not supplied.",
    ],
    [
      "Exponentiation by squaring reduces work to O(log |n|).",
      "Invert for negative exponents and safely handle negation of the minimum signed integer.",
    ],
    [{ x: 2, n: -3 }, 0.125],
    [{ x: -3, n: 3 }, -27],
  ),
  "multiply-strings": q(
    "Multiply two nonnegative integers represented as decimal strings and return the product as a decimal string. Do not parse either whole number into a numeric or big-integer type, and do not use a big-number library.",
    [
      "1 <= num1.length, num2.length <= 200; digits only; no leading zeroes except '0'.",
    ],
    [
      "Accumulate digit products at their correct positional offsets and propagate carries.",
      "Strip leading zeroes while preserving exactly '0' for a zero product.",
    ],
    [{ num1: "24", num2: "13" }, "312"],
    [{ num1: "0", num2: "92" }, "0"],
  ),
  "detect-squares": q(
    "Implement add(point) and count(point). Stored integer points may repeat. count returns the number of ways to choose three stored occurrences that, together with the query point, form a positive-area axis-aligned square. The query point need not be stored. add returns null. Start empty.",
    ["At most 5,000 operations; coordinates from 0 through 1,000."],
    [
      "For each diagonal candidate, horizontal and vertical displacement magnitudes must be equal and nonzero.",
      "Multiply occurrence counts of the three required vertices; do not require or multiply a stored query occurrence.",
    ],
    [
      {
        ops: [
          ["add", [1, 1]],
          ["add", [1, 3]],
          ["add", [3, 1]],
          ["count", [3, 3]],
          ["add", [1, 1]],
          ["count", [3, 3]],
        ],
      },
      [null, null, null, 1, null, 2],
    ],
    [{ ops: [["count", [0, 0]]] }, [0]],
  ),
};
