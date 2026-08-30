# Realtime interviewer

## Experience

The existing text mock interview remains the source of truth for timer, ordered phases, evidence, and scorecard. When realtime is configured, an optional Live interviewer panel adds:

- microphone permission and mute/unmute controls;
- a live input-level meter and interviewer-speaking indicator;
- speech-to-speech interaction with a completed-turn transcript;
- a typed-message fallback;
- phase-note and code-snapshot context updates;
- visible connecting, reconnecting, disconnected, and error states;
- explicit voice-session ending and transcript recovery after refresh.

Voice failure never blocks the structured interview. The learner can reconnect or continue the normal text workflow.

## Provider and browser architecture

The realtime interface is independent from the Phase 12 learning-coach provider. The initial browser adapter uses WebRTC. It creates a local audio track and SDP offer, sends the offer and owned mock-interview ID to an authenticated application endpoint, applies the returned SDP answer, and uses the WebRTC data channel for text and context events.

The application endpoint verifies the signed learner and active interview, then sends the SDP plus a server-owned session configuration to `POST /v1/realtime/calls`. This follows the current official [OpenAI Realtime call API](https://developers.openai.com/api/reference/typescript/resources/realtime/subresources/calls/methods/create). The configured model defaults to [`gpt-realtime`](https://developers.openai.com/api/docs/models/gpt-realtime), but remains an environment setting.

The prompt identifies only problem title, difficulty, and current phase. It tells the interviewer to ask one question at a time, avoid revealing the hidden topic/pattern or solution, avoid inventing constraints, treat bracketed phase/code messages as silent context, and keep spoken responses concise.

## Configuration

Realtime is disabled unless both the explicit feature flag and server-only key are present:

```env
REALTIME_AI_ENABLED=true
REALTIME_AI_PROVIDER=openai
REALTIME_AI_MODEL=gpt-realtime
REALTIME_AI_API_KEY=replace-in-secret-storage
REALTIME_AI_TRANSCRIPTION_MODEL=gpt-4o-mini-transcribe
REALTIME_AI_VOICE=marin
```

None of these variables may use a `NEXT_PUBLIC_` prefix. HTTPS is required for browser microphone access outside localhost. Provider access, model availability, quotas, and billing must be enabled for the selected OpenAI project.

## Persistence and recovery

Completed transcript turns and submitted context events are persisted through authenticated database functions. Forced RLS permits only the owner to read them and browser roles cannot write tables directly. Reconnecting reuses the interview's session record while creating a fresh provider call. Ending the voice connection stores a bounded deterministic summary; completing or abandoning the parent interview also closes any still-active realtime record.
