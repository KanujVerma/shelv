# M04 advisor publication: source implementation candidate

Owner: Kanuj. Status: implemented test assets, independent source review pending. Actual SQL/Auth/browser execution is **UNRUN**; no resource grant was issued. This is the same approved rebuild: all 26 frames, D01-D48 and ten complete journeys remain required. This candidate accepts no frame, decision, journey or release.

## Identity and custody

- Literal returned taskId: `node:delegated-task:command%3Amcp%3Aa56eb6fa-1435-4927-8890-15373d05f366%3Adelegate-task%3Amilestone-20261103-advisor-publication`.
- Self and Parent configure READ, with `modelSelection` omitted, both returned `codex/gpt-6.1-sol/xhigh/default`. Explicit executable: `/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node`, observed `v22.23.0`.
- Parent is sole Root/shared runtime writer: `/Users/kanuj/.t3/worktrees/shelv/kanuj-portal-rebuild-integration-20261030`. Initial actual Root: `004c7a3a145f472f79c2bb6860ebf917798527b8`. Its publication source, rather than prepared INPUT ancestry, governs this candidate.
- Owned checkout: `/Users/kanuj/.t3/worktrees/shelv/t3-65d2a888`, branch `t3/advisor-publication-milestone`, clean starting HEAD `772c4fae7904e39a9e793627023adf56de811d8e`. That prepared ancestry is not Root and is not proposed for integration. Import only the four new owned postimages.
- Parent approved the public ABI, second pure oracle export and read-only arrangement proposal before exports. No nested agent, dependencies, SDK, compiler, SQL parser, database, Auth, browser, server, engine, runtime network request or fixture query was used. Git fetch was excluded by the source-only grant. Parent messaging was used only for the required task/ABI coordination.
- Parent subsequently advanced Root to `72edabab3afe2532580da4a4069dea1edbd1b952`; the inspected publication/advisor/Plan contract/History/notification SQL postimages remain unchanged against `004c7a3a`. A later resource packet must identify its actual reviewed source separately.

## Existing path and affected frames

Read actual Root's [entry](../README.md), [D01-D48](../APPROVED_DECISIONS.md), [desktop specification](../APPROVED_DESKTOP_SPEC.md), [contracts](../IMPLEMENTATION_CONTRACTS.md), [ownership](../WORKSTREAMS.md), [status](../CURRENT_STATUS.md), [acceptance](../ACCEPTANCE_MATRIX.md) and [acceptance-first contract](../GENUINE_ACCOUNT_JOURNEY_ACCEPTANCE_20261103.md), plus the canonical Plan/payment/outbox code. Source hashes are preserved in the ignored evidence directory below.

| Frame | Exact approved node | Actual Root path / scope |
| --- | --- | --- |
| A00 clients | `503:449` | `/advisor/clients`; view-only role negative |
| A01 plans | `500:299` | `/advisor/plans`; actual new-plan UI |
| A02 plan editor | `500:383` | `/advisor/plans/:draftId/:section` |
| A03 sources & agent changes | `500:500` | Existing structured import and section review only; no source ingestion |
| A04 publication blocked | `500:592` | Existing `review-publish` section |
| A04P verify service payment | `503:672` | Existing editor-local payment verification view |
| A05 ready to publish | `500:686` | Same section, exact approval and deliberate publish |
| A06 published / notification failure | `500:779` | Actual receipt/queued branch; failed-delivery UI is an integration gap |
| C01 / C01E current plan | `498:85` / `503:926` | `/plan`; actual current renderer, refresh and safe read |
| C04 check-ins & history | `498:304` | `/history/versions/1` historical secondary variant; M05 owns broader history |

Notifications inbox is an approved secondary flow, with no separate frame ID in this set. A07 `500:846` remains unmounted/unavailable at Root and HELD. This module uses existing advisor plans; it supplies no A07 workaround. Guidance private-return, M65 and provider-photo holds remain HELD. M01 Account first, M02 recorded Orders, M03 Notifications and M05 History retain their separate scopes; numeric IDs do not impose execution order.

## Two exports and caller contract

[`advisor-publication.browser.mjs`](../../../apps/portal/tests/genuine/advisor-publication.browser.mjs) exports only:

1. `runModule({page, descriptor, phase, publication})`: no top-level execution or lifecycle acquisition. Parent supplies the real, ordinarily authenticated page and the reviewed descriptor. Return the prior result's `publication` into the next phase. Every result is `OBSERVATIONS_ONLY` with `genuineAcceptance: NOT_ASSESSED`. Failures throw and retain partial raw observations at `error.m04Observations`; they never create a receipt, retry an uncertain write or close caller resources.
2. `assertPublicationOracle({descriptor, publication, before, after, replay, denials?})`: pure structural assertions over separately captured actual read-only SQL observations. Synthetic unit inputs are explicitly synthetic. No input, matching hash or JSON flag establishes actual Auth, resource custody, SQL execution, permission, atomicity, browser provenance or acceptance.

Descriptor v1 retains the shared `ownerId`, `projectId`, canonical fixture/private directories, actual source SHA and literal-loopback portal/Supabase/mailpit origins. The `actors` object adds actual `advisor` and `viewer` identities beside existing A/B; all four must be distinct, permanent synthetic `.invalid` accounts. No credentials belong here. `publicationScenario` is:

```text
{clientId: actors.a.id, quoteId, claimId, paymentOptionId,
 publicMarker, privateMarker, content}
```

`content` is the Parent-reviewed exact synthetic canonical PlanContent, including a distinct public title and advisor-only marker. It is imported through the real UI/server parser, not treated as ready by this module's preflight. Source locators are empty; no photos or source permissions are required. A/B must have their actual existing active enrollment/case and no prior publications. Do not reset or reuse stopped fixtures. The fixture's `ownerId` is a resource owner ID, not an advisor grant.

Parent must separately review fresh synthetic advisor setup: real GoTrue identities, actual `concierge.advisors` capabilities, actual active owner/human principals, actual owner policy and ordinary issued sessions. No insertion into internal `auth.users`/`auth.sessions`, forged JWT, fake OperationPort/Vault/currentness, authority flag or response success is supplied here. Actual gate reads must bind the authenticated advisor and policy owner to the reviewed advisor identity.

Parent arranges a real canonical **test** quote and submitted-unverified claim for A through existing payment operations: publication version 0, service 10000 cents, products 0, total 10000, no shipping address, actual frozen eligible manual option. The UI confirms only an explicitly synthetic isolated test receipt via real `confirm_payment`. This never establishes receipt of real money. No approval, publication, entitlement, outbox or financial receipt is inserted by this candidate.

## Execution checkpoints after separate review and concrete packet

Run phases serially, retaining each original HTTP observation and real SQL before/after snapshot:

1. `prepare`: actual new plan, structured compare/apply import, deliberate assignment to existing A, all five human section reviews, exact canonical reread and refresh. No Auth user is created by drafting.
2. `missing-approval`: before actual approval, deliberate real publication with a nonexistent approval ID must return 409 `approval_conflict` and no effects.
3. `approve`: deliberate UI approval of the actual exact target; publication remains disabled before payment.
4. `missing-payment`, `wrong-client`, `wrong-revision`, `stale-cas`: separate actual 409 refusals and SQL no effects for each. The stale save uses an incorrect content CAS, preserving actual content/review state.
5. `viewer`: separately ordinarily signed-in real view-only advisor cannot publish (403). `verify-payment` runs on the owner page and checks the actual claim/quote/option, captures UI `confirm_payment`, and proves unchanged exact approval through canonical rereads. Confirming payment must still leave publication/access/clocks absent in SQL.
6. Take `before` SQL snapshot after payment, immediately before `publish`. `publish` deliberately clicks the existing UI and captures the actual command/receipt. Take `after`. `replay` sends the exact captured command, reads actual request status and advisor publication; take `replay` SQL snapshot. No dispatcher runs between these snapshots.
7. `client`: A's actual app shows current plan, refresh preserves it, and the actual history-version route shows the same immutable document across refresh. Parent repeats this phase after a fresh ordinary login. The direct v1 reads are diagnostics alongside the real mounted app, never a fallback when the actual app fails.
8. `other-client`: B positively sees its own preparation state, receives no A marker, and cannot choose A or publish through the client channel. `signed-out`: actual session refusal remains 401; an unavailable 503 is never relabeled. Parent binds ordinary login/logout/account-switch and late-response evidence to the shared session lane.

[`advisor-publication-arrange.sql`](../../../apps/portal/tests/genuine/advisor-publication-arrange.sql) is an optional repeatable-read **READ ONLY** observation query despite its allocated filename. Parent supplies actual `client_id`, `draft_id`, `quote_id`, `claim_id` through psql variables. It returns whole canonical rows needed by the pure oracle. No SQL parser or database has executed it. It requires later real migration compatibility, ACL/RLS/Auth verification. For cross-client denials capture both A and B, using their actual row identities; preserve and compare both snapshots under each `denials` record. Privileged diagnostic results never replace the ordinary client read/write path.

Acceptance requires observed correct gate failures with SQL no effects; exactly one immutable public document/publication/receipt, one initial service/review clock, entitlement and durable business event with one queued email and one portal delivery; exact retry with unchanged persisted rows; safe actual client current/history reads, refresh and fresh login; wrong role/client/session refusals; and independent review of the actual source/resource/trace/query provenance. Canonical source puts these inserts in one transaction. A consistent read-only snapshot alone does not prove rollback/concurrent atomicity, genuine provenance or full milestone acceptance. Those remain actual-execution review gates.

## M03 / M05 observed ID mapping

Parent received the exact mapping before source freeze. Downstream per-client `scenario`:

```text
{clientId, publicationVersion, notificationEventId, portalDeliveryId,
 publicationReceiptId, publishRequestId}
```

- `clientId = receipt.target.clientId`; `publicationVersion = receipt.publicationVersion`.
- `notificationEventId = receipt.notificationEventId = plan_publication_receipts.event_id = plan_events.id`.
- `publicationReceiptId = receipt.publicationReceiptId = plan_publication_receipts.id`.
- `publishRequestId = receipt.requestId = plan_requests.request_id`.
- `portalDeliveryId` is **absent from PublishReceipt**. Use only the actually queried `plan_deliveries.id` matching the event, client recipient and `portal` channel (or an actual inbox `deliveryId`). Never generate this ID locally.
- Snapshot identity is actual `(plan_documents.client_id, version)` plus `receipt_id`. There is no separate snapshot UUID in this canonical source. The oracle returns the actual receipt/target/event/both delivery rows and original read-only query observations.

**No actual generated IDs exist from this task yet.** Unit IDs are synthetic controls, not M03/M05 inputs. Canonical source/event mapping does not establish successful delivery, a client read, whole History completion or current acceptance.

## Verification and raw custody

Only the four allocated new source/report files are changed. Evidence home: `.local-artifacts/portal-rebuild/m04-advisor-publication/` in the owned checkout. `root-source-pins.json` binds exact Root files. `red-initial-source/`, `red.stdout.txt`, `red.stderr.txt`, `red.command.json` preserve initial source and actual meaningful RED: 44 tests, 0 pass, 44 fail, test process exit 1 against the intentionally unvalidated source baseline. This was an oracle baseline, not an alleged Root defect. The initial GREEN is separate: 44/44, exit 0. Current extended controls and source syntax results are stored separately in `final.*`; exact executable, argv, cwd and exit are retained per command. No setup failure is relabeled as meaningful RED.

Final extended controls: **47/47 pass, exit 0**, independently invoked from the repository cwd and `apps/portal` cwd, with zero skips. They cover relational corruption/missing/duplicate effects, private marker exclusion, exact approval/payment/request/receipt linkage, service/review timing and replay, plus loopback/recipient/identity preflight, unavailable-versus-denied provenance and preservation of thrown transport failures without retry or cleanup. A separately preserved omitted-session-body control reproduces 46/47 with a TypeError when the assertion assumes unread bytes exist; the correction preserves `bodyOmitted: true` and invents no response body. Setup/configure READ evidence is separate in `setup.json`; the intermediate 46/46 logs remain separate. These controls do not run the browser phase bodies against fake success data.

Required independent source review is next. Parent alone may later issue the concrete reviewed page/resource packet and execute these assets. SQL/Auth/RLS/browser/server/notification dispatch, application suites/build/CI, visual/a11y/mobile/human/release checks are deliberately UNRUN under this source-only grant. No production, real clients, email delivery, money movement, purchase, fulfillment, PR, push, merge or deployment occurred.

Handoff prompt: review only the four new owned postimages against actual Root publication ABI; retain raw RED/current evidence; check phase ordering, real gate/receipt capture and SQL relationship projection. Do not import prepared ancestry. After source approval, Parent supplies actual fresh synthetic advisor/claim setup and an exact resource packet, then serially runs phases and read-only snapshots. Feed M03/M05 only observed generated IDs and original query/trace proof. Preserve all existing holds and make no acceptance claim from these unit checks.
