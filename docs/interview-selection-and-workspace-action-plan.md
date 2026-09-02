# Interview Selection and Workspace Expansion — LLM Action Plan

> Historical plan. Active mock-interview display, full-voice enforcement, evidence visibility, and Review behavior are superseded by [full-voice-mock-interview-redesign-action-plan.md](full-voice-mock-interview-redesign-action-plan.md).

## Purpose

This document instructs an implementation LLM to extend the interview-first product with:

- balanced random topic coverage across the 18 NeetCode 150 algorithm topics;
- post-coverage **Improvement** and **Learning** selection modes;
- an always-available manual topic-and-difficulty selection path;
- explainable mode-selection UI;
- owner-authorized interview deletion that removes the interview's profile impact;
- an always-visible, approved question prompt;
- a persistent Python/Java interview editor and scratchpad;
- LLM review of the learner's submitted code;
- a live phase “guiding star” populated from interview evidence.

Use the user-provided `NeetCode 150 Trainer` HTML as a behavioral reference for balanced random selection, recency avoidance, problem-repeat avoidance, progress counts, and deletion. Do not copy its styling or question text blindly into the product.

## Working rules for the implementing LLM

1. Read the repository `AGENTS.md` completely before editing.
2. Read the relevant Next.js 16 documentation under `node_modules/next/dist/docs/` before changing pages, route handlers, Server Actions, or Server/Client Component boundaries.
3. Inspect the current implementation before changing it. Preserve authentication, forced RLS, one-active-interview enforcement, no-overlapping-practice enforcement, timer persistence, Gemini Live, OpenAI Realtime, typed fallback, evaluator fallback, language support, and historical scorecards.
4. Implement this work in the stages defined below. Verify every stage before starting the next stage.
5. Use only additive Supabase migrations. Never rewrite an applied migration and never reset user or production data.
6. Keep provider keys server-only. Never add a provider key to a `NEXT_PUBLIC_` variable or a browser payload.
7. Treat transcript text, code, scratchpad text, question content, model output, and phase signals as untrusted input. Validate and bound every value at every boundary.
8. Do not let an LLM directly mutate interview state or database rows. Model suggestions must pass deterministic server validation.
9. Do not execute learner code inside the Next.js process. Python or Java execution requires an isolated, resource-limited runner. Editing and LLM review may ship before execution.
10. Do not describe LLM code review as proof of correctness. Only trusted private tests from an isolated runner may support a strong correctness claim.
11. Preserve the existing distinction between learning mastery and interview performance.
12. Recommendations must remain guidance, not permissions, except where a mode is mathematically undefined because sufficient evidence does not exist.
13. Update generated database types, tests, and product/deployment documentation with every schema or configuration change.
14. Do not commit, push, deploy, or mutate production unless the user explicitly requests it.

## Current-state findings

### Catalog and topic taxonomy

- `data/problems.json` contains exactly 150 problems across exactly 18 primary problem topics.
- The curriculum contains 21 topics. The three curriculum-only topics are:
  - Interview Fundamentals;
  - Big-O;
  - Programming Foundations.
- The interviewable NeetCode topic universe is therefore the 18 primary topics represented by the 150-problem catalog, not all 21 curriculum topics.
- Do not scatter the number `18` through business logic. Introduce one canonical NeetCode 150 collection boundary and derive its topic count. Assert in a catalog test that the current collection has 150 problems and 18 primary topics.

### Existing question selection

- `startMockInterviewAction` currently obtains the learning recommendation snapshot and calls `selectInterviewProblem`.
- `adaptive` chooses the highest-ranked eligible learning recommendation.
- fixed Easy, Medium, or Hard chooses from the complete active catalog at that difficulty and orders candidates by the existing learning score.
- the last five mock-interview problem IDs are avoided when another candidate exists.
- there is no persisted selection mode distinct from difficulty mode.
- the new interview-performance profile currently recommends difficulty and duration in the UI, but it does not directly choose the topic used by `startMockInterviewAction`.

### Existing prompt and editor boundaries

- the catalog stores problem metadata and an external URL, not an approved full prompt.
- `questionsBySlug` in `src/features/interview-evaluation/question-content.ts` is intentionally empty.
- the interview UI receives title, difficulty, external ID, and canonical URL; it does not receive an approved full question prompt.
- the implementation phase has a code snapshot textarea. It is not a persistent IDE available from the beginning of the interview.
- the code-runner boundary already models Python and Java, but there is no configured trusted runner provider or private test corpus.

### Existing phase tracking

- the database has an ordered phase state machine:
  `intro → clarify → examples → brute_force → optimization → implementation → testing → complexity → retrospective → completed`.
- the current UI displays the phases and advances them through explicit learner actions.
- phase notes are saved, but the UI is not yet a live evidence summary populated from transcript and code events.

### Existing profile calculation and deletion implications

- the interview-performance profile is derived from current completed/provisional evaluation rows joined to completed interviews.
- scorecards, evaluations, realtime sessions, and events are dependent records that must be verified for cascade behavior.
- interview completion also updates mutable fields such as `topic_mastery.mock_interview_count` and `last_interviewed_at`.
- deleting only the interview row without recomputing mutable aggregates can leave stale profile/analytics state.
- browser roles currently have no general direct-write authority over evaluation rows. Preserve this boundary.

## Product decisions and requirement conflicts

The implementing LLM must record these decisions in code comments or documentation where appropriate and must not invent silent fallbacks.

### Conflict 1: “18 interviews” versus “one interview in each of 18 topics”

The unlock condition is topic coverage, not total interview count.

```text
coverage complete = every active NeetCode 150 topic has at least one
completed, non-deleted mock interview owned by the learner
```

A learner with 18 interviews in the same topic has covered one topic, not 18. Abandoned interviews do not count. A completed interview counts even when the answer was failed or partial because coverage measures exposure, not success. Deleting the only completed interview in a topic removes that topic from coverage.

### Conflict 2: required coverage versus free interview choice

The earlier interview-first specification says recommendations must not become permissions. The new request introduces an evidence prerequisite for Improvement mode.

Implement the following reconciliation:

- before full coverage, **Coverage** is the default and strongly recommended path;
- **Custom topic** remains available at all times because the user explicitly requested manual topic and difficulty selection;
- **Learning** remains available at all times because it has a valid learning-readiness model even before interview coverage is complete;
- **Improvement** is disabled until every interviewable topic has evidence, because “weakest across all topics” is not comparable while some topics have no evidence;
- the disabled Improvement card must explain exactly which topics are still missing;
- no difficulty, duration, interviewer level, language, or custom topic is locked by learning mastery.

If the product owner instead wants Coverage to be mandatory, stop and request that explicit change because it conflicts with the existing non-blocking product principle.

### Conflict 3: fixed difficulty can make coverage impossible

Not every topic has a problem at every difficulty. Examples in the current catalog include no Hard Arrays & Hashing problem and no Easy Graphs problem.

For Coverage and Improvement modes:

- use a multi-select difficulty filter with Easy, Medium, and Hard, defaulting to all three, matching the attached reference flow;
- select only topics that have an active problem in at least one selected difficulty;
- if uncovered or weak topics exist but none match the selected difficulty filter, return an explicit setup message listing the mismatch and ask the learner to widen the filter;
- never silently select a covered/strong topic merely to satisfy a narrow difficulty filter;
- store the selected filter and actual problem difficulty separately.

For Custom mode, use one explicit difficulty because the requested combination is intentional. Return a clear error when the chosen topic/difficulty has no active inventory.

### Conflict 4: “original wording” versus current content rights and data

The current repository does not contain licensed original LeetCode statements. Titles and links are not permission to copy full problem text. The attached HTML contains short descriptions, not demonstrably licensed original statements.

Required resolution:

- use the existing first-party question-content boundary;
- store only content that is authored in-house, supplied with confirmed reuse rights, or licensed;
- never scrape LeetCode at runtime or during build;
- do not label paraphrased text as “original wording”;
- if the user confirms that attached descriptions are owned and approved, they may seed draft first-party prompts, but they still require constraints, examples, content versioning, and review;
- a question is `interview_ready` only when an approved prompt exists;
- before enabling the feature, ensure every topic and supported selection combination has adequate interview-ready inventory, or expose the exact unavailable combinations.

The interview UI should say “Question” or “Interview prompt.” It may say “Original prompt” only when source provenance explicitly supports that claim.

### Conflict 5: random selection versus reproducible tests and audits

Production randomness must be real, while tests must be deterministic.

- define the selection algorithm as a pure domain function that accepts an injected `randomIndex(upperBound)` dependency;
- use `crypto.randomInt` in the server adapter;
- use fixed test sequences in unit tests;
- persist bounded selection metadata: selected mode, candidate topic count, candidate problem count, recency fallback used, repeat fallback used, and algorithm version;
- do not persist the random source or secrets.

### Conflict 6: LLM code scanning versus correctness

The realtime interviewer may review code and respond to it, but that review is advisory interview behavior. It must not be represented as trusted execution or guaranteed correctness. Preserve reduced correctness confidence until first-party content and a trusted sandbox supply executable evidence.

### Conflict 7: automatic phase detection versus authoritative interview state

The model may misclassify conversation state or be manipulated by transcript/code text. Therefore:

- the server-owned ordered state machine remains authoritative;
- the provider may emit a structured suggestion for the next phase, never an arbitrary phase mutation;
- the server validates ownership, current phase, next allowed phase, event freshness, and bounds;
- typed/no-AI interviews retain manual phase controls;
- provide a learner-visible correction/fallback when automatic detection is unavailable or wrong.

## Target selection experience

### Pre-interview screen

Show a coverage header before the selection cards:

```text
Topic coverage: 7 / 18
11 topics still need a completed interview.
```

Each selection option must be a separate card with an explicit explanation, availability state, inputs, and selection preview.

#### Coverage

Suggested copy:

> Build a baseline across all 18 NeetCode topics. We randomly choose from topics with the fewest completed interviews, avoid your two most recent topics when possible, and prefer a question you have not completed before.

- default before coverage is complete;
- difficulty chips: Easy, Medium, Hard; all selected by default;
- while any topic has zero completed interviews, choose only from zero-count topics that match inventory;
- exclude the two most recently completed interview topics when another eligible topic exists;
- after selecting a topic, prefer active interview-ready questions never used in a completed interview by this learner;
- allow a repeated question only when no fresh question exists in the selected topic and difficulty pool;
- if Coverage remains visible after 18/18, relabel it **Balanced random** and continue choosing from the least-covered topics. Otherwise hide it from the primary cards after completion but retain the persisted mode for history. Treat this as a product-owner decision; the default implementation may keep it as a secondary option.

#### Improvement

Suggested copy:

> Focus on interview topics where your evaluated performance is currently weakest. We randomly choose among your three weakest topics, then prefer a fresh question in your selected difficulty range.

- unavailable until 18/18 topic coverage;
- rank topics by the existing challenge-adjusted interview topic score, ascending;
- use the bottom three topics as the weak set;
- break score ties by lower confidence, then older evidence, then canonical topic order;
- randomly select one eligible weak topic after applying difficulty inventory;
- within that topic, randomly select an active interview-ready fresh question;
- if every question in the pool was previously completed, permit a repeat and label it in selection metadata;
- display the three weak topics and concise evidence before start; do not reveal which one was randomly chosen until the interview starts if topic hiding is preserved;
- do not replace missing interview evidence with learning mastery. Missing evidence belongs to Coverage, not Improvement.

#### Learning

Suggested copy:

> Choose the question your learning model says you are most ready for now. This uses mastery, completed prerequisites, recent practice, failure signals, review timing, and interview-date urgency.

- available at all times after onboarding and diagnostic;
- preserve the current adaptive eligibility and scoring policy;
- choose from the highest-ranked eligible candidate pool;
- avoid recently interviewed problems when alternatives exist;
- do not inject interview-performance weakness into this mode; that is the purpose of Improvement;
- show two or three plain-language reasons from the adaptive score breakdown;
- keep difficulty adaptive in this mode. If a fixed difficulty override is later allowed, label it as a custom constraint and do not claim the result is the pure Learning recommendation.

#### Choose topic

Suggested copy:

> You choose one of the 18 NeetCode topics and an exact difficulty. We randomly choose an active question in that combination. This interview counts in your history, topic coverage, profile, and future recommendations like every other interview.

- available at all times;
- topic options must come from the canonical NeetCode 150 collection, not all 21 curriculum topics;
- difficulty is exactly one of Easy, Medium, or Hard;
- show the available problem count for the selected combination;
- disable only combinations with zero active interview-ready questions and explain why;
- prefer a question not previously completed by the learner, then allow a repeat when necessary;
- completing the interview contributes normally to profile/history/coverage;
- abandoning it does not contribute profile or coverage evidence.

### Other setup fields

Duration, interviewer level, interview language, and coding language remain independent of selection mode.

- duration: 30, 45, or 60 minutes;
- interviewer level: Beginner or Tough FAANG;
- interview language: Automatic, English, or Hebrew;
- coding language: Python or Java initially;
- default coding language from the declared profile when it maps to a supported value, otherwise Python;
- every option group includes short explanatory copy;
- all selected values are persisted as immutable interview snapshots.

## Canonical selection model

Create a new pure domain boundary instead of expanding `actions.ts`:

```ts
type InterviewSelectionMode =
  "coverage" | "improvement" | "learning" | "custom";

type InterviewSelectionRequest = {
  mode: InterviewSelectionMode;
  selectedDifficulties: Array<"easy" | "medium" | "hard">;
  requestedTopicId: string | null;
};

type InterviewSelectionResult = {
  problemId: string;
  selectedTopicId: string;
  actualDifficulty: "easy" | "medium" | "hard";
  explanation: string[];
  metadata: {
    algorithmVersion: number;
    candidateProblemCount: number;
    candidateTopicCount: number;
    recencyFallbackUsed: boolean;
    repeatFallbackUsed: boolean;
  };
};
```

Suggested modules:

- `src/domain/interview-selection.ts` — pure policies and injected randomness;
- `src/features/mock-interviews/selection.ts` — owned data assembly and server RNG adapter;
- `src/features/mock-interviews/actions.ts` — validation, orchestration, RPC, redirect only;
- `src/domain/neetcode-150.ts` — canonical collection/topic helpers if the collection is not modeled in the database.

### Coverage algorithm

1. Read learner-owned completed, non-deleted mock interviews in the canonical collection.
2. Count completed interviews per primary topic.
3. Build the active, interview-ready problem pool matching the selected difficulty set.
4. Keep topics whose count equals the minimum count among the eligible topic pool. Before 18/18 this naturally means zero-count topics.
5. Remove the two most recently completed interview topics when another candidate topic exists.
6. Randomly choose one remaining topic.
7. Within that topic, keep fresh problems when at least one fresh problem exists.
8. Randomly choose the final problem.
9. Return explicit fallback metadata and plain-language reasons.

### Improvement algorithm

1. Verify full topic coverage from completed, non-deleted interviews.
2. Read the current interview-performance topic profile.
3. Sort all 18 topics by adjusted score ascending, lower confidence, older evidence, then canonical order.
4. Take the first three topics.
5. Intersect them with active, interview-ready inventory matching the selected difficulties.
6. If the intersection is empty, return a setup error asking the learner to widen difficulty selection.
7. Avoid the two most recent interview topics when another weak topic exists.
8. Randomly choose a topic and then a fresh problem, falling back to repeats only when required.

### Learning algorithm

1. Reuse the existing adaptive recommendation context and score calculation.
2. Use only eligible candidates when at least one exists; retain the current safe fallback when none are eligible.
3. Keep the problem/topic candidate tied to the learning score that produced it.
4. Prefer a problem outside the last five mock interviews.
5. Return adaptive recommendation reasons as the selection explanation.

### Custom algorithm

1. Validate the requested topic belongs to the canonical NeetCode 150 topic set.
2. Validate exactly one requested difficulty.
3. Build the active, interview-ready pool for that exact combination.
4. Prefer never-completed questions.
5. Randomly select within the fresh pool, or the complete pool when repeats are unavoidable.

## Persistence plan

Add an additive migration. Keep existing columns and historical behavior for backward compatibility.

### Mock interview selection snapshot

Add bounded columns or an equally strict normalized selection record for:

- `selection_mode`: `legacy`, `coverage`, `improvement`, `learning`, or `custom`;
- `requested_topic_id`: nullable topic reference;
- `requested_difficulties`: bounded difficulty array;
- `selected_topic_id`: non-null topic snapshot/reference for new interviews;
- `selection_algorithm_version`: positive integer;
- `selection_metadata`: bounded JSON with only approved keys;
- `coding_language`: `python` or `java`;
- `question_content_version`: nullable until approved content exists.

Do not overload the existing `difficulty_mode` with the new selection modes. Continue populating it for legacy consumers:

- Learning maps to `adaptive`;
- Custom with one difficulty maps to that fixed difficulty;
- Coverage/Improvement store the actual selected difficulty in the legacy field or add a documented compatibility value through a new check migration. Prefer storing actual difficulty while retaining requested difficulty filters in the new column.

Update `start_mock_interview` through a new function signature or a versioned function. The database function must validate that:

- the authenticated user owns the request context;
- the selected problem is active and interview-ready;
- the selected problem belongs to the selected topic;
- its difficulty matches the permitted filter;
- Custom requests match the exact requested topic/difficulty;
- one-active-interview and no-overlapping-practice constraints remain enforced.

### Canonical collection membership

Choose one explicit approach:

1. preferred: add problem-collection tables and seed a `neetcode-150` collection plus its 150 memberships; or
2. acceptable short-term: define one reviewed list of 150 problem slugs in a domain module and validate it against the database catalog.

Do not infer NeetCode 150 forever from “all active problems,” because future catalog additions would silently change the 18-topic coverage contract.

### Question content

Add a server-only, versioned question-content source with:

- stable question ID/problem ID;
- display prompt;
- constraints;
- public examples;
- source/provenance and rights status;
- content version and review timestamp;
- expected invariants for evaluation only;
- private evaluator tests for the trusted runner only;
- `interview_ready` status.

Never send expected invariants, solutions, or private tests to the browser or realtime model. The live interviewer may receive only the learner-visible prompt, public constraints/examples, current phase, code snapshot, and bounded transcript context.

### Editor and scratchpad persistence

Persist independently:

- latest code snapshot, maximum 30,000 characters;
- coding language snapshot;
- scratchpad, maximum 10,000 characters;
- updated timestamp/version for optimistic concurrency;
- bounded code-snapshot events at meaningful checkpoints, not on every keystroke;
- final submitted-code event when the learner says coding is finished.

Use a debounced authenticated Server Action/RPC and an explicit save-state indicator. Do not write on every keystroke. Prevent stale browser tabs from overwriting newer code silently.

### Phase evidence

Prefer an additive `mock_interview_phase_events` table rather than treating one mutable interview row as a complete event history. Store:

- interview ID and owner ID;
- phase and transition type;
- source: learner action, interviewer signal, fallback, or system;
- started/completed timestamp;
- bounded evidence references to transcript event IDs, code snapshot IDs, or saved note fields;
- bounded display summary generated from owned evidence;
- provider/model metadata when a model suggested the transition.

Browser roles must not insert arbitrary phase events directly. Use narrow owned RPCs.

## Interview deletion plan

### Required behavior

- show Delete on interview history and interview detail/scorecard pages;
- require a confirmation dialog that names the interview and states that scores, transcript, code snapshots, profile influence, and coverage influence will be removed;
- do not permit hard deletion of an active interview. Require abandon/end first;
- only the authenticated owner may delete;
- after deletion, redirect away from deleted detail routes and revalidate history, dashboard, interview profile, progress, recommendations, and setup coverage;
- deletion must be atomic and idempotent from the UI perspective.

### Database operation

Create a narrow `delete_owned_mock_interview(p_mock_interview_id uuid)` security-definer function with a fixed empty search path and explicit grants.

Within one transaction:

1. derive the user from `auth.uid()`;
2. acquire the same per-user advisory lock family used by interview start/completion;
3. select and lock the owned non-active interview;
4. capture the affected topic ID before deletion;
5. delete or cascade all dependent scorecards, evaluation versions, realtime sessions/events, phase events, code snapshots, and usage records;
6. delete the interview;
7. recompute `topic_mastery.mock_interview_count` and `last_interviewed_at` from remaining completed interviews rather than decrementing blindly;
8. ensure every derived profile/recommendation query excludes the deleted evidence naturally;
9. emit a privacy-safe operational deletion event containing IDs/status only, never transcript or code.

Audit every foreign key. Add missing `on delete cascade` behavior only where ownership and lifecycle match. Do not cascade from a deleted interview into shared problems, topics, curriculum, or learner practice attempts.

### Race conditions

- deletion racing with evaluation finalization must result in either a fully retained interview/evaluation or a fully deleted interview, never an orphan evaluation;
- a pending evaluator must handle “interview deleted” as a sanitized terminal outcome;
- repeated Delete requests return a safe not-found/already-deleted result;
- two tabs cannot delete and re-evaluate the same interview into inconsistent state.

## Always-visible question panel

Add a sticky question panel at the top of the interview workspace.

### Content

- approved learner-visible prompt;
- constraints;
- public examples;
- difficulty and timer status;
- no topic, pattern, solution, expected invariant, or private test data before completion;
- optional canonical-source link, clearly separate from embedded approved content.

### Behavior

- visible from Intro through completion;
- sticky on desktop;
- collapsible but one-tap accessible on mobile;
- preserve line breaks, code formatting, lists, and RTL/LTR behavior safely;
- render as text/structured content, never unsanitized HTML;
- remain usable when realtime/AI is unavailable;
- do not translate source code or examples automatically.

Selection must not choose a problem that lacks approved prompt content once this requirement is enabled. Provide a staged feature flag until sufficient content is available.

## Python/Java interview editor and scratchpad

### UI structure

Show from the beginning of the interview:

- **Scratchpad** — free-form reasoning and diagrams-as-text;
- **Code** — syntax-aware editor with Python/Java selector fixed to the interview snapshot after start;
- save-state indicator: Saving, Saved, or Save failed;
- explicit **I’m done coding** action during Implementation;
- optional **Send current code to interviewer** action before completion, with clear disclosure.

Use a focused client component loaded dynamically so the main Server Component remains server-safe. Choose a maintained editor such as CodeMirror 6 or Monaco after evaluating bundle size, accessibility, mobile behavior, and CSP requirements. Do not build an editor from an uncontrolled `contenteditable` element.

### LLM review flow

When the learner submits code:

1. persist the latest bounded snapshot first;
2. create a structured context event containing language, snapshot version, phase, and code;
3. delimit code as untrusted data in provider instructions;
4. tell the interviewer to review silently until the interview flow calls for a response;
5. in Tough FAANG mode, respond with a concise test case or the next interview instruction without explaining the bug;
6. in Beginner mode, preserve the existing bounded assistance policy;
7. persist the completed interviewer response/transcript event;
8. make the final snapshot available to the post-interview evidence assembler.

The provider must not claim it ran the code. UI wording should be “Code sent for interviewer review,” not “Tests passed.”

### Optional trusted execution stage

If actual Python/Java execution is added:

- implement a real `TrustedCodeRunnerProvider` outside the Next.js process;
- allow only Python and Java initially even though the model enum currently lists more languages;
- use approved first-party/private tests;
- enforce CPU, wall time, memory, output, process, filesystem, and network limits;
- sanitize compile/runtime failures;
- keep private tests server-only;
- persist only bounded results;
- treat runner unavailability as missing evidence, not failure.

Do not block the editor/LLM-review release on a runner, but do block strong correctness claims.

## Live phase guiding star

Replace the static-looking phase list with an accessible live tracker.

### Visual states

Each phase shows exactly one of:

- completed — checkmark and concise captured-evidence summary;
- current — visually prominent, with “You are here” text for non-visual users;
- suggested next — subtle preview of the next objective;
- future — muted and not yet active;
- needs confirmation — model suggested transition but deterministic confirmation is required.

Do not call this live tracker the final “rubric.” It is a process guide. Final scoring remains separate.

### Evidence population

Populate summaries from persisted sources, not invented model prose:

- Clarify: learner clarification transcript turns and saved clarification notes;
- Examples: examples stated and relevant transcript references;
- Brute force: baseline approach and complexity statements;
- Optimization: bottleneck, invariant, tradeoff, and final approach statements;
- Implementation: language, code snapshot version, and submission timestamp;
- Testing: learner test cases, dry runs, trusted-test result when available;
- Complexity: stated time/space and supporting explanation;
- Retrospective: learner result and bounded retrospective.

Model-generated summaries must cite event IDs internally, remain bounded, and be labeled as generated summaries. Raw learner evidence remains the source of truth.

### Phase signaling contract

Extend both Gemini and OpenAI realtime adapters through a provider-neutral event:

```ts
type InterviewPhaseSuggestion = {
  interviewId: string;
  expectedCurrentPhase: MockInterviewPhase;
  suggestedNextPhase: MockInterviewPhase;
  evidenceEventIds: string[];
  reasonCode: string;
};
```

Validation rules:

- the suggestion may name only the immediately next phase;
- event IDs must belong to the same learner and interview;
- arrays and strings are bounded;
- code/transcript content cannot supply tool arguments directly;
- duplicate suggestions are idempotent;
- stale suggestions are ignored;
- provider failure leaves manual controls operational.

Recommended transition policy:

- transcript-only phase suggestions update the UI to “needs confirmation” or enable the next action;
- the learner or a deterministic product event confirms the transition;
- “I’m done coding” may deterministically move Implementation to Testing after the snapshot is persisted;
- never allow a model to skip phases or complete the interview.

## Requirement-by-requirement implementation plan

### Requirement 1: cover every NeetCode topic before Improvement

1. Create canonical collection membership and coverage query.
2. Count only completed, non-deleted interviews by primary topic.
3. Implement the injected-RNG coverage selector based on the attached algorithm.
4. Add two-topic recency avoidance and fresh-problem preference.
5. Add difficulty-filter inventory errors.
6. Display `covered / total` and missing topic names.
7. Persist selection metadata and algorithm version.
8. Verify that failed/partial completed interviews count, abandoned interviews do not, and deletion reverses coverage.

### Requirement 2: Improvement mode after full coverage

1. Reuse current interview profile topic metrics.
2. Define the bottom-three weak set deterministically.
3. Randomize only after weak-set and difficulty filtering.
4. Explain the weak-topic evidence without revealing the selected interview topic before start.
5. Disable with explicit missing-topic explanation before full coverage.
6. Recompute availability immediately after deletion.

### Requirement 3: Learning mode using Adaptive

1. Preserve the existing learning recommendation score and eligibility policy.
2. Move it behind the explicit Learning card and explanation.
3. Keep learning mastery separate from interview weakness.
4. Persist Learning as the selection mode and the adaptive score breakdown as bounded metadata.
5. Test that the same evidence produces the same Learning choice regardless of Improvement metrics.

### Requirement 4: explanatory copy for every option

1. Use four distinct cards with the copy defined above.
2. Add “How this chooses” expandable details.
3. Show availability and exact reason when unavailable.
4. Show selected difficulty behavior, whether the result is random/adaptive, and how history is affected.
5. Verify accessible names, keyboard navigation, mobile layout, Hebrew RTL, and English copy.

### Requirement 5: manual topic and difficulty random selection

1. List exactly the canonical 18 NeetCode topic options.
2. Show per-difficulty inventory counts.
3. Randomize among active interview-ready problems in the exact combination.
4. Prefer fresh questions, with transparent repeat fallback.
5. Persist and evaluate the interview through the same pipeline as every other mode.
6. Confirm it updates history, coverage, topic profile, difficulty profile, and recommendations.

### Requirement 6: delete interviews and remove their influence

1. Add the owned transactional deletion RPC.
2. Audit and fix dependent foreign keys.
3. Recompute mutable topic aggregates from remaining truth.
4. Add confirmation UX and revalidation.
5. Handle pending evaluation and concurrent requests.
6. Prove through integration tests that deleted evidence disappears from profile, trend, coverage, recurring signals, readiness, and recommendations.

### Requirement 7: always-visible question wording

1. Resolve content provenance before implementation.
2. Version and seed approved question content.
3. Filter selection to interview-ready content.
4. Pass only learner-visible content to the workspace.
5. Render a sticky, safe, accessible question panel.
6. Verify no answer keys/private tests appear in browser payloads or provider messages.

### Requirement 8: Python/Java IDE and LLM code review

1. Add coding-language selection and persistence.
2. Add persistent scratchpad and syntax-aware editor from Intro onward.
3. Add debounced, conflict-safe saves.
4. Add final code submission and provider-neutral context events.
5. Update Gemini/OpenAI interviewer instructions and typed fallback.
6. Include final code in evaluator evidence with strict bounds.
7. Keep execution disabled until a trusted runner exists.

### Requirement 9: live phase guiding star and auto-filled evidence

1. Add canonical phase events/evidence references.
2. Implement the live tracker states.
3. Populate summaries from transcript, notes, code, and timing.
4. Add validated provider-neutral phase suggestions.
5. Preserve manual transition fallback.
6. Prevent skipped phases, stale signals, and transcript prompt injection.

## Staged delivery order

### Stage 0 — Resolve product/content decisions

- confirm content rights/provenance;
- decide whether Coverage remains available as Balanced random after 18/18;
- confirm the default bottom-three definition for Improvement;
- confirm whether pre-start rerolls are desired. The attached reference allows rerolls, but rerolling can undermine realistic interview conditions and leak question inventory. Default: select only when Start is confirmed and do not offer free rerolls.

Exit criteria: decisions documented; no implementation ambiguity remains.

### Stage 1 — Canonical collection, selection schema, and coverage read model

- add collection membership or reviewed allowlist;
- add selection snapshot and coding-language columns;
- add coverage query and generated types;
- retain legacy records as `legacy` without fabricating selection metadata.

Exit criteria: migrations apply from empty/current schema; legacy history still loads.

### Stage 2 — Pure selection policies

- implement Coverage, Improvement, Learning, and Custom policies;
- inject RNG;
- add reasons and explicit empty-inventory outcomes;
- preserve recent-problem avoidance.

Exit criteria: domain unit-test matrix passes.

### Stage 3 — Setup UI

- add coverage header and four explained cards;
- add multi-difficulty filters for Coverage/Improvement;
- add topic+difficulty inventory UI for Custom;
- add coding-language selection;
- persist exact selection snapshots through versioned RPC.

Exit criteria: desktop/mobile/RTL setup journeys pass and all non-empty combinations start.

### Stage 4 — Deletion

- add transactional owned deletion;
- fix cascades and aggregate recomputation;
- add confirmation UX and cache revalidation.

Exit criteria: deletion removes all profile/coverage/recommendation influence without affecting shared/catalog data.

### Stage 5 — Approved question content and sticky panel

- populate reviewed versioned prompts;
- mark interview-ready inventory;
- add safe sticky question panel;
- update provider/evaluator content boundaries.

Exit criteria: every selectable problem has approved learner-visible content and no hidden evaluator content reaches the client.

### Stage 6 — Editor, scratchpad, and code review

- add Python/Java editor and persistence;
- add code submission events;
- connect bounded code context to Gemini/OpenAI and evaluator;
- retain text/no-AI fallback.

Exit criteria: refresh/reconnect preserves code and scratchpad; both languages reach the interviewer safely.

### Stage 7 — Phase guiding star

- add phase event history and live tracker;
- populate evidence summaries;
- add validated phase suggestions;
- keep learner/manual fallback.

Exit criteria: current/completed phases and evidence survive refresh/reconnect and cannot be advanced by untrusted transcript text.

### Stage 8 — Hardening and rollout

- run full security, accessibility, observability, and load review;
- feature-flag new selection and prompt/editor capabilities independently;
- backfill no fabricated profile evidence;
- update documentation and deployment configuration.

Exit criteria: all required quality gates pass.

## Test plan

### Unit tests

- current catalog has 150 members and 18 primary topics;
- coverage is based on distinct covered topics, not total interviews;
- Coverage chooses only minimum-count/uncovered topics;
- two-topic recency avoidance and its fallback;
- fresh-problem preference and repeat fallback;
- injected RNG selects deterministic candidates in tests;
- difficulty filters never silently escape their inventory;
- Improvement is unavailable below 18/18;
- Improvement chooses only from the bottom three topic scores;
- deletion of the only interview in one topic makes coverage incomplete;
- Learning preserves current adaptive eligibility/ranking;
- Custom validates collection topic and exact difficulty;
- selection explanations and metadata are bounded;
- phase suggestion accepts only the immediate next phase;
- Python/Java code and scratchpad bounds;
- provider prompts delimit code/transcript as untrusted input.

### Database integration tests

- additive migrations apply from empty and current schema;
- legacy interviews remain readable;
- selection snapshots cannot be forged through browser table writes;
- owned start RPC validates problem/topic/difficulty/mode consistency;
- one-active-interview and practice exclusion remain enforced;
- only completed interviews count toward coverage;
- owner can delete completed/abandoned history but not another user's interview;
- active interview deletion is rejected;
- dependent scorecards/evaluations/realtime/phase/code records are removed;
- mutable topic aggregates are recomputed correctly;
- profile/recommendation results change immediately after deletion;
- evaluation-finalization/deletion race leaves no orphan rows;
- phase/code RPCs enforce ownership and bounds.

### Browser tests

- pre-coverage screen shows accurate `x / 18` and explanations;
- Improvement disabled with missing-topic explanation;
- Learning and Custom remain available before full coverage;
- difficulty-chip inventory error is actionable;
- after 18/18, Improvement becomes available;
- each of four modes starts the expected kind of interview;
- Custom topic/difficulty interview updates history/profile/coverage;
- deletion confirmation removes history and profile influence;
- question panel remains accessible through all phases on desktop/mobile;
- Python and Java editor selection, autosave, refresh, and reconnect;
- submitted code reaches the live interviewer context;
- guiding star highlights current phase and shows completed evidence;
- typed/no-AI fallback advances manually;
- Hebrew RTL transcript/scratchpad does not alter source-code direction.

### Provider contract and security tests

- Gemini and OpenAI accept the same bounded code-context contract;
- provider keys never appear in client bundles/responses;
- code comments and transcript cannot forge phase tool calls;
- invalid/stale/out-of-order phase signals are rejected;
- prompt, code, scratchpad, evidence, and response sizes are bounded;
- model review never produces a trusted-test claim;
- private question invariants/tests never appear in browser or realtime payloads.

### Quality gates

Run and report exact results for:

```text
npm run format:check
npm run lint
npm run typecheck
npm test
npm run test:integration
npm run test:e2e
npx supabase db lint --local
npm run build
```

Also run the production environment check when its required local variables are intentionally configured. Do not expose secrets in logs or reports.

## Likely files and areas to change

- `data/problems.json`
- `src/domain/mock-interview-selection.ts`
- new `src/domain/interview-selection.ts`
- `src/domain/interview-recommendation.ts`
- `src/domain/interview-profile.ts`
- `src/features/practice/recommendation.ts`
- `src/features/mock-interviews/actions.ts`
- `src/features/mock-interviews/queries.ts`
- `src/features/mock-interviews/schema.ts`
- new `src/features/mock-interviews/selection.ts`
- `src/features/interview-evaluation/question-content.ts`
- `src/features/interview-evaluation/evidence.ts`
- `src/features/interview-evaluation/evidence-model.ts`
- `src/features/realtime-interviews/instructions.ts`
- `src/features/realtime-interviews/model.ts`
- Gemini/OpenAI realtime provider adapters
- `src/features/code-runner/**`
- `src/app/(app)/interviews/page.tsx`
- `src/app/(app)/interviews/[interviewId]/page.tsx`
- `src/app/(app)/interviews/[interviewId]/scorecard/page.tsx`
- `src/app/(app)/interviews/history/page.tsx`
- `src/components/mock-interviews/mock-interview-setup-form.tsx`
- `src/components/mock-interviews/mock-interview-workspace.tsx`
- new focused selection/editor/phase-tracker client components
- `src/types/database.ts`
- additive files under `supabase/migrations/**`
- unit, integration, provider-contract, and E2E tests
- `README.md` and relevant `docs/**`

## Definition of done

This request is complete only when:

- the current NeetCode 150 collection is canonically defined as 150 problems and 18 interviewable topics;
- topic coverage uses distinct completed, non-deleted topic evidence;
- Coverage implements balanced random selection with recency and repeat avoidance;
- Improvement becomes available at full topic coverage and samples only from the weakest topic set;
- Learning uses the current adaptive learning-readiness model without mixing in interview weakness;
- Custom topic+difficulty random selection is always available and contributes normally to history/profile;
- every selection card explains exactly how it works and why it is available/unavailable;
- fixed difficulty inventory gaps produce explicit errors, never silent policy changes;
- selection mode and reasons are persisted and visible in history/scorecard where useful;
- owned interview deletion removes all dependent evidence and recomputes mutable aggregates;
- the deleted interview no longer influences coverage, level, confidence, dimensions, topics, trend, recurring signals, or recommendations;
- every selectable interview has approved, versioned learner-visible prompt content;
- the question panel remains accessible throughout the interview without exposing hidden solution data;
- Python and Java editor/scratchpad state persists across refresh and reconnect;
- submitted code is available to the interviewer and evaluator as bounded untrusted evidence;
- the product does not claim code execution/correctness without a trusted runner;
- the guiding star accurately shows current/completed phases and source-linked evidence;
- model phase suggestions cannot bypass the ordered server state machine;
- text-only/no-AI interviews remain fully usable;
- RLS, ownership, provider-key, prompt-injection, and private-test boundaries remain intact;
- formatting, lint, strict TypeScript, unit tests, integration tests, E2E tests, database lint, and production build pass.

## Final implementation report expected from the LLM

Report:

1. behavior delivered for each requirement;
2. product decisions made for every conflict in this document;
3. migrations added and applied locally;
4. exact selection algorithms and persisted explanation metadata;
5. how deletion removes derived and mutable profile influence;
6. approved question-content source and remaining licensing limitations;
7. editor languages, persistence, LLM review behavior, and runner limitations;
8. phase-detection and fallback behavior;
9. security/privacy boundaries preserved;
10. tests executed and exact results;
11. files changed with direct links;
12. any content review, provider key, runner, deployment, or live acceptance still requiring the user.
