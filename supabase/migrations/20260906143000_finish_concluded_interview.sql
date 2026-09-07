-- A voice interview can finish without inventing a learner-selected outcome or
-- self-ratings. The existing evaluator uses the actual transcript and code.
do $$
declare constraint_name text;
begin
  select conname into strict constraint_name from pg_constraint
    where conrelid = 'public.mock_interviews'::regclass and contype = 'c'
      and pg_get_constraintdef(oid) like '%completed_at%'
      and pg_get_constraintdef(oid) like '%result%';
  execute format('alter table public.mock_interviews drop constraint %I', constraint_name);
end;
$$;
alter table public.mock_interviews add constraint mock_interviews_lifecycle_check check (
  (status = 'active' and completed_at is null and result is null and phase <> 'completed')
  or (status = 'completed' and completed_at is not null and phase = 'completed' and not timer_running
    and (result is null or result in ('solved','partial','failed')))
  or (status = 'abandoned' and completed_at is not null and result = 'abandoned' and phase <> 'completed' and not timer_running)
);

create function public.finish_concluded_mock_interview(p_mock_interview_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare owned public.mock_interviews%rowtype;
begin
  select * into owned from public.mock_interviews where id = p_mock_interview_id
    and user_id = (select auth.uid()) for update;
  if not found then raise exception 'Interview unavailable.' using errcode = '42501'; end if;
  if owned.status = 'completed' then return; end if;
  if owned.status <> 'active' or owned.phase <> 'retrospective' or owned.voice_activated_at is null
    or not exists(select 1 from public.mock_interview_conversation_state
      where mock_interview_id = owned.id and lifecycle = 'concluding') then
    raise exception 'The interviewer has not concluded this interview.' using errcode = '42501';
  end if;
  update public.mock_interviews set status = 'completed', phase = 'completed',
    timer_running = false, completed_at = now(), result = null where id = owned.id;
end;
$$;
revoke all on function public.finish_concluded_mock_interview(uuid) from public;
grant execute on function public.finish_concluded_mock_interview(uuid) to authenticated;
