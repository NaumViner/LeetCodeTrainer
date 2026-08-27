import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarDays,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  Code2,
  Dumbbell,
  RefreshCw,
  Target,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressBar } from "@/components/ui/progress-bar";
import { defaultDailyMinutes, localDateKey } from "@/domain/daily-plan";
import { readinessLevel } from "@/domain/mastery";
import { formatDuration } from "@/features/analytics/format";
import { getAnalyticsSnapshot } from "@/features/analytics/queries";
import { requireAuthenticatedUser } from "@/features/auth/session";
import { curriculumProgress } from "@/features/curriculum/model";
import { getCurriculum } from "@/features/curriculum/queries";
import { generateDailyPlanAction } from "@/features/daily-plan/actions";
import { dailyPlanProgress, getDailyPlan } from "@/features/daily-plan/queries";
import { getProfile } from "@/features/profile/queries";
import { getReviewDashboardSummary } from "@/features/reviews/queries";

export default async function DashboardPage() {
  const user = await requireAuthenticatedUser();
  const [profile, curriculum, analytics, reviews] = await Promise.all([
    getProfile(user.id),
    getCurriculum(user.id),
    getAnalyticsSnapshot(user.id),
    getReviewDashboardSummary(user.id, new Date()),
  ]);

  if (!profile?.onboarding_completed) {
    redirect("/onboarding");
  }
  const localDate = localDateKey(new Date(), profile.timezone);
  const dailyPlan = await getDailyPlan(user.id, localDate);

  const learningProgress = curriculumProgress(curriculum);
  const nextTopic =
    curriculum.find((topic) => topic.progressPercent < 100) ?? curriculum[0];
  const nextLesson =
    nextTopic?.lessons.find((lesson) => !lesson.completed) ??
    nextTopic?.lessons[0];
  const weakestTopic = analytics.topics
    .filter((topic) => topic.mastery)
    .sort(
      (left, right) =>
        left.mastery!.overall_score - right.mastery!.overall_score,
    )[0];
  const recentAttempt = analytics.attempts[0];

  const details = [
    {
      icon: Target,
      label: "Target role",
      value: profile.target_role.replaceAll("_", " "),
    },
    {
      icon: Code2,
      label: "Coding language",
      value: profile.preferred_language,
    },
    {
      icon: Clock3,
      label: "Weekly study time",
      value: `${Math.round(profile.weekly_study_minutes / 60)} hours`,
    },
    {
      icon: CalendarDays,
      label: "Interview date",
      value: profile.interview_date ?? "Not set",
    },
  ] as const;

  return (
    <div className="space-y-8">
      <PageHeader
        actions={
          <Link
            className={buttonVariants({ variant: "secondary" })}
            href="/settings/profile"
          >
            Edit profile
          </Link>
        }
        description="Continue your ordered curriculum and build each pattern from recognition to independent use."
        eyebrow="Dashboard"
        title={`Welcome${profile.display_name ? `, ${profile.display_name}` : ""}`}
      />

      <section id="today-plan">
        <Card>
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="bg-primary-soft text-primary rounded-xl p-3">
                  <CalendarCheck2 aria-hidden="true" className="size-5" />
                </div>
                <div>
                  <p className="text-primary text-sm font-semibold">
                    Today’s plan
                  </p>
                  <h2 className="mt-1 text-xl font-semibold">
                    {dailyPlan
                      ? dailyPlan.status === "completed"
                        ? "Today's preparation is complete"
                        : `${dailyPlanProgress(dailyPlan).completed} of ${dailyPlan.items.length} tasks complete`
                      : "Turn your available time into a focused plan"}
                  </h2>
                  <p className="text-muted mt-2 text-sm leading-6">
                    {dailyPlan
                      ? `${dailyPlan.items.reduce((total, item) => total + item.estimated_minutes, 0)} planned minutes across review, learning, practice, and reflection.`
                      : "Prioritize due work, continue the curriculum, practice adaptively, and finish with reflection."}
                  </p>
                </div>
              </div>
              {dailyPlan ? (
                <Link className={buttonVariants()} href="/plan">
                  Open today’s plan
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
              ) : (
                <form action={generateDailyPlanAction}>
                  <input
                    name="availableMinutes"
                    type="hidden"
                    value={defaultDailyMinutes(profile.weekly_study_minutes)}
                  />
                  <Button type="submit">
                    Generate today’s plan
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </Button>
                </form>
              )}
            </div>
            {dailyPlan ? (
              <div className="mt-6 border-t pt-5">
                <ProgressBar
                  label="Plan completion"
                  value={dailyPlanProgress(dailyPlan).percent}
                />
                <ul className="mt-5 grid gap-3 md:grid-cols-3">
                  {dailyPlan.items.slice(0, 3).map((item) => (
                    <li
                      className="bg-surface-subtle rounded-lg border p-3 text-sm"
                      key={item.id}
                    >
                      <p className="truncate font-medium">{item.title}</p>
                      <p className="text-muted mt-1 text-xs">
                        {item.estimated_minutes} min ·{" "}
                        {item.completed ? "Complete" : "Not started"}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 lg:grid-cols-2" id="readiness">
        <Card>
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-primary text-sm font-semibold">
                  Readiness estimate
                </p>
                <p className="mt-2 text-4xl font-bold">
                  {Math.round(analytics.readiness.overall)}
                </p>
                <p className="text-muted mt-1 text-sm">
                  {analytics.metrics.totalAttempts > 0
                    ? readinessLevel(analytics.readiness.overall)
                    : "Complete an attempt to establish a baseline"}
                </p>
              </div>
              <div className="bg-primary-soft text-primary rounded-xl p-3">
                <BarChart3 aria-hidden="true" className="size-5" />
              </div>
            </div>
            <ProgressBar
              className="mt-6"
              label="Core-topic evidence"
              value={analytics.readiness.coverage}
            />
            <p className="text-muted mt-4 text-xs">
              Training estimate, not a prediction of interview outcome.
            </p>
            <div className="mt-5">
              <Link
                className={buttonVariants({ variant: "secondary" })}
                href="/progress"
              >
                View progress
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 sm:p-8">
            <p className="text-primary text-sm font-semibold">
              Latest evidence
            </p>
            {recentAttempt ? (
              <>
                <h2 className="mt-2 text-xl font-semibold">
                  {recentAttempt.problem.title}
                </h2>
                <p className="text-muted mt-2 text-sm capitalize">
                  {recentAttempt.result} ·{" "}
                  {formatDuration(recentAttempt.duration_seconds)} ·{" "}
                  {recentAttempt.help_level.replaceAll("_", " ")}
                </p>
                {weakestTopic ? (
                  <p className="bg-surface-subtle mt-5 rounded-lg border p-3 text-sm">
                    Current weakest practiced topic: {weakestTopic.topic.name} (
                    {Math.round(weakestTopic.mastery!.overall_score)})
                  </p>
                ) : null}
                <div className="mt-5">
                  <Link
                    className={buttonVariants({ variant: "secondary" })}
                    href={"/history/" + recentAttempt.id}
                  >
                    Open attempt detail
                  </Link>
                </div>
              </>
            ) : (
              <>
                <h2 className="mt-2 text-xl font-semibold">
                  No completed attempts yet
                </h2>
                <p className="text-muted mt-2 text-sm leading-6">
                  Your recent attempt, weakest practiced topic, and improvement
                  evidence will appear here.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Badge variant="success">
                <CheckCircle2 aria-hidden="true" className="size-3.5" />
                Profile saved
              </Badge>
              <h2 className="mt-4 text-xl font-semibold">
                Your preparation baseline
              </h2>
              <p className="text-muted mt-2 text-sm leading-6">
                Stored securely and visible only to your authenticated account.
              </p>
            </div>
            <p className="text-muted text-sm">Timezone: {profile.timezone}</p>
          </div>
          <dl className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {details.map(({ icon: Icon, label, value }) => (
              <div
                className="bg-surface-subtle rounded-xl border p-4"
                key={label}
              >
                <Icon aria-hidden="true" className="text-primary size-4" />
                <dt className="text-muted mt-3 text-xs font-semibold tracking-wide uppercase">
                  {label}
                </dt>
                <dd className="mt-1 capitalize">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-6 border-t pt-5">
            <p className="text-sm font-medium">Target companies</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {profile.target_companies.map((company) => (
                <Badge key={company}>{company}</Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <section id="curriculum">
        <Card>
          <CardContent className="flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="bg-primary-soft text-primary rounded-xl p-3">
                <BookOpen aria-hidden="true" className="size-5" />
              </div>
              <div>
                <p className="text-primary text-sm font-semibold">
                  Continue learning
                </p>
                <h2 className="mt-1 text-xl font-semibold">
                  {nextTopic?.name ?? "Explore the curriculum"}
                </h2>
                <p className="text-muted mt-2 text-sm leading-6">
                  {nextLesson
                    ? nextLesson.title +
                      " · " +
                      nextLesson.estimated_minutes +
                      " minutes"
                    : learningProgress.completedLessons + " lessons completed"}
                </p>
                <p className="text-muted mt-1 text-xs">
                  Overall: {Math.round(learningProgress.percent)}%
                </p>
              </div>
            </div>
            <Link
              className={buttonVariants()}
              href={
                nextTopic && nextLesson
                  ? "/learn/" + nextTopic.slug + "/" + nextLesson.slug
                  : "/learn"
              }
            >
              {nextLesson ? "Open next lesson" : "View curriculum"}
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </CardContent>
        </Card>
      </section>

      <section id="practice">
        <Card>
          <CardContent className="flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="bg-primary-soft text-primary rounded-xl p-3">
                <RefreshCw aria-hidden="true" className="size-5" />
              </div>
              <div>
                <p className="text-primary text-sm font-semibold">
                  Spaced repetition
                </p>
                <h2 className="mt-1 text-xl font-semibold">
                  {reviews.dueNow > 0
                    ? `${reviews.dueNow} ${reviews.dueNow === 1 ? "review" : "reviews"} due now`
                    : reviews.total > 0
                      ? "Your next reviews are scheduled"
                      : "Build your first review queue"}
                </h2>
                <p className="text-muted mt-2 text-sm leading-6">
                  Recall the pattern before notes and adapt the next interval
                  from your result, help, confidence, time, and retention.
                </p>
              </div>
            </div>
            <Link className={buttonVariants()} href="/review">
              Open review queue
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </CardContent>
        </Card>
      </section>

      <section id="practice-recommendation">
        <Card>
          <CardContent className="flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="bg-primary-soft text-primary rounded-xl p-3">
                <Dumbbell aria-hidden="true" className="size-5" />
              </div>
              <div>
                <p className="text-primary text-sm font-semibold">
                  Practice independently
                </p>
                <h2 className="mt-1 text-xl font-semibold">
                  Get your next recommended problem
                </h2>
                <p className="text-muted mt-2 text-sm leading-6">
                  Predict the pattern, use a refresh-safe timer, request
                  progressive hints, and save a structured reflection.
                </p>
              </div>
            </div>
            <Link className={buttonVariants()} href="/practice">
              Start practice
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
