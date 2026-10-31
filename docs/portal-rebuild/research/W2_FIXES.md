# W2 advisor F1-F3 corrections

30 October 2026. Bounded implementation response to [the independent advisor review](W7_ADVISOR_REVIEW.md). Author verification passes in the stated source/controller/intercepted-browser scope. **Fresh independent review and connected acceptance remain required.** The separate backend round-three result is not advisor acceptance.

## identity, authority and write-set

- Workspace: `/Users/kanuj/.t3/worktrees/shelv/t3-9bd6d4a4`; branch `t3/fix-advisor-f1-f3`.
- Exact clean starting base: `5fe41666747fe918eccee46c68f29d1968495562`. The delivery commit contains this report and the six owned source/test/helper files below; its exact SHA is returned to the coordinator.
- Both fresh live `orchestrator_capabilities({})` and `t3_thread_configuration({})` returned `codex`, `gpt-6.1-sol`, `reasoningEffort=xhigh`, `serviceTier=default`, `runtimeMode=full-access`, `interactionMode=default`. No model fallback or nested agent.
- Task identity: `portal-rebuild-w2-advisor-fixes-20261030-r1`. The thread binding independently reports this workspace/branch and parent `d632030a-18f7-4dec-a2c9-f5c0418c3fd5`.
- Every Node/npm invocation selects `/Users/kanuj/.nvm/versions/node/v22.23.0/bin` first in PATH; live Node is `v22.23.0`, installed Chrome `156.0.8078.79`. Portal dependencies were installed with the existing lockfile using `npm ci --ignore-scripts --no-audit --no-fund` (130 packages). Formatting used ephemeral pinned `prettier@3.6.2`; no package, lockfile or config changed.
- Initial `git diff a432b1a HEAD --` the advisor source/tests/helpers was empty. The original `930dab9..a432b1a` source is therefore the same reviewed starting implementation. `origin/main` locally resolves to `d39a7d4`; no new fetch or remote freshness claim.

Owned changes only:

```text
apps/portal/src/features/advisor/controller.ts
apps/portal/src/features/advisor/AdvisorWorkspace.tsx
apps/portal/src/features/advisor/fields.tsx
apps/portal/tests/rebuild-advisor-races.test.mjs
apps/portal/tests/rebuild-advisor-browser.test.mjs
apps/portal/tests/rebuild/advisor-browser-entry.tsx
docs/portal-rebuild/research/W2_FIXES.md
```

Root contracts, current read schemas, SQL, gateway/session, shared UI, navigation, app/main composition, packages, status and `CONTEXT_SYNC.md` remain coordinator-owned. No export signature changed. W0 can use the existing advisor exports and the W3 unpublished preview seam from `79bf0a0`; no publication/version/access metadata is fabricated here.

## review response and task-first correction

Read the full W7 report, [original W2 delivery](W2_VERTICAL_ADVISOR.md), applicable AGENTS, D01-D48, full approved desktop specification, implementation contracts, plan/advisor-read API freezes, ownership/status and acceptance matrix. Applied Resume, systematic debugging, receiving review, TDD, repository UX/design, React and verification guidance. Rebuild requirements take precedence over the local UX skill's older plain-JavaScript description. No visual redesign or new business rule was necessary.

| Priority / advisor task | Verified root cause / before | Correction / after | Regression evidence |
| --- | --- | --- | --- |
| P2 F1: know whether this exact saved revision may publish | Concurrent same-target context reads lacked ordering. An older success restored approval/coverage; older errors could clear a newer context or alter a changed view. | Monotonic context generation plus session/view epoch, exact target, view identity and operation generation gate both success and error. Accepting a write invalidates older authority reads. A current context failure clears authority while preserving an in-flight mutation's busy state. | 21 new F1 pure cases cover approval/coverage restrictions, unavailable or policy/source-validation rejection, malformed payment/approval, both completion orders, stale 401/403/409/503 errors, draft/session/target/review-view changes and a current failure during save. |
| P2 F2: recover an uncertain acknowledgement without losing newer work | Status A could accept a receipt or apply an error after retry A resolved and save B started. It could clear B's UUID/payload and release busy. | Each execution has an operation generation. Status recovery additionally captures its pending object and recovery generation. Results/errors apply only to that operation; retries retain their exact original command. Payment recovery uses the same operation/pending fence. | Seven new F2 pure cases cover old committed/absent/malformed status and 401/403/409/503 errors, exact A retry, B's pending command and manual text, refused switching, B's 503 and exact successful B retry; an eighth releases stale A error while retry A itself is busy. |
| P2 F3: read authorized complete instructions/evidence while view-only or published | Native disabled fieldset disabled every disclosure trigger while its body was hidden. | Advisor mutation context disables only editing controls. All read disclosures retain shared Buttons and keyboard behavior. Fields, choices, schedule toggles, add/remove and other mutation buttons still use the same shared components, with explicit disabling. | View-only and published browser cases open product guidance/evidence, consultation conclusions, decision explanation/how guide, complete routine guide and supplied source locations using Tab/Shift+Tab/Enter at 1440, 390 and 320px. Native and Radix editing controls stay disabled; direct save/assign/review/approve/publish/payment attempts send zero writes and preserve content. |

The relevant task sequence is unchanged: choose a free editor section, open the supporting disclosure, read complete supplied guidance, then return or select another section. Disclosure buttons remain focusable and reflect `aria-expanded`/`aria-controls`; mutation permissions are unchanged. No new explanatory copy, route, source request, raw-source capability, UI kit or authority field was introduced. Source-location tests show only an explicitly supplied synthetic authorized projection, not proof of server source ACLs. Policy/source rejection tests inject transport-level validation failures; they do not claim SQL policy/source validation acceptance.

## red before green

Before production edits, added and ran the first 28 meaningful pure cases: **7 passed / 21 failed / 0 skipped**. F1 contributed 14 failures, F2 seven. The seven controls were already correct, including stable view-only/published mutation denial. Both new browser cases then failed **`false !== true`** at the real disabled disclosure trigger. An initial browser fixture setup tried to attach a location to an absent fact; that setup error was corrected before the accepted two-case red run.

After these red observations, implemented the controller and component corrections. Two supplementary F1 cases (malformed old approval and current refresh error during save) were also checked against an esbuild-loaded copy of the exact base controller: **0 passed / 2 failed**, then both passed on current source. That historical probe overrides only the bundled controller input and never rewrites current production source. Original logs and captured base remain in ignored evidence.

Verified the supplied original `reproduce.mjs` SHA-256 `cfa1454a192c3e4d34532b2e9f9ffc01b265b9be92750377237f1a3dee6531bc` and `ssr.tsx` SHA-256 `c41386b8dba4ce2573b32e9cf1897afac49fef19803159b7eed6d86166ee7208`; read both. The SSR script asserts disabled/hidden markup, so it is a historical defect detector, not an intended-behavior green test.

The original F2 script also has a final incorrect assertion: after awaiting a successful B retry, it expects B still pending. Its observations on fixed source instead show B retained and busy after old A, two exact B attempts, preserved manual text and final saved/null pending. An attempted negative-name filter still ran this case: **11 passed / 1 failed**, solely at that final null-versus-pending expectation. A positive-name selection then ran original F1a/F1b and all nine controls: **11/11 pass**. The checked-in replacement assertions independently require B's UUID/payload before retry and saved/null pending only after its valid acknowledgement. No production behavior was changed to satisfy the defective assertion.

## executed verification

Commands ran from `apps/portal` with the explicit Node 22 PATH unless labeled root. Counts overlap and are not additive across reruns.

| Command / scope | Actual result |
| --- | --- |
| `node --experimental-strip-types --test --test-concurrency=1 tests/rebuild-advisor-controller.test.mjs tests/rebuild-advisor-races.test.mjs tests/rebuild-advisor-browser.test.mjs` | **60 passed / 0 failed / 0 skipped**: 17 existing pure, 30 new pure, 11 existing browser, two new browser. |
| Final screenshot/format-only browser rerun with `--test-name-pattern='F3:' tests/rebuild-advisor-browser.test.mjs` | **2/2 pass**, each exercising 1440/390/320px and keyboard, visible retained text, disabled mutations, unchanged local content, zero writes/overflow/unexpected traffic/console/page errors. |
| Root copied original reviewer harness with `--test-name-pattern='F1a:|F1b:|control:'` | **11/11 pass** against this checkout. The separately documented defective F2 final assertion is excluded by positive selection. |
| `npm run typecheck:rebuild` | Exit 0, original strict and noUncheckedIndexedAccess configuration unchanged. |
| `npm run typecheck:session` | Exit 0. No session source changed. |
| `npm run build:rebuild` | Exit 0, including the rebuild semantic color guard. Builds the existing foundation entry, not final advisor application composition; browser harness independently bundles the actual advisor feature. |
| `npm run build` | Exit 0, 136 assets and retained client/advisor/walkthrough gateway routes. ZIP SHA-256 `04b03a3711f858d48cce10d6a89ce1219f10b3fdfd3d5f4565678b9ba86d8a2f`; vault `a4cad1c429cee06b257b66c4b42e902467928b3669d5ccdccf8483f4f8b3c9ed`. Existing missing `expo/tsconfig.base` warnings remain. |
| `npm run check:ui` | Exit 0, 11 retained stylesheets; no CSS changed. |
| Final owned diff, report links/scope and `git diff --check` | Pass; only the seven owned paths above. |

The 11 existing browser cases retain geometry, incomplete authoring, all decision kinds, stable product/slot IDs, authored schedules, explicit assignment/review, uncertain/conflict recovery, manual field retention, private preview, frozen legacy quote adoption and payment-before-publication behavior. Original reviewer controls additionally exercise rich-data preservation, unknown/later coverage, denied mutation, wrong-ID/session/import races and preview invalidation. These are fixture/controller facts, not server transaction or product acceptance claims.

Evidence directory: `/Users/kanuj/.t3/worktrees/shelv/t3-9bd6d4a4/.local-artifacts/portal-rebuild/w2-fixes/`. It contains `pure-red.log`, `browser-red.log`, `supplemental-red.log`, `pure-green.log`, `focused-final.log`, `browser-final-f3.log`, `reviewer-controls.log`, `reviewer-positive-controls.log`, strict type/build/UI logs and historical probe inputs. Browser images are in the existing `.local-artifacts/portal-rebuild/w2/` directory, including `F3-view-only-guidance-1440.png` and `F3-published-guidance-1440.png`. Inspected the actual expanded guidance image: complete instructions/caution/evidence are visible with unchanged shared styles and disabled mutation controls. This is not a whole-screen Figma pixel match or human comprehension sign-off.

## resource release and remaining acceptance

Called `preview_status` first, opened one blank owned preview, then closed it and verified no tab remained. The explicitly allocated repository browser harness used serial headless Chrome, concurrency one, blocked service workers and deny-by-default interception on `https://shelv-advisor.invalid`; only in-memory local assets were served. Every test context/browser closed. Final `preview_status` reports no tab; no owned Chrome/test process remains. The parent was explicitly notified that the Chrome allocation is **released**, with no handles returned.

No PostgreSQL/Docker/Auth stack, credential, hosted system, real client/source, permission grant, email, money or order operation was used. No other worktree changed. No push, PR, merge, deployment or client action. Current root read schemas, legacy adoption and source/public authority boundaries are preserved.

Not run in this bounded fix task: full portal/session/runtime/root suites, Expo web/iOS exports, DB reset/pgTAP/RLS, actual cookie/Auth/PostgREST/Edge/browser journey, delivery infrastructure, final W0 app/candidate composition, exhaustive accessibility/zoom/reduced-motion or exact-head CI. Those remain coordinator/independent-review acceptance work. Source/browser fixture green does not authorize final acceptance. Re-review all three fixes independently, including the complete owned diff and the corrected F2 expectations, before integration acceptance.
