create table public.mock_interview_phase_events (
  id uuid primary key default gen_random_uuid(),
  mock_interview_id uuid not null
    references public.mock_interviews (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  phase text not null check (phase in (
    'intro', 'clarify', 'examples', 'brute_force', 'optimization',
    'implementation', 'testing', 'complexity', 'retrospective'
  )),
  transition_type text not null check (transition_type in (
    'started', 'completed', 'suggested'
  )),
  source text not null check (source in (
    'learner_action', 'interviewer_signal', 'fallback', 'system'
  )),
  suggested_phase text check (suggested_phase is null or suggested_phase in (
    'clarify', 'examples', 'brute_force', 'optimization',
    'implementation', 'testing', 'complexity', 'retrospective'
  )),
  evidence_event_ids bigint[] not null default '{}',
  code_submission_ids uuid[] not null default '{}',
  evidence_fields text[] not null default '{}',
  display_summary text check (
    display_summary is null or char_length(display_summary) between 1 and 300
  ),
  reason_code text check (
    reason_code is null or reason_code ~ '^[a-z][a-z0-9_]{2,63}$'
  ),
  provider text check (
    provider is null or char_length(provider) between 1 and 40
  ),
  model text check (model is null or char_length(model) between 1 and 120),
  created_at timestamptz not null default now(),
  check (cardinality(evidence_event_ids) <= 12),
  check (cardinality(code_submission_ids) <= 8),
  check (cardinality(evidence_fields) <= 8),
  check (
    (transition_type = 'suggested' and suggested_phase is not null
      and source = 'interviewer_signal' and reason_code is not null)
    or
    (transition_type <> 'suggested' and suggested_phase is null
      and reason_code is null and provider is null and model is null)
  ),
  unique (mock_interview_id, phase, transition_type)
);

create index mock_interview_phase_events_interview_idx
  on public.mock_interview_phase_events (mock_interview_id, created_at, id);

alter table public.mock_interview_phase_events enable row level security;
alter table public.mock_interview_phase_events force row level security;
revoke all on table public.mock_interview_phase_events from anon, authenticated;
grant select on table public.mock_interview_phase_events to authenticated;

create policy mock_interview_phase_events_select_own
  on public.mock_interview_phase_events
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create function public.mock_interview_phase_summary(
  p_interview public.mock_interviews,
  p_phase text
)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  item_count integer;
begin
  case p_phase
    when 'intro' then
      return 'Interview setup and prompt review completed.';
    when 'clarify' then
      item_count := cardinality(regexp_split_to_array(
        trim(coalesce(p_interview.clarification_notes, '')), E'\\n+'
      ));
      return format('Captured %s clarification item%s.',
        item_count, case when item_count = 1 then '' else 's' end);
    when 'examples' then
      item_count := cardinality(regexp_split_to_array(
        trim(coalesce(p_interview.examples_notes, '')), E'\\n+'
      ));
      return format('Captured %s example or expected-behavior item%s.',
        item_count, case when item_count = 1 then '' else 's' end);
    when 'brute_force' then
      return 'Saved the baseline approach and its repeated work.';
    when 'optimization' then
      return 'Saved the optimized approach, invariant, and tradeoff.';
    when 'implementation' then
      return format('%s code snapshot version %s submitted.',
        initcap(p_interview.coding_language), p_interview.workspace_version);
    when 'testing' then
      item_count := cardinality(regexp_split_to_array(
        trim(coalesce(p_interview.testing_notes, '')), E'\\n+'
      ));
      return format('Captured %s test or dry-run item%s.',
        item_count, case when item_count = 1 then '' else 's' end);
    when 'complexity' then
      return format('Recorded time %s and space %s.',
        coalesce(p_interview.time_complexity, 'not stated'),
        coalesce(p_interview.space_complexity, 'not stated'));
    when 'retrospective' then
      return format('Recorded the %s outcome and learner reflection.',
        coalesce(p_interview.result, 'selected'));
    else
      return null;
  end case;
end;
$$;

create function public.capture_mock_interview_phase_transition()
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
    when 'complexity' then array['time_complexity', 'space_complexity']
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

create trigger capture_mock_interview_phase_transition
after insert or update of phase on public.mock_interviews
for each row execute function public.capture_mock_interview_phase_transition();

create function public.attach_code_submission_to_phase_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.mock_interview_phase_events
  set code_submission_ids = array_append(code_submission_ids, new.id)
  where mock_interview_id = new.mock_interview_id
    and phase = 'implementation'
    and transition_type = 'completed'
    and cardinality(code_submission_ids) < 8
    and not new.id = any(code_submission_ids);
  return new;
end;
$$;

create trigger attach_code_submission_to_phase_event
after insert on public.mock_interview_code_submissions
for each row execute function public.attach_code_submission_to_phase_event();

create function public.suggest_mock_interview_phase(
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
  on conflict (mock_interview_id, phase, transition_type)
  do update set evidence_event_ids = excluded.evidence_event_ids
  returning id into suggestion_id;
  return suggestion_id;
end;
$$;

insert into public.mock_interview_phase_events (
  mock_interview_id, user_id, phase, transition_type, source, display_summary
)
select id, user_id, phase, 'started', 'system',
  'Current phase restored for the interview process guide.'
from public.mock_interviews
where status = 'active' and phase <> 'completed'
on conflict do nothing;

revoke all on function public.mock_interview_phase_summary(
  public.mock_interviews, text
) from public;
revoke all on function public.suggest_mock_interview_phase(
  uuid, text, text, bigint[], text
) from public;
grant execute on function public.suggest_mock_interview_phase(
  uuid, text, text, bigint[], text
) to authenticated;
