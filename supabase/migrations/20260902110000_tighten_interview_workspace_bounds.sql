alter table public.mock_interviews
  drop constraint mock_interviews_scratchpad_check,
  add constraint mock_interviews_scratchpad_check
    check (scratchpad is null or char_length(scratchpad) between 1 and 10000),
  add constraint mock_interviews_workspace_code_check
    check (
      workspace_updated_at is null
      or code_snapshot is null
      or char_length(code_snapshot) between 1 and 30000
    );

alter table public.mock_interview_code_submissions
  drop constraint mock_interview_code_submissions_code_snapshot_check,
  add constraint mock_interview_code_submissions_code_snapshot_check
    check (char_length(code_snapshot) between 1 and 30000);

create or replace function public.save_mock_interview_workspace(
  p_mock_interview_id uuid,
  p_expected_version integer,
  p_scratchpad text,
  p_code_snapshot text
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  owned_interview public.mock_interviews%rowtype;
  next_version integer;
  normalized_scratchpad text := nullif(p_scratchpad, '');
  normalized_code text := nullif(p_code_snapshot, '');
begin
  if current_user_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;
  if p_expected_version < 0
    or char_length(coalesce(p_scratchpad, '')) > 10000
    or char_length(coalesce(p_code_snapshot, '')) > 30000 then
    raise exception 'Interview workspace content is invalid.';
  end if;

  select * into owned_interview
  from public.mock_interviews
  where id = p_mock_interview_id and user_id = current_user_id
  for update;
  if not found or owned_interview.status <> 'active' then
    raise exception 'Active mock interview not found.' using errcode = '42501';
  end if;
  if owned_interview.workspace_version <> p_expected_version then
    raise exception 'Interview workspace version conflict.' using errcode = '40001';
  end if;

  next_version := owned_interview.workspace_version + 1;
  update public.mock_interviews
  set scratchpad = normalized_scratchpad,
    code_snapshot = normalized_code,
    workspace_version = next_version,
    workspace_updated_at = now(),
    code_updated_at = case
      when code_snapshot is distinct from normalized_code then now()
      else code_updated_at
    end
  where id = owned_interview.id;

  return next_version;
end;
$$;

create or replace function public.submit_mock_interview_code(
  p_mock_interview_id uuid,
  p_expected_version integer,
  p_scratchpad text,
  p_code_snapshot text,
  p_elapsed_seconds integer,
  p_advance_to_testing boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  owned_interview public.mock_interviews%rowtype;
  next_version integer;
  submission_id uuid;
  submitted_at_value timestamptz := now();
  effective_elapsed integer;
  normalized_scratchpad text := nullif(p_scratchpad, '');
  normalized_code text := nullif(p_code_snapshot, '');
begin
  if current_user_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;
  if p_expected_version < 0
    or p_elapsed_seconds not between 0 and 14400
    or char_length(coalesce(p_scratchpad, '')) > 10000
    or nullif(trim(coalesce(normalized_code, '')), '') is null
    or char_length(normalized_code) > 30000 then
    raise exception 'Interview code submission is invalid.';
  end if;

  select * into owned_interview
  from public.mock_interviews
  where id = p_mock_interview_id and user_id = current_user_id
  for update;
  if not found or owned_interview.status <> 'active' then
    raise exception 'Active mock interview not found.' using errcode = '42501';
  end if;
  if owned_interview.phase <> 'implementation' then
    raise exception 'Code may be submitted only during implementation.';
  end if;
  if owned_interview.workspace_version <> p_expected_version then
    raise exception 'Interview workspace version conflict.' using errcode = '40001';
  end if;
  if p_elapsed_seconds < owned_interview.elapsed_seconds then
    raise exception 'Interview elapsed time is invalid.';
  end if;
  if (
    select count(*)
    from public.mock_interview_code_submissions
    where mock_interview_id = owned_interview.id
  ) >= 20 then
    raise exception 'Interview code submission limit reached.';
  end if;

  next_version := owned_interview.workspace_version + 1;
  effective_elapsed := greatest(
    owned_interview.elapsed_seconds,
    p_elapsed_seconds,
    least(
      14400,
      floor(extract(epoch from (now() - owned_interview.started_at)))::integer
    )
  );
  update public.mock_interviews
  set scratchpad = normalized_scratchpad,
    code_snapshot = normalized_code,
    workspace_version = next_version,
    workspace_updated_at = submitted_at_value,
    code_updated_at = submitted_at_value,
    code_submitted_at = submitted_at_value,
    elapsed_seconds = effective_elapsed,
    phase = case when p_advance_to_testing then 'testing' else phase end
  where id = owned_interview.id;

  insert into public.mock_interview_code_submissions (
    mock_interview_id,
    user_id,
    snapshot_version,
    coding_language,
    phase,
    submission_kind,
    code_snapshot,
    elapsed_seconds,
    submitted_at
  ) values (
    owned_interview.id,
    current_user_id,
    next_version,
    owned_interview.coding_language,
    'implementation',
    case when p_advance_to_testing then 'completed' else 'review' end,
    normalized_code,
    effective_elapsed,
    submitted_at_value
  ) returning id into submission_id;

  return jsonb_build_object(
    'submissionId', submission_id,
    'workspaceVersion', next_version,
    'submittedAt', submitted_at_value,
    'advancedToTesting', p_advance_to_testing
  );
end;
$$;
