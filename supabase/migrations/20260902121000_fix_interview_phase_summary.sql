create or replace function public.mock_interview_phase_summary(
  p_interview public.mock_interviews,
  p_phase text
)
returns text
language plpgsql
stable
set search_path = ''
as $$
declare
  item_count integer;
begin
  case p_phase
    when 'intro' then
      return 'Interview setup and prompt review completed.';
    when 'clarify' then
      item_count := cardinality(regexp_split_to_array(
        trim(coalesce(p_interview.clarification_notes, '')), E'\\n+'
      ));
      return format('Captured %s clarification item%s.',
        item_count, case when item_count = 1 then '' else 's' end);
    when 'examples' then
      item_count := cardinality(regexp_split_to_array(
        trim(coalesce(p_interview.examples_notes, '')), E'\\n+'
      ));
      return format('Captured %s example or expected-behavior item%s.',
        item_count, case when item_count = 1 then '' else 's' end);
    when 'brute_force' then
      return 'Saved the baseline approach and its repeated work.';
    when 'optimization' then
      return 'Saved the optimized approach, invariant, and tradeoff.';
    when 'implementation' then
      return format('%s code snapshot version %s submitted.',
        initcap(p_interview.coding_language), p_interview.workspace_version);
    when 'testing' then
      item_count := cardinality(regexp_split_to_array(
        trim(coalesce(p_interview.testing_notes, '')), E'\\n+'
      ));
      return format('Captured %s test or dry-run item%s.',
        item_count, case when item_count = 1 then '' else 's' end);
    when 'complexity' then
      return format('Recorded time %s and space %s.',
        coalesce(p_interview.submitted_time_complexity, 'not stated'),
        coalesce(p_interview.submitted_space_complexity, 'not stated'));
    when 'retrospective' then
      return format('Recorded the %s outcome and learner reflection.',
        coalesce(p_interview.result, 'selected'));
    else
      return null;
  end case;
end;
$$;

revoke all on function public.capture_mock_interview_phase_transition()
  from public;
revoke all on function public.attach_code_submission_to_phase_event()
  from public;
