# portal rebuild implementation contracts

Owner: Kanuj. Coordinator is the single integration writer. Status: agreed requirements and initial interface design, 30 October 2026. No new runtime behavior is claimed by this document.

Read [approved decisions](APPROVED_DECISIONS.md), [desktop specification](APPROVED_DESKTOP_SPEC.md) and [full manifest](shelv_desktop_design_manifest.json). Changes to this contract require a recorded decision and coordinated consumer updates. Stable field identities and business invariants below are binding; the exact adapters must be reconciled with the inspected existing SQL before implementation is marked complete.

## existing boundaries to retain

- Root `src/contracts/ConciergePortal.ts`, `ConciergePresentation.ts`, `ConciergeService.ts` and their validators/mappers define the current wire contracts. Root `supabase/functions/concierge-*` and canonical migrations are integration source. `apps/portal/backend/source/` is retained fixture source, not a replacement backend.
- `apps/portal/session-integration/runtime/server/` implements cookie/vault transport, channel action allowlists, same-origin/CSRF checks, bounded payloads and authorization fences. Keep that gateway. Do not expose provider tokens in the React application or proxy caller-selected URLs/RPCs.
- Client commands infer owner from the verified session. Advisor client selection is explicit and checked server-side. An authenticated identity alone grants no enrollment, coverage, advisor role or private-source access.
- Existing publications, activations, financial snapshots, manual receiving-method versions, private check-in notes and revocable private walkthroughs remain authoritative. Migrations add compatible state and preserve their IDs and dates. No backfilled synthetic receipt or re-dating of legacy records.
- Current R2 `save_draft_v2` requires an assigned client/intake and validates a complete presentation. Current `publish_v2` has no exact-human-approval command in the TypeScript surface. These are gaps against D14-D22, not permission to relax the new requirements.

## shared records and rendering

Proposed versioned rebuild contracts live in `src/contracts/PortalRebuild.ts` with strict validation in `PortalRebuildValidation.ts`. W1 owns them. W0 owns frontend adapters and shared primitives. A compatibility adapter reads R2 and preserves its immutable original; an explicit new-version conversion never rewrites a past publication.

The [plan API v1 freeze](PLAN_API_V1.md) now pins the first backend slice after [W1 source reconciliation](research/W1_BACKEND.md). Its explicit refinements govern proposed report signatures: content IDs remain opaque; rich R2 imagery/guides/comparisons/evidence must survive; canonical publication IDs remain authoritative with a guarded V3 sidecar; activated-candidate legacy guidance bypasses deny. No runtime completion is claimed.

| Record | Required identity and semantics |
| --- | --- |
| template | Stable template ID and schema version; reusable approved sections, never executable markup. |
| draft | Stable draft ID, nullable assigned client ID, content revision, schema version, structured content and server save time. Many unassigned drafts; one working draft per assigned client enforced transactionally. Creating a draft never creates an Auth user. |
| content | Multiple goal IDs; products with stable IDs and known/unknown variant/formula state; decision IDs and approved action types; routine step IDs; instructions, cautions, evidence limitations and source references. Plain content only. |
| review | Section ID, exact reviewed content identity, human actor and server time. Agent-filled or substantively changed sections need review. Readiness is semantic, separate from safe incomplete storage. |
| approval | Draft ID, intended client ID, exact content revision/hash, authenticated human approver, action scope, grant ID and server time. Client reassignment/content edits invalidate it. Payment-only changes do not. |
| publication | Immutable content and version, intended client, approval linkage, source draft, actor, authoritative publication time and one retry receipt. Client projection excludes source/private fields. |
| actual-use report | Stable event ID, selected product ID, action, actual date or explicit unknown, server recorded time, reporter, recorder, channel, acquisition route, published basis and optional amendment-of ID. Never infer Start from receipt. |
| source | Private object ID, client/draft scope, source type, exact original name, content type/size, capture provenance, authorized access and retention/deletion status. No public URL or training permission by implication. |
| notification | Source event ID, recipient, channel, deduplication key, queued/accepted/delivered-if-known/failed/bounced state, retry metadata and independent seen/read state. |

The React client, advisor preview and Maya consume one shared plan view model and renderer. Presentation mode restricts available operations: `client`, `advisor-preview`, `public-demo`, `private-walkthrough`, `historical`. Mode is not server authorization. Demo adapters are in-memory and cannot call production transport. Private walkthrough capability reads remain separate and revocable.

Known none versus unknown is explicit for current products and dates. Distinct same-category products retain distinct IDs. Decision types are `keep`, `pause`, `leave_out`, `replace`, `finish_then_replace`, `addition`, `optional_alternative`, `no_addition`. Store human-authored schedules for periods, selected days, conditions and gradual stages anchored to actual Start; no timer-driven escalation.

## commands and error semantics

Manual UI and task-authorized agents use the same strictly parsed operations. Reads return permission-filtered projections. Proposed command families are listed here to stabilize responsibilities; W1 must pin exact wire discriminants/arguments with the first schema slice and update consumers together.

| Family | Operations and guard |
| --- | --- |
| drafts | List/read/create, save incomplete content with expected content revision, checkpoint, assign/reassign, compare import, apply import, validate readiness and preview. All writes idempotent and capability-checked. Imports reject unknown/code fields, compare a base revision and preserve later edits. |
| human review | Mark section reviewed; approve exact intended publication; revoke approval. Approver comes from authenticated identity, not payload `approved: true`. |
| publication | Deliberate publish with draft/client/content identity, approval/grant and request ID. All alternate legacy publication entry points must enforce equivalent candidate gates or deny when the rebuild is selected. No bypass through an old RPC. |
| client decisions | Approve/defer/decline an identified decision on an entitled publication; report product identity/use independently; report pause/stop without advisor approval. No implied purchase or Start. |
| history | Submit/amend report; record advisor conversation; publish review with optional unchanged plan; restore historical content into a new draft. Original events remain immutable. |
| commerce | Existing issue quote/claim/verify receipt/purchase/delivery/return bookkeeping, extended only where required. Preserve quote/address/recipient snapshots and actual gross receipt. No external money/retailer/carrier action. |
| service | Read coverage/guarantee; record manual service payment/renewal; cancel with explicit support end; final-plan export; remaining administrative operations. Profile/address changes have their own version and verification. |
| sources | Begin bounded authorized upload, complete/confirm storage, retry/status, short-lived authorized read, retention selection and audited deletion. Storage success must be confirmed before reporting uploaded. |
| notifications | List own attention, mark seen, retry authorized failed event. Dedicated delivery service claims jobs, records provider result and authenticates provider webhooks. Retry does not invoke publication. |

Every write uses a unique request ID. Exact retry returns the prior result; reuse with different content rejects. Content revisions are distinct from payment/check-in/service aggregate revisions. Lock relevant authoritative records and re-check permissions at commit time. A conflict preserves local unsent edits and presents base/latest/proposed comparison, never blind overwrite.

Return stable safe errors: 400 invalid input/readiness with actionable field/section details; 401 session ended; 403 denied; 404 unavailable without cross-client disclosure; 409 revision/approval/import conflict; 413 size limit; 415 unsupported type; 429 rate limited; 503 unavailable or uncertain outcome. Never include SQL, credentials or private source content in errors/logs. An interrupted write is `uncertain` until an idempotent status/read confirms outcome. Do not display saved/sent/published based only on optimistic state.

## publication transaction and notification ownership

W1 owns the publication transaction, approval invalidation, server authorization, idempotency and outbox. W5 owns verified financial evidence. W6 owns coverage/cancellation rules. The coordinator resolves their shared migration and gateway changes.

First publication requires, under one transaction: assigned intended client; publishable complete content; all required human reviews; exact valid human approval; verified applicable first service payment; deliberate authorized command. External-agent publication additionally requires Kanuj's specific publication grant regardless of Sami's owner-controlled approval policy. No model field can grant this authority.

The commit creates exactly one publication, initial service/review clock when absent, entitlement and deduplicated notification event. Later publications require authority and current coverage but never restart clocks or Start. Concurrency/retry must not duplicate any of these. Failure of asynchronous email delivery cannot roll back publication/access or restart the service.

Neutral transactional email contains an authenticated deep link, no sensitive detail or attachment. Portal notification and email status are separate. Client-visible published reviews notify; drafts/private notes do not. Material goal/use/check-in submissions and corrections alert the appropriate advisor and configured email. No automatic SMS. Provider credentials stay server-side. Development delivery is restricted to isolated test recipients or a local mail sink; provider acceptance is not delivered/read evidence.

## dates, service access and financial truth

- Server recording timestamps are UTC instants; business calendar dates use America/Chicago. First publication anchors month periods and two-week/month-end review dates. Month arithmetic must test DST, leap years and month-end clamping; three periods are not a fixed 90 days.
- Actual occurrence dates remain separate from recorded timestamps. Unknown Start stays unknown. Instruction revisions retain original Start. Amending actual use appends attribution without erasing the original.
- Ordinary cancellation stops future renewals and retains paid support; early departure requires explicit confirmed support end. Read-only plan/history access lasts 30 calendar days after support ends. Define exclusive end boundaries in the service implementation with tests. Final export uses the last entitled plan and current instructions, excluding private sources/notes.
- After care access ends, authorized unfinished order/refund administration remains separately reachable. Read-only care routes reject new care writes, including via direct APIs. Cancellation never transfers money.
- Keep actual first-three-period paid amounts and guarantee deadline. Refund request, retailer funds received and client repayment are distinct records. No invented zero tax/shipping or generic return terms. Self-purchase needs no Shelv quote/payment/order.
- Raw sources are retained during service and 12 calendar months afterward, with defined deletion processing and explicit legal/operational holds. Access expiry is separate from raw-source, history and financial/audit retention. No training or secondary-use grant follows from service consent.

## routes, Back and transient state

W0 owns route parsing/builders, navigation history and shell. Planned client routes: `/plan`, `/plan/recommendations/:decisionId`, `/plan/products/:productId`, `/plan/products/:productId/evidence`, `/plan/products/:productId/use`, `/history`, `/history/new`, `/history/:eventId`, `/history/versions/:version`, `/orders`, `/orders/:orderId`, `/account`, `/account/service`, `/account/cancel`, `/notifications`. Existing URLs receive explicit compatible routing; no broken legacy deep links.

Advisor routes: `/advisor/clients`, `/advisor/clients/:clientId`, `/advisor/plans`, `/advisor/plans/:draftId/:section`, `/advisor/plans/:draftId/preview`, `/advisor/reviews/:reportId`, `/advisor/permissions`. Public Maya uses `/maya`; the private walkthrough shell/authority remains separate.

URL carries selected routine and identified product/decision, never sensitive answers/credentials. History stores only navigation markers, scroll/focus keys and safe UI state. Unsent sensitive work remains session-bound memory, cleared on logout/owner/session replacement. Late responses must check the original lease/generation before application. Callback credentials are consumed and removed through existing auth recovery, with an allowlisted same-app return path.

Opening a product sheet records a valid same-app predecessor; closing/Back restores routine, scroll, focus and unsent work. Direct entry falls back to the appropriate parent. Evidence and use reporting are bound to the selected product. One modal/sheet at a time, no nested dialog stack. Native Back/Forward, refresh, denied and unavailable states are acceptance requirements.

## shared UI and design acquisition

W0 owns one React/TypeScript shell, shadcn-derived primitives, Shelv wrappers, Lucide sizes, tokens and action vocabulary. Page owners compose them. Use the exact approved frames and screenshot comparison; do not substitute earlier layouts. The initial native C01 context confirms 224px sidebar, 80px topbar, 40px content inset, Inter body and Instrument Serif page title, with cream/forest tokens. Keep dynamic reflow rather than fixed absolute application coordinates.

All controls have shared focus/disabled/loading/empty/error/warning states, visible labels and keyboard semantics. No global lowercase CSS. Preserve proper names, source text and technical notation; authored UI is lowercase. Essential instructions/cautions remain inline. Product photos are recognition aids; missing images use one neutral fallback. Responsive desktop/laptop/320/390px and complete five-stage guide are required before release.

## implementation decisions

| ID | Problem and alternatives | Chosen approach and rationale | Affected evidence |
| --- | --- | --- | --- |
| I01 | Dirty scanner root versus approved portal lineage | T3-managed integration worktree from PR210 head `8ac0826`, atop current main `d39a7d4`; preserve root. | Git state and execution log. |
| I02 | Old policy conflicts with latest approved behavior | Prospective rebuild rules govern new candidate; preserve historical release facts. | D21-D25, D33-D34, D38, founder/UI cross-references. |
| I03 | CLI defaults alone do not prove T3 workers | Project defaults plus eight role files; explicit T3 model/options and returned runtime evidence for each task. | D43-D44, workstream registry. |
| I04 | Full frontend rebuild versus existing secure backend | React package within `apps/portal`, retained cookie/vault transport and canonical root contracts; compatible additive extensions after backend reconciliation. No backend replacement. | D03-D04, W0/W1 research and tests before adapter freeze. |
| I05 | Rich multi-goal content does not fit required legacy single intake/price shape | Add V3 document discriminator/immutable sidecar to the same canonical publication key; nullable intake only for complete guarded V3 rows. Never fabricate intake/price or rewrite old rows. | D14-D22, D47; PLAN_API_V1; sidecar rollback/ACL/migration tests. |
| I06 | Proposed new UUID-only product IDs would remap existing opaque identities and omitted rich product fields would lose approved content | Keep content IDs opaque; retain compatible R2 image/guide/comparison/evidence fields in the new typed model and lossless legacy adapter. | D11, D17-D20, D47; identity/roundtrip/renderer tests. |
| I07 | New UI gate cannot prevent direct old RPC/review/instruction bypass | Server-owned candidate activation and persisted exact authority constraints across all guidance insert paths; no caller-controlled opt-out. Dormant legacy compatibility is separate evidence. | D21-D25; every-path SQL/RPC denial and rollback tests. |
| I08 | New rich plans need the same bounded operations through manual and agent transports | Align only plan JSON at 500,000 bytes, keep legacy channels at 100,000, and apply the same finite response mapper/safe error namespace at Edge and cookie gateway. No file upload or arbitrary RPC through this channel. | D16/D19/D20; nine gateway/SDK boundary cases, including valid large draft and both limit refusals. |

Every later material decision records problem, alternatives, chosen approach, rationale, affected contract and tests here. Statuses are separate: agreed, designed, implemented, locally tested, hosted verified, deployed.
