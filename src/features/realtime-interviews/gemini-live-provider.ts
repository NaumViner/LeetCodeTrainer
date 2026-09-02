import {
  EndSensitivity,
  GoogleGenAI,
  Modality,
  StartSensitivity,
  type LiveServerMessage,
  type Session,
} from "@google/genai";

import type { MockInterviewPhase } from "@/domain/mock-interview";
import type {
  CreateRealtimeSessionInput,
  CodeReviewContext,
  RealtimeInterviewProvider,
  RealtimeInterviewSession,
} from "@/features/realtime-interviews/provider";
import {
  buildCodeReviewMessage,
  parsePhaseSuggestionToolArguments,
  PHASE_SUGGESTION_TOOL,
} from "@/features/realtime-interviews/provider";

type GeminiSessionCredentials = {
  expiresAt: string;
  instructions: string;
  model: string;
  token: string;
  voice: string;
};

export class GeminiLiveInterviewProvider implements RealtimeInterviewProvider {
  private captureContext: AudioContext | null = null;
  private captureProcessor: ScriptProcessorNode | null = null;
  private input: CreateRealtimeSessionInput | null = null;
  private intentionalClose = false;
  private interviewerTranscript = "";
  private learnerTranscript = "";
  private localStream: MediaStream | null = null;
  private muted = false;
  private nextPlaybackTime = 0;
  private outputContext: AudioContext | null = null;
  private playbackSources = new Set<AudioBufferSourceNode>();
  private reconnecting = false;
  private resumptionHandle: string | null = null;
  private session: Session | null = null;
  private sessionCredentials: GeminiSessionCredentials | null = null;

  async createSession(
    input: CreateRealtimeSessionInput,
  ): Promise<RealtimeInterviewSession> {
    await this.closeSession();
    this.intentionalClose = false;
    this.input = input;
    input.onStateChange("requesting_microphone");
    const localStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        autoGainControl: true,
        echoCancellation: true,
        noiseSuppression: true,
      },
    });
    this.localStream = localStream;
    try {
      input.onStateChange("connecting");
      this.sessionCredentials = await requestGeminiSession(input.interviewId);
      await this.connectLiveSession(false);
      this.startCapture(localStream);
      return { localStream };
    } catch (error) {
      await this.closeSession();
      throw error;
    }
  }

  sendText(text: string) {
    this.session?.sendClientContent({ turns: text, turnComplete: true });
  }

  sendCodeSnapshot(code: string, phase: MockInterviewPhase) {
    this.sendSilentContext(
      `[CODE SNAPSHOT — ${phase}]\n${code.slice(0, 50_000)}`,
    );
  }

  sendCodeForReview(context: CodeReviewContext) {
    this.session?.sendClientContent({
      turns: buildCodeReviewMessage(context),
      turnComplete: true,
    });
  }

  sendInterviewEvent(phase: MockInterviewPhase, context: string) {
    this.sendSilentContext(
      `[INTERVIEW PHASE — ${phase}] ${context.slice(0, 4_000)}`,
    );
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    for (const track of this.localStream?.getAudioTracks() ?? []) {
      track.enabled = !muted;
    }
    if (muted) this.session?.sendRealtimeInput({ audioStreamEnd: true });
  }

  async closeSession() {
    this.intentionalClose = true;
    this.input?.onSpeakingChange(false);
    try {
      this.session?.sendRealtimeInput({ audioStreamEnd: true });
    } catch {
      // The socket may already be closed.
    }
    this.session?.close();
    this.session = null;
    this.stopCapture();
    this.stopPlayback();
    for (const track of this.localStream?.getTracks() ?? []) track.stop();
    this.localStream = null;
    this.input = null;
    this.interviewerTranscript = "";
    this.learnerTranscript = "";
    this.resumptionHandle = null;
    this.sessionCredentials = null;
    this.reconnecting = false;
    this.muted = false;
  }

  private async connectLiveSession(resume: boolean) {
    const credentials = this.sessionCredentials;
    if (!credentials) throw new Error("The Gemini session is unavailable.");
    const ai = new GoogleGenAI({
      apiKey: credentials.token,
      httpOptions: { apiVersion: "v1beta" },
    });
    const session = await ai.live.connect({
      callbacks: {
        onclose: () => this.handleClose(),
        onerror: (event) => {
          this.input?.onStateChange(
            "error",
            event.message || "Gemini reported a live audio error.",
          );
        },
        onmessage: (message) => this.handleServerMessage(message),
        onopen: () => this.input?.onStateChange("connecting"),
      },
      config: {
        contextWindowCompression: {
          slidingWindow: { targetTokens: "8000" },
          triggerTokens: "25000",
        },
        inputAudioTranscription: {},
        maxOutputTokens: 600,
        outputAudioTranscription: {},
        realtimeInputConfig: {
          automaticActivityDetection: {
            disabled: false,
            endOfSpeechSensitivity: EndSensitivity.END_SENSITIVITY_LOW,
            prefixPaddingMs: 40,
            silenceDurationMs: 500,
            startOfSpeechSensitivity: StartSensitivity.START_SENSITIVITY_LOW,
          },
        },
        responseModalities: [Modality.AUDIO],
        sessionResumption: this.resumptionHandle
          ? { handle: this.resumptionHandle }
          : {},
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: credentials.voice },
          },
        },
        systemInstruction: credentials.instructions,
        temperature: 0.5,
        tools: [{ functionDeclarations: [PHASE_SUGGESTION_TOOL] }],
      },
      model: credentials.model,
    });
    this.session = session;
    this.reconnecting = false;
    this.input?.onStateChange("connected");
    if (!resume) {
      session.sendClientContent({
        turnComplete: true,
        turns:
          "[SYSTEM START] Begin the interview now. Follow the opening behavior required by your system instructions exactly.",
      });
    }
  }

  private startCapture(stream: MediaStream) {
    this.stopCapture();
    const context = new AudioContext({ latencyHint: "interactive" });
    const source = context.createMediaStreamSource(stream);
    const processor = context.createScriptProcessor(1_024, 1, 1);
    const silentOutput = context.createGain();
    silentOutput.gain.value = 0;
    processor.onaudioprocess = (event) => {
      if (this.muted || !this.session) return;
      const input = event.inputBuffer.getChannelData(0);
      const pcm = downsampleToPcm16(input, context.sampleRate, 16_000);
      if (!pcm.length) return;
      this.session.sendRealtimeInput({
        audio: {
          data: bytesToBase64(new Uint8Array(pcm.buffer)),
          mimeType: "audio/pcm;rate=16000",
        },
      });
    };
    source.connect(processor);
    processor.connect(silentOutput);
    silentOutput.connect(context.destination);
    this.captureContext = context;
    this.captureProcessor = processor;
    if (context.state === "suspended") void context.resume();
  }

  private stopCapture() {
    if (this.captureProcessor) {
      this.captureProcessor.onaudioprocess = null;
      this.captureProcessor.disconnect();
    }
    void this.captureContext?.close();
    this.captureProcessor = null;
    this.captureContext = null;
  }

  private handleServerMessage(message: LiveServerMessage) {
    const resumption = message.sessionResumptionUpdate;
    if (resumption?.resumable && resumption.newHandle) {
      this.resumptionHandle = resumption.newHandle;
    }
    if (message.goAway) {
      this.input?.onStateChange("reconnecting");
    }
    for (const call of message.toolCall?.functionCalls ?? []) {
      const suggestion =
        call.name === PHASE_SUGGESTION_TOOL.name && this.input
          ? parsePhaseSuggestionToolArguments(call.args, this.input.interviewId)
          : null;
      if (suggestion) this.input?.onPhaseSuggestion(suggestion);
      this.session?.sendToolResponse({
        functionResponses: {
          id: call.id,
          name: call.name,
          response: suggestion
            ? {
                output:
                  "Suggestion queued for deterministic validation and learner confirmation. The phase was not changed.",
              }
            : { error: "Invalid or out-of-order phase suggestion." },
        },
      });
    }

    const content = message.serverContent;
    if (!content) return;
    if (content.interrupted) {
      this.stopPlayback();
      this.interviewerTranscript = "";
    }
    this.consumeTranscription("learner", content.inputTranscription);
    this.consumeTranscription("interviewer", content.outputTranscription);

    for (const part of content.modelTurn?.parts ?? []) {
      const audio = part.inlineData;
      if (audio?.data && audio.mimeType?.startsWith("audio/")) {
        this.queueAudio(audio.data);
      }
    }

    if (content.generationComplete || content.turnComplete) {
      this.flushTranscript("interviewer");
    }
    if (content.turnComplete) this.flushTranscript("learner");
  }

  private consumeTranscription(
    role: "interviewer" | "learner",
    transcription: { finished?: boolean; text?: string } | undefined,
  ) {
    if (!transcription) return;
    const text = transcription.text ?? "";
    if (role === "learner") {
      this.learnerTranscript = mergeTranscript(this.learnerTranscript, text);
    } else {
      this.interviewerTranscript = mergeTranscript(
        this.interviewerTranscript,
        text,
      );
    }
    if (transcription.finished) this.flushTranscript(role);
  }

  private flushTranscript(role: "interviewer" | "learner") {
    const text =
      role === "learner"
        ? this.learnerTranscript.trim()
        : this.interviewerTranscript.trim();
    if (role === "learner") this.learnerTranscript = "";
    else this.interviewerTranscript = "";
    if (!text) return;
    this.input?.onTranscript({ id: crypto.randomUUID(), role, text });
  }

  private queueAudio(base64Audio: string) {
    const samples = base64ToFloat32Pcm(base64Audio);
    if (!samples.length) return;
    const context =
      this.outputContext ??
      new AudioContext({ latencyHint: "interactive", sampleRate: 24_000 });
    this.outputContext = context;
    if (context.state === "suspended") void context.resume();
    const buffer = context.createBuffer(1, samples.length, 24_000);
    buffer.copyToChannel(samples, 0);
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    const startAt = Math.max(context.currentTime + 0.02, this.nextPlaybackTime);
    this.nextPlaybackTime = startAt + buffer.duration;
    this.playbackSources.add(source);
    this.input?.onSpeakingChange(true);
    source.onended = () => {
      this.playbackSources.delete(source);
      if (!this.playbackSources.size) this.input?.onSpeakingChange(false);
    };
    source.start(startAt);
  }

  private stopPlayback() {
    for (const source of this.playbackSources) {
      try {
        source.stop();
      } catch {
        // A source can already be stopped by the browser.
      }
    }
    this.playbackSources.clear();
    this.nextPlaybackTime = this.outputContext?.currentTime ?? 0;
    this.input?.onSpeakingChange(false);
    void this.outputContext?.close();
    this.outputContext = null;
  }

  private sendSilentContext(text: string) {
    this.session?.sendClientContent({
      turnComplete: false,
      turns: `Silent interviewer context update. Do not respond to this message.\n${text}`,
    });
  }

  private handleClose() {
    this.session = null;
    this.input?.onSpeakingChange(false);
    if (this.intentionalClose || this.reconnecting) return;
    if (this.resumptionHandle && this.sessionCredentials) {
      this.reconnecting = true;
      this.input?.onStateChange("reconnecting");
      void this.connectLiveSession(true).catch(() => {
        this.reconnecting = false;
        this.input?.onStateChange(
          "disconnected",
          "The Gemini session ended. Reconnect to continue the interview.",
        );
      });
      return;
    }
    this.input?.onStateChange("disconnected");
  }
}

async function requestGeminiSession(interviewId: string) {
  const response = await fetch("/api/realtime/gemini-session", {
    body: JSON.stringify({ interviewId }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  const data = (await response.json().catch(() => null)) as
    (Partial<GeminiSessionCredentials> & { message?: string }) | null;
  if (!response.ok) {
    throw new Error(
      data?.message ?? "The Gemini realtime interview could not be connected.",
    );
  }
  if (
    !data?.token ||
    !data.model ||
    !data.voice ||
    !data.instructions ||
    !data.expiresAt
  ) {
    throw new Error("The Gemini session response is incomplete.");
  }
  return data as GeminiSessionCredentials;
}

export function downsampleToPcm16(
  input: Float32Array,
  inputRate: number,
  outputRate: number,
) {
  if (outputRate > inputRate || outputRate <= 0) return new Int16Array();
  const ratio = inputRate / outputRate;
  const output = new Int16Array(Math.floor(input.length / ratio));
  for (let index = 0; index < output.length; index += 1) {
    const start = Math.floor(index * ratio);
    const end = Math.min(input.length, Math.floor((index + 1) * ratio));
    let total = 0;
    for (let cursor = start; cursor < end; cursor += 1) {
      total += input[cursor] ?? 0;
    }
    const sample = Math.max(-1, Math.min(1, total / Math.max(1, end - start)));
    output[index] = sample < 0 ? sample * 32_768 : sample * 32_767;
  }
  return output;
}

export function mergeTranscript(current: string, next: string) {
  const normalized = next.trim();
  if (!normalized) return current;
  if (!current) return normalized;
  if (normalized.startsWith(current)) return normalized;
  if (current.endsWith(normalized)) return current;
  return `${current}${/\s$/.test(current) ? "" : " "}${normalized}`;
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToFloat32Pcm(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  const view = new DataView(bytes.buffer);
  const samples = new Float32Array(Math.floor(bytes.length / 2));
  for (let index = 0; index < samples.length; index += 1) {
    samples[index] = view.getInt16(index * 2, true) / 32_768;
  }
  return samples;
}
