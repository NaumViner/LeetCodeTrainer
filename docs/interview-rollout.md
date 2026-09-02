# Full-voice mock-interview rollout

## Server-side controls

The interview selection and coding capabilities retain independent server-only controls. Realtime voice and approved prompt content are mandatory prerequisites, not optional rollout enhancements.

| Variable                             | Disabled behavior                                                                                                                       |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| `INTERVIEW_SELECTION_MODES_ENABLED`  | Setup offers adaptive Learning only; the server rejects tampered Coverage, Improvement, and Custom submissions.                         |
| `INTERVIEW_PROMPT_CONTENT_ENABLED`   | New mock interviews cannot start. There is no canonical-link fallback because it could reveal question identity or extra prompt detail. |
| `INTERVIEW_CODING_WORKSPACE_ENABLED` | CodeMirror is replaced by the bounded, accessible Python/Java fallback editor. Full voice remains required.                             |
| `REALTIME_AI_ENABLED`                | New mock interviews cannot start. Existing finished history, Review, and scorecards remain readable.                                    |

All variables are server-only and must not use a `NEXT_PUBLIC_` prefix. Existing completed and abandoned records remain readable regardless of rollout state.

## Rollout order and rollback

1. Apply all database migrations and regenerate/verify database types.
2. Configure one realtime provider, verify model access/quota, and enable approved prompt content.
3. Deploy with new interview starts disabled until voice activation and lease monitoring are healthy.
4. Test microphone preflight, pending-session cancellation, provider activation, heartbeat expiry, reconnect, and abandonment.
5. Confirm prompt-only display and provider payloads, with no title, difficulty, topic, examples, constraints, or canonical URL.
6. Enable the coding workspace and verify Python/Java autosave, stale-version recovery, code review, and completion.
7. Enable selection modes and verify their explanations and inventory errors.
8. Verify completed Review, scorecard, history, deletion cascade, and profile rebuild before widening traffic.

Application rollback may disable starts or restore a previous healthy deployment. Applied database migrations remain because they are additive and preserve historical records. Do not reverse migration history or delete learner evidence as part of an application rollback.

## Observability

Operational events contain identifiers, enums, reason codes, bounded latency, and version counters only. They must not contain prompt text, notes, transcript, scratchpad, code, provider tokens, or profile attributes.

Monitor at least:

- start accepted/rejected/failed, including provider-unavailable and prompt-content-disabled reasons;
- voice pending, activation latency, heartbeat success, lease expiry, reconnect, and abandonment;
- phase advance and code-submission lease rejections;
- workspace conflicts and save failures;
- phase-suggestion success/rejection, especially stale and invalid-contract reasons;
- provider connection success/failure and latency;
- completion, Review loading, evaluation failure, deletion rejection, and profile rebuild failure.

Alert thresholds belong to the hosting/analytics provider. A practical initial review is any sustained error ratio above 5%, workspace conflicts above 2%, elevated voice-lease expiry, or a sharp rise in stale phase suggestions.

## Security and privacy review

- Active raw interview rows and evidence are hidden from browser roles. Active pages use sanitized, ownership-checking RPCs for the active snapshot and the six most recent completed transcript turns, plus an opaque prompt-content key resolved only on the server.
- All mutations use authenticated ownership-checking functions with forced RLS and revoked direct browser writes.
- Prompt, transcript, scratchpad, and code are untrusted data; none can invoke a structured phase transition.
- Provider secrets remain in server routes. `npm run audit:client-bundle` scans built assets for secret identifiers/configured values without printing a secret.
- Active browser and provider payloads contain approved question wording only, not identity, examples, constraints, evaluator invariants, or private tests.
- Active phase/code/rubric evidence and older transcript are not rendered to the learner. Only the six most recent completed speech turns are visible above the editor; completed evidence is available through the owner-only Review route.
- Deletion cascades all interview evidence and rebuilds remaining mutable mastery state.

## Accessibility review

- Every setup choice has a visible explanation and native labeled input.
- Setup clearly states that full voice and microphone access are mandatory.
- The question wording is always visible and is not hidden behind a disclosure control.
- Live interviewer connection/reconnection states are conveyed with text, not color alone.
- CodeMirror and the fallback editor have language-specific accessible names; code remains left-to-right in Hebrew sessions.
- Guiding Star is a compact semantic ordered list, identifies the current item with `aria-current="step"`, and exposes only phase names and state.
- When voice cannot be restored, the interface offers reconnect or abandonment rather than a hidden text fallback.

## Load and concurrency review

Hot paths are bounded: selection examines the frozen 150-problem collection; phase suggestions and guide references are capped; code is capped at 30,000 characters; scratchpad at 10,000; realtime events at 8,000. Row locks serialize start, voice activation, phase change, workspace versions, completion, evaluation reservation, and deletion where races matter.

Integration coverage must verify concurrent interview/practice exclusion, direct active-row/evidence denial, sanitized active reads, pending cancellation, lease enforcement, stale workspace writes, duplicate phase suggestions, completion, evaluation finalization, and deletion cascades.

## Historical backfill boundary

No migration invents learner performance. Legacy scorecards remain version-zero provisional evaluations and are excluded from versioned profile calculations. Existing active records receive only evidence for actions that actually occurred. Coverage uses real completed interview rows, and new evidence is recorded only by learner actions or validated provider events.

## Production acceptance

After deployment, run `npm run verify:deployment -- https://<production-domain>` and complete one private-window full-voice interview per supported provider/language combination. Confirm:

- microphone denial prevents row creation;
- the timer starts only after voice activation;
- lease expiry blocks phase/code/completion mutations but not autosave;
- the active page and provider receive no question identity or disallowed content;
- refresh/reconnect does not reveal transcript or phase evidence;
- completed Review contains the preserved evidence;
- deletion removes the interview and its profile impact;
- provider secrets do not appear in responses or browser assets.

A real microphone/provider acceptance run requires explicit user permission because it captures and transmits audio.
