# W7 notification entry: independent source/lifetime/SSR R1

Owner: Kanuj. Review date: 2 November 2026, America/Chicago. Independent report-only review of frozen `ceffcb6fa1f7a4978a4a2dda56212253056df3a1`, owned suffix `e4efe7c114742e352870d3ff15f9439760e3d17b` plus `ceffcb6f`. The input-only ancestor `12452a50c18ed662ff3d2887b501a26855462b40` is excluded from delivery. No production or original test was fixed.

**Specification verdict: CHANGES REQUIRED, NEI1/P2. Correctness/quality verdict: CHANGES REQUIRED, NEI1/P2.** The complete six-path candidate and applicable prior findings were reviewed. The frozen entry suite independently passes **19/19** under the exact canonical source projection. Two additional independent reentrant controls both fail. This is a completed bounded source review with a failing lifetime requirement, not source acceptance, shared-transport admission, App mounting or full-product acceptance.

## Consolidated finding

### NEI1 / P2: predecessor retirement can strand the replacement in a running, controller-less lifetime

Affected frozen source: `apps/portal/src/app/notifications-entry.tsx:111-114`, together with the running fast path at line101. The code sets `running = true` and installs B in the navigator WeakMap, then calls callback-capable `previous.retire()`. If that retirement makes B inapplicable without changing B's sequence, line114 returns directly. B has no controller, initial-read promise or runtime/navigation/boundary subscriptions, but remains marked running. The later failed-applicability branches call reconciliation; this first branch does not.

The independent probe uses the **actual** canonical navigator, creation-bound ApplicationSession, feature controller, retained notification request, Root codecs and handler/runtime. It installs an ordinary public subscriber on A's actual controller. When A is disposed during B startup, that subscriber navigates the actual shared navigator to `account`. It supplies no replacement currentness, controller factory, authority, operation, Vault or session implementation.

| Case | Observation before assertions |
| --- | --- |
| Start B while A's disposal subscriber navigates to account | `B.start()` resolves; no B subscriber notification. Only A's initial inbox RPC exists. A later explicit `B.getSnapshot()` reconciles to `inactive` and only then emits that state. |
| Same startup, then navigate back before reading B's snapshot | Two explicit `B.start()` calls both resolve. Snapshot remains `idle`, controller is null, RPC count remains1. B never creates its controller or performs its initial read. |

Both cases fail: **0 pass /2 fail, exit1**, no skips/cancellations. `reentrant-current-observations.json` captures state before assertions and teardown. The same unchanged probe against only the original entry source from `e4efe7c1`, with all other inputs still canonical, also gives **0/2, exit1** with identical observations. This attributes the defect to the original entry startup path; it is not introduced by the readonly type or inactive-route successor correction. The earlier one-case diagnostic remains separately failed.

Impact is missed external-store notification and a stranded replacement lifetime under the explicitly required reentrant subscriber schedule. A caller that happens to read the snapshot on account can reconcile it, and explicit stop/new entry can recover. Do not describe this as persisted data loss, server authorization failure, privacy disclosure or a demonstrated ordinary mounted-browser incident. Root does not yet mount this entry. The deliberate subscriber schedule establishes the requested source robustness contract.

The entry author should retire/reconcile an inapplicable **still-owned** startup before returning, clearing running ownership and publishing the correct inactive/ended state. Preserve sequence/owner guards so this cleanup cannot retire a reentrant successor C. Keep navigator ownership, actual controller memory and authority unchanged. Retain both tests above and add the adjacent C-replacement/control cases to the correction. A fresh independent review is required; this report supplies no implementation patch or self-approval.

Parent received the initial finding immediately and the stronger stranded-lifetime observation separately. Feasible semantic review continued through the complete entry and tests. Broader dependent acceptance was not run after this counterexample.

## Original requirements and reviewed disposition

The allocation is the same approved rebuild continuation. The normative [README](../README.md), [goal](../GOAL.md), [D01-D48](../APPROVED_DECISIONS.md), [desktop specification](../APPROVED_DESKTOP_SPEC.md), [implementation contracts](../IMPLEMENTATION_CONTRACTS.md), [addenda](../DECISION_ADDENDA.md), [workstreams](../WORKSTREAMS.md), applicable root/portal AGENTS, actual full W2 original report and entry append, original entry/UI/kernel briefs, notification N1/N2 author responses and R1-R3 history govern. This checklist preserves the full allocated contract without replacing those canonical requirements or narrowing the approved product.

| Allocated requirement | Review disposition |
| --- | --- |
| Exactly three public exports: `createNotificationsEntry(runtime,navigation)`, `NotificationsEntryView({entry})`, readonly `NotificationsEntry` | Source confirms exactly these exports. No added port/factory/accessor/authority inputs. Original negative type-test source reviewed; compiler result is attributed below. |
| Stable readonly snapshot with phase `idle|active|inactive|ended` and actual nullable NotificationController; subscribe/start Promise/stop/dispose | Source confirms frozen snapshots/API; the missing startup transition is NEI1. |
| Constructor and SSR inert; no restoration, subscription, read or write | Independently exercised in the original entry suite; actual wrapper SSR does not run effects. |
| Lazy actual controller after explicit postcommit start; one initial read per started lifetime; repeated/reentrant start shares it | Original positive/reentrant cases pass. Reentrant predecessor route exit strands a new lifetime: NEI1. |
| Bind actual audience/actor/boundary/epoch/local and server generation once; do not adopt replacement identity | Source and original owner/CSRF/server-generation/startup/expiry/signout controls pass. |
| Canonical route is deny-only; navigator WeakMap arbitrates lifetime only; never dispose shared navigator | Actual `buildRoute`/`parseRoute`, exact path, WeakMap and no navigator.dispose call confirmed. Route leave/Back/late old-dispose positives pass. |
| Clear/fence before unsubscribe, abort and callbacks; isolate throwing/reentrant subscribers; recheck after callbacks/await/error/finally | Clear-first retirement, captured cleanup list, observer catch and guarded microtask confirmed; positive throwing/reentry cases pass. Startup's unchecked retained running flag fails NEI1. |
| Use actual unchanged feature/controller/session memory; preserve original operation UUID/action/target/CAS/body through uncertainty/remount | No entry cache/replica/UUID creation. Original same-boundary remount and historical-receipt controls pass. Actual feature remains exact8f9. |
| Client/advisor VIEW-only own mark/status; staff email retry/status-retry EDIT; actual capability/current denial fences | Original entry client/advisor VIEW and A06 EDIT-loss/current401/403 controls pass. No care-read-only restriction or right expansion introduced. |
| A06 selects trusted acknowledged command+receipt; no event UUID editor/global directory/guessed A07 resolver | Entry adds no selector. Actual frozen feature/recovery and original A06 test retain exact binding and honest missing producer. |
| Actual Notifications/shared wrappers and canonical destinations; no feature/UI/App/routes/shared mutations | Actual SSR composition used; source-only candidate has one new production file. App/bell/sidebar/A06/focus integration remains absent. |
| Actual runtime/controller/Root composition with finite synthetic HTTP; distinguish direct handler bypass from serial gateway/Vault | Independently reproduced19 includes both, qualified below. No successful facade was substituted for genuine proof. |
| Canonical notification07c4+8f9 EXACT26 rows; exclude photo74eff and mutable cumulative source guesses | Every row's named Git object/blob/bytes/SHA verified before projection. No photo input used in current execution. |
| Preserve OLD/raw/minimally bound/successor/CURRENT separately; no assertion filtering or waived green | Separate failed setup logs, old-entry reproduction, current19 and independent failures retained. Historical wrong-pin and compatibility results remain distinct. |
| Focused checks only; no install/config/package/lock/dependency changes, native resources or remote writes | Conditional same-lock dependency clones only; no dependency edits/install. Full/heavy graphs and all prohibited resources unrun. |
| Sole new report and ignored evidence; ordinary report-only commit; no fixes/push/PR/watch/merge | All2,128 starting tracked paths verified unchanged before this report. Only this report is delivered. |
| Separate verdicts, exact manifest/runtime/dependency fingerprint, commands/exits, prevented/unrun gates and unknowns | Recorded here and in the named ignored receipts. No self-approval or release claim. |

## Frozen source/base/postimage and owned diff

Reviewer checkout: `/Users/kanuj/.t3/worktrees/shelv/t3-eac14ff3`, branch `t3/notifications-entry-source-review`, clean initial and pre-report HEAD **`8af746d197b976972d4b16924155afa8c3b32d44`**. No tracked input import or input-only reviewer commit was needed. Candidate bytes were extracted only into own ignored `.local-artifacts/w7-notifications-entry-r1/`; the actual shared composition stayed frozen8af.

Candidate-owned comparison is **`12452a50c18ed662ff3d2887b501a26855462b40..ceffcb6fa1f7a4978a4a2dda56212253056df3a1`**, exactly six paths, all mode100644. `candidate-owned-manifest.json` preserves complete bytes/SHA256 as well as these Git blobs:

| Candidate-owned path | Final Git blob |
| --- | --- |
| `apps/portal/src/app/notifications-entry.tsx` | `aef9b75a68e9b8b0ae912fe4470d047dde88a9f6` |
| `apps/portal/tests/rebuild-notifications-entry-fixture.mjs` | `18ace5d25d7dce673d347ea88fe30f5014dde1e0` |
| `apps/portal/tests/rebuild-notifications-entry-lifetime.test.mjs` | `8d91475b4fc579e94b4278cac0f90dfa89bafda4` |
| `apps/portal/tests/rebuild-notifications-entry-source.test.mjs` | `5473f13c27cc63b802d846d879f8f46e40ce351f` |
| `apps/portal/tests/rebuild-notifications-entry-types.test.ts` | `c2398b50c2a5ce3f75dce3811c7a31f8e0456578` |
| `docs/portal-rebuild/research/W2_NOTIFICATIONS_UI.md` | `83b921a196ba1bc67ab6832f63189c8b0da5642b` |

Entry:7,590 bytes, SHA256 **`d8948981818871984a9d282bf510a55094856851c21a23d8345dd2c401ebaabc`**. Full cumulative author report:54,207 bytes, SHA256 `8575d6ec94f312544bf6c01632416d31e412e0d7e954b6a1e695f9dcefdfcc73`. Its entire40,193-byte original W2 prefix remains byte-exact, SHA256 `691b59846a4394a56b0255bcd4f0afb5a18231b09205530315c294cdc8437eef`. The only new production source is the entry; the original feature/tests are input provenance, not authored entry production.

Canonical allocation file was read/hash-checked **in place** at Parent's original integration checkout: `.local-artifacts/portal-rebuild/review-allocations-20261101/notifications-entry-source-pin-v1.json`, schema `notifications-entry-source-pin-v1`, **26 rows**, SHA256 **`4fb96ef11ee15640d92e5ae57ba359079913be687e08e26ba0597d6343f01e31`**. Exact targets are transport **`07c4ae82def408bf9526f48a48eb987e4506f83e`** and feature **`8f9c34e83bd193989b90bb2375d2ab08d1a2d7b8`**. The original e339 manifest supplies17 path names only. `canonical-pin-original.json` retains the exact26 rows; `input-projection.json` adds only the entry as row27. All other runtime source is own frozen8af; dependencies are locked own copies. Types-only modules and the public Deno entry are pinned but are not falsely claimed executed by a fixture that bypasses that entry.

The successful actual-source fixture bundle has2,210 input nodes. Its metafile records actual session, retained cookies, navigation, feature/controller/wrappers, gateway, providers, encrypted Vault/CredentialEnvelope, Root runtime/handler/codecs and locked dependency modules. The loader returns exact pinned source text, never success values or substitute authority methods.

Original approved input is still **95,388 bytes**, SHA256 **`c45701f9f54fd2b1dbb09bbd7aa2b9b437e9059aa6032b6f39411fe2e7f6efbd`**. Relevant complete continuation/custody sections were read from Parent's `CONTINUATION_INPUT_20261102.txt`:100,187 bytes, SHA256 `b428b318598df52f12ce3e6ea4ebd350ff9333ee05d9fd8f04a8e845d0c722bc`. The original UI/kernel brief is108,001 bytes, SHA256 `3e38b64d320d75d6ca728ee5071cb504462afc88dd82e5896c8822986fc8b339`. The actual original entry task was additionally read via its supported T3 thread and copied into own `original-entry-brief.txt`; no source was executed in a foreign checkout.

## Executed checks and exact commands

All commands ran in the reviewer checkout. Every Node invocation below uses the literal binary **`/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node`**, version **v22.23.0**, with the retained global external-fetch-denial preload. Only enumerated in-process synthetic HTTP receives replies. Raw receipts preserve argv/cwd/stdout/stderr/exit, and files were kept under unique names.

| Check | Result | Receipt |
| --- | --- | --- |
| First projected19 attempt |0/19, exit1; compiler binding setup, no behavioral assertions reached | `entry19-current-raw.json` |
| Explicit source resolveDir attempt |0/19, exit1; same nonexistent canonical directory resolution issue | `entry19-current-projected.json` |
| Final fact-bound original19 |**19/19, exit0**, zero skip/cancel | `entry19-current-resolved.json` |
| Initial independent replacement notification diagnostic |0/1, exit1 | `reentrant-current.json` |
| Expanded independent CURRENT controls |**0/2, exit1**, zero skip/cancel | `reentrant-current-expanded.json`, separate observations |
| Same independent controls, OLD entry e4efe only |**0/2, exit1**, zero skip/cancel | `reentrant-old-entry.json`, separate observations |
| All starting tracked files and terminal dependency parity |exit0,2,128 tracked paths exact | `final-protection.json` |

The original tests' lifetime file remains byte-identical. The source test changes only its existence-check path to the exact ignored entry input. The fixture copy changes only evidence/import/compiler bindings: own esbuild path, own ignored evidence root, CSS input loader, explicit source resolveDir and resolution of real own files from otherwise nonexistent virtual feature directories. All assertions, HTTP replies, timers, business paths and production bytes remain exact. Final adaptation patches and untouched raw copies are retained. Both failed resolver attempts remain setup failures, not product REDs or waived successes.

The expanded failed probe ran CURRENT before OLD. Its assertions are unchanged between those runs; OLD replaces only the entry Git input. This is not the earlier historical74eff dependency run. OLD entry SHA256 is `caa5bf4d476ad77cfddb04ae2e448efb45b82a48c170fecdff7d922cae5d2da4`. No proposed fixed successor was implemented or tested.

Exact material test argv, with `E=.local-artifacts/w7-notifications-entry-r1` shown as shorthand only:

```sh
NOTIFICATIONS_ENTRY_INPUT_MANIFEST=$E/input-projection.json \
/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node --experimental-strip-types \
  --import ./tests/portal-review-no-network.mjs --test --test-concurrency=1 \
  $E/rebuild-notifications-entry-source.test.mjs $E/rebuild-notifications-entry-lifetime.test.mjs

NOTIFICATIONS_ENTRY_INPUT_MANIFEST=$E/input-projection.json \
ENTRY_OBSERVATIONS=$E/reentrant-current-observations.json \
/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node --experimental-strip-types \
  --import ./tests/portal-review-no-network.mjs --test $E/reentrant.test.mjs

NOTIFICATIONS_ENTRY_INPUT_MANIFEST=$E/old-entry-projection.json \
ENTRY_OBSERVATIONS=$E/reentrant-old-entry-observations.json \
/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node --experimental-strip-types \
  --import ./tests/portal-review-no-network.mjs --test $E/reentrant.test.mjs

python3 .local-artifacts/w7-notifications-entry-r1/final-protection.py
git diff --check
```

The19 comprise the original4 source/SSR controls plus15 lifetime controls. Most use the real Root handler/runtime directly through synthetic HTTP and **bypass gateway/Vault and the Deno index**. The separately named serial case executes actual ApplicationSession/cookies -> gateway -> SessionVault/CredentialEnvelope -> provider/context parser -> Root handler/runtime. Its record store is memory. B queues while A is held, A is released, and only then does B dispatch. No impossible same-Vault B-before-A-release schedule or successful replacement Vault is used. Neither path establishes genuine Auth, SQL, persistence or delivery.

## Prior findings and historical evidence remain distinct

| History / applicability | Current review treatment |
| --- | --- |
| Kernel N1 cross-family journal collision; N2 unreadable known401/403 body | Full original author/fix and R1-R3 contexts retained. Root8af already carries the reviewed kernel. No kernel SQL/Auth/catalog/concurrency re-acceptance from this entry. Historical raw one-trigger predicate and N2 failing observations remain separate. |
| UI original41/43 late cancelled401 and V3 generation correction | Frozen actual entry suite re-exercises late401/503, generation changes and original remount custody. The direct-versus-serial distinction is preserved. |
| UI NUI1 EDIT-loss recovery | Exact8f9 controller/renderer/types retain deny-only pendingRecovery plus independent execution guards. Prior R1 FAIL and R2 scoped PASS remain unchanged. This review did not rerun the complete original NUI1 program or claim a new complete feature75 PASS. |
| SD1, NT1, AAS5 | Read actual combined transport R2/R3 and W0 full original notification/NT1/AAS5 sections. Canonical07c4 includes those corrections; their old/current results are attributed. No new global/shared acceptance here. |
| NT2 and bounded decoder cancellation | Original combined R3 FAIL and coordinator `bc5651e6b27cd433851a779e57fc02e8f6a433d2` response read. That unaccepted successor is **not** substituted for canonical07c4. Combined shared R4 remains a separate admission gate. Prompt refusal is not completed physical cancellation. |
| Wrong notification pin photo74eff | Preserve Parent's historical wrong-pin SHA256 `8f2d42f85a668b8778bc694ec7d0063091864df88315d22731911587d1173c14`; original author outcomes e4 early3/3 and strict161/0, later74eff19/75/4 remain historical. Canonical07c4 replays are separate. No photo74eff or facade successor99ded was executed as notification current. |
| Author entry RED/setup/type history | Missing-entry0/3, inactive-route3/4 ->4/4, first07c4 Node util bundle failure, omitted assets.d.ts diagnostic and unused readonly-method expected-error remain attributed raw history. No assertion/filter/waiver or type-flag relaxation by this reviewer. |

Author canonical **entry19**, feature **75**, copied-independent **4**, strict **161/0**, frontend **253/0**, browser-source **2152 inputs/2 outputs write:false**, UI **11** were read/hash-referenced in place. **Only the19 was independently reproduced here.** The earlier independent4 replay by the entry author is still author evidence for this entry, not a fresh review. `read-input-raw-references.json` binds the original raw files without recursive archive copying. This review's2,210-node SSR/server fixture graph is distinct from the author's2,152-node browser-source graph.

## Runtime, dependency custody and preservation

Authoritative allocation taskId, forwarded separately:

`node:delegated-task:command%3Amcp%3Aafb222dc-28b4-420b-9474-b05bc6eeba89%3Adelegate-task%3Acontinuation-20261102-notification-entry-r1`

Separate self threadId:

`thread:delegated-task:command%3Amcp%3Aafb222dc-28b4-420b-9474-b05bc6eeba89%3Adelegate-task%3Acontinuation-20261102-notification-entry-r1`

Actual Parent: `9b085ada-435f-48d6-8886-957c1ce3e82d`. Initial and terminal `t3_thread_configure` reads for BOTH self and Parent omitted modelSelection and returned **codex / gpt-6.1-sol / reasoningEffort=xhigh / serviceTier=default**. No configuration/model changes or fallback. Parent's current coordination checkout is separate from the original8af integration/Maya custody; neither was written or executed in by this reviewer. The task ID is not inferred from a backing thread/run. No nested agents were started.

Both ignored dependency destinations were initially absent. Conditional APFS clones used only `/bin/cp -cR` after actual package/root/portal/runtime lock byte-mode parity, same device, nonsymlink root/ancestor checks, full source byte/mode/kind/literal-link inventory and all91 own tracked runtime inputs matching. All four physical own/Parent root/portal lock inputs matched; runtime package/lock and both retained node_modules lockfiles were additionally inventoried. No install, package/config/lock/flags/shim/declaration or dependency-content change occurred.

| Dependency input | SHA256 |
| --- | --- |
| Root lock, each checkout | `5c57c9aec9e4585066e032e234d610a77cbffd9a51f82700c158fc37fe01b5c2` |
| Portal lock, each checkout | `bc914f3a9c9f24e44f02e3cff2804651147385ea5abda58a064531329ef23203` |
| Runtime lock, each checkout | `4024b48fb339605a438a3bfe68f6e547dade8c86660c6f06b41c278aa2289ba0` |
| Complete root dependency entry inventory | `a1dd36bc0459af1c1ffbf953aca5d2bfdf1ac60356d93fdff9fb010c5daf8ef9` |
| Complete portal dependency entry inventory | `e9298a2dac4f9cb15e9b062d7474e4a08ac2f39cc2899bc7e73c6f7a9d2ba443` |

Full before-probe and terminal parity covers **43,213 root /9,071 portal entries including roots**. The reviewer inventory stores43,212/9,070 descendants, with roots separately checked. Literal `apps/portal/node_modules/shelv-advisor-session-candidate -> ../session-integration/runtime` resolves to own tracked runtime, never foreign generated source. `dependency-before.json`, `dependency-clone.json` and `final-protection.json` retain complete parity. Source parent dependencies were also rechecked unchanged at terminal. The first terminal verifier attempt lacked its own Python pathlib import and exited1 before any preservation claim; corrected verifier exits0. No product or dependency was changed for that harness issue.

Every **2,128 starting tracked file**, Git blob, physical byte and mode remains exact8af, including SQL, App/routes, shared transport, original tests, packages/locks/config and model-role pins. Only this new report is reviewer-authored tracked work. Ordinary hooks were inspected: samples only, no active hook or hooksPath bypass. Report scope/links/whitespace and report-only commit diff are checked before handoff. Parent imports **only this report commit**, no input ancestors.

## Prevented checks, unrun checks and integration gate

NEI1 prevents entry lifetime acceptance and consequent bounded Root composition/admission. Full original75, copied-independent4, strong161/frontend253, separate browser bundle and UI guard were **not rerun** after the finding; their results remain attributed, not waived or filtered. Source review continued through the complete candidate, API/type-test declarations, callback ownership, controller memory, role/recovery and actual dependency composition. No second distinct material source finding was established.

Full npm/Expo/root/package builds and heavy suites were centrally reserved and **not scheduled here**. Native DB/Auth/Storage/SQL/catalog/concurrency, socket/listener/server/browser/DOM, provider/delivery/webhook, process/resource adoption/reset, credential lookup, remote writes, real-client messages/publication/permissions/funds/orders/fulfillment, push/PR/comments/watch/merge/deploy and Guidance/M65 retry/rerouting were **not granted and not attempted**. No runtime/source/SSR count supplies those gates.

Required next gates: author corrects NEI1 while preserving the complete candidate and original regressions; fresh independent entry review; complete shared notification/generic/inventory R4 admission on its exact successor; coordinator's bounded actual Application/bell/sidebar/A06 mounting; real Back/focus/deep-link/React effects/browser/visual/accessibility checks; genuinely authorized persistence/permissions and local sink delivery; full configured checks, exact-head CI, human/business and separate release authorization. Shared transport R4, App mount, real browser and delivery remain unaccepted even if a future entry-only source pass succeeds. The original approved rebuild remains incomplete.
