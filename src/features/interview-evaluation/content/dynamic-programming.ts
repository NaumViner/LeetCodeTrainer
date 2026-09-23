import { draft as q } from "./define";

export const dynamicQuestions = {
  "min-cost-climbing-stairs": q(
    "Each stair has a nonnegative cost paid when leaving it. You may start on stair 0 or stair 1 and move up one or two positions each time. Return the minimum cost to reach the top at index cost.length.",
    ["2 <= cost.length <= 100,000; 0 <= cost[i] <= 1,000."],
    [
      "Minimum cost to reach a position depends on the two preceding positions plus their leaving costs.",
      "Starting at stair 1 is allowed and the top has no cost; O(n) time and O(1) state suffice.",
    ],
    [{ cost: [4, 9, 3, 1] }, 7],
    [{ cost: [10, 2] }, 2],
  ),
  "house-robber": q(
    "Choose a subset of houses along a street maximizing the sum of their nonnegative values, without choosing adjacent houses. Return that maximum; choosing none is allowed.",
    ["0 <= nums.length <= 100,000; 0 <= nums[i] <= 10,000."],
    [
      "For each prefix choose between skipping its last house and taking it plus the optimum two houses earlier.",
      "Update rolling states without overwriting a value still needed.",
    ],
    [{ nums: [3, 8, 4, 9, 2] }, 17],
    [{ nums: [] }, 0],
  ),
  "house-robber-ii": q(
    "Houses lie on a circle, so the first and last are adjacent. Return the maximum total value from nonadjacent houses. A single house can be chosen.",
    ["1 <= nums.length <= 100,000; 0 <= nums[i] <= 10,000."],
    [
      "For at least two houses, solve the two linear ranges excluding either endpoint.",
      "Handle one house separately; never count both endpoints.",
    ],
    [{ nums: [4, 1, 2, 7] }, 8],
    [{ nums: [6] }, 6],
  ),
  "longest-palindromic-substring": q(
    "Return the longest contiguous palindromic substring of s. If there are several with maximum length, return the one starting earliest. Return an empty string for empty input.",
    ["0 <= s.length <= 2,000; ASCII letters and digits; case-sensitive."],
    [
      "Consider centers between characters as well as on characters.",
      "Compare matching endpoints and preserve the earliest start on ties; O(n^2) is acceptable.",
    ],
    [{ s: "cabbad" }, "abba"],
    [{ s: "abc" }, "a"],
  ),
  "palindromic-substrings": q(
    "Count all nonempty contiguous substrings that are palindromes. Equal text at different positions counts separately.",
    ["0 <= s.length <= 2,000; lowercase English letters."],
    [
      "Each odd and even center expands to enumerate palindromes exactly once.",
      "Count occurrences rather than distinct strings.",
    ],
    [{ s: "aaaa" }, 10],
    [{ s: "ab" }, 2],
  ),
  "decode-ways": q(
    "Map decimal strings '1' through '26' to letters A through Z. Return how many ways s can be split into valid codes. A code cannot start with zero; a standalone zero is invalid.",
    [
      "1 <= s.length <= 100; digits only; the answer fits a signed 32-bit integer.",
    ],
    [
      "A nonzero digit contributes the next suffix count; a two-digit number from 10 through 26 contributes the second-next suffix count.",
      "Zero handling must reject 06 while allowing 10 and 20.",
    ],
    [{ s: "121" }, 3],
    [{ s: "100" }, 0],
  ),
  "coin-change": q(
    "Using unlimited coins of each supplied denomination, return the fewest coins totaling amount, or -1 if impossible. Zero amount needs zero coins.",
    [
      "1 <= coins.length <= 20; denominations are distinct integers from 1 to 10,000; 0 <= amount <= 10,000.",
    ],
    [
      "dp[0]=0 and unreachable amounts stay unreachable until a valid predecessor exists.",
      "Greedily choosing the largest denomination is not generally correct.",
    ],
    [{ coins: [1, 3, 4], amount: 6 }, 2],
    [{ coins: [4, 6], amount: 7 }, -1],
  ),
  "maximum-product-subarray": q(
    "Return the largest product of any nonempty contiguous subarray.",
    [
      "1 <= nums.length <= 20,000; -10 <= nums[i] <= 10; every contiguous product fits a signed 32-bit integer.",
    ],
    [
      "Track both minimum and maximum products ending here because a negative multiplier swaps their roles.",
      "Zero can reset a run; the best answer may be a single negative element.",
    ],
    [{ nums: [-2, 3, -4] }, 24],
    [{ nums: [-3] }, -3],
  ),
  "word-break": q(
    "Return whether s can be segmented into one or more dictionary words, reusing words as needed. For this task an empty s is also segmentable.",
    [
      "0 <= s.length <= 300; 1 <= wordDict.length <= 1,000; distinct nonempty words of at most 20 lowercase letters; s is lowercase.",
    ],
    [
      "A prefix is reachable only via a reachable earlier boundary and a complete dictionary word.",
      "Reuse is allowed; memoize positions to avoid exponential repeated suffix searches.",
    ],
    [{ s: "redbluered", wordDict: ["red", "blue"] }, true],
    [{ s: "redgreen", wordDict: ["red", "blue"] }, false],
  ),
  "longest-increasing-subsequence": q(
    "Return the length of the longest strictly increasing subsequence of nums. A subsequence preserves index order but need not be contiguous. Aim for O(n log n) time.",
    ["0 <= nums.length <= 100,000; values fit signed 32-bit integers."],
    [
      "Maintain the smallest possible tail for each achievable length and replace the first tail >= the new value.",
      "Equal values must not increase length; tails are not necessarily an actual chosen subsequence.",
    ],
    [{ nums: [5, 1, 4, 2, 3, 8] }, 4],
    [{ nums: [2, 2, 2] }, 1],
  ),
  "partition-equal-subset-sum": q(
    "Return whether every element of nums can be assigned to one of two subsets with equal sums. Each occurrence must belong to exactly one subset.",
    ["1 <= nums.length <= 200; 1 <= nums[i] <= 100."],
    [
      "Odd total sums cannot be split equally; otherwise test reachability of half the total.",
      "Update a one-dimensional DP backward so an element cannot be reused.",
    ],
    [{ nums: [2, 3, 5, 6] }, true],
    [{ nums: [1, 2, 4] }, false],
  ),
  "longest-common-subsequence": q(
    "Return the length of a longest sequence appearing in both text1 and text2 after deleting zero or more characters without changing the order of those remaining.",
    ["0 <= text1.length, text2.length <= 1,000; lowercase English letters."],
    [
      "Matching characters extend the diagonal subproblem; mismatches choose the best of skipping from either string.",
      "A subsequence is not required to be contiguous; empty prefixes have length zero.",
    ],
    [{ text1: "axbyc", text2: "abc" }, 3],
    [{ text1: "abc", text2: "def" }, 0],
  ),
  "best-time-to-buy-and-sell-stock-with-cooldown": q(
    "You may buy and sell one share repeatedly, holding at most one at a time. After a sale, the following day is a cooldown when buying is forbidden. Return the largest profit; choosing no transaction is allowed.",
    ["0 <= prices.length <= 100,000; 0 <= prices[i] <= 10,000."],
    [
      "Keep distinct holding, just-sold and buy-eligible states with previous-day transitions.",
      "Do not buy using yesterday's sold state; realize profit only from legal completed transactions.",
    ],
    [{ prices: [1, 2, 3, 0, 2] }, 3],
    [{ prices: [5, 3, 1] }, 0],
  ),
  "coin-change-ii": q(
    "Return the number of distinct combinations of unlimited coins totaling amount. Denomination order does not matter. There is one combination for zero amount: use no coins.",
    [
      "0 <= amount <= 5,000; 1 <= coins.length <= 300; distinct positive denominations <= 5,000; answer fits signed 32-bit.",
    ],
    [
      "Iterate denominations outside the amount loop to count combinations, not permutations.",
      "Forward amount iteration allows reusing the current denomination.",
    ],
    [{ amount: 6, coins: [1, 3, 4] }, 4],
    [{ amount: 0, coins: [2] }, 1],
  ),
  "target-sum": q(
    "Place a plus or minus sign before every element, then add the signed values. Return the number of sign assignments yielding target. Different assignments at zero-valued positions count separately.",
    [
      "0 <= nums.length <= 20; 0 <= nums[i] <= 1,000; sum(nums) <= 1,000; |target| <= 1,000.",
    ],
    [
      "State includes the processed index and accumulated sum, retaining counts rather than only reachability.",
      "Each zero doubles compatible assignments; subset-sum reductions must check parity and bounds.",
    ],
    [{ nums: [1, 2, 1], target: 2 }, 2],
    [{ nums: [0, 0, 1], target: 1 }, 4],
  ),
  "interleaving-string": q(
    "Return whether s3 can be formed by interleaving all characters of s1 and s2, preserving the order within each source. Either source can contribute consecutive characters.",
    [
      "0 <= s1.length, s2.length <= 100; 0 <= s3.length <= 200; lowercase English letters.",
    ],
    [
      "The consumed s3 index equals the sum of consumed source indices.",
      "When both next source characters match, either path may work; greedy selection alone is insufficient.",
    ],
    [{ s1: "ab", s2: "cd", s3: "acbd" }, true],
    [{ s1: "ab", s2: "cd", s3: "adbc" }, false],
  ),
  "longest-increasing-path-in-a-matrix": q(
    "Return the maximum number of cells in a strictly increasing path through a matrix, moving only up, down, left or right. You may start at any cell.",
    ["1 <= rows, columns <= 200; values fit signed 32-bit integers."],
    [
      "Strict increases create an acyclic dependency graph; memoize the best length from each cell.",
      "Equal adjacent values cannot extend a path; target O(rows*columns).",
    ],
    [
      {
        matrix: [
          [1, 2],
          [4, 3],
        ],
      },
      4,
    ],
    [
      {
        matrix: [
          [5, 5],
          [5, 5],
        ],
      },
      1,
    ],
  ),
  "distinct-subsequences": q(
    "Count the ways to delete characters from s so the remaining sequence equals t. Different choices of source indices count separately. An empty target has one match.",
    [
      "0 <= s.length, t.length <= 1,000; ASCII letters; answer fits signed 32-bit.",
    ],
    [
      "Always allow skipping a source character; if it matches, also count using it.",
      "A one-dimensional update must run backward to avoid using the same source position twice.",
    ],
    [{ s: "babag", t: "bag" }, 3],
    [{ s: "abc", t: "" }, 1],
  ),
  "edit-distance": q(
    "Return the minimum number of single-character insertions, deletions and replacements needed to change word1 into word2. Each operation costs one.",
    ["0 <= word1.length, word2.length <= 500; lowercase English letters."],
    [
      "Empty-prefix distances equal the other prefix length.",
      "Equal characters use the diagonal unchanged; otherwise choose one plus the best of three operations.",
    ],
    [{ word1: "cat", word2: "cut" }, 1],
    [{ word1: "", word2: "code" }, 4],
  ),
  "burst-balloons": q(
    "Balloons have values nums. Bursting one earns its value times its nearest remaining left and right neighbors, treating a missing neighbor as 1. Return the maximum total coins from bursting all balloons.",
    ["0 <= nums.length <= 300; 0 <= nums[i] <= 100."],
    [
      "Choose the last balloon burst within an interval so the boundary neighbors stay fixed.",
      "Combine independent left/right intervals and account for sentinel ones; choosing locally largest immediate gain is unsound.",
    ],
    [{ nums: [2, 3] }, 9],
    [{ nums: [1, 5, 1] }, 15],
  ),
  "regular-expression-matching": q(
    "Return whether pattern p matches all of s. A dot matches one arbitrary character. A star means zero or more copies of the immediately preceding element (a literal or dot). No other regex operators exist. Implement matching without a regular-expression library.",
    [
      "0 <= s.length <= 100; 0 <= p.length <= 100; s uses lowercase letters; p uses lowercase letters, '.' and '*'.",
      "p is valid: no leading star and no consecutive stars.",
    ],
    [
      "For x*, branch between skipping the pair and consuming a matching character while keeping the pattern position.",
      "Match the entire text; empty suffixes and zero repetitions must work. Memoize index pairs.",
    ],
    [{ s: "aab", p: "c*a*b" }, true],
    [{ s: "ab", p: "a" }, false],
  ),
};
