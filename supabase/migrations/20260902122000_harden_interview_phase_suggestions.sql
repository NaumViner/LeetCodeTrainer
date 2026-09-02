create or replace function public.capture_mock_interview_phase_transition()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  realtime_ids bigint[] := '{}';
  fields text[] := '{}';
begin
  if tg_op = 'INSERT' then
    if new.status = 'active' and new.phase <> 'completed' then
      insert into public.mock_interview_phase_events (
        mock_interview_id, user_id, phase, transition_type, source
      ) values (
        new.id, new.user_id, new.phase, 'started', 'system'
      ) on conflict do nothing;
    end if;
    return new;
  end if;

  if new.phase is not distinct from old.phase then return new; end if;

  select coalesce(array_agg(recent.id order by recent.id), '{}')
  into realtime_ids
  from (
    select event.id
    from public.realtime_interview_events as event
    join public.realtime_interview_sessions as session
      on session.id = event.session_id
    where session.mock_interview_id = new.id
      and event.user_id = new.user_id
      and event.phase = old.phase
      and event.event_type in (
        'user_transcript', 'assistant_transcript', 'phase_context', 'code_snapshot'
      )
    order by event.id desc
    limit 12
  ) as recent;

  fields := case old.phase
    when 'clarify' then array['clarification_notes']
    when 'examples' then array['examples_notes']
    when 'brute_force' then array['brute_force_notes']
    when 'optimization' then array['optimization_notes']
    when 'implementation' then array[
      'coding_language', 'code_snapshot', 'workspace_version', 'code_submitted_at'
    ]
    when 'testing' then array['testing_notes']
    when 'complexity' then array[
      'submitted_time_complexity', 'submitted_space_complexity'
    ]
    when 'retrospective' then array['result', 'retrospective']
    else '{}'
  end;

  insert into public.mock_interview_phase_events (
    mock_interview_id, user_id, phase, transition_type, source,
    evidence_event_ids, evidence_fields, display_summary
  ) values (
    new.id, new.user_id, old.phase, 'completed', 'learner_action',
    realtime_ids, fields, public.mock_interview_phase_summary(new, old.phase)
  ) on conflict do nothing;

  if new.phase <> 'completed' then
    insert into public.mock_interview_phase_events (
      mock_interview_id, user_id, phase, transition_type, source
    ) values (
      new.id, new.user_id, new.phase, 'started', 'learner_action'
    ) on conflict do nothing;
  end if;
  return new;
end;
$$;

create or replace function public.suggest_mock_interview_phase(
  p_mock_interview_id uuid,
  p_expected_current_phase text,
  p_suggested_next_phase text,
  p_evidence_event_ids bigint[],
  p_reason_code text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  owned_interview public.mock_interviews%rowtype;
  owned_session public.realtime_interview_sessions%rowtype;
  phase_order text[] := array[
    'intro', 'clarify', 'examples', 'brute_force', 'optimization',
    'implementation', 'testing', 'complexity', 'retrospective', 'completed'
  ];
  distinct_evidence_count integer;
  valid_evidence_count integer;
  suggestion_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;
  if p_reason_code !~ '^[a-z][a-z0-9_]{2,63}$'
    or cardinality(coalesce(p_evidence_event_ids, '{}')) not between 1 and 12 then
    raise exception 'Interview phase suggestion is invalid.';
  end if;

  select * into owned_interview
  from public.mock_interviews
  where id = p_mock_interview_id and user_id = current_user_id
  for update;
  if not found or owned_interview.status <> 'active' then
    raise exception 'Active mock interview not found.' using errcode = '42501';
  end if;

  if owned_interview.phase <> p_expected_current_phase then return null; end if;
  if p_suggested_next_phase = 'completed'
    or array_position(phase_order, p_suggested_next_phase)
      <> array_position(phase_order, owned_interview.phase) + 1 then
    return null;
  end if;

  select count(distinct evidence_id)
  into distinct_evidence_count
  from unnest(p_evidence_event_ids) as evidence_id;
  if distinct_evidence_count <> cardinality(p_evidence_event_ids) then
    raise exception 'Interview phase evidence is duplicated.';
  end if;

  select count(*) into valid_evidence_count
  from public.realtime_interview_events as event
  join public.realtime_interview_sessions as session
    on session.id = event.session_id
  where event.id = any(p_evidence_event_ids)
    and event.user_id = current_user_id
    and session.mock_interview_id = owned_interview.id
    and event.phase = owned_interview.phase
    and event.event_type in (
      'user_transcript', 'assistant_transcript', 'phase_context', 'code_snapshot'
    );
  if valid_evidence_count <> cardinality(p_evidence_event_ids) then
    raise exception 'Interview phase evidence is invalid.' using errcode = '42501';
  end if;

  select * into owned_session
  from public.realtime_interview_sessions
  where mock_interview_id = owned_interview.id
    and user_id = current_user_id
    and status = 'active';
  if not found then
    raise exception 'Active realtime interview session not found.' using errcode = '42501';
  end if;

  insert into public.mock_interview_phase_events (
    mock_interview_id, user_id, phase, transition_type, source,
    suggested_phase, evidence_event_ids, display_summary, reason_code,
    provider, model
  ) values (
    owned_interview.id, current_user_id, owned_interview.phase,
    'suggested', 'interviewer_signal', p_suggested_next_phase,
    p_evidence_event_ids,
    format('Interviewer suggested %s. Review the evidence and confirm manually.',
      initcap(replace(p_suggested_next_phase, '_', ' '))),
    p_reason_code, owned_session.provider, owned_session.model
  )
  on conflict (mock_interview_id, phase, transition_type) do nothing
  returning id into suggestion_id;

  if suggestion_id is null then
    select id into suggestion_id
    from public.mock_interview_phase_events
    where mock_interview_id = owned_interview.id
      and phase = owned_interview.phase
      and transition_type = 'suggested';
  end if;
  return suggestion_id;
end;
$$;

revoke all on function public.capture_mock_interview_phase_transition()
  from public;
revoke all on function public.suggest_mock_interview_phase(
  uuid, text, text, bigint[], text
) from public;
grant execute on function public.suggest_mock_interview_phase(
  uuid, text, text, bigint[], text
) to authenticated;
