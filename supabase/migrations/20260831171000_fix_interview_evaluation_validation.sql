create or replace function public.finalize_mock_interview_evaluation(
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
  dimension_key_count integer;
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
    select count(*) into dimension_key_count
    from jsonb_object_keys(coalesce(p_dimensions, '{}'::jsonb));
    if p_raw_score not between 0 and 100
      or p_confidence not between 0 and 1
      or char_length(trim(coalesce(p_summary, ''))) not between 10 and 2000
      or jsonb_typeof(p_dimensions) <> 'object'
      or dimension_key_count <> 10
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
