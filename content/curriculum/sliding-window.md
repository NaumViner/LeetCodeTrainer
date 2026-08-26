# Maintaining a useful window

## Why this pattern exists

Contiguous-range problems often compare many overlapping candidates. A sliding window keeps the shared work and updates only what enters or leaves.

## Intuition

The window represents a contiguous interval. Its supporting state—sum, counts, distinct values, or constraint violations—must describe exactly that interval.

## Recognition signals

- Subarray or substring.
- Longest, shortest, maximum, or minimum contiguous range.
- At most or exactly `k`.
- A fixed-length range.
- Positive values with a monotonic expand/shrink condition.

## Basic templates

For a fixed size, add the new right value and remove the value that falls left of the window. For a variable size, expand right, then shrink left in a `while` loop until the invariant is valid.

```text
for right in input:
  add right to state
  while window is invalid:
    remove left from state
    left += 1
  update the answer
```

## Complexity

Each element enters and leaves at most once, so a variable window is usually `O(n)` time. Supporting counts may require `O(k)` or `O(n)` space.

## Common mistakes

- Recomputing the full window after every move.
- Shrinking once with `if` when multiple removals are required.
- Recording the answer while the window is invalid.
- Using a window when negative values destroy the needed monotonic behavior.

## Guided example

For the longest substring without repeats, expand right and count characters. While the new character appears more than once, remove characters from the left. Once valid, the current length is a candidate.

## Recognition quiz

Would a fixed window, variable window, or prefix sum best fit: maximum average of length `k`, longest substring with at most two distinct characters, and count of ranges with an exact arbitrary sum?

## Practice mapping

- Fixed: maximum sum of a length-`k` subarray.
- Variable: longest repeating-character replacement.
- Advanced: minimum window substring.

## Checkpoint

Does your maintained state describe exactly the current `[left, right]` interval?
