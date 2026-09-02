import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MockInterviewSetupForm } from "@/components/mock-interviews/mock-interview-setup-form";

vi.mock("@/features/mock-interviews/actions", () => ({
  startMockInterviewAction: vi.fn(async (state) => state),
}));

afterEach(cleanup);

describe("mock interview setup form", () => {
  it("explains every mode and disables Improvement before full coverage", () => {
    render(<MockInterviewSetupForm setup={incompleteSetup} />);

    expect(screen.getByText("Topic coverage: 1 / 3")).toBeVisible();
    expect(screen.getByRole("radio", { name: /Coverage/ })).toBeChecked();
    expect(screen.getByRole("radio", { name: /Improvement/ })).toBeDisabled();
    expect(
      screen.getByText(/Randomly uses one of your three weakest/),
    ).toBeVisible();
    expect(screen.getByText(/Uses Adaptive mastery/)).toBeVisible();
    expect(screen.getByText(/Choose one NeetCode topic/)).toBeVisible();
  });

  it("shows exact Custom inventory and blocks unavailable combinations", () => {
    render(<MockInterviewSetupForm setup={incompleteSetup} />);

    fireEvent.click(screen.getByRole("radio", { name: /Choose topic/ }));
    expect(screen.getByLabelText("NeetCode topic")).toBeVisible();
    expect(
      screen.getByText(
        "2 approved interview prompts available. A fresh one is preferred.",
      ),
    ).toBeVisible();

    fireEvent.change(screen.getByLabelText("Exact difficulty"), {
      target: { value: "hard" },
    });
    expect(
      screen.getByText(/No approved interview prompt exists/),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Start mock interview" }),
    ).toBeDisabled();
  });

  it("defaults to Learning after complete coverage and preserves Java", () => {
    render(
      <MockInterviewSetupForm
        defaultCodingLanguage="java"
        setup={{
          ...incompleteSetup,
          coverage: {
            complete: true,
            coveredTopicCount: 3,
            missingTopicNames: [],
            totalTopicCount: 3,
          },
          improvement: {
            available: true,
            unavailableReason: null,
            weakTopics: [
              {
                adjustedScore: 42,
                confidence: 55,
                id: "topic-a",
                name: "Arrays",
              },
            ],
          },
        }}
      />,
    );

    expect(screen.getByRole("radio", { name: /Learning/ })).toBeChecked();
    expect(
      screen.getByRole("combobox", { name: /Coding language/ }),
    ).toHaveValue("java");
    expect(screen.getByText("Balanced random")).toBeVisible();
  });

  it("falls back to adaptive Learning when selection modes are paused", () => {
    render(
      <MockInterviewSetupForm
        defaultMode="custom"
        selectionModesEnabled={false}
        setup={incompleteSetup}
      />,
    );

    expect(screen.getByText("Adaptive Learning selection")).toBeVisible();
    expect(screen.queryByRole("radio", { name: /Coverage/ })).toBeNull();
    expect(screen.queryByRole("radio", { name: /Choose topic/ })).toBeNull();
    expect(screen.getByDisplayValue("learning")).toHaveAttribute(
      "name",
      "selectionMode",
    );
    expect(
      screen.getByRole("button", { name: "Start mock interview" }),
    ).toBeEnabled();
  });
});

const incompleteSetup = {
  collection: { name: "NeetCode 150", version: 1 },
  coverage: {
    complete: false,
    coveredTopicCount: 1,
    missingTopicNames: ["Trees", "Graphs"],
    totalTopicCount: 3,
  },
  improvement: {
    available: false,
    unavailableReason: "Complete an interview in: Trees, Graphs.",
    weakTopics: [],
  },
  learning: {
    available: true,
    reasons: ["Its difficulty matches your current evidence."],
  },
  topics: [
    {
      completedInterviews: 1,
      id: "topic-a",
      inventory: { easy: 2, hard: 0, medium: 3 },
      name: "Arrays",
      ordinal: 1,
      slug: "arrays",
    },
    {
      completedInterviews: 0,
      id: "topic-b",
      inventory: { easy: 1, hard: 1, medium: 2 },
      name: "Trees",
      ordinal: 2,
      slug: "trees",
    },
    {
      completedInterviews: 0,
      id: "topic-c",
      inventory: { easy: 0, hard: 2, medium: 2 },
      name: "Graphs",
      ordinal: 3,
      slug: "graphs",
    },
  ],
};
