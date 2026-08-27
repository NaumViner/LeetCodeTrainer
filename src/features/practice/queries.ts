import { effectiveDurationSeconds } from "@/domain/practice";
import type { Problem } from "@/features/problems/model";
import { getProblemCatalog } from "@/features/problems/queries";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type AttemptRow = Tables<"attempts">;
export type AttemptHintRow = Tables<"attempt_hints">;

export type PreviousAttemptSummary = Pick<
  AttemptRow,
  | "completed_at"
  | "correct_pattern"
  | "duration_seconds"
  | "help_level"
  | "mistakes"
  | "result"
  | "submitted_space_complexity"
  | "submitted_time_complexity"
  | "takeaway"
>;

export type PracticeAttempt = AttemptRow & {
  effectiveDurationSeconds: number;
  hints: AttemptHintRow[];
  previousAttempt: PreviousAttemptSummary | null;
  problem: Problem;
  reviewSchedule: Pick<
    Tables<"problem_reviews">,
    "interval_days" | "next_review_at" | "repetition"
  > | null;
};

export async function getActiveAttempt(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("attempts")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "started")
    .maybeSingle();

  if (error)
    throw new Error("Your active practice session could not be loaded.");
  return data;
}

export async function getRecommendationEvidence(userId: string, now: Date) {
  const supabase = await createClient();
  const [
    { data: attempts, error: attemptError },
    { data: mastery, error: masteryError },
    { data: reviews, error: reviewError },
    { data: profile, error: profileError },
  ] = await Promise.all([
    supabase
      .from("attempts")
      .select("problem_id, completed_at, duration_seconds, help_level, result")
      .eq("user_id", userId)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(100),
    supabase
      .from("topic_mastery")
      .select("topic_id, overall_score, independent_solves")
      .eq("user_id", userId),
    supabase
      .from("problem_reviews")
      .select("problem_id, next_review_at")
      .eq("user_id", userId)
      .lte("next_review_at", now.toISOString()),
    supabase
      .from("profiles")
      .select("interview_date")
      .eq("id", userId)
      .maybeSingle(),
  ]);

  if (attemptError || masteryError || reviewError || profileError) {
    throw new Error("Adaptive recommendation evidence could not be loaded.");
  }
  return {
    attempts: (attempts ?? []).filter(
      (attempt) => attempt.completed_at && attempt.result,
    ),
    dueProblemIds: new Set((reviews ?? []).map((review) => review.problem_id)),
    interviewDate: profile?.interview_date ?? null,
    topicEvidence: new Map(
      (mastery ?? []).map((topic) => [
        topic.topic_id,
        {
          independentSolves: topic.independent_solves,
          overallScore: topic.overall_score,
          topicId: topic.topic_id,
        },
      ]),
    ),
  };
}

export async function getCompletedLessonTopicIds(userId: string) {
  const supabase = await createClient();
  const { data: progress, error: progressError } = await supabase
    .from("lesson_progress")
    .select("lesson_id")
    .eq("user_id", userId)
    .not("completed_at", "is", null);

  if (progressError) throw new Error("Learning progress could not be loaded.");
  const lessonIds = (progress ?? []).map((item) => item.lesson_id);
  if (lessonIds.length === 0) return new Set<string>();

  const { data: lessons, error: lessonError } = await supabase
    .from("lessons")
    .select("topic_id")
    .in("id", lessonIds);

  if (lessonError) throw new Error("Learning progress could not be loaded.");
  return new Set((lessons ?? []).map((lesson) => lesson.topic_id));
}

export async function getPracticeAttempt(
  userId: string,
  attemptId: string,
): Promise<PracticeAttempt | null> {
  const supabase = await createClient();
  const [{ data: attempt, error }, catalog] = await Promise.all([
    supabase
      .from("attempts")
      .select("*")
      .eq("id", attemptId)
      .eq("user_id", userId)
      .maybeSingle(),
    getProblemCatalog(),
  ]);

  if (error) throw new Error("The practice session could not be loaded.");
  if (!attempt) return null;

  const problem = catalog.find((item) => item.id === attempt.problem_id);
  if (!problem) return null;

  const [
    { data: hints, error: hintError },
    { data: previousAttempt, error: previousError },
    { data: reviewSchedule, error: reviewError },
  ] = await Promise.all([
    supabase
      .from("attempt_hints")
      .select("*")
      .eq("attempt_id", attempt.id)
      .order("ordinal"),
    attempt.mode === "review"
      ? supabase
          .from("attempts")
          .select(
            "completed_at, correct_pattern, duration_seconds, help_level, mistakes, result, submitted_space_complexity, submitted_time_complexity, takeaway",
          )
          .eq("user_id", userId)
          .eq("problem_id", attempt.problem_id)
          .eq("status", "completed")
          .neq("id", attempt.id)
          .order("completed_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from("problem_reviews")
      .select("interval_days, next_review_at, repetition")
      .eq("user_id", userId)
      .eq("problem_id", attempt.problem_id)
      .maybeSingle(),
  ]);

  if (hintError) throw new Error("Practice hints could not be loaded.");
  if (previousError)
    throw new Error("Previous review evidence could not be loaded.");
  if (reviewError) throw new Error("The review schedule could not be loaded.");

  return {
    ...attempt,
    effectiveDurationSeconds: effectiveDurationSeconds({
      durationSeconds: attempt.duration_seconds,
      now: new Date(),
      timerRunning: attempt.timer_running,
      timerStartedAt: attempt.timer_started_at,
    }),
    hints: hints ?? [],
    previousAttempt,
    problem,
    reviewSchedule,
  };
}
