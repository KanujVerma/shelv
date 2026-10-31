# W2 advisor care dependency review and rebase

Owner: Kanuj. 31 October 2026. **Source/pure/SSR phase only. Browser and independent acceptance remain pending.** This work does not change the parent integration checkout or W6's R7 source/resources.

## identity and authority

- Clean starting parent: `b8b52f5c439ca082b8576acdf2cde6c24027981d`.
- Workspace: `/Users/kanuj/.t3/worktrees/shelv/t3-d6691f48`; branch `t3/advisor-care-dependency-rebase`. Existing T3-linked worktree; no nested checkout or agent.
- Task: `portal-rebuild-w2-care-dependencies-20261031-r1`. Live configuration identifies the matching delegated thread.
- Both live `orchestrator_capabilities` and `t3_thread_configuration` establish `codex / gpt-6.1-sol / reasoningEffort=xhigh / serviceTier=default`, full-access/default interaction. Advertised descriptors support xhigh/default. Project defaults and all eight role TOMLs pin Sol/xhigh. Ignored `runtime.json` preserves the live tools and descriptors.
- Fresh fetch succeeded: `origin/main=d39a7d4943209080df7c4cf97d85784f462758bf`; starting divergence167/0. No rebase/reset or other-worktree write.
- Every Node/npm invocation explicitly selects `/Users/kanuj/.nvm/versions/node/v22.23.0/bin`, actual `v22.23.0`. Portal-only locked offline `npm ci --ignore-scripts --no-audit --no-fund` installed130 packages. Cached Prettier formats only owned files. No package, lockfile, config or dependency change.

The approved input/D01-D48/desktop baseline, M56/M57 care contract and actual Root types/parser/mapper govern. Historical prospective status text does not disable implemented APIs or grant resources. A02 `500:383` and A05 `500:686` remain the design baseline. No design competition or new Figma write/fetch is involved. Existing advisor F1-F3/R3, natural assigned-gate capability upgrade, C1/AR1 and origin-bound notice recovery remain intact. The incorrect historical pending-after-valid-ack assertion remains rejected. A2 ordinary browser reachability remains qualified, not recertified.

## bounded implementation and exports

Owned production changes are `features/advisor/{types.ts,controller.ts,AdvisorWorkspace.tsx}`, new `dependencies.ts` and `DependencyReview.tsx`, plus the narrow `app/ports.ts` claim. New test/helper paths all start `tests/rebuild-advisor-dependencies`. This report is the only documentation write. Application/session/gateway/Root contracts/migrations/shared plan/UI/routes/packages/status/TASKS/CONTEXT_SYNC remain unchanged.

`createAdvisorPorts(runtime)` retains the legacy default. Under the existing explicit `{care:true}` factory option, the adapter adds only:

- Existing Plan `read_draft_dependencies_v1` as a read and `rebase_draft_dependencies_v1` as a write/selection. Both still use the fixed plans channel, `readPlanCommand` and `mapPlanResult` with creation-bound session fences. No second BFF, caller-selected action family or new RPC.
- Optional `ports.dependencies: OperationPort<AdvisorDependencyCommand, PlanResult>` for those two exact Plan actions.
- Optional `ports.careRead: OperationPort<AdvisorCareRead, CareResult>` restricted at runtime to existing `read_advisor_publication_v2` and `read_advisor_use_history_v1`, supplied by `createAdvisorCarePort(runtime)`. The returned canonical audit `care` port and `publication` reader retain their existing semantics.

New exported types in `types.ts`: `AdvisorDependencyCommand`, `AdvisorCareRead`, `AdvisorDependencyReview`. Existing controller options need no new mandatory fields. Controller methods are `inspectDependencies`, `loadDependencyHistory`, `acknowledgeDependencies(boolean)`, `canRebaseDependencies`, `dependencyReviewCurrent`, `retireDependencyReview`; `hasDependencies` reports explicit opt-in. `AdvisorState.dependencies` is session-bound transient review state, cleared on restoration/invalidation and never persisted in browser storage or a URL.

`dependencies.ts` exports `MissingDependencyReader` with family `report | instruction | legacy_context`, `missingDependencyReaders`, and exact-client assertions for current use/history. These describe missing content-reader dependencies, not invented wire responses.

## review, current information and recovery

Inspection captures the actual saved draft/client, content and assignment revisions, exact target, manual-content/pending objects, operation/purpose generations, actor/session/view and current authority generation. It accepts the legitimate mutation-capability upgrade from opening an assigned draft. A later restriction, context refresh, edit/import/comparison, selection/revision replacement, preview/unmount or session/owner/CSRF replacement retires the review. Old success/error cannot erase a newer pending B, manual buffer or busy state.

The safe advisor publication supplies actual clientAccess and current use. History is unfiltered within that exact assigned client and fetched in deliberate25-entry pages. Publication and every page must match the dependency view's use head. A changed head refuses review; pages never mix heads. All pages must be loaded before a rebase acknowledgement is available. Attributed original/identity/descriptor reports must belong to the selected client. No mutable draft is converted into a published view and no client entitlement is fabricated.

The panel separates reported use from published advice, preserves contradiction/unknown-date meaning, full original and corrected frequency/amount/details, acquisition/channel/recording dates, identity uncertainty, descriptor versions and client/advisor/another-advisor correction attribution. It reuses shared wrappers, existing disclosures, semantic classes and shared `useLabels`. Complete history text uses normal readable text, not clipped disabled inputs or a private JSON dump. View-only readers can inspect authorized information but cannot acknowledge a mutation or rebase. An unassigned draft shows preparation and makes no care read.

Rebase requires deliberate human acknowledgement of available current information and a separate **update draft basis** action. No save, inspection, approval, payment or timer rebases automatically. The command has exactly the accepted fields:

```ts
{schemaVersion:1, action:'rebase_draft_dependencies_v1', requestId,
 draftId, expectedContentRevision, expectedAssignmentRevision,
 expectedHeads:{useHead,reportHead,instructionHead},
 expectedLegacyBasis:{publicationVersion,useRevision},
 expectedLegacyBasisManifestHash}
```

A valid acknowledgement must return the same body/client, new content revision, unchanged assignment revision, requested legacy basis and unreviewed affected sections. It clears only its exact pending command; it supplies no current approval authority. Fresh dependency/gate reads and deliberate reviews/exact approval precede publication. The server's unaffected `sources` review may remain current; the UI displays actual section hashes/reviews rather than inventing an invalidation. Tests also exercise deliberately reviewing all five sections.

Uncertain rebase retains the original UUID, object and serialized transport bytes. Status lookup is a read: denial/unavailability/absence cannot resolve the original mutation or unlock a fresh one. Exact retry reuses its original payload. A definite CAS409 retires the inspection/acknowledgement and requires a fresh matching read plus another human review before a new UUID. An old acknowledgement/status never becomes fresh gate authority. Current read errors stay within dependency recovery and preserve editable manual text/autosave.

## honest missing information and cross-owner requests

USE/IDENTITY/REPORTED_PRODUCT changes are covered by the existing Care readers. **Changed REPORT or INSTRUCTION heads remain blocked:** this parent has no content reader for them. Likewise a changed retained manifest may conceal intake/baseline changes that cannot be established from a public use overlay or hash. Changed linked references also block until their content can be inspected. The panel states which information is unavailable and offers refresh, with no blind clinical acknowledgement.

Future W1/W4 integration must supply reviewed, typed, safe readers for actual report/instruction/legacy-context content with exact client, matching captured/current heads, immutable originals/amendments and correct actor/date/public-private semantics. The `MissingDependencyReader` family is the bounded request. No Report/Guidance response shape, W4 history, source lifecycle or isolated M58/Review14/Guidance9 import is invented here. No shared-plan export patch is required by this implementation.

Parent integration is deferred until its current genuine care phase ends. No Application.tsx patch is needed: it already passes `{care:true}`. Parent retains composition, canonical documentation, fresh independent review, actual R7 acceptance and full-goal/CI/release gates.

## source verification and limits

Ignored evidence: `.local-artifacts/portal-rebuild/w2-care-dependencies/`. Tests execute actual application session/cookie factories/transport, Plan/Care parsers/mappers, adapter/controller and actual component SSR. Only finite HTTP DTO/status/delivery and the existing synthetic backend reducer are controlled. No successful application port, session-current function or implementation is replaced. These are source/HTTP-fixture facts, not actual SQL/Auth persistence or client evidence.

- Initial factory RED:1 pass/1 fail; existing dependency read rejected403. Opt-in GREEN:2/2.
- Initial controller RED:2 pass/11 fail, including approval available with an unknown care basis. Meaningful race/CAS/recovery/negative cases then pass.
- SSR RED:0/2; actual workspace lacked current-information/correction/recovery markup. GREEN2/2.
- Approval continuation RED:0/1; refreshing missing authority retired the basis and prematurely stopped deliberate approval. The same approval now refreshes its dependency read and rechecks the exact target before submitting.
- Additional exact-client RED: a different client's attributed report incorrectly formed a review basis. Current controller refuses it.
- Acknowledgement RED:3/5; wrong legacy basis and stale affected reviews were acknowledged. Both now retain uncertainty and original pending intent.
- Retained217 pure advisor plus34 actual-app,73 authority and29 status cases, and the initial31 dependency/SSR cases: **384/384**, zero failures/skips/cancelled. The later source-denial case is recorded with subsequent validation.

Harness qualifications remain explicit: the first public summary fixture incorrectly included a full amendment reason, which the strict compact mapper rightly rejected; corrected the fixture, not the mapper. The first paging fixture used a noncanonical cursor and failed before egress; it now uses the actual accepted `c:<hash>:<uuid>` format. A subsequent client-scope helper typo spread the reported-products envelope instead of `.items`; strict compile caught it, corrected before acceptance. Initial incomplete tests without a timeout are not accepted results; final commands are finite. Existing root typeless-package warnings remain unchanged.

No Chrome/browser/DOM/preview call, PG/Auth/Docker/credential/native/R4/R5/R6/R7/helper/resource polling, hosted action, real client/source/permission/money/communication/order, push/PR/merge/deployment occurred. Browser/keyboard/320/390/1440/Figma comparison is **not yet verified** and awaits an explicit later serial Chrome grant after W6. No full portal suite that could start browsers, full root/Expo/native suites, reset/pgTAP/RLS, actual R7/genuine care journey, hosted checks, independent review or exact-head CI is claimed. Source-ready is not full implementation or release acceptance.

The worker remains available for a separately granted browser phase. No browser resource is requested or presumed while W6 owns it.

## coherent source checkpoint verification

Final source command uses explicit Node22 with `--experimental-strip-types --test --test-timeout=15000 --test-concurrency=1` on:

```text
apps/portal/tests/rebuild-advisor-controller.test.mjs
apps/portal/tests/rebuild-advisor-races.test.mjs
apps/portal/tests/rebuild-advisor-followup.test.mjs
apps/portal/tests/rebuild-advisor-app-integration.test.mjs
apps/portal/tests/rebuild-advisor-approval-authority.test.mjs
apps/portal/tests/rebuild-advisor-status-recovery.test.mjs
apps/portal/tests/rebuild-advisor-dependencies*.test.mjs
```

Result **385/385**, zero failures/skips/cancelled, including32 new source/SSR cases. `source385-final.log` is the accepted final source result. A preceding attempt accidentally nested the new source-denial test inside the five acknowledgement tests and cancelled those nested tests; corrected the test's placement without changing production or weakening assertions. That attempt is not accepted evidence.

Adjacent source command, same Node flags, runs ten relevant app/care/foundation source/SSR files and six Root contract/handler files: **121/121**, zero failures/skips/cancelled; `adjacent-source.log`. It includes actual retained cookie care/plan selection, canonical advisor audit, session/transport, mapper/private-extra/owner/CSRF fences and Root13/26/14 contracts. Counts overlap with other reports and do not sum into full acceptance.

`npm --prefix apps/portal run typecheck:rebuild`, `typecheck:session` and `check:ui` each exit0, strict settings unchanged;11 retained stylesheets pass. Five imported originals exactly match INPUT_PROVENANCE bytes/hashes; nine project/role configuration files match the required pins. `source-boundary.json` records these and byte-unchanged reserved Root/session/Application/shared-plan/status paths. Final diff/whitespace check passes with only the owned paths listed above. No old test assertion is edited.

## source audit follow-up and current continuation

Early coherent implementation commit: **`3d06af0c78b59332a1d55f113e7fb23a18e7bd69`**, clean, reported immediately to the parent while remaining live. A clean-head application build exits0 with `sourceHead:3d06af0c78b59332a1d55f113e7fb23a18e7bd69`, `sourceDirty:false`, `gatewayIncluded:false`; provenance SHA `02fe45302a7362a47b7ca3a8452c88b4e1879de24d5fd511ebb70b01ebc70a4e`. This candidate is the early checkpoint, not the subsequent source follow-up or a deployment.

Source audit added a strict actual-care/SSR control covering immutable descriptor creation plus version2 correction, nested initial unreviewed use, full `not_sure` identity answer, unknown strength/date and actual video/advisor attribution. It passes without a production change. A second SSR assertion supplied a new draft route while the controller still held the old draft, reproducing old client reports/rebase controls before the passive open completed. The workspace now renders loading until the route and actual draft IDs agree; route/selection changes also retire dependency-review leases. This is a defensive source/SSR transition correction, not demonstrated browser or server cross-client disclosure.

Final same source command now passes **387/387**, including34 new dependency/SSR cases, zero failures/skips/cancelled. Both unchanged strict frontend/session typechecks pass again. Exact command arrays/exits/timing are in `source-checks-final.json`; `source387-final.log` is the current source result. Prior121 adjacent controls remain scoped to the unchanged adapter/controller bytes. Browser/actual Application lifecycle acceptance is still pending the explicit grant.

Permission qualification from actual SQL: M56 dependency commands call `plan_guard`, which requires human edit authority. A true view-only backend may deny the dependency read403; this UI truthfully leaves its basis unavailable. The finite view-only tests establish that already-authorized disclosures remain readable and mutations stay denied when capabilities restrict; they do not claim an actual backend view-only draft/dependency grant. Existing safe advisor care publication/audit reads remain separate and unchanged. No SQL permission expansion or new source right is requested.

Current implementation/test source is **`5d796c22029224116d7d720c053bf6c528e44605`**, following early3d06af0. The clean5d application build also exits0: `sourceDirty:false`, `gatewayIncluded:false`, exact provenance SHA **`01619b390ebab1fa0aa75329386b9e1df89f102243fa990aeed944c3c05edd84`**. Its original bytes are copied to `application-provenance-clean5d796c2.json`. A later report-only receipt does not change this tested source.

The initial stalled source-test worker was positively identified by its exact known Node/script arguments and this worktree's cwd, then terminated by that one PID. This bounded own-source cleanup made no browser/native/fixture inventory or lifecycle call. Both cleanup receipts are retained; no broad kill occurred. All final finite source/type/build commands returned terminal results. Browser/fixture custody remains wholly untouched and unclaimed.

Selected accepted logs under the evidence root are `source387-final.log`, `source-checks-final.json`, `adjacent-source.log`, `frontend-types-final.log`, `session-types-final.log`, `ui.log`, `build-clean5d796c2.log`, `runtime.json`, `source-boundary.json`, and the copied clean5d provenance. Earlier RED/setup logs remain separate. Parent was notified at both implementation checkpoints. The worker remains live waiting for explicit browser authority, with no automatic resource polling.

## bounded implementation follow-up: close the runtime dependency port

Starting clean source **`278714b708df2a88e5796fb2ef0ae82d31e76057`**, same workspace/branch. The parent identified a contract-quality defect: `ports.dependencies.execute` had only a TypeScript action restriction and forwarded otherwise-valid runtime Plan commands to the broader plans port. This did not establish extra privilege or a server bypass; the same advisor already holds that broader port. The original387/121/build evidence and source checkpoint above remain frozen historical results. This is an implementation follow-up, not an independent review round.

Both live model tools again verify codex/Sol/xhigh/default and supported descriptors. Project/default-subagent settings and all eight role TOMLs are freshly parsed and hashed. All Node/npm commands explicitly use Node22.23.0; no dependency/config change. Applied review-reception, systematic debugging, TDD and verification guidance.

The only production change replaces that forwarding expression with an explicit runtime guard for **only** `read_draft_dependencies_v1` and `rebase_draft_dependencies_v1`. Other actions fail with `TransportError(403)` before egress. Accepted actions continue through the unchanged broad port's captured-session, strict `readPlanCommand`/`mapPlanResult`, operation-kind and selection paths. `careRead`, global allowlists, permissions, existing tests and every other production statement remain byte-identical to278.

New test file: `apps/portal/tests/rebuild-advisor-dependencies-runtime-seam.test.mjs`. Actual application cookie/factory/transport/Root mapping execute; only finite HTTP DTOs/fault delivery and the existing synthetic backend reducer are supplied. Before the fix, **8 pass/3 fail**, zero skips/cancelled: otherwise-valid `read_draft_v1`, `list_plans_v1` and `validate_draft_v1` visibly egress through the dependency port. The draft read additionally emits its normal gate read. Correct intended assertions reject this behavior. After the fix, **11/11** pass, zero skips/cancelled: those actions emit nothing through dependencies and still work through the ordinary plans port. Legitimate read/rebase decode, unchanged text/new revision/selection, HTTP503 and malformed200 READ-rejected versus WRITE-uncertain outcomes, strict extras/UUID/schema rejection without egress, and creation-bound CSRF replacement denial remain verified. Malformed allowed-action payloads retain the existing parser's `invalid_input` behavior; it is not replaced with another parser.

Evidence root: `.local-artifacts/portal-rebuild/w2-care-dependency-seam/`. `red.log`, `green.log`, `focused-source.log`, strict-type logs, `checks.json`, `runtime.json`, `pins.json` and the final scope/hash receipts are retained separately from the original checkpoint evidence.

Executed command uses `/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node --experimental-strip-types --test --test-timeout=10000 --test-concurrency=1` on:

```text
apps/portal/tests/rebuild-advisor-dependencies-runtime-seam.test.mjs
apps/portal/tests/rebuild-advisor-dependencies.test.mjs
apps/portal/tests/rebuild-app-ports.test.mjs
apps/portal/tests/rebuild-care-ports.test.mjs
```

Result **67/67**, zero failures/skips/cancelled. Explicit Node22 `npm --prefix apps/portal run typecheck:rebuild` and `typecheck:session` both exit0 with unchanged strict flags. Exact argv/exits/timing are in `checks.json`. Only the tiny `ports.ts` guard, the new test and this appended report enter the follow-up commit. Diff/scope/whitespace checks precede the returned commit SHA.

No browser/Chrome/DOM/preview/native/R7/credential/resource inspection or polling, parent integration, permission/Root/careRead/global-action change, push/PR/merge/deployment or live business action. No broad/full browser, application build, Root/native/DB or CI suite is rerun for this bounded guard; the original evidence keeps its original source. W6 retains genuine R7 and sole Chrome. The worker remains available for the later separately granted serial synthetic browser phase; independent current-source/browser acceptance remains open.

## granted synthetic browser implementation phase

Explicit sole serial installed-Chrome grant followed W6's returned custody **2026-10-31T11:14:53.715UTC**. R7 remained coordinator-owned throughout; this worker received no native/Auth/PG/Docker/credential/fixture authority. Clean starting source **`47586ed342f0cee8e92c8323b94196da3abb93b6`**, same `t3-d6691f48` workspace/branch and delegated thread/task correlation above. First browser tool was `preview_status`: no tab. The expressly requested repository installed-Chrome workflow then used finite HTTPS `shelv-dependencies.local.invalid` interception, deny-by-default assets/API routes, blocked service workers/background networking/DNS, actual Application/main, cookie/session factories, captured transport, Root parsers/positive mappers, advisor controller/workspace and shared controls. There is no test application port, session-current override, invented API or SourceApp bypass. Only the finite HTTP backend ledger/DTO/status/delivery is synthetic.

Both live capability/configuration tools again establish codex/Sol/xhigh/default with supported descriptors; project/default-subagent settings and all eight role TOMLs are freshly verified. Every Node/npm/build invocation explicitly uses Node22.23.0, including child builders via `process.execPath`. Applied Resume, repeatable Playwright, repository UX, TDD, systematic debugging, React review and verification guidance. The user-specified repository paths/workflow supersede the skill's generic temporary-file/server-discovery defaults; no localhost discovery or server was needed.

New `rebuild-advisor-dependencies-browser.test.mjs` and its owned helper mount the actual Application. All27 journeys cover:

- Actual current use, original reports/identity/descriptor versions, known/unknown original Start, contradictions, complete original/amended frequency/amount/details and client/advisor/another-advisor correction attribution. A corrected descriptor does not inherit the old identity.
- Separate deliberate acknowledgement and rebase; exact existing DTO, unchanged body/new revision/unreviewed affected sections/cleared approval; all five deliberate reviews, new exact approval and later publication. Fixture clocks/Starts and financial rows remain unchanged in that later-publication journey; no new use/Start/receipt command is emitted. These are fixture preservation assertions, not persisted SQL-clock proof.
-25-entry pages and complete same-head review; changed-head rejection/reload, current403/503 recovery, missing REPORT/INSTRUCTION/opaque legacy-context readers, unavailable true view-only dependency access, unassigned/prepublication preparation without fabricated entitlement or Auth creation.
- Dirty autosave/manual B and exact uncertain retry after old403/503; rebase uncertainty through status403/absent and byte-identical retry; definite409 requires new matching information plus another acknowledgement before a new UUID. Old rebase status cannot clear newer uncertain save B. Historical approval status/retry cannot replace newer restrictive authority. Restrictive gates retire old disclosure reads while a later lawful refresh remains recoverable.
- Actual route selection hides the old panel while another valid unassigned draft read is held. New disclosure/full long text and acknowledgement controls work with keyboard at1440/390/320; native read-only text remains immutable, no horizontal overflow or sensitive URL/history/storage is introduced.

The old `rebuild-app-browser.test.mjs` responder needed only three existing API cases: dependency read/rebase and advisor use-history. It checks the actual draft/client/revisions; its old advisor fixture has an explicit empty care ledger and refuses changed heads409 rather than fabricating a healthy unknown client. All19 original test bodies/assertions are byte-identical to475. The ordinary plans/care adapters, action allowlists, runtime two-action guard, permissions and canonical audit remain unchanged.

### browser-found continuation and bounded correction

With those finite responders added, retained App19 gives **18/19**: after confirmed first-service bookkeeping, its unchanged intended assertion sees publication disabled. `executePayment` refreshed context while its command remained pending. The automatic dependency effect could run then and refuse inspection; after pending cleared, the payment UI returned before an applicable dependency read completed. Publication correctly stayed blocked, but normal readiness continuation regressed.

A new actual-Application held-read test then fails **0/1** at the intended premature form-exit assertion before production edits. The controller now acknowledges/clears the known financial command, then awaits `inspectDependencies` before returning its UI continuation. Read denial/unavailability cannot convert the known financial receipt back into an uncertain write. The workspace's automatic effect preserves an already-current inspection instead of superseding that explicit read. No automatic rebase, approval, publication, payment or permission change occurs. The new browser regression passes1/1. Three additional actual-cookie/controller source cases pass3/3, including dependency403/503 after known payment: pending stays null, receipt remains confirmed, publication stays blocked.

Only `controller.ts` and `AdvisorWorkspace.tsx` change in production in this phase. Root/native76/Application/session/shared plan/UI/routes, all57 migrations, ports.ts/careRead/global permissions and isolated M58 remain untouched. No old assertion is edited or relaxed.

### executed checks and preserved qualifications

Evidence root: `.local-artifacts/portal-rebuild/w2-care-dependencies-browser/`. Exact Node argv/exits/timing for source/type/UI checks are in `checks.json`. Source versions and transport-byte hashes are recorded in per-run `execution-*.json`/`cases-*.jsonl`; browser version/launch configuration is in `browser-*.json`. All browser files run with `--test-concurrency=1` and finite test timeouts.

| Executed check | Result and boundary |
| --- | --- |
| New actual-Application browser suite |27/27 pass; later final clean-source run recorded below |
| Keyboard acknowledgement/full-text subset, final waiting semantics |3/3 at1440/390/320; Tab to refresh/select, real popup focus, End/Enter, Tab to separate rebase; acknowledgement sends no mutation |
| Retained advisor13/follow-up11/payment28/App19/approval-recovery11/status4 |86/86 pass, zero failures/skips/cancelled,106.862s; same19 App assertions and all other files unchanged |
| Retained source plus new payment cases |401/401 pass, zero failures/skips/cancelled: original387 intended assertions +11 runtime-seam +3 payment; original217/251 are retained subsets |
| Frontend/session strict types |Both exit0, unchanged strict/noUncheckedIndexedAccess flags |
| UI guard |Exit0,11 retained stylesheets; no CSS or color-budget edit |
| Frozen original387/121 and67 evidence manifests |35+11 entries rehashed, zero mismatches; prior source/counts retain their original scope |
| Source and old App assertion audit |All19 test bodies byte-preserved; all reserved Root/session/Application/shared-plan/route/port/status files unchanged |

The original four SSR source cases run from an ignored path-only copy to redirect build output into the browser evidence root, preserving the frozen original evidence. Four import/output/cwd literals change; reversing them reproduces the exact original source bytes and every assertion. Other old source files run unchanged. This is not a replacement for browser or genuine acceptance.

Harness qualifications are retained separately: the first320 long-text check sampled asynchronous keyboard scrolling too early; observing stable scroll frames fixed the test without a production edit or scroll assignment. The first late503/B case released B before normal **check connection** had completed; waiting for that actual public restore preserves the existing suspended-cookie qualification. The first held payment probe waited only for a read that old code could omit and timed out; it is setup, not accepted RED. The corrected probe races that read against actual UI return and fails the intended assertion. The first acknowledgement keyboard probe sent keys before Radix focus settled; it now observes real option focus before End/Enter. No expected result, saved payload or source guidance is shortened to make these checks pass. Existing typeless-root/absent-Expo-base build warnings remain unchanged.

Prior F1/F2/F3/generic leases, lawful first assigned-open upgrade, C1/AR1/status/manual-notice dispositions remain qualified. A2 ordinary-restore/browser reachability is not newly established; the original pending-after-valid-ack assertion remains incorrect. Current401/private-boundary invalidation is preserved. View-only tests use only authorized finite projections; M56's actual dependency edit guard remains, and403 honestly blocks rebasing. Synthetic restriction/lookup faults do not establish genuine server revocation or a privilege bypass.

Retained native A02 `500:383` was directly viewed alongside current synthetic full-text captures. Shared cream/forest tokens, wrappers, typography and controls remain; old editor geometry/read-only cases pass. The new required dependency panel is not in the canned frame, and no whole-frame pixel match or human usability/accessibility sign-off is claimed. Final screenshot/provenance/resource-return receipt follows after the last clean-source run.
