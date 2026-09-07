import { randomUUID } from "node:crypto";

import { getAuthenticatedUser } from "@/features/auth/session";
import { getActiveInterviewQuestionPrompt } from "@/features/interview-evaluation/question-content";
import { getOwnedActiveMockInterview } from "@/features/mock-interviews/queries";
import { getInterviewRolloutConfig } from "@/features/mock-interviews/rollout";
import { getRealtimeInterviewConfig } from "@/features/realtime-interviews/config";
import {
  buildConnectionDirective,
  buildInterviewInstructions,
} from "@/features/realtime-interviews/instructions";
import { enabledInterviewControlTools } from "@/features/realtime-interviews/provider";
import { realtimeSessionRequestSchema } from "@/features/realtime-interviews/model";
import { prepareRealtimeInterviewConnection } from "@/features/realtime-interviews/session-context";
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
  const rollout = getInterviewRolloutConfig();
  const controlTools = enabledInterviewControlTools(rollout);
  const questionPrompt = rollout.promptContentEnabled
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
  const connectionAttemptId = randomUUID();
  const snapshot = await prepareRealtimeInterviewConnection(
    interview.id,
    connectionAttemptId,
  );
  if (!snapshot) {
    await cancelConnectionAttempt(
      interview.id,
      connectionAttemptId,
      "snapshot_failed",
    );
    return Response.json(
      { message: "The interview state could not be restored securely." },
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
        snapshot,
        rollout,
      ),
      max_output_tokens: 500,
      model: config.model,
      output_modalities: ["audio"],
      tool_choice: "auto",
      tools: controlTools.map((tool) => ({
        description: tool.description,
        name: tool.name,
        parameters: tool.parametersJsonSchema,
        type: "function",
      })),
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
    await cancelConnectionAttempt(
      interview.id,
      connectionAttemptId,
      "provider_session_failed",
    );
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
  recordOperationalEvent("realtime_connection_prepared", {
    interviewId: interview.id,
    latencyMs: Date.now() - startedAt,
    provider: config.provider,
  });
  return Response.json({
    connectionAttemptId: snapshot.connectionAttemptId,
    connectionDirective: buildConnectionDirective(snapshot),
    connectionMode: snapshot.connectionMode,
    providerCallId,
    sdp: answerSdp,
  });
}

async function cancelConnectionAttempt(
  interviewId: string,
  connectionAttemptId: string,
  reasonCode: string,
) {
  const supabase = await createClient();
  await supabase.rpc("cancel_realtime_interview_connection", {
    p_connection_attempt_id: connectionAttemptId,
    p_mock_interview_id: interviewId,
    p_reason_code: reasonCode,
  });
}
