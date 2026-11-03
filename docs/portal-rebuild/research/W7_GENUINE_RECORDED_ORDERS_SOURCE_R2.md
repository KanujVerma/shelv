# W7 recorded Orders complete source review R2

**SPEC/source completeness: PASS for the five allocated source assets. Source correctness/quality: PASS at source and built-in Node scope.** This is a new complete independent review of `7798332f47597df2b6c15cc521fd2bc50e14e3f9` against frozen Root `72edabab3afe2532580da4a4069dea1edbd1b952`. RO1 is closed at source scope. No new material finding remains in the reviewed assets. This does not accept M02, C06/C06D, a financial journey or the complete rebuild.

**Actionable next gate:** Parent may compose only these exact reviewed postimages, preserving Root and other work. Source integration can proceed while M01's independent actual acceptance review finishes. Before M02 execution, Parent must establish M01 acceptance and returned browser custody, exact integrated source/current CI, the reviewed optional seed and read-only oracle, and a fresh explicit resource/custody packet. Then run genuine A/B Auth/RLS/gateway/session/request/DB and serialized browser observations, preserve their provenance, compare the actual baseline/final data, and obtain independent actual capability verification plus applicable visual/accessibility evidence. Source PASS authorizes none of those resource actions. Complete M02's baseline/browser/final interval before M04 writes its publication state.

## Identity, custody and immutable inputs

- Review checkout: `/Users/kanuj/.t3/worktrees/shelv/t3-17cd7cfc`, branch `t3/recorded-orders-source-review`, prepared HEAD `772c4fae7904e39a9e793627023adf56de811d8e`, initially clean. Prepared ancestry is an input, not Root equivalence or admission.
- Original R2 literal taskId, separately returned by Parent and bound in this metadata-only completion: `node:delegated-task:command%3Amcp%3Aa56eb6fa-1435-4927-8890-15373d05f366%3Adelegate-task%3Amilestone-20261103-orders-assets-review-r2`. This binds the original completed review; the metadata turn is not a review round. Source gates and raw evidence are unchanged.
- Actual self and Parent `t3_thread_configure` READs, with `modelSelection` omitted, both returned `codex/gpt-6.1-sol/xhigh/default`. A second pair of actual reads is preserved in [configuration receipts](../../../.local-artifacts/w7-recorded-orders-r2/configuration-read-receipts.json). No configuration mutation occurred.
- The explicit binary `/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node` returned `v22.23.0` and ran every JavaScript check below. All execution used own ignored source copies and Node built-ins; no foreign checkout program was executed.
- Sole Root/resource authority remains Parent `9b085ada-435f-48d6-8886-957c1ce3e82d`. Actual Root Git HEAD matched the full frozen SHA above. Root initially contained only the already untracked `docs/handoffs/2026-11-02-portal-rebuild.md`; that handoff was neither opened nor changed. All 68 Git migration sources were pinned. The supplied code/whole-filesystem/index/ledger fingerprints and earlier actual M01 results are Parent provenance, not independently rerun here.
- Candidate author checkout `/Users/kanuj/.t3/worktrees/shelv/t3-9a0655db` was clean at `7798332f47597df2b6c15cc521fd2bc50e14e3f9`. The pre-correction five assets were separately materialized from `941a786a5d133b17fa2645b1b633b2c6d19bb835`; their executable history includes `edea42c8f7abc10cf36d1d6cd26b2dcea19adc8d`. No commit or INPUT ancestry was applied.
- R1 was read from its supplied path and independently SHA-256 checked as `1ef337e268c21451b9f387f25aec59d55a5bcc449c32434a0b2c02c3b8c6c5ad`. Its CHANGES REQUIRED verdict and failed OLD witness remain historical failures. R2 does not relabel them.

| Complete current allocated postimage | Verified SHA-256 |
| --- | --- |
| `apps/portal/tests/genuine/account-orders-seed.sql` | `4dfbbdd6c79b6ccf95db8b9215f1c93a519e86178130b85b459f5e4ba773d292` |
| `apps/portal/tests/genuine/recorded-orders.browser.mjs` | `0f90bd06fc52f4292a73babd0a534c2ab2afe16bedf20855485795fb8dc08597` |
| `apps/portal/tests/genuine/recorded-orders-observation.sql` | `1fcfcf837f9c25d5172e2bc2b72f6acf293143d1b6185583a1b74358fe3a1ed6` |
| `apps/portal/tests/genuine/recorded-orders-oracle.test.mjs` | `0e9bac0cc603d63c329b6d19e8a43e6ff6579a30fd11a52cb89c665615c41e68` |
| `docs/portal-rebuild/research/W5_GENUINE_RECORDED_ORDERS_ACCEPTANCE.md` | `0e46968f5a74cbfb20e6b15be06c218dc63dafa8a1cc6d839f40335472053b56` |

The [pin manifest](../../../.local-artifacts/w7-recorded-orders-r2/pins.json) binds exact Git inputs, own copies, sizes and hashes. [Input receipts](../../../.local-artifacts/w7-recorded-orders-r2/input-receipts.json) retain actual Git argv/cwd/exit and the complete five-asset OLD/current diff. No candidate asset, Root path, shared contract, migration, auth/route, application source, dependency or canonical status document was written. The sole new tracked deliverable is this report; ignored controls are private to this review checkout.

## RO1 correction and independent reproduction

The entire five-asset diff from `941a786a5d133b17fa2645b1b633b2c6d19bb835` to the current candidate contains exactly one source-line change at browser line 166:

```diff
-    await orders().getByRole('heading',{name:p.productName,exact:true}).waitFor();
+    await orders().getByRole('heading',{name:p.productName,level:2,exact:true}).waitFor();
```

The seed, observation SQL, oracle module and complete W5 report are byte-identical. The report's previous Root/executable pins and retained first-phase section remain historical pins; the table above and this R2 establish the current review target.

Frozen Root `apps/portal/src/features/orders/read/ClientOrdersView.tsx` has the following source semantics:

| State | Exact product-name heading expressions | Original locator | Current `level:2` locator |
| --- | --- | --- | --- |
| Own list | Purchase `<h2>{purchase.productName}</h2>` at line 105 and return `<h3>{selectClientPurchase(view,record.purchaseId)?.productName...}</h3>` at line 111 | Two matches for the prescribed purchase and its linked return | One purchase-heading match |
| Own detail | `<h2>{selected.productName}</h2>` at line 118 | One match | One match |

`model.ts:3-5` selects only a unique purchase ID. Seed lines 71-85 insert that purchase and its linked return, so the list's two original expressions identify the same product. The actual shared `PageHeader` emits the separate page title as an h1; `Panel` adds no heading. The browser's first login still invokes `shown(key)` on the list before opening details at line 211. Adding the semantic heading level resolves the specific source ambiguity without deleting or weakening the exact-name check.

Own [RO1 source control](../../../.local-artifacts/w7-recorded-orders-r2/ro1-source-control.mjs) verifies these exact JSX/model/seed relationships and whole-module equality after the one replacement. OLD produces two list matches and fails the required single-heading assertion, child **exit 1**. CURRENT produces one list and one detail match, **exit 0**. This is a finite text-only semantic witness. It is not JSX rendering, a browser receipt or a successful fake Page. No adapted source module was created. All other browser assertions, routes, unknown facts, financial restrictions, negative probes and timeouts are byte-identical to OLD.

## Complete seed and Root contract review

`account-orders-seed.sql:25-100` is optional administrator test-data setup, not a public business operation. It safely quotes psql literals, casts actual descriptor UUIDs before persistent writes, requires distinct A/B IDs through a unique constraint, and generates purchase/return/event UUIDs in the database. It requires existing permanent nondeleted synthetic `.invalid` Auth users, nonrevoked enrollment and a case. It does not create Auth identities, sessions, enrollment or permissions.

The seed locks existing enrollment and the canonical `concierge:client:<uuid>` namespace, refuses any existing service head or purchase/return/event history, then inserts exactly two rows into each of four persistent tables: `service_heads` at revision 1, `retail_purchases`, linked `return_cases` and linked `return_events`. The latter obtains its actual identity sequence from the database. The only table creation/drop is its temporary input table. No persistent update/upsert/reset, policy/ACL/trigger edit, care plan, payment, approval, publication, entitlement, delivery or Start operation exists in this seed.

Root `20261025221028_concierge_service_workflows.sql:3-12` defines the exact used columns, the compound owner FKs `(client_id,purchase_id)` and `(client_id,return_id)`, the private extension relationships, and the database-generated event sequence. Relevant current migration source does not attach a seed-table insert trigger that turns this historical setup into publication or paid coverage.

The seed commits before its final actual `concierge.client_orders_projection_v1(client_id)` JSON readback. The output supplies real IDs and the actual canonical view for `descriptor.ordersScenario`; it is not a hand-authored success response. A failure after COMMIT is possible partial setup and must retain that custody/history, not trigger blind replay or overwrite. Freshness, actual administrator permission and executable SQL validity remain execution prerequisites.

Root `20261102130000_portal_rebuild_client_orders_read_v1.sql:6-29` produces the exact closed `{schemaVersion,revision,purchases,returns}` shape. Its public function derives owner from genuine `auth.uid()`, checks permanent identity/session/enrollment, uses the canonical head/namespace and refuses records without a head. It does not use a caller's client selector or grant browser privilege from seed data. Private purchase/event extension rows are excluded from its projection.

`PortalClientOrdersValidation.ts`, `PortalClientOrdersMapping.ts` and `ConciergeService.ts` agree with the seeded public fields and truthful nulls. The seed's distinct nonzero amounts imply a recorded total of `28.94` without inventing a currency. Delivery, opened-item allowance, deadlines and refund facts remain unknown. This review does not turn seeded historical financial numbers into verified real purchases, money movements or service-payment authority.

## Complete browser source review

The module imports built-ins only and is inert on import. `runRecordedOrdersJourney` receives the caller's separately allocated actual fresh Page/context and public v1 descriptor with actual `ordersScenario`. Validation is before browser/filesystem effects. Explicit loopback origins, the reviewed HTTPS provider port, distinct endpoint ports and an already empty canonical private evidence directory constrain its intended execution. These checks do not prove source admission, freshness, resource ownership or grant authority; Parent's packet must establish those facts.

The intended scenario uses the actual Application email form, ordinary OTP/PKCE verification through Mailpit, actual cookie gateway and the mounted Orders entry. Root `Application.tsx` preserves an allowlisted `/orders` sign-in return; `client-orders-entry.tsx`, controller and `client-orders-read-request.ts` keep the read-only page on the dedicated registered Orders chain before clinical loading. No alternative successful Auth, context, OperationPort, Vault, SQL response or clinical-plan fallback is supplied.

The canonical probe obtains actual session CSRF and posts exactly `{schemaVersion:1,action:'read_client_orders_v1'}` to `/api/client/client-orders`. It requires 200, the exact path and deep equality with the actual post-seed view. Successful read observations append only after those checks. Root's gateway `client-policy.ts` and closed Orders codec reject extra selectors before session execution rather than forwarding them as owner selection.

For each A/B actor the source checks positive own list/detail, refresh, Back/Forward and labeled Back; foreign-ID unavailable state; eight extra-selector rejections followed by exact own rereads; private marker isolation; and absence of purchase/payment/return-request/Start controls. Detail checks cover quantities, dates, individual amounts and total, null delivery/return/refund facts, saved-policy URL and the lack of currency/tracking invention. B must positively see B's own records, not merely fail to see A's.

One A response is obtained from the actual route, checked against the actual view and delayed across ordinary UI logout. It is released with the original response/status/headers/body. Cancellation after logout is recorded separately from delivery; neither is mislabeled proof that a late success reached the application. A signed-out 401 and a new ordinary A login/persistent reread follow. Response tasks, held work and trace-stop attempts are joined; failures and uncertain cleanup cannot become `BROWSER_OBSERVED` success. Parent still owns context/session/fixture teardown.

Response bodies/headers and browser storage are checked in memory for actual private needles; output records fingerprints and safe observations. The trace includes genuine sign-in navigation and must remain private. Source assertions do not prove browser policy behavior, TLS, no leakage, correct actual timing, cleanup or usability. All such behavior remains UNRUN here. In particular, a 400 and unchanged reread do not prove absence of downstream effects; Parent must independently correlate actual fixed-RPC/session/Vault/request and DB observations.

## Complete read-only SQL and data oracle review

`recorded-orders-observation.sql:55-207` declares `BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY`, checks actual transaction settings and phase, validates strict distinct normalized UUID spellings before casts, refuses absent/foreign/mislinked/partial canonical records, and ends with `ROLLBACK`. There is no explicit lock, DDL, temporary table, write, role/JWT substitution or successful authorizer impersonation. The projection is diagnostic administrator readback, not authenticated client authority.

The fixed selectors match Root table columns and ownership paths by independent source inspection:

| Group | Exact inventory and ownership |
| --- | --- |
| Canonical 4 | `retail_purchases`, `return_cases`, `return_events`, `service_heads`: actual `client_id`; exact purchase/return/event IDs and compound owner FKs. |
| Private 5 | `retail_purchase_private.purchase_id` via own purchase; `return_event_private.event_id` via own event; `service_review_private.review_id` via own review; `plan_draft_private.draft_id` via own draft `client_id` or `origin_client_id`; `review_private_notes.client_id`. |
| Other heads 7 | `payment_heads`, `checkin_heads`, `care_use_heads`, `care_report_heads`, `care_instruction_heads`, `plan_decision_heads`, `account_profile_heads_v1`: actual `client_id`. |
| Current state 2 | `cases`, `enrollments`: actual `client_id`, retaining M01's persisted state. |
| Journals 9 | `requests`, `workflow_requests`, `payment_v2_requests`, `care_requests`, `review_requests`: actor or client. `plan_requests`: actor, `scope_client_id`, or draft scope through its client/origin. `notification_requests`: actor, event client or delivery recipient. `account_profile_requests_v1`: actor. `admission_intents`: actor or `target_id`. |

These relationships were checked against the pinned R1 persistence, portal workflows, founder admission, manual-payment, service, plan-v1, care-use, review/guidance, notifications and Account-profile migration sources. Event/recipient/target column relationships are not falsely described as FKs where the schema has none. They define the exact diagnostic scope, not permission to inspect resources.

The SQL hashes deterministic complete `to_jsonb(t)` rows with SHA-256 and counts every selected row, retaining duplicate rows. Private full-row JSON stays inside the server-side CTE; only counts and digests leave for those relations. Complete canonical rows and the actual public projection are returned. Empty inventory members are included. Two equal snapshots cannot establish absence of a write later reversed between them, out-of-scope effects or evidence origin.

Both required exports are present in `recorded-orders-oracle.test.mjs`: `ordersObservationPsqlVariables(descriptor,phase)` constructs UUID-only argument-array pairs without starting a process; `validateRecordedOrdersObservations({descriptor,baseline,final,browser})` validates strict plain-data shapes, both phases/chronology, actual descriptor identities/views, complete raw canonical row/FK/head relationships, the exact 27 counts/digests per actor, full before/final equality and browser source/owner/project/read-path/revision/marker/view bindings. It requires positive A/B own list/detail reads inside the observation interval and corresponding successful POST request fingerprints. Missing, malformed, changed or failure-marked observations are refused.

The result is exclusively `OBSERVATIONS_ONLY`, with `financialJourneyAccepted:false` and `requestEffects:'not established by this validator'`. Supplied-object validation is not provenance authentication. No positive DB/browser packet, SQL parser, successful authority fake or acceptance fixture was constructed. The successful real-data validation path remains UNRUN. The 32 executed tests cover malformed-data refusals and internal guards, not that unexecuted successful path.

## M04 first-publication compatibility and serialization

The R1 scheduling conclusion remains supported by current Root source. `cases.published_version` is separate from `service_heads.revision`. Root plan-v1 lines 489-506 determine first publication from `published_version=0`, require exact approval and a genuinely confirmed applicable first-service claim with an unstarted service period, then create publication/service/schedule effects. The Orders head at revision 1 is not that first-publication predicate.

The seed neither advances `cases.published_version` nor inserts/starts a service period, payment claim/confirmation, approval, publication or notification event. Given M04's specified fresh prepublication state, it therefore does not itself consume those stated first-publication preconditions. That conditional source conclusion does not certify the actual fixture: the seed does not assert all payment/approval/publication absence, and this reviewer queried none. Parent must verify actual M04 prerequisites later, without resetting or rewriting history.

After M01's acceptance and custody return, run the authorized M02 seed, baseline, serialized Orders browser scenario and final observation before M04 mutates protected state such as `cases`, `checkin_heads` and `plan_requests`. Running M04 within the interval would correctly fail the unchanged-state oracle. Preserve the no-prior-paid-period/payment/approval/publication state needed for M04's negative sequence until its approved step. Source integration of M02 can proceed independently of M01's remaining acceptance review; resource serialization is still mandatory.

## Independently executed evidence and explicit limits

All command receipts, stdout and stderr are preserved separately under `.local-artifacts/w7-recorded-orders-r2/checks/`. The own [capture runner](../../../.local-artifacts/w7-recorded-orders-r2/run-checks.mjs) records the child's true executable/argv/cwd/exit; its successful orchestration is not an OLD GREEN verdict.

| Actual command, using the explicit Node 22.23.0 binary and own absolute source-copy paths | Result |
| --- | --- |
| `--version` | `v22.23.0`, exit 0. |
| `ro1-source-control.mjs OLD` | Required one-heading assertion fails `2 !== 1`, child exit 1. OLD raw result remains failed. |
| `ro1-source-control.mjs CURRENT` | One list/one detail product heading; whole-module one-line equality, exit 0. Source text witness only. |
| `OLD/.../recorded-orders.browser.mjs --self-test` | 21/21, zero failures/skips, exit 0. This does not erase OLD RO1; the guards do not exercise an actual positive locator. |
| `CURRENT/.../recorded-orders.browser.mjs --self-test` | 21/21, zero failures/skips, exit 0, actual authored self-test mode. |
| `CURRENT/.../recorded-orders-oracle.test.mjs` | 32/32 negative-data checks, zero failures/skips, exit 0, actual authored direct-execution mode. Import alone is inert. |
| `--check CURRENT/.../recorded-orders.browser.mjs` and oracle module | Both exit 0; Node JavaScript syntax only, no SDK/compiler or SQL parser. |

The author's original RED/setup/OLD/current history remains verbatim in the W5 report and its unchanged OLD/current postimages. Original foreign ignored logs and Parent's retained OLD browser were not imported, executed, changed or promoted into this review's independently reproduced evidence. Reviewer setup includes a failed guessed source-path lookup; its raw Git exit 128 is retained in `extra-receipts.json`, and the actual `client-orders-entry.tsx` source pin follows separately. The reviewer-only terminal checker initially expected exit 0 for a new-file `git diff --no-index --check`; Git returns 1 for the difference with empty diagnostics. Its original script/raw exit 1 is retained separately under `checks/setup-final-checker/`; the corrected checker requires that exit and empty diagnostics. Neither setup correction is a product RED/GREEN result.

SQL syntax/parser/execution, actual current-role/administrator permissions, DB/Auth/RLS, request/session/Vault behavior, race timing, browser/visual/accessibility, exact integrated CI and independent actual acceptance are **UNRUN**. No dependency installation, SDK/compiler, engine, server/socket, fixture, private resource, runtime network operation, nested agent, PR/push/watch/merge or deployment occurred. The ordinary application suite was not run under this narrower source-only grant.

M01's actual observations and pending independent acceptance stay with Parent. This review adds zero accepted capabilities, frames, decisions or complete journeys; full-portal metrics were not remeasured. All 26 approved screens, D01-D48 and ten full journeys remain in the unchanged full goal. Guidance/M65/provider-photo holds remain held. [Final local verification](../../../.local-artifacts/w7-recorded-orders-r2/final-verification.json) checks all 210 pinned-copy hashes, the 68 migration inputs, existence of all 27 fixed relation definitions, sole-new-report scope, documentation links and whitespace. Root/author HEAD and Git status remain as captured. It grants no integration or resource authority.
