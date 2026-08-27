import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type DiagnosticAttempt = Tables<"diagnostic_attempts">;
export type DiagnosticResponse = Tables<"diagnostic_responses">;

export async function getDiagnosticAttempt(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("diagnostic_attempts")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error("The diagnostic could not be loaded.");
  return data;
}

export async function getDiagnosticResponses(attemptId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("diagnostic_responses")
    .select("*")
    .eq("diagnostic_attempt_id", attemptId)
    .order("created_at");
  if (error) throw new Error("Diagnostic responses could not be loaded.");
  return data ?? [];
}
