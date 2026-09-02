# Full-Voice Mock Interview Redesign — LLM Action Plan

> **Product amendment — 2026-09-02:** Guiding Star now renders at the very top of the active interview, above the question. The six most recent completed learner/interviewer transcript turns render between Live Interviewer and the coding workspace and remain available after refresh/reconnect through an owner-scoped bounded RPC. This amendment overrides older layout-order and “all active transcript hidden” requirements below; the full transcript and all other evidence remain Review-only.

## Purpose

This document instructs an implementation LLM to redesign the active mock-interview experience around one strict product principle:

> The learner is in a real, full-voice interview. During the active session, the product shows only the question wording, voice-interviewer controls, the coding workspace, compact phase names, and the inputs required for the current step. Recorded interview evidence becomes reviewable only after successful interview completion.

The two user-provided screenshots are visual references for the current state only. They contain no implementation instructions. The requirements in this document come from the user's written request.

## Authority and superseded decisions

This document is newer than and overrides conflicting mock-interview requirements in:

- `docs/interview-selection-and-workspace-action-plan.md`;
- `docs/interview-rollout.md`;
- `docs/realtime-interviewer.md`;
- `docs/interview-selection-and-workspace-implementation-report.md`;
- older implementation-status sections that describe voice as optional or preserve a typed/no-AI interview fallback.

Specifically, the implementing LLM must no longer preserve:

- optional voice for mock interviews;
- typed messages as a substitute for speaking;
- starting or continuing a new interview without a configured and connected voice provider;
- learner-visible question title, external ID, canonical link, separate examples, separate constraints, content provenance, or content version during the active interview;
- verbose Guiding Star descriptions or captured-evidence summaries during the active interview;
- active-session access to saved transcript, prior phase notes, or phase evidence through learner-facing queries.

All non-conflicting behavior remains in force, including authentication, ownership, forced RLS, one-active-interview enforcement, practice/interview exclusion, Python/Java support, timer persistence after voice activation, ordered phase transitions, code/scratchpad persistence, deletion, evaluation, scorecards, and provider-key security.

## Working rules for the implementing LLM

1. Read `AGENTS.md` completely before editing.
2. Read the relevant local Next.js 16 documentation under `node_modules/next/dist/docs/` before changing pages, route handlers, Server Actions, metadata, or Server/Client Component boundaries.
3. Inspect the current implementation and tests before changing it. Do not implement this plan from memory alone.
4. Use additive Supabase migrations only. Never edit an already-applied migration.
5. Preserve user data. Do not fabricate transcript, phase, score, timing, or profile evidence during migration.
6. Treat hiding as a data-boundary requirement, not merely a CSS requirement. Data forbidden during the active interview must not appear in the DOM, React Server Component payload, JSON responses, accessibility attributes, browser metadata, client JavaScript state, client-direct provider configuration, or learner-readable database queries.
7. Keep provider keys server-only. Never add a provider secret to a `NEXT_PUBLIC_` variable, response, client component, operational event, or transcript.
8. Keep learner code, transcript, prompt text, and provider output bounded and untrusted.
9. Do not let an LLM directly mutate interview phase. Existing deterministic phase actions remain authoritative and are allowed only while the required voice lease is valid.
10. Do not execute Python or Java inside the Next.js process. The existing no-trusted-runner disclosure remains required.
11. Update tests, generated database types, documentation, rollout configuration, and CI with every relevant change.
12. Do not commit, push, deploy, or mutate a hosted database unless the user explicitly requests it.
13. Leave `Improvments/growth-improvements-spec.md` untouched; it is unrelated future work.

## Scope interpretation

### “Do not show the question name anywhere”

Use the strict interpretation within the entire mock-interview learner experience:

- do not show the catalog title during the active interview;
- do not show it in the active page header, prompt panel, badges, tooltip, `aria-label`, browser title, metadata, transcript instructions, API response, RSC payload, error message, or canonical link;
- do not show it later in mock-interview history, scorecard, Review, or deletion confirmation;
- label records generically, for example `Mock interview · 2 Sep 2026`;
- the topic and pattern may still be revealed after completion because the user prohibited the question name, not post-interview topic feedback;
- the normal problem library is outside this redesign. Do not remove titles from `/problems` or ordinary practice pages.

The product cannot prevent a knowledgeable learner from recognizing a well-known problem from its wording. The enforceable requirement is that the application and interviewer never explicitly supply the catalog name, external identifier, or source link.

### “Show the question itself only”

The active question surface contains only the approved `prompt` string. It must not visibly contain:

- a title;
- `Interview prompt` or source/provenance labels;
- difficulty;
- external ID;
- examples rendered from the content registry;
- constraints rendered from the content registry;
- content version;
- external/canonical reference;
- hide/show controls.

Requirements that are already naturally part of the authored prompt remain part of the question. For example, “modify the matrix in place” may remain when it is necessary to define the task. The separate `constraints[]` and `examples[]` collections must not be rendered or serialized to the active learner client.

Use a screen-reader-only section heading such as `Interview question` if required for page structure. It must not contain the catalog title.

### “Recorded information only after the interview”

During an active interview:

- phase notes may be visible while the learner is entering the current phase;
- submitted notes disappear when that phase is completed;
- transcript turns are not displayed as a live text conversation;
- completed-phase summaries, evidence snippets, code-review records, raw evidence IDs, and previous notes are not shown;
- code and scratchpad remain visible because they are the learner's active working surface, not a post-hoc evidence review.

After successful completion, an owned Review screen exposes the saved interview record. Abandoned or voice-pending interviews do not receive the complete evidence Review experience.

### “Full voice only”

Full voice means:

- microphone capability and permission are required before creating a new interview;
- a configured Gemini Live or OpenAI Realtime provider is required;
- the active interview automatically attempts voice connection;
- the interview timer begins only after the first real provider connection is confirmed;
- typed-message input is removed;
- a transcript is saved from audio transcription but hidden during the active interview;
- phase advancement and interview completion require a recent server-validated voice connection lease;
- a transient disconnect blocks phase advancement and completion until reconnection;
- code editing and autosave may continue during a disconnect so work is not lost;
- muting is allowed as a temporary microphone control and does not create a text-interview mode;
- there is no `End voice` action that leaves the text workflow usable. The learner may reconnect or explicitly end/abandon the whole interview.

## Current-state findings the implementation must address

1. `MockInterviewWorkspace` currently renders `interview.problem.title`, external ID, and difficulty in the active header.
2. `InterviewQuestionPanel` receives and renders title, difficulty, canonical URL, prompt, examples, constraints, provenance, and version.
3. The active page serializes title, external ID, difficulty, canonical URL, and the full learner-visible question object into the Client Component boundary.
4. `buildInterviewInstructions` explicitly inserts the problem title, difficulty, constraints, and examples into provider instructions.
5. The Gemini session endpoint currently returns interviewer instructions to the browser, so anything placed in those instructions must be treated as learner-visible.
6. `RealtimeInterviewPanel` describes voice as optional, exposes a typed-message form, renders the live transcript, and permits ending voice while the manual interview continues.
7. The current Guiding Star renders nine large cards with descriptions, status badges, and captured summaries.
8. The active page loads phase events and realtime transcript events and serializes them to the browser.
9. Authenticated own-row select policies currently permit a learner to query their raw active phase/realtime rows directly. UI hiding alone therefore does not satisfy “accessible only after completion.”
10. Versioned start currently creates a running active interview before the provider connection succeeds, so microphone/provider failure consumes interview time.
11. Previous rollout behavior allows embedded prompt or coding capabilities to fall back independently. Disabling embedded prompt content currently exposes an external reference; that is incompatible with this redesign.

## Product conflicts and required decisions

### Conflict 1: earlier text/no-AI fallback versus full-voice-only interviews

The new request overrides the old fallback requirement.

- setup must be unavailable when realtime is not configured;
- start actions must reject direct/tampered attempts when realtime is unavailable;
- old authenticated start RPCs must not remain a bypass for creating a non-voice interview;
- provider failure before activation must not start the timer or create profile/coverage evidence;
- provider failure after activation requires reconnect or whole-interview abandonment;
- deterministic post-interview evaluator fallback remains allowed because it occurs after a real voice interview and is unrelated to practicing without voice.

### Conflict 2: timer integrity versus voice permission/provider setup

Do not start the mandatory timer at row creation. Introduce a voice-pending activation state on the interview:

```text
selection committed → voice pending → provider connected → timer active
```

The timer starts in a narrow owned RPC only after a server-created realtime session exists and the browser confirms a real connected state. A failed preflight or failed initial connection must not reduce interview time.

### Conflict 3: hidden constraints/examples versus realistic interviewer answers

The current browser-direct Gemini architecture cannot safely receive “hidden” constraints/examples because provider instructions and tool responses can be inspected in browser traffic. Therefore:

- the first implementation must give both providers the same prompt-only interview context;
- do not send title, difficulty, external ID, examples, constraints, invariants, or canonical URL to a client-direct provider;
- the interviewer may ask the learner to state a reasonable assumption when the prompt does not answer a clarification;
- do not invent constraints and do not silently leak the stored constraint list;
- if the product later requires the interviewer to know hidden constraints, first build a genuinely server-mediated voice/provider path whose private instructions never pass through the browser. That is a separate architecture project and must not be simulated with client tool calls.

The evaluator may continue using full first-party content, including constraints, examples, and expected invariants, because evaluation runs through a server-only boundary after completion.

### Conflict 4: compact visual tiles versus accessibility

Visible tile text must contain only the phase name. Preserve accessibility with:

- `aria-current="step"` on the current phase;
- screen-reader-only state text such as `Completed`, `Current`, `Suggested next`, or `Future`;
- state icons and color, without adding visible descriptions or evidence;
- a semantic ordered list;
- focus and contrast that do not rely on color alone.

### Conflict 5: recorded evidence hidden in UI versus readable through Supabase

The requirement applies to data access, not only rendering.

- revoke broad learner reads that expose raw active phase notes/events;
- replace active loading with narrow owned RPCs or views that return only sanitized runtime state;
- allow full evidence reads only when the parent interview is completed;
- never return the active `problem_id`, catalog slug, external ID, or another joinable identifier that reveals the title through the public catalog;
- use an opaque content key or another non-joinable server mapping to load the approved prompt without exposing catalog identity to the active learner client.

### Conflict 6: existing active interviews during rollout

Do not corrupt or delete an in-progress interview during migration. Recommended rollout:

- completed and abandoned history remains unchanged except for learner-facing title removal;
- existing active interviews are grandfathered only for data preservation, clearly marked as legacy, and may be completed or abandoned under their original lifecycle;
- every interview created after the migration is voice-required;
- if the owner requires immediate enforcement for existing active rows, implement a separate reviewed migration that snapshots elapsed time and pauses the timer before forcing voice activation. Do not guess this conversion silently.

## Target active-page information architecture

The desktop and mobile DOM order must be:

```text
1. Generic interview status header
   - “Mock interview” only
   - remaining time
   - voice connection state
   - no question title, ID, difficulty, topic, or pattern

2. Question surface
   - approved prompt text only

3. Live Interviewer
   - immediately below the question
   - auto-connect/reconnect state
   - microphone level, mute, interviewer-speaking indicator
   - no typed input
   - no live transcript
   - no “voice optional” language

4. Coding workspace
   - immediately below Live Interviewer
   - Python or Java fixed from interview snapshot
   - scratchpad and persistent source editor
   - review/submit actions remain phase-aware

5. Compact Guiding Star
   - nine small phase tiles
   - visible tile text is the phase name only
   - no objective, captured summary, description, or visible state badge text

6. Current-phase action
   - clarification/examples/reasoning/testing/complexity/retrospective input
   - only the current input is visible

7. Whole-interview controls
   - reconnect when required
   - abandon/end the entire interview
```

The phrase “Live Interviewer rubric” in the user request refers to the Live Interviewer panel, not the post-interview scoring rubric. The scoring rubric remains post-interview only.

## Active question surface specification

Replace the current `InterviewQuestionPanel` contract with a prompt-only boundary:

```ts
type ActiveInterviewQuestion = {
  prompt: string;
};
```

The active component should accept only:

```ts
type ActiveInterviewQuestionPanelProps = {
  prompt: string;
};
```

It must not accept unused hidden props such as `title`, `difficulty`, `examples`, `constraints`, `canonicalUrl`, `externalId`, `contentVersion`, or `provenance`. Removing those props makes accidental rendering and serialization harder.

Additional requirements:

- always expanded; no hide/show action;
- concise maximum width and readable line length;
- code-like fragments remain LTR inside Hebrew UI;
- no link to the source during the active session;
- no generic fallback to an external source;
- if approved prompt content is missing, fail the start before creating the interview;
- validate that the prompt is bounded and does not include the exact catalog title as a separate heading/prefix;
- keep the timer outside the prompt surface so “question only” remains literal.

## Active data-transfer contract

Create a dedicated server-assembled DTO instead of passing `MockInterviewDetail` fields into the active Client Component:

```ts
type ActiveVoiceInterviewDto = {
  id: string;
  prompt: string;
  phase: MockInterviewPhase;
  completedPhases: MockInterviewPhase[];
  pendingSuggestedPhase: MockInterviewPhase | null;
  durationMinutes: 30 | 45 | 60;
  elapsedSeconds: number;
  timerRunning: boolean;
  voiceActivated: boolean;
  codingLanguage: "python" | "java";
  codeSnapshot: string;
  scratchpad: string;
  workspaceVersion: number;
  interviewLanguage: InterviewLanguage;
  interviewerLevel: InterviewerLevel;
  realtimeProvider: "gemini" | "openai";
};
```

The DTO must not contain:

- problem ID or selected topic ID;
- catalog title or slug;
- external ID or URL;
- difficulty;
- examples or constraints;
- expected invariants/private tests;
- completed phase summaries;
- saved prior notes;
- transcript entries;
- raw realtime/phase event rows or IDs;
- provider call ID, token, or secret.

It is acceptable for the active guide to derive completed states from the ordered current phase rather than loading phase-event history. A sanitized pending-suggestion phase may be returned without evidence details.

## Question-content boundaries

Split the current learner-visible schema into explicit consumers:

```ts
type ActiveCandidatePrompt = {
  prompt: string;
};

type VoiceInterviewerPrompt = {
  prompt: string;
};

type EvaluationQuestionContent = {
  prompt: string;
  constraints: string[];
  examples: PublicExample[];
  expectedInvariants: string[];
  contentVersion: number;
};
```

Rules:

- active candidate and voice interviewer receive prompt only;
- evaluator remains server-only and may receive the complete approved content;
- do not reuse a broad `LearnerVisibleQuestionContent` type for all three consumers;
- API routes must construct the minimum provider context on the server;
- Gemini responses must not return instructions containing hidden fields;
- OpenAI server-created session instructions must follow the same prompt-only contract for provider parity;
- provider instructions must explicitly prohibit saying the title or external identifier;
- provider transcript output containing the title should be treated as a provider-contract violation, logged without transcript content, and covered by evaluation/monitoring. Do not attempt unsafe free-text redaction that may damage ordinary speech.

## Compact Guiding Star specification

Keep the canonical ordered phases and persisted event history, but replace active rendering.

Visible phase names:

```text
Intro · Clarify · Examples · Brute force · Optimization
Implementation · Testing · Complexity · Retrospective
```

Each tile:

- is compact, approximately 36–48 px tall on desktop;
- contains only the phase name as visible text;
- may contain one non-text state icon;
- uses `data-phase-state` for deterministic tests;
- has an accessible hidden state label;
- never renders objectives, evidence summaries, reason codes, provider/model names, or captured notes during the active interview.

Responsive behavior:

- desktop: one compact nine-item row when space permits, otherwise a dense grid;
- tablet: five/four or three-column grid;
- mobile: a horizontally scrollable ordered strip or three-column grid with 44 px minimum touch/focus targets;
- the current phase must scroll into view without moving keyboard focus unexpectedly;
- phase names must not be truncated into ambiguity. `Brute force` and `Retrospective` must remain understandable.

States remain:

- completed;
- current;
- suggested next;
- needs confirmation;
- future.

State text is screen-reader-only. The model still cannot change phase.

## Post-interview Review experience

Add a dedicated route:

```text
/interviews/[interviewId]/review
```

Access requirements:

- authenticated owner only;
- parent interview must have `status = completed`;
- active, voice-pending, abandoned, missing, or foreign-owned interviews return not-found or a safe redirect;
- the scorecard and history provide a visible `Review interview` action only for completed interviews;
- deletion continues to remove the Review data because it reads the same cascaded evidence.

The Review page may show:

1. generic interview date, duration, language, interviewer level, result, and revealed topic/pattern;
2. the question prompt, but not the catalog question name, external ID, source URL, separate examples, or separate constraints;
3. a phase-by-phase timeline;
4. saved clarification, examples reasoning, brute-force reasoning, optimization reasoning, testing notes, complexity, and retrospective;
5. deterministic phase summaries with a clear source label;
6. complete voice transcript grouped by speaker and phase;
7. scratchpad snapshot;
8. code submission history, language, versions, and final code;
9. code-review exchanges and provider phase suggestions without raw provider call IDs;
10. score/evaluation evidence references translated into human-readable labels;
11. an explicit statement that code was not executed unless trusted-runner evidence exists.

Do not show raw database IDs, raw evidence-event IDs, provider tokens, provider call IDs, model system instructions, private invariants, or private tests.

Suggested scorecard navigation:

```text
Scorecard | Review
```

Use real links and route-level authorization, not a client-only tab that already downloads all Review evidence on the scorecard route.

## Full-voice start and activation lifecycle

### Setup availability

The setup page must obtain a server-owned voice availability summary:

```ts
type VoiceInterviewAvailability =
  | { available: true; provider: "gemini" | "openai" }
  | { available: false; reason: "not_configured" | "unsupported_provider" };
```

When unavailable:

- disable `Start mock interview`;
- explain that mock interviews require live voice and a configured provider;
- do not offer a text-only button;
- do not expose which secret is missing.

### Browser preflight

Before calling the start Server Action:

1. verify secure context or localhost;
2. verify `navigator.mediaDevices.getUserMedia` exists;
3. request microphone permission from a direct user gesture;
4. verify at least one live audio track;
5. stop the temporary preflight tracks;
6. only then submit selection/start data.

Permission denial or missing capability stays on setup with an accessible actionable message and creates no interview row.

### Pending row

Add an additive migration with fields such as:

- `voice_required boolean not null`;
- `voice_activated_at timestamptz`;
- `voice_last_heartbeat_at timestamptz`;
- `voice_activation_deadline timestamptz`;
- optional bounded activation failure code that contains no provider secret/content.

For every new versioned interview:

- `voice_required = true`;
- `timer_running = false`;
- `elapsed_seconds = 0`;
- `voice_activated_at = null`;
- the row still occupies the one-active-interview slot;
- coverage/profile/history evidence is unaffected until completion.

Do not add a client-supplied flag that can turn `voice_required` off. The database start function sets it.

### Provider connection and activation

On the active page:

1. automatically connect the selected provider;
2. create or resume the owned realtime session through the server route;
3. after the provider reports `connected`, persist a connection event;
4. call a narrow `activate_voice_mock_interview` RPC;
5. the RPC locks the interview and realtime session, verifies ownership, pending voice state, active provider session, and activation deadline;
6. it sets `voice_activated_at`, `voice_last_heartbeat_at`, `started_at = now()`, and `timer_running = true` atomically;
7. the page unlocks phase actions only after the RPC succeeds.

Activation is idempotent. Refresh/reconnect must not reset `started_at` or elapsed time.

### Connection lease

Add an owned heartbeat RPC updated at a bounded interval while the provider is connected. Phase advancement, code review/completion submission, and final interview completion require:

- `voice_required = true`;
- non-null `voice_activated_at`;
- active owned realtime session;
- a recent server timestamp heartbeat, for example within 90 seconds.

Do not trust a client boolean such as `realtimeConnected` for server authorization.

Workspace autosave may remain available without a valid lease to avoid data loss. Abandon and pre-activation cancellation remain available.

### Failure behavior

Before activation:

- show reconnect and cancel actions;
- timer stays at the full duration;
- `cancel_pending_voice_interview` deletes the owned pending interview and cascades any partial provider/session rows;
- cancellation creates no history/profile/coverage evidence.

After activation:

- timer continues during transient network failure;
- hide/disable phase advancement, review submission, and completion;
- preserve editor and scratchpad autosave;
- automatically attempt bounded reconnect with visible state;
- permit whole-interview abandonment;
- successful reconnect refreshes the heartbeat and resumes actions.

Remove `End voice`. Ending the media/provider session is equivalent to a disconnect and must not expose a text workflow.

### Start-function bypass prevention

Audit every authenticated database start function and Server Action:

- the current versioned start function must create voice-pending rows;
- legacy authenticated start RPCs must be revoked from new browser use or updated so they cannot create non-voice sessions;
- direct table inserts remain revoked;
- practice/interview mutual exclusion must treat voice-pending rows as active;
- expired pending rows must have an owned recovery/cancel path and must not silently disappear while a learner is connected.

## Live Interviewer panel specification

The panel appears immediately after the question and before the coding workspace.

Visible content:

- `Live interviewer` generic heading;
- connection state;
- provider-neutral speaking indicator;
- microphone level;
- mute/unmute;
- reconnect/cancel before activation;
- reconnect/end whole interview after activation;
- short privacy message saying audio transcription is saved for post-interview Review.

Remove:

- “Voice is optional” copy;
- typed-message field and send button;
- live transcript list;
- `Optional` connection badge;
- `Start voice interview` as an optional action;
- `End voice` while leaving the interview active;
- messages claiming manual/text continuation is available after provider failure.

Keep transcript persistence from audio transcription. Do not render it until Review.

## Coding workspace placement and behavior

- render the coding workspace immediately below Live Interviewer;
- keep it available from Intro onward;
- keep language fixed to Python or Java;
- preserve autosave, blur save, manual save, optimistic versions, stale-tab conflicts, bounds, LTR code, and RTL-safe scratchpad behavior;
- allow editing/autosave during voice reconnect;
- require a valid voice lease for `Send current code to interviewer` and `I’m done coding`;
- keep submitted code as untrusted provider context;
- do not display saved interviewer code feedback during an active phase as a Review record. Spoken feedback is heard; the stored record appears after completion;
- preserve the no-execution/no-tests-passed disclosure.

## Data access and RLS plan

UI-only hiding is insufficient. Add database tests proving the active learner cannot select raw review evidence.

Recommended boundary:

1. revoke broad authenticated select access from raw interview evidence tables where it exposes active historical data;
2. expose a narrow active-runtime RPC/view returning only the sanitized DTO fields needed for the active page;
3. return an opaque approved-content key rather than `problem_id` or slug;
4. keep the opaque-key-to-prompt mapping server-only;
5. expose a completed-review RPC/view only when `auth.uid()` owns a completed parent interview;
6. phase/realtime event policies must deny raw reads while the parent is active or voice-pending;
7. code/scratchpad active reads/writes use dedicated owned workspace RPCs because those fields remain part of the working surface;
8. evaluation services may load full completed evidence through server-only or completed-owner boundaries;
9. deletion remains an owned RPC and cascades every review record.

If PostgreSQL cannot distinguish a Next.js server request using a learner JWT from a direct browser request, do not return secret/joinable identity through an “internal” authenticated RPC. Use an opaque content mapping or a separately authenticated server-only boundary. Document the selected mechanism.

## Observability

Add privacy-safe operational events for:

- voice preflight supported/denied/unavailable;
- voice-pending interview created;
- initial connection succeeded/failed;
- voice activation succeeded/rejected/expired;
- heartbeat stale/recovered;
- phase action blocked because voice lease was stale;
- reconnect attempts and outcome;
- pending interview cancelled;
- provider contract emitted a forbidden title, when deterministically detectable without logging the transcript.

Never log microphone data, transcript, prompt, title, examples, constraints, code, scratchpad, provider token, or provider response body. Keep existing sensitive-field sanitization.

## Rollout and configuration changes

1. Mock interview setup must be unavailable unless `REALTIME_AI_ENABLED=true` and a valid provider config exists.
2. Production environment validation must fail when mock interviews are enabled but full voice is not configured.
3. `INTERVIEW_PROMPT_CONTENT_ENABLED=false` must disable new mock-interview start; it must not fall back to an external link.
4. `INTERVIEW_CODING_WORKSPACE_ENABLED=false` may retain the bounded plain code editor, but the page order and full-voice requirement remain unchanged.
5. Do not expose a learner-facing “text mode” flag.
6. Preserve a server-side emergency rollout/kill switch that disables starting new interviews without altering existing data.
7. Update deployment documentation with HTTPS, microphone permission, provider quota, browser compatibility, activation/reconnect monitoring, and rollback procedures.

## Implementation stages

### Stage 1 — Active identity and prompt isolation

- introduce prompt-only active schemas;
- remove title, ID, difficulty, examples, constraints, version, provenance, and external reference from active component props;
- remove title/ID/difficulty from active header and browser metadata;
- remove title/difficulty/full content from realtime instructions;
- audit RSC and API payloads;
- remove question title from mock-interview history, scorecard, Review labels, and deletion confirmation.

Exit criteria: no forbidden question identity or content appears in active DOM, RSC payloads, API responses, provider setup, accessibility text, or browser metadata.

### Stage 2 — Layout and compact Guiding Star

- reorder active page to Question → Live Interviewer → Code → compact guide → current phase;
- replace verbose cards with compact phase-name-only tiles;
- retain current/completed/suggested states through icons, semantics, and hidden accessible labels;
- remove active evidence summaries and descriptions.

Exit criteria: desktop/mobile layout matches the requested hierarchy and every visible phase tile contains only its phase name.

### Stage 3 — Post-interview Review and evidence privacy

- create the completed-owner Review route;
- render phase notes, transcript, code versions, scratchpad, complexity, and evidence timeline after completion;
- add Scorecard/Review navigation and history action;
- introduce sanitized active and completed-review query boundaries;
- tighten RLS/read grants so raw evidence is unavailable during active sessions.

Exit criteria: submitted phase/transcript evidence disappears from the active UI and is accessible to the owner only after completion.

### Stage 4 — Full-voice pending activation

- add voice-required activation fields and constraints;
- add preflight, pending start, activation, heartbeat, cancel, and reconnect behavior;
- make the timer start only on confirmed activation;
- prevent legacy RPC/start bypasses;
- require a recent voice lease for phase/submit/complete mutations.

Exit criteria: a new interview cannot start its timer or advance without a real configured voice connection.

### Stage 5 — Voice-only panel

- auto-connect on entry;
- remove typed messages and live transcript;
- remove optional/end-voice language and controls;
- preserve audio transcript persistence for Review;
- block progression during disconnect and restore it after lease recovery.

Exit criteria: there is no learner path for conducting a new mock interview as text-only.

### Stage 6 — Provider parity and security hardening

- enforce the same prompt-only context for Gemini and OpenAI;
- verify no hidden content travels through Gemini browser responses or client tool messages;
- preserve ephemeral credentials and server-created OpenAI configuration;
- add payload, RLS, ownership, lease, prompt-injection, and secret-leak tests;
- update operational events and client-bundle audit.

Exit criteria: both providers satisfy the same voice-only and content-minimization contract without exposing secrets or hidden question fields.

### Stage 7 — Acceptance, documentation, and rollout

- update architecture, database, realtime, mock-interview, security, deployment, implementation-status, and previous-plan supersession notes;
- run all quality gates;
- perform desktop/mobile keyboard and screen-reader review;
- test microphone denial, initial failure, mid-interview disconnect, reconnect, completion, Review, deletion, and refresh;
- document live provider acceptance still requiring real credentials/quota.

Exit criteria: all automated gates pass and the remaining live/manual deployment checks are explicit.

## Likely files and areas to change

### Active pages and components

- `src/app/(app)/interviews/page.tsx`
- `src/app/(app)/interviews/[interviewId]/page.tsx`
- `src/app/(app)/interviews/[interviewId]/scorecard/page.tsx`
- new `src/app/(app)/interviews/[interviewId]/review/page.tsx`
- `src/app/(app)/interviews/history/page.tsx`
- `src/components/mock-interviews/mock-interview-setup-form.tsx`
- `src/components/mock-interviews/mock-interview-workspace.tsx`
- `src/components/mock-interviews/interview-question-panel.tsx`
- `src/components/mock-interviews/interview-phase-guide.tsx`
- `src/components/mock-interviews/realtime-interview-panel.tsx`
- `src/components/mock-interviews/interview-coding-workspace.tsx`
- `src/components/mock-interviews/delete-interview-form.tsx`
- new focused voice-launcher and post-interview Review components

### Server/domain/provider boundaries

- `src/features/mock-interviews/actions.ts`
- `src/features/mock-interviews/queries.ts`
- `src/features/mock-interviews/schema.ts`
- `src/features/mock-interviews/rollout.ts`
- `src/domain/interview-phase-guide.ts`
- `src/features/interview-evaluation/question-content.ts`
- `src/features/interview-evaluation/evidence-model.ts`
- `src/features/interview-evaluation/evidence.ts`
- `src/features/realtime-interviews/config.ts`
- `src/features/realtime-interviews/model.ts`
- `src/features/realtime-interviews/actions.ts`
- `src/features/realtime-interviews/instructions.ts`
- `src/features/realtime-interviews/provider.ts`
- Gemini and OpenAI realtime adapters
- `src/app/api/realtime/gemini-session/route.ts`
- `src/app/api/realtime/interview-session/route.ts`
- `src/lib/env.ts`
- `src/lib/operational-events.ts`

### Database/configuration/tests/docs

- additive migrations under `supabase/migrations/`
- generated `src/types/database.ts`
- `.env.example`
- `scripts/check-production-env.mjs`
- `scripts/audit-client-bundle.mjs`
- `.github/workflows/ci.yml`
- component, domain, provider, integration, and Playwright tests
- `docs/mock-interviews.md`
- `docs/realtime-interviewer.md`
- `docs/database.md`
- `docs/security.md`
- `docs/deployment.md`
- `docs/architecture.md`
- `docs/implementation-status.md`
- earlier action plan/report documents that now contain superseded fallback language

## Required test plan

### Unit and component tests

- active prompt props contain only `prompt`;
- title, external ID, difficulty, examples, constraints, version, provenance, and source link are absent;
- prompt is always visible and not collapsible;
- phase tiles render phase names only;
- current phase has `aria-current="step"` and hidden state text;
- no captured summary/objective appears active;
- Live Interviewer precedes code in DOM order;
- typed-message input and live transcript are absent;
- voice availability disables setup without a provider;
- microphone preflight denial prevents action submission;
- editor remains LTR in Hebrew and saves while reconnecting;
- Review renders completed evidence and rejects active-state data.

### Provider-contract tests

- Gemini and OpenAI receive the same prompt-only question context;
- provider instructions contain no title, difficulty, external ID, URL, examples, constraints, invariants, or private tests;
- Gemini session response does not contain forbidden content;
- provider keys/tokens never appear in responses or static bundles;
- transcript/code cannot forge activation, heartbeat, or phase transitions;
- phase suggestion still accepts only the immediate successor;
- provider failure cannot unlock a text workflow.

### Database integration tests

- versioned start creates a voice-required pending row with timer stopped;
- unauthenticated/cross-owner activation is rejected;
- activation requires an owned active realtime session and is idempotent;
- first activation starts the timer exactly once;
- refresh/reconnect does not reset start time;
- stale heartbeat rejects phase advance, code completion, and interview completion;
- workspace autosave remains allowed during reconnect;
- heartbeat recovery restores mutations;
- pending cancellation cascades partial realtime rows and creates no history/profile/coverage evidence;
- direct active reads cannot retrieve notes, transcript, phase evidence, problem ID, title, slug, or external ID;
- completed-owner Review returns bounded evidence;
- active/abandoned/foreign Review is rejected;
- legacy active rows follow the documented compatibility rule;
- deletion removes completed Review evidence and recomputes profile influence.

### Browser tests

- setup with unavailable realtime shows no start path;
- microphone denial creates no interview;
- successful test-provider connection activates timer and page controls;
- active DOM and captured RSC/API responses contain none of the forbidden title/example/constraint/source values;
- exact layout order is Guiding Star → Question → Live Interviewer → six recent speech turns → Code;
- compact guide works on desktop and mobile;
- no typed input or live transcript exists;
- disconnect blocks advancement while preserving editor content;
- reconnect restores progression without resetting timer;
- completed Review shows saved transcript, phase work, scratchpad, and code;
- history/scorecard/review/delete UI never shows the catalog question name;
- Hebrew voice UI and scratchpad remain RTL while source stays LTR;
- completed interview deletion removes Review access.

CI must not call real paid providers. Use a deterministic test-only realtime adapter or route interception that cannot be enabled in production and that still exercises the activation/heartbeat contract.

## Quality gates

Run and report exact results:

```text
npm run format:check
npm run lint
npm run typecheck
npm test
npm run test:integration
npm run test:e2e
npx supabase db lint --local
npm run build
npm run audit:client-bundle
```

Also run `npm run env:check:production` with intentionally supplied non-secret test values and the required full-voice configuration. Never print real provider secrets.

## Definition of done

This redesign is complete only when:

- no mock-interview learner-facing surface shows the catalog question name;
- the active learner receives only approved question wording, not separate examples, constraints, difficulty, ID, version, provenance, or source link;
- forbidden fields are absent from active DOM, RSC, API, accessibility, metadata, and client-direct provider payloads;
- Live Interviewer is directly below the question;
- the recent-conversation panel is directly below Live Interviewer and the coding workspace follows it;
- the Guiding Star uses compact phase-name-only tiles;
- only the six most recent completed transcript turns are readable during the active interview; older transcript and all phase/rubric evidence remain hidden;
- completed owners have a dedicated Review experience for transcript, phase work, scratchpad, and code;
- new mock interviews cannot be created or progressed without configured full voice;
- the timer starts only after confirmed voice activation;
- typed fallback and live transcript UI are removed;
- disconnect requires reconnect or whole-interview abandonment, without losing editor work;
- model/provider output cannot bypass the ordered phase state machine;
- all security, accessibility, integration, provider, browser, build, and secret-audit gates pass;
- documentation clearly states that live provider credentials/quota and real microphone acceptance remain deployment responsibilities.

## Expected final implementation report

The implementing LLM must report:

1. every learner-visible active-page change;
2. every removed question-identity/content field and how payload absence was verified;
3. the final active DTO and Review DTO boundaries;
4. the voice preflight, pending, activation, heartbeat, reconnect, cancel, and completion lifecycle;
5. database migrations, grants, RLS policies, RPCs, and generated types;
6. how legacy active interviews were handled without data loss;
7. provider-specific changes for Gemini and OpenAI;
8. how only six recent completed transcript turns are exposed while older transcript and phase evidence stay hidden until completion;
9. the final page order and compact guide accessibility behavior;
10. exact automated test and quality-gate results;
11. direct links to primary changed files;
12. any real provider, microphone, quota, hosted migration, or deployment acceptance still requiring the owner.
