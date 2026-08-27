"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  defaultDailyMinutes,
  generateDailyPlan,
  localDateKey,
} from "@/domain/daily-plan";
import { requireAuthenticatedUser } from "@/features/auth/session";
import { getCurriculum } from "@/features/curriculum/queries";
import { getAdaptiveRecommendationSnapshot } from "@/features/practice/recommendation";
import { getProfile } from "@/features/profile/queries";
import { getReviewQueue } from "@/features/reviews/queries";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

const availableMinutesSchema = z.coerce
  .number()
  .int()
  .min(30)
  .max(240)
  .refine((value) => value % 5 === 0);
const itemIdSchema = z.uuid();

export async function generateDailyPlanAction(formData: FormData) {
  const user = await requireAuthenticatedUser();
  const profile = await getProfile(user.id);
  if (!profile?.onboarding_completed) redirect("/onboarding");

  const availableInput = formData.get("availableMinutes");
  const availableMinutes = availableMinutesSchema.safeParse(
    availableInput ?? defaultDailyMinutes(profile.weekly_study_minutes),
  );
  if (!availableMinutes.success) {
    throw new Error("Choose 30–240 minutes in five-minute steps.");
  }

  const now = new Date();
  const localDate = localDateKey(now, profile.timezone);
  const [curriculum, reviews, snapshot] = await Promise.all([
    getCurriculum(user.id),
    getReviewQueue(user.id, now, profile.timezone),
    getAdaptiveRecommendationSnapshot(user.id, now),
  ]);
  const catalogById = new Map(
    snapshot.catalog.map((problem) => [problem.id, problem]),
  );
  const dueReviews = reviews
    .filter((item) => item.bucket !== "upcoming")
    .map((item) => ({
      entityId: item.problem.id,
      estimatedMinutes: item.problem.estimated_minutes,
      href: "/review",
      reason:
        item.bucket === "due_now"
          ? "Overdue retention work takes first priority."
          : "Scheduled for recall today in your timezone.",
      title: `Review: ${item.problem.title}`,
    }));
  const lessons = curriculum.flatMap((topic) =>
    topic.prerequisitesComplete
      ? topic.lessons
          .filter((lesson) => !lesson.completed)
          .map((lesson) => ({
            entityId: lesson.id,
            estimatedMinutes: lesson.estimated_minutes,
            href: `/learn/${topic.slug}/${lesson.slug}`,
            reason: `Continue the ordered curriculum in ${topic.name}.`,
            title: `Learn: ${lesson.title}`,
          }))
      : [],
  );
  const problems = snapshot.ranked.flatMap((scored) => {
    if (
      !scored.eligible ||
      snapshot.evidence.dueProblemIds.has(scored.candidate.id)
    ) {
      return [];
    }
    const problem = catalogById.get(scored.candidate.id);
    if (!problem) return [];
    return [
      {
        entityId: problem.id,
        estimatedMinutes: problem.estimated_minutes,
        href: `/practice?problem=${problem.external_id}`,
        reason:
          scored.reasons[0] ??
          "Adaptive practice matched to your current evidence.",
        title: `Practice: ${problem.title}`,
      },
    ];
  });
  const attemptMinutes = snapshot.evidence.attempts
    .filter(
      (attempt) =>
        attempt.completed_at &&
        localDateKey(new Date(attempt.completed_at), profile.timezone) ===
          localDate,
    )
    .reduce(
      (total, attempt) => total + Math.ceil(attempt.duration_seconds / 60),
      0,
    );
  const lessonMinutes = curriculum
    .flatMap((topic) => topic.lessons)
    .filter(
      (lesson) =>
        lesson.completedAt &&
        localDateKey(new Date(lesson.completedAt), profile.timezone) ===
          localDate,
    )
    .reduce((total, lesson) => total + lesson.estimated_minutes, 0);
  const plan = generateDailyPlan({
    availableMinutes: availableMinutes.data,
    dueReviews,
    interviewDate: profile.interview_date,
    lessons,
    localDate,
    problems,
    recentWorkloadMinutes: attemptMinutes + lessonMinutes,
  });
  if (plan.items.length < 3) {
    throw new Error(
      "There is not enough eligible work to create today's plan.",
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("replace_daily_plan", {
    p_available_minutes: plan.availableMinutes,
    p_items: plan.items.map((item) => ({
      action_path: item.href,
      entity_id: item.type === "reflection" ? null : item.entityId,
      estimated_minutes: item.estimatedMinutes,
      position: item.position,
      priority: item.priority,
      reason: item.reason,
      title: item.title,
      type: item.type,
    })) as Json,
    p_local_date: plan.localDate,
  });
  if (error) throw new Error("Today's plan could not be saved.");

  revalidatePath("/dashboard");
  revalidatePath("/plan");
  redirect("/plan");
}

export async function setDailyPlanItemCompletedAction(formData: FormData) {
  const itemId = itemIdSchema.safeParse(formData.get("itemId"));
  const completed = z
    .enum(["true", "false"])
    .safeParse(formData.get("completed"));
  if (!itemId.success || !completed.success) {
    throw new Error("The daily-plan update is invalid.");
  }

  await requireAuthenticatedUser();
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_daily_plan_item_completed", {
    p_completed: completed.data === "true",
    p_item_id: itemId.data,
  });
  if (error) throw new Error("The daily-plan item could not be updated.");

  revalidatePath("/dashboard");
  revalidatePath("/plan");
}
