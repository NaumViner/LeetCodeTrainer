create function public.get_recent_active_interview_transcript(
  p_mock_interview_id uuid,
  p_limit integer default 6
)
returns jsonb
language sql
security definer
set search_path = ''
stable
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', recent.id::text,
        'role', case
          when recent.event_type = 'user_transcript' then 'learner'
          else 'interviewer'
        end,
        'text', recent.content
      )
      order by recent.id
    ),
    '[]'::jsonb
  )
  from (
    select event.id, event.event_type, event.content
    from public.realtime_interview_events as event
    join public.realtime_interview_sessions as session
      on session.id = event.session_id
    join public.mock_interviews as interview
      on interview.id = session.mock_interview_id
    where interview.id = p_mock_interview_id
      and interview.user_id = (select auth.uid())
      and interview.status = 'active'
      and event.event_type in ('user_transcript', 'assistant_transcript')
    order by event.id desc
    limit least(greatest(coalesce(p_limit, 6), 1), 6)
  ) as recent
$$;

revoke all on function public.get_recent_active_interview_transcript(uuid, integer)
  from public;
grant execute on function public.get_recent_active_interview_transcript(uuid, integer)
  to authenticated;
