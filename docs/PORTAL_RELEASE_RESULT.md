# Portal release result

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
