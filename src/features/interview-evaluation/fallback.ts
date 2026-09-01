import type { InterviewEvidencePackage } from "@/features/interview-evaluation/evidence-model";
import {
  INTERVIEW_EVALUATION_DIMENSIONS,
  finalizeInterviewEvaluation,
  interviewEvaluationDimensionLabels,
  type DimensionEvaluation,
  type InterviewEvaluation,
  type InterviewEvaluationDimension,
  type RecommendedAction,
} from "@/features/interview-evaluation/model";

export function createFallbackInterviewEvaluation(
  evidence: InterviewEvidencePackage,
): InterviewEvaluation {
  const clarification = evidence.phaseEvidence.clarification;
  const examples = evidence.phaseEvidence.examples;
  const bruteForce = evidence.phaseEvidence.bruteForce;
  const optimization = evidence.phaseEvidence.optimization;
  const testing = evidence.phaseEvidence.testing;
  const hasComplexity = Boolean(
    evidence.phaseEvidence.complexity.time &&
    evidence.phaseEvidence.complexity.space,
  );
  const learnerTranscript = evidence.transcript.filter(
    (turn) => turn.role === "learner",
  );
  const learnerTranscriptPhases = new Set(
    learnerTranscript.flatMap((turn) => (turn.phase ? [turn.phase] : [])),
  );
  const correctness = fallbackCorrectness(evidence);
  const dimensions = {
    approachQuality: dimension(
      bruteForce && optimization ? 4 : bruteForce || optimization ? 3 : 1,
      bruteForce || optimization ? 0.45 : 0.2,
      bruteForce && optimization
        ? "Both a baseline and an optimization note were recorded, but the fallback cannot verify their semantic quality."
        : "The saved phase notes provide limited evidence of a complete baseline-to-optimization progression.",
      "phase_note",
      bruteForce || optimization
        ? "Saved brute-force and optimization phase notes."
        : "No brute-force or optimization phase note was recorded.",
    ),
    clarification: dimension(
      clarification ? 3 : 1,
      clarification ? 0.45 : 0.2,
      clarification
        ? "A clarification note was saved, while its quality requires evaluator review."
        : "No clarification note or trusted substitute was available.",
      "phase_note",
      clarification
        ? "Saved clarification phase note."
        : "No clarification phase note was recorded.",
    ),
    codeQuality: dimension(
      evidence.coverage.hasCode ? 3 : 1,
      evidence.coverage.hasCode ? 0.3 : 0.2,
      evidence.coverage.hasCode
        ? "A bounded code snapshot exists, but deterministic fallback cannot reliably judge structure or maintainability."
        : "No code snapshot was available for code-quality evidence.",
      evidence.coverage.hasCode ? "code" : "phase_note",
      evidence.coverage.hasCode
        ? "Latest bounded code snapshot."
        : "No code snapshot was recorded.",
    ),
    communication: dimension(
      learnerTranscriptPhases.size >= 2
        ? 3
        : learnerTranscript.length > 0
          ? 2
          : 1,
      learnerTranscript.length > 0 ? 0.4 : 0.2,
      learnerTranscript.length > 0
        ? "Learner turns were recorded across interview phases; fallback measures coverage, not verbosity or language fluency."
        : "No learner transcript turns were available to assess communicated reasoning.",
      learnerTranscript.length > 0 ? "transcript" : "phase_note",
      learnerTranscript.length > 0
        ? `Learner transcript turns span ${learnerTranscriptPhases.size} recorded phases.`
        : "No completed learner transcript turn was recorded.",
    ),
    complexityReasoning: dimension(
      hasComplexity ? 3 : 1,
      hasComplexity ? 0.4 : 0.2,
      hasComplexity
        ? "Both time and space claims were saved, but their derivation was not automatically verified."
        : "Complete time-and-space reasoning was not available.",
      "phase_note",
      hasComplexity
        ? "Saved time and space complexity claims."
        : "One or both complexity claims were missing.",
    ),
    correctness,
    independence: dimension(
      3,
      0.2,
      "The current evidence source does not record reliable assistance events, so independence remains neutral and low-confidence.",
      "phase_note",
      "No explicit help-event evidence source is currently available.",
    ),
    optimization: dimension(
      optimization ? 3 : 1,
      optimization ? 0.4 : 0.2,
      optimization
        ? "An optimization note was recorded, but fallback cannot verify the claimed improvement."
        : "No optimization note was available.",
      "phase_note",
      optimization
        ? "Saved optimization phase note."
        : "No optimization phase note was recorded.",
    ),
    problemUnderstanding: dimension(
      clarification && examples ? 4 : clarification || examples ? 3 : 1,
      clarification || examples ? 0.45 : 0.2,
      clarification && examples
        ? "Clarification and example evidence were both saved, without semantic verification."
        : "Saved clarification/example evidence was incomplete.",
      "phase_note",
      clarification || examples
        ? "Saved clarification and examples phase notes."
        : "No clarification or examples phase note was recorded.",
    ),
    testing: dimension(
      evidence.trustedTests
        ? testRatioScore(
            evidence.trustedTests.passedTests,
            evidence.trustedTests.totalTests,
          )
        : testing
          ? 3
          : 1,
      evidence.trustedTests ? 0.9 : testing ? 0.4 : 0.2,
      evidence.trustedTests
        ? "Trusted runner results provide direct bounded testing evidence."
        : testing
          ? "A testing note was saved, but no trusted execution results were available."
          : "No testing note or trusted execution result was available.",
      evidence.trustedTests ? "test" : "phase_note",
      evidence.trustedTests
        ? `${evidence.trustedTests.passedTests} of ${evidence.trustedTests.totalTests} trusted tests passed.`
        : testing
          ? "Saved testing phase note."
          : "No testing phase note was recorded.",
    ),
  } satisfies Record<InterviewEvaluationDimension, DimensionEvaluation>;

  const ranked = [...INTERVIEW_EVALUATION_DIMENSIONS].sort(
    (left, right) =>
      dimensions[left].score - dimensions[right].score ||
      dimensions[left].confidence - dimensions[right].confidence,
  );
  const improvements = ranked
    .slice(0, 3)
    .map(
      (dimensionName) =>
        `${interviewEvaluationDimensionLabels[dimensionName]} needs more direct, verifiable evidence in the next interview.`,
    );
  const strengths = [...INTERVIEW_EVALUATION_DIMENSIONS]
    .filter((dimensionName) => dimensions[dimensionName].score >= 4)
    .slice(0, 4)
    .map(
      (dimensionName) =>
        `${interviewEvaluationDimensionLabels[dimensionName]} had multiple saved evidence sources.`,
    );
  const recommendedActions = ranked
    .slice(0, 3)
    .map(recommendedActionForDimension);
  const confidence =
    Math.round(
      (INTERVIEW_EVALUATION_DIMENSIONS.reduce(
        (total, dimensionName) => total + dimensions[dimensionName].confidence,
        0,
      ) /
        INTERVIEW_EVALUATION_DIMENSIONS.length) *
        100,
    ) / 100;

  return finalizeInterviewEvaluation(
    {
      confidence,
      dimensions,
      improvements,
      recommendedActions,
      recurringSignals: [],
      strengths,
      summary:
        "This provisional evaluation uses deterministic, bounded interview evidence because an external post-interview evaluator was unavailable.",
    },
    evidence,
  );
}

function fallbackCorrectness(
  evidence: InterviewEvidencePackage,
): DimensionEvaluation {
  if (evidence.trustedTests) {
    return dimension(
      testRatioScore(
        evidence.trustedTests.passedTests,
        evidence.trustedTests.totalTests,
      ),
      0.9,
      "Correctness is based on bounded results from the configured trusted runner.",
      "test",
      `${evidence.trustedTests.passedTests} of ${evidence.trustedTests.totalTests} trusted tests passed.`,
    );
  }
  const score =
    evidence.learnerOutcome.result === "solved"
      ? 4
      : evidence.learnerOutcome.result === "partial"
        ? 3
        : 1;
  return dimension(
    score,
    0.25,
    "The score reflects the learner-selected result only; without first-party prompt content or trusted tests, semantic correctness is unverified.",
    "phase_note",
    `Learner-selected result: ${evidence.learnerOutcome.result}; trusted correctness evidence unavailable.`,
  );
}

function dimension(
  score: 1 | 2 | 3 | 4 | 5,
  confidence: number,
  rationale: string,
  source: DimensionEvaluation["evidence"][number]["source"],
  reference: string,
): DimensionEvaluation {
  return { confidence, evidence: [{ reference, source }], rationale, score };
}

function testRatioScore(passed: number, total: number): 1 | 2 | 3 | 4 | 5 {
  if (total === 0) return 1;
  const ratio = passed / total;
  if (ratio === 1) return 5;
  if (ratio >= 0.75) return 4;
  if (ratio >= 0.5) return 3;
  if (ratio > 0) return 2;
  return 1;
}

function recommendedActionForDimension(
  dimensionName: InterviewEvaluationDimension,
): RecommendedAction {
  const actions: Record<InterviewEvaluationDimension, RecommendedAction> = {
    approachQuality: action(
      "topic_drill",
      "Practice baseline-to-optimization transitions",
      "approach formation",
      30,
    ),
    clarification: action(
      "communication_drill",
      "Run a clarification drill",
      "constraints and examples",
      15,
    ),
    codeQuality: action(
      "problem",
      "Implement one focused solution",
      "code structure",
      30,
    ),
    communication: action(
      "communication_drill",
      "Narrate decisions at phase boundaries",
      "reasoning communication",
      15,
    ),
    complexityReasoning: action(
      "complexity_drill",
      "Derive complexity from operations",
      "time and space reasoning",
      15,
    ),
    correctness: action(
      "testing_drill",
      "Trace normal and boundary cases",
      "correctness evidence",
      20,
    ),
    independence: action(
      "next_interview",
      "Attempt a focused independent interview",
      "independence evidence",
      30,
    ),
    optimization: action(
      "topic_drill",
      "Name and remove repeated work",
      "optimization reasoning",
      20,
    ),
    problemUnderstanding: action(
      "communication_drill",
      "Restate the problem with examples",
      "problem understanding",
      15,
    ),
    testing: action(
      "testing_drill",
      "Build a boundary-case checklist",
      "testing discipline",
      15,
    ),
  };
  return actions[dimensionName];
}

function action(
  actionType: RecommendedAction["actionType"],
  title: string,
  target: string,
  estimatedMinutes: number,
): RecommendedAction {
  return {
    actionType,
    estimatedMinutes,
    priority: 1,
    rationale: `This targets the lowest-confidence evidence for ${target}.`,
    target,
    title,
  };
}
