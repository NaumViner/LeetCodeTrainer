# Coordinated indices

## Why this pattern exists

Two pointers exploit order or controlled mutation so each index moves only forward or inward. This often replaces testing every pair.

## Intuition

At each step, use an invariant to prove one pointer movement cannot discard a valid answer. Pointer movement is a correctness decision, not a memorized ritual.

## Recognition signals

- Sorted input and a pair condition.
- Opposite ends, palindrome, or container boundaries.
- In-place removal or partition.
- Merge two ordered sequences.
- Fast and slow movement through the same data.

## Basic templates

```text
left = 0, right = n - 1
while left < right:
  evaluate pair
  move the only boundary that can improve the result
```

For compaction, use a read pointer to inspect and a write pointer to maintain the valid prefix.

## Complexity

When each pointer crosses the input at most once, time is `O(n)`. In-place variants often use `O(1)` auxiliary space.

## Common mistakes

- Moving both pointers when only one move is justified.
- Using `left <= right` without deciding whether one item is a valid pair.
- Overwriting an unread value during in-place work.
- Applying opposite-end pointers to unsorted data without an ordering invariant.

## Guided example

For a target sum in a sorted array, compare the endpoint sum. If it is too small, every pair using the current left value and a smaller right value is also too small, so increment left. The symmetric argument moves right when the sum is too large.

## Recognition quiz

Which invariant supports palindrome validation, sorted pair sum, and stable duplicate removal? Notice that each uses a different pointer relationship.

## Practice mapping

- Easy: valid palindrome.
- Medium: three-sum after sorting.
- In-place: remove duplicates from a sorted array.
- Review: articulate why each pointer move is safe.

## Checkpoint

Can you prove that the region discarded by a pointer move contains no needed answer?
