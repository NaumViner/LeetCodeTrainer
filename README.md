# FAANG Interview Academy

An adaptive technical-interview learning platform focused on independent problem solving, pattern recognition, reflection, and long-term retention.

## Current status

All 15 implementation phases are complete. The platform includes the optional AI learning coach, a feature-flagged realtime voice interviewer, responsive and accessible product states, automated CI, production environment validation, and database-backed deployment health verification. See [the implementation log](docs/implementation-status.md) for the verified status of each phase.

## Stack

- Next.js 16 App Router and React 19
- Strict TypeScript and Tailwind CSS 4
- Supabase PostgreSQL, Auth, and Row Level Security
- Markdown curriculum rendered safely with React
- Reproducible, metadata-only problem catalog
- Explainable adaptive recommendations and persisted practice attempts
- Atomic performance snapshots, topic mastery, progress, and history
- Deterministic review scheduling, due queue, review mode, and schedule history
- Personalized daily-plan generation, completion, regeneration, and dashboard progress
- Adaptive concept, pattern-recognition, and coding diagnostic with initial mastery placement
- Timed mock interviews with hidden topics, ordered phases, private scorecards, and history
- Feature-flagged AI learning coach with structured outputs, quotas, and no-AI fallback
- Feature-flagged realtime voice interviews over WebRTC with transcript and code context
- Responsive navigation, polished onboarding and recovery states, accessible charts, and System/Light/Dark themes
- Vitest, React Testing Library, and Playwright
- ESLint and Prettier

## Local setup

Requirements: Node.js 24, npm, and Docker Desktop.

```bash
npm install
cp .env.example .env.local
npm run db:start
npm run db:status
npm run dev
```

Copy the local API URL and publishable key reported by `npm run db:status` into `.env.local`, then open `http://localhost:3000`. Local Auth is configured without email confirmation so the complete flow can be tested without an email provider.

Stop the local services when finished:

```bash
npm run db:stop
```

## Database workflow

Schema changes belong in `supabase/migrations`; do not create production tables only through the Supabase dashboard.

```bash
npm run db:migrate  # apply pending migrations
npm run db:reset    # rebuild the local database from migrations and seed
npm run db:types    # regenerate TypeScript database types
```

Problem metadata is generated from `data/problems.json`. After reviewing catalog changes, rebuild its seed migration with `npm run data:problems:generate`. The optional `npm run data:problems:sync` command refreshes public metadata from the documented upstream sources and requires network access.

See [deployment.md](docs/deployment.md) for the production runbook. The remaining documents cover the database, authentication, curriculum, problem library, practice engine, analytics, review scheduling, recommendations, daily plans, diagnostic, mock interviews, AI coach, realtime interviewer, product polish, and security model.

## Quality checks

```bash
npm run lint
npm run typecheck
npm test
npm run test:integration
npm run test:e2e
npm run build
npm run format:check
```

The integration and browser authentication tests require the local Supabase services. Install Playwright's browser once with `npx playwright install chromium`.

## Production deployment

The supported production target is Vercel plus a dedicated hosted Supabase project. CI validates every push and pull request; Vercel runs the stricter production environment check before building. After deployment, verify the landing page and database-backed health endpoint with:

```bash
npm run verify:deployment -- https://your-production-domain.example
```

The full migration, OAuth, environment-variable, AI/voice, acceptance, and rollback procedure is in [the deployment runbook](docs/deployment.md). Cloud projects and secrets are intentionally not created or stored by the repository.

## Structure

```text
src/
  app/          Routes, layouts, Server Actions, and route states
  components/   Reusable UI, navigation, auth, profile, and lesson components
  features/     Feature validation and server-side orchestration
  lib/          Shared infrastructure and Supabase clients
  types/        Generated database types
tests/          Unit, integration, and browser tests
supabase/       Local configuration, migrations, and seed entry point
docs/           Architecture, curriculum, security, and implementation status
content/        Versioned Markdown curriculum lessons
data/           Reproducible seed data added from Phase 3 onward
```

The complete product specification remains in `faang_interview_academy_end_to_end_master_prompt.md`.

## Environment variables

Copy `.env.example` to `.env.local`. Never commit `.env.local` or provider secrets.

- `NEXT_PUBLIC_SUPABASE_URL`: browser-safe project API URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: preferred browser-safe project key
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: fallback for legacy Supabase projects
- `SUPABASE_SERVICE_ROLE_KEY`: server-only administrative key; the application does not require it
- `AI_COACH_ENABLED`: server-only feature flag; defaults to disabled
- `AI_PROVIDER`, `AI_MODEL`, and `AI_API_KEY`: optional server-only learning-coach configuration
- `REALTIME_AI_ENABLED`: server-only realtime-interviewer feature flag; defaults to disabled
- `REALTIME_AI_PROVIDER`, `REALTIME_AI_MODEL`, and `REALTIME_AI_API_KEY`: server-only realtime provider configuration
- `REALTIME_AI_TRANSCRIPTION_MODEL` and `REALTIME_AI_VOICE`: optional input-transcription and voice overrides

Google and GitHub sign-in buttons are implemented, but each provider remains disabled until its credentials and callback URLs are configured in the target Supabase project. Email/password authentication works locally without external credentials.
