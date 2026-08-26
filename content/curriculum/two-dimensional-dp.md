# Two-coordinate states

## Overview

Use two-dimensional DP when a subproblem depends on two independently changing coordinates, such as a grid location or prefixes of two strings.

## Recognition signals

Grid paths, alignment of two strings, edit operations, and decisions indexed by both position and remaining capacity.

## Complexity

A table with `n × m` states costs `O(nm)` before considering transition work. Rows can sometimes be compressed when only the previous row is needed.

## Common mistakes and practice

Define whether indices represent items or prefix lengths, then size base rows and columns consistently. Practice unique paths, longest common subsequence, and edit distance.
