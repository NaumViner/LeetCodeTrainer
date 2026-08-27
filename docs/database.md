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

## Analytics and mastery model

`attempt_performance` is an immutable one-to-one snapshot for each completed attempt. It stores normalized 0–1 correctness, independence, recognition, retention, complexity, speed, and weighted overall performance. `topic_mastery` stores smoothed 0–100 versions of those dimensions plus attempt counts, independent solves, practice timestamps, and the earliest scheduled problem review for the topic.

An `after update` trigger on `attempts` creates the performance row and updates primary-topic mastery in the same database transaction as completion. This prevents an attempt from being saved without its analytics and prevents client code from supplying its own scores. Analytics tables grant authenticated learners read access only to their own rows; all browser writes are revoked and forced RLS remains the final privacy boundary.

`diagnostic_question_keys` stores the private grading key and grants browser roles no access. `diagnostic_attempts` stores one initial assessment per learner, including the frozen adaptive coding assignment and section scores. `diagnostic_responses` stores question-level evidence. Two authenticated security-definer functions validate and grade raw option tokens; finalization atomically updates the attempt, protected profile placement fields, and diagnostic-provenance columns on `topic_mastery`.

## Spaced repetition model

`problem_reviews` stores the current learner-problem schedule: repetition, interval, bounded easiness, last review, next review, last performance, and failure streak. `review_events` stores the immutable evidence behind every schedule change and points to its completed attempt.

The review trigger follows the performance trigger in deterministic name order. It uses the completed attempt plus its frozen performance snapshot, updates the current schedule, appends an event, and synchronizes the topic review timestamp before the completion transaction commits. Browser roles can read only their own review rows and receive no write grants. Review-mode attempt insertion additionally requires an existing schedule owned by the learner.

## Daily-plan model

`daily_plans` stores the learner's local date, available minutes, generation number, generated timestamp, and active/completed/expired status. A partial unique index permits one active version per learner and date. `daily_plan_items` stores three to six ordered lesson, problem, review, mock-interview, or reflection tasks with source entity, scheduled minutes, priority, action path, reason, and completion timestamp.

Authenticated security-definer functions replace a plan and toggle one item. Replacement serializes concurrent generation with a learner-date advisory lock, expires the old active version, validates the item count and budget, verifies lesson/problem references, and inserts the new version in one transaction. Item completion verifies ownership and rejects expired versions before recalculating parent completion. Browser roles receive only own-row select access and no direct write grants.

## Mock-interview model

`mock_interviews` stores one structured interview session with a required 30-, 45-, or 60-minute timer, adaptive or explicit difficulty, ordered phase, notes, code, complexity analysis, retrospective, and result. A partial unique index permits one active interview per learner. A shared advisory lock and attempt-insert trigger prevent an active practice attempt and active interview from overlapping, including concurrent starts.

`mock_interview_scorecards` stores the immutable ten-criterion rubric and overall score. Authenticated database functions start, advance, complete, or abandon only the caller's interview. Completion validates every phase, calculates the scorecard from persisted evidence plus explicit retrospective ratings, and smooths the result into the problem topic's mastery. Both tables use forced RLS, allow only own-row reads, and revoke direct browser writes.

## Migration workflow

Create a new migration for every schema change, test it with `npm run db:reset`, regenerate `src/types/database.ts` with `npm run db:types`, and commit the migration and generated types together.

Production changes should be applied through the Supabase CLI migration workflow after linking the intended project. Do not place production keys in repository files or command history.
