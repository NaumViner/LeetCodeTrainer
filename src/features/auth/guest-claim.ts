import "server-only";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

const claimCookie = "interview_guest_claim";

export async function prepareGuestAccountClaim() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("prepare_guest_interview_claim");
  if (error) return false;
  if (data)
    (await cookies()).set(claimCookie, data, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60,
    });
  return true;
}

export async function finishGuestAccountClaim(): Promise<{
  interviewId: string | null;
  pending: boolean;
}> {
  const jar = await cookies();
  const token = jar.get(claimCookie)?.value;
  if (!token) return { interviewId: null, pending: false };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("claim_guest_interview", {
    p_token: token,
  });
  if (error) return { interviewId: null, pending: true };
  jar.delete(claimCookie);
  return { interviewId: data, pending: false };
}
