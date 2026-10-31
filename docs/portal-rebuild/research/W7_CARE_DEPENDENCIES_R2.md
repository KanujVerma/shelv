# W7 independent care-dependency review, round 2

Owner: Kanuj. 31 October 2026. Independent source, SSR, strict-type and synthetic actual-Application Chrome review. No nested agents or reviewer production/test fixes. **Sole Chrome released at2026-10-31T14:06:24Z before this report was authored.**

## Separate verdicts

- **Specification: CHANGES REQUIRED, CD3/P2.** The original CD1 reproduction is addressed, but its required unavailable-identity behavior remains incomplete for valid nameless R1 documents. CD2 is addressed by an honest completeness block, with an explicit future reader dependency.
- **Correctness / quality: CHANGES REQUIRED, CD3/P2.** The resolver treats presence of a product ID as sufficient identity even when its historical name and every descriptor are absent. Independent source fails its intended unavailable assertion; actual App fails the intended disabled-rebase assertion at1440/390/320. A known-historical-identity control with the same opaque IDs passes.
- **Genuine backend / complete portal / release: not established by this review.** The prior [integrated core care scoped PASS](W7_CARE_INTEGRATED_REVIEW.md) is retained at its actual1011ae33 source and evidence. This imported W2 candidate has no new genuine R7 publisher/dependency-rebase acceptance, hosted verification or release authorization.

No critical/high finding, unauthorized publication, private-data disclosure, stored-event corruption, lost amendment, financial effect or inferred Start was demonstrated. The finding concerns the information required before a deliberate basis update. No rebase is submitted by its reproductions.

| Finding | Independent disposition |
| --- | --- |
| CD1/P2 original: two named Pub1 products collapse under Pub2 | **Original mechanism addressed.** Exact historical reads yield distinct original identities at all three widths. **Full missing-identity requirement remains open as CD3.** |
| CD2/P2: complete history masks an incomplete effective current projection | **Addressed within the approved fail-closed scope.** Any current reported-products continuation blocks acknowledgement/rebase, independently of complete history. Over100 and byte-split current cases pass. |
| CD3/P2: an existing but nameless historical product is treated as resolved | **Open, changes required.** Valid R1 normalization produces empty names/descriptors. The UI permits acknowledgement and enables rebase using only opaque references. |

## Exact identity, runtime and imports

| Item | Live/source-verified value |
| --- | --- |
| Task correlation key | `portal-rebuild-w7-care-dependencies-review-20261031-r2` |
| Workspace / branch | `/Users/kanuj/.t3/worktrees/shelv/t3-88d4690a` / `t3/w2-care-dependencies-r2-review` |
| Clean starting parent | `2084e570ab7787f0e7e6f3c8cf1ee7715acc1989` |
| Frozen author full head | `355802f7f9330094510bed089e1c259db6951688` |
| Four-file CD production / browser helper-test source | `75e9ca0652d30dc72dec64c474500598ab7ce9b1` / `74a857f4d1108bf1423d8846008e7cf256bf407c` |
| Clean tested review import head | **`4c4593c014f3c66508dc47934b7725a5ab638f95`** |
| Both live tools, initially and finally | `orchestrator_capabilities` and `t3_thread_configuration`: **codex / gpt-6.1-sol / reasoningEffort=xhigh / serviceTier=default**, full-access/default interaction |
| Supported descriptors | Reasoning low/medium/high/xhigh/max/ultra; service default/priority. Effective selection is explicitly xhigh/default |
| Configuration | Project model/default-subagent pins and all eight role TOMLs parse as Sol/xhigh; nine original files hashed in `pins.json` |
| Node / Chrome | Explicit `/Users/kanuj/.nvm/versions/node/v22.23.0/bin` PATH for every Node/npm invocation; actual v22.23.0; installed headless Chrome156.0.8078.79 |
| Dependencies | Portal-only existing-lockfile offline `npm ci --ignore-scripts --no-audit --no-fund`,130 packages; no Root/global install, package/config change or compiler relaxation |
| Freshness | Local origin/main is d39a7d4943209080df7c4cf97d85784f462758bf. No fetch, remote-currentness or exact-head CI claim |

Actual live child thread is `thread:delegated-task:command%3Amcp%3A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%3Adelegate-task%3Aportal-rebuild-w7-care-dependencies-review-20261031-r2`. Run is `run:thread:thread%3Adelegated-task%3Acommand%253Amcp%253A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%253Adelegate-task%253Aportal-rebuild-w7-care-dependencies-review-20261031-r2:ordinal:1`. Live thread readback identifies actual parent d632030a-18f7-4dec-a2c9-f5c0418c3fd5 and project ac0af19d-d404-4f53-a870-02bfd76c2a80. The parent-owned task handle was not polled. Capabilities' parentThreadId names this child in this harness; actual parent identity comes from thread readback.

All nine authorized commits were inspected and cherry-picked with `-x` into this checkout only. No conflicts, semantic resolution, reset, rebase or foreign write. Every changed blob after each import matches that exact source commit. `imports.json` binds full author/import IDs and blobs; nine original patches are retained.

| Author commit | Review-only import |
| --- | --- |
| 3d06af0c78b59332a1d55f113e7fb23a18e7bd69 | 125db53b |
| 5d796c22029224116d7d720c053bf6c528e44605 | 8546f27a |
| 278714b708df2a88e5796fb2ef0ae82d31e76057 | 3e6ac4a4 |
| 47586ed342f0cee8e92c8323b94196da3abb93b6 | 63e7f507 |
| 018583f8338d7b6ab77d3835013584efd42ba475 | b8c9b6ae |
| 36b3563588b934f8507d1023a426f828674a9b9f | 20ffc04b |
| 75e9ca0652d30dc72dec64c474500598ab7ce9b1 | e7473a05 |
| 74a857f4d1108bf1423d8846008e7cf256bf407c | 85feb199 |
| 355802f7f9330094510bed089e1c259db6951688 | 4c4593c0 |

The six W2 production paths match the author exactly: app/ports and advisor types/controller/AdvisorWorkspace/dependencies/DependencyReview. The final CD commit changes only the latter four advisor files. Among59 author frontend paths,58 are identical; the sole inherited difference is `transport/session.ts`, whose added `reviews` channel is byte-identical to parent2084e570/88d4e588. It was neither imported from W2 nor edited here. Parent raw Review scaffold, Root/contracts/supabase, all57 migrations/native source, session integration, Application/shared-plan/UI/routes, packages/config, status/TASKS/CONTEXT_SYNC remain unchanged except the explicit W2 imports. No M58/Review15 or new permission/API was adopted. All19 original App test bodies are byte-identical to47586ed3:13 declarations plus six loop-generated cases; only the permitted finite backend responder differs.

The sole newly authored tracked path is **this report**. Coordinator must take **only its report-only commit**, returned in the handoff, rather than the nine review imports. Scripts, DTOs, logs, screenshots and receipts are ignored under **`.local-artifacts/portal-rebuild/w7-care-dependencies-r2/`**, abbreviated E.

## Requirements and prior evidence

Read applicable AGENTS, the complete95,388-byte approved input in bounded chunks including appendices A/B/C, standalone decisions/specification/manifest correspondence, implementation/CARE/ADVISOR_READ/PLAN contracts, acceptance, ownership/workstreams and current status. All five originals match declared bytes/SHA-256, and embedded appendices equal their standalone text/JSON. Read complete [R1 dependency review](W7_CARE_DEPENDENCIES_REVIEW.md) and [W2 dependency report](W2_CARE_DEPENDENCIES.md), including CD1/CD2 responses and final release. Inspected changed production/helper/test source and relevant retained advisor, application, care/backend/history and recovery lineage.

Prior advisor F1-F3/R3/R4, generic read leases/native readOnly guidance, lawful first assigned-gate capability upgrade, payment late-single-claim, C1/AR1/status/origin-notice dispositions retain their qualifications. CU1-CU3, CB1/CB2, CN1, CA1 and CS1/core care retain their respective reviewed scope. A2 ordinary browser reachability remains unproven. Pending after a valid awaited acknowledgement remains an incorrect historical assertion; old null-versus-undefined diagnostics do not establish unsafe publication.

## CD3/P2: nameless historical products are incorrectly considered resolved

Owner: W2 advisor dependency inspection. Requirements: D11/D17/D20/D26/D30/D32 and this round's explicit rule that unavailable historical identity must be disclosed and block acknowledgement, without borrowing current same-ID names or requiring a new reader/right.

Source: [dependencies.ts](../../../apps/portal/src/features/advisor/dependencies.ts), `dependencyProductIdentity`175-251, especially product presence207 and unconditional `resolved:true`240. The current unavailable gate checks only that resolver's boolean. [Root adaptLegacyPlan](../../../src/contracts/PortalRebuild.ts)83-98 intentionally preserves R1 documents without presentation by creating product IDs with **name:''**, null brand/variant, empty size and unknown strength. That is lossless unknown data, not an absent/malformed response.

Independent construction uses that actual normalizer and positive projection, actual cookie/session/transport/ports, Root Plan/Care parsing/mapping, controller and actual App:

1. Current V3 publication2 has proper current-only product names. Its two summaries retain original R1 publication1 references with exact schema1 and opaque IDs `legacy-opaque-a91f` and `legacy-opaque-b73e`. Current states explicitly remain not_reported/contradiction:true; no current descriptor is asserted as old truth.
2. Exact safe historical read `{clientId,version:1}` returns a strict valid R1 document produced from recommendations with presentation:null. Both products exist, but neither has a name or descriptor. Full historical product refs, client and use head2 match; all history is complete. No fake Start, formula, date or client entitlement is introduced.
3. The resolver accepts both products as resolved, because version/schema/product/slot checks succeed. The actual disclosure headings are **plan version 1 · reference legacy-opaque-a91f · original report** and the corresponding b73e heading. Original frequency/amount/irritation facts remain readable, but there is no historical product identity or unavailable-identity warning.
4. At1440/390/320, **i reviewed this current information** is enabled. Selecting it enables **update draft basis**. All three intended disabled-rebase assertions fail `true !== false`. No mutation is sent. Source independently records status:ready, resolved:true and canRebase:true, failing its intended unavailable assertion.
5. Positive control uses the **same opaque IDs**, changed current-only names and actual known historical V3 names. The original headings use those historical names, acknowledgement enables rebase appropriately and zero mutations occur. The probe does not demand a blanket failure or infer identity from an ID.

Artifacts: `identity-opaque-data.mjs`, `identity-opaque.test.mjs`, `identity-opaque-source.{log,json}`, `identity-opaque-browser.mjs`, `identity-opaque-browser4.log`, and `identity-opaque-browser-{1440,390,320}.json`. Corresponding PNGs and four normally closed context receipts are copied into E/executed-cd-browser/green-current. The first simpler R1 case with descriptive IDs also fails source and all three App widths; its separate identity-gap artifacts are retained, not counted as another defect.

**Bounded response:** keep valid unknown historical records readable and distinguishable by exact references, but do not mark a product with no meaningful historical name/identity as resolved or permit acknowledgement on that basis. Preserve the current same-ID name boundary, schemas/slots/versions, all readable reports and the existing per-lease/session fences. This needs no new API, source right, Root permission or unsupported reader. New independent re-review is required after a bounded correction.

This is a review-quality/completeness defect, not a demonstration that SQL accepts a forbidden publication. The probes stop at enabled rebase; current approval/publication remain independently gated.

## Original CD1/CD2 closure and retained controls

| Area | Fresh evidence and limit |
| --- | --- |
| CD1 known historical identity | Original intended source assertion passes. Actual-App original distinction passes1440/390/320; exact historical version1 fetched through existing safe careRead. Current same-ID names are not substituted. Missing/denied/wrong client/version/schema/product/slot/head cases remain blocked in new28/source429 and browser16. CD3 qualifies empty historical identity |
| Historical metadata lifecycle | Only derived version/schema/product/slot identity fields are cached, never old use/access/private fields. Unique versions fetch once per lease; refresh/unmount/re-entry/session/owner/CSRF/current restriction retire applicability. Late historical403/503 and success preserve B/manual intent/exact wire retry; new inspection owns its cache |
| CD2 completeness | Current reportedProducts.nextCursor always creates unavailable state and disabled acknowledgement/rebase even after all102 or304 history entries. Current/history remain readable. No owner-derived read_reported_products_v1, ledger reconstruction, M58 import or new action is used |
| Remaining reader dependency | `MissingDependencyReader` family reported_products is a future safe advisor-reader request only. REPORT/INSTRUCTION/changed references/opaque legacy-context still block as required. M56 dependency read's edit guard means actual view-only403 remains unavailable; safe advisor audit rights stay separate |
| Later completion | Current source control preserves90 products/original events, adds actual synthetic shorter descriptor versions, then explicitly refetches the complete bounded projection. Old acknowledgement does not carry; a fresh deliberate acknowledgement is necessary |
| Rebase/recovery | Separate acknowledgement and update action, exact heads/legacy manifest/CAS, unchanged guidance/new revision/stale reviews/cleared approval, five deliberate reviews/new exact approval/later publish. Exact uncertain UUID/bytes, status READ denial/absence/malformed outcomes, definite409/fresh inspection/new UUID and newer restrictive authority remain intact |
| Payment/preparation | Known receipt is cleared before awaited dependency inspection; failed clinical read cannot turn known money into uncertainty. Unassigned/prepublication and lawful initial capability upgrade retain honest state. App19 and payment/status regressions pass |
| Closed runtime seam | care:true opt-in, two dependency actions and two safe care-read actions remain finite. Three unexpected runtime Plan actions deny before egress; legacy default and canonical audit remain unchanged |
| UI/privacy | Original full-text/keyboard/readOnly cases, long labels/disclosures and participant attribution remain. At1440/390/320 the original keyboard controls pass with reduced-motion/forced-colors emulation, zero mutation, empty browser storage and no horizontal overflow. No CSS/color-budget change |

## Executed commands, results and adapters

All commands use explicit Node22 PATH, serial test concurrency and finite timeouts. `source-checks.py`, `source-commands.json`, `browser-checks.py`, `browser-commands.json`, `supplementary-commands.json` and `verification-summary.json` retain expanded argv/cwd/results. Adjacent101 has complete green TAP output; its shell exit was not separately consumed. Counts overlap; they are not summed into a full-goal result.

| Check | Independent result |
| --- | --- |
| Focused source/actual-component SSR | **429/429**,0 fail/skip/cancelled,4.060s; original401 plus28 CD cases |
| Adjacent app/cookie/transport and six Root contract/handler files | **101/101**,0 fail/skip/cancelled,3.915s; finite source evidence, no native resources |
| Original unchanged independent race controls | **5/5**,0 fail/skip/cancelled |
| Original CD1/CD2 source assertions, current adapter | **2/2**,0 fail/skip/cancelled |
| Original actual-App finding assertions against exact frozen36b four-module inputs | **0 pass/4 intended failures**,0 skip/cancelled,5.966s; CD1 three widths and CD2 over100 |
| Current original actual-App assertions plus three keyboard/privacy controls | **7/7**,0 fail/skip/cancelled,5.978s |
| Current checked-in CD actual-App suite | **16/16**,0 fail/skip/cancelled,13.640s |
| Retained dependency27 + App/advisor/follow-up/payment/recovery/status86 | **113/113**,0 fail/skip/cancelled,128.906s; run once |
| New missing-identity finding, opaque IDs | Source **0/1 intended failure**; actual App **1 positive control pass/3 intended failures**,0 skip/cancelled,4.578s |
| Frontend/session strict types, UI guard | All exit0, unchanged flags;11 retained stylesheets |
| Actual application build | Executed by current browser runs; final provenance has exact4c4593c0, sourceDirty:false, gatewayIncluded:false |

Focused source command from repository root is `node --experimental-strip-types --test --test-timeout=15000 --test-concurrency=1` on advisor controller/races/followup/app-integration/approval-authority/status-recovery, dependency core/SSR/runtime-seam/payment-source and dependency-cd `.test.mjs` files. The exact eleven paths are in source-commands.json. Adjacent101 adds app-care-composition/render, app-ports/session/state/render/callback/start/preview-context/continuation, care-ports and the six portal-care/portal-rebuild domain/handler/advisor-read files recorded in supplementary-commands.json.

Browser commands use `node --experimental-strip-types --test --test-timeout=60000 --test-concurrency=1`. Original red sets only `SHELV_ADVISOR_CD_SOURCE_REF=36b3563588b934f8507d1023a426f828674a9b9f` and `--test-name-pattern=^CD`; current green removes it. The owned helper calls the inspected finite frozen-builder adapter, substituting only exact36b controller/types/dependencies/DependencyReview Git inputs. Current Application, Root, cookie/session/transport and original assertions remain. This is historical **four-input sensitivity on the current parent**, not execution of the entire old full head. Frozen-input hashes/provenance remain separate; ordinary builder provenance alone does not attest overridden inputs. Current green rebuilds the normal candidate. Historical byte-split RED/author0/8 and source RED0/3 remain author evidence; this review freshly executes the original four finding assertions and current byte-split checks.

All63 R1 artifacts were copied byte-for-byte from the allocated read-only t3-2db3684b directory, with original/copy paths and SHA-256 receipts. Final rehash finds no original/copy mismatch. Originals are never overwritten or run in their foreign directory. Separate executable adapters are explicit:

- SSR/CD1: add only the finite strict same-client/version1 historical response built from the independent original care fixture; preserve both original finding assertions. Exact adapter is source-adapter.diff.
- Actual App: relocate own imports/output paths, supply that same actual historical read response, and preserve the original distinct-heading assertion. CD2 retains its original rebase-disabled assertion while observing an already-disabled acknowledgement rather than forcing a click. Page progression waits on visible disclosure growth, replacing old fixed sleeps. Browser adapter diffs record every changed line.
- Source setup qualification: an initial copied SSR entry still referenced the retained R1 renderer; its stale-renderer CD1 failure is preserved as originalCD-stale-renderer-setup.log. Relocating all entry imports to this checkout yields accepted current2/2. No product change followed. Two own audit attempts also corrected test-count expansion and trailing-newline comparisons; another correctly identified the inherited reviews-channel baseline difference. These are probe/audit setup corrections, not product findings or accepted RED.

Actual Application/main, retained cookie/session factories, transport, Root parsers/positive mappers, ports, controller and components execute. **Only finite HTTP DTOs/status/delivery and the synthetic reducer provide backend facts.** No successful port, current predicate, authority function or response mapper is replaced; no false gate is forced. All browser requests are deny-by-default at the synthetic .invalid origin, with service workers/background networking/QUIC/DNS blocked. Unexpected traffic/page errors fail teardown; only exact injected status console failures are accepted. This is not real Auth/Vault/Edge/PostgREST/SQL/notification delivery acceptance.

## Visual scope, release and remaining gates

After Chrome closure, directly inspected local native A02 500:383 and A05 500:686 plus own320 finding PNG. Shared cream/forest wrappers/tokens/Lucide remain, long opaque references wrap and the enabled basis-update control is visible. Dynamic current-information content extends the canned frame vertically. No whole-frame pixel-match, native zoom, complete accessibility/screen-reader, representative-human, clinical or design reapproval claim.

Grant: **coordinator-w7-care-dependencies-r2-synthetic-chrome-355802f7-20261031**, this task/worktree only. First browser tool after source/pure preflight was preview_status, unavailable/tabId:null, followed by the expressly approved installed-Chrome finite-intercept workflow. No prior grant was reused. W2's13:45:02.314182UTC release remains separately attributed.

**SOLE SYNTHETIC CHROME RELEASED2026-10-31T14:06:24Z**, explicitly announced before this report. Final own process inventory at14:06:24.819841UTC has owned automated Chrome[], own Node tests/builders[], own workerd[]; platform CUA is excluded and no global Node/workerd emptiness is claimed. Final preview is unavailable/tabId:null. Original red4 closes4/4 contexts; original green7 closes7/7; candidate16 closes16/16; first finding3 closes3/3; final finding/control4 closes4/4; old dependency27 closes27/27. Retained86 completes its unchanged teardown. All handles are terminal, with no listener/Miniflare started and no broad kill. No browser/preview/process/resource call follows release; later image/hash/Git/report work uses local files only.

No R7/R6/R4/R5/PG/Docker/provider/real Auth/credential/fixture access, lifecycle or polling; no new source/permission or task right. No production/test fix, nested work, external communication, real money/order/client action, push/PR/merge/deployment.

Not run: current W2 genuine R7 publisher/dependency rebase, actual SQL/CAS/RLS/after-wait execution, canonical reset/pgTAP/Storage, full Root/portal/session suites, Root application/test types, Expo/iOS exports, hosted checks or exact-head CI. Prior accepted core care and canonical checks retain their own exact source and scope. New report/instruction/complete reported-state readers, source/commerce/account/retention/export/delivery/demo, all D01-D48/screens/V01-V17 and visual/mobile/accessibility/human/legal/business/release gates remain parent-owned. Child dependency setup is not a parent failure.

## Artifact integrity and handoff

E/evidence-manifest.json binds **192 artifacts**, SHA-256 **6fdd92c869677867815dd321aebec50f5a0a83e039174df40b34c5a47b8464e3**. It excludes itself, final validation and later Git receipt. Source/import/runtime/pin/input audits, original/copied/adapted probes, actual clean provenance, frozen-input hashes, logs, context/request receipts and screenshots are retained. Selected current hashes:

| E artifact | SHA-256 |
| --- | --- |
| source429.log | fd1b9c3f09eb010ce4b5f7c5c457eb5e1a5dc220864d481358571b3764ae13ef |
| original-browser-red4.log | fb339936f52bc304fe460fd1626ee6f6498112a1f1609ba96c437b47b85cd1de |
| original-browser-green7.log | 8f59e7b0744a71fc8b4c6ff1310c2ef751a8508127eb15e3189bdb62a597e9bf |
| candidate16.log | d2b3a61187cfd8f795f6fafa25ae5a9b2fee71fc63a5f000b4ad29583d62cb33 |
| retained113.log | c519d98b5ff43c45c5d205023a7ec3f4729cdb8b19e3eb544b16d9d61ef4e37a |
| identity-opaque-source.log | 136917059d2b947d50d3c34f71288c39ae9e9834043e83669f88fb562d690683 |
| identity-opaque-browser4.log | a494e79c089179940baf7d10ba1a37dca14ce4e9425e06a2661303935b24f732 |
| identity-opaque-browser-320.json | ddd980d68b248a663ebb43abcf86c5bf58ca5c3e8c92ed5bd7b3fa2dac419120 |
| imports.json | 48b4aef8cd2e17617894e6d219b3c701874c9ba0537d9e3f1ea7b3b23ec47502 |
| release.json | 57779dced908a93a5f8c00636f53ddfc7b7363eb0be9fc33286902ad3865bdc3 |

Final validation checks artifact hashes, all nine exact imports/six production blobs, parent boundaries, all original App assertions, report links/no em dash and git diff --check. The report-only commit and clean readback are returned in the handoff. Parent should retain both original closures with the CD3 qualification, allocate its bounded correction and commission a new independent review. No new permission or reader implementation is required to fail closed on missing historical identity.
