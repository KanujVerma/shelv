# W7 Account final-export consumer SOURCE R1

Owner: Kanuj. Date: 2 November 2026. New independent report-only review of the complete nine-file `e949c9cc4a352c57d0aebb796c175370f72bd052` source/test candidate and sole author report `d5a37968920b701170558c783382b458336042d9`.

**Specification conformance: FAIL on recovery/terminal presentation (AFEC1 and AFEC2). Completeness: INCOMPLETE. Correctness/quality: FAIL.** One P2 and one P3 finding form the consolidated actionable set. The allocated source seam is not admitted. The existing unsupported-channel refusal is intentional and remains fail-closed; it is an integration gate, not a new defect. No Auth, filesystem, browser, full Account, native, CI or release acceptance is issued.

## AFEC1 / P2: opening failure or cancellation can permanently disable explicit retry

Locations in the frozen candidate: `apps/portal/src/features/account/final-export/writer.ts:30-40,61-75`; `controller.ts:32-46,57-58,83-107`; `view.tsx:19-21,29` in the same subtree.

The writer sets disposition to `aborting`, then returns a fulfilled abort promise immediately when `discard` is not yet captured. It does not distinguish an outstanding open from an open that rejected without producing a stream. The controller publishes this disposition once. A retired attempt's later `open()` settlement cannot update that snapshot: its catch only handles `active === attempt`, and its finalizer merely checks session readiness.

Two independently reproduced paths establish the finding through the actual controller and actual ApplicationSession/cookie implementation:

1. The explicit picker returns a modeled handle whose `createWritable()` rejects with `NoModificationAllowedError` before returning any stream. The action settles with `{phase:'unavailable',writer:'aborting'}`. A second explicit `saveFromUserAction()` is ignored by the cleanup guard. Picker count and create count remain one; only the finite `/api/client/session` request occurred. No abortable stream ever existed in this case.
2. Hold the modeled `createWritable()` promise, call `cancel()`, and allow the initial cleanup continuation to settle before releasing the open. The late stream is correctly fenced and its captured `abort()` is actually called and acknowledges once; writes/closes remain zero. After the original action and cleanup finish, the controller still publishes `{phase:'cancelled',writer:'aborting'}`. The view suppresses Save for this disposition and `cancel()` has no active attempt to settle. The successful late cleanup is never reflected in presentation.

Exact independent raw summaries:

```json
{"case":"open-rejection","first":{"phase":"unavailable","writer":"aborting"},"picks":1,"creates":1,"calls":["/api/client/session"],"after":{"phase":"unavailable","writer":"aborting"}}
{"case":"late-open-cancel","pending":{"phase":"cancelled","writer":"aborting"},"settled":{"phase":"cancelled","writer":"aborting"},"picks":1,"aborts":1,"closes":0,"calls":["/api/client/session"]}
```

This is persistent for this controller lifetime, not permanent account loss: replacing/remounting the controller can recover. It matters for an ordinary browser writer-open rejection or a user cancelling a slow open; both remove the available retry despite settled work. It does not establish a committed file, failed physical erasure, private disclosure or Auth bypass.

Required owner correction: represent pending acquisition separately from a settled no-stream failure, and propagate final late-open cleanup disposition under the exact retired attempt/snapshot ownership. Keep new content work fenced; never acknowledge cleanup before an outstanding open settles or pretend a failed abort succeeded. Add both original regressions, including an initial cleanup microtask turn before the late open resolves, and verify the published view/action recovers only when appropriate. Production correction belongs to Parent, followed by a fresh independent complete review.

## AFEC2 / P3: picker capability getter can revive saving after cancellation/disposal

Location: `apps/portal/src/features/account/final-export/controller.ts:69-73`, with catch ownership at `83-84` and finalization at `109-115`.

The optional structural host is part of the confirmed API. Reading `showSaveFilePicker` and binding it can execute a getter. There is no attempt-currentness check after that callback before either the unsupported branch's publication or the unconditional `publish('saving','unopened')`.

The independent host getter calls the actual controller's `cancel()` and returns a callable picker. Retirement clears `active` and publishes cancelled. The old action then overwrites it with saving before `check()` detects the lost attempt. Catch skips that now-retired attempt, so the final state is `{phase:'saving',writer:'unopened'}`. The same getter calling `dispose()` produces saving after terminal disposal. In both cases picker count is zero. There is no export HTTP or stream acquisition. The disposed case's finalizer intentionally skips all work, leaving the incorrect saving presentation.

The two original predicates fail on cancelled-versus-saving and retired-versus-saving respectively. The ordinary throwing-getter control passes: a getter that simply throws yields unavailable/unopened with no export HTTP. The defect is callback retirement followed by a stale presentation write, not failure to catch a plain getter exception.

Required owner correction: recheck exact attempt/lifetime/readiness immediately after capability/method capture and before any subsequent state publication, including the unsupported path. Preserve prior cancellation/disposal and isolate observers. Retain both independent cancellation and disposal vectors. This is P3 because it requires deliberately reentrant structural capability access and affects safe presentation state; natural mounted-browser getter reachability is unproved. It does not demonstrate a stale private return or a post-retirement picker dispatch.

## Exact identity, scope and custody

- Own T3-managed checkout: `/Users/kanuj/.t3/worktrees/shelv/t3-d6d1e812`, branch `t3/account-final-export-review`.
- Actual clean starting HEAD: `09cf6dad2e7d6a3ff24e20e75c743401bb7b4706`. This pre-existing three-path SMTP **INPUT-ONLY** child of `8af746d197b976972d4b16924155afa8c3b32d44` is preserved. It is neither authored production, export source nor Root admission. Deliver only this new report commit; exclude that input ancestor.
- Candidate source `e949c9cc` is a direct child of exact `8af746d197b976972d4b16924155afa8c3b32d44`, nine additions only. Author report `d5a37968` is its direct one-report successor. Neither chain has INPUT ancestors. No candidate commit is cherry-picked into this review branch. Executed source is materialized from immutable Git into own ignored `.local-artifacts/afec-r1/fixture/`.
- Authoritative taskId, explicitly forwarded separately by Parent: `node:delegated-task:command%3Amcp%3Aafb222dc-28b4-420b-9474-b05bc6eeba89%3Adelegate-task%3Acontinuation-20261102-account-export-review-r1`.
- Distinct actual self thread: `thread:delegated-task:command%3Amcp%3Aafb222dc-28b4-420b-9474-b05bc6eeba89%3Adelegate-task%3Acontinuation-20261102-account-export-review-r1`. Durable T3 state confirms this checkout and actual parent relationship to `9b085ada-435f-48d6-8886-957c1ce3e82d`.
- Active run is `run:thread:thread%3Adelegated-task%3Acommand%253Amcp%253Aafb222dc-28b4-420b-9474-b05bc6eeba89%253Adelegate-task%253Acontinuation-20261102-account-export-review-r1:ordinal:1`. The already queued ordinal2 identity message is metadata for this same allocation, not another review, source execution or commit grant. No task identity is inferred from an ordinal.
- Initial and terminal read-only self and actual Parent `t3_thread_configure`, with `modelSelection` omitted, verify **codex / gpt-6.1-sol / reasoningEffort=xhigh / serviceTier=default**. No model/configuration change, fallback or nested agent.
- Every product/compiler command uses explicit `/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node`, v22.23.0; binary SHA256 `cc61696726abdfe8392297ecd75aa9863cd9b6435b202c0dc2266039f493da10`.

The authoritative integration `source/CONTINUATION_INPUT_20261102.txt` supplied continuation, custody, async behavior and resource limits. Applicable root/portal AGENTS, personal workflow/source-review guidance, README, GOAL, D01-D48, desktop specification, contracts, addenda and workstreams were read. Complete current W1 cumulative FE1-FE6 report, original independent R1-R7 reports, original allocation prefixes and original regression probes were reconciled, including the current [source integration record](COORDINATOR_EXPORT_CONSENT_SOURCE_INTEGRATION.md) and [post-window static-export addendum](../DECISION_ADDENDA.md#static-final-export-after-the-read-only-window-1-november-2026). Earlier roster prose is historical, not authority.

Original approved input remains **95,388 bytes**, SHA256 `c45701f9f54fd2b1dbb09bbd7aa2b9b437e9059aa6032b6f39411fe2e7f6efbd`. Complete Root W1 author report SHA256 is `663b3cf541f86ce9d1359fa40b33bfa07fb1206bbfa70364e74cbdb6da83502e`; R7 is `cd0096c4c74253caf8faf73741f8b6343c4c431906e33e44d663af082e5360fd`. Earlier FAILs and their limits remain immutable.

The suggested author archive path did not exist. The actual frozen report identifies `/Users/kanuj/.t3/worktrees/shelv/t3-ccd36773/.local-artifacts/lane6-export/` and its exact six probe references. Raw logs/manifests/originals are hashed **in place**. Only executed probes, compiler/preload inputs and frozen transitive source were copied/materialized into this own checkout. No foreign executable, generated runtime or recursive archive copy was used. All original hash-listed files are checked again at terminal preservation.

## Candidate manifest and dependency fingerprint

All nine source/test additions have mode `100644`. Exact postimages at e949c9cc:

| Path | Git blob | Bytes | SHA256 |
| --- | --- | ---: | --- |
| `apps/portal/src/app/final-export-request.ts` | `47f63e6940daa7d84de97351a162d593e37bdb70` | 3347 | `28f8335679f700d4bee3c2550276f7cf2f2a9f85a95c7b3c60852a58eb6ffb98` |
| `apps/portal/src/features/account/final-export/client.ts` | `5be97a0b7a5f7723c389c5ae136c15049e8536fe` | 1225 | `207aa0880a558f00b3cf1977e74eb5db7b0951205d00e92803d5769a5bd4cc0d` |
| `apps/portal/src/features/account/final-export/controller.ts` | `90027c699b1545d5d414d41f591b992581d714a5` | 7074 | `271690a0e51ab912119771415cab840ad3e07e2a0b0a1d89c542237e1db83e5c` |
| `apps/portal/src/features/account/final-export/index.ts` | `d63ba5bfbb158f05d93bef5eb5aadf70559087e8` | 260 | `81683d8975e3a50cc160726cbfabffdd24b6a1d1017eccc1a667855a92222664` |
| `apps/portal/src/features/account/final-export/transfer.ts` | `a39b8844934331b63367b8914d0e217bafe4884a` | 2373 | `462e46a62505395c4eef2a7d84bc97acb50a615aaa1e4f206d85a24144599267` |
| `apps/portal/src/features/account/final-export/view.tsx` | `fbdbeec16505c3d8cb15da62c8a1b5b03303a106` | 2154 | `c34ef68fa3ddac7d88b25d7095eff9f010cb51753ca1bdcc00401564586dc0bc` |
| `apps/portal/src/features/account/final-export/writer.ts` | `ae3f1576b2122e5b768a13c8feaa8470dedcf5a4` | 4700 | `03f6896bbd3ce7823db0ee11c02147ada4aa962badcec014d6f336480eafdee6` |
| `apps/portal/tests/rebuild-account-final-export-consumer.test.mjs` | `71da8bc9e543b90bd13e6dc0985bd3a2b5338b4e` | 19166 | `b9edffafbdafa9634c983f024b9879f5c2b6316811f3259c6e7a8393d2cd0908` |
| `apps/portal/tests/rebuild-account-final-export-ssr.test.mjs` | `4e97aa34129bd3b60479a3dd96e5f5c51bba3cb0` | 5055 | `fcae392f9092b80ef95daaa6ac22a1bdc5318f0af58ef02056a487f1f7cad110` |

The separate d5a37968 author report has blob `9ecc2e683394212882bf472e3b9a2c63bc013e79`; its full SHA256 is `83e0d74d01e614dbf8ab404f76a59793e07bf27875f039faa7ae2416c0751242`. Earlier report hashes are in `terminal-preservation.json`. The sole owned tracked postimage is this NEW W7 report. All **2,131** existing tracked paths, including source, tests, configurations, locks, SQL and the inherited SMTP input, remain byte/mode/link-exact to own starting HEAD. `frozen-inputs.json` and `candidate-manifest.json` bind every executed immutable source input separately from this authored report.

| Frozen dependency | SHA256 |
| --- | --- |
| `src/contracts/PortalFinalExport.ts` | `86ceac2755c5554fe2ae132c0201579c33cd36ebcbdff8b15f216fd9d1049551` |
| `PortalFinalExportValues.ts` | `e0da7f27f8df40e991690c27f8d67fc80ad899cd478786a02f531fc12f546bac` |
| `PortalFinalExportValidation.ts` | `df1f3e100150a51224d4a16727b82cc4aad9021f6cb451a1241166418506327a` |
| `PortalFinalExportMapping.ts` | `bcc9f8f0d77accda21b713e69ec7a068055246b3df342f9b4ef2454a694f232b` |
| Actual public `serializer.ts` | `05a271fb0e89ff70d516243739cb2383d7512615583f224a065711d13d425cf0` |
| Actual `src/transport/session.ts` | `12e877df447d400ad86a16cdc2c63fce4dc5ce97442c501b1c0391bc0b797b9b` |
| Actual `src/app/session.ts` | `689f95ab3208612e4b8e4782d0637004eb7092cce6ffc7e8c0b095706dc72e17` |
| Actual `src/app/retained.ts` | `146d949005acc395692eca804824c2a67fb0c9bfbe5b0be98d4018f8a265b5a1` |

Own dependencies were absent. Before the explicitly conditional same-lock APFS clone, own and author physical root/portal packages and all four physical root/portal lock inputs matched their frozen counterparts. The separately checked runtime package/lock and **91 tracked runtime files** bind to immutable source. Both ignored destinations were absent; source/destination ancestry was nonsymlink and same-device. Complete literal-link/byte/mode inventories preceded `/bin/cp -cRp`; source-before/source-after/destination parity holds for **43,213 root /9,071 portal entries**, including directory roots, before execution and at terminal verification. The sole outside-node_modules workspace link is literally `shelv-advisor-session-candidate -> ../session-integration/runtime`, resolving to the own ignored fixture's frozen runtime. Internal dependency links remain within their corresponding subtree.

Root lock SHA256 is `5c57c9aec9e4585066e032e234d610a77cbffd9a51f82700c158fc37fe01b5c2`; portal lock is `bc914f3a9c9f24e44f02e3cff2804651147385ea5abda58a064531329ef23203`; runtime lock is `4024b48fb339605a438a3bfe68f6e547dade8c86660c6f06b41c278aa2289ba0`. Four physical comparisons and three tracked lockfiles are different counts. No install, source package/config/lock/dependency change, shim, declaration erasure or compiler flag relaxation occurred. The ignored focused compiler configuration changes only absolute workspace/type-resolution roots to own paths.

## Complete feasible semantic review

Review continued after both findings. No dependent success/admission execution proceeded on an assumption that they were fixed.

| Area | Source conclusion and proof limit |
| --- | --- |
| API/fixed channel | `createClientFinalExportRequest(runtime):OperationPort<FinalExportCommand,FinalExportResult>` uses the actual retained factory, fixed literal `final-export`, actual runtime transport and Root codecs/command bound. Its narrow local structural facade changes no allowlist. Actual unsupported-channel refusal is 503 before export HTTP, not a fabricated 401 or successful empty export. Positive admitted request-await/cleanup behavior remains PREVENTED by the actual registry. |
| Identity/currentness | Creation captures actual boundary reference, client audience/role/owner, local generation/epoch and server generation. `assertReady` requires actual READY plus current boundary. Actual retained boundary/lease includes CSRF and expiry; no UI flag grants authority. Request decoding/relevance, awaits, catch and final return have local and retained fences. Actual owner replacement/offline/reentrant relevance controls deny. No current Auth/Vault acceptance follows the synthetic session response. |
| Collection/private state | Actual Root `collectFinalExport`, real SHA256 and actual `createFinalExportHtmlSink` are reused. No replacement hash/bundle, whole-export accumulator or unbounded Blob exists. Guarded read/hash/stage/write/commit awaits recheck original relevance. Retirement clears active ownership and actual sink labels/manifest before notifying observers. Snapshot contains only phase/disposition, never command, model, filename, handle or private data. |
| Picker/writer | Constructor/subscription/SSR are inert. Only explicit save action reads the optional picker; methods are captured; writes await sequentially with backpressure. Terminal checks prevent further write/close work and close acknowledgement requires verified collector commit. Partial-write/close rejection/late-open/late-session/cleanup failure models are bounded source evidence. AFEC1 and AFEC2 are the uncovered presentation/recovery failures. |
| Observers/lifetime | Throwing subscribers are isolated and synchronous reentrant Save is suppressed during publication. Exact snapshot identity prevents stale cleanup overwrites of a newer published snapshot. AFEC2 demonstrates one missing check around a separate capability getter; AFEC1 demonstrates missing final late-open disposition propagation. No subscriber-based private leak was reproduced. |
| Close/abort uncertainty | Source returns only `browser-writer-close-acknowledged`. A returned `close()` ACK is not observed end-user durability. After close dispatch, lost authority or rejection remains unconfirmed; released bytes cannot be recalled. Abort owns only captured staging and cannot prove cancellation/join/erasure of already-issued writes. Failed cleanup remains uncertain. |
| Public record/post-window | Existing public-only R2/V3 traversal, exact instructions, complete basis/hash/count/part verification and final manifest reread remain intact. FE1-FE6 original predicates pass unchanged on CURRENT. No later unentitled data/raw sources/private advisor notes/R1 reconstruction is added. The after-30-day rule is preserved as intended behavior; actual trusted SQL selection and mounted post-window download are not exercised here. |
| UI/closure | View composes existing shared Button/StatusNotice and lowercase authored copy, exports only the confirmed index surface, and adds no route/date entitlement logic. No automatic picker, Blob/object URL, UUID, persistent storage, network, service worker or fake commit is introduced by this consumer. SSR/browser-target `write:false` compilation verifies source closure, not a browser or native resource. Static chosen full paths and user document contents are never logged by the consumer. |

## Executed checks and historical controls

Own ignored evidence root is `.local-artifacts/afec-r1/`. Each product/compiler invocation has expanded argv, own cwd, actual process exit, complete raw log and SHA256 in `<name>.command.json`. The recorder's exit is not substituted for the recorded Node exit. Every product command selects the explicit Node binary. The preload denies global external fetch and models BroadcastChannel with no native channel acquisition. Real ApplicationSession/cookie code consumes closed synthetic `/session` Responses; the lock callback and file-method objects are labeled models, not genuine Auth, browser locking or filesystem proof.

| Receipt | Actual result |
| --- | --- |
| `owned41` | **41/41**, exit0, zero skip/cancel: unchanged author36 pure +5 SSR/source-closure cases. |
| `retained187` | **187/187**, exit0, zero skip/cancel: nine unchanged tracked bounded export suites plus six byte-exact original FE probes. |
| `strict158` | Actual **TS6.0.3,158 inputs,0 diagnostics**, exit0; all source/declaration inputs resolve inside own fixture. |
| `independent8` | **4 pass /4 semantic failures**, exit1, zero skip/cancel. Two AFEC1 vectors and two AFEC2 vectors fail; four independent negative/sensitivity controls pass. |
| `OLD-FE1` | Exact e03 serializer:1 positive control /1 FE1 omission failure, exit1. |
| `OLD-FE2` | Exact86b5 serializer:0/1 FE2 membership failure, exit1. |
| `OLD-FE3` | Exact9442 serializer:0/1 FE3 instruction-binding failure, exit1. |
| `OLD-FE4` | Exactf16 serializer:0/1 FE4 guide-target failure, exit1. |
| `OLD-FE5` | Exactcfd9 serializer:0/1 FE5 pre-dispatch-abort failure, exit1. |
| `OLD-FE6` | Exact1787 runtime:0/1 FE6 known401/body-read failure, exit1. |

The six OLD source projections materialize only each unchanged original probe's frozen transitive inputs; only the named historical serializer/runtime blob differs from the CURRENT source closure. They are sensitivity controls, not whole historical checkouts, authored fixes or new current results. `old-manifest.json` pins every projected source/hash. No OLD emitted execution is claimed. No minimally fact-bound or approved successor fixture was needed. CURRENT does not relabel an OLD failure green: all six original predicates run unchanged separately. Full CURRENT FE2-FE6 raw JSON objects equal saved R7 originals without field filtering; FE1's unchanged Unicode/multisegment/segment/kind/leaf/root and card-only-use assertions also pass.

Independent passing controls verify throwing picker getter -> safe unavailable/no HTTP; ordinary captured-stream abort on unsupported channel -> abort acknowledged; actual READY loss during capability getter -> no stream creation; and stream write-getter exception -> owned captured abort. Independent failures use actual controller/session/retirement logic, not a positive currentness/operation/authority stub. No complete successful controller save can run through the actual unsupported channel. Positive author transfer cases directly connect the actual collector/public sink to finite fixture wire and modeled file methods; they are not authenticated controller completions.

Strong compilation preserves `strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `skipLibCheck:false` and the actual frontend options. It is the focused158 graph, not full configured Root/frontend/tests/Expo validation. The independent JavaScript test is source-executed, not newly claimed as part of that158 TypeScript graph. The giant rich-stream suite was not executed.

Representative commands, executed from the own ignored fixture; full retained paths are in `retained187.command.json`:

```sh
/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node --require ./.local-artifacts/lane6-export/deny-network.cjs --experimental-strip-types --test --test-concurrency=1 apps/portal/tests/rebuild-account-final-export-consumer.test.mjs apps/portal/tests/rebuild-account-final-export-ssr.test.mjs
/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node --require ./.local-artifacts/lane6-export/deny-network.cjs .local-artifacts/lane6-export/compile.cjs
/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node --require ./.local-artifacts/lane6-export/deny-network.cjs --experimental-strip-types --test --test-concurrency=1 apps/portal/tests/afec-independent.test.mjs
```

Original author absent-feature REDs, development semantic RED/GREENs, trailing-LF expectation/setup errors, TS2352 union-bridge diagnostic and Lucide `workflow.mjs` matcher false-positive remain hashed original evidence, not new independent passes. Original FE review import/config/type/emit/zsh/TAP/fixture failures stay attributed. One own preclone containment assertion initially accepted only top-level `.bin` links and stopped on a valid nested `.bin/semver`; no clone or product execution had occurred. The corrected containment validates every resolved internal link and only the exact allocated workspace link. This was a conservative setup check, not a dependency waiver or product defect. Initial absent archive/source-report lookups and no-hit search are discovery failures, not test results. Long displays were supplemented with separate source/report chunks. Expected Node typeless-package warnings remain. No assertion/fixture/predicate was filtered or waived to obtain green.

## Held integration and remaining acceptance

| Gate | Required next action and current state |
| --- | --- |
| **AFEC-G1** | OPEN. Coordinator first admits the complete corrected combined shared transport R4 including NT3, then exactly the two client READ actions, CookieChannel/Channel unions and retained/server action metadata. No advisor/task access. Current unsupported-channel negative is proof of refusal only. |
| **AFEC-G2** | OPEN. Fixed own-client gateway/upstream mapping to `concierge-final-export`, actual Root codec mapping, cookie/CSRF/Vault/current-identity/deadline fences and **400000-byte predecode** response /100000-byte command bound. Source facade cannot self-admit this channel. |
| **AFEC-G3** | OPEN and this R1 is FAIL. Parent corrects AFEC1/AFEC2; fresh complete independent review is required. After dependency admission, coordinator alone mounts bounded Account from actual READY boundary, disposes on route/lifetime exit, and does not require an expired plan/history read for static export. |
| **AFEC-G4** | OPEN / UNRUN, no grant. Actual controlled mounted-browser picker/write/close/abort/file-readback proof of complete public bytes and real failures/session/navigation changes. Source close ACK is not end-user durability or recall. |
| **AFEC-G5** | OPEN / UNRUN here. Native SQL/Auth/RLS/end/entitlement/instruction/lock races; supported immutable R1 public lineage/producer; practical legal-max I/O/heap/time; broader browser/mobile saving, visual/a11y/human comprehension; centrally scheduled full suites/builds and exact-head CI. No release grant. |

PREVENTED: positive actual retained final-export request and complete controller save by the unchanged unsupported registry. HELD: consumer admission/mount and dependent acceptance by the new findings plus G1/G2. UNRUN: controlled filesystem/browser/native/Auth/SQL/Storage/provider, full suites/Expo/mobile/CI and release checks. These states are not passes or waived requirements.

No install/configuration/flag/package/lock/source-dependency change, server/socket/listener/browser/native/DB/Auth/Storage/provider acquisition, foreign process/artifact execution, reset, deployment, remote write, push/PR/comment/watch/merge, Root/foreign worktree write or blocked Guidance/M65 retry/rerouting occurred. The sole authored tracked deliverable is this report, plus own ignored probes/receipts. Parent must import only its report commit, excluding the inherited SMTP INPUT ancestor. No production or original-test fix was made. The exact report-only commit is returned separately; fresh independent review follows code correction.
