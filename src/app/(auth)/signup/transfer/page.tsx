import Link from "next/link";
import { GuestAccountForm } from "@/components/auth/guest-account-form";
import { requireAuthenticatedUser } from "@/features/auth/session";
export default async function GuestTransferPage() {
  await requireAuthenticatedUser();
  return (
    <div className="w-full max-w-md">
      <h1 className="text-3xl font-semibold">Finish saving your interview</h1>
      <p className="text-muted mt-3 mb-7">
        You are signed in. Attach the interview you completed in this browser to
        your account.
      </p>
      <GuestAccountForm mode="transfer" />
      <Link
        className="text-primary mt-5 block text-sm underline"
        href="/interviews"
      >
        Continue to interviews
      </Link>
    </div>
  );
}
