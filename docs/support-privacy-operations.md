# Support, privacy, and beta operations

## 1. Confirmed owner details

The owner supplied these details on September 22, 2026:

- Operator: נאום וינר.
- Support and account-deletion contact: naumviner@outlook.com.
- No existing domain or transactional email provider.
- Hosting choice remains Vercel and Supabase.
- Product name: InterviewMe, confirmed by the owner.
- The owner approved continuing the existing retention behavior and using an owned domain with Resend. These decisions are resolved; do not ask again.

`src/lib/operator.ts` is the shared source for public contact details. `/support` and `/privacy` are public, with Hebrew variants at `?lang=he`. Contact links open the user's email client with only a subject; they do not send messages or attach account identifiers, code, transcripts, recordings or credentials. The address remains visible for copying.

## 2. Data notice and outstanding owner decision

The public notice describes current implementation behavior, not a new retention policy. Registered data currently has no automatic age-based expiry. Guest cleanup uses the rules in `20260906144000_guest_launch_limit_hardening.sql`: completed content older than seven days, stale active sessions older than their authorized duration plus ten minutes and seven days, and voice-unactivated sessions after the activation deadline. The scheduled job must actually run. Anonymous identities and consumed-trial records are not removed by content cleanup.

The owner approved this retention behavior. Before external invitations, confirm the deployed job and its monitoring; do not advertise exact deletion times. Verify the configured AI providers, account tier/data settings, infrastructure logs and backup retention against the deployed environment. Public copy intentionally makes no promise about provider-side immediate erasure or training policies.

The source audit found streaming microphone audio in the Gemini and OpenAI browser providers, persisted conversation text/evidence, and no application recording upload or raw-audio database persistence path. This does not establish what external providers retain. Re-audit whenever recording, logging or provider configuration changes.

## 3. Manual deletion procedure — release gate

This is an operator procedure to validate on disposable staging data before invitations. It does not authorize deletion of any real user's data without a verified request.

1. Receive the request through the published support mailbox. Establish which environment and account are intended. Do not collect passwords, recovery links, provider tokens or copies of private interview content.
2. Verify mailbox control by replying to the registered address using a fresh challenge; do not trust the displayed sender alone. If the request comes from another address, recover/verify the registered account first. Record the verified account UUID internally. An interview UUID alone is not ownership proof.
3. For an anonymous account, ask the person to preserve their original browser session. Prefer the existing account-claim flow before manual account deletion. If they cannot establish ownership, do not identify or delete an account based only on an interview reference. A dedicated authenticated guest deletion workflow remains future work.
4. Explain that the requested account and its practice history will be removed from the active application, then confirm the scope with the verified requester. Stop ongoing interview activity before the operation. Do not promise erasure of external-provider records or backups on the same schedule.
5. In the correct Supabase project's protected administrator tools, inspect the exact account UUID and its related records. Use the supported Auth hard-delete operation for that UUID, not soft deletion or a broad SQL filter. Keep service-role credentials outside client code and reports. The schema uses cascading ownership foreign keys across profiles, practice and interview data, but this must be validated against all deployed migrations and private-schema records before use.
6. On a disposable staging fixture first, verify removal of its Auth identity, profile, interview/code/transcript/evaluation records and private claim/trial/request records. Check that unrelated member/guest fixtures remain intact. Check whether an existing session can still access data; do not equate deletion with immediate expiry of every issued JWT. Stop and investigate if foreign keys, ownership transfer or an immutable trigger blocks deletion.
7. After a real verified deletion, retain only the minimum operational record needed to track completion, with an owner-approved retention period. Reply with the actual result and known backup/provider limitations. Do not include deleted content or credentials.

The staging deletion rehearsal and the support-mailbox receipt check are pending. Do not mark the entire privacy/deletion phase complete until these are resolved.

## 4. Email deployment without an existing domain

The Outlook address is the support destination; it is not automatically configured as the application's automated sender. Supabase's default sender is restricted to project team addresses and is not the external-beta delivery path. See [Supabase custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp).

A domain-based Resend sender is the owner-approved production path. The exact domain, availability and price remain unresolved. Obtain approval of the concrete domain and purchase price before registration. Then configure Resend, verify its DNS records, and enter SMTP credentials directly into Supabase's protected settings. Preserve the Outlook support destination unless the owner changes it. No domain has been purchased, sender account created, DNS changed, or external mail sent.

The application itself can initially use its assigned `.vercel.app` address; a custom website domain is optional ([Vercel documentation](https://vercel.com/docs/domains/working-with-domains)). The selected Resend service requires an owned, verified sending domain ([Resend documentation](https://resend.com/docs/dashboard/domains/introduction)). See `interviewme-hosted-setup.md` for the concrete configuration worksheet.

Follow `password-recovery-setup.md` for callback allowlists and real email acceptance. A verified SMTP sender, not merely a deployed app, is required before inviting external users to exercise email-based account flows.
