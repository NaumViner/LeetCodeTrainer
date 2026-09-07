import "server-only";
export function configuredOAuthProviders(): Array<"google" | "github"> {
  return [
    ...(process.env.AUTH_GOOGLE_ENABLED === "true" ? ["google" as const] : []),
    ...(process.env.AUTH_GITHUB_ENABLED === "true" ? ["github" as const] : []),
  ];
}
