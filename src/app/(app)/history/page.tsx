import { History } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/feedback/empty-state";
import { DifficultyBadge } from "@/components/problems/difficulty-badge";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { formatDate, formatDuration } from "@/features/analytics/format";
import { getAnalyticsSnapshot } from "@/features/analytics/queries";
import { requireAuthenticatedUser } from "@/features/auth/session";

export default async function HistoryPage() {
  const user = await requireAuthenticatedUser();
  const analytics = await getAnalyticsSnapshot(user.id);

  return (
    <div className="space-y-8">
      <PageHeader
        description="Review the evidence from every completed problem attempt."
        eyebrow="Practice record"
        title="Attempt history"
      />
      {analytics.attempts.length === 0 ? (
        <EmptyState
          action={
            <Link className={buttonVariants()} href="/practice">
              Start practice
            </Link>
          }
          description="Completed attempts will appear here with their timing, help, recognition, and result."
          icon={<History aria-hidden="true" className="size-7" />}
          title="No completed attempts"
        />
      ) : (
        <Card className="overflow-hidden shadow-none">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-left text-sm">
              <thead className="bg-surface-subtle text-muted text-xs tracking-wide uppercase">
                <tr>
                  {[
                    "Date",
                    "Problem",
                    "Difficulty",
                    "Topic",
                    "Mode",
                    "Result",
                    "Help",
                    "Time",
                    "Pattern",
                  ].map((label) => (
                    <th className="px-4 py-3" key={label}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {analytics.attempts.map((attempt) => (
                  <tr key={attempt.id}>
                    <td className="text-muted px-4 py-4">
                      {formatDate(attempt.completed_at)}
                    </td>
                    <td className="px-4 py-4 font-medium">
                      <Link
                        className="text-primary"
                        href={`/history/${attempt.id}`}
                      >
                        #{attempt.problem.external_id} {attempt.problem.title}
                      </Link>
                    </td>
                    <td className="px-4 py-4">
                      <DifficultyBadge
                        difficulty={
                          attempt.problem.difficulty as
                            "easy" | "medium" | "hard"
                        }
                      />
                    </td>
                    <td className="px-4 py-4">
                      {attempt.problem.primaryTopic.name}
                    </td>
                    <td className="px-4 py-4 capitalize">{attempt.mode}</td>
                    <td className="px-4 py-4">
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
                    </td>
                    <td className="px-4 py-4 capitalize">
                      {attempt.help_level.replaceAll("_", " ")}
                    </td>
                    <td className="px-4 py-4">
                      {formatDuration(attempt.duration_seconds)}
                    </td>
                    <td className="px-4 py-4">
                      {attempt.recognized_pattern_correctly
                        ? "Correct"
                        : "Missed"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
