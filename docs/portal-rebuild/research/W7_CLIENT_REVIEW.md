# W7 independent W3 client-plan review

30 October 2026. Review only; no production fixes or nested agents.

**Specification verdict: changes required.** The generic renderer, shared controls and main source-derived routine are present, but the represented state/content/error variants do not yet meet D08-D11, D16-D18, D27, D30 and D38.

**Correctness/quality verdict: changes required.** Fresh W3 tests passed **16/17**, with a reproducible focus-restoration failure on the fixed foundation. Additional isolated probes reproduce the findings below. Strict frontend typecheck, foundation preview build and UI color guard pass. These results neither accept W1's backend nor certify a connected portal.

## Reviewed identity, runtime and boundaries

- Review checkout: `/Users/kanuj/.t3/worktrees/shelv/t3-d3de7402`, branch `t3/review-w3-client-plan-slice`, clean starting head **`ba3fabbfbbb5b161fa416a06fd7c278534d8609b`**. `git fetch origin` succeeded; `origin/main` was `d39a7d4943209080df7c4cf97d85784f462758bf`. No rebase or edits to another checkout.
- Original W3 range: **`ec231df2e10671428ef7d98bbe80b6efedc1aa60..b4f43f7084a4cd3330805e2cf9e7bd0f637dac06`**, integrated as **`4ad0038d99520b0bcd5bfa087b6aec2c00d7c95a`**. The supplied integration-checkout `.local-artifacts/portal-rebuild/W3-client-review.patch` and freshly generated `git diff ec231df b4f43f7 --binary` have identical SHA-256 **`15aa1d70444023c05202a7d732c451e2e1e8af8f403e74db106243afe925cb44`**.
- `git diff b4f43f7 HEAD --` all seven feature files and four feature-test/helper files is empty. Findings concern the exact original W3 runtime paths, exercised with the parent's fixed W0 foundation. The later shared-contract change is `930dab999326796b880af67af26dafa270ae4aab`; independent TypeScript transpilation of each of its three changed files confirms identical before/after emitted JavaScript. Normal strict frontend checking passes without relaxed options.
- Live `orchestrator_capabilities({})` returned provider instance **`codex`**, model **`gpt-6.1-sol`**, inherited **`reasoningEffort=xhigh`**, `serviceTier=default`, `runtimeMode=full-access`. This is runtime-tool evidence, not a model self-description. No subagents were created.
- Read the root and portal instructions, rebuild entry point, D01-D48, full desktop specification, implementation contracts, API freeze, acceptance matrix, workstreams/current status, UI system and [W3 author report](W3_VERTICAL_CLIENT.md). Inspected **all** feature code/CSS/types/exports, both W3 test files, both test helpers, the source Maya sample, applicable shared contract/mapping/validation and navigation/overlay/session paths. Native evidence is the retained exact contexts and PNGs listed below, not a fresh Figma acquisition.
- Backend SQL findings and the active W1 fix remain separate and unaccepted. This review made no SQL/backend changes and ran no Docker, Auth, PostgreSQL, pgTAP, credential or hosted lifecycle. Only this report is committed. Disposable synthetic probes/logs/screenshots are ignored local artifacts.

## Findings

Priorities: P1 requires prompt correction before accepting this slice; P2 is an important correctness/specification defect; P3 is a bounded visual discrepancy. These are UI findings, not clinical, legal or server-authorization conclusions.

### F1 / P1: a published pause or exclusion still tells the client to continue in the product sheet

**Paths:** `apps/portal/src/features/plan/model.ts:27-29`; `apps/portal/src/features/plan/ClientPlan.tsx:93-95`. **Requirements:** D08-D11/D30; C01/C03 state-driven presentation.

`routineFor` correctly removes paused/left-out products, but `productContext.steps` still returns their unfiltered baseline instructions. `started` means any retained Start tuple, and the sheet uses `current || started` for **in your routine**, then uses any current-product decision for **why it stays**, regardless of its kind. The sheet never qualifies these instructions with the new pause/exclusion reason.

**Reproduction:** open `/plan/products/cerave-pm?routine=evening`; change the moisturizer decision to `pause` or `leave_out`, set the explicit reason to stop this product, and retain an earlier actual Start. Both DTO/content parsers accept this representation. The routine excludes CeraVe, but its sheet displays **in your routine**, **keep the moisturizer that feels comfortable, morning and evening**, and **why it stays**. Both kinds reproduced. Artifacts: `repros/pause-sheet.png`, `repros/leave_out-sheet.png`; `REPRO paused-*` in the complete log.

Use the effective advice and separately reported-use state consistently across the routine, sheet and evidence. A known earlier Start is not proof of current use. Also distinguish **start not recorded** from the current sheet's **not started**: absence from this Start-only projection does not establish a known negative/unknown actual date. Do not invent a date or a stop-report projection to resolve this.

### F2 / P1: product details and the directions page omit canonical V3 decision instructions

**Paths:** `apps/portal/src/features/plan/ClientPlan.tsx:94-95,102`; `apps/portal/src/features/plan/model.ts:27-29`. **Requirements:** D11/D17/D18; C02D/C03; API freeze rich-content preservation.

A V3 decision may carry its directions, cautions and authored schedule directly without a redundant R2 `Guide` or an already active routine step. Recommendation review renders those directions, but the sheet reads only baseline steps or the first guide. The evidence page renders steps/guides and decision rationale, but omits `decision.directions` and `decision.schedule`.

**Reproduction:** keep the treatment as an unstarted addition; clear its guides, retain `directions`, `cautions`, and an evening Tuesday/Friday schedule with a condition and comfort-contingent stage. These inputs pass strict DTO/content parsing. The recommendation contains the direction/stage; following **directions, ingredients & sources** loses the direction, condition, days and stage. Direct product details says **directions are not recorded** and drops the decision caution as well. The caution survives on the evidence page, so this is a specific projection/rendering defect, not complete disappearance of every caution.

Render canonical decision guidance on the selected-product paths, with advice status qualified as in F1. Do not require duplicated guides or fabricate an active routine step to make instructions visible. Evidence: `REPRO v3-evidence` and `REPRO v3-sheet`.

### F3 / P2: optional rows discard authored restrictions, and a short summary unconditionally suppresses full product directions inline

**Path:** `apps/portal/src/features/plan/ClientPlan.tsx:73-76`. **Requirements:** D08/D11/D18; C01/C01E practical instructions and authored schedules.

The `asNeeded` early return omits `ScheduleContent` and the product-details control. It therefore drops the condition, selected days and gradual-stage restrictions. Separately, any nonempty `usage.short[period]` suppresses every product `directions` entry without establishing that essential instructions are included in that summary.

**Reproduction:** add a condition, Monday/Thursday selection and a stage to optional makeup. None appears, and the row has zero details controls. This schedule passes strict parsing. Set sunscreen's short text to **apply sunscreen**, retaining the reapplication direction in `directions`; the latter disappears from the routine. It remains reachable through the ordinary sunscreen sheet, unlike the optional row's restrictions. Evidence: `REPRO optional-and-inline` reports all condition/day/stage/essential-direction checks false and `optionalDetails:0`.

Keep optional restrictions visible and provide the same product-bound depth where needed. Preserve essential directions inline; a compact summary alone cannot prove that omitted text is unnecessary.

### F4 / P1: an old active refresh can overwrite a newer read-only view and re-enable care controls

**Path:** `apps/portal/src/features/plan/DecisionControls.tsx:17-31,80-84`. **Requirements:** D16/D38; late-response and access-state boundaries.

`current()` checks mount, session and presentation mode, but ignores the latest view/access context already stored in `latest.current`. A pending read started while active may therefore apply after the enclosing view has become read-only in the same session/mode.

**Reproduction:** submit an approval, let the authoritative read capture the active result and delay delivery. Supply a newer `access:'read_only'` view and wait until the read-only notice is rendered. Release the earlier active read. `onViewChange` applies it, the view becomes **active**, **choice recorded** appears and **decline** is enabled again. The starting/ending projections pass strict parsing. Evidence: `REPRO stale-active-refresh {"access":"active","enabled":true}`.

Fence application against superseded access/view context, as well as session/mode changes. This proves stale UI reactivation, **not** a server authorization bypass; a correctly guarded server must still reject a subsequent unauthorized command. Direct stable read-only mode does disable writes, and the tested logout/owner/mode fences described below work.

### F5 / P2: a 409 refresh to a new publication bypasses the explicit review gate

**Paths:** `apps/portal/src/features/plan/DecisionControls.tsx:15-16,30,64-69`; `apps/portal/src/features/plan/ClientPlan.tsx:84`. **Requirements:** D16; conflict review and preserved local intent.

The conflict is stored under the old publication key, then `refresh(null)` applies the new view. `DecisionControls` is keyed by publication version, so a new version remounts a fresh idle component. The warning and review control disappear before the client reviews the change. The 409 path also replaces the command with null without storing the attempted choice separately, despite saying **your choice is kept**.

**Reproduction:** reject version-1 approval with 409 and return version 2 from the refresh, keeping the same decision ID. Result: `version:2`, zero **plan changed** notices, zero **review latest plan** controls, and enabled **decline**. No explicit review occurred. Evidence: `REPRO conflict-new-version`. The author's same-version 409 test passes and does not cover this case.

Carry a conflict/review state and the attempted local choice across version replacement. A refreshed DTO alone must not clear the required deliberate review step.

### F6 / P2: rich source guidance is retained in data but selectively lost in the renderer

**Paths:** `apps/portal/src/features/plan/ClientPlan.tsx:56,84,102`; `apps/portal/src/features/plan/model.ts:27-28`. **Requirements:** D11/D17/D20; complete meaningful source/guide/limitations preservation.

Evidence renders only the first rationale body for a decision where the selected product is current/alternative rather than primary. A nonproduct recommendation renders facts/actions/how/sources but no comparisons; the product evidence route is absent in that branch, so those comparisons have no reachable representation. A productless `guidance.how` on a product decision is also filtered out of product evidence and omitted by the product branch of recommendation review.

**Reproduction:** give the CeraVe current-product decision two independently meaningful rationale bodies. The second disappears from evidence. The actual unmodified Maya source already has **two** moisturizer reasons, including its optional-alternative qualification; the fixture still retains them, while evidence slices to one. Give a nonproduct `no_addition` decision a comparison: its marker is absent from the rendered recommendation. Evidence: `REPRO current-rich-evidence` and `REPRO nonproduct-comparison`.

The fixture also changes the moisturizer from optional alternative to keep, clears its proposed-product identity and filters seven original cards to four (`tests/rebuild/plan-fixture.mjs:14-15,28`). The retained Hydro Boost comparison text consequently appears beside the generic **proposed option** heading in CeraVe evidence. This is synthetic fixture adaptation, not proof of a lossless complete-source presentation. Preserve meaningful rationale, comparisons and associated identity/guide context through shared modules. Do not fix this by truncating the original source to the screenshot.

### F7 / P2: the actual source pause decision offers to buy the paused serum

**Path:** `apps/portal/src/features/plan/DecisionControls.tsx:99-111`. **Requirements:** D17/D27; all decision types without turning them into purchase cards.

Approval vocabulary and self-purchase availability depend only on non-null `primaryProductId`, not decision kind. The adapter legitimately retains the source pause card's second serum in that field; this does not turn a pause into a purchasing proposal.

**Reproduction without a synthetic kind change:** open `/plan/recommendations/maya-card-serums`. It displays **pause**, explains pausing both serums, then offers **approve product**, **i’ll buy it myself**, and prospective quote/payment copy for Niacinamide 10% + Zinc 1%. Strict parsers accept the fixture. Evidence: `REPRO source-pause-controls` in `variants.log` and the complete log.

Use action/status variants appropriate to the decision's meaning. The all-eight-kinds probe also confirms the same product-purchase controls when only the kind changes; that broader shape probe is not a claim that every combination is a publish-ready business case. With `no_addition` and null product, the author test correctly removes self-purchase.

### F8 / P2: the real product/evidence round trip loses the routine opener's focus

**Paths:** W3 callsites `apps/portal/src/features/plan/ClientPlan.tsx:41-42,76,95,102`; integration with W0 `apps/portal/src/navigation/history.ts:15-23,50-75` and `apps/portal/src/ui/overlay.tsx:43-59`. **Requirements:** D10/C03 and implementation Back contract. **Owner:** coordinator/W0/W3 integration; this review does not assign the root cause to an unverified single line or reopen all W0 fixes.

The existing W3 browser test **C01 geometry, selected product sheet and product-bound evidence restore context through keyboard and browser history** fails at `tests/rebuild-plan-browser.test.mjs:17:1400`, waiting for `document.activeElement.id === 'plan-product-cerave-pm'` after the evidence round trip and Escape.

**Independent reproduction:** evening plan -> CeraVe details -> ingredients/evidence -> Back to product -> use callback -> Escape. The path and evening tab return correctly, but focus is the **your plan H1 with empty ID**, rather than the still-present CeraVe details button. The same trace reproduces without the callback. Simple sheet Back restores the opener correctly; the deeper round trip does not. A separate actual-scroll probe restores plan scroll to 300px after Back and after the full round trip; focus alone remains wrong. Forward returns the selected evening/product route; direct product entry closes to the evening parent.

Evidence: failed `feature.log`, `REPRO roundtrip-focus` in two independent runs, and `REPRO scroll-journey` in `navigation.log`/the complete log. The heading is a safe fallback, but it is not the specified restoration when the real opener still exists. The earlier W0 41/389/157 results are not substituted for this failing W3 interaction.

### Q1 / P3: C03D uses the generic evidence layout instead of its approved frame variant

**Paths:** `apps/portal/src/features/plan/ClientPlan.tsx:35-38,102`; `apps/portal/src/features/plan/plan.css:3`. **Requirements:** D02/D07; [native C03D](../design/C03D-503-1083.png), context lines 114-137.

At 1440x960, native C03D has the product-specific title and 736/376px columns, with its main panel at `(264,162,736)`. The rendered fixture instead adds a generic serif **directions & evidence** title/subtitle, places a white main panel at `(264,196,744)` and a 368px white context panel at x1032. The native personal-relevance context is green, x1024, and 376px wide. This geometry/title variant differs before source-length reflow is considered. Native C02D's main panel begins at y214; the rendered generic header places it at y196.

The main C01 panel `(264,196,744)` and C03 sheet `(904,72,536,888)` do match their native bounds. Preserve complete meaningful source content while reconciling evidence-page hierarchy/geometry; extra source-length height is not itself a defect. This is a bounded visual finding, not a pixel-perfect or global UX verdict.

## What the fresh evidence supports

| Area | Observed scope and result |
| --- | --- |
| Generic/shared architecture | One `ClientPlan` with typed read/decision, captured session, and optional enclosing navigation ports. Feature composes shared Button/Badge/Tabs/Sheet/StatusNotice, PageHeader/Panel, Lucide fallback and semantic tokens. No feature auth, arbitrary HTML/code execution, custom client pages, global lowercasing, source-document fetch, localStorage or sessionStorage. Public source links are ordinary protected new-tab links; image loading is separately data-bound. This is source review plus intercepted behavior, not a security audit. |
| Source-faithful routine | Actual browser morning water rinse, CeraVe, sunscreen, optional makeup; evening one conditional remover, cleanser, moisturizer. No invented morning cleanser. Approval alone does not add treatment; pure model Start tuple adds it. Authored pause removes it from the routine, with F1 remaining in its sheet. |
| Product binding | CeraVe evidence stays CeraVe; no azelaic guide/study or Hydro Boost how-to in that selected evidence. Use callback receives `cerave-pm`. Evidence preserves the tested azelaic patch test, dry/intact skin, eyes/lips/broken-skin avoidance, comfort-contingent introduction, toner/new-active avoidance, irritation response, 15-20% versus 10% limitation and nonoptimal-schedule qualification. F2/F3/F6 limit the broader preservation claim. |
| Decisions/errors | Request includes exact version/decision/revision, null reason and a generated version-4 UUID. 503 exact retry across navigation retains the entire command. Success requires rereading and matching the authoritative choice; mismatch and post-ack read failure remain uncertain in additional probes. No optimistic routine activation. 403 displays no success. Same-version 409 requires review; new-version 409 fails F5. |
| Session/mode | Author cases deny stable preparation/read-only/historical/preview writes, clear private rendering on invalidation and reject late owner/logout results. Additional delayed-read probe waits for advisor-preview to render, then releases the old client response: no application. Public demo uses the explicit memory port while the supplied live port remains unused. Read-only transition during a pending read fails F4. Private-walkthrough write denial is supported by the exact port-selection source branch, not a dedicated rendered test in this run. |
| Extremes/assets | Actual 1280/390/320 browser cases cover routine/recommendation/evidence/sheet reflow, long names, two same-category IDs, empty product/routine/decision state, unavailable ID recovery and neutral null-image fallback. Additional broken-PNG response triggers the same fallback. None and unknown render distinct messages. No horizontal overflow in the tested dimensions. No arbitrary user/source markup is interpreted. |
| Navigation | Real URLs, evening selection, simple Back/Forward, direct parent fallback and 300px scroll restoration tested. F8 remains. Optional enclosing navigation retains its outer URL by delegation; the stub's Back simply resets to morning. It proves a port contract, not completed advisor-preview or Maya browser history. |

## Native frames and actual rendered comparisons

Read all six retained contexts and visually inspected all six native PNGs: C01 `498:85`, C01E `503:926`, C02 `498:212`, C02D `499:766`, C03 `499:151`, C03D `503:1083`. Recomputed their 12 context/PNG hashes plus the three C02/C03 asset records; all match `design/ACQUISITION.json`. No fresh live Figma/version claim is made.

Fresh feature screenshots inspected against native targets: `w3/C01-1440.png`, `C01E-1440.png`, `C02-1440.png`, `C03-1440.png`; additional actual selected evidence screenshots are `w7-client/repros/C02D-1440.png` and `C03D-1440.png`. All paths here are relative to this checkout's `.local-artifacts/portal-rebuild/`. The author tests additionally generate source-length laptop/mobile screenshots and assert viewport reflow; this review does not infer a full accessibility/zoom/reduced-motion acceptance from those assertions.

The same retained product-photo files are intercepted into the actual renderer: CeraVe SHA-256 `af135b13a07dd0ab5e24e0c297ffd2243a85a65fb6d2bcaa7604fe707aef719d`; azelaic `118d93c1ad24efd48090a9e91d246eb87567471db99024b9eb9b89a8ae535df1`. These are test asset mappings, not proof that production bundling maps every original image URL. Missing products use one neutral Lucide fallback.

The unscheduled review display is truthful and should not be changed to the staged native date. Longer paused explanations, full source guides and complete limitations may increase height. Preserve source identities/technical notation and necessary content rather than making screenshots artificially identical. Q1 concerns the evidence layout variant, not those justified data differences.

## Commands, results and reproduction artifacts

All Node/npm commands used `PATH=/Users/kanuj/.nvm/versions/node/v22.23.0/bin:$PATH`; `node --version` returned **v22.23.0**. Browser tests used the repository's esbuild/Playwright-core harness, **one intercepted headless installed-Chrome process at a time**, test concurrency 1, blocked service workers/background networking and a synthetic `.invalid` origin. Unexpected requests are aborted and asserted absent. `preview_status` was consulted first and had no attached tab; the explicitly requested repository interception workflow was used. No web server, live API or credentials were needed.

| Command / location | Fresh result |
| --- | --- |
| `npm ci --ignore-scripts`, `apps/portal` | Pass, 130 packages added / 132 audited. Reported two moderate and one high existing advisories; no upgrade, audit fix or advisory assessment. No lockfile change. |
| `node --experimental-strip-types --test --test-concurrency=1 tests/rebuild-plan*.test.mjs`, portal | **16 pass, 1 fail, 0 skip**, 17 total, 14.98s. F8 is the failure. This is the actual W3 suite, not the earlier author's 383 or W0's later totals. |
| `npm run typecheck:rebuild`, portal | Pass, zero diagnostics with normal strict options. |
| `npm run build:rebuild`, portal | Pass, including new-source color guard. This builds the isolated foundation preview; the feature browser harness separately bundles actual W3 components. It is not final app composition. |
| `npm run check:ui`, portal | Pass, 11 retained stylesheets. Does not itself establish component/copy/visual correctness. |
| `node --experimental-strip-types --test --test-concurrency=1 .local-artifacts/portal-rebuild/w7-client/repro.test.mjs`, repo | Final **13/13 observation groups pass**, 0 skip, 8.38s. Several assert observed defects intentionally; this is a reproduction receipt, **not** a passing acceptance suite. Includes delayed-read faults, exact retry, both pause variants, directions/schedules/rich content, source pause controls, geometry, actual scroll/focus and broken image/none/unknown. |
| Strict-shape probe using `mapPlanResult` and `readPlanContent`, repo | Six relevant fixture variants accepted: pause plus earlier Start; guide-free V3 decision schedule; as-needed conditional selected days; original source pause; new publication; read-only. This establishes representation compatibility, not readiness, human approval or backend publication acceptance. |
| TypeScript `transpileModule`, `930dab9^` versus `930dab9` | All three changed files have identical ES2022/ESNext output, with verbatim module syntax. No runtime fix is attributed to those type-only annotations. |
| `git diff --check`; owned-file/link/scope checks | Run before the report commit; report-only scope required. |

Disposable harness faults are limited to the existing synthetic test entry/ports: delay/fail a read, supply a deterministic authoritative DTO, log application, expose the existing fixture navigator and mutate synthetic plan data. No feature code or production source is replaced. Initial probe 7 resolved a delayed read before waiting for React's preview render; that timing assertion failed and is excluded as a product finding. The corrected probe waits for **preview only** before resolution and passes. The final complete run is the receipt used above. Intermediate logs remain retained; no failed production test was hidden by changing source.

Artifacts under this checkout's ignored `.local-artifacts/portal-rebuild/w7-client/`:

- `feature.log`: SHA-256 `dd60d321732c1129bdb7c72cf91316c6f3fc4dcbbec8bb0735217407fae283c0`.
- `repro.test.mjs`: SHA-256 `377b75ad8e80342fbb9fa4ae119ccc38b2d55941c524906a3ed57969331dd2cd`.
- `repro-complete.log`: SHA-256 `708f65dfac419a59f72440e35c4ad2062483ce940752b2690d79a1f03bfa7d0b`.
- `navigation.log`, `variants.log`, `shapes.log`, intermediate reproduction logs and `repros/` screenshots provide the targeted traces. They are local supplemental evidence, not committed regression tests. Rerun the exact script above in this retained checkout to reproduce; coordinator should add durable regression cases with the fixes.

## Remaining composition and acceptance limits

The renderer consumes `ClientPlanView`; the real `PlanPreview` DTO instead has `published:false` and safe content, with no client publication version/time. A typed draft-preview adapter remains coordinator composition. This review accepts neither an invented publication timestamp/receipt nor a fabricated `ClientPlanView` as proof that advisor preview is integrated. The enclosing navigation port is also a delegation contract only.

The current `actualUse` DTO contains Start tuples with a required known date, not unknown Start dates, stop/pause/using-differently events, or the latest published review conclusion. Those typed projections and complete use reporting remain future coordinated work. Known none/unknown product context is tested; unknown Start cannot be accepted as represented by this signature. Missing stop/report/review projections, remaining pages, full five-stage Maya exit/replay/reset, actual source/asset packaging and full app routing remain explicit future scope. Current use/self-purchase/export/update/history callbacks are composition/navigation seams, not persisted reports, orders, sent messages or finished exports.

No root application suite/type/export, retained-session full suite, full portal suite, real Auth/PostgREST, canonical DB reset/pgTAP/RLS/Storage/outbox/email, native device, hosted lifecycle, exact-head CI or real-client journey was run or accepted by this UI review. The user authorized focused local feature/browser review, not those lifecycles. No push, PR, merge, deployment, real client action, message, money or order occurred. No blanket UX, accessibility, human-comprehension, legal, clinical, security or portal acceptance is claimed.

Coordinator should correct and independently re-review F1-F8, reconcile Q1, then compose strict real transport/preview/navigation adapters and run the separately required connected acceptance lane. W1's important backend findings remain independently open; passing any UI rerun must not close them.
