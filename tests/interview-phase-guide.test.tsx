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

  it("renders an accessible current step and separates the guide from scoring", () => {
    render(<InterviewPhaseGuide currentPhase="clarify" events={events} />);
    expect(
      screen.getByRole("heading", { name: "Interview process guide" }),
    ).toBeVisible();
    expect(screen.getByText(/Final scoring remains separate/)).toBeVisible();
    expect(
      screen.getByText("You are here", { selector: "span" }),
    ).toBeVisible();
    expect(screen.getByText("Needs confirmation")).toBeVisible();
    expect(screen.getByRole("listitem", { current: "step" })).toHaveTextContent(
      "Clarify",
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
