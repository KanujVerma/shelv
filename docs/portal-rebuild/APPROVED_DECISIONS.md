# shelv portal rebuild: approved decisions

**Owner:** Kanuj Verma
**Decision date:** 30 October 2026
**Status:** approved requirements for implementation; not a claim of existing behavior or permission for live business actions.
**Repository:** `KanujVerma/shelv`
**Approved design:** Figma file `WGbMylNV4rPoMw3r0nceaw`, consolidated page `498:32`, index `504:797`.
**Approval:** the user approved the consolidated set: “this looks great lets do it”.
**Inspected repository baseline:** `d39a7d4943209080df7c4cf97d85784f462758bf`. Discover the actual current branch, open work and deployed provenance before implementation.

This is the durable decision record, not a transcript of the conversation. It preserves accepted choices, rationale, rejected directions and known limits. Requirements supersede conflicting older prospective policy for this rebuild. They do not rewrite historical acceptance evidence or claim an undeployed change is live. The full supplied desktop specification and screen manifest remain detailed companions.

## 1. Product, design and scope

**D01. One client experience.** Home and Your plan are one destination named `your plan`. Navigation is exactly `your plan`, `check-ins & history`, `orders`, `account`. `text shelv` remains consistently accessible. No separate redundant Home dashboard.

**D02. Approved baseline, not a new design competition.** Implement the consolidated 26-screen set, not the earlier A/B/C/D experiments. Most frames are 1440 × 960. D01's guide specimen is 1800 × 960 and requires a usable narrower-desktop adaptation. Preserve the approved hierarchy, spacing, typography, density, content and patterns. Do not choose an older frame because it is easier.

**D03. Full frontend rebuild, bounded backend changes.** Use React and TypeScript, with shadcn/ui as the foundation for all controls, one Shelv-owned wrapper layer and lucide-react for interface icons. Retain existing auth, access controls, business records, payment/history protections and deployment constraints except explicitly approved extensions. No simultaneous whole-backend rewrite.

**D04. Enforced consistency.** Buttons, selects, fields, dialogs, sheets, tabs, navigation, badges, errors and toasts come from approved shared components. Page workers compose them; one owner changes them. Product/routine-specific modules are shared compositions. No per-client HTML, CSS, JavaScript, navigation or button labels. A plan is data, not a generated page.

**D05. Brand and copy.** Brand is `shelv`. Lowercase shelv-authored UI and newly authored guidance. Preserve names, product/retailer identities, technical notation, source titles, identifiers, transcripts and quoted user content. Never apply a global CSS lowercase filter. Use weight and size for hierarchy, not ALL CAPS or excessive bold. Keep necessary words only; do not remove useful directions, cautions, uncertainty, financial terms or recovery information. Avoid em dashes in authored copy. Follow approved fonts/tokens rather than installing a new visual style.

**D06. Icons have consistent meaning.** Lucide only for interface pictograms, shared outline weight/sizes. No emoji or Unicode substitutes. Brand marks and actual product imagery are content exceptions. Important actions keep visible labels; decorative icons do not replace accessible names. Product identity uses `yes`, `no`, `not sure` with consistent appropriate icons, not ambiguous like/dislike thumbs.

**D07. Desktop first, responsive before release.** Implement and compare approved desktop first. Mobile is the later responsive pass, not a different information architecture or an ignored launch requirement. Test the approved desktop dimensions, narrower laptops, 320/390px mobile, keyboard, zoom and reduced motion. No new dark-mode or animation-library project.

## 2. Client pages and navigation

**D08. Your plan is useful immediately.** Show the actual current morning/evening routine with practical directions inline, a real pending decision, the latest relevant published conclusion and next check-in when present. Product photos aid recognition; unknown imagery uses one neutral fallback. No empty dashboard widgets, invented dates, adherence streaks, improvement scores or configurable widget builder.

**D09. Proposals do not become actual use.** Proposed changes remain separate from the active routine. Paused/excluded products remain visible with reasons. No proposed product is inserted merely because the client approved, paid or received it. No unscheduled review is displayed as a booked appointment.

**D10. Detail without a maze.** Use one consistent contextual side sheet for product details on desktop; longer evidence may have its own page. No nested dialogs. Back/close restores the product, routine tab, scroll, focus and unsent work. Browser Back/Forward, refresh and deep links must work. With no valid predecessor, go to the appropriate parent, not unexpectedly out of the application.

**D11. Correct content binding.** CeraVe details open CeraVe evidence and CeraVe use reporting, not azelaic content. Source-faithful Maya has a morning water rinse, CeraVe PM, sunscreen and optional makeup; her evening has conditional makeup removal, cleanser and moisturizer. Preserve the source's complete guidance and limitations. Do not invent a generic cleanser step in the morning or delete conditional steps to fit a screenshot.

**D12. Check-ins & history.** Gather goal-specific better/same/worse/not-sure reports, comfort, actual use and optional notes/photos. These are subjective client reports, not clinical measurements. Text/call/video remain valid. No form or photo requirement for service or refunds. Show occurred date, recorded date, channel, report, decision, rationale, changes and next step. Group meaningful events, not internal autosave noise.

**D13. Account.** Profile/contact/address uses shared forms and appropriate verification. Goal/product changes are reports that alert the advisor, not unreviewed changes to professional guidance. Profile-address edits never mutate a frozen paid order. Account owns service billing/cancellation/privacy; Orders owns product purchasing.

## 3. Templates, drafting, provenance and outside agents

**D14. Plan lifecycle.** Reusable template, editable draft and immutable published version are separate entities. One current care plan per client, with multiple goals/routines and historical versions. One working next-version draft per client with checkpoints, not competing branches. Multiple unassigned drafts are allowed. Creating a draft does not create an Auth account or fake client; attaching it is deliberate and permissioned.

**D15. Guided, not forced.** The editor sections are sources, client context, decisions, routine, follow-up, review & publish. A persistent checklist allows free navigation. Editing starts at the relevant section. Agent-filled sections need human review. Readiness is not a count of filled fields. Substantive changes invalidate affected review status.

**D16. Save incomplete work.** Safe draft-storage validation is weaker than publish-readiness validation. Autosave incomplete drafts honestly with saving/saved/error/uncertain status and recoverable work. Do not mark unconfirmed writes as saved. Use base revision checks, compare-and-apply imports and idempotent retries; never silently overwrite newer human or agent changes. Avoid persistent browser storage of sensitive drafts without an approved threat/retention design.

**D17. Unique cases use approved modules.** Support keep, pause, leave out, replace, finish-then-replace, add, optional alternative and no addition. Allow multiple goals, multiple same-category products, no existing products, no new purchases, nonproduct guidance and appropriate escalation. Unknown is not confirmed none. Stable identities must distinguish two serums without fake categories.

**D18. Schedules are authored.** Support morning/evening, selected days, conditional/as-needed instructions and gradual introductions when authored. Use actual Start as the relevant anchor. No automatic frequency/strength escalation based merely on elapsed time, and no unique per-client scheduling code.

**D19. External AI workflow.** ChatGPT/Codex or another authorized external plan agent can read the relevant permitted client context, create/edit/save drafts, attach sources, validate and return previews using the same underlying authenticated operations as the advisor UI. This is not limited to copy/paste JSON; structured import remains a fallback. No embedded AI chat, autonomous research/prescribing system, in-browser recording or automatic transcription in this release.

**D20. Source and import truth.** Upload/store existing recordings, transcripts, notes and photos. Separate client reports, advisor conclusions, agent proposals and unresolved contradictions. Link facts to source locations when available. Show an import diff, reject unsupported fields/code, and preserve manual edits. Schema-valid is not clinically correct. Treat uploaded documents/transcripts as untrusted content, never as instructions to override permissions or disclose data.

## 4. Publication, permissions and service clocks

**D21. First-publication gate.** Server-side publication requires the assigned intended client, complete reviewed draft, valid human approval of the exact publishable client/revision, genuinely verified first service payment for the applicable quote, and a deliberate authorized publish command. Review and payment can happen in either order. Neither payment nor approval alone publishes anything.

**D22. Precise approval.** An external agent may publish only with Kanuj's specific authorization of the exact client and revision. Model-authored `approved: true` is not authorization. Bind approval to the publishable draft identity/content, actor, scope and server validation. An unrelated payment-ledger revision must not invalidate unchanged content approval; content edits or reassignment must. Prevent replay and concurrent double publication; the same retry returns the same receipt.

**D23. Sami and owner authority.** Sami can enter content and manage operations. Initially Kanuj's approval is required for skincare publication; owner can later disable that requirement through an audited, deliberate setting. It does not disable independent external-agent approval rules or grant new source access. Kanuj may approve/publish his own exact reviewed draft through authenticated deliberate controls.

**D24. First publication starts clocks.** Successful first publication makes the plan accessible and starts the paid service period and review schedule. Verify payment first; do not auto-publish when paid. Later publications never restart service, guarantee or original product Start dates. Use authoritative timestamps and America/Chicago calendar-period rules, not browser time. Three monthly periods are not automatically 90 days. Preserve historical dates and actual legacy payments during migration.

**D25. Review cadence and service access.** First review at two weeks, then ends of months one, two and three, with ongoing monthly/as-needed support. Review dates are not booked calls or permission to defer ordinary questions. Updated instructions show their effective date while reported use remains distinct. Later publishing still requires current authority and coverage, not a new first-service charge for each update. Prepublication clients see preparation/service-payment information, never private draft advice.

## 5. Product identity, choices, money and use

**D26. Product identity.** Add a missing catalog product while drafting using exact known name/variant/source/photo; don't force substitutions. Possible match, client-confirmed identity and ingredient/formula verification are different. Unknown strength/variant remains unknown. Ask a simple `is this your product?` question and request a label/photo only when material. Appearance alone is not ingredient verification. Consequential unresolved details can block dependent advice/purchase, not all draft saving.

**D27. Choice and self-purchase.** One primary option per decision, deliberately optional alternatives when needed, not a marketplace. Approve/defer/decline never charge/order/start. Shelv-arranged purchasing is the primary convenience. Self-purchase remains available without degraded support, fake payments or fake Shelv orders.

**D28. No product margin.** Actual approved retailer cost plus actual tax/shipping, with no markup, affiliate commission or claimed partnership. $100/month concierge service is separate. No new product fee or recurring-charge integration. Founders select the seller and coordinate purchasing/returns, but cannot silently change the approved product, seller, amount, address or material return terms.

**D29. Quote and payment integrity.** Freeze product/variant/size/quantity, seller/retailer, all-in total, address version, eligible manual payment destination/version and checked item-specific return terms. Unknown terms block payable final quotes. A client sent-claim or screenshot is not verified receipt. Verify actual gross receipt outside the portal using existing authorized manual methods. Payment confirmation is bookkeeping, not retailer purchasing, shipment or delivery. Do not infer zero tax/shipping or a generic return window.

**D30. Delivery and actual use.** Use recorded tracking and founder/client confirmation, not a new carrier integration. Delivery prompts an optional actual-use action; it never marks Start. Clients may report started today/earlier, paused, stopped, using less/more/differently or an unreviewed product. Store actual date separately from recording date; unknown remains unknown. Advisor may record a confirmed text/call report with reporter/recorder/channel attribution. Reporting stop never requires advisor permission. Show reported actual use promptly without silently overwriting approved advice; alert the advisor.

**D31. Orders survive plan updates.** Old orders retain their original quote/publication/address/terms. Reconcile material changes explicitly. Self-purchased products still need identity and actual-use handling but bypass Shelv-money state. Different variants are unresolved/unreviewed rather than silently activated as the prescribed recommendation. No client-facing state claims that real funds, shipments or refunds occurred without an authorized recorded event.

## 6. Reviews, notifications and history

**D32. Immutable meaningful history.** A no-change review is valid and need not publish a new care plan. Instruction-only revisions preserve original Start. Corrections append amendments and notify the advisor if relevant, not erase the original report. Restore old plans into new drafts. Current instructions, client care history and advisor audit history are distinct views of linked authoritative records. Private notes are excluded server-side from client views/exports.

**D33. Automatic notification scope.** A published client-visible plan/review generates a neutral transactional email and portal indicator. Draft saves/private notes do not. Material client goal/product-use/check-in submissions/corrections alert the advisor and configured email. Personal texting remains human-operated; automatic SMS is deferred. Automated acknowledgement is not the promised useful human response.

**D34. Reliable event delivery.** Persist a durable deduplicated notification event with the business commit or an equivalently reliable outbox. Send email separately. Delivery failure leaves publication/access/coverage intact; retry notification, not publication. Distinguish queued, accepted, delivered if known, bounced/failed and seen/read. Verify webhook authenticity. Email contains a neutral authenticated deep link, not private sources or sensitive details. Test with isolated recipients; no real-client email in development.

## 7. Operating policies and privacy

**D35. Existing service terms preserved.** Human-led cosmetic routine/product support, initially Wisconsin and adults only. Kanuj leads skincare; Sami leads outreach/scheduling/payments/purchasing/tracking/returns. $100 per monthly period, no mandatory three-month prepayment. Initial reviewed delivery aims for 24 hours, maximum 48 elapsed hours; show a genuine awaiting-payment blocker rather than claim delivery. Useful personal response within 24 elapsed hours including weekends, no agreed holiday exception. Personal phone remains private. No diagnosis, prescriptions, procedures or claim to replace a dermatologist.

**D36. Service refund.** Return service fees actually paid for the first three monthly periods, including eligible early requests, when dissatisfied. Request through 30 calendar days after period three ends. No photo, adherence, objective-improvement or fourth-payment condition. Initiate repayment within 48 elapsed hours after the request and necessary repayment details. Products/tax/shipping are separate. Preserve charge history; request status does not mean money moved. Guarantee is financial, not guaranteed clinical improvement.

**D37. Product return and referral.** Sami checks the actual seller/item/condition/deadline, coordinates eligible returns, records retailer refund and distinct client repayment, and handles founder ordering mistakes. Initiate client repayment within 48 hours after retailer funds arrive; do not promise retailer timing. Existing $100 once-per-genuinely-paying-new-referral policy stays: partner chooses payee; initiate within 48 hours of verified first $100 service payment; genuine client refund does not claw it back. Preserve policy but do not add unapproved referral analytics or automatic payouts.

**D38. Cancellation.** Ordinary cancellation stops future renewal requests and continues through paid coverage. Early refund/departure uses an explicitly confirmed support-end date. Provide the last entitled current plan/instructions export and 30 days of read-only plan/history access after support ends. No new skincare-support promise or care writes during read-only access. Keep outstanding orders/refunds administratively reachable separately. Cancellation does not transfer funds.

**D39. Source retention and access.** Retain client audio/transcripts/notes privately during service and raw source material for 12 months after service ends, with defined deletion processing and applicable obligations. Distinguish source storage, historical plans, financial/audit retention and portal access. No arbitrary cap on history versions is not indefinite raw-source retention. Initially one adult per account, no minors/guardians/household sharing.

**D39 clarification, 30 October 2026:** For audio/transcripts uploaded to a draft where service never starts, the founder selected **“Advisor deletes them manually”** in this thread. Use explicit authorized advisor deletion for that case, with no invented automatic abandonment deadline. Once service starts and ends, the approved 12-month post-service rule applies. This clarification does not change publication/history or financial/audit retention and does not grant source access or training/export rights.

**D40. Data use.** Kanuj and authorized task-scoped plan agents may receive that client's relevant complete source context. Sami's access follows actual assigned role/permissions; do not infer blanket recording access. Development agents use synthetic data only. No private sources/credentials in Git, logs, public fixtures, demos or external monitoring. Model training disabled at launch; service consent is not blanket secondary-use consent. Appropriate disclosed/authorized internal quality review is separate. Removing a name does not anonymize voice/face/consultation.

**D41. Truth and scope.** Four friends paying $25 continuing into month two is early retention, not clinical results, $100 demand or portal proof. Maya is fictional; staged later events are not observed outcomes. Preserve selective, revocable private walkthrough sharing for the four clients; do not publish it openly. Harvard Health course completion is not a professional license or endorsement. No unfinished scanner claim. Wisconsin paid-service scope/credential verification remains a separate business launch gate; software completion does not resolve it.

## 8. Demo, testing, handoff and release

**D42. Same renderer, isolated demo.** Client view, advisor preview and Maya use the same renderer/components. Finish the five-part tour: meet Maya, one meaningful decision, daily use, personal follow-up, next step. Exit/explore/replay/reset work; a guide does not cover essential controls/cautions. No demo real payment, publication, upload or message writes. Respect previous private-share boundaries.

**D43. Model and agent rules.** Coordinator and every coding/research/review/test/explorer/nested agent must run `gpt-6.1-sol` with `xhigh` reasoning. Verify effective settings before delegation and record role/runtime evidence. No default cheaper explorer, silent fallback, `high` substitution or self-reported model guess. If the runtime cannot establish the required settings, stop affected model work and report the concrete blocker. Eight concurrent workers maximum; not eight uncontrolled designers.

**D44. Parallel ownership.** Coordinator owns integration. Workstreams: shared UI/foundation; plan records/authenticated agent API; advisor workspace; client plan; check-ins/history; orders; account/service/privacy; independent verification/demo integration. Name owners for notifications, source handling and cross-cutting permissions. Separate branches/worktrees and file claims. Page workers cannot change shared schemas/components/dependencies independently. Contract-first vertical slice before broad parallel page work.

**D45. Documentation is a deliverable.** Before page implementation, commit this decision register, approved specification, exact Figma map, contracts, worker ownership and acceptance matrix. Update AGENTS.md pointers and current founder/UI documents prospectively, with explicit supersession of old publication-before-payment/manual-only-notification rules. Preserve historical release evidence. Each PR maps decision IDs and frames to code/tests and records status as agreed/designed/implemented/tested/deployed. Agent chats alone are not the record.

**D46. Real verification.** Use synthetic data for unit/schema/domain/permission/integration/SQL/Playwright/visual tests. At least one isolated full-stack journey uses actual auth/persistence/permissions; mocked-only UI is insufficient. Independent review must reproduce issues and review the full integrated diff, not merely accept a worker's report. Test negative security/financial cases and difficult content. Screenshots must be compared, not just produced. Human comprehension review is small but cannot be claimed from automated tests.

**D47. Cutover, not destructive replacement.** Prepare a single client-facing release after staging, migration rehearsal, backups, invariants and rollback. Preserve existing clients, actual payments, publication/Start/coverage dates, entitlements and private sharing. No invented legacy payments, blanket migration reset, credential changes or unrelated work deletion. Visual approval is not authorization to deploy production, move money, publish real advice or send real-client messages. Prepare release evidence and obtain explicit production authorization.

**D48. Gaps are bounded.** The approved package includes 26 screens plus recovery specimens, not every secondary state. Sign-in/callback, profile/address verification, renewal/final quote/payment claim, returns/refunds, product mismatch, denied access, conflict diff, upload recovery, historical snapshot/amendment, notification inbox, all guide stages and mobile must be implemented using the fixed contracts. No dead buttons or mocks as final features. Routine engineering details can be resolved/documented; escalate only new business rules, permission changes or material visual contradictions.

## 9. Explicitly rejected directions

Do not restart the old A/B/C/D layout debate, generate per-client pages, add a redundant Home, adopt mismatched UI kits, replace meaningful action labels with icons, globally lowercase source data, expose all raw consultations to all development workers, add an embedded AI/transcription/recording system, create automated SMS/carrier/retailer/recurring-charge integrations, add product margins, invent clinical scores or outcomes, or ship only a polished Maya happy path.

## 10. Documentation and implementation truth

This file records agreed requirements. The existing application has not been rebuilt by creating this document. Figma's 143 frame reactions are not persistent forms or working authorization/payment/email services. Desktop design approval does not erase unrun browser, accessibility, real-user or production tests.

Follow GOAL.md for coordinator execution. Resolve the exact approved nodes from the companion manifest and acquire current Figma screenshots/context through authorized tools. If live Figma differs materially from the approved baseline, document the diff; do not silently substitute another design.
