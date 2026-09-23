-- A new attempt never overwrites finalized evidence. Only a successfully
-- finalized replacement changes which result is current.
create table interview_private.evaluation_promotions (
  evaluation_id uuid primary key references public.mock_interview_evaluations(id) on delete cascade,
  transaction_id bigint not null
);
alter table interview_private.evaluation_promotions enable row level security;
alter table interview_private.evaluation_promotions force row level security;
revoke all on interview_private.evaluation_promotions from public, anon, authenticated;

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
    if new.is_current is distinct from old.is_current
      and to_jsonb(new) - 'is_current' = to_jsonb(old) - 'is_current'
      and exists(select 1 from interview_private.evaluation_promotions p
        join public.mock_interview_evaluations e on e.id = p.evaluation_id
        where p.transaction_id = txid_current() and e.mock_interview_id = old.mock_interview_id
          and e.user_id = (select auth.uid())) then return new; end if;
    raise exception 'Completed interview evaluations are immutable.';
  end if;
  return new;
end;
$$;

create function public.retry_mock_interview_evaluation(
  p_mock_interview_id uuid, p_provider text, p_model text,
  p_evaluation_version integer, p_evidence_version integer
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  owned public.mock_interviews%rowtype;
  latest public.mock_interview_evaluations%rowtype;
  previous public.mock_interview_evaluations%rowtype;
  new_id uuid;
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('interview-evaluation:' || p_mock_interview_id::text, 0));
  select * into owned from public.mock_interviews where id = p_mock_interview_id
    and user_id = (select auth.uid()) and status = 'completed';
  if not found then raise exception 'Completed interview not found.' using errcode = '42501'; end if;
  if char_length(trim(coalesce(p_provider,''))) not between 1 and 40
    or char_length(trim(coalesce(p_model,''))) not between 1 and 120
    or p_evaluation_version is null or p_evaluation_version not between 1 and 1000
    or p_evidence_version is null or p_evidence_version not between 1 and 1000 then
    raise exception 'Invalid evaluation configuration.';
  end if;
  select * into latest from public.mock_interview_evaluations
    where mock_interview_id = owned.id order by version desc limit 1;
  if not found then
    return public.reserve_mock_interview_evaluation(owned.id,p_provider,p_model,p_evaluation_version,p_evidence_version);
  end if;
  if latest.status = 'pending' and latest.created_at <= now() - interval '3 minutes' then
    update public.mock_interview_evaluations set status = 'failed', error_code = 'lease_expired', completed_at = now()
      where id = latest.id;
    latest.status := 'failed';
  end if;
  select * into previous from public.mock_interview_evaluations where mock_interview_id = owned.id and is_current;
  if latest.status = 'pending' or previous.status = 'completed' or latest.version >= 3 then
    return jsonb_build_object('evaluationId',latest.id,'shouldEvaluate',latest.status = 'pending',
      'status',latest.status,'version',latest.version);
  end if;
  -- Quota-denied reservations do not create orphan pending attempts. The lease
  -- checks quotas again atomically before allowing a provider request.
  perform 1 from interview_private.launch_limits where id for update;
  if (select count(*) from interview_private.evaluation_requests where user_id = owned.user_id
      and created_at > now() - interval '10 minutes') >= 10
    or (select count(*) from interview_private.evaluation_requests
      where created_at >= date_trunc('day', now() at time zone 'UTC') at time zone 'UTC') >= 60 then
    return jsonb_build_object('evaluationId',latest.id,'shouldEvaluate',false,'status',latest.status,'version',latest.version);
  end if;
  insert into public.mock_interview_evaluations(mock_interview_id,user_id,version,is_current,
    provider,model,evaluation_version,evidence_version,source_difficulty,source_duration_minutes,
    source_interviewer_level,source_interview_language)
  values(owned.id,owned.user_id,latest.version + 1,false,trim(p_provider),trim(p_model),
    p_evaluation_version,p_evidence_version,latest.source_difficulty,latest.source_duration_minutes,
    latest.source_interviewer_level,latest.source_interview_language) returning id into new_id;
  return jsonb_build_object('evaluationId',new_id,'shouldEvaluate',true,'status','pending','version',latest.version + 1);
end;
$$;
revoke all on function public.retry_mock_interview_evaluation(uuid,text,text,integer,integer) from public;
grant execute on function public.retry_mock_interview_evaluation(uuid,text,text,integer,integer) to authenticated;

create or replace function public.reserve_interview_evaluation_request(p_evaluation_id uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare owned public.mock_interview_evaluations%rowtype;
begin
  select * into owned from public.mock_interview_evaluations where id = p_evaluation_id and user_id = (select auth.uid());
  if not found then return false; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('interview-evaluation:' || owned.mock_interview_id::text,0));
  select * into owned from public.mock_interview_evaluations where id = p_evaluation_id for update;
  if owned.status <> 'pending' then return false; end if;
  if owned.created_at <= now() - interval '3 minutes' then
    update public.mock_interview_evaluations set status = 'failed',completed_at = now(),error_code = 'lease_expired' where id = owned.id;
    return false;
  end if;
  -- One lease per immutable attempt; expiry never hands the same ID to a new worker.
  if exists(select 1 from interview_private.evaluation_requests where evaluation_id = owned.id) then return false; end if;
  perform 1 from interview_private.launch_limits where id for update;
  if (select count(*) from interview_private.evaluation_requests r join public.mock_interview_evaluations e on e.id = r.evaluation_id
      where e.mock_interview_id = owned.mock_interview_id) >= 3
    or (select count(*) from interview_private.evaluation_requests where user_id = owned.user_id and created_at > now() - interval '10 minutes') >= 10
    or (select count(*) from interview_private.evaluation_requests where created_at >= date_trunc('day',now() at time zone 'UTC') at time zone 'UTC') >= 60 then
    update public.mock_interview_evaluations set status = 'failed',completed_at = now(),error_code = 'quota_limit' where id = owned.id;
    return false;
  end if;
  insert into interview_private.evaluation_requests(evaluation_id,user_id) values(owned.id,owned.user_id);
  return true;
end;
$$;

create function public.promote_interview_evaluation_result()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.status = 'pending' and new.status in ('completed','provisional') and not new.is_current
    and not exists(select 1 from public.mock_interview_evaluations where mock_interview_id = new.mock_interview_id
      and is_current and (status = 'completed' or (status = 'provisional' and new.status <> 'completed'))) then
    insert into interview_private.evaluation_promotions values(new.id,txid_current());
    update public.mock_interview_evaluations set is_current = false where mock_interview_id = new.mock_interview_id and is_current;
    update public.mock_interview_evaluations set is_current = true where id = new.id;
    delete from interview_private.evaluation_promotions where evaluation_id = new.id;
  end if;
  return new;
end;
$$;
revoke all on function public.promote_interview_evaluation_result() from public;
create trigger promote_interview_evaluation_result after update on public.mock_interview_evaluations
  for each row execute function public.promote_interview_evaluation_result();

-- Keep existing payload validation. Add an interview lock and expiry fence to
-- finalization; old clients cannot finalize an expired or superseded worker.
do $$
declare definition text; marker text := '  update public.mock_interview_evaluations';
begin
  definition := pg_get_functiondef('public.finalize_mock_interview_evaluation(uuid,text,numeric,numeric,text,jsonb,text[],text[],text[],jsonb,jsonb,integer,integer,integer,text)'::regprocedure);
  if position(marker in definition) = 0 then raise exception 'Finalizer migration precondition failed.'; end if;
  definition := replace(definition, marker, $guard$
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('interview-evaluation:' || mock_interview_id::text,0))
    from public.mock_interview_evaluations where id = p_evaluation_id and user_id = current_user_id;
  if not exists(select 1 from public.mock_interview_evaluations where id = p_evaluation_id
      and user_id = current_user_id and status = 'pending' and created_at > now() - interval '3 minutes') then
    raise exception 'Evaluation attempt expired or unavailable.' using errcode = '42501';
  end if;
  update public.mock_interview_evaluations$guard$);
  execute definition;
  definition := pg_get_functiondef('public.claim_guest_interview(text)'::regprocedure);
  marker := '  if exists(select 1 from public.mock_interview_evaluations where mock_interview_id = owned.id and status = ''pending'') then';
  if position(marker in definition) = 0 then raise exception 'Guest claim migration precondition failed.'; end if;
  definition := replace(definition,marker,$guard$
  update public.mock_interview_evaluations set status = 'failed',completed_at = now(),error_code = 'lease_expired'
    where mock_interview_id = owned.id and status = 'pending' and created_at <= now() - interval '3 minutes';
$guard$ || marker);
  execute definition;
end;
$$;
