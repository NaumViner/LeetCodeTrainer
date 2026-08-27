import { ArrowRight, BrainCircuit, Clock3, Lightbulb } from "lucide-react";
import { redirect } from "next/navigation";

import { DifficultyBadge } from "@/components/problems/difficulty-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requireAuthenticatedUser } from "@/features/auth/session";
import { startPracticeAttemptAction } from "@/features/practice/actions";
import { getActiveAttempt } from "@/features/practice/queries";
import { getAdaptiveRecommendationSnapshot } from "@/features/practice/recommendation";
import { startReviewAttemptAction } from "@/features/reviews/actions";

type PracticePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PracticePage({
  searchParams,
}: PracticePageProps) {
  const user = await requireAuthenticatedUser();
  const activeAttempt = await getActiveAttempt(user.id);
  if (activeAttempt) redirect("/practice/" + activeAttempt.id);

  const now = new Date();
  const [snapshot, params] = await Promise.all([
    getAdaptiveRecommendationSnapshot(user.id, now),
    searchParams,
  ]);
  const { catalog, evidence, recommendation } = snapshot;
  const requestedExternalId = scalar(params.problem);
  const selected = requestedExternalId
    ? catalog.find((problem) => problem.external_id === requestedExternalId)
    : undefined;
  const problem =
    selected ??
    catalog.find((item) => item.id === recommendation?.candidate.id);

  if (!problem) {
    throw new Error("No active practice problem is available.");
  }

  return (
    <div className="space-y-8">
      <PageHeader
        description="The next problem adapts to your mastery, curriculum readiness, review urgency, recent work, and frustration signals."
        eyebrow="Adaptive practice"
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
              {!selected && recommendation ? (
                <Badge variant="success">
                  Adaptive score {Math.round(recommendation.breakdown.total)}
                </Badge>
              ) : null}
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
            <form
              action={
                !selected && evidence.dueProblemIds.has(problem.id)
                  ? startReviewAttemptAction
                  : startPracticeAttemptAction
              }
              className="mt-7"
            >
              <input name="problemId" type="hidden" value={problem.id} />
              <Button size="lg" type="submit">
                {!selected && evidence.dueProblemIds.has(problem.id)
                  ? "Start scheduled review"
                  : "Start practice attempt"}
                <ArrowRight aria-hidden="true" className="size-4" />
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardContent className="p-6">
            <h2 className="font-semibold">
              {selected ? "Practice mode" : "Why this problem"}
            </h2>
            <ul className="text-muted mt-4 space-y-4 text-sm leading-6">
              {(selected
                ? [
                    "Pattern prediction before implementation",
                    "Start, pause, reset, and refresh-safe timer",
                    "Progressive hints with automatic help tracking",
                  ]
                : (recommendation?.reasons ?? [])
              ).map((reason, index) => {
                const Icon =
                  [BrainCircuit, Clock3, Lightbulb][index] ?? BrainCircuit;
                return (
                  <li className="flex gap-3" key={reason}>
                    <Icon
                      aria-hidden="true"
                      className="text-primary mt-1 size-4 shrink-0"
                    />
                    {reason}
                  </li>
                );
              })}
            </ul>
            {!selected ? (
              <p className="bg-surface-subtle text-muted mt-5 rounded-lg border p-3 text-xs leading-5">
                Prerequisites are enforced. Recent topics, repeated problems,
                and failure streaks receive explicit penalties.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function scalar(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
