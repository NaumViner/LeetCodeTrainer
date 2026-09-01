import { BriefcaseBusiness, Clock3 } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/feedback/empty-state";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import {
  interviewerLevelLabels,
  normalizeInterviewerLevel,
} from "@/domain/mock-interview";
import { requireAuthenticatedUser } from "@/features/auth/session";
import { getMockInterviewHistory } from "@/features/mock-interviews/queries";

export default async function MockInterviewHistoryPage() {
  const user = await requireAuthenticatedUser();
  const history = await getMockInterviewHistory(user.id);
  return (
    <div className="space-y-8">
      <PageHeader
        actions={
          <Link className={buttonVariants()} href="/interviews">
            New mock interview
          </Link>
        }
        description="Review scorecards, revealed topics, timing, and recurring execution weaknesses."
        eyebrow="Interview mode"
        title="Mock interview history"
      />
      {history.length === 0 ? (
        <EmptyState
          action={
            <Link className={buttonVariants()} href="/interviews">
              Start first interview
            </Link>
          }
          description="Completed and ended sessions will appear here with their scorecards."
          icon={<BriefcaseBusiness aria-hidden="true" className="size-7" />}
          title="No mock interviews yet"
        />
      ) : (
        <div className="grid gap-4">
          {history.map((interview) => (
            <Card key={interview.id}>
              <CardContent className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant={
                        interview.status === "completed" ? "success" : "neutral"
                      }
                    >
                      {interview.status}
                    </Badge>
                    <Badge className="capitalize">
                      {interview.problem.difficulty}
                    </Badge>
                    <Badge>
                      {
                        interviewerLevelLabels[
                          normalizeInterviewerLevel(interview.interviewer_level)
                        ]
                      }
                    </Badge>
                    {interview.evaluation ? (
                      <Badge
                        variant={
                          interview.evaluation.status === "completed"
                            ? "success"
                            : "neutral"
                        }
                      >
                        {interview.evaluation.status === "provisional"
                          ? "Provisional evaluation"
                          : "Evaluated"}
                        {interview.evaluation.raw_score === null
                          ? ""
                          : ` · ${Math.round(interview.evaluation.raw_score)}`}
                      </Badge>
                    ) : null}
                  </div>
                  <h2 className="mt-3 text-lg font-semibold">
                    {interview.problem.title}
                  </h2>
                  <p className="text-muted mt-1 text-sm">
                    {interview.status === "completed"
                      ? interview.problem.primaryTopic.name
                      : "Topic remained hidden"}{" "}
                    ·{" "}
                    {new Intl.DateTimeFormat("en", {
                      dateStyle: "medium",
                    }).format(new Date(interview.started_at))}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-muted flex items-center gap-2 text-sm">
                    <Clock3 aria-hidden="true" className="size-4" />{" "}
                    {formatMinutes(interview.elapsed_seconds)}
                  </p>
                  {interview.scorecard ? (
                    <Link
                      className={buttonVariants({ variant: "secondary" })}
                      href={`/interviews/${interview.id}/scorecard`}
                    >
                      Scorecard ·{" "}
                      {Math.round(interview.scorecard.overall_score)}
                    </Link>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function formatMinutes(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}m ${remainder}s`;
}
