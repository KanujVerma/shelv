# Concierge check-ins and advisor replies

Source implementation for short client reports, optional private photos, explicit client-visible advisor replies, advisor preparation and separate private meeting notes. The shared browser module is `apps/portal/site/features/checkins/`. Source changes and a migration candidate do not imply hosted installation.

The explicit reply addition is specified in `docs/superpowers/specs/2026-10-24-checkin-replies-design.md`. Forward migration `20261024230829_concierge_checkin_replies.sql` preserves the existing write branches and adds a separate append-only reply table/projection. Transport allowlists remain an integration responsibility; clients must never gain the reply write action.

Intake is by Zoom or in person. Meetings are arranged externally by text/email. The next date is advisor controlled, with first check-in around two weeks after the routine begins and monthly thereafter. There is no booking/calendar/chat, automatic diagnosis, score, inferred skin assessment or AI photo processing. Submitting a report never changes a routine or becomes an advisor decision. Advisor notes never enter a client response. No actual account or capability grant is introduced, including for Sami.

## Implementation

- `validation.ts`: strict client payload allowlist, immutable normalized request/photo UUIDs, 1000-code-point short answers, optional photo IDs, safe errors.
- `photos.ts`: JPEG/PNG/WebP signature and metadata validation, maximum 5 MiB, SHA-256 and an immutable Blob snapshot of the exact validated bytes. This is signature validation, not a complete image decoder.
- `dates.ts`: strict calendar dates and pure two-week/calendar-month suggestions. It creates no booking, timer, automatic entitlement or saved date.
- `projection.ts`: explicit allowlists for client history, nested reports/photos and submit receipts. No arbitrary total history cap.
- `submissions.ts`: pure transition oracle plus provisional `CheckinSubmissionRepository.submitAtomically(command)`. The repository must enforce current guards, uniqueness, exact replay and photo attachment atomically. This model is not a database or an authorization substitute.
- `commands.ts`, `handler.ts`: authenticated HTTP input, owner-derived client targets, separate advisor reads/writes, bounded raw/multipart uploads, authorized short-lived views and sanitized failures.
- `storage.ts`: native server-only Storage transport, non-upsert upload, bounded object read for exact retry verification, signing at most 60 seconds. No service-role RPC.
- `index.ts`: real source entrypoint using shared `createConciergeAuthenticatedPorts<CheckinRpcCall>` with an exact server-owned four-name registry.

## HTTP contract

POST JSON to the feature endpoint. Every request verifies a permanent Auth identity and preserves its bearer for SQL. No input role, owner, path, URL or entitlement claim authorizes access. Core SQL rechecks permanent identity, deletion fence, invitation/enrollment, target ownership and capabilities before every operation and replay. It centrally distinguishes optional pre-meeting input from ongoing service check-ins; the handler does not invent routine-start or paid-through prerequisites for optional uploads. Expired/cancelled service stops new ongoing check-ins, while last-entitled-plan read/download remains central.

| Action | Additional fields |
| --- | --- |
| `client_read` | None |
| `advisor_read` | `clientId` |
| `submit_report` | `requestId`, `expectedRevision`, `comfort`, `consistency`, `changes`, optional `photoIds` (defaults `[]`) |
| `set_next_checkin` | `clientId`, `requestId`, `expectedRevision`, `nextCheckinOn` (`YYYY-MM-DD` or null) |
| `add_meeting_note` | `clientId`, `requestId`, `expectedRevision`, `checkinId`, `note` |
| `send_advisor_reply` | `clientId`, `requestId`, `expectedRevision`, `checkinId`, `reply` |
| `photo_view` | `photoId` |
| `advisor_photo_view` | `clientId`, `photoId` |

Client view is `{revision,nextCheckinOn,reports:[{id,submittedAt,comfort,consistency,changes,photos:[{id,angle}],advisorReplies:[{id,reply,authorId,createdAt}]}]}`. Older wire reports without advisorReplies remain accepted as empty history. Advisor view is `{client:<client view>,meetingNotes:[{id,checkinId,note,createdAt}]}`. Ordinary write receipts are `{revision,operation,reportId:uuid|null}`. Comfort/consistency are required nonblank text, changes may be empty; all are at most 1000 Unicode code points. Private meeting notes and public replies are distinct nonblank fields, each bounded at 4000 code points. Photos have at most one reference per front/left/right angle, with zero or missing angles allowed.

Accepted JWT RPCs are `concierge_checkin_read(p_client_id)`, `concierge_checkin_advisor_read(p_client_id)`, `concierge_checkin_write(p_client_id,p_action,p_expected_revision,p_request_id,p_payload)` and `concierge_checkin_photo_authorize(p_client_id,p_photo_id)`. Write actions are `submit_report`, `set_next_checkin`, `add_meeting_note`, `send_advisor_reply`, `reserve_photo`, `complete_photo`. Their payloads are respectively `{comfort,consistency,changes,photoIds}`, `{nextCheckinOn}`, `{checkinId,note}`, `{checkinId,reply}`, `{angle,contentType,sizeBytes,sha256}`, `{photoId}`.

Replies require current active advisor view/edit rights and active client enrollment. Payment-confirmation rights are not required. SQL checks exact report ownership and fresh authority before replay lookup, appends the authenticated advisor UUID/time, and uses the existing check-in revision/client lock/request fingerprint. Exact retries return the original receipt without another row; altered reuse or fresh stale revisions fail closed. Clients cannot write replies or read another client's replies. Private notes are never copied/prefilled into replies or projected to clients. Replies do not publish a plan, activate a product, notify anyone or create chat.

Reply verification: `node --experimental-strip-types tests/concierge-checkin-replies.test.ts`; opt-in native actual-handler/SQL acceptance: `CONCIERGE_REPLIES_NATIVE_SQL=1 node --experimental-strip-types tests/concierge-checkin-replies-native.test.ts`. Native tests initialize/stop an isolated Unix-socket-only synthetic cluster, clear inherited PG variables and accept `CONCIERGE_TEST_PG_BIN` for the installed PostgreSQL toolchain. Evidence belongs under ignored `.local-artifacts/checkin-replies/`.

## Private uploads and viewing

Raw upload: authenticated POST `<feature>/upload` with binary image body, exact image MIME `Content-Type`, and headers `x-request-id`, `x-completion-request-id`, `x-expected-revision`, `x-photo-angle`. The reserve and completion UUIDs must be distinct, stable and preserved with the identical original bytes/revision on uncertain retry.

Equivalent bounded multipart POST to the normal feature endpoint is supported: exactly `metadata` JSON `{action:'upload_photo',requestId,completionRequestId,expectedRevision,angle}` and `file` Blob/File. The complete envelope is capped at 5 MiB plus 16 KiB, metadata at 4096 characters, and the image itself at 5 MiB. Original filenames never become Storage keys or response fields.

After validation, bearer-authorized reserve returns a server-only descriptor `{revision,photoId,ownerId,bucket:'concierge-checkin-photos',path,angle,contentType,sizeBytes,sha256,state:'pending'|'complete'}`. Core explicitly acknowledged those keys. The handler checks the owner prefix, safe path, metadata and exact digest binding before privileged Storage I/O. It uploads without upsert. A duplicate/conflict is never success on its own: the handler reads the immutable object, bounds it and verifies exact type/size/SHA-256 before completion. A failed or uncertain upload returns a safe retryable failure; incomplete refs cannot be submitted. No data cleanup job or deletion schedule is invented.

Completion uses its separate original UUID and the saved original reserve receipt's feature revision. For `complete_photo`, `p_expected_revision` is this immutable reservation fence, never the current feature head. Core persists the reservation revision, rechecks current authorization, owner/reserver binding and object metadata under the common client lock, compares the original fence, then increments the current head. An overlapping reservation or advisor date write must not strand a valid upload. The handler never rebases this argument or changes the completion UUID. Completion returns `{revision,operation:'complete_photo',reportId:null}`. Public upload reply is only `{revision,photo:{id,angle}}`.

Check-in revisions are separate from R1 plan revisions. An exact replay preserves the original action, target, payload, request UUID and expected revision. A changed expected revision after a conflict is a new intent requiring a new UUID. The core must enforce replay and revision handling atomically; local code never retries automatically or substitutes a revision.

Viewing begins with the opaque photo ID and a fresh authorized RPC. Only a complete descriptor is signed. Reply is `{photoId,signedUrl,expiresIn:60}`, private/no-store. The signed URL must point at the exact configured HTTPS Storage origin and immutable private object. It remains a bearer capability until its short expiry. Raw descriptors/paths, original names, image bytes, URLs, answers and private notes are absent from telemetry, replay, logs and model calls. There are no direct customer Storage read/list/replace/delete/sign grants from this feature.

## Server configuration

`SUPABASE_URL` (HTTPS origin), `SUPABASE_PUBLISHABLE_KEY` or existing `SUPABASE_ANON_KEY`, exact comma-separated `CONCIERGE_ALLOWED_ORIGINS`, and server-only `SUPABASE_SERVICE_ROLE_KEY` for Storage I/O only. No credential was read or configured during implementation. Redirects and cookies are refused; native upstream transports have a 10-second deadline. Responses are private/no-store. No logging, analytics, replay or model/provider path exists in these modules.

## Verification and integration limits

Focused tests use synthetic signature fixtures, intercepted native Fetch, actual HTTP handler Requests/Responses and the real entrypoint under a Deno host shim. They exercise cross-owner/revoked failures, optional photos, client/private projection boundaries, immutable byte snapshots, duplicate/exact replay, changed-input conflicts, failed/uncertain uploads and short-lived signing. `concierge-checkins-interleaving.test.ts` drives the actual handler with an explicit RPC contract double: overlapping uploads, advisor date writes during Storage I/O, lost completion acknowledgement with exact retry, revocation during Storage I/O and before replay, and completion UUID collision. A legacy global-head fence control reproduces the stuck-upload failure. These tests specify the agreed handler/SQL wire contract; native SQL concurrency regressions belong to core. A pure transition test is not SQL concurrency evidence, and the host shim is not real Deno/Auth gateway acceptance.

```sh
node --experimental-strip-types --test tests/concierge-checkins*.test.ts
node node_modules/typescript/bin/tsc --ignoreConfig --noEmit --strict --target ES2022 --module ESNext --moduleResolution Bundler --allowImportingTsExtensions --types node --lib es2023,dom supabase/functions/concierge-checkins/*.ts tests/concierge-checkins*.test.ts
```

The opt-in `concierge-checkins-sql.test.ts` runs the actual HTTP handler through native PostgreSQL RPC transactions against core's separately marked disposable local check-in clone. It checks the exact database name and marker before inserting generated fixture actors. It never resets/truncates/deletes prior fixture rows or creates/grants/alters roles. It covers overlapping native completion transactions, advisor writes, exact retries after lost acknowledgement, UUID collision, private notes, cross-owner viewing and fresh revocation guards. Storage is an in-memory Blob plus native `storage.objects` metadata adapter; Auth uses generated fixture actors. Neither adapter is real hosted service acceptance.

```sh
CONCIERGE_CHECKINS_NATIVE_SQL=1 node --experimental-strip-types --test tests/concierge-checkins*.test.ts
```

The verified native-enabled scoped suite has 37 passing cases with no skips. The default command skips its single opt-in SQL case. Core separately owns migration-lineage and SQL lock/guard regression acceptance.

Remaining gates are actual Auth/JWT/Storage/Edge integration, physical object cleanup and deletion races, parent-composed authenticated frontend acceptance, repository-wide required checks and exact-head CI. Parent owns final integration/review. No hosted settings, schema application, deployment, credentials, real client data or grants were used.
