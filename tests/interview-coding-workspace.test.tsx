import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act } from "@testing-library/react";

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
  actionMocks.save.mockReset();
  actionMocks.submit.mockReset();
  vi.useRealTimers();
});

function setup() {
  const onSubmitted = vi.fn();
  const view = render(
    <InterviewCodingWorkspace
      codingLanguage="python"
      elapsedSeconds={45}
      initialCode="original"
      initialScratchpad=""
      initialWorkspaceVersion={0}
      interviewId="00000000-0000-4000-8000-000000000001"
      interviewerConnected
      onSubmitted={onSubmitted}
      phase="implementation"
      startedAt={new Date().toISOString()}
    />,
  );
  return {
    ...view,
    onSubmitted,
    editor: screen.getByLabelText("Python code editor"),
  };
}
function submitted() {
  return {
    status: "success",
    workspaceVersion: 1,
    advancedToTesting: false,
    submissionId: "00000000-0000-4000-8000-000000000099",
    submittedAt: new Date().toISOString(),
  };
}

describe("interview coding workspace", () => {
  it("recovers a rejected save and reconciles its original snapshot before newer edits", async () => {
    actionMocks.save
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({ status: "success", workspaceVersion: 1 })
      .mockResolvedValueOnce({ status: "success", workspaceVersion: 2 });
    const { editor } = setup();
    fireEvent.change(editor, { target: { value: "first draft" } });
    fireEvent.click(screen.getByRole("button", { name: "Save now" }));
    await screen.findByText(/The save could not be confirmed/);
    expect(editor).toHaveValue("first draft");
    fireEvent.change(editor, { target: { value: "newer draft" } });
    fireEvent.click(screen.getByRole("button", { name: "Save now" }));
    await waitFor(() => expect(actionMocks.save).toHaveBeenCalledTimes(3));
    expect(actionMocks.save.mock.calls[1]).toEqual(
      actionMocks.save.mock.calls[0],
    );
    expect(actionMocks.save.mock.calls[2]?.[1]).toMatchObject({
      codeSnapshot: "newer draft",
      expectedVersion: 1,
    });
    await screen.findByText("Saved");
    expect(editor).toHaveValue("newer draft");
    expect(
      screen.queryByText(/could not be confirmed/),
    ).not.toBeInTheDocument();
  });

  it("retries an uncertain submission exactly and preserves subsequent edits", async () => {
    actionMocks.submit
      .mockRejectedValueOnce(new Error("response lost"))
      .mockResolvedValueOnce(submitted());
    actionMocks.save.mockImplementation(async (_id, input) => ({
      status: "success",
      workspaceVersion: input.expectedVersion + 1,
    }));
    const { editor, onSubmitted } = setup();
    fireEvent.click(screen.getByRole("button", { name: /Send current code/ }));
    await screen.findByText(/The submission could not be confirmed/);
    expect(
      screen.getByRole("button", { name: /Send current code/ }),
    ).toBeEnabled();
    fireEvent.change(editor, {
      target: { value: "new draft after interruption" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Retry code submission" }),
    );
    await waitFor(() => expect(onSubmitted).toHaveBeenCalledOnce());
    expect(actionMocks.submit.mock.calls[1]).toEqual(
      actionMocks.submit.mock.calls[0],
    );
    expect(onSubmitted).toHaveBeenCalledWith(
      expect.objectContaining({ code: "original", snapshotVersion: 1 }),
    );
    expect(editor).toHaveValue("new draft after interruption");
    expect(screen.getByText("Unsaved")).toBeVisible();
  });

  it("serializes edits made during a pending save", async () => {
    let resolveFirst!: (value: {
      status: string;
      workspaceVersion: number;
    }) => void;
    actionMocks.save
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFirst = resolve;
          }),
      )
      .mockResolvedValueOnce({ status: "success", workspaceVersion: 2 });
    const { editor } = setup();
    fireEvent.change(editor, { target: { value: "first" } });
    fireEvent.click(screen.getByRole("button", { name: "Save now" }));
    await waitFor(() => expect(actionMocks.save).toHaveBeenCalledOnce());
    fireEvent.change(editor, { target: { value: "second" } });
    fireEvent.click(screen.getByRole("button", { name: "Save now" }));
    expect(actionMocks.save).toHaveBeenCalledOnce();
    await act(async () => {
      resolveFirst({ status: "success", workspaceVersion: 1 });
    });
    await screen.findByText("Saved");
    expect(actionMocks.save).toHaveBeenCalledTimes(2);
    expect(actionMocks.save.mock.calls[1]?.[1]).toMatchObject({
      expectedVersion: 1,
      codeSnapshot: "second",
    });
  });

  it("does not submit twice or autosave over an in-flight submission", async () => {
    vi.useFakeTimers();
    let resolveSubmit!: (value: ReturnType<typeof submitted>) => void;
    actionMocks.submit.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSubmit = resolve;
        }),
    );
    actionMocks.save.mockResolvedValue({
      status: "success",
      workspaceVersion: 2,
    });
    const { editor, onSubmitted } = setup();
    const button = screen.getByRole("button", { name: /Send current code/ });
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.change(editor, { target: { value: "edited during submit" } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
    });
    expect(actionMocks.submit).toHaveBeenCalledOnce();
    expect(actionMocks.save).not.toHaveBeenCalled();
    await act(async () => {
      resolveSubmit(submitted());
    });
    expect(onSubmitted).toHaveBeenCalledOnce();
    expect(screen.getByText("Unsaved")).toBeVisible();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(901);
    });
    expect(actionMocks.save.mock.calls[0]?.[1]).toMatchObject({
      expectedVersion: 1,
      codeSnapshot: "edited during submit",
    });
  });

  it("keeps a cross-tab conflict blocked even after more typing", async () => {
    actionMocks.save.mockResolvedValue({
      status: "conflict",
      message: "Copy your edits before refreshing.",
    });
    const { editor } = setup();
    fireEvent.change(editor, { target: { value: "local draft" } });
    fireEvent.click(screen.getByRole("button", { name: "Save now" }));
    await screen.findByText(/Copy your edits/);
    fireEvent.change(editor, { target: { value: "still my draft" } });
    expect(screen.getByRole("button", { name: "Save now" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /Send current code/ }),
    ).toBeDisabled();
    expect(editor).toHaveValue("still my draft");
  });

  it("cancels scheduled autosave on unmount", async () => {
    vi.useFakeTimers();
    const { editor, unmount } = setup();
    fireEvent.change(editor, { target: { value: "draft" } });
    unmount();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
    });
    expect(actionMocks.save).not.toHaveBeenCalled();
  });

  it("handles an autosave rejection without retrying in a loop", async () => {
    vi.useFakeTimers();
    actionMocks.save.mockRejectedValue(new Error("offline"));
    const { editor } = setup();
    fireEvent.change(editor, { target: { value: "offline draft" } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(901);
    });
    expect(screen.getByText(/The save could not be confirmed/)).toBeVisible();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    expect(actionMocks.save).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Save now" })).toBeEnabled();
  });

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
