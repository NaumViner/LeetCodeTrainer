import type { InterviewCoverage } from "@/domain/interview-coverage";
import type { ScoredRecommendation } from "@/domain/recommendation";

export const INTERVIEW_SELECTION_ALGORITHM_VERSION = 1;

export type InterviewDifficulty = "easy" | "medium" | "hard";
export type InterviewSelectionMode =
  "coverage" | "improvement" | "learning" | "custom";

export type InterviewSelectionProblem = {
  active: boolean;
  datasetOrder: number;
  difficulty: InterviewDifficulty;
  id: string;
  availableForInterview: boolean;
  primaryTopicId: string;
};

export type InterviewTopicPerformance = {
  adjustedScore: number | null;
  confidence: number;
  lastEvidenceAt: string | null;
  name: string;
  ordinal: number;
  topicId: string;
};

export function rankImprovementTopics(
  topics: InterviewTopicPerformance[],
): InterviewTopicPerformance[] {
  return [...topics].sort(compareTopicPerformance);
}

export type InterviewSelectionErrorCode =
  | "invalid_difficulty_filter"
  | "no_interview_ready_inventory"
  | "difficulty_excludes_uncovered_topics"
  | "improvement_requires_full_coverage"
  | "insufficient_improvement_evidence"
  | "difficulty_excludes_weak_topics"
  | "no_learning_recommendations"
  | "invalid_custom_topic"
  | "custom_combination_unavailable";

export type InterviewSelectionMetadata = {
  algorithmVersion: number;
  candidateProblemCount: number;
  candidateTopicCount: number;
  recencyFallbackUsed: boolean;
  repeatFallbackUsed: boolean;
};

export type InterviewSelectionSuccess<
  TProblem extends InterviewSelectionProblem,
> = {
  actualDifficulty: InterviewDifficulty;
  metadata: InterviewSelectionMetadata;
  mode: InterviewSelectionMode;
  ok: true;
  problem: TProblem;
  reasons: string[];
  selectedTopicId: string;
};

export type InterviewSelectionFailure = {
  code: InterviewSelectionErrorCode;
  details: {
    difficulties?: InterviewDifficulty[];
    topicIds?: string[];
  };
  message: string;
  mode: InterviewSelectionMode;
  ok: false;
};

export type InterviewSelectionResult<
  TProblem extends InterviewSelectionProblem,
> = InterviewSelectionSuccess<TProblem> | InterviewSelectionFailure;

type RandomSelectionInput<TProblem extends InterviewSelectionProblem> = {
  catalog: TProblem[];
  collectionProblemIds: ReadonlySet<string>;
  completedProblemIds: ReadonlySet<string>;
  randomIndex: (upperBound: number) => number;
};

type BalancedSelectionInput<TProblem extends InterviewSelectionProblem> =
  RandomSelectionInput<TProblem> & {
    coverage: InterviewCoverage;
    selectedDifficulties: InterviewDifficulty[];
  };

export function selectCoverageInterview<
  TProblem extends InterviewSelectionProblem,
>(input: BalancedSelectionInput<TProblem>): InterviewSelectionResult<TProblem> {
  const mode = "coverage" as const;
  const difficultyError = validateDifficultyFilter(
    mode,
    input.selectedDifficulties,
  );
  if (difficultyError) return difficultyError;

  const readyCollection = readyCollectionProblems(input);
  const selectedDifficultyPool = filterByDifficulties(
    readyCollection,
    input.selectedDifficulties,
  );
  const targetTopics = input.coverage.complete
    ? leastCoveredTopicsWithInventory(input.coverage, selectedDifficultyPool)
    : input.coverage.missingTopics.filter((topic) =>
        selectedDifficultyPool.some(
          (problem) => problem.primaryTopicId === topic.id,
        ),
      );

  if (targetTopics.length === 0) {
    const desiredTopics = input.coverage.complete
      ? input.coverage.topics
      : input.coverage.missingTopics;
    const hasReadyInventory = desiredTopics.some((topic) =>
      readyCollection.some((problem) => problem.primaryTopicId === topic.id),
    );
    return failure(
      mode,
      hasReadyInventory
        ? "difficulty_excludes_uncovered_topics"
        : "no_interview_ready_inventory",
      hasReadyInventory
        ? "The selected difficulties exclude every topic that Coverage needs next."
        : "No interview-ready problems are available for the topics that Coverage needs next.",
      {
        difficulties: [...input.selectedDifficulties],
        topicIds: desiredTopics.map((topic) => topic.id),
      },
    );
  }

  const recentTopicIds = new Set(input.coverage.recentTopicIds.slice(0, 2));
  const freshTopics = targetTopics.filter(
    (topic) => !recentTopicIds.has(topic.id),
  );
  const recencyFallbackUsed =
    freshTopics.length === 0 &&
    targetTopics.some((topic) => recentTopicIds.has(topic.id));
  const topicPool = freshTopics.length > 0 ? freshTopics : targetTopics;
  const selectedTopic = pickRandom(topicPool, input.randomIndex);
  const problemPool = selectedDifficultyPool.filter(
    (problem) => problem.primaryTopicId === selectedTopic.id,
  );
  const problemSelection = pickFreshProblem(
    problemPool,
    input.completedProblemIds,
    input.randomIndex,
  );

  return success(
    mode,
    problemSelection.problem,
    selectedTopic.id,
    {
      candidateProblemCount: problemPool.length,
      candidateTopicCount: targetTopics.length,
      recencyFallbackUsed,
      repeatFallbackUsed: problemSelection.repeatFallbackUsed,
    },
    [
      input.coverage.complete
        ? "Selected randomly from the least-covered topics."
        : "Selected randomly from topics without a completed interview.",
      recencyFallbackUsed
        ? "Recent-topic avoidance was relaxed because every eligible topic was recent."
        : "Your two most recent interview topics were avoided when possible.",
      problemSelection.repeatFallbackUsed
        ? "A previous problem was reused because no fresh problem was available in the selected pool."
        : "A problem you have not completed in an interview was preferred.",
    ],
  );
}

export function selectImprovementInterview<
  TProblem extends InterviewSelectionProblem,
>(
  input: BalancedSelectionInput<TProblem> & {
    topicPerformance: InterviewTopicPerformance[];
  },
): InterviewSelectionResult<TProblem> {
  const mode = "improvement" as const;
  if (!input.coverage.complete) {
    return failure(
      mode,
      "improvement_requires_full_coverage",
      "Improvement becomes available after every interview topic has one completed interview.",
      { topicIds: input.coverage.missingTopics.map((topic) => topic.id) },
    );
  }
  const difficultyError = validateDifficultyFilter(
    mode,
    input.selectedDifficulties,
  );
  if (difficultyError) return difficultyError;

  const metricsByTopicId = new Map(
    input.topicPerformance.map((metric) => [metric.topicId, metric]),
  );
  const missingEvidenceTopicIds = input.coverage.topics
    .filter((topic) => {
      const metric = metricsByTopicId.get(topic.id);
      return (
        !metric ||
        metric.adjustedScore === null ||
        !Number.isFinite(metric.adjustedScore) ||
        !Number.isFinite(metric.confidence)
      );
    })
    .map((topic) => topic.id);
  if (missingEvidenceTopicIds.length > 0) {
    return failure(
      mode,
      "insufficient_improvement_evidence",
      "Comparable evaluated interview evidence is missing for one or more topics.",
      { topicIds: missingEvidenceTopicIds },
    );
  }

  const weakTopics = rankImprovementTopics(
    input.coverage.topics.map((topic) => metricsByTopicId.get(topic.id)!),
  ).slice(0, 3);
  const readyCollection = readyCollectionProblems(input);
  const selectedDifficultyPool = filterByDifficulties(
    readyCollection,
    input.selectedDifficulties,
  );
  const eligibleWeakTopics = weakTopics.filter((topic) =>
    selectedDifficultyPool.some(
      (problem) => problem.primaryTopicId === topic.topicId,
    ),
  );

  if (eligibleWeakTopics.length === 0) {
    return failure(
      mode,
      "difficulty_excludes_weak_topics",
      "The selected difficulties exclude all three currently weakest topics.",
      {
        difficulties: [...input.selectedDifficulties],
        topicIds: weakTopics.map((topic) => topic.topicId),
      },
    );
  }

  const recentTopicIds = new Set(input.coverage.recentTopicIds.slice(0, 2));
  const nonRecentWeakTopics = eligibleWeakTopics.filter(
    (topic) => !recentTopicIds.has(topic.topicId),
  );
  const recencyFallbackUsed =
    nonRecentWeakTopics.length === 0 &&
    eligibleWeakTopics.some((topic) => recentTopicIds.has(topic.topicId));
  const topicPool =
    nonRecentWeakTopics.length > 0 ? nonRecentWeakTopics : eligibleWeakTopics;
  const selectedTopic = pickRandom(topicPool, input.randomIndex);
  const problemPool = selectedDifficultyPool.filter(
    (problem) => problem.primaryTopicId === selectedTopic.topicId,
  );
  const problemSelection = pickFreshProblem(
    problemPool,
    input.completedProblemIds,
    input.randomIndex,
  );

  return success(
    mode,
    problemSelection.problem,
    selectedTopic.topicId,
    {
      candidateProblemCount: problemPool.length,
      candidateTopicCount: eligibleWeakTopics.length,
      recencyFallbackUsed,
      repeatFallbackUsed: problemSelection.repeatFallbackUsed,
    },
    [
      `Selected randomly from the three weakest evaluated topics; this topic's adjusted score is ${selectedTopic.adjustedScore}.`,
      recencyFallbackUsed
        ? "Recent-topic avoidance was relaxed because every eligible weak topic was recent."
        : "Your two most recent interview topics were avoided when possible.",
      problemSelection.repeatFallbackUsed
        ? "A previous problem was reused because no fresh problem was available in the selected pool."
        : "A problem you have not completed in an interview was preferred.",
    ],
  );
}

export function selectLearningInterview<
  TProblem extends InterviewSelectionProblem,
>(input: {
  catalog: TProblem[];
  collectionProblemIds: ReadonlySet<string>;
  rankedRecommendations: ScoredRecommendation[];
  recentProblemIds: ReadonlySet<string>;
}): InterviewSelectionResult<TProblem> {
  const mode = "learning" as const;
  const readyById = new Map(
    readyCollectionProblems(input).map((problem) => [problem.id, problem]),
  );
  const ranked = input.rankedRecommendations
    .flatMap((recommendation) => {
      const problem = readyById.get(recommendation.candidate.id);
      return problem ? [{ problem, recommendation }] : [];
    })
    .sort(compareRecommendations);
  const eligible = ranked.filter(
    ({ recommendation }) => recommendation.eligible,
  );
  const candidatePool = eligible.length > 0 ? eligible : ranked;
  if (candidatePool.length === 0) {
    return failure(
      mode,
      "no_learning_recommendations",
      "No interview-ready Learning recommendation is available in the canonical collection.",
    );
  }

  const fresh = candidatePool.filter(
    ({ problem }) => !input.recentProblemIds.has(problem.id),
  );
  const recencyFallbackUsed =
    fresh.length === 0 &&
    candidatePool.some(({ problem }) => input.recentProblemIds.has(problem.id));
  const selected = (fresh.length > 0 ? fresh : candidatePool)[0]!;

  return success(
    mode,
    selected.problem,
    selected.problem.primaryTopicId,
    {
      candidateProblemCount: candidatePool.length,
      candidateTopicCount: new Set(
        candidatePool.map(({ problem }) => problem.primaryTopicId),
      ).size,
      recencyFallbackUsed,
      repeatFallbackUsed: false,
    },
    selected.recommendation.reasons.length > 0
      ? selected.recommendation.reasons.slice(0, 3)
      : ["Selected by the adaptive learning-readiness score."],
  );
}

export function selectCustomInterview<
  TProblem extends InterviewSelectionProblem,
>(
  input: RandomSelectionInput<TProblem> & {
    requestedDifficulty: InterviewDifficulty;
    requestedTopicId: string;
    validTopicIds: ReadonlySet<string>;
  },
): InterviewSelectionResult<TProblem> {
  const mode = "custom" as const;
  if (!isDifficulty(input.requestedDifficulty)) {
    return failure(
      mode,
      "invalid_difficulty_filter",
      "Custom selection requires exactly one supported difficulty.",
    );
  }
  if (!input.validTopicIds.has(input.requestedTopicId)) {
    return failure(
      mode,
      "invalid_custom_topic",
      "The requested topic is not part of the canonical interview collection.",
      { topicIds: [input.requestedTopicId] },
    );
  }

  const problemPool = readyCollectionProblems(input).filter(
    (problem) =>
      problem.primaryTopicId === input.requestedTopicId &&
      problem.difficulty === input.requestedDifficulty,
  );
  if (problemPool.length === 0) {
    return failure(
      mode,
      "custom_combination_unavailable",
      "No interview-ready problem is available for the requested topic and difficulty.",
      {
        difficulties: [input.requestedDifficulty],
        topicIds: [input.requestedTopicId],
      },
    );
  }

  const problemSelection = pickFreshProblem(
    problemPool,
    input.completedProblemIds,
    input.randomIndex,
  );
  return success(
    mode,
    problemSelection.problem,
    input.requestedTopicId,
    {
      candidateProblemCount: problemPool.length,
      candidateTopicCount: 1,
      recencyFallbackUsed: false,
      repeatFallbackUsed: problemSelection.repeatFallbackUsed,
    },
    [
      "Selected randomly from the requested topic and exact difficulty.",
      problemSelection.repeatFallbackUsed
        ? "A previous problem was reused because no fresh problem was available in the selected pool."
        : "A problem you have not completed in an interview was preferred.",
    ],
  );
}

function readyCollectionProblems<TProblem extends InterviewSelectionProblem>(
  input: Pick<
    RandomSelectionInput<TProblem>,
    "catalog" | "collectionProblemIds"
  >,
) {
  return input.catalog.filter(
    (problem) =>
      problem.active &&
      problem.availableForInterview &&
      input.collectionProblemIds.has(problem.id),
  );
}

function filterByDifficulties<TProblem extends InterviewSelectionProblem>(
  problems: TProblem[],
  difficulties: InterviewDifficulty[],
) {
  const selected = new Set(difficulties);
  return problems.filter((problem) => selected.has(problem.difficulty));
}

function leastCoveredTopicsWithInventory<
  TProblem extends InterviewSelectionProblem,
>(coverage: InterviewCoverage, problems: TProblem[]) {
  const topicIdsWithInventory = new Set(
    problems.map((problem) => problem.primaryTopicId),
  );
  const topicsWithInventory = coverage.topics.filter((topic) =>
    topicIdsWithInventory.has(topic.id),
  );
  const minimum = Math.min(
    ...topicsWithInventory.map((topic) => topic.completedInterviews),
  );
  return topicsWithInventory.filter(
    (topic) => topic.completedInterviews === minimum,
  );
}

function pickFreshProblem<TProblem extends InterviewSelectionProblem>(
  problems: TProblem[],
  completedProblemIds: ReadonlySet<string>,
  randomIndex: (upperBound: number) => number,
) {
  const fresh = problems.filter(
    (problem) => !completedProblemIds.has(problem.id),
  );
  const repeatFallbackUsed =
    fresh.length === 0 &&
    problems.some((problem) => completedProblemIds.has(problem.id));
  return {
    problem: pickRandom(fresh.length > 0 ? fresh : problems, randomIndex),
    repeatFallbackUsed,
  };
}

function pickRandom<T>(
  candidates: T[],
  randomIndex: (upperBound: number) => number,
) {
  if (candidates.length === 0) {
    throw new RangeError(
      "Cannot randomly select from an empty candidate list.",
    );
  }
  const index = randomIndex(candidates.length);
  if (!Number.isInteger(index) || index < 0 || index >= candidates.length) {
    throw new RangeError(
      `randomIndex returned ${index} for upper bound ${candidates.length}.`,
    );
  }
  return candidates[index]!;
}

function validateDifficultyFilter(
  mode: "coverage" | "improvement",
  difficulties: InterviewDifficulty[],
): InterviewSelectionFailure | null {
  if (
    difficulties.length === 0 ||
    new Set(difficulties).size !== difficulties.length ||
    difficulties.some((difficulty) => !isDifficulty(difficulty))
  ) {
    return failure(
      mode,
      "invalid_difficulty_filter",
      "Select one or more unique supported difficulties.",
    );
  }
  return null;
}

function isDifficulty(value: string): value is InterviewDifficulty {
  return value === "easy" || value === "medium" || value === "hard";
}

function compareTopicPerformance(
  left: InterviewTopicPerformance,
  right: InterviewTopicPerformance,
) {
  return (
    left.adjustedScore! - right.adjustedScore! ||
    left.confidence - right.confidence ||
    compareEvidenceAge(left.lastEvidenceAt, right.lastEvidenceAt) ||
    left.ordinal - right.ordinal ||
    left.name.localeCompare(right.name)
  );
}

function compareEvidenceAge(left: string | null, right: string | null) {
  if (left === right) return 0;
  if (left === null) return -1;
  if (right === null) return 1;
  return new Date(left).getTime() - new Date(right).getTime();
}

function compareRecommendations(
  left: { recommendation: ScoredRecommendation },
  right: { recommendation: ScoredRecommendation },
) {
  return (
    right.recommendation.breakdown.total -
      left.recommendation.breakdown.total ||
    left.recommendation.candidate.datasetOrder -
      right.recommendation.candidate.datasetOrder ||
    left.recommendation.candidate.id.localeCompare(
      right.recommendation.candidate.id,
    )
  );
}

function success<TProblem extends InterviewSelectionProblem>(
  mode: InterviewSelectionMode,
  problem: TProblem,
  selectedTopicId: string,
  metadata: Omit<InterviewSelectionMetadata, "algorithmVersion">,
  reasons: string[],
): InterviewSelectionSuccess<TProblem> {
  return {
    actualDifficulty: problem.difficulty,
    metadata: {
      algorithmVersion: INTERVIEW_SELECTION_ALGORITHM_VERSION,
      ...metadata,
    },
    mode,
    ok: true,
    problem,
    reasons: reasons.slice(0, 3),
    selectedTopicId,
  };
}

function failure(
  mode: InterviewSelectionMode,
  code: InterviewSelectionErrorCode,
  message: string,
  details: InterviewSelectionFailure["details"] = {},
): InterviewSelectionFailure {
  return { code, details, message, mode, ok: false };
}
