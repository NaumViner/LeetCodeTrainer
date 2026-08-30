import { redirect } from "next/navigation";

import { ProfileForm } from "@/components/profile/profile-form";
import { Card, CardContent } from "@/components/ui/card";
import { requireAuthenticatedUser } from "@/features/auth/session";
import { getProfile } from "@/features/profile/queries";

export default async function OnboardingPage() {
  const user = await requireAuthenticatedUser();
  const profile = await getProfile(user.id);

  if (!profile) {
    throw new Error("A learner profile was not created for this account.");
  }

  if (profile.onboarding_completed) {
    redirect(profile.diagnostic_completed ? "/dashboard" : "/diagnostic");
  }

  return (
    <div className="mx-auto max-w-4xl">
      <p className="text-primary text-sm font-semibold">
        Welcome to your academy
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        Tell us what you are preparing for.
      </h1>
      <p className="text-muted mt-3 max-w-2xl leading-7">
        In about two minutes, we will shape your curriculum and daily study
        time. A short diagnostic comes next to adapt your starting level.
      </p>
      <Card className="mt-8 shadow-none">
        <CardContent className="p-6 sm:p-8">
          <ProfileForm onboarding profile={profile} />
        </CardContent>
      </Card>
    </div>
  );
}
