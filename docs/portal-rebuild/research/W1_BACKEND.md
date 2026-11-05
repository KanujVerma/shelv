# W1 backend reconnaissance

Owner: Kanuj. Researcher: W1 plan platform. Inspected 30 October 2026. Status: source reconciliation and proposed implementation boundary; no backend implementation or hosted verification.

## Result and next slice

Retain the canonical `concierge` backend, immutable publication/Start/financial records, and cookie/vault gateway. Add versioned drafts, content review/approval, task grants, private sources and a transactional outbox inside those boundaries. Do not use `apps/portal/backend/source/` as the new backend, make placeholder Auth clients for drafts, bind approval to `cases.revision`, or expose a generic SQL/RPC proxy.

The first implementation slice should be **incomplete unassigned draft -> assign an existing admitted synthetic client -> exact human review/approval -> existing manual service quote/claim/verified receipt -> deliberate publication -> entitled client read and notification -> decision response with unchanged actual routine**. Implement the publication barrier for every old route in the same slice. Stop before broad page fan-out until real isolated Auth/PostgREST and concurrency acceptance pass.

The existing backend can supply identity/admission, immutable publication anchors, manual payment verification, service periods, entitlements, Starts, public/private review separation and storage fencing. It cannot currently supply unassigned/incomplete drafts, exact human approval, owner/Sami policy, task-scoped agent authority, structured multi-goal/schedule/provenance, notification delivery, 12-month source processing, or a 30-day care-read window. Details and exact source evidence follow.

This report proposes interfaces for coordinator reconciliation. It does not amend the agreed [implementation contracts](../IMPLEMENTATION_CONTRACTS.md), allocate migration numbers, change a permission, or claim the proposal exists.

## Runtime, workspace and authority evidence

Fresh live calls, before substantive source work:

```json
{
  "orchestrator_capabilities": {
    "parentThreadId": "thread:delegated-task:command%3Amcp%3A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%3Adelegate-task%3Aportal-rebuild-w1-backend-recon-20261030-r1",
    "inheritedProviderInstanceId": "codex",
    "inheritedModel": "gpt-6.1-sol",
    "inheritedOptions": [
      {"id":"reasoningEffort","value":"xhigh"},
      {"id":"serviceTier","value":"default"}
    ],
    "runtimeMode": "full-access",
    "interactionMode": "default"
  },
  "t3_thread_configuration": {
    "threadId": "thread:delegated-task:command%3Amcp%3A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%3Adelegate-task%3Aportal-rebuild-w1-backend-recon-20261030-r1",
    "modelSelection": {
      "instanceId": "codex",
      "model": "gpt-6.1-sol",
      "options": [
        {"id":"reasoningEffort","value":"xhigh"},
        {"id":"serviceTier","value":"default"}
      ]
    },
    "runtimeMode": "full-access",
    "interactionMode": "default"
  }
}
```

The catalog also advertised `gpt-6.1-sol` with `xhigh` among its supported reasoning values. These are tool-returned selections, not a self-reported model guess. No nested agents were started.

- Workspace: `/Users/kanuj/.t3/worktrees/shelv/t3-0e852b97`.
- Branch: `t3/w1-backend-recon`.
- Starting HEAD and parent base: `9be041db5b7227637f0c3ba964d932c6bc6d0e06`, exactly the requested `9be041d`.
- Initial `git status --short`: empty. `git fetch origin` succeeded. `origin/main` was `d39a7d4943209080df7c4cf97d85784f462758bf`; `git rev-list --left-right --count HEAD...origin/main` returned `5 0`.
- Owned write-set: this report only. No contracts, migrations, application/package code, runtime fixtures, shared status files or credentials were edited/read as private inputs. The final report commit is the delivery HEAD returned with the handoff, rather than a self-referential hash embedded here.

Read root and portal AGENTS; rebuild README, D01-D48, complete desktop specification, implementation contracts, workstreams, current status, implementation plan and acceptance matrix. Read relevant founder operations, portal acceptance and source provenance. Approved prospective D14-D25/D32-D40 supersede conflicting older behavior. Historical provenance remains historical.

## Canonical source and fixture map

| Source | Reuse and evidence |
| --- | --- |
| `src/contracts/ConciergePortal.ts:4-58` | Existing R1 recommendation/item state, client/advisor projections and strictly named RPC commands. Client target is derived from verified identity; the payload is not an authorization grant. |
| `src/contracts/ConciergePresentation.ts:4-24`, `ConciergePresentationValidation.ts:12-24,44-70` | R2 product/step/card/guidance model and strict plain-content schemas. Stable opaque product/slot IDs already permit two same-category products when IDs differ. No need for invented product categories. |
| `src/contracts/ConciergeService.ts:5-28,37-64` | Conversation review, instruction draft/publication, actual purchase/return and cancellation commands and public/private projection mapping. |
| `src/contracts/ConciergeAdmission.ts:3-22` | Separate client admission intent/receipt. An unassigned draft must never invoke this implicitly. |
| `supabase/functions/concierge-operations/commands.ts:7-71`, `handler.ts:19-68`, `runtime.ts:9-59` | Exact command parser, safe handler and fixed Auth/PostgREST RPC registry. Retain `/auth/v1/user` verification and bearer propagation to SQL. No caller-selected endpoints/RPCs. |
| `supabase/functions/concierge-payments/{contract,methods,evidence,storage,runtime}.ts` | Existing manual quote/claim/receipt and private evidence integration; extend with W5, rather than adding another payment ledger. |
| `supabase/functions/concierge-checkins/{commands,submissions,projection,handler,storage}.ts` | Existing optional-photo reports, separate private notes/public replies, bounded upload, reservation/completion and short-lived media. Extend with W4. |
| `supabase/functions/concierge-admission/{handler,runtime}.ts` | Server-only identity creation/finalization, no invitation or automatic email. Admin authority is not plan-agent authority. |
| `apps/portal/backend/source/` | Retained partial source dependency for portable SQL/preview tests. Actual comparison at this base: 31 files, 26 identical to root, five different, zero missing root counterparts. |
| `apps/portal/backend/{migrations,proposals}/` | Retained preview migration/proposals are inputs to specific test harnesses, not a second canonical migration chain. `apps/portal/AGENTS.md:23-25` explicitly identifies root integration source. |
| `apps/portal/scripts/build.mjs:59-75` | Packages source/runtime hashes and reports `productionDeploymentChanged:false`; packaging does not apply SQL or activate a backend. |

The five differing fixture files are `supabase/functions/concierge-checkins/projection.ts`, `concierge-checkins/validation.ts`, `concierge-operations/preview.ts`, `concierge-payments/contract.ts`, and `concierge-payments/types.ts`, all relative to `apps/portal/backend/source/`. Do not overwrite root with them. When an affected test consumes copied code, deliberately update that dependency or switch the bounded test to canonical imports and prove the fixture still tests its intended lineage.

Canonical migration sequence examined:

| Migration under `supabase/migrations/` | What it establishes |
| --- | --- |
| `20261017190016_concierge_persistence_r1.sql:13-31,85-90,123-234` | Cases, intakes, baseline slots, assigned drafts, immutable publications/receipt/activation history, request journal, RLS/ACL denial. |
| `20261018234537_concierge_portal_workflows.sql:9-190,197-305,335-451,459-621` | Capabilities/enrollment, financial/address/evidence ledger, service/entitlements, check-ins, common locks/journal, guarded wrappers and private Storage. |
| `20261019015338_concierge_presentation_r2.sql:3-16,107-170,213-249` | R2 sidecars, fixed-shape validation, legacy content-version fence, R2 publish delegation, projections/ACLs. |
| `20261019171325_concierge_storage_probe_compat.sql:14-66` | Storage permission-probe compatibility with deferred commit-time actual-size validation. Probe shape is not upload completion. |
| `20261020002348_concierge_advisor_preview_v2.sql:10-45` | Exact saved-revision preview, target/revocation checks, client-safe envelope, authenticated-only execute. Later payment migration replaces its payment projection. |
| `20261020161532_concierge_maya_contract.sql:11-115,117-192,195-281` | Eight decision card kinds, nullable prior product/addition, plain schema validation, legacy wrapper, routine/projection compatibility. The old proposal header is not current deployment status. |
| `20261020183719_concierge_client_session_context.sql:2-32` | Permanent client identity/session, advisor exclusion, live enrollment; no payment required to sign in/read preparation. |
| `20261023002407_concierge_advisor_durable_session_context.sql:2-29` | Live permanent advisor/session/capabilities. |
| `20261024230528_concierge_founder_admission.sql:3-20,23-45,53-142` | Separate admission permission, session-bound intent, email lock, stable identity convergence, service-only finalizer. |
| `20261024230829_concierge_checkin_replies.sql:3-76` | Immutable client-visible replies apart from private notes. |
| `20261024234059_concierge_manual_payment_methods.sql:3-29,65-122,123-162` | Frozen recipient options, V1/V2 route fences, exact method-bound retries/evidence/receipt, preview payment upgrade. |
| `20261025011331_concierge_no_current_products.sql:5-49,54-162` | Confirmed none, exact active routine basis, saved/publication revalidation and final current R2 publish implementation. |
| `20261025221028_concierge_service_workflows.sql:3-13,20-43,45-115,151-170` | Review/instruction/returns/cancellation records, renewal suppression, current directions without resetting Start. |
| `20261025221043_concierge_private_walkthroughs.sql:5-46,78-84,159-197` | Independent immutable sanitized walkthroughs and scoped expiring/revocable sharing. Preserve this namespace and grants; it is not raw-source storage or live-client publication. |
| `20261026185922_concierge_client_account_display_name.sql:3-14` | Current client V2 read adds only its own canonical display name to guarded projection. |

Also examined `20260928000000_p0c_account_deletion_upload_fence.sql:1-53`, the Auth/RLS/private Storage test boundary, and `supabase/functions/delete-customer-account/index.ts:143-151,223-245`. A durable deletion fence precedes object cleanup; cleanup failure preserves identity and fence for retry. New source buckets cannot be omitted from this flow.

Source provenance reports provider-assigned migration aliases that differ from canonical filenames, including service/workthrough aliases (`docs/PORTAL_SOURCE_PROVENANCE.md:50-57`) and an operations-only later release (`:9-17,34-36`). Do not blanket-push, replay, repair or rename historical aliases on a hosted project. This task performed no hosted readback, so those deployment facts are attributed repository records, not fresh runtime evidence.

## Existing invariants and concrete gaps

| Requirement | Examined evidence and compatible consequence |
| --- | --- |
| Unassigned and incomplete storage, D14-D16 | `...persistence_r1.sql:14-18` keys drafts by admitted `client_id` with required intake FK; final R2 `...no_current_products.sql:77-103` validates a complete presentation and latest intake. `ConciergePresentationValidation.ts:24,44-70` rejects missing required fields. Add a distinct working-draft identity and weaker safe-storage validation; do not weaken publish validation. |
| Separate content revision | Core content/notes use `cases.revision` (`...portal_workflows.sql:223-246`); finance uses `payment_heads` (`:383-386,445`), reports use `checkin_heads`, service uses `service_heads`. Payments currently do not increment the case revision, but there is no content hash/approval at all. Preserve the separate ledgers and introduce explicit content identity, rather than assuming aggregate revisions will stay unrelated forever. |
| Multiple goals, schedules, provenance | Intake is one `goal` string (`...persistence_r1.sql:15`); R2 usage is periods/order/short/instructions (`ConciergePresentation.ts:8`); source is only label/URL (`:4`). Free prose can describe conditions but there is no structured selected-day/gradual schedule, fact attribution, source-location pointer or unresolved-contradiction record. Add typed structure; keep authored instructions/cautions and do not turn schedules into automated escalation. |
| Known none versus unknown | Confirmed none is already explicit (`...no_current_products.sql:16-25,134-157`). An incomplete draft needs `unknown` as well. Never save unknown as `none` or fabricate a product/instruction to satisfy R2. |
| Human/owner/Sami authority | `...portal_workflows.sql:120-132` gives global capability bits, not owner identity, required Kanuj approval or per-client agent rights. `ConciergePresentation.ts:20-24` and operations commands `:50-54` have no approval command. Add owner policy and exact server-issued approval; names/metadata/model fields cannot confer a role. |
| First payment gate | `...portal_workflows.sql:273-303` publishes on enrollment+publish permission, then activates any payment; it does not require a verified payment first. Final R2 delegates into it (`...no_current_products.sql:104-131`). Client read hides unpaid publications, which is different from denying publication. The approved rebuild must reject the commit itself. |
| Later publication coverage | The same plan publish wrapper checks active enrollment, not `service_active`. Instruction publication does check active service (`...service_workflows.sql:85-92`). New plan, instruction and review publication must share current authority/coverage checks. Do not charge another first-service fee for updates. |
| Paid first publication support | Existing prepublication service-only quote is supported (`...portal_workflows.sql:335-349`); confirmed service with no publication produces a pending period (`:422-435`). Reuse this. A sent claim or screenshot is not a confirmation. Do not make payment confirmation invoke publish. |
| Dates | `activate_service` anchors pending periods to first publication in Chicago (`...portal_workflows.sql:148-170`), with exclusive period end. `service_anchor` uses max prior end, so repeated month additions can clamp permanently after February. No two-week/month-one/two/three review schedule or guarantee ledger exists in these concierge migrations. Coordinate a documented calendar-anchor extension with W6; never re-date legacy periods. |
| Durable notifications | No outbox/notification/email job tables, commands or provider webhook processing were found in the inspected canonical concierge migrations/functions/contracts. Public reviews/replies are immediately projected (`...service_workflows.sql:66-80`, `...checkin_replies.sql:14-21`). Add commit-coupled events; UI success alone cannot establish delivery. |
| Source storage/access | Meeting notes/transcripts are private inline text (`...portal_workflows.sql:20-24,213-217,239-242`), not bounded file uploads. Existing private buckets are only payment evidence and check-in photos (`:574-605`). Their advisor reads use generic `view`, not recording-specific grants. New raw sources need a separate private bucket and explicit scope, not public URLs or blanket advisor `can_view`. |
| Retention/deletion | `private-storage-cleanup.ts:7-35` only inventories the two existing concierge buckets. No source service-end/12-month deletion job exists. Unassigned sources also lack an agreed abandonment deadline. Keep raw-source retention independent of plan/financial history and care access. |
| Actual use/history | Existing Start requires approved+received product and appends immutable activation (`...persistence_r1.sql:199-217`); no payment/order is required for the client `receive` action, so self-acquisition already need not fake a Shelv order. Existing model lacks pause/stop/different use/unreviewed product, occurrence-unknown, reporter/recorder, acquisition route and amendments. Extend event history; do not overwrite advice or infer Start. |
| Reviews | Existing conversation reviews need no form and keep private notes separate (`...service_workflows.sql:97-100`). They are immediately public, not reviewed draft->publish. Check-ins contain comfort/consistency/changes, without goal IDs or corrections (`...checkin_replies.sql:34-43`). Reuse existing records where representable, append enriched reports/review links and amendments, and gate their publication. |
| Read-only service | Cancellation records and renewal suppression exist (`...service_workflows.sql:20-43,151-156`), and service operations preserve administration after support. `portal_projection` selects entitled history without a support+30-day upper bound (`...maya_contract.sql:219-230`); `access` allows non-revoked cancelled clients (`...portal_workflows.sql:125-132`). Client session `canWrite` is only enrollment status (`...client_session_context.sql:28-29`), and ClientProvider ignores that field (`client-upstream.ts:16-26`). Enforce care windows in SQL, separately from admin reachability and session UI capabilities. |
| Legacy amounts | Service receipt constraints permit only 0/10000 cents (`...portal_workflows.sql:56-70`). This is not evidence that historical externally paid $25 records are represented. D47 requires preservation of actual legacy amounts, not new $100 synthetic receipts. Any evidence-backed import/constraint extension is W5/W6 work; private ledger state was not inspected here. |

Paths abbreviated with `...` in this table are the exact canonical migration filenames listed in the preceding table.

## All publication and client-visible guidance paths

The source has one insert into core `concierge.publications` (`...persistence_r1.sql:178`). The function was moved and renamed to private `concierge.r1_write` by `...portal_workflows.sql:199-200`. Current callers form this chain:

1. Edge operations action `publish` -> public `concierge_write` -> private `r1_workflow_write` -> private `r1_write` -> core publication.
2. Edge `publish_v2` -> public `concierge_presentation_write` -> private `presentation_write_products_v2` -> private `r1_workflow_write` -> `r1_write` -> core publication and R2 sidecar. Final definitions: `...no_current_products.sql:54-60,104-137`.
3. Direct authenticated PostgREST RPC calls reach those same public functions without cookie-gateway action filtering. SQL must enforce the gate. Private functions have revoked execute ACLs (`...presentation_r2.sql:248`, `...no_current_products.sql:160`), which must remain revoked.
4. Operations `publish_instruction_revision` -> public `concierge_service_write` -> `concierge.instruction_publications` (`...service_workflows.sql:85-115`). This changes current guidance without core publication.
5. Operations `record_review` -> `concierge.service_reviews` is public on insert (`...service_workflows.sql:66-80,97-100`), currently only `edit` capability.
6. Check-ins `send_advisor_reply` -> `concierge.checkin_replies` is public on insert (`...checkin_replies.sql:14-27,51-54`), currently only `edit` capability. An unrestricted skincare reply cannot be a way around Kanuj's initial approval rule.

Do not mistake `walkthrough_private_import` for a live-client publishing route: it writes its separate sanitized fictional/private-demo namespace under service-only authority (`...private_walkthroughs.sql:169-196`). Preserve its independent review and revocable share boundaries. It must not acquire source or live plan API rights.

Recommended barrier: a common private `concierge.assert_publication_authority(...)` plus insert-time/deferred linkage invariants on **core publications, instruction publications and client-visible review/reply records**. For the selected rebuild policy, old public actions lacking exact target/revision/approval arguments return `content_version_required` before a new write. All candidate writes use the new command. Historical reads and committed receipts stay readable through authorized compatibility/status reads. Do not accept a caller-set GUC such as `approved=true` as a trigger bypass: ordinary SQL callers can set custom settings. The trigger verifies persisted approval, target/content identity and publication linkage, with the same transaction locks.

A server-owned candidate-policy selector may support isolated rollout, but it is never a client input. Newly admitted cases in an activated rebuild default to gated publication. Before cutover, select every applicable existing writable case or freeze its publication; a nonselected legacy client cannot remain an undisclosed bypass. A UI feature flag alone cannot enforce D21-D23. No historical row needs a fabricated approval or notification to satisfy a rule for future inserts.

For free-text review/reply publication, the safe initial implementation routes it through exact reviewed `review` content. An optional later distinction for operational acknowledgements must have a separate bounded operation; do not classify arbitrary free text as non-skincare to bypass publication authority.

## Proposed versioned data and wire types

Own these in `src/contracts/PortalRebuild.ts` and strict parsers/mappers in `PortalRebuildValidation.ts`; expose one authenticated command implementation shared by UI and external task agents. Discriminants below are proposed fixed names, with no dynamic RPC/URL in the request. UUID/date/revision/text validators retain current strict limits, Unicode treatment and safe errors.

```ts
type UUID = string;
type Revision = number; // safe integer, >= 0; server checks overflow
type Day = string;      // validated YYYY-MM-DD, Chicago calendar where relevant
type Instant = string; // server UTC ISO timestamp
type Hash = string;     // lowercase SHA-256 hex, computed/verified server-side
type SectionId = 'sources'|'client_context'|'decisions'|'routine'|'follow_up';
type DecisionKind = 'keep'|'pause'|'leave_out'|'replace'|'finish_then_replace'
  |'addition'|'optional_alternative'|'no_addition';
type Known<T> = {state:'unknown'}|{state:'known';value:T};
type ProductContext = {state:'unknown'}|{state:'none';factId:UUID}
  |{state:'recorded';productIds:UUID[]};
type SourceLocation = {sourceId:UUID;sourceVersion:number;locator:
  {kind:'whole'}|{kind:'time';startMs:number;endMs:number}
  |{kind:'text';start:number;end:number}|{kind:'page';page:number}};
type Fact = {id:UUID;kind:'client_report'|'advisor_conclusion'|'agent_proposal';
  visibility:'advisor_only'|'client';text:string;
  sources:SourceLocation[];contradicts:UUID[]};
type Goal = {id:UUID;text:string;factIds:UUID[]};
type Product = {id:UUID;name:string;brand:Known<string>;variant:Known<string>;
  strength:Known<string>;size:Known<string>;category:Known<string>;
  identity:'possible_match'|'client_confirmed'|'unresolved';
  formula:'unknown'|'label_recorded'|'verified';factIds:UUID[]};
type Schedule = {periods:('morning'|'evening')[];days:
  {kind:'daily'}|{kind:'selected';weekdays:(1|2|3|4|5|6|7)[]};
  condition:string|null;asNeeded:boolean;
  stages:{id:UUID;directions:string;minimumDaysFromActualStart:number|null;
    proceedOnlyWhen:string}[];anchor:'actual_start';automaticAdvance:false};
type Decision = {id:UUID;kind:DecisionKind;goalIds:UUID[];
  currentProductIds:UUID[];primaryProductId:UUID|null;alternativeProductIds:UUID[];
  reason:string;directions:string[];cautions:string[];limitations:string[];
  schedule:Schedule|null;factIds:UUID[]};
type RoutineStep = {id:UUID;slotId:UUID;kind:'product'|'instruction';
  productId:UUID|null;directions:string[];cautions:string[];schedule:Schedule};
type PlanContent = {schemaVersion:1;title:string;summary:string;
  context:{products:ProductContext;facts:Fact[]};goals:Goal[];products:Product[];
  decisions:Decision[];routine:RoutineStep[];
  followUp:{criteria:string[];authoredNotes:string[]}};
type InstructionContent = {schemaVersion:1;slotId:UUID;productId:UUID;
  basedOnPublicationVersion:number;baseInstructionVersion:number;
  directions:string[];cautions:string[];schedule:Schedule;reason:string;
  effectiveOn:Day;reviewId:UUID|null;factIds:UUID[]};
type ReviewContent = {schemaVersion:1;reportIds:UUID[];goalIds:UUID[];
  occurredOn:Day;channel:'text'|'call'|'video'|'in_person'|'portal';
  summary:string;reportedUse:string;conclusion:string;rationale:string;
  changes:string[];nextStep:string;nextReviewOn:Day|null};
type DraftBody = {kind:'care_plan';content:PlanContent}
  |{kind:'instruction';content:InstructionContent}
  |{kind:'review';content:ReviewContent};
type Draft = DraftBody & {id:UUID;clientId:UUID|null;
  state:'working'|'published'|'archived';contentRevision:Revision;
  assignmentRevision:Revision;contentHash:Hash;savedAt:Instant;
  basis:{publicationVersion:number|null;useRevision:Revision};
  origin:{kind:'new'|'template'|'legacy'|'historical';id:string|null}};
type ExactTarget = {draftId:UUID;clientId:UUID;contentRevision:Revision;
  assignmentRevision:Revision;contentHash:Hash};
type ApprovalScope = 'care_plan.publish'|'instruction.publish'|'review.publish';
type Approval = ExactTarget & {id:UUID;scope:ApprovalScope;approvedBy:UUID;
  approvedAt:Instant;publisher:{kind:'human';actorId:UUID}
    |{kind:'task_agent';actorId:UUID;taskGrantId:UUID};
  revokedAt:Instant|null;publicationReceiptId:UUID|null};
type ReadinessIssue = {section:SectionId;path:string;code:string};
type PublishReceipt = {requestId:UUID;publicationReceiptId:UUID;target:ExactTarget;
  kind:'care_plan'|'instruction'|'review';publicationVersion:number|null;
  instructionId:UUID|null;reviewId:UUID|null;publishedAt:Instant;
  firstServiceStarted:boolean;notificationEventId:UUID};
```

These are authoritative domain fields, not renderer-supplied navigation/button labels. Safe draft storage permits empty arrays/blank unfinished guidance and explicit unknowns; it still rejects unknown keys, executable markup/code, malformed types/references, unbounded input and unauthorized source references. Readiness separately requires sufficient goal/context, coherent identities/dependencies, appropriate complete guidance/cautions, all affected sections reviewed, exact current basis, and no consequential unresolved detail for a dependent decision. A missing price need not block care advice, but blocks a payable product quote. No numerical skin score or inferred formula/identity is introduced.

For instruction/review drafts the strict save union selects their corresponding content type, not a fabricated care plan. Private review notes are saved through a separate authorized private-note command/record and never embedded in `ReviewContent`. The first vertical slice implements the care-plan branch and shared publication authority; downstream workers must use these typed review/instruction branches before enabling their new public writes.

Empty `routine` or `decisions` can be valid when authored appropriate; readiness must not invent products or require purchases. `slotId` denotes a stable routine position/instance, not a product category. Imported R2 opaque IDs retain an explicit immutable legacy-ID mapping; do not replace their identities in history. Source locators use defined zero-based offsets and half-open ranges (pages are one-based); clients receive permitted source citations, not private raw object IDs/paths, transcripts or private context facts.

Section reviews persist `sectionId`, section hash including dependencies, client/assignment identity, human actor and server time. Marking a section requires exact current revision/hash; a payment write changes neither. Only reviews whose dependency hash still matches may carry over after an unrelated section edit. Any content edit invalidates whole-publication approval. Assignment increments assignment/content revision and invalidates approval and relevant context review, even when bytes of guidance are unchanged. Source replacement/version change invalidates every dependent review and approval. Private note-only bookkeeping that is not a clinical basis is a separate audited stream, not a way to edit publishable context covertly.

Hash convention: SQL computes SHA-256 of its canonical `jsonb` envelope containing schema, draft ID, intended client, assignment/content revisions, publishable content and review-relevant basis/source-version manifest. Do not hash a browser's raw JSON bytes or accept its claimed hash. Finance/check-in heads and delivery attempts are excluded unless an explicit clinical dependency actually changes. The content hash never grants authority by itself.

### Commands and stable signatures

Every write has `schemaVersion:1`, `action`, UUID `requestId`, and the exact expected revision(s) described below. Every response is allowlisted and includes only permitted fields. Read commands do not mutate autosave/review state. `request_status_v1` is scoped to the authenticated principal and supports uncertain outcomes without inventing success.

```ts
type CommandEnvelope = {schemaVersion:1};
type DraftWrite = CommandEnvelope & {requestId:UUID;draftId:UUID;
  expectedContentRevision:Revision;expectedAssignmentRevision:Revision};
type PublishCommand = CommandEnvelope & {action:'publish_plan_v1';requestId:UUID;
  target:ExactTarget;approvalId:UUID;firstServiceClaimId:UUID|null};
// Actor/session/task authority is derived by the server, never supplied as true/role/name.
type PlanRpc = {name:'concierge_plan_command_v1';args:{p_command:PlanCommand}};
type SourceRpc = {name:'concierge_source_command_v1';args:{p_command:SourceCommand}};
type NotificationRpc = {name:'concierge_notification_command_v1';
  args:{p_command:NotificationCommand}};
```

| Action | Exact additional payload / result |
| --- | --- |
| `list_plans_v1` | `{clientId:UUID|null,cursor:string|null,limit:number}`; opaque bounded cursor, permission-filtered working drafts/publications; unassigned list requires workspace edit capability. |
| `read_draft_v1` | `{draftId}` -> Draft plus permitted reviews/readiness/approval status. |
| `create_draft_v1` | `{requestId,kind:'care_plan',templateVersionId:UUID|null}` -> unassigned Draft; no client/Auth creation. Review/instruction creation uses the same action with kind and explicit existing `clientId`/basis and its own strict union. |
| `save_draft_v1` | DraftWrite plus `{kind:'care_plan',content:PlanContent}` -> saved revision/hash/time. Full compare-and-save; stale writes reject, never last-writer-wins. Other kinds use the strict variants below. |
| `checkpoint_draft_v1` | DraftWrite plus `{label:string}` -> immutable checkpoint ID referring to exact content; no new content revision just for a label. |
| `assign_draft_v1` | DraftWrite plus `{fromClientId:UUID|null,toClientId:UUID}` -> revised Draft. Must match actual assignment, existing admitted active identity, free working-draft slot and source scopes. No new admission. Reassignment requires both scopes and source reconciliation; deny when a source cannot lawfully transfer. |
| `compare_import_v1` | `{draftId,baseContentRevision,baseAssignmentRevision,content:PlanContent}` -> validated base/latest/proposed diff and `proposalHash`, no mutation. |
| `apply_import_v1` | DraftWrite plus `{baseContentRevision,proposalHash,content:PlanContent}` -> saved Draft; require latest still equals reviewed comparison, mark changed/agent-authored sections needs-review. Never silently reapply stale content. |
| `validate_draft_v1`, `preview_draft_v1` | `{draftId,contentRevision,assignmentRevision}` -> readiness/issues or client-safe preview with explicit unpublished mode; preview confers no entitlement. |
| `review_section_v1` | DraftWrite plus `{sectionId,sectionHash}` -> server-attributed human review receipt. Agents denied. |
| `approve_publication_v1` | `{requestId,target:ExactTarget,scope,publisher}` -> Approval; human only, exact content/readiness checked. Kanuj grant required for task publisher. |
| `revoke_approval_v1` | `{requestId,approvalId,expectedPolicyRevision}` -> append revocation receipt; no erasure. |
| `publish_plan_v1` | PublishCommand -> PublishReceipt. `firstServiceClaimId` required only for first service activation; later publication requires active coverage, not another first payment. Kind/scope comes from persisted draft. |
| `read_client_plan_v1` | `{version:number|null}` -> current or entitled immutable historical client-safe model, actual use, decisions, latest relevant review, service access. Owner inferred; rejects caller `clientId`. |
| `record_decision_v1` | `{requestId,expectedDecisionRevision,publicationVersion,decisionId,choice:'approved'|'deferred'|'declined',reason:string|null}` -> decision receipt only, no charge/receipt/Start. Owner inferred. |
| `restore_publication_v1` | `{requestId,clientId,publicationVersion,expectedWorkingDraftId:UUID|null}` -> new working draft or conflict; never rewrites historical publication/events. |
| `request_status_v1` | `{requestId}` -> `{status:'committed',receipt}` or generic not found; principal-scoped, never lookup of another actor's request. No in-progress success claim. |
| `read_policy_v1`, `set_sami_approval_policy_v1` | Read policy; write `{requestId,expectedPolicyRevision,requireKanujApproval:boolean,confirmed:true}` -> audited revision. Owner only; cannot grant source access or waive agent grants/exact human review. |
| `grant_task_v1`, `revoke_task_v1` | Owner-controlled `{requestId,agentActorId,providerSessionId,clientId:UUID|null,draftId:UUID|null,actions,sourceIds,expiresAt}` or `{requestId,grantId}`. No wildcard clients/sources, no self-grants or admission/payment-confirm/policy permission. |

For the two later draft kinds, `save_draft_v1` is the exact discriminated union `{kind:'instruction',content:InstructionContent}` or `{kind:'review',content:ReviewContent}`, alongside `{kind:'care_plan',content:PlanContent}`; kind must match the persisted draft and cannot be changed by save. Care-plan save also carries `kind:'care_plan'`. `create_draft_v1` for an instruction additionally requires `{clientId,slotId,productId,publicationVersion,baseInstructionVersion}`; for a review it requires `{clientId,reportIds:UUID[],publicationVersion}`. Both require `requestId`, with server-created initial unknown/unfinished body, and never an arbitrary `templateVersionId` from another kind. `PlanCommand` is the closed union of these rows and discriminated variants, not `Record<string,unknown>`.

NotificationCommand is the closed read/write union `list_notifications_v1 {cursor,limit}`, `mark_notification_seen_v1 {requestId,deliveryId}`, and `retry_notification_v1 {requestId,deliveryId,expectedDeliveryRevision}`. Own-recipient reads/seen infer owner; retry requires recipient or specifically granted operational authority for that failed delivery. Dispatcher claim/result/webhook operations are internal service endpoints with their own fixed schemas and credentials, never actions exposed to plan agents.

For history/use module handoff, reserve `submit_goal_report_v1`, `amend_report_v1`, `record_conversation_v1`, `report_product_use_v1` and `amend_use_v1` on this same authenticated command family. Exact common event payload: `{requestId,expectedEventRevision,publicationVersion,occurredOn:Known<Day>,channel:'portal'|'text'|'call'|'video'|'in_person',amendsEventId:UUID|null}`. Goal answers identify `goalId` and `better|same|worse|not_sure`; use identifies exact `productId`, `started|paused|stopped|different|unreviewed_added`, details, `shelv|self|already_owned|unknown` acquisition and known/unknown actual Start. SQL supplies reporter/recorder/recordedAt; advisor records require the actual client's report and attribution. W4/W3 must finalize their strict payload unions with W1 before implementing consumers.

This report pins the initial vertical-slice commands; these reserved history payloads are a handoff boundary, not a claim those later modules are ready for independent implementation.

## Compatible records and authority

Add private tables in `concierge`, with explicit RLS, zero direct grants to `anon/authenticated/service_role`, pinned-search-path definer entry points only where required, and explicit public RPC execute ACLs. Never relax raw table access to make UI work.

| Proposed table | Constraints and purpose |
| --- | --- |
| `plan_templates`, `plan_template_versions` | Stable reusable template and immutable plain structured version. Template version is not approved client advice or executable page. |
| `plan_drafts` | UUID PK, nullable client FK, kind/state, content/assignment revisions, schema, JSON content/hash, basis and server time. Partial unique index `(client_id) WHERE kind='care_plan' AND state='working' AND client_id IS NOT NULL`. Many unassigned permitted. |
| `plan_checkpoints`, `plan_section_reviews` | Immutable content checkpoints and exact dependency-bound human reviews. Unassigned records do not reference fake cases. |
| `plan_approvals`, `plan_approval_revocations` | Exact target/hash/scope/human/publisher; immutable issuance and append revocation/consumption linkage. Unique consumed approval -> publication receipt prevents reuse by a second request. |
| `plan_principals`, `plan_policy`, `plan_policy_audit`, `plan_task_grants` | Server-enrolled human owner/skincare/operations identities; audited policy revision; agent principal/session/action/client/draft/source/expiry/revocation scope. Do not identify Kanuj/Sami by display name/email or user-editable JWT metadata. |
| `plan_requests` | Principal/request UUID PK, nullable client/draft, canonical fingerprint, committed receipt; supports unassigned work. Must check cross-stream collisions with existing `requests`, `workflow_requests` and `payment_v2_requests`. Cannot directly reuse `workflow_begin` because it creates a case and requires a real client. |
| `publication_documents`, `publication_approvals` | Immutable V3 client document/private provenance link and exact approval/receipt for the existing `(client_id,version)` publication. Same authoritative core publication identity; no competing publication ledger. |
| `service_clocks`, `review_schedule` | One initial publication anchor per client, original Chicago calendar day/timezone/policy; unique review ordinal (two weeks, months one/two/three, later monthly). Join existing real service payments/periods/entitlements. No new billing system. W6 owns coverage policy details. |
| `business_events`, `notification_deliveries`, `notification_attempts`, `notification_seen` | Immutable business source event, one delivery per event/recipient/channel, attempts/leases/provider result, independent seen state. No copied sensitive clinical content in event/email payload. |
| `source_objects`, `source_scopes`, `source_access_audit`, `source_deletion_jobs` | Immutable object identity/bytes/provenance, explicit draft/client+principal scope, audited access and resumable retention/deletion. No public raw URLs. |

Keep `concierge.publications`, `activations`, `receipts`, payment/address/manual-method records and existing review/instruction IDs authoritative. The R2 sidecar pattern is a suitable additive precedent. Do not force a rich V3 plan into R2 by dropping multiple goals/schedules/provenance or inventing a zero product price. Recommended core compatibility extension:

- Add a document-schema discriminator to `publications` for future rows and an immutable V3 sidecar linked to the same key. Keep old rows and presentation bytes unchanged. If a V3 draft has no legacy intake, permit nullable intake only for schema V3 with a deferred constraint requiring its complete document; legacy rows must retain their existing required intake/FK. Do not generate a fake single-goal intake just to satisfy the old FK. This is an explicit small schema change, not a separate backend.
- Legacy `recommendations` can contain only an actual lossless compatible subset; V3 document is authoritative for V3 decisions. Add a private version-aware decision lookup for quote/use handlers. Reject V1/V2 reads/writes on a V3 publication when they would silently omit semantics; return a version-required error. New client renderer handles R1/R2 through a read adapter and V3 natively.
- Quote/Start code that currently joins `publications.recommendations` must use that version-aware lookup for V3; preserve old joins/results for old records. Unknown price is not zero and is not a payable quote. Product acquisition/Start remains independent of service publication. W5 coordinates this bounded integration before V3 product purchasing is enabled.
- Adopting a legacy working draft takes an exact immutable copy into the new draft, with legacy IDs/basis and needs-review status. Freeze the legacy edit surface for that selected client. Do not leave two editable working drafts or delete unpublished work. Publication history is never bulk-converted in place.

The publication discriminator/nullable-V3-intake change is an explicit architectural recommendation for coordinator recording before implementation. It avoids both a competing publication backend and fictitious R2 intake/price fields. Do not silently introduce it while implementing a page adapter. Keep its deferred sidecar/approval constraints in the same tested migration slice.

Human authorization predicate: initially a skincare publication requires exact Kanuj approval even when Sami authored/operated it. Kanuj may deliberately review, approve and publish his own content. If the owner later disables **Kanuj-specific** approval for Sami, an eligible human still approves the exact content; this does not waive exact review or allow a task agent to self-approve. Each external-agent publication always requires Kanuj's exact target+task/publisher grant independently of the Sami setting.

Task agents must authenticate as registered nonanonymous **agent principals**, without global advisor bits, then present a live task/session grant. Existing `concierge.actor` permanent identity/deletion checks can be shared; `concierge.capability` cannot be applied as a substitute because it grants global advisor scope. Use a private `plan_actor` guard that branches on server-stored principal kind and intersects client/draft/action/source scope. Bind task grants to actual provider session IDs; validate `auth.sessions` and expiry for sensitive operations. An ordinary JWT with a human name or a model field `approved:true` confers no human authority. Agent credential issuance/revocation must use supported Auth, privately, before production agent activation; this repo currently supplies no such agent enrollment path. Development uses synthetic agents only.

At least one of grant `clientId`/`draftId` must be nonnull; when both are present they must identify the same assignment. Empty source scope means no raw-source access. Actions use a closed allowlist and bounded expiry, never `*`; a client grant does not implicitly include every recording or authorize creation of unrelated unassigned drafts. Owner issuance checks disclosed/authorized source access, not only the presence of an Auth account.

## Transaction and lock design

Use the existing request/client lock namespaces so financial/core/check-in paths serialize with V3. Establish a documented order for new multi-record operations:

1. Validate current identity/session, take shared policy/principal/task-grant rows (stable ordered IDs), and validate current scoped permission. An owner policy/grant revocation takes the conflicting update lock. Do not rely only on permissions cached in the vault or JWT.
2. Acquire `pg_advisory_xact_lock(hashtextextended('concierge:request:'||actor||':'||requestId,0))`.
3. For assigned targets acquire existing `concierge:client:<uuid>` locks in UUID order. For reassignment lock both old/new; take client locks **before** the new `concierge:draft:<uuid>` lock. Unassigned save/create only needs draft/request lock. If assignment changed after the preliminary scope read, fail/retry safely rather than acquire another out-of-order client lock.
4. Lock draft row `FOR UPDATE`; compare assignment/content identity. Existing payment/service/case row locks follow client serialization. Never take payment/client locks in the reverse order. Avoid waiting on a policy update while holding client locks; apply the shared policy lock consistently before mutation locks.
5. Re-check enrollment, target deletion, authority and scopes after waiting. These checks hold relevant rows through commit. Check request journals; exact prior fingerprint returns the committed receipt only after current access authorization. Different payload or cross-stream UUID is 409. A committed retry does not reconsume approval or require the vanished working draft; status reads do not create side effects. Revoked account/task access must still deny receipt disclosure.

Historical completed legacy requests can return their original exact receipt after live authorization and fingerprint verification; the new gate applies to a new insert, not a demand to fabricate retroactive approval. A legacy retry must never fall through and execute its old publication transition again. Preserve existing journals and their original results.

Existing source/storage code sometimes takes actor/profile/enrollment share locks before the client advisory lock (`...storage_probe_compat.sql:20-32`); preserve that order and test against deletion/admission. The list above is not permission to refactor every legacy function. During implementation, inspect actual wait graphs and add a deterministic lock test for each new cross-stream transaction. SQL deadlock detection is a recovery path, not a substitute for ordering.

For `publish_plan_v1`, under those locks, in one SQL transaction:

1. Validate fingerprint/retry, exact assigned client, one working target, schema/readiness/current source/routine basis, required human section reviews and current policy.
2. Lock and validate approval: exact draft/client/revisions/hash/scope/publisher/task; issued by eligible human; not revoked or used for another receipt. Reassignment or content/basis change rejects. A changed payment revision alone does not affect this check.
3. First publication: lock selected `payment_confirmations`/quote and pending `service_periods`; validate same client, actual confirmed applicable first service fee/quote, frozen method/claim identity and no conflicting initial anchor. A claim/evidence flag is insufficient. Existing confirmation functions supply the verified ledger. Later publication: require current coverage and authority; no new first-service charge.
4. Capture one server publication instant and Chicago day. Allocate next version using the locked canonical case. Insert immutable canonical publication+V3 document+approval link and appropriate item states. Preserve received/started continuity by stable identity/source, never infer Start. Do not call the old full validator on incomplete/richer content or bypass it with invented fields.
5. On first success only, call/refactor the existing `activate_service` logic to start the confirmed pending period from that publication and grant the new publication entitlement; create one immutable `service_clock` and review schedule. Updates grant their applicable entitlement without resetting the first anchor or existing Start. Check cancellation/current coverage at commit.
6. Mark draft published, consume approval through a unique receipt link, append meaningful business event, insert email and portal deliveries with unique `(source_event_id,recipient_id,channel)`, and save the idempotent receipt. Commit all or none. A sidecar/outbox/entitlement failure rolls back publication/clock/approval consumption.
7. Return the same receipt for a lost-response exact retry. Concurrent different requests with one approval yield one publication and one conflict; the losing caller can read the winner's authorized receipt. Do not publish twice to make both requests succeed.

The low-level insertion guard validates persisted approval linkage via a deferred constraint/trigger, including private legacy calls. An attempted legacy insert cannot commit without the required matching link. Defense must not depend on an Edge check, caller role string, UI state or mutable GUC alone. Instruction/review publication uses the same target/scope/receipt/outbox machinery and writes its existing immutable record rather than allocating a needless new care-plan version.

Outbox dispatcher: claim bounded ready deliveries with `FOR UPDATE SKIP LOCKED`, set lease/attempt ID, commit, then send outside the business transaction. Use a provider idempotency key derived from immutable delivery ID; append results with provider message ID and advance accepted/delivered/bounced/failed state monotonically. Reclaim expired leases with bounded retry/backoff. `retry_notification_v1` schedules the existing delivery, never calls publish. Portal seen/read is separate from provider delivery. Webhook verifier checks signature, timestamp/replay/event ID, recipient/message linkage and duplicate/out-of-order events. Local sink/test-recipient allowlist is mandatory in isolated development.

Database deduplication is achievable; exactly-once external email cannot be claimed after an acceptance/acknowledgement crash unless the selected provider supports an effective idempotency/reconciliation contract. Persist uncertain acceptance and reconcile it rather than claiming delivered or blindly sending duplicates. Provider/domain choice and production webhook secret remain release prerequisites.

## Source upload and scoped retrieval

Reuse existing reservation -> server Storage write -> byte/metadata verification -> committed completion. Existing photo handling checks immutable retry bytes/digest and reservation-specific completion (`concierge-checkins/handler.ts:57-87`); Storage uses no-upsert and short-lived signing (`storage.ts:25-51`). New recordings/documents cannot reuse image signatures, 5 MB assumptions, or trust caller MIME alone.

Proposed SourceCommand union:

- `begin_source_upload_v1`: `{requestId,draftId,expectedAssignmentRevision,kind:'audio'|'transcript'|'note'|'photo',originalName,contentType,sizeBytes,sha256,capturedOn:Known<Day>,channel,sourceConsentRef:UUID}` -> `{sourceId,uploadId,state:'reserved',maxPartBytes,expiresAt}`. No caller path/bucket. Types/size caps are server-owned policy; recordings require bounded streamed/chunked upload, not buffering through the 100 KB command endpoint.
- `source_upload_status_v1`: `{sourceId,uploadId}` -> reserved/uploading/verifying/complete/failed/uncertain. Storage acknowledgement alone is not complete.
- `complete_source_upload_v1`: `{requestId,sourceId,uploadId}` -> immutable descriptor only after actual bytes/size/type/hash verified; exact retry returns same result. Completion uses reservation identity, not unrelated draft/payment revision.
- `read_source_v1`: `{sourceId,version}` -> same-origin authenticated streaming handle; server reauthorizes source scope on every read/range request. Signed Storage URLs remain internal and <=60 seconds. An expired session, revoked task/source scope or deleting source denies future reads. Reassignment rechecks all associated scopes and does not implicitly move client recordings.
- `request_source_deletion_v1`: `{requestId,sourceId,reason}` -> queued deletion/hold status, not success until object deletion and absence verification complete. Retention worker uses a distinct privileged internal job, not an ordinary plan-agent command.

Use opaque paths by source/draft scope, not names, email or raw transcript content. Validate file names as metadata, never path input. Quarantine before making bytes readable; unsupported/active content is not rendered as code. MIME sniff/parser validation must handle proposed audio/text/photo types; define exact allowlist/caps with W0/W6 before upload is enabled. Large-source chunk operations bind upload ID, part sequence, length and digest, and authenticate each part. Abort/expiry cleanup is idempotent.

Private bucket policy denies direct raw authenticated/anon list/read/sign/write, following existing concierge restrictive policy. Server Storage I/O follows freshly guarded descriptors; insert/commit fencing checks the source reservation, source/draft/client status, deletion marker and exact completed metadata. Extend both the early Storage fence and deferred probe-size invariant for the new bucket; merely adding it to one allowlist is insufficient. Deleting/expired sources cannot be revived by a delayed upload. Keep no public object URLs, credentials or raw inputs in logs/analytics/errors.

Raw-source retention: while service active, then 12 calendar months after confirmed support end, with explicit applicable holds. A scheduled selector marks due objects, commits a no-new-upload/no-new-access fence, then removes bytes via Storage API and verifies absence; resumable jobs record object/tombstone/audit status separately. Purge derivatives/transcripts governed by that source policy too. Historic source references may retain a non-content tombstone; plan/financial/audit retention is separately controlled. Extend `cleanupConciergePrivateStorage` and account deletion so all sources are accounted for before Auth deletion; do not silently delete obligations/holds with cascading user deletion. Account-deletion/hold handling needs W6's explicit policy integration.

The agreed 12-month rule does not define abandoned **unassigned** source retention or no-service onboarding abandonment. Do not invent indefinite retention. The metadata/workflow can support an explicit deadline, but production upload in that state stays gated until that narrow retention rule is defined. Draft text can still be saved. This is a bounded missing policy, not a reason to reopen D14/D39.

## Service/read-only and client history handoffs

W6 should expose a single authoritative `care_access(c,at)` projection, not infer support from enrollment or browser date:

```ts
type CareAccess = {
  mode:'prepublication'|'active'|'read_only'|'ended';
  supportEndsOn:Day|null;readOnlyEndsOn:Day|null;
  canReadPlan:boolean;canWriteCare:boolean;canAdministerOutstanding:boolean;
  finalEntitledVersion:number|null;
};
```

Use exclusive support boundary at Chicago midnight of `supportEndsOn`; read-only is `[supportEnd, supportEnd + 30 calendar days)`. At read-only end deny care/history/source content access through every direct SQL/Edge read as well as the gateway; ongoing outstanding order/refund administration uses its separate authorized read/write projection. A valid session is not entitlement. Preserve revocation/deletion denial. Final export uses the last entitled immutable plan plus applicable current instruction revisions and excludes private notes/raw sources; download during the authorized window does not extend it.

Ordinary cancellation keeps support until actual paid end and stops renewal immediately. An early support end remains explicitly confirmed. Existing `service_cancellations` is append-once; corrections need an auditable amendment rather than mutating history. Guarantee/refund records preserve actual first-three-period paid amounts and request/necessary-details/repayment timestamps; no photo/adherence/fourth-payment gate. No operational status moves funds.

For new service clocks, recommend original-anniversary calendar arithmetic from first Chicago publication day, with month-end clamping from that original anchor, not repeatedly adding one month to the already-clamped date. E.g. Jan 31 -> Feb 28 -> Mar 31. This needs an explicit policy version and compatible per-period constraints: current `service_periods`/`payment_confirmations` checks require `end=start+1 month` (`...portal_workflows.sql:64-70`). Preserve existing periods and renewal quotes unchanged; W6 must reconcile that constraint before claiming anniversary renewals implemented. Initial one-month vertical slice can reuse the existing valid period while its future policy is pinned.

Review cadence is first publication +14 calendar days, then original months one/two/three and monthly thereafter, separate from booked appointments and ordinary 24-hour response obligations. Server schedules are data; later plan publication, email retry or product delivery never restarts them. Authored actual-use schedules anchor only to explicit known Start; unknown Start remains unknown and elapsed time never auto-increases frequency/strength.

W3/W4 extend immutable use/report events with original/amendment attribution and advisor attention. A stop/pause report is accepted promptly during active care without advisor approval, updates reported-use presentation, and does not delete/replace professional instructions. A no-change review appends public conclusion plus separate private note and notification without changing plan version or Start. Client care timeline groups meaningful published/report/use events; advisor audit includes draft/import/review/private operations only within scope. Do not expose autosave churn as care history.

## Gateway integration and security changes required

Retain current audience-specific cookies/vault, PKCE/return recovery, origin/CSRF, payload bounds and no-store projections:

- `runtime/server/policy.ts:5,26-60` has a finite Channel union, advisor action allowlist and an unconditional client UUID requirement for nearly all operations. Unassigned draft commands cannot be added blindly to this list. Add typed `plans`/`sources`/`notifications` operations with action-specific selectors, not a weakened global UUID rule.
- `client-policy.ts:3-14` rejects client/owner/RPC/credential injection and gives clients no admission/walkthrough rights. Add only owner-derived client plan/report/use/notification commands. No advisor command enters the client channel.
- `policy.ts:91-115` bounds JSON to 100 KB and validates canonical same-origin POST/CSRF; recordings use separate bounded authenticated streaming operations, not a higher universal JSON cap.
- `server/session-vault.ts:60-116,119-147` decrypts server-held credentials, refreshes against owner/session identity, rechecks current context and fences epoch/CSRF before/after operations. Preserve those checks and logout/late-response behavior.
- `workers/session-vault/index.ts:41-62,110-115` stores/binds audience and separate client namespaces; retain encryption key, namespace, class/export and session policy. Do not widen them to make an external agent work. Direct agent bearer API can call the same fixed Edge commands after task-scope checks; browser cookie API retains CSRF.
- `server/upstream.ts:120-134,157-179` validates session capabilities and exact preview envelope. `server/client-upstream.ts:7-8,16-26,28-45,64-79` filters private/credential fields and proxies bounded media instead of exposing signed URLs. Update explicit mappers for new schema/modes; do not return raw JSON from SQL.
- `concierge-operations/runtime.ts:57-59` has the fixed root RPC registry. New modules need explicit RPC names/strict parsers, safe error mapping and no automatic retries of uncertain writes. Client-specific source authority belongs in SQL, not only CORS or gateway.

Sensitive new SQL commands should validate live `auth.sessions`, banned/deleted identity and profile fence, as admission already does (`...founder_admission.sql:23-41`). Core `concierge.actor` currently checks permanent identity/profile deletion but not session row/banned status (`...persistence_r1.sql:35-46`). Keep existing guards; add the stronger gate where authority requires it, including direct PostgREST. Do not claim all existing endpoints already enforce provider-session revocation simply because the cookie vault does.

Shared gateway/auth composition remains coordinator-owned. W1 supplies narrow parser/RPC/mapping changes for that integration; W0 page adapters must not independently widen channels. Extend safe errors with validated section/path issues only, never SQL/private source/provider text. Expected HTTP semantics remain 400/401/403/404/409/413/415/429/503 as defined in the shared contracts.

## Tests, fixtures and evidence

### Proposed implementation files and exclusive integration seams

| Owner | Exact proposed paths / responsibility |
| --- | --- |
| W1 | `src/contracts/PortalRebuild.ts`, `PortalRebuildValidation.ts`, `PortalRebuildMapping.ts`: closed commands, safe draft/readiness rules, versioned public/private mapping and R1/R2 read adapter. |
| W1 | `supabase/functions/concierge-plans/{index,handler,commands,runtime}.ts`: fixed Auth/PostgREST plan command API; UI and scoped external agents use this same handler and `concierge_plan_command_v1`. |
| W1 | `supabase/functions/concierge-sources/{index,handler,commands,runtime,storage}.ts`: scoped descriptor/reservation/stream/completion API and server-only Storage. |
| W1 | `supabase/functions/concierge-notifications/{index,handler,commands,runtime}.ts`: own inbox/seen and authorized retry; `supabase/functions/concierge-notification-delivery/{index,handler,provider}.ts`: separate internal dispatch/webhook verification/provider adapter. No email provider dependency is activated by this report. |
| Coordinator-allocated W1 | New canonical SQL files from `supabase migration new portal_rebuild_drafts`, `portal_rebuild_publication`, `portal_rebuild_sources_notifications`, with final ordering assigned once. These are stems, not fabricated timestamped filenames. Include all ACL/trigger/deferred invariants and safe compatibility changes described here. |
| Coordinator/W0, W1 supplies bounded patch | `apps/portal/session-integration/runtime/server/{policy,client-policy,types,protocol,upstream,client-upstream,gateway,client-gateway}.ts`, `workers/session-vault/index.ts`: finite channels/selectors, exact envelopes, care capabilities and bounded source transport. Preserve audience, vault lifecycle and private credentials. Only touch files actually needed after final composition review. |
| W1 with W5/W6/coordinator | `supabase/functions/concierge-operations/{commands,handler,runtime}.ts`, `concierge-payments/contract.ts`, `src/contracts/ConciergeService.ts`, relevant source mappers and new migration replacements: legacy publication failure/receipt compatibility, version-aware decisions/coverage. Historical migrations themselves stay unchanged. |
| W1 with W6/coordinator | `supabase/functions/concierge-operations/private-storage-cleanup.ts`, `supabase/functions/delete-customer-account/index.ts`: new source bucket fencing/cleanup and explicit obligations integration; no independent permission relaxation. |
| W1/W7 | New root contract/handler tests and canonical pgTAP/native SQL tests listed below; `apps/portal/session-integration/runtime/tests/{plan-policy,plan-vault,source-scope,care-access}.test.ts`; new actual Auth journey `tests/portal-rebuild-native.mjs`. |
| Coordinator | `apps/portal/scripts/local-admission.mjs`, `local-admission-lineage.mjs` only if needed for a distinct explicit prepared-path option and stronger catalog manifest; retain existing ownership refusal. New fixture path/project must not reuse the parent's stopped snapshot. |

Paths in braces denote individual files in that directory. They are proposed future allocations, not this research write-set. No page worker changes these contracts, migrations or gateway files independently. The first slice may leave raw-file upload and external delivery disabled while proving exact plan gate plus durable outbox/local sink, but must not expose unimplemented actions as successful. Full source/delivery acceptance remains required before those features are called complete.

### Executed by W1 on the unchanged application base

`node --version` returned `v22.23.0`; installed Supabase CLI was `2.121.0`. Root/portal `node_modules` and this worktree's prepared admission fixture were absent. No dependency installation, database process, Docker/Colima lifecycle, Supabase reset/start/status, hosted call, private fixture/config read or real-client access was performed.

This focused command exited 0: **37 tests passed, zero failures/skips**. These are contract/handler tests with synthetic ports and pure lineage validation, not native Auth, Storage, SQL concurrency or new rebuild acceptance:

```sh
node --experimental-strip-types --test \
  tests/concierge-commands.test.ts \
  tests/concierge-presentation.test.ts \
  tests/concierge-service.test.ts \
  tests/concierge-admission.test.ts \
  tests/concierge-admission-runtime.test.ts \
  tests/concierge-checkin-replies.test.ts \
  tests/concierge-payment-methods.test.ts \
  apps/portal/tests/admission-lineage.test.mjs
```

Node emitted the existing typeless-package ES-module warning; no package change was made. Subsequent commands should explicitly pin Node as below because coordinator observed workdir-driven Node 20 selection.

### Coordinator-provided preserved baseline, not rerun by W1

During this task the coordinator reported, on source `9be041d`: portal 344/session 148/backend 40 passed; native SQL suites 12/15/12 passed; root 1,176 passed with 18 explicit opt-in skips; root app/test/session types, UI guard, portal build and Expo web export passed. Existing owned local-admission real Auth/PostgREST/browser journey passed 15 checks with all 53 canonical migrations attested. This is attributed coordinator evidence, not a W1 reproduction or proof of the unimplemented rebuild.

The parent fixture `shelv-portal-admission-8cb3813a54e9` at the parent's `.local-artifacts/portal-admission-fixture` is **STOPPED, volumes retained**. Do not reset/change/reuse it for a changed source snapshot. The existing Colima profile `shelv-portal-20261024` remains running, using explicit `DOCKER_HOST=unix:///Users/kanuj/.colima/shelv-portal-20261024/docker.sock`; default Docker context is unchanged. Only coordinator schedules heavy fixture lifecycle. New schema acceptance requires a distinct owned prepared path/snapshot/project/volume and an exact canonical reset/pgTAP plus real Auth lane.

### Existing tests examined and how to use them

| Test source | Real coverage and limit |
| --- | --- |
| `tests/concierge-presentation.sql.py:32-140`, `tests/concierge-workflows.sql.py:123-529` | Actual SQL writes, immutable history/private canaries, partial rollback, exact concurrent publish and cross-stream UUID, simultaneous financial confirmation. Historical harnesses require explicit local setup; not GoTrue/JWT/Storage HTTP. |
| `apps/portal/backend/tests/preview.sql.py:1-50,73-118` | Starts its own Unix-socket-only PG with minimal Auth/profile/Storage stand-ins; uses copied prerequisites. Pays after publishing in historical tests. Do not reinterpret that ordering as rebuild policy. |
| `apps/portal/backend/tests/service-workflows.sql.py:26-41,63-85,121-126` | Concurrent review dedup, no-change review/private notes, retained instruction Start, cancellation/admin, mapper readback. Existing setup publishes then funds (`:13`), so create candidate-specific fixtures rather than weakening new gates to keep that setup. |
| `tests/concierge-no-current-products-native.test.ts:11-34,64-75` | Real isolated PG + actual handlers, minimal synthetic Auth UID stand-in, selected migrations only. None -> A -> B, recipient methods and explicit Start. Not full canonical replay or native Auth. |
| `tests/concierge-payment-methods-native.test.ts:65-146`, `tests/concierge-checkin-replies-native.test.ts:51-77` | Important legacy/V2 collision, held transaction, immutable money/source, public/private, lost-response and revocation cases. Retain these tests for historical clients and add candidate-gate variants. |
| `supabase/tests/p0c_account_deletion_upload_fence.test.sql:8-35`, `supabase/tests/s1_access_control.test.sql` | Full Supabase ACL/deletion/RLS checks. Add concierge candidate pgTAP tests to this canonical chain, not only Python tests. |
| `apps/portal/session-integration/runtime/tests/` | Audience/CSRF/vault/refresh/logout, owner isolation, permission loss, upstream and safe-media tests. Synthetic transports do not prove actual Auth/session rows. |
| `apps/portal/scripts/local-admission.mjs:13-42,61-103`, `local-admission-lineage.mjs:4-30` | Copies all canonical migrations, unique owner/project, exact resource binding, ledger+statement digest attestation, refuses changed/foreign retained resources. Its default path is fixed; a new schema run needs a coordinator-approved distinct root/path, not overwrite of old preparation. |
| `tests/concierge-admission-native.mjs:9-31,35-63,74-80` | Real loopback GoTrue/PostgREST, actual admission handler, own-client PKCE/local Mailpit, recovery/concurrent identity convergence, revocation, ACL and normal provider logout. Extend for the new actual owner/agent plan journey. No hosted input permitted. |
| `apps/portal/tests/admission-lineage-native.mjs:13-23` | Reads actual ledger/attestation and rejects changed/missing snapshots; does not detect arbitrary manual schema changes outside the ledger. |

### Required new negative/concurrency tests for the first slice

Add meaningful behavior tests in `tests/portal-rebuild-{contracts,plans,publication,sources,notifications}.test.ts`, canonical `supabase/tests/portal_rebuild_{drafts,publication,access}.test.sql`, a new isolated native SQL test, and `apps/portal/tests/rebuild/plan-vertical-slice.*` plus session-runtime tests. Final filenames are coordinator allocations, not created by this report.

1. Save/reload empty/incomplete unassigned content without Auth/enrollment/case creation. Many unassigned; two concurrent assignments to the same client yield one working draft. Reassignment races stale save/import, source transfer and human approval. Reject unsupported fields/code, forged review/actor/time, foreign source, duplicate IDs and malformed ranges; accept repeated real categories and unknown/none without placeholders.
2. Human vs agent same authenticated command behavior; scoped agent cannot enumerate another client/unassigned workspace, read omitted sources, self-review/approve, admit clients, verify payment, edit policy or call private helpers. Revoke role/task/source/session during a held operation and exact retry; new reads/writes must deny. Owner policy changes do not waive agent grant or expand source scope.
3. Human review/approve before payment; then confirm actual synthetic receipt using the existing quote/method/claim functions. Approval remains valid byte-for-byte. Reverse order works. Wrong client/revision/hash/scope/publisher/payment quote, unverified claim, rejected/superseded quote, used/revoked approval, edited content, source version and reassignment all deny. Verify payment alone produces zero publications/clock/outbox.
4. Exercise **every path above**, including direct public `concierge_write('publish')`, `concierge_presentation_write('publish_v2')`, private-helper ACL probes, instruction publish, immediate review and free-text check-in reply. New-rule candidates cannot bypass through an old payload, RPC, schema flag or forged GUC. Legacy reads still match their originals.
5. Hold the common client advisory lock, race payment verification, content edit, cancellation, approval revocation and publish, and inspect the persisted winner. Test two independent DB connections, observed wait, bounded timeout and cleanup. Same request/payload returns one receipt; different payload/cross-stream UUID rejects; two request IDs with one approval publish once. Trigger sidecar/outbox/entitlement failure and prove full rollback.
6. First publish creates one core version, exact immutable document, entitlement, service anchor/review dates and two delivery rows for one business event. Retry/later update/email failure cannot reset dates or Start. Later inactive/read-only publication denies without requesting a new first fee. Receipt status remains authorized and does not replay effects.
7. Client read before publish contains payment/preparation only. Current/historical projections, export, preview and errors exclude private context/source bodies/notes. Wrong owner/draft/product/source IDs and all raw table/Storage list/sign routes deny. A notification deep link grants no access. Logout/account switch reject late responses; demo adapters cannot reach these writes.
8. Client decision response changes decision state only; proposed/approved/paid/received products stay absent from actual use until explicit Start. Self-purchase requires no fake payment/order. Preserve old activation IDs/dates, instruction basis and snapshot/history bytes. Correct product-bound evidence/use mapping is independently tested.
9. Outbox: simultaneous dispatchers/lease expiry, send accepted then response lost, retry, duplicate/out-of-order/bad-signature webhook, permanent bounce and independent portal seen state. One event/channel/recipient row; failure never rolls back or republishes. Test local sink or isolated recipients only; acceptance != delivered != read.
10. Source reservation/stream interruption/duplicate bytes/different digest/stale completion, forbidden MIME/size/active file, expired/revoked scope and delayed insert after deletion. Exercise actual Storage HTTP and probe rollback/commit shapes, not only metadata stand-ins. Due retention/hold/cleanup failure must preserve truthful status and deny resurrection.
11. W6 date/access cases: Jan 31, leap day, Chicago DST boundaries, two-week date, month-three guarantee+30 calendar days, exact support/read-only exclusive ends, ordinary vs explicit early cancellation, no new care writes after support, separate outstanding refund/order access. Do not test service months as `90*24h`.
12. Migration rehearsal hashes/IDs/counts for old publications/R2 bytes, intakes, activation/Start, instruction revisions, real-valued synthetic legacy receipts/coverage/quotes/addresses/methods, cancellations and independent walkthrough/grants before/after. Existing private/upstream ACLs stay restrictive. No fabricated historical approvals/emails/payments.

### Coordinator-run implementation verification commands

Use a new verified owned snapshot/worktree path; the examples below are commands to run **after implementation**, not results from this report. Discover CLI flags with `supabase db reset --help` and `supabase test db --help` on the installed version before execution.

```sh
env PATH="/Users/kanuj/.nvm/versions/node/v22.23.0/bin:$PATH" npm test
env PATH="/Users/kanuj/.nvm/versions/node/v22.23.0/bin:$PATH" npx tsc --noEmit
env PATH="/Users/kanuj/.nvm/versions/node/v22.23.0/bin:$PATH" npm run typecheck:tests
env PATH="/Users/kanuj/.nvm/versions/node/v22.23.0/bin:$PATH" EXPO_NO_TELEMETRY=1 npx expo export -p web
env PATH="/Users/kanuj/.nvm/versions/node/v22.23.0/bin:$PATH" npm --prefix apps/portal test
env PATH="/Users/kanuj/.nvm/versions/node/v22.23.0/bin:$PATH" npm --prefix apps/portal run test:backend
env PATH="/Users/kanuj/.nvm/versions/node/v22.23.0/bin:$PATH" npm --prefix apps/portal run test:session
env PATH="/Users/kanuj/.nvm/versions/node/v22.23.0/bin:$PATH" npm --prefix apps/portal run typecheck:session
env PATH="/Users/kanuj/.nvm/versions/node/v22.23.0/bin:$PATH" npm --prefix apps/portal run check:ui
env PATH="/Users/kanuj/.nvm/versions/node/v22.23.0/bin:$PATH" npm --prefix apps/portal run build
supabase db reset --local --workdir "$NEW_OWNED_FIXTURE"
supabase test db --workdir "$NEW_OWNED_FIXTURE"
git diff --check
```

Set only the coordinator-approved explicit local Docker socket. Assert the new path/project/volume/owner/snapshot and loopback endpoints before reset. Run the real Auth/PostgREST plan journey, Edge smoke and Storage HTTP against that new fixture. Do not use `--linked`, provider mutation, a default shared database or the stopped parent fixture. Full-chain pgTAP, session/ACL negatives and native Auth are separate required evidence; one does not substitute for another. Exact-head CI is required before any separately authorized merge.

## Migration compatibility and rollback

1. Coordinator allocates new monotonically ordered canonical migrations using the installed CLI. Do not edit/reorder historical files, apply proposals implicitly or reconstruct hosted ledger aliases. Freeze source hashes and capture a baseline invariant manifest using synthetic data. Check trigger ownership/search paths/ACLs, public default grants and functions before/after.
2. Expansion migration: private draft/template/request/review/approval/principal/source/outbox records and version-aware read helpers. No real users/grants/settings seeded. Keep new production operations disabled until the complete publication/access barriers exist. Explicitly revoke default public function privileges in the migration, grant only bounded entry points, and keep new tables nonpublic with RLS.
3. Enforcement migration in the same reviewed deployable slice: publication/instruction/review barriers, compatible core document discriminator/intake rule, single-draft adoption lock, current care-window guard and transaction/outbox hooks. Do not ship an enabled create/publish path between expansion and enforcement. Raw source bucket, deletion cleanup and agent APIs are separately enabled only when all their access/retention invariants pass.
4. Reconcile W5 version-aware decision/payment lookup and W6 service/read-only constraints before enabling affected V3 operations. Preserve historical amounts/dates and all old projections for old versions. Migration selection/adoption is explicit, transactional, auditable and does not create identities or infer payment.
5. Rehearse full canonical reset and upgrade from the exact prior synthetic application state, including failure half way through and concurrent old/new calls. Add a catalog/ACL manifest to supplement ledger attestation; the current lineage check explicitly cannot detect arbitrary manual schema drift.
6. Rollback before any V3 business write: disable new operations/dispatcher and restore reviewed application artifact, leaving additive private tables idle; do not drop evidence. After any V3 publication, do **not** restore an old writer that lacks approval/payment barriers or silently omit the new document. Prefer forward fix, or a compatibility read-only application that still enforces V3 access/history and leaves pending notifications/administration reachable. Retain a global write freeze for unsupported new formats.
7. Database restore is a separately approved recovery action with a verified backup and reconciliation of any intervening business/email/financial events. It must not erase a published receipt, activation, payment or external email acceptance. Never automatically down-migrate away immutable V3 evidence. No publication/clock/email backfill is part of rollback.

The coordinator owns contract freeze, migration ordering, auth/gateway/release composition and shared documentation updates. W1's next authorized implementation patch should include the new root contracts/module, allocated canonical migrations, negative/concurrency tests and narrow integration requests for gateway/W5/W6. Page workers may use the pinned schema/fixture model after the coordinator records that freeze. This research commit changes only this report.

## Narrow unresolved boundaries and limitations

- The approved exact-human rule and owner-controlled Sami exception are compatible when the exception removes only **Kanuj-specific** approval. Do not implement it as permission for unreviewed or model-approved advice. Unrestricted old public replies/reviews need the same barrier; operational-message classification is not established by old `can_edit`.
- Original-anniversary monthly renewal needs an explicit policy version/constraint reconciliation with W6. Existing anchored periods stay untouched. Legacy actual-payment import cannot be inferred from the current $100 constraint or fictional data.
- Unassigned/no-service raw-source abandonment retention, exact recording MIME/size/chunk policy, consent/hold/deletion handling, task-principal credential enrollment and email provider/domain/reconciliation are bounded prerequisite details. Implement independent schema/permissions/local-sink work, but do not claim those production paths ready before their prerequisite is resolved.
- No real private source/client data, credential files or parent fixture status files were read. No hosted Supabase query/mutation, login email, real payment, order, deployment, PR, push or merge occurred. Only the explicitly owned documentation report is committed.
- This is not a security scan, legal clearance or independent acceptance review. It identifies concrete changes required by approved decisions from inspected source. The report does not establish that the proposed transactions, migration/rollback or external delivery work at runtime.
- Full app suites/types/build and native SQL/Auth were not rerun by W1 for this docs-only change. W1's 37 executed checks and the separately attributed coordinator baseline retain their exact scopes. Final documentation verification is `git diff --check`, local link/scope checks and exact changed-path inspection.

Primary documentation consulted through public read-only requests: [Supabase changelog](https://supabase.com/changelog), [Data API grants and RLS](https://supabase.com/docs/guides/api/securing-your-api), [database functions/search path and execute privileges](https://supabase.com/docs/guides/database/functions), [Storage access control](https://supabase.com/docs/guides/storage/security/access-control). The changelog's relevant TLS-cipher and PostgreSQL-minor notices were followed; they do not justify changing project credentials, deployed versions or schema during this reconnaissance. Browser fetch of Markdown URLs failed with unsupported content type; direct public HTTP reads succeeded. The Supabase skill was read before this analysis. No implementation relies on a claim of current hosted configuration.
