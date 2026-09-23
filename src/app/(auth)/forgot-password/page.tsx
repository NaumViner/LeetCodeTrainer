import Link from "next/link";
import { PasswordRecoveryForm } from "@/components/auth/password-recovery-form";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const { notice } = await searchParams;
  return (
    <div className="w-full max-w-md">
      <h2 className="text-3xl font-semibold">Reset your password</h2>
      <p className="text-muted mt-3">
        Request a link, then open it in the same browser. On another device,
        request a fresh link there first.
      </p>
      {notice === "invalid" ? (
        <p role="status" className="mt-4 rounded-lg border p-3">
          This link expired, was already used, or was opened in another browser.
          Request a new link below.
        </p>
      ) : null}
      <PasswordRecoveryForm mode="request" />
      <Link href="/login" className="text-primary mt-6 block underline">
        Back to sign in
      </Link>
    </div>
  );
}
