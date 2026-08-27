import { round } from "@/domain/mastery";

export type MasterySnapshot = {
  complexity: number;
  independence: number;
  overall: number;
  recognition: number;
  retention: number;
  speed: number;
};

export function overallReadiness(
  masteries: MasterySnapshot[],
  totalCoreTopics: number,
  interviewScores: number[] = [],
) {
  if (masteries.length === 0 || totalCoreTopics <= 0) {
    return {
      complexity: 0,
      corePatterns: 0,
      coverage: 0,
      independentSolving: 0,
      interviewExecution: null,
      overall: 0,
      recognition: 0,
      retention: 0,
      timedPerformance: 0,
    };
  }

  const dimensions = {
    complexity: average(masteries.map((item) => item.complexity)),
    corePatterns: average(masteries.map((item) => item.overall)),
    independentSolving: average(masteries.map((item) => item.independence)),
    recognition: average(masteries.map((item) => item.recognition)),
    retention: average(masteries.map((item) => item.retention)),
    timedPerformance: average(masteries.map((item) => item.speed)),
  };
  const coverage = Math.min(1, masteries.length / totalCoreTopics);
  const coverageFactor = 0.55 + 0.45 * Math.sqrt(coverage);
  const baseOverall = dimensions.corePatterns * coverageFactor;
  const interviewExecution = interviewScores.length
    ? average(interviewScores)
    : null;

  return {
    ...dimensions,
    coverage: round(coverage * 100, 1),
    interviewExecution:
      interviewExecution === null ? null : round(interviewExecution, 1),
    overall: round(
      interviewExecution === null
        ? baseOverall
        : baseOverall * 0.8 + interviewExecution * 0.2,
      1,
    ),
  };
}

export type CompletedAttemptMetric = {
  completedAt: string;
  complexityCorrect: boolean | null;
  durationSeconds: number;
  helpLevel: string;
  mistakes: string[];
  problemId: string;
  recognizedPatternCorrectly: boolean;
  result: string;
};

export type PerformanceMetric = {
  attemptId: string;
  score: number;
};

export function aggregateAttemptAnalytics(
  attempts: Array<CompletedAttemptMetric & { id: string }>,
  performances: PerformanceMetric[],
) {
  const durations = attempts.map((attempt) => attempt.durationSeconds);
  const complexityAttempts = attempts.filter(
    (attempt) => attempt.complexityCorrect !== null,
  );
  const scoreByAttempt = new Map(
    performances.map((item) => [item.attemptId, item.score]),
  );
  const attemptsByProblem = new Map<string, typeof attempts>();
  for (const attempt of attempts) {
    const group = attemptsByProblem.get(attempt.problemId) ?? [];
    group.push(attempt);
    attemptsByProblem.set(attempt.problemId, group);
  }
  const improvementSamples = [...attemptsByProblem.values()].flatMap(
    (group) => {
      if (group.length < 2) return [];
      const chronological = [...group].sort(
        (left, right) =>
          new Date(left.completedAt).getTime() -
          new Date(right.completedAt).getTime(),
      );
      const first = scoreByAttempt.get(chronological[0]!.id);
      const last = scoreByAttempt.get(
        chronological[chronological.length - 1]!.id,
      );
      return first === undefined || last === undefined ? [] : [last - first];
    },
  );

  return {
    averageDurationSeconds: durations.length ? round(average(durations), 0) : 0,
    complexityAccuracy: percentage(
      complexityAttempts.filter((attempt) => attempt.complexityCorrect).length,
      complexityAttempts.length,
    ),
    helpUsageRate: percentage(
      attempts.filter((attempt) => attempt.helpLevel !== "none").length,
      attempts.length,
    ),
    independentSolveRate: percentage(
      attempts.filter(
        (attempt) =>
          attempt.result === "solved" && attempt.helpLevel === "none",
      ).length,
      attempts.length,
    ),
    medianDurationSeconds: median(durations),
    patternAccuracy: percentage(
      attempts.filter((attempt) => attempt.recognizedPatternCorrectly).length,
      attempts.length,
    ),
    repeatImprovement:
      improvementSamples.length > 0
        ? round(average(improvementSamples) * 100, 1)
        : null,
    repeatedMistakes: repeatedValues(
      attempts.flatMap((attempt) => attempt.mistakes),
    ),
    totalAttempts: attempts.length,
  };
}

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values: number[]) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[middle - 1]! + sorted[middle]!) / 2)
    : sorted[middle]!;
}

function percentage(numerator: number, denominator: number) {
  return denominator === 0 ? 0 : round((numerator / denominator) * 100, 1);
}

function repeatedValues(values: string[]) {
  const counts = new Map<string, number>();
  for (const value of values) {
    const normalized = value.trim().toLowerCase();
    if (normalized) counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
  }
  return [...counts]
    .filter(([, count]) => count > 1)
    .sort(
      (left, right) => right[1] - left[1] || left[0].localeCompare(right[0]),
    )
    .slice(0, 5)
    .map(([mistake, count]) => ({ count, mistake }));
}
