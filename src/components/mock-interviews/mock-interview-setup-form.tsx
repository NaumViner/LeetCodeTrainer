"use client";

import { ArrowRight } from "lucide-react";
import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/form-field";
import { startMockInterviewAction } from "@/features/mock-interviews/actions";
import { initialMockInterviewStartActionState } from "@/features/mock-interviews/schema";

export function MockInterviewSetupForm({
  defaultDifficulty = "adaptive",
  defaultDurationMinutes = "45",
  recommendedDifficulty = "easy",
  recommendedDurationMinutes = "30",
}: {
  defaultDifficulty?: "adaptive" | "easy" | "hard" | "medium";
  defaultDurationMinutes?: "30" | "45" | "60";
  recommendedDifficulty?: "easy" | "hard" | "medium";
  recommendedDurationMinutes?: "30" | "45" | "60";
}) {
  const [state, formAction, pending] = useActionState(
    startMockInterviewAction,
    initialMockInterviewStartActionState,
  );
  const [selectedDifficulty, setSelectedDifficulty] =
    useState(defaultDifficulty);
  const aboveRecommendation =
    selectedDifficulty !== "adaptive" &&
    ["easy", "medium", "hard"].indexOf(selectedDifficulty) >
      ["easy", "medium", "hard"].indexOf(recommendedDifficulty);

  return (
    <>
      <div className="bg-primary-soft mt-6 rounded-lg border p-4 text-sm">
        <p className="font-semibold">Recommended</p>
        <p className="text-muted mt-1 capitalize">
          {recommendedDifficulty} · {recommendedDurationMinutes} minutes
        </p>
        <p className="text-muted mt-1 text-xs leading-5">
          Based on evaluated interview coverage and confidence. This is
          guidance, not an unlock requirement.
        </p>
      </div>
      <form action={formAction} className="mt-5 grid gap-5 sm:grid-cols-2">
        <h3 className="text-base font-semibold sm:col-span-2">
          Your selection
        </h3>
        <label className="text-sm font-semibold">
          Duration
          <Select
            className="mt-2"
            defaultValue={defaultDurationMinutes}
            name="durationMinutes"
          >
            <option value="30">30 minutes</option>
            <option value="45">45 minutes</option>
            <option value="60">60 minutes</option>
          </Select>
        </label>
        <label className="text-sm font-semibold">
          Difficulty
          <Select
            className="mt-2"
            defaultValue={defaultDifficulty}
            name="difficulty"
            onChange={(event) =>
              setSelectedDifficulty(
                event.target.value as typeof selectedDifficulty,
              )
            }
          >
            <option value="adaptive">Adaptive</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </Select>
        </label>
        <label className="text-sm font-semibold sm:col-span-2">
          Interview language
          <Select className="mt-2" defaultValue="auto" name="interviewLanguage">
            <option value="auto">Automatic — follow the learner</option>
            <option value="english">English</option>
            <option value="hebrew">עברית (Hebrew)</option>
          </Select>
          <span className="text-muted mt-1 block text-xs leading-5 font-normal">
            This controls the conversation language, not the programming
            language or source code.
          </span>
        </label>
        <fieldset className="sm:col-span-2">
          <legend className="text-sm font-semibold">Interviewer level</legend>
          <p className="text-muted mt-1 text-xs leading-5">
            This choice controls live interviewer behavior for the entire
            session.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="bg-surface hover:border-primary flex cursor-pointer items-start gap-3 rounded-xl border p-4">
              <input
                className="mt-1"
                defaultChecked
                name="interviewerLevel"
                required
                type="radio"
                value="beginner"
              />
              <span>
                <span className="block text-sm font-semibold">
                  Beginner interviewer
                </span>
                <span className="text-muted mt-1 block text-xs leading-5">
                  Restrained guidance and gentle redirection when you get stuck.
                </span>
              </span>
            </label>
            <label className="bg-surface hover:border-primary flex cursor-pointer items-start gap-3 rounded-xl border p-4">
              <input
                className="mt-1"
                name="interviewerLevel"
                required
                type="radio"
                value="faang_tough"
              />
              <span>
                <span className="block text-sm font-semibold">
                  Tough FAANG interviewer
                </span>
                <span className="text-muted mt-1 block text-xs leading-5">
                  Cold evaluation, zero hints, no validation, and bug-revealing
                  dry runs.
                </span>
              </span>
            </label>
          </div>
        </fieldset>
        {state.message ? (
          <p
            aria-live="polite"
            className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2 dark:bg-red-950/40 dark:text-red-300"
            role="alert"
          >
            {state.message}
          </p>
        ) : null}
        {aboveRecommendation ? (
          <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 sm:col-span-2 dark:bg-amber-950/30 dark:text-amber-200">
            This is above the current recommendation and may produce
            lower-confidence evidence. You can still start it.
          </p>
        ) : null}
        <div className="sm:col-span-2">
          <Button disabled={pending} size="lg" type="submit">
            {pending ? "Starting interview…" : "Start mock interview"}
            {!pending ? (
              <ArrowRight aria-hidden="true" className="size-4" />
            ) : null}
          </Button>
        </div>
      </form>
    </>
  );
}
