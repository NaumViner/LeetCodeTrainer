import { ArrowRight, BarChart3, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import {
  diagnosticLevelLabel,
  type DiagnosticLevel,
} from "@/domain/diagnostic";
import { getAnalyticsSnapshot } from "@/features/analytics/queries";
import { requireAuthenticatedUser } from "@/features/auth/session";
import { getDiagnosticAttempt } from "@/features/diagnostic/queries";
import { getProfile } from "@/features/profile/queries";

export default async function DiagnosticResultsPage() {
  const user = await requireAuthenticatedUser();
  const [profile, attempt, analytics] = await Promise.all([
    getProfile(user.id),
    getDiagnosticAttempt(user.id),
    getAnalyticsSnapshot(user.id),
  ]);
  if (!profile?.onboarding_completed) redirect("/onboarding");
  if (!attempt || attempt.status !== "completed" || !attempt.placement_level) {
    redirect("/diagnostic");
  }

  const initializedTopics = analytics.topics.filter(
    (topic) => topic.mastery?.diagnostic_score != null,
  );
  const level = attempt.placement_level as DiagnosticLevel;
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="text-center">
        <span className="bg-success-soft text-success mx-auto flex size-12 items-center justify-center rounded-full">
          <CheckCircle2 aria-hidden="true" className="size-6" />
        </span>
        <Badge className="mt-5" variant="success">
          Diagnostic complete
        </Badge>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          Your starting level is {diagnosticLevelLabel(level).toLowerCase()}.
        </h1>
        <p className="text-muted mx-auto mt-3 max-w-2xl leading-7">
          This is a conservative starting estimate, not a permanent label.
          Lessons, independent attempts, reviews, and mock interviews will
          continuously replace it with stronger evidence.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Overall", attempt.overall_score],
          ["Concepts", attempt.concept_score],
          ["Patterns", attempt.pattern_score],
          ["Coding", attempt.coding_score],
        ].map(([label, score]) => (
          <Card key={label}>
            <CardContent className="p-5 text-center">
              <p className="text-muted text-xs font-semibold tracking-wide uppercase">
                {label}
              </p>
              <p className="mt-2 text-3xl font-bold">
                {Math.round(Number(score))}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardContent className="p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <span className="bg-primary-soft text-primary rounded-xl p-3">
              <BarChart3 aria-hidden="true" className="size-5" />
            </span>
            <div>
              <h2 className="text-xl font-semibold">Initial topic evidence</h2>
              <p className="text-muted mt-1 text-sm leading-6">
                {initializedTopics.length} topics now have a diagnostic
                baseline. Untested topics remain uncertain rather than being
                guessed.
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {initializedTopics.map(({ mastery, topic }) => (
              <ProgressBar
                key={topic.id}
                label={topic.name}
                value={mastery?.diagnostic_score ?? 0}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Link className={buttonVariants({ size: "lg" })} href="/dashboard">
          Open personalized dashboard
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </div>
  );
}
