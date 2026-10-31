# portal rebuild current status

Owner: Kanuj. Updated 30 October 2026. Project `KanujVerma/shelv`; integration branch `kanuj/portal-rebuild-integration-20261030`, checkpoint base `efd92fa`. Preserve the unrelated dirty scanner checkout. Fresh fetch still resolves main to `d39a7d4`.

## full goal and standing boundaries

Implement and verify the complete [approved input](source/APPROVED_INPUT.txt), [D01-D48](APPROVED_DECISIONS.md), [desktop specification](APPROVED_DESKTOP_SPEC.md), [26-screen manifest](shelv_desktop_design_manifest.json) and secondary states. The first slice is not the completion goal. [PLAN_API_V1](PLAN_API_V1.md), [contracts](IMPLEMENTATION_CONTRACTS.md), [acceptance matrix](ACCEPTANCE_MATRIX.md), [plan](IMPLEMENTATION_PLAN.md) and [execution log](EXECUTION_LOG.md) are canonical. All coordinator/worker/reviewer tasks use live-verified Sol/xhigh. Exact task IDs, settings, bases, worktrees and write-sets are in [TASKS.json](TASKS.json).

No production deployment/merge, real-client/source/permission changes, real communications, money movement or retailer orders. Synthetic isolated development only. Human comprehension, email/domain prerequisites and external Wisconsin service-scope verification remain separate release gates.

## verified source and current acceptance

- Documentation/configuration checkpoint `9be041d` and independent review are complete. Full input/hash/spec/manifest, contracts, ownership and prospective policy rules are retained. Draft PR211 is stacked on approved handoff PR210; both registered with T3.
- All 26 native design baselines/recovery/primitives/assets are retained. W0 fixes are integrated as `0f4d6b7`/`e343fdd`. Re-review `386ce81`, integrated `0a78a61`, says R1-R4 ADDRESSED, scoped spec/quality PASS. One exact-version license association remains unverified; no legal clearance. Selected-node metadata is correctly labeled rather than claimed as a page tree.
- W1 backend and seven-defect fix `371c425` are integrated, the latter as `3baa87c`. [Original review](research/W7_BACKEND_REVIEW.md) and [fix responses](research/W1_FIXES.md) are retained. [Independent round 2](research/W7_BACKEND_R2.md), integrated `efd92fa`, confirms all seven original findings addressed but **FAILS acceptance** on two further P2 races: cached private receipts returned after session/task expiry during source waits, and check-in writes committed after session expiry or actual support cancellation during client waits. Fresh43 native/20 focused and three typechecks passed but did not detect these added probes. W1 wait-fence fixes now exclusively owns the original unreleased migration.
- Advisor read extension has its own sole forward allocation, `20261031003846_portal_rebuild_advisor_reads_v1.sql`, after the reviewed migration. [Read contract](ADVISOR_READ_API_V1.md) and strict early seam `7ca6d32` are integrated as `36af02e`. SQL implementation is active. It supplies real current approval/capabilities and canonical published content; no reconstructed draft publication or fabricated metadata.
- Plans cookie/gateway channel `129635e` has nine passing red/green boundary tests, finite response mapping, safe errors, CSRF/audience/capability/session/no-store fences and 500 KB plan-only JSON. Legacy channels retain 100 KB. Real new Auth/Edge/PostgREST/browser composition remains unproven. No binding/key/namespace/production setting changed.
- Semantic sign-in recovery `af121d6` uses one shared route parser/build grammar in auth and the typed frontend, retaining strict legacy aliases and audience boundaries. Three new tests failed first; focused10, route7, full session161 and root/session/frontend types pass. Packaging136 assets passes. No callback credentials enter navigation or durable state. Actual new Auth callback/browser flow is still unverified.
- W3 original review `85ab24d` found F1-F8/Q1. [Fix response](research/W3_FIXES.md) through `d341ed7` is integrated as `98f4a5a`/`c2415a3`/`42555e0`; coordinator freshly passed32/32 focused cases. Independent round 2 is active. Full stop/report/latest-review projections and final app composition remain unfinished.
- W2 advisor controller/editor/report through `a432b1a` is integrated as `732fa0e`/`a66e803`/`23c2b59`/`f7be7e8`. Author28 focused passes; independent review and connected acceptance remain pending. Real approval/payment/context reads and explicit unpublished preview remain composition dependencies. Strict shared indexing corrections `930dab9` and `fac95d1` preserve emitted JavaScript and normal compiler flags.

## active work and resource ownership

Check actual task handles before duplicating work. Three allocations:

1. W1 wait-fence fixes, `t3-c484cddc`: R2-1/R2-2 only, original54 migration plus a new race-test file/report. Exclusive custody of returned STOPPED `/tmp/shelv-w1-plan-pg`; verify status/identity/marker before use. No parent Auth fixture lifecycle.
2. W1 authoritative advisor reads, `t3-97b66568`: shared contracts/handler and sole new forward migration. Its own separate ignored small Unix-socket fixture; original R2 fixture untouched.
3. W7 client re-review round 2, `t3-91dd91e7`: report only, all F1-F8/Q1. Sole serial intercepted browser allocation after the coordinator's terminal32-case run.

Coordinator owns gateway/auth-route/app-root composition, explicit unpublished preview presentation adapter, status/release packaging and heavy real Auth fixture. Do not edit W1 shared contracts/migrations while allocated. W2/W3 implementation tasks are terminal; do not duplicate them. No broad remaining-page fan-out before the connected vertical slice passes. The goal service still reports an old paused record despite the user's explicit continuation; implementation continues under that instruction, without claiming goal completion or changing pause status autonomously.

## verification and retained environments

[Baseline evidence](evidence/BASELINE-20261030.json) is pre-rebuild: portal344/session148/backend40 pass; root1,176 pass with18 opt-in skips; types/UI/builds/web export and native SQL12/15/12 pass. Actual local Auth/PostgREST/browser15 passed on53 migrations. This does not prove new gates.

Selected-path fixture code passed14 pure cases and15 actual Auth/browser cases. Independent fixture review passed; low Q1 pure handoff coverage is supplemented by making the required real CI lane use an explicit fixture directory. CI execution is pending. Baseline project `8cb3813a54e9` and selected-path project `5fad8862e696` are stopped with volumes retained, zero hosted changes/real emails. Their prepared source has53 migrations: do not overwrite/adopt/reset them for54.

Last observed Colima profile `shelv-portal-20261024` was running at `unix:///Users/kanuj/.colima/shelv-portal-20261024/docker.sock`; revalidate before lifecycle work. Default Docker context was not switched. After fixes, prepare a distinct owned snapshot, run exact local reset/pgTAP and genuine Auth/PostgREST/Edge/browser positives/negatives. Never use `--linked` or a shared default project.

Latest scoped evidence: foundation R2 independently passed41 focused/389 portal/157 session and types/builds. W3 author383 portal includes17 feature cases at an older base. Overlapping counts are not additive. Coordinator passed ten domain/handler and nine new plan-channel cases, strict root/test/session/frontend types and packaging. Full integrated suites, canonical reset/pgTAP, actual new Auth/Edge journey, final visual/security/release audit remain required. All coordinator shell test/build handles through this checkpoint are terminal.

## next coordinator work and open seams

Continue independent semantic sign-in/callback return-path support and an explicitly unpublished preview adapter while allocations run. Consume fix/review results once, test and independently re-review, then connect the real unassigned-to-publication-to-client-decision UI slice. Only afterward parallelize remaining history/check-ins, orders, account/service/privacy, sources, real notification delivery/inbox and all five Maya stages.

Canonical advisor reads are now allocated as above. Template lifecycle, raw-source upload/retention, pause/stop/different-use/latest-review projections and delivery remain explicit later API work. Do not manufacture ClientPlanView version/date/entitlement to fill a preview gap. Unassigned/no-service raw-source abandonment retention and exact production agent/email enrollment remain narrow prerequisites. Finish independent safe work; no representative-human or hosted result is claimed.
