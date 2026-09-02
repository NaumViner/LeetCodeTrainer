# Interview expansion rollout

## Independent server-side controls

The interview expansion ships with three independent, server-only rollout controls. They default to enabled to preserve the current product behavior, can be changed without a database rollback, and must never use a `NEXT_PUBLIC_` prefix.

| Variable                             | Disabled behavior                                                                                                                                                                          |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `INTERVIEW_SELECTION_MODES_ENABLED`  | Setup uses only the existing adaptive Learning policy. The server rejects tampered Coverage, Improvement, or Custom submissions.                                                           |
| `INTERVIEW_PROMPT_CONTENT_ENABLED`   | The workspace and realtime interviewer omit embedded first-party prompt content and retain the canonical external reference. Private evaluator content remains server-only in both states. |
| `INTERVIEW_CODING_WORKSPACE_ENABLED` | CodeMirror and scratchpad autosave are not loaded. Implementation uses a labeled, left-to-right, 30,000-character Python/Java textarea and the existing ordered phase RPC.                 |

These flags control presentation and entry paths, not historical readability. Existing selection snapshots, approved content versions, workspace rows, phase events, and code submissions remain readable regardless of the current rollout state.

## Rollout order and rollback

1. Apply additive migrations and regenerate database types.
2. Deploy with all three controls disabled if a minimal-risk canary is required.
3. Enable embedded prompts and confirm prompt/source separation on desktop and mobile.
4. Enable the coding workspace and confirm autosave, conflict recovery, Python/Java direction, and final submission.
5. Enable selection modes and confirm Coverage, Improvement, Learning, and Custom explanations and inventory errors.
6. Monitor the structured operational events below before widening traffic.

Any application rollback may disable a capability or promote the previous healthy deployment. Applied database migrations remain in place because they are additive and backward compatible. Do not reverse migration history or delete newly stored evidence during an application rollback.

## Observability

Operational events contain identifiers, enums, reason codes, bounded latency, and version counters only. They do not contain prompts, notes, transcripts, scratchpad text, code, provider tokens, or profile attributes.

Monitor at least:

- `mock_interview_started`, `mock_interview_start_rejected`, and `mock_interview_start_failed` by selection mode and reason;
- `mock_interview_phase_advanced` and `mock_interview_phase_advance_failed` by target phase;
- workspace conflicts and save failures;
- code-submission success, conflict, and failure;
- phase-suggestion success/rejection, especially stale and invalid-contract reasons;
- realtime connection success/failure and latency;
- interview completion, evaluation failure, and deletion rejection.

Alert thresholds belong to the chosen hosting/analytics provider. A practical initial review is any sustained error ratio above 5%, workspace conflicts above 2%, or a sharp rise in stale phase suggestions compared with successful suggestions.

## Security and privacy review

- All mutations continue through authenticated, ownership-checking RPCs with forced RLS and revoked direct browser writes.
- Selection snapshot fields, evidence IDs, code submissions, and phase events are server validated and bounded.
- Transcript, prompt, scratchpad, and code are treated as untrusted data; transcript text cannot invoke a structured phase transition.
- Provider secrets stay in server routes. `npm run audit:client-bundle` scans built static assets for server-only secret identifiers and configured values without printing a secret.
- Approved learner prompt content excludes evaluator invariants and private tests. Disabling embedded prompts does not move private content into another client payload.
- Deletion cascades all interview evidence and chronologically rebuilds the remaining mutable mastery state.

## Accessibility review

- Every setup choice has a visible explanation and native labeled input.
- Rollout-disabled selection presents a named adaptive fallback rather than hidden or disabled controls.
- The prompt is a keyboard-operable native `details` element with a persistent external-reference path.
- Both CodeMirror and the fallback editor have language-specific accessible names; source remains left-to-right in Hebrew sessions.
- The process guide is a semantic ordered list, identifies the current item with `aria-current="step"`, and communicates state with text and icons in addition to color.
- Realtime failure and disabled capabilities never block the manual ordered interview workflow.

## Load and concurrency review

The hot paths are deliberately bounded: selection examines the frozen 150-problem collection, prompt content is versioned and local, phase suggestions reference at most 12 events, guide field references are capped at 8, code is capped at 30,000 characters, scratchpad at 10,000, and general realtime events at 8,000. Database row locks serialize interview start, phase change, workspace version updates, completion, evaluation reservation, and deletion where races matter.

Integration coverage issues a concurrent burst of identical phase suggestions and verifies one immutable event ID. Existing integration coverage also exercises concurrent interview/practice exclusion, stale workspace writes, evaluation finalization, and deletion cascades. The editor is dynamically loaded only when enabled, and the realtime panel remains dynamically loaded only for configured voice sessions.

## Historical backfill boundary

No rollout migration fabricates learner performance. Legacy scorecards are represented as version-zero provisional evaluations with empty evidence and are excluded from the interview profile by the `evaluation_version >= 1` query boundary. Existing active interviews receive only a `started` marker for their actual current phase; earlier completed phase summaries are not invented. Coverage continues to use real completed interview rows, and new evidence is recorded only by learner actions or validated provider events.

## Production acceptance

After deployment, run `npm run verify:deployment -- https://<production-domain>` and complete one private-window interview for each enabled capability. Confirm the configured flag state in server logs, inspect error ratios without opening learner content, verify that no provider key appears in responses or browser assets, and test capability rollback once before broad release.
