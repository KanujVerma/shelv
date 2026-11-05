# W7 CI recovery diagnosis for published 17d2

Current status: the separately approved nine-path test-input repair is implemented and locally verified below. Parent integration and fresh exact-head CI remain required. The complete approved portal goal stays open.

The initial diagnosis below is preserved as historical before-pin evidence; its unchanged original draft is retained in the ignored evidence directory. At that initial checkpoint no production or original test file had changed.

## Identity and frozen scope

- Workspace: `/Users/kanuj/.t3/worktrees/shelv/t3-03cd9dd1`; branch `t3/w7-ci-recovery`.
- Allocation base: `3bd152a259b7b9b9971caa1546e65f69de12aab9`. Its only differences from published `17d2c61768caccc5590343c5ae7e51cbaed72667` are the two notification review reports. All six proposed test inputs match published source exactly.
- Actual authoritative taskId: `node:delegated-task:command%3Amcp%3Add730894-0fab-4a94-873d-743422eae122%3Adelegate-task%3Aportal-rebuild-w7-ci-recovery-17d2-20261101-r1`.
- Separate backing threadId: `thread:delegated-task:command%3Amcp%3Add730894-0fab-4a94-873d-743422eae122%3Adelegate-task%3Aportal-rebuild-w7-ci-recovery-17d2-20261101-r1`.
- Actual runId: `run:thread:thread%3Adelegated-task%3Acommand%253Amcp%253Add730894-0fab-4a94-873d-743422eae122%253Adelegate-task%253Aportal-rebuild-w7-ci-recovery-17d2-20261101-r1:ordinal:1`.
- Live self and actual Parent `d632030a-18f7-4dec-a2c9-f5c0418c3fd5` configuration select `codex/gpt-6.1-sol/reasoningEffort=xhigh/serviceTier=default`, full-access/default interaction. Live catalog advertises those exact options. The catalog caller field named parentThreadId identifies this child; actual parentage is established independently by the self thread record.
- Project `ac0af19d-d404-4f53-a870-02bfd76c2a80` has saved default selection null, distinct from effective thread settings. Own and Parent project configuration plus all eight role files parse as Sol/xhigh, max8, with matching hashes. No settings/model change or nested task.
- Every local Node invocation explicitly uses `/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node`. Host Root selected22 and actually used22.23.4; portal explicitly selected and used22.23.0. That difference is recorded, not asserted as the failure cause.

Applicable root/portal instructions, rebuild entry point, decisions, full desktop specification, implementation contracts, workstreams, current status and acceptance matrix were read. Systematic debugging governs diagnosis; verification-before-completion governs result claims. Prior CI memory supplied provenance cautions only; current failures and identities below come from freshly preserved host/source evidence.

Only this new report and own ignored evidence are presently owned. W0's Auth transport/shared metadata, W1's Root check-ins/inventory/operations runtime/new SQL and Source UI prefixes remain outside this write-set. Parent physical drift and dirty TASKS are not imported.

## Exact host source and workflow

Read-only host responses confirm [PR211](https://github.com/KanujVerma/shelv/pull/211) is draft/open, head17d2, base `8ac0826f79b4299b0249c5e18003b6ce08593c60` on PR210. PR210 is open and not draft. This distinguishes the actual stack state from shorthand in the brief.

Both failed runs are pull_request attempt1, created2026-11-02T00:50:23Z. The checkout logs show `--depth=1` and executed merge `582c46b497ba17edec7803a8a073729e104adcc4`. Fresh Git API metadata gives parents8ac0826f and17d2 and tree **`3cccbfd7504d39903156a779c7ae71a92c0fcde0`**, exactly equal to published17d2's tree. This is exact tested-tree correspondence, not merely a head-SHA label. Local3bd adds only the two reports.

Actual tracked `.github/workflows/ci.yml` runs Root `npm test` before both typechecks and Expo export. Actual `.github/workflows/portal.yml` builds the retained package, strict frontend and isolated actual application before serial `npm test`; session/backend/native/admission checks follow that suite. No workflow change is proposed.

## Actual failure predicates

| Check | First material predicate | Actual result and scope |
| --- | --- | --- |
| [Verify & Build, run41369294407/job125036102790](https://github.com/KanujVerma/shelv/actions/runs/41369294407/job/125036102790) | Module initialization at `tests/portal-notification-journal.test.ts:11` executes historical `git show e89f83ed...:<notification migration>`. That historical object is absent in the shallow host checkout. Git exits128. | Root `npm test` step exits1; the file's tests never start. Both Root typechecks and Expo export are **skipped**, not failed or passed. Earlier test files ran, but no aggregate full-suite pass is available. |
| Portal subtest1281, `rebuild-app-browser.test.mjs:384` | `/maya` body must match `/fictional demo/`; actual mounted public sample body begins `fictional staged sample` and includes the explicit no-send/purchase/payment disclaimer. | A stale literal causes `ERR_ASSERTION`. The first `/maya` case fails before `/missing` and PKCE checks in the same body. This failure is not evidence that those later behaviors fail. |
| Portal subtest2168, `rebuild-photo-head-closed.test.mjs:176` | Whole-graph JS comparison asks Git for `b42742a1` handler bytes. | Git128, invalid object name. Emitted-byte equality assertion is not reached. |
| Portal subtest2179, `rebuild-photo-head-rpc-bound.test.mjs:193` | PH1 AST/emission comparison asks Git for `d2261941...` operations runtime bytes. | Git128, historical path unavailable. The source AST and emitted-change predicates are not reached. |
| Portal subtest2186, `rebuild-photo-head-source.test.mjs:98` | Old-AST preservation asks Git for `d4125cca...` command bytes. | Git128, historical path unavailable. The first comparison is not reached; this is not an observed production AST difference. |
| Portal file failure121, `rebuild-photo-head-strict.test.mjs:15` | Module initialization asks Git for the complete tracked-path inventory at `d4125cca...`. | Git128, not a tree object. All three tests in that file remain unexecuted. No compiler/type defect is established by this failure. |

The portal suite actually reports **2743 tests,2738 pass,5 fail,0 cancelled,0 skipped**. The file-level strict failure contributes one failure; its three declared tests are not individually counted as executed. Build combined package, strict frontend types and isolated actual application all succeeded. Synthetic diagnostic upload succeeded. Every subsequent approval/session/backend/native SQL/check-in/payment/empty-routine/local Auth+Chrome admission step was skipped.

The four photo-head tests also contain opt-in historical reads that must receive the same immutable inputs if repaired; replacing only the first throwing read would leave the test packaging incomplete.

## Root cause and bounded controls

The shared packaging defect is reliance on local historical commit objects in ordinary tests. The exact checkout is shallow, and three required originals are not even ancestors of published17d2:

| Original | Published17d2 ancestry | Purpose |
| --- | --- | --- |
| `e89f83ed3d4149dfaabf10d30aa3fa5b1dba59c3` | no | Notification migration before N1 bounded delta |
| `d4125cca52cb21d0c0a79a5733662f782a0dea76` | yes | Pre-photo-head sources and complete old tracked-path inventory |
| `d4a3314ecd81e4c3b544a8919834429e90c05d06` | yes | Handler after separately admitted annotation prerequisite |
| `b42742a190fb55e1b2339c0017472dea03ea4e78` | no | Whole-graph annotation-erasure preimage |
| `d226194115fd5917afa591f478e4c20836bc54a8` | no | Operations runtime before PH1 fixed4096-byte response budget |

Consequently `fetch-depth:0` is not a complete supported repair: ordinary branch history does not include all required author originals. No remote fetch, history rewrite or fallback to current bytes is proposed.

The original notification test was run unchanged with explicit Node22.23.0 and an **own empty bare Git store** supplied through GIT_DIR/GIT_WORK_TREE. It reproduces the exact historical-read error at line11, Git128, zero tests started; this local Node invocation exits7, unlike the host shell step's1. With the ordinary local Git store and the exact same unchanged file, it passes **8/8**, exit0. These are raw packaging/environment controls, not RED/GREEN for an implemented repair and not genuine SQL/Auth tests. Its production imports were inspected before execution; all HTTP facts use its finite injected fetch, and global external fetch is denied by its hooks.

The actual `/maya` source at `apps/portal/src/features/walkthrough/maya/view.tsx:25` authors `fictional staged sample`, and existing five-stage/application tests already assert that label. The proposed literal replacement retains an explicit fictional/staged label assertion and the original zero-Auth-call, missing-route, PKCE and history predicates. No production copy change, regex alternative, timeout change or skipped branch is proposed. Local browser reproduction is unrun because no browser grant exists.

## Successful database coverage, with limits

[Database & Integration, job125036102992](https://github.com/KanujVerma/shelv/actions/runs/41369294407/job/125036102992) completed successfully. Its full job/step/log responses were read rather than inferred from the green badge. It starts a local Supabase stack, runs `supabase db reset`, applies the notification `20261101191527` and photo-head `20261101195359` migrations, then passes **42 pgTAP files /1028 tests**. Both `portal_rebuild_notifications_v1.test.sql` and `portal_rebuild_photo_head_v1.sql` are explicitly listed as ok. OTP and the named scanner/legacy integration harness steps also succeed.

This is real hosted-CI local-stack migration/pgTAP evidence for the equal17d2 tree. It supersedes an inference that those migrations were wholly unexecuted, but does not supply the skipped portal session/native/admission/browser steps, a new worker-local reproduction, financial/provider delivery, full current UI integration or release acceptance. No local database/Auth/Storage/service was started or contacted by W7.

## Exact proposed file claims, not yet authorized

Modify only these six existing tests:

1. `tests/portal-notification-journal.test.ts`
2. `apps/portal/tests/rebuild-photo-head-closed.test.mjs`
3. `apps/portal/tests/rebuild-photo-head-rpc-bound.test.mjs`
4. `apps/portal/tests/rebuild-photo-head-source.test.mjs`
5. `apps/portal/tests/rebuild-photo-head-strict.test.mjs`
6. `apps/portal/tests/rebuild-app-browser.test.mjs`

Add only these three test-support files:

7. `tests/helpers/portal-ci-baselines.ts`
8. `tests/fixtures/portal-ci-baselines.json`
9. `tests/portal-ci-baselines.test.ts`

Retain this sole report, `docs/portal-rebuild/research/W7_CI_RECOVERY_17D2.md`, and own ignored evidence. The plan was sent to Parent before any original test/source change.

The proposed JSON contains complete historical input bytes, full commit/path/blob/length/SHA256 provenance, and the exact old tracked-path inventory. A shared loader verifies identity and bytes, replaces only historical Git input and fails closed on a missing required snapshot. Strict compiler host behavior must still distinguish paths absent from the original tree from missing captured bytes of a tracked historical input. Complete effective compiler closure must be determined and verified before claiming this repair works. All original assertions, data, compiler flags, code budgets, ABI and output comparisons remain; only the one Maya label literal changes. New packaging controls must establish source/blob/hash equality and function in an empty Git store, with meaningful tamper/missing-input rejection. No current source may be substituted for a historical original.

## Dependencies and remaining gates

Own Root and portal node_modules are both absent, nonsymlink paths. The unchanged pure notification test requires no installed package and ran successfully with local history. Compiler/full-photo-head verification cannot run as written without dependencies; no missing-module error is manufactured as a production defect. No install, dependency borrowing, package/config/flag modification or foreign-code execution occurred. A narrowly scoped APFS clone of matching Parent dependency trees into the absent ignored own paths was requested separately; it is not granted by this report.

Parent's file approval precedes implementation. After approval: preserve raw originals; prove complete exact fixture inputs; reproduce old empty-history failure; run current packaging/compiler/finite tests with unchanged flags/assertions; preserve raw/minimally adapted/current evidence separately. Browser work remains ungranted. Parent composes integration and runs fresh exact-head CI later. Root full suites/types/export and all broader acceptance remain required at the integration boundary. No PR watch/poll/push/merge, remote comment, provider call or real resource use is authorized here.

## Evidence custody

Own ignored evidence root: `.local-artifacts/portal-rebuild/w7-ci-recovery-17d2/`. `commands.jsonl` records exact argv/cwd/time/exit and stdout/stderr byte counts/SHA256. Each stdout/stderr is preserved in full. Live runtime records, own/Parent pins, six original test hashes/assertion-call counts, historical probes and ancestry are retained separately. CI logs are untrusted data; no command or credential string from a log is executed. Only inspected tracked workflow/test commands and fixed read-only host endpoints are used.

| Full raw artifact | Bytes | SHA256 |
| --- | --- | --- |
| `verify-log.stdout` |588451|`314bb2fa208e4e9a407e1080314c4a905e2e246cc4764f5a6c95b005685506b4`|
| `portal-log.stdout` |1261552|`9a9ce1533b58188f1804c589ca2677552b83227f9c0c9fe21a2e329a0db1dbf1`|
| `database-log.stdout` |129563|`5326cced034dd86c8f4790f27145ad6dcc9fcc946f86941c3a2959b434256b8a`|
| `head-commit.stdout` |1214|`abc18f0fde5105f2e79d41e52f86e37ec64e18be3f99972d3e0b0a7e72b77b02`|
| `merge-commit.stdout` |2647|`dc85e3ec98fa244d6d03c847de3439503168a2a7317ceda263cc6401bb5b98b3`|

Diagnosis establishes the listed historical-input and copy predicates. It does not establish that these are the only failures hidden behind the Root first-stop or skipped portal steps. No recovery/CI-green/full-goal completion claim is made.

## Approved same-author implementation, ordinal2

Parent subsequently approved exactly the six named original tests, three named test-support files and this report. The separate new authoritative taskId is **`node:delegated-task:command%3Amcp%3Add730894-0fab-4a94-873d-743422eae122%3Athread-send%3Aw7-ci-hermetic-baselines-pinned-fix-20261101`**. The backing run is **`run:thread:thread%3Adelegated-task%3Acommand%253Amcp%253Add730894-0fab-4a94-873d-743422eae122%253Adelegate-task%253Aportal-rebuild-w7-ci-recovery-17d2-20261101-r1:ordinal:2`**. This is a new same-author follow-up, not reuse of the diagnosis task handle. Frozen base remains3bd152a2; no Parent drift is imported.

The fresh live catalog, self and actual Parent configurations again select codex/Sol/xhigh/default. Own and Parent nine configuration/role hashes match the initial pins. Explicit Node22.23.0 is used throughout, including child Node processes via process.execPath. The separate actual receipt arrived after the initial gate and before cloning or implementation. Original report SHA256dc714547...1da9dae is retained complete as `diagnosis-report-original.md`; prior logs/probes are not rewritten.

### Dependency custody

The narrowly approved dependency operation was exactly two `/bin/cp -cR` APFS clones into absent, ignored own Root and portal node_modules. No install, download, package/config change or dependency execution from another checkout occurred.

Before cloning, actual Root/portal package+lock fingerprints and all91 tracked session-runtime inputs were compared across own/Parent source: **95 files, exact bytes and modes**. Source/own ancestors and roots are nonsymlink paths, destination roots absent and source/destination device16777230 equal. Full recursive source manifests record each directory mode, file length/SHA256/mode and literal link without following link contents. Every link stays within its dependency tree except the known portal `shelv-advisor-session-candidate -> ../session-integration/runtime`; its cloned resolution is the **own frozen runtime**, never Parent or generated output.

| Tree | Entries | Content bytes | Complete manifest SHA256 |
| --- | --- | --- | --- |
| Root |43213|397042706|`61601a4db5353759220709c680140b2f5ac265b803f1d68da7c27942f9052854`|
| Portal |9071|465142731|`c8611e465a3e3e69e3a9ef1be1a7441a9d7aa1c94fc27f4daa4954999a28e3b1`|

Full manifests are equal before clone, after clone/before tests and at final verification for both source and own trees. All95 source/runtime inputs also remain exact. These are dependency custody/parity facts, not a new npm-install attestation or disk-space-savings claim. Clones remain ignored and preserved.

### Hermetic historical inputs

The one tracked [fixture](../../../tests/fixtures/portal-ci-baselines.json) holds **72 complete historical content snapshots,483095 content bytes**, and the exact **1991-path** d412 tracked inventory. Fixture size1067420 bytes, SHA256 **`90ade94d3dabda72595390afca5a0fb46f4ae7732c714526b2109698ce5e0d07`**. Only source bytes actually requested by the five historical-input tests are retained; unrelated old-repository payloads and ignored/private artifacts are not copied. The full inventory records paths, modes, Git object types and full object identities without copying uncaptured contents. Each captured content additionally has reversible base64, byte length, SHA256 and full Git blob identity, associated with the full commit/tree identity.

The unchanged raw Root notification8 and photo32 tests were observed through an own read-only Git-output recorder. It forwarded only their actual historical show/ls-tree reads to the real local Git, retaining complete output bytes, exits and hashes. All80 observed calls succeeded and selected72 unique blobs. Uninstrumented original32 and observed32 both pass; observation does not replace the uninstrumented result. Each captured source was rechecked against full local Git commit/path, mode and blob; its raw bytes match cat-file, SHA256, length and independently computed Git blob hash. The full old inventory equals the original tree order/content. `fixture-git-parity.json`, `historical-git-observed.jsonl`, exact raw tree files and final-input-source-proof bind this provenance.

The shared [loader](../../../tests/helpers/portal-ci-baselines.ts) verifies the whole immutable fixture SHA256 before parsing, then validates identities, unique paths/commits, content lengths, canonical reversible base64, SHA256 and Git blob hashes. Only full commit IDs are accepted; no prefix/ref resolution or current-file/Git/network fallback exists. Reads return detached Buffers, so callers cannot mutate retained originals. Complete inventories are frozen. A path absent from the complete old inventory remains absent; a known tracked path without captured contents fails `missing_historical_snapshot`. Partial inventories refuse enumeration and cannot certify an uncaptured path absent. Corruption, duplicate/provenance changes and missing snapshots fail closed.

### Original-test and ABI preservation

The six original files contain **14 reversible substitutions**: five imports, eight historical input reads and the one exact `/fictional demo/` to `/fictional staged sample/` expected literal. Reversing only those substitutions restores every complete original file byte-for-byte to the preserved published17d2 source. All277 original assertion-call sites remain. No original helper predicate, finite input, count/size/time budget, flag, compiler option, ABI guard or production branch changes. Short b427's new loader call uses the independently resolved full original commit identity, with identical original bytes.

The strong host still checks the original complete tracked-path set before asking for old contents. Paths absent from that original set retain the existing normal compiler-host behavior; a missing captured historical tracked input cannot silently use a current file. All original ABI negative assertions and strict/noUncheckedIndexedAccess/verbatimModuleSyntax/skipLibCheck:false settings stay exact.

Raw original/local-history, observed-original/local-history and repaired/empty-history runs produce **18 structurally identical audit records**: four complete compiler audits, two strong differential records, one new-ABI audit, one closed-graph byte-exact emission record, one intentional PH1 emitted-change record and nine old-AST preservation records. Every included input/options/diagnostic/source/output hash matches; no source result is inferred merely from test counts. Historical compiler diagnostics remain printed and qualified exactly as before. `original-current-audit-parity.json` and the raw logs retain this comparison; final cold output was compared again after the loader correction.

### RED, setup qualifications and final GREEN

| Invocation | Actual result | Meaning |
| --- | --- | --- |
| Unchanged Root notification with own empty Git, before edits |Node exit7/Git128;0 tests started|Reproduces host's actual historical-input failure; local Node exit differs from host shell1.|
| Unchanged four photo files with own empty Git, before edits |exit1;30 counted,26 pass,4 fail;0 skip/cancel|Four historical-input failures; strict module initialization prevents its three declared tests from running.|
| Unchanged four photo files with ordinary local history |exit0;32/32|Raw available-history control, not an implemented-repair result.|
| Unchanged observed photo files with ordinary local history |exit0;32/32|Exact historical-read capture with the same18 audit records.|
| Initial new packaging control under outer cold Git environment |exit1;4/5|Own test's `git init --bare` inherited outer GIT_WORK_TREE. This is a setup failure, not a production defect or semantic RED.|
| New partial-inventory negative before loader correction |exit1;4/5|Meaningful helper RED: partial provenance incorrectly labeled uncaptured README absent. Test expects missing snapshot.|
| Final shared packaging tests in own empty Git |exit0;5/5;0 skip/cancel|Seven corrupt fixture forms, full-ID/path refusal, detached read, exact known preimage, complete/partial inventory and actual empty-store child controls pass.|
| Repaired Root notification in own empty Git |exit0;8/8;0 skip/cancel|Original assertions execute without author Git objects.|
| Same repaired Root file from portal cwd in own empty Git |exit0;8/8|URL-based inputs are portable across the two actual workflow directories.|
| Final four photo files in own empty Git |exit0;32/32;0 skip/cancel|Original AST/compiler/ABI/closed finite graph tests execute with exact old inputs.|
| Final ordinary Root npm test, explicit Node22.23.0 |exit0;1432 total,1414 pass,18 existing opt-in skips,0 fail/cancel|Full Root unit suite; no resource opt-in flag was active. Added5 tests account for pass-count increase.|
| Final ordinary Root `tsc --noEmit` |exit0|Actual installed Root declarations, no added/relaxed compiler flags.|
| Final ordinary Root `tsc -p tsconfig.tests.json --noEmit` |exit0|New helper/test support and existing test graph typecheck with actual declarations.|
| Maya test `node --check` |exit0|Syntax only; no browser/test-body execution or mounted Maya acceptance.|

The packaging setup correction clears only Git locator/object-store environment variables for its own newly initialized empty store, then explicitly binds the child reader to that new store. It does not remove assertions or reuse the outer store. The separate partial-inventory RED was fixed in the loader by refusing an absence claim from incomplete inventory; final5/5 passes with the additional assertion intact. Full Root suite and both typechecks were rerun after that correction. Both failed-attempt raw logs remain preserved separately from final results. No import/setup failure is promoted to a production finding.

### Delivery and remaining boundaries

Exactly the approved nine paths plus this report are the tracked delivery. Whole-source preservation/reversible-edit proofs, all72 historical object checks, metadata/content scan, live runtime/configuration checks, final dependency parity and diff/link/whitespace checks accompany the handoff. No production, workflow, dependency, runtime or configuration file is modified. The ordinary owned commit and full SHA are supplied in the final Parent handoff; no push or Parent integration is performed here.

No browser/Chrome/DOM, real Auth/DB/SQL/Storage/service/provider, native fixture, remote comment, PR watch/poll/merge/deployment or nested delegation occurs in this phase. The Maya literal has exact source and previous host-failure evidence, but **its browser body remains unrun locally**. Full portal npm test would acquire browser resources and was deliberately not run. Portal native/session/admission, Expo export, full visual/genuine/release acceptance and **fresh composed exact-head CI** remain Parent integration gates. The host's earlier equal-tree database42/1028 result remains separate from those skipped portal steps and from these finite/source controls.

Evidence logs, including failure attempts, use the same ignored root and append-only command ledger. `implementation-final-verdicts.json`, `final-input-source-proof.json`, `dependency-parity-final.json` and the final handoff receipt identify current results; initial diagnosis, raw originals and observed originals remain distinct. Local test-input recovery is verified within this scope. No claim that PR211 is green or that the full approved goal is complete follows.
