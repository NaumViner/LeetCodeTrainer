# Lookups, counting, and grouping

## Why this pattern exists

Many array problems are slow only because they repeatedly ask whether something was seen, how often it appeared, or where it occurred. A set or map stores that summary during one scan.

## Intuition

Trade memory for information about the processed prefix. Decide what fact would make the current item easy to handle, then store exactly that fact.

## Recognition signals

- Duplicate, distinct, frequency, or anagram.
- Find a pair or complement.
- Group values by a derived key.
- Repeated membership checks.
- Preserve an index for a later answer.

## Basic template

```text
state = empty map or set
for each item:
  ask the question using existing state
  update state for future items
```

The query/update order matters when the same item must not pair with itself.

## Complexity

A single scan with expected constant-time hash operations is `O(n)` time and up to `O(n)` auxiliary space. Sorting may offer `O(n log n)` time with less extra memory and deterministic ordering.

## Common mistakes

- Storing more information than the answer requires.
- Updating before checking when current and prior items must differ.
- Assuming hash-map iteration order is meaningful.
- Forgetting collision behavior is abstracted, not magically absent.

## Guided example

For two sum, scan each value `x`. Before storing `x`, ask whether `target - x` already has an index. If so, the two distinct positions form the answer. Otherwise store the current index.

## Recognition quiz

Would a set, map, sorting, or direct-address array best fit: duplicate detection, character frequencies, grouping anagrams, and finding the first repeated index?

## Practice mapping

- Easy: duplicate detection and valid anagram.
- Medium: group anagrams and longest consecutive sequence.
- Review: explain when sorting is preferable to hashing.

## Checkpoint

What precise fact does your hash structure preserve after each iteration?
