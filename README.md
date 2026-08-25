# FAANG Interview Academy

An adaptive technical-interview learning platform focused on independent problem solving, pattern recognition, reflection, and long-term retention.

## Current status

Phase 1 (repository foundation) is complete. Authentication, persistence, and user workflows begin in Phase 2. See [the implementation log](docs/implementation-status.md) for the verified status of each phase.

## Stack

- Next.js 16 App Router and React 19
- Strict TypeScript
- Tailwind CSS 4
- Vitest and React Testing Library
- Playwright
- ESLint and Prettier
- Supabase PostgreSQL, Auth, and RLS planned for Phase 2

## Local setup

Requirements: Node.js 20.9 or newer and npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

No Supabase or AI credentials are needed for Phase 1. Blank optional values are valid.

## Quality checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run format:check
```

Install Playwright's browser once, then run browser tests:

```bash
npx playwright install chromium
npm run test:e2e
```

## Structure

```text
src/
  app/          Routes, layouts, and route-level states
  components/   Reusable UI, navigation, feedback, and layout components
  lib/          Shared infrastructure such as environment parsing
tests/          Unit, component, and browser tests
docs/           Architecture decisions and implementation status
content/        Curriculum content added from Phase 3
data/           Reproducible seed data added from Phase 3 onward
```

The complete product specification remains in `faang_interview_academy_end_to_end_master_prompt.md`.

## Environment variables

Copy `.env.example` to `.env.local`. Never commit `.env.local` or provider secrets. Supabase, AI, realtime AI, and analytics values are optional until their corresponding phases are enabled.

## Security foundation

- Secrets are reserved for server-side variables.
- Environment input is schema-validated.
- No arbitrary user-code execution exists.
- External integrations are optional and will remain behind explicit adapters and feature flags.
