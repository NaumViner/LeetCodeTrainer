# Mock interviews

## Experience

The Interview area starts a 30-, 45-, or 60-minute full-voice session through Coverage, Improvement, Learning, or Custom selection. Duration, Beginner/Tough FAANG persona, automatic/English/Hebrew interview language, and Python/Java coding language remain independent. Coverage balances incomplete or least-covered topics, Improvement samples the three weakest sufficiently evaluated topics, Learning uses adaptive readiness, and Custom uses an exact topic and difficulty. Every mode selects only active NeetCode 150 problems with approved prompt content and avoids recent or repeated problems when alternatives exist.

Recommendations guide the choice but do not override it. If an exact topic/difficulty has no approved prompt, setup reports the inventory gap instead of silently changing the request. Setup also explains every mode and option before start.

Mock interviews require a configured realtime voice provider, approved prompt content, and browser microphone access. There is no text or partially voiced mock-interview mode. Start creates a voice-pending session whose timer begins only after provider activation. Phase changes, code-review submission, coding completion, and interview completion require a current voice lease.

## Active workspace

The active workspace never reveals the question name, difficulty, topic, pattern, public examples, constraints, or external reference. Its order is fixed:

1. compact Guiding Star phase tiles at the top of the page;
2. always-visible approved question wording;
3. Live interviewer;
4. the six most recent completed learner/interviewer transcript turns;
5. Python or Java code editor and scratchpad.

The question card is not collapsible. The Live interviewer provides microphone, mute, speaking, connection, and reconnection state but no text box, live transcript, or “End voice” control.

The learner moves through the interview in order:

```text
intro → clarify → examples → brute force → optimization
→ implementation → testing → complexity → retrospective
```

Guiding Star tiles show only the phase name and visual/semantic state. They do not reveal phase descriptions, captured notes, summaries, or rubric evidence during the interview. Exactly one tile is current, earlier phases are completed, the immediate successor can be suggested or await confirmation, and later phases remain future.

The countdown cannot be paused, survives refreshes, and shows overtime without blocking completion. It starts at voice activation, not row creation. The code workspace is available from Intro onward with a fixed Python or Java language, a 10,000-character scratchpad, and a 30,000-character code limit. It autosaves with workspace-version conflict protection. Autosave remains usable during a temporary voice reconnect.

During Implementation, the learner can submit the current code for interviewer review or atomically mark coding complete and move to Testing. Both persist an immutable snapshot with language, version, phase, kind, elapsed time, and source. The disclosure states that the model inspects but does not run code and cannot claim that tests passed.

## Completion, Review, and scorecard

Interview notes, phase events, code submissions, tests, and complexity reasoning are persisted during the session but hidden from the learner while it is active. A security-definer RPC exposes only the six most recent completed learner/interviewer transcript turns for the owned active interview, including after refresh or reconnect. After completion, `/interviews/[interviewId]/review` provides the full post-interview process review, including phase evidence, scratchpad, final code, submissions, and transcript. Legacy completed interviews without preserved prompt content remain reviewable with an explicit legacy-content notice.

The scorecard remains separate from Review. It contains 1–5 ratings for problem understanding, clarification, approach quality, optimization, correctness, code quality, testing, complexity reasoning, communication, and independence, plus bounded strengths and improvements. A configured evaluator can produce a completed evaluation; missing or invalid provider output produces a labeled deterministic provisional result.

Question names are not shown in mock-interview setup results, the active workspace, history, scorecard, Review, or delete confirmation. Topic and performance summaries may be shown only where the post-interview product contract allows them.

Completed and abandoned sessions remain in history and may be deleted by their owner. Deletion cascades every associated event, transcript turn, workspace, code snapshot, scorecard, evaluation, and selection record, then rebuilds mutable mastery state so the deleted interview no longer affects coverage, weakness ranking, readiness, or profile history. A never-activated voice-pending session is cancelled rather than retained.

## Security and boundaries

Mock-interview data uses forced Row Level Security. Browser roles cannot directly mutate sessions, workspaces, submissions, events, scorecards, or evaluations. Active raw interview rows and evidence are not browser-readable; ownership-checking RPCs expose only a sanitized active snapshot with an opaque prompt-content key. Prompt resolution stays server-side.

Authenticated functions enforce ownership, active inventory, fixed selection, allowed durations/personas/languages, one active interview, exact phase order, voice activation and lease, elapsed-time monotonicity, workspace-version concurrency, field limits, and transactional completion. Practice and interview starts share a learner-scoped lock so they cannot overlap.

The initial interview-ready inventory contains one repository-authored prompt for each of the 18 canonical topics. Provider instructions and the active browser receive only approved question wording. Evaluator invariants and private tests remain server-only. The provider receives submitted code only through the bounded review context.

Hebrew sessions instruct the interviewer to answer consistently in Hebrew while preserving natural English technical terms. Automatic mode follows the learner. Free text uses RTL for explicit Hebrew and automatic browser direction otherwise; code stays LTR. Guiding Star uses semantic list/current-step attributes and does not rely on color alone.
