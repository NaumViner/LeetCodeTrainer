import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DeleteInterviewForm } from "@/components/mock-interviews/delete-interview-form";

vi.mock("@/features/mock-interviews/actions", () => ({
  deleteMockInterviewAction: vi.fn(async (state) => state),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));

afterEach(cleanup);

describe("delete interview form", () => {
  it("requires an explicit acknowledgement and explains every consequence", () => {
    render(
      <DeleteInterviewForm interviewId="00000000-0000-4000-8000-000000000001" />,
    );

    fireEvent.click(screen.getByText("Delete"));

    expect(screen.getByText("Delete this mock interview?")).toBeVisible();
    expect(screen.queryByText("Two Sum")).not.toBeInTheDocument();
    expect(
      screen.getByText(/permanently removes the interview, transcript/),
    ).toBeVisible();
    expect(screen.getByText(/effect on topic coverage/)).toBeVisible();

    const acknowledgement = screen.getByRole("checkbox", {
      name: /cannot be undone/,
    });
    expect(acknowledgement).toBeRequired();
    expect(acknowledgement).not.toBeChecked();
    expect(
      screen.getByRole("button", { name: "Delete permanently" }),
    ).toBeVisible();
  });
});
