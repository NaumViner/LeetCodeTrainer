# Top-k and changing priorities

## Overview

A heap keeps one extreme available while supporting incremental updates. Use a min-heap of size `k` to retain the `k` largest values, or the symmetric max-heap for the `k` smallest.

## Recognition signals

Top `k`, kth largest or smallest, streaming extrema, and repeatedly selecting the next best candidate.

## Complexity

Building a heap can be `O(n)`; each push or pop is `O(log n)`. A bounded top-`k` heap costs `O(n log k)` time and `O(k)` space.

## Common mistakes

Choosing the wrong heap direction, keeping all values when only `k` matter, and claiming heap operations are constant time.

## Guided example and practice

For the kth largest value, keep a min-heap capped at `k`; its root is the smallest retained candidate. Practice kth largest in a stream and task scheduling.
