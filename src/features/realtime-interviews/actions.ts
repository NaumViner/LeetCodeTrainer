"use server";

import {
  concludeInterviewToolSchema,
  interviewLifecycleToolSchema,
  liveStageReportSchema,
  phaseObservationResultSchema,
  realtimeEventInputSchema,
  realtimeSessionEndSchema,
  solutionReadinessReportSchema,
  type ActiveInterviewPhase,
  voiceActivationResultSchema,
} from "@/features/realtime-interviews/model";
import { requireInterviewUser } from "@/features/auth/session";
import { mockInterviewIdSchema } from "@/features/mock-interviews/schema";
import { getRealtimeInterviewConfig } from "@/features/realtime-interviews/config";
import {
  mockInterviewPhaseSuggestionSchema,
  type MockInterviewPhaseSuggestionActionResult,
} from "@/features/mock-interviews/schema";
import { createClient } from "@/lib/supabase/server";
import { recordOperationalEvent } from "@/lib/operational-events";
import type { Json } from "@/types/database";

type RealtimeActionResult =
  { eventId: string; status: "success" } | { message: string; status: "error" };

export type VoiceActivationActionResult =
  | {
      elapsedSeconds: number;
      startedAt: string;
      status: "success";
      timerRunning: boolean;
    }
  | { message: string; status: "error" };

export type InterviewControlActionResult =
  | {
      accepted?: boolean;
      followUpPrompt?: string;
      lifecycle?: string;
      observedPhase?: ActiveInterviewPhase | null;
      observedPhaseEventId?: string | null;
      questionCycle?: "primary" | "follow_up";
      ready?: boolean;
      remainingSeconds?: number;
      status: "success";
    }
  | { code: string; message: string; status: "error" };

export async function confirmRealtimeInterviewConnectionAction(
  interviewId: string,
  connectionAttemptId: string,
  providerCallId?: string,
): Promise<{ status: "success" } | { message: string; status: "error" }> {
  const id = mockInterviewIdSchema.safeParse(interviewId);
  const attemptId = mockInterviewIdSchema.safeParse(connectionAttemptId);
  const config = getRealtimeInterviewConfig();
  if (
    !id.success ||
    !attemptId.success ||
    !config ||
    (providerCallId?.length ?? 0) > 255
  ) {
    return {
      message: "The voice connection could not be confirmed.",
      status: "error",
    };
  }
  await requireInterviewUser();
  const supabase = await createClient();
  const { error } = await supabase.rpc(
    "confirm_realtime_interview_connection",
    {
      p_connection_attempt_id: attemptId.data,
      p_mock_interview_id: id.data,
      p_model: config.model,
      p_provider: config.provider,
      p_provider_call_id: providerCallId,
    },
  );
  if (error) {
    return {
      message: "The voice connection could not be confirmed.",
      status: "error",
    };
  }
  recordOperationalEvent("realtime_connection_succeeded", {
    interviewId: id.data,
    provider: config.provider,
  });
  return { status: "success" };
}

export async function cancelRealtimeInterviewConnectionAction(
  interviewId: string,
  connectionAttemptId: string,
  providerCallId?: string,
): Promise<void> {
  // The browser closes its own transport. A client-supplied provider call ID
  // must never authorize a server-key hangup against another connection.
  void providerCallId;
  const id = mockInterviewIdSchema.safeParse(interviewId);
  const attemptId = mockInterviewIdSchema.safeParse(connectionAttemptId);
  if (!id.success || !attemptId.success) return;
  await requireInterviewUser();
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_realtime_interview_connection", {
    p_connection_attempt_id: attemptId.data,
    p_mock_interview_id: id.data,
    p_reason_code: "transport_failed",
  });
  if (error)
    recordOperationalEvent("realtime_connection_failed", {
      interviewId: id.data,
      reason: "cancel_rejected",
    });
}

export async function activateVoiceMockInterviewAction(
  interviewId: string,
): Promise<VoiceActivationActionResult> {
  const id = mockInterviewIdSchema.safeParse(interviewId);
  if (!id.success) return invalidVoiceActivation();
  await requireInterviewUser();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("activate_voice_mock_interview", {
    p_mock_interview_id: id.data,
  });
  const activation = voiceActivationResultSchema.safeParse(data);
  if (error || !activation.success) return invalidVoiceActivation();
  return {
    elapsedSeconds: activation.data.elapsedSeconds,
    startedAt: activation.data.startedAt,
    status: "success",
    timerRunning: activation.data.timerRunning,
  };
}

export async function heartbeatVoiceMockInterviewAction(
  interviewId: string,
): Promise<{ status: "success" } | { message: string; status: "error" }> {
  const id = mockInterviewIdSchema.safeParse(interviewId);
  if (!id.success) return invalidVoiceActivation();
  await requireInterviewUser();
  const supabase = await createClient();
  const { error } = await supabase.rpc("heartbeat_voice_mock_interview", {
    p_mock_interview_id: id.data,
  });
  if (error) return invalidVoiceActivation();
  return { status: "success" };
}

export async function saveRealtimeInterviewEventAction(
  interviewId: string,
  input: unknown,
): Promise<RealtimeActionResult> {
  const id = mockInterviewIdSchema.safeParse(interviewId);
  const event = realtimeEventInputSchema.safeParse(input);
  if (!id.success || !event.success) return invalidRealtimeInput();
  await requireInterviewUser();
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

export async function recordLiveInterviewStageAction(
  interviewId: string,
  transcriptEventId: string,
  idempotencyKey: string,
  input: unknown,
): Promise<InterviewControlActionResult> {
  const id = mockInterviewIdSchema.safeParse(interviewId);
  const report = liveStageReportSchema.safeParse(input);
  if (!id.success || !/^\d+$/.test(transcriptEventId) || !report.success) {
    return invalidControlInput("invalid_stage_report");
  }
  await requireInterviewUser();
  const { data, error } = await executeControl(
    id.data,
    idempotencyKey,
    "report_current_stage",
    {
      phase: report.data.phase,
      questionCycle: report.data.questionCycle,
      reasonCode: report.data.reasonCode,
      signal: report.data.signal,
      transcriptEventId,
    },
  );
  const parsed = phaseObservationResultSchema
    .omit({ triggerEventId: true })
    .safeParse(data);
  if (error || !parsed.success) return controlSaveError("stage_not_recorded");
  recordOperationalEvent("mock_interview_live_stage_recorded", {
    accepted: parsed.data.accepted,
    interviewId: id.data,
    phase: report.data.phase,
    questionCycle: report.data.questionCycle,
  });
  return { ...parsed.data, status: "success" };
}

export async function recordInterviewSolutionReadinessAction(
  interviewId: string,
  transcriptEventId: string,
  idempotencyKey: string,
  input: unknown,
): Promise<InterviewControlActionResult> {
  const id = mockInterviewIdSchema.safeParse(interviewId);
  const report = solutionReadinessReportSchema.safeParse(input);
  if (!id.success || !/^\d+$/.test(transcriptEventId) || !report.success) {
    return invalidControlInput("invalid_readiness_report");
  }
  await requireInterviewUser();
  const { data, error } = await executeControl(
    id.data,
    idempotencyKey,
    "report_solution_readiness",
    {
      algorithmComplete: report.data.algorithm,
      complexityConsistent: report.data.complexity,
      correctnessReasoningComplete: report.data.correctness,
      edgeCasesAddressed: report.data.edgeCases,
      operationOrderComplete: report.data.operationOrder,
      reasonCode: report.data.reasonCode,
      stateComplete: report.data.dataStructures,
      transcriptEventId,
    },
  );
  if (error || !data || typeof data !== "object") {
    return controlSaveError("readiness_not_recorded");
  }
  const ready = (data as Record<string, unknown>).ready;
  if (typeof ready !== "boolean") return controlSaveError("invalid_readiness");
  return { ready, status: "success" };
}

export async function completePrimaryInterviewQuestionAction(
  interviewId: string,
  transcriptEventId: string,
  idempotencyKey: string,
  input: unknown,
): Promise<InterviewControlActionResult> {
  const id = mockInterviewIdSchema.safeParse(interviewId);
  const request = interviewLifecycleToolSchema.safeParse(input);
  if (!id.success || !/^\d+$/.test(transcriptEventId) || !request.success) {
    return invalidControlInput("invalid_primary_completion");
  }
  await requireInterviewUser();
  const { data, error } = await executeControl(
    id.data,
    idempotencyKey,
    "complete_primary_question",
    { reasonCode: request.data.reasonCode, transcriptEventId },
  );
  if (error || !data || typeof data !== "object") {
    return controlSaveError("primary_not_complete");
  }
  return { lifecycle: "primary_completed", status: "success" };
}

export async function requestInterviewFollowUpAction(
  interviewId: string,
  idempotencyKey: string,
  input: unknown,
): Promise<InterviewControlActionResult> {
  const id = mockInterviewIdSchema.safeParse(interviewId);
  const request = interviewLifecycleToolSchema.safeParse(input);
  if (!id.success || !request.success) {
    return invalidControlInput("invalid_follow_up_request");
  }
  await requireInterviewUser();
  const { data, error } = await executeControl(
    id.data,
    idempotencyKey,
    "request_follow_up",
    { reasonCode: request.data.reasonCode },
  );
  if (error || !data || typeof data !== "object") {
    return controlSaveError("follow_up_not_authorized");
  }
  const value = data as Record<string, unknown>;
  if (value.allowed !== true) {
    return {
      code: "follow_up_time_low",
      message: "Do not start a follow-up. Conclude the interview now.",
      status: "error",
    };
  }
  return {
    followUpPrompt: String(value.followUpPrompt),
    lifecycle: "follow_up",
    questionCycle: "follow_up",
    remainingSeconds:
      typeof value.remainingSeconds === "number"
        ? value.remainingSeconds
        : undefined,
    status: "success",
  };
}

export async function completeFollowUpInterviewQuestionAction(
  interviewId: string,
  transcriptEventId: string,
  idempotencyKey: string,
  input: unknown,
): Promise<InterviewControlActionResult> {
  const id = mockInterviewIdSchema.safeParse(interviewId);
  const request = interviewLifecycleToolSchema.safeParse(input);
  if (!id.success || !/^\d+$/.test(transcriptEventId) || !request.success) {
    return invalidControlInput("invalid_follow_up_completion");
  }
  await requireInterviewUser();
  const { data, error } = await executeControl(
    id.data,
    idempotencyKey,
    "complete_follow_up_question",
    { reasonCode: request.data.reasonCode, transcriptEventId },
  );
  if (error || !data) return controlSaveError("follow_up_not_complete");
  return { lifecycle: "follow_up_completed", status: "success" };
}

export async function concludeRealtimeMockInterviewAction(
  interviewId: string,
  idempotencyKey: string,
  input: unknown,
): Promise<InterviewControlActionResult> {
  const id = mockInterviewIdSchema.safeParse(interviewId);
  const request = concludeInterviewToolSchema.safeParse(input);
  if (!id.success || !request.success) {
    return invalidControlInput("invalid_conclusion_request");
  }
  await requireInterviewUser();
  const { data, error } = await executeControl(
    id.data,
    idempotencyKey,
    "conclude_interview",
    { reasonCode: request.data.reasonCode },
  );
  if (error || !data || typeof data !== "object") {
    return controlSaveError("interview_not_concluded");
  }
  const value = data as Record<string, unknown>;
  return {
    lifecycle: "concluding",
    questionCycle:
      value.questionCycle === "follow_up" ? "follow_up" : "primary",
    remainingSeconds:
      typeof value.remainingSeconds === "number"
        ? value.remainingSeconds
        : undefined,
    status: "success",
  };
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
  await requireInterviewUser();
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
  await requireInterviewUser();
  const supabase = await createClient();
  const { error } = await supabase.rpc("end_realtime_interview_session", {
    p_mock_interview_id: id.data,
    p_status: completion.data.status,
    p_summary: completion.data.summary,
  });
  if (error) return realtimeSaveError();
  return { status: "success" };
}

async function executeControl(
  interviewId: string,
  idempotencyKey: string,
  toolName:
    | "complete_follow_up_question"
    | "complete_primary_question"
    | "conclude_interview"
    | "report_current_stage"
    | "report_solution_readiness"
    | "request_follow_up",
  payload: { [key: string]: Json | undefined },
) {
  if (
    idempotencyKey.length > 200 ||
    !/^[A-Za-z0-9._:-]+$/.test(idempotencyKey)
  ) {
    return { data: null, error: true as const };
  }
  const supabase = await createClient();
  const result = await supabase.rpc("execute_realtime_interview_control", {
    p_idempotency_key: idempotencyKey,
    p_mock_interview_id: interviewId,
    p_payload: payload,
    p_tool_name: toolName,
  });
  recordOperationalEvent(
    result.error
      ? "mock_interview_control_failed"
      : "mock_interview_control_applied",
    {
      interviewId,
      reason: result.error?.code ?? "applied",
      toolName,
    },
  );
  return result;
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

function invalidVoiceActivation() {
  return {
    message: "The required live voice connection could not be verified.",
    status: "error" as const,
  };
}

function invalidControlInput(code: string): InterviewControlActionResult {
  return {
    code,
    message: "The interviewer control request was invalid.",
    status: "error",
  };
}

function controlSaveError(code: string): InterviewControlActionResult {
  return {
    code,
    message: "The interviewer control request could not be applied.",
    status: "error",
  };
}
