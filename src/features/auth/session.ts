import { redirect } from "next/navigation";

import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type AuthenticatedUser = {
  email: string | null;
  id: string;
  isAnonymous: boolean;
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
    isAnonymous: claims.is_anonymous === true,
  };
}

export async function requireAuthenticatedUser(): Promise<AuthenticatedUser> {
  const user = await requireInterviewUser();
  if (user.isAnonymous) redirect("/signup");
  return user;
}

export async function requireInterviewUser(): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/interviews");
  }

  return user;
}

// Called only from a deliberate start action, never while rendering a page.
export async function ensureInterviewUser(): Promise<AuthenticatedUser | null> {
  const existing = await getAuthenticatedUser();
  if (existing) return existing;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data.user) return null;
  return { id: data.user.id, email: null, isAnonymous: true };
}
