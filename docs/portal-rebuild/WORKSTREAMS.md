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

No workers dispatched at initial documentation checkpoint. Each dispatch appends a row with role, task ID, child thread/run, verified provider/model/options, workspace, base/head, exact paths, test result and terminal/active state. `delegate_task` uses `isolation=worktree` and starts from the parent committed head; uncommitted edits are not inherited. Exact settings are `providerInstanceId=codex`, `model=gpt-6.1-sol`, `options={reasoningEffort:xhigh,serviceTier:default}`. Review rounds each get a distinct stable client request ID and a new task ID; never continue a delegated review via ordinary thread send.

## handoff obligation

Return the exact starting/final commit, workspace, status, changed paths, decisions/contracts, executed commands/results, limitations, failing/skipped checks and evidence artifacts. Commit only explicitly owned work under the user's implementation authorization. Do not deploy, merge protected main, publish real advice, contact clients, change real permissions, move money or place orders. No private client inputs in source, tools, logs or screenshots. Separate configuration, local synthetic tests, real isolated auth/persistence, hosted verification and deployment claims.
