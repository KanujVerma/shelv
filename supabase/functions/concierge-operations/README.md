# Concierge R1 HTTP adapter

Local source integration. Two reviewed migration sources are included; neither is applied to a hosted project. No access grants, configuration, deployment or client UI is performed by this adapter. Runtime uses native Fetch and has no package dependency.

`src/contracts/ConciergePortal.ts` defines `ConciergeCommand`, `ConciergeRpcCall`, `ConciergeClientView`, `ConciergeAdvisorView` and `ConciergeWriteReceipt`. `ConciergePortalMapping.ts` validates R1 responses and creates new objects from explicit field allowlists. The client projection contains no draft, intake, advisor identities, private notes or upload paths. Advisor reads use a separate projection only after the RPC authorizes the bearer.

POST JSON actions:

| Action | Extra fields beyond `action` | Authoritative RPC |
| --- | --- | --- |
| `client_read` | None | `concierge_client_view()` |
| `advisor_list` | None | `concierge_advisor_directory()` |
| `save_intake` | `clientId`, `requestId`, `expectedRevision`, `goal`, `note`, `baseline` | `concierge_advisor_write` |
| `save_meeting_note` | `clientId`, `requestId`, `expectedRevision`, `kind`, `text` | `concierge_advisor_write` |
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

R1 prerequisite: `supabase/migrations/20261017190016_concierge_persistence_r1.sql` is the exact existing staging installation alias (SHA256 `0a681863f11747a047c7c820128c410db88d37512a3cbae9be195304725ba557`) of reviewed R1 candidate `e3af84988c8ef9a506780b9c9fa21b1a4a156a3bba2ab9ee4d780385cb3e915a`; only outer transaction statements differ. `20261018234537_concierge_portal_workflows.sql` requires R1 and replaces its public entry points with enrollment, capability and entitlement guards before every operation/replay. R1 alone has broader owner/advisor permissions and must not be exposed as the complete portal. Hosted historical migration aliases differ from canonical lineage; do not run an unreviewed blanket database push against that ledger.

The additive migration has no seeded users/enrollments/capabilities. Trusted server advisor rows separately enforce view/edit/publish/bank-confirmation. User metadata and email strings never authorize a role. Both Kanuj and Sami may receive equal advisor capabilities after verified identity and action-time approval; no real grant is made here. An enrolled owner sees only entitled published snapshots and retains the last entitled plan after cancellation; revocation blocks access, expired/cancelled service blocks ongoing submissions. Optional pre-meeting reports/photos do not require a started routine or payment. Advisor intake and pasted meeting text remain private until an explicit immutable publication. `submit_intake` is rejected by the additive public SQL wrapper; use advisor `save_intake` after the actual meeting.

`advisor_list` returns `{capabilities:{view,edit,publish,confirmPayments},clients:[{clientId,displayName,enrollmentStatus,revision,publishedVersion,hasDraft}]}`. `advisor_read` also returns private `meetingNotes:[{id,kind,text,createdAt}]`. Intake bounds are 300/4000 Unicode code points; private notes/transcripts accept 20000. Saving a later intake cannot change the frozen active baseline.

Auth rejection is handled without caching; immediate revocation of an otherwise still-valid access JWT is not proven by this transport. Existing R1 rechecks user/deletion/advisor state but does not inspect `auth.sessions`. Any strict session-revocation requirement needs its own authoritative backend contract and acceptance.

Private payment screenshots, manual bank confirmation/audit and separate service/product allocations belong to the payment feature. Check-in history and optional photos/questionnaires belong to the check-in/intake feature. Neither is added to these R1 payloads or logged. Product approval/payment/receipt must never be substituted for actual start. The advisor frontend consumes these typed contracts without changing the agreed client presentation.

## Acknowledged feature interfaces (implemented in local additive SQL)

Feature owners may implement validation, handlers and transports against injected `ConciergeAuthenticatedPorts<TheirRpcCall>`, exported from `src/contracts/ConciergePortal.ts`. `authenticate(token, signal)` verifies identity; `rpc(token, call, signal)` preserves that bearer. There is no separate client-provided advisor or entitlement flag and no invented local guard that grants access. Each SQL operation must recheck permanent identity, deletion fence, invitation/enrollment, target ownership and the required server-owned capability before processing or replay. Cancellation and historical access policy stay authoritative in SQL. Do not equate Sami's future view capability with write, bank-confirmation or publish capability.

Payment owner exclusively owns `supabase/functions/concierge-payments/**` and `tests/concierge-payments*`. The proposed private `types.ts` and `contract.ts` shapes are accepted: immutable quote versions and integer allocations, unverified/confirmed/rejected claims, and receipts that distinguish service unlock from product ready-to-purchase. Accepted RPCs:

- `concierge_payment_view(p_client_id uuid)`.
- `concierge_payment_write(p_client_id uuid, p_action text, p_expected_revision bigint, p_request_id uuid, p_payload jsonb)`, actions `issue_quote`, `submit_claim`, `confirm_payment`, `reject_claim`, `confirm_shipping_address`.
- `concierge_payment_evidence_reserve(p_client_id uuid, p_request_id uuid, p_expected_revision bigint, p_quote_id uuid, p_quote_version integer, p_content_type text, p_size_bytes bigint, p_sha256 text)`; descriptor `{evidenceId,clientId,quoteId,quoteVersion,storagePath,contentType,sizeBytes,sha256,status:'reserved'|'uploaded'}`.
- `concierge_payment_evidence_commit(p_evidence_id uuid, p_request_id uuid)`; receipt `{evidenceId,quoteId,quoteVersion,status:'uploaded_unverified'}`.
- `concierge_payment_evidence_access(p_evidence_id uuid)`; freshly authorized descriptor for server Storage I/O.

Private bucket: `concierge-payment-evidence`; immutable server path `clientId/quoteId/evidenceId.(jpg|png)`. Reservation checks the current payment revision and immutable quote; evidence completion/access recheck the referenced reservation, actor and quote. Evidence completion does not confirm a bank payment or unlock a plan. Financial confirmation atomically checks the exact allocations/current quote and records the authorized advisor's bank-verification audit.

Check-in owner exclusively owns `supabase/functions/concierge-checkins/**` and `tests/concierge-checkins*`. The RPC/payload/projection/receipt shapes proposed in that feature's README are accepted with these names:

- `concierge_checkin_read(p_client_id uuid)` and `concierge_checkin_advisor_read(p_client_id uuid)`; distinct explicit client and advisor projections.
- `concierge_checkin_write(p_client_id uuid, p_action text, p_expected_revision bigint, p_request_id uuid, p_payload jsonb)`, actions `submit_report`, `set_next_checkin`, `add_meeting_note`, `reserve_photo`, `complete_photo`.
- `concierge_checkin_photo_authorize(p_client_id uuid, p_photo_id uuid)`; freshly authorized descriptor for server Storage I/O.

Private bucket: `concierge-checkin-photos`. Answers are bounded to 1000 Unicode code points, private meeting notes to 4000; `changes` may be empty, angles are front/left/right with at most one of each. Report submission atomically attaches only complete, unused, owner-bound photo references and never changes a routine. Optional pre-meeting uploads must not be locally blocked by an assumed routine-start or paid-through rule; the central phase/access guard will distinguish optional pre-meeting input from ongoing check-ins. Do not introduce an unapproved automatic service-expiry timer in a feature handler.

Financial writes and check-in writes use separate feature revision streams, not the R1 plan revision. Check-in photo reserve/complete participate in the check-in stream. Payment evidence completion changes only its evidence state, not the financial quote/claim revision. Reserve and complete require distinct stable request UUIDs; preserve each phase's original arguments on exact retry. An uncertain upload retry must verify exact size/type/SHA256 of an existing immutable object, never treat a generic conflict as success. A new expected revision after a conflict is a new intent with a new request UUID, not a changed-payload replay.

Both upload features use at most 5 MiB of validated image bytes (payment JPEG/PNG; check-in JPEG/PNG/WebP), non-upserting server Storage I/O after fresh bearer authorization, and signed reads of at most 60 seconds. Raw paths/descriptors, filenames and bytes are excluded from Edge client projections, analytics, replay, logs and model prompts. Shared schema, lifecycle/deletion integration, capability enforcement, route composition and local SQL acceptance remain core-owned. These source names do not imply hosted installation, credentials or any real account grant.


## Confirmed publication, payment and shipping rules

A first service-only invoice may use `publicationVersion:0`, `serviceCents:10000`, `servicePeriod:null`. Its immutable quote means “starts on first publication.” A bank-confirmed pre-publication payment returns `serviceUnlocked:false, serviceAccessStatus:'pending_publication'`; its separate service period is anchored once, on the first publication date in America/Chicago, and lasts one calendar month. Publication revisions never renew or extend it. Later service invoices must use the previous paid end date and one calendar month. No automatic charge, timer or bank integration exists. Access always comes from a fresh SQL read; an expired service confirmation does not imply active access.

`PaymentView.nextServicePeriod` supplies the server-derived next invoice month (first publication or previous paid end), null while the first publication is pending. An unpaid published plan can expose this invoice date without granting access. `reject_claim` requires edit capability; bank confirmation separately requires confirm capability.

`PaymentView.service` is `{status:'unpaid'|'pending_publication'|'active'|'expired'|'cancelled',period:{startOn,endOn}|null}`. The current covering period is projected before a future prepaid renewal. Client plan and routine projections remain empty before entitlement; published plan data and private drafts are separate. Exact payment confirmation atomically writes the bank audit, entitlement and product `ready_to_purchase` reference; it never purchases, receives, starts or ships a product.

Shipping is direct to the client's explicitly confirmed private address. Owner action `confirm_shipping_address` takes `{address:{recipientName,line1,line2,city,region,postalCode,countryCode}}`, returning `{revision,operation:'confirm_shipping_address',addressVersion}`. Text bounds are 200/200/200/100/100/20 code points; line2 may be empty; countryCode is uppercase ISO alpha-2 shape. Quotes and claim/confirmation basis include `shippingAddressVersion`, null for service-only and the current positive confirmed version for products. An address change, product decision/receipt or new publication supersedes unpaid product quotes. A service-only invoice and its private bank proof survive publication revisions; the original service month stays anchored. The private payment view includes latest `shippingAddress:{version,address}|null` plus immutable `shippingAddresses:[{version,address}]`; manual fulfillment resolves the quote's exact version and must flag a newer address for client reconfirmation. Payment references contain no intake, rationale or health text. No retailer, local handover or autonomous procurement path is added.

The deletion handler now runs `private-storage-cleanup.ts` after the committed deletion fence and before deleting Auth. It inventories both new private namespaces including unreferenced objects, removes bytes through Storage, then verifies emptiness; any uncertainty preserves the account and fence. A Storage object INSERT trigger shares that fence, closing the already-authorized-upload race. Actual Storage API bookkeeping and physical deletion still require acceptance against the intended Storage version.

Local acceptance: `python3 tests/concierge-workflows.sql.py` uses only the explicitly marked PostgreSQL fixture. `--reset` replaces only that disposable clone of the approved R1 fixture. Its Auth GUC helper is synthetic, not real JWT validation. Runtime tests use fixed fake Auth/PostgREST exchanges. Hosted Auth/JWT, invitation delivery, verified advisor provisioning, native Storage upload/sign/delete, gateway configuration and migration-ledger repair remain unproven integration gates. No production access or provider control is changed.
