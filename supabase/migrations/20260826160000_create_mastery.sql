create table public.attempt_performance (
  attempt_id uuid primary key references public.attempts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  topic_id uuid not null references public.topics (id) on delete restrict,
  correctness_score numeric(5, 4) not null check (correctness_score between 0 and 1),
  independence_score numeric(5, 4) not null check (independence_score between 0 and 1),
  recognition_score numeric(5, 4) not null check (recognition_score between 0 and 1),
  retention_score numeric(5, 4) not null check (retention_score between 0 and 1),
  complexity_score numeric(5, 4) not null check (complexity_score between 0 and 1),
  speed_score numeric(5, 4) not null check (speed_score between 0 and 1),
  overall_score numeric(5, 4) not null check (overall_score between 0 and 1),
  created_at timestamptz not null default now()
);

create table public.topic_mastery (
  user_id uuid not null references auth.users (id) on delete cascade,
  topic_id uuid not null references public.topics (id) on delete cascade,
  overall_score numeric(5, 2) not null check (overall_score between 0 and 100),
  correctness_score numeric(5, 2) not null check (correctness_score between 0 and 100),
  independence_score numeric(5, 2) not null check (independence_score between 0 and 100),
  recognition_score numeric(5, 2) not null check (recognition_score between 0 and 100),
  retention_score numeric(5, 2) not null check (retention_score between 0 and 100),
  speed_score numeric(5, 2) not null check (speed_score between 0 and 100),
  complexity_score numeric(5, 2) not null check (complexity_score between 0 and 100),
  total_attempts integer not null default 0 check (total_attempts >= 0),
  independent_solves integer not null default 0
    check (independent_solves between 0 and total_attempts),
  last_practiced_at timestamptz,
  next_review_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, topic_id)
);

create index attempt_performance_user_created_idx
  on public.attempt_performance (user_id, created_at desc);
create index topic_mastery_user_score_idx
  on public.topic_mastery (user_id, overall_score);

create trigger topic_mastery_set_updated_at
before update on public.topic_mastery
for each row execute procedure public.set_updated_at();

create function public.calculate_attempt_mastery()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  problem_record record;
  previous_mastery public.topic_mastery%rowtype;
  previous_attempts integer := 0;
  alpha numeric := 0.35;
  correctness numeric;
  independence numeric;
  recognition numeric;
  retention numeric;
  complexity numeric;
  pace numeric;
  speed numeric;
  performance numeric;
  new_correctness numeric;
  new_independence numeric;
  new_recognition numeric;
  new_retention numeric;
  new_complexity numeric;
  new_speed numeric;
  new_overall numeric;
  is_repeat boolean;
begin
  if new.status <> 'completed' or old.status = 'completed' then
    return new;
  end if;

  select primary_topic_id, estimated_minutes
  into problem_record
  from public.problems
  where id = new.problem_id;

  correctness := case new.result
    when 'solved' then 1.0
    when 'partial' then 0.5
    else 0.0
  end;
  independence := case new.help_level
    when 'none' then 1.0
    when 'small_hint' then 0.9
    when 'concept_hint' then 0.8
    when 'pattern_hint' then 0.65
    when 'pseudocode' then 0.45
    when 'full_solution' then 0.2
    when 'copied' then 0.05
  end;
  recognition := case when new.recognized_pattern_correctly then 1.0 else 0.0 end;
  complexity := case
    when new.complexity_correct is null then 0.5
    when new.complexity_correct then 1.0
    else 0.0
  end;

  select exists (
    select 1 from public.attempts
    where user_id = new.user_id
      and problem_id = new.problem_id
      and id <> new.id
      and status = 'completed'
  ) into is_repeat;
  retention := case
    when not is_repeat then 0.5
    when new.help_level = 'none' then correctness
    else correctness * independence
  end;

  pace := case
    when new.duration_seconds <= problem_record.estimated_minutes * 60 then 1.0
    when new.duration_seconds <= problem_record.estimated_minutes * 75 then 0.75
    when new.duration_seconds <= problem_record.estimated_minutes * 105 then 0.5
    else 0.25
  end;
  speed := pace * correctness;
  performance := round(
    correctness * 0.30
    + independence * 0.30
    + recognition * 0.15
    + retention * 0.10
    + complexity * 0.10
    + speed * 0.05,
    4
  );

  insert into public.attempt_performance (
    attempt_id, user_id, topic_id, correctness_score, independence_score,
    recognition_score, retention_score, complexity_score, speed_score,
    overall_score
  ) values (
    new.id, new.user_id, problem_record.primary_topic_id, correctness,
    independence, recognition, retention, complexity, speed, performance
  );

  select * into previous_mastery
  from public.topic_mastery
  where user_id = new.user_id and topic_id = problem_record.primary_topic_id;

  if found then
    previous_attempts := previous_mastery.total_attempts;
    alpha := case when previous_attempts = 1 then 0.30 else 0.25 end;
  end if;

  new_correctness := round(coalesce(previous_mastery.correctness_score, 35) * (1 - alpha) + correctness * 100 * alpha, 2);
  new_independence := round(coalesce(previous_mastery.independence_score, 35) * (1 - alpha) + independence * 100 * alpha, 2);
  new_recognition := round(coalesce(previous_mastery.recognition_score, 35) * (1 - alpha) + recognition * 100 * alpha, 2);
  new_retention := round(coalesce(previous_mastery.retention_score, 35) * (1 - alpha) + retention * 100 * alpha, 2);
  new_complexity := round(coalesce(previous_mastery.complexity_score, 35) * (1 - alpha) + complexity * 100 * alpha, 2);
  new_speed := round(coalesce(previous_mastery.speed_score, 35) * (1 - alpha) + speed * 100 * alpha, 2);
  new_overall := round(
    new_correctness * 0.30
    + new_independence * 0.30
    + new_recognition * 0.15
    + new_retention * 0.10
    + new_complexity * 0.10
    + new_speed * 0.05,
    2
  );

  insert into public.topic_mastery (
    user_id, topic_id, overall_score, correctness_score, independence_score,
    recognition_score, retention_score, speed_score, complexity_score,
    total_attempts, independent_solves, last_practiced_at
  ) values (
    new.user_id, problem_record.primary_topic_id, new_overall, new_correctness,
    new_independence, new_recognition, new_retention, new_speed,
    new_complexity, previous_attempts + 1,
    case when new.result = 'solved' and new.help_level = 'none' then 1 else 0 end,
    new.completed_at
  )
  on conflict (user_id, topic_id) do update set
    overall_score = excluded.overall_score,
    correctness_score = excluded.correctness_score,
    independence_score = excluded.independence_score,
    recognition_score = excluded.recognition_score,
    retention_score = excluded.retention_score,
    speed_score = excluded.speed_score,
    complexity_score = excluded.complexity_score,
    total_attempts = public.topic_mastery.total_attempts + 1,
    independent_solves = public.topic_mastery.independent_solves
      + case when new.result = 'solved' and new.help_level = 'none' then 1 else 0 end,
    last_practiced_at = excluded.last_practiced_at;

  return new;
end;
$$;

create trigger attempts_calculate_mastery
after update on public.attempts
for each row execute procedure public.calculate_attempt_mastery();

alter table public.attempt_performance enable row level security;
alter table public.attempt_performance force row level security;
alter table public.topic_mastery enable row level security;
alter table public.topic_mastery force row level security;

revoke all on table public.attempt_performance from anon, authenticated;
revoke all on table public.topic_mastery from anon, authenticated;
grant select on table public.attempt_performance to authenticated;
grant select on table public.topic_mastery to authenticated;

create policy "Learners can read their own attempt performance"
  on public.attempt_performance
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Learners can read their own topic mastery"
  on public.topic_mastery
  for select
  to authenticated
  using ((select auth.uid()) = user_id);
