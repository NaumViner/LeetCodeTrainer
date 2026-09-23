import { InterviewEntry } from "@/components/mock-interviews/interview-entry";
export const dynamic = "force-dynamic";
export default async function MockInterviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const { notice } = await searchParams;
  return (
    <>
      {notice === "password_updated" ? (
        <p role="status" className="bg-success-soft mb-6 rounded-lg p-4">
          Your password was updated. You are signed in.
        </p>
      ) : null}
      <InterviewEntry />
    </>
  );
}
