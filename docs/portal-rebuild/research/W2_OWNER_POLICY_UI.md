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
