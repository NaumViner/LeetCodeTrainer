import { round } from "@/domain/mastery";
import type { InterviewerLevel } from "@/domain/mock-interview";
import type { InterviewEvaluationDimension } from "@/features/interview-evaluation/model";

export const INTERVIEW_PROFILE_LEVELS = [
  "Foundation",
  "Developing",
  "Practicing",
  "Interview Ready",
  "Strong",
  "Advanced",
] as const;

export type InterviewProfileLevel = (typeof INTERVIEW_PROFILE_LEVELS)[number];
export type InterviewProfileDifficulty = "easy" | "medium" | "hard";

export type InterviewProfileEvidence = {
  completedAt: string;
  confidence: number;
  difficulty: InterviewProfileDifficulty;
  dimensions: Record<
    InterviewEvaluationDimension,
    { confidence: number; score: number }
  >;
  evidenceCoverage: {
    hasCode: boolean;
    hasFirstPartyQuestionContent: boolean;
    hasTrustedTests: boolean;
    phaseTimingCount: number;
    transcriptTurns: number;
  };
  id: string;
  interviewerLevel: InterviewerLevel;
  primaryTopicId: string;
  rawScore: number;
  recurringSignals: string[];
  secondaryTopicIds: string[];
};

export type InterviewProfileMetric = {
  adjustedScore: number | null;
  confidence: number;
  effectiveWeight: number;
  level: InterviewProfileLevel | null;
  rawScore: number | null;
  sampleSize: number;
  trend: {
    delta: number | null;
    direction: "declining" | "improving" | "stable" | "insufficient";
  };
};

export type InterviewProfileScope = {
  difficulties: Record<InterviewProfileDifficulty, InterviewProfileMetric>;
  dimensions: Record<InterviewEvaluationDimension, InterviewProfileMetric>;
  interviewerLevels: Record<InterviewerLevel, InterviewProfileMetric>;
  overall: InterviewProfileMetric;
  topics: Record<string, InterviewProfileMetric>;
};

export type InterviewPerformanceProfile = {
  allTime: InterviewProfileScope;
  evaluatedInterviews: number;
  last30Days: InterviewProfileScope;
  last90Days: InterviewProfileScope;
  recurringSignals: Array<{ count: number; signal: string }>;
  strongestDimensions: InterviewEvaluationDimension[];
  weakestDimensions: InterviewEvaluationDimension[];
};

type ProfileOptions = {
  now: Date;
  totalTopicCount: number;
  topicIds: string[];
};

const DIMENSIONS: InterviewEvaluationDimension[] = [
  "problemUnderstanding",
  "clarification",
  "approachQuality",
  "optimization",
  "correctness",
  "codeQuality",
  "testing",
  "complexityReasoning",
  "communication",
  "independence",
];
const DIFFICULTIES: InterviewProfileDifficulty[] = ["easy", "medium", "hard"];
const INTERVIEWER_LEVELS: InterviewerLevel[] = ["beginner", "faang_tough"];
const DIFFICULTY_ANCHOR: Record<InterviewProfileDifficulty, number> = {
  easy: 45,
  hard: 75,
  medium: 60,
};

export function challengeAdjustedInterviewScore(
  rawScore: number,
  difficulty: InterviewProfileDifficulty,
  interviewerLevel: InterviewerLevel,
) {
  const interviewerAnchor = interviewerLevel === "faang_tough" ? 5 : 0;
  return round(
    clamp(
      DIFFICULTY_ANCHOR[difficulty] + interviewerAnchor + 0.6 * (rawScore - 60),
      0,
      100,
    ),
    1,
  );
}

export function interviewProfileLevel(
  score: number,
  confidence: number,
  sampleSize: number,
): InterviewProfileLevel {
  const scoreIndex =
    score < 35
      ? 0
      : score < 50
        ? 1
        : score < 65
          ? 2
          : score < 78
            ? 3
            : score < 90
              ? 4
              : 5;
  const confidenceCap =
    sampleSize < 2
      ? 1
      : confidence < 55
        ? 2
        : confidence < 70
          ? 3
          : confidence < 82
            ? 4
            : 5;
  return INTERVIEW_PROFILE_LEVELS[Math.min(scoreIndex, confidenceCap)]!;
}

export function buildInterviewPerformanceProfile(
  evidence: InterviewProfileEvidence[],
  options: ProfileOptions,
): InterviewPerformanceProfile {
  const valid = evidence
    .filter((item) => isProfileEvidenceUsable(item, options.now))
    .sort(
      (left, right) =>
        new Date(right.completedAt).getTime() -
        new Date(left.completedAt).getTime(),
    );
  const recent30 = withinDays(valid, options.now, 30);
  const recent90 = withinDays(valid, options.now, 90);
  const allTime = buildScope(valid, options);
  const rankedDimensions = DIMENSIONS.map((dimension) => ({
    dimension,
    metric: allTime.dimensions[dimension],
  })).filter((item) => item.metric.adjustedScore !== null);

  return {
    allTime,
    evaluatedInterviews: valid.length,
    last30Days: buildScope(recent30, options),
    last90Days: buildScope(recent90, options),
    recurringSignals: recurringSignals(valid),
    strongestDimensions: [...rankedDimensions]
      .filter((item) => item.metric.confidence >= 35)
      .sort(
        (left, right) =>
          right.metric.adjustedScore! - left.metric.adjustedScore!,
      )
      .slice(0, 3)
      .map((item) => item.dimension),
    weakestDimensions: [...rankedDimensions]
      .sort(
        (left, right) =>
          left.metric.adjustedScore! - right.metric.adjustedScore!,
      )
      .slice(0, 3)
      .map((item) => item.dimension),
  };
}

function buildScope(
  evidence: InterviewProfileEvidence[],
  options: ProfileOptions,
): InterviewProfileScope {
  return {
    difficulties: Object.fromEntries(
      DIFFICULTIES.map((difficulty) => [
        difficulty,
        metric(
          evidence.filter((item) => item.difficulty === difficulty),
          options,
          null,
          "difficulty",
        ),
      ]),
    ) as Record<InterviewProfileDifficulty, InterviewProfileMetric>,
    dimensions: Object.fromEntries(
      DIMENSIONS.map((dimension) => [
        dimension,
        metric(evidence, options, dimension, "dimension"),
      ]),
    ) as Record<InterviewEvaluationDimension, InterviewProfileMetric>,
    interviewerLevels: Object.fromEntries(
      INTERVIEWER_LEVELS.map((level) => [
        level,
        metric(
          evidence.filter((item) => item.interviewerLevel === level),
          options,
          null,
          "interviewer",
        ),
      ]),
    ) as Record<InterviewerLevel, InterviewProfileMetric>,
    overall: metric(evidence, options, null, "overall"),
    topics: Object.fromEntries(
      options.topicIds.map((topicId) => [
        topicId,
        metric(
          evidence.filter(
            (item) =>
              item.primaryTopicId === topicId ||
              item.secondaryTopicIds.includes(topicId),
          ),
          options,
          null,
          "topic",
        ),
      ]),
    ),
  };
}

function metric(
  evidence: InterviewProfileEvidence[],
  options: ProfileOptions,
  dimension: InterviewEvaluationDimension | null,
  scope: "difficulty" | "dimension" | "interviewer" | "overall" | "topic",
): InterviewProfileMetric {
  if (evidence.length === 0) return emptyMetric();
  const samples = evidence.map((item) => {
    const raw = dimension
      ? item.dimensions[dimension].score * 20
      : item.rawScore;
    const evaluatorConfidence = dimension
      ? item.confidence * item.dimensions[dimension].confidence
      : item.confidence;
    const richness = evidenceRichness(item);
    const recency = recencyWeight(item.completedAt, options.now);
    const weight = evaluatorConfidence * recency * (0.5 + 0.5 * richness);
    return {
      adjusted: challengeAdjustedInterviewScore(
        raw,
        item.difficulty,
        item.interviewerLevel,
      ),
      evaluatorConfidence,
      item,
      raw,
      recency,
      richness,
      weight,
    };
  });
  const totalWeight = samples.reduce(
    (total, sample) => total + sample.weight,
    0,
  );
  if (totalWeight <= 0) return emptyMetric();
  const adjustedScore = weightedAverage(samples, "adjusted", totalWeight);
  const rawScore = weightedAverage(samples, "raw", totalWeight);
  const sampleMaturity = 1 - Math.exp(-evidence.length / 4);
  const evaluatorConfidence = average(
    samples.map((sample) => sample.evaluatorConfidence),
  );
  const recency = average(samples.map((sample) => sample.recency));
  const richness = average(samples.map((sample) => sample.richness));
  const breadth = breadthFactor(evidence, options.totalTopicCount, scope);
  const consistency = consistencyFactor(
    samples.map((sample) => sample.adjusted),
  );
  const confidence = round(
    100 *
      (0.25 * sampleMaturity +
        0.25 * evaluatorConfidence +
        0.15 * recency +
        0.15 * breadth +
        0.1 * richness +
        0.1 * consistency),
    1,
  );

  return {
    adjustedScore,
    confidence,
    effectiveWeight: round(totalWeight, 3),
    level: interviewProfileLevel(adjustedScore, confidence, evidence.length),
    rawScore,
    sampleSize: evidence.length,
    trend: trend(samples.map((sample) => sample.adjusted)),
  };
}

function evidenceRichness(item: InterviewProfileEvidence) {
  return clamp(
    0.2 +
      (item.evidenceCoverage.hasCode ? 0.2 : 0) +
      (item.evidenceCoverage.hasFirstPartyQuestionContent ? 0.1 : 0) +
      (item.evidenceCoverage.hasTrustedTests ? 0.25 : 0) +
      0.15 * Math.min(1, item.evidenceCoverage.phaseTimingCount / 8) +
      0.2 * Math.min(1, item.evidenceCoverage.transcriptTurns / 12),
    0,
    1,
  );
}

function breadthFactor(
  evidence: InterviewProfileEvidence[],
  totalTopicCount: number,
  scope: "difficulty" | "dimension" | "interviewer" | "overall" | "topic",
) {
  const topicIds = new Set(
    evidence.flatMap((item) => [
      item.primaryTopicId,
      ...item.secondaryTopicIds,
    ]),
  );
  const difficulties = new Set(evidence.map((item) => item.difficulty));
  const interviewers = new Set(evidence.map((item) => item.interviewerLevel));
  const topicBreadth = Math.min(
    1,
    topicIds.size / Math.max(1, totalTopicCount),
  );
  const difficultyBreadth = difficulties.size / DIFFICULTIES.length;
  if (scope === "topic") {
    return 0.6 * Math.min(1, evidence.length / 3) + 0.4 * difficultyBreadth;
  }
  if (scope === "difficulty") {
    return (
      0.6 * topicBreadth + 0.4 * (interviewers.size / INTERVIEWER_LEVELS.length)
    );
  }
  return 0.6 * topicBreadth + 0.4 * difficultyBreadth;
}

function consistencyFactor(values: number[]) {
  if (values.length < 2) return 0.5;
  const mean = average(values);
  const deviation = Math.sqrt(
    average(values.map((value) => (value - mean) ** 2)),
  );
  return clamp(1 - deviation / 30, 0, 1);
}

function trend(valuesNewestFirst: number[]): InterviewProfileMetric["trend"] {
  if (valuesNewestFirst.length < 4) {
    return { delta: null, direction: "insufficient" };
  }
  const recent = valuesNewestFirst.slice(0, 3);
  const previous = valuesNewestFirst.slice(3, 6);
  if (previous.length < 2) return { delta: null, direction: "insufficient" };
  const delta = round(average(recent) - average(previous), 1);
  return {
    delta,
    direction: delta > 3 ? "improving" : delta < -3 ? "declining" : "stable",
  };
}

function recurringSignals(evidence: InterviewProfileEvidence[]) {
  const counts = new Map<string, { count: number; signal: string }>();
  for (const item of evidence) {
    for (const signal of new Set(item.recurringSignals)) {
      const normalized = signal.trim().toLocaleLowerCase("en-US");
      if (!normalized) continue;
      const current = counts.get(normalized);
      counts.set(normalized, {
        count: (current?.count ?? 0) + 1,
        signal: current?.signal ?? signal.trim(),
      });
    }
  }
  return [...counts.values()]
    .filter((item) => item.count >= 2)
    .sort(
      (left, right) =>
        right.count - left.count || left.signal.localeCompare(right.signal),
    )
    .slice(0, 8);
}

function isProfileEvidenceUsable(item: InterviewProfileEvidence, now: Date) {
  const completedAt = new Date(item.completedAt);
  return (
    Number.isFinite(completedAt.getTime()) &&
    completedAt <= now &&
    item.rawScore >= 0 &&
    item.rawScore <= 100 &&
    item.confidence > 0 &&
    item.confidence <= 1
  );
}

function withinDays(
  evidence: InterviewProfileEvidence[],
  now: Date,
  days: number,
) {
  const boundary = now.getTime() - days * 86_400_000;
  return evidence.filter(
    (item) => new Date(item.completedAt).getTime() >= boundary,
  );
}

function recencyWeight(completedAt: string, now: Date) {
  const ageDays = Math.max(
    0,
    (now.getTime() - new Date(completedAt).getTime()) / 86_400_000,
  );
  return 0.5 ** (ageDays / 180);
}

function weightedAverage(
  samples: Array<{ adjusted: number; raw: number; weight: number }>,
  key: "adjusted" | "raw",
  totalWeight: number,
) {
  return round(
    samples.reduce((total, sample) => total + sample[key] * sample.weight, 0) /
      totalWeight,
    1,
  );
}

function emptyMetric(): InterviewProfileMetric {
  return {
    adjustedScore: null,
    confidence: 0,
    effectiveWeight: 0,
    level: null,
    rawScore: null,
    sampleSize: 0,
    trend: { delta: null, direction: "insufficient" },
  };
}

function average(values: number[]) {
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}
