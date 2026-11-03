# M02 ended-session SOURCE R4

Owner: Kanuj. **SPEC/completeness PASS; source quality PASS, scoped to the complete candidate below. No material finding. M02 NOT accepted.** The gate and conditional recommendation were sent before this report was written. This is a new independent source review, with no nested agents, candidate correction, commit or ancestry import.

The corrected callback issues the unchanged Orders POST directly after logout, using only the CSRF string captured from the actual original held refresh request. It retains the actual 401 requirement. Source and finite denial/data checks do not establish genuine execution, cookie deletion, revocation, delivery of a late response or acceptance.

Actual self and Parent `t3_thread_configure` READs, with `modelSelection` omitted, returned `codex/gpt-6.1-sol/xhigh/default` at entry and terminal verification. Explicit Node is `/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node`, observed `v22.23.0`. Reviewer checkout is `/Users/kanuj/.t3/worktrees/shelv/t3-abf51ae6`, HEAD `772c4fae7904e39a9e793627023adf56de811d8e`; it is not Root ancestry.

Literal new dispatch receipt: `C/M02-ENDED-SESSION-REVIEW-DISPATCH.json`, SHA-256 `5913c05f2a42d571efc48f522566fe12db4db72b3a3d544534dc77e83fa5c1e6`. It was absent on the first read, then read after materialization and configuration READs. Its separately recorded values are:

- taskId: `node:delegated-task:command%3Amcp%3Aa56eb6fa-1435-4927-8890-15373d05f366%3Adelegate-task%3Amilestone-20261103-m02-ended-session-source-r4`
- childThreadId: `thread:delegated-task:command%3Amcp%3Aa56eb6fa-1435-4927-8890-15373d05f366%3Adelegate-task%3Amilestone-20261103-m02-ended-session-source-r4`
- childRunId: `run:thread:thread%3Adelegated-task%3Acommand%253Amcp%253Aa56eb6fa-1435-4927-8890-15373d05f366%253Adelegate-task%253Amilestone-20261103-m02-ended-session-source-r4:ordinal:1`

`C` is `/Users/kanuj/.t3/worktrees/shelv/kanuj-portal-rebuild-co-4bb412d8e34c7ca1/.local-artifacts/portal-rebuild/acceptance-first`. Root is `/Users/kanuj/.t3/worktrees/shelv/kanuj-portal-rebuild-integration-20261030`, HEAD `359c6bf0c759357df648ca441e9e3d1c3d29398c`. Exact public `C/ROOT_359C_SOURCE_TARGET.json` raw SHA-256 is `be2e06bcbd45665e2f2e191dafb5d6d284f0a2591987ad236a6efce02e21eb1e`. All 2,376 actual source records match its path/kind/mode/size/SHA records; the logical stage SHA-256 independently reproduces `4201bfe6d92e73ab22611f41b23c6bfead1687d0dae26d7ddf8e257bb017d23b`. Status remains only the existing untracked `docs/handoffs/2026-11-02-portal-rebuild.md`. The snapshot names full-FS `f3ce304bc6fd3f52e5331c4dd3ddecf9dd58a7c5c989bcdb62534c150f27c58a`; the dispatch names 68-migration ledger `77ccff3337064baa8b7c1c0140023068f76d6588d213b0892b444a8dd72a498a`. All 68 migration records match; Parent's aggregate encodings were not reconstructed. The setup's separate JSON-array digest is not substituted for those identifiers.

Complete files were read. Each unchanged asset below was independently obtained with `git show <Root HEAD>:<path>` and matched to the actual file and public snapshot, without importing ancestry:

| File | Git blob | SHA-256 |
| --- | --- | --- |
| `apps/portal/tests/genuine/account-orders-seed.sql` | `8306975ccbf21d807e899d2cfe3f3593a5f0a1eb` | `a3217a097b0d12a1f3496a2ea99164ac6dd91747b480a5c88bc123282169c4e4` |
| `apps/portal/tests/genuine/recorded-orders-observation.sql` | `d2bd58abbbbeb8696288da5d826abfcbe049b26b` | `1fcfcf837f9c25d5172e2bc2b72f6acf293143d1b6185583a1b74358fe3a1ed6` |
| `apps/portal/tests/genuine/recorded-orders-oracle.test.mjs` | `ddcc6aa9b00da0a4c0e680029c7c18c3142fc507` | `0e9bac0cc603d63c329b6d19e8a43e6ff6579a30fd11a52cb89c665615c41e68` |
| OLD `apps/portal/tests/genuine/recorded-orders.browser.mjs` | `a00b2fed6e81bc66afa0db572989791d2efbee55` | `0209a49e664baa06b90a01437110cce3dfaeaefdf60980f8d01a2eac263541a1` |
| `docs/portal-rebuild/research/W5_GENUINE_RECORDED_ORDERS_ACCEPTANCE.md` | `22f48e89321ba68845d8a694fe2d02620d41c205` | `0e46968f5a74cbfb20e6b15be06c218dc63dafa8a1cc6d839f40335472053b56` |

CURRENT is the complete `C/m02-ended-session-source/recorded-orders.browser.mjs`, SHA-256 `b2e45539f75e95d814a66345d4ca8822c49f18ad3826b3c4d4f114a8f8701570`, actual mode `0400`. `EXACT-DELTA.json` SHA-256 is `0b714ecec1786a6939d8ace6c0b622b97617dfbf2bfd1549d9f75befeff28d33`. Independently applying its six unique replacements to OLD reconstructs CURRENT byte for byte. There are no other changes, including to the complete self-test block, seed, DTO validators or oracle.

Source reasoning against actual Root:

- `policy.ts:132` requires a nonempty CSRF header of at most 128 characters before `gateway.ts:78` reads the session cookie and before its `:178` session demand. OLD's session GET can fail or return no session CSRF; its empty-header POST tests the earlier 403 guard. This explains the request-construction defect without manufacturing a session or an HTTP result.
- CURRENT `:144-149` preserves the default positive GET-session/CSRF/POST behavior. Only the ended-session call `:286` supplies retained CSRF. The fixed command, exact path, JSON bytes, `same-origin` credentials and `no-store` remain unchanged. The denial controls confirm no bootstrap precedes this POST and no Cookie header is injected.
- CURRENT `:265-267` captures `route.request().allHeaders()['x-shelv-csrf']` from the original POST, checks string length 1..128, then obtains the real response. The captured value stays local and is not added to emitted observations. There is no restored cookie, new session, caller-supplied authority, currentness override, revocation bypass or substituted response.
- Logout still precedes releasing/joining the original held work. The exact real response status/headers/body and normal cancellation alternative are retained; a cancelled delivery is not proof the application received late bytes. The UI remains absent and the signed-out read must return **401**, with no private marker. Delay release, held-work join, unroute, pending response drain, trace stop and uncertain cleanup remain unchanged.
- Actual Root Application/session invalidation, Orders entry/controller/transport and read-only renderer were inspected without runtime import; 16 related file pins are retained. They clear projections before abort/retirement and recheck ownership/READY after awaits. This correction changes the browser probe only and makes no new product-lifetime claim. Unchanged historical seed bookkeeping, 27-relation read-only observation SQL and `OBSERVATIONS_ONLY` validator retain their limited meaning.

Ignored evidence home `E` is `/Users/kanuj/.t3/worktrees/shelv/t3-abf51ae6/.local-artifacts/w7-m02-ended-session-source-r4`. All recorded subprocesses use cwd `/Users/kanuj/.t3/worktrees/shelv/t3-abf51ae6` and the explicit Node above. `OLD=E/old/apps/portal/tests/genuine/recorded-orders.browser.mjs`; `CURRENT=E/current/m02-ended-session-source/recorded-orders.browser.mjs`. Every row has raw `.stdout`, `.stderr` and `.command.json` containing the complete argv, cwd, timestamps, signal and actual child exit. The receipt runner's own exit 0 does not replace child exits.

| Receipt stem | Node argv after executable | Actual exit / qualification |
| --- | --- | --- |
| `setup` | `E/setup.mjs` | 0; pin/copy/six-replacement assertions, not application acceptance |
| `old-parent-denial` | `E/current/ended-orders-read-control.mjs OLD` | **1**; first URL is `/api/client/session`, expected `/api/client/client-orders` |
| `current-parent-denial` | `E/current/ended-orders-read-control.mjs CURRENT` | 0; copied exact Parent control, 10 checks |
| `old-independent-denial` | `E/denial-control.mjs OLD` | **1**; independently reproduces the same first-request mismatch |
| `current-independent-denial` | `E/denial-control.mjs CURRENT` | 0; 16 cases/checks: direct POST, 1/128-character boundaries, unchanged normal first GET, invalid capture values and capture-before-fetch ordering |
| `old-syntax` / `current-syntax` | `--check OLD` / `--check CURRENT` | 0 / 0; syntax only |

Both denial controls extract the exact callback into Node's built-in VM. Every fetch records one request and **always throws before any response exists**. No success Page, Response, HTTP, Auth, Authority, currentness, Vault or OperationPort facade was used. Data controls exercise the exact capture guard. No network/socket, SDK/dependency/compiler, SQL parser/execution, Auth/DB/browser/engine/listener, fixture invocation or private actual-evidence read occurred. Parent's reported 22/22 self-tests are attributed only: full `--self-test` was not independently rerun because its unchanged production-DTO test dynamically imports TypeScript outside this task's built-in-only runtime scope. No assertion was removed or weakened to claim 22/22.

Parent reports the corrected seed committed once, real A/B production reads, ready HTTPS host and A list/detail/navigation/selectors passing, followed by a genuine R1 failure after real delayed-response release/logout: the helper's empty-CSRF POST returned 403 while the assertion required 401. Parent reports private UI cleared, logout 200, browser/context/Node closed with exit 0 and uncertainty `[]`, host retained. These are attributed observations, not independently accessed evidence; **that genuine R1 remains FAILED**. The prior complete-asset R3 source PASS is also prior evidence, not this review's runtime result.

Conditional recommendation: Parent may prepare a **new exact browser-only packet** for this candidate on the same separately authorized M02 LIVE fixture, only after a separate current read-only baseline and normal ready-host check. This review grants no seed/reseed, SQL, fixture reset/restart, Auth/host lifecycle or Root mutation. Old stopped fixtures and current LIVE72d1 remain outside this review. Genuine completion of A/B/new-A, real denial/effect correlation, final SQL observations, visual/accessibility and independent runtime review remain pending.

M01 own Account Name is the separately accepted one bounded ACTUAL capability, with **0 full screens and 0 journeys**; this is dispatch context, not a new R4 acceptance. M02, full C06/C06D, the full D01-D48/26-screen/10-journey objective, CI and release remain unaccepted by this review. Root and reviewer tracked/index state are preserved; the sole non-ignored change is this new uncommitted report. No commit or import was performed.
