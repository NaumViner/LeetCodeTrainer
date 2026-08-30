import { effectiveInterviewElapsed } from "@/domain/mock-interview";
import { getProblemCatalog } from "@/features/problems/queries";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type MockInterviewRow = Tables<"mock_interviews">;
export type MockInterviewScorecardRow = Tables<"mock_interview_scorecards">;
export type RealtimeInterviewEventRow = Tables<"realtime_interview_events">;
export type RealtimeInterviewSessionRow = Tables<"realtime_interview_sessions">;

export type MockInterviewDetail = MockInterviewRow & {
  effectiveElapsedSeconds: number;
  problem: Awaited<ReturnType<typeof getProblemCatalog>>[number];
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
    { data: scorecard, error: scorecardError },
    { data: realtimeSession, error: realtimeSessionError },
  ] = await Promise.all([
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
  ]);
  if (scorecardError)
    throw new Error("The interview scorecard could not be loaded.");
  if (realtimeSessionError)
    throw new Error("The live interview session could not be loaded.");
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
  const { data: scorecards, error: scorecardError } = ids.length
    ? await supabase
        .from("mock_interview_scorecards")
        .select("*")
        .in("mock_interview_id", ids)
    : { data: [], error: null };
  if (scorecardError)
    throw new Error("Interview scorecards could not be loaded.");
  const problemById = new Map(catalog.map((problem) => [problem.id, problem]));
  const scorecardById = new Map(
    (scorecards ?? []).map((scorecard) => [
      scorecard.mock_interview_id,
      scorecard,
    ]),
  );
  return (interviews ?? []).flatMap((interview) => {
    const problem = problemById.get(interview.problem_id);
    return problem
      ? [
          {
            ...interview,
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
