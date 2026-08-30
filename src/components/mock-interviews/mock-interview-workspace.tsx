"use client";

import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  ExternalLink,
  ShieldQuestion,
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/form-field";
import {
  MOCK_INTERVIEW_PHASES,
  mockInterviewPhaseLabels,
  type MockInterviewPhase,
} from "@/domain/mock-interview";
import {
  abandonMockInterviewAction,
  advanceMockInterviewAction,
  completeMockInterviewAction,
} from "@/features/mock-interviews/actions";
import type { RealtimeContextUpdate } from "@/components/mock-interviews/realtime-interview-panel";
import type { RealtimeTranscriptEntry } from "@/features/realtime-interviews/model";

const RealtimeInterviewPanel = dynamic(() =>
  import("@/components/mock-interviews/realtime-interview-panel").then(
    (module) => module.RealtimeInterviewPanel,
  ),
);

type InterviewWorkspaceInput = {
  difficultyMode: string;
  durationMinutes: number;
  effectiveElapsedSeconds: number;
  id: string;
  realtimeEnabled: boolean;
  realtimeTranscript: RealtimeTranscriptEntry[];
  phase: MockInterviewPhase;
  problem: {
    canonicalUrl: string;
    difficulty: string;
    externalId: string;
    title: string;
  };
  startedAt: string;
  timerRunning: boolean;
};

const textareaClass =
  "bg-surface placeholder:text-muted/70 focus:border-primary min-h-36 w-full rounded-lg border px-3 py-2.5 text-sm leading-6 shadow-sm outline-none";

export function MockInterviewWorkspace({
  interview,
}: {
  interview: InterviewWorkspaceInput;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState(interview.phase);
  const [seconds, setSeconds] = useState(interview.effectiveElapsedSeconds);
  const [running, setRunning] = useState(interview.timerRunning);
  const [message, setMessage] = useState("");
  const [realtimeContext, setRealtimeContext] =
    useState<RealtimeContextUpdate | null>(null);
  const [isPending, runAction] = useTransition();

  const authoritativeElapsedSeconds = () =>
    Math.min(
      14_400,
      Math.max(
        seconds,
        Math.floor(
          (Date.now() - new Date(interview.startedAt).getTime()) / 1_000,
        ),
      ),
    );

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(
      () => setSeconds((current) => Math.min(14_400, current + 1)),
      1_000,
    );
    return () => window.clearInterval(timer);
  }, [running]);

  const advance = (input: {
    notes?: string;
    spaceComplexity?: string;
    timeComplexity?: string;
  }) => {
    const index = MOCK_INTERVIEW_PHASES.indexOf(phase);
    const target = MOCK_INTERVIEW_PHASES[index + 1];
    if (!target || target === "completed") return;
    const sourcePhase = phase;
    setMessage("");
    runAction(async () => {
      const result = await advanceMockInterviewAction(interview.id, {
        elapsedSeconds: authoritativeElapsedSeconds(),
        targetPhase: target,
        ...input,
      });
      if (result.status === "error") {
        setMessage(result.message);
        return;
      }
      const submittedContent =
        input.notes ??
        [input.timeComplexity, input.spaceComplexity]
          .filter(Boolean)
          .join(" time; ") + (input.spaceComplexity ? " space" : "");
      const content =
        submittedContent.trim() ||
        `Learner completed ${sourcePhase} and entered ${target}.`;
      setRealtimeContext({
        content,
        eventType:
          sourcePhase === "implementation" ? "code_snapshot" : "phase_context",
        id: crypto.randomUUID(),
        phase: sourcePhase,
      });
      setPhase(target);
      if (target === "retrospective") setRunning(false);
    });
  };

  const complete = (input: Record<string, unknown>) => {
    setMessage("");
    runAction(async () => {
      const result = await completeMockInterviewAction(interview.id, {
        ...input,
        elapsedSeconds: authoritativeElapsedSeconds(),
      });
      if (result.status === "error") {
        setMessage(result.message);
        return;
      }
      router.push(`/interviews/${interview.id}/scorecard`);
      router.refresh();
    });
  };

  const targetSeconds = interview.durationMinutes * 60;
  const remaining = targetSeconds - seconds;
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-primary text-sm font-semibold">Mock interview</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            {interview.problem.title}
          </h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge>#{interview.problem.externalId}</Badge>
            <Badge className="capitalize">{interview.problem.difficulty}</Badge>
            <Badge variant="primary">
              <ShieldQuestion aria-hidden="true" className="size-3.5" />
              Topic hidden
            </Badge>
            <Badge>Hints disabled</Badge>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div
            aria-live="polite"
            className={`rounded-xl border px-4 py-3 ${remaining < 0 ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300" : "bg-surface"}`}
          >
            <p className="flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
              <Clock3 aria-hidden="true" className="size-4" />
              {remaining < 0 ? "Overtime" : "Time remaining"}
            </p>
            <p className="mt-1 font-mono text-xl font-bold">
              {formatClock(Math.abs(remaining))}
            </p>
          </div>
          <Link
            className={buttonVariants({ variant: "secondary" })}
            href={interview.problem.canonicalUrl}
            rel="noreferrer"
            target="_blank"
          >
            Open prompt <ExternalLink aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </header>

      <ol
        className="flex gap-2 overflow-x-auto pb-1"
        aria-label="Interview phases"
      >
        {MOCK_INTERVIEW_PHASES.slice(0, -1).map((item, index) => {
          const currentIndex = MOCK_INTERVIEW_PHASES.indexOf(phase);
          return (
            <li
              className={`min-w-fit rounded-full border px-3 py-1.5 text-xs font-semibold ${index === currentIndex ? "bg-primary text-white" : index < currentIndex ? "bg-success-soft text-success" : "text-muted"}`}
              key={item}
            >
              {index + 1}. {mockInterviewPhaseLabels[item]}
            </li>
          );
        })}
      </ol>

      {interview.realtimeEnabled ? (
        <RealtimeInterviewPanel
          contextUpdate={realtimeContext}
          initialTranscript={interview.realtimeTranscript}
          interviewId={interview.id}
          phase={phase}
        />
      ) : null}

      {message ? (
        <p
          aria-live="polite"
          className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300"
        >
          {message}
        </p>
      ) : null}

      <InterviewPhase
        disabled={isPending}
        onAdvance={advance}
        onComplete={complete}
        phase={phase}
      />

      <Card className="shadow-none">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <BriefcaseBusiness
              aria-hidden="true"
              className="text-primary mt-0.5 size-5"
            />
            <div>
              <p className="font-semibold">Realistic constraints</p>
              <p className="text-muted mt-1 text-sm">
                The timer cannot be paused. The topic and pattern stay hidden
                until the scorecard.
              </p>
            </div>
          </div>
          <form action={abandonMockInterviewAction}>
            <input name="interviewId" type="hidden" value={interview.id} />
            <Button type="submit" variant="ghost">
              End interview
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function InterviewPhase({
  disabled,
  onAdvance,
  onComplete,
  phase,
}: {
  disabled: boolean;
  onAdvance(input: {
    notes?: string;
    spaceComplexity?: string;
    timeComplexity?: string;
  }): void;
  onComplete(input: Record<string, unknown>): void;
  phase: MockInterviewPhase;
}) {
  if (phase === "intro") {
    return (
      <Card>
        <CardContent className="p-6 sm:p-8">
          <h2 className="text-xl font-semibold">Interview briefing</h2>
          <p className="text-muted mt-3 max-w-2xl leading-7">
            Treat the external prompt as if the interviewer just presented it.
            Explain your reasoning in each stage, write code in the
            implementation stage, and resist jumping ahead. The scorecard uses
            the evidence you record here.
          </p>
          <Button
            className="mt-6"
            disabled={disabled}
            onClick={() => onAdvance({})}
          >
            Begin clarification{" "}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }
  if (phase === "retrospective") {
    return <Retrospective disabled={disabled} onComplete={onComplete} />;
  }
  if (phase === "complexity") {
    return <ComplexityStep disabled={disabled} onAdvance={onAdvance} />;
  }
  if (phase === "completed") return null;

  const content: Record<
    Exclude<
      MockInterviewPhase,
      "completed" | "complexity" | "intro" | "retrospective"
    >,
    {
      button: string;
      description: string;
      label: string;
      placeholder: string;
      title: string;
    }
  > = {
    brute_force: {
      button: "Continue to optimization",
      description:
        "State the straightforward baseline, why it is correct, and its bottleneck.",
      label: "Brute-force reasoning",
      placeholder:
        "Outline the baseline algorithm, invariant, and time/space cost…",
      title: "Establish a correct baseline",
    },
    clarify: {
      button: "Continue to examples",
      description:
        "Ask about constraints, invalid input, duplicates, ordering, and expected output.",
      label: "Clarifying questions and assumptions",
      placeholder: "What would you ask the interviewer before solving?",
      title: "Clarify before proposing an approach",
    },
    examples: {
      button: "Continue to brute force",
      description:
        "Walk through normal, minimal, and boundary examples to confirm understanding.",
      label: "Examples and expected behavior",
      placeholder:
        "Record examples, outputs, and any edge behavior they expose…",
      title: "Validate the problem with examples",
    },
    implementation: {
      button: "Move to testing",
      description:
        "Implement the optimized plan. Keep the code aligned with the invariant you stated.",
      label: "Code snapshot",
      placeholder: "Write your implementation here…",
      title: "Implement independently",
    },
    optimization: {
      button: "Begin implementation",
      description:
        "Remove repeated work, name the maintained state, and explain tradeoffs.",
      label: "Optimized approach and invariant",
      placeholder: "Explain the optimized algorithm before coding…",
      title: "Optimize deliberately",
    },
    testing: {
      button: "Continue to complexity",
      description:
        "Trace the implementation against normal, boundary, and adversarial cases.",
      label: "Tests and traces",
      placeholder: "List cases and trace important state transitions…",
      title: "Test before declaring success",
    },
  };
  const copy = content[phase];
  return (
    <NotesStep
      button={copy.button}
      description={copy.description}
      disabled={disabled}
      label={copy.label}
      onAdvance={onAdvance}
      placeholder={copy.placeholder}
      title={copy.title}
    />
  );
}

function NotesStep({
  button,
  description,
  disabled,
  label,
  onAdvance,
  placeholder,
  title,
}: {
  button: string;
  description: string;
  disabled: boolean;
  label: string;
  onAdvance(input: { notes: string }): void;
  placeholder: string;
  title: string;
}) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onAdvance({ notes: String(data.get("notes")) });
  };
  return (
    <Card>
      <CardContent className="p-6 sm:p-8">
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-muted mt-2 text-sm leading-6">{description}</p>
        <form className="mt-6" onSubmit={submit}>
          <label className="block text-sm font-semibold">
            {label}
            <textarea
              className={`${textareaClass} mt-2 ${label === "Code snapshot" ? "min-h-96 font-mono" : ""}`}
              name="notes"
              placeholder={placeholder}
              required
            />
          </label>
          <Button className="mt-5" disabled={disabled} type="submit">
            {button} <ArrowRight aria-hidden="true" className="size-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ComplexityStep({
  disabled,
  onAdvance,
}: {
  disabled: boolean;
  onAdvance(input: { spaceComplexity: string; timeComplexity: string }): void;
}) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onAdvance({
      spaceComplexity: String(data.get("spaceComplexity")),
      timeComplexity: String(data.get("timeComplexity")),
    });
  };
  return (
    <Card>
      <CardContent className="p-6 sm:p-8">
        <h2 className="text-xl font-semibold">Analyze complexity</h2>
        <p className="text-muted mt-2 text-sm leading-6">
          Derive the bounds from executed operations and retained state.
        </p>
        <form className="mt-6 grid gap-5 sm:grid-cols-2" onSubmit={submit}>
          <Field label="Time complexity">
            <Input
              name="timeComplexity"
              placeholder="For example: O(n log n)"
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
          <div className="sm:col-span-2">
            <Button disabled={disabled} type="submit">
              Stop timer and reflect{" "}
              <ArrowRight aria-hidden="true" className="size-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function Retrospective({
  disabled,
  onComplete,
}: {
  disabled: boolean;
  onComplete(input: Record<string, unknown>): void;
}) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onComplete({
      codeQualityRating: Number(data.get("codeQualityRating")),
      communicationRating: Number(data.get("communicationRating")),
      complexityRating: Number(data.get("complexityRating")),
      independenceRating: Number(data.get("independenceRating")),
      result: String(data.get("result")),
      retrospective: String(data.get("retrospective")),
    });
  };
  return (
    <Card>
      <CardContent className="p-6 sm:p-8">
        <Badge variant="success">
          <Clock3 aria-hidden="true" className="size-3.5" /> Timer stopped
        </Badge>
        <h2 className="mt-4 text-xl font-semibold">
          Complete the retrospective
        </h2>
        <p className="text-muted mt-2 text-sm leading-6">
          Rate the dimensions that still require your judgment. Evidence from
          earlier phases scores the rest.
        </p>
        <form className="mt-6 grid gap-5 sm:grid-cols-2" onSubmit={submit}>
          <Field label="Outcome">
            <Select name="result">
              <option value="solved">Solved</option>
              <option value="partial">Partially solved</option>
              <option value="failed">Not solved</option>
            </Select>
          </Field>
          <RatingField label="Code quality" name="codeQualityRating" />
          <RatingField label="Complexity confidence" name="complexityRating" />
          <RatingField label="Communication" name="communicationRating" />
          <RatingField label="Independence" name="independenceRating" />
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold">
              What went well, what broke down, and what will you change?
              <textarea
                className={`${textareaClass} mt-2`}
                name="retrospective"
                required
              />
            </label>
          </div>
          <div className="sm:col-span-2">
            <Button disabled={disabled} type="submit">
              <CheckCircle2 aria-hidden="true" className="size-4" /> Generate
              scorecard
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function RatingField({ label, name }: { label: string; name: string }) {
  return (
    <Field label={label}>
      <Select defaultValue="3" name={name}>
        {[1, 2, 3, 4, 5].map((value) => (
          <option key={value} value={value}>
            {value} / 5
          </option>
        ))}
      </Select>
    </Field>
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

function formatClock(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
