import {
  ArrowRight,
  BriefcaseBusiness,
  Clock3,
  History,
  ShieldQuestion,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/form-field";
import { PageHeader } from "@/components/ui/page-header";
import { requireAuthenticatedUser } from "@/features/auth/session";
import { startMockInterviewAction } from "@/features/mock-interviews/actions";
import {
  getActiveMockInterview,
  getMockInterviewHistory,
} from "@/features/mock-interviews/queries";
import { getProfile } from "@/features/profile/queries";

export default async function MockInterviewsPage() {
  const user = await requireAuthenticatedUser();
  const [profile, active, history] = await Promise.all([
    getProfile(user.id),
    getActiveMockInterview(user.id),
    getMockInterviewHistory(user.id),
  ]);
  if (!profile?.onboarding_completed) redirect("/onboarding");
  if (!profile.diagnostic_completed) redirect("/diagnostic");
  if (active) redirect(`/interviews/${active.id}`);

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
                  and failure signals. The chosen topic remains hidden until
                  completion.
                </p>
              </div>
            </div>
            <form
              action={startMockInterviewAction}
              className="mt-7 grid gap-5 sm:grid-cols-2"
            >
              <label className="text-sm font-semibold">
                Duration
                <Select
                  className="mt-2"
                  defaultValue="45"
                  name="durationMinutes"
                >
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">60 minutes</option>
                </Select>
              </label>
              <label className="text-sm font-semibold">
                Difficulty
                <Select
                  className="mt-2"
                  defaultValue="adaptive"
                  name="difficulty"
                >
                  <option value="adaptive">Adaptive</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </Select>
              </label>
              <div className="sm:col-span-2">
                <Button size="lg" type="submit">
                  Start mock interview{" "}
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Button>
              </div>
            </form>
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
              This phase is text and code. Voice interaction arrives after the
              realtime provider foundation.
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
