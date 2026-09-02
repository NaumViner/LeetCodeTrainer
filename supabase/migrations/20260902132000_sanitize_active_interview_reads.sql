create function public.get_active_mock_interview_id()
returns uuid
language sql
security definer
set search_path = ''
stable
as $$
  select interview.id
  from public.mock_interviews as interview
  where interview.user_id = (select auth.uid())
    and interview.status = 'active'
  limit 1
$$;

create function public.get_owned_active_mock_interview(
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
  where interview.id = p_mock_interview_id
    and interview.user_id = (select auth.uid())
    and interview.status = 'active'
$$;

create or replace function public.abandon_mock_interview(
  p_mock_interview_id uuid
)
returns void
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
  where id = p_mock_interview_id
    and user_id = current_user_id
    and status = 'active'
  for update;
  if not found then
    raise exception 'Active mock interview not found.' using errcode = '42501';
  end if;

  if owned_interview.voice_required
    and owned_interview.voice_activated_at is null then
    delete from public.mock_interviews where id = owned_interview.id;
    return;
  end if;

  update public.mock_interviews
  set status = 'abandoned',
    result = 'abandoned',
    timer_running = false,
    elapsed_seconds = greatest(
      elapsed_seconds,
      case
        when timer_running then least(
          14400,
          floor(extract(epoch from (now() - started_at)))::integer
        )
        else elapsed_seconds
      end
    ),
    completed_at = now()
  where id = owned_interview.id;
end;
$$;

drop policy if exists "Learners can read their own mock interviews"
  on public.mock_interviews;
create policy mock_interviews_select_finished_own
  on public.mock_interviews for select to authenticated
  using (
    (select auth.uid()) = user_id
    and status in ('completed', 'abandoned')
  );

revoke all on function public.get_active_mock_interview_id() from public;
revoke all on function public.get_owned_active_mock_interview(uuid) from public;
revoke all on function public.abandon_mock_interview(uuid) from public;
grant execute on function public.get_active_mock_interview_id() to authenticated;
grant execute on function public.get_owned_active_mock_interview(uuid) to authenticated;
grant execute on function public.abandon_mock_interview(uuid) to authenticated;
