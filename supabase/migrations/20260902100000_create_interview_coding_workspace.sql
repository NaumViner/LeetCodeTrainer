alter table public.mock_interviews
  add column scratchpad text,
  add column workspace_version integer not null default 0,
  add column workspace_updated_at timestamptz,
  add column code_updated_at timestamptz,
  add column code_submitted_at timestamptz,
  add constraint mock_interviews_scratchpad_check
    check (scratchpad is null or char_length(scratchpad) between 1 and 50000),
  add constraint mock_interviews_workspace_version_check
    check (workspace_version >= 0);

create table public.mock_interview_code_submissions (
  id uuid primary key default gen_random_uuid(),
  mock_interview_id uuid not null
    references public.mock_interviews (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  snapshot_version integer not null check (snapshot_version > 0),
  coding_language text not null check (coding_language in ('python', 'java')),
  phase text not null check (phase = 'implementation'),
  submission_kind text not null check (submission_kind in ('review', 'completed')),
  code_snapshot text not null check (char_length(code_snapshot) between 1 and 50000),
  elapsed_seconds integer not null check (elapsed_seconds between 0 and 14400),
  submitted_at timestamptz not null default now(),
  unique (mock_interview_id, snapshot_version)
);

create index mock_interview_code_submissions_interview_idx
  on public.mock_interview_code_submissions
    (mock_interview_id, submitted_at desc);

alter table public.mock_interview_code_submissions enable row level security;
alter table public.mock_interview_code_submissions force row level security;
revoke all on table public.mock_interview_code_submissions
  from anon, authenticated;
grant select on table public.mock_interview_code_submissions to authenticated;

create policy mock_interview_code_submissions_select_own
  on public.mock_interview_code_submissions
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create function public.save_mock_interview_workspace(
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
    or char_length(coalesce(p_scratchpad, '')) > 50000
    or char_length(coalesce(p_code_snapshot, '')) > 50000 then
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

create function public.submit_mock_interview_code(
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
    or char_length(coalesce(p_scratchpad, '')) > 50000
    or nullif(trim(coalesce(normalized_code, '')), '') is null
    or char_length(normalized_code) > 50000 then
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

revoke all on function public.save_mock_interview_workspace(
  uuid, integer, text, text
) from public;
revoke all on function public.submit_mock_interview_code(
  uuid, integer, text, text, integer, boolean
) from public;
grant execute on function public.save_mock_interview_workspace(
  uuid, integer, text, text
) to authenticated;
grant execute on function public.submit_mock_interview_code(
  uuid, integer, text, text, integer, boolean
) to authenticated;
