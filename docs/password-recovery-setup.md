# Password recovery: setup and release acceptance

Updated September 22, 2026. Local implementation is complete; hosted email delivery is still pending. Follow this document alongside the beta readiness implementation plan and report.

## Stage 1 — Confirm deployment inputs

Obtain the final application origin, the target Supabase project, the operator's display name, a real support/account-deletion address, and any existing sending domain or email provider. The owner has selected Vercel and Supabase. Do not invent contact information or request credentials in chat. Enter secrets directly in the relevant provider's protected settings.

## Stage 2 — Configure hosted authentication and email

1. Set Vercel's `NEXT_PUBLIC_APP_URL` to the final HTTPS application origin. Configure the matching Supabase public URL and publishable key for that environment. Never expose a service-role key or Gemini key through a `NEXT_PUBLIC_` variable.
2. Set the Supabase Auth Site URL to that same application origin. Allow the intended callback URL, including the recovery destination: `https://<application-host>/auth/callback?next=/reset-password`. Preserve the normal `/auth/callback` flow used for registration. Replace the placeholder before saving; avoid broad production redirect wildcards.
3. Configure a production email sender in Supabase Auth using the owner's chosen SMTP provider. Verify its sending domain and required DNS records according to that provider. This is separate from deploying application code to Vercel. Do not assume the default sender is suitable for the invited beta.
4. Keep the recovery email's Supabase-generated confirmation link. The implementation exchanges its authorization code at `/auth/callback`; replacing it with a bare `/reset-password` URL does not authenticate a recipient.
5. Review the target project's password, token-expiry, and email rate-limit settings. The application deliberately returns a neutral response for account existence, delivery errors and provider throttling. A successful form response is not proof of delivery; inspect provider delivery logs when diagnosing missing messages.
6. Deploy only after the environment checks and the forward migrations in the implementation report have passed. Hosted migration and deployment verification are separate release gates.

## Stage 3 — Understand the supported recovery flow

The user requests recovery at `/forgot-password`, opens the email in the same browser, and sets a password at `/reset-password`. PKCE requires the browser state created when requesting the email. On a different browser or device, request a new link there. Expired, reused, or unverifiable links lead to a fresh-link recovery screen.

The password update action verifies the current registered user with Supabase Auth. URL parameters alone do not authorize an update. A verified signed-in member can also update their own password through this page. The session remains signed in after a successful update; do not promise immediate revocation of every previously issued access token.

An active guest interview prevents identity switching. For finished guest work, proof of ownership is prepared before recovery and account transfer finishes only after the password update. A pending transfer continues through `/signup/transfer`.

## Stage 4 — Reproduce local email tests

Start Docker and the project's local Supabase stack with `npm run db:start`. The regular lightweight stack excludes the mail service. The current workstation uses a dedicated local catcher named `codex_recovery_mail_faang`, attached to `supabase_network_faang-interview-academy` with alias `supabase_inbucket_faang-interview-academy`, matching the Auth SMTP hostname. Its UI/API is bound to `127.0.0.1:54324`; no external email is sent.

If that container already exists, start it with `docker start codex_recovery_mail_faang`. On a fresh workstation, first inspect the local Auth SMTP hostname and Docker network. If they match the names above and port 54324 is free, create it once:

```powershell
docker run -d --name codex_recovery_mail_faang --network supabase_network_faang-interview-academy --network-alias supabase_inbucket_faang-interview-academy -p 127.0.0.1:54324:8025 public.ecr.aws/supabase/mailpit:v1.30.2
```

Do not create a second catcher if the standard Supabase mail service already owns that port. Do not reset the database or delete unrelated mail to make tests pass. Run:

```powershell
npm test
$env:INTERVIEW_EVALUATOR_ENABLED = 'false'
npm run test:e2e -- tests/e2e/password-recovery.spec.ts --reporter=line
```

The browser tests create unique local accounts, read only their matching email, and clean up their own accounts/messages. They verify new-password acceptance, old-password rejection, link reuse rejection, and missing PKCE state in another browser on desktop and mobile profiles. Genuine hosted mail and device acceptance are still required.

## Stage 5 — Hosted acceptance before invitations

With the owner's approved test recipient, verify email arrival and spam placement, the final HTTPS destination, recovery in the requesting browser, password confirmation errors, successful sign-in with the new password, rejection of the old password, reused/expired links, and a fresh request from a second device. Verify that finished guest work remains attached to the correct account and active guest work is preserved. Check support/contact links before inviting users.

Record the deployment identity, test date, outcome, and any delivery failure without copying passwords, tokens or recovery links into reports. If email fails, pause invitations and inspect SMTP/domain configuration and Auth logs. A local passing test does not satisfy this hosted gate.

## References

- [Supabase password recovery API](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail)
- [Supabase password authentication](https://supabase.com/docs/guides/auth/passwords)
- [Supabase PKCE flow](https://supabase.com/docs/guides/auth/sessions/pkce-flow)
