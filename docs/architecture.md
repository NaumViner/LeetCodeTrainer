# Architecture

## Direction

FAANG Interview Academy uses a modular monolith. Next.js owns web transport and rendering, while learning calculations will live in framework-independent domain modules. Supabase PostgreSQL, Auth, and Row Level Security become the persistence boundary in Phase 2.

## Boundaries

- `src/app`: routing, layouts, loading/error states, and server endpoints
- `src/components`: reusable presentation and application-shell components
- `src/features`: feature orchestration introduced with each product phase
- `src/domain`: deterministic mastery, recommendation, review, and interview calculations
- `src/lib`: infrastructure adapters, validation, database, AI, and analytics clients
- `content`: versioned lesson bodies
- `data`: reproducible metadata and seed inputs

Presentation components must not contain mastery, recommendation, or scheduling rules. API routes and Server Actions will validate input and delegate to domain/application services.

## Database approach

Phase 2 will use Supabase Auth and PostgreSQL with migrations committed under `supabase/migrations`. Public curriculum metadata will be readable according to explicit policies; every user-owned record will be protected by RLS and server-side ownership checks.

## Testing

- Vitest: deterministic domain functions and synchronous components
- React Testing Library: behavior and accessibility-oriented component tests
- Playwright: production-like user workflows and responsive smoke coverage

Async Server Components will be covered through browser tests, matching current Next.js guidance.
