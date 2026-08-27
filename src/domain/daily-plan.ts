export type DailyPlanItemType =
  | "lesson"
  | "mock_interview"
  | "problem"
  | "reflection"
  | "review_card"
  | "review_problem";

export type DailyPlanSource = {
  entityId: string;
  estimatedMinutes: number;
  href: string;
  reason: string;
  title: string;
};

export type DailyPlanInput = {
  availableMinutes: number;
  dueReviews: DailyPlanSource[];
  interviewDate: string | null;
  lessons: DailyPlanSource[];
  localDate: string;
  problems: DailyPlanSource[];
  recentWorkloadMinutes: number;
};

export type GeneratedDailyPlanItem = DailyPlanSource & {
  estimatedMinutes: number;
  position: number;
  priority: number;
  type: DailyPlanItemType;
};

export type GeneratedDailyPlan = {
  availableMinutes: number;
  items: GeneratedDailyPlanItem[];
  localDate: string;
  plannedMinutes: number;
  recentWorkloadMinutes: number;
};

type DraftItem = DailyPlanSource & {
  priority: number;
  type: DailyPlanItemType;
};

const FIVE_MINUTES = 5;

export function generateDailyPlan(input: DailyPlanInput): GeneratedDailyPlan {
  const availableMinutes = clampToFive(input.availableMinutes, 30, 240);
  const recentWorkloadMinutes = clampToFive(
    input.recentWorkloadMinutes,
    0,
    Math.max(0, availableMinutes - 30),
  );
  const planningMinutes = availableMinutes - recentWorkloadMinutes;
  const targetItems = targetItemCount(
    planningMinutes,
    input.dueReviews.length > 0,
  );
  const drafts: DraftItem[] = [];

  if (input.dueReviews[0]) {
    drafts.push({
      ...input.dueReviews[0],
      priority: 100,
      type: "review_problem",
    });
  }
  if (input.lessons[0]) {
    drafts.push({ ...input.lessons[0], priority: 80, type: "lesson" });
  }
  if (input.problems[0]) {
    drafts.push({ ...input.problems[0], priority: 70, type: "problem" });
  }

  const additional: DraftItem[] = [
    ...input.problems.slice(1, 3).map((problem, index) => ({
      ...problem,
      priority: 65 - index * 5,
      type: "problem" as const,
    })),
    ...input.dueReviews.slice(1, 2).map((review) => ({
      ...review,
      priority: 90,
      type: "review_problem" as const,
    })),
  ];
  for (const item of additional) {
    if (drafts.length >= targetItems - 1) break;
    if (drafts.some((existing) => existing.entityId === item.entityId))
      continue;
    drafts.push(item);
  }

  drafts.push({
    entityId: "reflection",
    estimatedMinutes: 5,
    href: "/history",
    priority: 40,
    reason: "Consolidate the day into one reusable takeaway.",
    title: "Reflection and recall check",
    type: "reflection",
  });

  if (drafts.length < 3) {
    for (const problem of input.problems.slice(1)) {
      if (drafts.length >= 3) break;
      if (drafts.some((item) => item.entityId === problem.entityId)) continue;
      drafts.splice(-1, 0, { ...problem, priority: 55, type: "problem" });
    }
  }

  const boundedDrafts = drafts.slice(0, 6);
  const allocations = allocateMinutes(
    boundedDrafts.map((item) => item.type),
    planningMinutes,
    allocationWeights(input.interviewDate, input.localDate),
  );
  const items = boundedDrafts.map((item, index) => ({
    ...item,
    estimatedMinutes: allocations[index] ?? FIVE_MINUTES,
    position: index + 1,
  }));

  return {
    availableMinutes,
    items,
    localDate: input.localDate,
    plannedMinutes: items.reduce(
      (total, item) => total + item.estimatedMinutes,
      0,
    ),
    recentWorkloadMinutes,
  };
}

export function localDateKey(value: Date, timeZone: string) {
  try {
    const parts = new Intl.DateTimeFormat("en", {
      day: "2-digit",
      month: "2-digit",
      timeZone,
      year: "numeric",
    }).formatToParts(value);
    const part = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((item) => item.type === type)?.value;
    const year = part("year");
    const month = part("month");
    const day = part("day");
    if (year && month && day) return `${year}-${month}-${day}`;
  } catch {
    // Invalid stored timezones safely fall back to UTC below.
  }
  return value.toISOString().slice(0, 10);
}

export function defaultDailyMinutes(weeklyStudyMinutes: number) {
  return clampToFive(Math.round(weeklyStudyMinutes / 7), 30, 180);
}

function targetItemCount(minutes: number, hasReview: boolean) {
  if (minutes < 45) return hasReview ? 4 : 3;
  if (minutes < 75) return 4;
  if (minutes < 105) return 5;
  return 6;
}

function allocationWeights(interviewDate: string | null, localDate: string) {
  const days = interviewDate
    ? Math.round(
        (Date.parse(`${interviewDate}T12:00:00.000Z`) -
          Date.parse(`${localDate}T12:00:00.000Z`)) /
          86_400_000,
      )
    : Number.POSITIVE_INFINITY;
  if (days >= 0 && days <= 14) {
    return { lesson: 0.15, problem: 0.5, reflection: 0.1, review: 0.25 };
  }
  if (days >= 0 && days <= 30) {
    return { lesson: 0.2, problem: 0.45, reflection: 0.1, review: 0.25 };
  }
  return { lesson: 0.25, problem: 0.45, reflection: 0.1, review: 0.2 };
}

function allocateMinutes(
  types: DailyPlanItemType[],
  availableMinutes: number,
  weights: {
    lesson: number;
    problem: number;
    reflection: number;
    review: number;
  },
) {
  if (types.length === 0) return [];
  const minimumTotal = types.length * FIVE_MINUTES;
  const usableMinutes = Math.max(minimumTotal, availableMinutes);
  const category = (type: DailyPlanItemType) =>
    type === "lesson"
      ? "lesson"
      : type === "review_problem" || type === "review_card"
        ? "review"
        : type === "reflection"
          ? "reflection"
          : "problem";
  const counts = types.reduce<Record<string, number>>((result, type) => {
    const key = category(type);
    result[key] = (result[key] ?? 0) + 1;
    return result;
  }, {});
  const activeWeight = Object.keys(counts).reduce(
    (total, key) => total + weights[key as keyof typeof weights],
    0,
  );
  const targets = types.map(
    (type) =>
      (usableMinutes * weights[category(type)]) /
      activeWeight /
      (counts[category(type)] ?? 1),
  );
  const allocations = types.map(() => FIVE_MINUTES);
  let remaining = usableMinutes - minimumTotal;
  while (remaining >= FIVE_MINUTES) {
    let bestIndex = 0;
    let largestDeficit = Number.NEGATIVE_INFINITY;
    for (let index = 0; index < allocations.length; index += 1) {
      const deficit = (targets[index] ?? 0) - (allocations[index] ?? 0);
      if (deficit > largestDeficit) {
        largestDeficit = deficit;
        bestIndex = index;
      }
    }
    allocations[bestIndex] = (allocations[bestIndex] ?? 0) + FIVE_MINUTES;
    remaining -= FIVE_MINUTES;
  }
  return allocations;
}

function clampToFive(value: number, minimum: number, maximum: number) {
  const bounded = Math.min(maximum, Math.max(minimum, value));
  return Math.floor(bounded / FIVE_MINUTES) * FIVE_MINUTES;
}
