import "server-only";

import {
  rankImprovementTopics,
  selectLearningInterview,
  type InterviewSelectionProblem,
  type InterviewTopicPerformance,
} from "@/domain/interview-selection";
import { getApprovedQuestionContentVersion } from "@/features/interview-evaluation/question-content";
import { getInterviewTopicCoverage } from "@/features/mock-interviews/coverage";
import {
  getCompletedInterviewProblemIds,
  getRecentInterviewProblemIds,
} from "@/features/mock-interviews/queries";
import { getAdaptiveRecommendationSnapshot } from "@/features/practice/recommendation";

export async function getInterviewSelectionContext(
  userId: string,
  now = new Date(),
) {
  const [coverage, snapshot, completedProblemIds, recentProblemIds] =
    await Promise.all([
      getInterviewTopicCoverage(userId),
      getAdaptiveRecommendationSnapshot(userId, now),
      getCompletedInterviewProblemIds(userId),
      getRecentInterviewProblemIds(userId),
    ]);
  const collectionProblemIds = new Set(
    coverage.memberships.map((membership) => membership.problemId),
  );
  const topicPerformance = coverage.topics.map((topic) => {
    const metric =
      snapshot.interviewPerformance.profile.allTime.topics[topic.id];
    return {
      adjustedScore: metric?.adjustedScore ?? null,
      confidence: metric?.confidence ?? 0,
      lastEvidenceAt: latestTopicEvidenceAt(
        topic.id,
        snapshot.interviewPerformance.evidence,
      ),
      name: topic.name,
      ordinal: topic.ordinal,
      topicId: topic.id,
    } satisfies InterviewTopicPerformance;
  });

  return {
    catalog: snapshot.catalog,
    collectionProblemIds,
    completedProblemIds,
    coverage,
    interviewPerformance: snapshot.interviewPerformance,
    recentProblemIds,
    scoredRecommendations: snapshot.scored,
    selectionProblems: snapshot.catalog.map(toSelectionProblem),
    topicPerformance,
  };
}

export async function getInterviewSelectionSetup(
  userId: string,
  now = new Date(),
) {
  const context = await getInterviewSelectionContext(userId, now);
  const inventory = context.coverage.topics.map((topic) => {
    const problems = context.selectionProblems.filter(
      (problem) =>
        problem.active &&
        problem.availableForInterview &&
        context.collectionProblemIds.has(problem.id) &&
        problem.primaryTopicId === topic.id,
    );
    return {
      completedInterviews: topic.completedInterviews,
      id: topic.id,
      inventory: {
        easy: problems.filter((problem) => problem.difficulty === "easy")
          .length,
        hard: problems.filter((problem) => problem.difficulty === "hard")
          .length,
        medium: problems.filter((problem) => problem.difficulty === "medium")
          .length,
      },
      name: topic.name,
      ordinal: topic.ordinal,
      slug: topic.slug,
    };
  });
  const missingPerformance = context.topicPerformance.filter(
    (topic) => topic.adjustedScore === null,
  );
  const improvementAvailable =
    context.coverage.complete && missingPerformance.length === 0;
  const weakTopics = improvementAvailable
    ? rankImprovementTopics(context.topicPerformance)
        .slice(0, 3)
        .map((topic) => ({
          adjustedScore: topic.adjustedScore!,
          confidence: topic.confidence,
          id: topic.topicId,
          name: topic.name,
        }))
    : [];
  const learning = selectLearningInterview({
    catalog: context.selectionProblems,
    collectionProblemIds: context.collectionProblemIds,
    rankedRecommendations: context.scoredRecommendations,
    recentProblemIds: context.recentProblemIds,
  });

  return {
    collection: context.coverage.collection,
    coverage: {
      complete: context.coverage.complete,
      coveredTopicCount: context.coverage.coveredTopicCount,
      missingTopicNames: context.coverage.missingTopics.map(
        (topic) => topic.name,
      ),
      totalTopicCount: context.coverage.totalTopicCount,
    },
    improvement: {
      available: improvementAvailable,
      unavailableReason: !context.coverage.complete
        ? `Complete an interview in: ${context.coverage.missingTopics
            .map((topic) => topic.name)
            .join(", ")}.`
        : missingPerformance.length > 0
          ? `Evaluated evidence is still missing for: ${missingPerformance
              .map((topic) => topic.name)
              .join(", ")}.`
          : null,
      weakTopics,
    },
    learning: learning.ok
      ? { available: true, reasons: learning.reasons }
      : { available: false, reasons: [learning.message] },
    performanceProfile: context.interviewPerformance.profile,
    topics: inventory,
  };
}

function toSelectionProblem(problem: {
  active: boolean;
  dataset_order: number;
  difficulty: string;
  id: string;
  interview_content_version: number | null;
  interview_ready: boolean;
  primary_topic_id: string;
  slug: string;
}): InterviewSelectionProblem {
  const approvedVersion = getApprovedQuestionContentVersion(problem.slug);
  return {
    active: problem.active,
    availableForInterview:
      problem.active &&
      problem.interview_ready &&
      approvedVersion !== null &&
      approvedVersion === problem.interview_content_version,
    datasetOrder: problem.dataset_order,
    difficulty: problem.difficulty as InterviewSelectionProblem["difficulty"],
    id: problem.id,
    primaryTopicId: problem.primary_topic_id,
  };
}

function latestTopicEvidenceAt(
  topicId: string,
  evidence: Array<{
    completedAt: string;
    primaryTopicId: string;
    secondaryTopicIds: string[];
  }>,
) {
  return (
    evidence
      .filter(
        (item) =>
          item.primaryTopicId === topicId ||
          item.secondaryTopicIds.includes(topicId),
      )
      .map((item) => item.completedAt)
      .sort((left, right) => right.localeCompare(left))[0] ?? null
  );
}
