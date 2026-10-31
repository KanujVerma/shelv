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
