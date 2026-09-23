import { draft as q } from "./define";

const list =
  "Lists are acyclic singly linked lists; JSON arrays display node values in traversal order. Empty arrays denote null heads. Node values fit signed 32-bit integers.";
const tree =
  "Trees use compact breadth-first arrays: null marks an absent child; trailing nulls are omitted. Each existing node consumes up to two subsequent child entries. Empty arrays denote null roots. Values fit signed 32-bit integers.";

export const structureQuestions = {
  "merge-two-sorted-lists": q(
    "Merge two nondecreasing linked lists into one nondecreasing list, reusing the original nodes and returning its head. The lists do not share nodes.",
    [list, "0 <= total nodes <= 100,000."],
    [
      "Always link the smaller remaining head and advance that list.",
      "Every node appears once, including duplicate values; the result is acyclic.",
    ],
    [{ left: [-1, 3, 8], right: [0, 3, 7] }, [-1, 0, 3, 3, 7, 8]],
    [{ left: [], right: [2] }, [2]],
  ),
  "linked-list-cycle": q(
    "Return whether following next pointers from head ever revisits the same node. The input display gives values and pos: the last node points to the zero-based index pos, or to null when pos is -1. Your function receives only head, not pos. Aim for O(1) extra space.",
    [
      "0 <= number of nodes <= 100,000; pos is -1 or a valid index; empty input has pos=-1.",
    ],
    [
      "Slow and fast pointers compare node identity, not equal values.",
      "An acyclic list must terminate safely when fast or fast.next is null.",
    ],
    [{ values: [2, 5, 2], pos: 1 }, true],
    [{ values: [2, 2], pos: -1 }, false],
  ),
  "reorder-list": q(
    "Reorder a list L0,L1,...,Ln into L0,Ln,L1,Ln-1,... in place. Relink nodes rather than swapping values. Return no value; examples show the mutated list. Aim for O(n) time and O(1) extra space.",
    [list, "0 <= nodes <= 100,000."],
    [
      "Split at the middle, reverse the second half and interleave without losing nodes.",
      "Terminate the final link; handle odd and even lengths without a cycle.",
    ],
    [{ values: [2, 4, 6, 8, 10] }, [2, 10, 4, 8, 6]],
    [{ values: [1, 2] }, [1, 2]],
  ),
  "remove-nth-node-from-end-of-list": q(
    "Remove the nth node counted from the end of a linked list and return the updated head. Aim to traverse the list once with O(1) additional space.",
    [list, "1 <= n <= number of nodes <= 100,000."],
    [
      "A fixed n-node gap identifies the predecessor of the node to remove.",
      "A sentinel handles removal of the head and the only node.",
    ],
    [{ values: [4, 7, 9, 11], n: 2 }, [4, 7, 11]],
    [{ values: [8], n: 1 }, []],
  ),
  "copy-list-with-random-pointer": q(
    "Deep-copy a list whose nodes each have next and random pointers. random is null or points to any node in the original list. Return the copied head; copied pointers must never reference original nodes. The display represents each node as [value,randomIndex], with null for no random pointer.",
    [
      "0 <= nodes <= 10,000; next pointers form an acyclic list; values fit signed 32-bit integers.",
    ],
    [
      "Each original identity maps to exactly one new identity, even when values repeat.",
      "Preserve next and random relationships; if weaving nodes, restore the original list.",
    ],
    [
      {
        nodes: [
          [5, 1],
          [5, 0],
          [8, null],
        ],
      },
      [
        [5, 1],
        [5, 0],
        [8, null],
      ],
    ],
    [{ nodes: [[9, 0]] }, [[9, 0]]],
  ),
  "add-two-numbers": q(
    "Two nonempty linked lists represent nonnegative decimal integers with least significant digit first. Return a new list representing their sum in the same order. Apart from zero itself, the most significant digit is nonzero. Do not convert the entire numbers to a built-in numeric type.",
    ["1 <= each list length <= 10,000; each node is a digit 0 through 9."],
    [
      "At each position output sum modulo ten and carry sum divided by ten.",
      "Continue through unequal lengths and a final carry; inputs remain unchanged.",
    ],
    [{ left: [8, 7], right: [5, 2] }, [3, 0, 1]],
    [{ left: [0], right: [0] }, [0]],
  ),
  "find-the-duplicate-number": q(
    "An array of length n+1 contains values from 1 to n. Exactly one distinct value occurs more than once, possibly more than twice. Return that value without modifying nums and using O(1) extra space. Aim for O(n) time.",
    ["1 <= n <= 100,000; every value is in [1,n]."],
    [
      "Treat indices and values as a functional graph; its reachable cycle entry is the repeated value.",
      "Floyd's detection and entry-finding phases must use compatible initial pointers.",
    ],
    [{ nums: [3, 1, 3, 4, 2] }, 3],
    [{ nums: [2, 2, 2] }, 2],
  ),
  "lru-cache": q(
    "Implement an LRUCache(capacity) with get(key) and put(key,value), each expected O(1). get returns -1 when absent and otherwise marks the entry most recently used. put inserts or updates and marks most recently used, evicting the least recently used key when necessary. put returns null. Examples omit construction from ops.",
    [
      "1 <= capacity <= 10,000; at most 100,000 operations; keys and values are nonnegative signed 32-bit integers.",
    ],
    [
      "A key map and doubly linked recency list stay in one-to-one agreement.",
      "Updates and successful reads refresh recency; failed reads do not; size never exceeds capacity.",
    ],
    [
      {
        capacity: 2,
        ops: [
          ["put", 1, 5],
          ["put", 2, 8],
          ["get", 1],
          ["put", 3, 9],
          ["get", 2],
          ["get", 3],
        ],
      },
      [null, null, 5, null, -1, 9],
    ],
    [
      {
        capacity: 1,
        ops: [
          ["put", 1, 2],
          ["put", 1, 3],
          ["get", 1],
        ],
      },
      [null, null, 3],
    ],
  ),
  "reverse-nodes-in-k-group": q(
    "Reverse each complete consecutive group of k nodes in a linked list and return its head. Leave a final group shorter than k unchanged. Relink nodes without changing values; aim for O(1) auxiliary space.",
    [list, "1 <= k <= number of nodes <= 100,000."],
    [
      "Confirm a complete group before reversing it and reconnect both boundaries.",
      "Every original node remains reachable once; incomplete suffixes preserve order.",
    ],
    [{ values: [1, 2, 3, 4, 5, 6, 7], k: 3 }, [3, 2, 1, 6, 5, 4, 7]],
    [{ values: [8, 9], k: 1 }, [8, 9]],
  ),
  "invert-binary-tree": q(
    "Swap the left and right children of every node and return the tree root.",
    [tree, "0 <= nodes <= 10,000."],
    [
      "Every subtree is mirrored, including one-child nodes.",
      "Empty trees are valid; visit each node once.",
    ],
    [{ root: [5, 2, 8, 1, 3, null, 9] }, [5, 8, 2, 9, null, 3, 1]],
    [{ root: [] }, []],
  ),
  "maximum-depth-of-binary-tree": q(
    "Return the largest number of nodes on a path from the root to any leaf. An empty tree has depth zero.",
    [tree, "0 <= nodes <= 100,000; the tree may be a chain."],
    [
      "Depth(null)=0 and depth(node)=1+max(child depths).",
      "Account for recursion stack limits on highly skewed trees.",
    ],
    [{ root: [4, 2, 7, null, 3] }, 3],
    [{ root: [] }, 0],
  ),
  "diameter-of-binary-tree": q(
    "Return the largest number of edges on any simple path between two nodes in the tree. The path need not pass through the root. Empty and single-node trees have diameter zero.",
    [tree, "0 <= nodes <= 100,000."],
    [
      "At each node the path through it joins left and right subtree heights.",
      "Track a global best separately from the single-branch height returned upward; target O(n).",
    ],
    [{ root: [1, 2, 3, 4, 5] }, 3],
    [{ root: [8] }, 0],
  ),
  "balanced-binary-tree": q(
    "Return whether every node's left and right subtree heights differ by at most one. An empty tree is balanced.",
    [tree, "0 <= nodes <= 100,000."],
    [
      "Balance must hold at every subtree, not only at the root.",
      "Propagate height and failure together to avoid quadratic repeated depth calculations.",
    ],
    [{ root: [1, 2, null, 3] }, false],
    [{ root: [4, 2, 6] }, true],
  ),
  "same-tree": q(
    "Return whether two binary trees have identical structure and equal values at every corresponding node.",
    [tree, "0 <= nodes per tree <= 100,000."],
    [
      "A null/non-null mismatch or unequal values fails immediately.",
      "Both ordered child pairs must match; equal traversals alone are insufficient.",
    ],
    [{ p: [1, 2], q: [1, null, 2] }, false],
    [{ p: [3, 1, 5], q: [3, 1, 5] }, true],
  ),
  "subtree-of-another-tree": q(
    "Return whether subRoot matches an entire subtree of root in both structure and values. A match includes all descendants of the chosen node. For this task, an empty subRoot is a subtree of every tree.",
    [tree, "0 <= root nodes <= 10,000; 0 <= subRoot nodes <= 1,000."],
    [
      "Test structural equality at candidate roots; matching a prefix is insufficient.",
      "Check every relevant candidate, including repeated values; explain O(n*m) baseline or a collision-safe faster method.",
    ],
    [{ root: [7, 3, 9, 1, 5], subRoot: [3, 1, 5] }, true],
    [{ root: [7, 3, 9, 1, 5], subRoot: [3, 1] }, false],
  ),
  "lowest-common-ancestor-of-a-binary-search-tree": q(
    "In a binary search tree with distinct values, return the lowest node that is an ancestor of both nodes p and q; a node is its own ancestor. p and q are supplied as references, displayed by their unique values. Examples show the returned node's value.",
    [
      tree,
      "2 <= nodes <= 100,000; p and q are distinct nodes present in the tree; BST inequalities are strict.",
    ],
    [
      "Move left or right only when both values lie strictly on that side.",
      "The first split, or a node equal to one target, is the lowest common ancestor.",
    ],
    [{ root: [6, 2, 9, 1, 4, 8, 12], p: 1, q: 4 }, 2],
    [{ root: [6, 2, 9], p: 6, q: 9 }, 6],
  ),
  "binary-tree-level-order-traversal": q(
    "Return node values grouped by depth, from root level downward and left to right within each level.",
    [tree, "0 <= nodes <= 100,000."],
    [
      "A breadth-first traversal snapshots each level's size before adding children.",
      "An empty root produces an empty result, not a level containing null.",
    ],
    [{ root: [8, 3, 10, null, 6] }, [[8], [3, 10], [6]]],
    [{ root: [] }, []],
  ),
  "binary-tree-right-side-view": q(
    "Return the values visible when looking at the tree from its right side, one per depth from top to bottom.",
    [tree, "0 <= nodes <= 100,000."],
    [
      "Select the rightmost existing node at each depth, even if it belongs to a left subtree.",
      "BFS last-per-level or right-first DFS is valid.",
    ],
    [{ root: [1, 2, 3, null, 5] }, [1, 3, 5]],
    [{ root: [] }, []],
  ),
  "count-good-nodes-in-binary-tree": q(
    "A node is good when its value is at least every value on the path from the root to that node. Return the number of good nodes; equal values qualify.",
    [tree, "0 <= nodes <= 100,000."],
    [
      "Carry the maximum for the current ancestor path independently into each branch.",
      "The root is good when present; initialize safely for negative values.",
    ],
    [{ root: [3, 1, 4, 3, null, 2, 5] }, 4],
    [{ root: [-2, -2, -3] }, 2],
  ),
  "validate-binary-search-tree": q(
    "Return whether the binary tree is a strict BST: every left descendant is smaller than its ancestor and every right descendant is larger. Duplicate values invalidate the tree.",
    [tree, "0 <= nodes <= 100,000."],
    [
      "Propagate exclusive ancestor bounds, not only parent comparisons.",
      "Do not use finite sentinel values that reject valid integer extremes.",
    ],
    [{ root: [5, 2, 8, null, null, 4, 9] }, false],
    [{ root: [2, 1, 3] }, true],
  ),
  "kth-smallest-element-in-a-bst": q(
    "Return the kth smallest value, counting from one, in a BST with distinct values. Explain the cost for a single query and an extension for frequent queries with updates.",
    [tree, "1 <= k <= nodes <= 100,000."],
    [
      "Inorder traversal visits values in increasing order and stops after k visits.",
      "For the follow-up, maintained subtree sizes must stay correct after updates.",
    ],
    [{ root: [5, 2, 8, 1, 3], k: 3 }, 3],
    [{ root: [7], k: 1 }, 7],
  ),
  "construct-binary-tree-from-preorder-and-inorder-traversal": q(
    "Reconstruct and return the unique binary tree from its preorder and inorder value sequences. Both sequences describe the same tree and values are distinct.",
    [
      tree,
      "0 <= sequence length <= 100,000; preorder and inorder have equal length and the same distinct values.",
    ],
    [
      "The next preorder value is the root of the current inorder interval.",
      "An inorder index map avoids repeated scans; left subtree size controls traversal boundaries.",
    ],
    [
      { preorder: [8, 3, 1, 6, 10], inorder: [1, 3, 6, 8, 10] },
      [8, 3, 10, 1, 6],
    ],
    [{ preorder: [], inorder: [] }, []],
  ),
  "binary-tree-maximum-path-sum": q(
    "Return the largest sum of node values along a nonempty simple path in a binary tree. Adjacent nodes must be parent and child; the path may start and end anywhere and never revisit a node.",
    [tree, "1 <= nodes <= 100,000; -1,000 <= each value <= 1,000."],
    [
      "An upward contribution can use only one child branch; a best path through a node can join two.",
      "Ignore negative child gains but initialize the global answer for all-negative trees.",
    ],
    [{ root: [-5, 4, 8, null, null, 6, 2] }, 16],
    [{ root: [-8, -3, -9] }, -3],
  ),
  "last-stone-weight": q(
    "Repeatedly choose the two heaviest stones. If weights match, both disappear; otherwise replace them with their positive difference. Return the last remaining weight, or zero when all disappear.",
    ["0 <= stones.length <= 100,000; 1 <= stones[i] <= 1,000,000."],
    [
      "Each step removes the two current maxima, not merely the original largest stones.",
      "A max-heap supports O(n log n); equal stones must not create a positive replacement.",
    ],
    [{ stones: [3, 8, 5, 2] }, 2],
    [{ stones: [4, 4] }, 0],
  ),
  "k-closest-points-to-origin": q(
    "Return k input points with smallest squared Euclidean distance to (0,0), in any order. The selected multiset is unique: there is no distance tie across the selection boundary. Preserve repeated point occurrences.",
    [
      "1 <= k <= points.length <= 100,000; each coordinate has magnitude at most 10,000.",
    ],
    [
      "Compare squared distances without square roots; retain exactly k occurrences.",
      "A bounded heap or selection improves on sorting when appropriate; explain expected and worst-case costs.",
    ],
    [
      {
        points: [
          [3, 4],
          [1, 1],
          [-2, 0],
        ],
        k: 2,
      },
      [
        [1, 1],
        [-2, 0],
      ],
    ],
    [
      {
        points: [
          [0, 0],
          [5, 0],
        ],
        k: 1,
      },
      [[0, 0]],
    ],
  ),
  "kth-largest-element-in-an-array": q(
    "Return the kth largest element of nums, counting duplicate occurrences separately. k is one-based. Explain a heap or selection approach rather than relying only on a full sort.",
    ["1 <= k <= nums.length <= 100,000; values fit signed 32-bit integers."],
    [
      "Rank counts occurrences rather than distinct values.",
      "Partition boundaries or heap size must preserve the target rank; discuss quickselect's worst case.",
    ],
    [{ nums: [7, 2, 7, 4, 9], k: 3 }, 7],
    [{ nums: [-5, -1], k: 2 }, -5],
  ),
  "task-scheduler": q(
    "Each task takes one time slot. Equal task labels must be separated by at least n complete slots, which may contain other tasks or idle time. Tasks can be reordered. Return the minimum total slots needed.",
    ["1 <= tasks.length <= 100,000; uppercase English labels; 0 <= n <= 100."],
    [
      "The maximum frequency and number of labels tied at that frequency determine the cooldown lower bound.",
      "The answer cannot be smaller than the number of tasks; idle slots may be filled by other labels.",
    ],
    [{ tasks: ["A", "A", "A", "B", "B", "B"], n: 2 }, 8],
    [{ tasks: ["A", "A", "B"], n: 0 }, 3],
  ),
  "design-twitter": q(
    "Implement postTweet(user,tweet), getNewsFeed(user), follow(user,followee) and unfollow(user,followee). Return the ten most recent tweet IDs by that user or their current followees, newest first. Each post gets a later timestamp; tweet IDs are unique. Other operations return null. Own tweets are always visible; self-follow/unfollow are no-ops. Start empty.",
    [
      "At most 100,000 operations; user and tweet IDs are nonnegative integers.",
    ],
    [
      "Merge own/followee timelines in recency order without duplicate self entries.",
      "Follow is idempotent, unfollowing an absent relationship is harmless, and feeds include older posts from newly followed users.",
    ],
    [
      {
        ops: [
          ["postTweet", 1, 20],
          ["postTweet", 2, 30],
          ["follow", 1, 2],
          ["getNewsFeed", 1],
          ["unfollow", 1, 2],
          ["getNewsFeed", 1],
        ],
      },
      [null, null, null, [30, 20], null, [20]],
    ],
    [{ ops: [["getNewsFeed", 9]] }, [[]]],
  ),
  "find-median-from-data-stream": q(
    "Implement addNum(value) and findMedian() for a stream of integers. addNum returns null. findMedian returns the middle sorted value, or the average of the two middle values for an even count. Start empty; median is requested only after an insertion.",
    ["At most 100,000 operations; values have magnitude at most 1,000,000."],
    [
      "Two heaps partition values with every lower value <= every upper value and sizes differing by at most one.",
      "Insertion should be O(log n), median retrieval O(1), and averaging must avoid overflow.",
    ],
    [
      {
        ops: [
          ["addNum", 8],
          ["addNum", 2],
          ["findMedian"],
          ["addNum", 4],
          ["findMedian"],
        ],
      },
      [null, null, 5, null, 4],
    ],
    [{ ops: [["addNum", -3], ["findMedian"]] }, [null, -3]],
  ),
  "design-add-and-search-words-data-structure": q(
    "Implement addWord(word) and search(pattern). A dot in a search pattern matches exactly one arbitrary lowercase letter; other characters match literally. Return whether any stored word matches the entire pattern. addWord returns null. Start empty.",
    [
      "At most 10,000 operations; word and pattern lengths are 1 to 100; inserted words use lowercase English letters; patterns may also contain '.'.",
    ],
    [
      "A trie search branches over children only for dots and requires a terminal marker after all characters.",
      "Prefixes are not automatically complete words; repeated insertion is harmless.",
    ],
    [
      {
        ops: [
          ["addWord", "code"],
          ["addWord", "cope"],
          ["search", "co.e"],
          ["search", "co."],
          ["search", "...."],
        ],
      },
      [null, null, true, false, true],
    ],
    [{ ops: [["search", "a"]] }, [false]],
  ),
  "word-search-ii": q(
    "Return every distinct dictionary word that can be traced through horizontally or vertically adjacent board cells. A cell cannot be reused within one word, but can be reused in another search. Result order does not matter.",
    [
      "1 <= board rows, columns <= 12; lowercase English letters; board is displayed as an array of strings.",
      "1 <= words.length <= 30,000; words are distinct and 1 to 10 letters long.",
    ],
    [
      "A trie shares prefix work; backtracking marks and restores cells on each path.",
      "A found word is emitted once, but longer words sharing its prefix must remain searchable.",
    ],
    [
      { board: ["ab", "cd"], words: ["ab", "ac", "bd", "abcd", "aba"] },
      ["ab", "ac", "bd"],
    ],
    [{ board: ["aa"], words: ["a", "aa", "aaa"] }, ["a", "aa"]],
  ),
};
