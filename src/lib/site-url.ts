function normalizeOrigin(value: string) {
  const withProtocol = value.startsWith("http") ? value : `https://${value}`;
  return withProtocol.replace(/\/$/, "");
}

export function getSiteUrl(
  environment: Readonly<Record<string, string | undefined>> = process.env,
) {
  const configuredUrl = environment.NEXT_PUBLIC_APP_URL;
  if (configuredUrl) return normalizeOrigin(configuredUrl);

  const vercelUrl =
    environment.NEXT_PUBLIC_VERCEL_URL ?? environment.VERCEL_URL;
  if (vercelUrl) return normalizeOrigin(vercelUrl);

  return "http://localhost:3000";
}
