# Shelv portal UX design

Owner: Kanuj. Scope: local implementation on draft PR #209, 26 October 2026. This records intended behavior; actual checks belong in acceptance and the implementation plan. No deployment is authorized.

## Navigation decision

Use task-first Plan navigation. Recommendations answer what to change and why; Daily routine answers what to use now and how. A new Home dashboard would repeat those destinations without creating a distinct task. Fresh entry selects Recommendations while choices or received-but-unstarted products need attention, then Daily routine when an existing routine is the relevant task. Explicit links and browser history override this default.

Keep Check-ins as an accessible workflow/history. Place About this plan, version history and download with the plan. Put account information, Payments, service administration, Help and optional Replay tour behind a recognizable account trigger that remains available on mobile. Contextual pending-payment/check-in actions link to their canonical destination; they do not duplicate those workflows.

Use a substantial product page for identity, current role, placement/order, directions, quantity when authored, and cautions, followed by optional rationale/background/ingredients/sources. Never invent an amount where the plan does not provide one. Focused ingredient explanations retain Back and parent context. A readable HTML export uses current canonical client data, labels its actual format, and supports printing/saving PDF without pretending a text file is a PDF.

## Trust and identity

Client approval is a quote choice; payment, receipt and explicit Start remain separate. Only the server's active routine and reviewed instruction revisions determine daily steps. Draft and published, optional and required, private advisor notes and client-visible replies, sample and real records remain distinct. Stop/pause safety remains visible even while proposed purchase explanations become compact.

A plan title is not identity. Known sample/preview names are passed explicitly. Authenticated clients may receive only their own canonical enrollment display name through the existing guarded client read. Legacy responses use Your account. No email, auth metadata, new grant, permission or hosted migration application is introduced.

## Shared interface and copy

Reuse semantic tokens for cream/forest-green colors, text, spacing, type, borders, radii and motion. Reuse current button/navigation/card/form primitives and one accessible dialog service. Client/advisor differences reflect different tasks, not separate visual systems. All substantial changes include keyboard, focus, mobile, error and retry checks.

Each added sentence must identify something necessary, support a decision, explain a consequence or enable recovery. Remove generic subtitles, repeated status text and navigation instructions. Retain financial terms beside prices/quotes, safety and scientific uncertainty, privacy, consent and unsaved/uncertain-write recovery. Do not add empty settings pages or decorative cards.

## Advisor organization

Use Clients -> Client workspace -> task. Search/filter remain efficient; demos and private walkthroughs sit apart from live records and metrics. A workspace makes consultation, draft, preview/publication, check-ins, payments and service history discoverable. Preserve unsaved draft/notes, exact uncertain retries and immutable publication boundaries through navigation and Back/Forward.

## Research and limits

These decisions adapt familiar conventions, not another product's identity. Apple's [sidebar hierarchy](https://developer.apple.com/design/human-interface-guidelines/sidebars) and [modality guidance](https://developer.apple.com/design/human-interface-guidelines/modality) support stable destinations and bounded dialogs. W3C [disclosure navigation](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/) supports a native account disclosure without falsely claiming ARIA menu behavior. [Modal-dialog guidance](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) informs naming/focus/escape/return. NN/g [progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/) informs practical-first product detail and secondary technical depth. [Linear account preferences](https://linear.app/docs/account-preferences) support preserving a useful starting destination; [Shopify object timelines](https://help.shopify.com/en/manual/shopify-admin/productivity-tools/timeline) support history with the object and separate internal notes.

The native UX/polish skills and reviewed Impeccable/Taste app-screen methods inform hierarchy, restraint, clarity and hardening. Browser and external-tool execution must be reported separately from reading their guidance. These are design judgments grounded in source and synthetic interaction, not measured human usability results.

Implementation ownership, tasks and verification: [plan and coverage ledger](superpowers/plans/2026-10-26-portal-ux.md).
