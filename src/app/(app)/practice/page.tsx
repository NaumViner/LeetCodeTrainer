import { ArrowRight, BrainCircuit, Clock3, Lightbulb } from "lucide-react";
import { redirect } from "next/navigation";

import { DifficultyBadge } from "@/components/problems/difficulty-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { recommendProblem } from "@/domain/practice";
import { requireAuthenticatedUser } from "@/features/auth/session";
import { startPracticeAttemptAction } from "@/features/practice/actions";
import {
  getActiveAttempt,
  getAttemptSummaries,
  getCompletedLessonTopicIds,
} from "@/features/practice/queries";
import { getProblemCatalog } from "@/features/problems/queries";

type PracticePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PracticePage({
  searchParams,
}: PracticePageProps) {
  const user = await requireAuthenticatedUser();
  const activeAttempt = await getActiveAttempt(user.id);
  if (activeAttempt) redirect("/practice/" + activeAttempt.id);

  const [catalog, attempts, completedTopicIds, params] = await Promise.all([
    getProblemCatalog(),
    getAttemptSummaries(user.id),
    getCompletedLessonTopicIds(user.id),
    searchParams,
  ]);
  const requestedExternalId = scalar(params.problem);
  const selected = requestedExternalId
    ? catalog.find((problem) => problem.external_id === requestedExternalId)
    : undefined;
  const recommendation = recommendProblem(
    catalog.map((problem) => ({
      curriculumLevel: problem.curriculum_level,
      datasetOrder: problem.dataset_order,
      id: problem.id,
      primaryTopicId: problem.primary_topic_id,
    })),
    attempts,
    completedTopicIds,
    user.id,
  );
  const problem =
    selected ?? catalog.find((item) => item.id === recommendation?.id);

  if (!problem) {
    throw new Error("No active practice problem is available.");
  }

  return (
    <div className="space-y-8">
      <PageHeader
        description="Work through a persisted planning, coding, testing, and reflection loop. Your session survives refreshes."
        eyebrow="Practice engine"
        title={selected ? "Selected problem" : "Recommended next problem"}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Card>
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-wrap gap-2">
              <Badge>#{problem.external_id}</Badge>
              <DifficultyBadge
                difficulty={problem.difficulty as "easy" | "hard" | "medium"}
              />
              <Badge variant="primary">{problem.primaryTopic.name}</Badge>
            </div>
            <h2 className="mt-5 text-2xl font-semibold">{problem.title}</h2>
            <p className="text-muted mt-3 leading-7">
              Predict the pattern before opening the source. The academy records
              your reasoning, assistance, elapsed time, code snapshot, and
              reflection—not the third-party prompt.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {problem.recognition_signals.slice(0, 2).map((signal) => (
                <Badge key={signal}>{signal}</Badge>
              ))}
            </div>
            <form action={startPracticeAttemptAction} className="mt-7">
              <input name="problemId" type="hidden" value={problem.id} />
              <Button size="lg" type="submit">
                Start practice attempt
                <ArrowRight aria-hidden="true" className="size-4" />
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardContent className="p-6">
            <h2 className="font-semibold">Practice mode</h2>
            <ul className="text-muted mt-4 space-y-4 text-sm leading-6">
              <li className="flex gap-3">
                <BrainCircuit
                  aria-hidden="true"
                  className="text-primary mt-1 size-4 shrink-0"
                />
                Pattern prediction before implementation
              </li>
              <li className="flex gap-3">
                <Clock3
                  aria-hidden="true"
                  className="text-primary mt-1 size-4 shrink-0"
                />
                Start, pause, reset, and refresh-safe timer
              </li>
              <li className="flex gap-3">
                <Lightbulb
                  aria-hidden="true"
                  className="text-primary mt-1 size-4 shrink-0"
                />
                Progressive hints with automatic help tracking
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function scalar(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
