"use server";

import {
  realtimeEventInputSchema,
  realtimeSessionEndSchema,
} from "@/features/realtime-interviews/model";
import { requireAuthenticatedUser } from "@/features/auth/session";
import { mockInterviewIdSchema } from "@/features/mock-interviews/schema";
import {
  mockInterviewPhaseSuggestionSchema,
  type MockInterviewPhaseSuggestionActionResult,
} from "@/features/mock-interviews/schema";
import { createClient } from "@/lib/supabase/server";
import { recordOperationalEvent } from "@/lib/operational-events";

type RealtimeActionResult =
  { eventId: string; status: "success" } | { message: string; status: "error" };

export async function saveRealtimeInterviewEventAction(
  interviewId: string,
  input: unknown,
): Promise<RealtimeActionResult> {
  const id = mockInterviewIdSchema.safeParse(interviewId);
  const event = realtimeEventInputSchema.safeParse(input);
  if (!id.success || !event.success) return invalidRealtimeInput();
  await requireAuthenticatedUser();
  const supabase = await createClient();
  const { data: eventId, error } = await supabase.rpc(
    "append_realtime_interview_event",
    {
      p_content: event.data.content,
      p_event_type: event.data.eventType,
      p_mock_interview_id: id.data,
      p_phase: event.data.phase ?? "intro",
    },
  );
  if (error || eventId === null) return realtimeSaveError();
  return { eventId: String(eventId), status: "success" };
}

export async function recordMockInterviewPhaseSuggestionAction(
  interviewId: string,
  input: unknown,
): Promise<MockInterviewPhaseSuggestionActionResult> {
  const startedAt = Date.now();
  const id = mockInterviewIdSchema.safeParse(interviewId);
  const suggestion = mockInterviewPhaseSuggestionSchema.safeParse(input);
  if (!id.success || !suggestion.success) {
    recordOperationalEvent("mock_interview_phase_suggestion_rejected", {
      latencyMs: Date.now() - startedAt,
      reason: "invalid_contract",
    });
    return {
      message: "The interviewer phase suggestion was invalid.",
      status: "error",
    };
  }
  await requireAuthenticatedUser();
  const supabase = await createClient();
  const { data: eventId, error } = await supabase.rpc(
    "suggest_mock_interview_phase",
    {
      p_evidence_event_ids: suggestion.data.evidenceEventIds.map(Number),
      p_expected_current_phase: suggestion.data.expectedCurrentPhase,
      p_mock_interview_id: id.data,
      p_reason_code: suggestion.data.reasonCode,
      p_suggested_next_phase: suggestion.data.suggestedNextPhase,
    },
  );
  if (!error && eventId === null) {
    recordOperationalEvent("mock_interview_phase_suggestion_rejected", {
      interviewId: id.data,
      latencyMs: Date.now() - startedAt,
      reason: "stale_phase",
    });
    return {
      message: "The phase changed before the suggestion was recorded.",
      status: "stale",
    };
  }
  if (error || !eventId) {
    recordOperationalEvent("mock_interview_phase_suggestion_rejected", {
      interviewId: id.data,
      latencyMs: Date.now() - startedAt,
      reason: error?.code ?? "missing_phase_event_id",
    });
    return {
      message: "The interviewer phase suggestion could not be recorded.",
      status: "error",
    };
  }
  recordOperationalEvent("mock_interview_phase_suggested", {
    interviewId: id.data,
    latencyMs: Date.now() - startedAt,
    phase: suggestion.data.expectedCurrentPhase,
    reasonCode: suggestion.data.reasonCode,
    suggestedPhase: suggestion.data.suggestedNextPhase,
  });
  return {
    eventId,
    status: "success",
    suggestedNextPhase: suggestion.data.suggestedNextPhase,
  };
}

export async function endRealtimeInterviewSessionAction(
  interviewId: string,
  input: unknown,
): Promise<{ status: "success" } | { message: string; status: "error" }> {
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
