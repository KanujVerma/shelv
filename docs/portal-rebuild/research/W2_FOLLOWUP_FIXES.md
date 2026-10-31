# W2 advisor R3 bounded follow-up

31 October 2026 UTC. Implementation response to [W7 advisor round 3](W7_ADVISOR_R3.md), preserving [the original review](W7_ADVISOR_REVIEW.md), [first fixes](W2_FIXES.md) and [original delivery](W2_VERTICAL_ADVISOR.md). **Controller correction verified; full-text browser red/green and final delivery pending the parent's explicit browser grant. Fresh independent review remains required.** This is not full portal, connected or release acceptance.

## identity and ownership

- Workspace `/Users/kanuj/.t3/worktrees/shelv/t3-307f6cc3`, branch `t3/advisor-followup-r3-fixes`, clean starting base `284c04e94060543106e3a686d4aa7cd61c7bebfb`. The integrated R3 report is `58b77b0`.
- Both fresh `orchestrator_capabilities({search:'gpt-6.1-sol'})` and `t3_thread_configuration({})` returned provider `codex`, model `gpt-6.1-sol`, `reasoningEffort=xhigh`, `serviceTier=default`, full-access/default modes. Thread readback confirms the workspace/branch and parent `d632030a-18f7-4dec-a2c9-f5c0418c3fd5`. No fallback or nested agent.
- Task `portal-rebuild-w2-followup-fixes-20261030-r1`. All Node/npm commands explicitly prepend `/Users/kanuj/.nvm/versions/node/v22.23.0/bin` to PATH. Existing-lockfile `npm ci --ignore-scripts --no-audit --no-fund` installed 130 packages. Ephemeral pinned `prettier@3.6.2` formats only owned files; no package/config changes.
- Local `origin/main=d39a7d4943209080df7c4cf97d85784f462758bf`, initial `HEAD...origin/main=72 0`. No new fetch/remote freshness claim. No other worktree changes.
- Read full original/R3 reviews, fix and original-delivery reports, the complete retained source-phase R2 draft at `/Users/kanuj/.t3/worktrees/shelv/t3-695ed988/docs/portal-rebuild/research/W7_ADVISOR_R2.md`, root/portal AGENTS, approved decisions/desktop spec, contracts and ownership/status. Applied Resume, receiving review, systematic debugging, TDD, repository UX/design, React and verification guidance. No new product/design/permission rule.

Only advisor feature paths, corresponding advisor tests and this report are owned. Shared app/main/UI/navigation/session/callback/contracts, SQL, packages, status and `CONTEXT_SYNC.md` remain parent/W0-owned. Existing named exports, callback signatures and preview opener IDs are preserved. No DB/Docker/Auth/credentials/hosted/parent fixture access.

## R3-1 response

Verified root cause: validation, preview, comparison, directory and client-directory catches could call generic `fail` against a newer state. Success paths also lacked consistent purpose/view/manual/operation applicability. F1/F2's existing context/execution/recovery generations remain intact.

An internal read lease captures session epoch, purpose generation, exact view/target, local-content object, pending-command object, operation generation and supplied capabilities. All related success/error paths check applicability; obsolete results are rejected before strict response decoding. Current directory/client read failures preserve a write's busy state. Draft open owns only its own busy cleanup. Existing 401 invalidation and real 409 comparison behavior remain for applicable failures. Context/status retain their existing generations and add the common applicability fence. No public export or command shape changed.

| Priority / advisor goal | Before | Correction / regression |
| --- | --- | --- |
| P2: continue saving B/C after a delayed read | Old 503 released B busy/replaced notice; old 409 after B acknowledgement blocked C | Five read families tested with success/malformed/401/403/409/503 before/after B acknowledgement, exact lost-ack retries, both purpose completion orders and draft/manual/role/session/review changes |
| P2: trust current failures | Ignoring every error would hide real session/conflict failures | Current 401 clears private state; 403/409/503 remain visible; current directory/client failures during B preserve its entire command and busy state |

All tested write attempts retain full serialized command bytes and manual content. Only a valid acknowledgement clears pending and marks saved. The original F2 harness's final expectation of pending B after a valid awaited B retry remains wrong; this implementation does not satisfy it.

## source/pure red before green

Evidence directory: `/Users/kanuj/.t3/worktrees/shelv/t3-307f6cc3/.local-artifacts/portal-rebuild/w2-followup/`. Mandatory R3 scripts were read/copied byte for byte before adaptation; original worktrees are read-only.

| Command / scope | Result |
| --- | --- |
| Root `node --experimental-strip-types --test --test-concurrency=1 .local-artifacts/portal-rebuild/w2-followup/independent.mjs`, before production changes | **62 pass / 5 fail / 0 skip**, exactly the four old503 plus old validation409 intended failures |
| Root same serial command on `apps/portal/tests/rebuild-advisor-followup.test.mjs`, before production changes | **57 pass / 107 fail / 0 skip / 0 cancelled**, 164 original matrix cases; actual state assertions fail for obsolete reads |
| Exact base controller bundled with esbuild from `git show 284c04e:apps/portal/src/features/advisor/controller.ts`; full final170-case matrix imports only that ignored bundle | **57 pass / 113 fail / 0 skip / 0 cancelled**. Confirms six supplementary current-failure/busy cases against base, without rewriting current production files |
| Root serial command on retained controller/races plus new follow-up pure file | **217 pass / 0 fail / 0 skip**, 47 retained plus170 new cases |
| Root copied R3 `independent.mjs` after correction | **67 pass / 0 fail / 0 skip**; original F1/F2 and all five R3 read assertions |
| Portal `npm run typecheck:rebuild` | Exit0, original strict/noUncheckedIndexedAccess flags |
| Portal `npm run build:rebuild` | Exit0, semantic guard and isolated foundation build. Actual advisor is separately bundled by the prepared browser harness; this build does not accept final app composition |

Node emits the existing root typeless-package warning. An initial new open/create test was cancelled because create is correctly refused while open is busy; replaced that unreachable sequence with real overlapping draft opens before accepting the zero-cancellation red result. No passing result is claimed for that setup attempt.

## R3-2 work and browser allocation

Read-presentation production source is still unchanged at this checkpoint. The prepared durable browser test imports actual advisor components and fixture reducer, serves finite local assets on `.invalid`, blocks service workers/unexpected traffic and closes contexts. It is syntax-checked, not executed. It retains the actual source-derived511-character reason and823-character directions, and adds explicitly synthetic long product/routine/source text. Intended assertions require keyboard focus and last-line scrolling plus actual typing/controller mutation denial, exact content and proper source metadata at1440/390/320 in view-only/published modes. No source permission is granted.

Parent was notified that the harness is ready. No browser/DOM/Chrome launch, inspection or preview access occurs until the explicit grant after W7 client R4 releases. Browser red precedes any R3-2 production change. The existing60-case suite, full-text regressions, typed UI/build gates, final source inspection and a clean owned commit will be recorded before final delivery.

## limits

Not run/accepted at this checkpoint: advisor browser tests, connected cookie/Auth/Edge/PostgREST journey, DB reset/pgTAP/RLS, full portal/session/root suites, Expo web/native, actual app/callback composition, raw-source ACL/lifecycle, notification delivery, hosted deployment, exact-head CI, exhaustive accessibility or human comprehension. No push/PR/merge/deployment, real client/source/permission change, communication, money or order action.
