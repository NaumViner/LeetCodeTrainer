import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Code2,
  Target,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requireAuthenticatedUser } from "@/features/auth/session";
import { getProfile } from "@/features/profile/queries";

export default async function DashboardPage() {
  const user = await requireAuthenticatedUser();
  const profile = await getProfile(user.id);

  if (!profile?.onboarding_completed) {
    redirect("/onboarding");
  }

  const details = [
    {
      icon: Target,
      label: "Target role",
      value: profile.target_role.replaceAll("_", " "),
    },
    {
      icon: Code2,
      label: "Coding language",
      value: profile.preferred_language,
    },
    {
      icon: Clock3,
      label: "Weekly study time",
      value: `${Math.round(profile.weekly_study_minutes / 60)} hours`,
    },
    {
      icon: CalendarDays,
      label: "Interview date",
      value: profile.interview_date ?? "Not set",
    },
  ] as const;

  return (
    <div className="space-y-8">
      <PageHeader
        actions={
          <Link
            className={buttonVariants({ variant: "secondary" })}
            href="/settings/profile"
          >
            Edit profile
          </Link>
        }
        description="Your account and private learner profile are connected. Curriculum begins in Phase 3."
        eyebrow="Dashboard"
        title={`Welcome${profile.display_name ? `, ${profile.display_name}` : ""}`}
      />

      <Card>
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Badge variant="success">
                <CheckCircle2 aria-hidden="true" className="size-3.5" />
                Profile saved
              </Badge>
              <h2 className="mt-4 text-xl font-semibold">
                Your preparation baseline
              </h2>
              <p className="text-muted mt-2 text-sm leading-6">
                Stored securely and visible only to your authenticated account.
              </p>
            </div>
            <p className="text-muted text-sm">Timezone: {profile.timezone}</p>
          </div>
          <dl className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {details.map(({ icon: Icon, label, value }) => (
              <div
                className="bg-surface-subtle rounded-xl border p-4"
                key={label}
              >
                <Icon aria-hidden="true" className="text-primary size-4" />
                <dt className="text-muted mt-3 text-xs font-semibold tracking-wide uppercase">
                  {label}
                </dt>
                <dd className="mt-1 capitalize">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-6 border-t pt-5">
            <p className="text-sm font-medium">Target companies</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {profile.target_companies.map((company) => (
                <Badge key={company}>{company}</Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <section id="curriculum">
        <Card className="shadow-none">
          <CardContent className="p-6">
            <h2 className="font-semibold">Next: curriculum and first lesson</h2>
            <p className="text-muted mt-2 text-sm leading-6">
              Phase 3 will connect topic prerequisites, lessons, and persistent
              learning progress to this profile.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
