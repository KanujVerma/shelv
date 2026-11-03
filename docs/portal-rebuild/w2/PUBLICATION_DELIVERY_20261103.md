# A06 publication delivery: source candidate

Owner: Kanuj. Baseline: `8c5c6b2d72e75f620487f1b2b110655b03551b17`.
Branch: `kanuj/w2-publication-delivery-20261103`.
Worktree: `/Users/kanuj/.t3/worktrees/shelv/kanuj-w2-publication-delivery-20261103`.

This advisor-only composition leaves the A07 and first-service-quote candidates frozen in their separate worktrees. [Eight-thread rules](../EIGHT_THREAD_RULES.md), prior evidence, all held audits and accepted M01/M02 are unchanged. No notification engine, server contract, retry rule, source permission or shared auth/route is changed.

## Composition and original custody

`AdvisorState.publicationNotification` retains the exact acknowledged original `publish_plan_v1` command and its mapped canonical receipt atomically. Publication request-status recovery records that same original. The pair stays in existing session memory and clears whenever the receipt/session clears; older memory without the pair stays unavailable. No command is reconstructed from a target, publication version or editable event UUID.

`AdvisorWorkspaceProps.publicationNotifications?: NotificationController` accepts the actual W0-owned controller. New advisor-local `PublicationDelivery` calls its existing `openPublication(original,receipt)` and renders existing `NotificationsView` for delivery status. Canonical `publicationReference` validates the pair. A previous selected event is hidden before the new effect, so its email status cannot appear under a different publication. An unresolved earlier notification original is preserved and handled through existing exact status/retry methods before switching context.

Missing controller/original pair says notification event recorded/current delivery unavailable. A stored business receipt does not imply current email state or continuing care entitlement. Actual email queued/claimed/uncertain/accepted/delivered/failed/bounced and portal unread/seen come from the existing canonical controller. Existing VIEW-only status, EDIT-only confirmed retry, revision checks and original idempotency custody are reused. Retry queues notification only; it cannot republish or alter service dates.

W0 approved this seam and owns actual controller creation, single memory-owner across inbox/publication views, route/session applicability and disposal. It must not instantiate competing controllers for the same session memory. This source candidate does not supply a successful replacement port.

## Producer facts and remaining gates

W1 confirmed the existing status/read and confirmed retry seams have no new bounded business-contract gap. `retry_queued` does not prove sent/accepted. Worker result-recording uncertainty never authorizes a resend. `PublishReceipt.notificationEventId` does not supply `portalDeliveryId`; genuine evidence must observe actual event/recipient/channel rows.

The redirect successor, complete SMTP adapter review, actual isolated no-relay mail sink, worker context, native/Auth/browser and delivery proof remain separate gates. All provider/Guidance/M65/photo/A07 holds remain; no refused audit is retried, rephrased or rerouted. No actual outbox/provider acceptance is inferred from finite statuses.

D21-D24/D32-D34/D40/D48, A06 `500:779`, J02/J09 partial. Approved Figma context and screenshot were read. Existing shared controls and notification rendering are reused. The complete A06 frame also requires authoritative service/first-review/approval/access fields and published-plan navigation; this narrow delivery composition does not complete that frame or claim visual/a11y acceptance.

## Proof

Explicit Node22.23.0; live peer configuration codex/gpt-6.1-sol/xhigh/default. `npm ci --ignore-scripts` used that Node; lockfiles unchanged.

- Original source: five new model/finite-HTTP/actual-component SSR controls fail, 0/5. Raw `.local-artifacts/w2/publication-delivery-old-red.log`.
- Current source: seven new controls plus 47 unchanged advisor controller/race controls pass 54/54, 0 failures/skips. Raw `.local-artifacts/w2/publication-delivery-focused.log`. Command: `PATH=/Users/kanuj/.nvm/versions/node/v22.23.0/bin:$PATH node --experimental-strip-types --test apps/portal/tests/w2-advisor-publication-delivery.test.mjs apps/portal/tests/rebuild-advisor-controller.test.mjs apps/portal/tests/rebuild-advisor-races.test.mjs`.
- `npm --prefix apps/portal run typecheck:rebuild`: exit0. Raw `.local-artifacts/w2/publication-delivery-types.log`.
- `git diff --check`: exit0.

Controls cover exact original/receipt remount, original publication status recovery, session/receipt clearing, truthful unavailable fallback, real existing notification controller failure status, confirmed retry with no second publication/date change, VIEW-only retry denial and hiding a previous event on first render. Synthetic HTTP is a finite local fetch fixture, not genuine Auth/SQL/outbox/email. Browser interaction, complete visual/a11y, actual delivery, independent current source/composed review, four graphs/full-root checks and exact-head hosted CI remain unrun or pending. No browser/native resources acquired.
