import { GoogleGenAI } from "@google/genai";
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
import { geminiRealtimeSessionRequestSchema } from "@/features/realtime-interviews/model";
import { enabledInterviewControlTools } from "@/features/realtime-interviews/provider";
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
  if (!config || config.provider !== "gemini") {
    return Response.json(
      { message: "The Gemini realtime interviewer is not configured." },
      { status: 503 },
    );
  }

  const parsed = geminiRealtimeSessionRequestSchema.safeParse(
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

  const expiresAt = new Date(Date.now() + 70 * 60 * 1_000).toISOString();
  const newSessionExpiresAt = new Date(Date.now() + 60 * 1_000).toISOString();
  const client = new GoogleGenAI({
    apiKey: config.apiKey,
    httpOptions: { apiVersion: "v1beta" },
  });
  const token = await client.authTokens
    .create({
      config: {
        expireTime: expiresAt,
        newSessionExpireTime: newSessionExpiresAt,
        uses: 1,
      },
    })
    .catch(() => null);
  if (!token?.name) {
    await cancelConnectionAttempt(
      interview.id,
      connectionAttemptId,
      "provider_token_failed",
    );
    recordOperationalEvent("realtime_connection_failed", {
      latencyMs: Date.now() - startedAt,
      provider: "gemini",
    });
    return Response.json(
      {
        message:
          "Gemini could not create a live session. Check the API key and free-tier quota.",
      },
      { status: 502 },
    );
  }

  recordOperationalEvent("realtime_connection_prepared", {
    interviewId: interview.id,
    latencyMs: Date.now() - startedAt,
    provider: config.provider,
  });

  return Response.json({
    connectionAttemptId: snapshot.connectionAttemptId,
    connectionDirective: buildConnectionDirective(snapshot),
    connectionMode: snapshot.connectionMode,
    expiresAt,
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
    model: config.model,
    token: token.name,
    toolNames: controlTools.map((tool) => tool.name),
    voice: config.voice,
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
