import Link from "next/link";

import { AuthForm } from "@/components/auth/auth-form";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { signupAction } from "@/features/auth/actions";
import { getSupabasePublicConfig } from "@/lib/supabase/config";

export default function SignupPage() {
  const configured = Boolean(getSupabasePublicConfig());

  return (
    <div className="w-full max-w-md">
      <h2 className="text-3xl font-semibold tracking-tight">
        Create your academy
      </h2>
      <p className="text-muted mt-2">
        Start with a short profile, then receive a focused plan.
      </p>
      <div className="mt-7">
        <OAuthButtons configured={configured} />
      </div>
      <div className="text-muted my-6 flex items-center gap-3 text-xs">
        <span className="bg-border h-px flex-1" />
        or use email
        <span className="bg-border h-px flex-1" />
      </div>
      <AuthForm action={signupAction} configured={configured} mode="signup" />
      <p className="text-muted mt-6 text-center text-sm">
        Already have an account?{" "}
        <Link
          className="text-primary hover:text-primary-strong font-semibold"
          href="/login"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
