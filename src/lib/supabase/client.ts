import { createBrowserClient } from "@supabase/ssr";

import { requireSupabasePublicConfig } from "@/lib/supabase/config";
import type { Database } from "@/types/database";

export function createClient() {
  const { key, url } = requireSupabasePublicConfig();
  return createBrowserClient<Database>(url, key);
}
