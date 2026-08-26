# Choosing specialized graph tools

## Overview

Traversal is only the beginning. Match edge semantics and constraints to topological sorting, union-find, Dijkstra, or minimum-spanning-tree methods.

## Recognition signals

Dependency ordering, weighted shortest paths, dynamic connectivity, and minimum total connection cost.

## Complexity

State complexity for the chosen representation and tool—for example, Dijkstra with a binary heap is commonly `O((V + E) log V)`.

## Common mistakes and practice

Do not use ordinary BFS for arbitrary positive weights or ignore stale heap entries. Practice course schedule, network delay, redundant connection, and minimum-cost connection.
