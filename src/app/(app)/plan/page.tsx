import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  CalendarCheck2,
  CheckCircle2,
  ClipboardCheck,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressBar } from "@/components/ui/progress-bar";
import { defaultDailyMinutes, localDateKey } from "@/domain/daily-plan";
import { requireAuthenticatedUser } from "@/features/auth/session";
import {
  generateDailyPlanAction,
  setDailyPlanItemCompletedAction,
} from "@/features/daily-plan/actions";
import {
  dailyPlanProgress,
  getDailyPlan,
  type DailyPlanItemRow,
} from "@/features/daily-plan/queries";
import { getProfile } from "@/features/profile/queries";

export default async function PlanPage() {
  const user = await requireAuthenticatedUser();
  const profile = await getProfile(user.id);
  if (!profile?.onboarding_completed) redirect("/onboarding");
  if (!profile.diagnostic_completed) redirect("/diagnostic");
  const localDate = localDateKey(new Date(), profile.timezone);
  const plan = await getDailyPlan(user.id, localDate);
  const defaultMinutes =
    plan?.available_minutes ??
    defaultDailyMinutes(profile.weekly_study_minutes);

  return (
    <div className="space-y-8">
      <PageHeader
        actions={
          <Link
            className={buttonVariants({ variant: "secondary" })}
            href="/dashboard"
          >
            Dashboard
          </Link>
        }
        description="A focused 3–6 task schedule built from your due reviews, curriculum, adaptive practice evidence, recent workload, and interview date."
        eyebrow="Daily preparation"
        title="Today's plan"
      />

      {!plan ? (
        <Card>
          <CardContent className="flex flex-col items-center px-6 py-12 text-center">
            <CalendarCheck2
              aria-hidden="true"
              className="text-primary size-8"
            />
            <h2 className="mt-4 text-xl font-semibold">
              Build your focused day
            </h2>
            <p className="text-muted mt-2 max-w-lg text-sm leading-6">
              Your weekly study target suggests {defaultMinutes} minutes today.
              Adjust it if today is different.
            </p>
            <PlanGenerationForm
              className="mt-6"
              defaultMinutes={defaultMinutes}
              label="Generate today's plan"
            />
          </CardContent>
        </Card>
      ) : (
        <PlanDetails plan={plan} />
      )}
    </div>
  );
}

function PlanDetails({
  plan,
}: {
  plan: NonNullable<Awaited<ReturnType<typeof getDailyPlan>>>;
}) {
  const progress = dailyPlanProgress(plan);
  const plannedMinutes = plan.items.reduce(
    (total, item) => total + item.estimated_minutes,
    0,
  );
  return (
    <>
      <Card>
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={plan.status === "completed" ? "success" : "primary"}
                >
                  {plan.status === "completed" ? "Day complete" : "Active plan"}
                </Badge>
                <Badge>Version {plan.generation}</Badge>
              </div>
              <h2 className="mt-4 text-2xl font-semibold">
                {formatLocalDate(plan.local_date)} · {plannedMinutes} planned
                minutes
              </h2>
              <p className="text-muted mt-2 text-sm">
                {progress.completed} of {progress.total} tasks completed
              </p>
            </div>
            <PlanGenerationForm
              defaultMinutes={plan.available_minutes}
              label="Regenerate plan"
            />
          </div>
          <ProgressBar
            className="mt-6"
            label="Today's completion"
            value={progress.percent}
          />
        </CardContent>
      </Card>

      <ol className="space-y-4">
        {plan.items.map((item) => (
          <PlanItem item={item} key={item.id} />
        ))}
      </ol>
    </>
  );
}

function PlanItem({ item }: { item: DailyPlanItemRow }) {
  const Icon =
    item.type === "lesson"
      ? BookOpen
      : item.type === "review_problem" || item.type === "review_card"
        ? RefreshCw
        : item.type === "reflection"
          ? ClipboardCheck
          : BrainCircuit;
  return (
    <li>
      <Card className={item.completed ? "bg-success-soft" : undefined}>
        <CardContent className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <span className="bg-primary-soft text-primary rounded-xl p-3">
              <Icon aria-hidden="true" className="size-5" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="capitalize">
                  {item.type.replaceAll("_", " ")}
                </Badge>
                <span className="text-muted text-xs">
                  {item.estimated_minutes} min
                </span>
              </div>
              <h2 className="mt-2 font-semibold">{item.title}</h2>
              <p className="text-muted mt-1 text-sm leading-6">{item.reason}</p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
            <Link
              className={buttonVariants({ variant: "secondary" })}
              href={item.action_path}
            >
              Open <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
            <form action={setDailyPlanItemCompletedAction}>
              <input name="itemId" type="hidden" value={item.id} />
              <input
                name="completed"
                type="hidden"
                value={item.completed ? "false" : "true"}
              />
              <Button
                type="submit"
                variant={item.completed ? "ghost" : "primary"}
              >
                <CheckCircle2 aria-hidden="true" className="size-4" />
                {item.completed ? "Reopen" : "Mark complete"}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </li>
  );
}

function PlanGenerationForm({
  className,
  defaultMinutes,
  label,
}: {
  className?: string;
  defaultMinutes: number;
  label: string;
}) {
  const options = [
    ...new Set([defaultMinutes, 30, 45, 60, 75, 90, 120, 150, 180, 240]),
  ].sort((left, right) => left - right);
  return (
    <form action={generateDailyPlanAction} className={className}>
      <label className="text-muted block text-left text-xs font-semibold">
        Available today
        <select
          className="bg-surface text-foreground mt-1.5 block w-full rounded-lg border px-3 py-2 text-sm"
          defaultValue={defaultMinutes}
          name="availableMinutes"
        >
          {options.map((minutes) => (
            <option key={minutes} value={minutes}>
              {minutes} minutes
            </option>
          ))}
        </select>
      </label>
      <Button className="mt-3 w-full" type="submit" variant="secondary">
        <RefreshCw aria-hidden="true" className="size-4" /> {label}
      </Button>
    </form>
  );
}

function formatLocalDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00.000Z`));
}
