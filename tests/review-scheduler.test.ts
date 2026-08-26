import { describe, expect, it } from "vitest";

import {
  reviewBucket,
  scheduleProblemReview,
  type ReviewScheduleInput,
} from "@/domain/review";

const completedAt = new Date("2026-08-26T10:00:00.000Z");

function input(
  changes: Partial<ReviewScheduleInput> = {},
): ReviewScheduleInput {
  return {
    completedAt,
    confidenceAfter: 4,
    durationSeconds: 600,
    estimatedMinutes: 20,
    helpLevel: "none",
    previous: null,
    result: "solved",
    retentionScore: 0.5,
    ...changes,
  };
}

describe("spaced-repetition scheduler", () => {
  it("schedules failures the next day and resets repetition", () => {
    const schedule = scheduleProblemReview(
      input({
        confidenceAfter: 2,
        previous: {
          easinessFactor: 2.2,
          failureStreak: 1,
          intervalDays: 14,
          repetition: 3,
        },
        result: "failed",
        retentionScore: 0,
      }),
    );

    expect(schedule).toMatchObject({
      failureStreak: 2,
      intervalDays: 1,
      repetition: 0,
    });
    expect(schedule.nextReviewAt).toBe("2026-08-27T10:00:00.000Z");
  });

  it("keeps assisted solves inside the specified baseline windows", () => {
    expect(
      scheduleProblemReview(input({ helpLevel: "full_solution" })).intervalDays,
    ).toBe(2);
    expect(
      scheduleProblemReview(input({ helpLevel: "pattern_hint" })).intervalDays,
    ).toBe(3);
    expect(
      scheduleProblemReview(input({ helpLevel: "small_hint" })).intervalDays,
    ).toBe(5);
  });

  it("expands strong independent recall from 14 to at most 30 days", () => {
    const first = scheduleProblemReview(input());
    const second = scheduleProblemReview(
      input({
        confidenceAfter: 5,
        previous: first,
        retentionScore: 1,
      }),
    );
    const third = scheduleProblemReview(
      input({
        confidenceAfter: 5,
        previous: second,
        retentionScore: 1,
      }),
    );

    expect(first.intervalDays).toBe(14);
    expect(second.intervalDays).toBe(30);
    expect(third.intervalDays).toBe(30);
    expect(third.repetition).toBe(3);
  });

  it("classifies queue dates in the learner timezone", () => {
    const now = new Date("2026-08-26T20:00:00.000Z");
    expect(
      reviewBucket(new Date("2026-08-26T19:59:00.000Z"), now, "Asia/Jerusalem"),
    ).toBe("due_now");
    expect(
      reviewBucket(new Date("2026-08-26T20:30:00.000Z"), now, "Asia/Jerusalem"),
    ).toBe("due_today");
    expect(
      reviewBucket(new Date("2026-08-27T21:30:00.000Z"), now, "Asia/Jerusalem"),
    ).toBe("upcoming");
  });
});
