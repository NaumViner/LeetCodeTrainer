alter table public.mock_interview_conversation_state
  add column pending_connection_attempt_id uuid,
  add column pending_connection_mode text check (
    pending_connection_mode is null or pending_connection_mode in ('start', 'resume')
  ),
  add column pending_connection_expires_at timestamptz,
  add column last_confirmed_connection_attempt_id uuid,
  add column last_confirmed_connection_mode text check (
    last_confirmed_connection_mode is null
      or last_confirmed_connection_mode in ('start', 'resume')
  ),
  add check (
    (pending_connection_attempt_id is null
      and pending_connection_mode is null
      and pending_connection_expires_at is null)
    or
    (pending_connection_attempt_id is not null
      and pending_connection_mode is not null
      and pending_connection_expires_at is not null)
  ),
  add check (
    (last_confirmed_connection_attempt_id is null
      and last_confirmed_connection_mode is null)
    or
    (last_confirmed_connection_attempt_id is not null
      and last_confirmed_connection_mode is not null)
  );

create table public.mock_interview_control_receipts (
  id bigint generated always as identity primary key,
  mock_interview_id uuid not null
    references public.mock_interviews (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  tool_name text not null check (tool_name in (
    'report_current_stage', 'report_solution_readiness',
    'complete_primary_question', 'request_follow_up',
    'complete_follow_up_question', 'conclude_interview'
  )),
  idempotency_key text not null check (
    char_length(idempotency_key) between 1 and 200
    and idempotency_key ~ '^[A-Za-z0-9._:-]+$'
  ),
  result jsonb not null check (
    jsonb_typeof(result) = 'object' and octet_length(result::text) <= 8192
  ),
  created_at timestamptz not null default now(),
  unique (mock_interview_id, tool_name, idempotency_key)
);

comment on table public.mock_interview_control_receipts is
  'Private replay receipts for idempotent live-provider control tool calls.';

alter table public.mock_interview_control_receipts enable row level security;
alter table public.mock_interview_control_receipts force row level security;
revoke all on table public.mock_interview_control_receipts from anon, authenticated;
grant select on table public.mock_interview_control_receipts to service_role;

drop policy mock_interview_conversation_state_select_own
  on public.mock_interview_conversation_state;
drop policy mock_interview_conversation_events_select_own
  on public.mock_interview_conversation_events;

create policy mock_interview_conversation_state_select_after_interview
  on public.mock_interview_conversation_state for select to authenticated
  using (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.mock_interviews as interview
      where interview.id = mock_interview_id
        and interview.user_id = (select auth.uid())
        and interview.status <> 'active'
    )
  );

create policy mock_interview_conversation_events_select_after_interview
  on public.mock_interview_conversation_events for select to authenticated
  using (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.mock_interviews as interview
      where interview.id = mock_interview_id
        and interview.user_id = (select auth.uid())
        and interview.status <> 'active'
    )
  );

drop function public.prepare_realtime_interview_connection(uuid);

create function public.prepare_realtime_interview_connection(
  p_mock_interview_id uuid,
  p_connection_attempt_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  owned_interview public.mock_interviews%rowtype;
  conversation public.mock_interview_conversation_state%rowtype;
  transcript_turn_count integer;
  connection_mode text;
  effective_elapsed integer;
  recent_transcript jsonb;
  legacy_phase text;
  legacy_phase_event_id bigint;
begin
  if current_user_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;
  if p_connection_attempt_id is null then
    raise exception 'Connection attempt identifier is required.';
  end if;

  select * into owned_interview
  from public.mock_interviews
  where id = p_mock_interview_id
    and user_id = current_user_id
    and status = 'active'
  for update;
  if not found then
    raise exception 'Active mock interview not found.' using errcode = '42501';
  end if;

  insert into public.mock_interview_conversation_state (
    mock_interview_id, user_id
  ) values (owned_interview.id, current_user_id)
  on conflict (mock_interview_id) do nothing;

  select * into conversation
  from public.mock_interview_conversation_state
  where mock_interview_id = owned_interview.id
    and user_id = current_user_id
  for update;

  if conversation.lifecycle = 'concluding' then
    raise exception 'The interview is already concluding.' using errcode = '55000';
  end if;

  if conversation.pending_connection_attempt_id = p_connection_attempt_id
    and conversation.pending_connection_expires_at > now() then
    connection_mode := conversation.pending_connection_mode;
  else
    if conversation.pending_connection_attempt_id is not null
      and conversation.pending_connection_expires_at > now() then
      raise exception 'Another connection attempt is already in progress.'
        using errcode = '55P03';
    end if;
    if conversation.pending_connection_attempt_id is not null
      and conversation.pending_connection_expires_at <= now()
      and conversation.pending_connection_mode = 'resume' then
      insert into public.mock_interview_conversation_events (
        mock_interview_id, user_id, event_type, question_cycle, phase,
        reason_code
      ) values (
        owned_interview.id, current_user_id, 'connection_resume_failed',
        conversation.question_cycle, conversation.current_phase,
        'reservation_expired'
      );
    end if;

    if conversation.current_phase is null then
      select observation.observed_phase, observation.transcript_event_id
        into legacy_phase, legacy_phase_event_id
      from public.mock_interview_phase_observations as observation
      where observation.mock_interview_id = owned_interview.id
        and observation.accepted
      order by observation.transcript_event_id desc
      limit 1;
      if legacy_phase is not null then
        update public.mock_interview_conversation_state
        set current_phase = legacy_phase,
          phase_source = 'legacy_classifier',
          phase_transcript_event_id = legacy_phase_event_id,
          version = version + 1
        where mock_interview_id = owned_interview.id
        returning * into conversation;
      end if;
    end if;

    select count(*)::integer into transcript_turn_count
    from public.realtime_interview_events as event
    join public.realtime_interview_sessions as session on session.id = event.session_id
    where session.mock_interview_id = owned_interview.id
      and event.event_type in ('user_transcript', 'assistant_transcript');

    connection_mode := case
      when conversation.connection_count = 0 and transcript_turn_count = 0 then 'start'
      else 'resume'
    end;

    update public.mock_interview_conversation_state
    set pending_connection_attempt_id = p_connection_attempt_id,
      pending_connection_mode = connection_mode,
      pending_connection_expires_at = now() + interval '2 minutes',
      version = version + 1
    where mock_interview_id = owned_interview.id
    returning * into conversation;
  end if;

  effective_elapsed := greatest(
    owned_interview.elapsed_seconds,
    case when owned_interview.timer_running then least(
      14400,
      floor(extract(epoch from (now() - owned_interview.started_at)))::integer
    ) else owned_interview.elapsed_seconds end
  );

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', recent.id::text,
    'role', case when recent.event_type = 'user_transcript'
      then 'learner' else 'interviewer' end,
    'text', recent.content,
    'questionCycle', recent.question_cycle
  ) order by recent.id), '[]'::jsonb)
  into recent_transcript
  from (
    select event.id, event.event_type, event.content, event.question_cycle
    from public.realtime_interview_events as event
    join public.realtime_interview_sessions as session on session.id = event.session_id
    where session.mock_interview_id = owned_interview.id
      and event.event_type in ('user_transcript', 'assistant_transcript')
    order by event.id desc
    limit 6
  ) as recent;

  return jsonb_build_object(
    'connectionAttemptId', p_connection_attempt_id,
    'connectionMode', connection_mode,
    'connectionCount', conversation.connection_count,
    'lifecycle', conversation.lifecycle,
    'questionCycle', conversation.question_cycle,
    'observedPhase', conversation.current_phase,
    'observedPhaseEventId', conversation.phase_transcript_event_id::text,
    'primaryReadiness', conversation.primary_readiness,
    'followUpPrompt', case when conversation.lifecycle in (
      'follow_up', 'follow_up_completed', 'concluding'
    ) then conversation.follow_up_prompt else null end,
    'recentTranscript', recent_transcript,
    'codeSnapshot', left(coalesce(owned_interview.code_snapshot, ''), 30000),
    'workspaceVersion', owned_interview.workspace_version,
    'remainingSeconds', greatest(
      0, owned_interview.duration_minutes * 60 - effective_elapsed
    ),
    'concluding', conversation.lifecycle = 'concluding',
    'version', conversation.version
  );
end;
$$;

create function public.confirm_realtime_interview_connection(
  p_mock_interview_id uuid,
  p_connection_attempt_id uuid,
  p_provider text,
  p_model text,
  p_provider_call_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  conversation public.mock_interview_conversation_state%rowtype;
  realtime_session_id uuid;
  confirmed_mode text;
begin
  if current_user_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;
  if char_length(trim(coalesce(p_provider, ''))) not between 1 and 40
    or char_length(trim(coalesce(p_model, ''))) not between 1 and 120
    or char_length(coalesce(p_provider_call_id, '')) > 255 then
    raise exception 'Realtime provider metadata is invalid.';
  end if;

  select state.* into conversation
  from public.mock_interview_conversation_state as state
  join public.mock_interviews as interview on interview.id = state.mock_interview_id
  where state.mock_interview_id = p_mock_interview_id
    and state.user_id = current_user_id
    and interview.user_id = current_user_id
    and interview.status = 'active'
  for update of state;
  if not found then
    raise exception 'Active interview conversation not found.' using errcode = '42501';
  end if;
  if conversation.last_confirmed_connection_attempt_id = p_connection_attempt_id then
    select session.id into realtime_session_id
    from public.realtime_interview_sessions as session
    where session.mock_interview_id = p_mock_interview_id
      and session.user_id = current_user_id;
    return jsonb_build_object(
      'connectionCount', conversation.connection_count,
      'connectionMode', conversation.last_confirmed_connection_mode,
      'realtimeSessionId', realtime_session_id
    );
  end if;
  if conversation.pending_connection_attempt_id <> p_connection_attempt_id
    or conversation.pending_connection_expires_at <= now() then
    raise exception 'Connection attempt is missing or expired.' using errcode = '55000';
  end if;

  confirmed_mode := conversation.pending_connection_mode;
  realtime_session_id := public.begin_realtime_interview_session(
    p_mock_interview_id, p_provider, p_model, p_provider_call_id
  );

  update public.mock_interview_conversation_state
  set connection_count = connection_count + 1,
    pending_connection_attempt_id = null,
    pending_connection_mode = null,
    pending_connection_expires_at = null,
    last_confirmed_connection_attempt_id = p_connection_attempt_id,
    last_confirmed_connection_mode = confirmed_mode,
    version = version + 1
  where mock_interview_id = p_mock_interview_id
  returning * into conversation;

  insert into public.mock_interview_conversation_events (
    mock_interview_id, user_id, event_type, question_cycle, phase,
    reason_code, details
  ) values (
    p_mock_interview_id, current_user_id,
    case when confirmed_mode = 'start' then 'connection_started'
      else 'connection_resumed' end,
    conversation.question_cycle, conversation.current_phase,
    case when confirmed_mode = 'start' then 'first_connection'
      else 'existing_interview_state' end,
    jsonb_build_object(
      'connectionCount', conversation.connection_count,
      'provider', trim(p_provider)
    )
  );

  return jsonb_build_object(
    'connectionCount', conversation.connection_count,
    'connectionMode', confirmed_mode,
    'realtimeSessionId', realtime_session_id
  );
end;
$$;

create function public.cancel_realtime_interview_connection(
  p_mock_interview_id uuid,
  p_connection_attempt_id uuid,
  p_reason_code text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  conversation public.mock_interview_conversation_state%rowtype;
begin
  if current_user_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;
  if p_reason_code !~ '^[a-z][a-z0-9_]{2,63}$' then
    raise exception 'Connection failure reason is invalid.';
  end if;

  select state.* into conversation
  from public.mock_interview_conversation_state as state
  join public.mock_interviews as interview on interview.id = state.mock_interview_id
  where state.mock_interview_id = p_mock_interview_id
    and state.user_id = current_user_id
    and interview.user_id = current_user_id
    and interview.status = 'active'
  for update of state;
  if not found or conversation.pending_connection_attempt_id <> p_connection_attempt_id then
    return false;
  end if;

  update public.mock_interview_conversation_state
  set pending_connection_attempt_id = null,
    pending_connection_mode = null,
    pending_connection_expires_at = null,
    version = version + 1
  where mock_interview_id = p_mock_interview_id;

  if conversation.pending_connection_mode = 'resume' then
    insert into public.mock_interview_conversation_events (
      mock_interview_id, user_id, event_type, question_cycle, phase, reason_code
    ) values (
      p_mock_interview_id, current_user_id, 'connection_resume_failed',
      conversation.question_cycle, conversation.current_phase, p_reason_code
    );
  end if;
  return true;
end;
$$;

create function public.execute_realtime_interview_control(
  p_mock_interview_id uuid,
  p_tool_name text,
  p_idempotency_key text,
  p_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  existing_result jsonb;
  control_result jsonb;
begin
  if current_user_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;
  if p_tool_name not in (
    'report_current_stage', 'report_solution_readiness',
    'complete_primary_question', 'request_follow_up',
    'complete_follow_up_question', 'conclude_interview'
  ) or char_length(coalesce(p_idempotency_key, '')) not between 1 and 200
    or p_idempotency_key !~ '^[A-Za-z0-9._:-]+$'
    or jsonb_typeof(p_payload) <> 'object'
    or octet_length(p_payload::text) > 8192 then
    raise exception 'Interview control request is invalid.';
  end if;

  select receipt.result into existing_result
  from public.mock_interview_control_receipts as receipt
  where receipt.mock_interview_id = p_mock_interview_id
    and receipt.user_id = current_user_id
    and receipt.tool_name = p_tool_name
    and receipt.idempotency_key = p_idempotency_key;
  if found then
    return existing_result;
  end if;

  perform 1
  from public.mock_interviews as interview
  where interview.id = p_mock_interview_id
    and interview.status = 'active'
    and interview.user_id = current_user_id
    and interview.voice_activated_at is not null
    and interview.voice_last_heartbeat_at >= now() - interval '90 seconds'
    and exists (
      select 1 from public.realtime_interview_sessions as session
      where session.mock_interview_id = p_mock_interview_id
        and session.user_id = current_user_id
        and session.status = 'active'
    )
  for update of interview;
  if not found then
    raise exception 'A current live voice connection is required.' using errcode = '55000';
  end if;

  perform 1
  from public.mock_interview_conversation_state as state
  where state.mock_interview_id = p_mock_interview_id
    and state.user_id = current_user_id
  for update of state;
  if not found then
    raise exception 'Interview conversation not found.' using errcode = '42501';
  end if;

  select receipt.result into existing_result
  from public.mock_interview_control_receipts as receipt
  where receipt.mock_interview_id = p_mock_interview_id
    and receipt.user_id = current_user_id
    and receipt.tool_name = p_tool_name
    and receipt.idempotency_key = p_idempotency_key;
  if found then
    return existing_result;
  end if;

  control_result := case p_tool_name
    when 'report_current_stage' then public.record_live_interview_stage(
      p_mock_interview_id,
      (p_payload->>'transcriptEventId')::bigint,
      p_payload->>'questionCycle',
      p_payload->>'phase',
      p_payload->>'signal',
      p_payload->>'reasonCode'
    )
    when 'report_solution_readiness' then public.record_interview_solution_readiness(
      p_mock_interview_id,
      (p_payload->>'transcriptEventId')::bigint,
      (p_payload->>'algorithmComplete')::boolean,
      (p_payload->>'stateComplete')::boolean,
      (p_payload->>'operationOrderComplete')::boolean,
      (p_payload->>'correctnessReasoningComplete')::boolean,
      (p_payload->>'edgeCasesAddressed')::boolean,
      (p_payload->>'complexityConsistent')::boolean,
      p_payload->>'reasonCode'
    )
    when 'complete_primary_question' then public.complete_primary_interview_question(
      p_mock_interview_id,
      (p_payload->>'transcriptEventId')::bigint,
      p_payload->>'reasonCode'
    )
    when 'request_follow_up' then public.request_interview_follow_up(
      p_mock_interview_id,
      p_payload->>'reasonCode'
    )
    when 'complete_follow_up_question' then public.complete_follow_up_interview_question(
      p_mock_interview_id,
      (p_payload->>'transcriptEventId')::bigint,
      p_payload->>'reasonCode'
    )
    when 'conclude_interview' then public.conclude_realtime_mock_interview(
      p_mock_interview_id,
      p_payload->>'reasonCode'
    )
  end;

  insert into public.mock_interview_control_receipts (
    mock_interview_id, user_id, tool_name, idempotency_key, result
  ) values (
    p_mock_interview_id, current_user_id, p_tool_name,
    p_idempotency_key, control_result
  );
  return control_result;
end;
$$;

revoke all on function public.prepare_realtime_interview_connection(uuid, uuid) from public;
revoke all on function public.confirm_realtime_interview_connection(uuid, uuid, text, text, text) from public;
revoke all on function public.cancel_realtime_interview_connection(uuid, uuid, text) from public;
revoke all on function public.execute_realtime_interview_control(uuid, text, text, jsonb) from public;
grant execute on function public.prepare_realtime_interview_connection(uuid, uuid) to authenticated;
grant execute on function public.confirm_realtime_interview_connection(uuid, uuid, text, text, text) to authenticated;
grant execute on function public.cancel_realtime_interview_connection(uuid, uuid, text) to authenticated;
grant execute on function public.execute_realtime_interview_control(uuid, text, text, jsonb) to authenticated;

revoke execute on function public.record_live_interview_stage(uuid, bigint, text, text, text, text) from authenticated;
revoke execute on function public.record_interview_solution_readiness(uuid, bigint, boolean, boolean, boolean, boolean, boolean, boolean, text) from authenticated;
revoke execute on function public.complete_primary_interview_question(uuid, bigint, text) from authenticated;
revoke execute on function public.request_interview_follow_up(uuid, text) from authenticated;
revoke execute on function public.complete_follow_up_interview_question(uuid, bigint, text) from authenticated;
revoke execute on function public.conclude_realtime_mock_interview(uuid, text) from authenticated;
revoke execute on function public.begin_realtime_interview_session(uuid, text, text, text) from authenticated;
