create table public.mock_interview_evaluations (
  id uuid primary key default gen_random_uuid(),
  mock_interview_id uuid not null
    references public.mock_interviews (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  version integer not null check (version between 1 and 1000),
  is_current boolean not null default true,
  status text not null default 'pending'
    check (status in ('pending', 'completed', 'provisional', 'failed')),
  provider text not null check (char_length(provider) between 1 and 40),
  model text not null check (char_length(model) between 1 and 120),
  evaluation_version integer not null check (evaluation_version between 0 and 1000),
  evidence_version integer not null check (evidence_version between 0 and 1000),
  raw_score numeric(5, 2) check (raw_score between 0 and 100),
  confidence numeric(4, 3) check (confidence between 0 and 1),
  summary text check (summary is null or char_length(summary) between 10 and 2000),
  dimensions jsonb,
  strengths text[] not null default '{}',
  improvements text[] not null default '{}',
  recurring_signals text[] not null default '{}',
  recommended_actions jsonb,
  evidence_coverage jsonb,
  error_code text check (error_code is null or char_length(error_code) between 1 and 120),
  input_tokens integer not null default 0 check (input_tokens between 0 and 10000000),
  output_tokens integer not null default 0 check (output_tokens between 0 and 10000000),
  total_tokens integer not null default 0 check (total_tokens between 0 and 10000000),
  source_difficulty text not null check (source_difficulty in ('easy', 'medium', 'hard')),
  source_duration_minutes integer not null check (source_duration_minutes in (30, 45, 60)),
  source_interviewer_level text not null
    check (source_interviewer_level in ('beginner', 'faang_tough')),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (mock_interview_id, version),
  check (cardinality(strengths) <= 6),
  check (cardinality(improvements) <= 6),
  check (cardinality(recurring_signals) <= 6),
  check (dimensions is null or octet_length(dimensions::text) <= 65536),
  check (recommended_actions is null or octet_length(recommended_actions::text) <= 32768),
  check (evidence_coverage is null or octet_length(evidence_coverage::text) <= 16384),
  check (
    (status = 'pending' and completed_at is null and raw_score is null
      and confidence is null and summary is null and dimensions is null
      and recommended_actions is null)
    or (status in ('completed', 'provisional') and completed_at is not null
      and raw_score is not null and confidence is not null and summary is not null
      and dimensions is not null and recommended_actions is not null
      and evidence_coverage is not null)
    or (status = 'failed' and completed_at is not null and error_code is not null
      and raw_score is null and confidence is null and summary is null
      and dimensions is null and recommended_actions is null)
  )
);

create unique index mock_interview_evaluations_one_current_idx
  on public.mock_interview_evaluations (mock_interview_id)
  where is_current;
create index mock_interview_evaluations_user_created_idx
  on public.mock_interview_evaluations (user_id, created_at desc);

create function public.prevent_finalized_interview_evaluation_update()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if old.status <> 'pending' then
    raise exception 'Completed interview evaluations are immutable.';
  end if;
  return new;
end;
$$;

create trigger mock_interview_evaluations_immutable_final
before update on public.mock_interview_evaluations
for each row execute procedure public.prevent_finalized_interview_evaluation_update();

create function public.reserve_mock_interview_evaluation(
  p_mock_interview_id uuid,
  p_provider text,
  p_model text,
  p_evaluation_version integer,
  p_evidence_version integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  interview_record record;
  existing_record public.mock_interview_evaluations%rowtype;
  evaluation_id uuid;
  next_version integer;
begin
  if current_user_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;
  if char_length(trim(coalesce(p_provider, ''))) not between 1 and 40
    or char_length(trim(coalesce(p_model, ''))) not between 1 and 120
    or p_evaluation_version not between 1 and 1000
    or p_evidence_version not between 1 and 1000 then
    raise exception 'Interview evaluation reservation is invalid.';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('interview-evaluation:' || p_mock_interview_id::text, 0)
  );
  select interview.id, interview.duration_minutes, interview.interviewer_level,
      problem.difficulty
    into interview_record
  from public.mock_interviews as interview
  join public.problems as problem on problem.id = interview.problem_id
  where interview.id = p_mock_interview_id
    and interview.user_id = current_user_id
    and interview.status = 'completed';
  if not found then
    raise exception 'Completed mock interview not found.' using errcode = '42501';
  end if;

  select * into existing_record
  from public.mock_interview_evaluations
  where mock_interview_id = p_mock_interview_id and is_current;
  if found then
    return jsonb_build_object(
      'evaluationId', existing_record.id,
      'shouldEvaluate', existing_record.status = 'pending',
      'status', existing_record.status,
      'version', existing_record.version
    );
  end if;

  select coalesce(max(version), 0) + 1 into next_version
  from public.mock_interview_evaluations
  where mock_interview_id = p_mock_interview_id;
  insert into public.mock_interview_evaluations (
    mock_interview_id, user_id, version, provider, model,
    evaluation_version, evidence_version, source_difficulty,
    source_duration_minutes, source_interviewer_level
  ) values (
    p_mock_interview_id, current_user_id, next_version, trim(p_provider), trim(p_model),
    p_evaluation_version, p_evidence_version, interview_record.difficulty,
    interview_record.duration_minutes, interview_record.interviewer_level
  ) returning id into evaluation_id;

  return jsonb_build_object(
    'evaluationId', evaluation_id,
    'shouldEvaluate', true,
    'status', 'pending',
    'version', next_version
  );
end;
$$;

create function public.finalize_mock_interview_evaluation(
  p_evaluation_id uuid,
  p_status text,
  p_raw_score numeric,
  p_confidence numeric,
  p_summary text,
  p_dimensions jsonb,
  p_strengths text[],
  p_improvements text[],
  p_recurring_signals text[],
  p_recommended_actions jsonb,
  p_evidence_coverage jsonb,
  p_input_tokens integer,
  p_output_tokens integer,
  p_total_tokens integer,
  p_error_code text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  dimension_name text;
  dimension_value jsonb;
  evidence_value jsonb;
  dimension_names constant text[] := array[
    'problemUnderstanding', 'clarification', 'approachQuality', 'optimization',
    'correctness', 'codeQuality', 'testing', 'complexityReasoning',
    'communication', 'independence'
  ];
begin
  if current_user_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;
  if p_status not in ('completed', 'provisional', 'failed')
    or p_input_tokens not between 0 and 10000000
    or p_output_tokens not between 0 and 10000000
    or p_total_tokens not between 0 and 10000000
    or p_total_tokens < greatest(p_input_tokens, p_output_tokens)
    or char_length(coalesce(p_error_code, '')) > 120 then
    raise exception 'Interview evaluation result is invalid.';
  end if;

  if p_status = 'failed' then
    if nullif(trim(coalesce(p_error_code, '')), '') is null then
      raise exception 'Failed interview evaluation requires an error code.';
    end if;
  else
    if p_raw_score not between 0 and 100
      or p_confidence not between 0 and 1
      or char_length(trim(coalesce(p_summary, ''))) not between 10 and 2000
      or jsonb_typeof(p_dimensions) <> 'object'
      or jsonb_object_length(p_dimensions) <> 10
      or octet_length(p_dimensions::text) > 65536
      or cardinality(coalesce(p_strengths, '{}')) > 6
      or cardinality(coalesce(p_improvements, '{}')) not between 1 and 6
      or cardinality(coalesce(p_recurring_signals, '{}')) > 6
      or jsonb_typeof(p_recommended_actions) <> 'array'
      or jsonb_array_length(p_recommended_actions) not between 1 and 6
      or octet_length(p_recommended_actions::text) > 32768
      or jsonb_typeof(p_evidence_coverage) <> 'object'
      or octet_length(p_evidence_coverage::text) > 16384 then
      raise exception 'Completed interview evaluation payload is invalid.';
    end if;
    if exists (
      select 1 from unnest(
        coalesce(p_strengths, '{}') || coalesce(p_improvements, '{}')
          || coalesce(p_recurring_signals, '{}')
      ) as item
      where char_length(trim(item)) not between 3 and 300
    ) then
      raise exception 'Interview evaluation text arrays are invalid.';
    end if;

    foreach dimension_name in array dimension_names loop
      dimension_value := p_dimensions -> dimension_name;
      if dimension_value is null
        or jsonb_typeof(dimension_value) <> 'object'
        or (dimension_value ->> 'score') !~ '^[1-5]$'
        or (dimension_value ->> 'confidence') !~ '^(0(\.[0-9]+)?|1(\.0+)?)$'
        or (dimension_value ->> 'confidence')::numeric not between 0 and 1
        or char_length(trim(coalesce(dimension_value ->> 'rationale', ''))) not between 10 and 1000
        or jsonb_typeof(dimension_value -> 'evidence') <> 'array'
        or jsonb_array_length(dimension_value -> 'evidence') not between 1 and 5 then
        raise exception 'Interview evaluation dimension is invalid.';
      end if;
      for evidence_value in
        select value from jsonb_array_elements(dimension_value -> 'evidence')
      loop
        if evidence_value ->> 'source' not in (
          'transcript', 'code', 'phase_note', 'timing', 'test'
        ) or char_length(trim(coalesce(evidence_value ->> 'reference', ''))) not between 3 and 300 then
          raise exception 'Interview evaluation evidence reference is invalid.';
        end if;
      end loop;
    end loop;
  end if;

  update public.mock_interview_evaluations
  set status = p_status,
    raw_score = case when p_status = 'failed' then null else p_raw_score end,
    confidence = case when p_status = 'failed' then null else p_confidence end,
    summary = case when p_status = 'failed' then null else trim(p_summary) end,
    dimensions = case when p_status = 'failed' then null else p_dimensions end,
    strengths = case when p_status = 'failed' then '{}' else coalesce(p_strengths, '{}') end,
    improvements = case when p_status = 'failed' then '{}' else coalesce(p_improvements, '{}') end,
    recurring_signals = case when p_status = 'failed' then '{}' else coalesce(p_recurring_signals, '{}') end,
    recommended_actions = case when p_status = 'failed' then null else p_recommended_actions end,
    evidence_coverage = case when p_status = 'failed' then null else p_evidence_coverage end,
    input_tokens = p_input_tokens,
    output_tokens = p_output_tokens,
    total_tokens = p_total_tokens,
    error_code = nullif(trim(coalesce(p_error_code, '')), ''),
    completed_at = now()
  where id = p_evaluation_id and user_id = current_user_id and status = 'pending';
  if not found then
    raise exception 'Pending interview evaluation not found.' using errcode = '42501';
  end if;
end;
$$;

insert into public.mock_interview_evaluations (
  mock_interview_id, user_id, version, is_current, status, provider, model,
  evaluation_version, evidence_version, raw_score, confidence, summary,
  dimensions, strengths, improvements, recurring_signals,
  recommended_actions, evidence_coverage, error_code,
  source_difficulty, source_duration_minutes, source_interviewer_level,
  created_at, completed_at
)
select scorecard.mock_interview_id, scorecard.user_id, 1, true, 'provisional',
  'legacy', 'deterministic-scorecard-v1', 0, 0, scorecard.overall_score, 0.150,
  'Legacy deterministic scorecard retained for history; evidence-linked evaluation was not available.',
  jsonb_build_object(
    'problemUnderstanding', jsonb_build_object('score', scorecard.problem_understanding, 'confidence', 0, 'rationale', 'Legacy score without source-linked rationale.', 'evidence', '[]'::jsonb),
    'clarification', jsonb_build_object('score', scorecard.clarification, 'confidence', 0, 'rationale', 'Legacy score without source-linked rationale.', 'evidence', '[]'::jsonb),
    'approachQuality', jsonb_build_object('score', scorecard.approach_quality, 'confidence', 0, 'rationale', 'Legacy score without source-linked rationale.', 'evidence', '[]'::jsonb),
    'optimization', jsonb_build_object('score', scorecard.optimization, 'confidence', 0, 'rationale', 'Legacy score without source-linked rationale.', 'evidence', '[]'::jsonb),
    'correctness', jsonb_build_object('score', scorecard.correctness, 'confidence', 0, 'rationale', 'Legacy score without trusted correctness evidence.', 'evidence', '[]'::jsonb),
    'codeQuality', jsonb_build_object('score', scorecard.code_quality, 'confidence', 0, 'rationale', 'Legacy score without source-linked rationale.', 'evidence', '[]'::jsonb),
    'testing', jsonb_build_object('score', scorecard.testing, 'confidence', 0, 'rationale', 'Legacy score without source-linked rationale.', 'evidence', '[]'::jsonb),
    'complexityReasoning', jsonb_build_object('score', scorecard.complexity_reasoning, 'confidence', 0, 'rationale', 'Legacy score without source-linked rationale.', 'evidence', '[]'::jsonb),
    'communication', jsonb_build_object('score', scorecard.communication, 'confidence', 0, 'rationale', 'Legacy score without source-linked rationale.', 'evidence', '[]'::jsonb),
    'independence', jsonb_build_object('score', scorecard.independence, 'confidence', 0, 'rationale', 'Legacy score without source-linked rationale.', 'evidence', '[]'::jsonb)
  ),
  scorecard.strengths, scorecard.improvements, '{}', '[]'::jsonb,
  jsonb_build_object('legacy', true, 'semanticCorrectness', 'unsupported'),
  'legacy_backfill', problem.difficulty, interview.duration_minutes,
  interview.interviewer_level, scorecard.created_at, scorecard.created_at
from public.mock_interview_scorecards as scorecard
join public.mock_interviews as interview on interview.id = scorecard.mock_interview_id
join public.problems as problem on problem.id = interview.problem_id
where not exists (
  select 1 from public.mock_interview_evaluations as evaluation
  where evaluation.mock_interview_id = scorecard.mock_interview_id
);

alter table public.mock_interview_evaluations enable row level security;
alter table public.mock_interview_evaluations force row level security;

revoke all on table public.mock_interview_evaluations from anon, authenticated;
grant select on table public.mock_interview_evaluations to authenticated;

create policy mock_interview_evaluations_select_own
  on public.mock_interview_evaluations for select to authenticated
  using ((select auth.uid()) = user_id);

revoke all on function public.prevent_finalized_interview_evaluation_update() from public;
revoke all on function public.reserve_mock_interview_evaluation(uuid, text, text, integer, integer) from public;
revoke all on function public.finalize_mock_interview_evaluation(uuid, text, numeric, numeric, text, jsonb, text[], text[], text[], jsonb, jsonb, integer, integer, integer, text) from public;
grant execute on function public.reserve_mock_interview_evaluation(uuid, text, text, integer, integer) to authenticated;
grant execute on function public.finalize_mock_interview_evaluation(uuid, text, numeric, numeric, text, jsonb, text[], text[], text[], jsonb, jsonb, integer, integer, integer, text) to authenticated;
