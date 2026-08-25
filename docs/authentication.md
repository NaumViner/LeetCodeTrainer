# Authentication

## Supported flows

Email/password sign-up, login, and logout are fully implemented. New users receive a profile automatically and are sent to onboarding; returning learners go to the dashboard. Logout uses local scope so it ends the current browser session without unexpectedly revoking every device.

Google and GitHub OAuth entry points are present but disabled in local Supabase configuration. To enable one, configure its client ID and secret in the Supabase environment, enable the provider, and register `/auth/callback` for the deployment URL.

## Session handling

The browser and server use separate Supabase SSR clients. The Next.js proxy refreshes cookies, while protected layouts and Server Actions verify authenticated claims again. Authentication failures redirect to login with a safe, relative return path.

## Input handling

Server-side Zod schemas normalize email addresses, enforce the password policy, and validate profile fields. Server Actions never accept a learner ID; they derive it from the verified session.
