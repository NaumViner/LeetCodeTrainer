"use server";

import {
  realtimeEventInputSchema,
  realtimeSessionEndSchema,
} from "@/features/realtime-interviews/model";
import { requireAuthenticatedUser } from "@/features/auth/session";
import { mockInterviewIdSchema } from "@/features/mock-interviews/schema";
import { createClient } from "@/lib/supabase/server";

type RealtimeActionResult =
  { status: "success" } | { message: string; status: "error" };

export async function saveRealtimeInterviewEventAction(
  interviewId: string,
  input: unknown,
): Promise<RealtimeActionResult> {
  const id = mockInterviewIdSchema.safeParse(interviewId);
  const event = realtimeEventInputSchema.safeParse(input);
  if (!id.success || !event.success) return invalidRealtimeInput();
  await requireAuthenticatedUser();
  const supabase = await createClient();
  const { error } = await supabase.rpc("append_realtime_interview_event", {
    p_content: event.data.content,
    p_event_type: event.data.eventType,
    p_mock_interview_id: id.data,
    p_phase: event.data.phase ?? "intro",
  });
  if (error) return realtimeSaveError();
  return { status: "success" };
}

export async function endRealtimeInterviewSessionAction(
  interviewId: string,
  input: unknown,
): Promise<RealtimeActionResult> {
  const id = mockInterviewIdSchema.safeParse(interviewId);
  const completion = realtimeSessionEndSchema.safeParse(input);
  if (!id.success || !completion.success) return invalidRealtimeInput();
  await requireAuthenticatedUser();
  const supabase = await createClient();
  const { error } = await supabase.rpc("end_realtime_interview_session", {
    p_mock_interview_id: id.data,
    p_status: completion.data.status,
    p_summary: completion.data.summary,
  });
  if (error) return realtimeSaveError();
  return { status: "success" };
}

function invalidRealtimeInput(): RealtimeActionResult {
  return { message: "The live interview event is invalid.", status: "error" };
}

function realtimeSaveError(): RealtimeActionResult {
  return {
    message: "The live interview transcript could not be saved.",
    status: "error",
  };
}
