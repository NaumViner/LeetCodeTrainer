import "server-only";

import { realtimeConnectionSnapshotSchema } from "@/features/realtime-interviews/model";
import { createClient } from "@/lib/supabase/server";

export async function prepareRealtimeInterviewConnection(
  interviewId: string,
  connectionAttemptId: string,
) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc(
    "prepare_realtime_interview_connection",
    {
      p_connection_attempt_id: connectionAttemptId,
      p_mock_interview_id: interviewId,
    },
  );
  const snapshot = realtimeConnectionSnapshotSchema.safeParse(data);
  if (error || !snapshot.success) return null;
  const { data: allowed, error: quotaError } = await supabase.rpc(
    "reserve_interview_voice_request",
    {
      p_mock_interview_id: interviewId,
      p_connection_attempt_id: connectionAttemptId,
    },
  );
  if (quotaError || allowed !== true) return null;
  return snapshot.data;
}
