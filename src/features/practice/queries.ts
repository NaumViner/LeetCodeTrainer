import { effectiveDurationSeconds } from "@/domain/practice";
import type { Problem } from "@/features/problems/model";
import { getProblemCatalog } from "@/features/problems/queries";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type AttemptRow = Tables<"attempts">;
export type AttemptHintRow = Tables<"attempt_hints">;

export type PracticeAttempt = AttemptRow & {
  effectiveDurationSeconds: number;
  hints: AttemptHintRow[];
  problem: Problem;
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

export async function getAttemptSummaries(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("attempts")
    .select("problem_id, status")
    .eq("user_id", userId);

  if (error) throw new Error("Practice history could not be loaded.");
  return (data ?? []).map((attempt) => ({
    problemId: attempt.problem_id,
    status: attempt.status,
  }));
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

  const { data: hints, error: hintError } = await supabase
    .from("attempt_hints")
    .select("*")
    .eq("attempt_id", attempt.id)
    .order("ordinal");

  if (hintError) throw new Error("Practice hints could not be loaded.");

  return {
    ...attempt,
    effectiveDurationSeconds: effectiveDurationSeconds({
      durationSeconds: attempt.duration_seconds,
      now: new Date(),
      timerRunning: attempt.timer_running,
      timerStartedAt: attempt.timer_started_at,
    }),
    hints: hints ?? [],
    problem,
  };
}
