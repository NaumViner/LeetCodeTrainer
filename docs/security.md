# Security

- Browser code receives only the Supabase project URL and publishable/anonymous key. These keys are safe to expose only because RLS remains enabled.
- Service-role and OAuth secrets are server-only and never committed. The application runtime does not need a service-role key.
- Authorization is enforced in PostgreSQL with forced RLS and repeated at protected server boundaries for defense in depth.
- Identity always comes from verified Supabase claims, never from form input or a URL parameter.
- Redirect destinations are restricted to relative application paths to prevent open redirects.
- Integration tests create two real users and prove cross-user reads and updates fail; they also prove anonymous reads fail.

Before a hosted release, apply migrations to the intended Supabase project, confirm RLS remains enabled, rotate any keys exposed outside approved secret storage, configure allowed redirect URLs, and run the integration and browser suites against a safe non-production environment.
