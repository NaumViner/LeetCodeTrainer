# Production deployment

The production target is Vercel for the Next.js application and a dedicated hosted Supabase project for PostgreSQL and Auth. The repository contains all deployment configuration, migrations, catalog data, health checks, and CI; account credentials remain outside Git.

## 1. Create the production Supabase project

Create an empty Supabase project and save its project reference and database password in an approved password manager. Do not reuse the local database or a project that contains disposable test data.

Authenticate the CLI, link this checkout to the exact production project, inspect the pending migrations, and then apply them:

```bash
npx supabase login
npx supabase link --project-ref <production-project-ref>
npx supabase db push --dry-run
npx supabase db push
```

The curriculum and the 150-problem metadata catalog are committed as migrations, so the normal production migration creates them. `supabase/seed.sql` contains no users or test data. Do not run `db reset --linked` against production, and do not use `--include-seed` unless that file is deliberately reviewed and changed for a non-production environment.

After migration, use the Supabase Dashboard to confirm that all migrations are recorded, the `topics` table contains active rows, and Row Level Security remains enabled on public tables.

## 2. Configure Supabase Auth

In **Authentication → URL Configuration** set:

- Site URL: `https://<production-domain>`
- Redirect URL: `https://<production-domain>/auth/callback`
- Optional local development redirect: `http://localhost:3000/auth/callback`
- Optional Vercel preview pattern: `https://*-<vercel-team-slug>.vercel.app/**`

Use an exact production callback. Wildcards are only for preview environments.

Email/password sign-in needs a production SMTP provider before public launch if email confirmation or password recovery is enabled.

For Google or GitHub sign-in, create a separate production OAuth application in that provider's console. The provider callback is Supabase—not the Next.js callback:

```text
https://<production-project-ref>.supabase.co/auth/v1/callback
```

Add the client ID and secret in **Authentication → Sign In / Providers**, enable the provider, and perform one clean-browser sign-in test. The application then returns through `https://<production-domain>/auth/callback` using Supabase's redirect allow-list.

## 3. Import the GitHub repository into Vercel

Import `NaumViner/LeetCodeTrainer`. This Git checkout is already the application root, so leave **Root Directory** at the repository root. Vercel detects Next.js from `package.json`; `vercel.json` selects the production environment check before `next build`. Node.js 24 is pinned in `package.json` and used by CI.

Add the following variables in Vercel. Apply required database variables to Production and Preview; keep provider keys encrypted and server-only.

| Variable                                                           | Scope               | Required           | Purpose                                          |
| ------------------------------------------------------------------ | ------------------- | ------------------ | ------------------------------------------------ |
| `NEXT_PUBLIC_APP_URL`                                              | Production          | Yes                | Canonical HTTPS origin, without a trailing slash |
| `NEXT_PUBLIC_SUPABASE_URL`                                         | Production, Preview | Yes                | Hosted Supabase project API URL                  |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`                             | Production, Preview | Yes                | Browser-safe publishable key                     |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`                                    | Production, Preview | Legacy only        | Alternative to the publishable key               |
| `SUPABASE_SERVICE_ROLE_KEY`                                        | Server only         | No                 | Not required by this application                 |
| `GEMINI_API_KEY`                                                   | Server only         | With Gemini AI     | Shared Gemini coach, evaluator, and Live key     |
| `AI_COACH_ENABLED`                                                 | Server only         | No                 | Set `true` to enable the learning coach          |
| `AI_PROVIDER`, `AI_MODEL`, `AI_API_KEY`                            | Server only         | When coach enabled | Gemini or OpenAI coach configuration             |
| `INTERVIEW_EVALUATOR_ENABLED`                                      | Server only         | No                 | Enables post-interview structured evaluation     |
| `INTERVIEW_EVALUATOR_PROVIDER`, `INTERVIEW_EVALUATOR_MODEL`        | Server only         | When enabled       | Gemini evaluator configuration                   |
| `INTERVIEW_EVALUATOR_API_KEY`                                      | Server only         | Optional           | Gemini override when shared key is not used      |
| `INTERVIEW_SELECTION_MODES_ENABLED`                                | Server only         | No                 | Coverage/Improvement/Custom rollout control      |
| `INTERVIEW_PROMPT_CONTENT_ENABLED`                                 | Server only         | No                 | Embedded approved-prompt rollout control         |
| `INTERVIEW_CODING_WORKSPACE_ENABLED`                               | Server only         | No                 | CodeMirror workspace rollout control             |
| `REALTIME_AI_ENABLED`                                              | Server only         | No                 | Set `true` for live voice interviews             |
| `REALTIME_AI_PROVIDER`, `REALTIME_AI_MODEL`, `REALTIME_AI_API_KEY` | Server only         | When voice enabled | Gemini Live or OpenAI Realtime configuration     |
| `REALTIME_AI_TRANSCRIPTION_MODEL`, `REALTIME_AI_VOICE`             | Server only         | No                 | Optional realtime overrides                      |
| `ANALYTICS_PROVIDER`                                               | Server only         | No                 | Reserved analytics setting                       |

Never prefix a provider secret with `NEXT_PUBLIC_`. Preview deployments automatically use Vercel's deployment URL for Auth redirects when `NEXT_PUBLIC_APP_URL` is not set in Preview.

The production build runs `npm run env:check:production`. It rejects missing database settings, insecure production origins, malformed feature flags, and enabled AI features without their required server key. The three interview rollout controls default to enabled when omitted; set them explicitly in production so the intended release state is auditable. See [interview-rollout.md](interview-rollout.md) for staged enablement and rollback behavior.

## 4. Deploy and verify

Deploy the `main` branch after CI is green. Then run the repository's independent smoke check:

```bash
npm run verify:deployment -- https://<production-domain>
```

The check loads the landing page and `/api/health`. The health endpoint returns HTTP 200 only when the app can query at least one active curriculum topic through the public Supabase API; it returns HTTP 503 without revealing database error details if configuration, migration, RLS access, or connectivity is broken.

Complete these manual acceptance checks in a private browser window:

1. Create a new email/password account and finish onboarding and the diagnostic.
2. Sign out and back in; confirm progress persists.
3. If enabled, sign in once with Google and GitHub.
4. Complete one lesson and one practice attempt.
5. Start a mock interview; when realtime voice is enabled, grant microphone access and verify spoken turn-taking, interruption, transcript persistence, and clean hang-up.
6. Review Vercel function logs and Supabase Auth/database logs for unexpected errors, without logging tokens or learner content.
7. Run `npm run audit:client-bundle` against the production build output and verify each enabled/disabled interview fallback once.

## 5. Continuous integration and rollback

`.github/workflows/ci.yml` runs formatting, lint, strict TypeScript, unit/component tests, a production build, and the client-bundle secret audit. A separate job starts an isolated local Supabase stack, applies every migration, runs all database integration tests, and runs desktop/mobile Chromium journeys. No production secrets are used in CI.

Vercel can instantly promote a previously healthy deployment if application code regresses. A code rollback does not reverse an already-applied database migration: database changes must remain backward compatible, and corrective schema changes belong in a new reviewed migration. Never repair or reset production migration history without a verified backup and an explicit recovery plan.

## Official references

- [Next.js deployment](https://nextjs.org/docs/app/getting-started/deploying)
- [Vercel Next.js deployment](https://vercel.com/docs/frameworks/full-stack/nextjs)
- [Vercel Node.js versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)
- [Supabase database migrations](https://supabase.com/docs/guides/deployment/database-migrations)
- [Supabase Auth redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)
- [Supabase Google login](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Supabase GitHub login](https://supabase.com/docs/guides/auth/social-login/auth-github)
- [GitHub Actions for Node.js](https://docs.github.com/en/actions/tutorials/build-and-test-code/nodejs)
