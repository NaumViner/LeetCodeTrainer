import { BookOpen, Route } from "lucide-react";

import { TopicCard } from "@/components/curriculum/topic-card";
import { EmptyState } from "@/components/feedback/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressBar } from "@/components/ui/progress-bar";
import { requireAuthenticatedUser } from "@/features/auth/session";
import {
  curriculumProgress,
  CURRICULUM_STAGES,
} from "@/features/curriculum/model";
import { getCurriculum } from "@/features/curriculum/queries";

export default async function LearnPage() {
  const user = await requireAuthenticatedUser();
  const topics = await getCurriculum(user.id);
  const progress = curriculumProgress(topics);

  return (
    <div className="space-y-10">
      <PageHeader
        description="Move from interview process and complexity fundamentals into core patterns and advanced problem solving."
        eyebrow="Learn"
        title="Your curriculum"
      />

      <Card>
        <CardContent className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="flex items-center gap-3">
              <div className="bg-primary-soft text-primary rounded-xl p-3">
                <Route aria-hidden="true" className="size-5" />
              </div>
              <div>
                <p className="font-semibold">Curriculum progress</p>
                <p className="text-muted text-sm">
                  {progress.completedLessons} of {progress.totalLessons} lessons
                  completed
                </p>
              </div>
            </div>
            <ProgressBar
              className="mt-5 max-w-2xl"
              label="Overall completion"
              value={progress.percent}
            />
          </div>
          <p className="text-muted text-sm">{topics.length} ordered topics</p>
        </CardContent>
      </Card>

      {topics.length === 0 ? (
        <EmptyState
          description="Curriculum metadata is not available yet. Apply the committed Supabase migrations and refresh."
          icon={<BookOpen aria-hidden="true" className="size-7" />}
          title="No active topics"
        />
      ) : (
        CURRICULUM_STAGES.map((stage) => {
          const stageTopics = topics.filter(
            (topic) => topic.stage === stage.stage,
          );

          if (stageTopics.length === 0) {
            return null;
          }

          return (
            <section key={stage.stage}>
              <div className="mb-5">
                <p className="text-primary text-sm font-semibold">
                  Stage {stage.stage}
                </p>
                <h2 className="mt-1 text-2xl font-semibold">{stage.name}</h2>
                <p className="text-muted mt-1 text-sm">{stage.description}</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {stageTopics.map((topic) => (
                  <TopicCard key={topic.id} topic={topic} />
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
