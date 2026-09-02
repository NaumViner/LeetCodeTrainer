import { ArrowRight, CheckCircle2, Lightbulb, Target } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { DeleteInterviewForm } from "@/components/mock-interviews/delete-interview-form";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { buildInterviewPerformanceProfile } from "@/domain/interview-profile";
import {
  interviewerLevelLabels,
  normalizeInterviewerLevel,
} from "@/domain/mock-interview";
import { requireAuthenticatedUser } from "@/features/auth/session";
import {
  INTERVIEW_EVALUATION_DIMENSIONS,
  interviewEvaluationDimensionLabels,
  interviewEvaluationSchema,
} from "@/features/interview-evaluation/model";
import { getInterviewPerformanceProfile } from "@/features/interview-profile/queries";
import { getMockInterview } from "@/features/mock-interviews/queries";

export default async function MockInterviewScorecardPage({
  params,
}: {
  params: Promise<{ interviewId: string }>;
}) {
  const user = await requireAuthenticatedUser();
  const { interviewId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(interviewId)) notFound();
  const interview = await getMockInterview(user.id, interviewId);
  if (!interview) notFound();
  if (interview.status === "active") redirect(`/interviews/${interview.id}`);
  if (!interview.scorecard) redirect("/interviews/history");
  const scorecard = interview.scorecard;
  const evaluation = interview.evaluation
    ? interviewEvaluationSchema.safeParse({
        confidence: interview.evaluation.confidence,
        dimensions: interview.evaluation.dimensions,
        improvements: interview.evaluation.improvements,
        rawScore: interview.evaluation.raw_score,
        recommendedActions: interview.evaluation.recommended_actions,
        recurringSignals: interview.evaluation.recurring_signals,
        strengths: interview.evaluation.strengths,
        summary: interview.evaluation.summary,
      })
    : null;
  const profileSnapshot = evaluation?.success
    ? await getInterviewPerformanceProfile(user.id)
    : null;
  const currentProfile = profileSnapshot?.profile.allTime.overall;
  const previousProfile = profileSnapshot
    ? buildInterviewPerformanceProfile(
        profileSnapshot.evidence.filter(
          (item) => item.id !== interview.evaluation?.id,
        ),
        {
          now: new Date(),
          topicIds: profileSnapshot.topics.map((topic) => topic.id),
          totalTopicCount: profileSnapshot.topics.length,
        },
      ).allTime.overall
    : null;
  const criteria = [
    ["Problem understanding", scorecard.problem_understanding],
    ["Clarification", scorecard.clarification],
    ["Approach quality", scorecard.approach_quality],
    ["Optimization", scorecard.optimization],
    ["Correctness", scorecard.correctness],
    ["Code quality", scorecard.code_quality],
    ["Testing", scorecard.testing],
    ["Complexity reasoning", scorecard.complexity_reasoning],
    ["Communication", scorecard.communication],
    ["Independence", scorecard.independence],
  ] as const;
  return (
    <div className="space-y-8">
      <div className="bg-success-soft rounded-xl border p-6 sm:p-8">
        <Badge variant="success">
          <CheckCircle2 aria-hidden="true" className="size-3.5" /> Interview
          complete
        </Badge>
        <Badge className="ml-2">
          {
            interviewerLevelLabels[
              normalizeInterviewerLevel(interview.interviewer_level)
            ]
          }
        </Badge>
        <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-muted text-sm">Overall interview score</p>
            <p className="mt-1 text-6xl font-bold">
              {Math.round(scorecard.overall_score)}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-muted text-xs font-semibold tracking-wide uppercase">
              Topic revealed
            </p>
            <p className="mt-1 text-xl font-semibold">
              {interview.problem.primaryTopic.name}
            </p>
          </div>
        </div>
        <p className="text-muted mt-5 text-xs">
          Training estimate, not a prediction of interview outcome.
        </p>
        <nav
          aria-label="Interview result views"
          className="mt-5 flex flex-wrap gap-2"
        >
          <span className={buttonVariants()}>Scorecard</span>
          <Link
            className={buttonVariants({ variant: "secondary" })}
            href={`/interviews/${interview.id}/review`}
          >
            Review interview
          </Link>
        </nav>
      </div>
      {evaluation?.success && interview.evaluation ? (
        <Card>
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="mr-2 text-xl font-semibold">
                Evidence-based evaluation
              </h2>
              <Badge
                variant={
                  interview.evaluation.status === "completed"
                    ? "success"
                    : "neutral"
                }
              >
                {interview.evaluation.status === "provisional"
                  ? "Provisional fallback"
                  : "Provider evaluated"}
              </Badge>
              <Badge>
                {Math.round(evaluation.data.confidence * 100)}% confidence
              </Badge>
            </div>
            <p className="text-muted mt-4 text-sm leading-6">
              {evaluation.data.summary}
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {INTERVIEW_EVALUATION_DIMENSIONS.map((dimension) => {
                const result = evaluation.data.dimensions[dimension];
                return (
                  <div
                    className="bg-surface-subtle rounded-lg border p-4"
                    key={dimension}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-semibold">
                        {interviewEvaluationDimensionLabels[dimension]}
                      </h3>
                      <Badge>
                        {result.score}/5 · {Math.round(result.confidence * 100)}
                        %
                      </Badge>
                    </div>
                    <p className="text-muted mt-3 text-sm leading-6">
                      {result.rationale}
                    </p>
                    <p className="text-muted mt-2 text-xs">
                      Evidence:{" "}
                      {result.evidence
                        .map((item) => item.reference)
                        .join(" · ")}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="bg-primary-soft mt-6 rounded-lg border p-4 text-sm">
              <p className="font-semibold">Profile impact</p>
              <p className="text-muted mt-1">
                {currentProfile?.adjustedScore === null || !currentProfile
                  ? "This interview did not produce usable profile evidence."
                  : previousProfile?.adjustedScore === null || !previousProfile
                    ? `Created your first interview profile at ${Math.round(currentProfile.adjustedScore)} with ${Math.round(currentProfile.confidence)}% confidence.`
                    : `Adjusted profile ${signedDelta(currentProfile.adjustedScore - previousProfile.adjustedScore)} points to ${Math.round(currentProfile.adjustedScore)}; confidence changed ${signedDelta(currentProfile.confidence - previousProfile.confidence)} points.`}
              </p>
            </div>
            <div className="mt-6">
              <h3 className="font-semibold">Direct next actions</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {evaluation.data.recommendedActions.map((action) => (
                  <Link
                    className="bg-surface-subtle hover:border-primary rounded-lg border p-4"
                    href={evaluationActionRoute(action.actionType)}
                    key={`${action.actionType}-${action.title}`}
                  >
                    <p className="font-semibold">{action.title}</p>
                    <p className="text-muted mt-1 text-xs leading-5">
                      {action.rationale} · {action.estimatedMinutes} min
                    </p>
                  </Link>
                ))}
              </div>
            </div>
            {correctnessCoverage(interview.evaluation.evidence_coverage) !==
            "trusted_tests" ? (
              <p className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                Code correctness was not verified by trusted private tests. The
                correctness score uses bounded session evidence and reduced
                confidence.
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
      <Card>
        <CardContent className="p-6 sm:p-8">
          <h2 className="text-xl font-semibold">Interview rubric</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {criteria.map(([label, score]) => (
              <ProgressBar
                key={label}
                label={`${label} · ${score}/5`}
                value={score * 20}
              />
            ))}
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Target aria-hidden="true" className="text-success size-5" />
              <h2 className="text-lg font-semibold">Strengths</h2>
            </div>
            {scorecard.strengths.length ? (
              <ul className="mt-4 space-y-3">
                {scorecard.strengths.map((item) => (
                  <li
                    className="bg-success-soft rounded-lg border p-3 text-sm"
                    key={item}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted mt-4 text-sm">
                No dimension reached the strong-evidence threshold yet.
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Lightbulb aria-hidden="true" className="text-primary size-5" />
              <h2 className="text-lg font-semibold">Actionable improvements</h2>
            </div>
            {scorecard.improvements.length ? (
              <ul className="mt-4 space-y-3">
                {scorecard.improvements.map((item) => (
                  <li
                    className="bg-primary-soft rounded-lg border p-3 text-sm leading-6"
                    key={item}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted mt-4 text-sm">
                No critical weakness was detected. Raise the difficulty or
                reduce time next session.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardContent className="p-6">
          <h2 className="font-semibold">Pattern reveal</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {interview.problem.pattern_tags.map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>
          <p className="text-muted mt-5 text-sm leading-6">
            Your interview evidence has updated this topic’s mastery and will
            influence later adaptive recommendations.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link className={buttonVariants()} href="/interviews">
              Start another interview{" "}
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
            <Link
              className={buttonVariants({ variant: "secondary" })}
              href="/interviews/history"
            >
              View interview history
            </Link>
            <Link
              className={buttonVariants({ variant: "secondary" })}
              href="/interview-profile"
            >
              Open interview profile
            </Link>
            <DeleteInterviewForm interviewId={interview.id} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function signedDelta(value: number) {
  const rounded = Math.round(value * 10) / 10;
  return `${rounded > 0 ? "+" : ""}${rounded}`;
}

function correctnessCoverage(value: unknown) {
  if (
    value &&
    typeof value === "object" &&
    "semanticCorrectness" in value &&
    value.semanticCorrectness === "trusted_tests"
  ) {
    return "trusted_tests";
  }
  return "unsupported";
}

function evaluationActionRoute(actionType: string) {
  if (actionType === "next_interview") return "/interviews";
  if (actionType === "lesson") return "/learn";
  if (actionType === "review") return "/review";
  return "/practice";
}
