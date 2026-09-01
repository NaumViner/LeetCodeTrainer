import type {
  InterviewPerformanceProfile,
  InterviewProfileDifficulty,
} from "@/domain/interview-profile";
import type { InterviewEvaluationDimension } from "@/features/interview-evaluation/model";

export type InterviewFirstActionType =
  | "next_interview"
  | "problem"
  | "topic_drill"
  | "testing_drill"
  | "complexity_drill"
  | "communication_drill"
  | "lesson"
  | "review";

export type InterviewFirstRecommendation = {
  actionType: InterviewFirstActionType;
  directRoute: string;
  estimatedMinutes: number;
  evidence: string[];
  priority: number;
  reasons: string[];
  suggestedDifficulty?: InterviewProfileDifficulty;
  suggestedDurationMinutes?: 30 | 45 | 60;
  target: string;
  title: string;
};

export type InterviewRecommendationCandidate = {
  difficulty: InterviewProfileDifficulty;
  externalId: string | null;
  id: string;
  primaryTopicId: string;
  primaryTopicName: string;
  primaryTopicSlug: string;
  title: string;
};

export type InterviewRecommendationInput = {
  candidates: InterviewRecommendationCandidate[];
  dueProblemIds: Set<string>;
  interviewDate: string | null;
  learningMastery: Map<string, number>;
  now: Date;
  profile: InterviewPerformanceProfile;
  recentProblemIds: string[];
};

const dimensionLabels: Record<InterviewEvaluationDimension, string> = {
  approachQuality: "approach quality",
  clarification: "clarification",
  codeQuality: "code quality",
  communication: "communication",
  complexityReasoning: "complexity reasoning",
  correctness: "correctness",
  independence: "independence",
  optimization: "optimization",
  problemUnderstanding: "problem understanding",
  testing: "testing",
};

export function buildInterviewFirstRecommendations(
  input: InterviewRecommendationInput,
): InterviewFirstRecommendation[] {
  const recommendations: InterviewFirstRecommendation[] = [];
  const weakestDimension = input.profile.weakestDimensions[0];
  const weakTopic = weakestTopic(input);
  const remediationProblem = chooseProblem(input, weakTopic?.topicId ?? null);

  if (weakestDimension) {
    recommendations.push(
      dimensionRemediation(weakestDimension, remediationProblem, input),
    );
  }

  const dueProblem = input.candidates.find(
    (candidate) =>
      input.dueProblemIds.has(candidate.id) &&
      !input.recentProblemIds.slice(0, 2).includes(candidate.id),
  );
  if (dueProblem) {
    recommendations.push({
      actionType: "review",
      directRoute: `/practice?problem=${encodeURIComponent(dueProblem.externalId ?? "")}`,
      estimatedMinutes: 20,
      evidence: [`${dueProblem.title} is due for spaced review.`],
      priority: 2,
      reasons: ["Retention evidence is due and should be refreshed."],
      target: dueProblem.primaryTopicName,
      title: `Review ${dueProblem.title}`,
    });
  }

  if (weakTopic && weakTopic.interviewScore < 55) {
    const mastery = input.learningMastery.get(weakTopic.topicId);
    if (mastery !== undefined && mastery < 45) {
      recommendations.push({
        actionType: "lesson",
        directRoute: `/learn/${weakTopic.topicSlug}`,
        estimatedMinutes: 25,
        evidence: [
          `${weakTopic.topicName} interview evidence is ${Math.round(weakTopic.interviewScore)}.`,
          `Learning mastery is ${Math.round(mastery)}.`,
        ],
        priority: 2,
        reasons: [
          "Both interview execution and learning evidence indicate a knowledge gap.",
        ],
        target: weakTopic.topicName,
        title: `Rebuild ${weakTopic.topicName} foundations`,
      });
    }
  }

  const nextDifficulty = recommendedInterviewDifficulty(input.profile);
  const duration = recommendedDuration(input.profile);
  recommendations.push({
    actionType: "next_interview",
    directRoute: `/interviews?difficulty=${nextDifficulty}&duration=${duration}`,
    estimatedMinutes: duration,
    evidence: nextInterviewEvidence(input.profile, nextDifficulty),
    priority: recommendations.length === 0 ? 1 : 3,
    reasons: [
      weakestDimension
        ? `Use the next interview to verify improvement in ${dimensionLabels[weakestDimension]}.`
        : "Build the first evaluated interview-performance baseline.",
    ],
    suggestedDifficulty: nextDifficulty,
    suggestedDurationMinutes: duration,
    target: weakestDimension
      ? dimensionLabels[weakestDimension]
      : "interview baseline",
    title: `Run a ${duration}-minute ${nextDifficulty} follow-up interview`,
  });

  return recommendations
    .sort((left, right) => left.priority - right.priority)
    .slice(0, 5)
    .map((item) => ({
      ...item,
      evidence: item.evidence.slice(0, 3),
      reasons: item.reasons.slice(0, 3),
    }));
}

export function recommendedInterviewDifficulty(
  profile: InterviewPerformanceProfile,
): InterviewProfileDifficulty {
  const { easy, hard, medium } = profile.allTime.difficulties;
  if (
    hard.sampleSize > 0 &&
    hard.adjustedScore !== null &&
    hard.adjustedScore >= 60
  ) {
    return "hard";
  }
  if (
    medium.sampleSize >= 2 &&
    medium.adjustedScore !== null &&
    medium.adjustedScore >= 72 &&
    medium.confidence >= 55
  ) {
    return "hard";
  }
  if (
    medium.sampleSize > 0 ||
    (easy.sampleSize >= 2 &&
      easy.adjustedScore !== null &&
      easy.adjustedScore >= 60)
  ) {
    return "medium";
  }
  return "easy";
}

function dimensionRemediation(
  dimension: InterviewEvaluationDimension,
  problem: InterviewRecommendationCandidate | null,
  input: InterviewRecommendationInput,
): InterviewFirstRecommendation {
  const metric = input.profile.allTime.dimensions[dimension];
  const target = dimensionLabels[dimension];
  const mapping: Partial<
    Record<InterviewEvaluationDimension, InterviewFirstActionType>
  > = {
    clarification: "communication_drill",
    communication: "communication_drill",
    complexityReasoning: "complexity_drill",
    correctness: "testing_drill",
    testing: "testing_drill",
  };
  const actionType = mapping[dimension] ?? "topic_drill";
  const route = problem?.externalId
    ? `/practice?problem=${encodeURIComponent(problem.externalId)}`
    : "/practice";
  return {
    actionType,
    directRoute: route,
    estimatedMinutes: actionType === "communication_drill" ? 15 : 25,
    evidence: [
      `${target} is currently the lowest-ranked interview dimension.`,
      ...(metric.adjustedScore === null
        ? []
        : [
            `Challenge-adjusted evidence: ${Math.round(metric.adjustedScore)} at ${Math.round(metric.confidence)}% confidence.`,
          ]),
    ],
    priority: 1,
    reasons: [
      `Targeted practice addresses the weakest repeated interview signal before another full interview.`,
    ],
    target,
    title: remediationTitle(actionType, target, problem?.title),
  };
}

function remediationTitle(
  actionType: InterviewFirstActionType,
  target: string,
  problemTitle?: string,
) {
  if (actionType === "communication_drill") return `Practice ${target} aloud`;
  if (actionType === "complexity_drill")
    return "Derive complexity from concrete operations";
  if (actionType === "testing_drill")
    return problemTitle
      ? `Build a test plan for ${problemTitle}`
      : "Build a boundary-case test plan";
  return problemTitle
    ? `Practice ${target} with ${problemTitle}`
    : `Practice ${target}`;
}

function weakestTopic(input: InterviewRecommendationInput) {
  return Object.entries(input.profile.allTime.topics)
    .flatMap(([topicId, metric]) => {
      const candidate = input.candidates.find(
        (item) => item.primaryTopicId === topicId,
      );
      return candidate && metric.adjustedScore !== null
        ? [
            {
              interviewScore: metric.adjustedScore,
              topicId,
              topicName: candidate.primaryTopicName,
              topicSlug: candidate.primaryTopicSlug,
            },
          ]
        : [];
    })
    .sort(
      (left, right) =>
        left.interviewScore - right.interviewScore ||
        left.topicName.localeCompare(right.topicName),
    )[0];
}

function chooseProblem(
  input: InterviewRecommendationInput,
  topicId: string | null,
) {
  const recent = new Set(input.recentProblemIds.slice(0, 5));
  const pool = topicId
    ? input.candidates.filter((item) => item.primaryTopicId === topicId)
    : input.candidates;
  return pool.find((candidate) => !recent.has(candidate.id)) ?? pool[0] ?? null;
}

function recommendedDuration(
  profile: InterviewPerformanceProfile,
): 30 | 45 | 60 {
  if (profile.evaluatedInterviews < 2) return 30;
  return profile.allTime.overall.confidence >= 70 ? 60 : 45;
}

function nextInterviewEvidence(
  profile: InterviewPerformanceProfile,
  difficulty: InterviewProfileDifficulty,
) {
  if (profile.evaluatedInterviews === 0) {
    return ["No evaluated interview baseline exists yet."];
  }
  const metric = profile.allTime.difficulties[difficulty];
  if (metric.sampleSize === 0) {
    return [
      `${difficulty} interview evidence is not yet covered.`,
      `Overall interview confidence is ${Math.round(profile.allTime.overall.confidence)}%.`,
    ];
  }
  return [
    `${difficulty} evidence is ${Math.round(metric.adjustedScore ?? 0)} at ${Math.round(metric.confidence)}% confidence.`,
  ];
}
