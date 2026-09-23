import { draft as q } from "./define";

export const sequenceQuestions = {
  "valid-anagram": q(
    "Return whether strings s and t contain exactly the same characters with the same multiplicities, regardless of their order.",
    ["0 <= s.length, t.length <= 100,000; lowercase English letters only."],
    [
      "All character frequencies must match, including repeated letters; unequal lengths cannot match.",
      "Aim for linear time and constant alphabet storage.",
    ],
    [{ s: "silent", t: "listen" }, true],
    [{ s: "aab", t: "abb" }, false],
  ),
  "two-sum": q(
    "Return the two distinct zero-based indices whose values sum to target. Exactly one unordered index pair exists. Return the smaller index first; do not reuse an element.",
    [
      "2 <= nums.length <= 100,000; values and target are integers of magnitude at most 1,000,000.",
    ],
    [
      "Look up a complement among earlier indices before inserting the current element.",
      "Equal values may form a pair only at different indices; target O(n) time.",
    ],
    [{ nums: [8, 3, 6, 2], target: 5 }, [1, 3]],
    [{ nums: [4, 4], target: 8 }, [0, 1]],
  ),
  "group-anagrams": q(
    "Partition words into groups with identical character multiplicities. Preserve duplicates. Group order and the order within a group do not matter.",
    [
      "1 <= words.length <= 10,000; each word has 0 to 100 lowercase English letters.",
    ],
    [
      "The grouping key must distinguish different multiplicities and identify every anagram.",
      "Every input occurrence appears exactly once; sorting or frequency keys are valid.",
    ],
    [
      { words: ["arc", "car", "dog", "rac", "god"] },
      [
        ["arc", "car", "rac"],
        ["dog", "god"],
      ],
    ],
    [{ words: ["", "", "a"] }, [["", ""], ["a"]]],
  ),
  "top-k-frequent-elements": q(
    "Return the k distinct integers occurring most often in nums, in any order. The selected set is unique: if any value is excluded, its frequency is lower than that of every selected value. Aim for better than O(n log n) time.",
    [
      "1 <= nums.length <= 100,000; 1 <= k <= number of distinct values; values fit signed 32-bit integers.",
    ],
    [
      "Count all occurrences before selecting by frequency, not numeric value.",
      "Buckets or a bounded heap must return exactly k distinct values.",
    ],
    [{ nums: [5, 2, 5, 3, 2, 5], k: 2 }, [5, 2]],
    [{ nums: [-1, -1, 8], k: 1 }, [-1]],
  ),
  "encode-and-decode-strings": q(
    "Design encode(words) returning one string and decode(encoded) recovering the exact list. Words may contain digits, delimiters, spaces and empty strings. No built-in serialization of the entire list is allowed. Examples show decode(encode(words)); the encoded representation is your choice.",
    [
      "0 <= words.length <= 1,000; 0 <= each word length <= 10,000; printable ASCII characters.",
      "decode receives a string produced by your encoder.",
    ],
    [
      "The encoding is unambiguous for empty lists, empty elements and embedded separators.",
      "Length-prefix framing or a correctly reversible escaping scheme is valid; round-trip is the grading criterion.",
    ],
    [{ words: ["4:code", "", "a|b"] }, ["4:code", "", "a|b"]],
    [{ words: [] }, []],
  ),
  "product-of-array-except-self": q(
    "For each position return the product of all other elements. Do not use division. Target O(n) time and O(1) auxiliary space excluding the result array.",
    [
      "2 <= nums.length <= 100,000; -30 <= nums[i] <= 30; every prefix, suffix and requested product fits a signed 32-bit integer.",
    ],
    [
      "Combine products strictly before and strictly after each index.",
      "Zero and negative values must work without division or special incorrect shortcuts.",
    ],
    [{ nums: [2, 3, 4] }, [12, 8, 6]],
    [{ nums: [0, 5, 0] }, [0, 0, 0]],
  ),
  "valid-sudoku": q(
    "Return whether the filled cells of a 9 by 9 Sudoku board obey uniqueness in each row, column and aligned 3 by 3 box. A dot denotes an empty cell. Do not solve the board or require that it can be completed.",
    [
      "board contains exactly 9 strings of length 9, using '.' and '1' through '9'.",
    ],
    [
      "Ignore empty cells and maintain independent row, column and box sets.",
      "A duplicate in any one region invalidates the partial board.",
    ],
    [
      {
        board: [
          "1........",
          ".2.......",
          "..3......",
          "...4.....",
          "....5....",
          ".....6...",
          "......7..",
          ".......8.",
          "........9",
        ],
      },
      true,
    ],
    [
      {
        board: [
          "1........",
          ".1.......",
          ".........",
          ".........",
          ".........",
          ".........",
          ".........",
          ".........",
          ".........",
        ],
      },
      false,
    ],
  ),
  "longest-consecutive-sequence": q(
    "Return the size of the longest run of consecutive integer values present in an unsorted array. Input order is irrelevant and duplicates do not extend a run. Target expected O(n) time.",
    [
      "0 <= nums.length <= 100,000; -1,000,000,000 <= nums[i] <= 1,000,000,000.",
    ],
    [
      "Start a run only when its predecessor is absent so values are not repeatedly scanned.",
      "Deduplicate values and handle an empty array.",
    ],
    [{ nums: [8, 2, 4, 3, 2, 10] }, 3],
    [{ nums: [] }, 0],
  ),
  "two-sum-ii-input-array-is-sorted": q(
    "Given nondecreasing numbers, return the two one-based indices of the unique pair summing to target, in increasing order. Use distinct elements and O(1) auxiliary space.",
    [
      "2 <= numbers.length <= 100,000; values and target have magnitude at most 1,000,000; exactly one index pair exists.",
    ],
    [
      "Move the left pointer for a sum too small and the right pointer for a sum too large.",
      "Return one-based indices; handle equal values at distinct positions.",
    ],
    [{ numbers: [-4, 0, 3, 9], target: 5 }, [1, 4]],
    [{ numbers: [2, 2], target: 4 }, [1, 2]],
  ),
  "3sum": q(
    "Return all distinct value triples from three different indices whose sum is zero. Input values may repeat, but equivalent triples must appear once. Triple order and result order do not matter.",
    ["0 <= nums.length <= 3,000; -100,000 <= nums[i] <= 100,000."],
    [
      "Sorting plus a fixed index and two moving pointers permits O(n^2) search.",
      "Skip duplicate values without excluding valid repeated-value triples such as [-2,1,1].",
    ],
    [
      { nums: [-2, 0, 1, 1, 2] },
      [
        [-2, 0, 2],
        [-2, 1, 1],
      ],
    ],
    [{ nums: [0, 0, 0, 0] }, [[0, 0, 0]]],
  ),
  "container-with-most-water": q(
    "Vertical lines stand at integer indices with the supplied nonnegative heights. Select two lines maximizing width times the shorter height and return that area. Lines cannot tilt.",
    ["2 <= height.length <= 100,000; 0 <= height[i] <= 10,000."],
    [
      "The shorter endpoint limits area, so advancing it is sufficient while narrowing the interval.",
      "Width is the difference of indices, not the count of elements.",
    ],
    [{ height: [3, 1, 4, 2, 5] }, 12],
    [{ height: [0, 0] }, 0],
  ),
  "trapping-rain-water": q(
    "Unit-width bars have the given nonnegative heights. Return the total volume of water retained above them after rain, with open boundaries at both ends.",
    ["0 <= height.length <= 100,000; 0 <= height[i] <= 100,000."],
    [
      "Each position holds max(0,min(left maximum,right maximum)-height).",
      "Target O(n) time; two-pointer O(1) storage or linear prefix/suffix storage are valid, with tradeoffs explained.",
    ],
    [{ height: [4, 1, 3, 1, 4] }, 7],
    [{ height: [1, 2, 3] }, 0],
  ),
  "longest-substring-without-repeating-characters": q(
    "Return the length of the longest contiguous substring of s containing no repeated character. Characters include spaces and punctuation.",
    ["0 <= s.length <= 100,000; ASCII characters."],
    [
      "The active window contains each character at most once.",
      "The left boundary never moves backward when using last-seen indices.",
    ],
    [{ s: "abcaef" }, 5],
    [{ s: "" }, 0],
  ),
  "longest-repeating-character-replacement": q(
    "You may change at most k characters of an uppercase string. Return the largest length of a contiguous substring that can become one repeated letter.",
    [
      "0 <= s.length <= 100,000; 0 <= k <= s.length; uppercase English letters.",
    ],
    [
      "A window needs window length minus its highest character frequency replacements.",
      "A stale maximum-frequency optimization is acceptable only with a correct argument for the best length.",
    ],
    [{ s: "ABABBA", k: 1 }, 4],
    [{ s: "AAAA", k: 0 }, 4],
  ),
  "permutation-in-string": q(
    "Return whether s2 contains a contiguous substring that is a permutation of s1, including repeated characters.",
    ["1 <= s1.length, s2.length <= 100,000; lowercase English letters."],
    [
      "Compare character multiplicities for windows of exactly s1.length.",
      "An input pattern longer than the text cannot match; target linear time.",
    ],
    [{ s1: "aab", s2: "xxabaq" }, true],
    [{ s1: "ab", s2: "cccc" }, false],
  ),
  "minimum-window-substring": q(
    "Return the shortest substring of s containing every character of t with at least the required multiplicity. Return an empty string if impossible. If shortest windows tie, return the one starting earliest.",
    [
      "0 <= s.length <= 100,000; 1 <= t.length <= 100,000; ASCII letters, case-sensitive.",
    ],
    [
      "Track satisfied multiplicities, not merely distinct-character presence.",
      "Shrink only while coverage holds and record the minimum; target O(s.length+t.length).",
    ],
    [{ s: "zzabcaaz", t: "aac" }, "caa"],
    [{ s: "ab", t: "bb" }, ""],
  ),
  "sliding-window-maximum": q(
    "Slide a window of k elements across nums by one position at a time. Return its maximum at each position in left-to-right order. Target O(n) time.",
    ["1 <= k <= nums.length <= 100,000; values fit signed 32-bit integers."],
    [
      "A decreasing deque stores candidate indices, dropping expired indices.",
      "Duplicate maxima and windows of size one must be handled.",
    ],
    [{ nums: [4, 1, 5, 2, 3], k: 3 }, [5, 5, 5]],
    [{ nums: [-2, -1], k: 1 }, [-2, -1]],
  ),
  "min-stack": q(
    "Implement MinStack with push(value), pop(), top(), and getMin(), each O(1). top and getMin return values; push and pop return null. Examples list operations after creating an empty stack.",
    [
      "At most 100,000 operations; values fit signed 32-bit integers.",
      "pop, top and getMin are called only on nonempty stacks.",
    ],
    [
      "The saved minimum at each depth reflects that exact prefix.",
      "Popping one occurrence of a repeated minimum must preserve the remaining occurrence.",
    ],
    [
      {
        ops: [
          ["push", 5],
          ["push", 2],
          ["push", 2],
          ["pop"],
          ["getMin"],
          ["top"],
        ],
      },
      [null, null, null, null, 2, 2],
    ],
    [{ ops: [["push", -1], ["top"], ["getMin"]] }, [null, -1, -1]],
  ),
  "evaluate-reverse-polish-notation": q(
    "Evaluate a valid postfix expression given as tokens. Operators are +, -, * and /. Division truncates toward zero. Return the integer result.",
    [
      "1 <= tokens.length <= 10,000; numeric tokens are signed decimal integers.",
      "The expression is valid, division by zero never occurs, and intermediate results fit signed 32-bit integers.",
    ],
    [
      "The first popped operand is the right operand of subtraction and division.",
      "Each operator replaces two operands with one value.",
    ],
    [{ tokens: ["7", "-3", "/"] }, -2],
    [{ tokens: ["2", "5", "+", "3", "*"] }, 21],
  ),
  "daily-temperatures": q(
    "For each daily temperature return how many days must pass until a strictly warmer day. Return zero when none follows.",
    [
      "1 <= temperatures.length <= 100,000; temperatures are integers between -100 and 100.",
    ],
    [
      "An unresolved stack contains nonincreasing temperatures at increasing indices.",
      "Equal temperatures do not resolve an earlier day; target O(n) time.",
    ],
    [{ temperatures: [20, 20, 18, 23, 21] }, [3, 2, 1, 0, 0]],
    [{ temperatures: [3, 2, 1] }, [0, 0, 0]],
  ),
  "car-fleet": q(
    "Cars travel toward target from distinct positions at constant positive speeds. A faster car cannot pass a slower car ahead: once caught, they form a fleet at the slower speed. Fleets meeting exactly at the destination count as one. Return the number arriving.",
    [
      "1 <= position.length = speed.length <= 100,000; 0 <= position[i] < target <= 1,000,000; 1 <= speed[i] <= 1,000,000.",
    ],
    [
      "Process cars from nearest to farthest; a trailing arrival time no larger than the leading fleet time merges.",
      "Do not compare speeds alone; distance to target matters.",
    ],
    [{ target: 12, position: [9, 6, 0], speed: [1, 2, 1] }, 2],
    [{ target: 10, position: [0, 5], speed: [2, 1] }, 1],
  ),
  "largest-rectangle-in-histogram": q(
    "Each height describes an adjacent unit-width bar. Return the largest rectangle area that fits entirely under the histogram.",
    ["0 <= heights.length <= 100,000; 0 <= heights[i] <= 10,000."],
    [
      "For each height identify its maximal span before a smaller bar on either side.",
      "A monotonic stack must flush trailing bars and treat equal heights consistently; target O(n).",
    ],
    [{ heights: [3, 1, 4, 4, 2] }, 8],
    [{ heights: [0, 0] }, 0],
  ),
  "search-a-2d-matrix": q(
    "Return whether target occurs in a rectangular matrix. Each row is strictly increasing and the first entry of a later row exceeds the last of the previous row. Target O(log(rows*columns)) time.",
    [
      "1 <= rows, columns <= 1,000; values and target fit signed 32-bit integers.",
    ],
    [
      "The matrix behaves like one sorted array under row-major indexing.",
      "Bounds updates must preserve any possible target and terminate.",
    ],
    [
      {
        matrix: [
          [1, 4, 7],
          [9, 12, 16],
        ],
        target: 12,
      },
      true,
    ],
    [{ matrix: [[2]], target: 1 }, false],
  ),
  "koko-eating-bananas": q(
    "Choose a positive integer eating speed k. In each hour, one pile is chosen and up to k bananas are eaten from it; unused time cannot move to another pile. Return the minimum k that finishes within h hours.",
    [
      "1 <= piles.length <= 10,000; 1 <= piles[i] <= 1,000,000,000; piles.length <= h <= 1,000,000,000.",
    ],
    [
      "Required hours are the sum of ceil(pile/k) and decrease as k increases.",
      "Binary search for the first feasible speed; avoid overflow in hour sums.",
    ],
    [{ piles: [5, 8, 11], h: 7 }, 4],
    [{ piles: [9], h: 3 }, 3],
  ),
  "find-minimum-in-rotated-sorted-array": q(
    "A strictly increasing array was rotated zero or more positions. Return its minimum value in O(log n) time.",
    ["1 <= nums.length <= 100,000; distinct signed 32-bit integer values."],
    [
      "Comparison with the right boundary identifies which half contains the minimum.",
      "Already sorted and single-element arrays remain valid.",
    ],
    [{ nums: [7, 10, 1, 3, 5] }, 1],
    [{ nums: [-2, 4] }, -2],
  ),
  "search-in-rotated-sorted-array": q(
    "A strictly increasing array has been cyclically rotated. Return target's zero-based index, or -1 if absent, in O(log n) time.",
    [
      "1 <= nums.length <= 100,000; distinct signed 32-bit integer values; target fits signed 32-bit.",
    ],
    [
      "At least one side of each midpoint is sorted; test target membership in that interval.",
      "Update boundaries without discarding an equal midpoint.",
    ],
    [{ nums: [6, 9, 12, 1, 3], target: 1 }, 3],
    [{ nums: [3], target: 4 }, -1],
  ),
  "time-based-key-value-store": q(
    "Implement set(key,value,timestamp) and get(key,timestamp). get returns the value at the largest stored timestamp not exceeding the query, or an empty string when none exists. set returns null. Start with an empty store.",
    [
      "At most 100,000 operations; keys and values are nonempty strings of at most 100 characters.",
      "set timestamps are positive integers and strictly increase across all set calls; queries can use any nonnegative timestamp.",
    ],
    [
      "Histories are sorted by timestamp per key; binary search the rightmost allowed entry.",
      "Missing keys and queries before the first write return an empty string.",
    ],
    [
      {
        ops: [
          ["set", "a", "red", 2],
          ["set", "a", "blue", 6],
          ["get", "a", 5],
          ["get", "a", 6],
          ["get", "b", 9],
        ],
      },
      [null, null, "red", "blue", ""],
    ],
    [
      {
        ops: [
          ["set", "x", "y", 4],
          ["get", "x", 1],
        ],
      },
      [null, ""],
    ],
  ),
  "number-of-1-bits": q(
    "Return the number of set bits in the unsigned 32-bit binary representation of n.",
    ["0 <= n <= 2^32-1; decimal input represents an unsigned value."],
    [
      "Repeatedly clearing the lowest set bit or checking all 32 positions counts each one once.",
      "Language-specific signed shifts must not loop forever.",
    ],
    [{ n: 13 }, 3],
    [{ n: 0 }, 0],
  ),
  "counting-bits": q(
    "Return an array of length n+1 where entry i counts the set bits in i. Aim for O(n) total time.",
    ["0 <= n <= 100,000."],
    [
      "bits[i] = bits[i >> 1] + (i & 1), with bits[0] = 0.",
      "The output includes both zero and n.",
    ],
    [{ n: 4 }, [0, 1, 1, 2, 1]],
    [{ n: 0 }, [0]],
  ),
  "reverse-bits": q(
    "Reverse all 32 bits of unsigned integer n, including leading zeroes. Return the resulting unsigned integer in decimal.",
    ["0 <= n <= 2^32-1."],
    [
      "Exactly 32 positions are reversed; leading zeroes become trailing zeroes.",
      "Convert a signed implementation's result to its unsigned interpretation.",
    ],
    [{ n: 1 }, 2147483648],
    [{ n: 3 }, 3221225472],
  ),
  "missing-number": q(
    "An array contains distinct values selected from 0 through n, where n is its length. Return the single missing value using O(n) time and O(1) extra space.",
    [
      "0 <= nums.length <= 100,000; 0 <= nums[i] <= nums.length; values are distinct.",
    ],
    [
      "XOR cancellation or an overflow-safe expected sum isolates the missing value.",
      "The missing number can be zero or n.",
    ],
    [{ nums: [4, 0, 2, 1] }, 3],
    [{ nums: [] }, 0],
  ),
  "sum-of-two-integers": q(
    "Return a+b without using addition or subtraction operators in your solution. Inputs and their sum fit signed 32-bit integers.",
    ["-1,000,000 <= a,b <= 1,000,000."],
    [
      "XOR forms the carry-free sum and shifted AND forms carry bits.",
      "Use a 32-bit mask for negative values in arbitrary-precision languages and restore signed interpretation.",
    ],
    [{ a: -7, b: 12 }, 5],
    [{ a: -4, b: -3 }, -7],
  ),
  "reverse-integer": q(
    "Reverse the decimal digits of signed integer x, preserving its sign and discarding leading zeroes in the result. Return zero if the reversal is outside the signed 32-bit range. Do not rely on a wider integer type to store an overflowing intermediate value.",
    ["-2^31 <= x <= 2^31-1."],
    [
      "Check overflow before multiplying the accumulator by ten and adding a digit.",
      "Negative remainder and division behavior must be handled consistently.",
    ],
    [{ x: -430 }, -34],
    [{ x: 1534236469 }, 0],
  ),
};
