alter table public.problems
  add column interview_ready boolean not null default false,
  add column interview_content_version integer,
  add column interview_content_provenance text;

alter table public.problems
  add constraint problems_interview_content_state_check
  check (
    (
      not interview_ready
      and interview_content_version is null
      and interview_content_provenance is null
    )
    or (
      interview_ready
      and interview_content_version > 0
      and interview_content_provenance in ('first_party', 'licensed', 'user_supplied')
    )
  );

-- These prompts are authored in this repository and intentionally do not copy
-- third-party problem statements. One approved problem per canonical topic is
-- enough to enable full 18-topic Coverage while review expands incrementally.
update public.problems
set interview_ready = true,
  interview_content_version = 1,
  interview_content_provenance = 'first_party'
where slug in (
  'contains-duplicate',
  'valid-palindrome',
  'best-time-to-buy-and-sell-stock',
  'valid-parentheses',
  'binary-search',
  'reverse-linked-list',
  'serialize-and-deserialize-binary-tree',
  'implement-trie-prefix-tree',
  'kth-largest-element-in-a-stream',
  'subsets',
  'number-of-islands',
  'network-delay-time',
  'climbing-stairs',
  'unique-paths',
  'maximum-subarray',
  'insert-interval',
  'rotate-image',
  'single-number'
);

create index problems_interview_ready_idx
  on public.problems (primary_topic_id, difficulty, dataset_order)
  where active and interview_ready;

create or replace function public.validate_mock_interview_selection_snapshot()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_problem record;
begin
  select
    problem.primary_topic_id,
    problem.difficulty,
    problem.interview_ready,
    problem.interview_content_version
  into selected_problem
  from public.problems as problem
  where problem.id = new.problem_id;

  if not found then
    raise exception 'The interview problem is unavailable.';
  end if;

  if new.selection_mode <> 'legacy' then
    if not selected_problem.interview_ready
      or selected_problem.interview_content_version is null then
      raise exception 'The interview problem has no approved prompt content.';
    end if;
    new.question_content_version := selected_problem.interview_content_version;
  end if;

  if new.selected_topic_id is null then
    new.selected_topic_id := selected_problem.primary_topic_id;
  elsif new.selected_topic_id <> selected_problem.primary_topic_id then
    raise exception 'The selected interview topic does not match the problem.';
  end if;

  if new.requested_difficulties is null
    or cardinality(new.requested_difficulties) = 0 then
    new.requested_difficulties := case
      when new.difficulty_mode = 'adaptive'
        then array['easy', 'medium', 'hard']::text[]
      else array[new.difficulty_mode]::text[]
    end;
  end if;

  if not public.valid_interview_difficulty_filter(new.requested_difficulties)
    or not selected_problem.difficulty = any(new.requested_difficulties) then
    raise exception 'The selected problem does not match the requested difficulty filter.';
  end if;

  if new.selection_mode = 'custom'
    and (
      new.requested_topic_id is null
      or new.requested_topic_id <> new.selected_topic_id
      or cardinality(new.requested_difficulties) <> 1
    ) then
    raise exception 'Custom interview selection requires one matching topic and difficulty.';
  end if;

  return new;
end;
$$;

drop trigger mock_interviews_validate_selection_snapshot
  on public.mock_interviews;

create trigger mock_interviews_validate_selection_snapshot
before insert or update of
  problem_id,
  difficulty_mode,
  selection_mode,
  requested_topic_id,
  requested_difficulties,
  selected_topic_id,
  question_content_version
on public.mock_interviews
for each row execute procedure public.validate_mock_interview_selection_snapshot();
