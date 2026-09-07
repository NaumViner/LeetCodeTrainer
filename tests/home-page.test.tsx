import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { InterviewEntry } from "@/components/mock-interviews/interview-entry";
vi.mock("@/features/mock-interviews/queries", () => ({
  getActiveMockInterview: vi.fn(),
}));
vi.mock("@/features/mock-interviews/guest", () => ({
  getGuestInterviewTrial: vi.fn(),
  getInterviewPreferences: vi.fn(),
}));
vi.mock("@/features/practice/queries", () => ({ getActiveAttempt: vi.fn() }));
vi.mock("@/features/auth/session", () => ({
  getAuthenticatedUser: vi.fn(async () => null),
}));
vi.mock("@/features/mock-interviews/actions", () => ({
  startMockInterviewAction: vi.fn(),
  resumeMockInterviewAction: vi.fn(),
}));
vi.mock("@/features/realtime-interviews/config", () => ({
  getRealtimeInterviewProviderName: () => "gemini",
}));
vi.mock("@/features/mock-interviews/rollout", () => ({
  getInterviewRolloutConfig: () => ({ promptContentEnabled: true }),
}));
afterEach(cleanup);
describe("interview-first landing", () => {
  it("lets a new visitor start immediately without learning or signup choices", async () => {
    render(await InterviewEntry({ standalone: true }));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Your next interview starts here.",
    );
    expect(
      screen.getByRole("button", { name: "Start interview" }),
    ).toBeEnabled();
    expect(screen.getAllByRole("combobox")).toHaveLength(4);
    expect(
      screen.queryByRole("link", { name: "Start preparing" }),
    ).not.toBeInTheDocument();
  });
});
