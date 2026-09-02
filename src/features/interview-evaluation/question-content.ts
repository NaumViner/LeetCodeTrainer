import "server-only";

import { createHash } from "node:crypto";
import { z } from "zod";

import {
  firstPartyQuestionContentSchema,
  learnerVisibleQuestionContentSchema,
  type FirstPartyQuestionContent,
  type LearnerVisibleQuestionContent,
} from "@/features/interview-evaluation/evidence-model";

const approvedInterviewQuestionSchema = firstPartyQuestionContentSchema.extend({
  provenance: z.literal("first_party"),
  reviewStatus: z.literal("approved"),
});

type ApprovedInterviewQuestion = z.infer<
  typeof approvedInterviewQuestionSchema
>;
type QuestionDraft = Omit<
  ApprovedInterviewQuestion,
  "contentVersion" | "provenance" | "reviewStatus"
>;

const approvedQuestions = {
  "binary-search": question({
    constraints: [
      "1 <= nums.length <= 100,000",
      "nums is sorted in strictly increasing order.",
      "All values and target fit in a signed 32-bit integer.",
    ],
    examples: [
      {
        explanation: null,
        input: "nums = [-8, -1, 3, 6, 11], target = 6",
        output: "3",
      },
      {
        explanation: null,
        input: "nums = [2, 5, 9], target = 4",
        output: "-1",
      },
    ],
    expectedInvariants: [
      "If target exists, it remains inside the inclusive search interval.",
      "Every iteration strictly shrinks the remaining interval.",
    ],
    prompt:
      "Given a strictly increasing array of integers and a target value, return the index of the target. Return -1 when it is absent. Your solution must run in O(log n) time.",
  }),
  "best-time-to-buy-and-sell-stock": question({
    constraints: [
      "1 <= prices.length <= 100,000",
      "0 <= prices[i] <= 1,000,000",
      "A share must be bought before it is sold, and at most one transaction is allowed.",
    ],
    examples: [
      {
        explanation: "Buy at 2 and sell later at 8.",
        input: "prices = [7, 2, 5, 1, 8, 4]",
        output: "6",
      },
      {
        explanation: "No profitable transaction exists.",
        input: "prices = [9, 6, 3, 1]",
        output: "0",
      },
    ],
    expectedInvariants: [
      "The stored buy price is the minimum price observed before the current day.",
      "The best profit uses a buy day earlier than its sell day.",
    ],
    prompt:
      "You receive the price of one share on each consecutive day. Choose at most one day to buy and one later day to sell. Return the largest profit obtainable, or 0 if every possible transaction loses money.",
  }),
  "climbing-stairs": question({
    constraints: [
      "1 <= n <= 45",
      "Each move advances exactly one or two steps.",
    ],
    examples: [
      {
        explanation: "The sequences are 1+1+1, 1+2, and 2+1.",
        input: "n = 3",
        output: "3",
      },
      { explanation: null, input: "n = 5", output: "8" },
    ],
    expectedInvariants: [
      "The ways to reach a step equal the sum of the ways to reach the previous two steps.",
    ],
    prompt:
      "A staircase has n steps. Starting below step 1, you may climb either one or two steps per move. Return the number of distinct move sequences that land exactly on step n.",
  }),
  "contains-duplicate": question({
    constraints: [
      "1 <= nums.length <= 100,000",
      "-1,000,000,000 <= nums[i] <= 1,000,000,000",
    ],
    examples: [
      {
        explanation: "The value 4 occurs twice.",
        input: "nums = [4, 1, 9, 4]",
        output: "true",
      },
      {
        explanation: null,
        input: "nums = [-3, 0, 8]",
        output: "false",
      },
    ],
    expectedInvariants: [
      "Before processing an element, the seen collection contains exactly the earlier values.",
    ],
    prompt:
      "Given an array of integers, return true when at least one value occurs more than once. Return false when every value is distinct.",
  }),
  "implement-trie-prefix-tree": question({
    constraints: [
      "Every word contains 1 to 2,000 lowercase English letters.",
      "At most 30,000 operations are performed in total.",
    ],
    examples: [
      {
        explanation:
          "The prefix is present before the complete word is inserted.",
        input:
          'insert("code"), search("cod"), startsWith("cod"), insert("cod"), search("cod")',
        output: "null, false, true, null, true",
      },
    ],
    expectedInvariants: [
      "Each traversed edge corresponds to exactly one character of the prefix.",
      "A terminal marker distinguishes a stored word from a prefix only.",
    ],
    prompt:
      "Implement a Trie class with insert(word), search(word), and startsWith(prefix). search returns true only for a complete inserted word; startsWith returns true when any inserted word begins with the supplied prefix.",
  }),
  "insert-interval": question({
    constraints: [
      "0 <= intervals.length <= 100,000",
      "Existing intervals are sorted by start and do not overlap.",
      "For every interval [start, end], start <= end.",
    ],
    examples: [
      {
        explanation: null,
        input: "intervals = [[1,2],[6,9]], newInterval = [2,7]",
        output: "[[1,9]]",
      },
      {
        explanation: null,
        input: "intervals = [], newInterval = [4,5]",
        output: "[[4,5]]",
      },
    ],
    expectedInvariants: [
      "Intervals emitted before the merged interval end strictly before it begins.",
      "All overlapping intervals are absorbed before later intervals are emitted.",
    ],
    prompt:
      "Insert one interval into a list of sorted, non-overlapping closed intervals. Merge every overlap created by the insertion and return the resulting sorted, non-overlapping list.",
  }),
  "kth-largest-element-in-a-stream": question({
    constraints: [
      "1 <= k <= initial values plus the number of add calls.",
      "At most 100,000 values are supplied across construction and add calls.",
      "Values fit in a signed 32-bit integer.",
    ],
    examples: [
      {
        explanation:
          "After each insertion, report the third-largest value seen so far.",
        input: "KthLargest(3, [5, 1, 9]); add(2); add(10); add(7)",
        output: "2, 5, 7",
      },
    ],
    expectedInvariants: [
      "The retained candidates are exactly the k largest values seen so far.",
      "The smallest retained candidate is the current kth-largest value.",
    ],
    prompt:
      "Design a KthLargest class. The constructor receives k and an initial integer collection. Each add(value) operation records the value and returns the kth-largest value among everything observed so far.",
  }),
  "maximum-subarray": question({
    constraints: [
      "1 <= nums.length <= 100,000",
      "-100,000 <= nums[i] <= 100,000",
      "The chosen subarray must contain at least one element.",
    ],
    examples: [
      {
        explanation: "The best contiguous block is [4, -1, 2, 1].",
        input: "nums = [-2, 4, -1, 2, 1, -7, 3]",
        output: "6",
      },
      { explanation: null, input: "nums = [-5]", output: "-5" },
    ],
    expectedInvariants: [
      "The running value is the best sum of a non-empty subarray ending at the current index.",
    ],
    prompt:
      "Given a non-empty integer array, return the largest sum among all non-empty contiguous subarrays.",
  }),
  "network-delay-time": question({
    constraints: [
      "1 <= n <= 100",
      "1 <= times.length <= 6,000",
      "Each directed edge [u, v, w] has 1 <= w <= 100, and nodes are numbered 1 through n.",
    ],
    examples: [
      {
        explanation: "Node 4 is the last reached, after 3 units.",
        input: "times = [[1,2,1],[2,3,1],[1,4,3]], n = 4, source = 1",
        output: "3",
      },
      {
        explanation: "Node 3 cannot be reached.",
        input: "times = [[1,2,5]], n = 3, source = 1",
        output: "-1",
      },
    ],
    expectedInvariants: [
      "A finalized node has the shortest possible travel time from the source.",
      "Relaxation never replaces a known distance with a larger value.",
    ],
    prompt:
      "A directed network has n nodes and weighted travel times [from, to, time]. A signal starts at source. Return the earliest time by which every node has received it, or -1 if some node is unreachable.",
  }),
  "number-of-islands": question({
    constraints: [
      "1 <= rows, columns <= 300",
      "Every cell is either '0' for water or '1' for land.",
      "Land connects only vertically and horizontally, not diagonally.",
    ],
    examples: [
      {
        explanation: null,
        input: 'grid = [["1","1","0"],["0","1","0"],["1","0","1"]]',
        output: "3",
      },
    ],
    expectedInvariants: [
      "Every discovered land cell is assigned to exactly one connected component.",
    ],
    prompt:
      "Given a rectangular grid of water and land cells, return the number of connected land regions. Cells belong to the same region when a path of horizontal or vertical land moves connects them.",
  }),
  "reverse-linked-list": question({
    constraints: [
      "The list contains 0 to 100,000 nodes.",
      "Node values fit in a signed 32-bit integer.",
    ],
    examples: [
      {
        explanation: null,
        input: "head = 2 -> 5 -> 8 -> null",
        output: "8 -> 5 -> 2 -> null",
      },
      { explanation: null, input: "head = null", output: "null" },
    ],
    expectedInvariants: [
      "The processed prefix is reversed and terminates at null.",
      "A saved reference preserves access to the unprocessed suffix before rewiring.",
    ],
    prompt:
      "Reverse a singly linked list and return its new head. Reuse the existing nodes; do not create a second list containing copied values.",
  }),
  "rotate-image": question({
    constraints: [
      "1 <= n <= 200",
      "matrix has exactly n rows and n columns.",
      "Modify the supplied matrix in place without allocating another n-by-n matrix.",
    ],
    examples: [
      {
        explanation: null,
        input: "matrix = [[1,2,3],[4,5,6],[7,8,9]]",
        output: "[[7,4,1],[8,5,2],[9,6,3]]",
      },
    ],
    expectedInvariants: [
      "Each source cell moves to column n - 1 - row and row equal to its former column.",
      "Every four-cell cycle is updated without losing an overwritten value.",
    ],
    prompt:
      "Rotate a square integer matrix 90 degrees clockwise in place. Return nothing; the input matrix itself must contain the rotated result.",
  }),
  "serialize-and-deserialize-binary-tree": question({
    constraints: [
      "The tree contains 0 to 10,000 nodes.",
      "Node values fit in a signed 32-bit integer.",
      "Your serialized format must preserve missing children and signed values unambiguously.",
    ],
    examples: [
      {
        explanation:
          "The encoded string may differ; decoding must restore the same structure and values.",
        input: "root = [4, 2, 7, null, 3]",
        output: "deserialize(serialize(root)) = [4, 2, 7, null, 3]",
      },
      {
        explanation: null,
        input: "root = []",
        output: "deserialize(serialize(root)) = []",
      },
    ],
    expectedInvariants: [
      "The encoding records enough boundary or null information to reconstruct one unique tree.",
      "Serialization and deserialization consume nodes in the same traversal order.",
    ],
    prompt:
      "Design a Codec with serialize(root) and deserialize(data). serialize converts a binary tree into a string, and deserialize reconstructs an equivalent tree from that string. You may choose the format, but a round trip must preserve every node value and child position.",
  }),
  "single-number": question({
    constraints: [
      "1 <= nums.length <= 100,000",
      "Every value except one appears exactly twice.",
      "Use O(1) additional space and linear time.",
    ],
    examples: [
      {
        explanation: null,
        input: "nums = [6, -2, 6, 9, -2]",
        output: "9",
      },
      { explanation: null, input: "nums = [11]", output: "11" },
    ],
    expectedInvariants: [
      "Combining a duplicated value twice cancels its contribution.",
    ],
    prompt:
      "In a non-empty integer array, every value appears exactly twice except for one value that appears once. Return that unique value using linear time and constant extra space.",
  }),
  subsets: question({
    constraints: [
      "0 <= nums.length <= 15",
      "All input values are distinct.",
      "The output may list subsets in any order.",
    ],
    examples: [
      {
        explanation: null,
        input: "nums = [2, 5]",
        output: "[[], [2], [5], [2,5]]",
      },
      { explanation: null, input: "nums = []", output: "[[]]" },
    ],
    expectedInvariants: [
      "Every partial subset branches once with and once without the current value.",
      "Each input value is considered exactly once along a completed branch.",
    ],
    prompt:
      "Given an array of distinct integers, return every subset of its values, including the empty set and the full set. Do not return duplicate subsets.",
  }),
  "unique-paths": question({
    constraints: [
      "1 <= rows, columns <= 100",
      "The result fits in a signed 32-bit integer.",
      "A move advances exactly one cell right or one cell down.",
    ],
    examples: [
      {
        explanation: null,
        input: "rows = 3, columns = 4",
        output: "10",
      },
      {
        explanation: null,
        input: "rows = 1, columns = 7",
        output: "1",
      },
    ],
    expectedInvariants: [
      "Ways to reach a cell equal the sum of ways to reach the cell above and the cell to its left.",
    ],
    prompt:
      "A robot starts in the top-left cell of a rows-by-columns grid and wants to reach the bottom-right cell. It may move only right or down. Return the number of distinct valid paths.",
  }),
  "valid-palindrome": question({
    constraints: [
      "1 <= text.length <= 200,000",
      "The input contains printable ASCII characters.",
      "Only letters and digits participate in the comparison, and letter case is ignored.",
    ],
    examples: [
      {
        explanation: null,
        input: 'text = "Never odd, or even!"',
        output: "true",
      },
      {
        explanation: null,
        input: 'text = "code review"',
        output: "false",
      },
    ],
    expectedInvariants: [
      "Characters outside the comparison alphabet are skipped.",
      "All already-passed character pairs match after case normalization.",
    ],
    prompt:
      "Determine whether a string reads the same forward and backward after removing every non-alphanumeric character and ignoring letter case.",
  }),
  "valid-parentheses": question({
    constraints: [
      "0 <= text.length <= 100,000",
      "The input contains only (), {}, and [].",
    ],
    examples: [
      {
        explanation: null,
        input: 'text = "{[()]}"',
        output: "true",
      },
      {
        explanation: null,
        input: 'text = "([)]"',
        output: "false",
      },
      { explanation: null, input: 'text = "("', output: "false" },
    ],
    expectedInvariants: [
      "Unclosed opening brackets are retained in encounter order.",
      "A closing bracket must match the most recent unmatched opening bracket.",
    ],
    prompt:
      "Given a string containing only round, square, and curly brackets, return whether it is valid. Every opening bracket must be closed by the same type, and nested brackets must close in reverse opening order.",
  }),
} satisfies Record<string, ApprovedInterviewQuestion>;

type ApprovedQuestionSlug = keyof typeof approvedQuestions;

export const APPROVED_INTERVIEW_QUESTION_SLUGS = Object.freeze(
  Object.keys(approvedQuestions),
);

export function getApprovedInterviewQuestion(problemSlug: string) {
  const question = approvedQuestions[problemSlug as ApprovedQuestionSlug];
  return question ? approvedInterviewQuestionSchema.parse(question) : null;
}

export function getApprovedQuestionContentVersion(problemSlug: string) {
  return getApprovedInterviewQuestion(problemSlug)?.contentVersion ?? null;
}

export function getFirstPartyQuestionContent(
  problemSlug: string,
  contentVersion?: number | null,
): FirstPartyQuestionContent | null {
  const question = getApprovedInterviewQuestion(problemSlug);
  if (
    !question ||
    (contentVersion && question.contentVersion !== contentVersion)
  ) {
    return null;
  }
  const { provenance, reviewStatus, ...content } = question;
  void provenance;
  void reviewStatus;
  return firstPartyQuestionContentSchema.parse(content);
}

export function getLearnerVisibleQuestionContent(
  problemSlug: string,
  contentVersion?: number | null,
): LearnerVisibleQuestionContent | null {
  const content = getFirstPartyQuestionContent(problemSlug, contentVersion);
  if (!content) return null;
  const { expectedInvariants, ...learnerVisible } = content;
  void expectedInvariants;
  return learnerVisibleQuestionContentSchema.parse(learnerVisible);
}

const activeQuestionSlugByContentKey = new Map(
  Object.keys(approvedQuestions).map((slug) => [
    activeInterviewContentKey(slug),
    slug,
  ]),
);

export function getActiveInterviewQuestionPrompt(
  contentKey: string,
  contentVersion?: number | null,
) {
  const slug = activeQuestionSlugByContentKey.get(contentKey);
  if (!slug) return null;
  return getLearnerVisibleQuestionContent(slug, contentVersion)?.prompt ?? null;
}

function activeInterviewContentKey(problemSlug: string) {
  return createHash("md5")
    .update(`${problemSlug}:mock-interview-active-v1:8f4d23ac`)
    .digest("hex");
}

function question(content: QuestionDraft): ApprovedInterviewQuestion {
  return approvedInterviewQuestionSchema.parse({
    ...content,
    contentVersion: 1,
    provenance: "first_party",
    reviewStatus: "approved",
  });
}
