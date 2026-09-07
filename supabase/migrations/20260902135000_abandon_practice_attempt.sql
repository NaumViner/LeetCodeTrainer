create function public.abandon_practice_attempt(
  p_attempt_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  owned_attempt public.attempts%rowtype;
  final_duration_seconds integer;
begin
  if current_user_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  select * into owned_attempt
  from public.attempts
  where id = p_attempt_id
    and user_id = current_user_id
    and status = 'started'
  for update;

  if not found then
    raise exception 'Active practice attempt not found.' using errcode = '42501';
  end if;

  final_duration_seconds := least(
    86400,
    owned_attempt.duration_seconds + case
      when owned_attempt.timer_running and owned_attempt.timer_started_at is not null
        then greatest(
          0,
          floor(extract(epoch from (now() - owned_attempt.timer_started_at)))::integer
        )
      else 0
    end
  );

  update public.attempts
  set completed_at = now(),
    duration_seconds = final_duration_seconds,
    result = 'abandoned',
    status = 'abandoned',
    timer_running = false,
    timer_started_at = null
  where id = owned_attempt.id;

  return jsonb_build_object(
    'attemptId', owned_attempt.id,
    'durationSeconds', final_duration_seconds,
    'status', 'abandoned'
  );
end;
$$;

revoke all on function public.abandon_practice_attempt(uuid) from public;
grant execute on function public.abandon_practice_attempt(uuid) to authenticated;
