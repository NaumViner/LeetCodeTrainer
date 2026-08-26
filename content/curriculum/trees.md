# Purposeful tree traversal

## Why this pattern exists

Trees encode recursive hierarchy. Traversal is useful only after you define what information flows down to a node and what answer returns from its children.

## Intuition

Depth-first search follows one branch and naturally combines subtree results. Breadth-first search processes equal-depth nodes together and naturally finds shortest unweighted levels.

## Recognition signals

- Root-to-leaf paths.
- Subtree property or ancestor relationship.
- Height, diameter, or balance.
- Level order or nearest node by edge count.
- Hierarchical input.

## Recursive template

```text
solve(node):
  if node is null: return base value
  left = solve(node.left)
  right = solve(node.right)
  return combine(node, left, right)
```

Write the return contract first: height, validity, best path ending here, or another precise quantity.

## Complexity

A full traversal is `O(n)` time. Recursive DFS uses `O(h)` stack space, where `h` is tree height. BFS can hold `O(w)` nodes at the widest level.

## Common mistakes

- Mixing the number of nodes and edges when measuring depth.
- Using global mutable state when the answer can be returned.
- Recomputing subtree information.
- Choosing BFS solely because the input is a tree.

## Guided example

For maximum depth, define `depth(node)` as the number of nodes on the longest downward path starting at `node`. Null returns zero; a real node returns one plus the larger child depth.

## Recognition quiz

Choose DFS or BFS for maximum depth, right-side view, lowest common ancestor, and shortest path to a leaf. Explain the decision rather than naming the traversal.

## Practice mapping

- Recursive: maximum depth and balanced tree.
- Structural: invert or compare trees.
- BFS: level-order traversal.
- Combined state: tree diameter.

## Checkpoint

Can you state in one sentence exactly what your recursive function returns?
