# W7 Maya interactions independent source R1

Owner: Kanuj. 1 November 2026 Chicago / 2 November UTC. Report-only review of the frozen candidate through `8ff5b7256fcc3100ca6c4f69c4515d39da8320c7`.

**Specification/completeness: FAIL for the required exception-safe retirement case; remaining acceptance HELD. Correctness/quality: FAIL, MIF1/P3.** A throwing local session-invalidation observer interrupts controller disposal, leaving its submitted reports and displayed snapshot uncleared. The same exception aborts returning a replacement actual Maya App scope. This is newly discovered **inherited behavior**, reproduced on exact frozen `3bd152a`, rather than a regression introduced by the interaction commits.

The original unchanged nine-test draft independently gives old **0/9** and current **9/9**. Current new tests independently pass **30/30**, including actual App/shared-renderer SSR callbacks and a finite Window model. Those positives do not cover the failing observer path. Dependent acceptance stopped at the first material finding; Parent explicitly confirmed the stop and limited further work to its bounded reproduction, provenance and this sole report. No fix or further review round was performed.

## MIF1/P3: a throwing invalidation observer prevents complete disposal

Primary source: [controller.ts](../../../apps/portal/src/features/walkthrough/maya/controller.ts:51), [disposal](../../../apps/portal/src/features/walkthrough/maya/controller.ts:136). Actual composition consequence: [MayaApplication disposal](../../../apps/portal/src/app/MayaApplication.tsx:36) and [replacement](../../../apps/portal/src/app/MayaApplication.tsx:75).

`retire()` invalidates the lease and clears its memory, then invokes session-invalidation listeners without an exception boundary. `dispose()` sets `disposed=true` and calls `retire()` **before** clearing reports, receipts, use and the displayed snapshot. A listener exception skips that remaining cleanup. A second disposal cannot finish it because the disposed guard immediately returns. Remaining invalidation listeners and their set cleanup are also skipped; that additional consequence follows directly from source and was not separately exercised.

Bounded controller reproduction, using the actual controller and shared SSR:

1. At stage 3, record the existing unknown-Start preset and retain the actual session handle.
2. Register one listener through its actual `subscribeInvalidation()` that throws `local invalidation observer failed`.
3. Call `dispose()`, catch the exception, then remove the listener and call `dispose()` again.
4. The lease is invalid and session memory is inaccessible, but the current snapshot still has stage 3, open guide, one report and use revision 1. Actual `renderMaya()` still renders the sample-report count. The same final cleanup assertion fails on old and current source.

The separate actual App reproduction creates the real `createMayaApplicationScope()` over a finite Window and renders actual `MayaApplicationContent`, NavigationProvider, MayaWalkthrough, ClientPlan, UseReport and existing UI wrappers. It observes original JSX elements and invokes their original callbacks, substituting no hook, Button, currentness predicate, successful business port, Root reply or authority:

1. Invoke `try sample use form`, select `yes`, choose `using differently`, choose unknown date, enter `visitor-entered sample answer` and submit the actual shared form.
2. Register the throwing listener on that controller's actual session.
3. Request a replacement scope on the same Window.
4. The old App scope becomes ended and its lease is invalid. Its controller nevertheless retains the submitted report and its entered details. `prior.dispose()` propagates the exception before the constructor returns the replacement; no replacement handle is returned. Three replacement navigation listeners are observed until explicit local cleanup through a subsequent scope creation/disposal.

`throwing-app-proof.json` preserves those values before cleanup. The probe then explicitly cleans up its finite scopes/frames and fails the unchanged assertion that the replacement must be returned despite the local observer failure. It is not a corrected run or an acceptance result.

This is a source/API robustness finding at **P3**, bounded by the deliberately throwing callback. No naturally throwing application subscriber, ordinary mounted React execution, DOM visibility after retirement, browser-history failure, cross-client disclosure, authority bypass, persistence or network effect has been established. The actual App already hides its ended scope, and the old session correctly rejects currentness and memory access. A retained controller snapshot and an aborted source-level replacement must not be described as a demonstrated browser privacy vulnerability.

Correction ownership remains W3 for the controller, with coordinator ownership of any necessary App composition change. Retirement must complete its state cleanup independently of observer exceptions, and replacement must retain a usable lifetime. Any correction and regression coverage require separately allocated work and fresh review. This report changes neither production nor tests.

## Exact introduction versus inheritance

`finding-provenance.json` compares physical candidate source to exact Git `3bd152a259b7b9b9971caa1546e65f69de12aab9`:

- The full `dispose()` source line is byte-identical.
- The retirement loop and its unshielded listener invocation are unchanged. The candidate adds only clearing `lastRead` and `lastMemoryView` before that same loop.
- The entire actual `MayaApplication.tsx` is unchanged, SHA256 `ef00d7a5269b5193c6ab3da242dea1efa69053494c25fe54a20146941159fb13`.
- The identical controller retirement probe fails on explicit old source and current source. Old uses the original preset event; current uses the new reducer's event. Event-ID/identity differences remain in the raw output and are not asserted equal.

The old build supplies all six existing changed production files from exact frozen Git preimages in memory through the actual source compiler helper; unchanged dependencies, Root source, fixture, App and renderer composition remain real. No tracked source is reset or rewritten. The same original nine-test file and the same retirement probe run against those old inputs, then current inputs. This is an explicit historical comparison, not a successful authority stub or a claim that old and new DTOs are identical.

## Frozen inputs and write boundary

Own workspace: `/Users/kanuj/.t3/worktrees/shelv/t3-70eed89c`, branch `t3/maya-interactions-source-review`. Clean starting HEAD was exact `3bd152a259b7b9b9971caa1546e65f69de12aab9`.

All 13 target paths, every existing preimage, new-path absence, modes, blobs, lengths and SHA256 values were independently recorded **before** ordinary attributed imports and matched Parent's later exact pin. Ordered imports completed without conflicts or manual edits:

| Original input | Own attributed import |
| --- | --- |
| `d06d35e3d6645e35a4ec289ac6605a8cb021f0e1` | `2413c73d` |
| `6e1bf04c6c625ff9315a9b96e7b3137efbb6ab58` | `98d6fc71` |
| `8ff5b7256fcc3100ca6c4f69c4515d39da8320c7` | `216bc840` |

All probes bind to own source head `216bc840`, whose complete 13 target bytes/modes match the pinned author. All **2,062** other original paths retain exact bytes and filesystem modes, including every existing test, all **117 SQL files / 64 canonical migrations**, Root contracts, App/MayaApplication, shared navigation/transport/Auth, packages/locks, configuration and CSS. SQL was protected bytes only. The only newly authored tracked path is this report. Return only its report commit, excluding the three input ancestors.

Parent supplied the complete original author allocation, exact API/dependency follow-up and this independent allocation in `maya_full_brief.txt`: **13,248 bytes**, SHA256 `6b0be830312ca0e11e3511c43bbe718a155e97531be63d958983cbd83c99afe1`. `maya_full_pin.json` SHA256 is `d7d4e85f33c812e2e1256a813013107392c437d9791809117aae35025ecfebf2`. Both were independently hash-checked and retained. Missing inputs initially held imports and execution; no additional approval was inferred from elapsed time.

Read the approved original and appendices, D01-D48/D42/C07, desktop specification/shared UI/contracts/ownership/status and current author report, prior five-stage R1/R2 and App R1 reports/corrections. All five approved originals match INPUT_PROVENANCE; approved input is **95,388 bytes**, SHA256 `c45701f9f54fd2b1dbb09bbd7aa2b9b437e9059aa6032b6f39411fe2e7f6efbd`. Earlier MF1 FAIL/correction/scoped PASS and incomplete browser/D42 evidence remain historical. The current author's complete 89-entry evidence manifest was independently length/hash verified; relevant raw failures and terminal counts were inspected. No exhaustive independent revalidation of prior reviews' raw archives was completed before the stop.

## Runtime and dependency custody

Actual allocation task ID, explicitly forwarded by Parent from its returned delegation receipt and live task record:

`node:delegated-task:command%3Amcp%3Add730894-0fab-4a94-873d-743422eae122%3Adelegate-task%3Aportal-rebuild-w7-maya-interactions-source-review-20261101-r1`.

Backing thread is separately `thread:delegated-task:command%3Amcp%3Add730894-0fab-4a94-873d-743422eae122%3Adelegate-task%3Aportal-rebuild-w7-maya-interactions-source-review-20261101-r1`. The T3 tool update cancelled original ordinal 1 and resumed the same task at independently read current run `run:thread:thread%3Adelegated-task%3Acommand%253Amcp%253Add730894-0fab-4a94-873d-743422eae122%253Adelegate-task%253Aportal-rebuild-w7-maya-interactions-source-review-20261101-r1:ordinal:2`. No task ID was constructed from a thread or ordinal. `maya_review_allocation_receipt.json` preserves both original receipt and resumed thread evidence.

Initial live catalog plus direct self and actual Parent configuration confirmed `codex/gpt-6.1-sol`, `reasoningEffort=xhigh`, `serviceTier=default`, full-access/default interaction. After the tool update the removed configuration method returned a harness lookup error; the fresh live catalog again confirmed inherited Sol/xhigh/default and exact supported descriptors. Actual self/Parent metadata and project read were recorded; project saved default remains null. Own/Parent root configuration and all eight role pins match the exact supplied bytes/blobs/modes. No setting, model, capacity or configuration was changed.

All executed Node/probe commands explicitly select `/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node`, verified `v22.23.0`. Ambient Node was not used for probes. Source compilation uses actual own dependencies and unchanged compiler configuration. No declaration shim, weaker flag, install, foreign-worktree executable or generated runtime was used.

Own ignored root/portal dependencies were initially absent. Under the explicitly conditional same-lock grant, BOTH complete source inventories, actual packages/applicable locks/runtime package, nonsymlink roots/ancestors, same device and every literal link passed before APFS `/bin/cp -cR` clones from physical Parent. Full byte/mode/literal-link parity passed **before any test or compiler**: root **43,213 entries**, portal **9,071**, including root directory records. The literal `../session-integration/runtime` resolves only to this checkout's 91 frozen tracked runtime files, with no Parent or generated outputs. Terminal own/Parent parity is recorded separately. Dependencies remain ignored and unchanged; no browser, Auth or credential fixture was copied.

## Independent results and preserved qualifications

Evidence home: `.local-artifacts/portal-rebuild/w7-maya-interactions-source-r1/`. Every recorder retains executable, complete argv, raw stdout/stderr, true exit and signal in a unique read-only JSON log. Counts overlap and must not be summed.

| Own executed check | Result | Raw log |
| --- | --- | --- |
| Original unchanged draft9, exact frozen old source | **0/9**, exit 1 | `draft9-old-1793590630732.json` |
| Same exact draft9, current source | **9/9**, exit 0 | `draft9-current-1793590644935.json` |
| Current new controls/boundary/actual App group | **30/30**, exit 0, zero skip/cancel | `current30-1793590646332.json` |
| Throwing invalidation retirement, current | **FAIL**, exit 1 | `throwing-retirement-current-1793590753970.json` |
| Identical retirement probe, exact old source | **FAIL**, exit 1 | `throwing-retirement-old-1793590784005.json` |
| Actual App/shared-form replacement under same fault | **FAIL**, exit 1 | `throwing-app-retirement-1793590820378.json` |

The original draft remains byte-identical at SHA256 `2d6b8ea702ec744fd2c882d5a27f2912557602f2e38a1fec61b5c8af6a3d969c`. The 30 current cases independently exercise the actual shared form, selected product, known/unknown dates, pause/stop/different/unreviewed reports, all three treatment choices after presets/follow-up, mode/V3 refusal, exact-result ownership and normal reset/disposal, plus actual App canonical traversal and ordinary replacement. Their network/cookie/storage/UUID traps report zero effects for the exercised controller rendering/actions. App scope creation's existing navigation-key UUID is a separate lifetime operation, not a report or business receipt. JSX observation preserves original elements/callbacks; these are source/SSR checks, not mounted hooks or DOM events.

Author evidence remains **attributed**, not upgraded to independent replay: original pending-result **16/17 RED**, follow-up DTO **15/16 RED**, stale-view **17/18 RED**, cold-history old regular **17/18** followed by corrected new **30/30**, client **122/122**, guidance **99/99**, strict/frontend/session/UI exit 0, and full compiler correspondence. The relevant pending-result predicate passes inside own current30; no independent historical intermediate source replay or standalone current17 run was performed. Cold-history reproduction, fresh retained groups, strong types/UI and full browser-target compiler were held after MIF1.

The author's main graph **2,246 -> 2,247 inputs / 15 outputs**, only application.js changed / 14 exact, and public graph **2,171 -> 2,172 inputs / 3 outputs** remain author-attributed. Prior App R1's public **2,171 / 2 outputs** used its separate packaging settings. Own current30 includes its unchanged emitted module-boundary check, but no fresh full graph/output correspondence was accepted after the stop.

The protected full retained result remains **210 = 208 pass / 2 fail**, unchanged and **not green**. The old App case requires reset-to-choose/unavailable-form behavior; its first obsolete assertion prevents its later predicates from running. The old source-wiring case requires literal direct `onClick={controller.action}` while current actions use a lifetime wrapper. Neither protected test was edited, filtered, waived or independently rerun here. New30 replacement-behavior positives do not establish all remaining old-case predicates. Parent must allocate any exact compatibility update separately; that hold remains independent of MIF1.

Reproduction from repository root, with NODE the absolute Node above and E the evidence home:

```sh
NODE E/run.mjs draft9-old NODE --require ./E/deny-network.cjs --import ./E/register-old.mjs --experimental-strip-types --test --test-concurrency=1 apps/portal/tests/rebuild-maya-interactions-controls.test.mjs
NODE E/run.mjs draft9-current NODE --require ./E/deny-network.cjs --experimental-strip-types --test --test-concurrency=1 apps/portal/tests/rebuild-maya-interactions-controls.test.mjs
NODE E/run.mjs current30 NODE --require ./E/deny-network.cjs --experimental-strip-types --test --test-concurrency=1 apps/portal/tests/rebuild-maya-interactions-controls.test.mjs apps/portal/tests/rebuild-maya-interactions-boundary.test.mjs apps/portal/tests/rebuild-maya-interactions-application.test.mjs
NODE E/run.mjs throwing-retirement-current NODE --require ./E/deny-network.cjs E/throwing-retirement.mjs
NODE E/run.mjs throwing-retirement-old NODE --require ./E/deny-network.cjs --import ./E/register-old.mjs E/throwing-retirement.mjs
NODE E/run.mjs throwing-app-retirement NODE --require ./E/deny-network.cjs E/throwing-app-retirement.mjs
```

The App proof output deliberately uses exclusive creation. Preserve its existing immutable file before a later separately authorized replay chooses a fresh output name. No failed attempt is relabeled green.

## Held evidence levels and terminal boundary

The allocated source slice remains held on MIF1. Full D42 completeness, ordinary mounted React/DOM/browser execution, browser Back/Forward/refresh exposure of this fault, frame/geometry/mobile comparison, focus/keyboard/Escape, accessibility and representative-human comprehension are unrun. Remaining adjacent matrices, standalone intermediate/cold-history controls and independent current full-suite/graph/type acceptance stopped; no later result substitutes for them.

Root full npm/app/test types/Expo/native exports, full portal package/suite, DB reset/pgTAP/migration rehearsal, genuine Auth/persistence/permissions, provider delivery, hosted behavior, exact-head CI, release and the full approved rebuild are outside this result. No browser/preview/DOM, SQL/DB/Auth/Storage/provider/native service or resource was acquired. No successful authority/Vault/Root business stub, private source, live client action, communication, publication, upload, payment, purchase, permission change, Parent import, nested task, push, PR, merge or deployment occurred.

Final source/pin/dependency preservation, raw evidence hashes and report-only whitespace/link checks accompany the sole report commit. The report provides bounded independent source failure evidence and preserves the separate old-test compatibility hold; it authorizes no implementation admission.
