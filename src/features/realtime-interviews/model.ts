import { z } from "zod";

import { MOCK_INTERVIEW_PHASES } from "@/domain/mock-interview";

export const realtimeSessionRequestSchema = z.object({
  interviewId: z.uuid(),
  sdp: z.string().min(20).max(200_000),
});

export const geminiRealtimeSessionRequestSchema = z.object({
  interviewId: z.uuid(),
});

export const realtimeEventInputSchema = z
  .object({
    content: z.string().trim().min(1).max(50_000),
    eventType: z.enum([
      "user_transcript",
      "assistant_transcript",
      "code_snapshot",
      "phase_context",
      "connection",
    ]),
    phase: z.enum(MOCK_INTERVIEW_PHASES.slice(0, -1)).nullable(),
  })
  .superRefine((value, context) => {
    if (value.eventType !== "code_snapshot" && value.content.length > 8_000) {
      context.addIssue({
        code: "too_big",
        maximum: 8_000,
        origin: "string",
        path: ["content"],
        type: "string",
      });
    }
  });

export const realtimeSessionEndSchema = z.object({
  status: z.enum(["disconnected", "error"]),
  summary: z.string().trim().max(2_000).optional(),
});

export type RealtimeEventInput = z.infer<typeof realtimeEventInputSchema>;

export type RealtimeTranscriptEntry = {
  id: string;
  role: "interviewer" | "learner";
  text: string;
};

export type RealtimeConnectionState =
  | "idle"
  | "requesting_microphone"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected"
  | "error";
