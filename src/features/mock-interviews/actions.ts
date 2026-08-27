"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAuthenticatedUser } from "@/features/auth/session";
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
} from "@/features/mock-interviews/schema";
import { getActiveAttempt } from "@/features/practice/queries";
import { getAdaptiveRecommendationSnapshot } from "@/features/practice/recommendation";
import { getProfile } from "@/features/profile/queries";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

export async function startMockInterviewAction(formData: FormData) {
  const setup = mockInterviewSetupSchema.safeParse({
    difficulty: formData.get("difficulty"),
    durationMinutes: formData.get("durationMinutes"),
  });
  if (!setup.success) throw new Error("Choose a valid interview setup.");

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
  const catalogById = new Map(
    snapshot.catalog.map((problem) => [problem.id, problem]),
  );
  const ranked = snapshot.ranked.flatMap((score) => {
    const problem = catalogById.get(score.candidate.id);
    return problem ? [{ problem, score }] : [];
  });
  const difficultyMatches = (difficulty: string) =>
    setup.data.difficulty === "adaptive" ||
    difficulty === setup.data.difficulty;
  const fresh = ranked.filter(
    ({ problem, score }) =>
      score.eligible &&
      difficultyMatches(problem.difficulty) &&
      !recentProblemIds.has(problem.id),
  );
  const eligible = ranked.filter(
    ({ problem, score }) =>
      score.eligible && difficultyMatches(problem.difficulty),
  );
  const anyMatch = ranked.filter(({ problem }) =>
    difficultyMatches(problem.difficulty),
  );
  const selected = fresh[0] ?? eligible[0] ?? anyMatch[0];
  if (!selected) throw new Error("No interview problem matches this setup.");

  const supabase = await createClient();
  const { data: interviewId, error } = await supabase.rpc(
    "start_mock_interview",
    {
      p_difficulty_mode: setup.data.difficulty,
      p_duration_minutes: setup.data.durationMinutes,
      p_problem_id: selected.problem.id,
    },
  );
  if (error || !interviewId)
    throw new Error("The mock interview could not be started.");
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
  await requireAuthenticatedUser();
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
