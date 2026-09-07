"use server";

import { getAuthenticatedUser } from "@/features/auth/session";
import { getActiveMockInterview } from "@/features/mock-interviews/queries";
import {
  prepareGuestAccountClaim,
  finishGuestAccountClaim,
} from "@/features/auth/guest-claim";
import { configuredOAuthProviders } from "@/features/auth/providers";
import type { Provider } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import {
  loginSchema,
  signupSchema,
  type AuthActionState,
} from "@/features/auth/schema";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site-url";

const configurationMessage =
  "Authentication is not configured. Start the local Supabase stack or add hosted project credentials.";

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
  const guest = await getAuthenticatedUser();
  if (guest?.isAnonymous) {
    if (await getActiveMockInterview())
      return {
        status: "error",
        message:
          "Finish or end your current interview before signing in, so your work can be saved.",
      };
    if (!(await prepareGuestAccountClaim()))
      return {
        status: "error",
        message:
          "Your interview could not be prepared for saving. Please try again.",
      };
  }
  const { error } = await supabase.auth.signInWithPassword(result.data);

  if (error) {
    return { message: "Email or password is incorrect.", status: "error" };
  }

  const claim = await finishGuestAccountClaim();
  redirect(
    claim.pending
      ? "/signup/transfer"
      : claim.interviewId
        ? "/interviews/" + claim.interviewId
        : "/interviews",
  );
}

export async function signupAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const current = await getAuthenticatedUser();
  if (current?.isAnonymous)
    return {
      status: "error",
      message:
        "Verify your email using the save-interview form to keep your first interview.",
    };
  const result = signupSchema.safeParse({
    displayName: formData.get("displayName") ?? "",
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
      emailRedirectTo: `${getSiteUrl()}/auth/callback?next=/interviews`,
    },
    password: result.data.password,
  });

  if (error) {
    return { message: error.message, status: "error" };
  }

  if (data.session) {
    redirect("/interviews");
  }

  return {
    message: "Check your email to confirm your account, then sign in.",
    status: "success",
  };
}

export async function signInWithOAuthAction(
  provider: Provider,
  formData: FormData,
) {
  if (
    !getSupabasePublicConfig() ||
    !configuredOAuthProviders().includes(provider as "google" | "github")
  )
    redirect("/login?notice=oauth");
  const user = await getAuthenticatedUser();
  const supabase = await createClient();
  if (user?.isAnonymous && (await getActiveMockInterview()))
    redirect("/interviews");
  const linkGuest = user?.isAnonymous && formData.get("intent") !== "login";
  if (user?.isAnonymous && !linkGuest && !(await prepareGuestAccountClaim()))
    redirect("/login?notice=save");
  const options = {
    redirectTo: getSiteUrl() + "/auth/callback?next=/interviews",
  };
  const { data, error } = linkGuest
    ? await supabase.auth.linkIdentity({ provider, options })
    : await supabase.auth.signInWithOAuth({ provider, options });
  if (error || !data.url) redirect("/login?notice=oauth");
  redirect(data.url);
}

export async function logoutAction() {
  if (getSupabasePublicConfig()) {
    const supabase = await createClient();
    await supabase.auth.signOut({ scope: "local" });
  }

  redirect("/");
}
