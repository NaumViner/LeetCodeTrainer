import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Code2,
  Target,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requireAuthenticatedUser } from "@/features/auth/session";
import { curriculumProgress } from "@/features/curriculum/model";
import { getCurriculum } from "@/features/curriculum/queries";
import { getProfile } from "@/features/profile/queries";

export default async function DashboardPage() {
  const user = await requireAuthenticatedUser();
  const [profile, curriculum] = await Promise.all([
    getProfile(user.id),
    getCurriculum(user.id),
  ]);

  if (!profile?.onboarding_completed) {
    redirect("/onboarding");
  }

  const learningProgress = curriculumProgress(curriculum);
  const nextTopic =
    curriculum.find((topic) => topic.progressPercent < 100) ?? curriculum[0];
  const nextLesson =
    nextTopic?.lessons.find((lesson) => !lesson.completed) ??
    nextTopic?.lessons[0];

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
    </div>
  );
}
