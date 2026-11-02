# W1 own-client completed-photo inventory

Owner: Kanuj. Source author handoff, 1 November 2026 local / 2 November UTC. Worktree `/Users/kanuj/.t3/worktrees/shelv/t3-5371951d`, branch `t3/photo-inventory-producer`. Exact clean starting Parent `3bd152a259b7b9b9971caa1546e65f69de12aab9`. No input commits were imported. Later Parent changes do not change this frozen base.

**SPEC / completeness, author assessment:** the allocated Root producer, strict page projection and additive SQL source are implemented. Canonical pgTAP is authored **UNRUN**. The approved full goal and M59 goal-history photo-upload feature remain incomplete: transport admission, W4 complete collection, C05/C07/App composition, new independent R1 and genuine acceptance remain open.

**Correctness / quality, author evidence:** new source / closed actual Root HTTP / strong ABI checks pass **16/16**. Retained check-in/reply **39/39**, shared runtime **8/8**, cookie/request **140/140**, configured frontend and session types **0/0**. The unchanged original head suite is **29/32, exit 1** because three historical whole-source equality checks do not account for these new inventory additions. That raw result is preserved, not called green. No independent verdict, SourceReady, SQL/ACL/race, genuine Auth/Storage, browser or release acceptance is claimed.

## Exact owned delivery

All three implementation commits are ordinary owned commits, not review-input ancestors:

| Commit | Scope |
| --- | --- |
| `908c0d103955df4878685d18945df839a1c95a1d` | Early coherent API/types/Root command/mapper/handler/registry, exact inventory success budget, new closed and strict tests. Sent to Parent after actual six functional and one strong ABI checks. |
| `f877c80ceeea2c3e11163de59f8d3e5ad33a5596` | Separate prerequisite: only the new RPC argument list in the two exhaustive native Root test signature maps. Removing precisely those additions restores every original byte, including all helpers/assertions/test bodies. Native tests were not executed. |
| `28d7dae8fd7fb22a489ef83057d0b704857c3b77` | Sole CLI-created forward migration, canonical unrun pgTAP, new SQL/source preservation test and expanded actual Root ingress tests. SQL source frozen and writer slot returned to Parent. |

This subsequent report commit is also owned. Existing production writes are only `supabase/functions/concierge-checkins/{commands,types,projection,handler,index}.ts` and the exact new fixed-RPC success budget in `supabase/functions/concierge-operations/runtime.ts`. New tests are `apps/portal/tests/rebuild-photo-inventory-{source,closed,strict}.test.mjs`. New SQL and this report are the other additions. No cookie, gateway, ClientProvider/upstream/policy, Application, shared UI/contracts, Source model, dependencies or configuration was edited.

## Pinned API and consumer obligations

No source counterexample required changing the supplied engineering pin:

```text
POST /api/client/checkins
{action:'read_photo_inventory_v1',cursor:UUID|null,limit:integer1..50,
 expectedRevision:nonnegativeSafeInteger|null}

public.concierge_checkin_photo_inventory_v1(
 p_cursor uuid,p_limit integer,p_expected_revision bigint)

{revision,photos:[{id:canonicalUUID,angle:'front'|'left'|'right'}],
 nextCursor:UUID|null}
```

Every request field is required; unknown fields reject. A null first cursor permits a null expected revision; a later cursor requires a non-null expected revision. Root normalizes a valid request UUID to lowercase. The fixed RPC takes no client selector: ownership comes only from actual authenticated SQL identity. There is no count, total, hash, raw path/URL, clinical body, care-access bit or upload acknowledgement.

`CheckinPhotoInventoryPage` is exported from Root `types.ts`. `CheckinPhotoInventory` and `mapCheckinPhotoInventory(input,page)` are exported from Root `projection.ts`. The mapper checks exact top-level and row keys, safe revision, expected revision, canonical lowercase UUIDs, existing angles, strictly ascending unique IDs greater than the supplied cursor, page size and a non-null next cursor equal to the last returned ID on a full page. A terminal full page may have null next cursor; an empty page must be terminal. Output and copied rows/array are frozen. A malformed or mismatched successful RPC response fails safely with503; actual SQL revision conflict remains409.

W4 must collect all pages under the same revision and actual session before installing a complete feature basis. A failed, cancelled, denied or conflicting page cannot produce partial-ready inventory, a fake empty result or local-cache completeness. The existing `{revision}` head does not establish inventory; Review's head and photo IDs without angles do not replace it. This author adds no client collection/cache. Retained `readPhoto` still needs its actual descriptor authorization, current basis/session and bounded private-byte guards. Metadata never grants raw-file access or upload rights.

The original W4 handoff at exact `89b45937d980d4a01011fe567bd68a27025121d7` was read, including its compatibility response that deliberately retains legacy409 pending this producer. Its report is 72,493 bytes, SHA-256 `a3be66b7bf60b973612f7e215c9c919e4161d21338560a9e61c5582b71c7fe2e`. The original dispatched feature brief was also recovered from its durable T3 task message; its specific prefix is retained separately from the fully read approved input. [W1 photo head](W1_PHOTO_HEAD_SOURCE.md), [independent head R3](W7_PHOTO_HEAD_SOURCE_R3.md) and [independent photos R4](W7_REPORT_PHOTOS_SOURCE_R4.md), including old findings/responses and evidence qualifications, govern the retained boundaries. No W4 module or predecessor implementation was imported.

## SQL source, locks and authorization

Installed `/opt/homebrew/bin/supabase` is2.121.0; `migration new --help` was inspected. The one actual `supabase migration new portal_rebuild_photo_inventory_v1` returned `supabase/migrations/20261102014536_portal_rebuild_photo_inventory_v1.sql`. Its empty0-byte SHA-256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` was verified and sent to Parent before any SQL body. There was no second allocation, SQL execution or upgrade.

The new authenticated-only security-definer public wrapper has an empty search path and revokes PUBLIC/anon/service-role EXECUTE. It calls the **actual** `concierge.photo_head_client_guard_v1()` and **actual** `public.concierge_checkin_head_v1()`, instead of duplicating Auth, enrollment/care eligibility or initial-head rules. The existing invoker guard stays private and byte-exact. It checks permanent nonanonymous current owned provider session, deletion/banned state, enrollment, actual case, advisor/task denial and preparation or applicable care-read window. No payment or current-authority flag is added.

The actual head reader guards before and after the canonical client advisory wait, takes actual case SHARE then checkin-head SHARE locks, validates the safe head and checks the guard again. These transaction locks remain held through the inventory query. Thus the new wrapper uses the same client/case/head order and original eligible existing-case initial0 semantics. Expected-revision mismatch rejects409 before querying photos. The wrapper checks the same actual guard again after its query. This is source reasoning, not executed concurrency proof.

The query filters only `client_id=actual uid AND state='complete'`, applies `id>cursor`, orders by UUID ID and limits to `limit+1` **before** aggregating. At most51 metadata rows are materialized; the lookahead is removed and next cursor is the last returned ID. Report/goal/amendment associations and reservation actors do not narrow the inventory. A new partial `(client_id,id) WHERE state='complete'` index supports this scan; the old indexes do not provide that composite completed-own keyset. There is no new table, cache, payload registry, old SQL edit or whole clinical bundle query.

Frozen SQL hashes:

| Source | Bytes | SHA-256 |
| --- | ---: | --- |
| `supabase/migrations/20261102014536_portal_rebuild_photo_inventory_v1.sql` |2315| `dce8ab602e10d94e9be9788b72eac10a166132bd5563a4d46329a12aa3f08dcc` |
| `supabase/tests/portal_rebuild_photo_inventory_v1.sql` |15361| `9273da9b16a18a2fa0000c0ec7bc57ee757996b696426bf91682141012482d01` |

Both remain **UNRUN**. Authored pgTAP covers ACL/search path/private helper, synthetic inferred-owner fixtures, initial no-head/no-write state, pagination/limit/lookahead/exhaustion, pending and foreign-owner exclusion, attached/amendment/unattached rows, distinct Review/checkin heads, changed snapshot and identity/session/enrollment/advisor/task denials. Its fixture is preparation, not entitled active care: it does not forge coverage to obtain a legacy clinical positive or insert a transient incomplete goal report. The retained M59 SQL fence is inspected as source there. Actual entitled Goal/amendment409, read-only care positives, effective catalog/RLS/ACL and concurrent wait/query/revocation still need a granted native composition. These unrun cases are not included in passing test counts.

## Closed Root evidence and preserved failures

New closed tests bundle the actual canonical Root `index.ts`, handler/parsers/mapper, fixed RPC registry and actual `createConciergeAuthenticatedPorts`, with `write:false`. The only positive inputs are explicit in-memory HTTP Auth/RPC transcripts. Global external fetch is denied, all URLs/headers/arguments are checked, and unexpected Storage/network paths fail. No successful authority/current/OperationPort/Vault substitute supplies the result. This is the actual Root boundary only: **new inventory has not traversed ApplicationSession/cookie/gateway/Vault/ClientProvider**, whose admission is W0's later ownership.

The initial unchanged API test first observed actual Root legacy `content_version_required`409, then failed because the not-yet-implemented new action returned400 instead of200: **0/1, exit1**. This is an actual dispatch failure, not a missing-module RED. After implementation the same test's metadata predicate returns200 with exact fixed RPC arguments and no legacy read. The legacy409 remains scripted RPC error evidence, not executed SQL history proof. The initial six functional cases then passed6/6.

An independent budget differential binds **only** the shared runtime to immutable3bd in memory; all other inputs stay current. The same8193-byte valid-JSON test fails **0/1, exit1, actual200 vs expected503** under that old unlimited budget, then passes on actual current Root. Exact8192 streamed UTF8 bytes pass even with false Content-Length;8193 cancels and returns503 before acknowledgement/final Auth. Multibyte overflow cancels on the crossing chunk, a3MiB response cancels after its first64KiB chunk, and stream/cancel failures stay503. The bound applies before retaining an overflow chunk/final JSON buffering, not to network-delivered chunk size or total heap. Known401/403 status survives large, malformed and interrupted error bodies. Auth/error budgets remain2MiB; existing head success stays4096; legacy and near-match RPC success names still consume complete >3MiB bodies.

Other cases cover all50 identities, terminal genuine-response empty pages, missing/unknown/private fields, invalid/case-noncanonical IDs, duplicate/order/cursor/angle/limit violations, unsafe/mismatched revision, final owner replacement/null/anonymous Auth, cancellation during final Auth and reentrant B while A's immutable mapped response is held. A's output remains its captured17 page rather than borrowing B's18 data. SQL changed-head409 and auth denial are explicit transcripts, not race/resource proof.

## Commands and exact counts

All Node commands use `/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node`, v22.23.0. The own ignored runner prints the actual child exit before exclusive unique JSON log creation and records complete argv/cwd/stdout/stderr. Child Node processes inherit the global-fetch denial preload. Existing Node module-type warnings are retained; packages are unchanged.

| Execution | Actual outcome |
| --- | --- |
| New `rebuild-photo-inventory-{source,closed,strict}.test.mjs` | **16/16, exit0**, no skips/cancellations. Earlier6,1,3,12 groups retained separately. |
| Empty migration source contract before SQL authoring |0/1, exit1; expected missing definition, separately retained from SQL runtime evidence. |
| Original four `rebuild-photo-head-{source,closed,strict,rpc-bound}.test.mjs` files, unchanged | **29/32, exit1**; three source-equality failures below, all functional/body checks pass. No adapted old-test run is claimed. |
| Eight original `tests/concierge-checkins{,-http,-entry,-storage,-transitions,-interleaving,-files}.test.ts` / `concierge-checkin-replies.test.ts` | **39/39, exit0** |
| Original `concierge-runtime.test.ts` / `concierge-payments-runtime.test.ts` | **8/8, exit0**; finite transport only, not blocked financial/M65 verification |
| Original cookie-cancellation / review-guidance-request tests | **140/140, exit0**; retained finite request checks, no blocked Guidance private-return replay |
| Actual TS6 compiler `-p apps/portal/tsconfig.frontend.json` |exit0, flags unchanged |
| Actual TS6 compiler `-p apps/portal/session-integration/runtime/tsconfig.json` |exit0, flags unchanged |
| `git diff --check` |exit0 |

The three historical failures are: old full closed-graph six-annotation JS equality substitutes the old entire handler, which lacks inventory; old PH1 AST allows only its original head-budget change; old head AST removes only old head nodes. None is relabeled pass or edited. New source proof removes **only** allocated inventory types/imports/branches/registry entry and outer budget conditional and compares all old executable nodes across all six owned Root/runtime files to exact3bd. That proof passes. Future integration needs an expressly owned treatment of those old equality fixtures; this author did not weaken them.

The retained real strong experiments still use TS6.0.3, `strict:true`, `noUncheckedIndexedAccess:true`, `verbatimModuleSyntax:true`, `skipLibCheck:false` and actual declarations. Root/App immutable baseline6/current0/introduced0; Worker baseline50/current44/introduced0. **The whole strong Worker graph is not zero-error.** The new actual Root program and negative ABI have0 diagnostics with the same strong flags and real DOM declarations. No declaration/flag/Auth shim, copied type erasure or foreign compiler is used. Full application suites, full Root typecheck scripts, Expo, package/CI and all SQL/native tests were not run in this bounded source allocation.

## Runtime, custody and preservation

Initial and final live actual self and actual Parent `d632030a-18f7-4dec-a2c9-f5c0418c3fd5` configuration plus catalog verify `codex/gpt-6.1-sol/reasoningEffort=xhigh/serviceTier=default`; the selected model descriptor supports both options. Registered project `ac0af19d-d404-4f53-a870-02bfd76c2a80` separately has saved `defaultModelSelection:null`. All18 own/Parent project/eight-role files retain matching bytes/modes and Sol/xhigh pins. No model/configuration change or nested delegation occurred.

Parent separately forwarded the actual returned task identity after the initial gate:

```text
taskId node:delegated-task:command%3Amcp%3Add730894-0fab-4a94-873d-743422eae122%3Adelegate-task%3Aportal-rebuild-w1-photo-inventory-source-20261101-r1
childThreadId thread:delegated-task:command%3Amcp%3Add730894-0fab-4a94-873d-743422eae122%3Adelegate-task%3Aportal-rebuild-w1-photo-inventory-source-20261101-r1
childRunId run:thread:thread%3Adelegated-task%3Acommand%253Amcp%253Add730894-0fab-4a94-873d-743422eae122%253Adelegate-task%253Aportal-rebuild-w1-photo-inventory-source-20261101-r1:ordinal:1
```

Task/thread/run are distinct; no identity was inferred from another or from a request suffix. Evidence home is `.local-artifacts/w1-photo-inventory/`, entirely ignored.

Own dependencies were absent. All four root/portal own/Parent lock hashes matched root `5c57c9aec9e4585066e032e234d610a77cbffd9a51f82700c158fc37fe01b5c2` / portal `bc914f3a9c9f24e44f02e3cff2804651147385ea5abda58a064531329ef23203`. Before the single authorized APFS portal clone, the own script checked absent ignored destination, nonsymlink roots/ancestors, same device and full source byte/mode/literal-link manifest. Complete parity, including directory roots, is9071 entries before/after/final. The literal workspace link `../session-integration/runtime` resolves only to this own checkout's91 frozen tracked runtime files, verified against its Git blobs, never Parent/generated outputs. Root dependencies remain absent. No install, package/lock edit or foreign executable was used.

All2068 starting paths are inventoried;2060 outside the six owned production and two exact test-map paths remain byte/mode exact. All64 old migrations and117 old tracked SQL files are exact, including the existing head and notification SQL. All five normative originals retain `INPUT_PROVENANCE.json` counts/hashes, including the fully read95,388-byte source SHA-256 `c45701f9f54fd2b1dbb09bbd7aa2b9b437e9059aa6032b6f39411fe2e7f6efbd`. Normal Git hooks were inspected: no active hook, no bypass. Final diff contains only allocated paths. Parent files were read only, never repaired or overwritten.

The prior author/reviewer archives are hashed **in place**:286 top-level JSON files /72,143,589 bytes,0 copied. Only the required W4 report, brief prefix, own executed probes and own receipts/manifests were retained here; no recursive/nested archive copy occurred.

Key immutable raw receipts, relative to evidence home:

| Receipt | Exit | SHA-256 |
| --- | ---: | --- |
| `initial-contract-red-20261102T014351-0585c530-21cb-46a7-9db6-43dda7c58ee0.json` |1| `8e180c65d40c3af271a2b46db4edcfddd68c228df73dc9c6ad1ee406f0262888` |
| `inventory-budget-old-red-20261102T015115-46f7924c-665f-40d5-b44f-b51a3a05fe89.json` |1| `8a69dda2f6dd4846a8751b3850d3d4bba7974aa113369b284b1fbaf52be05fad` |
| `inventory-final16-20261102T015353-4c3dd862-ddd2-4163-9e86-af4fa8752130.json` |0| `9e3b464e8935a7a1e3114d40f99052579808506e33c5eb2fd22cb0cdc478d340` |
| `retained-head-raw32-20261102T015213-c83e5eb9-1d5e-4f5f-85b0-11c86695f208.json` |1| `4f20478498da22c322c0e9694b79a67c9f1df68ee066c2f559a23ac4fc0b7ea1` |
| `retained-root39-20261102T015205-0d0a2e77-2695-4a48-8abf-8a1f9ca846ed.json` |0| `2b3ca89c38bbf904eeab9cac09773465d0c71b2d7d86605f44cf582d5aa191e0` |
| `retained-runtime8-20261102T015246-53fb329f-4e8a-4036-8dd7-9925df94af15.json` |0| `517e502892d8a7facb622ec6cf8056f1c96a42c30e25ed8244dbb8a5dbd82e9f` |
| `retained-cookie140-20261102T015352-0f5c95d0-416c-4812-b4df-3c5c57b763f5.json` |0| `5d94659b18f9071d78da1368d072e18e95e74a81964f01543e944ebb1072daa0` |

`results-index.json` retains all exact argv/exits/raw hashes, including SQL-source RED, early results, allocation, compiler and dependency receipts. `initial-live-gate.json`, `parent-task-receipt.json`, `final-live-gate.json`, `initial-tracked.json`, `source-protection.json`, `approved-provenance-final.json`, `dependency-before.json`, both full dependency parity records and `prior-archives-in-place.json` retain custody/provenance. Old failures and current counts remain separate.

## Next gates

Parent must commission a **NEW independent R1** before importing these owned commits. The review needs the exact base/targets/blobs/modes, original W4 and head/R3/R4 inputs/responses, immutable failures and the three old equality-fixture qualifications. Separate SPEC/completeness and correctness/quality verdicts are required. The reviewer owns only a new report and ignored evidence; first new material finding stops dependent acceptance and broad probing.

Then separately admit the shared transport and W4 complete snapshot-bound collection, preserve actual raw-media authorization and exact upload uncertainty semantics, and compose C05/C07 in the actual App. Canonical migration/pgTAP/ACL/current-session/care-window/concurrent locks, genuine Auth/Storage/persistence/native uploads/deletion, browser/camera/visual/a11y/human review, exact-head CI, hosted and release remain open. SQL source writer custody is returned; no future resource grant is inherited.

No browser/preview/DOM/process inventory, listener/service, native fixture/DB/SQL execution, actual Auth/Storage/provider/credentials, Docker/SQLite, blocked Guidance/M65 retry/rephrase/reroute, nested agent, push/PR/merge/deployment, real-client advice/publication/communication, money/order/fulfillment or production-permission action occurred. Hardware-key/program membership was not requested or made a prerequisite. The full D01-D48/26-screen goal remains active.
