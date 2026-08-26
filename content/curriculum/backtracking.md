# Decision trees and clean state

## Why this pattern exists

Some problems ask for all valid choices or require searching combinations under constraints. Backtracking explores a decision tree while sharing only the state on the current path.

## Intuition

At each level, choose one option, recurse into the remaining problem, then undo the choice. Pruning stops a branch as soon as it cannot lead to a valid answer.

## Recognition signals

- Generate all combinations, permutations, or partitions.
- Fill a structure under constraints.
- “Choose any available option” at each step.
- The output itself can be exponential.

## Basic template

```text
search(path, remaining):
  if solution complete:
    save a copy of path
    return
  for each allowed choice:
    choose
    search(updated state)
    unchoose
```

## Complexity

State the size of the decision tree and the cost to copy each answer. Exponential time is often unavoidable when the output is exponential; pruning improves explored work without changing the broad worst case.

## Common mistakes

- Saving a reference to a mutable path instead of a copy.
- Forgetting to undo shared state.
- Generating duplicates when equal choices exist.
- Copying large state at every level when reversible mutation is clearer.

## Guided example

For subsets, each input value creates two branches: exclude it or include it. When the index reaches the input length, save the current path. The path always represents choices made for the processed prefix.

## Recognition quiz

Compare subsets, permutations, and combination sum. What is the decision at each level, and can a choice be reused?

## Practice mapping

- Easy structure: subsets.
- Ordering: permutations.
- Pruning: combination sum.
- Constraint search: word search.

## Checkpoint

After returning from recursion, is shared state exactly as it was before the choice?
