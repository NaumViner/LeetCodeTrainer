# Seed data

`problems.json` is the reviewed source of truth for the metadata-only problem catalog. It contains 150 active problems across the 18 NeetCode-style categories represented in the source list. It intentionally contains no problem statements, examples, constraints, hints, or solutions.

To regenerate the committed SQL seed from this file:

```bash
npm run data:problems:generate
```

The generator validates the catalog, rejects duplicate identities, derives educational fields such as pattern tags and recognition signals, and writes `supabase/migrations/20260826121000_seed_problems.sql`.

To refresh the public title, identifier, difficulty, premium flag, and canonical URL metadata before reviewing a catalog update:

```bash
npm run data:problems:sync
```

The sync script uses the public NeetCode 150 list for category membership and the public LeetCode GraphQL endpoint for canonical metadata. Upstream data must be reviewed before regenerating or committing the migration. Stable topic and lesson reference data remains in its own committed curriculum migration.
