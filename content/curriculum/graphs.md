# Graph traversal and visited state

## Why this pattern exists

Graphs model arbitrary relationships: roads, dependencies, accounts, grids, and transformations. Traversal turns local connections into reachability, distance, and component information.

## Intuition

Build or infer neighbors, then process each reachable node once. DFS is natural for exhaustive exploration; BFS is natural for shortest paths measured in unweighted edges.

## Recognition signals

- Nodes connected by pairs or rules.
- Reachability, routes, or transformations.
- Connected groups or islands.
- A grid where movement defines edges.
- Dependencies that may contain cycles.

## Traversal template

```text
frontier = start
mark start visited
while frontier not empty:
  node = remove next
  for neighbor of node:
    if neighbor not visited:
      mark visited
      add neighbor
```

Mark when adding to the frontier so the same node is not queued repeatedly.

## Complexity

With adjacency lists, a full traversal is `O(V + E)` time and `O(V)` auxiliary space. Grid traversal is `O(rows × columns)`.

## Common mistakes

- Marking visited only after removing a node.
- Assuming every graph is connected.
- Treating directed edges as undirected.
- Mutating a grid without deciding whether the input may change.

## Guided example

To count islands, scan every cell. When an unvisited land cell appears, increment the component count and traverse all connected land, marking it visited. Each cell is processed a constant number of times.

## Recognition quiz

Choose DFS or BFS for component counting, shortest word transformation, cycle detection, and copying a graph. State what visited means in each problem.

## Practice mapping

- Grid: number of islands.
- Copying structure: clone graph.
- Multi-source BFS: rotting oranges.
- Directed reasoning: course schedule.

## Checkpoint

What constitutes a node, what creates an edge, and when exactly does a node become visited?
