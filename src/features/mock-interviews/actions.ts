"use server";

import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { selectCoverageInterview } from "@/domain/interview-selection";
import { INTERVIEW_DIFFICULTY_RANGES } from "@/domain/interview-setup";
import {
  ensureInterviewUser,
  requireInterviewUser,
} from "@/features/auth/session";
import { evaluateAndPersistCompletedInterview } from "@/features/interview-evaluation/service";
import {
  getActiveMockInterview,
  getOwnedActiveMockInterview,
} from "@/features/mock-interviews/queries";
import { getInterviewRolloutConfig } from "@/features/mock-interviews/rollout";
import {
  mockInterviewAdvanceSchema,
  mockInterviewCodeSubmissionResultSchema,
  mockInterviewCodeSubmissionSchema,
  mockInterviewCompletionSchema,
  mockInterviewDeleteSchema,
  mockInterviewIdSchema,
  quickInterviewSetupSchema,
  mockInterviewWorkspaceSaveSchema,
  type MockInterviewActionResult,
  type MockInterviewCodeSubmissionActionResult,
  type MockInterviewDeleteActionState,
  type MockInterviewStartActionState,
  type MockInterviewWorkspaceActionResult,
} from "@/features/mock-interviews/schema";
import { getCoverageSelectionContext } from "@/features/mock-interviews/selection";
import { getGuestInterviewTrial } from "@/features/mock-interviews/guest";
import { createClient } from "@/lib/supabase/server";
import { recordOperationalEvent } from "@/lib/operational-events";
import { isRealtimeInterviewEnabled } from "@/features/realtime-interviews/config";
import type { Json } from "@/types/database";

export async function startMockInterviewAction(
  _previousState: MockInterviewStartActionState,
  formData: FormData,
): Promise<MockInterviewStartActionState> {
  const setup = quickInterviewSetupSchema.safeParse(
    Object.fromEntries(formData),
  );
  if (!setup.success)
    return {
      status: "error",
      message: "Check the language, difficulty range and interview duration.",
    };
  const rollout = getInterviewRolloutConfig();
  if (!rollout.promptContentEnabled || !isRealtimeInterviewEnabled()) {
    return {
      status: "error",
      message:
        "The live interviewer is temporarily unavailable. Please try again shortly.",
    };
  }
  const user = await ensureInterviewUser();
  if (!user)
    return {
      status: "error",
      message:
        "Your interview could not be prepared. Please try again shortly.",
    };
  const supabase = await createClient();
  await supabase.rpc("expire_pending_guest_interview");
  const active = await getActiveMockInterview();
  if (active) redirect("/interviews/" + active.id);
  if (user.isAnonymous) {
    const trial = await getGuestInterviewTrial();
    if (trial.consumed) redirect("/signup");
  }
  const context = await getCoverageSelectionContext(user.id);
  const selectedDifficulties = [
    ...INTERVIEW_DIFFICULTY_RANGES[setup.data.difficultyRange],
  ];
  const selected = selectCoverageInterview({
    ...context,
    selectedDifficulties,
    randomIndex: randomInt,
  });
  if (!selected.ok)
    return {
      status: "error",
      message:
        "No question is available in this range for your next topic. Try a wider difficulty range. Your trial has not been used.",
    };
  const { data: interviewId, error } = await supabase.rpc(
    "start_mock_interview_v2",
    {
      p_coding_language: setup.data.codingLanguage,
      p_duration_minutes: setup.data.durationMinutes,
      p_interviewer_level: setup.data.interviewerLevel,
      p_interview_language: setup.data.interviewLanguage,
      p_problem_id: selected.problem.id,
      p_requested_difficulties: selectedDifficulties,
      p_requested_topic_id: null!,
      p_selected_topic_id: selected.selectedTopicId,
      p_selection_algorithm_version: selected.metadata.algorithmVersion,
      p_selection_metadata: {
        ...selected.metadata,
        reasons: selected.reasons.map((reason) => reason.slice(0, 240)),
      },
      p_selection_mode: "coverage",
    },
  );
  if (error || !interviewId) {
    const current = await getActiveMockInterview();
    if (current) redirect("/interviews/" + current.id);
    if (error?.message.includes("trial_used")) redirect("/signup");
    return {
      status: "error",
      message: error?.message.includes("practice attempt")
        ? "You have unfinished practice. Open it to save and end it before starting an interview."
        : "The interview could not be started. Please try again shortly.",
    };
  }
  await supabase.rpc("save_interview_preferences", {
    p_preferences: setup.data,
  });
  recordOperationalEvent("mock_interview_started", {
    interviewId,
    selectionMode: "coverage",
    language: setup.data.interviewLanguage,
    interviewerLevel: setup.data.interviewerLevel,
    durationMinutes: setup.data.durationMinutes,
  });
  redirect("/interviews/" + interviewId);
}

export async function resumeMockInterviewAction() {
  await requireInterviewUser();
  const supabase = await createClient();
  const { error } = await supabase.rpc("expire_pending_guest_interview");
  if (error)
    throw new Error("Your interview could not be restored. Please try again.");
  const active = await getActiveMockInterview();
  redirect(active ? "/interviews/" + active.id : "/interviews");
}

export async function finishConcludedMockInterviewAction(
  interviewId: string,
): Promise<MockInterviewActionResult> {
  const id = mockInterviewIdSchema.safeParse(interviewId);
  if (!id.success) return invalidInterviewInput();
  const user = await requireInterviewUser();
  const supabase = await createClient();
  const { error } = await supabase.rpc("finish_concluded_mock_interview", {
    p_mock_interview_id: id.data,
  });
  if (error) return saveInterviewError();
  try {
    await evaluateAndPersistCompletedInterview(user.id, id.data);
  } catch {
    recordOperationalEvent("interview_evaluation_failed", {
      interviewId: id.data,
      reason: "final_evaluation_unavailable",
    });
  }
  revalidatePath("/interviews");
  revalidatePath(`/interviews/${id.data}/scorecard`);
  return { status: "success" };
}

export async function retryInterviewEvaluationAction(form: FormData) {
  const id = mockInterviewIdSchema.safeParse(form.get("interviewId"));
  if (!id.success) return;
  const user = await requireInterviewUser();
  try {
    await evaluateAndPersistCompletedInterview(user.id, id.data);
  } catch {
    recordOperationalEvent("interview_evaluation_failed", {
      interviewId: id.data,
      reason: "retry_unavailable",
    });
  }
  revalidatePath(`/interviews/${id.data}/scorecard`);
}

export async function advanceMockInterviewAction(
  interviewId: string,
  input: unknown,
): Promise<MockInterviewActionResult> {
  const startedAt = Date.now();
  const id = mockInterviewIdSchema.safeParse(interviewId);
  const parsed = mockInterviewAdvanceSchema.safeParse(input);
  if (!id.success || !parsed.success) return invalidInterviewInput();
  await requireInterviewUser();
  const supabase = await createClient();
  const { error } = await supabase.rpc("advance_mock_interview", {
    p_elapsed_seconds: parsed.data.elapsedSeconds,
    p_mock_interview_id: id.data,
    p_payload: {
      notes: parsed.data.notes,
      spaceComplexity: parsed.data.spaceComplexity,
      timeComplexity: parsed.data.timeComplexity,
    } as Json,
    p_target_phase: parsed.data.targetPhase,
  });
  if (error) {
    recordOperationalEvent("mock_interview_phase_advance_failed", {
      interviewId: id.data,
      latencyMs: Date.now() - startedAt,
      reason: error.code,
      targetPhase: parsed.data.targetPhase,
    });
    return saveInterviewError();
  }
  recordOperationalEvent("mock_interview_phase_advanced", {
    interviewId: id.data,
    latencyMs: Date.now() - startedAt,
    targetPhase: parsed.data.targetPhase,
  });
  revalidatePath(`/interviews/${id.data}`);
  return { status: "success" };
}

export async function saveMockInterviewWorkspaceAction(
  interviewId: string,
  input: unknown,
): Promise<MockInterviewWorkspaceActionResult> {
  const startedAt = Date.now();
  const id = mockInterviewIdSchema.safeParse(interviewId);
  const parsed = mockInterviewWorkspaceSaveSchema.safeParse(input);
  if (!id.success || !parsed.success) {
    return {
      message: "The coding workspace content is invalid.",
      status: "error",
    };
  }
  await requireInterviewUser();
  const supabase = await createClient();
  const { data: workspaceVersion, error } = await supabase.rpc(
    "save_mock_interview_workspace",
    {
      p_code_snapshot: parsed.data.codeSnapshot,
      p_expected_version: parsed.data.expectedVersion,
      p_mock_interview_id: id.data,
      p_scratchpad: parsed.data.scratchpad,
    },
  );
  if (error?.code === "40001") {
    recordOperationalEvent("mock_interview_workspace_conflict", {
      interviewId: id.data,
      latencyMs: Date.now() - startedAt,
    });
    return {
      message:
        "This interview changed in another tab. Refresh before continuing.",
      status: "conflict",
    };
  }
  if (error || workspaceVersion === null) {
    recordOperationalEvent("mock_interview_workspace_save_failed", {
      interviewId: id.data,
      latencyMs: Date.now() - startedAt,
      reason: error?.code ?? "missing_workspace_version",
    });
    return {
      message: "The coding workspace could not be saved.",
      status: "error",
    };
  }
  return { status: "success", workspaceVersion };
}

export async function submitMockInterviewCodeAction(
  interviewId: string,
  input: unknown,
): Promise<MockInterviewCodeSubmissionActionResult> {
  const startedAt = Date.now();
  const id = mockInterviewIdSchema.safeParse(interviewId);
  const parsed = mockInterviewCodeSubmissionSchema.safeParse(input);
  if (!id.success || !parsed.success) {
    return { message: "The code submission is invalid.", status: "error" };
  }
  await requireInterviewUser();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("submit_mock_interview_code", {
    p_advance_to_testing: parsed.data.advanceToTesting,
    p_code_snapshot: parsed.data.codeSnapshot,
    p_elapsed_seconds: parsed.data.elapsedSeconds,
    p_expected_version: parsed.data.expectedVersion,
    p_mock_interview_id: id.data,
    p_scratchpad: parsed.data.scratchpad,
  });
  if (error?.code === "40001") {
    recordOperationalEvent("mock_interview_code_submission_conflict", {
      interviewId: id.data,
      latencyMs: Date.now() - startedAt,
    });
    return {
      message:
        "This interview changed in another tab. Refresh before submitting.",
      status: "conflict",
    };
  }
  const submission = mockInterviewCodeSubmissionResultSchema.safeParse(data);
  if (error || !submission.success) {
    recordOperationalEvent("mock_interview_code_submission_failed", {
      interviewId: id.data,
      latencyMs: Date.now() - startedAt,
      reason: error?.code ?? "invalid_submission_response",
    });
    return {
      message:
        "The code could not be submitted. Stay in Implementation and try again.",
      status: "error",
    };
  }
  recordOperationalEvent("mock_interview_code_submitted", {
    advancedToTesting: submission.data.advancedToTesting,
    interviewId: id.data,
    latencyMs: Date.now() - startedAt,
    submissionId: submission.data.submissionId,
    workspaceVersion: submission.data.workspaceVersion,
  });
  revalidatePath(`/interviews/${id.data}`);
  return { status: "success", ...submission.data };
}

export async function completeMockInterviewAction(
  interviewId: string,
  input: unknown,
): Promise<MockInterviewActionResult> {
  const startedAt = Date.now();
  const id = mockInterviewIdSchema.safeParse(interviewId);
  const parsed = mockInterviewCompletionSchema.safeParse(input);
  if (!id.success || !parsed.success) return invalidInterviewInput();
  const user = await requireInterviewUser();
  const supabase = await createClient();
  const { error } = await supabase.rpc("complete_mock_interview", {
    p_code_quality_rating: parsed.data.codeQualityRating,
    p_communication_rating: parsed.data.communicationRating,
    p_complexity_rating: parsed.data.complexityRating,
    p_elapsed_seconds: parsed.data.elapsedSeconds,
    p_independence_rating: parsed.data.independenceRating,
    p_mock_interview_id: id.data,
    p_result: parsed.data.result,
    p_retrospective: parsed.data.retrospective,
  });
  if (error) {
    recordOperationalEvent("mock_interview_completion_failed", {
      interviewId: id.data,
      latencyMs: Date.now() - startedAt,
      reason: error.code,
    });
    return saveInterviewError();
  }
  recordOperationalEvent("mock_interview_completed", {
    interviewId: id.data,
    latencyMs: Date.now() - startedAt,
    result: parsed.data.result,
  });
  try {
    await evaluateAndPersistCompletedInterview(user.id, id.data);
  } catch (error) {
    // Interview completion remains authoritative if evaluation persistence fails.
    console.error("Interview evaluation persistence failed.", {
      errorCode:
        error instanceof Error ? error.message : "unknown_evaluation_error",
      interviewId: id.data,
    });
  }
  revalidatePath(`/interviews/${id.data}`);
  revalidatePath(`/interviews/${id.data}/scorecard`);
  revalidatePath("/interviews");
  revalidatePath("/interviews/history");
  revalidatePath("/dashboard");
  revalidatePath("/progress");
  revalidatePath("/practice");
  return { status: "success" };
}

export async function abandonMockInterviewAction(formData: FormData) {
  const id = mockInterviewIdSchema.safeParse(formData.get("interviewId"));
  if (!id.success) throw new Error("The mock interview is invalid.");
  await requireInterviewUser();
  const supabase = await createClient();
  const interview = await getOwnedActiveMockInterview(id.data);
  if (!interview) {
    throw new Error("The mock interview could not be ended.");
  }
  const pendingVoice = !interview.voiceActivated;
  const { error } = await supabase.rpc("abandon_mock_interview", {
    p_mock_interview_id: id.data,
  });
  if (error) throw new Error("The mock interview could not be ended.");
  recordOperationalEvent(
    pendingVoice
      ? "mock_interview_voice_pending_cancelled"
      : "mock_interview_abandoned",
    {
      interviewId: id.data,
    },
  );
  revalidatePath("/interviews");
  revalidatePath("/interviews/history");
  redirect(pendingVoice ? "/interviews" : `/interviews/${id.data}/ended`);
}

export async function deleteMockInterviewAction(
  _previousState: MockInterviewDeleteActionState,
  formData: FormData,
): Promise<MockInterviewDeleteActionState> {
  const parsed = mockInterviewDeleteSchema.safeParse({
    confirmation: formData.get("confirmation"),
    interviewId: formData.get("interviewId"),
  });
  if (!parsed.success) {
    recordOperationalEvent("mock_interview_deletion_rejected", {
      reason: "missing_confirmation",
    });
    return {
      message: "Confirm that you want to permanently delete this interview.",
      status: "error",
    };
  }
  await requireInterviewUser();
  const supabase = await createClient();
  const { data: topicId, error } = await supabase.rpc(
    "delete_owned_mock_interview",
    { p_mock_interview_id: parsed.data.interviewId },
  );
  if (error || !topicId) {
    recordOperationalEvent("mock_interview_deletion_rejected", {
      interviewId: parsed.data.interviewId,
      reason: error?.code ?? "missing_topic_id",
    });
    return {
      message:
        "The interview could not be deleted. Active interviews must be ended first.",
      status: "error",
    };
  }
  recordOperationalEvent("mock_interview_deleted", {
    interviewId: parsed.data.interviewId,
    topicId,
  });
  revalidatePath("/interviews");
  revalidatePath("/interviews/history");
  revalidatePath("/interview-profile");
  revalidatePath("/dashboard");
  revalidatePath("/progress");
  revalidatePath("/practice");
  return { message: "Interview deleted.", status: "success" };
}

function invalidInterviewInput(): MockInterviewActionResult {
  return { message: "Complete the current interview fields.", status: "error" };
}

function saveInterviewError(): MockInterviewActionResult {
  return {
    message: "Your interview progress could not be saved.",
    status: "error",
  };
}
