# Practice engine

## Workflow

The selected problem exists before an attempt begins. Starting creates one private active attempt in `pre_attempt`; a partial unique database index prevents a learner from opening a second active session. The persisted phases are:

```text
PRE_ATTEMPT → PLANNING → CODING → TESTING → REFLECTION → COMPLETED
```

The practice route always resumes an active attempt before offering another recommendation. Every transition saves its durable fields, so refreshing or changing devices does not discard the session.

## Adaptive recommendation

Phase 8 scores eligible problems from learner mastery, due reviews, completed learning, prerequisites, recent topics, prior problem attempts, difficulty evidence, repeated failure, and interview date. Foundation remains available, while guided, independent, timed, and interview work require progressively stronger evidence.

Recent topic and problem penalties prevent repetitive loops. Repeated unsuccessful work backs down to an easy related recovery problem instead of escalating difficulty. A due selected problem starts through review mode. Near-equal leaders use a stable learner-day choice so refreshes do not reshuffle the page.

The practice page shows the adaptive prioritization score and plain-language reasons. This number is not a mastery percentage; it only explains relative selection for the current evidence.

## Timer

The database stores accumulated seconds plus whether the timer is running and the server timestamp at which the current run began. On load, the server reconstructs effective elapsed time. Start, pause, reset, and each workflow transition persist timer state; entering reflection stops it.

## Progressive help

Hints advance in six stages: Socratic question, concept nudge, pattern reveal, structural guidance, pseudocode scaffold, and full pattern explanation. They are generated from locally authored educational metadata and never copy the third-party problem statement.

Every revealed hint is stored in order. A database trigger updates the attempt's highest help level automatically. Independence weights live in one domain configuration:

```text
none 1.00 · small 0.90 · concept 0.80 · pattern 0.65
pseudocode 0.45 · full solution 0.20 · copied 0.05
```

## Security and completion

Server Actions treat typed arguments as untrusted, validate them with Zod, re-authenticate the learner, and scope every write to the verified user ID. Forced RLS is the final ownership boundary. Database checks prevent an active attempt from carrying a result or completion timestamp, require completed attempts to contain a valid result, and keep timer fields consistent.

Completion finalizes the attempt record in one database update. In that same transaction, Phase 6 creates the immutable performance snapshot and updates topic mastery, then Phase 7 adapts the problem's review schedule and appends its immutable schedule event. Mistake aggregation and full attempt history remain derived from completed records without duplicating learner input.

Review mode uses the same persisted state machine. It withholds hints and previous-attempt notes until the learner saves a fresh pattern prediction, then exposes the earlier result, assistance, time, pattern, takeaway, and mistakes for comparison.
