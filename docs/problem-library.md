# Problem library

## Scope

The initial catalog contains 150 LeetCode problems organized by 18 NeetCode-style topic categories. It is a curriculum index, not a copy of a problem provider: only factual metadata, locally authored learning annotations, and canonical outbound links are stored.

The product never imports or displays third-party statements, examples, constraints, editorial text, hints, or solutions. Learners use the “Open on LeetCode” link to read and solve a problem at its source.

## Data model

Each problem records its source and external identifier, slug, title, difficulty, URL, primary topic, pattern tags, recognition signals, estimated minutes, curriculum level, premium status, optional company tags, display order, and active status. Join tables connect secondary and prerequisite topics without duplicating topic data.

The database exposes active catalog metadata as public, read-only reference data. Forced Row Level Security and revoked write privileges prevent browser clients from inserting, changing, or deleting it.

## Reproducible import

`data/problems.json` is the reviewed source input. Two scripts support updates:

1. `npm run data:problems:sync` refreshes category membership from the public NeetCode 150 list and canonical factual metadata from LeetCode. It writes JSON only and requires network access.
2. `npm run data:problems:generate` validates the JSON, rejects duplicate IDs or slugs, adds deterministic locally authored educational annotations, and rewrites the committed seed migration.

After changing the catalog, review the JSON diff, generate the migration, reset the local database, regenerate database types when the schema changed, and run unit, integration, and browser checks. The generated migration must stay committed so local and hosted deployments receive identical data.

Company tags remain empty unless a reliable, reviewable source is provided; the schema and library filter already support them. Attempt data and baseline recommendations now exist in the private practice engine. Attempt-aware library filters, favorites, history, mastery, and review-state filters remain deferred to their dedicated analytics, history, mastery, and review phases.

## Library behavior

The library supports free-text search plus topic, difficulty, curriculum-level, and pattern filtering. Topic filtering matches both primary and secondary topics. Results are deterministically ordered and paginated, and each card leads to a local metadata page before the learner follows the canonical external link.
