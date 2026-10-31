# approved portal rebuild implementation plan

> For agentic workers: use the relevant Superpowers implementation, debugging, review and verification workflows. Execute owned tasks against the approved specification; do not reopen its design decisions.

Owner: Kanuj. Coordinator owns integration. Status: tasks 1-2 complete; task 3 implementation/fix/review and connected composition in progress. Existing slice signatures are pinned in PLAN_API_V1 and ADVISOR_READ_API_V1; the next bounded implementation is pinned in CARE_API_V1. Current evidence and limits are in CURRENT_STATUS and the task/review reports.

**Goal:** deliver the complete connected, tested portal matching all D01-D48 and 26 screens plus secondary states.

**Architecture:** rebuild the frontend inside `apps/portal` with React/TypeScript, one shared shadcn-based wrapper layer and Lucide. Retain the existing secure cookie/vault gateway and canonical Supabase records; add compatible draft, source, approval, notification and other required state. Clients, advisor preview and Maya consume one structured renderer. Use synthetic isolated environments.

**Specification:** [approved desktop specification](APPROVED_DESKTOP_SPEC.md), [decisions](APPROVED_DECISIONS.md), [contracts](IMPLEMENTATION_CONTRACTS.md), [acceptance matrix](ACCEPTANCE_MATRIX.md).

## constraints and ownership

Sol/xhigh for coordinator and all workers, with actual runtime receipts. At most eight workers, initially three plus coordinator. Separate worktrees and write-sets. One writer for shared schemas/routes/dependencies, auth/runtime composition and migration order. No real-client/source/email/money/order writes, protected-main merge or production deployment. Approved business rules override older prospective statements, preserving historical records and provenance.

## task 1: durable input and execution checkpoint

Files: `docs/portal-rebuild/`, project/eight-role config, root/portal instructions and prospective founder/UI/context pointers.

- [x] Verify fresh coordinator runtime, Git state, main/PR lineage and isolation.
- [x] Read full supplied handoff and import exact input, approved specification and full manifest with hashes.
- [x] Write initial contracts, D01-D48/26-screen/secondary acceptance inventory and ownership/status records.
- [x] Validate imported hashes/map, docs links, exact role model/effort, config parser and clean diff.
- [x] Commit this reviewable checkpoint and open/link draft PR211 stacked on the approved docs branch. No merge. Independent documentation review is running separately.

## task 2: reconcile contracts and acquire exact design foundation

Parallel independent tasks after checkpoint: W1 reads canonical backend/security/payment/service/source and fixture lineage; W0 acquires current native Figma geometry/component/assets and builds only the shared foundation. Both return exact scope and no page-specific forks. Contract changes remain one writer; coordinator integrates once dependencies are stable.

- [x] W1 maps existing tables/RPCs/guards against D14-D40, including every legacy publication route and service clock. Produce exact compatible schema/command additions and test cases in `docs/portal-rebuild/research/W1_BACKEND.md`; no production implementation during reconnaissance.
- [x] W0 stores all 26 native frame references and recovery/component baselines with hashes/version metadata. Correlate sparse context with child-node fetches. Preserve original Figma file.
- [x] W0 implements `apps/portal/src/ui/`, semantic tokens, shell, route builders, session-bound transport adapter and controlled shared wrappers. Update only owned frontend dependencies/build/test config. Use official shadcn/Lucide documentation and existing compatible assets.
- [x] Coordinator reviews backend reconciliation, pins exact types/commands and migration allocation in `IMPLEMENTATION_CONTRACTS.md`; document new material conflicts, without broadening permissions.
- [x] Verify shared component keyboard/dialog/focus behavior, route roundtrips and transport session fences with focused tests. Compare shell geometry/assets to exact Figma baselines. Integrate foundation and contract checkpoints.

## task 3: implement first real connected vertical slice

Files: W1-owned new shared types/validators, draft/publication/source/outbox modules and allocated canonical migration; W0 transport composition; minimal W2/W3 editor and shared plan view. Tests target the actual API/SQL and browser effects.

- [x] Write failing domain/schema/SQL tests for incomplete unassigned saving, assignment without Auth creation, strict import fields, stale revisions, exact review and approval invalidation.
- [x] Implement minimal compatible records and authenticated operations, including the external-agent operation surface. Re-run focused cases and inspect public/private projections.
- [x] Write failing publication tests for missing/wrong-client/wrong-content approval, missing payment, unsupported authority, legacy bypass, concurrent execution and exact retry.
- [x] Implement one transaction for gates, immutable version, first entitlement/service/review dates and outbox. Payment recording preserves unchanged content approval; persisted tests cover delivery lease/retry semantics. Actual email/webhook delivery remains task4/5 scope.
- [x] Connect minimal editor and shared client renderer through existing authenticated transport. Verify actual database changes, not only success notices.
- [x] Run isolated real Auth/PostgREST journey: create unassigned draft, populate, assign, review/approve, verify synthetic service receipt, deliberately publish, client read/durable notification rows, decision review, Back to current routine. Verify old IDs/dates/receipts unchanged.
- [ ] Independent Sol/xhigh review and focused fix/re-review. Record exact head, fixture, commands/results and limitations in acceptance matrix before broader page fan-out.

## next bounded care implementation

CARE_API_V1 pins new actual use/identity and a bounded v2 read model, immutable amendments and explicit dependency rebasing. Its single root-contract/SQL writer can implement and publish an early strict seam while the independent first-slice status-recovery correction finishes. No remaining page workers start until that correction is independently accepted. Then shared client/report/history owners consume the committed DTOs rather than inventing parallel schemas. Raw sources/templates/guidance/commerce/account/delivery remain sequenced compatible domains, not presumed implemented by this API.

## task 4: complete owned product modules

Once shared contracts and the vertical slice are stable, use separate bounded worktrees. Each task includes meaningful failing behavior tests, implementation, focused verification, visual comparison and review before integration.

- [ ] W2: advisor clients/plans, free-navigation editor sections, honest autosave, source uploads, import diff/conflict, preview, exact approval/payment/publish and permission policy UI.
- [ ] W3: routine-first plan, all decision types, product-bound sheet/evidence/use reports, safe source-faithful Maya content and five-stage shared-renderer guide. All Start/stop/unknown/self-purchase behavior and alerts.
- [ ] W4: goal-specific optional reports/photos, attributed conversation records, append-only amendments, public/private reviews, no-change review, meaningful history and historical snapshot/restore.
- [ ] W5: frozen complete quotes, payment claims versus gross receipt, manual purchases/shipping/delivery, reconciliation, self-purchase and returns/refunds with immutable financial history.
- [ ] W6: account/profile/address verification, manual service renewal, calendar coverage/guarantee, cancellation/support/read-only ends, final export, remaining administration and 12-month source deletion processing.
- [ ] Coordinator: integrate only owned modules against pinned contracts, keep one shared shell/renderer, resolve composition without overwriting counterpart work, update canonical docs/status in each slice.

## task 5: prove integrated behavior and release readiness

- [ ] W7 independently executes V01-V17 with real isolated authentication/persistence/authorization and negative cases. Review integrated production diff, reproduce relevant issues and return blocking/high objections; fixes receive fresh independent review.
- [ ] Compare all 26 screen variants and recovery specimens with native approved baselines. Verify narrower laptops, 320/390px, keyboard, zoom, reduced motion, long text and missing data/assets. No screenshot-only pass.
- [ ] Run root application/test types/tests/web export and affected portal/backend/session/UI/build checks. Database/auth/storage extensions require isolated canonical `supabase db reset`, `supabase test db`, Edge smoke and least-privilege checks. Record failures/skips precisely.
- [ ] Rehearse compatible migration preserving legacy IDs, publication/Start/coverage dates, receipts, instructions and private walkthrough grants. Preserve backup/rollback evidence and compare before/after invariants.
- [ ] Deliver tested preview and concise founder walkthrough plus a synthetic plan-creation example. No production connection for demos. Document email/test-domain/hosted and external business-scope prerequisites.
- [ ] Prepare a single-cutover plan with backup, exact source artifacts, migration order, smoke gates, stop conditions and rollback. Release approval and human comprehension review remain explicit launch gates.
- [ ] Final requirement-by-requirement audit of D01-D48, screens, secondary states and V01-V17. Exact-head CI before any separately authorized merge. Register every PR with T3. Mark the goal complete only after its complete implementation/verification deliverable is proven, with remaining release gates accurately separated.
