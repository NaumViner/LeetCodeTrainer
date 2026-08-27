import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { getSupabasePublicConfig } from "@/lib/supabase/config";
import type { Database } from "@/types/database";

const protectedPrefixes = [
  "/dashboard",
  "/diagnostic",
  "/history",
  "/interviews",
  "/learn",
  "/onboarding",
  "/plan",
  "/practice",
  "/problems",
  "/progress",
  "/review",
  "/settings",
];
const authPaths = new Set(["/login", "/signup"]);

export async function updateSession(request: NextRequest) {
  const config = getSupabasePublicConfig();

  if (!config) {
    if (
      protectedPrefixes.some((prefix) =>
        request.nextUrl.pathname.startsWith(prefix),
      )
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("notice", "configuration");
      return NextResponse.redirect(url);
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
  const pathname = request.nextUrl.pathname;

  if (
    !isAuthenticated &&
    protectedPrefixes.some((prefix) => pathname.startsWith(prefix))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthenticated && authPaths.has(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
