# W7 photo-head source review R1

Owner: Kanuj. Independent report-only review, 1 November 2026. Workspace: `/Users/kanuj/.t3/worktrees/shelv/t3-40022b03`, branch `t3/review-photo-head-source`.

**SPEC/completeness: FAIL within the allocated source scope.** PH1 leaves the new metadata RPC response without a practical byte bound before buffering and JSON parsing. The fixed selector-free API and strict final projection otherwise match the inspected contract. Full C05/C07 and the approved rebuild remain open.

**Correctness/quality: FAIL, PH1/P2.** The independent streamed-response probe fails through the actual source/session/Root composition. The response is eventually rejected safely; this finding is excessive response consumption, not an authorization or clinical-data disclosure bypass. No SQL, ACL, race, genuine-runtime or release verdict is given. Dependent acceptance stopped on this first material finding. No production or tracked-test fix was made.

## PH1/P2: the fixed metadata read buffers the entire RPC success body

Locations: `supabase/functions/concierge-checkins/handler.ts:136`, `supabase/functions/concierge-operations/runtime.ts:48`, and `apps/portal/tests/rebuild-photo-head-closed.test.mjs:158`.

The new handler awaits `rpcData` before its `mapCheckinPhotoHead` check. The actual entry constructs the shared `createConciergeAuthenticatedPorts`; its successful RPC decoder explicitly passes `Number.MAX_SAFE_INTEGER` as the byte maximum. That retained behavior exists to read complete legacy history. It is now also used by the new, tiny, fixed `concierge_checkin_head_v1()` response. A final positive mapper cannot bound bytes already collected and parsed upstream.

The author's oversized-response case replaces the **outer Edge response** using `overrideEdge`. It exercises ClientProvider's existing response cap, but bypasses the inner PostgREST-to-Root RPC ingress. The independent probe changes only that synthetic RPC response: a zero-prefetch stream supplies a JSON object containing revision 17 and 48 chunks of 65,536 padding bytes. It uses the actual ApplicationSession, retained cookie, gateway, SessionVault, ClientProvider, canonical Root entry and shared authenticated RPC decoder. No successful operation/session/authority substitute is used.

Observed result: **3,145,756 bytes consumed, 51 pulls, `cancelled=false`, final HTTP503, no metadata acknowledgement.** The test's generous 2 MiB plus one chunk ceiling fails, 0/1, exit 1. The source's maximum is about 9 PB; the test ceiling is not proposed as a new product policy. The defect is the absence of a practical metadata-specific limit. The current SQL normally returns a small exact object; the failure is independently reproduced with a malformed synthetic upstream response, not an observed hosted failure or demonstrated production denial of service.

Evidence: ignored `rpc-stream-bound.test.mjs` and `rpc-stream-bound-b75417da-2daf-4d89-8fdb-564e5cf10cdc.json`, raw SHA-256 `d1b136f8bdb69ca583e269e7f7ed27ddd0a37eddffd3decb2d9138876958dbc6`.

Required correction: enforce an explicit finite success-body limit for this exact new RPC before collecting/decoding the response and cancel an oversized stream. Preserve the legacy full-history decoder and existing write/media behavior. Shared runtime is outside this author's nine-path claim; any needed shared seam requires Parent allocation, not a reviewer edit. Re-run this exact streaming assertion, the original controls and a new independent review after correction.

## exact source and input composition

Allocated clean base: `d4a3314ecd81e4c3b544a8919834429e90c05d06`. Reviewed source head: `6ee5f676ea1644d0197454da8c0dafb571ba59fb`.

| Ordered input | Attributed local import |
| --- | --- |
| `5d18f401b074348b4f986b32e65a8e0c3348e661` | `ae702fc608e47bca4c7631951e71fc944146abc1` |
| `b42742a190fb55e1b2339c0017472dea03ea4e78` | `d586846466a32aeb1b5f570c94a752c65eef41c6` |
| `d226194115fd5917afa591f478e4c20836bc54a8` | `6ee5f676ea1644d0197454da8c0dafb571ba59fb` |

Each import retains `-x` attribution. `b42742a1` was resolved from Git to the full SHA above. No unrelated ancestor or `9595fd8a` was imported. The six type-only annotations were already present in frozen d4.

Before imports, all exact changed paths and patches were inspected and a 1,991-path byte/mode inventory was saved. The b427 import exited 1 on the sole expected handler conflict. All three stages, working conflict, combined diff and complete staged diff were preserved before any resolution. Parent then explicitly approved only: four existing annotated HEAD lines, nine incoming new-branch lines, two existing assertions elsewhere and the incoming import. Before continuing, the resolved handler was verified byte-for-byte equal to the author's final d226 handler, SHA-256 `62fa5dc28aec2cbc338d14844a0d20cbee342332769ccbb0fdc34702efe4178e`. No other manual source change occurred.

Conflict evidence hashes:

- complete staged diff: `40ecdaf945ff25e7c54e42d5aedbf9cb5b4b4b7a56682d81d9188c6192ce3b4b`;
- stage 1: `0b97c30d753ae50ff1b0f2c161f68f82da7ca340284142473c4731b680b979a4`;
- stage 2, frozen d4: `fb0f9f4b67720dc2f71256cbc6882ac89e501cdd954eb49aefa4db30eb4f1dd2`;
- stage 3, b427: `c01740b0ae2990a16b25986531b690ff5c2c4156be5c955ebd73b203ab792a94`.

All 15 final candidate paths match author d226 and the supplied `final-owned-source-hashes.json` artifact, whose verified SHA-256 is `5d1bb2528fffc2f63520f60935b71d40ab835d538a0f6ce383e1a8b4b8379da7`. These are nine allocated existing source paths, three new tests, the new migration/pgTAP and the author report. The author report was read from `/Users/kanuj/.t3/worktrees/shelv/t3-349ca8e1/docs/portal-rebuild/research/W1_PHOTO_HEAD_SOURCE.md`; the complete saved author raw directory was copied and inspected, without executing its saved scripts directly. W4's `t3-59696a97` photo report and its unresolved M59/head dependency were read; none of its 17 implementation files was imported. This is the first independent photo-head review, not a replacement of a prior FAIL.

Parent's physical checkout independently advanced clean to `a06fd0564ec189e8b9c8f2475d1742eb07834418` through reviewed owner-policy App code, tests and documentation. It is not physically same-base or docs-only. Parent reconciled this explicitly; every review/protection comparison uses frozen Git d4, never evolving Parent HEAD. No rebase or Parent edit occurred.

## requirements and source assessment

The complete 95,388-byte approved input was read and verified as SHA-256 `c45701f9f54fd2b1dbb09bbd7aa2b9b437e9059aa6032b6f39411fe2e7f6efbd`, together with A/B/C, D01-D48, both 26-screen manifests, AGENTS, entry point, implementation contracts, workstreams and current status. All five retained approved-input hashes match `INPUT_PROVENANCE.json`. The new allocation controls over historical implementation/resource instructions.

The examined API is exactly client `checkins` action `read_photo_head_v1`, exact request keys `action`, fixed no-argument `concierge_checkin_head_v1`, exact nonnegative safe-integer `revision` output. It adds no clinical body, owner selector, upload inventory, write authority or client access flag. Root, ClientProvider and the final positive gateway mapper reject malformed/private/extra fields. The retained M59 clinical `client_read` still returns 409; no Review head or legacy fallback is substituted.

SQL-source inspection follows the actual existing actor/target/access/session/care helpers and writer semantics. The new guard checks permanent live owner, session, deletion, enrollment, active-advisor denial and all plan-principal denial. It checks premeeting versus started/ongoing eligibility without fabricating payment. Guards surround the canonical client advisory wait and final return; the actual case share lock follows that wait. Initial zero is restricted to an existing enrolled case with no stored check-in head under that lock, consistent with the canonical writer's default-zero initialization. There is no insert. Existing M59/writer/media SQL is unchanged. These are source observations, not executed SQL/ACL/concurrency proof.

Frozen SQL hashes remain migration `b1f1a2ac93bfca7206f968d02e32e0451034364961caed87c8c7f4663f402632` and authored pgTAP `6c5935c8cc7b5ab87877ddc0925a4fe291ae7bb91b131c3b83f7523754070d00`. Both are **UNRUN**. Source existence and transactional statements are not an applied migration or permission/race result.

## independent executions and evidence levels

Evidence home, relative to this worktree: `.local-artifacts/w7-photo-head-source-r1-20261101/`. `commands-ledger.json` preserves exact argv, true child exit and each immutable raw hash. `run.py` prints actual exit before saving each unique JSON log. All source probes use explicit `/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node`, version `v22.23.0`.

Foreign test/script originals are preserved. Executed copies live only in ignored evidence. Harness changes rebase static/dynamic module locations and the original module URL to this checkout; test predicates and embedded source strings are retained. Old inputs use only the exact nine owned modules from immutable `d4125cca52cb21d0c0a79a5733662f782a0dea76`, with no successful authority stub.

| Executed command or bounded selection | Actual result |
| --- | --- |
| `node --experimental-strip-types --loader ./.../old-input-loader.mjs --test --test-name-pattern=... ./.../rebuild-photo-head-source.test.mjs`, original first five Root probes on d412 | exit 1, 1/5. Unsupported action/400 and absent mapper reproduced; unchanged M59 409 control passes. |
| `PHOTO_HEAD_BASELINE=1 node --experimental-strip-types --test --test-name-pattern='actual ApplicationSession' ./.../rebuild-photo-head-closed.test.mjs` | corrected relocation: exit 1, 0/1, intended old-action denial through the real session composition. |
| `node --experimental-strip-types --test ./.../rebuild-photo-head-{source,closed,strict}.test.mjs` | exit 0, 21/21, zero failures/skips/cancellations. |
| same Node test runner, `--test-name-pattern='W7 independent'`, `independent-adjacent.test.mjs` | exit 0, 6/6. Full-path safe-integer boundaries/extra JSON keys, post-wait anonymous identity, actual Vault expiry during wait, origin/CSRF denial, exact-true/throwing applicability and caller abort. |
| same Node test runner, eight relocated retained check-in/reply test files | exit 0, 39/39, zero failures/skips/cancellations. |
| same Node test runner, relocated `rebuild-cookie-cancellation.test.mjs` and `rebuild-review-guidance-request.test.mjs` | corrected relocation: exit 0, 140/140, zero failures/skips/cancellations. Retained finite transport controls only; no blocked Guidance private-return/M65 rerun. |
| `node apps/portal/node_modules/typescript/bin/tsc -p apps/portal/tsconfig.frontend.json` | exit 0, unchanged configured flags. |
| same compiler, `-p apps/portal/session-integration/runtime/tsconfig.json` | exit 0, unchanged configured flags. |
| `node ./.../root-emission.mjs` | corrected own harness path: exit 0; all 24 actual Root non-declaration files have exact author-final source and exact author-before/final emitted JavaScript; zero diagnostics. |
| same Node test runner, `--test-name-pattern='W7 RPC streaming bound'`, `rpc-stream-bound.test.mjs` | **exit 1, 0/1, PH1**, full 3,145,756-byte RPC response consumed, no cancellation, then 503. Stopped dependent acceptance. |
| `git diff --check` | exit 0 before report; repeated for report commit. |

All transport executions are closed in-memory synthetic HTTP transcripts. Auth/context/RPC responses are synthetic; the actual application/session/cookie/Vault/provider/Root implementation is exercised. Unexpected routes and all Storage calls reject in the new closed tests. No listener, native service, browser/DOM, provider request, genuine Auth or persistence was acquired. SSR/UI/camera was not executed in this backend metadata review.

### compiler and emission qualifications

TS6.0.3 uses `strict:true`, `noUncheckedIndexedAccess:true`, `verbatimModuleSyntax:true`, `skipLibCheck:false` and actual declarations. The paired Root/App experiment gives baseline 6 diagnostics, current 0, introduced 0. The paired Worker experiment gives baseline 50, current 44, introduced 0. **The full strong Worker graph is not zero-error.** Configured typechecks are separate evidence.

Actual reviewer closures are 112 and 141 files, versus the author's 108 and 137. The authorized clone of both root and portal dependencies makes four existing root React/css declaration files reachable: `node_modules/@types/react/{global,index,jsx-runtime}.d.ts` and `node_modules/csstype/index.d.ts`. All common declaration/source bytes match the author, and each baseline/current pair has the same options and declarations. No flags, types, library names or diagnostics were removed. `compiler-reconciliation.json` records the exact difference.

The entire closed session/gateway/Root bundle has 67 inputs and is byte-identical across the six erased annotations and to the author, SHA-256 `ed968bb6b46d72772c06491c4a3092d6a3ad99936d5e1655c03cd59fe469ca4e`. No copied declaration, shim or erased dependency was used.

### retained failures and harness-only corrections

The initial old-closed relocation rewrote embedded esbuild imports to an incorrect tests-relative location and failed before the intended probe. Its raw is retained. Correcting only header imports/original module URL reproduced the actual old denial above. The first relocated retained-140 run was 106/140 because three dynamic imports still resolved relative to ignored evidence; correcting only those module locations yields 140/140 with unchanged assertions. The first own Root-emission harness pointed one directory above this checkout; its module-resolution failure is retained separately from the corrected 24-file proof. These are harness failures, not product defects or successful old-input results.

The author's original raw 1/5 Root RED, 0/1 closed RED, 12/14 early current result, raw strong compiler failures and later 21/21 remain preserved separately. No old failure is relabelled green. Existing Node module-type warnings remain. The initial shell default was Node20.11.0; no source tests used it. An initial unsupported top-level startup-config command exited 2; the valid `codex app-server --strict-config --print-startup-config` exited 0, CLI0.164.0.

## runtime, dependency and protection evidence

Initial live catalog/descriptors and final live catalog plus actual self/Parent `t3_thread_configuration` confirm provider `codex`, model `gpt-6.1-sol`, `reasoningEffort=xhigh`, `serviceTier=default`, default interaction mode. Own and Parent project config and all eight role files retain exact Sol/xhigh pins. No model/configuration change or nested delegation occurred.

Actual delegated task ID, supplied separately by Parent after the initial gate: `node:delegated-task:command%3Amcp%3Add730894-0fab-4a94-873d-743422eae122%3Adelegate-task%3Aportal-rebuild-w7-photo-head-source-review-20261101-r1`.

Backing child thread: `thread:delegated-task:command%3Amcp%3Add730894-0fab-4a94-873d-743422eae122%3Adelegate-task%3Aportal-rebuild-w7-photo-head-source-review-20261101-r1`. Actual run: `run:thread:thread%3Adelegated-task%3Acommand%253Amcp%253Add730894-0fab-4a94-873d-743422eae122%253Adelegate-task%253Aportal-rebuild-w7-photo-head-source-review-20261101-r1:ordinal:1`. Parent: `d632030a-18f7-4dec-a2c9-f5c0418c3fd5`. Task, child thread, run and ordinal are distinct; none was inferred as another.

Dependencies were absent locally. Before either APFS clone, all four actual lock hashes matched: own/Parent root `5c57c9aec9e4585066e032e234d610a77cbffd9a51f82700c158fc37fe01b5c2`; own/Parent portal `bc914f3a9c9f24e44f02e3cff2804651147385ea5abda58a064531329ef23203`. Nonsymlink ancestors, same device, absent ignored destinations and literal link containment inside each workspace were checked first. `/bin/cp -cR` then cloned root and portal node_modules. Full before/after byte/mode/literal-link parity covers 52,284 entries and confirms Parent dependencies unchanged. No install or dependency/configuration change occurred.

Frozen d4 protection verifies every original path/mode survives. Exactly the nine allocated existing paths differ; the other 1,982 originals, all 62 old migrations, all 113 old SQL files, every old test, original approved input and configuration/role/package/lock files remain exact. The 15 candidate paths match final d226. `final-preservation.json`, `candidate-final-parity.json`, the dependency manifests and conflict records retain the details. The only reviewer-authored tracked change is this report. Historical FAIL reports remain immutable.

## held gates and handoff

PH1 correction and a NEW independent review are required before source admission. This report does not authorize changes to shared runtime or any SQL. W4 port updates, current Root/App consumer integration, C05/C07 upload behavior, canonical migration rehearsal/pgTAP, actual SQL session/ACL/care-window/lock/revocation races, genuine Auth/Storage/persistence, native/browser/camera, visual/accessibility, full application suites/Expo/package, exact-head CI, hosted and release acceptance remain unrun or outside this allocation. No native/catalog/Auth/ACL/race proof is claimed.

No browser/preview/DOM/process inventory, database/SQL execution, Supabase allocation/CLI, fixture/service, Docker/SQLite, Storage, credentials, provider/network resource or blocked Guidance/M65 retry/reroute was used. No Parent edit, push, PR, merge, deployment, live client action, communication, payment, order or permission change occurred. The complete approved goal remains open.
