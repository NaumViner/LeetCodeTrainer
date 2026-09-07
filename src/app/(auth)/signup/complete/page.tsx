import { GuestAccountForm } from "@/components/auth/guest-account-form";
import { requireAuthenticatedUser } from "@/features/auth/session";
export default async function CompleteAccountPage() {
  await requireAuthenticatedUser();
  return (
    <div className="w-full max-w-md">
      <h1 className="text-3xl font-semibold">Your email is verified</h1>
      <p className="text-muted mt-3 mb-7">
        Choose a password so you can return to your interviews from any device.
      </p>
      <GuestAccountForm mode="password" />
    </div>
  );
}
