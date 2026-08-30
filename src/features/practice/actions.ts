"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  fallbackAttemptAnalysis,
  fallbackComplexityEvaluation,
  fallbackPatternEvaluation,
  fallbackReviewCard,
} from "@/features/ai-coach/fallback";
import type {
  AttemptAnalysis,
  CoachEvaluation,
  PersistedCoachResult,
  ReviewCardDraft,
} from "@/features/ai-coach/model";
import {
  buildCoachContext,
  createLearningCoachProvider,
  runCoachInteraction,
} from "@/features/ai-coach/service";
import {
  buildProgressiveHint,
  canTransitionAttempt,
  type AttemptPhase,
} from "@/domain/practice";
import { requireAuthenticatedUser } from "@/features/auth/session";
import {
  getPracticeAttempt,
  type AttemptHintRow,
} from "@/features/practice/queries";
import {
  attemptIdSchema,
  preAttemptInputSchema,
  progressInputSchema,
  reflectionInputSchema,
  timerInputSchema,
  type PracticeActionResult,
} from "@/features/practice/schema";
import { createClient } from "@/lib/supabase/server";
import type { TablesUpdate } from "@/types/database";

const problemIdSchema = z.uuid();
const complexityCoachInputSchema = z.object({
  spaceComplexity: z.string().trim().min(1).max(120),
  timeComplexity: z.string().trim().min(1).max(120),
});

export async function startPracticeAttemptAction(formData: FormData) {
  const problemId = problemIdSchema.safeParse(formData.get("problemId"));
  if (!problemId.success) throw new Error("The selected problem is invalid.");

  const user = await requireAuthenticatedUser();
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("attempts")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "started")
    .maybeSingle();

  if (existing) redirect("/practice/" + existing.id);

  const { data: problem, error: problemError } = await supabase
    .from("problems")
    .select("id")
    .eq("id", problemId.data)
    .eq("active", true)
    .maybeSingle();
  if (problemError || !problem) throw new Error("That problem is unavailable.");

  const { data: attempt, error } = await supabase
    .from("attempts")
    .insert({ problem_id: problem.id, user_id: user.id })
    .select("id")
    .single();
  if (error) throw new Error("The practice session could not be started.");

  revalidatePath("/dashboard");
  redirect("/practice/" + attempt.id);
}

export async function updateAttemptTimerAction(
  attemptId: string,
  input: unknown,
): Promise<PracticeActionResult> {
  const parsed = timerInputSchema.safeParse(input);
  return updateOwnedAttempt(attemptId, parsed, (data) => ({
    duration_seconds: data.durationSeconds,
    timer_running: data.running,
    timer_started_at: data.running ? new Date().toISOString() : null,
  }));
}

export async function savePreAttemptAction(
  attemptId: string,
  input: unknown,
): Promise<PracticeActionResult> {
  const parsed = preAttemptInputSchema.safeParse(input);
  return updateOwnedAttempt(
    attemptId,
    parsed,
    (data) => ({
      brute_force_approach: data.bruteForceApproach,
      brute_force_complexity: data.bruteForceComplexity,
      confidence_before: data.confidenceBefore,
      duration_seconds: data.durationSeconds,
      phase: "planning",
      predicted_pattern: data.predictedPattern,
      timer_running: data.running,
      timer_started_at: data.running ? new Date().toISOString() : null,
    }),
    "pre_attempt",
  );
}

export async function advanceAttemptAction(
  attemptId: string,
  input: unknown,
): Promise<PracticeActionResult> {
  const parsed = progressInputSchema.safeParse(input);
  if (!parsed.success) return invalidInput();

  const user = await requireAuthenticatedUser();
  const attempt = await getPracticeAttempt(user.id, attemptId);
  if (!attempt || attempt.status !== "started") return unavailableAttempt();
  if (
    !canTransitionAttempt(
      attempt.phase as AttemptPhase,
      parsed.data.targetPhase,
    )
  ) {
    return { message: "That practice step is out of order.", status: "error" };
  }

  const stopsTimer = parsed.data.targetPhase === "reflection";
  const supabase = await createClient();
  const { error } = await supabase
    .from("attempts")
    .update({
      code_snapshot: parsed.data.codeSnapshot,
      duration_seconds: parsed.data.durationSeconds,
      phase: parsed.data.targetPhase,
      timer_running: stopsTimer ? false : parsed.data.running,
      timer_started_at:
        stopsTimer || !parsed.data.running ? null : new Date().toISOString(),
    })
    .eq("id", attempt.id)
    .eq("user_id", user.id)
    .eq("status", "started");

  if (error) return saveError();
  revalidateAttempt(attempt.id);
  return { data: undefined, status: "success" };
}

export async function requestAttemptHintAction(
  attemptId: string,
): Promise<PracticeActionResult<AttemptHintRow>> {
  const parsedId = attemptIdSchema.safeParse(attemptId);
  if (!parsedId.success) return invalidInput();

  const user = await requireAuthenticatedUser();
  const attempt = await getPracticeAttempt(user.id, parsedId.data);
  if (!attempt || attempt.status !== "started") return unavailableAttempt();

  const nextOrdinal = attempt.hints.length + 1;
  if (nextOrdinal > 6) {
    return {
      message: "All progressive hints have already been revealed.",
      status: "error",
    };
  }

  const fallbackHint = buildProgressiveHint(
    {
      patternTags: attempt.problem.pattern_tags,
      primaryTopic: attempt.problem.primaryTopic.name,
      recognitionSignals: attempt.problem.recognition_signals,
    },
    nextOrdinal,
  );
  let hint = fallbackHint;
  if (createLearningCoachProvider()) {
    const context = await buildCoachContext(user.id, attempt);
    try {
      const coached = await runCoachInteraction({
        attemptId: attempt.id,
        fallback: { content: fallbackHint.content, title: fallbackHint.title },
        interactionType: "hint",
        operation: (provider) =>
          provider.generateHint({
            ...context,
            hintLevel: fallbackHint.helpLevel,
            ordinal: fallbackHint.ordinal,
          }),
      });
      hint = { ...fallbackHint, ...coached.data };
    } catch (error) {
      if (error instanceof Error && error.message === "AI_COACH_LIMIT") {
        return {
          message: "Your 20 AI coach requests for the last 24 hours are used.",
          status: "error",
        };
      }
    }
  }
  const supabase = await createClient();
  const { data: savedHint, error } = await supabase
    .from("attempt_hints")
    .insert({
      attempt_id: attempt.id,
      content: hint.content,
      help_level: hint.helpLevel,
      ordinal: hint.ordinal,
      title: hint.title,
    })
    .select("*")
    .single();

  if (error || !savedHint) return saveError();
  revalidateAttempt(attempt.id);
  return { data: savedHint, status: "success" };
}

export async function requestPatternAnalysisAction(
  attemptId: string,
): Promise<
  PracticeActionResult<CoachEvaluation & { source: "ai" | "fallback" }>
> {
  const parsedId = attemptIdSchema.safeParse(attemptId);
  if (!parsedId.success) return invalidInput();
  const user = await requireAuthenticatedUser();
  const attempt = await getPracticeAttempt(user.id, parsedId.data);
  if (
    !attempt ||
    attempt.status !== "started" ||
    !attempt.predicted_pattern ||
    attempt.phase === "pre_attempt"
  ) {
    return unavailableAttempt();
  }
  if (!createLearningCoachProvider()) {
    return {
      message: "The AI coach is not configured for this environment.",
      status: "error",
    };
  }
  const context = await buildCoachContext(user.id, attempt);
  try {
    const result = await runCoachInteraction({
      attemptId: attempt.id,
      fallback: fallbackPatternEvaluation(),
      interactionType: "pattern_analysis",
      operation: (provider) => provider.evaluatePattern(context),
    });
    revalidateAttempt(attempt.id);
    return {
      data: { ...result.data, source: result.source },
      status: "success",
    };
  } catch (error) {
    return {
      message:
        error instanceof Error && error.message === "AI_COACH_LIMIT"
          ? "Your 20 AI coach requests for the last 24 hours are used."
          : "Pattern analysis could not be started.",
      status: "error",
    };
  }
}

export async function requestComplexityFeedbackAction(
  attemptId: string,
  input: unknown,
): Promise<PracticeActionResult<PersistedCoachResult<CoachEvaluation>>> {
  const parsedId = attemptIdSchema.safeParse(attemptId);
  const parsed = complexityCoachInputSchema.safeParse(input);
  if (!parsedId.success || !parsed.success) return invalidInput();
  const user = await requireAuthenticatedUser();
  const attempt = await getPracticeAttempt(user.id, parsedId.data);
  if (
    !attempt ||
    attempt.status !== "started" ||
    attempt.phase !== "reflection"
  ) {
    return unavailableAttempt();
  }
  if (!createLearningCoachProvider()) return coachUnavailable();
  const context = await buildCoachContext(user.id, attempt);
  const coachInput = { ...context, ...parsed.data };
  try {
    const result = await runCoachInteraction({
      attemptId: attempt.id,
      fallback: fallbackComplexityEvaluation(coachInput),
      interactionType: "complexity_feedback",
      operation: (provider) => provider.evaluateComplexity(coachInput),
    });
    revalidateAttempt(attempt.id);
    return {
      data: { ...result.data, source: result.source },
      status: "success",
    };
  } catch (error) {
    return coachFailure(error, "Complexity feedback could not be started.");
  }
}

export async function requestAttemptAnalysisAction(
  attemptId: string,
): Promise<PracticeActionResult<PersistedCoachResult<AttemptAnalysis>>> {
  const parsedId = attemptIdSchema.safeParse(attemptId);
  if (!parsedId.success) return invalidInput();
  const user = await requireAuthenticatedUser();
  const attempt = await getPracticeAttempt(user.id, parsedId.data);
  if (!attempt || attempt.status !== "completed" || !attempt.result) {
    return unavailableAttempt();
  }
  const attemptResult = attempt.result;
  if (!createLearningCoachProvider()) return coachUnavailable();
  const context = await buildCoachContext(user.id, attempt);
  const fallback = fallbackAttemptAnalysis({
    helpLevel: attempt.help_level,
    mistakes: attempt.mistakes,
    result: attemptResult,
    takeaway: attempt.takeaway ?? "",
  });
  try {
    const result = await runCoachInteraction({
      attemptId: attempt.id,
      fallback,
      interactionType: "attempt_analysis",
      operation: (provider) =>
        provider.analyzeAttempt({
          ...context,
          codeSnapshot: attempt.code_snapshot ?? "",
          reflection: [
            attempt.takeaway,
            ...attempt.mistakes,
            ...attempt.edge_cases_missed,
          ]
            .filter(Boolean)
            .join("\n"),
          result: attemptResult,
        }),
    });
    revalidateAttempt(attempt.id);
    return {
      data: { ...result.data, source: result.source },
      status: "success",
    };
  } catch (error) {
    return coachFailure(error, "Attempt analysis could not be started.");
  }
}

export async function requestReviewCardDraftAction(
  attemptId: string,
): Promise<PracticeActionResult<PersistedCoachResult<ReviewCardDraft>>> {
  const parsedId = attemptIdSchema.safeParse(attemptId);
  if (!parsedId.success) return invalidInput();
  const user = await requireAuthenticatedUser();
  const attempt = await getPracticeAttempt(user.id, parsedId.data);
  if (!attempt || attempt.status !== "completed") return unavailableAttempt();
  if (!createLearningCoachProvider()) return coachUnavailable();
  const context = await buildCoachContext(user.id, attempt);
  const coachInput = {
    ...context,
    mistakes: attempt.mistakes,
    takeaway: attempt.takeaway ?? "Review the recognition signal.",
  };
  try {
    const result = await runCoachInteraction({
      attemptId: attempt.id,
      fallback: fallbackReviewCard(coachInput),
      interactionType: "review_card",
      operation: (provider) => provider.generateReviewCard(coachInput),
    });
    revalidateAttempt(attempt.id);
    revalidatePath("/review");
    return {
      data: { ...result.data, source: result.source },
      status: "success",
    };
  } catch (error) {
    return coachFailure(error, "Review-card drafting could not be started.");
  }
}

export async function completeAttemptAction(
  attemptId: string,
  input: unknown,
): Promise<PracticeActionResult> {
  const parsed = reflectionInputSchema.safeParse(input);
  if (!parsed.success) return invalidInput();

  const user = await requireAuthenticatedUser();
  const attempt = await getPracticeAttempt(user.id, attemptId);
  if (!attempt || attempt.status !== "started") return unavailableAttempt();
  if (attempt.phase !== "reflection") {
    return {
      message: "Complete the earlier practice steps first.",
      status: "error",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("attempts")
    .update({
      completed_at: new Date().toISOString(),
      complexity_correct: parsed.data.complexityCorrect,
      confidence_after: parsed.data.confidenceAfter,
      correct_pattern: parsed.data.correctPattern,
      duration_seconds: parsed.data.durationSeconds,
      edge_cases_missed: parsed.data.edgeCasesMissed,
      mistakes: parsed.data.mistakes,
      phase: "completed",
      recognized_pattern_correctly: parsed.data.recognizedPatternCorrectly,
      result: parsed.data.result,
      status: "completed",
      submitted_space_complexity: parsed.data.spaceComplexity,
      submitted_time_complexity: parsed.data.timeComplexity,
      takeaway: parsed.data.takeaway,
      timer_running: false,
      timer_started_at: null,
    })
    .eq("id", attempt.id)
    .eq("user_id", user.id)
    .eq("status", "started");

  if (error) return saveError();
  revalidateAttempt(attempt.id);
  revalidatePath("/practice");
  revalidatePath("/dashboard");
  revalidatePath("/history");
  revalidatePath("/progress");
  revalidatePath("/review");
  revalidatePath("/review/history");
  return { data: undefined, status: "success" };
}

async function updateOwnedAttempt<T>(
  attemptId: string,
  parsed: { success: true; data: T } | { success: false },
  changes: (data: T) => TablesUpdate<"attempts">,
  requiredPhase?: AttemptPhase,
): Promise<PracticeActionResult> {
  const parsedId = attemptIdSchema.safeParse(attemptId);
  if (!parsedId.success || !parsed.success) return invalidInput();

  const user = await requireAuthenticatedUser();
  const supabase = await createClient();
  let update = supabase
    .from("attempts")
    .update(changes(parsed.data))
    .eq("id", parsedId.data)
    .eq("user_id", user.id)
    .eq("status", "started");
  if (requiredPhase) update = update.eq("phase", requiredPhase);
  const { data: saved, error } = await update.select("id").maybeSingle();
  if (error) return saveError();
  if (!saved) return unavailableAttempt();

  revalidateAttempt(parsedId.data);
  return { data: undefined, status: "success" };
}

function revalidateAttempt(attemptId: string) {
  revalidatePath("/practice/" + attemptId);
}

function invalidInput(): PracticeActionResult<never> {
  return {
    message: "Check the practice fields and try again.",
    status: "error",
  };
}

function unavailableAttempt(): PracticeActionResult<never> {
  return {
    message: "This active practice session is unavailable.",
    status: "error",
  };
}

function saveError(): PracticeActionResult<never> {
  return {
    message: "Your practice progress could not be saved.",
    status: "error",
  };
}

function coachUnavailable(): PracticeActionResult<never> {
  return {
    message: "The AI coach is not configured for this environment.",
    status: "error",
  };
}

function coachFailure(
  error: unknown,
  fallbackMessage: string,
): PracticeActionResult<never> {
  return {
    message:
      error instanceof Error && error.message === "AI_COACH_LIMIT"
        ? "Your 20 AI coach requests for the last 24 hours are used."
        : fallbackMessage,
    status: "error",
  };
}
