# Search boundaries without guesswork

## Why this pattern exists

Binary search uses a monotonic fact to eliminate half the remaining candidates. A stable boundary convention turns common off-by-one errors into mechanical decisions.

## Intuition

Maintain a search interval that is guaranteed to contain every possible answer. Each comparison proves one subinterval impossible.

## Recognition signals

- Sorted data.
- First or last occurrence.
- Minimum feasible or maximum valid answer.
- A yes/no predicate that changes only once.
- Constraints too large for a linear scan of the answer space.

## Closed-interval template

```text
left = 0, right = n - 1
while left <= right:
  mid = left + (right - left) // 2
  if target found: return mid
  if value too small: left = mid + 1
  else: right = mid - 1
```

For boundary search, store a candidate or use a half-open interval and return the converged boundary.

## Complexity

The candidate interval halves each iteration, giving `O(log n)` predicate evaluations and `O(1)` auxiliary space for an iterative search.

## Common mistakes

- Mixing closed and half-open update rules.
- Assigning `left = mid` when `mid` can equal `left`.
- Returning the last midpoint instead of the defined boundary.
- Using answer-space search without a monotonic predicate.

## Guided example

To find the first value at least `target`, treat “value is at least target” as the monotonic predicate. When true, keep `mid` as a possible boundary and search left; when false, discard `mid` and everything left of it.

## Recognition quiz

Identify the predicate for minimum shipping capacity, integer square root, and first bad version. Then say which side is known-invalid after each outcome.

## Practice mapping

- Direct: classic sorted-array search.
- Boundary: first and last position.
- Answer space: minimum feasible capacity.

## Checkpoint

What exact set of answers can still exist inside your interval after every update?
