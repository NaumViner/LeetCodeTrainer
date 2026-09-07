import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AbandonPracticeForm } from "@/components/practice/abandon-practice-form";

vi.mock("@/features/practice/actions", () => ({
  abandonPracticeAttemptAction: vi.fn(),
}));

afterEach(cleanup);

describe("abandon practice form", () => {
  it("requires explicit confirmation and explains the profile impact", () => {
    render(
      <AbandonPracticeForm attemptId="00000000-0000-4000-8000-000000000001" />,
    );

    expect(screen.getByText("Abandon practice")).toBeVisible();
    expect(
      screen.getByText(/will not count as a completed solution/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).toBeRequired();
    expect(
      screen.getByRole("button", { name: /Abandon and open interviews/i }),
    ).toBeInTheDocument();
  });
});
