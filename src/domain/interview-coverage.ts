export type InterviewCoverageMembership = {
  ordinal: number;
  primaryTopicId: string;
  problemId: string;
};

export type InterviewCoverageTopicMetadata = {
  id: string;
  name: string;
  slug: string;
};

export type CompletedInterviewForCoverage = {
  completedAt: string;
  problemId: string;
};

export type InterviewTopicCoverage = {
  completedInterviews: number;
  id: string;
  lastCompletedAt: string | null;
  name: string;
  ordinal: number;
  slug: string;
};

export type InterviewCoverage = {
  complete: boolean;
  coveredTopicCount: number;
  missingTopics: InterviewTopicCoverage[];
  recentTopicIds: string[];
  topics: InterviewTopicCoverage[];
  totalTopicCount: number;
};

export function buildInterviewCoverage(input: {
  completedInterviews: CompletedInterviewForCoverage[];
  memberships: InterviewCoverageMembership[];
  topics: InterviewCoverageTopicMetadata[];
}): InterviewCoverage {
  const topicMetadataById = new Map(
    input.topics.map((topic) => [topic.id, topic]),
  );
  const topicOrdinalById = new Map<string, number>();
  const topicIdByProblemId = new Map<string, string>();

  for (const membership of input.memberships) {
    topicIdByProblemId.set(membership.problemId, membership.primaryTopicId);
    const currentOrdinal = topicOrdinalById.get(membership.primaryTopicId);
    if (currentOrdinal === undefined || membership.ordinal < currentOrdinal) {
      topicOrdinalById.set(membership.primaryTopicId, membership.ordinal);
    }
  }

  const countByTopicId = new Map<string, number>();
  const lastCompletedAtByTopicId = new Map<string, string>();
  const completedWithTopic = input.completedInterviews
    .flatMap((interview) => {
      const topicId = topicIdByProblemId.get(interview.problemId);
      return topicId ? [{ ...interview, topicId }] : [];
    })
    .sort(
      (left, right) =>
        new Date(right.completedAt).getTime() -
        new Date(left.completedAt).getTime(),
    );

  for (const interview of completedWithTopic) {
    countByTopicId.set(
      interview.topicId,
      (countByTopicId.get(interview.topicId) ?? 0) + 1,
    );
    const currentLatest = lastCompletedAtByTopicId.get(interview.topicId);
    if (!currentLatest || interview.completedAt > currentLatest) {
      lastCompletedAtByTopicId.set(interview.topicId, interview.completedAt);
    }
  }

  const topics = [...topicOrdinalById.entries()]
    .flatMap(([topicId, ordinal]) => {
      const metadata = topicMetadataById.get(topicId);
      return metadata
        ? [
            {
              completedInterviews: countByTopicId.get(topicId) ?? 0,
              id: topicId,
              lastCompletedAt: lastCompletedAtByTopicId.get(topicId) ?? null,
              name: metadata.name,
              ordinal,
              slug: metadata.slug,
            },
          ]
        : [];
    })
    .sort(
      (left, right) =>
        left.ordinal - right.ordinal || left.name.localeCompare(right.name),
    );
  const missingTopics = topics.filter(
    (topic) => topic.completedInterviews === 0,
  );
  const coveredTopicCount = topics.length - missingTopics.length;

  return {
    complete: topics.length > 0 && missingTopics.length === 0,
    coveredTopicCount,
    missingTopics,
    recentTopicIds: uniqueInOrder(
      completedWithTopic.map((interview) => interview.topicId),
    ),
    topics,
    totalTopicCount: topics.length,
  };
}

function uniqueInOrder(values: string[]) {
  const seen = new Set<string>();
  return values.filter((value) => {
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}
