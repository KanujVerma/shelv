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

## Hosted review correction, 3 November

PR219 [offline delivery recovery](https://github.com/KanujVerma/shelv/pull/219#discussion_r4459885704) was reproduced using the actual existing application session and notification controller under finite synthetic HTTP. The initial read goes offline and clears selection; same-boundary reconnect followed by `loadDeliveries()` sends no request. New regression on frozen `87a669174c8b5574cb4ee0cbee05d73cc0a0c69e` passes7/8 and fails on the missing advisor-bound recovery action.

The advisor presentation now binds the existing notification view's refresh callback through `refreshPublicationDelivery`: use its retained selected-event read when still bound, otherwise call canonical `openPublication` with the retained original command/receipt. Existing mutation/status/retry handlers remain unchanged. This restores the event after suspension without republishing, recreating a receipt, changing dates or replacing currentness/authorization.

Current new8 plus unchanged47 controller/race controls pass55/55 with no skips; frontend strict and diff checks pass. Raw `delivery-hosted-{red,current,types}.log` live in `.local-artifacts/w2/` under `/Users/kanuj/.t3/worktrees/shelv/kanuj-w2-delivery-review-r2-20261103`. The old source/worktree and all prior qualifications remain preserved. Actual browser click, genuine Auth/outbox/provider, full-frame and new independent exact-head review remain pending.

## Authorized truthful browser assertion successor, 3 November

W7's complete seven-file independent source/finite/SSR PASS for unchanged product head `527b04b44bc1e493cb6a12796b9e3ff2288ff276` is preserved in the retained W7 report `docs/portal-rebuild/w7/reviews/W2_DELIVERY_527.md` at report commit `622f611079c39725bf61e854b637a5f0c6a7ca95`. It does not override the hosted portal failure: run `41711456980`, job `126180656920`, completed with3319/3320 and one failure in `rebuild-advisor-browser.test.mjs` publication journey. Its missing-controller branch expected `/queued/`; the observed DOM correctly had event recorded/current delivery unavailable. Raw failure is retained private0600 at `.local-artifacts/w2/PR219_527_PORTAL_CI_FAILED.log`, SHA256 `6bc3e10dea4087802e1a5832337a6f6ecdbae59085fad3e37cdbbf046428d3b7`. That original run remains failed.

W0 explicitly allocated only the superseded assertion block in `apps/portal/tests/rebuild-advisor-browser.test.mjs`. The replacement requires the recorded event and unavailable current-delivery facts, and rejects a false current queued label. All other publication/preview/clock predicates and every byte outside the exact block remain unchanged. No production source changed in this successor.

```diff
-      /queued/,
+      /notification event recorded/,
+    );
+    assert.match(
+      await p.locator("[data-advisor-receipt]").innerText(),
+      /current delivery status is unavailable/,
+    );
+    assert.doesNotMatch(
+      await p.locator("[data-advisor-receipt]").innerText(),
+      /notification queued/,
```

Original full-file SHA256 `47108bf91f675a3207b06f74f1a60a9e17a416bce8cc7bf4b491e576aa79151c`; successor `466c1bcbe91058b45912257213825837b580cb500dca6cd54556d84cf3feb6aa`. Original exact block `67b56c935a7dd669ac472b3e248cd0571557171a753266cf7f28b978d719a6e9`; successor block `bc8d95e9cd3c1ec7a8392db42488e7a7ec9c529446973f3fbca245f966fc78e1`. Replacing the new block with the old in actual bytes equals the immutable Git original. Scope receipt and exact blocks are in `.local-artifacts/w2/browser-assertion-*` under `/Users/kanuj/.t3/worktrees/shelv/kanuj-w2-delivery-test-r3-20261103`.

Explicit Node22 syntax check, unchanged product model/finite/SSR55/55, frontend strict and diff checks pass. No author browser run was granted or performed. New immutable test-source/W7 gate, actual serialized browser execution and exact-head hosted CI are required; this edit alone is not a new browser PASS, full A06 acceptance or a relabeling of the original failure. All held audits remain unchanged.
