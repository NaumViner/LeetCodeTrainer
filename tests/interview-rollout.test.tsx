import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ImplementationFallback } from "@/components/mock-interviews/mock-interview-workspace";

vi.mock("@/features/mock-interviews/actions", () => ({
  abandonMockInterviewAction: vi.fn(),
  advanceMockInterviewAction: vi.fn(),
  completeMockInterviewAction: vi.fn(),
}));

afterEach(cleanup);

describe("interview rollout fallbacks", () => {
  it("preserves bounded manual Java implementation when CodeMirror is paused", () => {
    const onAdvance = vi.fn();
    render(
      <ImplementationFallback
        codingLanguage="java"
        disabled={false}
        initialCode="class Solution {}"
        onAdvance={onAdvance}
      />,
    );

    const editor = screen.getByLabelText("Java code");
    expect(editor).toHaveAttribute("dir", "ltr");
    expect(editor).toHaveAttribute("maxlength", "30000");
    expect(editor).toHaveValue("class Solution {}");
    fireEvent.submit(editor.closest("form")!);
    expect(onAdvance).toHaveBeenCalledWith({ notes: "class Solution {}" });
  });
});
