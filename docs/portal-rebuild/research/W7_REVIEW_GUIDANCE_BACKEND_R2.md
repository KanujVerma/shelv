# W7 independent composed backend review, round 2

31 October 2026. Frozen W1 candidate **`6a815aaf29c24006523490bdc0ea4da652632822`**, comprising M58 `d33e2587`, M59 `958ca1e7` and M60 `6a815aaf`. Independent source, pure-contract, actual-handler/mapper and isolated PostgreSQL15 verification with **synthetic Auth only**. No reviewer production fixes or nested delegation. Own PG is **STOPPED** before report writing.

## Separate verdicts

- **Specification: FAIL for the composed candidate.** Original RG1/RG2/RG3 and additional RG4 are **ADDRESSED for the concrete reproductions and adjacent checks below**. New **RG5/P2** independently demonstrates a different SQL/TypeScript validation disagreement: duplicate instruction schedule-stage IDs can be published, then public history and exact instruction detail become unavailable.
- **Correctness / quality: FAIL for the composed candidate.** The new P2 repeats twice while the distinct-ID control passes. Passing retained suites do not close it. No P1, unauthenticated/cross-client bypass, new source right or funds/Start effect is claimed.
- **M59 Plan wire-budget correction: scoped PASS** for the independently executed exact-byte, resource, identity, permission, concurrency and wait checks. This separate result does not accept the failing composed guidance platform.
- Canonical60, genuine Auth/JWT/PostgREST/Storage/Edge, application/gateway activation, full portal and release acceptance remain **NOT ESTABLISHED**. Earlier genuine57 acceptance retains its original scope and is not recertified.

## New unresolved finding: RG5 / P2

**Duplicate schedule-stage identities pass the public Guidance RPC and can break client history and instruction hydration.**

The actual [TypeScript check](../../../src/contracts/PortalReviewValidation.ts#L123) requires unique `body.schedule.stages[].id`. It is called by the HTTP parser, private draft mapper, [published-history validation](../../../src/contracts/PortalReviewMapping.ts#L75) and [exact instruction-detail validation](../../../src/contracts/PortalReviewMapping.ts#L140). The SQL [body check](../../../supabase/migrations/20261031091520_portal_rebuild_reviews_guidance_v1.sql#L402) checks shape/bytes/base/use relationships but omits stage-ID uniqueness. The current [M60 readiness predicate](../../../supabase/migrations/20261031141212_portal_rebuild_reviews_guidance_fixes_v1.sql#L39), review, approval and deferred output authority likewise do not check it. The shared schedule shape permits structurally valid stages with the same ID and different directions.

**Actual reproduction, current composed60, twice:**

1. Publish a valid synthetic funded/reviewed V3 plan with one real nonproduct routine scope. Create an otherwise complete instruction for that exact scope, actual server day, null product/use basis and two stages with `id:'same-stage'`, distinct nonblank directions, `minimumDaysFromActualStart:null`, and nonblank `proceedOnlyWhen`.
2. Actual `handleGuidanceRequest` create returns400 `invalid_input`, as intended. The same command through **public `concierge_guidance_command_v1` under `SET LOCAL ROLE authenticated` and the authorized synthetic owner session commits successfully**, returning a normal draft/target. No direct table mutation or privileged business shortcut creates it.
3. Normal actual-handler `review_guidance_v1` commits a review, but returns503 `uncertain` because its returned draft fails the positive mapper. `approve_guidance_v1` then returns200. `publish_guidance_v1` returns200 with a real canonical instruction UUID, receipt and notification event.
4. V3 and the instruction manifest remain200, but the selected exact `read_client_instruction_v1` and `read_care_history_v1` both return **503 `unavailable`**. One typed output with the duplicate IDs is durably stored. The case dump preserves canonical output/receipt/outbox state.
5. The otherwise identical two-stage instruction with IDs `first` / `second` publishes normally; complete history and exact detail both return200 with its unchanged body.

`E/adjacent-probes.py test_a01_duplicate_schedule_stage_ids_must_not_commit_unreadable_instruction` fails the intended denial assertion (`directExit 0 == 0`) in both `adjacent4.log` and `a01-repeat.log`. Full first/repeated inputs/results are `a01-first-duplicate-stages.json` and `a01-duplicate-stages.json`. The repeated canonical instruction is `bfb8fc5a-8d09-4c22-ae95-b3403bf3d437`. The positive control is `a02-unique-stages.json`.

**Impact and scope:** an authorized direct RPC caller can persist invalid instruction structure, obtain exact human approval/publication, and make the client's current instruction detail and history unreadable. This violates the pinned valid canonical-output/read-consistency and complete-instruction obligations (original items6/8/12; D16/D18/D32/D48). It is an authoritative SQL validity gap, not an approval/role/source authorization bypass. This report proposes no source/schema/action/right change and does not silently repair the immutable output.

## Prior findings and response verification

Read the full [R1 report](W7_REVIEW_GUIDANCE_BACKEND.md), original report commit `49c06001fa3a92ecd1ac8ddc0945cea63645aa97` and integration `293193f0`. Both resolve to current report blob `bb17d923f533b4484d9a26d17a234a7e6193f3ab`. Read both complete frozen [W1 contracts](W1_REPORT_GUIDANCE_CONTRACTS.md) and [implementation response](W1_REPORT_GUIDANCE_IMPLEMENTATION.md), including all RG1-RG4 commands, hashes, historical checkpoints and limitations. Author green results were hypotheses to reproduce.

| Obligation | Independent disposition |
| --- | --- |
| RG1 blank/mixed/Unicode-blank changes | **ADDRESSED.** Original assertion passes; incomplete create/save preserves exact body and stays silent. Review/approve400; no public output/receipt/event. `changes:[]` and nonblank changes publish/read200. A real pre-M60 reviewed/approved bad body survives function-only M60 unchanged; usable review/approval become null and publication409 `basis_conflict` leaves output/receipt/consumption/journal/outbox unchanged. No normalization/truncation. |
| RG2 lossy typed reply | **ADDRESSED.** Actual legacy report/R2 publication2 with nonnull nextStep reads completely through new history200; actual old client/advisor Checkins and embedded advisor preview409. Null nextStep also fences its explicit publication binding. Unpublished draft does not fence; actual plain legacy reply remains200; unauthorized other client403. Exact downstream `content_version_required` and sole `concierge_content_version_required` alias preserve409 through retained gateway. |
| RG3 raw locator before dedup | **ADDRESSED.** Original direct authenticated Review RPC now rejects `concierge_invalid_input` rather than committing; the handler returns400. Current fix suite covers reversed/equal text/time in either order, other facts/buckets, whole/page, case, unknown fields, fractional/unsafe version and duplicate-valid relations. Own pre-M60 invalid immutable conversation remains unchanged across M60; outer Guidance creation now400 before any draft, proving raw original validation before canonicalization/dedup there too. Full100000 check below passes without truncation. |
| RG4 Checkins session error | **ADDRESSED.** Actual client-row wait followed by natural session expiry yields SQL `concierge_session_ended` before the reply version fence and actual `handleCheckinsRequest`401 `{code:'session_ended',retryable:false}`, no report/version data. Actual retained ClientProvider/safeError preserves401. Existing handler delta versus M59 is only this dictionary key; original409 and exact upstream alias stay unchanged. |

Original R1 probe/control files were read from the explicitly authorized stopped review evidence path, copied into E with hashes, and changed only at their input module binding. Original assertions and whole test-class ASTs remain unchanged. They were never executed in the foreign checkout or against its socket.

**Fresh sensitivity:** the same three original assertions fail at their intended correct expectations under exact own M58+M59/pre-M60 SQL: review200 instead of400, old reply200 instead of409, invalid direct RPC commits. After fresh own60 replay, the same assertions pass3/3. This is new red/green evidence, separate from the preserved original R1 log. No reviewed production function was edited to manufacture sensitivity.

## Runtime, task and source provenance

- Own T3 workspace **`/Users/kanuj/.t3/worktrees/shelv/t3-303c17e5`**, branch **`t3/review-guidance-backend-round2`**, attached independently by T3 before this run. Starting clean parent **`753116c48e29fc2410d7015c35bf0f919853000c`**. Current parent advisor/CD3/CSS work is outside this backend verdict.
- Frozen full author candidate **6a815aaf29c24006523490bdc0ea4da652632822**; assembled reviewed source **`c6d04cce7a28b8ba769a3532c91cc14a81696ccd`**. Original W1 base **08575a966a7cb22d464d9226fd95defdf2c96470**. All37 candidate-owned files match frozen6a exactly, with Git blobs/SHA256 in E/blobs.json and the appendix. All57 original migrations match085; all59 prior SQL files match958ca byte-for-byte. M58 remains SHA256 `b663f897d669edf33d6c7b0c4e18be8f775ed23c3b539e5bb51620606d912a1e`.
- Both LIVE `orchestrator_capabilities({search:'gpt-6.1-sol'})` and `t3_thread_configuration({})`, first and final, establish **codex / gpt-6.1-sol / reasoningEffort=xhigh / serviceTier=default**, full-access/default. Supported descriptors: reasoning low/medium/high/xhigh/max/ultra (catalog default low), service default/priority (default default); effective xhigh/default is explicit. No fallback/settings change/nested agent.
- Project model and default-subagent pins plus **all eight role TOMLs** are exactly Sol/xhigh. Config SHA256 `927e3dd532c0daabbb975f6879866aa99cbc12d3f20d080b0568867e37ee66ff`; each role SHA256 `a1f57cf26da8626380cbaa101ca04dc39a92e4bd6aa6acb6cd9f5f24a05d9feb`.
- Every Node/npm/compiler command explicitly selects **`/Users/kanuj/.nvm/versions/node/v22.23.0/bin`**, actual `v22.23.0`, including Python children. Own locked portal `npm ci --ignore-scripts --no-audit --no-fund` installed130 packages. No parent install, root dependency install, lock/config edit or flag relaxation.
- `git fetch origin main` succeeded; origin/main is `d39a7d4943209080df7c4cf97d85784f462758bf`. No rebase/reset/broad branch adoption/foreign write. All nine authorized imports use `git cherry-pick -x`, without conflicts or semantic resolution. They retain attribution and are review inputs, not reviewer fixes.

| Authorized source commit | Local attributed import |
| --- | --- |
| `26f9ae3286a7878632ed7ffb058297bfbd2f9518` | `f07f55d18c85be2eaca683d26cbda3523c173eb2` |
| `a977b19048408607c5857ba98acf4fd79568ff98` | `dab8610e8b6e352e679bc5c2c0ddbaa1bfb509de` |
| `9fcb17458c70fd770c961e03efc5f7224689df5d` | `4215aa16a995fa2ca9c9758173d120ac0d0f1e63` |
| `7cdf86da2c83db4019826aac15921ee92846de68` | `a1408f52542d00145bf48a6c89e2814e451b2e96` |
| `30f40da954f5f9f3f4c96c320237ace0aecdd6e4` | `5be62e9f53ac2f2967aa853470375650cd9c4275` |
| `96db032faf282d61f6a890eb38923dfd48893e39` | `2f812f84914150723f41efc43e0eb66b76874d61` |
| `d33e2587ec017aea50eea9f421be2a51d594997e` | `31b54b4d94867d1635413194308a591bf875818f` |
| `958ca1e767a36ec6e5fd32f29c8843bb4b6018e0` | `a67672388ab6931bf84507b8fcd9206bc06b6393` |
| `6a815aaf29c24006523490bdc0ea4da652632822` | `c6d04cce7a28b8ba769a3532c91cc14a81696ccd` |

Task correlation key: `command:mcp:80ff67d2-459c-49fa-93e3-1b40a1f4cbcd:delegate-task:portal-rebuild-w7-review-guidance-backend-20261031-r2`. Actual thread `thread:delegated-task:command%3Amcp%3A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%3Adelegate-task%3Aportal-rebuild-w7-review-guidance-backend-20261031-r2`; actual run `run:thread:thread%3Adelegated-task%3Acommand%253Amcp%253A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%253Adelegate-task%253Aportal-rebuild-w7-review-guidance-backend-20261031-r2:ordinal:1`. Live readback establishes parent `d632030a-18f7-4dec-a2c9-f5c0418c3fd5`, project `ac0af19d-d404-4f53-a870-02bfd76c2a80`, exact branch/workspace and complete25540-character original task, retained in task-record.json. Capabilities' parentThreadId repeats this child in this harness; it is not substituted for the actual parent. No parent-owned task-status handle is invented.

## Inspected requirements and preservation

Read root/portal AGENTS, rebuild README/D01-D48/contracts/plan/acceptance/workstreams/status/addendum, full95388-byte original input in bounded chunks including A/B/C, full manifest and W1_REMAINING_API lines175 through its end. Byte/hash checks bind all five originals to INPUT_PROVENANCE; appendix comparisons establish exact equality with the separately stored decisions/specification/detailed manifest. No approved design was reopened. Broad tool outputs that truncated were followed by bounded relevant reads.

Followed actual new types/validators/mappers/handlers/runtime, all M58/M59/M60 production SQL and canonical tests, source/permission/receipt/outbox/deferred constraints, retained Care/Plan/check-in/service/advisor guards and alternate reply readers. Closed generated SQL metadata is compared in full to actual TS in native33 rather than inferred from truncated minified output. PublicReviewSummary has no publisher field; it is not inferred from preparer. Actual full PublishedGuidance/InstructionDetail retains the publisher, including the retained distinct-preparer/publisher case.

Prior [backend R3](W7_BACKEND_R3.md), [care R2](W7_CARE_BACKEND_R2.md), [NULL-safe history-filter review](W7_CARE_HISTORY_FILTER_REVIEW.md), [status recovery R2](W7_STATUS_RECOVERY_R2.md) and [genuine integrated care review](W7_CARE_INTEGRATED_REVIEW.md) retain their original qualifications: live authority after waits, immutable original receipts, lossless legacy chronology/Start, status as READ and exact pending UUID, and genuine57's specific Node/browser acceptance. Their entire old matrices are not recertified here. D39 remains authorized manual deletion for never-started draft sources, twelve calendar months after actual support end once started; no new source/transmission/training/export right or clock fiction.

M59 independently preserves base function OID/owner/ACL/search_path/security/volatility/strictness/parallel identity and **every other body byte**: prosrc29862 ->29883 bytes, SHA256 `4be414067afedcf3456ae79523c69aaef25a964bddba0f9544836d3fff7552fa` -> `e1309a1f3e1fad3a952fe6a0786956d6237b2446bb37a5105ba03dbd42d29aa6`, solely the21-byte size-token substitution. M60 preserves all eight replaced function identities/attributes; all five new M59/M60 helpers are private invoker functions with no PUBLIC/app/service EXECUTE. All105 concierge table rows/columns compare equal before/after each forward M59/M60 application, and89 pre-M58 tables preserve originals excluding only the added report_format metadata afterward. These are synthetic retained-row rehearsals, not every possible production dataset.

Current exact scalar limits remain request500000 / response1800000 / page400000 UTF8; provider2000000 unchanged; goal90000/conversation250000/guidance120000/text4000/comfort1000/goals50/photos100/refs100/facts50/locators20. M59 uses private canonical compact500000/depth10/nodes250001 plus derived1000000 uncompressed-render guard, exact Plan26 shapes and safe integers. Direct1.00000/1e3/-0 count canonical values; high-array/depth/compressed3M negatives stay bounded. JSONB parsing/detoasting **and first text materialization precede** the SQL guard; it is not pre-parse DoS protection. Original lexical HTTP whitespace is unavailable in SQL; unchanged actual Edge raw500000 remains authoritative.

## Independently executed verification

`E = .local-artifacts/w7-r2-303c17e5/` in this checkout. All probes/copies/dumps/logs remain ignored; no assertion in reviewed source or committed tests was changed. Counts overlap and must not be added as acceptance totals.

| Check | Actual result |
| --- | --- |
| Focused actual contracts/handlers | **77/77**,0 failed/skipped,5751.88325ms; source77.log |
| Exact actual consumer flags | **0 diagnostics / exit0**; strict/noUncheckedIndexedAccess/verbatimModuleSyntax/skipLibCheck:false, actual ES2022/DOM/DOM.Iterable/React/ReactDOM and transitive imports; consumer-strict.log |
| Strict actual test/handler imports | **0 diagnostics / exit0**, unchanged strict flags; test-strict.log |
| Actual retained gateway / exact alias | **9 vectors PASS**, no external fetch; gateway9.log |
| Actual M60 handler/SQL responses through gateway | **4 vectors PASS**, three409 and after-wait401/retryable:false; gateway4.log |
| Retained no-network session source | **32/32**,0 failed/skipped; session32.log |
| Retained M58 actual-handler/SQL native | **33/33**,92.241s, composed60 through own reset-aware chain; native33.log |
| M59 actual-handler/SQL wire suite | **9/9**,11.383s; exact500000 saves/persists/retries/status,500001 HTTP413/direct SQL400/no effects, UTF8/control/emoji, malformed/unsafe/fractional/unknown/deep/compressed3M, current authority, concurrency/CAS and natural expiry during actual draft-row wait; wire9.log |
| New M60 fix suite | **9/9**,41.515s; original findings, expanded locator tuples, readiness/quiet storage/pre-migration approval atomicity, legacy null/non-null reply and row-wait401; fix9.log |
| Unchanged original R1 correct assertions | **3/3 PASS** current60,6.387s; own pre60 **3 intended assertion FAILURES**,6.146s; restored60 **3/3 PASS**,6.445s. Logs original-r1-now60 / sensitivity-red3 / original-r1-post-sensitivity-green3 |
| Unchanged original independent controls | **6/6**,20.324s; ordinary/no-change/silent incomplete, actual plain legacy reply, locator relation,2000 full manifest/digest/last mutation/privacy/cursor, three instruction scopes/pages/exact detail/day, original private receipt after source-row wait/natural expiry; controls6.log |
| New adjacent groups | **3 controls PASS / 1 product assertion FAIL**,12.267s; duplicate-stage RG5, unique-stage history/detail, old bad raw locator outer Guidance fence with preserved original, canonical numeric/depth/high-array/new-helper ACL. RG5 repeats alone with the same intended failure,2.432s. Not four acceptance passes |
| Full private manifest stress, once | **100000 distinct locators**,100 conversations x50 facts x20; independent full digest matches; last-locator immutable replacement changes hash. Draft28693 bytes; largest conversation125478/command125668; **34 private pages**,max377471; complete original+replacement evidence101000 locations. Public1812-byte response excludes private manifest/source ID. Source version/deletion deny without rewriting basis. **161.077s**, manifest100000.log |
| Full source scope vector | Pure document497944/V3 **1555338**/reported page399100; all50 paused products; **2550 actual scopes /26 pages**,max59698, each full detail body120000. Cumulative308799390 detail bytes are separate reads; synthetic mapper values, not persisted full2550 publication proof |
| Final own catalog | **16 private tables /78 helpers-bases**,0 tested RLS/raw ACL/helper EXECUTE/search_path violations; five new helpers no PUBLIC EXECUTE, invoker; Review/Guidance public RPC anon/authenticated/service = false/true/false; M59 base hash e130 unchanged |
| Canonical pgTAP42+23+23 | **UNRUN**; owned PG pg_available_extensions has no pgtap. No shim or rewritten assertion |

The original actual2550 SQL stress was **not rerun** here. Author6a's221.778s/26 pages/max50193/120000 detail/V3486884 remains attributed, separate from our pure full-scope vector, native bounded scopes and actual500000 save. The previous author100000 claim is now independently exercised above, without converting synthetic identity into real Auth evidence.

### Exact executed command families

All commands ran from this checkout with the explicit Node22 PATH. These retained commands document the completed allocation, not permission to reopen a stopped or foreign fixture.

```sh
export PATH="/Users/kanuj/.nvm/versions/node/v22.23.0/bin:/opt/homebrew/opt/postgresql@15/bin:$PATH"
export PYTHONDONTWRITEBYTECODE=1
node --experimental-strip-types --test tests/portal-review-contract.test.ts tests/portal-review-handler.test.ts tests/portal-review-guidance-fixes-handler.test.ts tests/portal-rebuild-domain.test.ts tests/portal-rebuild-handler.test.ts tests/portal-rebuild-advisor-reads.test.ts tests/portal-rebuild-advisor-handler.test.ts tests/portal-care-contract.test.ts tests/portal-care-handler.test.ts
node apps/portal/node_modules/typescript/bin/tsc --ignoreConfig --noEmit --strict --noUncheckedIndexedAccess --verbatimModuleSyntax --skipLibCheck false --allowImportingTsExtensions --target es2022 --module esnext --moduleResolution bundler --lib ES2022,DOM,DOM.Iterable --jsx react-jsx --types react,react-dom --typeRoots apps/portal/node_modules/@types src/contracts/PortalReview.ts src/contracts/PortalReviewValues.ts src/contracts/PortalReviewValidation.ts src/contracts/PortalReviewMapping.ts
node apps/portal/node_modules/typescript/bin/tsc --ignoreConfig --noEmit --strict --allowImportingTsExtensions --target es2022 --module esnext --moduleResolution bundler --types node --typeRoots /Users/kanuj/.t3/worktrees/shelv/kanuj-portal-rebuild-integration-20261030/node_modules/@types tests/portal-review-contract.test.ts tests/portal-review-handler.test.ts tests/portal-review-guidance-fixes-handler.test.ts
node --loader ./tests/portal-review-gateway-loader.mjs tests/portal-review-gateway-errors.mjs
node --loader ./tests/portal-review-gateway-loader.mjs .local-artifacts/w7-r2-303c17e5/fix-gateway.mjs
node --loader ./tests/portal-review-gateway-loader.mjs --import ./tests/portal-review-no-network.mjs --test --test-reporter=spec apps/portal/session-integration/runtime/tests/plan-channel.test.ts apps/portal/session-integration/runtime/tests/care-channel.test.ts apps/portal/session-integration/runtime/tests/manual-methods-policy.test.ts apps/portal/session-integration/runtime/tests/navigation-return.test.ts
python3 .local-artifacts/w7-r2-303c17e5/review-native.py --start
python3 .local-artifacts/w7-r2-303c17e5/fix-native.py --prepare
python3 .local-artifacts/w7-r2-303c17e5/fix-native.py --retained
python3 .local-artifacts/w7-r2-303c17e5/fix-native.py --wire
python3 .local-artifacts/w7-r2-303c17e5/fix-native.py
python3 .local-artifacts/w7-r2-303c17e5/reviewer-probes.py
python3 .local-artifacts/w7-r2-303c17e5/independent-controls.py
python3 .local-artifacts/w7-r2-303c17e5/adjacent-probes.py
python3 .local-artifacts/w7-r2-303c17e5/wire-native.py --prepare
python3 .local-artifacts/w7-r2-303c17e5/sensitivity-probes.py
python3 .local-artifacts/w7-r2-303c17e5/fix-native.py --prepare
python3 .local-artifacts/w7-r2-303c17e5/adjacent-probes.py test_a01_duplicate_schedule_stage_ids_must_not_commit_unreadable_instruction
python3 .local-artifacts/w7-r2-303c17e5/reviewer-probes.py
python3 .local-artifacts/w7-r2-303c17e5/manifest-stress.py
python3 .local-artifacts/w7-r2-303c17e5/final-audit-stop.py
```

Inspect-before-invocation covered native lifecycle/metadata/edge/SQL/resource bindings. The ignored plan helper disables inherited DB/socket/port; Review copies bind only this root/artifact/database/port/marker/socket/app name and actual source/bridge module inputs. Wire/fix/composed/sensitivity/stress copies change only input bindings. All original Review/Fix/Wire/R1 classes are AST-identical; Plan helper's two hardcoded old ports are disabled resource inputs, with assertions unchanged. Gateway copy changes only import/input paths. Diffs and hashes are preserved in adaptation-hashes.json, individual .diff files and manifest-stress-hashes.json. The initial adaptation guard rejected Plan class equality because its two disabled port literals differ; comparison was corrected to allow only those resource literals, without invoking that old resource or altering assertions. This was reviewer setup, not a product failure.

Applied Supabase/audit-context/systematic-debugging/verification workflows. The explicit no-nesting boundary superseded the audit-context skill's dispatch step. Consulted official [PostgreSQL15 function replacement](https://www.postgresql.org/docs/15/sql-createfunction.html) and [constraint-trigger](https://www.postgresql.org/docs/15/sql-createtrigger.html) documentation; actual SQL/catalog evidence establishes the results. Supabase changelog .md fetch returned unsupported content-type; no platform upgrade/live service change was attempted.

## Resource return and explicit limits

**STOPPED at 2026-10-31T15:58:39.142969+00:00.** Own PostgreSQL15.19 Homebrew, database `shelv_w7_r2_303c17e5_synthetic`, port **55518**, socket **`/tmp/sh-w7r2-026dbc31`**, marker `W7 R2 303c17e5 independent synthetic Unix-only 20261031`, PID **68938**. Data/logs/dumps retained under **`E/fixture/026dbc3100254627ad498d0b8bd7af02/`**. Actual Chicago server day2026-10-31, empty listen_addresses, Unix socket permissions0700, no TCP.

Before stopping, exact root/database/data/PID/socket/marker checks passed and pg_stat_activity showed **zero other client connections**. Only this marked server was stopped. pg_ctl status exits3, `pg_ctl: no server running`; postmaster.pid absent. Final dump **28837113 bytes**, SHA256 **`5070cf93105c877355fc950375fd5d90af32aca87fcfcd852d74c6b16e639866`**; STOP_RECEIPT.json records exact path and ownership. Failure dumps, originals and logs are preserved. No owned helper/locker remains live.

Author PG55240/55487 and `/tmp/sh-rv7a-005fdf80`, prior reviewer55492 and `/tmp/sh-w7m58-00eedd21`, parent R7/frozen57/native76, R6/R4/R5, Docker/Supabase stacks, Chrome/DOM/preview and all foreign fixture data were never opened/adopted/queried/stopped/polled. Only the specified original reviewer diagnostic files were read read-only. No provider/private credential, genuine Auth, Storage, real client/source/grant, email/funds/order or external business action occurred. Native auth.users/sessions and injected claims are explicitly synthetic, not genuine JWT verification/PostgREST.

Unrun: canonical60 reset/full pgTAP88 and complete-project migration rehearsal, genuine Auth/JWT/PostgREST/Edge/Storage/photo positives, new gateway/App/Root renderer activation, browser/visual/accessibility/human checks, full root npm test/application/test tsconfigs/Expo/native export, full portal/session build/suites, notification delivery/webhooks, full cancellation/export/retention lifecycle and exact-head CI. Natural midnight was not timed; future helper/snapshot applicability checks are labelled as such. No new full historical role/wait/context matrix is claimed beyond the concrete executed cases. Prior genuine57 and all full-goal gates remain coordinator-owned.

No source/schema/action/right/helper-HTTP predicate workaround, committed failing test, push/PR/merge/deploy, reset/rebase/foreign write or memory write. Coordinator retains TASKS/CURRENT_STATUS/CONTEXT_SYNC, source integration, fixes, canonical/genuine work and any fresh independent review. **Sole reviewer-authored tracked write and return commit: this new R2 report. Integrate its report commit only, not its nine attributed review-input commits.**

## Exact frozen candidate blobs and retained evidence

Each path below matches full author6a and assembledc6 exactly. E/blobs.json also records every SHA256. M59 SQL SHA256 `5862ab39f5ca2fd58928ee9a6be7abd3c834c86a137fe7fa5e17c5fbaff8704e`; M60 SQL SHA256 `126361a70ffbb17c00d8f341e7294c5be430e70b6647ee626d008112d760c64f`.

| Candidate-owned path | Git blob |
| --- | --- |
| `apps/portal/session-integration/runtime/server/upstream.ts` | `5af1192b52b90d61c3c8b98552eb0c4ddaf947e4` |
| `docs/portal-rebuild/research/W1_REPORT_GUIDANCE_CONTRACTS.md` | `3bf75f01a98355ca42b999097b4b65624183bc1b` |
| `docs/portal-rebuild/research/W1_REPORT_GUIDANCE_IMPLEMENTATION.md` | `4e35b15392bedcefc9ce399f9be5c38a1bc332f4` |
| `src/contracts/PortalRebuildValues.ts` | `3b034ae42f05a1f21fe9aac9b5c54e9b44243dd1` |
| `src/contracts/PortalReview.ts` | `028e6bf3bb293e68a60e472b3b6ee87f522ee3c3` |
| `src/contracts/PortalReviewMapping.ts` | `917b81da881ae8e091c2414ff4864fa936367bbd` |
| `src/contracts/PortalReviewValidation.ts` | `997afba2c0b1dd3daf129913d3c2b28d27ed5f71` |
| `src/contracts/PortalReviewValues.ts` | `c1e2191cfd0c0b015c31c6e1e4d8066d199d8dd9` |
| `supabase/functions/concierge-checkins/handler.ts` | `5c160413ae67bea9b69c879b7737798b379ee2c7` |
| `supabase/functions/concierge-guidance/handler.ts` | `b48a7d2c507b585fc81b728dd7cd1cefb77b1138` |
| `supabase/functions/concierge-guidance/index.ts` | `ec4611ae247da5722ece115f95e113ad7c6b8e9d` |
| `supabase/functions/concierge-guidance/runtime.ts` | `734be0750f0c78468c0131ff48defd869f8c315a` |
| `supabase/functions/concierge-reviews/handler.ts` | `1add119a94ed7f61f74d8e363ff94e8e08aa86ec` |
| `supabase/functions/concierge-reviews/index.ts` | `9a37c70417d96d916e09443d1330a9698dfec94e` |
| `supabase/functions/concierge-reviews/runtime.ts` | `73080e00df9b05811d556de4a25a03dbf370ffda` |
| `supabase/functions/concierge-reviews/shared.ts` | `eff030dc2a03b9657d577bf091d8f8d7b673b131` |
| `supabase/migrations/20261031091520_portal_rebuild_reviews_guidance_v1.sql` | `109404e28e33cea775252d31006e39e2c3a7bf79` |
| `supabase/migrations/20261031132531_portal_rebuild_plan_wire_budget_v1.sql` | `44a1f2e40b6fa85651dc8bc25da9d91ec2afe2c1` |
| `supabase/migrations/20261031141212_portal_rebuild_reviews_guidance_fixes_v1.sql` | `8b33057091bd32003428e01dfc3a89d2673c8983` |
| `supabase/tests/portal_review_guidance_fixes_v1.test.sql` | `923c296346f1e50bfc122b1e9658a2a5cbad7407` |
| `supabase/tests/portal_review_guidance_v1.test.sql` | `cdcb605a20f83a943063702d54cc58e409374d4e` |
| `supabase/tests/portal_review_plan_wire_budget_v1.test.sql` | `3a807a7bf319540839dc03e1e9775bd1296b74e9` |
| `tests/portal-review-contract.test.ts` | `be3c2113a52eb71602f9e5ae35456b742623f5de` |
| `tests/portal-review-gateway-errors.mjs` | `2d4355818fcce0c9e0079cbc33e3224d0b16a710` |
| `tests/portal-review-gateway-loader.mjs` | `40199646926ca9d5477052206e095544207eb24a` |
| `tests/portal-review-guidance-fixes-edge.mjs` | `d105e7cf392a02739e30f29cf72cf4a8d2154ffe` |
| `tests/portal-review-guidance-fixes-gateway.mjs` | `99707368804729592ec4b33431a963cf74625a64` |
| `tests/portal-review-guidance-fixes-handler.test.ts` | `996fa85bdeff92884300adb79e055682e43ca902` |
| `tests/portal-review-guidance-fixes-native.py` | `799aea72b7a70ed82f512a4080b49c89c866f818` |
| `tests/portal-review-handler.test.ts` | `b118d89bd5af261f7238cee88f8c33c37cff60d5` |
| `tests/portal-review-manifest-stress-native.py` | `e00af70316bc040e6ff6902d00ddb6903d79c6f9` |
| `tests/portal-review-native-edge.mjs` | `7b87e1c14a434811401ea04357fa7ec197fb8d11` |
| `tests/portal-review-native.py` | `784a3a5327ca13ed20805024ce1dfe336c91bc9d` |
| `tests/portal-review-no-network.mjs` | `f538c93cabf78baec72ad50bfcb88d958dc0e2a5` |
| `tests/portal-review-sql-metadata.mjs` | `32f0f6aa7326d43da7764cac3dd61a4d3c24b4e8` |
| `tests/portal-review-stress-native.py` | `2e7d6fc1add63f8e218bcd9823637c1a86a6aa33` |
| `tests/portal-review-wire-budget-native.py` | `7e11a1e4e1a42acf20133698e046a43466d29fcd` |

| Key artifact relative to E | SHA256 |
| --- | --- |
| `runtime.json` | `8f1febe8476b52342438b60f89ec1e63fe2d64c84a3a703ef370c9415a21bc55` |
| `task-record.json` | `d4d3ba7c696e61c3d6a33c7fb5f19af1f6dc812b1ebcfa3a246713fa32a3beb9` |
| `blobs.json` | `b70edd864bcab95f517a62a6d0a0c2721eceaca49607772432188e6b0d3fd3a8` |
| `migration-preservation.json` | `1980a2d560c5c394c711ad0b029c789ead65552478dc941fb43c0949846e4eda` |
| `adaptation-hashes.json` | `6fae3cf9173a62f03c691b6e291b73c589aea1d7d75d87f3b895c0c9114d386f` |
| `source77.log` | `2435fe419ee69c2e5bf5259378a6c2a1a701fc26176c50df45d9b4175f7c417b` |
| `native33.log` | `10903f300ddb0621fc655c52f963c39a14382bd04b1d847cdea1469f548f373a` |
| `sensitivity-red3.log` | `519b78bc38f4ee726ff7884d26ae65605e78aa19b3fc07d643f1e86b4168ea0a` |
| `a01-first-duplicate-stages.json` | `39cbc62e474111df008adbdec67630389d08902f36f537f73d54f83b3667bc21` |
| `a01-duplicate-stages.json` | `d120844f8c78d2d0c2f3731f24cd3a403f647ad31706c806e5640798db6b83ad` |
| `manifest100000.log` | `8fa059d187b17ef56a886b5b54b953a21fa5e40ea547d345de5ad7f3c30c4e6a` |
| `pre-stop-audit.json` | `b0caa697a749ae9dd9e082fc5bf05d38ddfba5854cd10b151cae599bf02a9e9f` |
| `STOP_RECEIPT.json` | `4c527d51d593c9ca0635a16e16a830215f3ec4c3dad9f1bdfcea7f687fbece3f` |
| `verification-hashes.json` | `089de44ad4a0d470e3d184fb068e07251df96a7063322d7c81425de09918e43e` |

These local ignored artifacts are preserved in this checkout; integrating the report does not transfer them or authorize reopening the stopped fixture. The final report commit is returned after sole-path/link/diff/clean-tree verification, avoiding a self-referential hash.
