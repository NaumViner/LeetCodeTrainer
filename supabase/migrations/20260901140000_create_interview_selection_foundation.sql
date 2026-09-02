create table public.problem_collections (
  id uuid primary key default gen_random_uuid(),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 2 and 120),
  version integer not null check (version > 0),
  expected_problem_count integer not null check (expected_problem_count > 0),
  expected_primary_topic_count integer not null
    check (expected_primary_topic_count > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (slug, version)
);

create unique index problem_collections_one_active_slug_idx
  on public.problem_collections (slug)
  where active;

create table public.problem_collection_memberships (
  collection_id uuid not null
    references public.problem_collections (id) on delete cascade,
  problem_id uuid not null references public.problems (id) on delete restrict,
  primary_topic_id uuid not null references public.topics (id) on delete restrict,
  ordinal integer not null check (ordinal > 0),
  created_at timestamptz not null default now(),
  primary key (collection_id, problem_id),
  unique (collection_id, ordinal)
);

create index problem_collection_memberships_topic_idx
  on public.problem_collection_memberships (
    collection_id,
    primary_topic_id,
    ordinal
  );

insert into public.problem_collections (
  id,
  slug,
  name,
  version,
  expected_problem_count,
  expected_primary_topic_count
) values (
  '20000000-0000-4000-8000-000000000001',
  'neetcode-150',
  'NeetCode 150',
  1,
  150,
  18
);

insert into public.problem_collection_memberships (
  collection_id,
  problem_id,
  primary_topic_id,
  ordinal
)
select
  '20000000-0000-4000-8000-000000000001',
  problem.id,
  problem.primary_topic_id,
  problem.dataset_order
from public.problems as problem
where problem.source = 'leetcode'
order by problem.dataset_order;

do $$
declare
  seeded_problem_count integer;
  seeded_topic_count integer;
begin
  select count(*), count(distinct primary_topic_id)
  into seeded_problem_count, seeded_topic_count
  from public.problem_collection_memberships
  where collection_id = '20000000-0000-4000-8000-000000000001';

  if seeded_problem_count <> 150 or seeded_topic_count <> 18 then
    raise exception
      'NeetCode 150 collection expected 150 problems across 18 topics, found % problems across % topics.',
      seeded_problem_count,
      seeded_topic_count;
  end if;
end;
$$;

alter table public.problem_collections enable row level security;
alter table public.problem_collections force row level security;
alter table public.problem_collection_memberships enable row level security;
alter table public.problem_collection_memberships force row level security;

revoke all on table public.problem_collections from anon, authenticated;
revoke all on table public.problem_collection_memberships from anon, authenticated;
grant select on table public.problem_collections to anon, authenticated;
grant select on table public.problem_collection_memberships to anon, authenticated;

create policy "Active problem collections are public metadata"
  on public.problem_collections
  for select
  to anon, authenticated
  using (active);

create policy "Active collection memberships are public metadata"
  on public.problem_collection_memberships
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.problem_collections
      where problem_collections.id = problem_collection_memberships.collection_id
        and problem_collections.active
    )
  );

alter table public.mock_interviews
  add column selection_mode text not null default 'legacy',
  add column requested_topic_id uuid references public.topics (id) on delete restrict,
  add column requested_difficulties text[],
  add column selected_topic_id uuid references public.topics (id) on delete restrict,
  add column selection_algorithm_version integer not null default 0,
  add column selection_metadata jsonb not null default '{}'::jsonb,
  add column coding_language text not null default 'python',
  add column question_content_version integer;

update public.mock_interviews as interview
set selected_topic_id = problem.primary_topic_id,
  requested_difficulties = case
    when interview.difficulty_mode = 'adaptive'
      then array['easy', 'medium', 'hard']::text[]
    else array[interview.difficulty_mode]::text[]
  end
from public.problems as problem
where problem.id = interview.problem_id;

create function public.valid_interview_difficulty_filter(p_value text[])
returns boolean
language sql
immutable
security invoker
set search_path = ''
as $$
  select coalesce(
    cardinality(p_value) between 1 and 3
      and p_value <@ array['easy', 'medium', 'hard']::text[]
      and cardinality(p_value) = (
        select count(distinct item)
        from unnest(p_value) as item
      ),
    false
  );
$$;

create function public.validate_mock_interview_selection_snapshot()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_problem record;
begin
  select problem.primary_topic_id, problem.difficulty
  into selected_problem
  from public.problems as problem
  where problem.id = new.problem_id;

  if not found then
    raise exception 'The interview problem is unavailable.';
  end if;

  if new.selected_topic_id is null then
    new.selected_topic_id := selected_problem.primary_topic_id;
  elsif new.selected_topic_id <> selected_problem.primary_topic_id then
    raise exception 'The selected interview topic does not match the problem.';
  end if;

  if new.requested_difficulties is null
    or cardinality(new.requested_difficulties) = 0 then
    new.requested_difficulties := case
      when new.difficulty_mode = 'adaptive'
        then array['easy', 'medium', 'hard']::text[]
      else array[new.difficulty_mode]::text[]
    end;
  end if;

  if not public.valid_interview_difficulty_filter(new.requested_difficulties)
    or not selected_problem.difficulty = any(new.requested_difficulties) then
    raise exception 'The selected problem does not match the requested difficulty filter.';
  end if;

  if new.selection_mode = 'custom'
    and (
      new.requested_topic_id is null
      or new.requested_topic_id <> new.selected_topic_id
      or cardinality(new.requested_difficulties) <> 1
    ) then
    raise exception 'Custom interview selection requires one matching topic and difficulty.';
  end if;

  return new;
end;
$$;

create trigger mock_interviews_validate_selection_snapshot
before insert or update of
  problem_id,
  difficulty_mode,
  selection_mode,
  requested_topic_id,
  requested_difficulties,
  selected_topic_id
on public.mock_interviews
for each row execute procedure public.validate_mock_interview_selection_snapshot();

alter table public.mock_interviews
  alter column requested_difficulties set default '{}'::text[],
  alter column requested_difficulties set not null,
  alter column selected_topic_id set not null,
  add constraint mock_interviews_selection_mode_check
    check (selection_mode in ('legacy', 'coverage', 'improvement', 'learning', 'custom')),
  add constraint mock_interviews_requested_difficulties_check
    check (public.valid_interview_difficulty_filter(requested_difficulties)),
  add constraint mock_interviews_selection_algorithm_version_check
    check (selection_algorithm_version >= 0),
  add constraint mock_interviews_selection_metadata_check
    check (
      jsonb_typeof(selection_metadata) = 'object'
      and octet_length(selection_metadata::text) <= 4096
    ),
  add constraint mock_interviews_coding_language_check
    check (coding_language in ('python', 'java')),
  add constraint mock_interviews_question_content_version_check
    check (question_content_version is null or question_content_version > 0);

create index mock_interviews_user_selected_topic_idx
  on public.mock_interviews (user_id, selected_topic_id, completed_at desc)
  where status = 'completed';

revoke all on function public.valid_interview_difficulty_filter(text[]) from public;
revoke all on function public.validate_mock_interview_selection_snapshot() from public;
