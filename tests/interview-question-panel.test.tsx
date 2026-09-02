import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { InterviewQuestionPanel } from "@/components/mock-interviews/interview-question-panel";

afterEach(cleanup);

describe("interview question panel", () => {
  it("renders the immutable prompt without question metadata or supporting content", () => {
    render(
      <InterviewQuestionPanel prompt="Return whether any integer is repeated." />,
    );

    expect(
      screen.getByText("Return whether any integer is repeated."),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Interview question" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Interview prompt/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Public examples/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Constraints/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
