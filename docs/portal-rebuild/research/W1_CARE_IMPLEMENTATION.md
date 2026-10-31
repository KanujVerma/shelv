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

History filter correction: plan_product slotId:null selects all slots for that exact publication/product; a non-null slot selects exact context. A use entry may match its immutable original product or current amendment replacement. A separate amendment entry matches its replacement only. Reported-product filters remain exact descriptor-version identities. Two focused cases cover these semantics and wrong-slot/publication/descriptor-version denials. Retained4565e46 mapper produces the expected failure on the new cases; the corrected mapper passes11 contract cases. SQL uses the same predicate. Originals are not copied or rewritten.

ReportedDescriptorEvent now adds initialUse:AttributedUseEvent|null, explicitly adopted by the parent. Original creation uses one reported_product history entry with nested original unreviewed_added event, same UUID/head/outbox. Descriptor correction versions use null. Positive mapper binds that nested initial use to the same event/product/version and rejects started/paused substitution or a nested original on a correction version. A focused case covers creation/correction and both denials;12 contract cases pass. This refinement does not add an action, fake catalog object, Start or second visible entry/notification. The SQL fixture remains exclusively owned and ongoing.

Parent-pinned cross-publication use rule: advice publication cannot revive paused/stopped use or invent Start. Effective current product keys stay selected-publication/product/slotnull, but actual-use summaries may retain another entitled publication and original slot. SQL carries use only for the same opaque product ID and exactly equal immutable tuple(name,brand,variant,strength,sizeLabel,productUrl,reference). Guidance/image/price/evidence/formula/identity rights do not transfer. Same-ID descriptor mismatch produces not_reported, contradiction:true, unknown originalStart and the original summary for clarification; consumers must suppress unqualified continue. Identity and history filters remain exact publication/slot/version. Historical documents receive the current overlay rather than a fabricated historical use snapshot. Tests cover equal-tuple stop, known/unknown Start, mismatch/no Start and different-ID non-aliasing without new care events/heads/activations.

A fresh legacy R2 baseline stop reproduction showed the old public client reader still succeeded with a lossy Start-only DTO. The forward migration now wraps the retained fixed legacy read surfaces and refuses use_version_required only for incompatible current use, with original authorization and final session checks preserved. The same baseline case is green, retaining exact R2 document and original activation bytes/date. Reviewed54/55 files are unchanged.

## Final implementation and exact source boundary

Starting SHA: **8366dedd201a4eed224704eae185350be9aac1d4**. The delivered branch contains the early/corrective seams408ccab,4565e46,5c612b2,d338ab1 and1a0154b, followed by the final owned SQL/test/report commit. Obtain that containing commit with git log -1 --format=%H -- docs/portal-rebuild/research/W1_CARE_IMPLEMENTATION.md; the final task receipt reports its full SHA. No commit/push/merge/deploy occurred outside this owned development branch.

The sole forward migration is **20261031043655_portal_rebuild_care_use_v1.sql**, allocated by the actual CLI2.121.0. There are56 canonical migration files. All55 pre-existing migration files compare byte-for-byte to starting8366ded, including reviewed54/55. The ignored preserved-55-migrations.json records all55 SHA-256 values. No principal, grant, recipient route, catalog object, product quote/order/payment, source object or real client is seeded by the migration.

Implemented:

- All13 pinned care commands through the fixed authenticated concierge-care handler/runtime and concierge_care_command_v1. Client ownership is session-derived. Human recording requires actual current edit authority and confirmedClientReport:true; reporter remains client and recorder actual human. All task-agent care commands deny; old14 TaskAction grants are unchanged.
- Immutable care business events, use originals, descriptor versions, use amendments and requests with independent use/report/instruction heads. An unreviewed descriptor creation anchors the original unreviewed_added use with the same UUID/head/outbox. Descriptor history has one entry with nested original use and separately attributed current amendment where present, plus its meaningful amendment entry. Descriptor correction versions have initialUse:null. The original body/attribution is never rewritten.
- Product-bound current projection, exact product/slot/publication and owner checks, compatible cross-publication actual-use carry, original known/unknown Start, current pause/stop/different state, backdated contradiction and exact identity answers. Reported-product descriptor correction does not carry old identity answers. Self-purchase writes no finance/order/activation row. Photos[] works; unsupported nonempty product-label IDs return photo_unavailable until the actual lifecycle exists.
- Current full plan-product set, at most50 states, compact original/amendment/identity summaries, byte-bounded reported pages and history with1..100 requested items and possibly smaller returned pages. Cursors bind owner, publication/filter and use head; a changed head conflicts. Historical documents receive explicitly current use, not fabricated historical use. latestPublicReview remains null.
- Captured private DependencyBasisV2 sidecars preserve strict Draft.basis and the complete old plan_basis meaning. New/assigned drafts capture current heads; ordinary saves copy captured sidecars and cannot bless unseen events. Pre-extension drafts are explicitly unresolved. CAS rebase preserves guidance text and creates a new content revision; affected reviews must be repeated. Current gate/readiness/approval/publication and both deferred output paths enforce heads. Historical receipts remain unchanged acknowledgements.
- Existing plan_events/deliveries extended with typed care source keys and publication-specific uniqueness retained. Multiple care events at one publication coexist. Material events atomically create durable advisor attention plus eligible owner/exact configured advisor portal jobs and configured email jobs. No broadcast to all advisors, competing outbox, provider send or accepted/delivered claim. Private saves/rebases and exact retries are silent. Identical descriptor corrections reject invalid_input without a new version/head/request/attention/job.
- Corrected55 dispatcher retained privately; old actions still run through it. New dependency commands use a closed wrapper. R1/R2 and plan-v1 current-use paths that would lie fail use_version_required; lossless documents, existing dates/IDs and committed receipts remain guarded and unchanged. Existing activated instruction/review/reply barriers remain in place. No caller-approved GUC/flag, service-role override or second Auth provider/BFF was introduced.

Final UUID correction is bounded to new care and dependency commands: UUID-typed fields canonicalize before fingerprint/projection, avoiding accepted uppercase UUID inputs losing their state or failing strict receipt binding. Opaque ContentId text and all old plan-action parsing remain unchanged. A new parser RED and direct SQL UUID-case test verify this.

Deterministic use ordering maps known occurred dates to midnight America/Chicago, uses actual recording/amendment instants for unknown occurrence, then recording order/revision. A late native RED showed that a SQL session timezone could otherwise let a known-date Start outrank a newer unknown pause. UTC/Honolulu/Tokyo now agree. New recording/amendment/receipt timestamps use one actual server instant serialized in UTC; they never supply a missing occurred/Start date.

A separate legal amendment to initial unreviewed use exposed an overly strict mapper null-amendment condition. The original creation remains unchanged with a separate attributed amendment, as AttributedUseEvent specifies. Selected-product history may match its original or corrected nested use target. Descriptor correction versions still carry no initialUse. Native cases25/26 and the focused mapper case cover same-product and product-changing corrections without duplicate creation/use entries.

## Executed final verification

All Node executions use explicit Node22.23.0. Native PG uses PostgreSQL15.19 at /opt/homebrew/opt/postgresql@15/bin, cleared ambient PG variables, no password/service file, one unique owned socket and no TCP. Source is this worktree only, not apps/portal/backend/source or a dirty root checkout. The actual care and retained Plan handlers/parsers/mappers execute in the native bridge; only the Auth identity port and session claims are synthetic. This is not genuine JWT/Auth/PostgREST/browser acceptance.

| Check | Actual result |
| --- | --- |
| Initial strict contract RED | Missing new module, then meaningful parser/response/budget checks added; early19 focused cases green. |
| Initial missing-SQL RED |3 assertion failures,0 errors through actual handlers; no care RPC/dependency implementation yet. |
| Expanded REDs | Absent advisor status, missing initial-use projection, wrong amendment effective ordering, legacy R2 lossy reader, duplicate descriptor alert, session-timezone ordering, uppercase UUID binding and overly strict initial-use amendment projection. Setup-only SQL precedence/ambiguous-variable/fixture immutable-cancellation and Python quoting issues were separately corrected; none is counted as product acceptance. |
| Fresh prepare/replay |15 canonical concierge prerequisites +54 +55 +56; exact original IDs/bytes/dates/Start/money preserved; no seeded owner/principal/routes. The55 dispatcher prosrc is unchanged behind its private retained name. This is not the full56-migration canonical reset. |
| python3 tests/portal-care-native.py | **26 passed**,0 failed/skipped,44.038s. Latest full run native-final26.log. |
| Six focused root contract/handler files | **37 passed**,0 failed/skipped. Includes unchanged19 first-slice checks and new care checks, actual fixed runtime transport, UTF8 max/boundaries and positive/negative mapping. |
| Strict bounded compiler, all new contracts/tests and actual imported handlers/runtime | Exit0, zero errors, --strict/--noEmit/ES2022/bundler/allowImportingTsExtensions; installed parent TS6/compiler types used without dependency or flag changes. |
| Actual retained Plan handler after Stop | HTTP409 with exact body {code:'use_version_required'} over the new SQL. Existing pause case also asserts409. Shared planErrorStatuses already included the code in408ccab; no unnecessary old-handler change. |
| Source-valid near500k UTF8 PlanContent + all50 paused states + bounded descriptor page | Maps below1,800,000bytes; missing product/oversized page reject.100-photo shape stress is conservative; actual nonempty photo commands remain unsupported and denied. |
| UTF8 history byte boundary | Exactly400000bytes accepted,400001 rejected. Persisted105 reported descriptors paginate completely with smaller byte-bounded pages; changed-head cursor conflicts. |
| Preservation rehearsal | All55 source migrations unchanged; original R1/R2/publication/intake/activation/receipt/payment/period/entitlement data preserved. A pre-extension V3 publication/receipt/event/delivery snapshot remains equal, excluding only new source metadata columns. Old approval receipts are not rewritten. |
| Current authority/concurrency | Natural session expiry after real client wait; real cancellation before waiting write; source wait across session expiry/permission deletion; CAS one-winner/retry; transactional queue rollback; explicit rebase/new human review/later publish; deferred head-change rollback. |
| Catalog role/RLS/search-path audit |12 care/dependency tables, RLS enabled;0 raw privileges,0 private helper/base EXECUTE grants,0 unpinned search paths across anon/authenticated/service_role. Public plan/care RPC role matrix false/true/false.0 other owned DB connections after tests. |
| Canonical pgTAP | New portal_care_use_v1.test.sql contains26 meaningful metadata/invalid-input/cursor/ACL/RLS/constraint checks; **not executed**, installed Homebrew PG has no pgTAP. |
| Full root/portal/session/types/Expo web | **Not run in child**, root and portal dependencies are absent. No blind latest install, dependency/config change, disabled TS flag or package edit. Parent owns complete integrated checks. |
| Full Supabase reset, real Auth/Edge/PostgREST/cookie/Vault/browser, security advisors, exact-head CI | **Not executed here**, require the parent's new canonical snapshot and independent review. No R4 reuse. Deno is absent; no served Edge-index claim. No mobile/native runtime change or iOS claim. |
| git diff --check; final owned path/source/secrets review | Passed before final commit. No frontend, gateway, session, common navigation, package/lock, old migration or coordinator status/CONTEXT_SYNC edit. |

Exact focused commands:

```sh
export PATH=/Users/kanuj/.nvm/versions/node/v22.23.0/bin:/opt/homebrew/opt/postgresql@15/bin:$PATH
export PYTHONDONTWRITEBYTECODE=1
export SHELV_CARE_SOCKET=/tmp/sh-care-caf2b712-aff09be9
python3 tests/portal-care-native.py --prepare
python3 tests/portal-care-native.py
node --experimental-strip-types --test tests/portal-care-contract.test.ts tests/portal-care-handler.test.ts tests/portal-rebuild-domain.test.ts tests/portal-rebuild-handler.test.ts tests/portal-rebuild-advisor-reads.test.ts tests/portal-rebuild-advisor-handler.test.ts
node /Users/kanuj/.t3/worktrees/shelv/kanuj-portal-rebuild-integration-20261030/node_modules/typescript/bin/tsc --ignoreConfig --noEmit --strict --allowImportingTsExtensions --target es2022 --module esnext --moduleResolution bundler --types node --typeRoots /Users/kanuj/.t3/worktrees/shelv/kanuj-portal-rebuild-integration-20261030/node_modules/@types src/contracts/PortalCare.ts src/contracts/PortalCareValues.ts src/contracts/PortalCareValidation.ts src/contracts/PortalCareMapping.ts tests/portal-care-contract.test.ts tests/portal-care-handler.test.ts
```

Native method selectors01..26 are durable in portal-care-native.py. Each uses only the positively marked owned fixture. Reproduction must first restart that exact owned data directory and inspect fixture.json, marker, socket, port and empty listen_addresses; --prepare may recreate only this marked disposable database.

## Coordinator handoff and remaining gates

Coordinator explicitly owns a one-line compatibility update to supabase/tests/portal_rebuild_advisor_reads_v1.test.sql:7: subtract only read_draft_dependencies_v1 and rebase_draft_dependencies_v1 before its existing24-command count. Keep all old assertions. This child does not edit that file. The new care test independently asserts26 commands and14 task actions. Parent also owns CARE_API/status/acceptance/CONTEXT_SYNC and the finite cookie/Vault care channel/consumer composition.

Read baseline W7 native scoped PASS/main13/readonly4/H1/H2 and AR1 status403 changes-required report without promoting them to this slice's evidence. Later parent messages attribute fresh AR1R2 scoped PASS, Portal907/session163 at44f9 source, plus parent root1206/18 baseline skips and finite care-channel checks. Those are parent-attributed results, not child executions or current-head care acceptance.

Full canonical56 replay/pgTAP/advisors, actual genuine Auth/Edge/PostgREST/cookie/Vault owner/human/negative journey, connected care UI/history, independent integrated review and exact-head CI remain required. The protected populated55 R4 is historical; create a new canonical snapshot. Empty label photos are supported, actual label storage lifecycle is not. Provider/sink delivery is not claimed. Goal reports/conversations/guidance/source storage/templates/commerce/account/export/delivery modules remain subsequent compatible work; no full portal acceptance is asserted.

Self-review found and addressed the concrete defects recorded above. No known exercised-scope blocker is intentionally parked. This is author verification, not independent security or product acceptance. Public Supabase function/session guidance and changelog were consulted; the relevant PG15.19/TLS notices introduce no platform/configuration change in this Unix-only slice. No model-provider call, hosted action, real client/source/permission write, real email, money, retailer order, browser/Chrome, Docker/Colima, parent credential or parent fixture lifecycle action occurred.

## Returned resource state and evidence

**STOPPED at2026-10-31T05:30:49.814024+00:00.** Verified the exact data directory, database marker, /tmp/sh-care-caf2b712-aff09be9 socket, port55461, empty listen_addresses, original owned PID/command and0 other database connections before stopping. pg_ctl -D <owned-data> -m fast stop succeeded; fresh status exits3/no server running and postmaster.pid is absent. Data and all logs are retained. All owned subprocess/pool/SQL handles are closed; no real Auth handle was issued. No other fixture/process was adopted or stopped. fixture.json records exact process/options/final audit and STOPPED receipt.

Ignored evidence root: .local-artifacts/portal-rebuild/w1-care/.

| Artifact | SHA-256 |
| --- | --- |
| native-final26.log |08e0a2728f4666de8fb1c77705cf6e12cc12d72d63edcf0dfdeba6c8faf4d0c5|
| focused-final.log |f11394389ee380fc020df30d999b4a422505453ce099b0e213953ce4bddd3215|
| final-catalog.json |8c2a2ed4b77187ba72802b49c9ea738782b87b6fb22e650c5f4ee90c4b72f39b|
| preserved-55-migrations.json |6d4cfb764ad841100187245d12b476912aa47fa9971b52af07ab7dbe5302059d|
| fixture-stop.log |ca19178a35ab4153b75b494963b66ce8243e1b94c173107c87b44d09db23652d|
| fixture.json |a4e0e32eb4a797f7fd84172beaf11ae7fb674c8bec8faca6e36c2b7d92a1f40d|

The evidence manifest also retains meaningful red logs, actual Plan-after-Stop proof and sanitized role settings. No private key/token or actual customer source is included. Both live T3 settings tools were rechecked before finalization and still report Sol/xhigh/default; global/project settings and all eight role files match. Full-head acceptance remains with the parent and fresh independent review.
