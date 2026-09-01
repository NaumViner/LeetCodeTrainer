import { afterEach, describe, expect, it, vi } from "vitest";

import { getRealtimeInterviewConfig } from "@/features/realtime-interviews/config";
import {
  downsampleToPcm16,
  mergeTranscript,
} from "@/features/realtime-interviews/gemini-live-provider";
import {
  geminiRealtimeSessionRequestSchema,
  realtimeEventInputSchema,
  realtimeSessionRequestSchema,
} from "@/features/realtime-interviews/model";
import { buildInterviewInstructions } from "@/features/realtime-interviews/instructions";
import { parseRealtimeServerEvent } from "@/features/realtime-interviews/openai-webrtc-provider";

afterEach(() => vi.unstubAllEnvs());

describe("realtime interviewer configuration", () => {
  it("stays disabled without the explicit server-only flag", () => {
    vi.stubEnv("REALTIME_AI_API_KEY", "secret-test-key");
    vi.stubEnv("REALTIME_AI_ENABLED", "false");
    expect(getRealtimeInterviewConfig()).toBeNull();
  });

  it("stays disabled while the Gemini setup placeholder is present", () => {
    vi.stubEnv("GEMINI_API_KEY", "replace-with-your-gemini-api-key");
    vi.stubEnv("REALTIME_AI_ENABLED", "true");
    vi.stubEnv("REALTIME_AI_PROVIDER", "gemini");
    expect(getRealtimeInterviewConfig()).toBeNull();
  });

  it("builds a bounded OpenAI configuration when enabled", () => {
    vi.stubEnv("REALTIME_AI_API_KEY", "secret-test-key");
    vi.stubEnv("REALTIME_AI_ENABLED", "true");
    vi.stubEnv("REALTIME_AI_PROVIDER", "openai");
    expect(getRealtimeInterviewConfig()).toMatchObject({
      model: "gpt-realtime",
      provider: "openai",
      transcriptionModel: "gpt-4o-mini-transcribe",
      voice: "marin",
    });
  });

  it("uses one Gemini key for the default live configuration", () => {
    vi.stubEnv("GEMINI_API_KEY", "gemini-test-key");
    vi.stubEnv("REALTIME_AI_ENABLED", "true");
    vi.stubEnv("REALTIME_AI_PROVIDER", "gemini");
    vi.stubEnv("REALTIME_AI_MODEL", "");
    vi.stubEnv("REALTIME_AI_VOICE", "");
    expect(getRealtimeInterviewConfig()).toMatchObject({
      model: "gemini-3.1-flash-live-preview",
      provider: "gemini",
      voice: "Kore",
    });
  });
});

describe("realtime interviewer protocol", () => {
  it("builds a supportive beginner persona", () => {
    const instructions = buildInterviewInstructions({
      interview_language: "auto",
      interviewer_level: "beginner",
      phase: "intro",
      problem: { difficulty: "easy", title: "Two Sum" },
    });
    expect(instructions).toContain("entry-level technical coding interview");
    expect(instructions).toContain("gently redirect");
    expect(instructions).not.toContain("CRITICAL BLANK WALL RULE");
  });

  it("builds the zero-hint tough FAANG persona", () => {
    const instructions = buildInterviewInstructions({
      interview_language: "hebrew",
      interviewer_level: "faang_tough",
      phase: "intro",
      problem: { difficulty: "medium", title: "Remove Nth Node" },
    });
    expect(instructions).toContain("CRITICAL BLANK WALL RULE");
    expect(instructions).toContain("Give zero hints");
    expect(instructions).toContain("Give zero validation");
    expect(instructions).toContain("Can we do better?");
    expect(instructions).toContain(
      "I have pasted the problem on the board. What are your clarifying questions?",
    );
    expect(instructions).toContain("dry-run it step by step");
    expect(instructions).toContain("consistently in Hebrew");
    expect(instructions).toContain("never translate or rewrite source code");
  });

  it("validates SDP handshakes and bounded persisted events", () => {
    expect(
      realtimeSessionRequestSchema.safeParse({
        interviewId: "018f2468-1234-7abc-8def-123456789abc",
        sdp: "v=0\r\no=- 123 456 IN IP4 127.0.0.1\r\n",
      }).success,
    ).toBe(true);
    expect(
      geminiRealtimeSessionRequestSchema.safeParse({
        interviewId: "018f2468-1234-7abc-8def-123456789abc",
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

  it("converts microphone samples to Gemini PCM and merges transcripts", () => {
    expect(
      Array.from(downsampleToPcm16(new Float32Array([1, 1, -1, -1]), 4, 2)),
    ).toEqual([32_767, -32_768]);
    expect(mergeTranscript("Walk me", "Walk me through it.")).toBe(
      "Walk me through it.",
    );
    expect(mergeTranscript("I would", "start simple.")).toBe(
      "I would start simple.",
    );
  });
});
