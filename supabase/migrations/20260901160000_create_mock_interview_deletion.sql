create function public.recompute_topic_mastery_from_evidence(
  p_user_id uuid,
  p_topic_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  diagnostic_record record;
  evidence_record record;
  has_evidence boolean := false;
  correctness numeric := 35;
  independence numeric := 35;
  recognition numeric := 35;
  retention numeric := 35;
  complexity numeric := 35;
  speed numeric := 35;
  overall numeric := 35;
  diagnostic_value numeric;
  diagnostic_at timestamptz;
  attempt_count integer := 0;
  independent_solve_count integer := 0;
  interview_count integer := 0;
  last_practiced timestamptz;
  last_interviewed timestamptz;
  next_review timestamptz;
  alpha numeric;
begin
  select
    count(*) as evidence_count,
    avg(case when response.correct then 1.0 else 0.0 end) as accuracy,
    avg(case when response.correct then 1.0 else 0.0 end)
      filter (where response.section = 'coding') as coding_accuracy,
    avg(case when response.correct then 1.0 else 0.0 end)
      filter (where response.section = 'pattern') as pattern_accuracy,
    avg(case when response.correct then 1.0 else 0.0 end)
      filter (where response.section = 'concept') as concept_accuracy,
    max(diagnostic.completed_at) as completed_at
  into diagnostic_record
  from public.diagnostic_responses as response
  join public.diagnostic_attempts as diagnostic
    on diagnostic.id = response.diagnostic_attempt_id
  where diagnostic.user_id = p_user_id
    and diagnostic.status = 'completed'
    and response.topic_id = p_topic_id;

  if diagnostic_record.evidence_count > 0 then
    has_evidence := true;
    correctness := round(25 + diagnostic_record.accuracy * 50, 2);
    independence := round(
      25 + coalesce(diagnostic_record.coding_accuracy, 0.20) * 50,
      2
    );
    recognition := round(
      25 + coalesce(
        diagnostic_record.pattern_accuracy,
        diagnostic_record.accuracy
      ) * 50,
      2
    );
    retention := 35;
    speed := 35;
    complexity := round(
      25 + coalesce(
        diagnostic_record.concept_accuracy,
        diagnostic_record.accuracy
      ) * 50,
      2
    );
    diagnostic_value := round(25 + diagnostic_record.accuracy * 50, 2);
    diagnostic_at := diagnostic_record.completed_at;
    overall := round(
      correctness * 0.30
        + independence * 0.30
        + recognition * 0.15
        + retention * 0.10
        + complexity * 0.10
        + speed * 0.05,
      2
    );
  end if;

  for evidence_record in
    select *
    from (
      select
        'attempt'::text as evidence_kind,
        attempt.id as evidence_id,
        attempt.completed_at as evidence_at,
        performance.correctness_score * 100 as correctness,
        performance.independence_score * 100 as independence,
        performance.recognition_score * 100 as recognition,
        performance.retention_score * 100 as retention,
        performance.complexity_score * 100 as complexity,
        performance.speed_score * 100 as speed,
        attempt.result = 'solved' and attempt.help_level = 'none'
          as independent_solve
      from public.attempts as attempt
      join public.attempt_performance as performance
        on performance.attempt_id = attempt.id
      where attempt.user_id = p_user_id
        and attempt.status = 'completed'
        and performance.topic_id = p_topic_id

      union all

      select
        'interview'::text as evidence_kind,
        interview.id as evidence_id,
        interview.completed_at as evidence_at,
        scorecard.correctness * 20 as correctness,
        scorecard.independence * 20 as independence,
        ((scorecard.problem_understanding + scorecard.approach_quality) / 2.0)
          * 20 as recognition,
        null::numeric as retention,
        scorecard.complexity_reasoning * 20 as complexity,
        case
          when interview.elapsed_seconds <= interview.duration_minutes * 60
            then 80
          else 50
        end::numeric as speed,
        false as independent_solve
      from public.mock_interviews as interview
      join public.mock_interview_scorecards as scorecard
        on scorecard.mock_interview_id = interview.id
      where interview.user_id = p_user_id
        and interview.status = 'completed'
        and scorecard.topic_id = p_topic_id
    ) as evidence
    order by evidence.evidence_at, evidence.evidence_kind, evidence.evidence_id
  loop
    has_evidence := true;
    if evidence_record.evidence_kind = 'attempt' then
      alpha := case
        when attempt_count = 0 then 0.35
        when attempt_count = 1 then 0.30
        else 0.25
      end;
      attempt_count := attempt_count + 1;
      independent_solve_count := independent_solve_count
        + case when evidence_record.independent_solve then 1 else 0 end;
      last_practiced := evidence_record.evidence_at;
      retention := round(
        retention * (1 - alpha) + evidence_record.retention * alpha,
        2
      );
    else
      alpha := 0.20;
      interview_count := interview_count + 1;
      last_interviewed := evidence_record.evidence_at;
    end if;

    correctness := round(
      correctness * (1 - alpha) + evidence_record.correctness * alpha,
      2
    );
    independence := round(
      independence * (1 - alpha) + evidence_record.independence * alpha,
      2
    );
    recognition := round(
      recognition * (1 - alpha) + evidence_record.recognition * alpha,
      2
    );
    complexity := round(
      complexity * (1 - alpha) + evidence_record.complexity * alpha,
      2
    );
    speed := round(
      speed * (1 - alpha) + evidence_record.speed * alpha,
      2
    );
    overall := round(
      correctness * 0.30
        + independence * 0.30
        + recognition * 0.15
        + retention * 0.10
        + complexity * 0.10
        + speed * 0.05,
      2
    );
  end loop;

  if not has_evidence then
    delete from public.topic_mastery
    where user_id = p_user_id and topic_id = p_topic_id;
    return;
  end if;

  select min(review.next_review_at)
  into next_review
  from public.problem_reviews as review
  join public.problems as problem on problem.id = review.problem_id
  where review.user_id = p_user_id
    and problem.primary_topic_id = p_topic_id;

  insert into public.topic_mastery (
    user_id,
    topic_id,
    overall_score,
    correctness_score,
    independence_score,
    recognition_score,
    retention_score,
    speed_score,
    complexity_score,
    total_attempts,
    independent_solves,
    last_practiced_at,
    next_review_at,
    diagnostic_score,
    diagnostic_initialized_at,
    mock_interview_count,
    last_interviewed_at
  ) values (
    p_user_id,
    p_topic_id,
    overall,
    correctness,
    independence,
    recognition,
    retention,
    speed,
    complexity,
    attempt_count,
    independent_solve_count,
    last_practiced,
    next_review,
    diagnostic_value,
    diagnostic_at,
    interview_count,
    last_interviewed
  )
  on conflict (user_id, topic_id) do update set
    overall_score = excluded.overall_score,
    correctness_score = excluded.correctness_score,
    independence_score = excluded.independence_score,
    recognition_score = excluded.recognition_score,
    retention_score = excluded.retention_score,
    speed_score = excluded.speed_score,
    complexity_score = excluded.complexity_score,
    total_attempts = excluded.total_attempts,
    independent_solves = excluded.independent_solves,
    last_practiced_at = excluded.last_practiced_at,
    next_review_at = excluded.next_review_at,
    diagnostic_score = excluded.diagnostic_score,
    diagnostic_initialized_at = excluded.diagnostic_initialized_at,
    mock_interview_count = excluded.mock_interview_count,
    last_interviewed_at = excluded.last_interviewed_at;
end;
$$;

create function public.delete_owned_mock_interview(p_mock_interview_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  owned_interview public.mock_interviews%rowtype;
begin
  if current_user_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('mock-interview:' || current_user_id::text, 0)
  );
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'interview-evaluation:' || p_mock_interview_id::text,
      0
    )
  );

  select * into owned_interview
  from public.mock_interviews
  where id = p_mock_interview_id and user_id = current_user_id
  for update;
  if not found then
    raise exception 'Mock interview not found.' using errcode = '42501';
  end if;
  if owned_interview.status = 'active' then
    raise exception 'An active mock interview cannot be deleted.';
  end if;

  perform 1
  from public.topic_mastery
  where user_id = current_user_id
    and topic_id = owned_interview.selected_topic_id
  for update;

  delete from public.mock_interviews
  where id = owned_interview.id and user_id = current_user_id;

  perform public.recompute_topic_mastery_from_evidence(
    current_user_id,
    owned_interview.selected_topic_id
  );

  return owned_interview.selected_topic_id;
end;
$$;

revoke all on function public.recompute_topic_mastery_from_evidence(uuid, uuid)
  from public;
revoke all on function public.delete_owned_mock_interview(uuid) from public;
grant execute on function public.delete_owned_mock_interview(uuid)
  to authenticated;
