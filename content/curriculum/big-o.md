# Complexity that guides decisions

## Why this pattern exists

Complexity describes how resource use changes as relevant inputs grow. It helps you compare solutions before implementation details distract from the main tradeoff.

## Intuition

Count repeated work, then keep the dominant growth term. A loop over `n` items is usually `O(n)`; nested independent loops are usually `O(n²)`; repeatedly halving a search range is `O(log n)`.

## Recognition signals

- The prompt provides large input limits.
- A solution repeats a scan or recomputes the same state.
- Sorting might simplify later work.
- One input dimension can grow independently from another.

## A practical template

1. Name each meaningful input variable.
2. Identify the most frequently executed operation.
3. Count sequential and nested work.
4. Include library-operation costs.
5. Report auxiliary space separately from output space.

## Complexity reference

- Hash lookup: expected `O(1)`, worst-case details usually unnecessary unless asked.
- Sorting `n` comparable items: `O(n log n)`.
- Heap push or pop: `O(log n)`.
- Balanced divide-and-conquer: often `O(n log n)`.

## Common mistakes

- Calling two consecutive loops `O(n²)`; they add to `O(n)`.
- Dropping a second independent variable: `O(n + m)` is more informative than `O(n)`.
- Ignoring recursion stack or copied slices.
- Describing complexity without connecting it to constraints.

## Guided example

To detect duplicates, comparing every pair costs `O(n²)` time and `O(1)` extra space. A set reduces expected time to `O(n)` while using `O(n)` extra space. That is a decision, not an automatic upgrade when memory is constrained.

## Practice mapping

Trace the cost of binary search, merge sort, a frequency map, and a recursive tree traversal. State which variables grow and what memory remains live at the peak.

## Checkpoint

Can you explain both the growth rate and the exact repeated work that creates it?
