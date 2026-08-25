create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  preferred_language text not null default 'python'
    check (preferred_language in ('java', 'python', 'cpp', 'javascript', 'typescript')),
  target_role text not null default 'new_grad'
    check (target_role in ('intern', 'new_grad', 'junior', 'mid_level', 'senior')),
  target_companies text[] not null default '{}',
  interview_date date,
  weekly_study_minutes integer not null default 300
    check (weekly_study_minutes between 30 and 10080),
  experience_level text not null default 'basic_programming'
    check (
      experience_level in (
        'complete_beginner',
        'basic_programming',
        'some_leetcode',
        'active_interview_prep',
        'experienced'
      )
    ),
  timezone text not null default 'UTC'
    check (char_length(timezone) between 1 and 100),
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint profiles_display_name_length
    check (display_name is null or char_length(display_name) between 1 and 80),
  constraint profiles_target_companies_limit
    check (cardinality(target_companies) <= 20)
);

comment on table public.profiles is 'Private learner settings and onboarding state.';

alter table public.profiles enable row level security;
alter table public.profiles force row level security;

revoke all on table public.profiles from anon, authenticated;
grant select, update on table public.profiles to authenticated;

create policy "Learners can read their own profile"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "Learners can update their own profile"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
