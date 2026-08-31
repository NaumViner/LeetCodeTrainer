const suppliedUrl = process.argv[2] ?? process.env.DEPLOYMENT_URL;
if (!suppliedUrl) {
  console.error(
    "Usage: npm run verify:deployment -- https://your-deployment.example",
  );
  process.exit(1);
}

let origin;
try {
  const normalized = suppliedUrl.startsWith("http")
    ? suppliedUrl
    : `https://${suppliedUrl}`;
  origin = new URL(normalized).origin;
} catch {
  console.error("Deployment URL is invalid.");
  process.exit(1);
}

async function fetchWithTimeout(path) {
  return fetch(`${origin}${path}`, {
    headers: { "User-Agent": "faang-academy-deployment-check/1.0" },
    redirect: "follow",
    signal: AbortSignal.timeout(15_000),
  });
}

try {
  const [home, health] = await Promise.all([
    fetchWithTimeout("/"),
    fetchWithTimeout("/api/health"),
  ]);
  if (!home.ok) throw new Error(`Landing page returned HTTP ${home.status}.`);
  if (!health.ok)
    throw new Error(`Health endpoint returned HTTP ${health.status}.`);

  const healthBody = await health.json();
  if (healthBody?.status !== "ok" || healthBody?.checks?.database !== "ok") {
    throw new Error("Health endpoint did not confirm database readiness.");
  }

  console.log(`Deployment verified at ${origin}.`);
  console.log("Landing page: ok; application: ok; database and catalog: ok.");
} catch (error) {
  console.error(
    `Deployment verification failed: ${error instanceof Error ? error.message : "unknown error"}`,
  );
  process.exit(1);
}
