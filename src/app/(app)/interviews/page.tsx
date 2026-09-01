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
import { getInterviewPerformanceProfile } from "@/features/interview-profile/queries";
import {
  getActiveMockInterview,
  getMockInterviewHistory,
} from "@/features/mock-interviews/queries";
import { getProfile } from "@/features/profile/queries";

export default async function MockInterviewsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireAuthenticatedUser();
  const [profile, active, history, params, interviewPerformance] =
    await Promise.all([
      getProfile(user.id),
      getActiveMockInterview(user.id),
      getMockInterviewHistory(user.id),
      searchParams,
      getInterviewPerformanceProfile(user.id),
    ]);
  if (!profile?.onboarding_completed) redirect("/onboarding");
  if (!profile.diagnostic_completed) redirect("/diagnostic");
  if (active) redirect(`/interviews/${active.id}`);
  const recommendedDifficulty = recommendedInterviewDifficulty(
    interviewPerformance.profile,
  );
  const recommendedDuration =
    interviewPerformance.profile.evaluatedInterviews < 2
      ? "30"
      : interviewPerformance.profile.allTime.overall.confidence >= 70
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
                  Adaptive selection uses mastery, prerequisites, recent work,
                  and failure signals. Fixed difficulty always uses the full
                  active catalog and never requires an unlock. The chosen topic
                  remains hidden until completion.
                </p>
              </div>
            </div>
            <MockInterviewSetupForm
              defaultDifficulty={difficultyDefault(params.difficulty)}
              defaultDurationMinutes={durationDefault(params.duration)}
              recommendedDifficulty={recommendedDifficulty}
              recommendedDurationMinutes={recommendedDuration}
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

function difficultyDefault(value: string | string[] | undefined) {
  const candidate = scalar(value);
  return candidate === "easy" || candidate === "medium" || candidate === "hard"
    ? candidate
    : "adaptive";
}

function durationDefault(value: string | string[] | undefined) {
  const candidate = scalar(value);
  return candidate === "30" || candidate === "45" || candidate === "60"
    ? candidate
    : "45";
}
