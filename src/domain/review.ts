import type { HelpLevel } from "@/domain/practice";
import { round } from "@/domain/mastery";

const DAY_MS = 86_400_000;

export type ReviewState = {
  easinessFactor: number;
  failureStreak: number;
  intervalDays: number;
  repetition: number;
};

export type ReviewScheduleInput = {
  completedAt: Date;
  confidenceAfter: number | null;
  durationSeconds: number;
  estimatedMinutes: number;
  helpLevel: HelpLevel;
  previous: ReviewState | null;
  result: "failed" | "partial" | "solved";
  retentionScore: number;
};

export type ReviewSchedule = ReviewState & {
  nextReviewAt: string;
  quality: number;
};

const helpPenalty: Record<HelpLevel, number> = {
  copied: 4,
  full_solution: 3.5,
  pseudocode: 2,
  pattern_hint: 1.5,
  concept_hint: 1,
  small_hint: 0.5,
  none: 0,
};

export function scheduleProblemReview(
  input: ReviewScheduleInput,
): ReviewSchedule {
  const previous = input.previous ?? {
    easinessFactor: 2.5,
    failureStreak: 0,
    intervalDays: 0,
    repetition: 0,
  };
  const quality = reviewQuality(input, previous.failureStreak);
  const easinessFactor = nextEasiness(previous.easinessFactor, quality);
  const solved = input.result === "solved";
  const failureStreak = solved ? 0 : previous.failureStreak + 1;
  const repetition = solved ? previous.repetition + 1 : 0;
  const intervalDays = chooseInterval(input, previous, quality, easinessFactor);

  return {
    easinessFactor,
    failureStreak,
    intervalDays,
    nextReviewAt: new Date(
      input.completedAt.getTime() + intervalDays * DAY_MS,
    ).toISOString(),
    quality,
    repetition,
  };
}

export type ReviewBucket = "due_now" | "due_today" | "upcoming";

export function reviewBucket(
  nextReviewAt: Date,
  now: Date,
  timeZone: string,
): ReviewBucket {
  if (nextReviewAt.getTime() <= now.getTime()) return "due_now";
  return localDateKey(nextReviewAt, timeZone) === localDateKey(now, timeZone)
    ? "due_today"
    : "upcoming";
}

function reviewQuality(input: ReviewScheduleInput, failureStreak: number) {
  const correctness =
    input.result === "solved" ? 5 : input.result === "partial" ? 2 : 0;
  const confidence = input.confidenceAfter ?? 3;
  const targetSeconds = Math.max(60, input.estimatedMinutes * 60);
  const paceRatio = input.durationSeconds / targetSeconds;
  const paceAdjustment = paceRatio <= 1 ? 0.25 : paceRatio > 1.5 ? -0.5 : 0;
  const confidenceAdjustment = (confidence - 3) * 0.25;
  const retentionAdjustment = (clamp(input.retentionScore, 0, 1) - 0.5) * 0.5;

  return round(
    clamp(
      correctness -
        helpPenalty[input.helpLevel] +
        confidenceAdjustment +
        paceAdjustment +
        retentionAdjustment -
        failureStreak * 0.25,
      0,
      5,
    ),
    2,
  );
}

function nextEasiness(current: number, quality: number) {
  const distance = 5 - quality;
  return round(
    clamp(current + 0.1 - distance * (0.08 + distance * 0.02), 1.3, 2.5),
    2,
  );
}

function chooseInterval(
  input: ReviewScheduleInput,
  previous: ReviewState,
  quality: number,
  easinessFactor: number,
) {
  if (input.result === "failed") return 1;
  if (input.result === "partial") return input.helpLevel === "none" ? 2 : 1;

  const factor = clamp(0.75 + quality / 20, 0.75, 1);
  if (input.helpLevel === "copied" || input.helpLevel === "full_solution") {
    return clamp(Math.round(2 * factor), 1, 2);
  }
  if (input.helpLevel === "pseudocode") {
    return clamp(Math.round(2 * factor), 1, 3);
  }
  if (input.helpLevel === "pattern_hint") {
    return clamp(Math.round(3 * factor), 2, 4);
  }
  if (input.helpLevel === "concept_hint") {
    return clamp(Math.round(4 * factor), 3, 5);
  }
  if (input.helpLevel === "small_hint") {
    return clamp(Math.round(5 * factor), 4, 7);
  }

  const targetSeconds = Math.max(60, input.estimatedMinutes * 60);
  const strongRepeat =
    previous.repetition >= 1 &&
    input.retentionScore >= 0.8 &&
    (input.confidenceAfter ?? 3) >= 4 &&
    input.durationSeconds <= targetSeconds * 1.25;
  if (strongRepeat) {
    return clamp(
      Math.round(Math.max(14, previous.intervalDays * easinessFactor)),
      14,
      30,
    );
  }
  if (previous.repetition >= 1) {
    return clamp(Math.round(Math.max(7, previous.intervalDays * 1.5)), 7, 14);
  }
  return clamp(Math.round(7 + (quality / 5) * 7), 7, 14);
}

function localDateKey(value: Date, timeZone: string) {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      day: "2-digit",
      month: "2-digit",
      timeZone,
      year: "numeric",
    }).format(value);
  } catch {
    return value.toISOString().slice(0, 10);
  }
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}
