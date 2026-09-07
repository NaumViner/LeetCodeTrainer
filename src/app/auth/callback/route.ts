import { type NextRequest, NextResponse } from "next/server";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { safeAuthNextPath } from "@/features/auth/access";
import { finishGuestAccountClaim } from "@/features/auth/guest-claim";
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const requested = request.nextUrl.searchParams.get("next");
  const next =
    requested === "/signup/complete" ? requested : safeAuthNextPath(requested);
  if (code && getSupabasePublicConfig()) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const claim = await finishGuestAccountClaim();
      const destination = claim.pending
        ? "/signup/transfer"
        : claim.interviewId
          ? "/interviews/" + claim.interviewId
          : next;
      return NextResponse.redirect(new URL(destination, request.url));
    }
  }
  return NextResponse.redirect(new URL("/login?notice=callback", request.url));
}
