-- Follow-ups are versioned with the primary prompt. Preserve earlier rows and
-- persisted conversation snapshots while completing the full 150-question set.
alter table public.approved_interview_follow_ups
  drop constraint approved_interview_follow_ups_pkey;
alter table public.approved_interview_follow_ups
  add primary key (problem_id, content_version);

-- A legacy null version denotes the original v1 contract, never a random row.
do $$
declare definition text;
begin
  definition := pg_get_functiondef('public.request_interview_follow_up(uuid,text)'::regprocedure);
  if strpos(definition, 'owned_interview.question_content_version is null') = 0 then
    raise exception 'Unexpected follow-up function definition';
  end if;
  definition := replace(definition,
    'owned_interview.question_content_version is null
      or follow_up.content_version = owned_interview.question_content_version',
    'follow_up.content_version = coalesce(owned_interview.question_content_version, 1)');
  if strpos(definition, 'owned_interview.question_content_version is null') <> 0 then
    raise exception 'Follow-up version replacement did not apply';
  end if;
  execute definition;
end;
$$;

insert into public.approved_interview_follow_ups (problem_id, content_version, prompt)
select problem.id, problem.interview_content_version, authored.prompt
from (values
  ('3sum', 'Replace the zero target with an arbitrary integer target and preserve unique value triples. Implement the change and explain any overflow considerations.'),
  ('add-two-numbers', 'Digits are now stored most significant first. Return a new sum list without modifying the inputs. Explain your choice of stacks, recursion or temporary copies.'),
  ('alien-dictionary', 'Determine whether the valid alphabet order is unique. Return the order plus a uniqueness flag, or an explicit invalid-input result when no order exists.'),
  ('balanced-binary-tree', 'Return a reference to any node whose child heights differ by more than one, or null if balanced. Keep linear time and avoid repeated height scans.'),
  ('best-time-to-buy-and-sell-stock', 'Now support any number of buy-and-sell transactions while still holding at most one share at a time. Describe and implement the required change.'),
  ('best-time-to-buy-and-sell-stock-with-cooldown', 'Replace the one-day cooldown with a supplied nonnegative d-day cooldown. Define the earliest legal next buy and adapt the state transitions.'),
  ('binary-tree-level-order-traversal', 'Return alternate levels in reverse order to produce a zigzag traversal. Preserve linear time and explain how each level is accumulated.'),
  ('binary-tree-maximum-path-sum', 'Return one maximizing path as node references as well as its sum. Explain how to reconstruct two branches without joining incompatible upward paths.'),
  ('binary-tree-right-side-view', 'Return both the left-side and right-side views in a single traversal. Handle levels whose visible nodes are the same.'),
  ('burst-balloons', 'Return an optimal burst order using original balloon indices. Explain how choices of the last balloon in each interval reconstruct the chronological order.'),
  ('car-fleet', 'Also return each arriving fleet''s member starting positions in front-to-back order. Preserve the rule that meeting at the destination forms one fleet.'),
  ('cheapest-flights-within-k-stops', 'Return an actual cheapest route obeying the stop limit. Explain how to reconstruct it without mixing predecessor records from different edge budgets.'),
  ('clone-graph', 'Allow self-loops and repeated neighbor entries. Preserve those multiplicities and prove that no copied edge refers to an original node.'),
  ('coin-change', 'Also return one minimum-size multiset of coins, or an explicit no-solution result. Explain predecessor tracking and amount zero.'),
  ('coin-change-ii', 'Now each denomination can be used at most once. Adapt the counting recurrence and explain why the amount-loop direction changes.'),
  ('combination-sum', 'Return only the number of unique combinations rather than listing them. Explain how denomination-first dynamic programming avoids counting different orders.'),
  ('combination-sum-ii', 'Return only combinations using exactly k input occurrences. Preserve uniqueness for repeated values and explain pruning by remaining count.'),
  ('construct-binary-tree-from-preorder-and-inorder-traversal', 'Now inputs may be inconsistent. Detect length, value-set, duplicate-value and subtree-order contradictions rather than returning a partial tree.'),
  ('container-with-most-water', 'Line positions are now supplied as strictly increasing x coordinates rather than consecutive indices. Adapt your algorithm and justify the pointer movement.'),
  ('copy-list-with-random-pointer', 'Compare a map-based copy with an interleaving copy that uses O(1) auxiliary space. Implement the latter while restoring all original links.'),
  ('count-good-nodes-in-binary-tree', 'Also list the good nodes in preorder, using node references to distinguish repeated values. Preserve independent ancestor maxima across branches.'),
  ('counting-bits', 'Answer many range queries asking for the total set-bit count among integers L through R, where 0 <= L <= R <= n. Add preprocessing and constant-time queries.'),
  ('course-schedule', 'When completion is impossible, return one directed cycle of course IDs as evidence. Explain how to reconstruct a cycle rather than merely detect it.'),
  ('course-schedule-ii', 'Among valid full orderings, return the lexicographically smallest. Explain the queue or heap change and its complexity.'),
  ('daily-temperatures', 'Treat the temperature sequence as circular and search at most the next n-1 days. Return zero if no strictly warmer day appears in that range.'),
  ('decode-ways', 'Return the count modulo a supplied positive integer m so arbitrarily long inputs cannot overflow the result type. Preserve all zero-handling rules.'),
  ('design-add-and-search-words-data-structure', 'Add removeWord(word). Repeated insertion counts occurrences, and removal removes one occurrence if present. Search is true while any matching occurrence remains.'),
  ('design-twitter', 'Add deleteTweet(user,tweet), allowing only the author to remove a post. Explain how existing and future news-feed queries avoid deleted tweets.'),
  ('detect-squares', 'Add remove(point), deleting one stored occurrence if present. Preserve multiplicity-aware counts and make removal of an absent point a no-op.'),
  ('diameter-of-binary-tree', 'Return the two endpoint node references of a longest path in addition to its edge length. Show what extra information each subtree must return.'),
  ('distinct-subsequences', 'Return the count modulo a supplied positive integer m. Explain how to avoid reusing a source character with one-dimensional storage.'),
  ('edit-distance', 'Return one optimal sequence of edit operations. Define whether operation positions refer to the evolving string and demonstrate that applying the edits yields word2.'),
  ('encode-and-decode-strings', 'Decode the same encoding incrementally when chunks can end inside a length prefix or a word. Describe the retained state and implement a feed(chunk) interface.'),
  ('evaluate-reverse-polish-notation', 'Reject malformed expressions, unknown tokens, insufficient operands, leftover operands and division by zero with a clear error. Describe and implement validation.'),
  ('find-median-from-data-stream', 'Add removeNum(value), guaranteed to remove one existing occurrence. Explain how to preserve heap balance and discard stale elements if using lazy deletion.'),
  ('find-minimum-in-rotated-sorted-array', 'Allow duplicate values. Adapt boundary updates without discarding the minimum and explain why the worst-case time can become linear.'),
  ('find-the-duplicate-number', 'After finding the repeated value, also return its number of occurrences. Preserve the input, linear time and constant extra space.'),
  ('gas-station', 'For the chosen feasible start, report the minimum fuel in the tank after each arrival and the final fuel. Clarify whether measurement is before refueling.'),
  ('generate-parentheses', 'Restrict nesting depth to at most d. Adapt generation to prune prefixes exceeding d while still generating every permitted result once.'),
  ('graph-valid-tree', 'When the graph is not a tree, distinguish disconnection from the presence of a cycle; both may occur. Return both diagnostic flags.'),
  ('group-anagrams', 'Accept one word at a time and expose a query returning its anagram group so far. Preserve repeated occurrences and explain the update cost.'),
  ('hand-of-straights', 'Return the actual consecutive groups when possible. Preserve occurrence counts and explain how output size affects space complexity.'),
  ('happy-number', 'If the process does not reach one, return the repeating cycle of integer states. Explain how to find its entry and avoid duplicating the last state.'),
  ('house-robber', 'Return the selected house indices for one maximum-value plan. Verify that no two returned indices are adjacent and explain reconstruction.'),
  ('house-robber-ii', 'Return selected house indices for an optimal circular plan. Preserve the original indices when comparing the two linear cases.'),
  ('interleaving-string', 'Return a sequence of source labels 1 and 2 proving an interleaving when one exists. Explain how you reconstruct a valid choice at ambiguous matches.'),
  ('invert-binary-tree', 'Return a mirrored deep copy while leaving the original tree intact. Explain identity independence and the time and space requirements.'),
  ('jump-game', 'Return one sequence of visited indices reaching the last index, or an explicit no-route result. Explain how to avoid storing every possible edge.'),
  ('jump-game-ii', 'Remove the guarantee of reachability and return -1 for unreachable inputs. Show how to detect a layer that cannot extend its frontier.'),
  ('k-closest-points-to-origin', 'Points arrive in a stream and k remains fixed. Support adding a point and retrieving the current closest min(k,pointsSeen) occurrences.'),
  ('koko-eating-bananas', 'Allow h to be smaller than the number of nonempty piles. Return -1 when finishing is impossible, and justify the feasibility test before binary search.'),
  ('kth-largest-element-in-a-stream', 'Now add a remove(value) operation removing one existing occurrence. Return the kth-largest value after each update, or an explicit absence result when fewer than k values remain. Describe the data structure changes.'),
  ('kth-largest-element-in-an-array', 'Return the kth largest distinct value instead, or an explicit absence result when there are fewer than k distinct values. Explain changed memory needs.'),
  ('kth-smallest-element-in-a-bst', 'Augment the BST to answer kth-smallest queries efficiently after insertions and deletions. Specify and maintain subtree-size invariants.'),
  ('largest-rectangle-in-histogram', 'Return one maximizing rectangle''s left index, right index and height alongside its area. Define a consistent tie rule and handle an empty histogram.'),
  ('last-stone-weight', 'Also return the sequence of pairs of weights smashed. Discuss deterministic tie handling and the additional output space.'),
  ('letter-combinations-of-a-phone-number', 'Generate combinations lazily instead of storing them all. Describe the iterator state, termination and memory requirements.'),
  ('linked-list-cycle', 'If a cycle exists, return its entry node; otherwise return null. Preserve O(1) auxiliary space and explain why the entry-finding phase works.'),
  ('longest-common-subsequence', 'Return one longest common subsequence itself. Explain how to reconstruct a witness from the dynamic-programming states.'),
  ('longest-consecutive-sequence', 'Also return the first and last value of a longest run. If several runs tie, choose the one with the smallest first value. Handle empty input explicitly.'),
  ('longest-increasing-path-in-a-matrix', 'Return one maximizing coordinate path as well as its length. Ensure adjacent steps are orthogonal and heights strictly increase.'),
  ('longest-increasing-subsequence', 'Return one actual longest increasing subsequence using original indices. Explain why the minimal-tail array alone is not a valid reconstruction.'),
  ('longest-palindromic-substring', 'Return all starting indices of maximum-length palindromic substrings. Different positions count separately even when their text is equal.'),
  ('longest-repeating-character-replacement', 'Also return an earliest optimal window and the letter it should contain after replacement. Explain how to obtain a valid witness if you used a stale maximum count.'),
  ('longest-substring-without-repeating-characters', 'Return the earliest longest valid substring rather than only its length. Preserve the same time complexity and define the empty-input result.'),
  ('lowest-common-ancestor-of-a-binary-search-tree', 'Remove the BST ordering guarantee and solve the lowest-common-ancestor problem for an ordinary binary tree. Both target references still exist.'),
  ('lru-cache', 'Add resize(newCapacity), where the positive capacity may grow or shrink. Evict the least recently used entries as necessary and explain resize complexity.'),
  ('max-area-of-island', 'Also return the perimeter of a largest-area island, choosing any on ties. Count grid boundaries and water-facing sides correctly.'),
  ('maximum-depth-of-binary-tree', 'Also return one deepest root-to-leaf path as node values. Describe how ties are resolved and avoid sharing a mutable path across branches.'),
  ('maximum-product-subarray', 'Return start and end indices of one maximum-product subarray. Explain how both minimum and maximum states retain their corresponding starts.'),
  ('median-of-two-sorted-arrays', 'Generalize the query to return the kth smallest combined occurrence, with one-based k. Keep the arrays unchanged and explain boundary handling when one is empty.'),
  ('meeting-rooms', 'If attendance is impossible, return one conflicting pair of original meeting indices. Preserve compatibility for endpoint-touching meetings.'),
  ('meeting-rooms-ii', 'Assign a room number to each meeting using the minimum number of rooms. Return assignments in original input order and describe room reuse.'),
  ('merge-intervals', 'Also return the original interval indices contributing to each merged interval. Preserve endpoint-touching semantics and handle nested intervals.'),
  ('merge-k-sorted-lists', 'The input lists must remain unchanged. Return a new merged list and explain how copying affects auxiliary storage versus required output storage.'),
  ('merge-triplets-to-form-target-triplet', 'Return at most three original triplet indices whose coordinate-wise maximum equals target, or an explicit no-solution result. Explain why three suffice.'),
  ('merge-two-sorted-lists', 'The inputs must remain unchanged. Return a newly allocated merged list and explain which space costs become unavoidable.'),
  ('min-cost-climbing-stairs', 'Also return the sequence of paid stair indices for one optimal route. Preserve the choice of starting at stair zero or one.'),
  ('min-cost-to-connect-all-points', 'Return the chosen spanning-tree edges alongside the minimum cost. Explain how to retain predecessor information without storing every possible edge.'),
  ('min-stack', 'Add getMax() with O(1) time per operation. Preserve constant-time minimum queries and correct behavior for repeated extremes.'),
  ('minimum-interval-to-include-each-query', 'Return the selected interval''s original index as well as its length, breaking equal-length ties by smaller original index. Preserve query order.'),
  ('minimum-window-substring', 'Now ignore ASCII letter case while matching, but return the original substring with its original spelling. Preserve multiplicities and the earliest-start tie rule.'),
  ('missing-number', 'The array now contains n-1 distinct values from 0 through n, so two values are missing. Return both with linear time and constant auxiliary space.'),
  ('multiply-strings', 'Allow an optional leading minus sign on either input. Return a normalized signed decimal product with no negative zero, preserving the no-big-integer restriction.'),
  ('n-queens', 'Some cells are now forbidden. Accept a blocked-cell set and generate all valid placements while retaining the same queen attack rules.'),
  ('non-overlapping-intervals', 'Return the original indices of intervals to remove for an optimal solution. Define a deterministic choice when end times tie.'),
  ('number-of-1-bits', 'Count set bits across an arbitrary-length byte array representing an unsigned integer. Explain whether a precomputed byte lookup table is worthwhile.'),
  ('number-of-connected-components-in-an-undirected-graph', 'Edges now arrive incrementally. After each insertion return the current component count, treating repeated edges as no-ops.'),
  ('pacific-atlantic-water-flow', 'The two destinations are now arbitrary supplied sets of boundary cells. Generalize your reverse reachability searches to those source sets.'),
  ('palindrome-partitioning', 'Return the minimum number of cuts needed for a palindromic partition, rather than all partitions. Define the empty-string result as zero.'),
  ('palindromic-substrings', 'Count only distinct palindromic strings, rather than occurrences. Describe the extra storage and an implementation appropriate for the original input bounds.'),
  ('partition-equal-subset-sum', 'Return the two groups of original indices when a partition exists. Repeated values must remain distinct occurrences and each index must appear once.'),
  ('partition-labels', 'Return the actual partition substrings along with their start/end indices. Explain how to preserve the maximal-number-of-parts property.'),
  ('permutation-in-string', 'Return all starting indices where a permutation of s1 occurs in s2. Keep repeated and overlapping matches and preserve linear scanning.'),
  ('permutations', 'Allow duplicate input values and return each distinct permutation once. Explain how equal choices are skipped without losing valid repetitions.'),
  ('plus-one', 'Generalize the digit array to a supplied base b between 2 and 16. Add one without converting the full representation to a built-in number.'),
  ('powx-n', 'For integer x and nonnegative n, return x^n modulo a supplied positive integer m. Explain overflow-safe modular multiplication assumptions.'),
  ('product-of-array-except-self', 'Now return each product modulo a supplied positive integer m. Division is still forbidden and m need not be prime. Explain how zeros and negative inputs are handled.'),
  ('reconstruct-itinerary', 'Remove the guarantee that a complete itinerary exists. Return an empty list when impossible and validate edge multiplicities before accepting a candidate.'),
  ('redundant-connection', 'Also return the unique cycle''s vertices in traversal order, with no repeated final vertex. Explain how the rejected edge helps reconstruct it.'),
  ('regular-expression-matching', 'Add the ''+'' quantifier meaning one or more copies of the preceding element. Patterns remain valid and quantifiers are never stacked. Adapt the recurrence.'),
  ('remove-nth-node-from-end-of-list', 'Now n may be invalid. Leave the list unchanged for n <= 0 or n greater than its length, and return an explicit failure indicator with the head.'),
  ('reorder-list', 'Instead of the final order, split the original list into its even-indexed and odd-indexed nodes, preserving order within each returned list. Relink in place.'),
  ('reverse-bits', 'Generalize reversal to a supplied width w between 1 and 32, reversing only those low w bits. Reject inputs with set bits outside that width.'),
  ('reverse-integer', 'Generalize digit reversal from base ten to a supplied base between 2 and 16. Preserve signed 32-bit overflow detection before arithmetic overflows.'),
  ('reverse-nodes-in-k-group', 'Reverse alternate complete groups of k nodes, beginning with the first group. Keep every second group and any incomplete final group unchanged.'),
  ('rotting-oranges', 'Also return the minute each initially fresh orange becomes rotten, using -1 for fresh oranges that never rot. Preserve simultaneous spread.'),
  ('same-tree', 'Compare two trees for mirror symmetry instead of identical left/right structure. Implement the changed child pairing and describe its base cases.'),
  ('search-a-2d-matrix', 'Rows and columns are now individually sorted, but row ranges can overlap. Replace the flattened binary search with a correct search and explain its complexity.'),
  ('search-in-rotated-sorted-array', 'Allow duplicate values and return any matching index. Explain how ambiguous equal boundaries are handled and how they affect worst-case time.'),
  ('set-matrix-zeroes', 'Keep the original matrix unchanged and return the transformed copy. Explain which auxiliary-space restrictions should exclude the required output.'),
  ('sliding-window-maximum', 'For each window return the index of its earliest maximum instead of its value. Explain the deque rule needed for equal values.'),
  ('spiral-matrix', 'Fill an empty rows-by-columns matrix with integers 1 through rows*columns in clockwise spiral order. Reuse your boundary logic without duplicate writes.'),
  ('subsets-ii', 'Return only distinct subsets of size k. Preserve multiplicity limits and explain pruning when too few positions remain.'),
  ('subtree-of-another-tree', 'For a nonempty subRoot, count all matching subtree roots rather than returning a boolean. Matching occurrences can overlap and share values.'),
  ('sum-of-two-integers', 'Return both the wrapped signed 32-bit sum and whether signed overflow occurred. Continue avoiding addition and subtraction operators.'),
  ('surrounded-regions', 'Now diagonal adjacency also connects O cells. Adapt detection and explain a board where the new result differs from orthogonal adjacency.'),
  ('swim-in-rising-water', 'Return one route achieving the minimum required water level. Explain predecessor reconstruction and how the route''s maximum elevation verifies the answer.'),
  ('target-sum', 'Return one valid sequence of plus/minus choices in addition to the count. Preserve the distinction between assignments at zero-valued positions.'),
  ('task-scheduler', 'Construct one schedule achieving the minimum length, including explicit idle slots. Validate that identical labels are separated by at least n full slots.'),
  ('time-based-key-value-store', 'Permit set calls to arrive out of timestamp order, with a repeated key/timestamp replacing its old value. Explain your data structure and update/query costs.'),
  ('top-k-frequent-elements', 'When frequencies tie, prefer the numerically smaller value. Return results ordered by decreasing frequency and then increasing value. Implement the tie handling.'),
  ('trapping-rain-water', 'Also return the retained water amount at every index. Explain how the output requirement changes your space accounting and implement it.'),
  ('two-sum', 'Return every distinct index pair summing to target, rather than assuming one answer. Explain the output-sensitive cost and how repeated values are handled.'),
  ('two-sum-ii-input-array-is-sorted', 'Count all distinct index pairs summing to target when duplicates and multiple answers are allowed. Keep linear time and constant auxiliary space.'),
  ('valid-anagram', 'Extend the comparison to ignore ASCII letter case and spaces. Define normalization, then implement it without changing the multiplicity rule.'),
  ('valid-parenthesis-string', 'Return one concrete replacement for every star yielding a valid string, or an explicit failure. Explain why interval feasibility alone needs extra reconstruction state.'),
  ('valid-sudoku', 'Generalize the validator to a b*b by b*b board with b by b boxes and b*b distinct symbols. Define a symbol mapping and implement the region checks.'),
  ('validate-binary-search-tree', 'Allow duplicates only in right subtrees. Adjust bound inclusivity throughout the tree and explain why parent-only comparisons still fail.'),
  ('walls-and-gates', 'Also assign each reachable room one nearest gate''s coordinates, breaking equal-distance ties lexicographically by row then column.'),
  ('word-break', 'Return one valid segmentation as a list of words, or an explicit no-solution result. Avoid storing every possible segmentation.'),
  ('word-ladder', 'Return one shortest transformation chain rather than only its length. Explain predecessor storage and the no-solution result.'),
  ('word-search', 'Return one valid sequence of board coordinates when the word exists, otherwise an empty list. Preserve the board and prohibit reused cells.'),
  ('word-search-ii', 'For each found word return one valid sequence of cell coordinates. A coordinate may appear only once in that word''s path; words may share cells.')
) as authored(slug,prompt)
join public.problems problem on problem.source = 'leetcode' and problem.slug = authored.slug
where problem.interview_ready
on conflict (problem_id,content_version) do nothing;

do $$
begin
  if exists (
    select 1 from public.problems problem
    where problem.interview_ready and problem.source = 'leetcode'
      and not exists (select 1 from public.approved_interview_follow_ups follow_up
        where follow_up.problem_id = problem.id
          and follow_up.content_version = problem.interview_content_version
          and follow_up.active)
  ) then raise exception 'An interview-ready question has no matching follow-up'; end if;
end;
$$;
