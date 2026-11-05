# W7 report-photo upload: independent SOURCE R1

Owner: Kanuj. Review date: 2 November 2026. Candidate implementation **b7733324f7bf7887c0d0b03a6bd949c14d708d10**, author report **b8060362e292007318fe6996f740c078735f503e**, candidate base **8af746d197b976972d4b16924155afa8c3b32d44**. **CHANGES REQUIRED: RPU3/P2. No Root admission.** Only this new report is reviewer-authored tracked work.

## Separate verdicts

**Specification/completeness: FAIL for the complete upload-lifetime source contract.** The exact optional three-method facade, dedicated controller and inert shared-control view are present, but RPU3 breaks the claimed same-boundary retirement-before-abort invariant. C05/C07/App, complete accepted current collection and immutable report attachment remain separately INCOMPLETE / HELD. A staged acknowledgement is not an attached photo, submitted report, product confirmation, actual Start or deletion.

**Correctness/quality: CHANGES REQUIRED, one new P2 finding.** Unchanged supplied tests independently reproduce the frozen physical-8af recipe's **64/65, exit1** and the exact two-retained-JS successor's **65/65, exit0**, including strong TypeScript **151 inputs /0 diagnostics**. Independent adjacent checks are **5 pass /1 fail, exit1** on RPU3. A separate five-case sensitivity suite passes on real source and fails under each isolated negative mutation. Passing single-controller tests do not cover the sibling lifetime counterexample. No broader acceptance follows.

## RPU3 / P2: first controller aborts before another same-boundary preview retires

Affected candidate: `apps/portal/src/features/history/photos/upload/controller.ts:22-30`, especially line29; compare `apps/portal/src/app/report-photo-upload.ts:43-49` and actual `ApplicationSession` boundary invalidation delivery at `apps/portal/src/app/session.ts:98-108`.

The facade deliberately queues its lifetime abort so all same-boundary consumers can synchronously retire previews first. Its controller's `retire()` instead calls `old.controller.abort()` and `port.dispose()` synchronously inside the boundary callback. The latter also aborts the facade lifetime synchronously. `ApplicationSession` delivers the boundary's invalidation Set in registration order. Thus the first controller's request abort callbacks run before a later controller on that same boundary has cleared or revoked its cached preview. Each controller having a dedicated actual port does not prevent this ordering.

Independent reproduction on the unchanged candidate and the two exact bc JS inputs:

1. Restore one actual `ApplicationSession` and retained client cookie through closed synthetic session HTTP. Create actual facade/controller1, then another dedicated actual facade/controller2 on that boundary. No authority/currentness/operation implementation is substituted.
2. Select synthetic PNGs in both controllers. Retain controller2's actual local preview URL without calling its getter in the later observation callback.
3. Start controller1's real retained raw upload, hold its synthetic native Response before return, and attach an observer to the actual fetch AbortSignal. The observer only calls Node's `resolveObjectURL` on controller2's cached URL.
4. Invoke the actual cookie `_end()`. Controller1 logically retires and revokes its own URL, then immediately aborts its request. At this callback, controller2's cached URL still resolves to a **68-byte image/png Blob**. Its bytes equal the exact synthetic PNG.
5. Boundary invalidation subsequently reaches controller2. Both final snapshots are `ended`, and the cached URL is then revoked. The old upload returns no staged receipt.

Raw observation: `{"atAbortBytes":68,"atAbortType":"image/png","finalC1":"ended","finalC2":"ended","finalUrlLive":false}`. Expected at the abort callback: no discoverable sibling preview. Actual: live Blob. The unchanged single-controller control passes; local and shared session ownership are real. The strengthened second run preserves the first failure predicate and adds exact-byte observation, with the same **5/6, exit1** result.

This is a synchronous **local object-URL custody** defect, not proof of a browser DOM leak, genuine Storage disclosure, cross-client access, backend authorization bypass or a new request succeeding after revocation. Both objects belong to the same synthetic session. Ordinary mounted multi-consumer reachability remains unproved; the reusable API accepts this supported two-dedicated-controller composition, with no single-controller-per-boundary restriction.

Required owner correction: ensure boundary-triggered retirement completes synchronous private-state/URL cleanup across the affected feature consumers before abort/dispose/notification effects can observe other old consumers. Preserve immediate logical retirement, guarded later continuations, ordinary cancel/dispose semantics and exact uncertain-intent custody. Cover two dedicated controllers and cached handles, alongside the existing single-controller, throwing/reentrant-observer and no-late-receipt controls. Do not force a getter in the observer to hide a still-live cached URL, weaken the assertion, change shared authority or introduce a general event framework. The author must fix production; a fresh independently allocated review is required afterward. No fix was made here.

## Complete source and specification assessment

All five new production files, both tests, the complete author report, actual retained factory/session/transport, canonical upload classifier/ClientProvider and Root upload producer were inspected. Review continued after RPU3 through the remaining feasible source/history and independent local controls; dependent admission stayed stopped.

- `createClientReportPhotoUpload(actualRuntime)` exposes exactly `isCurrent/upload/dispose`. Its input is exactly immutable Blob, front/left/right, original distinct request/completion UUIDs, expectedRevision and existing OperationOptions. There is no client/actor selector, endpoint, credential, Storage path, report write, attachment, export, status or delete API. The actual retained `createClientPhotoUpload` export is used. The candidate changes none of its existing source.
- Root `concierge-checkins/handler.ts` returns exactly `{revision,photo:{id,angle}}` after reserve/storage/complete. The private parser checks exact keys, safe integer, canonical lowercase UUID, matching captured angle and at least two revision increments, then detaches/freezes both levels. Its bounded returned DTO is not a new pre-decode upload-body bound.
- File/angle/IDs/revision and options are captured before waits. Blob copy, Root signature/type/size/digest validation, actual READY, captured audience/role/owner/boundary/epoch/local+server generation/CSRF, operation token, literal-true relevance and real combined signal are checked around callbacks and awaits and at the facade's later final return. No forced currentness or care-write grant is added.
- The 401 exception is narrowly actual same-owner, same-context, unexpired offline suspension. Real received401/global end remains401 on the frozen successor. Disposal, expiry, owner/role/CSRF/generation replacement cannot satisfy that local503 exception. Physical retained-body classification still has RPU-D1, below.
- Unknown attempted outcomes retain the original immutable file/metadata/both IDs/revision; new IDs or changed bytes are refused, retries are deliberate and exact. Definite errors permit a new deliberate selection. Offline/VIEW restriction hides private display and retains only same-session unresolved/staged custody; owner/boundary loss erases it. Cancellation and finally blocks cannot restore an old receipt. Same-controller throwing/reentrant subscribers and replacement/revoke behavior pass their exercised controls. RPU3 remains the cross-consumer exception.
- The controller captures the actual selected file, owns its dedicated port and cleans local preview URLs. Invalid replacement erases the previous chosen file. The view resets the exact file input before observers, uses shared Field/Input/Select/Button/StatusNotice, requires no photo, creates no nested form and defaults expectedRevision to null. Constructor/SSR performs no upload, UUID or object-URL creation in the exercised current context. Native event/focus/keyboard/browser behavior is not established by SSR.
- A valid upload only stages the acknowledgement. The enclosing accepted collection/current head, care eligibility, immutable report association and refresh after upload remain the coordinator's separate dependencies. Local clearing truthfully says it does not delete uploaded material. No new Source consent, training, retention, export or deletion authority follows.

D12/D20/D32/D39/D40/D46/D48, the full D01-D48 register, all26 approved screens and secondary states remain binding. The review does not narrow the goal to upload test totals. Root/portal AGENTS, personal workflow routing, rebuild README/GOAL/specification/contracts/addenda/workstreams/status/acceptance and the authoritative continuation/custody sections were consulted. Stale roster sections are history, not live ownership.

## Prior findings and evidence remain distinct

| Stable item | Current disposition and limit |
| --- | --- |
| RPU1 /P2 | Exact single-controller cached-preview-before-abort predicate passes here. An isolated early-facade-abort sensitivity mutation makes it fail. Author original RED44/46 (also absent view), later GREEN and raw receipts remain historical. RPU3 shows this closure does not extend to every same-boundary consumer. |
| RPU2 /P2 | Invalid replacement clears old chosen bytes/URL and cannot upload them. Current original test and independent control pass; isolated retirement-bypass mutation fails. Author original RED64/65 remains unchanged. |
| RPU-D1 /P2 | OPEN inherited physical dependency: actual received401 headers plus malformed body/cancellation yields503 on the frozen physical recipe. The same unedited test passes under exactly two retained bc JS replacements. No physical green or runtime admission. |
| NT3/NT4 /P2 | OPEN shared R4 findings, report9a0a37a28e0e13391df4a255bcc62adfaab32f62 onbc5651e6. Notification facade's separate final await loses relevance/abort/READY; notification body read can remain pending after abort. Upload-local guards do not close either. No shared correction or re-review was performed. |
| RP1/RP2/RP3 | Earlier photo-private-return/read-basis/same-photo-denial/controller-ordering FAILs retain their exact original verdicts. R4's scoped lifecycle PASS, type-prerequisite/raw35/36 qualifications, and R5 metadata-only PASS remain separate. Those historical experiments were not rerun or relabeled as new upload proof. |
| R6 /v1 versusv2 | 0b0b7485ee1ec4e123a98aaf7d0444b8c3ce8094 accepts onlyb90646b8's exact v1 consumer projection: approved fact-bound64 plus independent9. Its raw bootstrap/old-suite/History failures remain. It does not accept the later READY facade, current generic/body or C05/C07 composition. |

The original W4 implementation/review briefs, cumulative W4 report throughb906 and complete relevant finding/correction/compatibility sections of R1-R6 and shared R4 govern. Eight report byte hashes, six pins and194 historical top-level raw JSON inputs were checked in place. The new upload author's58 top-level JSON files were separately hashed in place. **Zero foreign raw archives were copied or executed.** Only needed immutable source/probe inputs and own output were materialized.

Original v1 manifest SHA256 `f5a73a62956bb310481a44863d1db9d1308329f4b0a5cf6059ed3b920cf761d1`; v2 `49c1aa973e3a8d407788bcbdcdd494b511a14fa42b40fabd43f0892c78f09cde`; Root projection `acae84d966e149658349ea3a1cf9065512f543068ec7b68e0de6279474b0a543`. All were hash-checked in place. V1 adapter7887ec53 and v2 READY successor7ffa6872 remain different. Neither old manifest accepts the newer generic/body inputs. Six runtime Root targets and the two excluded native signature maps remain distinct. No complete consumer-v2 composition was executed here.

Author raw physical33/36, exit1, remains preserved as `physical-source-v2-7334743e-cffa-4234-baf8-8a8feb3ba5b6.json`, SHA256 `9c4ec9247810e29424ce041063768bb0148d972c324bb3bb076899f061ab8320`. It includes the mistakenly lowercase UUID negative fixture, offline401-versus503 failure and received401-body case; it is not final physical64/65 or successor65/65. The author later corrected the UUID fixture and positioned the known401 cancellation after received headers. Original final-return guard mutation **60/63 exit1 versus real63/63 exit0** remains attributed historical evidence, independently sensitivity-checked below without retroactively changing those counts. No raw/adapted/current test was skipped, filtered, waived or relabeled green.

## Immutable candidate and fixture fingerprint

Supplied `FINAL-HANDOFF.json` was read/hash-checked in place: SHA256 **f74b669f31a8ea2530230362f1cfd89c2f69940da67546165d004455c97cde95**. Exact implementation diff is five NEW production plus two NEW tests; exact report-only suffix adds one NEW report. All eight base preimages are absent; every postimage is mode100644. Complete row-manifest digest: **f34eb906012ff6d1346d62b4d325ca5c7a228ef17d6982c016f5e72b1c9aea3b**.

| Path | Bytes | Git blob | SHA256 |
| --- | ---: | --- | --- |
| `apps/portal/src/app/report-photo-upload.ts` |7571|`1dc2d43ff174475849ab4c9077c5372b3aaf283a`|`2550c3aa15819e615b00a3974ff9df3a68a6df9c35d75b60f49b004cb12b2258`|
| `apps/portal/src/features/history/photos/upload/types.ts` |1432|`05e1193ede245e383de864c61bcd6a0bee7caf17`|`e7b5f34ed9cbb14762bf7f297ee2c64e93821595a6670734dbda61c80a2774d9`|
| `apps/portal/src/features/history/photos/upload/controller.ts` |7979|`f3613dccec88b7c734bec24ae7c6530d0cc56acd`|`b974da361304ba1c5b6c959fb46d4668c785ea8c7806e2c29c88687cc7cbc2f4`|
| `apps/portal/src/features/history/photos/upload/PhotoUpload.tsx` |3386|`fb539f4f18a6c53c95e4da5644bf08c0704b3a5a`|`6274362e73d8c174322ec0efc270d9c975d54a905fface062945504427c7df53`|
| `apps/portal/src/features/history/photos/upload/index.ts` |277|`e9f9124105a87e6c28927ecb99321758946e3f2f`|`a4156204479d649b9e18c873548787d5a547e14af42c9e6233408cf14b28cc53`|
| `apps/portal/tests/rebuild-report-photo-upload-source.test.mjs` |27085|`ac9f4f65448247f7fd5bc080f5234568e534b9e2`|`cd0adf071579fcf416c915394d341dd61155c949c216dbd5bc772564a454d9e3`|
| `apps/portal/tests/rebuild-report-photo-upload-types.test.ts` |1703|`f297feb3f4403b54bde1e16dab77555454499d98`|`0565d445eed08c92eb8fe7abbd55f7ac7272860ce0d54da8b5ff39b48c9dcbf3`|
| `docs/portal-rebuild/research/W4_REPORT_PHOTO_UPLOAD_SOURCE.md` |21295|`35b02155c8869ed0d6dd8f1cea95f85bcdfa3c82`|`021f99f06882c3798a9466315774f9fe096a54acb98f8826e0c59a5605c33200`|

Review checkout: `/Users/kanuj/.t3/worktrees/shelv/t3-64f60826`, branch `t3/review-report-photo-upload`, starting clean HEAD **19b5946e860871deddf3eae762c02bc06fd245e7**. Its09cf/19b suffix is inherited attributed SMTP input/correction only, five unrelated paths, not reviewed/authored upload production or new authority. No candidate/input commit was created here; no production was checked out into tracked paths.

Own ignored evidence root `E=.local-artifacts/review-report-photo-upload-r1`; executed fixture `F=E/fixture`. Exactly74 needed frozen source/config/test/declaration files were materialized from8af plus the seven candidate paths. Every full source input is fingerprinted in `fixture-inputs.json`, SHA256 `f3414da0036d328862e7b938878a4e7790113625cb4462c0aa77f3cb55a2bb45`. Original test bytes and actual compiler settings remain exact. The fixture dependency link targets only this checkout's own verified dependency clone. This ignored fixture's physical-8af recipe is distinct from a claimed modified physical Root application.

Successor adds ONLY these two immutable JS inputs frombc5651e6b27cd433851a779e57fc02e8f6a433d2:

| Path | Git blob | SHA256 |
| --- | --- | --- |
| `apps/portal/site/auth/client-cookie-session.js` |`40511c729ed05fd25942ab99f08c64568e85efd6`|`7d0d8e9d89d51ab7d0221059168d47b9b9c69ff5609c97436fea372ab66f9f3a`|
| `apps/portal/site/auth/advisor-cookie-session.js` |`9af26bfac298bf46a431fb5a79b42bc34ed06772`|`034bd93898ed4895f36f8b4c02e8bf7d830f365ca0ad7de1ea8a246d42161dc5`|

These are read-only input overlays, not authored production or a complete bc gateway/generic/inventory composition. Isolated sensitivity variants have separately named manifests and source hashes; they never replace physical candidate files or supply an accepted correction.

## Commands, exits and evidence

`N=/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node`. From own root, the command wrapper is `python3 E/run.py LABEL N --import /Users/kanuj/.t3/worktrees/shelv/t3-64f60826/.local-artifacts/review-report-photo-upload-r1/deny.mjs --experimental-strip-types --test TEST`. It executes fromF and records exact argv/cwd/input manifest/exit/full stdout/stderr in unique JSON. Global external fetch is denied. All HTTP uses enumerated closed in-process dispatchers; no listener/server was started. Successor/sensitivity runs set `SHELV_REPORT_PHOTO_UPLOAD_INPUT=.local-artifacts/report-photo-upload/NAME.json`; physical recipe omits it.

| TEST underF | Input NAME | Result |
| --- | --- | --- |
| `apps/portal/tests/rebuild-report-photo-upload-source.test.mjs` |physical8af, no overlay|64/65, exit1; RPU-D1|
| same unchanged file |`bc-upload-input`|65/65, exit0|
| strong TS6/negative ABI within same tests |physical and successor|151 inputs,0 diagnostics; strict/noUnchecked/verbatim/skipLibCheck:false and real declarations|
| `apps/portal/tests/independent-upload-r1.test.mjs` |`bc-upload-input`|5/6, exit1; RPU3; first and strengthened exact-byte runs|
| `apps/portal/tests/lifecycle-controls.test.mjs` |`bc-upload-input`|5/5, exit0|
| same unedited five predicates |`early-abort` mutation|4/5, exit1; cached own URL visible at abort|
| same unedited five predicates |`missing-final-guards` mutation|2/5, exit1; all three late return guards fail|
| same unedited five predicates |`invalid-replacement-bypass` mutation|4/5, exit1; old selected URL remains|

The six independent cases cover the single-controller positive control, RPU3, actual relevance reentrancy disposing the port, invalid replacement during revoke observation, cancelled unknown result followed by actual same-owner restore/exact retry, and pre-dispatch relevance failure with zero upload dispatch followed by a fresh allowed intent. The five sensitivity predicates exercise independent single-controller retirement/invalid replacement plus the retained three late-boundary predicates. Mutations are explicit sensitivity controls, not historical OLD source or production fixes.

The supplied actual producer test runs ApplicationSession/cookie/native Response, upload classification, ClientProvider and Root reservation/signature/digest/storage/complete code with **synthetic authentication/RPC/Storage ports**. It does not run gateway/SessionVault or genuine Auth/Storage in that fixture. The lifecycle probe uses actual ApplicationSession/retained cookie/facade/controller and synthetic HTTP only. There is no Root Storage or genuine-service claim.

Own setup failures remain separate: unsupported `diskutil info DIRECTORY` stopped before cloning; corrected mount discovery useddf anddiskutil on the actual APFS mount. The first source-materialization regex encountered a test's embedded root-relative bundle string, then an extensionless import; only the ignored materializer was corrected. One attempted test ran before its deny preload existed (0/1 startup exit1). The first full fixture run was63/65: inherited RPU-D1 plus TS7016 because the materializer omitted the existing real `portal-routes.d.ts`. Adding the exact frozen sibling declarations yields physical64/65 and successor65/65; no new declaration, production/test/flag/package repair occurred. An idempotent mkdir setup error and a historical JSON-list indexing error did not run product behavior. Original raw receipts and all failed outputs that were saved remain retained; these setup outcomes are not product failures or passing acceptance.

Key own immutable raw receipts, relative toE:

| Receipt | Exit | SHA256 |
| --- | ---: | --- |
| `physical65-6b6f2ed3-df0c-49ea-8cfb-55fcd3576f3f.json` |1|`155eb8d684b6a0e0c0a5c4a8c0ee9be7aeda82180876cde76e06db68eb481e06`|
| `bc65-7742f3df-b6c5-45e1-a048-a7cc6d64aa79.json` |0|`993bfaa0aa8612302caf499d98d29adfe38bf806ca3eadb25276cdc5a25516d7`|
| `independent6-strong-7c2d5b30-16b0-48c6-b86f-73893caa6702.json` |1|`9b72080102458cbc48ee60576dd9289c45554f2eeb54091bd0ea5b844384d7ce`|
| `control-bc-upload-input-679aeaa9-373f-4370-9800-ccb8c7f31ee4.json` |0|`8fafaef488ca9066d51dc4acfc70eff1bcaf120b477f059981ed47a1fdddf320`|
| `control-early-abort-317e1034-c0c7-4fb9-ab72-c7a09159ae48.json` |1|`3f9a98033a24064d48b672debd56d131d1fc0252791835a0498b40ff0e100e82`|
| `control-missing-final-guards-79f4a13c-373c-466f-8f22-517d1f1ab648.json` |1|`0ed3dc87b91d4461fd173a1c94e71fe07669b5ac29354513fcb13372f549e094`|
| `control-invalid-replacement-bypass-90183f92-4492-4009-ac56-5f864e37d18e.json` |1|`7cfeb73c3b4ec54a809e9da926268d980eb5d58a7ee971ef4d76b868bff0d237`|

`candidate-manifest.json`, `complete-eight-path-manifest.json`, `fixture-inputs.json`, all bundle/strong input receipts, `historical-verified-in-place.json`, `author-raw-in-place.json`, `upload-author-raw-in-place.json`, dependency inventories and terminal protection/runtime receipts preserve the remaining provenance. The original95388-byte approved input remains SHA256 `c45701f9f54fd2b1dbb09bbd7aa2b9b437e9059aa6032b6f39411fe2e7f6efbd`; continuation100187 bytes remains `b428b318598df52f12ce3e6ea4ebd350ff9333ee05d9fd8f04a8e845d0c722bc`.

## Runtime, dependency custody and report-only diff

Initial and final actual self and parent `t3_thread_configure`, withmodelSelection omitted, return **codex/gpt-6.1-sol/reasoningEffort=xhigh/serviceTier=default**. Parent is9b085ada-435f-48d6-8886-957c1ce3e82d. Initial/final explicit Node isv22.23.0 atN above. No model/config change, fallback, delegation or nested agent occurred. Literal taskId, separately forwarded by parent:

`node:delegated-task:command%3Amcp%3Aafb222dc-28b4-420b-9474-b05bc6eeba89%3Adelegate-task%3Acontinuation-20261102-photo-upload-review-r1`

Own dependencies were absent. Conditional `/bin/cp -cR` copied only own portal node_modules after root/portal/runtime package equality, all four physical own/parent root+portal lock comparisons, third tracked runtime lock, all91 tracked runtime files, nonsymlink roots/ancestors, absent ignored destination, same device/APFS and complete byte/mode/literal-link containment checks. All9070 descendants (9071 entries including root) match before and after tests. The literal workspace link `shelv-advisor-session-candidate -> ../session-integration/runtime` resolves to this checkout's own unchanged runtime. Root dependencies remain absent. Root lock SHA256 `5c57c9aec9e4585066e032e234d610a77cbffd9a51f82700c158fc37fe01b5c2`; portal `bc914f3a9c9f24e44f02e3cff2804651147385ea5abda58a064531329ef23203`. Canonical descendant-inventory digest `b63dad17bc357472f0a5ab4d13be30078ba07489ad62eec5113487a813f1152d`.

All starting tracked files/modes, existing tests, packages/locks/config, SMTP inherited inputs, auth/routes/shared transport/Root/SQL and counterpart work remain exact. Only NEW `docs/portal-rebuild/research/W7_REPORT_PHOTO_UPLOAD_SOURCE_R1.md` is authored/staged/committed. Ignored probes/receipts are own only. No active normal Git hook is bypassed. `git diff --check` and report scope/link checks pass. Final terminal receipt records the sole report commit separately; no cumulative input ancestor belongs in the handoff.

## Prevented checks, unrun gates and next integration action

Negative checks that actually prevented dispatch/return include invalid selectors/type/size/UUID/revision, pre-dispatch relevance rejection, stale owner/boundary/expiry/role/VIEW loss, caller cancellation and facade final-return changes. Exact unknown replay and definite rejection are tested separately. These are observed denials, not claims that required later tests passed.

Dependent upload/Root admission stopped for RPU3 and inherited RPU-D1/shared holds. Broader full graphs/builds were not rerun after the finding. The focused sensitivity checks and feasible remaining semantic review are independent diagnostic work, not resumed acceptance. Native/browser/genuine checks were unrun by explicit scope, not prevented by a test succeeding.

Parent's next gate is an author-owned RPU3 correction and fresh complete independent review carrying every prior finding, raw recipe and exact manifest. Separately resolve/re-review NT3/NT4 and complete current generic/body plus consumer-v2 composition. Then provide the accepted complete current collection/head and parent-owned C05/C07/App attachment integration, with refresh after upload. An old consumer-v1 PASS or this65/65 projection cannot supply those gates.

Still unrun/unaccepted: actual gateway/Vault complete upload composition for this candidate, genuine authenticated persistence/Storage/private egress/retention/deletion, SQL/migration/pgTAP/RLS/ACL/concurrency, native camera, ordinary mounted file events/forms/navigation/focus, exact26-frame/secondary/mobile/visual/a11y/human acceptance, full npm/type/Expo/build graphs, exact-head CI, hosted/provider and release. No native resource/DB/Auth/Storage/socket/listener/server/browser/provider/deploy/reset/process adoption, foreign execution/write, Root import/write, push/PR/comment/watch/merge, real photo/client communication/publication/funds/purchase/fulfillment/permission action occurred. Provider-refused Guidance/M65 was not retried, re-reviewed or rerouted.
