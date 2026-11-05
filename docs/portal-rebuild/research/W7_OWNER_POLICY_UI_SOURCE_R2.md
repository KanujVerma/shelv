# W7 R2: owner approval-policy independent source review

Owner: Kanuj. Review date: 1 November 2026 UTC. **SPEC/completeness: scoped SOURCE PASS for the allocated owner-policy slice. Correctness/quality: scoped SOURCE PASS. OP1/P2 is addressed on the exact corrected input.** No new material source finding was reproduced. Full A08, App composition, genuine authorization/persistence, browser and release acceptance remain incomplete.

This is a new independent frozen round. The [R1 report](W7_OWNER_POLICY_UI_SOURCE_R1.md) remains **FAIL on old1a**, with its original semantic failure, setup fault and unrun checks intact. This report does not rewrite R1 or count the author's green results as independent acceptance.

## Identity, runtime and protected inputs

- Own T3 worktree: `/Users/kanuj/.t3/worktrees/shelv/t3-070cedf5`; branch `t3/w7-owner-policy-source-r2`; clean starting Parent `c4f008b6437d1c09d62a8eda29d444dc20f1c869`.
- Only ordered imports, both `git cherry-pick -x`, exit0 without conflicts: `1a7f5d12e2497873fc1fc249e89c9f61978dca69`, then `44a071065746c6da10813ee91453f885bf36b747`. Local import ancestors are `c27eb120ffe611dedca6bd05b07fae43281b7668` and `00d68217433ae9b83919bf34a409b9501c077620`. **Return only the subsequent report commit, neither import ancestor.**
- Authoritatively forwarded NEW **taskId**: `node:delegated-task:command%3Amcp%3Add730894-0fab-4a94-873d-743422eae122%3Adelegate-task%3Aportal-rebuild-w7-owner-policy-source-review-20261101-r2`.
- Backing **threadId**: `thread:delegated-task:command%3Amcp%3Add730894-0fab-4a94-873d-743422eae122%3Adelegate-task%3Aportal-rebuild-w7-owner-policy-source-review-20261101-r2`.
- Backing **runId**: `run:thread:thread%3Adelegated-task%3Acommand%253Amcp%253Add730894-0fab-4a94-873d-743422eae122%253Adelegate-task%253Aportal-rebuild-w7-owner-policy-source-review-20261101-r2:ordinal:1`; ordinal1. These do not substitute for taskId.
- Actual Parent thread: `d632030a-18f7-4dec-a2c9-f5c0418c3fd5`, from live thread metadata. Capabilities' parentThreadId echoes this child, so it is not used for Parent lineage.
- All **10 candidate paths** have exact final44 blobs/modes. All **1,969 Parent tracked paths**, including all **62 canonical SQL migrations**, remain unchanged. Root/transport/Auth/Vault/config/packages/locks, original tests and composition are protected. Parent contains the A07 report snapshot, not the A07 production/harness imports. This review imports none of that implementation.

Both initial and final LIVE capabilities, self configuration and Parent configuration establish `codex / gpt-6.1-sol / reasoningEffort=xhigh / serviceTier=default`, full-access runtime/default interaction. Live Sol descriptors support the selected options. The project defaultModelSelection is null, distinct from the verified checked-in project/default-subagent Sol/xhigh/max8 and eight role-file pins in both own and Parent checkout. Initial live active count4 and final count5 include coordinator and reviewer, within eight total. No nesting, model fallback, provider CLI or configuration change occurred.

Explicit `/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node` reports `v22.23.0` initially and finally; final process.execPath matches that absolute executable. Every test/compiler/recorder uses it. Initial/final raw tool receipts, exact options/descriptors, file hashes and task binding are preserved under own ignored `.local-artifacts/portal-rebuild/w7-owner-policy-r2/`.

## Requirements and evidence custody before probes

The complete original author/review briefs and approved input remain binding. Read applicable root/portal AGENTS, rebuild entry/GOAL, D01-D48, full desktop specification, implementation contracts, workstream/current-status/acceptance documents, both manifests, task-first UX guidance and the complete 26-screen connectivity audit. This is the one existing-API-backed owner approval-policy slice of A08/node503:558. The full workspace task/source grant inventory, enrollment and administration remain missing.

Before probes, copied/hash-verified the exact R1 report from Parent, the current full author report, all78 original R1 evidence files and the author OP1 evidence tree into own ignored custody. The R1 tree includes its original three-probe script, observation, corrected semantic-failure log, wrong-import setup log and original48 author artifacts. No foreign script or generated bundle was executed. `original-evidence-ledger.json` records all207 copied files,25,504,000 bytes, source/copy hashes and modes. Duplicate historical originals remain historical data, not an additional review run.

The full current author report is27,975 bytes, SHA256 `0535f07dc9b4d9c4de771b2a59785e8d069221a16405df41d908e77716143c5a`; this includes its original91-line report and appended OP1 section. Its14,973-byte old report prefix is unchanged. R1 report is18,837 bytes, SHA256 `348aa62dc18fcef3f4acc4f61e7f59dcdb97eb58eeec24aaed1b89257cd14419`, from report commit `251e3667ff0a7e39db33fbed81b4723c995bfe66` already in Parent. All126 artifact entries in `delivery-ordinal3.json` verify against the preserved copies. Verified commands, original logs, source provenance, assertion records and both closure proofs were read/parsed as data. Their conclusions were hypotheses until reproduced below.

Retained original approved input is95,388 bytes, SHA256 `c45701f9f54fd2b1dbb09bbd7aa2b9b437e9059aa6032b6f39411fe2e7f6efbd`. All five canonical original hashes match the existing source proof. `prerequisite-proof.json` records full-file reads/hashes and configuration pins; `source-check-proof.json` records the current source/closure reconciliation.

## OP1 and the exact correction

Old1a counterexample, independently reproduced again here: read revision7/value=true; edit desired=false; fresh read revision8/value=true. Base7 and desired=false survive, but current8/writable=true/idle/message=null makes Save return null and Reapply do nothing. Exactly two actual retained reads and zero settings occur. This is a source UI enabled-Save/no-action consequence, not observed DOM behavior, successful unauthorized setting or backend corruption.

The [controller](../../../apps/portal/src/features/advisor/permissions/controller.ts) has exactly two ordinary-context diff hunks from1a to44. A successful fresh read uses the existing conflict state when unsent work preserves a base whose revision **or owner** differs from the new policy, only while no original pending operation remains. Original base and desired remain intact. The unchanged [OwnerPolicy UI](../../../apps/portal/src/features/advisor/permissions/OwnerPolicy.tsx) then exposes its existing comparison/Reapply path and disables Save during conflict.

Only deliberate Reapply adopts the newly read basis. Save then stages a separate exact confirmation; only confirmSave creates the UUID and confirmed setting. When desired already equals current after Reapply, the notice says `the current policy already matches your change.`, stays idle and dispatches zero settings. It does not claim this actor saved anything. Existing pending uncertainty/status/original-retry/receipt handling is unchanged. Resolving an old receipt reads the actual new current policy; remaining unsent work can then enter comparison.

| Priority / persona and goal | Original issue | Observed corrected behavior | Regression and evidence level |
| --- | --- | --- | --- |
| OP1/P2 / owner preserves an edit after refresh | New revision left base/current mismatch in idle; Save/Reapply gave no recovery | Existing conflict comparison preserves base/desired; explicit Reapply and separate confirmation recover the edit | Unchanged independent three: old2/1, current3/3; actual-session finite synthetic HTTP and source/SSR, no DOM |

No new state/API/DTO/right/action, general advisor-port broadening or server-policy change was added. Types, raw request/port, old tests and component/CSS are byte-identical to1a. Only controller, NEW refresh test and appended author report differ between the two input commits.

## Actual connected chain and authority boundary

Source traced and exercised: actual `createApplicationSession` -> `createOwnerPolicyController(runtime)` -> internally constructed `createOwnerPolicyPort(runtime)` -> Root `readPlanCommand` -> creation-bound `createAdvisorPolicyRequest` -> real session transport -> retained `advisorCookieRequest('plans', runtime.cookie)` -> finite synthetic HTTP -> Root `mapPlanResult`. No successful-port stub, caller-provided ready/current/owner flag or author callback substitutes for this chain.

Canonical commands remain `read_policy_v1`, `set_sami_approval_policy_v1` with UUID/expectedPolicyRevision/boolean/confirmed:true, and `request_status_v1`. Actual policy is `{revision,ownerActorId,requireKanujApproval}`; status is absent or committed with the original policy receipt. No fabricated requestId/actor receipt is introduced. Existing raw metadata/server Plan registry already admits these commands; the general advisor plans port omits policy reads/settings. That old403/no-egress control passes in both old/current probe runs.

Local write capability requires actual current session/lease/ready state, view/publish and read-backed policy owner matching the authenticated actor. Applicability can deny but cannot create server rights. Current read failure retires the port's old owner basis; a true applicability callback cannot revive it. Static canonical Plan SQL inspection confirms owner authorization/audit, revision CAS/increment and actor-bound status receipts. SQL was not executed. No actual policy, grant, source access, external-agent approval or first-payment rule was changed or activated.

## Fresh independent execution and true exits

`run.cjs` records exact executable/argv/cwd, timestamps, true child exit/signal, combined raw output and SHA256. It prints the child result before persisting logs and refuses receipt/log overwrite. Test commands use global external-fetch denial; fixtures accept only `/api/advisor/session` and `/api/advisor/plans`. All HTTP/session/policy facts are finite synthetic responses, not a server, provider, SQL/Auth or persistence proof.

| Check | True result | Own raw evidence |
| --- | --- | --- |
| Exact R1 three on old1a controller, import-bound only | exit1; **2 pass /1 semantic OP1 fail** | `r1-old.log`, `r1-old-observation.json` |
| Same R1 three on exact final44 source | exit0; **3/3**, no fail/skip/cancel | `r1-final.log`, `r1-final-observation.json` |
| Author NEW adjacent test on old1a controller | exit1; **4 pass /15 semantic fails**,19 total | `adjacent-old19.log` |
| Exact tracked NEW adjacent test on final44 | exit0; **19/19**, no fail/skip/cancel | `adjacent19.log` |
| Newly authored independent actual-session checks | exit0; **16/16**, no fail/skip/cancel | `independent16.log` |
| Retained policy suite, import/cwd/metafile binding only | exit0; **59/59** | `candidate59.log` |
| Retained raw request suites, unmodified | exit0; **45/45** | `raw45.log` |
| Retained cookie cancellation/deadline plus raw requests | exit0; **256/256**, includes raw45 | `transport256.log` |
| Existing retained W2 guidance source/SSR suite | exit0; **500/500** | `guidance500.log`; ordinary prior suite only |
| Configured frontend, strong policy/type/UI helper, configured session | each exit0 / zero compiler errors | `frontend.log`, `strong.log`, `session.log` |
| Existing UI guard and exported guard over actual policy CSS | each exit0; zero literal-color allowance | `ui-guard.log`, `policy-css.log` |
| Actual browser-target feature/request/runtime closure | **2,147 inputs /6 in-memory outputs, write:false** | `feature-build-metafile.json`, `source-check-proof.json` |
| Assertion/source/protected-scope verifier after harness correction | exit0 | `static-proof-corrected.log`, fresh `source-validation.log` |

Counts overlap and are not summed into product acceptance. R1 independently ran59 and its three probes, then stopped at OP1; it did **not** run standalone compilers or retained45/256/500. The fresh R2 rows above are new reviewer executions, distinct from the author's matching results.

Independent16 exercises all four same/new revision and same/changed current-value combinations, same-revision owner change, preserved base/desired, zero setting before Reapply/confirmation, UUID creation only after deliberate confirmation and exact full wire, already-current/no false save, conflict-subscriber publish/generation/day/session/dispose loss, both actual lease waits after confirmed Reapply, signal-aborted potentially committed write, exact original status receipt versus newer current read, absent-before-new-intent and failed-read owner-basis retirement. Same-revision changed-value/owner cases are synthetic response-boundary controls, not claims of lawful server transitions.

The retained19 additionally exercises repeated refresh, stale confirmation, original409, pending/status/replay, owner-session replacement and reentrant/throwing conflict subscribers with newer B ownership, plus actual shared-wrapper SSR. Retained59 covers malformed/known-denial/error results, immutable command mutation/serialization, both real lease boundaries/deadline, stale held200/403/409/503, memory replacement and original retry/receipt guards. These synthetic subscriber seams do not prove ordinary React/DOM reachability. SSR renders real components/wrappers with actual controller state; no browser or DOM events were run.

Reproduce from own repository root, using the explicit Node executable:

```sh
/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node .local-artifacts/portal-rebuild/w7-owner-policy-r2/run.cjs NEW_NAME --import ./tests/portal-review-no-network.mjs --experimental-strip-types --test --test-concurrency=1 --test-timeout=15000 .local-artifacts/portal-rebuild/w7-owner-policy-r2/r1-final.test.mjs
```

Use distinct names because receipts are immutable. Substitute `r1-old.test.mjs`, `independent.test.mjs`, `candidate59.bound.mjs`, or tracked `apps/portal/tests/rebuild-owner-policy-refresh.test.mjs` for the corresponding probe. Exact expanded retained/compiler/build argv are in each named JSON receipt and the final command ledger. No full npm/Expo suite or exact-head CI was run.

## Raw, minimally bound and current evidence

The final R1 probe is byte-identical to the original corrected R1 script, SHA256 `3eceab113e988ec84c034c8a3bc162f8c311c5021435d00c8c1184a4b70b7be0`, at the same relative depth in own evidence. Its own adjacent observation output is retained per run. For old1a, only the controller import target changes. That controller is extracted from exact1a Git bytes; its four imports are rebound to own immutable dependencies. All other candidate executable inputs are1a-identical. This is a meaningful old behavior control, not a missing-export failure.

The old policy test remains unchanged on disk, SHA256 `9b8fd2c4dda5eb4ea6000e40a56f895969ab09c60ae53e935834d4680eb70fc6`. Its own bound copy changes only imports, actual portal build cwd and metafile output. All **157 assertion-call texts** are unchanged, verified with actual TypeScript AST. All23 R1 assertion texts,144 adjacent-test assertion texts and the six bound retained SSR files' assertion texts also match originals exactly. Retained guidance needs six SSR output/import bindings to keep generated CJS inside this allocation; other tests/helpers execute own tracked sources unchanged. No fixture fact or predicate was adapted to manufacture green.

The new feature metafile is exactly the author's final metafile, SHA256 `aaa20658a1a3db6333d4f8c847171fdd4d7f9973f18729019b8de4a09f3549fc`. All2,147 author current closure input hashes match own files. This is actual bundle resolution/tree closure evidence, not an App mount, browser rendering or successful backend call.

## Failed-turn chronology and setup qualifications

Author ordinal2 remains **failed**. Live T3 metadata independently confirms it ran16:09:57.385Z to16:15:42.900Z and the following ordinal3 ran17:27:17.592Z to17:38:04.660Z. Live original terminal error is only `Provider turn failed.` No policy reason or causal link to filesystem failure is inferred. The original last command creates the NEW test, spawns the test child, writes `adjacent-before.log`, then prints summary. Its saved activity still has running command status and no child output; it is not a terminal test receipt.

The preserved raw/reconciliation evidence records wrapper exit1/ENOSPC opening `adjacent-before.log`; the nested test exit/output remain **UNKNOWN**, not RED/GREEN or the provider failure's cause. Both attempted adjacent log/command files were absent at ordinal3 reconciliation. The partial15,905-byte test SHA256 `84ada7f1582dd8493fa0213600f52191af296c9a621c0467e4b86b1480e8feef` matches final tracked test exactly. Ordinal3 reconciled these bytes/log absences before its first recorded old-source adjacent4/15 run. No ordinal2 production fix/commit is claimed. Git dates place1a at15:46:42Z and44 at17:36:40Z, consistent with ordinal1 and ordinal3, respectively. Own live metadata and original command/error records are retained separately from author receipts.

Original author setup qualifications also remain: wrong wrapper versus `.ports.plans` before meaningful403 RED; overwritten first redirected setup log; SSR48 pass/3 setup failures followed by JSX/runtime-closure correction51/51; strong TS2882 fixed with existing assets.d.ts; retired503 writable expectation corrected for real cookie offline while preserving B's work. These are not newly accepted product REDs. R1's wrong-import setup failure remains distinct from its genuine2/1 semantic result. G5 qualified4/5 and blocked Guidance/M65 evidence retain their original limits.

Own R2 static helper first failed because `git diff --unified=0` splits the first logical correction into two ranges, yielding three ranges rather than the two ordinary-context hunks. Original helper/log are preserved; only its diff-context setting changed to3. Corrected verifier exits0, with no source/test/compiler-flag change. A premature log read while that verifier was still running found no log yet; its actual terminal result was collected before acceptance. An optional guessed A07 report filename was absent; it was not used as evidence or followed into A07 work. The final evidence checker also detected a reviewer helper-output collision: the successful source verifier had overwritten its earlier `static-proof.json` recorder receipt. The original failed helper script, full raw error log and tool-reported exit1 remain; that first receipt’s timestamps are no longer available. The source proof was preserved as `source-check-proof.json`, the corrected run receipt remains intact, and a fresh `source-validation` run exits0 with separate output names. The first final checker stopped with KeyError before acceptance; its original script is retained and the correction excludes the lost receipt rather than inventing it. Existing MODULE_TYPELESS_PACKAGE_JSON warnings are retained. No test raw output was rewritten or failure log deleted.

## Dependencies, hashes and terminal scope

Own portal node_modules was initially absent. Before the explicitly allowed APFS clone, own and exact Parent Root/portal locks matched `5c57c9aec9e4585066e032e234d610a77cbffd9a51f82700c158fc37fe01b5c2` and `bc914f3a9c9f24e44f02e3cff2804651147385ea5abda58a064531329ef23203`. Ancestors had no symlinks, every source link target stayed within Parent, target was absent, and devices matched. `/bin/cp -cR /Users/kanuj/.t3/worktrees/shelv/kanuj-portal-rebuild-integration-20261030/apps/portal/node_modules /Users/kanuj/.t3/worktrees/shelv/t3-070cedf5/apps/portal/node_modules` exited0. All9,070 file/link/directory records match bytes/modes/literal links,465,142,731 file bytes. The literal session-runtime link resolves within own workspace. No install, Root dependency write, foreign execution or outside link occurred.

Actual versions: TypeScript6.0.3, esbuild0.28.2, React19.3.1, @types/react19.3.0, @types/react-dom19.3.0. Real existing declarations were sufficient. Strong/frontend retain strict/noUncheckedIndexedAccess/verbatimModuleSyntax/skipLibCheck:false, with the actual existing assets declaration and readonly/API helper. Configured session retains its existing skipLibCheck:true. No shim, type erasure, package/configuration change or flag relaxation was used.

| Principal artifact | SHA256 |
| --- | --- |
| Current controller | `078e7cf4635b11d3a00b7fe034299ea0bb1be061e56ab8e68a309b19966d3392` |
| Original R1 semantic failure log | `251e8dd9bb7f5f1325403ab65a2067afd8606d340b940ebae4f4aae3d06674f1` |
| Own old R1 reproduction | `f546b6c3dd22ef281d4772cc4b0522ffffe0ae0ee7fa4678f6ee7b97190eb924` |
| Own current R1 reproduction | `cdf3739483f9a7f1c088b5e695b7fea51a9962384787d74dedd8815c44c5a2da` |
| Own new independent16 log | `70abcb0356b30bc284a22aa5b11bb40257ce589593e8b9ec66bf1f38f71df0b8` |
| Own old adjacent4/15 log | `c83c1132cef74c50513a5c1d1bd7d7fe38c2d71d7d168a6e03acc81aa7b8241d` |
| Own current adjacent19 log | `13670d0e6d1288012a40232bb5c78a2bf9c7b4aaf004daeb7f8349436e401ff0` |
| Preserved author ordinal3 delivery | `6162f35256455f4eac668e48c0c82df940ebd067f8b1251b9a22e622e3592948` |

All own compiler/test/recorder handles returned terminal exits; runtime cleanup disposes sessions/controllers. No OS process inventory was used to make a broader machine-process claim. Final proof rechecks every protected path/blob/mode, ten final44 candidate paths, configuration pins, report links, whitespace and sole-report commit/readback. Only this report is authored tracked work; no canonical status/context file is edited in this allocation. Its commit hash is recorded in ignored final proof to avoid self-reference.

No browser/preview/DOM/Figma/native/PG/DB/SQL execution, Auth/Vault/provider/Storage/R9/credential/network-service/live policy action, Source/Account export or advisor activation occurred. Existing guidance500 is ordinary retained SOURCE regression, not a retry/rephrase/reroute of the blocked private-return audit. Blocked Guidance/M65 remain unaccepted. No Root composition, push, PR, merge, deploy, wait loop or resource-grant request.

**Remaining boundaries:** parent-owned deliberate App integration/mount, full task/source administration and trusted rights producers, browser/genuine backend/SQL/Auth/persistence, exact-frame visual/responsive/accessibility/human verification, exact-head CI and release. Source policy/read grant cannot create actual server rights. The founder's static final-export decision after30days is context only and grants no raw-Source export rights here. This scoped source PASS does not complete A08, all26 screens or the full approved goal.
