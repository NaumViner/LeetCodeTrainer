create table public.problem_reviews (
  user_id uuid not null references auth.users (id) on delete cascade,
  problem_id uuid not null references public.problems (id) on delete cascade,
  repetition integer not null default 0 check (repetition >= 0),
  interval_days integer not null check (interval_days between 1 and 365),
  easiness_factor numeric(4, 2) not null default 2.50
    check (easiness_factor between 1.30 and 2.50),
  last_reviewed_at timestamptz,
  next_review_at timestamptz not null,
  last_performance_score numeric(5, 4) not null
    check (last_performance_score between 0 and 1),
  failure_streak integer not null default 0 check (failure_streak >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, problem_id)
);

create table public.review_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  problem_id uuid not null references public.problems (id) on delete cascade,
  attempt_id uuid not null unique references public.attempts (id) on delete cascade,
  attempt_mode text not null check (attempt_mode in ('learn', 'practice', 'review', 'interview')),
  reviewed_at timestamptz not null,
  result text not null check (result in ('solved', 'partial', 'failed')),
  help_level text not null check (
    help_level in (
      'none', 'small_hint', 'concept_hint', 'pattern_hint', 'pseudocode',
      'full_solution', 'copied'
    )
  ),
  quality_score numeric(4, 2) not null check (quality_score between 0 and 5),
  performance_score numeric(5, 4) not null check (performance_score between 0 and 1),
  previous_interval_days integer check (previous_interval_days between 1 and 365),
  interval_days integer not null check (interval_days between 1 and 365),
  repetition integer not null check (repetition >= 0),
  easiness_factor numeric(4, 2) not null check (easiness_factor between 1.30 and 2.50),
  failure_streak integer not null check (failure_streak >= 0),
  next_review_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index problem_reviews_user_due_idx
  on public.problem_reviews (user_id, next_review_at);
create index review_events_user_reviewed_idx
  on public.review_events (user_id, reviewed_at desc);

create trigger problem_reviews_set_updated_at
before update on public.problem_reviews
for each row execute procedure public.set_updated_at();

create function public.schedule_completed_attempt_review()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  problem_record record;
  performance_record public.attempt_performance%rowtype;
  previous_review public.problem_reviews%rowtype;
  prior_easiness numeric := 2.50;
  prior_failure integer := 0;
  prior_interval integer := 0;
  prior_repetition integer := 0;
  correctness_quality numeric;
  help_penalty numeric;
  confidence_value integer;
  pace_adjustment numeric;
  retention_adjustment numeric;
  quality numeric;
  distance numeric;
  new_easiness numeric;
  interval_factor numeric;
  new_interval integer;
  new_repetition integer;
  new_failure integer;
  strong_repeat boolean;
  new_next_review_at timestamptz;
begin
  if new.status <> 'completed' or old.status = 'completed' then
    return new;
  end if;

  select primary_topic_id, estimated_minutes
  into problem_record
  from public.problems
  where id = new.problem_id;

  select * into performance_record
  from public.attempt_performance
  where attempt_id = new.id;

  if not found then
    raise exception 'Attempt performance must exist before review scheduling.';
  end if;

  select * into previous_review
  from public.problem_reviews
  where user_id = new.user_id and problem_id = new.problem_id
  for update;

  if found then
    prior_easiness := previous_review.easiness_factor;
    prior_failure := previous_review.failure_streak;
    prior_interval := previous_review.interval_days;
    prior_repetition := previous_review.repetition;
  end if;

  correctness_quality := case new.result
    when 'solved' then 5.0
    when 'partial' then 2.0
    else 0.0
  end;
  help_penalty := case new.help_level
    when 'none' then 0.0
    when 'small_hint' then 0.5
    when 'concept_hint' then 1.0
    when 'pattern_hint' then 1.5
    when 'pseudocode' then 2.0
    when 'full_solution' then 3.5
    when 'copied' then 4.0
  end;
  confidence_value := coalesce(new.confidence_after, 3);
  pace_adjustment := case
    when new.duration_seconds <= greatest(60, problem_record.estimated_minutes * 60) then 0.25
    when new.duration_seconds > greatest(60, problem_record.estimated_minutes * 60) * 1.5 then -0.5
    else 0.0
  end;
  retention_adjustment := (
    least(1.0, greatest(0.0, performance_record.retention_score)) - 0.5
  ) * 0.5;
  quality := round(
    least(5.0, greatest(
      0.0,
      correctness_quality - help_penalty
        + (confidence_value - 3) * 0.25
        + pace_adjustment
        + retention_adjustment
        - prior_failure * 0.25
    )),
    2
  );

  distance := 5 - quality;
  new_easiness := round(
    least(2.50, greatest(
      1.30,
      prior_easiness + 0.1 - distance * (0.08 + distance * 0.02)
    )),
    2
  );
  new_failure := case when new.result = 'solved' then 0 else prior_failure + 1 end;
  new_repetition := case when new.result = 'solved' then prior_repetition + 1 else 0 end;
  interval_factor := least(1.0, greatest(0.75, 0.75 + quality / 20));
  strong_repeat := prior_repetition >= 1
    and performance_record.retention_score >= 0.8
    and confidence_value >= 4
    and new.duration_seconds <= greatest(60, problem_record.estimated_minutes * 60) * 1.25;

  new_interval := case
    when new.result = 'failed' then 1
    when new.result = 'partial' and new.help_level = 'none' then 2
    when new.result = 'partial' then 1
    when new.help_level in ('copied', 'full_solution')
      then least(2, greatest(1, round(2 * interval_factor)::integer))
    when new.help_level = 'pseudocode'
      then least(3, greatest(1, round(2 * interval_factor)::integer))
    when new.help_level = 'pattern_hint'
      then least(4, greatest(2, round(3 * interval_factor)::integer))
    when new.help_level = 'concept_hint'
      then least(5, greatest(3, round(4 * interval_factor)::integer))
    when new.help_level = 'small_hint'
      then least(7, greatest(4, round(5 * interval_factor)::integer))
    when strong_repeat
      then least(30, greatest(14, round(greatest(14, prior_interval * new_easiness))::integer))
    when prior_repetition >= 1
      then least(14, greatest(7, round(greatest(7, prior_interval * 1.5))::integer))
    else least(14, greatest(7, round(7 + (quality / 5) * 7)::integer))
  end;
  new_next_review_at := new.completed_at + make_interval(days => new_interval);

  insert into public.problem_reviews (
    user_id, problem_id, repetition, interval_days, easiness_factor,
    last_reviewed_at, next_review_at, last_performance_score, failure_streak
  ) values (
    new.user_id, new.problem_id, new_repetition, new_interval, new_easiness,
    new.completed_at, new_next_review_at, performance_record.overall_score,
    new_failure
  )
  on conflict (user_id, problem_id) do update set
    repetition = excluded.repetition,
    interval_days = excluded.interval_days,
    easiness_factor = excluded.easiness_factor,
    last_reviewed_at = excluded.last_reviewed_at,
    next_review_at = excluded.next_review_at,
    last_performance_score = excluded.last_performance_score,
    failure_streak = excluded.failure_streak;

  insert into public.review_events (
    user_id, problem_id, attempt_id, attempt_mode, reviewed_at, result,
    help_level, quality_score, performance_score, previous_interval_days,
    interval_days, repetition, easiness_factor, failure_streak, next_review_at
  ) values (
    new.user_id, new.problem_id, new.id, new.mode, new.completed_at,
    new.result, new.help_level, quality, performance_record.overall_score,
    case when prior_interval = 0 then null else prior_interval end,
    new_interval, new_repetition, new_easiness, new_failure, new_next_review_at
  );

  update public.topic_mastery
  set next_review_at = (
    select min(reviews.next_review_at)
    from public.problem_reviews reviews
    join public.problems scheduled_problem on scheduled_problem.id = reviews.problem_id
    where reviews.user_id = new.user_id
      and scheduled_problem.primary_topic_id = problem_record.primary_topic_id
  )
  where user_id = new.user_id and topic_id = problem_record.primary_topic_id;

  return new;
end;
$$;

create trigger attempts_schedule_problem_review
after update on public.attempts
for each row execute procedure public.schedule_completed_attempt_review();

alter table public.problem_reviews enable row level security;
alter table public.problem_reviews force row level security;
alter table public.review_events enable row level security;
alter table public.review_events force row level security;

revoke all on table public.problem_reviews from anon, authenticated;
revoke all on table public.review_events from anon, authenticated;
grant select on table public.problem_reviews to authenticated;
grant select on table public.review_events to authenticated;

create policy "Learners can read their own problem reviews"
  on public.problem_reviews
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Learners can read their own review history"
  on public.review_events
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy "Learners can start active problems" on public.attempts;
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
    and (
      mode <> 'review'
      or exists (
        select 1 from public.problem_reviews
        where problem_reviews.user_id = (select auth.uid())
          and problem_reviews.problem_id = attempts.problem_id
      )
    )
  );
