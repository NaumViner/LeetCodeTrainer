import { createClient } from "@supabase/supabase-js";

import { getSupabasePublicConfig } from "@/lib/supabase/config";
import type { Database } from "@/types/database";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type HealthStatus = "error" | "ok";

function healthResponse(status: HealthStatus, database: HealthStatus) {
  return Response.json(
    {
      checks: { database },
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ?? null,
      service: "faang-interview-academy",
      status,
      timestamp: new Date().toISOString(),
    },
    {
      headers: { "Cache-Control": "no-store, max-age=0" },
      status: status === "ok" ? 200 : 503,
    },
  );
}

export async function GET() {
  const config = getSupabasePublicConfig();
  if (!config) return healthResponse("error", "error");

  try {
    const supabase = createClient<Database>(config.url, config.key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { count, error } = await supabase
      .from("topics")
      .select("id", { count: "exact", head: true })
      .eq("active", true)
      .abortSignal(AbortSignal.timeout(5_000));

    if (error || !count) return healthResponse("error", "error");
    return healthResponse("ok", "ok");
  } catch {
    return healthResponse("error", "error");
  }
}
