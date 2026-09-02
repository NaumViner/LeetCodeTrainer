import { Code2, MessageCircle, NotebookPen } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  interviewTextDirection,
  mockInterviewPhaseLabels,
  normalizeInterviewLanguage,
  type MockInterviewPhase,
} from "@/domain/mock-interview";
import { requireAuthenticatedUser } from "@/features/auth/session";
import { getLearnerVisibleQuestionContent } from "@/features/interview-evaluation/question-content";
import { getMockInterview } from "@/features/mock-interviews/queries";

export default async function MockInterviewReviewPage({
  params,
}: {
  params: Promise<{ interviewId: string }>;
}) {
  const user = await requireAuthenticatedUser();
  const { interviewId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(interviewId)) notFound();
  const interview = await getMockInterview(user.id, interviewId);
  if (!interview || interview.status !== "completed") notFound();

  const question = getLearnerVisibleQuestionContent(
    interview.problem.slug,
    interview.question_content_version,
  );
  const direction = interviewTextDirection(
    normalizeInterviewLanguage(interview.interview_language),
  );
  const phaseEvidence = [
    ["clarify", interview.clarification_notes],
    ["examples", interview.examples_notes],
    ["brute_force", interview.brute_force_notes],
    ["optimization", interview.optimization_notes],
    ["testing", interview.testing_notes],
  ] as const;
  const transcript = interview.realtimeEvents.filter((event) =>
    ["user_transcript", "assistant_transcript"].includes(event.event_type),
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-primary text-sm font-semibold">Interview review</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Mock interview ·{" "}
            {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
              new Date(interview.completed_at ?? interview.started_at),
            )}
          </h1>
          <p className="text-muted mt-2 text-sm">
            Saved work and transcript are available only after completion.
          </p>
        </div>
        <nav aria-label="Interview result views" className="flex gap-2">
          <Link
            className={buttonVariants({ variant: "secondary" })}
            href={`/interviews/${interview.id}/scorecard`}
          >
            Scorecard
          </Link>
          <span className={buttonVariants()}>Review</span>
        </nav>
      </header>

      {question ? (
        <Card>
          <CardContent className="p-6 sm:p-8" dir="ltr">
            <h2 className="text-lg font-semibold">Question</h2>
            <p className="mt-4 leading-8 whitespace-pre-wrap">
              {question.prompt}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6 sm:p-8">
            <h2 className="text-lg font-semibold">Question</h2>
            <p className="text-muted mt-3 text-sm leading-6">
              The approved prompt was not preserved for this legacy interview.
              Its saved work and transcript remain available below.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-6 sm:p-8">
          <div className="flex items-center gap-2">
            <NotebookPen aria-hidden="true" className="text-primary size-5" />
            <h2 className="text-xl font-semibold">Interview phase work</h2>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {phaseEvidence.map(([phase, content]) => (
              <section
                className="bg-surface-subtle rounded-lg border p-4"
                key={phase}
              >
                <h3 className="font-semibold">
                  {mockInterviewPhaseLabels[phase as MockInterviewPhase]}
                </h3>
                <p
                  className="text-muted mt-3 text-sm leading-6 whitespace-pre-wrap"
                  dir={direction}
                >
                  {content ?? "No written phase notes were saved."}
                </p>
              </section>
            ))}
            <section className="bg-surface-subtle rounded-lg border p-4">
              <h3 className="font-semibold">Complexity</h3>
              <p className="text-muted mt-3 text-sm leading-6">
                Time: {interview.submitted_time_complexity ?? "Not saved"}
                <br />
                Space: {interview.submitted_space_complexity ?? "Not saved"}
              </p>
            </section>
            <section className="bg-surface-subtle rounded-lg border p-4">
              <h3 className="font-semibold">Retrospective</h3>
              <p
                className="text-muted mt-3 text-sm leading-6 whitespace-pre-wrap"
                dir={direction}
              >
                {interview.retrospective ?? "No retrospective was saved."}
              </p>
            </section>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <NotebookPen aria-hidden="true" className="text-primary size-5" />
              <h2 className="text-lg font-semibold">Scratchpad</h2>
            </div>
            <pre
              className="bg-surface-subtle text-muted mt-4 max-h-96 overflow-auto rounded-lg border p-4 text-sm leading-6 whitespace-pre-wrap"
              dir={direction}
            >
              {interview.scratchpad ?? "No scratchpad notes were saved."}
            </pre>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Code2 aria-hidden="true" className="text-primary size-5" />
              <h2 className="text-lg font-semibold">Final code</h2>
              <Badge>
                {interview.coding_language === "java" ? "Java" : "Python"}
              </Badge>
            </div>
            <pre
              className="bg-surface-subtle mt-4 max-h-96 overflow-auto rounded-lg border p-4 font-mono text-xs leading-6 whitespace-pre"
              dir="ltr"
            >
              {interview.code_snapshot ?? "No code was saved."}
            </pre>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6 sm:p-8">
          <div className="flex items-center gap-2">
            <MessageCircle aria-hidden="true" className="text-primary size-5" />
            <h2 className="text-xl font-semibold">Voice transcript</h2>
            <Badge variant="primary">Post-interview record</Badge>
          </div>
          <div
            className="bg-surface-subtle mt-5 max-h-[36rem] space-y-4 overflow-y-auto rounded-xl border p-4"
            dir={direction}
          >
            {transcript.length ? (
              transcript.map((event) => (
                <div key={event.id}>
                  <p className="text-muted text-xs font-semibold uppercase">
                    {event.event_type === "user_transcript"
                      ? "You"
                      : "Interviewer"}
                    {event.phase
                      ? ` · ${mockInterviewPhaseLabels[event.phase as MockInterviewPhase]}`
                      : ""}
                  </p>
                  <p className="mt-1 text-sm leading-6 whitespace-pre-wrap">
                    {event.content}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-muted text-sm">
                No completed transcript turns were recorded.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
