import { type NextRequest, NextResponse } from "next/server";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { safeAuthNextPath } from "@/features/auth/access";
import { finishGuestAccountClaim } from "@/features/auth/guest-claim";
import { prepareGuestAccountClaim } from "@/features/auth/guest-claim";
import { getAuthenticatedUser } from "@/features/auth/session";
import { getActiveMockInterview } from "@/features/mock-interviews/queries";
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const requested = request.nextUrl.searchParams.get("next");
  const next =
    requested === "/signup/complete" ? requested : safeAuthNextPath(requested);
  if (code && getSupabasePublicConfig()) {
    const guest = await getAuthenticatedUser();
    if (guest?.isAnonymous) {
      if (await getActiveMockInterview())
        return NextResponse.redirect(new URL("/interviews", request.url));
      if (next === "/reset-password" && !(await prepareGuestAccountClaim()))
        return NextResponse.redirect(
          new URL("/forgot-password?notice=invalid", request.url),
        );
    }
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // The destination is routing intent only: exchangeCodeForSession has
      // already verified the PKCE proof. Reset itself re-verifies the user.
      const recovery =
        next === "/reset-password" ||
        ("redirectType" in data && data.redirectType === "recovery");
      if (recovery)
        return NextResponse.redirect(
          new URL(
            data.user && !data.user.is_anonymous
              ? "/reset-password"
              : "/forgot-password?notice=invalid",
            request.url,
          ),
        );
      const claim = await finishGuestAccountClaim();
      const destination = claim.pending
        ? "/signup/transfer"
        : claim.interviewId
          ? "/interviews/" + claim.interviewId
          : next;
      return NextResponse.redirect(new URL(destination, request.url));
    }
  }
  return NextResponse.redirect(
    new URL(
      next === "/reset-password"
        ? "/forgot-password?notice=invalid"
        : "/login?notice=callback",
      request.url,
    ),
  );
}
