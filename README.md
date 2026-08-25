# FAANG Interview Academy

An adaptive technical-interview learning platform focused on independent problem solving, pattern recognition, reflection, and long-term retention.

## Current status

Phases 1 and 2 are complete: the repository foundation, local Supabase database, authentication, protected learner profiles, and onboarding workflow are implemented and tested. See [the implementation log](docs/implementation-status.md) for the verified status of each phase.

## Stack

- Next.js 16 App Router and React 19
- Strict TypeScript and Tailwind CSS 4
- Supabase PostgreSQL, Auth, and Row Level Security
- Vitest, React Testing Library, and Playwright
- ESLint and Prettier

## Local setup

Requirements: Node.js 20.9 or newer, npm, and Docker Desktop.

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

See [database.md](docs/database.md), [authentication.md](docs/authentication.md), and [security.md](docs/security.md) for the model and deployment notes.

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

## Structure

```text
src/
  app/          Routes, layouts, Server Actions, and route states
  components/   Reusable UI, navigation, auth, and profile components
  features/     Feature validation and server-side orchestration
  lib/          Shared infrastructure and Supabase clients
  types/        Generated database types
tests/          Unit, integration, and browser tests
supabase/       Local configuration, migrations, and seed entry point
docs/           Architecture, security, and implementation status
content/        Curriculum content added from Phase 3
data/           Reproducible seed data added from Phase 3 onward
```

The complete product specification remains in `faang_interview_academy_end_to_end_master_prompt.md`.

## Environment variables

Copy `.env.example` to `.env.local`. Never commit `.env.local` or provider secrets.

- `NEXT_PUBLIC_SUPABASE_URL`: browser-safe project API URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: preferred browser-safe project key
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: fallback for legacy Supabase projects
- `SUPABASE_SERVICE_ROLE_KEY`: server-only administrative key; the application does not require it

Google and GitHub sign-in buttons are implemented, but each provider remains disabled until its credentials and callback URLs are configured in the target Supabase project. Email/password authentication works locally without external credentials.
