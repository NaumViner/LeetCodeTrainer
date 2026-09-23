import { draft as q } from "./define";

export const searchQuestions = {
  "combination-sum": q(
    "Return all unique nondecreasing combinations of candidates summing to target. Candidate values are distinct and each may be used any number of times. Result order does not matter.",
    [
      "1 <= candidates.length <= 30; 1 <= candidates[i] <= 40; 1 <= target <= 40.",
    ],
    [
      "Keep a nondecreasing candidate index to avoid permutations of the same combination.",
      "All values are positive, so exceeding the remaining target can prune a branch.",
    ],
    [
      { candidates: [2, 5, 7], target: 9 },
      [
        [2, 2, 5],
        [2, 7],
      ],
    ],
    [{ candidates: [4], target: 3 }, []],
  ),
  "combination-sum-ii": q(
    "Return all unique nondecreasing combinations summing to target. Each input occurrence can be used at most once; input values can repeat. Do not return duplicate combinations. Result order does not matter.",
    [
      "1 <= candidates.length <= 100; 1 <= candidates[i] <= 50; 1 <= target <= 30.",
    ],
    [
      "Advance the index after choosing an occurrence.",
      "Skip equal choices at the same depth, while allowing duplicates at deeper positions.",
    ],
    [
      { candidates: [1, 1, 2, 3, 4], target: 5 },
      [
        [1, 1, 3],
        [1, 4],
        [2, 3],
      ],
    ],
    [{ candidates: [2, 2, 2], target: 4 }, [[2, 2]]],
  ),
  permutations: q(
    "Return every ordering of a list of distinct integers. Output order does not matter; each permutation uses every input element exactly once.",
    [
      "0 <= nums.length <= 8; values fit signed 32-bit integers. The empty input has one permutation: the empty list.",
    ],
    [
      "Each recursion level chooses one unused element and restores its used state on return.",
      "Produce n! results without aliasing mutable working buffers.",
    ],
    [
      { nums: [2, 5, 8] },
      [
        [2, 5, 8],
        [2, 8, 5],
        [5, 2, 8],
        [5, 8, 2],
        [8, 2, 5],
        [8, 5, 2],
      ],
    ],
    [{ nums: [] }, [[]]],
  ),
  "subsets-ii": q(
    "Return every distinct subset of nums, including the empty subset. Values may repeat; a subset can use each occurrence at most once. Order within subsets and among results does not matter.",
    ["0 <= nums.length <= 15; -10 <= nums[i] <= 10."],
    [
      "Equal input values must not generate duplicate subsets.",
      "Group multiplicities or skip equal sibling choices after sorting.",
    ],
    [{ nums: [1, 1, 3] }, [[], [1], [1, 1], [3], [1, 3], [1, 1, 3]]],
    [{ nums: [] }, [[]]],
  ),
  "generate-parentheses": q(
    "Return all valid strings of exactly n matched pairs of round parentheses. A valid string never closes more pairs than it has opened at any prefix. Result order does not matter.",
    ["0 <= n <= 8; n=0 produces one empty string."],
    [
      "Open count never exceeds n and close count never exceeds open count.",
      "Emit only when both counts equal n; no duplicates.",
    ],
    [{ n: 2 }, ["(())", "()()"]],
    [{ n: 0 }, [""]],
  ),
  "word-search": q(
    "Return whether word can be traced on a rectangular letter board by moving up, down, left or right. A cell may appear at most once in the trace. The board must be restored before returning.",
    [
      "1 <= rows, columns <= 6; 1 <= word.length <= 15; lowercase English letters; board is displayed as strings.",
    ],
    [
      "Visited state is local to the current path and undone when backtracking.",
      "Reject mismatches before exploring neighbors; do not reuse a matching cell.",
    ],
    [{ board: ["ab", "cd"], word: "abd" }, true],
    [{ board: ["ab", "cd"], word: "aba" }, false],
  ),
  "palindrome-partitioning": q(
    "Return all partitions of s into nonempty contiguous palindromic pieces. The pieces concatenate to s in order. Result order does not matter; piece order within a partition matters.",
    [
      "0 <= s.length <= 16; lowercase English letters; empty s has one empty partition.",
    ],
    [
      "Recurse from the end of a palindromic prefix and cover every character exactly once.",
      "Do not sort pieces within a partition; precomputed palindrome checks can avoid repeated work.",
    ],
    [
      { s: "aab" },
      [
        ["a", "a", "b"],
        ["aa", "b"],
      ],
    ],
    [{ s: "" }, [[]]],
  ),
  "letter-combinations-of-a-phone-number": q(
    "Return all letter strings formed by choosing one letter per input digit on a standard phone keypad: 2=abc, 3=def, 4=ghi, 5=jkl, 6=mno, 7=pqrs, 8=tuv, 9=wxyz. Return an empty list for no digits. Result order does not matter.",
    ["0 <= digits.length <= 4; digits are 2 through 9."],
    [
      "Each output has exactly one mapped letter per digit in the same order.",
      "Digits 7 and 9 have four choices rather than three.",
    ],
    [
      { digits: "27" },
      ["ap", "aq", "ar", "as", "bp", "bq", "br", "bs", "cp", "cq", "cr", "cs"],
    ],
    [{ digits: "" }, []],
  ),
  "n-queens": q(
    "Place n queens on an n by n board so no two share a row, column or diagonal. Return every distinct board as n strings of '.' and 'Q'. Result order does not matter.",
    ["1 <= n <= 9."],
    [
      "Place one queen per row while tracking occupied columns and both diagonal indices.",
      "Undo occupancy when backtracking; reflection-equivalent boards are still distinct solutions.",
    ],
    [
      { n: 4 },
      [
        [".Q..", "...Q", "Q...", "..Q."],
        ["..Q.", "Q...", "...Q", ".Q.."],
      ],
    ],
    [{ n: 2 }, []],
  ),
  "max-area-of-island": q(
    "In a binary rectangular grid, land cells connect horizontally or vertically. Return the largest number of cells in any connected land region, or zero if there is no land.",
    ["1 <= rows, columns <= 100; cells are 0 or 1."],
    [
      "Mark each visited land cell once and reset the component size between searches.",
      "Diagonal contact does not connect islands; target O(rows*columns).",
    ],
    [
      {
        grid: [
          [1, 1, 0],
          [0, 1, 0],
          [1, 0, 1],
        ],
      },
      3,
    ],
    [{ grid: [[0, 0]] }, 0],
  ),
  "clone-graph": q(
    "Deep-copy the connected undirected graph reachable from a supplied node and return the cloned starting node. Each node has a unique integer label and a neighbors list. Display notation is an adjacency list with row i describing neighbors of label i+1; the starting node is label 1. Empty input denotes a null node. Copies must not share node identities with the input.",
    [
      "0 <= nodes <= 100; labels are 1 through n; no parallel edges or self-loops; edges are symmetric.",
    ],
    [
      "Create and memoize a clone before recursing into neighbors, so cycles terminate.",
      "Preserve each adjacency and produce a new identity for every reachable node; serialized equality alone does not prove a deep copy.",
    ],
    [
      {
        adj: [
          [2, 3],
          [1, 3],
          [1, 2],
        ],
      },
      [
        [2, 3],
        [1, 3],
        [1, 2],
      ],
    ],
    [{ adj: [[]] }, [[]]],
  ),
  "walls-and-gates": q(
    "Fill every empty room with its minimum number of orthogonal steps to any gate. Walls are -1, gates are 0, and empty rooms are 2147483647. Walls cannot be crossed; unreachable rooms remain unchanged. Modify the grid in place; examples show the final grid.",
    ["1 <= rows, columns <= 250; initial cells are only -1, 0, or 2147483647."],
    [
      "Multi-source BFS starts at all gates simultaneously.",
      "Visit a room at its shortest distance, never overwrite walls or gates; target O(rows*columns).",
    ],
    [
      {
        grid: [
          [0, 2147483647, -1],
          [2147483647, 2147483647, 2147483647],
        ],
      },
      [
        [0, 1, -1],
        [1, 2, 3],
      ],
    ],
    [{ grid: [[-1, 2147483647]] }, [[-1, 2147483647]]],
  ),
  "rotting-oranges": q(
    "Cells contain no orange (0), a fresh orange (1), or a rotten orange (2). Each minute, oranges already rotten at the start of the minute rot their orthogonally adjacent fresh neighbors. Return minutes until none are fresh, or -1 if impossible. Return zero if none start fresh.",
    ["1 <= rows, columns <= 100."],
    [
      "Start BFS from all rotten oranges and advance time by layers.",
      "Track remaining fresh oranges and distinguish unreachable cells from an empty workload.",
    ],
    [
      {
        grid: [
          [2, 1, 1],
          [0, 1, 0],
        ],
      },
      2,
    ],
    [{ grid: [[2, 0, 1]] }, -1],
  ),
  "pacific-atlantic-water-flow": q(
    "Water can move from a cell to an orthogonal neighbor of equal or lower height. The top and left edges drain to the Pacific; the bottom and right edges drain to the Atlantic. Return all [row,column] cells from which water can reach both oceans, in any order.",
    ["1 <= rows, columns <= 200; 0 <= heights[r][c] <= 100,000."],
    [
      "Search backward from ocean boundaries, moving to equal or higher cells.",
      "Intersect the two reachable sets; equal-height plateaus must work.",
    ],
    [
      {
        heights: [
          [1, 2],
          [4, 3],
        ],
      },
      [
        [0, 1],
        [1, 0],
        [1, 1],
      ],
    ],
    [{ heights: [[7]] }, [[0, 0]]],
  ),
  "surrounded-regions": q(
    "Modify a board of 'X' and 'O' so every orthogonally connected 'O' region with no connection to a boundary cell becomes 'X'. Preserve boundary-connected regions. Examples show the final board as strings.",
    ["1 <= rows, columns <= 200."],
    [
      "Mark all boundary-connected O cells before flipping anything.",
      "Diagonal connection to an edge is insufficient; restore temporary markers afterward.",
    ],
    [
      { board: ["XXXX", "XOOX", "XXXX", "XOXX"] },
      ["XXXX", "XXXX", "XXXX", "XOXX"],
    ],
    [{ board: ["OO", "OO"] }, ["OO", "OO"]],
  ),
  "course-schedule": q(
    "There are numCourses courses labeled 0 through numCourses-1. Each pair [course,prerequisite] means the prerequisite must be completed first. Return whether all courses can be completed.",
    [
      "1 <= numCourses <= 10,000; 0 <= prerequisites.length <= 50,000; pairs are distinct and indices valid.",
    ],
    [
      "Feasibility is equivalent to absence of a directed cycle.",
      "Kahn's algorithm must process every vertex, including isolated courses; DFS must distinguish visiting from finished.",
    ],
    [
      {
        numCourses: 3,
        prerequisites: [
          [1, 0],
          [2, 1],
        ],
      },
      true,
    ],
    [
      {
        numCourses: 2,
        prerequisites: [
          [1, 0],
          [0, 1],
        ],
      },
      false,
    ],
  ),
  "course-schedule-ii": q(
    "Return any ordering that completes all numCourses courses while obeying prerequisite pairs [course,prerequisite]. Return an empty list if no ordering exists. Example orderings are illustrative; any valid full ordering is accepted.",
    [
      "1 <= numCourses <= 10,000; 0 <= prerequisites.length <= 50,000; distinct pairs with valid course indices.",
    ],
    [
      "A course is emitted only after all predecessors; include isolated vertices.",
      "Cycles must produce an empty result rather than a partial ordering.",
    ],
    [
      {
        numCourses: 4,
        prerequisites: [
          [1, 0],
          [2, 0],
          [3, 1],
          [3, 2],
        ],
      },
      [0, 1, 2, 3],
    ],
    [
      {
        numCourses: 2,
        prerequisites: [
          [1, 0],
          [0, 1],
        ],
      },
      [],
    ],
  ),
  "graph-valid-tree": q(
    "Return whether an undirected graph on n labeled vertices is a tree: connected and without cycles. Vertices are 0 through n-1; each edge is listed once.",
    [
      "1 <= n <= 10,000; 0 <= edges.length <= 20,000; no self-loops or duplicate undirected edges.",
    ],
    [
      "A tree has n-1 edges and one connected component.",
      "DFS must ignore the parent edge; union-find detects edges joining already-connected vertices.",
    ],
    [
      {
        n: 4,
        edges: [
          [0, 1],
          [1, 2],
          [1, 3],
        ],
      },
      true,
    ],
    [
      {
        n: 4,
        edges: [
          [0, 1],
          [2, 3],
        ],
      },
      false,
    ],
  ),
  "number-of-connected-components-in-an-undirected-graph": q(
    "Return the number of connected components in an undirected graph with n vertices labeled 0 through n-1. Isolated vertices each count as a component.",
    [
      "0 <= n <= 10,000; 0 <= edges.length <= 20,000; no duplicate edges or self-loops.",
    ],
    [
      "Start one graph search per previously unvisited vertex or decrement a union-find count only on successful unions.",
      "Account for isolated vertices even when the edge list is empty.",
    ],
    [
      {
        n: 6,
        edges: [
          [0, 1],
          [1, 2],
          [3, 4],
        ],
      },
      3,
    ],
    [{ n: 0, edges: [] }, 0],
  ),
  "redundant-connection": q(
    "A simple undirected tree on labels 1 through n received one extra edge. Return an edge whose removal restores a tree. If several work, return the one appearing last in the input; preserve its input endpoint order.",
    [
      "3 <= n <= 10,000; edges.length=n; no duplicate undirected edges or self-loops.",
    ],
    [
      "The first failed union in input order is the last edge closing the unique cycle.",
      "Use labels 1 through n consistently and preserve the selected pair.",
    ],
    [
      {
        edges: [
          [1, 2],
          [2, 3],
          [1, 3],
        ],
      },
      [1, 3],
    ],
    [
      {
        edges: [
          [1, 2],
          [2, 3],
          [3, 4],
          [4, 1],
          [1, 5],
        ],
      },
      [4, 1],
    ],
  ),
  "word-ladder": q(
    "Transform beginWord into endWord by changing exactly one letter at each step. Every resulting word must be in wordList; beginWord need not be. Return the number of words in the shortest chain, including both endpoints, or zero if no chain exists.",
    [
      "1 <= word length <= 10; all words have equal length and use lowercase English letters; beginWord differs from endWord.",
      "1 <= wordList.length <= 5,000; dictionary words are distinct.",
    ],
    [
      "BFS explores by number of transformations and marks words when enqueued.",
      "endWord must be in the dictionary; index wildcard patterns or generate one-character neighbors.",
    ],
    [
      {
        beginWord: "cat",
        endWord: "dog",
        wordList: ["cot", "cog", "dog", "dat"],
      },
      4,
    ],
    [{ beginWord: "cat", endWord: "dog", wordList: ["cot", "cog"] }, 0],
  ),
  "reconstruct-itinerary": q(
    "Each directed ticket [from,to] must be used exactly once, starting at JFK. Return the airport sequence with lexicographically smallest order among complete valid itineraries. Duplicate tickets are distinct usable tickets. At least one complete itinerary is guaranteed.",
    [
      "1 <= tickets.length <= 300; airport codes are three uppercase English letters.",
    ],
    [
      "Respect multiplicities; local lexical choices require Eulerian postorder construction or correct backtracking.",
      "The result contains tickets.length+1 airports and consumes every ticket, not only reachable greedy prefixes.",
    ],
    [
      {
        tickets: [
          ["JFK", "AAB"],
          ["JFK", "AAC"],
          ["AAC", "JFK"],
        ],
      },
      ["JFK", "AAC", "JFK", "AAB"],
    ],
    [
      {
        tickets: [
          ["JFK", "AAA"],
          ["AAA", "JFK"],
          ["JFK", "AAA"],
        ],
      },
      ["JFK", "AAA", "JFK", "AAA"],
    ],
  ),
  "min-cost-to-connect-all-points": q(
    "Connect all 2D points into a connected network minimizing total edge cost. An edge costs Manhattan distance |x1-x2|+|y1-y2|. Return the minimum total cost; adding cycles is unnecessary.",
    [
      "1 <= points.length <= 1,000; points are distinct; coordinates have magnitude at most 1,000,000.",
    ],
    [
      "Prim or Kruskal constructs a minimum spanning tree using Manhattan weights.",
      "Select the cheapest connection crossing from included to excluded vertices; avoid quadratic edge storage when using dense Prim.",
    ],
    [
      {
        points: [
          [0, 0],
          [2, 0],
          [2, 3],
        ],
      },
      5,
    ],
    [{ points: [[9, -2]] }, 0],
  ),
  "swim-in-rising-water": q(
    "In an n by n grid, water level equals time t. You may move between orthogonally adjacent cells when both elevations are at most t, taking no additional travel time. Return the earliest time to reach the bottom-right cell from the top-left.",
    [
      "1 <= n <= 50; grid contains every integer from 0 through n*n-1 exactly once.",
    ],
    [
      "Path cost is the maximum elevation visited, not a sum.",
      "Minimax Dijkstra, threshold reachability search or union-find must include both endpoint elevations.",
    ],
    [
      {
        grid: [
          [0, 3],
          [1, 2],
        ],
      },
      2,
    ],
    [{ grid: [[0]] }, 0],
  ),
  "alien-dictionary": q(
    "Words are sorted according to an unknown order of lowercase letters. Return any ordering of all distinct letters consistent with the words, or an empty string if impossible. The first differing letters between adjacent words impose an ordering. A longer word before its exact prefix is invalid. Example valid order is not unique.",
    ["1 <= words.length <= 1,000; 1 <= each word length <= 100."],
    [
      "Create at most one precedence edge per adjacent pair and count duplicate edges only once.",
      "Detect directed cycles and invalid prefix ordering; include letters with no edges.",
    ],
    [{ words: ["za", "zb", "ca", "cb"] }, "azbc"],
    [{ words: ["abc", "ab"] }, ""],
  ),
  "cheapest-flights-within-k-stops": q(
    "Return the cheapest cost from src to dst using at most k intermediate stops, or -1 if no route exists. Flights are directed [from,to,price]. At most k stops permits at most k+1 edges.",
    [
      "2 <= n <= 100; 0 <= k < n; src and dst are distinct valid indices; positive prices <= 10,000.",
      "No self-flights or duplicate directed edges.",
    ],
    [
      "Track cost together with edge count, or use layered Bellman-Ford with a previous-round snapshot.",
      "Do not reuse updates from the same relaxation round, which would exceed the edge budget.",
    ],
    [
      {
        n: 3,
        flights: [
          [0, 1, 4],
          [1, 2, 4],
          [0, 2, 12],
        ],
        src: 0,
        dst: 2,
        k: 1,
      },
      8,
    ],
    [
      {
        n: 3,
        flights: [
          [0, 1, 4],
          [1, 2, 4],
          [0, 2, 12],
        ],
        src: 0,
        dst: 2,
        k: 0,
      },
      12,
    ],
  ),
};
