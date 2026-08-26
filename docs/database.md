# Database

## Profile model

`public.profiles` is keyed by the matching `auth.users.id` UUID and stores display name, preferred language, target role and companies, interview date, weekly study minutes, experience level, timezone, onboarding status, and UTC creation/update timestamps.

A `security definer` trigger creates the row when Supabase Auth creates a user. The trigger has an explicit empty `search_path` and schema-qualified object names.

## Access model

Row Level Security is enabled and forced. Authenticated learners receive only `SELECT` and `UPDATE` privileges, and both operations require the row ID to equal `auth.uid()`. Anonymous roles receive no profile privileges. Profile creation and deletion follow the Auth user lifecycle instead of accepting client-supplied ownership identifiers.

## Curriculum model

- `topics` stores ordered stage metadata.
- `topic_prerequisites` is a normalized directed prerequisite graph.
- `lessons` stores objectives, recognition signals, common mistakes, duration, order, and a validated Markdown content path.
- `lesson_prerequisites` connects lesson dependencies with foreign keys.
- `lesson_progress` records learner-owned start and completion timestamps.

Active curriculum metadata is publicly readable and application roles receive no curriculum write grants. Lesson progress is private: authenticated learners can select, insert, or update only rows whose `user_id` matches `auth.uid()`. The application also derives that ID from verified claims.

## Problem catalog model

`problems` stores metadata and learning annotations only: source identity, canonical external URL, title, difficulty, primary topic, pattern tags, recognition signals, estimated time, curriculum level, premium flag, optional company tags, ordering, and active status. `problem_secondary_topics` and `problem_prerequisite_topics` normalize the many-to-many topic relationships.

The catalog does not store third-party problem statements, examples, constraints, hints, or solutions. Active metadata is publicly readable so signed-out product pages and authenticated learning routes can use the same catalog. Anonymous and authenticated roles receive no write grants, and forced RLS restricts all reads to active records and valid active relationships.

The committed catalog is generated deterministically from `data/problems.json`; see `problem-library.md` for its provenance and update workflow.

## Practice model

`attempts` stores one learner's complete practice record: problem and mode, workflow phase, status, timer state, result, highest help level, pre-attempt reasoning, confidence, code snapshot, complexity analysis, mistakes, missed edge cases, takeaway, and timestamps. A partial unique index permits only one active attempt per learner, which gives `/practice` an unambiguous resume target.

`attempt_hints` stores the ordered progressive hints revealed during an attempt. A database trigger raises the parent attempt's assistance level whenever a hint is inserted, so help tracking cannot be forgotten by a UI path.

Both tables use forced Row Level Security. Authenticated learners can access only rows owned by their verified Auth ID; anonymous clients receive no privileges. Insert and update policies also require an active problem, and table constraints enforce timer, phase, completion, array, and field-length invariants.

## Migration workflow

Create a new migration for every schema change, test it with `npm run db:reset`, regenerate `src/types/database.ts` with `npm run db:types`, and commit the migration and generated types together.

Production changes should be applied through the Supabase CLI migration workflow after linking the intended project. Do not place production keys in repository files or command history.
