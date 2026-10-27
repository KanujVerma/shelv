# Founder-managed client admission

Approved by Kanuj on 24 October 2026. This implementation is local until separately reviewed release approval. The human-led concierge service is $100 per month, products separate. Admission does not create a plan, service payment, entitlement, product order or check-in.

A founder uses Clients > Add client, enters name/email, and receives a client record plus the ordinary portal URL. Adding the record sends no email and does not claim inbox ownership. The client requests the existing passwordless sign-in in their own browser. Welcome mail and Dashboard invitations are outside this change.

## Contract and authority

- New dedicated `concierge-admission` Edge handler, reached through the advisor-only cookie gateway channel `admission`.
- `capabilities` returns `{canAddClient:boolean}` from a fresh database guard. `add_client` accepts only `{action,requestId,email,displayName}`. `admission_status` accepts only `{action,requestId}`.
- New `concierge.advisors.can_admit_clients` defaults false. Actor identity, owned current provider session, permanent account, deletion fence, active advisor/view/admit capability are checked before lookup, every mutation and replay. No role comes from browser claims or user metadata.
- Server-only Auth admin creates an unconfirmed permanent identity with an immutable pre-reserved UUID. Its built-in Supabase service credential never enters the browser or Cloudflare Worker. No generated or shared customer password is returned.
- A private journal preserves the exact canonical email/name payload, normalized email, name, intended UUID, provider session and state. Same UUID/payload retries resume; changed payload is a conflict. Auth and enrollment span separate services, so partial identity creation is retained and recoverable. No automatic user deletion is claimed.
- Active existing enrollment returns its existing client without renaming or resetting it. Cancelled/revoked, anonymous, deleting, ambiguous identity and unexplained existing case states fail closed. New admission atomically inserts active/premeeting enrollment plus empty case; no synthetic reports are seeded.

## Implementation and checks

1. Write and observe failing command/handler tests for request allowlists, fresh guards, exact retry, duplicate/no-reset and no-email receipts.
2. Create one forward migration with native Supabase CLI. Add private journal and exact authenticated/service-only RPCs; test role ACLs, denial before lookup, revocation before replay, concurrency, stable identity and atomic finalization against a disposable local database.
3. Implement native HTTP Auth-admin transport with fixed origin/path, no cookies/redirects, bounded body/timeouts and sanitized errors. Prove actual local Auth admin-create + confirmation-required existing-only PKCE + local captured inbox and supported logout. No hosted data or real emails.
4. Add the founder modal and gateway allowlist. Local browser checks cover add/open, duplicate, denied capability, uncertain response/resume, copy link, mobile width and client-audience denial. Preserve all existing client plan/payment/check-in behavior.
5. Run scoped tests/types, required repository checks where available, migration replay/DB tests, runtime tests/build and diff checks. Report exact limitations. Parent performs independent final integration/release review; no commit, push, grant, hosted migration, deployment or real-client/email action is authorized here.

The dedicated local verification profile is `shelv-portal-20261024`; no default profile or Docker context is changed. Evidence lives in the task-owned `.local-artifacts/auth-spike` fixture, with local-only credentials excluded from reports.
