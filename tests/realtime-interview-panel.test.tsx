import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RealtimeInterviewPanel } from "@/components/mock-interviews/realtime-interview-panel";

vi.mock("@/features/realtime-interviews/actions", () => ({
  activateVoiceMockInterviewAction: vi.fn(),
  endRealtimeInterviewSessionAction: vi.fn(async () => ({
    status: "success",
  })),
  heartbeatVoiceMockInterviewAction: vi.fn(async () => ({
    status: "success",
  })),
  recordMockInterviewPhaseSuggestionAction: vi.fn(),
  saveRealtimeInterviewEventAction: vi.fn(),
}));

vi.mock("@/features/realtime-interviews/openai-webrtc-provider", () => ({
  OpenAiWebRtcInterviewProvider: class {
    async closeSession() {}
    async createSession() {
      throw new Error("Test microphone unavailable.");
    }
  },
}));

vi.mock("@/features/realtime-interviews/gemini-live-provider", () => ({
  GeminiLiveInterviewProvider: class {
    async closeSession() {}
    async createSession() {
      throw new Error("Test microphone unavailable.");
    }
  },
}));

afterEach(cleanup);

describe("realtime interview panel", () => {
  it("auto-connects as voice-only and exposes no typed or transcript fallback", async () => {
    render(
      <RealtimeInterviewPanel
        contextUpdate={null}
        interviewId="00000000-0000-4000-8000-000000000001"
        onConnectionStateChange={vi.fn()}
        onPhaseSuggestionRecorded={vi.fn()}
        onTranscript={vi.fn()}
        onVoiceActivated={vi.fn()}
        phase="intro"
        providerName="openai"
      />,
    );

    expect(screen.getByText("Live interviewer")).toBeVisible();
    expect(screen.getByText(/latest spoken turns stay visible/i)).toBeVisible();
    expect(
      await screen.findByText("Test microphone unavailable."),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Reconnect voice" }),
    ).toBeVisible();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("Live interview transcript"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /End voice/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Voice is optional/i)).not.toBeInTheDocument();
  });
});
