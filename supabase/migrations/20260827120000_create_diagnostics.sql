alter table public.profiles
  add column diagnostic_completed boolean not null default false,
  add column diagnostic_completed_at timestamptz,
  add column diagnostic_level text
    check (diagnostic_level in ('foundation', 'developing', 'independent')),
  add constraint profiles_diagnostic_completion_consistent check (
    (not diagnostic_completed and diagnostic_completed_at is null and diagnostic_level is null)
    or (diagnostic_completed and diagnostic_completed_at is not null and diagnostic_level is not null)
  );

revoke update on table public.profiles from authenticated;
grant update (
  display_name,
  preferred_language,
  target_role,
  target_companies,
  interview_date,
  weekly_study_minutes,
  experience_level,
  timezone,
  onboarding_completed
) on table public.profiles to authenticated;

alter table public.topic_mastery
  add column diagnostic_score numeric(5, 2)
    check (diagnostic_score between 0 and 100),
  add column diagnostic_initialized_at timestamptz;

create table public.diagnostic_question_keys (
  question_id text primary key
    check (question_id ~ '^(concept|pattern|coding)-[a-z0-9-]+$'),
  section text not null check (section in ('concept', 'pattern', 'coding')),
  topic_id uuid not null references public.topics (id) on delete restrict,
  correct_answer text not null check (correct_answer in ('a', 'b', 'c', 'd')),
  difficulty smallint not null check (difficulty between 1 and 3),
  active boolean not null default true
);

insert into public.diagnostic_question_keys (
  question_id, section, topic_id, correct_answer, difficulty
)
select seed.question_id, seed.section, topics.id, seed.correct_answer, seed.difficulty
from (
  values
    ('concept-complexity', 'concept', 'big-o', 'd', 1),
    ('concept-hash-map', 'concept', 'arrays-and-hashing', 'a', 1),
    ('concept-recursion', 'concept', 'programming-foundations', 'a', 1),
    ('concept-trees', 'concept', 'trees', 'b', 2),
    ('concept-graphs', 'concept', 'graphs', 'a', 2),
    ('pattern-pair-sum', 'pattern', 'arrays-and-hashing', 'b', 1),
    ('pattern-contiguous', 'pattern', 'sliding-window', 'c', 2),
    ('pattern-shortest-path', 'pattern', 'graphs', 'a', 2),
    ('coding-two-sum', 'coding', 'arrays-and-hashing', 'b', 1),
    ('coding-binary-search', 'coding', 'binary-search', 'c', 2),
    ('coding-tree-depth', 'coding', 'trees', 'a', 2),
    ('coding-graph-cycle', 'coding', 'graphs', 'd', 3),
    ('coding-top-k', 'coding', 'heap-priority-queue', 'b', 3),
    ('coding-merge-intervals', 'coding', 'intervals', 'c', 3)
) as seed(question_id, section, topic_slug, correct_answer, difficulty)
join public.topics on topics.slug = seed.topic_slug;

create table public.diagnostic_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  status text not null default 'coding'
    check (status in ('coding', 'completed')),
  coding_tier text not null
    check (coding_tier in ('foundation', 'intermediate', 'advanced')),
  assigned_coding_question_ids text[] not null,
  concept_score numeric(5, 2) not null check (concept_score between 0 and 100),
  pattern_score numeric(5, 2) not null check (pattern_score between 0 and 100),
  coding_score numeric(5, 2) check (coding_score between 0 and 100),
  overall_score numeric(5, 2) check (overall_score between 0 and 100),
  placement_level text
    check (placement_level in ('foundation', 'developing', 'independent')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (cardinality(assigned_coding_question_ids) between 1 and 3),
  check (
    (status = 'coding' and coding_score is null and overall_score is null
      and placement_level is null and completed_at is null)
    or (status = 'completed' and coding_score is not null and overall_score is not null
      and placement_level is not null and completed_at is not null)
  )
);

create table public.diagnostic_responses (
  id uuid primary key default gen_random_uuid(),
  diagnostic_attempt_id uuid not null
    references public.diagnostic_attempts (id) on delete cascade,
  question_id text not null references public.diagnostic_question_keys (question_id),
  section text not null check (section in ('concept', 'pattern', 'coding')),
  topic_id uuid not null references public.topics (id) on delete restrict,
  selected_answer text not null check (selected_answer in ('a', 'b', 'c', 'd')),
  correct boolean not null,
  created_at timestamptz not null default now(),
  unique (diagnostic_attempt_id, question_id)
);

create index diagnostic_responses_attempt_section_idx
  on public.diagnostic_responses (diagnostic_attempt_id, section);

create trigger diagnostic_attempts_set_updated_at
before update on public.diagnostic_attempts
for each row execute procedure public.set_updated_at();

create function public.begin_diagnostic(p_answers jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  existing_attempt public.diagnostic_attempts%rowtype;
  learner_experience text;
  answer_count integer;
  distinct_count integer;
  matched_count integer;
  concept_result numeric;
  pattern_result numeric;
  selected_tier text;
  coding_ids text[];
  new_attempt_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('diagnostic:' || current_user_id::text, 0)
  );

  select * into existing_attempt
  from public.diagnostic_attempts
  where user_id = current_user_id
  for update;
  if found then
    if existing_attempt.status = 'completed' then
      raise exception 'The initial diagnostic is already complete.';
    end if;
    return existing_attempt.id;
  end if;

  select experience_level into learner_experience
  from public.profiles
  where id = current_user_id and onboarding_completed;
  if learner_experience is null then
    raise exception 'Complete profile setup before the diagnostic.';
  end if;

  if jsonb_typeof(p_answers) <> 'array' then
    raise exception 'Diagnostic answers must be an array.';
  end if;
  if exists (
    select 1
    from jsonb_to_recordset(p_answers) as answer(question_id text, answer text)
    where answer.answer not in ('a', 'b', 'c', 'd')
  ) then
    raise exception 'A diagnostic answer is invalid.';
  end if;

  select
    count(*),
    count(distinct answer.question_id),
    count(key.question_id)
  into answer_count, distinct_count, matched_count
  from jsonb_to_recordset(p_answers) as answer(question_id text, answer text)
  left join public.diagnostic_question_keys key
    on key.question_id = answer.question_id
    and key.section in ('concept', 'pattern')
    and key.active;
  if answer_count <> 8 or distinct_count <> 8 or matched_count <> 8 then
    raise exception 'Answer every concept and pattern question exactly once.';
  end if;

  select
    round(100.0 * count(*) filter (where key.section = 'concept' and key.correct_answer = answer.answer)
      / count(*) filter (where key.section = 'concept'), 2),
    round(100.0 * count(*) filter (where key.section = 'pattern' and key.correct_answer = answer.answer)
      / count(*) filter (where key.section = 'pattern'), 2)
  into concept_result, pattern_result
  from jsonb_to_recordset(p_answers) as answer(question_id text, answer text)
  join public.diagnostic_question_keys key on key.question_id = answer.question_id;

  selected_tier := case
    when concept_result >= 80 and pattern_result >= 66
      and learner_experience in ('some_leetcode', 'active_interview_prep', 'experienced')
      then 'advanced'
    when concept_result >= 40 and pattern_result >= 33 then 'intermediate'
    else 'foundation'
  end;
  coding_ids := case selected_tier
    when 'advanced' then array[
      'coding-graph-cycle', 'coding-top-k', 'coding-merge-intervals'
    ]
    when 'intermediate' then array[
      'coding-binary-search', 'coding-tree-depth'
    ]
    else array['coding-two-sum']
  end;

  insert into public.diagnostic_attempts (
    user_id, coding_tier, assigned_coding_question_ids,
    concept_score, pattern_score
  ) values (
    current_user_id, selected_tier, coding_ids,
    concept_result, pattern_result
  )
  returning id into new_attempt_id;

  insert into public.diagnostic_responses (
    diagnostic_attempt_id, question_id, section, topic_id,
    selected_answer, correct
  )
  select
    new_attempt_id, key.question_id, key.section, key.topic_id,
    answer.answer, key.correct_answer = answer.answer
  from jsonb_to_recordset(p_answers) as answer(question_id text, answer text)
  join public.diagnostic_question_keys key on key.question_id = answer.question_id;

  return new_attempt_id;
end;
$$;

create function public.complete_diagnostic(
  p_attempt_id uuid,
  p_answers jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  owned_attempt public.diagnostic_attempts%rowtype;
  answer_count integer;
  distinct_count integer;
  matched_count integer;
  coding_result numeric;
  overall_result numeric;
  selected_level text;
begin
  if current_user_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  select * into owned_attempt
  from public.diagnostic_attempts
  where id = p_attempt_id and user_id = current_user_id
  for update;
  if not found then
    raise exception 'Diagnostic attempt not found.' using errcode = '42501';
  end if;
  if owned_attempt.status = 'completed' then
    return;
  end if;
  if jsonb_typeof(p_answers) <> 'array' then
    raise exception 'Coding answers must be an array.';
  end if;
  if exists (
    select 1
    from jsonb_to_recordset(p_answers) as answer(question_id text, answer text)
    where answer.answer not in ('a', 'b', 'c', 'd')
  ) then
    raise exception 'A coding answer is invalid.';
  end if;

  select
    count(*),
    count(distinct answer.question_id),
    count(key.question_id)
  into answer_count, distinct_count, matched_count
  from jsonb_to_recordset(p_answers) as answer(question_id text, answer text)
  left join public.diagnostic_question_keys key
    on key.question_id = answer.question_id
    and key.section = 'coding'
    and key.question_id = any(owned_attempt.assigned_coding_question_ids)
    and key.active;
  if answer_count <> cardinality(owned_attempt.assigned_coding_question_ids)
    or distinct_count <> answer_count
    or matched_count <> answer_count then
    raise exception 'Answer every assigned coding problem exactly once.';
  end if;

  insert into public.diagnostic_responses (
    diagnostic_attempt_id, question_id, section, topic_id,
    selected_answer, correct
  )
  select
    owned_attempt.id, key.question_id, key.section, key.topic_id,
    answer.answer, key.correct_answer = answer.answer
  from jsonb_to_recordset(p_answers) as answer(question_id text, answer text)
  join public.diagnostic_question_keys key on key.question_id = answer.question_id;

  select round(100.0 * count(*) filter (where correct) / count(*), 2)
  into coding_result
  from public.diagnostic_responses
  where diagnostic_attempt_id = owned_attempt.id and section = 'coding';
  overall_result := round(
    owned_attempt.concept_score * 0.30
      + owned_attempt.pattern_score * 0.30
      + coding_result * 0.40,
    2
  );
  selected_level := case
    when overall_result >= 75 then 'independent'
    when overall_result >= 50 then 'developing'
    else 'foundation'
  end;

  update public.diagnostic_attempts
  set
    status = 'completed',
    coding_score = coding_result,
    overall_score = overall_result,
    placement_level = selected_level,
    completed_at = now()
  where id = owned_attempt.id;

  with topic_evidence as (
    select
      response.topic_id,
      avg(case when response.correct then 1.0 else 0.0 end) as accuracy,
      avg(case when response.correct then 1.0 else 0.0 end)
        filter (where response.section = 'coding') as coding_accuracy,
      avg(case when response.correct then 1.0 else 0.0 end)
        filter (where response.section = 'pattern') as pattern_accuracy,
      avg(case when response.correct then 1.0 else 0.0 end)
        filter (where response.section = 'concept') as concept_accuracy
    from public.diagnostic_responses response
    where response.diagnostic_attempt_id = owned_attempt.id
    group by response.topic_id
  ), dimensions as (
    select
      topic_id,
      round(25 + accuracy * 50, 2) as correctness,
      round(25 + coalesce(coding_accuracy, 0.20) * 50, 2) as independence,
      round(25 + coalesce(pattern_accuracy, accuracy) * 50, 2) as recognition,
      35.00::numeric as retention,
      35.00::numeric as speed,
      round(25 + coalesce(concept_accuracy, accuracy) * 50, 2) as complexity,
      round(25 + accuracy * 50, 2) as diagnostic
    from topic_evidence
  )
  insert into public.topic_mastery (
    user_id, topic_id, overall_score, correctness_score,
    independence_score, recognition_score, retention_score,
    speed_score, complexity_score, diagnostic_score,
    diagnostic_initialized_at
  )
  select
    current_user_id,
    topic_id,
    round(
      correctness * 0.30 + independence * 0.30 + recognition * 0.15
        + retention * 0.10 + complexity * 0.10 + speed * 0.05,
      2
    ),
    correctness,
    independence,
    recognition,
    retention,
    speed,
    complexity,
    diagnostic,
    now()
  from dimensions
  on conflict (user_id, topic_id) do update set
    overall_score = excluded.overall_score,
    correctness_score = excluded.correctness_score,
    independence_score = excluded.independence_score,
    recognition_score = excluded.recognition_score,
    retention_score = excluded.retention_score,
    speed_score = excluded.speed_score,
    complexity_score = excluded.complexity_score,
    diagnostic_score = excluded.diagnostic_score,
    diagnostic_initialized_at = excluded.diagnostic_initialized_at
  where public.topic_mastery.total_attempts = 0;

  update public.profiles
  set
    diagnostic_completed = true,
    diagnostic_completed_at = now(),
    diagnostic_level = selected_level
  where id = current_user_id;
end;
$$;

alter table public.diagnostic_question_keys enable row level security;
alter table public.diagnostic_attempts enable row level security;
alter table public.diagnostic_attempts force row level security;
alter table public.diagnostic_responses enable row level security;
alter table public.diagnostic_responses force row level security;

revoke all on table public.diagnostic_question_keys from anon, authenticated;
revoke all on table public.diagnostic_attempts from anon, authenticated;
revoke all on table public.diagnostic_responses from anon, authenticated;
grant select on table public.diagnostic_attempts to authenticated;
grant select on table public.diagnostic_responses to authenticated;

create policy "Learners can read their own diagnostic"
  on public.diagnostic_attempts
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Learners can read their own diagnostic responses"
  on public.diagnostic_responses
  for select
  to authenticated
  using (
    exists (
      select 1 from public.diagnostic_attempts
      where diagnostic_attempts.id = diagnostic_responses.diagnostic_attempt_id
        and diagnostic_attempts.user_id = (select auth.uid())
    )
  );

revoke all on function public.begin_diagnostic(jsonb) from public;
revoke all on function public.complete_diagnostic(uuid, jsonb) from public;
grant execute on function public.begin_diagnostic(jsonb) to authenticated;
grant execute on function public.complete_diagnostic(uuid, jsonb) to authenticated;
