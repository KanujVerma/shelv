# Fixed Commerce endpoint candidate

Owner: Kanuj. W5 source candidate against frozen baseline `8c5c6b2d72e75f620487f1b2b110655b03551b17`. W0 explicitly allocated this directory and new `w5-orders-commerce-*` tests on 3 November 2026. This endpoint is not registered, deployed or financially accepted.

The handler parses the closed Commerce command family, derives actor identity through the retained verified-bearer Auth transport, dispatches only `concierge_commerce_command_v1`, and strictly maps its result to the original command/hash/actor. Unknown input, response and SQL errors fail closed. A lost or malformed write result remains uncertain. No endpoint calls a payment, retailer, carrier or payout provider.

Initial handler/runtime/index postimages are attributed to `a0f5f922d3555db2c53b3f5ee4c8bfa7c4196911`; no prepared ancestry was imported. At the original five-file candidate `a590dfd51b069df65f3edf50c50073ca9355f27f`, handler and index remained exact. Its owned runtime added manual redirect refusal before body reading, nonblocking redirect-body cancellation, received Auth/RPC401/403 preservation and a2,000,000-byte provider JSON limit. W7 subsequently withheld that candidate for C1. The successor below changes the owned handler/runtime; index and shared Auth/runtime files remain unchanged.

## Author proof

All commands use explicit Node22.23.0. Tests are finite synthetic HTTP, not actual authentication, persistence, workerd or financial acceptance. Original assertions from `tests/portal-commerce-handler.test.ts@a0f5f922` are retained with import and erased TypeScript annotation adaptation only.

- Original retained3 tests pass before the runtime correction (`endpoint-retained.log`).
- Added negative controls on original runtime:4 pass/6 fail (`endpoint-old.log`). Failures cover unreadable Auth401/403, unreadable RPC401/403 and the required manual/no-read redirect behavior.
- Historical a59010/10, zero failures/skips/cancellations (`endpoint-current.log`). Includes fixed RPC/public-key bearer plumbing, strict owner/media/origin/input denial, finite safe SQL errors, uncertain writes, redirect refusal/no off-origin request, nonblocking body cancel and provider size limit. This narrow pass did not cover C1 and is not relabeled as successor acceptance.
- Full-transitive strict/noUncheckedIndexedAccess/verbatim/skipLibCheck:false handler/runtime graph passes with zero diagnostics (`endpoint-strict2.log`). The first attempt requested an unavailable Node type package (`endpoint-strict.log`); this browser/Edge graph needs ES2022/DOM types instead. No dependency or compiler option was weakened.

Evidence resides in this checkout's ignored `.local-artifacts/w5-commerce/`. The original source pin manifest binds all imported bytes. A mechanical ignored projection contains baseline source plus the exact four `PortalCommerce*` contract postimages from `60332e7ffdebfff81bc020dbfb8346bce11467ef` and the current owned endpoint files. These shared DTOs are absent from baseline and remain W1-owned. The projection supplies source dependencies only, never authentication/business/currentness authority. It is not the integrated application.

Before W1 DTO admission, run:

```sh
W5_COMMERCE_SOURCE_ROOT="$PWD/.local-artifacts/w5-commerce/projected" /Users/kanuj/.nvm/versions/node/v22.23.0/bin/node --experimental-strip-types --test apps/portal/tests/w5-orders-commerce-endpoint.test.mjs
```

After actual W1/W0 integration, run the same test without `W5_COMMERCE_SOURCE_ROOT` against the real checkout. That exact connected-source run remains required. Existing M02 source, tests, evidence and fixtures remain untouched.

## C1 abort correction

W7-C1/P2 found that the a590 runtime awaited a stalled provider body after native abort and later fulfilled when the producer released it. The exact original program is archived by W7 at `e56f798b8b0656aab9e27007fc530357fb3954d3`, `docs/portal-rebuild/w7/source-controls/W5_C1/w7-commerce-abort-body.test.mjs`, SHA256 `4dc48148eb25e396ed983f4c764201221f170ab66ccbeef47f5dd75f8e68508a`. Its original failure and the ten historical passes remain distinct.

The owned `body.ts` now bounds each asynchronous body read and command hash against abort and an absolute ten-second deadline. The handler starts one lifetime before Auth and passes it through request decoding, hashing and the actual retained-factory RPC. The runtime races fetch settlement even when the supplied network implementation ignores cancellation, retires/cancels late responses without reading them, bounds body reads and checks availability after decoding and before returning a successful value. Received401/403 stays definite, including coincident abort; redirected responses remain refused. Cancellation never waits for a remote producer to acknowledge cleanup. These guarantees use the actual retained-factory ports; arbitrary replacement port implementations are not independently bounded by the handler.

The full successor scope is seven files: handler, runtime, index, this README, the retained endpoint test, new body helper and new `w5-orders-commerce-abort.test.mjs`. No shared module, DTO, route, migration or M02 file changes.

Evidence is in this checkout's ignored `.local-artifacts/w5-commerce-c1/`:

- Original W7 program on a590:0/1, settles fulfilled only after release (`OLD-W7-ORIGINAL1.log`). It is byte-identical in both ignored projections.
- Retained ten on complete a590 dependencies:10/10 (`OLD-RETAINED10-COMPLETE.log`). An initial incomplete-source import failure is preserved separately as `SETUP-MISSING-TRANSITIVE.log`.
- Same final23 owner controls on a590:13 pass/10 fail, zero skipped/cancelled (`OLD-OWNER23-FINAL.log`). An earlier test setup with an unjoined producer is separately retained, not counted as this result.
- Successor retained10 plus owner23:33/33, zero skipped/cancelled (`CURRENT-OWNER33-FINAL.log`). Includes actual handler/retained-transport abort/denial behavior, the native ten-second timeout, absolute whole-handler deadline, preabort, final-chunk abort, no late response read and nonblocking cancellation. The absolute-deadline control advances only `Date.now`; the separate native-timeout control waits for the actual native signal without a caller abort.
- Exact original W7 program on successor:1/1 (`CURRENT-W7-ORIGINAL1-FINAL.log`). This overlaps the owner controls;34 executions are not34 independent coverage predicates.
- Full-transitive strict handler/runtime/body compile:zero diagnostics (`CURRENT-STRICT-FINAL.log`). An intermediate22/26 candidate that let an outer abort race outrun received denials is retained as `INTERMEDIATE-NESTED-RACE-22-OF26.log`; it is not the frozen successor.

The current mechanical projection uses exact Commerce DTO4 at603, byte-equal to99. Those files remain absent from this candidate's baseline: ordinary Root execution is dependency-held. No successful-port substitute, SQL query, Auth/Storage fixture, browser, provider, financial-authority or held-audit execution was used. Independent fresh W7 complete-source review and actual dependency admission remain required before any integration claim.

## Persistence remains unadmitted

No SQL is authored, added, applied or queried by this slice. The retained M63, M64 and M65 originals are separately hash-preserved outside Git for compatibility analysis. CB1-CB4 historical failures, the later CB5/CB6 findings and M65/provider-refused audit holds remain intact. No refused audit is retried or rerouted. W0 requires a current-source function/catalog/collision/ordering proposal, W1/W6 shared plan-service compatibility and explicit migration allocation before any forward SQL authoring. Old timestamps cannot be inserted into the current68 migration ledger without that process.

W0 owns actual gateway/route registration and resource admission. W1 owns shared contracts. W7 owns independent current acceptance and fresh serialized genuine resources. Full reset/pgTAP/least-privilege/Auth/SQL/upgrade/rollback, actual workerd, mounted client/advisor browser, Figma/responsive/accessibility and exact-head CI are unrun. No source/test pass is financial or complete C06/C06D acceptance.
