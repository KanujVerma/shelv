# M03 notification inbox acceptance assets

Owner: Kanuj. Status: source implementation and built-in unit controls only. Every module result is `OBSERVATIONS_ONLY`; acceptance is `NOT_EVALUATED`. Genuine execution is pending Parent review, M04 publication observations and a concrete resource packet. The same full 26 screens, D01-D48 and ten journeys remain required. No acceptance numerator changes.

## Identity and scope

- Literal returned taskId: `node:delegated-task:command%3Amcp%3Aa56eb6fa-1435-4927-8890-15373d05f366%3Adelegate-task%3Amilestone-20261103-notifications-inbox`.
- Sole integration Parent: `9b085ada-435f-48d6-8886-957c1ce3e82d`, Root `/Users/kanuj/.t3/worktrees/shelv/kanuj-portal-rebuild-integration-20261030`. Initial actual Root `004c7a3a145f472f79c2bb6860ebf917798527b8`.
- Own clean starting branch `t3/notification-inbox-e2e`, commit `772c4fae7904e39a9e793627023adf56de811d8e`. That prepared ancestry is INPUT, not Root. Parent must admit only the four new owned postimages.
- Actual self and Parent `t3_thread_configure` READs, with `modelSelection` omitted, returned `codex/gpt-6.1-sol/reasoningEffort=xhigh/serviceTier=default`. Explicit Node returned `v22.23.0`.
- Read actual Root approved entry, D01-D48, full desktop specification, implementation contracts, acceptance/ownership/current records and current notification commands/codec/controller/UI/gateway/SQL/publication outbox. Root advanced to `d4eb83dec33ec68cc553228fa87922ce14de1b80` during authoring; the changed path list excludes these notification contracts, selectors and migrations. No Root edits were made.

Owned new assets only: [observer and oracle](../../../apps/portal/tests/genuine/notifications-inbox.browser.mjs), [read-only SQL capture](../../../apps/portal/tests/genuine/notifications-inbox-seed.sql), [built-in tests](../../../apps/portal/tests/genuine/notifications-inbox-oracle.test.mjs), this report. No dependencies, compiler, SQL parser, DB/Auth/engine, browser/server/network or fixture queries were used. No nested agents, PR, push, watch, merge or deployment.

## Approved frame and source pin

C01 is `498:85`, the morning plan frame containing the client shell bell. Actual Root `Shell.tsx` uses shared Button/RouteLink/Bell, `#portal-notifications`, visible `notifications`, route `/notifications`. The current inventory explicitly calls the inbox secondary navigation, not a 27th approved frame. No separate inbox node ID is invented. C04 `498:304` owns the historical destination; this asset does not accept C01 or C04 as a whole.

Pinned Root `004c7a3a` blobs:

| Source | Blob |
| --- | --- |
| `apps/portal/src/app/Shell.tsx` | `6175f0e4ac0ada0f7c7236e8a5a081e751d25899` |
| `apps/portal/src/features/notifications/Notifications.tsx` | `4d11deb977ae27045e3d721c0a12d5d32baa32a9` |
| `src/contracts/PortalNotification.ts` | `b205850326db4558acb7e6a0de23a8dab93f0a1b` |
| `src/contracts/PortalNotificationMapping.ts` | `ac658e0ee3e2ffbf4ec1698b31373f4471baefbd` |
| `src/contracts/PortalNotificationValidation.ts` | `d4b41ef32f60a0b5f3f4960ab2bf6545a05bbaf4` |
| M54 plan/publication migration | `9f9351c969acc1d143269274f6e144ece4e61f12` |
| M64 notification migration | `b25eadf338172f28550d796a613aa76032433748` |

The observer uses actual `.notification-row`, `open update`, `mark seen`, `next page`, `seen`, `sign out` and `historical plan` selectors. Publication notifications serialize their safe destination as `/history/versions/<version>`. ClientHistory actually reads that version through `/api/client/reviews`, `read_client_plan_v3`. A denied/failed historical read refuses the phase; no alternative endpoint or held Guidance/provider reroute exists.

## Public ABI and M04 dependency

Parent approved the bounded ABI/relationships before exports, then explicitly corrected the descriptor to the exact existing public v1. Parent forwarded the actual descriptor allowlist; this child did not read Base/private/resource files.

`observeNotificationInboxMilestone({page, descriptor, notificationScenario, relogin, captureCanonical})` consumes a caller-owned real Playwright-compatible page. It never imports Playwright or creates resources. `relogin({page,actor:'a'|'b',returnTo:'/plan'})` is the reviewed Parent-owned ordinary UI helper. The module uses the UI sign-out control and requires real logout HTTP, then observes the actual new cookie digest; it never writes tokens/cookies or intercepts success. The same session's numeric generation may repeat across sessions, so it is not used to prove a fresh login.

The unchanged descriptor allowlist is `{schemaVersion:1,ownerId,projectId,fixtureDirectory,sourceCommit,endpoints:{portal,supabase,mailpit},actors:{a:{id,email,initialDisplayName},b:{id,email,initialDisplayName}},privateDirectory,fingerprints:{source,config,images,processes,resources}}`. All leaves except schemaVersion are strings. `actors.*.id` is used. No generation/origin/rootSha/custody fields are added. Generation/custody and execution authority remain in Parent's separate packet.

`notificationScenario` is a separate input, never a descriptor mutation:

```text
{schemaVersion:1,
 a:{clientId,publicationVersion,notificationEventId,portalDeliveryId,publicationReceiptId,publishRequestId},
 b:{clientId,publicationVersion,notificationEventId,portalDeliveryId,publicationReceiptId,publishRequestId},
 privateMarkers:[exact synthetic private source/note canaries]}
```

M04 must generate both clients' actual canonical publications using its reviewed authorization/payment path. Numeric milestones do not force execution order: M01 Account first; M02 recorded Orders; M04 feeds M03 notifications and M05 history. M03 cannot invent a missing plan, entitlement, human approval or financial authority. The scenario requires distinct A/B event/delivery/receipt/request IDs, and initial unseen portal rows. It is bounded to those two publication events; additional visible event families require a separately reviewed scenario rather than guessed provenance.

Actual Root M54 publication result at line 508 contains `requestId`, `publicationReceiptId`, `publicationVersion`, `notificationEventId` plus target/kind/instructionId/reviewId/publishedAt/firstServiceStarted. `portalDeliveryId` is NOT a receipt property. Parent/M04 must capture the existing `plan_deliveries.id` using the exact event ID, recipient ID and `channel='portal'`. The read-only SQL consumes that row and checks `publications`, `entitled_publications`, `plan_events`, `plan_publication_receipts` and matching `plan_requests`. Plan request fingerprints are bytea SHA256; notification journal fingerprints are text `plan_hash`.

Actual generated IDs do not yet exist in this handoff. The mapping is source-pinned, and the execution packet/final observation binding remains dependent on M04 through Parent. No successful producer/Auth results are invented. Canonical publication creates both portal and email rows; this lane does not create/delete/claim/send/retry email. M04 owns outbox/sink isolation. Queued email is not delivered or read evidence.

`captureCanonical(label)` returns exactly `{observations,errors}`. Any errors or mismatched label/binding refuse the phase. The Parent callback runs only the reviewed read-only query against its granted live resource. It is a diagnostic observation, never an authorization predicate, fake context or response stub. Required labels are `baseline`, `after_seen`, `after_replay`, `after_owner_denial`, `after_session_denial`, `after_relogin`.

`evaluateNotificationInboxEvidence({descriptor,notificationScenario,observations,canonical})` is pure. It checks actual command/request ID/receipt/journal binding, portal revision/seen timestamp, immutable publication/service/head/outbox digests, exact replay and denial no-effects. It returns consistency issues and `OBSERVATIONS_ONLY / NOT_EVALUATED`, never an authentic/current/accepted verdict. Supplied JSON alone cannot establish custody or provenance.

## Execution acceptance checklist for Parent

- [ ] Source review and the concrete reviewed resource/page/ordinary UI login packet; exact public descriptor source/config/image/process/resource refs verified by Parent. No Base or stopped fixture reuse/query/reset.
- [ ] M04 actual A/B publication receipts and existing portal delivery IDs, captured via Parent; read-only baseline relationships agree and both target portal rows are unseen.
- [ ] Actual A C01 bell opens persisted own inbox; neutral event matches captured event/delivery/version; no B rows or private fields/canaries.
- [ ] Open the actual safe historical destination. Require exact V3 request/version, real 200, matching actual returned plan.version and historical UI; held refusal remains held.
- [ ] Actual UI mark-seen request ID matches exactly one canonical `notification_requests` row/command/result. Portal revision increments once and seen_at equals the receipt timestamp; no other target fields change.
- [ ] Exact same HTTP command replay and request-status return the same receipt. No second journal, revision, event, publication, service date or outbox effect.
- [ ] Actual refresh preserves seen; ordinary UI logout/B login positively reads B's distinct own persisted notification. B mark-seen/status of A returns actual 404/not_found with unchanged canonical rows/head/journal.
- [ ] Client private event-delivery read returns actual 403/action_forbidden, with no private projection/effects. An HTTP 400 is never sufficient.
- [ ] Actual UI B logout clears notification rows/private UI. Signed-out HTTP attempt returns 401/session_ended; canonical before/after/journal unchanged.
- [ ] Fresh ordinary A login uses a different SHA256 session-cookie digest, same actual owner, and persisted seen state. No raw cookie/CSRF/token is emitted or injected.
- [ ] Exact same-origin/CSRF/no Authorization/no-store observations; full DOM and notification/historical response canary scans. Notification success projections reject unknown fields.
- [ ] Preserve original observations/errors, exact argv/cwd/exits, source/resource fingerprints, screenshots/trace and independent review. No genuine acceptance from these unit controls. No full J09, provider delivery/retry or whole-frame acceptance is implied.

## Separate source/RED/GREEN/setup evidence

All implementation test commands below used cwd `/Users/kanuj/.t3/worktrees/shelv/t3-64b24698` and exact argv:

```text
/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node --test apps/portal/tests/genuine/notifications-inbox-oracle.test.mjs
```

These inputs are explicitly synthetic unit constructions, not captured producer results. Initial meaningful RED used the preimplementation oracle returning empty issues. Original assertion bodies remain; the session-cookie test was refined from a numeric-generation assumption to actual cookie digest, as described above.

| Separate run | Raw terminal summary | Exit / evidence chunk |
| --- | --- | --- |
| Initial oracle RED | tests 18; pass 1; fail 17; cancelled/skipped/todo 0 | 1 / `165f9d` |
| Oracle GREEN | tests 18; pass 18; fail 0; cancelled/skipped/todo 0 | 0 / `6f3b08` |
| Observer refusal RED | tests 20; pass 18; fail 2; cancelled/skipped/todo 0 | 1 / `0163a0` |
| Observer refusal GREEN | tests 20; pass 20; fail 0; cancelled/skipped/todo 0 | 0 / `fc91ab` |
| Private-event denial RED | tests 24; pass 23; fail 1; cancelled/skipped/todo 0 | 1 / `ab0f8f` |
| Private-event denial GREEN | tests 24; pass 24; fail 0; cancelled/skipped/todo 0 | 0 / `e4a372` |
| Destination HTTP/duplicate-row RED | tests 26; pass 24; fail 2; cancelled/skipped/todo 0 | 1 / `72a425` |
| Destination HTTP/duplicate-row GREEN | tests 26; pass 26; fail 0; cancelled/skipped/todo 0 | 0 / `a530a4` |
| Ordinary logout HTTP RED | tests 27; pass 26; fail 1; cancelled/skipped/todo 0 | 1 / `ca8908` |
| Final source GREEN | tests 27; pass 27; fail 0; cancelled/skipped/todo 0 | 0 / `4d81b5` |

The exact raw tool responses remain separate session evidence under those chunk IDs. Salient original RED assertion output, excerpted without replacing the originals:

```text
not ok 2 - missing canonical snapshots cannot turn HTTP successes into effects proof
error: 'canonical_missing'; code: 'ERR_ASSERTION'; expected: true; actual: false
not ok 19 - browser observer refuses absent caller-owned helpers before any page use
error: 'Missing expected rejection.'
not ok 8 - private event-delivery read requires actual client-policy denial and unchanged state
error: 'private_event_denial'; code: 'ERR_ASSERTION'; expected: true; actual: false
not ok 20 - duplicate notification rows cannot establish an own inbox observation
error: 'inbox_order'; code: 'ERR_ASSERTION'; expected: true; actual: false
```

Setup-only observations are separate: an initially guessed Superpowers skill path did not exist (exit1), then the catalog's actual skill path was read; no application test failed for that setup error. Two initially guessed Root UI filenames did not exist and were corrected to `src/app/Shell.tsx` / `Application.tsx` through source inventory. Source inspection found and corrected the SQL plan-request bytea/text fingerprint distinction before any SQL parse/execution. No SQL failure or SQL GREEN is claimed. Built-in `node --check` for the observer exited0, empty stdout (`b35379`).

Application suites, dependency/SDK/compiler checks, SQL parser/replay, DB/Auth, browser/server/network/engine/fixture execution and genuine observation collection were deliberately unrun under the source-only grant. Guidance private-return, M65 and provider-photo holds remain HELD. No production/real-client email/money/purchase/fulfillment/release action occurred.

Final built-in syntax checks for both `.mjs` files exited0, empty stdout (`7ad42b`, `955588`). A Node fs/path-only report link check found3 local links,0 broken and0 em dashes (`498c64`, exit0). Staged diff-check exited0 (`70e017`); only the four allocated new files were staged. No application/compiler/SQL/browser result is inferred from these checks.

## Minimal continuation prompt

Review/admit only these four M03 postimages, not prepared INPUT ancestry. Preserve source-only evidence and unchanged full scope. Coordinate M04's actual A/B receipt/event/portal delivery IDs through Parent; verify unchanged public v1 and separate resource custody. After source review and a concrete later execution packet, supply actual page + ordinary UI relogin + `{observations,errors}` read-only canonical capture, run serially, preserve raw observations/errors, then independently assess them. If V3 historical read/provider access refuses, keep that hold and return the exact phase. Do not acquire resources, query Base/stopped fixtures, invent authority/results, reroute held work, or promote these built-in passes to genuine/release acceptance.
