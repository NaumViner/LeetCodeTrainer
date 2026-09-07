import { timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import type { Database } from "@/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization") ?? "";
  const expected = secret ? `Bearer ${secret}` : "";
  if (
    !secret ||
    Buffer.byteLength(authorization) !== Buffer.byteLength(expected) ||
    !timingSafeEqual(Buffer.from(authorization), Buffer.from(expected))
  ) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const config = getSupabasePublicConfig();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!config || !key)
    return Response.json({ error: "Cleanup unavailable" }, { status: 503 });
  const client = createClient<Database>(config.url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.rpc("cleanup_expired_guest_interviews");
  return error
    ? Response.json({ error: "Cleanup failed" }, { status: 503 })
    : Response.json(
        { deletedInterviews: data },
        { headers: { "Cache-Control": "no-store" } },
      );
}
