# InterviewMe — hosted setup worksheet

## Stage 1: resolved decisions

The product is **InterviewMe**. Operator: **נאום וינר**. Support and account-deletion destination: **naumviner@outlook.com**. Vercel hosts the application, Supabase provides Auth/PostgreSQL, and Resend is the approved transactional email service. The owner approved keeping existing guest cleanup and registered-account retention behavior. Do not re-request these decisions.

The existing Gemini key is authorized, with inexpensive feedback via `gemini-3.1-flash-lite`. Provider spending limits and genuine voice acceptance remain separate release gates; approval of the key does not establish a currency spending cap.

## Stage 2: obtain only remaining deployment inputs

Record the chosen domain and registrar's current first-year and renewal prices before a purchase. InterviewMe is a product name, not confirmation that any matching domain is available or owned. Do not assume availability or register a lookalike without the owner's choice. A Vercel-provided site address can be used initially, but Resend still needs an owned sending domain.

Identify the owner's intended Vercel team/project, Supabase project reference and Resend account. No linked hosted project or connected deployment service was found in this workspace; this does not mean the owner has no accounts. Have the owner sign into existing accounts or create missing ones directly. Do not ask for passwords, recovery codes or API keys in conversation. Do not create duplicate projects when an existing target is available.

## Stage 3: configure Resend and DNS

1. After the approved domain is registered, add a sending subdomain such as `auth.<owned-domain>` in the owner's Resend account. This is a placeholder, not a configured sender.
2. Add exactly the verification records Resend displays at the authoritative DNS provider. Inspect existing records before changing them; do not overwrite mailbox MX records or create conflicting SPF records. Wait until Resend reports the sending domain verified.
3. Create a sending credential scoped to the intended domain where supported. Store it securely. Do not add it to public application configuration or commit it.
4. Disable click tracking for authentication emails to avoid changing recovery/confirmation links. Keep the support mailbox separate from the automated sender.

## Stage 4: configure Supabase Auth SMTP

In the intended hosted project's Auth email/SMTP settings, enter:

| Setting        | Value                                                    |
| -------------- | -------------------------------------------------------- |
| Sender name    | `InterviewMe`                                            |
| Sender address | `no-reply@auth.<owned-domain>` after verification        |
| SMTP host      | `smtp.resend.com`                                        |
| SMTP port      | `465`                                                    |
| SMTP username  | `resend`                                                 |
| SMTP password  | The private Resend API key, entered directly in settings |

These settings follow [Resend's Supabase SMTP integration](https://resend.com/docs/send-with-supabase-smtp), checked September 22, 2026. Recheck the current dashboard when applying them. Configure appropriate Auth email rate limits and review delivery logs. Supabase's default sender is not the external-beta path; see [Supabase SMTP guidance](https://supabase.com/docs/guides/auth/auth-smtp).

Keep the existing verification-code option needed for guest conversion when updating signup templates. Preserve Supabase-generated recovery links and the code-exchange flow. Brand subjects and sender display name as InterviewMe; do not substitute an unauthenticated direct link to `/reset-password`.

## Stage 5: configure Vercel and callback origins

Use the confirmed hosted project and review all forward migrations before applying them. Follow `deployment.md` and `public-launch-runbook.md`; do not reset a hosted database. Keep production and disposable staging data separate.

Set `NEXT_PUBLIC_APP_URL` to the actual canonical HTTPS origin. Add that origin to Supabase's Site URL and explicitly allow `/auth/callback` and `/auth/callback?next=/reset-password`. Do not put a guessed InterviewMe domain into configuration. Store Gemini/admin/cron secrets only in protected server settings. `SUPABASE_SERVICE_ROLE_KEY` and `CRON_SECRET` are required by the current production check and guest cleanup path.

Run the production environment validation with the hosted configuration, deploy the approved revision, and run `verify:deployment` against the real URL. A local `npm run build` does not establish hosted configuration readiness.

## Stage 6: release evidence

Record successful SMTP delivery, same-browser recovery, reused-link rejection, guest-to-member continuity, verified deletion rehearsal, scheduled cleanup execution, real microphone behavior, usage limits and operator alerts. Obtain the actual provider budget before opening paid features to outside users. See `password-recovery-setup.md` and the beta readiness plan for acceptance details.

Current status: local branding and decisions recorded. No domain registration, account creation, DNS/SMTP mutation, external email or hosted deployment has been performed.
