# W7 independent backend fix review, round 2

Owner: Kanuj. Review date: 30 October 2026. This reviews the bounded W1 response to [the complete original backend review](W7_BACKEND_REVIEW.md). It does not accept the unfinished advisor/UI projections or the final portal.

## Scoped verdicts

- **Specification compliance: FAIL pending R2-1 and R2-2.** The seven specific original defects are addressed, but the changed receipt and check-in guards still allow authority to expire during a lock wait. These are important P2 findings against D16/D19/D22/D38/D40 and the frozen contract's current authorization and after-wait checks.
- **Code quality/correctness: FAIL pending R2-1 and R2-2.** All 43 committed native cases pass. Independent additional reproductions nevertheless return a private receipt after session/task expiry and commit a care report after session expiry or confirmed support end. Passing tests and the author's responses do not close these findings.
- No critical/high severity finding, exhaustive security certification, genuine Auth acceptance, final portal acceptance or release approval is asserted. The parent should allocate both findings for fixes and a new review; neither is silently deferred.

## Exact source, scope and runtime

| Item | Independently observed value |
| --- | --- |
| Workspace | `/Users/kanuj/.t3/worktrees/shelv/t3-9735aa5b` |
| Branch | `t3/backend-review-round-two` |
| Reviewed application HEAD | `85267500b68f85039c344243623af4418420cbbb` |
| Fix range | `ba3fabbfbbb5b161fa416a06fd7c278534d8609b..371c42531902b20e302f6dddd2062549493a868b` |
| Integrated fix | `3baa87c07a0c8b00651e7e460d8dae992b80f25f` |
| Original review/source | `129635e88f91e9539973062a60779f717f2a935a`; original backend `a7f4f36591a7965bcaa1ca3899c82f9b84fabe0c..d6840ac8eae9be314ab7f1466e5f4373c308391b` |
| Supplied patch | `/Users/kanuj/.t3/worktrees/shelv/kanuj-portal-rebuild-integration-20261030/.local-artifacts/portal-rebuild/W1-fix-review.patch` |
| Patch SHA-256 | `18514833adc044504b8b35a28f1a61bf7da08683eeffe5707688877f9cc10fb0` |
| Patch/source verification | Exact bytes equal `git diff -U10 ba3fabb..371c425`; reverse application check passes; all nine changed paths have identical `371c425` and reviewed HEAD blob IDs |
| Additional shared-plan delta | Only non-null TypeScript indexing annotations in `PortalRebuildMapping.ts` relative to the fix head; no guard/compiler option relaxed |
| Model/runtime | Live T3 `orchestrator_capabilities({search:'gpt-6.1-sol'})` and `t3_thread_configuration({})`: provider `codex`, model `gpt-6.1-sol`, `reasoningEffort=xhigh`, `serviceTier=default`, full-access/default |
| Task identity | `portal-rebuild-w7-backend-review-20261030-r2`, final component of the returned delegated-thread ID |
| Node / PostgreSQL | Explicit Node `/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node`, `v22.23.0`; explicit `/opt/homebrew/opt/postgresql@15/bin`, PostgreSQL 15.19 Homebrew |
| Git freshness | Initially clean; `git fetch origin` succeeded; `origin/main=d39a7d4943209080df7c4cf97d85784f462758bf`; `HEAD...origin/main` = `39 0` |

Read the original W7 report **in full**, [W1 fixes](W1_FIXES.md), [original W1 implementation](W1_IMPLEMENTATION.md), rebuild entry point, D01-D48, full desktop specification, [PLAN_API_V1](../PLAN_API_V1.md), implementation contracts, workstreams/current status and applicable root/portal instructions. The optional adoption refinement is assessed against the explicit fix brief and its strict documented seam; it does not authorize another action/RPC.

Inspected all nine fix paths: the three contract/type/parser/value files, the entire affected migration logic, canonical pgTAP source, domain test, both native suites and W1 response. Followed supporting receipt/source/session/task/legacy conversion, old service/check-in/payment and actual handler/gateway call chains. Reviewed the original 29 tests and new 14 tests for their assertions and fixture assumptions. The two new adoption tables are private, RLS-enabled and update-immutable; no principal/owner/source/task seed was added. The candidate source has 54 canonical migrations; this native lane replays 15 concierge prerequisites plus the allocated 54th migration, not the full canonical stack.

## Original finding dispositions

**These dispositions apply to the original concrete defects. They do not certify the surrounding fixes:** R2-1 and R2-2 below remain independent acceptance blockers in those changed paths.

| Original finding | Verdict | Fresh source/runtime evidence |
| --- | --- | --- |
| F1, human source-revoked cached save/status | **ADDRESSED** | New `plan_request_authorize`, migration lines 317-330, validates the stored DraftView content against its stored/original client scope and exact grant. New tests remove/replace the current body's source, reassign the current draft and then revoke the old human permission: replay/status deny without the private canary. Deactivated/version-changed sources return `source_conflict`; historical receipt JSON remains unchanged. Legitimate unassigned-to-assigned retry still succeeds. Revoked agent grant denies. Fresh non-owner section-review returns also check content. R2-1 identifies the separate missing final expiry check. |
| F2, expired care via ServiceAdminRead | **ADDRESSED** | `plan_care_window` and wrapped service projection, lines 224-239 and 703-725, remove both review and instruction canaries at support-end +30/+31 while +29 remains readable. Order/return IDs and cancellation remain available. Ended-session administrative read denies. Check-in read/photo authorization deny at the exclusive cutoff; the two-connection history-read case denies after session expiry. Advisor care history still requires actual advisor/principal authority. R2-2 identifies the newly guarded writes' remaining after-wait gap. |
| F3, fields absent from all section hashes | **ADDRESSED** | `plan_section_hash`, lines 180-184: preparation maps to context; consultation sections enter all section dependencies; top-level routine guides map to routine. Existing bodies plus context/products/goals/title/summary/source manifest/basis cover the remaining fields. The new test changes each of the 12 mutable published root fields independently and observes invalidation, with routine-guide edits preserving follow-up. Funding preserves section reviews; original exact-target/payment tests pass. |
| F4, two editable legacy/new drafts | **ADDRESSED** | Assignment/adoption lines 421-442; single-authoring triggers 580-591; legacy save fence 639-648. Ordinary assignment with legacy work returns safe `409 legacy_draft_conflict`. Explicit human adoption requires an exactly empty unassigned body and current case revision. Nonempty manual work and old legacy bytes survive; rich guidance and private notes transfer without becoming client content. Legacy writes freeze before V3 publication. Concurrent save/adoption yields one winner. Additional independent SQL/handler negatives deny malformed/null/out-of-range options and agent adoption without effects. Adopted origin cannot move to another client. |
| F5, blank proposed-product directions | **ADDRESSED** | Readiness line 210 uses `trim_text` on every entry for all four relevant kinds, with incomplete storage retained. The new test covers no entries, empty string, ASCII/Unicode whitespace and mixed valid/blank entries through direct SQL and actual handler approval/publication. Every invalid publication leaves zero publication rows even with fixture-issued approval. Meaningful Unicode-padded nonproduct guidance and `no_addition` still publish without orders/Start. |
| Q1, lawful draft-bound source restore | **ADDRESSED** | Shared source-scope predicate lines 127-133 and restore lines 543-557 check original authority before recording a new immutable reference. Actual-handler restore preserves content/source ID/version/metadata, supports an exact restored-draft agent grant and denies cross-client reassignment/deactivation. Additional probes deny revoked-human restoration without reference creation, deny client-wide grant escalation, retain permission checks on restored content and deny stale-version cached restore. Source enrollment rows are unchanged. |
| Q2, NULL delivery bounds and NULL revision | **ADDRESSED** | Claim/result/retry lines 752-782 explicitly reject required NULLs, bound revisions and compare CAS using `IS DISTINCT FROM`. With 56 queued synthetic email jobs, NULL/0/51 claim none and limit 50 claims exactly 50. NULL result ID/lease/status reject; NULL/stale retry revision, NULL reconciliation and false reconciliation for uncertain delivery leave its row unchanged. Exact valid retry succeeds. Optional provider ID/error remain bounded. Service-only ACLs remain `f/f/t`. |

The section dependency inventory is complete at the field level: `schemaVersion` is fixed to 1; `sources`, `context`, `decisions`, `routine`, `followUp` have section bodies; `title`, `summary`, `consultationSections`, `context`, `products`, `goals` and source/basis manifests are shared dependencies; `preparation` and `routineGuides` have the explicit mappings above. Nested usage/guidance/citations are inside the hashed parent bodies. No mutable published root is omitted. This does not claim every nested leaf received a separate runtime edit test. Finance/delivery state is excluded from section hashes; the payment-only preservation test and original approval-independence test pass.

## R2-1: cached private receipts return after session or task expiry during source reauthorization

**P2, important remaining authorization defect in the changed F1 fix.** [Migration](../../../supabase/migrations/20261030223603_portal_rebuild_plan_v1.sql), lines **320-330**, with direct returns at **356-357** and **400-401**. The new source checks can wait after the last principal/session/grant check. Neither receipt return reaches the main command's final live check.

Independent reproduction `probes.py`, four cases using the actual Edge handler/parser/mapper and persisted authenticated SQL:

1. Save `PRIVATE_REVOKED_FACT_CANARY` under lawful source authority. Retain the request UUID. Save a clean latest draft body so the original private fact exists only in the immutable receipt.
2. For human S, set its synthetic authoritative session `not_after` to +600ms. For agent G, issue a real finite task grant through the public plan command with expiration +2 seconds, save the receipt as G, and leave the grant unchanged thereafter.
3. A second database connection holds `FOR UPDATE` on that source, announces `LOCKED`, waits 1.4 seconds for the human case or 2.8 seconds for the agent case, then commits. No source permission is revoked and no guard is disabled in this final reproduction.
4. Invoke either original save replay or `request_status_v1` while the source is locked. Each waits, then returns **200 with the private canary**, although the authoritative session/grant deadline has passed. Immediately repeating the identical call returns **401 `session_ended`** or **403 `forbidden`**. Stored receipt JSON remains unchanged.

| Case | Observed wait | First response after expiry | Immediate next response |
| --- | --- | --- | --- |
| Human status | 1.421s | 200, private canary | 401 session ended |
| Human save replay | 1.418s | 200, private canary | 401 session ended |
| Agent status | 2.819s | 200, private canary | 403 forbidden |
| Agent save replay | 2.811s | 200, private canary | 403 forbidden |

This is a same-principal expired-authority disclosure, not a demonstrated cross-client read or raw-source download. The final source ACL check fixes the original revocation instance but introduces another potentially waiting step before an early return. Recheck the original operation's exact live session/principal/task authority after those checks and immediately before either cached result is returned. Preserve source authorization against the stored response, immutable receipts and no repeated effects. Add both return paths and natural task/session expiry during a source/permission wait to regression coverage.

## R2-2: newly guarded check-in writes commit after support/session ends while waiting

**P2, important incomplete current-authorization fix.** Same [migration](../../../supabase/migrations/20261030223603_portal_rebuild_plan_v1.sql), **664-670**. The new wrapper checks client session and active care, then immediately returns the legacy writer. Its request/client locks and head-row waits occur afterward. The original writer does not know the new live-session/care-window rules and no final wrapper check rolls back unauthorized effects.

Independent `probes.py` cases, through the actual public `concierge_checkin_write` SQL RPC under the authenticated client role:

1. Publish/fund a normal synthetic plan through the real plan/payment commands. Obtain the actual check-in revision. Prepare a valid `submit_report` request with no photos.
2. A second connection holds the existing `concierge:client:<C>` advisory lock. The client passes the new wrapper guards and waits in the legacy writer.
3. Session case: the synthetic client's actual `auth.sessions.not_after` expires during that wait. **Result: SQL exit 0; one report persisted.** Immediate next call returns `concierge_session_ended`.
4. Care case: the lock holder performs the **real public `concierge_service_write(...,'cancel_service',...)`**, with `kind='early_departure'`, today's Chicago support end and `confirmedWithClient=true`, then commits. This is a valid cancellation command, not backdated fixture-owner cancellation state. The client report resumes afterward: **SQL exit 0; one report persisted; current care state `read_only`**. Immediate next call returns `concierge_forbidden`.

Observed waits: 1.410s and 1.426s. No photo/upload, external notification or genuine Auth request was involved. This demonstrates `submit_report`; the similarly wrapped reserve/complete branches are source-inspected variants, not separately reproduced claims.

The report request began with active care, but the frozen contract requires current authority after waits and at commit. The added precheck is insufficient. Acquire the appropriate existing locks before the live check, and/or retain the legacy result then recheck session and active care before returning so failure rolls the same transaction back. Preserve exact request/revision behavior and administrative access. Add the real cancellation race and session-expiry race as persisted tests. This is in the changed F2 wrapper, not a request to implement the unfinished history/UI feature set.

## Test quality and independently executed checks

The new 14 tests assert meaningful persisted effects/denials rather than replacing the SQL port with a successful stub. Their strongest coverage includes old receipt versus latest-body divergence, unassigned lawful retry, source lifecycle/permission changes, exact legacy CAS and preserved manual work, two-connection adoption serialization, all four decision kinds and publication side-effect absence, lawful source restoration, real catalog ACLs and delivery-row immutability after denied NULL/CAS requests.

Coverage gaps matter: receipt tests revoke authority **before** invoking the command; they do not expire session/task authority during the added source wait. The after-wait regression in the new suite covers a **history read**, not the newly guarded check-in writes. The 29 original tests include expiry after the main client-lock wait and grant revocation, but do not exercise these new early-return locations. Neither suite detects R2-1/R2-2. No test expectation was changed for this review.

All Node commands selected Node 22.23.0 explicitly; native commands also selected the PG15 bin and `PYTHONDONTWRITEBYTECODE=1`. Existing-lockfile `npm ci --ignore-scripts --no-audit --no-fund` ran for root and explicitly `--prefix apps/portal/session-integration/runtime`; no tracked dependency/lockfile changed.

| Command/check | Fresh result |
| --- | --- |
| `python3 tests/portal-rebuild-native.py --prepare` | Exit 0; unchanged helper; historical bytes/dates/payments/Starts preserved and zero seeded principals/owner/grants |
| `python3 tests/portal-rebuild-fixes-native.py` | Exit 0; **14 passed**, zero failures/skips, 28.152s |
| `python3 tests/portal-rebuild-native.py` | Exit 0; **29 passed**, zero failures/skips, 14.282s |
| `node --experimental-strip-types tests/portal-rebuild-domain.test.ts` | Exit 0; **8 passed**, zero failures/skips |
| `node --experimental-strip-types tests/portal-rebuild-handler.test.ts` | Exit 0; **3 passed**, zero failures/skips |
| Runtime esbuild bundle of unchanged `runtime/tests/plan-channel.test.ts`, then `node --test <artifacts>/plan-channel.test.mjs` | Exit 0; **9 passed**, zero failures/skips |
| `npx tsc --noEmit` | Exit 0, zero errors |
| `npm run typecheck:tests` | Exit 0, zero errors |
| `npm --prefix apps/portal/session-integration/runtime run typecheck` | Exit 0, zero errors |
| Export actual `planContentShape` / `planCommandFields`; compare with persisted SQL metadata | Exact equality: complete content and **all 22 commands** |
| Original independent catalog `acl.sql` against the fixed database | Empty RLS-disabled/raw-privilege/private-helper-EXECUTE/unpinned-search-path sets; public plan `f/t/f`, four delivery RPCs `f/f/t` for anon/authenticated/service_role |
| `python3 <artifacts>/probes.py` | Exit 0; **six independent bad-outcome observations**, detailed in R2-1/R2-2. These are defect demonstrations, not acceptance passes |
| `python3 <artifacts>/acceptance-probes.py` | Exit 0; six malformed adoption objects denied by both SQL/handler; agent adoption denied without effects; revoked/non-client-wide/stale-version restore/source authority negatives pass |
| Patch equality/reverse check, nine blob comparisons | Passed |
| `git diff --check`, report links and owned-path check | Passed before report commit; only this report staged |

The gateway's finite safe-code set imports `planErrorStatuses`, so the added `legacy_draft_conflict` remains safe 409 through the retained parser/provider seam; the strict optional adoption object uses the same parser. No new action, RPC, browser delivery command, authority field or permissive result shape was added. Actual SQL/handler tests above exercised the new error and adoption field. Gateway tests use synthetic ports, not real cookie/JWT acceptance.

## Fixture custody, reproduction and retained evidence

Exclusive fixture allocation was honored. Before starting, inspected the actual root/data/socket directory identities, `PG_VERSION=15` and `postmaster.opts`; explicit `pg_ctl -D /tmp/shelv-w1-plan-pg/data status` returned **no server running**. Started only that retained server, with a new log under this review's ignored artifacts:

```sh
/opt/homebrew/opt/postgresql@15/bin/pg_ctl \
  -D /tmp/shelv-w1-plan-pg/data \
  -l /Users/kanuj/.t3/worktrees/shelv/t3-9735aa5b/.local-artifacts/portal-rebuild/w7-backend-r2/server.log \
  -o "-k /tmp/shelv-w1-plan-pg/socket -h '' -p 55439 -c max_connections=12 -c shared_buffers=16MB" start
```

Before prepare, queried and asserted exact data directory `/tmp/shelv-w1-plan-pg/data`, `listen_addresses=''`, socket `/tmp/shelv-w1-plan-pg/socket`, PostgreSQL 15.19, database `shelv_w1_plan_v1_synthetic` and comment **`W1 plan v1 synthetic Unix socket fixture 20261030`**. The helper clears ambient `PG*` variables, disables password-file use and uses `/dev/null` as service file. No unexpected running server was adopted.

After every database test/probe completed, reasserted that same identity/marker/socket configuration, stopped only the server started here using `pg_ctl -D /tmp/shelv-w1-plan-pg/data -m fast stop`, and checked status. **Final fixture state: STOPPED; `pg_ctl` says no server running, expected status exit 3.** Original directory and original logs are retained. No Docker, Colima, TCP database, parent Auth fixture, hosted connection or private credential was used.

Artifacts: `/Users/kanuj/.t3/worktrees/shelv/t3-9735aa5b/.local-artifacts/portal-rebuild/w7-backend-r2/`. Complete `probes.py`, `acceptance-probes.py`, logs, schemas, source-scope evidence and fixture identity/stop evidence remain available to the parent. To reproduce, reacquire exclusive custody, follow the status/identity/marker checks above, run the unchanged native prepare, then run the scripts with this workspace as cwd and:

```sh
PATH="/Users/kanuj/.nvm/versions/node/v22.23.0/bin:/opt/homebrew/opt/postgresql@15/bin:$PATH" \
PYTHONDONTWRITEBYTECODE=1 python3 .local-artifacts/portal-rebuild/w7-backend-r2/probes.py
```

Each probe resets only explicitly synthetic fixture rows. Session deadlines are fixture state; task grants and cancellation use their actual public commands. The final natural grant-expiry reproduction does not alter/disable any production guard. The checked-in Edge bridge substitutes synthetic authentication/session claims, then executes the actual handler/parser/response mapper and real persisted SQL. It is not JWT verification, PostgREST or a genuine Auth service.

| Artifact | SHA-256 |
| --- | --- |
| `probes.py` | `40d403029f31b1d2b53d75620b93368c1da689ca265f942eb253047b3d7d8822` |
| `probes.log` | `23ebbc3c6c62998b99ce3d3cc00e040f34ec47dcc97b03b60674498ae784cca9` |
| `acceptance-probes.py` | `c5201d0441765874a50cf5e96268968fe9a35b2f761f75a6c68281028f95c075` |
| `acceptance-probes.log` | `772cf8aae57390f8ed47a54c971268834b2d396425bcd3646620c17898dac2d6` |
| `native-prepare.log` | `5888b666d6f88bd62103be98bb12dcbf5deece408a50c59d3b5751a2f4f9e348` |
| `fixes-native.log` | `4f3a282a37dfd8b6652bae3e3c6c9b7af4e89d4a0bf184a518350075b5560e48` |
| `existing-native.log` | `f06704af52c1a39edcf8fd9abb0b2755d59a246eafe6153f25c4675025241a11` |
| `schema-acl.log` | `f32ee0d6bc3bf43af116b2316ee539608c89feebf113cac74d818d032cdaf5a9` |
| `plan-channel.log` | `e864ffa95bcde0f5790a062b720d1b5b6aedd28f4f5a0d0d9166876345c0a568` |
| `fixture-stop.log` | `2679c7ac6eef1e615f01abf7237f2dd21de57fe5d5e89d2735cbb54cfa2450d2` |

## Explicit limits and return

The author's 1,187 root passes/18 existing skips and security-advisor `[]` remain **author evidence**, not reviewer reruns. Full canonical `supabase db reset`, pgTAP execution, genuine Auth/PostgREST/Edge/browser/cookie flow, full portal/session suites, Expo web/iOS export, exact-head CI and final release checks remain parent-owned/unverified here. Read the canonical 30-assertion pgTAP source; this Homebrew lane does not substitute for its execution. Deno serving was not run. Node focused tests emit the existing typeless-package warning; focused tests/types otherwise pass.

UI/advisor projection extensions, real source upload/retention, delivery provider/webhook/inbox, final plan export and complete portal composition are separate unfinished work. No acceptance of them is inferred from this fix review. There was no source fix, migration rewrite, push, PR, merge, deployment, real permission/client-data action, money movement, retailer action, email/message, nested agent or CI watcher. This report is the sole tracked change; coordinator retains shared status/CONTEXT_SYNC ownership. The report-only commit hash is returned in the handoff.
