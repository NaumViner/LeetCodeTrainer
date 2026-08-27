# Mock interviews

## Experience

The Interview area starts a 30-, 45-, or 60-minute session. Difficulty can be adaptive or fixed to easy, medium, or hard. Adaptive selection uses the existing learner-aware ranking and avoids recently interviewed problems where possible.

The active workspace deliberately hides topic and pattern metadata and provides no hints. The learner moves through the interview in order:

```text
intro → clarify → examples → brute force → optimization
→ implementation → testing → complexity → retrospective
```

The countdown is mandatory, cannot be paused, survives refreshes, and shows overtime without blocking completion. Interview notes, code, tests, and complexity reasoning persist at every transition. The topic and pattern are revealed only after completion.

## Scorecard and learning loop

Completion produces a private scorecard with 1–5 ratings for problem understanding, clarification, approach quality, optimization, correctness, code quality, testing, complexity reasoning, communication, and independence. Persisted phase evidence drives the criteria the application can assess; the retrospective supplies explicit ratings for qualities that require interviewer judgment. The result includes up to four strengths and four concrete improvements.

Completed and abandoned sessions remain available in Interview history. Scorecard averages contribute an interview-execution dimension to readiness. The completed interview also smooths evidence into topic mastery, so a weak area can receive higher priority from the existing adaptive recommender.

## Security and boundaries

Mock-interview data uses forced Row Level Security and own-row read policies. Browser roles cannot insert, update, or delete sessions or scorecards directly. Authenticated database functions enforce ownership, one active interview, exact phase order, elapsed-time monotonicity, field limits, and transactional scorecard creation. Practice and interview starts share a learner-scoped transaction lock so the two modes cannot overlap.

Only public catalog metadata is stored; the problem statement remains at its canonical LeetCode URL. Live interviewer conversation and voice are intentionally reserved for the later realtime interview phase.
