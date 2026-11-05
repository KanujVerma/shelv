# W7 CI19c manifest precondition R1: source, tests and saved evidence

Owner: Kanuj. 1 November 2026 UTC. Independent report-only review. No production/test fix, nested agent, browser acquisition, Parent integration, push, PR, merge or deployment.

## Verdicts and material finding

**SOURCE specification/completeness: scoped PASS. SOURCE correctness/quality: scoped PASS. TEST specification/completeness: scoped PASS. TEST correctness/quality: scoped PASS.** The narrow precondition observes the actual committed provider's accepted manifest before opening the detail scope; original assertions and the five-second notice budget remain intact. No new material implementation defect was established within the exercised source/SSR/finite synthetic HTTP boundaries.

**EVIDENCE specification/completeness: CHANGES REQUIRED. EVIDENCE correctness/quality: CHANGES REQUIRED for the supplied current-versus-CI correspondence.** E1 below disproves the declared two-input difference at the frozen Parent base. Historical Linux failure and finite author Mac observations remain valid within their original, different source graphs. **Current exact-head Linux CI is UNVERIFIED. There was no independent live browser execution.** Overall admission is held for E1's provenance correction; this is not a production/performance finding.

### E1 / P2: current compiler correspondence has five changed inputs, not two

Owner: coordinator, evidence/admission qualification. The allocation and Parent's saved CI investigation describe the current test bundle as differing from CI only in ApplicationSession and client-state, with a historical overlay authorized for only those two whole files. A fresh uninstrumented `write:false` compile of the allocated current graph instead finds **2195/2200 matching inputs and five differing input hashes**:

| Input under apps/portal/src/ | Current SHA256 | Saved CI SHA256 |
| --- | --- | --- |
| app/client-state.ts | e2bd339ec7ae42969f7eb61c89e5eb77a035194616c3cfb95fbc65367ac1e1fb | a6163de2d29ea15bf9843657c7364551f75fdf4083ba8b1069f9d383732179ee |
| app/session.ts | 689f95ab3208612e4b8e4782d0637004eb7092cce6ffc7e8c0b095706dc72e17 | 95b8bee2ecab589bb6e298b6b83565d0ff0edb7831a6a9830afec1c5770e7f98 |
| app/retained.ts | 2f734e84bb66e14970f391c803752438658cd70d965675ed115f21833ec15fdd | 404144256f36b247a2f287cba9bb709eab8b3cd379125ea58b9b785439b06a4c |
| navigation/history.ts | 8819dd47dd9b966f63e580fbc6a24d77dec98ab64cfd45f4d2c5adb3fd5e52df | f20e2cacb1bdf923619b43175e925a9f76d7e2838eb0b30e38188aca62670429 |
| navigation/react.tsx | 686317041523a29dd750ac5ba88387199b6239634ebae460e5c32617619db7fa | cc169e91f6cc103d3432b7cf75397dceac6e418a3511fb2557d8154f5e6b88dd |

Every current blob above already equals the frozen **e7cbeaf4 Parent blob**; none is introduced by the eleven-path candidate. The retained.ts difference is an erased generation type member, not another demonstrated runtime behavior change. The navigation inputs contain newer canonical-restoration/core-consumer work: history.ts was last changed by b8a6afbb5e230653ba12a93008dd9cd892a4bd5f and react.tsx by 69d6b9fbeabfe7e38bfb63f04d88136845c7d147. No general navigation audit or fault is inferred. Full Git diffs, old/current/base blobs and input records are preserved in `E1-current-ci-input-differences.json` and `graph-delta-*.diff` under the evidence root below.

The current default compile itself succeeds: 2200 inputs/10 outputs, nine output hashes equal saved CI, one JS output differs. Its JS is 1844864 bytes/SHA25614d30567de135a3704fc6b4d19ced54dc95cf422a02e91f15b98ba398a86bd5a. The independent wrapper exits1 at the explicit expected-two-input assertion; this is a meaningful failed provenance assertion, not an esbuild failure or an ignored compiler error. The observed compile already produced by the earlier build4 check likewise has **2197/2202 matching inputs**, the same five differences and one differing JS output.

Following the material-finding instruction, dependent historical-overlay work stopped immediately. **Neither the permitted two-input historical overlay nor any broader overlay was executed.** No three-file broadening, downgrade, source fix or forged hash match was attempted. The unexecuted tail of `compile-audit.mjs` is not evidence of completed historical builds.

Smallest correction: replace the two-input admission qualification with the complete five-input projection and its erased/runtime distinctions, while retaining the exact historical CI/author graphs separately. If a freshly compiled historical-equality proof is still required, the coordinator must explicitly allocate its complete input overlay in a subsequent bounded task. Current source tests passing does not erase this evidence difference. This finding does not establish that any extra input caused the Linux timeout or invalidates the precondition's implementation.

## Exact task, runtime, workspace and imports

- Authoritative current task ID, separately supplied by Parent: `node:delegated-task:command%3Amcp%3A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%3Adelegate-task%3Aportal-rebuild-w7-ci19c-manifest-precondition-review-20261101-r1`.
- Actual backing thread: `thread:delegated-task:command%3Amcp%3A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%3Adelegate-task%3Aportal-rebuild-w7-ci19c-manifest-precondition-review-20261101-r1`.
- Actual ordinal1 run: `run:thread:thread%3Adelegated-task%3Acommand%253Amcp%253A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%253Adelegate-task%253Aportal-rebuild-w7-ci19c-manifest-precondition-review-20261101-r1:ordinal:1`, started2026-11-01T08:08:10.153Z. Live thread metadata identifies Parent d632030a-18f7-4dec-a2c9-f5c0418c3fd5 and the subagent relationship. The capabilities tool's child-ID echo is not used as Parent lineage proof.
- Actual T3 worktree `/Users/kanuj/.t3/worktrees/shelv/t3-a86214ff`, branch `t3/ci19c-manifest-precondition-review`. Initial clean base **e7cbeaf450c82bb27a67bfa4fdf39df9552d1c66**, tree2903b715c71d875a3811d0c5fc72157c31754322. No network fetch, PR polling or claim of refreshed remote state.
- Initial and final BOTH live `orchestrator_capabilities` and `t3_thread_configuration` select **codex / gpt-6.1-sol / reasoningEffort=xhigh / serviceTier=default**, full-access/default interaction. Selected-model descriptors support xhigh/default. Registered project ac0af19d-d404-4f53-a870-02bfd76c2a80 is shelv; its saved T3 default selection is null. Effective model selection is explicit, not inferred from that null.
- Project model/default-subagent and all eight role TOMLs pin Sol/xhigh, enabled agents/max8. All nine final hashes equal the initial protected-file manifest. No nested agents were created. The user cap is eight including Root; no native-advertisement cap change is claimed. Global model/effort were read initially; final scalar model/effort/tier are Sol/xhigh/default with SHA256bfb4c9f86daba78fff84f4d8d767bde9fb0d0cfb7c309d39d9bf1e18cb5b7255. An initial whole-global-file hash was not captured, so no independent initial/final whole-global-byte equality claim is made.
- Codex CLI0.164.0 supports `app-server --strict-config --print-startup-config`; initial/final invocations exit0 without starting a server. Actual initial/final Node is **v22.23.0**. Every Node/npm/compiler command explicitly selects `PATH=/Users/kanuj/.nvm/versions/node/v22.23.0/bin:$PATH`; child source commands inherit it. Loaded portal TypeScript6.0.3, esbuild0.28.2, React19.3.1 and ReactDOM19.3.1 resolve inside this worktree. `loaded-closure.json` records a small actual compiler/React/native-esbuild closure with hashes, not the whole dependency tree.

Only **`git cherry-pick -x 9b2ba20999809440be62d0de85c121a1b8850bb5`** was imported, as **51f4c0ae59271631d4a7104502eac7e68925262f**. Candidate parent exactly equals the allocated base; imported tree is exactly **e7192db010301b39dd30cdfdf8a54329a48cce76**. The pre-import inspection confirmed eleven paths, all tests or W3 report, no conflict/manual merge. The copied full patch SHA is **a742797182c773d5526b40529819099cc5003278a3adcba66cf342641215b557**.

`source-attribution.json` records all eleven current Git blobs, full SHA256/bytes and source references. Ten paths equal their allocated author source/report byte-for-byte: code at3b2c9d0d4e416c8b7e93b9f883eff69703a98f36, including the10798 source control, and complete W3 report at64f8b61b65d4f7c052118b965ab9e763ecd9de28. The sole exception is the pinned Node helper: **11284 bytes/SHA256b9a09d8f1ac69df296bb05597da9451241a741d375108eebaa5e1e87c57d1db5**. Its complete diff from author3b2 is exactly the preexisting Parent historical coordinator-root-ci2550-telemetry-smoke-20261101 allowlist literal. No grant is renewed by that source metadata. Child inputs73c35/65c9/d8d51 and returned-grant commitc6ab76ff were not imported; newer Root App/session/types/ports/navigation were preserved.

## Dependency custody and write boundaries

Both own ignored dependency destinations were absent. Before copying, actual T3 workspace, non-symlink roots/ancestors, actual source directories, same device16777230 and all four full package/lock byte equalities were checked. The only dependency operation was **`/bin/cp -cR`**, once for Parent `node_modules` and once for Parent `apps/portal/node_modules`, into the corresponding own paths. Both COW clones exit0. No install, package setup script, fetch, full-copy fallback, Parent symlink, Parent module write or cleanup occurred. `dependency-preflight.json`/`dependency-clone.json` bind paths, device and four lock hashes.

All newly authored tracked work is this report. Ignored evidence lives only under **`.local-artifacts/portal-rebuild/w7-ci19c-manifest-r1/`**, abbreviated **E/** below. Existing tests' hardcoded ignored artifact destinations were relocated solely into E/test-output through the disclosed `source-preload.mjs`; per-module before/after hashes are in `output-relocations.jsonl`. No assertions, imports, fixture data, transport, production source, compiler flags or positive current/permission predicates were replaced. The precondition6 and bridge6 have no output-path source adaptation. The retained SSR/packaging/build/diagnostic checks include the declared artifact-path adaptation.

The preload denies global JavaScript fetch/net/http/https/DNS entry points; finite injected HTTP still traverses actual ApplicationSession, retained cookie, raw Review factory, strict five-action port, Root mapper and actual controller/hydrator. This is a JavaScript-level network fence, not an OS network-sandbox claim for subprocess binaries. No foreign runner, copied bundle or browser entry was executed. SSR execution is explicitly permitted source rendering, not DOM mounting.

Whole protected-base audit covers1936 existing regular-file paths. Apart from allocated test/report imports, production, Root contracts, auth, migrations, packages, configs and other original files stay byte-identical to this checkout's base. This review made no writes to the Parent checkout; it makes no global statement about other workers' concurrent state.

## Source and test assessment

The transformer validates the complete actual7305-byte Guidance.tsx SHA256 **578b7d98484635f48d3da0a3e211a54f408b23ba7f3cef73d47269147c66dd99**, then locates exactly one GuidanceState/Context.Provider opening element through TypeScript AST. The only compiled-source additions are one import and one descendant inside that existing provider. The onLoad callback returns the transformed contents directly; it creates no provider/hydrator, production API/prop, DOM ready flag or current override. On-disk production remains unchanged.

The descendant uses existing useGuidance/usePortalNavigation. Normal useLayoutEffect registers the committed actual context; render alone does not publish. Actual props view/session/mode/snapshot, active hydrator and canonical navigation scope bind the record. Its frozen primitive getter contains identity tokens, phase/counts/error/revision/time, without a mutable model, controller, observe/retry/dispose method or readiness setter. Subscription notification is guarded against a throwing diagnostic consumer; obsolete cleanup cannot clear a newer committed record.

The wait captures current basis, then the committed instance, then requires that exact commit/instance/current view/session/snapshot/scope/mode, active lifecycle and actual ready/non-null complete manifest. Known errors, mismatches, retirement, disposal or replacement refuse it. It neither counts26 requests as completion nor treats raw terminal arrival as Root aggregate acceptance. It issues no new observe, cancellation, retry or refetch. The existing initial cursor chain performs collection. Synthetic commit/cleanup source controls establish controller behavior; **they do not establish mounted React/StrictMode timing**.

Only the exact first2550 setup opts into observation. All other tests/default builds stay disabled. The added three polling waits precede the existing zero-eager-detail assertion and open action. Their time is precondition time, separate from the original post-click notice budget; the notice remains the existing default5000ms. Manifest readiness does not claim details ready. The original zero-loading wait remains, with its properly narrower meaning.

Independent static audit confirms **all26 original assert-call texts/order, the one loop body and all seven test names** are unchanged. Reversing only helper import/observeManifest option/pre-click wait yields the **entire published original file**,10384 bytes/SHA256 **50cac04422659e15bab2fd0820a7e8d072a0fd73cf65d9d850f8e566c4e11490**. The saved controlled browser source preserves the six original first-case assertion texts in order, unused before variable and exact notice call. The saved original loader is641 bytes/SHA256 **6fcaa67a288ccc9e5e276fcaf53973959d8ce552bf6fd2f8d92136154674c8ae**; it relocates only the three known helper imports. No original browser file/loader was executed by this review.

The actual transform is7443 bytes/SHA256 **3a382b210af440af84d3e1845ce157a2feaa660e8d59b88206a6df5ff812bdb5**, unique anchor SHA256c76b2bd1d5a6e9b726dd3cadb72e31a390076771165ca1cf32239bfabed99c45. The saved full transformed text was hash-verified and reconstructed independently from the exact two insertions. Current observed source metadata distinguishes compiler bytes/hash from on-disk bytes/hash and records both added test modules. This assessment uses transform source/return flow, exact reconstructed text, compiler byte count and explicit metadata, not a metafile-plus-on-disk-hash claim alone.

Telemetry remains opt-in and fixed to the synthetic case/routes. Source/response hashing occurs on nonblocking branches, with bounded eight-worker source hashing; no readiness waits on diagnostics. Terminal capture catches page/capture errors, and ordinary teardown releases declared holds/closes before persistence. Missing-page/observer/hash/teardown failures remain represented in source/state/trace rather than becoming authority. Listener removal, redaction, safe path/symlink refusal and exclusive no-follow file creation are source-tested. Only four safe members, each<=2MB, are proposed; hashes/byte counts replace request/response bodies. Complete transformed source is a separate local audit file, not safe telemetry content. This source review is not a new adversarial filesystem race or browser-overhead/performance proof.

## Fresh commands and actual results

All test commands use Node22 PATH, `--experimental-strip-types --test --test-concurrency=1`. E/commands.jsonl and command-summary.json preserve expanded argv, actual cwd, selected preload, start/end, true per-command exit, complete output length/hash and parsed TAP counts. Counts overlap and are not summed into a coverage or acceptance total.

| Check / exact test suffix under apps/portal/tests/ | Result |
| --- | --- |
| rebuild-plan-guidance-manifest-precondition.test.mjs |6/6, exit0 |
| Same file with W3_MANIFEST_PROXY_CONTROL=1 |5 pass/1 intended fail, exit1 |
| rebuild-plan-guidance-manifest-observer-source.test.mjs |6/6, exit0 |
| rebuild-plan-guidance-manifest-build.test.mjs |4/4, exit0; actual default and observed write:false compiles |
| rebuild-plan-guidance-diagnostics.test.mjs |9/9, exit0 |
| rebuild-plan-guidance-baselines.test.mjs |6/6, exit0; nested ordinary packaging checks with absent historical Git objects |
| rebuild-plan-guidance-packaging.test.mjs |5/5, exit0; unchanged residual25 executes from actual repo and portal cwd |
| context-source + controller/port/hydration/presentation/ssr/decision/observation guidance files |74/74, exit0 |
| Exact retained app-care/app-session/app-state/render/ports/recovery/plan/Care plus root portal-care-contract/handler list |122/122, exit0 |
| rebuild-plan-guidance-residual-source.test.mjs |25/25, exit0 |
| Own E/independent-source.test.mjs |8/8 current, exit0; initial own status-label fault7/8 retained |
| npm --prefix apps/portal run typecheck:rebuild |exit0, zero diagnostics |
| npm --prefix apps/portal run typecheck:session |exit0, zero diagnostics |
| Actual portal TS6 extended observer/helper strict consumer command |exit0, zero diagnostics; full unchanged strict flags below |
| Own clean current-default write:false compile/audit |esbuild succeeds2200/10; audit exit1 at E1 expected-two-input assertion |
| Own static assertion and saved-evidence audit scripts |exit0; source parsing/saved bytes only, no application/browser execution |

Representative reproduction commands, each using the explicit Node22 PATH:

```sh
python3 .local-artifacts/portal-rebuild/w7-ci19c-manifest-r1/run-check.py precondition-current node --experimental-strip-types --test --test-concurrency=1 apps/portal/tests/rebuild-plan-guidance-manifest-precondition.test.mjs
python3 .local-artifacts/portal-rebuild/w7-ci19c-manifest-r1/run-check.py proxy-old env W3_MANIFEST_PROXY_CONTROL=1 node --experimental-strip-types --test --test-concurrency=1 apps/portal/tests/rebuild-plan-guidance-manifest-precondition.test.mjs
python3 .local-artifacts/portal-rebuild/w7-ci19c-manifest-r1/run-check.py independent8-current node --experimental-strip-types --test --test-concurrency=1 .local-artifacts/portal-rebuild/w7-ci19c-manifest-r1/independent-source.test.mjs
```

The extended compiler uses actual `apps/portal/node_modules/typescript/bin/tsc --ignoreConfig --noEmit --strict --noUncheckedIndexedAccess --verbatimModuleSyntax --skipLibCheck false --allowImportingTsExtensions --target es2022 --module esnext --moduleResolution bundler --lib ES2022,DOM,DOM.Iterable --jsx react-jsx --types react,react-dom --typeRoots apps/portal/node_modules/@types`, and exact guidance-types/browser-entry/context-browser-entry/context-source/residual-source/manifest-observer/manifest-observation plus actual src/ui/assets.d.ts inputs. Full argv is in the command receipt. No cast, stub, copied Auth implementation, ambient shim or relaxed flag was used.

The eight NEW independent finite controls exercise: a valid single terminal HTTP200 page with incomplete advertised aggregate (single-page mapper succeeds, aggregate consumer refuses503); actual401/signedout and403/ready with no fallback; actual public restore replacing owner/session during held HTTP; actual runtime disposal before late completion; a throwing diagnostic subscriber without producer interference or extra egress; exact view-object and committed-instance replacement; stale cleanup preserving the new owner; canonical scope/mode refusal. Serialized predicate functions are evaluated from their actual source. No successful port, permission/current/clock implementation is substituted. These are finite source registry controls, not DOM or genuine authorization proof.

Raw qualifications are retained: the initial dependency preflight omitted a trailing slash when checking an absent ignored directory and stopped before copying; corrected setup then made the two permitted clones. The first own runner computed cwd one ancestor too high and failed before finding a test; that log is not a test RED. A copy-audit path concatenation TypeError was corrected only in the own filesystem script. Own independent8 initially expected nonexistent cookie status `ended`; actual retained status is `signedout`. Only that own label expectation changed, with original source/log preserved, then8/8. The meaningful old-proxy5/1 and E1 failed assertion are distinct from those setup faults. Existing typeless-package warnings remain in full logs.

The author's historical absent-bridge0/6 log was copied/hash-verified and read. A new absent-module sensitivity run was not executed after E1 stopped dependent work; it is not claimed as a fresh independent0/6. The current bridge6/6 and fresh old-proxy5/1 are independently measured.

## Current and historical compilation evidence

Both current compiles below occurred before E1 halted dependent execution. The default is the independent actual esbuild call; observed is the actual compile retained by the preceding build4 command. No output bundle was written or browser entry executed. Full input/output records are E/current-default-source.json and current-observed-source.json.

| Graph | Input/output count | inputHash | preparedHash |
| --- | --- | --- | --- |
| Current default at51f4c0ae |2200/10|20f1d83f1b4aad838968d78bb9370287bc60073caece3830b7d4c61703f5fe75|6cc1679179c24a714e212ac40a98dfe516bfabaa197275853ecd658a76c9c9d0|
| Current observed at51f4c0ae |2202/10|24a2db4a1135b5d83385d2673dfd255c592bd51dc72563671f3e424f32ec037d|63b487a47646c4640eabcaab8bf19ebec6b3dc6e216c3cd8455e05eef1db7d38|
| Saved CI and author original, unchanged historical inputs |2200/10|a40df8bb05893d7ec284098de141f67b59d70ad1f298dc636f66047c5ecf0047|30bae7806eac01af299638488b22c8889109a119d40d1d46d8b13967ba4b760b|
| Saved author observed, explicitly instrumented historical inputs |2202/10|623866e815a226dde76d80e297b655cb4f5be072f0c4909f01ca6d40496a70ba|f3be2b7735822d05e8b115aef684af4d06df8a0a5843098151f0254c8a82aa3d|

Current observed input correspondence is2197/2202, with E1's same five paths. In each current variant only JS differs among the ten corresponding outputs. Current compiles are not relabeled exact historical CI or author browser bytes. Instrumented source is never called unaltered CI production code.

## Independent audit of saved CI and finite author browser evidence

Only selected finite saved files were coherently copied/read/hash-checked: the30-file author browser manifest and its files, complete failed CI log/run/artifact metadata/safe ZIP, exact four validated ZIP members, selected observer/type proofs, full prior reports and the three allocation briefs. Total copied browser/CI selection42 files/7112615 bytes before the additional small source/type copies. No history/artifact-tree wholesale copy, network download, native artifact inspection, foreign script execution or resource query occurred. E/saved-copies.json and selected-additional-copies.json bind originals/copies, bytes and hashes. Parent's saved return/observations/inventory match the corresponding author hashes.

CI complete log is2074151 bytes/SHA256 **7fd53f2403a4c4729ea9768d6fb1da2b7b2a73614d0fae761615dfe36de35703**; saved ZIP290835 bytes/SHA256 **e05cf5e33320361d75f72075c05b4053db45b8f1addbdb12b5f38c308ea9ac49**, artifact13071815235. ZIP validation checks exact regular four-member identity, traversal/symlink refusal, <=2MB limits and CRC-backed reads. The failed log's actual totals are2285/2284 pass/1 fail/0 skip. Saved executed merge58aae097fd1da905bc1f29ed92aee34153fa2b43 and published19c tree equivalence retain Parent's recorded API provenance; no fresh GitHub query was made.

Independent trace recomputation confirms **401 events/0 dropped**,26 manifest requests first2087.143807/last4080.134889ms, last manifest finish4140.021067ms;51 details first4337.147511/last8413.990356ms, last detail finish8521.997029ms. At notice error8045.507974ms only43 details finished, eight later. Terminal loading1/paused51/dialog1/notice0. No click event exists in this CI trace. **3045.507974ms is only inferred wait start from subtracting5000**, not an observed click or accepted-manifest time. Overlay duplication does not imply loss of one of the50 canonical facts. No product latency cause or production leak is established.

Saved author original/controlled traces contain400/463 events, zero drops, exact79 requests each (one session GET plus78 Review POSTs),79 finishes, all HTTP200. Both case runs record one attempt, one pass, zero skips and normal own closure. Recomputed all156 POST wires match their stored SHA/counts and parsed commands; each case has one initial manifest chain,26 pages,51 unique details,50 canonical paused source facts and terminal loading0/paused51/dialog1/notice1. No Care/decision/financial write occurs. Both safe source records have10 outputs/6 served and every served hash/reference-match agrees with prepared metadata. Input/output aggregate hashes recompute exactly. Every safe JSON was inspected for forbidden credential/header/storage/environment keys and member bounds; source records contain hashes/paths/declared instrumentation rather than raw source bodies. PNG signatures/dimensions/hash agree:1440x960,168887 bytes/SHA256b09bfdb807c0fe25013266fd0dd2310e6207a30721f85d48421ac2a6b77c3060. This is saved-file consistency, not new rendering/visual comparison.

The controlled log independently confirms oldProxy=true while actual active commit3/instance5/view1/session2/snapshot3/scope4 is manifest/null with zero details; after only the declared terminal release it accepts2550/details0 on every identical owner/current identity field. The saved serialized predicate/source and retained original assertions support that bounded readiness distinction. Actual manifest-ready console receipt precedes captured click. **Page** accepted observedAt1320ms/click eventAt1387.6ms and **Node**3324.80925/3393.500541ms remain separate origins. Waiting/disposed commits1/2 have no accepted instance; active commit3 becomes ready. Opening changes commit3->4 on the same instance5 without a chain restart. Measured maxDetailActive1 is within cap3, not saturation proof. Observer timing and the author's500ms own-descendant custody monitor remain qualified overhead, not product timing evidence.

Saved return is **2026-11-01T07:51:23UTC**; saved final inventory lists22 tracked identities absent and own Chrome/Node/esbuild/workerd/listener arrays empty, with preview noTab. These are attributed saved custody records, not a new inventory or global process claim. The raw inventory timestamp is07:51:23.196604Z while the return label has whole-second precision; subsecond ordering cannot be inferred from that label alone. No browser/preview/process/resource call was made in this review, and no old grant was borrowed or renewed.

## Historical qualifications and unrun gates

Read the complete current W3 report at64f8, including all earlier source/browser/CI/cookie/observer/type responses, and complete frozen V3 R1 at **5a26fdcf494b34b64bd1e1f7d7a2b7da1c1e03ee**, R2 at **f72b16a8b572b853b5a775a5127607fafdc32139**, R3 at **9557f81624a1000d73a599658ce55e2eca9208a4**. The unresolved initial4ac prefix was not invented; Parent's exact R1 ref was used. Original approved appendices, applicable repository instructions/contracts/status/workstreams and full CI diagnosis/observer/type/two-case briefs remain governing. Requesting-code-review and the source-only independent-review workflow were applied as this allocated reviewer, with no nested reviewer dispatch.

Historical G1/G2 source and rendered corrections, R2 saving/retry closures and operation-token/source/current identity fences retain their independent evidence levels. Ordinary React/Application reachability of deliberate saving-subscriber reentrancy remains unproved. Original Select rectangle0/1 remains a qualified scroll-viewport criterion, not a universal options-visible pass. T1/CK1/CK2 source and author ordinary-fetch sensitivity remain distinct from non-sensitive old20 and R3 old-eight positives; consumer TypeError from the discarded constructed-Response producer is not rewritten as an AbortError product regression. Early R1 timeout-containing raw and withdrawn premature G2 apparent passes stay qualified.

Original125 timeout/packaging failures, later723 passing run and19c failure are separate historical heads. The current old-proxy SSR counterexample is **cold SSR plus an independently held actual hydrator**, not same-mounted-instance proof; later saved controlled browser evidence supplies the latter only for its historical graph. Child frontend seven actual port errors, the first Parent wrong-cwd eighth react-dom lookup error, corrected actual portal-cwd7->0 and erased-type JS identity8e609bb71c20b858c77f0e9f90bb1319db8477b13f9f965f1a1e18524bf50881 remain preserved, not a waiver or Root type import. No new producer-return/consumer error coercion was introduced by this review; the own401 status-label setup fault is explicitly separate above.

Unrun: independent current browser/DOM/StrictMode/visual/private-rendered scans; any execution after E1 of the two-input historical overlay or an expanded overlay; fresh absent-bridge0/6; full Root/npm/Expo/iOS or portal/session runtime suites; genuine Gateway/Vault/Auth/DB/PG/Storage/Docker/provider/native fixtures, migration/RLS or financial acceptance; new exact-head GHA; release/full Application/full-goal acceptance. Dependencies being present does not authorize these resource lanes. A07 composition/findings, App B3/B4/frame-C and blocked M65 provider work were not investigated, rerouted, changed or closed. No resource wait or grant request remains in this source-only round.

## Durable delivery and evidence receipts

Only this report is newly authored tracked delivery; its commit SHA is returned separately to avoid self-reference. **Import only that report commit into Root, not51f4c0ae or its review-input ancestor.** Final diff/index/whitespace/protected-byte and commit readback checks are recorded in excluded E/FINAL-HANDOFF.json. No CONTEXT_SYNC/status/shared file is authored by this reviewer; coordinator owns canonical integration.

Selected independent evidence SHA256:

| E/ file | SHA256 |
| --- | --- |
| compile-audit.log, actual E1 failed assertion |60bcd5e506beb822e86d5dd40e43e24b9dd6a725195f817501d4410aceb40d24|
| E1-current-ci-input-differences.json |d64ea50f6fe261cb948b9f23929259503399ba47968ecb22393a45e018250f3e|
| current-observed-comparison.json |2974bd513deb4c76317f4b88bfa557a29269b569868f036f808e7306c194f599|
| saved-evidence-audit.json |54327e8386a2188deda7374ce65b7432c9f7b140a7732ac2947719556f8c8784|
| static-assertion-audit.json |680c82346406f4d8a71563835a39bea25d824f40f60bed3c4341b2d854250094|
| source-attribution.json |6155f821ca44c9b16cacf38cf580ad456ac989903db19bc5b1b72efdce7a80ae|
| independent8-current.log |a2ff78cbed30d2b23ad9ddf8e30667ee963fbb792e0c73e8acfdcb845295a7f6|
| precondition-current.log |2cca8ed8996a72f5da3be2c64bbe66300ba00a982813ddbc95865bd3dc6ec45a|
| proxy-old.log |0056e88446d430205c9b6ae7cdfa5a7843add2789d0e2e0bd3fb439628d60074|
| source74.log |51c3049316725388cc9068963148a9ad6843515f4c82ad6878aa55482a438e96|
| retained122.log |51ef63977566cac3175a3837b3903793545122bd346f4c088f4c5e361541ef28|
| residual25.log |b83c3d177d9a1270818e3ce9f6b1e81927e14765989dd50757cdff3b4140eebb|

Full E/EVIDENCE.json is created after report verification, excludes itself and FINAL-HANDOFF, and binds final scripts, raw failures/current results, complete compile source records, config/runtime receipts and selected immutable saved copies. No success is inferred from its existence. E1 remains the precise unresolved evidence objection; current CI and independent browser remain unverified.
