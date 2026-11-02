# W7 combined notification and generic transport: independent SOURCE R3

Owner: Kanuj. Review date: 1 November 2026, Chicago. Report-only review of frozen **07c4ae82def408bf9526f48a48eb987e4506f83e**. **First new material finding NT2/P2: the generic transport returns an already decoded private result after a deliberate cleanup hook makes local relevance false. Dependent acceptance stopped.** This is a retained source-contract gap, not an established new regression, naturally occurring mounted callback, browser disclosure or authority bypass. No fix was authored.

## Separate verdicts

| Subject | Specification / completeness | Correctness / quality |
| --- | --- | --- |
| SD1 photo/multipart denial provenance | Scoped addressed for the unchanged original five cases: OLD61 **3/5**, CURRENT **5/5**. | Scoped PASS for those executed cases only. The older exact58 non-retirement diagnosis remains a distinct historical result. |
| NT1 provider deadline | Scoped addressed for the original three cases: old provider **2/3**, current **3/3**, using the actual unchanged **12,000ms** deadline. | Scoped PASS: timeout-derived Root401 becomes503/uncertain with the owning cookie boundary and active encrypted Vault preserved; genuine pre-abort Root401 still retires them. |
| AAS5 first actual lease | Scoped addressed: exact V4 **2/4**, V5 **4/4**, and full frozen candidate **4/4**, unchanged original predicates. | Scoped PASS for original conflict/base/proposal/UUID custody in those four cases. This is not full Account acceptance. |
| Final generic relevance/private-return fence | **FAIL / NT2.** Initial relevance and cleanup suspension controls pass, but cleanup relevance loss is not checked before the sole return. | **CHANGES REQUIRED / P2 at the supplied source seam.** Current independent program **3/4**, exit1. Bounded OLD61 comparison also fails, distinguishing retained debt from a newly introduced regression. |
| Complete startup/admission, retained-channel and generic/notification matrix | **INCOMPLETE / not admitted.** The first material finding stops remaining suites, compiler and product work. | No complete source-quality, App, Account, notification, genuine, browser, CI or release PASS. |

The scope remains the full actual startup/admission and retained-channel composition, not just the prior fixes. The incomplete verdict is explicit: three corrected reproductions do not establish that larger contract. Prior R1 SD1, combined R2 NT1 and Account R5 AAS5 FAIL reports remain unchanged.

## NT2/P2: final cleanup can revoke relevance without preventing return

Affected target source: [last relevance check](../../../apps/portal/src/transport/session.ts#L115), [callback-capable listener removal](../../../apps/portal/src/transport/session.ts#L120), and [final private-return guard](../../../apps/portal/src/transport/session.ts#L124). The target now checks currentness and abort again after cleanup, but does not call its deny-only applicability guard there.

The independent program restores an actual synthetic ApplicationSession and uses its actual generic transport, retained `clientCookieRequest('payments', ...)`, native Response and canonical Root `mapPaymentViewV2`. The response contains a valid synthetic shipping-address canary. No successful operation/currentness/owner/Auth port is supplied. The real caller AbortController signal has one deliberately instrumented method: its `removeEventListener` wrapper first calls the original method with the original arguments, then changes the local relevance variable from true to false. The caller's unchanged `isApplicable` predicate reads that variable.

All actual cookie/owner/role/epoch/generation/deadline checks remain satisfied. The operation is decoded while relevant. In outer transport cleanup, the wrapper revokes relevance. The new final guard accepts the still-current session and un-aborted controller, then returns the decoded address. Observations are written before assertions.

| Independent case | Actual observation |
| --- | --- |
| Live cleanup control | One actual payment request and Root decode; listener removed once; relevant result returned. PASS. |
| Cleanup suspends actual cookie | Same actual listener removal followed by `cookie.suspend()`;503, no returned private value; same legitimate offline boundary. PASS. |
| Irrelevant before execution |503, zero payment dispatches and zero decoder calls. PASS. |
| Cleanup makes relevance false | **Result and private canary returned; no error; zero applicability checks after cleanup; cookie ready and original boundary current. FAIL.** |

The first current program is **3 pass /1 fail, exit1**, zero skipped/cancelled. It fails at `undefined !== 503`; the prior observation already records the actual returned value's canary. This is final-return fencing debt, not decoding after a denial: the one decode precedes cleanup. No known401/403 was involved and no denial status granted data or currentness.

**Reachability limit:** the `removeEventListener` wrapper is deliberate source fault injection. Native listener removal ordinarily does not itself run application callbacks. This review does not establish that a mounted consumer naturally produces this callback schedule, that a browser exposes private data, or that any client received another client's record. The synthetic request was authorized for its own session. P2 applies to the requested callback/finally/relevance contract and its supplied source seam; it is not a demonstrated server authorization vulnerability or production incident.

For attribution, the unchanged program's live and failing relevance cases were replayed with only the three exact OLD61 generic Git inputs loaded at their own canonical URLs. Clean replay: **1/2, exit1**, same canary return. Source inspection of frozen58 also shows applicability before a return whose `finally` removes the listener afterward. Thus this review does not claim NT2 was introduced by the19 commits or by AAS5. V5's actual generic TS bytes are independently exact to the full candidate except its16-byte notification channel union member, so the omitted final relevance guard is present there too; no separate V5 NT2 runtime execution is claimed.

Parent received NT2 immediately and explicitly confirmed the stop. After that point, work was limited to this bounded old-input attribution, exact source/evidence/runtime/dependency protection and the sole new report. No broader suite, compiler, product build, variant campaign or resource work followed. The source-only [review workflow](/Users/kanuj/.codex/memories/skills/shelv-source-only-independent-review/SKILL.md) and the explicit first-finding instruction govern this stopped verdict.

## Frozen source, ordered imports and prerequisites

Own T3 worktree: `/Users/kanuj/.t3/worktrees/shelv/t3-62b87a5c`, branch `t3/review-notification-transport`. Initially clean at **3bd152a259b7b9b9971caa1546e65f69de12aab9**. Full virtual preflight checked every changed path, old/new blob and mode for all19 ordinary commits in exact `git rev-list --reverse 58c0669d..07c4ae82` order, before mutation. Every separate normal `git cherry-pick -x` then rechecked physical preimages/postimages and exited0, without conflict or manual resolution.

| Frozen author input | Attributed local setup commit |
| --- | --- |
|14fc72890b9a4ca19105c13bd63791c15c53ac7f|33008b41eb2378c5158303351412d21ca10d9a58|
|96f8ee9b3b1e2b8f25a01bbcc2cb23fd343d664c|0442f9227b1c6f265a2ad6b849546672524f95d8|
|e3394bae8eec8a6541187ab2aa90a58a86725901|72d38faf7292d6055ad6eb923ecd568053bf903c|
|766b9f455c4d625ff8e306db3105c81e3c6b6a10|4ca2afb5356552e78ec5cb36c6e6a852925f68cb|
|6bc35b7205436a40eb66292c9c40583f2e816317|c8b100dda20f0ced873db9e04742a7a63cc040a3|
|854ceca9d80a7f2abc5859b6cfc5edec258de0c7|e986caf1f5ab669b01596e748560d5e5df4414a4|
|107e87819a644db038eb071fc62b12109fa221c2|84c5982e1ec395bb141e8210e60c767281838ed1|
|d720521315e7a2ee9f43bc4ffcca15e8c7174ae0|66396eac7462293f0ca1fc51343c7c822073e79e|
|cb30c55c471d59fece0ab38bdd2b754e86e49b17|2fad686498a90e34d1b219411e22feeb9e639c84|
|61bb706f900fca01ab905388a8be439042b98055|7afee89d0b460df8242bd331a814f4a8a0664cdb|
|368979d76256334ad2b0fabc2f4e3656979d29ef|539f99ecf2d5b6279e33fdf3fb621f2750813ac1|
|e937db61dea49b74cae971633b52f488f63d28c2|d1d665a7d7560b9ce05724a6f39cdb84eb45184f|
|3f4cb6716fed9123e2d47949a28144b9a7b55485|32b401b1656d0e7725a2381dbd6c7cb89a0a0a87|
|0597cbafbaef98414829c98ebd3c1d046d5b1718|b9d1fadb92e421544cab8b6f1eefe62d8875c7e7|
|86ac5107ce79156afcd144d433047f90acf4725d|93894080a373ccace6dacac723c493314e8bfad2|
|6e999d07416470074b5a11d343446040ce58550e|ffe64de98ccc0b7ba223049d8759d80ba4dbf68a|
|b3f88ad0101bf65a5b6ca980b0b975fd887408af|d36fbf59e108e955107dab806af51a5b07216222|
|81ab47292b07f00205f6da34dd0626bfd5d42720|0745f2f7f21bc26dd027e78f0d8f74f6c08a37e3|
|07c4ae82def408bf9526f48a48eb987e4506f83e|ab02622f48a32c0e3a56b9229462de164ec9d1f4|

All26 allocated final paths match frozen07c4 blobs/bytes and mode100644. They comprise eight existing production transport paths, two new production paths, four approved existing test paths, eleven new tests/types/masks and the author report. `ordered-import-preflight.json`, `import-results.json` and `frozen-candidate-postimages.json` preserve the complete path/blob/mode/SHA lists. No input ancestors are reviewer delivery. **Parent imports only this new report's final commit, excluding all19 setup commits.**

Own base already contains the three attributed Parent4e prerequisites, unchanged throughout:

| Path | Exact base/current Git blob |
| --- | --- |
|apps/portal/src/app/retained.ts|9267598f1acf848668196e20e373cb7403bed1a0|
|tests/concierge-checkin-replies-native.test.ts|c370843bd2ff53506702e27efe473af136228c29|
|tests/concierge-checkins-sql.test.ts|27e1075724276f33ce6120f335edd9fa52f4fbc4|

W0's newer physical PHOTO INVENTORY work, including its separately allocated checkpoint74eff, was never read/imported as candidate production. Frozen source comes from target Git objects. Later Parent CI prerequisite advances are not new review inputs.

## Exact dependency and original-probe custody

V5 was independently verified before execution: **16 ordered runtime inputs,13 exact frozen58 inputs plus three generic postimages**. Paths, baseline/postimage Git hashes, SHA256, bytes, modes and physical ignored artifacts match. Both checked patch application and actual application to a fresh own ignored exact58 prefix exited0; all16 outputs read back exactly. No notification substitution or inferred runtime input was supplied.

| Pinned V5 input | SHA256 |
| --- | --- |
|full-runtime-manifest.json|809c01ac427fc2f23bc09c1d172b769edd99241b421ec67796fe48d800f816f4|
|generic-only-58-v5.patch|cf3894c79c457ba190f4b39c9de386e519c8f4ca7d8abf4cd7b89c621e1d583f|
|composed-proofs.json|eb321b191339291957a50728dc2769cf0967eccdcddd4b7c4435458050b912fe|
|Generic transport TS|b609c022792c677f32c1ceef6d42047ffb99a775447beb3055c86ed3d30db62e|
|Generic advisor cookie JS|df07a5119c3e586ea9a8624e7ee3b8c58473ca57493b4eb64ac63ea89fd5fc3d|
|Generic client cookie JS|c296beff93369e95541145f9dd8a8b19bc5cf8ccad252c7ab272d2402e427472|

All four index-referenced producer proof files match their declared SHA values. Their18/20-input fresh compiled programs,42-delay sweep,50+19 Account cases and4 first-lease compiled cases remain **attributed author evidence**, not programs executed by this review. Exact Git314 Account facade/controller/model and required consumer inputs were extracted into own ignored storage. Their source69 is **50+19, not70**. No physical Account edits or frozen W2 Git5e49/original2ce consumer production was substituted. W2's59/43 replay is held, not certified from its author's counts.

SD1's original4275-byte five-case program is byte-identical, SHA256 `bed862d3d65e6eab752d388548fee315364deb049adafaea20c62b241ce1652a`. Its OLD61 loader supplies only the exact three generic Git inputs; all remaining modules are own frozen source. Current loads actual own candidate files.

NT1's original9953-byte program remains SHA256 `628097e74a347cdd4db3d560cd77663d9a2ae3ba3650cd8d0d0ecbd18822758f`. The own executable changes only one literal worktree assertion, SHA256 `a87a53b96deb176332c46bff04d04c195fba74d0f5982d055e8bdf2e592075f4`. OLD supplies exact pre-NT1 Git3f4 upstream through an own esbuild input plugin; CURRENT uses the actual frozen candidate. The plugin changes source input only, not provider/Vault/currentness ports, statuses, timeouts, bodies or assertions. Both execute actual cookie/gateway/real encrypted SessionVault/provider/canonical index/Root handler/runtime with enumerated finite HTTP. Actual provider abort releases the held RPC; ordinary signal-honoring network reachability is not established. OLD elapsed12,008ms:401, signedout, revoked Vault. CURRENT elapsed12,007ms:503/uncertain, offline same current boundary, active Vault. Both preserve the original positive canonical receipt and genuine pre-abort401 controls.

AAS5's original4500-byte four-case program is byte-identical, SHA256 `4296f63dad04396d9077ef1c94b6cdb02cdf372883169e04cca5e2195b663ec9`. Its original relative import depth remains intact. An own loader binds exact Git314 consumer source to the explicitly selected own V4, V5 or full candidate runtime. Negative timing holds call the original `cookie.acquire()` and hold its genuinely returned lease; no positive lease/currentness replacement is supplied. Both sibling503 failures on V4 end the controller, while V5/current retain identical pending/base/local custody and keep reapply disabled until a fresh basis. No SQL or actual confirmation write occurred.

## Results, stopped checks and evidence limits

Ignored evidence home: `/Users/kanuj/.t3/worktrees/shelv/t3-62b87a5c/.local-artifacts/w7-notification-transport-r3/`. Each executed command has expanded executable/argv/cwd/PATH, full combined stdout/stderr, timestamps, elapsed time, true exit and SHA. The runner prints `TRUE_EXIT` before exclusive unique immutable0444 raw/receipt files. `commands-index.json` indexes the executions; final protection/commit receipts are additional files.

| Fresh execution | Result |
| --- | --- |
|Full19-input virtual preflight / ordered imports|All0;26 exact candidate paths, no conflicts|
|Dependency preflight, APFS copies, full parity|0 before imports/probes using dependencies|
|SD1 unchanged OLD61 / CURRENT|3/5 exit1 /5/5 exit0|
|NT1 original old-provider / CURRENT|2/3 exit1 /3/3 exit0; actual12s timer|
|AAS5 original V4 / V5 / full candidate|2/4 exit1 /4/4 exit0 /4/4 exit0|
|Independent NT2 controls / counterexample|3/4 exit1|
|Bounded OLD61 NT2 attribution, clean replay|1/2 exit1; same retained gap|
|Protected source/config/locks/dependencies/old SQL|exit0; exact counts below|

Historical author raw280/287,250/256,24/25,37/39 and full-head31/32 remain distinct from approved/current287/287,256/256,25/25 and39/39. They were not rerun or relabelled in R3. The exact approved exceptions were imported and inspected separately:96f8's two no-channel expectations/wording;854's two fixtures expanded over six timings with57 assertion texts/titles/budgets retained; e937's single offline-private-return401-to503 expectation;86ac's exactly three import annotation tokens. Their full diffs/preimages remain preserved. No new AST assertion audit or emit comparison was executed after NT2, and no old test was edited by this reviewer.

The historical full-head whole-AST31/32 qualification remains. The tracked generic3f4 namespace witness and ignored V5 successor also remain distinct. R3 did not run them or certify all nonnotification/nongeneric executable nodes as erased to58. Author strong223 zero and Workers44 baseline/current with zero introduced diagnostics remain attributed. **No actual R3 Root app/test typegraph, dedicated strong graph, configured frontend/session compiler or Workers differential ran.** Own actual declarations were available, but their existence is not compiler proof; Parent's existing three prerequisites are not credited as new reviewer corrections.

Held after NT2: complete startup/admission and retained-channel matrix, generic known-denial/deadline/callback/cleanup/reentry/decoder/private-return variants, full notification matrix, exact Account50+19 source/fresh compiled18/20 graphs and42 timing race, frozen W259/original43, retained original/approved/current287/256/foundation25, kernel39, source87, namespace/graph masks, Root app/test/strong223/Workers44 graphs, frontend/session types, UI guard and main write:false build. The two finite-HTTP NT1 harness bundles were built write:false before NT2 solely to execute that original reproduction; they are not a product build or mounted App proof.

Preparation qualifications are preserved separately: V4's manifest contains13 baseline inputs whose physical copies are not under its three-postimage artifact directory; an initial setup read assumed otherwise. A second setup read attempted `git cat-file` for a computed, unstored generic projection blob. The corrected setup checks the explicitly pinned artifact bytes with `git hash-object --stdin`, SHA/size/mode and checked patch application. Both setup exits1 remain raw, not product findings. The first bounded OLD61 NT2 comparison also hit EEXIST in its after-hook after producing the expected retained-gap observation; the current original observation was preserved by renaming, then the unchanged two-case program reran cleanly. Its first raw includes one product assertion failure plus that separate hook failure. Existing Node typeless-package warnings remain unsuppressed.

Read the full supplied original task, actual approved input/D01-D48/specification/manifest, instructions, rebuild entry/contracts/workstreams/status/addenda, cumulative target author report and named prior R1/R2/R5 reports. The supplied original task file is106,933 UTF8 bytes,106,875 Unicode characters including its final LF,106,874 before that LF; SHA256 `2f6d06eef295628feaeef8573c8b9324c894ce49102d89c833332ad8add7ff59`. Original approved95,388 bytes remain SHA256 `c45701f9f54fd2b1dbb09bbd7aa2b9b437e9059aa6032b6f39411fe2e7f6efbd`. Full target author report60,660 bytes is SHA256 `087bee910f5b30c99517cf815dd439c7ee7808fa75601ceb5f2c19402f74634d`. Old report/raw qualifications and author responses are not acceptance counts. Some initial combined context/tool-metadata displays were truncated; narrower reads completed the named report/specification material. No recursive historical evidence/dependency archive was copied.

## Runtime, protection and sole deliverable

Authoritative returned taskId, forwarded separately and then read verbatim from Parent's retained `refill-20261102.json` records[3].task:

`node:delegated-task:command%3Amcp%3Afab56c32-51e9-4c25-a214-3043797a2822%3Adelegate-task%3Aportal-rebuild-w7-combined-notification-transport-source-review-20261102-r3`

Separate backing childThreadId:

`thread:delegated-task:command%3Amcp%3Afab56c32-51e9-4c25-a214-3043797a2822%3Adelegate-task%3Aportal-rebuild-w7-combined-notification-transport-source-review-20261102-r3`

Separate actual childRunId:

`run:thread:thread%3Adelegated-task%3Acommand%253Amcp%253Afab56c32-51e9-4c25-a214-3043797a2822%253Adelegate-task%253Aportal-rebuild-w7-combined-notification-transport-source-review-20261102-r3:ordinal:1`

Live self lineage identifies actual Parent `d632030a-18f7-4dec-a2c9-f5c0418c3fd5`; the capabilities caller field is not used as genealogy. Initial/final LIVE self and Parent configuration plus catalog/descriptors verify **codex/gpt-6.1-sol/reasoningEffort=xhigh/serviceTier=default**, full-access/default interaction. Project `ac0af19d-d404-4f53-a870-02bfd76c2a80` saved defaultModelSelection is separately null. Own/Parent project config and all eight role byte/mode pins match; no model/config change or nested task occurred. Initial/final explicit `/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node` is **v22.23.0**, set before imports and every probe, with its directory prefixed on child PATH. No ambient Node or foreign executable was used.

Both own dependency roots were initially absent/ignored. Before either `/bin/cp -cR`, all four root/portal locks, packages, nonsymlink ancestors/roots, same device, full source byte/mode/kind/literal-link inventories and all91 own frozen runtime inputs passed. The sole outside-dependency workspace link is literal `../session-integration/runtime`, resolving to the own frozen tracked runtime. Parent generated runtime files were not copied. Complete before-probe and final parity is43,213 root entries /9,071 portal entries, including roots, against the same Parent source inventories. Root React19.2.3 and portal React19.3.1 remain distinct. No install, shim, flag reduction, Auth state or foreign/generated runtime copy occurred. Four locks remain root `5c57c9aec9e4585066e032e234d610a77cbffd9a51f82700c158fc37fe01b5c2` and portal `bc914f3a9c9f24e44f02e3cff2804651147385ea5abda58a064531329ef23203` for each checkout.

Final protected-state check preserves **2,056 of2,068 initial tracked paths outside the12 explicitly changed existing candidate paths**, with14 attributed candidate additions. All26 candidate postimages remain exact07c4. All64 migrations/117 SQL files are unchanged; all original113 SQL files including old62 migrations also match d412 byte-for-byte. Notification migration remains SHA256 `408b860074abb18a1c1452bd6d08af8009db7fb48e0d01476abd608932d2b684`, canonical notification pgTAP `f66cf297604ab78c5aede7a659582fff326e2a7e2d673a8c9fb3f1ce87c99621`; neither was executed. Root contracts/handlers/kernel/worker/sink, SDKs, App/routes/features, old unrelated tests, packages/locks/config and prerequisites are protected. Ordinary Git found no hooksPath override or active hook; no hook was bypassed. The new R3 report is the only reviewer-authored tracked path. Link/scope/whitespace checks precede the normal report-only commit; ignored FINAL-HANDOFF records actual terminal SHA and clean state without self-reference.

Key independent evidence hashes:

| Artifact | SHA256 |
| --- | --- |
|cleanup-relevance.test.mjs|60b0eade436e3ee16c28c9ef8e150d97649522b2b45c11a852501d2d21fc4a97|
|cleanup-relevance-current-observations.json|7545d453af82127ec2182a529f74aca1886d1d5fdfd4369df1b677beb79916dd|
|First current NT2 immutable raw|3d956ab86a33b092e49db02357acadb6abee6d6b03735a2f2849f6f3332f486d|
|Clean bounded OLD61 NT2 immutable raw|fbabfbea34ed8100b74d45954e3bb2561b9fbd1dd2af95184ac7fa4d2ed8fa8b|
|NT1 OLD immutable raw|5e88ee0e76f254d8f95438fee65a6debbf4d66864d5f0cc7af8efe08708eecab|
|NT1 CURRENT immutable raw|57a59c881e30ab21975126ee83d3e9deda417d0dd39018668226a351482d4cdd|

All finite command handles reached terminal exits; actual sessions and held leases were disposed/released. External global fetch is denied before probe imports; only enumerated in-process synthetic HTTP is used, with no listener. No browser/preview/DOM/process inventory, native/SQL/DB/Auth/Storage/provider service, credentials, CLI resource, blocked Guidance/M65 retry/rephrase/reroute, external write/push/PR/merge/deploy, real client/publication/message/funds/order/fulfillment or permission action occurred. Only authorized coordinator task messages were sent. No SourceReady or full-goal claim follows this report. SQL/genuine persistence/permissions, mounted notification/Account startup, provider delivery/webhooks, browser/visual/accessibility, full suites/Expo/native, exact-head CI, human/business and release remain unaccepted.
