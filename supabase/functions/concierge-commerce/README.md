# Fixed Commerce endpoint candidate

Owner: Kanuj. W5 source candidate against frozen baseline `8c5c6b2d72e75f620487f1b2b110655b03551b17`. W0 explicitly allocated this directory and new `w5-orders-commerce-*` tests on 3 November 2026. This endpoint is not registered, deployed or financially accepted.

The handler parses the closed Commerce command family, derives actor identity through the retained verified-bearer Auth transport, dispatches only `concierge_commerce_command_v1`, and strictly maps its result to the original command/hash/actor. Unknown input, response and SQL errors fail closed. A lost or malformed write result remains uncertain. No endpoint calls a payment, retailer, carrier or payout provider.

Initial handler/runtime/index postimages are attributed to `a0f5f922d3555db2c53b3f5ee4c8bfa7c4196911`; no prepared ancestry was imported. Handler and index remain exact. The owned runtime wrapper now uses manual redirect refusal before body reading, does not wait for redirect-body cancellation, preserves received Auth/RPC401/403 with unreadable bodies and bounds provider JSON at2,000,000 bytes. Shared Auth/runtime files are unchanged.

## Author proof

All commands use explicit Node22.23.0. Tests are finite synthetic HTTP, not actual authentication, persistence, workerd or financial acceptance. Original assertions from `tests/portal-commerce-handler.test.ts@a0f5f922` are retained with import and erased TypeScript annotation adaptation only.

- Original retained3 tests pass before the runtime correction (`endpoint-retained.log`).
- Added negative controls on original runtime:4 pass/6 fail (`endpoint-old.log`). Failures cover unreadable Auth401/403, unreadable RPC401/403 and the required manual/no-read redirect behavior.
- Current10/10, zero failures/skips/cancellations (`endpoint-current.log`). Includes fixed RPC/public-key bearer plumbing, strict owner/media/origin/input denial, finite safe SQL errors, uncertain writes, redirect refusal/no off-origin request, nonblocking body cancel and provider size limit.
- Full-transitive strict/noUncheckedIndexedAccess/verbatim/skipLibCheck:false handler/runtime graph passes with zero diagnostics (`endpoint-strict2.log`). The first attempt requested an unavailable Node type package (`endpoint-strict.log`); this browser/Edge graph needs ES2022/DOM types instead. No dependency or compiler option was weakened.

Evidence resides in this checkout's ignored `.local-artifacts/w5-commerce/`. The original source pin manifest binds all imported bytes. A mechanical ignored projection contains baseline source plus the exact four `PortalCommerce*` contract postimages from `60332e7ffdebfff81bc020dbfb8346bce11467ef` and the current owned endpoint files. These shared DTOs are absent from baseline and remain W1-owned. The projection supplies source dependencies only, never authentication/business/currentness authority. It is not the integrated application.

Before W1 DTO admission, run:

```sh
W5_COMMERCE_SOURCE_ROOT="$PWD/.local-artifacts/w5-commerce/projected" /Users/kanuj/.nvm/versions/node/v22.23.0/bin/node --experimental-strip-types --test apps/portal/tests/w5-orders-commerce-endpoint.test.mjs
```

After actual W1/W0 integration, run the same test without `W5_COMMERCE_SOURCE_ROOT` against the real checkout. That exact connected-source run remains required. Existing M02 source, tests, evidence and fixtures remain untouched.

## Persistence remains unadmitted

No SQL is authored, added, applied or queried by this slice. The retained M63, M64 and M65 originals are separately hash-preserved outside Git for compatibility analysis. CB1-CB4 historical failures, the later CB5/CB6 findings and M65/provider-refused audit holds remain intact. No refused audit is retried or rerouted. W0 requires a current-source function/catalog/collision/ordering proposal, W1/W6 shared plan-service compatibility and explicit migration allocation before any forward SQL authoring. Old timestamps cannot be inserted into the current68 migration ledger without that process.

W0 owns actual gateway/route registration and resource admission. W1 owns shared contracts. W7 owns independent current acceptance and fresh serialized genuine resources. Full reset/pgTAP/least-privilege/Auth/SQL/upgrade/rollback, actual workerd, mounted client/advisor browser, Figma/responsive/accessibility and exact-head CI are unrun. No source/test pass is financial or complete C06/C06D acceptance.
