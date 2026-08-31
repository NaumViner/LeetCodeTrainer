# Implementation status

Last updated: 2026-08-31

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
- Feature-flagged OpenAI Responses adapter with configurable model and server-only key
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

- Provider tests prove structured Responses requests and validation for all response shapes, retry limits, and failure behavior.
- Deterministic fallback tests prove every Phase 12B response remains schema-valid.
- Database tests prove private usage records, revoked direct writes, token persistence, and rolling request-limit enforcement.
- Existing practice and browser workflows continue to operate with the feature disabled.

## Phase 13 — Realtime AI interviewer

**Status:** Complete

### Completed

- Provider-independent realtime browser interface, separate from the learning coach
- Feature-flagged OpenAI WebRTC adapter with configurable realtime model, transcription model, and voice
- Authenticated server-side SDP proxy through the current Realtime calls endpoint; permanent keys never enter browser code
- Microphone permission, mute/unmute, input level, interviewer-speaking, typed fallback, and explicit end controls
- Live learner/interviewer transcript with refresh-safe private persistence
- Silent interview-phase, phase-evidence, and code-snapshot context events
- Connected, reconnecting, disconnected, and recoverable error states
- One private reconnectable realtime record per mock interview plus ordered bounded event history
- Completed-scorecard transcript and deterministic session summary
- Forced-RLS own-row reads, revoked direct writes, and ownership-enforcing database functions
- Fully operational text interview when realtime is disabled or unavailable

### Verification

- Unit tests cover feature-flag configuration, request/event bounds, transcript delta assembly, completed learner turns, and provider errors.
- Integration coverage verifies private session creation, transcript and code persistence, automatic completion summary, ownership isolation, and revoked direct writes.
- Lint, strict TypeScript, formatting, unit tests, and production build pass without realtime credentials.
- A live provider/microphone acceptance run remains environment-dependent and requires configured OpenAI Realtime access plus a running database.

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
