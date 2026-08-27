import { describe, expect, it } from "vitest";

import {
  defaultDailyMinutes,
  generateDailyPlan,
  localDateKey,
  type DailyPlanSource,
} from "@/domain/daily-plan";

const source = (
  id: string,
  title: string,
  estimatedMinutes = 20,
): DailyPlanSource => ({
  entityId: id,
  estimatedMinutes,
  href: `/work/${id}`,
  reason: `Reason for ${title}`,
  title,
});

describe("daily-plan generation", () => {
  it("builds a balanced five-task plan inside the available budget", () => {
    const plan = generateDailyPlan({
      availableMinutes: 75,
      dueReviews: [source("review", "Review arrays")],
      interviewDate: null,
      lessons: [source("lesson", "Learn sliding window", 15)],
      localDate: "2026-08-27",
      problems: [
        source("problem-1", "Practice one"),
        source("problem-2", "Practice two"),
        source("problem-3", "Practice three"),
      ],
      recentWorkloadMinutes: 0,
    });

    expect(plan.items.map((item) => item.type)).toEqual([
      "review_problem",
      "lesson",
      "problem",
      "problem",
      "reflection",
    ]);
    expect(plan.plannedMinutes).toBe(75);
    expect(plan.items).toHaveLength(5);
    expect(plan.items.every((item) => item.estimatedMinutes % 5 === 0)).toBe(
      true,
    );
  });

  it("subtracts today's completed workload without dropping below thirty minutes", () => {
    const plan = generateDailyPlan({
      availableMinutes: 75,
      dueReviews: [source("review", "Review arrays")],
      interviewDate: null,
      lessons: [source("lesson", "Learn trees")],
      localDate: "2026-08-27",
      problems: [source("problem", "Practice trees")],
      recentWorkloadMinutes: 25,
    });

    expect(plan.recentWorkloadMinutes).toBe(25);
    expect(plan.plannedMinutes).toBe(50);
    expect(plan.items).toHaveLength(4);
  });

  it("creates three useful tasks for a short day without a due review", () => {
    const plan = generateDailyPlan({
      availableMinutes: 30,
      dueReviews: [],
      interviewDate: null,
      lessons: [source("lesson", "Learn hashing")],
      localDate: "2026-08-27",
      problems: [source("problem", "Practice hashing")],
      recentWorkloadMinutes: 0,
    });

    expect(plan.items.map((item) => item.type)).toEqual([
      "lesson",
      "problem",
      "reflection",
    ]);
    expect(plan.plannedMinutes).toBe(30);
  });

  it("shifts time from learning toward problems near an interview", () => {
    const plan = generateDailyPlan({
      availableMinutes: 75,
      dueReviews: [source("review", "Review graphs")],
      interviewDate: "2026-09-05",
      lessons: [source("lesson", "Learn graphs")],
      localDate: "2026-08-27",
      problems: [
        source("problem-1", "Practice graphs one"),
        source("problem-2", "Practice graphs two"),
      ],
      recentWorkloadMinutes: 0,
    });
    const lessonMinutes = plan.items.find(
      (item) => item.type === "lesson",
    )!.estimatedMinutes;
    const problemMinutes = plan.items
      .filter((item) => item.type === "problem")
      .reduce((total, item) => total + item.estimatedMinutes, 0);

    expect(problemMinutes).toBeGreaterThan(lessonMinutes);
  });

  it("derives local dates and daily defaults deterministically", () => {
    expect(
      localDateKey(new Date("2026-08-26T21:30:00.000Z"), "Asia/Jerusalem"),
    ).toBe("2026-08-27");
    expect(defaultDailyMinutes(480)).toBe(65);
    expect(defaultDailyMinutes(60)).toBe(30);
  });
});
