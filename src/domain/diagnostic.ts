export type DiagnosticSection = "coding" | "concept" | "pattern";
export type DiagnosticCodingTier = "advanced" | "foundation" | "intermediate";
export type DiagnosticLevel = "developing" | "foundation" | "independent";

export type DiagnosticOption = {
  label: string;
  value: "a" | "b" | "c" | "d";
};

export type DiagnosticQuestion = {
  description?: string;
  id: string;
  options: DiagnosticOption[];
  prompt: string;
  section: DiagnosticSection;
  topicSlug: string;
};

const options = (...labels: string[]): DiagnosticOption[] =>
  labels.map((label, index) => ({
    label,
    value: ["a", "b", "c", "d"][index] as DiagnosticOption["value"],
  }));

export const conceptQuestions: DiagnosticQuestion[] = [
  {
    id: "concept-complexity",
    options: options("O(log n)", "O(n)", "O(n log n)", "O(n²)"),
    prompt:
      "A loop compares every pair of elements in an array. What is its time complexity?",
    section: "concept",
    topicSlug: "big-o",
  },
  {
    id: "concept-hash-map",
    options: options(
      "A hash map",
      "A linked list",
      "A stack",
      "A sorted array with a full scan",
    ),
    prompt: "Which structure usually gives average O(1) lookup by key?",
    section: "concept",
    topicSlug: "arrays-and-hashing",
  },
  {
    id: "concept-recursion",
    options: options(
      "A base case that stops recursion",
      "A global variable",
      "A nested loop",
      "A sorted input",
    ),
    prompt: "What must a well-formed recursive solution include?",
    section: "concept",
    topicSlug: "programming-foundations",
  },
  {
    id: "concept-trees",
    options: options("Preorder", "Inorder", "Postorder", "Level order"),
    prompt:
      "Which traversal returns a binary search tree's values in sorted order?",
    section: "concept",
    topicSlug: "trees",
  },
  {
    id: "concept-graphs",
    options: options(
      "A visited set",
      "A second adjacency list",
      "A sorted edge list",
      "A parent pointer on every node",
    ),
    prompt:
      "What prevents an ordinary graph traversal from revisiting a cycle forever?",
    section: "concept",
    topicSlug: "graphs",
  },
];

export const patternQuestions: DiagnosticQuestion[] = [
  {
    description:
      "You need to decide whether any two values sum to a target in one pass.",
    id: "pattern-pair-sum",
    options: options("Backtracking", "Hash set", "Heap", "Union-find"),
    prompt: "What approach would you try first?",
    section: "pattern",
    topicSlug: "arrays-and-hashing",
  },
  {
    description:
      "Find the longest contiguous segment satisfying a changing constraint.",
    id: "pattern-contiguous",
    options: options(
      "Topological sort",
      "Binary search tree",
      "Sliding window",
      "Depth-first search",
    ),
    prompt: "What approach would you try first?",
    section: "pattern",
    topicSlug: "sliding-window",
  },
  {
    description:
      "Find the minimum number of moves in an unweighted state graph.",
    id: "pattern-shortest-path",
    options: options("BFS", "Greedy sorting", "Backtracking", "Two pointers"),
    prompt: "What approach would you try first?",
    section: "pattern",
    topicSlug: "graphs",
  },
];

export const codingQuestions: DiagnosticQuestion[] = [
  {
    description:
      "Given an array and a target, return the indices of two values whose sum is the target.",
    id: "coding-two-sum",
    options: options(
      "For each value, store it; return only when the same value appears again.",
      "For each value, check whether target − value is already in a map; otherwise store value → index.",
      "Sort the values and return their sorted positions without preserving original indices.",
      "Use two nested loops but stop after examining the first pair.",
    ),
    prompt:
      "Which implementation plan is correct and runs in O(n) expected time?",
    section: "coding",
    topicSlug: "arrays-and-hashing",
  },
  {
    description:
      "Return the index of a target in a sorted array, or −1 if it is absent.",
    id: "coding-binary-search",
    options: options(
      "Move both boundaries toward the target after every comparison.",
      "Always discard the left half, regardless of the comparison.",
      "Compare the midpoint, then discard only the half that cannot contain the target.",
      "Check every other element and then scan backward.",
    ),
    prompt: "Which loop invariant produces a correct O(log n) implementation?",
    section: "coding",
    topicSlug: "binary-search",
  },
  {
    description: "Return the maximum depth of a binary tree.",
    id: "coding-tree-depth",
    options: options(
      "Return 0 for null; otherwise return 1 + max(depth(left), depth(right)).",
      "Return 1 for null and add both subtree depths.",
      "Follow only left children and count them.",
      "Sort node values before counting levels.",
    ),
    prompt: "Which recursive implementation is correct?",
    section: "coding",
    topicSlug: "trees",
  },
  {
    description: "Determine whether a directed graph contains a cycle.",
    id: "coding-graph-cycle",
    options: options(
      "Use one global visited set and report a cycle whenever a visited node is seen.",
      "Run BFS without tracking visited nodes.",
      "Sort vertices by their numeric labels and inspect adjacent labels.",
      "Track both fully visited nodes and nodes on the current DFS path; a path revisit is a cycle.",
    ),
    prompt:
      "Which implementation correctly distinguishes a cycle from a shared descendant?",
    section: "coding",
    topicSlug: "graphs",
  },
  {
    description: "Return the k most frequent values from an array.",
    id: "coding-top-k",
    options: options(
      "Sort the original array and return its first k values.",
      "Count frequencies, maintain a size-k min-heap by frequency, then extract its contents.",
      "Use a FIFO queue containing the last k values seen.",
      "Run binary search for every distinct value without counting occurrences.",
    ),
    prompt: "Which implementation keeps only the strongest k candidates?",
    section: "coding",
    topicSlug: "heap-priority-queue",
  },
  {
    description: "Merge all overlapping intervals.",
    id: "coding-merge-intervals",
    options: options(
      "Sort by end time and merge every adjacent pair.",
      "Keep the input order and merge only equal intervals.",
      "Sort by start time; extend the last output interval when the next start is within its end.",
      "Put endpoints in a set and pair them in arbitrary order.",
    ),
    prompt:
      "Which implementation maintains the correct merged-prefix invariant?",
    section: "coding",
    topicSlug: "intervals",
  },
];

export const initialDiagnosticQuestions = [
  ...conceptQuestions,
  ...patternQuestions,
];

export const codingQuestionIdsByTier: Record<DiagnosticCodingTier, string[]> = {
  advanced: ["coding-graph-cycle", "coding-top-k", "coding-merge-intervals"],
  foundation: ["coding-two-sum"],
  intermediate: ["coding-binary-search", "coding-tree-depth"],
};

export function questionsByIds(ids: string[]) {
  const questionById = new Map(
    [...initialDiagnosticQuestions, ...codingQuestions].map((question) => [
      question.id,
      question,
    ]),
  );
  return ids.flatMap((id) => {
    const question = questionById.get(id);
    return question ? [question] : [];
  });
}

export function codingTierForScores(
  conceptScore: number,
  patternScore: number,
  experienceLevel: string,
): DiagnosticCodingTier {
  if (
    conceptScore >= 80 &&
    patternScore >= 66 &&
    ["active_interview_prep", "experienced", "some_leetcode"].includes(
      experienceLevel,
    )
  ) {
    return "advanced";
  }
  if (conceptScore >= 40 && patternScore >= 33) return "intermediate";
  return "foundation";
}

export function diagnosticLevelForScore(score: number): DiagnosticLevel {
  if (score >= 75) return "independent";
  if (score >= 50) return "developing";
  return "foundation";
}

export function diagnosticLevelLabel(level: DiagnosticLevel) {
  if (level === "independent") return "Independent practice";
  if (level === "developing") return "Guided development";
  return "Foundation building";
}
