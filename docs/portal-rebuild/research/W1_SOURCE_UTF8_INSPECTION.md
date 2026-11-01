# W1 actual UTF-8 inspection primitive

Owner: Kanuj. 1 November 2026. Bounded SOURCE-only implementation under the complete approved rebuild. This is an implementation report, not an independent review or Source admission.

## Allocation and verified identity

- Workspace: `/Users/kanuj/.t3/worktrees/shelv/t3-d28c4829`; branch `t3/source-utf8-inspector`.
- Exact starting Parent: `d87de5b6a08d9143a49de3d0c3fa86646aa6d42b`, canonical62. Initial clean inventory: 1,952 tracked paths and 62 SQL migrations. No child65 dependencies.
- Authoritative taskId, supplied by Parent: `node:delegated-task:command%3Amcp%3A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%3Adelegate-task%3Aportal-rebuild-w1-source-utf8-inspection-pure-20261101-r1`.
- Separate actual backing thread: `thread:delegated-task:command%3Amcp%3A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%3Adelegate-task%3Aportal-rebuild-w1-source-utf8-inspection-pure-20261101-r1`.
- Separate actual backing run: `run:thread:thread%3Adelegated-task%3Acommand%253Amcp%253A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%253Adelegate-task%253Aportal-rebuild-w1-source-utf8-inspection-pure-20261101-r1:ordinal:1`; requested11:49:46.361Z, started11:49:47.208Z, ordinal1.
- Actual parent thread: `d632030a-18f7-4dec-a2c9-f5c0418c3fd5`; project `ac0af19d-d404-4f53-a870-02bfd76c2a80`. T3 worktree/thread readback confirms this branch/workspace/run. Registered Root is read-only context, never this task's write destination.
- Both LIVE capabilities and thread configuration positively select `codex/gpt-6.1-sol`, `reasoningEffort=xhigh`, `serviceTier=default`, full-access/default. Supported descriptors include effort low/medium/high/xhigh/max/ultra and tier default/priority. Project `defaultModelSelection=null` is recorded as null, not inferred as a pin. Project config/default-subagent and each of eight role files explicitly pin Sol/xhigh/max8. No settings change, fallback or nesting.
- Explicit Node executable: `/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node`, observed v22.23.0. Existing Root TypeScript6.0.3 and real Node declarations are read-only compiler inputs. No package installation or lock/config change.

Only three new tracked paths are allocated: [inspector](../../../supabase/functions/concierge-sources/utf8-inspection.ts), [focused tests](../../../tests/portal-source-utf8-inspection.test.ts), and this report. The existing root harness runs `.test.ts` with Node type stripping; no CJS wrapper is needed. Own ignored evidence is `.local-artifacts/portal-rebuild/w1-source-utf8-inspection/`. W0's independent A07 harness, shared contracts, runtime/routes/App, all SQL and Root/native87 remain outside ownership.

## Small seam fixed before implementation

```ts
inspectSourceUtf8(bytes: Uint8Array): Promise<SourceUtf8Inspection>

type SourceUtf8Inspection = Readonly<{
  profile: 'source_utf8_v1';
  convention: 'unicode_scalar_utf8_half_open_v1';
  sha256: string; // lowercase SHA256 of the exact original captured bytes
  byteLength: number;
  text: string;
  scalarCount: number;
  scalarByteOffsets: readonly number[];
}>;
```

This import-free, server-internal primitive inspects only actual supplied UTF-8 bytes. `source_utf8_v1` is an engineering candidate profile with inclusive original-byte bound0..500000. It does not enable or publish a SourcePolicy capability, choose a permanent full-scope limit, or identify a file's media type. Audio, PDF, WebP and other images still need separate real inspectors; even a PDF made of ASCII bytes cannot be identified as a PDF by this seam. A future producer must select the correct actual format and profile.

The complete scalar boundary map has `scalarCount+1` ordinary-number entries. Boundary0 is byte0; the final boundary is exactly `byteLength`. For any valid scalar interval `[a,b)`, original bytes `[map[a],map[b])` decode to the same scalar text interval. An astral scalar consumes two UTF16 code units but one scalar position and four bytes. CR and LF each consume one scalar/byte. Decomposed combining characters remain separate scalars.

The exact frozen model was inspected using read-only Git at `d0f3a31c778d8d08ee752dc1d4b49c4eec26874a`, without importing its modules. `PortalSource.ts:16/21/68` specifies `unicode_scalar_utf8_half_open_v1`; `PortalSourceValidation.ts:64` uses `TextDecoder('utf-8',{fatal:true,ignoreBOM:true})`. Thus leading U+FEFF stays in decoded content and consumes one scalar/three original bytes. No conflict was found. No BOM stripping, CRLF conversion, Unicode normalization, replacement repair or surrogate invention is allowed. Actually encoded U+FFFD is valid.

Before copying, decoding, hashing or allocating a mapping, validate the native Uint8Array brand, original byte bound, ordinary fixed ArrayBuffer and exact subarray offset/length. Refuse shared/resizable/detached or otherwise unprovable snapshots. Use intrinsic native getters rather than caller properties/iterators/species. Capture owned exact bytes synchronously before the first await; subsequent decode, mapping and native SHA256 use that same snapshot without later caller reads. Freeze the map before the hash await and the returned graph before return. Expose no mutable bytes, typed arrays or other backing aliases.

Finite private rejection messages are `source_utf8_invalid_input`, `source_utf8_unstable_input`, `source_utf8_byte_limit_exceeded`, `source_utf8_invalid_encoding`, and `source_utf8_inspection_unavailable`. They contain no input text/bytes/name or underlying exception cause. They are internal errors, with no HTTP/public error mapping or logging.

No actor, time, source/version/session/grant, readiness/approved flag, proof row or storage locator is returned. The result is not database proof, permission, upload completion, a URL, body authorization or physical absence. Authority, management, consent/legal clearance, CAS, RPC/producer/worker/byte-proxy protocols are not selected here.

Native semantics were checked against the [WHATWG TextDecoder specification](https://encoding.spec.whatwg.org/#interface-textdecoder) and [WebCrypto digest specification](https://www.w3.org/TR/webcrypto/#SubtleCrypto-method-digest). Fatal decoding rejects ill-formed input; enabling ignoreBOM preserves the BOM. SHA256 consumes the supplied byte sequence. Public documentation reads are separate from the globally denied test fetch. No Supabase product/API/SDK/configuration changes are made; the Supabase skill's generic CLI/query workflow is excluded by this pure-source allocation.

## Context and preserved scope

Read applicable AGENTS, the complete original approved input and appended goal/A/B/C, D01-D48, desktop specification, implementation contracts, workstreams/status, the full [readiness plan](W1_SOURCE_IMPLEMENTATION_READINESS_PLAN.md), [model freeze](COORDINATOR_SOURCE_PROPOSAL_FREEZE.md), exact original/append-only W1 Source report and R1-R5 reports. Read-only copies and exact source hashes are in `references.json`. The latest [founder consent decision](../DECISION_ADDENDA.md#source-consent-workflow-1-november-2026) selects actual explicit advisor-recorded confirmation with client review/withdrawal in Account; final disclosure wording and that implementation remain open.

Historical raw qualifications remain attributed and unchanged: raw17=16/17 and raw40=39/40 unsafe job-only positives; raw11=9/11, scheduling-only10/11 on the same original promise, separately adapted returned-model11/11. R5's185 and separate16 overlap, without a201-run/uniqueness claim. None is rerun, rewritten or relabeled as current inspector evidence. S1-S10's model correction and scoped R5 PASS do not establish byte inspection, current rights or physical cleanup.

The full Source goal remains registry/version/adoption/payload, real authorized upload/parts/inspection/completion, disclosed purpose-specific consent and exact-version grants/revoke, current-authority body proxy, supported media inspectors, retention/service/obligation lineage, complete physical cleanup/account cascade and the real W2 reader. Never-started draft material remains authorized manual deletion without an abandonment timer; started-service raw retention remains actual confirmed END plus12 calendar months. The full approved26-screen rebuild and its independent/genuine/human/CI/release gates remain open.

## Verification record

Early coherent checkpoint: the initial absent-module run exits1/ERR_MODULE_NOT_FOUND and executes no behavior; it is retained as setup evidence only. After the callable empty-only scaffold exists, the unchanged focused suite gives **1 pass/39 fail/40 registrations**, exit1,96.516291ms. This is substantive assertion RED: ASCII `'' !== 'abc'`, actual SHA mismatch, lost BOM/non-ASCII/scalars, missing malformed/type/bound/snapshot rejections. No failed import/export/compiler/setup is counted as that RED. The scaffold was never committed or exposed as an authority/producer port.

Implementing native-slot validation, exact synchronous snapshot, fatal native decode, complete original-byte offsets, native SHA256 and frozen facts gives **40/40 pass,0 failures/skips/cancels**, exit0,120.029625ms. The same test file/predicates ran before and after. Initial full actual source+test TypeScript6 strict compile exits0 with zero diagnostics, using real Root declaration inputs and unchanged required flags. No dependency request, install, fake declaration, shim or flag relaxation was needed. Existing Node MODULE_TYPELESS_PACKAGE_JSON warning is retained; packages are unchanged.

Tests independently compare literal UTF8 bytes/text/boundaries, Node `createHash` and known empty/abc SHA vectors, Node Buffer roundtrip and every half-open scalar interval. They cover ASCII/empty/non-ASCII/decomposed+precomposed/astral/BOM/CRLF/loneCR/NUL/valid U+FFFD, scalar extremes,18 malformed encodings, exact500000 ASCII/astral bytes and max+1 before decoding, subarray/empty-tail/large-backing views, invalid runtime types/proxies, poisoned caller accessors/species, cross-realm/subclass views, actual detached/shared/growable/resizable/OOB views on Node22, caller mutation+transfer during real native hashing, initial-invalid repair refusal, deep freeze/no byte aliases and readonly type consumers. Test `fetch` is globally denied; no crypto/provider/current-authority override is used.

TDD and verification-before-completion apply to this bounded subset; the broader readiness stages have no execution/resource grant here. Native Edge memory/peak verification is **UNRUN**. Original input copy is bounded to500000 bytes and the ordinary map to500001 number entries; decoded content is bounded by those original bytes. Those are code bounds. Native decoder/hash/array overhead, concurrency and actual Edge peak memory were not measured. No benchmark/peak claim follows from array counts or Node duration.

### Final actual closure and emitted execution

Early coherent commit: `c6e299e7be7ac022fa75c4e7e9c85a82d373a8f5`. No production or test edit followed that checkpoint. Final source execution is **40/40 pass,0 fail/skip/cancel**, exit0,123.666834ms. Separately emitted execution is **40/40**, exit0,83.34625ms, not80 distinct behaviors. Both use actual native WebCrypto and a globally denied test fetch.

Actual TS6.0.3 source closure has **59 files**; actual source+test/import/declaration closure has **165 files**, each freshly strict-compiled with zero diagnostics. Both `--listFilesOnly` outputs and every actual path/realpath/byte count/SHA256 are preserved. No Source4, Commerce/payment, shared runtime/App/native module is in either closure. Source has no imports; the test reaches only this inspector and native Node builtins, with real Node/DOM declarations. TypeScript implementation and declarations are read-only from the existing Root installation. No absent module/type was invented.

The existing portal esbuild0.28.2 was used strictly with `write:false`, Node22 target, ESM, no injected shims or flags. The sole inspector emit input is the new module. The complete test emit inputs are exactly that module and the new test, verified from the actual metafile; native Node imports remain native. Returned compiler bytes were saved only as own ignored evidence, and the complete test bundle was actually executed. Emission is additional source evidence, not an Edge/native fixture.

| Artifact | SHA256 |
| --- | --- |
| Actual inspector source | `f591cb209b02ae0095100ced2a281bc436470cd63c62a9a13f2f7e97fdaf5f96` |
| Actual focused test source, unchanged RED through final GREEN | `24d24b03e25927ae18ca487e07ab552019c2c63167fa690fa31a7077027f0331` |
| Emitted inspector,3646 bytes | `7f65b9f46e281b11ea3c0683cebffb6897f33bc13e7754336f9e7107ff1bc975` |
| Emitted complete test bundle,15504 bytes | `6b971d111530ea5f4428846a82c5b6149f27433f82d627ea297341147f5e639f` |

Main commands, from this child workspace:

```sh
/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node --experimental-strip-types --test tests/portal-source-utf8-inspection.test.ts
/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node .local-artifacts/portal-rebuild/w1-source-utf8-inspection/verify.cjs
/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node --test .local-artifacts/portal-rebuild/w1-source-utf8-inspection/emitted-tests.mjs
git diff --check
```

`verify.cjs` records the exact compiler and unit argv/exits/raw-output hashes in `commands-final.json`. Unchanged required flags for both actual strict graphs are `--ignoreConfig --noEmit --strict --noUncheckedIndexedAccess --verbatimModuleSyntax --skipLibCheck false --allowImportingTsExtensions --target es2022 --module esnext --moduleResolution bundler --lib ES2022,DOM`; the complete graph adds `--types node --typeRoots /Users/kanuj/Documents/projects/shelv/node_modules/@types`. Compiler is `/Users/kanuj/Documents/projects/shelv/node_modules/typescript/bin/tsc`. No positive cast conceals mutable result types; the three negative readonly consumer checks compile only because their expected errors are present.

### Preserved failures, compatibility and terminal boundary

The original RED/setup/first-GREEN/first-strict logs remain separate from final source/emitted/strict logs. The missing-module setup executes zero behavior; the callable empty-only scaffold gives the actual39 assertion failures. No substantive RED was claimed from the setup run. Static reconnaissance also guessed an absent current W1 report (correctly read from exactd0f Git), absent current Source-selector test (never imported), an incorrect R1 report basename (corrected from Git's changed-path list), and absent child/Root esbuild dependency paths (the existing permitted portal compiler was used). Initial combined displays were sometimes truncated and followed by bounded reads. Raw qualifications are preserved in own evidence; none was a compiler/product failure or repaired by dependency installation. No compiler failure occurred in this inspector slice. Node's source-run typeless-package warning remains, with no package changes; emitted ESM execution has no such warning.

Final preservation verifies all **1,952 original tracked paths** against their pre-edit bytes/modes, all **62 migrations**, all **five retained approved originals** against INPUT_PROVENANCE, and all nine project/eight-role configuration hashes. Exactly the three allocated new tracked paths differ from Parent. All five local report links and `git diff --check` pass. Source/test hashes above bind the tested code; the final report-containing commit/hash and clean-tree receipt are returned separately to avoid self-reference. Both final LIVE tools again positively select codex/Sol/xhigh/default; the actual T3 thread/worktree/run matches this original allocation. `runtime-final.json` retains those readbacks. This is author verification only; no independent review was allocated or performed.

**UNRUN/outside this allocation:** broad Root/application/Expo suites, Edge memory/runtime, SQL/migration/DB/Storage/Auth, credential/provider/browser/preview/process inventory/native/fixture work, source rights/authority, Source15 API/policy/profile admission, actual upload/cleanup/account/clinical/App composition, consent/Account disclosure wording, human/physical/hosted/CI/release acceptance. No Supabase SDK/API/config/CLI/help/new/migration call, old resource adoption, Root import, Source4/Commerce/M63-M65/native87 import, nested task, push/PR/merge/deploy, live communication/client permission/money/retailer action occurred. Native JavaScript TextDecoder/WebCrypto and compiler execution are the explicitly permitted pure Node checks. No resource grant or wait remains; return the owned commits and terminate with full Source/full rebuild scope still open.
