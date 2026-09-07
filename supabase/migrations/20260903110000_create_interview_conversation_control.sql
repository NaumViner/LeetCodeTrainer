create table public.mock_interview_conversation_state (
  mock_interview_id uuid primary key
    references public.mock_interviews (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  lifecycle text not null default 'primary_question' check (lifecycle in (
    'primary_question', 'primary_completed', 'follow_up',
    'follow_up_completed', 'concluding'
  )),
  question_cycle text not null default 'primary'
    check (question_cycle in ('primary', 'follow_up')),
  current_phase text check (current_phase is null or current_phase in (
    'intro', 'clarify', 'examples', 'brute_force', 'optimization',
    'implementation', 'testing', 'complexity', 'retrospective'
  )),
  phase_source text check (phase_source is null or phase_source in (
    'live_tool', 'product_event', 'legacy_classifier'
  )),
  phase_transcript_event_id bigint
    references public.realtime_interview_events (id) on delete set null,
  primary_readiness text not null default 'incomplete'
    check (primary_readiness in ('incomplete', 'ready', 'completed')),
  readiness_algorithm boolean not null default false,
  readiness_data_structures boolean not null default false,
  readiness_operation_order boolean not null default false,
  readiness_correctness boolean not null default false,
  readiness_edge_cases boolean not null default false,
  readiness_complexity boolean not null default false,
  follow_up_prompt text check (
    follow_up_prompt is null or char_length(follow_up_prompt) between 1 and 2000
  ),
  follow_up_content_version integer check (
    follow_up_content_version is null or follow_up_content_version > 0
  ),
  follow_up_started_at timestamptz,
  conclusion_reason text check (conclusion_reason is null or conclusion_reason in (
    'enough_evidence', 'time_low', 'primary_complete',
    'follow_up_complete', 'provider_limit', 'learner_requested'
  )),
  connection_count integer not null default 0 check (connection_count >= 0),
  version integer not null default 0 check (version >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (lifecycle in ('primary_question', 'primary_completed') and question_cycle = 'primary')
    or (lifecycle in ('follow_up', 'follow_up_completed') and question_cycle = 'follow_up')
    or lifecycle = 'concluding'
  ),
  check (
    lifecycle not in ('follow_up', 'follow_up_completed')
    or (follow_up_prompt is not null and follow_up_started_at is not null)
  )
);

comment on table public.mock_interview_conversation_state is
  'Authoritative voice-interview lifecycle and display-stage state. Readiness and stage fields are control signals, never score inputs.';

create table public.approved_interview_follow_ups (
  problem_id uuid primary key references public.problems (id) on delete cascade,
  content_version integer not null check (content_version > 0),
  prompt text not null check (char_length(prompt) between 1 and 2000),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.approved_interview_follow_ups (
  problem_id, content_version, prompt
)
select problem.id, 1, follow_up.prompt
from (values
  ('best-time-to-buy-and-sell-stock', 'Now support any number of buy-and-sell transactions while still holding at most one share at a time. Describe and implement the required change.'),
  ('binary-search', 'Now return the first index of the target in a sorted array that may contain duplicates. Describe and implement the required change.'),
  ('climbing-stairs', 'Now the allowed step sizes are supplied as a distinct positive-integer array. Return the number of ordered move sequences that reach exactly n.'),
  ('contains-duplicate', 'Now return true only when two equal values occur within k indices of one another. Describe and implement the required change.'),
  ('implement-trie-prefix-tree', 'Add a delete(word) operation that preserves every other stored word and prefix. Describe and implement the required change.'),
  ('insert-interval', 'Now process a stream of new intervals and return the normalized interval list after each insertion. Explain how you would avoid rebuilding everything when possible.'),
  ('kth-largest-element-in-a-stream', 'Now add a remove(value) operation and continue returning the kth-largest value after every update. Describe the data structure changes.'),
  ('maximum-subarray', 'Now also return the inclusive start and end indices of one maximum-sum subarray. Describe and implement the required change.'),
  ('network-delay-time', 'Now answer the delay for several different source nodes on the same graph. Explain what, if anything, you would precompute.'),
  ('number-of-islands', 'Now return the size of the largest island in addition to the island count. Describe and implement the required change.'),
  ('reverse-linked-list', 'Now reverse only the nodes between one-indexed positions left and right, in place. Describe and implement the required change.'),
  ('rotate-image', 'Now rotate the same matrix 90 degrees counterclockwise in place. Describe and implement the required change.'),
  ('serialize-and-deserialize-binary-tree', 'Now require the serialized representation to support streaming deserialization without loading every token first. Describe the format and state you would keep.'),
  ('single-number', 'Now every repeated value appears three times and one value appears once. Keep linear time and constant extra space.'),
  ('subsets', 'Now the input may contain duplicate values. Return every distinct subset exactly once. Describe and implement the required change.'),
  ('unique-paths', 'Now some cells are blocked and cannot be entered. Return the number of valid paths from the top-left to the bottom-right cell.'),
  ('valid-palindrome', 'Now determine whether the text can become a palindrome after deleting at most one participating character.'),
  ('valid-parentheses', 'Now the string may contain wildcard characters, each of which may act as an opening parenthesis, a closing parenthesis, or an empty string. Handle round parentheses only.')
) as follow_up(slug, prompt)
join public.problems as problem on problem.slug = follow_up.slug;

create table public.mock_interview_conversation_events (
  id bigint generated always as identity primary key,
  mock_interview_id uuid not null
    references public.mock_interviews (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  event_type text not null check (event_type in (
    'stage_observed', 'solution_readiness_reported', 'primary_completed',
    'follow_up_requested', 'follow_up_started', 'follow_up_rejected_time',
    'follow_up_completed', 'conclusion_requested', 'connection_started',
    'connection_resumed', 'connection_resume_failed'
  )),
  question_cycle text not null check (question_cycle in ('primary', 'follow_up')),
  phase text check (phase is null or phase in (
    'intro', 'clarify', 'examples', 'brute_force', 'optimization',
    'implementation', 'testing', 'complexity', 'retrospective'
  )),
  transcript_event_id bigint
    references public.realtime_interview_events (id) on delete set null,
  reason_code text check (
    reason_code is null or reason_code ~ '^[a-z][a-z0-9_]{2,63}$'
  ),
  details jsonb not null default '{}'::jsonb check (
    jsonb_typeof(details) = 'object'
    and octet_length(details::text) <= 4096
  ),
  created_at timestamptz not null default now()
);

create index mock_interview_conversation_events_timeline_idx
  on public.mock_interview_conversation_events (mock_interview_id, id);

alter table public.realtime_interview_events
  add column question_cycle text not null default 'primary'
    check (question_cycle in ('primary', 'follow_up'));

create trigger mock_interview_conversation_state_set_updated_at
before update on public.mock_interview_conversation_state
for each row execute procedure public.set_updated_at();
create trigger approved_interview_follow_ups_set_updated_at
before update on public.approved_interview_follow_ups
for each row execute procedure public.set_updated_at();

alter table public.mock_interview_conversation_state enable row level security;
alter table public.mock_interview_conversation_state force row level security;
alter table public.mock_interview_conversation_events enable row level security;
alter table public.mock_interview_conversation_events force row level security;
alter table public.approved_interview_follow_ups enable row level security;
alter table public.approved_interview_follow_ups force row level security;

revoke all on table public.mock_interview_conversation_state from anon, authenticated;
revoke all on table public.mock_interview_conversation_events from anon, authenticated;
revoke all on table public.approved_interview_follow_ups from anon, authenticated;
grant select on table public.mock_interview_conversation_state to authenticated;
grant select on table public.mock_interview_conversation_events to authenticated;

create policy mock_interview_conversation_state_select_own
  on public.mock_interview_conversation_state for select to authenticated
  using ((select auth.uid()) = user_id);
create policy mock_interview_conversation_events_select_own
  on public.mock_interview_conversation_events for select to authenticated
  using ((select auth.uid()) = user_id);

create function public.initialize_mock_interview_conversation_state()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.mock_interview_conversation_state (
    mock_interview_id, user_id
  ) values (new.id, new.user_id)
  on conflict (mock_interview_id) do nothing;
  return new;
end;
$$;

create trigger mock_interviews_initialize_conversation_state
after insert on public.mock_interviews
for each row execute procedure public.initialize_mock_interview_conversation_state();

create function public.sync_code_submission_conversation_stage()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  active_cycle text;
  target_phase text;
begin
  target_phase := case when new.submission_kind = 'completed'
    then 'testing' else 'implementation' end;
  update public.mock_interview_conversation_state as state
  set current_phase = target_phase,
    phase_source = 'product_event',
    version = state.version + 1
  from public.mock_interviews as interview
  where state.mock_interview_id = new.mock_interview_id
    and interview.id = state.mock_interview_id
    and interview.status = 'active'
    and state.lifecycle <> 'concluding'
  returning state.question_cycle into active_cycle;
  if active_cycle is not null then
    insert into public.mock_interview_conversation_events (
      mock_interview_id, user_id, event_type, question_cycle, phase,
      reason_code, details
    ) values (
      new.mock_interview_id, new.user_id, 'stage_observed', active_cycle,
      target_phase, case when new.submission_kind = 'completed'
        then 'code_marked_complete' else 'code_submitted_for_review' end,
      jsonb_build_object('snapshotVersion', new.snapshot_version,
        'source', 'product_event')
    );
  end if;
  return new;
end;
$$;

create trigger mock_interview_code_submission_sync_stage
after insert on public.mock_interview_code_submissions
for each row execute procedure public.sync_code_submission_conversation_stage();

insert into public.mock_interview_conversation_state (
  mock_interview_id,
  user_id,
  current_phase,
  phase_source,
  phase_transcript_event_id
)
select
  interview.id,
  interview.user_id,
  observation.observed_phase,
  case when observation.observed_phase is null then null else 'legacy_classifier' end,
  observation.transcript_event_id
from public.mock_interviews as interview
left join lateral (
  select phase_observation.observed_phase,
    phase_observation.transcript_event_id
  from public.mock_interview_phase_observations as phase_observation
  where phase_observation.mock_interview_id = interview.id
    and phase_observation.accepted
  order by phase_observation.transcript_event_id desc
  limit 1
) as observation on true
on conflict (mock_interview_id) do nothing;

create or replace function public.append_realtime_interview_event(
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
  active_cycle text;
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

  select session.*
    into owned_session
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

  select state.question_cycle into active_cycle
  from public.mock_interview_conversation_state as state
  where state.mock_interview_id = p_mock_interview_id
    and state.user_id = current_user_id;
  if active_cycle is null then
    raise exception 'Active interview conversation not found.' using errcode = '42501';
  end if;

  insert into public.realtime_interview_events (
    session_id, user_id, event_type, phase, content, question_cycle
  ) values (
    owned_session.id, current_user_id, p_event_type, p_phase,
    trim(p_content), active_cycle
  ) returning id into event_id;
  return event_id;
end;
$$;

create function public.prepare_realtime_interview_connection(
  p_mock_interview_id uuid
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
  set connection_count = connection_count + 1,
    version = version + 1
  where mock_interview_id = owned_interview.id
  returning * into conversation;

  insert into public.mock_interview_conversation_events (
    mock_interview_id, user_id, event_type, question_cycle, phase,
    reason_code, details
  ) values (
    owned_interview.id, current_user_id,
    case when connection_mode = 'start' then 'connection_started'
      else 'connection_resumed' end,
    conversation.question_cycle, conversation.current_phase,
    case when connection_mode = 'start' then 'first_connection'
      else 'existing_interview_state' end,
    jsonb_build_object('connectionCount', conversation.connection_count)
  );

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
    'connectionMode', connection_mode,
    'connectionCount', conversation.connection_count,
    'lifecycle', conversation.lifecycle,
    'questionCycle', conversation.question_cycle,
    'observedPhase', conversation.current_phase,
    'observedPhaseEventId', conversation.phase_transcript_event_id::text,
    'primaryReadiness', conversation.primary_readiness,
    'followUpPrompt', conversation.follow_up_prompt,
    'recentTranscript', recent_transcript,
    'codeSnapshot', left(coalesce(owned_interview.code_snapshot, ''), 30000),
    'workspaceVersion', owned_interview.workspace_version,
    'remainingSeconds', greatest(0, owned_interview.duration_minutes * 60 - effective_elapsed),
    'concluding', conversation.lifecycle = 'concluding',
    'version', conversation.version
  );
end;
$$;

create function public.record_live_interview_stage(
  p_mock_interview_id uuid,
  p_transcript_event_id bigint,
  p_question_cycle text,
  p_observed_phase text,
  p_signal text,
  p_reason_code text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  conversation public.mock_interview_conversation_state%rowtype;
  accepted_observation boolean := false;
  phase_rank integer;
  workflow_rank integer;
begin
  if current_user_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;
  if p_question_cycle not in ('primary', 'follow_up')
    or p_observed_phase not in (
      'intro', 'clarify', 'examples', 'brute_force', 'optimization',
      'implementation', 'testing', 'complexity', 'retrospective'
    )
    or p_signal not in ('explicit', 'inferred')
    or p_reason_code !~ '^[a-z][a-z0-9_]{2,63}$' then
    raise exception 'Live interview stage report is invalid.';
  end if;

  select state.* into conversation
  from public.mock_interview_conversation_state as state
  join public.mock_interviews as interview
    on interview.id = state.mock_interview_id
  where state.mock_interview_id = p_mock_interview_id
    and state.user_id = current_user_id
    and interview.user_id = current_user_id
    and interview.status = 'active'
  for update of state;
  if not found then
    raise exception 'Active interview conversation not found.' using errcode = '42501';
  end if;
  if conversation.lifecycle = 'concluding'
    or conversation.question_cycle <> p_question_cycle then
    return jsonb_build_object(
      'accepted', false,
      'observedPhase', conversation.current_phase,
      'observedPhaseEventId', conversation.phase_transcript_event_id::text
    );
  end if;
  if not exists (
    select 1
    from public.realtime_interview_events as event
    join public.realtime_interview_sessions as session on session.id = event.session_id
    where event.id = p_transcript_event_id
      and event.event_type in ('user_transcript', 'assistant_transcript')
      and event.user_id = current_user_id
      and event.question_cycle = p_question_cycle
      and session.mock_interview_id = p_mock_interview_id
  ) then
    raise exception 'Owned transcript evidence not found.' using errcode = '42501';
  end if;

  accepted_observation := conversation.phase_transcript_event_id is null
    or p_transcript_event_id > conversation.phase_transcript_event_id;
  if accepted_observation then
    update public.mock_interview_conversation_state
    set current_phase = p_observed_phase,
      phase_source = 'live_tool',
      phase_transcript_event_id = p_transcript_event_id,
      version = version + 1
    where mock_interview_id = p_mock_interview_id
    returning * into conversation;

    insert into public.mock_interview_phase_observations (
      mock_interview_id, user_id, transcript_event_id, observed_phase,
      confidence, signal, accepted
    ) values (
      p_mock_interview_id, current_user_id, p_transcript_event_id,
      p_observed_phase, case when p_signal = 'explicit' then 1 else 0.85 end,
      p_signal, true
    ) on conflict (mock_interview_id, transcript_event_id) do update set
      observed_phase = excluded.observed_phase,
      confidence = excluded.confidence,
      signal = excluded.signal,
      accepted = true;

    insert into public.mock_interview_conversation_events (
      mock_interview_id, user_id, event_type, question_cycle, phase,
      transcript_event_id, reason_code
    ) values (
      p_mock_interview_id, current_user_id, 'stage_observed',
      p_question_cycle, p_observed_phase, p_transcript_event_id, p_reason_code
    );

    phase_rank := array_position(array[
      'intro', 'clarify', 'examples', 'brute_force', 'optimization',
      'implementation', 'testing', 'complexity', 'retrospective'
    ], p_observed_phase);
    select array_position(array[
      'intro', 'clarify', 'examples', 'brute_force', 'optimization',
      'implementation', 'testing', 'complexity', 'retrospective'
    ], phase) into workflow_rank
    from public.mock_interviews where id = p_mock_interview_id;
    if p_question_cycle = 'primary' and phase_rank > workflow_rank
      and p_observed_phase <> 'retrospective' then
      update public.mock_interviews
      set phase = p_observed_phase
      where id = p_mock_interview_id;
    elsif p_question_cycle = 'follow_up'
      and p_observed_phase <> 'retrospective' then
      update public.mock_interviews
      set phase = p_observed_phase
      where id = p_mock_interview_id;
    end if;
  end if;

  return jsonb_build_object(
    'accepted', accepted_observation,
    'observedPhase', conversation.current_phase,
    'observedPhaseEventId', conversation.phase_transcript_event_id::text
  );
end;
$$;

create function public.record_interview_solution_readiness(
  p_mock_interview_id uuid,
  p_transcript_event_id bigint,
  p_algorithm boolean,
  p_data_structures boolean,
  p_operation_order boolean,
  p_correctness boolean,
  p_edge_cases boolean,
  p_complexity boolean,
  p_reason_code text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  readiness text;
begin
  if current_user_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;
  if p_reason_code !~ '^[a-z][a-z0-9_]{2,63}$' then
    raise exception 'Solution readiness report is invalid.';
  end if;
  if not exists (
    select 1 from public.realtime_interview_events as event
    join public.realtime_interview_sessions as session on session.id = event.session_id
    join public.mock_interview_conversation_state as state
      on state.mock_interview_id = session.mock_interview_id
    join public.mock_interviews as interview on interview.id = state.mock_interview_id
    where event.id = p_transcript_event_id
      and event.user_id = current_user_id
      and event.event_type in ('user_transcript', 'assistant_transcript')
      and session.mock_interview_id = p_mock_interview_id
      and state.question_cycle = 'primary'
      and state.lifecycle = 'primary_question'
      and interview.status = 'active'
  ) then
    raise exception 'Active primary-question evidence not found.' using errcode = '42501';
  end if;

  readiness := case when p_algorithm and p_data_structures and p_operation_order
    and p_correctness and p_edge_cases and p_complexity
    then 'ready' else 'incomplete' end;

  update public.mock_interview_conversation_state
  set primary_readiness = readiness,
    readiness_algorithm = p_algorithm,
    readiness_data_structures = p_data_structures,
    readiness_operation_order = p_operation_order,
    readiness_correctness = p_correctness,
    readiness_edge_cases = p_edge_cases,
    readiness_complexity = p_complexity,
    version = version + 1
  where mock_interview_id = p_mock_interview_id
    and user_id = current_user_id;

  insert into public.mock_interview_conversation_events (
    mock_interview_id, user_id, event_type, question_cycle,
    transcript_event_id, reason_code, details
  ) values (
    p_mock_interview_id, current_user_id, 'solution_readiness_reported',
    'primary', p_transcript_event_id, p_reason_code,
    jsonb_build_object(
      'readiness', readiness,
      'algorithm', p_algorithm,
      'dataStructures', p_data_structures,
      'operationOrder', p_operation_order,
      'correctness', p_correctness,
      'edgeCases', p_edge_cases,
      'complexity', p_complexity
    )
  );
  return jsonb_build_object('readiness', readiness, 'ready', readiness = 'ready');
end;
$$;

create function public.complete_primary_interview_question(
  p_mock_interview_id uuid,
  p_transcript_event_id bigint,
  p_reason_code text
)
returns jsonb
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
    raise exception 'Primary completion reason is invalid.';
  end if;
  select state.* into conversation
  from public.mock_interview_conversation_state as state
  join public.mock_interviews as interview on interview.id = state.mock_interview_id
  where state.mock_interview_id = p_mock_interview_id
    and state.user_id = current_user_id
    and interview.status = 'active'
  for update of state;
  if not found then
    raise exception 'Active interview conversation not found.' using errcode = '42501';
  end if;
  if conversation.lifecycle = 'primary_completed' then
    return jsonb_build_object('lifecycle', conversation.lifecycle);
  end if;
  if conversation.lifecycle <> 'primary_question'
    or conversation.primary_readiness <> 'ready' then
    raise exception 'The primary solution is not ready for completion.' using errcode = '55000';
  end if;
  if not exists (
    select 1 from public.realtime_interview_events as event
    join public.realtime_interview_sessions as session on session.id = event.session_id
    where event.id = p_transcript_event_id
      and event.user_id = current_user_id
      and session.mock_interview_id = p_mock_interview_id
      and event.event_type in ('user_transcript', 'assistant_transcript')
  ) then
    raise exception 'Owned transcript evidence not found.' using errcode = '42501';
  end if;
  update public.mock_interview_conversation_state
  set lifecycle = 'primary_completed',
    primary_readiness = 'completed',
    version = version + 1
  where mock_interview_id = p_mock_interview_id
  returning * into conversation;
  insert into public.mock_interview_conversation_events (
    mock_interview_id, user_id, event_type, question_cycle,
    transcript_event_id, reason_code
  ) values (
    p_mock_interview_id, current_user_id, 'primary_completed', 'primary',
    p_transcript_event_id, p_reason_code
  );
  return jsonb_build_object('lifecycle', conversation.lifecycle);
end;
$$;

create function public.request_interview_follow_up(
  p_mock_interview_id uuid,
  p_reason_code text
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
  effective_elapsed integer;
  remaining_seconds integer;
  approved_prompt text;
  approved_content_version integer;
begin
  if current_user_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;
  if p_reason_code !~ '^[a-z][a-z0-9_]{2,63}$' then
    raise exception 'Follow-up request is invalid.';
  end if;
  select * into owned_interview from public.mock_interviews
  where id = p_mock_interview_id and user_id = current_user_id
    and status = 'active'
  for update;
  if not found then
    raise exception 'Active mock interview not found.' using errcode = '42501';
  end if;
  select follow_up.prompt, follow_up.content_version
    into approved_prompt, approved_content_version
  from public.approved_interview_follow_ups as follow_up
  where follow_up.problem_id = owned_interview.problem_id
    and (
      owned_interview.question_content_version is null
      or follow_up.content_version = owned_interview.question_content_version
    )
    and follow_up.active;
  if approved_prompt is null then
    raise exception 'Approved follow-up is unavailable.' using errcode = '55000';
  end if;
  select * into conversation from public.mock_interview_conversation_state
  where mock_interview_id = p_mock_interview_id and user_id = current_user_id
  for update;
  if conversation.lifecycle = 'follow_up' then
    return jsonb_build_object(
      'allowed', true,
      'followUpPrompt', conversation.follow_up_prompt,
      'lifecycle', conversation.lifecycle,
      'remainingSeconds', greatest(0, owned_interview.duration_minutes * 60 - owned_interview.elapsed_seconds)
    );
  end if;
  if conversation.lifecycle <> 'primary_completed'
    or conversation.follow_up_started_at is not null then
    raise exception 'Follow-up is not available.' using errcode = '55000';
  end if;
  effective_elapsed := greatest(
    owned_interview.elapsed_seconds,
    case when owned_interview.timer_running then least(
      14400,
      floor(extract(epoch from (now() - owned_interview.started_at)))::integer
    ) else owned_interview.elapsed_seconds end
  );
  remaining_seconds := greatest(
    0, owned_interview.duration_minutes * 60 - effective_elapsed
  );
  insert into public.mock_interview_conversation_events (
    mock_interview_id, user_id, event_type, question_cycle, reason_code,
    details
  ) values (
    p_mock_interview_id, current_user_id, 'follow_up_requested', 'primary',
    p_reason_code, jsonb_build_object('remainingSeconds', remaining_seconds)
  );
  if remaining_seconds < 600 then
    insert into public.mock_interview_conversation_events (
      mock_interview_id, user_id, event_type, question_cycle, reason_code,
      details
    ) values (
      p_mock_interview_id, current_user_id, 'follow_up_rejected_time',
      'primary', 'time_below_threshold',
      jsonb_build_object('remainingSeconds', remaining_seconds)
    );
    return jsonb_build_object(
      'allowed', false,
      'lifecycle', conversation.lifecycle,
      'remainingSeconds', remaining_seconds
    );
  end if;
  update public.mock_interview_conversation_state
  set lifecycle = 'follow_up', question_cycle = 'follow_up',
    current_phase = 'clarify', phase_source = 'product_event',
    phase_transcript_event_id = null,
    follow_up_prompt = approved_prompt,
    follow_up_content_version = approved_content_version,
    follow_up_started_at = now(), version = version + 1
  where mock_interview_id = p_mock_interview_id
  returning * into conversation;
  insert into public.mock_interview_conversation_events (
    mock_interview_id, user_id, event_type, question_cycle, phase,
    reason_code, details
  ) values (
    p_mock_interview_id, current_user_id, 'follow_up_started', 'follow_up',
    'clarify', p_reason_code,
    jsonb_build_object('remainingSeconds', remaining_seconds,
      'contentVersion', approved_content_version)
  );
  return jsonb_build_object(
    'allowed', true,
    'followUpPrompt', conversation.follow_up_prompt,
    'lifecycle', conversation.lifecycle,
    'questionCycle', conversation.question_cycle,
    'remainingSeconds', remaining_seconds
  );
end;
$$;

create function public.complete_follow_up_interview_question(
  p_mock_interview_id uuid,
  p_transcript_event_id bigint,
  p_reason_code text
)
returns jsonb
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
    raise exception 'Follow-up completion reason is invalid.';
  end if;
  select state.* into conversation
  from public.mock_interview_conversation_state as state
  join public.mock_interviews as interview on interview.id = state.mock_interview_id
  where state.mock_interview_id = p_mock_interview_id
    and state.user_id = current_user_id and interview.status = 'active'
  for update of state;
  if conversation.lifecycle = 'follow_up_completed' then
    return jsonb_build_object('lifecycle', conversation.lifecycle);
  end if;
  if conversation.lifecycle <> 'follow_up' then
    raise exception 'Active follow-up not found.' using errcode = '55000';
  end if;
  if not exists (
    select 1 from public.realtime_interview_events as event
    join public.realtime_interview_sessions as session on session.id = event.session_id
    where event.id = p_transcript_event_id and event.user_id = current_user_id
      and event.question_cycle = 'follow_up'
      and event.event_type in ('user_transcript', 'assistant_transcript')
      and session.mock_interview_id = p_mock_interview_id
  ) then
    raise exception 'Owned follow-up evidence not found.' using errcode = '42501';
  end if;
  update public.mock_interview_conversation_state
  set lifecycle = 'follow_up_completed', version = version + 1
  where mock_interview_id = p_mock_interview_id
  returning * into conversation;
  insert into public.mock_interview_conversation_events (
    mock_interview_id, user_id, event_type, question_cycle,
    transcript_event_id, reason_code
  ) values (
    p_mock_interview_id, current_user_id, 'follow_up_completed', 'follow_up',
    p_transcript_event_id, p_reason_code
  );
  return jsonb_build_object('lifecycle', conversation.lifecycle);
end;
$$;

create function public.conclude_realtime_mock_interview(
  p_mock_interview_id uuid,
  p_reason_code text
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
  effective_elapsed integer;
  normalized_reason text;
begin
  if current_user_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;
  normalized_reason := case
    when p_reason_code in (
      'enough_evidence', 'time_low', 'primary_complete',
      'follow_up_complete', 'provider_limit', 'learner_requested'
    ) then p_reason_code else null end;
  if normalized_reason is null then
    raise exception 'Conclusion reason is invalid.';
  end if;
  select * into owned_interview from public.mock_interviews
  where id = p_mock_interview_id and user_id = current_user_id
    and status = 'active'
  for update;
  if not found then
    raise exception 'Active mock interview not found.' using errcode = '42501';
  end if;
  select * into conversation from public.mock_interview_conversation_state
  where mock_interview_id = p_mock_interview_id and user_id = current_user_id
  for update;
  if conversation.lifecycle = 'concluding' then
    return jsonb_build_object(
      'lifecycle', conversation.lifecycle,
      'questionCycle', conversation.question_cycle,
      'remainingSeconds', greatest(0,
        owned_interview.duration_minutes * 60 - owned_interview.elapsed_seconds)
    );
  end if;
  effective_elapsed := greatest(
    owned_interview.elapsed_seconds,
    case when owned_interview.timer_running then least(
      14400,
      floor(extract(epoch from (now() - owned_interview.started_at)))::integer
    ) else owned_interview.elapsed_seconds end
  );
  update public.mock_interview_conversation_state
  set lifecycle = 'concluding', conclusion_reason = normalized_reason,
    current_phase = 'retrospective', phase_source = 'product_event',
    phase_transcript_event_id = null, version = version + 1
  where mock_interview_id = p_mock_interview_id
  returning * into conversation;
  insert into public.mock_interview_conversation_events (
    mock_interview_id, user_id, event_type, question_cycle, phase,
    reason_code, details
  ) values (
    p_mock_interview_id, current_user_id, 'conclusion_requested',
    conversation.question_cycle, 'retrospective', normalized_reason,
    jsonb_build_object('elapsedSeconds', effective_elapsed)
  );
  update public.mock_interviews
  set phase = 'retrospective', timer_running = false,
    elapsed_seconds = effective_elapsed
  where id = p_mock_interview_id;
  return jsonb_build_object(
    'lifecycle', conversation.lifecycle,
    'questionCycle', conversation.question_cycle,
    'remainingSeconds', greatest(0,
      owned_interview.duration_minutes * 60 - effective_elapsed)
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
    'connectionCount', state.connection_count,
    'conversationLifecycle', state.lifecycle,
    'durationMinutes', interview.duration_minutes,
    'elapsedSeconds', interview.elapsed_seconds,
    'followUpPrompt', state.follow_up_prompt,
    'id', interview.id,
    'interviewLanguage', interview.interview_language,
    'interviewerLevel', interview.interviewer_level,
    'observedPhase', coalesce(state.current_phase, observation.observed_phase),
    'observedPhaseEventId', coalesce(
      state.phase_transcript_event_id, observation.transcript_event_id
    )::text,
    'phase', interview.phase,
    'primaryReadiness', state.primary_readiness,
    'questionContentKey', pg_catalog.md5(
      problem.slug || ':mock-interview-active-v1:8f4d23ac'
    ),
    'questionContentVersion', interview.question_content_version,
    'questionCycle', state.question_cycle,
    'scratchpad', interview.scratchpad,
    'startedAt', interview.started_at,
    'timerRunning', interview.timer_running,
    'voiceActivated', interview.voice_activated_at is not null,
    'workspaceVersion', interview.workspace_version
  )
  from public.mock_interviews as interview
  join public.problems as problem on problem.id = interview.problem_id
  join public.mock_interview_conversation_state as state
    on state.mock_interview_id = interview.id
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

revoke all on function public.initialize_mock_interview_conversation_state() from public;
revoke all on function public.sync_code_submission_conversation_stage() from public;
revoke all on function public.prepare_realtime_interview_connection(uuid) from public;
revoke all on function public.record_live_interview_stage(uuid, bigint, text, text, text, text) from public;
revoke all on function public.record_interview_solution_readiness(uuid, bigint, boolean, boolean, boolean, boolean, boolean, boolean, text) from public;
revoke all on function public.complete_primary_interview_question(uuid, bigint, text) from public;
revoke all on function public.request_interview_follow_up(uuid, text) from public;
revoke all on function public.complete_follow_up_interview_question(uuid, bigint, text) from public;
revoke all on function public.conclude_realtime_mock_interview(uuid, text) from public;
grant execute on function public.prepare_realtime_interview_connection(uuid) to authenticated;
grant execute on function public.record_live_interview_stage(uuid, bigint, text, text, text, text) to authenticated;
grant execute on function public.record_interview_solution_readiness(uuid, bigint, boolean, boolean, boolean, boolean, boolean, boolean, text) to authenticated;
grant execute on function public.complete_primary_interview_question(uuid, bigint, text) to authenticated;
grant execute on function public.request_interview_follow_up(uuid, text) to authenticated;
grant execute on function public.complete_follow_up_interview_question(uuid, bigint, text) to authenticated;
grant execute on function public.conclude_realtime_mock_interview(uuid, text) to authenticated;
grant execute on function public.get_owned_active_mock_interview(uuid) to authenticated;
