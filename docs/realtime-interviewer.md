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

Before starting, the learner selects one persisted interviewer level. **Beginner interviewer** keeps the original restrained, gently redirecting behavior. **Tough FAANG interviewer** applies the “blank wall” behavior: one short turn at a time, zero hints or validation, cold optimization prompts, silent code review, and bug-revealing test cases that the learner must dry-run without an explanation. The choice is fixed for the interview and survives refreshes, reconnects, and provider changes. Existing interview records default to Beginner.

## Provider and browser architecture

The realtime interface is independent from the learning-coach provider, although both can use the same Gemini key. Gemini Live is the default browser adapter. The application verifies the learner and active interview, then creates a short-lived, one-use ephemeral token; the long-lived API key never reaches the browser. The browser connects directly to Gemini Live, streams 16 kHz PCM microphone audio, plays 24 kHz PCM responses, and receives input/output transcriptions. It also supports interruption, automatic reconnection with session resumption, typed messages, and silent phase/code context updates.

An OpenAI WebRTC adapter remains available as an alternative. It creates a local audio track and SDP offer, sends the offer and owned mock-interview ID to an authenticated application endpoint, applies the returned SDP answer, and uses the WebRTC data channel for text and context events. The application endpoint forwards the SDP with a server-owned configuration to the [OpenAI Realtime call API](https://developers.openai.com/api/reference/typescript/resources/realtime/subresources/calls/methods/create).

The prompt identifies only problem title, difficulty, current phase, and the persisted interviewer level. Shared rules prevent revealing the hidden topic/pattern or solution, prohibit invented constraints, and treat bracketed phase/code messages as silent context. Level-specific instructions then govern the opening, amount of guidance, optimization exchange, implementation review, testing behavior, and tone.

## Configuration

Realtime is disabled unless both the explicit feature flag and a server-only key are present. For Gemini, the only secret required is the shared key:

```env
GEMINI_API_KEY=replace-with-your-gemini-api-key
REALTIME_AI_ENABLED=true
REALTIME_AI_PROVIDER=gemini
REALTIME_AI_MODEL=gemini-3.1-flash-live-preview
REALTIME_AI_VOICE=Kore
```

OpenAI can be selected instead with `REALTIME_AI_PROVIDER=openai`, `REALTIME_AI_API_KEY`, an OpenAI realtime model, transcription model, and voice. None of the secret variables may use a `NEXT_PUBLIC_` prefix. HTTPS is required for browser microphone access outside localhost. Provider access, model availability, and sufficient free-tier quota or billing must be enabled in the selected provider project.

## Persistence and recovery

Completed transcript turns and submitted context events are persisted through authenticated database functions. Forced RLS permits only the owner to read them and browser roles cannot write tables directly. Reconnecting reuses the interview's session record while creating a fresh provider connection or resuming the Gemini session when possible. Ending the voice connection stores a bounded deterministic summary; completing or abandoning the parent interview also closes any still-active realtime record.
