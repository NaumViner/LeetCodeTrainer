import "server-only";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { defaultInterviewPreferences } from "@/domain/interview-setup";
import { quickInterviewSetupSchema } from "@/features/mock-interviews/schema";

const trialSchema = z.object({
  consumed: z.boolean(),
  interviewId: z.uuid().nullable(),
  status: z.enum(["active", "completed", "abandoned"]).nullable(),
});

export async function getGuestInterviewTrial() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_guest_interview_trial");
  const parsed = trialSchema.safeParse(data);
  if (error || !parsed.success)
    throw new Error("Your interview trial could not be loaded.");
  return parsed.data;
}

export async function getInterviewPreferences() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_interview_preferences");
  const parsed = quickInterviewSetupSchema.safeParse(data);
  return parsed.success ? parsed.data : defaultInterviewPreferences;
}
