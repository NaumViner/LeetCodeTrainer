# Security

- Browser code receives only the Supabase project URL and publishable/anonymous key. These keys are safe to expose only because RLS remains enabled.
- Service-role and OAuth secrets are server-only and never committed. The application runtime does not need a service-role key.
- Authorization is enforced in PostgreSQL with forced RLS and repeated at protected server boundaries for defense in depth.
- Identity always comes from verified Supabase claims, never from form input or a URL parameter.
- Redirect destinations are restricted to relative application paths to prevent open redirects.
- Curriculum records are read-only to browser roles. Lesson content paths are database-constrained and resolved inside the dedicated curriculum directory.
- Problem records are metadata-only and read-only to browser roles. Canonical outbound URLs are constrained to HTTPS and opened with safe external-link attributes.
- Practice Server Actions authenticate on every call, validate all client input, and constrain mutations by both attempt ID and verified user ID. Database checks prevent inconsistent timer and completion states.
- Attempts and hint history are private learner-owned data protected by forced RLS. Integration tests create two real users and prove cross-user profile, lesson-progress, attempt, and hint operations fail; they also prove anonymous private-data reads fail and catalog writes are denied.

Before a hosted release, apply migrations to the intended Supabase project, confirm RLS remains enabled, rotate any keys exposed outside approved secret storage, configure allowed redirect URLs, and run the integration and browser suites against a safe non-production environment.
