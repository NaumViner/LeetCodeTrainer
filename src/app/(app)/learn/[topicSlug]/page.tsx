import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Info,
  LockKeyhole,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressBar } from "@/components/ui/progress-bar";
import { requireAuthenticatedUser } from "@/features/auth/session";
import { getCurriculum } from "@/features/curriculum/queries";

type TopicPageProps = {
  params: Promise<{ topicSlug: string }>;
};

export default async function TopicPage({ params }: TopicPageProps) {
  const { topicSlug } = await params;
  const user = await requireAuthenticatedUser();
  const curriculum = await getCurriculum(user.id);
  const topic = curriculum.find((candidate) => candidate.slug === topicSlug);

  if (!topic) {
    notFound();
  }

  const prerequisites = topic.prerequisiteTopicIds
    .map((id) => curriculum.find((candidate) => candidate.id === id))
    .filter((candidate) => candidate !== undefined);
  const firstIncomplete =
    topic.lessons.find((lesson) => !lesson.completed) ?? topic.lessons[0];

  return (
    <div className="space-y-8">
      <nav aria-label="Breadcrumb" className="text-muted text-sm">
        <Link className="hover:text-foreground" href="/learn">
          Curriculum
        </Link>
        <span aria-hidden="true" className="mx-2">
          /
        </span>
        <span>{topic.name}</span>
      </nav>

      <PageHeader
        actions={
          firstIncomplete ? (
            <Link
              className={buttonVariants()}
              href={"/learn/" + topic.slug + "/" + firstIncomplete.slug}
            >
              {firstIncomplete.completed ? "Review lesson" : "Start lesson"}
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          ) : null
        }
        description={topic.long_description}
        eyebrow={"Topic " + topic.curriculum_order}
        title={topic.name}
      />

      <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardContent className="p-6">
            <ProgressBar
              label={
                topic.completedLessons +
                " of " +
                topic.totalLessons +
                " lessons complete"
              }
              value={topic.progressPercent}
            />
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardContent className="p-6">
            <p className="text-muted text-xs font-semibold tracking-wide uppercase">
              Prerequisites
            </p>
            {prerequisites.length === 0 ? (
              <p className="mt-3 text-sm">
                You can begin this topic immediately.
              </p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                {prerequisites.map((prerequisite) => (
                  <Link
                    href={"/learn/" + prerequisite.slug}
                    key={prerequisite.id}
                  >
                    <Badge
                      variant={
                        prerequisite.progressPercent === 100
                          ? "success"
                          : "neutral"
                      }
                    >
                      {prerequisite.name}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {!topic.prerequisitesComplete ? (
        <div className="bg-primary-soft text-foreground flex gap-3 rounded-xl border p-4 text-sm">
          <Info
            aria-hidden="true"
            className="text-primary mt-0.5 size-4 shrink-0"
          />
          <p>
            You can preview this topic now. Completing its prerequisites first
            will make the lesson easier to apply independently.
          </p>
        </div>
      ) : null}

      <section>
        <h2 className="text-xl font-semibold">Lessons</h2>
        <div className="mt-4 space-y-3">
          {topic.lessons.map((lesson) => (
            <Card className="shadow-none" key={lesson.id}>
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="bg-surface-subtle mt-0.5 rounded-lg p-2">
                    {lesson.completed ? (
                      <CheckCircle2
                        aria-hidden="true"
                        className="text-success size-4"
                      />
                    ) : topic.prerequisitesComplete ? (
                      <span className="text-primary block size-4 text-center text-xs font-bold">
                        {lesson.lesson_order}
                      </span>
                    ) : (
                      <LockKeyhole
                        aria-hidden="true"
                        className="text-muted size-4"
                      />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">{lesson.title}</h3>
                    <p className="text-muted mt-1 flex items-center gap-1.5 text-sm">
                      <Clock3 aria-hidden="true" className="size-3.5" />
                      {lesson.estimated_minutes} minutes
                    </p>
                  </div>
                </div>
                <Link
                  className={buttonVariants({ variant: "secondary" })}
                  href={"/learn/" + topic.slug + "/" + lesson.slug}
                >
                  {lesson.completed ? "Review" : "Open lesson"}
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
