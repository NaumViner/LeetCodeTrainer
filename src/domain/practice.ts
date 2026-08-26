export const ATTEMPT_PHASES = [
  "pre_attempt",
  "planning",
  "coding",
  "testing",
  "reflection",
  "completed",
] as const;

export type AttemptPhase = (typeof ATTEMPT_PHASES)[number];

export const HELP_LEVEL_SCORES = {
  concept_hint: 0.8,
  copied: 0.05,
  full_solution: 0.2,
  none: 1,
  pattern_hint: 0.65,
  pseudocode: 0.45,
  small_hint: 0.9,
} as const;

export type HelpLevel = keyof typeof HELP_LEVEL_SCORES;

export type RecommendationCandidate = {
  curriculumLevel: string;
  datasetOrder: number;
  id: string;
  primaryTopicId: string;
};

export type RecommendationAttempt = {
  problemId: string;
  status: string;
};

const levelPriority: Record<string, number> = {
  foundation: 0,
  guided: 1,
  independent: 2,
  timed: 3,
  interview: 4,
};

export function recommendProblem(
  candidates: RecommendationCandidate[],
  attempts: RecommendationAttempt[],
  completedTopicIds: Set<string>,
  userId: string,
) {
  const attemptCounts = new Map<string, number>();
  for (const attempt of attempts) {
    if (attempt.status === "completed") {
      attemptCounts.set(
        attempt.problemId,
        (attemptCounts.get(attempt.problemId) ?? 0) + 1,
      );
    }
  }

  const eligible = candidates.filter(
    (candidate) =>
      candidate.curriculumLevel === "foundation" ||
      completedTopicIds.has(candidate.primaryTopicId),
  );
  const pool = eligible.length > 0 ? eligible : candidates;

  return [...pool].sort((left, right) => {
    const leftScore = recommendationScore(
      left,
      attemptCounts,
      completedTopicIds,
      userId,
    );
    const rightScore = recommendationScore(
      right,
      attemptCounts,
      completedTopicIds,
      userId,
    );
    return leftScore - rightScore;
  })[0];
}

function recommendationScore(
  candidate: RecommendationCandidate,
  attemptCounts: Map<string, number>,
  completedTopicIds: Set<string>,
  userId: string,
) {
  const repeats = attemptCounts.get(candidate.id) ?? 0;
  const unlockedBonus = completedTopicIds.has(candidate.primaryTopicId)
    ? -500
    : 0;
  const level = levelPriority[candidate.curriculumLevel] ?? 5;
  const stableTieBreaker = stableHash(userId + candidate.id) % 10;

  return (
    repeats * 10_000 +
    level * 1_000 +
    unlockedBonus +
    candidate.datasetOrder * 10 +
    stableTieBreaker
  );
}

function stableHash(value: string) {
  let hash = 0;
  for (const character of value) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }
  return hash;
}

export function canTransitionAttempt(
  current: AttemptPhase,
  target: AttemptPhase,
) {
  const currentIndex = ATTEMPT_PHASES.indexOf(current);
  const targetIndex = ATTEMPT_PHASES.indexOf(target);
  return targetIndex === currentIndex || targetIndex === currentIndex + 1;
}

export type HintContext = {
  patternTags: string[];
  primaryTopic: string;
  recognitionSignals: string[];
};

const hintLevels = [
  "small_hint",
  "concept_hint",
  "pattern_hint",
  "pseudocode",
  "pseudocode",
  "full_solution",
] as const satisfies readonly HelpLevel[];

export function buildProgressiveHint(context: HintContext, ordinal: number) {
  const signal =
    context.recognitionSignals[
      (ordinal - 1) % context.recognitionSignals.length
    ] ?? "look for repeated work and a stable invariant";
  const tags = context.patternTags.slice(0, 3).join(", ");
  const hints = [
    {
      title: "Socratic question",
      content:
        "What information do you recompute, and what could you retain so each step does less work?",
    },
    {
      title: "Concept nudge",
      content: "Focus on this recognition signal: " + signal + ".",
    },
    {
      title: "Pattern reveal",
      content:
        "This belongs to the " +
        context.primaryTopic +
        " family. Useful pattern tags: " +
        tags +
        ".",
    },
    {
      title: "Structural hint",
      content:
        "Define the state you maintain, the invariant it represents, how one input step updates it, and exactly when an answer becomes valid.",
    },
    {
      title: "Pseudocode scaffold",
      content:
        "initialize required state\nfor each relevant candidate:\n  update the state\n  restore the invariant if needed\n  update the best valid answer\nreturn the recorded answer",
    },
    {
      title: "Full pattern explanation",
      content:
        "Use the revealed pattern to eliminate repeated work: establish its invariant before the loop, update only the affected state at each step, and prove that every candidate is processed once or with bounded extra work. Compare your implementation with the original source after you finish.",
    },
  ];
  const index = Math.min(Math.max(ordinal, 1), hints.length) - 1;
  const selectedHint = hints[index] ?? hints[0]!;
  return {
    ...selectedHint,
    helpLevel: hintLevels[index] ?? "small_hint",
    ordinal: index + 1,
  };
}

export function effectiveDurationSeconds(input: {
  durationSeconds: number;
  now: Date;
  timerRunning: boolean;
  timerStartedAt: string | null;
}) {
  if (!input.timerRunning || !input.timerStartedAt) {
    return input.durationSeconds;
  }
  const additional = Math.max(
    0,
    Math.floor(
      (input.now.getTime() - new Date(input.timerStartedAt).getTime()) / 1000,
    ),
  );
  return Math.min(86_400, input.durationSeconds + additional);
}
