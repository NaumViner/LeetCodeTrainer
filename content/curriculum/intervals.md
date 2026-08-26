# Overlap and ordering

## Overview

Sorting ranges by a useful endpoint makes overlap decisions local. Define whether endpoints are closed or half-open before writing comparisons.

## Recognition signals

Schedules, time ranges, merging, insertion, meeting rooms, and selecting non-overlapping work.

## Complexity

Sorting dominates at `O(n log n)`; the merge or selection scan is `O(n)`.

## Common mistakes and practice

Avoid inconsistent endpoint rules, sorting by an irrelevant boundary, or forgetting the final accumulated range. Practice merge intervals, insert interval, and meeting rooms.
