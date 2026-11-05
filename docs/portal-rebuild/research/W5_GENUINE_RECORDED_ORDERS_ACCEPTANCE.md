# M02 continuation: recorded Orders read-only oracle

Owner: Kanuj. Status: **SOURCE IMPLEMENTED; SQL/parser/browser execution UNRUN**. This continues the same full rebuild. It does not accept M02, C06/C06D or a financial journey. Name M01 remains first; no seed before Name acceptance.

Literal continuation taskId, separately returned by Parent: `node:delegated-task:command%3Amcp%3Aa56eb6fa-1435-4927-8890-15373d05f366%3Athread-send%3Amilestone-20261103-recorded-orders-oracle`. Actual self + Parent configure READs again returned `codex/gpt-6.1-sol/xhigh/default`, with no model change. Parent approved the exact 27-relation, read-only oracle proposal before exports. This task received source/built-in ownership only, with no resource phase.

Source freeze: `edea42c8f7abc10cf36d1d6cd26b2dcea19adc8d` on prepared `f29b849337868b67c26cb6b4a88e202455d907e7`. This ancestry is not Root-equivalent. Actual inspected Root is `004c7a3a145f472f79c2bb6860ebf917798527b8`, with 68 migrations. Later Root transport corrections/source admission belong to Parent; rebind exact composition before execution.

## New executable source and ABI

- [recorded-orders-observation.sql](../../../apps/portal/tests/genuine/recorded-orders-observation.sql) uses `BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY`, actual transaction-setting checks, fixed selects and `ROLLBACK`. No role/JWT impersonation, explicit locks, function creation, temp tables, DDL or writes. It never invokes the client authorizer as a successful substitute.
- [recorded-orders-oracle.test.mjs](../../../apps/portal/tests/genuine/recorded-orders-oracle.test.mjs) exports `ordersObservationPsqlVariables(descriptor, phase)` and `validateRecordedOrdersObservations({descriptor, baseline, final, browser})`. Import is inert; direct execution registers only malformed-data built-in checks.
- [recorded-orders.browser.mjs](../../../apps/portal/tests/genuine/recorded-orders.browser.mjs) changes only observation capture: actual request method; actual response path; append-only successful canonical reads with sequence, actor/client, current browser route, revision, actual product marker, request fingerprint, timestamp and exact returned view. Append occurs after the genuine 200/path/view/privacy checks. No response or application state is synthesized or rewritten.

The SQL variables are `actor_a_id`, `actor_b_id`, `a_purchase_id`, `a_return_id`, `a_event_id`, `b_purchase_id`, `b_return_id`, `b_event_id`, and `phase=baseline|final`. They come from actual descriptor Auth identities and the separately applied seed's recorded IDs. The helper returns an argument array, never shell text or a process. SQL uses psql safe literal quoting, strict UUID spelling and distinct normalized IDs before casts. Missing, foreign, wrongly linked or incomplete canonical collections refuse with a nonzero psql exit. No partial/empty-success fallback.

One future invocation returns one actual observation:

```text
{schemaVersion:1, kind:'recorded-orders-db-observation', phase,
 observedAt, readOnly:<actual transaction setting>,
 actors:{a/b:{clientId,recordIds:{purchaseId,returnId,eventId},
   view:<actual client_orders_projection_v1 result>,
   rows:{purchases,returns,events,serviceHeads},
   protected:{<27 fixed relations>:{count,sha256}}}}}
```

Baseline is post-seed and before the Orders browser scenario; final is after that scenario. Both readbacks must come from the same explicitly granted fixture/captured SQL source. The SQL does not claim a source commit, Auth authority or resource grant from input metadata. Parent execution receipts must bind actual source/SQL hashes, fixture, commands and observations.

## Exact scope and source relationships

The complete 27-relation inventory is fixed in both files. Counts include **all** scoped rows; digests cover deterministic, full-row JSONB text, including all private fields, without dropping unknown columns or duplicates. Private full-row JSON remains inside SQL; only counts and SHA-256 digests leave for those relations. These are logical row digests, not physical database-page hashes or proof against a write followed by reversal between snapshots.

| Group | Relations and inspected owner relationship |
| --- | --- |
| Canonical 4 | `retail_purchases`, `return_cases`, `return_events`, `service_heads`: actual `client_id`; purchase/return/event IDs and compound owner FKs must match the descriptor. Full canonical fixture rows and the actual public projection are returned. |
| Private 5 | `retail_purchase_private.purchase_id` → own purchase; `return_event_private.event_id` → own event; `service_review_private.review_id` → own review; `plan_draft_private.draft_id` → draft with own `client_id` or `origin_client_id`; `review_private_notes.client_id`. Digest only. |
| Other heads 7 | `payment_heads`, `checkin_heads`, `care_use_heads`, `care_report_heads`, `care_instruction_heads`, `plan_decision_heads`, `account_profile_heads_v1`: actual `client_id`. |
| Current state 2 | `cases`, `enrollments`: actual `client_id`, including Name's already persisted state. |
| Write journals 9 | `requests`, `workflow_requests`, `payment_v2_requests`, `care_requests`, `review_requests`: matching actor or client. `plan_requests`: actor, `scope_client_id` or scoped draft's client/origin. `notification_requests`: actor or matching event client/delivery recipient. `account_profile_requests_v1`: actor. `admission_intents`: actor or `target_id`. Event/recipient/target lookups use actual columns; not all are declared foreign keys. |

These columns and declared FKs were inspected in Root's canonical R1 persistence/workflows, manual payment methods, service workflows, plan v1, care-use v1, reviews/guidance v1, notifications v1, founder admission and Account profile migrations. The Orders producer remains `20261102130000_portal_rebuild_client_orders_read_v1.sql`. No guessed Source/future tables, Auth credential rows or global unrelated rows are read. These selectors describe diagnostic scope and confer no client permission.

The validator binds both complete DB projections and raw canonical rows/FKs to the actual descriptor, requires the exact 27 digest entries per actor, refuses changed counts/row bytes, and correlates actual own A/B list/detail browser reads by exact path/revision/marker/view and request fingerprints. It requires read timestamps inside the baseline/final interval. Its only successful label is **`OBSERVATIONS_ONLY`**. It cannot attest supplied objects' origin, replace Parent's request/session/Vault oracle, prove a 400 happened before downstream invocation, or accept M02. The successful real-data validation path remains unexecuted in this source-only phase.

## Actual evidence, preservation and next step

Ignored evidence: `.local-artifacts/orders-oracle-20261103/`. It preserves original seed/browser/report preimages, all 2,324 original path hashes/kinds/modes and index entries, current Root document/68 migration/contract hashes, literal task identity, raw stdout/stderr and true argv/cwd/exit receipts.

- Initial unimplemented refusal skeleton: **0/27**, exit 1, meaningful missing-refusal assertions. Frozen source and raw `red.log` retained.
- Implemented original negative cases: **27/27**, exit 0. Final negative-only data checks: **32/32**, exit 0 (`oracle-final.log`). No positive DB/browser acceptance fixture or successful Auth/OperationPort stub was used.
- Unchanged browser source guards: **21/21**, exit 0. Node syntax checks: exit 0. These run only explicit `/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node` built-ins.
- Text-only inspection confirms 27 fixed names and no forbidden statement classes; **SQL syntax/parser and SQL execution remain UNRUN**. No dependency/SDK/compiler/heavy, server/socket, DB/Auth/Storage, browser/engine/image, live/stopped fixture query, seed or resource action was performed.

The frozen seed remains byte-exact: SHA-256 `4dfbbdd6c79b6ccf95db8b9215f1c93a519e86178130b85b459f5e4ba773d292`. Original 58b59/f29b evidence and failures remain unchanged below and in ignored preimages. Only the owned browser/report deltas and two new oracle paths change; no Root/shared/production source changed. Source claims return with this committed handoff; no runtime handles or resources were acquired.

Parent can now review/admit the named postimages and compose the actual DB/request/session oracle. Execution remains separately gated on Name acceptance, exact current fixture/source packet, authorized optional seed, distinct serialized browser and explicit read-only observation grant. All 26 frames/D01-D48/ten journeys and Guidance/M65/photo holds remain unchanged. This does not authorize purchases, funds, fulfillment, Start or payment claims.

---

## Frozen first-phase handoff, retained unchanged

# W5 recorded Orders: executable source handoff

Owner: Kanuj. Status: source implemented; SQL/parser and genuine browser execution **UNRUN**. No connected capability, full C06/C06D, financial journey or release acceptance is claimed.

This complements the selected Account name capability. It does not delay its bootstrap. All 26 frames, D01-D48 and ten full journeys remain required; Guidance/M65/photo holds remain unchanged.

## Identity and source

- Literal taskId, separately supplied by Parent: `node:delegated-task:command%3Amcp%3Aa56eb6fa-1435-4927-8890-15373d05f366%3Adelegate-task%3Aacceptance-20261103-orders-browser-journey`.
- Actual self and Parent `t3_thread_configure` READs, with `modelSelection` omitted, returned `codex/gpt-6.1-sol/xhigh/default`. No model was changed.
- Prepared checkout: `/Users/kanuj/.t3/worktrees/shelv/t3-9a0655db`, branch `t3/recorded-orders-acceptance`, input `263d01b6b45e4f12b0edfbb2093163aca8d8c743`. This ancestry is not Root-equivalent.
- Initial owned source commit: `79d8c3a0f54ab90fab96aafca1b048362c72621b`; TLS correction: `3e96bf66b4328794ba6da0886e22088cdbf51e8f`; latest source: `58b59c32adc72e2629ccd1ad835743a6f1c3114b`. Import only the named postimages; do not treat this prepared ancestry as Root source.
- Inspected canonical Root: `/Users/kanuj/.t3/worktrees/shelv/kanuj-portal-rebuild-integration-20261030`, source `8b32873843841ed16e8c2b5b40bff8e20e7bad20`, code `5d07d95819f5363795b9c942eec78f145b37a265`, 68 migrations.
- Governing additional inputs are Root `docs/portal-rebuild/source/ACCEPTANCE_FIRST_EXECUTION_STEER_20261103.txt` and `docs/portal-rebuild/GENUINE_ACCOUNT_JOURNEY_ACCEPTANCE_20261103.md`. Their hashes, mandatory rebuild-document hashes and actual Orders source hashes are in the ignored `root-source-pins.json` below.

The actual producer is `supabase/migrations/20261102130000_portal_rebuild_client_orders_read_v1.sql`; tables/FKs and return sequence semantics come from `20261025221028_concierge_service_workflows.sql`. The scenario follows Root's exact `PortalClientOrdersValidation.ts`, read-only `ClientOrdersView.tsx`, `model.ts`, ordinary Application sign-in and cookie gateway. It does not import an alternative RootReadPort, successful Auth/context/Vault stub or fake ServiceView.

## Owned implementation

- [account-orders-seed.sql](../../../apps/portal/tests/genuine/account-orders-seed.sql): optional fresh-fixture administrator setup, using only existing A/B permanent synthetic Auth identities and existing enrollment/case rights.
- [recorded-orders.browser.mjs](../../../apps/portal/tests/genuine/recorded-orders.browser.mjs): inert browser module with built-in source unit checks. It imports Node built-ins only and launches nothing.
- This handoff. No production, shared composition, migration, dependency, SDK, compiler, CI, Source kernel or other worker path changed.

The precise minimal seed relationships were sent to Parent before implementation. For each A/B actor it inserts one canonical `service_heads` row at revision 1, one `retail_purchases`, one linked `return_cases`, and one linked `reviewing` `return_events`. It refuses existing heads/history and repeated setup. No upsert, cleanup/reset, session insertion, policy/ACL/trigger change, care plan, first payment, quote, entitlement, delivery or Start is used. Existing raw-table RLS remains intact. These are explicitly historical synthetic records, not business commands or observed financial activity.

Parent subsequently approved this precise optional seed proposal without an SQL execution grant. Seed SHA-256: `4dfbbdd6c79b6ccf95db8b9215f1c93a519e86178130b85b459f5e4ba773d292`. Latest browser source SHA-256: `b5f039ddcfd4e3e2ff251085494517e349624bd4a3a60f9e47cb6a10d440c847`.

Purchases have nonzero distinct unit/tax/shipping amounts. Delivery, opened-item permission, return/ship deadlines and refund/policy-check amounts remain their actual null values. There is no currency field, and no currency is manufactured. Return events use their real identity/sequence relationship, not inferred dates.

## Seed handoff ABI

After the provisioner completes the independent Name bootstrap, use actual descriptor `actors.a.id`, `actors.b.id` and `ownerId` as `actor_a_id`, `actor_b_id`, `owner_id`. `ordersSeedPsqlVariables(descriptor)` validates UUIDs and synthetic recipients and returns argument-array pairs. Pass them to the captured fixture's `psql` invocation with `-X -qAt -v ON_ERROR_STOP=1 --file <owned seed>`. Never join arguments into shell text or derive a connection from ambient/old fixture variables. The SQL uses psql `:'variable'` literal quoting and UUID casts before persistent writes.

The final SQL JSON row is generated **after commit** by the actual canonical own projection. Capture it verbatim as `descriptor.ordersScenario`:

```text
{schemaVersion:1,
 a:{clientId,purchaseId,returnId,eventId,marker,view},
 b:{clientId,purchaseId,returnId,eventId,marker,view}}
```

All record IDs are DB-generated. Each `view` is the complete actual `{schemaVersion,revision,purchases,returns}` readback. The private helper is an administrator diagnostic oracle only; the browser reads through the real own-client public RPC. No browser record is replaced by this oracle, and absent/invalid readback fails closed.

## Browser handoff ABI and observations

Import `runRecordedOrdersJourney({page, descriptor, evidenceDirectory, privateNeedles})` only after the exact later Parent packet. The descriptor is the shared journey v1 descriptor plus the actual optional seed readback. `privateNeedles` must be the new fixture's actual server-only key/access/refresh credentials and private canaries supplied privately by its custodian. They are checked in memory and never emitted. This list and descriptor are not grants or proof of custody.

Latest Parent steer corrects Supabase to **`https://127.0.0.1:58621`**. This supersedes the initial contract's HTTP provider example. Validation requires this exact TLS endpoint and refuses downgrade or another port. The actual pinned TLS/Auth/context runtime remains the bindings/provisioner responsibility; this source does not substitute a provider or SourceRole context.

`page` must belong to a separately allocated empty actual Playwright context, distinct from Name's browser/tab. Parent T3 incognito remains primary. This module provides the fresh-context fallback only when Parent explicitly authorizes it. Name must first join and return its browser claim. No `prepareLocalBindings` shape, new port, service, launcher or SDK is assumed.

`evidenceDirectory` must already be an empty, canonical, private directory beneath this new fixture. The module starts/stops its own trace on that context, captures screenshots and writes an exclusive `orders-browser-result.json`. The trace contains actual sign-in navigation and must stay private. The caller retains browser/context/process/fixture custody and teardown. Response jobs, the delayed-response task and trace stop are joined; uncertain cleanup is recorded rather than reported successful.

The executable sequence is:

1. Ordinary UI email-link login as A, using only the new loopback Mailpit and actual Auth verification redirect. Assert Secure/HttpOnly/SameSite cookie, no credential in browser storage, own list and exact canonical RPC equality to the post-seed readback.
2. Open A's exact purchase, check saved quantities/dates/amounts/policy/return values, including truthful null/currency labels. Reload, browser Back/Forward and labeled Back retain the recorded values and route.
3. A's route for B's ID shows unavailable, never B's product/marker. Eight extra owner/client/record selectors return 400; each is followed by an unchanged complete own canonical reread.
4. Hold one **real** successful Orders response after its unchanged bytes are obtained. Sign out through the actual UI, release the original status/headers/body unchanged, and confirm no private resurrection and signed-out 401. Record whether the browser accepted release or had cancelled the request. Cancellation is distinct from proof that a late success reached the application.
5. Ordinary UI login as B positively shows B's own row/detail, never A's marker in UI or safe API responses. Repeat refresh/navigation, A-ID-unavailable and selector negatives, then sign out.
6. New ordinary A login still shows the persisted exact values, then sign out. Keep screenshots, response hashes, selector request hashes, statuses and private trace. Unexpected browser destinations abort; browser traffic is limited to the exact portal and actual local Auth verify path. No data response is synthesized or rewritten.

Successful browser completion is labeled `BROWSER_OBSERVED`, not accepted. Parent must correlate the real fixed-RPC/DB/session/Vault observations and independently verify the capability. In particular, 400 plus unchanged canonical reread alone does not prove absence of downstream effects. The exact actual observer ABI remains Parent/bindings-owned; none was invented here. Parent should compare complete protected DB state before/after read scenarios and verify malformed selectors never invoke the downstream Orders RPC. The module returns per-probe fingerprints/times for that correlation.

## Actual source verification

Evidence directory: `.local-artifacts/orders-acceptance-20261103/` in the prepared checkout. It is ignored and contains no acquired runtime fixture.

| Evidence | Actual result |
| --- | --- |
| `red.log` / `red-command.json` | Initial deliberately missing refusal checks: 1/18 pass, 17 meaningful `Missing expected exception` failures, exit 1. No browser/SQL. |
| `green.log` | Original external source-unit script: 18/18, exit 0. |
| `setup-selftest.log` | Moving tests inline initially omitted the local UUID fixture helper: 0/19, exit 1. Preserved as setup error, not product RED. |
| `current-selftest.log` / command JSON | Corrected owned self-test: 19/19, exit 0. |
| `final-selftest.log` / command JSON | Final source self-test: 19/19, exit 0. |
| `final-syntax.log` / command JSON | Final Node syntax check: exit 0; no SDK/compiler. |
| `tls-red.log` / command JSON and frozen source hashes | Before the correction, 18/19 pass; the newly required actual HTTPS endpoint fails against the old HTTP validator, exit 1. |
| `tls-current-selftest.log` / command JSON | TLS correction: 20/20, exit 0. The source-unit fixture endpoint is explicitly corrected; old raw evidence stays separate. |
| `tls-current-syntax.log` / command JSON | TLS correction syntax: exit 0. |
| `privacy-red.log` / command JSON and frozen source | New exact-value JSON escaping test: 20/21, exit 1. Literal-only scanning missed a value containing a newline/quote. |
| `privacy-current-selftest.log` / command JSON | Latest source: 21/21, exit 0. Exact literal and JSON wire representations are both refused. |
| `privacy-current-syntax.log` / command JSON | Latest source syntax: exit 0. |

Repeat the owned built-ins with the explicit binary:

```text
/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node apps/portal/tests/genuine/recorded-orders.browser.mjs --self-test
```

Raw receipts preserve true argv/cwd/exit. `protected-before.json` inventories all 2,321 original paths by bytes/hash/kind/mode plus the original index; terminal preservation verifies those originals. `root-source-pins.json` binds the initial inspected Root inputs; a later journey-contract reread is pinned separately and retains its still-HTTP example as superseded by the explicit Parent TLS steer. `terminal-preservation-prestage.json` records the initial owned source hashes and original preservation. Latest owned/report hashes, documentation links and staged diff checks are recorded separately to avoid a self-referential report hash.

## Exact next prerequisite

No native resource packet has been received in this task. Consequently no SQL/parser, dependencies/SDK/compiler/heavy run, server/socket, browser, DB/Auth/Storage/engine/image, fixture query/reset/reuse or acquisition was performed. This is an authorization/serialization prerequisite, not an observed engine or application failure.

Parent must first review/admit these three source paths, finish/review the fresh minimal fixture and Name capability, then supply the concrete new source/resource/custody packet, separately authorize optional seed execution and the distinct browser fallback, and pin actual read-only observations. Until then there is no reproducible runtime attempt to call passing or failing. No claim on another worker's tab, runtime, resources or files exists. Source ownership is returned with the committed handoff so Parent can integrate; later execution requires the explicit packet and task continuation.

This work cannot establish quote/payment verification, purchasing, fulfillment, return dispatch, retailer funds, client repayment, care/Start, hosted behavior or release acceptance.
