# W7 R1: owner approval-policy independent source review

Owner: Kanuj. Review date: 1 November 2026 UTC. **SPEC/completeness: FAIL for this bounded slice. Correctness/quality: FAIL, OP1/P2.** The first material finding stops dependent acceptance. No fix, source/test change, Root activation or full-goal acceptance is supplied by this report.

## OP1 / P2: refreshing a newer policy strands the preserved edit

An owner reads revision 7 with approval required, changes the local desired value to false, and refreshes after another session advances the server policy to revision 8 while its current value is true. The controller preserves base 7 and desired=false, accepts current 8, and stays `writeState='idle'`, `writable=true`, without a message. `requestSave()` silently returns null because base/current revisions differ. `reapply()` also does nothing because the state is not `conflict`. Repeated refresh preserves this state. The owner has to abandon/reset the desired edit to recover; the intended comparison and explicit reapply path is unavailable.

Source causes and user impact:

- [controller.ts:205](../../../apps/portal/src/features/advisor/permissions/controller.ts#L205) preserves the old base when local work exists, while the next state at line207 inherits the old writeState. It does not turn a newly discovered revision mismatch into a recoverable conflict.
- [controller.ts:230](../../../apps/portal/src/features/advisor/permissions/controller.ts#L230) rejects Save on that mismatch. [controller.ts:298](../../../apps/portal/src/features/advisor/permissions/controller.ts#L298) permits explicit reapply only after `conflict`.
- [OwnerPolicy.tsx:32](../../../apps/portal/src/features/advisor/permissions/OwnerPolicy.tsx#L32) exposes comparison/reapply only for `conflict`; its Save predicate at line44 does not check the base/current mismatch. For the reproduced state, source therefore selects an enabled Save with no confirmation or feedback. This is a source consequence, not a DOM click or mounted-App claim.

The independent finite-HTTP probe reaches the actual ApplicationSession, cookie transport, new port/controller and Root parser/builder. It records current 8/base 7/desired=false/writable=true/idle, null confirmation before and after attempted reapply, and exactly two read-policy commands with **zero setting egress**. The fixture's revision advancement is a synthetic authoritative response, not a real policy operation. The existing SQL increments revision even for a same-value setting; this response is allowed by the actual contract. No incorrect successful save, authorization bypass or backend corruption is alleged.

Smallest correction requested of W2: when a fresh read exposes a changed base with preserved unsaved work, enter the existing comparison/reapply flow while keeping the original base and desired value. Deliberate reapply must adopt the newly read revision, followed by the existing separate confirmation. Do not silently rebase, dispatch, mint an intent, or relax the revision guard. Re-review a new frozen candidate with this regression and same-revision, pending/status and explicit409 controls.

| Priority | Persona and goal | Observed issue | Consequence | Regression and evidence |
| --- | --- | --- | --- | --- |
| P2 | Owner wants to save an edit after refreshing policy | New revision retains old base in idle; Save and Reapply return no action | Preserved local work cannot enter the required deliberate save/reapply path | Independent actual-session finite HTTP: two controls pass, OP1 fails; source UI predicate only, no browser |

The slice's required recoverable conflict behavior is incomplete under D16/D23, implementation-contract conflict semantics and the original author brief. Full A08 task/source administration is a separate known scope gap, not an additional defect invented for this bounded candidate.

## Exact review identity and import

- Workspace: `/Users/kanuj/.t3/worktrees/shelv/t3-ee0dc89f`; branch `t3/review-owner-policy-r1`.
- Starting clean Parent: `f2241b5ed9fe6da50cd458b55614a7f734094bb3`.
- Only imported candidate: `1a7f5d12e2497873fc1fc249e89c9f61978dca69`, using `git cherry-pick -x`, exit0. Local import ancestor: `1e85b9564268c17873f8e66e0ca02ba32f42a918`. **Return only the subsequent report commit, not this import ancestor.**
- Candidate direct author base: `98ea8dbaf9dbbacd32134df103e2a67931ddcee8`, verified ancestor of exact Parent. Import had no conflicts. Exactly nine NEW paths, exact candidate blobs and modes; all 1,965 Parent tracked paths, including all 62 canonical migrations, remain byte/Git-mode identical.
- Author workspace, read-only input: `/Users/kanuj/.t3/worktrees/shelv/t3-cbaf938a`. No Parent/author checkout was written.
- Authoritatively forwarded **taskId**: `node:delegated-task:command%3Amcp%3A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%3Adelegate-task%3Aportal-rebuild-w7-owner-policy-source-review-20261101-r1`.
- Backing **threadId**: `thread:delegated-task:command%3Amcp%3A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%3Adelegate-task%3Aportal-rebuild-w7-owner-policy-source-review-20261101-r1`.
- Backing **runId**: `run:thread:thread%3Adelegated-task%3Acommand%253Amcp%253A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%253Adelegate-task%253Aportal-rebuild-w7-owner-policy-source-review-20261101-r1:ordinal:1`; ordinal 1. Neither thread/run/ordinal substitutes for taskId.
- Actual Parent thread: `d632030a-18f7-4dec-a2c9-f5c0418c3fd5`, resolved from live thread metadata. The capabilities tool's parentThreadId echoes this child and is not used as Parent lineage.

Initial and final LIVE `orchestrator_capabilities`, self `t3_thread_configuration` and Parent `t3_thread_configuration` all establish `codex / gpt-6.1-sol / reasoningEffort=xhigh / serviceTier=default`, full-access/default interaction. Sol descriptors support xhigh/default. The live project defaultModelSelection is null; that is distinct from checked-in project/default-subagent Sol/xhigh/max8 pins and all eight verified role files. The final filtered live project list contains 3 running threads including coordinator and reviewer, within eight total; no nested delegation occurred. No CLI/provider configuration was changed or executed to manufacture runtime evidence.

Explicit `/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node` initially and finally reports `v22.23.0`; final `process.execPath` matches exactly. All independent tests use that executable. Initial/final live receipts, role hashes and exact task binding are in own ignored evidence.

## Requirements, source boundary and API reconciliation

The full original brief supplied with this task governs. Read applicable root/portal AGENTS, rebuild README, D01-D48, full desktop specification, implementation contracts, workstream registry/current status, both screen manifests, the full 26-screen connectivity audit and repository task-first UX guidance. Original approved input is 95,388 bytes, SHA256 `c45701f9f54fd2b1dbb09bbd7aa2b9b437e9059aa6032b6f39411fe2e7f6efbd`; all five canonical original hashes match the author proof and current files. Documentation status is not runtime acceptance.

This is the existing-API-backed publishing-policy section of A08/node503:558 only. Actual App composition remains unchanged and does not mount OwnerPolicy. No new right/action/schema, external-agent grant, raw source access, backend policy activation, or replacement permission service was introduced or authorized by this review. Full workspace task/source grant inventory/enrollment/administration remains missing; Account/Source/Orders/notifications/Maya/26-screen/secondary flows and full-goal gates remain open.

Source traced: `createOwnerPolicyController(runtime)` constructs its actual `createOwnerPolicyPort(runtime)`, which uses Root `readPlanCommand`, the new creation-bound `createAdvisorPolicyRequest`, actual `runtime.transport` and retained `advisorCookieRequest('plans', runtime.cookie)`, then Root `mapPlanResult`. Owner/write authority comes from read policy.ownerActorId, actual session identity/lease/ready and view/publish capabilities, with deny-only applicability. There is no injected successful operation port or caller-owned ready/current/owner positive authority in the probes.

Canonical Plan26 commands are `read_policy_v1`, `set_sami_approval_policy_v1` with UUID/expectedPolicyRevision/boolean/confirmed:true, and `request_status_v1`. Root policy shape is exactly `{revision,ownerActorId,requireKanujApproval}`; status is absent or committed with its original receipt. Read/setting mappers use that policy shape, not a fabricated requestId/actor receipt. Existing raw metadata and server registry admit these commands. The existing general advisor plans port omits policy commands, independently reproduced as403/no-egress. Reading SQL's command/status/setting branches at canonical Plan migration lines337-363/525-530 is static source evidence only; no SQL was run.

All nine candidate paths were read. The complete author report and delivery/source-proof originals were read/parsed, copied and hash-bound **before probes**. Their48 referenced raw artifacts were subsequently read/hash-copied after OP1; none of those scripts was executed. All48 hashes and all 2,147 author closure input hashes match the exact own imported/Parent/cloned files. This establishes input provenance, not independent acceptance of the author's conclusions.

## Independent commands and true results

Own ignored area: `.local-artifacts/portal-rebuild/w7-owner-policy-r1/`. `commands.json` records exact argv, executable, cwd, timestamps, true child exit/signal, raw combined output and SHA256. No shell pipeline hides a test exit.

| Command/check | Actual result | Evidence |
| --- | --- | --- |
| Candidate suite with only workspace/output binding | exit0; 59/59 pass, 0 fail/skip/cancel | `candidate59.log`, `candidate-binding.json` |
| Independent refresh probe, first attempt | exit1 before module evaluation; wrong relative import depth | `independent-refresh.log`, `independent-refresh.setup-original.mjs` |
| Same independent probe after import-path correction only | exit1; 2 pass/1 fail, 0 skip/cancel | `independent-refresh-corrected.log`, `OP1-observation.json` |
| Old actual general advisor port | PASS 403/no policy egress | first independent control |
| Same-revision refresh and two-stage confirmed save | PASS; no write before confirmation, actual connected mapped save | second independent control |
| New revision discovered with preserved local edit | FAIL OP1: idle versus required conflict; reapply leaves base 7 and confirmation null | independent failing case |
| Candidate suite's actual shared-wrapper SSR | PASS within 59, before finding | no DOM/React event dispatch claim |
| Candidate suite's browser-target feature closure, write:false |2,147 inputs/6 in-memory outputs; metafile SHA256 `9d337579a14f9141cfca92ec055d909a2245b265efaf1d64a1a0ddca674c3ae8` | no live browser or generated application output |

The copied candidate suite's assertion predicates are unchanged. Relative source imports resolve to own exact files, esbuild resolves to own cloned portal package, build working directory is own portal, and the single metafile output is redirected to own allocated ignored area. The raw candidate test SHA256 is `9b8fd2c4dda5eb4ea6000e40a56f895969ab09c60ae53e935834d4680eb70fc6`. This is a **minimally path-bound run**, not an untouched original-location run; it avoids the original test writing outside this review's evidence allocation. The independent probe is separately authored and does not import author callbacks or an injected policy port.

Reproduction from own repository root, with explicit Node and global external-fetch denial:

```sh
/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node .local-artifacts/portal-rebuild/w7-owner-policy-r1/run.cjs candidate59 --import ./tests/portal-review-no-network.mjs --experimental-strip-types --test --test-concurrency=1 --test-timeout=15000 .local-artifacts/portal-rebuild/w7-owner-policy-r1/candidate-test.bound.mjs
/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node .local-artifacts/portal-rebuild/w7-owner-policy-r1/run.cjs independent-refresh-corrected --import ./tests/portal-review-no-network.mjs --experimental-strip-types --test --test-concurrency=1 --test-timeout=15000 .local-artifacts/portal-rebuild/w7-owner-policy-r1/independent-refresh.test.mjs
```

The independent fixture accepts only `/api/advisor/session` and `/api/advisor/plans`, parses with actual Root codecs, and returns finite synthetic facts. Global fetch is denied outside it. No local HTTP server, genuine provider, SQL/Auth, gateway/Vault persistence or live permission operation is exercised.

The candidate59 run covers its existing malformed/known-denial/error, both real lease-acquisition waits, immutable wire/UUID/revision, serialization, response/session/stale/reentrant/throwing-observer, memory-replacement, status/absent/exact retry, explicit409/reapply, historical-receipt/current-read and read-failure cases. These are bounded executed predicates, not a comprehensive new independent proof or DOM reachability for synthetic subscriber seams. OP1 exposes a path they miss. There is no overall PASS for those broader boundaries after this held review.

After the first material source finding and its bounded reproduction, dependent acceptance stopped. Retained raw45/transport256/guidance500 suites, standalone strong/frontend/session compilers and UI guard were **not independently rerun**. Author reports45/256/500 with overlap, strong/frontend/session/UI exit0 and feature2147/6 are preserved as attributed evidence only. No Root npm/Expo, backend/DB or exact-head CI run occurred. A new candidate requires a new independent review before composition/activation.

## Dependency input and protected scope

Own portal node_modules was initially absent. Before acquisition, both own and exact Parent Root/portal lock hashes matched `5c57c9aec9e4585066e032e234d610a77cbffd9a51f82700c158fc37fe01b5c2` and `bc914f3a9c9f24e44f02e3cff2804651147385ea5abda58a064531329ef23203`. Source/target ancestors were checked for symlinks; every source link target stays within its workspace. The sole authorized dependency acquisition was `/bin/cp -cR /Users/kanuj/.t3/worktrees/shelv/kanuj-portal-rebuild-integration-20261030/apps/portal/node_modules /Users/kanuj/.t3/worktrees/shelv/t3-ee0dc89f/apps/portal/node_modules`, exit0, no stdout/stderr. Same device confirmed; all 9,070 file/link/directory records match bytes/modes/literal links,465,142,731 file bytes. The literal `shelv-advisor-session-candidate -> ../session-integration/runtime` resolves inside own unchanged workspace. No outside symlink, install or Root dependency mutation.

Actual cloned versions: TypeScript6.0.3, esbuild0.28.2, React19.3.1, @types/react19.3.0, @types/react-dom19.3.0. Real declarations were present; no shim/type stub or flag relaxation. Configured frontend remains strict/noUncheckedIndexedAccess/verbatimModuleSyntax/skipLibCheck:false. The author's separate strong helper has those same strong flags plus existing assets.d.ts and actual React declarations; its original bytes are retained, not executed here. Configured session retains its own existing skipLibCheck:true. No claim that all configs have identical flags.

Protected scope includes all existing Root/transport/Auth/Vault/config/package/lock paths and all 62 canonical migrations, not just the feature neighborhood. `import-proof.json` contains every Parent path/blob/Git mode/SHA256 and all nine exact candidate paths. Final proof compares those again and permits only this one new report beyond the attributed import. No source/tests/metadata or canonical status/context files are authored by this reviewer.

## Raw qualifications, hashes and terminal limits

Author setup facts remain qualified: initial wrong wrapper versus `.ports.plans` was corrected before meaningful 403 RED; its first redirected setup log was overwritten and survives only in the author transcript. Initial SSR 48 pass/3 setup fail was corrected with actual JSX config/runtime closure to 51/51. Strong TS2882 omitted actual assets.d.ts and was corrected by including it, without flags. The retired503 expectation was corrected to writable=false under real cookie offline while B's base/desired/pending stay preserved. These are not accepted-product REDs. Author's earlier corrected behavioral RED/GREENs remain attributed; this R1 does not upgrade them into genuine/Vault evidence.

Own first probe failed only because its ignored import traversed one directory too far; raw file/log are preserved, then only that binding was corrected. The meaningful OP1 run has two passing controls and one assertion failure. Existing MODULE_TYPELESS_PACKAGE_JSON warnings are retained; no package metadata was changed.

Important SHA256 ledger entries:

| Preserved artifact | SHA256 |
| --- | --- |
| Original author report | `43f035d131145179d16381b66bb02bdee4d77168514c52a24ba02de89bff7e46` |
| Original delivery-proof.json | `ca971b20ce383b72a582510dc22c1b39e68604ca8f122f8ac4637b6037bdefd4` |
| Original source-proof.json | `2c2576eb895faea3f39d29ccbfd739a92cc2aaa16914d9ad01ea9fd9dc47f837` |
| Independent path-bound candidate59 log | `5bfd26297d265cc117912bf562e86b61ffc0cfcb2fb0de0be469f829fc130a8f` |
| Own initial setup-failure log | `b94ef8df35c3a4a9dfcf2807af150aab6309a0d9010bbc4743a324a06aad281d` |
| Corrected independent OP1/control log | `251e8dd9bb7f5f1325403ab65a2067afd8606d340b940ebae4f4aae3d06674f1` |

`original-evidence-ledger.json` binds source/copy bytes/modes/hashes; `author-artifact-and-closure-check.json` binds all 48 referenced artifacts and 2,147 inputs. `dependency-preflight.json`, `dependency-proof.json`, `static-proof.json`, initial/final runtime receipts, commands.json and final artifact ledger retain the remaining exact details.

All own test/build subprocesses returned terminal exit codes; no compiler was launched. Runtime session timers were disposed by test cleanup. No stay-live loop, resource request, browser/preview/DOM/Figma, OS process inventory, native/DB/SQL/Auth/R9/Storage/provider/credential operation, push/PR/merge/deploy or live policy action occurred. Global external-fetch denial stayed in place during probes. Blocked Guidance private-return/M65 checks were not retried, rephrased or rerouted; original G5 qualified 4/5 and those unaccepted gates remain separate.

Final docs validation: report links/scope, protected byte/Git-mode ledger, single-report diff and `git diff --check`; final commit/readback are recorded in own ignored final proof. Full App mount/browser/genuine/backend/visual/responsive/accessibility/human/exact-head CI/release remain pending. OP1 is unresolved. This report supplies no full-goal completion claim.
