import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { RecentInterviewConversation } from "@/components/mock-interviews/recent-interview-conversation";

afterEach(cleanup);

describe("recent interview conversation", () => {
  it("keeps recent learner and interviewer speech visible above the editor", () => {
    render(
      <RecentInterviewConversation
        entries={[
          { id: "1", role: "interviewer", text: "How would you begin?" },
          { id: "2", role: "learner", text: "I would clarify the input." },
        ]}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Recent conversation" }),
    ).toBeVisible();
    expect(
      screen.getByLabelText("Recent interview conversation"),
    ).toHaveTextContent("Interviewer:How would you begin?");
    expect(
      screen.getByLabelText("Recent interview conversation"),
    ).toHaveTextContent("You:I would clarify the input.");
  });

  it("shows a stable empty state before the first completed turn", () => {
    render(<RecentInterviewConversation entries={[]} />);
    expect(screen.getByText(/will appear here/i)).toBeVisible();
  });
});
