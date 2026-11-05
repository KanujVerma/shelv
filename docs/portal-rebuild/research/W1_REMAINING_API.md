# W1 remaining API and contract reconciliation

Owner: Kanuj. Research date: 30 October 2026 local task date. Status: **source-backed next-contract proposal for coordinator review**, not implemented, pinned, accepted or release-ready. Sole write-set: this report. This continues [W1 backend reconciliation](W1_BACKEND.md); it does not repeat or replace the first slice, reconstruct another worker's work, or authorize remaining-page fan-out.

## 1. Verified source, runtime and evidence limits

- Requested parent and inspected source HEAD: **`97aa801f58471f8e657d00de1775da7f20f6ee29`**, exact `97aa801`. Workspace: `/Users/kanuj/.t3/worktrees/shelv/t3-e39cb4b1`. Initial branch read `t3/e39cb4b1`; subsequent T3-prepared branch/readback was `t3/w1-remaining-api-reconciliation`, same path and HEAD, clean. No checkout/reset/worktree command was performed by this researcher.
- Local `origin/main` resolves to **`d39a7d4943209080df7c4cf97d85784f462758bf`** and is an ancestor of HEAD (`git merge-base --is-ancestor`, exit 0). This is local ref verification, **not a fresh remote fetch**. The unrelated dirty scanner checkout was neither inspected nor changed. All source claims below refer only to this preserved checkout at `97aa801`.
- Before substantive reconciliation, live `orchestrator_capabilities({search:'gpt-6.1-sol'})` returned `inheritedProviderInstanceId:'codex'`, `inheritedModel:'gpt-6.1-sol'`, `reasoningEffort:'xhigh'`, `serviceTier:'default'`, `full-access/default`. Independent `t3_thread_configuration({})` returned the same provider/model/options/modes. The catalog advertised this exact model and supported `xhigh/default` options. Thread identity in both responses: `thread:delegated-task:command%3Amcp%3A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%3Adelegate-task%3Aportal-rebuild-w1-remaining-api-20261030-r1`. No nested agent, new goal or memory write.
- Read the complete 1,005-line [approved original input](../source/APPROVED_INPUT.txt) in bounded numbered chunks. Complete text comparison confirmed the 282 substantive lines of [desktop specification](../APPROVED_DESKTOP_SPEC.md) match its already-read appendix B. The [D01-D48 register](../APPROVED_DECISIONS.md) differs from the original appendix only by the explicit D39 clarification. Original input/spec bytes were not modified. Also read README, implementation contracts, workstreams, current status, both API freezes, acceptance, and all requested W1 implementation/fix/wait/advisor-read and W7 backend R3/W6 browser reports.
- The parent brief reports the first genuine vertical main chain now passes **13 groups** with independent slice/harness follow-ups active. At this exact source, [W6_GENUINE_BROWSER.md:5](W6_GENUINE_BROWSER.md#L5) still records seven main groups and four independent client groups; [lines 117-146](W6_GENUINE_BROWSER.md#L117) detail that earlier checkpoint. HEAD includes the later payment selection fix `82401b2` and source review `97aa801`. Therefore 13 groups are **parent-reported newer evidence, not reproduced here or silently attributed to the older file**. [CURRENT_STATUS](../CURRENT_STATUS.md) and some acceptance rows also predate that correction. This discrepancy does not reopen the resolved UI issue or declare full acceptance.
- **Subsequent parent-attributed state, received during this research:** canonical `4cf9e34` restores byte-exact `APPROVED_DECISIONS.md` and records the founder's manual never-started draft deletion clarification in `docs/portal-rebuild/DECISION_ADDENDA.md` with separate provenance. Parent `ae5efe3` reports all five imported files hash-match and zero local documentation-link misses. This supersedes the location/provenance arrangement observed at `97aa801`; it does not change D39's resolved behavior or this report's inspected base. The parent also reports integrated final W6 author evidence **main 13 / H1 read-only 4 / guard 6 / cleanup 3**, with independent native review running. These are newer attributed results, not rerun or independently accepted here. No source/base update or counterpart evidence duplication was performed.
- Backend R3's scoped PASS, 55-migration/746-assertion canonical evidence and historical root checks are retained attributed evidence, not fresh executions in this task. Migration **54** `20261030223603_portal_rebuild_plan_v1.sql` and forward **55** `20261031003846_portal_rebuild_advisor_reads_v1.sql` are frozen inputs. The live source has 24 plan actions, fixed parser/mapper/Edge RPC, current gate and immutable advisor publication reads. No full portal completion follows.

Resume/planning guidance was used for state reconciliation and this bounded proposal. Supabase guidance was used for strict privilege/Storage/migration boundaries. This task makes no Supabase platform-version or legal claim and performs no implementation; no hosted/docs network lookup or live Supabase tool was needed. The user's source-only/no-delegation limits override workflows suggesting runtime or nested analysis.

## 2. Recommendation and canonical source map

**Keep the existing plan/publication and finance ledgers. Pin small typed domain extensions, then connect and accept one new domain slice at a time.** Preserve current v1 request/result meanings. Use explicit new read versions for enriched state instead of widening a strict v1 response behind existing consumers. Do not remove activated-candidate fences until their replacement command and insert-time authority invariant are tested together.

References below are exact files/line anchors at the inspected HEAD. `M54`, `M55`, `WF`, `SW` and `PM` abbreviate only the following canonical migrations, never fixture copies.

| Reference | Existing symbols and reusable boundary |
| --- | --- |
| [Types:7-77](../../../src/contracts/PortalRebuild.ts#L7) | `ContentId`, `Known`, `SourceLocation`, `ProvenanceFact`, `PlanContent`, `ExactTarget`, `Publisher`, care-plan-only `ApprovalScope`, `Draft`, `PublishReceipt`, 24-action `PlanCommand`, `ClientPlanView`, `AdvisorGateView`, `AdvisorPublicationView`, `projectClientPlan`. |
| [Validation](../../../src/contracts/PortalRebuildValidation.ts), [mapping:14-44](../../../src/contracts/PortalRebuildMapping.ts#L14), [values](../../../src/contracts/PortalRebuildValues.ts) | `readPlanCommand`, `buildPlanRpc`, `mapPlanResult`, strict field metadata, finite task actions and safe errors. Existing success envelopes reject additional fields; a report signature is not already an accepted command. |
| [Plan Edge handler](../../../supabase/functions/concierge-plans/handler.ts), [runtime](../../../supabase/functions/concierge-plans/runtime.ts) | Actual bearer verification and fixed `concierge_plan_command_v1(p_command jsonb)`. Same authenticated operations for UI and task agents, without browser provider credentials. |
| [M54:7-41](../../../supabase/migrations/20261030223603_portal_rebuild_plan_v1.sql#L7) | `plan_policy`, `plan_principals`, `plan_drafts`, `plan_draft_private`, task grants/revocations, `plan_sources`, source permissions/adoptions, immutable checkpoints/reviews/approvals/requests, `plan_documents`, `plan_publication_receipts`, `plan_events`, deliveries/attempts, schedule, decision heads/state. These actual names supersede first-recon proposed table names. |
| [M54:70-185](../../../supabase/migrations/20261030223603_portal_rebuild_plan_v1.sql#L70) | `plan_session`, `plan_guard`, `plan_target_client`, `plan_authorize`, `plan_basis`, `plan_source_manifest`, `plan_source_scope`, `plan_content_check`, `plan_exact`, `plan_section_hash`, `plan_client_content`. Live identity/session/deletion/assignment/source checks, not editable metadata. |
| [M54:224-265](../../../supabase/migrations/20261030223603_portal_rebuild_plan_v1.sql#L224) | `plan_care_window`, `plan_care_access`, `plan_client_view`: real support and exclusive 30-day read-only boundary, current/historical immutable plan with current Start-only overlay. |
| [M54:317-334](../../../supabase/migrations/20261030223603_portal_rebuild_plan_v1.sql#L317), [395-578](../../../supabase/migrations/20261030223603_portal_rebuild_plan_v1.sql#L395) | Immutable-receipt source reauthorization; exact retry/CAS; deliberate first/later publication; `restore_publication_v1`; bounded merged directory; final after-wait checks and request journal. |
| [M55:13-39](../../../supabase/migrations/20261031003846_portal_rebuild_advisor_reads_v1.sql#L13), [85-182](../../../supabase/migrations/20261031003846_portal_rebuild_advisor_reads_v1.sql#L85) | `plan_advisor_read_guard`, `plan_advisor_read_authorize`, `plan_read_current_approval`, `plan_advisor_publication`, wrapper preserving private `plan_command_base_v1`. Safe view reads differ from private working-draft reads. |
| [WF:29-115](../../../supabase/migrations/20261018234537_concierge_portal_workflows.sql#L29), [177-189](../../../supabase/migrations/20261018234537_concierge_portal_workflows.sql#L177) | Immutable shipping addresses, quotes/claims/confirmations, service periods/entitlements, ready-to-purchase state, payment audit; check-in heads/photos/reports/photo links/private notes; common request/client locks and `workflow_begin`/`workflow_finish`. |
| [PM:3-14](../../../supabase/migrations/20261024234059_concierge_manual_payment_methods.sql#L3), [65-93](../../../supabase/migrations/20261024234059_concierge_manual_payment_methods.sql#L65) | Frozen receiving-method versions/options, claim/evidence linkage, `payment_v2_requests`, `concierge_payment_write_v2` -> private `payment_write_v1_core`. Reuse manual finance, not a new wallet. |
| [SW:3-13](../../../supabase/migrations/20261025221028_concierge_service_workflows.sql#L3), [81-160](../../../supabase/migrations/20261025221028_concierge_service_workflows.sql#L81) | `service_reviews` versus `service_review_private`, instruction draft/publication, retail purchase/private reference, return cases/events/private references, service cancellations; `concierge_service_write`. |
| [Service contract:4-28](../../../src/contracts/ConciergeService.ts#L4), [37-64](../../../src/contracts/ConciergeService.ts#L37) | `ReturnPolicy`, `ServiceCommand`, `ServiceView`, strict `buildServiceRpc`, client/private service mappers. Retain IDs and operational statuses. |
| [Check-in commands:7-41](../../../supabase/functions/concierge-checkins/commands.ts#L7), [handler:57-87](../../../supabase/functions/concierge-checkins/handler.ts#L57), [storage:25-51](../../../supabase/functions/concierge-checkins/storage.ts#L25) | Existing optional-photo reservation/upload/no-upsert/digest retry/completion and server-held signing. Goal IDs/amendments and recording sources are absent, not implemented by these photos. |
| [Gateway plan policy:7-22](../../../apps/portal/session-integration/runtime/server/plan-policy.ts#L7), [client media:29-45](../../../apps/portal/session-integration/runtime/server/client-upstream.ts#L29) | Finite audience actions, strict response mapping; same-origin media proxy validates private signed descriptors internally. Retain cookie/Vault, CSRF, issuer, lease/generation and late-response fences. |
| [Renderer model:29-63](../../../apps/portal/src/features/plan/model.ts#L29), [ports](../../../apps/portal/src/features/plan/types.ts), [unpublished preview](../../../apps/portal/src/features/plan/preview.ts) | One `PlanRenderView`, product-bound evidence/routine, Start-only model, separate unpublished preview and in-memory demo capability. Extend shared model, never generate client pages. |

### Exact fences to preserve and extend

[M54:596-627](../../../supabase/migrations/20261030223603_portal_rebuild_plan_v1.sql#L596) has insert barriers on publications, instruction publications, service reviews and check-in replies, plus deferred complete V3 publication linkage. [M54:640-710](../../../supabase/migrations/20261030223603_portal_rebuild_plan_v1.sql#L640) wraps old public writers/readers:

- Activated **new** `publish`, `publish_v2`, `publish_instruction_revision`, `record_review`, `send_advisor_reply` deny `content_version_required`; exact historical committed receipts remain separately authorized and return without rerunning effects.
- Legacy `save_draft`/`save_draft_v2` cannot compete with an adopted/new assigned draft. V3 presence additionally fences `decide`, `receive`, `start`, `save_instruction_draft` and old lossy plan/advisor/preview reads. Keep explicit legacy adoption; do not recreate it.
- Existing `submit_report`, `reserve_photo`, `complete_photo` remain callable under activated active-care/session fences, including after waits. They do **not** acquire new goal/amendment/outbox semantics automatically.
- V3 product quote/purchase limitations are also structural: [WF:352-359](../../../supabase/migrations/20261018234537_concierge_portal_workflows.sql#L352) resolves `publications.recommendations`/`item_states`; [SW:121-124](../../../supabase/migrations/20261025221028_concierge_service_workflows.sql#L121) uses the same legacy recommendation join. V3 writes deliberately store `recommendations=[]` ([M54:498](../../../supabase/migrations/20261030223603_portal_rebuild_plan_v1.sql#L498)). These operations fail their old product predicates; they are not all explicit version-error wrappers. Add a version-aware resolver and truthful bounded error, never fake R1 price rows.
- `plan_events.kind` is presently only `plan_published`, with a `(client,publication,kind)` uniqueness key and non-null publication FK. It cannot safely represent many reports/reviews at one publication without a forward event-source extension.

## 3. Common next-contract rules

All signatures below are **proposed finite wire schemas**, not additions made to root contracts. The coordinator should pin final names and DTO fixtures before implementation. Prefer focused root modules `PortalCare*`, `PortalGuidance*`, `PortalSources*`, `PortalTemplates*`, `PortalCommerce*`, `PortalAccount*`, `PortalNotifications*`, `PortalWorkspace*`; each exports strict commands/results and fixed RPC mapping. Keep `PortalRebuild*` as the stable first-slice composition seam. A new family is one fixed function/Edge route, never caller-selected SQL/RPC/URL. Reuse existing transports and domain ledgers, not another BFF/backend.

Notation used throughout:

```ts
type Day = string; // strict valid YYYY-MM-DD
type Instant = string; // server UTC timestamp
type Hash = string; // server canonical SHA-256
// Reuse UUID, ContentId, Revision, Known<T>, SourceLocation, Publisher,
// Schedule and ClientPlanView from the inspected plan contracts.
type PublicationRef = {clientId: UUID; version: number; documentSchemaVersion: 1|2|3};
type ClientPublicationRef = Omit<PublicationRef,'clientId'>;
type Occurrence = {occurredOn: Known<Day>; channel:'portal'|'text'|'call'|'video'|'in_person'};
type Write = {requestId: UUID};
type Page = {cursor:string|null; limit:number}; // 1..100, no lifetime version cap
type EventRef = {kind:'legacy_report'|'goal_report'|'conversation'|'use'|'review'|'reply'|'instruction'; id:string};
type EventReceipt = {requestId:UUID; event:EventRef; revision:Revision; recordedAt:Instant; notificationEventId:UUID|null};
type AmendmentBody = {occurredOn:Known<Day>; reason:string; correctedText:string};
```

Every family has envelope `{schemaVersion:1,action:<closed literal>,...}` unless explicitly v2/v3 below, positive response mapping, and a fixed `request_status_v1 {requestId}` returning only its currently authorized immutable receipt or `absent`. Cross-family UUID reuse with a different command rejects using the existing request lock/journal collision discipline. No `Record<string,unknown>` or arbitrary patches as a public escape hatch. Text/array/byte bounds follow existing validators; all newly introduced limits become TS/SQL/gateway equality tests. Read pagination limits are not deletion/retention caps.

Server derives client owner for client operations, recorder/actor/provider session, recording/publication times, hashes and authorization. Advisor variants explicitly name `clientId` and verify target rights. Do not put a client selector into a client request. Exact retry rechecks current rights and returns the same receipt; new payload with same request ID conflicts. A lost response is uncertain until status/reread confirms it. Preserve request -> sorted client -> domain row lock ordering **after** policy/principal/session/grant locks; recheck authority/expiry/source/deletion/care after waits and before cached/private returns. New event heads are separate from existing content/finance/decision heads.

Use existing safe HTTP semantics: invalid 400, session 401, denied 403, unavailable entity 404 without cross-client disclosure, CAS/authority conflict 409, bytes 413, MIME 415, rate limit 429, transport/uncertain 503. Exact content approval is scoped to one draft kind/target/publisher and never a general authorization override. Neither new public reviews nor payment/notification retry can call the first-service activation branch a second time.

## 4. Actual use, exact identity and one renderer (D08-D11, D18, D26-D31)

**Current:** [ClientPlanView:62](../../../src/contracts/PortalRebuild.ts#L62) and [M55:143](../../../supabase/migrations/20261031003846_portal_rebuild_advisor_reads_v1.sql#L143) contain only `{slot,productId,startedOn,publicationVersion}` from immutable `activations`. They cannot express unknown Start, stop, pause, different use, acquisition or reporter/recorder. `routineFor` currently keys that Start projection by slot; `productContext` finds Start by product. Neither purchase nor receipt may supply missing dates. `PlanProduct.identity` and `.formula` are separate already; keep that distinction.

**Proposed:** append `care_use_events`, `care_identity_events`, `care_event_amendments` and a per-client `care_use_heads` in `concierge`; project legacy activation IDs/dates as immutable legacy origins without copying or changing them. An amendment references the prior event plus exact amendment head, not UPDATE. A new Start never overwrites the original activation. Reported use overlays advice rather than changing `plan_documents`.

```ts
type PlanProductRef = {kind:'plan_product'; publication:ClientPublicationRef;
  productId:ContentId; slotId:ContentId|null};
type ReportedProductRef = {kind:'client_reported_product'; reportedProductId:UUID; version:number};
type ProductRef = PlanProductRef|ReportedProductRef;
type ReportedProductBody = {name:string; brand:Known<string>; variant:Known<string>;
  strength:Known<string>; sizeLabel:Known<string>; labelPhotoIds:UUID[]};
type IdentityTarget = {subject:ProductRef; comparedWith:PlanProductRef|null};
type IdentityAnswer = {match:'yes'|'no'|'not_sure';
  reportedName:string|null; variant:Known<string>; strength:Known<string>;
  labelPhotoIds:UUID[]}; // completed private product-label sources (section 7), no URLs
type UseChange =
  | {kind:'started'; startedOn:Known<Day>}
  | {kind:'paused'|'stopped'; details:string|null}
  | {kind:'different'; frequency:Known<string>; amount:Known<string>; details:string}
  | {kind:'unreviewed_added'; details:string|null};
type AttributedUseEvent = {eventId:UUID; product:ProductRef; change:UseChange;
  sourcePublication:ClientPublicationRef|null; occurredOn:Known<Day>; recordedAt:Instant;
  reportedBy:UUID; recordedBy:UUID; channel:Occurrence['channel'];
  acquisition:'shelv'|'self'|'already_owned'|'unknown'; identityEventId:UUID|null;
  originalActivationId:string|null; amendmentHeadId:UUID|null};
type EffectiveUse<P extends ProductRef> = {product:P;
  state:'not_reported'|'using'|'paused'|'stopped'|'using_differently'|'unreviewed';
  originalStart:Known<Day>; latestEvent:AttributedUseEvent|null;
  identity:{eventId:UUID; target:IdentityTarget; answer:IdentityAnswer;
    sourcePublication:ClientPublicationRef|null; occurredOn:Known<Day>; recordedAt:Instant;
    reportedBy:UUID; recordedBy:UUID; channel:Occurrence['channel']}|null};
type UseProjection = {revision:Revision;
  planProducts:EffectiveUse<PlanProductRef>[]; // complete for this bounded document
  reportedProducts:{items:EffectiveUse<ReportedProductRef>[];nextCursor:string|null}};
type PublicReviewSummary = {reviewId:UUID; publicationVersion:number;
  publishedAt:Instant; occurredOn:Known<Day>; conclusion:string; rationale:string;
  nextStep:string; nextReviewOn:Day|null};
type ClientPlanViewV2 = Omit<ClientPlanView,'schemaVersion'> & {schemaVersion:2;
  use:UseProjection; latestPublicReview:PublicReviewSummary|null};
```

`planProducts` is bounded by the existing document product/slot limits, with one effective state and at most one latest attributed event/identity per exact product/slot. Client-reported products have their own bounded 1..100-item current-state page and cursor; historical events never accumulate in this read. `read_reported_products_v1` retrieves further effective current-state pages. Full attributed use/identity/amendment history is a separate cursor-paginated history projection. A cursor binds selected publication/filter and use-head revision; a changed head rejects with conflict/reload rather than silently skipping/duplicating rows. Arrays are not unbounded event ledgers. The effective state may reflect the latest amendment to an earlier event; its `latestEvent` links the actual amendment head and preserves original dates/attribution.

`actualUse` retains its existing Start-only field semantics and original IDs/dates in v1; never put a made-up date/status into it. `read_client_plan_v2 {version:number|null}` and `read_advisor_publication_v2 {clientId,version}` return the explicit enriched projection. The advisor v2 envelope retains actual `reviewSchedule/clientAccess`, not a fake active client. New candidate renderer consumers must switch atomically to v2 before enabling writes whose meaning v1 cannot represent; if an old current-use reader would present a stopped product as current, return a version-required error for that enriched current state rather than silently truncate it. Lossless R1/R2 document/history reads remain available through the appropriate adapter. Published content itself is unchanged.

Fixed proposed `concierge_care_command_v1(p_command jsonb)` commands:

| Action | Fields beyond common envelope | Result and authority |
| --- | --- | --- |
| `report_unreviewed_product_v1` | `Write`, `expectedUseRevision`, `product:ReportedProductBody`, `sourcePublication:ClientPublicationRef|null`, `Occurrence`, `acquisition` | Atomically create an owner-scoped immutable reported-product version and `unreviewed_added` event; return `{receipt:EventReceipt,product:ReportedProductRef}`. No catalog/plan product or Start is created. |
| `amend_reported_product_v1` | `Write`, `expectedUseRevision`, `product:ReportedProductRef`, `replacement:ReportedProductBody`, `reason` | New immutable reported-product version and amendment event, preserving the original. Old identity answers do not silently apply to the new version. |
| `report_identity_v1` | `Write`, `expectedUseRevision`, `target:IdentityTarget`, `answer:IdentityAnswer`, `sourcePublication:ClientPublicationRef|null`, `Occurrence` | `EventReceipt`; client owner and active care. Answer binds exact subject version and optional exact comparison publication/product; yes is not formula verification. |
| `report_product_use_v1` | `Write`, `expectedUseRevision`, `product:ProductRef`, `change:UseChange`, `sourcePublication:ClientPublicationRef|null`, `Occurrence`, `acquisition`, `identityEventId:UUID|null` | `EventReceipt`; client can stop/pause/change without advisor approval. Known Start is explicit date; unknown stays unknown. `unreviewed_added` is allowed only for an existing client-reported product; creation is the explicit command above. |
| `record_client_use_v1` | Same exact use fields plus `clientId`, `confirmedClientReport:true` | Advisor edit and active care; server fixes `reportedBy=clientId`, `recordedBy=actor`. No agent pretending to be the client. |
| `record_client_unreviewed_product_v1` | All `report_unreviewed_product_v1` fields plus `clientId`, `confirmedClientReport:true` | Same atomic reported-object/event creation with actual advisor recorder and client reporter; no plan/catalog identity or Start. |
| `amend_use_v1` | `Write`, `expectedUseRevision`, `eventId`, `expectedAmendmentHeadId:UUID|null`, `replacement:{product:ProductRef,change:UseChange,sourcePublication:ClientPublicationRef|null,occurredOn:Known<Day>,acquisition,identityEventId:UUID|null}`, `reason` | Append-only attributed correction, advisor flag and event. Client owns own report; advisor-recorded corrections retain actual recorder. |
| `read_reported_products_v1` | `cursor`, `limit`, `expectedUseRevision`, `publicationVersion:number|null` | Further owner-scoped effective client-reported product states, not full events. Same care/read-only rules as current plan read. |
| `read_use_history_v1` | `product:ProductRef|null`, `cursor`, `limit` | Owner-scoped immutable events/amendments with next cursor; advisor variant explicitly `clientId`. |
| `read_client_plan_v2` | `version:number|null` | Owner inferred, entitled care window; positive v2 mapper. |
| `read_advisor_publication_v2` | `clientId`, `version:number|null` | Safe view permission and explicit finite task action/scope when applicable; no private source grant. |

Plan-product reports bind the exact immutable publication/product/slot. A newly added product absent from that publication instead gets a server-issued `reportedProductId` in a private `care_reported_products/care_reported_product_versions` namespace, **not** a catalog ID, plan `ContentId`, fake slot or synthetic recommendation. Its versioned reported name/variant/label is a client claim. A later match to an advised product is an explicit `IdentityTarget` comparison; it never edits the publication or relabels the reported object. Identity answers and use events reference the exact object/version they concern. For a plan-product subject `comparedWith` is null or that identical exact plan reference; cross-client/arbitrary product comparisons reject. For a reported subject a non-null comparison identifies the actual plan product being matched. A changed reported descriptor needs a new answer; no automatic identity promotion from appearance.

Self-purchase skips Shelv money/order state entirely. For `no/not_sure`, accept the report but show unresolved/unreviewed identity; only a confirmed exact match may become the advised replacement in the routine. A report of a different/unreviewed product remains visibly unreviewed even when it has its own explicit reported Start. `unreviewed_added` alone supplies no Start. Do not block stop reports because receipt, choice, label photo or formula is missing. Missing material identity blocks dependent advice/purchase readiness, not reporting the concern.

For known occurrence dates, reject future/impossible dates; unknown occurrence sorts by recording order with an explicit unknown label. A backdated report must not silently replace a newer effective event; project deterministic occurred/recorded ordering, expose contradictions and allow an attributed amendment. Known start plus unknown stop date must suppress an unqualified continue instruction promptly rather than invent stop date. Existing original Start remains inspectable. The legacy v1 Start projection is not rewritten to simulate these new states.

### Additive dependency heads without changing strict v1 basis

`Draft.basis` is exactly `{publicationVersion:number|null,useRevision:Revision}` and [M54:121-122](../../../supabase/migrations/20261030223603_portal_rebuild_plan_v1.sql#L121) derives `useRevision` from `max(activations.id)`. Preserve that function's legacy result shape/meaning and every persisted historical body/receipt; **do not** treat that maximum as the new use event revision, add report fields to `DraftView.basis`, or change a strict v1 mapper to tolerate unknown keys.

Add private immutable `plan_draft_dependency_bases(draft_id,content_revision,dependency_schema_version,heads)` and separate per-client `care_use_heads`, `care_report_heads`, and instruction dependency head. Captured sidecar schema 2 is `{legacyBasis:{publicationVersion,useRevision},useHead:Revision,reportHead:Revision,instructionHead:Revision}` plus exact relevant report/amendment/source-reference dependencies. New private `plan_dependency_basis_v2(c)` reads these heads without replacing `plan_basis(c)`. Existing draft content can remain schema 1; it is the review basis that is versioned.

```ts
type DependencyBasisV2 = {schemaVersion:2;
  legacyBasis:{publicationVersion:number|null;useRevision:Revision};
  legacyBasisManifestHash:Hash; // exact retained intake/baseline/publication manifest
  useHead:Revision;reportHead:Revision;instructionHead:Revision;
  references:{event:EventRef;amendmentHeadId:UUID|null}[]};
```

Add two finite plan-module seams before enabling these writes:

- `read_draft_dependencies_v1 {draftId,contentRevision,assignmentRevision}` -> `{draftId,contentRevision,assignmentRevision,captured:DependencyBasisV2,current:DependencyBasisV2,needsRebase:boolean,affectedSections:SectionId[]}`. This is a distinct strict envelope, not fields silently added to `DraftView`.
- `rebase_draft_dependencies_v1 {requestId,draftId,expectedContentRevision,expectedAssignmentRevision,expectedHeads:{useHead,reportHead,instructionHead},expectedLegacyBasis:{publicationVersion,useRevision},expectedLegacyBasisManifestHash}` -> ordinary new-revision `DraftView` plus a separately read dependency envelope. It captures the exact inspected current heads under locks, increments content revision even if guidance text is unchanged, preserves content bytes and requires affected human reviews again. It is not an approval or an automatic acceptance of the new client report.

Forward private readiness/section-hash/exact-target helpers incorporate the sidecar version and dependency hashes while retaining old public DTO shapes. Material use/report/amendment commits advance their own relevant head and append attention atomically. Private bookkeeping notes do not advance a clinical dependency head unless an explicitly recorded new clinical basis is introduced. Existing draft sidecars remain captured at the prior head, so readiness returns existing `basis_conflict` and current gate approval becomes null; final approval/publication and deferred output guards repeat the dependency check under shared client locks. Section hashes compare the current relevant dependency fingerprint with the captured one, invalidating the affected context/decision/routine/follow-up reviews; unaffected sections can retain exact dependency-matching reviews. Immutable historical section-review rows/approval receipts are not edited. New targets after deliberate rebase have new server hash/content revision, so old approvals cannot replay.

New drafts capture current sidecars when created/assigned; pre-extension working drafts are explicitly initialized from the preserved legacy basis and marked needing dependency review before enhanced publication. A v1 save must not silently bless unseen report/use heads: preserve its captured sidecar until the explicit rebase, then use the new body revision with that captured basis. The coordinator must place these checks in every approval/current-gate/publication/deferred-constraint path, not only the new UI. Existing cached write/status receipts remain immutable historical save results, freshly authorization-checked, never fresh readiness/approval evidence. Additions do not mutate canonical publication/Start dates, legacy basis numbers or old receipt bytes.

Shared `PlanRenderView`/`routineFor`/`productContext` consume one normalized advice-plus-effective-use model for client, preview, historical and demos. A paused/stopped reported product remains visible with its report/reason; instructions and timeline retain attribution. Client-reported products get their own unreviewed display without insertion into authored routine slots. Authored stages keep `automaticAdvance:false`; unknown Start supplies no elapsed-day anchor. `latestPublicReview` is the latest relevant **published** conclusion, not private conversation text, pending agent proposal or latest autosave. On a historical page label current effective use versus historical document explicitly.

**Required tests:** newly reported product absent from plan/catalog creates only a reported-product object; exact object/version identity binding and correction; effective state/latest attribution with bounded current pages and separately paginated history; new heads leave strict v1 basis/receipt/publication bytes unchanged, affected reviews/gate invalidate and explicit stale-head rebase conflicts; no date/status from approval/payment/receipt/delivery; known/unknown Start; same-category IDs and exact variant yes/no/not-sure; stopped retained baseline and stopped introduced product both suppress continue guidance; self-purchase without quote/order; different product never activates proposed one; advisor attribution, stale/concurrent amendments, original activation byte equality; event/basis invalidation and advisor alert committed atomically; read-only/ended and cross-client denials; one renderer with every mode and all existing product-specific guidance intact.

## 5. Goal reports, conversations, amendments and exact guidance (D12, D19-D25, D32-D34)

**Reuse:** `checkin_reports`, `checkin_photos`, `report_photos`, `checkin_notes`, `checkin_replies`, `service_reviews/service_review_private`, instruction records and common service head/journal. [Check-in command:20-41](../../../supabase/functions/concierge-checkins/commands.ts#L20) supports comfort/consistency/changes and separate private note/reply but no goal answers or amendment. [SW:97-115](../../../supabase/migrations/20261025221028_concierge_service_workflows.sql#L97) supports conversation review and instruction publication, but activated public insertion is fenced. No existing `ApprovalScope` beyond `care_plan.publish` exists. Do not enable old `record_review` or `send_advisor_reply` just because an advisor can edit.

Add typed report detail/amendment/attention sidecars around original report IDs where representable; do not mutate the original three strings to fit new semantics. New goal reports can retain a `checkin_reports` anchor with explicit typed detail rather than a second competing report identity. Conversations without a form need their own immutable record, not a fake client form. Private note bodies use separate authorized storage/projection throughout.

```ts
type GoalReportBody = {publication:ClientPublicationRef;
  answers:{goalId:ContentId; change:'better'|'same'|'worse'|'not_sure'}[];
  comfort:string|null; actualUseEventIds:UUID[]; notes:string|null; photoIds:UUID[]};
type ConversationBody = {publication:ClientPublicationRef; occurredOn:Known<Day>;
  channel:'text'|'call'|'video'|'in_person';
  clientReported:{text:string; sources:SourceLocation[]}[];
  advisorConclusions:{text:string; sources:SourceLocation[]}[];
  agentProposals:{text:string; sources:SourceLocation[]}[];
  contradictions:{left:number; right:number; category:'client_report'|'advisor_conclusion'|'agent_proposal'; note:string}[]};
```

Proposed care commands, with the same family/status rules as section 4:

- `submit_goal_report_v1 {requestId,expectedReportRevision,body:GoalReportBody,occurredOn:Known<Day>}` -> `EventReceipt`. Owner, active care, goal IDs from the stated publication, optional answers/notes/photos. No form/photo prerequisite for support/refund. Partial answers remain honest; never fabricate answers for every goal.
- `amend_report_v1 {requestId,expectedReportRevision,event:EventRef,expectedAmendmentHeadId:UUID|null,replacement:GoalReportBody,occurredOn:Known<Day>,reason}` -> append receipt. Legacy report amendment uses an explicit legacy-body branch `{comfort,consistency,changes,photoIds}` so old originals remain exact.
- `record_conversation_v1 {requestId,clientId,expectedReportRevision,body:ConversationBody}` -> immutable advisor-only conversation receipt. Advisor edit plus source permission for each locator; agent-proposed text remains proposal, never automatically human-recorded conclusion. A later public review positively selects publishable summary.
- `append_private_review_note_v1 {requestId,clientId,reviewEvent:EventRef,note}` -> private immutable note receipt. No public field or client notification. It must not surreptitiously change a reviewed clinical basis; a basis change is a new guidance revision.
- `read_care_history_v1 {cursor,limit,version:number|null}` and `read_advisor_care_history_v1 {clientId,cursor,limit,version}` -> section 6 projections, separate public/private mappers.

Every material report/use/goal correction appends advisor attention plus transactional configured email event in the same commit. Amendment of already-reviewed input sets an unresolved review flag linked to that exact prior review and changes dependent guidance hashes; it does not alter the prior conclusion or make the client wait for permission to correct their report. Goal changes are reports, never immediate edits to professional goals in a publication. Completed optional private photo references are ownership checked; no photo bytes/source paths in timeline/email.

### Bounded versioned review/instruction/reply publication

Prefer a small guidance-draft module rather than changing `Draft.kind:'care_plan'` or its one-working-plan index to mean three different entities. Reuse exact-target concepts and existing immutable output tables, with new **typed linkage records and deferred guards**. Proposed fixed `concierge_guidance_command_v1(p_command jsonb)`:

```ts
type GuidanceBody =
 | {kind:'review'; publication:PublicationRef; reportRefs:EventRef[];
    occurredOn:Known<Day>; channel:Occurrence['channel'];
    clientReport:string; conclusion:string; rationale:string;
    changes:string[]; nextStep:string; nextReviewOn:Day|null}
 | {kind:'instruction'; publication:PublicationRef; slotId:ContentId; productId:ContentId|null;
    baseInstructionId:UUID|null; baseInstructionVersion:Revision;
    directions:string[]; cautions:string[]; schedule:Schedule; reason:string;
    effectiveOn:Day; reviewId:UUID|null}
 | {kind:'reply'; publication:PublicationRef; reportRef:EventRef;
    reply:string; nextStep:string|null};
type GuidanceTarget = {draftId:UUID; clientId:UUID; kind:GuidanceBody['kind'];
  revision:Revision; contentHash:Hash; basisHash:Hash};
type GuidanceDraftView = {target:GuidanceTarget; body:GuidanceBody;
  reviewed:boolean; issues:{path:string;code:string}[]};
type GuidanceReceipt = {requestId:UUID; target:GuidanceTarget;
  record:EventRef; publishedAt:Instant; notificationEventId:UUID;
  firstServiceStarted:false};
```

| Action | Exact fields | Result |
| --- | --- | --- |
| `create_guidance_draft_v1` | `Write`, `clientId`, `body:GuidanceBody` | `GuidanceDraftView`; safe incomplete storage allowed, scoped client/basis fixed. |
| `read_guidance_draft_v1` | `draftId` | Authorized private draft view. |
| `save_guidance_draft_v1` | `Write`, `target:GuidanceTarget`, `body` | CAS same kind/client; new revision/hash, review/approval stale. |
| `review_guidance_v1` | `Write`, `target` | Authenticated eligible human review, not a model boolean. |
| `approve_guidance_v1` | `Write`, `target`, `publisher:Publisher`, `scope:'review.publish'|'instruction.publish'|'reply.publish'` | New exact scoped approval ID, never a care-plan approval reused. |
| `publish_guidance_v1` | `Write`, `target`, `approvalId` | `GuidanceReceipt`; current coverage, live approver/publisher/source/task authority and complete exact basis. |
| `revoke_guidance_approval_v1` | `Write`, `approvalId`, `expectedPolicyRevision` | Audited revocation, no erased issuance. |

Immutable guidance draft revisions include the exact source versions, report/amendment heads, publication/slot/product/instruction basis and section-review identity in server hashes. Content/source/amendment/reassignment/policy changes invalidate exact authority; unrelated payment bookkeeping does not. Agent publication still needs Kanuj's exact publisher grant, independently of Sami policy. Agent edit requires separately allocated finite task actions; no agent self-review/approval. A public reply is guidance, not an unbounded operational acknowledgement loophole.

A forward migration must replace the relevant instruction/review/reply insert barrier with a persisted typed approval/output/receipt/outbox linkage invariant in the **same accepted slice**. Keep unversioned old wrappers denied. Do not use a GUC, service-role caller, `approved:true`, function name or new approval ID as a generic bypass. Each output verifies exact kind and target; deferred failure rolls back output, consumption and notifications. Existing review/reply rows remain immutable; enriched conclusion/next-step/basis fields live in an immutable versioned sidecar. `service_review_private` and appended private notes never enter that sidecar's public projection.

A no-change review writes the actual conclusion/history/email/portal event with **no new `publications.version`**, service activation, purchase or Start. Instruction-only publication writes a new instruction revision retaining original product/publication/Start; reply writes its specific report reply. New V3 instruction basis must resolve the canonical V3 product/slot plus current reported-use state; the old baseline/activation-only resolver is insufficient. Product changes requiring a new care plan use existing care-plan workflow. Guidance cannot publish before the first paid entitled plan or after care writes end, and cannot accept a first-service claim to start service again.

**Required tests:** all optional-report combinations; goal/publication binding; advisor conversation never masquerades as client form; public/client/agent provenance distinctions; append-only edits/flagging after review; private note/photo/source canaries excluded from API/export; no-change review leaves version/clocks/Start equal; correct instruction basis and effective date; wrong-kind approval replay, stale report/source, inactive coverage, expired/revoked task during waits, direct old RPC/private insertion denial; one output/outbox on concurrent exact retry and rollback on linkage failure.

## 6. Meaningful history, snapshots, restore and final export (D32, D38, D47)

**Already implemented:** current/specific version reads, immutable V3 and lossless legacy documents, `restore_publication_v1` and source-adoption scope. [M54:547-560](../../../supabase/migrations/20261030223603_portal_rebuild_plan_v1.sql#L547) checks current working draft ID, archives that exact working draft, copies authorized original content, preserves origin and adds lawful source-adoption rows. Reuse it; do not build another restore engine. No arbitrary version deletion cap exists in this slice; directory page size is not one.

Proposed `CareHistoryPage` has `{entries, nextCursor}`. Each entry is a strict union of publication, reported use, identity correction, report/amendment, published review/reply/instruction, with stable original record reference, occurred known/unknown date, recorded time, channel, reporter/recorder, public report/conclusion/rationale/next step and linked version. Do not flatten source facts, private notes, imports or autosaves into the client timeline. Advisor audit uses a separate positively authorized projection of imports/reviews/approvals/notes. Retain all originals and amendments with pagination, never only the latest N versions.

Proposed additional reads:

- `list_client_versions_v1 {cursor,limit}` -> `{versions:{publication:ClientPublicationRef,publishedAt:Instant,current:boolean}[],nextCursor}` under actual entitlement and care window.
- `read_client_snapshot_v1 {version:number}` -> `{publication,document:NonNullable<ClientPlanView['plan']>,instructionRefs:EventRef[],reportCutoff:Instant}`. Freeze/identify the historical instruction/event cutoff; current effective-use overlay remains explicitly separate rather than retroactively asserted as historical use.
- `prepare_final_plan_export_v1 {requestId,expectedFinalVersion:number,expectedInstructionHead:Revision}` -> `{exportId,publicationVersion,instructionIds:UUID[],createdAt,expiresAt,contentHash}` after server resolves the actual last entitled version/current applicable instructions. Browser downloads via fixed same-origin authorized byte route, not a signed Storage/provider URL. Exact retry returns the same snapshot or authorized absence, never silently exports a newer version.

At the [M54:224-238](../../../supabase/migrations/20261030223603_portal_rebuild_plan_v1.sql#L224) exclusive care cutoff, reject plan/history/photo reads and care writes. Final export is created/downloaded while the care window permits it and offered proactively at departure; after cutoff unfinished administration is not a backdoor to care/source bytes. Offline copies already delivered do not create ongoing portal access. Last-entitled means an actual entitlement, not highest unentitled advisor publication. Export includes current instructions, limitations and necessary practical guidance; excludes private notes, raw sources/locators, agent credentials and operational/private references.

Current restore authorizes the original private source body against **current** active source/version/permissions. After legitimate raw-source expiry it may therefore refuse restoration even though the public historical plan remains readable. Bounded remedy: a separately typed `restore_public_snapshot_v1 {requestId,clientId,publicationVersion,expectedWorkingDraftId}` creates a new draft from the immutable public document only, records original publication and non-content source tombstone references, and marks missing private basis/reviews unresolved. It grants no source access and cannot republish without new complete review. Keep `restore_publication_v1`'s stricter full-source semantics intact. Never resurrect bytes, discard source references silently, mutate the old original or treat old approval as new approval.

**Required tests:** more than 100 versions paginate without loss; original byte/ID/date equality; no autosave noise; historical document versus current overlay labels; full-source restore CAS/adoption/revocation; public-only restore after deletion with explicit unresolved basis; +29/+30 cutoff, last-entitled export and instruction-head CAS, private canaries absent, unfinished order/refund administration still reachable with no care leakage.

## 7. Private raw sources, consent, versions and deletion (D19-D20, D39-D40)

**Existing source metadata is not a file service.** [M54:18-21](../../../supabase/migrations/20261030223603_portal_rebuild_plan_v1.sql#L18) has current `plan_sources(id,client_id,draft_id,version,active)`, permissions and lawful restore adoptions. There is no original name, bytes/hash/MIME, upload reservation, immutable original-version row, consent, retention job or byte-read command. Inline meeting notes/transcripts remain private existing records. Preserve them and their IDs; do not assert a recording was uploaded because a metadata row exists.

Reuse the reservation -> no-upsert Storage write -> verify bytes -> completion pattern, not image-only assumptions. [Storage probe compatibility:14-65](../../../supabase/migrations/20261019171325_concierge_storage_probe_compat.sql#L14) separately fences early inserts and deferred actual-size completion. [Private cleanup:7-35](../../../supabase/functions/concierge-operations/private-storage-cleanup.ts#L7) currently inventories only payment evidence and check-in photos; draft-bound sources need a descriptor inventory that cannot be found by merely listing a client UUID prefix. Account deletion must include it before Auth deletion, following [existing deletion cleanup](../../../supabase/functions/delete-customer-account/index.ts). Legal holds cannot disappear through a new cascade.

Add small private `source_versions` keyed `(source_id,version)` with immutable original byte descriptor and provenance; `source_uploads/source_upload_parts`, consent/disclosure events, source grants/access audit, retention holds/jobs/tombstones. `plan_sources` remains the source identity/current active-version pointer used by existing hashes. Advancing it never updates an old `source_versions` row or object. Lock/version-check pointer changes; affected reviews/approvals become stale through source manifests. A restore adoption references the original source/version, not a copied new object. Changing source kind/name/transcript is a new immutable version, not an overwrite.

```ts
type SourceVersionRef = {sourceId:UUID; version:number};
type SourceDescriptor = SourceVersionRef & {draftId:UUID; clientId:UUID|null;
  kind:'audio'|'transcript'|'note'|'photo'; purpose:'consultation'|'product_label'|'goal_report';
  originalName:string; contentType:string; sizeBytes:number; sha256:Hash;
  capturedOn:Known<Day>; recordedAt:Instant; originalLocator:string|null;
  state:'reserved'|'uploading'|'verifying'|'complete'|'failed'|'deletion_pending'|'deleted';
  consentEventId:UUID; supersedesVersion:number|null};
type SourceRights = {viewMetadata:boolean; readBytes:boolean; attachToDraft:boolean;
  editDraft:boolean; transmitToTask:boolean; training:false; exportRaw:boolean};
```

`originalLocator` is private provenance (original file/reference plus immutable byte/text/time/page locator), not a browser-fetchable URL or caller-selected upstream. Existing `SourceLocation` references preserve their original IDs and offsets. Pin zero-based half-open time/text ranges, one-based pages, text offsets against the exact immutable decoded UTF-8 source version using code-point indexing with no silent Unicode normalization. A normalized extraction has its own derivative version/offset map, not reused old offsets. Existing inline `meeting_notes` notes/transcripts also require source inventory, access fencing and policy-governed content purge through an authorized forward lifecycle; do not exempt their raw text from retention just because it is in SQL. Preserve their original identity/hash/tombstone and audit basis, without copying purged text into permanent audit records. An original audio source and supplied transcript remain distinct linked sources; no transcription is implied.

Proposed fixed `concierge_source_command_v1(p_command jsonb)`:

| Action | Exact fields | Result/guard |
| --- | --- | --- |
| `read_source_policy_v1` | `draftId` | Allowed kind/MIME/caps/chunk sizes and current `SourceRights`; active scope required. |
| `record_source_consent_v1` | `Write`, `draftId`, `expectedAssignmentRevision`, `disclosureVersion`, `purposes:('service_storage'|'task_context')[]`, `clientConfirmationRef:string` | Immutable consent event; human records actual disclosed authorization. Payload cannot self-grant training/export or bypass source rights. |
| `begin_source_upload_v1` | `Write`, `draftId`, `expectedAssignmentRevision`, `kind`, `purpose`, `originalName`, `contentType`, `sizeBytes`, `sha256`, `capturedOn:Known<Day>`, `consentEventId`, `sourceId:UUID|null`, `expectedCurrentVersion:number|null`, `originalLocator:string|null` | Reservation `{sourceId,version,uploadId,maxPartBytes,expiresAt,state}`; human/source-write or exact task upload grant. Null source creates identity; existing source requires CAS and same scope. |
| `source_upload_status_v1` | `uploadId` | Authorized reservation/part completion/state, no object path or signed URL. |
| `complete_source_upload_v1` | `Write`, `uploadId`, `expectedReservationRevision` | `SourceDescriptor` only after actual size/hash/type/container checks and persisted completion. |
| `abort_source_upload_v1` | `Write`, `uploadId`, `expectedReservationRevision` | Fenced resumable cleanup receipt, not false deleted success. |
| `list_sources_v1` | `draftId`, `Page` | Scoped metadata/version descriptors and rights; no bytes by implication. |
| `authorize_source_read_v1` | `source:SourceVersionRef`, `draftId`, `purpose:'service_review'|'task_context'|'raw_export'` | Short-lived opaque same-origin read handle after independent rights/consent/task/session checks; handle alone is not authorization. |
| `request_source_deletion_v1` | `Write`, `source:SourceVersionRef`, `expectedLifecycleRevision`, `reason:string` | Human authorized source-deletion request; SQL derives never-started/retention/hold eligibility. No `serviceNeverStarted`, `retentionExpired`, `ignoreHold`, `legalBasis` or caller-supplied deletion deadline flag. |
| `set_source_grant_v1` | `Write`, `source:SourceVersionRef`, `expectedGrantRevision`, `principalId`, `taskGrantId:UUID|null`, `rights:('view_metadata'|'read_bytes'|'attach'|'task_context'|'raw_export')[]`, `consentEventId`, `expiresAt` | Owner-authorized finite source grant intersected with actual task/client/draft/session rights; cannot create Auth identity or grant training. |
| `revoke_source_grant_v1` | `Write`, `grantId`, `expectedGrantRevision` | Audited revocation, subsequent reads/ranges/retries deny. |

Uploads use fixed authenticated byte routes `/sources/uploads/:uploadId/parts/:partNumber` with bounded body, exact part hash and length; no bucket/path/URL in caller input, no JSON/base64 recording. Proposed engineering limits for the coordinator to pin: audio `audio/mpeg`, `audio/mp4`, `audio/wav`, `audio/webm` up to 128 MiB; transcripts/notes strict UTF-8 `text/plain` up to 10 MiB; photos existing JPEG/PNG/WebP up to 5 MiB; 1 MiB parts, no executable/HTML/SVG/archive input. These are **proposed implementation bounds, not previously approved business policy or evidence of parser support**. Signature/container/UTF-8 validation and safe attachment behavior are required before advertising each type. Do not pretend all audio is JPEG or force a product label into front/left/right skin-photo metadata. Product-label photos in section 4 use this explicit photo-purpose path; existing goal photos may reuse their genuine legacy lifecycle.

Reservation and completion request IDs remain distinct; retries bind upload/version/reservation, not unrelated draft/payment head. Existing bytes with a conflicting hash fail, never overwrite. Part retry with identical bytes is idempotent; changed part/hash rejects. Quarantine incomplete content, expire incomplete upload reservations as a technical cleanup lease (not an abandonment retention policy), and deny delayed completion after deletion/scope transfer. No full 128 MiB in-memory buffering. Publish `complete` only after byte verification and committed descriptor. Errors/logs contain safe codes, never transcript/audio/name/locator.

Browser byte reads pass through the existing same-origin proxy/Vault pattern; every full/range request rechecks actual session, source version/scope, task/consent, deletion and handle expiry. Storage signed URLs, provider tokens and service credentials stay inside server components. A successful signed fetch does not authorize a stale browser response; retain final lease/generation checks. Deny direct anon/authenticated Storage list/sign/read/write and private-table access. Extend both early and deferred Storage fences for the new fixed bucket without weakening either old bucket. For unassigned drafts, guard the real draft/principal scope instead of fabricating an enrolled client prefix. Include actual Storage HTTP probe/commit and deletion races in later acceptance.

### Independent rights and retention

Plan view, private draft edit, raw source read, task transmission, model training and raw export are independent. Existing `grant_task_v1.sourceIds` authorizes referenced-source scope, not blanket bytes, training or provider transmission. Intersect an exact source grant with the same live task grant/session and disclosed purpose before returning full relevant source to an external plan agent. Human owner/source permission checks remain live, and Sami's actual role does not imply recording access. No transmission on upload/autosave and no default call to a model provider. Development workers remain synthetic-only. Training stays disabled; no launch training command. Raw export needs its own consent/right and is not final-plan export.

D39 is **resolved**, not an unanswered abandonment policy: for draft audio/transcripts with service **never started**, an explicitly authorized advisor deletes manually. Do not invent an automatic age or infer a service start from payment/draft activity. Once service actually starts and ends, raw audio/transcripts/notes follow 12 calendar months after the **actual confirmed support end**, separately from portal access, history and financial/audit records. A temporary paid-coverage lapse is not automatically a confirmed permanent service end. Store/support the actual end basis and superseding confirmed end events; any renewed service/end change re-evaluates an unexecuted job before deletion.

Internal retention worker uses fixed service-only selection/claim/result operations, e.g. `concierge_source_retention_claim_v1(p_limit integer)` -> job IDs and private verified descriptors, and `concierge_source_retention_result_v1(p_job_id uuid,p_lease_id uuid,p_result text,p_absence_verified boolean)` with result enum `deleted|failed|held`. It derives due time as actual support end +12 calendar months, checks live holds and current lifecycle again, fences reads/uploads, deletes via Storage API and verifies absence. A manual never-started request enters the same durable deletion pipeline with server-proven manual eligibility. Service-only result is never a public caller assertion of eligibility. Failed removal remains pending/failed, retries use same job; tombstone is created only with actual byte-removal/absence evidence. Also remove governed derivatives/parts/caches, without erasing original source-reference identities from published/audit history.

Legal/operational holds have separate audited records, reason authority and release events; ordinary UI/agent cannot set or waive legal obligations. A source tombstone records identity/version/digest/deletion time/reason/basis without content, not an indefinitely retained transcript in audit JSON. Source expiration does not delete financial receipts or plan versions. Account deletion coordinates retention/holds before irreversible Auth cascade and reports a real blocker if a required obligation prevents normal cleanup. The applicable obligation/hold determination is a legal/operations prerequisite, not a feature-specific invented policy. No automatic caller-flag deletion endpoint.

**Required tests:** each MIME/size boundary and malformed container; UTF-8/offset consistency; part collision/interruption/uncertain completion; full/range scope revocation and session expiry; assigned/unassigned/reassigned/restore scopes; source version invalidates readiness/approval but not old source bytes; storage probe-only commit rejection; deletion-before-completion race; never-started manual versus genuinely started rule; calendar month/leap/end corrections/holds; failed deletion truthful retry; account cleanup inventory includes draft-bound objects; no raw/signed/provider bytes in client/export/logs, no training or automatic model transmission.

## 8. Safe standalone templates (D04, D14-D20)

At [M54:411-415](../../../supabase/migrations/20261030223603_portal_rebuild_plan_v1.sql#L411), non-null `templateVersionId` honestly returns `template_unavailable`. There are no implemented template tables or authoring commands. Keep null creation behavior and this truthful denial until an actual template version exists.

Propose `plan_templates`, immutable `plan_template_versions` and an independent template head/request scope. A template is reusable structure/plain guidance; it is neither a client publication nor approval of a future person's advice. Define a distinct `TemplateContentV1` schema: generic section prompts, authored guidance modules, schedule structures and stable template-local IDs. It must **not** accept `PlanContent` unchanged with a few identifying keys removed. Reject client/person identities, preparation by/on, client-specific facts/goals/experiences, private `SourceLocation`, consent/source/task IDs, publication/Start/money/history IDs, external credentials, HTML/CSS/JS, routes/buttons or executable rules. Product-specific public guidance/citations may be deliberately reusable with clear limitations; do not automatically import a client's label/formula findings as catalog truth.

Proposed fixed `concierge_template_command_v1(p_command jsonb)` family:

- `list_templates_v1 {cursor,limit}` -> versioned safe metadata, authorized advisor view.
- `read_template_version_v1 {templateVersionId}` -> immutable `TemplateContentV1` and schema/hash.
- `save_template_version_v1 {requestId,templateId:UUID|null,expectedHeadVersionId:UUID|null,title,content:TemplateContentV1}` -> new immutable version; authorized human workspace edit. Client-derived extraction, if offered, first presents an allowlisted sanitized candidate for deliberate review; it never saves all client content by default.
- `archive_template_v1 {requestId,templateId,expectedHeadVersionId}` -> audit/availability change, no deletion of used versions.

Existing `create_draft_v1 {kind:'care_plan',templateVersionId}` can then instantiate a safe version: record immutable template provenance, create fresh draft/client-local module IDs with an explicit mapping, reset reviews/approvals/assignment/source/basis/actual use to unknown/empty and keep unassigned. Never copy another client's IDs or conclusions. Template schema conversion is explicit and versioned; old publications/template originals stay unchanged. A template change does not update any current client plan. An agent may instantiate only through an explicitly granted create scope; no template editing/self-enrollment by implication.

**Required tests:** seeded canaries across nested facts/source locations/URLs/IDs fail template validation; no identity carryover on two instantiations; immutable old version; stale head/CAS and exact retry; no implicit client/Auth creation; review reset; all eight decision kinds/no products/conditional schedules work through shared renderer; no application logic/page generation.

## 9. Frozen quotes, manual finance, fulfillment and obligations (D27-D29, D31, D35-D37)

**Retain canonical finance.** `quotes/quote_states`, `shipping_addresses`, `claims/claim_states`, `payment_confirmations`, `service_periods`, `entitled_publications`, `product_orders`, `payment_audit`, receiving-method snapshots/options and evidence remain authoritative. Existing [payment types:6-24](../../../supabase/functions/concierge-payments/types.ts#L6), [contract:75-104](../../../supabase/functions/concierge-payments/contract.ts#L75), [methods:3-35](../../../supabase/functions/concierge-payments/methods.ts#L3) and SQL PM supply real manual quote/claim/verification. First service-only v2 flow is reusable today; it is not evidence of complete V3 product terms.

The existing `PaymentQuote.items` contains recommendation/quantity/unit/line money but no complete seller/variant/return-term snapshot. Existing `record_purchase` has retailer/seller/policy and optional initial delivered date but lacks an append delivery/shipping event API. It resolves legacy recommendation JSON when quote-bound. Existing returns have meaningful finite transitions and proportional refund caps; retain them. No concierge service-guarantee refund/referral command was found in the inspected concierge contracts/functions and October canonical migration scope; do not infer one from product return events or unrelated scanner billing.

Propose one version-aware private `commerce_product_basis(c,publication,decisionId,productId)` that resolves immutable V3 document/decision state or lossless legacy content. No manufacture of `recommendations[]`, price, identity or receipt. Use it only in allocated product quote/purchase extensions; retain legacy behavior for genuinely old quotes and service-only payments. Forward schema additions are immutable quote-line/terms/acceptance/purchase linkage sidecars and append-only fulfillment/reconciliation/obligation events, **not a replacement ledger**.

```ts
type FrozenProductLine = {lineId:ContentId; publication:ClientPublicationRef;
  decisionId:ContentId; productId:ContentId; productName:string;
  variant:string; strength:Known<string>; sizeLabel:string; quantity:number;
  retailer:string; seller:string; fulfiller:string|null;
  unitPriceCents:number; lineTotalCents:number;
  returnTerms:{checkedOn:Day; sourceUrl:string; summary:string;
    openedAllowed:boolean; finalSale:boolean;
    returnDeadline:{kind:'none_final_sale'}|{kind:'absolute';returnBy:Day;shipBy:Day|null}
      |{kind:'relative';days:number;anchor:'purchase'|'delivery';shipWithinDays:number|null};
    returnCost:{kind:'known';cents:number}|{kind:'client_pays';description:string}}};
type PartialProductLine = {[K in keyof FrozenProductLine]:Known<FrozenProductLine[K]>};
type FrozenManualOption = ReturnType<typeof mapPaymentViewV2>['quotes'][number]['paymentOptions'][number];
type ProductQuoteDraft = {publication:ClientPublicationRef;
  lines:PartialProductLine[]; taxCents:Known<number>; shippingCents:Known<number>;
  shippingAddressVersion:Known<number>; note:string|null};
type FrozenProductQuote = {quoteId:UUID; quoteVersion:number; termsHash:Hash;
  lines:FrozenProductLine[]; taxCents:number; shippingCents:number;
  productTotalCents:number; serviceCents:number; totalCents:number;
  shippingAddressVersion:number; paymentOptions:FrozenManualOption[];
  acceptanceId:UUID|null; canPay:boolean};
// mapPaymentViewV2 is the existing strict methods.ts export; its option is
// {id,recipientVersion,recipient:Zelle|CashApp|AppleCash,available}.
```

`strength:unknown` is allowed only when immaterial for this exact purchasable identity; unresolved consequential variant/strength blocks the dependent quote. Known final-sale is a complete no-return term, not unknown eligibility. A relative seller policy preserves its actual anchor/window at quote time; delivery later resolves actual deadlines without rewriting the originally disclosed policy. `openedAllowed:unknown`, unknown seller/all-in money/address/eligible payment option/material policy cannot produce a payable final quote. Genuine zero tax/shipping requires explicit checked zero. Reference/display price is never promoted automatically.

Proposed fixed `concierge_commerce_command_v1(p_command jsonb)` finite extensions:

| Action | Exact fields | Result/authorization |
| --- | --- | --- |
| `save_product_quote_draft_v1` | `Write`, `clientId`, `quoteDraftId:UUID|null`, `expectedQuoteDraftRevision`, `body:ProductQuoteDraft` | Incomplete preparation/CAS view; advisor edit; no canonical payable quote yet. |
| `issue_product_quote_v1` | `Write`, `clientId`, `quoteDraftId`, `expectedQuoteDraftRevision`, `expectedPaymentRevision`, `termsHash` | Complete frozen canonical quote + immutable sidecar/options in one transaction, current approved decision and manual method checks; no charge/order. |
| `accept_product_quote_v1` | `Write`, `quoteId`, `quoteVersion`, `termsHash` | Owner's immutable exact-total/terms acceptance receipt; no payment or Start. |
| `read_commerce_v1` | `Page` | Own frozen quotes/orders/returns/reconciliation with safe public references; advisor variant explicitly `clientId`. |
| `record_purchase_v2` | `Write`, `clientId`, `expectedServiceRevision`, `quoteId`, `quoteVersion`, `termsHash`, `lineId`, `quantity`, `purchasedOn`, `orderReference`, `receiptReference` | Actual manual purchase anchored to frozen paid line/seller/address/terms, private references separated; human operational edit. |
| `record_fulfillment_v1` | `Write`, `clientId`, `purchaseId`, `expectedFulfillmentRevision`, `event:{kind:'ordered';occurredOn:Known<Day>}|{kind:'shipped';occurredOn:Known<Day>;trackingReference:string}|{kind:'delivery_confirmed';occurredOn:Known<Day>;reportedBy:'founder'|'client'}` | Append event; no carrier call, actual-use Start or claim that an unknown delivery date is known. |
| `confirm_product_received_v1` | `Write`, `purchaseId`, `expectedFulfillmentRevision`, `occurredOn:Known<Day>` | Client-owned receipt report, no Start. Self-purchased use requires no purchase ID. |
| `record_quote_reconciliation_v1` | `Write`, `clientId`, `oldQuoteId`, `expectedReconciliationRevision`, `replacementQuoteId:UUID|null`, `reason`, `clientAcknowledgementRef:string`, `disposition:'awaiting_client'|'replacement_accepted'|'manual_repayment_required'` | Immutable material-change decision; no mutation or automatic funds movement. Replacement acceptance requires the client's real exact quote acceptance. |

Reuse existing v2 `submit_claim/confirm_payment/reject_claim`, selected `paymentOptionId`, exact quoted allocations and actual gross verification for compatible issued quotes; extend their private validation to require complete matching V3 sidecar/acceptance. Old v1/v2 product issuance cannot omit the new terms by selecting an older schema; add a candidate/version fence or shared underlying validator before enabling V3 products. Unknown or unaccepted terms yield `canPay:false`; preserve the old canonical status meaning and expose the stronger DTO/predicate explicitly. This is a bounded versioned extension, not permissive extra fields in old `PaymentQuote` or `mapPaymentViewV2`.

If purchase-time facts materially differ, do not accept `record_purchase_v2` against old terms. Record reconciliation and obtain new client acceptance/quote; existing gross funds stay immutable and separately allocated/repaid. Profile address changes never rewrite the paid quote. Source publication update never changes old seller/variant/price/returns/address/method. A funded product quote becomes ready-to-purchase only; ordered, shipped, delivery-confirmed and explicit actual Start are separate. Self-purchase goes directly to identity/use and receives the same care, without a synthetic quote/claim/order.

Existing `request_return` and `record_return_event` can be reused for preserved purchase rows when their actual policy shape is representable; retain `return_cases/return_events`, separate private references and [`ReturnStatus`](../../../src/contracts/ConciergeService.ts#L20). A v2 purchase extension supplies checked policy via immutable compatible sidecar and a version-aware eligibility adapter, not an invented generic window. Preserve partial quantity/refund caps and the distinct `retailer_funds_received` -> `client_repaid` states. Add a typed obligation timestamp sidecar when existing records lack actual transfer initiation time; status alone is insufficient to prove the 48-hour initiation obligation. Founder ordering mistakes have explicit cause/resolution events, not a fabricated retailer eligibility approval.

### Service refund and referral bookkeeping

Canonical founder terms are [operations:29-44](../../CONCIERGE_FOUNDER_OPERATIONS.md#L29), [83-107](../../CONCIERGE_FOUNDER_OPERATIONS.md#L83), and D35-D37. Three calendar monthly periods are **not a fixed 90 days**. Refund service fees actually paid for the first three periods, including early/prepublication requests, through 30 calendar days after period three ends; no photo/adherence/improvement/fourth-payment condition. Product money is separate. Initiate repayment within 48 elapsed hours after request plus necessary private details, not promise bank arrival. Referral: one $100 obligation per genuinely paying new referral triggered by verified first $100 service payment; designated payee; 48 elapsed hours to initiate; genuine client refund does not claw it back. Preserve already communicated broader terms, without inventing them for an unknown client.

Add append-only service refund/referral obligation/event records linked to existing actual payment confirmations/period IDs. Proposed commands:

- `request_service_refund_v1 {requestId,reason:string|null}` -> request/eligibility evidence and actual service allocations; owner inferred, administrative access including before publication/after support. Advisor-recorded branch `record_service_refund_request_v1 {requestId,clientId,occurredAt:Instant,channel,confirmedClientRequest:true,reason}` retains attribution.
- `record_repayment_details_v1 {requestId,clientId,obligationId,expectedObligationRevision,method:'zelle'|'cash_app'|'apple_cash',privateDestination,confirmedWithClient:true}` -> private details reference only. `privateDestination` is `{method:'zelle',name:string,email:string|null,phone:string|null}` (at least one contact), `{method:'cash_app',name:string,cashtag:string}`, or `{method:'apple_cash',name:string,phone:string}` matching that method, bounded by existing recipient validators; never arbitrary JSON or a service receiving handle copied by default.
- `record_obligation_event_v1 {requestId,clientId,obligationId,expectedObligationRevision,event:{kind:'repayment_initiated';amountCents;occurredAt;privateReference}|{kind:'receipt_confirmed';amountCents;occurredAt;privateReference}|{kind:'failed';occurredAt;safeReasonCode}}` -> immutable event receipt; money events require actual human finance-confirm capability. Idempotency and cumulative amount caps prevent duplicate repayment records.
- `record_referral_v1 {requestId,clientId,expectedReferralRevision,partnerId,designatedPayeeId,confirmedPayeeRef}` -> one retained referral relation; owner/authorized operations only, no analytics system. `read_obligations_v1 {cursor,limit}` -> own service refunds/returns; advisor branch explicit client and scoped operational authority also sees referral obligations.

Server derives eligibility, paid-period sum, trigger, deadline, outstanding balance and earned referral from actual ledger references and versioned terms. A request or event records manual facts; no endpoint executes a payment, card action, refund, Stripe enrollment or retailer order. Legacy externally paid amounts need verified provenance and separately authorized import before they can be represented; old SQL/TS `[0,10000]` constraints cannot justify fake $100 receipts for $25 clients. Preserve existing rows; any legacy-amount accommodation is versioned forward work with source evidence, not this report's invented historical money.

**Required tests:** all incomplete terms block payability; exact variant/seller/size/all-in/address/method/return snapshots; changed terms require new acceptance; V3 resolver and old-schema bypass denial; claim/screenshot != verified gross; fee/net separate; purchase/ship/delivery/Start distinct; immutable quote through plan/profile changes; self-purchase no finance rows; partial return caps, retailer receipt/client repayment initiation separate; first-three-period and early/prepublication refund/no-photo cases; referral once/48h/no-clawback; request replay/cross-stream collisions, concurrent confirmations/repayments, least privilege and no external action.

## 10. Account, calendar coverage, cancellation and administration (D13, D24-D25, D35-D39)

**Reuse actual service truth:** `service_periods`, first `publications.published_at`, `plan_review_schedule`, entitlements, cancellation and manual invoice/quote/payment functions. [M54:224-238](../../../supabase/migrations/20261030223603_portal_rebuild_plan_v1.sql#L224) already enforces active/read-only/expired care. [SW:151-156](../../../supabase/migrations/20261025221028_concierge_service_workflows.sql#L151) records confirmed period-end/early support end and supersedes renewal quotes. [M54:726-756](../../../supabase/migrations/20261030223603_portal_rebuild_plan_v1.sql#L726) filters care history/photos while leaving administration distinct. Do not replace these with browser date arithmetic or mere enrollment status.

Current address confirmation is `confirm_shipping_address` in the original payment family ([contract:80-86](../../../supabase/functions/concierge-payments/contract.ts#L80)); it is not one of `buildPaymentCallV2`'s write actions. Reuse its actual owner/CAS/immutable address-version operation, or add an explicitly named adapter, rather than falsely sending it through v2. `concierge.enrollments.display_name`/Auth identity already exist; no complete concierge profile/contact-verification API appears in the inspected command surface. Do not add another user/Auth database.

Proposed fixed `concierge_account_command_v1(p_command jsonb)`:

```ts
type ProfileV1 = {revision:Revision; displayName:string;
  contact:{email:string|null; phone:string|null; preferred:'email'|'text'|'call'};
  verification:{field:'email'|'phone'|'address'; version:number;
    state:'pending'|'confirmed'; confirmedAt:Instant|null; method:'manual'|'auth'}[];
  shippingAddressVersion:number|null};
type ServiceAccountV1 = {care:'preparation'|'active'|'read_only'|'ended';
  firstPublicationAt:Instant|null; supportEndsOn:Day|null; readOnlyEndsOn:Day|null;
  finalEntitledVersion:number|null; canReadCare:boolean; canWriteCare:boolean;
  canAdministerOutstanding:boolean; renewalRequestsEnabled:boolean;
  coverage:{claimId:UUID; startOn:Day; endOn:Day; policyVersion:number}[];
  nextReviewOn:Day|null; guarantee:{paidServiceCents:number;
    eligiblePeriodClaimIds:UUID[]; requestDeadline:Day|null;
    policy:'first_three_monthly_periods'; broaderRecordedPromiseRef:UUID|null}};
```

- `read_account_v1 {}` -> `{profile:ProfileV1,service:ServiceAccountV1,remainingAdmin:{orders:boolean,returns:boolean,serviceRefunds:boolean}}`; owner derived, current live permanent session. Ended care contains no plan/history/source bytes. Advisor variant is `read_advisor_account_v1 {clientId}` with actual view/administrative scope and private data excluded unless separately permitted.
- `save_profile_v1 {requestId,expectedProfileRevision,displayName,contact:{email,phone,preferred}}` -> new profile revision and pending changed-contact verification. No goal/product edit and no update of frozen address/quote. Login identity remains the verified Auth identity; a profile contact email is not a self-issued new verified sign-in identity.
- `record_contact_verification_v1 {requestId,clientId,expectedProfileRevision,field:'email'|'phone'|'address',fieldVersion,method:'manual',confirmationReference:string}` -> human-attributed actual manual verification. Client cannot send `verified:true`. Auth-based verification must come from the actual supported confirmation result, not this payload; preserve issuer/session/logout rules. No hidden email send on autosave. A separately authorized deliberate verification flow is needed before changing login email; do not bypass Auth through direct user-table mutation.
- `request_cancellation_v1 {requestId,expectedServiceRevision,kind:'period_end',confirmed:true}` -> server-derived actual paid support end, cancellation/read-only dates, renewal suppression and final export offer. Client cannot choose a false paid-period end. Reuse existing cancellation logic under owner-derived command, with current final authorization after waits.
- `record_early_departure_v1 {requestId,clientId,expectedServiceRevision,supportEndsOn:Day,confirmedWithClient:true,confirmationReference:string}` -> authorized human operational record with explicit agreed support end. Does not issue refund. Corrections are append-only `amend_support_end_v1 {requestId,clientId,cancellationId,expectedAmendmentHeadId:UUID|null,supportEndsOn,reason,confirmationReference}`; derive new access/retention basis, preserve original cancellation.
- `read_renewal_v1 {}` -> actual next coverage period/manual quote/method availability; `request_manual_renewal_v1 {requestId,expectedServiceRevision,expectedNextPeriod:{startOn,endOn}}` -> an administrative renewal request for authorized founder issuance through existing quote workflow, not an automatic payment or publication. Cancelled service cannot create renewal requests. Exact intended period prevents silently moving a paid date on retry.
- `read_privacy_v1 {}` -> disclosed service/source purposes, training disabled, actual consent/deletion request states and own export availability; source grants/raw bytes remain separately protected. The source module owns source-specific consent/revocation. Account deletion keeps existing committed deletion fence/cleanup flow; no new public delete-by-flags RPC.

Initial publication has already anchored first Chicago service/review timestamps. Later care updates, no-change reviews, instruction edits, payment-only bookkeeping and notification retries must never call an independent activation/start or reset those anchors. The initial +14-day and months one/two/three schedule exists; ongoing monthly/as-needed review data and actual review outcomes still need a bounded extension. A scheduled check-in is preparation, not a booked call or deferral of the 24-hour personal response promise.

Calendar compatibility: [WF:64-70](../../../supabase/migrations/20261018234537_concierge_portal_workflows.sql#L64) and [payment contract:25-34](../../../supabase/functions/concierge-payments/contract.ts#L25) currently enforce each end as `start+1 month`; `service_anchor/invoice_period` use prior max end. Original-anniversary recurrence can differ after February (Jan31 -> Feb28 -> Mar31 versus Mar28). Keep all issued/paid periods and quote bytes unchanged. For future periods, pin a versioned original-publication anniversary policy and period ordinal, using a forward constraint/validator branch for that policy only; no silent reinterpretation of old one-month rows. This is a coordinator calendar-contract refinement, not permission to backdate coverage or hide unpaid lapses. If anniversary behavior is not yet pinned, keep future renewal issuance on the retained explicit rule and do not claim the refinement implemented.

Support uses exclusive Chicago date boundaries: active before the actual support-end boundary, read-only `[supportEnd,supportEnd+30 calendar days)`, then care ended. A confirmed earlier departure shortens support and changes the retention end basis; ordinary cancellation keeps paid support. Remaining product/order/return/refund administration remains separately authorized past care expiry, with no public review/new support/plan writes. Final plan export is section 6, not raw-source export. Paid-service guarantee uses actual first three monthly periods and +30-calendar-day request deadline, never a 90-day timer, product Start or fourth renewal.

**Required tests:** authoritative profile/contact/address versions and manual verifier identity; login email not changed by profile edit; address freeze; first publication/renewal/lapse and no repeated activation; Jan31/leap day/month-end/Chicago DST; original versus new policy branches; two-week and ongoing review schedule; actual paid amounts/guarantee deadline/early request; cancellation/request/support-end correction race and exact retry; +29/+30 reads/writes/media/export; ended-care unfinished administration with care content excluded; no automatic charge/refund/send.

## 11. Delivery worker, authenticated webhooks and portal inbox (D33-D34)

**Actual existing service seam:** [M54:763-819](../../../supabase/migrations/20261030223603_portal_rebuild_plan_v1.sql#L763) implements fixed **service-only** `concierge_plan_delivery_claim_v1(p_limit integer)` (1..50), `concierge_plan_delivery_result_v1(p_delivery_id uuid,p_lease_id uuid,p_status text,p_provider_message_id text,p_error_code text)`, `concierge_plan_delivery_retry_v1(p_delivery_id uuid,p_expected_revision bigint,p_provider_reconciled boolean)` and `concierge_plan_delivery_expire_v1()`. Claims use SKIP LOCKED, a five-minute lease and immutable delivery-ID idempotency key. Result currently records only accepted/failed/uncertain. Expiry makes claimed jobs uncertain, not resendable proof of failure. Browser/task execute rights remain absent. `seen_at` exists but inbox/seen/provider/webhook worker is missing.

Extend `plan_events` with typed source identity in a forward migration: source kind/id/version and uniqueness by immutable business source, with the old plan-publication uniqueness retained for that kind. Preserve existing event IDs and source publication FKs; new reports/reviews can share a publication without colliding. An immutable sidecar/source registry is acceptable, but the old global `(client,publication,kind)` uniqueness must not block a second report. Do not rebuild the plan event/delivery ledger or duplicate every old event into a new outbox.

Events are `plan_published`, `review_published`, `reply_published`, `instruction_published`, `goal_reported`, `use_reported`, `report_amended`, `use_amended`, with exact source record references. Published client-visible guidance creates email + portal events for that client; material client reports/corrections create advisor attention and configured email. Private note/draft/import/autosave does not create client notifications. Configured advisor recipients are server-owned, task-scoped where relevant; never broadcast private client events to all advisors by default. No automatic SMS or email every autosave.

Implement a small server-only dispatcher/provider adapter using the retained fixed claim/result/expire/retry RPCs. After committed claim, resolve recipient and allowlisted authenticated route from server records; neutral message only, no goals/notes/source attachments or caller URL. In development enforce local sink/test-recipient allowlist before send. Commit provider outcome with lease/delivery/attempt identity. Browser sees safe event/status, not provider email/API token, signed link or receiving credentials.

Proposed internal adapter signatures:

```ts
type DeliveryClaim = {deliveryId:UUID; leaseId:UUID; recipientId:UUID;
  eventId:UUID; idempotencyKey:UUID}; // exact existing claim shape
type ProviderOutcome = {status:'accepted'; messageId:string}
 | {status:'failed'; code:string} | {status:'uncertain'; code:string};
interface TransactionalProvider {
  send(input:{deliveryId:UUID; idempotencyKey:UUID; to:string;
    template:'plan_ready'|'review_ready'|'advisor_attention'; authenticatedPath:string}):Promise<ProviderOutcome>;
  reconcile(input:{deliveryId:UUID; idempotencyKey:UUID; messageId:string|null}):Promise<
    {state:'accepted';messageId:string}|{state:'not_accepted'}|{state:'unknown'}>;
}
```

Do not pass `provider_reconciled:true` from a client UI. An operator request schedules reconciliation; the internal retry worker calls that existing service RPC only with durable actual reconciliation evidence and matching delivery revision. Expired lease, timeout after send, worker crash after acceptance and unknown provider outcome remain uncertain. Late accepted outcomes after lease expiry need a typed reconciliation result tied to the original attempt; the existing result RPC rejects non-claimed/conflicting leases. Add that bounded service operation, not a blind replay or fake failed state. Exactly-once external email requires effective provider idempotency/reconciliation support; database deduplication alone cannot prove it. If the selected provider cannot reconcile, preserve uncertainty for explicit human resolution instead of automatic duplicate sends.

Proposed internal `concierge_plan_delivery_provider_event_v1(p_provider text,p_event_id text,p_message_id text,p_delivery_id uuid,p_kind text,p_occurred_at timestamptz)` accepts only `delivered|bounced|failed`, a verified provider linkage and unique `(provider,event_id)`, service execution only. The webhook handler authenticates the **raw** request/signature with timestamp/replay bounds before invoking it, verifies expected provider/message/delivery/recipient linkage, and stores append-only safe event evidence. Forged, duplicate and out-of-order events cannot downgrade delivered to accepted or turn a bounce into read. No public payload assertion of verified signature. Provider/domain/signing-secret deployment stays separate from software implementation.

Proposed fixed `concierge_notification_command_v1(p_command jsonb)` browser family:

- `list_notifications_v1 {cursor,limit}` -> `{entries:{deliveryId,eventId,kind,createdAt,authenticatedPath,status,seenAt,revision}[],nextCursor}` for own recipient only, neutral data; advisor attention reads require own actual advisor principal. Email status remains its actual provider state, portal seen separate.
- `mark_notification_seen_v1 {requestId,deliveryId}` -> idempotent server `seenAt`, only recipient's **portal** indicator. Does not claim email read, plan receipt or product Start.
- `request_notification_retry_v1 {requestId,deliveryId,expectedDeliveryRevision}` -> durable authorized request/queued-for-reconciliation status for own or specifically granted operational delivery, not direct provider retry. Pending/accepted/delivered cannot be resent as failed. Exact repeat retains request and delivery ID.
- `read_notification_status_v1 {deliveryId}` -> safe current email/portal status permitted to that recipient/operational scope. No arbitrary recipient enumeration.

Publication/access/receipt/Start/email status are independent. The neutral deep link performs ordinary sign-in and authorization; it is no capability to private care. A failed/bounced email does not roll back publication or coverage. Retry/expiry/webhook/seen must never call publish, assign a new publication receipt, restart clocks or reset Start. Automated acknowledgement never satisfies the useful personal response obligation.

**Required tests:** two dispatchers one claim; bounded NULL/stale CAS; send-accepted/response-lost/crash/lease expiry/late webhook; duplicate and out-of-order signature/replay negatives; actual sink delivery versus provider acceptance versus portal seen; source-event uniqueness on multiple reports per publication; private drafts silent; same IDs across retry; no republish/clock/Start effects; wrong recipient and revoked session; neutral email/deep-link auth; no production recipient/provider enrollment inferred from passing local sink.

## 12. Workspace permissions, task registration and safe view reads (D19, D22-D23, D40)

**Observed classification matters.** `list_plans_v1` is a merged **working-directory** operation: drafts (including unassigned) plus publication metadata ([M54:561-572](../../../supabase/migrations/20261030223603_portal_rebuild_plan_v1.sql#L561)). It enters `plan_guard` ([M54:78-88](../../../supabase/migrations/20261030223603_portal_rebuild_plan_v1.sql#L78)), requiring edit for human principals. The first recon explicitly classified unassigned directory as workspace edit. Gateway `planCapability` calls read-shaped actions `view`, but SQL remains stricter. [W6:107](W6_GENUINE_BROWSER.md#L107) observed this and used the actual view-capable client directory for its genuine viewer test. That was not a failure of the M55 safe read seam.

M55 `read_advisor_gate_v1` and `read_advisor_publication_v1` deliberately use `plan_advisor_read_guard` and `view`, with safe target-bound capability/publication projections. They do not return private draft bodies/source locators. Existing `concierge_advisor_directory()` uses view and safe client metadata ([WF:204-211](../../../supabase/migrations/20261018234537_concierge_portal_workflows.sql#L204)). Existing private legacy advisor reads may contain meeting notes; they are not safe publication replacements and must not be broadened as part of a directory fix.

**Bounded remedy:** keep `list_plans_v1`'s edit/private-working-set semantics, align UI labels/availability with actual SQL, and add `list_advisor_publications_v1 {clientId:UUID|null,cursor,limit}` using the M55 safe view guard. Return only `{clientId,version,publishedAt,documentSchemaVersion,clientCareState}` plus cursor. For tasks require the explicit finite new action and exact client or immutable publication-source-draft scope; no enumeration of unrelated clients/unassigned drafts. `read_advisor_publication_v1` can then open that actual version unchanged. If founders later want view-only private-draft reading, that is a separately approved permission/content classification, not a silent switch from edit to view in `plan_guard`.

Current `read_policy_v1`, `set_sami_approval_policy_v1`, `grant_task_v1`, `revoke_task_v1` are real ([Types:55-58](../../../src/contracts/PortalRebuild.ts#L55), [M54:525-545](../../../supabase/migrations/20261030223603_portal_rebuild_plan_v1.sql#L525)). Policy setter is owner-only CAS/audited. Grants require **client XOR draft**, live registered nonanonymous agent/session, closed actions, explicit source IDs and <=24-hour expiry. Source permissions and principal registration have no ordinary completed production enrollment UI/API. No wildcard, human-name inference, service-role shortcut or union of unrelated task grants.

Proposed fixed `concierge_workspace_command_v1(p_command jsonb)` family, without changing current first-slice authority:

- `read_workspace_authority_v1 {}` -> `{actorId,principalKind,capabilities:{view,edit,assign,review,approve,publish,confirmPayments},policy:{revision,requireKanujApproval},canManageTasks:boolean,sourceRightsSummary}`. View-only projection exposes own actual rights/policy consequence, not all raw grants, credential/session rows or source bodies. It cannot confer missing edit/owner rights.
- `list_task_grants_v1 {cursor,limit,clientId:UUID|null,draftId:UUID|null}` -> exact grant IDs/actions/expiry/revocation and source IDs only where lawful; owner manages workspace grants, a task may inspect its own selected grant without new scope. No provider tokens.
- `register_task_principal_v1 {requestId,agentActorId,providerSessionId,expectedRegistryRevision,confirmed:true}` -> owner-audited registration receipt for an **already privately provisioned** eligible actual Auth agent identity/session. It cannot create/invite users, issue credentials, convert a human owner/advisor into an agent, assign global advisor bits or fabricate a session. Actual supported agent credential issuance is a separate production prerequisite.
- `deactivate_task_principal_v1 {requestId,agentActorId,expectedRegistryRevision,confirmed:true}` -> audit and immediate new-operation denial; preserve immutable client publication/history. Session cleanup uses supported provider revocation, without cascade-erasing records.
- Reuse owner `set_sami_approval_policy_v1` and care-plan `grant_task_v1/revoke_task_v1`. If new domain actions need grants, pin `grant_task_v2 {requestId,agentActorId,providerSessionId,clientId:UUID|null,draftId:UUID|null,actions:FiniteDomainTaskAction[],sourceIds:UUID[],expiresAt}` explicitly. Its allowlist contains only reviewed draft/source/read/publish actions from these modules; no human review/approval, payment confirmation, admission, registry/policy management, deletion/holds, training, generic export or arbitrary endpoint. Existing v1 grants gain no implicit new actions. Raw bytes/transmission/export still require independent section-7 source grants/consent.

A08 projection presents actual Sami approval policy, exact draft approval/publisher, task identity/actions/scope/expiry and separate source rights, not a single “AI allowed” switch. Policy change cannot waive exact human review, independent task publication authorization, consent or source rights. Current gate is reread after policy/grant/content changes; a saved receipt is never current authority. UI must distinguish denial from unavailable/not implemented and preserve unsent work; no optimistic granted badge.

**Required tests:** genuine view-only publication list/read with draft/raw-source denial; working-directory edit remains required; gateway/SQL authority mismatch does not masquerade as access; cross-client/task enumeration fails; owner-only registry/grant/policy commands; actual session/expiry/revocation after waits and receipts; invalid principal/name/metadata/union-of-grants; new-domain action cannot be smuggled through old grant; care approval and source consent remain independent after Sami policy change.

## 13. Private four-client sharing and all five Maya stages (D11, D41-D42, D47)

Retain [private walkthrough schema:7-46](../../../supabase/migrations/20261025221043_concierge_private_walkthroughs.sql#L7): `walkthroughs.advisor_grants/cases/versions/provenance/share_grants/requests`. Keep `walkthrough_advisor_command` (`open/share_list/share_create/share_revoke`), `walkthrough_capability_read(p_digest text)` and service-only `walkthrough_private_import` rights unchanged ([lines 78-197](../../../supabase/migrations/20261025221043_concierge_private_walkthroughs.sql#L78)). Existing selected immutable version, digest, expiry/revocation and sanitized projection are independent from client enrollment, plan/source/task rights. Do not publish a four-client index or replace selective sharing with public Maya access.

The retained [WalkthroughSnapshot/StoryStage:37-84](../../../apps/portal/session-integration/runtime/server/walkthrough-contract.ts#L37) already models immutable R2 presentation, staged decisions/receipt/Start, review and instruction updates with private import provenance. `projectWalkthrough` strips private context and restricts images. Reuse these actual interfaces; do not import walkthrough text as live client reports or expand capability read into a plan/source API. [Application:59-70](../../../apps/portal/src/app/Application.tsx#L59) still explicitly says the current application slice does not include the five-stage tour.

Proposed frontend-only data adapters:

```ts
type DemoScenarioV1 = {kind:'public_maya'|'private_walkthrough';
  scenarioId:string; versionId:string;
  provenance:'fictional'|'founder_confirmed_reconstructed';
  initial:PlanRenderView;
  stages:{id:'meet'|'decision'|'daily_use'|'follow_up'|'next_step';
    narrative:string; evidence:'staged'; simulatedEvents:StoryEvent[];
    review:PublicReviewSummary|null}[]};
type DemoController = {read():PlanRenderView; next():void; previous():void;
  explore():void; exit():void; replay():void; reset():void};
```

`adaptPrivateWalkthrough(snapshot:WalkthroughSnapshot):DemoScenarioV1` uses the immutable safe presentation through the lossless R2 adapter and shared renderer; map `StoryStage.review.channel:'phone'` explicitly to normalized `'call'` without rewriting original snapshot. Keep exact product/slot/decision IDs. Existing source may have more/different stage IDs; an explicit reviewed mapping to the five guide stages is an adapter, not a mutation of old versions. `adaptMayaScenario(sample)` consumes the retained source-faithful Maya data: morning water rinse/CeraVe PM/sunscreen/optional makeup; conditional evening remover/cleanser/moisturizer; azelaic proposal and full cautions retained. Never invent morning cleanser or clinical outcomes.

Meet -> meaningful decision -> daily use -> personal follow-up -> next step all use `PlanRenderView` and the same product/history/review modules. Demo simulation is memory-only with type-incompatible live write ports; no client/session credentials, production grant, source upload, publication, email, payment or purchase call. Stage narration is always progressable by Next; interactions optional. Exit removes the guide fully, Explore preserves useful browsing, Replay/Reset restore only the scenario state, with usable compact/narrow-desktop guide and later mobile. Avoid resetting real client history/profile.

Private four-client original initial details are founder-confirmed/reconstructed, not verbatim transcripts; later authored events/reviews are staged. Maya is fictional. Preserve that provenance through shared history DTOs and labels. No staged delivery/Start/review becomes an observed event or testimonial. Share grant revocation/expiry is rechecked via the existing viewer lifecycle; copied snapshots are not put into public assets or persisted sensitive browser storage. New rendering must pass existing no-private-source/no-secret and no-login capability constraints.

**Required tests:** all five stages plus Next-only/optional interaction, full Exit/Explore/Replay/Reset; no real network business writes; same selected-product binding/routine/cautions; R2/private snapshot ID/byte preservation; existing selective grant expiry/revocation/cross-case negatives; no public enumeration or private source export; staged/fictional provenance visible; keyboard/zoom/reduced-motion/narrow-desktop/mobile. These are planned acceptance tests, not observations from this source-only task.

## 14. Implementation sequence, ownership and acceptance gates

This is not a new migration allocation, root contract freeze or page task dispatch. Coordinator pins concrete signatures and stable fixtures after reconciling this report with the independent current slice/harness reviews. One active writer owns root shared types, parsers, mappers, migration ordering and SQL authority composition; one coordinator owns shared auth/routes/gateway/release. Domain modules may be small and separate, but are integrated through one bounded composition pass. No simultaneous editor of migration 54/55 or root contract files.

1. **Close connected-slice evidence, preserve current APIs.** Retain the parent's 13-group report scope, receive fresh independent slice/harness results, reconcile stale status/acceptance references, and pin the canonical next API document. Do not reproduce counterpart code or interpret passing product-free slice as product/order/source completion. No active fixture/browser work is authorized to this researcher.
2. **Pin care/use/report/history DTOs and event source extension.** Add strict new read version, use/identity/amendment/report commands, separate event heads and advisor alerts. Connect one actual use/report journey through the retained gateway/Auth/persistence; verify no Start/date/finance fabrication and current care cutoffs. Until acceptance, future feature UI work can use **stable DTO fixtures**, not independently guessed schema.
3. **Guidance publication slice.** Implement exact review/instruction/reply drafts, human authority/publisher, immutable linkage and no-change review. Replace only corresponding barriers in the same slice; prove direct legacy/private insertion remains denied. Current plan publication/first-service branch stays unchanged. Add latest public review and historical snapshot/export projection.
4. **Source lifecycle slice.** Pin MIME/caps/consent/source-grant DTOs, immutable original versions, streaming/private proxy and Storage guards; connect actual upload/complete/read. Implement resolved never-started manual deletion and started/end +12-month processing/holds/account cleanup. Do not enable raw uploads as an assumed success before byte/retention verification. Source-reference metadata work can proceed independently of email provisioning.
5. **Template slice.** Safe standalone version schema/validation, explicit sanitized extraction if offered, immutable versions and `create_draft_v1` instantiation. Prove no client-fact/source carryover. No custom client page or application code generator.
6. **Product commerce and account/service slices.** Version-aware immutable product basis, complete quote terms/acceptance, existing manual claims/receipt, actual purchase/fulfillment/return/reconciliation, refund/referral obligations and profile/contact/renewal/cancellation/export. Pin calendar policy before changing future period validation; preserve all prior finance. Account/source/export administration boundaries are shared contracts, not UI heuristics.
7. **Actual delivery/inbox slice.** Reuse fixed service outbox seam, provider/local sink adapter, uncertain reconciliation, authenticated webhook, recipient inbox/seen/retry. Delivery failure never republishes. Can develop against an isolated sink before email-domain production prerequisite is satisfied.
8. **Shared adapters and remaining UI.** Wire complete Maya/private walkthrough modes and feature pages only against accepted connected contracts/fixtures. Then complete all D01-D48/screens/V01-V17, responsive/accessibility/human comprehension, migration preservation and single-cutover/rollback evidence. Root shared composition remains one writer.

New migrations are **forward only**, generated by the **actual installed CLI at implementation time** after an exclusive writer is allocated: inspect `supabase migration new --help`, then `supabase migration new <approved_domain_stem>` and record the returned actual filename/order. No timestamp/filename is invented or reserved by this report. Never edit the already-reviewed 54/55 for these new features, reapply fixture SQL as canonical, reorder historical migrations or introduce real principal/source/grant seeds. Each accepted slice includes schema expansion + enforcement + strict TS/SQL metadata + narrow fixed gateway integration together; unsupported operations keep truthful denial.

Required later implementation evidence is not executed here: full canonical migration reset/pgTAP in a distinct positively owned snapshot; actual Auth/PostgREST/Storage/Edge and cookie/Vault journeys; concurrent after-wait revocation/CAS/rollback cases; byte/ID/date/payment/Start/private-walkthrough preservation manifest; direct RPC/helper/raw-table ACL/RLS/search-path negatives; source/outbox recovery; full root tests/types/Expo web and applicable native checks; portal/session/build/UI/visual/accessibility checks; exact-head CI before any separately authorized merge. Keep synthetic fixtures visibly isolated, no root install or heavy runtime work in a source-only research task.

Rollback remains additive/forward: preserve immutable new outputs and queued/uncertain deliveries, disable unsupported writes, retain a compatibility read-only renderer/admin path; never roll back to a writer that bypasses approved authority or silently drops V3 content. Any destructive database restore requires separately verified backup/reconciliation and authorization, not a down-migration erasing money/publication/email evidence.

## 15. Known software gaps versus remaining external prerequisites

| Classification | Exact remaining item |
| --- | --- |
| Software, source-backed | Full actual-use/unknown Start/identity/latest-review projection; optional goal reports/conversations/amendments; versioned exact review/instruction/reply; meaningful history/export; immutable raw uploads/consent/scoped byte access/retention; safe templates; complete product quote/fulfillment/reconciliation; refund/referral bookkeeping; profile/verification/calendar renewal/cancellation; provider worker/webhook/inbox/seen/retry; workspace management projections; five-stage Maya/private adapters. |
| Contract refinements to pin, not new business design | Exact domain DTO/action/error limits; audio/text/container validation bounds; source offset encoding; typed event source key; future calendar period policy/constraint branch; private rights projection and safe publication-list classification. Existing approved behavior remains fixed. |
| Resolved founder issue | D39 never-started draft audio/transcripts: manual authorized-advisor deletion. No automatic abandonment deadline to invent and no need to ask that question again. |
| Operational/legal prerequisite | Actual disclosed consent/obligation/hold determination and supported private agent credential provisioning/registration; no new production agent/source enrollment is assumed. |
| External release gate | Email provider/domain/signing/reconciliation production setup and actual test delivery; representative-human comprehension; external Wisconsin paid-service scope/credential verification. These are distinct from implementing source contracts and cannot be proven by an agent or fake provider success. |
| Authorization still absent | Production cutover/deploy/merge, real advice/publication/source/permission changes, real email or agent enrollment, real funds/refunds/payouts/retailer orders. Passing local software tests does not grant these. |

## 16. Executed checks and delivery scope

Commands were limited to local source/Git reads, bounded specification/research/source extraction, text comparison, the four unchanged pure contract/handler files below, and docs validation/commit. Some broad read outputs were truncated; relevant bounded ranges were reread. A mistaken extra skill path was absent and a multi-file `nl` invocation rejected its arguments; the actual skill files/source ranges were subsequently read directly. Neither involved application mutation. No network business action, browser/DOM, Docker, PostgreSQL/Auth/Storage process, credential/private fixture read, root install, hosted service, heavy suite, push/PR/merge/deploy/send/funds/order or memory write occurred.

```sh
pwd
git status -sb
git rev-parse --show-toplevel
git rev-parse HEAD
git log -5 --oneline
git show -s --format='%H %s' origin/main
git merge-base --is-ancestor d39a7d4943209080df7c4cf97d85784f462758bf HEAD
# rg/nl/sed/cat and Python read-only source/appendix comparisons described above.
env PATH="/Users/kanuj/.nvm/versions/node/v22.23.0/bin:$PATH" \
  node --experimental-strip-types --test \
  tests/portal-rebuild-domain.test.ts tests/portal-rebuild-handler.test.ts \
  tests/portal-rebuild-advisor-reads.test.ts tests/portal-rebuild-advisor-handler.test.ts
```

Pure checks: **19 passed, 0 failed/skipped**, exit 0, approximately 137 ms runner duration. Existing typeless-package warnings remain; no package change. Tests prove unchanged strict contracts/handlers with synthetic ports only, not proposed commands, actual SQL/Auth, browser or production readiness.

Docs validation is performed before the report-only commit: local Markdown targets/source line anchors, proposed-symbol/DTO consistency, no em dash in authored prose, exact sole changed-path scope, and `git diff --check`. Delivery commit SHA is returned in the handoff rather than embedded self-referentially here. Coordinator retains all canonical contract/status/CONTEXT_SYNC updates and implementation allocation. **This report recommends the next API seams; none is implemented or accepted by this commit.**
