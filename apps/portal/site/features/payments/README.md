# Payment panel integration

## Current manual methods V2

The panel requests `schemaVersion:2` payment reads, preserves immutable per-quote `paymentOptions` and offers manual Zelle/Cash App/Apple Cash tiles with local official-source artwork. Labels and source hashes are in `assets/payment-methods/ASSET-SOURCES.json`. Multiple available methods require a deliberate choice; a retired prior choice never silently selects a different recipient. The exact saved name/identifier and Copy control sit inside the quote. There is no automatic checkout, deep-link purchase or money transfer.

New claims/evidence bind `paymentOptionId` and their original quote/version. Uploads are cached per quote+option; switching cannot reuse another method's screenshot. An uncertain upload/claim locks selection and retries its exact UUID/body/bytes. Wrong-option acknowledgements stay uncertain. Failed authoritative reload leaves payment actions unavailable. Confirming uses a separate unchecked actual-receipt acknowledgement of the client's gross quoted amount and selected account, preserving canConfirm authority and distinguishing provider fees from net payout.

Advisor screenshot views use an authenticated, token-free `/api/advisor/media/evidence` URL, not the provider's signed Storage URL. Each descriptor has a cache-only view UUID; image reads reauthorize through the current advisor session/Vault and Edge guard, validate owner/quote/evidence path and signing source, then proxy bounded PNG/JPEG bytes. Held bytes are fenced after permission loss or logout. Provider credentials and signatures never reach the browser. The same cookie adapter and mounted panel are exercised by the runtime advisor-evidence browser test.

Legacy records retain Zelle identity with historical recipient unspecified. Current instructions are only for still-payable legacy quotes. Read-only older empty/sample envelopes remain compatible; method-bearing data cannot be silently projected as legacy Zelle. Maya mounts the same shared payment fixtures rather than its embedded historical copies. No clinical plan, service price, shipping/publication/funding rule or explicit Start behavior changes.

Approved policy copy states that dissatisfied clients can request service fees already paid back during their first three months by phone/messages; product payments remain separate. Repayment is manual with private confirmation. This adds no refund ledger, transaction or cancellation effect. Apple Pay is deferred. Provider commercial eligibility is not claimed as verified; activation remains part of exact release configuration review.

Portable verification: `node --test apps/portal/tests/payment-methods.test.mjs`, the client-parity/reply suites, root `tests/concierge-payment-methods*.test.ts` and runtime manual-method policy tests. Detailed red/green/source/activation evidence is under ignored `.local-artifacts/payment-methods/REPORT.md`.

The explicitly synthetic Alex/Maya routes also use `syncPaymentPreviewProposal(store,view)` to prepare preview quotes from actual approved, unfunded order proposals. Untouched service-only seeds are synchronized before their first read without inventing revisions; later real selection/publication changes supersede only unpaid quotes. Settled snapshots, funded products and paid service are never re-quoted, and ordinary navigation does not issue quotes. This fixture helper is never used for live financial authority. `apps/portal/tests/preview-payment-proposals.test.mjs` verifies those route and preservation rules.

## Host integration and preserved V1 contract

`mountPaymentsPanel(element, {clientId, mode, request, canWrite, canConfirm?, productLabels?, productDescriptor?})` from `index.js` mounts the isolated panel and returns cleanup. Modes are `client` and `advisor`. CSS is scoped to `.shelv-payments` and loaded once from `payments.css`. No credentials, configuration, route changes, localStorage, logs, analytics or model calls occur here.

`request(command, {signal} = {})` is the host's authenticated payment-specific transport. Send JSON commands to the payment function. For `FormData`, send the multipart body unchanged without a JSON Content-Type. Return the parsed successful wire body; throw `{status,code}` on failure. Never substitute fixtures after a live failure.

`canWrite` comes from authoritative edit/enrollment rights and controls client claims/uploads/address confirmation and advisor quotes/rejections. Separate `canConfirm` defaults false and must come from `confirmPayments`; edit never implies bank confirmation. SQL enforces every operation independently. `productLabels` maps opaque recommendation IDs to known product names for legacy R1 integrations that omit the descriptor callback.

## Historical product display

Optional synchronous `productDescriptor(publicationVersion, recommendationId)` returns `{name, sizeLabel, productUrl} | null`. The panel calls it with each immutable quote’s `publicationVersion` and each line’s `recommendationId`. Root owns the R2 publication/history resolver; do not resolve from the latest plan or a mutable catalog. Only name, size and product link are displayed; rationale, health content and instructions are never copied into payment commands or financial records.

When the callback is present, a null, failed or invalid descriptor shows the opaque recommendation ID and an unavailable-details message. It never falls back to `productLabels`, because a missing historical snapshot does not prove that current labels describe the quoted item. An R1 integration may omit the callback to retain the legacy labels map. A historical R1 item inside an R2 panel needs an explicit safe historical resolver result; null does not authorize a latest-label fallback.

A nonempty name is required to display descriptor metadata. Size and URL may be null or absent; size is plain text. Product links accept only HTTPS URLs without embedded credentials, use `noopener noreferrer` and `referrerPolicy='no-referrer'`, and never trigger a purchase. Financial amounts, quote identity, totals, claims and funding rules remain unchanged. The resolver must be synchronous and perform no network, analytics or logging side effects.

## Authoritative wire

Reads return `{revision,quotes,claims,service,nextServicePeriod,shippingAddress,shippingAddresses,recipient}`. Exact quote/claim/receipt types are in the backend `supabase/functions/concierge-payments/types.ts`, accepted by core `concierge-operations/README.md:44`.

- `recipient:{method:'zelle',name,email,phone}` is server-owned. The live approved default is Kanuj Verma, kanuj.verma12@gmail.com, (925)719-1334. The public fixture uses synthetic contact data.
- Service is 10000 integer cents for one calendar month. The first month starts at initial plan publication; a payment before publication is `pending_publication`, grants no access and burns no days. Republishing never renews it. `service:{status:'unpaid'|'pending_publication'|'active'|'expired'|'cancelled',period:{startOn,endOn}|null}` is authoritative. An unpaid period may show known dates without granting access.
- `nextServicePeriod:{startOn,endOn}|null` is the server's next invoice anchor. The advisor form uses its exact date, read-only, with no browser-clock inference. Null means the initial publication will set it; the immutable quote keeps `servicePeriod:null`. Publication version 0 permits service only. Renewal is a new manually confirmed payment, never an automatic charge.
- Products, final tax and final shipping are itemized. One exact quote can allocate a combined payment to service and products, with no balance/credit system. A sent claim and any screenshot remain unverified.
- Confirmed product costs fund the client/recommendation ID across publications. A second request for that obligation is a conflict, not another payment. A distinct recommendation for the same product needs fresh client approval. The server preserves exact authorized retries.
- `shippingAddress:{version,address}|null` is latest; `shippingAddresses:[{version,address}]` is the complete immutable private history. Address has exactly `recipientName,line1,line2,city,region,postalCode,countryCode`. Client `confirm_shipping_address` creates a new version; its receipt is `{revision,operation:'confirm_shipping_address',addressVersion}`. Products require the current confirmed version in `shippingAddressVersion`; service-only uses null. Client explicitly acknowledges that displayed version before submitting a claim.
- A quote/claim/bank-confirmation basis includes the exact `shippingAddressVersion`. Changing address supersedes unpaid product quotes. Paid quotes always resolve their bound history entry, never the current address as fallback. A mismatch shows “Address changed—confirm with the client before ordering” and suppresses procurement readiness. No automated address reconciliation exists.
- Bank confirmation requires an unchecked-by-default acknowledgement of actual bank receipt checked outside the app. Receipts expose `serviceAccessStatus:'pending_publication'|'active'|null`, active-only `serviceUnlocked`, and product `ready_to_purchase` only. Generic success feedback leaves readiness to the freshly loaded quote/address state.

Shipping only: advisors manually order directly to the client's confirmed private address. No pickup/local handover or retailer checkout. This feature has no ordered/shipped/purchased/received/started mutation or status; those must never be inferred from paid funds. A later procurement workflow remains separate.

## Private evidence and retries

Multipart metadata is `{action:'upload_evidence',requestId,completionRequestId,expectedRevision,quoteId,quoteVersion}` plus `file`: PNG/JPEG, at most 5 MiB. Reserve/completion IDs are distinct and stable across retries. Completion does not change financial revision. Uploads remain unverified and unlock nothing. Original filenames are not retained.

Private reads use `{action:'evidence_url',evidenceId}`. Each request reauthorizes before returning a URL for at most 60 seconds. The panel hides the image after expiry and uses `referrerPolicy='no-referrer'`. No image content, contact/address data or financial details enter analytics, replay, logs or model prompts.

An uncertain mutation retains its exact original command/request ID and locks new actions. Exact retry reuses that intent. A failed reload preserves it; a validated authoritative reload clears it. Cleanup aborts requests, removes temporary views and clears in-memory files/intents. Error messages are sanitized.

## Synthetic preview and validation

Only for an explicitly labeled synthetic preview:

```js
const store = createPaymentPreviewStore({
  publicationVersion: 1, recommendationId: 'moisturizer-1', unitPriceCents: 1600,
  onConfirmed(receipt) { /* Optional synthetic entitlement notification; no live effect. */ }
});
const clientRequest = createPaymentPreviewRequest({mode:'client',store});
const advisorRequest = createPaymentPreviewRequest({mode:'advisor',store});
```

Both functions are exported from `fixtures.js`. Sharing the store carries client claims into advisor review and invokes `onConfirmed` once per committed confirmation, including exact retries. Publication version 0 seeds a service-only prepublication quote. Omit `store` for the legacy isolated fixture. Optional `scenario:'uncertain'` simulates an applied write with a lost response. These adapters never fetch, authenticate or persist; they are never live fallbacks. Private screenshot read deliberately fails in this fixture.

`node --test qa/payments*.test.mjs`: 22/22 pass. `qa/payments-preview.html` is the isolated synthetic browser QA page. Mounted regressions cover capability separation, uncertain retries/failed reloads, authoritative period dates, immutable address binding the concurrent-address confirmation-banner race, and historical descriptor lookup despite current-plan edits or missing snapshots. Browser checks covered sent→unverified, explicit bank acknowledgement, ready-to-purchase-only confirmation, private synthetic upload, read-only access and 390px layout without overflow. Shared route composition and screenshot review are owned by the portal task.

Backend payment verification: 35/35 tests with the authorized native SQL fixture enabled, using synthetic role claims and a metadata-only Storage adapter. Real JWT gateway, native Storage HTTP and fully composed authenticated runtime acceptance remain gates. No deployment, credential configuration, grant, real client data or bank transfer occurred.
