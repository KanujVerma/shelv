# plan API v1 contract freeze

Owner: Kanuj. Status: designed for the first implementation slice, 30 October 2026. This contract incorporates [W1 source reconciliation](research/W1_BACKEND.md) with the coordinator decisions below. It is not implemented or verified by being written. D01-D48 and the full desktop specification remain normative.

## retained backend and format boundary

Keep `concierge.publications(client_id,version)` authoritative. Add a document-format discriminator for future rows and an immutable V3 document sidecar linked to that same key. Only a V3 row may omit the legacy single-goal intake, enforced with a deferred complete-document/approval constraint in the same deployable migration slice. R1/R2 rows, intake FKs, publication bytes, activations, receipts, actual coverage and private walkthroughs remain unchanged. No synthetic intake/price/payment is created to satisfy old shapes.

V3 decision lookup/projection is explicitly version-aware. Old APIs that would discard V3 semantics return `content_version_required`; do not leak a truncated plan or invent zero-priced legacy recommendations. The UI uses a lossless R1/R2 adapter and native V3 projection. Preserve old product/step/decision/slot IDs verbatim.

Candidate activation is server-owned and explicit. New plan APIs require an activated candidate policy with server-enrolled owner/human/agent principals. The migration seeds no real identities or grants. In an activated candidate, all new client-visible guidance writes, including old plan/instruction/review/reply paths and direct public RPC calls, must enforce exact authority/coverage or deny with a version-required error. A caller cannot select a legacy bypass, forge a GUC, supply a role/name, or opt a case out. Historical receipts remain readable after live authorization, without re-executing their effects. An inactive legacy environment is compatibility evidence only, never a candidate gate pass. Production cutover requires activation for the entire intended writable scope and separate release authorization.

## types and content

Database-record IDs (draft, approval, task, source, request, client) are UUIDs. Content IDs (product, decision, goal, fact, step, slot, schedule stage) are existing bounded opaque identifiers accepted by `readIdentifier`, not newly imposed UUIDs. Use one `ContentId` type consistently. This avoids needless identity remapping and preserves legacy continuity.

Use the W1 report's proposed `Known<T>`, `ProductContext`, `SourceLocation`, provenance Fact, Goal, authored Schedule, Draft/ExactTarget/Approval/PublishReceipt and strict discriminated draft kinds as the starting signatures, subject to these binding completions:

- `PlanContent.schemaVersion` identifies the content schema; API envelope `schemaVersion:1` identifies this command protocol; publication `documentSchemaVersion:3` identifies the persisted format. They are distinct version fields.
- Products retain public `imageUrl`, `productUrl`, source label/reference and optional reference-price metadata compatible with current R2 `Product`. Unknown price remains unknown; reference price is not a payable quote. Reuse existing safe public/image URL validation and approved same-origin assets. No signed/private URL or credential-bearing URL may enter a publication.
- Preserve R2 `Guide`, `Comparison` and public evidence/source content through explicitly typed product/decision guidance fields. Reuse compatible existing types/validation shapes where useful. Do not drop complete directions, ingredient facts, comparison limitations, public source label/URL, patch-test/caution or product-specific guide links during conversion. No arbitrary display/navigation/button-label/code fields.
- Products, goals and decisions use stable IDs. A selected product's evidence/report actions bind to that ID. Multiple same-category products, all eight approved decision kinds, no products, no decisions, no purchase and nonproduct steps remain representable.
- Private facts and private raw source locators are a private provenance projection. The client-safe published document is constructed by a positive allowlist; it contains permitted public conclusions/citations only, never private notes, raw transcript/photo/object paths or source access capability. Reference IDs cannot be used to recover omitted private data.
- Incomplete storage accepts blank unfinished fields, empty arrays and explicit unknowns while retaining bounded types/IDs and rejecting unsupported/code fields. Separate semantic readiness handles missing guidance, consequential unresolved dependencies, reviewed sections and current routine/source basis. Neither schema validity nor a filled-field count establishes human review.
- Authored schedules specify morning/evening, selected days, conditions/as-needed and gradual stages contingent on comfort/actual Start. Never automatically advance them with elapsed time. An authored routine and reported actual use remain separate; publication/decision/payment/delivery never activates a proposal.

The W1 implementation must export its exact concrete types, empty-draft factory, strict command parser, client projection and R1/R2 adapter from `src/contracts/PortalRebuild*.ts`. Pin shared parser `readPlanCommand(value: unknown): PlanCommand` and fixed RPC mapper `buildPlanRpc(value: unknown): PlanRpcCall`; the latter maps only to `concierge_plan_command_v1` and never accepts an endpoint/RPC name from the caller. Any necessary signature refinement is proposed with source/test evidence before dependent page implementation. Do not create an untyped permissive escape hatch.

## fixed command surface for the first slice

Use a closed `PlanCommand` discriminated union through fixed SQL RPC `concierge_plan_command_v1(p_command jsonb)` and `supabase/functions/concierge-plans/`. Every command has API `schemaVersion:1`. Writes have a UUID `requestId`; actors/session/authority and recording times come from the server.

Rich plan commands have a 500,000-byte JSON transport bound, aligned at direct Edge, gateway and retained cookie-factory layers. Legacy command channels retain 100,000 bytes. Raw recordings/uploads use separate bounded streaming paths, never this JSON allowance. Root `PortalRebuildValues.ts` owns the server limit and safe error namespace; browser protocol metadata carries the corresponding fixed bound. Functional oversized-draft/legacy-limit tests protect the distinction. Every plan response is finite-mapped with `mapPlanResult`; malformed success data cannot be treated as saved.

| Action | Exact request-specific fields beyond schema/action | Result/guard |
| --- | --- | --- |
| `list_plans_v1` | `clientId: UUID|null`, `cursor: string|null`, `limit: number` | Scoped bounded directory. Unassigned work never implies client creation. |
| `read_draft_v1` | `draftId` | Authorized draft/reviews/readiness/approval state. |
| `create_draft_v1` | `requestId`, `kind:'care_plan'`, `templateVersionId:UUID|null` | Empty unassigned draft. No Auth/case/admission side effect. |
| `save_draft_v1` | `requestId`, `draftId`, `expectedContentRevision`, `expectedAssignmentRevision`, `kind:'care_plan'`, `content:PlanContent` | Compare-and-save incomplete work; increment content identity. |
| `checkpoint_draft_v1` | Same expected revisions plus `requestId`, `draftId`, `label` | Immutable checkpoint, not another working plan. |
| `assign_draft_v1` | Same expected revisions plus `requestId`, `draftId`, `fromClientId:UUID|null`, `toClientId:UUID` | Existing admitted target, source/task scopes checked; single assigned working draft enforced. Reassignment invalidates exact approval. |
| `compare_import_v1` | `draftId`, `baseContentRevision`, `baseAssignmentRevision`, `content` | Read-only base/latest/proposed diff and proposal hash. |
| `apply_import_v1` | Same expected revisions plus `requestId`, `draftId`, `baseContentRevision`, `proposalHash`, `content` | Exact compared content, no stale overwrite; affected agent-filled sections need review. |
| `validate_draft_v1` | `draftId`, `contentRevision`, `assignmentRevision` | Actionable section/path readiness issues, not a grant. |
| `preview_draft_v1` | `draftId`, `contentRevision`, `assignmentRevision` | Client-safe unpublished preview; no entitlement. |
| `review_section_v1` | Same expected revisions plus `requestId`, `draftId`, `sectionId`, `sectionHash` | Authenticated human only; server attribution. |
| `approve_publication_v1` | `requestId`, `target:ExactTarget`, `scope`, `publisher` | Exact human approval; publisher is bound human actor or specific live agent task/session grant. |
| `revoke_approval_v1` | `requestId`, `approvalId`, `expectedPolicyRevision` | Append revocation; do not erase issuance. |
| `publish_plan_v1` | `requestId`, `target`, `approvalId`, `firstServiceClaimId:UUID|null` | Transactional exact receipt; first applicable verified service receipt required, later active coverage. |
| `read_client_plan_v1` | `version:number|null` | Owner inferred; entitled current/history and actual-use state, no caller client ID. |
| `record_decision_v1` | `requestId`, `expectedDecisionRevision`, `publicationVersion`, `decisionId`, `choice:'approved'|'deferred'|'declined'`, `reason:string|null` | Decision state only; no payment/order/Start. |
| `restore_publication_v1` | `requestId`, `clientId`, `publicationVersion`, `expectedWorkingDraftId:UUID|null` | New draft from immutable history, with conflict protection. |
| `request_status_v1` | `requestId` | Live principal-scoped committed receipt or generic absent; never false saved/sent. |
| `read_policy_v1` | none | Scoped owner/policy projection. |
| `set_sami_approval_policy_v1` | `requestId`, `expectedPolicyRevision`, `requireKanujApproval:boolean`, `confirmed:true` | Owner-only audited change; exact human review remains and agent grant rule is independent. |
| `grant_task_v1` | `requestId`, `agentActorId`, `providerSessionId`, `clientId:UUID|null`, `draftId:UUID|null`, `actions`, `sourceIds`, `expiresAt` | Owner-issued closed action/scope/expiry grant. No payment confirmation, admission, policy or human approval rights. |
| `revoke_task_v1` | `requestId`, `grantId` | Audited revocation; live reauthorization required on every operation/retry. |

`ExactTarget` contains draft ID, intended client ID, content revision, assignment revision and server-computed SHA-256 hash. Hash includes publishable content and review-relevant basis/source versions, excluding unrelated finance/delivery heads. Section reviews use dependency hashes; any publishable content edit invalidates whole-publication approval. Payment-only bookkeeping does not change it.

Task grants bind actual nonanonymous agent principals and live provider session IDs, not a human-name JWT or global advisor capability. A client-scoped explicit create permission can create an unassigned draft bound privately to that originating grant/intended client; subsequent assignment cannot escape that client scope. A draft-scoped grant edits that exact existing draft. Unassigned creation does not authorize reading unrelated unassigned work or any raw source. If implementation chooses preallocated draft scope instead, document the exact safe operation while preserving real agent create/edit/save capability. No self-grant or wildcard client/source authority.

Instruction/review draft kinds and source/history/use/notification commands follow the report's strict typed extension seams; do not expose reserved-but-unimplemented actions as successes. Before enabling a new public instruction/review write, it must use the same exact-content human authority/outbox boundary. Unrestricted legacy replies must not remain an activated-candidate bypass.

## transaction and compatibility requirements

Use existing actor/session/deletion/enrollment/capability guards and strengthen sensitive new operations with live Auth-session/principal/task checks. Keep existing request/client advisory lock namespaces. Lock policy/principal/grant scope before request/client/draft rows; reassignment takes old/new client IDs in stable order before the draft. Revalidate after waits. Exact retries return the stored result after current authorization, while mismatched payload/cross-stream request reuse rejects.

First publication atomically validates assigned intended client, complete reviewed current content/basis, exact human approval/publisher, genuinely verified applicable first-service quote/claim receipt and deliberate authority. Create one canonical publication plus complete immutable V3 document/approval linkage, entitlement, first clock/review schedule, deduplicated business event and email/portal delivery rows, and one receipt. Approval consumption is unique. Deferred insert/linkage guards must cover direct old/private call chains without a caller-controlled bypass. Any sidecar/outbox/entitlement failure rolls the transaction back.

Reuse actual existing quote/claim/confirmation/pending service-period logic. A sent claim, screenshot or field set by the model never counts as receipt. Reuse the existing valid first one-month Chicago period for this slice. Later plan updates require existing coverage, preserve first service/Start dates and do not request a fresh first-service fee. Legacy monthly periods remain untouched; original-anniversary renewal policy/constraints are a separately coordinated W6 refinement, not silently changed by this slice.

Persist notification events/deliveries with the business commit. External delivery is asynchronous and never atomic with publication. First slice proves durable queue/deduplication and truthful failed/uncertain/retry state; delivery service/local sink and provider webhook handling follow as required implementation, not omitted final scope. No exactly-once external email claim without provider idempotency/reconciliation. No real recipients in development.

The first care publication/read/decision path and all legacy publication barriers must be testable together under an activated synthetic policy. Client-safe read before first publication shows preparation/payment only. Proposed/approved/paid/delivered products do not enter actual use. Current/historical reads enforce relevant care entitlement and retain separate administrative reachability. New source uploads and no-service/unassigned retention remain disabled until their exact scoped policy and byte/type/deletion checks are implemented; draft text work continues independently.

## write allocation and verification

W1 is the single writer for `src/contracts/PortalRebuild*.ts`, `supabase/functions/concierge-plans/`, any small shared new plan-domain modules, version-aware SQL compatibility and canonical migrations for this first slice. W1 may add affected root unit/handler tests, canonical `supabase/tests/portal_rebuild*.test.sql` and a focused native PostgreSQL harness using synthetic identities. W1 may make narrowly necessary changes to root existing concierge command/mapper/cleanup modules with a report of the exact dependency. No historical migration rewrite, wholesale backend replacement, root package/lockfile or gateway/frontend edits. Generate migrations with `supabase migration new`; only W1 allocates new canonical migrations until this slice is integrated. Report actual filenames before another writer is assigned.

Coordinator retains gateway/auth/release composition and heavy real Auth/PostgREST/Storage fixture lifecycle. W1 supplies exact integration seams/request patches, not parallel edits to the gateway. W0 retains frontend packages/components/routes/typed transport. No dependent page workers until exact types are committed and the vertical slice is verified.

Required tests include incomplete unassigned save/reload/assignment without Auth creation; strict unknown/code fields and stale imports; human versus live scoped agent API; exact reviews/approval before/after payment; content/reassignment invalidation but payment-only independence; every legacy bypass path; live role/session/grant revocation during wait/retry; two-connection concurrent publication/claim/edit/revocation and transactional rollback; one version/clock/outbox on retry; private projection exclusion; prepublication versus entitled/history/read-only; selected decision without actual-use activation; preservation of historical IDs/bytes/dates/receipts. Source R1/R2 compatibility tests retain their explicit historical scope; do not weaken the activated candidate to satisfy old setup ordering.

Use TDD for meaningful new behavior and record red/green commands. W1 runs focused domain/handler/native SQL tests and affected types; coordinator then runs full canonical reset/pgTAP and the real local Auth/browser journey in a distinct owned snapshot, plus full required application/portal/session checks. Independent Sol/xhigh review gates integration. Reserved source/delivery/mobile/secondary features remain acceptance work under the full goal.
