"use server";

import { redirect } from "next/navigation";

import { requireAuthenticatedUser } from "@/features/auth/session";
import {
  profileFormSchema,
  type ProfileActionState,
} from "@/features/profile/schema";
import { createClient } from "@/lib/supabase/server";

export async function saveProfileAction(
  _previousState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const result = profileFormSchema.safeParse({
    displayName: formData.get("displayName"),
    experienceLevel: formData.get("experienceLevel"),
    interviewDate: formData.get("interviewDate"),
    preferredLanguage: formData.get("preferredLanguage"),
    targetCompanies: formData.getAll("targetCompanies"),
    targetRole: formData.get("targetRole"),
    timezone: formData.get("timezone"),
    weeklyStudyHours: formData.get("weeklyStudyHours"),
  });

  if (!result.success) {
    return {
      fieldErrors: result.error.flatten().fieldErrors,
      message: "Check the highlighted fields.",
      status: "error",
    };
  }

  const user = await requireAuthenticatedUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: result.data.displayName,
      experience_level: result.data.experienceLevel,
      interview_date: result.data.interviewDate,
      onboarding_completed: true,
      preferred_language: result.data.preferredLanguage,
      target_companies: result.data.targetCompanies,
      target_role: result.data.targetRole,
      timezone: result.data.timezone,
      weekly_study_minutes: result.data.weeklyStudyHours * 60,
    })
    .eq("id", user.id);

  if (error) {
    return {
      message: "Your profile could not be saved. Please try again.",
      status: "error",
    };
  }

  redirect("/dashboard");
}
