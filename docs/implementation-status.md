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

## Phases 4–15

**Status:** Not started

They will be implemented in the order defined by the master build prompt.
