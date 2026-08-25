import { ProfileForm } from "@/components/profile/profile-form";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requireAuthenticatedUser } from "@/features/auth/session";
import { getProfile } from "@/features/profile/queries";

export default async function ProfileSettingsPage() {
  const user = await requireAuthenticatedUser();
  const profile = await getProfile(user.id);

  if (!profile) {
    throw new Error("Your profile could not be loaded.");
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageHeader
        description="Update the inputs that shape your future daily plan."
        eyebrow="Settings"
        title="Learner profile"
      />
      <Card className="shadow-none">
        <CardContent className="p-6 sm:p-8">
          <ProfileForm profile={profile} submitLabel="Save profile" />
        </CardContent>
      </Card>
    </div>
  );
}
