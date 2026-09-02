"use client";

import { AlertCircle, Check, CircleDot, LockKeyhole } from "lucide-react";

import { mockInterviewPhaseLabels } from "@/domain/mock-interview";
import {
  buildInterviewPhaseGuide,
  type InterviewPhaseGuideEvent,
  type InterviewPhaseGuideState,
} from "@/domain/interview-phase-guide";
import type { MockInterviewPhase } from "@/domain/mock-interview";

export function InterviewPhaseGuide({
  currentPhase,
  events = [],
}: {
  currentPhase: MockInterviewPhase;
  events?: InterviewPhaseGuideEvent[];
}) {
  const items = buildInterviewPhaseGuide({ currentPhase, events });
  return (
    <section aria-labelledby="interview-process-guide-title">
      <h2
        className="text-primary text-xs font-semibold tracking-wide uppercase"
        id="interview-process-guide-title"
      >
        Guiding star
      </h2>
      <ol
        aria-label="Live interview process"
        className="mt-3 flex gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-5 lg:grid-cols-9"
      >
        {items.map((item) => (
          <li
            aria-current={item.state === "current" ? "step" : undefined}
            className={`flex min-h-12 min-w-28 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-center text-xs font-semibold sm:min-w-0 ${stateClassName(item.state)}`}
            data-phase-state={item.state}
            key={item.phase}
          >
            <StateIcon state={item.state} />
            <span>{mockInterviewPhaseLabels[item.phase]}</span>
            <span className="sr-only">{stateLabel(item.state)}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function StateIcon({ state }: { state: InterviewPhaseGuideState }) {
  const className = "size-3.5 shrink-0";
  if (state === "completed") {
    return <Check aria-hidden="true" className={`${className} text-success`} />;
  }
  if (state === "current") {
    return (
      <CircleDot aria-hidden="true" className={`${className} text-primary`} />
    );
  }
  if (state === "needs_confirmation") {
    return (
      <AlertCircle aria-hidden="true" className={`${className} text-warning`} />
    );
  }
  return (
    <LockKeyhole aria-hidden="true" className={`${className} text-muted`} />
  );
}

function stateLabel(state: InterviewPhaseGuideState) {
  if (state === "completed") return "Completed";
  if (state === "current") return "Current step";
  if (state === "needs_confirmation") return "Needs confirmation";
  if (state === "suggested_next") return "Suggested next";
  return "Future step";
}

function stateClassName(state: InterviewPhaseGuideState) {
  if (state === "current") return "border-primary bg-primary-soft";
  if (state === "completed") return "border-success/30 bg-success-soft/40";
  if (state === "needs_confirmation") {
    return "border-warning/50 bg-warning/10";
  }
  return state === "future" ? "opacity-65" : "bg-surface";
}
