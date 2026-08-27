# Initial diagnostic

## Experience

Profile setup now continues to `/diagnostic` before the first dashboard visit. The diagnostic has two visible steps:

1. Five concept questions cover complexity, arrays and maps, recursion, trees, and graph traversal. Three synthetic prompts check first-approach pattern recognition.
2. The database grades those responses and assigns one foundation, two intermediate, or three advanced coding-reasoning problems. Beginners are never assigned the advanced tier solely because of a lucky response set.

The coding problems assess implementation invariants with language-neutral choices. This keeps the initial diagnostic deterministic and accessible across every supported coding language; the regular practice workspace remains the place for full code attempts, timers, hints, and reflection.

After completion, the results page reports concept, pattern, coding, and overall scores plus a conservative `foundation`, `developing`, or `independent` starting level. Untested topics remain unknown rather than receiving invented scores.

## Trusted scoring and persistence

The browser submits only question IDs and selected option tokens. Correct answers live in a private database table with no browser read permission. Authenticated database functions validate the exact required question set, grade responses, choose the coding tier, and finalize the assessment.

`diagnostic_attempts` stores the assigned tier, immutable question IDs, section scores, overall score, placement, and lifecycle timestamps. `diagnostic_responses` stores learner-owned response evidence. Both tables use forced Row Level Security and expose own-row reads only; browser insert, update, and delete privileges are revoked.

Completion is one transaction: coding responses are graded, the diagnostic is finalized, the protected profile completion fields are set, and initial `topic_mastery` rows are inserted. Diagnostic baselines are deliberately bounded and preserve neutral retention and speed values until real practice provides evidence. A later attempt can refine these rows through the existing smoothed mastery model.

## Adaptation rules

- Strong concept and pattern results plus relevant prior experience select three advanced problems.
- A developing concept/pattern baseline selects two intermediate problems.
- Beginners and weak baselines receive one foundation problem.
- Overall placement weights concepts at 30%, patterns at 30%, and coding at 40%.
- Scores below 50 start at foundation building, 50–74.99 at guided development, and 75 or higher at independent practice.

These levels control the starting estimate; they are not predictions of interview outcomes or permanent labels.
