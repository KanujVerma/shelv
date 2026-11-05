# shelv: consolidated desktop review specification

**Version:** desktop review v1, 30 October 2026  
**Status:** approved desktop design and prospective rebuild behavior. Kanuj approved the consolidated set on 30 October 2026: “this looks great lets do it”. Approval covers implementation against this baseline, not production deployment, real purchases, messages, payment verification, or publication of real client advice.  
**Design file:** https://www.figma.com/design/WGbMylNV4rPoMw3r0nceaw?node-id=504-797  
**Consolidated page:** `498:32`  
**Machine-readable inventory:** `shelv_desktop_design_manifest.json`

## 1. Deliverable and truth boundaries

The new Figma page contains 26 editable desktop screens, a linked review index and nine exception/recovery specimens. Twenty-five application screens use 1440 × 960. D01 is a 1800 × 960 comparison of the unchanged 1440px client interface with a separate 336px guide rail; it is not evidence of a completed narrow-desktop responsive tour. Mobile refinement is deferred, not abandoned.

The designs use shared native Figma component instances and existing Shelv tokens. These are shadcn-aligned design specifications, **not an imported official shadcn Figma kit and not production React components**. Lucide vector geometry was read from the official icon repository. Brand imagery is not an interface icon.

143 controls have Figma navigation or staged-state reactions. This is not a live application: inputs do not persist, business actions do not run, notifications do not send and approval/payment transitions are pre-authored demonstration states. The full five-stage guided tour remains an implementation/prototype task. Unwired secondary controls are not permission to invent behavior.

Maya’s original goals, products, prior experiences and practical directions follow the existing repository sample. Later check-ins, dates, transaction receipts and histories shown here are staged examples. They do not prove real client improvement or real money received. Clinical wording was preserved/paraphrased from the sample for design continuity; this design pass is not a new clinical validation.

The original Figma explorations, production app, GitHub code, client records and accounts were not modified by this design work.

## 2. Review entry points

Start with [your plan](https://www.figma.com/design/WGbMylNV4rPoMw3r0nceaw?node-id=498-85), then [recommendation review](https://www.figma.com/design/WGbMylNV4rPoMw3r0nceaw?node-id=498-212), [history](https://www.figma.com/design/WGbMylNV4rPoMw3r0nceaw?node-id=498-304) and [the advisor editor](https://www.figma.com/design/WGbMylNV4rPoMw3r0nceaw?node-id=500-383). Review the publication sequence independently: [blocked](https://www.figma.com/design/WGbMylNV4rPoMw3r0nceaw?node-id=500-592) → [receipt verification](https://www.figma.com/design/WGbMylNV4rPoMw3r0nceaw?node-id=503-672) → [ready](https://www.figma.com/design/WGbMylNV4rPoMw3r0nceaw?node-id=500-686) → [published with failed email](https://www.figma.com/design/WGbMylNV4rPoMw3r0nceaw?node-id=500-779).

| Code | Figma screen | Purpose |
|---|---|---|
| C01 | [your plan · morning](https://www.figma.com/design/WGbMylNV4rPoMw3r0nceaw?node-id=498-85) | Combined home and plan. Actual morning instructions; proposals remain separate. |
| C01E | [your plan · evening](https://www.figma.com/design/WGbMylNV4rPoMw3r0nceaw?node-id=503-926) | Conditional makeup removal, cleanser and moisturizer. No unstarted treatment inserted. |
| C02 | [review a recommendation](https://www.figma.com/design/WGbMylNV4rPoMw3r0nceaw?node-id=498-212) | Personal reasoning, evidence limits, essential cautions and independent product decisions. |
| C02D | [directions & evidence](https://www.figma.com/design/WGbMylNV4rPoMw3r0nceaw?node-id=499-766) | Source-derived azelaic guide and limitations, with a predictable return. |
| C03 | [product details sheet](https://www.figma.com/design/WGbMylNV4rPoMw3r0nceaw?node-id=499-151) | CeraVe PM practical instructions and reasoning alongside the plan. |
| C03D | [CeraVe PM reasoning](https://www.figma.com/design/WGbMylNV4rPoMw3r0nceaw?node-id=503-1083) | Product-specific evidence; does not send the user to a different product. |
| C04 | [check-ins & history](https://www.figma.com/design/WGbMylNV4rPoMw3r0nceaw?node-id=498-304) | Meaningful dated events: client report, advisor decision, reason and next step. |
| C05 | [send an update](https://www.figma.com/design/WGbMylNV4rPoMw3r0nceaw?node-id=499-305) | Goal-specific reports, comfort, actual use, optional notes and photos. |
| C06 | [orders · quote preparation](https://www.figma.com/design/WGbMylNV4rPoMw3r0nceaw?node-id=499-446) | Payment unavailable until seller, total, address and return terms are confirmed. |
| C06D | [delivered, not started](https://www.figma.com/design/WGbMylNV4rPoMw3r0nceaw?node-id=503-808) | Recorded delivery and a separate explicit actual-use action. |
| C07 | [record actual use](https://www.figma.com/design/WGbMylNV4rPoMw3r0nceaw?node-id=499-584) | Product match, action, actual date and acquisition route. Self-purchase supported. |
| C07C | [report a CeraVe PM change](https://www.figma.com/design/WGbMylNV4rPoMw3r0nceaw?node-id=503-1174) | The same template for a product-specific pause/change report. |
| C08 | [account](https://www.figma.com/design/WGbMylNV4rPoMw3r0nceaw?node-id=498-399) | Identity, address, contact preferences, service and privacy. |
| C08C | [cancel service](https://www.figma.com/design/WGbMylNV4rPoMw3r0nceaw?node-id=499-927) | Support end, read-only end, final plan and unresolved administration. |
| C08R | [read-only access](https://www.figma.com/design/WGbMylNV4rPoMw3r0nceaw?node-id=504-621) | Post-service access is not continuing skincare support. |
| A00 | [clients](https://www.figma.com/design/WGbMylNV4rPoMw3r0nceaw?node-id=503-449) | Stable directory and client-work entry. |
| A01 | [plans](https://www.figma.com/design/WGbMylNV4rPoMw3r0nceaw?node-id=500-299) | Assigned and unassigned drafts, existing publications and template-based creation. |
| A02 | [plan editor](https://www.figma.com/design/WGbMylNV4rPoMw3r0nceaw?node-id=500-383) | Guided checklist with freely selectable sections, structured fields and preview. |
| A03 | [sources & agent changes](https://www.figma.com/design/WGbMylNV4rPoMw3r0nceaw?node-id=500-500) | Private sources and proposed structured changes; validation is not clinical approval. |
| A04 | [publication blocked](https://www.figma.com/design/WGbMylNV4rPoMw3r0nceaw?node-id=500-592) | Exact revision approved, but first service payment not verified. |
| A04P | [verify service payment](https://www.figma.com/design/WGbMylNV4rPoMw3r0nceaw?node-id=503-672) | Human receipt verification is separate from approval and publication. |
| A05 | [ready to publish](https://www.figma.com/design/WGbMylNV4rPoMw3r0nceaw?node-id=500-686) | Assigned client, approved revision and verified payment; still a deliberate action. |
| A06 | [published / notification failure](https://www.figma.com/design/WGbMylNV4rPoMw3r0nceaw?node-id=500-779) | Publication persists; retry only the failed notification. |
| A07 | [review a check-in](https://www.figma.com/design/WGbMylNV4rPoMw3r0nceaw?node-id=500-846) | Public conclusion and separate private notes. A no-change review is valid. |
| A08 | [workspace permissions](https://www.figma.com/design/WGbMylNV4rPoMw3r0nceaw?node-id=503-558) | Owner-controlled Sami approval policy, independent agent authorization and source access. |
| D01 | [guided Maya](https://www.figma.com/design/WGbMylNV4rPoMw3r0nceaw?node-id=503-1271) | Same client screen plus a stable guide rail; no production actions. |

[States and recovery board](https://www.figma.com/design/WGbMylNV4rPoMw3r0nceaw?node-id=504-736) covers first-plan preparation, payment-before-approval, stale approval, save conflicts/uncertain writes, failed notifications, no new recommendation, submitted updates/corrections, unknown product identity and failed uploads/access.

## 3. Fixed system versus personalized plan

### Fixed system ownership

The application owns navigation, layouts, component variants, action labels, form labels, focus behavior, spacing, typography, animation, loading/error/empty messages and permission logic. Neither an advisor nor a plan agent can submit arbitrary HTML, CSS, JavaScript, custom navigation or new button labels as client content.

The implementation uses React/TypeScript and one approved Shelv wrapper layer built on shadcn/ui. Individual page workers may compose wrappers, not create alternate buttons, selects, tabs, dialogs or typography systems. shadcn gives editable code, so enforcing a shared wrapper layer is essential. Component changes have one owner.

All interface pictograms use lucide-react, matching the named Lucide icons in the design. Use one outline weight and component-controlled sizes. No Unicode stand-ins, emoji, second icon package or custom arrow shapes. The logo and product photos are content/brand exceptions.

Lowercase shelv-authored UI and guidance. Preserve proper product/person/retailer names, technical notation, exact source titles, transcripts, quoted client messages and identifiers. Never apply a global CSS lowercase transformation to user or source data.

### Personalized content

The advisor or authorized plan agent fills approved fields: goals, current products, sources, reported experiences, recommendations, reasons, practical directions, cautions, evidence limits, follow-up criteria and review conclusions. Unknown is different from none. A client-reported fact, an advisor conclusion and an AI suggestion retain distinct provenance.

### State-driven presentation

The server’s real state selects a predefined UI variant: unassigned/assigned, saved/published, proposed/approved/obtained/started, payment claimed/verified, current/historical, active/read-only, valid/stale approval. Page renderers do not infer these states from copy or images.

## 4. Navigation and desktop composition

Client top-level navigation is exactly: **your plan**, **check-ins & history**, **orders**, **account**. Home and your plan are one destination. Personal contact is consistently accessible; no separate chat inbox is implied.

`your plan` combines a useful routine-first canvas with a restrained context column. Show the active morning/evening instructions directly, a real proposal requiring a decision, next check-in and the latest relevant published conclusion when one exists. No empty dashboard cards, invented progress score, revenue-like analytics, adherence streak or configurable widget builder.

Product details use one consistent side sheet on desktop. Evidence may use a full page when lengthy. Do not nest dialogs. Back/close restores the prior product, selected routine tab, scroll and unsent draft. Direct links and browser Back/Forward must work. A direct link with no in-app predecessor falls back to the relevant parent route instead of navigating out of the service unexpectedly.

The Figma reaction paths select fixed frames; production must preserve context dynamically. Prototype navigation does not prove browser-history behavior. Recovery-board implementation annotations are explicitly labeled “not UI copy” and must never appear in the customer application.

Client pages should preserve their understandable structure for older/less confident users: visible text labels, large controls, readable body copy, keyboard support and no hover-only essential actions. Focus order and screen-reader semantics must be tested after implementation. A design with 48px controls is not by itself an accessibility sign-off.

## 5. Client page contracts

### C01/C01E: your plan

Inputs: current entitled published version; active instructions; actual-use reports; pending decisions; the latest published review summary; next check-in date; access state. Read them from authoritative records, not duplicated dashboard state.

For Maya’s source-faithful morning: water rinse, CeraVe PM, La Roche-Posay Anthelios UV Control SPF 50, optional usual makeup. The cleanser is not invented as a morning step. For evening: one makeup remover if makeup was worn, the comfortable CeraVe cleanser, then CeraVe PM. Azelaic acid remains a proposal until actual Start is recorded.

Display useful short instructions inline. Details add depth and full cautions; they are not the only place to find the next step. Product photos aid recognition and never establish formula verification. An absent/uncertain image uses a neutral, consistently styled fallback. A nonproduct instruction such as rinsing is not given a fake product identity.

Paused/left-out items remain visible beneath the active routine with their reason. A client stop report updates the reported-use presentation promptly, flags the advisor and retains the published advice/history. Do not display an unqualified instruction to continue after the client has reported stopping.

No pending change: omit the decision panel, do not display a fake recommendation or a large empty widget. No scheduled check-in: show that truth and contact access, not an invented date. A first unpublished plan shows preparation/payment access, not draft advice. An authorized historical view is read-only and unmistakably labeled historical.

### C02/C02D: recommendations and evidence

Each decision has stable identity, action, exact product/variant, personal reason, directions, cautions, evidence/source references and uncertainty. Support keep, pause, leave out, replace, finish-then-replace, add, optional alternative and no addition without making them all purchase cards.

One primary recommended option per decision. Optional alternatives are deliberate, not a retailer marketplace. Approve/defer/decline are independent of payment. Approval creates eligibility for a quote, not a charge, retail purchase or Start. Self-purchase remains available without reducing service access.

Cautions essential to safe use remain visible. Manufacturer instructions and clinical-study limitations must not be removed merely to reduce words. Show evidence limits specific to the product/formulation; do not imply stronger-formula evidence proves the selected strength.

For the source-derived azelaic example, the full guide includes patch-test instructions, dry/intact skin use, eye/lip/broken-skin avoidance, gradual use contingent on comfort, avoiding the irritating toner and simultaneous new actives, and response to irritation. The schedule is not claimed to be uniquely optimal and cannot auto-escalate just because calendar days elapsed.

### C03/C03D: product details

The sheet retains current plan context. Its ingredients, evidence and use-change actions refer to the exact selected product. CeraVe actions never open azelaic evidence or create an azelaic report. Practical use comes before deeper comparison/source material.

Implementation supports the same renderer for every product; the Figma set illustrates selected products, not every product permutation. A request for an unrecognized product ID returns a consistent unavailable/recovery state, not a guessed record.

### C04/C05: check-ins and history

The next check-in is preparation information, not automatically a booked call. A client may use the portal, text, call or video. No form/photo requirement is added to service or refund eligibility.

Collect a short answer for each active goal (better/same/worse/not sure), comfort, actual use and optional notes/photos. These are self-reports, not objective measurements. No automatic skin score. Reporting a concern is not diagnosed by the UI.

History distinguishes occurred date, recorded date, source/channel and author. Entries show client report, advisor decision, rationale, changes and next step. Advisor-private notes are excluded on the server, not simply hidden in the client DOM.

Submitting creates a stable report and an advisor alert. Correcting a report adds an amendment with attribution and flags already-reviewed information; it does not silently replace the source of a previous decision. A review can conclude no changes without creating a new plan version. Restore an old plan by creating a new draft, never deleting subsequent events.

Client timeline should not expose internal draft churn or every system event. Advisor history can expose imports, approvals, private notes and operational events within its permissions. Product start dates survive instruction-only revisions.

### C06/C06D: orders

Founder-arranged purchasing is the primary convenience. Keep product economics at actual approved product cost, tax and shipping, no markup. Service billing remains separately identifiable, even when an itemized combined quote is supported.

A payable final quote must freeze exact product/size, retailer/seller, all-in total, shipping-address version, payment instructions and checked return conditions. Unknown terms block payment. Do not invent zero tax/shipping, a generic 30-day return policy, or merchant/carrier integration. Real prices and terms must be checked for the specific transaction.

A sent-payment claim or screenshot is not verified receipt. Founders verify actual gross amount and recipient outside the portal. Verified funds create ready-to-purchase bookkeeping, not a retail order. A recorded order does not establish shipment. Delivery is founder/client-recorded unless an explicit integration is later approved.

Changing a plan must not rewrite an existing quote/order. Changed address, seller, product, total or material return terms require reconciliation and any necessary new client approval. Product returns have their own requested/eligibility/authorized/returned/retailer-refunded/client-repaid lifecycle. Service refunds remain separate. A portal status never claims that money moved without the authorized recorded event.

### C07/C07C: actual use and product identity

Use visible question context plus **yes**, **no**, **not sure**, with consistent check/x icons and text. No thumbs-up/down ambiguity. A client match confirms their report of product identity, not every ingredient claim. Consequential unknown variant/strength/label information remains unresolved until checked.

Supported reported-use actions: started today, started earlier, paused, stopped, using differently (frequency/amount/details), or added an unreviewed product. Real date and recorded date remain distinct. Unknown dates remain unknown; no inferred start date from approval, delivery or photos.

For a self-purchased recommendation, skip Shelv payment/order requirements while preserving exact product identity, acquisition route and actual Start. Never create a fake Shelv order. If the product differs, flag it as a different/unreviewed product rather than silently activating the recommendation.

An advisor can record the client’s confirmed report with “reported by [client], recorded by [advisor]” attribution and channel. Server supplies actor and recording time. A report updates actual use and creates relevant alerts; it does not rewrite the approved guidance. Stop/pause reporting is never blocked for lack of advisor permission.

### C08/C08C/C08R: account and service

Self-service profile/contact/address editing uses the shared forms with verification where needed. Product/goals changes create reports for advisor review. A changed profile address does not update a frozen already-paid order.

Service billing displays actual authoritative coverage, manual renewal and first-three-period guarantee terms. $100/month is the current new-client service offer; preserve legacy actual amounts/coverage during migration rather than fabricate new receipts.

Ordinary cancellation ends future renewal requests and retains support through paid coverage. Show support end and read-only end explicitly. The approved review policy is 30 days of read-only access after support ends plus a downloadable final plan. During read-only access, do not promise new skincare replies or permit new care-plan writes. Keep unfinished order/refund administration reachable separately. Download/export uses the actual last entitled plan and current instructions, never private notes.

Early refund/departure has its own explicitly confirmed support end; cancellation does not itself transfer a refund. Raw-source retention is separate from portal access. Sign-out clears private transient state and rejects late responses from a prior session.

## 6. Advisor authoring and the plan contract

A00 is a stable client directory. A01 lists drafts and publications independently of client records. Creating an unassigned draft must not create an Auth account or placeholder client. Attaching a draft to a client requires a deliberate identity check and appropriate admission/assignment authority.

A02 is the direct workbench: the checklist is persistent but sections can be opened in any order. Sections are sources, client context, decisions, routine, follow-up and review/publish. AI-filled sections begin as needs review. A reviewer can mark a section reviewed; substantive edits invalidate affected readiness. Completion is not a count of words or filled text boxes.

Incomplete drafts must be saveable. Safe-storage validation is separate from publication-readiness validation. Autosave uses an honest saving/saved/error/uncertain indicator. Preserve local work during recoverable errors; do not log private contents. One working next-version draft per client has revision conflict detection. Unassigned drafts may be numerous. Checkpoints do not become multiple simultaneous active care plans.

Manual editing and external-agent editing must use the same authenticated operations and structured plan model. Agents may propose, create/edit/save drafts, attach sources, validate and prepare a preview. They cannot bypass API authorization with database-admin credentials, edit public page files, mutate schemas or write client-specific markup.

Support unique cases using repeated approved modules: multiple goals/products, no current products, no new purchase, nonproduct advice, conditional routines and schedules. Stable product/step identities must distinguish two serums without inventing categories. Conditional schedule is based on authored rules and confirmed actual use, not an autonomous escalation engine.

A03 separates source extraction from recommendations. Retain client-reported facts, advisor judgments, agent suggestions and unresolved contradictions. Link a fact to a transcript location, note or product label when available. Applying an import shows a diff against the base revision. Unknown fields are rejected, not silently interpreted. Preserve a human’s later edits rather than overwrite from a stale import. Format validation does not mean clinical accuracy.

An old template version or imported schema cannot silently relabel past publications. An explicit compatible migration is required. Past published content remains immutable/readable under the applicable entitlements.

## 7. Exact first-publication gate

The user explicitly approved this new rebuild behavior; it supersedes the old policy permitting first publication before payment. Existing historical client records are not retroactively re-dated.

First publication requires all of the following at the server at commit time:

1. The intended client is assigned and the publisher is authorized for that client.
2. The publishable draft is complete and required sections reviewed.
3. A valid human approval identifies the exact client and publishable draft revision/content.
4. The first service payment is genuinely verified for the applicable service quote.
5. The authorized actor deliberately submits publication. Payment verification never auto-publishes.

Human review and payment verification may happen in either order. Payment updates must not spuriously invalidate unchanged clinical content approval: bind approval to the actual publishable draft identity/revision, not merely an unrelated aggregate case revision that also changes when payment is recorded. Conversely, content changes or client reassignment invalidate approval.

External agents may publish only with Kanuj’s specific authorization of that intended publication. A model-generated “approved” field is not authorization. Record human approver, client, draft revision/hash, action scope, time and server validation; execution is authenticated and protected against replay. A retry of the same authorized command returns the same publication receipt, not a second plan.

Sami requires Kanuj’s approval initially. Only the owner can change that policy, with confirmation and audit. That setting does not remove the separate agent-specific authorization requirement. Changing a policy does not grant new source-consent permissions.

Successful first publication makes the plan accessible, begins the service period and review schedule, and creates the notification event. Use authoritative timestamps and calendar rules, not the browser clock. Later publications do not renew/restart service or reset product Start dates. An update also requires current publication authority/coverage; the “first payment” gate is not repeated as a new $100 charge for every update.

A04 shows the blocked state. A04P shows genuine manual verification requirements. A05 shows ready but not yet published. A06 shows committed publication and separately failed email. These frames demonstrate requirements; they are not proof of implemented enforcement.

## 8. Notifications, history, privacy and dates

Publish a client-visible plan/review: queue a neutral transactional email and portal indicator. Save a draft/private note: no client notification. A client submits or corrects material goals/product-use/check-in information: create advisor attention and configured email notification. An automated acknowledgment does not fulfill the promised useful human reply.

Commit publication before sending email. Persist the notification job durably and deduplicate by source event/channel/recipient. If email fails, publication remains valid; show retry status. Retry the same notification, not the business event. Separate queued, provider-accepted, delivered-if-known, bounced/failed and read/seen states. Do not claim a client read something simply because the provider accepted a message.

Notifications should not contain raw consultation details or source attachments. Deep links must check authorization after sign-in and restore the intended destination. No hidden grant of plan access through a notification URL.

The source-retention agreement is during service plus 12 months after end, with a defined deletion workflow. Keep source storage, publication/history retention and legally required financial/audit retention as different policies. Do not equate unlimited plan versions with indefinite recordings or access. Retention/deletion processing must respect applicable obligations and approved client permissions.

Only authorized users and task-scoped plan agents receive a given client’s full relevant source. Development agents use synthetic data. No private recordings, transcripts, names or photos in repository fixtures, logs, demo snapshots or public assets. Model training is off at launch and needs separate authorization. Removing a name is not proof that voice/face/consultation material is anonymous.

The existing paid-service scope/credential question remains a business launch gate to verify independently; this design specification does not establish legal clearance.

## 9. Guided Maya and demo safety

Use the same client renderer, product components and state presentation as production. Guide narrative: meet Maya, understand a meaningful decision, daily use, follow-up, next step. D01 illustrates stage 2 with an external stable guide rail. For narrower desktop widths, specify/review a compact rail or dismissible guide that does not hide essential cautions/actions; do not shrink a 1800px screen blindly into 1440px.

The prototype links stage 2 to the same evening screen. It is not a complete interactive five-stage tour. Explicit exit and exploration remain possible. All example reports and financial states must remain clearly staged; no real account, payment, upload, message or purchase occurs. Reset only demo state. Private four-client walkthrough sharing remains separately authorized, not made public by this redesign.

## 10. Secondary flows and coverage limits

The screen set is a consolidated review baseline, not proof every peripheral form is already illustrated. The following actions use the same component and state contracts and need their exact variants included in the implementation acceptance inventory: sign-in/email callback; edit profile/address; account contact verification; service payment/renewal detail; fully confirmed product quote/payment claim; return/refund detail; product mismatch photo/name correction; denied access; save-conflict diff; upload error/retry; initial empty client; assigned historical-plan snapshot; historical report amendment; notification inbox and successful retry; responsive tour stages and mobile layouts.

Do not infer a new business rule or special visual treatment for any unillustrated subflow. If it needs a distinct interaction not covered here, submit the narrow proposed design for approval rather than claim the page is done. Shipping these flows also requires ordinary authenticated-client positive and negative tests, not just advisor previews.

Figma screens with adjacent journey stages are independent examples. A client report in one stage must not be used as an asserted historical outcome elsewhere. The prototype does not retain form values or decision state when navigating between canned frames.

## 11. Parallel implementation boundaries after visual approval

One coordinator owns the final integration branch and the approved specification. Available worker roles:

- Shared foundation/integration: React shell, approved shadcn wrappers, tokens, Lucide and action vocabulary; route and Back contracts.
- Plan records/agent interface: structured schemas, unassigned drafts, versions, source permissions, exact-revision approval, safe authenticated operations.
- Advisor UI: directory, authoring/import/review, private/public separation and publication gates.
- Client plan: combined landing, routine, recommendations and product details using the common renderer.
- Check-ins/history: reports, amendments, conclusions, timeline and published-version views.
- Orders: verified quotes/claims, actual purchases/delivery, self-purchase and returns.
- Account/service: identity, coverage, cancellation, retention/consent and access-end rules.
- Independent verification/demo integration: synthetic journeys, authorization, state/visual regression, notifications and source isolation.

Eight is a concurrency cap, not eight independent product designers. Stabilize shared contracts before conflicting page work. Separate worktrees/branches, owned files and one merge owner. Page workers cannot independently change shared components, schemas, routes or dependencies. Preserve the backend/security/history foundations except agreed extensions. No blanket database migration reset or retroactive fabricated receipts.

The consolidated desktop design is now visually approved. The implementation coordinator must commit this approved specification and its decision/acceptance records to the repository before page implementation. Current repository policy still contains superseded notification/publication rules; update those prospectively and preserve historical verification evidence. Do not tell workers to choose among earlier A/B/C/D concepts.

## 12. Acceptance contract

Automate business behavior, boundary and rendering tests, then perform a bounded representative-user review of comprehension. Tests exercise real isolated auth/persistence/permissions where feasible, not only mocked UI.

Required journeys:

1. Save an incomplete unassigned draft; return without lost work; assign it without creating a duplicate client.
2. Import a valid structured draft; reject unsupported fields/code; detect stale concurrent edits; retain user corrections.
3. Publish before payment: deny. Publish before approval: deny. Publish wrong revision/client: deny. Reuse approval after an edit: deny. Verify payment without publication: do not publish.
4. Publish with both gates and deliberate authority: create exactly one immutable version and one initial service clock. Retry: same receipt, no duplicates.
5. Email failure: published plan/access/coverage persist. Notification retry does not republish or alter dates.
6. Proposed treatment is absent from actual current routine until explicit real Start. Delivery alone does not activate. Self-purchase does not require fake Shelv funds/order.
7. Client stop/changed-use report is visible and alerts advisor without rewriting authored advice. Advisor-recorded reports retain reporter/recorder attribution.
8. Check-in may be submitted without photos. Amendments preserve originals. A no-change review creates meaningful history but not another plan version. Private notes never leak.
9. Quote changes after approval/payment require reconciliation. Profile-address changes do not rewrite frozen orders. Refund request is not money transferred.
10. Cancellation keeps correct support/read-only end dates and final export; unresolved order/refund work remains accessible. A read-only session cannot make new skincare writes.
11. Account switches/logout reject delayed responses. One client cannot read another’s plan, files, quotes, history or signed attachment. Demo traffic cannot perform real business writes.
12. Back/Forward/direct URLs restore context; all selects, dialogs, sheets, errors and focus states use the same components. Test 1440px design targets plus long content, keyboard, zoom, reduced motion and later 320/390px responsive layouts before production release.

A CI check producing a screenshot is not proof of a visual match. Compare rendered outputs against the approved frames and evaluate content/state, not merely an absence of console errors. Coverage percentages are not a substitute for the gate and negative-case tests above.

## 13. Source and validation record

Source files read for this design: `apps/portal/site/advisor/maya-sample.js` (blob `b9d5ee1f366b5ca6c5e4fac88fe85fe8870f4412`) and previously reviewed UI tokens/operations. The actual Maya source includes an optional makeup step and a morning water rinse; neither is to be replaced with a generic three-product routine.

Existing in-file product-image hashes used: CeraVe PM `ae5d3a6ba7a77e5849f9b1750ce6dc183a010539`; azelaic `f9b2e001ce48b89618aa2602b2a5794cf1539b3d`. Unavailable images remain neutral fallbacks. No font files are included.

Lucide source icons: arrow-left, panels-top-left, clock-3, package, user-round, message-circle, check, x and chevron-down, from `lucide-icons/lucide/icons/`. Preserve required library notices in implementation.

Structural audit: 26 application frames, no text outside their screen bounds, no top-level frame overlaps. Native text and shared component instances remain editable. Selected key frames and the state/index boards were visually reviewed; the actual-use form overflow and a canvas overlap were corrected; this is not an automated WCAG audit, browser end-to-end test, full clinical review, production data test or deployment verification.

**Next gate:** implement against the approved consolidated baseline and versioned decision record. Do not reopen the earlier layout competition. Complete unillustrated secondary flows using the approved component and behavior contracts; escalate only material contradictions or genuinely new product decisions. Production release remains a separate verified action.

## Approval addendum: 30 October 2026

The latest user approval supersedes the earlier review-candidate status only. It does not convert prototype reactions into implemented behavior or erase the recorded validation limits. All implementation workers, reviewers, explorers and nested agents must run `gpt-6.1-sol` at `xhigh`; no silent fallback. The coordinator must verify effective settings, not rely on the prose instruction alone.

First successful publication, not payment verification, starts the service and review clocks. Both first service-payment verification and human approval for the intended client and exact publishable revision are required. Payment recording must not spuriously invalidate unchanged content approval.

This document is the original reviewed specification with status-related sentences updated and this addendum appended. Its substantive screen contracts are preserved.

