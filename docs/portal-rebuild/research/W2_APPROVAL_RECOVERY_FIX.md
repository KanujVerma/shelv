# W2 approval recovery and context-notice correction

31 October 2026 UTC. Bounded implementation response to **C1/P2** in [W7 coupled source review](W7_COUPLED_SOURCE_REVIEW.md) and the separately reproduced global-notice request in [W2 payment-context correction](W2_PAYMENT_CONTEXT_FIX.md). Author source/SSR/browser verification passes within the scopes below. **Fresh independent review remains required.** This is stale client authority recovery, not a demonstrated server authorization bypass or full portal acceptance.

## identity, ownership and lineage

- Workspace `/Users/kanuj/.t3/worktrees/shelv/t3-77cf6a02`, branch `t3/fix-approval-authority-recovery`. Exact clean starting base **`97aa801f58471f8e657d00de1775da7f20f6ee29`**. Payment correction **`82401b20584b333d771ec9d1f09c07d7420f36e7`** is its verified ancestor. Fresh fetch succeeded; `origin/main=d39a7d4943209080df7c4cf97d85784f462758bf`, initial `HEAD...origin/main=94 0`.
- Before source work, both live `orchestrator_capabilities({})` and `t3_thread_configuration({})` independently returned **codex / gpt-6.1-sol / reasoningEffort=xhigh / serviceTier=default**, full-access/default interaction. Task suffix `portal-rebuild-w2-approval-recovery-fix-20261030-r1`. No nested agent or fallback.
- Every Node/npm command selects `/Users/kanuj/.nvm/versions/node/v22.23.0/bin` first in PATH. Existing-lockfile `npm ci --offline --ignore-scripts --no-audit --no-fund` installed130 packages. Cached Prettier3.6.2 formats owned files only. No package, lockfile or configuration change.
- Only five tracked paths are authored: advisor `controller.ts`; the compatible optional internal notice-origin type in advisor `types.ts`; new cohesive `tests/rebuild-advisor-approval-authority.test.mjs`; its scoped UI helper `tests/rebuild/advisor-recovery-browser.mjs`; this report. The initial two pure test files and source helper were consolidated without changing their assertions. No existing test, fixture, app port, callback, workspace/payment UI, shared UI/routes/session/gateway/root contract/SQL/package/status or `CONTEXT_SYNC.md` changed. All controller methods, options and exports remain compatible.

Applied Resume, receiving review, systematic debugging, TDD, verification, repository task-first UX/design and the repeatable Playwright regression guidance. The explicit finite repository browser workflow governs this task. Read the full coupled review, [W2 app integration correction](W2_APP_INTEGRATION_FIX.md), [W7 app R2](W7_APP_FIXES_R2.md), [W7 advisor R4](W7_ADVISOR_R4.md), original W2 delivery/F1-F3 response/R3 follow-up and original/R3 advisor reviews. Read the retained terminal R2 draft in `t3-695ed988`, applicable AGENTS, rebuild decisions/full desktop specification/contracts/advisor-read contract and ownership/status. Inspected actual CookieAdvisor/application session, captured transport, strict root mappers, application ports, controller/model/types/workspace and retained tests. D16/D22/D25/D38 govern this correction. The parent's D39 addendum relocation and unchanged manual deletion of never-started sources require no edit in this write-set.

Original findings and responses remain intact. F1/F2/F3, R3-1/R3-2 and A1/A2/A3 keep their recorded scoped dispositions. The latest natural-capability first-open correction remains: a lawful assigned gate may change mutation capabilities; global permissions-object equality is not restored. A2's ordinary browser reachability remains unproven. The original F2 assertion demanding pending B after a valid awaited B acknowledgement remains incorrect. No historical report is rewritten to manufacture a pass.

## C1 response

Reproduced the exact source-supported sequence through the actual cookie/factory/transport/root-mapper/app-port/controller stack: one lawful approval A commits in the checked-in reducer; only its delivered acknowledgement gains an unsupported field. Strict mapping refuses it and retains the exact uncertain command. A successful refresh then learns committed A/active coverage while A remains pending. A newer real-shaped gate C captures null approval or inactive coverage, with only DTO delivery delayed. Exact retry/status recovers A's immutable receipt, invalidates C's context lease (and retry advances operation generation), clears pending and previously left the older permissive context publishable.

The controller now records which authority generation actually applied. If approval recovery invalidates a newer read that has not applied, it clears the older context before publication can become eligible. Retry also retires that authority when starting the attempt, covering a definite retry denial as well as a valid receipt. A newer completed restrictive context is preserved. A subsequent lawful current refresh can recover authority normally. No delayed private result is accepted and no current-read lease is weakened.

Exact A UUID/payload/status lookup, strict acknowledgement, unknown-result/manual state, session/actor/view/target/purpose/operation/pending fences and original WeakMap issuance basis remain. The server still independently checks current approval, policy, source authority, coverage and every final transaction gate. Synthetic null approval, policy/source failures and inactive coverage here are **not genuine server revocation observations**.

## notice response

The independent payment worker's exact probe was inspected at `t3-69ad392d/.local-artifacts/portal-rebuild/w2-payment-context/notice-probe.mjs`. Its current gate403 leaves a nonpending denied notice; a later successful gate/payment context for a replacement eligible claim previously left that obsolete notice visible.

Only nonpending context-read `denied`/`error` notices now carry optional internal origin metadata: context purpose, captured actor and exact target. A successful applicable combined gate/payment refresh clears that tagged notice only for its matching actor/target, with no pending command or comparison requirement. Both payment-read and gate-read failures use this origin. Metadata lives in existing session memory and survives real controller remount; legacy/unclassified notices remain conservative. It is not a wire field, browser persistent storage or new authority.

Successful refresh preserves uncertain pending-command recovery, manual confirmation errors, unrelated validation errors, current denial and real409 comparison state. No global failure erasure or workspace/CSS suppression is used. Harmless same-basis financial refresh retains actual manual amount/receipt input under unchanged82401b2; replacing the exact claim still resets it. No confirmation or publication is automatic.

| Priority | Advisor goal / observed issue | Smallest correction and regression | Evidence |
| --- | --- | --- | --- |
| P2 C1 | Recover exact uncertain approval while checking current authority; old receipt discarded C and restored eligibility | Preserve completed current authority or retire older context; both orders, retry/status, null approval/inactive coverage, restored command, failure and stale-result fences | Independent source4 red/green, actual SSR red/green, cohesive73, actual keyboard UI8 |
| P2 notice | Continue manual receipt verification after a current successful replacement context; obsolete denial remained | Origin-bound nonpending read-notice recovery; preserve real command/manual/conflict failures and same-basis intent | Independent original probe green, exact-base UI red, current UI at1440/390/320 |

## red/green evidence and exact commands

Evidence root: `.local-artifacts/portal-rebuild/w2-approval-recovery/`. Original independent C1 scripts are byte-identical copies from `/Users/kanuj/.t3/worktrees/shelv/t3-06cff321/.local-artifacts/portal-rebuild/w7-coupled-source/` into this checkout's identically located ignored directory. The independent notice copy changes only its absolute workspace prefix to this checkout. Original worktrees remain read-only. Counts overlap and are not an aggregate portal-acceptance total.

| Executed check / artifact | Actual result |
| --- | --- |
| Mandatory independent reachable C1 before production changes; `independent-red.log` | **0 pass /4 fail /0 skip /0 cancelled**, all four intended eligibility assertions |
| Mandatory original actual-component SSR before changes; `ssr-red.log` | Build exit0; renderer exit1. Refresh/retry/status enabled, publish disabled before recovery; publish incorrectly enabled afterward |
| Initial durable real-app69 before production changes; `regression-red-corrected.log` | **27 pass /42 fail /0 skip /0 cancelled**. Expected authority and stale-notice failures |
| Adjacent failed-retry sensitivity before its correction; `retry-failure-red.log` | **3 pass /1 fail**, definite403 recovery restored eligibility;409 comparison and uncertain outcomes remained blocked |
| Exact final cohesive73 against input-only base97aa801 controller; `historical73.log` | **30 pass /43 fail /0 skip /0 cancelled**, no current source overwritten |
| Current cohesive73; `cohesive73.log` | **73 pass /0 fail /0 skip /0 cancelled** |
| Selected source/SSR/transport/session/app/advisor tests; `source-final.log` | **402 pass /0 fail /0 skip /0 cancelled**,3.72s: unchanged329 plus new73. Includes unchanged217 advisor controls and34 actual-app integration cases |
| Mandatory four independent reachable C1 after correction; `independent-c1-green.log` | **4 pass /0 fail /0 skip /0 cancelled** |
| Mandatory original actual-component SSR after correction; `ssr-final.log` | Build/render exit0. Recovery controls enabled before; approved false and publish disabled after |
| Exact-base actual keyboard UI sensitivity; `browser-historical-red.log` | **0 pass /2 fail /0 skip /0 cancelled**: C1 enabled publication and old notice still visible |
| New actual-shell UI helper; `browser-first.log` | **11 pass /0 fail /0 skip /0 cancelled**,8.44s: eight C1 combinations plus three notice/manual-intent widths |
| Independent original notice probe, workspace-prefix adaptation only; `notice-independent-green.log` | **1 pass /0 fail /0 skip /0 cancelled** |
| Unchanged actual app11 plus payment-context28; `browser-existing39.log` | **39 pass /0 fail /0 skip /0 cancelled**,40.65s; natural first assigned open, app recovery, late claims, exact frozen basis/current CAS and same-basis preservation |
| `npm run typecheck:rebuild`, `npm run typecheck:session`, `npm run check:ui`, `npm run build:application`; `checks.json` | All exit0; unchanged strict/noUncheckedIndexedAccess flags,11 retained stylesheets, isolated actual application candidate without gateway |

The unmodified full independent21 run is retained as `independent-green.log`: **18 pass /3 fail**. Those three failures are the explicitly diagnostic-only direct reapproval cases, where the UI disables reapproval. Their strict `context?.approval === null` assertion sees `undefined` because conservative recovery retires the whole context; each logged observation has `canPublish:false`. They are not the source-supported four controls and are not represented as UI acceptance or an all-green original harness. No production behavior is distorted to satisfy that representation-specific assertion.

From repository root, with the explicit Node22 PATH above:

```sh
node --experimental-strip-types --test --test-timeout=10000 --test-concurrency=1 \
  --test-name-pattern='^reachable uncertain' \
  .local-artifacts/portal-rebuild/w7-coupled-source/adversarial.mjs
node .local-artifacts/portal-rebuild/w7-coupled-source/ssr-build.mjs
node .local-artifacts/portal-rebuild/w7-coupled-source/ssr-built.mjs
node --experimental-strip-types --test --test-concurrency=1 \
  apps/portal/tests/rebuild-advisor-approval-authority.test.mjs
node .local-artifacts/portal-rebuild/w2-approval-recovery/historical-build.mjs
node --test --test-concurrency=1 \
  .local-artifacts/portal-rebuild/w2-approval-recovery/historical-tests.mjs
node --experimental-strip-types --test --test-concurrency=1 \
  --test-name-pattern='cross-owner notice' \
  .local-artifacts/portal-rebuild/w2-approval-recovery/notice-probe.mjs
```

From `apps/portal`, serially:

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
node --experimental-strip-types --test --test-concurrency=1 --test-timeout=15000 \
  tests/rebuild/advisor-recovery-browser.mjs
SHELV_RECOVERY_BASE=97aa801f58471f8e657d00de1775da7f20f6ee29 \
  node --experimental-strip-types --test --test-concurrency=1 --test-timeout=15000 \
  --test-name-pattern='UI C1 status approval receipt-first|UI notice recovery and exact manual intent at 1440' \
  tests/rebuild/advisor-recovery-browser.mjs
node --experimental-strip-types --test --test-concurrency=1 --test-timeout=30000 \
  tests/rebuild-advisor-payment-context.test.mjs tests/rebuild-app-browser.test.mjs
npm run typecheck:rebuild
npm run typecheck:session
npm run check:ui
npm run build:application
```

The cohesive matrix includes operation/manual/draft replacement, actual cookie owner/CSRF/logout, supplied actor/current-view changes, policy-shaped null authority, source403, publish restriction, wrong-target/malformed approval, gate/payment read403/409/503, remount/restored uncertainty, exact serialized retry bytes, current lawful refresh recovery and current failures. Only finite captured HTTP DTOs/delivery are controlled; no successful application port, mapper, session `current()` or feature implementation is stubbed.

Initial41-case logs preserve harness mistakes separately: a503 suspended the real shared session before its companion read finished, or a second refresh ran without normal restore, so four cases did not reach the intended successful context. The corrected69 matrix lets the companion settle and uses public `runtime.restore()` with the same lease before retrying. A validation503 notice assertion likewise required a real successful restore first. These are not product failures. The normal root typeless-package warning and input-only historical build's missing Expo-base warning remain; no flags/configuration are relaxed.

## browser resource release, inspected visuals and remaining limits

No browser/DOM work occurred before the explicit parent grant after W6's H1/H2 release at04:10:03UTC. `preview_status` was first and had no tab. The first blank-preview URL was rejected; corrected finite `.invalid` preview reached `chrome-error://chromewebdata/` and was closed. The expressly authorized installed-Chrome repository harness then ran serially. Each context blocks service workers and unexpected traffic; only finite `.invalid` APIs and bundled local assets are served. Console warnings/errors/page errors/unexpected traffic are checked; only exact injected403 console errors are accepted. No HTTP server or actual Auth/DB/native helper is started.

All contexts/browsers/processes are closed. `release.json` records explicit release **2026-10-31T04:15:07.750085+00:00**, `automationChromeProcesses:[]`, no preview tab and terminal owned handles. The parent was notified immediately before report writing. No browser call follows release. Direct local-file viewing afterward confirms the actual full application shell, disabled publication after current null approval, and a usable current payment form without the old denial. The helper uses the actual `ApplicationShell` and canonical navigator, avoiding the old omitted-sidebar scaffold. These are bounded state/keyboard/rendering observations, not whole-screen pixel matching or representative-human acceptance.

Not run/accepted: unrelated full portal/root/Expo/native suites, migrations/reset/pgTAP/RLS, genuine gateway/Vault/Auth/Edge/PostgREST or real revocation/payment/publication/notification effects, hosted behavior, exact-head CI, clinical/legal/human comprehension or exhaustive accessibility. The parent's genuine main13 and W6 readonly/privacy/cleanup evidence remain separately attributed and were not rerun or adopted. H1/H2 are W6-owned. No parent fixture/credential, Docker/PG/Auth lifecycle, push/PR/merge/deployment, real client/source/permission action, external message, money or order is used. Coordinator owns canonical status/CONTEXT_SYNC, D39 metadata composition and a fresh independent review of the exact integrated head.
