# Safe pointer rewiring

## Why this pattern exists

Linked-list operations change relationships instead of shifting indexed storage. A few explicit invariants prevent losing nodes or dereferencing invalid links.

## Intuition

Before changing a link, save every path you still need. A sentinel node provides a stable predecessor when the real head may change.

## Recognition signals

- Reverse or reorder nodes in place.
- Detect a cycle or find a middle.
- Merge sorted chains.
- Remove the first or nth node.
- Constant auxiliary space is requested.

## Reversal template

```text
previous = null
current = head
while current:
  following = current.next
  current.next = previous
  previous = current
  current = following
```

The invariant is that `previous` heads the fully reversed processed prefix and `current` heads the untouched remainder.

## Complexity

Most single-pass list operations are `O(n)` time and `O(1)` auxiliary space. Recursive traversal uses `O(n)` call-stack space.

## Common mistakes

- Reassigning `current.next` before saving the remainder.
- Repeating special cases for the head instead of using a sentinel.
- Advancing a fast pointer without checking both required links.
- Comparing node values when identity determines a cycle.

## Guided example

To remove the nth node from the end, start fast and slow at a sentinel. Advance fast `n + 1` steps, then move both until fast reaches null. Slow is now the predecessor of the node to remove.

## Recognition quiz

When should two pointers move at different speeds, with a fixed gap, or through separate lists?

## Practice mapping

- Easy: reverse a list.
- Medium: reorder a list.
- Pointer gap: remove nth from end.
- Review: draw every link before and after one loop iteration.

## Checkpoint

After each assignment, do you still have a reference to every unprocessed node?
