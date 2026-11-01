# own-client photo head: bounded source handoff

Owner: Kanuj. Date: 1 November 2026. Project: `KanujVerma/shelv`. Branch: `t3/photo-head-reader`. Workspace: `/Users/kanuj/.t3/worktrees/shelv/t3-349ca8e1`. Base: `d4125cca52cb21d0c0a79a5733662f782a0dea76`. Latest code checkpoint: `9595fd8a026abd80e245e9dd8b36b8dd54ff8fb3`; this report and final test receipts follow separately.

Status: implemented and author-verified at SOURCE / closed synthetic HTTP level. This does not enable uploads or complete C05/C07. New independent review, parent composition, canonical SQL/ACL/concurrency verification, genuine Auth/Storage/persistence, browser and release gates remain open.

Traceability: D03 bounded backend extension; D12/D26 optional photos; D32 immutable history; D38 care read window; D40 privacy; D43/D44 exact runtime and ownership; D46/D47 evidence and release boundaries.

## goal and fixed API

M59 deliberately makes the lossy legacy check-in reader reject `content_version_required` when goal/amendment history exists. Photo reserve/completion instead use `concierge.checkin_heads.revision`, independently of Review's `care_report_heads`. A compatible metadata read must not truncate history, invent a revision or use Review's head.

The approved seam is exactly:

```text
POST /api/client/checkins
{"action":"read_photo_head_v1"}
    -> fixed public.concierge_checkin_head_v1(), arguments {}
    -> exact {"revision": nonnegative safe integer}
```

The verified server owner is inferred; there is no client selector, URL/RPC selector, request ID, caller role or authority bit. Unknown request fields reject. Missing, null, unsafe, string-valued or extra-field responses reject. The canonical Root mapper is reused at ClientProvider and the final positive gateway edge. The Root branch reauthenticates the same permanent identity after the RPC wait and rejects an aborted final return. Existing ApplicationSession, cookie, CSRF, Vault ownership/context/deadline and late-result fences remain in the actual call graph.

This is read metadata only. It contains no clinical body, private note, photo inventory, upload acknowledgement, care-access flag or permission to reserve/complete a photo. Consumers must still use their real current session, canonical care eligibility and the unchanged upload protocol. The parent later updates W4's port; this task imports none of its 17 files and mounts no UI.

## SQL source and initial-state semantics

Installed CLI `2.121.0` and `migration new --help` were inspected before the single `supabase migration new portal_rebuild_photo_head_v1` allocation. The CLI returned `supabase/migrations/20261101195359_portal_rebuild_photo_head_v1.sql`; size zero was verified and the exact empty filename sent to Parent before SQL body authoring. There was no second allocation.

The new private guard uses canonical actor, live owned provider-session, target, enrollment and actual-case checks. Active advisors and every plan principal are denied this client surface. It preserves the canonical premeeting eligibility distinction without fabricating payment, and applies the current care read window after service starts/ongoing phase. It grants no care writes.

The public reader invokes that guard before the existing canonical client advisory lock, after the wait, and immediately before return. The actual case share lock follows the advisory wait, preserving writer lock order. It reads only the owner's existing `checkin_heads.revision`. Under the canonical writer's same client lock, a verified existing enrolled case with no head uses the writer's existing initial revision zero; it inserts nothing. This is based on the original writer's head-default zero/initialize-then-advance behavior and original projection semantics, not an absent-user/case fallback. Review history/head is not substituted.

Only new functions and their precise EXECUTE grants are authored. All 62 old migrations and all 113 old SQL files remain byte/mode exact. The existing M59 reader, legacy writers, raw upload/media routes, buckets, allowed formats and byte limits are unchanged. Canonical pgTAP is authored at the separately approved `supabase/tests/portal_rebuild_photo_head_v1.sql`, and is **UNRUN**. Source checks and synthetic transcripts do not prove SQL ACLs or races.

SQL source was frozen in `5d18f401b074348b4f986b32e65a8e0c3348e661` and the active SQL-writer slot returned to Parent before N1's correction. Frozen SHA-256 values:

- migration: `b1f1a2ac93bfca7206f968d02e32e0451034364961caed87c8c7f4663f402632`;
- authored pgTAP: `6c5935c8cc7b5ab87877ddc0925a4fe291ae7bb91b131c3b83f7523754070d00`.

## source ownership and separate prerequisite

Own source/test commit: `b42742a1`. It changes only nine approved existing paths:

- `supabase/functions/concierge-checkins/{commands,types,projection,handler,index}.ts`;
- `apps/portal/site/auth/client-cookie-session.js`, adding one read action only;
- `apps/portal/session-integration/runtime/server/{client-policy,client-upstream,gateway}.ts`, adding only classification and positive metadata mapping.

New matching tests are `apps/portal/tests/rebuild-photo-head-{source,closed,strict}.test.mjs`. The only other new tracked paths are the frozen migration, authored pgTAP and this report. No shared source model, W4 UI, Root auth/runtime/crypto/parser/session lease, package, lockfile or original test was edited.

The first full strong Root/DOM closure reached six pre-existing indexed-access diagnostics. Parent alone authored `d4a3314ecd81e4c3b544a8919834429e90c05d06`: six non-null annotations in old check-in-handler branches, with no runtime change. Parent explicitly authorized its separate `-x` admission. Cherry-pick conflict stages 1/2/3, full conflict, combined diff and `b427` input were saved with hashes before editing. Parent explicitly authorized the precise union: four incoming old lines plus two autoapplied assertions, while retaining all nine new-head branch lines and the clinical branch unchanged. The earlier three-line shorthand was corrected before resolution.

Separate dependency commit `9595fd8a026abd80e245e9dd8b36b8dd54ff8fb3` cites `d4a3314e`. Exact-byte comparison against the saved `b427` input verifies that only those six annotations changed; the new branch is byte exact. The complete new canonical Root program reaches 24 non-declaration TypeScript files. All 24 emitted JavaScript outputs are byte-identical before/after the annotations, with the same new-head branch in both inputs. Actual Root compilation changes from six diagnostics to zero. A separate actual closed ApplicationSession/cookie/Vault/ClientProvider/gateway/Root bundle covers 67 inputs; its entire emitted JavaScript is also byte-identical across the six annotations, SHA-256 `ed968bb6b46d72772c06491c4a3092d6a3ad99936d5e1655c03cd59fe469ca4e`. Full per-input before/after source hashes are retained. There was no whole-file checkout/overwrite or Auth/crypto/declaration shim.

The AST preservation test removes only allocated new read nodes and compares all old executable nodes with immutable `d412`; handler's reference is the separately admitted Parent annotation commit. Every old node matches. It does not treat Parent's annotations as this worker's production fix.

## executed verification and evidence levels

All executions use `/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node`. No successful OperationPort, caller current/role override or live resource is used. The closed tests bundle the actual ApplicationSession, retained client-cookie factory, gateway, SessionVault, ClientProvider and canonical Root entry with `write:false`. Auth/context/RPC responses are explicit closed synthetic transcripts. Unexpected URLs and all Storage calls reject. The synthetic server credentials never leave that in-memory transcript.

From repository root:

| Command | Actual result |
| --- | --- |
| `node --experimental-strip-types --test apps/portal/tests/rebuild-photo-head-{source,closed,strict}.test.mjs` | Final 21/21, zero failures/skips/cancellations. Includes SQL-source/AST checks, full closed-graph emitted-JS proof and full strong compiler differential. Earlier 20/20 remains separately retained. |
| same command with `--test-name-pattern='actual ApplicationSession'`, closed test only, `PHOTO_HEAD_BASELINE=1` | immutable `d412` source RED: old client action gate rejects 403; no missing-module excuse. Current identical positive case passes. |
| `node apps/portal/node_modules/typescript/bin/tsc -p apps/portal/tsconfig.frontend.json` | exit 0 with actual checked-in flags unchanged. |
| `node apps/portal/node_modules/typescript/bin/tsc -p apps/portal/session-integration/runtime/tsconfig.json` | exit 0 with actual checked-in flags unchanged. |
| `node --experimental-strip-types --test tests/concierge-checkins{,-http,-entry,-storage,-transitions,-interleaving,-files}.test.ts tests/concierge-checkin-replies.test.ts` | retained 39/39, zero failures/skips/cancellations. |
| `node --experimental-strip-types --test apps/portal/tests/rebuild-cookie-cancellation.test.mjs apps/portal/tests/rebuild-review-guidance-request.test.mjs` | retained 140/140, zero failures/skips/cancellations. |
| `git diff --check` | exit 0. |

The full Root/App strong graph has 108 actual source/declaration files, using TS6.0.3, `strict:true`, `noUncheckedIndexedAccess:true`, `verbatimModuleSyntax:true`, `skipLibCheck:false` and real DOM/React declarations: immutable `d412` has six diagnostics, current has **zero**, no introduced diagnostics. New metadata ABI negative tests also have zero diagnostics without copied or erased dependencies.

The full 137-file Worker/gateway experiment uses exactly the same options, entries, libraries and actual Workers/auth-js declaration bytes for baseline/current. Immutable `d412` has 50 diagnostics. Before the Parent prerequisite current also has 50; afterward it has 44, with exactly the six Root diagnostics removed and **zero introduced diagnostics**. The remaining real Worker/browser declaration and pre-existing unchecked-access diagnostics are preserved in full. This is **not** a zero-error full strong Worker check. Missing WebAuthn/Storage/BroadcastChannel names, missing VaultBindings entry and existing crypto/policy/upstream/walkthrough unchecked accesses were not stubbed, copied, relaxed or edited. Actual configured runtime success is a distinct proof.

Negative cases cover selector/injection rejection, advisor-channel denial, permanent identity/anonymous/null checks, post-wait identity/owner/context loss, expired/revoked transcript failures, actual sign-out and final late-result rejection, failed-current-read/local applicability denial, input/response byte bounds, null/unsafe/extraneous/private response fields, unchanged legacy 409 and successful independent metadata read in that same closed composition. No metadata read creates a write, Storage call, actual use, report or photo.

## immutable raw artifacts

Evidence directory: `/var/folders/ff/ztddg8yn7c9fmbdh7rdwnc2m0000gn/T/shelv-photo-head-source-uzcsicej/`. Test ledgers print the actual child exit before writing exclusive uniquely named immutable logs. Full raw outputs, failed attempts, source/declaration lists/hashes and baseline/current results are retained separately.

| Artifact | SHA-256 |
| --- | --- |
| `red-df8d1214-bc1b-414e-9214-3ec4838b983f.json` | `7bd92f773ecd3baf58d81614c259a31ecdf859873b79c9d842ba14e3bb93397d` |
| `closed-red-8c075d7b-4161-4f08-b915-40e64be1366f.json` | `07fe676df6c9fb75b64225cbdf05829bf51e30966940b4aec9e46dfeca42a846` |
| `green-attempt-0350032b-71bf-4d5d-a9ad-3669f1d441b5.json` | `e63a1fbbfda84de27909681d0fdc3ac5dc1ba3bed86c0237f2ba2e723e17b070` |
| `raw-strong-8841c1b1-7c97-4181-9672-b6f05f808473.json` | `9d535a32145848312aaee01da49de87daf8f4271c84bf73c4727778dbbc3b647` |
| `strong-real-declarations-3ca26433-cfab-4209-8574-0b6a273b7d7e.json` | `70a394e3bc86e7fe2cb8620452fae0ab3571721a93aa2bca941d6a8fb015604c` |
| `own-after-dependency-f5b8e659-1f89-412e-866a-9e6c748425f6.json` | `e41ecfb865b7d51777f5b3a9bb58e337de98a57a2be7d5602d836776baa92ec0` |
| `own-final-2bb27c8d-9070-4b65-9b05-3be110ba8110.json` | `f0f647683c485f0a7bcb81cfc140f725126f7ba974a59d66472ab7ed302d45ca` |
| `closed-graph-erasure.json` | `fb332c327a23717a78fc3892f6360ebe3a833bd871f88af5365193f2264b61c7` |
| `strong-final-actual-closure.json` | `9bbed30a40ba9b6ad7e0ae69fb0b79fee6fd116c4ae5d8ad43368c4d71912285` |
| `erasure-before.json` | `9ce8ccb656ead1c6fe5bd185dd25a20f019ca7a2d4045da5786f7ec4493dd503` |
| `erasure-after.json` | `eb5c8b0e41475801f3bb1235d9ab310fd6ce4160b81b36cf17c5f0e77e18aa3c` |
| `retained-root-dacd9526-96b0-4338-a5d2-f371b5bcc5a3.json` | `44d621e5d09804f7a11919f7fc539c8ddeefc74be516a3442d5931f1edf5c87d` |
| `retained-cookie-42b33ee7-4ca4-4c12-a3fa-bfbfcfa3116f.json` | `dada851c44dbb7ab45d5c463bc4c9f358eeb6707a836f7348133120a9c8ac5e0` |
| `protected-final.json` | `9fa55b6d2a5deca8ff1c795f3779b300fbb9152b2deb2874ce35055f69f8307b` |
| `final-config-pins.json` | `d77f92c8f9ce226351ce57e34f491fa14799442546a05d1cdf6c5975bc365952` |

The initial Root RED is 1/5: invalid-input/400 unsupported action, missing new mapper, unchanged legacy 409 positive. The immutable-parent closed RED is 0/1 with the intended old-action 403. The first current closed run was 12/14 because two new test loops incorrectly tried to restore an actually revoked Vault. Each permanent-denial scenario now gets a separate actual in-memory fixture, with no hidden reset. Initial raw strict results include an author harness omission of the real Worker globals entry; the next result includes that exact real declaration and retains its actual baseline errors. The new-branch bearer diagnostic was corrected only within that branch before the exact baseline comparison. Those earlier failures are not relabelled green. After final 21/21 exit 0 was printed and its raw log saved, a separate extraction step failed on a prefix-offset error; corrected extraction reads the same immutable raw log and does not rerun or change the tests. Existing Node module-type warnings remain; package metadata is unchanged.

## runtime, input and protection record

Both initial and final LIVE catalogs/descriptors and self/Parent configurations verify provider `codex`, model `gpt-6.1-sol`, `reasoningEffort=xhigh`, `serviceTier=default`, default interaction mode. Own and Parent `.codex/config.toml` plus all eight role files each retain exact Sol/xhigh pins. Installed Codex is `0.164.0`; strict startup-config command exited 0. Final explicit Node remains `v22.23.0`. No models/configuration changed and no agent was spawned.

Authoritative task ID was forwarded by Parent after the initial gate: `node:delegated-task:command%3Amcp%3Add730894-0fab-4a94-873d-743422eae122%3Adelegate-task%3Aportal-rebuild-w1-photo-head-source-20261101-r1`. Backing thread is `thread:delegated-task:command%3Amcp%3Add730894-0fab-4a94-873d-743422eae122%3Adelegate-task%3Aportal-rebuild-w1-photo-head-source-20261101-r1`, run ordinal 1. Parent thread is `d632030a-18f7-4dec-a2c9-f5c0418c3fd5`. Task, backing thread, run and ordinal are separate identities, never inferred substitutes.

The full original is 95,388 bytes, SHA-256 `c45701f9f54fd2b1dbb09bbd7aa2b9b437e9059aa6032b6f39411fe2e7f6efbd`. Approved D01-D48/spec/26-screen manifests, AGENTS, contracts/workstreams/status and W4's `t3-59696a97` report at `ea672828` were read. The full original appendices match the current approved decision/spec text and complete manifest. GOAL.md omits only the separately retained handoff-location paragraphs; that comparison failure was investigated rather than rewriting either original.

Own portal dependencies were absent. Parent root/portal locks matched the required `5c57c9aec9e4585066e032e234d610a77cbffd9a51f82700c158fc37fe01b5c2` and `bc914f3a9c9f24e44f02e3cff2804651147385ea5abda58a064531329ef23203`. Nonsymlink ancestors, same-device identity and literal portal-local workspace links were verified before the authorized `/bin/cp -cR` APFS clone. All 9,070 dependency entries match bytes/modes/literal links afterward. No install, dependency shim, external dependency link or Parent mutation occurred.

Initial protection inventory covers all 1,991 original tracked paths. Every original path and mode survives. Only the nine explicitly claimed existing files differ, including the separately approved six-annotation Parent exception. Every old test, all 62 old migrations/113 old SQL files, five approved input documents, packages/locks and model/role pins remain exact. New totals are 63 migration files and 115 tracked SQL files, which describe source membership only, not an applied ledger.

## next step, standing instructions and risks

Parent should dispatch a **NEW independent Sol/xhigh/default review** of the complete source chain, original brief, failed/raw evidence, Parent annotation exception and this report. Existing tasks/reviews must not be reused. Only after that review may Parent admit the seam, update W4's port and schedule any separately authorized canonical backend/native/browser verification.

No current SQL, ACL, concurrent revocation race, genuine upload, camera, Auth/Storage persistence, native fixture, browser/preview, process inventory, Docker/SQLite, external provider, network service, credentials, Source4/Source Account activation, M63-M65 or blocked Guidance retry was acquired/executed. No push, PR, deployment, client publication/communication, funds/order/fulfillment or production-permission action occurred. R9 remains outside this task. The SQL writer slot is relinquished and its source stays frozen.

The full root application suite/Expo export, full portal package and exact-head CI were not run in this bounded source phase. They remain broader integration/release gates, alongside the expressly unrun canonical pgTAP and migration rehearsal.

The complete original approved rebuild remains open. There is no new business-policy question. Remaining risks are the unrun canonical SQL/ACL/wait proof, inherited qualified Worker declaration graph, new independent review and actual consumer/application integration. Source-only proof is not full C05/C07 or release acceptance.

## PH1 correction: exact metadata RPC ingress budget, 1 November 2026

This is a NEW bounded source correction at exact clean `d226194115fd5917afa591f478e4c20836bc54a8`, in the same workspace. The complete independent R1 report at `/Users/kanuj/.t3/worktrees/shelv/t3-40022b03/docs/portal-rebuild/research/W7_PHOTO_HEAD_SOURCE_R1.md`, commit `f07d2881562ebc3ef56763c27149d80b40fc3041`, was read with its original streamed probe, raw failure and command ledger. Its SPEC and quality FAIL, PH1/P2, remain preserved. R1 found excessive inner RPC response consumption, with eventual safe503; it did not establish an authorization/disclosure bypass. The earlier outer `overrideEdge` response test did not exercise that inner boundary.

Parent explicitly allocated only `supabase/functions/concierge-operations/runtime.ts`, NEW `apps/portal/tests/rebuild-photo-head-rpc-bound.test.mjs`, and an append to this report. This supersedes the earlier nine-path claim only for this correction. Source/test commit: `6886f7f53e6fce07409cb2ee9f49e348326b4855`. Parent pins the exact `concierge_checkin_head_v1` successful response at **4096 actual UTF8 bytes**. The one changed success-decoder argument is `call.name === 'concierge_checkin_head_v1' ? 4096 : Number.MAX_SAFE_INTEGER`. No caller/config cap, selector, action, field or generic API is added. Auth, error decoding, parsers, registry, other RPC success limits, handlers/index, writes, clinical projections, media and SQL are unchanged.

The existing `readConciergeJson` checks actual stream bytes before retaining an overflow chunk or allocating the complete JSON buffer. It cancels overflow before JSON decoding. Content-Length is not trusted as a byte budget. Exactly 4096 bytes of valid head JSON plus harmless whitespace succeed; 4097 bytes fail. A yielded network chunk can itself cross 4096, so this is not a promise that at most 4096 transport bytes are ever delivered. The fixed normal head JSON fits comfortably inside the budget.

### exact R1 RED/GREEN and boundary proof

The original R1 script/raw/report were copied into a new ignored evidence directory and hash-checked. The executed original script changes only reviewer-to-author module locations. Its probe body/assertions are byte-identical, SHA-256 `8f5b457128e16c6bb26c8be44ff7c586e603cb10de3cfa10199f967bfdefdcd0`. Global external fetch is denied. The actual ApplicationSession, cookie, gateway, Vault, ClientProvider, Root index and shared RPC runtime execute against closed Auth/context/RPC transcripts. The response fault is at the actual head RPC ingress, not `overrideEdge` or a successful OperationPort/authority substitute.

- Original unchanged R1 RED: exit 1, 0/1; **3,145,756 bytes / 51 pulls / cancelled=false / final 503**.
- After the exact decoder distinction, the same unchanged R1 GREEN: exit 0, 1/1; **65,562 bytes / 2 pulls / cancelled=true / final 503**. Its first 65536-byte padding chunk crosses the limit and is cancelled rather than collected/parsed in full.
- New behavior tests first ran 6/10 with four expected bound failures, including otherwise-valid oversized JSON being accepted. Current source/boundary audit passes **11/11**, including a separate AST/emission proof.

Controls include tiny/zero/max-safe head JSON, inclusive 4096 and rejected 4097, missing/false-small/false-large Content-Length, multiple chunks, multibyte UTF8 byte accounting, source stream errors, rejecting cancellation and actual 401/403 error bodies larger than 4096. The last control confirms the budget is success-only; error/Auth decoding retains its old rules.

Legacy positives exercise distinct actual boundaries. A full session/cookie/gateway/provider/Root path consumes a legacy RPC body above 3 MiB and returns the unchanged Root projection. A separate Root/index/shared-runtime path returns all 850 synthetic clinical reports in a complete body above 2 MiB, byte/data compared without truncation. The existing publication-history test also retains all 600 versions above 2 MiB. Existing ClientProvider outer response limits are not changed or claimed to deliver arbitrary-size history through that outer boundary. Exact near-match RPC names and other success names retain the old unlimited decoder in closed generic-transport probes; no production RPC registry is expanded.

### executed checks and actual JavaScript change

All commands use `/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node`, with finite closed HTTP only and `write:false` bundling:

| Executed command/selection | Result |
| --- | --- |
| `node --experimental-strip-types --test apps/portal/tests/rebuild-photo-head-rpc-bound.test.mjs` | 11/11, repeated after source commit; no failures/skips/cancellations. |
| original relocated R1 script with `--test-name-pattern='W7 RPC streaming bound'` and the global-fetch-denial preloader | exact unchanged RED0/1 then GREEN1/1 above. |
| existing `rebuild-photo-head-{source,closed,strict}.test.mjs` | 21/21, repeated after commit; original files unchanged. |
| existing eight retained Root check-in/reply files | 39/39. |
| existing cookie cancellation and review/guidance-request files | 140/140. |
| `tests/concierge-runtime.test.ts tests/concierge-payments-runtime.test.ts`, global fetch denied | 8/8; retained source transport checks only, no blocked financial/Guidance verification. |
| actual configured frontend and session/runtime TypeScript commands above | both exit0, checked-in flags unchanged. |
| `git diff --check` | exit0. |

The unchanged paired strong tests retain the same actual compiler/options/declarations as this author's previous phase: Root/App 108 files, baseline 6/current 0/new 0; Worker 137 files, baseline 50/current 44/new 0. **The whole strong Worker graph is still not zero-error.** Full raw diagnostics/options/file hashes are retained. R1's separately qualified 112/141-file review closure remains distinct; this phase neither copies root dependencies nor removes its four declaration differences. No fake DOM/WebAuthn/binding declarations, Auth copy or lower flag is used.

PH1 deliberately changes runtime JavaScript. AST normalization removes exactly the new decoder-budget conditional and proves every other runtime node matches immutable d226. Both before/current actual 24-file Root programs compile with zero diagnostics; only `concierge-operations/runtime.ts` changes emitted JS. Its JS SHA-256 changes from `1a1c09e2faa20394268d98e15fca19f3481009a83c6d386b4e1c8a7d45198f80` to `094136562d4ff24730032e908a703ec6d2db6a1f48db595973ac5a0026ff050a`. This is not an erasure claim for the PH1 fix. The old six-annotation erasure proof remains a distinct historical fact.

### PH1 evidence, identity and held gates

New evidence home: `/var/folders/ff/ztddg8yn7c9fmbdh7rdwnc2m0000gn/T/shelv-photo-head-ph1-d3ycs5br/`. Unique immutable logs print the true child exit before writing; `commands-ledger.json` retains argv, exits and raw hashes. Key artifacts:

| Artifact | SHA-256 |
| --- | --- |
| `r1-original-stream-raw.json` | `d1b136f8bdb69ca583e269e7f7ed27ddd0a37eddffd3decb2d9138876958dbc6` |
| `original-r1-red-b7e98093-c4ce-4066-9deb-11edcbcd1c12.json` | `c237b935c5a0e0afd62785d6a7f511d1f0795f8009b92ee32f488ab33e35b07d` |
| `original-r1-green-1f45af0d-207e-4156-80cf-5d84bcd0471e.json` | `fbeb273dec75bf90ae9eb4ffe45dd9989a44ae59292b620d2fcac15c04112a82` |
| `new-tests-red-bf029f75-64c9-4e9f-bfbc-e52294baf291.json` | `49ca34195236dc40426c7ab8e8e34ebad6be27bb616cab3a796aa1085089520a` |
| `postcommit-bound11-785754aa-4eed-4eda-a9e5-e4d25dcfe517.json` | `a712625ec124d5d273f52e23d6686e1c4def783d1bb133a8c03ab824fca4307a` |
| `postcommit-head21-83843da3-2cd4-401d-8fe2-0703af5f1b88.json` | `0eca2584ed988edaf8fe5bfd2d90ce5027f329a4198513f75371cc1be3a0768c` |
| `paired-strong-actual-closures.json` | `ae357dfc11c3b552e8969d57db4c848bdea6a0d5ad7c7dd0edc049488b7cc366` |
| `actual-runtime-js-change.json` | `54f73e00367ded6d64ae8bb8788cce7677fadfbb57c56d746a1133f58ad3fbd9` |

Initial and final LIVE self/Parent/catalog/descriptors verify `codex/gpt-6.1-sol/xhigh/default`, default interaction. Own/Parent config plus all eight role pins each are byte-identical to this phase's initial record. Node is explicitly 22.23.0. No model/config/dependency changes or nesting occurred.

Authoritative NEW task ID, separately forwarded by Parent after the initial gate: `node:delegated-task:command%3Amcp%3Add730894-0fab-4a94-873d-743422eae122%3Athread-send%3Aw1-photo-head-rpc-byte-bound-ph1-source-fix-20261101`. Backing thread remains the child named in the original section; the live current backing run is `run:thread:thread%3Adelegated-task%3Acommand%253Amcp%253Add730894-0fab-4a94-873d-743422eae122%253Adelegate-task%253Aportal-rebuild-w1-photo-head-source-20261101-r1:ordinal:2`, ordinal2. This new task is not inferred from or reused as the prior task/run.

All 1,997 phase-start tracked paths/modes survive. Only the allocated shared runtime and this report append differ; the sole new tracked path is the rpc-bound test. The complete old report is retained as a byte-exact prefix. All 115 phase-start SQL files, both frozen 5d sources, original head tests/handlers/index, auth/crypto/session code, original input documents, packages/locks and model/role pins remain exact. No SQL/pgTAP/CLI/native/runtime-fixture/browser/preview/process-inventory/Auth/Storage/provider/resource grant was used. W4's port and Parent activation remain untouched; no push, PR, merge, deployment or live client action occurred.

Author correction/closed-source verification is complete. Independent R1 remains the historical FAIL; a **NEW independent R2** must examine this exact correction and preserved originals before admission. Actual SQL/ACL/race proof, native/browser/genuine upload and complete C05/C07/full-goal acceptance remain held. The shared-runtime write claim is returned at terminal handoff; no SQL writer authority is acquired.
