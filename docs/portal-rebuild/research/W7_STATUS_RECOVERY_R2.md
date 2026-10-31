# W7 independent status-recovery review, round 2

31 October 2026 UTC. Independent review of AR1/P2 and retained C1/current-context notice behavior. No nested agents or production fixes. **Chrome released before report writing.**

## Separate verdicts

| Subject | Specification | Correctness / quality | Evidence boundary |
| --- | --- | --- | --- |
| AR1: failed request-status lookup | **PASS / ADDRESSED** | **PASS** | Original independent24 now24/24; input-only old controller reproduces16/8. Exact pending command survives lookup errors and current restrictive reads remain applicable. |
| Original C1 successful receipt/retry recovery | **PASS, retained** | **PASS, retained** | Original reachable4, both actual workspace SSR cases, retained73 source cases within full907 and eight retained keyboard combinations pass. Completed restrictions survive; invalidated unapplied authority is conservatively retired. |
| Origin-scoped obsolete context notice and manual payment intent | **PASS within tested scope** | **PASS within tested scope** | Independent notice/provenance controls, three actual-shell notice/manual-intent widths and unchanged payment28 pass. Unrelated failures/comparison/pending intent remain conservative. |
| Current portal/session regression checks | **PASS for executed checks** | **PASS for executed checks** | Full portal907/907; full retained session163/163; strict frontend/session types, UI guard and clean-head application candidate pass. This is not complete D01-D48 or release acceptance. |

**No new reproducible in-scope blocker.** The two original harness qualifications below remain visible. No SQL bypass, genuine revocation/payment/publication effect, full visual/accessibility acceptance or new genuine Auth evidence is inferred from intercepted tests. Counts overlap and must not be summed into a product acceptance total.

## Exact identity, runtime and source

- Task ID: `node:delegated-task:command%3Amcp%3A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%3Adelegate-task%3Aportal-rebuild-w7-status-review-20261030-r2`.
- Child thread: `thread:delegated-task:command%3Amcp%3A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%3Adelegate-task%3Aportal-rebuild-w7-status-review-20261030-r2`.
- Run: `run:thread:thread%3Adelegated-task%3Acommand%253Amcp%253A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%253Adelegate-task%253Aportal-rebuild-w7-status-review-20261030-r2:ordinal:1`.
- Actual live thread readback identifies parent `d632030a-18f7-4dec-a2c9-f5c0418c3fd5`, project `ac0af19d-d404-4f53-a870-02bfd76c2a80`, workspace **`/Users/kanuj/.t3/worktrees/shelv/t3-121bd7aa`**, branch **`t3/verify-ar1-status-recovery`**.
- Exact clean starting/base and all tested runtime source: **`44f9f4d9ca4ed09e02ffef4b8578170a11eb65da`**. Resume used actual `pwd`, `git status -sb`, branch/head/log and both applicable AGENTS before substantive review. Fetch of origin/main succeeded: **`d39a7d4943209080df7c4cf97d85784f462758bf`**, divergence **112/0**. No rebase/reset/import or other-worktree write.
- Author production/test commit **`2838d7754e51ba73d820753bb8428b9e43b493fd`** is integrated as **`1b6db5a7f3033236e739d11dc34c4f027beb0023`**. Author report **`e7275ae55e69f869e6c442d97dee759080237c1b`** is integrated at44f9f4d. All three source/test blobs match author, integration and reviewed head exactly; report blobs match e7275ae/44f9f4d. `source-correspondence.json` records Git blobs and SHA-256 values.
- `git diff 1b6db5a^ 44f9f4d -- apps/portal/src` contains exactly the `reconcile` catch's **`fail(e,true)` to `fail(e)`** and three comment lines. Prior `appliedContextGeneration`, WeakMap, notice origin, natural gate capability handling, workspace/payment UI and all other production statements are byte-preserved. Author report head versus review head has zero delta in portal source/tests, root `src`, `supabase` and `.codex`.
- Before review and again before finalization, **both live `orchestrator_capabilities({})` and `t3_thread_configuration({})`** independently establish **codex / gpt-6.1-sol / reasoningEffort=xhigh / serviceTier=default**, full-access/default interaction. Catalog descriptors support reasoning `low, medium, high, xhigh, max, ultra` (default low) and service tier `default, priority` (default default). Effective xhigh/default matches the task. No fallback/delegation.
- Parsed `.codex/config.toml` and **all eight overrides**: w0_foundation, w1_plan_platform, w2_advisor, w3_client_plan, w4_checkins_history, w5_orders, w6_account_service, w7_verification. Each pins Sol/xhigh; project subagent defaults agree. `role-configs.json` retains all nine original files/hashes. File configuration and live runtime are separate evidence.
- Every Node/npm execution explicitly selects **`/Users/kanuj/.nvm/versions/node/v22.23.0/bin`** first in PATH; actual Node **v22.23.0**. Portal dependencies were absent; existing-lockfile `npm ci --offline --ignore-scripts --no-audit --no-fund` installed130 packages. No root install, package/lock/config change or compiler relaxation.

Applied Resume, systematic debugging and verification-before-completion. Read the full [AR1 review](W7_APPROVAL_RECOVERY_REVIEW.md), [status correction](W2_STATUS_RECOVERY_FIX.md), [approval/notice correction](W2_APPROVAL_RECOVERY_FIX.md), [coupled review](W7_COUPLED_SOURCE_REVIEW.md), [initial-open response](W2_APP_INTEGRATION_FIX.md), [payment response](W2_PAYMENT_CONTEXT_FIX.md), [app R2](W7_APP_FIXES_R2.md), [advisor R4](W7_ADVISOR_R4.md) and [native browser review](W7_NATIVE_BROWSER_REVIEW.md), with relevant original F1/F2/F3/R3/app objections and responses. Read D01-D48, full desktop specification, implementation contracts, PLAN_API_V1, ADVISOR_READ_API_V1, status, workstreams and acceptance. The approved design is fixed. CARE_API remains the next separate, unimplemented backend at this review base; no care/SQL/Auth implementation or acceptance is performed here.

Inspected actual controller/model/types/workspace, application session and retained facade, cookie class/factory, captured transport, application ports, strict root receipt/gate mappers, finite reducer/harness and new29 source/new4 browser cases. The controller is not its own authority: server commit-time approval, source/policy/payment/coverage checks remain independent.

## Why AR1 is addressed

The original sequence remains reachable without forced permission equality or reapproving an already-approved UI: lawful first open updates approve false to true; approval A commits in the checked-in reducer; an unsupported acknowledgement field is rejected by the actual strict mapper. Exact A remains uncertain. A current refresh learns A/active coverage while pending A blocks publication. Restrictive current C then captures null approval or inactive coverage, with only HTTP DTO delivery held.

The corrected status403 catch does not classify that **read** as original mutation failure. It retains the identical pending object, UUID/payload and `save:'uncertain'`, with visible denial. C's pending-object lease remains applicable and installs its restriction in failure-first order. Authority-first C remains restrictive. Publish stays disabled and no new approval/publish UUID is emitted. Both orders/restrictions pass actual source execution and four actual-shell keyboard cases.

Independent old-input sensitivity bundles only `git show 1b6db5a^:apps/portal/src/features/advisor/controller.ts` instead of current controller input. All other dependencies and original24 assertions remain current. Result **16 pass/8 fail**: failure-first400/403/404/429 by both restrictions enable old authority at the intended assertion. Current original24 is **24/24**. Production files are never overwritten; the historical failures are defect sensitivity, not accepted behavior.

Preserved semantics, independently checked:

- Lookup400/403/404/413/415/429/503, absent and malformed success preserve original uncertainty. Denial/error remains visible; no fresh write or new UUID is unlocked. Five write families are covered: create, save, apply-import, approval and publication. Fifty fresh cases additionally check captured first/retry **wire bytes**, not object property-order approximations. Newer manual save text survives acknowledgement of the original captured command.
- Positive absent is not proof of failure. Malformed envelope, wrong target/publisher and wrong receipt family do not acknowledge A. Positive committed status still passes strict receipt mapping and command-specific acknowledgement. An old receipt is never reconstructed as fresh gate authority. Exact retry is the original command; it is not an automatically changed mutation.
- Real409 comparison meaning remains. A refresh cannot waive comparison on an existing draft. An uncertain create has no local draft to compare: it keeps the conflict notice/pending command without setting a nonexistent-draft comparison flag.
- Actual503 suspends the cookie but retains the unexpired same-lease uncertain boundary; normal public `runtime.restore()` precedes further successful requests. In original24's held-C503 sequence, late success after suspension can end the actual private boundary. A green eligibility assertion there does not claim pending survives actual invalidation.
- Actual401, owner/CSRF replacement, logout and expiry clear the old private boundary and reject held results. Role/actor/view cases include explicitly artificial negative inputs, not genuine server revocation. Manual/local replacement, blocked draft switching, exact retry, later busy/uncertain operation, purpose/target/view/operation/pending generations and late success/error fences remain tested. No session `current()` implementation, successful application port or mapper is replaced.
- Original successful C1 retry/status controls remain **4/4**. Both actual workspace SSR executions show refresh/retry/status enabled and publish disabled before recovery, then approved false/publish disabled afterward. The original WeakMap/applied-generation behavior preserves completed newer restrictions or retires older authority when a newer read is invalidated before applying. A lawful current refresh can recover eligibility.

## Notice and payment behavior retained

Only a nonpending context-read denied/error notice carries context purpose, captured actor and exact target origin. A successful **applicable combined gate/payment** read clears only matching provenance, with no pending command or comparison. Both read legs and controller remount pass independent controls. Actor/target/purpose/unclassified provenance negatives remain conservative; these metadata alterations are explicitly artificial session-memory controls.

Current denial remains until matching success. Obsolete read errors cannot replace newer successful state. Status denial, pending uncertainty, manual verification/validation errors and real409 comparison are retained across successful context refresh. No global notice erasure, hidden DOM/CSS workaround or stale-private response acceptance is introduced.

Payment reconciliation remains the unchanged context/claim-status path, not plan request-status decoding. The exact receipt-intent basis and current financial CAS remain unchanged. Full907 includes unchanged payment28 and app11. Retained recovery11 includes three actual-shell notice/manual-input cases at1440/390/320: obsolete matching denial clears, amount/receipt work remains for the same semantic basis, replacement basis resets and deliberate confirmation remains required. No auto-payment/publication/Start occurs in these probes.

After Chrome release, directly viewed fresh local `approval-failure-first.png` and `notice-current-payment-1440.png`: actual shell/sidebar, visible denial with recovery controls and disabled publish; usable current payment form with retained manual input and no obsolete denial. This is bounded rendering/state evidence, not exact approved-frame pixel matching or human comprehension.

## Fresh commands and results

Evidence root: this worktree's ignored **`.local-artifacts/portal-rebuild/w7-status-recovery-r2/`**. `execution.json` preserves exact argument arrays/cwd/exits/timing, `checks.json` preserves strict/build commands, and full logs retain failures/warnings. All tests run serially, no simultaneous browser/test processes.

| Executed check | Fresh result |
| --- | --- |
| Portal `node --test --test-concurrency=1 tests/*.test.mjs` | **907 pass/0 fail/0 skip/0 cancelled**, exit0,321.323s. Same automatic glob as npm test, explicitly serialized; includes new29 and retained73 source cases, app/payment/advisor/client/browser/build regressions. Run once. |
| Original independent `extra-pure.mjs` | **24/24 pass**, exit0 |
| New independent `independent-fresh.mjs` | **69/69 pass**, exit0:50 cross-write/outcome cases,5 receipt negatives,14 held success/error boundary cases |
| Original unmodified `controls.mjs` | **19 pass/2 fail**, exit1; superseded pending-null expectations, described below |
| Separate `controls-read-semantics.mjs` | **21/21 pass**, exit0; changes only that expectation branch and strengthens exact-pending/save/comparison assertions |
| Original unmodified full `adversarial.mjs` | **18 pass/3 diagnostic failures**, exit1; literal null versus retired context, described below |
| Original `--test-name-pattern='^reachable uncertain'` | **4/4 pass**, exit0 |
| Input-only old controller plus original24 | Build exit0; **16 pass/8 intended fail**, exit1 |
| Original successful-recovery and status-denial actual workspace SSR | Both builds and both renders exit0; actual controls remain conservative |
| Explicit `tests/rebuild/advisor-recovery-browser.mjs` and `advisor-status-browser.mjs` | **15/15 pass**, exit0,11.770s; outside automatic glob |
| New independent actual-shell keyboard probes | **2/2 pass**, exit0; denial -> current restriction -> absent -> exact retry, both restrictions, captured wire equality and zero publication command |
| Portal `npm run test:session` | **163/163 pass**, exit0,38.716s. Full unchanged runtime once, including isolated Miniflare/canned-provider and intercepted two-owner browser checks; not genuine Auth/SQL. |
| `npm run typecheck:rebuild`, `npm run typecheck:session` | Both exit0, zero diagnostics, strict flags preserved |
| `npm run check:ui` | Exit0,11 retained stylesheets |
| `npm run build:application` at clean44f9f4d | Exit0; `sourceHead=44f9f4d9ca4ed09e02ffef4b8578170a11eb65da`, `sourceDirty:false`, `gatewayIncluded:false` |

Focused root commands all use explicit Node22 PATH and:

```sh
node --experimental-strip-types --test --test-concurrency=1 --test-timeout=15000 \
  .local-artifacts/portal-rebuild/w7-approval-recovery/extra-pure.mjs
node --experimental-strip-types --test --test-concurrency=1 --test-timeout=15000 \
  .local-artifacts/portal-rebuild/w7-status-recovery-r2/independent-fresh.mjs
node .local-artifacts/portal-rebuild/w7-status-recovery-r2/historical-build.mjs
node --experimental-strip-types --test --test-concurrency=1 --test-timeout=15000 \
  .local-artifacts/portal-rebuild/w7-status-recovery-r2/historical24.mjs
node .local-artifacts/portal-rebuild/w7-coupled-source/ssr-build.mjs
node .local-artifacts/portal-rebuild/w7-coupled-source/ssr-built.mjs
node .local-artifacts/portal-rebuild/w7-coupled-source/ssr-status-build.mjs
node .local-artifacts/portal-rebuild/w7-coupled-source/ssr-status-denied-built.mjs
```

Browser15 runs from `apps/portal` with the same flags on the two explicitly named files. `browser-independent.mjs` runs from root with those flags. No test/source was edited in tracked paths.

## Raw historical harness results and justified adaptations

1. **Original full21 remains18/3**, unmodified. Its three direct-controller reapproval diagnostics demand literal `context?.approval === null`; conservative whole-context retirement yields undefined. Every corresponding logged `canPublish` is false; the UI disables direct reapproval. These are not reopened eligibility failures, passing original tests or ordinary UI reachability claims. Original reachable4 passes without adaptation.
2. **Original controls21 remains19/2**, unmodified. Two cases demand pending null after status403/409. That conflicts with the coordinator's required READ semantics. The separate adapted copy replaces only that branch with identical original pending object/bytes, uncertain save, denied/conflict notice, no origin, correct comparison flag and blocked publication. It keeps all other original assertions. It passes21/21; genuine denial/comparison is not masked. Fresh cross-write cases independently verify retention and exact retries.
3. Initial new69 was **68/1**: the reviewer expected comparison on create409 despite `view:null`. Existing `fail` intentionally sets comparison only when a draft exists. Corrected only this assertion to require409 **and a view**. Conflict/pending/write-blocking checks remain. `independent-fresh-initial.mjs` and `fresh69-initial.log` retain the raw result; corrected69 passes. No production change followed.

Original eight repro/helper/SSR files were read/copied byte for byte from the expressly permitted `t3-7b2812c5` directories; extra-pure SHA-256 still **`b342d6e542cbb9166c60292d859fa2f131e544d926456029cb51c56340e44932`**. `copy-provenance.json` identifies every original/copy/hash. New assertions reuse only inspected finite actual-app setup; browser setup adapts import/workspace/artifact paths and retains actual ApplicationShell/canonical navigator/components. Original worktrees remain read-only. The round1 parent-imported docs exception1279502 and report2a23cd2/integration2eecc69 remain preserved, with no reset or cleanup.

Existing typeless-package and missing root Expo-base warnings remain in appropriate logs. Both actual strict frontend/session checks pass without changing flags or installing root dependencies. Expected historical red is not relabeled current success.

## Resource release, evidence integrity and remaining gates

First browser call was live `preview_status`: no tab. Used the expressly granted installed-Chrome/Playwright-core repository workflow. Focused probes serve only finite `.invalid` documents/APIs and in-memory bundled assets, block service workers/background networking/DNS and fail unexpected traffic/page errors/console warnings/errors except exact injected403 messages. Existing full suites retain their checked-in intercepted origin labels and isolated canned-provider Miniflare tests; these do not contact genuine providers or the parent fixture. No HTTP application server, DB/PG/Docker/Auth/native helper, credential or fixture lifecycle access.

**Chrome RELEASED `2026-10-31T04:46:00.543477+00:00`**, immediately after terminal full/browser/session runs and before report writing. Fresh executable process inventory is **Chrome/Chromium/workerd[]**, live preview has **no tab**, and all owned test handles are terminal. `release.json` records this; release was explicitly reported to the parent. No browser/DOM calls follow release. Later PNG inspection reads local files only.

`evidence-manifest.json` inventories60 selected ignored scripts/logs/runtime/source-copy/build/release/SSR/image artifacts, excluding itself. SHA-256 **`448b9addf6a806d5d735eb48399d23ff66e26a3fcfc483bc47e490728ac0e405`**. Selected digests:

| Artifact under evidence root | SHA-256 |
| --- | --- |
| `full-portal.log` | `e86a8557090c68900ce24a43fa145bb4c6ca424b861c5e720bc8c342f8f8920b` |
| `session-full.log` | `c8b68aa15ada678d6a7e7402860dbc8579545fe355a6a6db26a82fc79fe34342` |
| `fresh69.log` | `f1808d62eb75103833077e402899654c52ca3947566739e67f079aa63dc825dc` |
| `historical24.log` | `7a86c1daa5157e2acde0de0fb4c24baf44ab6e39b2fd5bac844010662258f3a4` |
| `browser15.log` | `f72d9841ca40d2c095a79e72cbaec7863717b6df44816e5c4299dd10841bdbc5` |
| `browser-independent2.log` | `77ffbdd774bdec623e338d104e166413b8e56d6ca7b19dd820ec1ca218e19935` |
| `application-provenance.json` | `256ae31feddca62671c6433b0a405d46a58e7082fedd81e62642a17ede966f09` |

The sole authored tracked path/commit is **this report**, as a child of44f9f4d. Final handoff supplies its real commit SHA after report links, whitespace, diff/index scope and clean readback checks. No production/test/package/config/status/CONTEXT_SYNC change. Coordinator owns canonical status and report integration.

The genuine main13/readonly4 independent PASS remains at its actual **89527a8** head in [the native report](W7_NATIVE_BROWSER_REVIEW.md); it was not rerun or upgraded to current-head Auth/SQL evidence here. This single read-error classification change does not justify claiming a new SQL/Auth run. Prior F1/F2/F3/R3, app/client/backend findings retain their recorded qualified dispositions, including A2 ordinary restore/browser reachability remaining unproven and the incorrect original F2 pending-after-valid-ack assertion.

Still pending under the full goal: care/backend/use/dependency implementation and review, raw uploads/source permissions/consent/retention/templates, reports/amendments/history/reviews, commerce/orders/returns, account/service/export/privacy, actual notification delivery/webhook/inbox/retry, complete Maya/private-demo flows, all26 screens/secondary states, full visual/accessibility/human review, clinical/legal/business clearance, subsequent migration/cutover/rollback, exact-head CI and release authorization. Root tests/types/Expo/native exports, migrations/reset/pgTAP/RLS and genuine Auth/native browser are not rerun. No push, PR, merge, deployment, external message, real client/source/permission write, funds or retailer action.
