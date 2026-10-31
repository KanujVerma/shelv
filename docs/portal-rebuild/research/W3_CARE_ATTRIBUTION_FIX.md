# W3 selected-report correction attribution

Owner: Kanuj. 31 October 2026. Bounded implementation response to **CU3/P2** in [W7 care client R2](W7_CARE_CLIENT_R2.md). **Implemented and locally verified; new independent review required.** CU3 predates baee3033. This response preserves the separately addressed CU1/CU2 mechanisms and makes no full-portal, genuine-care, activation or release claim.

## Source, runtime and ownership

| Item | Verified evidence |
| --- | --- |
| Workspace / branch | `/Users/kanuj/.t3/worktrees/shelv/t3-90e57503` / `t3/care-correction-actor-attribution` |
| Clean starting parent | `7209091e58bbcb9c6f0e22aa2e62d3859699d7d1`, verified by actual Git and T3 worktree binding |
| Task | `portal-rebuild-w3-care-attribution-fix-20261031-r1` |
| Actual child thread | `thread:delegated-task:command%3Amcp%3A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%3Adelegate-task%3Aportal-rebuild-w3-care-attribution-fix-20261031-r1` |
| Live runtime | Both `orchestrator_capabilities` and `t3_thread_configuration`: `codex / gpt-6.1-sol / reasoningEffort=xhigh / serviceTier=default`, full-access/default interaction |
| Descriptors and configuration | Advertised reasoning low/medium/high/xhigh/max/ultra, default low; service default/priority, default default. Effective xhigh/default selected. Global selection, project defaults and all eight role TOMLs verified; nine project configuration hashes retained |
| Node | Explicit `/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node`, actual `v22.23.0`; every Node/npm command selects this PATH |
| Git freshness | Actual status/log/AGENTS and successful `git fetch origin --prune`; `origin/main=d39a7d4943209080df7c4cf97d85784f462758bf`, starting divergence150/0. No reset/rebase/import or other-worktree write |
| Owned tracked files | Only `UseFacts.tsx`, new `rebuild-use-attribution.test.mjs`, new `rebuild/care-attribution-fixture.mjs`, and this report |

No nested delegation. Coordinator retains canonical status, acceptance, TASKS, actors/grants and CONTEXT_SYNC. No Root DTO/action/SQL/backend/session/ports/controller/shared UI/routes/dependencies/source assets/resource configuration is changed.

Portal packages were absent in this child. **No install or upgrade was run.** The retained review checkout's exact portal lockfile matches SHA-256 `bc914f3a9c9f24e44f02e3cff2804651147385ea5abda58a064531329ef23203`. Own local package links reuse those read-only installed packages. An initial own directory symlink was replaced by an ignored real directory containing package links before clean-candidate verification. The original checkout remains clean and all copied evidence hashes were reverified. Root dependencies remain absent; they were not installed.

Read the complete W7_CARE_CLIENT_R2 and W3_CARE_USE, including its original implementation, CU1/CU2 responses and694 receipt; original care R1, CARE_API_V1, implementation contracts, D01-D48/desktop and full approved input in bounded ranges, ownership/status/acceptance/UI policy, and relevant original F1-F8/Q1/Q2/F5/R3/R4 findings/responses. All five imported byte counts/hashes match INPUT_PROVENANCE. Current task/Git, rather than older fixture-custody prose, govern this allocation. Debugging, TDD, verification and the repository task-first UX review informed the fix.

## Reproduction and smallest correction

The complete original reproduction is at the R2 checkout's **`.local-artifacts/portal-rebuild/w7-care-client-r2/attribution.test.mjs`**, not an `E/` subdirectory. Copied scripts, JSON, PNGs and logs are preserved under this checkout's ignored **`.local-artifacts/portal-rebuild/w3-care-attribution/`**, called `E` below. The original attribution test is byte-identical. Only the ignored browser helper's absolute checkout/output paths were repointed; no intended assertion, HTTP behavior or Root mapping was replaced.

Before production edits, the unchanged reproduction failed **0/2**, both intended actor-content assertions after successful loading. The original pause was reported by actual synthetic client `11111111-1111-4111-8111-111111111111`, recorded by advisor `33333333-3333-4333-8333-000000000911` on a call. Changing only `amendedBy` between those actors retained valid strictly mapped DTOs but produced identical full report text. Source rendered original attribution, correction time/reason/body, and never read `amendedBy`.

Both compact and loaded correction metadata now render their **own** `amendedBy`, separately from the immutable original reporter/recorder/channel/date/body. Labels are relational:

- same actual ID as `reportedBy`: **correction by client**;
- eligible human actor equal to the original advisor recorder, or an advisor correcting a directly recorded client report: **correction by advisor**;
- different eligible human actor from an already distinct advisor recorder: **correction by another advisor**.

The finite care contract establishes that `reportedBy` is the actual client and an amendment actor is that client or an eligible human advisor. ID equality establishes the relationship; no UUID yields a person's name. No prior preparer, publisher, policy name or opaque `PlanSessionBoundary.key` is consulted. A defensive missing-actor-context fallback says **correction actor unavailable**. Null/malformed actors still fail unchanged Root decoding before rendering; no public field or permissive mapping is added. Actual IDs remain intact internally and are not dumped into customer copy.

Summary attribution uses the summary's own actor context. Loaded attribution uses the full original and full amendment, rather than relabeling every correction with the original recorder. Original report, current reason, complete shared `ChangeBody`, known/unknown frequency/amount, original versus corrected occurrence and both recording times remain separate. The fix changes presentation only, with no read-triggered action/event/write.

| Client task | Existing flow | Correction and evidence |
| --- | --- | --- |
| Understand the current correction | exact product details, compact current-use summary | actor appears alongside correction time before requesting detail |
| Inspect the preserved source | view original report | original attribution/body remains; current correction identifies its own actor beside its own time/reason/body |
| Read without care-write authority | read-only client or restricted presentation mode | permitted history reading stays read-only; preview/demo/historical modes retain summary without live detail requests |

This is a bounded provenance correction using the existing text hierarchy, wrappers and tokens. No new panel, control, navigation or visual system. Actual desktop and320/390 screenshots were inspected; targeted no-page-overflow checks pass. No native-browser-zoom, full accessibility, representative-human or whole-screen visual acceptance is claimed.

## Durable tests and preserved mechanisms

The new18 cases use the **unchanged actual** ApplicationSession/cookie transport, `createClientCarePort`, Root positive mapper, `createClientPlanController.accept`, `sameCareValue` and supplied-object/epoch fences. Only finite HTTP responses and synthetic UI/session controls are supplied. No successful port/current()/Root mapper/controller replacement or production testing hook.

Coverage includes actual client/original advisor/another advisor IDs in summary and full detail; original actors/channel/occurred/recorded dates/body; correction reason/details/known frequency/unknown amount/time; product-changing correction with original exact history filter; self-recorded original; read-only access; reported-descriptor initialUse correction; missing care capability; advisor-preview/public-demo/private-walkthrough/historical isolation; actual controller replacement and retired detail state; late history completion across mode changes;320/390 reflow; and unchanged Root rejection of null/malformed actors. Reading emits only the finite care reads, with no mutation or other channel action.

All eight files covering the **original58** regressions/helpers remain byte-identical to284c04e. `UseReport.tsx` and `useModel.ts` are byte-identical to the starting parent. Parent `client-state.ts` is byte-identical to c8de1bd2. No original assertion was renamed or weakened.

CU1 controls retain fresh unsupported-note omission/refusal; switched drafts and explicit removal; supported full-note persistence; legacy/uncertain captured notes with explicit **notes not recorded**; exact pending bytes/UUIDs; one proper creation/use event without masking extra events; and session/mode recovery. CU2 retains the same full original/correction `ChangeBody`, all known/unknown usage fields and product separation. Those production mechanisms are untouched and their original durable cases pass in the173 run.

## Executed verification

Commands run from repository root unless marked portal cwd. All Node/npm commands use `PATH=/Users/kanuj/.nvm/versions/node/v22.23.0/bin:$PATH`. `E/browser-checks.json` records exact expanded argv, cwd, exit and duration. Counts overlap and must not be added into broader acceptance.

| Command / scope | Result |
| --- | --- |
| `node --experimental-strip-types --test --test-concurrency=1 E/attribution.test.mjs`, before production | **0/2 intended RED**, no setup failure; `original-red.log` |
| New durable file before production, corrected harness selectors | **2/13**,11 intended actor-content failures; `durable-red-2.log` |
| Unchanged original attribution test plus first13 durable controls after fix | **15/15**,0 failures/skips; `green-1.log` |
| Final new durable file | **18/18**,0 failures/skips,9.602s; `durable-green-2.log` |
| `W3_FROZEN_ATTRIBUTION=1 node --experimental-strip-types --test --test-concurrency=1 E/sensitivity.test.mjs` | **2/18**,16 intended actor-content failures, two Root rejection controls pass; `input-only-sensitivity.log`. Only exact starting7209091e `UseFacts.tsx` is substituted through an ignored esbuild input plugin; all current app/session/controller/Root inputs and intended assertions remain |
| `node --experimental-strip-types --test --test-concurrency=1 apps/portal/tests/rebuild-plan*.test.mjs apps/portal/tests/rebuild-use*.test.mjs apps/portal/tests/rebuild-care-plan-model.test.mjs apps/portal/tests/rebuild-care-ports.test.mjs E/original-amendment.test.mjs E/attribution.test.mjs` | **173/173**,0 failures/skips,95.439s; `focused.log`. Includes original58, original CU2 repro, CU1/CU2 controls, new18 and unchanged CU3 repro2 |
| Same serial Node flags, `apps/portal/tests/rebuild-foundation*.test.mjs apps/portal/tests/rebuild-app-state.test.mjs apps/portal/tests/rebuild-care-navigation.test.mjs` | **47/47**,0 failures/skips,11.727s; `foundation.log` |
| Portal `npm run test:session` | **171/171**,0 failures/skips,38.265s; retained finite/canned-provider/Miniflare/cookie tests, not genuine care Auth |
| Same serial Node flags, `tests/portal-care-contract.test.ts tests/portal-care-handler.test.ts` | **18/18**,0 failures/skips; strict DTO/handler-port checks, no SQL |
| Portal `npm run typecheck:rebuild`; `npm run typecheck:session` | Both exit0, zero diagnostics; unchanged strict flags |
| Portal `npm run build:rebuild`; `npm run check:ui` | Both exit0; semantic-color and retained11-sheet checks, no allowance change |
| `git diff --check`, owned-path/source/original-evidence audit | Pass before commit; exact source and artifact hashes retained |

The first durable RED had2/13 passes and11 failures, including one helper selector that inspected the background plan's button instead of the selected dialog's loading button. The helper now uses the actual dialog control and waits for committed shell mode. Repeating RED **before production edits** gave11 actual missing-actor assertions. No old test or production guard changed. Existing root typeless-package and absent root Expo-base bundle warnings remain recorded; dependency realpaths also discover the retained package checkout's unchanged absent Expo-base configuration.

## Chrome return and remaining gates

First browser tool was `preview_status`, no tab. The user expressly granted the repository installed-Chrome finite-intercept workflow after W7R2 release. All browser files ran serially with `--test-concurrency=1`, StrictMode, blocked service workers/background networking/DNS, finite `.invalid` routes and exact local public-sample image bytes. Unexpected network aborts and fails teardown. No other browser system was used.

**Chrome explicitly RELEASED `2026-10-31T07:59:43.228409+00:00`, before builds/report writing.** Every own context/browser/test handle was terminal and closed normally. Fresh executable inventory: **Chrome[] / workerd[] / Node tests[]**; live preview **available:false, no tab**. `release.json` and `preview-release.json` retain evidence. No broad kill or post-release browser/DOM work.

No whole980 rerun was needed for this tiny presentation change. Frozen6b's980 and older independent results retain their original source/scope. Root application tests/types/test-types/Expo are **not rerun**: child Root dependencies are absent; no install/upgrade/flag relaxation. No native runtime change or iOS check. No Docker/PG/Auth/R6/R7/credentials/native/helper/lifecycle call, canonical reset/pgTAP/genuine API, live client/source/permission/finance/outbox action or notification delivery. R6actual56 remains frozen; W1 owns forward57/CN1 and W6 remains independently source-only. Default Application staysv1.

Fresh **new independent review** against the integrated fix remains required. Parent owns canonical docs/actors/grants and subsequent connected care/browser/canonical acceptance and activation. Full portal, global history/amendment authoring, human/accessibility/clinical/legal/license/business, exact-head CI and release gates remain separately open. No push, PR, deploy, merge or real-client action is authorized or performed.

## Completion receipt

The containing owned implementation commit and subsequent clean-application-build evidence are recorded in the receipt below after the commit exists. The final report-only suffix changes no runtime/test bytes and is returned in the handoff.
