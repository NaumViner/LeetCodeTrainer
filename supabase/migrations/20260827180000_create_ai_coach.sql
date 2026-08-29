create table public.ai_coach_interactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  attempt_id uuid not null references public.attempts (id) on delete cascade,
  interaction_type text not null check (interaction_type in (
    'hint', 'pattern_analysis', 'complexity_feedback',
    'attempt_analysis', 'review_card'
  )),
  status text not null default 'pending'
    check (status in ('pending', 'completed', 'fallback', 'failed')),
  provider text not null check (char_length(provider) between 2 and 40),
  model text not null check (char_length(model) between 1 and 120),
  response jsonb,
  input_tokens integer not null default 0 check (input_tokens between 0 and 1000000),
  output_tokens integer not null default 0 check (output_tokens between 0 and 1000000),
  total_tokens integer not null default 0 check (total_tokens between 0 and 2000000),
  error_code text check (error_code is null or char_length(error_code) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (response is null or octet_length(response::text) <= 16384),
  check (
    (status = 'pending' and response is null and error_code is null)
    or (status in ('completed', 'fallback') and response is not null)
    or (status = 'failed' and error_code is not null)
  )
);

create index ai_coach_interactions_user_created_idx
  on public.ai_coach_interactions (user_id, created_at desc);
create index ai_coach_interactions_attempt_type_idx
  on public.ai_coach_interactions (attempt_id, interaction_type, created_at desc);

create trigger ai_coach_interactions_set_updated_at
before update on public.ai_coach_interactions
for each row execute procedure public.set_updated_at();

create function public.reserve_ai_coach_interaction(
  p_attempt_id uuid,
  p_interaction_type text,
  p_provider text,
  p_model text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  interaction_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;
  if p_interaction_type not in (
    'hint', 'pattern_analysis', 'complexity_feedback',
    'attempt_analysis', 'review_card'
  ) or char_length(p_provider) not between 2 and 40
    or char_length(p_model) not between 1 and 120 then
    raise exception 'AI coach request is invalid.';
  end if;
  if not exists (
    select 1 from public.attempts
    where id = p_attempt_id and user_id = current_user_id
  ) then
    raise exception 'Practice attempt not found.' using errcode = '42501';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('ai-coach:' || current_user_id::text, 0)
  );
  if (
    select count(*) from public.ai_coach_interactions
    where user_id = current_user_id and created_at >= now() - interval '24 hours'
  ) >= 20 then
    raise exception 'Daily AI coach limit reached.' using errcode = 'P0001';
  end if;

  insert into public.ai_coach_interactions (
    user_id, attempt_id, interaction_type, provider, model
  ) values (
    current_user_id, p_attempt_id, p_interaction_type, p_provider, p_model
  ) returning id into interaction_id;
  return interaction_id;
end;
$$;

create function public.finish_ai_coach_interaction(
  p_interaction_id uuid,
  p_status text,
  p_response jsonb,
  p_input_tokens integer,
  p_output_tokens integer,
  p_total_tokens integer,
  p_error_code text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
begin
  if current_user_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;
  if p_status not in ('completed', 'fallback', 'failed')
    or p_input_tokens not between 0 and 1000000
    or p_output_tokens not between 0 and 1000000
    or p_total_tokens not between 0 and 2000000
    or p_total_tokens < p_input_tokens + p_output_tokens
    or (p_status in ('completed', 'fallback') and p_response is null)
    or (p_status = 'failed' and nullif(trim(coalesce(p_error_code, '')), '') is null)
    or (p_response is not null and octet_length(p_response::text) > 16384) then
    raise exception 'AI coach result is invalid.';
  end if;

  update public.ai_coach_interactions
  set status = p_status,
    response = case when p_status = 'failed' then null else p_response end,
    input_tokens = p_input_tokens,
    output_tokens = p_output_tokens,
    total_tokens = p_total_tokens,
    error_code = case when p_status = 'failed' then p_error_code else null end
  where id = p_interaction_id and user_id = current_user_id and status = 'pending';
  if not found then
    raise exception 'Pending AI coach request not found.' using errcode = '42501';
  end if;
end;
$$;

alter table public.ai_coach_interactions enable row level security;
alter table public.ai_coach_interactions force row level security;

revoke all on table public.ai_coach_interactions from anon, authenticated;
grant select on table public.ai_coach_interactions to authenticated;

create policy "Learners can read their own AI coach interactions"
  on public.ai_coach_interactions for select to authenticated
  using ((select auth.uid()) = user_id);

revoke all on function public.reserve_ai_coach_interaction(uuid, text, text, text) from public;
revoke all on function public.finish_ai_coach_interaction(uuid, text, jsonb, integer, integer, integer, text) from public;
grant execute on function public.reserve_ai_coach_interaction(uuid, text, text, text) to authenticated;
grant execute on function public.finish_ai_coach_interaction(uuid, text, jsonb, integer, integer, integer, text) to authenticated;
