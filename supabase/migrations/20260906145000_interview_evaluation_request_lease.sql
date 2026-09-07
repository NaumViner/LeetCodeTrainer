-- A DB reservation must outlive the request transaction: parallel feedback
-- actions must not call the paid evaluator for the same pending evaluation.
create table interview_private.evaluation_requests (
  id bigint generated always as identity primary key,
  evaluation_id uuid not null references public.mock_interview_evaluations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index evaluation_requests_evaluation on interview_private.evaluation_requests(evaluation_id, created_at);
alter table interview_private.evaluation_requests enable row level security;
alter table interview_private.evaluation_requests force row level security;
revoke all on interview_private.evaluation_requests from public, anon, authenticated;

create function public.reserve_interview_evaluation_request(p_evaluation_id uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare owned public.mock_interview_evaluations%rowtype;
begin
  select * into owned from public.mock_interview_evaluations where id = p_evaluation_id
    and user_id = (select auth.uid()) and status = 'pending' for update;
  if not found then return false; end if;
  perform 1 from interview_private.launch_limits where id for update;
  if exists(select 1 from interview_private.evaluation_requests where evaluation_id = owned.id
    and created_at > now() - interval '3 minutes') then return false; end if;
  if (select count(*) from interview_private.evaluation_requests where evaluation_id = owned.id) >= 3 then
    update public.mock_interview_evaluations set status = 'failed', completed_at = now(), error_code = 'retry_limit' where id = owned.id;
    return false;
  end if;
  if (select count(*) from interview_private.evaluation_requests where user_id = owned.user_id
    and created_at > now() - interval '10 minutes') >= 10 then return false; end if;
  if (select count(*) from interview_private.evaluation_requests
    where created_at >= date_trunc('day', now() at time zone 'UTC') at time zone 'UTC') >= 60 then return false; end if;
  insert into interview_private.evaluation_requests(evaluation_id,user_id) values(owned.id,owned.user_id);
  return true;
end;
$$;
revoke all on function public.reserve_interview_evaluation_request(uuid) from public;
grant execute on function public.reserve_interview_evaluation_request(uuid) to authenticated;
