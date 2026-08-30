import { afterEach, describe, expect, it, vi } from "vitest";

import { getRealtimeInterviewConfig } from "@/features/realtime-interviews/config";
import {
  realtimeEventInputSchema,
  realtimeSessionRequestSchema,
} from "@/features/realtime-interviews/model";
import { parseRealtimeServerEvent } from "@/features/realtime-interviews/openai-webrtc-provider";

afterEach(() => vi.unstubAllEnvs());

describe("realtime interviewer configuration", () => {
  it("stays disabled without the explicit server-only flag", () => {
    vi.stubEnv("REALTIME_AI_API_KEY", "secret-test-key");
    vi.stubEnv("REALTIME_AI_ENABLED", "false");
    expect(getRealtimeInterviewConfig()).toBeNull();
  });

  it("builds a bounded OpenAI configuration when enabled", () => {
    vi.stubEnv("REALTIME_AI_API_KEY", "secret-test-key");
    vi.stubEnv("REALTIME_AI_ENABLED", "true");
    expect(getRealtimeInterviewConfig()).toMatchObject({
      model: "gpt-realtime",
      provider: "openai",
      transcriptionModel: "gpt-4o-mini-transcribe",
      voice: "marin",
    });
  });
});

describe("realtime interviewer protocol", () => {
  it("validates SDP handshakes and bounded persisted events", () => {
    expect(
      realtimeSessionRequestSchema.safeParse({
        interviewId: "018f2468-1234-7abc-8def-123456789abc",
        sdp: "v=0\r\no=- 123 456 IN IP4 127.0.0.1\r\n",
      }).success,
    ).toBe(true);
    expect(
      realtimeEventInputSchema.safeParse({
        content: "x".repeat(8_001),
        eventType: "assistant_transcript",
        phase: "clarify",
      }).success,
    ).toBe(false);
    expect(
      realtimeEventInputSchema.safeParse({
        content: "x".repeat(50_000),
        eventType: "code_snapshot",
        phase: "implementation",
      }).success,
    ).toBe(true);
  });

  it("assembles interviewer transcript deltas and final learner turns", () => {
    const first = parseRealtimeServerEvent(
      JSON.stringify({
        delta: "Walk me ",
        type: "response.output_audio_transcript.delta",
      }),
    );
    const second = parseRealtimeServerEvent(
      JSON.stringify({
        delta: "through your approach.",
        type: "response.output_audio_transcript.delta",
      }),
      first.buffer,
    );
    const completed = parseRealtimeServerEvent(
      JSON.stringify({ type: "response.output_audio_transcript.done" }),
      second.buffer,
    );
    expect(completed).toMatchObject({
      buffer: "",
      role: "interviewer",
      speaking: false,
      transcript: "Walk me through your approach.",
    });

    expect(
      parseRealtimeServerEvent(
        JSON.stringify({
          transcript: "I would begin with a direct baseline.",
          type: "conversation.item.input_audio_transcription.completed",
        }),
      ),
    ).toMatchObject({
      role: "learner",
      transcript: "I would begin with a direct baseline.",
    });
  });

  it("turns provider errors into a recoverable UI message", () => {
    expect(
      parseRealtimeServerEvent(
        JSON.stringify({
          error: { message: "Connection interrupted" },
          type: "error",
        }),
      ).error,
    ).toBe("Connection interrupted");
  });
});
