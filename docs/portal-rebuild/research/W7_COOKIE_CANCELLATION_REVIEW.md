# W7 shared-cookie cancellation independent source review, R1

31 October 2026. Report-only review. **T1 is addressed in the exercised source composition. The complete bounded specification requires changes for CK1 and CK2 below.** Both remaining behaviors also reproduce with the exact base inputs; neither is reported as a newly introduced regression. No browser, genuine server, private-value disclosure, clinical-operation failure or full-goal acceptance is established.

## Separate verdicts

| Subject | Specification | Correctness / quality | Boundary |
| --- | --- | --- | --- |
| Original T1 caller-aborted HTTP200 JSON body | **PASS, scoped** | **PASS, scoped** | Original producer adapted only to actual parent raw/Root composition: base0/1, candidate1/1. Shared cookie stays ready; following Review and Care Stop reach finite HTTP and positively map. |
| Known HTTP status after body cancellation | **CHANGES REQUIRED, CK1/P2** | **CHANGES REQUIRED** | Caller-first cancellation works. Deadline-first cancellation of an already received401/403 is incorrectly converted to503/offline. |
| Late successful value after internal deadline | **CHANGES REQUIRED, CK2/P3 source guarantee** | **CHANGES REQUIRED within the signal-ignoring seam** | Candidate forwards success after its own abort when the supplied finite response ignores that abort. Ordinary default-fetch/browser reachability is unproved. |
| Other examined preservation requirements | **PASS within exercised source cases** | **PASS within exercised source cases** | Author107, retained45/197/34, strict types/build and independent controls below. This is not complete portal/runtime/browser acceptance. |

CK1 alone prevents an unqualified source-specification PASS. CK2 is a lower-confidence operational risk with a concrete source counterexample, not evidence of a genuine leak. T1's scoped closure remains valid regardless of these separate deadline results.

## Identity, exact imports and runtime

- Own T3-bound workspace: `/Users/kanuj/.t3/worktrees/shelv/t3-0ce6270f`; branch `t3/cookie-cancellation-review`. Initially clean. Actual base **`8a463112350bfe87052e569ae465a4c4dbb56797`**, immediately above **`c26cbc999b00e4c3f132f243b23285849681b7a6`** and73539409. No new checkout or nested task was created.
- Imported only **`9e449f51242065f903848a6fd9a15cc2501bfc1a`**, then **`ac83b3d70332d458fe620d4c1c089deacd6a2657`**, as **`092d0d81915a47e5ae0af53fdc87f1dc08bad8dd`** and **`b0152054b9d598773ff5f08d57978a99bc9dedf0`**. The latter is the tested source head. All five imported runtime/test/report blobs equal exactac83. No other author stack, W3 feature, SDK, runtime or SQL source was imported.
- Task: `node:delegated-task:command%3Amcp%3A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%3Adelegate-task%3Aportal-rebuild-w7-cookie-cancellation-review-20261031-r1`.
- Thread: `thread:delegated-task:command%3Amcp%3A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%3Adelegate-task%3Aportal-rebuild-w7-cookie-cancellation-review-20261031-r1`.
- Run: `run:thread:thread%3Adelegated-task%3Acommand%253Amcp%253A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%253Adelegate-task%253Aportal-rebuild-w7-cookie-cancellation-review-20261031-r1:ordinal:1`, started **20:57:35.363 UTC**. Live thread read confirms parent **`d632030a-18f7-4dec-a2c9-f5c0418c3fd5`**, subagent relationship, workspace and branch. The catalog's `parentThreadId` field returned this child ID; it was not used as parent-lineage evidence.
- Initial and final live `orchestrator_capabilities` and `t3_thread_configuration` independently confirm **codex / gpt-6.1-sol / reasoningEffort=xhigh / serviceTier=default**, full-access/default interaction. Selected-model descriptors advertise xhigh/default. Parsed project/default-subagent plus all eight role TOMLs agree; all nine original hashes remain unchanged.
- Every Node/npm/compiler invocation selects `/Users/kanuj/.nvm/versions/node/v22.23.0/bin` first; actual **v22.23.0**. Own portal-only `npm ci --offline --ignore-scripts --no-audit --no-fund` installed130 packages from the unchanged lockfile. No Root install or compiler/config/budget relaxation. Root node_modules is absent.
- Existing local origin/main is `d39a7d4943209080df7c4cf97d85784f462758bf`; source-head divergence246/0. No network fetch; remote freshness is not claimed.

Read applicable AGENTS, rebuild entry point, approved decisions/full desktop specification, implementation contracts, workstreams/status/acceptance, the full [W0 response](W0_COOKIE_CANCELLATION_FIX.md), the copied complete399-line W3 source/browser report including G1/G2/ordinal4, original T1 producer/results/logs and C1/AR1 status-recovery boundaries. Applied verification-before-completion guidance. The narrower report-only allocation preserves coordinator-owned status/TASKS/CONTEXT_SYNC.

## Source correspondence and inspection

| Exactac83 input | Git blob | SHA256 |
| --- | --- | --- |
| advisor-cookie-session.js | `00b0dd78354ce5d4a62ee5d31a3a20346e6c8f8a` | `e5e51361a751affc936ee84e546a40a3bf40dadb42b4b4cdbb410bce9cd444e5` |
| client-cookie-session.js | `e4275e83c66ed9c6b1a0a5523cbdb5af3955959a` | `71ef619ece120593a6d3d7b13dc404955dc57daf533b50646d0d42e733c5f770` |
| new cancellation helper | `21d9cf05463f99d9a512f77620523aa62c0908e1` | `2c5f333bff13e84476eee07f612ac94ba27b51eaa5387d2a2ef45b40870e20dd` |
| new107 tests | `ec88fd86cd779f939b912e8669446d173dc92a4a` | `208f127e3f5c5fe473ba64a3c2776b30db7cb9eeee007b93d2ffad558717125a` |
| W0 report | `f119f6052aee86e200baa4abaecedccd78657438` | `542573d6575a2629b3388342f0033962e4240f9d43cee47512b56e6b3f0bc447` |

Inspected both entire cookie modules, their action/navigation metadata, generic/typed/legacy/photo/multipart factories, retained TypeScript facade, actual ApplicationSession, session transport, raw client/advisor Review/Guidance factories, Care/app ports and canonical Root command/positive-response paths. No successful port or current/source predicate is replaced. Source changes are the first-abort provenance, standard typed pre-abort, known-HTTP caller-abort branch, late caller-success fence and photo's narrow caller AbortError exception.

All1766 other base tracked files remain blob-identical, including every old test, all source contracts, App/defaults, Root/backend/SQL/server/policy/crypto/Vault/key/storage/logout/lease implementations and model pins. The four Root Review blobs remain `028e6bf3bb293e68a60e472b3b6ee87f522ee3c3`, `c1e2191cfd0c0b015c31c6e1e4d8066d199d8dd9`, `997afba2c0b1dd3daf129913d3c2b28d27ed5f71`, `917b81da881ae8e091c2414ff4864fa936367bbd`. This is source preservation, not an inspection or rerun of the parent native87/policy6b fixture.

## T1 and original evidence preservation

Own ignored root: `.local-artifacts/portal-rebuild/w7-cookie-cancellation/`. Read/copied original inputs only from the author's private retained `w0-cookie-cancellation/original/`; no command executed in either foreign checkout and nothing there was written. Both original and own-copy hashes were rechecked. `copies.json` records every path/size/hash:

- Original W3 producer: `46c2444b43028185ce5b962880faf9f6f69a043ce9dd9f837e284bdce1c50a3d`.
- Original result JSON: `885319609d1470d0f9c139989b4ca3ae9b7208d98947a321762a7a3962a2494c`.
- Original log / Care log: `cf79a98c573d97d56312cdaca8f68f1dde8112535098fed80bba23b59af803b2` / `0298d447d14fe1d6f4c9850e9b2f254e8c3953c4388b0189f85c0e179e96883b`.
- Complete W3 source/browser report: `7cc327b49f77b65527d72e2c2bf5aa2576d7b46e45a42074bf8c7be005519b12`.

The original uses a W3-only feature absent from the actual parent. Own `adapted-original-t1.mjs` substitutes the actual raw Review factory plus unchanged Root parser/mapper, a canonical preparation DTO, a finite Care receipt/fixed product reference and own output path. It does not import that feature stack or fabricate permission. The newly reachable Care branch demonstrates transport/mapper behavior only; a preparation DTO is not a backend authorization for Stop.

Exact-base inputs produce **0/1**: body AbortError becomes503, cookie offline, following Review503 and Care503/uncertain with only the original read emitted. The resulting observation is byte-identical to the original W3 JSON. Candidate gives **1/1**: cookie ready, following Review200, strict Care receipt and three actual finite requests. Author's checked-in T1 independently gives the same base0/current1. These are HTTP200 partial-JSON/caller-cancellation sequences, not network loss, server revocation or clinical-operation failure.

Own `load-base.mjs` substitutes only the two exact `git show 8a463112:...cookie-session.js` inputs at their original module URLs. Those inputs equalc26. All other current dependencies stay actual. No tracked file is overwritten. The unchanged author107 becomes **71 pass/36 fail** at base and **107/107** at candidate.

Preserved author raw RED artifacts are separately copied/hash-bound in `author-red-copies.json`. Initial new97 setup has **62 pass/35 fail/1 cancelled** across98 reported tests, with six invalid relogin controls after ApplicationSession.signOut disposed its transport, unhandled rejections and a file timeout. Corrected pre-edit97 is **68 pass/29 fail/0 cancelled**. The additional known-HTTP caller-canceled-body check is **0/9** against the first candidate, then passes in final107. These are historical author observations, not newly executed W7 RED or proof of all post-HTTP cancellation cases.

## CK1 / P2: known401/403 becomes503 when the body deadline fires first

Location: [advisor-cookie-session.js](../../../apps/portal/site/auth/advisor-cookie-session.js), `_transport` lines96-113, especially99. The new status-preserving body catch requires **callerAborted**, which remains false when the internal timer caused the first abort.

Concrete sequence through actual ApplicationSession/raw Review: receive a native Response with HTTP401 or403 and a partial JSON stream; wait until response.json consumes the prefix; let the actual20ms transport deadline abort the supplied signal; the stream errors with standard AbortError. A later caller abort is optional and does not change the result. **Both audiences return TransportError503/rejected and cookie offline.** Expected under the review brief's known-HTTP rule:401/session-ended/signedout or403/rejected/ready. The code already knows the HTTP status before consuming that body; no fabricated server revocation is involved.

Eight independent assertions fail:401/403 × client/advisor × absent/late caller. Four503 controls pass. `post-http-current.json` additionally records all16 HTTP200/401/403/503 × caller/deadline × client/advisor outcomes. Current controls show caller-first401 ends, caller-first403 denies without suspension, known503 stays offline and HTTP200 internal deadline still becomes503/offline. The base observation shows this is a retained hole, not a new regression introduced byac83.

Impact is incorrect current-denial classification and shared availability state: a received401 is not retired as session-ended;403 unnecessarily suspends other channels. No private response is returned, and this does not establish an authorization bypass. Preserve the known status on canceled error-body consumption while retaining HTTP200 deadline/network/malformed failures as503. No force-ready, restore workaround, retry or server-policy change is warranted. The author's107 covers caller-aborted known HTTP bodies but misses this deadline-first crossing.

## CK2 / P3: internal-aborted late200 has no final deadline fence

Location: the same `_transport`, lines84 and105-106. The timer aborts the controller but never sets callerAborted. The final successful-value check tests only callerAborted.

Concrete finite-source counterexample: native HTTP200 Response/ReadableStream consumes a JSON prefix, observes the actual internal abort but deliberately ignores it, then completes valid JSON. Both actual client/advisor raw requests **resolve `{status:'absent'}` and leave the cookie ready**, after the abort has been observed. The two intended rejection assertions fail; `late-deadline-current.json` preserves the client observation. The exact-base inputs do the same. No private value is present in this probe.

This violates the stated bounded late-success/deadline guarantee at the supported injected-fetcher seam. It is **not proof that ordinary global fetch in a browser ignores AbortSignal**, nor evidence of a genuine private-value leak. Caller-aborted signal-ignoring success is correctly rejected, and normal signal-honoring internal abort correctly suspends503. Completing the deadline fence should preserve those controls and the CK1 known-HTTP distinction. Broader browser reachability remains unknown and was not sought in this allocation.

## Independent controls, counts and commands

The independently authored `review.test.mjs` uses its own finite router/stream latches/login setup and actual application, factories, transport and Root positive mapping. It does not import the author's helper. Final **178 cases:168 pass/10 fail**,0 skipped/cancelled; ten failures are exactly CK1's eight and CK2's two. Input-only base gives **127 pass/51 fail**. Counts overlap mechanisms and are not added into an acceptance score.

Passing controls cover pre-fetch/fetch/body/late caller cancellation; real TypeError, malformed JSON, non-JSON and non200401/403/503; first-caller/first-deadline ordering; direct typed and legacy client/advisor factories; photo and both allowed multipart families; owner/CSRF replacement, actual cookie signOut/restore epochs/generations, old success/error/abort and known-HTTP late bodies; current-role negative inputs; original UUID/CAS/raw mixed-case UUID bytes; READ status versus uncertain writes; explicit exact retry and following real-source Review/Care egress. No automatic retry/new UUID occurs. Artificial role-property negatives all reject401; they do not establish genuine role revocation or another material finding. The exact-session/lease checks remain the authority.

| Fresh W7 check | Result |
| --- | --- |
| Author new107 |107/107,0 skips/cancelled |
| Exact-base author107 sensitivity |71 pass/36 fail,0 skips/cancelled |
| Original adapted T1 and checked-in T1 |Each base0/1, current1/1 |
| Final independent178 |168 pass/10 fail; exact-base127 pass/51 fail |
| Unchanged raw request suites |45/45, including retained12 client requests |
| Unchanged session/app/ports/transport/advisor suites |197/197, including C1/AR1 source controls |
| Actual Plan/Care/Review-Guidance runtime-source files |34/34, no59/full-runtime claim |
| typecheck:rebuild / typecheck:session |Both exit0 with unchanged strict configurations |
| build:application |Exit0; sourceHeadb0152054, sourceDirty:false, gatewayIncluded:false |
| Actual Gateway / combined Gateway / Vault write:false compile closures |27/29/51 inputs; neither changed client JS adapter appears |

All commands select the explicit Node22 PATH above. `checks.json`, `sensitivity.json` and `final-independent.json` retain expanded argv/cwd/exits/timings. Reproducible commands from this checkout:

```sh
export PATH=/Users/kanuj/.nvm/versions/node/v22.23.0/bin:$PATH
node --experimental-strip-types --test --test-concurrency=1 --test-timeout=3000 .local-artifacts/portal-rebuild/w7-cookie-cancellation/review.test.mjs
node --experimental-strip-types --import ./.local-artifacts/portal-rebuild/w7-cookie-cancellation/load-base.mjs --test --test-concurrency=1 --test-timeout=3000 .local-artifacts/portal-rebuild/w7-cookie-cancellation/review.test.mjs
node --experimental-strip-types --test --test-concurrency=1 --test-timeout=10000 apps/portal/tests/rebuild-cookie-cancellation.test.mjs
node --experimental-strip-types --test --test-concurrency=1 --test-timeout=10000 apps/portal/tests/rebuild-{review-request,review-guidance-request}.test.mjs
node --experimental-strip-types --test --test-concurrency=1 --test-timeout=10000 apps/portal/tests/rebuild-{app-session,app-ports,app-care-composition,care-ports,foundation-transport,advisor-app-integration,advisor-approval-authority,advisor-status-recovery}.test.mjs
node .local-artifacts/portal-rebuild/w7-cookie-cancellation/compile.mjs
node --test --test-concurrency=1 .local-artifacts/portal-rebuild/w7-cookie-cancellation/{plan-channel,care-channel,review-guidance-channel}.test.mjs
npm --prefix apps/portal run typecheck:rebuild
npm --prefix apps/portal run typecheck:session
npm --prefix apps/portal run build:application
```

The three runtime-source tests bundle actual installed dependencies under their unchanged runtime tsconfig, with original import.meta.url values retained for fixtures. They execute only finite in-memory gateway/provider/Vault components. No runtime/native process or real provider call is launched. Native build-closure inspection uses actual entry points and write:false; no claim about a running native fixture follows.

Own raw setup qualifications are preserved. Initial independent142 was97/45: mixed-case UUID was incorrectly expected to survive canonical Care parsing, so valid Root normalization broke the synthetic receipt/following controls; three unrelated AbortError controls incorrectly attached a coincident caller abort; six artificial role-mutation error cases incorrectly expected ready for an invalid role. Correcting only those own inputs/assertions gives142/142 before adding deadline probes. The final separate raw-wire test still requires exact mixed-case bytes through the unverified raw seam. Earlier157 is147/10 and final178 adds21 passing stale-known-HTTP/advisor-legacy controls. These setup results are not product RED. Initial filesystem searches named nonexistent generic transport/runtime-test paths; inspection moved to actual files. Existing Root typeless-package and missing expo/tsconfig.base compile-closure warnings remain unsuppressed. No flag weakening or production/test edit followed any failure.

## Evidence, custody and terminal handoff

`scope.json` SHA256 **`4e54f7e7daf72ff744391d1e528b2b08836a6cf699092fa7a00245305998c34a`** binds the exact source/blobs and all1766 preserved base paths. Own74-file `evidence.json` SHA256 **`d2de1d77e3fb8e5a675ed3b832fe0fd5db1629a0c862278a9bf0233df72d2cef`** inventories original copies, raw setup/RED/current logs, source probes, metadata, compiler artifacts and closures; it excludes itself and final handoff. Selected hashes:

| Own evidence | SHA256 |
| --- | --- |
| independent178 source |`3008653a20bab133c7ce52b1efb791906d751b7a6ce41f94b0074ba2504445ab` |
| independent178 current / base log |`ff3e7d3d1b4f4835de242a1ec0e3eafe8b2bdfa4d8bb5847fa022d1ecf38b7b8` / `233221426d339a85f97098809352e923f033749ea9cc3639fe28b8d284c191f0` |
| post-HTTP current observation |`9838acdd540d2dbfe17900e4592faa4b8c30125179be85395c320d9cea41a7ef` |
| late-deadline current observation |`9de7c289dc554b176da565adf658a47aa7e38935388bd0635117a06291fd2084` |
| adapted original T1 producer |`97d728cd5cdf6925699c8a0cae2e0e08949e0a17212d5076a747f6fa8701405b` |
| adapted original T1 base / current JSON |`885319609d1470d0f9c139989b4ca3ae9b7208d98947a321762a7a3962a2494c` / `21321952a6238008e6d5c906cb5b37a19bc4aafa91d165f17cd51625442a1236` |
| runtime-source34 / compile closure |`288c370a3c4890c54afb7565e506cb427f42de6700acab0433f3a93c15b0c169` / `9b0c87e0bac2b89a0f81771e9bb03cab4ee5abf8f0cf54d85ed68dad9685ee97` |

No browser/Chrome/DOM/preview/process inventory, PG/DB/Docker/Auth/credential/fixture/native/provider resource was acquired, polled, borrowed or retained. W7 History R3's Chrome and Root R9's Node grants confer no access here. All own finite source commands are terminal. No actual cookie-browser enforcement or genuine source write is claimed. Parent native87/policy6b/R9 were neither imported nor touched; server closure preservation is source evidence only.

Skipped: full Root npm/types/test-types/Expo/iOS, full portal/session/runtime/Miniflare/browser suites, actual Application DOM activation, W3 new20/retained117 rerun, genuine current Gateway/Vault/Auth/Edge/PostgREST/SQL/Storage, migrations/reset/pgTAP/RLS, hosted behavior, visual/accessibility/human and exact-head CI. Prior C1/AR1, core care, original W3 G qualifications and Select/S1 remain at their own recorded proof levels. W3 ordinal4 stays19/20 until a separately granted composed rerun and NEW independent review. Neither this scoped T1 PASS nor the other green source checks recertifies App/genuine/current-server/full-goal acceptance.

The only newly authored tracked file is this report. Its report-only commit is returned in the terminal answer and own excluded FINAL-HANDOFF.json; do not import the review branch's ancestor imports again. Coordinator should resolve CK1 and the bounded CK2 guarantee, then commission a fresh NEW review with these counterexamples and controls. No source/test fix, forceReady/automatic restore/retry/source-predicate workaround, push, PR, merge, deployment, live client/source/permission/communication/funds/retailer action. Source phase is terminal; no wait for an ungranted resource remains.
