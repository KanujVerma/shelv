# Portal completion handoff

Owner: Kanuj
Date: 24 October 2026, final local candidate
Branch: codex/portal-completion-20261024
Base commit: 33e90b0208f8a84ba1fbcd4aef788a26cf378bc6
Workspace: /Users/kanuj/Documents/projects/shelv/.worktrees/portal-completion-20261024

## Goal and current boundary

Finish the human-led Shelv portal end to end for a polished referral-partner demo. The Codex goal is active. Objective: /Users/kanuj/.codex/attachments/1831f31e-533a-44fe-b5e4-386fd6e19c9d/goal-objective.md.

All implementation, local acceptance and independent code reviews pass. The release package is prepared. The pre-approval checkpoint recorded no commit, push, merge, deployment, live migration, capability grant, payment-method activation or hosted email. The user has now approved the bounded release scope with ‘u have approval go’. Publication and production execution are pending at this authorization checkpoint; Git merge is not included. Next action is approved publication/deployment and a fresh synthetic hosted journey. Do not report the new release as live.

## Canonical records

- [Acceptance](../PORTAL_ACCEPTANCE.md): current decisions, test counts and production acceptance boundary.
- [Source provenance](../PORTAL_SOURCE_PROVENANCE.md): preservation/import identities, installed migration restoration, pending migrations and frozen package identities.
- [Release plan](../PORTAL_RELEASE_PLAN.md): exact proposed writes, ordering, action-time verification and rollback limits.
- [Founder operations](../CONCIERGE_FOUNDER_OPERATIONS.md): admission, consultation, publication, actual receipt verification, procurement, explicit Start, check-ins and manual refunds.
- [Public pilot framing](../PORTAL_PILOT_EVIDENCE.md): approved public story. Detailed business evidence stays in ignored private storage and must never be staged in this public repository.

## Completed features

Founder-managed Add client uses a separate can_admit_clients permission, a stable reserved UUID/journal, service-only Auth administration, safe duplicate/retry handling and client-owned normal login. Identity creation sends no email and does not reset an existing account. Late directory success/failure cannot erase unsaved consultation text.

Written replies have server-owned author/time and append-only identity, render as plain text, preserve private-note isolation and handle uncertain acknowledgement/conflict/session expiry. Calls/messages remain the normal communication channel; no chat or automatic reply notification was added.

Manual Zelle, Cash App and Apple Cash use immutable quote/method/recipient snapshots and versioned evidence, claim and confirmation wrappers around the existing settlement core. Cross-version UUID retries/collisions are fenced. Gross receipt must be confirmed by a founder. Refund guidance honors dissatisfaction during the first three months for service fees actually paid; products are separate. No automatic transfer, refund ledger or cancellation was added.

Explicit no-current-products authoring distinguishes none from unknown. No placeholder step is created. None-to-A-to-B plans derive from the active routine with immutable activation history, stale-basis conflict and explicit recovery. Recommendations, payment and receipt do not activate a replacement. Start uses a visible local-device date without changing old server replay behavior.

Alex and Maya share comparison, ingredient, payment, routine and photo behavior while retaining distinct actual content. Preview quotes reflect only approved products and preserve settled history. Payment brand assets have recorded source provenance. Visual/mobile acceptance and the aligned Remember me control are covered by the acceptance record.

## Final verification

- All 50 migrations replayed; 31 pgTAP files and 701 assertions pass.
- Root unit suite: 1,188 total, 1,170 pass, zero failures, 18 explicit opt-in skips. Finance seven, empty-routine six and written-reply three native SQL checks ran separately enabled; two historical SQL opt-ins remain unclaimed.
- Portal suite 95/95 and session runtime suite 141/141 passed at application freeze. The latest release-tooling fix has 39/39 focused passes, including four added rejection cases. These scopes overlap and must not be added together.
- Backend suite 40/40 uses the recovered canonical shared preview request factory. App/test types and Expo web export pass.
- Final local Auth/PostgREST/SQL/Chrome fixture passes 15 checks on fresh and 15 on retained final-50 resources; incompatible snapshots/ledgers are rejected before acceptance. Independent fixture review passes.
- Admission, replies, manual methods, empty routine, root integration, final application and final release-tooling specification/quality reviews all PASS with no open findings.
- Earlier root native admission against the Expo code-only email configuration failed at link extraction. Its retained evidence is not a portal pass. The dedicated portal fixture subsequently passed without altering Expo settings.

Evidence is ignored under .local-artifacts/portal-completion, admission-auth, no-current-products and reviews. Final application report: .local-artifacts/reviews/final-integration/REPORT.md. Final tooling report: .local-artifacts/reviews/release-tooling/REPORT.md.

## Frozen candidate and provider baseline

- Build: .local-artifacts/portal-build/BUILD-MANIFEST.json, SHA256 0553fa9022e8a505b7f3ca978fe1bf09c24e821301e5e5ca6ea4d6693f444d74.
- Generated 106-asset ZIP: 29d36c1c80026e3019b70e923f8041c8cc0d58efafc592adbeaaebb908c2152a.
- Generated gateway: e490a8439422aee0a0d0eebcf4d2c74f2cc111075615604835194ae91fd0da03.
- Private vault bundle: f948c138ab3eaf9757231880b130d94176e827dd04b11869fc33f6581c54785c.
- Four-function embedded capsule: c54497e67e320d031c77e40946051a152a03d6631c7ae410b4c3ffafe80e35d8; aggregate a9fe81c99ea9e45735a2502bc17a3f02ffbd17d66d30ce822155aa3aa8538f4b. All four verify_jwt policies are true. Forty unique static ESM source files, no external imports.
- Preparation receipt: .local-artifacts/release-preparation/final-20261025T024331/RELEASE-PREPARATION.json, SHA256 a70ea09443d8c93b71749bd56ab62ed35d707147fb020c5e94109f50bc6d0698. Zero provider calls/writes. Read-only Cloudflare observation 2026-10-25T02:43:31.812Z matches baseline. Observation expires after 30 minutes and must be refreshed before execution. Cloudflare omits observability settings; absence is not proof of disabled collection. The approved upload must explicitly disable it and verify the result.
- Pages baseline: 13339bb7-3fd1-41df-af16-2735cce52cfb, pinned 99-file ZIP 3f6ecf472d8c8142754cf99df5b175b734c45d50d1861a23519fd4b5bb173595.
- Vault deployed/version: b455619b-8773-4a45-b868-f799818f7bff / 2508f5b8-10b3-4cd9-9a61-db9b158bc957, 100 percent. Namespace a0a5b089755842dc8c6a62b4f164865b and AdvisorSessionObject unchanged. Preserve ADVISOR_SESSION_KEYS without reading/replacing it.
- Both CLIENT_SHARED_SESSIONS and ADVISOR_SHARED_SESSIONS remain true. Historical false-flag runtime configs must never be deployed. Upload the generated combined gateway, not raw site/_worker.js.

Supabase snojlbqovlawewwqbviz has 72 live ledger entries. Three already installed exact live SQL statements were restored locally; they are not pending writes. Only four new files are pending: founder admission 20261024230528, written replies 20261024230829, manual methods 20261024234059 and no-current-products 20261025011331. The supported apply API assigns server versions; record filename/hash to actual version after each apply. Never blanket db push or repair historical ledger aliases. The release plan owns exact hashes and order.

## Preservation and environment

The original checkout /Users/kanuj/Documents/projects/shelv remains dirty on kanuj/saved-sheet-canonical-integration at 5d43559fa6ac6250938aee17712ed3a095d83cbf. Do not reset, clean, wholesale stash, overwrite or stage its unrelated files. Private backup: /Users/kanuj/Documents/projects/shelv/.local-backups/portal-completion-20261024-225844-20ae6c7f. The 303-file baseline import was verified against the preservation map. Source under the ChatGPT project mirror's sources directory is read-only.

This fallback worktree is Git-managed but not Codex-managed; native creation/attachment failed because the initial mirror is not a repository and the fallback is unmanaged. Use the explicit worktree path; do not archive it with a managed-worktree tool or delete it.

Use Node /Users/kanuj/.nvm/versions/node/v22.23.0/bin. Root and apps/portal dependencies are independently installed. Default shell Node20 does not support required strip-types execution.

Task-owned Colima profile shelv-portal-20261024 runs with activation disabled, two CPUs and 3 GiB; default Docker context is unchanged. Root derive DB/Auth/PostgREST/Kong/mail containers remain on 543xx ports. Dedicated owned 573xx/574xx admission fixtures are stopped with volumes retained. Do not erase earlier volumes or stop unrelated profiles. Use DOCKER_HOST=unix:///Users/kanuj/.colima/shelv-portal-20261024/docker.sock and task-only DOCKER_CONFIG=.local-artifacts/portal-completion/docker-config. Do not print local status keys. Colima initially lacked a worktree mount; 31 SQL tests were staged hash-verified into the VM at the same absolute path. Restage if those SQL tests change.

Local source preview on 127.0.0.1:43159 is a task-owned Python server, session48527. It serves synthetic preview state only. CUA tabs may include the original public illustrative portal, this local candidate and the live landing page; inspect current state before interacting. After compaction, reload CUA documentation before using retained handles.

## Coordination and next action

All subagents use explicitly requested gpt-6.1-sol with xhigh reasoning. Capacity is three subagents plus root, not proof that three are currently active. Use live agent status for concurrency claims. Owners: source_reconciliation for release source/docs; client_journey for shared payments; founder_operations for admission/fixture; empty_routine for empty/current-routine lifecycle; independent reviewers remain available. Avoid duplicate implementers or shared-file simultaneous writers.

Product questions are answered. Preserve calls/messages, manual methods and explicit Start. Do not introduce provider account setup, Apple Pay, self-service intake, automatic refund/cancellation, invented personalization or referral rates. Public landing-page source is not available; its live current content was inspected. Detailed private cohort evidence is excluded from Git.

The user approved the reviewed release plan for publication and named production/test writes. Execute that scoped plan, attach the draft PR, record actual deployment/commit and migration/version mappings, run the fresh hosted journey and clean only the test's own sessions. Do not merge without separate explicit authorization. No real funds, fulfillment or real-client edits. Mark the goal complete only after the intended end-to-end result is actually verified; approval waiting alone is not completion.
