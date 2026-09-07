import { notFound, redirect } from "next/navigation";

import { PracticeWorkspace } from "@/components/practice/practice-workspace";
import { requireAuthenticatedUser } from "@/features/auth/session";
import { isAiCoachEnabled } from "@/features/ai-coach/config";
import { getPracticeAttempt } from "@/features/practice/queries";

type AttemptPageProps = {
  params: Promise<{ attemptId: string }>;
};

export default async function AttemptPage({ params }: AttemptPageProps) {
  const user = await requireAuthenticatedUser();
  const { attemptId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(attemptId)) notFound();

  const attempt = await getPracticeAttempt(user.id, attemptId);
  if (!attempt) notFound();
  if (attempt.status === "abandoned") redirect("/practice");

  return (
    <PracticeWorkspace aiCoachEnabled={isAiCoachEnabled()} attempt={attempt} />
  );
}
