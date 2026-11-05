# W3 Maya five-stage source candidate

Owner: Kanuj. 1 November 2026 UTC. Implementation sub-agent, isolated public sample only.

**Status:** implemented and tested as a source/pure/SSR candidate. Not mounted in Application, independently accepted, browser tested, visually matched, hosted or deployed. The full approved rebuild remains open.

Source commit: `bb8760ef4d33e21a05d7a43a5aa7a558d7cae3ba`, exact parent `d4125cca52cb21d0c0a79a5733662f782a0dea76`. Workspace `/Users/kanuj/.t3/worktrees/shelv/t3-b757c3ea`, branch `t3/maya-five-stage-demo`. Only the new [Maya subtree](../../../apps/portal/src/features/walkthrough/maya/index.ts), `apps/portal/tests/rebuild-maya-five-stage*` and this report are owned. No shared renderer, navigation, Application, schema, package, lock, existing test or configuration was edited.

## Runtime and identity

- Authoritative task ID: `node:delegated-task:command%3Amcp%3Add730894-0fab-4a94-873d-743422eae122%3Adelegate-task%3Aportal-rebuild-w3-maya-five-stage-source-20261101-r1`.
- Backing thread: `thread:delegated-task:command%3Amcp%3Add730894-0fab-4a94-873d-743422eae122%3Adelegate-task%3Aportal-rebuild-w3-maya-five-stage-source-20261101-r1`.
- Run: `run:thread:thread%3Adelegated-task%3Acommand%253Amcp%253Add730894-0fab-4a94-873d-743422eae122%253Adelegate-task%253Aportal-rebuild-w3-maya-five-stage-source-20261101-r1:ordinal:1`, ordinal 1. Task, thread and run are distinct identities. The initially rejected parent steer was not a restart or new allocation.
- Parent: `d632030a-18f7-4dec-a2c9-f5c0418c3fd5`.
- Initially and finally, LIVE `orchestrator_capabilities`, self configuration and Parent configuration return `codex`, `gpt-6.1-sol`, `reasoningEffort=xhigh`, `serviceTier=default`, full-access/default interaction. The live model descriptors explicitly offer xhigh and default. Runtime evidence is retained in `runtime.json` below, rather than inferred from a prompt.
- Global selected defaults, actual project defaults and all eight role files pin Sol/xhigh. All nine project/role files remain byte/mode exact. The historical configured maximum of eight was not mutated; no child was spawned.
- Initial and final explicit runtime is `/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node`, `v22.23.0`. Actual portal TypeScript is `6.0.3`.

## Implemented seam and stage behavior

The parent approved `createMayaDemoController()` plus `MayaWalkthrough({controller})` after the early source/SSR counterexample. [Controller](../../../apps/portal/src/features/walkthrough/maya/controller.ts), [view](../../../apps/portal/src/features/walkthrough/maya/view.tsx) and [fixture](../../../apps/portal/src/features/walkthrough/maya/fixture.ts) consume actual `ClientPlan`/`PlanRenderer`, `PlanNavigationPort`, canonical legacy adaptation, product/evidence/schedule/use presentation, `captureUse`, shared Buttons, Badges, StatusNotice, PageHeader, Panel and the existing Sheet lifecycle. There is no copied care form or product renderer. Alex remains untouched and uses the same existing plan behavior with its own content.

| Stage | Actual destination/content | Ordinary action and recovery |
| --- | --- | --- |
| 1 meet Maya | Public priorities plus actual morning plan | Next opens recommendation; Back disabled; explore/exit/reset available |
| 2 one meaningful decision | Actual treatment recommendation, cautions, sources and shared choice controls | Approve/defer/decline affect memory only; Next opens daily use; Back returns introduction |
| 3 daily use | Actual evening plan and explicit sample receipt/Start/stop controls | Morning/evening, product and evidence exploration; Next opens follow-up; Back returns decision |
| 4 personal follow-up | Dedicated authored public exchange/review plus shared plan | Story use remains separate from trial reports; no message or report submission; Back/Next work |
| 5 next step | Dedicated no-new-purchase/service explanation and explore/replay controls | Finish enters free plan exploration; Back returns follow-up |

All five stage numbers round-trip through the unchanged canonical `/maya` route codec. This component does not write URLs or browser history. Parent owns `/maya` mounting and browser Back/Forward/refresh composition.

`getSnapshot`/`subscribe` expose stage, guide, local page/plan route, renderer view, demo receipt/report state and generation. `selectStage`, `next`, `back`, `navigate`, `backPlan`, `exit`, `explore`, `collapse`, `reopen`, `replay`, `reset`, `receiveExample`, `reportExample` and `dispose` operate only on memory. `getPlanProps()` supplies `mode='public-demo'`, its private memory session boundary and separate real `DemoPlanPorts`; it never supplies live `ports`. The enclosing application must retain one controller per mounted demo and call `dispose()` on actual retirement. The view unsubscribes through `useSyncExternalStore`; it creates no global event listener or storage preference.

Exit removes the rail and guide actions, preserving a quiet replay launcher and the plan. Collapse has a show-guide action. Replay retains sample choices/reports; Reset explicitly creates a fresh generation, invalidates old ports/callbacks, clears transient memory and affects no other demo. Disposal retires ports and releases the last report snapshot. Internal product/evidence Back preserves the selected product, routine and predecessor. Direct-entry fallback uses the existing semantic parent. Shared Sheet focus/Escape remains shared; actual DOM focus is unrun.

## Precise shared-renderer limitation

Before implementation, the actual SSR renderer reproduced both limitations, retained in `rebuild-maya-five-stage-seam.test.mjs`:

1. `DecisionControls.tsx` rejects v2 public-demo choices even when separate in-memory DemoPlanPorts are present, because its v2 guard requires client mode and a client care port.
2. `UseReport.tsx` requires client mode, v2/v3, an active view and a care port. A public-demo use route renders `use reporting unavailable`, without executing the supplied memory port.

No guard/type was weakened. Stage 2 uses the supported v1 public-demo choice path before any preset use report. Other stages use the v2 reported-use projection. If a preset report already exists, returning to stage 2 preserves v2 rather than hiding stop/unknown use to expose buttons; Reset is the explicit route back to the original choice view. Neither variant consumes or downgrades a live V3 view. Exact public plan content and product identities match across variants.

The full public-demo use form remains unavailable. Preset controls use actual `captureUse` and the actual v2 renderer, with clearly staged known/unknown occurrence dates, Start and stop. Stop needs no identity answer or advisor approval. Unknown Start creates no dated legacy activation. Receipt alone never creates a report, Start or routine change. Self-acquisition needs no fake payment/order. These are demo projections, not successful live Care commands or genuine authorization evidence. A future shared demo-care extension requires a new explicit API/owner decision and review.

## Public content and evidence boundary

Read the full original supplied approval, Root/portal AGENTS, rebuild README, contracts, D01-D48, desktop specification/26-screen manifest, workstreams, current status, acceptance matrix, canonical addenda, source provenance, founder operations, UI rules, actual plan props/modes and public walkthrough/sample/tests before implementation. Applied the task-first UX, test-driven and verification workflows. No Figma/network acquisition was granted or attempted.

- Actual approved `site/advisor/maya-sample.js` blob: `b9d5ee1f366b5ca6c5e4fac88fe85fe8870f4412`, SHA256 `0958bc22bd2b94fa88e2a19f5aaca4527de3c2f43c48a6b2866f86f33d507aab`.
- Public later-story source `site/walkthrough/maya.js` blob: `4d1bf7a776bf76c107a613039568d630ab2ed703`, SHA256 `b0c00c241c338c26e64e517683824c57e19273e21a4a66c457870de4a2428d31`.
- All seven source decisions, identities, guides, instructions, comparisons and evidence survive the canonical adapter. Morning remains water rinse, CeraVe PM, sunscreen and optional makeup. Evening remains conditional single makeup removal, comfortable cleanser and moisturizer. Treatment is proposed until an explicit sample Start. The author's gradual introduction, patch test, dry/intact skin, avoidance, irritation response and stronger-formulation evidence limits remain intact.
- Images deliberately use the existing neutral unavailable fallback. No automatic image/resource request is emitted by SSR. Public source links remain optional links; no external page was fetched or clinically revalidated. Source wording is preserved, including proper identities; newly authored guide UI is lowercase.
- The later review is exactly the already-public authored story: limited uses, unknown exact Start, unchanged marks and no additional purchase. It does not assert an observed outcome or replay those reports into trial state. No clinical score, race/Fitzpatrick inference, private four-client material, recording or credential was used.

The guide rail is outside the actual renderer. Its CSS has a 336px rail, compact 1440px rail, stacked laptop variant, explicit 390/320px layouts, hide/show and reduced-motion handling. All token references resolve to existing shared tokens; no new palette/control system or positioning over care controls. These are source variants, not measured reflow, frame match or accessibility acceptance.

## Verification and preserved failures

Every logged command prints its real exit before the owned runner writes a unique read-only log. No assertion, timeout, budget or old test was lowered. The original source-membership assertion failure below remains preserved separately from its corrected emitted-code check.

| Check | Result | Exact retained artifact |
| --- | --- | --- |
| Missing approved five-stage model, before production edit | RED 0/1, exit 1, explicit assertion rather than import/setup failure | `red-stages-1793560622158.log` |
| Initial controller module path typo | Setup failure, exit 1, not behavioral RED | `red-controller-1793560765596.log` |
| Disposal retained last report snapshot | Meaningful RED 6/7, exit 1 | `red-cleanup-1793560770660.log` |
| CSS used undefined tokens | Meaningful RED 8/9, exit 1 | `red-render-1793560885048.log` |
| New suite, initial closure-membership assertion | 24/25, exit 1 | `new-suite-1793560985189.log` |
| Final new source/pure/SSR suite | **25/25, no skip/cancel/failure**, exit 0 | `new-suite-final-1793561211595.log`, SHA256 `08bfaa0fa153a9dcc49a0f9152c1b2df6e55461cd8d255b233a695f578643ca5` |
| Retained client guidance source suite | **74/74**, exit 0 | `retained74-1793561137726.log`, SHA256 `caa5a172c59c5b770da144a9160046f79c7b6c12bfbab74fa5f5f5a5a11e9112` |
| Retained client/care/protocol/SSR suite | **122/122**, exit 0 | `retained122-1793561189672.log`, SHA256 `22df3cfdd37dc94b5fc5bbf6271cdd3ca09b8e6ddc902ca98a828c2b29ad3078` |
| Retained residual source suite | **25/25**, exit 0 | `retained25-1793561136783.log`, SHA256 `4561296b63d25322c5987a670df45f40a70be7fef2117bd2d624480362f8dc40` |
| Full new TS closure, actual declarations and SSR/type tests | strict/noUnchecked/verbatim/skipLibCheck=false, exit 0 | `strict-new-final-1793561103141.log`, SHA256 `28769211aaac2764a493f498af9bc2f8403163879012b87a69b8dcc04a74af2c` |
| Configured frontend / session TS | both exit 0 | `frontend-final-1793561263507.log`, `session-1793560987050.log` |
| Existing UI guard plus new CSS token/color checks | exit 0; old budget unchanged | `ui-1793561186877.log`, new suite |
| Actual browser-target compiler, write:false | 2,170 inputs, 2 outputs, exit 0; no browser execution | `compiler-current-1793561275940.log` |
| Original protected paths and whitespace | 1,991 original paths byte/mode exact, all 113 SQL including 62 canonical exact; diff check exit 0 | `initial-protected.json`, `protected-current.json` |

Strict setup failures are preserved: TS6 initially rejected a file-list command without `--ignoreConfig`; the corrected fullstrict command then exposed missing existing CSS declarations and test-only navigation/React children typing. The final command includes the real `src/ui/assets.d.ts`, exact strong flags and corrected tests. No production type was relaxed. `strict-new*` logs preserve exits 1/2/2/0. Compiler proof extraction initially mishandled a trailing directory slash; `compiler-1793561259493.log` exit 1 is preserved, corrected compiler exit 0 follows. Early read-only lookups also encountered nonexistent optional filenames and an absent hook; those terminal failures are not product evidence.

The initial dependency preflight was overly strict about the checked-in workspace link `shelv-advisor-session-candidate -> ../session-integration/runtime`. It failed before copying. Corrected proof checks literal relative links resolve within each respective portal, all ancestors are nonsymlinks, both locks match and both directories are on the same device. Authorized `/bin/cp -cR` copied the initially absent own portal dependencies; **8,525 file/link hashes and modes match Parent**, including the literal local workspace link. No installation, shim, Auth fixture copy, external symlink, Root dependency write or config change occurred.

Actual shared guidance imports `TransportError` from `transport/session.ts`. The original assertion that this file was absent was false. Current tests pin that one transport input, inspect emitted code and deny all session/transport factories, endpoint, fetch and cookie usage. The actual bundled browser-target output retains only **639 bytes for TransportError**, with no `createSessionTransport`, cookie factory, ApplicationSession, endpoint or fetch call. Network/storage traps observed **zero effects** during actual SSR plus all deliberate demo actions. This does not establish real Auth or browser isolation.

Write:false JS: 722,116 bytes, SHA256 `86f70dc7a952fc7b3ce576a2735244c3cd711daf9e91a5554a93f4a10d78e08c`. CSS: 12,280 bytes, SHA256 `3301057c86877b9fbb1fba9c6108c655728507d0adc6dd40743da648b6454415`. Input/output graph SHA256 `83904ccc717ad2ee5612937b873cd0b77c633504019f388e3be8faf0c38696e3`. The graph compiler does not write those JS/CSS outputs, launch a server or execute a browser.

Exact command recipe from repository root, with the absolute Node above (abbreviated as NODE only here):

```sh
NODE --experimental-strip-types --test --test-concurrency=1 apps/portal/tests/rebuild-maya-five-stage-{model,controller,seam,render,content,boundary}.test.mjs
NODE --experimental-strip-types --test --test-concurrency=1 apps/portal/tests/rebuild-plan-guidance-{context-source,controller,port,hydration,presentation,ssr,decision,observation}.test.mjs
NODE --experimental-strip-types --test --test-concurrency=1 apps/portal/tests/rebuild-plan-guidance-residual-source.test.mjs
NODE --experimental-strip-types --test --test-concurrency=1 apps/portal/tests/rebuild-{app-care-composition,app-care-render,app-ports,app-session,app-state,app-render,app-callback,app-start,app-preview-context,app-continuation,care-ports,review-request,plan-model,care-plan-model,use-notes-model}.test.mjs tests/portal-care-{contract,handler}.test.ts
NODE apps/portal/node_modules/typescript/bin/tsc -p apps/portal/tsconfig.frontend.json
NODE apps/portal/node_modules/typescript/bin/tsc -p apps/portal/session-integration/runtime/tsconfig.json
NODE apps/portal/node_modules/typescript/bin/tsc --ignoreConfig --target ES2022 --lib ES2022,DOM,DOM.Iterable --module ESNext --moduleResolution Bundler --jsx react-jsx --strict --noUncheckedIndexedAccess --noEmit --allowImportingTsExtensions --verbatimModuleSyntax --skipLibCheck false --types react,react-dom --typeRoots apps/portal/node_modules/@types apps/portal/src/ui/assets.d.ts apps/portal/src/features/walkthrough/maya/public-source.d.ts apps/portal/tests/rebuild-maya-five-stage-types.ts apps/portal/tests/rebuild-maya-five-stage-ssr.ts
NODE apps/portal/scripts/check-ui-system.mjs
NODE apps/portal/tests/rebuild-maya-five-stage-compiler.mjs
git diff --check
```

## Preservation and handoff

All five imported originals remain exact against INPUT_PROVENANCE, including the 95,388-byte input SHA256 `c45701f9f54fd2b1dbb09bbd7aa2b9b437e9059aa6032b6f39411fe2e7f6efbd`. Root lock remains `5c57c9aec9e4585066e032e234d610a77cbffd9a51f82700c158fc37fe01b5c2`; portal lock remains `bc914f3a9c9f24e44f02e3cff2804651147385ea5abda58a064531329ef23203`. All other baseline tracked paths/modes remain exact. Ordinary Git committed only owned new files; actual commit hooks are absent, none bypassed. Remote fetching was denied, so no current-host freshness claim is made from the local origin/main ref.

Evidence home: own ignored `.local-artifacts/portal-rebuild/maya-five-stage/`. `EVIDENCE.json` inventories 28 files through the source checkpoint, SHA256 `d32a168b9fea387944ec17222e0f905a14d16de66bcf732bc8ec2549a4ae6c38`; later report/final Git receipts are separate. Full command argv, true exits, raw failures and checksums are preserved. No whole unrelated workspace was duplicated.

**Parent next:** commission a NEW independent Sol/xhigh review of these exact owned commits and counterexamples before activation; mount only after admission. Parent owns shared shell/provider/controller lifetime and `/maya` URL/history integration. Fresh explicit grants are required for actual DOM/keyboard/focus/a11y, 1800/1440/laptop/390/320 screenshots and frame comparison, human comprehension, connected/genuine and release work. No representative-human acceptance is claimed.

No browser/preview, OS process inventory, native fixture, PG/DB/SQL, real Auth/Storage, Docker/SQLite, external fetch/provider, private Source or blocked Guidance-private-return/M65 check was run. Retained HTTP/session tests are explicitly synthetic; they are not real financial/Auth evidence. Root full suite/types/Expo, full portal/browser suites, real backend migration rehearsal, exact-head CI and production actions are unrun for this slice. No publication, message/email, upload, money, purchase, fulfillment, role change, push/PR, merge or deploy occurred. The candidate does not close full D01-D48/V01-V17 acceptance.

## MF1/P2 correction, 1 November 2026

**Author source correction only, pending NEW independent R2.** R1's specification/completeness FAIL and correctness/quality FAIL remain historical, unchanged evidence. This correction does not self-accept the full tour or activate `/maya`.

The bounded follow-up starts from clean `4535b283c0e1223b641647cbd3461eed588884b0` in the same worktree/branch. Authoritative NEW task ID, explicitly forwarded after the initial gate: `node:delegated-task:command%3Amcp%3Add730894-0fab-4a94-873d-743422eae122%3Athread-send%3Aw3-maya-reopen-stage-mf1-source-fix-20261101`. The backing thread remains the original thread named above; the actual active run is `run:thread:thread%3Adelegated-task%3Acommand%253Amcp%253Add730894-0fab-4a94-873d-743422eae122%253Adelegate-task%253Aportal-rebuild-w3-maya-five-stage-source-20261101-r1:ordinal:2`, ordinal 2. Neither the old task ID nor a run/thread ID was substituted for this NEW task ID.

Initial and final LIVE capabilities/descriptors, self configuration and actual Parent configuration confirm `codex/gpt-6.1-sol`, `reasoningEffort=xhigh`, `serviceTier=default`. The actual T3 project `ac0af19d-d404-4f53-a870-02bfd76c2a80` has `defaultModelSelection=null`; that is distinct from the repository/global Codex defaults and eight role files, which pin Sol/xhigh. No project/default/role/capacity setting was changed. Explicit Node remains `/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node`, `v22.23.0`, with actual TypeScript `6.0.3`. No child or resource was acquired.

### R1 input and reproduced defect

Before the source edit, read and copied the FULL `97d111d023ce341c1c00b500f5636a433fcac33c` report from reviewer worktree `t3-4ca6ee4f`, verified its physical bytes against the Git object, and preserved the full task context, original probes, SSR HTML, logs, original author evidence and relevant source/guards. The report is 21,408 bytes, SHA256 `99ece23c4479e7497530c97fc0ce6686d1235c87f9c8df6765aaf39b63c7d197`. All 96 available review files were copied read-only; every one of the original 92-entry review EVIDENCE records matches its hash and length. The approved originals, including the 95,388-byte input, remain exact. No private client/Source input was read.

Both original probe files were executed byte-for-byte unchanged against old and corrected source; their assertions were not rewritten:

| Probe | Exact script SHA256 | Old replay | Corrected replay |
| --- | --- | --- | --- |
| `reopen-probe.mjs` | `9a1a1937cbf0ba63a5f455bc1384321d5e7827d4035daa710e28ec38bf8324cf` | `old-probe1-1793563632893.log`, exit 1 | `new-probe1-1793563827701.log`, exit 0 |
| `reopen2-probe.mjs` | `3e1f73f9700279f650138b1dcdbfade2b17be0bd3882f39777bc14d27d2b93e9` | `old-probe2-1793563633435.log`, exit 1 | `new-probe2-1793563828229.log`, exit 0 |

The unchanged failure is `resume must restore the page belonging to the retained stage`. Stages 1-3 remain positive controls. Stage 4 formerly reopened with `stage=4/page=plan`, losing its follow-up page; stage 5 similarly lost its next-step page. Corrected replays retain stage 4/5 and restore `follow-up`/`next-step`, including the exact unique content marker. The original first probe's broad stage-5 phrase was non-unique; its original result and the second probe's exact-heading result remain distinct. Original R1 raw logs retain SHA256 `ec160807cdddac3215c31043f5c9650c44cc00b40339b7a6812cf1a2def1f60f` and `f2899a0d2e78211094daac3282903fdccc13e2eab2e06e3de6014f1d69b2d990`. The formerly unrun adjacent Explore path is now explicitly exercised, rather than attributed to R1.

### Minimal correction and coverage

Only `controller.ts` changes in production: `reopen()` opens the guide and calls existing `selectStage(stage)` instead of emitting the inconsistent state. The existing stage entry restores the selected stage's page and canonical plan route, and retires the exploratory predecessor. Stage number, lease, transient memory, choices, reported use, receipt state and generation remain unchanged. Replay still deliberately returns to stage 1 while retaining demo data; Reset alone clears demo data and advances generation. No model helper, public API/type, renderer, route codec, transport, client-mode guard, source data, live port or authority extension was needed.

The NEW `rebuild-maya-five-stage-reopen.test.mjs` observes the actual native Button props emitted by unchanged shared wrappers, returns the original React elements and invokes original callbacks. Actual SSR uses MayaWalkthrough, ClientPlan, NavigationProvider and OverlayProvider. There is no replacement Button/hook, fake current-owner predicate or successful live operation port. This is pure SSR/callback evidence, not DOM interaction, mounted lifecycle, focus or accessibility proof.

The initial new regression is meaningful **RED 12/23**, with 11 page/route/reentrant-restoration failures. The first corrected run is **22/23** because a newly authored assertion incorrectly expected the top-level evening plan's semantic Back parent to remain evening. The unchanged route codec explicitly defaults a top-level plan's parent to morning. That test expectation was corrected against the inspected contract; stage 3 itself still must restore the evening target. Both test versions and raw results remain. No original test or R1 predicate was changed. The corrected 23/23 suite then expanded the same disposal and reentrant checks to all five stages, yielding **31/31**.

Those 31 cases cover all five exit/explore/collapse/reopen combinations, chosen page/content/route restoration after real product/evidence exploration, preserved sample choice/receipt/unknown Start/stop/transient memory, original product/evidence Back, guide forward/back and finish, Replay versus Reset, captured launcher/navigation/port use after disposal, another-demo isolation, and reentrant explicit exit during reopen notification. The reentrant callback observes a fully restored target, and its later explicit exit remains final. Original shared memory/session/late-result guards are unchanged.

### Actual checks and retained qualifications

Every command uses the explicit Node above and the copied global network-denial preload. Each real exit prints before a unique read-only log is written. Source/pure/SSR/finite synthetic HTTP and compiler activity only; no server/browser/native/DB/resource execution. All successful groups below have zero failure/skip/cancel.

| Check | Actual result | Own MF1 log |
| --- | --- | --- |
| New reopen regression | 31/31, exit 0 | `new-reopen31-1793564121479.log`, SHA256 `41165197e125359692d1a6df33e1d42e52dd31c7fdb880403ad1c97b198238fa` |
| Unchanged original candidate suite | 25/25, exit 0 | `retained-candidate25-1793563960450.log` |
| Retained guidance / App-care-protocol / residual | 74/74, 122/122, 25/25, all exit 0 | `retained74-1793563961989.log`, `retained122-1793563963152.log`, `retained25-1793563960054.log` |
| Exact preserved scheduled R1 callback runner, rerun by author | 8/8, exit 0 | `original-scheduled8-1793563886136.log` |
| Actual full new TS closure | strict/noUnchecked/verbatim/skipLibCheck=false, exit 0 | `strong-1793563998677.log` |
| Configured frontend / session / UI | all exit 0 | `frontend-1793563999651.log`, `session-1793563996390.log`, `ui-1793563994600.log` |
| Actual full browser-target compiler, write:false | 2,170 inputs / 2 outputs, exit 0 | `compiler-1793563995399.log` |

Original R1's raw **7/8 then 8/8** scheduling qualification is preserved: three assumed microtask turns did not finish the real async choice/read chain; the scheduled runner uses one bounded `setImmediate` turn with the same assertions. The new regression uses that disclosed scheduler turn. This rerun is author verification of the preserved runner, not a new independent verdict. The original caution-removal mutation remains **NON-SENSITIVE 8/8** because it changed an already-empty field; it is not negative proof. The separate sensitive title/Next/cleanup/network mutations and original stage-2 caution probe retain their original attribution and bytes. No mutation result was relabeled or silently rerun as an independent acceptance round.

One own evidence-copy setup attempt used the wrong review-manifest key (`files` rather than actual `entries`) and exited 1 before source/probe execution. Its terminal error and copied-original state remain recorded in `setup-error.txt`; it is not RED. Existing Node module-type and synthetic SDK warning output remains unfiltered. No test/compiler flag, timeout, assertion budget, package, declaration or guard was relaxed.

The exact command families above were rerun, with `--require ./.local-artifacts/portal-rebuild/maya-five-stage-mf1/deny-network.cjs`. The new command is `NODE --require ./.local-artifacts/portal-rebuild/maya-five-stage-mf1/deny-network.cjs --experimental-strip-types --test --test-concurrency=1 apps/portal/tests/rebuild-maya-five-stage-reopen.test.mjs`. The full strong command is unchanged, including actual CSS/React declarations. Exact expanded argv, statuses, logs and hashes are in the MF1 evidence home; the unchanged two probes run from distinct old/new artifact directories to preserve their `wx` SSR outputs.

Current write:false JS is 722,287 bytes, SHA256 `7e779517128b0d312c834f13d7061aa61023c3f3672935599a7a7ce330bbfd30`; CSS remains 12,280 bytes, SHA256 `3301057c86877b9fbb1fba9c6108c655728507d0adc6dd40743da648b6454415`. Graph SHA256 `6e7a207591e89cc8ab6a565c269ca705f7adb0438534832ff28a96009a4b2f42`. The compiler retains only the same 639 TransportError bytes, with no emitted session/cookie/Application factory, endpoint or fetch call. Its unique new graph was copied into MF1 evidence; no existing author artifact was overwritten.

### Preservation and next gate

Only three tracked paths are authorized: the controller, NEW reopen test and this append-only report. The original 18,252 report bytes remain an exact prefix, SHA256 `1d278c94589d34088dd5fed8a396ea299527097b76858da4c44f97481512988a`. All other 2,008 baseline tracked paths remain byte/mode exact. All 1,991 original Root paths, all 62 canonical/all 113 SQL files, both locks, packages/configs, shared code, original candidate tests and raw author/R1 evidence remain exact. Existing own dependency hashes/modes/literal links still match all 8,525 previously authorized APFS entries; no new copy/install/shim or dependency write occurred. Ordinary hooks were inspected and absent; none were bypassed.

Own ignored evidence: `.local-artifacts/portal-rebuild/maya-five-stage-mf1/`. `EVIDENCE.json` inventories 167 files through final31 checks, SHA256 `b9b6d0e734b41e280b090f6269c0d880d168ff1f055b48956755d670a77a10d5`, excluding itself and later report/Git receipts. It preserves the complete R1 report/context/raws, all original probe/SSR inputs and old/new outputs, initial/intermediate/final new test versions, exact source before the edit, live runtime/config/project proof, protected inputs and command results.

Parent must commission **NEW independent R2** before admission. The actual core public-demo use form and post-preset choice limitations remain unchanged and explicit; no client-mode override or V3 semantic downgrade was introduced. Parent still owns `/maya` App/provider/lifetime and browser-history composition. Browser/viewport/frame/keyboard/focus/a11y/human/genuine/CI/full D01-D48 acceptance remains unrun/open. No resource, nesting, Root write/import, external fetch/provider, blocked Guidance/M65 retry, publication, message, source upload, money/order/fulfillment, permission change, push/PR, merge or deployment occurred in this bounded correction.
