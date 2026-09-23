import Link from "next/link";
import { PasswordRecoveryForm } from "@/components/auth/password-recovery-form";
import { createClient } from "@/lib/supabase/server";
import { getSupabasePublicConfig } from "@/lib/supabase/config";

export default async function ResetPasswordPage() {
  const supabase = getSupabasePublicConfig() ? await createClient() : null;
  const verified = supabase ? await supabase.auth.getUser() : null;
  const ready =
    !verified?.error && verified?.data.user && !verified.data.user.is_anonymous;
  return (
    <div className="w-full max-w-md">
      <h2 className="text-3xl font-semibold">Choose a new password</h2>
      {ready ? (
        <PasswordRecoveryForm mode="reset" />
      ) : (
        <p role="status" className="text-muted mt-4">
          A verified account session is required. Your link may have expired or
          been opened in another browser.
        </p>
      )}
      <Link
        href="/forgot-password"
        className="text-primary mt-6 block underline"
      >
        Request a new reset link
      </Link>
    </div>
  );
}
