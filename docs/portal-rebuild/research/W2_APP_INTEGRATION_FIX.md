# W2 bounded application integration correction

31 October 2026 UTC. Implementation response to **R2-1/P2** in the fresh [W7 application fixes round-two report](W7_APP_FIXES_R2.md). This corrects the owned controller's actual app integration. Fresh independent review remains required; no whole-app, portal, backend, genuine Auth or release acceptance is claimed.

## identity and ownership

- Workspace `/Users/kanuj/.t3/worktrees/shelv/t3-341bf654`, branch `t3/advisor-read-capability-fix`, clean starting base **`de308ebf7bf699710613f7a01034a0f1281d129e`**. This includes the parent's R2 report. Fresh `git fetch origin` succeeded; `origin/main=d39a7d4943209080df7c4cf97d85784f462758bf`, initial `HEAD...origin/main=82 0`.
- First live `orchestrator_capabilities({})` and `t3_thread_configuration({})` both returned **codex / gpt-6.1-sol / reasoningEffort=xhigh / serviceTier=default**, full-access/default interaction. No nested agents or fallback. Task suffix `portal-rebuild-w2-app-integration-fix-20261030-r1`.
- All Node/npm commands explicitly prepend `/Users/kanuj/.nvm/versions/node/v22.23.0/bin` to PATH; actual Node `v22.23.0`. Existing-lockfile portal `npm ci --ignore-scripts --no-audit --no-fund` installed130 packages. Offline cached Prettier3.6.2 formats owned code only. No dependency, package, config or schema change.
- Owned tracked paths are only `apps/portal/src/features/advisor/controller.ts`, new `apps/portal/tests/rebuild-advisor-app-integration.test.mjs`, and this report. No existing test expectation changes were needed. The unchanged application ports/session/callback, cookie factories/transport, shared UI/routes/root contracts/mappers/SQL, other features, status and `CONTEXT_SYNC.md` remain parent/other-owner paths. Existing exports and controller options/method signatures are unchanged.

Applied Resume, receiving-code-review, systematic debugging, TDD, verification and repository `shelv-ux-review` guidance. Read full R2 report, [W2 follow-up response](W2_FOLLOWUP_FIXES.md), [W7 advisor R3](W7_ADVISOR_R3.md), [first W2 fixes](W2_FIXES.md), [original W2 delivery](W2_VERTICAL_ADVISOR.md), [original W7 advisor findings](W7_ADVISOR_REVIEW.md), [W0 composition](W0_APP_COMPOSITION.md), [W0 fixes](W0_APP_FIXES.md), applicable AGENTS, approved decisions/full desktop specification, implementation/advisor-read contracts and current workstream/status records. Inspected actual controller, app ports/session, retained cookie facade/factory, transport, root mapper and existing integration/advisor tests.

## original findings and response preserved

This does not rewrite earlier findings or their evidence. F1/F2's stale-context/exact-recovery objections, F3's read disclosures, R3-1's generic stale read error cleanup and R3-2's complete keyboard text remain governed by their original reports and responses. Existing217 pure and24 browser advisor cases are retained without weakening assertions. In particular, the original F2 expectation that B remain pending *after a successful awaited B acknowledgement* remains incorrect; the valid acknowledgement clears pending. No test is changed to satisfy that assertion.

W0 A1/A2/A3 remain separately closed within R2's original qualifications. A2's ordinary restore/browser reachability remains unproven; no server authorization bypass is claimed. No app permission protocol, successful-port stub, forced `approve:false` gate, double-open workaround, backend gate or old review disposition is changed here.

## R2-1 read contract

Confirmed source chain: controller `beginRead('open')` snapshots the entire permissions JSON; actual `read_draft_v1` port selects the assigned draft, resets bootstrap authority, awaits the real current gate and mutates the **same** supplied permission object. Default human approval changes false to true. The controller rejects its own valid read and leaves `view:null,busy:true,notice:null`. The unchanged95 source/SSR and11 browser suites reproduce this exact regression before code changes.

The internal read lease now separates **operation ownership** from **private result applicability**. Ownership retains captured session/epoch, purpose generation, operation generation, view object/exact target, manual-content object and pending-command object. Result applicability additionally requires the captured actor and current `view` permission. Edit/assign/review/approve/publish/payment flags are mutation capabilities, not login identity. A lawful view-only response may update them. Real cookie/creation-boundary/actor/target/abort fences and strict root response decoding stay active.

An open's final cleanup uses its ownership lease, so a current denied open ends loading without installing its private draft. Old/aborted/superseded opens cannot release a newer open's busy state. Current401 still invalidates private state; real source403, view denial and malformed target never install a view. No permission is granted by the controller.

## reproduced adjacent approval continuation

After the read correction, tested the adjacent write continuation through the same actual cookie/factory/transport/root-mapper/app-port stack. Hold a real reducer-produced approval acknowledgement, then obtain a newer real gate reporting `approval:null`. Releasing the older command acknowledgement restored the approval and `canPublish`. Exact retry and request-status recovery did the same. All three intended-behavior cases failed before the approval correction. This is stale UI authority, **not a demonstrated backend bypass**; final server gates remain authoritative.

An internal WeakMap binds a newly issued approval command to its authority generation. A valid receipt still acknowledges/clears that exact pending operation, but can update current context only when no later authority read superseded its issuance. Exact retries retain that original basis. Restored pending commands have no remembered authority basis and cannot promote an old receipt over a fresh gate. Existing generation invalidation, exact serialized retries and malformed/uncertain handling remain. No state schema, receipt contract or API export changes.

## task-first UX

| Priority | Persona and immediate goal | Before | Smallest correction and regression | Evidence |
| --- | --- | --- | --- | --- |
| P2 R2-1 | Advisor opens assigned private work | Completed requests leave loading/retry with no editor | Current lawful gate transition loads on first open; view denial ends loading; stale cleanup cannot release newer work | Actual unchanged source/browser red, new actual-app integration green |
| P2 adjacent continuation | Advisor trusts current publication authority | Old approval receipt replaces newer null approval | Acknowledge exact command while preserving newer authority; cover direct ack, retry, status and remount recovery | Actual app source red/green; no server bypass claim |

The task stays open assigned draft, choose a free section, read/edit according to current authority, inspect/recover/save and deliberately review/publish only when allowed. No visual, copy, layout, route or interaction vocabulary changes. Shared read-only controls, full text, keyboard/focus/Back behavior and actual default owner gates remain covered by the unchanged browser suites. Automated synthetic checks are not representative-human comprehension or exhaustive accessibility acceptance.

## TDD and executed verification

Evidence root: `.local-artifacts/portal-rebuild/w2-app-integration/` in this checkout. Tests run serially with `--test-concurrency=1`; counts overlap and are not additive acceptance totals.

| Command / artifact | Actual result and scope |
| --- | --- |
| Exact unchanged W7 source95 command before code; `source95-red.log` | **94 pass /1 fail /0 skip**, actual controller+ports A/B null-view assertion |
| Same exact unchanged W7 source95 command after correction; `source95-green.log` | **95 pass /0 fail /0 skip /0 cancelled**,3.03s; source, SSR, isolated builder, captured app/session/transport/callback and unchanged A/B controls |
| Unchanged `tests/rebuild-app-browser.test.mjs` before code; `app11-red.log` | **8 pass /3 fail /0 skip**, initial assigned editor/preview/publication cases3/4/5 |
| New actual app integration matrix before read fix; `integration-red.log` | **7 pass /20 fail /0 skip /0 cancelled**,27 original cases; default first assigned open and capability transitions fail |
| Corrected harness and read fix, before approval continuation fix; `approval-red.log` | **27 pass /3 fail /0 skip**, precisely old direct/retry/status approval restoring newer revoked authority |
| Final `rebuild-advisor-app-integration`, `rebuild-advisor-controller`, `rebuild-advisor-races`, `rebuild-advisor-followup`; `pure-final.log` | **251 pass /0 fail /0 skip /0 cancelled**: unchanged217 plus34 new actual app cases |
| Unchanged app11 after read correction; `app11-first-green.log` | **11 pass /0 fail /0 skip**, default approval true, no gate workaround or second open |
| Existing app11 plus advisor13/follow-up11; `browser-final.log` | **35 pass /0 fail /0 skip**, serial finite synthetic browser checks |
| Same unchanged three browser files against final controller bytes; `browser-exact-source.log` | **35 pass /0 fail /0 skip /0 cancelled**,72.08s, including default app11 and unchanged24 advisor controls |
| `npm run typecheck:rebuild`, `npm run typecheck:session`, `npm run check:ui` | All exit0; original strict/noUncheckedIndexedAccess flags, UI guard11 retained stylesheets |
| `npm run build:rebuild`; `build-rebuild.log` | Exit0; isolated foundation preview and semantic guards; actual application builder is separately executed by unchanged source/browser checks |

The new34 cases use actual `createApplicationSession`, real CookieAdvisor adapters/factories, unchanged transport, strict root mappers, `createAdvisorPorts` and real controller. Only finite fetch DTOs/status/delivery timing are supplied; the existing synthetic reducer produces command responses. Default gate has all owner mutation capabilities true. Tests cover first-open approve false-to-true, each other mutation capability restriction and fully view-only reads/mutation denial, authoritative refresh and adjacent read families, view/source denial/current401/wrong-target, supplied actor change, actual owner/CSRF/logout/expiry and artificial role negative, abort/superseding draft/gate A/B in both orders, same-target restrictive gate orders, exact approval acknowledgement/retry/status and remount recovery. They assert private state, current authority, owned busy cleanup, pending acknowledgement and byte-identical retry commands. No `current()` or successful application port is replaced.

Two harness mistakes are retained in the early logs, not counted as product findings: the initial v2 payment DTO omitted required legacy quote/claim extension fields; a supplied actor mutation before draft selection was correctly overwritten by the actual gate. Corrected DTOs match the unchanged app browser fixture. Actor replacement is tested during a nonselecting pending validation read, where it remains an actual applicability boundary. The original red first-open and unchanged95/11 failures do not depend on these mistakes. No old privacy assertion was weakened.

## resource and acceptance boundaries

No browser/DOM call occurred before the explicit parent grant following W7 advisor R4 release. Called `preview_status` first (no tab), opened/closed one owned blank incognito preview, then used the specifically authorized repository Chrome harness. Each file launches one sequential installed headless Chrome, finite `.invalid` API/assets, blocked service workers/background networking, deny-by-default unknown requests, and console/page-error checks. No real Auth/DB/parent fixture, raw-source fetch, hosted endpoint or external traffic is used.

Parent W6 exclusively owns the genuine connected fixture and journey. This worker never reads its credentials, starts/adopts/resets its services or upgrades synthetic cookie protocol evidence into genuine Auth/persistence proof. No backend/SQL/security setting changes, full portal/root/Expo suite, notification delivery, full remaining pages, hosted behavior, exact-head CI, merge/deployment or legal/clinical/human acceptance. No push, PR, merge, deployment, real client/source/permission write, external message, money or order action.

All browser contexts/processes/test sessions are closed. Final `preview_status` returns no tab and executable process inventory is `automationChromeProcesses:[]`. `release.json` records explicit Chrome release at **2026-10-31T03:18:43.293289+00:00**, reported immediately to the parent for W6. No browser/DOM calls follow release. The one blank preview was closed before the browser harness finished startup; no page navigation or inspection occurred on it. No browser handle, server or fixture is handed off.

Directly inspected the fresh actual app `advisor-editor-1440.png` from the unchanged first-open/preview/return journey: the real routine editor is visible with complete source-derived modules, normal shared controls and saved state. No pixel-match or full-portal visual acceptance is inferred. Original red loading failures are preserved in the unchanged app11 log.

Parent owns canonical status/CONTEXT_SYNC, integration and fresh independent review. The delivery receipt supplies the exact commit after scoped validation; no self-referential head is invented here.
