import type {
  AttemptAnalysis,
  CoachEvaluation,
  ComplexityEvaluationInput,
  ReviewCardDraft,
  ReviewCardInput,
} from "@/features/ai-coach/model";

export function fallbackPatternEvaluation(): CoachEvaluation {
  return {
    feedback:
      "The AI coach is temporarily unavailable, so your prediction was saved but not automatically judged.",
    nextStep:
      "State the repeated work your pattern removes and the invariant it maintains.",
    question:
      "Which recognition signal in the problem most strongly supports your prediction?",
    verdict: "uncertain",
  };
}

export function fallbackComplexityEvaluation(
  input: ComplexityEvaluationInput,
): CoachEvaluation {
  return {
    feedback: `Your ${input.timeComplexity} time and ${input.spaceComplexity} space claims were saved, but the AI coach could not verify them automatically.`,
    nextStep:
      "Count the dominant operations and the maximum additional state directly from your implementation.",
    question:
      "Which loop, recursion depth, or stored collection determines each bound?",
    verdict: "uncertain",
  };
}

export function fallbackAttemptAnalysis(input: {
  helpLevel: string;
  mistakes: string[];
  result: string;
  takeaway: string;
}): AttemptAnalysis {
  const solved = input.result === "solved";
  const independent = input.helpLevel === "none";
  return {
    improvements: [
      input.mistakes[0]
        ? `Review this recorded mistake: ${input.mistakes[0]}`
        : "Trace one normal and one boundary case before finalizing.",
      input.takeaway
        ? `Apply this takeaway deliberately: ${input.takeaway}`
        : "Name the recognition signal to notice earlier.",
    ].slice(0, 4),
    strengths: [
      ...(solved ? ["Reached a complete solution"] : []),
      ...(independent ? ["Worked without assistance"] : []),
    ],
    summary:
      "This deterministic summary uses your saved result, assistance, mistakes, and takeaway because the AI coach was unavailable.",
  };
}

export function fallbackReviewCard(input: ReviewCardInput): ReviewCardDraft {
  const pattern = input.attempt.predictedPattern ?? input.problem.topic;
  const mistake = input.mistakes[0] ?? "the main reasoning bottleneck";
  return {
    complexityPrompt:
      "Derive the time and space bounds from the operations and state, without looking at your earlier answer.",
    mistakePrompt: `How would you avoid this earlier issue: ${mistake}?`,
    patternPrompt: `What signals should make you recall ${pattern}, and what invariant does it maintain?`,
  };
}
