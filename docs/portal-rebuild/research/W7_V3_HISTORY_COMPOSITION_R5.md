# W7 composed V3 client App and History restoration review R5

Owner: Kanuj. 1 November 2026 UTC. NEW independent source-first review, report only.

**Source specification/completeness: CHANGES REQUIRED at the replacement-reader ownership gate. Source correctness/quality: CHANGES REQUIRED, CH6/P3 below. CH5 is independently addressed within source scope. Browser: UNGRANTED and UNRUN.** No SourceReady or Chrome-ready declaration is issued. Dependent acceptance stops at the bounded source finding; no production correction is authored.

## CH6 / P3: cancellation of an outstanding predecessor retires the new reader

Owner: W0 App composition. [createHistoryUpdateReader](../../../apps/portal/src/app/client-composition.ts#L92) subscribes its new observer before calling `restoration.restore(null)`. The observer permanently sets `retired=true` on any `idle` state outside restoration. The actual [W4 restore](../../../apps/portal/src/features/history/controller.ts#L98) first cancels its predecessor. If that predecessor still owns an initial read, [cancelRestoration](../../../apps/portal/src/features/history/controller.ts#L32) truthfully publishes `idle/restoring:false` before the new restoration begins. The newly subscribed reader mistakes that predecessor cancellation for its own terminal retirement.

The new operation then fetches valid current data and publishes a current immutable `fresh` result. Its exact App scope and actual session boundary remain current, but the reader refuses admission and delivers no `onData`. A subsequent explicit `read()` dispatches no additional wire because `current()` is permanently false. Disposing the old reader afterward does not recover the new reader.

Independent reproduction uses actual ApplicationSession/cookie acquisition, fixed raw Review, strict Root positive mapping, actual W4/controller, App reader/scope and canonical navigator. Only finite synthetic HTTP and a structured-clone plain Window are supplied. No current predicate, port, readiness, restoration API, session clock or permission is replaced.

| Ordering | New source/current data | Admission / readiness | Required source control |
| --- | --- | --- | --- |
| Old initial read held; replacement in the same current scope before old cleanup | Scope/current boundary true; ready, no read error, one real page; immutable result current | false / 0 callbacks; retry wire count3 ->3 | Replacement earns its own admission |
| Same held read; actual same-path new canonical entry and fresh App scope before old cleanup | Same valid data/currentness | false / 0 callbacks; retry wire count3 ->3 | New entry earns fresh admission |
| Dispose the held predecessor before constructing replacement | Actual new reads succeed | true; both deliberate reads deliver readiness | Positive control passes |
| Predecessor completed before replacement; old cleanup occurs later | Actual new reads succeed | true; both deliberate reads deliver readiness | Positive control passes |

The first bounded run, repeat and command-recorded current replay each give **2 pass/2 intended admission failures**, child exit1. The exact `4f2` whole-reader input gives the same **2 pass/2 failures**: this is preexisting in the current CH4 reader lifetime logic, not a regression introduced by the CH5 predicate. E/CH6*.test.mjs, CH6-first/repeat/recorded-current/recorded-old4f2.log/json and COMMANDS-CH6.json preserve transitions, actual commands, result/basis and wire counts. No assertion is relaxed to turn either admission failure green.

**Applicability and impact bound:** this exercises the explicit adversarial replacement/late-cleanup source ownership requirement, extending the retained CH4 replacement control from a completed predecessor to an outstanding one. The production [HistoryUpdate effect](../../../apps/portal/src/app/ClientHistory.tsx#L56) normally disposes its prior reader before its replacement setup; that ordering is the passing control above. This review does **not** establish that ordinary mounted React/StrictMode reaches the overlapping ordering, nor an actual DOM liveness, focus, disclosure or unauthorized-write fault. The finding is a bounded source API ownership defect, classified P3 for that reason, rather than a claim that ordinary navigation always fails. If Parent intends to exclude overlapping readers, that lifecycle precondition and its actual composition proof need explicit assessment instead of treating the failed source ordering as exercised DOM.

Smallest response for W0 to assess: distinguish retirement of this reader's actual owner/context from cancellation notifications belonging to a predecessor, while retaining genuine end/mode/entry/session/denial fences. Do not force W4 currentness, change its error witnesses, weaken CH5 successful-data admission or reintroduce CH4's continuously pending-bound mount gate. No source fix or policy change is made by this reviewer.

## CH5 and previous dispositions

Both original R4 CH5 probes are **byte-identical** own working copies at the same relative depth. Only the complete module input changes for the old/current comparison. Exact `4f2` gives **1 pass/3 failures** and **3 pass/3 failures**. Current gives **4/4 and6/6**, then repeats **4/4 and6/6**. All are separate invocations with original predicates and finite HTTP unchanged.

The current private `dataReady` requires actual available basis, excludes `page_read_failed`, and checks ready/view/first page/no error/no loading/restoring before and after automatic start. The public reader API remains read/isAdmitted/startReport/dispose; no success flag or DTO/rights change. The22 author controls pass within the fresh208 aggregate, retaining truthful current immutable error witnesses, zero failed-read readiness callbacks, ordinary has-more and empty first pages, successful changed-basis fallback, saved prefix/extent, strict invalid-basis rejection and already-admitted offline/partial intent retention. Source data completion still supplies no DOM-commit proof.

| Subject | Specification/completeness | Correctness/quality and proof level |
| --- | --- | --- |
| CH1 cached historical cursor | Addressed in fresh source replay | Exact-old2/1 -> current3/3 twice; actual entry780/opener metadata, plain Window |
| CH2 unchanged typed helper | Addressed in fresh strict replay | Exact-old provider one TS2741; current/exact4bdb navigator zero; strong helpers compile |
| CH3 CJS/TLA wrapper | Addressed in fresh source replay | Old wrapper/current inner0/1; current wrapper1/1 and direct inner1/1, separate from208 |
| CH4 mutation/receipt lifetime | Retained intended source controls pass | Current23/23; exact6cde reader10 pass/13 fail includes12 semantic failures and one missing-new-API failure. No current DOM closure |
| CH5 initial error/partial admission | Addressed within source scope | Original old failures/current4+6 twice; author22 independently replayed within208 |
| CH6 outstanding predecessor/replacement | CHANGES REQUIRED, bounded source ownership | Repeated2/2 failures with cleanup-first/completed positives; mounted reachability unestablished |
| Full composed/browser acceptance | Not complete | No grant, SourceReady, browser or integration acceptance |

The additional own10-case exploration initially gives8 pass/2 fail. One retry setup omitted actual check-connection; adding the real ApplicationSession.restore step gives9 pass/1 overlap failure. Its held saved-continuation, six automatic-start reentrancy cases and onData canonical `/plan` retirement pass; CH6 isolates the remaining failure with controls. These are source controls, not unique independent product acceptance counts. Original failed explorations remain intact.

## Identity and live runtime

- Own NEW T3 worktree: `/Users/kanuj/.t3/worktrees/shelv/t3-1e73b6fc`, branch `t3/v3-history-composition-review`. Initial clean Parent **c329ee957b55e5ea12720ce15adc9a8891bfc0df**. Clean tested composed head **8ad7780bdda74693a250cd416c4e97a17da47a3f**.
- Authoritative taskId, explicitly confirmed by Parent: **node:delegated-task:command%3Amcp%3A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%3Adelegate-task%3Aportal-rebuild-w7-v3-history-composition-review-20261101-r5**.
- Backing threadId: **thread:delegated-task:command%3Amcp%3A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%3Adelegate-task%3Aportal-rebuild-w7-v3-history-composition-review-20261101-r5**.
- Actual runId: **run:thread:thread%3Adelegated-task%3Acommand%253Amcp%253A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%253Adelegate-task%253Aportal-rebuild-w7-v3-history-composition-review-20261101-r5:ordinal:1**, started **2026-11-01T03:41:07.502Z**. Live own readback establishes Parent `d632030a-18f7-4dec-a2c9-f5c0418c3fd5`, subagent relationship, project `ac0af19d-d404-4f53-a870-02bfd76c2a80` and this checkout. Task, backing thread and run are separate fields; none is inferred from another prefix.
- Initial and final **BOTH LIVE** catalogs/descriptors/configuration select **codex/gpt-6.1-sol/reasoningEffort=xhigh/serviceTier=default**, full-access/default. Supported descriptors list low/medium/high/xhigh/max/ultra and default/priority. INITIAL.json and T3-final.json preserve raw responses. No source-ready/pre-browser runtime is claimed because the source gate stops. Parent's requested/returned confirmation is separately retained in STEERING.json.
- Live registered shelv root is `/Users/kanuj/Documents/projects/shelv`; saved T3 defaultModelSelection is null. Effective child selection is explicit. Project/default-subagent and all eight role TOMLs parse as Sol/xhigh/max8; all nine initial/final hashes match. No nested delegation or configuration change.
- Source/install/test/compiler runners explicitly select **/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node**, actual **v22.23.0**. Own portal-only locked offline install uses npm ci --offline --ignore-scripts --no-audit --no-fund,130 packages. Initial read-only discovery precedes explicit Node selection; no Node test/compiler/runtime runs there. No Root installation or relaxed compiler/test/timeout/budget flags.
- Diagnostic/input-override opt-ins are unset, including W3_BUDGET_DIAGNOSTICS_DIR and the context/old-cookie controls. No telemetry browser case is run. Local origin/main remains `d39a7d4943209080df7c4cf97d85784f462758bf`; no fetch, remote CI check or moving Parent runtime is claimed. Parent723's supplied CI status is not current App acceptance.

## Exact allocated composition

All21 inputs import separately with cherry-pick -x, in authorized order, without conflict or semantic merge. These are review inputs, **not delivery commits**.

| Original input | Local attributed import |
| --- | --- |
| c91cb71ea2611b908ff9e1ec763008f22950b742 | 87bbc3f56a7d6ac979e21a7a81192180ad8dc0f9 |
| 05442a41b510e08acf7c59a6183973c9615a6b57 | 6611c42e05783bb5c27d631606f81d7b034c75e8 |
| 2262f97185818f76965ca14c18bf867e30cfd57d | 25f57ffe5dd02eae0b1094efe7ff53a1df595692 |
| 57f8b6391dbdc5fca8914c4269ef506c2e51a5f5 | dc6f47b3b0e026af0eaed454fa1bdf732624f951 |
| 83af53f8c4ae7e75ce4527becbfe8678281a1bac | c3ebe33a65921ae1d16b592eabcd6f35c455b0c1 |
| c6add5e5174dcab796ba4e66be68ee89b67fe488 | b0074fd852ab8e47a1443a6883b977ecee6f2afb |
| 57bff83485d6a566931003b631a25634710f8db8 | 21d5cc479a86751b9ee72461b94759243a97583e |
| f16363bea245d5986a1a20b67f5f2e6beb1e792b | 197f5a0ff64dc3c33673612623fc3fc6bdbfa167 |
| 56ffbdfd3bff9f6f4243a9c65ac851d7afe5038d | 32212a333a68bb572fe2e6f9190967dcbc66ef5a |
| 4bdbb55d520af71374d045856f19e1ef6c13b6ee | 189b70a9b1e6648bfcfedbc48b33a0722e1482b4 |
| fdd9030e193296e5b1303b3c7571a59e91810fba | e711c4a1309d47c1c153bbe65b1beb89ac4e7042 |
| b827779781ef564da483dd4f91b6ad24a16cb2b0 | 846fb4c715fdbad2f8a86b383fcdf2c386bb74d5 |
| 51dda75178390eee79e0a996b2fe3885a9de7b46 | 7db648cb8058dfeec438911613a13d273fc2ee94 |
| 9a4f99c32f6fb549a4423889efede4e3af2e884b | 8420ad80cf84f285660bbaba757b550c8a91b15f |
| 458405c8226fb865659e7dc683c67022ee5d8adc | 2d66e65ca3cf84e027d25e0c9dc21e215c2325f8 |
| 6cde9904d53d1d2c9f082dc16f10848d3790e94f | d04d574fc22e50fa037da620648c51649070af8a |
| a23d6db5fce945b919bc3f5de8ae0e97c3023e75 | 8f45881aa0eb8617259d551c824b04961af840cc |
| 573cdb7fdaf7dd48825c21429fb19e7e18547348 | c0905f8d14cfc33a0ae7dd9cb76bf5550655da9b |
| 4f2a9c01bef299c8edef7ac40fd1282339e65718 | 967b03537bcb8c08291aa81c71c946b9414709f2 |
| 9a40769b98adaa5dd677f406ce66dfad7eeb7311 | 5e41d53858c3d06c40dd4e54167eb154b066f3ca |
| d4c216d0b419a9d0ced365867c1ca4edcd424088 | 8ad7780bdda74693a250cd416c4e97a17da47a3f |

Dependency **4fce26a627c24d4aa29f9e5b5840ee7596f0c61b** is skipped only after proving Parent already contains exact153d self-compiling inner RPC blob **6d5b0b628c710994d08378b1d2dc6137bc5908b8**. No ancestor/other dependency, W2/Source/Commerce/private SDK/migration/native/runtime closure is imported.

All **40** imported paths match complete allocated target trees:12 W4 exact83af; current App/navigation/tests/report exactd4c216d0, with CH5 production exact9a40769b. All **1,845** other baseline tracked paths remain identical, including all62 migrations, Root/server/runtime/policy/private SDK/Auth/other features/packages/configuration/source assets/original tests. The full875 plan-feature tree matches. All46 non-overridden W3 ledger paths retain current Parent postimages. The two historical author test exceptions and newer Parent helper/report/telemetry inputs are retained, not downgraded to author copies or relabeled production. App client-state remains explicit **e4cb15994736a7698c2bdcdee532b2dc26fe0968**, not impossible dual equality.

All17c9 auth paths, RootReview4 exact96, sharedc26/shellEf7 and generation-awaref163 remain unchanged. AUDIT.json lists every path/ref/blob/SHA256 and27 named boundaries. Selected production blobs: client-composition **fd4076003adeefde863cf988be5d63aeb46fc6ae**, ClientHistory **ed1d2a363890766a8a4a8bc94b3520aadf91487d**, canonical history **7a034c8bcaf4ac74e453423f46fc70fbe753e229**. Byte equality is provenance, not authority.

All five original byte counts/SHA256 verify, including95,388-byte input and26-screen map. Full appendices A/B/C occur in the retained original; approved decisions/contracts, C01-C05/C07, secondary routes/auth/Back, CA1/F4/F5/R3-1/AR1, RH1/RH2 and shared UI govern. The supplied typo is recorded: saved focus/scroll uses actual saved extent and existing780 controls; no500x requirement is invented. Parent remains unintegrated Care2 for this candidate.

## Fresh source gates and evidence

E is `.local-artifacts/portal-rebuild/w7-v3-history-r5/` in this checkout. Own source tests use --experimental-strip-types --import ./tests/portal-review-no-network.mjs --test --test-concurrency=1. Actual source classes/controllers, finite HTTP, SSR and plain Window are distinguished from DOM. No full portal npm test/browser suite runs.

| Fresh check | Actual result | E record |
| --- | --- | --- |
| Original186 plus CH5 source22 | **208/208**,0 fail/skip/cancel | app208.log; COMMANDS.json |
| V3/History/report, restoration37 and IDs3 included | **198/198**,0 fail/skip/cancel | feature198.log |
| Cookie107 + deadline104 + raw requests45 | **256/256**,0 fail/skip/cancel | transport256.log |
| Residual source; admitted packaging | **25/25;5/5** | w3-residual25.log; w3-packaging-source.log |
| Original independent session; adjacent controls | **10/10;8/8** | independent-session10.log; adjacent8.log |
| Original CH5 old/current/repeat | **1 pass/3 fail and3 pass/3 fail ->4/4 and6/6 ->4/4 and6/6** | CH5-old/current/repeat-first4/repeat6.log/json |
| CH1 exactold/current/current repeat | **2/1 ->3/0 ->3/0** | CH1-*.log |
| Exactold canonical requirement/default positive | **1 pass/1 intended failure**; current opted-in/default controls pass | canonical-old-red.log; CH1-current-green.log |
| CH2 old provider/current/exact4bdb | **One TS2741 ->0 ->0**, exits1/0/0 | CH2-*.log |
| CH3 old wrapper/current wrapper/direct inner | **0/1;1/1;1/1**, separate scopes | CH3-*.log |
| CH4 exactold6cde/current | **10 pass/13 fail ->23/23** | CH4-old-source-red/current-source-green.log |
| New bounded CH6 current repeats/exactold4f2 | **2 pass/2 fail each**, child exit1 | CH6-*.log/json; COMMANDS-CH6.json |
| Strong unchanged context/residual/original/forbidden/CH4/CH5 helpers | **Exit0**, zero diagnostics; strict/noUnchecked/verbatim/skip:false | strict-helper.log |
| Frontend/session/UI | **All exit0**, zero diagnostics;11 stylesheets | strict-frontend/session.log; ui.log |
| Clean actual main App write:false build | **2,231 inputs/15 outputs**, sourceDirty:false at8ad7780b | application-source-build-provenance.json; application-source-build-metafile.json |
| Correspondence with author clean CH5 build | **All2,231 input/15 output hashes equal** | AUDIT.json; frozen-w0-ch5/final-clean-app-build.json |

Counts overlap. The208 aggregate is freshly executed but is not208 unique independent behaviors. Exact expanded argv/env/child exits are in check-plan.json, COMMANDS.json and COMMANDS-CH6.json. The source runner is node E/run.mjs. Own original predicates/strict hosts keep all assertions/options; working bindings only update evidence entry/output paths and source-run labels. Whole-old-input loaders substitute exact immutable modules at their real URLs, never predicates or production files.

SETUP-QUALIFICATIONS.json retains the initial missing threadId call, bounded-output/absent optional path reads, own omitted connection-restoration step, trailing CH6 draft count correction and audit auth/helper/index-format binding faults. The same admission assertions fail before and after the trailing count correction. No production/original-test/assertion/flag/timeout/response/clock/current/permission change makes a current acceptance check pass. Existing typeless-package and compile-only Root Expo-config warnings remain unsuppressed.

## Historical browser limits and terminal custody

Full frozen R1-R4 reports, W0 responses and named raw CH4/CH5 evidence are retained read-only. R4 reportff537579 remains its original CHANGES REQUIRED. Earlier failed overall verdicts are not overwritten by CH1-CH5 source dispositions. The author CH4 old two-App-input0/3 -> current3/3 plus adjacent10 remains **attributed historical DOM evidence**, not current R5 DOM closure.

- Both late-route timeouts waited for `/plan?routine=morning`; actual canonical serialization is `/plan`. Timeout cleanup preceded actual destination URL/DOM/late-wire preservation. The corrected observer was only checked/compiled. Actual arrival/liveness/late callbacks remain unestablished, neither current PASS nor demonstrated production timeout fault.
- Held-write200 did not advance that mutable synthetic backend model head. Next deliberate UI/new UUID/body is not next-revision/concurrency or SQL proof.
- Button focus does not prove an outstanding canonical rAF. Pending-A403, late clinical status, natural idle/absolute expiry, full owner/navigation/saved-extent DOM and viewport matrices remain unaccepted. Existing Select/cookie reachability and original failed attempts retain their limits.

All **2,793** copied original/report pairs rehash unchanged. Ten list indexes verify, including author2786 and prior2708/2633/2496/1127/502; nested object-format raw indexes remain preserved by their containing indexes/copy hashes. Source/index hashes are recorded in AUDIT.json and foreign-copies.json. No foreign script/generated bundle/compiler output is executed as current code; reviewed own working probes compile against this checkout and own locked dependencies.

E/EVIDENCE.json contains **2892 entries**, SHA256 **1aee425dd16812ac74fba8014ba0286d1ba29a25e4652f55c493e737577e07f8**, excluding itself, this tracked report and later FINAL-HANDOFF.json. Final report commit, sole changed path, clean status, final pin/source correspondence and receipt hashes are bound after commit in that excluded handoff. **Import only the report commit, not its21 attributed ancestors.**

No SourceReady/browser wait is pending: the source gate stops at CH6. No Chrome/browser/DOM/preview/process inventory/native/DB/Auth/provider/credential/SourceStorage/fixture/resource call, grant/poll, nested work or borrowed lane occurs. No resource is acquired; no invented RETURN/empty process inventory is produced. Own finite command handles are terminal.

UNRUN: actual Application DOM/StrictMode/served browser bytes/physical focus/scroll/native Back/Forward/privacy/Select/dialog/keyboard/48px/CSSzoom/1440/1280/390/320 matrix; full Root npm/types/test-types/Expo/iOS; full portal/session/runtime/emitting packages; genuine cookie/Vault/Auth/Edge/PostgREST/SQL/Storage/RLS/migration/reset/pgTAP; Source lifecycle/deletion, finance/delivery/providers, hosted/exact-head CI/human/release/full-goal acceptance. Parent's separate grants, packages or CI confer no authority here. Blocked Commerce/provider work is not continued, rephrased or rerouted.

Only this NEW report is reviewer-authored tracked delivery. No production/original-test fix, runtime/Root/grant/policy change, Parent integration/default activation, push/PR/merge/deploy or live client/source/permission/message/funds/retailer action. Parent owns the bounded ownership response, any exact successor/new independent review and any separately granted browser phase. **The entire approved goal remains active.**
