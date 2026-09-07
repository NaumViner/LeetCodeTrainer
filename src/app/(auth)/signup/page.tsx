import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { GuestAccountForm } from "@/components/auth/guest-account-form";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { signupAction } from "@/features/auth/actions";
import { getAuthenticatedUser } from "@/features/auth/session";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
export default async function SignupPage() {
  const configured = Boolean(getSupabasePublicConfig());
  const user = await getAuthenticatedUser();
  return (
    <div className="w-full max-w-md">
      <h1 className="text-3xl font-semibold tracking-tight">
        {user?.isAnonymous
          ? "Save your first interview"
          : "Create your account"}
      </h1>
      <p className="text-muted mt-3 mb-7">
        Keep your interviews and feedback together. Continue at your pace, with
        no required assessment.
      </p>
      <OAuthButtons configured={configured} />
      {user?.isAnonymous ? (
        <GuestAccountForm />
      ) : (
        <AuthForm action={signupAction} configured={configured} mode="signup" />
      )}
      <p className="text-muted mt-6 text-center text-sm">
        Already have an account?{" "}
        <Link className="text-primary font-semibold underline" href="/login">
          Sign in and save your interview
        </Link>
      </p>
      <Link
        className="text-muted mt-4 block text-center text-sm underline"
        href="/interviews"
      >
        Back to interviews
      </Link>
    </div>
  );
}
