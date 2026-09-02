import { getAuthenticatedUser } from "@/features/auth/session";
import { getActiveInterviewQuestionPrompt } from "@/features/interview-evaluation/question-content";
import { getOwnedActiveMockInterview } from "@/features/mock-interviews/queries";
import { getInterviewRolloutConfig } from "@/features/mock-interviews/rollout";
import { getRealtimeInterviewConfig } from "@/features/realtime-interviews/config";
import { buildInterviewInstructions } from "@/features/realtime-interviews/instructions";
import { PHASE_SUGGESTION_TOOL } from "@/features/realtime-interviews/provider";
import { realtimeSessionRequestSchema } from "@/features/realtime-interviews/model";
import { createClient } from "@/lib/supabase/server";
import { recordOperationalEvent } from "@/lib/operational-events";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const startedAt = Date.now();
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
  if (config.provider !== "openai") {
    return Response.json(
      { message: "The OpenAI realtime provider is not configured." },
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
  const interview = await getOwnedActiveMockInterview(parsed.data.interviewId);
  if (!interview) {
    return Response.json(
      { message: "The active interview is unavailable." },
      { status: 404 },
    );
  }
  const questionPrompt = getInterviewRolloutConfig().promptContentEnabled
    ? getActiveInterviewQuestionPrompt(
        interview.questionContentKey,
        interview.questionContentVersion,
      )
    : null;
  if (!questionPrompt) {
    return Response.json(
      { message: "The approved interview prompt is unavailable." },
      { status: 409 },
    );
  }

  const form = new FormData();
  form.append("sdp", parsed.data.sdp);
  form.append(
    "session",
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
      instructions: buildInterviewInstructions(
        {
          interview_language: interview.interviewLanguage,
          interviewer_level: interview.interviewerLevel,
          phase: interview.phase,
        },
        questionPrompt,
      ),
      max_output_tokens: 500,
      model: config.model,
      output_modalities: ["audio"],
      tool_choice: "auto",
      tools: [
        {
          description: PHASE_SUGGESTION_TOOL.description,
          name: PHASE_SUGGESTION_TOOL.name,
          parameters: PHASE_SUGGESTION_TOOL.parametersJsonSchema,
          type: "function",
        },
      ],
      type: "realtime",
    }),
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
    recordOperationalEvent("realtime_connection_failed", {
      latencyMs: Date.now() - startedAt,
      provider: "openai",
    });
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
    recordOperationalEvent("realtime_connection_failed", {
      interviewId: interview.id,
      latencyMs: Date.now() - startedAt,
      provider: config.provider,
    });
    return Response.json(
      { message: "The voice session could not be recorded securely." },
      { status: 502 },
    );
  }
  recordOperationalEvent("realtime_connection_succeeded", {
    interviewId: interview.id,
    latencyMs: Date.now() - startedAt,
    provider: config.provider,
  });
  return Response.json({ sdp: answerSdp });
}

async function hangUpProviderCall(callId: string, apiKey: string) {
  await fetch(`https://api.openai.com/v1/realtime/calls/${callId}/hangup`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    method: "POST",
    signal: AbortSignal.timeout(5_000),
  }).catch(() => null);
}
