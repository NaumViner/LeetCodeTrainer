import { effectiveDurationSeconds } from "@/domain/practice";
import type { ZodType } from "zod";
import {
  attemptAnalysisSchema,
  coachEvaluationSchema,
  reviewCardDraftSchema,
  type AttemptAnalysis,
  type CoachEvaluation,
  type PersistedCoachResult,
  type ReviewCardDraft,
} from "@/features/ai-coach/model";
import type { Problem } from "@/features/problems/model";
import { getProblemCatalog } from "@/features/problems/queries";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type AttemptRow = Tables<"attempts">;
export type AttemptHintRow = Tables<"attempt_hints">;

export type PreviousAttemptSummary = Pick<
  AttemptRow,
  | "id"
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
  attemptAnalysis: PersistedCoachResult<AttemptAnalysis> | null;
  complexityFeedback: PersistedCoachResult<CoachEvaluation> | null;
  effectiveDurationSeconds: number;
  hints: AttemptHintRow[];
  patternAnalysis: PersistedCoachResult<CoachEvaluation> | null;
  previousAttempt: PreviousAttemptSummary | null;
  problem: Problem;
  reviewSchedule: Pick<
    Tables<"problem_reviews">,
    "interval_days" | "next_review_at" | "repetition"
  > | null;
  reviewCardDraft: PersistedCoachResult<ReviewCardDraft> | null;
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
            "id, completed_at, correct_pattern, duration_seconds, help_level, mistakes, result, submitted_space_complexity, submitted_time_complexity, takeaway",
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

  const coachAttemptIds = [attempt.id];
  if (previousAttempt?.id) coachAttemptIds.push(previousAttempt.id);
  const { data: interactions, error: coachError } = await supabase
    .from("ai_coach_interactions")
    .select("attempt_id, interaction_type, response, status")
    .in("attempt_id", coachAttemptIds)
    .in("status", ["completed", "fallback"])
    .order("created_at", { ascending: false });
  if (coachError) throw new Error("AI coach results could not be loaded.");
  const currentInteraction = (interactionType: string) =>
    (interactions ?? []).find(
      (item) =>
        item.attempt_id === attempt.id &&
        item.interaction_type === interactionType,
    );
  const reviewAttemptId =
    attempt.mode === "review" && attempt.status === "started" && previousAttempt
      ? previousAttempt.id
      : attempt.id;
  const reviewInteraction = (interactions ?? []).find(
    (item) =>
      item.attempt_id === reviewAttemptId &&
      item.interaction_type === "review_card",
  );

  return {
    ...attempt,
    attemptAnalysis: parseCoachResult(
      currentInteraction("attempt_analysis"),
      attemptAnalysisSchema,
    ),
    complexityFeedback: parseCoachResult(
      currentInteraction("complexity_feedback"),
      coachEvaluationSchema,
    ),
    effectiveDurationSeconds: effectiveDurationSeconds({
      durationSeconds: attempt.duration_seconds,
      now: new Date(),
      timerRunning: attempt.timer_running,
      timerStartedAt: attempt.timer_started_at,
    }),
    hints: hints ?? [],
    patternAnalysis: parseCoachResult(
      currentInteraction("pattern_analysis"),
      coachEvaluationSchema,
    ),
    previousAttempt,
    problem,
    reviewSchedule,
    reviewCardDraft: parseCoachResult(reviewInteraction, reviewCardDraftSchema),
  };
}

function parseCoachResult<T extends object>(
  interaction:
    Pick<Tables<"ai_coach_interactions">, "response" | "status"> | undefined,
  schema: ZodType<T>,
): PersistedCoachResult<T> | null {
  const parsed = schema.safeParse(interaction?.response);
  if (!parsed.success || !parsed.data) return null;
  return {
    ...parsed.data,
    source: interaction?.status === "completed" ? "ai" : "fallback",
  };
}
