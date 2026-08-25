import { redirect } from "next/navigation";

import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type AuthenticatedUser = {
  email: string | null;
  id: string;
};

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  if (!getSupabasePublicConfig()) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (error || !claims?.sub) {
    return null;
  }

  return {
    email: typeof claims.email === "string" ? claims.email : null,
    id: claims.sub,
  };
}

export async function requireAuthenticatedUser(): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}
