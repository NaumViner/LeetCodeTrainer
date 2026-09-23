import { draft as q } from "./define";

export const extendedGraphQuestions = {
  "path-with-minimum-effort": q(
    "Move from the top-left to bottom-right of a height grid using four-directional steps. A path's effort is the largest absolute height difference between consecutive cells. Return the minimum possible effort.",
    ["1 <= rows,columns <= 100; 1 <= heights[r][c] <= 1,000,000."],
    [
      "Path extension combines cost by maximum, not sum.",
      "Dijkstra with minimax relaxation or threshold connectivity yields the optimum.",
    ],
    [
      {
        heights: [
          [1, 2, 2],
          [3, 8, 2],
          [5, 3, 5],
        ],
      },
      2,
    ],
    [{ heights: [[9]] }, 0],
  ),
  "find-critical-and-pseudo-critical-edges-in-minimum-spanning-tree": q(
    "A connected undirected weighted graph has vertices 0 through n-1 and edges [u,v,weight]. Return [critical,pseudoCritical] containing original edge indices, in any order. Critical edges occur in every minimum spanning tree. Pseudo-critical edges occur in some but not every minimum spanning tree; lists are disjoint.",
    [
      "2 <= n <= 100; n-1 <= edges.length <= 200; positive weights; no self-loops or repeated endpoint pairs.",
    ],
    [
      "Excluding a critical edge increases optimum weight or disconnects the graph.",
      "A noncritical edge is pseudo-critical if forcing it still permits the baseline optimum; preserve original indices when sorting.",
    ],
    [
      {
        n: 3,
        edges: [
          [0, 1, 1],
          [1, 2, 1],
          [0, 2, 1],
        ],
      },
      [[], [0, 1, 2]],
    ],
    [
      {
        n: 3,
        edges: [
          [0, 1, 1],
          [1, 2, 2],
          [0, 2, 4],
        ],
      },
      [[0, 1], []],
    ],
  ),
  "build-a-matrix-with-conditions": q(
    "Place each integer 1..k exactly once in a k-by-k matrix, with all other entries zero. Each row condition [a,b] requires a strictly above b; each column condition [a,b] requires a strictly left of b. Return any valid matrix, or [] if impossible.",
    [
      "2 <= k <= 400; at most 10,000 conditions per axis; endpoints in 1..k and distinct within a pair; repeated conditions may occur.",
    ],
    [
      "The two axes admit independent topological orders.",
      "A cycle on either axis makes the whole instance impossible; repeated edges must not corrupt indegree counts.",
    ],
    [
      {
        k: 3,
        rowConditions: [
          [1, 2],
          [3, 2],
        ],
        colConditions: [
          [2, 1],
          [3, 2],
        ],
      },
      [
        [0, 0, 1],
        [3, 0, 0],
        [0, 2, 0],
      ],
    ],
    [
      {
        k: 2,
        rowConditions: [
          [1, 2],
          [2, 1],
        ],
        colConditions: [],
      },
      [],
    ],
  ),
  "greatest-common-divisor-traversal": q(
    "Treat every array index as a vertex. Two distinct indices are connected when their values have a greatest common divisor greater than one. Return whether every vertex can reach every other vertex through such connections.",
    ["1 <= nums.length <= 100,000; 1 <= nums[i] <= 100,000."],
    [
      "Shared prime factors can unite indices without constructing every pairwise edge.",
      "A single vertex is connected even for value 1; any value 1 isolates its vertex in a larger input.",
    ],
    [{ nums: [6, 10, 15] }, true],
    [{ nums: [2, 3] }, false],
  ),
  "island-perimeter": q(
    "A rectangular binary grid contains exactly one four-connected land island, no enclosed water lakes, and water outside the grid. Return the island's perimeter, counting land sides adjacent to water or the outer boundary.",
    ["1 <= rows,columns <= 100; cells are 0 or 1; at least one land cell."],
    [
      "Each land cell contributes four sides minus its land adjacencies.",
      "A shared edge removes two sides when counting each neighbor pair once.",
    ],
    [
      {
        grid: [
          [1, 1],
          [1, 0],
        ],
      },
      8,
    ],
    [{ grid: [[1]] }, 4],
  ),
  "verifying-an-alien-dictionary": q(
    "Given words and a permutation order of all 26 lowercase English letters, determine whether the words are in nondecreasing lexicographic order according to that alphabet. A proper prefix sorts before its longer extension.",
    ["1 <= words.length <= 100; 1 <= word length <= 100; lowercase letters."],
    [
      "Only the first differing character determines the order of an adjacent pair.",
      "If no differing character exists, compare lengths; a longer word cannot precede its prefix.",
    ],
    [{ words: ["app", "apple"], order: "abcdefghijklmnopqrstuvwxyz" }, true],
    [{ words: ["abc", "ab"], order: "abcdefghijklmnopqrstuvwxyz" }, false],
  ),
  "find-the-town-judge": q(
    "There are n people labeled 1..n. trust contains directed pairs [a,b] meaning a trusts b. A judge trusts nobody and is trusted by all other people. Return the judge's label, or -1 if none exists.",
    [
      "1 <= n <= 1,000; distinct trust pairs, no self-trust; at most 10,000 pairs.",
    ],
    [
      "The candidate needs indegree n-1 and outdegree zero.",
      "For n=1 with no trust pairs the only person is the judge.",
    ],
    [
      {
        n: 3,
        trust: [
          [1, 3],
          [2, 3],
        ],
      },
      3,
    ],
    [{ n: 2, trust: [] }, -1],
  ),
  "open-the-lock": q(
    "A four-wheel decimal lock starts at '0000'. A move turns one wheel one step up or down with wraparound. Deadend strings cannot be occupied, including the start. Return the fewest moves to target, or -1 if unreachable.",
    [
      "0 <= deadends.length <= 10,000; all strings, including target, contain exactly four digits.",
    ],
    [
      "Breadth-first search visits states in increasing move distance.",
      "Reject a blocked start before accepting target=start; mark states when enqueued.",
    ],
    [{ deadends: [], target: "0009" }, 1],
    [{ deadends: ["0000"], target: "0000" }, -1],
  ),
  "course-schedule-iv": q(
    "Courses are 0..numCourses-1. Each prerequisite [a,b] means a must precede b. For each query [u,v], return whether u is a direct or indirect prerequisite of v, preserving query order.",
    [
      "2 <= numCourses <= 100; the prerequisite graph is acyclic; query endpoints are distinct; at most 10,000 queries.",
    ],
    [
      "Compute transitive reachability, not just direct adjacency.",
      "Respect edge direction; shared descendants do not make courses prerequisites of each other.",
    ],
    [
      {
        numCourses: 3,
        prerequisites: [
          [0, 1],
          [1, 2],
        ],
        queries: [
          [0, 2],
          [2, 0],
          [0, 1],
        ],
      },
      [true, false, true],
    ],
    [{ numCourses: 2, prerequisites: [], queries: [[0, 1]] }, [false]],
  ),
  "accounts-merge": q(
    "Each account is [name,email1,...]. Merge accounts sharing an email directly or transitively. Same names alone do not imply the same person. Return each component as [name,...uniqueEmails], emails sorted lexicographically; component order is arbitrary. All accounts in one component have the same name.",
    [
      "1 <= accounts.length <= 1,000; 1 to 9 emails per account; nonempty ASCII names and emails.",
    ],
    [
      "Use shared email connectivity and deduplicate repeated addresses.",
      "Keep unrelated people with identical names separate; names are labels, not union keys.",
    ],
    [
      {
        accounts: [
          ["A", "b@x", "a@x"],
          ["A", "b@x", "c@x"],
          ["A", "z@x"],
        ],
      },
      [
        ["A", "a@x", "b@x", "c@x"],
        ["A", "z@x"],
      ],
    ],
    [{ accounts: [["B", "b@x"]] }, [["B", "b@x"]]],
  ),
  "evaluate-division": q(
    "equations[i]=[a,b] with values[i] states a/b=values[i]. For each query [c,d], return c/d or -1 if it cannot be inferred. Unknown variables, including an unknown divided by itself, give -1. Answers are accepted within 1e-5 relative or absolute tolerance.",
    [
      "1 <= equations.length <= 20; positive finite ratios; consistent equations; at most 20 queries.",
    ],
    [
      "Use reciprocal directed edges and multiply ratios along paths.",
      "Known x/x is 1; distinguish unknown vertices from disconnected known vertices.",
    ],
    [
      {
        equations: [
          ["a", "b"],
          ["b", "c"],
        ],
        values: [2, 3],
        queries: [
          ["a", "c"],
          ["c", "a"],
          ["x", "x"],
        ],
      },
      [6, 1 / 6, -1],
    ],
    [
      {
        equations: [["x", "y"]],
        values: [4],
        queries: [
          ["x", "x"],
          ["y", "x"],
        ],
      },
      [1, 0.25],
    ],
  ),
  "minimum-height-trees": q(
    "An undirected tree has n vertices labeled 0..n-1. Return all roots that minimize the rooted tree's height, measured in edges from root to its farthest vertex. Root order does not matter.",
    [
      "1 <= n <= 20,000; edges describe a connected acyclic graph with n-1 edges.",
    ],
    [
      "Repeatedly remove all current leaves together until at most two centers remain.",
      "Handle the single-vertex tree and do not confuse graph centers with arbitrary high-degree vertices.",
    ],
    [
      {
        n: 4,
        edges: [
          [0, 1],
          [1, 2],
          [2, 3],
        ],
      },
      [1, 2],
    ],
    [{ n: 1, edges: [] }, [0]],
  ),
  "sum-of-all-subset-xor-totals": q(
    "For every subset of array positions, XOR its chosen values, using zero for the empty subset. Return the sum of all subset XORs. Equal values at different indices remain distinct choices.",
    ["1 <= nums.length <= 12; 0 <= nums[i] <= 20."],
    [
      "Each index branches into include/exclude choices exactly once.",
      "Duplicate values must not collapse distinct index subsets.",
    ],
    [{ nums: [1, 3] }, 6],
    [{ nums: [2, 2] }, 4],
  ),
  combinations: q(
    "Return all size-k subsets of integers 1..n. Each combination must be increasing; the order of combinations is arbitrary.",
    ["1 <= k <= n <= 20."],
    [
      "Choose subsequent values strictly after the last chosen value.",
      "Emit only size-k choices and prune when too few numbers remain.",
    ],
    [
      { n: 4, k: 2 },
      [
        [1, 2],
        [1, 3],
        [1, 4],
        [2, 3],
        [2, 4],
        [3, 4],
      ],
    ],
    [{ n: 1, k: 1 }, [[1]]],
  ),
  "permutations-ii": q(
    "Return every distinct permutation of nums. Values may repeat; each distinct value sequence must appear once. Result order is arbitrary.",
    ["1 <= nums.length <= 8; -10 <= nums[i] <= 10."],
    [
      "Track remaining multiplicities or skip duplicate siblings after sorting.",
      "A repeated value remains usable according to its count; do not erase all copies with a global used-value set.",
    ],
    [
      { nums: [1, 1, 2] },
      [
        [1, 1, 2],
        [1, 2, 1],
        [2, 1, 1],
      ],
    ],
    [{ nums: [0] }, [[0]]],
  ),
  "matchsticks-to-square": q(
    "Decide whether all matchsticks can form four equal-length sides of a square. Every stick must be used exactly once, and sticks may not be broken.",
    ["1 <= matchsticks.length <= 15; 1 <= each length <= 100,000,000."],
    [
      "Total length must be divisible by four, and no stick may exceed the target side.",
      "Backtracking assigns every stick to exactly one side; prune symmetric equal side totals.",
    ],
    [{ matchsticks: [1, 1, 2, 2, 2] }, true],
    [{ matchsticks: [3, 3, 3, 3, 4] }, false],
  ),
  "partition-to-k-equal-sum-subsets": q(
    "Decide whether nums can be partitioned into k nonempty groups of equal sum. Each array occurrence must be assigned to exactly one group.",
    ["1 <= k <= nums.length <= 16; 1 <= nums[i] <= 10,000."],
    [
      "Divisibility and the largest value provide early impossibility checks.",
      "Track used occurrences and avoid duplicate bucket states; positive values ensure filled target groups are nonempty.",
    ],
    [{ nums: [4, 3, 2, 3, 5, 2, 1], k: 4 }, true],
    [{ nums: [1, 2, 3, 4], k: 3 }, false],
  ),
  "n-queens-ii": q(
    "Count ways to place n queens on an n-by-n chessboard so no two share a row, column or diagonal. Rotations and reflections count as separate arrangements.",
    ["1 <= n <= 9."],
    [
      "Place one queen per row and track occupied columns and both diagonal families.",
      "Undo every occupied-state change when returning from a branch.",
    ],
    [{ n: 4 }, 2],
    [{ n: 1 }, 1],
  ),
  "word-break-ii": q(
    "Return every sentence obtained by splitting s into one or more words from wordDict. Join words with one space; reuse is allowed. Each distinct sentence appears once, in any order. Return [] if impossible.",
    [
      "1 <= s.length <= 20; at most 1,000 distinct nonempty lowercase dictionary words; total output length <= 100,000.",
    ],
    [
      "Explore only dictionary prefixes and preserve the original character order.",
      "Memoize suffix results or feasibility without discarding alternative valid sentences.",
    ],
    [
      { s: "catsanddog", wordDict: ["cat", "cats", "and", "sand", "dog"] },
      ["cat sand dog", "cats and dog"],
    ],
    [{ s: "abc", wordDict: ["a", "b"] }, []],
  ),
};
