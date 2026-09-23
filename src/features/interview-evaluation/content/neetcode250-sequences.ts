import { draft as q } from "./define";

export const extendedSequenceQuestions = {
  "concatenation-of-array": q(
    "Return a new array containing nums followed by a second copy of nums. Preserve the input and element order.",
    ["0 <= nums.length <= 100,000; integer elements."],
    [
      "Output length is twice the input length.",
      "Output[i] and output[i+n] both equal nums[i]; inputs are not mutated.",
    ],
    [{ nums: [4, 1, 7] }, [4, 1, 7, 4, 1, 7]],
    [{ nums: [] }, []],
  ),
  "longest-common-prefix": q(
    "Return the longest string that is a prefix of every input string. Return an empty string when there is no shared prefix or the list is empty.",
    ["0 <= words.length <= 1,000; each word has 0 to 1,000 lowercase letters."],
    [
      "A shared prefix cannot extend beyond the shortest word.",
      "Compare positions, not unordered character membership.",
    ],
    [{ words: ["stone", "stop", "story"] }, "sto"],
    [{ words: ["a", ""] }, ""],
  ),
  "remove-element": q(
    "Remove all occurrences of val from nums in place and return the remaining count k. The first k positions must contain exactly the remaining occurrences in any order; later positions are irrelevant. Examples show {k,kept} for one valid prefix.",
    ["0 <= nums.length <= 100,000; signed 32-bit integers."],
    [
      "Never count removed values in the accepted prefix.",
      "Use O(1) auxiliary space; any permutation of the kept multiset is acceptable.",
    ],
    [
      { nums: [4, 2, 4, 3], val: 4 },
      { k: 2, kept: [2, 3] },
    ],
    [
      { nums: [1, 1], val: 1 },
      { k: 0, kept: [] },
    ],
  ),
  "majority-element": q(
    "Return the value occurring strictly more than half the time. The input guarantees that such a value exists. Aim for O(n) time and O(1) extra space.",
    ["1 <= nums.length <= 100,000; signed 32-bit values."],
    [
      "Boyer-Moore cancels different values without eliminating the true majority.",
      "A zero balance permits replacing the candidate; distinguish majority from mere highest frequency.",
    ],
    [{ nums: [3, 5, 3, 3, 5] }, 3],
    [{ nums: [8] }, 8],
  ),
  "design-hashset": q(
    "Implement an integer set with add(key), remove(key), and contains(key), starting empty. add and remove return null; contains returns a boolean. Duplicate insertion and absent removal are no-ops. Do not use a built-in set or map.",
    ["0 <= key <= 1,000,000; at most 100,000 operations."],
    [
      "Membership is independent of insertion multiplicity.",
      "Direct addressing is allowed within these bounds; a hashing design must resolve collisions correctly.",
    ],
    [
      {
        ops: [
          ["add", 3],
          ["add", 3],
          ["contains", 3],
          ["remove", 3],
          ["contains", 3],
        ],
      },
      [null, null, true, null, false],
    ],
    [
      {
        ops: [
          ["remove", 8],
          ["contains", 8],
        ],
      },
      [null, false],
    ],
  ),
  "design-hashmap": q(
    "Implement put(key,value), get(key), and remove(key) without a built-in map or set. get returns -1 for an absent key; other operations return null. put overwrites the old value for an existing key. Start empty.",
    ["0 <= key,value <= 1,000,000; at most 100,000 operations."],
    [
      "Each key has at most one current value.",
      "Missing state must differ from a stored zero; collisions must not overwrite unrelated keys.",
    ],
    [
      {
        ops: [
          ["put", 2, 0],
          ["get", 2],
          ["put", 2, 9],
          ["get", 2],
          ["remove", 2],
          ["get", 2],
        ],
      },
      [null, 0, null, 9, null, -1],
    ],
    [{ ops: [["get", 5]] }, [-1]],
  ),
  "sort-an-array": q(
    "Return nums in nondecreasing order using an implemented comparison-sorting algorithm rather than a built-in sort. Require O(n log n) worst-case time and explain memory use.",
    [
      "0 <= nums.length <= 100,000; signed 32-bit integers, including duplicates.",
    ],
    [
      "Preserve every occurrence while establishing total sorted order.",
      "Merge sort or heapsort meets the worst-case bound; unguarded quicksort does not guarantee it.",
    ],
    [{ nums: [5, -1, 5, 2] }, [-1, 2, 5, 5]],
    [{ nums: [] }, []],
  ),
  "sort-colors": q(
    "Sort an array containing only 0, 1 and 2 in place. Do not use a built-in sorting routine. Aim for one pass with O(1) auxiliary space; examples show the mutated array.",
    ["0 <= nums.length <= 100,000."],
    [
      "Maintain established zero, one and two regions around an unknown region.",
      "After swapping from the unprocessed right end, inspect the incoming value before advancing.",
    ],
    [{ nums: [2, 0, 1, 2, 0] }, [0, 0, 1, 2, 2]],
    [{ nums: [1, 1] }, [1, 1]],
  ),
  "range-sum-query-2d-immutable": q(
    "Preprocess an immutable rectangular matrix to answer inclusive rectangle sums. Each query is [row1,col1,row2,col2] with the first corner above and left of the second. Return each sum in query order, targeting O(1) per query after O(rows*columns) preprocessing.",
    [
      "1 <= rows,columns <= 200; at most 10,000 queries; entries have magnitude <= 10,000; coordinates are valid.",
    ],
    [
      "A padded 2D prefix table removes special boundary cases.",
      "Subtract both excluded prefixes and add their intersection once.",
    ],
    [
      {
        matrix: [
          [1, 2, 3],
          [4, 5, 6],
        ],
        queries: [
          [0, 1, 1, 2],
          [1, 0, 1, 0],
        ],
      },
      [16, 4],
    ],
    [{ matrix: [[-2]], queries: [[0, 0, 0, 0]] }, [-2]],
  ),
  "best-time-to-buy-and-sell-stock-ii": q(
    "Choose any number of buy/sell transactions to maximize profit from daily prices, holding at most one share at a time. Same-day sell and buy are allowed. Return profit, with no transaction yielding zero.",
    ["0 <= prices.length <= 100,000; 0 <= prices[i] <= 10,000."],
    [
      "Every profitable adjacent rise can contribute independently.",
      "No short selling or simultaneous holdings; explain why splitting a longer rise does not change profit.",
    ],
    [{ prices: [4, 1, 5, 2, 6] }, 8],
    [{ prices: [5, 3, 1] }, 0],
  ),
  "majority-element-ii": q(
    "Return all values occurring strictly more than floor(n/3) times, in any order. Aim for linear time and constant auxiliary storage excluding the output.",
    ["0 <= nums.length <= 100,000; signed 32-bit integers."],
    [
      "There can be at most two qualifying values.",
      "Two-candidate cancellation needs a final frequency verification; candidates alone are not answers.",
    ],
    [{ nums: [2, 2, 3, 3, 2, 3, 4] }, [2, 3]],
    [{ nums: [1, 2, 3] }, []],
  ),
  "subarray-sum-equals-k": q(
    "Count the nonempty contiguous subarrays whose sum equals k. Equal-valued subarrays at different positions count separately.",
    ["0 <= nums.length <= 20,000; |nums[i]| <= 1,000; |k| <= 10,000,000."],
    [
      "For each prefix sum S, count earlier prefixes equal to S-k before recording S.",
      "Seed the empty prefix once; negative values make an ordinary positive-only sliding window invalid.",
    ],
    [{ nums: [1, -1, 1], k: 1 }, 3],
    [{ nums: [0, 0], k: 0 }, 3],
  ),
  "first-missing-positive": q(
    "Return the smallest positive integer absent from nums. Achieve O(n) time and O(1) auxiliary space; modifying nums is allowed.",
    ["0 <= nums.length <= 100,000; signed 32-bit integers."],
    [
      "The answer is in [1,n+1]; out-of-range values cannot affect placement.",
      "Place each valid value v at index v-1 or mark presence; duplicate values must not cause an infinite swapping loop.",
    ],
    [{ nums: [3, 4, -1, 1] }, 2],
    [{ nums: [1, 2, 2] }, 3],
  ),
  "reverse-string": q(
    "Reverse a character array in place using O(1) additional space. Return no value; examples show the updated array.",
    ["0 <= chars.length <= 100,000; each element is one ASCII character."],
    [
      "Symmetric swaps preserve all occurrences.",
      "Stop when pointers meet or cross; odd lengths retain the center.",
    ],
    [{ chars: ["c", "o", "d", "e"] }, ["e", "d", "o", "c"]],
    [{ chars: [] }, []],
  ),
  "valid-palindrome-ii": q(
    "Return whether s can become a palindrome after removing at most one character. Matching is case-sensitive and includes every character.",
    ["0 <= s.length <= 100,000; lowercase English letters."],
    [
      "At the first mismatch only skipping one endpoint can work.",
      "The remaining palindrome checks allow no further deletions; target O(n).",
    ],
    [{ s: "abca" }, true],
    [{ s: "abc" }, false],
  ),
  "merge-strings-alternately": q(
    "Build a string by alternating characters from word1 and word2, beginning with word1. Append the remaining suffix when one word is exhausted.",
    ["0 <= each length <= 100,000; lowercase English letters."],
    [
      "Preserve each source's internal order.",
      "The result contains exactly the sum of the source lengths.",
    ],
    [{ word1: "ab", word2: "wxyz" }, "awbxyz"],
    [{ word1: "", word2: "cat" }, "cat"],
  ),
  "merge-sorted-array": q(
    "nums1 contains m sorted values followed by n spare slots. nums2 contains n sorted values. Merge into nums1 in place, using O(1) auxiliary space; spare slot values have no meaning. Examples show the final nums1.",
    [
      "0 <= m,n; 1 <= m+n <= 100,000; nums1.length=m+n; nums2.length=n; signed 32-bit values.",
    ],
    [
      "Fill from the end to avoid overwriting unread nums1 elements.",
      "Only the first m entries of nums1 are input; zero may be a legitimate value.",
    ],
    [{ nums1: [1, 4, 0, 0], m: 2, nums2: [2, 3], n: 2 }, [1, 2, 3, 4]],
    [{ nums1: [0], m: 0, nums2: [-1], n: 1 }, [-1]],
  ),
  "remove-duplicates-from-sorted-array": q(
    "Compact a nondecreasing array in place so its first k values are the distinct input values in sorted order, and return k. Later entries are irrelevant. Examples show {k,kept}.",
    ["0 <= nums.length <= 100,000; signed 32-bit integers."],
    [
      "Read every occurrence while advancing the write index only for a new value.",
      "Use constant auxiliary space and handle an empty input.",
    ],
    [{ nums: [1, 1, 2, 4, 4] }, { k: 3, kept: [1, 2, 4] }],
    [{ nums: [] }, { k: 0, kept: [] }],
  ),
  "4sum": q(
    "Return all unique nondecreasing quadruplets from four distinct indices whose values sum to target. Result order does not matter, and duplicate value combinations must appear only once.",
    ["0 <= nums.length <= 200; |nums[i]|,|target| <= 1,000,000,000."],
    [
      "Sorting with two fixed indices and two pointers permits O(n^3) search.",
      "Skip equal sibling choices and use arithmetic wide enough for four-value sums.",
    ],
    [
      { nums: [-2, -1, 0, 0, 1, 2], target: 0 },
      [
        [-2, -1, 1, 2],
        [-2, 0, 0, 2],
        [-1, 0, 0, 1],
      ],
    ],
    [{ nums: [2, 2, 2, 2, 2], target: 8 }, [[2, 2, 2, 2]]],
  ),
  "rotate-array": q(
    "Rotate nums right by k positions in place. Use O(1) auxiliary space and O(n) time; examples show the mutated array.",
    [
      "1 <= nums.length <= 100,000; 0 <= k <= 1,000,000,000; signed 32-bit values.",
    ],
    [
      "Normalize k by n before indexing or reversing segments.",
      "Every element moves to (i+k) modulo n without loss; k=0 is unchanged.",
    ],
    [{ nums: [1, 2, 3, 4, 5], k: 2 }, [4, 5, 1, 2, 3]],
    [{ nums: [8, 9], k: 4 }, [8, 9]],
  ),
  "boats-to-save-people": q(
    "Each boat can carry at most two people with total weight at most limit. Return the fewest boats needed for everyone.",
    ["0 <= people.length <= 50,000; 1 <= people[i] <= limit <= 30,000."],
    [
      "The heaviest remaining person must take a boat; pair with the lightest if possible.",
      "If that pair is too heavy, no other person can accompany the heaviest.",
    ],
    [{ people: [3, 2, 2, 1], limit: 3 }, 3],
    [{ people: [], limit: 5 }, 0],
  ),
  "contains-duplicate-ii": q(
    "Return whether two equal array values occur at distinct indices whose absolute difference is at most k.",
    ["0 <= nums.length <= 100,000; 0 <= k <= 100,000; signed 32-bit values."],
    [
      "Use the nearest earlier occurrence or a window limited to k earlier elements.",
      "k=0 can never admit distinct indices; duplicate values alone are insufficient.",
    ],
    [{ nums: [1, 2, 3, 1], k: 3 }, true],
    [{ nums: [1, 2, 3, 1], k: 2 }, false],
  ),
  "minimum-size-subarray-sum": q(
    "Return the length of the shortest nonempty contiguous subarray with sum at least target, or zero if none exists.",
    [
      "0 <= nums.length <= 100,000; 1 <= nums[i] <= 10,000; 1 <= target <= 1,000,000,000.",
    ],
    [
      "Positivity makes shrinking a sufficient window monotonic.",
      "Keep shrinking while the threshold is met and record the shortest length; target O(n).",
    ],
    [{ target: 7, nums: [2, 3, 1, 2, 4, 3] }, 2],
    [{ target: 10, nums: [1, 2] }, 0],
  ),
  "find-k-closest-elements": q(
    "Return k elements closest to x from a nondecreasing array, in sorted order. Compare absolute distance first and smaller value second. Count duplicate occurrences separately.",
    ["1 <= k <= arr.length <= 100,000; |arr[i]|,|x| <= 10,000."],
    [
      "The chosen elements form a contiguous sorted window under the tie rule.",
      "Binary search the window start or shrink endpoints; explain the cost including output.",
    ],
    [{ arr: [1, 2, 3, 4, 5], k: 4, x: 3 }, [1, 2, 3, 4]],
    [{ arr: [1, 1, 2, 3], k: 2, x: 0 }, [1, 1]],
  ),
  "baseball-game": q(
    "Process score operations: an integer adds a score, '+' adds the sum of the previous two scores, 'D' adds twice the previous score, and 'C' removes the previous score. Return the sum of the remaining scores.",
    [
      "0 <= ops.length <= 1,000; operations always have enough preceding scores; all intermediate values fit signed 32-bit.",
    ],
    [
      "Only currently valid scores participate after cancellations.",
      "A stack preserves the last scores needed by later operations.",
    ],
    [{ ops: ["5", "2", "C", "D", "+"] }, 30],
    [{ ops: ["3", "C"] }, 0],
  ),
  "implement-stack-using-queues": q(
    "Implement a last-in-first-out stack with push(value), pop(), top() and empty(), using only standard queue operations. Start empty. push returns null; pop and top return values; empty returns a boolean.",
    [
      "At most 10,000 operations; integer values; pop/top are called only when nonempty.",
    ],
    [
      "Use queue enqueue/dequeue/front/size operations, not indexed removal or a built-in stack.",
      "Preserve LIFO order and explain whether push or pop performs the costly rotation.",
    ],
    [
      {
        ops: [
          ["push", 2],
          ["push", 5],
          ["top"],
          ["pop"],
          ["empty"],
          ["pop"],
          ["empty"],
        ],
      },
      [null, null, 5, 5, false, 2, true],
    ],
    [{ ops: [["empty"]] }, [true]],
  ),
  "implement-queue-using-stacks": q(
    "Implement a first-in-first-out queue with push(value), pop(), peek() and empty(), using only stack operations. Start empty. push returns null; pop/peek return values; empty returns a boolean. Target amortized O(1) per operation.",
    [
      "At most 100,000 operations; integer values; pop/peek are called only when nonempty.",
    ],
    [
      "Transfer from the incoming stack only when the outgoing stack is empty.",
      "Each element moves between stacks at most once, preserving FIFO order.",
    ],
    [
      {
        ops: [
          ["push", 2],
          ["push", 5],
          ["peek"],
          ["pop"],
          ["push", 7],
          ["pop"],
        ],
      },
      [null, null, 2, 2, null, 5],
    ],
    [{ ops: [["empty"]] }, [true]],
  ),
  "asteroid-collision": q(
    "Integers describe asteroids ordered left to right: absolute value is size, positive moves right and negative moves left. All move at equal speed. Opposing asteroids collide, destroying the smaller or both if equal. Return survivors in their original relative order.",
    [
      "0 <= asteroids.length <= 100,000; nonzero values with magnitude <= 10,000.",
    ],
    [
      "A collision is possible only between an earlier positive survivor and an incoming negative asteroid.",
      "An incoming asteroid may destroy several stacked survivors before stopping.",
    ],
    [{ asteroids: [5, 10, -5] }, [5, 10]],
    [{ asteroids: [10, 2, -5] }, [10]],
    [{ asteroids: [-2, 2] }, [-2, 2]],
  ),
  "online-stock-span": q(
    "For each price arriving in order, return the number of consecutive days ending today whose prices are all <= today's price. Today always counts. Examples show all results of next(price) calls on an initially empty stream.",
    ["1 <= prices.length <= 100,000; positive prices <= 1,000,000."],
    [
      "A decreasing stack stores price/span pairs; absorb all preceding pairs priced <= today.",
      "Each pair is pushed and popped at most once, giving amortized O(1) updates.",
    ],
    [{ prices: [100, 80, 60, 70, 60, 75, 85] }, [1, 1, 1, 2, 1, 4, 6]],
    [{ prices: [5, 5, 5] }, [1, 2, 3]],
  ),
  "simplify-path": q(
    "Normalize an absolute Unix-style path. Repeated slashes collapse, '.' is ignored, and '..' goes to the parent without moving above root. Other names, including '...', are literal directory names. Return one leading slash and no trailing slash unless the result is root.",
    [
      "1 <= path.length <= 100,000; path begins with '/'; directory names contain ASCII letters, digits, underscores and dots.",
    ],
    [
      "Process complete path segments rather than individual dots.",
      "A stack stores surviving directory names; excess parent references stop at root.",
    ],
    [{ path: "/a//b/.././c/" }, "/a/c"],
    [{ path: "/../../.../" }, "/..."],
  ),
  "decode-string": q(
    "Decode expressions k[encoded] by repeating the bracketed content k times. Encodings may nest and concatenate with lowercase literal letters. Counts may have multiple digits. Return the fully decoded string.",
    [
      "1 <= encoded length <= 1,000; valid balanced syntax; 1 <= k <= 300; decoded length <= 100,000.",
    ],
    [
      "Each nesting level preserves both its accumulated prefix and repeat count.",
      "Multi-digit counts must be accumulated before entering a bracket; bound work by output size.",
    ],
    [{ s: "2[a3[b]]" }, "abbbabbb"],
    [{ s: "x3[yz]" }, "xyzyzyz"],
  ),
  "maximum-frequency-stack": q(
    "Implement push(value) and pop() starting empty. pop removes and returns the most frequent current value; ties choose the most recently pushed occurrence among tied values. push returns null.",
    [
      "At most 100,000 operations; integer values; pop is called only when nonempty.",
    ],
    [
      "Track current frequencies and recency separately within each frequency group.",
      "Popping decrements that value's frequency and lowers maximum frequency when its group empties.",
    ],
    [
      {
        ops: [
          ["push", 5],
          ["push", 7],
          ["push", 5],
          ["push", 7],
          ["push", 4],
          ["push", 5],
          ["pop"],
          ["pop"],
          ["pop"],
          ["pop"],
        ],
      },
      [null, null, null, null, null, null, 5, 7, 5, 4],
    ],
    [{ ops: [["push", 2], ["pop"]] }, [null, 2]],
  ),
  "search-insert-position": q(
    "Return target's index in a strictly increasing array, or the insertion index that preserves order when absent. Target O(log n) time.",
    ["0 <= nums.length <= 100,000; signed 32-bit values and target."],
    [
      "Find the first position whose value is >= target.",
      "Insertion can be before all entries, after all entries, or into an empty array.",
    ],
    [{ nums: [1, 4, 7], target: 5 }, 2],
    [{ nums: [], target: 3 }, 0],
  ),
  "guess-number-higher-or-lower": q(
    "An unknown integer lies in [1,n]. You may call guess(value): it returns -1 if value is too high, 1 if too low, or 0 if correct. Find the hidden integer with O(log n) calls. The example's hidden field configures the judge and is not accessible to your function.",
    ["1 <= n <= 2^31-1; hidden is in [1,n]."],
    [
      "Maintain inclusive feasible bounds and interpret the oracle's direction correctly.",
      "Use an overflow-safe midpoint and do not inspect judge-only hidden state.",
    ],
    [{ n: 20, hidden: 13 }, 13],
    [{ n: 1, hidden: 1 }, 1],
  ),
  sqrtx: q(
    "Return floor(sqrt(x)) for a nonnegative integer x, without using square-root or fractional-power library functions.",
    ["0 <= x <= 2^31-1."],
    [
      "Find the largest integer r satisfying r*r <= x.",
      "Avoid overflow in the comparison and handle zero and one explicitly.",
    ],
    [{ x: 26 }, 5],
    [{ x: 0 }, 0],
  ),
  "capacity-to-ship-packages-within-d-days": q(
    "Packages must ship in their given order. Each day, load a consecutive remaining prefix with total weight <= a fixed integer capacity. Return the minimum capacity that finishes within days days.",
    ["1 <= days <= weights.length <= 50,000; 1 <= weights[i] <= 500."],
    [
      "Capacity feasibility is monotonic and greedily filling each day minimizes days used.",
      "Search from the largest weight to total weight; no package may be split or reordered.",
    ],
    [{ weights: [3, 2, 2, 4, 1, 4], days: 3 }, 6],
    [{ weights: [5, 2], days: 2 }, 5],
  ),
  "search-in-rotated-sorted-array-ii": q(
    "A nondecreasing array may have been rotated. Return whether target appears; duplicate values are allowed. Explain both typical and worst-case complexity.",
    ["1 <= nums.length <= 100,000; signed 32-bit values and target."],
    [
      "When equal boundaries hide the sorted half, safely discard only redundant equal endpoints.",
      "Duplicates can force linear worst-case work; do not claim guaranteed logarithmic time.",
    ],
    [{ nums: [2, 5, 6, 0, 0, 1, 2], target: 0 }, true],
    [{ nums: [1, 1, 1], target: 2 }, false],
  ),
  "split-array-largest-sum": q(
    "Split nums into exactly k nonempty contiguous pieces. Minimize the largest piece sum and return it.",
    ["1 <= k <= nums.length <= 1,000; 0 <= nums[i] <= 1,000,000."],
    [
      "For a proposed bound, greedily count the minimum pieces needed.",
      "Nonnegative values permit splitting further without raising the bound, so <=k pieces establishes feasibility.",
    ],
    [{ nums: [7, 2, 5, 10, 8], k: 2 }, 18],
    [{ nums: [0, 0, 0], k: 2 }, 0],
  ),
  "find-in-mountain-array": q(
    "A MountainArray API exposes length() and get(i). Values strictly increase to one interior peak then strictly decrease. Return the smallest index containing target, or -1. The displayed values are judge data, not direct array access. Use at most 100 get calls.",
    [
      "3 <= length <= 10,000; one peak at an index from 1 to n-2; signed 32-bit values and target.",
    ],
    [
      "Binary search the peak, then the increasing side before the decreasing side to prefer the smaller index.",
      "Cache API reads and respect the get-call budget; do not scan the full array.",
    ],
    [{ values: [1, 4, 7, 9, 6, 4, 2], target: 4 }, 1],
    [{ values: [1, 3, 2], target: 5 }, -1],
  ),
  "add-binary": q(
    "Add two nonnegative binary strings and return their normalized binary sum without parsing either complete string into a built-in numeric type.",
    [
      "1 <= a.length,b.length <= 10,000; only '0'/'1'; no leading zeroes except '0'.",
    ],
    [
      "Process from right to left with a carry and include a final carry.",
      "Unequal lengths behave as zero-padded on the left.",
    ],
    [{ a: "1011", b: "110" }, "10001"],
    [{ a: "0", b: "0" }, "0"],
  ),
  "bitwise-and-of-numbers-range": q(
    "Return the bitwise AND of every integer in the inclusive range [left,right]. Avoid iterating through the entire range.",
    ["0 <= left <= right <= 2^31-1."],
    [
      "Only the common binary prefix of the endpoints survives.",
      "Shift endpoints until equal or repeatedly clear right's lowest set bit until within range.",
    ],
    [{ left: 10, right: 13 }, 8],
    [{ left: 0, right: 2147483647 }, 0],
  ),
  "minimum-array-end": q(
    "Construct n strictly increasing positive integers whose bitwise AND equals x. Return the smallest possible final element; the full array need not be returned.",
    ["1 <= n,x <= 100,000,000; use 64-bit arithmetic for the result."],
    [
      "Every element must retain all set bits of x.",
      "Place the bits of n-1 into zero-bit positions of x to enumerate the smallest valid supersets; do not truncate to 32 bits.",
    ],
    [{ n: 3, x: 4 }, 6],
    [{ n: 2, x: 7 }, 15],
  ),
};
