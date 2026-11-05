# W3 first client-plan slice

30 October 2026. Implementation sub-agent, no nested agents. This is an isolated first-slice implementation for coordinator composition and independent review. It is not the completed portal, connected Auth/persistence acceptance, or a deployment.

## workspace and runtime evidence

- Workspace: `/Users/kanuj/.t3/worktrees/shelv/t3-bf4b30f8`.
- Branch: `t3/client-plan-vertical-slice`.
- Starting head: `ec231df2e10671428ef7d98bbe80b6efedc1aa60`; initially clean. `git fetch origin` succeeded; current `origin/main` was `d39a7d4943209080df7c4cf97d85784f462758bf`. No rebase or changes to other worktrees.
- Both live `orchestrator_capabilities({search:'gpt-6.1-sol'})` and `t3_thread_configuration({})` returned provider/instance `codex`, model `gpt-6.1-sol`, `reasoningEffort=xhigh`, `serviceTier=default`, `runtimeMode=full-access`. The capabilities catalog advertised that exact model and the `xhigh` option. Project `.codex/config.toml` also pins Sol/xhigh.
- Returned thread: `thread:delegated-task:command%3Amcp%3A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%3Adelegate-task%3Aportal-rebuild-w3-vertical-client-20261030-r1`.
- Node: `/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node`, `v22.23.0`. Every npm/node command used that explicit PATH. Portal `npm ci --ignore-scripts` installed the existing lockfile: 130 packages, three existing audit advisories (two moderate, one high). No dependency manifest or lock change.

## owned deliverable and design trace

Only `apps/portal/src/features/plan/**`, `apps/portal/tests/rebuild-plan*.test.mjs`, local synthetic `apps/portal/tests/rebuild/plan-*`, and this report are changed. No app entry, router, shell, ui, transport, packages, shared status docs, backend, migration, auth, existing site or private walkthrough changes.

The Figma design-to-code skill was read before implementation. Inputs are the retained high-fidelity contexts and PNGs for C01 `498:85`, C01E `503:926`, C02 `498:212`, C02D `499:766`, C03 `499:151`, C03D `503:1083`, and the shared W0 exports/assets. The implementation composes the existing `ui/` controls, Lucide, semantic tokens, shell header/panels, navigation and overlay lifecycle. No screenshot is a runtime asset and no new Figma design was generated.

Public fixture provenance is only `apps/portal/site/advisor/maya-sample.js`, adapted through `adaptLegacyPlan` and `projectClientPlan`. Its complete treatment guide, public studies, comparisons and original directions are retained; compact source-derived summaries follow the approved review density. The source is plain data, never execution instructions. Staged later events, improvement, payments and the Figma check-in date are not imported. `nextReviewOn:null` truthfully renders `not scheduled`. Product imagery is data-bound; the intercepted test harness supplies the exact retained CeraVe/azelaic PNGs. Other missing imagery uses one neutral Lucide fallback.

| Decisions / frames | Implementation and actual local coverage |
| --- | --- |
| D04-D07 / C01-C03 | Shared wrappers, lowercase authored copy, preserved proper/source identities, native column/panel origins and contextual sheet; responsive/browser checks. |
| D08-D11 / C01, C01E | Real morning water rinse, moisturizer, sunscreen, optional makeup; conditional one-remover evening, cleanser and moisturizer; paused/left-out reasons visible; no approval-triggered Start. |
| D17-D18, D26-D27 / C02 | All eight decision kinds, nonproduct/no-purchase variants, stable same-category IDs, unknown/long/empty content; authored conditions/days/stages, no time-based escalation. |
| D10-D11 / C03, C03D | Selected product binds evidence and use-report callback. CeraVe never uses the azelaic guide/studies or the Hydro Boost how-to. Unknown IDs recover to semantic parent. |
| D11 / C02D | Full patch test, dry/intact skin, eye/lip/broken-skin avoidance, comfort-contingent schedule, toner/new-active avoidance, irritation response and formulation-specific evidence limitations. Public sources use normal safe links. |
| D09, D16, D27, D30 | Exact typed decision command and stable request ID; authoritative refresh; loading/403/409/uncertain503; exact retry across navigation. No payment/order/actual-use command. |
| D38, D40, D42 | Preparation excludes draft advice; read-only/historical/preview deny writes; session invalidation removes private content and rejects late application; public demo requires separate memory ports. |

## coordinator exports and ports

Entrypoint: `apps/portal/src/features/plan/index.ts` exports `ClientPlan` plus `ClientPlanProps`, `ClientPlanPorts`, `DemoPlanPorts`, `PlanSessionBoundary`, `DecisionCommand`, `ReadPlanCommand` (and the scoped navigation types described below).

Mount `ClientPlan` within the existing shared navigation, overlay and shell providers. Pass the strictly decoded `ClientPlanView`, presentation `mode` and a captured owner/session boundary. The renderer does not fetch, select an identity, create auth, construct an RPC URL or infer access from a route.

`ClientPlanPorts` has exactly:

```ts
read: OperationPort<Extract<PlanCommand,{action:'read_client_plan_v1'}>,ClientPlanView>;
decision: OperationPort<Extract<PlanCommand,{action:'record_decision_v1'}>,void>;
```

The coordinator maps the actual W1 receipt to a resolved acknowledgement, retaining strict response decoding before this boundary. Resolution alone is not displayed as saved: the renderer rereads the authoritative view and confirms the same publication/decision/choice/reason. A refresh failure or mismatched result remains uncertain and retains the original command. No request-status absence is interpreted as permanent noncommit; the implementation only offers exact retry.

A new command contains `schemaVersion:1`, publication version, decision ID, expected decision revision, UUID request ID, choice and `reason:null`. The pending command lives only in the supplied owner/session-bound memory; uncertain retries reuse every byte of that command. Known 409 rejection refreshes but requires explicit review before another choice. Errors never display raw server data. No optimistic current-use change occurs.

`onViewChange` is needed to enable decisions. Live decision ports are used only in active `client` mode. `public-demo` must receive a separately marked `DemoPlanPorts` (`mode:'public-demo'`), tested with a memory reducer while a live port is also present but remains unused. Preview/private-walkthrough/historical/read-only modes have no decision write path.

`PlanSessionBoundary` contains `key`, captured `isCurrent`, `subscribeInvalidation`, and structural `memory.get/set/delete` compatible with the existing session transport. The coordinator must wire retained session `onState` to `transport.sessionChanged`, capture the original owner/generation in `isCurrent`, clear private views on invalidation, and dispose/recreate transport and navigator on session replacement. A changed key remounts feature state; late callbacks also check mount/current-mode/session. No localStorage, sessionStorage, sensitive URL fields or sensitive history state is added.

Optional `onRecordUse(productId)`, `onSelfPurchase(productId,decisionId)`, `onExport`, `onSendUpdate`, and `onHistory` are composition/navigation callbacks. Missing callbacks omit the control. These are not fake saved-use events, orders, downloads, sent updates or completed pages. Keep use reporting separate from advice; the first slice does not author Start/pause/stop APIs.

## validation and open dependencies

Executed results and artifact inventory are recorded below. Browser tests use one intercepted Chrome process at a time, sequential tests, blocked service workers, synthetic `.invalid` origin and deny-by-default network interception. T3 preview status was checked first and reported no attached tab; the explicitly requested repository esbuild/Playwright workflow supplies the required interception. No database stack or hosted service was started.

The normal rebuild typecheck currently fails with 11 diagnostics entirely in unchanged shared source imported by the pinned types: `ConciergePresentationValidation.ts:34`, `ConciergeService.ts:34`, and `PortalRebuildValidation.ts:17,20,24,26`. These are strict `noUncheckedIndexedAccess` shape-index issues. They require W1/coordinator correction, not a fork or a relaxed committed tsconfig. A diagnostic-only run with that option disabled passed; it is not the required strict gate and does not resolve the blocker.

Known W0 R1-R4 fixes are outside this write-set. The starting head contains the reviewed defects. Later Git objects `52a93fb` and W0 report `f0f56e8` exist, but are not integrated into this branch. The coordinator must integrate/review those changes and rerun offline503, direct-sheet focus fallback and Forward-scroll paths. Existing shared tests passing alone do not certify those previously uncovered paths. This feature neither fixes nor masks their failures.

`ClientPlanView.actualUse` currently exposes Start tuples only. It cannot represent a newly reported pause/stop/using-differently state or a latest published review conclusion. The renderer supports the authored paused/left-out decisions and explicit Start projection available in the seam; live stop-report suppression and latest-review presentation need W1's future typed projection. No permissive extra content field was added. Initial read loading/denied screens remain coordinator-owned composition around the supplied view.

Remaining scope: actual gateway/cookie/strict-response composition, real isolated Auth/persistence/authorization/decision roundtrip, post-fix navigation checks, complete use reporting, history/check-ins/orders/account, guide stages/full Maya tour, production bundling/asset mapping, independent Sol/xhigh review, human comprehension, exact-head CI and release acceptance. No hosted client, source, credential, email, money, order, push, PR, merge or deployment action occurred.

### enclosing navigation seam

`PlanRoute` is an exact feature subset of W0's existing `PortalRoute`, not a parallel URL/schema. Optional `PlanNavigationPort` supplies `{route,navigate,back}` for enclosing advisor preview and public Maya composition. Without it, all feature actions use `NavigationProvider`/shared route parsing/history. With it, the same renderer delegates those actions while the coordinator owns mapping to the approved enclosing URL/history; the existing shared Back button is retained. A rendered regression first failed because preview product selection changed the outer URL to `/plan/products/cerave-pm`; the feature adapter now keeps the enclosing route when supplied. This test proves delegation, not a completed Maya URL/tour or advisor preview history implementation.

### red / green evidence

- Initial rendered routine scaffold: the `source-faithful` browser test failed waiting for the actual routine heading (after the fixture and interception setup were corrected). The shared renderer then made it pass.
- Native geometry assertion first found the test measuring the inner 704px content instead of the panel. The marker moved to the panel wrapper; the asserted native panel origin/width is `(264,196,744)` and sheet bounds are `(904,72,536,888)` at 1440x960.
- `an unstarted proposal authored as a routine step never claims to be current in its sheet` failed `true !== false`, then passed after product context used the same actual-routine projection.
- The enclosing-navigation rendered regression failed with actual `/plan/products/cerave-pm` instead of retained `/plan`, then passed through the typed feature navigation adapter. An initially missed row callsite was caught by the same test and corrected.
- `a published pause is never reinserted by an earlier actual Start tuple` failed `true !== false`, then passed after the Start projection stopped reinserting paused/left-out decisions.
- An uncertain-write journey initially attempted another choice while the conflict review was intentionally pending. Its test was corrected to explicitly review the latest plan, matching the required behavior; no conflict gate was weakened.
- Two harness mistakes are excluded from product findings: the first commands wrote intended files under an extra `apps/portal` prefix while already in that directory; these newly created files were moved to the exact owned paths and the empty extra directories removed. Interception initially passed esbuild Uint8Array directly to Playwright instead of Buffer, and the source fixture initially used noncanonical image paths. Both were corrected before accepting rendered results.

### executed verification

The table uses completed command output, with dependency failures retained rather than reclassified as feature success.

| Command / scope | Result |
| --- | --- |
| Portal lockfile `npm ci --ignore-scripts` | Pass; no tracked dependency changes. Existing three audit advisories remain. |
| Focused `node --experimental-strip-types --test --test-concurrency=1 tests/rebuild-plan*.test.mjs` | Latest completed focused round before final verification: 14/14 pass; later navigation/strict-mode/reflow/pause cases are included in the final all-portal run. |
| Portal `node --experimental-strip-types --test --test-concurrency=1 tests/*.test.mjs` | A first full run caught the new enclosing-navigation regression: 380 pass, 1 fail. A subsequent full run passed 383/383; final post-simplification run is recorded in the completion receipt below. |
| `npm run build:rebuild` | Pass; scans new feature CSS through the semantic color guard. This retains the foundation-only build entry; the rendered test harness separately bundles the actual feature. |
| `npm run check:ui` | Pass for the retained 11 stylesheets. The rebuild script separately scans all new feature CSS. |
| `npm run build` | Pass, 132 assets, unchanged retained gateway route families. Three absent root Expo-config warnings. ZIP `307472c8b6836ae5858d625cd6b0e36748cf8f8b32054967af38b862b2062875`; vault `12ccdf38776e434a5e53233cf3806d755e8cf50a1cd028e8989fe5dd73b99126`. This does not compose the new feature into production. |
| `npm run typecheck:session` | Pass, zero diagnostics. |
| Normal `npm run typecheck:rebuild` | **Blocked**: 11 unchanged root/shared shape-index diagnostics, listed above; no feature-source diagnostic. |
| Standalone strict root-contract repro, with `--ignoreConfig --strict --noUncheckedIndexedAccess` on `src/contracts/PortalRebuild.ts` | Same 11 diagnostics without any feature files, confirming the dependency origin. |
| Diagnostic-only rebuild tsc with `--noUncheckedIndexedAccess false` | Pass. No setting change committed; not an acceptance substitute. |
| Root `npm test` | **Blocked** after initial tests: absent root `zustand` dependency. No root installation performed. |
| Root app tsc using the installed portal compiler | **Blocked**: root Expo/React/native dependencies and `expo/tsconfig.base` absent. |
| Root `npm run typecheck:tests`; direct portal-compiler retry | **Blocked**: no root `tsc`; direct retry confirms absent node/react-native type definitions and Expo config. |
| `EXPO_NO_TELEMETRY=1 npx --no-install expo export -p web` | **Blocked**: Expo absent; npx refused the missing package with `--no-install`. No downloaded Expo or root package changes. |
| SQL reset/pgTAP, real local Auth, native iOS, hosted flow, exact-head CI | Not run by W3. No backend/native implementation changes; coordinator owns DB/Auth/CI acceptance. |

All artifacts are local and ignored at `.local-artifacts/portal-rebuild/w3/`. Screenshots: `C01-1440.png`, `C01E-1440.png`, `C02-1440.png`, `C03-1440.png`, `evidence-{1280,390,320}.png`, `routine-{1280,390,320}.png`, `recommendation-{1280,390,320}.png`, and `long-unknown-320.png`. Logs retain root test/type/Expo blockers, both full portal passes/regression, and the standalone contract repro. The screenshots were visually inspected against retained native frames, including mobile evidence; target columns/sheet and the actual product-photo identities match. Source-length reflow and the truthfully unscheduled check-in differ from the staged static frame, so no bit-identical pixel claim is made. The long guidance remains scrollable and complete.

### completion receipt

Final feature/application source and tests were included in `portal-suite-final-owned.log`: **383/383 passed, zero failures, zero skips**, exit 0, 188.312 seconds. This includes **17 W3 tests**: 12 rendered Chrome groups and 5 pure projection/link regressions. The rendered harness uses React StrictMode and records zero page/console errors or unexpected network requests. It covers the final approved-only choice controls, scoped enclosing navigation, explicit demo reducer and the pause-after-Start regression. Earlier logs are historical red/green evidence, not the final result.

Final strict rebuild typecheck still has the 11 reproduced root dependency diagnostics. Rebuild preview/color guard, retained portal build, session types and final whitespace/scope checks passed as documented. Root/native/backend/connected acceptance remains blocked or unrun as listed; no relaxed configuration was committed.

The final source diff is confined to the 12 listed owned files (7 feature files, 2 W3 test files, 2 synthetic test helpers, this report). No new source, UI or service architecture decision supersedes the approved contracts. The coordinator's next step is to integrate/review W0 fixes and W1's strict frontend type boundary, wire retained-cookie read/decision adapters plus scoped preview/Maya navigation to these exports, then run the real isolated vertical slice and independent review before continuing the remaining pages.

The implementation/report commit is the head returned in the task handoff. No push, PR, merge or deployment.
