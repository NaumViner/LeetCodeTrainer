# Adaptive recommendations

## Selection pipeline

The next-problem engine is a pure TypeScript domain calculation. It receives active problem metadata plus learner-owned evidence and performs four explicit steps:

```text
eligibility gates → score every eligible problem → rank → stable choice among near-equal leaders
```

Eligibility enforces problem-topic prerequisites and curriculum progression. Foundation work is always available. Guided, independent, timed, and interview-level problems require progressively stronger topic mastery, completed learning, and independent-solve evidence. A due review can re-enter the practice shortlist, but the UI starts it through review mode rather than creating an ordinary practice attempt.

## Score

Each result includes a complete score breakdown:

```text
weakness + due review + curriculum fit + prerequisite fit
+ topic balance + difficulty fit + interview urgency + novelty
- recent topic - repeated problem - frustration
```

Weakness uses smoothed topic mastery rather than a single result. Completed mock interviews update that same mastery record, so interview weaknesses automatically affect later recommendations. Due reviews receive a strong positive signal. Curriculum fit compares the candidate level with the learner's current evidence. Topic balance rewards topics absent from the five most recent attempts. Novelty rewards unseen problems, while recent and repeated-problem penalties prevent immediate loops.

Difficulty moves from easy/guided work toward independent, timed, and interview work only as mastery and independent solves increase. Two recent unsuccessful attempts in a topic force easy recovery preference and penalize medium or hard work. Repeated failures on the same problem add a separate penalty so the learner is not trapped on it.

Interview urgency is applied only within 30 days of a configured future interview date and favors independent, timed, or interview-level work without bypassing readiness gates.

## Controlled diversity and transparency

The engine ranks deterministically, then considers at most five candidates within 15 points of the leader. A stable hash of learner, UTC day, and completed-attempt count selects within that near-equal group. Refreshing does not reshuffle the choice, but equivalent recommendations can rotate across days or after new evidence.

The practice page shows the selected problem's adaptive score, up to three plain-language reasons, and the active safeguards. The score is a prioritization value, not a mastery percentage. Manual problem selection remains available and bypasses recommendation ranking without bypassing attempt security.

## Interview-first actions

The interview-first layer adds a separate deterministic action list. It prioritizes the weakest evaluated interview dimension, weak or under-covered interview topics, recurring signals, challenge-adjusted performance by difficulty, learning mastery, due review, and recent problem repetition. Actions can be a next interview, specific problem, topic drill, testing drill, complexity drill, communication drill, review, or lesson. A lesson appears only when both interview evidence and learning mastery indicate a knowledge gap.

Every action includes a target, one to three reasons, bounded triggering evidence, a direct route, priority, and estimated time. Interview actions also include suggested difficulty and duration. Hard is recommended only after direct Hard evidence or repeated, confident Medium evidence; one strong Easy interview is insufficient. Remediation is placed before the follow-up interview, and all setup choices remain manually available.

## Privacy

Recommendation evidence is read server-side from attempts, topic mastery, due reviews, completed lessons, and the learner profile. Every private table remains protected by its existing forced Row Level Security policy. The browser receives only the chosen problem, its reasons, and its score; it does not calculate or supply learner evidence.
