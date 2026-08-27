alter table public.topic_mastery
  add column mock_interview_count integer not null default 0
    check (mock_interview_count >= 0),
  add column last_interviewed_at timestamptz;

create table public.mock_interviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  problem_id uuid not null references public.problems (id) on delete restrict,
  status text not null default 'active'
    check (status in ('active', 'completed', 'abandoned')),
  phase text not null default 'intro'
    check (phase in (
      'intro', 'clarify', 'examples', 'brute_force', 'optimization',
      'implementation', 'testing', 'complexity', 'retrospective', 'completed'
    )),
  difficulty_mode text not null
    check (difficulty_mode in ('adaptive', 'easy', 'medium', 'hard')),
  duration_minutes integer not null check (duration_minutes in (30, 45, 60)),
  elapsed_seconds integer not null default 0
    check (elapsed_seconds between 0 and 14400),
  timer_running boolean not null default true,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  clarification_notes text,
  examples_notes text,
  brute_force_notes text,
  optimization_notes text,
  code_snapshot text,
  testing_notes text,
  submitted_time_complexity text,
  submitted_space_complexity text,
  retrospective text,
  result text check (result in ('solved', 'partial', 'failed', 'abandoned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (clarification_notes is null or char_length(clarification_notes) between 1 and 4000),
  check (examples_notes is null or char_length(examples_notes) between 1 and 4000),
  check (brute_force_notes is null or char_length(brute_force_notes) between 1 and 4000),
  check (optimization_notes is null or char_length(optimization_notes) between 1 and 4000),
  check (code_snapshot is null or char_length(code_snapshot) between 1 and 50000),
  check (testing_notes is null or char_length(testing_notes) between 1 and 4000),
  check (submitted_time_complexity is null or char_length(submitted_time_complexity) between 1 and 120),
  check (submitted_space_complexity is null or char_length(submitted_space_complexity) between 1 and 120),
  check (retrospective is null or char_length(retrospective) between 1 and 4000),
  check (
    (status = 'active' and completed_at is null and result is null and phase <> 'completed')
    or (status = 'completed' and completed_at is not null
      and result in ('solved', 'partial', 'failed') and phase = 'completed'
      and not timer_running)
    or (status = 'abandoned' and completed_at is not null
      and result = 'abandoned' and phase <> 'completed' and not timer_running)
  )
);

create unique index mock_interviews_one_active_user_idx
  on public.mock_interviews (user_id) where status = 'active';
create index mock_interviews_user_started_idx
  on public.mock_interviews (user_id, started_at desc);

create table public.mock_interview_scorecards (
  mock_interview_id uuid primary key
    references public.mock_interviews (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  topic_id uuid not null references public.topics (id) on delete restrict,
  problem_understanding smallint not null check (problem_understanding between 1 and 5),
  clarification smallint not null check (clarification between 1 and 5),
  approach_quality smallint not null check (approach_quality between 1 and 5),
  optimization smallint not null check (optimization between 1 and 5),
  correctness smallint not null check (correctness between 1 and 5),
  code_quality smallint not null check (code_quality between 1 and 5),
  testing smallint not null check (testing between 1 and 5),
  complexity_reasoning smallint not null check (complexity_reasoning between 1 and 5),
  communication smallint not null check (communication between 1 and 5),
  independence smallint not null check (independence between 1 and 5),
  overall_score numeric(5, 2) not null check (overall_score between 0 and 100),
  strengths text[] not null default '{}',
  improvements text[] not null default '{}',
  created_at timestamptz not null default now(),
  check (cardinality(strengths) <= 4),
  check (cardinality(improvements) <= 4)
);

create index mock_interview_scorecards_user_created_idx
  on public.mock_interview_scorecards (user_id, created_at desc);

create function public.prevent_practice_during_mock_interview()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('mock-interview:' || new.user_id::text, 0)
  );
  if exists (
    select 1 from public.mock_interviews
    where user_id = new.user_id and status = 'active'
  ) then
    raise exception 'Finish the active mock interview before practicing.';
  end if;
  return new;
end;
$$;

create trigger attempts_prevent_during_mock_interview
before insert on public.attempts
for each row execute procedure public.prevent_practice_during_mock_interview();

create trigger mock_interviews_set_updated_at
before update on public.mock_interviews
for each row execute procedure public.set_updated_at();

create function public.mock_interview_evidence_score(
  p_value text,
  p_developing_lines integer,
  p_strong_lines integer
)
returns integer
language plpgsql
immutable
security invoker
set search_path = ''
as $$
declare
  nonempty_lines integer;
  value_length integer := char_length(trim(coalesce(p_value, '')));
begin
  select count(*) into nonempty_lines
  from regexp_split_to_table(coalesce(p_value, ''), E'\n') as line
  where btrim(line) <> '';
  if nonempty_lines >= p_strong_lines or value_length >= p_strong_lines * 35 then return 5; end if;
  if nonempty_lines >= p_developing_lines + 2 or value_length >= 180 then return 4; end if;
  if nonempty_lines >= p_developing_lines or value_length >= 80 then return 3; end if;
  if nonempty_lines > 0 then return 2; end if;
  return 1;
end;
$$;

create function public.start_mock_interview(
  p_problem_id uuid,
  p_duration_minutes integer,
  p_difficulty_mode text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  new_interview_id uuid;
  problem_difficulty text;
begin
  if current_user_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;
  if p_duration_minutes not in (30, 45, 60) then
    raise exception 'Interview duration must be 30, 45, or 60 minutes.';
  end if;
  if p_difficulty_mode not in ('adaptive', 'easy', 'medium', 'hard') then
    raise exception 'Interview difficulty mode is invalid.';
  end if;
  if not exists (
    select 1 from public.profiles
    where id = current_user_id and onboarding_completed and diagnostic_completed
  ) then
    raise exception 'Complete onboarding and the diagnostic first.';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('mock-interview:' || current_user_id::text, 0)
  );
  if exists (
    select 1 from public.mock_interviews
    where user_id = current_user_id and status = 'active'
  ) then
    raise exception 'An active mock interview already exists.';
  end if;
  if exists (
    select 1 from public.attempts
    where user_id = current_user_id and status = 'started'
  ) then
    raise exception 'Finish the active practice attempt before interviewing.';
  end if;

  select difficulty into problem_difficulty
  from public.problems
  where id = p_problem_id and active;
  if problem_difficulty is null then
    raise exception 'The interview problem is unavailable.';
  end if;
  if p_difficulty_mode <> 'adaptive' and problem_difficulty <> p_difficulty_mode then
    raise exception 'The selected problem does not match the requested difficulty.';
  end if;

  insert into public.mock_interviews (
    user_id, problem_id, duration_minutes, difficulty_mode
  ) values (
    current_user_id, p_problem_id, p_duration_minutes, p_difficulty_mode
  ) returning id into new_interview_id;
  return new_interview_id;
end;
$$;

create function public.advance_mock_interview(
  p_mock_interview_id uuid,
  p_target_phase text,
  p_payload jsonb,
  p_elapsed_seconds integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  owned_interview public.mock_interviews%rowtype;
  phases constant text[] := array[
    'intro', 'clarify', 'examples', 'brute_force', 'optimization',
    'implementation', 'testing', 'complexity', 'retrospective', 'completed'
  ];
  current_index integer;
  target_index integer;
  note_value text;
  time_value text;
  space_value text;
begin
  if current_user_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;
  select * into owned_interview
  from public.mock_interviews
  where id = p_mock_interview_id and user_id = current_user_id
  for update;
  if not found or owned_interview.status <> 'active' then
    raise exception 'Active mock interview not found.' using errcode = '42501';
  end if;
  current_index := array_position(phases, owned_interview.phase);
  target_index := array_position(phases, p_target_phase);
  if target_index is null or target_index <> current_index + 1
    or p_target_phase = 'completed' then
    raise exception 'Mock interview phases must advance one step at a time.';
  end if;
  if p_elapsed_seconds < owned_interview.elapsed_seconds
    or p_elapsed_seconds > 14400 then
    raise exception 'Interview elapsed time is invalid.';
  end if;

  if owned_interview.phase in (
    'clarify', 'examples', 'brute_force', 'optimization',
    'implementation', 'testing'
  ) then
    note_value := nullif(trim(p_payload ->> 'notes'), '');
    if note_value is null then raise exception 'Complete the current interview phase.'; end if;
    if owned_interview.phase = 'implementation' and char_length(note_value) > 50000 then
      raise exception 'The code snapshot is too large.';
    elsif owned_interview.phase <> 'implementation' and char_length(note_value) > 4000 then
      raise exception 'Interview notes are too large.';
    end if;
  elsif owned_interview.phase = 'complexity' then
    time_value := nullif(trim(p_payload ->> 'timeComplexity'), '');
    space_value := nullif(trim(p_payload ->> 'spaceComplexity'), '');
    if time_value is null or space_value is null
      or char_length(time_value) > 120 or char_length(space_value) > 120 then
      raise exception 'Complete both complexity fields.';
    end if;
  end if;

  update public.mock_interviews
  set
    phase = p_target_phase,
    elapsed_seconds = greatest(
      elapsed_seconds,
      p_elapsed_seconds,
      least(14400, floor(extract(epoch from (now() - started_at)))::integer)
    ),
    timer_running = p_target_phase <> 'retrospective',
    clarification_notes = case when owned_interview.phase = 'clarify' then note_value else clarification_notes end,
    examples_notes = case when owned_interview.phase = 'examples' then note_value else examples_notes end,
    brute_force_notes = case when owned_interview.phase = 'brute_force' then note_value else brute_force_notes end,
    optimization_notes = case when owned_interview.phase = 'optimization' then note_value else optimization_notes end,
    code_snapshot = case when owned_interview.phase = 'implementation' then note_value else code_snapshot end,
    testing_notes = case when owned_interview.phase = 'testing' then note_value else testing_notes end,
    submitted_time_complexity = case when owned_interview.phase = 'complexity' then time_value else submitted_time_complexity end,
    submitted_space_complexity = case when owned_interview.phase = 'complexity' then space_value else submitted_space_complexity end
  where id = owned_interview.id;
end;
$$;

create function public.complete_mock_interview(
  p_mock_interview_id uuid,
  p_result text,
  p_code_quality_rating integer,
  p_complexity_rating integer,
  p_communication_rating integer,
  p_independence_rating integer,
  p_retrospective text,
  p_elapsed_seconds integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  owned_interview public.mock_interviews%rowtype;
  problem_record record;
  previous_mastery public.topic_mastery%rowtype;
  problem_understanding_score integer;
  clarification_score integer;
  approach_score integer;
  optimization_score integer;
  correctness_score integer;
  code_quality_score integer;
  testing_score integer;
  complexity_score integer;
  communication_score integer := p_communication_rating;
  independence_score integer := p_independence_rating;
  overall_result numeric;
  strengths_value text[] := array[]::text[];
  improvements_value text[] := array[]::text[];
  new_correctness numeric;
  new_independence numeric;
  new_recognition numeric;
  new_retention numeric;
  new_complexity numeric;
  new_speed numeric;
  new_overall numeric;
begin
  if current_user_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;
  select * into owned_interview
  from public.mock_interviews
  where id = p_mock_interview_id and user_id = current_user_id
  for update;
  if not found or owned_interview.status <> 'active'
    or owned_interview.phase <> 'retrospective' then
    raise exception 'Mock interview is not ready for completion.' using errcode = '42501';
  end if;
  if p_result not in ('solved', 'partial', 'failed')
    or p_code_quality_rating not between 1 and 5
    or p_complexity_rating not between 1 and 5
    or p_communication_rating not between 1 and 5
    or p_independence_rating not between 1 and 5
    or char_length(trim(coalesce(p_retrospective, ''))) not between 1 and 4000
    or p_elapsed_seconds < owned_interview.elapsed_seconds
    or p_elapsed_seconds > 14400 then
    raise exception 'Mock interview retrospective is invalid.';
  end if;

  clarification_score := public.mock_interview_evidence_score(owned_interview.clarification_notes, 2, 5);
  problem_understanding_score := round((
    clarification_score + public.mock_interview_evidence_score(owned_interview.examples_notes, 2, 5)
  ) / 2.0);
  optimization_score := public.mock_interview_evidence_score(owned_interview.optimization_notes, 3, 8);
  approach_score := round((
    public.mock_interview_evidence_score(owned_interview.brute_force_notes, 3, 8)
      + optimization_score
  ) / 2.0);
  code_quality_score := round((
    public.mock_interview_evidence_score(owned_interview.code_snapshot, 5, 12)
      + p_code_quality_rating
  ) / 2.0);
  testing_score := public.mock_interview_evidence_score(owned_interview.testing_notes, 3, 8);
  complexity_score := p_complexity_rating;
  correctness_score := case p_result when 'solved' then 5 when 'partial' then 3 else 1 end;
  overall_result := round((
    problem_understanding_score + clarification_score + approach_score
      + optimization_score + correctness_score + code_quality_score
      + testing_score + complexity_score + communication_score
      + independence_score
  ) / 50.0 * 100, 2);

  if problem_understanding_score >= 4 then strengths_value := array_append(strengths_value, 'Problem understanding'); end if;
  if clarification_score >= 4 then strengths_value := array_append(strengths_value, 'Clarification'); end if;
  if approach_score >= 4 then strengths_value := array_append(strengths_value, 'Approach quality'); end if;
  if optimization_score >= 4 then strengths_value := array_append(strengths_value, 'Optimization'); end if;
  if correctness_score >= 4 then strengths_value := array_append(strengths_value, 'Correctness'); end if;
  if code_quality_score >= 4 then strengths_value := array_append(strengths_value, 'Code quality'); end if;
  if testing_score >= 4 then strengths_value := array_append(strengths_value, 'Testing'); end if;
  if complexity_score >= 4 then strengths_value := array_append(strengths_value, 'Complexity reasoning'); end if;
  if communication_score >= 4 then strengths_value := array_append(strengths_value, 'Communication'); end if;
  if independence_score >= 4 then strengths_value := array_append(strengths_value, 'Independence'); end if;
  strengths_value := strengths_value[1:4];

  if problem_understanding_score <= 2 then improvements_value := array_append(improvements_value, 'Restate the goal and validate it with concrete examples before solving.'); end if;
  if clarification_score <= 2 then improvements_value := array_append(improvements_value, 'Ask about constraints, duplicates, invalid input, and expected output before proposing an approach.'); end if;
  if approach_score <= 2 then improvements_value := array_append(improvements_value, 'State the brute-force baseline, its bottleneck, and the optimized invariant before coding.'); end if;
  if optimization_score <= 2 then improvements_value := array_append(improvements_value, 'Identify repeated work in the baseline and name the invariant that removes it.'); end if;
  if correctness_score <= 2 then improvements_value := array_append(improvements_value, 'Trace the algorithm against a normal case and a boundary case before finalizing.'); end if;
  if code_quality_score <= 2 then improvements_value := array_append(improvements_value, 'Use smaller named helpers and keep the implementation aligned with the stated invariant.'); end if;
  if testing_score <= 2 then improvements_value := array_append(improvements_value, 'Test empty, minimal, duplicate, and adversarial cases while tracing state changes.'); end if;
  if complexity_score <= 2 then improvements_value := array_append(improvements_value, 'Derive time and space from the operations and stored state rather than recalling a label.'); end if;
  if communication_score <= 2 then improvements_value := array_append(improvements_value, 'Narrate decisions and tradeoffs at each phase instead of explaining only after coding.'); end if;
  if independence_score <= 2 then improvements_value := array_append(improvements_value, 'Pause to form a complete plan before seeking confirmation or changing direction.'); end if;
  improvements_value := improvements_value[1:4];

  select primary_topic_id, estimated_minutes into problem_record
  from public.problems where id = owned_interview.problem_id;

  insert into public.mock_interview_scorecards (
    mock_interview_id, user_id, topic_id, problem_understanding,
    clarification, approach_quality, optimization, correctness, code_quality,
    testing, complexity_reasoning, communication, independence,
    overall_score, strengths, improvements
  ) values (
    owned_interview.id, current_user_id, problem_record.primary_topic_id,
    problem_understanding_score, clarification_score, approach_score,
    optimization_score, correctness_score, code_quality_score, testing_score,
    complexity_score, communication_score, independence_score,
    overall_result, strengths_value, improvements_value
  );

  update public.mock_interviews
  set status = 'completed', phase = 'completed', result = p_result,
    retrospective = trim(p_retrospective),
    elapsed_seconds = greatest(elapsed_seconds, p_elapsed_seconds),
    timer_running = false, completed_at = now()
  where id = owned_interview.id;

  select * into previous_mastery from public.topic_mastery
  where user_id = current_user_id and topic_id = problem_record.primary_topic_id;
  new_correctness := round(coalesce(previous_mastery.correctness_score, 35) * 0.80 + correctness_score * 20 * 0.20, 2);
  new_independence := round(coalesce(previous_mastery.independence_score, 35) * 0.80 + independence_score * 20 * 0.20, 2);
  new_recognition := round(coalesce(previous_mastery.recognition_score, 35) * 0.80 + ((problem_understanding_score + approach_score) / 2.0) * 20 * 0.20, 2);
  new_retention := coalesce(previous_mastery.retention_score, 35);
  new_complexity := round(coalesce(previous_mastery.complexity_score, 35) * 0.80 + complexity_score * 20 * 0.20, 2);
  new_speed := round(coalesce(previous_mastery.speed_score, 35) * 0.80
    + case when p_elapsed_seconds <= owned_interview.duration_minutes * 60 then 80 else 50 end * 0.20, 2);
  new_overall := round(
    new_correctness * 0.30 + new_independence * 0.30
      + new_recognition * 0.15 + new_retention * 0.10
      + new_complexity * 0.10 + new_speed * 0.05,
    2
  );

  insert into public.topic_mastery (
    user_id, topic_id, overall_score, correctness_score, independence_score,
    recognition_score, retention_score, speed_score, complexity_score,
    mock_interview_count, last_interviewed_at
  ) values (
    current_user_id, problem_record.primary_topic_id, new_overall,
    new_correctness, new_independence, new_recognition, new_retention,
    new_speed, new_complexity, 1, now()
  )
  on conflict (user_id, topic_id) do update set
    overall_score = excluded.overall_score,
    correctness_score = excluded.correctness_score,
    independence_score = excluded.independence_score,
    recognition_score = excluded.recognition_score,
    retention_score = excluded.retention_score,
    speed_score = excluded.speed_score,
    complexity_score = excluded.complexity_score,
    mock_interview_count = public.topic_mastery.mock_interview_count + 1,
    last_interviewed_at = excluded.last_interviewed_at;
end;
$$;

create function public.abandon_mock_interview(p_mock_interview_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
begin
  if current_user_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;
  update public.mock_interviews
  set status = 'abandoned', result = 'abandoned', timer_running = false,
    elapsed_seconds = greatest(
      elapsed_seconds,
      least(14400, floor(extract(epoch from (now() - started_at)))::integer)
    ),
    completed_at = now()
  where id = p_mock_interview_id and user_id = current_user_id and status = 'active';
  if not found then
    raise exception 'Active mock interview not found.' using errcode = '42501';
  end if;
end;
$$;

alter table public.mock_interviews enable row level security;
alter table public.mock_interviews force row level security;
alter table public.mock_interview_scorecards enable row level security;
alter table public.mock_interview_scorecards force row level security;

revoke all on table public.mock_interviews from anon, authenticated;
revoke all on table public.mock_interview_scorecards from anon, authenticated;
grant select on table public.mock_interviews to authenticated;
grant select on table public.mock_interview_scorecards to authenticated;

create policy "Learners can read their own mock interviews"
  on public.mock_interviews for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Learners can read their own interview scorecards"
  on public.mock_interview_scorecards for select to authenticated
  using ((select auth.uid()) = user_id);

revoke all on function public.mock_interview_evidence_score(text, integer, integer) from public;
revoke all on function public.prevent_practice_during_mock_interview() from public;
revoke all on function public.start_mock_interview(uuid, integer, text) from public;
revoke all on function public.advance_mock_interview(uuid, text, jsonb, integer) from public;
revoke all on function public.complete_mock_interview(uuid, text, integer, integer, integer, integer, text, integer) from public;
revoke all on function public.abandon_mock_interview(uuid) from public;
grant execute on function public.start_mock_interview(uuid, integer, text) to authenticated;
grant execute on function public.advance_mock_interview(uuid, text, jsonb, integer) to authenticated;
grant execute on function public.complete_mock_interview(uuid, text, integer, integer, integer, integer, text, integer) to authenticated;
grant execute on function public.abandon_mock_interview(uuid) to authenticated;
