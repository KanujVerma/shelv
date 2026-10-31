# W7 independent backend review, round 3

Owner: Kanuj. Review date: 30 October 2026, completed 31 October UTC. This reviews the composed receipt/check-in wait fixes and authoritative advisor reads. It does not establish full portal, genuine Auth/browser or release acceptance.

## Scoped verdicts

- **Specification compliance: PASS for this bounded backend scope.** R2-1 and R2-2 are **ADDRESSED**. The two advisor reads satisfy the pinned read contract in the source and independently executed synthetic persisted checks below. No new reproducible important or low-priority backend finding was identified in this round.
- **Code quality/correctness: PASS for this scope.** The forward wrapper retains the corrected original command body, finite schemas and ACLs. Current authority is rechecked after the tested waits. Denied operations preserve stored receipts and business effects; lawful controls retain their semantics.
- Original F1-F5/Q1/Q2 remain **ADDRESSED for their concrete reproductions**, with all 14 prior-fix regressions freshly green. Neither these verdicts nor passing component tests replace canonical reset/pgTAP, genuine Auth/PostgREST/Edge/browser, full application verification or exact-head CI.

No critical/high finding, exhaustive security certification, real-client authorization or production readiness is asserted. The advisor CLI limitation below remains an uncompleted verification check, separate from the passing direct catalog audit.

## Exact source and runtime

| Item | Verified value |
| --- | --- |
| Workspace / branch | `/Users/kanuj/.t3/worktrees/shelv/t3-f34e9ecb` / `t3/review-w7-backend-r3` |
| Starting and reviewed application HEAD | `606a890c731e9de24a71f79b572d3e467d0dd648`; initially clean |
| Actual composition order | `649c1e3467130107f9c85517e3adf1bf4e4f1138` wait fixes, then `25a65061765b9d058ca2b8c51b7759b12c67a2eb` advisor implementation, then `606a890` report |
| Wait author | `4c54bae`; original migration54, wait tests and response blobs equal reviewed HEAD |
| Read author / report | `69c55b2cdc7444a26e80c74581f99f961610c8ea` / `428616e`; all ten read-range paths and report blobs equal reviewed HEAD |
| Read author's base | `85267500b68f85039c344243623af4418420cbbb`; `git diff --exit-code 8526750..69c55b2 -- <migration54>` passes |
| Original backend / review | `a7f4f36591a7965bcaa1ca3899c82f9b84fabe0c..d6840ac8eae9be314ab7f1466e5f4373c308391b`; original reviewed gateway head `129635e88f91e9539973062a60779f717f2a935a` |
| Original seven fixes | `371c42531902b20e302f6dddd2062549493a868b`, integrated `3baa87c07a0c8b00651e7e460d8dae992b80f25f` |
| Round2 application / report / integration | `8526750` / `3c896a9` / `efd92faa01b071cbfb68145d60c410b3fd520022` |
| Freshness | `git fetch origin` succeeded; `origin/main=d39a7d4943209080df7c4cf97d85784f462758bf`; initial `HEAD...origin/main=53 0` |
| Effective model | Both live `orchestrator_capabilities` and `t3_thread_configuration`, before review and again before delivery: `codex`, `gpt-6.1-sol`, `reasoningEffort=xhigh`, `serviceTier=default`, full-access/default modes |
| Task | `portal-rebuild-w7-backend-review-20261030-r3`, final component of the returned delegated thread identity |
| Node / PostgreSQL | Explicit `/Users/kanuj/.nvm/versions/node/v22.23.0/bin`, Node `v22.23.0`; `/opt/homebrew/opt/postgresql@15/bin`, PostgreSQL `15.19 (Homebrew)` |

This report is the sole tracked change. Its containing commit is returned in the task handoff, avoiding a self-referential hash. Reviewed application files and assertions were not edited.

Applied Resume, review reception, Supabase and verification-before-completion workflows. Read applicable root/portal AGENTS, rebuild entry point/status/ownership, full desktop specification, D01-D48, implementation contracts, full [PLAN_API](../PLAN_API_V1.md), pinned [advisor read API](../ADVISOR_READ_API_V1.md), and the complete [original W7 review](W7_BACKEND_REVIEW.md), [W1 responses](W1_FIXES.md), [W7 round2](W7_BACKEND_R2.md), [wait response](W1_WAIT_FIXES.md) and [advisor read response](W1_ADVISOR_READS.md). D16/D19/D22/D38/D40 require honest receipts, exact scoped authority, current access and private-source separation. Consulted current [Supabase session guidance](https://supabase.com/docs/guides/auth/sessions) and fetched its changelog; no Auth configuration or dependency change was made.

Inspected the complete forward SQL, shared types/parser/mapper/value deltas, actual handler/transport, changed migration54 guards, all new persisted/unit tests and pgTAP source. Followed supporting session/principal/grant/source, care, legacy check-in, canonical publication and gateway paths. This is a manual independent specification/correctness/authorization review, not a completed Codex Security scan.

## R2-1: ADDRESSED

Migration54 `plan_request_authorize` still authorizes the immutable stored DraftView and its original client/source references. After source/permission waits it repeats `plan_authorize` with the **stored command action, draft/client scope and exact original grant**, then checks the real session. Both early return sites use this helper. Migration55's retained private base has exactly the post-fix migration54 `prosrc`, independently compared before/after applying55.

Fresh committed wait tests and additional independent probes establish:

- Human save replay and status wait on the original source row until `auth.sessions.not_after` passes: **401 `session_ended`**, no private canary.
- Exact-agent replay and status wait until the publicly issued finite original grant naturally expires: **403 `forbidden`**, including when a live replacement grant exists.
- Permission deletion committed by the source-lock holder denies both cached paths, even though the latest draft body is clean. Public revocation plus a replacement source-capable grant cannot revive the old receipt.
- Lawful human/exact-agent cached returns after a confirmed source wait equal the original stored response and create no new effects. Receipt and plan/publication/event/delivery snapshots remain unchanged after denial or lawful replay.

The four extra original-symptom probes assert denial, not the old bug. They verify both a lock-holder handshake and the actual request's `pg_stat_activity.wait_event_type='Lock'` before awaiting authoritative expiry. The unchanged original R2 diagnosis script was read and its SHA-256 rechecked as `40d403029f31b1d2b53d75620b93368c1da689ca265f942eb253047b3d7d8822`; its bad-outcome assertions were not run or counted as acceptance passes.

## R2-2: ADDRESSED

The activated legacy wrapper now retains the underlying check-in result, checks active care after the legacy writer's waits/cached return, then checks the actual session. A failed final check raises inside the original transaction and rolls back the write. The legacy writer and real cancellation share the existing client lock.

Fresh persisted cases exercise **all three** `submit_report`, `reserve_photo`, `complete_photo` actions, each fresh and exact cached, under natural session expiry and actual authenticated public `cancel_service`. The cancellation uses confirmed early departure with today's Chicago support end and commits before releasing the client waiter. Every unauthorized operation denies with `concierge_session_ended` or `concierge_forbidden`. Report/photo/head/request/publication/event/delivery snapshots remain unchanged; the cancellation persists and administrative service access remains available. A separate check-in-head row wait denies after session expiry.

The tests prove the actual request is lock-blocked before expiry/cancellation. Lawful writes/retries return identical receipts with no second revision increment; changed-payload reuse remains `request_conflict`. These are persisted SQL/RPC checks, not successful stub responses. A separate Storage-object-row timing race was source-inspected, not independently timed; uploaded bytes are outside this fixture.

## Original protections retained

| Finding | Disposition and fresh evidence |
| --- | --- |
| F1 private source-revoked receipt | **ADDRESSED**; stored-body source checks and denied immutable-receipt regressions pass, now supplemented by the after-wait tests above. |
| F2 expired care through administration | **ADDRESSED**; +29/+30/+31 service/history/photo filtering, retained unfinished administration and expired-session reader cases pass. The new check-in final fences close R2's separate write defect. |
| F3 section dependency omissions | **ADDRESSED**; preparation, consultation sections and routine guides remain in dependency hashes; all prior invalidation/payment-only controls pass. |
| F4 competing legacy/new working drafts | **ADDRESSED**; legacy conflict/adoption, preserved manual/original content, exact CAS, agent denial and concurrent one-winner cases pass. |
| F5 whitespace directions | **ADDRESSED**; incomplete save remains valid while readiness/approval/publication reject blank required directions; lawful no-product guidance still publishes. |
| Q1 draft-bound source restore | **ADDRESSED**; lawful immutable source adoption, exact restored task scope and cross-client/deactivation negatives pass. |
| Q2 NULL delivery inputs | **ADDRESSED**; claim bounds, NULL/stale CAS/result/reconciliation denials and lawful service-only retry controls pass. |

The wait patch changes only the two final fences in migration54;55 preserves that body. No original protection was relaxed to obtain these results.

## New advisor reads

**No new reproducible finding.** `read_advisor_gate_v1` and `read_advisor_publication_v1` remain strict fixed operations. Complete SQL/TypeScript content metadata and all **24 action schemas** match; the test independently reconstructs the original22 metadata by removing only the two read actions and their finite task-action additions. Fifteen extra direct-SQL malformed new-read commands reject with `concierge_invalid_input`, including role/session/actor/RPC/URL fields, missing/null publisher, nested extras and invalid versions.

Gate evidence covers restart approval recovery; exact client/content/assignment/hash/publisher binding; first/later and real coverage state; payment-only preservation; content/policy/source/publisher/approval revocation; consumed approval; inactive publisher; demoted owner; actual view-only capability booleans. View authority does not imply edit, review, payment or raw-source access. Selecting a publisher adds no reader authority. A source-permission loss removes the affected approval while the lawful safe gate remains readable.

Publication evidence covers canonical immutable V3 and actual lossless R1/R2 originals, unknown legacy metadata, current/historical version binding, selected-version decisions, current actual use, actual next-review date and first-publication schedule. Editing/restoring a working draft cannot rewrite the published document. No publication is fabricated when absent. An unentitled version remains unentitled. Advisor audit access correctly differs from the client's active, +29 read-only and +30 ended care states; no client care right follows from the audit.

Task reads require the explicit finite action, exact client OR published source-draft scope, actual session, current expiry and no revocation. Old grants gain no new rights. Legacy publication without source-draft linkage requires client scope. An exact historical draft grant cannot read another current version. Independent probes also prove that unrelated edit grants do not union into the read grant's capabilities and that safe projection adds no raw-source access.

The mapper binds every gate target/publisher component, publication client/version and actual legacy format. Both read envelope types are excluded from committed-write receipt decoding. Extra independent mapping checks accept valid R1/R2 controls and reject **16** format/original/version/private-field/malformed-recommendation/receipt cases. These supplement the five committed domain and three handler cases; a historical receipt cannot become current gate authority.

### Additional independently authored wait probes

Every row below observes the intended actual query in a lock wait before releasing or changing authority. These supplement the committed24 read cases and nine wait cases; no production assertion was changed.

| Wait / change | Actual result |
| --- | --- |
| Original private source, human session or exact task expiry, both replay/status | 401 or403; no canary; immutable receipt/effects unchanged |
| Gate source row, reader session expiry / task natural expiry | 401 /403; safe error only; no business effect |
| Gate source row, committed source version change | 409 `revision_conflict`; safe error only |
| Gate source row, committed publisher source-permission loss | 200 safe gate with `approval:null`; private content excluded |
| Gate reader principal row, session expiry / principal deactivation | 401 /403 |
| Gate read-grant row, committed revocation | 403 |
| Gate selected publisher grant row, committed revocation | 200 safe gate with `approval:null` |
| Publication client lock, reader session expiry | 401 |
| Publication client lock, real public cancellation commits | 200 with actual `read_only`, entitled/readable, care-write false |
| Publication client lock, real version2 publication commits | Human reads actual current2; original first review schedule preserved |
| Publication client lock, task grant naturally expires | 403; effect snapshot unchanged |
| Publication client lock, current moves beyond exact task source draft | 403 for current; lawful exact historical1 read still succeeds |

The main extra script has16 observations; the publication follow-up adds two. The separately deliberate version2 publication is not attributed to a read. Snapshot equality applies to read/denial effects; expected cancellation/permission/principal/revocation changes are excluded from those effect snapshots and asserted separately where applicable. All repeated ordinary read snapshots, including requests, approvals, publications, clocks, entitlements, outbox, decisions, receipts and Starts, remain unchanged. Private fact/source-ID/locator canaries do not appear in gate/publication projections.

## Executed verification

All commands ran against application head `606a890`. Root and explicit session-runtime dependencies were installed from unchanged lockfiles with `npm ci --ignore-scripts --no-audit --no-fund`. All Node commands selected Node22 above; native commands also selected PG15 and `PYTHONDONTWRITEBYTECODE=1`. Both `SHELV_PLAN_NATIVE_MODULE` and `SHELV_PLAN_NATIVE_PORT` are unset in this runtime, explicitly checked. The advisor suite therefore uses the original native module and port55439; no fixture-location adaptation or assertion change was needed.

| Command/check | Fresh result |
| --- | --- |
| Unchanged native `--prepare`, then only migration55 via `psql` helper | Exit0;15 canonical concierge prerequisites plus54, then55; historical bytes/dates/payments/Starts preserved; zero seeded principals/owner/grants |
| Compare original54 command body with55 private base; before/after identity/grant/source/publication snapshot | Exact body equality and snapshot equality |
| `python3 tests/portal-rebuild-native.py` | **29 passed**, zero failures/skips,15.700s |
| `python3 tests/portal-rebuild-fixes-native.py` | **14 passed**, zero failures/skips,30.692s |
| `python3 tests/portal-rebuild-wait-fences-native.py` | **9 passed**, zero failures/skips,37.763s |
| `python3 tests/portal-rebuild-advisor-native.py` | **24 passed**, zero failures/skips,26.382s; four suites run serially |
| `node --experimental-strip-types tests/portal-rebuild-domain.test.ts` | **8 passed**, zero failures/skips |
| Same command for `portal-rebuild-handler.test.ts` | **3 passed**, zero failures/skips |
| Same command for `portal-rebuild-advisor-reads.test.ts` | **5 passed**, zero failures/skips |
| Same command for `portal-rebuild-advisor-handler.test.ts` | **3 passed**, zero failures/skips |
| Runtime esbuild bundle of actual `runtime/tests/plan-channel.test.ts`; `node --test <artifacts>/plan-channel.test.mjs` | **11 passed**, zero failures/skips; includes new view-only gateway/read negatives |
| `python3 <artifacts>/independent.py` | Exit0;16 independent persisted observations above |
| `python3 <artifacts>/publication-waits.py` | Exit0;two additional exact-current/expiry probes |
| `node --experimental-strip-types <artifacts>/mapping-negatives.mjs` | Exit0;two lawful R1/R2 controls and16 negative assertions |
| `python3 <artifacts>/final-catalog.py` | Exit0; complete content/24 schemas equal,15 direct SQL negatives denied, final ACL/identity verified |
| `npx tsc --noEmit` | Zero errors |
| `npm run typecheck:tests` | Zero errors |
| `npm --prefix apps/portal/session-integration/runtime run typecheck` | Exit0, zero errors |
| Author/current blob checks | All14 scoped blobs match; read author range has zero migration54 diff |
| Final `git diff --check`, link/scope/secrets/temp-file review | Pass before report commit; only this report is tracked |

The final direct catalog audit returns empty `rlsDisabled`, `rawPrivileges`, `privateExecute`, `unfixedSearchPaths` sets for the plan objects across anon/authenticated/service_role. Public plan and check-in write ACLs remain **f/t/f**; four delivery RPCs remain **f/f/t**. The moved security-definer base is private and non-executable by these roles; new private read helpers are invoker functions with empty pinned search paths and no exposed execute privilege. No new raw plan-table grant, source/principal/owner seed, caller impersonation or generic dispatch was added.

A diagnostic-only framing error initially passed `schemaVersion` twice to the native convenience helper in `final-catalog.py`. It was corrected by invoking the same SQL directly, leaving all denial assertions intact; the completed check above passes. Existing Node typeless-package warnings remain; no production fix was made for them.

### Advisor CLI limitation

Installed CLI2.121.0 help was inspected. One explicit Unix-socket URI invocation returned exit0 and `results:[]`, but its actual server connection was not traced. A single instrumented follow-up using the same explicit socket/55439 URL plus a unique `application_name` returned exit1:

```text
failed to connect to postgres: failed to connect to `host=/tmp/shelv-w1-plan-pg/socket user=postgres database=shelv_w1_plan_v1_synthetic`: dial error (connect ENOENT /tmp/shelv-w1-plan-pg/socket/.s.PGSQL.5432)
```

No corresponding connection was observed in the allocated server. **No security-advisor pass is claimed.** The earlier untraced response does not resolve the inconsistency. No retries to accommodate it, socket alias, listener/port change, tool update or other fixture adoption occurred. The parent should run advisors in its canonical lane. Direct catalog evidence above is independently established and distinct from CLI advisors.

## Fixture custody and reproduction

Exclusive returned allocation was honored. Before start, inspected `/tmp/shelv-w1-plan-pg`, its data/socket directories and real paths; each is a directory and not an additional symlink (`/tmp` resolves through `/private/tmp`). `PG_VERSION=15`, saved `postmaster.opts` names the same data/socket/55439/empty-listen/max12 configuration, and `pg_ctl status` returned no server running. Started only this cluster with a new ignored log:

```sh
/opt/homebrew/opt/postgresql@15/bin/pg_ctl \
  -D /tmp/shelv-w1-plan-pg/data \
  -l /Users/kanuj/.t3/worktrees/shelv/t3-f34e9ecb/.local-artifacts/portal-rebuild/w7-backend-r3/server.log \
  -o "-k /tmp/shelv-w1-plan-pg/socket -h '' -p 55439 -c max_connections=12 -c shared_buffers=16MB" start
```

Before prepare and before stop, queried and asserted exact data directory `/tmp/shelv-w1-plan-pg/data`, socket `/tmp/shelv-w1-plan-pg/socket`, `listen_addresses=''`, port55439, max12, database `shelv_w1_plan_v1_synthetic` and comment **`W1 plan v1 synthetic Unix socket fixture 20261030`**. The native helper clears ambient PG variables, uses a nonexistent fixture password file and `/dev/null` service file. Only this marked disposable database was prepared. Source contains55 canonical migrations; this native lane replays15 prerequisites plus54 and55, not the canonical full reset.

After every database check finished, `pg_ctl -D /tmp/shelv-w1-plan-pg/data -m fast stop` succeeded. A fresh status check returned exit3, **no server running**. **Returned state: STOPPED, data and all prior/new logs retained.**

Ignored artifacts are `/Users/kanuj/.t3/worktrees/shelv/t3-f34e9ecb/.local-artifacts/portal-rebuild/w7-backend-r3/`. Reproduction requires exclusive custody again and the same identity checks, then explicit Node22/PG15 PATH and `PYTHONDONTWRITEBYTECODE=1`. `prepare.py` runs the unchanged native prepare and applies only55; run the four committed suites serially, followed by `independent.py`, `publication-waits.py`, `mapping-negatives.mjs` and `final-catalog.py`. The scripts and complete logs remain available in the shared filesystem; an evidence hash manifest is retained there.

Retained independent evidence hashes:

| File | SHA-256 |
| --- | --- |
| `independent.py` | `b44909fee321f3ef09096c9f903395b1dc2c277dcab3f9fee84a178225dbcbd0` |
| `independent.log` | `c8b7d0c19e6de8ef9d26b0fbbdb715e0fd8f6842f1cc835321f9139c16c7f8b2` |
| `publication-waits.py` | `dabe1b14e1042b4864e017e30dfd013ce47b6294e2324337b37bf7dc341e3136` |
| `publication-waits.log` | `fccb41e548598971c6800892fa30efaff60a752437f98f185b7f9971fe58d499` |
| `prepare.log` | `762984cbdccde2d8cb2026afbfd1530b1b094dec32a8935410a1fbf5302af7e8` |
| `final-catalog.log` | `a6fe4812c216730425199a569697e745ace2f60388a2a8b0fb5a6f57866f5460` |
| `fixture-stop.log` | `2679c7ac6eef1e615f01abf7237f2dd21de57fe5d5e89d2735cbb54cfa2450d2` |

The parent's separate Docker/Colima canonical55 Auth fixture under `canonical-plan-v1-r3` with ports57421/57422 and W1 read fixture `/tmp/shelv-ar-97b66568` were not touched or adopted. No browser, hosted connection, private credential or real client/source data was used. No nested agent, source fix, push, PR, merge, deployment, real permission change, message, money or order action occurred.

## Remaining acceptance boundaries

The native fixture has synthetic minimal Auth/profile/Storage tables. Its bridge runs the actual Edge handler/parser/mapper and persisted role-switched SQL but substitutes authentication/session claims. It does not verify JWT signatures, real Auth/PostgREST/Edge serving, cookie/browser journeys or uploaded file bytes. Parent-owned full canonical `supabase db reset`, pgTAP, genuine Auth/Edge/browser, full portal/session/root suites, Expo web/iOS exports where applicable, exact-head CI, final visual/release checks and human comprehension remain unrun here.

The author's17 red assertions, root1,195 passes and any15-case baseline Auth evidence remain **author or historical evidence**, not independent composed acceptance. Read-only SQL/ACL behavior and the executed cases above are the reviewer's evidence. The canonical15-assertion advisor pgTAP source was reviewed but not executed in this Homebrew lane. Real source upload/retention, notification delivery/inbox, final export and later portal features remain separate work. The coordinator owns shared status/CONTEXT_SYNC updates and subsequent integration/release decisions.
