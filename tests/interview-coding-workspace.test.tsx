import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { InterviewCodingWorkspace } from "@/components/mock-interviews/interview-coding-workspace";

const actionMocks = vi.hoisted(() => ({
  save: vi.fn(),
  submit: vi.fn(),
}));

vi.mock("@/features/mock-interviews/actions", () => ({
  saveMockInterviewWorkspaceAction: actionMocks.save,
  submitMockInterviewCodeAction: actionMocks.submit,
}));
vi.mock("@codemirror/lang-java", () => ({ java: () => [] }));
vi.mock("@codemirror/lang-python", () => ({ python: () => [] }));
vi.mock("@uiw/react-codemirror", () => ({
  default: ({
    "data-language": dataLanguage,
    onBlur,
    onChange,
    value,
  }: {
    "data-language": "java" | "python";
    onBlur(): void;
    onChange(value: string): void;
    value: string;
  }) => (
    <textarea
      aria-label={`${dataLanguage === "java" ? "Java" : "Python"} code editor`}
      onBlur={onBlur}
      onChange={(event) => onChange(event.target.value)}
      value={value}
    />
  ),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("interview coding workspace", () => {
  it("saves scratchpad/code and unlocks bounded review only in Implementation", async () => {
    actionMocks.save.mockResolvedValue({
      status: "success",
      workspaceVersion: 1,
    });
    actionMocks.submit.mockResolvedValue({
      advancedToTesting: false,
      status: "success",
      submissionId: "00000000-0000-4000-8000-000000000099",
      submittedAt: "2026-09-02T10:00:00.000Z",
      workspaceVersion: 2,
    });
    const onSubmitted = vi.fn();
    const props = {
      codingLanguage: "java" as const,
      elapsedSeconds: 45,
      initialCode: "class Solution {}",
      initialScratchpad: "",
      initialWorkspaceVersion: 0,
      interviewId: "00000000-0000-4000-8000-000000000001",
      interviewerConnected: true,
      onSubmitted,
      startedAt: new Date().toISOString(),
    };
    const { rerender } = render(
      <InterviewCodingWorkspace {...props} phase="intro" />,
    );

    expect(
      screen.getByLabelText("Coding language fixed for this interview"),
    ).toBeDisabled();
    expect(screen.getByLabelText("Java code editor")).toHaveValue(
      "class Solution {}",
    );
    expect(
      screen.queryByRole("button", { name: /Send current code/ }),
    ).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Interview scratchpad"), {
      target: { value: "Trace the empty case." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save now" }));
    await waitFor(() => expect(actionMocks.save).toHaveBeenCalledOnce());
    expect(actionMocks.save).toHaveBeenCalledWith(props.interviewId, {
      codeSnapshot: "class Solution {}",
      expectedVersion: 0,
      scratchpad: "Trace the empty case.",
    });

    rerender(<InterviewCodingWorkspace {...props} phase="implementation" />);
    fireEvent.click(
      screen.getByRole("button", {
        name: /Send current code to interviewer/,
      }),
    );
    await waitFor(() => expect(actionMocks.submit).toHaveBeenCalledOnce());
    expect(actionMocks.submit).toHaveBeenCalledWith(props.interviewId, {
      advanceToTesting: false,
      codeSnapshot: "class Solution {}",
      elapsedSeconds: 45,
      expectedVersion: 1,
      scratchpad: "Trace the empty case.",
    });
    expect(onSubmitted).toHaveBeenCalledWith(
      expect.objectContaining({
        advanceToTesting: false,
        language: "java",
        snapshotVersion: 2,
      }),
    );
    expect(screen.getByText(/It was not executed/)).toBeVisible();
  });
});
