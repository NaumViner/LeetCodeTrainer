alter table public.mock_interview_evaluations
  add column source_interview_language text not null default 'auto'
    check (source_interview_language in ('auto', 'english', 'hebrew'));

create or replace function public.reserve_mock_interview_evaluation(
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
      interview.interview_language, problem.difficulty
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
    source_duration_minutes, source_interviewer_level, source_interview_language
  ) values (
    p_mock_interview_id, current_user_id, next_version, trim(p_provider), trim(p_model),
    p_evaluation_version, p_evidence_version, interview_record.difficulty,
    interview_record.duration_minutes, interview_record.interviewer_level,
    interview_record.interview_language
  ) returning id into evaluation_id;

  return jsonb_build_object(
    'evaluationId', evaluation_id,
    'shouldEvaluate', true,
    'status', 'pending',
    'version', next_version
  );
end;
$$;
