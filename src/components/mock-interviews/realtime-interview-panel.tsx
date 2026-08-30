"use client";

import {
  AudioLines,
  Mic,
  MicOff,
  Radio,
  RefreshCcw,
  Send,
  Volume2,
} from "lucide-react";
import {
  type FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { MockInterviewPhase } from "@/domain/mock-interview";
import {
  endRealtimeInterviewSessionAction,
  saveRealtimeInterviewEventAction,
} from "@/features/realtime-interviews/actions";
import type {
  RealtimeConnectionState,
  RealtimeTranscriptEntry,
} from "@/features/realtime-interviews/model";
import { OpenAiWebRtcInterviewProvider } from "@/features/realtime-interviews/openai-webrtc-provider";

export type RealtimeContextUpdate = {
  content: string;
  eventType: "code_snapshot" | "phase_context";
  id: string;
  phase: MockInterviewPhase;
};

export function RealtimeInterviewPanel({
  contextUpdate,
  initialTranscript,
  interviewId,
  phase,
}: {
  contextUpdate: RealtimeContextUpdate | null;
  initialTranscript: RealtimeTranscriptEntry[];
  interviewId: string;
  phase: MockInterviewPhase;
}) {
  const providerRef = useRef<OpenAiWebRtcInterviewProvider | null>(null);
  const persistedContextRef = useRef<string | null>(null);
  const phaseRef = useRef(phase);
  const animationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [connectionState, setConnectionState] =
    useState<RealtimeConnectionState>("idle");
  const [transcript, setTranscript] = useState(initialTranscript);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [inputLevel, setInputLevel] = useState(0);
  const [message, setMessage] = useState("");

  const persistEvent = useCallback(
    async (input: {
      content: string;
      eventType:
        | "assistant_transcript"
        | "code_snapshot"
        | "connection"
        | "phase_context"
        | "user_transcript";
      phase: MockInterviewPhase;
    }) => {
      const result = await saveRealtimeInterviewEventAction(interviewId, input);
      if (result.status === "error") setMessage(result.message);
    },
    [interviewId],
  );

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    return () => {
      if (animationRef.current !== null)
        cancelAnimationFrame(animationRef.current);
      void audioContextRef.current?.close();
      void providerRef.current?.closeSession();
    };
  }, []);

  useEffect(() => {
    if (
      connectionState !== "connected" ||
      !contextUpdate ||
      persistedContextRef.current === contextUpdate.id
    ) {
      return;
    }
    persistedContextRef.current = contextUpdate.id;
    if (contextUpdate.eventType === "code_snapshot") {
      providerRef.current?.sendCodeSnapshot(
        contextUpdate.content,
        contextUpdate.phase,
      );
    } else {
      providerRef.current?.sendInterviewEvent(
        contextUpdate.phase,
        contextUpdate.content,
      );
    }
    void persistEvent({
      content: contextUpdate.content,
      eventType: contextUpdate.eventType,
      phase: contextUpdate.phase,
    });
  }, [connectionState, contextUpdate, persistEvent]);

  const connect = async () => {
    setMessage("");
    await providerRef.current?.closeSession();
    stopInputMeter();
    const provider = new OpenAiWebRtcInterviewProvider();
    providerRef.current = provider;
    try {
      const session = await provider.createSession({
        interviewId,
        onSpeakingChange: setIsSpeaking,
        onStateChange: (state, detail) => {
          setConnectionState(state);
          if (detail) setMessage(detail);
          if (state === "connected") {
            void persistEvent({
              content: "Live voice connected.",
              eventType: "connection",
              phase: phaseRef.current,
            });
          }
        },
        onTranscript: (entry) => {
          setTranscript((current) => [...current, entry]);
          void persistEvent({
            content: entry.text,
            eventType:
              entry.role === "learner"
                ? "user_transcript"
                : "assistant_transcript",
            phase: phaseRef.current,
          });
        },
      });
      startInputMeter(session.localStream);
      setIsMuted(false);
    } catch (error) {
      await provider.closeSession();
      setConnectionState("error");
      setMessage(
        error instanceof DOMException && error.name === "NotAllowedError"
          ? "Microphone access was denied. Allow microphone access and reconnect."
          : error instanceof Error
            ? error.message
            : "The live interviewer could not connect.",
      );
    }
  };

  const disconnect = async (status: "disconnected" | "error") => {
    await providerRef.current?.closeSession();
    stopInputMeter();
    setConnectionState(status === "error" ? "error" : "disconnected");
    setIsSpeaking(false);
    const learnerTurns = transcript.filter(
      (entry) => entry.role === "learner",
    ).length;
    const interviewerTurns = transcript.length - learnerTurns;
    const result = await endRealtimeInterviewSessionAction(interviewId, {
      status,
      summary: `Voice session ended during ${phase} after ${learnerTurns} learner turns and ${interviewerTurns} interviewer turns.`,
    });
    if (result.status === "error") setMessage(result.message);
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    providerRef.current?.setMuted(nextMuted);
    setIsMuted(nextMuted);
  };

  const sendText = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const text = String(data.get("message")).trim();
    if (!text) return;
    providerRef.current?.sendText(text);
    const entry = { id: crypto.randomUUID(), role: "learner" as const, text };
    setTranscript((current) => [...current, entry]);
    void persistEvent({
      content: text,
      eventType: "user_transcript",
      phase,
    });
    form.reset();
  };

  const startInputMeter = (stream: MediaStream) => {
    stopInputMeter();
    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    const values = new Uint8Array(analyser.frequencyBinCount);
    const measure = () => {
      analyser.getByteTimeDomainData(values);
      let sum = 0;
      for (const value of values) {
        const normalized = (value - 128) / 128;
        sum += normalized * normalized;
      }
      setInputLevel(
        Math.min(100, Math.round(Math.sqrt(sum / values.length) * 280)),
      );
      animationRef.current = requestAnimationFrame(measure);
    };
    measure();
  };

  const stopInputMeter = () => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    void audioContextRef.current?.close();
    audioContextRef.current = null;
    setInputLevel(0);
  };

  const connected = connectionState === "connected";
  const connecting = ["connecting", "requesting_microphone"].includes(
    connectionState,
  );
  return (
    <Card>
      <CardContent className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="flex items-center gap-2 font-semibold">
                <Radio aria-hidden="true" className="text-primary size-4" />
                Live interviewer
              </h2>
              <ConnectionBadge state={connectionState} />
              {isSpeaking ? (
                <Badge variant="primary">
                  <Volume2 aria-hidden="true" className="size-3.5" /> Speaking
                </Badge>
              ) : null}
            </div>
            <p className="text-muted mt-2 text-sm leading-6">
              Voice is optional. Your transcript and phase context are saved
              privately with this interview.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!connected ? (
              <Button disabled={connecting} onClick={connect}>
                {connectionState === "idle" ? (
                  <Mic aria-hidden="true" className="size-4" />
                ) : (
                  <RefreshCcw aria-hidden="true" className="size-4" />
                )}
                {connecting
                  ? "Connecting…"
                  : connectionState === "idle"
                    ? "Start voice interview"
                    : "Reconnect"}
              </Button>
            ) : (
              <>
                <Button onClick={toggleMute} variant="secondary">
                  {isMuted ? (
                    <MicOff aria-hidden="true" className="size-4" />
                  ) : (
                    <Mic aria-hidden="true" className="size-4" />
                  )}
                  {isMuted ? "Unmute" : "Mute"}
                </Button>
                <Button
                  onClick={() => disconnect("disconnected")}
                  variant="ghost"
                >
                  End voice
                </Button>
              </>
            )}
          </div>
        </div>

        {connected ? (
          <div
            className="mt-5 flex items-center gap-3"
            aria-label={`Microphone input level ${inputLevel} percent`}
          >
            <AudioLines aria-hidden="true" className="text-primary size-4" />
            <div className="bg-surface-subtle h-2 flex-1 overflow-hidden rounded-full">
              <div
                className="bg-primary h-full rounded-full transition-[width] duration-100"
                style={{ width: `${isMuted ? 0 : inputLevel}%` }}
              />
            </div>
            <span className="text-muted text-xs">
              {isMuted ? "Muted" : "Mic live"}
            </span>
          </div>
        ) : null}

        {message ? (
          <p
            aria-live="polite"
            className="bg-danger-soft text-danger mt-5 rounded-lg px-4 py-3 text-sm"
          >
            {message}
          </p>
        ) : null}

        <div
          className="bg-surface-subtle mt-5 max-h-72 space-y-3 overflow-y-auto rounded-xl border p-4"
          aria-label="Live interview transcript"
          aria-live="polite"
        >
          {transcript.length ? (
            transcript.map((entry) => (
              <div
                className={entry.role === "interviewer" ? "mr-8" : "ml-8"}
                key={entry.id}
              >
                <p className="text-muted text-xs font-semibold uppercase">
                  {entry.role === "interviewer" ? "Interviewer" : "You"}
                </p>
                <p className="mt-1 text-sm leading-6">{entry.text}</p>
              </div>
            ))
          ) : (
            <p className="text-muted text-sm">
              Start voice to hear the interviewer and see the transcript here.
            </p>
          )}
        </div>

        {connected ? (
          <form className="mt-4 flex gap-2" onSubmit={sendText}>
            <label className="sr-only" htmlFor="realtime-message">
              Type a message to the interviewer
            </label>
            <input
              className="bg-surface focus:border-primary min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm outline-none"
              id="realtime-message"
              maxLength={2_000}
              name="message"
              placeholder="Type instead of speaking…"
            />
            <Button
              aria-label="Send typed message"
              type="submit"
              variant="secondary"
            >
              <Send aria-hidden="true" className="size-4" />
            </Button>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ConnectionBadge({ state }: { state: RealtimeConnectionState }) {
  const label: Record<RealtimeConnectionState, string> = {
    connected: "Connected",
    connecting: "Connecting",
    disconnected: "Disconnected",
    error: "Connection error",
    idle: "Optional",
    reconnecting: "Reconnecting",
    requesting_microphone: "Requesting microphone",
  };
  return (
    <Badge
      variant={
        state === "connected"
          ? "success"
          : state === "error"
            ? "danger"
            : "neutral"
      }
    >
      {label[state]}
    </Badge>
  );
}
