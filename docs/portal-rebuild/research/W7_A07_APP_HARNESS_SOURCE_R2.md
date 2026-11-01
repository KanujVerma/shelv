# W7 A07 actual-App harness SOURCE review R2

Owner: Kanuj. 1 November 2026 UTC. NEW independent, report-only SOURCE review of **8db94072fa88de86ad73a14db854f1d87bfc8911**, with the four allocated production paths frozen at **08386a612703d3e943646112c5c9caaa100d8349**. Actual Parent allocation base: **d93438f5e752dfbd8237fd39a7c12308e52c0cc9**.

**Specification/completeness: CHANGES REQUIRED, A07H2/P2.** The two files excluded from the execution hash are executed as JavaScript before their exact literal-data form is checked. Both independently accept a harmless executable addition during actual guard import; the verifier refuses only afterward. This violates the explicit requirement that the exclusions cannot let executable code escape.

**Correctness/quality: CHANGES REQUIRED for the prepared harness.** The current literal-data sensitivity test modifies a later filesystem read after the modules have already loaded. It demonstrates eventual refusal, not prevention of metadata execution. The fresh normal-import control passes and both intended prevention predicates fail. No production defect, actual browser import, resource acquisition, grant creation or launch bypass is demonstrated.

Dependent acceptance stopped at A07H2. A separate, precisely bounded author-record/Parent-input mismatch also prevents a clean positive execution-lease replay in this checkout. No new actual scope was blessed to work around it. The finite 10-context/18-capture phase is **not recommended for a future grant in this round**. R1's CHANGES REQUIRED verdict and its initial-capabilities/later-thread-configuration qualification remain immutable.

## A07H2 / P2: excluded metadata executes before the literal-data gate

Owner: W0 harness preparation. Requirement: the two deliberately excluded metadata inputs must remain literal data, while all executable verification/build/guard/lifecycle/case/model logic remains inside the immutable reviewed closure. Refusal must precede the excluded input's executable effects, not merely the runner's ordinary dynamic browser imports.

Source:

- [guard.mjs](../../../apps/portal/tests/rebuild-a07-application-browser-guard.mjs#L2) statically imports the grant and re-exports the verifier. Importing this guard therefore evaluates both excluded metadata modules before `requireBrowserGrant` can run.
- [provenance.mjs](../../../apps/portal/tests/rebuild-a07-application-browser-provenance.mjs#L7) statically imports the record and grant at lines7-8. Lines15-16 snapshot their already-evaluated exports.
- The exact literal-data source checks are inside [verifyPreparedExecution](../../../apps/portal/tests/rebuild-a07-application-browser-provenance.mjs#L42), at lines47-49. They cannot prevent effects already performed during module evaluation.
- The current [excluded-metadata test](../../../apps/portal/tests/rebuild-a07-application-browser-provenance.test.mjs#L74) imports guard/record at test-module initialization, then changes only a subsequent `fs.readFile`. Its executable suffix is never evaluated by that test. Passing that predicate does not establish safe first import.

Independent reproduction is in **E/metadata-import-probe.mjs**, where E is **.local-artifacts/portal-rebuild/w7-a07-app-harness-source-r2/**. It never imports the runner, browser libraries or a launcher:

1. Start a fresh explicit Node22.23.0 child with the unchanged root no-network preload. Run a normal control by dynamically importing the actual current guard. No marker appears; the actual null grant refuses.
2. For each excluded module separately, copy its exact current bytes to an own ignored input and append only `globalThis.__A07_REVIEW_METADATA_SENTINEL__=(globalThis.__A07_REVIEW_METADATA_SENTINEL__??0)+1;`. The exported full record and null grant remain unchanged. No record workspace adaptation is used in these negative controls.
3. A bounded Node load hook supplies that one own input at its original module URL. Every guard/verifier/build/plan implementation is the actual current imported file. An exact-path read binding supplies the identical sensitivity bytes to the later literal check, so the module loader and verifier see the same changed input. No tracked or foreign file is changed.
4. Import the actual guard. The marker is already **1**, with **zero metadata-validation reads**. This is observed before any call to the grant guard or verifier.
5. `requireBrowserGrant(undefined)` still throws `A07_BROWSER_UNGRANTED_SOURCE_ONLY`. Calling the actual verifier with an otherwise unused empty argument rejects with `execution metadata must be literal data only` before it accesses any bundle field. That later refusal cannot undo the earlier marker.

| Fresh control | Marker immediately after guard import | Metadata reads at import | Actual result | Raw receipt |
| --- | --- | --- | --- | --- |
| Exact normal guard import |0|0|exit0; null grant refused|metadata-normal-positive.log|
| Record executable-suffix diagnostic |1|0|exit0 because it asserts the counterexample; later literal refusal|metadata-record-diagnostic.log|
| Same record input, desired prevention assertion |1|0|exit1, intended `1 !== 0` assertion|metadata-record-desired-red.log|
| Grant executable-suffix diagnostic |1|0|exit0 because it asserts the counterexample; later literal refusal|metadata-grant-diagnostic.log|
| Same grant input, desired prevention assertion |1|0|exit1, intended `1 !== 0` assertion|metadata-grant-desired-red.log|

The source inputs, original/sensitivity SHA256, load/read counts and later error are retained in the corresponding E/metadata-*.json. Record source SHA changes **c9fba7e35d0eff754fe931978f57e599b94d9b5d3fe585fb7edea9b8da5973b9 ->349f6709df4091bcaa5ca8d82eed4c614a20b2629a65c2344ba0d1d3642b82ec**. Grant source SHA changes **7f36a6d21bcdce14b4bc5beafb054238920ba6d45fffafa602e81df41c82e52d ->2bafb3b994113aec20e5f73ec7c4276ba404971b234c20d4f69882a2ed9f5d6f**. The diagnostic and desired assertions execute the same saved sensitivity bytes in separate fresh children. Neither a setup failure nor a diagnostic exit0 is called green acceptance.

**Impact and limit:** code in an excluded metadata file can run before both the null-grant check and the executable-source freeze. The specific demonstrated effect is one harmless process-local marker. No actual browser-module import, arbitrary OS effect, disclosure, provider action, changed grant value or launch is attempted or claimed. This is a material prepared-harness provenance defect under the allocated changed-executable-input threat model, not a claim that an attacker can edit this checkout or that A07 production authorization is bypassed.

Smallest bounded owner request: consume the excluded inputs through a non-evaluating data boundary, or validate their exact source before any mechanism can evaluate them. Keep independent Parent digest authority and the null default, without a self-hash/current-digest authority loop. Add a fresh-first-import control that would detect a harmless executable suffix before its effect, alongside ordinary valid-data positives. The reviewer makes no fix. A NEW independent successor review remains required.

## H1 replay, positive-input blocker and closure observations

The original R1 sensitivity source was copied read-only and rebound only for its own imports/output home. The old whole build and guard modules were extracted from exact0202 into E/old0202 and supplied only at those original module URLs. No old branch/dependency tree, tracked source, assertion, HTTP fact, permission, clock, crypto or production response was changed.

- **Original diagnostic on exact0202: exit0**, reproducing both original gaps. Changed HTML and the removed first manifest row retain all2246 main inputs/15 outputs, input digest **65d48999b841935afee69889fe945b02900af40ae13993edcfd308321ecb1167** and plan digest **4db627ab29b0f1b962f29261298af72a2dc9dedff9e77a742f4482a524e67a30**. Assets fall17->16 in the second control. The null grant refuses.
- **The two unchanged desired rejection test bodies on exact0202: 0/2, exit1**, both `Missing expected rejection`. This is intended requirement RED, not a missing export or setup failure.
- **Current ten-test group: 8 pass/2 fail, exit1.** Both original rejection predicates pass; normal complete verification and post-verification delivery-control setup fail with `reviewed execution provenance mismatch`. The later executable-metadata-read predicate passes, with the temporal limitation demonstrated by H2. No current10/10 or accepted delivery lease is claimed.

The tracked author record is intentionally workspace-bound. An ignored literal-data-only review binding changes exactly `/workspace` from **/Users/kanuj/.t3/worktrees/shelv/t3-3cffb79f** to **/Users/kanuj/.t3/worktrees/shelv/t3-be1e15e9**. A complete structured comparison restores that field and proves every other original record value identical. Original/adapted files, exact one-field change and both hashes are saved in E/RECORD-ADAPTATION.json. Tracked record/guard/grant bytes remain unchanged and no actual grant exists. This binding is solely for the source probe, not a portable or launch-authorized preparation.

A separate untrusted `describeExecution` comparison identifies exactly two remaining implementation rows, four leaf differences. It is diagnostic data, never accepted authority:

| Frozen input | Author record | Actual own Parent-preserved input |
| --- | --- | --- |
|apps/portal/package.json|1690 bytes; SHA f84c071bafe6e4982f09619ae56639b2a07185dfbe5ee9386244b375bb6d1609|1711 bytes; SHA 294dbd426b9840bd1d524e443edff4ff3c5026b39e9137c9bf897d156715bb02|
|apps/portal/node_modules/esbuild/bin/esbuild|9350 bytes; SHA 183d6ead2dbc3af51aec767d5395f86fe54fbbc2d2aa8e54feb4e31d76a62f7e|10590882 bytes; SHA 10b6243df618d374bb2d5c9cfbe7052e1405f6aa4e53a6164f11a91b9f2e1384|

The tracked package difference is precisely Parent's `--test-concurrency=1` addition to its test script. The author installed esbuild bin is a JavaScript wrapper; the permitted same-lock Parent clone contains the native binary at that path. Neither is replaced or altered. Lock equality alone does not make these file bytes equal. E/ACTUAL-EXECUTION.json and EXECUTION-DIFFERENCES.json preserve the complete comparison. These two unchanged Parent inputs are **not** mislabeled a production bug or a failure caused only by the review workspace.

Exact bounded input request for a later clean positive: provide an approved own-input mechanism retaining the original reviewed record and exact frozen package/bin bytes, or an owner-prepared successor record explicitly reviewed against the intended actual Parent package/bin projection. The present authorization permits only workspace/path data rebinding and forbids dependency mutation or blessing a newly described scope, so this review does neither. Do not exempt the package row merely by calling it metadata. No normal lease or full copied-byte-delivery acceptance follows from the eight negative passes.

The current source explicitly includes main inputs/outputs, exact HTML/CSP, all17 assets,32 served URLs, manifest/directory selection, Node binary, package/config/build options and226 local/installed implementation entries. The actual diagnostic matches every other structured field after the one allowed workspace substitution. This includes every main input/output, the template and served/asset membership. The fixed original execution digest is **957efb4b717039dd36e45835d961db1ea78b459604523a3332f079a459d3325e**, distinct from the record module's file hash. Compiler packaging reads runner/browser-library source as bytes/text; none is imported as runtime browser code.

The inspected delivery accessors close membership, compare original mutable aliases/MIME/hash/size and return copied Buffers. Current tests exercise mutations only after a positive lease; those two tests did not reach that point here. Therefore this round records their source design and the attributed author result, not a freshly established copied-byte delivery guarantee. Exhaustive alias/path/closure/capture/lifecycle/model review stopped at H2; no no-other-findings assertion is made.

## Task authority and legitimate future metadata

`preparationTaskId` records the author's actual ordinal15 task; it must retain that historical meaning. A future executor is a separate fresh actual task. `requireBrowserGrant` compares a supplied receipt to a separate Parent-pinned literal including `taskId`, workspace, source-input, case-plan and execution digests. It does not query live T3 identity, establish that a task is fresh, or itself authorize a new executor. Parent must correlate the actual future task/run/workspace with its separately authorized grant. Neither this completed review task nor the author's completed source task is a browser grant.

A documentary report/status suffix that changes no execution-record member does not by itself change execution bytes; Git head is not substituted for those bytes. A future deliberate exact literal grant pin is a separately authorized metadata action, after the excluded-data defect is corrected and reviewed. A changed workspace/path binding is legitimate only when explicitly declared and independently compared. Package/bin/build/case/model/guard/verifier changes cannot be treated as documentary metadata or silently given current-digest authority. Actual installed Chrome binary/PID/version and process/preview return remain future-grant duties; hashed browser libraries do not prove them.

## Evidence, retained results and stop boundary

| Fresh R2 operation | Actual result | Receipt in E |
| --- | --- | --- |
|Initial required live gates|BOTH positively Sol/xhigh/default with descriptors before candidate imports/execution; one initial capabilities transport error then successful retry|INITIAL.json|
|Exact old H1 diagnostic / desired rejection bodies|two counterexamples, exit0 /0 pass2 intended failures, exit1|old0202-diagnostic.log; old0202-rejection-red.log|
|Current unchanged provenance group|8/10; two positive-lease setup failures; no skipped/cancelled/todo|current-h1-ten.log|
|Workspace-only structured binding / exact current comparison|one allowed workspace change; two further frozen-input rows refuse|RECORD-ADAPTATION.json; EXECUTION-DIFFERENCES.json|
|Independent metadata import controls|normal positive; both executable additions observed before checks; both intended prevention assertions RED|metadata-*.log/json|
|Source correspondence and preservation|38 allocated paths exact8db;4 production paths exact083;1956 other Parent paths and62 SQL exact|INPUT-AUDIT.json; final preservation receipt|
|Read-only copies and frozen evidence|517 initial files copied/hash-bound before test execution;88/203/225 indexed source files subsequently all rehash;19 context reports equal exact Git refs|COPIES.json; COPIED-EVIDENCE-INTEGRITY.json|

All meaningful child commands use **/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node**, actualv22.23.0, with its directory first in the child PATH. Full argv/cwd/start/end/tested head/dirty state/true exit are in E/COMMANDS.jsonl and individual *-command.json. The recorder executes each child directly, writes unique raw logs with wx and returns the actual child status. Root `--import ./tests/portal-review-no-network.mjs`, `--experimental-strip-types`, `--test --test-concurrency=1` are retained where applicable. No test assertion, flag, budget, dependency, response, clock, React scheduler or authority port is weakened.

Before the finding this round did **not** run original25, retained32/500/45/80/256, strict helper/frontend/session/UI, additional capture/lifecycle/model controls, or full suites. They remain UNRUN in R2 after the required source stop. The author's final25 =12model+5source+8cleanup, new10,32/500/45/80/256, strong strict/helper/frontend/session/UI and clean2246x15 results are attributed only. R1's stopped retained/strict checks are not relabeled fresh results. Counts overlap and are never unique product-acceptance totals.

Author H1's88-entry index hashes **487fe5305133d68fdd9979b4af3b0d07d43e61f8fb2b4b63316dbac4feb413ab**; prep203 hashes **1110b16547c46d85f55178cf7b70e2eed5b2f97c7764375f712d1f1684824f4a**; reviewer R1's225 hashes **7b5e6401b379889e6a932a61dedaffddb8adf9172016a49648ea39bf7f890f7c**. All rows were read/hash-checked and copied without foreign execution/write. The initial517 readonly copies preceded test execution; complete R1 index references were additionally materialized after H2 for final evidence integrity. This timing is explicit rather than falsely claiming every supplementary copy predated execution.

All45 H1 command records and36 original prep command records remain distinct. H1 original0/2 RED, initial strong-type diagnostics, moving-asset0/1 RED,9/10 diagnostic-label mismatch and later10/10 are preserved. Initial successful retained logs reused before unique suffixes remain qualified; failed raw logs are not replaced. The ordinal14 historical launcher refusal78 remains attributed and is never repeated. Reviewer R1's preload/import setup failures remain separate. This review's raw current8/10 is retained and never overwritten by a retuned record.

The complete own **95388-byte** approved input was read, including A/B/C, D01-D48 and all26 screens; SHA **c45701f9f54fd2b1dbb09bbd7aa2b9b437e9059aa6032b6f39411fe2e7f6efbd**. Canonical decisions and full desktop spec are exact contained texts. README/contracts/workstreams/current status and the full supplied R1 allocation, frozen R3, R1 report and author H1 response govern. The recovered current T3 allocation is96095 UTF-16 code units and is saved verbatim in E/ALLOCATION.txt. Full plan/cases/build/guard/verifier/runner/artifact/lifecycle source and the ordinal14/15 author response were inspected. Older complete W2/Guidance/App/History/Source context copies are hash-bound to their exact refs. Exhaustive semantic rereading of every older report, and the complete remaining operation-class audit, were not finished before the material stop. This report makes no contrary completeness claim.

G1-G8/CH1-CH6 and A07 C1/C2 dispositions remain attributed. G5 remains raw4/5 with producer-ready-return ->actual offline ->later consumer ordering, without an artificial yield. Historical generation0/1 remains distinct from current f163/e4cb closure. C1 false-B20/21 and27/28, the independent real-B SAVE control, C2 source callback versus ordinary mounted React, inverse first-postimage reconstruction and prefix qualifications remain separate. AppR7 B2 is not complete B3/B4/frame-C or A07 proof. CH4 wrong-literal-route/held-head and CI observer/CSP/partial-byte qualifications remain intact. Source count/hash/reference/receipt does not supply source bytes, consent or human approval.

## Identity, imports and protected inputs

| Field | Live verified value |
| --- | --- |
|Authoritative taskId, supplied separately by Parent|node:delegated-task:command%3Amcp%3A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%3Adelegate-task%3Aportal-rebuild-w7-a07-app-harness-source-review-20261101-r2|
|Backing thread|thread:delegated-task:command%3Amcp%3A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%3Adelegate-task%3Aportal-rebuild-w7-a07-app-harness-source-review-20261101-r2|
|Backing run|run:thread:thread%3Adelegated-task%3Acommand%253Amcp%253A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%253Adelegate-task%253Aportal-rebuild-w7-a07-app-harness-source-review-20261101-r2:ordinal:1|
|Ordinal/start/Parent/project|1;2026-11-01T13:44:18.183Z;d632030a-18f7-4dec-a2c9-f5c0418c3fd5;ac0af19d-d404-4f53-a870-02bfd76c2a80|
|T3 workspace / branch|/Users/kanuj/.t3/worktrees/shelv/t3-be1e15e9 / t3/a07-harness-source-review|
|Clean allocation base / assembled tested head|d93438f5e752dfbd8237fd39a7c12308e52c0cc9 /4414002ef19f2d7d244a8c2eb9950512ebef9f0b|
|Initial effective runtime|codex /gpt-6.1-sol /reasoningEffort=xhigh /serviceTier=default; full-access/default|
|Live supported descriptors|reasoning low/medium/high/xhigh/max/ultra, catalog default low; service default/priority, catalog default default; effective xhigh/default explicit|
|Project/default/eight roles/cap|registered shelv at /Users/kanuj/Documents/projects/shelv; saved defaultModelSelection:null; project/default-subagent/eight role TOMLs Sol/xhigh; cap8 including Parent, no nesting|
|Pin SHA256|config927e3dd532c0daabbb975f6879866aa99cbc12d3f20d080b0568867e37ee66ff; each rolea1f57cf26da8626380cbaa101ca04dc39a92e4bd6aa6acb6cd9f5f24a05d9feb|

The first capabilities transport attempt failed. Its retry and the independent thread-configuration call both positively verified the required selection **before** any candidate import or source execution. This fresh BOTH-initial evidence does not amend R1's later-configuration qualification. Task/thread/run are distinct; Parent's supplied handle is recorded independently of the backing identities. Final live readback and pin/Node preservation are bound in E/FINAL-HANDOFF.json.

Every changed-path list was inspected before the exact ordered cherry-pick -x. There were no conflicts or manual resolutions:

| Original allocated input | Local attributed input |
| --- | --- |
|c70b11e6d3e7b0724a779444d8eacb7a0f6110ad|2ba5651cfbbea71b402b4818909e694043ec7c8f|
|547b72fa9e08bd8f2ebb3636c93c990ad44b784e|e23834d30f547790fb4b374b5f1117852c9c7fb0|
|0c447dfb55fa91678665e6f8393b2acc965afe25|c73d48e3a02cf077674a33e1f984cd02efffdaa0|
|728f3eb738cd9a2190dcab4ae5e578094c59b80e|2944a9ef0b00a4b184f70e76dbf369fd1f3bd766|
|b76e9f5dd1ca47a9a70740afff49848fae04b7bb|dcaf2b5c1594ebd400a58b690b4fc12134529dea|
|c5edf65554b8adfe06634d7884e50051d1a9a6b8|9b7a8551c340ce7cfb0d8a355b4ae11e01808843|
|bb59913dcef6f3a529ebaea5a01938b354036a71|a905e2bb12d76a89f7a62263be4fcfd40a3166be|
|08386a612703d3e943646112c5c9caaa100d8349|3dda0376cc3d4e555634e009afd6a3632545697a|
|89051e6b54c7f3b0318edd542e42ceb7a8a62903|adad35b3b84c508c1a60072df975ccc3a4db5dce|
|0202b66a2110b86433ae0f89e0228dd9ea031157|667658c29478af15e7dfd2676b73aeaa4d625803|
|eea53b7ac835b1ccf3d742946bcb565963de5b61|f9f6fc343bab9f350c37d8351ae45b67595b2375|
|3164ced84b7cd63965d62b2c847ab6d6ad7ff6c9|2e877386cad631d207fd6e7a4576b90f63165d83|
|8db94072fa88de86ad73a14db854f1d87bfc8911|4414002ef19f2d7d244a8c2eb9950512ebef9f0b|

IMPORTS.json and INPUT-AUDIT.json bind full original/local/path/blob/SHA projections. These thirteen commits are inputs, **never reviewer delivery**. No older twelve dependencies or whole branch is imported. All38 candidate paths equal8db; all four production paths equal083. All1956 other Parent paths, including62 SQL, actual Root/W2/five37f/ClientState/CH6 and the separately integrated reviewed UTF8 component, remain exact actuald934. No Source/Account/financial proposal or M65 security/provider reroute is imported, executed or activated.

Only one authorized **/bin/cp -cR** APFS clone copies Parent apps/portal/node_modules into this initially absent own ignored path, after matching both locks, no-symlink ancestors and same-device16777230 checks. Exit0; no root node_modules clone/install or dependency mutation. Root lock SHA **5c57c9aec9e4585066e032e234d610a77cbffd9a51f82700c158fc37fe01b5c2**, portal lock **bc914f3a9c9f24e44f02e3cff2804651147385ea5abda58a064531329ef23203**. The allocated real115-file declarations are preserved within the copied R1 evidence; no strict command uses them after the stop. No installer/shim/downgrade/config/flag change occurs.

## Terminal delivery and unrun gates

Only **docs/portal-rebuild/research/W7_A07_APP_HARNESS_SOURCE_R2.md** is reviewer-authored tracked delivery. Import only its sole report commit, excluding all thirteen input ancestors. Final link/whitespace/scope/candidate/protected/pin checks, report hash, evidence index, exact delivery commit and clean Git readback are bound after commit in E/FINAL-HANDOFF.json. Parent owns status/TASKS/CONTEXT_SYNC, correction, new input allocation, new review and any future grant.

ZERO browser/preview/launcher/DOM/process-inventory/devserver/native/Auth/DB/PG/Storage/Docker/provider/credential/fixture/resource calls or launcher/browser-library runtime imports occurred. Compiler packaging is write:false and never executes the generated runner. The negative metadata controls use only a process-local marker. No resource was acquired, no RETURN is invented, and no wait/poll loop follows. No fixes, integration, push/PR/merge/deploy, live advice/source/permission/message/funds/purchase/retailer action or nesting occurs.

UNRUN: all10 browser contexts/18 planned captures; ordinary mounted React/StrictMode/effect/subscription and A03/A07 event reachability; actual screenshot/partial-image behavior, capture/lifecycle execution in Chrome, process/PID/version/preview return, focus/scroll/keyboard/privacy/viewport/visual/accessibility/human behavior; genuine cookie/Vault/Auth/Edge/PostgREST/SQL/RLS/Storage/persistence/notifications; original25 and all stopped retained/strict groups in this R2; full Root/portal/session/native/Expo/emitting/hosted/exact-head CI/financial/release acceptance. Unbound direct/reload reports remain unavailable, multi-report preparation UI is absent, and the proposed workflows are representative only. **The entire approved goal remains active.**
