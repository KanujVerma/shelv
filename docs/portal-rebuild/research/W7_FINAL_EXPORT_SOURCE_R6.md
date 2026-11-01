# W7 final-export SOURCE R6

Owner: Kanuj. Date: 1 November 2026. NEW independent report-only SOURCE/PURE/closed finite-HTTP review of author `1787ffd299720cdf2d735d2e7c6c9b2ee3e8b11d`, imported onto frozen Parent `58c0669d0c5507c0eb7087fe0a0b0e0785743d5e`.

**Specification: FAIL on denial-status fidelity. Completeness: INCOMPLETE. Correctness/quality: FAIL. New FE6/P2 is reproduced.** FE5 closes its original bounded sink-abort vector in source and emitted execution. The remaining audit finds a separate inherited runtime defect: an already-received RPC 401 becomes 503 when the response body cannot be read. Broader acceptance stops at this first new material finding. No full SOURCE PASS, feature admission, Account/download, genuine, CI, release or full-goal acceptance follows.

## FE6/P2: the bounded response wrapper loses a received RPC 401 on body-read failure

Location: [runtime.ts](../../../supabase/functions/concierge-final-export/runtime.ts), `createFinalExportPorts`, lines 11-15, especially line 14. Related actual paths are [retained runtime.ts](../../../supabase/functions/concierge-operations/runtime.ts), `createConciergeAuthenticatedPorts.rpc`, and [handler.ts](../../../supabase/functions/concierge-final-export/handler.ts), lines 26-29 and 37.

The wrapper awaits `readFinalExportBytes(response.body, finalExportPartMaxBytes)` for every nonempty response before returning its status to the retained runtime. A stream error throws from that await. The retained RPC implementation therefore never receives the Response and cannot preserve its known 401 independently of error-body decoding. The final handler's outer catch returns `503 {code:'unavailable'}`. Its explicit `401 -> session_ended` branch is bypassed.

The retained RPC implementation deliberately catches error-body decode failures while retaining the received HTTP status. The new outer wrapper defeats that behavior. This contradicts the existing error contract and the handler's own session-ended mapping. It is inherited unchanged from e03; it is not a regression introduced by the FE5 sink correction.

One new ignored probe uses the **actual handler, actual final-export runtime and actual retained Auth/RPC runtime**, with global external fetch denied before imports. Its injected finite fetch recognizes only the fixed Auth user URL and fixed final-export RPC URL, checks bearer/method/body, and supplies synthetic HTTP responses. No successful authority port, copied Auth implementation, positive current override or caller-selected RPC supplies the result.

1. The readable-body control supplies a finite synthetic Auth identity and then an RPC response with status 401 and a readable JSON body. Actual composition returns **401 / session_ended**.
2. The finding uses the same command and two exact targets. The RPC Response again has status **401**, but its body errors on its first pull.
3. Actual composition returns **503 / unavailable**, retaining no-store headers. There is one body-read attempt and exactly two calls: Auth GET, fixed RPC POST. The raw error text does not enter the public body.
4. The probe saves both complete result/request records before asserting that the received 401 must remain 401. It fails with `received RPC 401 was lost when bounded body read failed`, **0 pass / 1 fail / actual exit 1**, zero skip/cancel.

```json
{"controlStatus":401,"controlBody":{"code":"session_ended"},"receivedRpcStatus":401,"bodyAttempts":1,"actualStatus":503,"actualBody":{"code":"unavailable"}}
```

Evidence: own ignored `independent-status-body.test.ts` SHA-256 **`35f54621b61c5ab6f44bf62468da48be65fd2a17dc70e249fb453fe7b5d6a231`**, `FE6-status-body.command.json`, complete `FE6-status-body.log` and `FE6-raw.json`. This probe executes once. No follow-on product probe, compiler run, broader acceptance test or production/test fix follows FE6. Only report, provenance and saved-artifact checks continue, as Parent explicitly confirmed.

**Impact and limit:** a caller receives temporary-unavailability semantics instead of the known session-ended result. This is a source API/error-contract defect. The final-export family is unmounted; ordinary Account/UI reachability, actual session revocation, stale private UI, genuine Auth/SQL behavior and a customer download were not observed. No private response was released by this reproduction. It does not claim an authorization bypass or generalize unexecuted statuses/body modes into reproduced results.

Required owner response: preserve already-known denial status independently of a failed body read in this bounded runtime composition, while retaining the successful-response bound, fixed targets, safe errors and authority fences. Review the same class under the allocated owner scope, preserve this exact readable-401 control and unreadable-401 predicate, and obtain a NEW independent round. This reviewer makes no fix.

## FE5 disposition and source-contract assessment

The authoritative R5 report commit is **`ace6b3c82e3e9b47127fbe47682805a1edd5ca5b`**. Its earlier wrong long suffix is not reused. The complete 29,509-byte report matches SHA-256 `8840f6ff6891e03587e4c7110f5662e65228df21bd2763420817069a854f6ba3`. The complete cumulative author report at1787 is **100,306 bytes**, SHA-256 `fde575e42803f741b1747ea9fcaf99301656daad8a38b0c5ab869ef7409c60b5`.

Original FE5 probe SHA-256 remains **`d5a9338b5cdaff90b3ca7e9b212289054d61226f54747ce4d6f2fcb4d75e1aa2`**. The unchanged own copy binds through relative imports to this own candidate. The OLD source projection substitutes only the exact cfd9 serializer into this own current transitive source closure; OLD emitted execution independently uses the actual compiler-host substitution. Current tracked source is never substituted.

| Same original FE5 predicate | Source | Emitted JavaScript |
| --- | --- | --- |
| Exact cfd9 sink | 0 pass / 1 semantic fail, exit1 | 0 pass / 1 same fail, exit1 |
| Exact1787 candidate | 1/1 pass, exit0 | passes inside actual current119/119 |

The old result is commits1/aborts1/fulfilled `released-after-abort`; the current result is **commits0/aborts1/rejected `Error: invalid_input`**, no committed buffer. Record, complete manifest and request sequence are exact. Event order is exact through footer return; only the former final `backing commit called` event disappears. The ordinary control still commits1/aborts0 with the real intact footer. OLD source/emitted raw objects also equal the original R5 raw object in full.

Independent source and real TypeScript AST comparisons establish that **only `createFinalExportHtmlSink` changes** between cfd9 and1787. Every other top-level declaration/import is exact, including all content renderers, `instructionLabel` and guide applicability. The sink now has monotonic open/aborted/committed state. Abort marks terminal synchronously, before its captured discard await. Stage checks state after its write before advancing; commit checks after footer write immediately before finish dispatch and after finish returns before reporting success. Expected manifest/metadata are captured before awaits. Busy ownership prevents duplicate stages/commits from stealing the active operation. Finally releases bookkeeping without reopening terminal state. Accepted failures preserve their original error if cleanup fails.

The authored22 lifecycle cases pass in the independently executed source/emitted suites. They exercise held first/second stage writes and footer; reentrant abort from write/finish/discard; before/after-dispatch completion; late writes; repeated/overlapping/failing discard; duplicate stage/commit ownership; terminal reuse refusal; original write/finish errors despite secondary cleanup failure; captured backing/sink methods; borrowed metadata mutation; and accessor refusal without getter execution. The original FE5 predicate supplies the independent sensitive regression rather than relying on counts.

**Scoped FE5 source-contract verdict: addressed.** Its original contract requires terminal ownership and no newly dispatched finish or successful receipt after the acknowledged pre-dispatch abort. It does not contain a physical cancellation/join port. The acknowledged limits are therefore retained, not treated as a solved erasure/download guarantee:

- An already-dispatched backing finish can release bytes even though the later source receipt is rejected.
- An in-flight write can append private residual bytes after discard acknowledgement. The source sink cannot reopen/finish; physical cancellation, joining pending writes and eventual residual cleanup remain adapter obligations for later acceptance.
- Failed/in-progress discard is not acknowledged complete; overlapping abort rejects, failed discard can be retried, and acknowledged successful discard is idempotent. Abort after a completed commit does not promise recall.

These limits do not reinstate the original undispatched-finish FE5 defect. They do prevent physical erasure, recall, durable-storage or browser-download acceptance. Closing FE5 does not close FE6 or the full export.

## Prior controls, complete artifact parity and pre-finding checks

Full R1-R5 reports, cumulative author responses and original raw controls were read. Immutable reports were checked against their exact Git blobs; original FAILs remain unchanged:

| Report | Exact commit | SHA-256 |
| --- | --- | --- |
| R1 | `e9e98e53626c0c15fed76c28782b48f39305e6fe` | `1dbeeae360e5cc6d88d828a3b06e9b9bebb7c45049c96ab53b220e7e046d8d0b` |
| R2 | `0dbf4a38d272f37721ff05e0f37c8dfcafcc96e2` | `4e215a6fe890a995e32c553d7b8fab67f93f30d4c7eb8f232d3c895ae63cbb2a` |
| R3 | `469e8b27f9d0e8867a02ca2125f9791af96f0441` | `1093f8a96616a45b7d8d7a59c78c108c1a8d32822e319d6697f1367757b5af1c` |
| R4 | `0dc0c5c77275b344f44755f29bb8ba1f8249d087` | `7ded3b71a09f7c34f4dfba3b7b4f73224f671715013c7d775437e4bd30becda8` |
| R5 | `ace6b3c82e3e9b47127fbe47682805a1edd5ca5b` | `8840f6ff6891e03587e4c7110f5662e65228df21bd2763420817069a854f6ba3` |

FE1-FE4 originals remain unchanged, hashes respectively `e7d65a111cfd41c85b1f904e648de9332dfe8630117499a832b4b04b155df2bf`, `f8ca531129aa52facdbae7335cded2f834bc46e99e0d96ea7350afdaebf46e8e`, `c50cf39713e72f5525a3c364d423601fd7fa6481341c0bb9fb2a5232b827a95f`, `2813f9b9e8b4cbe964024e53763391f727e0ae84c4df22aa0974002f6b99b17a`. All pass in this round's pre-finding current source and emitted suites. Original Unicode/multisegment, wrong segment/kind/leaf/root, private-field, scope/Start/end, use and original differential predicates remain intact. Historical OLD FE1-FE4 semantic failures are retained R5 evidence, not newly executed or rewritten in this round. No minimally adapted fixture is used here.

Complete comparisons, not count inference, establish ordinary unaborted artifact parity across cfd9/current and the saved R5/author corpus:

- All **eight FE1 complete captures** match: full records/manifests, direct filename/content type/text/HTML, streamed text/HTML. Both independently executed old-cfd9 emitted and current source/emitted capture runs pass9/9. Unicode is included.
- Original FE2/FE3/FE4 A/B **full records, manifests and all four complete artifacts** match byte-for-byte as string values across saved R5, author, current source, old-cfd9 emitted and current emitted captures. No output masking is used.
- All **111 prior positive scalar metric records** match as a complete counted multiset across old/current source/emitted and saved R5/author logs, preserving duplicate case names. Roots, unit bytes, part/count totals, commit/abort counts, output sizes/hashes and use counts match. Of these,110 TAP JSON lines parse directly; the one reescaped Unicode line is included through exact scalar-field extraction on all111 matching lines. Its full Unicode artifacts also match above. No line is dropped to obtain parity.

Actual pre-FE6 execution, each with explicit Node22.23.0 and global external-fetch-deny preload:

| Check | Actual outcome |
| --- | --- |
| Current bounded source | **119/119**, exit0, zero fail/skip/cancel |
| Same actual emitted suites | **119/119**, exit0, zero fail/skip/cancel |
| Retained presentation/service | **13/13**, exit0 |
| Old-cfd9 unchanged prior positive suites | **96/96 emitted**, exit0 |
| Current source/current emitted/old emitted FE1 full capture | **9/9 each**, exit0 |
| Actual strong TS6.0.3, cfd9/current | **0 diagnostics,217 inputs** each |
| Exact `listFilesOnly` versus actual compiler program |217 paths equal in order |
| Emission comparison | **52 of53 JS files byte-exact**; only serializer.js changes |
| New FE6 probe, later | **0/1, exit1**; source-executed only |

Strong settings are `strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `skipLibCheck:false`, with actual own-cloned TS6.0.3, Node22.20.3 and undici-types6.21 declarations. This is the explicit transitive Node/DOM closure, not the full Root/Expo/React/App configuration. The giant rich-stream case is compiled but unrun. The217-file proof precedes FE6 and does **not** typecheck or emit the subsequently authored FE6 probe. No post-finding compiler/test result is inferred.

The finite HTTP positive uses actual handler plus retained Auth/RPC runtime, fixed registry/targets, full Root codecs, collector and HTML sink. Its successful400001-byte RPC control cancels before retained unbounded decode. These are synthetic in-process responses, not genuine Auth/SQL or full ApplicationSession/cookie/React SSR/browser acceptance. FE6 shows why their prior success count does not accept the remaining error matrix.

## Exact provenance, imports and dependency custody

Own worktree: `/Users/kanuj/.t3/worktrees/shelv/t3-01c2580e`, branch `t3/review-final-export-r6`, initially clean at frozen58. Each allocated manifest was inspected and `git apply --check` passed before its separate conflict-free `git cherry-pick -x`:

| Original input | Own imported commit |
| --- | --- |
| `62ade9161fbc43d264e776acd26c15d9e9b88680` | `21414cddb884418e3d3ac1ad31c9741a3cd94951` |
| `e03a7e43260ea11e796a023048f571a85df16a6b` | `071b024bd99d8ad03effa64f9d2e55e012bce128` |
| `86b5c3df4e09d4ca5b3a5ff18ba85dc6916e6a78` | `ee0bc5f74f30161384073be39e6118d858470917` |
| `944229a829f4043764c23a9bad5b526f2e1676c7` | `62466b8213beb4bf40bcb5556ce020975920f907` |
| `f16e6e7ea5f63e9567913fc13b27aeca98ce6391` | `6b9f907a721036b9915b9e74bbf55d90ea0dea61` |
| `cfd9ea8b6c8bdd443076e8dcd25494b462887839` | `2908a436cf9efb43091c5ded1da6e2c74df7149e` |
| `1787ffd299720cdf2d735d2e7c6c9b2ee3e8b11d` | `7592a04ea4cc334fba7eb88e6d5a24a6ced1f124` |

These seven are input ancestors, **not deliverables**. ce658 is skipped only after full frozen58/b43/ce658 equality for both type-only blobs: `ConciergePresentationMapping.ts=e2b22cc076b948c396119e52489e3860402aa4a0`, retained Operations handler=`d6e4de498b02d03f3e24913dc37cee2b1c9c9ee3`. No other source/foreign SQL/Source15/M63-M65 ancestor is imported or manually resolved.

All **2,058 frozen Parent tracked files, bytes and exact file modes** remain unchanged. All **21 candidate paths** match1787 blobs/modes. All **117 frozen SQL paths /64 frozen migration sources** remain exact. The original62 migrations separately match the original frozen author-base tree. Frozen Parent already contains these two additional unrelated migration sources, both preserved:

- `20261101191527_portal_rebuild_notifications_v1.sql`, blob `b25eadf338172f28550d796a613aa76032433748`.
- `20261101195359_portal_rebuild_photo_head_v1.sql`, blob `d8779e1472f7a9e618345a94d4f3a5f458cdfb2c`.

The sole final-export addition is `20261101173223_portal_rebuild_final_export_v1.sql`, SHA-256 **`4991cce01a59e82aea46a2d4d37db95defe32e473854cd9e494c5a749a7d7166`**, unchanged from e03. Own candidate therefore has65 migration source files; this is no execution or canonical65 claim. Parent's later dirty documentation and bounded test/type corrections are neither imported nor reverted. All comparisons use frozen Git58, not later physical drift. Remote freshness is not fetched under the no-network/resource boundary.

Dependency projection uses only the allocated exact-lock Parent installed directories. Before copying: both own root/portal dependency destinations are absent and ignored; all four physical lockfiles match their corresponding frozen locks; roots/ancestors are nonsymlinks and same-device; a full source byte/mode/literal-link manifest is captured. `/bin/cp -cRp` is followed by full source-before/source-after/destination parity, including root-directory modes: **43,213 root entries /9,071 portal entries** (each count includes its directory root). This completes before compiler/probes. No install, upgrade, foreign executable, package/config/lock write, shim, copied Auth or relaxed flag is used. Root/portal React versions remain their exact locked versions.

The sole external-to-node_modules workspace link is literally `shelv-advisor-session-candidate -> ../session-integration/runtime`. It resolves only into this own checkout. All91 corresponding tracked runtime/package files match frozen58; Parent's generated outputs/ongoing transport drift are not copied as runtime source.

Efficiency/custody: historical nested12k review archives are **not copied again**. Full reports/Git identities, original top-level raw/command/manifest references and author FE5 evidence are read/hashed in place. Only six actually executed original probes/capture helpers are copied unchanged; own generated old/current closures and actual task raws remain separate. All referenced originals remain hash-exact at final static audit. `prior-references.json` and `prior-immutability-final.json` retain their locations/hashes, including references to prior archives. Historical setup/type/emit/zsh/TAP/fixture failures remain attributed and are not relabeled current successes.

## Live identity and commands

Initial/final LIVE self and **actual Parent** configurations, capabilities/catalog/descriptors verify **codex / gpt-6.1-sol / reasoningEffort=xhigh / serviceTier=default**, default interaction/full-access. Actual Sol descriptors offer both chosen values. Project `defaultModelSelection:null` is recorded separately; it is not interpreted as the live thread options. Repo/default-subagent/max8 settings and all eight role pins are unchanged and match physical Parent byte-for-byte. No config change, model fallback or nested delegation occurs.

Authoritative taskId, separately forwarded from Parent's actual `delegate_task` return after this initial gate:
`node:delegated-task:command%3Amcp%3Add730894-0fab-4a94-873d-743422eae122%3Adelegate-task%3Aportal-rebuild-w7-final-export-source-review-20261101-r6`.

Distinct childThreadId:
`thread:delegated-task:command%3Amcp%3Add730894-0fab-4a94-873d-743422eae122%3Adelegate-task%3Aportal-rebuild-w7-final-export-source-review-20261101-r6`.

Distinct childRunId:
`run:thread:thread%3Adelegated-task%3Acommand%253Amcp%253Add730894-0fab-4a94-873d-743422eae122%253Adelegate-task%253Aportal-rebuild-w7-final-export-source-review-20261101-r6:ordinal:1`.

Actual Parent is `d632030a-18f7-4dec-a2c9-f5c0418c3fd5`, resolved from durable self-thread state. The capabilities response labels its caller in `parentThreadId`; that field is not substituted for actual Parent. No task identity is inferred from a thread/run/request suffix.

Explicit executable `/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node` returns **v22.23.0** initially/finally; binary SHA-256 `cc61696726abdfe8392297ecd75aa9863cd9b6435b202c0dc2266039f493da10`. Child command PATH also selects that directory. Ambient Node20 is unused.

Own ignored evidence root: `.local-artifacts/portal-rebuild/w7-final-export-r6/`. Every product/compiler invocation has exact argv/cwd/actual exit/full log/SHA in its individual `.command.json`. Representative exact invocations:

```sh
python3 .local-artifacts/portal-rebuild/w7-final-export-r6/run.py FE5-old-source /Users/kanuj/.nvm/versions/node/v22.23.0/bin/node --require ./.local-artifacts/portal-rebuild/w7-final-export-r6/deny-fetch.cjs --experimental-strip-types --test --test-concurrency=1 .local-artifacts/portal-rebuild/w7-final-export-r6/source-old/.local-artifacts/portal-rebuild/w7-final-export-r6/independent-sink-abort.test.ts
python3 .local-artifacts/portal-rebuild/w7-final-export-r6/run.py compile /Users/kanuj/.nvm/versions/node/v22.23.0/bin/node --require ./.local-artifacts/portal-rebuild/w7-final-export-r6/deny-fetch.cjs .local-artifacts/portal-rebuild/w7-final-export-r6/compile.cjs
python3 .local-artifacts/portal-rebuild/w7-final-export-r6/run.py FE6-status-body /Users/kanuj/.nvm/versions/node/v22.23.0/bin/node --require ./.local-artifacts/portal-rebuild/w7-final-export-r6/deny-fetch.cjs --experimental-strip-types --test --test-concurrency=1 .local-artifacts/portal-rebuild/w7-final-export-r6/independent-status-body.test.ts
git diff --check
```

Expected old FE5 and new FE6 exit1; pre-finding current119/emitted119/retained13/captures/compiler checks exit0. `analysis.json` holds full-artifact/metric/protection proof. Initial discovery had a nonexistent skill glob and one control-plane result-storage serialization error before any import/probe; these are setup/tool faults, not product failures. Expected Node typeless-package warnings remain. No compiler/product setup failure is erased. The scalar110/111 parsing qualification is documented above. Ordinary Git hooks/config are inspected; no hook bypass is used.

## Source observations and held acceptance

Root/portal instructions, rebuild entry point, approved original/D01-D48/full specification, contracts/workstream/status/addendum and prior findings govern. All five original provenance files match recorded bytes/hashes, including95,388-byte input SHA `c45701f9f54fd2b1dbb09bbd7aa2b9b437e9059aa6032b6f39411fe2e7f6efbd`. The post30 decision authorizes authenticated own-client static last-entitled care; it does not extend support/interactive care or export raw/private sources.

Source retains exactly two READ actions under fixed `concierge_final_export_command_v1`, schema1, own-session selection, unit/segment PAIR addressing, selection basis and `shelv.final-export.folded-sha256.v1`. Unit0 is complete public plan/careBasis/use; subsequent complete instructions are UUID ordered. Segments remain32768 Unicode scalars and predecode bound400000 bytes. No whole bundle is introduced.

The exact domain/LF/canonical-decimal/UTF8 framed leaf, initial root, ordinal fold and completed root remain e03 byte-exact in the four contracts/collector and SQL; R1-R5 and the author report preserve their full formulas. Selection folds the complete ordered plan/instruction/use/amendment/activation reference relations, not only maximum heads. Hash consistency is not permission, terminal ownership or human-readable completeness.

The SQL source's exclusive Chicago end, pre-end entitlement/publication/instruction/use selection, direct unit lookup, private-invoker helpers/empty search paths/revokes and fixed authenticated definer wrapper were inspected, with bounded retained service/session/target/instruction/use producer tracing. The wrapper repeats current checks before/after its advisory wait and before return. These remain SQL-text observations, not executed SQL/ACL/RLS/concurrency proof or a completed retained-producer audit. FE6 stops the remaining source authorization/error/public-field/completeness audit.

The collector's detached/frozen units, exact counts/leaves/root/final current manifest and captured methods remain unchanged. FE5's logical lifecycle now passes within the stated bounds. Source plan/instruction unit bounds remain14,772,736/865,536 bytes; no cap increase/drop/truncation/new table/cache/right occurs. Full legal-max/practical heap, repeated history/descriptor scans, TOAST/detoast/query I/O/latency/timeouts remain unaccepted. The historical author300MB proof is neither rerun nor promoted to a new source/native/browser/physical-storage maximum.

R1 safe public final-record production remains a **completion gap**. Immutable baseline/writer-set guards and private working-draft/intake adoption snapshots do not establish this profile's final public snapshot. `legacy_snapshot_missing` remains honest unavailable. No total raw R1 fact-loss claim, private-adoption export or fabricated V3 identity is adopted.

UNRUN/UNVERIFIED: remaining full SOURCE audit after FE6; owned/canonical PG/SQL/native/ACL/RLS/current-authority lock races; TOAST/I/O/performance/legal-max/practical heap; R1 public producer; full ApplicationSession/cookie/shared admission; actual Account/private backing storage/Blob/post30 download; genuine Auth/persistence/browser/visual/accessibility/comprehension; full Root/Expo/App suites, exact-head CI and release approval. Source-only test counts are not these acceptance levels.

No server/browser/preview/DOM/Docker/PG/SQL/Auth/Storage/provider/native resource, process inventory, credential/service CLI, live client download/send/funds/notification, Source/financial/blocked Guidance/M65 retry/rephrase/reroute, Parent write, production/test fix, push/PR/merge/deploy occurs. No new hardware/program/model prerequisite is introduced.

Deliver **only the new report commit**, excluding all seven review-input ancestors. Its sole tracked change is this report; final static link/scope/whitespace/protection checks and clean report-only commit receipt are retained in ignored evidence. The exact commit SHA is returned separately. **FE5 is addressed only within its reproduced source contract; FE6 blocks R6 admission. The full approved goal remains open.**
