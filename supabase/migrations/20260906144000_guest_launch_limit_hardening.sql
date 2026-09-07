-- Count outstanding credential allocations as well as connected transports.
-- The launch-limit row lock serializes reservations across application servers.
do $$
declare definition text;
begin
  definition := pg_get_functiondef('public.reserve_interview_voice_request(uuid,uuid)'::regprocedure);
  definition := replace(definition,
    'and id <> owned.id and voice_last_heartbeat_at > now() - interval ''90 seconds''',
    'and id <> owned.id and (voice_last_heartbeat_at > now() - interval ''90 seconds''
      or exists(select 1 from interview_private.voice_requests request
        join public.mock_interview_conversation_state conversation
          on conversation.mock_interview_id = request.interview_id
        where request.interview_id = mock_interviews.id
          and request.attempt_id = conversation.pending_connection_attempt_id
          and conversation.pending_connection_expires_at > now()))');
  execute definition;
end;
$$;

-- Remove stale guest content even if the browser never returns to mark the
-- interview abandoned. Identity and consumed-trial records remain intact.
create or replace function public.cleanup_expired_guest_interviews()
returns integer language plpgsql security definer set search_path = '' as $$
declare guest record; deleted_count integer := 0; affected integer;
begin
  for guest in select id from auth.users where is_anonymous order by id for update skip locked loop
    delete from public.mock_interviews where user_id = guest.id and (
      (status <> 'active' and completed_at < now() - interval '7 days')
      or (status = 'active' and voice_activated_at is null and voice_activation_deadline < now())
      or (status = 'active' and started_at + make_interval(mins => duration_minutes + 10) < now() - interval '7 days')
    );
    get diagnostics affected = row_count;
    deleted_count := deleted_count + affected;
    if affected > 0 and not exists(select 1 from public.mock_interviews where user_id = guest.id) then
      delete from public.topic_mastery where user_id = guest.id;
    end if;
  end loop;
  delete from interview_private.guest_claims where expires_at < now() - interval '1 day';
  delete from interview_private.voice_requests where created_at < now() - interval '8 days';
  return deleted_count;
end;
$$;
