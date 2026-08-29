import type { CoachEvaluation } from "@/features/ai-coach/model";

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
