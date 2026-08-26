import { HELP_LEVEL_SCORES, type HelpLevel } from "@/domain/practice";

export const PERFORMANCE_WEIGHTS = {
  complexity: 0.1,
  correctness: 0.3,
  independence: 0.3,
  recognition: 0.15,
  retention: 0.1,
  speed: 0.05,
} as const;

export type PerformanceDimensions = {
  complexity: number;
  correctness: number;
  independence: number;
  recognition: number;
  retention: number;
  speed: number;
};

export type AttemptPerformance = PerformanceDimensions & {
  overall: number;
};

export type PerformanceInput = {
  complexityCorrect: boolean | null;
  durationSeconds: number;
  estimatedMinutes: number;
  helpLevel: HelpLevel;
  isRepeat: boolean;
  recognizedPatternCorrectly: boolean;
  result: "failed" | "partial" | "solved";
};

export function scoreAttempt(input: PerformanceInput): AttemptPerformance {
  const correctness =
    input.result === "solved" ? 1 : input.result === "partial" ? 0.5 : 0;
  const independence = HELP_LEVEL_SCORES[input.helpLevel];
  const recognition = input.recognizedPatternCorrectly ? 1 : 0;
  const complexity =
    input.complexityCorrect === null ? 0.5 : input.complexityCorrect ? 1 : 0;
  const retention = input.isRepeat
    ? correctness * (input.helpLevel === "none" ? 1 : independence)
    : 0.5;
  const targetSeconds = Math.max(60, input.estimatedMinutes * 60);
  const ratio = input.durationSeconds / targetSeconds;
  const pace =
    ratio <= 1 ? 1 : ratio <= 1.25 ? 0.75 : ratio <= 1.75 ? 0.5 : 0.25;
  const speed = pace * correctness;
  const dimensions = {
    complexity,
    correctness,
    independence,
    recognition,
    retention,
    speed,
  };

  return {
    ...dimensions,
    overall: weightedPerformance(dimensions),
  };
}

export function weightedPerformance(dimensions: PerformanceDimensions) {
  return round(
    dimensions.correctness * PERFORMANCE_WEIGHTS.correctness +
      dimensions.independence * PERFORMANCE_WEIGHTS.independence +
      dimensions.recognition * PERFORMANCE_WEIGHTS.recognition +
      dimensions.retention * PERFORMANCE_WEIGHTS.retention +
      dimensions.complexity * PERFORMANCE_WEIGHTS.complexity +
      dimensions.speed * PERFORMANCE_WEIGHTS.speed,
    4,
  );
}

export type MasteryScores = {
  complexity: number;
  correctness: number;
  independence: number;
  overall: number;
  recognition: number;
  retention: number;
  speed: number;
};

export function updateMastery(
  current: MasteryScores | null,
  performance: AttemptPerformance,
  previousAttempts: number,
): MasteryScores {
  const alpha =
    previousAttempts === 0 ? 0.35 : previousAttempts === 1 ? 0.3 : 0.25;
  const prior = current ?? {
    complexity: 35,
    correctness: 35,
    independence: 35,
    overall: 35,
    recognition: 35,
    retention: 35,
    speed: 35,
  };
  const scores = {
    complexity: smooth(prior.complexity, performance.complexity, alpha),
    correctness: smooth(prior.correctness, performance.correctness, alpha),
    independence: smooth(prior.independence, performance.independence, alpha),
    recognition: smooth(prior.recognition, performance.recognition, alpha),
    retention: smooth(prior.retention, performance.retention, alpha),
    speed: smooth(prior.speed, performance.speed, alpha),
  };

  return {
    ...scores,
    overall: round(
      scores.correctness * PERFORMANCE_WEIGHTS.correctness +
        scores.independence * PERFORMANCE_WEIGHTS.independence +
        scores.recognition * PERFORMANCE_WEIGHTS.recognition +
        scores.retention * PERFORMANCE_WEIGHTS.retention +
        scores.complexity * PERFORMANCE_WEIGHTS.complexity +
        scores.speed * PERFORMANCE_WEIGHTS.speed,
      2,
    ),
  };
}

function smooth(previous: number, sample: number, alpha: number) {
  return round(previous * (1 - alpha) + sample * 100 * alpha, 2);
}

export function readinessLevel(score: number) {
  if (score >= 85) return "Strong";
  if (score >= 75) return "Interview-capable";
  if (score >= 60) return "Practicing";
  if (score >= 40) return "Developing";
  return "Learning";
}

export function round(value: number, places = 2) {
  const factor = 10 ** places;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}
