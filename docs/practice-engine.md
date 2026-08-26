# Practice engine

## Workflow

The selected problem exists before an attempt begins. Starting creates one private active attempt in `pre_attempt`; a partial unique database index prevents a learner from opening a second active session. The persisted phases are:

```text
PRE_ATTEMPT → PLANNING → CODING → TESTING → REFLECTION → COMPLETED
```

The practice route always resumes an active attempt before offering another recommendation. Every transition saves its durable fields, so refreshing or changing devices does not discard the session.

## Recommendation baseline

Phase 5 uses deterministic scoring rather than random selection. It prioritizes problems with fewer completed attempts, keeps foundation work available, requires completed learning in a topic before guided work from that topic, favors topics with completed lessons, orders by curriculum level and dataset position, and uses a small stable learner-specific tie-breaker.

This baseline intentionally does not claim mastery or retention knowledge. Phase 6 will add performance and weakness signals; Phase 7 will add review urgency and spaced repetition.

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

Completion currently finalizes the attempt record in one database update. Mastery, review scheduling, mistakes aggregation, daily-plan updates, analytics, and full attempt history are deliberately introduced in their dedicated later phases.
