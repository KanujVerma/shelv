# W1 bounded advisor read projections

Owner: Kanuj. 30 October 2026, with the forward migration generated on 31 October UTC. This is an implementation handoff for independent review, not acceptance of the portal, the existing migration-54 wait wrappers, genuine Auth/browser behavior or a release.

## source, runtime and custody

- Workspace: `/Users/kanuj/.t3/worktrees/shelv/t3-97b66568`; branch `t3/advisor-read-projections`.
- Clean source base: `85267500b68f85039c344243623af4418420cbbb`. `git fetch origin` succeeded; initial `HEAD...origin/main` was `39 0`. No unrelated dirty work was present.
- Early strict seam: `7ca6d32`, sent immediately to the coordinator; coordinator reports integration as `36af02e`.
- Implementation head: **`69c55b2cdc7444a26e80c74581f99f961610c8ea`**. The later delivery commit adds this report only; obtain its full SHA from the task receipt or Git, avoiding a self-referential hash here.
- Live T3 `orchestrator_capabilities({search:'gpt-6.1-sol'})` and `t3_thread_configuration({})` returned provider/instance `codex`, model `gpt-6.1-sol`, options `reasoningEffort=xhigh`, `serviceTier=default`, modes `full-access/default`. Configuration was checked again before delivery and matched. No subagents or model fallback.
- Node was explicitly `/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node`, verified `v22.23.0`. `PGBIN=/opt/homebrew/opt/postgresql@15/bin`, PostgreSQL `15.19 (Homebrew)`. Supabase CLI `2.121.0`; its actual `migration new` output allocated **`20261031003846_portal_rebuild_advisor_reads_v1.sql`**. The filename was sent to the parent immediately.
- Read the advisor-read contract first, full current PLAN_API, W1 implementation/fixes, W2 vertical report, actual types/SQL, and relevant approved D14-D25/D38-D40/specification/contracts/ownership/status. More recent coordinator steering keeps migration 54 and the old fixture with a separate wait-fix worker.

Only root `PortalRebuild*`, the one new canonical migration, new tests, the advisor-read contract and this report changed. The reviewed `20261030223603_portal_rebuild_plan_v1.sql` has **zero diff**. No frontend, gateway, site/auth, package/lockfile, shared status or CONTEXT_SYNC edits. No source/principal/owner identity seeds were added to migrations. No push, PR, merge, deployment, live client/source access, email, money or order action occurred.

## exact interface and implementation

The [pinned API](../ADVISOR_READ_API_V1.md) documents exact exports and fields. New root exports are `AdvisorGateView`, `AdvisorCapabilities`, `AdvisorPublicationView`. The two commands are:

```ts
{schemaVersion:1, action:'read_advisor_gate_v1', target:ExactTarget, publisher:Publisher}
{schemaVersion:1, action:'read_advisor_publication_v1', clientId:UUID, version:number|null}
```

`publisher` is mandatory. Null publication version selects the actual current canonical version. `readPlanCommand` and `buildPlanRpc` accept only the strict finite shapes and the existing fixed `concierge_plan_command_v1(p_command jsonb)`. `mapPlanResult` binds complete target/publisher or client/version, rejects private/extra fields and revoked/consumed approvals, checks access consistency, and validates legacy format against its actual original. New read envelopes are excluded from committed-write receipt decoding. No remembered receipt becomes current authority.

The forward migration moves the existing public plan handler, without rewriting its body, into private `concierge.plan_command_base_v1`. A new fixed public wrapper dispatches only the two added reads; all other actions call that retained implementation. Existing 22 metadata shapes remain identical except the explicit grant-action extension from 12 to 14 finite task actions; the two new commands make 24. Native equality tests compare all SQL/TS fields and independently reconstruct the original 22-command shape. No generic RPC/table/URL dispatch, caller role switch, JWT substitution or service-role data access.

The wrapper preserves existing advisory client locks, live session/profile/deletion/enrollment checks, principal/grant row locks, source locks and pinned search paths. It rechecks the actual reader session/task and exact target after waits. Reads insert no request, approval, entitlement, clock, delivery, decision or Start row. Existing public role matrix remains anonymous/authenticated/service `false/true/false`; new private helpers/base have no anonymous/authenticated/service execute privileges and no raw plan-table privileges were added.

### gate recovery

The gate returns real client/target/publisher binding, `Approval|null`, first/later state, active/inactive coverage, authenticated capability booleans and current policy. A non-null approval requires working/readied exact content, assignment/hash/basis/section dependencies, source versions and current permissions, exact scope/publisher, matching policy revision, a current human approver, current publisher authority, and no revocation or consumption. Policy changes require fresh approval; finance-only writes preserve approval. Owner role demotion invalidates owner authority, even if the owner UUID remains in policy.

Human view-only readers can recover safe gate metadata without edit or raw-source access. Capabilities come from the authenticated principal and actual advisor flags, never names/model fields. Task booleans are bounded to the selected exact read grant; unrelated grants are not combined into global rights. Selecting another publisher grants no authority to the reader. Unknown/stale target rejects rather than recovering a receipt as an approval. Publication remains a separate deliberate write with its own guards.

### publication audit

The read uses canonical `concierge.publications(client_id,version)`, immutable V3 `plan_documents`, or immutable R1/R2 originals through the retained lossless normalized projection. It does not query mutable drafts for published content. R2 guides/comparisons/usage/product/source metadata and IDs survive. R1 unknown metadata stays unknown. Actual selected-version decisions, current reported use, current next-review date and actual first-publication schedule are read separately. No payment/choice/delivery is inferred as actual Start.

`clientAccess` reports actual entitlement and care state, including `care:'ended', entitled:true, canRead:false, canWrite:false` for an expired client while an authorized advisor retains an audit read. The owner-derived client read is unchanged and cannot select another client. An ended advisor audit read grants no client portal access, support promise, care write or raw-source authority. A publication that was never entitled does not get a fabricated entitlement. Missing publication/version returns unavailable, never draft content or invented metadata.

Task reads require the new explicit finite action, exact client or exact immutable V3 source-draft scope, actual session, expiry and no revocation. A draft-scoped publication grant cannot read a different/current version whose original source draft differs. Legacy history without rebuild source-draft linkage requires explicit client scope. Public projections can be read with no raw-source IDs in the grant; private draft/source reads remain independently denied. Preview behavior remains `published:false` with safe content and no synthetic publication/date/entitlement.

## tests and observed red states

New committed files:

- `tests/portal-rebuild-advisor-reads.test.ts`: five command/mapper cases.
- `tests/portal-rebuild-advisor-handler.test.ts`: three actual handler/fixed transport cases.
- `tests/portal-rebuild-advisor-native.py`: 24 persisted SQL/actual handler cases.
- `supabase/tests/portal_rebuild_advisor_reads_v1.test.sql`: 15 structural/ACL/registry assertions, **not executed here**.

Initial domain run failed all three missing-operation tests, then passed after the seam. Receipt decoding subsequently failed with `Missing expected exception`, then passed after excluding read envelopes. Legacy format inconsistency also failed before `readLegacyPlan` was added to the new response path. Initial native run failed all 15 missing-read cases; the first SQL run passed 13, with two fixture errors subsequently corrected: cancellation needed its recorder, and immutable grants must expire naturally instead of being updated. No production assertion/guard was weakened.

Source-wait tests 20/21 were independently mutation-checked in this task's disposable database: temporarily omit only the new wrapper's final reauthorization block, observe both regressions return **200 instead of 401/403**, restore the exact wrapper in `finally`, then run the full suite green. No migration-54 function was substituted. Case 23 initially returned a stale owner approval after demotion; the read-only human predicate was corrected and the case/full suite passed. Cases 16-19, 22 and 24 add coverage of already implemented rules; they do not claim independent preimplementation red traces.

Use the common native command below, followed by `AdvisorReadTests.<method>` for any individual case. The committed method name is the exact per-case command selector. Final result for every row: pass, no skips.

| Method selector | Behavior / negative assertion |
| --- | --- |
| `test_01_restart_approval_recovery_and_payment_independence` | Actual approval survives a new handler process and verified finance-only change; no publication. |
| `test_02_content_assignment_hash_and_client_binding` | Wrong revision/hash/client rejects; content edit clears recovery. |
| `test_03_revocation_policy_and_selected_publisher_invalidate` | Wrong publisher/null approval, policy-revision invalidation and actual approval revocation. |
| `test_04_current_publisher_principal_and_capability` | Publisher permission or principal deactivation invalidates approval. |
| `test_05_consumed_approval_is_not_current_and_history_is_immutable` | Consumed approval is null; restored/edited working draft cannot rewrite immutable publication. |
| `test_06_no_publication_wrong_version_and_cross_client_fail_closed` | No fabricated publication, wrong-version/cross-client denial, client selector rejected. |
| `test_07_advisor_audit_outlives_actual_client_access` | Ended client versus authorized audit; ended advisor session denied. |
| `test_08_actual_view_only_capabilities_no_name_inference` | Exact actual view-only permission booleans; ordinary client and missing view denied. |
| `test_09_agent_requires_explicit_exact_client_draft_session_action` | Old read grant adds no new rights; wrong client/action, revocation and scope checks. |
| `test_10_task_expiry_and_session_expiry` | Actual natural grant expiry and deleted actual session deny. |
| `test_11_private_sources_independent_and_source_version_changes` | Safe human/task projection without raw access; canary/locator/ID excluded; changed source rejects stale target. |
| `test_12_reads_do_not_write_clocks_requests_outbox_use_or_start` | Before/after persisted snapshot equal across repeated reads. |
| `test_13_sql_ts_shapes_and_acl_search_paths` | All 24 shapes equal, original 22 reconstructed equal, private/raw privileges absent. |
| `test_14_legacy_r1_r2_actual_decisions_use_and_schedule` | Real legacy originals and unknown entitlement/schedule; real choices and latest Start, no inferred use. |
| `test_15_current_after_case_wait_session_expiry` | Session expires while waiting for client lock: 401. |
| `test_16_task_publisher_approval_revocation_is_current_not_remembered` | Task publication grant revocation clears previously recovered approval. |
| `test_17_current_and_historical_v3_version_binding_with_real_schedule_use` | Real current/historical versions, first schedule unchanged, exact draft-scoped history. |
| `test_18_task_revocation_committed_while_grant_wait_denies` | Committed revocation during grant-row wait: 403. |
| `test_19_source_permission_revocation_invalidates_approval_without_granting_raw_read` | Lost human source permission clears exact approval while safe read remains possible. |
| `test_20_gate_rechecks_reader_session_after_source_lock_wait` | Source-row wait crosses reader session expiry: 401; mutation red confirmed. |
| `test_21_gate_rechecks_task_expiry_after_source_lock_wait` | Source-row wait crosses task expiry: 403; mutation red confirmed. |
| `test_22_publication_reads_actual_support_end_committed_during_client_wait` | Actual support cancellation committed during client wait is reflected as ended. |
| `test_23_owner_role_demotion_cannot_retain_owner_approval_authority` | Actual owner-role demotion invalidates previous owner approval; real red confirmed. |
| `test_24_actual_read_only_window_is_distinct_from_advisor_audit` | Day +29 shows actual client read-only access with no care writes, unlike ended +30. |

## executed verification

All Node/npm commands selected Node 22.23.0 in PATH. The exact tested code tree was committed as `69c55b2` with no production change between verification and commit.

| Command | Actual result |
| --- | --- |
| Owned adapted `portal-rebuild-native.py --prepare`, then apply only the new forward migration | Exit 0, fresh canonical concierge/W1 replay plus final extension; historical publication/policy/principal bytes unchanged, zero new identity/grant seeds. |
| `python3 tests/portal-rebuild-advisor-native.py` with fixture env below | **24 passed**, zero failures/skips; final full run 25.356 seconds. |
| Adapted original `portal-rebuild-native.py` | **29 passed**, zero failures/skips, 16.335 seconds. |
| Adapted original `portal-rebuild-fixes-native.py` | **14 passed**, zero failures/skips, 30.616 seconds. These are the retained F1-F5/Q cases, not the subsequently reported R2 wait fixes. |
| `node --experimental-strip-types tests/portal-rebuild-advisor-reads.test.ts` | **5 passed**, zero failures/skips. |
| `node --experimental-strip-types tests/portal-rebuild-advisor-handler.test.ts` | **3 passed**, zero failures/skips. |
| `npm test` | Exit 0: **1,195 passed**, zero failures, **18 existing opt-in native skips**, 1,213 total. |
| `npx tsc --noEmit` | Exit 0, zero errors. |
| `npm run typecheck:tests` | Exit 0, zero errors. |
| `EXPO_NO_TELEMETRY=1 npx expo export -p web --output-dir .local-artifacts/portal-rebuild/w1-advisor-reads/web-export` | Exit 0, exported three web bundles. No mobile/native runtime change; no separate iOS validation claimed. |
| Explicit Unix-socket `supabase db advisors --type security --level warn --fail-on warn` | Exit 0, `results:[]`, no warnings. CLI labels its explicit-URL path remote; actual host is the private Unix socket with no TCP listener. |
| Final catalog query | `rawHelpers:0, rawPlanTables:0, unfixedSearchPaths:0`; plan public role matrix remains `f/t/f`. |
| `git diff --check`, final owned diff and scope inspection | Pass. Reviewed first migration/package/lockfile/frontend/gateway/shared status unchanged. |

Canonical `supabase db reset`, `supabase test db`/pgTAP, genuine Auth/PostgREST, retained cookie/browser journeys, full portal/session integration, Deno runtime and exact-head CI are **not established here**. Coordinator owns that lane and the composed-head reruns. Homebrew has no pgTAP extension. The bridge authenticates a synthetic identity port, then uses the actual handler/parser/mapper and persisted authenticated SQL role. It does not verify JWT signatures or HTTP PostgREST. The transport tests separately verify fixed Auth/RPC URLs and unchanged bearer propagation.

## isolated fixture and reproduction

W7/wait-fix workers exclusively own `/tmp/shelv-w1-plan-pg`. This task did not start, read, reset or stop it.

This task created one small cluster under `.local-artifacts/portal-rebuild/w1-advisor-reads/pg/data`. Its socket directory is under the same ignored tree, reached through the short task-owned symlink `/tmp/shelv-ar-97b66568` to satisfy Unix socket path limits. Actual verified settings: `listen_addresses=''`, port `55447`, max connections 10, shared buffers 16MB, database `shelv_w1_advisor_reads_synthetic`, marker `W1 advisor reads 97b66568 synthetic 20261031`. No Docker, second Auth stack, default/TCP database, parent credentials or real owner/client seed.

Fixture-only adaptations are retained under `.local-artifacts/portal-rebuild/w1-advisor-reads/harness/`: copies of the original native/fixes harnesses and Edge bridge. Replacements are only original socket path, port, database, marker/password-file location, copied-file repository-root calculation and bridge handler/module path. Production assertions were not changed. The committed new suite accepts `SHELV_PLAN_NATIVE_MODULE` and `SHELV_PLAN_NATIVE_PORT`; its Node subprocess uses the selected PATH. The original committed harness files remain unchanged.

```sh
export PGBIN=/opt/homebrew/opt/postgresql@15/bin
export PATH="/Users/kanuj/.nvm/versions/node/v22.23.0/bin:$PGBIN:$PATH"
export SHELV_PLAN_NATIVE_MODULE="$PWD/.local-artifacts/portal-rebuild/w1-advisor-reads/harness/portal-rebuild-native.py"
export SHELV_PLAN_NATIVE_PORT=55447
python3 tests/portal-rebuild-advisor-native.py
# Individual case, for example:
python3 tests/portal-rebuild-advisor-native.py AdvisorReadTests.test_20_gate_rechecks_reader_session_after_source_lock_wait
```

The copied `--prepare` recreates only its exactly marked disposable database and applies the retained migrations. Apply `20261031003846_portal_rebuild_advisor_reads_v1.sql` afterward before new reads. It deliberately does not rewrite the retained production migration or pretend that this is a full canonical Auth reset. Ambient PG variables are removed by the harness; `.psqlrc` and real password/service files are not used. Data and logs are retained locally; the task-owned server is stopped before final delivery.

## integration request and open review

Coordinator should compose the separate migration-54 wait fixes **before** migration 55 so the retained private base captures the corrected 54 body. Add exactly `read_advisor_gate_v1` and `read_advisor_publication_v1` to the advisor plans fixed action/capability registry using authenticated view authority. Keep them outside the owner-derived client allowlist. Wire W2 context from the four real gate fields, permissions from actual gate capabilities, separate payment/directory reads, and publication/history from `AdvisorPublicationView`. Preserve strict mappers, current session-generation checks and explicit unpublished preview adaptation. No generic proxy or extra source permission is needed.

The coordinator's update reports W7 R2 `3c896a9` resolved the original seven observations but found two P2 wait defects in migration 54: cached private receipt/status after session/task expiry during source authorization, and check-in write after expiry/support cancellation during a client wait. A disjoint worker owns those fixes and tests. **This report does not claim either old wrapper closed.** New read wait tests address only the new read branches. Independent review remains blocked until composed-head fixes, canonical migration/pgTAP, actual Auth/browser acceptance and a new review complete. Full portal implementation remains ongoing.

## retained evidence hashes

Ignored evidence root: `.local-artifacts/portal-rebuild/w1-advisor-reads/`.

| File | SHA-256 |
| --- | --- |
| `red-native.log` | `8561db66adda3ce830fcaf5e1fb43849a22b86a9aa4a66df635264b4e1be6f30` |
| `red-final-wait-fences.log` | `7799c1e22dc42d07d4ec364b5c6f46fae76daf98be973b92613c5cf27f173859` |
| `red-owner-role.log` | `73c22cdaebf63ff9b2bef3f46e12fd94abab528295e1a207f68f0ba7de5acfd7` |
| `red-legacy-format.log` | `d410c72586ea8575b7b9cbc92826e3da93d15b9812e5a2c373884c8f790bbf33` |
| `final-advisor-native.log` | `72e9e514e98bc523349c03a67525a6df5f5e86dadc013faa0220988c41b54a17` |
| `existing-native.log` | `2dd0ea2b06acbb955e38154385d253ab73b90cd8d9883ba6862ddcc1e44fd475` |
| `existing-fixes-native.log` | `998e9ed4e985ad2bb5d1d3e9ae126c078877c2d84c254341a6e4cf0df6d685d5` |
| `root-tests.log` | `78369826a71016d34d621ab426f9219731f8df74ef936ccf1516f33ce0fe804e` |
| `web-export.log` | `5eb9182d98323a1c9ccea50cb83d0756499b92c40aeb6df388cd23ca8fb756d2` |
| `advisors.log` | `e253ec2346bb26cf73408d95a258dd02e365c7817869199bb60da057d13d2bcc` |
| `final-catalog.json` | `597871a353e4dd2d062dbc09f08c3b0afcef7df7cd6836103974c12e95f59377` |
