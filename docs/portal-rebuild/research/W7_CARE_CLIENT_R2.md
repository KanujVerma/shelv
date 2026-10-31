# W7 independent care client review, round 2

Owner: Kanuj. 31 October 2026. Report-only review of exact parent **`54623e9145d28df4e749fb3502db9c33f18efe7a`**. No nested agents or production fixes. Chrome returned before report writing.

## Separate verdicts

| Subject | Specification | Correctness / quality |
| --- | --- | --- |
| Original CU1/P2 accepted unsupported notes | **ADDRESSED within the pinned UI contract** | **PASS**: unsupported fresh input is absent/refused, switched drafts survive, supported notes persist, and legacy captures qualify incomplete notes without changing exact pending requests |
| Original CU2/P2 omitted corrected frequency/amount | **ADDRESSED** | **PASS**: unchanged original reproduction is green; known/unknown corrected frequency/amount and original/replacement separation pass |
| Selected full-report correction attribution | **CHANGES REQUIRED, new CU3/P2** | Current correction never identifies its own actor. Two intended assertions fail, repeated independently, while both actual strictly decoded actor values remain intact |
| Parent composition and exercised recovery | **Scoped PASS** | Fresh focused153, independent22, retained28, foundation47, session171, Root18, strict types and builds pass. These results do not override CU3 |
| Genuine care/browser, default application activation, full portal and release | **NOT ESTABLISHED** | Default Application remains v1. No genuine API, R6, SQL/Auth or live action was exercised here; CN1 remains separately open |

The original [R1 review](W7_CARE_CLIENT_REVIEW.md) remains frozen at parent5f59b726 and W3 source6b264169. Its three intended failures remain historical evidence. This review closes their precise CU1/CU2 mechanisms against the new integrated fix, while reporting the adjacent attribution omission separately. CU3 predates this fix; it is not alleged to be a regression introduced by baee3033.

## Exact workspace, source, runtime and ownership

| Item | Verified evidence |
| --- | --- |
| Workspace / branch | `/Users/kanuj/.t3/worktrees/shelv/t3-7db09590` / `t3/review-care-client-round2` |
| Clean starting/tested source | `54623e9145d28df4e749fb3502db9c33f18efe7a`; runtime/test source stayed unchanged throughout |
| Assigned task | `portal-rebuild-w7-care-client-review-20261031-r2` |
| Actual child thread | `thread:delegated-task:command%3Amcp%3A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%3Adelegate-task%3Aportal-rebuild-w7-care-client-review-20261031-r2`, returned by both live tools |
| Fix author / integration | `baee3033afab3bcef7b20c68d48c0dc76f0f391f` / `9c32c56c`; exactly three production files, four new test/helper files and W3 report |
| Receipt author / integration | `6944690900640edbd643030c394e30b5a6a892b0` / `bc8b9423`; current W3 report matches this receipt exactly |
| Source correspondence | All seven fix runtime/test files match baee3033 exactly. The original58 tests/helpers match284c04e. No old assertion was edited |
| Parent controller | Current `client-state.ts` equals c8de1bd2. dbdec5c/c8de1bd strict v2 mapping, `sameCareValue`, original supplied object identity and fetched-basis/epoch semantics remain |
| Git freshness | Resume ran actual status/log/AGENTS; successful `git fetch origin --prune`; main remains `d39a7d4943209080df7c4cf97d85784f462758bf`. No reset/rebase/import/other-worktree write |
| Live runtime, before and after browser phase | Both `orchestrator_capabilities` and `t3_thread_configuration`: **codex / gpt-6.1-sol / reasoningEffort=xhigh / serviceTier=default**, full-access/default interaction |
| Advertised descriptors | Reasoning low/medium/high/xhigh/max/ultra, catalog default low; service default/priority, catalog default default. Effective xhigh/default explicitly selected |
| Actual configuration | Global selection checked; project model/subagent defaults and all eight role TOMLs parsed and hashed, pinning Sol/xhigh. No nested delegation |
| Node / dependencies | Explicit `/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node`, verified **v22.23.0**; every Node/npm command selects that PATH. Portal-only locked offline install130 packages. No root install, dependency/configuration/flag/budget edit |

Only this report is newly authored in tracked files. Its containing report-only commit is returned in the handoff, as a child of the tested head. Coordinator retains canonical status, acceptance, TASKS and CONTEXT_SYNC ownership.

Read the complete original care-client review and complete W3 care report, including both CU responses and receipt; CARE_API_V1, COORDINATOR_CARE_TRANSPORT, care implementation/fix response, implementation contracts, acceptance, workstreams/status and UI policy. Read the full95,388-byte approved input in bounded ranges, including desktop/D01-D48/full26-manifest appendices; all five imported byte counts/hashes match INPUT_PROVENANCE. Revisited original W3/client F1-F8/Q1/Q2/F5/R3/R4 and responses, native/product-free H1/H2, AR1 and status-R2 qualified dispositions. Older prospective status text does not override current source or grant fixture access.

Inspected all three changed production files in full, the surrounding plan renderer/model/content/review basis/preview/modes/types/exports, actual care port/controller/session/captured transport and complete Root care DTO/parser/mapper/value modules. Root care metadata still has13 finite actions; session metadata equality/size-cap tests pass. `started` remains kind-only. New descriptor creation still has no details field and one nested initial unreviewed event. UI fix integration changes no Root DTO/action, gateway, SQL, auth/session, shared routes/UI, dependency or source asset.

The author branch's earlier Root inputs differ from this parent in UUID canonicalization, dependency UUID handling and nested initial-use amendment mapping already integrated by W1. These are not CU fix edits. Current Root contract/handler files contain **18** tests, rather than the older author's15. The review uses the actual current Root unchanged and never relaxes mapping to satisfy an old probe.

## CU1/P2 disposition: ADDRESSED

[UseReport](../../../apps/portal/src/features/plan/UseReport.tsx) and [useModel](../../../apps/portal/src/features/plan/useModel.ts) now agree on note capability. Fresh Start today/earlier and new-descriptor `unreviewed_added` offer no notes field. Capture refuses nonempty unsupported notes. This is the authorized bounded UI response, not permission to widen Root or manufacture a second event.

Fresh independent actual-renderer checks cover all three unsupported paths: absence of an accepting field, deliberate supported submission, strict wire action sequence, exact heads and expected event count. Start uses identity plus kind-only use; new descriptor uses one creation with nested `unreviewed_added.details:null`, no duplicate use event. Paths remain `/api/client/care` and photo arrays empty. No note is accepted then silently omitted behind success.

Typed mixed-case notes switched from pause to Start/new unreviewed creation remain in labeled read-only **unsent notes**, block submission, survive plan navigation/remount, and return unchanged when a supported action is selected. Explicit keyboard removal is local; subsequent unknown-date Start creates only the proper identity/use facts. No localStorage/sessionStorage or sensitive URL/history state is introduced.

Paused/stopped/different notes reach the captured HTTP body and immutable synthetic history. Committed-but-malformed acknowledgement, denied status read, navigation and exact retry preserve details and original wire bytes; one use event remains. Different-use known/unknown fields are exercised. Existing reported `unreviewed_added` uses the actual UUID and **version7** directly, without another descriptor or PlanContent product. The durable author tests independently cover ordinary version1, legacy Start and all supported change kinds.

Legacy pre-fix captures remain immutable while uncertain. Own injected historical creation captures test status403/409/503/absent and post-ack current-read409, remount and exact replay. Status failures remain reads, not rejected original mutations. Normal actual cookie restore is required after503. Final receipt/current read preserves one creation/head/event, retains the note visibly and shows **notes not recorded**, without **use report recorded**. Explicit removal after resolution sends no mutation. SAVED and SAVING-restored captures, mode return and actual owner replacement are covered; private memory ends on real boundary replacement. Partial identity acknowledgement does not imply whole-flow success or silently unlock field editing.

The original `loss.test.mjs` is now historical: its fresh Start/creation textarea locator is intentionally absent. Its unchanged current setup failure would not prove remaining note loss. Preserved original bytes/logs/JSON/PNGs were copied from the read-only R1 checkout and hashed. A separate historical-input copy changes only its harness import/output prefix, keeps original intended assertions, and runs against ignored frozen6b production inputs: **0/2**, both intended missing-wire-note failures after actual success, not missing locators. Current acceptance uses valid absence/retention/positive-persistence assertions.

## CU2/P2 disposition: ADDRESSED

[UseFacts](../../../apps/portal/src/features/plan/UseFacts.tsx) now composes the same `ChangeBody` for original and current correction. The **byte-identical original amendment script**, copied into this checkout at the same relative depth, passes unmodified within the153-case run.

Four new independent product-changing cases exercise known/known, unknown/known, known/unknown and unknown/unknown corrected frequency/amount. They require original details/frequency/amount before the correction heading, separately corrected reason/details/frequency/amount/time afterward, original client/advisor recorder/channel/date and corrected unknown occurrence, with no original usage marker relabeled as replacement data. Strict history requests use the **original publication/product/slot**, even when the effective product is different. Existing stopped-amendment and same-product controls pass. CU3 below qualifies attribution, not this closed frequency/amount mechanism.

Input-only sensitivity bundles the exact three `git show 6b264169:...` production files under `frozen6b-` names through an ignored esbuild input plugin, with all current app/session/ports/Root dependencies and intended assertions retained. Production files are never overwritten. Three field-absence and four correction-body assertions are **0/7 RED** at frozen inputs, then those same assertions pass inside the current22 run. Final historical sensitivity was rerun serially.

## New CU3/P2: correction actor is lost from the selected full-report presentation

**Owner:** W3 selected report reader; coordinator integration. **Requirements:** D12/D30/D32, desktop history attribution, and CARE_API's separately attributed original/correction. **Source:** [UseFacts.tsx](../../../apps/portal/src/features/plan/UseFacts.tsx), lines22-24. Original attribution uses `reportedBy/recordedBy`; correction summary prints only time/date, and loaded correction prints reason/change/time. Neither branch reads `amendedBy`.

Independent actual-browser reproduction, `E/attribution.test.mjs`:

1. Strictly map a CeraVe pause originally reported by the synthetic client and recorded by a different advisor on a call. Add a legal-shaped using-differently amendment with distinct reason, known frequency, unknown amount and correction time.
2. First use the **client** as `amendedBy`; in a separate case use the already attributed **advisor recorder**. All other current/history data are identical. Both pass the actual Root positive mapper and actual cookie/care-port/controller path.
3. Open CeraVe details and **view original report**. Original client/advisor/call attribution appears. Current correction shows its reason, body, frequency, unknown amount and time, but no actor attribution.
4. The two full visible report texts are **identical**, despite strictly retained different `amendedBy` values: client `11111111-1111-4111-8111-111111111111` versus advisor `33333333-3333-4333-8333-000000000911`.

Both intended actor-identification assertions fail **0/2**, then **0/2** again in a separate serial process. These are intended content failures after successful loading, not setup, locator, permission or network failures. `actor-client.json`, `actor-advisor.json` and both screenshots retain decoded HTTP inputs and actual DOM. The loaded-detail button disappears normally; there is no further actor-reveal control in this reader. Full DTO values remain intact. This is UI provenance omission, not stored amendment loss, a cross-client leak or a backend authorization claim.

The client cannot distinguish their own correction from one recorded by the advisor while reading what is explicitly presented as the current correction. Show truthful available correction attribution separately from the original; preserve the original actor/body and current reason/time. Do not invent names, treat the original recorder as every correction's actor, or widen/relax Root to conceal the omission. Add durable client/advisor amendment-attribution controls and obtain a **new** independent review. Global timeline/amendment authoring remains W4's separate unfinished scope; this finding concerns the already implemented selected-report reader.

## Retained boundaries and native comparison

| Boundary | Fresh evidence / retained limit |
| --- | --- |
| F1-F3/F6-F7 | Original58 unchanged and passing: effective authored restrictions, prior/unknown Start, canonical guide-free/full/optional directions, all eight decision kinds, all seven rich Maya cards/images/guides/comparisons/evidence cautions |
| F4/F5/R2/R3/R4 | Existing fetched-view identity, session/mode/view/renderer/epoch, publication/decision/use-head and deliberate same-current ACTIVE reread gates remain. Failed/pending/navigation/read-only roundtrips cannot acknowledge unseen guidance |
| Operation ownership | Retained independent old success/error/finally and DecisionControls overlap cases pass: obsolete completion cannot apply, overwrite intent or release newer busy ownership; duplicate actual handlers cannot issue another operation |
| Recovery / CAS | Exact status403/409/503/absent/malformed/committed, stale/malformed current read, no/not-sure multistep recovery, new current head and deliberate review retain original bytes/UUID until lawful resolution. No v1 fallback or automatic new-version write |
| Current use / identity | Conservative contradiction/pause/stop/different suppression, original known Start captions, unreviewed unknown Start and no automatic stage/approval persist. Namespace collisions refuse ambiguous writes; actual reported-product routes/Back keep their real descriptors |
| Modes / privacy | Preview/historical/public-demo/private-walkthrough/read-only cannot use supplied malicious live care callbacks. Explicit unpublished adapter remains shared and excludes fake publication/use/date/entitlement/private fields. Private form memory clears on actual owner/CSRF/logout/expiry boundaries |
| Source / commerce | No source upload affordance or photo-success claim; unsupported photos remain separately denied. No fake catalog, finance, purchase, receipt or automatic Start |

Read Figma design-to-code guidance before live high-fidelity C07/C07C reads, session **`cc4fe367-6c78-4704-afc1-0659b0b196b5`**, file **WGbMylNV4rPoMw3r0nceaw**, page498:32, nodes499:584/503:1174. Both screenshots were inspected; no Figma write or asset generation. Retained16 relevant native contexts/PNGs and four catalogued assets match **20/20** hashes. CeraVe asset SHA`af135b13a07dd0ab5e24e0c297ffd2243a85a65fb6d2bcaa7604fe707aef719d`; azelaic SHA`118d93c1ad24efd48090a9e91d246eb87567471db99024b9eb9b89a8ae535df1`.

Fresh checked-in C07/C07C geometry at1440 retains main `(264,214,744)`, context `(1032,214,368)`, photo88x112. Actual1280/390/320 checks, keyboard date error/focus, Back/Forward/Escape/opener, current-use states and C01/C03D geometry pass. Compared fresh C07/C07C1440, C07C390/320, legacy unsent and correction screenshots with native references. Required unsupported-field omission supersedes C07's staged always-visible textarea; complete product names, actual acquisition uncertainty and semantic Back labels remain truthful. Shared wrappers/tokens/Lucide/source identities persist.

The200% test is **CSS zoom** and mechanical control-visibility/no-page-overflow evidence only. Its local image still squeezes columns and wraps short labels excessively; no comfortable-layout, native browser zoom, full WCAG/screen-reader, physical-mobile or representative-human acceptance is claimed. Broader visual/human/clinical/legal/license gates remain open.

## Executed verification and raw qualifications

`E` is this checkout's ignored `.local-artifacts/portal-rebuild/w7-care-client-r2/`. All Node/npm commands use explicit Node22 PATH. Root cwd unless stated. All final browser receipts below are serial, `--test-concurrency=1`, normal teardown.

| Command / scope | Actual result |
| --- | --- |
| Portal `npm ci --offline --ignore-scripts --no-audit --no-fund` | Exit0,130 packages; locked portal only |
| `node --experimental-strip-types --test --test-concurrency=1 apps/portal/tests/rebuild-plan*.test.mjs apps/portal/tests/rebuild-use*.test.mjs apps/portal/tests/rebuild-care-plan-model.test.mjs apps/portal/tests/rebuild-care-ports.test.mjs E/original-amendment.test.mjs` | **153/153**,0 failures/skips,84.548s; `focused.log`. Original58, affected use/recovery/state/keyboard/geometry, parent12, new22 and original amendment overlap |
| Same flags plus `--test-timeout=90000 E/current.test.mjs` | **22/22**,0 skips,17.286s; `current-final.log`, independently authored current acceptance |
| Same serial flags on `E/retained-{independent,adjacent,decision-review}.test.mjs` | **28/28**,0 skips,24.309s; `retained-serial.log`, original18+8+2 with three obsolete setup adaptations below |
| `W7_FROZEN_INPUT=1` plus same flags and `--test-name-pattern=sensitivity E/current.test.mjs` | **0/7 intended historical failures**,0 skips,5.246s; `frozen-sensitivity-serial.log` |
| `W7_FROZEN_INPUT=1` plus same flags on `E/historical-loss.test.mjs` | **0/2 intended historical missing-wire-note failures**,0 skips,3.461s; original assertions retained |
| Same flags on `E/attribution.test.mjs`, twice | **0/2 intended current failures** in each process,0 skips,2.502s/2.394s; CU3, `attribution.log` and `attribution-repeat.log` |
| Same flags on `apps/portal/tests/rebuild-foundation*.test.mjs apps/portal/tests/rebuild-app-state.test.mjs apps/portal/tests/rebuild-care-navigation.test.mjs` | **47/47**,0 skips,11.610s; `foundation.log` |
| Portal `npm run test:session` | **171/171**,0 skips,39.196s; `session.log`. Retained finite/canned-provider/Miniflare/cookie suite, not genuine care Auth |
| `node --experimental-strip-types --test --test-concurrency=1 tests/portal-care-contract.test.ts tests/portal-care-handler.test.ts` | **18/18**,0 skips,328ms; `root-care.log`. Current strict DTO/handler-port evidence, no SQL |
| Portal `npm run typecheck:rebuild`; `npm run typecheck:session` | Both exit0, zero diagnostics; normal strict flags unchanged |
| Portal `npm run build:rebuild`; `npm run check:ui`; `npm run build:application`; `npm run build` | All exit0. Combined package138 assets, ZIP`2f2f3ec6bc9fe2f18f1cc08fa7d8e3bfb0537fd26646373114ac731e54df80ec`, Vault`8e55c77529350971cd95902292d4be0efc07d6b796ac85b0d8c616153019d593`. No activation/deployment |
| Source/config/input/native audits; report scope/links/whitespace | Verified before commit; no runtime/test/Root/shared edits |

Counts overlap and must not be added into full acceptance. The frozen6b author980/session171 and earlier R1 evidence retain their exact original scope. No full980 rerun or Root application/types/Expo rerun is claimed; this bounded renderer omission does not justify repeating unrelated suites. Parent canonical34/772, Root1213/types/export, backend CB1/CB2 PASS and genuine Node9 remain separately attributed evidence.

Raw diagnostics remain intact. Initial new22 was **17/22**: four checks read the helper's initial external-view holder rather than the current strictly accepted controller view; the503 case omitted the actual cookie's required normal restore. Corrected only the probe to assert actual applied view/head plus owned server head and restore through `runtime.restore()`. Final22 retains all wire/event/incomplete-note assertions. Initial retained28 was **25/28**: three old setups tried typing on Start before switching to supported actions. Those inputs now select the supported action before entering notes; fresh own tests separately verify switch-away retention and block/remount behavior. No missing-locator failure is mislabeled as note loss or as passing acceptance.

One scheduling error briefly overlapped the initial retained probe process with the initial frozen-input sensitivity process. Both completed and closed normally, without a kill. Those raw logs are retained; **both were rerun serially** for the final receipts above. Later browser phases, foundation and session checks were sequential. No source or assertion was weakened due to the overlap. Existing typeless-root-module and missing root `expo/tsconfig.base` bundle warnings are recorded; strict frontend/session checks still pass.

## Clean candidate, release and remaining gates

Clean build before report creation: **sourceHead54623e9145d28df4e749fb3502db9c33f18efe7a / sourceDirty:false / gatewayIncluded:false**. Immutable provenance copy SHA`e4507ef1c2c85af9158347e6c5b398da5d59e2a8d4de31e232cc6bede2a6d88a`; JS`bf035537a8457e15d96190b0f52413378c991f51186889709e5a0af5d22251c6`; CSS`e69bed1810171c81ff17a9382f65e640e629fd5000a10d73bf9168ad51bc412e`. The author's69446909 receipt's JSfe63c961 remains valid for its baee source; this parent's already-integrated Root inputs differ as recorded above. Do not substitute either candidate's source/hash for the other.

First browser tool was `preview_status`, no attached tab. The user explicitly granted the named repository installed-Chrome interception workflow. Actual React StrictMode/session/cookie/care port/Root mapping/client controller execute unchanged. The harness opts into v2 composition; default Application does not. HTTP DTOs and reducer persistence are controlled finite synthetic inputs, with no successful port/current()/mapper replacement. Service workers/background networking/DNS are blocked; allowed `.invalid` traffic and finite original public-sample images resolve only to local bytes; unexpected traffic aborts and fails teardown.

**Chrome explicitly RELEASED `2026-10-31T07:41:31.119505+00:00`**, before post-browser builds and report writing. Every own tool/test/context/browser handle was terminal. Fresh executable inventory: **Chrome/Chromium/workerd[] / Node tests[]**; live preview **available:false, no tab**. No broad kill. Parent was notified in the progress handoff. No browser/DOM phase followed release; subsequent image reads inspect local files only.

No Docker/PG/Auth/R6/R4/R5 credentials/helper/lifecycle/resource calls, canonical reset/pgTAP, genuine API, actual upload, production permission/client/source/finance/outbox mutation or notification/provider delivery was performed. The separate genuine Node review's **CN1/P2 filtered history503** remains open. M57`20261031073004` contains only its two allocation comments, no implementation; it is not migration readiness or permission to access R6. This UI review cannot accept the canonical/browser path while that separate defect remains.

Full approved goal remains unfinished: connected current care/browser owner/human/negative acceptance and authorized atomic v2 activation; source uploader/lifecycle/consent/templates; global reports/history/amendments/reviews; commerce/account/export/notifications; all five Maya stages/private walkthroughs; complete accessibility/visual/human/mobile, legal/clinical/license/business, CI and release gates remain separately owned. No push/PR/merge/deploy, real message, funds, purchase or live action.

Parent should integrate only this report commit, preserve CU1/CU2 closure and all raw qualifications, allocate CU3's bounded selected-reader attribution response, and commission a new independent round against the integrated correction. No production fix is authored by the reviewer.

## Evidence integrity

`source-audit.json` binds source correspondence, unchanged original tests, parent controller, input/configuration checks and M57's comment-only state. `original-copies.json` binds exact original paths/hashes; `native-hashes.json`, runtime-initial/final, release, structured command receipts, scripts/logs and screenshots are retained under E. Evidence inventory excludes itself and this report. Selected SHA-256 receipts:

| Artifact | SHA-256 |
| --- | --- |
| `current.test.mjs` | `877a79a8af5056e5398ad328eb03b4b4cd97dc40d35c292d488f7b9b2ade752c` |
| `attribution.test.mjs` | `a0671df6700daa669074fd02e673c2397da40e4bf437c6e01569dc915c4742e6` |
| `focused.log` | `991a0929794e33cdc43410aa73f6b89519def779e62a0f6b9bae36a6d04e8798` |
| `current-final.log` | `99815e27685a8601d9423e23acb337c8e1ce7d499348003d67dc806d46500cee` |
| `retained-serial.log` | `54f8842ff6bd50d91589a54ae7010859864f2a068ae091053391167e3dddda41` |
| `frozen-sensitivity-serial.log` | `418950cbe10e15e352b85ab6a0106ff5f13094c874a93695f8925155b198e1f7` |
| `attribution-repeat.log` | `012f930931bc260a4d4f79c6fe41bf2cb86e4ada74e8d16a6973fd23a54470c5` |
| `actor-client.json` | `5c9722ce6b60c4e48a52151a84d775fe59a1fc51377b263300a8ad1291fc0909` |
| `actor-advisor.json` | `54e595ab2e8efc82eb79517c8c1c5cb6d9af170931d39046eaa503514b87cff6` |
| `actor-advisor.png` | `3ec8a5e2035a181697a25c459b82b0fd9b3c4d1708558c3f2f9106e1972432ca` |
| `source-audit.json` | `fa486e278ba2801b81de3c05a35ce490e366b886062da4fb6072fa7f30d6d398` |
| `release.json` | `327957a83cd0ab524c4aaf2d9d7561bbcd42d46015cae34f22cd4e39540bdf07` |

Final114-entry evidence-manifest SHA-256: `2f7bb0d4b2758a7a4719539dfb9865beee55f7e8c7bf67109d7645340aa368f0`. Report links, every listed artifact hash, unchanged runtime/test source and report-only scope were verified before commit. The containing commit is returned in the final handoff.
