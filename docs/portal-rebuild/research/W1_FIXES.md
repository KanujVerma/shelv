# W1 bounded backend fixes for W7 F1-F5 and Q1-Q2

Owner: Kanuj. Date: 30 October 2026. This is the implementation response to the complete [independent backend review](W7_BACKEND_REVIEW.md), not independent acceptance of these fixes. The coordinator must commission a new independent review with that original report and this response.

## Exact scope and runtime

- Workspace: `/Users/kanuj/.t3/worktrees/shelv/t3-36369025`; branch `t3/fix-portal-backend-gates`.
- Exact base: `ba3fabbfbbb5b161fa416a06fd7c278534d8609b`. Initially clean. `git fetch origin` succeeded; `HEAD...origin/main` was `30 0` at the base.
- Live T3 `orchestrator_capabilities({search:'gpt-6.1-sol'})` returned provider `codex`, model `gpt-6.1-sol`, inherited `reasoningEffort=xhigh`, `serviceTier=default`, full-access/default modes. The parent identity ends in `portal-rebuild-w1-backend-fixes-20261030-r1`. No subagents or model changes.
- One fix-wave commit contains this report and all owned changes. Its full final SHA is returned in the task handoff; obtain the containing commit with `git log -1 --format=%H -- docs/portal-rebuild/research/W1_FIXES.md`. A report cannot embed its own containing commit hash.
- Node: explicit `/Users/kanuj/.nvm/versions/node/v22.23.0/bin` first in every Node command, verified `v22.23.0`. PostgreSQL: explicit `/opt/homebrew/opt/postgresql@15/bin`, PostgreSQL 15.19. Existing-lockfile dependency installation used `npm ci --ignore-scripts --no-audit --no-fund`.
- Read the full W7 report, original [W1 implementation](W1_IMPLEMENTATION.md), [PLAN_API_V1](../PLAN_API_V1.md), approved decisions/desktop specification, implementation contracts and ownership/status. These fixes address D14-D25, D32, D38-D40 and the existing verification boundaries.

Only the allocated unreleased migration `20261030223603_portal_rebuild_plan_v1.sql` changed. No earlier migration, additional migration name, frontend, gateway, site/auth, dependency/lockfile, shared status or CONTEXT_SYNC file changed. Coordinator strict indexing annotations, the 500,000-byte limit, finite error namespace and existing 22 actions remain in place. The existing exact approval/payment/publication/outbox boundaries remain mandatory.

## Finding responses

### F1: immutable private receipt scope is reauthorized

`plan_request_authorize` now checks the stored response's draft content, source IDs/versions and original assigned client before either an exact replay or `request_status_v1` returns it. It retains current principal/session/client/grant checks. The source checks do not substitute the latest draft body, so removing/replacing a source or reassigning the current draft cannot make the historical fact readable after its source permission is revoked. Source deactivation/version changes return safe `source_conflict`; missing human/task authority returns `forbidden`. Neither response contains the fact canary.

An originally unassigned receipt uses the same draft's lawful current assignment for the source-scope check. A receipt that was already assigned keeps its own original client scope. This preserves a legitimate retry after first assignment without allowing an assigned receipt to borrow a replacement client's source authority.

Historical request results are never rewritten and effects are never re-executed. Tests compare the actual stored result before/after denied replay/status. Non-owner section-review writes also check the private body before returning their fresh DraftView, closing the corresponding private-return path.

### F2: care and unfinished administration are separate

`plan_care_window` computes the same Chicago active/read-only/exclusive-expired boundary used by `plan_care_access`. The administrative service projection checks the actual session, client deletion/enrollment and current authority, then omits reviews/instructions before entitlement or after the care window. Purchases, returns and cancellation stay reachable. Nothing deletes historical reviews or instructions.

Parallel readers were traced: R1/R2 plan/history wrappers retain their existing care-window checks; check-in reports/replies use `concierge_checkin_read`; photo access uses `concierge_checkin_photo_authorize`. The check-in client/advisor readers and photo authorizer now use the common current guard before and after the underlying potentially waiting read. Client check-in report/photo writes also require current active care. Advisor-private history remains subject to actual advisor/principal authority rather than the client's portal window. Payment evidence remains administrative; the existing raw private Storage denial remains in place. Private walkthrough capabilities are unchanged.

Persisted tests cover support-end +29/+30/+31, both review and instruction canaries, retained order/return/cancellation IDs, check-in history/photo denial at the exclusive cutoff, ended-session administrative denial and a real two-connection case-lock wait that expires the client's session before the history read returns.

### F3: every publishable authoring field has a review dependency

The section hash now includes consultation sections as shared clinical context, preparation attribution in the context section, and top-level routine guides in the routine section. Existing title/summary/context/products/goals/source-version/basis dependencies remain; decisions, authored routine and follow-up retain their section bodies. Schema version is fixed by validation.

The regression independently changes every mutable published root field and requires affected review invalidation. A routine-guide edit invalidates routine while preserving the unrelated follow-up review. Payment-only bookkeeping preserves section reviews and the existing exact content approval tests still pass. Whole approval remains bound to the exact complete content/revision, with no field-count readiness.

### F4: one writable authoring source, explicit legacy adoption

Activated legacy `save_draft`/`save_draft_v2` and new assignment share the existing request/client advisory lock namespaces. Triggers also fence legacy draft/presentation writes and reject a new assigned working draft alongside unadopted legacy work. A new assigned draft freezes future legacy saves before first V3 publication, even when no legacy draft existed when it was assigned. Dormant historical compatibility remains separately labeled.

If legacy work exists, ordinary assignment returns **409 `legacy_draft_conflict`**. A human may deliberately adopt the exact current legacy case revision into an empty unassigned draft using the strict option below. Nonempty incoming manual work is never overwritten. Stale legacy revision rejects with `revision_conflict`; agents cannot perform adoption. Competing legacy save/adoption transactions have one winner.

Adoption copies the existing R1/R2 content through the lossless conversion path, including rich consultation/guides/usage/product/decision fields and opaque IDs. Existing manual draft/intake notes become advisor-only facts. An immutable private adoption row retains the original draft, presentation, intake, intake presentation, baseline, actual case revision, actor and time. Original legacy rows remain byte-for-byte readable/preserved and are frozen. The adopted draft's `origin` is `legacy` with `<client UUID>:<case revision>`; its existing origin-client guard prevents transferring those private notes to another client. Human reviews and exact approval are still required.

An existing nonempty unassigned draft can remain intact while a separate empty draft adopts legacy work. The human can then compare/apply deliberate changes through the existing import flow. Restore also refuses to bypass unadopted legacy work. Default no-legacy create/assign paths and existing scoped-agent create/save/assign tests pass unchanged.

### F5: meaningful directions at readiness, incomplete storage retained

For addition, replace, finish-then-replace and optional alternative, readiness now rejects an empty directions array or any blank entry using the existing locale-independent ECMAScript whitespace set. Safe incomplete saves still work.

The regression covers all four kinds with empty string, ASCII whitespace, Unicode whitespace and a meaningful entry mixed with a blank entry. SQL and the actual handler both reject approval. Fixture-only exact approval rows model a previously issued invalid readiness state and prove both publication boundaries independently reject without creating any publication. The fixture approvals are not claimed as genuine human approvals. A no-product/no-purchase plan with nonproduct rinse guidance, meaningful Unicode-padded directions and a `no_addition` decision still publishes without any product order or Start.

### Q1: restore retains source identity and explicit lawful references

Restore first authorizes the original publication's private body against its actual original draft scope. It then records immutable source-reference adoption rows for the new working draft, preserving source ID/version/original draft/client/actor. It does not change `plan_sources`, discard provenance or transfer a source between clients. The shared `plan_source_scope` predicate is used by both content checks and exact task-source grants, so a lawful restored reference remains grantable to that exact draft. Client-wide/cross-client source scope is not added.

The persisted actual-handler test publishes a draft-bound source with NULL source client, restores it successfully, compares unchanged source metadata/content, reads it through an exact draft-scoped agent grant, rejects reassignment to another client and denies after source deactivation. Active/version/current permission checks still apply on every source read/replay.

### Q2: fixed delivery parameters fail closed on SQL NULL

Claim explicitly rejects NULL/outside 1..50. Result requires non-NULL delivery ID, lease ID and status. Provider-message ID and safe error code remain explicitly optional/bounded. Retry requires a non-NULL valid expected revision and explicit reconciliation boolean, compares revision using `IS DISTINCT FROM`, and requires true reconciliation for uncertain jobs. Expire has no caller parameters and retains its existing fixed uncertain transition.

Additional audit reproduction with the original base function confirmed that NULL expected revision requeued an uncertain job (exit 0, revision advanced). That original function was installed only temporarily inside the marked disposable database and the exact fixed definition was restored in `finally`; final prepare replayed the complete fixed migration again. The service-only execute ACLs remain unchanged. No browser delivery command or external send was introduced.

## Strict adoption seam for coordinator and W2

No new action/RPC/result shape was added. `assign_draft_v1` gains this optional, non-null closed field:

```json
{
  "legacyAdoption": {
    "strategy": "adopt_legacy",
    "expectedCaseRevision": 2
  }
}
```

All existing assignment fields, request UUID and expected content/assignment revisions remain required. `expectedCaseRevision` is an integer 0..9007199254740991. Unknown strategy/keys, NULL revision or NULL adoption object reject. Omitting the field preserves the ordinary no-legacy path. An adoption supplied without unadopted legacy work rejects. This is a human-only exact handoff, not a generic import/RPC or a candidate activation control.

W2 should load the existing authorized legacy advisor view, inspect `draft`/rich presentation and `client.revision`, show that legacy work will become the working plan, preserve any other manual draft, then submit the option on an empty draft. Present `legacy_draft_conflict` as a recoverable choice, never auto-retry with adoption or discard local content. After adoption reload the returned DraftView and require its section reviews. The retained gateway already imports the shared parser and error namespace, so no new channel/action allowlist is necessary. Final UI/cookie behavior remains coordinator/W2 acceptance work; no frontend edits were made here.

## Red/green and actual verification

Artifacts are ignored local evidence at `/Users/kanuj/.t3/worktrees/shelv/t3-36369025/.local-artifacts/portal-rebuild/w1-fixes/`. They contain complete command logs, red traces, catalog checks and the new server log. Committed regressions are `tests/portal-rebuild-fixes-native.py`, the adoption domain test and the expanded canonical pgTAP file.

Initial reproduction used the reviewer's **unchanged** `/Users/kanuj/.t3/worktrees/shelv/t3-632797e3/.local-artifacts/portal-rebuild/w7-backend-review/reproduce.py`, verified SHA-256 `a50d40dfbb23eb3dd172fc5b7e0228a6aaa81dc9fad2c41f6d826ed3857781d5`. All seven original defect observations reproduced; its output hash exactly matches the reviewer output. This is evidence of the bad baseline, not seven acceptance passes or a changed expected-output script.

| Command/check | Actual result |
| --- | --- |
| `python3 tests/portal-rebuild-native.py --prepare`, before and after fixes | Exit 0; 15 canonical concierge prerequisites plus this unreleased migration; exact historical bytes/dates/payments/Starts retained; no seeded principal/grant. Not the full canonical reset. |
| Unchanged reviewer reproduction | Exit 0; seven bad baseline observations reproduced before production edits. |
| `python3 tests/portal-rebuild-fixes-native.py` before fixes, after harness-only framing correction | Exit 1; 12 test methods, 36 assertion failures, zero test errors. Domain adoption parser also failed before implementation. |
| Final `python3 tests/portal-rebuild-fixes-native.py` | Exit 0; **14 passed**, zero failures/skips, 29.019 seconds. Final no-product/nonproduct positive refinement also reran its full method: exit 0, 12.651 seconds. |
| Final `python3 tests/portal-rebuild-native.py` | Exit 0; **29 passed**, zero failures/skips, 14.746 seconds. |
| `node --experimental-strip-types tests/portal-rebuild-domain.test.ts` | Exit 0; **8 passed**, no failures/skips. |
| `node --experimental-strip-types tests/portal-rebuild-handler.test.ts` | Exit 0; **3 passed**, no failures/skips. |
| `npm test` | Exit 0; **1,187 passed**, zero failures, **18 existing opt-in skips**, 1,205 total. |
| `npx tsc --noEmit` | Exit 0; zero errors. |
| `npm run typecheck:tests` | Exit 0; zero errors. |
| Exported `planCommandFields`/content versus actual persisted SQL metadata | Exact equality, **all 22 commands** and complete content shape. |
| Native catalog ACL/RLS/search-path audit | Zero RLS-disabled plan tables, raw table privileges, private plan helper EXECUTE grants or unpinned plan search paths. Public plan role matrix anon/authenticated/service `f/t/f`; all four delivery RPCs `f/f/t`. |
| Explicit Unix-socket `supabase db advisors --type security --level warn --fail-on warn` | Exit 0, no issues found. CLI says remote for an explicit URL; actual libpq host is the allocated Unix socket, server has no TCP listener. |
| Canonical pgTAP source | 30 planned/asserted checks, including new NULL/ACL regressions; **not executed here**, coordinator-owned. |
| `git diff --check`, final owned-path/secrets/temporary-artifact inspection | Passed before commit. |

Native commands selected both Node 22.23.0 and PostgreSQL 15 bins explicitly. The Python/Edge bridge uses the real handler/parser/result mapper and persisted authenticated SQL role, with synthetic Auth/session ports. It does not prove actual JWT/PostgREST, real cookie transport, browser behavior or any live business action.

## Author self-review findings and responses

1. The first receipt fix overdenied a lawful unassigned-to-assigned retry. A new positive regression failed 409; the helper now resolves current assignment only for an originally unassigned response. Historical assigned scopes remain fixed.
2. The first legacy adoption path allowed later transfer of adopted private client notes. A new negative regression succeeded unexpectedly; adoption now pins the existing origin-client guard. The separate manual draft remains unchanged.
3. The first restore fix left task-source enrollment checking the old raw draft-only predicate. A new scoped-grant regression failed `forbidden`; grant and content checks now share the exact source/adoption predicate.
4. The new history reader initially checked session only before a case-row wait. A two-connection regression returned data after expiry; reader/media wrappers now check again after the underlying read. The regression passes.
5. Unicode coverage exposed Python JSON framing, and initial rich-fixture/default SQL-status quoting errors were corrected in test setup. Guards were not relaxed. The corrected baseline produced assertion failures rather than setup errors.
6. The delivery audit confirmed the additional NULL CAS bypass. NULL reconciliation was already denied for uncertain jobs; it is now also rejected explicitly as invalid input for every retry. Required result NULLs now produce safe `invalid_input` rather than a database constraint detail.

These are author debugging/self-review responses, not an independent review. No known F1-F5/Q1-Q2 blocker is intentionally parked. The new independent review, canonical migration/pgTAP lane and real Auth/browser gates must still assess the integrated exact head.

## Fixture custody and remaining limits

Before start, `pg_ctl -D /tmp/shelv-w1-plan-pg/data status` returned no server running; checked directory identity, `PG_VERSION=15`, original `postmaster.opts` and the original reproduction hash. Started only that retained cluster with a **new** log under this task's ignored artifacts:

```sh
/opt/homebrew/opt/postgresql@15/bin/pg_ctl \
  -D /tmp/shelv-w1-plan-pg/data \
  -l /Users/kanuj/.t3/worktrees/shelv/t3-36369025/.local-artifacts/portal-rebuild/w1-fixes/server.log \
  -o "-k /tmp/shelv-w1-plan-pg/socket -h '' -p 55439 -c max_connections=12 -c shared_buffers=16MB" start
```

Before prepare and before final stop, queried over only `/tmp/shelv-w1-plan-pg/socket:55439`, with ambient PG variables cleared, no password file and `/dev/null` service file. Verified exact data directory `/tmp/shelv-w1-plan-pg/data`, `listen_addresses=''`, socket directory, database `shelv_w1_plan_v1_synthetic` and marker **`W1 plan v1 synthetic Unix socket fixture 20261030`**. No unexpected server was adopted.

Final `pg_ctl -D /tmp/shelv-w1-plan-pg/data -m fast stop` succeeded; subsequent status returned **no server running** (expected status exit 3). Data, original logs and new logs are retained. No default/TCP/hosted database, Docker/Auth snapshot, parent fixture or real client/source/credentials were accessed.

Full canonical `supabase db reset`, `supabase test db`, retained real Auth/PostgREST/browser/cookie journey, full gateway/portal/session suites, Expo web/iOS exports and exact-head CI remain coordinator-owned or unrun in this bounded pass. Homebrew fixture does not provide pgTAP or real Auth. No Deno runtime/deployment claim. Raw-source uploads/retention, real delivery/webhooks/inbox and later portal modules remain their original separate unfinished scope.

No push, PR, merge, deployment, external email, funds/order/retailer action, production activation or independent self-acceptance occurred. Coordinator owns shared status/CONTEXT_SYNC updates and independent re-review.

## Evidence hashes

| Artifact | SHA-256 |
| --- | --- |
| `reviewer-reproduce.log` | `7374f16d0caccb6196b8d7a17302e0ffa67cb3d587294c4e267ea47b0cc59e20` |
| `red-native-corrected-harness.log` | `9a818ff72080e36c0795ee1dfc8d88c327efa7ed0ee5b40d35d22700a65ef51e` |
| `final-prepare.log` | `5888b666d6f88bd62103be98bb12dcbf5deece408a50c59d3b5751a2f4f9e348` |
| `final-fixes-native.log` | `a4b49445f231c2c2eafb07ff33789613ce15633e48768c8cde0010ead85e3e05` |
| `final-existing-native.log` | `2c5b3f4197ea7b0ce6c1cbd4ac20cc60d0bda184c14bc1ff8bf93c0c7ee311e2` |
| `root-tests.log` | `f774dbd56effee0039c740257099ae3ef43f1f22cde8e5a74ebe03dc213bfb53` |
| `acl-final.log` | `d64d19a298ddd3011c4332e5356863400843ff3d788b2ce457798dc1ee45cd0c` |
