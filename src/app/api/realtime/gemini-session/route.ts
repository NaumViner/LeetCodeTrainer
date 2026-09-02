import { GoogleGenAI } from "@google/genai";

import { getAuthenticatedUser } from "@/features/auth/session";
import { getLearnerVisibleQuestionContent } from "@/features/interview-evaluation/question-content";
import { getMockInterview } from "@/features/mock-interviews/queries";
import { getInterviewRolloutConfig } from "@/features/mock-interviews/rollout";
import { getRealtimeInterviewConfig } from "@/features/realtime-interviews/config";
import { buildInterviewInstructions } from "@/features/realtime-interviews/instructions";
import { geminiRealtimeSessionRequestSchema } from "@/features/realtime-interviews/model";
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

  const interview = await getMockInterview(user.id, parsed.data.interviewId);
  if (!interview || interview.status !== "active") {
    return Response.json(
      { message: "The active interview is unavailable." },
      { status: 404 },
    );
  }
  const questionContent = getInterviewRolloutConfig().promptContentEnabled
    ? getLearnerVisibleQuestionContent(
        interview.problem.slug,
        interview.question_content_version,
      )
    : null;

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

  const supabase = await createClient();
  const { error } = await supabase.rpc("begin_realtime_interview_session", {
    p_mock_interview_id: interview.id,
    p_model: config.model,
    p_provider: config.provider,
  });
  if (error) {
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

  return Response.json({
    expiresAt,
    instructions: buildInterviewInstructions(interview, questionContent),
    model: config.model,
    token: token.name,
    voice: config.voice,
  });
}
