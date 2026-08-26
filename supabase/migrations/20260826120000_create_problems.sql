create table public.problems (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('leetcode', 'custom')),
  external_id text,
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 2 and 160),
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  external_url text,
  primary_topic_id uuid not null references public.topics (id) on delete restrict,
  pattern_tags text[] not null default '{}',
  recognition_signals text[] not null default '{}',
  estimated_minutes integer not null check (estimated_minutes between 5 and 180),
  curriculum_level text not null
    check (
      curriculum_level in (
        'foundation',
        'guided',
        'independent',
        'timed',
        'interview'
      )
    ),
  premium boolean not null default false,
  company_tags text[] not null default '{}',
  dataset_order integer not null unique check (dataset_order > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source, slug),
  check (
    (source = 'leetcode' and external_id is not null and external_url is not null)
    or source = 'custom'
  ),
  check (
    external_url is null
    or external_url ~ '^https://leetcode\.com/problems/[a-z0-9-]+/$'
  ),
  check (cardinality(pattern_tags) between 1 and 15),
  check (cardinality(recognition_signals) between 1 and 15),
  check (cardinality(company_tags) <= 20)
);

create unique index problems_source_external_id_idx
  on public.problems (source, external_id)
  where external_id is not null;

create table public.problem_secondary_topics (
  problem_id uuid not null references public.problems (id) on delete cascade,
  topic_id uuid not null references public.topics (id) on delete restrict,
  primary key (problem_id, topic_id)
);

create table public.problem_prerequisite_topics (
  problem_id uuid not null references public.problems (id) on delete cascade,
  topic_id uuid not null references public.topics (id) on delete restrict,
  primary key (problem_id, topic_id)
);

create index problems_primary_topic_idx
  on public.problems (primary_topic_id, dataset_order)
  where active;
create index problems_difficulty_idx
  on public.problems (difficulty, dataset_order)
  where active;
create index problems_curriculum_level_idx
  on public.problems (curriculum_level, dataset_order)
  where active;
create index problems_pattern_tags_idx
  on public.problems using gin (pattern_tags);
create index problems_company_tags_idx
  on public.problems using gin (company_tags);
create index problem_secondary_topics_topic_idx
  on public.problem_secondary_topics (topic_id, problem_id);
create index problem_prerequisite_topics_topic_idx
  on public.problem_prerequisite_topics (topic_id, problem_id);

create trigger problems_set_updated_at
before update on public.problems
for each row execute procedure public.set_updated_at();

alter table public.problems enable row level security;
alter table public.problems force row level security;
alter table public.problem_secondary_topics enable row level security;
alter table public.problem_secondary_topics force row level security;
alter table public.problem_prerequisite_topics enable row level security;
alter table public.problem_prerequisite_topics force row level security;

revoke all on table public.problems from anon, authenticated;
revoke all on table public.problem_secondary_topics from anon, authenticated;
revoke all on table public.problem_prerequisite_topics from anon, authenticated;

grant select on table public.problems to anon, authenticated;
grant select on table public.problem_secondary_topics to anon, authenticated;
grant select on table public.problem_prerequisite_topics to anon, authenticated;

create policy "Active problems are public metadata"
  on public.problems
  for select
  to anon, authenticated
  using (
    active
    and exists (
      select 1 from public.topics
      where topics.id = problems.primary_topic_id and topics.active
    )
  );

create policy "Active problem secondary topics are public metadata"
  on public.problem_secondary_topics
  for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.problems
      where problems.id = problem_secondary_topics.problem_id and problems.active
    )
    and exists (
      select 1 from public.topics
      where topics.id = problem_secondary_topics.topic_id and topics.active
    )
  );

create policy "Active problem prerequisites are public metadata"
  on public.problem_prerequisite_topics
  for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.problems
      where problems.id = problem_prerequisite_topics.problem_id and problems.active
    )
    and exists (
      select 1 from public.topics
      where topics.id = problem_prerequisite_topics.topic_id and topics.active
    )
  );
