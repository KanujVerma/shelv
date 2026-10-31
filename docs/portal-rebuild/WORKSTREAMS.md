# portal rebuild workstreams

Owner: Kanuj. Coordinator owns integration and this registry. Updated 30 October 2026.

Read the approved decisions/specification, implementation contracts, acceptance matrix and current status before work. Maximum eight concurrent workers including nested tasks. Start with at most three workers plus coordinator to keep resource use bounded. Only the coordinator schedules heavy database/browser stacks. No nested delegation without an allocated slot and write-set.

## runtime evidence

Coordinator thread: `d632030a-18f7-4dec-a2c9-f5c0418c3fd5`. T3 `orchestrator_capabilities` and `t3_thread_configuration` on the fresh worktree turn both returned provider `codex`, model `gpt-6.1-sol`, options `reasoningEffort=xhigh`, `serviceTier=default`. The initial preconfiguration turn had `high` and performed no implementation or delegation. The fresh worktree runtime explicitly reports `xhigh`.

Installed Codex CLI: `0.164.0`; global selected model/effort are also Sol/xhigh. No global agent role files or built-in-name role overrides were found. New project `.codex/config.toml` and all eight `.codex/agents/*.toml` explicitly pin model and effort. The official config schema supports the exact requested `[agents]` keys; local `codex features list` parses the configuration successfully. T3 delegation is separately controlled, so every call passes exact advertised model/options and checks the returned values. Native tools are not used where options could be lost.

Official references: [configuration schema](https://developers.openai.com/codex/config-schema.json), [config reference](https://developers.openai.com/codex/config-reference), [subagents](https://developers.openai.com/codex/multi-agent). File configuration is evidence of configuration, not a claim that the already-running native tool cap changed.

Integration workspace: `/Users/kanuj/.t3/worktrees/shelv/kanuj-portal-rebuild-integration-20261030`, branch `kanuj/portal-rebuild-integration-20261030`, base `8ac0826f79b4299b0249c5e18003b6ce08593c60` on main `d39a7d4943209080df7c4cf97d85784f462758bf`. T3 owns worktree lifecycle. Keep it while this goal is active; retirement requires preserved commits/evidence and separate removal approval.

## owned paths and dependencies

These are reserved domains, not claims that workers have been started. Before dispatch, record task ID, returned child thread/run, model/options, exact checkout, base and narrower write-set in the task ledger below.

| Worker | Reserved ownership | Dependency and handoff |
| --- | --- | --- |
| W0 foundation | `apps/portal/src/ui/`, shell/router/API adapters, frontend package dependencies/build/tsconfig, design acquisition | Own all shared primitives/dependencies. Coordinate backend transport changes with W1. Return tokens, route builders, renderer inputs, browser evidence. |
| W1 plan platform | `src/contracts/PortalRebuild*`, new draft/publication/source/notification server modules and coordinator-allocated migrations | One writer for root shared contracts and migration order. Reconcile existing SQL/security first; pin exact versioned commands before page workers. Own outbox and authenticated agent API. |
| W2 advisor | `apps/portal/src/features/advisor/` and corresponding tests | After foundation/contracts. Guided editor, diff/review, payment/publication gates and permission UI; shared preview renderer. |
| W3 client plan | `apps/portal/src/features/plan/`, shared plan renderer and Maya composition, corresponding tests | After foundation/contracts. One shared renderer for client/preview/demo. Product-bound evidence/use, correct source content and actual-use alerts. |
| W4 check-ins/history | `apps/portal/src/features/history/`, report/review/amendment modules and corresponding tests | W1 public/private/event contracts first. No schema/route edits outside assigned patch. |
| W5 orders | `apps/portal/src/features/orders/`, bounded commerce extension modules and corresponding tests | W1/W6 coordinate financial/service truth. Freeze quotes, no fake self-purchase orders. |
| W6 account/service | `apps/portal/src/features/account/`, bounded account/coverage/retention modules and corresponding tests | Coordinate sources with W1 and commerce with W5. No shared migration or auth composition edits without coordinator allocation. |
| W7 verification | `apps/portal/tests/rebuild/`, `docs/portal-rebuild/evidence/` within assigned scope | Independently review/reproduce integrated work. Does not author production fixes being independently reviewed. Report exact heads and unresolved objections. |

Coordinator reserves `AGENTS.md`, `apps/portal/AGENTS.md`, `docs/portal-rebuild/` except explicit design/research/evidence allocations, founder/UI/context docs, final migration ordering, shared gateway composition and release packaging. Proposed changes to another owner's paths return as a patch/request; do not edit independently. There is one writer for shared contracts, root layout/routes, auth and release composition at a time.

## task ledger

The [machine-readable task ledger](TASKS.json) records exact task/thread/run IDs, model/options, workspace/base and write-set for each dispatch. Initial checkpoint `9be041d` is pushed in [draft PR211](https://github.com/KanujVerma/shelv/pull/211), stacked on PR210. Three workers were then dispatched; all T3 responses returned provider `codex`, model `gpt-6.1-sol`, `reasoningEffort=xhigh`, `serviceTier=default`. Git worktree readback confirmed each separate checkout at `9be041d`.

| Worker | Worktree / branch | Task and write-set | Dispatch state |
| --- | --- | --- | --- |
| W1 backend reconnaissance | `t3-0e852b97` / `t3/w1-backend-recon` | Source/SQL/gateway reconciliation; only `research/W1_BACKEND.md`. Report `f840c34` integrated as `1426f17`. | completed; 37 focused tests passed; no backend implementation |
| W0 foundation | `t3-128ab5a5` / `t3/portal-shared-foundation` | Shared UI/shell/navigation/typed transport, frontend package/config, design acquisition; no page/backend/gateway work. | completed/integrated; R1-R4 fix pass and independent round 2 PASS integrated |
| W7 documentation review | `t3-3717c152` / `t3/w7-portal-docs-review` | Independent review of `8ac0826..9be041d`; only `research/W7_DOCS_REVIEW.md`. Report `4e64ba5` integrated as `6ac360f`. | completed; spec/quality PASS; no blocking/important findings |

`delegate_task` uses `isolation=worktree` and starts from the parent committed head; uncommitted edits are not inherited. Exact settings are `providerInstanceId=codex`, `model=gpt-6.1-sol`, `options={reasoningEffort:xhigh,serviceTier:default}`. Review rounds each get a distinct stable client request ID and a new task ID; never continue a delegated review via ordinary thread send. Revalidate actual task handles before treating a worker as currently live.

W0 completed at `eceecf186415fa9c7e6008605263d3e56e23cb16`, with 26 native baselines and shared foundation; its report records 362 passing portal tests, 18 new foundation cases and explicit limits. Source/evidence must be inspected and independently reviewed before acceptance. The attempted later steer found no running turn; `task_status` confirmed completed, so no duplicate task was started.

W1 implementation through `d6840ac` and seven-defect fixes `371c425` are integrated. Independent round 2 in `t3-9735aa5b` addressed all original findings but failed on two additional after-wait races; report `3c896a9` is integrated as `efd92fa`. W1 wait-fence fixes in `t3-c484cddc` now solely owns the original unreleased54 migration and new `portal-rebuild-wait-fences-native.py`, with exclusive returned STOPPED `/tmp/shelv-w1-plan-pg`. W1 in `t3-97b66568` separately owns authoritative advisor reads, sole forward migration `20261031003846_portal_rebuild_advisor_reads_v1.sql`, read-specific tests and its own `/tmp/shelv-ar-97b66568` fixture. Strict early seam `7ca6d32` is integrated as `36af02e`. No shared file or fixture has concurrent writers.

W0 corrections and independent round 2 PASS are integrated. W2 advisor delivery through `a432b1a` is integrated, independent review pending. W3 original slice and F1-F8/Q1 correction through `d341ed7` are integrated; independent round 2 in `t3-91dd91e7` has sole serial intercepted Chrome allocation. Parent reran32 focused client cases successfully before that allocation. Exact task/thread/run/model/options, bases, ownership and terminal results are in TASKS.json. Coordinator owns gateway/common protocol/auth-route/unpublished-preview/app composition and selected real-Auth fixture lifecycle. Do not duplicate terminal implementations or claim connected acceptance from component tests.

## handoff obligation

Return the exact starting/final commit, workspace, status, changed paths, decisions/contracts, executed commands/results, limitations, failing/skipped checks and evidence artifacts. Commit only explicitly owned work under the user's implementation authorization. Do not deploy, merge protected main, publish real advice, contact clients, change real permissions, move money or place orders. No private client inputs in source, tools, logs or screenshots. Separate configuration, local synthetic tests, real isolated auth/persistence, hosted verification and deployment claims.


## latest composition checkpoint

Carebackend CB1/CB2 fixf69999a2 independently PASS85a2f543; actualR6 canonical56 reset/34pgTAP772 pass. Root1213/18oldskips/0fail/types/Expo pass. W3careUI980/session171 at5f59 has independent CU1/CU2 changes-requiredb8657889; boundedUI-onlyfix/newreview needed. No currentapplicationv2activation or fullgoal/release claim.

Active: W3 t3-6130843a owns CU1/CU2feature/tests/response and SOLE interceptedChrome. W6 t3-a3da9be0 holds EXCLUSIVE R6 genuine-care-node nativecustody, NO Chrome/browser. Parent no DB/Auth/helper/lifecycle mutation during custody. W6source13guards andactual2audiencePKCE/SQLite pass, ownedsyntheticreadiness input corrected; resultpending. No other productionbackend writer. Exactmetadata/grants in TASKS.json.

R6 projected43b296fde5 actual56/5freshhelpers/76sourcefiles each; private status/owner mode600, exactbinding/selection.Env/source hashes. R4core+4helpersSTOPPEDretained/backedup andoriginalsnapshotsunchanged; R5pre-CB56SOURCEONLYretiredzeroresources. Never reset/adopt either. New reviews require new task IDs/fullfindings/responses; allworkersactualSol/xhigh/default; max3children+coordinator and no nested. Full remaining report/guidance/source/template/commerce/account/delivery/demo modules still required.
