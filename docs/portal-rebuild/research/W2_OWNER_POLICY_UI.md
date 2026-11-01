# W2: connected owner approval-policy source slice

Owner: Kanuj. Implemented and locally source-tested, 1 November 2026; independent source review pending. This is one deliverable slice of A08 `503:558`; full workspace permission administration and the approved rebuild remain open.

## Identity and boundary

- Exact clean parent/base: `98ea8dbaf9dbbacd32134df103e2a67931ddcee8`, branch `t3/owner-approval-policy-ui`, T3 worktree `/Users/kanuj/.t3/worktrees/shelv/t3-cbaf938a`.
- Parent-forwarded taskId: `node:delegated-task:command%3Amcp%3A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%3Adelegate-task%3Aportal-rebuild-w2-owner-policy-connected-source-20261101-r1`.
- Backing threadId: `thread:delegated-task:command%3Amcp%3A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%3Adelegate-task%3Aportal-rebuild-w2-owner-policy-connected-source-20261101-r1`.
- RunId: `run:thread:thread%3Adelegated-task%3Acommand%253Amcp%253A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%253Adelegate-task%253Aportal-rebuild-w2-owner-policy-connected-source-20261101-r1:ordinal:1`; ordinal `1`. No nested delegation.
- Initial and final live T3 capabilities/self/parent configuration confirm `codex / gpt-6.1-sol / xhigh / default`, full-access runtime and default interaction; descriptors expose both options. Project defaultModelSelection is null, distinct from the checked-in Sol/xhigh project/default-subagent pins and all eight role pins, cap8. Node `v22.23.0`. No provider CLI/configuration changes. Final live receipts are in `runtime-final.json` and `pins-final.json`; initial receipts are in the T3 tool transcript. The live catalog's parentThreadId echoes the child; actual parent lineage comes from thread metadata.
- Nine allocated NEW paths only: five `features/advisor/permissions/` modules, `app/advisor-policy-request.ts`, two specifically named tests and this report. All existing tracked inputs are protected by ignored `baseline.json`. No Application/Shell/router/general port, Root/server/SQL/Auth/cookie/Vault/schema/dependency/config/CI/Account/Source/Guidance/Order file is changed.

## Early API and source checkpoint

`createOwnerPolicyPort(runtime)` is creation-bound to the actual ApplicationSession; it accepts only the three existing Plan commands through `.execute(command, options)`, `.isCurrent()` and idempotent `.dispose()`. `createOwnerPolicyController(runtime)` constructs that real port internally. Parent later supplies the controller to `OwnerPolicy`, within the shared OverlayProvider, and must dispose the controller on route/session replacement. This slice does not mount or activate A08.

The chain is controller → canonical `readPlanCommand` → new finite raw adapter → actual `runtime.transport` → retained `advisorCookieRequest('plans', runtime.cookie)` → current fixed plans channel. Root `mapPlanResult` decodes all responses. The app seam accepts no fetch/URL/RPC/credential/owner/approved/current override. Server authorization remains authoritative.

Source reconciliation at the exact base:

- `PortalRebuild.ts` already declares `read_policy_v1`, `set_sami_approval_policy_v1` and `request_status_v1`; general `createAdvisorPorts` excludes the policy actions.
- Root `PortalRebuildValidation.ts` supplies the exact parser and fixed `concierge_plan_command_v1` builder. The mapper returns exactly `{revision, ownerActorId, requireKanujApproval}` for read and set. Status is `{status:'absent'}` or `{status:'committed',receipt:policy}` for this original operation. No receipt/requestId/actor field is invented on a policy response.
- Canonical `20261030223603_portal_rebuild_plan_v1.sql` lines337-363 and525-530 confirm status uses the authenticated actor/request record and original authorization, the owner-only setting increments the policy revision and audits it. This is a static source observation, not SQL/Auth proof.
- Existing raw plan metadata, advisor cookie factory and server registry already admit these actions; they remain unchanged.

Meaningful initial RED: the actual existing advisor port returned403 for the required policy read, with no policy HTTP egress. The new adapter made the unchanged actual-session/Root-codec test GREEN. An initial setup attempt selected the wrapper instead of `.ports.plans`; it was corrected before recording the meaningful403 RED. Later real assertions reproduced stale writable state after offline503 and historical receipt revision8 being misdisplayed instead of actual revision9; both REDs and corrected GREENs are retained.

## Task-first interaction and semantics

| Step | Goal | Control/state | Effect and recovery |
| --- | --- | --- | --- |
| read | see actual policy | refresh policy | actual read before value/revision/owner; failures clear current display |
| edit | choose a desired policy | shared Select | local boolean only; current policy remains server truth |
| save | review consequence | save policy | exact base/desired confirmation; no HTTP write yet |
| confirm | deliberately apply change | shared Dialog confirmation | only this step constructs confirmed:true and UUID |
| recover | resolve original intent | check result / retry original change | same UUID/wire/revision; no replacement intent while uncertain |
| conflict | retain work against newer policy | refresh then reapply my change | base/current/local comparison; no automatic revision rebase |

Only actual read-backed policy.ownerActorId plus the actual session actor/role/lease, ready state and existing view/publish capabilities permit setting. View-only/nonowners can read if backend permits. Local denial cannot authorize a request or suspend the shared cookie. Both retained lease acquisitions and serialization/response callbacks receive deny-only applicability. A session-memory lane owner prevents an old controller from dispatching or deleting a replacement controller’s pending intent. Observer exceptions stay local; private snapshots recheck ownership after synchronous notification. The controller stages retirement before subscriber notifications, clears private state on actual session/view loss, and preserves dispatched uncertainty in the captured session memory until settled. No new browser persistence. A new policy read retires the port’s prior owner basis immediately; failed/unavailable/malformed reads cannot leave a direct setting path. Read sequencing prevents either stale success or stale failure from replacing the newer basis.

A stored status/retry receipt resolves the original intent only. Recovery then reads the actual current policy before restoring current display/authority; an old receipt cannot acknowledge unseen changes.409 keeps desired/base and requires explicit refresh/reapply. Malformed/mismatching success and lost/503 writes remain uncertain.

Copy follows the approved publishing-policy section and shared wrapper/token baseline. Proper Sami/Kanuj identities are preserved. The distinction sentence explains the exact unaffected agent authorization/source/first-payment/section-review gates. No placeholder task/source controls, success badge or retention-implementation claim is added.

## Dependency input provenance

The initially absent own portal node_modules received exactly the explicitly authorized dependency input from `/Users/kanuj/.t3/worktrees/shelv/kanuj-portal-rebuild-integration-20261030/apps/portal/node_modules`, using `/bin/cp -cR SOURCE TARGET`, exit0. Before the clone, all source/target ancestors were checked for symlinks and same-device membership. Both source and own Root lock SHA256 are `5c57c9aec9e4585066e032e234d610a77cbffd9a51f82700c158fc37fe01b5c2`; both portal locks are `bc914f3a9c9f24e44f02e3cff2804651147385ea5abda58a064531329ef23203`. Actual source/target versions: TypeScript6.0.3, esbuild0.28.2, React19.3.1, @types/react19.3.0 and @types/react-dom19.3.0.

All8,525 cloned file/link records match bytes/modes or literal links. No arbitrary foreign symlink was dereferenced. The lock-declared `shelv-advisor-session-candidate -> ../session-integration/runtime` remains literal and resolves to this own unchanged runtime. `dependency-preflight.json` and `dependency-provenance.json` retain the command/exit/absence/versions/link/file proof. No installation, Root write, tracked dependency change, shim, cast, Auth copy or flag relaxation occurred. The separately authorized frozen Node declaration packages were unnecessary and were not copied.

## Executed verification

| Check | Result | Retained evidence |
| --- | --- | --- |
| New actual-runtime/Root-codec policy behavior, typed command boundaries, SSR and write:false feature build | **59/59**, zero fail/skip/cancel | `final-policy.log`, `final-verification.json` |
| Retained raw requests | **45/45**, zero fail/skip/cancel | `raw45.log`, `verification.json` |
| Retained cookie cancellation/deadline plus raw requests | **256/256**, zero fail/skip/cancel | `transport256.log`; includes raw45 |
| All retained W2 guidance source/SSR suites | **500/500**, zero fail/skip/cancel | `w2-source500.log`; no blocked audit probes |
| Configured frontend and session compiler | exit0 / zero errors | `final-frontend-types.log`, `final-session-types.log` |
| New modules, UI and readonly/API type helper with actual existing declarations | exit0 / zero errors | `strong-types.json`, `final-strong-types.log` |
| Existing UI guard plus actual exported guard over NEW CSS | exit0 / zero literal-color allowance | `final-ui-guard.log`, source CSS assertion |
| Browser-target actual feature/request/runtime closure, **write:false** | **2,147 inputs / 6 outputs**, in memory | `feature-build-metafile.json`, `source-proof.json` |
| Existing tracked paths, including canonical migrations | **1,963 byte/mode-identical paths; all62 canonical SQL unchanged** | `baseline.json`, `source-proof.json` |

The new59 cases cover actual reads, local desired state, deliberate exact confirmation, no-read/nonowner/view-only denial, finite commands, Root codec parity, immutable UUID/wire/expected revision across both real lease awaits, serialization retirement, current401/403/unavailable, stale held200/403/409/503, capability/role/owner/generation/day/deadline/dispose changes, status/absent/original retry, malformed and mismatching acknowledgements,409 comparison/reapply, historical receipt versus fresh current read, retained uncertainty after disposal, replacement-controller ownership, throwing/reentrant subscribers, private snapshot return and real shared-wrapper SSR. Counts overlap and are not combined into full-App acceptance.

Every test/compiler run in `verification.json` and `final-verification.json` records actual Node executable22.23.0, argv, true exit, log and SHA256. The final targeted strong config preserves strict=true, noUncheckedIndexedAccess=true, verbatimModuleSyntax=true, skipLibCheck=false, Bundler resolution, ES2022/DOM libs and actual portal React declarations; it explicitly includes the existing `src/ui/assets.d.ts`. Configured frontend/session checks retain their own existing flags, including the session config’s existing skipLibCheck=true. No claim that all configurations share identical flags.

Reproduction from the repository root:

```sh
node --import ./tests/portal-review-no-network.mjs --experimental-strip-types --test --test-concurrency=1 --test-timeout=15000 apps/portal/tests/rebuild-owner-policy.test.mjs
node --import ./tests/portal-review-no-network.mjs --experimental-strip-types --test --test-concurrency=1 --test-timeout=15000 apps/portal/tests/rebuild-review-request.test.mjs apps/portal/tests/rebuild-review-guidance-request.test.mjs
node --import ./tests/portal-review-no-network.mjs --experimental-strip-types --test --test-concurrency=1 --test-timeout=15000 apps/portal/tests/rebuild-cookie-cancellation.test.mjs apps/portal/tests/rebuild-cookie-cancellation-deadline.test.mjs apps/portal/tests/rebuild-review-request.test.mjs apps/portal/tests/rebuild-review-guidance-request.test.mjs
node --import ./tests/portal-review-no-network.mjs --experimental-strip-types --test --test-concurrency=1 --test-timeout=15000 apps/portal/tests/rebuild-advisor-guidance*.test.mjs
node apps/portal/node_modules/typescript/lib/tsc.js -p apps/portal/tsconfig.frontend.json
node apps/portal/node_modules/typescript/lib/tsc.js -p .local-artifacts/portal-rebuild/w2-owner-policy-ui/strong-types.json
node apps/portal/node_modules/typescript/lib/tsc.js -p apps/portal/session-integration/runtime/tsconfig.json
node apps/portal/scripts/check-ui-system.mjs
```

Setup/results qualifications remain explicit. The first connected test selected the existing wrapper instead of `.ports.plans`; that setup output survives in the tool transcript but its redirected file was overwritten before the meaningful403 RED. The first SSR harness omitted the configured JSX transform and incorrectly expected a type-only session import to enter a runtime bundle:48 passed/3 setup assertions failed. Correcting the harness to use the unchanged frontend tsconfig and an actual runtime entry yielded51/51 at that checkpoint. The first strong helper config omitted the existing CSS declaration and failed TS2882; adding that existing declaration yielded zero errors without changing flags. A retired503 test initially expected writable to stay true, contrary to the retained cookie’s genuine shared offline transition; the corrected assertion preserves B’s current/base/desired/pending while requiring writable=false. No cookie/Auth fix was made.

Additional meaningful RED/GREEN controls caught and fixed only this NEW controller’s offline authority display, historical-receipt/current confusion, replacement-controller dispatch, reentrant private snapshot return and throwing-observer disposition and failed-read owner-basis retention. Their original failure logs and final successful runs are retained separately. The existing Node MODULE_TYPELESS_PACKAGE_JSON warning is retained; no package change was made to silence it.

## Remaining gates

The approved95,388-byte original, decisions, spec and both manifests retain their exact provenance hashes in `source-proof.json`. All HTTP ledger facts are explicitly synthetic; global fetch is denied and the fixture accepts only `/api/advisor/session` and `/api/advisor/plans`. No gateway/provider/SQL/Auth/persistence permission or real policy operation is proved or performed.

New independent source R1, parent bounded Application composition, approved-frame/browser/genuine/visual/responsive/accessibility/human checks and exact-head CI remain required before activation. Task grant/revoke APIs lack complete inventory/enrollment/source producers here. Full A08 agent/task/source administration, Account/Source/26-screen/full-goal acceptance remain open. Provider-blocked Guidance private-return and M65 work were not repeated, rephrased or rerouted. No resource/browser/preview/Figma/DB/native/OS fixture/provider/credential calls, full Root npm/Expo suite, push/PR/merge/deploy or live action occurred.

## OP1 correction: source follow-up, 1 November 2026

This append-only section records the bounded correction of OP1/P2 after the first independent review. The original candidate `1a7f5d12e2497873fc1fc249e89c9f61978dca69`, preceding report bytes and R1 **SPEC/completeness FAIL / correctness/quality FAIL** remain immutable historical evidence. Author tests do not close that independent verdict. A new independent R2 on the new frozen candidate is required before parent composition or activation.

### Scope, identity and failed-turn reconciliation

The same author worktree/branch starts at exact clean `1a7f5d12e2497873fc1fc249e89c9f61978dca69`. Allocated writes are only the existing permissions controller, NEW `apps/portal/tests/rebuild-owner-policy-refresh.test.mjs` and this appended report. `OwnerPolicy.tsx` required no change. All types, port/request, shared runtime/auth, Root contracts/SQL, navigation/Application, packages/configuration and old tests remain protected. No independent review or model reroute is represented by this author continuation.

Ordinal2's authoritative taskId was `node:delegated-task:command%3Amcp%3A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%3Athread-send%3Aw2-owner-policy-refresh-conflict-op1-source-fix-20261101`. Its backing run ended **failed**, with raw generic `Provider turn failed`; no provider cause was supplied and none is inferred. Its final tool command wrote only the NEW untracked test, then its recording wrapper exited1 with `ENOSPC` while opening `adjacent-before.log`. That error does not establish the provider failure's cause. The nested test child's exit/output were not printed or persisted before the log-write exception, so that child result stays **unknown**, not RED or GREEN. Both attempted adjacent log/command files were absent at ordinal3 reconciliation.

Before any modification or repetition, the exact partial test was copied to `ordinal2-refresh-test.original.mjs`:15,905 bytes, SHA256 `84ada7f1582dd8493fa0213600f52191af296c9a621c0467e4b86b1480e8feef`. It matches the eventual NEW tracked test byte-for-byte. `ordinal3-reconciliation.json` records the actual wrapper failure, absent logs and unknown child outcome separately. Production files still matched1a when the continuation began. No ordinal2 production fix or commit is claimed.

The **new ordinal3 authoritative taskId**, forwarded by the parent, is `node:delegated-task:command%3Amcp%3Add730894-0fab-4a94-873d-743422eae122%3Athread-send%3Aw2-owner-policy-op1-source-recovery-20261101`. The dd730894 tool-instance prefix is preserved exactly. Backing thread remains `thread:delegated-task:command%3Amcp%3A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%3Adelegate-task%3Aportal-rebuild-w2-owner-policy-connected-source-20261101-r1`; backing run is `run:thread:thread%3Adelegated-task%3Acommand%253Amcp%253A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%253Adelegate-task%253Aportal-rebuild-w2-owner-policy-connected-source-20261101-r1:ordinal:3`, ordinal3. These identities are recorded separately in `identity-ordinal3.json`.

Both initial and final live capabilities/self/parent configurations establish `codex / gpt-6.1-sol / xhigh / default`, full-access/default interaction and supported Sol descriptors. Project defaultModelSelection remains null, distinct from checked-in project/default-subagent Sol/xhigh/max8 and all eight role pins. Explicit Node22.23.0 is used throughout. No model/configuration changes, nested work or resource grants occurred. Existing same-lock own dependencies were reused: TypeScript6.0.3, esbuild0.28.2, React19.3.1 and real portal React declarations. No install, Auth copy, shim, cast or flag relaxation.

### R1 preservation and unchanged reproduction

Before source edits, read and copied the full R1 report from exact commit `251e3667ff0a7e39db33fbed81b4723c995bfe66`, SHA256 `348aa62dc18fcef3f4acc4f61e7f59dcdb97eb58eeec24aaed1b89257cd14419`. All78 original evidence files,11,282,958 bytes, were copied read-only from the reviewer workspace into own ignored `w2-owner-policy-op1/r1-originals/`, including probes, commands, OP1 observation, setup failure, corrected raw failure, original author evidence and provenance. All copy hashes were reverified on ordinal3. No foreign script or generated bundle was executed.

The complete archived original author brief is retained/hash-bound in the same own evidence area, SHA256 `55005be09a2bde31e24d79166fbe49741257f3ae7fe46926ed0060ed1a11fdf1`. Full approved input/specification/D01-D48/A08 node503:558/contracts/26-screen scope remains binding. This correction does not narrow the full approved goal. The later Account final-export decision is context only and adds no export or private-Source work to this slice.

The independent three-case probe is byte-identical in the author's own output-bound location, SHA256 `3eceab113e988ec84c034c8a3bc162f8c311c5021435d00c8c1184a4b70b7be0`; no assertion text was changed. On unchanged1a it reproduced **2 pass /1 semantic failure**, true exit1: current8/base7/desiredfalse, idle, no message, null confirmation before and after attempted reapply, two actual retained policy reads and zero settings. The original reviewer wrong-import setup and2/1 result remain distinct from this reproduction. Its standalone strict/retained checks stopped at OP1 and were not run by R1; current results below are new author executions.

### Minimal correction and UX consequence

A successful fresh read now enters the **existing conflict** state when it preserves local work against a changed base revision or owner, and no original pending operation remains unresolved. Original base and desired boolean stay intact. The existing comparison UI therefore exposes deliberate Reapply; only Reapply adopts the actual fresh policy basis. Save still stages a separate exact confirmation, and only confirmed Save constructs the UUID/confirmed setting command. No automatic rebase, save, intent, permission or new state/API/DTO/action/status field was added.

An unresolved original operation retains its existing uncertainty/status/exact-retry path even when another current read observes a newer policy. A historical receipt resolves only that original intent; the existing subsequent current read can then expose a comparison for remaining unsent work. An absent status remains absent; a subsequent explicit refresh can expose the changed-base comparison. Existing owner/view/publish/ready/lease, session/day/generation and confirmation guards are unchanged.

After explicit reapply, a desired value already equal to the actual current value now says `the current policy already matches your change.` It stays idle, requires no new setting and never claims this actor saved it. Otherwise the existing `your change is ready to review and save.` text remains. This is truthful recovery feedback in the existing notice, with no UI layout/component changes.

| Priority | Persona and goal | Observed problem and correction | Regression and evidence |
| --- | --- | --- | --- |
| P2 | Owner wants to preserve and apply an edit after refresh | Fresh revision previously left base/current mismatch in idle, so Save/Reapply returned no action. Existing conflict comparison now opens deliberate reapply, followed by separate confirmation. | Unchanged independent probe RED2/1 → GREEN3/3; actual-session synthetic HTTP and shared-wrapper SSR, no DOM claim |

### Executed checks and proof level

Own evidence home: `.local-artifacts/portal-rebuild/w2-owner-policy-op1/`. Every new recorder prints the actual child exit before writing logs, then retains exact executable/argv/cwd/timestamps/exit/signal and raw SHA256. This prevents a recording failure from hiding the child status as happened in ordinal2.

| Check | Result | Raw evidence |
| --- | --- | --- |
| Unchanged independent three probes on old1a | exit1; **2 pass /1 semantic OP1 fail**, no skip/cancel | `independent-before.log`, `OP1-before.json` |
| Preserved adjacent test on old1a, first recorded ordinal3 run | exit1; **4 pass /15 fail**,19 total, no skip/cancel | `adjacent-ordinal3-before.log` |
| Same independent probe after controller correction | exit0; **3/3**, no fail/skip/cancel | `independent-ordinal3-after.log`, `OP1-after.json` |
| Same adjacent source/actual-session/SSR test after correction | exit0; **19/19**, no fail/skip/cancel | `adjacent-ordinal3-after.log` |
| Retained policy suite, minimal import/output binding only | exit0; **59/59**, no fail/skip/cancel | `retained59.log`, `retained-binding.json` |
| Retained raw requests | exit0; **45/45** | `raw45.log` |
| Retained cookie cancellation/deadline plus raw | exit0; **256/256**, includes raw45 | `transport256.log` |
| Retained W2 source/SSR suites | exit0; **500/500** | `w2-source500.log`; no blocked audit probes |
| Configured frontend/session compiler and actual strong helper | all exit0 / zero errors | `frontend.log`, `session.log`, `strong.log` |
| Existing UI guard | exit0 | `ui-guard.log`; CSS unchanged |
| Actual feature/request/runtime browser-target closure | **2,147 inputs /6 outputs, write:false**, in memory | `retained-feature-build-metafile.json`, `feature-closure-proof.json` |

The adjacent19 cover same-revision preservation, newer same/different current values, already-current desired/no extra effect, repeated conflict refresh, stale confirmation, separate reapply/confirm, original409, potentially committed pending races, status/old receipt, absent status and later refresh, exact original retry, policy-owner change, actual role/view/session/dispose loss, owner-session replacement, reentrant read/throwing subscriber at conflict notification and actual shared-wrapper SSR. Existing59 retain both real lease waits/deadline/serialization and other source negatives. Synthetic subscriber seams do not prove DOM reachability.

The old policy test is unchanged on disk. Its minimally bound own copy changes imports/build cwd/metafile destination only, protecting the original1a artifacts from overwrite. All157 original assertion call texts are unchanged. The standalone strong config includes the actual existing assets declaration, readonly/API helper and UI; strict/noUncheckedIndexedAccess/verbatimModuleSyntax/skipLibCheck:false remain intact. Configured frontend/session keep their original flags, including the existing session skipLibCheck:true. All requests use actual ApplicationSession/cookie/new port/Root codecs with closed finite synthetic HTTP facts and global external-fetch denial. This is not SQL/Auth/gateway/Vault/persistence proof.

Principal commands, all using `/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node`:

```sh
node .local-artifacts/portal-rebuild/w2-owner-policy-op1/run-op1.mjs adjacent-ordinal3-after --import ./tests/portal-review-no-network.mjs --experimental-strip-types --test --test-concurrency=1 --test-timeout=15000 apps/portal/tests/rebuild-owner-policy-refresh.test.mjs
node .local-artifacts/portal-rebuild/w2-owner-policy-op1/run-op1.mjs independent-ordinal3-after --import ./tests/portal-review-no-network.mjs --experimental-strip-types --test --test-concurrency=1 --test-timeout=15000 .local-artifacts/portal-rebuild/w2-owner-policy-op1/independent-refresh.test.mjs
node .local-artifacts/portal-rebuild/w2-owner-policy-op1/verify-final.mjs
```

The first two recorder names are immutable run receipts and intentionally refuse overwrite; use a new name for a later run. `verified-commands.json` retains the exact expanded retained/compiler argv and true exits. Original MODULE_TYPELESS_PACKAGE_JSON warnings remain unsilenced. The earlier candidate59/SSR/setup/strong-type qualifications and R1 setup failure retain their original meanings; none is relabelled by the new green author results.

Self-review compared the two controller hunks with1a: existing authority and confirmation guards are unchanged, local comparison cannot dispatch or grant rights, pending ownership remains separate, and existing UI consumes the conflict state without new composition. All1,970 protected original paths, including all62 migrations, remain byte/mode identical; the original report prefix is unchanged and only appended. The NEW test retains the exact ordinal2 partial bytes. Final commit, path/blob/hash proof and clean-worktree readback are returned in own ignored delivery proof, avoiding a self-referential committed SHA.

**Still unrun/unaccepted:** new independent R2, Root composition/mount, browser/DOM/genuine/backend/SQL/Auth/visual/responsive/accessibility/human/exact-head CI and release. No full Root npm/Expo suite, foreign execution, resource/browser/preview/OS process inventory/native/DB/Storage/provider/R9/credential/network-service/live policy operation, nesting, Root write, push/PR/merge/deploy or export work occurred. Existing blocked Guidance private-return/M65 work was not retried, rephrased or rerouted. W0's Chrome and W7's Account review ownership did not transfer. Full A08/task/source administration and all wider approved-goal gates remain open.
