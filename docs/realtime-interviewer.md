# Realtime interviewer

## Product contract

Mock interviews are full-voice only. Realtime voice is not an enhancement or an optional fallback: an interview cannot start, advance phases, submit code for review, or complete unless an authenticated provider session has activated the interview and is maintaining a current voice lease.

The active workspace exposes only:

- compact Guiding Star tiles containing phase names and state at the top of the page;
- the approved question wording, without its title, difficulty, topic, examples, constraints, or external reference;
- the Live interviewer directly below the question;
- the six most recent completed learner/interviewer transcript turns, newest first;
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

Both adapters expose the same structured control tools for stage reporting, solution readiness, primary/follow-up completion, optional follow-up selection, and conclusion. The already-running Live model reports a Guiding Star stage only when the current activity changes, so stage tracking creates no second AI request per utterance. The application injects trusted interview, transcript, and idempotency identifiers; PostgreSQL validates ownership, the current voice lease, question cycle, lifecycle, evidence ordering, and allowed transitions.

Provider tool calls are replay-safe. A private receipt stores the bounded result for each provider call ID, so a duplicate delivery returns the original result without duplicating a stage event, follow-up, or conclusion. Completed transcript turns are persisted before a stage/readiness report is submitted. Stale stage evidence cannot overwrite a newer accepted report. Tracking failure leaves the guide neutral while voice continues; it never fabricates Intro.

Fresh provider creation uses a two-step connection reservation. Preparing credentials reserves one atomic `start` or `resume` decision without incrementing the successful connection count. Only an opened Live/WebRTC transport confirms the reservation, creates the realtime session, records the connection event, and permits the opening/resume directive. Failed or expired reservations are released, so a failed first token or transport attempt cannot consume the one valid `SYSTEM START`. A concurrent tab cannot reserve a second start.

## Active-data boundary

Browser roles cannot read the raw active `mock_interviews` row or active interview evidence. Active pages use ownership-checking RPCs that return a sanitized snapshot and an opaque question-content key. Only server code resolves that key to approved question wording. The active provider routes use the same boundary.

Transcript turns, phase events, notes, stage observations, readiness receipts, and submission snapshots are persisted privately. During an active interview, direct reads of transcript and conversation-control tables are blocked. Ownership-checking RPCs return only the sanitized active snapshot and six most recent completed learner/interviewer transcript turns. The recent turns remain visible above the coding workspace after refresh or reconnect. Detailed control history and older evidence become learner-visible only after completion on `/interviews/[interviewId]/review`. The scorecard remains a separate result surface.

## Configuration

Full voice requires the feature flag and the selected provider's server-only secret. For Gemini:

```env
GEMINI_API_KEY=replace-with-your-gemini-api-key
REALTIME_AI_ENABLED=true
REALTIME_AI_PROVIDER=gemini
REALTIME_AI_MODEL=gemini-3.1-flash-live-preview
REALTIME_AI_VOICE=Kore
INTERVIEW_LIVE_STAGE_ENABLED=true
INTERVIEW_FOLLOW_UP_ENABLED=true
INTERVIEW_REVIEW_TIMELINE_ENABLED=true
```

Guiding Star stage reporting is part of the existing live provider session. There is no standalone phase-classifier model or per-utterance `generateContent` request.

OpenAI can be selected with `REALTIME_AI_PROVIDER=openai`, `REALTIME_AI_API_KEY`, a realtime model, transcription model, and voice. Secret variables must not use a `NEXT_PUBLIC_` prefix. HTTPS is required for microphone access outside localhost. The selected provider project must have model access and sufficient quota or billing.

Production configuration validation fails when mock interviews are enabled without realtime voice and approved prompt content.

## Persistence and recovery

Completed transcript turns and context events are written only through authenticated database functions. Code-review submission first persists an immutable, bounded snapshot; provider delivery can then reference that snapshot. Forced Row Level Security prevents browser roles from writing the underlying tables directly.

Gemini first attempts native handle resumption. A fresh Gemini or OpenAI connection receives a bounded durable Resume Snapshot and `SYSTEM RESUME`; it may never replay the opening after a confirmed connection or persisted transcript. The snapshot restores the lifecycle, question cycle, observed stage, approved follow-up wording, six recent turns, code snapshot, and server time. Refreshing the page exposes only the six permitted recent turns, never the older stored transcript. Completing or abandoning the parent interview closes any active realtime record, and deleting an interview cascades its transcript, control receipts, conversation state/events, phase observations, submissions, scorecard, evaluation, and profile impact.
