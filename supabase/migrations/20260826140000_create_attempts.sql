create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  problem_id uuid not null references public.problems (id) on delete restrict,
  mode text not null default 'practice'
    check (mode in ('learn', 'practice', 'review', 'interview')),
  status text not null default 'started'
    check (status in ('started', 'completed', 'abandoned')),
  phase text not null default 'pre_attempt'
    check (
      phase in (
        'pre_attempt',
        'planning',
        'coding',
        'testing',
        'reflection',
        'completed'
      )
    ),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  duration_seconds integer not null default 0
    check (duration_seconds between 0 and 86400),
  timer_running boolean not null default false,
  timer_started_at timestamptz,
  result text check (result in ('solved', 'partial', 'failed', 'abandoned')),
  help_level text not null default 'none'
    check (
      help_level in (
        'none',
        'small_hint',
        'concept_hint',
        'pattern_hint',
        'pseudocode',
        'full_solution',
        'copied'
      )
    ),
  predicted_pattern text,
  brute_force_approach text,
  brute_force_complexity text,
  correct_pattern text,
  recognized_pattern_correctly boolean,
  submitted_time_complexity text,
  submitted_space_complexity text,
  complexity_correct boolean,
  confidence_before smallint check (confidence_before between 1 and 5),
  confidence_after smallint check (confidence_after between 1 and 5),
  takeaway text,
  mistakes text[] not null default '{}',
  edge_cases_missed text[] not null default '{}',
  code_snapshot text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (predicted_pattern is null or char_length(predicted_pattern) between 1 and 200),
  check (brute_force_approach is null or char_length(brute_force_approach) between 1 and 2000),
  check (brute_force_complexity is null or char_length(brute_force_complexity) between 1 and 120),
  check (correct_pattern is null or char_length(correct_pattern) between 1 and 200),
  check (submitted_time_complexity is null or char_length(submitted_time_complexity) between 1 and 120),
  check (submitted_space_complexity is null or char_length(submitted_space_complexity) between 1 and 120),
  check (takeaway is null or char_length(takeaway) between 1 and 2000),
  check (code_snapshot is null or char_length(code_snapshot) <= 50000),
  check (cardinality(mistakes) <= 12),
  check (cardinality(edge_cases_missed) <= 12),
  check (
    (timer_running and timer_started_at is not null and status = 'started')
    or (not timer_running and timer_started_at is null)
  ),
  check (
    (status = 'started' and completed_at is null and phase <> 'completed' and result is null)
    or (
      status = 'completed'
      and completed_at is not null
      and phase = 'completed'
      and result in ('solved', 'partial', 'failed')
      and not timer_running
    )
    or (
      status = 'abandoned'
      and completed_at is not null
      and result = 'abandoned'
      and not timer_running
    )
  )
);

create unique index attempts_one_active_per_user_idx
  on public.attempts (user_id)
  where status = 'started';
create index attempts_user_created_idx
  on public.attempts (user_id, created_at desc);
create index attempts_user_problem_idx
  on public.attempts (user_id, problem_id, created_at desc);

create table public.attempt_hints (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.attempts (id) on delete cascade,
  ordinal smallint not null check (ordinal between 1 and 6),
  help_level text not null
    check (
      help_level in (
        'small_hint',
        'concept_hint',
        'pattern_hint',
        'pseudocode',
        'full_solution'
      )
    ),
  title text not null check (char_length(title) between 2 and 80),
  content text not null check (char_length(content) between 10 and 2000),
  created_at timestamptz not null default now(),
  unique (attempt_id, ordinal)
);

create index attempt_hints_attempt_order_idx
  on public.attempt_hints (attempt_id, ordinal);

create function public.validate_attempt_transition()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  old_phase_index integer;
  new_phase_index integer;
begin
  if new.user_id <> old.user_id
    or new.problem_id <> old.problem_id
    or new.mode <> old.mode
    or new.started_at <> old.started_at then
    raise exception 'Attempt identity fields are immutable.';
  end if;

  if old.status <> 'started' and new is distinct from old then
    raise exception 'Finished attempts are immutable.';
  end if;

  old_phase_index := array_position(
    array['pre_attempt', 'planning', 'coding', 'testing', 'reflection', 'completed'],
    old.phase
  );
  new_phase_index := array_position(
    array['pre_attempt', 'planning', 'coding', 'testing', 'reflection', 'completed'],
    new.phase
  );

  if new_phase_index < old_phase_index or new_phase_index > old_phase_index + 1 then
    raise exception 'Attempt phases must advance one step at a time.';
  end if;

  if new.status = 'completed' and old.phase <> 'reflection' then
    raise exception 'Only an attempt in reflection can be completed.';
  end if;

  if old.status = 'started' and new.status not in ('started', 'completed', 'abandoned') then
    raise exception 'Invalid attempt status transition.';
  end if;

  return new;
end;
$$;

create trigger attempts_validate_transition
before update on public.attempts
for each row execute procedure public.validate_attempt_transition();

create trigger attempts_set_updated_at
before update on public.attempts
for each row execute procedure public.set_updated_at();

create function public.apply_attempt_hint_level()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.attempts
  set help_level = new.help_level
  where id = new.attempt_id and status = 'started';
  return new;
end;
$$;

create trigger attempt_hints_apply_help_level
after insert on public.attempt_hints
for each row execute procedure public.apply_attempt_hint_level();

alter table public.attempts enable row level security;
alter table public.attempts force row level security;
alter table public.attempt_hints enable row level security;
alter table public.attempt_hints force row level security;

revoke all on table public.attempts from anon, authenticated;
revoke all on table public.attempt_hints from anon, authenticated;

grant select, insert, update on table public.attempts to authenticated;
grant select, insert on table public.attempt_hints to authenticated;

create policy "Learners can read their own attempts"
  on public.attempts
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Learners can start active problems"
  on public.attempts
  for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and status = 'started'
    and phase = 'pre_attempt'
    and duration_seconds = 0
    and help_level = 'none'
    and exists (
      select 1 from public.problems
      where problems.id = attempts.problem_id and problems.active
    )
  );

create policy "Learners can update their own attempts"
  on public.attempts
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.problems
      where problems.id = attempts.problem_id and problems.active
    )
  );

create policy "Learners can read their own attempt hints"
  on public.attempt_hints
  for select
  to authenticated
  using (
    exists (
      select 1 from public.attempts
      where attempts.id = attempt_hints.attempt_id
        and attempts.user_id = (select auth.uid())
    )
  );

create policy "Learners can request hints for active attempts"
  on public.attempt_hints
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.attempts
      where attempts.id = attempt_hints.attempt_id
        and attempts.user_id = (select auth.uid())
        and attempts.status = 'started'
    )
  );
