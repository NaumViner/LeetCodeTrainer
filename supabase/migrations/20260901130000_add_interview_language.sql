alter table public.mock_interviews
  add column interview_language text not null default 'auto'
    check (interview_language in ('auto', 'english', 'hebrew'));

comment on column public.mock_interviews.interview_language is
  'Controls spoken interview language independently from coding language.';

create function public.start_mock_interview(
  p_problem_id uuid,
  p_duration_minutes integer,
  p_difficulty_mode text,
  p_interviewer_level text,
  p_interview_language text
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
  if p_interview_language not in ('auto', 'english', 'hebrew') then
    raise exception 'Interview language is invalid.';
  end if;

  new_interview_id := public.start_mock_interview(
    p_problem_id,
    p_duration_minutes,
    p_difficulty_mode,
    p_interviewer_level
  );

  update public.mock_interviews
  set interview_language = p_interview_language
  where id = new_interview_id and user_id = current_user_id;

  return new_interview_id;
end;
$$;

revoke all on function public.start_mock_interview(uuid, integer, text, text, text) from public;
grant execute on function public.start_mock_interview(uuid, integer, text, text, text) to authenticated;
