# W7 complete shared transport, inventory and notifications: independent SOURCE R5

Owner: Kanuj. Review date: 2 November 2026, Chicago. Frozen candidate **24d343c367b867dd798c6ad140180e638a780393**. **CHANGES REQUIRED: NT5/P2 and NT6/P2. No combined admission to Root.** Report-only independent source review, with pure/closed synthetic HTTP/native Node stream evidence. No production or tracked test correction was authored.

## Separate verdicts

| Subject | Specification / completeness | Correctness / quality |
| --- | --- | --- |
| Complete combined generic/cookie/ApplicationSession/Vault/provider/gateway/notification/inventory source | **FAIL for admission.** Observer-safe retirement and prompt gateway overflow refusal remain incomplete. | **CHANGES REQUIRED**, the two consolidated inherited findings below. Complete feasible semantic review continued after both findings. |
| NT3 and NT4 correction | Scoped addressed on original NT3 OLD6/12 -> CURRENT12/12, original NT4 OLD1/2 -> CURRENT2/2, and expanded NT4 OLD1/5 -> CURRENT5/5. | Scoped PASS for those source vectors. No naturally mounted cleanup-hook, ordinary network or physical cancellation-completion claim. |
| Original SD1, NT1, AAS5 and NT2 | Independently repeated originals pass on current source; OLD failures remain separate. | Scoped PASS for those vectors only. No Account, notification-entry or full application acceptance. |
| Root decoder correction | OLD3/7 -> CURRENT7/7 within the executed 21-case group. | Scoped PASS for prompt `too_large`, observed cancellation rejection and reader release. Gateway uses a separate, still-failing reader. |
| Inventory page transport and preservation | Current33/33; unchanged inventory-only source witness **12/14, exit1**. | Page/negative controls pass. Two stale preservation premises receive the explicit disposition below; no waiver or green witness claim. |
| Physical static graphs | Root application/test/frontend/session checks exit0 with real installed declarations; strong controls2/2. | Compiler proof only. The separate standalone Workers differential is44 baseline/44 current/0 introduced, not a clean standalone Workers graph. |
| Full approved rebuild / release | **Incomplete and unaccepted.** All26 screens, D01-D48 and secondary flows remain required. | No mounted Root, genuine Auth/SQL/RLS/Storage, provider delivery, browser/visual/human, full-suite/CI or release PASS. |

The original95,388-byte approval, full desktop specification,48 decisions and later founder addenda remain binding. This review does not replace the complete product with a transport checklist. Historical SD1/NT1/AAS5/NT2 and R4 NT3/NT4 FAIL reports remain unchanged.

## NT5 / P2: an invalidation observer can interrupt actual logout or disposal

Affected source: [ApplicationSession retirement](../../../apps/portal/src/app/session.ts), especially `end()` at98, `signOut()` at179-183 and `dispose()` at185-192; [generic invalidation](../../../apps/portal/src/transport/session.ts) at42 and143. ApplicationSession is unchanged from frozen58. The generic `invalidate()` statement is byte-identical at58,2c,bc and24d. This is inherited composition debt, not an NT3/NT4 regression.

`end()` invokes boundary observers without isolating exceptions. `signOut()` calls that callback-capable `drop()` before reaching `transport.signOut()`. A throwing observer therefore rejects the actual sign-out request before the retained cookie's canonical logout starts. Separately, ApplicationSession calls `transport.dispose()` before fencing its own boundary or setting `disposed`; the transport invokes its observers synchronously, also without exception isolation. An observer can inspect the still-current Application boundary and its memory, and a throw prevents the subsequent drop/cookie disposal.

The own `current/independent-observer-retirement.test.mjs` creates the actual ApplicationSession and retained client cookie. Its fetcher enumerates only synthetic session/logout URLs and native Responses. The negative hook is a deliberately throwing subscriber registered through the real public subscription API. No currentness, lease, authority, operation or Vault success port is substituted.

| Actual source case | Observation before assertion |
| --- | --- |
| Ordinary boundary observer, actual signOut | PASS: next observer runs; cookie/snapshot signedout; canonical `/api/client/logout` reached. |
| Throwing boundary observer, actual signOut | FAIL: `synthetic_observer_throw`; next observer not run; cookie and snapshot remain ready; old boundary object remains in snapshot; **logout endpoint is unreached**. The captured boundary itself has been dropped and is not claimed current. |
| Ordinary transport observer, actual dispose | Disposal eventually completes, but its callback observes `boundary.isCurrent() === true` and the synthetic private-memory marker before App fencing. The required before-callback predicate fails. |
| Throwing transport observer, actual dispose | FAIL: exception interrupts disposal; boundary invalidator not run; cookie remains ready; old boundary remains current and retains synthetic memory. |

CURRENT is **1/4, exit1**, zero skip/cancel. The unchanged program with the exact pre-bc2c generic/body selection is also **1/4, exit1**. The reader can reproduce the observations and both controls from immutable raw receipts. Actual caller inspection finds transport invalidation registered in `app/ports.ts`, and boundary invalidation in Application preview navigation, ClientHistory, client state/composition and feature controllers. This establishes a supported source seam; it does **not** establish a naturally throwing mounted subscriber, native privacy breach, cross-client disclosure, genuine server session survival or production incident. The marker is synthetic same-session state.

Required owner correction: make session retirement non-interruptible by observer failures, fence/clear the actual Application boundary and private state before callbacks/abort, continue remaining retirement callbacks and canonical logout/cleanup despite a throw, and keep repeated disposal safe. Preserve genuine session-denial and replacement fences. Retain these original controls and add actual reentrant/throwing snapshot, boundary and transport observer cases. Do not suppress authorization failures or treat a callback as authority. Parent owns this shared composition correction; this reviewer made none.

## NT6 / P2: gateway overflow refusal still awaits underlying cancellation

Affected source: [gateway policy `readBounded`](../../../apps/portal/session-integration/runtime/server/policy.ts) at80-107, reached through `jsonBody()` and the [actual gateway](../../../apps/portal/session-integration/runtime/server/gateway.ts). The complete reader function is byte-identical to frozen58. The corrected Root `readConciergeJson` is a different implementation and does not close this gateway boundary.

On overflow the gateway reader executes `await reader.cancel()` before throwing413/`too_large`. A pending cancellation prevents refusal; rejected or throwing cancellation replaces the intended size failure and the real gateway maps it to503/`unavailable`.

`current/independent-gateway-overflow.test.mjs` compiles the actual candidate gateway from own source with `write:false`, then passes a native Request/native ReadableStream with8193 bytes to the actual client notification route. Actual origin, method, content-type, CSRF, route and cookie parsing execute. The namespace binding only throws if reached; **all four cases have zero Vault dispatches**. No successful authority or operation stub is provided.

| Underlying native-stream cancel | Actual gateway observation |
| --- | --- |
| Resolves | PASS:413, `{code:'too_large'}`, one cancellation request. |
| Remains pending | FAIL: response still pending at the100ms observation bound, one cancellation request. The fixture subsequently resolves only its own held cleanup so the command terminates. |
| Rejects | FAIL:503, `{code:'unavailable'}`, one cancellation request. |
| Throws | FAIL:503, `{code:'unavailable'}`, one cancellation request. |

Result: **1/4, exit1**, zero skip/cancel. The100ms value is an observation bound, not a changed production deadline. This is finite native Request/stream source evidence; no ordinary Workers/network reachability, external denial-of-service, Auth effect or physical cancellation completion is claimed. The same source reader also serves other gateway JSON/upload bounds and the provider's general response reader; their complete network behavior was not executed by this probe.

Required owner correction: decouple known overflow refusal from cancellation acknowledgement, observe rejected cancellation, finalize the reader safely, preserve exact byte limits and413 semantics, and retain resolved/pending/rejected/throwing cleanup plus UTF8/exact-boundary controls through the actual gateway. Do not change global deadlines, limits or authority. Analogous retained cancellation waits elsewhere are not silently fixed or certified by the Root decoder change.

## Complete semantic pass and retained invariants

The review covers the entire combined target and actual callers, beyond the latest two-file correction: generic acquisition/invocation/decode/error/finally/private-return; ApplicationSession boundary versus READY semantics; retained JSON/photo/multipart catches; private WeakMap denial binding; both creation-bound facades; provider deadline/header/body/context handling; serial encrypted SessionVault and worker final egress; final gateway parsing; canonical notification index/runtime/handler/codecs; inventory command/mapper/handler/runtime; and the changed Root decoder's actual source consumers.

- NT3 captures the actual caller signal and predicate once and composes caller/lifetime cancellation. Both decoding and the facade's final private return require READY, exact original boundary/actor/audience/epochs/generations and capabilities. Local false/throw/abort/suspension refuses503; genuine end/capability controls remain401/403. Original READ/WRITE commands, UUID/body/CAS and uncertain WRITE `original` are preserved.
- NT4 registers cancellation on the actual notification body operation, requests reader cancellation at most once, checks abort/relevance around reads, and finalizes listener removal and reader release separately. The100000-byte bound and fatal UTF8 parsing remain. Prompt refusal does not prove underlying cleanup completion.
- Denial provenance is private, exact-session-bound and classification-only. It cannot grant private success. Current actual received401 retires;403 remains recognizable across valid offline state; stale identity/role/local or server generation cannot retire replacementB. Local post-abort or provider deadline cannot manufacture authority. Original NT1 runs retain the real12000ms timer and actual canonical aborted Root return, with no lowered deadline or response rewriting.
- Notification client scope remains own inbox/seen/original-seen status; human delivery reads need VIEW and retry/original-retry status need EDIT. Seen is a CSRF-protected bookkeeping write, not clinical EDIT. Unknown namespaces, actor/client/RPC/endpoint selectors and task/service-worker commands reject before egress. Commands8192 and responses100000 are distinct bounds.
- SessionVault owns the complete operation await serially. No impossible same-VaultB-before-heldA ordering is forced. Actual provider current-context checks and worker post-alarm fences remain. The direct Root/controller and serial pipeline proofs are separate from mounted App authority.
- Inventory returns one exact page, not a complete PhotoBasis, Storage byte grant or upload acknowledgement. Detached cursor/limit/head, actual own-client/VIEW binding and READY/private-return fences remain. Browser/provider/gateway page bounds8192, existing head4096 and legacy clinical409 stay distinct. Current33 includes malformed/private/duplicate/cursor/head, UTF8/exact/overflow, abort/currentness and real provider-deadline cases. Direct-constructor forwarding and its defaults remain unchanged.
- The Root decoder initiates cancellation, observes rejection, releases its reader and refuses overflow without awaiting physical cleanup. Byte counting, fatal UTF8 and JSON parsing are unchanged. All13 source files containing `readConciergeJson` references (12 importers plus decoder) are inventoried with SHA/call contexts in `decoder-actual-callers.json`: admission handler/runtime, care, checkins handler/storage, notification handler/runtime/worker, operations handler/runtime/body, plans and shared reviews. Their existing error mappings were inspected. This is affected-call-site review, not acceptance of those entire domains, Storage, credentials or the held Guidance/M65 lanes.

No additional material finding was established in the feasible semantic pass. NT5 and NT6 prevent combined admission even though the bounded corrected vectors pass.

## Original and current execution evidence

Evidence home: `.local-artifacts/w7-shared-transport-r5/` in this own checkout. `run.py` records full expanded executable/argv/cwd/PATH, start/end/elapsed, stdout+stderr, SHA and **true test exit**, in unique0444 logs/JSON. Its shell exit is not substituted for the test exit. `commands-index.json` indexes27 commands, SHA256 **79a00a841e17d8049dfae42b1f87a1fcad2f6daee47882c1d41340d8b7322d6d**. Counts overlap and must not be summed. All completed behavioral groups have zero skipped/cancelled cases.

Below, `N` means the literal `/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node`; `S` means `--experimental-strip-types`; `L` means `--loader ./loader.mjs`; `D` means `--import ./deny.mjs`. Unless stated physical, cwd is the own ignored `current/` fixture. OLD selectors are recorded as `R4_OLD` in each receipt, not an inferred old branch.

| Exact program selection after `N` | OLD | CURRENT |
| --- | --- | --- |
| `S [L] --test independent-final-facade.test.mjs`, OLD `bc` |6/12 exit1|12/12 exit0|
| `S [L] --test independent-body-abort.test.mjs`, OLD `bc` |1/2 exit1|2/2 exit0|
| `S [L] --test tests/portal-notification-final-return.test.mjs tests/portal-notification-body-abort.test.mjs` |7/17 exit1 =6/12 +1/5|**Physical17/17 exit0** =12/12 +5/5|
| `S L D --test .local-artifacts/sd1-{old,current}/photo-denial.mjs`, OLD `61` |3/5 exit1|5/5 exit0|
| `S L D --test .local-artifacts/nt1-{old,current}/provider-deadline.mjs`, OLD `nt1` |2/3 exit1, actual12s|3/3 exit0, actual12s|
| `S L D --test r5-first-lease.test.mjs`, OLD `v4` |2/4 exit1|4/4 exit0|
| `S L D --test .local-artifacts/nt2-{old,current}/cleanup-relevance.test.mjs`, OLD `2c` |3/4 exit1|4/4 exit0|
| `S [L] --test tests/portal-cookie-final-return.test.ts tests/concierge-body-cancellation.test.ts`, OLD `2c` |11/21 exit1 =8/14 +3/7|21/21 within current70 below|
| `S L D --test tests/portal-photo-inventory-transport.test.mjs` |Historical failures remain attributed|33/33 exit0|
| `S L D --test tests/portal-photo-inventory-source.test.mjs` |Author14/14; bc13/14, separate histories|**12/14 exit1**, unchanged witness|
| `S [L] --test independent-observer-retirement.test.mjs`, OLD `2c` |1/4 exit1|1/4 exit1, NT5|
| `S L --test independent-gateway-overflow.test.mjs` |Reader source identical to58; no old gateway execution claimed|1/4 exit1, NT6|

Additional exact current selections:

- `N S D --test tests/portal-cookie-first-lease.test.ts tests/portal-cookie-denial-provenance.test.ts tests/portal-cookie-post-abort.test.mjs tests/portal-notification-transport.test.ts tests/portal-cookie-final-return.test.ts tests/concierge-body-cancellation.test.ts`: **70/70, exit0**. Receipt label `selected-current58` is only a name; actual observed count is70, not58.
- Physical `N S --test tests/portal-notification-closed-http.test.mjs tests/portal-notification-provider-deadline.test.mjs tests/portal-notification-authority-status.test.ts tests/portal-notification-session.test.ts`: **52/52, exit0**, including nested deadline cases, actual cookie/gateway/encrypted Vault/provider/canonical Root composition and genuine received401/403 versus local abort. HTTP/Auth/RPC responses are enumerated synthetic fixtures, not genuine authorization or persistence.
- Physical `N node_modules/typescript/bin/tsc -p tsconfig.json --noEmit`, `N node_modules/typescript/bin/tsc -p tsconfig.tests.json --noEmit`, `N apps/portal/node_modules/typescript/bin/tsc -p apps/portal/tsconfig.frontend.json`, and `N apps/portal/node_modules/typescript/bin/tsc -p apps/portal/session-integration/runtime/tsconfig.json`: **all exit0**. Actual TypeScript6.0.3, existing flags and installed declarations; no source overlay.
- Physical `N --test tests/portal-notification-strong.test.mjs`: **2/2, exit0**. New adapter graph is clean; the separate combined standalone Workers graph deliberately preserves44 original diagnostics and has0 introduced. Do not call that graph clean.

The physical graph checks are independent static evidence and do not validate NT5/NT6 behavior. Parent's main2246/15 with only application.js changed, public2177/3 all-output equality/no-live-transport proof, and earlier retained287/287/shared35/35 remain **attributed** to the correction receipts. This reviewer did not rerun product builds after the findings, and none is Rootb86 composition proof.

## Inventory witness disposition and canonical pin history

The unchanged raw inventory-only witness is **12/14**, with two exact failures: advisor-cookie notification executable nodes now intentionally differ, and the prior generic byte pin still differs. All other original predicates, constructor forwarding/defaults and denial/head-budget mutation sensitivity controls pass. The full current source differs frombc on the two authorized NT3/NT4 production paths; those changes are not inventory erasures. Therefore these two failed premises are **not evidence of an inventory behavior regression**. They also do not establish a passing current preservation witness.

Independent current-scope disposition: preserve this raw failure and the historicalbc13/14; a separately owned successor must retain all original relevant preservation/constructor/budget predicates while explicitly binding the generic NT2 and notification NT3/NT4 postimages and verifying their complete semantics. This report makes that requirement actionable, but authors no successor and grants no waiver, filter, skip or14/14 claim. NT5/NT6 remain admission blockers independently.

Every canonical pin row's immutable blob, length and SHA was independently checked in place. `canonical-pin-audit.json` SHA256 **e35c2183ecde8ad8f39c83e6cfe6b5cdffc6d0235d2ee8251759f8d119dd0516** preserves full comparisons:

| Pin | Exact scope / SHA256 | Current qualification |
| --- | --- | --- |
| Notification entry v1 |**26 rows**, transport07c4 + feature8f9; `4fb96ef11ee15640d92e5ae57ba359079913be687e08e26ba0597d6343f01e31`|Photo74eff is not a notification target. Earlier wrong-pin/setup history stays preserved. Feature files absent from this transport input remain a separate consumer lane.|
| Photo composed v1 |77 source rows,21 virtual postimages,6 package bindings,276 unique edges; `f5a73a62956bb310481a44863d1db9d1308329f4b0a5cf6059ed3b920cf761d1`|Old adapter blob7887ec53 at74eff; W4b906/R6 reviewed this exact v1 only.|
| Photo composed v2 |Same77 source rows/6 packages, adapter successor only; `49c1aa973e3a8d407788bcbdcdd494b511a14fa42b40fabd43f0892c78f09cde`|READY successor99ded uses blob7ffa6872. Neither v1 nor v2 accepts laterbc generic/body or24d notification changes.|
| Root producer projection |Six authorized runtime postimages; `acae84d966e149658349ea3a1cf9065512f543068ec7b68e0de6279474b0a543`|Two incompatible native signature maps remain excluded;14 manifest rows are not14 production inputs.|

Against current24d, v1 differs on adapter, generic, decoder, advisor-cookie and retained annotation; v2 differs on the latter four. The annotation is the already-physical compiler prerequisite, not an authority change. All six package bindings match. Manifest rows, closure nodes and runtime edges remain different counts;306 declarations with30 duplicates do not become306 unique edges. No photo complete-collection, v2 consumer adoption, C05/C07 upload or Storage acceptance follows.

Historical raw280/287,250/256,24/25,37/39, head31/32 and29/32 remain failures at their own inputs. Approved854 modifies only two header-before-abort timing fixtures with57 original assertion texts; e937 changes the one offline-private-return401-to503 expectation;96f8 changes two no-channel admission expectations;86ac changes three import annotations. No new AST certification or raw/approved full-suite replay is claimed here. The old inventory hang,45s diagnostic30 pass/1 cancellation and47-minute owned-runner interruption remain separately hashed history, not current cancellation or current33 proof. Parent's initial missing-AAS5-module0/1 and wrong-original-owner-NT1-cwd0/1 are preserved setup failures, never product REDs or green matrices.

## Exact input, custody and delivery boundary

Own T3-managed isolated checkout: `/Users/kanuj/.t3/worktrees/shelv/t3-e365391d`, initially clean at24d, with2157 tracked paths. Parent is the separately verified coordinator, and Root is `/Users/kanuj/.t3/worktrees/shelv/kanuj-portal-rebuild-integration-20261030` atb86b8aeac71c15ec01eea5dd0e99e8062828e21c during custody checks. The coordinator/source-correction checkout and this review checkout are not Root. Published Root CI/hosted review does not accept this candidate or later modules.

Input lineage is frozen58 -> canonical07c4 -> inventory74eff/99ded/7658 ->2c9633d8 ->bc5651e6, materialized as INPUT9e8d39b7 on the coordinator's8af-derived base, followed by24d. INPUT9e8 contains42 target projections/35 changes because seven already matched. SMTP09cf/19b are unrelated input/correction ancestors. **None is report delivery. Do not import this whole branch.**

The correction authors exactly five paths: two production files, two new tests and its author report. Full combined target union is45 paths: prior42 plus three additions, with two overwritten postimages. `combined-candidate-delta.json` SHA256 **5dd9a67c9ae9c4a8a40f42eac09405913ad99022df25c7ed7334511c8c19450a** includes every path/blob/mode/bytes/SHA. The current116-source closure is SHA256 **892e4bbd18f32f25cca52046e64691bea534289104b7fb7268c42f1ac1dbfce5**. Relative to R4's116 it changes only the two production corrections and the already-physical retained annotation. Three exact Git314 Account consumer verification inputs are additional and separately identified, not accepted Account production.

| Five authored correction postimages | Git blob, mode100644 | SHA256 |
| --- | --- | --- |
| apps/portal/site/auth/advisor-cookie-session.js |38d55642266e66d507da7b963e3ac5bc674f5c0c|784112e551f5ee22060ad8d0d2592ce283b4e583fd58ae213fc01e5c4383c394|
| apps/portal/src/app/notification-request.ts |adbc97fb5d9ea3f0699c16d61bb103eec8cc303d|2118ec95a62a3f66dd80fd409862d60f9947c7f97b4ef00736c003e3976611b7|
| tests/portal-notification-body-abort.test.mjs |33e83ea5d8d33fa639bd341a366bec7bccbd5b30|9ee4f2f421a8ea6f9ed399cbb1256c4fba2104cc82259dc05e8be576ed6be86f|
| tests/portal-notification-final-return.test.mjs |d29d978584fc33cac8f00982775704f85a04a65e|f062ebc79be214750c710f4632ca40837d8709586305d919f4478f0a611696ca|
| docs/portal-rebuild/research/COORDINATOR_NT3_NT4_CORRECTION_20261102.md |79fa5240f2ed25e875c3c0b7a7204a942b9e7679|df56861096aa4b1e64873da50a8e1a40aece0cbab77bc060a51c5b64bba022dd|

Original NT3/NT4 probes are byte-exact copies. The durable tests change only three relative imports; NT4 appends three cancellation cases. `original-test-correspondence.json` SHA256 **1b0fbd980deabac7aa55c318ed1f9c8709f4638c41666723348ef50527b202a9** verifies this mechanically. SD1/NT2/AAS5 original predicates are unchanged. NT1 changes only the one expected cwd literal; the exact original provider preimage is Git3f4cb671, SHA2566b6871dea77e1b014c93112c14d2c9e5d39b55245a9fb6c96ac93fc3e2bf6f99. Its current observation was moved intact to a distinct own file before OLD wrote its original exclusive path. No assertion/limit/schema/hook replacement occurred.

Both own dependency roots were absent. Before either APFS `/bin/cp -cR`, packages, four physical root/portal locks, the separate runtime lock, all91 runtime source paths, nonsymlink ancestors/roots, same device, literal links/targets and full source byte/mode/kind inventories were checked. Complete root43213/portal9071 entry parity passed before probing and is rechecked terminally. The sole outside-dependency workspace link stays literal `../session-integration/runtime`, resolving within the own checkout; no foreign generated runtime was copied. Root React19.2.3 and portal React19.3.1 remain distinct. No install, shim, declaration/flag erasure or config/dependency/lock change.

The first pre-copy gate stopped because the brief's summary said six differing runtime files; the actual full historical manifest and live source both contain **five**: client-policy, client-upstream, gateway, policy, upstream. Parent explicitly confirmed the prose error. Original count-stop raw is preserved; no copy or probe preceded qualification against those exact five immutable fingerprints. Six authorized Root projection postimages is a separate count. Another ignored preparation attempt could not `git cat-file` an unstored computed V4 blob; it copied only the exact already-pinned executed source bytes after SHA checks instead, with no product execution on the failed setup.

The four former compiler overlays are now **byte-exact physical own and Root files**, independently matched to the qualified4 manifest: retained annotation, two native signature maps and interleaving guard. `physical-four-prerequisites.json` SHA256 **34b47eb843a1423d72b733514aa03d73932ea2db608cb3171a2e59540542ed30**. That old manifest's stale `onlyThree...` key does not change its four actual rows. Fresh physical typechecks above used no source overlay. The116-source fixture, original/source selections, probe bytes and true results are separately fingerprinted; earlier archives were not recursively copied or executed.

Read and hash-pinned applicable AGENTS/workflow, rebuild entry/decisions/full spec/contracts/addenda/workstreams/status, full preserved approved input and latest continuation, full R4 and original SD1/NT1/AAS5/NT2 reports, and relevant owner corrections/pins. The approved appendices were verified entirely equal to the already-read companion decisions/specification, and the complete manifest was read. Approved input remains95388 bytes/SHA256 **c45701f9f54fd2b1dbb09bbd7aa2b9b437e9059aa6032b6f39411fe2e7f6efbd**; complete continuation is100187 bytes/SHA256 **b428b318598df52f12ce3e6ea4ebd350ff9333ee05d9fd8f04a8e845d0c722bc**. `historical-raw-references.json` hashes176 prior raw/receipt files **in place**, SHA256 **1d278548478804c76f1d511cd91102b41882f385dddb3f4967da802096d28533**.

Authoritative literal taskId, forwarded separately after start:

`node:delegated-task:command%3Amcp%3Aafb222dc-28b4-420b-9474-b05bc6eeba89%3Adelegate-task%3Acontinuation-20261102-shared-transport-review-r5`

Backing thread uses the separate `thread:delegated-task:...` handle, never a task/run substitute. Actual self and Parent9b085ada-435f-48d6-8886-957c1ce3e82d `t3_thread_configure` READ calls omit `modelSelection` and verify **codex/gpt-6.1-sol/reasoningEffort=xhigh/serviceTier=default**, full-access/default, initially and terminally. Explicit Node is22.23.0. No fallback, global-config edit or nested agent.

Final checks preserve all2157 starting tracked bytes/modes/literal links, complete dependency custody, current/probe fingerprints, report links/scope and `git diff --check`; stage and commit **only this NEW report**. Terminal commit/clean-state receipt lives in ignored `FINAL-HANDOFF.json` to avoid self-reference.

## Required next step and proof limits

Parent should allocate bounded owner corrections for NT5/NT6, retain these probes and every original regression/raw/pin, then commission a **NEW complete independent review** of the corrected immutable combined manifest. Later Root integration must project only reviewed owned paths against actual Root preimages, preserve exact tests and consumer pins, and rerun affected composition/physical graphs. Notification-entry, Account and photo complete-collection have separate successor/current-consumer gates. This report admits none of them.

Prevented by NT5/NT6: combined startup/retirement/bounds acceptance, shared Root admission and dependent feature/product-build acceptance. Feasible original reproductions, negative/closed HTTP matrices, static graphs and semantic review continued. Merely unrun: full npm/Expo/portal package, broad raw/approved287 and retained feature suites, fresh main/public compilation and CI. Parent's earlier evidence is attributed, never silently banked for this head.

Still unaccepted: actual Root App mounts, photo complete collection/private bytes/Storage, genuine Auth/SQL/RLS/ACL/catalog/concurrency, lawful Source consent/retention/cleanup, real local sink/provider/delivery/webhooks, genuine financial operations, ordinary mounted navigation/Back/forms/downloads/focus, exact26-frame/secondary/narrow/mobile/visual/a11y/human comparisons, migration/cutover/rollback, exact-head CI and release authorization. Historical Guidance/M65 provider refusals remain held; no retry/reroute occurred.

No browser/preview/DOM, native DB/Auth/Storage/provider resource, socket/listener/server, cached-image/resource execution, install, process adoption, flag/declaration/config change, foreign execution/write, production/test fix, push/PR/comment/watch/merge/deploy/reset or real-client/message/payment/order/permission action occurred. Only own source/synthetic verification, authorized Parent task updates and this sole report commit are delivered.

## Complete combined target path fingerprint

All45 target postimages below are mode100644. Complete byte counts and SHA256 values are in the fingerprinted `combined-candidate-delta.json`; these are review inputs, not reviewer-authored production.

| Path | Immutable24d Git blob |
| --- | --- |
| `apps/portal/session-integration/runtime/server/client-policy.ts` | `e7cdbe95987a558d06057c068914f8b8132c0c11` |
| `apps/portal/session-integration/runtime/server/client-upstream.ts` | `7e6c1bfd0c4f6e3cc37c37bae3b295de7e2b4e88` |
| `apps/portal/session-integration/runtime/server/gateway.ts` | `7961851ee3e5a0df77efa2d778d42c2c1ad27a72` |
| `apps/portal/session-integration/runtime/server/policy.ts` | `4fc4dbcd0f14e0dd53abb32f058ad87f23f4bacb` |
| `apps/portal/session-integration/runtime/server/upstream.ts` | `bab157d40d23c419c23b2951911e2f395949e128` |
| `apps/portal/site/auth/advisor-cookie-session.js` | `38d55642266e66d507da7b963e3ac5bc674f5c0c` |
| `apps/portal/site/auth/client-cookie-session.js` | `40511c729ed05fd25942ab99f08c64568e85efd6` |
| `apps/portal/src/app/notification-request.ts` | `adbc97fb5d9ea3f0699c16d61bb103eec8cc303d` |
| `apps/portal/src/app/photo-inventory-request.ts` | `7ffa68726c8dab6bc114ec4ad5ebf441e352ea4c` |
| `apps/portal/src/transport/session.ts` | `27482274aeee6884af478eb63993abe36cd94c03` |
| `apps/portal/tests/rebuild-cookie-cancellation.test.mjs` | `aac90d682ca65f575e53b5f93280a62139c66e25` |
| `apps/portal/tests/rebuild-foundation-transport.test.mjs` | `74d14de1df4b9a2a4d2d7ea4a78ded266a84b741` |
| `apps/portal/tests/rebuild-photo-inventory-closed.test.mjs` | `3eaea8853584edc417f2816397604659df371678` |
| `apps/portal/tests/rebuild-photo-inventory-strict.test.mjs` | `0df9885cd23e983c6ef15b6b0d44c810293046e5` |
| `docs/portal-rebuild/research/COORDINATOR_NT2_SOURCE_ADOPTION.md` | `d382642db07a3a8ccba115497ccf700c1f932581` |
| `docs/portal-rebuild/research/W0_NOTIFICATION_TRANSPORT.md` | `47ba1514eb9385e81babec2bba9fb85c2323b722` |
| `supabase/functions/concierge-checkins/commands.ts` | `3e90a6ed46b2e769b4462f16d0fbf3464d78b4d4` |
| `supabase/functions/concierge-checkins/handler.ts` | `f79aa6f9f584b3ef723641d6adaf8a5850f40653` |
| `supabase/functions/concierge-checkins/index.ts` | `41e51dcfa2d1facb3318d1f8bbcd978adcf4a823` |
| `supabase/functions/concierge-checkins/projection.ts` | `bbeb54cd10132f6440602c362dec5379d6536c19` |
| `supabase/functions/concierge-checkins/types.ts` | `3592b3b2eb89582a8084fa8f13481c8e867fca35` |
| `supabase/functions/concierge-notifications/index.ts` | `40cc2a241ba3cff8877540485bd1931953e16fa5` |
| `supabase/functions/concierge-operations/body.ts` | `41434838ed4c06b329dc7552ce2ef4fac740201e` |
| `supabase/functions/concierge-operations/runtime.ts` | `0f9e292d61a11434b2850af09e36c8641d789d9d` |
| `tests/concierge-body-cancellation.test.ts` | `ae876df11d5d1efa6060ad0370a9e114a61ca5b3` |
| `tests/portal-cookie-denial-provenance.test.ts` | `ea97c926c0ee1a12e35ed22ec70ffbf76042a820` |
| `tests/portal-cookie-final-return.test.ts` | `1c7b82aab504f906248d510daef6d65416bdf1e1` |
| `tests/portal-cookie-first-lease.test.ts` | `754cbfb7e27b2a95718f0add9a61eb5fe5f6594d` |
| `tests/portal-cookie-offline-return.test.mjs` | `80fe9dd30bcc0e7646d8fd52de5fceb581b497b4` |
| `tests/portal-cookie-post-abort.test.mjs` | `6b0088b3e95abdafee31587e61a2d4a9f18b475a` |
| `tests/portal-cookie-retained-denial.test.mjs` | `73da8ebdb534265646b08dc5cc4b5f0f79825079` |
| `tests/portal-notification-authority-status.test.ts` | `1eea9b38310a458e69083bd635ce00acf3360092` |
| `tests/portal-notification-closed-http.test.mjs` | `d9e9fceaa329fa2814ac9ba3b799f401716fad83` |
| `tests/portal-notification-provider-deadline.test.mjs` | `7463cc03a866554f6f4d14ae8c9c2034d04aac99` |
| `tests/portal-notification-session.test.ts` | `9e15ade0231f0e10b179884ebec4f86bd45067de` |
| `tests/portal-notification-source-mask.test.mjs` | `b61525855bbfab0206fb64dc34e30329ffd08f54` |
| `tests/portal-notification-strong.test.mjs` | `6eebe72578703ce97c39dc1ceb3cd3dda31cc0a8` |
| `tests/portal-notification-transport-types.ts` | `26364d42f0340fd44a6f66727b1b2d657d98a3a6` |
| `tests/portal-notification-transport.test.ts` | `aa869066a9c2ea05d6c54229019bb31235d8ba44` |
| `tests/portal-photo-inventory-source.test.mjs` | `e5b048fc744047c59ff9fee8fbd4cd29c3ca8c5d` |
| `tests/portal-photo-inventory-transport.test.mjs` | `b7cf5463b732d585b20835d0ee19bfa7beced82d` |
| `tests/portal-photo-inventory-types.ts` | `9c365d7700f7e707f4949f7cc2fb0414b5573c33` |
| `docs/portal-rebuild/research/COORDINATOR_NT3_NT4_CORRECTION_20261102.md` | `79fa5240f2ed25e875c3c0b7a7204a942b9e7679` |
| `tests/portal-notification-body-abort.test.mjs` | `33e83ea5d8d33fa639bd341a366bec7bccbd5b30` |
| `tests/portal-notification-final-return.test.mjs` | `d29d978584fc33cac8f00982775704f85a04a65e` |
