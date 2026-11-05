# W7 independent care client and v2 composition review

Owner: Kanuj. 31 October 2026. New report-only review at exact **`5f59b72623c63a968e2068b703628e882f968bd4`**. No nested agents or production fixes.

## Separate verdicts

- **Specification: CHANGES REQUIRED, CU1/P2 and CU2/P2.** Entered optional notes disappear behind success for Start/new-descriptor creation; full amended using-differently reports omit their stored corrected frequency and amount.
- **Correctness / quality: CHANGES REQUIRED for those two bounded UI defects.** The unchanged focused130, foundation/controller/navigation47, session171 and independent18+8+2 pass. The three intended finding assertions fail again in a separate final run. Passing counts do not override the reproduced defects.
- **Parent typed composition and exercised recovery: scoped PASS.** Real application/session/cookie/care-port/Root-mapper/controller execution preserves fetched object identity, v2-only rereads, exact uncertain requests, current fetched review basis and operation ownership in the exercised cases. Current application remains v1; this review does not activate care.
- **Genuine care / backend / full portal / release: NOT ESTABLISHED here.** No R6 access, genuine API call, Auth/SQL/alert/outbox/finance effect, deployment or live action was performed.

CU1 was promptly reported and explicitly accepted by the parent as P2. Parent allocated a later W3 UI-only correction, with no Root DTO extension. CU2 was promptly reported separately. Both remain open **at this reviewed head**, regardless of later work elsewhere. This reviewer neither fixes nor rebases them.

## Exact source, task, runtime and ownership

| Item | Actual evidence |
| --- | --- |
| Workspace / branch | `/Users/kanuj/.t3/worktrees/shelv/t3-ccbf1213` / `t3/review-care-use-ui` |
| Clean starting and tested head | `5f59b72623c63a968e2068b703628e882f968bd4`; runtime/test source stayed unchanged throughout review |
| Parent / project | Live thread readback: `d632030a-18f7-4dec-a2c9-f5c0418c3fd5` / `ac0af19d-d404-4f53-a870-02bfd76c2a80` |
| Assigned round | `portal-rebuild-w7-care-client-review-20261031-r1`; parent-owned task correlation has this suffix after `node:delegated-task:command%3Amcp%3A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%3Adelegate-task%3A` |
| Actual child thread | `thread:delegated-task:command%3Amcp%3A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%3Adelegate-task%3Aportal-rebuild-w7-care-client-review-20261031-r1` |
| Actual run | `run:thread:thread%3Adelegated-task%3Acommand%253Amcp%253A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%253Adelegate-task%253Aportal-rebuild-w7-care-client-review-20261031-r1:ordinal:1` |
| Git freshness | Actual status/log/instructions and successful `git fetch origin main`; `origin/main=d39a7d4943209080df7c4cf97d85784f462758bf`, divergence136/0. No reset, checkout, cherry-pick or rebase |
| Final W3 author / integration | `6b264169c0cf4cc286a60b0244fa17e9200cabe6` / `5f59b72623c63a968e2068b703628e882f968bd4`; feature, owned tests/helpers and full author report match exactly |
| Early seam author / integration | `795a90cc` / `3a65498a`; eight early paths retained, then exactly20 paths in the final integration delta, including its report |
| Already-present parent composition | `dbdec5c250a4835ddb390624024cf650f573882e` and `c8de1bd2b6492c4a5761edb6effe6a127e0981bc`; not duplicated or attributed to W3 |
| Backend source / disposition | f69999a2 includes author957b7ac CB1/CB2 corrections; independent report authorabaecac, integrated85a2f543, records its separate scoped PASS. Not rerun here |
| Live model gates | Both `orchestrator_capabilities` and `t3_thread_configuration`, initially and after browser release: **codex / gpt-6.1-sol / reasoningEffort=xhigh / serviceTier=default**, full-access/default interaction |
| Supported descriptors | Reasoning low/medium/high/xhigh/max/ultra, catalog default low; service default/priority, catalog default default. Effective xhigh/default explicitly selected |
| Actual configuration | Global selection, project model/subagent defaults and all eight role TOMLs parse as Sol/xhigh. Roles w0_foundation, w1_plan_platform, w2_advisor, w3_client_plan, w4_checkins_history, w5_orders, w6_account_service, w7_verification checked and hashed |
| Node / install | Explicit `/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node`, verified **v22.23.0**. Every Node/npm command prepends that directory. Portal-only locked offline install130 packages; no root install, package/lock/configuration edit or relaxed compiler flag |

Only this report is newly authored in tracked files. Its report-only containing commit is returned in the final handoff; it is a child of the exact tested head. Coordinator owns status, acceptance, TASKS and CONTEXT_SYNC updates. Ignored probes/screenshots/logs stay in this own checkout.

Resume reconciled actual Git/status/log/AGENTS with older prospective status prose. Read the **complete W3_CARE_USE report**, original W3_VERTICAL_CLIENT, W3_FIXES, W3_CONFLICT_PREVIEW, W3_RECOVERY_FIX, original W7_CLIENT_REVIEW/R2/R3/R4 and their boundaries; CARE_API_V1, COORDINATOR_CARE_TRANSPORT, W1_CARE_IMPLEMENTATION, W1_CARE_FIXES, W7_CARE_BACKEND_REVIEW/R2, W7_NATIVE_BROWSER_REVIEW, W7_APPROVAL_RECOVERY_REVIEW and W7_STATUS_RECOVERY_R2. Original objections retain their qualified dispositions.

Read the full95,388-byte [approved original](../source/APPROVED_INPUT.txt) in bounded ranges, including all desktop/D01-D48/full26-manifest appendices; [contracts](../IMPLEMENTATION_CONTRACTS.md), [acceptance](../ACCEPTANCE_MATRIX.md), [workstreams](../WORKSTREAMS.md), [status](../CURRENT_STATUS.md) and portal UI policy. All five original byte counts/hashes match INPUT_PROVENANCE. Older status lines saying the early forms are incomplete and describing old fixture custody are stale against actual Git and this task's explicit newer boundaries; they confer no fixture access.

Inspected the complete new UseReport/useModel/care/UseFacts/ReportedProducts, ClientPlan/model/content/styles/types/exports, DecisionControls/reviewBasis, unchanged unpublished adapter, all new tests/helpers, original regression cases, actual parent client-state/care-ports and adjacent session/transport/navigation/strict mapping. Production feature code imports no app/Auth factory. Actual Application constructs default v1 ports/controller without care activation.

## CU1 / P2: optional notes are accepted and silently omitted before whole-report success

**Owner:** W3 UI. **Requirements:** D16/D30/D32, honest report acknowledgement and preserved entered work. **Source:** [UseReport.tsx](../../../apps/portal/src/features/plan/UseReport.tsx), makeCommand38, step selection81, unconditional field98 and success101; [useModel.ts](../../../apps/portal/src/features/plan/useModel.ts), change22.

Two independent actual-browser reproductions, using the real application session/cookie/care port/Root parser+mapper/parent controller:

1. `/plan/products/ordinary-azelaic-10/use`: yes -> started earlier -> date not known -> enter `W7_SYNTHETIC_NOTE_NEEDS_RECORDING` in **anything we should know? (optional)** -> record start. Identity and Start succeed and current v2 rereads. UI displays **use report recorded**, with the note still visibly entered. The entire captured identity/use wire and fixture history omit that marker. `captureUse` emits only `{kind:'started'}` for Start, discarding details.
2. `/plan/use`: enter a new unreviewed product and the same optional note -> record change. UI displays the same success. The only write is `report_unreviewed_product_v1`; its pinned shape has no note. Step selection correctly avoids another initial unreviewed event, but consequently never transmits `capture.change.details` either. Nested initialUse has null details. No Start or fake product is needed to reproduce the loss.

The independent intended assertion is that accepted notes must reach a write before whole-report success. Initial run **0/2**, then both fail again in the final separate-process three-case finding run. Failures are the intended missing-data assertions, not setup/selector/network errors. Original log and final raw wire/history/DOM screenshots are retained and hashed below. The final JSON/PNG receipts contain the repeated run's actual generated UUIDs.

This is UI data loss before HTTP, **not a database loss or an invitation to add unsupported Root fields**. Parent's subsequent explicit instruction accepts CU1 and allocates a UI-only correction: unsupported started/create-unreviewed note entry must not be accepted/discarded or imply all input was recorded. Preserve queued notes across action changes/recovery; any later API extension needs separate allocation/review. Do not add a duplicate initial event/outbox merely to carry a note.

Positive controls pass for supported pause, stop and different details, including a note entered while on Start and then switched to a supported action before submission; interrupted identity acknowledgement/status recovery keeps the note locked and resumes the actual next CAS step. Existing reported-product pause preserves its exact descriptor UUID/version and note without creating another product. These controls do not close unsupported notes or certify a future existing-reported `unreviewed_added` correction flow.

## CU2 / P2: loaded current corrections omit their actual frequency and amount

**Owner:** W3 shared use/history rendering. **Requirements:** D30/D32 and CARE_API's full original plus separately attributed amendment. **Source:** [UseFacts.tsx](../../../apps/portal/src/features/plan/UseFacts.tsx), current-correction branch24 versus original ReportBody29.

Independent strict input: a CeraVe pause original, then a legal amendment whose replacement is `different`, with separate known frequency `W7_CORRECTED_FREQUENCY`, known amount `W7_CORRECTED_AMOUNT`, details and reason. Actual current v2 and full history pass Root `mapCareResult`; the browser uses the actual cookie port and fetches the original report's exact product reference.

Open CeraVe details -> **view original report**. Original pause, correction reason, kind, details and time appear, but **neither corrected frequency nor corrected amount appears**. The original renderer knows how to render both fields; the correction branch prints only kind/details. Once full body is loaded its detail-loading control disappears, so there is no further path to those values in this selected report reader.

`amendment.test.mjs` fails its intended full-current-correction assertion **0/1**, repeated in the final three-case run. Raw strictly decoded HTTP data plus DOM text and screenshot are retained. The source/server retains both fields; this is a client projection omission, not a claim that the event or correction was overwritten. A bounded correction can share the complete change-body presentation for originals and replacements, including known/unknown frequency/amount. No Root/SQL/DTO extension is needed.

A separate product-changing amendment control passes original-body/current-correction separation and reads via the **original** publication/slot, rather than the effective product metadata. That passing control is narrower than full correction fidelity and does not override CU2 or claim global W4 history/amendment authoring acceptance.

## Retained findings, state semantics and independent checks

| Boundary | Fresh observation / qualification |
| --- | --- |
| Original F1-F3/F6-F7 | Unchanged58 regression cases pass: professional pause/exclusion and reasons remain visible, actual use stays separate, guide-free/optional/full canonical directions survive, all eight decision kinds retain correct choice vocabulary, all seven rich Maya cards/guides/cautions/comparisons/source imagery remain covered. No clinical advice was added or reviewed |
| F4/F5, R2 and original R3-1/R4 | Original regression cases pass without weakened gates. A rejected mutation retains attempted intent; failed/pending/unmounted reads cannot acknowledge unseen content. Real v2 controller preserves fetched object reference after strict decoding/canonical equality, plus version/decisionRevision/use-head/session/mode/renderer/epoch checks. Current successful fetch plus deliberate same-head active reread is required |
| New DecisionControls busy variant | Checked-in actual-controller retry test passes. Two further independent reviewLatest overlaps pass with old success and old error/finally before a held current read. Current handler cannot launch an extra read; only current completion applies and deliberate reread unlocks. Original PendingReview remains unchanged |
| Care operation ownership | Independent old write success/error/finally while a newer exact retry is pending cannot apply a view or release its lock. The actual captured React handler is invoked again while pending: no third write. Exact first/retry wire equality and one reducer event retained |
| Status/ack/read semantics | Independent403/409/503, absent and malformed status preserve original UUID/payload/uncertainty. Positive committed status requires strict command receipt and v2 reread. Malformed wrong-product/publication/schema and stale-head post-ack reads remain uncertain; retry uses exact original bytes. Checked-in post-ACK current-read409 remains a read error, not original write rejection |
| No / not sure multi-step | Independent no and not-sure: identity -> create -> reported identity -> use with heads0/1/2/3. Uncertain descriptor halts after partial completion, then committed status resumes with actual server UUID/version. No entire-flow saved claim at partial completion; no finance or PlanContent insertion |
| Actual-use normalization | Focused paused/stopped/different/unreviewed/contradictory cases suppress unqualified continue; professional pause/exclusion still displays its reason despite contrary actual use. Known Start survives stop captions; unknown Start can use authored guidance without elapsed stage/automatic advance. Explicitly started reported products remain unreviewed, with real unknown date. Null latest review invents no panel |
| Publication / namespace | Same-ID exact-tuple carry and changed-descriptor contradiction are server-supplied states, not UI authority. Focused carry keeps original publication/slot for details; other IDs do not alias. Coincident plan/reported strings refuse ambiguous writes. Selected reported routes use their actual descriptor sheet, no dummy PlanProduct |
| Pagination / history | Independent changed-head reported page409 leaves current state intact and performs no write. Two history pages use the summary's exact original publication/slot. Product-changing amendment original and correction bodies remain distinct; CU2 qualifies full detail fidelity |
| Mode / preview / capability | Focused historical/read_only/advisor-preview/public-demo/private-walkthrough paths receive no live care writes even with real supplied port. Explicit unpublished adapter discards malicious live props and fabricates no publication/time/entitlement/use. Port-absent v2 reports unavailable. v1 default is preserved; confirmed v2 never silently falls back |
| Session / privacy | Actual cookie owner/CSRF replacement and held responses, logout and expired deadlines remove old private form content. Unsent answers remain session memory, absent from URL/history/localStorage/sessionStorage. Expired restore correctly rejects. These are finite HTTP/cookie/session tests, not genuine Auth revocation evidence |
| Photo / identity | yes/check, no/x, not-sure text bind the visible selected product. Identity remains a client report, separate from formula authority. Unknown metadata is not none. No upload affordance, fake signed URL or uploaded success; actual commands carry labelPhotoIds[] only |

Original F8/Q1/Q2 remain scoped addressed through fresh original keyboard/history/opener/focus/scroll and geometry cases. A new route/mode does not erase uncertain intent or create a fresh automatic mutation. The source audit confirms **all original58 tests/helpers unchanged from284c04e**. No old objection was reopened without a new source-backed reproduction.

## Native design and actual visual scope

Read Figma design-to-code guidance **before** fresh get_design_context calls. Read-only Figma session **`bf6788af-f82b-49b9-8508-ddea3b8cf23d`**, file **WGbMylNV4rPoMw3r0nceaw**, C07 **499:584**, C07C **503:1174**. Both returned high-fidelity code/context and screenshots, which were inspected. No Figma write or asset generation. W3's earlier session46004a14 remains author evidence, not this session's identity.

Verified16 retained contexts/PNGs for C01/C01E/C02/C02D/C03/C03D/C07/C07C plus all four catalogued product assets: **20/20 exact hash matches**. Native CeraVe asset SHA`af135b13a07dd0ab5e24e0c297ffd2243a85a65fb6d2bcaa7604fe707aef719d`; azelaic SHA`118d93c1ad24efd48090a9e91d246eb87567471db99024b9eb9b89a8ae535df1`. These references are not runtime screenshots/assets.

Fresh actual screenshots from the unchanged checked-in suite were compared with native C07/C07C and retained C03D. C07/C07C main **(264,214,744)**, context **(1032,214,368)**, image **88x112**; C01 main **(264,196,744)**; C03D main **(264,162,736)** and context x1024/width376. Actual1440/1280/390/320 geometry/reflow assertions pass. Inspected actual C07, C07C1440/390/320, C03D v2, long320, long CSS zoom and both findings' actual UI. Source-length names/guidance, truthful not-recorded acquisition and unavailable review date legitimately differ from shortened staged frames. Dynamic original public product images remain data-bound, with shared wrappers/tokens/Lucide/lowercase authored UI and preserved proper identities. No parallel UI, global casing or screenshot-as-runtime implementation.

Fresh checked-in keyboard tests use Tab/Enter/Escape, actual selected-date error/focus, Back/Forward, retained unsent work and real routine opener restoration. Independent long1440/390/320 cases retain controls and no horizontal page overflow. **200% CSS zoom evidence is only a mechanical control-visibility/no-page-overflow check:** the extreme long-text CSS-zoom screenshot still squeezes columns and wraps labels heavily. It is not comfortable-layout, native browser zoom, WCAG, screen-reader, physical-mobile or representative-human acceptance. No such broader claim is made or inferred from green assertions.

## Exact executed verification and raw qualifications

All Node/npm commands use `PATH=/Users/kanuj/.nvm/versions/node/v22.23.0/bin:$PATH`. Commands below run from repo root unless stated; artifact prefix `E` means this checkout's ignored `.local-artifacts/portal-rebuild/w7-care-client/`. All browser files ran serially with `--test-concurrency=1` and normal teardown.

| Command / check | Actual result |
| --- | --- |
| Portal cwd `npm ci --offline --ignore-scripts --no-audit --no-fund` | Exit0;130 packages; no advisory assessment/upgrade or lock/config change |
| `node --experimental-strip-types --test --test-concurrency=1 apps/portal/tests/rebuild-plan*.test.mjs apps/portal/tests/rebuild-use*.test.mjs apps/portal/tests/rebuild-care-plan-model.test.mjs apps/portal/tests/rebuild-care-ports.test.mjs` | **130 pass/0 fail/0 skip**,70.161s; `focused.log`: legacy58 + new60 + parent12, overlapping the author's980 total |
| Same serial Node flags on `E/independent.test.mjs`, plus `--test-timeout=60000` | **18/18**,0 skip,14.072s; `independent-final.log` |
| Same serial Node flags on `E/adjacent.test.mjs` | **8/8**,0 skip,7.958s; `adjacent.log` |
| Same serial Node flags on `E/decision-review.test.mjs` | **2/2**,0 skip,2.659s; `decision-review.log` |
| Same serial Node flags on `E/loss.test.mjs` | **0 pass/2 intended fail**,0 skip,3.560s; `loss.log`, CU1 |
| Same serial Node flags on `E/amendment.test.mjs` | **0 pass/1 intended fail**,0 skip,2.083s; `amendment.log`, CU2 |
| Same serial Node flags on both finding scripts together | **0 pass/3 intended fail**,0 skip,5.237s; `findings-repeat.log`, separate actual browser processes |
| `node --experimental-strip-types --test --test-concurrency=1 apps/portal/tests/rebuild-foundation*.test.mjs apps/portal/tests/rebuild-app-state.test.mjs apps/portal/tests/rebuild-care-navigation.test.mjs` | **47/47**,0 skip,11.851s; `foundation.log` |
| `npm --prefix apps/portal run test:session` | **171/171**,0 skip,40.848s; `session.log`. Existing isolated Miniflare/canned-provider/browser tests, no genuine care stack |
| Portal `npm run typecheck:rebuild`; `npm run typecheck:session` | Both exit0, zero diagnostics; strict/noUncheckedIndexedAccess flags unchanged |
| Portal `npm run build:rebuild`; `npm run check:ui` | Both exit0; new-source semantic CSS guard and retained11-sheet check; no budget change |
| Portal `npm run build:application` before report creation | Exit0; provenance **sourceHead5f59b726 / sourceDirty:false / gatewayIncluded:false**. Isolated candidate, no activation/cutover/deployment |
| Input/source/role/native audits; `git diff --check` | Pass. Exact author correspondence, original58 unchanged and clean source confirmed; final report-only scope checked before commit |

Counts overlap; **do not sum them into acceptance**. No full980 duplication was needed after focused130, targeted independent coverage and the requested supporting gates. Author980/171/60, earlier direct-controller50, red/green and raw earlier count corrections remain attributed to W3 at their recorded source. This review does not claim to have rerun those author REDs or their full980.

Raw reviewer setup faults are retained: `independent-initial.log` has12 passes/2 locator failures/1 cancelled file timeout. It queried retry after the form correctly entered saving; corrected probe captures the actual handler before submission and uses a sufficient file timeout. `independent-intermediate.log` has15 passes/3 diagnostic failures: two arbitrary cursors were rejected **before egress** by the real strict parser; the deadline probe failed to catch the expected expired-restore rejection. Corrected only the probe to use the pinned cursor format and expect rejection. Final18 passes with all intended state/wire/ownership assertions retained. No production changes or weaker gate resulted. These setup failures are not findings or passing acceptance.

Known warnings: root MODULE_TYPELESS_PACKAGE_JSON during type-stripped imports and absent root `expo/tsconfig.base` during retained bundles. Actual strict frontend/session compilers pass. No root install, flag relaxation or dependency warning converted into a product defect. No source-sensitive data or real credential was used.

## Resource release and remaining gates

First browser tool was `preview_status`, no attached tab. The user explicitly granted the named repository installed-Chrome finite-interception workflow, so no alternate browser or preview tab was opened. Actual source runs with StrictMode, blocked service workers/background networking/DNS, finite `.invalid` HTTP and original public-sample assets fulfilled from local bytes. Unexpected traffic aborts/fails teardown. The browser harness preserves real actor/session/cookie/mapper/controller logic; HTTP DTO delivery and reducer persistence are controlled. Older direct-React tests remain component evidence, not actual app/genuine acceptance.

**Chrome explicitly RELEASED `2026-10-31T06:53:36.929986+00:00`**, immediately after the final finding repetition and before long report writing. All contexts/browsers/Miniflare/test handles terminal. Fresh executable inventory: **Chrome/Chromium/workerd[] / owned Node tests[]**; final live preview **no tab**. Parent notified with an explicit release. No broad kill or browser/DOM call follows release; later image inspection reads local files only. Later parent activity is outside this observation.

No Docker/PG/reset/pgTAP/Auth/R6/R4/R5 credentials/helper/lifecycle, genuine API, actual source upload, care SQL/DB alert/financial/outbox mutation or provider delivery was accessed. Parent-attributed newer gates remain distinct: actual56 reset,34 pgTAP/772 assertions, Root1213 pass/18 existing opt-in skips/0 fail plus root types/Expo export. They are **not this review's executions**. Backend R2 scoped PASS does not close CU1/CU2 or accept browser care.

Full approved D01-D48/26 screens, genuine care owner/human/negative journey, canonical/authorization/source lifecycle, global history/amendment authoring, source uploader, remaining commerce/account/notifications, all five Maya stages/private walkthroughs, full accessibility/human/clinical/legal/license/business clearance, exact-head CI and release remain separately owned gates. Default application v1 stays unchanged until genuine care acceptance and an authorized atomically composed activation. No push/PR/merge/deploy, real client/source/permission action, communication, money or retailer order.

Parent should integrate only this report commit, allocate the bounded W3 UI corrections, preserve exact repros and prior objections, and commission a **new** independent round against the next integrated head. No hidden fix, current-head acceptance or full-goal completion is implied.

## Evidence integrity

Ignored evidence root is `E` above. `source-audit.json` binds every feature file, source correspondence, original input/configuration and owned path lists. `native-hashes.json`, runtime-initial/final, clean application provenance, all scripts/logs and fresh screenshots are retained. `evidence-manifest.json` inventories final files and selected checked-in-harness outputs, excluding itself. Selected SHA-256 receipts:

| Artifact | SHA-256 |
| --- | --- |
| `loss.test.mjs` | `94dcd390899094d0eb3ffc7d0c4b5cc9ec82c56f19d0497939404fae1b719126` |
| Initial `loss.log` | `52b9fe6e2d4b8d54bcb623e78ccad44f14f99688af531f0dade47b00d0b0e992` |
| Repeated Start raw `loss-start.json` | `2512447aac7e72a8bd5025094190e01488470a733855c3a13a4a192013c24acd` |
| Repeated Start UI `loss-start.png` | `f6606c166a7ee915fdbaeda0a8e7f73f9669a9c83e8918ca3202e0bc3fa23e42` |
| Repeated creation raw `loss-unreviewed.json` | `0fc022cb2448986af331f67c15a3f94fa298e563874a137c5958c479b47bf8b1` |
| Repeated creation UI `loss-unreviewed.png` | `c1ce30fbbe81ce02a5f0260026ff25d5dac69b5cdf6947d5c535203949155f4a` |
| `amendment.test.mjs` | `22d36dccb9c0007b9fc4b6165be9937e6a62c73afdc23bc35746b398bd908a99` |
| Initial `amendment.log` | `ec03a0a492f268d37980e667480420c41b6ac02fbae0c92f0e578101e72a8629` |
| Repeated correction raw `amendment-correction.json` | `e860eef0ada419340ccd90ff882f6c201ed8a420be2ede7a2f8091514383cd51` |
| Repeated correction UI `amendment-correction.png` | `ada8c0d7821b1ddfe0f55b1f8ffcdec5419d15e140a9627e17f98066c896720d` |
| `findings-repeat.log` | `4f03bb66eb64703019ca6fad2400fd1d59b2242924a0fa5b7d5ac89b53fc9b99` |
| `focused.log` | `74c01f69d7d08c640e97cd5cbcc6870e7ac0bbd29152ab5fed005491b37fdeae` |
| `independent-final.log` | `b120da4931b58dd3c35300b083905e86daa4ce0451e16ef4ab317c30c95af282` |
| `adjacent.log` | `e1dfe9ccb9ee489b82cb14c6685b503de1798b0a51d22569eda09745a1e372d0` |
| `decision-review.log` | `ab350bc3b8608349aa6ed9e1938e2455b6b55a14f6fd02cc0cdee6d3ab9f7f4d` |
| `foundation.log` | `8cebfda042fd1dcb52d366e2582de76f9263a4fd808df940016c6524ad77957b` |
| `session.log` | `1ebd0c5d3eac745642846ca0f8965691db09e24000155726f95e368343bbaf61` |
| `release.json` | `f0ef965a1a5ad58f1120495bd1978755d4e1138bb4ab4b28fb27021825c57b41` |

Final75-entry evidence-manifest SHA-256: `6145bc5ff86a80ea25230418de11f58fd14057ef0392fb1813f3b4d40cd4a3e7`. Report links, all18 listed artifact hashes, unchanged feature hashes and report-only tracked scope were verified before commit. No application/test source changed after execution.
