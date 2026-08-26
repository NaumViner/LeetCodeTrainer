"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAuthenticatedUser } from "@/features/auth/session";
import { createClient } from "@/lib/supabase/server";

const problemIdSchema = z.uuid();

export async function startReviewAttemptAction(formData: FormData) {
  const problemId = problemIdSchema.safeParse(formData.get("problemId"));
  if (!problemId.success) throw new Error("The review problem is invalid.");

  const user = await requireAuthenticatedUser();
  const supabase = await createClient();
  const { data: active } = await supabase
    .from("attempts")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "started")
    .maybeSingle();
  if (active) redirect("/practice/" + active.id);

  const { data: review, error: reviewError } = await supabase
    .from("problem_reviews")
    .select("problem_id")
    .eq("user_id", user.id)
    .eq("problem_id", problemId.data)
    .maybeSingle();
  if (reviewError || !review) {
    throw new Error("That scheduled review is unavailable.");
  }

  const { data: attempt, error } = await supabase
    .from("attempts")
    .insert({ mode: "review", problem_id: review.problem_id, user_id: user.id })
    .select("id")
    .single();
  if (error || !attempt) {
    throw new Error("The review session could not be started.");
  }

  revalidatePath("/dashboard");
  revalidatePath("/review");
  redirect("/practice/" + attempt.id);
}
