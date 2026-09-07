import type { MockInterviewPhase } from "@/domain/mock-interview";
import type {
  CodeReviewContext,
  CreateRealtimeSessionInput,
  RealtimeInterviewProvider,
  RealtimeInterviewSession,
} from "@/features/realtime-interviews/provider";
import {
  buildCodeReviewMessage,
  parseInterviewControlToolCall,
} from "@/features/realtime-interviews/provider";

type RealtimeServerEvent = {
  arguments?: string;
  call_id?: string;
  delta?: string;
  error?: { message?: string };
  name?: string;
  text?: string;
  transcript?: string;
  type?: string;
};

export type ParsedRealtimeServerEvent = {
  buffer: string;
  error?: string;
  functionCall?: {
    args: unknown;
    callId: string;
    name: string;
  };
  role?: "interviewer" | "learner";
  speaking?: boolean;
  transcript?: string;
};

export function parseRealtimeServerEvent(
  raw: string,
  currentBuffer = "",
): ParsedRealtimeServerEvent {
  let event: RealtimeServerEvent;
  try {
    event = JSON.parse(raw) as RealtimeServerEvent;
  } catch {
    return { buffer: currentBuffer };
  }
  if (event.type === "conversation.item.input_audio_transcription.completed") {
    return {
      buffer: currentBuffer,
      role: "learner",
      transcript: event.transcript?.trim(),
    };
  }
  if (
    event.type === "response.output_audio_transcript.delta" ||
    event.type === "response.output_text.delta"
  ) {
    return {
      buffer: currentBuffer + (event.delta ?? ""),
      speaking: true,
    };
  }
  if (
    event.type === "response.output_audio_transcript.done" ||
    event.type === "response.output_text.done"
  ) {
    return {
      buffer: "",
      role: "interviewer",
      speaking: false,
      transcript: (event.transcript ?? event.text ?? currentBuffer).trim(),
    };
  }
  if (event.type === "response.output_audio.delta") {
    return { buffer: currentBuffer, speaking: true };
  }
  if (
    event.type === "response.function_call_arguments.done" &&
    event.name &&
    event.call_id &&
    event.arguments
  ) {
    let args: unknown;
    try {
      args = JSON.parse(event.arguments);
    } catch {
      args = null;
    }
    return {
      buffer: currentBuffer,
      functionCall: { args, callId: event.call_id, name: event.name },
    };
  }
  if (event.type === "response.output_audio.done") {
    return { buffer: currentBuffer, speaking: false };
  }
  if (event.type === "error") {
    return {
      buffer: currentBuffer,
      error: event.error?.message ?? "The interviewer reported an audio error.",
    };
  }
  return { buffer: currentBuffer };
}

export class OpenAiWebRtcInterviewProvider implements RealtimeInterviewProvider {
  private channel: RTCDataChannel | null = null;
  private connectionDirective = "";
  private connectionAttemptId: string | null = null;
  private connectionMode: "start" | "resume" = "start";
  private input: CreateRealtimeSessionInput | null = null;
  private intentionalClose = false;
  private localStream: MediaStream | null = null;
  private peer: RTCPeerConnection | null = null;
  private providerCallId: string | undefined;
  private remoteAudio: HTMLAudioElement | null = null;
  private transcriptBuffer = "";

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
    input.onStateChange("connecting");

    const peer = new RTCPeerConnection();
    this.peer = peer;
    const remoteAudio = new Audio();
    remoteAudio.autoplay = true;
    this.remoteAudio = remoteAudio;
    peer.ontrack = (event) => {
      remoteAudio.srcObject = event.streams[0] ?? null;
    };
    for (const track of localStream.getTracks()) {
      peer.addTrack(track, localStream);
    }

    const channel = peer.createDataChannel("oai-events");
    this.channel = channel;
    channel.addEventListener("message", (event) => {
      this.handleServerEvent(String(event.data));
    });
    channel.addEventListener("open", () => {
      void this.confirmOpenTransport();
    });
    channel.addEventListener("close", () => {
      input.onSpeakingChange(false);
      if (!this.intentionalClose) input.onStateChange("disconnected");
    });
    peer.addEventListener("connectionstatechange", () => {
      if (peer.connectionState === "failed") {
        input.onStateChange(
          "error",
          "The live audio connection failed. Reconnect to continue.",
        );
      } else if (peer.connectionState === "disconnected") {
        input.onStateChange("reconnecting");
      }
    });

    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    const response = await fetch("/api/realtime/interview-session", {
      body: JSON.stringify({ interviewId: input.interviewId, sdp: offer.sdp }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    if (!response.ok) {
      const detail = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;
      throw new Error(
        detail?.message ?? "The realtime interview could not be connected.",
      );
    }
    const answer = (await response.json()) as {
      connectionAttemptId: string;
      connectionDirective: string;
      connectionMode: "start" | "resume";
      providerCallId?: string;
      sdp: string;
    };
    if (
      !answer.sdp ||
      !answer.connectionDirective ||
      !answer.connectionAttemptId
    ) {
      throw new Error("The realtime session response is incomplete.");
    }
    this.connectionAttemptId = answer.connectionAttemptId;
    this.connectionDirective = answer.connectionDirective;
    this.connectionMode = answer.connectionMode;
    this.providerCallId = answer.providerCallId;
    if (answer.connectionMode === "resume") {
      input.onStateChange("reconnecting", "Restoring interview context…");
    }
    try {
      await peer.setRemoteDescription({ sdp: answer.sdp, type: "answer" });
    } catch (error) {
      await input.onTransportFailed(
        answer.connectionAttemptId,
        answer.providerCallId,
      );
      this.connectionAttemptId = null;
      throw error;
    }
    return { localStream };
  }

  sendText(text: string) {
    this.sendContext(text, true);
  }

  sendCodeSnapshot(code: string, phase: MockInterviewPhase) {
    this.sendContext(
      `[CODE SNAPSHOT — ${phase}]\n${code.slice(0, 50_000)}`,
      false,
    );
  }

  sendCodeForReview(context: CodeReviewContext) {
    this.sendContext(buildCodeReviewMessage(context), true);
  }

  sendInterviewEvent(phase: MockInterviewPhase, context: string) {
    this.sendContext(
      `[INTERVIEW PHASE — ${phase}] ${context.slice(0, 4_000)}`,
      false,
    );
  }

  setMuted(muted: boolean) {
    for (const track of this.localStream?.getAudioTracks() ?? []) {
      track.enabled = !muted;
    }
  }

  async closeSession() {
    const pendingConnectionAttemptId = this.connectionAttemptId;
    this.connectionAttemptId = null;
    if (pendingConnectionAttemptId && this.input) {
      await this.input.onTransportFailed(
        pendingConnectionAttemptId,
        this.providerCallId,
      );
    }
    this.intentionalClose = true;
    this.input?.onSpeakingChange(false);
    this.channel?.close();
    this.peer?.close();
    for (const track of this.localStream?.getTracks() ?? []) track.stop();
    if (this.remoteAudio) this.remoteAudio.srcObject = null;
    this.channel = null;
    this.localStream = null;
    this.peer = null;
    this.remoteAudio = null;
    this.transcriptBuffer = "";
    this.connectionDirective = "";
    this.connectionMode = "start";
    this.providerCallId = undefined;
    this.input = null;
  }

  private sendContext(text: string, requestResponse: boolean) {
    this.send({
      item: {
        content: [{ text, type: "input_text" }],
        role: "user",
        type: "message",
      },
      type: "conversation.item.create",
    });
    if (requestResponse) this.send({ type: "response.create" });
  }

  private send(event: Record<string, unknown>) {
    if (this.channel?.readyState !== "open") return;
    this.channel.send(JSON.stringify(event));
  }

  private handleServerEvent(raw: string) {
    const parsed = parseRealtimeServerEvent(raw, this.transcriptBuffer);
    this.transcriptBuffer = parsed.buffer;
    if (parsed.speaking !== undefined) {
      this.input?.onSpeakingChange(parsed.speaking);
    }
    if (parsed.role && parsed.transcript) {
      this.emitTranscript(parsed.role, parsed.transcript);
    }
    if (parsed.error) {
      this.input?.onStateChange("error", parsed.error);
    }
    if (parsed.functionCall && this.input) {
      void this.handleControlToolCall(parsed.functionCall);
    }
  }

  private async handleControlToolCall(call: {
    args: unknown;
    callId: string;
    name: string;
  }) {
    const parsed = parseInterviewControlToolCall(call.name, call.args);
    const result =
      parsed && this.input
        ? await this.input.onControlToolCall({
            ...parsed,
            idempotencyKey: call.callId,
          })
        : {
            code: "invalid_control_tool",
            message: "Invalid or unavailable interview control action.",
            status: "error" as const,
          };
    this.send({
      item: {
        call_id: call.callId,
        output: JSON.stringify(result),
        type: "function_call_output",
      },
      type: "conversation.item.create",
    });
    this.send({ type: "response.create" });
  }

  private async confirmOpenTransport() {
    const attemptId = this.connectionAttemptId;
    const input = this.input;
    if (!attemptId || !input) return;
    try {
      await input.onTransportReady({
        connectionAttemptId: attemptId,
        providerCallId: this.providerCallId,
      });
      this.connectionAttemptId = null;
      input.onStateChange(
        "connected",
        this.connectionMode === "resume"
          ? "Interview context restored."
          : undefined,
      );
      this.sendContext(this.connectionDirective, true);
    } catch (error) {
      this.connectionAttemptId = null;
      await input.onTransportFailed(attemptId, this.providerCallId);
      input.onStateChange(
        "error",
        error instanceof Error
          ? error.message
          : "The voice connection could not be confirmed.",
      );
      await this.closeSession();
    }
  }

  private emitTranscript(role: "interviewer" | "learner", text: string) {
    const normalized = text.trim();
    if (!normalized) return;
    this.input?.onTranscript({
      id: crypto.randomUUID(),
      role,
      text: normalized,
    });
  }
}
