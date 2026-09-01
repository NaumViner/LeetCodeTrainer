import {
  rankRecommendations,
  recommendProblem,
  scoreRecommendations,
  type RecommendationAttempt,
  type RecommendationCandidate,
} from "@/domain/recommendation";
import { buildInterviewFirstRecommendations } from "@/domain/interview-recommendation";
import { getInterviewPerformanceProfile } from "@/features/interview-profile/queries";
import {
  getCompletedLessonTopicIds,
  getRecommendationEvidence,
} from "@/features/practice/queries";
import type { Problem } from "@/features/problems/model";
import { getProblemCatalog } from "@/features/problems/queries";

export async function getAdaptiveRecommendationSnapshot(
  userId: string,
  now: Date,
) {
  const [catalog, evidence, completedTopicIds, interviewPerformance] =
    await Promise.all([
      getProblemCatalog(),
      getRecommendationEvidence(userId, now),
      getCompletedLessonTopicIds(userId),
      getInterviewPerformanceProfile(userId, now),
    ]);
  const catalogById = new Map(catalog.map((problem) => [problem.id, problem]));
  const candidates = catalog.map(toCandidate);
  const context = {
    attempts: evidence.attempts.flatMap((attempt) => {
      const attemptedProblem = catalogById.get(attempt.problem_id);
      if (!attemptedProblem || !attempt.completed_at || !attempt.result) {
        return [];
      }
      return [
        {
          completedAt: attempt.completed_at,
          difficulty: attemptedProblem.difficulty as "easy" | "hard" | "medium",
          helpLevel: attempt.help_level as RecommendationAttempt["helpLevel"],
          problemId: attempt.problem_id,
          primaryTopicId: attemptedProblem.primary_topic_id,
          result: attempt.result as "failed" | "partial" | "solved",
        },
      ];
    }),
    completedTopicIds,
    dueProblemIds: evidence.dueProblemIds,
    interviewDate: evidence.interviewDate,
    now,
    topicEvidence: evidence.topicEvidence,
    userId,
  };

  return {
    catalog,
    context,
    evidence,
    interviewRecommendations: buildInterviewFirstRecommendations({
      candidates: catalog.map((problem) => ({
        difficulty: problem.difficulty as "easy" | "hard" | "medium",
        externalId: problem.external_id,
        id: problem.id,
        primaryTopicId: problem.primaryTopic.id,
        primaryTopicName: problem.primaryTopic.name,
        primaryTopicSlug: problem.primaryTopic.slug,
        title: problem.title,
      })),
      dueProblemIds: evidence.dueProblemIds,
      interviewDate: evidence.interviewDate,
      learningMastery: new Map(
        [...evidence.topicEvidence].map(([topicId, topic]) => [
          topicId,
          topic.overallScore,
        ]),
      ),
      now,
      profile: interviewPerformance.profile,
      recentProblemIds: context.attempts.map((attempt) => attempt.problemId),
    }),
    ranked: rankRecommendations(candidates, context),
    recommendation: recommendProblem(candidates, context),
    scored: scoreRecommendations(candidates, context),
  };
}

function toCandidate(problem: Problem): RecommendationCandidate {
  return {
    curriculumLevel: problem.curriculum_level as
      "foundation" | "guided" | "independent" | "interview" | "timed",
    datasetOrder: problem.dataset_order,
    difficulty: problem.difficulty as "easy" | "hard" | "medium",
    id: problem.id,
    prerequisiteTopicIds: problem.prerequisiteTopics.map((topic) => topic.id),
    primaryTopicId: problem.primary_topic_id,
  };
}
