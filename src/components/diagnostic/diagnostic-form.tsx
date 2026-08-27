"use client";

import { useActionState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import type { DiagnosticQuestion } from "@/domain/diagnostic";
import {
  beginDiagnosticAction,
  completeDiagnosticAction,
  type DiagnosticActionState,
} from "@/features/diagnostic/actions";

const initialDiagnosticActionState: DiagnosticActionState = {
  status: "idle",
};

type DiagnosticFormProps = {
  attemptId?: string;
  questions: DiagnosticQuestion[];
  stage: "coding" | "knowledge";
};

export function DiagnosticForm({
  attemptId,
  questions,
  stage,
}: DiagnosticFormProps) {
  const action =
    stage === "knowledge" ? beginDiagnosticAction : completeDiagnosticAction;
  const [state, formAction] = useActionState(
    action,
    initialDiagnosticActionState,
  );
  const grouped =
    stage === "knowledge"
      ? [
          {
            description: "Five short checks establish your concept baseline.",
            questions: questions.filter(
              (question) => question.section === "concept",
            ),
            title: "Concepts",
          },
          {
            description:
              "Choose the first approach you would investigate. These are signals, not absolute rules.",
            questions: questions.filter(
              (question) => question.section === "pattern",
            ),
            title: "Pattern recognition",
          },
        ]
      : [
          {
            description: `Your earlier answers selected ${questions.length} ${questions.length === 1 ? "problem" : "problems"}. Read each invariant carefully.`,
            questions,
            title: "Coding assessment",
          },
        ];

  return (
    <form action={formAction} className="space-y-8">
      {attemptId ? (
        <input name="attemptId" type="hidden" value={attemptId} />
      ) : null}
      {grouped.map((group) => (
        <section key={group.title}>
          <h2 className="text-xl font-semibold">{group.title}</h2>
          <p className="text-muted mt-1 text-sm leading-6">
            {group.description}
          </p>
          <div className="mt-5 space-y-4">
            {group.questions.map((question, index) => (
              <Card key={question.id}>
                <CardContent className="p-5 sm:p-6">
                  <fieldset>
                    <legend className="leading-6 font-semibold">
                      {index + 1}. {question.prompt}
                    </legend>
                    {question.description ? (
                      <p className="text-muted mt-2 text-sm leading-6">
                        {question.description}
                      </p>
                    ) : null}
                    <div className="mt-4 grid gap-3">
                      {question.options.map((option) => (
                        <label
                          className="bg-surface hover:border-primary flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm leading-6"
                          key={option.value}
                        >
                          <input
                            className="mt-1"
                            name={`answer:${question.id}`}
                            required
                            type="radio"
                            value={option.value}
                          />
                          <span>{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ))}

      {state.message ? (
        <p
          aria-live="polite"
          className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300"
        >
          {state.message}
        </p>
      ) : null}
      <SubmitButton
        className="w-full sm:w-auto"
        label={
          stage === "knowledge" ? "Continue to coding" : "Finish diagnostic"
        }
        pendingLabel={
          stage === "knowledge" ? "Adapting assessment…" : "Scoring diagnostic…"
        }
      />
    </form>
  );
}
