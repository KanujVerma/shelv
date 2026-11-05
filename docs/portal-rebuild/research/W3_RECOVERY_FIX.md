# W3 current-review recovery microfix

30 October 2026. Bounded implementation response to R3-1. Fresh independent review remains required.

## Scope and preserved review basis

Workspace `/Users/kanuj/.t3/worktrees/shelv/t3-17d48f14`, branch `t3/fix-review-retry-obstruction`. Exact clean starting base: `9b2bbaa7e26d58be4a652976927bb7ca1b6a97b4`. Fresh fetch resolves `origin/main` to `d39a7d4943209080df7c4cf97d85784f462758bf`. No reset/rebase or writes to another checkout.

Live capabilities and thread configuration both verify `codex / gpt-6.1-sol / reasoningEffort=xhigh / serviceTier=default`, full-access/default interaction. No nested agents. Resume, receiving-code-review, systematic-debugging, TDD, verification-before-completion and repository task-first UX review govern this response.

The complete [original review](W7_CLIENT_REVIEW.md), [first response](W3_FIXES.md), [R2](W7_CLIENT_R2.md), [conflict/preview response](W3_CONFLICT_PREVIEW.md) and [R3](W7_CLIENT_R3.md) were read and remain unchanged. R3 closes original F1-F8/Q1/Q2 and the explicit unpublished adapter within its bounded UI scope. The R2 false-unlock failures remain closed, not replaced by recovery-only assertions. This response addresses only the new P2 R3-1 obstruction. None of those local findings is full portal/backend/release acceptance.

The original implementation/review/correction lineage and full per-finding responses are preserved in those reports. Relevant decisions are D10/D16, with D38 access fences and the implementation-contract exact retry, session-memory, late-response and deliberate review rules. No public API, routing, styles/UI, composition, root contracts, SQL, fixtures, package, status or context changes are allocated. Coordinator owns canonical integration/status/context.

## Root cause and independent evidence

`PendingReview` resets visible loading when the enclosing view changes, while a context-blind boolean retains busy ownership until the obsolete read settles. A current enabled retry returns without issuing a read. Unconditional old cleanup also cannot safely release a newer operation if superseded requests are retired. The existing view/session/epoch/mode and fetched-basis fences correctly deny obsolete results; accepting an obsolete response would reopen earlier findings.

Read both original independent scripts at `/Users/kanuj/.t3/worktrees/shelv/t3-e0bfefc2/.local-artifacts/portal-rebuild/w7-client-r3/`. Recomputed hashes match R3:

- `residuals.test.mjs`: `6917926c5a6c910d2c1940be55da5fa0cb06739e21b4d7752f62558149f7d191`.
- `busy-followthrough.test.mjs`: `c1e77fc8f536083a77e100d9431aa6862db33cfa9a4bed3eb392b2b547d1ac92`.

Their intended failure and diagnostic observation are diagnosis, not green acceptance. The new checked-in regression uses the unchanged existing synthetic entry helper and actual feature events. It controls only DTO/operation/session/navigation inputs; no feature source substitution.

## Task-first recovery review

| Priority | Persona and goal | Exact issue | Consequence | Bounded correction and regression | Evidence |
| --- | --- | --- | --- | --- | --- |
| P2 R3-1 | client recovering a rejected choice | enabled retry silently returns behind an obsolete pending read | no progress while old request is stuck | retire obsolete operation ownership, start current read, ignore old completion/cleanup; require actual fetch plus deliberate reread/review | source and independent repro; fresh red/green below |

The existing task remains rejected choice -> latest-plan retry -> fetched reviewable content -> deliberate review/reread -> fresh deliberate choice. Failed/pending reads keep the gate. No copy, visual system, business rule or source content changes. This is an automated/source walkthrough, not human comprehension evidence.

## Implementation and verification

Implementation commit: **`0fe2fa7fc2485678f2ac01e1410364be4960536c`**. The final report-only commit is returned as the handoff head. No feature/test bytes changed after the final focused run.

Only `PendingReview` in `DecisionControls.tsx` changed. Busy ownership is now a unique operation token. Enclosing view, mode or captured-session replacement advances the existing context epoch and retires the obsolete owner immediately. Current retry can issue a read while the old promise remains pending. Result/error application requires both the original current-context/session check and exact token ownership. `finally` releases loading/busy only when it still owns that token. No transport cancellation signal or public API was added: retirement is local, and the obsolete promise may settle later without effect.

Existing `fetchedBasis`, `isReviewable`, `sameFetchedRevision`, scope token/epoch, session/mode gates, exact uncertain command handling and manual intent ledger are unchanged. Recovery fetch supplies reviewable content; deliberate review performs another current read. Only the same fetched publication/revision can close the gate. No rejected command is replayed, and another deliberate choice creates a fresh UUID at the current publication/revision. `reviewBasis.tsx`, all production imports and the existing test helper are unchanged. Unpublished preview/callback/ledger isolation remains covered by the unchanged original cases.

Source/pure/type/harness work finished before Chrome. Parent then explicitly granted sole serial Chrome after W0 closed all handles. First `preview_status` returned `available:false,tabId:null`. The expressly authorized repository esbuild/Playwright-core installed-Chrome workflow ran actual source under React StrictMode, concurrency 1, one browser at a time. Service workers/background networking were blocked. Only synthetic `.invalid` GET routes and exact public-sample asset URLs were fulfilled from local bytes; every other request was aborted and asserted absent. Page/console-error and unexpected-network arrays were asserted empty at teardown, including RED failures.

Before any production edit, the new nine-group browser file ran **4 pass / 5 fail / 0 skip** in 6.512s. Every failure was the intended current-retry assertion: reads stayed **2**, expected **3**. No setup/selector/network failure was substituted for RED. The unchanged new file then passed **9/9** after the bounded fix. The combined original49 plus new9 passed **58/58**, zero failures/skips.

| New regression | Observed intended behavior |
| --- | --- |
| Active context replacement; old read never resolves | Current retry starts read3; pending fetch and pending deliberate reread retain the gate. Successful fetch plus deliberate reread permits a fresh deliberate decline only. |
| Read-only then exact original active object; old read never resolves | Spent epoch stays invalid; current retry/review works before the obsolete promise settles. Fresh command is version2/revision4 with a new request ID. |
| Old finally before/during/after current read | Old result applies zero times and leaves client-memory bytes unchanged. Cleanup during the newer pending read cannot release its lock or prevent its authoritative result. |
| New current read fails, then retries | Failure retains acknowledgement denial; the next retry fetches and deliberate review completes despite the still-pending old read. |
| Mode roundtrip | Obsolete result and ledger mutation denied; lawful current recovery remains possible. |
| Session invalidation and helper session reset/remount | Logout clears/removes private state; obsolete result cannot restore it. Reset clears old intent and permits fresh context while late old application stays denied. This is synthetic boundary evidence, not actual Auth. |

Writes remain one throughout recovery and review, until an explicitly clicked fresh choice. The unchanged old regressions separately require byte-for-byte exact uncertain retry across navigation/publication changes, failed/pending/unmounted read denial, changed revision/new publication review, prior actual Start versus advice, source fidelity, purchase semantics, genuine opener restoration and preview isolation.

Browser work is terminal. Every context/browser was closed by `finally`/`after`; process readback found `ChromePids=[]` and no owned Node test processes. Final `preview_status` again returned no tab. Chrome was explicitly released to the parent immediately after the58-case run, before report/build work. No further browser/DOM activity followed.

## Exact verification receipt

All Node/npm commands used `PATH=/Users/kanuj/.nvm/versions/node/v22.23.0/bin:$PATH`; fresh Node readback is `v22.23.0`. Normal strict compiler flags, package/lock/configuration and color budgets are unchanged. Commands are from repo root unless portal cwd is specified. Artifact root below is this checkout's ignored `.local-artifacts/portal-rebuild/w3-recovery/`.

| Exact command/check | Result and limit |
| --- | --- |
| Portal `npm ci --ignore-scripts` | Exit0,130 packages; unchanged lockfile. Existing2 moderate/1 high audit summary, no dependency upgrade or audit assessment. |
| `node --experimental-strip-types --test --test-concurrency=1 apps/portal/tests/rebuild-plan-recovery.test.mjs` before edit | **4 pass/5 fail**,0 skips; `red.log`. Intended R3-1 reads2 versus3 in all five failures. |
| Same command after edit | **9/9 pass**,0 skips,7.152s; `green.log`. |
| `node --experimental-strip-types --test --test-concurrency=1 apps/portal/tests/rebuild-plan*.test.mjs` | **58/58 pass**,0 skips,38.144s; `focused.log`. Includes all original49, not additive re-counting of earlier runs. |
| Portal `npm run typecheck:rebuild` | Exit0, unchanged strict/noUncheckedIndexedAccess configuration; `frontend-types.log`. |
| Portal `npm run typecheck:session` | Exit0; `session-types.log`. Session source unchanged. |
| `apps/portal/node_modules/.bin/tsc -p .local-artifacts/portal-rebuild/w3-recovery/tsconfig.preview-tests.json` | Exit0, existing forbidden-field assertions active. Temporary config extends unchanged frontend config and includes existing portal type roots/CSS declaration; `preview-types-final.log`. |
| Portal `npm run check:ui` | Exit0,11 retained stylesheets; `ui.log`. No CSS change or visual acceptance claim. |
| Portal `npm run build:rebuild` | Exit0, isolated foundation preview; `rebuild-build.log`. Actual feature is separately bundled/exercised by Chrome. |
| Portal `npm run build` | Exit0,136 assets/3 retained gateway route families; `package-build.log`. Existing absent `expo/tsconfig.base` warnings. ZIP `04b03a3711f858d48cce10d6a89ce1219f10b3fdfd3d5f4565678b9ba86d8a2f`; vault `a4cad1c429cee06b257b66c4b42e902467928b3669d5ccdccf8483f4f8b3c9ed`. Packaging does not certify connected application composition. |
| Root `npm test` | Exit1, blocked at missing `zustand` in `authStore.ts`; `root-tests.log`. No root success claim. |
| Root `npm_config_offline=true npx --no-install tsc --noEmit` | Exit1, root compiler unavailable/cached unrelated `tsc` warns. Direct pinned portal compiler against the unchanged root config also exits2 for missing React/Expo/native dependencies; `root-types.log`, `root-types-pinned.log`. |
| Root `npm run typecheck:tests` | Exit127, root `tsc` absent. Direct pinned compiler with unchanged `tsconfig.tests.json` exits2 for missing node/react-native types and Expo base; `root-test-types*.log`. |
| Root `EXPO_NO_TELEMETRY=1 npm_config_offline=true npx --no-install expo export -p web` | Exit1, Expo absent; no package downloaded; `root-web-export.log`. Root dependency installation is outside this bounded scope. |
| Live runtime before/after browser work | Both capabilities/configuration verify `codex/gpt-6.1-sol/xhigh/default`; `runtime-before-browser.json`, `runtime-final.json`. |
| Final diff/owned-path/link/artifact/sensitive-pattern inspection; `git diff --check` | Pass before commits. Only assigned source, new test and this report. No helper, package/lock/configuration, shared contract, status/context or temporary artifact changes. |

`checks.jsonl` retains exact cwd, expanded arguments, exit codes and durations. Root/full-stack requirements remain blocked or separately unrun, not converted into scoped UI passes. Existing Node module-type warnings are retained.

| Artifact under `w3-recovery/` | SHA-256 |
| --- | --- |
| `red.log` | `5bf25e80e04c2e8bc0103de3d8161edc6bc9aa2926f1f1f15f421b2abc951c7e` |
| `green.log` | `f9304d0ae83b596a3f1511eb264c3f90db5e847e1f2c83e5d4cb988370152090` |
| `focused.log` | `3f1d725d2b5a3be27cdc70eca6fc2ab67a87cd120e358d0140699fe2b4abec67` |
| `runtime-before-browser.json` | `4fa025c93bd116bb40f4dccd9e7fd2f941fc227f4c948d2886a7f75aefcddf3f` |
| `runtime-final.json` | `4fa025c93bd116bb40f4dccd9e7fd2f941fc227f4c948d2886a7f75aefcddf3f` |

Existing original49 tests produced their ordinary local screenshots, but this behavioral microfix changes no presentation/source content and makes no fresh pixel-match/native-acquisition claim. No screenshot is used as an application asset.

## Limits and handoff

No connected Auth/PostgREST/persistence/permissions, PG/Docker/backend fixture, credentials, hosted resources, real clients/messages/money/orders, push/PR/merge/deploy or full portal/release acceptance. Unpublished adapter and client ledger memory semantics remain unchanged. Original49 focused cases plus new recovery regressions, strict frontend/session types, forbidden preview-field assertions and UI/build checks are the bounded lane. Root/full-stack/native/CI and representative-human acceptance remain separately owned requirements. The exact implementation commit and local artifact receipts are above; final report-only head is returned in the handoff. Full portal/session runtime suites, native/iOS, genuine Auth/Edge/PostgREST, backend/reset/pgTAP, CI and human/complete accessibility/zoom/reduced-motion acceptance were not run by this worker. Parent backend/Auth results are separate evidence and do not establish this UI acceptance.

Next: coordinator integrates the owned implementation/report commits and commissions a **fresh independent Sol/xhigh review** carrying all five full prior reports plus this response. R3-1 has an implementation and passing bounded regression response, not an independent acceptance verdict. Connected portal and release gates remain open.
