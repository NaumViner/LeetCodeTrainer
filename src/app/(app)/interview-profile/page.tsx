import { Activity, ArrowRight, BriefcaseBusiness, Target } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/feedback/empty-state";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressBar } from "@/components/ui/progress-bar";
import { requireAuthenticatedUser } from "@/features/auth/session";
import { getInterviewPerformanceProfile } from "@/features/interview-profile/queries";
import {
  INTERVIEW_EVALUATION_DIMENSIONS,
  interviewEvaluationDimensionLabels,
} from "@/features/interview-evaluation/model";

export default async function InterviewProfilePage() {
  const user = await requireAuthenticatedUser();
  const { evidence, profile, topics } = await getInterviewPerformanceProfile(
    user.id,
  );
  const overall = profile.allTime.overall;
  const topicById = new Map(topics.map((topic) => [topic.id, topic]));
  const coveredTopics = Object.entries(profile.allTime.topics)
    .filter(([, metric]) => metric.adjustedScore !== null)
    .sort((left, right) => left[1].adjustedScore! - right[1].adjustedScore!);

  return (
    <div className="space-y-8">
      <PageHeader
        actions={
          <Link className={buttonVariants()} href="/interviews">
            Run interview <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        }
        description="A dedicated view of observed interview execution. Learning mastery remains separate on Progress."
        eyebrow="Interview profile"
        title="Your interview performance"
      />

      {overall.adjustedScore === null ? (
        <EmptyState
          action={
            <Link className={buttonVariants()} href="/interviews">
              Start first interview
            </Link>
          }
          description="Complete an interview to create a provisional or provider-evaluated performance baseline."
          icon={<BriefcaseBusiness aria-hidden="true" className="size-7" />}
          title="No evaluated interviews yet"
        />
      ) : (
        <>
          <div className="grid gap-5 md:grid-cols-3">
            <Card>
              <CardContent className="p-6">
                <p className="text-muted text-sm">Challenge-adjusted score</p>
                <p className="mt-2 text-5xl font-bold">
                  {Math.round(overall.adjustedScore)}
                </p>
                <Badge className="mt-3" variant="primary">
                  {overall.level}
                </Badge>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-muted text-sm">Profile confidence</p>
                <p className="mt-2 text-5xl font-bold">
                  {Math.round(overall.confidence)}%
                </p>
                <p className="text-muted mt-3 text-xs">
                  {overall.sampleSize} evaluated interviews · raw average{" "}
                  {Math.round(overall.rawScore ?? 0)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-muted text-sm">Recent trend</p>
                <p className="mt-2 text-3xl font-bold capitalize">
                  {overall.trend.direction}
                </p>
                <p className="text-muted mt-3 text-xs">
                  {overall.trend.delta === null
                    ? "At least four interviews are required."
                    : `${overall.trend.delta > 0 ? "+" : ""}${overall.trend.delta} adjusted points`}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <Activity aria-hidden="true" className="text-primary size-5" />
                <h2 className="text-xl font-semibold">Interview dimensions</h2>
              </div>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                {INTERVIEW_EVALUATION_DIMENSIONS.map((dimension) => {
                  const metric = profile.allTime.dimensions[dimension];
                  return (
                    <ProgressBar
                      key={dimension}
                      label={`${interviewEvaluationDimensionLabels[dimension]} · ${Math.round(metric.confidence)}% confidence`}
                      value={metric.adjustedScore ?? 0}
                    />
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold">
                Recent performance windows
              </h2>
              <div className="mt-5 grid gap-5 sm:grid-cols-3">
                <ProgressBar
                  label={`Last 30 days · ${profile.last30Days.overall.sampleSize} sessions`}
                  value={profile.last30Days.overall.adjustedScore ?? 0}
                />
                <ProgressBar
                  label={`Last 90 days · ${profile.last90Days.overall.sampleSize} sessions`}
                  value={profile.last90Days.overall.adjustedScore ?? 0}
                />
                <ProgressBar
                  label={`All time · ${profile.allTime.overall.sampleSize} sessions`}
                  value={profile.allTime.overall.adjustedScore ?? 0}
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold">By difficulty</h2>
                <div className="mt-5 space-y-5">
                  {(["easy", "medium", "hard"] as const).map((difficulty) => {
                    const metric = profile.allTime.difficulties[difficulty];
                    return (
                      <ProgressBar
                        key={difficulty}
                        label={`${difficulty} · ${metric.sampleSize} sessions · ${Math.round(metric.confidence)}% confidence`}
                        value={metric.adjustedScore ?? 0}
                      />
                    );
                  })}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold">By interviewer level</h2>
                <div className="mt-5 space-y-5">
                  {(["beginner", "faang_tough"] as const).map((level) => {
                    const metric = profile.allTime.interviewerLevels[level];
                    return (
                      <ProgressBar
                        key={level}
                        label={`${level === "faang_tough" ? "Tough FAANG" : "Beginner"} · ${metric.sampleSize} sessions · ${Math.round(metric.confidence)}% confidence`}
                        value={metric.adjustedScore ?? 0}
                      />
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Target aria-hidden="true" className="text-primary size-5" />
                <h2 className="text-lg font-semibold">Topic evidence</h2>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {coveredTopics.map(([topicId, metric]) => (
                  <div
                    className="bg-surface-subtle rounded-lg border p-4"
                    key={topicId}
                  >
                    <p className="font-medium">
                      {topicById.get(topicId)?.name ?? "Interview topic"}
                    </p>
                    <p className="text-muted mt-1 text-sm">
                      {Math.round(metric.adjustedScore ?? 0)} ·{" "}
                      {Math.round(metric.confidence)}% confidence ·{" "}
                      {metric.sampleSize} sessions
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold">Evidence coverage</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge>
                    {
                      evidence.filter((item) => item.evidenceCoverage.hasCode)
                        .length
                    }{" "}
                    with code
                  </Badge>
                  <Badge>
                    {
                      evidence.filter(
                        (item) => item.evidenceCoverage.transcriptTurns > 0,
                      ).length
                    }{" "}
                    with transcript
                  </Badge>
                  <Badge>
                    {
                      evidence.filter(
                        (item) => item.evidenceCoverage.phaseTimingCount > 0,
                      ).length
                    }{" "}
                    with phase timing
                  </Badge>
                  <Badge variant="neutral">
                    {
                      evidence.filter(
                        (item) => item.evidenceCoverage.hasTrustedTests,
                      ).length
                    }{" "}
                    with trusted tests
                  </Badge>
                </div>
                <p className="text-muted mt-4 text-xs leading-5">
                  Confidence also accounts for recency, breadth, consistency,
                  and evaluator confidence.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold">
                  Strengths and priorities
                </h2>
                <p className="text-muted mt-4 text-sm leading-6">
                  Strongest:{" "}
                  {profile.strongestDimensions.length
                    ? profile.strongestDimensions
                        .map(
                          (dimension) =>
                            interviewEvaluationDimensionLabels[dimension],
                        )
                        .join(", ")
                    : "More evidence needed"}
                </p>
                <p className="text-muted mt-2 text-sm leading-6">
                  Priorities:{" "}
                  {profile.weakestDimensions.length
                    ? profile.weakestDimensions
                        .map(
                          (dimension) =>
                            interviewEvaluationDimensionLabels[dimension],
                        )
                        .join(", ")
                    : "Complete an evaluated interview"}
                </p>
              </CardContent>
            </Card>
          </div>

          {profile.recurringSignals.length > 0 ? (
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold">Recurring signals</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {profile.recurringSignals.map((item) => (
                    <Badge key={item.signal}>
                      {item.signal} · {item.count}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  Recommended next actions
                </h2>
                <p className="text-muted mt-2 text-sm leading-6">
                  Remediate the lowest-confidence dimension, then verify it in
                  the next interview. Supporting evidence remains available in
                  interview history.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link className={buttonVariants()} href="/practice">
                  Open targeted actions
                </Link>
                <Link
                  className={buttonVariants({ variant: "secondary" })}
                  href="/interviews/history"
                >
                  Supporting interviews
                </Link>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
