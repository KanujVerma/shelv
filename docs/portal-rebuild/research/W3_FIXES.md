# W3 bounded client fix pass

30 October 2026. Implementation response to [the original independent review](W7_CLIENT_REVIEW.md). **F1-F8 and Q1 have implementation/regression responses below; independent re-review and connected acceptance remain required.** This report does not accept the client slice or the backend.

## Identity, scope and evidence

- Workspace: `/Users/kanuj/.t3/worktrees/shelv/t3-a4917151`, branch `t3/client-portal-fixes`.
- Verified implementation commit: **`f0cee1ca14dd78d8b825ddd06d7e47018ad18082`**. Final report commit is returned as the handoff head; no implementation files changed after this commit.
- Exact clean starting base: `c63bbffcad832cc383f9ea0ef67ed4aa0aca8d47`. `git fetch origin` succeeded; `origin/main` remained `d39a7d4943209080df7c4cf97d85784f462758bf`. No rebase or writes to another checkout.
- Fresh live `orchestrator_capabilities` and `t3_thread_configuration` returned provider instance `codex`, model `gpt-6.1-sol`, `reasoningEffort=xhigh`, `serviceTier=default`, full-access mode. Runtime receipt: `.local-artifacts/portal-rebuild/w3-fixes/runtime.json`. No subagents.
- Every Node/npm command used `PATH=/Users/kanuj/.nvm/versions/node/v22.23.0/bin:$PATH`; installed Node is `v22.23.0`.
- Read the original W7 report in full and its actual retained reproduction script, W3 author report, approved desktop specification, D01-D48, shared contracts/API freeze, ownership/status and relevant source/navigation/overlay/session interfaces. Inspected all six retained C01/C01E/C02/C02D/C03/C03D PNGs and the native context for the changed evidence variants. No fresh Figma version/acquisition is claimed.
- Only assigned feature files, rebuild-plan tests/synthetic helpers and this report changed. No shared UI/navigation/transport, root contracts/migrations, auth, package/lock/build/entry/status/context files changed. Coordinator should carry this receipt into canonical status and `CONTEXT_SYNC.md` during integration.

## Behavioral regressions before implementation

Commit **`f23402d9312a114fea7f0ecb95097472258055a8`** contains intended-behavior regressions before any feature fixes. It adds port-only delayed/failing reads and authoritative result/application receipts to the existing synthetic helper. It does not replace feature code or weaken assertions to accept the observed defects.

From the repository root:

```sh
PATH=/Users/kanuj/.nvm/versions/node/v22.23.0/bin:$PATH node --experimental-strip-types --test --test-concurrency=1 apps/portal/tests/rebuild-plan*.test.mjs
```

The pre-fix run was **16 pass / 11 fail / 0 skip**, retained in `.local-artifacts/portal-rebuild/w3-fixes/red.log`. The existing F8 test failed unchanged at its opener-focus assertion. The other failures were the intended pause/unknown-Start, guide-free V3, optional/full instructions, stale active read, new-version conflict, rich content, purchase semantics, evidence geometry and seven-card fidelity assertions. The review's observation-only script is supplemental diagnosis, never counted as a passing acceptance suite.

## Per-finding implementation responses

| Finding | Concrete response | Regression/evidence |
| --- | --- | --- |
| **F1 / P1** | `productContext` uses the same effective routine projection as the routine. Pause/exclusion removes obsolete baseline steps and routine guides from the selected directions. Exact authored restriction reasons appear on sheet and evidence. Earlier Start is displayed as **previously reported start** with its actual recorded date, separately from advice and unconfirmed current use. Absence displays **start not recorded**, never a known never-started claim. Restrictive advice explicitly takes precedence over retained comparison/rationale context; no stop event/date is invented. | Both pause and leave-out with an earlier Start exercise sheet and evidence, require the exact reason/prior date and reject the former in-routine/why-it-stays/baseline-continue presentation. Separate unknown-Start test. |
| **F2 / P1** | Shared `ProductDirections` renders product-bound canonical decision directions, cautions and schedule independently of legacy guides or active routine steps. Guide scope remains product-specific; an optional Hydro Boost direction never becomes a CeraVe instruction. | Guide-free V3 tests require direction/caution/condition, Tuesday/Friday and comfort-contingent stage on both selected depths, with no fake routine activation. |
| **F3 / P2** | Optional rows use the same directions/schedule/detail composition as ordinary rows. A short summary removes only an exactly identical full string; it cannot suppress all directions. No safety/text heuristic is used. Selected days, periods, conditions and stages remain visible. | Optional condition, Monday/Thursday, stage, comfort rule, full direction and exact product depth; ordinary sunscreen full direction retained beside a short summary. |
| **F4 / P1** | Decision callbacks capture an enclosing view/mode epoch as well as mount/session validity. Any replacement view invalidates the old callback, including another active view. The command outcome is stored before calling `onViewChange`; no later update can clear a newer restriction or report stale success. A superseded pending operation remains uncertain. | Actual delayed read captured while active, then newer read-only notice rendered, then old result released: no application/success/control reactivation. Additional newer-publication and preview-mode races, unchanged newer memory, mismatch and failed-read/exact-retry cases. This is UI fencing, not server authorization evidence. |
| **F5 / P2** | Session/mode-bound intent ledger is keyed by stable decision ID across publication changes. It separately retains attempted choice and rejected publication identity. A 409 clears only the rejected command, preserves the review gate, rereads without auto-approval, and never turns the old command into a new-version write. Another publication discovered during deliberate review keeps the gate. Removed decisions get a persistent contextual notice and deliberate latest-plan acknowledgement. New choices create fresh commands with the visible publication/revision. | Changed version/reason plus navigation; decision removed; failing review; another publication during review; explicit acknowledgement without any extra write; fresh version-2 command has a different UUID/choice. Session invalidation/replacement clears the ledger. |
| **F6 / P2** | Full rationale bodies and distinct explicit reasons render through shared modules. Nonproduct comparisons, productless guides and a product decision's guide for its other related product remain reachable. Comparisons use actual stable product identities. The fixture no longer relabels moisturizer as keep, clears Hydro Boost identity, rewrites treatment/routine copy or filters seven cards to four. All original names, instructions, decisions, rich guidance and image URLs remain intact. Only explicit public-source as-needed/condition schedule annotations and the synthetic read envelope are added. Addition decisions sort ahead of later/optional choices through a generic kind projection, without modifying source data. | Deep fixture equality against all seven original adapted decisions, names/guides/images/directions; complete current-product qualification; nonproduct comparison and productless-guide markers; all-card browser traversal and actual local source assets. |
| **F7 / P2** | Purchase eligibility requires addition, replacement, finish-then-replace or optional-alternative semantics plus a primary product. Keep/pause/leave-out/no-addition use **approve decision** and guidance-only consequences. No sales/quote/self-buy treatment follows merely from non-null `primaryProductId`. | Actual source two-serum pause, then all eight kinds. Nonpurchase variants have no approve-product/self-buy/all-in-total sales copy. Choices execute only `record_decision_v1`, never money/order/Start. |
| **F8 / P2** | Feature keeps stable product opener refs across routine unmount/remount and supplies the existing shared `restoreFocusRef` API to `Sheet`. Shared fallback, focus trap and history are untouched. | Original failing C01/sheet/evidence/Back/use-callback/Escape test now passes. Additional evening keyboard journey verifies real opener ID, 300px scroll, Tab/Shift+Tab containment, Escape and multi-depth Back/Forward. No heading fallback accepted while the opener exists. No W0 patch is requested. |
| **Q1 / P3** | Evidence variant derives from typed selected effective routine/restriction/proposal context, never client ID/name or text heuristics. Existing/reference product evidence uses product-title body hierarchy, 736/376 columns and green context; introduction evidence retains the serif title with native subtitle spacing. Export remains on plan/recommendation pages. | At 1440: C03D main `(264,162,736)`, context x1024/width376 and semantic green; C02D main `(264,214,744)`. Existing C01 main `(264,196,744)` and sheet `(904,72,536,888)` still asserted. Source length freely reflows. |

## Task and necessary-copy review

The repository `shelv-ux-review`, Figma design-to-code, systematic-debugging, TDD, React quality and verification-before-completion skills informed this bounded pass. No new design system, route family, shared API or preview representation was introduced.

| Step | Client goal | Existing UI/action | Result and recovery |
| --- | --- | --- | --- |
| Routine | Follow current advice | morning/evening; product details | Full relevant directions and authored restrictions inline; product-bound depth. |
| Product | Understand this exact item's advice/use basis | sheet; ingredients & evidence; use callback | Restriction/current/proposed/reference state and earlier/unknown Start stay distinct. Back/Escape restores the real opener. |
| Recommendation | Understand and choose the guidance | shared approve/defer/decline | Vocabulary follows decision semantics; no order/payment/Start. Uncertain result retains exact retry. |
| Conflict | See a changed/removed decision without losing local intent | plan changed; review latest plan | Latest content plus attempted choice remains visible. Deliberate review required; no automatic rewrite. |

Affected copy is purposeful: **not started → start not recorded** communicates uncertainty; **in your routine → paused/left out** plus exact reason communicates effective advice; **why it stays → why this guidance / context for this decision** avoids falsely endorsing continuation; **approve product → approve decision** for nonpurchase kinds reflects the actual command. Prior-Start qualification, precedence notice and conflict/attempted-choice text explain state, consequence or recovery. Proper identities and exact source content remain unchanged. No blanket usability/comprehension/accessibility acceptance follows from this walkthrough.

## Verification receipt

All browser tests use the repository's esbuild/Playwright-core harness with installed headless Chrome, StrictMode, one browser stack and `--test-concurrency=1`. `preview_status` was checked first; no attached tab existed. The user explicitly required the existing intercepted Chrome workflow. Service workers/background networking are blocked. The synthetic `.invalid` origin and a finite set of original public-sample asset URLs are intercepted to local files; any other request is aborted and fails the test. No live API or external image request is allowed through.

All checks below ran against the final feature implementation. `checks.json` retains exact cwd, arguments, exit codes and durations. The immutable implementation commit, starting base and pre-fix regression commit are pinned above; the final report commit is returned as the handoff head.

| Command (portal cwd unless stated) | Actual result / limit |
| --- | --- |
| `npm ci --ignore-scripts` | Pass, 130 packages. Existing audit reports two moderate and one high advisory; no upgrade/audit fix or dependency/lock change. |
| Repository-root focused `node --experimental-strip-types --test --test-concurrency=1 apps/portal/tests/rebuild-plan*.test.mjs` | Final **32/32 pass**, zero failures/skips, 16.844s; `feature-final.log`. Includes the additional all-seven-card/source-asset traversal. Earlier expanded run was 31/31. |
| Repository-root `node --experimental-strip-types --test --test-concurrency=1 apps/portal/tests/*.test.mjs` | **421/421 pass**, zero failures/skips, 203.794s. Includes **32 W3 cases**, 26 actual Chrome groups and six pure projections/fidelity checks. Contains the final all-seven-card traversal test. |
| `npm run typecheck:rebuild` | Pass, zero diagnostics with the unchanged normal strict flags. No `noUncheckedIndexedAccess` relaxation. |
| `npm run typecheck:session` | Pass, zero diagnostics. |
| `npm run test:session` | **157/157 pass**, zero failures/skips, 39.721s. Retained runtime tests, separate from full portal count. Existing missing root Expo-base warnings appear during some bundles. |
| `npm run build:rebuild` | Pass, isolated foundation preview plus new-source semantic color guard. The actual feature is separately bundled/exercised in Chrome; this is not final app composition. |
| `npm run check:ui` | Pass, 11 retained stylesheets. New feature CSS is also scanned by the rebuild build; no literal-color budget or dependency changed. |
| `npm run build` | Pass, 134 assets, retained three gateway route families. Existing absent `expo/tsconfig.base` warnings. ZIP `80da94340bab72d21683eef6443df4ad917cf3c8cb8d2e6e35905d0e7134ae32`; vault `8eee97a0179d63768a05b9b50565eed9d6a3b381d955ddc91a6f5b5e0b553da2`. This packages retained application/gateway source and does not connect the feature. |
| Root `npm test` | **Blocked**, stops at absent `zustand` imported by `authStore.ts`. Root dependencies were not installed. No full-root test success claimed. |
| Root `npx --no-install tsc --noEmit` | **Unavailable** root compiler; npx resolves a cached unrelated `tsc` warning instead. Direct retry using the pinned portal compiler and normal root config exits 2, confirming absent root React/Expo/native dependencies and Expo base config. |
| Root `npm run typecheck:tests` | **Blocked**, root `tsc` absent (exit 127). Direct pinned-compiler retry exits 2 for missing node/react-native type definitions and `expo/tsconfig.base`. No test compiler flag changed. |
| Root `EXPO_NO_TELEMETRY=1 npx --no-install expo export -p web` | **Blocked**, Expo is absent; npx refuses missing package. npm was offline and no package was downloaded. |
| iOS/native, SQL reset/pgTAP/real local Auth, hosted, exact-head CI | Not run. No native/backend changes; DB/Auth/credentials/hosted are explicitly excluded by this task. CI requires coordinator integration. |
| `git diff --check`, owned-path/secret/artifact/link inspection | Pass before commits; only the assigned ten paths across the regression/fix/report wave. No source image bytes, temporary bundles or diagnostic artifacts are committed. |

Artifacts are ignored and local to this checkout:

- `.local-artifacts/portal-rebuild/w3-fixes/`: `red.log`, intermediate `green-1.log` through `green-4.log`, `portal-full.log`, `feature-final.log`, `checks.json`, runtime and separate type/build/session/root/Expo logs. Intermediate `green-3.log` caught a productless-guide predicate regression (**29/31**); the existing/new tests found it and the predicate was corrected before `green-4.log` (**31/31**) and the complete full suite. It is retained, not relabeled as success.
- `.local-artifacts/portal-rebuild/w3/`: final actual rendered C01/C01E/C02/C03, `cerave-pm-evidence-1440.png`, `ordinary-azelaic-10-evidence-1440.png`, and routine/recommendation/evidence at 1280/390/320, plus long/unknown fixtures. Visually inspected desktop evidence/routine and narrow evidence/recommendation. Native origins match the geometric assertions; complete source, proper names and full directions increase height. No pixel-identical, full accessibility, 200% zoom/reduced-motion or human-comprehension verdict is claimed.

The synthetic fixture retains original asset URLs and the harness serves only their exact local public-source files. It verifies actual image decoding for the three morning product photos. The fallback remains covered by null imagery. This is source/identity/Chrome evidence, not a production asset delivery or private-source permission test.

Artifact SHA-256 receipts:

| Artifact under `w3-fixes/` | SHA-256 |
| --- | --- |
| `red.log` | `535b97d50db7f70fc828c38cdb9cca50887bbf7209da735912c208d9911e15a9` |
| `feature-final.log` | `5fd1eda3ca9eacab955f06696b143717614929c4c92cf140d7d921fb02e40262` |
| `portal-full.log` | `9a1fb26242fe4fbcdd3f92ec3d86c4eb6f71ea451191a370154f68314b685a4a` |
| `session-tests.log` | `46e0fdd90fb0c64d31047006dd0e890c87c8c080a5764d19720088c26142cc1d` |
| `checks.json` | `b513f3ae723a24a2b67ea9f7b4601671020a228caf6f1bc786f839104f40f965` |
| `runtime.json` | `cfc65bcc303b2e00e0a61bfa29f7afb650669ff037a125e5496a33afb9572f3e` |

## Integration requests and honest limits

1. Coordinator still owns real gateway/route/session composition and the explicit **unpublished `PlanPreview` presentation adapter**. This pass creates no fake client publication version, publication time or entitlement to claim preview integration.
2. Current `actualUse` is still a Start-only tuple with a known date. Real stop/pause/different-use events, an explicitly unknown Start date and latest published review conclusion need coordinated W1 projections and persisted reporting. Extend those typed projections with actual date-or-unknown, recording attribution, publication basis and review linkage, then add connected suppression/history tests. This pass invents none of those events, dates or successful reports. Showing an earlier Start is not a current-use confirmation.
3. `onRecordUse`, self-purchase, export/update/history and enclosing navigation remain composition callbacks, not completed reports, orders, files, sent communications or connected journeys. All five Maya guide stages and source/asset production packaging remain coordinator acceptance work; preserving source assets in an intercepted harness does not connect packaging.
4. No shared W0 change is needed for F8. W1's backend findings remain separately open until their own fix/re-review is accepted. These local UI tests cannot close Auth/RLS/outbox/publication gates.
5. No Docker, PostgreSQL, Auth/private credentials, hosted resources, real clients/messages/money/orders, push, PR, merge or deployment was used. Independent re-review must be a new task carrying the original report and this response. Exact-head CI, connected ordinary-client acceptance, representative-human understanding and release authorization remain outstanding.
