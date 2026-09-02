# Interview selection and workspace implementation report

> Historical implementation report. Active mock-interview display, full-voice enforcement, evidence visibility, and Review behavior are superseded by [full-voice-mock-interview-redesign-action-plan.md](full-voice-mock-interview-redesign-action-plan.md).

## 1. Delivered behavior

- Coverage chooses randomly from missing topics until all 18 NeetCode 150 topics have completed interview evidence, then balances least-covered topics.
- Improvement becomes available only at 18/18 coverage and samples from the three weakest sufficiently evaluated interview topics.
- Learning preserves adaptive mastery/readiness ranking and does not mix interview weakness into that policy.
- Custom chooses an exact NeetCode topic and difficulty and contributes normally to history, coverage, evaluation, profile, and recommendations.
- Every setup option explains its inputs, availability, fallback behavior, and inventory limitations before start.
- Completed or abandoned interviews can be permanently deleted; active and foreign-owned deletion is rejected.
- Every versioned selection candidate has reviewed, versioned, learner-visible prompt content. The prompt remains collapsible and accessible during the interview.
- Python/Java CodeMirror, scratchpad persistence, immutable review/completion snapshots, no-AI fallback, and explicit no-execution disclosure are implemented.
- The live process guide persists current/completed/suggested phases and bounded evidence references. Model suggestions require learner confirmation.

## 2. Product decisions and conflicts

- “Random” is cryptographically random in production and injected/deterministic in domain tests.
- Coverage counts distinct completed topic evidence, not raw interview count. Deleting the only interview for a topic makes that topic incomplete again.
- Improvement uses evaluated interview evidence only; Learning uses adaptive learning evidence only. They are intentionally separate readiness layers.
- Difficulty filters never escape to a different topic or difficulty silently. Empty inventory produces an actionable error.
- A repository-authored prompt is shown instead of copying an unlicensed third-party statement. The canonical external source remains clearly separate.
- The model never mutates interview phase. Structured tool calls create a pending suggestion; existing deterministic learner actions remain authoritative.
- Code review is observational only until an isolated trusted runner exists. The application does not claim compilation, execution, test passage, or full correctness.
- Enhanced selection, prompt, and editor capabilities are independently reversible through server-side rollout flags.

## 3. Migrations added and applied locally

- `20260901140000_create_interview_selection_foundation.sql`
- `20260901150000_create_interview_selection_start_rpc.sql`
- `20260901160000_create_mock_interview_deletion.sql`
- `20260901170000_create_approved_interview_content_inventory.sql`
- `20260902100000_create_interview_coding_workspace.sql`
- `20260902110000_tighten_interview_workspace_bounds.sql`
- `20260902120000_create_interview_phase_guide.sql`
- `20260902121000_fix_interview_phase_summary.sql`
- `20260902122000_harden_interview_phase_suggestions.sql`

All migrations apply from an empty local database through the normal Supabase workflow. Generated TypeScript database types match the resulting schema, and local database lint reports no errors.

## 4. Selection algorithms and persisted explanations

### Coverage

The candidate topic set is every uncovered topic before 18/18; afterward it is every topic at the minimum completed-interview count. It applies the requested difficulty filter, avoids the two most recent topics when alternatives exist, prefers an unseen problem, and uses explicit recency/repeat fallbacks only when required.

### Improvement

Topics are ranked by adjusted interview score, confidence, evidence recency, and canonical topic order. Selection is random within the bottom three eligible topics, constrained by requested difficulties, with fresh-problem preference and explicit fallback metadata.

### Learning

The existing adaptive ranking supplies eligible problems using mastery, prerequisites, practice performance, failures, review timing, recency, and interview urgency. It preserves the ranked fallback and recent-problem avoidance without adding interview weakness.

### Custom

The learner-selected topic and exact difficulty are validated against the active versioned collection and approved prompt inventory. Selection is random within that exact combination and prefers a problem the learner has not interviewed on before.

Every start persists mode, requested difficulty set, requested/selected topic, algorithm version, bounded reasons, candidate counts, and fallback booleans. History and scorecard consumers can retain the immutable selection snapshot even if the algorithm changes later.

## 5. Deletion and derived profile influence

`delete_owned_mock_interview` locks and verifies an owned completed/abandoned interview, rejects active interviews, and cascades scorecards, evaluation versions, phase events, code submissions, realtime sessions/events, and related evidence. It then chronologically replays the learner's remaining diagnostic, practice, and interview evidence to rebuild mutable topic mastery. Coverage, profile confidence, dimensions, topic rankings, trends, recurring signals, readiness, and recommendations therefore no longer include the deleted interview.

## 6. Question-content source and limitations

The initial inventory contains 18 repository-authored version-one prompts, one for every canonical NeetCode 150 topic. Each includes reviewed learner-visible wording, constraints, public examples, provenance, and private evaluator invariants separated by a server-only boundary. These are not claimed to be verbatim licensed LeetCode statements. Catalog items without approved content remain metadata-only and cannot enter versioned selection. Any later third-party statement import still requires explicit licensing/content review.

## 7. Editor, persistence, review, and runner boundary

The interview snapshot fixes Python or Java. CodeMirror is dynamically loaded, source remains left-to-right, scratchpad is capped at 10,000 characters, code at 30,000, and optimistic workspace versions reject stale-tab overwrites. Review and coding-complete actions create immutable submissions before optional realtime delivery. Gemini and OpenAI receive the same JSON-delimited untrusted code context. When the editor rollout is disabled, a labeled bounded textarea preserves manual implementation. No isolated runner/private test bundle is deployed, so correctness remains prompt/transcript/code evidence with explicitly limited confidence.

## 8. Phase detection and fallback

The process guide derives state from the authoritative interview phase plus `mock_interview_phase_events`. Completion summaries cite bounded saved-field, realtime-event, and code-submission references. Gemini Live and OpenAI Realtime expose the same structured immediate-successor suggestion contract. The browser supplies the trusted interview identity and already-persisted current-phase evidence IDs; the server revalidates ownership, session, phase, event type, order, duplicates, and staleness. Invalid or unavailable tool calls leave the manual controls fully usable, and transcript text is never parsed as a transition command.

## 9. Security and privacy boundaries

- Forced RLS and own-row reads remain enabled; direct browser writes to authoritative interview evidence tables are revoked.
- Security-definer RPCs verify `auth.uid()`, ownership, active state, order, bounds, and concurrency.
- Provider keys remain server-only and are absent from browser responses. CI scans optimized static assets for secret identifiers and configured sentinel values.
- Learner prompt payloads omit private invariants/tests; provider prompts receive the same learner-visible boundary.
- Prompt, transcript, notes, scratchpad, and code are bounded and treated as untrusted input.
- Operational event sanitization drops sensitive field names and logs only bounded identifiers, enums, reason codes, counters, versions, and latency.
- Legacy evaluations with version zero are excluded from profile evidence; active-interview phase backfill creates only the real current-phase marker and fabricates no prior accomplishments.

## 10. Exact local verification

- `npm run format:check` — passed.
- `npm run lint` — passed.
- `npm run typecheck` — passed.
- `npm test` — 31 files, 293 tests passed.
- `npm run test:integration` — 9 files, 40 tests passed. One initial environment-clock JWT failure passed on a clean rerun.
- `npm run test:e2e` — 10 desktop/mobile Chromium journeys passed.
- `npx supabase db lint --local` — no schema errors.
- `npm run build` — optimized Next.js production build passed.
- `npm run audit:client-bundle` — 43 static assets passed the server-secret audit.
- `npm run env:check:production` — passed with intentionally configured rollout states and non-secret test infrastructure values.

## 11. Primary changed areas

- Selection domain and assembly: `src/domain/interview-selection.ts`, `src/domain/interview-coverage.ts`, `src/features/mock-interviews/selection.ts`
- Start/delete/workspace actions: `src/features/mock-interviews/actions.ts`
- Setup and active interview UI: `src/components/mock-interviews/mock-interview-setup-form.tsx`, `src/components/mock-interviews/mock-interview-workspace.tsx`
- Prompt/editor/guide components: `src/components/mock-interviews/interview-question-panel.tsx`, `src/components/mock-interviews/interview-coding-workspace.tsx`, `src/components/mock-interviews/interview-phase-guide.tsx`
- Approved content and evaluation evidence: `src/features/interview-evaluation/question-content.ts`, `src/features/interview-evaluation/evidence.ts`
- Provider contracts: `src/features/realtime-interviews/provider.ts`, `gemini-live-provider.ts`, `openai-webrtc-provider.ts`
- Rollout and security gates: `src/features/mock-interviews/rollout.ts`, `scripts/check-production-env.mjs`, `scripts/audit-client-bundle.mjs`
- Database: the additive migrations listed above and `src/types/database.ts`
- Operations: `docs/interview-rollout.md`, `docs/deployment.md`, `.github/workflows/ci.yml`

## 12. External work still requiring the owner

- Link and apply the migrations to the intended hosted Supabase project after reviewing the dry run.
- Configure the three rollout flags explicitly in the production host and choose the canary order.
- Supply/verify live Gemini or OpenAI provider keys, quota/billing, microphone permissions, and provider-specific production model availability.
- Perform live voice acceptance and monitor hosted error ratios/latency after release.
- Obtain legal/content approval before adding verbatim or licensed third-party problem statements.
- Build and operate an isolated runner/private-test service before raising correctness confidence to trusted-test coverage.
- Commit, push, deploy, and promote only after the owner requests those repository/external changes.
