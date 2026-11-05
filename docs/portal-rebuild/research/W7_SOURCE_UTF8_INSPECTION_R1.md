# W7 Source UTF8 inspector independent review R1

Owner: Kanuj. 1 November 2026. **Specification/completeness: scoped PASS for this pure UTF8 inspector slice. Correctness/quality: scoped PASS.** No material counterexample was found in the inspected source and bounded independent Node/compiler checks. This does not complete Source ingestion, establish trusted proof or admit any endpoint, profile, role or current authority. No production or tracked test was fixed.

## Identity, allocation and exact inputs

- Exact new review workspace: `/Users/kanuj/.t3/worktrees/shelv/t3-3378027b`, branch `t3/w7-source-utf8-review-r1`. Initially clean at Parent **`5834cf51fb41b12a1bbacda4005260e31522ab33`**, with **1,952 tracked paths and 62 canonical migrations**. No remote freshness claim or fetch.
- Authoritative taskId, separately supplied by Parent: `node:delegated-task:command%3Amcp%3A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%3Adelegate-task%3Aportal-rebuild-w7-source-utf8-inspection-review-20261101-r1`.
- Separately verified backing threadId: `thread:delegated-task:command%3Amcp%3A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%3Adelegate-task%3Aportal-rebuild-w7-source-utf8-inspection-review-20261101-r1`.
- Separately verified backing runId: `run:thread:thread%3Adelegated-task%3Acommand%253Amcp%253A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%253Adelegate-task%253Aportal-rebuild-w7-source-utf8-inspection-review-20261101-r1:ordinal:1`. Requested `2026-11-01T12:09:19.061Z`, started `12:09:19.877Z`, ordinal1. These are not interchangeable handles.
- Actual parent thread: `d632030a-18f7-4dec-a2c9-f5c0418c3fd5`. Project: `ac0af19d-d404-4f53-a870-02bfd76c2a80`, registered root `/Users/kanuj/Documents/projects/shelv`. Live thread readback matches the branch, worktree, run and project. Project `defaultModelSelection=null` is recorded as null, not a model pin.
- BOTH initial live `orchestrator_capabilities` and `t3_thread_configuration` positively select **codex / gpt-6.1-sol / reasoningEffort=xhigh / serviceTier=default**, full-access/default. Advertised effort values are `low,medium,high,xhigh,max,ultra`; tiers `default,priority`. The catalog's low default is distinct from the selected xhigh. Local project/default-subagent pins, max8 and all eight role files were individually checked; global selected model/effort/tier also match. Project config SHA256 `927e3dd532c0daabbb975f6879866aa99cbc12d3f20d080b0568867e37ee66ff`; each role SHA256 `a1f57cf26da8626380cbaa101ca04dc39a92e4bd6aa6acb6cd9f5f24a05d9feb`. No settings change, fallback or nested task.
- Explicit executable `/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node` reports **v22.23.0** and runs every Node/compiler check. Existing TypeScript6.0.3 and real declarations are read-only inputs; no installation, dependency/config/lock change, ambient replacement, shim or flag relaxation.

Only the following ordered candidate commits were imported with `git cherry-pick -x`, after inspecting their changed paths:

| Frozen input | Local attributed review input |
| --- | --- |
| `c6e299e7be7ac022fa75c4e7e9c85a82d373a8f5` | `d6bb5032201320aaf4ec1206419db6d1c851bc0b` |
| `41644e6320fa85d73141c180383e5c5d2e24f00d` | `f392068aff263c06aaa8bd86d4edaa2a0cf0a29a` |

The pre-report review head is **`f392068aff263c06aaa8bd86d4edaa2a0cf0a29a`**. These two ancestors are review inputs, **excluded from reviewer delivery**. Deliver only the subsequent commit containing this report. The report-containing SHA and clean-tree receipt are returned separately to avoid self-reference. The sole authored tracked path is this report; all own probes/copies/emits/logs are ignored under `.local-artifacts/portal-rebuild/w7-source-utf8-inspection-r1/`.

Every candidate blob equals exact41644e63, including the full directly read **16,701-byte** [author report](W1_SOURCE_UTF8_INSPECTION.md):

| Candidate path | Git blob | SHA256 |
| --- | --- | --- |
| [inspector](../../../supabase/functions/concierge-sources/utf8-inspection.ts) | `a22f34e3a76801dd6c65fd13112f8ea9fc8a5bc1` | `f591cb209b02ae0095100ced2a281bc436470cd63c62a9a13f2f7e97fdaf5f96` |
| [original focused tests](../../../tests/portal-source-utf8-inspection.test.ts) | `7f8f9617bb635e82322fd65fc8fda59562847040` | `24d24b03e25927ae18ca487e07ab552019c2c63167fa690fa31a7077027f0331` |
| W1_SOURCE_UTF8_INSPECTION.md | `1c7a3a410121897deddf6966f7a753ae6c8b8f09` | `013f74e8684268c783c6fa2d6690de74492e7484ada742d09941f8ef722fad6c` |

## Requirements and historical context

Read applicable AGENTS, complete retained [95,388-byte approved input](../source/APPROVED_INPUT.txt), D01-D48/full desktop/source/privacy/recovery requirements, contracts, workstreams/current status, full [readiness plan](W1_SOURCE_IMPLEMENTATION_READINESS_PLAN.md), [model freeze](COORDINATOR_SOURCE_PROPOSAL_FREEZE.md), original W1 Source contract/append-only responses and complete R1-R5 reports. Frozen source/reference copies are checked against their exact Git refs in `references-audit.json`, including d0f3a31c's model and exact historical reports. No Source4 module was imported or executed.

The author evidence home was read-only: `/Users/kanuj/.t3/worktrees/shelv/t3-d28c4829/.local-artifacts/portal-rebuild/w1-source-utf8-inspection/`. All **53 files** were copied byte-for-byte into own `author-originals/`, made read-only, read/hash-audited, and remain exact. `author-originals-manifest.json` binds original/copy paths, sizes and hashes; `author-read-audit.json` preserves raw diagnostic/test-summary distinctions. This includes original setup/RED/GREEN, strict/listFiles/closure, emitted/metafile, runtime, command and preservation records. No foreign runner or emitted bundle was executed; all executions below use this review checkout or own ignored inputs.

Historical Source results are unchanged and attributed, not rerun or promoted here: raw17=16/17 and raw40=39/40 retain unsafe job-only positives; raw11=9/11 and scheduling-only10/11 remain distinct from adapted returned-model11/11. The discarded early catch observes the same original promise. R5's185 and separate16 overlap; there is no201-registration/uniqueness claim. S1-S10 corrections and scoped model PASS do not prove bytes, current rights or physical absence. This is the first independent inspector review, not a correction of a prior UTF8 product finding.

The later [founder consent decision](../DECISION_ADDENDA.md#source-consent-workflow-1-november-2026) selects actual explicit advisor-recorded confirmation and client review/withdrawal in Account. It does not approve disclosure wording or activate content, roles, profiles or Source15. Never-started draft raw material remains authorized manual deletion without an abandonment timer; started-service retention is actual confirmed END plus12 calendar months. Payment, product Start, fallback paid coverage and the30-day care-read window cannot replace that basis.

## Specification/completeness assessment

The seam is exactly `inspectSourceUtf8(bytes: Uint8Array): Promise<SourceUtf8Inspection>`, with only a readonly facts type and one function exported. It has no imports. Returned own data fields are `profile`, `convention`, `sha256`, `byteLength`, `text`, `scalarCount`, `scalarByteOffsets`. No bytes/backing buffer, actor/time/source/version/session/grant, ready/approved/current flag, proof row, locator, URL or authorization callback is exposed.

`source_utf8_v1` is an internal engineering candidate with inclusive **0..500000 original bytes**, including empty text. It neither enables SourcePolicy nor identifies a file format. ASCII PDF bytes can be valid UTF8; a later actual producer must select the proper format/inspector. Audio/PDF/WebP/image/container/duration/extraction work remains separate. The candidate bound does not permanently narrow the full recording/transcript/photo goal.

The frozen d0f3a31c model uses `unicode_scalar_utf8_half_open_v1`; its actual `decodeSourceUtf8` uses fatal native decoding with `ignoreBOM:true`. The inspector preserves that convention. A leading BOM is content: one scalar/three original bytes. CR and LF remain separate; decomposed characters remain decomposed; an astral scalar is one scalar/four bytes/two UTF16 units; encoded U+FFFD is valid. Neither Unicode normalization nor replacement repair occurs.

The complete ordinary-number map has `scalarCount+1` entries, starts at0 and ends at exact original byte length. It describes original half-open byte boundaries, rather than UTF16 indices or normalized/reencoded offsets. Original tests compare every interval in their literal fixtures; independent controls compare every scalar boundary across the complete Unicode scalar domain.

The result is a deeply frozen snapshot of actual supplied bytes. It is not trusted database inspection proof, a registered descriptor, upload completion, physical absence, human consent, body authorization or current source readiness. Registry/reservation/parts/object/proof linkage, canonical persistence, CAS/RPC/producer/worker/byte protocols, current authority and actual W2 reader are intentionally outside this allocated slice. Their absence is not manufactured as a defect in this pure primitive.

## Correctness/quality assessment

The full122-line implementation and238-line original test were inspected directly. Relevant source reasoning, independently exercised below:

1. Native TypedArray brand/buffer/length/offset getters avoid caller getters, iterators, methods, constructors and species. Proxies/lookalikes/non-U8 views reject; genuine subclasses, Node Buffer and cross-realm U8 views retain actual slot semantics.
2. The actual byte bound precedes content copy/decode/hash/map allocation. Native ArrayBuffer brand checking rejects shared memory, including cross-realm/growable shared. Resizable buffers are refused, including tracking/fixed/OOB views. Reconstructing a native exact view also refuses detached zero-length buffers. Offset arithmetic checks `offset <= bufferLength` and `length <= bufferLength-offset` before construction.
3. An owned fixed non-shared copy is captured synchronously before the first await. No input property/content is read afterward. Fatal native TextDecoder, map construction and native WebCrypto SHA256 all use those same captured bytes. Mutation/repair/transfer cannot mix old text with new digest or offsets.
4. Fatal decode proves canonical UTF8 before the bounded lead-width map walk. Complete offset checks and the final exact-byte equality defend the original-boundary invariant. Copy <=500000 bytes, decoded text bounded by valid input, and map <=500001 number entries are **code bounds**, not measured Edge memory/peak/concurrency claims.
5. The ordinary map is frozen before the digest await; the returned object is frozen before return. All other values are primitives. There is no mutable typed-array/backing alias, caller graph certification or cross-call map sharing. Actual strict consumer checks establish the closed exact key/profile types, async result, readonly property and readonly array boundary without positive casts hiding mutability.
6. Five finite private error messages remain: `source_utf8_invalid_input`, `source_utf8_unstable_input`, `source_utf8_byte_limit_exceeded`, `source_utf8_invalid_encoding`, `source_utf8_inspection_unavailable`. Semantic refusals expose no caller text/name/bytes/cause/custom fields. There is no logging or HTTP/public error mapping. Unavailable native-environment branches were source-audited, not forced by replacing crypto/decoder globals. A maliciously replaced server global/prototype is not an ordinary caller input capability and is not reported as a reachable defect.

No crypto, decoder, timer, current-authority or successful provider port was overridden. Native Node WebCrypto is actually invoked; independent SHA expectations use Node `createHash`. Test fetch is globally denied. Pure JavaScript native builtins are permitted Node source checks, not native fixture/resource acceptance.

## Fresh independent execution

| Check | Actual result |
| --- | --- |
| Deliberately absent inspector in own scaffold tree | Exit1, ERR_MODULE_NOT_FOUND; **zero behavior checks**, setup only |
| Reconstructed callable empty-only scaffold, byte-identical original test | **1 pass/39 assertion failures/40 registrations**, exit1 |
| Exact original40 on actual candidate source | **40/40**, exit0, no failures/skips/cancels |
| Same original40, separately emitted actual bundle | **40/40**, exit0, no failures/skips/cancels |
| Exact root harness invocation without `--test` | **40/40**, exit0, no failures/skips/cancels |
| Actual TS6 strict source closure | **59 files**, exit0, zero diagnostics |
| Actual TS6 strict source+original test closure | **165 files**, exit0, zero diagnostics |
| Own independent controls from source | **9/9**, exit0, no failures/skips/cancels |
| Own independent controls, actual emitted bundle | **9/9**, exit0, no failures/skips/cancels |
| Actual strict own control/import/declaration closure | **165 files**, exit0, zero diagnostics |
| Four deliberate ignored sensitivity mutations | Each selected behavioral test fails, exit1; unmodified controls pass |

The scaffold type/export is callable, with a frozen constant empty result and the correct empty SHA. The same original test bytes/predicates produce substantive ASCII/hash/non-ASCII/BOM/scalar/refusal failures, separate from missing-module setup. This is a sensitivity reconstruction, **not a preexisting product/domain defect**. Author raw RED and own RED are separate artifacts, not falsely claimed byte-identical scaffold implementations. The original40 repeated through source/emission/root harness remain40 predicates, not80 or120 unique behaviors.

Own additional9 registrations are bounded domain/oracle controls, not a second copy of those40:

- All **1,112,064 Unicode scalar values**, excluding surrogate code points, in56 batches of at most20000 scalars. Actual Buffer UTF8 encodings, independent SHA256, exact text and every cumulative `Buffer.byteLength(character)` boundary are compared. This does not mirror the inspector's lead-byte branch.
- All **65,792 one-/two-byte sequences**, using native independent `node:buffer.isUtf8` as the validity oracle:18,432 valid and47,360 invalid. Valid sequences match raw SHA/text/maps; invalid ones give the finite private encoding refusal.
- Long valid prefixes followed by malformed extremes, repeated/leading BOM, CRLF/loneCR, decomposition/precomposition, astral content, NUL and encoded replacement scalar. A mixed-width exact500000-byte input passes; adding one malformed byte gives500001 bytes and byte-limit refusal. An empty view at the end of oversized backing remains empty valid input.
- Revoked/untrusted proxies and non-U8 cross-realm brands run zero caller traps. Poisoned native U8/ArrayBuffer subclass properties and species run zero hooks. Cross-realm fixed, detached, shared/growable and resizable cases retain their expected acceptance/refusals; original tests additionally exercise actual OOB views on Node22.
- Eight concurrent actual native hash jobs keep independent results: four inputs mutate/transfer synchronously after invocation and four in a microtask. Text/hash/map ownership remains captured; returned own properties contain no accessors or symbols and refuse property replacement/deletion/prototype/array mutation.

Four own ignored source copies deliberately strip BOM, substitute scalar ordinal offsets, return a wrong hash after actual native hashing, or defer capture until after an await. The selected unchanged control predicates fail each; no candidate edit or native-global replacement occurs. The offset/hash variants produce assertion mismatches; BOM/snapshot variants fail the selected positive with finite unavailable/unstable errors. These are four sensitivity executions, not four candidate findings.

## Actual closures, commands and hashes

Compiler: `/Users/kanuj/Documents/projects/shelv/node_modules/typescript/bin/tsc`, actual TypeScript6.0.3. Every graph retains:

```text
--ignoreConfig --noEmit --strict --noUncheckedIndexedAccess --verbatimModuleSyntax
--skipLibCheck false --allowImportingTsExtensions --target es2022
--module esnext --moduleResolution bundler --lib ES2022,DOM
```

Test graphs add `--types node --typeRoots /Users/kanuj/Documents/projects/shelv/node_modules/@types`. Actual `--listFilesOnly` output and every resolved source/declaration path/realpath/hash are saved in `strict-*-closure.json`. None contains Source4, Commerce/payment, App or shared session-runtime modules. No declaration stub, missing-module workaround or changed compiler flag is involved.

Existing portal esbuild0.28.2 runs with **write:false**, bundle/ESM/Node22, no shims. Module-only emitted input is exactly the inspector. Original test bundle inputs are exactly inspector+original test; own test bundle inputs are exactly inspector+own ignored test. Native Node imports stay external/native. Each complete test emit was actually executed here, rather than trusting an author bundle.

| Emitted artifact | Bytes / SHA256 |
| --- | --- |
| Inspector |3646 / `7f65b9f46e281b11ea3c0683cebffb6897f33bc13e7754336f9e7107ff1bc975` |
| Complete original test bundle |15504 / `6b971d111530ea5f4428846a82c5b6149f27433f82d627ea297341147f5e639f` |
| Own final control source | SHA256 `fadfd1fc1f8bbcb08c3e0f48fcef2b9dc78644160a547935ec9d6532967287df` |
| Own complete emitted controls | SHA256 `a324ebe033f8b90ea2a9902e230a94e6bfb36aa3ce6d4a9e6f52451b3f61384a` |

Main commands, from this review workspace:

```sh
/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node .local-artifacts/portal-rebuild/w7-source-utf8-inspection-r1/pin.cjs
/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node .local-artifacts/portal-rebuild/w7-source-utf8-inspection-r1/verify.cjs
/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node .local-artifacts/portal-rebuild/w7-source-utf8-inspection-r1/extra-checks.cjs
/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node --experimental-strip-types tests/portal-source-utf8-inspection.test.ts
/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node .local-artifacts/portal-rebuild/w7-source-utf8-inspection-r1/audit.cjs
git diff --check
```

`commands.json` and `extra-commands.json` bind exact cwd/executable/argv/exits/raw-log hashes, including every scaffold, strict/list, source, emitted and sensitivity run. For example: own scaffold RED log SHA256 `193632da03fc47f61195022659df212eaebd9c38617c06ed60d5205a6fcc6e32`; original-source GREEN `9530dcec629ae941bddfd6e6f591bb933bae20dbf70ccd7eda08b48d82f9e153`; original-emitted GREEN `2470eb9154de6816176fdc55a27b7087d4849cd740503d379bc993c77a88ee02`; final own-source GREEN `348a5efb7e0caf7ee631c538bbe3d09d5123ebf013ef272c20277d156b0ecdaf`. Raw first/setup logs are retained separately.

## Build/discovery consequences and preservation

The new directory has **no index.ts, handler, serve registration or config section**. Current source searches show only the new test imports the inspector. Root `npm test` discovers the new `.test.ts` through its existing glob; the exact direct invocation passes40. Root application tsconfig excludes Supabase; test tsconfig reaches the real inspector through this test. Focused actual closures above compile it. Portal static/runtime builds use explicit current gateway/Vault/frontend entries; the release source collector follows four explicit function entrypoints rather than requiring an index for every directory. No existing inspected build path was found to require a new Source index merely for this primitive. Full application/package/CLI discovery was not executed, and no endpoint admission is inferred.

The actual existing `careSourceHashes` and helper preparation code **does enumerate every concierge-* directory** for native-source inventories. Read-only membership comparison here therefore changes that selected source set from **87 to88 files**, adding only the inspector; it does not create another helper family/entrypoint. Parent must use a new inventory when later integrating. User separately reports Parent audited/backed up/stopped R9 at **12:04:38.293Z**. That is attributed Parent action, not this review's action, observation or resource grant. No fixture or live native inventory was queried.

`before.json` and `preservation.json` verify all **1,952 original Parent paths byte/mode-identical**, all **62 SQL byte-identical**, all five INPUT_PROVENANCE originals exact, all project/eight role config hashes unchanged, and every candidate blob exact41644e63. Parent5834 has later coordination docs than author d87; they remain untouched, rather than being replaced with author references. Only the three admitted additions and this authored report differ from Parent. Source4/financial/Commerce/SQL/App/runtime were not imported. No status/TASKS/CONTEXT_SYNC, package, lock, CI or original test was edited.

Read/setup qualifications: an optional guessed skill path and an unmatched shell glob failed before corrected reads; some combined displays truncated and were followed by bounded ranges/full-byte audits. Own first additional-test import traversed one directory too far, producing ERR_MODULE_NOT_FOUND with zero behavior checks; only its ignored import binding changed. A later static display loop used zsh's special path variable, so rg/nl/tail lookup failed within that one shell call; no test/compiler ran there, and fresh explicit Node/fs reads recovered the requested diagnostics. Earlier microtask-only passing controls were strengthened to include synchronous transfers, with both inputs/logs preserved separately. `setup-qualifications.txt` records these facts. Existing MODULE_TYPELESS_PACKAGE_JSON warnings remain; no package setting changed. None is counted as a candidate defect or substantive RED.

## Terminal scope

Final fresh live tools again select codex/Sol/xhigh/default with the supported descriptors; project/root/null default and the current thread selection remain correct. Explicit Node again reports v22.23.0. `runtime-final.json` retains these readbacks. Exact candidate/protected preservation, local report-link/line checks, sole authored path and ordinary/staged `git diff --check` are verified before the report-only commit; the final receipt and containing commit are returned separately. This review has no pending resource request or wait loop.

**UNRUN/outside allocation:** actual Edge runtime/peak memory/concurrency and native format selection; actual trusted inspection/proof/object/reservation linkage; Source15/API/policy/profile/cap/role/disclosure/current-authority admission; raw upload/parts/proxy/consent/grants/revoke; Source service/obligation/retention/physical cleanup/account cascade; actual W2 reader and canonical/genuine/browser/App composition; full Root/portal/Expo suites, OS/native fixtures, Auth/DB/Storage/Docker/SQLite, CLI/help/migration/provider/credential/resource calls, hosted/human/physical/CI/release/full-goal acceptance. No automatic recording/transcription/training/model transmission/raw export, live clients/messages/email/permission/funds/retailer action, nested delegation, Root integration, push/PR/merge/deploy occurred. Mandatory T3 model/config/project/thread reads are control-plane evidence only. The complete approved Source lifecycle and26-screen rebuild remain open.
