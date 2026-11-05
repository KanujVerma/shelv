# W7 independent CN1 forward history-filter review

Owner: Kanuj. 31 October 2026. Report-only review of exact integrated parent **`5ed04da7714c28d983a413d33269a086165b5c35`**. No nested agents or production fixes. Own minimal PostgreSQL is **STOPPED before report writing**.

## Separate verdicts

- **Specification: PASS for the bounded CN1/M57 correction. CN1/P2 is ADDRESSED in source and isolated actual-handler/SQL verification.** Historical frozen M56 fails the intended correct assertions; forward M57 passes them without weakening the Root mapper.
- **Correctness / quality: scoped PASS.** New9, retained26, legacy11, focused37, independent3 groups,54 SQL boolean controls, direct fixture11 vectors, strict types and preservation/catalog checks pass. No new reproducible in-scope objection was found. Counts overlap and are not a portal acceptance total.
- **Genuine care, UI activation, full goal and release: NOT ESTABLISHED here.** Fresh canonical57 reset/full35 pgTAP files, genuine Node/browser acceptance and exact-head CI remain parent gates. No R6 patch/reset/adoption or new R7 preparation occurred.

The original [CN1 review](W7_CARE_GENUINE_NODE_REVIEW.md) remains valid historical evidence: genuine client and advisor unfiltered200 versus exact reported-product filtered503/unavailable, raw8 entries with7 unrelated within the same authorized client. That is a filter correctness defect with fail-closed mapping, not a demonstrated cross-client leak or approval bypass. The strict mapper remains unchanged.

## Exact task, source and runtime

| Item | Verified evidence |
| --- | --- |
| Workspace / branch | `/Users/kanuj/.t3/worktrees/shelv/t3-d23ee91d` / `t3/care-history-filter-review` |
| Clean starting and tested application head | `5ed04da7714c28d983a413d33269a086165b5c35`; production source stayed at this head throughout |
| Author / integration | `e121a8774625746432773697bf1a75c0c6b22b13` / `5ed04da7714c28d983a413d33269a086165b5c35`; all four delivered blobs match exactly |
| Fix author's starting base | `54623e9145d28df4e749fb3502db9c33f18efe7a`, already in this history; its56 migration files and347 pre-existing root/portal/SQL test files remain byte-identical |
| Original CN1 source / report integration | `0201d90e53179966888c0cfb2dcbcfe56bed5fb7` / `54623e9145d28df4e749fb3502db9c33f18efe7a` |
| Parent / project, live thread readback | `d632030a-18f7-4dec-a2c9-f5c0418c3fd5` / `ac0af19d-d404-4f53-a870-02bfd76c2a80` |
| Delegated round / task correlation | `portal-rebuild-w7-care-history-filter-review-20261031-r1`; correlation handle `node:delegated-task:command%3Amcp%3A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%3Adelegate-task%3Aportal-rebuild-w7-care-history-filter-review-20261031-r1`. This base's committed TASKS ledger has no new-round entry; parent owns recording it |
| Actual child thread | `thread:delegated-task:command%3Amcp%3A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%3Adelegate-task%3Aportal-rebuild-w7-care-history-filter-review-20261031-r1` |
| Actual run, live readback | `run:thread:thread%3Adelegated-task%3Acommand%253Amcp%253A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%253Adelegate-task%253Aportal-rebuild-w7-care-history-filter-review-20261031-r1:ordinal:1` |
| Both live runtime tools | `orchestrator_capabilities` and `t3_thread_configuration`, before substantive work and again after resource return: **codex / gpt-6.1-sol / reasoningEffort=xhigh / serviceTier=default**, full-access/default interaction |
| Supported descriptors | Reasoning low/medium/high/xhigh/max/ultra, catalog default low; service default/priority, default default. Effective xhigh/default is explicitly selected |
| Actual configuration | Global selected model/effort, project model/default-subagent settings and eight role TOMLs are Sol/xhigh. Parsed/hashes retained for w0_foundation, w1_plan_platform, w2_advisor, w3_client_plan, w4_checkins_history, w5_orders, w6_account_service, w7_verification |
| Node / PG | Explicit `/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node`, verified **v22.23.0**, including every bridge invocation; `/opt/homebrew/opt/postgresql@15/bin`, PostgreSQL15.19 Homebrew |
| Freshness boundary | Resume inspected actual Git/status/log/root and portal AGENTS. Local `origin/main=d39a7d4943209080df7c4cf97d85784f462758bf`, initial divergence151/0. No remote fetch/currentness/CI claim, checkout, rebase, reset or import |

Capabilities' parentThreadId names this child in this harness; actual parent identity comes from live thread readback. This is the sole authored tracked path. Its containing report-only commit is returned in the handoff; obtain it with `git log -1 --format=%H -- docs/portal-rebuild/research/W7_CARE_HISTORY_FILTER_REVIEW.md`.

## Requirements and inspected boundary

Read the complete [original Node review](W7_CARE_GENUINE_NODE_REVIEW.md), [W1 history correction](W1_CARE_HISTORY_FIX.md), [W6 genuine report](W6_CARE_GENUINE.md), [CARE_API](../CARE_API_V1.md), [W1 care implementation](W1_CARE_IMPLEMENTATION.md), [legacy fixes](W1_CARE_FIXES.md), [care backend R1](W7_CARE_BACKEND_REVIEW.md), [R2](W7_CARE_BACKEND_R2.md) and [transport response](COORDINATOR_CARE_TRANSPORT.md). Read the original95388-byte approved input, D01-D48, full desktop specification/manifest, implementation contracts, acceptance, ownership, workstreams and current status. The separately read appendices equal their original input sections, and all five imported original byte counts/hashes match INPUT_PROVENANCE.

Earlier prospective status lines saying M57 is only allocated and older resource/UI states are stale relative to actual Git and this task's newer explicit boundaries. They confer no resource authority. Per the current task, parent care UI baee closes CU1/CU2 within its separate review, while new CU3 has an active W3 fix. This review neither executes nor accepts that UI work; application activation remains separately gated.

Applied Resume, Supabase guidance and verification-before-completion. Consulted the current Supabase changelog and relevant15.19 notice; no platform change is needed for this native review. [PostgreSQL15 operator precedence](https://www.postgresql.org/docs/15/sql-syntax-lexical.html#SQL-PRECEDENCE) and [CREATE OR REPLACE properties](https://www.postgresql.org/docs/15/sql-createfunction.html) support the interpretation; executed SQL/catalog checks below are the actual implementation evidence.

Inspected the full new migration/native/pgTAP files, the entire old history/cursor/product-match/use-event helpers, Root parser/positive mapper, actual Care/Plan handlers and runtime, persisted event insertion/subject/replacement fields, final guard path, retained native setup and relevant old cases. The reviewer-generated copies change only own checkout/import/artifact paths, socket/database/port/marker/application-name bindings. They do not weaken assertions or production source. Ambient PG credentials/options are cleared.

## M57 correctness and preserved semantics

[M57](../../../supabase/migrations/20261031073004_portal_rebuild_care_history_filter_v1.sql) uses `CREATE OR REPLACE` with the same private signature `concierge.care_history_page(uuid,jsonb,text,integer,bigint)`. Excluding the declaration's `or replace`, the complete function differs from frozen M56 by **one body line only**. That line tests original membership OR current use-amendment replacement OR reported creation's nested initial-use amendment replacement, followed by `IS NOT TRUE`.

The `IS NOT TRUE` applies to the parenthesized membership expression before the outer `AND`. Missing optional candidates become nonmatches. A true original/replacement survives other SQL-NULL branches. JSON-null product bypasses filtering. Independent54 controls cover all27 true/false/NULL combinations with both filtered and unfiltered inputs. There is no broader membership alternative.

| Pinned behavior | Independent evidence |
| --- | --- |
| Plan product | Null slot aggregates only the exact publication/schema/product. Nonnull slot is exact. Equal-descriptor current-use carry does not broaden history; new publication with no exact events returns empty |
| Use originals and separate amendments | Original entry matches immutable original or **current** replacement. Separate amendment matches its own replacement only. New chained-amendment controls retain prior amendment entries while excluding their former target from the original's current membership |
| Identity | SQL `r.product` is populated from `target.subject`, matching Root. A comparison alone does not select the identity entry |
| Reported creation/correction | Descriptor creation matches original descriptor or nested initial use's current corrected product. Descriptor corrections have `initialUse:null`; they do not admit unrelated rows. UUID and descriptor version remain exact, including two successive product-changing nested corrections |
| All four kinds / NULL paths | New9 plus independent persisted vectors exercise use, identity, descriptor and amendment; unamended/missing-path and correction-null cases return exact rows through both actual client/advisor actions without crashing |
| Invalid/nonexistent filters | Missing slot/version/publication fields, null version, unknown keys and malformed refs return400/invalid_input. Unknown same-client product returns404; valid all-unrelated contexts return200/empty. No universal fallback |
| Bounds and cursor | Nonmatches skip before item count/400000-byte budget. Existing1..100 bounds and owner/filter/head cursor identity remain. Interleaved pages are complete/unique, without empty continuation, duplicates, skipped matching rows or infinite cursor; changed filter/head conflicts |

Direct private SQL `p=NULL::jsonb` remains noncanonical and behaves unfiltered in the exercised control, like before. The JSON API accepts explicit JSON null or a fully parsed ProductRef; missing/malformed product fields are rejected. The helper is not callable by anon/authenticated/service_role. This is not a new role bypass or an API filter mode.

Root DTOs, mapper, actions, response/budget constants, gateway, service/owner/care-window/after-wait logic, metadata and rights are unchanged. No data/seed/grant statement, SECURITY DEFINER, public helper, task/source authority or UI activation is added. All56 prior migrations, including M56 SHA **`d3a889ab03cba381cd8d2d65b8b567db74ac5f19e6000a0e913c78982fe901e1`**, remain exact. M57 SHA **`26c9c403729343b1f3463002f26946fbdea81e73df2e13d7882bcf6cb2571caf`**; actual stored `prosrc` SHA **`ccc5c769ad8daea4405e4b3055af32fdcb30a8f37c34345c1423f796d626ed8b`**, equal to the delivered source body.

## Historical sensitivity and executed results

The real Care handler, strict parser, positive Root mapper and authenticated-role SQL execute. The real Plan handler executes in retained cases. **Auth identity/session claims and prerequisite tables are synthetic**; there is no genuine Auth/served Edge/PostgREST acceptance in this fixture.

Before any M57 apply, frozen d3 M56 produces **3 assertion failures/0 errors**, exit1: direct SQL returns4 rows instead of the exact1, and both client/advisor handlers return exact503 `{code:'unavailable'}` where correct expected status is200. The same test's unfiltered200 and no-mutation controls succeed. This is the CN1 mechanism with correct assertions, not an import error or a diagnostic expecting bad outcomes.

| Executed check | Result / exact scope |
| --- | --- |
| Populated forward rehearsal | Minimal15 concierge prerequisites +54/55/frozen56; preserved original R1/R2/intake/private text, actual synthetic legacy Start/receipt/payment/coverage/entitlement rows and mixed care ledger. M57 apply preserves **every complete row in every auth/public/storage/concierge table**. Entire public/concierge pg_proc comparison finds only history `prosrc` changed; same OID/owner/ACL/search path and every other property |
| Same populated fixture after apply | Client/advisor exact filtered503 ->200 with one correct entry. Both unfiltered response bodies remain identical. Original legacy and financial rows remain exact |
| New native suite | **9/9**,0 failures/errors/skips,33.348s; actual distinct client/advisor actions, missing optional paths, original/replacement, exact identities/contexts, owner/read-only/role and pagination/bytes |
| Retained native suite | **26/26**,0 failures/errors/skips,44.260s; original assertions, including source/session/cancellation lock waits, CAS/retry/queue rollback, dependencies/deferred guards, exact owner/identity, carry and truthful v1 refusal |
| Retained legacy suite | **11/11**,0 failures/errors/skips,44.020s; CB1/CB2 actual R2/V3 chronology/representability, timezone/compatible controls, amendments and preservation |
| Six focused Root files | **37/37**,0 failures/skips,780.565ms; unchanged care/plan/advisor contracts/handlers, near500k/50-state mapping and exact400000/400001-byte tests |
| Fresh independent groups | **3/3**,0 failures/errors/skips,14.446s. Six explicit hand-expected persisted membership vectors with two amendment generations, all four event kinds, exact versions and comparison negatives. Actual raw SQL results also pass unchanged Root `mapCareResult`; client/advisor1-item pages match every expected vector. Missing-field/role/SQL-null controls and54 SQL boolean/precedence controls pass |
| Byte stress |15 matching entries from22 interleaved events, requested100; actual page bytes356987/355800/355800/177872. Complete and unique; client/advisor and1-item pages pass, each valid single entry fits |
| Reapply | M57 applied again as SQL: all complete table rows and entire function catalog identical. Read/reapply checks create no event/head/notification/Start/status/guidance mutation |
| Final catalog |13 care/26 plan/14 task actions; private helper/search-path violations0, raw ACL/RLS violations0. Public Care/Plan RPC matrices anon/authenticated/service_role = false/true/false |
| Strict compiler | Bounded Root TS6 strict/noEmit/ES2022/bundler/allowImportingTsExtensions check exits0, no diagnostics; actual four care modules, six focused files/imported handlers/runtime, parent compiler/types read-only. Actual frontend/session checks both exit0, no relaxed flags |
| Canonical pgTAP file | Read all24 assertions in81 lines. **pgTAP runner NOT executed**, installed Homebrew PG reports no extension. Its actual fixture setup plus11 literal direct membership/count vectors execute successfully and roll back. This is not canonical pgTAP acceptance |

Own setup correction is retained separately: the first independent chain tried writing A/v1 after creating A/v2 and correctly received409/identity_conflict. The probe now records v1 use/amendments before descriptor correction, then v2 amendments; intended membership assertions remain. First attempt1 failure/0 errors is **setup**, not a production finding or acceptance. No production change or assertion weakening follows. The author-native9/retained26/legacy11 runs required no setup correction here.

Existing Node MODULE_TYPELESS_PACKAGE_JSON warnings remain in focused tests. No dependency/configuration/flag change. Portal-only locked offline install added130 packages with scripts disabled; no Root install. The initial skill lookup used an absent path before reading the catalog's correct plugin path; changelog web open rejected text/markdown, then curl saved the actual index. Neither is product sensitivity.

## CN1 artifacts and retained objections

Read/copied the five expressly allowed original artifacts from `/Users/kanuj/.t3/worktrees/shelv/t3-ee51c8b5/.local-artifacts/w7-care-node-review/` into this review's own ignored area, with `original-` prefixes and mode600. Copies are byte-identical. Raw synthetic JSON was read internally; token/private-file values were not printed or placed in tracked content. Original scripts were not executed against their former resources.

| Original copied artifact | Verified SHA-256 |
| --- | --- |
| additional.mjs |15e2b28f2c285338f95afb692a282e150d393c37c921d955ee5e5c0f41ee5150 |
| additional-result.json |1f5cd208523a2471c25d6b437f7c33ca3ff0351bd078af7151d1fef01842c7f5 |
| history-diagnostic.mjs |b8e3a27231602f00acf42f49cc0d4f4284abe6b2ccb5510e6d468ae689ed6ea3 |
| history-diagnostic.json |d6dff0956606638668df3a62eee085d83afecf0e5b26c8a29aaaa6a522f305c6 |
| history-raw-filtered.private.json |45eeed83a505b4fa67ce404d23e4445b9079c015ab6e14020caf0a541e883184 |

| Earlier finding / boundary | Disposition retained |
| --- | --- |
| CN1/P2 | **ADDRESSED in this bounded forward-source/SQL/handler review.** Genuine R7 filtered client/advisor acceptance remains a separate unexecuted parent gate; frozen R6 evidence is not rewritten as green |
| CB1/CB2 | Original R2 scoped closure retained;11 freshly passes. No automatic winning truth, revived stopped use or invented legacy Start |
| Backend F1-F5/Q1-Q2 and wait findings | Prior qualified dispositions retained; unchanged guards and retained26 pass. Original76-case backend matrix not recertified |
| H1/H2 and product-free genuine13/readonly4 | Historical scoped evidence only; no readiness fault injection, credential-byte browser scan or new genuine claim here |
| C1/AR1 / App A1-A3 | Qualified earlier dispositions remain, including A2 ordinary-restore/browser reachability unproven and the original pending-after-valid-ack expectation being incorrect. No controller/fetched-object/view/epoch change |
| CU1/CU2 / new CU3 | Separate UI review/fix ownership per latest task. No Chrome, DOM or care UI verdict here; no application activation |
| Approval/payment/publication/source/privacy | No broadened grant, source access, label completion, first-service/Start/receipt or money action. Raw uploads/consent/retention/export, human publication authority and actual email delivery remain independent. Queued jobs are not sent/delivered/read email |

Parent/reviewer-attributed R6 return remains **07:26:55.022039UTC**,11 sessions closed/whole0/0,205 protected files unchanged, five helpers/source76 exact. This review does not access or re-attest those resources. Canonical56/34 pgTAP772 and Root1213/types/export PASS remain at their recorded source, not newly verified57 or full-care acceptance.

## Commands, evidence and resource return

Evidence root **`/Users/kanuj/.t3/worktrees/shelv/t3-d23ee91d/.local-artifacts/w7-care-history-filter-review/`**, abbreviated E. Exact adapted source, setup/failed/green logs, raw private preservation snapshot, original/copy hashes, runtime/config/input/source receipts,54 controls and direct vector results remain there. E is a path abbreviation, not a shell variable.

Commands from this checkout root after allocating the fresh RUNNING receipt, with explicit Node22.23.0/PG15 PATH and `PYTHONDONTWRITEBYTECODE=1`:

```sh
python3 .local-artifacts/w7-care-history-filter-review/history.py --prepare-baseline
python3 .local-artifacts/w7-care-history-filter-review/history.py --red
python3 .local-artifacts/w7-care-history-filter-review/history.py --preservation
python3 .local-artifacts/w7-care-history-filter-review/history.py
python3 .local-artifacts/w7-care-history-filter-review/adjacent.py
python3 .local-artifacts/w7-care-history-filter-review/history.py --retained26
python3 .local-artifacts/w7-care-history-filter-review/history.py --legacy11
python3 .local-artifacts/w7-care-history-filter-review/pg-fixture-vectors.py
python3 .local-artifacts/w7-care-history-filter-review/audit.py
python3 .local-artifacts/w7-care-history-filter-review/stop.py
/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node --experimental-strip-types --test tests/portal-care-contract.test.ts tests/portal-care-handler.test.ts tests/portal-rebuild-domain.test.ts tests/portal-rebuild-handler.test.ts tests/portal-rebuild-advisor-reads.test.ts tests/portal-rebuild-advisor-handler.test.ts
PATH=/Users/kanuj/.nvm/versions/node/v22.23.0/bin:$PATH npm --prefix apps/portal run typecheck:rebuild
PATH=/Users/kanuj/.nvm/versions/node/v22.23.0/bin:$PATH npm --prefix apps/portal run typecheck:session
/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node /Users/kanuj/.t3/worktrees/shelv/kanuj-portal-rebuild-integration-20261030/node_modules/typescript/bin/tsc --ignoreConfig --noEmit --strict --allowImportingTsExtensions --target es2022 --module esnext --moduleResolution bundler --types node --typeRoots /Users/kanuj/.t3/worktrees/shelv/kanuj-portal-rebuild-integration-20261030/node_modules/@types src/contracts/PortalCare.ts src/contracts/PortalCareValues.ts src/contracts/PortalCareValidation.ts src/contracts/PortalCareMapping.ts tests/portal-care-contract.test.ts tests/portal-care-handler.test.ts tests/portal-rebuild-domain.test.ts tests/portal-rebuild-handler.test.ts tests/portal-rebuild-advisor-reads.test.ts tests/portal-rebuild-advisor-handler.test.ts
```

Source-only focused/types were independent of the serial DB lane. The displayed block groups commands by purpose, not their exact interleaving. The first independent attempt is preserved as `adjacent-invalid-setup.py/.log`; final3 is separately retained. Initial bootstrap/guard adaptation and static audits ran as inline Python in tool history, with initdb/start logs/STARTED receipt/source hashes retained. These commands are an execution record: the receipt is now STOPPED, so **do not blindly restart/adopt it or another fixture**.

Own minimal PG15 data **E/pg/data**, socket **`/tmp/sh-hfr-d23-79ce1fcf`**, port55483, database `shelv_hfr_d23_synthetic`, marker `W7 CN1 d23 independent synthetic Unix-only 20261031`, PID34663. `listen_addresses=''`,12 connections/16MB shared buffers, no TCP. No old author/reviewer/fix PG is reused.

**STOPPED at `2026-10-31T08:01:38.520245+00:00`.** Fresh exact data/socket/port/marker/PID/process-command checks, empty listen_addresses,0 TCP handles and **0 other client connections** preceded `pg_ctl -D <own-data> -m fast -w stop`, exit0. Fresh status exit3/no server running; postmaster.pid/socket/owned PID absent. All test/SQL/subprocess handles closed normally. Data/logs retained; no broad kill or deletion. No DB/resource calls follow return.

| Artifact under E | SHA-256 |
| --- | --- |
| red-cn1.log |c1be3e0c6f9b962e8a530280c70aeb25a1d0a283e51aa56fca86e418785f4b4e |
| green9.log |66f5fb267698be8c80c3818439bb5230ba96e241ac623ca24962e7d6891aea7d |
| retained26.log |7e060b574e8bf33fa84668b7da497d2de088067eabdc841836643ccab1f3efe5 |
| legacy11.log |5d192d6a3e37dcf65d955b1cd4a1cac1e53ffa5e9f57f715bd9bce2d3e26b7bd |
| focused37.log |210c353b8a80c9e557344cc27155f1c1488416a8d67fa92bb6ce9292dd7a60d8 |
| adjacent.py / adjacent.log |e24235087694d21c9ed424ccbd50465daab5c3c139c479f3cae1fc49e5169934 /8f9a4895651b9c103911e5ca84439bb813354c0096909b6eeefba537c2e55f18 |
| sql-totality.json |2af55a09e2d2069a875446e05f24c51a7dec311a8351097573df564198e70db7 |
| migration-preservation.json |a2bbd4489c1c5e8dc46e32e250f48011b1f4e7ec5a321a6bd188613950f82c8a |
| preservation-http.json |d9b011726d4b9350ac1b8cb84a7c3b3fae32b10ce87212da0f921744bccc6874 |
| final-catalog.json |ec3afff5e10c5d28071e961f53bb5a714e0f5199e2fa0af1e4021444a03ea32a |
| pg-fixture-vectors.json |8a54d4338254271b78caec404d1a901f633f025472da55f2895f5f36b8647203 |
| STOPPED.json |d5d972dd99d184b489cd0f7f864f0c4a6003c820d63c32876351a56e724b220d |

Final report checks validate relative links, all listed hashes, sole owned tracked scope and `git diff --check`. No canonical Supabase reset/pgTAP/security-advisor run, actual Auth/native Edge/PostgREST/cookie/Vault/Storage/walkthrough/source upload, browser/Chrome/DOM/preview, full Root/portal/session runtime/build/Expo/iOS, exact-head CI, visual/accessibility/human/medical/legal/licensing or release acceptance is claimed. No Docker/Colima, parent credentials/helpers/lifecycle, R4/R5/R6/R7 resource access, real client/source/permission/message/email/money/purchase/retailer action, nested task, production fix, push, PR, merge or deployment occurred.

Only this report is committed. Parent owns integration, TASKS/status/CONTEXT_SYNC, the fresh canonical57/genuine acceptance and all remaining report/guidance/source/template/commerce/account/delivery/demo work. This returns the bounded review slot without completing the full goal.
