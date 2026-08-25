# Architecture

## Direction

FAANG Interview Academy uses a modular monolith. Next.js owns web transport and rendering; Supabase PostgreSQL, Auth, and Row Level Security form the persistence boundary. Learning calculations introduced in later phases will live in framework-independent domain modules.

## Boundaries

- `src/app`: routing, layouts, loading/error states, and Server Action entry points
- `src/components`: reusable presentation and application-shell components
- `src/features`: feature validation, queries, and server-side orchestration
- `src/domain`: deterministic mastery, recommendation, review, and interview calculations
- `src/lib`: infrastructure adapters, environment validation, and Supabase clients
- `content`: versioned lesson bodies
- `data`: reproducible metadata and seed inputs

Presentation components do not contain authorization or learning rules. Server Actions validate untrusted input, derive identity from the authenticated session, and delegate to feature queries. Protected layouts verify authentication independently of the navigation proxy.

## Database approach

All schema changes are reproducible migrations under `supabase/migrations`. Auth users have a matching `public.profiles` row created by a database trigger. The profile uses UUID identity and UTC timestamps.

Row Level Security is enabled and forced on the profile table. Separate select and update policies constrain authenticated access to `auth.uid() = id`; anonymous access is revoked. The database policy is the final authorization boundary, even when a query or UI is incorrect.

## Authentication approach

Browser and server clients use `@supabase/ssr`. The Next.js proxy refreshes session cookies and performs optimistic navigation redirects. Protected layouts and Server Actions verify signed claims again before reading or mutating data.

Email/password auth is operational. Google and GitHub use the same callback handler and can be enabled per environment after provider credentials are configured in Supabase.

## Testing

- Vitest: validation and synchronous components
- Supabase integration tests: trigger behavior, RLS isolation, anonymous denial, and persistence across sessions
- Playwright: real sign-up, onboarding, protected navigation, logout/login, responsive behavior, and persistence

Async Server Components are covered through browser tests, matching current Next.js guidance.
