create table public.topics (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 2 and 80),
  short_description text not null check (char_length(short_description) between 10 and 240),
  long_description text not null check (char_length(long_description) between 20 and 2000),
  curriculum_order integer not null unique check (curriculum_order > 0),
  stage smallint not null check (stage between 0 and 5),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.topic_prerequisites (
  topic_id uuid not null references public.topics (id) on delete cascade,
  prerequisite_topic_id uuid not null references public.topics (id) on delete restrict,
  primary key (topic_id, prerequisite_topic_id),
  check (topic_id <> prerequisite_topic_id)
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics (id) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 2 and 120),
  lesson_order integer not null check (lesson_order > 0),
  estimated_minutes integer not null check (estimated_minutes between 1 and 240),
  learning_objectives text[] not null default '{}',
  recognition_signals text[] not null default '{}',
  common_mistakes text[] not null default '{}',
  content_path text not null
    check (content_path ~ '^content/curriculum/[a-z0-9-]+\.md$'),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (topic_id, slug),
  unique (topic_id, lesson_order),
  check (cardinality(learning_objectives) between 1 and 12),
  check (cardinality(recognition_signals) between 1 and 20),
  check (cardinality(common_mistakes) between 1 and 20)
);

create table public.lesson_prerequisites (
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  prerequisite_lesson_id uuid not null references public.lessons (id) on delete restrict,
  primary key (lesson_id, prerequisite_lesson_id),
  check (lesson_id <> prerequisite_lesson_id)
);

create table public.lesson_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id),
  check (completed_at is null or completed_at >= started_at)
);

create index lessons_topic_order_idx
  on public.lessons (topic_id, lesson_order)
  where active;
create index topic_prerequisites_dependency_idx
  on public.topic_prerequisites (prerequisite_topic_id);
create index lesson_prerequisites_dependency_idx
  on public.lesson_prerequisites (prerequisite_lesson_id);
create index lesson_progress_user_completed_idx
  on public.lesson_progress (user_id, completed_at);

create trigger topics_set_updated_at
before update on public.topics
for each row execute procedure public.set_updated_at();

create trigger lessons_set_updated_at
before update on public.lessons
for each row execute procedure public.set_updated_at();

create trigger lesson_progress_set_updated_at
before update on public.lesson_progress
for each row execute procedure public.set_updated_at();

alter table public.topics enable row level security;
alter table public.topics force row level security;
alter table public.topic_prerequisites enable row level security;
alter table public.topic_prerequisites force row level security;
alter table public.lessons enable row level security;
alter table public.lessons force row level security;
alter table public.lesson_prerequisites enable row level security;
alter table public.lesson_prerequisites force row level security;
alter table public.lesson_progress enable row level security;
alter table public.lesson_progress force row level security;

revoke all on table public.topics from anon, authenticated;
revoke all on table public.topic_prerequisites from anon, authenticated;
revoke all on table public.lessons from anon, authenticated;
revoke all on table public.lesson_prerequisites from anon, authenticated;
revoke all on table public.lesson_progress from anon, authenticated;

grant select on table public.topics to anon, authenticated;
grant select on table public.topic_prerequisites to anon, authenticated;
grant select on table public.lessons to anon, authenticated;
grant select on table public.lesson_prerequisites to anon, authenticated;
grant select, insert, update on table public.lesson_progress to authenticated;

create policy "Active topics are public curriculum"
  on public.topics
  for select
  to anon, authenticated
  using (active);

create policy "Active topic prerequisites are public curriculum"
  on public.topic_prerequisites
  for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.topics
      where topics.id = topic_prerequisites.topic_id and topics.active
    )
    and exists (
      select 1 from public.topics
      where topics.id = topic_prerequisites.prerequisite_topic_id and topics.active
    )
  );

create policy "Active lessons are public curriculum"
  on public.lessons
  for select
  to anon, authenticated
  using (
    active
    and exists (
      select 1 from public.topics
      where topics.id = lessons.topic_id and topics.active
    )
  );

create policy "Active lesson prerequisites are public curriculum"
  on public.lesson_prerequisites
  for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.lessons
      where lessons.id = lesson_prerequisites.lesson_id and lessons.active
    )
    and exists (
      select 1 from public.lessons
      where lessons.id = lesson_prerequisites.prerequisite_lesson_id and lessons.active
    )
  );

create policy "Learners can read their own lesson progress"
  on public.lesson_progress
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Learners can start active lessons"
  on public.lesson_progress
  for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.lessons
      where lessons.id = lesson_progress.lesson_id and lessons.active
    )
  );

create policy "Learners can update their own lesson progress"
  on public.lesson_progress
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.lessons
      where lessons.id = lesson_progress.lesson_id and lessons.active
    )
  );
