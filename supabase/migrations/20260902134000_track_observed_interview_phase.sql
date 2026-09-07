create table public.mock_interview_phase_observations (
  id bigint generated always as identity primary key,
  mock_interview_id uuid not null
    references public.mock_interviews (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  transcript_event_id bigint not null
    references public.realtime_interview_events (id) on delete cascade,
  observed_phase text not null check (observed_phase in (
    'intro', 'clarify', 'examples', 'brute_force', 'optimization',
    'implementation', 'testing', 'complexity', 'retrospective'
  )),
  confidence numeric(4, 3) not null check (confidence between 0 and 1),
  signal text not null check (signal in ('explicit', 'inferred', 'ambiguous')),
  accepted boolean not null,
  created_at timestamptz not null default now(),
  unique (mock_interview_id, transcript_event_id)
);

comment on table public.mock_interview_phase_observations is
  'Display-only conversational phase observations. They are excluded from interview scoring and evaluation evidence.';

create index mock_interview_phase_observations_latest_idx
  on public.mock_interview_phase_observations (
    mock_interview_id, accepted, transcript_event_id desc
  );

alter table public.mock_interview_phase_observations enable row level security;
alter table public.mock_interview_phase_observations force row level security;
revoke all on table public.mock_interview_phase_observations from anon, authenticated;

create function public.get_interview_phase_classification_context(
  p_mock_interview_id uuid,
  p_transcript_event_id bigint
)
returns jsonb
language plpgsql
security definer
set search_path = ''
stable
as $$
declare
  current_user_id uuid := (select auth.uid());
  trigger_session_id uuid;
  workflow_phase text;
  current_observed_phase text;
  context_transcript jsonb;
begin
  if current_user_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  select event.session_id, interview.phase
    into trigger_session_id, workflow_phase
  from public.realtime_interview_events as event
  join public.realtime_interview_sessions as session
    on session.id = event.session_id
  join public.mock_interviews as interview
    on interview.id = session.mock_interview_id
  where interview.id = p_mock_interview_id
    and interview.user_id = current_user_id
    and interview.status = 'active'
    and session.user_id = current_user_id
    and event.id = p_transcript_event_id
    and event.event_type in ('user_transcript', 'assistant_transcript');

  if not found then
    raise exception 'Owned transcript event not found.' using errcode = '42501';
  end if;

  select observation.observed_phase
    into current_observed_phase
  from public.mock_interview_phase_observations as observation
  where observation.mock_interview_id = p_mock_interview_id
    and observation.accepted
    and observation.transcript_event_id < p_transcript_event_id
  order by observation.transcript_event_id desc
  limit 1;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', recent.id::text,
        'role', case
          when recent.event_type = 'user_transcript' then 'learner'
          else 'interviewer'
        end,
        'text', recent.content
      ) order by recent.id
    ),
    '[]'::jsonb
  ) into context_transcript
  from (
    select event.id, event.event_type, event.content
    from public.realtime_interview_events as event
    where event.session_id = trigger_session_id
      and event.id <= p_transcript_event_id
      and event.event_type in ('user_transcript', 'assistant_transcript')
    order by event.id desc
    limit 6
  ) as recent;

  return jsonb_build_object(
    'currentObservedPhase', coalesce(current_observed_phase, workflow_phase),
    'transcript', context_transcript,
    'triggerEventId', p_transcript_event_id::text,
    'workflowPhase', workflow_phase
  );
end;
$$;

create function public.record_mock_interview_phase_observation(
  p_mock_interview_id uuid,
  p_transcript_event_id bigint,
  p_observed_phase text,
  p_confidence numeric,
  p_signal text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  accepted_observation boolean;
  latest_phase text;
  latest_event_id bigint;
  workflow_phase text;
begin
  if current_user_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;
  if p_observed_phase not in (
    'intro', 'clarify', 'examples', 'brute_force', 'optimization',
    'implementation', 'testing', 'complexity', 'retrospective'
  ) or p_signal not in ('explicit', 'inferred', 'ambiguous')
    or p_confidence is null or p_confidence not between 0 and 1 then
    raise exception 'Interview phase observation is invalid.';
  end if;

  select interview.phase into workflow_phase
  from public.realtime_interview_events as event
  join public.realtime_interview_sessions as session
    on session.id = event.session_id
  join public.mock_interviews as interview
    on interview.id = session.mock_interview_id
  where interview.id = p_mock_interview_id
    and interview.user_id = current_user_id
    and interview.status = 'active'
    and session.user_id = current_user_id
    and event.id = p_transcript_event_id
    and event.event_type in ('user_transcript', 'assistant_transcript');

  if not found then
    raise exception 'Owned transcript event not found.' using errcode = '42501';
  end if;

  accepted_observation := case
    when p_signal = 'explicit' then p_confidence >= 0.650
    when p_signal = 'inferred' then p_confidence >= 0.780
    else false
  end;

  insert into public.mock_interview_phase_observations (
    mock_interview_id, user_id, transcript_event_id, observed_phase,
    confidence, signal, accepted
  ) values (
    p_mock_interview_id, current_user_id, p_transcript_event_id,
    p_observed_phase, p_confidence, p_signal, accepted_observation
  )
  on conflict (mock_interview_id, transcript_event_id) do update set
    observed_phase = excluded.observed_phase,
    confidence = excluded.confidence,
    signal = excluded.signal,
    accepted = excluded.accepted;

  select observation.observed_phase, observation.transcript_event_id
    into latest_phase, latest_event_id
  from public.mock_interview_phase_observations as observation
  where observation.mock_interview_id = p_mock_interview_id
    and observation.accepted
  order by observation.transcript_event_id desc
  limit 1;

  return jsonb_build_object(
    'accepted', accepted_observation,
    'observedPhase', coalesce(latest_phase, workflow_phase),
    'observedPhaseEventId', latest_event_id::text,
    'triggerEventId', p_transcript_event_id::text
  );
end;
$$;

create or replace function public.get_owned_active_mock_interview(
  p_mock_interview_id uuid
)
returns jsonb
language sql
security definer
set search_path = ''
stable
as $$
  select jsonb_build_object(
    'codeSnapshot', interview.code_snapshot,
    'codingLanguage', interview.coding_language,
    'durationMinutes', interview.duration_minutes,
    'elapsedSeconds', interview.elapsed_seconds,
    'id', interview.id,
    'interviewLanguage', interview.interview_language,
    'interviewerLevel', interview.interviewer_level,
    'observedPhase', observation.observed_phase,
    'observedPhaseEventId', observation.transcript_event_id::text,
    'phase', interview.phase,
    'questionContentKey', pg_catalog.md5(
      problem.slug || ':mock-interview-active-v1:8f4d23ac'
    ),
    'questionContentVersion', interview.question_content_version,
    'scratchpad', interview.scratchpad,
    'startedAt', interview.started_at,
    'timerRunning', interview.timer_running,
    'voiceActivated', interview.voice_activated_at is not null,
    'workspaceVersion', interview.workspace_version
  )
  from public.mock_interviews as interview
  join public.problems as problem on problem.id = interview.problem_id
  left join lateral (
    select phase_observation.observed_phase,
      phase_observation.transcript_event_id
    from public.mock_interview_phase_observations as phase_observation
    where phase_observation.mock_interview_id = interview.id
      and phase_observation.accepted
    order by phase_observation.transcript_event_id desc
    limit 1
  ) as observation on true
  where interview.id = p_mock_interview_id
    and interview.user_id = (select auth.uid())
    and interview.status = 'active'
$$;

revoke all on function public.get_interview_phase_classification_context(uuid, bigint)
  from public;
revoke all on function public.record_mock_interview_phase_observation(
  uuid, bigint, text, numeric, text
) from public;
grant execute on function public.get_interview_phase_classification_context(uuid, bigint)
  to authenticated;
grant execute on function public.record_mock_interview_phase_observation(
  uuid, bigint, text, numeric, text
) to authenticated;
grant execute on function public.get_owned_active_mock_interview(uuid)
  to authenticated;
