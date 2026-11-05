# Account contact and administration: proposed interface pin

Owner: Kanuj. Research date: 2 November 2026. **Proposal for Parent review only. No implementation, independent acceptance, Root admission, resource grant or release claim.**

The next missing C08 producer is an own-client **email read, deliberate change request and original-request status** seam through the existing Supabase provider and cookie/Vault/callback chain. Reuse the admitted profile producer for canonical current-email facts and name editing. Reuse the existing minimum client-session context for bootstrap; it does not require active paid care. Do not add a `canAdmin` flag, synthetic currentness, client selector, new identity system or care entitlement.

The public proposal below is concrete enough to allocate separate source files. Its durable dispatch facts, provider configuration, pending-email truth and callback integration are **not implemented or proven**. In particular, the inspected provider interface supplies neither application request-ID idempotency nor compare-and-swap email mutation. An uncertain email request must not be automatically resent. The smallest first implementation packet can deliver the strict contracts and truthful read/status path; request dispatch remains unavailable until its real producer and callback prerequisites are satisfied.

## Custody, authoritative inputs and source identity

- Literal taskId separately returned by Parent after start: `node:delegated-task:command%3Amcp%3Aafb222dc-28b4-420b-9474-b05bc6eeba89%3Adelegate-task%3Acontinuation-20261102-account-contact-admin-pin`.
- Actual configure READ self: `thread:delegated-task:command%3Amcp%3Aafb222dc-28b4-420b-9474-b05bc6eeba89%3Adelegate-task%3Acontinuation-20261102-account-contact-admin-pin`. This is not the taskId or a runId.
- Self and Parent `9b085ada-435f-48d6-8886-957c1ce3e82d` were independently read with `t3_thread_configure`, **omitting `modelSelection`**: instance `codex`, model `gpt-6.1-sol`, reasoning `xhigh`, service tier `default`, interaction `default`. Parent independently confirmed this child's readback. No settings changed and no child was spawned.
- T3 reports attached isolation at `/Users/kanuj/.t3/worktrees/shelv/t3-9dfd5d0a`, branch `t3/account-contact-admin-research-pin`. Starting Git was clean at exact required base `ba1caf3bc4c28b13d1c1d4ad07682d69718ff544`. Its actual tracked count is **2,214**, derived from that tree. No worktree was created in the shell and no input commit was imported.
- Explicit executable `/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node` reports `v22.23.0`. No application/probe/compiler/dependency graph was executed. No conditional APFS clone was needed or acquired; none of its separate lock/runtime/link/device/43,213-and9,071 parity conditions is asserted satisfied.
- Parent reconfirmed Root source **`38415adefaf4c7b5998bfdeb59ad49c8e0de91c2`**. Its actual tracked count is **2,185**, not this child's count. Later coordination prose does not change this source pin. This child's base includes additional shared/credential inputs and is not a substitute Root source tree.

Applicable root/portal AGENTS and personal WORKFLOW were read. The integration entry point at `/Users/kanuj/.t3/worktrees/shelv/kanuj-portal-rebuild-integration-20261030/docs/portal-rebuild/README.md`, GOAL, complete desktop specification, D01-D48, implementation contracts, addenda, manifests, relevant workstreams/status/acceptance and the complete profile author/R1/R2/Parent-integration/projection/AP1 lane were consulted. The original and continuation were read/hash-checked **in place**, separately:

| Preserved source | Bytes | SHA256 |
| --- | ---: | --- |
| `source/APPROVED_INPUT.txt` | 95,388 | `c45701f9f54fd2b1dbb09bbd7aa2b9b437e9059aa6032b6f39411fe2e7f6efbd` |
| `source/CONTINUATION_INPUT_20261102.txt` | 100,187 | `b428b318598df52f12ce3e6ea4ebd350ff9333ee05d9fd8f04a8e845d0c722bc` |

They are distinct documents, not an asserted identical prefix. The full 26-screen/D01-D48/secondary-flow goal is unchanged. Raw originals, minimally bound diagnostics, approved successors and current evidence remain separate. No skip, filter, waiver or retroactive green is proposed.

Ignored read/hash notes are solely `.local-artifacts/w6-account-contact-admin-pin/`. Foreign reports, local design and the pinned SDK source were read/hashed in place. No foreign script, generated runtime, archive or compiler was executed or recursively copied. Only this NEW report is a tracked write and delivery.

## What the approved Account actually requires

The three approved PNGs were inspected with `view_image`, without a browser or live Figma call. Both manifests contain the same 26 references and identify C08 `498:399`, C08C `499:927`, C08R `504:621`, each 1440 by960. These retained artifacts supply the exact approved visual input; staged Maya data supplies no client facts.

| Local artifact | Bytes | SHA256 |
| --- | ---: | --- |
| `design/C08-498-399.png` | 115,217 | `cacb17b2baf84991ea53551f4265262f73ce2f8e23a05ecef13308bda476d62c` |
| `design/C08C-499-927.png` | 84,387 | `39db04c810970c645a1892277804e6a4efe07391606596b7d6188d9571da477a` |
| `design/C08R-504-621.png` | 78,836 | `0df83226bd3bfad8be4099a8843bcf8ec8acb15cc854960ca9705d7c2441c0a4` |

C08 has one profile/contact card: **name, email, contact preference, shipping address**, followed by **edit details**. Its preference text is exactly `email updates · personal texts for questions`. It also has download plan, service payments, cancel service, privacy/source permissions, request a copy, request help, text shelv and sign out. There is no phone input, marketing permission, SMS subscription, channel selector or illustrated preference editor.

The [full specification](../APPROVED_DESKTOP_SPEC.md#c08c08cc08r-account-and-service), lines150 onward, expressly requires self-service profile/contact/address editing with verification where needed. Its [secondary-flow inventory](../APPROVED_DESKTOP_SPEC.md#10-secondary-flows-and-coverage-limits), line220, separately requires edit profile/address and account contact verification. Combined with the editable email shown in C08, this requires a real verified email-edit flow. It does **not** define an editable preference-choice domain. Parent confirmed that no later approved choice domain is known. Keep the fixed approved service-contact explanation; do not turn its prose into a new toggle or claim an arbitrary preference editor is required or completed. A later proposal for editable choices needs its exact meaning settled first.

| Requirement | Current source or reusable seam | Missing gate / proposed treatment |
| --- | --- | --- |
| D13/C08 name | `PortalAccountProfile*`; schema1 `set_account_display_name_v1(requestId,expectedRevision,displayName)` | Preserve exact case/boundary whitespace and trimmed Unicode1..200 validation. Mount/transport/genuine checks remain. Do not rebuild this producer. |
| C08 current email and verification fact | Same producer's `read_account_profile_v1`; SQL reads actual own `auth.users.email` and `email_confirmed_at` | Read known address/verified fact or explicit unknown. This is no email-send/change feature. |
| C08/secondary email editing and verification | Existing Supabase Auth, server-owned PKCE, cookie/Vault identity | New contact seam below; actual pending state, deliberate dispatch, original-request status and purpose-bound callback. No direct SQL email write. |
| C08 contact preference | Approved fixed description only | Display the approved distinction between email updates and human personal texts. No inferred editable choice set, phone field or optional transactional-email switch. Preferences are data, never authority. |
| D13/D29/D31 address | Separate unmounted address/service candidate, real PaymentV2 read plus legacy `confirm_shipping_address` write | Reuse its source and boundaries only after Parent admission. No email edit mutates address or frozen quotes/orders. No new address history in this seam. |
| C08C cancellation | Existing `ConciergeService` writer and separate departure-read candidate | Ordinary cancellation suppresses renewals and retains paid support; early departure has explicit confirmed support end. No email operation invokes either writer or moves money. |
| C08R/D38 unfinished administration | Existing own-client context and individual order/refund producers | Keep reachable separately after care expiry. A displayed availability fact cannot authorize an operation. Missing producers stay unavailable. |
| D38 final export | `PortalFinalExport*`, fixed `concierge_final_export_command_v1`, separate consumer | [Later addendum](../DECISION_ADDENDA.md#static-final-export-after-the-read-only-window-1-november-2026) keeps static last-entitled export after30days. C08R's old “before” copy cannot remove that right. No interactive care extension. |
| D39/D40/privacy | Separate SourceAccount read/withdraw model and approved assisted-confirmation workflow | No raw copy/export, consent change or deletion through contact actions. Unknown obligations stay unknown. |
| D33/D34 notifications | Mandatory neutral transactional events and portal indicators; human texting | A preference cannot silently disable required events. No automatic SMS or private details in messages/analytics/replay. |
| D03/D04/D10/D48 secondary UI | Existing wrappers, overlay lifecycle, route/Back and session boundaries | One Account page; Parent composes the modules. No second shell, design system or generic contact chat. |

## Actual Root chain and why basic administration need not imply care

The following trace is pinned to **Root384**, not the later shared candidate:

1. `app/bootstrap.ts:prepareApplication` calls the retained synchronous `site/advisor/api.js:consumeCallback` **before routing/history/cookie/React work**. The scrubber recognizes `email_change`, but the React bootstrap retains only PKCE code; token-hash/implicit callbacks become errors. Recognition of a callback type is not an implemented email-change flow.
2. `createApplicationSession` instantiates the real `CookieClientSession` through `app/retained.ts`, restores/completes the cookie session and creates a generation/owner/epoch-bound private boundary. `CookieAdvisorSession._accept` requires a real view with `capabilities.view === true`. The generic transport acquires the actual cookie lease and refuses stale owner/audience/role/generation/expiry. Its structural facade is not an authorization source.
3. The gateway validates its exact registered route, method, same origin, CSRF, body and opaque session cookie, then dispatches a fixed operation to the actual Vault worker. It does not accept a caller URL/RPC/identity. SessionVault opens encrypted credentials and serializes authorization/execution. Initialize, authorized reads and post-operation rechecks require matching owner/provider session and `view`.
4. `ClientProvider.context` calls fixed `concierge_client_session_context` and demands own owner/session, role `client`, view true, other capabilities false, and an unexpired authoritative session deadline. Its SQL checks actual permanent own Auth user, deletion fence, non-advisor persona, actual own unexpired `auth.sessions`, and `concierge.access(owner_id)`. The latter rejects revoked enrollment and requires own target/enrollment. **It does not call `plan_care_access`, require funded service or test the30-day care window.** The generic `view` bit therefore currently means client-session admission, not clinical entitlement.
5. Clinical plan/history endpoints independently use actual care/publication authority. `plan_care_access` permits active care, or read-only care on reads, and denies expired care; writes require the appropriate active state. `view:true` alone cannot grant those rights. Profile's new `account_profile_authorize_v1` uses genuine session/permanent/deletion/ban/role checks and its wrapper rejects revoked/missing own enrollment/case, including after waits. It deliberately allows cancelled/ended own administration. It rejects any plan-principal row and active advisors, beyond the older generic context's persona checks.
6. `ClientContent` still renders `UnavailableModule` for Account. `ApplicationShell` says contact details are unconnected and refers to the existing service contact. The root navigation parser, a rendered button or a typed request is not a mounted Account/contact producer.
7. Actual deletion remains the existing `delete-customer-account` sequence: authenticate, commit `deletion_started_at` fence, inventory/remove/verify private Storage, Auth deletion last. The separate scanner client helper is not a portal deletion transport. Contact work must respect that fence and the existing cascades; it adds no deletion clearance, retention job or cleanup rule.

**Minimum-context conclusion:** for a permanent, non-advisor, non-revoked own enrolled client after care ends, the existing context producer is sufficient in meaning to bootstrap an Account/admin shell. Do not invent another scope RPC or change `view` to true locally. Its installation and the real cookie/provider/SQL composition still require genuine verification. It is not sufficient authority for each operation: retain profile's stricter actual persona/session checks and each order/refund/export/consent endpoint's own authorization/currentness. Revoked, deleted, missing or banned identities are not made eligible by this proposal; any new access exception would be a separate permission decision.

Parent should create the Account entry independently of a **successful plan read**. A care403 must not be the sole gate to mounting basic administration. Contact/profile read failures and individual order/refund/export failures need their own truthful states. This composition change belongs to Parent, as do shell contact availability and post-window copy. No care data should be fetched to decide whether to show an email editor.

The existing departure DTO is observational, not a grant. Its R1 findings ADPR1/ADPR2 remain held: real persisted cancellations omit command-only `confirmedWithClient`, and the original transport reset deadlines per upstream call. Do not use that candidate as a successful context provider. The final-export consumer's AFEC1/AFEC2 and unsupported `final-export` channel likewise remain separate. Its local type cast never registers a channel.

## Supabase facts, pinned SDK and unknown runtime

Only public official documentation/changelog was researched. No CLI status, project API, hosted configuration, Auth user, provider or email operation was queried. The Supabase skill's changelog-first step fetched the current [summary index](https://supabase.com/changelog.md) into owned ignored evidence:103,109 bytes, SHA256 `e42d0a99566ae6cc8be923976da1548410d24a32a14c3f21d4e1819c405a721b`. The web reader rejected its markdown content type; a direct public-document fetch succeeded. Initial guessed markdown/reference URLs failed and were replaced by the official HTML guides, without changing any service.

| Evidence | Fact and limit |
| --- | --- |
| Root `supabase/config.toml:23-36` | Declares local `site_url=http://127.0.0.1:8081`, redirects `derive://**`, anonymous sign-in enabled, `double_confirm_changes=true`, `enable_confirmations=false`. Only a magic-link template is declared. This scanner-oriented local declaration neither proves the portal callback is allowlisted nor verifies the target hosted configuration or the interaction of its confirmation settings. No config change is made. |
| Root/runtime locks | Root `@supabase/supabase-js` and transitive Auth resolve2.116.0; session runtime explicitly pins `@supabase/auth-js`2.116.0, Node>=22. Lock integrity: `sha512-Cmosty12gyKGK9N3bQb+lMmuAFev5nmUzaR1AsmZHqKOAGzqX1VQzmp49CNPwOx/pw0H9Qqk4rs9yhwTlKpfDg==`. This is the declared package pin, not a newly verified install/tarball. |
| Actual pinned SDK source, read only | Integration `node_modules/@supabase/auth-js/package.json` says2.116.0. `src/GoTrueClient.ts:3402-3472` exposes `updateUser(attributes,{emailRedirectTo?}):Promise<UserResponse>`; uses authenticated session, generates/stores PKCE verifier/challenge for email, and PUTs fixed `/user`. It then saves `session.user` and emits `USER_UPDATED`. Neither event nor saved SDK data proves completed verification. |
| Pending SDK interface | `src/lib/types.ts:505-530` has optional `email`, `email_confirmed_at`, `new_email`, `email_change_sent_at`; OTP types include `email_change`. These are provider response fields, not guaranteed current SQL facts, delivery receipts, confirmation-leg counts or supported cancellation. Omitted optional fields must not become “no pending change.” |
| Existing provider wrapper | Root `upstream.ts:sdk` already constructs server PKCE Auth with no browser detection/auto-refresh, using captured public key and private storage. Its generic `check` maps Auth errors to401 and each retained exchange has its own timeout. Do not reuse those classifications/budgets unchanged for the new mutation: invalid email/rate limiting/transport failure are not all session revocation. Preserve actual401/403 separately. |
| Callback compatibility | SDK `exchangeCodeForSession(code,options?:{flowId?:string})` exists; the current provider passes code plus private SDK storage. New SDK redirect flow-ID appending is experimental and defaults off. The pin requires no experimental option or new URL parameter. The existing sign-in AuthFlow requires a stored sent flow/SDK verifier and restricts existing-session handoff; an email-update callback cannot simply masquerade as that login flow. |

Physical SDK byte pins, read in place without import/execution:

| File under integration `node_modules/@supabase/auth-js/` | SHA256 |
| --- | --- |
| `package.json` | `96b5622989e0b0e5396209ce6a21d81222e582afc590b775994434131319bed3` |
| `src/GoTrueClient.ts` | `8b9180b10d021280a1da03fb8108d7d7730092465ddf192a855d8584f6a124eb` |
| `src/lib/types.ts` | `b8e384c743c7853ed9979b04e4c37ce24f0ac66125445cd979825dcf685afe3b` |

Current official [updateUser reference](https://supabase.com/docs/reference/javascript/auth-updateuser) confirms authenticated email updating. The pinned SDK's remarks and official [double-confirm configuration reference](https://supabase.com/docs/guides/local-development/cli/config#auth.email.double_confirm_changes) describe confirmation at both old and new addresses when enabled, or new address only when disabled. This does not establish which setting the hosted project actually uses, that either message arrived, or that one callback completes both confirmations.

The official [email-template guide](https://supabase.com/docs/guides/auth/auth-email-templates) distinguishes change-email authentication messages from optional security notifications and documents current/new email variables and token-hash verification. It does not make an `updateUser` acknowledgement a delivery receipt. Use the existing PKCE route rather than adding an unreviewed token-hash verifier. Official [redirect guidance](https://supabase.com/docs/guides/auth/redirect-urls) requires configured allowlisted destinations; the client must not choose `emailRedirectTo` or a provider URL. Parent must bind the existing server-configured portal origin to `/account` and prove the callback chain and allowlist.

Relevant changelog checks: [3 June template restriction](https://supabase.com/changelog/46599-changes-to-email-template-customisation-on-free-tier) affects new Free/default-SMTP projects; existing projects and custom SMTP have different treatment. [12 October TLS notice](https://supabase.com/changelog/cbc-tls-ciphers-deprecated) affects project HTTP APIs from10November at the earliest. Neither establishes this project's plan, templates, SMTP, TLS runtime or email delivery. No provider switch, insecure TLS option or new integration is proposed.

No inspected current public interface documents an application idempotency key, conditional email update, atomic cross-system SQL/Auth transaction, cancellation of a pending change or a reliable count of completed confirmation legs. These capabilities remain **unproven**, not asserted absent from every possible Auth deployment. Two sessions, a direct Auth client and superseded confirmation links must be genuinely tested before making concurrency claims.

## Proposed public contract, with no shared export yet

Proposed namespace is client-only `account-contact`, fixed gateway path **`POST /api/client/account-contact`**. It is a proposal, not a registered route. Keep profile name/read actions unchanged in their separate `account-profile` seam. No generic `account` action tunnel, caller `clientId`, provider URL, redirect, Auth identity, permission bit, SQL/RPC name or credential is accepted.

```ts
// Proposed new PortalAccountContact.ts. Strings below are strict wire values.
type CurrentAccountEmail = AccountProfileView['currentEmail'];
type PendingAccountEmail =
  | {state:'unknown'}
  | {state:'none'}
  | {state:'pending';address:string};

type AccountContactView = {
  schemaVersion:1;
  contactBasis:string; // 64 lowercase hex; server consistency hash, never authority
  currentEmail:CurrentAccountEmail;
  pendingEmail:PendingAccountEmail;
};
type AccountContactCommand =
  | {schemaVersion:1;action:'read_account_contact_v1'}
  | {schemaVersion:1;action:'request_account_email_change_v1';
     requestId:string;expectedContactBasis:string;email:string}
  | {schemaVersion:1;action:'read_account_email_change_request_v1';
     requestId:string};
type AccountEmailChangeReceipt = {
  schemaVersion:1;
  action:'request_account_email_change_v1';requestId:string;
  outcome:'provider_accepted';recordedAt:string;
};
type AccountEmailChangeStatus = {
  schemaVersion:1;
  action:'read_account_email_change_request_v1';requestId:string;
  state:'not_found'|'registered'|'dispatch_unknown'|
        'provider_accepted'|'provider_rejected';
};
type AccountContactResult =
  AccountContactView|AccountEmailChangeReceipt|AccountEmailChangeStatus;
```

`read_account_contact_v1` obtains current email **only through the genuine canonical profile read**, not from JWT, metadata, requested address, SDK cache or update acknowledgement. Missing canonical authority is an error, not a known address. A pending address must come from a proven provider/SQL pending-state producer for the same actual UUID. `none` requires positive complete pending-state evidence; optional omission or unavailable projection is `unknown`. Do not return confirmation tokens, pending hashes, private metadata, factors, sessions or requested-address history.

`contactBasis` is SHA256 over the canonical JSON array `[1,currentEmail,pendingEmail]`, using the strict reconstructed field order above, UTF8 without extra whitespace. It is consistency evidence only and contains no timestamp or local clock. The producer re-reads/rechecks the same basis before a current read's private return. A mutation compares the supplied basis with a fresh authoritative read before reserving/dispatching. It does **not** turn the provider PUT into atomic CAS: a later external Auth change remains a separate race and must not be silently reported as prevented.

UUID parsing/canonicalization and safe UTC receipt timestamps reuse Root conventions. Proposed finite caps are8,192 bytes per command,8,192 per Auth response and16,384 per result, with one10,000ms producer operation deadline from before the first await. These are proposed contact-lane bounds, not changes to existing channel defaults. Do not truncate large provider metadata or legacy data into a successful DTO. The email field is the requested contact address only: preserve exact accepted spelling; reject controls/NUL/unpaired Unicode and ambiguous boundary whitespace rather than silently casefolding/trimming. Syntax/normalization and the precise provider acceptance equivalence must be checked against the pinned SDK/actual Auth before freezing validator behavior. No invented universal email length, domain rule or deliverability test is added.

Exact proposed exports:

```ts
readAccountContactCommand(value:unknown):AccountContactCommand
mapAccountContactResult(value:unknown,
  command:AccountContactCommand):AccountContactResult
createClientAccountContactRequest(runtime:ApplicationSession):
  OperationPort<AccountContactCommand,AccountContactResult>
createAccountContactController(runtime:ApplicationSession,
  options?:{isApplicable?:()=>boolean}):AccountContactController
```

The controller type has `getSnapshot`, `subscribe`, `load`, `editEmail`, `setEmail`, `reviewEmail`, `requestChange`, `readOriginalStatus`, `discardEdit`, `dispose`. It keeps current facts, proposed edit, immutable dispatched command and historical acknowledgement separate. `discardEdit` discards local unsent work; it does not cancel provider work. There is no `retrySend`, resend, provider-cancel, preference-write or client-side `markVerified` export. A provider-accepted receipt never overwrites current email or means delivered/verified. After a callback, re-read canonical facts.

The proposed server module exports `createAccountContactProvider(config, store):AccountContactProvider`. Here `config` is the existing server-only `ConciergeTransportConfiguration`; `store` is a required **actual durable** `AccountContactFlowStore`, not an optional success fallback. Its single operation is `perform(credentials:Credentials, command:AccountContactCommand, signal:AbortSignal):Promise<AccountContactResult>`, called only by the existing serialized Vault dispatch after genuine context checks. No browser factory accepts these arguments. Parent must pin the private store's concrete implementation and exact internal SQL/Vault protocol before dispatch implementation; this report does not invent a public scope RPC or label a callback/store stub as a producer.

## Minimal missing producer facts and execution boundaries

Existing current-email/profile authority is enough for the current read. It is **not** enough for verified change dispatch. Required additional facts are limited to:

1. **Current target configuration and pending truth.** Verify the actual provider requires the necessary confirmations, preserves the UUID and exposes a reliable pending address/absence distinction. Pin actual SQL/provider field semantics/version before using them. A fresh `/auth/v1/user` response is provider evidence; it cannot by itself manufacture the profile's SQL session/role/deletion authority. Never write `auth.users.email` or its confirmation/pending fields directly.
2. **Original own actor/request custody.** Persist own actor UUID, request UUID, full accepted-command fingerprint, minimal dispatch disposition and server recording time; preserve the existing cross-family UUID collision restrictions if a new SQL journal is selected. No plaintext email/result/history copy is needed in that journal. A hash remains identifying metadata. Missing durable reservation means no dispatch. A marker written by an ordinary caller cannot be trusted as proof of provider acceptance.
3. **At-most-once application dispatch under crash/parallel sessions.** A server-owned atomic claim must precede the send. Record accepted/rejected only from the actual server provider result; a lost result stays `dispatch_unknown`. An expired claim is not proof of no send. Do not hold an SQL transaction across provider network work, auto-clear an ambiguous claim, or promise exactly-once external delivery. The existing Vault serializes one Vault, not every session for one actor; cross-session arbitration still needs its real producer. If that cannot be established, enable truthful read/status only and keep request unavailable.
4. **Private verification-flow custody.** Keep the generated PKCE verifier and original owner/provider-session/request linkage inside the existing encrypted server flow/Vault boundary. Browser JavaScript receives no provider credential, verifier or private Auth user object. Do not persist the SDK's complete `session.user` map as a new contact-history copy. Minimal verifier custody/expiry/retirement must follow a reviewed extension of existing flow cleanup, not an invented automatic PII-retention policy.
5. **Purpose-bound canonical callback.** Extend existing AuthFlow/worker/gateway/bootstrap deliberately for an email-change flow. Bind server-selected `/account` return, original UUID, request and actual verifier; prohibit account switching and adopting another flow. Retain CSRF, origin, expiry/replay and session-replacement fences. If the provider issues a new session, only the genuine canonical handoff can accept it, and old private caches/controllers retire. First confirmation may leave the change pending; do not label both legs complete or a current address verified from callback text, `USER_UPDATED`, HTTP200 or a code exchange alone.

These facts are **requirements for a producer**, not implemented tables, RPCs, grants, flags or callback endpoints. Parent owns their exact shared protocol/migration choices. There is no new service-role client, public journal stage selector, task impersonation or successful authority/currentness/Vault port in this pin. A new journal's ACL/RLS/cascades/lock order/helper predecessor and rollback need their own source review and both applicable native lineage checks before use.

Idempotency and concurrency rules for the proposed public wire:

- A new deliberate request captures/freeze-detaches exact schema/action/request UUID/basis/email before any await. Same actor+UUID with different original bytes rejects409. Exact replay returns the original known receipt/status, or unknown; it does **not** call `updateUser` again. Cross-family collision rules remain intact.
- An already pending different email or changed basis is409 with fresh facts fetched separately. Preserve the user's proposed email in session memory for explicit comparison; no blind reapply or replacement. Provider PUT has no proven conditional mutation, so even successful local arbitration is not proof against a direct Auth client race. Do not mark an old request superseded/completed based on a timer or a new request alone.
- Status is historical request bookkeeping only. `not_found` says this own application journal has no matching request, not that no other Auth operation occurred. `registered` does not mean sent. `provider_accepted` does not mean pending, delivered, verified or still current. `dispatch_unknown` persists until genuine evidence resolves it; canonical matching email can establish current contact facts without proving which request caused them.
- No automatic resend, new request UUID, retry under an altered email, rollback email, pending-change cancellation or force replacement follows an unknown outcome. Provider-specific recovery/abandoned verification must be separately proven and designed before adding an action. New dispatch remains unavailable if safe concurrency/recovery cannot be supplied.

One deadline covers body/SDK storage preparation/Auth/profile/pending reads/reservation/send/decode/status/rechecks and final return. Do not restart it inside SDK fetch, RPC, cleanup or a retry. Pre-dispatch abort/local denial means unavailable with no send; abort/timeout after actual dispatch means unknown write outcome. Initiate cancellation and late-body retirement, observe rejection, and bound the wait; do not assert physical provider or mail cancellation. Status reads can be retried under fresh actual authority without redispatch.

Preserve a genuinely received401/403 before body/statusText/headers/cleanup failure and local timeout classification, while never accepting an old response under a replacement session. Local route relevance can only deny. Recheck owner, role, audience, original provider-session correlation, actual lease/CSRF/deadlines, local/server generations, READY state, applicability and abort around serialization/getters, both actual lease waits, decode, catch, finally, cleanup and the sole private return/state publication. End/deny retires private snapshots, pending edits and conflict bases **before** abort/unsubscribe/observer callbacks. Offline state may preserve custody of the exact original; it admits no private success or new dispatch.

| Safe result | Required meaning |
| --- | --- |
| 400 `invalid_input` | Invalid exact schema/email syntax; no provider private error or account enumeration. |
| 401 `session_ended` | Actual known session/authentication denial; retire captured context only. |
| 403 `forbidden` | Actual role/own-client/deletion/operation denial; never convert to success/unknown contact. |
| 404 `not_found` | Unknown fixed route or unavailable own resource; no cross-client detail. A status DTO's own `not_found` is separately scoped above. |
| 409 `basis_conflict` / `request_conflict` | Current contact basis changed, pending conflict or UUID/content collision. No automatic overwrite. |
| 413 / 415 / 429 | Exact byte/type/rate bound. Rate limiting is not a fake sent email or401. |
| 503 `unavailable` / `uncertain` | Missing producer/registration/config, pre-dispatch failure, or post-dispatch unknown respectively. Never infer no write from503. |

All errors are bounded fixed safe codes; no email, SQL, provider message, tokens or private state is logged. No500 default or unsupported-channel error becomes empty success.

## Parent composition, reusable UI and proposed file claims

Today `account-profile`, `account-contact`, `account-departure`, `source-account` and `final-export` are absent from Root384's fixed gateway channel registry and client factory allowlists. The Root profile function has body/handler/runtime source but no mounted channel/Account entry. Unknown browser channels refuse locally403; unknown gateway API routes refuse404. A TypeScript cast does not register them, and local unsupported-channel refusal is not a received server authorization verdict.

Parent must coordinate the fixed `Channel`/`Operation` and `CookieChannel` types, both real JavaScript allowlists, client parser/exact actions, gateway known path/method/body cap, Vault command/worker dispatch, fixed provider operation and safe result/error mapper, actual-cookie facade, App route lifetime and callback bindings. New contact routes must resolve only to the fixed existing Supabase Auth/profile/approved private producer, never string-concatenated arbitrary endpoint/RPC input. Each layer retains the contact byte cap and whole operation budget. No deployment entry/config change is granted here.

Shared R7 `c900a0fcc7c5ed8d804dc487fa4ba2a43f081ae5` reviews frozen556 shared source with a scoped PASS, but Parent confirms it is **not yet projected into Root**. Its retained inventory witness remains nonzero12/14, not waived green. Root384 has different App session/generic transport/cookie/provider/policy/gateway bytes from this child's base. Use the reviewed shared correction only after Parent's explicit projection and compatible consumer checks; this report does not silently adopt it or certify Root's late-return paths. Credential CA4 remains under its separate R3 and grants no contact or Source-private activation.

Proposed later allocations, **no file claims activated by this report**:

| Author allocation | Disjoint NEW files only | Reuse / ownership fence |
| --- | --- | --- |
| Contact contracts/producer author | `src/contracts/PortalAccountContact.ts`, `PortalAccountContactValues.ts`, `PortalAccountContactValidation.ts`, `PortalAccountContactMapping.ts`; `apps/portal/session-integration/runtime/server/account-contact-provider.ts`; focused NEW contact tests | No edits to `PortalAccountProfile*`, shared exports, existing Auth provider, gateway, worker or migration. Parent must settle the private durable producer before enabling dispatch. |
| Contact UI author | `apps/portal/src/app/account-contact-request.ts`; `apps/portal/src/features/account/contact/model.ts`, `controller.ts`, `AccountContact.tsx`, `index.ts`; focused NEW contact UI/request tests | Real `ApplicationSession` -> `transport.bind` -> `clientCookieRequest` -> Root codec. No injected successful operation/currentness port. Import private module directly until Parent exports it. |
| Parent only | Shared registries/types/auth/routes/callback/Vault/store/migrations/root Account composition and release | Parent allocates any later one-migration reservation and global collision-helper successor; no child changes those through this research pin. |

Before allocation, Parent checks these proposed new paths against live claims. One writer owns the contract family while consumers use its fixed view model. The server provider and UI can proceed independently on stable types, but no unsupported channel may be patched into synthetic success to demonstrate completion.

Reuse `ui/index.ts` exports `Button`, `Field`, `Input`, `StatusNotice`, `SaveStatus`, `Dialog`, `OverlayProvider`; use `ApplicationShell`, existing page heading/navigation and semantic tokens. The small module renders inside the single Account profile/contact card with the approved `edit details` entry. Compose canonical name and the existing address module without a combined cross-domain save. Email review/request/pending/unknown status uses the common dialog lifecycle and clear labels; no new preference select, bespoke CSS control, second Account heading or alternate Auth page. Parent owns orchestration/focus/Back and avoids nested dialogs. The Account address component's existing page heading needs deliberate composition, not a second mounted page.

Do not copy the address lane's `retryOriginal` behavior onto an Auth email send: its legacy SQL confirmation is idempotent, while external Auth dispatch is not proven so. Keep the address lane's PaymentV2 read/legacy write distinction, cancelled-service new-intent denial, exact uncertain-original custody and frozen address rules unchanged. Existing `service_client_read` V3 incompatibility is still an honest separate failure, not permission to relabel legacy2500 data or manufacture billing facts.

Contact edits must never republish care, confirm payment, grant care/source rights, alter support/guarantee/review/Start clocks, modify frozen order/quote/recipient/address or auto-send a care notification. Mandatory neutral transactional events cannot disappear because of an optional preference. Keep personal contact and health text out of analytics/replay; replay stays disabled. No new plaintext PII copies, history, automatic cleanup or retention/deletion exceptions are authorized. Unknown obligations remain actual unknowns.

## Required validation and genuine gates

These are proposed acceptance cases, **not executed tests or new grants**:

| Gate | Required evidence |
| --- | --- |
| Strict contract/source | Exact fields/discriminants, request/result binding, no actor/URL/RPC/authority keys, byte boundaries, Unicode/email preservation, known/unknown pending distinction, historical receipt versus current profile; configured real app/test/frontend/session graphs without weakened flags/declarations. |
| Closed finite transport/actual cookie | Actual codecs/provider/Vault/cookies where allocated; unknown route/channel refuses, body/callback/cleanup errors and401/403 precedence, single operation budget including body and all waits, actual abort before/after dispatch, malformed/oversized/late provider bodies, setup/remove-listener reentry, disposal and session/role/owner replacement. These do not prove real permissions or delivery. |
| Idempotency/concurrency | Same UUID exact replay causes no second provider dispatch; changed content/global collision409; crash before/after durable claim and after provider acceptance; two independent actual sessions; pending replacement and direct-provider mutation; no blind CAS or exactly-once claim. Private journal/store rights and absence of caller-authored acceptance proof need independent review. |
| Actual SQL/Auth authority | Separately granted fresh isolated fixture, exact source/migration/TLS lineage and genuine permanent client/session; anonymous, task/advisor, revoked/deletion/ban, expired/revoked/replaced session and cross-client denial. Existing context after care expiry must admit only permitted admin entry while expired care reads and all care writes still deny. RLS/ACL/locks/cascades/collision lineages/rollback are genuine checks, not DTO predicates. |
| Genuine verification | Actual configured test Auth and isolated mail sink/recipients under a new exact grant. Verify existing old email remains canonical until genuine required confirmations; old-first/new-first, one-leg-only, duplicate/expired/superseded links, unavailable old address, rate limit and lost response; same UUID, pending truth, canonical read after completion and no session/cache resurrection. No real email is authorized by this report. |
| Mounted C08/C08C/C08R | Ordinary client, refresh/deep link/Back, keyboard/zoom/focus/dialog lifecycle, loading/unknown/denied/conflict/uncertain recovery, signout/deletion and late callbacks. Account/admin remains reachable independently of successful care read after the30-day boundary; static last-entitled export and individual unfinished admin rights remain separate. |
| Full goal/release | Independent source/integration review, actual browser/frame/mobile/a11y and human comprehension; complete original26screens/secondary flows, full required suites/exports, exact-head CI and separate cutover/release authority. Source/finite HTTP/actual cookie/static types are not SQL/browser/delivery/release evidence. |

## Read pins and terminal research scope

Key immutable Root384 blobs, in addition to the profile migration SHA above:

| Root source path | Git blob |
| --- | --- |
| `apps/portal/src/app/bootstrap.ts` | `086fd4e311699e29daf1558578874b1e1c3e314d` |
| `apps/portal/src/app/session.ts` | `405c90830b37f66fa2a2f2843c49c731e7e5565f` |
| `apps/portal/src/transport/session.ts` | `32331ca29d11c2ae5f5f8a817c727116d84e0341` |
| `apps/portal/site/auth/client-cookie-session.js` | `29810ad0f480dd3c92c4e4ef3fc1de17157d9da7` |
| `apps/portal/session-integration/sql/concierge_client_session_context.sql` | `7594b66e42787cb43f3ec10f35d3aee0999a463a` |
| `apps/portal/session-integration/runtime/server/client-upstream.ts` | `2b373ea1bdd3bf49491433d0ec6ef3654258612d` |
| `apps/portal/session-integration/runtime/server/session-vault.ts` | `a01468c357df860548d29dd5253aac696a24d138` |
| `apps/portal/session-integration/runtime/server/gateway.ts` | `683f91390dbc6daa4de82a67814e0c34542869b8` |
| `src/contracts/PortalAccountProfile.ts` | `1238058f2a63b411cb62085ebe16a5d8252a029b` |
| `supabase/config.toml` | `56b8a8ce926f9ca600f1c7892a9abfbaaf3bff19` |

Own ignored `root-source-pins.json` records26 exact Root path/blob/size/SHA rows and equality/difference against this child's base. `read-hashes.json` records requirement/design/profile-history/SDK/public-config reads. `candidate-source-pins.json` records individually selected address/service source at `c06c20f0`, departure source at `64534a84`, final-export consumer at `e949c9cc`, their independent finding reports and sharedR7. These are read inputs, not imported/admitted implementations. The profile lane's raw R1/AP1 failures, complete R2 source PASS, independently approved Parent witness successor and subsequent Root typed/unit/export evidence remain attributed to those reports; this research reruns none of them.

Validation for this delivery is docs-only: verify all local links, literal pins/input hashes, sole NEW tracked path, old tracked-tree preservation and `git diff --check`, then commit only this report and confirm clean tracked state. Commit/self-hash and terminal outcomes are returned separately to avoid self-reference. No app tests, compiler, dependency acquisition, heavy graph, SQL/DB/Auth/Storage/provider/socket/server/browser/process/resource query/start/reset/reuse/adoption, secret/env credential read, Root/foreign write, live client/email/payment/order action, push/PR/watch/comment/merge/deploy occurred. Public primary-document fetching and static PNG inspection are the only external research/visual operations.

Published draft PR211/stacked210 and earlier b86 three-check green are Parent-provided historical context, not this candidate's CI. Root handoff dirt and stopped fixtures were not touched or adopted. Source b8/SK2/SK3/SK4/final-private-egress, native NE5/NE6-S1, photo private bytes/current consumers, financial/Guidance/M65 refusals and genuine/browser/fullCI/release holds remain unchanged; none was retried or rerouted. This pin requests Parent review of a proposed interface only.
