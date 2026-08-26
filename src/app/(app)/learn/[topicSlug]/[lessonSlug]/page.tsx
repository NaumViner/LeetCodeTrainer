import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  Lightbulb,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CompleteLessonButton } from "@/components/curriculum/complete-lesson-button";
import { LessonBody } from "@/components/curriculum/lesson-body";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requireAuthenticatedUser } from "@/features/auth/session";
import { readLessonContent } from "@/features/curriculum/content";
import { getCurriculum } from "@/features/curriculum/queries";

type LessonPageProps = {
  params: Promise<{ lessonSlug: string; topicSlug: string }>;
};

export default async function LessonPage({ params }: LessonPageProps) {
  const { lessonSlug, topicSlug } = await params;
  const user = await requireAuthenticatedUser();
  const curriculum = await getCurriculum(user.id);
  const topic = curriculum.find((candidate) => candidate.slug === topicSlug);
  const lesson = topic?.lessons.find(
    (candidate) => candidate.slug === lessonSlug,
  );

  if (!topic || !lesson) {
    notFound();
  }

  const content = await readLessonContent(lesson.content_path);
  const topicIndex = curriculum.findIndex(
    (candidate) => candidate.id === topic.id,
  );
  const lessonIndex = topic.lessons.findIndex(
    (candidate) => candidate.id === lesson.id,
  );
  const nextInTopic = topic.lessons[lessonIndex + 1];
  const nextTopic = curriculum[topicIndex + 1];
  const nextLesson = nextInTopic ?? nextTopic?.lessons[0];
  const nextLessonTopic = nextInTopic ? topic : nextTopic;

  return (
    <div className="space-y-8">
      <nav aria-label="Breadcrumb" className="text-muted text-sm">
        <Link className="hover:text-foreground" href="/learn">
          Curriculum
        </Link>
        <span aria-hidden="true" className="mx-2">
          /
        </span>
        <Link className="hover:text-foreground" href={"/learn/" + topic.slug}>
          {topic.name}
        </Link>
        <span aria-hidden="true" className="mx-2">
          /
        </span>
        <span>{lesson.title}</span>
      </nav>

      <PageHeader
        actions={
          <Badge>
            <Clock3 aria-hidden="true" className="size-3.5" />
            {lesson.estimated_minutes} min
          </Badge>
        }
        description={topic.short_description}
        eyebrow={topic.name}
        title={lesson.title}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_19rem]">
        <Card>
          <CardContent className="p-6 sm:p-9">
            <LessonBody content={content} />
          </CardContent>
        </Card>

        <aside className="space-y-4">
          <Card className="shadow-none">
            <CardContent className="p-5">
              <h2 className="flex items-center gap-2 font-semibold">
                <Check aria-hidden="true" className="text-primary size-4" />
                Learning objectives
              </h2>
              <ul className="text-muted mt-3 space-y-2 text-sm leading-6">
                {lesson.learning_objectives.map((objective) => (
                  <li key={objective}>• {objective}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent className="p-5">
              <h2 className="flex items-center gap-2 font-semibold">
                <Lightbulb aria-hidden="true" className="text-primary size-4" />
                Recognition signals
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {lesson.recognition_signals.map((signal) => (
                  <Badge key={signal}>{signal}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent className="p-5">
              <h2 className="flex items-center gap-2 font-semibold">
                <TriangleAlert
                  aria-hidden="true"
                  className="text-warning size-4"
                />
                Common mistakes
              </h2>
              <ul className="text-muted mt-3 space-y-2 text-sm leading-6">
                {lesson.common_mistakes.map((mistake) => (
                  <li key={mistake}>• {mistake}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </aside>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">Lesson checkpoint</h2>
            <p className="text-muted mt-1 text-sm">
              Mark this lesson complete when you can explain the core invariant
              without looking at the template.
            </p>
          </div>
          <CompleteLessonButton
            completed={lesson.completed}
            lessonId={lesson.id}
          />
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
        <Link
          className={buttonVariants({ variant: "ghost" })}
          href={"/learn/" + topic.slug}
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Back to {topic.name}
        </Link>
        {nextLesson && nextLessonTopic ? (
          <Link
            className={buttonVariants({ variant: "secondary" })}
            href={"/learn/" + nextLessonTopic.slug + "/" + nextLesson.slug}
          >
            Next: {nextLesson.title}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        ) : (
          <Link className={buttonVariants()} href="/learn">
            Curriculum complete
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
