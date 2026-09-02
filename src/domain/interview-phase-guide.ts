import {
  MOCK_INTERVIEW_PHASES,
  type MockInterviewPhase,
} from "@/domain/mock-interview";

export const GUIDE_PHASES = MOCK_INTERVIEW_PHASES.slice(
  0,
  -1,
) as readonly Exclude<MockInterviewPhase, "completed">[];

export type InterviewPhaseGuideEvent = {
  displaySummary: string | null;
  id: string;
  phase: Exclude<MockInterviewPhase, "completed">;
  suggestedPhase: Exclude<MockInterviewPhase, "completed"> | null;
  transitionType: "completed" | "started" | "suggested";
};

export type InterviewPhaseGuideState =
  "completed" | "current" | "future" | "needs_confirmation" | "suggested_next";

export type InterviewPhaseGuideItem = {
  objective: string;
  phase: Exclude<MockInterviewPhase, "completed">;
  state: InterviewPhaseGuideState;
  summary: string | null;
};

export function buildInterviewPhaseGuide(input: {
  currentPhase: MockInterviewPhase;
  events: InterviewPhaseGuideEvent[];
}): InterviewPhaseGuideItem[] {
  const currentIndex = MOCK_INTERVIEW_PHASES.indexOf(input.currentPhase);
  const completedSummary = new Map(
    input.events
      .filter((event) => event.transitionType === "completed")
      .map((event) => [event.phase, event.displaySummary] as const),
  );
  const pendingSuggestion = input.events.find(
    (event) =>
      event.transitionType === "suggested" &&
      event.phase === input.currentPhase &&
      event.suggestedPhase,
  );

  return GUIDE_PHASES.map((phase, index) => {
    let state: InterviewPhaseGuideState = "future";
    if (input.currentPhase === "completed" || index < currentIndex) {
      state = "completed";
    } else if (index === currentIndex) {
      state = "current";
    } else if (index === currentIndex + 1) {
      state =
        pendingSuggestion?.suggestedPhase === phase
          ? "needs_confirmation"
          : "suggested_next";
    }
    return {
      objective: PHASE_OBJECTIVES[phase],
      phase,
      state,
      summary: completedSummary.get(phase) ?? null,
    };
  });
}

export function summarizePhaseEvidence(
  phase: Exclude<MockInterviewPhase, "completed">,
  input: {
    codingLanguage?: "java" | "python";
    notes?: string;
    spaceComplexity?: string;
    timeComplexity?: string;
    workspaceVersion?: number;
  } = {},
) {
  switch (phase) {
    case "intro":
      return "Interview setup and prompt review completed.";
    case "clarify":
      return `Captured ${lineCount(input.notes)} clarification ${itemWord(lineCount(input.notes))}.`;
    case "examples":
      return `Captured ${lineCount(input.notes)} example or expected-behavior ${itemWord(lineCount(input.notes))}.`;
    case "brute_force":
      return "Saved the baseline approach and its repeated work.";
    case "optimization":
      return "Saved the optimized approach, invariant, and tradeoff.";
    case "implementation":
      return `${input.codingLanguage === "java" ? "Java" : "Python"} code snapshot version ${input.workspaceVersion ?? 0} submitted.`;
    case "testing":
      return `Captured ${lineCount(input.notes)} test or dry-run ${itemWord(lineCount(input.notes))}.`;
    case "complexity":
      return `Recorded time ${input.timeComplexity || "not stated"} and space ${input.spaceComplexity || "not stated"}.`;
    case "retrospective":
      return "Recorded the selected outcome and learner reflection.";
  }
}

const PHASE_OBJECTIVES: Record<
  Exclude<MockInterviewPhase, "completed">,
  string
> = {
  brute_force: "State a correct baseline and identify its repeated work.",
  clarify: "Resolve constraints, edge cases, and output expectations.",
  complexity: "Derive time and space costs from the final approach.",
  examples: "Validate understanding with normal and boundary examples.",
  implementation: "Translate the stated invariant into readable code.",
  intro: "Read the prompt and establish the interview setup.",
  optimization: "Remove the bottleneck and state the final invariant.",
  retrospective: "Record the outcome and one concrete adjustment.",
  testing: "Dry-run normal, boundary, and adversarial cases.",
};

function lineCount(value = "") {
  return Math.max(
    1,
    value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean).length,
  );
}

function itemWord(count: number) {
  return count === 1 ? "item" : "items";
}
