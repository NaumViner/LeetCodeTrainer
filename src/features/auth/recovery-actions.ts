"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import {
  emailSchema,
  passwordSchema,
  type AuthActionState,
} from "@/features/auth/schema";
import { getAuthenticatedUser } from "@/features/auth/session";
import {
  prepareGuestAccountClaim,
  finishGuestAccountClaim,
} from "@/features/auth/guest-claim";
import { getActiveMockInterview } from "@/features/mock-interviews/queries";
import { createClient } from "@/lib/supabase/server";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { getSiteUrl } from "@/lib/site-url";

const resetSchema = z
  .object({ password: passwordSchema, confirmation: z.string() })
  .refine((value) => value.password === value.confirmation, {
    path: ["confirmation"],
    message: "Passwords must match.",
  });

export async function requestPasswordRecoveryAction(
  _previous: AuthActionState,
  form: FormData,
): Promise<AuthActionState> {
  const parsed = emailSchema.safeParse(form.get("email"));
  if (!parsed.success)
    return {
      status: "error",
      fieldErrors: { email: ["Enter a valid email address."] },
      message: "Check the email address.",
    };
  if (!getSupabasePublicConfig())
    return {
      status: "error",
      message: "Password recovery is temporarily unavailable.",
    };
  try {
    const current = await getAuthenticatedUser();
    if (current?.isAnonymous) {
      if (await getActiveMockInterview())
        return {
          status: "error",
          message:
            "Finish or end your current interview before recovering an account, so your work stays saved.",
        };
      if (!(await prepareGuestAccountClaim()))
        return {
          status: "error",
          message:
            "Your interview could not be prepared for saving. Try again.",
        };
    }
    const supabase = await createClient();
    // Supabase enforces email/rate controls. Account existence, throttling and
    // delivery errors must not become an email-enumeration response.
    await supabase.auth.resetPasswordForEmail(parsed.data, {
      redirectTo: `${getSiteUrl()}/auth/callback?next=/reset-password`,
    });
  } catch {
    return {
      status: "error",
      message:
        "The request could not be completed. Check your connection and try again.",
    };
  }
  return {
    status: "success",
    message:
      "If this address has an account and email delivery is available, a reset link will arrive shortly. Open it in this browser. Check spam, and wait a minute before requesting another link.",
  };
}

export async function resetPasswordAction(
  _previous: AuthActionState,
  form: FormData,
): Promise<AuthActionState> {
  const parsed = resetSchema.safeParse({
    password: form.get("password"),
    confirmation: form.get("confirmation"),
  });
  if (!parsed.success)
    return {
      status: "error",
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Check the highlighted fields.",
    };
  if (!getSupabasePublicConfig())
    return {
      status: "error",
      message: "Password recovery is temporarily unavailable.",
    };
  let claim: Awaited<ReturnType<typeof finishGuestAccountClaim>>;
  try {
    const supabase = await createClient();
    // Verify with Auth, not a URL flag or unverified cookie payload.
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user || data.user.is_anonymous)
      return {
        status: "error",
        message:
          "Your reset session expired. Request a new password reset link.",
      };
    const updated = await supabase.auth.updateUser({
      password: parsed.data.password,
    });
    if (updated.error)
      return {
        status: "error",
        message:
          "The password could not be updated. Choose a different password, or request a fresh reset link.",
      };
    claim = await finishGuestAccountClaim();
  } catch {
    return {
      status: "error",
      message:
        "The update could not be confirmed. Try signing in with your new password before requesting another reset.",
    };
  }
  // Keep this verified session signed in; continue any guest transfer only after
  // the password has been updated. Claim proof is never reconstructed by ID.
  redirect(
    claim.pending
      ? "/signup/transfer"
      : claim.interviewId
        ? `/interviews/${claim.interviewId}`
        : "/interviews?notice=password_updated",
  );
}
