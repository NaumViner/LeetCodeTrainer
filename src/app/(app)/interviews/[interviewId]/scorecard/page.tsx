import { ArrowRight, CheckCircle2, Lightbulb, Target } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { requireAuthenticatedUser } from "@/features/auth/session";
import { getMockInterview } from "@/features/mock-interviews/queries";

export default async function MockInterviewScorecardPage({
  params,
}: {
  params: Promise<{ interviewId: string }>;
}) {
  const user = await requireAuthenticatedUser();
  const { interviewId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(interviewId)) notFound();
  const interview = await getMockInterview(user.id, interviewId);
  if (!interview) notFound();
  if (interview.status === "active") redirect(`/interviews/${interview.id}`);
  if (!interview.scorecard) redirect("/interviews/history");
  const scorecard = interview.scorecard;
  const criteria = [
    ["Problem understanding", scorecard.problem_understanding],
    ["Clarification", scorecard.clarification],
    ["Approach quality", scorecard.approach_quality],
    ["Optimization", scorecard.optimization],
    ["Correctness", scorecard.correctness],
    ["Code quality", scorecard.code_quality],
    ["Testing", scorecard.testing],
    ["Complexity reasoning", scorecard.complexity_reasoning],
    ["Communication", scorecard.communication],
    ["Independence", scorecard.independence],
  ] as const;
  return (
    <div className="space-y-8">
      <div className="bg-success-soft rounded-xl border p-6 sm:p-8">
        <Badge variant="success">
          <CheckCircle2 aria-hidden="true" className="size-3.5" /> Interview
          complete
        </Badge>
        <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-muted text-sm">Overall interview score</p>
            <p className="mt-1 text-6xl font-bold">
              {Math.round(scorecard.overall_score)}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-muted text-xs font-semibold tracking-wide uppercase">
              Topic revealed
            </p>
            <p className="mt-1 text-xl font-semibold">
              {interview.problem.primaryTopic.name}
            </p>
            <p className="text-muted mt-1 text-sm">{interview.problem.title}</p>
          </div>
        </div>
        <p className="text-muted mt-5 text-xs">
          Training estimate, not a prediction of interview outcome.
        </p>
      </div>
      <Card>
        <CardContent className="p-6 sm:p-8">
          <h2 className="text-xl font-semibold">Interview rubric</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {criteria.map(([label, score]) => (
              <ProgressBar
                key={label}
                label={`${label} · ${score}/5`}
                value={score * 20}
              />
            ))}
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Target aria-hidden="true" className="text-success size-5" />
              <h2 className="text-lg font-semibold">Strengths</h2>
            </div>
            {scorecard.strengths.length ? (
              <ul className="mt-4 space-y-3">
                {scorecard.strengths.map((item) => (
                  <li
                    className="bg-success-soft rounded-lg border p-3 text-sm"
                    key={item}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted mt-4 text-sm">
                No dimension reached the strong-evidence threshold yet.
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Lightbulb aria-hidden="true" className="text-primary size-5" />
              <h2 className="text-lg font-semibold">Actionable improvements</h2>
            </div>
            {scorecard.improvements.length ? (
              <ul className="mt-4 space-y-3">
                {scorecard.improvements.map((item) => (
                  <li
                    className="bg-primary-soft rounded-lg border p-3 text-sm leading-6"
                    key={item}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted mt-4 text-sm">
                No critical weakness was detected. Raise the difficulty or
                reduce time next session.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardContent className="p-6">
          <h2 className="font-semibold">Pattern reveal</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {interview.problem.pattern_tags.map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>
          <p className="text-muted mt-5 text-sm leading-6">
            Your interview evidence has updated this topic’s mastery and will
            influence later adaptive recommendations.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link className={buttonVariants()} href="/interviews">
              Start another interview{" "}
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
            <Link
              className={buttonVariants({ variant: "secondary" })}
              href="/interviews/history"
            >
              View interview history
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
