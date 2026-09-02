"use client";

import {
  AlertCircle,
  ArrowRight,
  Check,
  CircleDot,
  LockKeyhole,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { mockInterviewPhaseLabels } from "@/domain/mock-interview";
import {
  buildInterviewPhaseGuide,
  type InterviewPhaseGuideEvent,
  type InterviewPhaseGuideState,
} from "@/domain/interview-phase-guide";
import type { MockInterviewPhase } from "@/domain/mock-interview";

export function InterviewPhaseGuide({
  currentPhase,
  events,
}: {
  currentPhase: MockInterviewPhase;
  events: InterviewPhaseGuideEvent[];
}) {
  const items = buildInterviewPhaseGuide({ currentPhase, events });
  return (
    <section aria-labelledby="interview-process-guide-title">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-primary text-xs font-semibold tracking-wide uppercase">
            Guiding star
          </p>
          <h2
            className="mt-1 text-xl font-semibold"
            id="interview-process-guide-title"
          >
            Interview process guide
          </h2>
        </div>
        <p className="text-muted max-w-xl text-sm leading-6">
          This tracks your process and captured evidence. Final scoring remains
          separate on the scorecard.
        </p>
      </div>

      <ol
        aria-label="Live interview process"
        className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
      >
        {items.map((item, index) => (
          <li
            aria-current={item.state === "current" ? "step" : undefined}
            className={`rounded-xl border p-4 ${stateClassName(item.state)}`}
            data-phase-state={item.state}
            key={item.phase}
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5" aria-hidden="true">
                <StateIcon state={item.state} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">
                    {index + 1}. {mockInterviewPhaseLabels[item.phase]}
                  </h3>
                  <StateBadge state={item.state} />
                </div>
                {item.state === "current" ? (
                  <span className="sr-only">You are here.</span>
                ) : null}
                <p className="text-muted mt-2 text-sm leading-5">
                  {item.objective}
                </p>
                {item.summary ? (
                  <p className="bg-surface mt-3 rounded-lg px-3 py-2 text-sm leading-5">
                    <span className="font-semibold">Captured:</span>{" "}
                    {item.summary}
                  </p>
                ) : null}
                {item.state === "needs_confirmation" ? (
                  <p className="mt-3 text-sm font-medium">
                    The interviewer suggested this step. Use the phase action
                    below to confirm it.
                  </p>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function StateIcon({ state }: { state: InterviewPhaseGuideState }) {
  if (state === "completed") return <Check className="text-success size-5" />;
  if (state === "current") return <CircleDot className="text-primary size-5" />;
  if (state === "needs_confirmation") {
    return <AlertCircle className="text-warning size-5" />;
  }
  if (state === "suggested_next") {
    return <ArrowRight className="text-primary size-5" />;
  }
  return <LockKeyhole className="text-muted size-4" />;
}

function StateBadge({ state }: { state: InterviewPhaseGuideState }) {
  if (state === "completed") return <Badge variant="success">Completed</Badge>;
  if (state === "current") return <Badge variant="primary">You are here</Badge>;
  if (state === "needs_confirmation") {
    return <Badge variant="warning">Needs confirmation</Badge>;
  }
  if (state === "suggested_next") {
    return <Badge variant="neutral">Suggested next</Badge>;
  }
  return <Badge variant="neutral">Future</Badge>;
}

function stateClassName(state: InterviewPhaseGuideState) {
  if (state === "current") return "border-primary bg-primary-soft";
  if (state === "completed") return "border-success/30 bg-success-soft/40";
  if (state === "needs_confirmation") {
    return "border-warning/50 bg-warning/10";
  }
  return state === "future" ? "opacity-65" : "bg-surface";
}
