# Stack invariants

## Why this pattern exists

A stack keeps the most recent unresolved item accessible. It naturally models nested structure, deferred work, and candidates that become obsolete in reverse order.

## Intuition

State what every item in the stack represents. In a monotonic stack, also state the ordering invariant from bottom to top.

## Recognition signals

- Matching or nested delimiters.
- Undo, path simplification, or expression evaluation.
- Next greater or smaller element.
- Nearest boundary.
- Items resolved when a later value arrives.

## Basic template

```text
for each item:
  while stack top is resolved by item:
    pop and produce its answer
  push the information needed later
```

Store indices when distance or original position matters; store values when only the value matters.

## Complexity

Although one iteration may pop many entries, each entry is pushed and popped at most once. The total is `O(n)` time and `O(n)` space.

## Common mistakes

- Popping before extracting the information needed for the answer.
- Storing values when duplicate positions must be distinguished.
- Forgetting entries still unresolved after the scan.
- Claiming the nested while loop makes a monotonic stack quadratic.

## Guided example

For daily temperatures, keep indices whose warmer day is unknown in decreasing temperature order. A warmer current day resolves every cooler index on top; the index difference is its waiting time.

## Recognition quiz

What does the stack contain for valid parentheses, next greater element, and expression evaluation? The data differs, but “most recent unresolved work” remains.

## Practice mapping

- Easy: valid parentheses.
- Medium: daily temperatures.
- Structural: decode string.
- Review: prove the amortized linear bound.

## Checkpoint

Can you complete the sentence: “Every item in this stack is still waiting for…”?
