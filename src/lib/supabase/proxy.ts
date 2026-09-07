import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { interviewRouteAccess } from "@/features/auth/access";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import type { Database } from "@/types/database";

const authPaths = new Set(["/login", "/signup"]);

export async function updateSession(request: NextRequest) {
  const config = getSupabasePublicConfig();

  if (!config) {
    if (
      ["member", "interview"].includes(
        interviewRouteAccess(request.nextUrl.pathname),
      )
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("notice", "configuration");
      const redirected = NextResponse.redirect(url);
      return redirected;
    }

    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient<Database>(config.url, config.key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, options, value }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const isAuthenticated = Boolean(claims?.sub);
  const isMember = isAuthenticated && claims?.is_anonymous !== true;
  const pathname = request.nextUrl.pathname;

  if (
    (interviewRouteAccess(pathname) === "member" && !isMember) ||
    (interviewRouteAccess(pathname) === "interview" && !isAuthenticated)
  ) {
    const url = request.nextUrl.clone();
    url.pathname = isAuthenticated ? "/signup" : "/interviews";
    url.search = "";
    const redirected = NextResponse.redirect(url);
    if (typeof response !== "undefined")
      response.cookies
        .getAll()
        .forEach((cookie) => redirected.cookies.set(cookie));
    return redirected;
  }

  if (isMember && authPaths.has(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/interviews";
    url.search = "";
    const redirected = NextResponse.redirect(url);
    if (typeof response !== "undefined")
      response.cookies
        .getAll()
        .forEach((cookie) => redirected.cookies.set(cookie));
    return redirected;
  }

  return response;
}
