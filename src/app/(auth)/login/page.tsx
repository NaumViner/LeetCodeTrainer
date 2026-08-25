import Link from "next/link";

import { AuthForm } from "@/components/auth/auth-form";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { loginAction } from "@/features/auth/actions";
import { getSupabasePublicConfig } from "@/lib/supabase/config";

const notices: Record<string, string> = {
  configuration:
    "Authentication needs a local or hosted Supabase configuration.",
  oauth:
    "That OAuth provider is not configured yet. Use email and password instead.",
  callback: "The sign-in link could not be verified. Please try again.",
};

type LoginPageProps = {
  searchParams: Promise<{ notice?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const configured = Boolean(getSupabasePublicConfig());
  const { notice } = await searchParams;

  return (
    <div className="w-full max-w-md">
      <h2 className="text-3xl font-semibold tracking-tight">Welcome back</h2>
      <p className="text-muted mt-2">
        Sign in to continue your interview plan.
      </p>

      {notice && notices[notice] ? (
        <p className="bg-primary-soft text-primary mt-5 rounded-lg px-3 py-2 text-sm">
          {notices[notice]}
        </p>
      ) : null}

      <div className="mt-7">
        <OAuthButtons configured={configured} />
      </div>
      <div className="text-muted my-6 flex items-center gap-3 text-xs">
        <span className="bg-border h-px flex-1" />
        or use email
        <span className="bg-border h-px flex-1" />
      </div>
      <AuthForm action={loginAction} configured={configured} mode="login" />
      <p className="text-muted mt-6 text-center text-sm">
        New here?{" "}
        <Link
          className="text-primary hover:text-primary-strong font-semibold"
          href="/signup"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
