import { z } from "zod";

export const coachHintSchema = z.object({
  content: z.string().trim().min(10).max(1200),
  title: z.string().trim().min(2).max(80),
});

export const coachEvaluationSchema = z.object({
  feedback: z.string().trim().min(10).max(1200),
  nextStep: z.string().trim().min(5).max(300),
  question: z.string().trim().min(5).max(300),
  verdict: z.enum(["correct", "partially_correct", "incorrect", "uncertain"]),
});

export const attemptAnalysisSchema = z.object({
  improvements: z.array(z.string().trim().min(5).max(300)).min(1).max(4),
  summary: z.string().trim().min(10).max(1200),
  strengths: z.array(z.string().trim().min(3).max(200)).max(4),
});

export const reviewCardDraftSchema = z.object({
  complexityPrompt: z.string().trim().min(5).max(300),
  mistakePrompt: z.string().trim().min(5).max(300),
  patternPrompt: z.string().trim().min(5).max(300),
});

export type CoachHint = z.infer<typeof coachHintSchema>;
export type CoachEvaluation = z.infer<typeof coachEvaluationSchema>;
export type AttemptAnalysis = z.infer<typeof attemptAnalysisSchema>;
export type ReviewCardDraft = z.infer<typeof reviewCardDraftSchema>;

export type CoachProblemContext = {
  difficulty: string;
  patternTags: string[];
  recognitionSignals: string[];
  title: string;
  topic: string;
};

export type CoachAttemptContext = {
  bruteForceApproach: string | null;
  elapsedSeconds: number;
  helpLevel: string;
  predictedPattern: string | null;
};

export type CoachLearnerContext = {
  experienceLevel: string;
  relevantMistakes: string[];
  topicMastery: number;
};

export type CoachContext = {
  attempt: CoachAttemptContext;
  learner: CoachLearnerContext;
  problem: CoachProblemContext;
  safetyIdentifier: string;
};

export type HintInput = CoachContext & {
  hintLevel: string;
  ordinal: number;
};

export type PatternEvaluationInput = CoachContext;

export type ComplexityEvaluationInput = CoachContext & {
  spaceComplexity: string;
  timeComplexity: string;
};

export type AttemptAnalysisInput = CoachContext & {
  codeSnapshot: string;
  reflection: string;
  result: string;
};

export type ReviewCardInput = CoachContext & {
  mistakes: string[];
  takeaway: string;
};

export type ProviderUsage = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
};

export type ProviderResult<T> = { data: T; usage: ProviderUsage };

export type PersistedCoachResult<T> = T & { source: "ai" | "fallback" };
