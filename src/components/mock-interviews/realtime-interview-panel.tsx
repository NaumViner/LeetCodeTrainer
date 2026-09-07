"use client";

import {
  AudioLines,
  Mic,
  MicOff,
  Radio,
  RefreshCcw,
  Volume2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { MockInterviewPhase } from "@/domain/mock-interview";
import {
  activateVoiceMockInterviewAction,
  cancelRealtimeInterviewConnectionAction,
  completeFollowUpInterviewQuestionAction,
  completePrimaryInterviewQuestionAction,
  confirmRealtimeInterviewConnectionAction,
  concludeRealtimeMockInterviewAction,
  endRealtimeInterviewSessionAction,
  heartbeatVoiceMockInterviewAction,
  recordInterviewSolutionReadinessAction,
  recordLiveInterviewStageAction,
  requestInterviewFollowUpAction,
  saveRealtimeInterviewEventAction,
  type InterviewControlActionResult,
} from "@/features/realtime-interviews/actions";
import type {
  RealtimeConnectionState,
  RealtimeTranscriptEntry,
} from "@/features/realtime-interviews/model";
import { GeminiLiveInterviewProvider } from "@/features/realtime-interviews/gemini-live-provider";
import { OpenAiWebRtcInterviewProvider } from "@/features/realtime-interviews/openai-webrtc-provider";
import type {
  InterviewControlToolCall,
  InterviewControlToolResult,
  RealtimeInterviewProvider,
  RealtimeInterviewProviderName,
} from "@/features/realtime-interviews/provider";

export type RealtimeContextUpdate = {
  content: string;
  eventType: "code_snapshot" | "phase_context";
  id: string;
  phase: MockInterviewPhase;
  review?: {
    advanceToTesting: boolean;
    language: "java" | "python";
    snapshotVersion: number;
  };
};

export function RealtimeInterviewPanel({
  contextUpdate,
  concluding = false,
  interviewId,
  onConnectionStateChange,
  onConversationStateChange,
  onObservedPhaseChange,
  onTrackingStatusChange,
  onTranscript,
  onVoiceActivated,
  phase,
  providerName,
}: {
  contextUpdate: RealtimeContextUpdate | null;
  concluding?: boolean;
  interviewId: string;
  onConnectionStateChange(state: RealtimeConnectionState): void;
  onConversationStateChange(input: {
    followUpPrompt?: string;
    lifecycle: string;
    questionCycle?: "primary" | "follow_up";
    remainingSeconds?: number;
  }): void;
  onObservedPhaseChange(input: {
    observedPhase: Exclude<MockInterviewPhase, "completed">;
    observedPhaseEventId: string | null;
  }): void;
  onTrackingStatusChange(
    status: "available" | "reconnecting" | "unavailable",
  ): void;
  onTranscript(entry: RealtimeTranscriptEntry): void;
  onVoiceActivated(input: {
    elapsedSeconds: number;
    startedAt: string;
    timerRunning: boolean;
  }): void;
  phase: MockInterviewPhase;
  providerName: RealtimeInterviewProviderName;
}) {
  const providerRef = useRef<RealtimeInterviewProvider | null>(null);
  const persistedContextRef = useRef<string | null>(null);
  const phaseRef = useRef(phase);
  const animationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const conclusionTimerRef = useRef<number | null>(null);
  const evidenceEventIdsRef = useRef<string[]>([]);
  const latestTranscriptEventIdRef = useRef<string | null>(null);
  const transcriptPersistenceRef = useRef<Promise<string | null> | null>(null);
  const autoConnectAttemptedRef = useRef(false);
  const activationInFlightRef = useRef(false);
  const voiceVerifiedRef = useRef(false);
  const endedStateRef = useRef<"disconnected" | "error" | null>(null);
  const turnCountsRef = useRef({ interviewer: 0, learner: 0 });
  const [connectionState, setConnectionState] =
    useState<RealtimeConnectionState>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [inputLevel, setInputLevel] = useState(0);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"error" | "status">("status");
  const [interviewConcluded, setInterviewConcluded] = useState(concluding);

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
      if (result.status === "error") {
        setMessage(result.message);
        return null;
      }
      if (
        input.phase === phaseRef.current &&
        [
          "assistant_transcript",
          "code_snapshot",
          "phase_context",
          "user_transcript",
        ].includes(input.eventType)
      ) {
        evidenceEventIdsRef.current = [
          ...evidenceEventIdsRef.current,
          result.eventId,
        ].slice(-12);
      }
      return result.eventId;
    },
    [interviewId],
  );

  const handleControlToolCall = useCallback(
    async (
      call: InterviewControlToolCall,
    ): Promise<InterviewControlToolResult> => {
      await transcriptPersistenceRef.current;
      const evidenceEventId = latestTranscriptEventIdRef.current;
      let result: InterviewControlActionResult;
      if (call.name === "report_current_stage") {
        if (!evidenceEventId) {
          onTrackingStatusChange("unavailable");
          setMessage(
            "Stage tracking is waiting for persisted conversation evidence.",
          );
          setMessageTone("status");
          return missingEvidenceResult();
        }
        result = await recordLiveInterviewStageAction(
          interviewId,
          evidenceEventId,
          call.idempotencyKey,
          call.input,
        );
        if (result.status === "success" && result.observedPhase) {
          onTrackingStatusChange("available");
          onObservedPhaseChange({
            observedPhase: result.observedPhase,
            observedPhaseEventId: result.observedPhaseEventId ?? null,
          });
        }
      } else if (call.name === "report_solution_readiness") {
        if (!evidenceEventId) return missingEvidenceResult();
        result = await recordInterviewSolutionReadinessAction(
          interviewId,
          evidenceEventId,
          call.idempotencyKey,
          call.input,
        );
      } else if (call.name === "complete_primary_question") {
        if (!evidenceEventId) return missingEvidenceResult();
        result = await completePrimaryInterviewQuestionAction(
          interviewId,
          evidenceEventId,
          call.idempotencyKey,
          call.input,
        );
      } else if (call.name === "request_follow_up") {
        result = await requestInterviewFollowUpAction(
          interviewId,
          call.idempotencyKey,
          call.input,
        );
      } else if (call.name === "complete_follow_up_question") {
        if (!evidenceEventId) return missingEvidenceResult();
        result = await completeFollowUpInterviewQuestionAction(
          interviewId,
          evidenceEventId,
          call.idempotencyKey,
          call.input,
        );
      } else {
        result = await concludeRealtimeMockInterviewAction(
          interviewId,
          call.idempotencyKey,
          call.input,
        );
      }

      if (result.status === "error") {
        if (call.name === "report_current_stage") {
          onTrackingStatusChange("unavailable");
          setMessage(
            "Stage tracking is temporarily unavailable. Voice can continue.",
          );
          setMessageTone("status");
        }
        return {
          code: result.code,
          message: result.message,
          status: "error",
        };
      }
      if (result.lifecycle) {
        onConversationStateChange({
          followUpPrompt: result.followUpPrompt,
          lifecycle: result.lifecycle,
          questionCycle: result.questionCycle,
          remainingSeconds: result.remainingSeconds,
        });
      }
      if (call.name === "report_solution_readiness") {
        return {
          message: result.ready
            ? "The readiness gate is complete. Implementation may begin."
            : "The algorithm is not complete. Ask the learner to walk through it from input to output without giving a hint.",
          ready: result.ready,
          status: "success",
        };
      }
      if (call.name === "request_follow_up") {
        return {
          followUpPrompt: result.followUpPrompt,
          lifecycle: result.lifecycle,
          message:
            "One follow-up is authorized. Speak the returned followUpPrompt exactly; do not add constraints or another follow-up.",
          questionCycle: result.questionCycle,
          remainingSeconds: result.remainingSeconds,
          status: "success",
        };
      }
      if (call.name === "conclude_interview") {
        setInterviewConcluded(true);
        conclusionTimerRef.current = window.setTimeout(() => {
          void providerRef.current?.closeSession();
          if (animationRef.current !== null) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
          }
          void audioContextRef.current?.close();
          audioContextRef.current = null;
          setInputLevel(0);
          setConnectionState("disconnected");
        }, 7_000);
        return {
          lifecycle: "concluding",
          message:
            "Conclusion is persisted. Give at most one brief closing sentence and do not ask another question.",
          questionCycle: result.questionCycle,
          remainingSeconds: result.remainingSeconds,
          status: "success",
        };
      }
      return {
        lifecycle: result.lifecycle,
        message: "Interview control state was persisted.",
        status: "success",
      };
    },
    [
      interviewId,
      onConversationStateChange,
      onObservedPhaseChange,
      onTrackingStatusChange,
    ],
  );

  const stopInputMeter = useCallback(() => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    void audioContextRef.current?.close();
    audioContextRef.current = null;
    setInputLevel(0);
  }, []);

  const startInputMeter = useCallback(
    (stream: MediaStream) => {
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
    },
    [stopInputMeter],
  );

  const connect = useCallback(async () => {
    setMessage("");
    setMessageTone("status");
    endedStateRef.current = null;
    activationInFlightRef.current = false;
    voiceVerifiedRef.current = false;
    await providerRef.current?.closeSession();
    stopInputMeter();
    const provider = createRealtimeProvider(providerName);
    providerRef.current = provider;
    try {
      const session = await provider.createSession({
        interviewId,
        onControlToolCall: handleControlToolCall,
        onTransportFailed: async (connectionAttemptId, providerCallId) => {
          await cancelRealtimeInterviewConnectionAction(
            interviewId,
            connectionAttemptId,
            providerCallId,
          );
        },
        onTransportReady: async ({ connectionAttemptId, providerCallId }) => {
          const result = await confirmRealtimeInterviewConnectionAction(
            interviewId,
            connectionAttemptId,
            providerCallId,
          );
          if (result.status === "error") throw new Error(result.message);
        },
        onSpeakingChange: setIsSpeaking,
        onStateChange: (state, detail) => {
          if (detail) {
            setMessage(detail);
            setMessageTone(
              state === "error" || state === "disconnected"
                ? "error"
                : "status",
            );
          }
          if (state === "reconnecting") onTrackingStatusChange("reconnecting");
          if (state === "disconnected" || state === "error") {
            onTrackingStatusChange("unavailable");
          }
          if (state === "connected") onTrackingStatusChange("available");
          if (state === "connected") {
            if (voiceVerifiedRef.current) {
              setConnectionState("connected");
              return;
            }
            if (activationInFlightRef.current) return;
            activationInFlightRef.current = true;
            setConnectionState("connecting");
            void activateVoiceMockInterviewAction(interviewId).then(
              async (result) => {
                activationInFlightRef.current = false;
                if (result.status === "error") {
                  await provider.closeSession();
                  setConnectionState("error");
                  onTrackingStatusChange("unavailable");
                  setMessage(result.message);
                  setMessageTone("error");
                  return;
                }
                voiceVerifiedRef.current = true;
                onVoiceActivated(result);
                setConnectionState("connected");
                void persistEvent({
                  content: "Live voice connected.",
                  eventType: "connection",
                  phase: phaseRef.current,
                });
              },
            );
            return;
          }
          setConnectionState(state);
        },
        onTranscript: (entry) => {
          turnCountsRef.current[entry.role] += 1;
          onTranscript(entry);
          const persistence = persistEvent({
            content: entry.text,
            eventType:
              entry.role === "learner"
                ? "user_transcript"
                : "assistant_transcript",
            phase: phaseRef.current,
          }).then((eventId) => {
            if (eventId) latestTranscriptEventIdRef.current = eventId;
            return eventId;
          });
          transcriptPersistenceRef.current = persistence;
        },
      });
      startInputMeter(session.localStream);
      setIsMuted(false);
    } catch (error) {
      await provider.closeSession();
      setConnectionState("error");
      setMessageTone("error");
      setMessage(
        error instanceof DOMException && error.name === "NotAllowedError"
          ? "Microphone access was denied. Allow microphone access and reconnect."
          : error instanceof Error
            ? error.message
            : "The live interviewer could not connect.",
      );
    }
  }, [
    handleControlToolCall,
    interviewId,
    onVoiceActivated,
    onTranscript,
    onTrackingStatusChange,
    persistEvent,
    providerName,
    startInputMeter,
    stopInputMeter,
  ]);

  useEffect(() => {
    onConnectionStateChange(connectionState);
  }, [connectionState, onConnectionStateChange]);

  useEffect(() => {
    if (autoConnectAttemptedRef.current || interviewConcluded) return;
    autoConnectAttemptedRef.current = true;
    void connect();
  }, [connect, interviewConcluded]);

  useEffect(() => {
    if (
      (connectionState !== "disconnected" && connectionState !== "error") ||
      endedStateRef.current === connectionState
    ) {
      return;
    }
    endedStateRef.current = connectionState;
    stopInputMeter();
    const turns = turnCountsRef.current;
    void endRealtimeInterviewSessionAction(interviewId, {
      status: connectionState,
      summary: `Voice session ended during ${phaseRef.current} after ${turns.learner} learner turns and ${turns.interviewer} interviewer turns.`,
    });
  }, [connectionState, interviewId, stopInputMeter]);

  useEffect(() => {
    if (connectionState !== "connected" || interviewConcluded) return;
    const heartbeat = () => {
      void heartbeatVoiceMockInterviewAction(interviewId).then((result) => {
        if (result.status === "error") {
          setConnectionState("disconnected");
          setMessage(result.message);
        }
      });
    };
    const interval = window.setInterval(heartbeat, 30_000);
    return () => window.clearInterval(interval);
  }, [connectionState, interviewConcluded, interviewId]);

  useEffect(() => {
    if (phaseRef.current !== phase) {
      evidenceEventIdsRef.current = [];
    }
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
      if (conclusionTimerRef.current !== null) {
        window.clearTimeout(conclusionTimerRef.current);
      }
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
      if (contextUpdate.review) {
        providerRef.current?.sendCodeForReview({
          ...contextUpdate.review,
          code: contextUpdate.content,
          phase: contextUpdate.phase,
        });
      } else {
        providerRef.current?.sendCodeSnapshot(
          contextUpdate.content,
          contextUpdate.phase,
        );
      }
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

  const toggleMute = () => {
    const nextMuted = !isMuted;
    providerRef.current?.setMuted(nextMuted);
    setIsMuted(nextMuted);
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
              <Badge variant="neutral">
                {providerName === "gemini" ? "Gemini Live" : "OpenAI Live"}
              </Badge>
              <ConnectionBadge state={connectionState} />
              {isSpeaking ? (
                <Badge variant="primary">
                  <Volume2 aria-hidden="true" className="size-3.5" /> Speaking
                </Badge>
              ) : null}
            </div>
            <p className="text-muted mt-2 text-sm leading-6">
              Live voice is required. The latest spoken turns stay visible above
              the coding workspace; the full transcript is available in Review.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {interviewConcluded ? (
              <Badge variant="success">Interview concluded</Badge>
            ) : !connected ? (
              <Button disabled={connecting} onClick={connect}>
                <RefreshCcw aria-hidden="true" className="size-4" />
                {connecting ? "Connecting…" : "Reconnect voice"}
              </Button>
            ) : (
              <Button onClick={toggleMute} variant="secondary">
                {isMuted ? (
                  <MicOff aria-hidden="true" className="size-4" />
                ) : (
                  <Mic aria-hidden="true" className="size-4" />
                )}
                {isMuted ? "Unmute" : "Mute"}
              </Button>
            )}
          </div>
        </div>

        {connected ? (
          <div
            aria-label={`Microphone input level ${inputLevel} percent`}
            className="mt-5 flex items-center gap-3"
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
            className={
              messageTone === "error"
                ? "bg-danger-soft text-danger mt-5 rounded-lg px-4 py-3 text-sm"
                : "bg-primary-soft text-primary mt-5 rounded-lg px-4 py-3 text-sm"
            }
          >
            {message}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function createRealtimeProvider(provider: RealtimeInterviewProviderName) {
  return provider === "gemini"
    ? new GeminiLiveInterviewProvider()
    : new OpenAiWebRtcInterviewProvider();
}

function ConnectionBadge({ state }: { state: RealtimeConnectionState }) {
  const label: Record<RealtimeConnectionState, string> = {
    connected: "Connected",
    connecting: "Connecting",
    disconnected: "Disconnected",
    error: "Connection error",
    idle: "Preparing voice",
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

function missingEvidenceResult(): InterviewControlToolResult {
  return {
    code: "transcript_evidence_pending",
    message:
      "Wait for the current transcript turn to persist, then report the control state again.",
    status: "error",
  };
}
