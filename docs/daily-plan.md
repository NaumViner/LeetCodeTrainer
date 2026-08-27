# Daily plan

## Generation

The daily-plan generator is a deterministic domain function. It combines the learner's available minutes, local date, due reviews, prerequisite-ready lessons, adaptive problem rankings, same-day workload, and interview date into three to six tasks.

The normal allocation is:

```text
Review 20% · learning 25% · problem solving 45% · reflection 10%
```

Within 30 days of an interview, review receives 25%. Within 14 days, problem solving increases to 50% and learning decreases to 15%. Eligibility still comes from the curriculum and adaptive recommendation safeguards, so urgency never unlocks unsupported advanced work.

Overdue and due-today reviews enter first. One next lesson and at least one adaptive problem are included when available. Longer days add a second problem, then another review or problem, up to six tasks. Every plan ends with reflection. Time is assigned in five-minute blocks and never exceeds the remaining daily budget.

Same-day completed lesson estimates and attempt duration are subtracted during regeneration, while at least 30 minutes of useful remaining work is preserved. The default daily budget is the learner's weekly study minutes divided across seven days, rounded down to five-minute blocks and bounded from 30 to 180 minutes.

## Persistence and regeneration

`daily_plans` stores one active or completed version for a learner's local date. `daily_plan_items` stores the task type, source entity, title, scheduled minutes, priority, position, action path, reason, and completion state.

Generation calls one authenticated database function. It takes an advisory transaction lock for the learner and date, expires the earlier active version, inserts the next generation, validates three to six items and the total time budget, verifies lesson and problem entities, and commits atomically. Old versions remain immutable history rather than being overwritten.

Item completion uses a second authenticated function. It can change only a learner-owned, non-expired item and automatically moves the parent plan between active and completed. Browser roles have no direct insert, update, or delete grants on either table.

## Experience

`/plan` lets the learner generate or regenerate today's plan with a 30–240 minute budget, open each task, mark it complete, reopen it, and see overall progress. The dashboard shows the current plan, first three tasks, planned minutes, and completion progress. The date is derived using the learner's configured IANA timezone.
