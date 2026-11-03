# W1 own service-financials DTO v1

Owner: Kanuj. Current SOURCE-only four-module DTO and focused tests/report. Base `c075cbd4ea4b2f4d75959370233745d07145c069`; own worktree `/Users/kanuj/.t3/worktrees/shelv/kanuj-w1-service-financials-20261103`, branch `kanuj/w1-service-financials-20261103`. W0 approved this distinct own-client readonly seam. No SQL is allocated, no endpoint/route is registered and no policy/financial authority is created by these modules.

## Exact exports and current scope

`PortalServiceFinancials.ts` exports `ServiceFinancialsCommand`, `ServiceFinancialsRpcCall`, `ServiceFinancialsView`, `ServiceFinancialsSnapshot`, `ServiceFinancialsCanonicalPayment` and finite unavailable codes. Mapping exports `buildServiceFinancialsRpc(input)` and `mapServiceFinancialsResult(input,command)`. Validation exports the strict parser/view reader; Values owns request8192, response262144, Auth8192, page100, cursor512-byte and10000ms operation bounds plus safe errors. These are new per-family bounds, not a shared channel increase.

One command: `{schemaVersion:1,action:'read_client_service_financials_v1',snapshot:null|{paymentRevision,serviceRevision,asOfDay,hash},cursor:null|string,limit:1..100}`. Fixed RPC `concierge_client_service_financials_read_v1(p_command jsonb)`. No client/actor/role/requestId/RPC/URL/grant selector. Metadata allows client READ and denies human/task. This classification is not authentication or permission; the real producer must derive the own client from a current permanent session and use the registered own-administration guards.

The view is exactly `{schemaVersion:1,snapshot,payments,nextCursor,firstPublicationOn,pendingServiceQuotes,guarantee}`. It binds an expected snapshot, bounded cardinality/cursor progress and unique canonical claim/quote IDs; pending quote IDs cannot contradict the observed confirmed payments. Parsed results are detached/deeply frozen; getters/extra/private fields refuse. Known publication/verification days cannot exceed the supplied authoritative Chicago day. Recorded scheduled periods retain exact one-month calendar boundaries with month-end clamping; the mapper does not compute care permission or refund eligibility.

Current payment rows have explicit `kind:'canonical_payment'` and actual nonnull claimId/quoteId/verifiedAt/serviceCents plus `period:{state:'pending_publication'}|{state:'scheduled',startOn,endOn}`. Canonical service_periods, not confirmation service_start/end, must supply those dates. A real legacy receipt lacking these IDs/period has no valid v1 row: it is not relabeled pending publication. Future legacy receipt/unknown-period lineage requires an explicit reviewed variant/version. The numeric2500 unit fixture tests lossless integer representation only; current confirmation CHECK0/10000 cannot produce such a record, and this test neither establishes a legacy payment nor authorizes IDs, imports or constraint changes.

V1 deliberately decodes ONLY unavailable guarantees: payment_lineage_unavailable, legacy_payment_provenance_required, service_terms_unavailable, period_basis_unavailable, calendar_policy_unavailable, broader_terms_unavailable. The actual policy/legacy producers do not exist/admit yet, so an unsupported `state:'supported'` result is rejected. Full supported guarantee remains a required later W1 policy-assignment/persistence/projection milestone and W5 verified-lineage dependency; it is not waived or simulated by a reserved positive branch. An unavailable reason must come from the actual producer; absent canonical rows do not prove zero real payments or absence of the business guarantee.

## Observed proof

Actual runtime was read as codex/gpt-6.1-sol/xhigh/default; all commands use explicit Node22.23.0. No nested agents. npm ci ran only in this new own checkout, using its unchanged lockfile.

- Initial24 tests failed24/24 at explicit missing-export assertions, exit1 (`exports-red.log`). This is a new-feature export gate, not a reproduced historical financial bug or SQL proof.
- Initial implemented contract24/24, exit0 (`contract-green.log`).
- Added bounded-domain roundtrip/all1..100limits and UTF8 scalar-width cursor boundaries:26/26, exit0 (`contract-domain26.log`), with no new dependency. These are bounded-domain checks, not exhaustive fuzzing or extra unique-test counts.
- New current-day predicates on prior code:27 pass/2 intended failures, exit1 (`day-basis-red.log`): future publication and future-Chicago verification were accepted. UTC-next-date/previous-Chicago-day control passed separately.
- Current29/29, exit0 (`contract-final29.log`), including exact previous-Chicago-day UTC boundary, private-field/selector denial, canonical IDs, legacy-unknown refusal, snapshot/cursor/duplicate/coherence, immutable output and unsupported-guarantee refusal.
- Root app and root test TypeScript graphs both exit0 (`root-types.log`, `root-test-types.log`). `git diff --check` passes.

All raw evidence is own ignored `.local-artifacts/w1-service-financials/`. No actual Auth/SQL/RLS/catalog/legacy receipt/policy/session/wait/browser/provider/financial action was executed. No principal, Guidance, M65 or photo audit is retried/rephrased/rerouted. Held scope remains held.

## Required next producer and acceptance gates

W5 may bind the exact typed fixed-RPC handler/transport to these symbols, with current-role/session/identity checks, known401/403 priority, bounded reads and no redirect credential leak. W0 owns registration and allocation. No SQL-containing PR or resource execution occurs before exact W7/W0 admission. The source producer must hash the full actual own ledger/period/publication/policy basis and Chicago day, not merely two heads; paging changes conflict409. No silent quote truncation or omitted contradictory lineage is allowed.

W1 still owns a separately reviewed actual immutable applicable-policy assignment/projection proposal. W5 owns actual verified legacy receipt/origin/reconciliation proof, with no fabricated canonical IDs or unsupported no-overlap inference. Current canonical receipts may be exposed with truthful unavailable guarantee, without implying all external payment history is captured. Actual old/current ownership, policy/funds, after-care administration, Auth/RLS, expiry/waits/paging/no-effects, full current CI/browser and independent acceptance remain open. These pure DTO tests do not complete C08/J08 or the W1/W5/W6 workstreams.
