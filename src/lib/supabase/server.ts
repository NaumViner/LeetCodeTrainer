import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { requireSupabasePublicConfig } from "@/lib/supabase/config";
import type { Database } from "@/types/database";

export async function createClient() {
  const cookieStore = await cookies();
  const { key, url } = requireSupabasePublicConfig();

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, options, value }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot write cookies. The root proxy refreshes sessions.
        }
      },
    },
  });
}
