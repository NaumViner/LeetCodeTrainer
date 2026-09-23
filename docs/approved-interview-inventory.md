# Approved interview inventory

Updated September 23, 2026. All **250 NeetCode 250 questions** have active first-party interview content and a version-matched follow-up: **60 Easy, 155 Medium, 35 Hard**, across **18 topics**. Both interviewer styles use the same inventory. This document is for maintainers; the active interview continues to hide titles, topic tags and private solution invariants.

## Sources and contracts

- Canonical current metadata: `data/neetcode-250.json`, verified against the [official NeetCode 250 catalog](https://neetcode.io/practice/practice/neetcode250) on 2026-09-23. Only identifiers, titles, difficulty and category metadata were imported. Prompts, examples, constraints and follow-ups are original application content.
- Historical metadata: `data/problems.json` remains the original 150-question seed. The 250 snapshot preserves those records exactly and appends 100 identifiers; existing IDs, content versions and interview snapshots remain intact.
- Content registry: `src/features/interview-evaluation/question-content.ts` and `content/*.ts`. Expanded prompts include public constraints and examples when displayed and supplied to voice providers. Private evaluator invariants are excluded from learner payloads.
- Follow-ups: `data/interview-follow-ups.json` covers the previous expansion and corrections; `data/neetcode250-follow-ups.json` adds 100. The private database table is keyed by problem and content version. Historical v1 follow-ups for the two corrected questions remain available.
- Examples use explicitly documented representations for linked lists, trees, interactive judges and mutation results. These are interview contracts, not a claim of a built-in LeetCode judge or language-specific harness. English authored statements are used with either English or Hebrew interview conversation.

## Validation and limits

- `tests/interview-content-semantics.test.ts` validates the original 20 prompts; `tests/interview-expanded-content.test.ts` independently computes examples for the other 230. Exact identifier coverage, metadata preservation, versioning and learner/evaluator boundaries are checked.
- Validators accept permitted alternatives for topological orders, matrix placement, BST shapes, reorganized strings, longest happy strings and unordered combinations. Ordered lists, paths and operation outputs retain their ordering.
- `tests/integration/mock-interviews.test.ts` verifies all 250 active content versions and matching private follow-ups; every one of the 100 new questions is started and resolved under both interviewer styles (200 start/snapshot/abandon cycles). It tests a candidate count of 250 and preservation of the historical 150 collection.
- `tests/interview-inventory-selection.test.ts` simulates 300 interviews for each of the six offered difficulty ranges. Selection and coverage read the 250 collection.
- These are deterministic content and application checks. Learner code is assessed by the existing evidence-based AI evaluator; no code execution engine has been added. Tests do not certify AI grading accuracy or real microphone conversation quality for all 250 questions. Browser checks block paid provider calls.

## Deployment and maintenance

Apply pending migrations in timestamp order, including the 150-content and versioned follow-up migrations, then `20260923120000_complete_neetcode250_inventory.sql`. Deploy the matching application version after the database update. The migration validates 250 ready records, 18 topics and 250 matching follow-ups; it also switches the start RPC collection and raises its candidate-count ceiling to 250. Do not replace or regenerate historical applied migrations.

`scripts/import-neetcode250-metadata.mjs` reads literal metadata from a downloaded official public bundle using the TypeScript parser; it never executes the bundle. `scripts/generate-neetcode250-migration.mjs` reproduces the new migration from the pinned metadata and follow-ups. Once this migration is deployed, later corrections require another forward migration and content version.

## Current inventory

| Slug                                                             | Topic               | Difficulty | Active content version |
| ---------------------------------------------------------------- | ------------------- | ---------- | ---------------------- |
| contains-duplicate                                               | arrays-and-hashing  | easy       | 1                      |
| valid-anagram                                                    | arrays-and-hashing  | easy       | 1                      |
| two-sum                                                          | arrays-and-hashing  | easy       | 1                      |
| group-anagrams                                                   | arrays-and-hashing  | medium     | 1                      |
| top-k-frequent-elements                                          | arrays-and-hashing  | medium     | 1                      |
| encode-and-decode-strings                                        | arrays-and-hashing  | medium     | 1                      |
| product-of-array-except-self                                     | arrays-and-hashing  | medium     | 1                      |
| valid-sudoku                                                     | arrays-and-hashing  | medium     | 1                      |
| longest-consecutive-sequence                                     | arrays-and-hashing  | medium     | 1                      |
| valid-palindrome                                                 | two-pointers        | easy       | 1                      |
| two-sum-ii-input-array-is-sorted                                 | two-pointers        | medium     | 1                      |
| 3sum                                                             | two-pointers        | medium     | 1                      |
| container-with-most-water                                        | two-pointers        | medium     | 1                      |
| trapping-rain-water                                              | two-pointers        | hard       | 1                      |
| best-time-to-buy-and-sell-stock                                  | sliding-window      | easy       | 2                      |
| longest-substring-without-repeating-characters                   | sliding-window      | medium     | 1                      |
| longest-repeating-character-replacement                          | sliding-window      | medium     | 1                      |
| permutation-in-string                                            | sliding-window      | medium     | 1                      |
| minimum-window-substring                                         | sliding-window      | hard       | 1                      |
| sliding-window-maximum                                           | sliding-window      | hard       | 1                      |
| valid-parentheses                                                | stack               | easy       | 1                      |
| min-stack                                                        | stack               | medium     | 1                      |
| evaluate-reverse-polish-notation                                 | stack               | medium     | 1                      |
| daily-temperatures                                               | stack               | medium     | 1                      |
| car-fleet                                                        | stack               | medium     | 1                      |
| largest-rectangle-in-histogram                                   | stack               | hard       | 1                      |
| binary-search                                                    | binary-search       | easy       | 1                      |
| search-a-2d-matrix                                               | binary-search       | medium     | 1                      |
| koko-eating-bananas                                              | binary-search       | medium     | 1                      |
| find-minimum-in-rotated-sorted-array                             | binary-search       | medium     | 1                      |
| search-in-rotated-sorted-array                                   | binary-search       | medium     | 1                      |
| time-based-key-value-store                                       | binary-search       | medium     | 1                      |
| median-of-two-sorted-arrays                                      | binary-search       | hard       | 1                      |
| reverse-linked-list                                              | linked-list         | easy       | 1                      |
| merge-two-sorted-lists                                           | linked-list         | easy       | 1                      |
| linked-list-cycle                                                | linked-list         | easy       | 1                      |
| reorder-list                                                     | linked-list         | medium     | 1                      |
| remove-nth-node-from-end-of-list                                 | linked-list         | medium     | 1                      |
| copy-list-with-random-pointer                                    | linked-list         | medium     | 1                      |
| add-two-numbers                                                  | linked-list         | medium     | 1                      |
| find-the-duplicate-number                                        | linked-list         | medium     | 1                      |
| lru-cache                                                        | linked-list         | medium     | 1                      |
| merge-k-sorted-lists                                             | linked-list         | hard       | 1                      |
| reverse-nodes-in-k-group                                         | linked-list         | hard       | 1                      |
| invert-binary-tree                                               | trees               | easy       | 1                      |
| maximum-depth-of-binary-tree                                     | trees               | easy       | 1                      |
| diameter-of-binary-tree                                          | trees               | easy       | 1                      |
| balanced-binary-tree                                             | trees               | easy       | 1                      |
| same-tree                                                        | trees               | easy       | 1                      |
| subtree-of-another-tree                                          | trees               | easy       | 1                      |
| lowest-common-ancestor-of-a-binary-search-tree                   | trees               | medium     | 1                      |
| binary-tree-level-order-traversal                                | trees               | medium     | 1                      |
| binary-tree-right-side-view                                      | trees               | medium     | 1                      |
| count-good-nodes-in-binary-tree                                  | trees               | medium     | 1                      |
| validate-binary-search-tree                                      | trees               | medium     | 1                      |
| kth-smallest-element-in-a-bst                                    | trees               | medium     | 1                      |
| construct-binary-tree-from-preorder-and-inorder-traversal        | trees               | medium     | 1                      |
| binary-tree-maximum-path-sum                                     | trees               | hard       | 1                      |
| serialize-and-deserialize-binary-tree                            | trees               | hard       | 1                      |
| kth-largest-element-in-a-stream                                  | heap-priority-queue | easy       | 2                      |
| last-stone-weight                                                | heap-priority-queue | easy       | 1                      |
| k-closest-points-to-origin                                       | heap-priority-queue | medium     | 1                      |
| kth-largest-element-in-an-array                                  | heap-priority-queue | medium     | 1                      |
| task-scheduler                                                   | heap-priority-queue | medium     | 1                      |
| design-twitter                                                   | heap-priority-queue | medium     | 1                      |
| find-median-from-data-stream                                     | heap-priority-queue | hard       | 1                      |
| subsets                                                          | backtracking        | medium     | 1                      |
| combination-sum                                                  | backtracking        | medium     | 1                      |
| combination-sum-ii                                               | backtracking        | medium     | 1                      |
| permutations                                                     | backtracking        | medium     | 1                      |
| subsets-ii                                                       | backtracking        | medium     | 1                      |
| generate-parentheses                                             | backtracking        | medium     | 1                      |
| word-search                                                      | backtracking        | medium     | 1                      |
| palindrome-partitioning                                          | backtracking        | medium     | 1                      |
| letter-combinations-of-a-phone-number                            | backtracking        | medium     | 1                      |
| n-queens                                                         | backtracking        | hard       | 1                      |
| implement-trie-prefix-tree                                       | tries               | medium     | 1                      |
| design-add-and-search-words-data-structure                       | tries               | medium     | 1                      |
| word-search-ii                                                   | tries               | hard       | 1                      |
| number-of-islands                                                | graphs              | medium     | 1                      |
| max-area-of-island                                               | graphs              | medium     | 1                      |
| clone-graph                                                      | graphs              | medium     | 1                      |
| walls-and-gates                                                  | graphs              | medium     | 1                      |
| rotting-oranges                                                  | graphs              | medium     | 1                      |
| pacific-atlantic-water-flow                                      | graphs              | medium     | 1                      |
| surrounded-regions                                               | graphs              | medium     | 1                      |
| course-schedule                                                  | graphs              | medium     | 1                      |
| course-schedule-ii                                               | graphs              | medium     | 1                      |
| graph-valid-tree                                                 | graphs              | medium     | 1                      |
| number-of-connected-components-in-an-undirected-graph            | graphs              | medium     | 1                      |
| redundant-connection                                             | graphs              | medium     | 1                      |
| word-ladder                                                      | graphs              | hard       | 1                      |
| network-delay-time                                               | advanced-graphs     | medium     | 1                      |
| reconstruct-itinerary                                            | advanced-graphs     | hard       | 1                      |
| min-cost-to-connect-all-points                                   | advanced-graphs     | medium     | 1                      |
| swim-in-rising-water                                             | advanced-graphs     | hard       | 1                      |
| alien-dictionary                                                 | advanced-graphs     | hard       | 1                      |
| cheapest-flights-within-k-stops                                  | advanced-graphs     | medium     | 1                      |
| climbing-stairs                                                  | one-dimensional-dp  | easy       | 1                      |
| min-cost-climbing-stairs                                         | one-dimensional-dp  | easy       | 1                      |
| house-robber                                                     | one-dimensional-dp  | medium     | 1                      |
| house-robber-ii                                                  | one-dimensional-dp  | medium     | 1                      |
| longest-palindromic-substring                                    | one-dimensional-dp  | medium     | 1                      |
| palindromic-substrings                                           | one-dimensional-dp  | medium     | 1                      |
| decode-ways                                                      | one-dimensional-dp  | medium     | 1                      |
| coin-change                                                      | one-dimensional-dp  | medium     | 1                      |
| maximum-product-subarray                                         | one-dimensional-dp  | medium     | 1                      |
| word-break                                                       | one-dimensional-dp  | medium     | 1                      |
| longest-increasing-subsequence                                   | one-dimensional-dp  | medium     | 1                      |
| partition-equal-subset-sum                                       | one-dimensional-dp  | medium     | 1                      |
| unique-paths                                                     | two-dimensional-dp  | medium     | 1                      |
| longest-common-subsequence                                       | two-dimensional-dp  | medium     | 1                      |
| best-time-to-buy-and-sell-stock-with-cooldown                    | two-dimensional-dp  | medium     | 1                      |
| coin-change-ii                                                   | two-dimensional-dp  | medium     | 1                      |
| target-sum                                                       | two-dimensional-dp  | medium     | 1                      |
| interleaving-string                                              | two-dimensional-dp  | medium     | 1                      |
| longest-increasing-path-in-a-matrix                              | two-dimensional-dp  | hard       | 1                      |
| distinct-subsequences                                            | two-dimensional-dp  | hard       | 1                      |
| edit-distance                                                    | two-dimensional-dp  | medium     | 1                      |
| burst-balloons                                                   | two-dimensional-dp  | hard       | 1                      |
| regular-expression-matching                                      | two-dimensional-dp  | hard       | 1                      |
| maximum-subarray                                                 | greedy              | medium     | 1                      |
| jump-game                                                        | greedy              | medium     | 1                      |
| jump-game-ii                                                     | greedy              | medium     | 1                      |
| gas-station                                                      | greedy              | medium     | 1                      |
| hand-of-straights                                                | greedy              | medium     | 1                      |
| merge-triplets-to-form-target-triplet                            | greedy              | medium     | 1                      |
| partition-labels                                                 | greedy              | medium     | 1                      |
| valid-parenthesis-string                                         | greedy              | medium     | 1                      |
| insert-interval                                                  | intervals           | medium     | 1                      |
| merge-intervals                                                  | intervals           | medium     | 1                      |
| non-overlapping-intervals                                        | intervals           | medium     | 1                      |
| meeting-rooms                                                    | intervals           | easy       | 1                      |
| meeting-rooms-ii                                                 | intervals           | medium     | 1                      |
| minimum-interval-to-include-each-query                           | intervals           | hard       | 1                      |
| rotate-image                                                     | math-and-geometry   | medium     | 1                      |
| spiral-matrix                                                    | math-and-geometry   | medium     | 1                      |
| set-matrix-zeroes                                                | math-and-geometry   | medium     | 1                      |
| happy-number                                                     | math-and-geometry   | easy       | 1                      |
| plus-one                                                         | math-and-geometry   | easy       | 1                      |
| powx-n                                                           | math-and-geometry   | medium     | 1                      |
| multiply-strings                                                 | math-and-geometry   | medium     | 1                      |
| detect-squares                                                   | math-and-geometry   | medium     | 1                      |
| single-number                                                    | bit-manipulation    | easy       | 1                      |
| number-of-1-bits                                                 | bit-manipulation    | easy       | 1                      |
| counting-bits                                                    | bit-manipulation    | easy       | 1                      |
| reverse-bits                                                     | bit-manipulation    | easy       | 1                      |
| missing-number                                                   | bit-manipulation    | easy       | 1                      |
| sum-of-two-integers                                              | bit-manipulation    | medium     | 1                      |
| reverse-integer                                                  | bit-manipulation    | medium     | 1                      |
| concatenation-of-array                                           | arrays-and-hashing  | easy       | 1                      |
| longest-common-prefix                                            | arrays-and-hashing  | easy       | 1                      |
| remove-element                                                   | arrays-and-hashing  | easy       | 1                      |
| majority-element                                                 | arrays-and-hashing  | easy       | 1                      |
| design-hashset                                                   | arrays-and-hashing  | easy       | 1                      |
| design-hashmap                                                   | arrays-and-hashing  | easy       | 1                      |
| sort-an-array                                                    | arrays-and-hashing  | medium     | 1                      |
| sort-colors                                                      | arrays-and-hashing  | medium     | 1                      |
| range-sum-query-2d-immutable                                     | arrays-and-hashing  | medium     | 1                      |
| best-time-to-buy-and-sell-stock-ii                               | arrays-and-hashing  | medium     | 1                      |
| majority-element-ii                                              | arrays-and-hashing  | medium     | 1                      |
| subarray-sum-equals-k                                            | arrays-and-hashing  | medium     | 1                      |
| first-missing-positive                                           | arrays-and-hashing  | hard       | 1                      |
| reverse-string                                                   | two-pointers        | easy       | 1                      |
| valid-palindrome-ii                                              | two-pointers        | easy       | 1                      |
| merge-strings-alternately                                        | two-pointers        | easy       | 1                      |
| merge-sorted-array                                               | two-pointers        | easy       | 1                      |
| remove-duplicates-from-sorted-array                              | two-pointers        | easy       | 1                      |
| 4sum                                                             | two-pointers        | medium     | 1                      |
| rotate-array                                                     | two-pointers        | medium     | 1                      |
| boats-to-save-people                                             | two-pointers        | medium     | 1                      |
| contains-duplicate-ii                                            | sliding-window      | easy       | 1                      |
| minimum-size-subarray-sum                                        | sliding-window      | medium     | 1                      |
| find-k-closest-elements                                          | sliding-window      | medium     | 1                      |
| baseball-game                                                    | stack               | easy       | 1                      |
| implement-stack-using-queues                                     | stack               | easy       | 1                      |
| implement-queue-using-stacks                                     | stack               | easy       | 1                      |
| asteroid-collision                                               | stack               | medium     | 1                      |
| online-stock-span                                                | stack               | medium     | 1                      |
| simplify-path                                                    | stack               | medium     | 1                      |
| decode-string                                                    | stack               | medium     | 1                      |
| maximum-frequency-stack                                          | stack               | hard       | 1                      |
| search-insert-position                                           | binary-search       | easy       | 1                      |
| guess-number-higher-or-lower                                     | binary-search       | easy       | 1                      |
| sqrtx                                                            | binary-search       | easy       | 1                      |
| capacity-to-ship-packages-within-d-days                          | binary-search       | medium     | 1                      |
| search-in-rotated-sorted-array-ii                                | binary-search       | medium     | 1                      |
| split-array-largest-sum                                          | binary-search       | hard       | 1                      |
| find-in-mountain-array                                           | binary-search       | hard       | 1                      |
| reverse-linked-list-ii                                           | linked-list         | medium     | 1                      |
| design-circular-queue                                            | linked-list         | medium     | 1                      |
| lfu-cache                                                        | linked-list         | hard       | 1                      |
| binary-tree-inorder-traversal                                    | trees               | easy       | 1                      |
| binary-tree-preorder-traversal                                   | trees               | easy       | 1                      |
| binary-tree-postorder-traversal                                  | trees               | easy       | 1                      |
| insert-into-a-binary-search-tree                                 | trees               | medium     | 1                      |
| delete-node-in-a-bst                                             | trees               | medium     | 1                      |
| construct-quad-tree                                              | trees               | medium     | 1                      |
| house-robber-iii                                                 | trees               | medium     | 1                      |
| delete-leaves-with-a-given-value                                 | trees               | medium     | 1                      |
| single-threaded-cpu                                              | heap-priority-queue | medium     | 1                      |
| reorganize-string                                                | heap-priority-queue | medium     | 1                      |
| longest-happy-string                                             | heap-priority-queue | medium     | 1                      |
| car-pooling                                                      | heap-priority-queue | medium     | 1                      |
| ipo                                                              | heap-priority-queue | hard       | 1                      |
| sum-of-all-subset-xor-totals                                     | backtracking        | easy       | 1                      |
| combinations                                                     | backtracking        | medium     | 1                      |
| permutations-ii                                                  | backtracking        | medium     | 1                      |
| matchsticks-to-square                                            | backtracking        | medium     | 1                      |
| partition-to-k-equal-sum-subsets                                 | backtracking        | medium     | 1                      |
| n-queens-ii                                                      | backtracking        | hard       | 1                      |
| word-break-ii                                                    | backtracking        | hard       | 1                      |
| extra-characters-in-a-string                                     | tries               | medium     | 1                      |
| island-perimeter                                                 | graphs              | easy       | 1                      |
| verifying-an-alien-dictionary                                    | graphs              | easy       | 1                      |
| find-the-town-judge                                              | graphs              | easy       | 1                      |
| open-the-lock                                                    | graphs              | medium     | 1                      |
| course-schedule-iv                                               | graphs              | medium     | 1                      |
| accounts-merge                                                   | graphs              | medium     | 1                      |
| evaluate-division                                                | graphs              | medium     | 1                      |
| minimum-height-trees                                             | graphs              | medium     | 1                      |
| path-with-minimum-effort                                         | advanced-graphs     | medium     | 1                      |
| find-critical-and-pseudo-critical-edges-in-minimum-spanning-tree | advanced-graphs     | hard       | 1                      |
| build-a-matrix-with-conditions                                   | advanced-graphs     | hard       | 1                      |
| greatest-common-divisor-traversal                                | advanced-graphs     | hard       | 1                      |
| n-th-tribonacci-number                                           | one-dimensional-dp  | easy       | 1                      |
| combination-sum-iv                                               | one-dimensional-dp  | medium     | 1                      |
| perfect-squares                                                  | one-dimensional-dp  | medium     | 1                      |
| integer-break                                                    | one-dimensional-dp  | medium     | 1                      |
| stone-game-iii                                                   | one-dimensional-dp  | hard       | 1                      |
| unique-paths-ii                                                  | two-dimensional-dp  | medium     | 1                      |
| minimum-path-sum                                                 | two-dimensional-dp  | medium     | 1                      |
| last-stone-weight-ii                                             | two-dimensional-dp  | medium     | 1                      |
| stone-game                                                       | two-dimensional-dp  | medium     | 1                      |
| stone-game-ii                                                    | two-dimensional-dp  | medium     | 1                      |
| lemonade-change                                                  | greedy              | easy       | 1                      |
| maximum-sum-circular-subarray                                    | greedy              | medium     | 1                      |
| longest-turbulent-subarray                                       | greedy              | medium     | 1                      |
| jump-game-vii                                                    | greedy              | medium     | 1                      |
| dota2-senate                                                     | greedy              | medium     | 1                      |
| candy                                                            | greedy              | hard       | 1                      |
| meeting-rooms-iii                                                | intervals           | hard       | 1                      |
| excel-sheet-column-title                                         | math-and-geometry   | easy       | 1                      |
| greatest-common-divisor-of-strings                               | math-and-geometry   | easy       | 1                      |
| insert-greatest-common-divisors-in-linked-list                   | math-and-geometry   | medium     | 1                      |
| transpose-matrix                                                 | math-and-geometry   | easy       | 1                      |
| roman-to-integer                                                 | math-and-geometry   | easy       | 1                      |
| add-binary                                                       | bit-manipulation    | easy       | 1                      |
| bitwise-and-of-numbers-range                                     | bit-manipulation    | medium     | 1                      |
| minimum-array-end                                                | bit-manipulation    | medium     | 1                      |

## Selection and repetition

Coverage selection version 2 first chooses an uncovered topic with eligible inventory in the requested difficulty range. When all eligible topics have been covered, it balances the least-covered eligible topics. It avoids recent topics when possible and prefers an uncompleted question within the selected topic; repetition is allowed when that pool is exhausted.

Topics outside the requested range remain uncovered. This fallback does not change the meaning of complete global coverage, widen difficulty, or unlock modes requiring full coverage. Persisted selection metadata records `coverageFallbackUsed`, `recencyFallbackUsed`, and `repeatFallbackUsed`. Empty inventory returns an availability error before an interview is created.

## Published corrections

- Stock version 2: `[7, 2, 5, 1, 8, 4]` has maximum single-transaction profit **7**, buying at 1 and selling at 8. Historical version 1 remains available exactly as shown originally; no historical interview or score is rewritten.
- Kth-largest stream version 2: duplicate values count separately, and every queried post-add state contains at least `k` observed values. The heap invariant explicitly allows fewer than `k` values during initialization.
- Median and merge-k-list prompts are original authored examples and constraints. The catalog supplies only their topic/difficulty metadata.

New evaluations of historical stock version-1 interviews use the corrected version-2 reference with an explicit evaluator erratum describing the erroneous original example and instructing the evaluator not to penalize reliance on it. Historical learner prompts and finalized scores remain unchanged. Evaluation version 2 persists the reference content version and erratum identifier in evidence coverage. No bulk regrading is performed.
