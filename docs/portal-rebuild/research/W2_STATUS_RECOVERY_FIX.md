# W2 request-status recovery correction

31 October 2026 UTC. Bounded implementation response to **AR1/P2** in the independent W7 approval-recovery report at Git object `2a23cd2056897b4dad75ee63b1e52cae8c74fcf0:docs/portal-rebuild/research/W7_APPROVAL_RECOVERY_REVIEW.md`. Author verification passes within the scopes below. **Fresh independent review of the next integrated head remains required.** This is stale client authority and uncertain-command recovery, not a demonstrated SQL authorization bypass or complete portal acceptance.

## identity, source and ownership

- Workspace `/Users/kanuj/.t3/worktrees/shelv/t3-6189bc49`, branch `t3/advisor-status-recovery`. Exact clean starting base **`c32b624cf27e30ad141398e5cea5b939d6ba24db`**, verified with fresh status/log/head before work. Production source ancestor **`c2e5e92c9934eead9b361728d537ccb7b3e4675e`**, author correction `b8bd5b3a73134e02b6d93e2fb32e8591c67bdcba`. Fetch succeeded; `origin/main=d39a7d4943209080df7c4cf97d85784f462758bf`, initial `HEAD...origin/main=106 0`.
- Implementation/tests commit **`2838d7754e51ba73d820753bb8428b9e43b493fd`** was clean before the explicit candidate build. The later report-only commit does not change tested runtime/test bytes.
- Before work and before finalization, both live `orchestrator_capabilities` and `t3_thread_configuration` independently returned **codex / gpt-6.1-sol / reasoningEffort=xhigh / serviceTier=default**, full-access/default interaction. Advertised model descriptors include `xhigh` and `default`; effective values match. Task suffix `portal-rebuild-w2-status-recovery-fix-20261030-r1`. No nested agent, fallback or model-option substitution.
- Every Node/npm command explicitly prepends `/Users/kanuj/.nvm/versions/node/v22.23.0/bin` to PATH; actual Node **v22.23.0**. Existing-lockfile portal `npm ci --offline --ignore-scripts --no-audit --no-fund` installed130 packages, exit0. Cached Prettier3.6.2 formatted only the two new test files. No package, lockfile, config or dependency change.
- Sole production change is in [controller.ts](../../../apps/portal/src/features/advisor/controller.ts), the `reconcile` catch. Other owned paths are new [source regressions](../../../apps/portal/tests/rebuild-advisor-status-recovery.test.mjs), new [scoped browser regressions](../../../apps/portal/tests/rebuild/advisor-status-browser.mjs), and this report. No compatible type change was necessary. Existing tests, workspace/payment UI, fixtures, shared source, application ports/session, retained gateway, root contracts/SQL, packages, canonical status and `CONTEXT_SYNC.md` are unchanged.

Applied Resume, receiving review, systematic debugging, TDD and verification guidance. Used the repeatable Playwright regression guidance under the user's explicit installed-Chrome finite-intercept workflow; no localhost discovery/server or unrelated browser was needed. Read applicable AGENTS, rebuild entry point, D01-D48, full desktop specification, implementation/plan/advisor-read contracts, acceptance and workstream/current status. Read the full coupled review, W2 approval/app/payment corrections, W7 app R2/advisor R4, relevant original F1/F2/F3/R3 objections and responses, and the terminal W7 AR1 report through Git. The fixed design and D16/D22/D25/D38 remain governing requirements. No UI/copy/layout/business-rule redesign is introduced.

The independent checkout `t3-7b2812c5` stayed read-only. Its parent-imported docs-only `1279502` and terminal report were not reset, cherry-picked, or rewritten. The original probe and subsequent controls/SSR dependencies were copied byte for byte into this checkout's ignored evidence directories. Hashes and absolute original/copy paths are in `copy-provenance.json`.

## reproduced cause and bounded response

Reproduced through actual `createApplicationSession`, retained cookie/factory/captured transport, strict root mappers, `createAdvisorPorts`, controller and checked-in reducer. Only finite HTTP DTO delivery/status is controlled:

1. A lawful approval A commits, but an unsupported field in its delivered acknowledgement makes strict mapping reject it. Exact A remains uncertain/pending.
2. A current successful refresh learns committed A and active later-publication coverage. Pending A still blocks publication.
3. Start a newer current context C carrying null approval or inactive coverage; delay only its actual gate DTO delivery.
4. UI-available status lookup sends A's exact UUID and receives HTTP403. Previously `fail(e,true)` treated that read error as a definite outcome of original mutation A, cleared pending, and left permissive old context intact.
5. C then failed its correct pending-object fence. Old approval/active coverage plus null pending enabled publication despite the denied notice. Both actual keyboard cases reproduced this before production edits.

A status lookup is a **read**, not a retry or new mutation result. The catch now calls ordinary read failure handling, `fail(e)`. Its denial/error stays visible; original pending object, UUID, payload and `save:'uncertain'` survive. C's captured pending basis therefore stays valid, so a still-current C can install its restriction. Completed current restrictions also survive. No read fence or authority generation is relaxed, no historical receipt is promoted to current authority, and no context/error is globally cleared.

409 still requires comparison and keeps the uncertain original command. A subsequent gate refresh cannot waive that comparison.503 still preserves original uncertainty; its notice reports the read error. Normal same-lease restore is required before further transport where the actual cookie has suspended. An actual401, owner/CSRF/logout/expiry/role invalidation still ends the private boundary and clears private memory. In the original24 matrix's503 plus held-C sequence, a late success after suspension can cause that actual boundary to end; the independent green there does not imply pending survives a real session invalidation.

A positive committed status acknowledges only the exact command through unchanged strict receipt mapping. A positive absent result leaves original uncertainty intact; it does not mean saved, failed or permission to create a replacement UUID. Exact retry retains captured serialized transport bytes. Tests cover approval plus save/create/apply-import/publish; failed lookup cannot unlock a fresh write or lose local intent. Recovery never auto-publishes, confirms money, or mutates a new UUID.

The preceding `appliedContextGeneration` retirement, WeakMap approval basis, natural assigned-gate capability refresh, and notice-origin matching remain intact. Global permissions equality is not restored. Successful context reads clear only their own matching nonpending errors under the existing origin rule; they retain pending status denial, manual-financial failures, comparison and unrelated errors.

## RED, GREEN and retained evidence

Ignored evidence root: `.local-artifacts/portal-rebuild/w2-status-recovery/`. Counts overlap and are not additive portal acceptance totals. All tests use `--test-concurrency=1`.

| Check / artifact | Actual result and scope |
| --- | --- |
| Exact independent24 before production; `independent-red.log` | **16 pass /8 fail /0 skip /0 cancelled**. Failure-first400/403/404/429 by null approval/inactive coverage reproduce stale eligibility. Original/copy SHA-256 both `b342d6e542cbb9166c60292d859fa2f131e544d926456029cb51c56340e44932`. |
| Focused durable source RED; `durable-red-corrected.log` | **11 pass /16 fail /0 skip /0 cancelled**,27 initial cases. Failures retain intended original-pending/uncertainty assertions. |
| Actual keyboard focused403 RED; `browser-red.log` | **0 pass /2 fail /0 skip /0 cancelled**. Both restrictions reach the intended incorrectly enabled `publish plan` assertion, with normal shell/navigation and real recovery control. |
| Exact final29 against input-only parent controller; `historical-final29.log` | **13 pass /16 fail /0 skip /0 cancelled**. Bundles only `git show c32b624:.../controller.ts` instead of current controller input; no production file is overwritten. |
| Current29 plus unchanged independent24; `pure-green.log` | **53 pass /0 fail /0 skip /0 cancelled**. Independent24 repeated after final formatting:24/24, `independent24-final.log`. |
| Selected prior402 plus new29; `source431-final.log` | **431 pass /0 fail /0 skip /0 cancelled**,3.99s. Includes unchanged217 advisor,34 actual-app integration and73 approval/notice cases, plus app/session/transport/SSR/build controls. |
| New4 plus retained approval11/app11/payment28; `browser-retained54.log` | **54 pass /0 fail /0 skip /0 cancelled**,52.98s. Current exact formatted new file repeated4/4, `browser-exact-final4.log`. |
| Original reachable C1 selection; `original-reachable4.log` | **4 pass /0 fail /0 skip /0 cancelled**. |
| Original successful-recovery and new AR1 actual-component SSR | Build/render exit0 for both. `ssr-original-green.log` and `ssr-status-green.log`: before refresh/retry/status enabled and publish disabled; after approved false and publish disabled. |
| `npm run typecheck:rebuild`, `npm run typecheck:session`, `npm run check:ui` | All exit0; unchanged strict/noUncheckedIndexedAccess flags; UI guard11 retained stylesheets. Type outputs retained as `frontend-types.log`, `session-types.log`. |
| Explicit clean-head `npm run build:application`; `build-clean2838d77.log` | Exit0. Provenance `sourceHead=2838d7754e51ba73d820753bb8428b9e43b493fd`, `sourceDirty:false`, `gatewayIncluded:false`. Provenance SHA-256 `75c20c80c701e17e48083ce5ba99391428013ba0b490ac777ab75ec498c74d1e`. |

Two unchanged independent harness qualifications remain explicit:

- `original-full21.log`: **18 pass /3 fail**. These are the already documented controller-only direct-reapproval diagnostics that demand literal `context?.approval === null`. Whole-context retirement returns undefined, with every logged `canPublish:false`; the UI prevents direct reapproval. No source/expectation is distorted to make that representation test green.
- `independent-controls21.log`: **19 pass /2 fail**. The two403/409 controls explicitly expect pending null after failed lookup. That old expectation conflicts with the coordinator's required status-read invariant; the new durable tests instead require exact pending A/uncertainty and retained denied/conflict meaning. The original script is unmodified. Remaining19 controls preserve notice origin/remount/provenance, positive current authority, absent/malformed/503 and manual/comparison semantics.

Initial harness corrections are preserved, not product failures: the first durable run continued to wait for a lookup after the buggy code had already discarded pending; the corrected helper fails immediately and completes the matrix. The first green source run was24/27: one expectation incorrectly let a fresh gate waive409 comparison, and two compared controller-object property order to normalized transport order. Corrected tests retain comparison and compare first/retry **captured wire bytes** while separately asserting original pending-object bytes. No further production change was made. Final29 adds role/expiry negatives, and the exact final input-only parent sensitivity confirms16 intended regressions remain caught. Existing root typeless-package and missing Expo-base warnings are not changed or promoted into parent failures.

## reproducible commands

From repo root, after selecting explicit Node22 PATH:

```sh
export PATH="/Users/kanuj/.nvm/versions/node/v22.23.0/bin:$PATH"
node --experimental-strip-types --test --test-concurrency=1 \
  apps/portal/tests/rebuild-advisor-status-recovery.test.mjs \
  .local-artifacts/portal-rebuild/w7-approval-recovery/extra-pure.mjs
node .local-artifacts/portal-rebuild/w2-status-recovery/historical-build.mjs
node --test --test-concurrency=1 \
  .local-artifacts/portal-rebuild/w2-status-recovery/historical-final29.mjs
node .local-artifacts/portal-rebuild/w7-coupled-source/ssr-status-build.mjs
node .local-artifacts/portal-rebuild/w7-coupled-source/ssr-status-denied-built.mjs
node .local-artifacts/portal-rebuild/w7-coupled-source/ssr-build.mjs
node .local-artifacts/portal-rebuild/w7-coupled-source/ssr-built.mjs
node --experimental-strip-types --test --test-concurrency=1 \
  --test-name-pattern='^reachable uncertain' \
  .local-artifacts/portal-rebuild/w7-coupled-source/adversarial.mjs
```

Source431 command from `apps/portal`:

```sh
node --experimental-strip-types --test --test-concurrency=1 \
  tests/rebuild-advisor-controller.test.mjs tests/rebuild-advisor-races.test.mjs \
  tests/rebuild-advisor-followup.test.mjs tests/rebuild-advisor-app-integration.test.mjs \
  tests/rebuild-advisor-approval-authority.test.mjs tests/rebuild-advisor-status-recovery.test.mjs \
  tests/rebuild-app-ports.test.mjs tests/rebuild-app-session.test.mjs \
  tests/rebuild-app-state.test.mjs tests/rebuild-app-render.test.mjs \
  tests/rebuild-app-build.test.mjs tests/rebuild-foundation-transport.test.mjs \
  tests/rebuild-foundation-navigation.test.mjs tests/rebuild-foundation-notices.test.mjs \
  tests/rebuild-app-callback.test.mjs tests/rebuild-app-continuation.test.mjs \
  tests/rebuild-app-preview-context.test.mjs tests/rebuild-app-start.test.mjs
```

The executed browser command, also portal cwd, is recorded for future **separately allocated** Chrome custody; this worker will not rerun it after release:

```sh
node --experimental-strip-types --test --test-concurrency=1 --test-timeout=30000 \
  tests/rebuild/advisor-status-browser.mjs tests/rebuild/advisor-recovery-browser.mjs \
  tests/rebuild-app-browser.test.mjs tests/rebuild-advisor-payment-context.test.mjs
npm run typecheck:rebuild
npm run typecheck:session
npm run check:ui
npm run build:application
```

## self-review, browser release and continuation

The new29 cover both403 orders/restrictions,400/404/429, real409 comparison,503 uncertainty, exact status UUID/payload/retry wire bytes, committed/absent/malformed/wrong-receipt semantics, remount and lawful refresh, all four other pending writes, actual owner/CSRF/logout/expiry/401, artificial role/actor/view negative controls, retained manual work, blocked draft switching, old recovery during retry and a later busy/uncertain operation. Tests execute actual application layers; helpers are test-only copies of existing finite harness setup because existing tests/shared modules are outside the write-set. No production testing hook, successful port/session-current stub, global permission comparison or stale-private delivery allowance is added.

Four keyboard cases use the actual `ApplicationShell`, canonical navigator, `AdvisorWorkspace`, controller, cookie session/transport/app ports and strict mappers. They verify disabled publication, enabled status/retry, retained A/uncertainty, actual restrictive C, positive exact receipt and lawful current refresh; no publish command is emitted. New UI recovery after denial uses positive status, while source tests exercise exact retry after denial and retained11 browser cases exercise the unchanged retry controls. This is finite synthetic browser evidence, not genuine Auth/SQL/permission revocation.

First browser call was `preview_status`, no tab. User explicitly granted the repository installed-Chrome finite-intercept workflow. No server, Auth/PG/Docker/native helper or credential is used. Tests block service workers, background networking/DNS and unexpected destinations; only the finite `.invalid` API/document and esbuild output map are served. Teardown asserts zero unexpected traffic/page errors/warnings/errors apart from the exact injected403 browser console messages. All contexts/browser/test processes close.

**Chrome RELEASED `2026-10-31T04:30:47.275103+00:00`**, promptly after final browser execution. `release.json` records no Chrome/Chromium processes and terminal browser tests; live preview status has no tab. Explicit release was sent to the parent. No browser/DOM calls follow release. Subsequent local PNG viewing confirms the actual full shell, visible denial and recovery actions, null-approval/inactive-coverage cards and disabled publication. No full-frame pixel-match, responsive visual or human-comprehension claim follows.

Self-review of the final diff confirms one changed production statement and its explanatory comment, two new owned test files and this report only. All earlier approval/current-authority and origin-bound notice logic is byte-preserved. Existing tests/shared/auth/SQL/contracts/packages and canonical status documents have no diff. Diff whitespace and report links/scope are checked before the report commit. Runtime descriptors/effective settings are refreshed again before final handoff; ignored SHA-256 inventory and source/copy/runtime/candidate/release receipts preserve the evidence.

Not run/accepted: full unrelated portal/session runtime suites, root `npm test`, root application/test types, Expo web/iOS exports, migrations/reset/pgTAP/RLS, genuine gateway/Vault/Auth/Edge/PostgREST/native journey, hosted behavior, real revocation/payment/publication/notification effects, exact-head CI, exhaustive accessibility/visual/human review or release. Root `node_modules` contains only generated `.cache`, not installed root dependencies; no root install was performed. Root/Expo/backend production bytes are unchanged. The parent's prior root/native passes, including latest independently reported main13/readonly4 and returned custody04:24:17, remain separately attributed and are not rerun or claimed here.

No push, PR, merge, deployment, real client/source/permission write, external message, money movement, purchase or native-fixture access. Coordinator owns report integration, canonical status/CONTEXT_SYNC and a **new independent Sol/xhigh review of the integrated fix head**. Full D01-D48/screens/secondary flows and the broader portal goal continue after this bounded correction.

Selected final evidence digests, under the ignored evidence root:

| Artifact | SHA-256 |
| --- | --- |
| `source431-final.log` | `0f09026ef0200f4375437ec1fdc91546c43b9a0d54029e6e3416255962e605f3` |
| `browser-red.log` | `b7f69343640020fdd989c4fa3b329132a5374fd5a64b037c5a080f6f9327a09c` |
| `browser-retained54.log` | `4353db80ec56c57fe84a3d5ff2f04cc2fe367a809ba0a8d8c867e65e528ba3b5` |
| `browser-exact-final4.log` | `db894c87ac46f5cfc6141a0ebbba0e8506c9590cf188665342f83545c81987bb` |
| `independent24-final.log` | `f6926ecb2bd6e939759745049e24d7e3759b1f7d55a4b6f97815d429ffa5b989` |
| `historical-final29.log` | `c627ed3a386abe604d9eb154f42d18df0cd6a383a9d44a31c747d3b2b798b8d9` |
| `release.json` | `a27531bf556dde9a6e37cc58dd12898c05f2361bf2a589a21dc780220e2e7d82` |

`evidence-manifest.json` inventories46 ignored files across this evidence root and the two copied independent probe directories, excluding itself. SHA-256 `d37a0ea7a4636acb98e4fa62743f8c80d331af2eddf08df5c1e92c19269ab655`.
