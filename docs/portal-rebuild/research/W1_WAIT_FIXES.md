# W1 backend R2 wait fences

Owner: Kanuj. Date: 30 October 2026. Implementation response to [W7 round two](W7_BACKEND_R2.md), read with the full [original review](W7_BACKEND_REVIEW.md) and [prior fixes](W1_FIXES.md). This is author evidence, not independent acceptance or full portal acceptance. A fresh independent review is required.

## Exact scope and runtime

- Workspace: `/Users/kanuj/.t3/worktrees/shelv/t3-c484cddc`; branch `t3/backend-r2-wait-fences`.
- Exact clean starting base: `efd92faa01b071cbfb68145d60c410b3fd520022`, the integrated R2 report directly above `af121d6`. `git fetch origin` succeeded; base `HEAD...origin/main` was `45 0`, with main `d39a7d4943209080df7c4cf97d85784f462758bf`.
- Before task work, both live `orchestrator_capabilities({})` and `t3_thread_configuration({})` returned provider `codex`, model `gpt-6.1-sol`, `reasoningEffort=xhigh`, `serviceTier=default`, full-access/default. Task identity ends in `portal-rebuild-w1-wait-fixes-20261030-r1`. No nested agents or model changes.
- Applied Resume, systematic debugging, TDD including `writing-good-tests.md`, receiving-code-review, Supabase and verification workflows. Read applicable root/portal instructions, rebuild specifications, contracts and PLAN_API_V1, including D16/D19/D22/D38/D40. Live Supabase changelog/session documentation was consulted; this task changes existing application SQL guards, not Auth configuration.
- Every Node command selected `/Users/kanuj/.nvm/versions/node/v22.23.0/bin` explicitly; verified Node `v22.23.0`. Native commands also selected PostgreSQL 15.19 at `/opt/homebrew/opt/postgresql@15/bin`. Dependencies were installed from existing lockfiles with `npm ci --ignore-scripts --no-audit --no-fund` for root and the session runtime; no dependency or lockfile changed.

Only three tracked paths belong to this change: unreleased migration `20261030223603_portal_rebuild_plan_v1.sql`, new `tests/portal-rebuild-wait-fences-native.py`, and this report. No shared root contracts/handler, migration 55, frontend/gateway/package, generic helper, pgTAP, status or CONTEXT_SYNC changes. The advisor-read worker retains its separate allocation. The containing commit is returned in the handoff; resolve it with `git log -1 --format=%H -- docs/portal-rebuild/research/W1_WAIT_FIXES.md`.

## R2-1 response

`concierge.plan_request_authorize` retains authorization of the immutable stored response's original content and source scope. After the potentially waiting source/permission checks, it now repeats authorization using **the stored command action, stored draft/client IDs and stored exact grant ID**, then checks the actual session immediately before returning to either cached return site. It never substitutes the latest body or a replacement task grant. The source/permission and principal/session/grant/client rows already checked remain locked through the transaction. Neither receipt JSON nor business effects are rewritten or repeated.

Persisted regressions cover both exact save replay and `request_status_v1`:

- Human session `auth.sessions.not_after` naturally expires while the actual request waits on its original source row: **401 `session_ended`**, no private canary, immutable receipt and all inspected plan effects unchanged.
- A finite, publicly issued, exact draft-scoped agent grant naturally expires during that wait: **403 `forbidden`**, no canary or effects. A separate still-live client grant with the same source is deliberately present, proving it cannot replace the original grant.
- Real human source permission is deleted by the source-lock holder before releasing the waiter: **403 `forbidden`**, no canary or changed receipt. Latest draft content is clean in every receipt case, so checking it would not authorize the historical private fact.
- Lawful human/exact-agent calls return the original stored receipt after a verified source wait, without new effects. Publicly revoking the original agent grant denies later replay/status even after issuing a source-capable replacement grant.

The actual Edge handler/parser/mapper returns the bounded safe codes above. No error namespace, transport bound, action or result shape changed.

## R2-2 response

The public legacy wrapper retains the legacy writer's result instead of directly returning it. For the same activated-candidate client actions (`submit_report`, `reserve_photo`, `complete_photo`), it then rechecks current active care and finally the real session. The legacy writer already holds the shared request/client advisory locks, including when `workflow_begin` returns an exact cached receipt. Cancellation uses that same client lock. A failing final check raises within the same transaction, rolling back report/photo/head revision/request journal effects. Existing administrative actions continue through their original paths.

Persisted tests cover all three actions, both fresh writes and exact retry early returns, under natural session expiry and a **real authenticated public `cancel_service`**, with `kind=early_departure`, today's Chicago support end and `confirmedWithClient=true`. The cancellation commits before the blocked client resumes. Each waiter denies with the expected bounded `concierge_session_ended` or `concierge_forbidden`; report/photo/head/request/publication/event/delivery snapshots remain unchanged. Cancellation persists and the client's administrative service read still succeeds. A separate check-in-head row wait also denies after session expiry. Lawful writes/retries still return identical receipts without advancing revisions twice; changed-payload reuse still returns `request_conflict`.

Inspected `reserve_photo`, `complete_photo`, their head/storage-row waits, and the legacy `workflow_begin` cached return. The new outer fence covers these shared branches; runtime tests exercise all three client-lock branches, cached branches and the report head-row wait. A separate Storage-row wait was source-inspected, not independently timed. The existing check-in history/photo-reader before/after guards remain intact. Other unrelated legacy/public/client-decision return paths are not exhaustively certified by this bounded pass.

## Red/green and verification

Read the complete independent script at `/Users/kanuj/.t3/worktrees/shelv/t3-9735aa5b/.local-artifacts/portal-rebuild/w7-backend-r2/probes.py`; verified SHA-256 **`40d403029f31b1d2b53d75620b93368c1da689ca265f942eb253047b3d7d8822`**. Its bad-outcome assertions were not counted as acceptance passes. New persisted denial/rollback regressions were written and run before editing production SQL.

The first new harness run exposed a snapshot SQL alias error, corrected before accepting red evidence. The corrected baseline has **17 assertion failures, zero test errors**: four expired private receipt returns, seven fresh persisted check-in writes (six client-lock variants and one head wait), and six unauthorized cached check-in returns. Lawful/source-revocation controls passed. No production edit preceded that corrected red run.

Each race uses an explicit lock-holder handshake and verifies `pg_stat_activity.wait_event_type='Lock'` for the actual request UUID before allowing the authority change. Natural deadlines use the database clock, never token mocks or disabled guards. Snapshots compare actual persisted before/after rows. Public cancellation and agent issue/revoke use actual authenticated SQL operations.

| Fresh command/check | Result |
| --- | --- |
| Unchanged `python3 tests/portal-rebuild-native.py --prepare`, baseline and fixed | Exit 0; 15 concierge prerequisites plus migration 54; original historical bytes/dates/payments/Starts preserved; zero principal/owner/grant seeds |
| New `python3 tests/portal-rebuild-wait-fences-native.py`, corrected baseline | Exit 1; 9 methods, 17 expected assertion failures, no errors |
| Same new suite, fixed SQL | Exit 0; **9 passed**, no failures/skips, 34.080s |
| Existing `python3 tests/portal-rebuild-native.py`, serial after new green | Exit 0; **29 passed**, no failures/skips, 14.599s |
| Existing `python3 tests/portal-rebuild-fixes-native.py`, serial next | Exit 0; **14 passed**, no failures/skips, 29.640s |
| `node --experimental-strip-types tests/portal-rebuild-domain.test.ts` | Exit 0; **8 passed**, no failures/skips |
| `node --experimental-strip-types tests/portal-rebuild-handler.test.ts` | Exit 0; **3 passed**, no failures/skips |
| Bundle unchanged runtime `plan-channel.test.ts`, `node --test` | Exit 0; **9 passed**, no failures/skips; fixed safe error/channel mapping retained |
| `npx tsc --noEmit` | Exit 0, zero errors |
| `npm run typecheck:tests` | Exit 0, zero errors |
| `npm --prefix apps/portal/session-integration/runtime run typecheck` | Exit 0, zero errors |
| `npm test` | Exit 0; **1,190 passed**, zero failures/cancellations, **18 existing opt-in skips**, 1,208 total |
| Original independent `acl.sql`, plus changed helper/wrapper privileges | Exit 0; no disabled plan RLS, raw privileges, exposed private helpers or unpinned search paths. Public plan/check-in `f/t/f`; delivery RPCs `f/f/t` for anon/authenticated/service_role |
| `supabase db advisors --type security --level warn --fail-on warn` with explicit owned socket URI | **Not completed**: installed CLI 2.121.0 attempts `.s.PGSQL.5432` despite explicit 55439 URI/query port. No security-advisor pass claimed |
| `git diff --check`, owned-path/link/temporary-file review | Passed before commit |

The original F1-F5/Q1/Q2 acceptance regressions still pass. Those protections were not relaxed. No canonical pgTAP edit was needed or made.

The advisor CLI first rejected a hostless URI. Correcting the authority/query host selected the actual allocated Unix socket directory but still attempted port 5432; adding the query port did not fix it. Inspecting the installed CLI/Bun socket handling and trying the exact socket file also failed because the CLI appended `/.s.PGSQL.5432`. Errors are retained. The included Go companion exposes no advisor command. No listener, symlink, server setting, tool installation or other fixture was changed to accommodate the CLI. The passing direct catalog audit is distinct evidence; the parent must rerun the advisor check in its canonical lane.

## Fixture custody and limits

Before start, checked root/data/socket directory identities and real paths, `PG_VERSION=15`, original `postmaster.opts`, PostgreSQL 15.19 and `pg_ctl status` exit 3 (**no server running**). `/tmp` resolves through macOS `/private/tmp`; none of the three allocated directories is an additional symlink. Started only this returned cluster with a new log in this task's artifacts:

```sh
/opt/homebrew/opt/postgresql@15/bin/pg_ctl \
  -D /tmp/shelv-w1-plan-pg/data \
  -l /Users/kanuj/.t3/worktrees/shelv/t3-c484cddc/.local-artifacts/portal-rebuild/w1-wait-fences/server.log \
  -o "-k /tmp/shelv-w1-plan-pg/socket -h '' -p 55439 -c max_connections=12 -c shared_buffers=16MB" start
```

Before unchanged prepare and again before stop, asserted exact data directory `/tmp/shelv-w1-plan-pg/data`, empty `listen_addresses`, socket `/tmp/shelv-w1-plan-pg/socket`, max connections 12, database `shelv_w1_plan_v1_synthetic`, and database comment **`W1 plan v1 synthetic Unix socket fixture 20261030`**. Ambient `PG*` variables were cleared, password-file use disabled and service file `/dev/null`; no TCP or hosted connection. After database checks, stopped only this server with `pg_ctl -D /tmp/shelv-w1-plan-pg/data -m fast stop`. Final status exit 3: **STOPPED**. Data and all logs are retained. No read-worker, Colima/Docker or parent Auth fixture was touched.

The native fixture has minimal synthetic Auth/profile/Storage tables and real persisted role-switched SQL. The plan bridge runs the actual Edge handler/parser/mapper but substitutes Auth/session claims. It does not prove genuine JWT, Auth/PostgREST/Edge serving, cookie/browser behavior or uploaded bytes. Full canonical reset/pgTAP, genuine Auth journey, full portal/session suites, Expo web/iOS exports and exact-head CI remain parent-owned/unrun here. No migration has been applied hosted. No final security certification, business authorization or full portal acceptance follows.

No push, PR, merge, deployment, real client/source/permission action, email/message, funds, retailer purchase/order or nested delegation occurred. Parent owns integration of these migration-54 definitions into the advisor worker's preserved original command body, shared status/CONTEXT_SYNC updates and fresh independent review.

Artifacts: `/Users/kanuj/.t3/worktrees/shelv/t3-c484cddc/.local-artifacts/portal-rebuild/w1-wait-fences/`. Reproduction requires exclusive custody and the same identity/marker checks, then unchanged prepare and the new suite with explicit Node/PG PATH and `PYTHONDONTWRITEBYTECODE=1`.

| Artifact | SHA-256 |
| --- | --- |
| `red.log` | `67c72c7901a0dcb748ddfaa55610bf37f8657b70cba38fd37c5c0eea4bcba0ec` |
| `green.log` | `1fc8fa6d5e6145610e238703a061b09c84c9bc4a371a6a1575941057b555fef3` |
| `existing-29.log` | `0ea5106d418cd1e2a12ae979a6294879fa15e2fa5304caa773652d7339199ed2` |
| `existing-14.log` | `5f1b8080e37a7822e57dfade28fcb243953ef6d07be210c9a083b89f52b36393` |
| `acl.log` | `e9218f08b8a8de6aa76ba95aa0c1c4a0e9cb877370bd1c2694db8116679f269d` |
| `advisors-exact-socket.log` | `5b14c3d6b16a7c97c40a0155e25b0a2fb7fa50df40db36080a22bb3144092727` |
| `prepare-green.log` | `5888b666d6f88bd62103be98bb12dcbf5deece408a50c59d3b5751a2f4f9e348` |
| `root-tests.log` | `02695a57ef0ff8012c26f0d5b67c89843386ddc3eaa2d251a5fe211e39cdd689` |
| `fixture-stop.log` | `793582c850ec3506dd3335c7460d7b99963d24521270ddd674613ffe6f8523f3` |
