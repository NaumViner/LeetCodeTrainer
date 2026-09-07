-- Keep trial accounting separate from deletable interview evidence.
create schema if not exists interview_private;
revoke all on schema interview_private from public, anon, authenticated;

create table interview_private.guest_trials (
  user_id uuid primary key references auth.users(id) on delete cascade,
  reserved_interview_id uuid references public.mock_interviews(id) on delete set null
    deferrable initially deferred,
  consumed_interview_id uuid,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
create table interview_private.interview_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  preferences jsonb not null
);
create table interview_private.voice_requests (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  interview_id uuid not null,
  attempt_id uuid not null,
  duration_minutes integer not null,
  created_at timestamptz not null default now(),
  unique(interview_id, attempt_id)
);
create index voice_requests_user_time on interview_private.voice_requests(user_id, created_at);
create table interview_private.launch_limits (
  id boolean primary key default true check(id),
  starts_enabled boolean not null default true,
  daily_voice_minutes integer not null default 600 check(daily_voice_minutes between 30 and 100000),
  concurrent_voice_sessions integer not null default 5 check(concurrent_voice_sessions between 1 and 1000)
);
insert into interview_private.launch_limits(id) values(true);

alter table interview_private.guest_trials enable row level security;
alter table interview_private.guest_trials force row level security;
alter table interview_private.interview_preferences enable row level security;
alter table interview_private.interview_preferences force row level security;
alter table interview_private.voice_requests enable row level security;
alter table interview_private.voice_requests force row level security;
alter table interview_private.launch_limits enable row level security;
alter table interview_private.launch_limits force row level security;
revoke all on all tables in schema interview_private from public, anon, authenticated;

create function public.is_registered_interview_user()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from auth.users where id = (select auth.uid()) and not is_anonymous)
$$;
revoke all on function public.is_registered_interview_user() from public;
grant execute on function public.is_registered_interview_user() to authenticated;

create function public.enforce_guest_interview_trial()
returns trigger language plpgsql security definer set search_path = '' as $$
declare trial interview_private.guest_trials%rowtype;
begin
  if not exists(select 1 from auth.users where id = new.user_id and is_anonymous) then return new; end if;
  if new.selection_mode <> 'coverage' or new.interview_language not in ('english', 'hebrew') then
    raise exception 'Guest interviews require coverage and an explicit language.' using errcode = '42501';
  end if;
  insert into interview_private.guest_trials(user_id) values(new.user_id) on conflict do nothing;
  select * into trial from interview_private.guest_trials where user_id = new.user_id for update;
  if trial.consumed_at is not null then raise exception 'guest_trial_used' using errcode = '42501'; end if;
  if trial.reserved_interview_id is not null then
    raise exception 'An active mock interview already exists.' using errcode = '55P03';
  end if;
  update interview_private.guest_trials set reserved_interview_id = new.id where user_id = new.user_id;
  return new;
end;
$$;
create trigger mock_interviews_guest_trial before insert on public.mock_interviews
for each row execute function public.enforce_guest_interview_trial();

create function public.consume_guest_interview_trial()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.voice_activated_at is null and new.voice_activated_at is not null then
    update interview_private.guest_trials set consumed_at = coalesce(consumed_at, now()),
      consumed_interview_id = coalesce(consumed_interview_id, new.id)
    where user_id = new.user_id and reserved_interview_id = new.id;
  end if;
  return new;
end;
$$;
create trigger mock_interviews_consume_guest_trial after update of voice_activated_at on public.mock_interviews
for each row execute function public.consume_guest_interview_trial();

create function public.get_guest_interview_trial()
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'consumed', coalesce(trial.consumed_at is not null, false),
    'interviewId', interview.id,
    'status', interview.status
  ) from (select (select auth.uid()) as id) principal
  left join interview_private.guest_trials trial on trial.user_id = principal.id
  left join public.mock_interviews interview on interview.user_id = principal.id
    and interview.id = coalesce(trial.consumed_interview_id, trial.reserved_interview_id)
  where principal.id is not null
$$;

create function public.get_interview_preferences()
returns jsonb language sql stable security definer set search_path = '' as $$
  select preferences from interview_private.interview_preferences where user_id = (select auth.uid())
$$;
create function public.save_interview_preferences(p_preferences jsonb)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null then raise exception 'Authentication required.' using errcode = '42501'; end if;
  if p_preferences is null or jsonb_typeof(p_preferences) <> 'object'
    or octet_length(p_preferences::text) > 1000
    or not (p_preferences ?& array['codingLanguage','difficultyRange','durationMinutes','interviewLanguage','interviewerLevel'])
    or p_preferences->>'codingLanguage' not in ('python','java')
    or p_preferences->>'difficultyRange' not in ('easy','medium','hard','easy_medium','medium_hard','easy_hard')
    or p_preferences->>'durationMinutes' not in ('30','45','60')
    or p_preferences->>'interviewLanguage' not in ('english','hebrew')
    or p_preferences->>'interviewerLevel' not in ('beginner','faang_tough')
    or exists(select 1 from jsonb_each(p_preferences) e where e.value = 'null'::jsonb) then
    raise exception 'Invalid preferences.';
  end if;
  insert into interview_private.interview_preferences(user_id, preferences)
  values((select auth.uid()), p_preferences)
  on conflict(user_id) do update set preferences = excluded.preferences;
end;
$$;

-- A refresh may reclaim a failed pre-voice reservation. Established interviews
-- remain resumable until their duration + ten-minute reconnect grace expires.
create function public.expire_pending_guest_interview()
returns void language plpgsql security definer set search_path = '' as $$
declare owned public.mock_interviews%rowtype;
begin
  if (select auth.uid()) is null then return; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('mock-interview:' || (select auth.uid())::text, 0));
  for owned in select * from public.mock_interviews where user_id = (select auth.uid()) and status = 'active' for update loop
    if owned.voice_activated_at is null and owned.voice_activation_deadline < now() then
      delete from public.mock_interviews where id = owned.id;
    elsif exists(select 1 from auth.users where id = owned.user_id and is_anonymous)
      and owned.started_at + make_interval(mins => owned.duration_minutes + 10) < now()
      and owned.voice_last_heartbeat_at < now() - interval '90 seconds'
      and not exists(select 1 from public.mock_interview_conversation_state
        where mock_interview_id = owned.id and lifecycle = 'concluding') then
      perform public.abandon_mock_interview(owned.id);
    end if;
  end loop;
end;
$$;

-- One authorization per paid provider request. Duplicate transport requests
-- cannot mint more provider credentials, even across server instances.
create function public.reserve_interview_voice_request(p_mock_interview_id uuid, p_connection_attempt_id uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare owned public.mock_interviews%rowtype; limits interview_private.launch_limits%rowtype;
  allocated_minutes integer; already_allocated boolean;
begin
  if (select auth.uid()) is null or p_connection_attempt_id is null then return false; end if;
  select * into owned from public.mock_interviews where id = p_mock_interview_id
    and user_id = (select auth.uid()) and status = 'active' for update;
  if not found then return false; end if;
  if owned.voice_activated_at is null and owned.voice_activation_deadline < now() then return false; end if;
  if owned.voice_activated_at is not null and now() > owned.started_at + make_interval(mins => owned.duration_minutes + 10) then return false; end if;
  if not exists(select 1 from public.mock_interview_conversation_state
    where mock_interview_id = owned.id and pending_connection_attempt_id = p_connection_attempt_id
      and pending_connection_expires_at > now() and lifecycle <> 'concluding') then return false; end if;
  select * into limits from interview_private.launch_limits where id for update;
  select exists(select 1 from interview_private.voice_requests where interview_id = owned.id) into already_allocated;
  if not limits.starts_enabled and not already_allocated then return false; end if;
  if (select count(*) from interview_private.voice_requests where user_id = owned.user_id and created_at > now() - interval '10 minutes') >= 6
    or (select count(*) from interview_private.voice_requests where interview_id = owned.id) >= 20 then return false; end if;
  if exists(select 1 from interview_private.voice_requests where interview_id = owned.id and attempt_id = p_connection_attempt_id) then return false; end if;
  if not already_allocated then
    select coalesce(sum(minutes),0) into allocated_minutes from (
      select max(duration_minutes) as minutes from interview_private.voice_requests
      where created_at >= date_trunc('day', now() at time zone 'UTC') at time zone 'UTC' group by interview_id
    ) allocated;
    if allocated_minutes + owned.duration_minutes > limits.daily_voice_minutes then return false; end if;
  end if;
  if (select count(*) from public.mock_interviews where status = 'active'
    and id <> owned.id and voice_last_heartbeat_at > now() - interval '90 seconds') >= limits.concurrent_voice_sessions then return false; end if;
  insert into interview_private.voice_requests(user_id, interview_id, attempt_id, duration_minutes)
  values(owned.user_id, owned.id, p_connection_attempt_id, owned.duration_minutes);
  return true;
end;
$$;

-- Completion is allowed after an authoritative conclusion closed the voice
-- transport. Other mutations still require the existing voice lease.
create or replace function public.enforce_mock_interview_voice_lease()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not old.voice_required or new.status = 'abandoned' then return new; end if;
  if new.status = 'completed' and old.phase = 'retrospective'
    and old.voice_activated_at is not null
    and exists(select 1 from public.mock_interview_conversation_state where mock_interview_id = old.id and lifecycle = 'concluding') then return new; end if;
  if (new.phase is distinct from old.phase or new.status is distinct from old.status)
    and (old.voice_activated_at is null or old.voice_last_heartbeat_at is null or old.voice_last_heartbeat_at < now() - interval '90 seconds') then
    raise exception 'A current live voice connection is required.' using errcode = '55000';
  end if;
  return new;
end;
$$;

-- Guest reads of their own finished evidence remain governed by existing RLS.
-- Learning data and profile writes are members-only, including direct API use.
create policy profiles_member_write on public.profiles as restrictive for update to authenticated
using ((select public.is_registered_interview_user())) with check ((select public.is_registered_interview_user()));
do $$
declare table_name text;
begin
  for table_name in select c.table_name from information_schema.columns c
    where c.table_schema = 'public' and c.column_name = 'user_id'
      and c.table_name not like 'mock_interview%'
      and c.table_name not like 'realtime_interview%'
  loop
    execute format('create policy guest_learning_access on public.%I as restrictive for all to authenticated using ((select public.is_registered_interview_user())) with check ((select public.is_registered_interview_user()))', table_name);
  end loop;
end;
$$;

-- Guard learning entry points even when they use SECURITY DEFINER internally.
do $$
declare fn record; definition text;
begin
  for fn in select p.oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prokind = 'f' and p.prosecdef
      and p.proname in ('begin_diagnostic','complete_diagnostic','start_practice_attempt','start_attempt','begin_attempt','complete_lesson','generate_daily_plan','reserve_ai_coach_interaction','finish_ai_coach_interaction','replace_daily_plan','set_daily_plan_item_completed')
  loop
    definition := pg_get_functiondef(fn.oid);
    if position('current_user_id is null' in definition) > 0 then
      definition := replace(definition, 'current_user_id is null', 'current_user_id is null or not public.is_registered_interview_user()');
      execute definition;
    end if;
  end loop;
end;
$$;

revoke all on function public.enforce_guest_interview_trial() from public;
revoke all on function public.consume_guest_interview_trial() from public;
revoke all on function public.get_guest_interview_trial() from public;
revoke all on function public.get_interview_preferences() from public;
revoke all on function public.save_interview_preferences(jsonb) from public;
revoke all on function public.expire_pending_guest_interview() from public;
revoke all on function public.reserve_interview_voice_request(uuid,uuid) from public;
grant execute on function public.get_guest_interview_trial() to authenticated;
grant execute on function public.get_interview_preferences() to authenticated;
grant execute on function public.save_interview_preferences(jsonb) to authenticated;
grant execute on function public.expire_pending_guest_interview() to authenticated;
grant execute on function public.reserve_interview_voice_request(uuid,uuid) to authenticated;
