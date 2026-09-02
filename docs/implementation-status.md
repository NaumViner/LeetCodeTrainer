# Implementation status

Last updated: 2026-09-01

## Phase 1 — Repository foundation

**Status:** Complete

### Completed

- Next.js App Router application with strict TypeScript
- Tailwind design tokens and responsive marketing shell
- Reusable navigation, layout, button, card, badge, progress, and feedback primitives
- Global loading, error, and not-found states
- Schema-validated optional environment configuration
- ESLint, Prettier, Vitest, React Testing Library, and Playwright configuration
- Architecture and local-development documentation
- Git repository initialization and secret-safe ignore rules

### Verification

Lint, strict TypeScript, unit/component tests, desktop/mobile browser checks, the production build, and formatting all pass.

## Phase 2 — Database and authentication

**Status:** Complete

### Completed

- Reproducible local Supabase configuration and migration workflow
- Auth-owned profile schema with the complete Phase 2 learner model
- Automatic profile creation for new users and UTC update timestamps
- Forced Row Level Security with own-row select/update policies
- Email/password sign-up, login, local-scope logout, and session refresh
- Optional Google and GitHub OAuth entry points and shared callback route
- Protected application routes and server-side ownership checks
- Short onboarding flow covering role, companies, language, interview date, study time, preparation level, and timezone
- Dashboard and editable profile settings with persisted data
- Unit, database integration, and responsive end-to-end coverage

### Verification

- A learner can sign up, complete onboarding, reach the protected dashboard, log out, and log back in.
- Profile data persists across sessions.
- A second authenticated user cannot read or update the first learner's profile.
- Anonymous profile access is denied.
- A fresh local database reset applies the migration and passes all isolation checks.

### Deployment note

Hosted Supabase deployment is environment-specific and is not linked from the repository. Apply the committed migration to the selected project, set the public URL/key, and configure OAuth provider secrets there. No credentials are committed.

## Phase 3 — Curriculum

**Status:** Complete

### Completed

- Twenty-one ordered topics grouped across curriculum stages
- Normalized topic and lesson prerequisite graphs
- Twenty-one versioned Markdown lessons with objectives, recognition signals, mistakes, complexity guidance, and practice mapping
- Full starter modules for Big-O, Arrays & Hashing, Two Pointers, Sliding Window, Stack, Binary Search, Linked List, Trees, Backtracking, and Graphs
- Learner-owned lesson completion records protected by forced Row Level Security
- Curriculum overview, topic, and lesson screens with progress, prerequisite guidance, and responsive navigation
- Dashboard continuation card and persistent lesson completion action
- Safe, directory-constrained Markdown loading and React rendering

### Verification

- A learner can open all 21 topics and their seeded lessons.
- Completing the first lesson updates topic and overall curriculum progress.
- Completion persists after a full browser refresh.
- Another learner cannot read, insert, or update the owner's lesson progress.
- Anonymous clients can read active curriculum metadata but cannot read private progress.
- A clean database reset recreates the schema, prerequisite graph, and seed content.

## Phase 4 — Problem library

**Status:** Complete

### Completed

- Metadata-only catalog of 150 active LeetCode problems across 18 curriculum topics
- Reproducible JSON importer and deterministic SQL seed generator
- Problem schema covering external identity, canonical URL, difficulty, topics, pattern tags, recognition signals, prerequisites, estimated time, curriculum level, premium status, company tags, ordering, and active status
- Normalized secondary-topic and prerequisite-topic relationships
- Read-only public catalog policies with forced Row Level Security
- Responsive problem library with search, topic, difficulty, curriculum-level, and pattern filters
- Paginated problem cards and a dedicated metadata/detail page with canonical LeetCode links
- Explicit legal-content boundary: no statements, examples, constraints, or solutions are stored

### Verification

- A clean database reset imports exactly 150 unique problems across 18 topics.
- All canonical URLs, identifiers, difficulty values, arrays, and relationship references pass integrity checks.
- Difficulty distribution is 28 easy, 101 medium, and 21 hard.
- Anonymous and authenticated learners can read active metadata; browser roles cannot modify it.
- Unit tests cover catalog validation and combined filters.
- Desktop and mobile browser tests filter the library and open the expected detail page.

## Phase 5 — Practice engine

**Status:** Complete

### Completed

- Deterministic next-problem recommendation with unattempted-problem priority, curriculum gating, completed-topic preference, and stable learner-specific tie-breaking
- One persisted active attempt per learner with ordered pre-attempt, planning, coding, testing, reflection, and completed phases
- Pre-attempt pattern prediction, brute-force reasoning, runtime estimate, and confidence capture
- Refresh-safe start, pause, and reset timer backed by server timestamps and accumulated duration
- Six progressive hint levels with centralized independence scores and automatic help-level tracking
- Testing checklist plus persisted code snapshots, complexity analysis, result, mistakes, missed edge cases, takeaway, and confidence-after reflection
- Completed-attempt summary and automatic handoff to the next recommendation
- Practice entry points from the dashboard, navigation, and any problem detail page
- Responsive, accessible practice workspace with labeled controls and visible workflow state

### Verification

- A clean database reset creates the attempt schema and all constraints.
- A learner cannot create more than one active attempt.
- Timer, planning, code, phase, and hints persist across a full page refresh.
- Revealing a hint automatically updates the attempt's highest assistance level.
- Anonymous and second-user reads and mutations are denied by database policy.
- Structured completion persists the final result and reflection consistently.
- Domain tests cover recommendation priority, legal state transitions, progressive hints, help scores, and timer recovery.
- Desktop and mobile browser tests complete the full practice workflow and receive the next recommendation.

## Phase 6 — Analytics and mastery

**Status:** Complete

### Completed

- Configurable multidimensional performance scoring for correctness, independence, recognition, retention evidence, complexity, and speed
- Immutable 0–1 performance snapshot for every completed attempt
- Smoothed 0–100 topic mastery with uncertainty priors that prevent one lucky solve from displaying 100
- Atomic database trigger that completes performance and mastery updates with the attempt transaction
- Repeat-attempt retention and first-versus-latest improvement evidence
- Coverage-adjusted overall readiness with an explicit training-estimate disclaimer
- Progress screen with readiness dimensions, attempt metrics, repeated mistakes, and all core topic rows
- Topic-level practice mastery integrated into curriculum topic pages
- Attempt history table and private attempt detail pages with performance, reasoning, reflection, previous attempts, and review placeholder
- Dashboard readiness, evidence coverage, weakest practiced topic, and recent-attempt summary
- Responsive Progress and History navigation

### Verification

- Formula tests cover performance weights, help penalties, speed, neutral first-attempt retention, smoothing, readiness coverage, medians, repeat improvement, and repeated mistakes.
- A first assisted solve creates a 0.92 performance snapshot but only 54.95 topic mastery.
- A later independent repeat increases retained evidence and smooths mastery to 68.47 rather than jumping to 100.
- Attempt completion, performance insertion, and mastery updating occur in one database transaction.
- Anonymous and second-user analytics reads reveal no private records; browser analytics writes are denied.
- Desktop and mobile browser tests open attempt analytics, overall progress, topic mastery, history, and the next recommendation.

## Phase 7 — Spaced repetition

**Status:** Complete

### Completed

- SM-2-inspired deterministic scheduler using correctness, help, confidence, elapsed time, retention, repeated failure, and bounded easiness
- Specification-aligned one-day through 30-day interval bands
- Atomic current problem schedule and immutable schedule-event history on attempt completion
- Earliest problem review synchronized into topic mastery
- Learner-timezone Due now, Due today, and Upcoming queue groups
- Problem redo, pattern recall, complexity recall, and earlier-mistake prompts
- Dedicated review mode with previous notes hidden until a fresh pattern prediction
- Earlier-attempt comparison and immediate next-interval confirmation
- Review history with links to the evidence-producing attempts
- Dashboard summary and responsive Review navigation
- Forced-RLS own-row reads, revoked browser writes, and scheduled-problem validation for review mode

### Verification

- Date tests cover failure resets, assistance bands, independent expansion, 30-day capping, and timezone queue boundaries.
- Database tests prove initial scheduling, strong recalled-review expansion, atomic topic synchronization, immutable history, privacy, and read-only schedules.
- The full browser flow creates a schedule, starts an early review, unlocks previous evidence after prediction, completes recall, and opens review history.

## Phase 8 — Adaptive recommendations

**Status:** Complete

### Completed

- Explainable score breakdown for weakness, due review, curriculum and prerequisite fit, topic balance, difficulty, interview urgency, novelty, recency, repetition, and frustration
- Progressive curriculum gates from foundation through guided, independent, timed, and interview levels
- Smoothed-mastery weakness weighting and completed-lesson awareness
- Five-attempt topic-balance window and immediate problem-repeat minimization
- Difficulty promotion from easy to hard only when mastery and independent evidence support it
- Easy recovery behavior after repeated topic failures and escalating same-problem frustration penalties
- Due-problem handoff into the dedicated review workflow
- Stable daily controlled selection among at most five near-equal leaders
- Server-only aggregation of private attempts, mastery, reviews, lessons, and interview date
- Practice-page adaptive score, learner-facing reasons, and safeguard disclosure

### Verification

- Synthetic histories cover weak versus strong topics, recent-topic avoidance, repeat minimization, prerequisite denial, due reviews, failure recovery, strong-evidence promotion, and stable controlled selection.
- Strict types and lint prove the domain boundary accepts normalized evidence rather than database rows.
- Desktop and mobile browser tests display the adaptive score and reasons after real learner history exists.

## Phase 9 — Daily plan

**Status:** Complete

### Completed

- Deterministic three-to-six task generator using available time, local date, due reviews, curriculum position, adaptive problems, same-day workload, and interview date
- Default 20/25/45/10 review, learning, problem-solving, and reflection allocation
- Interview-date allocation adjustment without bypassing readiness gates
- Five-minute task allocation that remains inside the available daily budget
- Ordered overdue review, prerequisite-ready lesson, adaptive problem, and reflection composition
- Learner-timezone daily identity and weekly-study-time default
- Atomic persisted plan generation with advisory locking and immutable expired versions
- Secure item completion, reopening, automatic parent completion, and regeneration
- Dedicated responsive Today page and navigation
- Dashboard plan generation, progress, task preview, and handoff
- Forced-RLS own-row reads with revoked direct browser writes

### Verification

- Unit scenarios cover balanced plans, short days, same-day workload, interview urgency, time budgets, and timezone dates.
- Database tests prove atomic generation, versioned regeneration, completion/reopening, ownership isolation, anonymous denial, and revoked direct mutations.
- Desktop and mobile browser tests generate, complete, regenerate, and reopen the persisted plan from the dashboard.

## Phase 10 — Diagnostic

**Status:** Complete

### Completed

- Profile setup handoff into a required initial diagnostic before the personalized dashboard
- Five-question concept quiz covering complexity, arrays/maps, recursion, trees, and graphs
- Three synthetic pattern-recognition prompts
- Deterministic foundation, intermediate, and advanced coding banks
- Adaptive one-, two-, or three-problem assignment using graded responses and declared experience
- Beginner difficulty guard that prevents an advanced assignment from response score alone
- Private persisted attempts and individual response evidence
- Database-owned answer keys and authoritative transactional grading
- Concept, pattern, coding, overall, and starting-level results
- Conservative per-topic mastery initialization with explicit diagnostic provenance
- Protected profile diagnostic status that browser clients cannot forge
- Resume-safe coding stage and dedicated responsive result screen
- Diagnostic baseline integration with dashboard readiness and weakest-topic evidence

### Verification

- Unit scenarios cover required topic coverage, beginner protection, each adaptive tier, question counts, and placement thresholds.
- Database tests prove exact-answer-set validation, private answer keys, adaptive assignment, atomic completion, mastery initialization, protected profile fields, ownership isolation, anonymous denial, and revoked direct writes.
- Desktop and mobile browser tests complete profile setup, both diagnostic stages, results, dashboard handoff, and the full later learning journey.

## Phase 11 — Mock interviews

**Status:** Complete

### Completed

- Adaptive or fixed-difficulty interview setup with 30-, 45-, and 60-minute options
- Mandatory unpausable, refresh-safe timer with overtime visibility
- Active-session topic and pattern hiding with hints disabled
- Persisted intro, clarification, examples, brute-force, optimization, implementation, testing, complexity, and retrospective state machine
- One active learning mode per learner, protected against concurrent practice/interview starts
- Ten-criterion 1–5 scorecard with deterministic overall score, strengths, and actionable improvements
- Completed and abandoned interview history with post-interview topic reveal
- Interview-execution readiness dimension and topic-mastery feedback into adaptive recommendations
- Forced-RLS private sessions and scorecards with narrow authenticated mutation functions
- Responsive setup, workspace, scorecard, history, dashboard, progress, and navigation integration

### Verification

- Unit tests cover phase transitions, timer recovery, score calculation, and feedback selection.
- Database tests prove ordered persistence, one active session, practice/interview exclusion, transactional scorecard and mastery updates, ownership isolation, anonymous denial, and revoked direct writes.
- The browser journey completes setup, all interview phases, retrospective, scorecard, history, and progress feedback.

## Phase 12 — AI learning coach

**Status:** Complete

### Completed

- Provider-independent five-operation learning-coach interface, separate from realtime interviewing
- Feature-flagged Gemini structured-output and OpenAI Responses adapters with configurable models and server-only keys
- Strict structured-output schemas with Zod validation, one safe retry, timeout, output cap, and graceful fallback
- Minimum-context assembly with hashed learner safety identifiers
- AI-enhanced progressive hints that preserve all existing help-level accounting
- Persisted pattern analysis with feedback, one Socratic question, and a concrete next step
- Reflection-time complexity feedback grounded in the learner's submitted time and space bounds
- Post-attempt analysis with evidence-based strengths, improvements, and summary
- Persisted active-recall review-card drafts integrated into the next review's comparison step
- Private request reservations, rolling 20-request daily limit, provider/model identity, status, and token counters
- Fully operational deterministic practice experience when AI is disabled or unavailable

### Verification

- Provider tests prove structured Gemini and OpenAI requests, validation, retry limits, and failure behavior.
- Deterministic fallback tests prove every Phase 12B response remains schema-valid.
- Database tests prove private usage records, revoked direct writes, token persistence, and rolling request-limit enforcement.
- Existing practice and browser workflows continue to operate with the feature disabled.

## Phase 13 — Realtime AI interviewer

**Status:** Complete

### Completed

- Provider-independent realtime browser interface, separate from the learning coach
- Feature-flagged Gemini Live audio adapter and OpenAI WebRTC adapter with configurable realtime models and voices
- Persisted Beginner and Tough FAANG interviewer levels with provider-independent prompt behavior
- Tough FAANG “blank wall” flow with one-turn brevity, zero hints/validation, strict optimization transitions, silent implementation review, and bug-revealing dry runs
- Authenticated Gemini ephemeral-token endpoint and OpenAI SDP proxy; permanent keys never enter browser code
- Microphone permission, mute/unmute, input level, interviewer-speaking, typed fallback, and explicit end controls
- Live learner/interviewer transcript with refresh-safe private persistence
- Silent interview-phase, phase-evidence, and code-snapshot context events
- Connected, reconnecting, disconnected, and recoverable error states
- One private reconnectable realtime record per mock interview plus ordered bounded event history
- Completed-scorecard transcript and deterministic session summary
- Forced-RLS own-row reads, revoked direct writes, and ownership-enforcing database functions
- Fully operational text interview when realtime is disabled or unavailable

### Verification

- Unit tests cover both provider configurations, request/event bounds, PCM conversion, transcript assembly, completed learner turns, and provider errors.
- Integration coverage verifies private session creation, transcript and code persistence, automatic completion summary, ownership isolation, and revoked direct writes.
- Lint, strict TypeScript, formatting, unit tests, and production build pass without realtime credentials.
- A live provider/microphone acceptance run remains environment-dependent and requires configured Gemini or OpenAI access plus a running database.

## Interview-first transformation — Stage 1

**Status:** Complete

## Interview-first transformation — Stages 2–5

**Status:** Complete

- Canonical bounded evidence package with explicit source coverage and no untrusted correctness claims
- Independent Gemini post-interview evaluator with strict structured output, ten-second timeout, one retry, and deterministic provisional fallback
- Additive versioned evaluation persistence, immutable final rows, legacy scorecard backfill, own-row RLS, revoked browser writes, and read-only service operations
- Automatic evaluation after successful interview completion without allowing evaluator failure to roll back completion
- Interview-performance profile for overall, dimensions, topics, difficulty, interviewer level, 30-day, 90-day, and all-time scopes
- Expected-performance challenge adjustment, recency/evidence weighting, deterministic confidence, capped level labels, trends, and recurring-signal derivation
- Explicit learning readiness, interview readiness, and combined preparation summary instead of the former opaque scorecard blend

Verification includes evaluator/evidence/profile unit contracts, evaluation ownership and immutability integration coverage, all fixed setup combinations, and a full browser completion that observes the persisted provisional evaluation.

## Interview-first transformation — Stages 6–9

**Status:** Complete with an explicit external-runner limitation

- Explainable, non-blocking next actions spanning interviews, problems, topic/testing/complexity/communication drills, lessons, and reviews
- Dedicated interview profile with level, score, confidence, trends, exact dimension bars, topic/difficulty/interviewer scopes, and recurring signals
- Interview-first dashboard summary and suggested interview while learning readiness remains a named secondary layer
- Scorecard evaluator source/status, confidence, rationale and evidence per dimension, profile delta, correctness caveat, and direct next actions
- Recommended setup separated from manual selection, with a warning that never disables higher difficulty
- Persisted automatic/English/Hebrew interview language, explicit realtime language rules, RTL/automatic transcript and input direction, and untouched LTR source code
- Strict external code-runner interface and bounded result contract; no learner code executes inside Next.js

No isolated code sandbox or private first-party test bundle exists in this checkout. Correctness therefore remains explicitly unverified and low-confidence rather than being overstated.

### Completed

- Pure interview-problem selection policy separated from the server action
- Adaptive selection retains learning eligibility and ranked fallback behavior
- Fixed Easy, Medium, and Hard selection uses every active catalog problem at the requested difficulty, independent of learning eligibility
- Adaptive scores order fixed-difficulty candidates without acting as an access gate
- Recent interview problems are avoided when an alternative exists and reused only as a fallback
- All 30-, 45-, and 60-minute durations remain independent of difficulty and interviewer level
- Expected setup and inventory failures render as recoverable form messages

### Verification

- Unit coverage exercises fixed-choice bypass, adaptive eligibility, omitted ranked candidates, inactive inventory, recent-problem fallback, and all 24 setup combinations.
- Database integration coverage exercises every difficulty, duration, and interviewer-level combination while preserving active-session constraints.
- No schema migration is required for this stage; the existing database function continues to validate active inventory and fixed difficulty agreement.

## Interview-first transformation — Stage 2

**Status:** Complete

### Completed

- Server-only canonical evidence assembler backed by the learner-owned mock-interview query
- Strict versioned Zod package for configuration, topic metadata, phase evidence, code, transcript, timing, connection events, learner outcome, trusted-test summaries, and coverage
- Defensive filtering of realtime events by learner and realtime session
- Deterministic code-snapshot preference and bounded first/last transcript retention
- Explicit truncation reporting for every clipped evidence field
- First-party question-content contract separating public prompt context from private evaluator tests
- Honest `unsupported`, `prompt_only`, and `trusted_tests` semantic-correctness coverage states
- Active and abandoned interviews excluded from evaluation evidence

### Verification

- Unit tests cover safe field selection, foreign-row filtering, latest code selection, transcript/code/note bounds, lifecycle exclusion, strict schema validation, and correctness-coverage states.
- Lint, strict TypeScript, formatting, full unit tests, and production build validate the additive modules.
- No schema migration is required for this stage; trusted execution remains an empty evidence slot until Stage 7.

## Interview-first transformation — Stage 3

**Status:** Complete

### Completed

- Dedicated `InterviewEvaluatorProvider` contract, separate from realtime interviewing and the learning coach
- Gemini structured-output adapter using the existing server-only shared key and evaluator-specific model override
- Strict bounded evaluation schema with ten dimensions, confidence, rationales, evidence references, strengths, improvements, signals, and actions
- Deterministically derived 0–100 raw score from the ten dimension scores
- Cross-field source validation and correctness-confidence caps tied to question/test coverage
- Prompt-injection, Hebrew/mixed-language, fluency, verbosity, assistance, and persona-consistency rules
- Ten-second provider timeout, one safe retry, error classification, and schema-valid provisional fallback
- Server-only completed-interview evaluation entry point with feature-flagged provider creation

### Verification

- Provider contract tests cover Gemini schema requests, token usage, prompt separation, strict parsing, unsupported correctness confidence, retry count, timeout classification, and fallback behavior.
- Deterministic fallback tests verify bounded evidence references, low-confidence unverified correctness, actions, and schema validity.
- Environment tests cover evaluator feature-flag parsing and placeholder-secret rejection.
- Evaluation persistence and automatic completion wiring intentionally remain Stage 4 work.

## Phase 14 — Polish

**Status:** Complete

### Completed

- Responsive sticky application header and mobile navigation with clear active-page state
- Browser-persisted System, Light, and Dark themes applied before first paint
- Accessible readiness radar and ranked topic-mastery charts with exact text values
- Improved onboarding expectations, step progress, and device-timezone detection
- Strengthened form validation relationships, error recovery, table labeling, focus behavior, and reduced-motion support
- Audited task-specific empty states and retained direct next actions throughout learning workflows
- Lazy-loaded realtime WebRTC interview interface for voice-enabled sessions only
- Product accessibility and performance review documentation

### Verification

- Component tests cover theme preference changes and accessible analytics values.
- Lint, strict TypeScript, unit/component tests, formatting, and the production build pass.
- All 34 database integration checks pass against the migrated local Supabase stack.
- The complete authenticated browser journey passes on desktop and mobile Chromium.

## Phase 15 — Deployment

**Status:** Complete

### Completed

- Vercel project configuration with a production-only environment validation gate
- Canonical and preview-aware application URL resolution for email and OAuth callbacks
- Database-backed `/api/health` readiness endpoint with safe HTTP 503 failure behavior
- Independent post-deployment smoke verification command
- GitHub Actions quality, database integration, and desktop/mobile browser jobs
- Production Supabase migration procedure with non-destructive dry-run and catalog checks
- Exact Supabase, Google, and GitHub OAuth URL configuration
- Complete environment-variable matrix for the optional AI coach and realtime voice interviewer
- Production acceptance, logging, rollback, and migration compatibility runbook

### Verification

- Production environment validation accepts a complete secret-safe configuration and rejects missing required settings.
- Unit/component tests cover canonical and Vercel preview URL resolution.
- The local browser suite verifies the health endpoint against the fully migrated Supabase stack.
- Lint, strict TypeScript, formatting, unit tests, database integration tests, browser journeys, and the production build pass.

### Launch boundary

Repository deployment readiness is complete. Creating the Vercel and hosted Supabase projects, entering account-owned secrets, choosing the public domain, and enabling billable AI access remain explicit owner actions; no production account was mutated from this checkout.

## Interview selection and workspace expansion — Stage 1

**Status:** Complete locally; later selection/UI stages remain pending

### Completed

- Canonical, versioned `neetcode-150` problem collection frozen at 150 problems and 18 primary topics
- Public read-only collection metadata with forced RLS and revoked browser writes
- Backward-compatible interview selection snapshots for mode, topic, difficulty filter, algorithm version, metadata, coding language, and question-content version
- Trigger validation that derives legacy snapshots and rejects problem/topic/difficulty mismatches
- Learner-owned topic-coverage read model based on distinct completed, non-deleted interview topics rather than total interview count
- Generated database types and focused unit/integration coverage

### Verification

- The additive migration applies locally and database lint reports no schema errors.
- Unit coverage proves distinct-topic counting, deletion-equivalent removal, recent-topic ordering, and collection isolation.
- Integration coverage verifies public 150/18 collection metadata and legacy start-RPC snapshot compatibility.
- Selection algorithms, setup UI, deletion, approved question content, editor, and phase guiding star remain later stages defined in `interview-selection-and-workspace-action-plan.md`.

## Interview selection and workspace expansion — Stage 2

**Status:** Complete locally; setup UI and server wiring remain pending

### Completed

- Pure, typed Coverage, Improvement, Learning, and Custom selection policies outside the interview Server Action
- Injected random-index dependency for reproducible tests and a future cryptographic server adapter
- Coverage selection across uncovered topics, then least-covered topics after full coverage
- Two-topic recency avoidance, fresh-problem preference, and explicit recency/repeat fallback metadata
- Improvement gating on complete topic coverage and comparable evaluated evidence
- Deterministic bottom-three Improvement ranking by adjusted score, confidence, evidence age, and canonical topic order
- Learning selection that preserves the existing adaptive eligibility fallback, score ordering, reasons, and recent-problem avoidance
- Exact canonical topic-and-difficulty Custom selection with fresh-question preference
- Explicit invalid-filter, unavailable-inventory, missing-evidence, and policy-prerequisite outcomes without silent topic or difficulty escape

### Verification

- Seventeen focused unit scenarios cover all four policies, deterministic randomness, tie-breaking, recency, repetition, eligibility fallback, and inventory errors.
- Strict TypeScript and ESLint pass for the additive domain boundary and tests.
- These policies are intentionally not user-facing yet; Stage 3 will assemble server-owned evidence, use cryptographic randomness, persist snapshots, and expose the four explained setup paths.

## Interview selection and workspace expansion — Stage 3

**Status:** Complete locally; approved full question content remains Stage 5

### Completed

- Server-owned selection context combining the canonical collection, completed history, topic coverage, adaptive scores, and evaluated interview-topic performance
- Cryptographic production random selection with deterministic domain-test injection retained
- Versioned `start_mock_interview_v2` RPC with canonical membership, topic, difficulty, language, algorithm-version, metadata-bound, learner-readiness, and concurrency validation
- Immutable persistence of selection mode, requested difficulty filter, requested/selected topic, selection reasons and fallbacks, coding language, interviewer configuration, and algorithm version
- Setup header showing completed topic coverage and the exact missing topic list
- Four explained selection cards for Coverage/Balanced random, Improvement, Learning, and Choose topic
- Improvement availability and weak-topic evidence; Learning adaptive reasons without mixing interview weakness
- Multi-difficulty filters for Coverage/Improvement and exact topic/difficulty inventory for Custom
- Independent 30/45/60-minute duration, Beginner/Tough FAANG persona, automatic/English/Hebrew interview language, and Python/Java coding language
- Profile-language defaulting to Java when supported and Python otherwise
- Explicit inventory and evidence errors without silent mode, topic, or difficulty changes

### Verification

- Component coverage verifies pre-coverage locking/explanations, Custom inventory blocking, post-coverage default behavior, Balanced random visibility, and coding-language defaults.
- Schema coverage exercises every mode across all duration, interviewer, interview-language, and coding-language combinations plus invalid mode-specific inputs.
- Database integration verifies the new snapshot RPC persists bounded version-one metadata while legacy RPC behavior remains compatible.
- Stage 3 intentionally preserves the existing active-catalog question boundary. Stage 5 will require reviewed first-party prompt readiness before a problem remains selectable.

## Interview selection and workspace expansion — Stage 4

**Status:** Complete locally; not committed or pushed

### Completed

- Transactional, authenticated deletion for completed and abandoned learner-owned interviews, with active-session and cross-user rejection
- Cascade cleanup for scorecards, all evaluation versions, realtime sessions, transcripts, and code/context events
- Deterministic chronological replay of remaining diagnostic, practice, and interview evidence instead of unsafe aggregate decrementing
- Removal of deleted evidence from topic coverage, mastery, interview profile, trends, recurring signals, readiness, and later recommendations
- Explicit permanent-delete confirmation on interview history and scorecard pages, followed by safe navigation back to history
- Cache revalidation for interview setup/history, interview profile, dashboard, progress, practice, and recommendation consumers
- Privacy-safe operational deletion event containing identifiers only

### Verification

- Database integration covers active and foreign-owner denial, dependent-row cascades, abandoned deletion, interview counters, timestamps, and exact restoration of pre-interview mastery.
- Component coverage verifies the named interview, irreversible warning, profile/coverage explanation, and required acknowledgement.
- Desktop and mobile browser coverage completes an interview, deletes it through the history UI, and verifies that both history and interview profile return to their empty states.

## Interview selection and workspace expansion — Stage 5

**Status:** Complete locally; not committed or pushed

### Completed

- Server-only versioned question-content registry with first-party provenance and explicit approved review state
- Eighteen repository-authored version-one prompts covering every canonical topic, each with constraints, public examples, and private evaluator invariants
- Database-backed `interview_ready`, content-version, and provenance inventory, with non-ready catalog items excluded from every versioned selection mode
- Database trigger enforcement that rejects non-legacy starts without approved content and freezes the authoritative content version on the interview snapshot
- Runtime registry/database version matching so drift fails closed instead of exposing or selecting incomplete content
- Exact Custom inventory messaging for unavailable topic/difficulty combinations
- Sticky, collapsible, accessible question panel with prompt, examples, constraints, difficulty, live timer status, and a clearly separated canonical reference
- Strict learner-visible schema that omits evaluator invariants; the browser and realtime providers receive only the public prompt boundary
- Version-aware post-interview evidence assembly with `prompt_only` correctness coverage and no private-test correctness claim

### Verification

- Database integration verifies 18 approved rows across 18 distinct topics, frozen version-one snapshots, and rejection of non-ready problems.
- Component tests cover structured rendering, source separation, hidden evaluator content, one-tap collapse, and preservation of collapsed state across timer rerenders.
- Realtime instruction tests verify bounded first-party prompt delivery and absence of invariant/private-test fields.
- Desktop and mobile browser coverage verifies that the approved prompt remains visible, collapsible, and restored during a Tough FAANG Hebrew interview.

## Interview selection and workspace expansion — Stage 6

**Status:** Complete locally; not committed or pushed

### Completed

- Dynamically loaded CodeMirror 6 coding workspace available from Intro onward, with syntax-aware Python and Java editing and a language fixed to the interview snapshot
- Persistent 10,000-character scratchpad and 30,000-character code snapshot with debounced/blur/manual saves and explicit Saving, Saved, Unsaved, and Save failed states
- Optimistic workspace versions and serialized saves that reject stale-tab overwrites instead of silently losing newer work
- Immutable, owner-scoped review/completed code submissions created atomically with the latest workspace state and optional ordered transition to Testing
- Implementation-only “Send current code to interviewer” and “I’m done coding” actions with explicit no-execution/no-tests-passed disclosure
- Provider-neutral, JSON-delimited untrusted code-review context implemented consistently for Gemini Live and OpenAI WebRTC
- Tough FAANG test-case/next-instruction behavior without defect explanation, plus restrained Beginner review behavior
- Final-code evaluator selection by timestamp across persisted workspace and realtime snapshots, including the no-AI/disconnected path
- Forced RLS, revoked direct writes, ownership checks, bounded content, submission caps, deletion cascades, and privacy-safe operational events

### Verification

- Unit/component coverage validates language locking, Intro availability, autosave/manual save, exact workspace-version progression, Implementation-only review, no-execution disclosure, bounds, and provider prompt safety.
- Database integration validates atomic snapshots, stale-version and cross-owner rejection, phase enforcement, final-code evidence selection, direct-write denial, and deletion cascade.
- Desktop/mobile browser coverage exercises scratchpad/code save, refresh recovery, review fallback without AI, and the explicit transition from Implementation to Testing.

## Interview selection and workspace expansion — Stage 7

**Status:** Complete locally; not committed or pushed

### Completed

- Accessible nine-step Interview process guide with explicit Completed, You are here, Suggested next, Needs confirmation, and Future states
- Deterministic captured-evidence summaries backed by saved phase fields, bounded realtime event references, and immutable code-submission references
- Canonical forced-RLS phase-event history with revoked direct writes, ownership-scoped reads, deletion cascade, and safe restoration for existing active interviews
- Provider-neutral structured phase-suggestion contract implemented for Gemini Live and OpenAI WebRTC without parsing phase commands from transcript text
- Server validation for authentication, ownership, active session, current-phase evidence, immediate-successor ordering, stale suggestions, and immutable idempotent duplicates
- Learner-controlled confirmation through the existing ordered state machine; the model can neither advance, complete, nor skip phases
- Manual interview workflow remains fully usable when realtime AI or structured tool handling is unavailable

### Verification

- Domain/component coverage validates every guide state, the current-step accessibility marker, deterministic summaries, and separation from final scoring.
- Provider/schema coverage validates immediate-successor suggestions and rejects skipped, malformed, duplicated-evidence, and transcript-like inputs.
- Database integration validates persisted evidence references, idempotency, stale/cross-owner/direct-write rejection, ordered phase history, code attachment, and deletion cascade.
- Browser coverage follows the guide from Intro through Clarify and Testing while preserving the existing full interview and deletion flow.

## Interview selection and workspace expansion — Stage 8

**Status:** Complete locally; production rollout and live provider acceptance remain external

### Completed

- Independent server-only rollout controls for expanded selection modes, embedded approved prompts, and the enhanced coding workspace
- Safe disabled-state paths: adaptive Learning-only selection with server enforcement, canonical question reference, and a bounded LTR Python/Java textarea
- Structured operational success, rejection, conflict, failure, reason-code, and latency events without prompt, transcript, note, scratchpad, code, token, or profile content
- Client-bundle security audit that rejects server-only secret identifiers or configured secret values and runs after the production build in CI
- Security, privacy, accessibility, load, concurrency, rollback, and production-acceptance review documented in `docs/interview-rollout.md`
- Concurrent phase-suggestion burst coverage proving one immutable idempotent event, alongside existing start/workspace/evaluation/deletion race protections
- Explicit no-fabricated-evidence boundary: version-zero legacy evaluations remain excluded from profile evidence and active-interview backfill records only the actual current phase
- Production environment validation and deployment documentation for every rollout flag

### Verification

- Rollout tests validate independent strict-boolean parsing, default behavior, Learning-only fallback, canonical prompt fallback, and bounded language-aware code fallback.
- Security verification scans the optimized client bundle after build and reports only secret variable labels and asset paths, never secret values.
- The complete Stage 8 quality-gate results are recorded after the final local run; production provider keys, hosted migration application, canary monitoring, and live microphone/provider acceptance remain deployment-owner tasks.
