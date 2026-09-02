drop policy if exists realtime_interview_events_select_own
  on public.realtime_interview_events;
create policy realtime_interview_events_select_completed_own
  on public.realtime_interview_events for select to authenticated
  using (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.realtime_interview_sessions as session
      join public.mock_interviews as interview
        on interview.id = session.mock_interview_id
      where session.id = realtime_interview_events.session_id
        and interview.user_id = (select auth.uid())
        and interview.status = 'completed'
    )
  );

drop policy if exists mock_interview_phase_events_select_own
  on public.mock_interview_phase_events;
create policy mock_interview_phase_events_select_completed_own
  on public.mock_interview_phase_events for select to authenticated
  using (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.mock_interviews as interview
      where interview.id = mock_interview_phase_events.mock_interview_id
        and interview.user_id = (select auth.uid())
        and interview.status = 'completed'
    )
  );

drop policy if exists mock_interview_code_submissions_select_own
  on public.mock_interview_code_submissions;
create policy mock_interview_code_submissions_select_completed_own
  on public.mock_interview_code_submissions for select to authenticated
  using (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.mock_interviews as interview
      where interview.id = mock_interview_code_submissions.mock_interview_id
        and interview.user_id = (select auth.uid())
        and interview.status = 'completed'
    )
  );
