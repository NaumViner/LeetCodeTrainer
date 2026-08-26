import {
  ArrowRight,
  CalendarClock,
  ClockAlert,
  History,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/feedback/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requireAuthenticatedUser } from "@/features/auth/session";
import { getActiveAttempt } from "@/features/practice/queries";
import { getProfile } from "@/features/profile/queries";
import { startReviewAttemptAction } from "@/features/reviews/actions";
import { formatInterval, formatReviewDate } from "@/features/reviews/format";
import {
  getReviewQueue,
  reviewQueueCounts,
  type ReviewQueueItem,
} from "@/features/reviews/queries";

export default async function ReviewPage() {
  const user = await requireAuthenticatedUser();
  const [profile, activeAttempt] = await Promise.all([
    getProfile(user.id),
    getActiveAttempt(user.id),
  ]);
  const timeZone = profile?.timezone ?? "UTC";
  const items = await getReviewQueue(user.id, new Date(), timeZone);
  const counts = reviewQueueCounts(items);

  return (
    <div className="space-y-8">
      <PageHeader
        actions={
          <Link
            className={buttonVariants({ variant: "secondary" })}
            href="/review/history"
          >
            <History aria-hidden="true" className="size-4" /> Review history
          </Link>
        }
        description="Recall patterns before notes, revisit earlier mistakes, and let each result adapt the next interval."
        eyebrow="Spaced repetition"
        title="Review queue"
      />

      <section className="grid gap-4 sm:grid-cols-3" aria-label="Review counts">
        <QueueCount icon={ClockAlert} label="Due now" value={counts.due_now} />
        <QueueCount
          icon={CalendarClock}
          label="Due today"
          value={counts.due_today}
        />
        <QueueCount icon={RotateCcw} label="Upcoming" value={counts.upcoming} />
      </section>

      {activeAttempt ? (
        <Card className="border-primary/30 bg-primary-soft">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">A session is already in progress</p>
              <p className="text-muted mt-1 text-sm">
                Finish or resume it before opening another review.
              </p>
            </div>
            <Link
              className={buttonVariants()}
              href={`/practice/${activeAttempt.id}`}
            >
              Resume session{" "}
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </CardContent>
        </Card>
      ) : null}

      {items.length === 0 ? (
        <EmptyState
          action={
            <Link className={buttonVariants()} href="/practice">
              Complete a practice attempt
            </Link>
          }
          description="Complete a problem and its first review date will be calculated automatically."
          icon={<RotateCcw aria-hidden="true" className="size-7" />}
          title="No reviews scheduled yet"
        />
      ) : (
        <div className="space-y-8">
          <QueueSection
            activeAttempt={Boolean(activeAttempt)}
            description="Overdue items are the highest-priority recall work."
            empty="Nothing is overdue."
            items={items.filter((item) => item.bucket === "due_now")}
            timeZone={timeZone}
            title="Due now"
          />
          <QueueSection
            activeAttempt={Boolean(activeAttempt)}
            description="Scheduled later on your local calendar day."
            empty="No additional reviews are due today."
            items={items.filter((item) => item.bucket === "due_today")}
            timeZone={timeZone}
            title="Due today"
          />
          <QueueSection
            activeAttempt={Boolean(activeAttempt)}
            description="Future work is visible for planning and may be reviewed early."
            empty="No future reviews are scheduled."
            items={items.filter((item) => item.bucket === "upcoming")}
            timeZone={timeZone}
            title="Upcoming"
          />
        </div>
      )}
    </div>
  );
}

function QueueCount({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof ClockAlert;
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <span className="bg-primary-soft text-primary rounded-lg p-2.5">
          <Icon aria-hidden="true" className="size-4" />
        </span>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-muted text-sm">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function QueueSection({
  activeAttempt,
  description,
  empty,
  items,
  timeZone,
  title,
}: {
  activeAttempt: boolean;
  description: string;
  empty: string;
  items: ReviewQueueItem[];
  timeZone: string;
  title: string;
}) {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-muted mt-1 text-sm">{description}</p>
      </div>
      {items.length === 0 ? (
        <p className="bg-surface-subtle text-muted rounded-xl border px-5 py-6 text-sm">
          {empty}
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((item) => (
            <ReviewCard
              activeAttempt={activeAttempt}
              item={item}
              key={item.problem.id}
              timeZone={timeZone}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function ReviewCard({
  activeAttempt,
  item,
  timeZone,
}: {
  activeAttempt: boolean;
  item: ReviewQueueItem;
  timeZone: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-primary text-xs font-semibold">
              {item.problem.primaryTopic.name}
            </p>
            <h3 className="mt-1 text-lg font-semibold">{item.problem.title}</h3>
          </div>
          <Badge variant={item.bucket === "due_now" ? "warning" : "neutral"}>
            {formatReviewDate(item.review.next_review_at, timeZone)}
          </Badge>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {item.prompts.map((prompt) => (
            <Badge key={prompt.type}>{prompt.label}</Badge>
          ))}
        </div>
        <dl className="mt-5 grid grid-cols-3 gap-3 border-t pt-4 text-sm">
          <div>
            <dt className="text-muted text-xs">Interval</dt>
            <dd className="mt-1 font-medium">
              {formatInterval(item.review.interval_days)}
            </dd>
          </div>
          <div>
            <dt className="text-muted text-xs">Repetitions</dt>
            <dd className="mt-1 font-medium">{item.review.repetition}</dd>
          </div>
          <div>
            <dt className="text-muted text-xs">Last score</dt>
            <dd className="mt-1 font-medium">
              {Math.round(item.review.last_performance_score * 100)}
            </dd>
          </div>
        </dl>
        <form action={startReviewAttemptAction} className="mt-5">
          <input name="problemId" type="hidden" value={item.problem.id} />
          <Button disabled={activeAttempt} type="submit">
            {item.bucket === "upcoming" ? "Review early" : "Start review"}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
