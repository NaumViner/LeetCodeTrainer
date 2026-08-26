"use client";

import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Lightbulb,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState, useTransition } from "react";

import { DifficultyBadge } from "@/components/problems/difficulty-badge";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/form-field";
import { ATTEMPT_PHASES, type AttemptPhase } from "@/domain/practice";
import {
  advanceAttemptAction,
  completeAttemptAction,
  requestAttemptHintAction,
  savePreAttemptAction,
  updateAttemptTimerAction,
} from "@/features/practice/actions";
import type { PracticeAttempt } from "@/features/practice/queries";

const phaseLabels: Record<AttemptPhase, string> = {
  coding: "Coding",
  completed: "Completed",
  planning: "Planning",
  pre_attempt: "Pre-attempt",
  reflection: "Reflection",
  testing: "Testing",
};

const textareaClass =
  "bg-surface placeholder:text-muted/70 focus:border-primary min-h-28 w-full rounded-lg border px-3 py-2.5 text-sm shadow-sm outline-none";

export function PracticeWorkspace({ attempt }: { attempt: PracticeAttempt }) {
  const router = useRouter();
  const [phase, setPhase] = useState(attempt.phase as AttemptPhase);
  const [seconds, setSeconds] = useState(attempt.effectiveDurationSeconds);
  const [running, setRunning] = useState(attempt.timer_running);
  const [codeSnapshot, setCodeSnapshot] = useState(attempt.code_snapshot ?? "");
  const [hints, setHints] = useState(attempt.hints);
  const [message, setMessage] = useState("");
  const [isPending, runAction] = useTransition();

  useEffect(() => {
    if (!running || phase === "completed") return;
    const timer = window.setInterval(
      () => setSeconds((current) => Math.min(86_400, current + 1)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [phase, running]);

  if (attempt.status === "completed" || phase === "completed") {
    return <CompletedAttempt attempt={attempt} />;
  }

  const perform = (
    action: () => Promise<{ message?: string; status: string }>,
    onSuccess?: () => void,
  ) => {
    setMessage("");
    runAction(async () => {
      const result = await action();
      if (result.status === "error") {
        setMessage(result.message ?? "Your progress could not be saved.");
        return;
      }
      onSuccess?.();
    });
  };

  const changeTimer = (nextRunning: boolean, nextSeconds = seconds) => {
    perform(
      () =>
        updateAttemptTimerAction(attempt.id, {
          durationSeconds: nextSeconds,
          running: nextRunning,
        }),
      () => {
        setRunning(nextRunning);
        setSeconds(nextSeconds);
      },
    );
  };

  const advance = (targetPhase: AttemptPhase) => {
    perform(
      () =>
        advanceAttemptAction(attempt.id, {
          codeSnapshot,
          durationSeconds: seconds,
          running,
          targetPhase,
        }),
      () => {
        setPhase(targetPhase);
        if (targetPhase === "reflection") setRunning(false);
      },
    );
  };

  const revealHint = () => {
    setMessage("");
    runAction(async () => {
      const result = await requestAttemptHintAction(attempt.id);
      if (result.status === "error") {
        setMessage(result.message);
        return;
      }
      setHints((current) => [...current, result.data]);
    });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-primary text-sm font-semibold">Practice attempt</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            {attempt.problem.title}
          </h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge>#{attempt.problem.external_id}</Badge>
            <DifficultyBadge
              difficulty={
                attempt.problem.difficulty as "easy" | "hard" | "medium"
              }
            />
            <Badge variant="primary">{attempt.problem.primaryTopic.name}</Badge>
            <Badge className="capitalize">{attempt.mode} mode</Badge>
          </div>
        </div>
        <a
          className={buttonVariants({ variant: "secondary" })}
          href={attempt.problem.external_url ?? "#"}
          rel="noreferrer"
          target="_blank"
        >
          Open original problem
          <ExternalLink aria-hidden="true" className="size-4" />
        </a>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <Card className="shadow-none">
            <CardContent className="p-5">
              <ol
                aria-label="Attempt progress"
                className="grid grid-cols-3 gap-2 sm:grid-cols-6"
              >
                {ATTEMPT_PHASES.map((item, index) => {
                  const activeIndex = ATTEMPT_PHASES.indexOf(phase);
                  return (
                    <li
                      aria-current={item === phase ? "step" : undefined}
                      className={
                        "rounded-lg border px-2 py-2 text-center text-xs font-semibold " +
                        (index <= activeIndex
                          ? "bg-primary-soft text-primary border-primary/20"
                          : "text-muted")
                      }
                      key={item}
                    >
                      {phaseLabels[item]}
                    </li>
                  );
                })}
              </ol>
            </CardContent>
          </Card>

          {phase === "pre_attempt" ? (
            <PreAttemptStep
              attempt={attempt}
              disabled={isPending}
              onSubmit={(input) =>
                perform(
                  () =>
                    savePreAttemptAction(attempt.id, {
                      ...input,
                      durationSeconds: seconds,
                      running,
                    }),
                  () => setPhase("planning"),
                )
              }
            />
          ) : null}
          {phase === "planning" ? (
            <PlanningStep
              attempt={attempt}
              disabled={isPending}
              onAdvance={() => advance("coding")}
            />
          ) : null}
          {phase === "coding" ? (
            <CodingStep
              code={codeSnapshot}
              disabled={isPending}
              onChange={setCodeSnapshot}
              onSave={() => advance("coding")}
              onAdvance={() => advance("testing")}
            />
          ) : null}
          {phase === "testing" ? (
            <TestingStep
              disabled={isPending}
              onAdvance={() => advance("reflection")}
            />
          ) : null}
          {phase === "reflection" ? (
            <ReflectionStep
              attempt={attempt}
              disabled={isPending}
              onSubmit={(input) =>
                perform(
                  () =>
                    completeAttemptAction(attempt.id, {
                      ...input,
                      durationSeconds: seconds,
                    }),
                  () => {
                    router.refresh();
                  },
                )
              }
            />
          ) : null}

          {message ? (
            <p
              aria-live="polite"
              className="bg-danger-soft text-danger rounded-lg px-4 py-3 text-sm"
            >
              {message}
            </p>
          ) : null}
        </div>

        <aside className="space-y-5">
          <Card>
            <CardContent className="p-5">
              <h2 className="flex items-center gap-2 font-semibold">
                <Clock3 aria-hidden="true" className="text-primary size-4" />
                Elapsed time
              </h2>
              <p
                aria-live="off"
                className="mt-4 font-mono text-3xl font-bold tabular-nums"
              >
                {formatDuration(seconds)}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  disabled={isPending || running}
                  onClick={() => changeTimer(true)}
                  size="sm"
                >
                  <Play aria-hidden="true" className="size-3.5" /> Start
                </Button>
                <Button
                  disabled={isPending || !running}
                  onClick={() => changeTimer(false)}
                  size="sm"
                  variant="secondary"
                >
                  <Pause aria-hidden="true" className="size-3.5" /> Pause
                </Button>
                <Button
                  disabled={isPending}
                  onClick={() => changeTimer(false, 0)}
                  size="sm"
                  variant="ghost"
                >
                  <RotateCcw aria-hidden="true" className="size-3.5" /> Reset
                </Button>
              </div>
              <p className="text-muted mt-3 text-xs leading-5">
                Running state and elapsed time are saved on every control and
                workflow transition.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h2 className="flex items-center gap-2 font-semibold">
                <Lightbulb aria-hidden="true" className="text-primary size-4" />
                Progressive hints
              </h2>
              <div className="mt-4 space-y-3">
                {hints.map((hint) => (
                  <div
                    className="bg-surface-subtle rounded-lg border p-3"
                    key={hint.id}
                  >
                    <p className="text-xs font-semibold">
                      {hint.ordinal}. {hint.title}
                    </p>
                    <p className="text-muted mt-1.5 text-sm leading-6 whitespace-pre-line">
                      {hint.content}
                    </p>
                  </div>
                ))}
                {hints.length === 0 ? (
                  <p className="text-muted text-sm">No help used yet.</p>
                ) : null}
              </div>
              <Button
                className="mt-4 w-full"
                disabled={isPending || hints.length >= 6}
                onClick={revealHint}
                variant="secondary"
              >
                {hints.length >= 6 ? "All hints revealed" : "Reveal next hint"}
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function PreAttemptStep({
  attempt,
  disabled,
  onSubmit,
}: {
  attempt: PracticeAttempt;
  disabled: boolean;
  onSubmit(input: {
    bruteForceApproach: string;
    bruteForceComplexity: string;
    confidenceBefore: number;
    predictedPattern: string;
  }): void;
}) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onSubmit({
      bruteForceApproach: String(data.get("bruteForceApproach")),
      bruteForceComplexity: String(data.get("bruteForceComplexity")),
      confidenceBefore: Number(data.get("confidenceBefore")),
      predictedPattern: String(data.get("predictedPattern")),
    });
  };
  return (
    <Card>
      <CardContent className="p-6 sm:p-8">
        <h2 className="text-xl font-semibold">Predict before you code</h2>
        <p className="text-muted mt-2 text-sm leading-6">
          Open the original problem, then capture your first independent read.
        </p>
        <form className="mt-6 space-y-5" onSubmit={submit}>
          <Field label="What pattern would you try first?">
            <Input
              defaultValue={attempt.predicted_pattern ?? ""}
              name="predictedPattern"
              required
            />
          </Field>
          <Field label="What is a brute-force approach?">
            <textarea
              className={textareaClass}
              defaultValue={attempt.brute_force_approach ?? ""}
              name="bruteForceApproach"
              required
            />
          </Field>
          <Field label="What runtime would brute force require?">
            <Input
              defaultValue={attempt.brute_force_complexity ?? ""}
              name="bruteForceComplexity"
              placeholder="For example: O(n²)"
              required
            />
          </Field>
          <Field label="How confident are you?">
            <Select
              defaultValue={attempt.confidence_before ?? 3}
              name="confidenceBefore"
            >
              {[1, 2, 3, 4, 5].map((value) => (
                <option key={value} value={value}>
                  {value} / 5
                </option>
              ))}
            </Select>
          </Field>
          <Button disabled={disabled} type="submit">
            Save prediction and plan{" "}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function PlanningStep({
  attempt,
  disabled,
  onAdvance,
}: {
  attempt: PracticeAttempt;
  disabled: boolean;
  onAdvance(): void;
}) {
  return (
    <Card>
      <CardContent className="p-6 sm:p-8">
        <h2 className="text-xl font-semibold">Turn the idea into steps</h2>
        <dl className="mt-5 space-y-4 text-sm">
          <div>
            <dt className="text-muted">Predicted pattern</dt>
            <dd className="mt-1 font-medium">{attempt.predicted_pattern}</dd>
          </div>
          <div>
            <dt className="text-muted">Brute force</dt>
            <dd className="mt-1 leading-6">{attempt.brute_force_approach}</dd>
          </div>
          <div>
            <dt className="text-muted">Brute-force runtime</dt>
            <dd className="mt-1 font-medium">
              {attempt.brute_force_complexity}
            </dd>
          </div>
        </dl>
        <p className="bg-primary-soft mt-6 rounded-lg border p-4 text-sm leading-6">
          State the invariant, the data you maintain, and why each update moves
          toward the answer. Say it aloud before implementation.
        </p>
        <Button className="mt-6" disabled={disabled} onClick={onAdvance}>
          Begin coding <ArrowRight aria-hidden="true" className="size-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

function CodingStep({
  code,
  disabled,
  onAdvance,
  onChange,
  onSave,
}: {
  code: string;
  disabled: boolean;
  onAdvance(): void;
  onChange(value: string): void;
  onSave(): void;
}) {
  return (
    <Card>
      <CardContent className="p-6 sm:p-8">
        <h2 className="text-xl font-semibold">Implement independently</h2>
        <p className="text-muted mt-2 text-sm leading-6">
          Work at the original source or your editor. Save a snapshot here so
          the attempt remains useful for later analysis.
        </p>
        <label
          className="mt-6 block text-sm font-semibold"
          htmlFor="codeSnapshot"
        >
          Code snapshot
        </label>
        <textarea
          className={textareaClass + " mt-2 min-h-80 font-mono"}
          id="codeSnapshot"
          onChange={(event) => onChange(event.target.value)}
          placeholder="Paste or write your current implementation..."
          value={code}
        />
        <div className="mt-5 flex flex-wrap gap-3">
          <Button disabled={disabled} onClick={onSave} variant="secondary">
            Save draft
          </Button>
          <Button
            disabled={disabled || code.trim().length === 0}
            onClick={onAdvance}
          >
            Move to testing <ArrowRight aria-hidden="true" className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function TestingStep({
  disabled,
  onAdvance,
}: {
  disabled: boolean;
  onAdvance(): void;
}) {
  return (
    <Card>
      <CardContent className="p-6 sm:p-8">
        <h2 className="text-xl font-semibold">
          Test before judging the result
        </h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {[
            "Empty or smallest valid input",
            "Duplicates and equal values",
            "Boundary indices and off-by-one cases",
            "Worst-case shape or ordering",
          ].map((item) => (
            <label
              className="bg-surface-subtle flex items-start gap-3 rounded-lg border p-4 text-sm"
              key={item}
            >
              <input className="mt-0.5" type="checkbox" /> {item}
            </label>
          ))}
        </div>
        <Button className="mt-6" disabled={disabled} onClick={onAdvance}>
          Stop timer and reflect{" "}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

function ReflectionStep({
  attempt,
  disabled,
  onSubmit,
}: {
  attempt: PracticeAttempt;
  disabled: boolean;
  onSubmit(input: Record<string, unknown>): void;
}) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onSubmit({
      complexityCorrect:
        data.get("complexityCorrect") === "unknown"
          ? null
          : data.get("complexityCorrect") === "true",
      confidenceAfter: Number(data.get("confidenceAfter")),
      correctPattern: String(data.get("correctPattern")),
      edgeCasesMissed: lines(String(data.get("edgeCasesMissed"))),
      mistakes: lines(String(data.get("mistakes"))),
      recognizedPatternCorrectly:
        data.get("recognizedPatternCorrectly") === "true",
      result: String(data.get("result")),
      spaceComplexity: String(data.get("spaceComplexity")),
      takeaway: String(data.get("takeaway")),
      timeComplexity: String(data.get("timeComplexity")),
    });
  };
  return (
    <Card>
      <CardContent className="p-6 sm:p-8">
        <h2 className="text-xl font-semibold">Log an honest reflection</h2>
        <form className="mt-6 grid gap-5 sm:grid-cols-2" onSubmit={submit}>
          <Field label="Did you solve it?">
            <Select name="result">
              <option value="solved">Solved</option>
              <option value="partial">Partially solved</option>
              <option value="failed">Not solved</option>
            </Select>
          </Field>
          <Field label="Was your predicted pattern correct?">
            <Select name="recognizedPatternCorrectly">
              <option value="true">Yes</option>
              <option value="false">No</option>
            </Select>
          </Field>
          <Field label="What was the correct pattern?">
            <Input
              defaultValue={attempt.predicted_pattern ?? ""}
              name="correctPattern"
              required
            />
          </Field>
          <Field label="How confident are you now?">
            <Select
              defaultValue={attempt.confidence_before ?? 3}
              name="confidenceAfter"
            >
              {[1, 2, 3, 4, 5].map((value) => (
                <option key={value} value={value}>
                  {value} / 5
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Optimal time complexity">
            <Input
              name="timeComplexity"
              placeholder="For example: O(n)"
              required
            />
          </Field>
          <Field label="Space complexity">
            <Input
              name="spaceComplexity"
              placeholder="For example: O(n)"
              required
            />
          </Field>
          <Field label="Is the complexity analysis correct?">
            <Select name="complexityCorrect">
              <option value="unknown">Not checked yet</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </Select>
          </Field>
          <div />
          <Field label="Biggest mistake (one per line)">
            <textarea className={textareaClass} name="mistakes" required />
          </Field>
          <Field label="Edge case missed (one per line)">
            <textarea
              className={textareaClass}
              name="edgeCasesMissed"
              required
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="What should you notice earlier next time?">
              <textarea className={textareaClass} name="takeaway" required />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Button disabled={disabled} type="submit">
              <CheckCircle2 aria-hidden="true" className="size-4" /> Complete
              attempt
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function CompletedAttempt({ attempt }: { attempt: PracticeAttempt }) {
  return (
    <div className="space-y-6">
      <div className="bg-success-soft rounded-xl border p-6 sm:p-8">
        <Badge variant="success">
          <CheckCircle2 aria-hidden="true" className="size-3.5" /> Attempt saved
        </Badge>
        <h1 className="mt-4 text-3xl font-bold">{attempt.problem.title}</h1>
        <p className="text-muted mt-2">
          Your reasoning, code snapshot, assistance, timing, and reflection are
          persisted.
        </p>
      </div>
      <Card>
        <CardContent className="p-6 sm:p-8">
          <h2 className="text-xl font-semibold">Attempt summary</h2>
          <dl className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Summary label="Result" value={attempt.result ?? "Completed"} />
            <Summary
              label="Time"
              value={formatDuration(attempt.duration_seconds)}
            />
            <Summary
              label="Help level"
              value={attempt.help_level.replaceAll("_", " ")}
            />
            <Summary
              label="Predicted pattern"
              value={attempt.predicted_pattern ?? "Not recorded"}
            />
            <Summary
              label="Correct pattern"
              value={attempt.correct_pattern ?? "Not recorded"}
            />
            <Summary
              label="Complexity"
              value={
                (attempt.submitted_time_complexity ?? "—") +
                " time · " +
                (attempt.submitted_space_complexity ?? "—") +
                " space"
              }
            />
          </dl>
          <div className="mt-6 border-t pt-5">
            <p className="text-muted text-sm">Takeaway</p>
            <p className="mt-2 leading-7">{attempt.takeaway}</p>
          </div>
          <Link className={buttonVariants()} href="/practice">
            Get next recommendation{" "}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <span className="mt-2 block">{children}</span>
    </label>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted text-xs font-semibold tracking-wide uppercase">
        {label}
      </dt>
      <dd className="mt-1 capitalize">{value}</dd>
    </div>
  );
}

function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

function lines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}
