"use client";

import { java } from "@codemirror/lang-java";
import { python } from "@codemirror/lang-python";
import { EditorView } from "@codemirror/view";
import CodeMirror from "@uiw/react-codemirror";
import {
  Check,
  Cloud,
  CloudAlert,
  LoaderCircle,
  Send,
  TerminalSquare,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/form-field";
import type { MockInterviewPhase } from "@/domain/mock-interview";
import {
  saveMockInterviewWorkspaceAction,
  submitMockInterviewCodeAction,
} from "@/features/mock-interviews/actions";

type CodingLanguage = "java" | "python";
type WorkspaceSnapshot = { code: string; scratchpad: string };
type SaveState = "conflict" | "error" | "saved" | "saving" | "unsaved";
const MAX_CODE_CHARS = 30_000;
const MAX_SCRATCHPAD_CHARS = 10_000;

export type InterviewCodeSubmissionContext = {
  advanceToTesting: boolean;
  code: string;
  language: CodingLanguage;
  snapshotVersion: number;
  submissionId: string;
};

export function InterviewCodingWorkspace({
  codingLanguage,
  elapsedSeconds,
  initialCode,
  initialScratchpad,
  initialWorkspaceVersion,
  interviewId,
  interviewerConnected,
  onSubmitted,
  phase,
  startedAt,
}: {
  codingLanguage: CodingLanguage;
  elapsedSeconds: number;
  initialCode: string;
  initialScratchpad: string;
  initialWorkspaceVersion: number;
  interviewId: string;
  interviewerConnected: boolean;
  onSubmitted(context: InterviewCodeSubmissionContext): void;
  phase: MockInterviewPhase;
  startedAt: string;
}) {
  const startingCode = initialCode || starterCode(codingLanguage);
  const [code, setCode] = useState(startingCode);
  const [scratchpad, setScratchpad] = useState(initialScratchpad);
  const [saveState, setSaveState] = useState<SaveState>(
    initialCode ? "saved" : "unsaved",
  );
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const latestRef = useRef<WorkspaceSnapshot>({
    code: startingCode,
    scratchpad: initialScratchpad,
  });
  const persistedRef = useRef<WorkspaceSnapshot>({
    code: initialCode,
    scratchpad: initialScratchpad,
  });
  const workspaceVersionRef = useRef(initialWorkspaceVersion);
  const savePromiseRef = useRef<Promise<boolean> | null>(null);

  const persistLatest = useCallback(async () => {
    while (true) {
      if (savePromiseRef.current) {
        const pendingSucceeded = await savePromiseRef.current;
        if (!pendingSucceeded) return false;
        continue;
      }
      if (sameSnapshot(latestRef.current, persistedRef.current)) {
        setSaveState("saved");
        return true;
      }

      const snapshot = { ...latestRef.current };
      setSaveState("saving");
      const request = saveMockInterviewWorkspaceAction(interviewId, {
        codeSnapshot: snapshot.code,
        expectedVersion: workspaceVersionRef.current,
        scratchpad: snapshot.scratchpad,
      }).then((result) => {
        if (result.status === "success") {
          workspaceVersionRef.current = result.workspaceVersion;
          persistedRef.current = snapshot;
          setSaveState(
            sameSnapshot(latestRef.current, snapshot) ? "saved" : "unsaved",
          );
          return true;
        }
        setMessage(result.message);
        setSaveState(result.status);
        return false;
      });
      savePromiseRef.current = request;
      const succeeded = await request;
      if (savePromiseRef.current === request) savePromiseRef.current = null;
      if (!succeeded) return false;
    }
  }, [interviewId]);

  useEffect(() => {
    if (sameSnapshot(latestRef.current, persistedRef.current)) return;
    const timer = window.setTimeout(() => void persistLatest(), 900);
    return () => window.clearTimeout(timer);
  }, [code, persistLatest, scratchpad]);

  const changeCode = (value: string) => {
    if (value.length > MAX_CODE_CHARS) {
      setMessage("Code is limited to 30,000 characters.");
      return;
    }
    setCode(value);
    latestRef.current = { ...latestRef.current, code: value };
    setMessage("");
    setSaveState("unsaved");
  };

  const changeScratchpad = (value: string) => {
    setScratchpad(value);
    latestRef.current = { ...latestRef.current, scratchpad: value };
    setMessage("");
    setSaveState("unsaved");
  };

  const submitCode = async (advanceToTesting: boolean) => {
    if (submitting) return;
    setSubmitting(true);
    setMessage("");
    if (savePromiseRef.current && !(await savePromiseRef.current)) {
      setSubmitting(false);
      return;
    }
    const snapshot = { ...latestRef.current };
    const result = await submitMockInterviewCodeAction(interviewId, {
      advanceToTesting,
      codeSnapshot: snapshot.code,
      elapsedSeconds: Math.min(
        14_400,
        Math.max(
          elapsedSeconds,
          Math.floor((Date.now() - new Date(startedAt).getTime()) / 1_000),
        ),
      ),
      expectedVersion: workspaceVersionRef.current,
      scratchpad: snapshot.scratchpad,
    });
    setSubmitting(false);
    if (result.status !== "success") {
      setMessage(result.message);
      setSaveState(result.status);
      return;
    }
    workspaceVersionRef.current = result.workspaceVersion;
    persistedRef.current = snapshot;
    setSaveState("saved");
    setMessage(
      interviewerConnected
        ? advanceToTesting
          ? "Code sent for interviewer review. You are now in Testing."
          : "Code sent for interviewer review. It was not executed."
        : advanceToTesting
          ? "Code saved. You are now in Testing; AI review is unavailable."
          : "Code saved. AI review is unavailable in this interview.",
    );
    onSubmitted({
      advanceToTesting,
      code: snapshot.code,
      language: codingLanguage,
      snapshotVersion: result.workspaceVersion,
      submissionId: result.submissionId,
    });
  };

  const implementationActive = phase === "implementation";
  return (
    <Card>
      <CardContent className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <TerminalSquare
                  aria-hidden="true"
                  className="text-primary size-5"
                />
                Coding workspace
              </h2>
              <SaveBadge state={saveState} />
            </div>
            <p className="text-muted mt-2 text-sm leading-6">
              Scratch from the start. Code is saved privately and is never run
              inside this application.
            </p>
          </div>
          <label className="text-sm font-semibold">
            Coding language · fixed for this interview
            <Select
              aria-label="Coding language fixed for this interview"
              className="mt-2 min-w-40 capitalize"
              disabled
              value={codingLanguage}
            >
              <option value="python">Python</option>
              <option value="java">Java</option>
            </Select>
          </label>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <label className="block text-sm font-semibold">
            Scratchpad
            <span className="text-muted mt-1 block text-xs font-normal">
              Reasoning, edge cases, and diagrams as text.
            </span>
            <textarea
              aria-label="Interview scratchpad"
              className="bg-surface placeholder:text-muted/70 focus:border-primary mt-2 min-h-96 w-full resize-y rounded-lg border px-3 py-2.5 font-mono text-sm leading-6 outline-none"
              dir="auto"
              maxLength={MAX_SCRATCHPAD_CHARS}
              onBlur={() => void persistLatest()}
              onChange={(event) => changeScratchpad(event.target.value)}
              placeholder="Capture assumptions, traces, or a diagram as text…"
              value={scratchpad}
            />
          </label>

          <div className="min-w-0">
            <p className="text-sm font-semibold">Code</p>
            <p className="text-muted mt-1 text-xs">
              Syntax highlighting and keyboard editing for{" "}
              {languageLabel(codingLanguage)}.
            </p>
            <div
              className="bg-surface mt-2 overflow-hidden rounded-lg border [&_.cm-editor]:min-h-96 [&_.cm-editor]:bg-transparent [&_.cm-focused]:outline-none [&_.cm-scroller]:font-mono"
              data-testid="interview-code-editor"
            >
              <CodeMirror
                basicSetup={{
                  bracketMatching: true,
                  closeBrackets: true,
                  foldGutter: true,
                  highlightActiveLine: true,
                  lineNumbers: true,
                }}
                data-language={codingLanguage}
                extensions={[
                  EditorView.contentAttributes.of({
                    "aria-label": `${languageLabel(codingLanguage)} code editor`,
                  }),
                  codingLanguage === "python" ? python() : java(),
                ]}
                height="24rem"
                onBlur={() => void persistLatest()}
                onChange={changeCode}
                value={code}
              />
            </div>
          </div>
        </div>

        {message ? (
          <p
            aria-live="polite"
            className={`mt-4 rounded-lg px-4 py-3 text-sm ${saveState === "error" || saveState === "conflict" ? "bg-danger-soft text-danger" : "bg-primary-soft"}`}
          >
            {message}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button
            disabled={saveState === "conflict" || submitting}
            onClick={() => void persistLatest()}
            variant="secondary"
          >
            <Cloud aria-hidden="true" className="size-4" /> Save now
          </Button>
          {implementationActive ? (
            <>
              <Button
                disabled={
                  submitting || !code.trim() || saveState === "conflict"
                }
                onClick={() => void submitCode(false)}
                variant="secondary"
              >
                <Send aria-hidden="true" className="size-4" /> Send current code
                to interviewer
              </Button>
              <Button
                disabled={
                  submitting || !code.trim() || saveState === "conflict"
                }
                onClick={() => void submitCode(true)}
              >
                <Check aria-hidden="true" className="size-4" /> I’m done coding
                — move to testing
              </Button>
              <p className="text-muted basis-full text-xs">
                The interviewer may inspect the snapshot but cannot execute it
                or claim that tests passed.
              </p>
            </>
          ) : (
            <p className="text-muted text-xs">
              Code-review actions unlock during Implementation. Editing and
              autosave remain available now.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SaveBadge({ state }: { state: SaveState }) {
  if (state === "saving") {
    return (
      <Badge variant="neutral">
        <LoaderCircle aria-hidden="true" className="size-3.5 animate-spin" />
        Saving…
      </Badge>
    );
  }
  if (state === "error" || state === "conflict") {
    return (
      <Badge variant="danger">
        <CloudAlert aria-hidden="true" className="size-3.5" /> Save failed
      </Badge>
    );
  }
  if (state === "unsaved") return <Badge variant="warning">Unsaved</Badge>;
  return (
    <Badge variant="success">
      <Check aria-hidden="true" className="size-3.5" /> Saved
    </Badge>
  );
}

function starterCode(language: CodingLanguage) {
  return language === "python"
    ? "# Write your Python solution here\n"
    : "class Solution {\n    // Write your Java solution here.\n}\n";
}

function languageLabel(language: CodingLanguage) {
  return language === "python" ? "Python" : "Java";
}

function sameSnapshot(left: WorkspaceSnapshot, right: WorkspaceSnapshot) {
  return left.code === right.code && left.scratchpad === right.scratchpad;
}
