# care API v1 and client plan view v2

Owner: Kanuj. Status: **pinned next implementation contract; not implemented or enabled**. This refines [remaining API reconciliation](research/W1_REMAINING_API.md#4-actual-use-exact-identity-and-one-renderer-d08-d11-d18-d26-d31) against D08-D12, D18, D26-D34 and D38-D40. It does not approve the unfinished first-slice follow-ups or start page fan-out. Existing [plan v1](PLAN_API_V1.md), [advisor reads](ADVISOR_READ_API_V1.md), imported decisions/specification and historical receipts remain unchanged.

## boundary and implementation order

One writer owns new `src/contracts/PortalCare*.ts`, the corresponding strict parser/positive mapper, one fixed `concierge_care_command_v1(p_command jsonb)` RPC, `supabase/functions/concierge-care/` and its forward canonical migration/tests. The actual CLI allocates the migration filename when implementation begins; no timestamp is reserved here. Reviewed migrations54/55 are immutable inputs. Coordinator owns the narrow retained-cookie/Vault `care` channel and application composition. No caller-selected RPC, URL, SQL, bucket, owner or role is accepted.

First implement the use/identity and dependency slice below, then goal reports/conversations and history against the same event rules. Exact review/instruction/reply publication is a subsequent guidance module, with independent exact human approvals and existing insertion fences retained until its replacement is complete. Sources, commerce, account, notifications and demos keep their separate remaining allocations. These domains must reuse the canonical ledgers identified in the reconciliation report.

Every request has `{schemaVersion:1,action:<closed literal>,...}`. Client requests derive owner from the actual session. Advisor requests name `clientId` only where explicitly listed and require current human edit/view authority. No task-agent care-report/identity/confirmation right is inferred from old plan grants. New task reads require a separately reviewed finite grant extension; until then they deny. Published client v2 content is positively projected and contains no private draft facts, source locators or private notes.

## exact shared values

Reuse `UUID`, opaque `ContentId`, `Revision`, `Hash`, `Known<T>`, `Schedule`, `SectionId` and `SourceLocation` from the existing root contracts. Dates are real valid `YYYY-MM-DD` reports; unknown dates remain `{state:'unknown'}`. Recording timestamps and actors come from the server. No approval, payment, shipment, delivery, photo or current clock supplies a missing Start.

```ts
type ClientPublicationRef = {version:number; documentSchemaVersion:1|2|3};
type PlanProductRef = {kind:'plan_product'; publication:ClientPublicationRef;
  productId:ContentId; slotId:ContentId|null};
type ReportedProductRef = {kind:'client_reported_product';
  reportedProductId:UUID; version:number};
type ProductRef = PlanProductRef|ReportedProductRef;
type Occurrence = {occurredOn:Known<string>;
  channel:'portal'|'text'|'call'|'video'|'in_person'};
type Acquisition = 'shelv'|'self'|'already_owned'|'unknown';
type ReportedProductBody = {name:string; brand:Known<string>;
  variant:Known<string>; strength:Known<string>; sizeLabel:Known<string>;
  labelPhotoIds:UUID[]};
type IdentityTarget = {subject:ProductRef; comparedWith:PlanProductRef|null};
type IdentityAnswer = {match:'yes'|'no'|'not_sure'; reportedName:string|null;
  variant:Known<string>; strength:Known<string>; labelPhotoIds:UUID[]};
type UseChange = {kind:'started'} | {kind:'paused'|'stopped';details:string|null}
  | {kind:'different';frequency:Known<string>;amount:Known<string>;details:string}
  | {kind:'unreviewed_added';details:string|null};
type EventRef = {kind:'legacy_report'|'goal_report'|'conversation'|'use'
  |'identity'|'reported_product'|'review'|'reply'|'instruction';id:string};
type EventReceipt = {requestId:UUID;event:EventRef;revision:Revision;
  recordedAt:string;notificationEventId:UUID|null};
```

**Single date source:** a `started` event uses `Occurrence.occurredOn` as its actual reported Start. Unlike the research proposal, the wire body has no second `startedOn` input that can contradict it. The server enforces the existing valid-date/calendar convention and rejects impossible/future reports; the UI must not infer an unknown date. A later amendment preserves original occurred/recorded dates in the original record and supplies an attributed correction.

A plan reference must resolve to the actual entitled immutable publication and exact product/optional slot. A reported product has a server-issued owner-scoped identity and immutable descriptor version, never a fabricated catalog/plan/slot/recommendation ID. Editing its descriptor creates a new version; old identity answers never silently apply to it. A plan-product comparison is null or the identical plan reference. A reported-product comparison may name the specific advised product being compared. Yes confirms the client's identity report, not verified formula, label completeness or professional approval. Missing material identity blocks dependent advice/purchase readiness, never a stop/concern report.

## use and identity commands

`Write` below means `requestId:UUID`; `UseCAS` means `expectedUseRevision:Revision`. Unknown keys and conflicting discriminants reject. A write returns `EventReceipt`, except reported-product creation returns `{receipt:EventReceipt,product:ReportedProductRef}`.

| Action | Exact fields after envelope | Authority / effect |
| --- | --- | --- |
| `report_unreviewed_product_v1` | Write, UseCAS, `product:ReportedProductBody`, `sourcePublication:ClientPublicationRef|null`, Occurrence, `acquisition:Acquisition` | Client owner, active care. Atomically create descriptor and unreviewed event. No Start, catalog or finance row. |
| `amend_reported_product_v1` | Write, UseCAS, `product:ReportedProductRef`, `replacement:ReportedProductBody`, `reason:string` | Own descriptor; append version/correction, preserve original. |
| `report_identity_v1` | Write, UseCAS, `target:IdentityTarget`, `answer:IdentityAnswer`, `sourcePublication:ClientPublicationRef|null`, Occurrence | Client owner, active care. Exact subject/version and optional comparison. |
| `report_product_use_v1` | Write, UseCAS, `product:ProductRef`, `change:UseChange`, `sourcePublication:ClientPublicationRef|null`, Occurrence, `acquisition:Acquisition`, `identityEventId:UUID|null` | Client owner, active care. No advisor permission or purchase prerequisite for pause/stop/different use. `unreviewed_added` only for a reported product. |
| `record_client_use_v1` | Same fields as `report_product_use_v1`, plus `clientId:UUID`, `confirmedClientReport:true` | Current eligible human advisor. Reported by client, recorded by actual advisor. |
| `record_client_unreviewed_product_v1` | Same fields as `report_unreviewed_product_v1`, plus `clientId:UUID`, `confirmedClientReport:true` | Same human attribution; no inferred Start. |
| `amend_use_v1` | Write, UseCAS, `eventId:UUID`, `expectedAmendmentHeadId:UUID|null`, `replacement:{product:ProductRef,change:UseChange,sourcePublication:ClientPublicationRef|null,occurredOn:Known<string>,acquisition:Acquisition,identityEventId:UUID|null}`, `reason:string` | Append-only correction in own client scope or authorized human recording. Preserve original actor/time/body; correction records its own actor/time/reason. |
| `read_client_plan_v2` | `version:number|null` | Owner-derived entitlement and actual care window. Returns `ClientPlanViewV2`. |
| `read_advisor_publication_v2` | `clientId:UUID`, `version:number|null` | Human safe-view authority, independent of edit/raw-source rights. Actual client care state remains visible. |
| `read_reported_products_v1` | `cursor:string|null`, `limit:number`, `expectedUseRevision:Revision`, `publicationVersion:number|null` | Further bounded effective reported-product state page; client owner/care read window. |
| `read_use_history_v1` | `product:ProductRef|null`, `cursor:string|null`, `limit:number` | Owner history under care read window; immutable events/amendments. |
| `read_advisor_use_history_v1` | Same as `read_use_history_v1`, plus `clientId:UUID` | Safe human view projection; private advisor records require separate history projection. |
| `request_status_v1` | `requestId:UUID` | Currently authorized immutable receipt or `absent`; lookup failure never proves the original write failed. |

Label-photo IDs must refer to actual completed, authorized product-label objects. Until that lifecycle is connected, empty arrays work and unsupported/nonexistent IDs deny truthfully. Do not fabricate photo URLs or require label uploads to stop a product. Advisor-recorded identity can use the same bounded actual human-recording extension when its explicit DTO/test is pinned; no generic impersonation flag.

Self-purchase creates no Shelv quote/order/payment. A different/unreviewed product remains unreviewed even with an explicit Start. `unreviewed_added` alone supplies no Start. Existing immutable activation records remain inspectable and unchanged; new events are an overlay, not replacements for old rows.

## bounded v2 projection

`ClientPlanViewV2` retains the exact immutable document, decision projection, legacy `actualUse` facts and existing access fields, with `schemaVersion:2`, a new `use` projection and `latestPublicReview:null|PublicReviewSummary`. Initially no public review is fabricated; the summary stays null until actual guidance publication exists. Advisor v2 retains the actual review schedule and client access from advisor v1.

There is exactly one effective state per selected immutable document product, at most50. Its effective `PlanProductRef.slotId` is null; the server aggregates all actual events for that publication/product, retaining each event's exact original slot as context. No product-by-slot Cartesian state array or dropped paused state. Each effective state includes exact product/version, state `not_reported|using|paused|stopped|using_differently|unreviewed`, `originalStart:Known<string>`, at most one compact latest attributed event/identity summary, contradiction:boolean, and a separate current amendment summary. The original Start stays distinct from the latest stop/pause event and correction. `UseEventSummary` retains original event identity, product/slot, changeKind, reportedBy, recordedBy, channel, occurredOn, recordedAt, acquisition, source publication and real original activation/identity references. It omits long change details. `IdentityEventSummary` retains exact target, match and attribution without full answer/photo arrays. `UseAmendmentSummary` identifies id/eventId/amendedBy/amendedAt and the effective replacement product/changeKind/occurredOn, so an original P1 report corrected to P2 remains coherent. Full original UseChange/IdentityAnswer and full amendment reason/replacement remain in separately paginated history. A reported descriptor creation entry includes `initialUse:AttributedUseEvent|null` for its same-UUID unreviewed_added event, with one head/outbox/business event; correction descriptor versions carry null. It never fabricates a Start. These summaries never overwrite the original event or attribution; a reported-product effective row also includes its actual immutable descriptor/version, not a catalog imitation.

The `use` envelope is `{revision,planProducts,reportedProducts:{items,nextCursor}}`. Plan-product states are bounded by the actual document product count(max50); reported products use a requested1..100-item page. History is a separate paginated ledger, never an unbounded array in every plan read. Cursors bind owner, selected publication/filter, head revision and ordering; changed heads produce conflict/reload. Public and advisor-private history have separate positive mappers. `carePageMaxBytes=400000` bounds an entire reported/history page, which may contain fewer than the requested limit and supplies the proper nextCursor. `careResponseMaxBytes=1800000` bounds the complete v2 response below the retained provider2,000,000-byte ceiling; `careCommandMaxBytes=500000` remains scoped to care JSON. Enforce actual UTF-8 bytes in SQL/Edge/mapping, including metadata/cursor overhead, without raising global transport limits or truncating reported text. Test a valid near500k plan, all50 maximum summaries and byte-bounded descriptors; every valid single history entry must fit a page.

Use state carries across this client's authorized publications only for the same opaque product ID and exact immutable descriptor tuple(name, brand, variant, strength, sizeLabel, productUrl, reference). Preserve original event publication/slot and actual known/unknown Start; a new plan/read creates no use event, head, notification or Start. Identity answers/formula authority do not carry. Same ID with changed descriptor is unresolved: contradiction:true, state:not_reported, originalStart:unknown, with original report retained for clarification; consumers suppress unqualified continue guidance. Different IDs never alias. Only effective-summary validation permits the same product ID across publication references; commands/identity/history filters retain exact context. A historical document receives an explicitly current-use overlay, which may reference a later authorized publication. Full details are fetched via the summary's original product reference or unfiltered history.

Known occurred dates sort by occurred/recorded order with stable IDs; unknown occurrence remains visibly unknown and uses recording order. A newly reported pause/stop must promptly suppress unqualified continue guidance even with an unknown occurrence date. Backdated conflicting reports remain explicit rather than silently replacing newer use. A contradiction is shown for review, not automatically resolved by advice generation. One shared client/preview/history/demo renderer consumes this normalized overlay. Conditional stages retain authored `automaticAdvance:false`; unknown Start gives no elapsed-day anchor.

The v1 reader retains its exact Start-only semantics. Before enabling new states, switch the current candidate consumer atomically to v2. A current-use v1 path that would misrepresent a paused/stopped product must fail with a finite version-required code; lossless historical documents and old committed receipts remain readable under their existing authority. Do not silently add fields to strict v1 envelopes or manufacture status in `actualUse`.

## immutable events, dependencies and notifications

Use append-only care events, descriptor versions/amendments and independent per-client use/report heads. Preserve existing activations, reports, publications, service periods, decisions, money and their IDs/dates. Typed event source linkage extends the existing `plan_events`/delivery ledger; it does not create another competing outbox. Preserve old publication uniqueness; multiple distinct reports/use events at one publication must coexist. Material use/report/correction creates durable advisor attention and configured neutral email/portal events in the same transaction. Draft/private-note autosaves remain silent. Actual provider delivery/reconciliation remains a separate module and cannot republish or create Start.

Pin a private versioned dependency sidecar as described in the reconciliation report; preserve the original `plan_basis` result and strict `Draft.basis` meanings. `read_draft_dependencies_v1 {draftId,contentRevision,assignmentRevision}` returns a separate strict captured/current basis envelope. `rebase_draft_dependencies_v1 {requestId,draftId,expectedContentRevision,expectedAssignmentRevision,expectedHeads:{useHead,reportHead,instructionHead},expectedLegacyBasis:{publicationVersion,useRevision},expectedLegacyBasisManifestHash}` deliberately captures the inspected basis and creates a new content revision while preserving guidance text. It is not human review or approval.

Forward readiness, affected section hashes, current gate, exact approval/publication and deferred linkage checks all enforce captured-versus-current dependencies under the shared client lock. New material events invalidate affected reviews/current approval before publication. Ordinary save never blesses unseen heads; pre-extension drafts require explicit dependency review/rebase. Old immutable approval/save/status receipts remain historical acknowledgements, never fresh authority. No old public DTO is widened to carry private dependencies.

## invariants and required acceptance

- Strict TS parser/mapper/SQL schema and fixed gateway audience/action equality. Reuse existing bounded strings/identifiers; new text max4000, names max200, arrays of goals/photos/product reports bounded by source/document caps, page1..100, labelPhotoIds max100, actual UTF-8 page/response budgets above. Exact concrete exported metadata is committed in the early seam before a consumer begins. No permissive JSON patch.
- Preserve request -> client -> domain lock ordering, with current policy/principal/session/task/source/care checks after waits and before cached/private return. New and old request UUID collisions cannot replay another payload/family. Same command retries return the same immutable receipt.
- Pure red/green tests for new/unknown/none values, all exact product refs and strict keys. Persisted tests for known/unknown Start, paused/stopped baseline and introduced product, self-purchase, different product, identity yes/no/not-sure, attribution, corrections/concurrency, dependency invalidation/rebase, outbox uniqueness and rollback.
- Actual Auth/Edge/PostgREST/cookie/Vault/browser journey: owner reports use/unknown date, current v2 reread, actual safe history/alert, no finance or inferred Start; advisor records confirmed report with proper attribution; cross-owner/read-only/ended/revoked/after-wait negatives. Photo cases use real completed storage, never fixture-only references.
- Full canonical reset/pgTAP and preservation rehearsal after new migrations, least-privilege/raw-helper/Storage checks, applicable root/portal/session/types/build/UI checks, independent review and exact-head CI. Existing populated R4 is preserved; no reset while another reviewer owns it. No deployment/merge or live business action follows this contract.
