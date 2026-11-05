# W2 first advisor vertical slice

30 October 2026. Implementation sub-agent, no child agents. This delivers reviewable advisor components and their controller for coordinator composition. It does not establish connected RootAuth/PostgREST acceptance, a completed portal, independent review, exact-head CI or production readiness.

## goal and verified workspace

Implement the bounded A00/A01/A02/A04/A04P/A05/A06 advisor path against the existing root plan protocol: independent plan directory, incomplete unassigned draft, structured editing, explicit assignment, exact human section reviews, strict compare/apply import, private preview callback, human approval, applicable payment and deliberate publication with a committed receipt.

- Workspace: `/Users/kanuj/.t3/worktrees/shelv/t3-dfd42730`.
- Branch: `t3/advisor-connected-slice`.
- Exact clean starting base: `930dab999326796b880af67af26dafa270ae4aab`.
- `git fetch origin` succeeded; `origin/main` was `d39a7d4943209080df7c4cf97d85784f462758bf`. Initial `HEAD...origin/main` was `28 0`. No rebase, other-worktree edit, push, PR, merge or deployment occurred.
- Core checkpoint: `b2a70a3a2175d99335a10f7ff5addbd7d807d1d0`.
- Editor checkpoint: `74fb6b26eb9d93616333a49b2ec8c12961e37865`.
- Final implementation head: `825716dfcdbcdc424be7d902f50c14da9a3d8f01`. The subsequent delivery commit changes this report only; its exact hash is returned in the completion receipt.
- Fresh live `orchestrator_capabilities({search:'gpt-6.1-sol'})` and `t3_thread_configuration({})` both returned `providerInstanceId/instanceId=codex`, `model=gpt-6.1-sol`, `reasoningEffort=xhigh`, `serviceTier=default`, `runtimeMode=full-access`, `interactionMode=default`. The catalog advertised that exact model and option. No fallback or delegation was used.
- Returned thread identifier: `thread:delegated-task:command%3Amcp%3A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%3Adelegate-task%3Aportal-rebuild-w2-vertical-advisor-20261030-r1`.
- Every Node/npm command selected `/Users/kanuj/.nvm/versions/node/v22.23.0/bin` explicitly in PATH; live Node was `v22.23.0`. Chrome was `156.0.8078.79`.
- Portal `npm ci --ignore-scripts --no-audit --no-fund` installed the existing lockfile, 130 packages. No manifest, lockfile, dependency version or configuration was changed. Pinned ephemeral `prettier@3.6.2` formatted only owned source/tests; it was not added to the project.

## owned changes and decisions

Only these paths changed:

```text
apps/portal/src/features/advisor/AdvisorWorkspace.tsx
apps/portal/src/features/advisor/advisor.css
apps/portal/src/features/advisor/controller.ts
apps/portal/src/features/advisor/fields.tsx
apps/portal/src/features/advisor/index.ts
apps/portal/src/features/advisor/model.ts
apps/portal/src/features/advisor/types.ts
apps/portal/tests/rebuild-advisor-browser.test.mjs
apps/portal/tests/rebuild-advisor-controller.test.mjs
apps/portal/tests/rebuild/advisor-browser-entry.tsx
apps/portal/tests/rebuild/advisor-fixture.mjs
docs/portal-rebuild/research/W2_VERTICAL_ADVISOR.md
```

No shared ui, shell, navigation, transport, root entry, build/package/lockfile, other feature, backend, migration or shared status document was edited. W7 review and W0 fixes were preserved. The coordinator owns `CONTEXT_SYNC.md`, canonical status and final composition.

The implementation uses the exact root `PlanCommand`, `PlanContent`, `DraftView`, `ExactTarget`, `Approval`, `PublishReceipt`, `PlanPreview`, `PlanDirectory`, parser and `mapPlanResult`. It does not introduce another plan model, draft revision convention, command endpoint or publication format. All displayed controls compose `ui/` wrappers, Lucide and existing semantic tokens. Feature disclosures also use shared Buttons. Authored interface copy is lowercase; actual identities and source text are preserved.

| Decisions and approved frame | Implemented first-slice behavior |
| --- | --- |
| D02-D07, A00 `503:449`, A01 `500:299` | Separate real client-directory and plan-directory ports, local search, unassigned filter, actual draft/publication rows and deliberately created unassigned drafts. No fake client or Auth creation. |
| D14-D18, A02 `500:383` | Freely selectable sources/client context/decisions/routine/follow-up/review-publish; persistent review checklist; repeated structured goals, products, facts, decisions, routine steps, schedules and follow-up criteria. |
| D17-D18, D26 | All eight decision kinds; stable distinct content IDs and explicit routine-slot linkage; multiple same-category products; unknown versus none; no product/no purchase and nonproduct steps; selected days, conditions, as-needed and comfort-contingent introduction stages anchored to actual Start. |
| D16, D20 | Incomplete safe storage through the root parser; acknowledgement-only saved state; session-memory restoration; exact request retries/status lookup; base/latest/proposed plus unsaved-manual comparison; strict rejection of unsupported import fields; stale and concurrent-manual protection. |
| D15, D21-D24, A04 `500:592`, A05 `500:686` | Server section hashes and exact reviews, semantic issues, target consistency, explicit authenticated human approval and publisher identity, applicable payment/coverage gates, deliberate publication. No filled-field readiness or name-derived owner permission. |
| D21-D22, D29, A04P `503:672` | Existing v1/v2 manual payment confirmation, exact frozen quote/claim/option and aggregate revision, human gross-amount/recipient/transaction confirmation outside the portal. Payment does not publish or alter the draft target. |
| D33-D34, A06 `500:779` | Display the exact committed `PublishReceipt` separately from editable content. Show neutral queued notification truth from its durable event, with no delivered/read claim. |
| D40, D42 | Session-bound private work, abort/invalidation, late-result rejection, positive client-safe preview response, and the exact typed preview callback for the same coordinator-composed renderer. No alternate preview renderer. |

All 99 retained acquisition records were rechecked against byte counts and SHA-256 values: 99 valid, zero mismatches. This preserves all 26 native frame contexts/PNGs and assets. No fresh Figma context tool or Figma write was used. Native PNGs are comparison references, never runtime UI assets.

## exported coordinator seams

Entrypoint: `apps/portal/src/features/advisor/index.ts`.

```ts
createAdvisorController({
  session,
  permissions,
  ports: {plans, clients, context, paymentRead, payments},
  onPreview: (preview: PlanPreview, draft: DraftView) => { /* coordinator */ },
});

<AdvisorWorkspace
  controller={controller}
  navigation={{route, navigate}}
  onOpenClient={optionalClientNavigation}
/>
```

`AdvisorWorkspace` supplies feature bodies only. Coordinator supplies the actual advisor shell, route/history provider and shared overlay provider. Guard cross-draft navigation with the controller dirty/pending state so a refused switch retains the current draft route and work. `AdvisorRoute` is the exact advisor-clients/advisor-plans/advisor-editor subset of the existing `PortalRoute`; no path parser or history schema is forked. `onOpenClient` is optional; absent composition omits that action. Templates, walkthroughs, admission and workspace policy controls are not fake links.

`AdvisorControllerOptions` and `AdvisorPorts` expose:

- `session: PlanSessionBoundary`, the existing W3-compatible captured owner/session boundary with `key`, `isCurrent`, invalidation subscription and memory get/set/delete. Retain it across feature navigation, wire retained session changes to invalidation, dispose the controller/transport and replace the boundary on owner or session replacement. No browser persistent storage, sensitive URL or history state is used.
- Explicit `AdvisorPermissions`: authenticated `actorId` plus `view/edit/assign/review/approve/publish/confirmPayments`. These are supplied capabilities, never inferred from Kanuj/Sami names or a model-authored approval field. SQL remains authoritative.
- `plans: OperationPort<AdvisorCommand, PlanResult>`. `AdvisorCommand` is a closed root union subset for list/read/create/save/assign/compare/apply/validate/preview/review/approve/publish/request-status. Responses are checked again with root `mapPlanResult`; successful writes must also match their exact target/content/assignment semantics.
- `clients: OperationPort<{action:'advisor_list'}, ConciergeAdvisorDirectory>`. Select only an existing active directory entry; deliberate confirmation displays its name and exact client ID before `assign_draft_v1`.
- `paymentRead: OperationPort<{schemaVersion:2;action:'advisor_read';clientId:string}, AdvisorPayments>`. The existing v2 payment read projection can carry v1 or v2 quote contracts. Confirmation selects the actual quote contract, preserving legacy semantics rather than inventing a payment-option ID.
- Optional `payments: OperationPort<ConfirmPaymentCommand, PaymentReceipt | versioned receipt>`. This is the existing exact manual `confirm_payment` shape: quote/claim/version/address, service/product/total amounts, expected payment revision, request ID and the applicable human receipt flag; v2 also binds the frozen payment option. No bank/provider operation is called. Its response is validated with the existing matching payment mapper before acknowledgement.
- `context: OperationPort<{clientId,draftId,target:ExactTarget}, AdvisorGateAuthority>`. This is an explicit composition projection, **not a newly invented server command**. It supplies actual client identity, `Approval|null`, `publication:'first'|'later'|'unknown'`, and `coverage:'active'|'inactive'|'unknown'`. The controller combines it with decoded payment reads. Unknown or mismatched context blocks publication.

The coordinator must wire actual retained cookie/gateway/session factories and strict decoders to these ports. No feature port accepts a URL, RPC name, credential or caller-selected actor authority. Do not provide a synthetic controller or a fabricated authority projection in connected composition.

### preview contract

`onPreview(preview: PlanPreview, draft: DraftView)` receives the exact strictly mapped server response, including `mode:'advisor-preview'`, `published:false`, safe content, target and issues. It is called only for the still-current saved draft without newer local edits. It does not create a `ClientPlanView`, publication version/time, entitlement, actual-use state or next-review date.

The coordinator owns the explicit unpublished presentation adapter for `features/plan/ClientPlan`, its enclosing preview navigation and return lifecycle. Do not manufacture published metadata merely to satisfy the current renderer type. No second plan preview page is included here.

### authority/read limits requiring composition

`read_draft_v1` returns the draft/target/reviews/issues, but not existing approvals or a complete authority/payment/coverage aggregate. Supply `AdvisorGateAuthority` from real authorized evidence. An acknowledged `approve_publication_v1` result is retained in the active controller context. Subsequent context refresh, including payment verification, must return the still-current actual approval if valid; returning null correctly clears the gate. Never recover an old approval by inference from content, a name or an arbitrary model field. A restart without retrievable approval stays blocked until authoritative recovery or a new permitted approval.

The directory has publication identities/times, but no canonical advisor-published document read. Publication rows therefore have no fabricated open/history action. Their content is not reconstructed from mutable draft state. Likewise directory draft rows have no title/readiness fields: labels use their actual plan identity rather than inventing a title or approval status. A later authoritative read/enrichment seam is required for those behaviors.

## saving, comparison and privacy behavior

Manual editing starts immediately in structured modules; JSON is only a fallback. Existing rich guide/evidence/comparison/source metadata survives unrelated edits. Structured forms edit practical directions, cautions, evidence limits, guides, comparisons and public citations. Some retained metadata, including private source-location attachment and reference-price metadata, is not given a new independent command or fake operation.

The debounce waits 900 ms and never changes saving to saved on a timer. Acknowledged server content/revision is required. Edits during a pending save remain separate and unsaved after that earlier acknowledgement. A remount during a write becomes uncertain. Exact retries reuse the original request and payload, including payment confirmations. An absent request-status response is not treated as proof of permanent noncommit.

Known 409 conflicts and stale comparisons set a separate durable session-memory comparison requirement. Changing the comparison base preserves manual content and requires another explicit diff/apply; it cannot trigger an autosave over the newer draft. Imports cannot overwrite separate unsaved manual work. Unsupported/code fields fail the existing strict parser. Source text is rendered as plain content and never interpreted as instructions.

Private unsent work and pending IDs are held only in the supplied current-session memory. They survive feature/controller remount when that memory remains live. Saved work can be reread from the server. Before unload warns about unsent/uncertain work; forced full-page teardown cannot preserve unsent data without prohibited persistent browser storage. Logout/owner/session replacement aborts operations, clears feature memory and private form/import content, and prevents late success/error application. Parent composition must actually deliver invalidation and replace the boundary.

## task-first UX and rendering evidence

Applied the repository `shelv-ux-review` method and the Superpowers TDD, systematic debugging, verification and handoff workflows. Approved implementation decisions were already supplied; no design competition, business-policy change or new UI kit was introduced.

| Step | Immediate advisor goal | Available action and resulting state | Feedback/recovery |
| --- | --- | --- | --- |
| plans | start without inventing a client | new plan creates unassigned care draft | real server acknowledgement; uncertain request retained |
| editor | work in any section | persistent section buttons, repeated fixed forms | saving/saved/error/uncertain; manual content retained |
| assignment | identify actual recipient | choose active existing client, confirm exact identity | no Auth/admission call; denied/conflict remains visible |
| import | reconcile a proposal | compare base/latest/proposed/manual, deliberately apply | stale and unsupported input refuse; another diff required after rebase |
| review | verify human responsibility | exact server section hash review, private preview callback | changed sections need review; no field-count approval |
| publication | understand each gate | exact approval, outside-portal payment confirmation, deliberate publish | payment alone never publishes; receipt and queued notification separate |

| Priority | Persona / observed issue | Smallest correction and regression | Evidence |
| --- | --- | --- | --- |
| P1 | Advisor could replace unsaved manual content by applying a separate compared import | Block apply while separate unsaved manual content differs; show that content in comparison | Controller regression failed `1 !== 0`, then passed |
| P1 | Advisor changing the stale comparison base could trigger a blind autosave | Persistent comparison requirement independent of notice text; new diff/apply required | Regression failed `1 !== 0`, then passed |
| P1 | An interrupted remount retained `saving` indefinitely | Restore pending operation as uncertain, preserving request identity | Regression failed `saving` versus `uncertain`, then passed |
| P1 | Late preview after a manual edit could open superseded advice | Check the current draft identity and unsaved state before callback | Regression failed callback count, then passed |
| P1 | Finite wire shape alone allowed internally mismatched draft/target clients | Add target/identity consistency checks before accepting draft responses | Wrong-client regression failed, then passed |
| P1 | Legacy quote in a v2 read could send invented v2 confirmation semantics | Select confirmation by actual quote contract | Regression failed `true !== false`, then passed |
| P1 | An uncertain payment had status recovery but no exact retry | Reuse the original confirmation command, never a new ID or publish | Regression failed `1 !== 2`, then passed |
| P2 | New product guide had null product binding and would be omitted by the shared client product view | Bind the new guide to its actual owning product; retain existing guide IDs | Browser regression failed null versus product ID, then passed |
| P2 | Optional payment port was absent but its verification action was visible | Omit the action unless its port is connected | Browser regression failed `1 !== 0`, then passed |
| P2 | Empty editor grid stretched its upper rows | Keep the approved fixed column origins with normal flow and an end-aligned footer | Geometry failed y=362 versus 228, then passed |

At 1440x960 the editor form starts `(456,228)` with width `584`, and the publication panel starts `(264,209)` with width `736`. These are asserted in the actual rendered component. Native columns, fonts, tokens, checklist, control styling and gate composition were visually inspected against retained PNGs. The repeated functional modules and real recovery/authority controls require dynamic vertical flow; this is not a whole-image pixel-match claim for every staged native field or final shell.

Editor and publication checks were exercised at 1440, 1280, 390 and 320 CSS pixels. Tests assert no document horizontal overflow and actually edit/select/review/assign/import/verify/publish, including keyboard Enter/Escape and dialog focus return. Long/empty fields, all decision kinds, same-category products, authored schedules, manual recovery and private preview are exercised. No screenshot-only acceptance or human usability/a11y sign-off is claimed.

## executed verification

Commands below ran from `apps/portal` with the explicit Node PATH above unless the row says root. Sanitized evidence is retained in this worktree at `.local-artifacts/portal-rebuild/w2/`.

| Command / scope | Actual result |
| --- | --- |
| `node --experimental-strip-types --test --test-concurrency=1 tests/rebuild-advisor*.test.mjs` on committed implementation head | **28/28 pass**, zero failures/skips: 17 controller and 11 rendered browser cases. |
| Broader `node --experimental-strip-types --test --test-concurrency=1 tests/*.test.mjs` before final focused hardening | **428 pass, 1 fail, 429 total**, no skips. Failure is the unchanged W3 C01 focus-restoration case described below. This is not an all-green portal claim. |
| Isolated `--test-name-pattern='C01 geometry' tests/rebuild-plan-browser.test.mjs` | **Reproduces failure**, 0 pass/1 fail, same focus wait; no W3/foundation source changed. |
| `npm run typecheck:rebuild` with strict `noUncheckedIndexedAccess` unchanged | **Blocked**, five diagnostics in unchanged dependencies; no advisor-source diagnostic. Exact locations below. No flags were disabled and no alternative passing type gate is substituted. |
| `npm run build:rebuild` | Pass, including semantic-color scan of new feature CSS. The production entry is still coordinator-owned; this command builds the isolated foundation preview. The browser harness separately bundles the complete advisor feature. |
| `npm run check:ui` | Pass for the retained 11 stylesheets. New feature CSS is also checked by `build:rebuild`. |
| `npm run build` | Pass, 134 assets; retained gateway route families. Three existing missing `expo/tsconfig.base` warnings because root Expo dependencies are absent. ZIP SHA-256 `80da94340bab72d21683eef6443df4ad917cf3c8cb8d2e6e35905d0e7134ae32`, vault `8eee97a0179d63768a05b9b50565eed9d6a3b381d955ddc91a6f5b5e0b553da2`. This does not compose advisor pages into production. |
| Root `npm test` | Blocked on missing root `zustand` dependency after initial passing test output. No root installation or root source change was performed. |
| Root app `apps/portal/node_modules/.bin/tsc --noEmit` | Blocked by missing root React/Expo/native dependencies/base config. |
| Root test `apps/portal/node_modules/.bin/tsc -p tsconfig.tests.json --noEmit` | Blocked by missing root node/react-native type dependencies. |
| Acquisition bytes/hashes, final owned diff and `git diff --check` | 99/99 acquisition records valid; only owned paths changed; whitespace checks pass. |

Strict dependency diagnostics are `src/contracts/PortalRebuildMapping.ts:16` (two unsafe indexed-shape diagnostics) and `supabase/functions/concierge-payments/contract.ts:71-72` (three unsafe indexed-address-field diagnostics). These became reachable through the required root mapper/payment imports. They need the coordinator/shared-contract owner to correct the type evidence, without weakening strict configuration. The previously fixed shared files were not reverted or rewritten.

The reproducible broader-suite failure is `apps/portal/tests/rebuild-plan-browser.test.mjs:17:1400`: after CeraVe use reporting and Escape, `page.waitForFunction` waits five seconds for `document.activeElement?.id === 'plan-product-cerave-pm'` and times out. Owner: W3/W0/coordinator, with W7 foundation re-review active. This report records the cross-feature defect; it does not silently fix another write-set or call it a transient success.

T3 preview status and an owned blank preview tab were checked first; that tab was closed. The explicitly requested repository esbuild/Playwright workflow then used one sequential headless Chrome process per test file, test concurrency 1, blocked service workers and deny-by-default network interception on a synthetic `.invalid` origin. Passing advisor contexts recorded no unexpected network requests or page/console errors. The initial HTTP fixture lacked secure-context `crypto.randomUUID`; its origin was corrected to intercepted HTTPS before accepting results. Early missing entrypoints/import-path errors and two wrong-directory command invocations were harness setup failures, not successful application checks.

No Docker, Colima, DB/Auth stack, private credential, hosted lifecycle, actual bank/payment provider, real client/source, order, fulfillment, email or other communication operation was used. All fixtures and browser harnesses are explicitly `SYNTHETIC / DO NOT FULFILL`.

### artifacts

Absolute evidence directory: `/Users/kanuj/.t3/worktrees/shelv/t3-dfd42730/.local-artifacts/portal-rebuild/w2/`.

- `focused-tests.log`, `all-portal-tests.log`, `w3-focus-repro.log`, `strict-types.log`, `build.log`, `build-rebuild.log`, `ui-check.log`, and root test/type logs.
- `A00-1440.png`, `A01-1440.png`, `A02-context-1440.png`, `A02-decisions-{1440,1280,390,320}.png`.
- `A04-blocked-1440.png`, `A04P-payment-1440.png`, `A05-ready-1440.png`, `A06-receipt-1440.png`, `gate-{1440,1280,390,320}.png`.
- `verification.json` inventories hashes, byte counts and PNG dimensions with the implementation head/runtime. Evidence is ignored local output, not a published artifact.

## in progress, at risk and next step

The W2 owned implementation is committed. The coordinator must first resolve the five shared strict diagnostics and the reproducible W3 focus failure, then compose the exact exported ports and unpublished renderer seam and run the real isolated first vertical slice. Do not duplicate active W7/W0 review work. Independent Sol/xhigh review of the full W2 base-to-delivery range is required.

Still unverified/parent-owned: actual cookie/gateway/RootAuth/PostgREST roundtrip, canonical reset/pgTAP/RLS/least-privilege checks, full green integrated root/portal/session suites, Expo web/native validation, exact-head CI, final shell/history/back composition, shared unpublished presentation adapter, comprehensive zoom/screen-reader/reduced-motion and human comprehension acceptance. No backend or mobile code was changed by W2.

Later server/API scope remains source upload/private retrieval/retention, canonical advisor-published document reads, complete approval recovery/read projection, notification delivery/inbox/retry, permission policy/grant management, admission, templates/checkpoints/historical-restore UI and full secondary portal flows. Unimplemented controls are omitted. The current receipt supports queued notification truth only; A06 delivery-failed/retry behavior must wait for an actual scoped delivery read/command, rather than republishing or fabricating delivery failure.

Open composition questions are concrete API gaps above, not requests to invent business policy. No new founder permission or customer-side business rule is proposed. The branch/worktree and ignored synthetic evidence should be retained for integration/review; no push/PR/merge/deploy is authorized or performed.
