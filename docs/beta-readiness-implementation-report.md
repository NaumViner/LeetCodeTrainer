# Beta Readiness Implementation Report

Updated September 23, 2026. Implementation started from revision `a8afbe2`. Changes remain in the working tree. This is a progress report, not release approval.

## Current checkpoint: complete NeetCode 250 inventory

All 250 questions are enabled locally for both interviewer styles: 60 Easy, 155 Medium, and 35 Hard, covering 18 topics. This supersedes the smaller inventories mentioned in the historical phase notes below. The official NeetCode 250 identifier set was verified on September 23; the existing 150 records were preserved and 100 new records appended. Each question has original interview content, examples, constraints, private evaluator invariants and an active version-matched follow-up. Expanded public prompts include examples and constraints in both the interview page and voice-provider instructions.

Three additional forward migrations completed the 150-question content set, versioned and completed follow-ups, and created the NeetCode 250 collection. The final migration adds 100 problems and their prerequisites, creates 250 explicit memberships and 100 follow-ups, switches the interview-start RPC to the new collection, and permits a candidate count up to 250. Existing question IDs, the historical 150 collection, published versions, and recorded interviews remain intact. The application coverage query and setup copy now use 250. No interviewer-personality settings changed.

Verification at this checkpoint:

- 607 unit/component tests passed, including independent example calculations for all 250 questions, historical-version resolution, private-content boundaries and six 300-interview selection simulations.
- 55 database integration tests passed. These include opening every one of the 100 additions under both interviewer styles, resolving the complete prompt from the sanitized snapshot, and abandoning each generated test session (200 cycles). All 250 database versions and current follow-ups match the registry; the two historical corrected-question follow-ups remain present.
- TypeScript, full ESLint, production build and client-bundle audit passed (49 production static assets).
- All 16 desktop/mobile browser tests passed, covering the visible 250-question setup, registration, guest continuity, Hebrew tough interviews, save/resume, password recovery and pending microphone permission. Browser tests used synthetic audio and blocked paid provider requests; the mobile screenshot was inspected for layout.
- The local development server is running at `http://localhost:3000/`. No paid AI requests were made for this expansion, and no hosted deployment was performed.

See [the complete approved inventory](approved-interview-inventory.md) for all 250 identifiers, deployment order and verification limits. These checks validate authored examples and application behavior; they do not constitute an executable judge for learner code or a real voice/grading quality evaluation of every question. The existing inexpensive feedback-model configuration remains in place.

## Environment and owner decisions

- Deployment target: Vercel and Supabase, confirmed by the owner.
- The owner requested a pause whenever their input or intervention is required.
- Docker is healthy. Local Supabase is running; the forward migrations described in this report were applied without resetting the database.
- Node 24.13.0 and npm 11.6.2 are available. Repository instructions and relevant installed Next.js documentation were read.
- The owner authorized use of the existing Gemini key and requested inexpensive models for feedback. Genuine synthetic provider checks were performed separately from deterministic tests. No hosted configuration, DNS, paid account resource, production deployment, or external email was changed.

## Phase 1: content correctness and history

Stock content version 2 corrects `[7, 2, 5, 1, 8, 4]` to profit 7. Historical version 1 remains readable as originally shown. Kth-largest stream version 2 clarifies duplicate handling and sufficient observed values for each post-add query. Two original Hard prompts were added: median of two sorted arrays and merge k sorted lists.

The registry resolves exact historical versions, returns independently validated objects, and excludes private evaluator invariants from learner-visible data. Independent reference calculations check authored examples for all 20 approved prompts; these checks do not execute learner code or prove arbitrary solutions correct.

New evaluations of historical stock version-1 interviews now receive a corrected version-2 reference with an explicit erratum describing what the learner originally saw. The evaluator must not penalize reliance on the erroneous original example. Evaluation version 2 records the reference version and erratum identifier in evidence coverage. No historical prompt or score is rewritten.

## Phase 2: workspace recovery

Transport failures preserve edits and expose retry actions. Saves serialize concurrent changes. An uncertain save is reconciled before a newer snapshot is written; an uncertain submission retries the exact original snapshot while retaining later local edits. Duplicate submission clicks and autosave during a submission are blocked. Conflicts remain blocked with instructions to copy local edits before refreshing. Scheduled autosave is cancelled on unmount, and failures do not trigger an infinite retry loop.

Database operations acknowledge exact immediate replays using the locked workspace version, normalized snapshot, and submission kind. Parallel identical retries return the original submission ID without creating duplicates. Other users and conflicting snapshots remain rejected. Evidence-table permissions were not widened for tests.

**Limits:** local edits survive in the mounted page, not an offline browser crash/reload. A retry after an intervening different write remains a conflict. Network rejection is covered by component tests and replay by database tests; actual browser connection-loss/recovery remains part of release acceptance.

## Phase 3: selection and inventory

Selection version 2 first chooses uncovered topics within the exact requested difficulties, then balances eligible covered topics when necessary. Global coverage remains accurate; difficulty is never widened silently. Setup discloses the limited beta library and possible repetition in English and Hebrew.

There are 20 approved prompts: 9 Easy, 8 Medium, and 3 Hard across 18 topics. The 150-entry metadata catalog is not 150 complete interview prompts. See `approved-interview-inventory.md` for the full inventory and its validation sources. The product specification now describes the fallback.

Browser tests exposed a rollout mismatch: the database start function accepted only algorithm version 1. The fourth migration now accepts versions 1 and 2. The integration fixture imports the application's current algorithm version to prevent a hard-coded older version from hiding this regression again.

## Migrations applied locally

| Migration                                                | Purpose                                                        |
| -------------------------------------------------------- | -------------------------------------------------------------- |
| `20260919180000_correct_stock_interview_content.sql`     | Publish stock content version 2                                |
| `20260919181000_expand_reviewed_interview_inventory.sql` | Add two Hard prompts and kth-largest stream version 2          |
| `20260919182000_retry_workspace_requests.sql`            | Acknowledge exact immediate save/submission replays            |
| `20260920100000_accept_coverage_selection_v2.sql`        | Accept algorithm versions 1 and 2                              |
| `20260920110000_retry_interview_evaluation.sql`          | Immutable retry versions, leases, promotion and guest recovery |

Apply forward migrations before deploying the new application. Older application registries exclude newly published content versions until application rollout completes, so application-only rollback is not a complete content rollback. Historical snapshots remain readable. Hosted migration application and a full clean disposable-database migration test remain pending.

## Verification evidence at the Phase 3 checkpoint

| Check                                         | Result                                                                                                                  |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Full unit/component suite                     | 360 tests passed in 44 files                                                                                            |
| Final focused selection/workspace run         | 32 tests passed, including the subsequently added Medium–Hard simulation; all six offered ranges are covered            |
| Full database suite                           | 52 tests passed in 10 files after the first three migrations                                                            |
| Fourth migration                              | 22 lifecycle/guest tests passed after application                                                                       |
| Browser suite                                 | Initially 8 passed and 4 failed on the version mismatch; all 4 affected desktop/mobile guest tests passed after the fix |
| TypeScript and full ESLint                    | Passed; production build also checked TypeScript after final code changes                                               |
| Changed TypeScript formatting                 | Passed                                                                                                                  |
| Production build                              | Passed, including route compilation and static generation                                                               |
| Git whitespace check                          | Passed                                                                                                                  |
| Hosted and genuine provider/microphone checks | Not performed at this checkpoint; see Phase 4 for subsequent provider checks                                            |

A first integration attempt after resuming returned `JWT issued at future`; host/container clocks were checked and the rerun passed. No authentication checks were weakened. A duplicate-count test initially used API access to a deliberately restricted evidence table; it now inspects only the generated local test interview through local PostgreSQL, preserving application permissions.

Browser tests use synthetic microphone input and block provider routes. They verify start, resume, saved work, signup continuity, responsiveness, and permission-pending navigation. They do not establish genuine voice quality or external email delivery.

## Phase 4: inexpensive real feedback and safe retries

`gemini-3.1-flash-lite` is now the evaluator default in code and `.env.example`, and is explicitly enabled in ignored local configuration. The existing shared Gemini key was preserved, never displayed. The optional learning coach and live voice model were not changed.

The full provider request initially failed with HTTP 400. A smaller decoding schema removed the rejection while retaining all numeric, string, array, and evidence checks in application-side Zod validation. An explicit output-language instruction fixed English output for a Hebrew interview. Strict JSON and evidence-confidence checks passed with real synthetic English and Hebrew feedback. This is a smoke test, not a broad grading-quality evaluation.

Migration `20260920110000_retry_interview_evaluation.sql` was applied locally. Retries create new immutable versions while the last useful result stays current. Reservations serialize by interview; each attempt has one lease and expires after three minutes. Late completion is rejected. Promotion changes only `is_current` through a private transaction receipt, preserving all prior score/evidence fields. Provisional/failed replacements do not erase useful provisional feedback. Guest claims can expire abandoned pending work and transfer every attempt without rewriting finalized evidence.

There are at most three reserved versions per interview, with at most two provider requests per version (the runner's existing retry). SDK-level retries are explicitly disabled. Per-user and global request quotas continue to apply. No automatic upgrade to an expensive model is configured. Failed/expired reservations conservatively consume a version. Additional monitoring and accurate accounting of failed provider usage remain Phase 7 work.

Official standard text pricing checked during implementation: $0.25 per million input tokens and $1.50 per million output tokens. The final two successful checks used 1,739 input and 2,980 output tokens, approximately **$0.0049** at those list rates. This estimate covers those two checks only, not earlier diagnostic requests or a billing statement. See [Google's pricing](https://ai.google.dev/gemini-api/docs/pricing).

Opt-in live test: set `RUN_LIVE_EVALUATOR=1`, then run `npm run test:live:evaluator`. It makes one synthetic request per language with a 5,000-token output cap, no automatic retry, and no user transcript. Ordinary unit/CI tests exclude `tests/live/**`.

Fresh Phase 4 verification: 362 unit/component tests passed; the full database suite passed 53 tests, followed by 16 lifecycle tests after adding an explicit failed-attempt budget regression. The latter suite checks concurrent reservation, one lease, expiration fencing, immutable preservation, atomic promotion, ownership and the three-version limit. Guest tests cover expired retry recovery and transfer of all attempts. Production build, TypeScript, full ESLint, and the client bundle audit (48 assets) passed.

## Phase 5: password recovery and account continuity

Added `/forgot-password`, `/reset-password`, the login recovery link, accessible forms, server actions, and callback routing. Email requests use a neutral response for account existence and provider throttling. Password confirmation uses the existing password rules. The reset action verifies the registered user with Supabase Auth before updating any password. A query parameter alone never authenticates a user.

The supported email flow is PKCE in the same browser. A different device/browser must request a fresh link there; the interface states this limitation. Recovery routing takes precedence over guest claiming after a successful exchange. Active guest interviews block identity switching. Finished guest proof is prepared before switching and consumed only after the password update. The verified session remains signed in after reset; the application does not claim immediate revocation of all previously issued access tokens.

The local mail catcher runs as `codex_recovery_mail_faang`, bound only to `127.0.0.1:54324` and attached to this project's Supabase network. Its alias matches the existing local Auth SMTP hostname. It receives test mail locally; it is not an external mail service or production setup.

Sixteen focused recovery/access tests passed. The final full unit/component suite passed all 376 tests in 45 files. All 16 browser tests passed across desktop and mobile, including four genuine local-email recovery scenarios and existing signup/guest continuity regressions. A setup-form test was corrected to wait for the asynchronous transition to finish before checking that retry is enabled; product behavior was unchanged.

Full ESLint and the production build, including TypeScript, passed. The first sandboxed build could not download the existing Google Fonts dependencies; the network-enabled rerun passed. Git whitespace validation passed. No hosted deployment was performed, and hosted SMTP delivery remains unverified. The browser suite disabled paid feedback requests and used synthetic microphone input.

See [Password recovery setup](password-recovery-setup.md) for staged SMTP/redirect configuration, local test reproduction, session behavior, and hosted acceptance requirements.

## Phase 6 progress: public help and data information

The owner supplied the operator name נאום וינר and support/deletion address naumviner@outlook.com, and confirmed there is no domain or transactional email provider yet. These details are centralized in `src/lib/operator.ts`.

Public `/support` and `/privacy` pages now provide English and Hebrew (`?lang=he`) content. Links appear on the entry page, beside the microphone/data disclosure, in profile settings, and on completed/ended interviews. Email links include only a subject and send nothing automatically. Help explains microphone permissions, reconnecting, save conflicts, AI limitations and the limited question library. The data notice describes current storage, providers, guest cleanup, retained trial identity, member retention and manual deletion limitations without claiming immediate provider or backup erasure.

The code audit found audio streaming and stored transcript/evidence, with no raw recording persistence path in the application. External provider retention remains a deployment review item. `support-privacy-operations.md` records confirmed contact details, a manual deletion runbook, pending staging rehearsal, and email setup. The owner has now approved retaining the existing retention behavior. The new public pages passed the production build/TypeScript and full ESLint; all six setup-form tests passed after adding the privacy link. All four public help/privacy language URLs returned HTTP 200 without login and included the contact address; the client bundle audit passed across 49 assets.

The owner chose **InterviewMe** and approved the domain-based **Resend** path. Product branding is centralized in `src/lib/product.ts` and used by navigation, landing identity, page titles and support email subjects. TypeScript and changed-file ESLint passed after the branding change. `interviewme-hosted-setup.md` provides staged SMTP/DNS/callback configuration and the remaining account/domain inputs. Existing deployment documentation now includes the recovery callback and correctly requires the service-role and cron secrets used by guest cleanup. No domain has been registered and no hosted configuration has changed.

## Remaining owner inputs and release work

Gemini authorization, operator/contact details, existing retention, product name and Resend selection are resolved; do not ask for them again. The exact purchasable domain and price, hosted account/project configuration and provider budget remain release inputs. Do not ask for secrets in chat.

Phase 6 is partial: mailbox receipt, deletion rehearsal and genuine device/accessibility acceptance remain pending. Phases 7–11 remain pending: additional usage protection and monitoring, Vercel/Supabase installation, full release verification, real microphone and hosted acceptance tests, and the invited beta. The application is not yet declared ready for external distribution.
