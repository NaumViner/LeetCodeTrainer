import {
  aggregateAttemptAnalytics,
  overallReadiness,
  type MasterySnapshot,
} from "@/domain/analytics";
import { getProblemCatalog } from "@/features/problems/queries";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type TopicMasteryRow = Tables<"topic_mastery">;
export type AttemptPerformanceRow = Tables<"attempt_performance">;
export type AttemptRow = Tables<"attempts">;

export type AnalyticsAttempt = AttemptRow & {
  performance: AttemptPerformanceRow | null;
  problem: Awaited<ReturnType<typeof getProblemCatalog>>[number];
};

export type TopicAnalytics = {
  mastery: TopicMasteryRow | null;
  topic: AnalyticsAttempt["problem"]["primaryTopic"];
};

export async function getAnalyticsSnapshot(userId: string) {
  const supabase = await createClient();
  const [attemptsResult, performanceResult, masteryResult, catalog] =
    await Promise.all([
      supabase
        .from("attempts")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "completed")
        .order("completed_at", { ascending: false }),
      supabase.from("attempt_performance").select("*").eq("user_id", userId),
      supabase.from("topic_mastery").select("*").eq("user_id", userId),
      getProblemCatalog(),
    ]);
  const error =
    attemptsResult.error ?? performanceResult.error ?? masteryResult.error;
  if (error) throw new Error("Learning analytics could not be loaded.");

  const problemsById = new Map(catalog.map((problem) => [problem.id, problem]));
  const performanceByAttempt = new Map(
    (performanceResult.data ?? []).map((item) => [item.attempt_id, item]),
  );
  const attempts = (attemptsResult.data ?? []).flatMap((attempt) => {
    const problem = problemsById.get(attempt.problem_id);
    return problem
      ? [
          {
            ...attempt,
            performance: performanceByAttempt.get(attempt.id) ?? null,
            problem,
          },
        ]
      : [];
  });
  const masteryByTopic = new Map(
    (masteryResult.data ?? []).map((item) => [item.topic_id, item]),
  );
  const coreTopics = [
    ...new Map(
      catalog.map((problem) => [problem.primaryTopic.id, problem.primaryTopic]),
    ).values(),
  ].sort((left, right) => left.curriculum_order - right.curriculum_order);
  const topics: TopicAnalytics[] = coreTopics.map((topic) => ({
    mastery: masteryByTopic.get(topic.id) ?? null,
    topic,
  }));
  const masteries: MasterySnapshot[] = (masteryResult.data ?? []).map(
    (mastery) => ({
      complexity: mastery.complexity_score,
      independence: mastery.independence_score,
      overall: mastery.overall_score,
      recognition: mastery.recognition_score,
      retention: mastery.retention_score,
      speed: mastery.speed_score,
    }),
  );
  const metrics = aggregateAttemptAnalytics(
    attempts.map((attempt) => ({
      completedAt: attempt.completed_at ?? attempt.created_at,
      complexityCorrect: attempt.complexity_correct,
      durationSeconds: attempt.duration_seconds,
      helpLevel: attempt.help_level,
      id: attempt.id,
      mistakes: attempt.mistakes,
      problemId: attempt.problem_id,
      recognizedPatternCorrectly: Boolean(attempt.recognized_pattern_correctly),
      result: attempt.result ?? "failed",
    })),
    (performanceResult.data ?? []).map((performance) => ({
      attemptId: performance.attempt_id,
      score: performance.overall_score,
    })),
  );

  return {
    attempts,
    metrics,
    readiness: overallReadiness(masteries, coreTopics.length),
    topics,
  };
}

export async function getTopicMastery(userId: string, topicId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("topic_mastery")
    .select("*")
    .eq("user_id", userId)
    .eq("topic_id", topicId)
    .maybeSingle();
  if (error) throw new Error("Topic mastery could not be loaded.");
  return data;
}

export async function getAttemptDetail(userId: string, attemptId: string) {
  const snapshot = await getAnalyticsSnapshot(userId);
  const attempt = snapshot.attempts.find((item) => item.id === attemptId);
  if (!attempt) return null;
  return {
    attempt,
    previousAttempts: snapshot.attempts.filter(
      (item) =>
        item.problem_id === attempt.problem_id &&
        item.id !== attempt.id &&
        new Date(item.completed_at ?? item.created_at) <
          new Date(attempt.completed_at ?? attempt.created_at),
    ),
  };
}
