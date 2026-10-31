# W7 independent approval recovery review

31 October 2026 UTC. New independent review round of C1 approval-authority recovery and the separately scoped obsolete context-read notice correction. Source, pure execution, actual-component SSR, strict types and candidate build only. No production fixes or nested agents.

## Separate verdicts

| Subject | Specification verdict | Correctness / quality verdict | Evidence boundary |
| --- | --- | --- | --- |
| Original four reachable C1 successful retry/status recoveries | **ADDRESSED in these sequences** | **PASS for these sequences** | Four original intended assertions now pass; original actual-component SSR keeps publication disabled. Both completion orders and exact request bytes pass the new73 matrix. |
| Complete C1 recovery correction, including definite status failure | **CHANGES REQUIRED: AR1/P2** | **CHANGES REQUIRED: AR1/P2** | A current request-status403 clears pending A and invalidates a newer restrictive read, leaving the older permissive context publishable. Actual app stack and actual-component SSR reproduce it. |
| Scoped obsolete context-read notice correction | **PASS within source/pure scope** | **PASS within source/pure scope** | Matching current success clears tagged nonpending context errors; pending uncertainty, manual/status/validation failures, comparison and mismatched provenance remain conservative. Browser/manual-input adjudication is unrun. |
| Browser, native fixture and full portal | **UNRUN / NOT ACCEPTED by this round** | **UNRUN / NOT ACCEPTED by this round** | Parent explicitly ended the browser phase after the source finding; another reviewer retains Chrome/native custody. Full approved goal remains incomplete. |

The unchanged selected canonical suite passes402/402. Independent failure matrix has16 pass/8 fail, including two403 intended-behavior failures; additional21 status/notice controls pass. These green checks do not override AR1. Counts overlap and are not a full portal acceptance total. No SQL authorization bypass or genuine revocation/payment/publication effect is claimed.

## Identity, runtime and source correspondence

- Review task suffix: `portal-rebuild-w7-approval-review-20261030-r1`. Child thread: `thread:delegated-task:command%3Amcp%3A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%3Adelegate-task%3Aportal-rebuild-w7-approval-review-20261030-r1`. Run: `run:thread:thread%3Adelegated-task%3Acommand%253Amcp%253A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%253Adelegate-task%253Aportal-rebuild-w7-approval-review-20261030-r1:ordinal:1`. Live thread readback binds parent `d632030a-18f7-4dec-a2c9-f5c0418c3fd5` and this checkout.
- Workspace `/Users/kanuj/.t3/worktrees/shelv/t3-7b2812c5`; branch `t3/review-approval-recovery`. Exact clean starting/base and reviewed production head **`c2e5e92c9934eead9b361728d537ccb7b3e4675e`**. Fresh `git status -sb`, `git log -6 --oneline`, applicable root/portal AGENTS and Git source readbacks preceded review. Fresh fetch succeeded; `origin/main=d39a7d4943209080df7c4cf97d85784f462758bf`; initial `HEAD...origin/main=104 0`.
- Author implementation **`b8bd5b3a73134e02b6d93e2fb32e8591c67bdcba`**, integrated as c2e5e92. All five delivery blobs (controller, types, cohesive test, browser helper, author report) match author/integration/current production bytes exactly. `source-correspondence.json` records blobs and SHA-256 values. Existing tests, app ports, session/transport, workspace/payment UI, root contracts/SQL and configuration are unchanged by the correction except its declared five paths.
- **Parent-imported documentation exception:** during this review the parent accidentally cherry-picked W1 report c3de01d into this checkout, producing **`1279502e76784374fda21047d054283076722a96`**. The parent disclosed this immediately. Git independently confirms its only change is `docs/portal-rebuild/research/W1_REMAINING_API.md`; all `apps/portal`, root `src`, `supabase` and `.codex` bytes remain identical to c2e5e92. No reset, removal or reconstruction was performed. Final types/build and supplemental probes use1279502 with the same production bytes. This review does not author or evaluate that W1 document. The sole reviewer-authored tracked commit adds this report, as a child of1279502; the final delivery supplies its exact report SHA rather than inventing a self-referential hash.
- Both live **`orchestrator_capabilities({})` and `t3_thread_configuration({})`**, before review and again before finalization, independently establish **codex / gpt-6.1-sol / reasoningEffort=xhigh / serviceTier=default**, runtime full-access, interaction default. Catalog descriptors allow reasoning `low, medium, high, xhigh, max, ultra`, default low; service tier `default, priority`, default default. Effective xhigh/default matches the requested selection. No fallback or delegation.
- Exact `.codex/config.toml` and all eight role configs `w0_foundation`, `w1_plan_platform`, `w2_advisor`, `w3_client_plan`, `w4_checkins_history`, `w5_orders`, `w6_account_service`, `w7_verification` parse as `model=gpt-6.1-sol`, `model_reasoning_effort=xhigh`. Project default-subagent fields also pin Sol/xhigh. `role-configs.json` retains all nine paths/hashes. Configuration is distinguished from the live runtime evidence above.
- Every Node/npm command explicitly prepends `/Users/kanuj/.nvm/versions/node/v22.23.0/bin` to PATH; actual Node **v22.23.0**. Portal dependencies were absent, so existing-lockfile `npm ci --offline --ignore-scripts --no-audit --no-fund` installed130 packages, exit0. No root install, package/lock/config change or disabled compiler flag.

Applied Resume, systematic debugging and verification-before-completion workflows. Read the full [coupled review](W7_COUPLED_SOURCE_REVIEW.md), [author response](W2_APPROVAL_RECOVERY_FIX.md), [W2 integration correction](W2_APP_INTEGRATION_FIX.md), [W7 app R2](W7_APP_FIXES_R2.md), [advisor R4](W7_ADVISOR_R4.md), [payment-context correction](W2_PAYMENT_CONTEXT_FIX.md), [W2 follow-ups](W2_FOLLOWUP_FIXES.md), [W0 composition](W0_APP_COMPOSITION.md) and [W0 fixes](W0_APP_FIXES.md), with original advisor/app/R3 findings and first F1-F3 response for their exact qualifications. Read the rebuild entry point, D01-D48, full desktop specification, implementation contracts, PLAN_API_V1, ADVISOR_READ_API_V1, acceptance matrix, workstreams and current status. The approved design is fixed; no new product scope or visual alternative was introduced.

Inspected the entire controller/types and new73-case source test, actual application session/retained facade/cookie class/factory, transport, complete application ports, strict root response mapper, advisor model, relevant workspace/manual-payment controls and the complete browser helper as source. Its helper uses the actual ApplicationShell/navigation and finite intercepted DTOs, but it was not imported or run here. No successful application port, `current()` implementation, strict mapper or controller was replaced.

## AR1 / P2: definite request-status denial still discards pending newer authority

**Owner:** W2 controller, coordinator integration. **Requirements:** D16/D22/D25/D38 and current authority versus immutable receipt separation. **Source at c2e5e92:** [controller.ts](../../../apps/portal/src/features/advisor/controller.ts), `reconcile` catch960-961, `fail`218-237, `beginRead`110-136, `refreshContext`390-470 and `canPublish`163-177. The successful-receipt correction in `accept` and retry-start retirement in `execute`356-387 do not cover the status-error branch.

`reconcile()` catches a current403 and calls `fail(e,true)`. Because it is definite, `fail` clears pending A and leaves context unchanged. Newer context read C captured A in `beginRead`; `state.pending === pending` now fails. C is correctly rejected by the existing applicability fence, but its older displayed authority remains. `stable()` checks pending/busy/comparison, not a denied/error notice or `save:'error'`. The older approval and active coverage therefore satisfy `canPublish()`. No stale private result needs to be accepted and no old approval receipt is installed in this failure path.

Exact independently executed sequence through actual cookie/factory/transport/root-mapper/app-port/controller boundaries:

1. Open the reviewed assigned fixture draft on the ordinary first open. Actual gate updates approve false to true. Set later publication/active coverage and refresh with no approval.
2. Deliberately approve A once. The checked-in reducer commits A. Add an unsupported field **only to the delivered acknowledgement**, so strict response mapping rejects it. A remains exact pending/uncertain, busy false.
3. Successful current refresh learns committed A and active coverage. Pending A still blocks publication. Its UUID and serialized payload remain intact.
4. Set synthetic authority to `approval:null` or `coverage:'inactive'`. Start current refresh C, capture the actual gate-shaped response and hold only delivery.
5. Invoke the source-exposed **check request status** control, which sends `request_status_v1` with A's exact UUID. Return finite HTTP403 `{code:'unavailable'}` at that HTTP boundary. Actual retained transport and mapper/error handling remain active. Pending becomes null, notice is denied, and old context is retained.
6. Deliver C. It is discarded because the pending-object basis changed. Observed **approval present, coverage active, pending null, busy false, canPublish true** for both restrictions. No second approval or publish command was sent. A subsequent legitimate current refresh installs the restriction and blocks publication again.

| Restriction / order | Final observed authority | `canPublish` | Intended assertion |
| --- | --- | --- | --- |
| null approval C completes before status403 | approval null / active coverage | false | pass |
| status403 completes before held null-approval C | old approval / active coverage | **true** | **fail** |
| inactive coverage C completes before status403 | approval present / inactive coverage | false | pass |
| status403 completes before held inactive-coverage C | old approval / active coverage | **true** | **fail** |

Actual-component SSR confirms the controls before the race: refresh/retry/status enabled, publish disabled. After403 and C delivery, the same actual workspace renders **revision approved** and **publish enabled**; the intended disabled-button assertion exits1. This is structural SSR plus source evidence, **not keyboard/browser reachability adjudication**. It uses the actual workspace/controller/shared controls with a synthetic navigation callback, not an independently rendered full ApplicationShell.

Adjacent definite400/404/429 variants show the same outcome only in failure-first order. The full24-case matrix is16 pass/8 fail. These extra statuses are diagnostics, not claims of genuine backend issuance in this exact sequence.409 retains real comparison state and remains blocked.503 preserves exact pending/uncertainty before held C delivery; a late successful C after the actual cookie suspends can correctly end the old session. Separate no-C503 and malformed-status controls retain A's exact bytes, restore normally where needed and recover through exact retry. `{status:'absent'}` also keeps pending A. There is no all-green claim for the24 matrix.

**Bounded correction requirement:** when a current definite recovery error clears pending and thereby invalidates a newer authority read, do not leave older permissive authority eligible. Preserve completed current authority, retain session/actor/view/target/purpose/operation/pending fences, and allow a lawful current refresh to recover. Test403 in both completion orders, null approval/inactive coverage, exact A UUID/bytes and definite versus uncertain status outcomes. Do not accept obsolete C, restore global permissions-JSON equality, or erase the denial notice to satisfy this finding. No production fix was made here.

This is stale client authority and an incorrectly enabled deliberate action. Final SQL/live authorization remains independent. These synthetic null/inactive/403 inputs do not establish genuine server revocation, a successful unauthorized publication, money movement or new client access.

## Original findings, representation differences and notice disposition

- Original reachable C1 retry/status by null approval/inactive coverage now passes **4/4**, with original bodies preserved. The cohesive73 matrix also covers both orders, remount/restored pending, failed retry, exact bytes, lawful current recovery, owner/CSRF/logout/actor/view/manual/operation/draft replacement, target/publisher/malformed/source/policy-shaped negatives and both read legs. Its73 pass do not cover AR1's definite status-error interleaving.
- The original unmodified full21 remains **18 pass/3 fail**. All three are the explicitly diagnostic direct-reapproval cases that the actual UI disables. They assert `context?.approval === null`; conservative whole-context retirement yields `undefined`, while every logged `canPublish` is false. This is a representation-specific diagnostic failure, not a reopened eligibility failure or UI acceptance. No assertion/source was changed to manufacture literal null.
- Original F1/F2/F3, R3-1/R3-2 and A1/A2/A3 keep their recorded scoped dispositions. The original F2 expectation that B stay pending **after valid awaited B acknowledgement** remains incorrect. A2's ordinary restore/browser reachability remains unproven. The lawful natural first-open gate mutation remains accepted, with real session/view fences preserved.
- Notice recovery uses optional internal origin `{purpose:'context',actorId,target}` only for nonpending context-read denied/error notices. Successful applicable combined gate/payment refresh clears only matching origin with no pending/comparison. Both read legs and real remount memory pass. Current failures stay visible until matching success. A stale context error cannot replace a newer successful view.
- Independent controls preserve actual manual-confirmation denial, request-status error, validation denial, real context409 comparison and uncertain pending A across successful context refresh. Artificial saved-provenance actor/target/purpose mismatches and legacy unclassified notices remain unchanged; these are explicitly session-memory negative controls, not asserted UI paths or wire fields. Completed recent permissive authority remains eligible after valid recovery; completed restrictions remain restrictive. Fresh lawful reads recover after conservative retirement.
- PaymentVerification source remains exactly82401b2's integrated correction. The unchanged canonical mapping/current CAS and exact-basis code were inspected. **Actual amount/receipt input persistence, late-single-claim UI behavior and the original notice browser probe are UNRUN in this review.** The author's browser11 and unchanged app11/payment28 are attributed author evidence only. No browser acceptance is inferred from source73/402 or SSR.

## Fresh execution and reproducible artifacts

All commands select the explicit Node22 PATH above; tests are serial with `--test-concurrency=1`. Root unless noted. Evidence root is this checkout's ignored `.local-artifacts/portal-rebuild/w7-approval-recovery/`; original C1/SSR dependencies are preserved under `.local-artifacts/portal-rebuild/w7-coupled-source/`.

| Executed check | Fresh result / artifact |
| --- | --- |
| Original adversarial21, unchanged | Exit1;18 pass/3 diagnostic representation failures/0 skip/0 cancelled; `original21.log` |
| Original positive selection `--test-name-pattern='^reachable uncertain'` | Exit0;4 pass/0 fail/0 skip/0 cancelled; `reachable4.log` |
| Original actual-component SSR build/render | Both exit0; after recovery approved false/publish disabled; `ssr-original-final.log` |
| New403 matrix, `--test-name-pattern='independent status 403'` | Exit1;2 pass/2 fail/0 skip/0 cancelled; `status403.log` |
| Full new definite/uncertain/order matrix | Exit1;16 pass/8 fail/0 skip/0 cancelled; `extra-pure-final.log` |
| New status-denial actual-component SSR | Build exit0; render exit1 at intended disabled-publish assertion; `ssr-status-denied.log` |
| Additional independent status/notice/current-authority controls | Exit0;21 pass/0 fail/0 skip/0 cancelled; `controls-final.log` |
| Selected unchanged source329 plus new73 | Exit0;402 pass/0 fail/0 skip/0 cancelled,3.58s; `canonical402.log` |
| Portal `npm run typecheck:rebuild`, `npm run typecheck:session`, `npm run check:ui`, `npm run build:application` | Each exit0; strict flags unchanged,11 retained stylesheets; final structured argument/exit receipt `checks.json` |
| Browser helper and adapted original notice probe `node --check` | Both exit0, syntax only; neither imported/executed |

Focused finding command:

```sh
export PATH="/Users/kanuj/.nvm/versions/node/v22.23.0/bin:$PATH"
node --experimental-strip-types --test --test-timeout=10000 --test-concurrency=1 \
  --test-name-pattern='independent status 403' \
  .local-artifacts/portal-rebuild/w7-approval-recovery/extra-pure.mjs
node .local-artifacts/portal-rebuild/w7-coupled-source/ssr-status-build.mjs
node .local-artifacts/portal-rebuild/w7-coupled-source/ssr-status-denied-built.mjs
```

Canonical402 command, from `apps/portal` with the same PATH:

```sh
node --experimental-strip-types --test --test-concurrency=1 \
  tests/rebuild-advisor-controller.test.mjs tests/rebuild-advisor-races.test.mjs \
  tests/rebuild-advisor-followup.test.mjs tests/rebuild-advisor-app-integration.test.mjs \
  tests/rebuild-advisor-approval-authority.test.mjs \
  tests/rebuild-app-ports.test.mjs tests/rebuild-app-session.test.mjs \
  tests/rebuild-app-state.test.mjs tests/rebuild-app-render.test.mjs \
  tests/rebuild-app-build.test.mjs tests/rebuild-foundation-transport.test.mjs \
  tests/rebuild-foundation-navigation.test.mjs tests/rebuild-foundation-notices.test.mjs \
  tests/rebuild-app-callback.test.mjs tests/rebuild-app-continuation.test.mjs \
  tests/rebuild-app-preview-context.test.mjs tests/rebuild-app-start.test.mjs
```

Original C1 scripts are byte-identical copies from `t3-06cff321/.local-artifacts/portal-rebuild/w7-coupled-source/`: adversarial, SSR source/build and probe helper. Supplemental tests copy only the inspected finite actual-app setup from the cohesive test, adapting relative import depth; the new cases/assertions are independently authored. New SSR changes only the recovery response to403 and its output filenames. Original source/repro worktrees remain read-only. The W2 notice browser original from `t3-69ad392d/.local-artifacts/portal-rebuild/w2-payment-context/notice-probe.mjs` is preserved byte for byte; a separate syntax-only copy adapts the absolute workspace/output prefix and remains unrun. `copy-provenance.json` records exact paths/hashes/adaptations.

An initial SSR attempt omitted its `ssr.tsx`/helper dependency and failed before rendering. Copying the exact inspected dependencies fixes setup; initial logs remain. The initial full status matrix's503 late-success session-ending behavior is preserved and explicitly distinguished above. No failing product assertion was weakened. No root/Expo dependency warning is promoted into a parent failure. Source402 and all checks leave tracked runtime bytes unchanged.

The final candidate provenance reports `sourceHead=1279502e76784374fda21047d054283076722a96`, `sourceDirty:false`, `gatewayIncluded:false`. This is an isolated actual-app package, not deployment, genuine cookie/Vault verification or whole-portal acceptance.

| Selected ignored evidence | SHA-256 |
| --- | --- |
| `extra-pure.mjs` | `b342d6e542cbb9166c60292d859fa2f131e544d926456029cb51c56340e44932` |
| `status403.log` | `2a37687f634cac980736d93f0911780273cfdb60d70b922183f1612eaf93c215` |
| `extra-pure-final.log` | `ca3b066bf3836d2e192b392c7c5aebde251cd143c0a5a458977bd67eef418cc6` |
| `controls.mjs` | `db677456fe41a7497b4d54037f815002f694362042e29db45d94ad2deb58745d` |
| `controls-final.log` | `30190b58dd68ab5c93e7df85e92c5cccd09757ca517a698e2f0b0e20fcee8883` |
| `canonical402.log` | `25c397e998ca2e82752421f0f30d04cfcb4edb6ab9d52dd71124d3549f75e74a` |
| `original21.log` | `1ba70057467e42546b62f6f00aa4293385f3dd665ed1fca3388d346db9cab14a` |
| `ssr-status-denied.log` | `83d9299e3451ce1da2c2fc7dac940369e4dbea3a5c4ac8efe60c731f55fc31af` |
| `copy-provenance.json` | `ba428318e23546c9de684d85348da367dfe24b1a9ccc4dfa1f1ddb21ed12d324` |
| `source-correspondence.json` | `96233c2803cee5378fdafd8774ad61888d084548755e0a6acd7f8e023a5cb7e3` |
| `checks.json` | `9a2bcc06e1d9939a1c87d505415704fe039e048a91736e46ceb2128b2c891472` |
| `runtime-final.json` | `1ab225116163d6e20cf0831e3ab8d4067a40b1f74e90fca45e3eaa1e73a927a1` |

`evidence-manifest.json` inventories every original/new probe, HTML/bundle and log in the two local evidence directories, excluding itself. SHA-256: `a7a89bce316d9ea4e928aac63c988a7dc4e17a2627c480f624064b576f2fd61b`.

## Resource and acceptance limits; parent continuation

**Browser phase UNRUN.** No browser/DOM process was launched or inspected, no preview browser tool was called, no Chrome context was acquired, and no keyboard/screenshot/full-shell visual verdict is claimed. Parent explicitly directed source-only finalization after AR1 while the native reviewer retained Chrome. This reviewer has no browser allocation/handle to release and makes no claim about the other reviewer's processes or preview tabs. All owned Node/test/build handles are terminal; no long-running server/helper was started.

No native DB/PG/Docker/Auth credential/helper/lifecycle or parent fixture access. No reset/pgTAP/RLS, genuine gateway/Vault/Auth/Edge/PostgREST/revocation/payment/publication/notification rerun, hosted action, real client/source/permission write, message, funds/order, push/PR/merge/deploy or other-worktree write. No full root/portal/Expo/mobile suite or exact-head CI. The bounded controller correction does not require claiming those heavier checks; their existing parent evidence stays separately attributed.

D01-D48, remaining pages/secondary flows, raw-source/consent/retention, actual Start/use, notification delivery, clinical/legal/human comprehension, full accessibility/visual comparison, exact-head CI and release authorization remain parent-owned open gates. Canonical status and CONTEXT_SYNC are outside this report's write-set.

Parent should integrate only the reviewer report commit, retain the original successful-recovery and scoped notice dispositions, allocate AR1 to W2, and commission a **new** independent review against the next integrated fix head. Preserve both completion orders, exact A bytes and uncertainty semantics. Do not reuse a terminal review round or treat source402/author browser counts as full portal acceptance.
