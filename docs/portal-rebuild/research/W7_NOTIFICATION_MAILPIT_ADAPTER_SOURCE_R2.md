# W7 standalone Mailpit SMTP adapter: independent source R2

Owner: Kanuj. Review date: 2 November 2026. Complete frozen candidate: **`19b5946e860871deddf3eae762c02bc06fd245e7`**.

**Specification: scoped SOURCE PASS for the standalone adapter allocation. Correctness/quality: scoped PASS, no new material finding. Allocated source/finite-test completeness: COMPLETE.** SMTP1/P2 is addressed at the actual body-write invocation boundary. The original five-case probe reproduces OLD **3/5, exit1** and CURRENT **5/5, exit0**, without assertion changes. The unchanged original29, retained39, additional independent9, strong actual-declaration graph and configured Root application/test types pass independently here. These are separate evidence groups, not a full-product acceptance total.

This report does **not** admit the adapter to Root or the worker, accept a native executor, authorize resources, or establish genuine SQL/current context, real sockets, Mailpit queue acceptance, relay isolation, recipient delivery, browser behavior, CI or release readiness. Original R1 `374539c27e4064cca13fd70f7cdab93d3882fd31` remains FAIL with its original raw results and held-check history.

## Scope, identity and exact candidate

Own T3-managed checkout: `/Users/kanuj/.t3/worktrees/shelv/t3-3568c1a6`, branch `t3/review-smtp-mailpit-adapter`, initially clean at **19b5946e**. No import, cherry-pick, rebase or input-only commit was made by this reviewer. The sole authored tracked deliverable is this new report. All execution and writes stayed in this checkout and its ignored probes/receipts; original integration and foreign worktrees were read only.

The authoritative NEW taskId was forwarded literally and separately by Parent:

`node:delegated-task:command%3Amcp%3Aafb222dc-28b4-420b-9474-b05bc6eeba89%3Adelegate-task%3Acontinuation-20261102-smtp-adapter-review-r2`

Read-only `t3_thread_configure`, with `modelSelection` omitted, verified actual self and Parent `9b085ada-435f-48d6-8886-957c1ce3e82d`: **codex / gpt-6.1-sol / reasoningEffort=xhigh / serviceTier=default** before source/probe work and at finalization. The returned self backing thread is separately `thread:delegated-task:command%3Amcp%3Aafb222dc-28b4-420b-9474-b05bc6eeba89%3Adelegate-task%3Acontinuation-20261102-smtp-adapter-review-r2`; it was not used to infer the task handle. Explicit Node throughout: `/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node`, verified **v22.23.0**. No model/config change, fallback or nested agent occurred.

Source lineage is **8af746d197b976972d4b16924155afa8c3b32d44 -> attributed INPUT09cf6dad2e7d6a3ff24e20e75c743401bb7b4706 -> correction19b5946e**. Original author commit is `107a0678c58add60a3b47655ada49d3bb47f243d`, directly based on8af. The INPUT commit's exactly three additions were independently compared byte-for-byte to original107a. INPUT is neither authored coordinator production nor Root admission. Correction19b changes the adapter and adds the unchanged independent five-case probe and coordinator report. Review covered the **complete five-path postimage**, including the original test and author report, rather than only the small dispatch patch.

Complete manifest: `.local-artifacts/smtp-r2/candidate-complete-manifest.json`, SHA256 **`23e6174be5ed36d8b1620fd9a3b97da9a94d39ed6276a605877dd9ecd6dd96d6`**. All five entries are mode100644:

| Complete candidate path | Git blob at19b5946e | SHA256 |
| --- | --- | --- |
| `supabase/functions/concierge-notifications/mailpitSmtp.ts` | `f2c33a16a7d6b0bcb8db20c7d56af7658ad24572` | `c977efac1c0ade1628716381e3d9c2a4d921aa0f9f23f082fd893004454b7305` |
| `tests/portal-notification-mailpit-smtp.test.ts` | `f77e9e3b8e8bef5671639081c934dfaf8db25ebe` | `f47ac2955a0e72bc708c472ee127a24abec500046f39182b56eb536e8a2dc45b` |
| `docs/portal-rebuild/research/W1_NOTIFICATION_MAILPIT_ADAPTER_SOURCE.md` | `d364a6fee09d9c8659e3b27128a938c247afdf40` | `d2413dc2ea2d21c2641e5a33e08e488bd7da42ee28686fd66ea835de7fadbd6c` |
| `tests/portal-notification-mailpit-dispatch-boundary.test.ts` | `92d7db3609f732fc217a79682cdb9677c8fb6f68` | `b3561f4622af059cbbcc9640ec2e489b77eb7a44594a2b973b23788842064ca7` |
| `docs/portal-rebuild/research/COORDINATOR_SMTP1_CORRECTION_20261102.md` | `1908dc1f0feee5f710a11cb363e4c9a32cd8f22f` | `56edda4340aa105745d582e5499c0b170cab02632a6bf78f7a9344febfcaa853` |

The relevant complete continuation/custody sections, actual original author allocation and its full brief, full author report, immutable SMTP R1 and coordinator correction govern. Also read applicable AGENTS/WORKFLOW, rebuild README/GOAL/D01-D48/desktop specification/contracts/addenda/workstreams, full notification kernel author/N1/N2 response and independent R1-R3, transport R3/NT2 and native-executor R4/NE4. Historical roster labels grant nothing. The approved original remains **95,388 bytes**, SHA256 **`c45701f9f54fd2b1dbb09bbd7aa2b9b437e9059aa6032b6f39411fe2e7f6efbd`**. No approved policy/input was edited.

## SMTP1/P2 and adjacent outcome truth

Original107a set `dispatched=true` before entering `write(data)`, whose outer and inner guards could still prevent all socket body writes. The current private helper is `write(content,isBody=false)`. At current lines164-167 it performs the inner `check()`, sets dispatch only for a body, then immediately invokes the captured `ownSocket.write`. The sole body call passes true at line181. No awaited operation or callback sits between that final guard and the marker/write expression. Protocol command writes never set the marker. A synchronous body-write throw remains uncertain because the invocation may already have exposed bytes.

The independent R1 v2 probe is unchanged: the pinned8,374-byte file has SHA256 **b3561f46...64ca7** in original R1 custody, coordinator input, tracked test and both own executable fixtures. OLD uses exact107a adapter SHA256 **`877f40f80590adfc651def29666fb5bbd4b16333f53d21e1e69508809482445c`**; CURRENT uses the complete candidate postimage above. Both load the exact real neutral-codec graph from Git. No assertion, status, budget, revalidation implementation or production predicate was adapted.

| Unchanged case | OLD body writes / outcome | CURRENT body writes / outcome |
| --- | --- | --- |
| Live, expiry read0 | 1 / accepted `Q-123` | 1 / accepted `Q-123` |
| Earlier expiry, read4 | 0 / failed | 0 / failed |
| Outer body-write guard expiry, read5 | **0 / uncertain, FAIL** | **0 / failed, PASS** |
| Inner pre-invocation guard expiry, read6 | **0 / uncertain, FAIL** | **0 / failed, PASS** |
| After invocation expiry, read7 | 1 / uncertain | 1 / uncertain |

All five complete exactly four revalidations and destroy their captured transcript sockets. OLD `old-five.json` retains3 pass/2 fail, exit1; CURRENT `current-five.json` retains5 pass/0 fail, exit0. This confirms the status-classification correction, not a native scheduler incident or actual message. The old R1 one-test/seven-position raw and narrowed original v2 remain separately hashed in place; neither old result is rewritten as green.

Original29 and independent9 confirm that a body throw, callback error, socket error, abort, negative/malformed/missing/delayed ACK and post-ACK QUIT/cleanup failure remain uncertain, with one body attempt and no resend. Predispatch invalid inputs, denied context, earlier protocol errors, abort or expiry remain failed. Valid parsed queue identity is accepted only after QUIT221, captured close and final cancellation/deadline/cleanup checks. A synthetic parsed250 is queue-acceptance output under test, never actual Mailpit or delivered/read evidence.

## Complete allocation matrix

The full original allocation was read from `records[key=mailpit_adapter]` in original integration's `.local-artifacts/portal-rebuild/coordinator-active-20261101/refill-active-20261102-0615.json`; its complete relevant record is retained as own `author-allocation.json`. The original UTF8 brief SHA256 is `9a6ec4a15204d9fec2d8e402f80b08ccd67ebe138b0a22331b631dff90fbbf5e`. The following covers the complete standalone contract and R1 requirements.

| Requirement | Independent source and finite evidence | Remaining limit |
| --- | --- | --- |
| New standalone factory/type; existing worker, codec, sink, SQL, DTOs/Auth/routes frozen | Exact five-path manifest; original public API and `local_mailpit_smtp` kind. Frozen worker still requires literal `local_synthetic_filesystem`; no union, index, runner or self-activation. | Worker integration needs a separate pin. |
| Closed config, literal loopback, bounded port and timeout, fixed sender | Original29 rejects DNS, external IP, URL, credentials/AUTH/routing/header keys, invalid port/timeout; IPv4/IPv6 positive controls. Own-data copies reject accessors/symbols and capture values before awaits. | No actual connect or OS routing proof. |
| Actual neutral codec, synthetic recipients/links, no private payload/injection | Original29 plus independent canonical-host/port/credential/query/fragment/control and operation-extra-field negatives. Exact subject/body/destinations; fixed headers, validated To, actual delivery UUID. | Synthetic payload validation grants no recipient/event authority. |
| No module-load I/O, discovery, AUTH, retry or invented identity | VM traps module-load construction and unexpected imports/fetch/storage/random UUID. Source imports Node Socket, constructs only after first revalidation, never reads environment/config/credentials. Advertised AUTH is ignored. Same-message test sends twice on separate sockets with identical actual Message-ID. | Identical Message-ID is not deduplication; no reconciliation is implemented. |
| Mandatory captured operation, actual AbortSignal, notAfter and async-void callback | Original invalid/missing/synchronous/boolean/rejected callback and clock/expiry/abort negatives pass. No default true or authority selector. Mutation/reentry controls preserve captured address/config/operation and reject nested send. | No-op test callback is only a synthetic contract input. |
| One absolute minimum deadline across connection/recheck/reply/write/drain/cleanup | Source fixes wall/monotonic endpoints once, checks finite/nonregressing clocks after waits and before writes. Original delayed connect, accumulated commands, shorter notAfter, pending callback/late completion and cleanup deadline controls pass. | No natural network/OS cancellation or trusted expiry producer proved. |
| Calendar/offset/fractional expiry validation | Original explicit UTC-offset positive and February30 negative pass. Independent +05:30 and six-digit fractional cases pass; exact truncated expiry refuses before connect. | Conservative millisecond truncation does not extend a microsecond lease. |
| Four revalidation fences, including after354 | Before socket creation, before recipient envelope, before DATA, after354 before body. Original revocations prevent relevant writes and capture cleanup. Five original boundary cases complete four callbacks. | Trusted fixed-SQL actor/session/lease/recipient/event/body binding remains future worker work. |
| Exact socket/operation ownership; no late writes/reuse | Actual private active symbol, captured socket, alive/fault/abort/deadline fences and token-specific release reviewed. Original reentry, delayed callback, old-socket/error/drain isolation and address mutation tests pass. | Fault-instrumented VM events do not certify a naturally mounted schedule. |
| Strict bounded SMTP state/parser | Actual greeting/EHLO/MAIL/RCPT/DATA/body/QUIT sequence; CRLF, fatal UTF8, codes/separators, matching multiline, unsolicited/interrupted/wrong-code rejection. Independent512-byte/32-line and8192-byte incoming-buffer positive/negative controls pass. | Finite transcript compatibility only. |
| Cumulative reply limit | Independent32x512 greeting plus32x512 EHLO consumes32768 bytes; next MAIL reply refuses before RCPT.31-line EHLO adjacent control accepts the entire exchange. | Not a load/performance or real-socket test. |
| MIME/CRLF/dot stuffing/wire limits | Original exact MIME and private pure serializer assertions pass; send rejects non-neutral dot-line content and otherwise valid oversize wire line. Source retains8192 total data and998-byte line guards. | Pure private serializer read is explicitly separate from send. |
| Parsed final ACK, bounded real response ID, honest status | Independent1/128-character IDs preserve exact case/identity; empty/129-character/invalid IDs and extra ACK text remain uncertain. SMTP1 OLD/current and original/post-attempt controls pass as above. | Running Mailpit version and its exact ACK grammar are unverified. |
| Captured cleanup/backpressure/reentrant error handling | Original callback-plus-drain, pending/throwing close, reentrant cleanup abort, late callback rejection and retired socket isolation pass. Independent post-ACK QUIT throw and missing-close cutoff remain uncertain. | Destroyed transcript flag does not prove OS close for a throwing double; failure cannot recall exposed bytes. |
| Current retained notification regression and actual strong/configured types | Exact original29, six retained files39, independent9 and original5 pass. Strong actual-declaration graph and configured Root app/test types exit0. | No full suite/build, shared transport admission or genuine authority acceptance. |

No additional material finding or unresolved standalone-source objection was established after complete source/test/report review. No production or original test was corrected by this reviewer.

## Exact commands, raw results and former held checks

Evidence home: **`.local-artifacts/smtp-r2/`**. Own `run.py` records expanded argv/cwd, timestamps, elapsed duration, real exit, full untruncated combined output and output SHA256 in separate exclusive JSON/log files. All Node commands use the absolute binary below and prefix its directory on child PATH. Temporary paths and retained sink receipts are own ignored paths. Existing Node typeless-package warnings remain unsuppressed.

In these commands `N` denotes exactly `/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node`; `E` denotes exactly `.local-artifacts/smtp-r2`. Raw JSON stores the expanded literal argv, not these abbreviations.

```text
python3 E/run.py old-five N --experimental-strip-types --test E/old/tests/portal-notification-mailpit-dispatch-boundary.test.ts
python3 E/run.py current-five N --experimental-strip-types --test E/current/tests/portal-notification-mailpit-dispatch-boundary.test.ts
python3 E/run.py current-author29 N --experimental-strip-types --test E/current/tests/portal-notification-mailpit-smtp.test.ts
python3 E/run.py retained39 N --experimental-strip-types --test --test-concurrency=1 tests/portal-notification-authority-status.test.ts tests/portal-notification-journal.test.ts tests/portal-notification-worker.test.ts tests/portal-notification-session.test.ts tests/portal-notification-handler.test.ts tests/portal-notification-contract.test.ts
python3 E/run.py independent-controls N --experimental-strip-types --test E/current/tests/independent-controls.test.ts
python3 E/run.py strong-types N node_modules/typescript/lib/tsc.js -p E/tsconfig.strong.json --listFiles
python3 E/run.py configured-root-app N node_modules/typescript/lib/tsc.js --noEmit
python3 E/run.py configured-root-tests N node_modules/typescript/lib/tsc.js -p tsconfig.tests.json --noEmit
```

Exits respectively: **1,0,0,0,0,0,0,0**. Test groups respectively: **OLD3/5, CURRENT5/5,29/29,39/39,9/9**, each zero skipped/cancelled. No name filter, waiver, assertion deletion or current-wire substitution was used. Retained39 uses the actual Root codecs/handler/runtime/ApplicationSession/retained-cookie source and real owned synthetic filesystem sink. Its fixture Auth/RPC replies/direct-port unit cases remain synthetic, not actual trusted database/current rights. Filesystem acceptance is not SMTP acceptance.

The strong graph uses **TypeScript6.0.3**, `strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `skipLibCheck:false`, `noEmit`, ES2022 target, ES2023/DOM/DOM.Iterable libraries, Bundler resolution, original actual declarations and own declaration root. It preserves the original strong config's flags and original file entries, rebinding only their checkout/declaration paths and adding the original five-case test and independent controls. **243 listed files /74 own nodes, zero diagnostics**:58 canonical own nodes plus16 fixture nodes (including duplicate exact codec/worker inputs and the independent probe). `strong-types-inputs.json` hashes every listed file. These counts are not243 tests or a claim of a new runtime graph. The tracked configured Root application and test configurations also independently return zero diagnostics with no overlay, erased declaration, shim or weakened flag. No frontend/session compiler, full npm/Expo build or CI result is implied.

Thus **all SMTP R1 formerly held retained39 and strong/configured Root application/test checks are now run**; no adapter-source finding prevents them. No check remains held on SMTP1. Broader genuine/product checks below are unrun by allocation, independently of this correction.

## Historical evidence and custody

Original author raw failures remain separately attributed: missing adapter0/20; first implementation8/20 with VM realm/test-expression issues; corrected boundary19/20; actual-source23/25 (malformed callback accepted and late write rejection unhandled); corrected25/25;26+39=65/65; retired-socket27/27; notAfter0/2; final29+39=68/68. Initial strict exit2 and later strict exit0 remain distinct. The two actual-source RED outputs were read in full and their original commands/exits retained by in-place hashing. Their exact pre-fix source postimages are not immutable inputs in this packet, so no reconstructed OLD replay of those author stages is claimed. Original29 currently reproduces their corrected predicates. SMTP R1 unchanged29 and its two failed independent programs remain original evidence, not newly authored acceptance. No minimally adapted or approved-successor replay was needed for SMTP1: the exact original five-case program runs on both immutable OLD and CURRENT.

The original18-input Git manifest and exact probe were checked before materializing only the needed source/package/probe inputs into own OLD/current ignored fixtures (19 paths each including the added five-case file). `executed-inputs.json` binds head/blob/mode/SHA/size per path. The new independent probe is separately authored only in ignored storage, SHA256 **`dbea0d0fe857c0908c13e2b2d6a524ee80e9c9351d0ea6e1821a60c794a46d7f`**. No foreign script/generated runtime was executed. **53 original raw/manifest files** across author, SMTP R1 and coordinator evidence were hashed in place, not recursively copied; terminal readback confirms those hashes remain unchanged.

Both dependency roots were initially absent. Before the conditional **root-only** `/bin/cp -cR`, checked own/original-integration package bytes, all **four physical root/portal lock inputs**, all **91 tracked session-runtime paths**, model config/eight role paths, nonsymlink roots/ancestors, same device, absent ignored destinations and complete source byte/mode/kind/literal-link inventories. Every dependency link resolves within its own root dependency tree. No portal dependency clone was needed. Full pre-probe and terminal source/destination parity covers **43,213 entries including the root**; canonical inventory fingerprint SHA256 **`89b016f86245e4b7b4c216cdbe1a3c12df5bf8f52f755d2feefd12a18723ff2a`**. No install, package/lock/config mutation, foreign executable, generated session runtime or Auth state was acquired.

Root lock remains **`5c57c9aec9e4585066e032e234d610a77cbffd9a51f82700c158fc37fe01b5c2`**, portal lock **`bc914f3a9c9f24e44f02e3cff2804651147385ea5abda58a064531329ef23203`** in both checkouts. Three tracked lockfile paths and four physical compared inputs are different counts. The initial missing trailing slash in the absent-directory ignore check stopped the preflight before any copy; only the ignored custody script was corrected, and all gates then passed. A bounded allocation-path/search miss and truncated combined displays are recorded in `setup-notes.txt`; they supplied no semantic finding or passing test claim.

All **2,133 starting tracked paths**, including complete candidate5, frozen baseline2,128, **66 migrations/all121 SQL**, worker/neutral codec/sink, original tests, Root DTOs/shared Auth/routes/config/packages/locks and approved input retain exact bytes/modes/kinds/literal links. Candidate production postimages remain exact19b. Ordinary Git hooks were inspected; no hooksPath override or active hook and no bypass. Final report links, scope and `git diff --check` are verified before the ordinary report-only commit. Ignored terminal receipt records the resulting SHA and clean tracked state without a self-referential report edit.

## Known findings, integration gate and unrun work

**Consolidated actionable set for this candidate: no new material findings. Stable SMTP1/P2: addressed within source and finite VM proof.** Kernel N1 cross-family collision and N2 denial provenance retain their earlier bounded R3 closures and genuine SQL/catalog/concurrency limits. This review does not close global NT2 or its later correction/admission matrix, nor native NE4 successors/NE5/NE6. Provider-refused Guidance/M65 was neither re-reviewed nor rerouted. No native executor was executed or self-accepted; no execution packet or grant was issued.

**Integration gate:** this standalone source is independently reviewable for a deliberate coordinator-owned integration. It still cannot be passed to the frozen filesystem worker. Parent must separately pin the adapter union and actual trusted worker composition: immutable delivery/lease/recipient/event/neutral-body binding, fixed-SQL current-context revalidation, actual actor/session/owner rights where applicable, trusted notAfter and one absolute cancellation/deadline through Root RPCs/revalidation/cleanup. No caller flag, no-op callback or synthetic Response supplies that authority. Any selected local fixture URL must preserve exact origin/port/path, credentials, fixed RPCs and deadline/abort fences; no blanket HTTPS relaxation follows. Apply only deliberately owned source/report paths after reconciling live Root; do not sweep the INPUT ancestor or this review's ignored inputs into production.

**Unrun by scope, not prevented by SMTP1:** actual net.Socket/listener/Mailpit/version/ACK grammar, genuine worker-to-queue acknowledgment, no-relay/no-auto-forward fixture proof; real SQL/Auth/current context/RLS/catalog/concurrency/result journaling; native executor/recipe/grant and cleanup; provider credentials/configuration, real-recipient delivery, bounce/reconciliation/authenticated webhooks; Root worker/admitted channel/App/inbox/A06/retry and authenticated destination navigation; browser/download/visual/accessibility/human/business acceptance; full npm/portal/Expo/native/migration/pgTAP/Edge suites, exact-head CI, cutover and release. Source/VM/finite HTTP/filesystem/typechecks confer none of these. No persistent resource was acquired or adopted, and none needed STOP/RETURN.

Deliver only the new report-only commit. Parent owns canonical status/CONTEXT_SYNC, subsequent integration and dispatch. The complete approved portal rebuild and notification feature remain open.
