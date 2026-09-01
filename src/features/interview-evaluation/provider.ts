import type { InterviewEvidencePackage } from "@/features/interview-evaluation/evidence-model";
import type { InterviewEvaluatorResult } from "@/features/interview-evaluation/model";

export interface InterviewEvaluatorProvider {
  readonly model: string;
  readonly name: string;
  evaluate(
    evidence: InterviewEvidencePackage,
  ): Promise<InterviewEvaluatorResult>;
}
