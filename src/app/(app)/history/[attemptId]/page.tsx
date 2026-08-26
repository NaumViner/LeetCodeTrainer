import { ArrowLeft, Clock3, ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DifficultyBadge } from "@/components/problems/difficulty-badge";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressBar } from "@/components/ui/progress-bar";
import { formatDate, formatDuration } from "@/features/analytics/format";
import { getAttemptDetail } from "@/features/analytics/queries";
import { requireAuthenticatedUser } from "@/features/auth/session";

export default async function AttemptDetailPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const user = await requireAuthenticatedUser();
  const { attemptId } = await params;
  const detail = await getAttemptDetail(user.id, attemptId);
  if (!detail) notFound();
  const { attempt, previousAttempts } = detail;

  return (
    <div className="space-y-8">
      <nav aria-label="Breadcrumb" className="text-muted text-sm">
        <Link className="hover:text-foreground" href="/history">
          History
        </Link>
        <span aria-hidden="true" className="mx-2">
          /
        </span>
        <span>{formatDate(attempt.completed_at)}</span>
      </nav>
      <PageHeader
        actions={
          <a
            className={buttonVariants({ variant: "secondary" })}
            href={attempt.problem.external_url ?? "#"}
            rel="noreferrer"
            target="_blank"
          >
            Open source <ExternalLink aria-hidden="true" className="size-4" />
          </a>
        }
        description="A durable record of the reasoning, assistance, implementation, and reflection from this attempt."
        eyebrow={`Attempt · ${formatDate(attempt.completed_at)}`}
        title={attempt.problem.title}
      />
      <div className="flex flex-wrap gap-2">
        <Badge>#{attempt.problem.external_id}</Badge>
        <DifficultyBadge
          difficulty={attempt.problem.difficulty as "easy" | "medium" | "hard"}
        />
        <Badge variant="primary">{attempt.problem.primaryTopic.name}</Badge>
        <Badge
          variant={
            attempt.result === "solved"
              ? "success"
              : attempt.result === "partial"
                ? "warning"
                : "danger"
          }
        >
          {attempt.result}
        </Badge>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <h2 className="font-semibold">Attempt facts</h2>
            <dl className="mt-5 space-y-4 text-sm">
              <Fact
                label="Duration"
                value={formatDuration(attempt.duration_seconds)}
              />
              <Fact label="Mode" value={attempt.mode} />
              <Fact
                label="Help"
                value={attempt.help_level.replaceAll("_", " ")}
              />
              <Fact
                label="Pattern accuracy"
                value={
                  attempt.recognized_pattern_correctly ? "Correct" : "Missed"
                }
              />
              <Fact label="Next review" value="Not scheduled yet" />
            </dl>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <h2 className="font-semibold">Performance snapshot</h2>
            {attempt.performance ? (
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <ProgressBar
                  label="Correctness"
                  value={attempt.performance.correctness_score * 100}
                />
                <ProgressBar
                  label="Independence"
                  value={attempt.performance.independence_score * 100}
                />
                <ProgressBar
                  label="Recognition"
                  value={attempt.performance.recognition_score * 100}
                />
                <ProgressBar
                  label="Retention evidence"
                  value={attempt.performance.retention_score * 100}
                />
                <ProgressBar
                  label="Complexity"
                  value={attempt.performance.complexity_score * 100}
                />
                <ProgressBar
                  label="Speed"
                  value={attempt.performance.speed_score * 100}
                />
              </div>
            ) : (
              <p className="text-muted mt-4 text-sm">
                No performance snapshot is available.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <h2 className="font-semibold">Reasoning</h2>
            <dl className="mt-5 space-y-4 text-sm">
              <Fact
                label="Predicted pattern"
                value={attempt.predicted_pattern ?? "—"}
              />
              <Fact
                label="Correct pattern"
                value={attempt.correct_pattern ?? "—"}
              />
              <Fact
                label="Brute-force approach"
                value={attempt.brute_force_approach ?? "—"}
              />
              <Fact
                label="Brute-force complexity"
                value={attempt.brute_force_complexity ?? "—"}
              />
              <Fact
                label="Submitted complexity"
                value={`${attempt.submitted_time_complexity ?? "—"} time · ${attempt.submitted_space_complexity ?? "—"} space`}
              />
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <h2 className="font-semibold">Reflection</h2>
            <section className="mt-5">
              <p className="text-muted text-xs font-semibold tracking-wide uppercase">
                Takeaway
              </p>
              <p className="mt-2 leading-7">{attempt.takeaway}</p>
            </section>
            <List title="Mistakes" values={attempt.mistakes} />
            <List
              title="Missed edge cases"
              values={attempt.edge_cases_missed}
            />
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-none">
        <CardContent className="p-6">
          <h2 className="flex items-center gap-2 font-semibold">
            <Clock3 aria-hidden="true" className="text-primary size-4" />
            Previous attempts on this problem
          </h2>
          {previousAttempts.length === 0 ? (
            <p className="text-muted mt-4 text-sm">
              This was your first completed attempt.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {previousAttempts.map((previous) => (
                <Link
                  className="bg-surface-subtle flex items-center justify-between rounded-lg border p-4 text-sm"
                  href={`/history/${previous.id}`}
                  key={previous.id}
                >
                  <span>
                    {formatDate(previous.completed_at)} ·{" "}
                    <span className="capitalize">{previous.result}</span>
                  </span>
                  <span className="text-muted">
                    {formatDuration(previous.duration_seconds)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <Link className={buttonVariants({ variant: "ghost" })} href="/history">
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to history
      </Link>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted text-xs font-semibold tracking-wide uppercase">
        {label}
      </dt>
      <dd className="mt-1 leading-6 whitespace-pre-line capitalize">{value}</dd>
    </div>
  );
}
function List({ title, values }: { title: string; values: string[] }) {
  return (
    <section className="mt-5 border-t pt-5">
      <h3 className="text-sm font-semibold">{title}</h3>
      {values.length ? (
        <ul className="text-muted mt-2 list-disc space-y-1 pl-5 text-sm">
          {values.map((value) => (
            <li key={value}>{value}</li>
          ))}
        </ul>
      ) : (
        <p className="text-muted mt-2 text-sm">None recorded.</p>
      )}
    </section>
  );
}
