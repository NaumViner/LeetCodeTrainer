import type { HelpLevel } from "@/domain/practice";
import { round } from "@/domain/mastery";

export type RecommendationCandidate = {
  curriculumLevel:
    "foundation" | "guided" | "independent" | "interview" | "timed";
  datasetOrder: number;
  difficulty: "easy" | "hard" | "medium";
  id: string;
  prerequisiteTopicIds: string[];
  primaryTopicId: string;
};

export type RecommendationAttempt = {
  completedAt: string;
  difficulty: RecommendationCandidate["difficulty"];
  helpLevel: HelpLevel;
  problemId: string;
  primaryTopicId: string;
  result: "failed" | "partial" | "solved";
};

export type RecommendationTopicEvidence = {
  independentSolves: number;
  overallScore: number;
  topicId: string;
};

export type RecommendationContext = {
  attempts: RecommendationAttempt[];
  completedTopicIds: Set<string>;
  dueProblemIds: Set<string>;
  interviewDate: string | null;
  now: Date;
  topicEvidence: Map<string, RecommendationTopicEvidence>;
  userId: string;
};

export type RecommendationBreakdown = {
  curriculumFit: number;
  difficultyFit: number;
  dueReview: number;
  frustrationPenalty: number;
  interviewUrgency: number;
  novelty: number;
  prerequisiteFit: number;
  recentTopicPenalty: number;
  repeatedProblemPenalty: number;
  topicBalance: number;
  total: number;
  weakness: number;
};

export type ScoredRecommendation = {
  breakdown: RecommendationBreakdown;
  candidate: RecommendationCandidate;
  eligible: boolean;
  reasons: string[];
};

const curriculumLevels = [
  "foundation",
  "guided",
  "independent",
  "timed",
  "interview",
] as const;

export function recommendProblem(
  candidates: RecommendationCandidate[],
  context: RecommendationContext,
) {
  const ranked = rankRecommendations(candidates, context);
  if (ranked.length === 0) return null;
  const leader = ranked[0]!;
  const shortlist = ranked
    .filter((item) => leader.breakdown.total - item.breakdown.total <= 15)
    .slice(0, 5);
  const seed = [
    context.userId,
    context.now.toISOString().slice(0, 10),
    context.attempts.length,
  ].join(":");
  return shortlist[stableHash(seed) % shortlist.length] ?? leader;
}

export function rankRecommendations(
  candidates: RecommendationCandidate[],
  context: RecommendationContext,
) {
  const scored = candidates.map((candidate) =>
    scoreRecommendation(candidate, context),
  );
  const eligible = scored.filter((item) => item.eligible);
  const pool = eligible.length > 0 ? eligible : scored;
  return pool.sort(
    (left, right) =>
      right.breakdown.total - left.breakdown.total ||
      left.candidate.datasetOrder - right.candidate.datasetOrder ||
      left.candidate.id.localeCompare(right.candidate.id),
  );
}

export function scoreRecommendation(
  candidate: RecommendationCandidate,
  context: RecommendationContext,
): ScoredRecommendation {
  const topic = context.topicEvidence.get(candidate.primaryTopicId);
  const topicCompleted = context.completedTopicIds.has(
    candidate.primaryTopicId,
  );
  const mastery = topic?.overallScore ?? (topicCompleted ? 40 : 35);
  const due = context.dueProblemIds.has(candidate.id);
  const prerequisiteReady = candidate.prerequisiteTopicIds.every(
    (topicId) =>
      context.completedTopicIds.has(topicId) ||
      (context.topicEvidence.get(topicId)?.overallScore ?? 0) >= 40,
  );
  const topicFailureStreak = failureStreak(
    context.attempts.filter(
      (attempt) => attempt.primaryTopicId === candidate.primaryTopicId,
    ),
  );
  const problemAttempts = context.attempts.filter(
    (attempt) => attempt.problemId === candidate.id,
  );
  const problemFailureStreak = failureStreak(problemAttempts);
  const recentAttempts = context.attempts.slice(0, 5);
  const recentTopicCount = recentAttempts.filter(
    (attempt) => attempt.primaryTopicId === candidate.primaryTopicId,
  ).length;
  const recentlyAttempted = recentAttempts.some(
    (attempt) => attempt.problemId === candidate.id,
  );

  const weakness = round((100 - mastery) * 1.2);
  const dueReview = due ? 100 : 0;
  const targetLevel = targetCurriculumLevel(
    mastery,
    topic?.independentSolves ?? 0,
    topicCompleted,
    topicFailureStreak,
  );
  const curriculumDistance = Math.abs(
    curriculumLevels.indexOf(candidate.curriculumLevel) -
      curriculumLevels.indexOf(targetLevel),
  );
  const curriculumFit = due ? 50 : Math.max(0, 50 - curriculumDistance * 20);
  const prerequisiteFit = prerequisiteReady ? 25 : -500;
  const topicBalance = recentTopicCount === 0 ? 20 : 0;
  const difficultyFit = difficultyScore(
    candidate.difficulty,
    mastery,
    topicFailureStreak,
  );
  const interviewUrgency = interviewUrgencyScore(
    candidate.curriculumLevel,
    context.interviewDate,
    context.now,
  );
  const novelty = problemAttempts.length === 0 ? 25 : 0;
  const recentTopicPenalty = Math.min(45, recentTopicCount * 15);
  const repeatedProblemPenalty = due
    ? 0
    : (recentlyAttempted ? 120 : 0) + problemAttempts.length * 20;
  const frustrationPenalty =
    problemFailureStreak * 60 +
    (topicFailureStreak >= 2 && candidate.difficulty !== "easy" ? 100 : 0) +
    (candidate.difficulty === "hard" && mastery < 50 ? 80 : 0);
  const total = round(
    weakness +
      dueReview +
      curriculumFit +
      prerequisiteFit +
      topicBalance +
      difficultyFit +
      interviewUrgency +
      novelty -
      recentTopicPenalty -
      repeatedProblemPenalty -
      frustrationPenalty,
  );
  const eligible =
    prerequisiteReady &&
    (due ||
      curriculumEligible(
        candidate.curriculumLevel,
        mastery,
        topic?.independentSolves ?? 0,
        topicCompleted,
      ));
  const breakdown = {
    curriculumFit,
    difficultyFit,
    dueReview,
    frustrationPenalty,
    interviewUrgency,
    novelty,
    prerequisiteFit,
    recentTopicPenalty,
    repeatedProblemPenalty,
    topicBalance,
    total,
    weakness,
  };

  return {
    breakdown,
    candidate,
    eligible,
    reasons: recommendationReasons({
      breakdown,
      candidate,
      due,
      mastery,
      topicFailureStreak,
    }),
  };
}

function curriculumEligible(
  level: RecommendationCandidate["curriculumLevel"],
  mastery: number,
  independentSolves: number,
  topicCompleted: boolean,
) {
  if (level === "foundation") return true;
  if (level === "guided") return topicCompleted || mastery >= 40;
  if (level === "independent") return topicCompleted && mastery >= 45;
  if (level === "timed") {
    return topicCompleted && mastery >= 60 && independentSolves >= 1;
  }
  return topicCompleted && mastery >= 75 && independentSolves >= 2;
}

function targetCurriculumLevel(
  mastery: number,
  independentSolves: number,
  topicCompleted: boolean,
  failureStreakValue: number,
): RecommendationCandidate["curriculumLevel"] {
  if (failureStreakValue >= 2) return "guided";
  if (!topicCompleted && mastery < 40) return "foundation";
  if (mastery < 55) return "guided";
  if (mastery < 70 || independentSolves === 0) return "independent";
  if (mastery < 80 || independentSolves < 2) return "timed";
  return "interview";
}

function difficultyScore(
  difficulty: RecommendationCandidate["difficulty"],
  mastery: number,
  topicFailureStreak: number,
) {
  if (topicFailureStreak >= 2) {
    return difficulty === "easy" ? 40 : difficulty === "medium" ? 5 : 0;
  }
  if (mastery < 40) {
    return difficulty === "easy" ? 40 : difficulty === "medium" ? 10 : 0;
  }
  if (mastery < 60) {
    return difficulty === "medium" ? 40 : difficulty === "easy" ? 35 : 5;
  }
  if (mastery < 75) {
    return difficulty === "medium" ? 40 : difficulty === "hard" ? 20 : 15;
  }
  return difficulty === "hard" ? 40 : difficulty === "medium" ? 35 : 5;
}

function interviewUrgencyScore(
  level: RecommendationCandidate["curriculumLevel"],
  interviewDate: string | null,
  now: Date,
) {
  if (!interviewDate) return 0;
  const interviewTime = new Date(`${interviewDate}T12:00:00.000Z`).getTime();
  const days = Math.ceil((interviewTime - now.getTime()) / 86_400_000);
  if (days < 0 || days > 30) return 0;
  const urgency = days <= 7 ? 40 : days <= 14 ? 30 : 15;
  if (level === "interview" || level === "timed") return urgency;
  if (level === "independent") return round(urgency * 0.5);
  return 0;
}

function failureStreak(attempts: RecommendationAttempt[]) {
  let count = 0;
  for (const attempt of attempts) {
    if (attempt.result === "solved") break;
    count += 1;
  }
  return count;
}

function recommendationReasons(input: {
  breakdown: RecommendationBreakdown;
  candidate: RecommendationCandidate;
  due: boolean;
  mastery: number;
  topicFailureStreak: number;
}) {
  const reasons: string[] = [];
  if (input.due) reasons.push("This problem is due for retention review.");
  if (input.topicFailureStreak >= 2 && input.candidate.difficulty === "easy") {
    reasons.push("An easier recovery step follows recent difficulty.");
  }
  if (input.breakdown.novelty > 0) {
    reasons.push("A new problem reduces unhelpful repetition.");
  }
  if (input.breakdown.weakness >= 60) {
    reasons.push(
      `It strengthens a developing topic with ${Math.round(input.mastery)} mastery.`,
    );
  }
  if (input.breakdown.difficultyFit >= 35) {
    reasons.push("Its difficulty matches your current evidence.");
  }
  if (input.breakdown.topicBalance > 0) {
    reasons.push("It restores topic balance after recent work.");
  }
  if (input.breakdown.interviewUrgency > 0) {
    reasons.push("It matches the urgency of your interview date.");
  }
  return reasons.slice(0, 3);
}

function stableHash(value: string) {
  let hash = 0;
  for (const character of value) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }
  return hash;
}
