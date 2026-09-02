import {
  BriefcaseBusiness,
  Clock3,
  History,
  ShieldQuestion,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MockInterviewSetupForm } from "@/components/mock-interviews/mock-interview-setup-form";
import { PageHeader } from "@/components/ui/page-header";
import { requireAuthenticatedUser } from "@/features/auth/session";
import { recommendedInterviewDifficulty } from "@/domain/interview-recommendation";
import {
  getActiveMockInterview,
  getMockInterviewHistory,
} from "@/features/mock-interviews/queries";
import { getInterviewSelectionSetup } from "@/features/mock-interviews/selection";
import { getInterviewRolloutConfig } from "@/features/mock-interviews/rollout";
import { getProfile } from "@/features/profile/queries";

export default async function MockInterviewsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireAuthenticatedUser();
  const rollout = getInterviewRolloutConfig();
  const [profile, active, history, params, selectionSetup] = await Promise.all([
    getProfile(user.id),
    getActiveMockInterview(user.id),
    getMockInterviewHistory(user.id),
    searchParams,
    getInterviewSelectionSetup(user.id),
  ]);
  if (!profile?.onboarding_completed) redirect("/onboarding");
  if (!profile.diagnostic_completed) redirect("/diagnostic");
  if (active) redirect(`/interviews/${active.id}`);
  const { performanceProfile, ...selectionFormSetup } = selectionSetup;
  const recommendedDifficulty =
    recommendedInterviewDifficulty(performanceProfile);
  const recommendedDuration =
    performanceProfile.evaluatedInterviews < 2
      ? "30"
      : performanceProfile.allTime.overall.confidence >= 70
        ? "60"
        : "45";

  return (
    <div className="space-y-8">
      <PageHeader
        actions={
          <Link
            className={buttonVariants({ variant: "secondary" })}
            href="/interviews/history"
          >
            <History aria-hidden="true" className="size-4" /> Interview history
          </Link>
        }
        description="Practice the complete interview loop under a mandatory timer, with the topic hidden and assistance removed."
        eyebrow="Interview mode"
        title="Run a realistic mock interview"
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Card>
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <span className="bg-primary-soft text-primary rounded-xl p-3">
                <BriefcaseBusiness aria-hidden="true" className="size-5" />
              </span>
              <div>
                <h2 className="text-xl font-semibold">Session setup</h2>
                <p className="text-muted mt-2 text-sm leading-6">
                  Choose balanced coverage, interview improvement, adaptive
                  learning readiness, or an exact topic and difficulty. Every
                  option explains what evidence it uses before you start.
                </p>
              </div>
            </div>
            <MockInterviewSetupForm
              defaultCodingLanguage={codingLanguageDefault(
                profile.preferred_language,
              )}
              defaultDurationMinutes={durationDefault(params.duration)}
              defaultMode={modeDefault(params.mode)}
              recommendedDifficulty={recommendedDifficulty}
              recommendedDurationMinutes={recommendedDuration}
              selectionModesEnabled={rollout.selectionModesEnabled}
              setup={selectionFormSetup}
            />
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardContent className="p-6">
            <h2 className="font-semibold">Interview conditions</h2>
            <ul className="text-muted mt-5 space-y-4 text-sm leading-6">
              <li className="flex gap-3">
                <Clock3
                  aria-hidden="true"
                  className="text-primary mt-1 size-4 shrink-0"
                />{" "}
                Mandatory refresh-safe countdown
              </li>
              <li className="flex gap-3">
                <ShieldQuestion
                  aria-hidden="true"
                  className="text-primary mt-1 size-4 shrink-0"
                />{" "}
                Hidden topic and pattern
              </li>
              <li className="flex gap-3">
                <BriefcaseBusiness
                  aria-hidden="true"
                  className="text-primary mt-1 size-4 shrink-0"
                />{" "}
                Nine ordered interview phases
              </li>
            </ul>
            <p className="bg-surface-subtle text-muted mt-5 rounded-lg border p-3 text-xs leading-5">
              The selected interviewer level also governs the live voice
              conversation and remains fixed after the session starts.
            </p>
          </CardContent>
        </Card>
      </div>
      {history.length > 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Badge variant="success">
                  {history.length} completed or ended
                </Badge>
                <h2 className="mt-3 text-lg font-semibold">
                  Continue improving interview execution
                </h2>
              </div>
              <Link
                className={buttonVariants({ variant: "secondary" })}
                href="/interviews/history"
              >
                View history
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function scalar(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function modeDefault(value: string | string[] | undefined) {
  const candidate = scalar(value);
  return candidate === "coverage" ||
    candidate === "improvement" ||
    candidate === "learning" ||
    candidate === "custom"
    ? candidate
    : undefined;
}

function durationDefault(value: string | string[] | undefined) {
  const candidate = scalar(value);
  return candidate === "30" || candidate === "45" || candidate === "60"
    ? candidate
    : "45";
}

function codingLanguageDefault(value: string) {
  return value === "java" ? "java" : "python";
}
