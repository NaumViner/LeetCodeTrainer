import {
  Activity,
  BriefcaseBusiness,
  BrainCircuit,
  Clock3,
  Gauge,
  HelpCircle,
  Target,
} from "lucide-react";
import Link from "next/link";

import { MetricCard } from "@/components/analytics/metric-card";
import { ReadinessRadarChart } from "@/components/analytics/readiness-radar-chart";
import { TopicMasteryChart } from "@/components/analytics/topic-mastery-chart";
import { EmptyState } from "@/components/feedback/empty-state";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressBar } from "@/components/ui/progress-bar";
import { readinessLevel } from "@/domain/mastery";
import { getAnalyticsSnapshot } from "@/features/analytics/queries";
import { requireAuthenticatedUser } from "@/features/auth/session";

export default async function ProgressPage() {
  const user = await requireAuthenticatedUser();
  const analytics = await getAnalyticsSnapshot(user.id);
  const readinessDimensions = [
    { label: "Core patterns", value: analytics.readiness.corePatterns },
    { label: "Independence", value: analytics.readiness.independentSolving },
    { label: "Recognition", value: analytics.readiness.recognition },
    { label: "Retention", value: analytics.readiness.retention },
    { label: "Timed", value: analytics.readiness.timedPerformance },
    { label: "Complexity", value: analytics.readiness.complexity },
  ];
  const practicedTopics = analytics.topics
    .filter((item) => item.mastery)
    .map(({ mastery, topic }) => ({
      href: `/learn/${topic.slug}`,
      name: topic.name,
      value: mastery?.overall_score ?? 0,
    }))
    .sort((left, right) => right.value - left.value);

  return (
    <div className="space-y-8">
      <PageHeader
        actions={
          <Link className={buttonVariants()} href="/practice">
            Continue practice
          </Link>
        }
        description="Understand the evidence behind your current preparation and where the next attempt can help most."
        eyebrow="Analytics"
        title="Progress and readiness"
      />

      {analytics.topics.every((topic) => !topic.mastery) ? (
        <EmptyState
          action={
            <Link className={buttonVariants()} href="/practice">
              Start first attempt
            </Link>
          }
          description="Complete a structured practice attempt to create your first real performance and mastery snapshot."
          icon={<Activity aria-hidden="true" className="size-7" />}
          title="No performance evidence yet"
        />
      ) : (
        <>
          <Card>
            <CardContent className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[13rem_minmax(15rem,20rem)_minmax(0,1fr)] lg:items-center">
              <div>
                <p className="text-muted text-sm">Overall readiness</p>
                <p className="mt-2 text-6xl font-bold tracking-tight">
                  {Math.round(analytics.readiness.overall)}
                </p>
                <Badge className="mt-3" variant="primary">
                  {readinessLevel(analytics.readiness.overall)}
                </Badge>
                <p className="text-muted mt-4 text-xs leading-5">
                  Training estimate, not a prediction of interview outcome.
                  Coverage: {analytics.readiness.coverage}% of core topics.
                </p>
              </div>
              <ReadinessRadarChart dimensions={readinessDimensions} />
              <div className="grid gap-5 sm:grid-cols-2">
                <ProgressBar
                  label="Core patterns"
                  value={analytics.readiness.corePatterns}
                />
                <ProgressBar
                  label="Independent solving"
                  value={analytics.readiness.independentSolving}
                />
                <ProgressBar
                  label="Recognition"
                  value={analytics.readiness.recognition}
                />
                <ProgressBar
                  label="Retention evidence"
                  value={analytics.readiness.retention}
                />
                <ProgressBar
                  label="Timed performance"
                  value={analytics.readiness.timedPerformance}
                />
                <ProgressBar
                  label="Complexity"
                  value={analytics.readiness.complexity}
                />
                <div className="sm:col-span-2">
                  {analytics.readiness.interviewExecution === null ? (
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium">Interview execution</span>
                      <Link
                        className="text-primary font-semibold"
                        href="/interviews"
                      >
                        Run first mock interview
                      </Link>
                    </div>
                  ) : (
                    <ProgressBar
                      label="Interview execution"
                      value={analytics.readiness.interviewExecution}
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              icon={<Target className="size-5" />}
              label="Attempts"
              value={String(analytics.metrics.totalAttempts)}
            />
            <MetricCard
              icon={<BrainCircuit className="size-5" />}
              label="Independent solve rate"
              value={`${analytics.metrics.independentSolveRate}%`}
            />
            <MetricCard
              icon={<Clock3 className="size-5" />}
              label="Median solve time"
              value={formatMinutes(analytics.metrics.medianDurationSeconds)}
            />
            <MetricCard
              icon={<HelpCircle className="size-5" />}
              label="Help usage"
              value={`${analytics.metrics.helpUsageRate}%`}
            />
            <MetricCard
              icon={<Gauge className="size-5" />}
              label="Recognition accuracy"
              value={`${analytics.metrics.patternAccuracy}%`}
            />
            <MetricCard
              icon={<BriefcaseBusiness className="size-5" />}
              label="Mock interviews"
              value={String(analytics.mockInterviewCount)}
            />
            <MetricCard
              label="Complexity accuracy"
              note="Excludes unchecked reflections"
              value={`${analytics.metrics.complexityAccuracy}%`}
            />
            <MetricCard
              label="Average solve time"
              value={formatMinutes(analytics.metrics.averageDurationSeconds)}
            />
            <MetricCard
              label="Repeat improvement"
              note="Available after repeating a problem"
              value={
                analytics.metrics.repeatImprovement === null
                  ? "Not measured"
                  : `${analytics.metrics.repeatImprovement > 0 ? "+" : ""}${analytics.metrics.repeatImprovement} pts`
              }
            />
          </div>

          {analytics.metrics.repeatedMistakes.length > 0 ? (
            <Card className="shadow-none">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold">Repeated mistakes</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {analytics.metrics.repeatedMistakes.map((item) => (
                    <Badge key={item.mistake}>
                      {item.mistake} · {item.count}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card className="shadow-none">
            <CardContent className="p-6 sm:p-8">
              <TopicMasteryChart items={practicedTopics} />
            </CardContent>
          </Card>

          <section aria-labelledby="topic-mastery">
            <div className="mb-4">
              <h2 className="text-xl font-semibold" id="topic-mastery">
                Topic mastery
              </h2>
              <p className="text-muted mt-1 text-sm">
                Whole-number presentation avoids false precision while the
                stored model retains reproducible scores.
              </p>
            </div>
            <Card className="overflow-hidden shadow-none">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-left text-sm">
                  <caption className="sr-only">
                    Detailed topic mastery scores, attempts, and review status
                  </caption>
                  <thead className="bg-surface-subtle text-muted text-xs tracking-wide uppercase">
                    <tr>
                      {[
                        "Topic",
                        "Mastery",
                        "Recognition",
                        "Independence",
                        "Retention",
                        "Attempts",
                        "Next review",
                        "Status",
                      ].map((label) => (
                        <th className="px-4 py-3" key={label}>
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {analytics.topics.map(({ mastery, topic }) => (
                      <tr key={topic.id}>
                        <td className="px-4 py-4 font-medium">
                          <Link
                            className="text-primary"
                            href={`/learn/${topic.slug}`}
                          >
                            {topic.name}
                          </Link>
                        </td>
                        <td className="px-4 py-4">
                          {score(mastery?.overall_score)}
                        </td>
                        <td className="px-4 py-4">
                          {score(mastery?.recognition_score)}
                        </td>
                        <td className="px-4 py-4">
                          {score(mastery?.independence_score)}
                        </td>
                        <td className="px-4 py-4">
                          {score(mastery?.retention_score)}
                        </td>
                        <td className="px-4 py-4">
                          {mastery?.total_attempts ?? 0}
                        </td>
                        <td className="text-muted px-4 py-4">Not scheduled</td>
                        <td className="px-4 py-4">
                          <Badge variant={mastery ? "primary" : "neutral"}>
                            {mastery
                              ? readinessLevel(mastery.overall_score)
                              : "No evidence"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </section>
        </>
      )}
    </div>
  );
}

function score(value: number | undefined) {
  return value === undefined ? "—" : Math.round(value);
}

function formatMinutes(seconds: number) {
  if (seconds === 0) return "—";
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return minutes > 0 ? `${minutes}m ${remainder}s` : `${remainder}s`;
}
