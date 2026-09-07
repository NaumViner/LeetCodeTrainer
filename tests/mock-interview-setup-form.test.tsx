import {
  cleanup,
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MockInterviewSetupForm } from "@/components/mock-interviews/mock-interview-setup-form";
import { startMockInterviewAction } from "@/features/mock-interviews/actions";
import { defaultInterviewPreferences } from "@/domain/interview-setup";
vi.mock("@/features/mock-interviews/actions", () => ({
  startMockInterviewAction: vi.fn(async (state) => state),
}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  Reflect.deleteProperty(navigator, "mediaDevices");
  Reflect.deleteProperty(navigator, "locks");
  vi.useRealTimers();
});
describe("quick interview setup", () => {
  it("offers four fields and a default persona without a selection-mode or account gate", () => {
    render(<MockInterviewSetupForm />);
    expect(screen.getAllByRole("combobox")).toHaveLength(4);
    expect(screen.getByLabelText("Interview language")).toHaveValue("english");
    expect(screen.getByLabelText("Coding language")).toHaveValue("python");
    expect(screen.getByLabelText("Difficulty range")).toHaveValue(
      "easy_medium",
    );
    expect(screen.getByLabelText("Interview duration")).toHaveValue("30");
    expect(screen.getByRole("radio", { name: "Comfortable" })).toBeChecked();
    expect(screen.queryByText("Coverage")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: /auto/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Email")).not.toBeInTheDocument();
  });
  it("restores preferences and preserves the tough interviewer", () => {
    render(
      <MockInterviewSetupForm
        defaults={{
          ...defaultInterviewPreferences,
          codingLanguage: "java",
          difficultyRange: "hard",
          durationMinutes: 60,
          interviewerLevel: "faang_tough",
        }}
      />,
    );
    expect(screen.getByLabelText("Coding language")).toHaveValue("java");
    expect(screen.getByLabelText("Difficulty range")).toHaveValue("hard");
    expect(screen.getByRole("radio", { name: "Tough" })).toBeChecked();
  });
  it("opens the interview without waiting for an unanswered microphone prompt", async () => {
    const getUserMedia = vi.fn(() => new Promise<MediaStream>(() => {}));
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia },
    });
    render(<MockInterviewSetupForm />);
    fireEvent.change(screen.getByLabelText("Difficulty range"), {
      target: { value: "medium_hard" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Start interview" }));
    await waitFor(() =>
      expect(startMockInterviewAction).toHaveBeenCalledTimes(1),
    );
    expect(getUserMedia).not.toHaveBeenCalled();
    const submitted = vi.mocked(startMockInterviewAction).mock.calls[0]![1];
    expect(submitted.get("difficultyRange")).toBe("medium_hard");
    expect(submitted.has("selectionMode")).toBe(false);
  });
  it("reports a failed start and allows retrying instead of failing silently", async () => {
    vi.mocked(startMockInterviewAction).mockRejectedValueOnce(
      new Error("network unavailable"),
    );
    render(<MockInterviewSetupForm />);
    fireEvent.click(screen.getByRole("button", { name: "Start interview" }));
    await screen.findByRole("alert");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "We couldn't open your interview",
    );
    expect(
      screen.getByRole("button", { name: "Start interview" }),
    ).toBeEnabled();
  });
  it("stops waiting when another tab holds the start lock", async () => {
    vi.useFakeTimers();
    Object.defineProperty(navigator, "locks", {
      configurable: true,
      value: {
        request: vi.fn(
          (_name: string, options: { signal: AbortSignal }) =>
            new Promise((_resolve, reject) => {
              options.signal.addEventListener(
                "abort",
                () => reject(new DOMException("Timed out", "AbortError")),
                { once: true },
              );
            }),
        ),
      },
    });
    render(<MockInterviewSetupForm />);
    fireEvent.click(screen.getByRole("button", { name: "Start interview" }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_001);
    });
    expect(screen.getByRole("alert")).toHaveTextContent("Another tab");
    expect(startMockInterviewAction).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Start interview" }),
    ).toBeEnabled();
  });
  it("localizes setup for Hebrew without changing coding-language options", () => {
    render(
      <MockInterviewSetupForm
        defaults={{
          ...defaultInterviewPreferences,
          interviewLanguage: "hebrew",
        }}
      />,
    );
    expect(screen.getByRole("button", { name: "התחלת ראיון" })).toBeVisible();
    expect(screen.getByLabelText("שפת קוד")).toHaveValue("python");
  });
});
