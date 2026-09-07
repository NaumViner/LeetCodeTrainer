import { redirect } from "next/navigation";
import { requireAuthenticatedUser } from "@/features/auth/session";
export default async function DashboardPage() {
  await requireAuthenticatedUser();
  redirect("/interviews");
}
