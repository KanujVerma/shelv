# W7 Maya five-stage independent source R2

Owner: Kanuj. 1 November 2026. Report-only review of the frozen public-demo candidate through `194866f468945504ce4085be57eeb05728510653`.

**MF1 correction specification: scoped PASS. Correctness/quality: scoped source/SSR PASS. Full five-stage/D42 completeness: INCOMPLETE.** Both original unchanged R1 probes fail on the old inputs and pass on the successor. The selected stage, its distinct page and canonical route now agree after reopening. No new material finding was established in the exercised scope. This does not accept the full public demo, actual Application integration, mounted DOM, accessibility, browser history, genuine authorization, CI or release. The original full rebuild remains open.

R1 report `97d111d023ce341c1c00b500f5636a433fcac33c` and its FAIL verdicts remain immutable historical evidence. Its 21,408 physical bytes match that Git object, SHA256 `99ece23c4479e7497530c97fc0ce6686d1235c87f9c8df6765aaf39b63c7d197`. The append-only author response was assessed against source and independently rerun, not accepted from its counts.

## Exact inputs, imports and preservation

Own T3 worktree: `/Users/kanuj/.t3/worktrees/shelv/t3-f9a41ef4`, branch `t3/f9a41ef4`. Initial clean review base: `d4a3314ecd81e4c3b544a8919834429e90c05d06`. The existing d4 type-only prerequisite was already present and was not replayed.

Actual physical Parent had intentionally advanced clean to `a06fd0564ec189e8b9c8f2475d1742eb07834418` through owner-policy code, tests and reports. It was **not** at d4. An initial assertion detected that difference; the premature initial message describing Parent as same-base was explicitly corrected before source/probes/imports. Parent's authoritative steer retained d4 as the frozen review base and forbade importing its unrelated advance. No rebase or unrelated ancestor import occurred. All preservation comparisons below use Git d4, not evolving physical Parent HEAD.

Inspected every input's exact changed paths before ordinary ordered `git cherry-pick -x`; all three imports completed without conflicts or manual changes:

| Ordered original input | Local attributed import |
| --- | --- |
| `bb8760ef4d33e21a05d7a43a5aa7a558d7cae3ba` | `80d8ffbe739bfc51a8ffb15c796bb2cbe779273b` |
| `4535b283c0e1223b641647cbd3461eed588884b0` | `cf5f9d99e8199c15a5461e697f148b09326b2b21` |
| `194866f468945504ce4085be57eeb05728510653` | `9b7ff59d492bd9332dd29c1acf17a646fbf9e591` |

The exact source head for all current checks is `9b7ff59d492bd9332dd29c1acf17a646fbf9e591`. All 20 candidate-owned paths have the target's exact Git blobs/modes and physical bytes. All 1,991 frozen-base paths retain their bytes and filesystem modes, including all 62 old canonical migrations, all 113 SQL files, packages, locks, configurations, Application, navigation, shared renderer and existing tests. SQL was protected-byte input only, never executed. The sole authored tracked path is this report. Return only its new report commit; exclude all three import ancestors.

All candidate entries are mode `100644`:

| Path | Final Git blob |
| --- | --- |
| `apps/portal/src/features/walkthrough/maya/controller.ts` | `a7c2b043bc77609cd68bffdb49f210d30ec98684` |
| `apps/portal/src/features/walkthrough/maya/fixture.ts` | `016ce7b1f20a827614422ab601b615813b7324c2` |
| `apps/portal/src/features/walkthrough/maya/index.ts` | `84cf98e96e4fbb7d2700da5b20dddd7da529372b` |
| `apps/portal/src/features/walkthrough/maya/maya.css` | `b20585c2f3df855f54b5ff44a278a9dca7e32dc1` |
| `apps/portal/src/features/walkthrough/maya/model.ts` | `c15ef7091ec19b27de41873c0308859fbad06bc9` |
| `apps/portal/src/features/walkthrough/maya/public-source.d.ts` | `6f53f4c0fecf09bb31840d26e9a05afe8ad37efc` |
| `apps/portal/src/features/walkthrough/maya/view.tsx` | `415eeb297e9356bc4ec91106689f5af3595face0` |
| `apps/portal/tests/rebuild-maya-five-stage-boundary.test.mjs` | `a9aa6d95b0415b6f69493bde94286d192329ef1a` |
| `apps/portal/tests/rebuild-maya-five-stage-build.mjs` | `90f5032213cc99e61dbfcf6ba75137b5756cd542` |
| `apps/portal/tests/rebuild-maya-five-stage-compiler.mjs` | `f89ec6f990fb14f3348f3921aafa94ac1373021d` |
| `apps/portal/tests/rebuild-maya-five-stage-content.test.mjs` | `c5602f75b105cdea32a224bb87032d33c40262b6` |
| `apps/portal/tests/rebuild-maya-five-stage-controller.test.mjs` | `0cb3e59b25666c49aa03628f4723fbc640fa0c48` |
| `apps/portal/tests/rebuild-maya-five-stage-model.test.mjs` | `b2785075e4d50e09ae7f35b17eb62f2a1100ca4c` |
| `apps/portal/tests/rebuild-maya-five-stage-render.test.mjs` | `81e7db93ffa3ec38aad6ce1b35e477f96484a9d0` |
| `apps/portal/tests/rebuild-maya-five-stage-reopen.test.mjs` | `6b5ffa91b329c6cf1b453200760b9abf202a55c8` |
| `apps/portal/tests/rebuild-maya-five-stage-run.mjs` | `42387cab58d43c345d14ded173c9e219b426eddd` |
| `apps/portal/tests/rebuild-maya-five-stage-seam.test.mjs` | `71d8e4ca88626f078dd8780ec0a3a5ba3e8e2de7` |
| `apps/portal/tests/rebuild-maya-five-stage-ssr.ts` | `127acefa5dab11001a1757631b05027cfefa3151` |
| `apps/portal/tests/rebuild-maya-five-stage-types.ts` | `6cf506a009cdd23127e4d2faa4cc77c1ca8cf91e` |
| `docs/portal-rebuild/research/W3_MAYA_FIVE_STAGE.md` | `6f2b77aa062d92611adf4b4e81c773da18778885` |

## Runtime, original inputs and evidence custody

Authoritative actual task ID, forwarded separately by Parent after the initial gate: `node:delegated-task:command%3Amcp%3Add730894-0fab-4a94-873d-743422eae122%3Adelegate-task%3Aportal-rebuild-w7-maya-five-stage-source-review-20261101-r2`.

Child thread: `thread:delegated-task:command%3Amcp%3Add730894-0fab-4a94-873d-743422eae122%3Adelegate-task%3Aportal-rebuild-w7-maya-five-stage-source-review-20261101-r2`. Actual backing run: `run:thread:thread%3Adelegated-task%3Acommand%253Amcp%253Add730894-0fab-4a94-873d-743422eae122%253Adelegate-task%253Aportal-rebuild-w7-maya-five-stage-source-review-20261101-r2:ordinal:1`, ordinal 1. Parent: `d632030a-18f7-4dec-a2c9-f5c0418c3fd5`. None of these was used to infer the task ID.

Initial/final LIVE catalog, self configuration and explicitly queried actual Parent configuration confirm `codex/gpt-6.1-sol`, `reasoningEffort=xhigh`, `serviceTier=default`, full-access/default interaction. Current model descriptors explicitly offer xhigh/default. The catalog's caller `parentThreadId` again names the child in this harness; durable thread metadata supplies the actual Parent relationship. Project `ac0af19d-d404-4f53-a870-02bfd76c2a80` has `defaultModelSelection=null`. Global selected defaults, repository defaults and all eight actual role files pin Sol/xhigh; global service tier is default. Own/Parent project-role bytes match. No runtime, capacity or project default was changed; no nested task was started.

All Node/compiler/probe commands select `/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node`, initially/finally `v22.23.0`. Ambient `/usr/local/bin/node` was v20.11.0 and was rejected for this work. Actual TypeScript is `6.0.3`, using the real React/Node/library declarations and unchanged strict flags.

Own root and portal dependencies were absent. Before either copy, all four root/portal lock hashes matched: root `5c57c9aec9e4585066e032e234d610a77cbffd9a51f82700c158fc37fe01b5c2`, portal `bc914f3a9c9f24e44f02e3cff2804651147385ea5abda58a064531329ef23203`. Both complete closures passed nonsymlink-root/ancestor, same-device, initially-absent-destination and literal relative-link containment checks. Only then authorized `/bin/cp -cR` cloned Parent root and portal node_modules to own ignored paths. Full after-copy and final parity covers 43,212 root entries/42 links and 9,070 portal entries/11 links, including directory modes; portal has 8,525 file/link entries. The checked-in local workspace link stays within each respective workspace. No install, shim, declaration replacement, flag lowering, credential/Auth-fixture copy, dependency change or Parent write occurred.

Read the full current approval/input/appendices/D01-D48, AGENTS, rebuild entry point/contracts/workstreams/status/acceptance/addenda, original author/review briefs, R1 report, complete author response, source/guards and relevant retained tests. The five approved originals match INPUT_PROVENANCE, including 95,388-byte APPROVED_INPUT SHA256 `c45701f9f54fd2b1dbb09bbd7aa2b9b437e9059aa6032b6f39411fe2e7f6efbd`. Preserved 204 supplied task-specific evidence/report files, 9,747,086 bytes, without duplicating unrelated workspaces. All original author28/R1-92/MF1-167 manifest entries independently match their lengths and hashes. All 80 copied command logs were read and their raw exits/failures inspected. Full originals are retained without rewriting historical FAILs.

Evidence home: `.local-artifacts/portal-rebuild/w7-maya-five-stage-source-r2/`. Foreign saved probes/runners were first inspected, copied into this owned ignored home, hash-checked and bounded to actual current-worktree source imports. None was executed from a foreign worktree. Each own runner prints the true exit before writing a unique read-only log. Complete argv, raw warnings, failures, hashes, source/dependency inventories and SSR HTML remain there. Ordinary Git hooks contain samples only; no hook was bypassed. Terminal audit examines only its own pure Node handles/requests, not OS processes.

The review EVIDENCE manifest inventories 278 retained files, SHA256 `2894a44f66db1245c7f316d3c1af672534f9f4186fbee5e2da4736a0b5fe5e35`, excluding itself and later commit receipts. The terminal pure audit reports zero non-stdio handles and zero pending requests in its own process. Dependency clones are retained under their separately inventoried ignored paths.

## MF1 reproduction and correction

[Reopen](../../../apps/portal/src/features/walkthrough/maya/controller.ts:108) now opens the guide and invokes existing `selectStage(stage)`. Stage entry restores the chosen stage's page/route and retires the exploration predecessor before notifying subscribers. It preserves stage identity, lease, memory, choices, use, receipt state and generation. Replay deliberately selects stage 1 while retaining data; Reset clears the isolated demo and advances its generation. No shared renderer, client-mode override, core guard, model helper, schema or authority extension was introduced.

Both complete original scripts are byte-for-byte unchanged across old and new runs:

| Probe SHA256 | Old source after first two imports | Successor after third import |
| --- | --- | --- |
| `reopen-probe.mjs`: `9a1a1937cbf0ba63a5f455bc1384321d5e7827d4035daa710e28ec38bf8324cf` | `old-probe1-1793565166489.log`, exit 1 | `new-probe1-1793565176340.log`, exit 0 |
| `reopen2-probe.mjs`: `3e1f73f9700279f650138b1dcdbfade2b17be0bd3882f39777bc14d27d2b93e9` | `old-probe2-1793565166944.log`, exit 1 | `new-probe2-1793565176757.log`, exit 0 |

Both old failures are the original predicate `resume must restore the page belonging to the retained stage`: stage 4/5 retained the guide stage but lost `follow-up`/`next-step` to `plan`. Stages 1-3 and initial distinct 4/5 renders are positive controls. The first script's broad stage-5 text also appears elsewhere; the second script's unique section heading independently removes that ambiguity. Both current runs restore distinct stage content as well as the page value. Raw old evidence is not a current-input green.

The unchanged NEW31 regression independently passes actual shared Button callbacks, all five exit/explore/collapse/reopen targets, product/evidence exploration, canonical route restoration and retired predecessor, preserved choice/receipt/unknown Start/stop/memory, finish/replay/reset, disposed handles and another-demo isolation, plus reentrant exit. It observes native button props emitted by unchanged wrappers and invokes their original handlers; it replaces no Button, hook, controller, session-current predicate, owner, role or operation port. This is pure SSR/callback evidence, not DOM dispatch or mounted React lifecycle.

Seven additional independent cases pass: reentrant Reset from each of the five reopened stages retires the old memory/lease without altering another demo; actual PublicEntry still reports all five Maya deep links unavailable; and an actual ApplicationSession/retained-cookie/client-port/Root-decoder composition over closed synthetic HTTP accepts the public fixture, refuses an extra private field, enforces cookie/CSRF/no-store metadata, rejects a held read after actual local signOut, retires the old port and stays separate from the demo's receipt/Start/stop/reopen actions. Synthetic response generation is explicitly not genuine Auth, server authority or persistence proof.

## Independent executed checks

All passing test groups below have zero failures, skips or cancellations. Full logs preserve existing module-type and synthetic SDK warnings.

| Check | Result | Own immutable log |
| --- | --- | --- |
| NEW reopen regression | 31/31, exit 0 | `reopen31-1793565177697.log` |
| Unchanged original candidate suite | 25/25, exit 0 | `candidate25-1793565178116.log` |
| Retained guidance source/controller/SSR | 74/74, exit 0 | `retained74-1793565192916.log` |
| Retained App/care/session/Root protocol/SSR | 122/122, exit 0; finite HTTP/successful server replies synthetic | `retained122-1793565193901.log` |
| Retained residual source | 25/25, exit 0 | `retained25-1793565190703.log` |
| Exact preserved scheduled R1 callback runner | 8/8, exit 0 | `scheduled8-1793565231193.log` |
| Additional independent adjacent cases | 7/7, exit 0 | `adjacent7-1793565304735.log` |
| Full new TypeScript closure | strict/noUnchecked/verbatim/skipLibCheck=false, exit 0 | `strong-1793565235773.log` |
| Configured frontend/session types | both exit 0 | `frontend-1793565237070.log`, `session-1793565232196.log` |
| Existing UI guard | exit 0, budgets unchanged | `ui-1793565229768.log` |
| Full browser-target compiler, write:false | 2,170 inputs, 2 outputs, exit 0 | `compiler-1793565230654.log` |

Current browser-target JS is 722,287 bytes, SHA256 `7e779517128b0d312c834f13d7061aa61023c3f3672935599a7a7ce330bbfd30`; CSS is 12,280 bytes, SHA256 `3301057c86877b9fbb1fba9c6108c655728507d0adc6dd40743da648b6454415`. Both match the author's current outputs. The own graph SHA256 is `22859429e84b59c480875b57b7af7707e87669ebee2fd3ae1798e71943ddd56e`; workspace-specific output paths differ. The closure includes `src/transport/session.ts`, but only 639 emitted TransportError bytes. Actual emitted code excludes session/cookie/Application factories, endpoint and fetch calls. SSR/deliberate demo actions pass network/storage traps. Input-file absence would be a false assertion. write:false compilation proves no browser execution, viewport or connected isolation.

Sensitivity remains distinct from candidate results. The copied final R1 runner now has an independently executed unmutated 8/8 current positive (`sensitivity-current-1793565333039.log`), including its additional product comparison. In-memory Next-to-Back mutation fails 2/8; retained-disposed-reports fails 1/8; inserted external fetch is trapped and fails 1/8; changed actual source title fails 1/8. All four mutated runs exit 1, with no tracked source change. The old caution-removal mutation remains NON-SENSITIVE 8/8 because that field was already empty; it is preserved and not counted as negative proof.

Commands from repository root, with `NODE=/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node` and `REVIEW=.local-artifacts/portal-rebuild/w7-maya-five-stage-source-r2`. Each check was wrapped by `NODE REVIEW/run.mjs LABEL NODE --require ./REVIEW/deny-network.cjs ...`; exact expanded argv/exits are in the logs:

```sh
NODE --experimental-strip-types --test --test-concurrency=1 apps/portal/tests/rebuild-maya-five-stage-reopen.test.mjs
NODE --experimental-strip-types --test --test-concurrency=1 apps/portal/tests/rebuild-maya-five-stage-{model,controller,seam,render,content,boundary}.test.mjs
NODE --experimental-strip-types --test --test-concurrency=1 apps/portal/tests/rebuild-plan-guidance-{context-source,controller,port,hydration,presentation,ssr,decision,observation}.test.mjs
NODE --experimental-strip-types --test --test-concurrency=1 apps/portal/tests/rebuild-plan-guidance-residual-source.test.mjs
NODE --experimental-strip-types --test --test-concurrency=1 apps/portal/tests/rebuild-{app-care-composition,app-care-render,app-ports,app-session,app-state,app-render,app-callback,app-start,app-preview-context,app-continuation,care-ports,review-request,plan-model,care-plan-model,use-notes-model}.test.mjs tests/portal-care-{contract,handler}.test.ts
NODE apps/portal/node_modules/typescript/bin/tsc --ignoreConfig --target ES2022 --lib ES2022,DOM,DOM.Iterable --module ESNext --moduleResolution Bundler --jsx react-jsx --strict --noUncheckedIndexedAccess --noEmit --allowImportingTsExtensions --verbatimModuleSyntax --skipLibCheck false --types react,react-dom --typeRoots apps/portal/node_modules/@types apps/portal/src/ui/assets.d.ts apps/portal/src/features/walkthrough/maya/public-source.d.ts apps/portal/tests/rebuild-maya-five-stage-types.ts apps/portal/tests/rebuild-maya-five-stage-ssr.ts
NODE apps/portal/node_modules/typescript/bin/tsc -p apps/portal/tsconfig.frontend.json
NODE apps/portal/node_modules/typescript/bin/tsc -p apps/portal/session-integration/runtime/tsconfig.json
NODE apps/portal/scripts/check-ui-system.mjs
NODE apps/portal/tests/rebuild-maya-five-stage-compiler.mjs
NODE --experimental-strip-types REVIEW/adjacent.mjs
NODE REVIEW/original-author/maya-five-stage-mf1/review-r1/independent-before-source-mutation-correction.mjs current
NODE REVIEW/original-author/maya-five-stage-mf1/review-r1/independent.mjs current
NODE REVIEW/original-author/maya-five-stage-mf1/review-r1/independent.mjs next
NODE REVIEW/original-author/maya-five-stage-mf1/review-r1/independent.mjs cleanup
NODE REVIEW/original-author/maya-five-stage-mf1/review-r1/independent.mjs network
NODE REVIEW/original-author/maya-five-stage-mf1/review-r1/independent.mjs source
git diff --check
```

The two original probes ran as `NODE REVIEW/old-probe1/reopen-probe.mjs`, `NODE REVIEW/old-probe2/reopen2-probe.mjs`, then the same bytes in `new-probe1`/`new-probe2` after the successor import, using the same global-denial preload and immutable-log wrapper.

## Preserved failures and specification limits

The author's initial new23 RED was 12/23; its first successor run was 22/23. Independent input-only diff inspection confirms the newly authored semantic-parent assertion was corrected from stage-derived evening to the actual shared codec's default morning. Stage 3's target still separately requires evening. The final test expands to 31 cases; no original R1 predicate or original test was changed. The intermediate failure stays failure, not retrospectively green. The actual canonical `parentRoute` default was inspected.

Original R1 callback 7/8 then scheduled8/8 remains qualified: three assumed microtasks did not finish the actual async choice/read chain; one bounded setImmediate turn did. Original author missing-stage RED0/1, cleanup6/7, undefined-token8/9, module-path/setup failures, source-membership24/25, TS6/config/CSS/test-typing exits1/2/2/0, compiler path failure, and MF1 copy-manifest-key setup failure remain raw and attributed. This review reproduced MF1's old inputs; it does not claim an independent historical replay of every earlier author RED or setup failure. Own early failed skill-path lookup, unmatched optional Node-location glob, invalid structured-result storage attempt, transient missing structured tool payload and absent optional source filename were orchestration/look-up faults, not product RED. None caused installation, a flag waiver or resource acquisition.

The actual public sources remain exact: `site/advisor/maya-sample.js` blob `b9d5ee1f366b5ca6c5e4fac88fe85fe8870f4412`, SHA256 `0958bc22bd2b94fa88e2a19f5aaca4527de3c2f43c48a6b2866f86f33d507aab`; `site/walkthrough/maya.js` blob `4d1bf7a776bf76c107a613039568d630ab2ed703`, SHA256 `b0c00c241c338c26e64e517683824c57e19273e21a4a66c457870de4a2428d31`. All seven decisions, products, directions, comparisons, guides and evidence survive canonical adaptation and both schema identities. Morning preserves water rinse, CeraVe PM, sunscreen and optional makeup; evening preserves conditional single makeup removal, comfortable cleanser and moisturizer. Essential cautions/evidence limitations remain in actual shared SSR. Known/unknown Start, receipt not Start, stop without identity/advisor approval, no fake purchase/order and staged-story separation remain exercised. Public links were not fetched or clinically revalidated; no private four-client sources were read.

Two known completion gaps remain reproduced, not waived: the actual core public-demo use form is unavailable; after a preset report, returning to stage 2 retains truthful v2 use and loses choice controls, displaying the reset notice. Reset is the existing way back to v1 choices. Presets are explicitly isolated-memory demonstrations using actual capture/projection/renderer, not connected Care commands. No mode forcing, care-port authority substitute or semantic downgrade was used to hide these gaps. A full interactive public demo needs a separately owned shared seam and fresh review if that extension is selected.

Actual frozen [PublicEntry](../../../apps/portal/src/app/Application.tsx:56) remains an unavailable-demo recovery page for all five Maya deep links; independent actual SSR confirms it. Parent still owns `/maya` Application/provider/controller lifetime, URL/Back/Forward/refresh and scoped history composition. The component's internal PlanNavigationPort and route-codec tests do not prove that integration.

CSS source provides external/compact/stacked rail variants, 1440/laptop/390/320 and reduced motion. It does not establish measured geometry, usable controls/cautions at a viewport, approved-frame match, focus restoration, Escape dispatch, zoom, screen-reader/a11y or representative-human comprehension. Those and mounted React lifecycle remain UNRUN. Private walkthrough sharing remains separately protected.

## Handoff and unrun gates

MF1 is addressed within this source/SSR correction. Preserve the two demo interaction gaps and actual App/history/DOM/frame/a11y/human gates in the full goal. Source/pure, minimally bound copied probes, actual SSR callbacks, finite synthetic HTTP, genuine Auth/persistence, hosted, exact-head CI and release remain different evidence levels. No genuine, hosted or CI result is claimed here.

Root full `npm test`, root app/test type suites, Expo/native export, full portal suite/package, database reset/pgTAP/migration rehearsal, genuine auth/persistence/permissions, notifications/delivery, financial/source/account workflows, exact-head CI, 26-screen/V01-V17 acceptance and release/cutover were not run for this report-only slice. No test skip is counted as acceptance. No browser/preview/DOM, OS process inventory, native/PG/DB/SQL execution/Supabase allocation, Auth/Storage service, provider/credential/network service or fixture resource was used. No blocked Guidance-private-return/M65 retry, rephrase or reroute occurred. Retained source tests are not those blocked checks.

No production/test fix, Parent edit, nesting, grant-wait/poll loop, push/PR, merge/deploy, real-client publication/communication, source upload, permission change, funds, purchase or fulfillment occurred. Own ignored evidence/dependencies are retained; no unrelated state was removed. The authorized deliverable is the single report commit, not admission or completion of the whole rebuild.
