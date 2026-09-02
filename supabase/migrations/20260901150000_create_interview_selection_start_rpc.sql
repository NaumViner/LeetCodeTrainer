create function public.start_mock_interview_v2(
  p_problem_id uuid,
  p_duration_minutes integer,
  p_selection_mode text,
  p_requested_topic_id uuid,
  p_requested_difficulties text[],
  p_selected_topic_id uuid,
  p_selection_algorithm_version integer,
  p_selection_metadata jsonb,
  p_interviewer_level text,
  p_interview_language text,
  p_coding_language text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  new_interview_id uuid;
  selected_problem record;
  stored_difficulty_mode text;
begin
  if current_user_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;
  if p_duration_minutes not in (30, 45, 60) then
    raise exception 'Interview duration must be 30, 45, or 60 minutes.';
  end if;
  if p_selection_mode not in ('coverage', 'improvement', 'learning', 'custom') then
    raise exception 'Interview selection mode is invalid.';
  end if;
  if p_interviewer_level not in ('beginner', 'faang_tough') then
    raise exception 'Interviewer level is invalid.';
  end if;
  if p_interview_language not in ('auto', 'english', 'hebrew') then
    raise exception 'Interview language is invalid.';
  end if;
  if p_coding_language not in ('python', 'java') then
    raise exception 'Coding language is invalid.';
  end if;
  if p_selection_algorithm_version <> 1 then
    raise exception 'Interview selection algorithm version is invalid.';
  end if;
  if not public.valid_interview_difficulty_filter(p_requested_difficulties) then
    raise exception 'Interview difficulty filter is invalid.';
  end if;

  if p_selection_metadata is null
    or jsonb_typeof(p_selection_metadata) <> 'object'
    or octet_length(p_selection_metadata::text) > 4096
    or jsonb_typeof(p_selection_metadata -> 'candidateProblemCount') <> 'number'
    or jsonb_typeof(p_selection_metadata -> 'candidateTopicCount') <> 'number'
    or jsonb_typeof(p_selection_metadata -> 'recencyFallbackUsed') <> 'boolean'
    or jsonb_typeof(p_selection_metadata -> 'repeatFallbackUsed') <> 'boolean'
    or jsonb_typeof(p_selection_metadata -> 'reasons') <> 'array' then
    raise exception 'Interview selection metadata is invalid.';
  end if;
  if not (p_selection_metadata ->> 'candidateProblemCount') ~ '^[0-9]+$'
    or not (p_selection_metadata ->> 'candidateTopicCount') ~ '^[0-9]+$'
    or (p_selection_metadata ->> 'candidateProblemCount')::integer not between 1 and 150
    or (p_selection_metadata ->> 'candidateTopicCount')::integer not between 1 and 18
    or jsonb_array_length(p_selection_metadata -> 'reasons') > 3
    or exists (
      select 1
      from jsonb_array_elements(p_selection_metadata -> 'reasons') as reason
      where jsonb_typeof(reason) <> 'string'
        or char_length(trim(reason #>> '{}')) not between 1 and 240
    ) then
    raise exception 'Interview selection metadata is out of bounds.';
  end if;

  if p_selection_mode = 'custom' then
    if p_requested_topic_id is null
      or p_requested_topic_id <> p_selected_topic_id
      or cardinality(p_requested_difficulties) <> 1 then
      raise exception 'Custom selection requires one matching topic and difficulty.';
    end if;
  elsif p_requested_topic_id is not null then
    raise exception 'Only Custom selection may request an exact topic.';
  end if;
  if p_selection_mode = 'learning'
    and not (
      cardinality(p_requested_difficulties) = 3
      and p_requested_difficulties @> array['easy', 'medium', 'hard']::text[]
    ) then
    raise exception 'Learning selection must keep difficulty adaptive.';
  end if;

  if not exists (
    select 1
    from public.profiles
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

  select
    problem.difficulty,
    membership.primary_topic_id
  into selected_problem
  from public.problem_collection_memberships as membership
  join public.problem_collections as collection
    on collection.id = membership.collection_id
  join public.problems as problem on problem.id = membership.problem_id
  where membership.problem_id = p_problem_id
    and collection.slug = 'neetcode-150'
    and collection.active
    and problem.active;

  if not found then
    raise exception 'The interview problem is unavailable.';
  end if;
  if selected_problem.primary_topic_id <> p_selected_topic_id then
    raise exception 'The selected interview topic does not match the problem.';
  end if;
  if not selected_problem.difficulty = any(p_requested_difficulties) then
    raise exception 'The selected problem does not match the requested difficulty filter.';
  end if;

  stored_difficulty_mode := case
    when p_selection_mode = 'learning' then 'adaptive'
    when cardinality(p_requested_difficulties) = 1
      then p_requested_difficulties[1]
    else 'adaptive'
  end;

  insert into public.mock_interviews (
    user_id,
    problem_id,
    duration_minutes,
    difficulty_mode,
    interviewer_level,
    interview_language,
    selection_mode,
    requested_topic_id,
    requested_difficulties,
    selected_topic_id,
    selection_algorithm_version,
    selection_metadata,
    coding_language
  ) values (
    current_user_id,
    p_problem_id,
    p_duration_minutes,
    stored_difficulty_mode,
    p_interviewer_level,
    p_interview_language,
    p_selection_mode,
    p_requested_topic_id,
    p_requested_difficulties,
    p_selected_topic_id,
    p_selection_algorithm_version,
    p_selection_metadata,
    p_coding_language
  ) returning id into new_interview_id;

  return new_interview_id;
end;
$$;

revoke all on function public.start_mock_interview_v2(
  uuid, integer, text, uuid, text[], uuid, integer, jsonb, text, text, text
) from public;
grant execute on function public.start_mock_interview_v2(
  uuid, integer, text, uuid, text[], uuid, integer, jsonb, text, text, text
) to authenticated;
