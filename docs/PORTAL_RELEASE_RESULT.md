# Portal release result

## Current task-first portal release, 26 October 2026

Owner: Kanuj. The user explicitly authorized deploying [draft PR 209](https://github.com/KanujVerma/shelv/pull/209) for the updated demo and advisor dashboard, without merging. The reviewed package is live at [the Maya demo](https://portal.goshelv.com/maya/?guided=1) and [advisor sign-in](https://portal.goshelv.com/?workspace=advisor#/advisor). PR 209 remains draft and unmerged.

| Component | Verified deployed identity |
| --- | --- |
| Deployment source | `7f3ba7a03d6168e7c5ec899578529ccddc9c6761`; final application source `2539d0729bffcb32318add72575a1e28168a1a9d` |
| Production Pages | `018ec919-d9c4-4c8c-afb8-f10c9b2e1556`, successful at 23:08:21 UTC |
| Package | 132 entries; provider manifest and all 129 public file hashes match the frozen package |
| ZIP SHA-256 | `307472c8b6836ae5858d625cd6b0e36748cf8f8b32054967af38b862b2062875` |
| Build manifest SHA-256 | `28a7318230dc4c11ef44a10af47af1190c43d002784d78cf8ac1b5b4fe24ea81` |
| Combined gateway SHA-256 | `4c3be9b9326204bcf583ede4305b45939cbe21bd1b649595002e5c68171d4b16` |
| Private vault deployment / version | `cae4f71c-6a0d-4869-adf1-1f9f2abb2354` / `209813af-a272-433e-b934-074ab1c4e5ab` at 100% |
| Provider-returned vault module | 418,004 bytes; SHA-256 `12ccdf38776e434a5e53233cf3806d755e8cf50a1cd028e8989fe5dd73b99126` |
| Vault code etag | `3d29d8fcbc1b67f4dd33d6e884f09927946f5c7509df4b0e7d47224672a00d51` |
| Edge functions | Operations 7; payments 4, check-ins 4 and admission 2 unchanged; all JWT verification true |

Only the reviewed own-name projection migration was applied, then the affected operations source closure, private vault and Pages package. [Source provenance](PORTAL_SOURCE_PROVENANCE.md) records its exact source hash and provider ledger alias. The migration ledger grew from 78 to 79 without replaying or repairing any historical entry. The existing read function retained its OID, owner, empty search path, security-definer setting and authenticated-only EXECUTE grant. All 17 provider-extracted operations runtime files matched the frozen closure after deployment; the other three functions were not redeployed.

Production and preview Pages settings, both enabled shared-session flags, existing session durations and audience/CSRF boundaries were preserved. The existing namespace `a0a5b089755842dc8c6a62b4f164865b`, `AdvisorSessionObject` SQLite export, all installed binding values and both secret bindings were retained. No secret value was read or replaced. The exact existing export declaration was echoed with no Durable Object migration; all nine reconciliation arrays were empty. Private workers.dev, preview URLs, domains, logging, traces, tails and Logpush remain disabled. The newer Worker API independently confirms collection disabled; disabled subsettings can normalize differently from upload receipts.

Hosted verification matched all 129 public assets. Independent public-browser review passed nine scoped groups with 19 screenshots at 320, 390 and 1440 pixels: Maya's seven-stage tour and Finish/replay, navigation, account disclosure, product detail/Back, ingredients, routine, actual HTML download/render with a print control, and enabled advisor sign-in. Native printing and PDF export were not run. All 96 browser requests were same-origin GETs, including one ordinary advisor-session bootstrap; no form was submitted and there were zero JavaScript or console errors. The isolated public browser's pending-flow cookie was cleared and its browser closed; the server flow retains its normal 600-second expiry.

Nine separate bounded maintenance-advisor checks passed using one genuine existing-account password Auth session and the supported advisor-cookie upgrade. Only the retained **SYNTHETIC DO NOT FULFILL** client was opened. Task navigation, Back, refresh, payments/check-ins/service reads, 390-pixel layout, published read-only preview and product detail/reload/Back passed. Private walkthrough reads and all business writes were blocked in that verification browser. Normal cookie logout completed; the maintenance account returned to zero Auth sessions and founder session-ID set digests were unchanged. Twelve anonymous probes confirmed missing-CSRF and missing-session denial with no-store responses. No login email, client mutation, grant change, transaction or message occurred.

Ordinary authenticated client-owner acceptance and email callback completion were not run. Local/native ownership, SQL and auth-continuation checks remain separate evidence in [UX delivery](PORTAL_UX_DELIVERY.md); the two optional environment-blocked HTTP/SQL checks remain explicitly limited there. [Acceptance](PORTAL_ACCEPTANCE.md) owns the detailed hosted scope.

The immediate rollback remains Pages `17546896-f89f-4300-b9f8-252a4734984c`, with all 120 predecessor public files verified and its exact package retained. Prior raw vault bytes/version and the operations preimage are preserved privately. Recovery can restore those compatible readers while leaving the additive own-name projection installed. Preserve the ledger, immutable history, namespace, keys, sessions and business records; do not reset data or drop migrations. The reviewed deployment manifest, action receipts, raw hash reads and protected synthetic screenshots remain in ignored local evidence.

## Historical Maya tour update, 25 October 2026

The redesigned public [Maya demo](https://portal.goshelv.com/maya/?guided=1) is deployed from `b22436f58e32ea21668dd350269b46227669ab43` on Pages `17546896-f89f-4300-b9f8-252a4734984c`. It begins with a company-branded Shelv introduction, then seven anchored pop-ups with visible pointers and optional real overview, product, ingredient and routine interactions. Next never requires an action. The first visit shows the welcome; a generic browser preference prevents repeat auto-opening. X, Escape, Exit and Finish remove the tour completely, and a quiet **View tour** button explicitly replays it. An active same-tab refresh resumes its stop. If browser storage is blocked, the current document still supports dismissal/replay, but cross-reload persistence cannot be guaranteed.

Ordinary Maya/Alex and the authenticated private guide retain their existing behavior. The public guided clone uses Shelv/we narration and the portal's existing typography, buttons and panel styles. No new font, UI framework, client record, payment, message or share is introduced.

| Release evidence | Verified result |
| --- | --- |
| Package | 123 entries; all 120 public files match the frozen build exactly |
| ZIP SHA-256 | `e5a4c04bee3213826155fc7c55aad72665e14d456915c01af5e56a6f59b10d49` |
| Build manifest SHA-256 | `15d239c82ee1f56a2f0061d740ed9bdb4ba3e459ba94aa253db6d828896bbfd0` |
| Local validation | 260 portal and 142 session tests passed; root 1,174 passed with 18 explicit opt-in skips; application/test types and web export passed |
| Browser validation | 12 actual hosted checks passed at 320/390/768/1440, including dismissal, replay, history/reload, full exit, actual ingredient drill-down and ordinary previews |
| Independent review | No unresolved material findings; a nested ingredient-dialog reanchor regression was reproduced, fixed and independently rechecked |
| Preservation | Gateway, route and header files are byte-identical to the previous release; vault deployment/version, namespace and both session flags are unchanged |

No backend, SQL, Auth, credential, permission or private-data changes were deployed in this update. The earlier release's ordinary authenticated client-owner and hosted service-write limitations remain; those journeys were not rerun for this UI-only change. The backend activation baseline below is retained as historical application provenance and current backend identity.

## Walkthrough and service backend activation baseline, 25 October 2026

Owner: Kanuj. Verified: 25 October 2026, America/Chicago. The provider-assigned migration versions below use 26 October UTC.

Status: deployed; public, anonymous guest and dedicated maintenance-advisor acceptance passed. Ordinary authenticated client hosted acceptance was not run because approved usable client credentials were unavailable.

The explicitly approved walkthrough/service package is active at [portal.goshelv.com](https://portal.goshelv.com). This activation supersedes the local-only candidate status and the cf09be80/66f7a225 production baseline. The earlier completion release is preserved below as historical evidence. [Acceptance](PORTAL_ACCEPTANCE.md) records the current checks and their limits, [source provenance](PORTAL_SOURCE_PROVENANCE.md) records lineage, and [founder operations](CONCIERGE_FOUNDER_OPERATIONS.md) remains the single operating-policy record. No Git merge occurred.

| Component | Actual activated identity |
| --- | --- |
| Application source | [44c3d371fe63aaf23a64b87d0ef459ecc85343d4](https://github.com/KanujVerma/shelv/commit/44c3d371fe63aaf23a64b87d0ef459ecc85343d4) |
| Production Pages | `88ec5c96-3a0b-415c-8fca-03a2209dee11` |
| Generated package | 120 entries; all 117 public files matched the frozen build exactly |
| ZIP SHA-256 | `bfd214bc906411c127781d1ea868c1517b0d8251890dc98328e29527d329eb54` |
| Build manifest SHA-256 | `06cc87c9525f23e190a44c421585b65bb2ec1578a4bfc4b4fe0a23e86957671f` |
| Private vault deployment | `21cb5045-e6ab-49f5-ae9d-f378d38f847c` |
| Private vault version | `eefca083-89af-47c1-8c3c-583d06988624` |
| Vault source SHA-256 | `ceb946c3843235c903b461488bef7dd6a5da7ba9d7b1e33c6e35c7039e75900e` |
| Vault code etag | `a598c63657472805fd13a3be87534a4463808de94cece5d4055ee5e98d07664c` |

The reviewed vault code was installed before the additive `SUPABASE_WALKTHROUGH_KEY` secret. Secret provisioning created the final deployment/version above; the code etag remained unchanged. The selected legacy service-role credential passed the frozen reader's exact header-format probe with HTTP 200 and null for an unknown capability. Only the private vault received this secret. No credential value is in Pages, client assets or this record.

Both shared-session flags remain true. The existing `ADVISOR_SESSIONS` namespace `a0a5b089755842dc8c6a62b4f164865b`, session-key binding, `AdvisorSessionObject` SQLite class/export and prior bindings were preserved. The sole binding addition is the walkthrough-reader secret. No namespace/storage migration or key replacement occurred. Private workers.dev, preview URLs, routes and domains remain disabled. Fresh version-specific readbacks independently confirmed the exact SQLite export and current module bytes against the frozen SHA-256. A newer Worker readback confirmed observability, logs and traces disabled. Some disabled observability subsettings normalized differently from the upload acknowledgement, so byte-for-byte subfield equality is not claimed. The older settings endpoint can omit those fields; omission alone is not proof. Retained acknowledgements remain provenance evidence.

| Edge function | Actual deployed version | JWT verification |
| --- | ---: | --- |
| `concierge-operations` | 6 | true |
| `concierge-payments` | 4 | true |
| `concierge-checkins` | 4 | true |
| `concierge-admission` | 2 | true |

The four frozen source closures were deployed and verified. Only these two forward migrations were applied; all 76 prior ledger entries and historical source/server aliases were preserved, producing 78 entries:

| Canonical source | Source SHA-256 | Actual hosted version |
| --- | --- | --- |
| `20261025221028_concierge_service_workflows.sql` | `5ebb75645abb8e1002a5a3c7bbc64e53b4bfe7e325a2dd63819ebd6d82671eec` | `20261026002240` |
| `20261025221043_concierge_private_walkthroughs.sql` | `035fd8fa49b3c9ca0314769d24c72e61b83a3d883189588df90966e2f7c2f394` | `20261026002305` |

Four approved private current versions were imported into a separate walkthrough namespace. Exactly two founder walkthrough grants were installed after matching the existing identity map and live permissions. The user subsequently authorized a separate Codex maintenance-advisor account and explicit grant. The three authorized principals are two human founders plus this maintenance advisor, which has no client-admission permission and establishes no founder status or skincare expertise. Existing founder credentials, sessions and grants were untouched. Live client case heads were unchanged. The four current private versions have never been shared. Anonymous acceptance used one neutral immutable synthetic version attached to an approved authoring case without changing its current-version pointer, plus two owned test grants: one expired and the other was revoked. Maintenance-advisor acceptance created one further grant for that same neutral version, verified exact-request retry and revoked it. Zero active share grants remain. No fifth case, customer Auth account or immutable-data cleanup bypass was created.

Hosted public verification passed all 117 exact static files and 13 browser scenarios at 320, 390, 768 and 1440 pixels. Guided Maya and ordinary Alex/Maya behavior, shared typography/buttons, history/reload/navigation, generic unavailable responses and absence of account cookies passed. Actual anonymous guest checks passed valid access to the exact synthetic projection, expired/unknown/malformed generic denial, denial on five production write surfaces, two-context isolation, navigation/history and focus reauthorization that cleared an already-open viewer after revocation. Expiry was observed after the grant had expired; a valid-to-expired transition was not exercised. No limiter bypass was used.

The dedicated maintenance advisor passed ten hosted checks using genuine own-account password Auth and the supported verified advisor-cookie upgrade. The correct identity and four-current-version library were checked; all four actual private plans opened through authenticated UI, with one different width per case (320, 390, 768 and 1440 pixels). Client admission was disabled and Add client absent. Missing-CSRF sharing was denied; Create, exact-request retry and Revoke passed through the authenticated management API for the neutral version. The guest request from that browser omitted account authority and read the exact immutable version; revocation then produced 404. An advisor cookie on the client API returned 401, proving audience denial, not positive client-owner acceptance. One conversation review was recorded through the Service UI on the retained synthetic client without a client form; server-supplied authorship and separate advisor-only notes passed. This created one synthetic service head/review, with zero real-human record writes. The account signed out through normal local-scope logout; its credentials remain private for later authorized maintenance. There were zero errors, unexpected egress or login emails.

Ordinary authenticated client-owner acceptance was not run. Actual founder personal sign-in was not rerun or impersonated. No login bypass or password reset was used. Hosted instruction-revision, return and cancellation write journeys were not run; their native/local tests and deployed SQL/source are the evidence. An unusually long neutral fixture title overlapped metadata at 1440 pixels, so the guest result is not an unrestricted visual-polish signoff. No real money, order, retailer action or external message occurred. All three source CI jobs were green at `44c3d371`; the later documentation checkpoint has its own CI boundary.

Retain compatible readers, cancellation guards, instruction/review/financial history and pending administration during recovery. Disable affected new writes/sharing and use a reviewed forward fix; do not remove migrations, delete immutable history or restore a legacy-only reader. Private activation, migration, public-byte/browser and guest receipts remain outside Git. The [implementation handoff](handoffs/2026-10-25-walkthroughs-service.md) records the continuation boundary.

## Historical completion release, 24 October 2026 America/Chicago

The following record is preserved from the prior release. Its deployment identities, ledger count, test counts and login-email history apply to that release and do not describe the current activation.

Owner: Kanuj
Verified: 25 October 2026 UTC, 24 October in Chicago
Status: deployed and hosted acceptance passed

The human-led concierge portal is live at https://portal.goshelv.com. [Draft PR 206](https://github.com/KanujVerma/shelv/pull/206) preserves its complete source. The agreed scope is implemented, deployed and verified; no Git merge was requested or performed. [Acceptance](PORTAL_ACCEPTANCE.md) owns product decisions and local checks; [founder operations](CONCIERGE_FOUNDER_OPERATIONS.md) owns the repeatable human process.

## Deployment and source mapping

| Component | Verified identity |
| --- | --- |
| Deployed application source | [66f7a22510a9a6ac7753ce98e080325e83024552](https://github.com/KanujVerma/shelv/commit/66f7a22510a9a6ac7753ce98e080325e83024552) |
| Published operational correction | [2663e9765d379019ab5c9f0e13a0c6087456f19a](https://github.com/KanujVerma/shelv/commit/2663e9765d379019ab5c9f0e13a0c6087456f19a); application bytes unchanged |
| Production Pages | cf09be80-48bf-4b7a-99b2-fb17e0de15ae, deployed 03:18:23 UTC |
| Immutable Pages origin | https://cf09be80.goshelv-portal.pages.dev |
| Generated package | 106 entries, 104 public assets; all 104 served files matched the reviewed SHA256/size inventory |
| Package SHA256 | 29d36c1c80026e3019b70e923f8041c8cc0d58efafc592adbeaaebb908c2152a |
| Combined gateway SHA256 | e490a8439422aee0a0d0eebcf4d2c74f2cc111075615604835194ae91fd0da03 |
| Private vault deployment | 409a1418-3a6c-49e1-9f83-53b32a58b834 |
| Private vault version | c2d75fda-74e5-4efe-8a5e-37ce5b1b7b8a, 100 percent |
| Vault bundle SHA256 | f948c138ab3eaf9757231880b130d94176e827dd04b11869fc33f6581c54785c |
| Applied vault metadata SHA256 | cb27b77636724bc1517d16c63ea15fb12e890fbf68c6ee069334e1136b99f5c3 |

Both shared-session flags remain true. The existing namespace, AdvisorSessionObject SQLite class, every installed binding and the existing session-key binding were preserved. No key value was read/replaced and no namespace/storage migration was performed. Workers.dev, preview URLs and public vault routes remain disabled. The upload explicitly acknowledged disabled logs, traces and issues; the settings GET omits its observability object, so that omission is not itself asserted as proof.

Cloudflare rejected the original omission of the already provisioned class declaration. The corrected upload echoed only the exact existing declaration. Every returned reconciliation-effect array was empty. The published preparation guard now requires that exact existing declaration and rejects class, storage or tombstone drift before producing output.

| Edge function | Deployed version | JWT verification | Runtime source coverage |
| --- | ---: | --- | --- |
| concierge-operations | 5 | true | 16/16 runtime files match |
| concierge-payments | 3 | true | 13/13 runtime files match |
| concierge-checkins | 3 | true | 11/11 runtime files match |
| concierge-admission | 1 | true | 7/7 runtime files match |

The embedded reviewed capsule SHA256 is c54497e67e320d031c77e40946051a152a03d6631c7ae410b4c3ffafe80e35d8. TypeScript transpilation proves that omitted get-source entries are only erased type dependencies, declarations and license companions. No required runtime module is missing, changed or unexpected.

## Installed migration mapping

The existing 72-row hosted ledger was preserved. Only four new source changes were installed, through the supported provider tool. The three exact pre-existing SQL restorations and historical aliases were not reapplied or repaired.

| Canonical source | Actual hosted ledger version |
| --- | --- |
| 20261024230528_concierge_founder_admission.sql | 20261025030725 |
| 20261024230829_concierge_checkin_replies.sql | 20261025030747 |
| 20261024234059_concierge_manual_payment_methods.sql | 20261025030748 |
| 20261025011331_concierge_no_current_products.sql | 20261025031419, guard-only registration after committed DDL |

The no-products source committed before the provider's ledger insert collided with the preceding timestamp. It was not blindly reapplied. All eight affected live function bodies, signatures, settings and effective privileges matched the tested local final-50 database. The reviewed registration guard then added one ledger row; the prior 75 rows and all eight function bindings were unchanged. The final ledger count is 76. [Source provenance](PORTAL_SOURCE_PROVENANCE.md) distinguishes the 17,050-byte applied source from the 5,200-byte registration guard and records both hashes. The guard is operational evidence outside the normal migration directory.

## Hosted acceptance

One newly admitted identity was used, with generated consultation, products, image and messages. Every business record is labelled SYNTHETIC DO NOT FULFILL. Kanuj and that new client used their original isolated requesting browser contexts and normal portal email/PKCE login; exactly two emails were sent, with no resend, invitation link, cookie import or Auth-admin login bypass.

| Stage | Verified outcome |
| --- | --- |
| Founder setup | Add client UI established the exact new identity, sent no email, opened an empty case and retained explicit admission authority. Kanuj and Sami's admission permissions are enabled; other existing capabilities stay intact. |
| New client | Normal owned login verified the exact identity, with no provider credentials left in browser storage or callback URL. Empty plan/routine was shown. |
| No-product consultation | Explicit confirmed-none intake saved without a placeholder product or invented water-wash step. Original product-baseline count remains zero. |
| Publication and money gates | Two publications and three simulated gross confirmations: service 10000 cents, products 1399 and 1499 cents. All are synthetic bookkeeping, not actual receipts or revenue. |
| Methods | Each quote froze all three receiving options. Zelle, Cash App and Apple Cash were selected and confirmed in separate synthetic payment flows. All nine option snapshots remain bound to their original quotes. |
| Receipt and Start | Approval, payment and receipt kept the old routine active. Two actual client UI Record start actions switched none to A, then A to B. Both used local date 2026-10-24 while the UTC date was October 25. |
| Routine history | Two starts and receipts, two immutable publications; v1 retains confirmed-none/zero baseline steps. v2 captures A's exact activation source as its authoring basis. |
| Check-in and private media | Actual client photo-upload/report UI created one generated photo and one report. Fresh private views loaded for both client and advisor. Views expire after their short lifetime and must be reopened. |
| Feedback and privacy | One written public reply was visible to the client; one private note and the private canary were absent from the client response and rendered UI. Wrong-authority/owner requests were rejected. |
| Logout and preservation | Both owned browser sessions signed out through normal local-scope portal logout. All nine baseline provider sessions, ten baseline refresh rows and other clients' business heads were unchanged. |
| Internal provider session | The first OTP also created one inaccessible internal provider session under current autoconfirm behavior. After separate explicit approval, only that new synthetic session was expired and its one refresh token revoked. Zero active synthetic sessions or usable refresh rows remain; no global logout or record deletion occurred. |
| Live samples | Independent actual Alex/Maya previews passed: service-only $100 quotes, method logos/selectors, comparisons and ingredient dialogs. Sampled Maya mobile views at 390 by 844 were clean. The separate local 54-state audit covers 320, 390 and 1440 widths. |

Two internal synthetic product orders retain the ordinary ready-to-purchase state as test history. Their client, product and nondeliverable shipping labels explicitly say DO NOT FULFILL; the exact private fixture registry excludes both quotes from purchasing or shipping. No actual funds, vendor order, shipment or refund occurred.

Sami's identity and full capability configuration were checked, but his personal sign-in was not exercised because a private inbox reader was unavailable. No email was sent to him. Actual runtime acceptance used Kanuj and the new client. Payment-provider merchant eligibility and real money transfer are separate from these founder-configured manual instructions.

## Verification and recoverability

All independent feature, integration, fixture and final tooling reviews pass. Exact-head CI passed at both application commit 66f7a225 and operational correction 2663e976: Verify and Build, Database and Integration, and Portal build/local journeys. The final existing-export guard suite passes 47/47; the full local evidence matrix is in acceptance.

Private finite evidence includes source/asset inventories, provider acknowledgements, migration attempts and mappings, runtime import coverage, guarded browser checkpoints, nine final SQL readbacks, protected screenshots, logout comparison and approved internal-session cleanup. Credentials, callback links, raw receiving evidence and detailed private business notes are excluded from Git. The original dirty checkout and source archives remain preserved.

Once V2 financial, explicit-none or written-reply data exists, retain compatible readers during recovery. Disable affected new writes/options and use a reviewed forward fix if needed; do not restore an old Zelle-only reader, delete history, invent historical recipients or turn shared-session flags off. [Release plan](PORTAL_RELEASE_PLAN.md) and provenance retain the original baseline and the bounded rollout history.
