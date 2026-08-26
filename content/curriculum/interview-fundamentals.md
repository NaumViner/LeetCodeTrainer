# The interview problem-solving loop

## Why this process exists

A coding interview evaluates how you reduce ambiguity and make engineering decisions, not only whether your final code passes. A repeatable loop protects you from rushing into the wrong problem.

## The loop

1. Restate the goal and ask about inputs, outputs, constraints, and edge cases.
2. Work through a small example.
3. Offer a correct baseline, including its complexity.
4. Identify the repeated work or limiting constraint.
5. Propose an improvement and name the invariant that keeps it correct.
6. Implement in small, narrated steps.
7. Trace normal, boundary, and adversarial cases.

## What good communication sounds like

Prefer decision-oriented narration: “A set lets me test whether we have seen this value in expected constant time, so the scan is linear.” Avoid reading each line of code aloud.

## Common mistakes

- Coding before confirming whether inputs are sorted or may be empty.
- Hiding a brute-force idea instead of using it to establish correctness.
- Optimizing without explaining the tradeoff.
- Saying “looks good” instead of tracing concrete cases.

## Guided example

For “find whether an array contains a duplicate,” first state the quadratic pair comparison. Then observe that it repeats membership work. Scan once with a set; if the value is already present, return true. The invariant is that the set contains exactly the values before the current index.

## Practice mapping

- Restatement: rewrite three prompts in your own words.
- Baseline: name a correct brute-force solution before optimizing.
- Testing: prepare empty, smallest-valid, typical, duplicate-heavy, and extreme-value cases.

## Checkpoint

Before typing, can you state the contract, a correct baseline, and what evidence would show your solution is correct?
