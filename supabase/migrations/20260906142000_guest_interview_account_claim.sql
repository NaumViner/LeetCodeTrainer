create table interview_private.guest_claims (
  guest_user_id uuid primary key references auth.users(id) on delete cascade,
  interview_id uuid not null references public.mock_interviews(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  claimed_by uuid references auth.users(id) on delete cascade,
  claimed_at timestamptz
);
alter table interview_private.guest_claims enable row level security;
alter table interview_private.guest_claims force row level security;
revoke all on interview_private.guest_claims from public, anon, authenticated;

create function public.prepare_guest_interview_claim()
returns text language plpgsql security definer set search_path = '' as $$
declare owned public.mock_interviews%rowtype; raw_token text;
begin
  if not exists(select 1 from auth.users where id = (select auth.uid()) and is_anonymous) then return null; end if;
  select * into owned from public.mock_interviews where user_id = (select auth.uid())
    and status in ('completed','abandoned') order by completed_at desc limit 1 for update;
  if not found then return null; end if;
  raw_token := encode(extensions.gen_random_bytes(32),'hex');
  insert into interview_private.guest_claims(guest_user_id, interview_id, token_hash, expires_at)
  values(owned.user_id, owned.id, encode(extensions.digest(raw_token,'sha256'),'hex'), now() + interval '15 minutes')
  on conflict(guest_user_id) do update set interview_id = excluded.interview_id,
    token_hash = excluded.token_hash, expires_at = excluded.expires_at,
    claimed_by = null, claimed_at = null;
  return raw_token;
end;
$$;

-- Only an in-flight, authenticated claim may change the owner of a finalized
-- evaluation. Every evidence field remains byte-for-byte unchanged.
create or replace function public.prevent_finalized_interview_evaluation_update()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.status <> 'pending' then
    if new.user_id is distinct from old.user_id
      and to_jsonb(new) - 'user_id' = to_jsonb(old) - 'user_id'
      and exists(select 1 from interview_private.guest_claims
        where guest_user_id = old.user_id and claimed_by = new.user_id
          and interview_id = old.mock_interview_id and claimed_at = transaction_timestamp()
          and claimed_by = (select auth.uid())) then return new; end if;
    raise exception 'Completed interview evaluations are immutable.';
  end if;
  return new;
end;
$$;

create function public.claim_guest_interview(p_token text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare claim interview_private.guest_claims%rowtype; target_id uuid := (select auth.uid());
  owned public.mock_interviews%rowtype; related_table text;
begin
  if not public.is_registered_interview_user() or p_token is null or p_token !~ '^[a-f0-9]{64}$' then
    raise exception 'Verified account and guest proof required.' using errcode = '42501';
  end if;
  select * into claim from interview_private.guest_claims
    where token_hash = encode(extensions.digest(p_token,'sha256'),'hex') for update;
  if not found then raise exception 'Guest claim unavailable.' using errcode = '42501'; end if;
  if claim.claimed_by = target_id then return claim.interview_id; end if;
  if claim.claimed_by is not null or claim.expires_at <= now() then
    raise exception 'Guest claim expired or already used.' using errcode = '42501';
  end if;
  -- Serialize with account upgrades and cleanup; never take data from a member.
  perform 1 from auth.users where id = claim.guest_user_id and is_anonymous for update;
  if not found and claim.guest_user_id <> target_id then
    raise exception 'Source account is no longer a guest.' using errcode = '42501';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('interview-evaluation:' || claim.interview_id::text,0));
  select * into owned from public.mock_interviews where id = claim.interview_id
    and user_id = claim.guest_user_id and status in ('completed','abandoned') for update;
  if not found then raise exception 'Finished guest interview unavailable.' using errcode = '42501'; end if;
  if exists(select 1 from public.mock_interview_evaluations where mock_interview_id = owned.id and status = 'pending') then
    raise exception 'The interview evaluation is still being saved.' using errcode = '55P03';
  end if;
  update interview_private.guest_claims set claimed_by = target_id, claimed_at = transaction_timestamp()
    where guest_user_id = claim.guest_user_id;
  if claim.guest_user_id = target_id then return owned.id; end if;

  update public.realtime_interview_events set user_id = target_id
    where user_id = claim.guest_user_id and session_id in (
      select id from public.realtime_interview_sessions where mock_interview_id = owned.id
    );
  for related_table in select c.table_name from information_schema.columns c
    where c.table_schema = 'public' and c.column_name = 'user_id'
      and exists(select 1 from information_schema.columns other_column
        where other_column.table_schema = c.table_schema and other_column.table_name = c.table_name
          and other_column.column_name = 'mock_interview_id')
  loop
    execute format('update public.%I set user_id = $1 where mock_interview_id = $2 and user_id = $3', related_table)
      using target_id, owned.id, claim.guest_user_id;
  end loop;
  update public.mock_interviews set user_id = target_id where id = owned.id;
  insert into interview_private.interview_preferences(user_id, preferences)
    select target_id, preferences from interview_private.interview_preferences where user_id = claim.guest_user_id
    on conflict(user_id) do nothing;
  perform public.recompute_topic_mastery_from_evidence(target_id, owned.selected_topic_id);
  perform public.recompute_topic_mastery_from_evidence(claim.guest_user_id, owned.selected_topic_id);
  return owned.id;
end;
$$;

create function public.cleanup_expired_guest_interviews()
returns integer language plpgsql security definer set search_path = '' as $$
declare guest record; deleted_count integer := 0; affected integer;
begin
  -- Scheduled by the application with a service credential. User identities and
  -- trial consumption survive content cleanup, so deletion never refunds trials.
  for guest in select id from auth.users where is_anonymous order by id for update skip locked loop
    delete from public.mock_interviews where user_id = guest.id
      and status <> 'active' and completed_at < now() - interval '7 days';
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
revoke all on function public.prepare_guest_interview_claim() from public;
revoke all on function public.claim_guest_interview(text) from public;
revoke all on function public.cleanup_expired_guest_interviews() from public, anon, authenticated;
grant execute on function public.prepare_guest_interview_claim() to authenticated;
grant execute on function public.claim_guest_interview(text) to authenticated;
grant execute on function public.cleanup_expired_guest_interviews() to service_role;
