# Check-in module integration

Export: `mountCheckinsPanel(element, {clientId, mode: 'client'|'advisor', request, canWrite=false, uploadPhoto?})` from `./index.js`; returns a cleanup function. `request(command, {signal}={})` returns the raw parsed successful JSON body, or throws `{status,code}`. The host owns authentication, feature endpoint routing and capability decisions. This module reads no credentials/configuration, uses no persistent browser storage, and logs no client data.

## Binary upload callback — exact contract

`uploadPhoto({file: File, angle: 'front'|'left'|'right', requestId: string, completionRequestId: string, expectedRevision: number}, {signal}={})` returns `{revision: number, photo: {id: string, angle: 'front'|'left'|'right'}}` or throws `{status,code}`.

Send authenticated `POST /functions/v1/concierge-checkins/upload` with the File itself as the binary request body. Headers (plus the host's verified bearer/public API key):

- `Content-Type: file.type` (`image/jpeg`, `image/png`, `image/webp`).
- `x-request-id: requestId` (stable reserve UUID).
- `x-completion-request-id: completionRequestId` (distinct stable completion UUID).
- `x-expected-revision: String(expectedRevision)` (check-in feature revision).
- `x-photo-angle: angle`.

Never JSON-encode image bytes or convert them to base64. Preserve both IDs, the original expected revision and the identical File on retry. Limit 5 MiB. The server hashes and validates bytes, reserves a private immutable reference using the bearer, uploads without upsert, verifies exact bytes on an uncertain-upload duplicate, and completes using the distinct completion UUID. No raw path/descriptor returns to UI. Optional upload eligibility comes from the shared transactional SQL guard.

If `uploadPhoto` is omitted, the module will send FormData through `request` with exactly two entries: `metadata` (JSON `{action:'upload_photo',requestId,completionRequestId,expectedRevision,angle}`) and `file` (File). The endpoint accepts this equivalent bounded envelope; the raw binary callback above is available now.

## JSON actions

- `{action:'client_read'}` -> `{revision,nextCheckinOn,reports:[{id,submittedAt,comfort,consistency,changes,photos:[{id,angle}],advisorReplies:[{id,reply,authorId,createdAt}]}]}`. Missing advisorReplies in older reports means no replies.
- `{action:'advisor_read',clientId}` -> `{client: <client view>,meetingNotes:[{id,checkinId,note,createdAt}]}`.
- `{action:'submit_report',requestId,expectedRevision,comfort,consistency,changes,photoIds}`.
- `{action:'set_next_checkin',clientId,requestId,expectedRevision,nextCheckinOn}`.
- `{action:'add_meeting_note',clientId,requestId,expectedRevision,checkinId,note}`.
- `{action:'send_advisor_reply',clientId,requestId,expectedRevision,checkinId,reply}`.
- `{action:'photo_view',photoId}` or advisor `{action:'advisor_photo_view',clientId,photoId}` -> `{photoId,signedUrl,expiresIn:60}`.

Ordinary mutations return `{revision,operation,reportId: uuid|null}`. `request` is feature-specific: do not send these actions to the R1 plan endpoint. `canWrite` controls presentation only; SQL checks actual authority before every operation and replay. Routine, service eligibility, invitation revocation and cancelled last-plan access remain central.

The module shows client-visible Advisor replies separately from Private advisor meeting notes. The Reply to client composer starts empty, explains its visibility and accepts at most 4,000 Unicode code points. Reply bodies use textContent, preserve line breaks and never execute markup. Author UUID/time come from the server; the UI says Your advisor without exposing an email. Clients cannot compose replies. No reply changes a plan/routine or triggers email, chat or notification. SQL requires current active advisor edit rights; payment-confirmation rights are irrelevant.

Reply writes reuse exact intent/retry/reload locks. A lost response retains its original UUID/body/revision; successful receipt clears that reply draft only, and failed authoritative reload keeps new writes locked until Reload latest succeeds. Conflicts keep unsent text for deliberate review. Private notes are never prefilled or converted. Dates remain external-meeting preparation dates; there is no booking/calendar/chat. All angles are optional. URLs expire and are removed from the DOM, and cleanup aborts requests and clears images/timers.

Synthetic preview exports are `createCheckinPreviewStore()` and `createCheckinPreviewRequest({mode,store})` (store optional) from `./fixtures.js`, with no live-network fallback. A trusted injected preview function may mark `syntheticPreview=true` solely to display generated PNG placeholders; live adapters must never set that flag.

## Shared synthetic preview store

```js
import {mountCheckinsPanel} from './index.js';
import {createCheckinPreviewStore,createCheckinPreviewRequest} from './fixtures.js';
const store=createCheckinPreviewStore(); // host retains one store per synthetic client ID
const request=createCheckinPreviewRequest({mode:'client',store});
const cleanup=mountCheckinsPanel(element,{clientId,mode:'client',request,canWrite:true});
// After cleanup, create an advisor request with the SAME store to review that client report.
```

Never select the preview adapter as a fallback after a live API failure. The fixture contains synthetic reports/notes, in-memory receipts and generated PNG placeholders, and calls no live network. Client view excludes private notes. The host owns the synthetic store across route/mode changes.

## Focused verification

- From repository root: `node --test apps/portal/tests/checkin-replies.test.mjs` exercises explicit public handoff, old empty reports, private-note exclusion, client write denial, HTML as literal text, exact uncertain retry and failed-reload lock at desktop/mobile widths with all outbound blocked.
- `node --test apps/portal/tests/client-parity.test.mjs` retains Alex/Maya formula/ingredient, photo/navigation and receipt/explicit Start acceptance. Both previews now use the shared check-in fixture module.

The following older commands describe historical local evidence and paths, not the current portable test entry point:

- `node --test qa/checkins*.test.mjs`: 7 executable model/fixture tests, including shared client-to-advisor state and private note exclusion.
- `node qa/checkins-browser.mjs`: 12 Chrome checks with synthetic data, intercepted image requests, ephemeral local HTTP server and zero page errors. It closes its owned server/browser. This local harness uses this host’s installed Playwright/Chrome paths, not a newly installed dependency.
- Screenshots: `qa/checkins-client-mobile.png`, `qa/checkins-advisor-desktop.png`; both visually reviewed.

The browser checks cover optional missing photos, exact report/upload retries, new intent IDs after a known revision conflict/reload, private URL expiry, advisor date/note saves, read-only UI, no mobile overflow and cleanup. The separately owned actual-handler-to-native-SQL fixture validates the backend wire path with generated actors. Actual JWT/Storage/gateway and parent-composed authenticated acceptance remain separate gates.

After a successful upload, including an exact replay, the module preserves the uploaded photo and draft, clears the completed retry intent, and reads the latest authoritative view before enabling a new write. An original receipt can predate an advisor write or another upload. A failed refresh keeps new writes locked and the successful photo attached; Reload latest recovers without another upload. The original upload UUIDs, bytes and expected revision are never rebased. Browser acceptance exercises a replayed receipt followed by a report, pending-refresh controls, refresh failure and explicit reload recovery.
