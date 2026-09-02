# Mock interviews

## Experience

The Interview area starts a 30-, 45-, or 60-minute session through Coverage, Improvement, Learning, or Custom selection. Duration, Beginner/Tough FAANG persona, automatic/English/Hebrew interview language, and Python/Java coding language remain independent. Coverage balances incomplete or least-covered topics, Improvement samples the three weakest sufficiently evaluated topics, Learning uses adaptive readiness, and Custom uses an exact topic and difficulty. Every mode selects only active NeetCode 150 problems with matching approved prompt content and avoids recent or repeated problems when alternatives exist.

Recommendations guide the choice but do not grant access. If a topic/difficulty combination has no approved interview prompt, the setup form identifies that inventory gap and lets the learner choose another configuration without silently changing the request.

The expanded selection modes, embedded prompt, and enhanced coding workspace each have an independent server-side rollout control. A disabled selection rollout uses only adaptive Learning, a disabled prompt rollout keeps the canonical reference, and a disabled coding-workspace rollout provides a bounded plain Python/Java editor. Existing interview history remains readable in every configuration; see [interview-rollout.md](interview-rollout.md).

Setup shows the recommended difficulty and duration separately from the learner's actual selection. Choosing above the recommendation produces an informational warning only. Difficulty, duration, interviewer level, and language are persisted exactly on the interview row.

The active workspace deliberately hides topic and pattern metadata and provides no hints. A sticky, collapsible question panel remains available throughout the session. It renders the approved first-party prompt, public examples, and constraints as structured text, keeps code-like content left-to-right, and separates the external canonical reference from embedded content. The learner moves through the interview in order:

```text
intro → clarify → examples → brute force → optimization
→ implementation → testing → complexity → retrospective
```

The countdown is mandatory, cannot be paused, survives refreshes, and shows overtime without blocking completion. A syntax-aware CodeMirror workspace is available from Intro onward with a fixed Python or Java language, a 10,000-character scratchpad, and a 30,000-character code limit. It autosaves after a short debounce and on blur, exposes Saving/Saved/Save failed state, and uses a workspace version so an older browser tab cannot silently overwrite newer work.

During Implementation, the learner can send the current code for interviewer review without leaving the phase, or explicitly mark coding complete and move atomically to Testing. Both actions persist the latest code first and create an immutable submission snapshot containing the fixed language, version, phase, kind, elapsed time, and bounded source. The review disclosure states that the model may inspect the snapshot but does not run it and cannot claim that tests passed. Editing, saving, ordered phase transitions, and interview completion remain usable when realtime AI is unavailable.

The live **Interview process guide** acts as the learner's guiding star throughout the session. Exactly one phase is marked “You are here”; earlier phases are marked completed with a deterministic summary of captured notes, transcript/context references, code submissions, or complexity fields; the immediate successor is either “Suggested next” or “Needs confirmation”; and later phases remain future steps. This process history is distinct from the final scorecard. A realtime interviewer may suggest only the immediate successor, but the learner must still use the normal phase action to confirm the transition.

Interview notes, code, tests, and complexity reasoning persist at every transition. The topic and pattern are revealed only after completion.

## Scorecard and learning loop

Completion produces a private scorecard with 1–5 ratings for problem understanding, clarification, approach quality, optimization, correctness, code quality, testing, complexity reasoning, communication, and independence. Persisted phase evidence drives the criteria the application can assess; the retrospective supplies explicit ratings for qualities that require interviewer judgment. The result includes up to four strengths and four concrete improvements.

Completed and abandoned sessions remain available in Interview history. Each completion also creates a versioned post-interview evaluation: a configured provider can produce a completed evaluation, while missing, invalid, or unavailable provider output produces a clearly labeled deterministic provisional result. Learning mastery and interview performance are reported as separate readiness layers. The completed interview continues to smooth its legacy scorecard evidence into topic mastery during the backward-compatible migration period.

## Security and boundaries

Mock-interview data uses forced Row Level Security and own-row read policies. Browser roles cannot insert, update, or delete sessions, code submissions, or scorecards directly. Authenticated database functions enforce ownership, active-problem availability, fixed problem/difficulty agreement, allowed durations and interviewer levels, one active interview, exact phase order, elapsed-time monotonicity, workspace-version concurrency, field limits, and transactional code submission/scorecard creation. Practice and interview starts share a learner-scoped transaction lock so the two modes cannot overlap.

The initial interview-ready inventory contains one repository-authored, version-one prompt for each of the 18 canonical topics. Other catalog items remain metadata-only and cannot be selected by the versioned interview flow until approved content is added. The browser and realtime interviewer receive only learner-visible prompt text, constraints, and public examples. Expected invariants stay in the server-only evaluator boundary, and no private test data is sent to either consumer. Final learner and interviewer transcript turns are stored privately and appear on the completed scorecard.

Hebrew sessions instruct the interviewer to respond consistently in Hebrew while preserving natural English technical terms. Automatic mode follows the learner. Transcript and free-text reasoning fields use RTL for explicit Hebrew and automatic browser direction for automatic mode; code fields remain LTR and are never translated. The process guide uses semantic list and current-step attributes and does not rely on color alone to communicate state.
