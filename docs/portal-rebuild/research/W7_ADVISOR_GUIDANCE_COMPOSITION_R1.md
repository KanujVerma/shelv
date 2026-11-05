# W7 R1 independent advisor A07 App composition review

Owner: Kanuj. 1 November 2026 UTC. NEW independent SOURCE/SSR/finite synthetic HTTP review, report-only.

**Specification/completeness: CHANGES REQUIRED, A07C1/P2. Correctness/quality: CHANGES REQUIRED for this composed source candidate.** Preparing a second real report or an instruction replaces the record behind an earlier verified report entry. Back reaches that earlier report URL, but the composition returns unavailable. Unsent work on that earlier target is no longer accessible through its original entry. The two independent failure predicates reproduce twice. No production or original-test fix is authored.

Dependent acceptance stopped at this finding. Parent acknowledged it and explicitly required finalization only, with no fixes, browser, resource grant or new retry. No subsequent verification attempt was started after that instruction. Final work is report, saved-evidence analysis, metadata and preservation audit only. This report does not issue SourceReady, mounted-App, genuine, financial, CI, release or full-goal acceptance.

## A07C1 / P2: changing the prepared target destroys an earlier verified entry binding

Owner: W0 App composition. Requirements: D10/D16 and the allocated requirements to scope controller/context memory by the actual target, retain unsent work, support canonical Back/Forward, and avoid wiping another record while preparing a new target.

**Source:** [select mutates the shared record](../../../apps/portal/src/app/advisor-guidance-composition.ts#L142), [the destination stages that same record](../../../apps/portal/src/app/advisor-guidance-composition.ts#L147), [adopt installs the record for another entry](../../../apps/portal/src/app/advisor-guidance-composition.ts#L55), and [acquire compares the older report URL to the record's latest subject](../../../apps/portal/src/app/advisor-guidance-composition.ts#L83). The actual [workspace prepare callback](../../../apps/portal/src/features/advisor/guidance/AdvisorGuidanceWorkspace.tsx#L523) calls startDraft and then navigation.onSelect. Its report and instruction controls use that callback. Existing controller startDraft replaces the current unsent body; the new composition does not retain a separate body/selection/subject binding for each earlier target.

Independent reproduction uses the actual ApplicationSession, retained advisor Cookie, fixed raw Review/Guidance channels, strict Root parser/positive mapper, real context/controller, App composition and canonical navigator. All HTTP facts are finite SYNTHETIC DTOs. The Window/history are plain source objects. There is no successful business/context/current/permission port, forced authority or injected React mount.

1. Enter the actual client's check-ins route and load its actual source-layer publication/history through those fixed readers. The finite history contains two different actual goal-report IDs.
2. Prepare report A through the same public calls as the real workspace callback. Acquire/read its verified A07 entry. Edit its unsent conclusion to UNSENT FIRST REPORT BODY.
3. Prepare loaded report B, select the returned actual controller selection, and acquire/read B. Its body positively identifies B.
4. Invoke the actual canonical navigator's Back. Its URL returns to /advisor/reviews/44444444-4444-4444-8444-444444444444.
5. **Required:** resolve A's previously verified entry under fresh reads and retain A's unsent work. **Actual:** acquire returns null. Its record now names B. The actual component's unresolved-view branch is [GuidanceUnavailable](../../../apps/portal/src/app/AdvisorGuidanceApplication.tsx#L17).

The adjacent reproduction prepares an actual authored instruction after A. The current URL correctly clears to client check-ins, as required, and the actual instruction body loads. Back to the older A07 report again returns null because the same record's subject was cleared. Clearing the new instruction's current report binding must not erase the earlier entry's own verified context.

Both complete six-case invocations give **4 pass / 2 intended assertion failures**, child exit1, zero skip/cancel. The failures are direct null-versus-required-view assertions, not timeouts or missing-module errors:

- E/independent-entry-first.log with the frozen first probe source.
- E/independent-entry-repeat.log with identical A07C1 predicates. Only the separate last positive control was strengthened from an absent report to a positively mapped legacy-report of the same opaque UUID and wrong kind.
- E/independent-entry-observations.jsonl records original entry ID, original/returned URL, null result, and **zero writes** for the second-report case.
- E/independent-entry-custody.test.mjs and E/finite-fixture-adaptation.diff preserve the actual calls and HTTP input binding.

Four controls pass in each invocation: leave and return to the same known report preserves its exact unsent conclusion; a new unbound same-path report entry cannot borrow an old binding or issue a private read; known report recovery traverses **104 actual history pages** without a 100-page cap; missing/wrong-kind subjects refuse recovery with404. The final wrong-kind control uses a valid legacy-report DTO with A's UUID, while the entry requires goal_report.

**Impact and proof bound:** this is a reproduced source API/navigation and unsent-work custody defect in the actual composition. It does not establish ordinary mounted React/browser reachability, physical Back/focus/scroll behavior, persisted backend data loss, private disclosure or unauthorized publication. No write is needed for either failing reproduction. In particular, this is **not evidence that an already-sent or possibly-sent UUID/wire was lost**. The separate retained uncertainty test passes for leaving and returning to the same known entry with original UUID/body, status READ and explicit exact retry.

The smallest owner response is to preserve each verified entry's own target binding and target-owned unsent memory while a new preparation gets its own binding. Keep new arbitrary report entries unavailable, keep instruction URLs clear of unrelated reports, and retain all actual fresh-read/authority/privacy fences. This is a correction request, not a reviewer implementation. A new independent round is required for the successor.

## Exact task, runtime and provenance

| Field | Verified value |
| --- | --- |
| Authoritative R1 taskId, supplied separately by Parent | node:delegated-task:command%3Amcp%3A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%3Adelegate-task%3Aportal-rebuild-w7-advisor-guidance-composition-review-20261101-r1 |
| Actual backing thread | thread:delegated-task:command%3Amcp%3A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%3Adelegate-task%3Aportal-rebuild-w7-advisor-guidance-composition-review-20261101-r1 |
| Actual backing run | run:thread:thread%3Adelegated-task%3Acommand%253Amcp%253A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%253Adelegate-task%253Aportal-rebuild-w7-advisor-guidance-composition-review-20261101-r1:ordinal:1 |
| Run / Parent / project | ordinal1, started2026-11-01T07:48:40.481Z; Parent d632030a-18f7-4dec-a2c9-f5c0418c3fd5; project ac0af19d-d404-4f53-a870-02bfd76c2a80 |
| T3-managed workspace / branch | /Users/kanuj/.t3/worktrees/shelv/t3-11d1108f / t3/review-a07-composition |
| Clean allocation base | 73cc850a6a60f0c25595b487e4949e2ae3d1f2a8 |
| Assembled/tested source head | 789d8ff01b300b7371aef84bebece7a8520378d3 |
| Frozen author / original workspace | 0c447dfb55fa91678665e6f8393b2acc965afe25 / /Users/kanuj/.t3/worktrees/shelv/t3-3cffb79f / t3/compose-v3-client-history |
| Initial, source-gate and final BOTH live settings | codex / gpt-6.1-sol / reasoningEffort=xhigh / serviceTier=default; full-access runtime, default interaction |
| Supporting descriptors | Sol reasoning low/medium/high/xhigh/max/ultra, advertised default low; service default/priority, advertised default default. Effective xhigh/default is explicit |
| Project/default/eight roles | Registered shelv root /Users/kanuj/Documents/projects/shelv; saved T3 defaultModelSelection:null. Project model/default-subagent Sol/xhigh and all eight role TOMLs individually Sol/xhigh; maximum8. No nested delegation |
| Pin hashes | .codex/config.toml SHA256 927e3dd532c0daabbb975f6879866aa99cbc12d3f20d080b0568867e37ee66ff; each of eight roles a1f57cf26da8626380cbaa101ca04dc39a92e4bd6aa6acb6cd9f5f24a05d9feb |
| Command runtime | /Users/kanuj/.nvm/versions/node/v22.23.0/bin/node, actual v22.23.0, explicit binary/PATH for every Node/compiler/build invocation |

Capabilities echoes this child as parentThreadId in this harness. Actual Parent/project/run/workspace come from the independent live thread read, not prefix inference. Task, thread and run are distinct. E/thread-metadata.json and project-metadata.json retain actual readback. Initial/source-gate/final capabilities and configuration are separate saved responses. The source-gate metadata filename signifies a measurement point only; no SourceReady declaration is issued.

Only these allocated inputs were inspected and imported, in order, with -x and no conflict or manual resolution:

| Original | Local attributed review input |
| --- | --- |
| c70b11e6d3e7b0724a779444d8eacb7a0f6110ad | bbd5317cc983a800e89600842e1a05bfd021361b |
| 547b72fa9e08bd8f2ebb3636c93c990ad44b784e | 1bdcfb3fb0bc527db2a8adec7d157c9f7088424d |
| 0c447dfb55fa91678665e6f8393b2acc965afe25 | 789d8ff01b300b7371aef84bebece7a8520378d3 |

All12 candidate-owned paths match complete0c447 bytes/blobs. All36 W2 paths match299929f34a440e9087dc52b67eadf1e348c5d88a; all five complete shared dependency files match37f06724c1ec5305669d1436047b6d1f6483e168. Those41 were already in Parent and are not reimported. The author's twelve dependency commits, its whole branch and any new dependency/source/backend commit are not imported.

All **1933 other Parent tracked files** remain byte-identical, including original tests, current W3 helpers/fixture/telemetry postimages, W4, client V3/History/Care/preview, generation-aware session, Root contracts/functions, policy, session/gateway/runtime, packages, locks, role pins, assets and all62 migrations. The full protected tracked native source is preserved by this comparison; no native87 fixture/runtime inventory or resource attestation was performed. The old all17-C9 equality is historical: both cookies now correctly match37f. E/AUDIT-initial.json, parent-tracked-pins.json, import-map.json and final preservation receipt retain every applicable path/ref/blob/SHA256.

## Complete prior context and evidence custody

The full current approved decision register, desktop specification, implementation contracts, workstream/current status and acceptance matrix governed the source checks. The full unique original coordinator prefix was read; the complete appendices were read in the supplied brief and canonical documents and their exact full-file containment in the95388-byte original was verified. All five INPUT_PROVENANCE originals match. Local approved A03 500:500 and A07 500:846 PNGs were visually inspected; full saved context text was recovered in bounded reads. This is saved baseline inspection, not a current rendered comparison or live Figma acquisition.

Full reports were frozen from exact Git objects using each report-only commit's actual changed filename, then read in complete bounded ranges:

| Context | Exact frozen ref(s) |
| --- | --- |
| W2 full631-line/133608-byte report and all G1-G8 author responses | 299929f34a440e9087dc52b67eadf1e348c5d88a; SHA256 464c3675375608dc0a4fa0890967d5497605c80ae86446b3146403f67a130240 |
| Guidance R1-R6 | 5bbdf7a4815d78ac5be0cf97c59a7581bec08c3d; 7d3e7ea45e82e3a2a633949cd412ac9865cfdc16; eba85a01995eab7f002a01306d49fb0e1bc7e5be; e95845aafbede5f0f0e486e09b2b9969a6c1e9e0; a171b9ff5cce7257ffe0f89b77095fd9886865e7; 10569f36306c00e69452b0f012d985993bcc1b39 |
| Full W0 History response at612 lines, then complete A07 successor suffix | b752b96051f28d1d35f50e391dc81034630b706c, then0c447dfb55fa91678665e6f8393b2acc965afe25. Exact117274-byte prior prefix is unchanged in the118878-byte successor |
| App independent R1-R7 | 55f7235d7e119bdbf95bea40b74240bf4c760820; b2a4441a25613c0f20db597bd84a0b8e7e5267c4; ad0a71a5c015d5080c7a09fdc7f5b3773bf07e36; ff53757905c557085fabdc80f9061adca702834a; fe2c5d7cd28dfa90c292eda0a40137f370d6a6a9; e4a2fa7477c46e1bf1f3b0bb300f49b677444e3c; 2c06c0ac8c7fd1774377086b181097ed7d6947f0 |
| Full A07 author report,118 lines | 0c447dfb55fa91678665e6f8393b2acc965afe25; SHA256 db1274b77de0cccf4633dcb7fa809db93ac14d5c8514b648adc69a114dca2d34 |
| Full W6 source/account reconciliation,258 lines/51056 bytes | 367662632ec6929b60e9eb53169b263849b94f4a; SHA256 b220c949d4233182542da3a463df4516ffcccfdaa4b449b6fa1888e28301a9a0 |

E/INPUT_PROVENANCE.json and COMPLETE-READ-LEDGER.json retain filenames, full hashes, byte/line counts, ranges and read/equivalence modes. Truncated combined outputs were reopened. Later full legacy acceptance/provenance/context-text recovery is separately labeled in the ledger; those historical deployment documents do not supply this candidate's acceptance.

Parent's readonly frozen-handoff copies were copied, not executed. The complete actual author A07 evidence home was copied read-only: **91 files,10086943 bytes**. All **88/88** listed author EVIDENCE entries match, including FINAL-HANDOFF, AUDIT, check-plan, COMMANDS, dependency imports and full build/metafile/read-provenance inputs. Nine additional exact R6 probe/raw references preserve original G8/18-case outcomes and old-source sensitivity. Copy/byte integrity is distinct from interpretation and fresh execution. Repeated generated/binary streams were fully read/hash-bound, not claimed as manually interpreted line by line. No foreign runner, generated bundle or log code was executed or foreign tree written.

## Setup qualification and physical dependency provenance

This new worktree initially had neither root nor portal node_modules. The first nominally pure three-file invocation also imports esbuild through the retained navigation helper and failed all three files before assertions, ERR_MODULE_NOT_FOUND. E/a07-pure-current.log and COMMANDS-initial-pure.json preserve that setup failure; it is not product RED.

Parent then explicitly allocated **only** two local APFS copy-on-write clones of its existing locked dependencies. Preflight reverified the exact workspace/clean tested head, four package/lock hashes, wholly absent nonsymlink destinations, nonsymlink source directories and same device16777230. Both /bin/cp -cR commands returned0. No fallback full copy, install, fetch, resolution/update, package script or dependency-directory symlink was used.

Sources were Parent/node_modules and Parent/apps/portal/node_modules under /Users/kanuj/.t3/worktrees/shelv/kanuj-portal-rebuild-integration-20261030; destinations were the corresponding physical ignored directories in this11d1108f worktree. Platform macOS27.0.1/arm64. Actual loaded own-portal versions: esbuild0.28.2, TypeScript6.0.3, React19.3.1, ReactDOM19.3.1. Each selected module resolves physically inside this worktree, selected entry hashes match Parent, and relative .bin/tsc/esbuild symlink targets match. E/dependency-preflight.json, dependency-clones.json and dependency-loaded-closure.json bind this small closure. No entire dependency-tree hash or Root install is claimed.

The first retained App command had **228 assertion passes plus one after-hook ENOENT**,229 registrations, exit1: its historical ordering-output directory did not exist in the own rebound evidence path. Creating only E/generated/w0-ch6 fixed that output prerequisite; the identical full command then gave228/228. No source/assertion changed. The first old-entry CJS control could not resolve external esbuild from E; a fresh own build bound only that external import to the physical own-portal esbuild path. Its corrected seven requirement assertions all execute and fail as expected on the exact old API. Both raw setup failures remain. Unused helper import.meta/CJS warnings and existing typeless-package warnings remain unsuppressed.

## Fresh checks, commands and assertion audit

E is .local-artifacts/portal-rebuild/w7-advisor-guidance-composition-r1/ in this review checkout. Global external fetch is denied. Actual source classes/factories/Root/controllers execute against finite SYNTHETIC HTTP/status/delivery/CookieClock inputs. SSR renders actual components as strings and runs no React effects or DOM.

| Fresh scope | Actual result | E record |
| --- | --- | --- |
| New A07 graph/composition/navigation/SSR/workflow | 32/32,0 fail/skip/cancel | a07-own.log |
| Retained App/session/navigation/Care/CH1-CH6 | First228 pass plus hook failure; unchanged full repeat228/228 | app228.log; app228-after-output-directory-setup.log |
| Original Guidance source/SSR | 500/500,0 fail/skip/cancel | guidance-owned.log |
| Raw fixed requests / Root contracts/actual handlers | 45/45 and80/80 | raw45.log; root80.log |
| Cookie/deadline/raw transport | 256/256 | transport256.log |
| Strong original helpers plus forbidden new inputs | Exit0, strict/noUnchecked/verbatim/skipLibCheck:false unchanged | strong-helper.log |
| Configured frontend/session/UI | All exit0, zero diagnostics;11 stylesheets | frontend.log; session-types.log; ui.log |
| New independent entry custody and adjacent controls | 4 pass/2 intended A07C1 failures, twice | independent-entry-first.log; independent-entry-repeat.log |
| Original R1 five plus actual generation-only assertion | 6/6; actual f163 contextCurrent:false/privateEntries:0/canApprove:false | original-r1-and-generation.log |
| Original G8 seven, unchanged predicates / retained independent R6 eighteen | 7/7 and18/18 | original-g8-seven.log; original-r6-eighteen.log |
| Original G5 raw five | **4 pass/1 qualified failure**, not all green | original-g5-qualified.log |
| Exact pre-owned post-dependency whole Application/history input control | Compile succeeds;2232 inputs/15 outputs, all four required A07 runtime paths absent | main-old-postdeps.json/metafile; build-controls.log |
| Exact pre-owned navigator API requirement control | Corrected own binding:0/7 intended missing-entry-API assertion failures; current7 included within32 | old-entry-api-corrected-binding.log |
| Actual uninstrumented main, write:false, no source override | 2246 inputs/15 outputs, tested789d8ff0, sourceDirty:false | main-actual-current.json/metafile |

Counts overlap; they are not unique product acceptance totals. Original500/18 operate through the actual unchanged controller/context/raw/37f final Cookie guard. They do not establish every mutation through mounted A07 or close all composition questions after A07C1.

The actual2246-input graph is compared independently with the frozen author2246 graph: **every input path/hash and all15 output hashes match**, no added/removed/changed input. This equality was measured, not assumed from the12 candidate blobs. Parent's newer tests/helpers remain preserved and are not production graph inputs. The own old control substitutes only complete exact2ca455999e0b4f341ae962f9e5aee43899a077f3 Application.tsx/history.ts bytes in the compiler input. No installed file is reversed. The builder saves both graphs and exits0; its old missing-path observation is not mislabeled an independently failing test process. BUILD-COMPARISON.json records both reachability maps and complete input/output correspondence.

All recorded check-plan argv are expanded in E/COMMANDS-current.json; hook repeat, own controls and historical probes have their separate COMMANDS files. Test groups use the explicit Node binary above with --experimental-strip-types --import ./tests/portal-review-no-network.mjs --test --test-concurrency=1 and the exact lists in the copied check-plan. Strong-helper retains its complete --ignoreConfig --noEmit --strict --noUncheckedIndexedAccess --verbatimModuleSyntax --skipLibCheck false command, actual original/type/helper inputs and configured frontend/session compilers. Existing session config retains its own historical skipLibCheck:true; it is not falsely claimed to be the strong helper configuration.

Reviewer-authored run-checks.py invokes that data plan serially and records true child exits. Python wrapper exit0 is not a claim that an intentional child1 passed. No copied author runner is executed. The output-bindings.mjs Node hook changes only original test/helper artifact directory literals in memory, reversibly, keeping generated files under E/generated. E/output-adaptations.jsonl records original/adapted hashes and replacement counts. It changes no production input, assertion, compiler option, HTTP fact, current/authority predicate or budget.

Independent fixture adaptation changes only own import bindings and the finite HTTP page lookup so104 distinct canonical cursors reach their corresponding pages. It is not a production port or currentness override. Original R1/G5/G8/18-case probes change only working import/output bindings. The G8 render dependency is freshly compiled from the actual own component/OverlayProvider, never a foreign generated SSR. Old-source controls are fresh own compiler outputs. No success assertion or original raw failure was rewritten.

## Retained qualifications and scope conclusions

G1 captured approval egress, G2 sending-intent recovery, G3 day-return, G4 acquisition-day egress, G6 instruction completion, G7 inner denial and G8 write-error ownership retain their frozen original findings/responses and current scoped source dispositions. Original G8seven and independent18 are freshly passing here. The old d7375 server-generation0/1 belongs to its historical source: current actual f163/e4cb independently gives1/1 with old context/private memory retired. It is not forced back to the old failure or credited to a W2 fix.

**G5 raw remains4/5.** Its unchanged schedule4 observes producer return ready, then actual Cookie offline, then consumer .then offline. The exact frozen observer raw retains that ordering and original failing assertion. Fresh original five again gives4/5. No artificial yield, clock/current override or retroactive consumer rejection is added. Before-return loss remains required to reject; the later consumer observation does not rewrite the producer return. No raw-all-green claim.

CH1 cached opener, CH2 typed core compatibility, CH3 self-compiling RPC adapter, CH4 pending/receipt mount lifetime, CH5 initial503/partial admission and CH6 predecessor cancellation retain their current source controls and old raw sensitivity. The retained228 passes after the hook-only prerequisite. This new entries API does not change restoration commands, default restoration, W4 witnesses or typed core helpers. App R6's42 synthetic groups remain attributed. App R7 earns current native B2 existing-entry780, while B3/B4/frame-C and first-document MutationObserver timestamp remain incomplete. R6's mismatched late head is not R7's matched late-head proof. No browser evidence is borrowed or rerun.

The old author CH4 literal /plan?routine=morning timeouts still lack destination/late-wire evidence; its corrected observer was never run. Held HTTP200 did not advance its mutable backend head. Neither historical artifact becomes next-revision/concurrency/SQL proof. Old T1/CK1/CK2 and37f source acceptance stay scoped; ordinary CK2 browser reachability and historical nonsensitive old-cookie controls remain qualified.

Actual App wiring now reaches AdvisorGuidanceApplication and the existing shared workspace within the common Shell. Actual directory-selected client/A03 entry, fixed publication/history reads, opaque WeakMap navigator token, creation-bound context and deny-only closed-view facade are real source. Unknown direct/new report entries do not guess client/kind/publication or issue a private read. The independent104-page and wrong-kind controls strengthen those bounds. A07C1 prevents an overall Back/target-custody pass.

The actual effect has separate scope and attempt ownership and releases only its acquired view; source guards refuse obsolete methods. This is inspected source behavior and finite public-API control evidence. **Ordinary mounted React/StrictMode cleanup, useSyncExternalStore subscription ordering, effect reentrancy and actual A03-to-A07 event reachability remain unproved.** No contrived sender/current override is represented as an observed UI defect.

Source-free policy/self-publisher/current exact review/approval/access/evidence gates remain in the actual existing context/controller. Current32 exercises deliberately separate create/review/approve/publish, fresh reads, manual acknowledgement, read-only refusal, private/conversation separation and original same-entry uncertainty recovery. Raw count0 does not erase actual contributors, and source-bearing/unread legacy cases stay blocked. No Source4 reader/fixtures, rights/profile/caps/disclosure/training/export, first-payment bypass, service-clock reset or Start-from-receipt is added. Source/account367 and Source15 d0f are not executable raw-byte APIs.

## Terminal disposition and unrun work

Only this NEW report is reviewer-authored tracked delivery. No production or original-test change, fix, dependency commit, source retarget, nested task, Parent integration/activation, push, PR, merge, deployment or live client/source/permission/message/funds/retailer action occurred. **Integrate only this report's delivery commit, not the three attributed input ancestors.** Parent holds the A07 candidate and owns a same-author correction and NEW independent review.

Zero browser/preview/Chrome/DOM/process-inventory/devserver/native/PG/DB/Auth/Storage/provider/R9/fixture/credential/Docker/OS-native/live external-service calls were made. W3's sole finite Chrome grant was neither inspected, polled nor borrowed. No resource was acquired or needs a fabricated RETURN receipt. No financial/M63-M65 tests/imports/reroute/model fallback or Source activation followed the unrelated provider block.

UNRUN: mounted Application/StrictMode, actual browser Back/Forward/refresh/focus/scroll/privacy/keyboard/viewport/visual/accessibility/human review; remaining composed ownership intersections after A07C1; genuine cookie/Vault/Auth/Edge/PostgREST/SQL/RLS/Storage/persistence/notification delivery; full Root/portal/session/native/Expo suites and package emission; hosted/exact-head CI/financial/release/full-goal acceptance. The entire approved goal remains active outside this terminal review.

E/EVIDENCE.json contains the final ignored evidence manifest and hashes, excluding itself and the later FINAL-HANDOFF. The handoff binds the sole report commit, clean Git, exact source/pins, preserved originals and evidence-index SHA256 after commit. No new test retry or resource phase follows Parent's finalization instruction.
