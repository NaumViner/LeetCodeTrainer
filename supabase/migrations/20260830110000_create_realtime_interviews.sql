create table public.realtime_interview_sessions (
  id uuid primary key default gen_random_uuid(),
  mock_interview_id uuid not null unique
    references public.mock_interviews (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null check (char_length(provider) between 1 and 40),
  model text not null check (char_length(model) between 1 and 120),
  provider_call_id text check (
    provider_call_id is null or char_length(provider_call_id) between 1 and 255
  ),
  status text not null default 'active'
    check (status in ('active', 'disconnected', 'completed', 'error')),
  summary text check (summary is null or char_length(summary) between 1 and 2000),
  connected_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (status = 'active' and ended_at is null)
    or (status <> 'active' and ended_at is not null)
  )
);

create table public.realtime_interview_events (
  id bigint generated always as identity primary key,
  session_id uuid not null
    references public.realtime_interview_sessions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  event_type text not null check (event_type in (
    'user_transcript', 'assistant_transcript', 'code_snapshot',
    'phase_context', 'connection'
  )),
  phase text check (phase is null or phase in (
    'intro', 'clarify', 'examples', 'brute_force', 'optimization',
    'implementation', 'testing', 'complexity', 'retrospective'
  )),
  content text not null,
  created_at timestamptz not null default now(),
  check (
    char_length(content) between 1 and
      case when event_type = 'code_snapshot' then 50000 else 8000 end
  )
);

create index realtime_interview_sessions_user_created_idx
  on public.realtime_interview_sessions (user_id, created_at desc);
create index realtime_interview_events_session_created_idx
  on public.realtime_interview_events (session_id, created_at, id);

create trigger realtime_interview_sessions_set_updated_at
before update on public.realtime_interview_sessions
for each row execute procedure public.set_updated_at();

create function public.begin_realtime_interview_session(
  p_mock_interview_id uuid,
  p_provider text,
  p_model text,
  p_provider_call_id text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  realtime_session_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;
  if char_length(trim(coalesce(p_provider, ''))) not between 1 and 40
    or char_length(trim(coalesce(p_model, ''))) not between 1 and 120
    or char_length(coalesce(p_provider_call_id, '')) > 255 then
    raise exception 'Realtime provider metadata is invalid.';
  end if;
  if not exists (
    select 1 from public.mock_interviews
    where id = p_mock_interview_id
      and user_id = current_user_id
      and status = 'active'
  ) then
    raise exception 'Active mock interview not found.' using errcode = '42501';
  end if;

  insert into public.realtime_interview_sessions (
    mock_interview_id, user_id, provider, model, provider_call_id
  ) values (
    p_mock_interview_id, current_user_id, trim(p_provider), trim(p_model),
    nullif(trim(p_provider_call_id), '')
  )
  on conflict (mock_interview_id) do update set
    provider = excluded.provider,
    model = excluded.model,
    provider_call_id = excluded.provider_call_id,
    status = 'active',
    summary = null,
    connected_at = now(),
    ended_at = null
  where public.realtime_interview_sessions.user_id = current_user_id
  returning id into realtime_session_id;

  if realtime_session_id is null then
    raise exception 'Realtime interview session is unavailable.' using errcode = '42501';
  end if;
  return realtime_session_id;
end;
$$;

create function public.append_realtime_interview_event(
  p_mock_interview_id uuid,
  p_event_type text,
  p_phase text,
  p_content text
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  owned_session public.realtime_interview_sessions%rowtype;
  event_id bigint;
  content_limit integer;
begin
  if current_user_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;
  if p_event_type not in (
    'user_transcript', 'assistant_transcript', 'code_snapshot',
    'phase_context', 'connection'
  ) then
    raise exception 'Realtime interview event type is invalid.';
  end if;
  if p_phase is not null and p_phase not in (
    'intro', 'clarify', 'examples', 'brute_force', 'optimization',
    'implementation', 'testing', 'complexity', 'retrospective'
  ) then
    raise exception 'Realtime interview phase is invalid.';
  end if;
  content_limit := case when p_event_type = 'code_snapshot' then 50000 else 8000 end;
  if char_length(trim(coalesce(p_content, ''))) not between 1 and content_limit then
    raise exception 'Realtime interview event content is invalid.';
  end if;

  select session.* into owned_session
  from public.realtime_interview_sessions as session
  join public.mock_interviews as interview
    on interview.id = session.mock_interview_id
  where session.mock_interview_id = p_mock_interview_id
    and session.user_id = current_user_id
    and session.status = 'active'
    and interview.user_id = current_user_id
    and interview.status = 'active'
  for update of session;
  if not found then
    raise exception 'Active realtime interview session not found.' using errcode = '42501';
  end if;

  insert into public.realtime_interview_events (
    session_id, user_id, event_type, phase, content
  ) values (
    owned_session.id, current_user_id, p_event_type, p_phase, trim(p_content)
  ) returning id into event_id;
  return event_id;
end;
$$;

create function public.end_realtime_interview_session(
  p_mock_interview_id uuid,
  p_status text,
  p_summary text default null
)
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
  if p_status not in ('disconnected', 'error')
    or char_length(coalesce(p_summary, '')) > 2000 then
    raise exception 'Realtime session completion is invalid.';
  end if;
  update public.realtime_interview_sessions
  set status = p_status,
      summary = nullif(trim(p_summary), ''),
      ended_at = now()
  where mock_interview_id = p_mock_interview_id
    and user_id = current_user_id
    and status = 'active';
  if not found then
    raise exception 'Active realtime interview session not found.' using errcode = '42501';
  end if;
end;
$$;

create function public.sync_realtime_interview_completion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status = 'active' and new.status in ('completed', 'abandoned') then
    update public.realtime_interview_sessions as session
    set status = case when new.status = 'completed' then 'completed' else 'disconnected' end,
        ended_at = coalesce(session.ended_at, now()),
        summary = coalesce(
          session.summary,
          (
            select pg_catalog.format(
              'Voice interview saved with %s learner turns, %s interviewer turns, and %s context updates.',
              count(*) filter (where event_type = 'user_transcript'),
              count(*) filter (where event_type = 'assistant_transcript'),
              count(*) filter (where event_type in ('code_snapshot', 'phase_context'))
            )
            from public.realtime_interview_events
            where session_id = session.id
          )
        )
    where session.mock_interview_id = new.id and session.status = 'active';
  end if;
  return new;
end;
$$;

create trigger mock_interviews_sync_realtime_completion
after update of status on public.mock_interviews
for each row execute procedure public.sync_realtime_interview_completion();

alter table public.realtime_interview_sessions enable row level security;
alter table public.realtime_interview_sessions force row level security;
alter table public.realtime_interview_events enable row level security;
alter table public.realtime_interview_events force row level security;

revoke all on table public.realtime_interview_sessions from anon, authenticated;
revoke all on table public.realtime_interview_events from anon, authenticated;
grant select on table public.realtime_interview_sessions to authenticated;
grant select on table public.realtime_interview_events to authenticated;

create policy realtime_interview_sessions_select_own
  on public.realtime_interview_sessions for select to authenticated
  using ((select auth.uid()) = user_id);
create policy realtime_interview_events_select_own
  on public.realtime_interview_events for select to authenticated
  using ((select auth.uid()) = user_id);

revoke all on function public.begin_realtime_interview_session(uuid, text, text, text) from public;
revoke all on function public.append_realtime_interview_event(uuid, text, text, text) from public;
revoke all on function public.end_realtime_interview_session(uuid, text, text) from public;
revoke all on function public.sync_realtime_interview_completion() from public;
grant execute on function public.begin_realtime_interview_session(uuid, text, text, text) to authenticated;
grant execute on function public.append_realtime_interview_event(uuid, text, text, text) to authenticated;
grant execute on function public.end_realtime_interview_session(uuid, text, text) to authenticated;
