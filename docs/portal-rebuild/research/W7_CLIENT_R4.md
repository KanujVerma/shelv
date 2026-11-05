# W7 independent client-plan review, round 4

30 October 2026. Bounded R3-1 review only. No production fixes or nested agents.

**R3-1 / P2: ADDRESSED.** The current recovery read starts while an obsolete read is still pending. Obsolete success, rejection and cleanup cannot apply content, overwrite intent, show a current error, release a newer operation's busy state or acknowledge unseen content.

**Specification verdict: PASS for this bounded correction. Correctness/quality verdict: PASS for this bounded correction.** Fresh independent execution passes **58/58 focused cases** and **25/25 additional independent cases**, zero failures/skips in the final runs. Strict frontend types, forbidden preview-field type assertions, rebuild build and UI guard pass. No new in-scope product finding. This does not establish full-portal, genuine cookie/Auth, backend, application-composition or release acceptance.

## Identity, original context and exact source

- Review workspace: `/Users/kanuj/.t3/worktrees/shelv/t3-393cc997`, branch `t3/w7-client-r4-review`. Clean starting and tested source HEAD: **`284c04e94060543106e3a686d4aa7cd61c7bebfb`**, exactly the requested parent. The returned report-only commit is a child of this HEAD; no runtime/test source changed during review.
- First live `orchestrator_capabilities({})` and `t3_thread_configuration({})` both verified **`codex / gpt-6.1-sol / reasoningEffort=xhigh / serviceTier=default`**, full-access/default interaction. Both were checked again after browser closure with the same selection; `runtime-final.json` preserves tool results. No delegation or nested agents.
- `git fetch origin` succeeded; `origin/main=d39a7d4943209080df7c4cf97d85784f462758bf`. No rebase/reset or writes to another checkout.
- Original W3 range **`ec231df2e10671428ef7d98bbe80b6efedc1aa60..b4f43f7084a4cd3330805e2cf9e7bd0f637dac06`**, integrated as `4ad0038`. Original review `85ab24d`, integrated as `c63bbff`. First fixes **`c63bbff..d341ed7`**, integrated as `98f4a5a/c2415a3/42555e0`. R2 report `71c18a5`, integrated as `fb853a3`. False-unlock follow-up **`aaa46fd`**, integrated as `dd0ade9`; Q2/unpublished adapter **`753e392`**, integrated as `79bf0a0`. R3 tested source **`5fe41666747fe918eccee46c68f29d1968495562`**; report **`0b4261713e6eb6aa21230bbdfdf7073143491922`**, integrated as `28ade0b`. Those reports and findings remain unchanged.
- Microfix **`0fe2fa7fc2485678f2ac01e1410364be4960536c`**, integrated as **`76b1527f37bbedcf69d82ee41065684d265008ca`**. Response **`818accfcd89d87252febbe9b68dbe4ffeddf8903`**, integrated as **`3be6a52f17acbf3f583a20c7242d581d834c207d`**. `git diff --quiet 0fe2fa7 HEAD -- apps/portal/src/features/plan apps/portal/tests/rebuild-plan-recovery.test.mjs` and the corresponding `818acc` response-report comparison both exit 0.
- Fully read [original W7 review](W7_CLIENT_REVIEW.md), [W3 fixes](W3_FIXES.md), [W7 R2](W7_CLIENT_R2.md), [conflict/preview response](W3_CONFLICT_PREVIEW.md), [W7 R3](W7_CLIENT_R3.md) and [recovery response](W3_RECOVERY_FIX.md). Read root/portal AGENTS, rebuild entry point, D01-D48, full desktop specification, implementation contracts, PLAN_API_V1, acceptance matrix, workstreams and current status. Resume reconciled the older canonical allocation prose against the explicit current assignment and Git history. Review/verification, repository task-first UX/design and relevant Figma guidance were read; no fresh Figma acquisition or version claim.
- Inspected the complete plan feature, public exports/types, review basis, session/navigation boundaries, unchanged synthetic entry and new recovery tests. The feature/test diff from R3 is only `PendingReview` ownership in `DecisionControls.tsx` plus `rebuild-plan-recovery.test.mjs`. Public API, `reviewBasis.tsx`, helper, copy/CSS, shared contracts and unpublished adapter are unchanged. Exact comparisons to R3 confirm the unchanged basis/types/helper bytes.

## Independent R3-1 disposition

`apps/portal/src/features/plan/DecisionControls.tsx:41` now associates busy state with a unique per-read token. Enclosing view, presentation mode or captured-session object replacement advances the context epoch and immediately retires the old owner. At lines 56-63, both current context/session and exact ownership guard result/error application. At line 66, cleanup releases busy only if its token still owns it; loading cleanup additionally requires current context. Mount/session validity remains required. No obsolete content is accepted merely to free the control.

The existing fetched-basis, scope-token/epoch, exact view, session, mode, publication-version and decision-revision checks remain active. Successful recovery fetch makes displayed content reviewable. A deliberate current acknowledgement performs another read; only the same fetched publication/revision may close the gate. Pending/failing/unmounted reads and changed basis retain the restriction. The rejected command is never replayed as a current-version command.

| Independent case | Observed intended result |
| --- | --- |
| Original R3 active replacement while old read remains pending | Enabled retry starts read **3**, previously stuck at **2**. Current fetch applies; gate remains until deliberate reread. Late old completion leaves ledger unchanged. |
| Original read-only then exact original active object | Spent epoch stays invalid. Fetch and deliberate reread finish **before** releasing the old read: reads **4**, applied **2**, writes **1**. Releasing the old result afterward changes neither application count nor ledger. |
| Old success before/during/after new read | Checked-in cases pass all three timings. Old result cannot apply or release a pending current lock; new read can finish authoritatively. |
| Old rejection/finally before/during/after new read | Independent probes leave current error state and serialized ledger unchanged. During overlap, repeated calls to the actual current React click handler issue no additional reads. |
| Positive current busy without supersession | Repeated actual handler calls preserve reads **2**, applied **0**, writes **1**. Current failure releases its own lock and keeps acknowledgement disabled. |
| New failure, another current attempt, then old rejection | The failing current operation retains the gate; next current read starts while old is pending. Old failure cannot release that newer lock; lawful fetch/review succeeds. |
| Arbitrary same-access identity, version 17, revision 23 | Context replacement retires old ownership. Only the current synthetic authoritative response applies; fetched content plus deliberate reread is still required. |
| Mode, same-object read-only roundtrip, captured-session replacement/wrapper and renderer remount | New context can recover before old settles; old success/error cannot mutate the new context. Logout/remount/session-generation denial remains covered. These are synthetic boundaries, not actual Auth evidence. |
| Old cleanup during pending deliberate acknowledgement | Gate, ledger and reread lock remain intact; duplicate actual acknowledgement-handler call issues no read. Only current completion closes the gate, with writes still **1**. |

The actual checked-in nine cases also require a fresh deliberate decline after review to use a **new UUID**, publication **2**, revision **4**. Until that explicit choice, recovery and acknowledgement leave writes at **1**. Independent residual cases preserve removed-decision/manual attempted intent and byte-for-byte uncertain retry across navigation plus publication/revision replacement; no automatic write or false saved claim was observed.

## Earlier findings and preview remain bounded

| Review basis | Disposition retained by this review |
| --- | --- |
| F1-F3 | **ADDRESSED, scoped.** Original focused regressions still pass effective pause/exclusion versus prior Start, guide-free canonical directions/cautions/schedules and optional/full inline guidance. No actual-use date/event is invented. |
| F4 | **ADDRESSED, scoped.** Existing late-response fences remain passing; additional ownership probes reject old result/error/cleanup across current-context changes. This is UI fencing, not server authorization. |
| F5 and R2 false-unlock | **ADDRESSED, scoped.** Failed/pending/navigation/removed-decision and changed-revision cases remain gated. Current fetch plus deliberate same-basis reread is required. R3-1 recovery no longer depends on obsolete settlement. |
| F6-F7 | **ADDRESSED, scoped.** All-seven-card source fidelity, complete meaningful guidance and kind-appropriate purchase vocabulary pass unchanged cases. Decisions never imply payment/order/Start. |
| F8/Q1/Q2 | **ADDRESSED, scoped.** Actual keyboard/history/opener/scroll journeys, published evidence geometry and destination-specific Back labels pass the original cases. No fresh pixel-match or whole-screen visual approval is claimed for this behavioral microfix. |
| Explicit unpublished adapter | **PASS, bounded contract retained.** Original preview cases plus independent sentinel test preserve shared rendering, finite/private-field rejection, unavailable live state/actions, session invalidation and byte-identical client ledger. No fake publication/use/date/entitlement/revision or live callback/source-private field was added. Null-target provenance still requires upstream exact-request/session/current-draft binding. |

Task-first recovery map: client sees rejected choice and retained attempted intent -> current **retry latest plan** produces progress -> fetched content remains gated -> deliberate **i’ve reviewed this plan** rereads -> a fresh deliberate choice becomes available. The existing status/error/control vocabulary is unchanged. This is an automated/source cognitive walkthrough, not measured human comprehension.

| Priority | Persona / goal | Exact issue reviewed | Consequence | Smallest correction / regression | Evidence level |
| --- | --- | --- | --- | --- | --- |
| P2 R3-1, addressed | client recovering a rejected choice | obsolete busy owner blocked the enabled current retry | no progress until superseded read settled | context-bound unique owner retirement; deny obsolete result/error/finally; require current fetch and deliberate reread | fresh intercepted Chrome, original repro adaptation, adversarial overlap and source |

No actual new in-scope finding needs a priority/path/reproduction entry. Application A1/A2/A3 and the two separately allocated W2 findings are **not adjudicated or closed by this ClientPlan verdict**.

## Browser isolation and release

Parent explicitly allocated sole serial intercepted Chrome after earlier contexts/handles/processes closed. First `preview_status` returned `available:false,tabId:null`. The expressly requested repository esbuild/Playwright-core installed-Chrome workflow exercised actual feature source under StrictMode, `--test-concurrency=1`, one browser at a time. No collaborative tab was opened.

Service workers and background networking were blocked. Only synthetic `.invalid` GET routes, in-memory bundled files and finite exact public Maya sample assets fulfilled from local bytes were permitted; unexpected requests aborted and failed teardown assertions. Page/console-error and unexpected-network arrays were empty, including the diagnostic-failure teardowns. No real API/Auth, credentials, external browser traffic or parent fixture was used.

Every context/browser closed through `finally`/`after`. On terminal browser completion, process readback recorded **`ChromePids=[]`, `reviewNodeTestPids=[]`**, and final `preview_status` again returned no tab. **Chrome was explicitly released for the waiting W2 work immediately then, before report completion. No browser/DOM calls followed that release.**

## Exact fresh verification

All Node/npm invocations used `PATH=/Users/kanuj/.nvm/versions/node/v22.23.0/bin:$PATH`; actual Node is **v22.23.0**. Commands are from repository root unless portal cwd is stated. Artifact root is this checkout's ignored `.local-artifacts/portal-rebuild/w7-client-r4/`.

| Exact command / check | Actual result and scope |
| --- | --- |
| Portal `npm ci --ignore-scripts` | Exit 0,130 packages; lockfile unchanged. Existing audit summary 2 moderate/1 high, no dependency upgrade or audit assessment. |
| `node --experimental-strip-types --test --test-concurrency=1 apps/portal/tests/rebuild-plan*.test.mjs` | **58/58 pass**,0 fail/skip,40.215s; `focused.log`. Original49 plus new9, one combined fresh run. |
| `node --experimental-strip-types --test --test-concurrency=1 .local-artifacts/portal-rebuild/w7-client-r4/{residuals,busy-followthrough,ownership}.test.mjs` | **25/25 pass**,0 fail/skip,19.626s; `independent-final.log`. Adapted original10 residual cases,1 intended follow-through,14 new adversarial groups. |
| Portal `npm run typecheck:rebuild` | Exit 0,3.336s, unchanged strict/noUncheckedIndexedAccess configuration. |
| `apps/portal/node_modules/.bin/tsc -p .local-artifacts/portal-rebuild/w7-client-r4/tsconfig.boundary.json` | Exit 0,2.279s. Checked-in forbidden preview-field assertions active; config extends unchanged strict frontend config and includes existing CSS declarations/type roots. |
| Portal `npm run build:rebuild` | Exit 0,0.412s; isolated foundation preview. Actual feature separately bundled/exercised by Chrome; this is not final app-composition acceptance. |
| Portal `npm run check:ui` | Exit 0,0.142s,11 retained stylesheets. No CSS/budget change or new visual verdict. |
| Source/response/basis/helper exact comparisons; final live configuration | Pass; identities and unchanged paths above. `checks.json` records strict/build cwd/expanded argv/exits/durations. |
| Final owned-path/link/artifact/sensitive-pattern inspection and `git diff --check` | Pass before report commit; only this report is committed. Canonical status/context integration remains coordinator-owned. |

Two reviewer diagnostic faults are preserved rather than presented as product failures. `independent-initial.log` is24/25: the old R3 receipt queried **retry latest plan** after successful fetch correctly renamed the control. Only that obsolete receipt was corrected, and current fetch/gate/ledger assertions were strengthened. `independent-intermediate.log` is24/25: the added remount probe checked an existing disabled button before React committed the requested remount. The synthetic helper now exposes its rendered epoch/session, and the probe waits for the actual committed context/control. Neither correction edits production source or weakens an intended assertion. The final complete25-case run passes.

Read the complete original R3 diagnostic scripts and verified their hashes against R3 before adaptation: `residuals.test.mjs` **`6917926c5a6c910d2c1940be55da5fa0cb06739e21b4d7752f62558149f7d191`**, `busy-followthrough.test.mjs` **`c1e77fc8f536083a77e100d9431aa6862db33cfa9a4bed3eb392b2b547d1ac92`**. The old follow-through's bug-presence assertions were replaced with intended recovery-before-settlement assertions. Independent overlap instrumentation changes only the synthetic entry at bundle time: controllable per-read promise success/rejection and captured-session/render receipts. Actual feature source and checked-in helper bytes are unchanged. The repeated-handler probes call the actual rendered React handler to test ownership beyond the disabled DOM affordance.

The author's red **4 pass/5 fail**, green9 and earlier58 receipt remain author evidence in [W3_RECOVERY_FIX](W3_RECOVERY_FIX.md), not an independently rerun red/green claim here.

| Artifact under `w7-client-r4/` | SHA-256 |
| --- | --- |
| `focused.log` | `9f7dc5639aa4807024fe92e1ecad0e256c3f9fa31d6ec483594354b57f0b33fd` |
| `residuals.test.mjs` | `bef233d9de792165a04ef38cd2487217e93f738d746d5d0e8e5846538380e82a` |
| `busy-followthrough.test.mjs` | `20a73adc5411607f793440dbef9b360fb4ac7776b0e26689da544ffc6c06a232` |
| `ownership.test.mjs` | `d027381d91b5b3ce4fe6abee54f261cae20a1608af3aa333b2231e4a345fb241` |
| `independent-final.log` | `adc8c8b427725b60cb068296fd23d104807f103bf96feb48542cfd68663b31af` |
| `checks.json` | `cfb76dc1c0817a4ef97317872d99ef55db26293e0d8b6f39e8d2b21a3a2bce02` |
| `runtime-final.json` | `8b4b93595249c1bd7eb82b2f0df9de24191ee166cc7e4cd6724ccb0dd7d9ead6` |
| `closed-handles.json` | `eb7bdc1db82bd3f4868d38574d4b04e9b101acbb32f8f520d0251d72706b608b` |

## Separate acceptance and skipped checks

Full portal/session/root/native suites, root type/test checks, Expo/iOS export, retained/application packaging, genuine cookie/Auth/Edge/PostgREST/persistence/permissions, DB/reset/pgTAP/RLS/Storage/outbox/delivery, hosted/CI and parent fixture lifecycle were **not run** in this bounded review. Prior author/backend/root results retain their original scope and are not converted into fresh acceptance. No PG, Docker, Auth service, credentials or hosted resource was touched.

Complete source/asset production delivery, persisted use reports, unknown actual Start dates, stop/pause/different-use/latest-review projections, final application routing, all five Maya stages with Exit/Explore/Replay/Reset and genuine ordinary-client positive/negative acceptance remain separate coordinator lanes. Callbacks are still bounded seams, not proof of finished reports/orders/exports/messages. No full visual/accessibility/zoom/reduced-motion, representative-human comprehension, legal, clinical, security or release approval is claimed.

Only `docs/portal-rebuild/research/W7_CLIENT_R4.md` is committed. Diagnostics remain ignored. No fixes, push, PR, merge, deployment, real clients/sources/permissions, communications, funds or orders. Coordinator may integrate this report-only commit and update canonical status/context; this bounded PASS closes R3-1 without closing unrelated findings or release gates.
