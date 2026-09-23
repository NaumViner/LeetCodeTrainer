// Shared metadata for catalog migrations.
export const topicMetadata = {
  "advanced-graphs": {
    prerequisites: ["graphs", "heap-priority-queue"],
    signals: [
      "weighted or ordered connections",
      "specialized graph constraints",
    ],
    tags: ["shortest-path", "graph-algorithms"],
  },
  "arrays-and-hashing": {
    prerequisites: ["big-o", "programming-foundations"],
    signals: ["membership, counting, or grouping", "repeated lookup work"],
    tags: ["hash-map", "array"],
  },
  backtracking: {
    prerequisites: ["trees"],
    signals: ["enumerate valid choices", "choose, explore, and undo"],
    tags: ["backtracking", "decision-tree"],
  },
  "binary-search": {
    prerequisites: ["big-o", "arrays-and-hashing"],
    signals: [
      "sorted or monotonic input",
      "first, last, minimum, or maximum valid",
    ],
    tags: ["binary-search", "monotonic-predicate"],
  },
  "bit-manipulation": {
    prerequisites: ["big-o"],
    signals: ["binary flags or cancellation", "individual bit state"],
    tags: ["bit-manipulation", "bit-mask"],
  },
  graphs: {
    prerequisites: ["trees"],
    signals: [
      "connections or reachability",
      "components, routes, or grid movement",
    ],
    tags: ["graph-traversal", "visited-state"],
  },
  greedy: {
    prerequisites: ["big-o", "arrays-and-hashing"],
    signals: ["locally optimal commitment", "ordering makes a choice safe"],
    tags: ["greedy", "ordering"],
  },
  "heap-priority-queue": {
    prerequisites: ["trees"],
    signals: ["top k or kth item", "repeated minimum or maximum retrieval"],
    tags: ["heap", "priority-queue"],
  },
  intervals: {
    prerequisites: ["arrays-and-hashing"],
    signals: ["overlapping ranges", "start and end boundaries"],
    tags: ["intervals", "sorting"],
  },
  "linked-list": {
    prerequisites: ["programming-foundations"],
    signals: ["node relationships", "in-place pointer rewiring"],
    tags: ["linked-list", "pointer-invariant"],
  },
  "math-and-geometry": {
    prerequisites: ["big-o"],
    signals: [
      "numeric or coordinate invariant",
      "modular or spatial reasoning",
    ],
    tags: ["math", "geometry"],
  },
  "one-dimensional-dp": {
    prerequisites: ["backtracking"],
    signals: [
      "overlapping sequence subproblems",
      "take-or-skip or count decisions",
    ],
    tags: ["dynamic-programming", "one-dimensional-state"],
  },
  "sliding-window": {
    prerequisites: ["two-pointers"],
    signals: ["contiguous range", "longest, shortest, or fixed-length segment"],
    tags: ["sliding-window", "contiguous-range"],
  },
  stack: {
    prerequisites: ["arrays-and-hashing"],
    signals: [
      "nested or unresolved work",
      "nearest greater or smaller boundary",
    ],
    tags: ["stack", "last-in-first-out"],
  },
  trees: {
    prerequisites: ["stack"],
    signals: ["hierarchical structure", "subtree or level result"],
    tags: ["tree-traversal", "recursion"],
  },
  tries: {
    prerequisites: ["trees"],
    signals: ["repeated prefix lookup", "dictionary pruning by characters"],
    tags: ["trie", "prefix-search"],
  },
  "two-dimensional-dp": {
    prerequisites: ["one-dimensional-dp"],
    signals: ["two changing coordinates", "grid or string-pair subproblems"],
    tags: ["dynamic-programming", "two-dimensional-state"],
  },
  "two-pointers": {
    prerequisites: ["arrays-and-hashing"],
    signals: ["ordered pair or opposite ends", "coordinated indices"],
    tags: ["two-pointers", "pointer-invariant"],
  },
};
