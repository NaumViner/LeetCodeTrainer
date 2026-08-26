import { reviewBucket, type ReviewBucket } from "@/domain/review";
import type { Problem } from "@/features/problems/model";
import { getProblemCatalog } from "@/features/problems/queries";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type ProblemReviewRow = Tables<"problem_reviews">;
export type ReviewEventRow = Tables<"review_events">;

export type ReviewPrompt = {
  label: string;
  type: "complexity" | "mistake" | "pattern" | "problem";
};

export type ReviewQueueItem = {
  bucket: ReviewBucket;
  latestAttempt: {
    correctPattern: string | null;
    mistakes: string[];
    takeaway: string | null;
  } | null;
  problem: Problem;
  prompts: ReviewPrompt[];
  review: ProblemReviewRow;
};

export async function getReviewQueue(
  userId: string,
  now: Date,
  timeZone: string,
) {
  const supabase = await createClient();
  const [{ data: reviews, error }, catalog] = await Promise.all([
    supabase
      .from("problem_reviews")
      .select("*")
      .eq("user_id", userId)
      .order("next_review_at"),
    getProblemCatalog(),
  ]);
  if (error) throw new Error("Your review queue could not be loaded.");

  const problemIds = (reviews ?? []).map((review) => review.problem_id);
  const { data: attempts, error: attemptError } = problemIds.length
    ? await supabase
        .from("attempts")
        .select("problem_id, correct_pattern, mistakes, takeaway, completed_at")
        .eq("user_id", userId)
        .eq("status", "completed")
        .in("problem_id", problemIds)
        .order("completed_at", { ascending: false })
    : { data: [], error: null };
  if (attemptError) throw new Error("Review context could not be loaded.");

  const problems = new Map(catalog.map((problem) => [problem.id, problem]));
  const latestByProblem = new Map<
    string,
    {
      correctPattern: string | null;
      mistakes: string[];
      takeaway: string | null;
    }
  >();
  for (const attempt of attempts ?? []) {
    if (latestByProblem.has(attempt.problem_id)) continue;
    latestByProblem.set(attempt.problem_id, {
      correctPattern: attempt.correct_pattern,
      mistakes: attempt.mistakes,
      takeaway: attempt.takeaway,
    });
  }

  return (reviews ?? []).flatMap((review) => {
    const problem = problems.get(review.problem_id);
    if (!problem) return [];
    const latestAttempt = latestByProblem.get(review.problem_id) ?? null;
    const prompts: ReviewPrompt[] = [
      { label: "Solve the problem again", type: "problem" },
      { label: "Recognize the pattern before notes", type: "pattern" },
      { label: "Re-derive time and space complexity", type: "complexity" },
    ];
    if (latestAttempt?.mistakes.length || latestAttempt?.takeaway) {
      prompts.push({ label: "Recall the earlier mistake", type: "mistake" });
    }
    return [
      {
        bucket: reviewBucket(new Date(review.next_review_at), now, timeZone),
        latestAttempt,
        problem,
        prompts,
        review,
      },
    ];
  });
}

export async function getReviewHistory(userId: string) {
  const supabase = await createClient();
  const [{ data: events, error }, catalog] = await Promise.all([
    supabase
      .from("review_events")
      .select("*")
      .eq("user_id", userId)
      .order("reviewed_at", { ascending: false }),
    getProblemCatalog(),
  ]);
  if (error) throw new Error("Your review history could not be loaded.");
  const problems = new Map(catalog.map((problem) => [problem.id, problem]));
  return (events ?? []).flatMap((event) => {
    const problem = problems.get(event.problem_id);
    return problem ? [{ event, problem }] : [];
  });
}

export async function getReviewDashboardSummary(userId: string, now: Date) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("problem_reviews")
    .select("next_review_at")
    .eq("user_id", userId)
    .order("next_review_at");
  if (error) throw new Error("Your review summary could not be loaded.");
  const reviews = data ?? [];
  return {
    dueNow: reviews.filter(
      (review) => new Date(review.next_review_at).getTime() <= now.getTime(),
    ).length,
    nextReviewAt: reviews[0]?.next_review_at ?? null,
    total: reviews.length,
  };
}

export function reviewQueueCounts(items: ReviewQueueItem[]) {
  return items.reduce(
    (counts, item) => {
      counts[item.bucket] += 1;
      return counts;
    },
    { due_now: 0, due_today: 0, upcoming: 0 } satisfies Record<
      ReviewBucket,
      number
    >,
  );
}
