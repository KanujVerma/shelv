# W7 independent W3 client-plan re-review, round 2

30 October 2026. Review only. No implementation authorship or nested agents.

**Specification verdict: CHANGES REQUIRED.** F1-F4, F6-F8 and Q1 are addressed within this UI slice. **F5 is NOT ADDRESSED completely:** version replacement now preserves the attempted choice and conflict, but navigation can acknowledge an old plan before any successful latest-plan refresh.

**Correctness/quality verdict: CHANGES REQUIRED.** The fresh checked-in W3 suite passes **32/32**. Independent intended-behavior probes pass **6/8**, with two F5 failures reproduced again in a separate focused run. Strict frontend types, rebuild preview build and UI color guard pass. These are local UI findings and evidence, not full-portal, connected-backend or release acceptance.

## Reviewed identity and scope

- Workspace: `/Users/kanuj/.t3/worktrees/shelv/t3-91dd91e7`; branch `t3/review-client-corrections-round2`. Clean starting source/head: **`36af02e50a69c6df112b70b003fb3d95d91ac561`**, exactly the requested parent source. The report commit returned in the handoff is a documentation-only child of this reviewed head.
- Original implementation: `ec231df2e10671428ef7d98bbe80b6efedc1aa60..b4f43f7084a4cd3330805e2cf9e7bd0f637dac06`, integrated as `4ad0038d99520b0bcd5bfa087b6aec2c00d7c95a`. Original review: `85ab24d75048a1d3b183fd9c2bdedd154a414d55`, integrated as `c63bbffcad832cc383f9ea0ef67ed4aa0aca8d47`.
- Correction range: **`c63bbffcad832cc383f9ea0ef67ed4aa0aca8d47..d341ed75c3d35f71b04b039252ec0cfd8edde9c3`**; integrated regression, implementation and response commits: `98f4a5a545be527d4afab0a901e95574e1b2101d`, `c2415a3378bc8ca7c2588823ec160eed2ce6c978`, `42555e0c1a84af01aeb97410b36f9df4e37181d0`. `git diff --quiet d341ed7 HEAD --` all feature files, both W3 tests, both synthetic helpers and `W3_FIXES.md` exits 0. The reviewed W3 bytes match the correction head. Other integrated W1/W2 changes are outside this acceptance verdict.
- `git fetch origin` succeeded. `origin/main` was `d39a7d4943209080df7c4cf97d85784f462758bf`. No checkout reset, rebase or changes to another worktree.
- **First live runtime gate:** both `orchestrator_capabilities({})` and `t3_thread_configuration({})` returned instance/provider `codex`, model `gpt-6.1-sol`, `reasoningEffort=xhigh`, `serviceTier=default`, full-access mode. Both were checked again before reporting, with the same selection. The retained `runtime.json` is tool evidence. No nested delegation.
- Read root/portal AGENTS, Resume and review/verification skills, repository UX/design skills and Figma design-to-code guidance. Fully read [the original review](W7_CLIENT_REVIEW.md), [the complete response](W3_FIXES.md) and [the original W3 report](W3_VERTICAL_CLIENT.md). Read D01-D48, full desktop specification, implementation contracts, PLAN_API_V1, acceptance matrix, rebuild entry point, workstreams and current status. Current status still describes the older active first review; the supplied task and verified Git history establish this round's scope.
- Inspected all seven feature files, their correction diff, both W3 test files/helpers, public Maya source/adaptation, relevant strict DTO/content validation and shared navigation/overlay/session interfaces. The original retained `t3-d3de7402/.local-artifacts/portal-rebuild/w7-client/repro.test.mjs` was read as diagnosis. It was not rerun or counted as acceptance: its bug-presence assertions are intentionally contrary to corrected behavior.
- Browser allocation respected: source reading occupied more than the requested minute; process inspection before Chrome found no parent Node test/headless Chrome process. No process was killed. `preview_status` was called first and returned no attached tab. The explicitly authorized repository Chrome harness was used.

## Per-finding disposition

| Finding | Disposition | Independent evidence and remaining qualification |
| --- | --- | --- |
| **F1 / P1** | **ADDRESSED** | `model.ts:32-39` projects selected guidance from effective routine/restrictions; `content.tsx:54-62` and `ClientPlan.tsx:118-120` separate prior Start from advice. Checked-in tests cover pause/leave-out plus retained Start, reasons and absent Start. Independent probes also retain the actual source's other-product primary identity instead of nulling it: both selected depths show the restriction and actual earlier date, suppress obsolete baseline continuation, and state that current use is unconfirmed. No stop/date is invented. |
| **F2 / P1** | **ADDRESSED** | Shared `DecisionDirections`/`ProductDirections` render canonical decision directions, cautions and schedules without a guide. The fresh suite and independent 320px sheet/evidence probe require the full direction, caution, condition, Tuesday/Friday, stage, comfort rule and actual-Start anchor. No Start or routine activation is fabricated. |
| **F3 / P2** | **ADDRESSED** | `ClientPlan.tsx` RoutineRow now composes the same directions/schedule/details for optional rows. Only exact duplicate summary strings are removed. The fresh browser test requires optional full directions, condition, selected days, stage/comfort rule and product detail, plus the full sunscreen direction beside its short summary. Conservative retention causes some near-duplicate source sentences; this is not evidence that essential text may be deleted. |
| **F4 / P1** | **ADDRESSED** | `DecisionControls.tsx:54-70,83-98` fences callbacks by exact view identity and epoch, mount and captured session. The suite's read-only/new-publication/mode tests pass. Additional actual delayed reads reject active -> read-only -> the **exact original active object**, same-version/same-access replacement, client -> private-walkthrough -> client, and logout. Tests wait for each replacement to render before resolving the read; no stale application/success or memory overwrite occurs. A deliberate retry after the epoch case retains the complete original command and confirms only after rereading. This is UI response fencing, not server authorization proof. |
| **F5 / P2** | **NOT ADDRESSED** | The original new-version/remount defect and lost attempted-choice field are corrected. Fresh tests pass version/reason changes, navigation, removed decision, failed explicit review, another publication during review, deliberate acknowledgement, fresh UUID/version choice and session clearing. However, the **plan-level** acknowledgement does not establish that a latest read succeeded. Both failed and still-pending initial refreshes bypass the gate via navigation. See the residual reproduction below. No automatic replay or false success was observed. |
| **F6 / P2** | **ADDRESSED** | `DecisionReasons`, `DecisionComparisons`, recommendation/evidence composition retain all rationale bodies, distinct explicit reason, nonproduct comparison and productless/other-product guide paths. Fixture source no longer rewrites moisturizer kind/identity or reduces seven cards to four. Fresh deep equality verifies all seven adapted decisions, product names/images/guides and routine directions against the public source; browser traversal checks every original card's reasons, directions, guides, comparisons/actions and decoded local photos. Selected CeraVe evidence preserves the optional Hydro Boost qualification with its actual identity, without importing its how-to or azelaic studies as CeraVe directions. |
| **F7 / P2** | **ADDRESSED** | `isPurchaseDecision` requires purchase-relevant kind plus primary product. Fresh browser tests use the actual two-serum pause and all eight kinds. Pause/keep/leave-out/no-addition do not offer approve-product/self-buy/quote-total language; purchase kinds retain appropriate controls. These ports record only a decision, never money/order/Start. |
| **F8 / P2** | **ADDRESSED** | Stable feature opener refs use the existing shared Sheet `restoreFocusRef`. Both the formerly failing original journey and the expanded evening keyboard/history test pass against actual Chrome: selected-product callback, evidence, Back, Escape, real `plan-product-cerave-pm` focus, 300px scroll, evening tab and multi-depth Forward/Back. Assertions do not accept the H1 fallback when the opener exists. No shared W0 source change. |
| **Q1 / P3** | **ADDRESSED, bounded** | Fresh geometry assertions and visual comparison confirm C03D main `(264,162,736)`, green context x1024/width376, product-specific body-font title; C02D main `(264,214,744)` with serif title/subtitle spacing. C01 `(264,196,744)` and C03 sheet `(904,72,536,888)` remain correct. Complete source and preserved full identities increase height. This closes the original evidence variant/origin issue, not a pixel-identical or whole-screen design sign-off. |

## F5 residual: an old plan can be acknowledged as latest before refresh succeeds

**Priority:** P2, important correctness/recovery defect. **Owner:** W3, using the existing session-bound intent and navigation contracts. **Requirements:** D10/D16; implementation-contract conflict preservation and deliberate review. **Source:** `apps/portal/src/features/plan/DecisionControls.tsx:34-42,96-98`.

The 409 handler correctly stores `phase:'conflict'` before reading. A failed read leaves that phase. But `PendingDecisionReviews` changes it directly to `idle` whenever the user clicks **i've reviewed this plan** on the routine page. Its ledger stores attempted choice and rejected basis version, but no successful refreshed/reviewable basis. Navigating away also unmounts the awaiting decision control, so a delayed latest result is correctly fenced out while the plan-level acknowledgement still clears the gate.

Reproduce in the isolated synthetic harness:

1. Open `/plan/recommendations/maya-card-treatments` on version 1. Return 409 for **approve product** and 503 for its automatic authoritative read. Wait for **plan changed**.
2. Click **back to plan**, then **i've reviewed this plan**. Navigate back to the treatment recommendation.
3. Observe version **1**, **zero applied latest reads**, **zero plan changed notices**, and **decline enabled**. The client has only reviewed the old content.
4. Alternatively, let the initial read capture version 2 with reason `UNSEEN_VERSION_TWO` and delay delivery. Perform the same navigation/acknowledgement before releasing it. Version 2 is never shown; the old result is rejected after unmount, but the gate is still gone and decline is enabled on version 1.

Both intended-behavior assertions fail (`declineEnabled:true`, expected false) in the initial independent run and a separate two-case repeat. The repeated pending case reports `{version:1,applied:0,gate:0,declineEnabled:true,unseenContent:false,writes:1}`. This is not merely clicking before React renders a restriction: the tests wait for the conflict notice and the plan/acknowledgement controls.

A separate diagnostic follow-through confirms a deliberate subsequent decline sends a **new UUID but publicationVersion 1 / expectedDecisionRevision 0**. The port again rejects it with 409. There is no automatic extra write and no **choice recorded** claim. This finding is a premature local review-gate closure, not a server authorization bypass or a charge/Start.

**Smallest correction:** retain whether a successful current authoritative read has supplied the conflict's reviewable basis; require that read and deliberate review before clearing the ledger from any route. Failed/pending/unmounted reads must preserve the gate and recovery path. Keep attempted intent separate, preserve the exact uncertain-command retry rules, and never automatically turn the rejected command into a new-version write. Add durable regressions for both navigation cases above.

## Additional minor navigation observation

**Q2 / P3, nonblocking:** `ClientPlan.tsx:128` always labels evidence Back **back to product**. Starting from the treatment recommendation, following **directions, ingredients & sources**, then clicking that button actually returns to `/plan/recommendations/maya-card-treatments`. Native C02D labels that path **back to recommendation**; native C03D uses **back to product**. The destination itself and selected product are correct. Use the existing predecessor/parent contract to make the label predict its destination. This predates the correction wave and does not reopen F8's verified opener restoration.

## Task, content and visual evidence

| Client goal | Observed route/action and result | Evidence level |
| --- | --- | --- |
| Follow current advice | Plan tabs retain morning water rinse, CeraVe, sunscreen, optional makeup; evening one conditional remover, cleanser, moisturizer. Approval alone never inserts treatment. Optional restrictions and full practical directions stay visible. | Fresh Chrome and pure projection/fidelity tests. |
| Understand the selected product | Sheet/evidence remain bound to the selected ID; prior Start/absent Start, current advice, comparison identity and proposal remain separate. Complete azelaic patch test, dry/intact skin, eyes/lips/broken-skin avoidance, comfort-dependent introduction, toner/other-active avoidance, irritation response, 15-20% versus 10% qualification and nonoptimal-schedule limitation remain reachable. | Fresh Chrome content assertions, independent narrow canonical-guidance probe and source inspection. |
| Choose/recover | Approve/defer/decline use exact publication/revision/UUID; acknowledgement alone is not success; mismatch/read failure remain uncertain and exact retry survives navigation. Conflicts retain attempted choice, with the F5 plan-acknowledgement residual above. | Real rendered events against synthetic operation ports; no connected persistence claim. |
| Return to the routine | Sheet/evidence/Back/use-callback/Escape restore real opener, selected evening and actual scroll. Unknown IDs/direct entry recover through shared parents. | Fresh checked-in Chrome tests. Enclosing preview navigation remains a stubbed delegation seam. |

Compared the retained exact native contexts/page sections and all six PNGs: C01 `498:85`, C01E `503:926`, C02 `498:212`, C02D `499:766`, C03 `499:151`, C03D `503:1083`. Recomputed all **12 context/PNG SHA-256 values**, matching `design/ACQUISITION.json`. No live Figma acquisition/version is claimed. Visually inspected this run's six corresponding rendered screenshots plus the residual screenshot. Source-length reflow, proper full product names, all seven cards and truthfully **not scheduled** review information legitimately differ from the staged shortened frames. No fake appointment, publication version or actual-use date was introduced for acceptance.

The existing tests also exercise 1280/390/320px, long names, multiple same-category IDs, missing image fallback, unknown/empty plans and deep-link recovery. These are targeted rendering/recovery checks, not representative-human comprehension, complete accessibility, 200% zoom or reduced-motion acceptance. The public Maya read envelope's version/date are explicitly synthetic test data, not a real publication or an unpublished-preview adapter.

## Fresh verification receipt

Every Node/npm invocation used **`PATH=/Users/kanuj/.nvm/versions/node/v22.23.0/bin:$PATH`**; `node --version` returned `v22.23.0`. Commands below run from repository root unless a cwd is stated. Chrome runs were sequential with `--test-concurrency=1`; each browser closes before the next run. React StrictMode and the actual feature source were bundled by the repository esbuild/Playwright-core harness. Browser service workers/background networking are blocked; synthetic `.invalid` application requests and a finite list of original public-sample image URLs are intercepted and served from local bytes. All other requests abort and fail assertions. No browser request reached an external server; no live API, account or credential was used.

| Command / check | Fresh result and scope |
| --- | --- |
| Portal cwd `npm ci --ignore-scripts` | Exit 0, 130 packages; lockfile unchanged. Existing audit summary: two moderate and one high advisory; no upgrades or advisory assessment. |
| `node --experimental-strip-types --test --test-concurrency=1 apps/portal/tests/rebuild-plan*.test.mjs` | **32 pass / 0 fail / 0 skip**, 20.519s; `focused.log`. 26 rendered groups and six pure tests. |
| `node --experimental-strip-types --test --test-concurrency=1 .local-artifacts/portal-rebuild/w7-client-r2/independent.test.mjs` | **6 pass / 2 fail / 0 skip**, 5.874s; `independent.log`. The failures assert intended F5 behavior, not acceptance of a bug. One passing group is a label/destination observation, not label conformance. |
| Same command with `--test-name-pattern='independent F5'` | **0 pass / 2 fail / 0 skip**, 2.905s; `conflict-repeat.log`. Both residuals reproduced independently of the initial browser process. |
| Same serial command on `followthrough.test.mjs` | **1 diagnostic observation passes**, 2.430s; `followthrough.log`. Confirms the new deliberate stale command and no automatic replay/false success. Its assertions describe the defect and are **not acceptance**. |
| Portal cwd `npm run typecheck:rebuild` | Exit 0, normal strict configuration, zero diagnostics. |
| Portal cwd `npm run build:rebuild` | Exit 0; isolated foundation preview and new-source semantic color guard. The actual feature is separately bundled/exercised in Chrome. No final app composition claim. |
| Portal cwd `npm run check:ui` | Exit 0, 11 retained stylesheets. No budget/configuration change. |
| Native hash comparison; exact W3 correction-file diff | 12/12 retained hashes match; W3 feature/test/helper/response bytes identical to `d341ed7`. |
| `git diff --check`; report link/scope/secret/artifact inspection | Pass before commit. Only this report is committed; all diagnostics are ignored. |

The independent harness reuses the repository browser/network setup. Its only bundle-time instrumentation exposes the exact enclosing rendered-view object from the **synthetic helper** to test identity leave-and-return; it does not replace feature code. Faults are confined to data/operation ports, delayed reads, failed reads and synthetic session/mode controls. Console/page errors and unexpected network arrays are asserted empty on teardown.

Ignored local artifacts in `.local-artifacts/portal-rebuild/w7-client-r2/` include scripts, full TAP failures, follow-through command receipts, types/build/UI logs, runtime receipt and native hashes. The checked-in suite generated actual screenshots in sibling `w3/`; independent screenshots are in `w7-client-r2/probes/`, including `conflict-stale-ack.png` and `canonical-320.png`.

| Artifact | SHA-256 |
| --- | --- |
| `focused.log` | `156f8ecdb640cb93a932c897afad9acf0d8e07782840e94a4c5964523621f503` |
| `independent.test.mjs` | `2a78cde6c43c2920d942ea13b8381a8ce2518275e8ffb56d352386938ce5036f` |
| `independent.log` | `329efada38bc960d83c0e646c0dcfb850d04a82f94662734d571f01556bb6547` |
| `conflict-repeat.log` | `039bc01d5674a60dc3da41ee0c7ed16f1ad3f8aaddce3bd98e08cec644167727` |
| `followthrough.log` | `d4494c6e16f40f1d8053a7050b08307582c4dda7de5bb370be4d2386067bb5b7` |
| `runtime.json` | `860780be3f952f0a769036b74bd477db4164aef4f7c6d5c8644e9c49a5984e8d` |

## Explicit dependencies, skipped checks and handoff

This report does not require future integration seams to exist as a condition of closing the particular local renderer findings. It also does not promote synthetic tests to full acceptance. Real stop/pause/different-use reporting, unknown actual Start dates and latest published-review projection remain W1/coordinator dependencies. The current DTO has Start-only tuples with required known dates; **start not recorded** truthfully handles absence, but is not acceptance of a represented unknown-date event.

The actual unpublished `PlanPreview` presentation adapter, real retained-cookie/API composition, initial read/loading/denial composition, persisted use reports and source/asset production packaging remain unaccepted dependencies. Use/self-purchase/export/update/history callbacks are seams, not completed reports, purchases, downloads or communications. All **five Maya stages**, Exit/Explore/Replay/Reset and private walkthrough integration remain separate coordinator acceptance work. No invented publication version/time/entitlement is accepted for draft preview.

Full portal **421**, session **157**, retained package/root/native/export and backend results in the author's response were **not rerun by this bounded review** and are not claimed as fresh exact-head evidence. No DB reset, Docker, PostgreSQL, pgTAP, Auth, Edge/PostgREST, credentials, hosted resources or parent fixture was used. Root application suite/types/Expo, full portal/session suites, actual connected positive/negative permissions, real notification delivery, native/device, CI and representative-human tests were skipped. W1/backend findings and other workstreams retain their separate review status.

No production source fix, push, PR, merge, deploy, real client/source change, communication, money movement, retailer order or permission change occurred. No new design/business rule was introduced. Only `docs/portal-rebuild/research/W7_CLIENT_R2.md` is committed; coordinator owns canonical status/context updates.

**Unresolved objections:** close the F5 navigation/unsuccessful-refresh gap with durable regressions and a new independent review before accepting this correction wave; reconcile minor Q2 as part of existing navigation-copy work. Full-portal and release gates above remain outstanding independently of this bounded verdict.
