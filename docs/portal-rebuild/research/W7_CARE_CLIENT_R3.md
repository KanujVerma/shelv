# W7 independent care client review, round 3

Owner: Kanuj. 31 October 2026. Report-only review of exact parent **`0755c55405c49d9953301ea00b4e20d03f2454f9`**. No nested agents or production fixes. Chrome returned before report writing.

## Separate verdicts

| Subject | Specification | Correctness / quality |
| --- | --- | --- |
| CU3/P2 selected correction actor | **ADDRESSED, scoped PASS** | Both compact summary and fetched full correction identify their own actual actor; immutable original attribution/body and current reason/time/usage remain separate |
| CU1/P2 unsupported notes | **Remains ADDRESSED** | Fresh unsupported input is absent/refused; switched and legacy captures retain unsent notes; supported details persist; exact recovery does not fabricate another event |
| CU2/P2 corrected frequency/amount | **Remains ADDRESSED** | Unchanged original reproduction passes; complete original and corrected known/unknown usage fields remain separate, including across products |
| Exercised care renderer / recovery / parent controller | **Scoped PASS** | Fresh173 focused, nine new independent, retained22, foundation47, session171, pure46/Root18 subset, SSR3, strict types and builds pass; counts overlap |
| Genuine care, default activation, whole portal and release | **NOT ESTABLISHED** | Actual Application remains v1 without care activation. No genuine Auth/SQL/native fixture/browser or live business action was performed |

**No new material in-scope finding.** This closes CU3's precise UI provenance omission against the integrated response. It does not upgrade the separate backend review, current application composition, clinical/legal/business, representative-human, CI or release gates. Historical R1/R2 failures retain their original heads and meaning.

## Source, runtime and ownership

| Item | Verified evidence |
| --- | --- |
| Workspace / branch | `/Users/kanuj/.t3/worktrees/shelv/t3-ed98972d` / `t3/w7-care-client-round3-review` |
| Clean starting / tested source | `0755c55405c49d9953301ea00b4e20d03f2454f9`; actual status/log/root and portal AGENTS read before verification; runtime/test bytes stayed unchanged |
| Task / actual child thread | `portal-rebuild-w7-care-client-review-20261031-r3`; `thread:delegated-task:command%3Amcp%3A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%3Adelegate-task%3Aportal-rebuild-w7-care-client-review-20261031-r3` |
| CU3 implementation / integration | Author `87f9145a43f705722e8d1e6dac08764004967fff` / `c75d8693d39fb6d88bc093894a69aa82f197d557`; exactly UseFacts, new18-case file, fixture and report |
| Receipt / integration | `933d4973ba69f8f4a26d1f6bf1d85f58529a5334` / tested0755c554; all three runtime/test files equal87f9145 and report equals933d4973 |
| Git freshness | Successful `git fetch origin --prune`; main `d39a7d4943209080df7c4cf97d85784f462758bf`; starting HEAD/main divergence154/0. No reset/rebase/import or foreign-checkout write |
| Live runtime, before and after browser phase | Both `orchestrator_capabilities` and `t3_thread_configuration`: **codex / gpt-6.1-sol / reasoningEffort=xhigh / serviceTier=default**, full-access/default interaction |
| Supported descriptors / configuration | Reasoning low/medium/high/xhigh/max/ultra, catalog default low; service default/priority, default default. Effective xhigh/default selected. Global selection, project defaults and all eight explicit role TOMLs checked; nine project hashes retained |
| Node / dependencies | Explicit `/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node`, actual **v22.23.0**. Every test/build and all later shell calls prepend its PATH. Locked portal-only offline install130 packages; no root install, upgrade, lock/config/flag/budget change |
| Tracked ownership | **Only this report**. Probes/evidence are ignored in this checkout. Coordinator retains CURRENT_STATUS, acceptance, TASKS, CONTEXT_SYNC and integration ownership |

The full95,388-byte [approved input](../source/APPROVED_INPUT.txt), including appendices A/B/C, was read in bounded ranges. Its exact desktop and D01-D48 text also matches the standalone files; all five original byte counts/hashes match INPUT_PROVENANCE. Read contracts, CARE_API_V1, workstreams/status/acceptance/UI policy, full W7_CARE_CLIENT_REVIEW/R2, full W3_CARE_USE including both responses/receipt, full W3_CARE_ATTRIBUTION_FIX and COORDINATOR_CARE_TRANSPORT. Revisited relevant original F1-F8/Q1/Q2/F5/R3-1/R4 findings and responses. Current user allocation and Git take precedence over stale resource/status prose; none grants fixture access.

## CU3 disposition and independent evidence

[UseFacts.tsx](../../../apps/portal/src/features/plan/UseFacts.tsx) changes only the two correction metadata presentations and a private relational helper. The compact summary uses its own amendment actor; loaded detail uses the full amendment actor and full original context. Exact equality with `reportedBy` yields **correction by client**. Otherwise, equality with an already distinct original `recordedBy` yields **correction by advisor**; a different actor yields **correction by another advisor**. For a self-recorded original, an eligible distinct human is correctly **advisor**. No name, ID dump, preparer/publisher/policy identity or session-key parsing supplies the attribution.

This classification is supported by the pinned API and inspected canonical source: original `reportedBy` is the target client; `amendedBy` is actual `auth.uid()`. `amend_use_v1` derives client scope from the original, distinguishes client from advisor, and calls `care_guard` before and after the client wait; that guard denies task agents and requires eligible active owner/human authority plus edit capability for advisor writes. This is **source evidence**, not an executed authorization/SQL acceptance claim. Root still rejects null/malformed actors. A valid UUID alone is not proof of a genuine eligible actor; our DTOs are finite synthetic inputs under that contract.

The unchanged original R2 **`attribution.test.mjs`** and R1 **`amendment.test.mjs`** were copied at the same relative depth and run without assertion/import edits. Original scripts, RED logs, actor JSON/PNGs remain separately preserved under `E/original-r1` and `E/original-r2`, with original absolute paths and hashes. Foreign originals were rehashed and never edited. Only the ignored browser helper's own checkout/output paths and an explicit input-only sensitivity switch differ.

New **`E/independent.test.mjs`**, nine cases, independently constructs strict DTOs and exercises actual installed Chrome, React StrictMode, cookie/session transport, care port, Root parser/positive mapper and actual `client-state.accept`:

- Six actor/body cases cover self-recorded client, original advisor, another advisor, cross-product corrections, read-only care reading and nested reported-product `initialUse`, including client/advisor correction of the nested original and advisor correction of a self-recorded original. Original unknown occurrence/video-or-portal attribution stays separate from corrected known occurrence. Original known frequency/amount and replacement unknown frequency/known amount remain intact. Exact original product/publication/slot filters are asserted. No use/finance/other-channel mutation occurs.
- Old client-actor history is held while the actual controller accepts a newer another-advisor view and starts a newer read. Releasing old history neither installs its actor/body nor releases the newer loading owner; only the current full read applies.
- A403 history read preserves the correctly attributed summary; the explicit retry sends byte-identical original history command and loads the full correction.
- Actual owner plus CSRF/generation replacement through `runtime.restore()` removes old private UI; a late full report cannot repopulate it. Browser storage remains empty.

Author18 unchanged cases pass in focused173, including missing care capability, all four restricted modes, mode retirement, actual controller replacement, nested initialUse, read-only, narrow widths and unchanged Root rejection. New3 supplemental viewport checks scroll the full correction actor into view at1440/390/320, retain exact whole-rectangle bounds and capture actual viewport screenshots.

**Sensitivity:** an ignored esbuild input plugin substitutes **only exact7209091e UseFacts**. All current Root/session/port/controller/feature inputs and intended assertions remain. Six new actor cases become **0/6**, each failing the intended missing-actor compact-text assertion, with normal loading/teardown. The unchanged original CU3 reproduction becomes **0/2**, both intended full-correction actor assertions. Current source is **2/2** again in a separate process, in addition to its earlier focused pass. No production file was overwritten and no mapper/permission/gate was weakened.

## Preserved CU1/CU2 and recovery boundaries

All eight original regression/helper files remain byte-identical to284c04e, preserving the original58. `UseReport.tsx` and `useModel.ts` equalbaee3033; parent `client-state.ts` equalsc8de1bd2. The response changes no Root/action/SQL/Auth/ports/controller/routes/dependencies/UI system/source asset. Full `ChangeBody` remains shared by original and correction.

The **byte-identical R2 current acceptance script** also passes22/22 here. It checks fresh Start/new-descriptor note-field absence and strict correct event counts; switched draft preservation/restoration/removal; supported pause/stop/different wire/history persistence; exact UUID/bytes through committed-malformed acknowledgement, denied status, navigation/remount and retry; legacy saved/saving/uncertain notes with explicit **notes not recorded**, not whole-success; status403/409/503/absent and post-ack read409; genuine normal cookie restore after503; existing reported UUID/version7; all four corrected frequency/amount known/unknown combinations across products; actual owner replacement. Initial descriptor creation keeps one nested unreviewed event and no extra Start/event. R1 loss scripts remain historical RED evidence, not a current missing-locator regression.

Focused173 preserves F1-F3/F6-F7 source fidelity, effective professional restrictions, prior/unknown Start, all eight decision kinds and all seven rich Maya cards/guides/cautions; F8/Q1/Q2 keyboard/history/opener/geometry; F5/R3-1 and DecisionControls token-only recovery. Successful current fetched content plus deliberate same-basis ACTIVE reread remains required. `accept` still strictly decodes, checks canonical equality and preserves the supplied fetched object; view/mode/session/renderer/epoch and publication/decision/use-head gates are unchanged. No stale read, read-only roundtrip or rejected intent becomes automatic fresh authority. These are bounded synthetic/source observations, not server permission claims.

Unpublished adapter still invokes the shared renderer without live ports/callbacks, publication/use/date/entitlement fabrication or private source fields. Preview, historical, public-demo and private-walkthrough modes cannot invoke the supplied live care path. Label uploads remain unavailable; empty photo arrays and identity uncertainty remain truthful. Product approval/receipt/delivery still do not create Start or commerce records.

## Native and rendered comparison

Figma design-to-code guidance preceded read-only high-fidelity context/screenshots for exact file **WGbMylNV4rPoMw3r0nceaw**, page498:32, nodes **499:584 /503:1174**; session **`05ceeb5e-2985-444a-9189-cb1d6e6f90f0`**. Both screenshots were inspected; no design write or asset generation. Retained16 relevant native context/PNG records plus four product assets match **20/20** catalog hashes.

Compared fresh C07/C07C1440, C07C390/320 and actual loaded correction screenshots with those references. Shared semantic tokens/wrappers/Lucide and native column/image geometry remain; fresh focused geometry assertions pass. Exact product names, truthful acquisition uncertainty, contextual Back and the approved unsupported-note omission explain staged-frame differences. Added actor text supplies provenance in existing metadata, with no new control or design system. Full correction actor/body is inspectable at1440/390/320. No broad new visual requirement is introduced.

CSS200% zoom remains only mechanical control/no-page-overflow evidence. Prior cramped long-text zoom limitations remain qualified. No native browser zoom, full WCAG/screen-reader, physical-mobile, comfortable-all-content or representative-human acceptance is claimed.

## Executed checks and raw qualifications

`E` = own ignored `.local-artifacts/portal-rebuild/w7-care-client-r3/`. Exact expanded argv, cwd, start/end/exit are in `E/checks.json` and per-command receipts. All browser files ran serially with `--test-concurrency=1`, normal finally/after closure. Counts overlap and must not be summed.

| Command / scope | Actual result |
| --- | --- |
| Portal `npm ci --offline --ignore-scripts --no-audit --no-fund` | Exit0,130 packages; `install.log` |
| `node --experimental-strip-types --test --test-concurrency=1` on `rebuild-plan-model`, `rebuild-care-plan-model`, `rebuild-use-notes-model`, Root `portal-care-contract/handler` | **46/46**,0 failures/skips,646ms; Root18 is a subset; `pure.log` |
| Same serial flags on `rebuild-app-render` and `rebuild-app-start` | **3/3**,0 failures/skips,1.269s; `ssr.log`; before independent browser phase |
| Same flags on `apps/portal/tests/rebuild-plan*.test.mjs`, `rebuild-use*.test.mjs`, care model/ports and unchanged original CU2/CU3 scripts | **173/173**,0 failures/skips,93.066s; `focused.log` |
| Same flags plus `--test-timeout=60000 E/independent.test.mjs` | **9/9**,0 failures/skips,6.614s; `independent.log` |
| `W7_FROZEN_ACTOR=1`, same flags, `--test-name-pattern='independent actor/body' E/independent.test.mjs` | **0/6 intended actor-content RED**,0 skips,3.991s; `actor-sensitivity.log` |
| Same frozen flag/serial flags, unchanged `E/attribution.test.mjs` | **0/2 intended actor-content RED**,0 skips,2.393s; `original-sensitivity.log` |
| Current unchanged `E/attribution.test.mjs`, separate repeat | **2/2**,0 failures/skips,2.428s; `attribution-repeat.log` |
| Same serial flags plus `--test-timeout=90000 E/retained-current.test.mjs` | **22/22**,0 failures/skips,15.889s; `retained-current.log` |
| Same serial flags on foundation files, app-state and care-navigation | **47/47**,0 failures/skips,11.517s; `foundation.log` |
| Portal `npm run test:session` | **171/171**,0 failures/skips,39.247s; `session.log`; finite/canned-provider/Miniflare/cookie tests, not genuine care Auth |
| Same serial flags, `E/visual.test.mjs` final | **3/3**,0 failures/skips,3.592s; `visual-final.log` |
| Portal strict rebuild/session types | Both exit0, zero diagnostics; `frontend-types.log`, `session-types.log`; unchanged flags |
| Portal `npm run build:rebuild`, `npm run build:application`, `npm run check:ui` | All exit0; clean source0755 candidate, no gateway; retained11-sheet guard, no budget change |
| Source/import/native/original evidence audits; report links/scope/whitespace | Pass before report-only commit; evidence below |

Supplemental visual first run was **2/3**, followed by **0/1** desktop diagnostic. `scrollIntoViewIfNeeded()` placed metadata at **y940.0625,height20** against a960px viewport; the exact assertion failed on **0.0625px** boundary rounding. Diagnostic JSON/PNG preserve the observation. Only the probe uses centered scrolling now; the identical exact bounds assertion passes3/3. No production or prior test was changed. The initial local image read of the absent failing screenshot was corrected after diagnostics generated it. These are retained probe qualifications, not accepted product tests or a material CU3 defect.

Read-only discovery also tried nonexistent CARE_API.md, R2/harness.mjs, unpublished.ts and application/provenance.json before resolving actual CARE_API_V1.md, browser.mjs, UnpublishedPlanPreview.tsx and application-provenance.json. Initial cwd/PATH/which/skill metadata reads preceded the explicit shell prefix; inherited PATH already selected Node22 and no Node/npm command ran there. Full details are in `exploration-qualifications.txt`. Required truncated combined reads were reread in bounded ranges. Existing typeless-root-module and missing root Expo-base bundler warnings remain recorded; strict compilers pass. No setup failure is counted as defect sensitivity.

Full portal980, root application/types/test-types/Expo/iOS, combined retained package, canonical DB and exact-head CI were **not rerun** for this bounded presentation review. Historical counts remain scoped to their original source. Root dependencies were not installed. No source change or unresolved test concern justifies claiming those broader checks.

## Clean candidate, release and remaining gates

Fresh pre-report application build: **sourceHead0755c55405c49d9953301ea00b4e20d03f2454f9 / sourceDirty:false / gatewayIncluded:false**;2,206 provenance inputs. Immutable `application-0755-provenance.json` SHA **`96652153d20ce4630f38550a10a080faf33fffcc7a6541d57151610afc0d581b`**. JS **`9d7cf041357ed36e1a1f85a88f65a90bd5caceac6ad112587e74238318dab887`**; CSS **`e69bed1810171c81ff17a9382f65e640e629fd5000a10d73bf9168ad51bc412e`**. This candidate's source/output receipt is distinct from the author's87f9145 candidate.

First browser tool was `preview_status`, no tab. User expressly granted the repository installed-Chrome interception workflow; no collaborative tab or alternate browser opened. Unmodified actual cookie/session/care-port/Root mapper/controller logic executes; HTTP DTOs and reducer persistence are finite synthetic inputs, with no successful port/current()/mapper replacement or fake activation. Service workers/background networking/DNS are blocked. `.invalid` routes and exact public-sample images resolve to local bytes; unexpected traffic aborts and fails teardown. No real credentials or external browser request.

**Chrome explicitly RELEASED `2026-10-31T08:14:54.620Z`.** All test/context/browser handles closed normally. Fresh inventory at08:14:50.475Z: **Chrome/Chromium[] / workerd[] / owned Node tests[]**. Live preview: **available:false, tabId:null**. No broad kill and **no browser/DOM call after release**. Later local evidence/report reads are filesystem-only.

No Docker/PG/Auth/credentials/R4/R5/R6/R7/native resource, helper/lifecycle, reset/pgTAP/genuine API, source upload, production permission/client/source/finance/outbox write, notification delivery, message, money or retailer action. The user's parent57 reset and35 pgTAP/796 PASS are **parent-attributed**, not this review's executions; independent M57/CN1 backend acceptance remains separately owned. Default Application still uses v1 ports/controller. No Root extension, care activation or whole-portal/genuine-care acceptance follows this report.

Parent may integrate only this report commit, preserve CU1/CU2/CU3's scoped dispositions and raw evidence, then continue separately reviewed real v2 composition and genuine care/browser acceptance. Full reports/history/amendment authoring, source/consent/templates, commerce/account/export/notification delivery, five Maya/private walkthrough stages, human/accessibility/mobile/clinical/legal/license/business, exact-head CI and release remain separate gates. No push/PR/merge/deploy or live action.

## Evidence integrity

`source-audit.json` binds actual source correspondence, all original imports, project role hashes, original58 files and original copied paths/hashes. `native-audit.json`, live runtime receipts, clean build provenance, scripts, exact command receipts, raw diagnostics, decoded DTO/DOM and screenshots remain under E. Final inventory excludes itself and this report. Selected SHA-256 receipts and inventory hash are appended after final verification; the containing report-only commit is returned in the handoff.

| Artifact | SHA-256 |
| --- | --- |
| `independent.test.mjs` | `2e4ceda931ea8d5aa559a4f735f1edd5fd14204edbb9a66b82efa39b67f2f986` |
| `focused.log` | `02eb94311a2b1a0ffe74a77de4b03dfb1b2f577def18a5a9fa98de7dcc7e77a3` |
| `independent.log` | `44fa747af53b715ced470041308d481bc1e39a1451d6e839d39af69b207b3358` |
| `actor-sensitivity.log` | `4032fb5af26ec4620f018bfed330c9b923e8fab8b2087505f5180a44111306ea` |
| `original-sensitivity.log` | `c0f0ccbda6faafbb5207030f74c2d5c435520393dd28c74396cdd03e19dba7eb` |
| `attribution-repeat.log` | `646ea0ba08ac12ce570d7f1a6953965d32f022435474e3a1f7911c52bde79d9f` |
| `retained-current.log` | `2f6f7529d34fa54e4217579765d9fe5be0feb1e2d81d0c7a54e82ca2898185e8` |
| `source-audit.json` | `6f3aa9e4c542dc21eb8804183f1ab32f21a036454777c8832ac909c01881ee82` |
| `release.json` | `466906214958b1b542db58049a4cf9c7b5a763b6f559a0b621f425c3a8b4bc92` |
| `actor-viewport-320.png` | `3aa48b6aaae4e996fe6bba446d08690b20ba14771989682301d60ced23f20dbe` |

Final **138-entry** evidence-manifest SHA-256: **`d9c30a37df6566b433a1c65259435e7aa8afda8169382cc23d48f64c1afd14dd`**. Links, whitespace, source hashes, preserved originals and report-only scope verified before commit. No runtime/test source changed after testing.
