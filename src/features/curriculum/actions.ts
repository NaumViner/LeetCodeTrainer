"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAuthenticatedUser } from "@/features/auth/session";
import { createClient } from "@/lib/supabase/server";

const lessonIdSchema = z.uuid();

export async function completeLessonAction(formData: FormData) {
  const lessonId = lessonIdSchema.safeParse(formData.get("lessonId"));

  if (!lessonId.success) {
    throw new Error("The lesson identifier is invalid.");
  }

  const user = await requireAuthenticatedUser();
  const supabase = await createClient();
  const completedAt = new Date().toISOString();
  const { error } = await supabase.from("lesson_progress").upsert(
    {
      completed_at: completedAt,
      lesson_id: lessonId.data,
      started_at: completedAt,
      user_id: user.id,
    },
    { onConflict: "user_id,lesson_id" },
  );

  if (error) {
    throw new Error("Your lesson progress could not be saved.");
  }

  revalidatePath("/dashboard");
  revalidatePath("/learn", "layout");
}
