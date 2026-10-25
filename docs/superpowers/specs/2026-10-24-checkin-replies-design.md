# Check-in replies

Approved scope: one explicit advisor reply action attached to a submitted check-in. Calls and external messages remain the main contact channels. This adds neither chat nor notifications.

## Contract and authority

`send_advisor_reply` accepts exactly `{action,clientId,checkinId,reply,requestId,expectedRevision}`. Reply is nonblank plain text, at most 4,000 Unicode code points, with NUL and malformed Unicode rejected. The authenticated, permanent advisor must currently have active view/edit rights; payment-confirmation rights are irrelevant. Client enrollment must be active for writes. The report must belong to that exact client. Authorization is checked before replay lookup, so revocation denies even an otherwise exact retry.

Replies append to a separate private-schema `concierge.checkin_replies` table. Each row records the client/report, immutable body, server-derived advisor UUID and server timestamp. No client-provided author, timestamp, private-note reference or conversion is accepted. Direct table access is revoked for public/anon/authenticated/service_role; guarded RPCs provide access. Owner deletion retains the existing cascade lifecycle.

The existing check-in head, client serialization lock and workflow request fingerprint govern the new write. Same actor/request/body/revision returns the original receipt without another row or head advance. Changed reuse fails with request_conflict; a fresh stale revision fails with revision_conflict. Successful writes return `{revision,operation:'send_advisor_reply',reportId}`.

## Projection and compatibility

Each public report gains `advisorReplies:[{id,reply,authorId,createdAt}]`, ordered by server timestamp then UUID. Old wire reports without this property are treated as an empty list; malformed present lists fail closed. Explicit nested allowlists omit unknown fields, private meeting notes, credentials and storage metadata. Authorized advisors receive this same public report projection plus the existing separate private notes. Clients can read only their own reports and cannot send replies.

## UI

Both audiences see a distinct Advisor replies section below the submitted report, using DOM textContent for bodies. Each reply shows Your advisor and the server date. Reports without replies have a quiet empty state. Editable advisor views add a separate Reply to client composer and Send reply button with an explicit visibility description. It is never prefilled from private notes. Private meeting notes remain below it with their existing separate label and controls. Reply drafts are per report and mount, while uncertain write intent retains the exact original command and request ID for retry. Successful writes clear only that reply draft; reload must succeed before another write. Confirmed conflicts require reload/review and preserve text for a new deliberate attempt.

No reply changes a plan, purchase, receipt, routine, check-in date or payment. New routines still require publication and explicit Start. There are no emails, push alerts, threaded chat, edit/delete controls or real hosted writes in this implementation.

## Verification and integration

Use TDD at command/projection/handler, native PostgreSQL and browser boundaries. Cover can_edit without can_confirm, client/view-only/inactive/revoked refusal, report ownership, exact replay, altered reuse, stale/concurrent revisions, append-only rows, private-note exclusion, old empty reports, Unicode bounds, escaped HTML and same-intent retries after lost reply/failed reload. Exercise shared-store advisor/client handoff at 1440/390 pixels and keep all external browser requests blocked. Alex root preview and Maya use the same shared feature fixtures after integration.

Founder operations owns advisor transport allowlists. It must add only `send_advisor_reply` to advisor check-ins actions in the site cookie adapter and matching runtime policies/upstreams; client action lists remain unchanged. Backend root files are authoritative; imported historical backend copies remain provenance until the integrator explicitly reconciles runtime packaging. No commits, push, deployment, credentials or hosted data are authorized.
