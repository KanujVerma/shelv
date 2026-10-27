# Concierge manual payments

Source-only payment function for the existing concierge system. Core owns shared Auth/capabilities, enrollment/lifecycle, schema/migrations/RLS/deletion and route composition. The current versioned portal source is `apps/portal/site/features/payments/`; older recovered output and QA evidence remain historical provenance.

## Manual methods V2 candidate

The current local candidate adds explicit `schemaVersion:2` reads/writes and method-bound evidence around the preserved V1 financial transaction. Manual methods are Zelle, Cash App `$KanujVerma` and Apple Cash `(925)719-1334`, selected by Kanuj. No Apple Pay, automatic transfer, account setup, refund transaction or refund ledger is implemented.

Migration `20261024234059_concierge_manual_payment_methods.sql` adds private versioned recipients, separate eligibility/status, immutable quote options, method-bound evidence/claims and full V2 intent receipts. Existing approved Zelle remains enabled in the candidate; Cash App/Apple Cash definitions start disabled until exact release configuration review. Both service/product components are configurable, and fixtures exercise all three. Supplied destinations/authentic logos do not establish provider business eligibility. Previously surfaced provider-term concerns remain operations context, not an additional code-authoring gate.

V2 RPCs are `concierge_payment_view_v2`, `concierge_payment_write_v2` and evidence reserve/commit/access names suffixed `_v2`. Browser action names stay the same with schemaVersion:2. Claims/confirmations bind `paymentOptionId`; confirmation requires explicit `receiptVerified:true` after checking the client's **gross quoted payment** and exact selected account. Provider fees may reduce net settlement; no fee engine or silent surcharge is added. Existing amount, address, publication, funding, entitlement and Start rules run unchanged in the same transaction as method bindings. Screenshots/client claims still confirm nothing.

Public V1 paths reject method-bearing data/identities with `concierge_payment_contract_upgrade_required`. Original fingerprints/receipts remain intact. V2 cannot adopt a V1 UUID or retrofit an old quote; V1 cannot obtain the stripped internal receipt of a V2 transaction. Legacy history is Zelle with unrecorded historical recipient details, never today's recipient fabricated as history. Only still-payable legacy quotes may show current instructions.

Compatibility guards execute under the existing request/client advisory locks after identity/profile/capability checks. V1 views serialize the marker check and legacy projection with client writes; reserve/commit/access wrappers recheck their markers under the same client boundary. Native held-transaction tests force the prior check/wait/commit window, including a Cash App-only quote, rather than relying on sequential replay alone.

After any V2 record exists, the old Zelle-only archive is **not a compatible application rollback**. Retain V2 readers/adapters. Recipient availability can pause new V2 issue/claim activity without rewriting snapshots or recorded claim review; this does not erase history or automatically pause all legacy Zelle processing. No hosted configuration is changed here.

Advisor previews/payment-status gates preserve V2 metadata. Owner screenshot proxies carry an explicit contract version, retaining old token-free image paths and fresh ownership checks. Session/cookie capabilities remain unchanged. Tests are `tests/concierge-payment-methods*.test.ts`, `apps/portal/tests/payment-methods.test.mjs` and runtime `tests/manual-methods-policy.test.ts`. Opt-in native proof uses `CONCIERGE_METHODS_NATIVE_SQL=1`, supports `CONCIERGE_TEST_PG_BIN`, and includes exact restored Maya SQL plus addition/optional funding and explicit Start. Evidence: `.local-artifacts/payment-methods/REPORT.md`.

## Preserved legacy V1 behavior

- Zelle only; approved default recipient is Kanuj Verma, kanuj.verma12@gmail.com, (925)719-1334. Server-owned optional configuration is `CONCIERGE_ZELLE_RECIPIENT_NAME`, `_EMAIL`, `_PHONE`. No environment/credential configuration was performed.
- Monthly service is exactly 10000 integer cents for one calendar month, with end-of-month clamping. The first month starts on the first plan publication’s America/Chicago date. Paying before publication remains `pending_publication` with no access or elapsed service days. Republishing never renews or extends service. Subsequent paid periods start at the previous paid end; there is no automatic charge. Product amounts, final product tax and final product shipping are itemized separately. Quotes may cover service, products or both. No credit/balance/refund or automatic billing system exists.
- `submit_claim` records the exact immutable quote ID/version and service/product allocations as `submitted_unverified`. Screenshots remain `uploaded_unverified`. Neither unlocks service or product purchasing.
- `confirm_payment` requires an advisor's explicit `bankReceiptVerified:true` after checking the actual bank receipt outside the app. The SQL transaction must settle exactly the expected quote/claim amounts and atomically unlock the entitled published service plan and/or mark products `ready_to_purchase`. It never means purchased, received or started.
- Product funding is scoped to `(clientId,recommendationId)` across publications. A confirmed obligation cannot be quoted, claimed or confirmed again under a new request; the boundary preserves `concierge_product_already_funded` as HTTP 409. Exact authorized retries still replay the original result. A distinct recommendation ID for the same product requires fresh client approval; this is not lifetime SKU uniqueness or a replenishment lifecycle.
- Shipping only: advisors manually order directly to the client-confirmed private address. There is no pickup, local handover, retailer checkout, ordered/shipped status, or automatic procurement. Each product quote binds an immutable address version; changing the address supersedes unpaid product quotes. A settled quote retains its original private address snapshot. If it differs from the current address, the panel blocks readiness presentation and requires advisor/client reconciliation before ordering. No address reconciliation/purchase action is implemented.
- Unknown financial response fields are excluded. No bank reference, screenshot bytes/paths, private health notes, filenames or payment details are sent to analytics, replay, logs or model providers.

## Accepted interfaces

Canonical core ACK: `../concierge-operations/README.md:44`. `PaymentPorts` uses the shared `ConciergeAuthenticatedPorts<PaymentBackendCall>` from `src/contracts/ConciergePortal.ts`. `createPaymentPorts()` composes the shared verified-bearer transport with a fixed five-RPC registry. Financial RPCs always use the verified user's bearer and public key, never the Storage service key. No client actor/advisor flag is accepted.

All JSON command fields are exact allowlists. The financial revision is independent of the R1 plan revision. Write envelopes use `requestId` and `expectedRevision` plus action fields:

| Action | Target and action fields |
| --- | --- |
| `client_read` | Owner derived from verified identity; no caller target |
| `advisor_read` | `clientId` |
| `issue_quote` | `clientId, publicationVersion, serviceCents, servicePeriod, shippingAddressVersion, items, productSubtotalCents, taxCents, shippingCents, productTotalCents, totalCents` |
| `submit_claim` | `quoteId, quoteVersion, serviceCents, productCents, totalCents, shippingAddressVersion, evidenceId` (nullable) |
| `confirm_payment` | `clientId, claimId, quoteId, quoteVersion, serviceCents, productCents, totalCents, shippingAddressVersion, bankReceiptVerified:true` |
| `confirm_shipping_address` | Owner derived from verified identity; `address:{recipientName,line1,line2,city,region,postalCode,countryCode}` |
| `reject_claim` | Same target/basis as confirmation, with `reasonCode` instead of bank flag: `not_received`, `amount_mismatch`, `duplicate_claim`, `wrong_recipient` |

Core RPCs are `concierge_payment_view(p_client_id)` and `concierge_payment_write(p_client_id,p_action,p_expected_revision,p_request_id,p_payload)`. View is `{revision,quotes,claims,service,nextServicePeriod,shippingAddress,shippingAddresses}`; HTTP adds the server-owned `recipient`. Quote, claim and receipt fields are declared in `types.ts`. Histories are complete arrays without an arbitrary record-count cap.

### Service and shipping projections

`service` is `{status:'unpaid'|'pending_publication'|'active'|'expired'|'cancelled',period:{startOn,endOn}|null}`. An unpaid period may show known first-publication dates; it grants no access. `nextServicePeriod:{startOn,endOn}|null` is the authoritative next invoice period. The UI uses its exact start and monthly end, never the browser clock. A null service period on a 10000-cent quote means the first publication will establish it; the immutable quote is never rewritten. Publication version 0 permits only a service-only quote. Service-only quote/proof survives republication; product quotes require the current publication and approved items.

`shippingAddress` is the latest `{version,address}|null`; `shippingAddresses` contains the complete private immutable history. Address fields are exactly seven strings; name/street limits are 200 Unicode characters, city/region 100, postal code 20, and country is two uppercase letters. `line2` may be empty. Products require the current owner-confirmed version, reviewed explicitly by the client before the sent claim; service-only quotes use null. The address receipt is `{revision,operation:'confirm_shipping_address',addressVersion}`.

Financial receipts add `serviceAccessStatus:'pending_publication'|'active'|null`. `serviceUnlocked` is true only for active entitled service; product confirmation returns `productOrderStatus:'ready_to_purchase'` only. A generic bank-confirmation banner avoids claiming procurement readiness before the refreshed address state is checked. Advisor quote/reject requires edit; bank confirmation separately requires confirm-payments authority. UI `canConfirm` defaults false.

### Private screenshot flow

`multipart/form-data` has exactly two fields: JSON `metadata` and image `file`. Metadata is `{action:'upload_evidence',requestId,completionRequestId,expectedRevision,quoteId,quoteVersion}`. Reserve/completion UUIDs are distinct and remain stable across exact retries. Original filenames are ignored.

PNG/JPEG only, at most 5 MiB. PNG chunk lengths/CRC/header, bounded zlib expansion and scanline filters are checked; JPEG uses the existing vendored bounded decoder. Images are capped at 16 Mi pixels and 8192 per side; PNG decoded bytes at 64 MiB, JPEG decoder memory at 128 MiB. No OCR or provider call occurs. WebP/SVG are rejected.

1. `concierge_payment_evidence_reserve(p_client_id,p_request_id,p_expected_revision,p_quote_id,p_quote_version,p_content_type,p_size_bytes,p_sha256)` returns `{evidenceId,clientId,quoteId,quoteVersion,storagePath,contentType,sizeBytes,sha256,status:'reserved'|'uploaded'}`. SQL must bind exact bytes/type/size/quote to the request fingerprint.
2. Server Storage writes the exact validated path `clientId/quoteId/evidenceId.(jpg|png)` in private `concierge-payment-evidence`, with upsert false. Existing-object retries download and compare the exact bytes; generic conflicts never count as success.
3. `concierge_payment_evidence_commit(p_evidence_id,p_request_id)` uses the **completion** UUID and returns `{evidenceId,quoteId,quoteVersion,status:'uploaded_unverified'}`. This changes evidence state only, not the financial revision. A failed upload never commits. A failed commit leaves the immutable reserved object inaccessible through this function until a later authorized retry; retention/deletion cleanup is core-owned.
4. JSON `{action:'evidence_url',evidenceId}` calls `concierge_payment_evidence_access(p_evidence_id)` before issuing a private URL for at most 60 seconds. Exact path/origin is checked and responses use no-store. SQL must authorize the current owner/advisor capability and account/deletion lifecycle on every request.

## Authoritative SQL requirements and remaining acceptance

Every read/write/reservation/completion/access operation must recheck permanent identity, strict session/deletion fences, invitation/enrollment and target ownership or the required server-owned advisor capability. These checks precede exact retry replay, including revoked advisors. Financial writes must lock the quote/client/claim stream, reject stale revisions/publications/quote versions/changed totals and mismatched evidence, and preserve an immutable audit/request ledger. Same actor/request/payload replays the original result; changed input under a reused request UUID rejects. A different request must not settle an already confirmed claim or quote. Recipient changes/quote invalidation, cancellation and historical plan rights remain core policies.

No SQL, bucket, grant or hosted change is installed by this module. With explicit core authorization, its function-only v2 and marker-guarded funding v3 patches were applied solely to the marker-verified disposable local payment fixture, preserving existing tables/data/roles. Actual Auth/JWT gateway, native Storage HTTP, retention/cleanup behavior and the fully composed authenticated portal still require runtime acceptance. Core owns native SQL/RLS, simultaneous confirmations, deletion and cancellation policy acceptance. Unit ports and fetch interception are not evidence for those gates. No bank transfer or real client data was used.

## Verification

Use the local Node22 runtime (default shell Node is older):

```sh
/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node --experimental-strip-types --test tests/concierge-payments*.test.ts
./node_modules/.bin/tsc --ignoreConfig --noEmit --strict --types node --allowImportingTsExtensions --target es2022 --module esnext --moduleResolution bundler --skipLibCheck tests/concierge-payments*.test.ts
```

Tests cover cents/month arithmetic, immutable expected basis, explicit bank verification, unverified projections, response privacy, bearer/registry composition, offline source entrypoint registration, bounded/type-validated upload, cross-path descriptors, fresh signed-read authorization and immutable byte-verified Storage retries. Offline SQL failure-mapping tests use synthetic ports. The explicitly gated native test additionally exercises the real HTTP handler → local SQL RPC chain with synthetic authenticated-role claims and a metadata-only Storage adapter; it does not establish actual JWT gateway or native Storage HTTP behavior. Independent review findings for malformed item arrays, UUID case comparisons, forged image containers and full history were fixed with regressions.


Opt in to the existing core-provisioned disposable fixture only (the test checks the exact database name/comment before seeding fresh synthetic UUIDs; it never resets, truncates, migrates or creates roles):

```sh
CONCIERGE_PAYMENTS_NATIVE_SQL=1 /Users/kanuj/.nvm/versions/node/v22.23.0/bin/node --experimental-strip-types --test tests/concierge-payments*.test.ts
```

Latest result: 35/35 payment tests pass with the native fixture enabled; strict focused TypeScript passes. Native assertions cover payment before publication, initial publication and republishing, exact/changed retries, cross-owner access, separate edit/confirm capabilities and revocation-before-replay, server invoice anchors/prepaid renewal, service-only proof across republishing, unapproved/stale product quotes, duplicate funding across publications, fresh approval of a distinct same-product obligation, private evidence completion/access, and retained paid-address history. No actual bank transfer, real client data or credentials were used. Expired/cancelled service policy and concurrent SQL settlement are covered by core’s separate native acceptance, not claimed by this feature test.
