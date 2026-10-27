# Shelv portal acceptance

Owner: Kanuj

The agreed completion release is deployed at https://portal.goshelv.com and a fresh hosted synthetic journey has passed. [Release result](PORTAL_RELEASE_RESULT.md) records actual deployment/commit mappings, runtime evidence, cleanup and limitations. [Source provenance](PORTAL_SOURCE_PROVENANCE.md) records lineage; [founder operations](CONCIERGE_FOUNDER_OPERATIONS.md) records daily work. Draft PR 206 is published and unmerged; no Git merge was authorized.

## Agreed product behavior

- Consultations and skin review happen in person or on a call, with photos when useful. Founders enter the resulting context. No separate self-service intake form or automated facial diagnosis is required.
- Kanuj and Sami can add clients from the advisor portal through a separate admission permission. Duplicate handling preserves existing accounts; creation does not claim an email was sent. Clients use the normal portal login flow.
- Written check-in replies are client-visible and separate from private advisor notes. Calls and messages remain normal contact. There is no general chat system or automatic reply notification.
- Keep and elevate the cream, forest-green and editorial design across desktop and mobile. Remember me is an aligned checkbox and label without explanatory text below.
- The current offer is $100 per calendar month, products separate. Zelle, Cash App and Apple Cash are founder-configured manual choices. Cash App is $KanujVerma; Apple Cash is (925) 719-1334; the existing Zelle destination stays. Apple Pay is deferred. These instructions do not establish provider merchant approval or move funds automatically.
- A final quote fixes eligible methods and recipient versions. Client claims and screenshots remain unverified evidence until a founder confirms the actual gross receipt. Renewal requires a new payment; there is no automatic charge.
- Product approval, payment, receipt and Start are separate. Only explicit client Start activates a replacement. Prior routines and financial snapshots remain readable. Existing stop advice must not turn into advice to keep using an irritating product.
- Alex and Maya share behavior, comparisons and clickable ingredient explanations, including optional and finish-then-switch choices. Their actual consultation-derived content remains distinct. No invented personalization or ingredient causation.
- Founders can explicitly confirm that a client uses no skincare products. Confirmed none is distinct from unknown or unfinished authoring. No placeholder product or water-wash step is invented. Subsequent plans use the currently active routine as their authoring basis, preserving the original and activation history.
- Check-in drafts survive in-app navigation, not reload or browser closure. Logout, owner change and replacement session clear drafts and reject late responses.
- A dissatisfied client can request return of service fees actually paid during the first three months. Products are separate. Requests use calls/messages; repayment is manual to a privately confirmed client destination and needs actual return confirmation. No automatic refund, cancellation or refund ledger is introduced.

## Verified local completion

| Area | Result | Scope and limit |
| --- | --- | --- |
| Source preservation | Original checkout preserved; 303 imported baseline files matched the reviewed import map; 97 public baseline assets matched live hashes. | Isolated branch starts at main 33e90b0208f8a84ba1fbcd4aef788a26cf378bc6. Original dirty checkout is outside this change. |
| Founder admission | Independent specification and quality PASS. Final 50-migration Auth/PostgREST/SQL/Chrome fixture passed 15 checks fresh and 15 against retained resources. | Covers native identity creation, duplicate/retry/capability paths, empty initial state, client-owned login and session cleanup. These local checks sent no hosted email or grant; later hosted evidence is recorded separately. |
| Fixture lineage | Independent review PASS. Database-side snapshot and full migration-ledger attestation precede acceptance; incompatible retained schemas are rejected. | Local fixture only. Older volumes are retained rather than erased. |
| Written replies | Contract, native SQL and browser checks pass; independent specification and quality PASS. | Server author/time, append-only replies, report ownership, plain text, bounded Unicode, retry/conflict, private-note exclusion and late-session fences. |
| Manual methods | Independent specification and quality PASS, including cross-version retries/collisions, immutable quote/evidence metadata and gross settlement. Seven enabled native SQL cases pass. | Legacy records remain readable without invented historical recipients. No real money or provider account operation was tested. |
| Empty routine and later plans | Independent specification and quality PASS. Six enabled native SQL cases pass. | Confirmed none, explicit Start, none-to-A-to-B authoring, stale-basis conflict and explicit recovery preserve immutable history. |
| Client parity and presentation | Synthetic client/browser checks pass for both plans; 54 rendered states at 320, 390 and 1440 pixels had no overflow, page errors or external requests. Additional admission/reply/payment states were inspected. | Fixture-backed rendering is separate from hosted data and real Storage acceptance. |
| Portal and sessions | Portal suite 95/95; session runtime suite 141/141 at application freeze. The final release-tooling correction passed 47/47 focused cases, including the later existing-export rejection cases. | Tooling checks overlap the earlier portal suite; these counts are not an aggregate. No application source changed after the application freeze. |
| Backend contracts | 40/40 pass against the actual shared synthetic-request factory. | Local contracts, not hosted provider execution. |
| Database replay | All 50 local migrations replayed. All 31 pgTAP files and 701 assertions pass. | Historical hosted aliases must not be blanket-pushed or repaired. |
| Root application | 1,170 unit checks pass, zero failures, 18 explicit opt-in skips, 1,188 total. App/test types and Expo web export pass. | Finance, empty-routine and reply SQL opt-ins ran separately enabled; two historical SQL opt-ins are not claimed. |
| Integration review | Final application and release-tooling specification and quality PASS; no open findings. | The final application artifact has 136 changed and 244 unchanged imported files. Local reviews do not constitute production acceptance. |
| Release preparation | Generated combined client/advisor package has 106 assets; frozen build/source/ZIP and four Edge-function closures pass preparation. | Preparation performed zero provider calls/writes. Cloudflare omits observability readback; proposed upload explicitly disables collection, requiring action-time verification. |

The original root Expo Auth configuration sends six-digit codes. An early admission attempt failed link extraction after four checks. This was a configuration mismatch, not a portal admission pass. The dedicated portal fixture subsequently passed fresh and retained runs without changing Expo settings.

## Current production and completed hosted acceptance

The deployed application is commit 66f7a22510a9a6ac7753ce98e080325e83024552 on Pages cf09be80-48bf-4b7a-99b2-fb17e0de15ae. All 104 public files match the reviewed build. Both shared-session flags, the existing private namespace and key binding are preserved. Operational correction 2663e976 publishes the verified existing-export guard and actual migration-registration provenance without changing application bytes. All three exact-head CI jobs passed at both commits.

The new hosted journey passed founder Add client UI, normal founder/client login, confirmed-none authoring, two publications, all three manual methods with simulated gross receipt verification, receipt, two explicit local-date Starts, immutable history, photo/report, private media for both roles, written reply/private-note isolation, permission denials and owned local-scope logout. The approved separate cleanup expired one provider-created internal synthetic session and revoked its refresh token. Baseline provider sessions and other client heads remain unchanged. Exactly two login emails were sent; Sami's runtime sign-in and real funds/fulfillment were not exercised.

The [release result](PORTAL_RELEASE_RESULT.md) is canonical for actual hosted identities, the no-products timestamp-collision recovery and its distinct guard statement, the provider observability acknowledgement/readback limit, synthetic order exclusion and the preservation-compatible recovery boundary. Historical October 24 baseline reports remain baseline evidence, not the proof of this new release.

## Business evidence boundaries

Referral partners are the audience, not salon-management software customers. Regent Cuts and Union Hair Parlor expressed interest; Field House said it would review the website. October 26 is a readiness target rather than a confirmed meeting time.

The first-cohort story and public offer belong in [pilot framing](PORTAL_PILOT_EVIDENCE.md). Detailed source notes stay private and excluded from this public repository. Do not invent counts, payment records, dates, results or a referral rate. Do not add refund conditions such as mandatory photos, adherence thresholds or proof of a particular outcome.
