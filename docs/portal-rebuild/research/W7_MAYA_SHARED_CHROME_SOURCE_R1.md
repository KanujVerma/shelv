# W7 Maya shared chrome independent source R1

Owner: Kanuj. 2 November 2026. Independent report-only review of source `a8f617e3871c5ac4161c87050b75a88ac5bc784a` and author report `744834fbe257e6b5aa0a8a84badd32345d327aaf`.

**Specification/completeness: FAIL within the allocated source slice, MSC3/P2. Correctness/quality: FAIL within source/VM scope, MSC3/P2. Root admission is HELD.** The shared shell is restored and the exact CSS-only test successor is independently approved, but the new contact dialog does not meet the required exact-snapshot callback and retirement contract. No production or original test was fixed. Full D42, visual, accessibility, human, genuine-service and release acceptance remain open.

## Consolidated actionable findings

| ID | Severity | Disposition and proof |
| --- | --- | --- |
| MSC1 | P2, prior | Missing shared chrome is addressed structurally: all five actual-App SSR stages now contain the existing PortalShell/sidebar/topbar/content/identity, canonical labels/icons and an external guide. Own shell suite 13/13. This does not reverse Parent's historical browser visual FAIL or establish current geometry. |
| MSC2 | P2, prior | Exact separately authorized successor APPROVED: only one 64-byte CSS SHA literal changes, with complete reverse byte correspondence. Own unchanged original39 remains 38/39, exit1; successor39 is 39/39, exit0. No original failure is relabeled green. |
| **MSC3** | **P2, new** | **Contact ownership and its close callback use repeatable navigation identity rather than the exact originating snapshot; reset does not clear local contact state before retirement observers. Source-expression/VM contract probe over the actual controller/session: 1 pass, 3 fail, exit1. Correct the lifecycle and obtain a fresh complete independent review before admission.** |

### MSC3: exact snapshot and contact retirement are missing

Candidate source: `apps/portal/src/features/walkthrough/maya/view.tsx`, lines18-23, 36 and69-70. The string stored in `contactOwner` is `JSON.stringify([generation,stage,guide,page,route])`. Two distinct actual snapshots can have exactly that string, including after a use report, navigation away/back, or returning to a previous guide stage. The `open` predicate checks that string and the current session only. It does not bind contact state to its originating exact snapshot.

The newly added `onOpenChange` closes by string equality alone. It does not check the original session or `controller.getSnapshot()===state`. Consequently an old closer can clear contact state set under a newer snapshot sharing the same string. The shared `action` wrapper checks exact snapshot/session before `run()`, but neither it nor the contact composition clears contact ownership before `controller.reset()` starts actual invalidation observers. There is no contact cleanup subscription/effect elsewhere in this view. The shared Overlay's controlled-close cleanup releases overlay ownership; it does not supply the missing contact-owner retirement contract.

Independent bounded reproduction:

1. Create the actual stage3 controller. Snapshot A and its real session are retained. Record a preset through the actual controller: snapshot B is different, the session remains current, and A/B contact keys are equal. This is the positive identity-collision control.
2. Evaluate the exact source `open` expression with A's contact owner. Navigate from the evening plan to the morning plan and use actual `backPlan()`. The predicate is false away and true again on return, without another contact activation. Neither route opens a product overlay, so this vector does not depend on product-overlay arbitration.
3. Create the exact source close closure under A, then assign the state recorder the newly opened B key after the actual report transition. Calling the captured A closer invokes the updater and clears B's value to null. The required invariant, that A cannot clear B-owned state, fails.
4. Invoke the exact source `action(controller.reset)` wrapper with actual A props. An actual session-invalidation observer sees the old non-null contact owner; the owner remains retained afterward. The deliberate observer throws, and the actual controller shields it correctly. The required clear-before-observer predicate still fails for local contact ownership.

`contact-negative-plan.json` preserves all three failed assertions, the passing control, executable, argv and unfiltered output. `contact-negative-plan-proof.json` preserves the exact extracted expressions and observed values. The initial `contact-negative.json` uses product navigation; it also gives1/4 but is retained separately. The final plan-to-plan version removes that unnecessary overlay dependency without changing any assertion.

**Proof boundary:** this is source-expression/VM evaluation plus the actual frozen controller, its actual sessions and actual transitions. TypeScript AST extraction compiles the candidate expressions without rewriting them. A small explicit state recorder witnesses the setter/updater; it is not React state, a hook substitute, a mounted component or a successful authority/currentness/operation stub. Actual shared-App SSR is independently exercised in shell13/current39, but SSR does not retain mounted `useState` across renders. These probes establish the source-contract failure. They do not establish a naturally delivered stale Radix callback, mounted dialog reopening, focus failure, ordinary browser visibility, cross-client disclosure or a privacy vulnerability.

The final a8 safe-contact refinement does correctly avoid storing an old session, full snapshot or sample answers in `contactOwner`. Generation changes also prevent an old generation's key from opening a fresh generation directly. Those protections do not supply exact-snapshot ownership within a generation or the missing close/retirement fences.

Required correction: keep only safe local identity in dialog state, bind opening and every closer to the exact originating session and snapshot, retire an old opening permanently when its context changes, and clear dialog ownership before throwing/reentrant retirement observers. An old closer must reject or leave newer ownership intact. Preserve the actual controller/form/isolation behavior and shared Dialog. Do not retain old snapshots/answers merely to implement the fence, weaken source assertions, or add live ports. Any necessary change beyond the currently approved one-literal test successor needs an explicit bounded allocation.

## Runtime, dispatch and custody

Own T3-managed isolated checkout: `/Users/kanuj/.t3/worktrees/shelv/t3-eebd4322`, branch `t3/maya-shared-chrome-review`. Initial clean HEAD: `19b5946e860871deddf3eae762c02bc06fd245e7`. Its attributed SMTP input/correction ancestors are unrelated initial state, were not executed for this review and must not be delivered as Maya work.

Authoritative literal task ID, forwarded separately by Parent:

`node:delegated-task:command%3Amcp%3Aafb222dc-28b4-420b-9474-b05bc6eeba89%3Adelegate-task%3Acontinuation-20261102-maya-chrome-review-r1`.

Self and actual Parent `9b085ada-435f-48d6-8886-957c1ce3e82d` were directly read with `t3_thread_configure`, modelSelection omitted, before work and terminally: `codex/gpt-6.1-sol`, `reasoningEffort=xhigh`, `serviceTier=default`. No model, mode, configuration or fallback change occurred. Every Node/test/compiler-helper invocation uses `/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node`, verified v22.23.0. The AST compiler is the cloned matching TypeScript6.0.3; no compiler flag or declaration was weakened.

Reviewed the applicable AGENTS/shared UI, rebuild README/GOAL, D01-D48, full desktop specification, implementation contracts/addenda, ownership/status with the continuation packet taking precedence over stale rosters, exact original Maya allocation/API pin, MF1 and MIF1 failure/correction reports, App composition and complete interaction-R2 requirements. The retained D01 native image and context were inspected locally. No live Figma or browser resource was acquired.

The complete original brief/pin were read and hashed in place: 13,248 bytes/SHA256 `6b0be830312ca0e11e3511c43bbe718a155e97531be63d958983cbd83c99afe1`; 12,765 bytes/SHA256 `d7d4e85f33c812e2e1256a813013107392c437d9791809117aae35025ecfebf2`. The authoritative continuation was read in its relevant complete custody, Maya, evidence and review sections. All five originals match INPUT_PROVENANCE; the approved original remains95,388 bytes/SHA256 `c45701f9f54fd2b1dbb09bbd7aa2b9b437e9059aa6032b6f39411fe2e7f6efbd`. Own/physical Parent configuration and eight role pins match the immutable original pin.

No candidate input was committed or applied to tracked production. Only needed frozen source/probe inputs were materialized under own ignored `.local-artifacts/w7-maya-chrome-r1/fixture/`. The planned main/public graph plus focused-test import closure contains348 frozen input files, individually bound to candidate Git blobs/bytes; no foreign executable or archive was executed. Original probes/raw records were hashed in place, and only the exact probes used were copied. No recursive archive copy occurred.

## Exact base, input attribution and candidate manifest

Frozen candidate base: `8af746d197b976972d4b16924155afa8c3b32d44`. `18f4512cabf8e487cd21187b4d32e8add8a5ff33` is **INPUT ONLY**, the exact b2 Maya17 projection, with16 changed paths and the already-exact seventeenth retirement test. It is excluded from authored delivery. All17 target blobs correspond to `b2a5f4f372d4f65a1cc3f9c85fd061bddcc7668b`.

Authored delivery under review is exactly:

- `0269a7ade0a4fe83c4d957c3c6ec8d4508ffe6f3`: three production paths and two new test paths.
- `67c45d1519925d18b616bd3b1f028bad6504a193`: TEST ONLY, one CSS SHA literal in the existing boundary test.
- `a8f617e3871c5ac4161c87050b75a88ac5bc784a`: safe-contact view refinement.
- `744834fbe257e6b5aa0a8a84badd32345d327aaf`: separate author report only.

The supplied original `candidate-manifest.json` was independently hashed in place: **`753778c6a94e35b444df2b0c7a994568c8595b6d2d55075e1bb480c5764acff6`**, 2,218 bytes. The exact six production/test postimages all match it, including mode100644 and physical mode0644:

| Path | Git blob | SHA256 |
| --- | --- | --- |
| `apps/portal/src/features/walkthrough/maya/maya.css` | `f0915a9055cfbb805caa06fb1f9a4cbf1f2403e8` | `c94fc891c255bfb9ca6dcf4858ec9a79aad30000c9f458484864da595b277ae7` |
| `apps/portal/src/features/walkthrough/maya/view.tsx` | `3d840d02e82581340d38275866134986431d4c83` | `0483d8ab5c314c4465a0552ec21eb7cd1b4c5ec5f9b0878ed127e13ab2a55c16` |
| `apps/portal/src/shell/PortalShell.tsx` | `a04f42ec0dd51914ff3c830f1cc1d9a4ebcc353a` | `5da91f0b55281e9848be99ca77f0a8465d4e8f0c10573173a6c311f9e815f378` |
| `apps/portal/tests/rebuild-maya-interactions-boundary.test.mjs` | `4b2763f3a1c5941893a837c5f36eee5df2eed9ea` | `38b26cfeb03450b5bb7d74eb857a54f1e125c612bd9ee0a6c8ceca202fe6554f` |
| `apps/portal/tests/rebuild-maya-shell-chrome.test.mjs` | `348569b57fe4ee25a24676604f6835eda49f4fa7` | `30cf7f920b87432c042806106a75e24717795dc5fe4e8f1e680ff2b89602e19e` |
| `apps/portal/tests/rebuild-maya-shell-source.test.ts` | `752cee0b1e9bb5f2ec29d9ddb01bf5a3829e1dfc` | `3528545da6906c22fb9a09f0647c91e28be2f8c30f0027f5c4afc8687db5ef57` |

All three production and all three test paths were reviewed completely, including the existing boundary's unchanged predicates. Source/base/postimage and each authored commit's path diff are retained in `source-custody.json`. The15 Maya17 paths outside the two newly changed Maya input paths remain exact. Using the explicit17-input/6-owned union preserves the author's2,117 base-path count; using only16 changed INPUT paths instead counts2,118 because it includes the unchanged existing retirement test. These are different sets, not source drift. App/MayaApplication, canonical routes/navigation, shared renderer/forms/controllers beyond the declared input, ContactPort signature, Root contracts, SQL, packages/locks/config and other CSS remain unchanged by the authored candidate.

## Complete semantic disposition and test successor

The narrow optional `publicDemoNavigation:{onPlan}` seam is consumed only in public-demo mode. Client, advisor-preview, private-walkthrough and historical modes retain canonical RouteLink behavior and ContactPort semantics. The canonical four labels and Lucide icons are reused. Public plan links have the current canonical Maya stage href, or `/maya` fallback; ordinary activation invokes the guarded original controller and modified/new-tab activation keeps a public href. The other three destinations are inert, keyboard discoverable, aria-disabled and visibly explained. No fake History/Orders/Account page, stage alias, auth route or business action is introduced.

Public contact uses the existing shared Dialog with fictional/no-message status and no actual reply promise. The safe-contact refinement retains only a string. The remaining lifecycle failure is MSC3 above. Shell13 observes original host elements and callbacks while returning original React elements; it substitutes no hook, Button, session, authority or successful operation. Its contact case explicitly cannot verify mounted opening/closing or persisted hook state. Its positives therefore do not refute MSC3.

The shared shell supplies the224px sidebar,80px topbar and40px content insets. Maya CSS supplies a nominal1800px grid with flexible1440px client,24px gap and336px external rail, compact/stacked/mobile variants and no clipping workaround. Essential instructions/forms/cautions are not explicitly hidden. These source properties and native-image inspection are not measured frame/scrollbar/mobile geometry or accessibility proof.

The original shared form/decision seams, memory-only DemoUse/DemoChoice ABI, selected-product binding, known/unknown Start, pause/stop/unreviewed products, post-preset choices, immutable advice and authored follow-up separation remain intact. Current39 independently exercises their original predicates, zero-live-factory/emitted boundaries and effect traps, plus six Parent and three cache-retirement cases. All31 MF1 reopen tests independently pass on this source. No live session/cookie/operation factory or endpoint was added to the public branch. Supplied successful finite server responses in retained historical matrices remain synthetic, never genuine authority evidence.

The exact CSS successor audit proves:

- Original boundary SHA256 `a7df4141652901fc77bdebd0bfbcfbb51f0587aa640bbe14dda4112df112012b`; successor `38b26cfeb03450b5bb7d74eb857a54f1e125c612bd9ee0a6c8ceca202fe6554f`.
- Exactly one occurrence changes from old CSS SHA `6cdb2064162ef35aab8b1f08da1c7b95dd0f6ef04f51a5f0b089998c84b89112` to actual authorized CSS SHA `c94fc891c255bfb9ca6dcf4858ec9a79aad30000c9f458484864da595b277ae7`.
- Forward/reverse substitution reproduces every file byte. All other inputs, assertions, limits, flags, emitted no-live checks and historical comment remain unchanged. No skip/filter/waiver occurs.

This independently approves **only that authorized compatibility transform**, not the candidate or any further test adaptation. The separately approved a210 two-test successor remains byte-exact in this candidate. Its old reset/unavailable-form and direct-handler expectations, replacement predicates and later App assertions were inspected against the original and R2 record.

## Own commands, raw results and historical boundaries

Evidence home: `.local-artifacts/w7-maya-chrome-r1/`. Each `run.mjs` record has full executable/argv/cwd, true exit/signal and unfiltered stdout/stderr; `RESULTS.json` indexes their hashes. Counts overlap and must not be summed. Passing groups have zero failures/skips/cancellations.

| Own execution | Result | Record |
| --- | --- | --- |
| actual-App/shared-shell SSR, all five stages/navigation/contact/default modes | 13/13, exit0 | `shell13.json` |
| final unchanged interaction/Parent/cache cases with approved CSS successor | 39/39, exit0 | `current39.json` |
| same39 with byte-exact original boundary body at its original module URL | **38/39, exit1**, CSS pin failure | `original39.json` |
| independent contact source/VM, original product-route vector | **1/4, exit1** | `contact-negative.json` |
| same predicates with plan-to-plan vector avoiding product overlay | **1/4, exit1**, MSC3 | `contact-negative-plan.json` |
| original unchanged MIF1 controller probe on six exact3bd preimages / six exact8ff preimages | both FAIL, exit1, report retained | `mif-original-old.json`, `mif-original-8ff.json` |
| identical MIF1 probe on candidate | PASS, exit0, state wiped | `mif-original-current.json` |
| original actual-App MIF1 predicate, exact8ff production preimages | FAIL, exit1, replacement interrupted | `mif-app-old.json` |
| same actual-App predicates on candidate | PASS, exit0, replacement returned/report0 | `mif-app-current.json` |
| both original unchanged MF1 probes, exact old4535 controller preimage in frozen composition | both FAIL, exit1 | `mf1-original1-old.json`, `mf1-original2-old.json` |
| identical original MF1 probes on candidate | both PASS, exit0 | `mf1-original1-current.json`, `mf1-original2-current.json` |
| unchanged MF1 reopen regression | 31/31, exit0 | `mf1-reopen31.json` |

Original MIF1 probe copies are byte exact: controller1,159 bytes/SHA256 `244b57c1aa4abe046732d2b1a6088602bdcdb528bd383d5db3af243359ca16d6`; App4,173 bytes/SHA256 `519daf8abced1dcdfd4bfb4379f2335c91bbcc52b1da6ea2eb29bc37d22aa636`. The current App copy is exact. Only the old App replay's exclusive output filename changes; reverse substitution is exact. Original MF1 probe bytes/assertions/output filenames are unchanged, copied into distinct own old/current directories. Old source loaders select exact immutable Git preimages inside the actual source compiler helper; they do not execute foreign artifacts. The MF1 replay substitutes only its old controller in the frozen current composition. These minimally bound historical source replays are distinct from the original historical complete-tree raw logs and from unmodified CURRENT.

Original protected210 raw remains **208/210, exit1**. Its separately approved successor remains **210/210, exit0** in the exact author's terminal raw records, which were hashed in place and inspected, not independently rerun here. Their respective raw SHA256 values are in `retained-raw-hashes.json`; the original two failures remain the reset/unavailable-form expectation and literal-direct-onClick witness. Original210 does not contain MSC2's separate39 CSS failure. No old suite is green because a successor is green.

The author-only old chrome1/13, approved210, nav overlay10, strong/frontend/UI and main2247/public2172 write:false compiler outcomes remain attributed author evidence. Current39 independently runs the public emitted no-live test, but a fresh complete main/public compiler, configured types/UI and broader/cold matrices were held after MSC3 invalidated dependent acceptance. Their absence is not a new compile failure or a PASS. The earlier independent R2 original draft9 OLD0/9/current9/9 lineage remains historical; current39 includes its unchanged nine predicates, but no new full draft9-old replay was required for the chrome finding.

Invoke the recorder from the own repository root, with `NODE` expanded to the absolute binary above and `E=.local-artifacts/w7-maya-chrome-r1`. It sets each child cwd to `E/fixture`. For example:

```sh
NODE E/run.mjs NEW_LABEL --require ./deny-network.cjs --test --test-concurrency=1 apps/portal/tests/w7-contact-negative-plan.test.mjs
NODE E/run.mjs NEW_LABEL --require ./deny-network.cjs --test --test-concurrency=1 apps/portal/tests/rebuild-maya-shell-chrome.test.mjs
NODE E/run.mjs NEW_LABEL --require ./deny-network.cjs --experimental-strip-types --test --test-concurrency=1 apps/portal/tests/rebuild-maya-interactions-application.test.mjs apps/portal/tests/rebuild-maya-interactions-boundary.test.mjs apps/portal/tests/rebuild-maya-interactions-controls.test.mjs apps/portal/tests/rebuild-maya-interactions-retirement.test.mjs apps/portal/tests/rebuild-maya-retirement.test.mjs
```

Original39 additionally uses `--import ./register-original39.mjs`. Exact expanded historical/regression commands are retained in RESULTS and individual raw records. Recorder/probe outputs use exclusive creation; choose new output names for another authorized replay. Existing outputs are preserved.

## Dependency fingerprint and final preservation

Both fixture dependency roots were initially absent. Before either conditional APFS `/bin/cp -cR` clone from physical Parent, actual root/portal packages and four physical own/Parent root+portal lock comparisons, runtime package/lock, all91 tracked runtime files, nonsymlink roots/ancestors, device and complete byte/mode/literal-link inventories passed. Own source packages also match both. Complete parity preceded every probe. The literal `shelv-advisor-session-candidate -> ../session-integration/runtime` resolves only to the owned fixture's91 frozen tracked runtime files; no Parent generated output was copied or executed.

| Fingerprint | Exact value |
| --- | --- |
| Root lock SHA256 | `5c57c9aec9e4585066e032e234d610a77cbffd9a51f82700c158fc37fe01b5c2` |
| Portal lock SHA256 | `bc914f3a9c9f24e44f02e3cff2804651147385ea5abda58a064531329ef23203` |
| Root complete inventory | 43,213 entries, `1c2abee5f5394bce94087a4fca12b3c6178db3499368ea9474be5a09a7dc8076` |
| Portal complete inventory | 9,071 entries, `d26c866a98ce654dfd93fb3f102823b4dc4c5d83ce045e378de3a39683728acf` |

Terminal complete own-fixture AND Parent inventories, package/locks and runtime/source bytes match preflight. Every initially tracked own file retains its bytes and filesystem mode; only this newly authored report is staged/committed. No install, package/lock/dependency/configuration change, flag waiver, declaration shim, source fix or original-test edit occurred. No foreign-worktree or Root write occurred.

## Integration gate, prevented checks and unknowns

Return only this new report commit. Exclude the INPUT18f commit, unrelated own SMTP ancestors and all candidate production/test ancestors. The full candidate is **not admitted**: MSC3 needs author correction and a fresh complete independent review retaining all original Maya/MIF/MF1/R2 requirements and exact test-successor boundaries. Feasible semantic review continued after the finding; no additional material finding was established.

Browser/server/socket/listener/native/DB/Auth/Storage/provider/deployment/reset/process-adoption/remote-write actions were prevented by the explicit source-only scope and were not attempted. Heavy full npm/Expo suites were centrally scheduled outside this child. Fresh dependent compiler/type/full-retained/cold acceptance execution was held after MSC3; prior records remain attributed. No provider-refused Guidance/M65 work was repeated or rerouted.

After correction/review and Parent-controlled exact admission, remaining gates include mounted contact open/close and persisted state under route/stage changes, old closers, reset/dispose/reentrant observers, focus/Escape/keyboard/mobile menu; native Back/Forward/deep-link/reentry behavior; actual D01 comparison at1800x960 with scrollbar gutter, narrower desktop and320/390, long content/zoom/reduced motion/contrast/screen reader; representative-human comprehension; full D42 and full-product regression/genuine/CI/release acceptance. Parent's earlier browser observations belong to their original source, not this independently accepted current chrome. No mounted, visual, genuine, hosted or release PASS is issued here.

No nested agent, production/test fix, push/PR/comment/watch/merge, deployment, real-client publication/message/upload, permission change, real funds, purchase or fulfillment occurred.
