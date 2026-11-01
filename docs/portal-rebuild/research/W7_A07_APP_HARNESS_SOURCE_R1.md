# W7 A07 actual-App harness SOURCE review R1

Owner: Kanuj. 1 November 2026 UTC. Independent, report-only, pre-grant SOURCE/finite synthetic HTTP review of **0202b66a2110b86433ae0f89e0228dd9ea031157**, with production frozen at **08386a612703d3e943646112c5c9caaa100d8349**.

**Specification/completeness: CHANGES REQUIRED, A07H1/P2.** The proposed launch provenance gate does not bind the HTML template or complete served-asset selection to the reviewed preparation. Both can change while every accepted main-input and plan digest remains unchanged. The finite browser plan is not accepted for a future grant in this round.

**Correctness/quality: CHANGES REQUIRED for the prepared harness.** Two independent source-input sensitivity controls reproduce that omission through the actual imported build and guard helpers. This is a harness provenance defect, not a new A07 production defect or a demonstrated resource/authorization bypass. The hard grant pin remains null and blocks all actual launch. No launcher or browser module was imported or invoked by this reviewer.

Dependent acceptance stopped at the material finding. Original25 passed beforehand. Broader retained/strict acceptance and the remaining exhaustive review were not continued. No production or original-test fix, SourceReady declaration, Parent integration, browser grant, DOM/genuine/financial/CI/release/full-goal acceptance is issued.

## A07H1 / P2: accepted graph and plan hashes do not freeze everything served

Owner: W0 harness preparation. Requirement: the allocated workspace/input/plan/current-source guard and source-mutation/output/asset/manifest binding must reject a changed prepared execution before browser import. The original task also requires serving actual unchanged index.html/CSP and approved assets.

Source:

- [Grant shape and current null pin](../../../apps/portal/tests/rebuild-a07-application-browser-guard.mjs#L4) carry only id/workspace/main-input digest/plan digest/taskId. [verifyPreparedInputs](../../../apps/portal/tests/rebuild-a07-application-browser-guard.mjs#L14) checks only the supplied main-module list.
- [Build input collection](../../../apps/portal/tests/rebuild-a07-application-browser-build.mjs#L11) comes from esbuild's main metafile. [HTML loading](../../../apps/portal/tests/rebuild-a07-application-browser-build.mjs#L13), [asset-manifest loading](../../../apps/portal/tests/rebuild-a07-application-browser-build.mjs#L17), and the mark/Maya directory reads occur separately. They are not members of that main list.
- [Pre-import checks](../../../apps/portal/tests/rebuild-a07-application-browser-runner.mjs#L68) compare frozen main inputs, the descriptive plan and the new build's main-input digest. They do not compare prepared.templateSHA256, prepared.assets or prepared.outputs to the new bundle. The prepared harnessHead is also unused. [Browser import follows](../../../apps/portal/tests/rebuild-a07-application-browser-runner.mjs#L74).
- [Actual asset serving](../../../apps/portal/tests/rebuild-a07-application-browser-runner.mjs#L39) checks a Buffer against the hash just computed from that same new build. That proves internal consistency, not equality to the reviewed preparation. The template is served directly. The provenance receipt is written after launch.

Independent reproduction, without importing the runner:

1. Import the actual build helper, pure guard, tracked frozen-main data and exported finite plan. Build the normal actual main with write:false. Confirm every2246 input and15 output matches frozen083.
2. Intercept only the helper's exact index.html read with an own ignored sensitivity input containing the original bytes plus a harmless synthetic comment. No tracked file changes. Rebuild through the same actual helper.
3. All2246 inputs, all15 outputs, the plan digest and verifyPreparedInputs' accepted digest remain equal. The returned template hash changes from **fa5eb6c90dc47a2e6ff54c9c9e22b88ce835e92ba3275ea3000220698aa9caed** to **9019862d235dd63a86ef6f7f30d86e6b53ba46e3034bfb5e484dc96692add20f**. There is no launch-time comparison that rejects it.
4. Independently intercept only ASSETS.json with an own ignored copy omitting its first approved row. The same actual helper returns16 assets instead of17. Again all2246 inputs, all15 outputs, the plan digest and accepted input digest remain equal. Checking the hashes of the remaining manifest rows cannot detect the omitted row.

Both controls preserve the main digest **65d48999b841935afee69889fe945b02900af40ae13993edcfd308321ecb1167** and plan digest **4db627ab29b0f1b962f29261298af72a2dc9dedff9e77a742f4482a524e67a30**. E/PROVENANCE-SENSITIVITY.json records each exact intercepted path, original/sensitivity SHA, interception count, actual build equality, changed template/asset set and accepted guard result. E/provenance-sensitivity.mjs is the independent replayable source. Its command exits0 because it explicitly asserts the two counterexamples; this is not a green acceptance predicate or an intended-failure test exit.

The sensitivity changes only filesystem read inputs for these two named non-main resources. It supplies no business/context/current/permission/Auth port, React scheduling, clock, route, body, callback, successful production response or launch grant. The final control still requires the actual null grant guard to throw. No browser, launcher, private prepared input, service or production file is changed or executed.

**Impact and limit:** a later grant pinned only to these existing fields would not establish that the served document/CSP and asset set are the ones reviewed. This is material to exact-source browser proof and must be addressed before recommending such a grant. Current null prevents execution; no present grant bypass, malicious code execution, privacy disclosure, actual screenshot substitution or production regression is claimed. The harmless comment proves byte nonbinding, not a CSP exploit.

The same source read-set also excludes case/model/runner implementation, and the granted path does not compare generated outputs to its tracked frozen outputs. These are adjacent freeze obligations to cover in the owner response, not separately reproduced exploits here. Do not equate the plan's narrative hash with executable-case identity.

Smallest bounded owner request: bind and verify a complete immutable prepared execution record before dynamic browser import, covering actual main inputs and outputs, exact HTML/CSP bytes, complete asset URL/source/hash set plus its manifest/directory selection, and the reviewed harness/fixture implementation. Preserve the null default and exact workspace/task authority. Add meaningful pure changed-template/removed-asset/changed-harness/output controls. No new production API or resource is needed for that correction. A new independent successor review is required; this reviewer makes no fix.

## Exercised source evidence and finite-plan assessment

E is **.local-artifacts/portal-rebuild/w7-a07-app-harness-source-r1/** in this checkout. Own original test outputs also occupy the original tests' ignored **.local-artifacts/portal-rebuild/w0-a07-browser-prep/** path in this same checkout. No foreign output location was written.

| Fresh operation | Actual result | Receipt |
| --- | --- | --- |
| Original new harness source groups |25/25,0 fail/skip/cancel | original25-current.log and -command.json |
| Actual composition exercised inside those25 |Real ApplicationSession, advisor Cookie, fixed Plan/Review/Guidance/Care/Directory reads, actual Root parsers/mappers/context/controller; finite synthetic HTTP only | original25-current.log; imported source tests |
| Normal actual main, write:false, no source override |2246 inputs/15 outputs; every input/output plus17 assets/template matches frozen author preparation | SOURCE-CORRESPONDENCE.json; own actual-main.json/metafile |
| Independent template and manifest source sensitivities |Two actual helper counterexamples, exit0; grant remains null | provenance-sensitivity-current.log; PROVENANCE-SENSITIVITY.json |
| Author evidence integrity |203/203 indexed files rehash; index SHA1110b16547c46d85f55178cf7b70e2eed5b2f97c7764375f712d1f1684824f4a | AUTHOR-COPIES.json; SOURCE-CORRESPONDENCE.json |
| Input, protected Parent, production and SQL preservation |34 candidate paths exact0202; four production paths exact083;1950 other Parent paths/62 migrations unchanged | INPUT-AUDIT.json; final preservation receipt |

The actual original25 split is **12 model +5 source/packaging/bootstrap/artifact/guard +8 cleanup**, as confirmed by source and TAP, rather than the initial allocation's10/9/6 shorthand. Counts overlap and are not product acceptance totals. The original source check compiles the runner as text, never imports or executes it. Main source has no fixture/helper/test input or control injection.

The twelve exercise deliberate source-free review/approval/revoke/publication; three original SAVE503/lost/malformed recovery modes with original UUID/wire and one effect; unknown-action refusal; private-note/conversation separation; held immutable response/head; read-only/403/generation refusal; Source-unavailable facts; actor receipt isolation and Care/client envelopes. Model hashes/receipt/effect/notification IDs are explicitly synthetic bookkeeping. They do not prove SQL hash equivalence, persistence, current backend authorization, notification enqueue/delivery, first-payment acceptance or clinical truth. No automatic Start, funds, Source bytes or external message follows them.

The full exported plan and full cases, model, build, guard, artifact, lifecycle, runner and type source were read. Baseline rows were decoded/compared mechanically, not falsely claimed manually interpreted per duplicate row. The proposed10 contexts/18 planned captures,5s action/15s navigation budgets and stop rule remain proposals. The actual cases use ordinary public DOM locators and passive canonical entry observation; this review did not invoke them. No ordinary mounted React reentrant reachability is inferred from C2's source callback.

Direct/hard-refresh report entry truthfully becomes unavailable without session-owned binding; that is the allocated negative, not complete deep-link recovery. Multi-report preparation has no ordinary UI control. Browser rebase/reply/instruction publication/conversation/private-note and full owner/day/natural-expiry/VIEW/read-only matrices are explicitly unrun. A cancelled held read is not an observed lateHTTP200. The finite representative workflow does not complete A07 or the approved goal.

Inspection and original pure tests support unique case/context/checkpoint/sequence mode600 O_EXCL/O_NOFOLLOW writes in fresh mode700 homes, a single sealed index, bounded planned captures and one failure capture, and cleanup helper attempts despite secondary failures while retaining the primary error identity. They establish no actual Chrome partial screenshot, browser-close, process/PID/start or preview-return behavior. Those remain future-grant obligations. No per-request screenshot listener, automatic privacy bypass, React flush/clock/rAF override or forced current/authority port was introduced by this reviewer.

## Stopped checks and raw qualifications

After A07H1 reproduced, no retained A07/Guidance/rawRoot expansion, additional artifact/lifecycle controls, strict helper/frontend/session/UI invocation, full suite or further browser preparation was launched. Their historical author successes are attributed only. This early-stop review makes no comprehensive no-other-findings assertion and no final finite-plan acceptance.

Two own setup failures are preserved separately: original25 initially used the nonexistent apps/portal/tests/portal-review-no-network.mjs preload and failed before assertions; the corrected invocation uses the actual unchanged root tests/portal-review-no-network.mjs. The first sensitivity source had one excess parent segment in imports and failed before execution; its exact source/log are retained. Correcting only that ignored import binding yields the two substantive counterexamples. No assertion/compiler/response/flag/budget/dependency was relaxed. The existing typeless-package warning is unsuppressed.

Author FINAL-HANDOFF, full final W0 report including ordinal14, prepared/main/CASEPLAN/source/model/lifecycle/preservation/command JSON and raw logs were copied/read or mechanically decoded and hash-bound. All36 author command results, including nonzero setup/type/model results, remain separate from the final25. The author's one historical launcher refusal exit78 remains a qualification, not an authorized source action or browser proof. This reviewer never repeats it. Actual author cleanup tests are8 at final0202, not the earlier seven/24 suffix. Exact original C1/C2 failures, false-B pending observer20/21 and27/28, reconstructed first-postimage and artifact-prefix qualifications remain preserved in full W0/R1/R2/R3 context.

The complete own95388-byte approved input was read, including A/B/C, D01-D48 and26 screens, and hashes to **c45701f9f54fd2b1dbb09bbd7aa2b9b437e9059aa6032b6f39411fe2e7f6efbd**. Canonical full decisions and desktop spec are exact contained text. README/contracts/workstreams/current status/acceptance were read. Full A07 R1/R2 and the supplied full frozen R3, plus the full W0 final response, govern. The broader frozen W2/Guidance/App/History/Source report collection was preserved with exact refs/hashes. Exhaustive rereading of every older report and complete dependent operation-class review was not finished before this early stop; no claim of such completeness is made.

G1-G8/CH1-CH6 source dispositions remain attributed. G5 remains raw4/5 with ready producer-return -> actual offline -> later consumer ordering; no artificial yield or retroactive all-green claim. Historical generation0/1 remains distinct from actual f163/e4cb closure. R34177 is source PASS, not mounted A07 acceptance. AppR7 nativeB2 and open B3/B4/frame-C/MutationObserver bounds, old CH4 wrong-route/held-head limits and CI capture/CSP/partial-byte qualifications remain separate. This harness finding does not rewrite them. Source count/hash/reference/receipt is not readable evidence, consent or human approval. SourceUTF8/Account proposals and M65 security/provider block were neither imported nor rerouted.

## Exact identity, import attribution and preservation

| Field | Verified value |
| --- | --- |
| Authoritative taskId, supplied separately by Parent |node:delegated-task:command%3Amcp%3A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%3Adelegate-task%3Aportal-rebuild-w7-a07-app-harness-source-review-20261101-r1 |
| Backing thread |thread:delegated-task:command%3Amcp%3A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%3Adelegate-task%3Aportal-rebuild-w7-a07-app-harness-source-review-20261101-r1 |
| Backing run |run:thread:thread%3Adelegated-task%3Acommand%253Amcp%253A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%253Adelegate-task%253Aportal-rebuild-w7-a07-app-harness-source-review-20261101-r1:ordinal:1 |
| Ordinal/start/Parent/project |1;2026-11-01T12:30:25.158Z;d632030a-18f7-4dec-a2c9-f5c0418c3fd5;ac0af19d-d404-4f53-a870-02bfd76c2a80 |
| T3-owned workspace / branch |/Users/kanuj/.t3/worktrees/shelv/t3-3ca0e458 / t3/w7-a07-harness-review |
| Exact clean allocation base |6da7f523522a1d5a70dc5a2e580d38eacaba6232 |
| Assembled/tested input head |6d8b68009f6c21902dc6085e3329b9f1f75408dd |
| Initial live / source-finding configuration |codex / gpt-6.1-sol / reasoningEffort=xhigh / serviceTier=default; full-access/default |
| Supported descriptors |reasoning low/medium/high/xhigh/max/ultra, catalog default low; tier default/priority, default default. Effective xhigh/default explicit |
| Project/default/eight pins |registered shelv /Users/kanuj/Documents/projects/shelv; saved defaultModelSelection:null; project/default-subagent/eight role TOMLs Sol/xhigh; cap8 including Parent, no nesting |
| Pin SHA256 |config927e3dd532c0daabbb975f6879866aa99cbc12d3f20d080b0568867e37ee66ff; each rolea1f57cf26da8626380cbaa101ca04dc39a92e4bd6aa6acb6cd9f5f24a05d9feb |
| Runtime for all Node/compiler/build commands |/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node; actualv22.23.0, its directory first in child PATH |

Initial capabilities establish effective options; independent thread/worktree/project readback establishes actual identities. A separate live thread-configuration read was captured at the finding/finalization point, not mislabeled as an initial pre-review configuration call. Final live capabilities/configuration/project/worktree/pin/Node readback is bound in E/FINAL-HANDOFF.json. Task, thread and run are not interchangeable. No config/model change or delegation occurs.

Every changed-path list was inspected before these exact ordered cherry-picks with -x, without conflicts or manual resolution:

| Allocated original input | Local attributed input |
| --- | --- |
|c70b11e6d3e7b0724a779444d8eacb7a0f6110ad|fd075865745f0f6b919d540274bb832d727deeab|
|547b72fa9e08bd8f2ebb3636c93c990ad44b784e|b3c4b914e5f9a774a52589f9b9424ad28d0d5291|
|0c447dfb55fa91678665e6f8393b2acc965afe25|7409eabb3b16c5b35829e5c79eebfb79734e0442|
|728f3eb738cd9a2190dcab4ae5e578094c59b80e|6c3c5f834c7462346f2eab22e05ee72c0a82dc00|
|b76e9f5dd1ca47a9a70740afff49848fae04b7bb|3b6009f86ec460aa233bbe6643db12681c6c12af|
|c5edf65554b8adfe06634d7884e50051d1a9a6b8|95067589ca71df85dc82a0161ebf6a8ec5db6727|
|bb59913dcef6f3a529ebaea5a01938b354036a71|3aa85f161245f37461d86a6f86cae6216534ca7a|
|08386a612703d3e943646112c5c9caaa100d8349|5c056b3860a73ad46ce57c8ca86a4bb6b36e2644|
|89051e6b54c7f3b0318edd542e42ceb7a8a62903|853a697735a450093e9c7a0ccba23ffab0bef613|
|0202b66a2110b86433ae0f89e0228dd9ea031157|6d8b68009f6c21902dc6085e3329b9f1f75408dd|

IMPORTS.json is authoritative for the full original/local mapping; the final audit verifies this table. These ten ancestors are review inputs, never delivery. No twelve older W2 dependencies, author whole branch, SourceUTF8/Account proposal, CI fixture, RootSource/financial/native/SQL or other candidate is imported. Current client-state/W2/shared/Root/CH6 and every other Parent path remain the actual base inputs. The34 allocated candidate paths equal0202 physical bytes/blobs; all four allocated production files also equal083; all1950 other Parent paths and62 migrations remain exact. No foreign worktree or resource is written.

One authorized same-lock **/bin/cp -cR** APFS clone copies only Parent apps/portal/node_modules into the initially absent own ignored portal path, after both locks/no-symlink ancestors/same-device checks. Exit0. Root node_modules is not copied or installed. Root lock SHA5c57c9aec9e4585066e032e234d610a77cbffd9a51f82700c158fc37fe01b5c2; portal lockbc914f3a9c9f24e44f02e3cff2804651147385ea5abda58a064531329ef23203. Own resolved versions are TypeScript6.0.3, esbuild0.28.2, React19.3.1. This is a small dependency closure, not a whole-tree attestation. The allocated real115-file declaration closure was copied/hash-checked into E/declarations, receipt SHA3b8b68e91b2f3c635f3dfa9fd3716fe555d202269046772c30d56d577525bf91; no strict acceptance command used it after the stop. No installer/network/shim/downgrade/flag change occurs.

## Terminal delivery and unrun gates

Only **this report** is reviewer-authored tracked delivery. Import only its sole delivery commit, excluding all ten attributed input ancestors. Final link/whitespace/scope/candidate/protected/source/pin checks, report SHA and clean Git receipt are bound after commit in E/FINAL-HANDOFF.json. Own ignored evidence is indexed separately without report/index self-reference. Parent owns canonical status/TASKS/CONTEXT_SYNC, owner correction and any new review/grant.

ZERO browser/preview/DOM/process inventory/devserver/native/Auth/DB/PG/Storage/Docker/provider/credential/fixture/resource calls or launcher import/invocation occurred in this review. No resource was acquired, no RETURN invented, no wait/poll loop follows. R9 remains Parent's stopped preserved resource and was not inspected. No Source/API/client/financial activation, Root integration, push/PR/merge/deploy, live advice/source/permission/message/funds/retailer action occurs.

UNRUN: all10 browser contexts/18 planned captures; mounted React/StrictMode/effect/subscription scheduling; ordinary navigation/focus/scroll/keyboard/privacy/viewport/visual/accessibility/human behavior; actual PID/start/preview closure; genuine cookies/Vault/Auth/Edge/PostgREST/SQL/RLS/Storage/persistence/notifications; the stopped broader source/strict checks; full Root/portal/session/native/Expo/emitting/hosted/exact-head CI/financial/release/full-goal acceptance. **The entire approved goal remains active.**
