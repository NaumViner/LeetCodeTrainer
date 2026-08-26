# Implementation foundations

## Why this module exists

An algorithm can be correct on paper and still fail because collection semantics or state changes are unclear. Strong fundamentals make the implementation match the reasoning.

## Core tools

- Arrays provide indexed, ordered storage.
- Sets answer membership questions.
- Maps associate keys with counts, locations, or grouped values.
- Queues process work in arrival order.
- Functions isolate a clear contract.
- Recursion solves a problem through smaller instances with a base case.

## State-tracing template

For every important variable, say what it means after each iteration. For example: “After index `i`, `seen` contains values from indices `0...i`.”

## Recursion template

1. Define what the function returns for one subproblem.
2. Write the smallest valid base case.
3. Make progress toward that base case.
4. Combine the smaller answer without changing its meaning.

## Common mistakes

- Mutating a collection while assuming its iteration stays unchanged.
- Using a vague variable like `temp` without an invariant.
- Sharing mutable recursion state unintentionally.
- Omitting null, empty, or one-item cases.

## Guided example

To build a frequency map, initialize an empty map and scan values once. After processing each value, increment its stored count. The invariant is that the map exactly represents the processed prefix.

## Complexity

Collection choice affects both time and space. An extra map may turn repeated linear searches into expected constant-time lookups at the cost of `O(n)` memory.

## Practice mapping

Implement frequency counting, stable filtering, queue-based breadth-first traversal, and factorial with an explicit recursion contract.

## Checkpoint

Can another person infer each variable’s meaning without simulating the entire program?
