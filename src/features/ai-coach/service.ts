import { createHash } from "node:crypto";

import { getAiCoachConfig } from "@/features/ai-coach/config";
import { GeminiLearningCoachProvider } from "@/features/ai-coach/gemini-provider";
import type { CoachContext, ProviderResult } from "@/features/ai-coach/model";
import { OpenAiLearningCoachProvider } from "@/features/ai-coach/openai-provider";
import type { LearningCoachProvider } from "@/features/ai-coach/provider";
import type { PracticeAttempt } from "@/features/practice/queries";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

export type CoachInteractionType =
  | "attempt_analysis"
  | "complexity_feedback"
  | "hint"
  | "pattern_analysis"
  | "review_card";

export function createLearningCoachProvider(): LearningCoachProvider | null {
  const config = getAiCoachConfig();
  if (!config) return null;
  return config.provider === "gemini"
    ? new GeminiLearningCoachProvider(config.apiKey, config.model)
    : new OpenAiLearningCoachProvider(config.apiKey, config.model);
}

export async function buildCoachContext(
  userId: string,
  attempt: PracticeAttempt,
): Promise<CoachContext> {
  const supabase = await createClient();
  const [profileResult, masteryResult, mistakesResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("experience_level")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("topic_mastery")
      .select("overall_score")
      .eq("user_id", userId)
      .eq("topic_id", attempt.problem.primary_topic_id)
      .maybeSingle(),
    supabase
      .from("attempts")
      .select("mistakes")
      .eq("user_id", userId)
      .eq("problem_id", attempt.problem_id)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(3),
  ]);
  if (profileResult.error || masteryResult.error || mistakesResult.error) {
    throw new Error("AI coach context could not be loaded.");
  }
  return {
    attempt: {
      bruteForceApproach: attempt.brute_force_approach,
      elapsedSeconds: attempt.effectiveDurationSeconds,
      helpLevel: attempt.help_level,
      predictedPattern: attempt.predicted_pattern,
    },
    learner: {
      experienceLevel: profileResult.data?.experience_level ?? "beginner",
      relevantMistakes: (mistakesResult.data ?? [])
        .flatMap((item) => item.mistakes)
        .slice(0, 6),
      topicMastery: masteryResult.data?.overall_score ?? 35,
    },
    problem: {
      difficulty: attempt.problem.difficulty,
      patternTags: attempt.problem.pattern_tags.slice(0, 5),
      recognitionSignals: attempt.problem.recognition_signals.slice(0, 5),
      title: attempt.problem.title,
      topic: attempt.problem.primaryTopic.name,
    },
    safetyIdentifier: createHash("sha256")
      .update(userId)
      .digest("hex")
      .slice(0, 32),
  };
}

export async function runCoachInteraction<T>(input: {
  attemptId: string;
  fallback: T;
  interactionType: CoachInteractionType;
  operation(provider: LearningCoachProvider): Promise<ProviderResult<T>>;
}): Promise<{ data: T; source: "ai" | "fallback" }> {
  const provider = createLearningCoachProvider();
  if (!provider) return { data: input.fallback, source: "fallback" };
  const supabase = await createClient();
  const { data: interactionId, error: reserveError } = await supabase.rpc(
    "reserve_ai_coach_interaction",
    {
      p_attempt_id: input.attemptId,
      p_interaction_type: input.interactionType,
      p_model: provider.model,
      p_provider: provider.name,
    },
  );
  if (reserveError || !interactionId) {
    if (reserveError?.message.includes("limit"))
      throw new Error("AI_COACH_LIMIT");
    throw new Error("AI_COACH_RESERVATION_FAILED");
  }

  try {
    const result = await input.operation(provider);
    await finishInteraction(
      interactionId,
      "completed",
      result.data,
      result.usage,
    );
    return { data: result.data, source: "ai" };
  } catch {
    await finishInteraction(interactionId, "fallback", input.fallback, {
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
    });
    return { data: input.fallback, source: "fallback" };
  }
}

async function finishInteraction(
  interactionId: string,
  status: "completed" | "fallback",
  response: unknown,
  usage: { inputTokens: number; outputTokens: number; totalTokens: number },
) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("finish_ai_coach_interaction", {
    p_error_code: undefined,
    p_input_tokens: usage.inputTokens,
    p_interaction_id: interactionId,
    p_output_tokens: usage.outputTokens,
    p_response: response as Json,
    p_status: status,
    p_total_tokens: usage.totalTokens,
  });
  if (error) throw new Error("AI coach usage could not be recorded.");
}
