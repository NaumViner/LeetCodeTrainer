import { ArrowLeft, History } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/feedback/empty-state";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { formatDate } from "@/features/analytics/format";
import { requireAuthenticatedUser } from "@/features/auth/session";
import { formatInterval } from "@/features/reviews/format";
import { getReviewHistory } from "@/features/reviews/queries";

export default async function ReviewHistoryPage() {
  const user = await requireAuthenticatedUser();
  const history = await getReviewHistory(user.id);

  return (
    <div className="space-y-8">
      <PageHeader
        actions={
          <Link
            className={buttonVariants({ variant: "secondary" })}
            href="/review"
          >
            <ArrowLeft aria-hidden="true" className="size-4" /> Review queue
          </Link>
        }
        description="See which evidence changed each problem's interval, repetition count, and next review date."
        eyebrow="Spaced repetition"
        title="Review history"
      />

      {history.length === 0 ? (
        <EmptyState
          description="A scheduling record appears after your first completed practice attempt."
          icon={<History aria-hidden="true" className="size-7" />}
          title="No review history yet"
        />
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead className="bg-surface-subtle text-muted text-xs tracking-wide uppercase">
                <tr>
                  <th className="px-5 py-4">Problem</th>
                  <th className="px-5 py-4">Evidence</th>
                  <th className="px-5 py-4">Result</th>
                  <th className="px-5 py-4">Quality</th>
                  <th className="px-5 py-4">New interval</th>
                  <th className="px-5 py-4">Next review</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {history.map(({ event, problem }) => (
                  <tr key={event.id}>
                    <td className="px-5 py-4">
                      <Link
                        className="hover:text-primary font-semibold"
                        href={`/history/${event.attempt_id}`}
                      >
                        {problem.title}
                      </Link>
                      <p className="text-muted mt-1 text-xs">
                        {formatDate(event.reviewed_at)}
                      </p>
                    </td>
                    <td className="px-5 py-4 capitalize">
                      <Badge
                        variant={
                          event.attempt_mode === "review"
                            ? "primary"
                            : "neutral"
                        }
                      >
                        {event.attempt_mode === "review"
                          ? "Review session"
                          : "Initial schedule"}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 capitalize">{event.result}</td>
                    <td className="px-5 py-4">{event.quality_score} / 5</td>
                    <td className="px-5 py-4">
                      {formatInterval(event.interval_days)}
                    </td>
                    <td className="px-5 py-4">
                      {formatDate(event.next_review_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
