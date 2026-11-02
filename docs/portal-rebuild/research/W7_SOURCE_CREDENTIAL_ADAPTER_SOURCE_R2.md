# W7 Source credential adapter independent source review R2

Owner: Kanuj. 2 November 2026 UTC. **Specification/completeness: FAIL for the bounded credential-adapter pin. Correctness/quality: FAIL.** CA2/P2 and CA3/P2 reproduce as corrected. One consolidated residual finding, **CA4/P2**, concerns listener registration outside the guarded lifecycle and pre-dispatch write classification. Complete feasible source/finite-response review continued after that finding. No production or original test was changed.

Candidate is the complete six-target successor **e1d548e6b700ca277b763a337304b01108a03218**, with identical postimages present in own frozen base **556befca22e0c2d7aa9cb63913eadaf45fb7b853**. This reviews the whole original adapter allocation, original implementation 435c6d13cd16b3081ced5d6fbe76d730090152dc, separate author report 97b6bba2b65557d89564a709a831644699f880a9, full R1 report 85d878aa33174799402b20b1e0edef1609364c0f and the correction, rather than only CA2/CA3. Source/kernel/private endpoint admission remains **HELD**, independently of this adapter finding.

## Consolidated actionable finding

### CA4 / P2: listener setup escapes finalization and can misclassify an undispatched write

Exact candidate supabase/functions/concierge-sources/credential-runtime.ts:103-104 installs the timer and registers the caller listener before the try/catch/finally beginning at line 147. Both exported factories share this code.

The following finite witnesses use actual native AbortController/AbortSignal instances. Only that signal's registration method is deliberately wrapped, retaining its real native registration operation:

1. **Registration throws after the real add.** All four Source/Account × auth/WRITE calls reject with the synthetic raw PRIVATE registration exception; all four configured fetch counters remain zero. They do not resolve safe 503/unavailable responses. The installed timer and registered listener bypass normal finalization. The probe uses mocked timers, so it neither waits for nor claims an observed real ten-second leak or unhandled rejection.
2. **Registration invokes the real caller abort synchronously.** All four original signals are actually aborted; every fetch counter remains zero. Auth returns 503/unavailable, but both WRITE calls return503/uncertain. The writing variable records command kind, not whether send was invoked; guarded catch/final refusal use it although this operation was refused before dispatch. Genuine already-aborted controls return unavailable and ordinary native calls succeed.

The new three-registration probe has **one passing control and two failing desired-contract assertions, exit1**, no skip/cancel. The first interactive throw witness failed before the second witness/control were appended; the captured successor preserves the same first assertion, adding a diagnostic of actual rejections. No original predicate is filtered, waived or rewritten.

**Impact/proof:** P2 raw-port safe-error/lifecycle fidelity under deliberately throwing/reentrant signal setup, the same bounded source-robustness evidence class as R1's deliberate getter/listener-cleanup witnesses. It does **not** establish ordinary native registration naturally throws/reenters, mounted-browser disclosure, unauthorized writes, SQL authority bypass or a real leaked timer/resource. Neither witness performs network I/O. The inspected frozen kernel handlers catch port failures; this report does not claim the raw exception becomes a client response.

**Required action:** include listener setup in the guarded per-call lifecycle, clean up even if registration partly succeeds then throws, and classify refusal using actual dispatch state. Setup refusal before any fetch invocation is unavailable; lost dispatched WRITE remains uncertain. Preserve the original monotonic budget, actual caller/internal abort checks, prompt cancellation and already received 401/403 through cleanup. Retain both setup regressions across both families/methods without authority callbacks, RPC/context selectors or public API changes. A fresh complete independent review is required. No fix is authored here.

## Complete bounded requirement assessment

| Requirement | R2 assessment and proof boundary |
| --- | --- |
| Exact inert constructors/closed ports | createSourceCredentialPorts(config):SourceKernelPorts and createSourceAccountCredentialPorts(config):SourceAccountKernelPorts match the frozen type-only signatures by source inspection. Sole sibling helper permits only source/account. Invalid family/config fails safely. Module/constructor performs no I/O. Builtin execution is not typechecking. |
| Source15/Account3 and fixed scope | Actual unchanged validators accept all 15 Source and 3 Account commands in original 19. Source remains eight reads/seven writes/task0 and exact client/draft union. Account adds no client selector. Envelope construction is not action authorization. |
| Fixed command/context API | Exactly each family's command and request-context names; args only p_command or canonical p_request_id. Foreign RPC/path/version/family, extra actor/client/scope/authority fields, malformed UUID/schema, cycles, class objects, accessors/toJSON refuse before fetch. No caller-selected authority URL or SQL selector. |
| Capture/detachment/raw text | Configured HTTPS origin/original custom host/key/copied frozen origins/configured-or-global fetch are captured before waits. Per-call bearer/URL/serialized validated body survive mutation, concurrency and reentrant cancellation controls. BOM/CRLF/non-ASCII source text retains exact bytes, without truncation. Parsed field order differs from an unparsed envelope. |
| Auth convention | Fixed /auth/v1/user, original bearer/public key, omit credentials, error redirect, no-store. Auth bodies/role/identity/expiry remain raw bounded inputs, never invented identity or permission. Global unexpected fetch is denied before imports; injected fetches return only enumerated finite native Responses. |
| Request limits | Actual serialized Source 500000/Account 100000 UTF8 envelope caps plus strict readers. Oversized/unknown-field inputs refuse before fetch. Small valid command schemas do not demonstrate a lawful exact500000-byte positive command. |
| Response limits before decode | Fixed Auth 8192/page 400000/other-context1800000 buffers; each actual chunk checked before copying. Exact-cap/over-cap, Unicode/misleading Content-Length, consumed-chunk and independent fragmented/rejected-cancel controls pass. Upstream json() is unused. |
| Exact raw/fatal decode boundary | Fragmented multibyte and deliberately invalid UTF8 remain exact bounded raw bytes here. Fatal decoding is the unchanged downstream kernel's responsibility. No decoder, Source success result or authority port is fabricated. |
| Single 10000ms absolute budget | Original fetch 6000 + body 4000 scheduling control passes. New monotonic controls expire during fragmented reads and final listener cleanup across both families/auth/READ/WRITE, with no renewed budget. Finite timing is not natural network/physical cancellation proof. Setup failure remains CA4. |
| Prompt cancellation/late responses | Pending/rejecting/throwing/reentrant/locked/body-getter/read-error controls pass. Retirement fences before abort/cancel; rejected cancellation is observed without awaiting acknowledgment. Signal-ignoring late 200/late 401 after retirement is discarded; late401 never replaces local 503. No physical cancellation claim. |
| Denial fidelity | CA1 original body-getter witness remains OLD 17/19 versus CURRENT 19/19. Exact R1 statusText/final-cleanup11 goes OLD 6/11 to CURRENT 11/11; durable 13 goes OLD 6/13 to CURRENT 13/13. Known received 401/403 stays empty through combined cleanup abort/throw and simulated final expiry. No invented local401. |
| Non-denial final return | Corrected result survives guarded removal; actual caller/internal abort and original monotonic expiry are checked before return. New both-family auth/READ/WRITE controls cover raw 200/400/409/429/503 cleanup abort/throw. Native empty 204/304 preserves status/header/empty body. |
| Unavailable/uncertain | Ordinary pre-abort/malformed input is 503/unavailable; dispatched WRITE transport/body/cleanup loss is 503/uncertain. CA4 exposes remaining setup exception and command-kind-versus-dispatch confusion. |
| No activation/authority expansion | No index, gateway/channel, App, runtime Source kernel HTTP/RPC, SQL, Auth/Storage, policy, upload, cleanup or live credential activation executed. No SourceReady, real cookie/Vault/private-egress or product/release acceptance follows. |

No further material adapter finding was established in the remaining inspected paths/executed matrix. This bounded conclusion does not certify arbitrary JavaScript hooks, missing integrated behavior or genuine authority.

## Identity, source custody and complete candidate

Own T3-managed workspace /Users/kanuj/.t3/worktrees/shelv/t3-0ae1fb4f, branch t3/source-credential-adapter-r2-review, started clean at 556befca. Starting tracked protection was derived live: **2212 paths**, not earlier reviewer 2133 or coordinator 2202. Every starting path's bytes/mode/kind/link identity and all 91 tracked session-runtime paths are protected. Only this NEW report is tracked authored work; own ignored evidence is separate. No candidate/INPUT/report ancestor was cherry-picked.

Parent separately supplied literal authoritative taskId:
node:delegated-task:command%3Amcp%3Aafb222dc-28b4-420b-9474-b05bc6eeba89%3Adelegate-task%3Acontinuation-20261102-source-credential-review-r2.
The distinct backing thread begins thread:delegated-task: with that suffix. Actual metadata binds this worktree/branch to parent 9b085ada-435f-48d6-8886-957c1ce3e82d; run ordinal 1 requested 13:18:14.440Z/started 13:18:16.227Z. Task identity was not inferred from those handles.

Actual self AND parent t3_thread_configure READs, modelSelection omitted, initially and before delivery confirm **codex/gpt-6.1-sol/reasoningEffort=xhigh/serviceTier=default**. Explicit /Users/kanuj/.nvm/versions/node/v22.23.0/bin/node --version returns **v22.23.0**, and that executable runs every Node probe. No model/config edit, fallback or nested agent. Parent confirmed frozen source during this review and retained exclusive sharedR7 heavy custody.

All six targets below are exact at candidate e1d548e6 and own 556befca, modes100644. Original 435c owns three implementation/test additions; 97b6 owns its separate report. Successor e1d authors only Source runtime correction, cleanup test and correction report. INPUT91db4c30 and physical SourceTypeINPUT5 5115a729 remain separately attributed inputs, not newly authored Source or accepted kernel. Whole shared/entry/profile/SMTP/input ancestry is excluded from delivery.

| Complete target | Bytes | Git blob | SHA256 |
| --- | ---: | --- | --- |
| docs/portal-rebuild/research/COORDINATOR_CREDENTIAL_CA2_CA3_CORRECTION_20261102.md |6236|c1b82e06c2987e4ccb0a28bc98bc718b60dfe9f0|6544e28d8df7f0e46b2324c6c652557bdd8f09284b6bcf6df734e4748ea2cf1a|
| docs/portal-rebuild/research/W1_SOURCE_CREDENTIAL_ADAPTER_SOURCE.md |18448|5eab751e0fac09607bdaa3fa1080774c3c01edff|415c7c5288b360a7bdb7d478b333b368c46acbadee88c5ba644d2969f7d2bf5f|
| supabase/functions/concierge-source-account/credential-runtime.ts |530|77c507868d45e682e02ae3e1fb8747057b2384fc|a7859748938fbba459112702613cf605ee222340c2801c2345610d6339296909|
| supabase/functions/concierge-sources/credential-runtime.ts |10421|bf37ba81671bd6cba744576f3320e82d1cae9765|cce590b6bf8abb9be7010a1e27f4cb916a428a5b95de67db962674dd4bbc9bf0|
| tests/portal-source-credential-cleanup.test.ts |11488|3bf9a9f249aa78bb9d214101df8fe9a3311003cd|cedde5dca3afe1169c082c2aa94e4af032434f06fa250e40a5c7aeb67a150b80|
| tests/portal-source-credential-runtime.test.ts |23824|e6c74b4925658da7f90bbe247f1cd1a216787230|ca9f07bd65cbb6ee14e77c1642a4e19b38d526031323f57d1df9ed1c28dba03a|

Own candidate manifest SHA256: 9dfd2230f984b4b050b1844368f10c07e705cc53be26284f59ce42392a1c8011. Full original 41 closure SHA256: 3bf4f071eb1f8b78b288fc5cb5fcc7509c8e7f3a8af4b99fe5da0180d33c820c, byte-identical to R1's manifest. Every foreign original 41 physical file was hashed in place and reconciled to immutable Git ref/blob. Current 41 changes only exact Source runtime postimage, SHA256 53216abaf1c58d5f4d0338bde62f6fa29065315e2915bf2add6b6c786c61a175. Cleanup 13 is an additional exact candidate input.

Five frozen inputs derive from b8: two type-only kernel types, blobs eebe4e90633e424866d5c55e92abbc328373c319 / 2e64e410f3a27d88ff26270d9577957a3508f416; Source type/validation/values, blobs 6144c2449ffe06b1139f233b781964e220b9902b / d9be4e75018916ee7cee76db797509df3ba698cb / 771c891355f340f597aaaf10f0a3493cd1aa8660. Other original 36 derive from 435c. These are actual source/type inputs, not authority declarations or successful substitute ports. No runtime kernel/SQL runs; kernel HTTP handlers are inspected context only.

Execution manifest records actual Node resolve edges per run and reconciles bytes/ref/blob against the retained exact run recipe after restoration. Adapter batches resolve **15 file modules: 14 runtime modules plus entry test**. Physical Account 74 resolves 16 files, including five tests. Forty-one materialized inputs are not 41 executed modules or a configured compiler graph. Complete manifest is in own ignored executed-graph-manifest.json, with final SHA recorded in terminal evidence.

## Binding requirements, dependencies and preserved history

Applicable AGENTS/WORKFLOW, [rebuild entry](../README.md), GOAL, all D01-D48, complete desktop specification, contracts/addenda/interface pin, workstream/status/task history and full original/continuation inputs govern this review. The original adapter task was read from its actual completed T3 thread and retained in own receipts. Historical status/roster prose is not live authority.

Original 95388-byte input SHA256 c45701f9f54fd2b1dbb09bbd7aa2b9b437e9059aa6032b6f39411fe2e7f6efbd and distinct 100187-byte continuation SHA256 b428b318598df52f12ce3e6ea4ebd350ff9333ee05d9fd8f04a8e845d0c722bc remain unchanged. Complete 11040-byte interface pin SHA256 f9ca6fc8dd71187137e4ace340c3cf2e230015039cccf4d1a83c264dffa430b7. Both decision/spec files match their complete original appendices. Foreign raw/evidence was hashed in place; only individually needed immutable source/probe bytes entered own ignored fixture. No recursive archive/generated-runtime copy or foreign execution.

Own Root/portal/session node_modules are absent. No install, dependency acquisition/APFS clone, borrowed compiler, declaration shim/overlay or package/lock/flag/config change. Conditional clone procedure was **NOT ENTERED**; 43213/9071 dependency-tree parity is **not claimed**. Four physical own/Root root+portal locks/packages match bytes/modes/device; separate runtime package/lock also exact. Three tracked locks and 91 runtime paths remain protected. The a90 policy/five historical runtime differences do not become an exception or compiler result here.

Parent OLD/CURRENT strict 206-input TS6.0.3 zero-error projection, later physical configured graphs and terminal43213/9071 remain **attributed Parent evidence**. None ran here. Projection is not physical Root acceptance; physical INPUT5 does not accept the kernel. Centrally reserved full npm/Expo/native/browser/SQL checks were not acquired after CA4 or for busywork.

## Independent commands and raw outcomes

Evidence home: .local-artifacts/portal-rebuild/w7-source-credential-r2/. Own prepare.py materializes 41 immutable Git inputs, checks six targets, hashes history in place and pins original independent probe SHA256 f6f4c50bfb6dfd5c1e2cf8750d360e55aad9f2a2db222e4b9fc13b7b0ac8389d. Cleanup 13 mechanically retains exact original 11 registrations/inputs/assertions with only two import bindings changed, plus two appended registrations.

Own commands:

- python3 .local-artifacts/portal-rebuild/w7-source-credential-r2/prepare.py
- python3 .local-artifacts/portal-rebuild/w7-source-credential-r2/run.py
- python3 .local-artifacts/portal-rebuild/w7-source-credential-r2/run-new.py

Each wrapper retains exact explicit Node argv/cwd, true exit, raw hash and resolve graph. Node uses own --import global-fetch denial and resolve observer, --experimental-strip-types --test; no compiler. The runner restores only own ignored runtime/test copies in finally. Wrapper exit0 means capture completed, not that expected failures passed. No test-name filter.

| Exact independent run | Actual result | Exit | Raw SHA256 |
| --- | --- | ---: | --- |
| Original R1 independent11, OLD435c |6 pass/5 fail|1|ad0ccb7b1d4953bbb206824b96c02e1ac1e644beecba9824af4d2124b9b7a473|
| SAME11, CURRENT |11/11|0|cf28e83957594aedea4ac9ef68c55036f6f575e38b5374523cb6f60c7ea999b4|
| Exact cleanup13, OLD435c |6 pass/7 fail|1|0881bc150bcf555cca95cd18497fcc2144e11b8ff8cba61a5606a2fdf254a2d4|
| SAME13, CURRENT |13/13|0|82ad82637117b1793ef445256fa91d54cf324441fd8218c170d10fd75c48608e|
| Unchanged author19, OLD435c |19/19|0|3baf95d831368ad6a5aa82c4a3ca4728526739ab23f1d205c899648a26cf325f|
| Retained pre-CA1 runtime, SAME19 |17 pass/2 fail|1|ff18c142dad360c33f5cfdd7f1e02f1a6d1b062862077a2622d8a2ce74dc00cc|
| Unchanged author19, CURRENT |19/19|0|49fb92e52208f7eb155ad9a253ad206de03e1e0fd02cc60ae6e8d3158c0e291b|
| Exact raw prefetch15 on CURRENT |14 pass/1 fail|1|5c06d3c417bf1c04ed44853a1e8e5ff6c98ea11d36e831ff7548986bb79ff2bc|
| Exact raw unparsed-envelope19 on CURRENT |18 pass/1 fail|1|36bc3d292e323fc9e314f4dfcd4d4e11264bd99b2d8ab7b4cc6ad112fba2623b|
| Five unchanged physical Account suites |74/74|0|e0713432a331f744fd2b48ef87dbad77f276c32236885893b655b6ef06dffd80|
| New complete-semantic6 controls |6/6|0|4b51ef216d598be6e22a4a6160b5fb095b564bfb756af99ca195ae77d73e93a7|
| New CA4 setup3 |1 control pass/2 assertions fail|1|afba9be0fb7bd4771eab2097b393edfad6a2d565acb013ee57c14d86227fa9df|

All batches have zero skip/cancel. Groups overlap; do not sum them into product acceptance. New semantic probe SHA256 81a17c44e0b6c219b8b348a77b48e31b8fd19354db9114a3928ba7ecfa0b27d4; CA4 probe SHA256 f5a2ed944d15ebba88ef5fa1a43d5017d2571242e3793e6be4dcf271882756f8. Initial interactive captures are distinct from these retained runs.

CA1 OLD runtime SHA256 00d857ef7d43b3a1da6aa5ad04d1326b5cacbb40bf916209c81ba0af69f846f7 differs from 435c. Original missing-constructor 0/1 and malformed scaffold remain attributed setup/RED history, hashed in place rather than called rerun behavior. Old prefetch/key-order inputs still fail unchanged; their fact-bound successors disable premature prefetch and use actual parser field order, preserving byte predicates. R1 FAIL remains historical; correcting CA2/CA3 is not retrospective R1 green.

## Held integration and sole-report delivery

Complete kernel R2 report 2598e508b86c146518c6c063d8748f03c1f5d6ba, SHA256 4385d6dd6b0f7babeed62be2157900771ea07ba9fbb0dfe4b493e455e323e19e, remains **FAIL**: SK2/P1 bare CASE, SK3/P2 occurrence-versus-persisted-recording clock mismatch, SK4/P2 version distinction before lawful lineage/reference authority. Full report and original R1/R2 raw receipts were reconciled/hashed in place; no kernel SQL or original17 reran here. Export-only native grammar evidence is not Source SQL.

Source S1-S10 and Account SAC1-SAC4 retain separate raw/minimally fact-bound/approved/current results: Source raw17=16/17, raw40=39/40, raw11=9/11, scheduling10/11, returned-model11/11; Account old-schema23=6/17, R1five4/1, d3raw57=56/57/raw72=71/72, post0096raw53=48/53/raw72=67/72, approved/current74. These are attributed histories, not new passing tests, waived failures or counts to add here.

**Final private authority remains UNACCEPTED:** post-body actual scope/purpose/grant/consent/current private egress and real retained-cookie/Vault composition remain required. Raw response fidelity cannot supply them. No successful authority/currentness/context/cookie/Vault/operation substitute was used. Actual cookies, closed HTTP/finite native Response, source and typechecking are distinct evidence.

**Prevented:** native SQL/Auth/RLS/Storage/provider resources/query/start/reset/reuse/adoption, sockets/listeners/server/browser, delivery/deployment/physical cancellation/deletion, remote writes and full centrally reserved npm/Expo/application checks. CA4 stops dependent adapter admission; kernel findings independently stop Source admission. No stopped fixture/process was adopted, queried or restarted.

**Unavailable/unrun here:** strict TypeScript/compiler/configured physical integrated graph; genuine Auth/RPC/least-privilege/concurrency/current cookies/Vault; mounted browser/download/upload/Storage/delivery, visual/accessibility/human, full CI/hosted/release acceptance. Adapter/TypeINPUT5/Parent strict evidence does not accept the kernel. Source formats/upload/private bytes/inspection/full inventory, source-aware account/draft deletion, trusted confirmed-end/renewal/correction/obligation producers, manual never-started deletion and END+12-calendar-month physical cleanup, final disclosure/current-policy approval and Account/A03/A08/scoped-agent integration remain open. All 26 screens, secondary flows and 48 decisions remain incomplete. Guidance/M65 provider refusals remain held, without rerouting.

Only NEW docs/portal-rebuild/research/W7_SOURCE_CREDENTIAL_ADAPTER_SOURCE_R2.md is delivered in the sole report commit. Terminal verification checks all 2212 starting paths, candidate six/fixture 41 bytes/modes, 91 runtime paths, packages/locks, scoped local links and ordinary/staged git diff --check. No production/original-test fix, Root/foreign write or execution, input import, nested task, push/PR/watch/comment/merge/deployment or real client/source/message/permission/funds/order action occurred. Parent's reserved profile 17 and original handoff dirt remain untouched. Report commit/clean terminal status are returned separately to avoid self-reference.
