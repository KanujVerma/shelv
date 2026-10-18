# Concierge R1 HTTP adapter

Source-only integration slice. No deployment, grants, configuration, migration or client UI is included. Runtime uses native Fetch and has no package dependency.

`src/contracts/ConciergePortal.ts` defines `ConciergeCommand`, `ConciergeRpcCall`, `ConciergeClientView`, `ConciergeAdvisorView` and `ConciergeWriteReceipt`. `ConciergePortalMapping.ts` validates R1 responses and creates new objects from explicit field allowlists. The client projection contains no draft, intake, advisor identities, private notes or upload paths. Advisor reads use a separate projection only after the RPC authorizes the bearer.

POST JSON actions:

| Action | Extra fields beyond `action` | Authoritative RPC |
| --- | --- | --- |
| `client_read` | None | `concierge_client_view()` |
| `advisor_read` | `clientId` | `concierge_advisor_view(uuid)` |
| `submit_intake` | `requestId`, `expectedRevision`, `goal`, `note`, `baseline` | `concierge_write` |
| `save_draft` | `requestId`, `expectedRevision`, `clientId`, `intakeVersion`, `recommendations`, `advisorNote` | `concierge_write` |
| `publish` | `requestId`, `expectedRevision`, `clientId` | `concierge_write` |
| `decide` | `requestId`, `expectedRevision`, `version`, `recommendationId`, `choice`, `reason` | `concierge_write` |
| `receive` | `requestId`, `expectedRevision`, `version`, `recommendationId` | `concierge_write` |
| `start` | `requestId`, `expectedRevision`, `version`, `recommendationId`, `startedOn` | `concierge_write` |

The HTTP server re-verifies the bearer through Supabase Auth for every request, then sends the identical bearer to PostgREST. Owner targets come from that verified identity. Neither user metadata nor request role claims authorize advisors. R1 independently rechecks permanent identity, deletion fences and the server-owned advisor row, including before replay. Client writes reject `clientId`. Unknown input fields are rejected.

Keep the original request UUID, expected revision and payload when retrying an uncertain write. The adapter never retries, generates a request ID, refreshes credentials or substitutes a revision. Conflicts return HTTP 409; authentication/authorization rejection returns 401/403; unexpected upstream failures return a sanitized 503. Mutation replies are receipts only: refetch the client projection to observe authoritative routine state. Receipt and start are distinct operations. Only SQL can accept a nonfuture actual start after approval and receipt. An order proposal is always nonpayable and is not a checkout, payment confirmation or purchased order.

Server environment: `SUPABASE_URL` (HTTPS origin), `SUPABASE_PUBLISHABLE_KEY` or existing `SUPABASE_ANON_KEY`, and comma-separated exact `CONCIERGE_ALLOWED_ORIGINS`. No service-role key is read. Requests are limited to 100,000 bytes. Auth/error response bodies are bounded; successful RPC projections retain full R1 history. Upstream requests have a 10-second timeout, omit cookies, refuse redirects and do not cache. Responses are private/no-store. There is no logging, analytics or model/provider path.

Run the executable synthetic tests from the repository root:

```sh
node --experimental-strip-types --test tests/concierge-*.test.ts
```

The HTTP tests use ephemeral `127.0.0.1` listeners and fixed synthetic Auth/PostgREST exchanges. They exercise the actual handler, transport, JSON encoding, headers and mapping. They do not prove SQL authorization, TLS, actual JWT issuance, Deno gateway configuration, concurrency, database idempotency or hosted revocation. The entrypoint test executes the real source with a Deno host shim. The dependency-free entrypoint still requires real Edge compile/gateway acceptance before deployment.

## Required integration gates

R1 staging provenance: `20261017190016 / concierge_persistence_r1`; reviewed source SHA256 `e3af84988c8ef9a506780b9c9fa21b1a4a156a3bba2ab9ee4d780385cb3e915a`. This adapter does not install that schema. Canonical HEAD does not include the staged R1 migration, so a fresh database needs the reviewed migration lineage separately.

Do not expose this adapter as the complete concierge portal before additive server contracts implement invitation-only enrollment, manually confirmed service-payment entitlement, cancelled-client last-entitled-plan reads, and distinct advisor view/edit/publish capabilities. R1 currently admits any permanent owner for self-intake and gives every active advisor publish access. Its self-intake action is compatibility transport, not the approved Zoom-call/advisor-notes intake workflow. Do not grant Sami's account the R1 advisor row as a substitute for view-only permission.

Auth rejection is handled without caching; immediate revocation of an otherwise still-valid access JWT is not proven by this transport. Existing R1 rechecks user/deletion/advisor state but does not inspect `auth.sessions`. Any strict session-revocation requirement needs its own authoritative backend contract and acceptance.

Private payment screenshots, manual bank confirmation/audit and separate service/product allocations belong to the payment feature. Check-in history and optional photos/questionnaires belong to the check-in/intake feature. Neither is added to these R1 payloads or logged. Product approval/payment/receipt must never be substituted for actual start. The advisor frontend consumes these typed contracts without changing the agreed client presentation.
