# W7 shared transport, inventory and notification: independent SOURCE R4

Owner: Kanuj. Review date: 2 November 2026, Chicago. Frozen candidate **bc5651e6b27cd433851a779e57fc02e8f6a433d2**. **CHANGES REQUIRED: NT3/P2 and NT4/P2 remain in the combined notification transport. No Root admission.** This is an independent report-only review, with source and finite synthetic HTTP/Node stream evidence. No production or original test was changed.

## Separate verdicts

| Subject | Specification / completeness | Correctness / quality |
| --- | --- | --- |
| Complete combined generic/cookie/Vault/provider/gateway/notification/inventory source | **FAIL / incomplete for admission.** NT3 violates the post-await private-return contract; NT4 leaves an aborted notification read waiting on its response body. | **CHANGES REQUIRED**, two consolidated P2 findings below. These are bounded source counterexamples, with natural mounted/browser reachability unproved. |
| Original SD1, NT1 and AAS5 vectors | Scoped addressed on the independently repeated original cases, with OLD failures retained. | Scoped PASS for those vectors only. This does not accept the Account feature, notification entry, or current integrated application. |
| Original NT2 and new cleanup cases | Exact original OLD3/4, CURRENT4/4; newer real-cookie READ/WRITE OLD8/14, CURRENT14/14. | Scoped PASS for generic synchronous final-cleanup fencing. The separate facade await boundary still fails NT3. |
| Shared decoder overflow | OLD3/7, CURRENT7/7 on unchanged native-stream tests. | Scoped PASS: prompt `too_large`, observed cancellation rejection and released reader. **Underlying physical cancellation completion is not proved.** |
| Inventory page transport | Current unchanged33/33; source witness raw13/14. | Executed page/negative controls pass. No complete collection, v2 consumer adoption, byte access, Storage, SQL or browser acceptance follows. |
| Full rebuild and release | **Unaccepted / outside this bounded review.** | No genuine Auth/DB/RLS/Storage, provider delivery, mounted browser, financial, CI, visual/human or release PASS. |

The complete D01-D48 and26-screen goal, secondary flows, original95388-byte input and existing business/privacy invariants remain binding. This report is not a reduction to these transport regressions. The old SD1/NT1/AAS5/NT2 FAIL reports remain historical facts.

## NT3 / P2: notification facade returns after its own final await loses relevance, aborts or suspends

Affected frozen source: [notification-request.ts:77-79](https://github.com/KanujVerma/shelv/blob/bc5651e6b27cd433851a779e57fc02e8f6a433d2/apps/portal/src/app/notification-request.ts#L77). Its `current()` deliberately accepts the actual valid offline ApplicationSession boundary, and the continuation checks only that boundary and capabilities. It does not recheck READY, local relevance or the actual caller/lifetime signal before returning the decoded notification value.

The generic bc correction checks its own final private return correctly. That is an earlier async boundary. A queued change can run after that check and before the facade's await continuation. The inventory successor explicitly fences this interval with `privateCurrent()`, `applicable()` and the captured signal; the notification facade does not.

Independent program `current/independent-final-facade.test.mjs` uses the actual ApplicationSession, retained client cookie, native Responses and actual Root notification command/result codecs. No successful operation, authority, currentness or Vault implementation is supplied. Its sole negative hook wraps the first real combined AbortSignal's `removeEventListener`: call the original method unchanged, then queue a microtask. That microtask changes only local applicability, aborts the real caller, suspends the real cookie, ends the real session, or removes actual VIEW, depending on the case. Original command/response/roles/capabilities/clock/timers are otherwise unchanged.

The first six-case version, with an empty valid page, is preserved separately at3/6. The later twelve-case program retains those controls, adds WRITE and uses a nonempty valid READ page with a synthetic event UUID/publication47 and the exact WRITE seen receipt/UUID/CAS. It is **6 pass /6 fail, exit1**, zero skipped/cancelled:

| Change between generic return and facade continuation | READ and WRITE observation |
| --- | --- |
| Live control | Correct value returned; PASS. |
| Local relevance becomes false | Value/own private event metadata or seen receipt still returned; expected503; FAIL twice. |
| Actual caller abort | Value still returned with caller signal aborted; expected503; FAIL twice. |
| Actual cookie suspension | Value still returned while cookie offline and original boundary identical/current; expected503; FAIL twice. |
| Actual session end |401 and no value; PASS. |
| Actual VIEW removal |403 and no value; PASS. |

A bounded attribution replay with only the exact pre-bc generic/body inputs from2c9633d8 also yields6/12. The notification facade blob is identical at07c4 andbc. This is retained combined-source debt, **not a newly introduced bc regression**. No cross-client read, server authorization bypass, actual write commit, natural mounted cleanup callback or production disclosure is established. The notification metadata belongs to the same authorized synthetic session.

Required owner correction: capture the actual composed signal once, fence READY and the deny-only applicability/caller/lifetime state after this await and before private return, and preserve the existing exact original command/UUID/body/CAS,401/403 provenance and uncertain-write recovery. Callback failures must deny; no force-ready/current port or blanket401 suppression. Keep all original generic21 cases plus these independent READ/WRITE late-boundary negatives. Fresh independent combined review is required.

## NT4 / P2: aborted notification success body remains pending

Affected frozen source: [advisor-cookie-session.js:171-180](https://github.com/KanujVerma/shelv/blob/bc5651e6b27cd433851a779e57fc02e8f6a433d2/apps/portal/site/auth/advisor-cookie-session.js#L171). The newly bounded notification reader awaits `reader.read()` without an abort-to-reader-cancel hook. The surrounding timer/controller can abort, but neither the catch nor final cleanup can run until that read settles. This is distinct from NT3's already decoded late return and from the corrected Root overflow-cancellation defect.

`current/independent-body-abort.test.mjs` creates an actual ApplicationSession and notification facade. Its enumerated synthetic endpoint returns a native200 Response with an open native ReadableStream. After real body reading begins, the real caller aborts. At the100ms **observation bound**, the promise is still pending, cancellation count is0 and the cookie is still ready. No production deadline, constructor default or timeout is shortened. The test finally closes only its owned fixture body so the actual request settles503 and all handles terminate.

The same program's actual inventory-facade control promptly settles503 and invokes the body cancellation once. Overall **1/2, exit1**, zero skipped/cancelled. Raw observation precedes the failing predicate. This establishes the source cancellation gap at the supported injected-fetch seam; an ordinary signal-honoring native network fetch may already reject its body, and that browser/Workers reachability was not acquired. No physical stream/OS cancellation-completion claim is made.

Required owner correction: make this notification reader respond to actual cancellation without waiting for an uncooperative body/disposal, observe cancellation rejection, release its reader/listeners and refuse success. Preserve100000-byte/UTF8 bounds, pre-abort received401/403, post-abort local classification and session-generation ownership. Add successful-body, abort, pending/rejected cancellation and known-denial controls without weakening existing assertions or changing production deadlines.

## Whole combined source reviewed and compatibility boundaries

The review inspected the complete generic session; actual ApplicationSession boundary semantics; retained JSON, photo and multipart catches; private WeakMap denial binding; notification and inventory facades; cookie body branches; provider context/deadline handling; serial encrypted SessionVault and final gateway positive parsers; actual canonical notification index/runtime/handler; and inventory command/type/mapper/handler/runtime dependencies. It did not stop semantic review at either finding. It did hold dependent admission, broad compiler/build and mounted acceptance work.

Important retained invariants and qualifications:

- Private denial provenance binds actual session/audience/role/owner/local epoch/local and server generation/CSRF and acknowledged deadlines. It only classifies failure. It does not authorize private success or currentness. Retained photo/multipart consult it before ready-only erasure.
- Provider-local abort cannot manufacture a late401/403 authority event. The original real12000ms NT1 timer replay confirms old401/signedout/revoked versus current503/uncertain/offline/same boundary/active Vault. Genuine current pre-abort401 still retires the session. No deadline was lowered.
- Notification client actions remain own list/seen/status-original-seen. Human advisor delivery reads use VIEW; retry and original-retry status use EDIT. Seen is a CSRF-protected write, with no clinical EDIT/right expansion. Namespace/actor/client/endpoint/RPC selectors and service-worker actions remain rejected before egress. Commands8192 and response100000 are distinct bounds; no claim that every legacy JSON branch is bounded.
- Inventory exposes one page through the exact pinned API, not complete PhotoBasis or byte access. Detached cursor/limit/head and actual client/VIEW binding are required. Browser/provider/gateway inventory success caps remain8192. Existing photo-head4096 and legacy clinical409 remain separate. Current33 includes8192/8193, UTF8 crossing, malformed/private/duplicate/cursor/head, currentness/abort and actual provider-deadline cases.
- The Root decoder's changed overflow branch initiates `reader.cancel().catch(...)`, refuses `too_large` and releases the reader immediately. It does not wait for physical cleanup. Byte counting, exact limit, fatal UTF8 and JSON parsing remain unchanged. All13 source files containing decoder references (12 importers plus the decoder) were inventoried at bothbc and frozen8af, with exact SHA and call-site contexts in `decoder-real-callers.json`: admission handlers/runtime; care; checkins handler/storage; notification handler/runtime/worker; operations handler/runtime/body; plans; shared reviews. Their existing handler size-error and runtime-unavailable mappings were inspected. This is affected-call-site source review, not acceptance of those entire domains, credentials, storage or refused Guidance/M65 work.
- The serial Vault owns the complete operation await. No impossible same-Vault B-before-held-A schedule, forced authority, replacement operation port or response rewriting was used.

Canonical pins were read and their immutable blobs/bytes checked separately. `notifications-entry-source-pin-v1.json` is **26 rows**, canonical transport07c4 plus feature8f9; photo74eff is not a notification target. The notification feature files are not present in the W0 transport branch, as expected. The earlier erroneous photo-as-notification instruction remains historical, not proof for this candidate.

Photo v1 is77 source rows,21 virtual postimages,6 package bindings and276 unique declared edges (306 declarations include30 duplicates). v2 preserves those manifest rows except the adapter successor; closure-node, runtime-input and manifest-row counts remain distinct. The exact v1 adapter is blob7887ec53; v2/bc is7ffa6872. Comparing source rows tobc gives v1 three changed inputs (adapter, generic, decoder), v2 two (generic, decoder); package bindings match. Neither old manifest certifies newbc. W4b906/R6 is v1 only and is not retroactively replayed or corrected. The Root projection has exactlysix authorized runtime postimages; two incompatible native signature maps remain excluded. Four host compiler overlays in the adoption report are **not physical Root compilation** and were not executed here.

## Frozen input, custody and owned diff

Own T3-managed checkout `/Users/kanuj/.t3/worktrees/shelv/t3-960cca79` starts clean at **8af746d197b976972d4b16924155afa8c3b32d44**, with2128 tracked paths. There were no tracked candidate imports and no input-only commits. All execution uses own ignored `.local-artifacts/w7-shared-transport-r4/current/` source materialized from immutable Git. The only reviewer-authored tracked path is this NEW report.

Frozen transport lineage is58c0669d -> canonical07c4 -> inventory74eff/99ded/7658 ->2c9633d8 ->bc5651e6. The six Root producer runtime inputs remain attributed908c0d10 inputs, not W0-authored production. The bc suffix is exactlyfive files: two production changes (generic session, Root body), two new tests, one adoption report. Review scope is the entire42-path delta from58, not that suffix alone. Full delta/path/blob/mode/SHA/size manifest: `candidate-delta.json`, SHA256 **f1d4de2d235f0bb9effe9be950be89c27d3eb4fb0f5f62a1a5afe426df40a92e**. Pre-probe source closure manifest:116 exact Git inputs, zero unresolved local imports, `candidate-closure.json`, SHA256 **4c73c5cd55d69f038314db6e328c2c6f2d0d201d0f7acbaf0a35ff5247104226**. Three later executed Account consumer inputs come only from immutable Git314, separately inventoried; they do not replace candidate paths or grant feature acceptance.

Original normative input remains95388 bytes, SHA256 `c45701f9f54fd2b1dbb09bbd7aa2b9b437e9059aa6032b6f39411fe2e7f6efbd`. The read-only continuation snapshot was100187 bytes, SHA256 `b428b318598df52f12ce3e6ea4ebd350ff9333ee05d9fd8f04a8e845d0c722bc`; that is a different document. Applicable AGENTS, README/GOAL, D01-D48, full desktop specification, implementation contracts, decision addenda, workstreams/status and relevant complete continuation/custody sections govern. Full SD1, NT1, AAS5 and NT2 reports, W0 author responses, original transport/kernel R3 briefs and coordinator inventory/adoption pins were consulted. No stale roster label supplies task identity or authority.

| Original input/pin | Bytes or rows | SHA256 |
| --- | --- | --- |
| Original W0 transport brief |106933 bytes|2f6d06eef295628feaeef8573c8b9324c894ce49102d89c833332ad8add7ff59|
| Notifications kernel R3 brief |109945 bytes|f83ac2628543511d85e36108413fc303009d548676ce9d2fb59e4e72da4ec6bb|
| Canonical notification entry pin |26 rows|4fb96ef11ee15640d92e5ae57ba359079913be687e08e26ba0597d6343f01e31|
| Photo composed v1 |77 source rows|f5a73a62956bb310481a44863d1db9d1308329f4b0a5cf6059ed3b920cf761d1|
| Photo composed v2 |77 source rows|49c1aa973e3a8d407788bcbdcdd494b511a14fa42b40fabd43f0892c78f09cde|
| Root projection |6 runtime postimages|acae84d966e149658349ea3a1cf9065512f543068ec7b68e0de6279474b0a543|
| Generic bc session |9790 bytes|ac597f3e716ac67483e572d7dea34d36eba8d922522c80b193e778667524d1bd|
| Root bc decoder |1027 bytes|19a18c7f2fca1df8518fdd247d80687b8d4b7241a748d509a41650295a01282f|
| Notification facade |5679 bytes|902bd9a1d42450df9ef7b667f3ec065596b9aa709bba1502287d15b395e8a445|
| Inventory successor facade |4128 bytes|e83f8ac6fdd68e6f1cfdc61e051a6412d1cf74e9551d53f1193565ea96723c7f|

Missing dependencies were handled only under the conditional same-lock grant. Both own roots were absent/ignored. Before either `/bin/cp -cR`, package inputs, all four physical own/Parent root+portal lock files, nonsymlink ancestors/roots, same device, literal link inventory/targets, complete byte/mode/kind parity inputs and all91 tracked runtime paths were checked. Own/Parent physical runtime custody was pinned to8af; executed candidate runtime is the separately materialized Git fixture. No generated Parent runtime output was copied. Full own clone parity is43213 root entries and9071 portal entries including roots. Root lock is5c57c9aec9e4585066e032e234d610a77cbffd9a51f82700c158fc37fe01b5c2; portal lock isbc914f3a9c9f24e44f02e3cff2804651147385ea5abda58a064531329ef23203. The third tracked runtime lock and packages were also compared. The sole outside-dependency workspace link remains literal `../session-integration/runtime` and resolves within its own checkout. Root React19.2.3 and portal React19.3.1 remain distinct. No install, dependency/config/flags/package/lock change, shim, foreign generated executable or declaration substitution occurred.

Original probes and only needed executed source/probe inputs were copied into own ignored storage after hash checks. Prior raw records were hashed in place, not recursively archived or executed in foreign worktrees. Local loader bindings relocate only the real own esbuild/TypeScript imports and explicitly selected OLD Git source. Original NT1 executable changes only its one literal cwd assertion; esbuild OLD injection selects the exact pre-NT1 upstream source. V4 AAS5 uses its exact16-input manifest,13 frozen58 inputs plus three verified generic postimages. No authority/currentness/Vault/operation implementation is stubbed as genuine proof.

## Commands, results and preserved failures

Every executed probe uses explicit `/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node`, reportingv22.23.0. The own runner records full argv/cwd/PATH/stdout+stderr/time/true exit in exclusive immutable logs/JSON. It prints TRUE_EXIT before receipt creation; the shell runner itself returning0 is not the test exit. Exact commands and raw SHA values are indexed in `commands-index.json`. In the commands below, cwd is the own ignored `current/` fixture, `N` denotes that exact Node executable and `L` is `--loader ./loader.mjs`; `--import ./deny.mjs` denies ambient global network where used. Every actual fetch boundary is enumerated in-process synthetic HTTP; no listener is started.

| Check and exact program selection | OLD | CURRENT |
| --- | --- | --- |
| `N --experimental-strip-types [L] --test .local-artifacts/nt2-{old,current}/cleanup-relevance.test.mjs` |3/4 exit1, exact2c generic/body|4/4 exit0|
| `N --experimental-strip-types [L] --test tests/portal-cookie-final-return.test.ts tests/concierge-body-cancellation.test.ts` |11/21 exit1 =8/14 cleanup +3/7 stream|21/21 exit0 =14/14 +7/7|
| Original byte-identical SD1 `... --test .local-artifacts/sd1-{old,current}/photo-denial.mjs` |3/5 exit1, exact OLD61 generic three|5/5 exit0|
| Original NT1 `... L --import ./deny.mjs --test .local-artifacts/nt1-{old,current}/provider-deadline.mjs` |Clean2/3 exit1, exact3f4 provider, actual12s|3/3 exit0, actual12s|
| Original AAS5 `... --import ./deny.mjs [L] --test r5-first-lease.test.mjs` |Exact V4 2/4 exit1|4/4 exit0|
| `... --test independent-final-facade.test.mjs` |Pre-bc bounded attribution6/12 exit1|6/12 exit1, NT3|
| `... --test independent-body-abort.test.mjs` |Not rerun as an OLD suite|1/2 exit1, NT4 + inventory control|
| `... L --import ./deny.mjs --test tests/portal-photo-inventory-transport.test.mjs` |Author/historical attempts stay separate|33/33 exit0, new own replay|
| `... L --import ./deny.mjs --test tests/portal-photo-inventory-source.test.mjs` |Original author14/14 remains attributed|**13/14 exit1**, unchanged generic-byte assertion|
| `... --import ./deny.mjs --test tests/portal-cookie-first-lease.test.ts tests/portal-cookie-denial-provenance.test.ts tests/portal-cookie-post-abort.test.mjs tests/portal-notification-transport.test.ts` |Not rerun as an OLD aggregate|49/49 exit0, independent retained negative controls|

These groups overlap and must not be summed into a unique/full-suite total. All completed executions have zero skipped/cancelled test cases. OLD sources are selected by R4_OLD=2c/61/v4/nt1 exactly as recorded in each receipt.

Preparation qualification: the first unused dependency-closure scan overselected retained test fixtures and resolved inline bundle-template imports relative to the test file, reporting43 unresolved entries. Before any behavioral probe, the own ignored scanner was restricted to the required source entries and the literal template roots were bound correctly; the pinned116-input closure has zero unresolved imports. The first generated fixture/manifest was replaced during that setup correction, so no immutable first-manifest claim is made; its original tool output remains in the task timeline. No production, original test, assertion or compiler setting changed. Comparing canonical pins tobc also reports expected path absence for separately owned notification feature/producer SQL/report files; their immutable pin blobs themselves are available and hash-verified.

The first NT1 OLD replay hit EEXIST in the original probe's fixed exclusive observation output before its semantic predicates, after current had written that file. Its2/3 raw remains a **setup failure**, not the reproduced NT1 verdict. The current observation was moved intact to a uniquely named own ignored file; the unchanged OLD program then reran cleanly,2/3 at401 !==503 with signedout/revoked observation. No assertion was filtered or changed.

Historical source/compatibility failures remain distinct: raw280/287,250/256,24/25,37/39 and old head31/32 or later29/32 are not relabelled current green. Approved854 changes only the two header-before-abort timing fixtures with57 original assertions retained; e937 changes one offline-private-return status predicate401 to503;96f8 changes two no-channel admission expectations;86ac changes three import annotation tokens. No fresh AST/compiler certification of those exceptions was performed here. Author retained287/287 and Root35/35 remain attributed, not new R4 executions.

The adoption aggregate's original hang and interruption were read/hash-preserved in place: raw inventory-regressions exit1, stdout SHA2565e86a17369943208643bd26d1a44321699c0a322dbd9f011e174a9b5d80e08d1; separate45s runner diagnostic30 pass/1 cancellation; stop receipt records47-minute pending exact owned runner/child and SIGTERM. That history is not a current cancellation or new33/33 proof. This reviewer adopted no process or resource and did not repeat the hanging OLD aggregate. `historical-adoption-raw-references.json` records exact file hashes.

No source-erasure assertion was skipped, waived, patched or re-labelled14/14. The one current failure is expected from the deliberately changed generic bytes, but still remains an actual nonzero compatibility result. An explicitly approved successor would be a separate input, not a correction authored by this reviewer.

## Runtime, preservation and remaining integration gate

Authoritative taskId, separately forwarded by Parent:

`node:delegated-task:command%3Amcp%3Aafb222dc-28b4-420b-9474-b05bc6eeba89%3Adelegate-task%3Acontinuation-20261102-shared-transport-r4`

Separate backing threadId is `thread:delegated-task:command%3Amcp%3Aafb222dc-28b4-420b-9474-b05bc6eeba89%3Adelegate-task%3Acontinuation-20261102-shared-transport-r4`. No run/ordinal/thread suffix was used as task identity. Parent is9b085ada-435f-48d6-8886-957c1ce3e82d. Initial and final actual self and Parent `t3_thread_configure` reads, with modelSelection omitted, return **codex/gpt-6.1-sol/reasoningEffort=xhigh/serviceTier=default**, full-access/default interaction. Explicit Node22.23.0 was verified initially and finally. No model/config change, fallback or nested delegation occurred.

Final verification checks every initial tracked byte/mode/link and all candidate/probe fingerprints, complete own/Parent dependency parity, report local links/scope, `git diff --check`, and the staged one-file diff before an ordinary report-only commit. No input production commit is delivered. The terminal commit and clean-state receipt are recorded in ignored FINAL-HANDOFF.json to avoid self-reference.

**Integration gate:** parent must assign bounded owner corrections for NT3 and NT4, preserve every prior finding/original case and this report, then commission a NEW complete independent shared review of the corrected immutable manifest. This reviewer neither admits the shared candidate to Root nor accepts its own findings as implementation. Notification entry, Account and photo collection remain separate consumer gates. W4b906/v1/R6 needs explicit successor/v2/current-generic composition; existing compiler overlays do not prove physical Root typechecking.

Prevented after findings: complete dependent startup/retained-channel/notification/feature acceptance, broad compiler/differential and product-build claims. Independently useful historical reproductions, inventory-only controls, negative/error tests and semantic source review continued under the current brief. No full npm/Expo/portal build or CI was run; heavy acceptance remains centrally scheduled. No browser/preview/DOM, native resource, DB/Auth/Storage/socket/server/listener/provider/service/deploy/reset, process adoption, credentials, external messages (other than authorized Parent task updates), remote write/push/PR/comment/watch/merge or real-client/business action occurred. No refused Guidance/M65 review was retried or rerouted.

Still unrun/unaccepted: actual current SQL migrations/pgTAP/effective RLS/ACL/catalog/journal/concurrency, genuine authenticated persistence and least privilege, real private upload/bytes/cleanup, truthful email sink/provider/delivery/webhook reconciliation, ordinary mounted startup/navigation/Back/forms/focus/privacy, approved26-frame/secondary/mobile/visual/a11y/human comparison, full required suites/native/Expo/exact-head CI, historical R1 export lineage, lawful Source lifecycle, financial acceptance, business launch and release authorization. Source/pure/finite HTTP/stream/SSR evidence does not grant any of these.

## Complete42-path candidate delta manifest

All rows below are immutable candidate postimages, mode100644. SHA/byte counts and the full116-input closure remain in the ignored manifests identified above; no row is reviewer-authored production.

| Path | Git blob |
| --- | --- |
| `apps/portal/session-integration/runtime/server/client-policy.ts` | `e7cdbe95987a558d06057c068914f8b8132c0c11` |
| `apps/portal/session-integration/runtime/server/client-upstream.ts` | `7e6c1bfd0c4f6e3cc37c37bae3b295de7e2b4e88` |
| `apps/portal/session-integration/runtime/server/gateway.ts` | `7961851ee3e5a0df77efa2d778d42c2c1ad27a72` |
| `apps/portal/session-integration/runtime/server/policy.ts` | `4fc4dbcd0f14e0dd53abb32f058ad87f23f4bacb` |
| `apps/portal/session-integration/runtime/server/upstream.ts` | `bab157d40d23c419c23b2951911e2f395949e128` |
| `apps/portal/site/auth/advisor-cookie-session.js` | `9af26bfac298bf46a431fb5a79b42bc34ed06772` |
| `apps/portal/site/auth/client-cookie-session.js` | `40511c729ed05fd25942ab99f08c64568e85efd6` |
| `apps/portal/src/app/notification-request.ts` | `9f9c3bfcc148ce13aed816a9cc5ab6e9e71da122` |
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
