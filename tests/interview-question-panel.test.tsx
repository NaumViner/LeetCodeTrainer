import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { InterviewQuestionPanel } from "@/components/mock-interviews/interview-question-panel";

afterEach(cleanup);

describe("interview question panel", () => {
  it("renders only learner-visible structured content and stays collapsible", () => {
    const { rerender } = render(
      <InterviewQuestionPanel
        canonicalUrl="https://example.com/reference"
        content={{
          constraints: ["1 <= nums.length <= 100"],
          contentVersion: 1,
          examples: [
            {
              explanation: "The repeated value is 4.",
              input: "nums = [4, 2, 4]",
              output: "true",
            },
          ],
          prompt: "Return whether any integer is repeated.",
        }}
        difficulty="easy"
        remainingLabel="Remaining 29:10"
        title="Contains Duplicate"
      />,
    );

    expect(screen.getByText("Interview prompt")).toBeVisible();
    expect(screen.getByText(/Return whether any integer/)).toBeVisible();
    expect(screen.getByText(/Input: nums = \[4, 2, 4\]/)).toBeVisible();
    expect(screen.getByText("1 <= nums.length <= 100")).toBeVisible();
    expect(screen.getByText(/First-party interview prompt/)).toBeVisible();
    expect(screen.queryByText(/invariant/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /View external reference/ }),
    ).toHaveAttribute("target", "_blank");

    fireEvent.click(screen.getByText("Contains Duplicate"));
    expect(screen.getByText(/Return whether any integer/)).not.toBeVisible();
    rerender(
      <InterviewQuestionPanel
        canonicalUrl="https://example.com/reference"
        content={{
          constraints: ["1 <= nums.length <= 100"],
          contentVersion: 1,
          examples: [
            {
              explanation: "The repeated value is 4.",
              input: "nums = [4, 2, 4]",
              output: "true",
            },
          ],
          prompt: "Return whether any integer is repeated.",
        }}
        difficulty="easy"
        remainingLabel="Remaining 29:09"
        title="Contains Duplicate"
      />,
    );
    expect(screen.getByText(/Return whether any integer/)).not.toBeVisible();
  });

  it("keeps a usable source fallback when embedded prompts are paused", () => {
    render(
      <InterviewQuestionPanel
        canonicalUrl="https://example.com/reference"
        content={null}
        difficulty="medium"
        remainingLabel="Remaining 20:00"
        title="Fallback problem"
      />,
    );

    expect(
      screen.getByText(/embedded interview prompt is unavailable/i),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: /View external reference/ }),
    ).toHaveAttribute("href", "https://example.com/reference");
  });
});
