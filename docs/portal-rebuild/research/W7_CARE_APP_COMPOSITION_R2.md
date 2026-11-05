# W7 independent care application composition review, round 2

Owner: Kanuj. 31 October 2026. New independent report-only round at exact parent **`5029825a64b3ec63f14152e909b72d1e8095ef0c`**. No nested agents or production fixes. Synthetic Chrome custody returned before report writing.

## Separate verdicts

| Subject | Specification | Correctness / quality |
| --- | --- | --- |
| CA1/P2: failed first reads on direct care routes | **ADDRESSED, scoped PASS** | Both known routes reach loading/denial/error and deliberate controller retry before data exists; error headings identify actual-use reporting |
| Confirmed-v2 boundary and retained application composition | **Scoped PASS** | No care form before confirmed v2; legacy-v1 care remains unavailable; actual cookie/factory/Root-mapper/controller and retained client/advisor controls pass |
| Prior CU1-CU3, A1-A3, C1/AR1, CB1/CB2, CN1 and H1/H2 | **Qualified closures retained** | This small application correction changes none of their feature, transport, Root or native mechanisms; their broader evidence is not freshly recertified |
| Genuine care browser, independent R7, complete portal and release | **NOT ESTABLISHED** | No actual Auth/database/native resource or live business action was exercised |

**No new material in-scope finding.** Current checked-in source82 and actual-Application browser19 pass. Original independent source5, added pending/v1 controls2 and adapted R1 browser17 pass. Six new independent direct-retry cases pass, fail **0/6** with only exact18c Application input, then pass **6/6** again with current input. Original SSR assertions fail **0/3** under the same old-file-only substitution and pass on current source. Counts overlap and must not be summed into acceptance.

## Exact source, runtime and ownership

| Item | Verified evidence |
| --- | --- |
| Workspace / branch | `/Users/kanuj/.t3/worktrees/shelv/t3-ec5dc7be` / `t3/care-app-composition-r2` |
| Clean starting and tested head | **`5029825a64b3ec63f14152e909b72d1e8095ef0c`**; actual Git/status/log/instructions inspected; runtime/test source unchanged throughout |
| Response | Same5029825a: only Application.tsx, three appended SSR cases, six appended App cases and the coordinator recovery report |
| Original R1 | Author `2271ce597de52688dcaaa14945a3e23a9a9e0b1f`, integration `89dc442d`; tested application `18c78b7d477f7d8fe9bc7ff950544ab0081f8008` |
| Assigned task | `portal-rebuild-w7-care-app-composition-review-20261031-r2` |
| Actual child thread | `thread:delegated-task:command%3Amcp%3A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%3Adelegate-task%3Aportal-rebuild-w7-care-app-composition-review-20261031-r2` |
| Both live model tools, before and after Chrome | `orchestrator_capabilities` and `t3_thread_configuration`: **codex / gpt-6.1-sol / reasoningEffort=xhigh / serviceTier=default**, full-access/default interaction |
| Supported descriptors | Reasoning low/medium/high/xhigh/max/ultra, catalog default low; service default/priority, catalog default default. Effective xhigh/default explicitly selected |
| Project / eight role pins | Nine TOMLs parsed and hashed; project model/subagent defaults and w0_foundation through w7_verification pin Sol/xhigh |
| Node / dependencies | Explicit **v22.23.0**, `/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node`; portal-only locked offline install130 packages; no root install, upgrade, flag/config/lock change |
| Freshness boundary | Local `origin/main=d39a7d4943209080df7c4cf97d85784f462758bf`. No fetch or remote-currentness/CI claim, reset/rebase/import or foreign-worktree write |
| Tracked write-set | **Only this report**. Coordinator retains status, acceptance, TASKS, CONTEXT_SYNC and integration |

The report-only containing commit is returned separately and is a child of the tested parent. No push, PR, merge, deployment, real-client/source/permission action, communication, funds or retailer order.

## Requirements, source and preserved originals

Read the full [R1 composition review](W7_CARE_APP_COMPOSITION_REVIEW.md), [recovery response](COORDINATOR_CARE_APP_RECOVERY.md) and [composition response](COORDINATOR_CARE_APP_COMPOSITION.md). Read the complete95,388-byte [approved input](../source/APPROVED_INPUT.txt) in bounded ranges, including D01-D48, full desktop specification and full26-screen/component manifest; all five original byte counts/SHA-256 values match INPUT_PROVENANCE. Read the rebuild entry point, contracts, CARE_API, acceptance, ownership/workstreams/status and applicable AGENTS. Read all three care-client reviews, W3_CARE_USE with CU1/CU2 responses, attribution response and coordinator transport. Revisited the original application/fix, C1/AR1/status, backend R3/CB1/CB2/CN1, W6 R7 Node and H1/H2 records for their qualified dispositions. Older Application=v1 and historical custody text do not override current Git or grant resources.

Inspected the complete Application, factory, care-port, client-controller/session and canonical advisor-audit paths, shared renderer/use guards, changed test setup/assertions and builder. Compared actual patch boundaries: since18c, **Application.tsx is the only changed production path** across portal source, session runtime, Root src and supabase. Ports, care-ports, controller and PublicationAudit exactly match R1 hashes. All57 migrations remain; no M58/W1 isolated Root or W6 uncommitted seam was imported. Original eight regression/helper files equal their retained hashes. The checked-in old13 App test bytes are an exact prefix of the new19 file.

R1 evidence remains read-only at `/Users/kanuj/.t3/worktrees/shelv/t3-dd64ac3a/.local-artifacts/w7-care-app-composition/`. Before/after inventories prove **all48 files unchanged**, including scripts, RED logs, JSON/PNGs and original manifest SHA **`dd13edcfa72ef4e8604c48b498b0f6803636ac213c150847e3a99bce734b1eb3`**. No R1 artifact was executed in its original directory or overwritten.

Applied verification-before-completion and source-boundary review guidance. This is a bounded independent specification/correctness review, not a new design or exhaustive security audit.

## CA1 disposition and independent evidence

[ClientContent](../../../apps/portal/src/app/Application.tsx) now recognizes product-use/report-use independently of `state.view`. Existing error/loading branches run first. Error PageHeader is **record actual use** for either route;403 retains denied styling,409/503 retain the existing error treatment and retry. A separate later guard still refuses care composition when a confirmed view is v1. The patch adds no permission, endpoint, parser, fallback, form behavior or server authority.

The **byte-identical original source-independent.test.mjs** passes5/5: all three actual-cookie/controller/ClientContent failed-first-read assertions plus both creation-bound owner-replacement controls. Its SHA remains **`e799cee43e0ffe6689f33083a1fe0908215805ca5b724435fa8a487496ac8b11`**. Two supplemental actual-controller SSR cases hold the initial v1/v2 HTTP result: both care routes show loading and no form. After delivery, v1 still has unavailable care/no form, while v2 can render the shared form. Each emits only its selected version's read.

The original R1 browser probe waits for **this page is not connected yet**, which is intentionally absent after the correction. Its current setup timeout would not establish a defect. The own retained copy changes **only that observation wait** to an exact-text union of old unavailable or current plan-access/plan-unavailable status. All original assertions, including retry count and the ordinary `/plan` recovery control, remain. The eleven other cases are unchanged. All17 pass. Own helper changes are checkout/output paths and an optional ignored input-only sensitivity hook; no successful operation port, current predicate, mapper, controller or permission is substituted.

Six additional independent actual-Application cases establish recovery **without alternative navigation**:

1. Directly enter `/plan/products/cerave-pm/use?routine=evening` or `/plan/use?routine=evening`, width390; deliver403/409/503 to the actual first `read_client_plan_v2 {version:null}` care request.
2. Require exactly one retry, the actual-use heading, no form, no unavailable-module copy, unchanged exact URL and exactly one care read. No plans/payment request occurs.
3. For503, use the normal **check connection** control first. It restores the actual cookie session without replacing deliberate domain retry or navigating away.
4. Focus retry and press Enter. Hold its HTTP result: the current page shows loading, with no form/what-changed control and unchanged evening route. Release a valid strict v2 response; only then does the shared form appear with the correct selected-product identity question, or no fabricated product on the general route.
5. Require exactly the two identical v2 read commands, zero mutation/v1/finance requests, unchanged route and empty localStorage/sessionStorage.

Current6/6 passes; a separate final current process repeats6/6. Own error/recovered DTO-DOM-URL/history JSON and screenshots are retained. Directly inspected current403 general and503 product PNGs: actual-use heading, clear denial/error and retry;503 also retains the separate connection control. The old-input409 general PNG still shows notifications/unconnected, consistent with the historical finding. These local image reads after release are filesystem-only.

**Meaningful sensitivity:** an ignored esbuild input plugin substitutes **only exact18c Application.tsx**, SHA **`4c89c5162285d96a71077fea6691ab752dd9d701f13ca5833f6844c31f06e2fb`**; all other inputs remain current. Original SSR assertions become0/3 at the intended unsupported-route assertion. The same six new browser assertions become0/6, each actual retry0 versus required1, with successful setup and normal teardown. Current source then passes again. Production files and intended assertions are never changed; no old transport/Root/helper bundle is adopted.

## Retained controls and honest limits

| Area | Fresh evidence / retained qualification |
| --- | --- |
| Actual application composition | Checked-in19 passes old13 plus six recovery cases. Real main/start/Application, cookie/session factories, Root parsing/mapping, controller and shared renderer execute; HTTP DTOs/reducer persistence remain synthetic |
| Client success / route / privacy | Retained320 keyboard PKCE/use Stop, unknown occurrence, supported note, v2 reread/reload, current stopped overlay and no payment/Start inference pass; sensitive note stays out of URL/history/storage |
| Preparation / unknown product / read-only | Retained preparation and unknown-product contextual recovery pass; checked-in general read-only and product SSR read-only refuse forms. Pending extra checks enforce no form before confirmed data; v1 remains unavailable |
| Owner/session/late results | Both raw creation-bound client/advisor cases pass public restore owner/CSRF replacement,401/no further egress/cleared private memory/ended controller. Mounted old client read and old advisor audit cannot replace the new session's current projection |
| Canonical advisor audit | Four actual preparation/active/read-only/ended cases retain clientAccess and shared current-use/correction attribution.503, private-extra and wrong-client results refuse without v1 fallback or invented client entitlement/care-write/history controls |
| Existing application/navigation | Old13 remains unchanged and passes: decision/publication/no automatic Start, default lawful assigned-open, logout/late delivery, callback scrubbing, native preview Back/Forward250/600 and real focus |
| Pending intent / mode / exact retry | Feature/controller/transport source unchanged from R1; source82 retains v2/no-fallback/fetched-identity/owner/continuation controls. CU1/CU2/CU3 and prior58/mode/exact-request mechanisms retain their recorded closures; this is not another full173-case feature recertification |
| Prior findings | A1/A3, C1/AR1/current notice and backend CB1/CB2/CN1/H1/H2 remain qualified closures. A2 ordinary browser reachability remains unproven. Original pending-after-valid-ack objection remains incorrect. No fresh SQL authorization or stored-data-loss claim follows |

Public Maya remains honestly unavailable for its five-stage tour in the retained App cases, with no public live care port. Agent/source/label rights, empty photo arrays, current-use source truth, notification queue versus delivery and payment/publication/Start separation remain unchanged.

## Executed commands and raw qualifications

`E` = own ignored `/Users/kanuj/.t3/worktrees/shelv/t3-ec5dc7be/.local-artifacts/w7-care-app-composition-r2/`. Every Node/npm invocation selects `PATH=/Users/kanuj/.nvm/versions/node/v22.23.0/bin:$PATH`; exact argv/cwd/start/end/exits are in per-command receipts and `checks-summary.json`. Root cwd unless stated. All browser commands are sequential, **`--test-concurrency=1`**, normal after/finally closure. Source/SSR and both strict types finish before browser acquisition.

| Command / scope | Actual result |
| --- | --- |
| Portal `npm ci --offline --ignore-scripts --no-audit --no-fund` | Exit0,130 locked packages; no advisory assessment |
| Source command below | **82/82**,0 failures/skips/cancelled,3.047s; `source.log` |
| Same Node flags on `E/source-independent.test.mjs` | **5/5**,0 failures/skips/cancelled,235ms; original assertions and bytes unchanged |
| Same flags on `E/source-extra.test.mjs` | **2/2**,0 failures/skips/cancelled,244ms; pending and v1 guard |
| `node E/input-plugin.mjs ssr-old`, then same flags with `--test-name-pattern='care direct first-read' E/source-independent.test.mjs` | Build0; **0/3 intended historical failures**,0 skips/cancelled,227ms |
| `node E/input-plugin.mjs ssr-current`, then both own source files | Build0; **7/7**,0 failures/skips/cancelled,466ms |
| Portal `npm run typecheck:rebuild`; `npm run typecheck:session` | Both exit0, zero diagnostics; original strict flags |
| Portal `npm run build:application`, clean pre-report source | Exit0; exact502 candidate provenance below |
| Same serial Node flags on `apps/portal/tests/rebuild-app-browser.test.mjs` | **19/19**,0 failures/skips/cancelled,28.555s; `app-browser19.log` |
| Same flags plus `--test-timeout=60000 E/browser-retained.test.mjs` | **17/17**,0 failures/skips/cancelled,10.975s; sole wait adaptation described above |
| Same flags/timeout on `E/browser-direct.test.mjs` | **6/6**,0 failures/skips/cancelled,5.203s |
| `W7_FROZEN_APPLICATION=1`, same browser-direct command | **0/6 intended historical retry failures**,0 skips/cancelled,4.566s; `browser-sensitivity.log` |
| Current browser-direct command, separate process | **6/6**,0 failures/skips/cancelled,5.236s; `browser-direct-repeat.log` |
| Original/source/input/configuration audits; report links/scope/whitespace | Verified before the report-only commit; runtime/test bytes unchanged |

```sh
node --experimental-strip-types --test --test-concurrency=1 \
  apps/portal/tests/rebuild-app-care-composition.test.mjs \
  apps/portal/tests/rebuild-app-care-render.test.mjs \
  apps/portal/tests/rebuild-app-ports.test.mjs \
  apps/portal/tests/rebuild-app-session.test.mjs \
  apps/portal/tests/rebuild-app-state.test.mjs \
  apps/portal/tests/rebuild-app-render.test.mjs \
  apps/portal/tests/rebuild-app-callback.test.mjs \
  apps/portal/tests/rebuild-app-start.test.mjs \
  apps/portal/tests/rebuild-app-preview-context.test.mjs \
  apps/portal/tests/rebuild-app-continuation.test.mjs \
  apps/portal/tests/rebuild-care-ports.test.mjs \
  tests/portal-care-contract.test.ts tests/portal-care-handler.test.ts
```

No current test setup failure was hidden or counted as sensitivity. The historical runs fail intended assertions, not obsolete locators. Original R1 initial mobile-menu setup failures and its corrected repeated RED remain preserved. Own metadata writing initially had a dict/string error and a cwd-relative path error; corrected before tests. Two context inventory names were absent and resolved with rg. A broad artifact-copy glob included earlier green recovery JSON in the old-input snapshot; those copies are preserved separately as explicitly non-RED leftovers. Actual RED receipts are only old-input error JSON/PNGs. Existing typeless-root-module/missing-root-Expo-base bundling warnings remain; strict frontend/session types pass without exemptions. `raw-qualifications.json` and `artifact-copy-note.json` retain these boundaries.

## Candidate, resource return and remaining gates

Fresh clean candidate: **sourceHead5029825a64b3ec63f14152e909b72d1e8095ef0c / sourceDirty:false / gatewayIncluded:false**,2,207 provenance inputs. Immutable provenance SHA **`ea8c887106ff68dc6f458f906f30dc3e19ee9ccd8a61abe56e1b7d823aabf9e4`**. Final current browser rebuild reproduces that identical receipt after the old-input sensitivity. It is a local candidate, not a deployment or genuine care result.

First browser tool was `preview_status`, no tab. The user explicitly granted the documented installed-Chrome workflow after parent release09:17:58.700372UTC; no collaborative tab was opened. All contexts use blocked service workers/background networking/DNS and finite `.invalid` interception. Only exact local application/public-sample assets are served; unexpected requests abort and fail teardown. No actual Auth, private credential or external service is used.

**Sole synthetic Chrome custody explicitly RETURNED `2026-10-31T09:27:08.367135+00:00`.** All own contexts/browsers/test handles closed normally. Fresh inventory09:26:57.805334UTC: **Chrome[] / workerd[] / owned Node tests[]**. Last live preview: **available:false, tabId:null**. No broad kill or later browser/DOM call. Subsequent image inspection reads local PNGs only. W6 still needs its separate explicit browser/R7 grant; this report grants none.

No actual Auth/Docker/PG/credential/R4/R5/R6/R7/native/helper/lifecycle/reset/resource call or polling occurred. Parent-attributed R7 Node93f015e8 at3a0e120,11groups/all13careactions, exact filtered8/3/1/1 and7issued/7closed/0/0 remain attributed, as do parent canonical57/35pgTAP796 and official SQL security0WARN/ERROR229. Parent Root57/native76 freeze is untouched; isolated W1 Phase2/M58 is separate child work, not this parent's source.

Not rerun: full portal1030/session171/root1213+18opt-in skips, root types/test-types/Expo/iOS, canonical reset/pgTAP/RLS/Storage, genuine Auth/Vault/Edge/PostgREST/browser, actual notification delivery, hosted checks or exact-head CI. Earlier full counts retain their18c evidence. Genuine care browser/new independent R7; W2 dependency-rebase UI; complete reports/conversations/guidance/history/amendments; sources/consent/templates; commerce/orders/returns/refunds; account/coverage/cancellation/final export; delivery/webhooks/inbox/retry; all five Maya/private walkthrough stages; full D01-D48/screens/V01-V17; human/accessibility/mobile/clinical/legal/license/business and release remain separately open.

Parent may integrate **only this report commit**, retain CA1's closure and all prior qualifications, then continue separately granted genuine-care verification and remaining modules. No full-goal or release approval follows.

## Evidence integrity

`E/source-audit.json` binds five imported originals, nine project/role files, eight original regression/helper files,57 portal source files and222 Root contract/migration/function files. Before/after checks confirm unchanged source and all48 foreign R1 files. Runtime, exact commands, adapter description, raw logs, DTO-DOM/PNG results, old-input receipt and release are retained. The **136-entry** evidence manifest excludes itself, this report and the later Git receipt. Manifest SHA **`74a62eea28781720097f8f55f4911014c5e90ed1d5a8d1c8a8e0cae3385c152f`**.

| Artifact | SHA-256 |
| --- | --- |
| source-audit.json | `df983cbcd0f5522eec368ef4bb84b6949ab1df6f3263d570c5e84ef67d5fa518` |
| browser-retained.test.mjs | `4d53f8824753c078a7c7a6a078aaa096c3b5ac1c2489d308c013efd65e399a37` |
| browser-direct.test.mjs | `8b201eb78cd7a8c6d5584f423a3410913d0759a0be1f9380cf1fc9012c808f1a` |
| input-plugin.mjs | `b72cf415f29174fc41061c774f758e3a6e2db404cff62cfed5eb4a2978e8a968` |
| source.log | `aa8024773bb39ed98c6c4cff9f6b905b82b8a1ab2ba69ec09438522125b5a535` |
| source-independent-repeat.log | `43249d7bfb361f5a03b9fa624ad028b1f9e5bce4264a27bffb7d75355f0b3df5` |
| source-sensitivity.log | `1ef341d93cbbff9fa272e7de48e7687eb9b1892f3d90e8dd187d4303080ec8a6` |
| app-browser19.log | `f708e001e9c7d7207ac57d167f044659c84bf01b37e9334fcc2d0040ebcb9a14` |
| browser-retained.log | `0689173d557c86a59aacc6d27a0da964e4ddd0127a257f93c7bae8528e2d6b37` |
| browser-direct-repeat.log | `c2d0ae72c03a3fc4fcb8e77deb5ebc5a000a99ebfec6788c37a84467279cdf43` |
| browser-sensitivity.log | `c82bc5fe71a84f3497f25b01f85c6a1c2db15e0240503691f7b20724041e2f0d` |
| release.json | `0a92bb9d2f2d0ae8f0dfb93de0349edd435cf4fdefa8ef8400a26786164ce75c` |

Final links, listed hashes, manifest, unchanged runtime/test source, sole tracked path and `git diff --check` are checked before commit. The containing report-only SHA is returned in the handoff.
