alter table public.mock_interviews
  add column interviewer_level text not null default 'beginner'
    check (interviewer_level in ('beginner', 'faang_tough'));

comment on column public.mock_interviews.interviewer_level is
  'Controls the live interviewer persona for the complete session.';

create function public.start_mock_interview(
  p_problem_id uuid,
  p_duration_minutes integer,
  p_difficulty_mode text,
  p_interviewer_level text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  new_interview_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;
  if p_interviewer_level not in ('beginner', 'faang_tough') then
    raise exception 'Interviewer level is invalid.';
  end if;

  new_interview_id := public.start_mock_interview(
    p_problem_id,
    p_duration_minutes,
    p_difficulty_mode
  );

  update public.mock_interviews
  set interviewer_level = p_interviewer_level
  where id = new_interview_id and user_id = current_user_id;

  return new_interview_id;
end;
$$;

revoke all on function public.start_mock_interview(uuid, integer, text, text) from public;
grant execute on function public.start_mock_interview(uuid, integer, text, text) to authenticated;
