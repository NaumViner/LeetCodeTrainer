import { effectiveInterviewElapsed } from "@/domain/mock-interview";
import { getProblemCatalog } from "@/features/problems/queries";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type MockInterviewRow = Tables<"mock_interviews">;
export type MockInterviewEvaluationRow = Tables<"mock_interview_evaluations">;
export type MockInterviewPhaseEventRow = Tables<"mock_interview_phase_events">;
export type MockInterviewScorecardRow = Tables<"mock_interview_scorecards">;
export type RealtimeInterviewEventRow = Tables<"realtime_interview_events">;
export type RealtimeInterviewSessionRow = Tables<"realtime_interview_sessions">;

export type MockInterviewDetail = MockInterviewRow & {
  effectiveElapsedSeconds: number;
  evaluation: MockInterviewEvaluationRow | null;
  problem: Awaited<ReturnType<typeof getProblemCatalog>>[number];
  phaseEvents: MockInterviewPhaseEventRow[];
  realtimeEvents: RealtimeInterviewEventRow[];
  realtimeSession: RealtimeInterviewSessionRow | null;
  scorecard: MockInterviewScorecardRow | null;
};

export async function getActiveMockInterview(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mock_interviews")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();
  if (error) throw new Error("The active mock interview could not be loaded.");
  return data;
}

export async function getMockInterview(userId: string, interviewId: string) {
  const supabase = await createClient();
  const [{ data: interview, error }, catalog] = await Promise.all([
    supabase
      .from("mock_interviews")
      .select("*")
      .eq("id", interviewId)
      .eq("user_id", userId)
      .maybeSingle(),
    getProblemCatalog(),
  ]);
  if (error) throw new Error("The mock interview could not be loaded.");
  if (!interview) return null;
  const problem = catalog.find((item) => item.id === interview.problem_id);
  if (!problem) return null;
  const [
    { data: evaluation, error: evaluationError },
    { data: scorecard, error: scorecardError },
    { data: realtimeSession, error: realtimeSessionError },
    { data: phaseEvents, error: phaseEventsError },
  ] = await Promise.all([
    supabase
      .from("mock_interview_evaluations")
      .select("*")
      .eq("mock_interview_id", interview.id)
      .eq("is_current", true)
      .maybeSingle(),
    supabase
      .from("mock_interview_scorecards")
      .select("*")
      .eq("mock_interview_id", interview.id)
      .maybeSingle(),
    supabase
      .from("realtime_interview_sessions")
      .select("*")
      .eq("mock_interview_id", interview.id)
      .maybeSingle(),
    supabase
      .from("mock_interview_phase_events")
      .select("*")
      .eq("mock_interview_id", interview.id)
      .order("created_at")
      .order("id"),
  ]);
  if (evaluationError)
    throw new Error("The interview evaluation could not be loaded.");
  if (scorecardError)
    throw new Error("The interview scorecard could not be loaded.");
  if (realtimeSessionError)
    throw new Error("The live interview session could not be loaded.");
  if (phaseEventsError)
    throw new Error("The interview process guide could not be loaded.");
  const { data: realtimeEvents, error: realtimeEventsError } = realtimeSession
    ? await supabase
        .from("realtime_interview_events")
        .select("*")
        .eq("session_id", realtimeSession.id)
        .order("created_at")
        .order("id")
    : { data: [], error: null };
  if (realtimeEventsError)
    throw new Error("The live interview transcript could not be loaded.");
  return {
    ...interview,
    effectiveElapsedSeconds: effectiveInterviewElapsed({
      elapsedSeconds: interview.elapsed_seconds,
      now: new Date(),
      startedAt: interview.started_at,
      timerRunning: interview.timer_running,
    }),
    evaluation,
    phaseEvents: phaseEvents ?? [],
    problem,
    realtimeEvents: realtimeEvents ?? [],
    realtimeSession,
    scorecard,
  } satisfies MockInterviewDetail;
}

export async function getMockInterviewHistory(userId: string) {
  const supabase = await createClient();
  const [{ data: interviews, error }, catalog] = await Promise.all([
    supabase
      .from("mock_interviews")
      .select("*")
      .eq("user_id", userId)
      .neq("status", "active")
      .order("started_at", { ascending: false }),
    getProblemCatalog(),
  ]);
  if (error) throw new Error("Mock interview history could not be loaded.");
  const ids = (interviews ?? []).map((item) => item.id);
  const [scorecardsResult, evaluationsResult] = ids.length
    ? await Promise.all([
        supabase
          .from("mock_interview_scorecards")
          .select("*")
          .in("mock_interview_id", ids),
        supabase
          .from("mock_interview_evaluations")
          .select("*")
          .in("mock_interview_id", ids)
          .eq("is_current", true),
      ])
    : [
        { data: [], error: null },
        { data: [], error: null },
      ];
  const { data: scorecards, error: scorecardError } = scorecardsResult;
  const { data: evaluations, error: evaluationError } = evaluationsResult;
  if (scorecardError)
    throw new Error("Interview scorecards could not be loaded.");
  if (evaluationError)
    throw new Error("Interview evaluations could not be loaded.");
  const problemById = new Map(catalog.map((problem) => [problem.id, problem]));
  const scorecardById = new Map(
    (scorecards ?? []).map((scorecard) => [
      scorecard.mock_interview_id,
      scorecard,
    ]),
  );
  const evaluationById = new Map(
    (evaluations ?? []).map((evaluation) => [
      evaluation.mock_interview_id,
      evaluation,
    ]),
  );
  return (interviews ?? []).flatMap((interview) => {
    const problem = problemById.get(interview.problem_id);
    return problem
      ? [
          {
            ...interview,
            evaluation: evaluationById.get(interview.id) ?? null,
            problem,
            scorecard: scorecardById.get(interview.id) ?? null,
          },
        ]
      : [];
  });
}

export async function getRecentInterviewProblemIds(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mock_interviews")
    .select("problem_id")
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .limit(5);
  if (error) throw new Error("Recent interview history could not be loaded.");
  return new Set((data ?? []).map((item) => item.problem_id));
}

export async function getCompletedInterviewProblemIds(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mock_interviews")
    .select("problem_id")
    .eq("user_id", userId)
    .eq("status", "completed");
  if (error)
    throw new Error("Completed interview history could not be loaded.");
  return new Set((data ?? []).map((item) => item.problem_id));
}
