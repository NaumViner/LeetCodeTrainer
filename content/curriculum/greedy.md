# When a greedy choice is safe

## Overview

A greedy algorithm commits to a local choice without revisiting it. It is correct only when an exchange or staying-ahead argument shows an optimal solution can include that choice.

## Recognition signals

Maximize the number of compatible items, earliest finish time, or a one-pass choice whose alternatives can be exchanged safely.

## Complexity

Many greedy solutions sort in `O(n log n)` and scan in `O(n)`.

## Common mistakes and practice

A plausible heuristic is not a proof. Look for counterexamples when choices affect future feasibility. Practice interval scheduling and jump game, explaining why each commitment is safe.
