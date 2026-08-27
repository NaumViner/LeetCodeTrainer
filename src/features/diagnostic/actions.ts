"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import {
  initialDiagnosticQuestions,
  questionsByIds,
} from "@/domain/diagnostic";
import { requireAuthenticatedUser } from "@/features/auth/session";
import { getDiagnosticAttempt } from "@/features/diagnostic/queries";
import { getProfile } from "@/features/profile/queries";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

const answerSchema = z.enum(["a", "b", "c", "d"]);
const attemptIdSchema = z.uuid();

export type DiagnosticActionState = {
  message?: string;
  status: "error" | "idle";
};

export async function beginDiagnosticAction(
  _previousState: DiagnosticActionState,
  formData: FormData,
): Promise<DiagnosticActionState> {
  const answers = parseAnswers(
    formData,
    initialDiagnosticQuestions.map((question) => question.id),
  );
  if (!answers) {
    return {
      message: "Answer every concept and pattern question before continuing.",
      status: "error",
    };
  }

  const user = await requireAuthenticatedUser();
  const profile = await getProfile(user.id);
  if (!profile?.onboarding_completed) redirect("/onboarding");
  if (profile.diagnostic_completed) redirect("/diagnostic/results");

  const supabase = await createClient();
  const { error } = await supabase.rpc("begin_diagnostic", {
    p_answers: answers as Json,
  });
  if (error) {
    return {
      message: "The diagnostic could not be saved. Please try again.",
      status: "error",
    };
  }
  redirect("/diagnostic");
}

export async function completeDiagnosticAction(
  _previousState: DiagnosticActionState,
  formData: FormData,
): Promise<DiagnosticActionState> {
  const attemptId = attemptIdSchema.safeParse(formData.get("attemptId"));
  if (!attemptId.success) {
    return { message: "This diagnostic session is invalid.", status: "error" };
  }

  const user = await requireAuthenticatedUser();
  const attempt = await getDiagnosticAttempt(user.id);
  if (!attempt || attempt.id !== attemptId.data) {
    return {
      message: "This diagnostic session was not found.",
      status: "error",
    };
  }
  if (attempt.status === "completed") redirect("/diagnostic/results");

  const questions = questionsByIds(attempt.assigned_coding_question_ids);
  const answers = parseAnswers(
    formData,
    questions.map((question) => question.id),
  );
  if (
    !answers ||
    questions.length !== attempt.assigned_coding_question_ids.length
  ) {
    return {
      message: "Answer every assigned coding problem before finishing.",
      status: "error",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("complete_diagnostic", {
    p_answers: answers as Json,
    p_attempt_id: attempt.id,
  });
  if (error) {
    return {
      message:
        "The coding assessment could not be completed. Please try again.",
      status: "error",
    };
  }
  redirect("/diagnostic/results");
}

function parseAnswers(formData: FormData, questionIds: string[]) {
  const answers = questionIds.map((questionId) => {
    const answer = answerSchema.safeParse(formData.get(`answer:${questionId}`));
    return answer.success
      ? { answer: answer.data, question_id: questionId }
      : null;
  });
  return answers.every(Boolean) ? answers : null;
}
