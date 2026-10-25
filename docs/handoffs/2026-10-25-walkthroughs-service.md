# Walkthroughs and service workflow handoff

Owner: Kanuj. Date: 25 October 2026, America/Chicago.

Implementation branch: `codex/walkthroughs-service-20261025`. Base: `45c5112cb5c7c420b38e965804933a3986050743`, stacked on draft PRs [206](https://github.com/KanujVerma/shelv/pull/206) and [207](https://github.com/KanujVerma/shelv/pull/207). The implementation revision is the scoped draft PR's head. This work does not merge either dependency or authorize deployment.

[Founder operations](../CONCIERGE_FOUNDER_OPERATIONS.md) remains the single operating-policy record. [Acceptance](../PORTAL_ACCEPTANCE.md) owns current local checks; [release result](../PORTAL_RELEASE_RESULT.md) owns the earlier hosted release. Private authoring inputs, consultation research, case payloads, grants and screenshots are intentionally outside public Git.

## Delivered candidate

- `/maya/?guided=1` provides a short guided journey and free exploration. Ordinary `/maya/` and Alex continue using their existing public sample behavior. End actions use the existing support destination, which returned HTTP 200 during this task.
- Authenticated advisor dashboard → **Walkthroughs** opens the four private client-style journeys. They are separate from live clients and metrics. Each uses the real client renderer and per-viewer local adapters. Product reasoning, an interim question, a review conversation, a recorded decision and next step are populated. No new historical improvement or transaction is established.
- **Create share link** issues an explicit immutable-version capability. Default expiry is 30 days; **Revoke** stops subsequent protected reads, including an already-open viewer's next read/resume. A new version requires a new link. Plaintext secrets are returned only through the creator's local link UI and are never stored by the server. Authorization denial clears sharing state; uncertain transport retries retain the exact pending request.
- Production command and schema paths implement advisor-origin reviews without a client form, instruction drafts and explicit publication with source/Start history, actual purchase records and item-specific return administration, cancellation and current final-plan download. Status entry never moves money or calls a retailer. Care editing closes at support end while authorized purchase/return administration survives.

The separate follow-up decisions are comfort and shaving-layer clarification; keeping an unidentified OTC product paused while using a completed basic routine; sunscreen replacement/order clarification while preserving its actual-use date; and simplifying existing basics without a new purchase or an unauthorized return. Provenance remains private and the client views use ordinary language.

## Local verification

- Root unit checks: 1,174 passed, zero failures, 18 explicit opt-in skips, 1,192 total. App and test typechecks passed. Expo web export passed. No native/mobile runtime was changed, so signed-device/iOS acceptance was not applicable.
- Final complete portal suite: 220 passed, zero failures or skips. This includes the package-marker, loading-placeholder, current-guide and authorization-modal regressions. Exact-head CI remains the public revision gate.
- Session runtime: 142 passed. Backend contracts: 40 passed. Session types and actual package verification passed after correcting a scanner that confused a bare key-prefix validator with embedded key material. The scanner still rejects full key-like values and synthetic credentials without printing them.
- Native SQL suite: 12 preview, 15 service and 12 sharing tests passed. Separate full local replay/reset used all 52 canonical migrations; all 31 pgTAP files and 701 assertions passed. The local admission Auth/SQL/PostgREST/Chrome journey passed 15 checks, and the final service/sharing source-handler/provider/gateway smoke passed 16 checks.
- Four private journeys: all 29 stages validate. Sixteen full browser journeys passed at 320, 390, 768 and 1440 pixels, including refresh, Restart, Explore, no-payment views and revoked access. Zero page errors, unexpected external requests or page overflow. Guided Maya passed the same four widths. Individual viewer instances and existing account transport remain separate.
- Independent sharing, service and content reviews found issues which were corrected and passed scoped re-review: management of older active grants, fragment-preserving navigation, denial cleanup, final export stop advice, post-cancellation administration, financial-only permissions, Chicago dates, refund remainder cents and private provenance separation.

The default root opt-in skips are not reported as executed unit cases. Relevant new database, handler, browser and full pgTAP gates ran separately. Hosted advisor/client acceptance for this new release has not run. Local grants and auth records were synthetic; no real email, money, order, customer record or hosted permission changed.

## Review package and activation boundary

The ignored `.local-artifacts/portal-build/` contains the combined static/gateway ZIP, compiled private vault and `BUILD-MANIFEST.json`. The ignored `.local-artifacts/walkthroughs/release-delivery/` binds that exact build, both forward SQL hashes, target descriptor, sanitized hosting readback, exact-version installed-vault receipts and all four embedded Edge closures. Preparation performs zero provider calls/writes and sets deployment readiness false. The final 120-asset ZIP SHA-256 is `6112ea033a20018e50f30373fc5c146a0f85618319b3718eb96198fb8590888d`; the private-vault bundle SHA-256 is `ceb946c3843235c903b461488bef7dd6a5da7ba9d7b1e33c6e35c7039e75900e`.

Use the explicit `--target walkthroughs` release preparer. The historical target is preserved and rejects the new three-route package. Keep both `/api/client/*` and `/api/advisor/*` while adding only `/api/walkthroughs/*`. Preserve the existing namespace, session key, SQLite class/export and all prior source/server migration mappings. Never blanket-push or repair historical migration aliases.

New forward sources:

| Source | SHA-256 |
| --- | --- |
| `20261025221028_concierge_service_workflows.sql` | `5ebb75645abb8e1002a5a3c7bbc64e53b4bfe7e325a2dd63819ebd6d82671eec` |
| `20261025221043_concierge_private_walkthroughs.sql` | `035fd8fa49b3c9ca0314769d24c72e61b83a3d883189588df90966e2f7c2f394` |

The actual four inputs live under the ignored `.local-artifacts/walkthroughs/private/` and canonical private store. The repeatable import CLI takes `--input PATH` or stdin and `--store PRIVATE_DIRECTORY`. The canonical store has zero initial grants. Private browser runs use a separate temporary local store; no hosted grant or link was issued.

After explicit deployment approval, refresh the read-only provider state, compare the reviewed package and hashes, then apply only the two forward migrations and record actual server versions. Provision the additive `SUPABASE_WALKTHROUGH_KEY` only in the private vault, with no key in Pages or client assets. Install explicit current founder walkthrough view/share grants after checking actual identities and existing capabilities; do not infer IDs or use editable metadata. Deploy the reviewed Edge closures with JWT verification retained, compatible private vault and combined Pages package, then privately import the reviewed four sanitized versions with zero grants. Complete separate hosted synthetic advisor/anonymous/share/expired/revoked acceptance before claiming the new URLs live. The founder creates a real link later when desired.

If recovery is needed after new data, disable affected new writes/sharing and preserve compatible readers, instruction/review/financial history, cancellation guards and pending administration. Do not revert to a legacy-only reader, remove migrations or drop data to make rollback convenient.

## Current hosted provenance

Read-only checks during this task found Pages `cf09be80-48bf-4b7a-99b2-fb17e0de15ae` and private-vault deployment `409a1418-3a6c-49e1-9f83-53b32a58b834`, version `c2d75fda-74e5-4efe-8a5e-37ce5b1b7b8a`. They remain the prior release. Both shared-session flags are true, the existing namespace is retained, private workers.dev/previews/routes/domains are disabled, and all four installed concierge functions retain JWT verification. The new guest-reader key was absent.

Cloudflare GET omits declarative exports and observability. The preparer couples retained acknowledged upload metadata/result bytes to the fresh exact version and script etag; it labels that evidence source instead of inventing GET fields. Revalidate hosting state immediately before each approved write.
