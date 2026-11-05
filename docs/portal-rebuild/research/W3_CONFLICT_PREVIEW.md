# W3 conflict follow-up and unpublished preview

30 October 2026. Bounded implementation, independent review required. No nested agents.

## Verified starting state and execution plan

Workspace `/Users/kanuj/.t3/worktrees/shelv/t3-79857c61`, branch `t3/fix-review-conflict-preview`, clean source base `fb853a31e39adcdea738db327a30b1e03c5f79d2`. Its parent is `610e6b9`; the W7 R2 report bytes match `71c18a57d35839ed59f160c43a55419cd8a18f6e`, whose other ancestry is different. First live capabilities and thread configuration both returned `codex / gpt-6.1-sol / reasoningEffort=xhigh / serviceTier=default`. No nested agents. Fresh fetch: `origin/main=d39a7d4943209080df7c4cf97d85784f462758bf`.

Approved parent read-only Back seam `07f63c937c78ee35ef17687e239b2de17d0b2082` alone was cherry-picked as `429383d`. No unrelated parent work was copied. Source/test/report write scope remains the assigned plan feature and tests plus this report.

- [x] Persist intended-behavior browser regressions and observe both navigation failures before fixes.
- [x] Bind every conflict acknowledgement to successful current authoritative read plus deliberate review of the same publication, decision revision, view, mode and session. Preserve rejected choice and exact uncertain retry. Verify and commit F5 separately.
- [x] Consume read-only Back destination for Q2 without shared history writes.
- [x] Add finite unpublished adapter and a discriminated shared renderer model, with no fake publication/use/service fields. Verify unassigned/assigned/invalid and session/operation boundaries.
- [x] Run serial Chrome regressions, strict types, UI/build and available required checks; inspect diff, record limits and commit.

## Preview composition seam (specified before implementation)

```ts
export interface PlanPreviewSource {
  draftId: DraftView['draft']['id'];
  contentRevision: DraftView['draft']['contentRevision'];
  assignmentRevision: DraftView['draft']['assignmentRevision'];
  target: DraftView['target'];
}
export interface UnpublishedPlanPreviewProps {
  preview: PlanPreview;
  source: PlanPreviewSource;
  session: PlanSessionBoundary;
  navigation: PlanNavigationPort;
}
```

`PlanPreview` is imported from root `PortalRebuildMapping.ts`. W2 invokes `onPreview(preview, draftView)`; the coordinator derives these four source metadata fields from `draftView.draft` and `draftView.target`. The adapter never receives or renders `draftView.draft.content`. Null target remains null. The enclosing navigation port owns the advisor preview URL, product/evidence/routine selection and Back. No live ports or business callbacks are accepted.

## Task and necessary-copy review

| Priority | Persona / goal | Observed issue | Consequence | Bounded correction / regression | Evidence |
| --- | --- | --- | --- | --- | --- |
| P2 F5 | client recovering a rejected choice | plan acknowledgement directly idles conflict without successful refresh | old/unseen content can unlock fresh stale-version intent | successful fetched basis plus same-basis deliberate review on every route; failed/pending/navigation/unmount/revision cases | W7 R2 and reproduced persisted tests below |
| P3 Q2 | client returning from evidence | label always says product while predecessor may be recommendation | label mispredicts actual destination | read-only shared Back destination; generic back only when enclosing destination is unknown | inspected shared navigator and R2 |
| approved slice | advisor inspecting unpublished content | only published DTO renderer exists | inventing version/date/use would misstate draft lifecycle | explicit unpublished discriminant using identical content modules, no live actions | approved D14/D24/D42 and root PlanPreview |

F5 recovery labels distinguish read failure, retry and deliberate review. Preview copy identifies not published, clocks not started and unavailable actual-use/date/choice state. Source names and authored guidance remain unchanged. No redesign or claim of measured human comprehension.

## F5 implementation and early commit receipt

The old ledger retained rejection but no fetched basis. Plan-level acknowledgement directly set idle, while recommendation review compared only version. The corrected session-memory intent retains an optional review basis: exact fetched view reference, publication version, decision revision, presentation mode, session boundary and renderer scope/epoch. A root boundary persists across feature routes and increments on every enclosing view/mode change. Even leaving and returning to the exact original object cannot restore a spent epoch. Full renderer remount needs a new read.

Every route uses the same basis checks. An automatic 409 read can supply reviewable content but never clears the conflict. Deliberate review rechecks current authority with a read and clears only if the displayed fetched version/revision remains current; a different version or decision revision is displayed and requires another deliberate review. Failed/pending/unmounted reads cannot supply a basis. Plan recovery offers **retry latest plan**; acknowledgement is disabled until the successful fetched basis is displayed. Read failures say **latest plan unavailable**. Attempted choice survives navigation/removal; rejected commands are discarded, never replayed. Uncertain commands still retry every original byte.

Persisted regressions: `apps/portal/tests/rebuild-plan-conflict.test.mjs`, using real rendered events and the existing strict intercepted synthetic harness. The first seven new groups ran **0 pass / 7 fail** before implementation (`red.log`), including both actual independent navigation assertions (`false !== true`). Intermediate `f5-green-1.log` was **37/39**, with one purposeful removed-decision wording mismatch and one incorrect test wait for a preview notice absent on routine pages. Corrected production wording qualifies displayed versus successfully fetched latest plan; the test waits for actual shell mode. `f5-green-2.log` then passed **39/39** including all original32. Two extra protective cases cover recommendation same-version changed revision and old uncertain exact retry after publication replacement; `f5-final.log` passed **9/9** new groups. Combined coverage is41 distinct cases, not48 added counts.

Before this separate F5 commit, normal strict `npm run typecheck:rebuild`, `npm run build:rebuild` and `git diff --check` passed. Every Node/npm command used `PATH=/Users/kanuj/.nvm/versions/node/v22.23.0/bin:$PATH`. No SQL/Auth/network service was used. F1-F4/F6-F8/Q1 source behavior and all32 original regressions remain passing. This is a UI recovery fix, not server authorization or full-portal acceptance. Final independent review is still required.

## Q2 response

`PlanNavigationPort` adds only optional `backDestination?():PlanRoute|null`. Evidence reads it from either the approved shared navigator or its enclosing port. A recommendation predecessor says **back to recommendation**; an actual product destination (including direct semantic-parent fallback) says **back to product**. Missing/null/unclassified destinations say **back**. The label never depends on product kind, evidence variant or client identity. No feature code reads raw history state, initializes history for this lookup or writes shared routing/history. The original32-case enclosing-port stub exposes no destination and its Back actually resets to the plan; its old product-label expectation now requires the truthful generic label. Actual product and recommendation destinations remain independently asserted.

## Unpublished adapter and shared-renderer response

The exact props above are exported from `features/plan/index.ts` together with `UnpublishedPlanPreview`. Coordinator integration derives the metadata, for example:

```ts
onPreview(preview, draftView) {
  const source: PlanPreviewSource = {
    draftId: draftView.draft.id,
    contentRevision: draftView.draft.contentRevision,
    assignmentRevision: draftView.draft.assignmentRevision,
    target: draftView.target,
  };
  // Mount with the captured session and enclosing PlanNavigationPort.
  // Retain /advisor/plans/:draftId/preview in the enclosing navigator.
}
```

The adapter destructures only preview/source/session/navigation; extra runtime ports, demo ports, mode/kind overrides and business callbacks do not cross it. It validates finite source keys with the root command parser, finite client-safe `PlanPreview` with the actual root `mapPlanResult`, and the source target through the root validation-result shape. It separately matches all target identity/revision/hash fields and binds target draft/content/assignment revisions to source metadata. Duplicate/dangling client-safe identities and guide references reject without displaying raw errors or inputs. No private draft, raw source locators, arbitrary HTML, private provenance facts or invented UUID is reconstructed. Validation issues display section and readable code, excluding source paths.

Root `PlanPreview` does not echo draft/revision identity for a null target. The adapter validates the metadata values and exact null target, but cannot independently prove which unassigned request produced that content. W2's captured request/session/current-draft checks remain necessary upstream. No stronger provenance claim is made.

A frontend `kind:'unpublished'` view contains only client-safe content. The exact same `PlanRenderer`, `Routine`, `RoutineRow`, `Recommendation`, `ProductDetails`, `Evidence`, directions, source/comparison modules, shared controls and existing stylesheet render both branches. Type narrowing is required before reading publication/choice/use/schedule fields or using a live callback. No fabricated `ClientPlanView`, publication version/time/document envelope, entitlement, decision revision, use list or review date is created. Product status explicitly uses an unavailable-use variant; draft routine is identified as draft. Proposals retain full selected guidance and never acquire a made-up actual Start.

The preview clearly says **unpublished preview**, **not published**, and that this preview has not started service/review clocks. This wording does not assert that an existing client's earlier service clock never started. Actual use, choices, service/notification dates and next-review dates are unavailable in preview. Source-authored directions/schedules remain intact. All write/report/self-purchase/export/update/history actions are omitted. Invalidating the captured session synchronously removes the preview, including any sheet; later inputs still show session changed. The adapter never reads, clears, rewrites or consumes the client intent ledger.

All navigation is delegated to the supplied enclosing port; the component itself calls no Auth/API and creates no route/history grammar. Browser tests use a local in-memory enclosing port to prove retained URL, evening selection, recommendation/product Back and real opener restoration. This is the adapter contract and shared-renderer proof, not completed `AdvisorWorkspace`/app-root/gateway composition.

## Per-finding retention and React review

F5 is the new correction above; Q2 is the bounded Back-copy response. [The original eight findings and Q1](W7_CLIENT_REVIEW.md), [all full original responses](W3_FIXES.md), [the original W3 report](W3_VERTICAL_CLIENT.md), and [R2's exact remaining objection](W7_CLIENT_R2.md) remain unchanged. All original32 tests pass after both changes, including F1-F4/F6-F8/Q1, exact uncertain retry, all seven Maya cards, prior Start versus advice, no sales controls for pauses, native geometry and genuine opener focus. Current UI access projections and source data are not retroactively altered.

React review: hooks remain unconditional per component; session subscriptions use the existing external-store lifecycle; captured view/mode epochs and mount/session fences guard async results; the unpublished union excludes live callbacks and state fields; keys preserve existing product opener refs across feature depths; all controls remain shared wrappers with visible accessible names. No dependency/CSS/UI-system/auth/router/schema/migration changes are authored. The only shared change in this branch is the separately approved cherry-pick. No blanket React performance/accessibility or security-audit verdict is implied.

## Local red/green and visual evidence

Before preview implementation, six persisted browser groups ran **0/6** (`preview-red.log`), including the absent Q2 label and absent unpublished renderer. The first implemented full feature run was **46/47** (`preview-green-1.log`): the only failure was the existing enclosing stub's incorrect product label expectation, since its destination is unavailable and Back actually returns to plan. The new six groups already passed. The test expectation was corrected to generic Back under the explicit user instruction, without changing its destination or weakening focus/selection assertions. `preview-green-2.log` then passed **6/6**. Two added cases verify evening product/evidence/Back/Escape with the real opener and rejection/recovery of late mismatched target revisions. Final focused run: **49/49 pass, zero skips**, `focused-final.log`.

Native references: retained C01/C01E/C02/C02D/C03/C03D contexts and all six PNGs, no fresh Figma acquisition/version claim. Inspected actual rendered C01, unpublished CeraVe evidence at1440, and long azelaic evidence at320 against those native hierarchies. Shared origins/styles are preserved; the required unpublished status shifts content down and complete source increases height. Existing Q1 geometry assertions still pass for published views. Actual photos decode from the existing public-source local assets; missing images use the existing neutral Lucide fallback. No screenshot is used as a runtime asset. No pixel-identical, human-comprehension, whole-portal accessibility, zoom or reduced-motion acceptance is claimed.

The browser workflow was the explicitly authorized repository esbuild/Playwright-core installed Chrome harness. `preview_status` was called first (no attached tab); `preview_open` confirmed the collaborative surface exists, and the user-requested strict intercepted workflow was retained. Serial `--test-concurrency=1`; service workers/background networking blocked; synthetic `.invalid` application and finite exact public sample images served from local bytes; every other request aborted and asserted absent. Browser console/page error and unexpected-network receipts are empty on passing teardown. No PG/Docker/Auth service, credential, hosted environment or other writer fixture was used.

Ignored artifacts: `.local-artifacts/portal-rebuild/w3-conflict-preview/` holds red/intermediate/final TAP, types/build/UI/root blockers and runtime receipts; `.local-artifacts/portal-rebuild/w3/` holds the original six rendered views/reflow images plus `unpublished-product-evidence-1440.png` and `unpublished-evidence-{320,390}.png`. Compile-time assertions in `tests/rebuild/plan-preview-types.ts` reject live ports/callbacks/private draft content and a fake conversion from unpublished to published. The local extended test config retains normal strict flags, adds the existing portal type roots and CSS declarations, and changes no tracked compiler configuration.

## Final verification receipt

All commands used the explicit Node22 PATH above; installed node returned `v22.23.0`. Portal cwd unless specified. No compiler setting, dependency manifest, lockfile or legacy color budget was changed.

| Exact command / check | Actual result and boundary |
| --- | --- |
| `npm ci --ignore-scripts` | Exit0,130 packages; existing audit reports2 moderate/1 high advisories. No upgrades or audit assessment. |
| Root `node --experimental-strip-types --test --test-concurrency=1 apps/portal/tests/rebuild-plan*.test.mjs` | **49/49 pass**,0 fail/skip,32.447s,`focused-final.log`. Original32+9 F5+8 Q2/preview, including rendered Chrome cases and existing pure model/source tests. |
| Root `node --experimental-strip-types --test --test-concurrency=1 apps/portal/tests/*.test.mjs` | **468/468 pass**,0 fail/skip,237.868s,`portal-full.log`. Local suite evidence only; no connected full-portal acceptance claim. Browser files ran serially and closed before subsequent files. |
| `npm run typecheck:rebuild` | Exit0, unchanged strict config, zero diagnostics. |
| Root `apps/portal/node_modules/.bin/tsc -p .local-artifacts/portal-rebuild/w3-conflict-preview/tsconfig.preview-tests.json` | Exit0, actual compile-time forbidden-field assertions active. First temporary config attempts lacked portal type roots/CSS declaration; the corrected local config includes existing declarations and retains normal strict settings. No configuration change committed. |
| `npm run typecheck:session` | Exit0, zero diagnostics. Full retained session runtime suite not rerun because this change authors no session source. |
| `npm run build:rebuild` | Exit0; isolated foundation preview and feature CSS guard. Actual feature separately bundled/exercised in Chrome; no app-root composition claim. |
| `npm run check:ui` | Exit0,11 retained stylesheets; existing plan CSS unchanged. |
| `npm run build` | Exit0,136 assets, retained3 gateway families; existing missing root Expo-config warnings. ZIP `5392e827465396ed2dc68313060759f842fd6faca733989a2824212d79043351`, vault `f670edc09bb15e788d3cd16b9da836e6973014cf10561dd4a15b2ac6d54ecc8e`. Retained release packaging does not compose the new adapter. |
| Root `npm test` | Exit1, blocked at missing `zustand` imported by `authStore.ts`; no root suite success claimed. |
| Root `npm_config_offline=true npx --no-install tsc --noEmit` | Exit1, no installed root TypeScript; cached unrelated `tsc` warns. Direct pinned portal compiler against unchanged root config exits2 confirming missing React/Expo/native dependencies and `expo/tsconfig.base`. |
| Root `npm run typecheck:tests` | Exit127, root `tsc` absent. Direct pinned compiler exits2 for missing node/react-native types and Expo base. |
| Root `EXPO_NO_TELEMETRY=1 npm_config_offline=true npx --no-install expo export -p web` | Exit1, Expo absent; npx refuses missing package. No package downloaded or root dependency installed. |
| Native reference hashes | **12/12** exact retained context/PNG hashes match `design/ACQUISITION.json`; `native-hashes.json`. |
| Final live runtime | Both capabilities and thread configuration again report `codex/gpt-6.1-sol/xhigh`, `serviceTier=default`; `runtime.json`. |
| `git diff --check`; final diff, scope and sensitive-pattern inspection | Pass. Only allocated feature/tests/report authored, plus the authorized parent Back-seam cherry-pick. No storage/HTML execution/fetch/Auth/endpoint code introduced in feature. |

Root checks remain blocked by this checkout's absent root dependencies; installing them or changing root/package configuration is outside this bounded writer scope. No native changes, PG/Docker/reset/pgTAP/Edge/real Auth/RLS/Storage/credentials/hosted flow, production asset delivery, email/notification delivery, representative-human review, full accessibility/zoom/reduced-motion acceptance or exact-head CI was run. Those limits are not converted to passing UI evidence. No push, PR, merge, deploy, real clients/messages, money or orders.

### Artifact integrity

| Artifact under `w3-conflict-preview/` | SHA-256 |
| --- | --- |
| `red.log` | `3a69b6cef5860f447149eb39f3e8db7e2ec618e9c1fb364235c9872ad15c5b43` |
| `f5-final.log` | `883228d7ed132499546873b68b408c3c74032f6802542965489db98abca11242` |
| `preview-red.log` | `186a71502f1ecd626e022bc56a13617280a3fc7f1825b20e435544b673087ddf` |
| `focused-final.log` | `a0714db4d347f2bf421782c9810d7262ffaf4e32f8a20888499f3e50e69c28e6` |
| `portal-full.log` | `ac2bd4d96450d87292ed519a2cdd918cefd7e012656fb12ea4a13a12ddc669a4` |
| `preview-types.log` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `frontend-types.log` | `5e0ce0235c171270fc3458ee5d6ff81aebb122ba9541a84288ff4c00fc92abf4` |
| `runtime.json` | `f7b96b45f87aaf6a8400d4c531e2778b086ab5c81ca3809dd632c754f8e25df0` |

## Commit and continuation handoff

- Approved parent Back seam: original `07f63c937c78ee35ef17687e239b2de17d0b2082`, cherry-picked here as `429383d921924797fbb162ee53f4bf614423dd66`.
- **Separate F5 fix:** `aaa46fd6094fc243d28d33f73cacaff259f5cd83`. Parent was notified immediately after this commit, with exact seam and red/green evidence.
- **Separate Q2 + preview adapter:** the commit containing this final report, returned as exact final head in the handoff. Only report text changed after the final implementation checks; no feature/test source changed after the468-case suite.
- Final status is checked after commit. Coordinator owns `CURRENT_STATUS`, task ledger, `CONTEXT_SYNC`, integration and independent fresh Sol/xhigh review. This worker did not edit them or another worker's fixture.

Next coordinator action: consume these two owned commits (the Back seam is already parent-owned), wire W2's actual preview callback to the exported metadata/session/navigation interface, then commission the requested fresh independent review with the original8/Q1 responses, R2 objection and this report. The adapter cannot create an entitlement/publication or turn local component success into real Auth/backend/notification/full-portal acceptance.
