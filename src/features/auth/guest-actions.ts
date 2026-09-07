"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import {
  emailSchema,
  passwordSchema,
  type AuthActionState,
} from "@/features/auth/schema";
import {
  requireAuthenticatedUser,
  requireInterviewUser,
} from "@/features/auth/session";
import { finishGuestAccountClaim } from "@/features/auth/guest-claim";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site-url";

export async function requestGuestEmailAction(
  _state: AuthActionState,
  form: FormData,
): Promise<AuthActionState> {
  const user = await requireInterviewUser();
  if (!user.isAnonymous) redirect("/signup/complete");
  const email = emailSchema.safeParse(form.get("email"));
  if (!email.success)
    return { status: "error", message: "Enter a valid email address." };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.updateUser(
    { email: email.data },
    {
      emailRedirectTo: getSiteUrl() + "/auth/callback?next=/signup/complete",
    },
  );
  if (error)
    return {
      status: "error",
      message:
        "We couldn't send the verification email. Try again, or sign in if you already have an account.",
    };
  if (data.user && !data.user.is_anonymous) {
    // updateUser changes the identity before the existing JWT is refreshed.
    const refreshed = await supabase.auth.refreshSession();
    if (refreshed.error)
      return {
        status: "error",
        message:
          "Your email was saved. Please sign in again to finish setting up your account.",
      };
    redirect("/signup/complete");
  }
  return {
    status: "success",
    message:
      "Check your email. Open the link in this browser, or enter the verification code below.",
  };
}

export async function verifyGuestEmailAction(
  _state: AuthActionState,
  form: FormData,
): Promise<AuthActionState> {
  const parsed = z
    .object({ email: emailSchema, token: z.string().regex(/^\d{6,8}$/) })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return {
      status: "error",
      message: "Enter your email and the verification code from the message.",
    };
  await requireInterviewUser();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    ...parsed.data,
    type: "email_change",
  });
  if (error || !data.user || data.user.is_anonymous)
    return {
      status: "error",
      message:
        "That code is invalid or expired. Request another email and try again.",
    };
  redirect("/signup/complete");
}

export async function completeAccountAction(
  _state: AuthActionState,
  form: FormData,
): Promise<AuthActionState> {
  await requireAuthenticatedUser();
  const password = passwordSchema.safeParse(form.get("password"));
  if (!password.success)
    return {
      status: "error",
      message: "Use at least 8 characters, including a letter and a number.",
    };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: password.data });
  if (error)
    return {
      status: "error",
      message: "Your password could not be saved. Please try again.",
    };
  redirect("/interviews?notice=saved");
}

export async function retryGuestClaimAction(
  _state: AuthActionState,
  _form: FormData,
): Promise<AuthActionState> {
  void _state;
  void _form;
  await requireAuthenticatedUser();
  const claim = await finishGuestAccountClaim();
  if (claim.pending)
    return {
      status: "error",
      message:
        "Your interview could not be attached. Try again after the evaluation finishes. Transfers expire after 15 minutes; an expired transfer cannot be recovered from this account.",
    };
  redirect(
    claim.interviewId ? "/interviews/" + claim.interviewId : "/interviews",
  );
}
