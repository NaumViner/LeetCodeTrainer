import { afterEach, describe, expect, it, vi } from "vitest";
import type { LiveServerMessage } from "@google/genai";

import { GeminiLiveInterviewProvider } from "@/features/realtime-interviews/gemini-live-provider";

class FakeAudioSource {
  buffer = null;
  connect = vi.fn();
  disconnect = vi.fn();
  start = vi.fn<(when: number) => void>();
  stop = vi.fn();
  onended: (() => void) | null = null;
}

class FakeAudioContext {
  static instances: FakeAudioContext[] = [];
  currentTime = 0;
  state = "running";
  destination = {};
  sources: FakeAudioSource[] = [];
  close = vi.fn(async () => {
    this.state = "closed";
  });
  constructor() {
    FakeAudioContext.instances.push(this);
  }
  createBuffer() {
    return { duration: 1, copyToChannel: vi.fn() };
  }
  createBufferSource() {
    const source = new FakeAudioSource();
    this.sources.push(source);
    return source;
  }
}

// Feed the same events delivered by the SDK without opening a live microphone.
function playbackHarness() {
  FakeAudioContext.instances = [];
  vi.stubGlobal("AudioContext", FakeAudioContext);
  const provider = new GeminiLiveInterviewProvider();
  const events = provider as unknown as {
    handleServerMessage(message: LiveServerMessage): void;
  };
  const audio = () =>
    events.handleServerMessage({
      serverContent: {
        modelTurn: {
          parts: [
            { inlineData: { data: "AAA=", mimeType: "audio/pcm;rate=24000" } },
          ],
        },
      },
    } as LiveServerMessage);
  const interrupt = () =>
    events.handleServerMessage({
      serverContent: { interrupted: true },
    } as LiveServerMessage);
  return { provider, audio, interrupt };
}

afterEach(() => vi.unstubAllGlobals());

describe("Gemini audio playback", () => {
  it("plays immediately after repeated interruptions late in a conversation", () => {
    const { audio, interrupt } = playbackHarness();
    audio();
    const context = FakeAudioContext.instances[0]!;
    for (const elapsed of [45, 120, 300]) {
      context.currentTime = elapsed;
      const previous = context.sources.at(-1)!;
      interrupt();
      expect(previous.stop).toHaveBeenCalled();
      expect(previous.disconnect).toHaveBeenCalled();
      audio();
      const active = FakeAudioContext.instances.at(-1)!;
      const startAt = active.sources.at(-1)!.start.mock.calls[0]![0];
      expect(startAt - active.currentTime).toBeCloseTo(0.02);
    }
    expect(context.close).not.toHaveBeenCalled();
  });

  it("resets the audio clock and closes resources when the session ends", async () => {
    const { provider, audio } = playbackHarness();
    audio();
    const oldContext = FakeAudioContext.instances[0]!;
    oldContext.currentTime = 120;
    await provider.closeSession();
    expect(oldContext.close).toHaveBeenCalledOnce();
    audio();
    const newContext = FakeAudioContext.instances.at(-1)!;
    expect(newContext).not.toBe(oldContext);
    expect(newContext.sources[0]!.start).toHaveBeenCalledWith(0.02);
  });
});
