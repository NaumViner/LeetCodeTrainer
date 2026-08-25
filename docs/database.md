# Database

## Profile model

`public.profiles` is keyed by the matching `auth.users.id` UUID and stores display name, preferred language, target role and companies, interview date, weekly study minutes, experience level, timezone, onboarding status, and UTC creation/update timestamps.

A `security definer` trigger creates the row when Supabase Auth creates a user. The trigger has an explicit empty `search_path` and schema-qualified object names.

## Access model

Row Level Security is enabled and forced. Authenticated learners receive only `SELECT` and `UPDATE` privileges, and both operations require the row ID to equal `auth.uid()`. Anonymous roles receive no profile privileges. Profile creation and deletion follow the Auth user lifecycle instead of accepting client-supplied ownership identifiers.

## Migration workflow

Create a new migration for every schema change, test it with `npm run db:reset`, regenerate `src/types/database.ts` with `npm run db:types`, and commit the migration and generated types together.

Production changes should be applied through the Supabase CLI migration workflow after linking the intended project. Do not place production keys in repository files or command history.
