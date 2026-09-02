"use server";

import { randomInt } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  selectCoverageInterview,
  selectCustomInterview,
  selectImprovementInterview,
  selectLearningInterview,
  type InterviewDifficulty,
  type InterviewSelectionResult,
} from "@/domain/interview-selection";
import { requireAuthenticatedUser } from "@/features/auth/session";
import { evaluateAndPersistCompletedInterview } from "@/features/interview-evaluation/service";
import {
  getActiveMockInterview,
  getOwnedActiveMockInterview,
} from "@/features/mock-interviews/queries";
import {
  canUseInterviewSelectionMode,
  getInterviewRolloutConfig,
} from "@/features/mock-interviews/rollout";
import {
  mockInterviewAdvanceSchema,
  mockInterviewCodeSubmissionResultSchema,
  mockInterviewCodeSubmissionSchema,
  mockInterviewCompletionSchema,
  mockInterviewDeleteSchema,
  mockInterviewIdSchema,
  mockInterviewSetupSchema,
  mockInterviewWorkspaceSaveSchema,
  type MockInterviewActionResult,
  type MockInterviewCodeSubmissionActionResult,
  type MockInterviewDeleteActionState,
  type MockInterviewSetup,
  type MockInterviewStartActionState,
  type MockInterviewWorkspaceActionResult,
} from "@/features/mock-interviews/schema";
import { getInterviewSelectionContext } from "@/features/mock-interviews/selection";
import { getActiveAttempt } from "@/features/practice/queries";
import { getProfile } from "@/features/profile/queries";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";
import { recordOperationalEvent } from "@/lib/operational-events";
import { isRealtimeInterviewEnabled } from "@/features/realtime-interviews/config";

export async function startMockInterviewAction(
  _previousState: MockInterviewStartActionState,
  formData: FormData,
): Promise<MockInterviewStartActionState> {
  const startedAt = Date.now();
  const setup = mockInterviewSetupSchema.safeParse({
    codingLanguage: formData.get("codingLanguage"),
    customDifficulty: formData.get("customDifficulty") || null,
    difficulties: formData.getAll("difficulties"),
    durationMinutes: formData.get("durationMinutes"),
    interviewerLevel: formData.get("interviewerLevel"),
    interviewLanguage: formData.get("interviewLanguage"),
    requestedTopicId: formData.get("requestedTopicId") || null,
    selectionMode: formData.get("selectionMode"),
  });
  if (!setup.success) {
    recordOperationalEvent("mock_interview_start_rejected", {
      latencyMs: Date.now() - startedAt,
      reason: "invalid_setup",
    });
    return {
      message:
        "Review the selection mode, difficulty, language, duration, and interviewer settings.",
      status: "error",
    };
  }

  const rollout = getInterviewRolloutConfig();
  if (!rollout.promptContentEnabled || !isRealtimeInterviewEnabled()) {
    recordOperationalEvent("mock_interview_start_rejected", {
      latencyMs: Date.now() - startedAt,
      reason: "full_voice_unavailable",
    });
    return {
      message:
        "Mock interviews require an approved prompt and a configured live voice provider.",
      status: "error",
    };
  }
  if (!canUseInterviewSelectionMode(rollout, setup.data.selectionMode)) {
    recordOperationalEvent("mock_interview_start_rejected", {
      latencyMs: Date.now() - startedAt,
      reason: "selection_mode_rollout_disabled",
    });
    return {
      message:
        "Advanced selection modes are temporarily unavailable. Use Learning mode and try again.",
      status: "error",
    };
  }

  const user = await requireAuthenticatedUser();
  const profile = await getProfile(user.id);
  if (!profile?.onboarding_completed) redirect("/onboarding");
  if (!profile.diagnostic_completed) redirect("/diagnostic");
  const [activeInterview, activeAttempt] = await Promise.all([
    getActiveMockInterview(),
    getActiveAttempt(user.id),
  ]);
  if (activeInterview) redirect(`/interviews/${activeInterview.id}`);
  if (activeAttempt) redirect(`/practice/${activeAttempt.id}`);

  const selectionContext = await getInterviewSelectionContext(
    user.id,
    new Date(),
  );
  const selectedDifficulties = requestedDifficulties(setup.data);
  const randomSelectionInput = {
    catalog: selectionContext.selectionProblems,
    collectionProblemIds: selectionContext.collectionProblemIds,
    completedProblemIds: selectionContext.completedProblemIds,
    randomIndex: randomInt,
  };
  let selected: InterviewSelectionResult<
    (typeof selectionContext.selectionProblems)[number]
  >;
  switch (setup.data.selectionMode) {
    case "coverage":
      selected = selectCoverageInterview({
        ...randomSelectionInput,
        coverage: selectionContext.coverage,
        selectedDifficulties,
      });
      break;
    case "improvement":
      selected = selectImprovementInterview({
        ...randomSelectionInput,
        coverage: selectionContext.coverage,
        selectedDifficulties,
        topicPerformance: selectionContext.topicPerformance,
      });
      break;
    case "learning":
      selected = selectLearningInterview({
        catalog: selectionContext.selectionProblems,
        collectionProblemIds: selectionContext.collectionProblemIds,
        rankedRecommendations: selectionContext.scoredRecommendations,
        recentProblemIds: selectionContext.recentProblemIds,
      });
      break;
    case "custom":
      selected = selectCustomInterview({
        ...randomSelectionInput,
        requestedDifficulty: setup.data.customDifficulty!,
        requestedTopicId: setup.data.requestedTopicId!,
        validTopicIds: new Set(
          selectionContext.coverage.topics.map((topic) => topic.id),
        ),
      });
      break;
  }
  if (!selected.ok) {
    recordOperationalEvent("mock_interview_start_rejected", {
      latencyMs: Date.now() - startedAt,
      reason: selected.code,
      selectionMode: setup.data.selectionMode,
    });
    const topicNames = selected.details.topicIds?.flatMap((topicId) => {
      const topic = selectionContext.coverage.topics.find(
        (candidate) => candidate.id === topicId,
      );
      return topic ? [topic.name] : [];
    });
    return {
      message:
        topicNames && topicNames.length > 0
          ? `${selected.message} Affected topics: ${topicNames.join(", ")}.`
          : selected.message,
      status: "error",
    };
  }

  const supabase = await createClient();
  const { data: interviewId, error } = await supabase.rpc(
    "start_mock_interview_v2",
    {
      p_coding_language: setup.data.codingLanguage,
      p_duration_minutes: setup.data.durationMinutes,
      p_interviewer_level: setup.data.interviewerLevel,
      p_interview_language: setup.data.interviewLanguage,
      p_problem_id: selected.problem.id,
      p_requested_difficulties: selectedDifficulties,
      // PostgreSQL accepts null here; generated function argument types do not
      // currently retain RPC parameter nullability.
      p_requested_topic_id: setup.data.requestedTopicId!,
      p_selected_topic_id: selected.selectedTopicId,
      p_selection_algorithm_version: selected.metadata.algorithmVersion,
      p_selection_metadata: {
        candidateProblemCount: selected.metadata.candidateProblemCount,
        candidateTopicCount: selected.metadata.candidateTopicCount,
        reasons: selected.reasons.map((reason) => reason.slice(0, 240)),
        recencyFallbackUsed: selected.metadata.recencyFallbackUsed,
        repeatFallbackUsed: selected.metadata.repeatFallbackUsed,
      },
      p_selection_mode: selected.mode,
    },
  );
  if (error || !interviewId) {
    recordOperationalEvent("mock_interview_start_failed", {
      latencyMs: Date.now() - startedAt,
      reason: error?.code ?? "missing_interview_id",
      selectionMode: selected.mode,
    });
    return {
      message:
        "The mock interview could not be started. Refresh the page and try again.",
      status: "error",
    };
  }
  recordOperationalEvent("mock_interview_started", {
    codingLanguage: setup.data.codingLanguage,
    durationMinutes: setup.data.durationMinutes,
    interviewId,
    interviewerLevel: setup.data.interviewerLevel,
    language: setup.data.interviewLanguage,
    latencyMs: Date.now() - startedAt,
    selectionMode: selected.mode,
    selectionModesEnabled: rollout.selectionModesEnabled,
  });
  redirect(`/interviews/${interviewId}`);
}

function requestedDifficulties(
  setup: MockInterviewSetup,
): InterviewDifficulty[] {
  if (setup.selectionMode === "learning") {
    return ["easy", "medium", "hard"];
  }
  if (setup.selectionMode === "custom") return [setup.customDifficulty!];
  return setup.difficulties;
}

export async function advanceMockInterviewAction(
  interviewId: string,
  input: unknown,
): Promise<MockInterviewActionResult> {
  const startedAt = Date.now();
  const id = mockInterviewIdSchema.safeParse(interviewId);
  const parsed = mockInterviewAdvanceSchema.safeParse(input);
  if (!id.success || !parsed.success) return invalidInterviewInput();
  await requireAuthenticatedUser();
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
  await requireAuthenticatedUser();
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
  await requireAuthenticatedUser();
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
  const user = await requireAuthenticatedUser();
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
  await requireAuthenticatedUser();
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
  redirect(pendingVoice ? "/interviews" : "/interviews/history");
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
  await requireAuthenticatedUser();
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
