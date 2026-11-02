# W7 complete shared transport, inventory and notifications: independent SOURCE R6

Owner: Kanuj. Review date: 2 November 2026, Chicago. Exact frozen candidate **a90b9ef5290953acfc24a159b78ab6758bb109e7**. **CHANGES REQUIRED: NT7/P2, inherited recursive retirement notification. No combined Root admission.** This independent review authors no production or tracked test fix. The only tracked deliverable is this NEW report.

## Separate verdicts

| Subject | Specification / completeness | Correctness / quality |
| --- | --- | --- |
| Complete combined ApplicationSession/generic/cookie/provider/Vault/gateway/notification/inventory source | **FAIL for admission.** Required reentrant observer completion remains incomplete. | **CHANGES REQUIRED: NT7/P2** below. Full feasible semantic/original review continued; dependent product admission remains held. |
| NT5 retirement correction | Original OLD1/4 -> CURRENT4/4; expanded OLD1/6 -> CURRENT6/6. | Scoped addressed: original throwing-observer/logout/disposal/private-memory predicates pass. NT7 is a separate inherited reentrance defect. |
| NT6 gateway overflow correction | Original OLD1/4 -> CURRENT4/4; expanded OLD3/7 -> CURRENT7/7. | Scoped PASS: prompt413, UTF8/exact byte boundaries, negative Vault controls. Cancellation completion is unproved. |
| SD1 / NT1 / AAS5 / NT2 / decoder / NT3 / NT4 | Original failing selections reproduced; current predicates pass with qualifications below. | Scoped addressed. No Account, entry, photo complete-collection or mounted-product acceptance. |
| Inventory page transport | Unchanged33/33; unchanged preservation witness **12/14, exit1**. | Page semantics/negative controls pass. R5's explicit stale-premise disposition is retained; no waiver, filtered witness or14/14 claim. |
| Physical static graphs | Actual app/test/frontend/session typechecks exit0; strong2/2. | Compiler evidence only. Separate Workers differential remains44 baseline/44 current/0 introduced, not a clean standalone Workers graph. |
| Full approved rebuild / release | **Incomplete and unaccepted.** All26 screens, all D01-D48, secondary flows and later founder addenda remain binding. | No Root mount, genuine Auth/SQL/RLS/Storage/delivery, browser/visual/human, full-suite/exact-head CI or release PASS. |

This is the same approved rebuild, not a scope reset. The original95,388-byte approval and complete100,187-byte continuation were read/hash-verified separately. Source/pure/finite synthetic HTTP/native Node streams/static compilation are separate proof levels. Published Root b86b8ae and its reported three green checks/hosted review do not certify a90 or this report's source counterexample.

## NT7 / P2: a retirement observer's ordinary memory read recursively notifies itself

Affected source: [generic invalidation and sessionChanged](../../../apps/portal/src/transport/session.ts#L42), especially lines49-53, and [memory.get](../../../apps/portal/src/transport/session.ts#L146). The new App hook retires private state before observers, and exceptions are now isolated. However, `sessionChanged()` still calls `invalidate()` on **every** access while identity is null or status is signedout, even after its cached generation/owner have already been updated. `memory.get()` calls that function before reading the cleared map. `invalidate()` then synchronously calls the same still-subscribed observer.

A supported `subscribeInvalidation` callback that merely reads `transport.memory.get('private')` therefore enters this cycle:

`observer -> memory.get -> sessionChanged(signedout) -> invalidate -> same observer`.

This is not a callback explicitly calling itself, a fabricated currentness result, a successful operation/authority stub, or a production memory replacement. The own probe constructs actual ApplicationSession and retained client cookie, restores through enumerated native Response HTTP, subscribes through the public API, sets one synthetic memory marker, and calls actual signOut. Its fetcher accepts only `/api/client/session` and `/api/client/logout`. No server/listener or native resource exists.

| Own observation | Actual result |
| --- | --- |
| Guarded callback, CURRENT | Reentered synchronously; seen3 with two completed outer reads, snapshot null, cleared memory, canonical logout reached. **0/1, exit1** at the no-reentry predicate. The guard records the negative event and returns only on recursion; it grants no authority. |
| SAME guarded callback, exact preceding24d App/generic selection | Same reentry and logout observation; **0/1, exit1**. |
| Unguarded ordinary memory-reading callback, CURRENT | **1,471 callback entries**,1,470 completed reads, logout reached; **0/1, exit1**. That count is this Node run's observation, not a production bound. |
| Additional error observation around the unchanged actual read | **RangeError** caught from one read and rethrown to the existing production observer isolation;1,471 entries/1,470 completions, logout reached; **0/1, exit1**. No alternative memory/currentness implementation is installed. |

The guard-free run establishes actual stack exhaustion and interruption of one callback continuation, not only redundant bookkeeping. Isolating exceptions prevents the old NT5 logout interruption, but does not make this recursive notification safe. A subscriber cannot reliably inspect already-cleared memory during the signed-out retirement phase without this storm.

**Attribution:** the complete `sessionChanged` block and memory getter are byte-identical at58c0669d,07c4ae82,2c9633d8,bc5651e6,24d343c3 and a90b9ef5. Block SHA256 is `b129b43158eed12c6aec7e9577b668fe58c830537aab08b05d486b91e7bc1e17`; full immutable source selections are in `nt7-attribution.json`. This is inherited combined-source debt, **not an a90 regression**. The earlier guarded command labelled `reentrant-retirement-old24d` accidentally omitted its OLD environment selection and is explicitly another CURRENT run; only `reentrant-retirement-exact-old24d` supplies the asserted old result.

**Reachability and impact limits:** this is a real public source seam under a deliberately installed observer. The actual current `app/ports.ts` transport subscriber clears permission/selection state and does not perform this memory read. No naturally mounted memory-reading subscriber, browser exploit, private-data leak, cross-client access, genuine server-session survival or production incident is established. The original marker is cleared, and canonical logout still reaches its endpoint in every CURRENT observation. Severity concerns the required reentrant retirement/observer-completion contract and stack exhaustion, not a claim of failed logout or regained authority.

Parent owns the correction. Make retirement notification idempotent for an already-retired binding and safe against synchronous reentry, while preserving cleanup for genuinely distinct later contexts. Reading cleared memory must not restart the same invalidation cycle. Preserve captured request/observer ownership, exception isolation, fencing before abort, replacementB, real401/403, uncertainty and original UUID/body/CAS. Retain both guarded and unguarded controls plus every original NT5/NT6 case. No new generic framework or authority shortcut is required by this finding. This reviewer makes no fix or successor witness.

## Corrected original vectors and additional independent controls

NT5 now clears generic memory/captures pending work before its denial-only App `drop` hook. App drop nulls capture/snapshot, clears captured private memory, and isolates each captured boundary observer before transport abort/observer effects. Snapshot publication stops once a callback supersedes that publication. Disposal sets its fence first; actual retained canonical signOut is still reached. The default one-argument generic constructor remains valid. These changes close the original four predicates and six-case expansion, without closing NT7.

NT6's actual gateway `readBounded` requests cancellation and observes rejection without awaiting acknowledgement, then preserves413/too_large and releases its reader. Original resolved/pending/rejected/throwing cancellation cases all pass. Expanded exact8192 valid command reaches only the deliberately throwing negative Vault dispatch; exact8192 UTF8 non-command reaches400 after the reader;8193 UTF8 bytes refuses413 despite rejected cancellation, with zero Vault dispatches. No successful Vault/authority port is substituted. The100ms race is an observation bound, not a changed production deadline. No physical cancellation-completion claim follows.

Four NEW independent actual-App controls pass4/4: reentrant snapshot supersession plus a throwing subscriber stops the obsolete publication; reentrant/repeated disposal retires once with cleared private state; held notification READ and WRITE cannot privately return A after an actual restore replaces A with B. The held source returns its native success after release, while actual cookie/transport/facade fences return401, leave B current, and expose no A marker. Only finite session/notification URLs are enumerated; no positive authority/currentness implementation is supplied.

The complete semantic pass inspected generic acquisition, pre-invoke/relevance, decoding, error classification, finally and sole private return; App offline-boundary versus READY semantics; retained JSON/photo/multipart catches; private WeakMap denial origin; both creation-bound facades; actual providers/context/deadline/body handling; serial encrypted Vault and worker post-alarm egress; gateway positive parsing; canonical notification entry/runtime/handler/codecs; inventory command/type/mapper/handler/runtime; and the Root decoder's actual consumers. No additional material finding was established in that feasible pass.

- Current real received401 still retires its captured session;403 remains denied across the same valid offline boundary. Provenance is private, exact-session/audience/role/owner/epoch/local+server generation/CSRF/deadline-bound, and failure-classification-only. It grants no success or currentness. Post-abort status cannot retire B.
- NT1 retains the actual12000ms provider deadline and actual aborted canonical Root return. Timeout-derived401 becomes503/uncertain with offline same current boundary/active Vault; genuine pre-abort401 still retires cookie/Vault. No timer/status/body rewriting or impossible same-VaultB-before-heldA ordering is used.
- NT2/NT3 recheck actual caller/lifetime signal, literal deny-only relevance, captured binding and READY after their respective final awaits/cleanup. WRITE recovery retains the detached original command/UUID/target/CAS. Local false/throw/abort/suspension remains503; actual ended/capability loss remains401/403.
- NT4 responds to notification body cancellation, requests cancellation once, and finalizes listener removal/reader release independently.100000 response bytes and fatal UTF8 remain. The Root decoder's independent size refusal and gateway refusal are distinct implementations and proofs.
- Client notifications remain own list/seen/status-original-seen; human deliveries need VIEW, retry/status-original-retry need EDIT. Seen bookkeeping requires CSRF without clinical EDIT. Task/service actions and actor/client/RPC/endpoint selectors reject before egress. Commands8192 and response100000 remain distinct.
- Inventory is exactly one immutable page, not complete PhotoBasis, current upload acknowledgement or private byte access. Cursor/limit/head are detached before waits; own-client/VIEW and final READY fences remain. Inventory8192, head4096 and legacy clinical409 stay distinct. Constructor parameters/default forwarding remain unchanged. Current33 includes byte boundaries/UTF8/malformed/private/duplicates/order/cursor/head, abort/currentness and the real provider deadline.
- The changed Root decoder's13 referencing source files (12 importers plus decoder) were inventoried with exact SHA and call contexts: admission handler/runtime, care, checkins handler/storage, notification handler/runtime/worker, operations handler/runtime/body, plans and shared reviews. Their error mappings were inspected. This is affected-call-site review, not acceptance of whole domains, private egress, upload cleanup, or refused Guidance/M65 lanes. Other retained cancellation waits are not certified by these two corrected readers.

## Fresh execution matrix and true exits

Evidence home: own ignored `.local-artifacts/w7-shared-transport-r6/`. `run.py` records expanded executable/argv/cwd/PATH/OLD selector, timestamps/elapsed, stdout+stderr, SHA and **true test exit** in unique0444 raw logs; its own shell exit is not the test exit. `commands-index.json` and `semantic-case-matrices.json` retain every execution/case, including setup failures. Counts overlap and must not be summed. Every completed behavioral group has zero skipped/cancelled cases.

Here `N` is exactly `/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node`, `S` is `--experimental-strip-types`, `L` is `--loader ./loader.mjs`, and `D` is `--import ./deny.mjs`. Bracketed loader is used in own fixture replays; physical runs use actual own checkout sources. Full argv/cwd is in each receipt, not inferred from these abbreviations.

| Program selection after N | Exact OLD selection | OLD result | CURRENT result |
| --- | --- | --- | --- |
| `S L --test independent-observer-retirement.test.mjs` |24d App/generic |1/4 exit1|4/4 exit0|
| `S L --test independent-gateway-overflow.test.mjs` |24d policy through source-input esbuild plugin |1/4 exit1|4/4 exit0|
| `S L --test tests/portal-cookie-observer-retirement.test.mjs` |24d App/generic |1/6 exit1|6/6 exit0|
| `S L --test tests/portal-notification-gateway-overflow.test.mjs` |24d policy |3/7 exit1|7/7 exit0|
| `S L D --test independent-final-facade.test.mjs` |bc notification/cookie |6/12 exit1|12/12 exit0|
| `S L D --test independent-body-abort.test.mjs` |bc notification/cookie |1/2 exit1|2/2 exit0|
| `S [L D] --test tests/portal-notification-final-return.test.mjs tests/portal-notification-body-abort.test.mjs` |bc |7/17 exit1 =6/12+1/5|17/17 within physical30 exit0 =12/12+5/5|
| `S L D --test .local-artifacts/sd1-{old,current}/photo-denial.mjs` |exact61 three generic inputs |3/5 exit1|5/5 exit0|
| `S L D --test .local-artifacts/nt1-{old,current-fresh}/provider-deadline.mjs` |exact pre-NT1 upstream in own build |2/3 exit1, real12s|3/3 exit0, real12s, output-only qualification below|
| `S L D --test r5-first-lease.test.mjs` |exact16-input V4 selection |2/4 exit1|4/4 exit0|
| `S L D --test .local-artifacts/nt2-{old,current}/cleanup-relevance.test.mjs` |2c generic/body |3/4 exit1|4/4 exit0|
| `S [L D] --test tests/portal-cookie-final-return.test.ts tests/concierge-body-cancellation.test.ts` |2c generic/body |11/21 exit1 =8/14+3/7|21/21 within physical70 exit0 =14/14+7/7|
| `S L D --test tests/portal-photo-inventory-transport.test.mjs` |Historical OLDs separately retained |Not relabelled|33/33 exit0|
| `S L D --test tests/portal-photo-inventory-source.test.mjs` |Earlier author14/14 and bc13/14 remain distinct |Not rerun as current green|**12/14 exit1**|

Physical current checks, all actual own sources/declarations:

| Exact selection / scope | Observed result |
| --- | --- |
| NT3/NT4/NT5/NT6 four named physical files |30/30, exit0|
| First-lease, denial-provenance, post-abort, notification-transport, final-return and decoder six named files |70/70, exit0|
| `tests/portal-notification-{closed-http,provider-deadline,authority-status,session}.test.*`, all four existing physical files |52/52, exit0, including real12s|
| App/session/state/ports/render/start/callback/care/continuation/preview/foundation/cookie twelve named files |184/184, exit0|
| Entry lifetime/source/reentrant three named files |23/23, exit0. Separate entry R2 c3689867 remains a scoped dependency, not shared acceptance. |
| `N node_modules/typescript/bin/tsc -p tsconfig.json --noEmit` |exit0|
| `N node_modules/typescript/bin/tsc -p tsconfig.tests.json --noEmit` |exit0|
| `N apps/portal/node_modules/typescript/bin/tsc -p apps/portal/tsconfig.frontend.json` |exit0|
| `N apps/portal/node_modules/typescript/bin/tsc -p apps/portal/session-integration/runtime/tsconfig.json` |exit0|
| `N --test tests/portal-notification-strong.test.mjs` |2/2, exit0; adapter clean, separate Workers44/44/0 introduced|
| Own `independent-retirement-controls.test.mjs` |4/4, exit0|
| Guarded current/exact24d and unguarded/error-observation NT7 probes |0/1 each, exit1; no skips/cancels|

The separate physical input inventory uses unchanged parsed options and actual installed TypeScript6.0.3 source/declarations, no CompilerHost source override: app1651/test1033/frontend259/session127 files. This captures graph membership, not another claim of behavioral acceptance. The four diagnostic typechecks above are distinct real executions. Static graphs remained feasible independently after NT7; they do not accept its behavior. Parent's main2246 inputs/15 outputs (only application.js changed), public2177/3 exact/no-live-factory/API and earlier287/shared35 results remain **attributed author evidence**, not fresh R6 builds or Root composition. No full product build followed NT7.

## Preserved raw failures and compatibility dispositions

The first original CURRENT NT1 replay reached its real12s case, but its exclusive observation path collided with the preceding OLD run: raw **2/3, exit1, EEXIST**, not an accepted3/3. OLD's original observation remains unmodified (401/signedout/revoked). A NEW executable copy changes **only one evidence output-directory literal** to `independent-current-fresh`; the already-bound cwd, production sources, native signals/Responses,12000ms/10000ms timers, schemas and every assertion remain unchanged. Fresh CURRENT is3/3, exit0 with503/uncertain/offline/same current boundary/active Vault. Both source hashes and one-literal correspondence are explicit in `nt1-output-only-binding.json`. No file was overwritten to make a replay pass.

The initial dependency gate was overstrict: it asserted no own/Root runtime differences. It stopped before any clone/probe; raw `custody-pre.log` is preserved. The corrected gate pins **every** physical own a90 and Root b86 runtime row to its respective immutable HEAD and permits exactly the declared five differing paths: client-policy, client-upstream, gateway, policy, upstream. a90 policy is its explicitly authored new postimage. No count-only permission or unreviewed sixth row is used. Full historical custody had five; older prose saying six remains an error, while six authorized Root producer projection inputs is a separate count.

Initial broad context displays were truncated. Narrower reads completed required reports/specification/continuation material. An initial appendix comparison included the bundle's separator and falsely asserted whole-section inequality; stripping only the separator establishes entire decision/specification equality to the read companions, and the full JSON manifest equals its companion. No normative input was changed. A terminal evidence basename collision reused `runtime-terminal.json` for the T3 configure receipt after physical custody; the T3 receipt is separately preserved, and all91 physical runtime rows were freshly reread into `runtime-custody-terminal-recheck.json`. Full terminal dependency parity logs remain preserved. No raw test/failure receipt was overwritten. The original goal's extra handoff-location paragraph was also read. An initial optional AAS5 tracked-path read was absent; the full exact3d93051c report was read from Git instead. These are preparation/read qualifications, not product REDs.

Inventory source witness remains **12/14, exit1**: its advisor-cookie executable erasure premise and old generic-byte premise fail. All other original preservation/constructor/denial/head-budget mutation controls pass. R5's explicit disposition remains binding: these two stale inventory-only premises do not establish an inventory behavior regression, and do not establish a passing current witness. A separately owned compatible successor must retain original relevant predicates and explicitly bind all current reviewed generic/notification/App/policy postimages. This report authors no successor, skip/filter/waiver or green witness claim. NT7 independently holds combined admission.

Earlier raw280/287,250/256,24/25,37/39 and head31/32/29/32 remain failures at their own inputs. Approved854 changes only two header-before-abort timing fixtures with57 original assertion texts; e937 changes the one offline-private-return401-to503 expectation;96f8 changes two no-channel expectations;86ac changes three import annotations. No fresh full-suite/AST certification is claimed here. The old inventory hang,45s diagnostic30 pass/1 cancellation and47-minute exact owned-runner interruption remain hashed history, not this run's result. Parent's initial partial closed39 (only two JS files despite four argv), expanded NT6 stdin misbinding0/1 both, SD1 five passing cases plus EEXIST hook failure, wrong NT1 cwd/missing AAS5 and earlier summary qualifications are preserved in place. No historical raw failure is upgraded.

## Pins, custody and complete review input

Initial worktree: `/Users/kanuj/.t3/worktrees/shelv/t3-c14aa8ab`, branch `t3/shared-transport-source-r6`, clean at exact a90, **2183 tracked paths**. No input imports/cherry-picks, fixes, foreign writes or ancestors were made here. The candidate already inherits separately attributed SMTP/shared input9e8, entry inputde2d and correction482. None is reviewer delivery. a90 authors exactly six paths: three production, two NEW tests and its report. The complete shared target is49 postimages, not that suffix alone.

Source lineage remains58 ->07c4 ->inventory74eff/99ded/7658 ->2c9633d8 ->bc5651e6 ->24d343c3 ->a90. Full R4 report9a0a37a28e0e13391df4a255bcc62adfaab32f62, full R5 report0f822783febfc02019ba85fba0fb331c05ea3397, prior SD1/NT1/AAS5/NT2 reports, cumulative W0 response, both coordinator correction reports, relevant interface pins/addenda and original matrices were read. Root README/GOAL/D01-D48/full desktop/contracts/manifest match own bytes; Root's newer WORKSTREAMS/CURRENT_STATUS prefix differences were also read, without importing them. Historical rosters are not live-resource authority.

- Approved original:95388 bytes, SHA256 `c45701f9f54fd2b1dbb09bbd7aa2b9b437e9059aa6032b6f39411fe2e7f6efbd`.
- Complete continuation:100187 bytes, SHA256 `b428b318598df52f12ce3e6ea4ebd350ff9333ee05d9fd8f04a8e845d0c722bc`, from committed Root `docs/portal-rebuild/source/CONTINUATION_INPUT_20261102.txt`. Its old embedded stop is historical; this explicit current review grant governs.
- Original R5 176 raw references were all read/hash-verified **in place**;324 total bounded historical files are indexed. No recursive foreign archive/tree copy or foreign artifact execution occurred.
- Original SD1, NT2, AAS5, NT3, NT4, NT5 and NT6 programs are byte-exact R5 copies; original4500-byte AAS5 SHA remains4296f63d. Only own bootstrap/path/source-selection and NT1 cwd/output-directory bindings differ where stated. Assertions, limits, wire schemas and OLD selectors are not silently changed.
- Each selected immutable input was individually materialized into the own ignored fixture. The original116-source closure is fully repinned to a90; all49 target postimages are verified against physical own source and exact Git blob/mode/bytes/SHA. All executed physical source is within the protected tracked envelope, actual type-input manifest and full dependency inventories. The physical tracked envelope is a conservative superset, not a claim every file executed.

Canonical pins are independently read and every row's Git blob/bytes/SHA verified:

| Pin | Exact identity | Current boundary |
| --- | --- | --- |
| Notification entry v1 |26 rows;07c4+8f9; SHA4fb96ef11ee15640d92e5ae57ba359079913be687e08e26ba0597d6343f01e31|Photo74eff was the wrong historical notification instruction. Separate current entry R2 does not accept shared a90.|
| Photo v1 |77 source rows/6 packages/21 virtual postimages; SHAf5a73a62956bb310481a44863d1db9d1308329f4b0a5cf6059ed3b920cf761d1|Adapter7887ec53; W4b906/R6 reviewed this v1 only.|
| Photo v2 |Same77/6, adapter7ffa6872 only successor; SHA49c1aa973e3a8d407788bcbdcdd494b511a14fa42b40fabd43f0892c78f09cde|Neither v1 nor v2 accepts later generic/body/notification/App/policy changes.|
| Root producer projection |Six runtime postimages; SHAacae84d966e149658349ea3a1cf9065512f543068ec7b68e0de6279474b0a543|Two incompatible native maps excluded;14 manifest rows are not14 production changes.|

Current v1 differs on adapter, generic, decoder, advisor-cookie, retained annotation, App session and policy; v2 differs on the latter six. Six package bindings still match.276 unique edges versus306 declarations including30 duplicates remain distinct counts. Consumer-v2/current full-collection/private-byte acceptance stays open.

Both dependency roots were absent initially. Conditional same-lock APFS cloning occurred only after package inputs, all four physical root/portal locks, separate runtime lock, all91 immutable own/Root runtime preimages, nonsymlink ancestors/roots, same device, literal links/targets and both complete byte/mode/kind inventories passed. Actual `/bin/cp -cR` clones contain43213 root/9071 portal entries, including roots. Full before-probe **and terminal** own/Root parity passes. Literal `../session-integration/runtime` resolves only to own tracked runtime. No foreign generated runtime, install, shim, declaration/flag/config/package/lock weakening, Auth state or process/resource adoption occurred. Root React19.2.3 and portal19.3.1 remain distinct. Four formerly overlaid prerequisites (retained annotation, two native maps, interleaving guard) are now verified exact physical own/Root source; no overlay is used.

Authoritative literal taskId, supplied separately after start:

`node:delegated-task:command%3Amcp%3Aafb222dc-28b4-420b-9474-b05bc6eeba89%3Adelegate-task%3Acontinuation-20261102-shared-transport-review-r6`

Backing thread/run are separate handles, never substituted for taskId. Initial and terminal actual self and Parent9b085ada-435f-48d6-8886-957c1ce3e82d `t3_thread_configure` READ calls omit modelSelection and return **codex/gpt-6.1-sol/reasoningEffort=xhigh/serviceTier=default**, full-access/default interaction. Explicit Node reportsv22.23.0. No fallback, nested agent, global setting change or extra review delegation occurred.

## Held gates and sole delivery

NT7 prevents complete shared retirement/combined source admission and dependent product acceptance. Feasible semantic/original/negative/closed HTTP/static checks above continued, as allocated. Full npm/Expo/portal package/main-public rebuild and CI were not run; these are unrun, not green or silently dropped. No execution packet/grant or source self-acceptance is issued.

Still separate: actual Root projection/preimage reconciliation and mounted App/current consumers; notification entry and real inbox/destinations; photo consumer-v2/current complete collection/C05/C07/upload/private bytes; lawful Source/consent/retention/final private egress; full Account/departure/profile/contact/cancel/export/post-window administration; genuine SQL migrations/RPC/pgTAP/RLS/Auth/Storage/least privilege/catalog/concurrency; actual authorized local-sink/provider delivery/webhooks; financial operations and unsupported legacyR1 public lineage; ordinary browser navigation/Back/forms/focus/downloads; exact26-frame/secondary/narrow/mobile/visual/a11y/representative-human acceptance; full exact-head CI, migration/rollback, launch/release authorization. Guidance/M65 refusals remain held without rerun, rephrase or reroute.

Before the sole report commit, final checks preserve all2183 baseline tracked bytes/modes/literal links, all49 candidate postimages and all executed original/current source/probe fingerprints, complete dependency parity, report links/scope and `git diff --check`. Only this NEW report is staged and committed. Terminal commit/clean-state readback is recorded in ignored `FINAL-HANDOFF.json` to avoid self-reference. Parent should consume **only that report commit**, excluding all candidate/input/correction ancestors, and allocate the bounded owner correction plus a NEW complete independent review.

No production/test fix, browser/preview/DOM, native resource/DB/Auth/Storage/socket/listener/server/provider acquisition, stopped-fixture reuse/query/reset, credentials lookup, foreign executable/write, push/PR/watch/comment/merge/deploy, real-client publication/message, purchase/funds/order/fulfillment or permission action occurred. Only own finite synthetic execution, authorized Parent task updates and this report commit are delivered.

## Evidence fingerprints and complete49 target manifest

All paths below are frozen review inputs, not reviewer-authored production. Every target is mode100644. Full SHA256/bytes/mode/Gitblob and source-origin bindings are in the indexed ignored manifests. Raw receipts retain full commands and true exits; case matrices retain original failure names and observations.

| Evidence artifact | SHA256 |
| --- | --- |
| `combined-target49.json` | `f3553e74fdc8d541fdd7fd7e11d7a686e82f07ab88f54156d25e3de6114769c0` |
| `executed-inputs.json` | `5c39cbcc808c18094aa2ce8ac14786ff323c618e0aed1c852e1185bf4da79107` |
| `executed-closure.json` | `61646d082733d9ce73c3db1f034a96d7ed625fe1fca688b5d41082934699b82a` |
| `physical-type-inputs.json` | `609351e81de847127d9424da2cea18cc56940c59ecb646920539bf5ee8c02bc2` |
| `commands-index.json` | `7b3c91b7b10168cf0ada869ce9633407db524bd2c12482e693dd09ff14b32d8c` |
| `semantic-case-matrices.json` | `478266882243bb401716561415d6e6ca7229164f9c5e6783d0301e1764ebd695` |
| `historical-raw-references.json` | `4c863f70d8724fb9c01bff0b1fc152ca4148494fa462f9a280a5ef07a5b68e0b` |
| `canonical-pin-audit.json` | `edef87bb0864607a17a6f6fc17e72fa7d9b30fe44d3cf83497711eebd05abbaa` |
| `original-test-correspondence.json` | `b194d5e1173047554950156f14cee1c1638902de2ead8865d7587d56720c9a5f` |
| `nt1-output-only-binding.json` | `ad513346a97ec66a2b01bf43c382e0e3736774f03c712d5ecbf5cae835bd677e` |
| `nt7-attribution.json` | `592ca8dac329cb813af92f3175f6646c0270b391106b4cb01b970210e89204d0` |
| `t3-runtime-terminal.json` | `77e9157ddea3b0026a0041d1f15926146f4e4963f6e7d89783a17392868a51d2` |
| `runtime-pre.json` | `624eb94a1f779e97a0256a84188b13d875b23821f93e2391e698a3587556e365` |
| `runtime-custody-terminal-recheck.json` | `6fd06524e17c3bba0a00be06733ab1bd3228af2c43c69dca13cd47d8b6862da6` |
| `physical-four-prerequisites.json` | `ea4c03620665bde1faeb7a9e02a8895e36e377ee008e9fef4c1622082526d577` |

| Target path | a90 immutable Git blob | Bytes |
| --- | --- | --- |
| `apps/portal/session-integration/runtime/server/client-policy.ts` | `e7cdbe95987a558d06057c068914f8b8132c0c11` | 5703 |
| `apps/portal/session-integration/runtime/server/client-upstream.ts` | `7e6c1bfd0c4f6e3cc37c37bae3b295de7e2b4e88` | 13241 |
| `apps/portal/session-integration/runtime/server/gateway.ts` | `7961851ee3e5a0df77efa2d778d42c2c1ad27a72` | 17307 |
| `apps/portal/session-integration/runtime/server/policy.ts` | `db4fec1775427043e983bc341fdaf9f8f1846d78` | 13506 |
| `apps/portal/session-integration/runtime/server/upstream.ts` | `bab157d40d23c419c23b2951911e2f395949e128` | 25540 |
| `apps/portal/site/auth/advisor-cookie-session.js` | `38d55642266e66d507da7b963e3ac5bc674f5c0c` | 29224 |
| `apps/portal/site/auth/client-cookie-session.js` | `40511c729ed05fd25942ab99f08c64568e85efd6` | 6493 |
| `apps/portal/src/app/notification-request.ts` | `adbc97fb5d9ea3f0699c16d61bb103eec8cc303d` | 6090 |
| `apps/portal/src/app/photo-inventory-request.ts` | `7ffa68726c8dab6bc114ec4ad5ebf441e352ea4c` | 4128 |
| `apps/portal/src/app/session.ts` | `7ee99d5d0d13d0d316b86b894ec525520616897e` | 6061 |
| `apps/portal/src/transport/session.ts` | `e320fd68444bd6ca17059f293baa2d860dcbbd7b` | 10300 |
| `apps/portal/tests/rebuild-cookie-cancellation.test.mjs` | `aac90d682ca65f575e53b5f93280a62139c66e25` | 13694 |
| `apps/portal/tests/rebuild-foundation-transport.test.mjs` | `74d14de1df4b9a2a4d2d7ea4a78ded266a84b741` | 10032 |
| `apps/portal/tests/rebuild-photo-inventory-closed.test.mjs` | `3eaea8853584edc417f2816397604659df371678` | 8423 |
| `apps/portal/tests/rebuild-photo-inventory-strict.test.mjs` | `0df9885cd23e983c6ef15b6b0d44c810293046e5` | 3340 |
| `docs/portal-rebuild/research/COORDINATOR_NT2_SOURCE_ADOPTION.md` | `d382642db07a3a8ccba115497ccf700c1f932581` | 5497 |
| `docs/portal-rebuild/research/COORDINATOR_NT3_NT4_CORRECTION_20261102.md` | `79fa5240f2ed25e875c3c0b7a7204a942b9e7679` | 6698 |
| `docs/portal-rebuild/research/COORDINATOR_NT5_NT6_CORRECTION_20261102.md` | `449d765fbed241d03145fc0dde1de893689e9ba4` | 7734 |
| `docs/portal-rebuild/research/W0_NOTIFICATION_TRANSPORT.md` | `47ba1514eb9385e81babec2bba9fb85c2323b722` | 78901 |
| `supabase/functions/concierge-checkins/commands.ts` | `3e90a6ed46b2e769b4462f16d0fbf3464d78b4d4` | 4081 |
| `supabase/functions/concierge-checkins/handler.ts` | `f79aa6f9f584b3ef723641d6adaf8a5850f40653` | 15173 |
| `supabase/functions/concierge-checkins/index.ts` | `41e51dcfa2d1facb3318d1f8bbcd978adcf4a823` | 1564 |
| `supabase/functions/concierge-checkins/projection.ts` | `bbeb54cd10132f6440602c362dec5379d6536c19` | 7522 |
| `supabase/functions/concierge-checkins/types.ts` | `3592b3b2eb89582a8084fa8f13481c8e867fca35` | 1781 |
| `supabase/functions/concierge-notifications/index.ts` | `40cc2a241ba3cff8877540485bd1931953e16fa5` | 770 |
| `supabase/functions/concierge-operations/body.ts` | `41434838ed4c06b329dc7552ce2ef4fac740201e` | 1027 |
| `supabase/functions/concierge-operations/runtime.ts` | `0f9e292d61a11434b2850af09e36c8641d789d9d` | 4450 |
| `tests/concierge-body-cancellation.test.ts` | `ae876df11d5d1efa6060ad0370a9e114a61ca5b3` | 3811 |
| `tests/portal-cookie-denial-provenance.test.ts` | `ea97c926c0ee1a12e35ed22ec70ffbf76042a820` | 7365 |
| `tests/portal-cookie-final-return.test.ts` | `1c7b82aab504f906248d510daef6d65416bdf1e1` | 4357 |
| `tests/portal-cookie-first-lease.test.ts` | `754cbfb7e27b2a95718f0add9a61eb5fe5f6594d` | 8496 |
| `tests/portal-cookie-observer-retirement.test.mjs` | `1c841b3d8b08b175786c4364fe0e0be8479a7379` | 6299 |
| `tests/portal-cookie-offline-return.test.mjs` | `80fe9dd30bcc0e7646d8fd52de5fceb581b497b4` | 3874 |
| `tests/portal-cookie-post-abort.test.mjs` | `6b0088b3e95abdafee31587e61a2d4a9f18b475a` | 1830 |
| `tests/portal-cookie-retained-denial.test.mjs` | `73da8ebdb534265646b08dc5cc4b5f0f79825079` | 6926 |
| `tests/portal-notification-authority-status.test.ts` | `1eea9b38310a458e69083bd635ce00acf3360092` | 13659 |
| `tests/portal-notification-body-abort.test.mjs` | `33e83ea5d8d33fa639bd341a366bec7bccbd5b30` | 4031 |
| `tests/portal-notification-closed-http.test.mjs` | `d9e9fceaa329fa2814ac9ba3b799f401716fad83` | 17004 |
| `tests/portal-notification-final-return.test.mjs` | `d29d978584fc33cac8f00982775704f85a04a65e` | 3569 |
| `tests/portal-notification-gateway-overflow.test.mjs` | `a1390af2e116ce53e01ba0cfdd7a8f60ed7cad8f` | 4298 |
| `tests/portal-notification-provider-deadline.test.mjs` | `7463cc03a866554f6f4d14ae8c9c2034d04aac99` | 15703 |
| `tests/portal-notification-session.test.ts` | `9e15ade0231f0e10b179884ebec4f86bd45067de` | 4247 |
| `tests/portal-notification-source-mask.test.mjs` | `b61525855bbfab0206fb64dc34e30329ffd08f54` | 4469 |
| `tests/portal-notification-strong.test.mjs` | `6eebe72578703ce97c39dc1ceb3cd3dda31cc0a8` | 3126 |
| `tests/portal-notification-transport-types.ts` | `26364d42f0340fd44a6f66727b1b2d657d98a3a6` | 1358 |
| `tests/portal-notification-transport.test.ts` | `aa869066a9c2ea05d6c54229019bb31235d8ba44` | 12480 |
| `tests/portal-photo-inventory-source.test.mjs` | `e5b048fc744047c59ff9fee8fbd4cd29c3ca8c5d` | 7389 |
| `tests/portal-photo-inventory-transport.test.mjs` | `b7cf5463b732d585b20835d0ee19bfa7beced82d` | 27584 |
| `tests/portal-photo-inventory-types.ts` | `9c365d7700f7e707f4949f7cc2fb0414b5573c33` | 1275 |
