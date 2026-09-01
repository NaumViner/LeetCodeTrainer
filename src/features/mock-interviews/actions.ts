"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { selectInterviewProblem } from "@/domain/mock-interview-selection";
import { requireAuthenticatedUser } from "@/features/auth/session";
import { evaluateAndPersistCompletedInterview } from "@/features/interview-evaluation/service";
import {
  getActiveMockInterview,
  getRecentInterviewProblemIds,
} from "@/features/mock-interviews/queries";
import {
  mockInterviewAdvanceSchema,
  mockInterviewCompletionSchema,
  mockInterviewIdSchema,
  mockInterviewSetupSchema,
  type MockInterviewActionResult,
  type MockInterviewStartActionState,
} from "@/features/mock-interviews/schema";
import { getActiveAttempt } from "@/features/practice/queries";
import { getAdaptiveRecommendationSnapshot } from "@/features/practice/recommendation";
import { getProfile } from "@/features/profile/queries";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";
import { recordOperationalEvent } from "@/lib/operational-events";

export async function startMockInterviewAction(
  _previousState: MockInterviewStartActionState,
  formData: FormData,
): Promise<MockInterviewStartActionState> {
  const setup = mockInterviewSetupSchema.safeParse({
    difficulty: formData.get("difficulty"),
    durationMinutes: formData.get("durationMinutes"),
    interviewerLevel: formData.get("interviewerLevel"),
    interviewLanguage: formData.get("interviewLanguage"),
  });
  if (!setup.success) {
    return {
      message: "Choose a valid difficulty, duration, and interviewer level.",
      status: "error",
    };
  }

  const user = await requireAuthenticatedUser();
  const profile = await getProfile(user.id);
  if (!profile?.onboarding_completed) redirect("/onboarding");
  if (!profile.diagnostic_completed) redirect("/diagnostic");
  const [activeInterview, activeAttempt] = await Promise.all([
    getActiveMockInterview(user.id),
    getActiveAttempt(user.id),
  ]);
  if (activeInterview) redirect(`/interviews/${activeInterview.id}`);
  if (activeAttempt) redirect(`/practice/${activeAttempt.id}`);

  const [snapshot, recentProblemIds] = await Promise.all([
    getAdaptiveRecommendationSnapshot(user.id, new Date()),
    getRecentInterviewProblemIds(user.id),
  ]);
  const selected = selectInterviewProblem({
    catalog: snapshot.catalog,
    rankedRecommendations: snapshot.scored,
    recentProblemIds,
    requestedDifficulty: setup.data.difficulty,
  });
  if (!selected) {
    const difficultyLabel =
      setup.data.difficulty === "adaptive"
        ? "adaptive"
        : setup.data.difficulty[0]!.toUpperCase() +
          setup.data.difficulty.slice(1);
    return {
      message: `No active ${difficultyLabel} interview questions are currently available. Choose another difficulty.`,
      status: "error",
    };
  }

  const supabase = await createClient();
  const { data: interviewId, error } = await supabase.rpc(
    "start_mock_interview",
    {
      p_difficulty_mode: setup.data.difficulty,
      p_duration_minutes: setup.data.durationMinutes,
      p_interviewer_level: setup.data.interviewerLevel,
      p_interview_language: setup.data.interviewLanguage,
      p_problem_id: selected.problem.id,
    },
  );
  if (error || !interviewId) {
    return {
      message:
        "The mock interview could not be started. Refresh the page and try again.",
      status: "error",
    };
  }
  recordOperationalEvent("mock_interview_started", {
    difficulty: setup.data.difficulty,
    durationMinutes: setup.data.durationMinutes,
    interviewId,
    interviewerLevel: setup.data.interviewerLevel,
    language: setup.data.interviewLanguage,
  });
  redirect(`/interviews/${interviewId}`);
}

export async function advanceMockInterviewAction(
  interviewId: string,
  input: unknown,
): Promise<MockInterviewActionResult> {
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
  if (error) return saveInterviewError();
  revalidatePath(`/interviews/${id.data}`);
  return { status: "success" };
}

export async function completeMockInterviewAction(
  interviewId: string,
  input: unknown,
): Promise<MockInterviewActionResult> {
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
  if (error) return saveInterviewError();
  recordOperationalEvent("mock_interview_completed", {
    interviewId: id.data,
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
  const { error } = await supabase.rpc("abandon_mock_interview", {
    p_mock_interview_id: id.data,
  });
  if (error) throw new Error("The mock interview could not be ended.");
  recordOperationalEvent("mock_interview_abandoned", {
    interviewId: id.data,
  });
  revalidatePath("/interviews");
  revalidatePath("/interviews/history");
  redirect("/interviews/history");
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
