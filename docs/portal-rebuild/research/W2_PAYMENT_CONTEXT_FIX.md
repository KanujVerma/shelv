# W2 payment-context lifecycle correction

31 October 2026 UTC. Bounded implementation response to W6's genuine browser blocker, recorded in Git object `8c7c8c185d0e55b93aabf5f756f26be081ce1205:docs/portal-rebuild/research/W6_GENUINE_BROWSER.md`. **The owned selection/receipt-intent correction passes the checks below. One reproduced global-notice issue needs a separate controller-owner correction. Fresh independent review and W6's unchanged genuine journey remain required.** This is not whole-application or portal acceptance.

## identity and scope

- Workspace `/Users/kanuj/.t3/worktrees/shelv/t3-69ad392d`, branch `t3/advisor-payment-context-race`; exact clean starting base **`6c9d081b201bd0b73f87cc1b83ef8a340c8c80a9`**, as requested. Fresh `git fetch origin` succeeded; `origin/main=d39a7d4943209080df7c4cf97d85784f462758bf`, initial `HEAD...origin/main=85 0`.
- Before implementation, **both** live `orchestrator_capabilities({})` and `t3_thread_configuration({})` independently returned **codex / gpt-6.1-sol / reasoningEffort=xhigh / serviceTier=default**, full-access/default interaction. Task suffix `portal-rebuild-w2-payment-context-fix-20261030-r1`. No nested agent or model fallback.
- All Node/npm commands explicitly select `/Users/kanuj/.nvm/versions/node/v22.23.0/bin` first in PATH. Existing-lockfile `npm ci --ignore-scripts --no-audit --no-fund` installed130 packages. Cached Prettier3.6.2 formatted only the owned source/test. No package, lockfile or configuration change.
- Only three tracked paths are authored: `apps/portal/src/features/advisor/AdvisorWorkspace.tsx` within `PaymentVerification` and its new private `paymentVerificationContext` helper; `apps/portal/tests/rebuild-advisor-payment-context.test.mjs`; this report. No existing test, fixture, app port, controller, callback, shared UI, navigation, session, gateway, root contract/mapper, SQL, package, status or `CONTEXT_SYNC.md` is changed. All exports and all three existing preview opener IDs are unchanged. No production test hook is added.

Applied Resume, receiving review, systematic debugging, TDD, verification, repository `shelv-ux-review`/`shelv-design-polish`, and React guidance. Read the full rebuild goal, approved desktop specification/decisions, implementation/plan/advisor-read contracts, applicable AGENTS, workstream/status/acceptance records, [W2 app integration fix](W2_APP_INTEGRATION_FIX.md), [W0 app composition](W0_APP_COMPOSITION.md), [W2 follow-ups](W2_FOLLOWUP_FIXES.md), [W7 app R2](W7_APP_FIXES_R2.md), and the original F1/F2/F3 and R3 reviews/responses. Inspected actual workspace/controller/model/types, application session/ports, canonical payment v1/v2 builders/mappers and the public W6 report at8c7c8c1. W6's private fixture, credentials, database and runtime custody were never accessed or adopted.

## reproduced cause and owned correction

W6's report describes an actual current `advisor_read`200 returning one eligible claim after verification opened on an older empty context. The component initialized `claimId` once from that empty list, so it remained empty; the only selector requires multiple claims. The same component also kept gross amount and receipt-check state after replacing the selected claim's quote/version/recipient.

The component now reconciles its selection against the current unchanged eligibility filter. Zero claims remains empty; a late single or multiple list selects the first eligible claim; a still-eligible deliberate choice survives ordering/unrelated-list refreshes. Removing the choice reconciles to the remaining eligible claim. No claim/quote is invented and no payment confirms automatically.

Manual receipt state carries its controller and exact semantic basis: authenticated actor, exact draft target/state, client, first/later gate, service status, selected claim, frozen quote/version/amounts/address, and selected v2 option/recipient version/details. A changed, missing or ineligible basis clears amount/check state synchronously during React render, before committing a replacement form. Closing/reopening unmounts that state. Current permission, view, dirty-work, operation, session and comparison boundaries also invalidate the intent or deny confirmation. The event handler rechecks the actual current controller snapshot before calling its unchanged command.

The aggregate payment revision is deliberately excluded from receipt meaning. An unchanged exact basis preserves manual work while the unchanged controller constructs the command with the **current financial CAS**. No old command is silently changed or retried as another request. Pending/retry/recovery state and backend transaction guards remain unchanged. The completion callback additionally checks the exact active target/client before leaving verification.

Legacy contract-v1 quotes still arrive through the actual schema-v2 read with `contractVersion:1`, empty options and null claim option, then use the legacy confirmation command. Genuine v2 quotes retain exact selected option/recipient semantics and `receiptVerified:true`. Recipient availability for **new claims** is not receipt identity: the canonical v2 SQL deliberately requires availability only for `submit_claim`, so an existing claim's unchanged frozen recipient remains confirmable when new-claim availability changes. Tests preserve this distinction. No new eligibility or commercial rule is added.

## task-first UX

| Priority | Advisor goal / observed issue | Smallest correction | Regression and evidence |
| --- | --- | --- | --- |
| P2 | Open verification during an ordinary refresh; one real eligible claim arrives but no form appears | Reconcile current eligible selection without waiting before open, reopening or forcing context | Actual rendered workspace/controller through cookie/factory/transport/app ports and finite canonical HTTP DTOs; original-source red and current green |
| P2 | Verify the exact claim once; changing quote/recipient keeps the old amount and receipt check | Bind receipt input to the exact basis and recheck it at the command boundary | Claim/quote/version/status/recipient/option/client/draft changes, removal/reappearance, permission/session/source/operation denial, current CAS and same-basis preservation |

No layout, copy, routes, labels, controls, CSS/token system or source/private projection changes. Existing full-text/read-only, source disclosures, generic-read generations, exact retries and lawful gate refresh fixes are retained. Keyboard receipt verification is exercised at1440/390/320; this is bounded synthetic behavior, not human comprehension or exhaustive accessibility acceptance.

## TDD and executed checks

Ignored evidence root: `.local-artifacts/portal-rebuild/w2-payment-context/`. All tests use `--test-concurrency=1`; only one installed headless Chrome is live at a time. Counts overlap across commands and are not additive portal-acceptance totals.

| Command / artifact | Actual result and scope |
| --- | --- |
| New initial matrix before production code; `red-valid.log` | **2 pass /12 fail /0 skip**, including both late sole-claim failures and stale frozen-basis input; one multi-choice harness error is explicitly excluded from product findings |
| Extended preproduction matrix; `red-final.log` | **6 pass /18 fail /0 skip**. Includes the same product failures; two choice timing errors and expected403 browser-console teardown are harness errors, not product findings |
| Corrected keyboard-choice preproduction probe; `multiple-red-corrected.log` | **1 pass /1 fail**: order-preservation control passes; actual selection changes but old gross amount survives, confirming intended reset failure |
| Exact final test bodies against input-only `git show 6c9d081:.../AdvisorWorkspace.tsx`; `historical-red.log` | **1 pass /2 fail /0 skip**. Both legacy/v2 late-sole-claim cases fail only at missing receipt form **after actual mapped context positively contains that exact claim**; unchanged-basis finance refresh passes. Current production files never replaced |
| New file plus unchanged advisor13/follow-up11/app11 browser files; `browser-final.log` | **63 pass /0 fail /0 skip /0 cancelled**,94.46s: new28 plus existing35; includes original F1/F2/F3/R3 and default app gate/preview/history/publication controls |
| Final formatted new payment-context file; `context-exact-source.log` | **28 pass /0 fail /0 skip /0 cancelled**,17.89s; no behavior/source change follows this run |
| Actual source/SSR/build/session/transport/advisor groups, including unchanged217 advisor and34 app-integration cases; `source-final.log` | **329 pass /0 fail /0 skip /0 cancelled**,4.98s |
| Same full329 command after formatting; `source-exact-source.log` | **329 pass /0 fail /0 skip /0 cancelled**,4.14s |
| `npm run typecheck:rebuild`, `npm run typecheck:session`, `npm run check:ui` | Exit0, original strict/noUncheckedIndexedAccess flags; UI guard11 retained stylesheets. Frontend type check repeated after formatting |
| `npm run build:application`; `build.log` | Exit0, isolated actual application candidate, gateway excluded. A final clean-head build is recorded separately in the delivery receipt |
| Independent extra scope probe; `notice-probe.log` | **0 pass /1 fail**, reproduced global stale-notice issue below; not an owned-fix acceptance pass |

Reproduction commands from `apps/portal`, each with the explicit Node22 PATH above:

```sh
node --experimental-strip-types --test --test-concurrency=1 \
  tests/rebuild-advisor-payment-context.test.mjs \
  tests/rebuild-advisor-browser.test.mjs \
  tests/rebuild-advisor-followup-browser.test.mjs \
  tests/rebuild-app-browser.test.mjs
node --experimental-strip-types --test --test-concurrency=1 \
  tests/rebuild-advisor-controller.test.mjs tests/rebuild-advisor-races.test.mjs \
  tests/rebuild-advisor-followup.test.mjs tests/rebuild-advisor-app-integration.test.mjs \
  tests/rebuild-app-ports.test.mjs tests/rebuild-app-session.test.mjs \
  tests/rebuild-app-state.test.mjs tests/rebuild-app-render.test.mjs \
  tests/rebuild-app-build.test.mjs tests/rebuild-foundation-transport.test.mjs \
  tests/rebuild-foundation-navigation.test.mjs tests/rebuild-foundation-notices.test.mjs \
  tests/rebuild-app-callback.test.mjs tests/rebuild-app-continuation.test.mjs \
  tests/rebuild-app-preview-context.test.mjs tests/rebuild-app-start.test.mjs
npm run typecheck:rebuild
npm run typecheck:session
npm run check:ui
npm run build:application
```

The test-only entry is generated in memory by the new file and renders the actual `AdvisorWorkspace`, React hooks/shared wrappers and real controller. It creates actual `createApplicationSession`/CookieAdvisor, unchanged cookie factories/strict transport, `createAdvisorPorts`, root payment/plan mappers and current canonical DTOs. Only finite HTTP results/delivery are synthetic. The race opens on old empty context while payment read is held, releases it only **after opening**, asserts actual mapped exact claim arrival, then checks visible client/frozen method/recipient/amount information, blank manual controls, explicit manual entry/receipt choice and the actual one confirmation request UUID/client/claim/quote/version/option/address/money/CAS. No successful component or port stub, second open, forced context or pre-open wait for the new claim is used.

Additional cases cover zero/one/multiple claims, deliberate choice/back-choice, selected removal and zero/reappearance, quote replacement/version/status, claim replacement/status, recipient/option change, service-state transition, same-basis financial revisions, reordered/unrelated lists, v2 new-claim availability compatibility, Back/reopen, payment permission/source403/later gate, client/draft switches, real cookie sign-out and same-owner CSRF restore, pending operation and same-tick stale visible confirmation. No confirmation without explicit manual work or automatic publication/Start/notification/order is emitted.

Initial setup errors are preserved: log redirection first targeted a missing ignored directory; the first14 tests omitted the normal initial publication-check refresh, so no context existed and none reached the defect. Those are not product reds. Multi-choice pointer positioning and then immediate keyboard timing were corrected to real focus/Space, observable opened option and Enter. Only exact expected HTTP403 console messages are accepted for the injected denial; unexpected traffic and other warning/error/page errors remain failures. The existing root typeless-package warning remains unchanged.

## exact cross-owner request: global stale notice

**Owner: advisor controller, outside this task's claimed UI function.** The workspace renders `s.notice` above `PaymentVerification` at its payment branch; the controller exclusively authors that state. A current gate403 creates nonpending `notice:{kind:'denied',title:'action unavailable'}`. A later successful current gate/payment refresh with a replacement eligible claim resets the owned manual controls, but `refreshContext()` emits only context, so the old global notice remains. The independent actual-rendered/cookie/app-port `notice-probe.mjs` asserts no old notice and fails **1 !== 0**. No funds or confirmation command is sent by that probe.

**Minimal requested correction:** in the controller's current successful context-read path, clear or explicitly scope a superseded **nonpending** context/payment failure notice to its original basis. Preserve current denial, real conflict/comparison requirements, uncertain pending-command notices and exact retry/status recovery. Add the retained probe as an intended-behavior regression and independently review the change. Alternatively allocate the workspace-level notice composition explicitly if notice scope is managed there. This worker does not mutate controller state through session memory, issue unrelated reads to clear notices, hide status with CSS/DOM changes, or broaden the owned write-set.

The original W6 claim-arrival blocker and manual-intent transfer are corrected in the owned UI; the broader requirement that unrelated cases inherit no old global error remains **open** until that bounded owner correction. Author greens must not waive it.

## resources and limits

The parent explicitly granted sole serial intercepted Chrome after W6 released all Chrome/Miniflare handles. Called `preview_status` first: no tab. Used the specifically authorized repository installed-Chrome workflow, finite `.invalid` APIs/local bundled assets, blocked service workers/background networking/DNS and deny-by-default unexpected network. No standalone HTTP server, PG/Docker/Auth/native Edge stack, credential, W6 fixture or hosted connection is started/read/adopted. These fake-boundary tests are **not genuine Auth/Vault/SQL proof**.

All Chrome contexts/processes and test sessions close through teardown. `release.json` records explicit release **2026-10-31T03:51:09.719748+00:00**, no preview tab, `automationChromeProcesses:[]` and no ongoing owned handles. The parent was notified immediately; no browser/DOM calls follow release. An initial executable filter included unrelated Electron crash handlers; the corrected inventory matches Chrome/Chromium application paths and touches no unrelated process.

Directly inspected `late-v2-receipt-form-1440.png` after release. The actual form and frozen recipient text render, but the new minimal test shell omits the sidebar and its desktop grid leaves a narrow content column. Its pointer-choice attempts therefore encountered the adjacent notice; actual keyboard choice works. **This screenshot establishes no desktop layout/legibility or responsive visual pass.** The new matrix proves state/keyboard/command behavior, and its320/390 checks are viewport/overflow controls only. A future visual check should correct that test-only scaffold first. The unchanged actual-app11 browser tests separately exercise the full production shell. No production layout changed here.

Not run/accepted: unrelated full portal/root/Expo suites, DB reset/pgTAP/RLS, genuine gateway/Vault/Auth/native Payment/Plans/SQL journey, actual bank receipt/funds, hosted behavior, complete source/notification/remaining-page work, exact-head CI, human comprehension, exhaustive screen-reader/zoom/reduced motion or production release. The user's bounded request explicitly excludes those heavier checks/fixtures. No push, PR, merge, deployment, real client/source/permission write, message, payment, order, Start or publication action. Parent owns canonical status/CONTEXT_SYNC, the small cross-owner notice request, fresh independent review and W6's genuine unchanged-timing continuation.
