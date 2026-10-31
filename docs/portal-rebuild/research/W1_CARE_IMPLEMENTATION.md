# W1 bounded care/use/identity implementation

Owner: Kanuj. Canonical worktree `/Users/kanuj/.t3/worktrees/shelv/t3-caf2b712`, branch `t3/care-use-identity-backend`, clean starting parent `8366ded`. Only this checkout is authoritative for this task. No nested agents, UI/session/common edits, parent R4 access, push, merge, deployment or live business action.

## Early strict seam

Both live `orchestrator_capabilities({search:'gpt-6.1-sol'})` and `t3_thread_configuration({})` establish `codex / gpt-6.1-sol / reasoningEffort=xhigh / serviceTier=default`, full-access/default. Advertised reasoning descriptors: low/medium/high/xhigh/max/ultra (default low), service default/priority (default default). Project defaults and all eight role files pin Sol/xhigh. Explicit Node `/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node` is v22.23.0.

Pinned CARE_API_V1 governs, superseding the research's duplicate startedOn proposal. Retained PlanContent schema1, v1 views, Draft.basis and old TaskAction values are unchanged. New finite plan actions are read_draft_dependencies_v1 and rebase_draft_dependencies_v1, both excluded from old task grants. There are 26 plan commands, preserving all24 existing actions, and13 care commands. Fixed care RPC is concierge_care_command_v1(p_command jsonb); plan dependency commands use the existing concierge_plan_command_v1.

Exact exports:

- PortalCare.ts: ClientPublicationRef, PlanProductRef, ReportedProductRef, ProductRef, Occurrence, Acquisition, ReportedProductBody, IdentityTarget, IdentityAnswer, UseChange, EventRef, EventReceipt, Attribution, UseReplacement, UseAmendment, AttributedUseEvent, AttributedIdentityEvent, EffectiveUse, ReportedProductUse, ReportedProductsPage, UseProjection, PublicReviewSummary, ClientPlanViewV2, AdvisorPublicationViewV2, ReportedDescriptorEvent, UseHistoryEntry, UseHistoryPage, CareCommand, CareRpcCall, CareWriteResult, CareResult, DependencyBasisV2, DraftDependenciesView.
- PortalCareValidation.ts: readCareCommand, buildCareRpc, careCommandFields plus strict reusable care shapes and sameCareValue. Single occurrence date, strict discriminants and extra-key rejection. Started has no startedOn. Real calendar >=1900, no future Chicago report date. Exact plan identity comparison cannot name a different product/slot/version.
- PortalCareMapping.ts: mapCareResult, strict positive care result shapes. Existing lossless plan mapper validates immutable content, R1/R2 original and access fields; v1 is never widened. New read envelopes cannot become write receipts via status. latestPublicReview is honestly null in this slice.
- PortalCareValues.ts: careCommandMaxBytes500000, careTextMax4000, careNameMax200, carePhotosMax100, carePageMax100, carePlanProductsMax5050, careErrorStatuses and finite careClientActions/careAdvisorActions. The plan-product bound derives from the existing50 product/50 routine/50 decision caps with unslotted identity.
- PortalRebuildValidation.ts: separate planDependencyBasisShape and planDependenciesShape; existing command/result exports retain their names. DependencyBasisV2 includes legacyBasis and its full retained-manifest hash, independent use/report/instruction heads and bounded explicit references. No arithmetic reinterpretation of max legacy activation ID.

Parent explicitly adopted these bounded response refinements: ReportedProductUse includes the actual immutable descriptor and exact reported-product version; EffectiveUse includes contradiction:boolean; AttributedUseEvent preserves its original body/date/recorder and contains a separate attributed UseAmendment. No fake catalog object or rewritten original. Coordinator owns the matching CARE_API update and consumer/gateway composition.

Early tests: initial missing care module produced the expected red. New strict tests plus unchanged domain/advisor reads then pass19/19, no skips. Initial bounded strict compile found an overly narrow v2 assertion over the v1 mapper's return; using the actual v1 view union corrected it without an unknown cast or relaxed flag. Final bounded compile of all new root modules/test plus their imports passes with --strict, --noEmit, bundler resolution, ES2022, allowImportingTsExtensions and installed TS6 compiler/typeRoots from the parent dependency directory. Child root/portal dependencies are absent, so full project typechecks remain parent integration gates; no compiler flag was disabled. Logs are ignored under .local-artifacts/portal-rebuild/w1-care/{red-contract,early-green}.log.

Early seam commit is returned immediately to the parent. SQL/handler implementation continues after that commit; this section claims no persisted/actual Auth/browser behavior or overall acceptance. Fresh W7 main13/readonly4/H1/H2 scoped PASS is retained evidence, not rerun here. W7 AR1 status403 remains open and separately owned. Migrations54/55 and root53 historical source remain untouched.

## Corrective seam before SQL: bounded current projections

The parent identified the retained2,000,000-byte upstream response cap before consuming the early commit. The original5050 product/slot bound and repeated full event bodies could exceed it. Parent explicitly approved the correction before SQL: carePlanProductsMax50; exactly one state for each actual document product with effective slotId:null, all original slot identities retained on events/history. No product/slot Cartesian array, omitted paused state, provider-limit increase or truncated current routine.

New exact exports:

- UseEventSummary = Omit<AttributedUseEvent,'change'|'amendment'> & {changeKind:UseChange['kind'];amendment:UseAmendmentSummary|null}.
- UseAmendmentSummary = Pick<UseAmendment,'id'|'eventId'|'previousAmendmentHeadId'|'amendedBy'|'amendedAt'> & Omit<UseReplacement,'change'> & {changeKind:UseChange['kind']}.
- IdentityEventSummary = Omit<AttributedIdentityEvent,'answer'> & {match:IdentityAnswer['match']}.
- EffectiveUse.latestEvent and .identity use these summaries. Full original details/answers and full amendment reason/replacement remain in the separately paginated immutable history. Product-changing amendments remain supported; summary replacement product/changeKind/occurredOn identifies the effective product without rewriting the original summary.
- carePageMaxBytes400000 for reported-product/history pages; careResponseMaxBytes1800000, below the retained provider cap. Pages may return fewer than requested1..100 and continue with nextCursor. All50 plan-product states remain present. The positive mapper rejects oversized bytes and incomplete/duplicate plan-product coverage.

RED: new product bound assertion observed5050 !=50 before correction. GREEN:11 care contract/handler cases. A source-validated near500,000-byte UTF8 PlanContent plus all50 paused product states and a byte-bounded maximum reported descriptor/photo page maps successfully below1,800,000bytes. Dropping one product or returning the100-item oversized descriptor page rejects. Separate full-history UTF8 fixture accepts exactly400000bytes and rejects400001. Strict compiler including actual handler/runtime remains green after adding the explicit finite-error index signature; no flags relaxed. Corrective seam is committed before production SQL.

Actual installed CLI2.121.0 help was inspected, then migration new allocated **20261031043655_portal_rebuild_care_use_v1.sql**, immediately reported. The file is still empty at this seam. Isolated native missing-SQL RED is3 assertion failures,0 errors, through actual care/plan handlers/parser/mappers with synthetic Auth only. Own new Unix-only PG15 fixture is allocated under ignored w1-care/fixture, unique /tmp/sh-care-caf2b712-* socket/55461; no old or parent fixture is reused. Lifecycle receipt/logs retained, STOPPED return required.
