import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { InterviewPhaseGuide } from "@/components/mock-interviews/interview-phase-guide";
import {
  buildInterviewPhaseGuide,
  summarizePhaseEvidence,
  type InterviewPhaseGuideEvent,
} from "@/domain/interview-phase-guide";

afterEach(cleanup);

describe("interview phase guide", () => {
  it("shows a neutral unknown state instead of falsely selecting Intro", () => {
    render(
      <InterviewPhaseGuide
        currentPhase="intro"
        events={[]}
        observedPhase={null}
      />,
    );
    expect(
      screen.getByText("Waiting for a clear conversation stage"),
    ).toBeVisible();
    expect(screen.queryByRole("listitem", { current: "step" })).toBeNull();
  });

  it("clears the highlighted stage while tracking reconnects", () => {
    render(
      <InterviewPhaseGuide
        currentPhase="implementation"
        observedPhase="implementation"
        trackingStatus="reconnecting"
      />,
    );
    expect(screen.getByText("Reconnecting stage tracking")).toBeVisible();
    expect(screen.queryByRole("listitem", { current: "step" })).toBeNull();
  });

  const events: InterviewPhaseGuideEvent[] = [
    {
      displaySummary: "Interview setup and prompt review completed.",
      id: "started",
      phase: "intro",
      suggestedPhase: null,
      transitionType: "completed",
    },
    {
      displaySummary: "Interviewer suggested examples.",
      id: "suggested",
      phase: "clarify",
      suggestedPhase: "examples",
      transitionType: "suggested",
    },
  ];

  it("derives exactly one state per phase without letting a suggestion advance", () => {
    const guide = buildInterviewPhaseGuide({
      currentPhase: "clarify",
      events,
    });
    expect(guide.map((item) => item.state)).toEqual([
      "completed",
      "current",
      "needs_confirmation",
      "future",
      "future",
      "future",
      "future",
      "future",
      "future",
    ]);
    expect(guide.find((item) => item.phase === "intro")?.summary).toContain(
      "prompt review",
    );
  });

  it("renders compact phase-name-only tiles with accessible state", () => {
    render(<InterviewPhaseGuide currentPhase="clarify" events={events} />);
    expect(
      screen.getByRole("heading", { name: /Guiding star.*Primary question/i }),
    ).toBeVisible();
    expect(screen.getByRole("listitem", { current: "step" })).toHaveTextContent(
      "Clarify",
    );
    expect(screen.getByText("Current step")).toHaveClass("sr-only");
    expect(screen.getByText("Needs confirmation")).toHaveClass("sr-only");
    expect(
      screen.queryByText(/Resolve constraints, edge cases/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Captured:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Final scoring/i)).not.toBeInTheDocument();
  });

  it("lights only the observed conversational stage and permits jumps", () => {
    const guide = buildInterviewPhaseGuide({
      currentPhase: "clarify",
      events,
      observedPhase: "implementation",
    });
    expect(guide.map((item) => item.state)).toEqual([
      "future",
      "future",
      "future",
      "future",
      "future",
      "current",
      "future",
      "future",
      "future",
    ]);

    const afterBacktrack = buildInterviewPhaseGuide({
      currentPhase: "implementation",
      events,
      observedPhase: "examples",
    });
    expect(afterBacktrack.find((item) => item.state === "current")?.phase).toBe(
      "examples",
    );
  });

  it("creates bounded deterministic summaries from saved evidence", () => {
    expect(
      summarizePhaseEvidence("testing", {
        notes: "Empty input\nBoundary input\nOrdinary input",
      }),
    ).toBe("Captured 3 test or dry-run items.");
    expect(
      summarizePhaseEvidence("implementation", {
        codingLanguage: "java",
        workspaceVersion: 4,
      }),
    ).toBe("Java code snapshot version 4 submitted.");
  });
});
