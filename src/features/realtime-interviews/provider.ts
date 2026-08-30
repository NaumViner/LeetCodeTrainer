import type { MockInterviewPhase } from "@/domain/mock-interview";
import type {
  RealtimeConnectionState,
  RealtimeTranscriptEntry,
} from "@/features/realtime-interviews/model";

export type CreateRealtimeSessionInput = {
  interviewId: string;
  onSpeakingChange(speaking: boolean): void;
  onStateChange(state: RealtimeConnectionState, message?: string): void;
  onTranscript(entry: RealtimeTranscriptEntry): void;
};

export type RealtimeInterviewSession = {
  localStream: MediaStream;
};

export interface RealtimeInterviewProvider {
  closeSession(): Promise<void>;
  createSession(
    input: CreateRealtimeSessionInput,
  ): Promise<RealtimeInterviewSession>;
  sendCodeSnapshot(code: string, phase: MockInterviewPhase): void;
  sendInterviewEvent(phase: MockInterviewPhase, context: string): void;
  sendText(text: string): void;
  setMuted(muted: boolean): void;
}
