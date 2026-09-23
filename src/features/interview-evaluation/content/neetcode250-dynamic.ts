import { draft as q } from "./define";

export const extendedDynamicQuestions = {
  "lemonade-change": q(
    "Customers arrive in order, each buying one item costing 5 and paying with a bill of 5, 10 or 20. Start with no money and use previously received bills to return exact change immediately. Return whether every customer can be served.",
    ["0 <= bills.length <= 100,000; bills are 5, 10 or 20."],
    [
      "For a 20 bill prefer giving a 10 and a 5 when possible, saving 5 bills.",
      "Every transaction must have sufficient change at its own time; future receipts are unavailable.",
    ],
    [{ bills: [5, 5, 5, 10, 20] }, true],
    [{ bills: [5, 5, 10, 10, 20] }, false],
  ),
  "maximum-sum-circular-subarray": q(
    "Return the largest sum of a nonempty contiguous segment in a circular array. A segment may wrap from the end to the start but may use each array position at most once.",
    ["1 <= nums.length <= 30,000; -30,000 <= nums[i] <= 30,000."],
    [
      "Compare ordinary maximum subarray with total minus minimum subarray.",
      "When the minimum covers the whole array, its complement is empty and forbidden; handle all-negative arrays.",
    ],
    [{ nums: [5, -3, 5] }, 10],
    [{ nums: [-3, -2, -5] }, -2],
  ),
  "longest-turbulent-subarray": q(
    "Return the maximum length of a contiguous subarray in which comparisons between consecutive values strictly alternate between less-than and greater-than. Single elements qualify; equal adjacent values break turbulence.",
    ["1 <= arr.length <= 40,000; integer values."],
    [
      "Track alternating comparison direction or separate up/down lengths.",
      "On equality reset to length one, and on a repeated direction restart from the latest pair.",
    ],
    [{ arr: [9, 4, 2, 10, 7, 8, 8, 1, 9] }, 5],
    [{ arr: [2, 2, 2] }, 1],
  ),
  "jump-game-vii": q(
    "Start at index 0 of a binary string. From i, jump to any j in [i+minJump,i+maxJump] within the string only if s[j]='0'. Return whether the final index is reachable.",
    ["2 <= s.length <= 100,000; s[0]='0'; 1 <= minJump <= maxJump < s.length."],
    [
      "A position is reachable when it is zero and at least one reachable predecessor lies in the permitted window.",
      "Maintain a sliding count or monotonic exploration frontier to avoid quadratic rescanning.",
    ],
    [{ s: "011010", minJump: 2, maxJump: 3 }, true],
    [{ s: "01101110", minJump: 2, maxJump: 3 }, false],
  ),
  "dota2-senate": q(
    "Senators act cyclically in string order, where 'R' belongs to Radiant and 'D' to Dire. On a turn an active senator permanently bans one active opponent; banned senators skip future turns. Both parties play optimally to secure victory. Return 'Radiant' or 'Dire' when only one party remains.",
    ["1 <= senate.length <= 10,000; only R and D."],
    [
      "Queues of upcoming turn indices model the earliest active senator banning the opponent's earliest turn.",
      "The surviving senator returns at index+n; do not keep already banned turns.",
    ],
    [{ senate: "RDD" }, "Dire"],
    [{ senate: "RRD" }, "Radiant"],
  ),
  candy: q(
    "Give at least one candy to every child in line. A child with a strictly greater rating than an adjacent child must receive more candies than that neighbor. Return the minimum total number of candies.",
    ["1 <= ratings.length <= 20,000; 0 <= ratings[i] <= 20,000."],
    [
      "Constraints from both left and right must hold simultaneously.",
      "Equal ratings impose no ordering; two directional passes combine by maximum rather than addition.",
    ],
    [{ ratings: [1, 0, 2] }, 5],
    [{ ratings: [1, 2, 2] }, 4],
  ),
  "excel-sheet-column-title": q(
    "Convert a positive integer to a spreadsheet column title: 1 is A, 26 is Z, 27 is AA, and so on.",
    ["1 <= columnNumber <= 2^31-1."],
    [
      "This is bijective base 26 with digits 1..26, not ordinary base 26 with zero.",
      "Subtract one before taking each remainder and reverse the generated digits.",
    ],
    [{ columnNumber: 52 }, "AZ"],
    [{ columnNumber: 703 }, "AAA"],
  ),
  "greatest-common-divisor-of-strings": q(
    "A nonempty string x divides a string s when repeating x a positive number of times produces s. Return the longest string dividing both str1 and str2, or an empty string if no such string exists.",
    ["1 <= each string length <= 1,000; uppercase English letters."],
    [
      "A common repeated base exists only when str1+str2 equals str2+str1.",
      "When compatible, the answer length is gcd of the two lengths.",
    ],
    [{ str1: "ABABAB", str2: "ABAB" }, "AB"],
    [{ str1: "ABC", str2: "ABD" }, ""],
  ),
  "insert-greatest-common-divisors-in-linked-list": q(
    "For each adjacent pair of original nodes in a singly linked list, insert a new node containing their greatest common divisor. Return the head; examples encode linked nodes as arrays.",
    ["1 <= nodes <= 5,000; 1 <= value <= 1,000."],
    [
      "Advance to the next original node after inserting, not to the new node.",
      "Use Euclid's algorithm and preserve all original nodes and their order.",
    ],
    [{ head: [18, 6, 10, 3] }, [18, 6, 6, 2, 10, 1, 3]],
    [{ head: [7] }, [7]],
  ),
  "transpose-matrix": q(
    "Transpose a rectangular matrix by swapping row and column coordinates. Return a new matrix; the input need not be square.",
    ["1 <= rows,columns <= 1,000; rows*columns <= 100,000; integer entries."],
    [
      "Output has columns rows and rows columns.",
      "Set output[c][r]=input[r][c] without aliasing output rows.",
    ],
    [
      {
        matrix: [
          [1, 2, 3],
          [4, 5, 6],
        ],
      },
      [
        [1, 4],
        [2, 5],
        [3, 6],
      ],
    ],
    [{ matrix: [[9]] }, [[9]]],
  ),
  "roman-to-integer": q(
    "Convert a valid standard Roman numeral to an integer. Symbols I,V,X,L,C,D,M mean 1,5,10,50,100,500,1000. Subtractive pairs are IV,IX,XL,XC,CD,CM.",
    [
      "Input is a valid canonical numeral representing an integer from 1 to 3,999.",
    ],
    [
      "A symbol smaller than the following symbol is subtracted; otherwise it is added.",
      "Process the final symbol as an addition; input validation is outside this contract.",
    ],
    [{ s: "MCMXCIV" }, 1994],
    [{ s: "LVIII" }, 58],
  ),
  "n-th-tribonacci-number": q(
    "Return Tn where T0=0, T1=1, T2=1, and Ti=Ti-1+Ti-2+Ti-3 for i>=3.",
    ["0 <= n <= 37."],
    [
      "Handle each initial term before applying the recurrence.",
      "Three rolling values suffice for O(n) time and O(1) auxiliary space.",
    ],
    [{ n: 4 }, 4],
    [{ n: 0 }, 0],
  ),
  "combination-sum-iv": q(
    "Count ordered sequences of numbers from nums whose sum is target. Values may be reused; different orders count separately. For target zero, the empty sequence counts once.",
    [
      "1 <= nums.length <= 200; distinct positive integers <= 1,000; 0 <= target <= 1,000; answer fits signed 32-bit.",
    ],
    [
      "Build each total by choosing its last element; dp[0]=1.",
      "Loop over totals before choices to count order; positivity prevents cyclic recurrences.",
    ],
    [{ nums: [1, 2, 3], target: 4 }, 7],
    [{ nums: [2], target: 3 }, 0],
  ),
  "perfect-squares": q(
    "Return the minimum number of positive perfect-square integers whose sum is n. Squares can be reused.",
    ["1 <= n <= 10,000."],
    [
      "Consider every square <= the current remaining total.",
      "Minimum-count DP, BFS or a justified number-theoretic solution must establish optimality, not merely choose the largest square greedily.",
    ],
    [{ n: 12 }, 3],
    [{ n: 13 }, 2],
  ),
  "integer-break": q(
    "Split n into at least two positive integers and maximize their product. Return the maximum product; the summands can repeat.",
    ["2 <= n <= 58; result fits signed 32-bit."],
    [
      "At least one split is mandatory even when an unsplit value would be larger.",
      "DP must distinguish keeping a part whole from splitting it; a greedy proof explains the role of 3 and remainder 1.",
    ],
    [{ n: 10 }, 36],
    [{ n: 2 }, 1],
  ),
  "stone-game-iii": q(
    "Alice and Bob alternately take the next one, two or three stones from the front of stoneValue, adding taken values to their own score. Alice starts, all stones are eventually taken, and both optimize their score difference. Return 'Alice', 'Bob' or 'Tie'.",
    ["1 <= stoneValue.length <= 50,000; -1,000 <= each value <= 1,000."],
    [
      "At suffix i maximize taken sum minus the opponent's best suffix difference.",
      "Negative stones cannot be skipped; use zero only for the empty suffix, not as a permitted pass.",
    ],
    [{ stoneValue: [1, 2, 3, 7] }, "Bob"],
    [{ stoneValue: [1, 2, 3, 6] }, "Tie"],
  ),
  "extra-characters-in-a-string": q(
    "Cover disjoint contiguous pieces of s with dictionary words, leaving uncovered characters as extra. Return the minimum number of extra characters. Words may be reused and pieces must respect their positions in s.",
    [
      "1 <= s.length <= 50; 1 <= dictionary.length <= 50; distinct nonempty lowercase words of length <= 50.",
    ],
    [
      "At each index either pay one for an extra character or match a dictionary word at no extra cost.",
      "Trie walks or substring checks must consider all possible word endpoints; greedily taking the longest match can fail.",
    ],
    [{ s: "leetscode", dictionary: ["leet", "code", "leetcode"] }, 1],
    [{ s: "abc", dictionary: ["x"] }, 3],
  ),
  "unique-paths-ii": q(
    "Count paths from top-left to bottom-right in a rectangular obstacle grid, moving only right or down. A cell value 1 is blocked and 0 is open. A blocked start or destination gives zero paths.",
    ["1 <= rows,columns <= 100; answer fits signed 32-bit."],
    [
      "Blocked cells contribute zero; open cells sum paths from above and left.",
      "Initialize the start condition carefully and do not propagate through an obstacle on the first row or column.",
    ],
    [
      {
        obstacleGrid: [
          [0, 0, 0],
          [0, 1, 0],
          [0, 0, 0],
        ],
      },
      2,
    ],
    [{ obstacleGrid: [[1]] }, 0],
  ),
  "minimum-path-sum": q(
    "Return the smallest sum of grid values along a path from top-left to bottom-right, moving only right or down. Include both endpoints.",
    ["1 <= rows,columns <= 200; 0 <= entries <= 200."],
    [
      "Each cell adds its value to the cheaper reachable predecessor.",
      "Missing predecessors are not zero-cost routes; handle the first row and column separately or with infinity sentinels.",
    ],
    [
      {
        grid: [
          [1, 3, 1],
          [1, 5, 1],
          [4, 2, 1],
        ],
      },
      7,
    ],
    [{ grid: [[2, 4]] }, 6],
  ),
  "last-stone-weight-ii": q(
    "Repeatedly select any two stones: equal weights both disappear, otherwise they become one stone with their absolute weight difference. Return the minimum possible final weight, with zero if none remains.",
    ["1 <= stones.length <= 30; 1 <= each weight <= 100."],
    [
      "The optimum corresponds to partitioning original weights into two groups with minimum sum difference.",
      "Use each stone once in subset-sum DP and seek a reachable sum closest to half the total.",
    ],
    [{ stones: [2, 7, 4, 1, 8, 1] }, 1],
    [{ stones: [1, 1] }, 0],
  ),
  "stone-game": q(
    "Alice and Bob alternately take one pile from either end of a row, scoring its stones. Alice starts, both play optimally, and all piles are taken. Return whether Alice finishes with strictly more stones.",
    [
      "2 <= piles.length <= 500 and even; 1 <= pile <= 500; the total is odd, so no tie is possible.",
    ],
    [
      "Interval score-difference DP models the two endpoint choices.",
      "Under the stated even-length and odd-total constraints, a parity strategy guarantees Alice a win; a justified constant answer is valid.",
    ],
    [{ piles: [5, 3, 4, 5] }, true],
    [{ piles: [1, 2] }, true],
  ),
  "stone-game-ii": q(
    "Alice and Bob alternately take the next X piles from the front, where 1 <= X <= 2*M and X cannot exceed the remaining count. Initially M=1; after a move M=max(M,X). Alice starts and both maximize their final stone total. Return Alice's optimal total.",
    ["1 <= piles.length <= 100; 1 <= each pile <= 10,000."],
    [
      "State must include both suffix index and M.",
      "The current player maximizes suffixSum minus the opponent's best next state; if all remaining piles can be taken, take them.",
    ],
    [{ piles: [2, 7, 9, 4, 4] }, 10],
    [{ piles: [1] }, 1],
  ),
};
