# Curriculum

## Learning path

The seeded path contains 21 topics ordered from interview process and foundations through core, structural, and advanced patterns. Stage 5 interview execution will combine these topics in later phases rather than introducing another isolated algorithm topic.

Prerequisites are normalized edges instead of embedded arrays. The interface shows when prerequisites are still ahead but permits previewing any topic; this keeps the curriculum supportive without hiding educational material.

## Lesson format

Each topic has an active starter lesson with structured metadata:

- learning objectives
- recognition signals
- common mistakes
- estimated duration and order
- a versioned Markdown content path

The required starter modules cover overview, intuition, recognition, complexity, a guided example, practice mapping, and a checkpoint. Remaining advanced topics begin with lighter but valid lessons and can be expanded by adding ordered lesson rows and Markdown files.

## Content workflow

1. Add or revise Markdown under `content/curriculum`.
2. Add lesson metadata through a Supabase migration.
3. Keep content paths inside the curriculum directory and compatible with the database path constraint.
4. Add prerequisite edges through the normalized tables.
5. Reset the local database, regenerate types when the schema changes, and run unit, integration, and browser tests.

Long lesson bodies never live in React components. The server resolves validated paths inside the curriculum directory and `react-markdown` renders the content without raw HTML.

## Progress semantics

A lesson is complete when the learner has an owned `lesson_progress` row with `completed_at`. Topic completion is derived from active lesson completion; overall progress is completed active lessons divided by all active lessons. Prerequisites are considered complete only when every active lesson in the prerequisite topic is complete.
