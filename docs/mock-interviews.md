# Mock interviews

## Experience

The Interview area starts a 30-, 45-, or 60-minute session. Difficulty can be adaptive or fixed to easy, medium, or hard, and duration remains independent of difficulty. Interview language is independently selectable as automatic, English, or Hebrew; it never changes the preferred coding language or source code. Adaptive selection uses learner eligibility and ranking. A fixed difficulty selects from the complete active catalog at that difficulty, regardless of learning progression; adaptive scores only order those candidates. Both policies avoid recently interviewed problems when alternatives exist.

Recommendations guide the choice but do not grant access. Every available difficulty, duration, and interviewer-level option remains enabled. If a requested difficulty has no active inventory, the setup form shows a recoverable message and lets the learner choose another configuration.

Setup shows the recommended difficulty and duration separately from the learner's actual selection. Choosing above the recommendation produces an informational warning only. Difficulty, duration, interviewer level, and language are persisted exactly on the interview row.

The active workspace deliberately hides topic and pattern metadata and provides no hints. The learner moves through the interview in order:

```text
intro → clarify → examples → brute force → optimization
→ implementation → testing → complexity → retrospective
```

The countdown is mandatory, cannot be paused, survives refreshes, and shows overtime without blocking completion. Interview notes, code, tests, and complexity reasoning persist at every transition. The topic and pattern are revealed only after completion.

## Scorecard and learning loop

Completion produces a private scorecard with 1–5 ratings for problem understanding, clarification, approach quality, optimization, correctness, code quality, testing, complexity reasoning, communication, and independence. Persisted phase evidence drives the criteria the application can assess; the retrospective supplies explicit ratings for qualities that require interviewer judgment. The result includes up to four strengths and four concrete improvements.

Completed and abandoned sessions remain available in Interview history. Each completion also creates a versioned post-interview evaluation: a configured provider can produce a completed evaluation, while missing, invalid, or unavailable provider output produces a clearly labeled deterministic provisional result. Learning mastery and interview performance are reported as separate readiness layers. The completed interview continues to smooth its legacy scorecard evidence into topic mastery during the backward-compatible migration period.

## Security and boundaries

Mock-interview data uses forced Row Level Security and own-row read policies. Browser roles cannot insert, update, or delete sessions or scorecards directly. Authenticated database functions enforce ownership, active-problem availability, fixed problem/difficulty agreement, allowed durations and interviewer levels, one active interview, exact phase order, elapsed-time monotonicity, field limits, and transactional scorecard creation. Practice and interview starts share a learner-scoped transaction lock so the two modes cannot overlap.

Only public catalog metadata is stored; the problem statement remains at its canonical LeetCode URL. When the realtime feature is configured, voice remains optional and attaches to this same state machine. The interviewer receives only topic-free problem metadata, the current phase, submitted phase evidence, and code snapshots. Final learner and interviewer transcript turns are stored privately and appear on the completed scorecard.

Hebrew sessions instruct the interviewer to respond consistently in Hebrew while preserving natural English technical terms. Automatic mode follows the learner. Transcript and free-text reasoning fields use RTL for explicit Hebrew and automatic browser direction for automatic mode; code fields remain LTR and are never translated.
