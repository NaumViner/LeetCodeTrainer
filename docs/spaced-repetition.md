# Spaced repetition

## Scheduling model

Every completed attempt schedules its problem for recall. The SM-2-inspired calculation is deterministic and depends on the attempt result, highest help level, confidence after the attempt, elapsed time relative to the problem estimate, retention evidence, and the prior failure streak.

Baseline intervals follow the product specification:

```text
Failed 1 day · full solution 1–2 days · pattern hint 2–4 days
Small hint 4–7 days · independent 7–14 days
Strong repeated independent recall 14–30 days
```

Failures reset repetition and increase the failure streak. Successful recall clears the streak and advances repetition. Quality updates a bounded easiness factor from 1.30 to 2.50. All date calculations start from the immutable attempt completion timestamp, which makes TypeScript and database tests reproducible.

## Atomic persistence

`problem_reviews` stores the current schedule per learner and problem. `review_events` is the immutable evidence trail for every schedule change, including the attempt mode, result, quality, performance, old and new interval, repetition, failure streak, and next review date.

Attempt completion remains the transaction boundary. Performance and mastery are calculated first; the review trigger then reads that frozen performance, updates the problem schedule, records the event, and synchronizes the earliest scheduled problem into `topic_mastery.next_review_at`. If any step fails, the attempt completion rolls back.

Both review tables use forced Row Level Security. Learners can read only their own rows and browser roles cannot insert, update, or delete schedules. Starting review mode also requires an existing learner-owned schedule for that problem.

## Review experience

`/review` separates work into Due now, Due today, and Upcoming using the learner's configured timezone. Each item combines four recall activities when evidence exists: solve the problem, recognize the pattern before notes, re-derive complexity, and recall the earlier mistake.

Review mode reuses the refresh-safe practice state machine. Earlier notes stay hidden until the learner saves a new pattern prediction. Planning then shows the previous result, help, time, correct pattern, takeaway, and mistakes for comparison. Completion immediately shows the adapted next interval. `/review/history` exposes every schedule decision and links back to the supporting attempt.
