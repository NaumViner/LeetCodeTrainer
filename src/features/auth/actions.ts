"use server";

import type { Provider } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import {
  loginSchema,
  signupSchema,
  type AuthActionState,
} from "@/features/auth/schema";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

const configurationMessage =
  "Authentication is not configured. Start the local Supabase stack or add hosted project credentials.";

function siteUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export async function loginAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const result = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!result.success) {
    return {
      fieldErrors: result.error.flatten().fieldErrors,
      message: "Check the highlighted fields.",
      status: "error",
    };
  }

  if (!getSupabasePublicConfig()) {
    return { message: configurationMessage, status: "error" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(result.data);

  if (error) {
    return { message: "Email or password is incorrect.", status: "error" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("diagnostic_completed, onboarding_completed")
    .single();

  redirect(
    !profile?.onboarding_completed
      ? "/onboarding"
      : profile.diagnostic_completed
        ? "/dashboard"
        : "/diagnostic",
  );
}

export async function signupAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const result = signupSchema.safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!result.success) {
    return {
      fieldErrors: result.error.flatten().fieldErrors,
      message: "Check the highlighted fields.",
      status: "error",
    };
  }

  if (!getSupabasePublicConfig()) {
    return { message: configurationMessage, status: "error" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: result.data.email,
    options: {
      data: { display_name: result.data.displayName },
      emailRedirectTo: `${siteUrl()}/auth/callback?next=/onboarding`,
    },
    password: result.data.password,
  });

  if (error) {
    return { message: error.message, status: "error" };
  }

  if (data.session) {
    redirect("/onboarding");
  }

  return {
    message: "Check your email to confirm your account, then sign in.",
    status: "success",
  };
}

export async function signInWithOAuthAction(
  provider: Provider,
  _formData: FormData,
) {
  void _formData;
  if (!getSupabasePublicConfig()) {
    redirect("/login?notice=configuration");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    options: { redirectTo: `${siteUrl()}/auth/callback?next=/onboarding` },
    provider,
  });

  if (error || !data.url) {
    redirect("/login?notice=oauth");
  }

  redirect(data.url);
}

export async function logoutAction() {
  if (getSupabasePublicConfig()) {
    const supabase = await createClient();
    await supabase.auth.signOut({ scope: "local" });
  }

  redirect("/login");
}
