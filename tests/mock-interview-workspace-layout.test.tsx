import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MockInterviewWorkspace } from "@/components/mock-interviews/mock-interview-workspace";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("next/dynamic", () => ({
  default: (_loader: unknown, options?: unknown) =>
    options
      ? function CodingWorkspaceMock() {
          return <div data-testid="coding-workspace">Coding workspace</div>;
        }
      : function RealtimePanelMock() {
          return <div data-testid="live-interviewer">Live interviewer</div>;
        },
}));

vi.mock("@/features/mock-interviews/actions", () => ({
  abandonMockInterviewAction: vi.fn(),
  advanceMockInterviewAction: vi.fn(),
  completeMockInterviewAction: vi.fn(),
}));

afterEach(cleanup);

describe("mock interview workspace layout", () => {
  it("renders guide, question, voice, recent speech, then code", () => {
    render(
      <MockInterviewWorkspace
        interview={{
          codeSnapshot: "",
          codingLanguage: "python",
          codingWorkspaceEnabled: true,
          durationMinutes: 45,
          effectiveElapsedSeconds: 0,
          id: "00000000-0000-4000-8000-000000000001",
          initialRecentTranscript: [
            { id: "1", role: "interviewer", text: "Tell me your approach." },
          ],
          interviewLanguage: "english",
          phase: "intro",
          questionPrompt: "Return whether a repeated value exists.",
          realtimeEnabled: true,
          realtimeProvider: "gemini",
          scratchpad: "",
          startedAt: "2026-09-02T13:00:00.000Z",
          timerRunning: false,
          workspaceVersion: 0,
        }}
      />,
    );

    const guide = screen.getByRole("heading", { name: "Guiding star" });
    const question = screen.getByText(
      "Return whether a repeated value exists.",
    );
    const voice = screen.getByTestId("live-interviewer");
    const recent = screen.getByRole("heading", {
      name: "Recent conversation",
    });
    const code = screen.getByTestId("coding-workspace");

    expect(guide.compareDocumentPosition(question)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(question.compareDocumentPosition(voice)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(voice.compareDocumentPosition(recent)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(recent.compareDocumentPosition(code)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });
});
