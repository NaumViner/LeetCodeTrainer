# Realtime Interview Continuity and Control — Implementation Action Plan

## 1. Purpose

This document is an implementation contract for an LLM or engineer changing the full-voice mock-interview experience. It addresses four connected product failures:

1. Guiding Star remains on Intro even when the spoken interview has progressed.
2. Tough FAANG advances after an incomplete or internally inconsistent solution explanation.
3. Tough FAANG always asks a follow-up, regardless of remaining time or whether another question adds useful evidence.
4. A failed voice connection can create a fresh interviewer that repeats the opening and forgets the completed primary question or follow-up.

The work must change durable interview state, provider tools, server validation, reconnect behavior, UI state, and post-interview Review. A prompt-only fix is explicitly insufficient.

## 2. Evidence and current failure

The observed interview contained 18 learner turns, 20 interviewer turns, and two connection events. After the second connection, the interviewer repeated the exact opening three times:

> I have pasted the problem on the board. What are your clarifying questions?

The persisted conversation had already reached implementation, testing, complexity, and a follow-up. Nevertheless:

- the authoritative workflow phase remained `intro`;
- every transcript event was tagged `intro`;
- no accepted conversational-phase observation existed;
- reconnect created a new Gemini session and sent `SYSTEM START`;
- the new session received neither the completed-question state nor the follow-up wording;
- the standalone `gemini-3.5-flash` phase classifier returned HTTP 429 after exhausting the free-tier request quota.

The current classifier performs one additional model request for every completed utterance. This is not operationally viable: one ordinary interview can consume dozens of requests, while live voice itself already processes every utterance.

## 3. Target product behavior

### 3.1 Guiding Star

- The active phase is derived from the spoken conversation, not from manual form progression.
- Every learner utterance is analyzed by the live interviewer as part of its existing live session.
- The live model reports a stage only when its interpretation changes; this must not create a second model request.
- Exactly one phase tile is active when a trustworthy stage is known.
- Skips and backward movement are allowed.
- A lit phase reports current activity only. It does not mean the phase was completed or completed well.
- During a follow-up, the same phase tiles may be reused, but the UI must clearly label the active cycle as `Primary question` or `Follow-up`.
- When tracking is unavailable, show a neutral `Stage tracking unavailable` or `Reconnecting stage tracking` state. Do not falsely leave Intro lit.

### 3.2 Tough FAANG solution verification

- Tough FAANG remains neutral, concise, non-encouraging, and does not reveal hints or solutions.
- Toughness must not mean passive acceptance.
- The interviewer may not request implementation until the learner has presented a complete, coherent solution.
- The interviewer must internally verify the complete algorithm, required state/data structures, operation order, correctness invariant or sufficient correctness argument, central edge-case handling, and matching time/space complexity.
- Missing information results in a neutral request to complete the explanation, not a hint.
- Contradictory or likely incorrect logic results in an adversarial input or dry-run request, without explaining the defect.
- The interviewer must not say that an approach is correct merely because the readiness gate was passed.

### 3.3 Follow-up and conclusion policy

- A follow-up may start only when the server calculates at least 600 seconds remaining at the decision point.
- `600` seconds is allowed; `599` seconds is rejected.
- Having at least ten minutes makes a follow-up eligible, not mandatory.
- The interviewer may conclude after the primary question even when more than ten minutes remain.
- Below ten minutes, the interviewer must conclude rather than start a new follow-up.
- At most one follow-up is allowed.
- After a follow-up is completed, the interviewer must conclude.
- The server, not the model or browser clock, is authoritative for remaining time and follow-up eligibility.
- The interviewer must always have a structured `conclude_interview` option.

### 3.4 Reconnect continuity

- Only the first provider connection for a new interview may receive `SYSTEM START`.
- Automatic Gemini session resumption should remain the first recovery path when a valid resumption handle exists.
- Any fresh connection for an interview with prior transcript or durable conversation state must receive `SYSTEM RESUME`.
- Resume must never repeat the initial greeting or re-present the original problem.
- Resume must restore the current question cycle, lifecycle state, current observed phase, exact persisted follow-up wording, latest code snapshot metadata, safe recent conversation, and server-calculated remaining time.
- If the interview was concluding when the connection failed, reopening the page must show the conclusion/retrospective state rather than reconnecting an interviewer at Intro.

## 4. Non-goals and invariants

- Do not expose the question title during or after the interview.
- Do not expose public examples, constraints, canonical URLs, topic, or pattern during the active interview.
- Do not make conversational-stage observations part of scoring, mastery, coverage, or correctness evidence.
- Do not let browser-supplied stage, remaining time, readiness, follow-up eligibility, or lifecycle state become authoritative.
- Do not restore a typed interview fallback or non-voice mode.
- Do not add a learner-controlled `End voice` action that leaves an active interview silently running. Whole-interview abandonment remains separate.
- Do not claim code was executed unless a trusted isolated runner is later added.
- Do not modify `Improvments/growth-improvements-spec.md` as part of this work.

## 5. Required architecture

### 5.1 Separate three concepts

The implementation must not overload one `phase` column with three meanings.

1. **Conversation lifecycle** — which question cycle exists and whether the interview is concluding.
2. **Observed conversational phase** — what the speakers are doing now for Guiding Star.
3. **Evaluation evidence** — transcript, code, notes, timing, and tests used only after completion.

The current `mock_interviews.phase` can remain temporarily for compatibility with the manual workflow, but it must no longer be the source of truth for live interviewer continuity or Guiding Star.

### 5.2 Durable conversation-state record

Add a one-to-one table, recommended name `mock_interview_conversation_state`, with forced RLS and no direct browser writes.

Minimum fields:

| Field                       | Contract                                                                                                       |
| --------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `mock_interview_id`         | Primary key and cascading foreign key                                                                          |
| `user_id`                   | Verified owner                                                                                                 |
| `lifecycle`                 | `primary_question`, `primary_completed`, `follow_up`, `follow_up_completed`, `concluding`                      |
| `question_cycle`            | `primary` or `follow_up`                                                                                       |
| `current_phase`             | One of the nine active Guiding Star phases, nullable while unknown                                             |
| `phase_source`              | `live_tool`, `product_event`, or `legacy_classifier`                                                           |
| `phase_transcript_event_id` | Latest transcript event supporting the stage                                                                   |
| `primary_readiness`         | `incomplete`, `ready`, or `completed`                                                                          |
| `follow_up_prompt`          | Exact learner-visible follow-up wording, nullable and bounded                                                  |
| `follow_up_started_at`      | Nullable timestamp                                                                                             |
| `conclusion_reason`         | Bounded enum such as `enough_evidence`, `time_low`, `primary_complete`, `follow_up_complete`, `provider_limit` |
| `connection_count`          | Monotonic count of provider connections                                                                        |
| `version`                   | Monotonic optimistic-concurrency version                                                                       |
| timestamps                  | `created_at`, `updated_at`                                                                                     |

Allowed lifecycle transitions:

```text
primary_question ──> primary_completed ──> follow_up ──> follow_up_completed ──> concluding
       │                    │                                      │
       └────────────────────┴──────────────────────────────────────┘
                              conclude
```

No transition may move from follow-up back to the primary lifecycle. Reconnect never changes lifecycle.

### 5.3 Event history

Keep an append-only event ledger for auditable transitions, either by extending the existing phase-observation table or adding `mock_interview_conversation_events`.

Required event types:

- `stage_observed`
- `solution_readiness_reported`
- `primary_completed`
- `follow_up_requested`
- `follow_up_started`
- `follow_up_rejected_time`
- `follow_up_completed`
- `conclusion_requested`
- `connection_started`
- `connection_resumed`
- `connection_resume_failed`

Events must reference owned transcript event IDs where applicable. Operational logs must contain only IDs, enums, versions, counts, and bounded latency; never transcript, prompt, follow-up wording, code, or secrets.

## 6. Replace the standalone per-turn classifier

### 6.1 Remove the quota-amplifying path

Stop calling `classifyRealtimeInterviewPhaseAction` after every transcript event. Retire or feature-disable:

- `INTERVIEW_PHASE_CLASSIFIER_ENABLED`
- `INTERVIEW_PHASE_CLASSIFIER_MODEL`
- direct `generateContent` phase classification from the active hot path

Retain existing observation rows for compatibility. A migration must not delete historical data.

### 6.2 Add a Live stage-reporting tool

Expose a structured tool to both Gemini Live and OpenAI Realtime:

```text
report_current_stage({
  questionCycle,
  phase,
  signal,
  reasonCode
})
```

Contract:

- `questionCycle`: `primary` or `follow_up`.
- `phase`: one of the nine Guiding Star phases.
- `signal`: `explicit` or `inferred`.
- `reasonCode`: bounded machine-readable enum/pattern; no free transcript text.
- The live model considers every completed learner turn and reports only when the stage changes or the cycle changes.
- The browser injects the authenticated interview ID and latest persisted transcript event ID; the model cannot supply ownership or arbitrary evidence IDs.
- If the relevant transcript event has not finished persisting, queue the report and flush it when the event ID becomes available.
- The server validates ownership, active status, event ownership, cycle consistency, and monotonic event ordering.
- A stale report returns the latest accepted state and cannot overwrite a newer transcript event.
- Stage reports remain display-only and are excluded from evaluation inputs.

### 6.3 Deterministic fallback

Use trusted product events when available:

- submitted code snapshot or code-review request → `implementation`;
- explicit product transition into retrospective → `retrospective`;
- server-approved conclusion → `retrospective` or neutral concluding state;
- saved complexity form → `complexity`;
- saved test/dry-run form → `testing`.

Do not attempt broad keyword classification in the browser. If neither a live report nor a trusted product event exists, show an unknown/unavailable state rather than a false phase.

## 7. Solution Readiness Gate

### 7.1 Structured readiness tool

Add a separate live tool:

```text
report_solution_readiness({
  questionCycle,
  algorithmComplete,
  stateComplete,
  operationOrderComplete,
  correctnessReasoningComplete,
  edgeCasesAddressed,
  complexityConsistent,
  verdict,
  reasonCode
})
```

`verdict` is `incomplete` or `ready`. The tool is an interviewer-control signal, not a learner score. It must be tied to recent owned transcript evidence.

### 7.2 Tough FAANG behavior

Replace the existing instructions that say to accept logic without evaluation. New rules:

- Evaluate silently; do not praise or reveal correctness.
- Do not move to implementation while readiness is incomplete.
- Ask one neutral completion request at a time.
- Acceptable incomplete response:
  - `I don't have a complete algorithm yet. Walk me through it from input to output.`
- If an approach is contradictory, request a dry run on one concrete input without naming the defect.
- Do not provide the missing algorithm, data structure, invariant, edge case, or complexity.
- Request implementation only after readiness is `ready`.

### 7.3 Beginner behavior

Beginner may use a restrained Socratic prompt, but it must use the same readiness checklist. Persona affects assistance, not the minimum completeness required before implementation.

### 7.4 Tests

Prompt/provider contract tests must prove:

- a 50%-complete explanation does not trigger implementation;
- a complete but incorrect explanation triggers a counterexample/dry run rather than advancement;
- a complete coherent explanation can advance without positive validation;
- Tough FAANG never reveals the missing solution component;
- Beginner and Tough share the same readiness dimensions.

## 8. Follow-up and conclusion control

### 8.1 Approved follow-up content

Prefer repository-authored, versioned follow-up variants attached to approved first-party question content. A follow-up must have exact learner-visible wording and must not depend on the model inventing constraints.

If no approved follow-up exists for the selected question, the only valid action after primary completion is conclusion, even if time remains.

Persist the selected exact wording before it is spoken. The active page may show the wording only after the follow-up begins. Do not expose hidden metadata.

### 8.2 Follow-up request tool

Add:

```text
request_follow_up({ reasonCode })
```

The server calculates effective elapsed time from persisted timer state and current server time, then calculates:

```text
remainingSeconds = durationMinutes * 60 - effectiveElapsedSeconds
```

Allow only when all are true:

- interview is active and voice lease is valid;
- lifecycle is `primary_completed`;
- primary readiness/completion has been recorded;
- no follow-up has previously started;
- an approved follow-up exists;
- `remainingSeconds >= 600`.

The result returns a bounded decision and trusted remaining seconds. The browser/model cannot override it.

### 8.3 Optional, not mandatory

Provider instructions must explicitly say:

- eligibility does not require a follow-up;
- conclude when sufficient evidence exists;
- conclude when a follow-up would add little signal;
- never request a follow-up simply because the tool permits it.

### 8.4 Conclusion tool

Add:

```text
conclude_interview({ reasonCode })
```

Conclusion must always be available during an active voice interview. The server validates ownership and idempotently sets lifecycle to `concluding`, stops the interview timer, and records the reason. It must not fabricate completion evidence for skipped phases.

After a successful tool response:

1. allow the interviewer one brief neutral closing message;
2. stop accepting new follow-up requests;
3. close voice after the closing turn or a short bounded grace period;
4. show the learner the retrospective/completion UI;
5. preserve conclusion state across refresh or disconnect.

Define and test behavior if the model calls conclusion twice or the connection closes between tool success and the spoken closing.

## 9. Resume Snapshot and connection lifecycle

### 9.1 Determine start versus resume on the server

The session endpoint must return a connection mode determined from durable state:

```text
mode = no_prior_transcript_and_connection_count_zero ? "start" : "resume"
```

Do not let the browser choose this mode.

Increment `connection_count` atomically while preparing a provider connection. Repeated token requests and concurrent browser tabs must not both become the first start.

### 9.2 Sanitized Resume Snapshot

Build a bounded server-owned snapshot containing:

- `connectionMode`;
- conversation lifecycle;
- question cycle;
- current observed phase or unknown state;
- primary readiness/completion state;
- exact follow-up prompt only when it has started;
- up to the six recent transcript turns already permitted in the active UI;
- latest code snapshot version/language and code content already visible in the editor;
- server-calculated `remainingSeconds`;
- whether the interview is concluding.

All transcript and code fields must be explicitly marked as untrusted evidence in provider instructions. Never include the question name, topic, pattern, public examples, external constraints, answer key, or private tests.

Because Gemini session instructions are returned through the browser, do not put older hidden transcript in those instructions. If future server-to-provider transport is added, update the privacy contract before expanding context.

### 9.3 Provider directives

For the first connection only:

```text
[SYSTEM START]
Begin the interview using the configured opening behavior exactly once.
```

For every later fresh connection:

```text
[SYSTEM RESUME]
This interview is already in progress. Do not greet, repeat the original opening,
re-present the primary question, or discard completed work. Continue from the
durable state and recent conversation supplied below.
```

If lifecycle is `follow_up`, resume the persisted follow-up. If it is `follow_up_completed` or `concluding`, do not restart either question.

### 9.4 Gemini and OpenAI behavior

- Gemini automatic session resumption with a valid handle remains the fastest path.
- Manual reconnect must not call a cleanup path that erases the only resumption handle before attempting resume.
- If handle-based resume fails, fall back to a fresh session hydrated with `SYSTEM RESUME`.
- OpenAI WebRTC reconnect always creates a fresh transport and therefore always requires the durable Resume Snapshot after the first connection.
- Provider parity tests are mandatory even if Gemini remains the default.

## 10. UI changes

### 10.1 Guiding Star

- Add a compact `Primary question` / `Follow-up` label adjacent to the tiles.
- Support `current`, `unknown`, and `reconnecting` visual states.
- Keep tiles phase-name-only; do not restore phase descriptions during the interview.
- Use `aria-current="step"` only when a stage is known.
- Announce cycle/stage changes through a restrained polite live region.
- Do not show confidence, raw tool payloads, readiness checklist results, or scoring implications.

### 10.2 Connection panel

- During automatic resume, show `Restoring interview context…`.
- After successful resume, show `Interview context restored` briefly.
- If voice returns but durable context cannot be restored, do not silently start over. Keep the session paused and offer retry or whole-interview abandonment.
- Stage-tool failure should show a non-blocking tracking status while voice continues.

### 10.3 Conclusion

- When the interviewer concludes, replace active question controls with a clear `Interview concluded` state and retrospective action.
- Do not require the learner to manually advance every skipped phase merely to reach completion.
- Missing phase evidence stays missing and lowers evaluation confidence; it must not be synthesized.

## 11. Review and scorecard changes

Post-interview Review must expose the information hidden during the active interview:

- primary versus follow-up boundaries;
- exact persisted follow-up wording;
- stage timeline derived from accepted stage events;
- reconnect markers and whether context was restored;
- solution-readiness events as concise process facts, not scores;
- transcript grouped by question cycle and stage;
- final code snapshots associated with primary/follow-up work.

The scorecard must continue evaluating observed learner evidence. Stage reports and readiness verdicts from the interviewer cannot substitute for transcript/code evidence and cannot directly determine dimension scores.

## 12. Security and concurrency requirements

- All new tables use enabled and forced RLS.
- Browser roles have no direct insert/update/delete grants on conversation state or event ledgers.
- Every mutation is an authenticated security-definer function with `search_path = ''`.
- Every function verifies interview ownership, active status, transcript/session ownership, and allowed lifecycle transition.
- Lock the conversation-state row for lifecycle, follow-up, and conclusion transitions.
- Follow-up time is calculated inside the same transaction that records the transition.
- Tool calls are idempotent by provider call ID or a client-generated bounded idempotency key.
- A stale stage event cannot overwrite a newer transcript-linked stage.
- Concurrent reconnect requests cannot both send `SYSTEM START`.
- Deleting an interview cascades conversation state, follow-up content selection, stage events, realtime sessions, transcript, evaluation, and profile impact as appropriate.

## 13. Data migration and compatibility

1. Add the new conversation-state and event structures without deleting existing observations.
2. Create a state row for every new interview at start.
3. For an existing active interview:
   - use existing transcript presence to set connection mode to resume;
   - initialize lifecycle conservatively as `primary_question` unless durable follow-up/conclusion evidence exists;
   - initialize current phase from the latest accepted observation, otherwise `null`, not `intro`;
   - never infer completion solely from the old `phase` value.
4. Completed/abandoned historical interviews remain readable.
5. Legacy Review clearly labels unavailable cycle/stage history rather than inventing it.
6. Keep the old manual phase flow behind compatibility code until the new voice lifecycle has passed rollout gates, then remove dead paths in a separate cleanup change.

## 14. Dependencies, conflicts, and required decisions

The following conflicts are expected. They must be resolved explicitly; an implementing LLM must not silently choose whichever existing path is easiest.

### 14.1 Observed stage versus durable lifecycle

Guiding Star may move backward or skip stages because real interviews are nonlinear. The durable question lifecycle may only move forward. Therefore:

- a reported `clarify` after `implementation` may change the highlighted Guiding Star tile;
- it must not reopen a completed primary question or erase a follow-up;
- lifecycle transitions must never be inferred solely from a stage report;
- question completion requires a separate, validated control event.

### 14.2 Toughness versus solution verification

The current “no validation” rule conflicts with the requirement to verify a complete solution. Resolve this by distinguishing performance feedback from procedural readiness:

- the interviewer may state neutrally that the algorithm is incomplete or contradictory;
- it may request an end-to-end walkthrough, invariant, edge case, complexity, or dry run;
- it must not praise, reveal the missing step, name the intended technique, or convert readiness into a score;
- readiness gates progression to implementation but does not certify correctness for the final report.

### 14.3 Live stage reports versus transcript persistence

Provider tool calls can arrive before the matching transcript event has finished saving. Accepting them immediately would create ungrounded or misordered observations. Queue the report briefly in the browser/provider adapter, persist the utterance first, then submit the report with the persisted event ID. If correlation cannot be established, retain the previous accepted stage or show an unknown state; do not guess `intro`.

### 14.4 Follow-up choice versus server authority

The interviewer may decide whether a follow-up would add useful evidence, but it may not decide whether one is allowed. The server owns remaining time, prior-follow-up count, lifecycle, and approved content availability. A provider request is only a proposal; the server response is authoritative. A rejection must direct the interviewer to conclude without exposing internal policy machinery to the learner.

### 14.5 Generated follow-up wording versus reconnect recovery

A follow-up invented only inside ephemeral model context cannot be recovered reliably. Prefer versioned, repository-approved follow-up variants. If dynamic generation remains necessary, persist the exact bounded wording and content version transactionally before authorizing the provider to speak it. Never mark `follow_up` started before recoverable wording exists.

### 14.6 Native provider resumption versus application hydration

Gemini session resumption may retain richer hidden context, while OpenAI or a failed Gemini handle may require a fresh connection. Provider resumption is an optimization, not the source of truth. Every reconnect path must be able to fall back to the same sanitized server snapshot and must produce equivalent learner-visible continuity.

### 14.7 Conclusion versus transport shutdown

Closing the audio transport before persisting `concluding` can make a completed interview look abandoned or resumable. Persist the idempotent conclusion transition first, allow one bounded closing message when possible, then close the transport. A disconnect during that sequence must reopen in conclusion/retrospective state, never in the interview body.

### 14.8 Existing manual workflow and historical data

The repository currently contains manual-phase forms and historical rows that lack conversation state. Use an additive migration and dual-read compatibility during rollout. Do not rewrite historical transcripts or infer that a legacy `phase` means a question was completed. For legacy active interviews, any existing transcript forces resume mode, but missing lifecycle facts remain conservative and visibly unknown.

### 14.9 Content secrecy versus post-interview review

The active interview must continue hiding title, examples, constraints, topic, pattern, and canonical URL. Review may reveal the learner's transcript, code, stage timeline, and evidence captured during the interview, but it must not accidentally reintroduce hidden question metadata through shared components or serialized page props.

### 14.10 Quota and latency versus per-utterance analysis

Guiding Star analysis is required on the conversation stream, but a second model call per utterance is prohibited by the observed quota failure and latency cost. Stage reporting must use the already-running Live model session. Tool reports should be emitted only when the inferred stage or question cycle changes, not on every token or partial transcript.

Dependency order:

1. Durable lifecycle and event schema must exist before reconnect, follow-up, or conclusion can become authoritative.
2. Resume Snapshot must be in place before changing provider prompts, otherwise prompt changes can worsen resets.
3. Live stage reporting may ship after durable state, but it must not block reconnect or audio.
4. Solution readiness must ship before the new follow-up policy so “primary complete” has a validated meaning.
5. Server follow-up eligibility and persisted wording must precede any prompt that offers follow-ups.
6. Conclusion persistence must precede automatic provider shutdown and Review handoff.

## 15. Implementation sequence

### Phase 0 — Baseline and regression fixtures

- Add the supplied failed interview as a sanitized transcript fixture.
- Encode the expected stage/cycle timeline.
- Add a reconnect regression proving the opening cannot repeat after prior transcript.
- Record current unit, integration, build, database-lint, and bundle-audit baselines.

### Phase 1 — Durable conversation state

- Add migrations, types, RLS, lifecycle constraints, event ledger, deletion cascades, and sanitized active snapshot fields.
- Add server-domain transition functions and exhaustive pure tests.
- Do not change provider behavior yet.

### Phase 2 — Start/resume connection contract

- Make connection mode server-authoritative.
- Add atomic connection counting.
- Build sanitized Resume Snapshot.
- Implement `SYSTEM START` versus `SYSTEM RESUME` for Gemini and OpenAI.
- Preserve/fallback from Gemini resumption handles safely.

This phase is P0 because reconnect currently destroys the interview experience.

### Phase 3 — Live Guiding Star tool

- Add `report_current_stage` to both providers.
- Queue reports until transcript event persistence completes.
- Persist stage/cycle state and update the UI.
- Remove the standalone per-utterance Gemini call from the active path.
- Add neutral unavailable/reconnecting state.

### Phase 4 — Solution Readiness Gate

- Add readiness schema, tool, persistence, server validation, and provider instructions.
- Replace Tough FAANG's passive-acceptance rules.
- Add transcript-based persona contract tests.

### Phase 5 — Follow-up eligibility and content

- Add approved follow-up content registry/versioning.
- Add server-authoritative remaining-time calculation.
- Implement `request_follow_up`, one-follow-up limit, exact wording persistence, and `>= 600` boundary.
- Make follow-up optional in instructions.

### Phase 6 — Interviewer conclusion

- Implement idempotent `conclude_interview`.
- Stop timer and transition UI without forcing skipped manual phases.
- Handle closing-turn grace period, disconnect during conclusion, refresh, and completion/evaluation handoff.

### Phase 7 — Review, observability, and cleanup

- Add cycle/stage/reconnect timeline to Review.
- Add operational events and dashboards for stage-tool errors, resume success, repeated-opening prevention, follow-up rejection, and conclusion.
- Remove or disable obsolete classifier configuration and dead manual assumptions.
- Update product, architecture, database, realtime, deployment, and security documentation.

## 16. Required tests

### Unit and domain

- all valid and invalid lifecycle transitions;
- skips/backtracking for observed phase without lifecycle regression;
- latest transcript event wins under out-of-order stage reports;
- readiness checklist gates implementation;
- `600` seconds permits follow-up and `599` rejects it;
- one follow-up maximum;
- conclusion is idempotent and always available;
- start/resume directive selection;
- Resume Snapshot redaction and size limits.

### Provider contract

- Gemini and OpenAI expose identical stage/readiness/follow-up/conclusion semantics;
- initial connection opens once;
- automatic handle resume does not emit `SYSTEM START`;
- manual/fallback reconnect emits `SYSTEM RESUME` with bounded state;
- stage reports do not create standalone `generateContent` requests;
- incomplete solution does not advance to implementation;
- optional follow-up behavior and conclusion behavior are represented in instructions.

### Database integration

- cross-user/anonymous state reads and mutations fail;
- direct browser writes fail;
- connection-start race produces one `start` and subsequent `resume` modes;
- stale stage report cannot overwrite newer state;
- follow-up time validation occurs atomically under row lock;
- duplicate tool calls are idempotent;
- reconnect does not reset lifecycle/current phase/follow-up wording;
- conclusion stops timer and releases completion flow;
- abandoned/deleted interviews handle all new rows correctly;
- stage/readiness state does not change mastery, coverage, profile, or scores.

### UI and end-to-end

- Guiding Star advances from spoken stages without manual form submission;
- follow-up visibly starts a second labeled cycle;
- tracking failure shows neutral status rather than Intro;
- disconnect during primary, implementation, follow-up, and concluding restores the correct point;
- repeated opening is absent after reconnect;
- follow-up cannot begin below ten minutes;
- interviewer can conclude above ten minutes without a follow-up;
- Review displays both cycles and reconnect markers after completion;
- Hebrew and mixed Hebrew/English interviews preserve the same behavior.

### Full gates

Run and require success from:

```text
npm run lint
npm run typecheck
npm test
npm run test:integration
npm run build
npm run audit:client-bundle
npx supabase db lint --local --level error
```

## 17. Observability and rollout

Add metrics without conversation content:

- stage reports per interview and stage-report failure ratio;
- interviews stuck in unknown stage for more than a bounded interval;
- first connection versus resume connection counts;
- resume success/failure and repeated-opening invariant violations;
- solution-readiness incomplete/ready transitions;
- follow-up eligible, selected, skipped, and rejected-time counts;
- conclusion reasons;
- interviews ending through abandonment after reconnect failure.

Recommended rollout:

1. Ship schema and state projection dark.
2. Enable Resume Snapshot for internal/local users.
3. Enable Live stage reporting while keeping the old classifier disabled.
4. Enable readiness gate for Tough FAANG, then Beginner.
5. Enable server-controlled follow-up/conclusion.
6. Enable Review timeline.
7. Remove compatibility paths only after metrics and regression interviews are stable.

Feature flags must be server-only, typed, and independently reversible. Disabling a new feature must preserve durable state and must never revert a resumed interview to `SYSTEM START`.

## 18. Acceptance criteria

The work is complete only when all statements below are true:

- A ten-minute spoken interview can traverse several Guiding Star stages without any standalone phase-classifier API calls.
- A classifier/provider quota error cannot leave Intro falsely highlighted.
- Tough FAANG refuses to advance after a partial solution explanation without giving the missing solution.
- A follow-up is rejected at 9:59 remaining and is merely optional at 10:00 or more.
- The interviewer can conclude immediately after the primary question when sufficient evidence exists.
- No interview can receive more than one follow-up.
- A fresh connection after any prior transcript resumes rather than repeats the opening.
- A disconnect after primary completion or follow-up completion cannot reset lifecycle to Intro.
- The exact follow-up wording survives reconnect and appears in post-interview Review.
- Guiding Star stage history, readiness control, and connection events are excluded from direct score/mastery calculations.
- All security, concurrency, accessibility, integration, build, and client-bundle gates pass.

## 19. Files likely to change

This list is directional; inspect the repository before editing.

- `src/features/realtime-interviews/instructions.ts`
- `src/features/realtime-interviews/provider.ts`
- `src/features/realtime-interviews/gemini-live-provider.ts`
- `src/features/realtime-interviews/openai-webrtc-provider.ts`
- `src/features/realtime-interviews/actions.ts`
- `src/features/realtime-interviews/model.ts`
- `src/app/api/realtime/gemini-session/route.ts`
- `src/app/api/realtime/interview-session/route.ts`
- `src/components/mock-interviews/realtime-interview-panel.tsx`
- `src/components/mock-interviews/interview-phase-guide.tsx`
- `src/components/mock-interviews/mock-interview-workspace.tsx`
- `src/features/mock-interviews/queries.ts`
- `src/features/interview-evaluation/question-content.ts`
- `src/app/(app)/interviews/[interviewId]/review/page.tsx`
- new Supabase migrations and regenerated `src/types/database.ts`
- realtime, phase-guide, Review, integration, and E2E tests

The implementing LLM must inspect existing uncommitted changes before editing, preserve unrelated user work, and leave `Improvments/` untouched.
