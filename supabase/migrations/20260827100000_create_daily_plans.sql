create table public.daily_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  local_date date not null,
  available_minutes integer not null check (
    available_minutes between 30 and 240 and available_minutes % 5 = 0
  ),
  generated_at timestamptz not null default now(),
  generation integer not null default 1 check (generation >= 1),
  status text not null default 'active'
    check (status in ('active', 'completed', 'expired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index daily_plans_one_active_day_idx
  on public.daily_plans (user_id, local_date)
  where status = 'active';
create index daily_plans_user_date_idx
  on public.daily_plans (user_id, local_date desc, generation desc);

create table public.daily_plan_items (
  id uuid primary key default gen_random_uuid(),
  daily_plan_id uuid not null references public.daily_plans (id) on delete cascade,
  type text not null check (
    type in (
      'lesson', 'problem', 'review_problem', 'review_card',
      'mock_interview', 'reflection'
    )
  ),
  entity_id uuid,
  title text not null check (char_length(title) between 2 and 160),
  estimated_minutes integer not null check (
    estimated_minutes between 5 and 180 and estimated_minutes % 5 = 0
  ),
  priority integer not null check (priority between 0 and 1000),
  position smallint not null check (position between 1 and 6),
  action_path text not null check (
    action_path ~ '^/[A-Za-z0-9]' and char_length(action_path) <= 500
  ),
  reason text not null check (char_length(reason) between 5 and 500),
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (daily_plan_id, position),
  check (
    (completed and completed_at is not null)
    or (not completed and completed_at is null)
  ),
  check (
    (type = 'reflection' and entity_id is null)
    or (type <> 'reflection' and entity_id is not null)
  )
);

create index daily_plan_items_plan_position_idx
  on public.daily_plan_items (daily_plan_id, position);

create trigger daily_plans_set_updated_at
before update on public.daily_plans
for each row execute procedure public.set_updated_at();

create trigger daily_plan_items_set_updated_at
before update on public.daily_plan_items
for each row execute procedure public.set_updated_at();

create function public.replace_daily_plan(
  p_local_date date,
  p_available_minutes integer,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  new_plan_id uuid;
  next_generation integer;
  item_count integer;
  planned_minutes integer;
begin
  if current_user_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;
  if p_local_date < current_date - 1 or p_local_date > current_date + 1 then
    raise exception 'The daily-plan date is outside the allowed local-day window.';
  end if;
  if p_available_minutes < 30
    or p_available_minutes > 240
    or p_available_minutes % 5 <> 0 then
    raise exception 'Available minutes must be a five-minute value from 30 to 240.';
  end if;
  if jsonb_typeof(p_items) <> 'array'
    or jsonb_array_length(p_items) < 3
    or jsonb_array_length(p_items) > 6 then
    raise exception 'A daily plan must contain three to six items.';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(current_user_id::text || ':' || p_local_date::text, 0)
  );

  select coalesce(max(generation), 0) + 1
  into next_generation
  from public.daily_plans
  where user_id = current_user_id and local_date = p_local_date;

  update public.daily_plans
  set status = 'expired'
  where user_id = current_user_id
    and local_date = p_local_date
    and status = 'active';

  insert into public.daily_plans (
    user_id, local_date, available_minutes, generation
  ) values (
    current_user_id, p_local_date, p_available_minutes, next_generation
  )
  returning id into new_plan_id;

  insert into public.daily_plan_items (
    daily_plan_id, type, entity_id, title, estimated_minutes, priority,
    position, action_path, reason
  )
  select
    new_plan_id, item.type, item.entity_id, item.title,
    item.estimated_minutes, item.priority, item.position,
    item.action_path, item.reason
  from jsonb_to_recordset(p_items) as item(
    type text,
    entity_id uuid,
    title text,
    estimated_minutes integer,
    priority integer,
    position smallint,
    action_path text,
    reason text
  );

  select count(*), coalesce(sum(estimated_minutes), 0)
  into item_count, planned_minutes
  from public.daily_plan_items
  where daily_plan_id = new_plan_id;

  if item_count <> jsonb_array_length(p_items)
    or planned_minutes > p_available_minutes then
    raise exception 'The generated plan exceeds its item or time budget.';
  end if;
  if exists (
    select 1
    from public.daily_plan_items item
    where item.daily_plan_id = new_plan_id
      and item.type = 'lesson'
      and not exists (
        select 1 from public.lessons
        where lessons.id = item.entity_id and lessons.active
      )
  ) then
    raise exception 'The generated plan contains an unavailable lesson.';
  end if;
  if exists (
    select 1
    from public.daily_plan_items item
    where item.daily_plan_id = new_plan_id
      and item.type in ('problem', 'review_problem')
      and not exists (
        select 1 from public.problems
        where problems.id = item.entity_id and problems.active
      )
  ) then
    raise exception 'The generated plan contains an unavailable problem.';
  end if;

  return new_plan_id;
end;
$$;

create function public.set_daily_plan_item_completed(
  p_item_id uuid,
  p_completed boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  owned_plan_id uuid;
  owned_plan_status text;
begin
  if current_user_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  select plan.id, plan.status
  into owned_plan_id, owned_plan_status
  from public.daily_plan_items item
  join public.daily_plans plan on plan.id = item.daily_plan_id
  where item.id = p_item_id and plan.user_id = current_user_id
  for update of plan;

  if owned_plan_id is null then
    raise exception 'Daily-plan item not found.' using errcode = '42501';
  end if;
  if owned_plan_status = 'expired' then
    raise exception 'Expired daily plans cannot be changed.';
  end if;

  update public.daily_plan_items
  set
    completed = p_completed,
    completed_at = case when p_completed then now() else null end
  where id = p_item_id;

  update public.daily_plans
  set status = case
    when exists (
      select 1 from public.daily_plan_items
      where daily_plan_id = owned_plan_id and not completed
    ) then 'active'
    else 'completed'
  end
  where id = owned_plan_id;
end;
$$;

alter table public.daily_plans enable row level security;
alter table public.daily_plans force row level security;
alter table public.daily_plan_items enable row level security;
alter table public.daily_plan_items force row level security;

revoke all on table public.daily_plans from anon, authenticated;
revoke all on table public.daily_plan_items from anon, authenticated;
grant select on table public.daily_plans to authenticated;
grant select on table public.daily_plan_items to authenticated;

create policy "Learners can read their own daily plans"
  on public.daily_plans
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Learners can read their own daily plan items"
  on public.daily_plan_items
  for select
  to authenticated
  using (
    exists (
      select 1 from public.daily_plans
      where daily_plans.id = daily_plan_items.daily_plan_id
        and daily_plans.user_id = (select auth.uid())
    )
  );

revoke all on function public.replace_daily_plan(date, integer, jsonb) from public;
revoke all on function public.set_daily_plan_item_completed(uuid, boolean) from public;
grant execute on function public.replace_daily_plan(date, integer, jsonb) to authenticated;
grant execute on function public.set_daily_plan_item_completed(uuid, boolean) to authenticated;
