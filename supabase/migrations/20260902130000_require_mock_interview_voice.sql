alter table public.mock_interviews
  add column voice_required boolean,
  add column voice_activated_at timestamptz,
  add column voice_last_heartbeat_at timestamptz,
  add column voice_activation_deadline timestamptz;

update public.mock_interviews
set voice_required = false
where voice_required is null;

alter table public.mock_interviews
  alter column voice_required set default true,
  alter column voice_required set not null,
  add constraint mock_interviews_voice_activation_check check (
    not voice_required
    or voice_activated_at is null
    or voice_last_heartbeat_at is not null
  );

create function public.initialize_voice_required_mock_interview()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.voice_required := true;
  new.voice_activated_at := null;
  new.voice_last_heartbeat_at := null;
  new.voice_activation_deadline := now() + interval '5 minutes';
  new.started_at := now();
  new.elapsed_seconds := 0;
  new.timer_running := false;
  return new;
end;
$$;

create trigger mock_interviews_initialize_required_voice
before insert on public.mock_interviews
for each row execute procedure public.initialize_voice_required_mock_interview();

create function public.enforce_mock_interview_voice_lease()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not old.voice_required or new.status = 'abandoned' then
    return new;
  end if;
  if (new.phase is distinct from old.phase or new.status is distinct from old.status)
    and (
      old.voice_activated_at is null
      or old.voice_last_heartbeat_at is null
      or old.voice_last_heartbeat_at < now() - interval '90 seconds'
    ) then
    raise exception 'A current live voice connection is required.'
      using errcode = '55000';
  end if;
  return new;
end;
$$;

create trigger mock_interviews_require_voice_lease
before update of phase, status on public.mock_interviews
for each row execute procedure public.enforce_mock_interview_voice_lease();

create function public.enforce_code_submission_voice_lease()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.mock_interviews as interview
    where interview.id = new.mock_interview_id
      and interview.voice_required
      and (
        interview.voice_activated_at is null
        or interview.voice_last_heartbeat_at is null
        or interview.voice_last_heartbeat_at < now() - interval '90 seconds'
      )
  ) then
    raise exception 'A current live voice connection is required.'
      using errcode = '55000';
  end if;
  return new;
end;
$$;

create trigger mock_interview_code_submissions_require_voice
before insert on public.mock_interview_code_submissions
for each row execute procedure public.enforce_code_submission_voice_lease();

create function public.activate_voice_mock_interview(p_mock_interview_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  owned_interview public.mock_interviews%rowtype;
begin
  if current_user_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  select * into owned_interview
  from public.mock_interviews
  where id = p_mock_interview_id and user_id = current_user_id
  for update;
  if not found or owned_interview.status <> 'active'
    or not owned_interview.voice_required then
    raise exception 'Voice-required mock interview not found.' using errcode = '42501';
  end if;
  if owned_interview.voice_activated_at is null
    and owned_interview.voice_activation_deadline < now() then
    raise exception 'Voice activation expired.' using errcode = '55000';
  end if;
  if not exists (
    select 1
    from public.realtime_interview_sessions
    where mock_interview_id = owned_interview.id
      and user_id = current_user_id
      and status = 'active'
  ) then
    raise exception 'Active realtime interview session not found.' using errcode = '42501';
  end if;

  update public.mock_interviews
  set voice_activated_at = coalesce(voice_activated_at, now()),
    voice_last_heartbeat_at = now(),
    started_at = case when voice_activated_at is null then now() else started_at end,
    timer_running = phase <> 'retrospective'
  where id = owned_interview.id
  returning * into owned_interview;

  return jsonb_build_object(
    'elapsedSeconds', owned_interview.elapsed_seconds,
    'startedAt', owned_interview.started_at,
    'timerRunning', owned_interview.timer_running,
    'voiceActivatedAt', owned_interview.voice_activated_at
  );
end;
$$;

create function public.heartbeat_voice_mock_interview(p_mock_interview_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  heartbeat_at timestamptz;
begin
  if current_user_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;
  update public.mock_interviews as interview
  set voice_last_heartbeat_at = now()
  where interview.id = p_mock_interview_id
    and interview.user_id = current_user_id
    and interview.status = 'active'
    and interview.voice_required
    and interview.voice_activated_at is not null
    and exists (
      select 1
      from public.realtime_interview_sessions as session
      where session.mock_interview_id = interview.id
        and session.user_id = current_user_id
        and session.status = 'active'
    )
  returning voice_last_heartbeat_at into heartbeat_at;
  if heartbeat_at is null then
    raise exception 'Active voice interview not found.' using errcode = '42501';
  end if;
  return heartbeat_at;
end;
$$;

create function public.cancel_pending_voice_interview(p_mock_interview_id uuid)
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
  delete from public.mock_interviews
  where id = p_mock_interview_id
    and user_id = current_user_id
    and status = 'active'
    and voice_required
    and voice_activated_at is null;
  if not found then
    raise exception 'Pending voice interview not found.' using errcode = '42501';
  end if;
end;
$$;

revoke all on function public.initialize_voice_required_mock_interview() from public;
revoke all on function public.enforce_mock_interview_voice_lease() from public;
revoke all on function public.enforce_code_submission_voice_lease() from public;
revoke all on function public.activate_voice_mock_interview(uuid) from public;
revoke all on function public.heartbeat_voice_mock_interview(uuid) from public;
revoke all on function public.cancel_pending_voice_interview(uuid) from public;
grant execute on function public.activate_voice_mock_interview(uuid) to authenticated;
grant execute on function public.heartbeat_voice_mock_interview(uuid) to authenticated;
grant execute on function public.cancel_pending_voice_interview(uuid) to authenticated;
