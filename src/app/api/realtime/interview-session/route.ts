import { getAuthenticatedUser } from "@/features/auth/session";
import { getMockInterview } from "@/features/mock-interviews/queries";
import { getRealtimeInterviewConfig } from "@/features/realtime-interviews/config";
import { realtimeSessionRequestSchema } from "@/features/realtime-interviews/model";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const [user, config] = await Promise.all([
    getAuthenticatedUser(),
    Promise.resolve(getRealtimeInterviewConfig()),
  ]);
  if (!user) {
    return Response.json(
      { message: "Sign in to start voice." },
      { status: 401 },
    );
  }
  if (!config) {
    return Response.json(
      { message: "The realtime interviewer is not configured." },
      { status: 503 },
    );
  }
  const parsed = realtimeSessionRequestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return Response.json(
      { message: "The realtime connection request is invalid." },
      { status: 400 },
    );
  }
  const interview = await getMockInterview(user.id, parsed.data.interviewId);
  if (!interview || interview.status !== "active") {
    return Response.json(
      { message: "The active interview is unavailable." },
      { status: 404 },
    );
  }

  const form = new FormData();
  form.append(
    "sdp",
    new Blob([parsed.data.sdp], { type: "application/sdp" }),
    "offer.sdp",
  );
  form.append(
    "session",
    new Blob(
      [
        JSON.stringify({
          audio: {
            input: {
              transcription: { model: config.transcriptionModel },
              turn_detection: {
                create_response: true,
                interrupt_response: true,
                type: "server_vad",
              },
            },
            output: { voice: config.voice },
          },
          instructions: buildInterviewInstructions(interview),
          max_output_tokens: 500,
          model: config.model,
          output_modalities: ["audio"],
          type: "realtime",
        }),
      ],
      { type: "application/json" },
    ),
    "session.json",
  );

  const providerResponse = await fetch(
    "https://api.openai.com/v1/realtime/calls",
    {
      body: form,
      headers: { Authorization: `Bearer ${config.apiKey}` },
      method: "POST",
      signal: AbortSignal.timeout(15_000),
    },
  ).catch(() => null);
  if (!providerResponse?.ok) {
    return Response.json(
      { message: "The voice provider could not create a session." },
      { status: 502 },
    );
  }

  const answerSdp = await providerResponse.text();
  const location = providerResponse.headers.get("Location");
  const providerCallId = location?.split("/").filter(Boolean).at(-1);
  const supabase = await createClient();
  const { error } = await supabase.rpc("begin_realtime_interview_session", {
    p_mock_interview_id: interview.id,
    p_model: config.model,
    p_provider: config.provider,
    p_provider_call_id: providerCallId,
  });
  if (error) {
    if (providerCallId) await hangUpProviderCall(providerCallId, config.apiKey);
    return Response.json(
      { message: "The voice session could not be recorded securely." },
      { status: 502 },
    );
  }
  return Response.json({ sdp: answerSdp });
}

function buildInterviewInstructions(
  interview: NonNullable<Awaited<ReturnType<typeof getMockInterview>>>,
) {
  return [
    "You are conducting a realistic technical coding interview.",
    "Greet the learner briefly, ask one concise question at a time, listen to their reasoning, and use follow-up questions instead of giving the solution.",
    "Do not reveal the hidden topic, pattern, or an optimal solution. Never invent problem constraints; ask the learner to consult or clarify the original prompt when needed.",
    "Bracketed CODE SNAPSHOT and INTERVIEW PHASE messages are silent context updates, not spoken learner turns. Use them to ask relevant questions without reading them aloud.",
    `Problem title: ${interview.problem.title}. Difficulty: ${interview.problem.difficulty}.`,
    `Current phase: ${interview.phase}. Keep responses under about 45 seconds.`,
  ].join("\n");
}

async function hangUpProviderCall(callId: string, apiKey: string) {
  await fetch(`https://api.openai.com/v1/realtime/calls/${callId}/hangup`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    method: "POST",
    signal: AbortSignal.timeout(5_000),
  }).catch(() => null);
}
