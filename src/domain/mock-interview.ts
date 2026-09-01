import { round } from "@/domain/mastery";

export const MOCK_INTERVIEW_PHASES = [
  "intro",
  "clarify",
  "examples",
  "brute_force",
  "optimization",
  "implementation",
  "testing",
  "complexity",
  "retrospective",
  "completed",
] as const;

export type MockInterviewPhase = (typeof MOCK_INTERVIEW_PHASES)[number];
export type MockInterviewResult = "failed" | "partial" | "solved";

export const INTERVIEW_LANGUAGES = ["auto", "english", "hebrew"] as const;
export type InterviewLanguage = (typeof INTERVIEW_LANGUAGES)[number];

export function interviewTextDirection(language: InterviewLanguage) {
  return language === "hebrew"
    ? "rtl"
    : language === "english"
      ? "ltr"
      : "auto";
}

export function normalizeInterviewLanguage(value: string): InterviewLanguage {
  return value === "hebrew" || value === "english" ? value : "auto";
}

export const INTERVIEWER_LEVELS = ["beginner", "faang_tough"] as const;
export type InterviewerLevel = (typeof INTERVIEWER_LEVELS)[number];

export const interviewerLevelLabels: Record<InterviewerLevel, string> = {
  beginner: "Beginner interviewer",
  faang_tough: "Tough FAANG interviewer",
};

export function normalizeInterviewerLevel(value: string): InterviewerLevel {
  return value === "faang_tough" ? "faang_tough" : "beginner";
}

export const mockInterviewPhaseLabels: Record<MockInterviewPhase, string> = {
  brute_force: "Brute force",
  clarify: "Clarify",
  completed: "Completed",
  complexity: "Complexity",
  examples: "Examples",
  implementation: "Implementation",
  intro: "Intro",
  optimization: "Optimization",
  retrospective: "Retrospective",
  testing: "Testing",
};

export type MockInterviewRubricInput = {
  bruteForceNotes: string;
  clarificationNotes: string;
  codeQualityRating: number;
  codeSnapshot: string;
  communicationRating: number;
  complexityRating: number;
  examplesNotes: string;
  independenceRating: number;
  optimizationNotes: string;
  result: MockInterviewResult;
  spaceComplexity: string;
  testingNotes: string;
  timeComplexity: string;
};

export type MockInterviewRubric = {
  approachQuality: number;
  clarification: number;
  codeQuality: number;
  communication: number;
  complexityReasoning: number;
  correctness: number;
  independence: number;
  optimization: number;
  overall: number;
  problemUnderstanding: number;
  testing: number;
};

export function canTransitionMockInterview(
  current: MockInterviewPhase,
  target: MockInterviewPhase,
) {
  const currentIndex = MOCK_INTERVIEW_PHASES.indexOf(current);
  const targetIndex = MOCK_INTERVIEW_PHASES.indexOf(target);
  return targetIndex === currentIndex + 1;
}

export function scoreMockInterview(
  input: MockInterviewRubricInput,
): MockInterviewRubric {
  const clarification = evidenceScore(input.clarificationNotes, 2, 5);
  const examples = evidenceScore(input.examplesNotes, 2, 5);
  const bruteForce = evidenceScore(input.bruteForceNotes, 3, 8);
  const optimization = evidenceScore(input.optimizationNotes, 3, 8);
  const codeEvidence = evidenceScore(input.codeSnapshot, 5, 12);
  const testing = evidenceScore(input.testingNotes, 3, 8);
  const complexityEvidence =
    input.timeComplexity.trim() && input.spaceComplexity.trim()
      ? clampRating(input.complexityRating)
      : 1;
  const rubric = {
    approachQuality: Math.round((bruteForce + optimization) / 2),
    clarification,
    codeQuality: Math.round(
      (codeEvidence + clampRating(input.codeQualityRating)) / 2,
    ),
    communication: clampRating(input.communicationRating),
    complexityReasoning: complexityEvidence,
    correctness:
      input.result === "solved" ? 5 : input.result === "partial" ? 3 : 1,
    independence: clampRating(input.independenceRating),
    optimization,
    problemUnderstanding: Math.round((clarification + examples) / 2),
    testing,
  };
  return {
    ...rubric,
    overall: round(
      (Object.values(rubric).reduce((total, value) => total + value, 0) / 50) *
        100,
      2,
    ),
  };
}

export function rubricFeedback(rubric: MockInterviewRubric) {
  const criteria = [
    ["Problem understanding", rubric.problemUnderstanding],
    ["Clarification", rubric.clarification],
    ["Approach quality", rubric.approachQuality],
    ["Optimization", rubric.optimization],
    ["Correctness", rubric.correctness],
    ["Code quality", rubric.codeQuality],
    ["Testing", rubric.testing],
    ["Complexity reasoning", rubric.complexityReasoning],
    ["Communication", rubric.communication],
    ["Independence", rubric.independence],
  ] as const;
  return {
    improvements: criteria
      .filter(([, score]) => score <= 2)
      .map(([label]) => improvementFor(label))
      .slice(0, 4),
    strengths: criteria
      .filter(([, score]) => score >= 4)
      .map(([label]) => label)
      .slice(0, 4),
  };
}

export function effectiveInterviewElapsed(input: {
  elapsedSeconds: number;
  now: Date;
  startedAt: string;
  timerRunning: boolean;
}) {
  if (!input.timerRunning) return input.elapsedSeconds;
  const wallSeconds = Math.max(
    0,
    Math.floor(
      (input.now.getTime() - new Date(input.startedAt).getTime()) / 1000,
    ),
  );
  return Math.max(input.elapsedSeconds, wallSeconds);
}

function evidenceScore(
  value: string,
  developingLines: number,
  strongLines: number,
) {
  const lines = value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length >= strongLines || value.trim().length >= strongLines * 35)
    return 5;
  if (lines.length >= developingLines + 2 || value.trim().length >= 180)
    return 4;
  if (lines.length >= developingLines || value.trim().length >= 80) return 3;
  if (lines.length > 0) return 2;
  return 1;
}

function clampRating(value: number) {
  return Math.min(5, Math.max(1, Math.round(value)));
}

function improvementFor(label: string) {
  const actions: Record<string, string> = {
    "Approach quality":
      "State the brute-force baseline, its bottleneck, and the optimized invariant before coding.",
    Clarification:
      "Ask about constraints, duplicates, invalid input, and expected output before proposing an approach.",
    "Code quality":
      "Use smaller named helpers and keep the implementation aligned with the stated invariant.",
    Communication:
      "Narrate decisions and tradeoffs at each phase instead of explaining only after coding.",
    "Complexity reasoning":
      "Derive time and space from the operations and stored state rather than recalling a label.",
    Correctness:
      "Trace the algorithm against a normal case and a boundary case before finalizing.",
    Independence:
      "Pause to form a complete plan before seeking confirmation or changing direction.",
    Optimization:
      "Identify repeated work in the baseline and name the data structure or invariant that removes it.",
    "Problem understanding":
      "Restate the goal and validate it with concrete examples before solving.",
    Testing:
      "Test empty, minimal, duplicate, and adversarial cases while tracing state changes.",
  };
  return (
    actions[label] ?? `Practice ${label.toLowerCase()} in the next session.`
  );
}
