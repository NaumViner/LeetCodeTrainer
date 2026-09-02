# Realtime interviewer

## Product contract

Mock interviews are full-voice only. Realtime voice is not an enhancement or an optional fallback: an interview cannot start, advance phases, submit code for review, or complete unless an authenticated provider session has activated the interview and is maintaining a current voice lease.

The active workspace exposes only:

- compact Guiding Star tiles containing phase names and state at the top of the page;
- the approved question wording, without its title, difficulty, topic, examples, constraints, or external reference;
- the Live interviewer directly below the question;
- the six most recent completed learner/interviewer transcript turns;
- the Python or Java coding workspace;

There is no typed-message fallback, live transcript, learner-controlled “End voice” action, or non-voice interview mode. The learner may mute and reconnect. If voice cannot be restored, the learner can abandon the interview; an interview that never activated is cancelled without creating history.

The persisted interviewer level remains fixed for the interview. **Beginner interviewer** uses restrained questions and gentle redirection. **Tough FAANG interviewer** stays terse, avoids hints and validation, reviews code silently, and asks the learner to dry-run revealing tests without explaining the defect.

## Start and lease lifecycle

Setup is unavailable unless a realtime provider is configured. Before creating an interview, the browser performs microphone capability and permission preflight. The server independently rejects start requests when full voice is unavailable.

A successful start creates a voice-pending row. Its timer is stopped and it is not counted in history or profile evidence. The browser obtains a provider session and then calls the authenticated activation function. Activation starts the interview timer and the voice lease. The client refreshes the lease every 30 seconds; the server treats it as expired after 90 seconds without a heartbeat.

Ordered phase changes, code-review submissions, coding completion, and interview completion all validate the current lease. Scratchpad and code autosave remain available during a temporary reconnect so the learner does not lose work. Cancelling a voice-pending row deletes it; abandoning an activated row records an abandoned interview and closes its realtime session.

## Provider and browser architecture

Gemini Live is the default browser adapter. The application authenticates the learner and the sanitized active-interview snapshot, then creates a short-lived, one-use ephemeral token; the long-lived provider key never reaches the browser. The browser streams microphone audio and plays provider audio, supports interruption and session resumption, and sends bounded phase/code context updates.

An OpenAI WebRTC adapter remains available. It sends a local SDP offer and the owned interview ID to an authenticated application route. That route creates the provider call with server-owned instructions and returns the SDP answer.

Both providers receive the same bounded contract: approved question wording, current phase, selected interview language, interviewer level, and explicitly submitted code context. They do not receive the question title, difficulty, topic, pattern, public examples, constraints, canonical URL, evaluator invariants, or private tests. Transcript and code are treated as untrusted learner evidence. Code is never represented as executed, and the interviewer may not claim that tests passed.

Both adapters expose one structured phase-suggestion tool. The provider can suggest only the immediate successor of the expected current phase with a bounded reason code. The application injects trusted identifiers and revalidates authentication, ownership, lease, phase order, evidence ownership, and staleness. A valid suggestion creates a “Needs confirmation” event only; it cannot advance the interview.

## Active-data boundary

Browser roles cannot read the raw active `mock_interviews` row or active interview evidence. Active pages use ownership-checking RPCs that return a sanitized snapshot and an opaque question-content key. Only server code resolves that key to approved question wording. The active provider routes use the same boundary.

Transcript turns, phase events, notes, and submission snapshots are persisted privately. During an active interview, one ownership-checking RPC returns only the six most recent completed learner/interviewer transcript turns so they remain visible above the coding workspace after refresh or reconnect. All older transcript and other evidence become learner-visible only after completion on `/interviews/[interviewId]/review`. The scorecard remains a separate result surface.

## Configuration

Full voice requires the feature flag and the selected provider's server-only secret. For Gemini:

```env
GEMINI_API_KEY=replace-with-your-gemini-api-key
REALTIME_AI_ENABLED=true
REALTIME_AI_PROVIDER=gemini
REALTIME_AI_MODEL=gemini-3.1-flash-live-preview
REALTIME_AI_VOICE=Kore
```

OpenAI can be selected with `REALTIME_AI_PROVIDER=openai`, `REALTIME_AI_API_KEY`, a realtime model, transcription model, and voice. Secret variables must not use a `NEXT_PUBLIC_` prefix. HTTPS is required for microphone access outside localhost. The selected provider project must have model access and sufficient quota or billing.

Production configuration validation fails when mock interviews are enabled without realtime voice and approved prompt content.

## Persistence and recovery

Completed transcript turns and context events are written only through authenticated database functions. Code-review submission first persists an immutable, bounded snapshot; provider delivery can then reference that snapshot. Forced Row Level Security prevents browser roles from writing the underlying tables directly.

Reconnect creates a fresh provider connection or resumes the provider session when supported. Refreshing the page never exposes the stored transcript. Completing or abandoning the parent interview closes any active realtime record, and deleting an interview cascades its transcript, phase evidence, submissions, scorecard, evaluation, and profile impact.
