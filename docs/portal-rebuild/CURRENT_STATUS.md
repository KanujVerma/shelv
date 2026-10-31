# portal rebuild current status

Owner: Kanuj. Updated 30 October 2026. Project `KanujVerma/shelv`; integration branch `kanuj/portal-rebuild-integration-20261030`, checkpoint base `ba3fabb`. Preserve the unrelated dirty scanner checkout.

## full goal and standing boundaries

Implement and verify the complete [approved input](source/APPROVED_INPUT.txt), [D01-D48](APPROVED_DECISIONS.md), [desktop specification](APPROVED_DESKTOP_SPEC.md), [26-screen manifest](shelv_desktop_design_manifest.json) and secondary states. The first slice is not the completion goal. [PLAN_API_V1](PLAN_API_V1.md), [contracts](IMPLEMENTATION_CONTRACTS.md), [acceptance matrix](ACCEPTANCE_MATRIX.md), [plan](IMPLEMENTATION_PLAN.md) and [execution log](EXECUTION_LOG.md) are canonical. All coordinator/worker/reviewer tasks use live-verified Sol/xhigh. Exact task IDs, settings, bases, worktrees and write-sets are in [TASKS.json](TASKS.json).

No production deployment/merge, real-client/source/permission changes, real communications, money movement or retailer orders. Synthetic isolated development only. Human comprehension, email/domain prerequisites and external Wisconsin service-scope verification remain separate release gates.

## verified source and current acceptance

- Documentation/configuration checkpoint `9be041d` and independent review are complete. Full input/hash/spec/manifest, contracts, ownership and prospective policy rules are retained. Draft PR211 is stacked on approved handoff PR210; both registered with T3.
- All 26 native design baselines/recovery/primitives/assets are retained. W0 fixes are integrated as `0f4d6b7`/`e343fdd`. Re-review `386ce81`, integrated `0a78a61`, says R1-R4 ADDRESSED, scoped spec/quality PASS. One exact-version license association remains unverified; no legal clearance. Selected-node metadata is correctly labeled rather than claimed as a page tree.
- W1 backend is provisionally integrated (`7abaabc`, `e3fd12c`, `8134a11`, `5e25852`). Only new migration is `20261030223603_portal_rebuild_plan_v1.sql`, 54th canonical migration. Author and independent reviewer passed 29 native cases, but **acceptance is blocked** by F1-F5 and Q1/Q2 in [W7_BACKEND_REVIEW](research/W7_BACKEND_REVIEW.md), integrated `ba3fabb`.
- Backend defects: source-revoked cached receipt disclosure; expired care via legacy admin reads; uncovered published fields in section hashes; two editable legacy/new drafts; whitespace-only directions accepted; lawful draft-bound source restoration fails; NULL delivery limits bypass the bound. W1 fix task is sole writer of the unreleased migration and shared plan contracts.
- Plans cookie/gateway channel `129635e` has nine passing red/green boundary tests, finite response mapping, safe errors, CSRF/audience/capability/session/no-store fences and 500 KB plan-only JSON. Legacy channels retain 100 KB. Real new Auth/Edge/PostgREST/browser composition remains unproven. No binding/key/namespace/production setting changed.
- W3 client slice `b4f43f7` integrated as `4ad0038`: C01/C01E, C02, selected sheet/evidence, typed ports and source-faithful content. Independent review is active. Eleven strict shared schema-index errors were reproduced and corrected at `930dab9`; normal strict frontend check passes, all three changed files emit identical JavaScript, no compiler flag relaxed. Full stop/report/latest-review projections and final app composition remain unfinished.

## active work and resource ownership

Check actual task handles before duplicating work. Three allocations:

1. W1 backend fixes, `t3-36369025`: all seven review defects with meaningful persisted regressions. Exclusive custody of returned `/tmp/shelv-w1-plan-pg`; verify status/identity/marker before use. No parent Auth fixture lifecycle.
2. W2 advisor first slice, `t3-dfd42730`: structured drafting/assignment/import/review/approval/payment/publication components and typed ports. No shared UI/backend/router edits. Preview passes actual unpublished PlanPreview to coordinator; no fabricated publication metadata.
3. W7 client review, `t3-d3de7402`: report-only independent review of W3 with fixed foundation/strict types.

Coordinator owns gateway/auth-route/app-root composition, explicit unpublished preview presentation adapter, status/release packaging and heavy real Auth fixture. Do not edit W1 contracts/migration or W2 advisor files while allocated. No broad remaining-page fan-out before the connected vertical slice passes.

## verification and retained environments

[Baseline evidence](evidence/BASELINE-20261030.json) is pre-rebuild: portal344/session148/backend40 pass; root1,176 pass with18 opt-in skips; types/UI/builds/web export and native SQL12/15/12 pass. Actual local Auth/PostgREST/browser15 passed on53 migrations. This does not prove new gates.

Selected-path fixture code passed14 pure cases and15 actual Auth/browser cases. Independent fixture review passed; low Q1 pure handoff coverage is supplemented by making the required real CI lane use an explicit fixture directory. CI execution is pending. Baseline project `8cb3813a54e9` and selected-path project `5fad8862e696` are stopped with volumes retained, zero hosted changes/real emails. Their prepared source has53 migrations: do not overwrite/adopt/reset them for54.

Last observed Colima profile `shelv-portal-20261024` was running at `unix:///Users/kanuj/.colima/shelv-portal-20261024/docker.sock`; revalidate before lifecycle work. Default Docker context was not switched. After fixes, prepare a distinct owned snapshot, run exact local reset/pgTAP and genuine Auth/PostgREST/Edge/browser positives/negatives. Never use `--linked` or a shared default project.

Latest scoped evidence: foundation R2 independently passed41 focused/389 portal/157 session and types/builds. W3 author383 portal includes17 feature cases at an older base. Overlapping counts are not additive. Coordinator passed ten domain/handler and nine new plan-channel cases, strict root/test/session/frontend types and packaging. Full integrated suites, canonical reset/pgTAP, actual new Auth/Edge journey, final visual/security/release audit remain required. All coordinator shell test/build handles through this checkpoint are terminal.

## next coordinator work and open seams

Continue independent semantic sign-in/callback return-path support and an explicitly unpublished preview adapter while allocations run. Consume fix/review results once, test and independently re-review, then connect the real unassigned-to-publication-to-client-decision UI slice. Only afterward parallelize remaining history/check-ins, orders, account/service/privacy, sources, real notification delivery/inbox and all five Maya stages.

Canonical advisor reading of published V3 state, template lifecycle, raw-source upload/retention, pause/stop/different-use/latest-review projections and delivery are explicit later API work. Do not manufacture ClientPlanView version/date/entitlement to fill a preview gap. Unassigned/no-service raw-source abandonment retention and exact production agent/email enrollment remain narrow prerequisites. Finish independent safe work; no representative-human or hosted result is claimed.
