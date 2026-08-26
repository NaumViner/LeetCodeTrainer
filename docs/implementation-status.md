# Implementation status

Last updated: 2026-08-26

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

## Phases 9–15

**Status:** Not started

They will be implemented in the order defined by the master build prompt.
