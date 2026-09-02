"use client";

import { BookOpenText, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import type { LearnerVisibleQuestionContent } from "@/features/interview-evaluation/evidence-model";

export function InterviewQuestionPanel({
  canonicalUrl,
  content,
  difficulty,
  remainingLabel,
  title,
}: {
  canonicalUrl: string;
  content: LearnerVisibleQuestionContent | null;
  difficulty: string;
  remainingLabel: string;
  title: string;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <details
      className="bg-surface group top-4 z-20 rounded-xl border shadow-sm lg:sticky"
      onToggle={(event) => setExpanded(event.currentTarget.open)}
      open={expanded}
    >
      <summary className="hover:bg-surface-subtle flex cursor-pointer list-none items-center justify-between gap-4 rounded-xl px-5 py-4 [&::-webkit-details-marker]:hidden">
        <span className="flex min-w-0 items-center gap-3">
          <BookOpenText
            aria-hidden="true"
            className="text-primary size-5 shrink-0"
          />
          <span className="min-w-0">
            <span className="block text-xs font-semibold tracking-wide uppercase">
              Interview prompt
            </span>
            <span className="block truncate text-sm font-semibold">
              {title}
            </span>
          </span>
        </span>
        <span className="flex shrink-0 flex-wrap justify-end gap-2">
          <Badge className="capitalize">{difficulty}</Badge>
          <Badge variant="primary">{remainingLabel}</Badge>
          <span className="text-muted text-xs font-semibold group-open:hidden sm:inline">
            Show question
          </span>
          <span className="text-muted hidden text-xs font-semibold group-open:inline">
            Hide
          </span>
        </span>
      </summary>

      <div className="border-t px-5 py-5 sm:px-6" dir="ltr">
        {content ? (
          <div className="space-y-5">
            <p className="text-sm leading-7 whitespace-pre-wrap">
              {content.prompt}
            </p>

            {content.examples.length > 0 ? (
              <section aria-labelledby="interview-question-examples">
                <h2
                  className="text-sm font-semibold"
                  id="interview-question-examples"
                >
                  Public examples
                </h2>
                <div className="mt-3 grid gap-3 lg:grid-cols-2">
                  {content.examples.map((example, index) => (
                    <div
                      className="bg-surface-subtle min-w-0 rounded-lg border p-4"
                      key={`${example.input}-${example.output}`}
                    >
                      <p className="text-muted text-xs font-semibold uppercase">
                        Example {index + 1}
                      </p>
                      <pre className="mt-2 overflow-x-auto font-mono text-xs leading-6 whitespace-pre-wrap">
                        Input: {example.input}
                        {"\n"}Output: {example.output}
                      </pre>
                      {example.explanation ? (
                        <p className="text-muted mt-2 text-xs leading-5">
                          {example.explanation}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {content.constraints.length > 0 ? (
              <section aria-labelledby="interview-question-constraints">
                <h2
                  className="text-sm font-semibold"
                  id="interview-question-constraints"
                >
                  Constraints
                </h2>
                <ul className="text-muted mt-2 list-disc space-y-1 pl-5 font-mono text-xs leading-5">
                  {content.constraints.map((constraint) => (
                    <li key={constraint}>{constraint}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            <p className="text-muted text-xs">
              First-party interview prompt · version {content.contentVersion}
            </p>
          </div>
        ) : (
          <p className="text-muted text-sm leading-6">
            The embedded interview prompt is unavailable for this session. Use
            the external reference below.
          </p>
        )}

        <div className="mt-5 border-t pt-4">
          <Link
            className={buttonVariants({ size: "sm", variant: "secondary" })}
            href={canonicalUrl}
            rel="noreferrer"
            target="_blank"
          >
            View external reference
            <ExternalLink aria-hidden="true" className="size-4" />
          </Link>
          <p className="text-muted mt-2 text-xs">
            The external source remains separate from any embedded approved
            prompt.
          </p>
        </div>
      </div>
    </details>
  );
}
