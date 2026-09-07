export function interviewRouteAccess(
  pathname: string,
): "public" | "interview" | "member" | "other" {
  if (pathname === "/" || pathname === "/interviews") return "public";
  if (
    /^\/interviews\/[0-9a-f-]{36}(?:\/(?:scorecard|review|ended))?$/.test(
      pathname,
    )
  )
    return "interview";
  const members = [
    "/dashboard",
    "/diagnostic",
    "/history",
    "/interviews",
    "/interview-profile",
    "/learn",
    "/onboarding",
    "/plan",
    "/practice",
    "/problems",
    "/progress",
    "/review",
    "/settings",
  ];
  return members.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/"),
  )
    ? "member"
    : "other";
}

export function safeAuthNextPath(value: string | null | undefined) {
  // Only known application destinations; backslashes and encoded origins cannot
  // turn an auth callback into an external redirect.
  return value &&
    /^\/interviews(?:\/[0-9a-f-]{36}(?:\/(?:scorecard|review|ended))?)?$/.test(
      value,
    )
    ? value
    : "/interviews";
}
