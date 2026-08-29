import type {
  AttemptAnalysis,
  AttemptAnalysisInput,
  CoachEvaluation,
  CoachHint,
  ComplexityEvaluationInput,
  HintInput,
  PatternEvaluationInput,
  ProviderResult,
  ReviewCardDraft,
  ReviewCardInput,
} from "@/features/ai-coach/model";

export interface LearningCoachProvider {
  readonly model: string;
  readonly name: string;
  analyzeAttempt(
    input: AttemptAnalysisInput,
  ): Promise<ProviderResult<AttemptAnalysis>>;
  evaluateComplexity(
    input: ComplexityEvaluationInput,
  ): Promise<ProviderResult<CoachEvaluation>>;
  evaluatePattern(
    input: PatternEvaluationInput,
  ): Promise<ProviderResult<CoachEvaluation>>;
  generateHint(input: HintInput): Promise<ProviderResult<CoachHint>>;
  generateReviewCard(
    input: ReviewCardInput,
  ): Promise<ProviderResult<ReviewCardDraft>>;
}
