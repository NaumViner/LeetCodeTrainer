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

Curriculum metadata is normalized into topics, lessons, and prerequisite edges. Stable reference data is seeded through a migration, while long lesson bodies remain versioned Markdown files under `content/curriculum`. Learner progress is stored separately so static content can evolve without mixing ownership concerns.

Problem metadata follows the same reference-data boundary. A reviewed JSON catalog is transformed by a deterministic generator into a committed migration. The database normalizes topic relationships, while framework-independent filtering stays in `src/features/problems` and route components only handle request parameters and presentation. External problem content remains at its canonical provider URL.

Practice uses a persisted state machine. Framework-independent transition, hint, help-score, and elapsed-time rules live in `src/domain/practice.ts`; adaptive selection is isolated in `src/domain/recommendation.ts`. Server Actions authenticate every mutation, validate untrusted input, derive ownership from signed claims, and write through learner-scoped RLS policies. The interactive workspace owns only browser behavior such as the visible timer and form state; the database remains the refresh-safe source of truth.

The initial diagnostic is a two-stage server-rendered workflow. Static question presentation lives in the domain layer, while private database answer keys remain the authoritative grading source. The first transaction grades concepts and patterns and freezes the adaptive coding assignment; the second grades coding, finalizes placement, protects profile completion state, and initializes bounded topic mastery in one commit.

The adaptive recommendation engine reads private evidence server-side and passes normalized context into a pure scoring module. Eligibility gates prerequisites and curriculum progression. Ranking combines weakness, due review, topic balance, difficulty, interview urgency, novelty, recency, repetition, and frustration. A stable learner-day hash selects only among near-equal leaders, preserving both explainability and controlled diversity.

Daily planning composes the curriculum, review queue, and adaptive ranking through a separate pure domain module. The application derives the learner's local date and same-day workload, then an authenticated database function atomically versions the plan and its items. Completion is another narrow database function that can change only ownership-verified item state and its parent status.

Attempt completion is also the analytics transaction boundary. An `after update` database trigger derives a frozen performance snapshot from the completed attempt and problem estimate, then smooths it into the learner's primary-topic mastery in the same transaction. Read paths aggregate those private records into readiness, history, topic dashboards, and recent-attempt summaries; they never write scores from the browser.

The TypeScript mastery and review modules mirror the database formulas for independent tests and transparent product behavior. A second completion trigger reads the frozen attempt performance, adapts the learner-problem review schedule, appends immutable schedule history, and synchronizes the topic's earliest review date in the same transaction. Mock-interview execution remains explicitly unmeasured until real interview evidence exists.

## Authentication approach

Browser and server clients use `@supabase/ssr`. The Next.js proxy refreshes session cookies and performs optimistic navigation redirects. Protected layouts and Server Actions verify signed claims again before reading or mutating data.

Email/password auth is operational. Google and GitHub use the same callback handler and can be enabled per environment after provider credentials are configured in Supabase.

## Testing

- Vitest: validation and synchronous components
- Supabase integration tests: trigger behavior, curriculum and problem-catalog integrity, attempt persistence, RLS isolation, anonymous denial, and cross-user protection
- Playwright: real sign-up, onboarding, curriculum navigation, lesson completion, problem filtering, complete practice attempts, logout/login, responsive behavior, and persistence

Async Server Components are covered through browser tests, matching current Next.js guidance.
