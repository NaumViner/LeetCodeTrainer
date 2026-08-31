# Authentication

## Supported flows

Email/password sign-up, login, and logout are fully implemented. New users receive a profile automatically and are sent to onboarding; returning learners go to the dashboard. Logout uses local scope so it ends the current browser session without unexpectedly revoking every device.

After profile setup, new learners continue to the initial diagnostic. Returning learners with an unfinished diagnostic resume it, while completed learners go directly to the dashboard. Diagnostic completion and placement columns are excluded from browser profile-update privileges and can only be set by trusted grading.

Google and GitHub OAuth entry points are present but disabled in local Supabase configuration. To enable one, configure its client ID and secret in the Supabase environment, enable the provider, register the hosted Supabase `/auth/v1/callback` URL with the provider, and allow the application's `/auth/callback` URL in Supabase. See [deployment.md](deployment.md) for the exact production and preview URLs.

## Session handling

The browser and server use separate Supabase SSR clients. The Next.js proxy refreshes cookies, while protected layouts and Server Actions verify authenticated claims again. Authentication failures redirect to login with a safe, relative return path.

## Input handling

Server-side Zod schemas normalize email addresses, enforce the password policy, and validate profile fields. Server Actions never accept a learner ID; they derive it from the verified session.
