# W0 shared-cookie caller-cancellation fix

31 October 2026. Author source verification only. T1 reproduces before the fix and passes afterward through the actual ApplicationSession, retained cookie classes, request factories, application transport, Root Review parser/mapper and Care port. No browser, genuine backend, independent-review, full-goal or release acceptance is issued.

## Identity and exact source

- T3-owned workspace: `/Users/kanuj/.t3/worktrees/shelv/t3-2d6813cc`; branch `t3/fix-cookie-abort-suspension`. Already attached and initially clean; no additional worktree, nested task or checkout was created.
- Verified base: **`c26cbc999b00e4c3f132f243b23285849681b7a6`**, directly above `73539409`. Early coherent code/tests commit: **`9e449f51242065f903848a6fd9a15cc2501bfc1a`**. The terminal answer returns the later report-only head. No production/test bytes change after this code commit.
- Task: `node:delegated-task:command%3Amcp%3A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%3Adelegate-task%3Aportal-rebuild-w0-cookie-cancellation-fix-20261031-r1`, verified against the coordinator's read-only TASKS registry.
- Thread: `thread:delegated-task:command%3Amcp%3A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%3Adelegate-task%3Aportal-rebuild-w0-cookie-cancellation-fix-20261031-r1`.
- Run: `run:thread:thread%3Adelegated-task%3Acommand%253Amcp%253A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%253Adelegate-task%253Aportal-rebuild-w0-cookie-cancellation-fix-20261031-r1:ordinal:1`, started **20:44:02.182 UTC**. Parent: `d632030a-18f7-4dec-a2c9-f5c0418c3fd5`.
- Initial and final live `orchestrator_capabilities(search:"gpt-6.1-sol")` and `t3_thread_configuration` confirm **codex / gpt-6.1-sol / reasoningEffort=xhigh / serviceTier=default**, full-access/default interaction. The selected model's live descriptors support xhigh/default. Project/default-subagent and all eight role TOMLs parse as Sol/xhigh; all nine file hashes remain identical.
- Every Node/npm/compiler invocation selects `/Users/kanuj/.nvm/versions/node/v22.23.0/bin`; actual **v22.23.0**. Portal-only `npm ci --offline --ignore-scripts --no-audit --no-fund` installed130 packages from its unchanged lockfile. No Root install, config, compiler-flag, dependency or budget change.
- Inspected the existing `origin/main` ref at `d39a7d4943209080df7c4cf97d85784f462758bf`, with initial `HEAD...origin/main=243 0`. No network fetch was performed in this source-only lane; no claim of freshly fetched remote state.

Applied systematic debugging, source TDD, worktree-isolation and verification-before-completion guidance. Read applicable AGENTS, approved rebuild decisions/specification/contracts/workstreams/status/acceptance, scoped auth/application/transport source, C1/AR1 correction and review boundaries, and the complete W3 source/browser report including ordinal4/T1. The user's narrower write-set governs: canonical status, TASKS and CONTEXT_SYNC remain coordinator-owned and unchanged.

## Reproduction and provenance

Original W3 inputs were read/copied only from `/Users/kanuj/.t3/worktrees/shelv/t3-1026ad5d`; no command ran in that checkout and nothing there was written. Own evidence root is `.local-artifacts/portal-rebuild/w0-cookie-cancellation/`.

`original/` preserves the actual producer, JSON, both logs and full W3 report byte-for-byte. `COPIES.json` records source/destination/size/SHA256 and was reverified against both original and copy after source work:

| Original input | SHA256 |
| --- | --- |
| `crossowner-aborted-json.mjs` | `46c2444b43028185ce5b962880faf9f6f69a043ce9dd9f837e284bdce1c50a3d` |
| `crossowner-aborted-json.json` | `885319609d1470d0f9c139989b4ca3ae9b7208d98947a321762a7a3962a2494c` |
| `crossowner-aborted-json.log` | `cf79a98c573d97d56312cdaca8f68f1dde8112535098fed80bba23b59af803b2` |
| `crossowner-aborted-json-care.log` | `0298d447d14fe1d6f4c9850e9b2f254e8c3953c4388b0189f85c0e179e96883b` |
| `W3_V3_GUIDANCE.md` | `7cc327b49f77b65527d72e2c2bf5aa2576d7b46e45a42074bf8c7be005519b12` |

The checked-in T1 test first ran against unchanged production. Native `Response`/`ReadableStream` delivers an HTTP200 JSON prefix; a zero-high-water-mark pull establishes pending JSON consumption, then the actual propagated caller signal errors that stream with AbortError. Observed cookie **offline**, following Review **503**, Care Stop **503/uncertain**, and a wire list containing only the original Review request. Both later failures occur before egress. `T1-RED-CORRECTED.json` retains that observation.

Current source has no W3 feature stack. The own `adapted-t1.mjs` therefore replaces only that feature import/composition with this checkout's actual `createClientReviewRequest`, unchanged Root parsing/positive mapping and a valid Root preparation DTO; it adds a finite positive Care receipt for the newly reachable branch and redirects output locally. It never copies a Root SDK or forces a session/current/source predicate. SHA256: **`adaf154aa9b5fe5b026bd3110f4c47be9b283ba25a82f537d0e12cec31238d45`**. The original remains unchanged beside it.

The adapted producer gives **0/1** against the exact base cookie inputs, then **1/1** against current source. Current T1 records cookie **ready**, the identical still-current lease/generation/application boundary, a positively mapped following Review response, and an actual Care Stop command/strictly mapped receipt with three total requests. These are synthetic finite DTO/egress observations, not proof of a backend granting care to a preparation-state client.

`load-frozen-cookie.mjs` supplies only the two exact `git show c26cbc99:...cookie-session.js` inputs to Node's loader, preserving their original module URLs and all other current source. It performs no tracked overwrite, successful-port substitution, role fabrication or predicate patch. The final unchanged107-test harness gives **71 pass /36 intended failures /0 skipped /0 cancelled** with those base inputs. This final frozen sensitivity is separate from the actual pre-edit RED.

## Minimal runtime change

Only [advisor-cookie-session.js](../../../apps/portal/site/auth/advisor-cookie-session.js) and [client-cookie-session.js](../../../apps/portal/site/auth/client-cookie-session.js) change runtime behavior.

1. `_transport` records whether the caller caused the **first** abort. Its internal deadline still produces network-unavailable503, including when a caller abort arrives afterward. JSON consumption can preserve a caller-caused standard AbortError instead of masking it as CookieSessionError503. Unrelated TypeError/SyntaxError failures still normalize to503 even when the caller's signal is also aborted.
2. A known non-success HTTP response retains its status when its JSON body is canceled. Current401 still ends the session;403 remains denied;503 still suspends. A signal-ignoring late HTTP200 success is rejected after JSON consumption. No aborted request returns its private value.
3. Typed Review/Guidance pre-aborts throw standard AbortError before fetch instead of a shared-session-suspending503. Other transport pre-aborts also have zero egress.
4. The photo wrapper exempts only a caller-signal standard AbortError from its statusless-error suspension rule. Ordinary unavailable503/network errors and stale-lease fences remain. Multipart wrappers already suspend only status503 and inherit the corrected transport distinction without an extra production edit.

Existing generic factory lease checks still run before success or error handling. Superseded owner/CSRF/local epoch/generation and logout cannot deliver an old private value or retire a newer lease. Old finally cleanup cannot abort the new operation. There is no readiness assignment, restore workaround, global public-mode toggle, source-permission change or altered current predicate.

Application transport semantics are unchanged: canceled reads reject503; interrupted writes remain503/uncertain, never falsely saved. Status is READ. The original request UUID, CAS and serialized wire remain available for an explicit status lookup or exact retry, with no automatic retry/new UUID. Public restore remains the recovery path for genuine offline errors. Existing JSON/GET/POST selection, same-origin/CSRF/no-store/redirect constraints,500000-byte typed budgets,100000-byte legacy budgets, multipart allowlists/file limits and actions are unchanged.

No export or public signature changes. Existing CookieAdvisorSession/CookieClientSession/createCookieRequest/createClientCookieRequest/createClientPhotoUpload callers keep their APIs. No Application/default/Root/SQL/policy/crypto/Vault/identity/storage/key/logout/lease/action/business/UI/CSS behavior is authored here.

## Tests and actual results

New [regressions](../../../apps/portal/tests/rebuild-cookie-cancellation.test.mjs) and a narrow new [finite HTTP helper](../../../apps/portal/tests/rebuild-cookie-cancellation-helper.mjs) execute real source. No existing test or assertion is edited.

| Check | Result and qualification |
| --- | --- |
| Actual pre-edit corrected97 matrix | **68 pass /29 fail**,0 skipped/cancelled. Intended body-abort, pre-abort, late-error provenance, write and photo/multipart failures. |
| First minimal candidate97 | **97/97**. |
| Additional known HTTP401/403/503 canceled-body controls | First candidate **0/9** before the bounded HTTP-status correction; final source passes all nine. |
| Final new matrix | **107/107**,0 failures/skips/cancellations. Client Review, advisor Review/Guidance, pre-fetch/fetch/body/late success, genuine/late errors, internal deadlines, known HTTP failures, stale owner/CSRF/real logout epochs/generations, old finally, exact raw write and canonical Care Stop uncertainty, photo and both multipart families. |
| Adapted original T1 | Exact-base **0/1**, current **1/1**, both0 skipped/cancelled. |
| Final107 with only exact-base cookie inputs | **71 pass /36 fail**,0 skipped/cancelled; all intended assertions. |
| Unchanged raw request suites | **45/45** both before/after; includes the retained12 client-request cases. Exact UTF8 bounds, fixed finite actions, payload capture, error namespaces, owner/lease/logout fences, READ/write classification and exact retry wires remain. |
| Unchanged application/session/ports/transport/advisor suites | **197/197**, including original C1 approval-authority73 and AR1 status-recovery29; source only. |
| Existing Plan/Care/Review-Guidance channel source suites | **34/34** actual executed cases,0 skipped. No59-case or full-runtime-suite claim. Finite in-memory parser/gateway/provider/Vault component controls only, with no network or native runtime. |
| Unchanged `typecheck:rebuild`, `typecheck:session` | Both exit0. |
| Actual application build | Exit0, gateway excluded. First build has source dirtiness because the fix was not yet committed; it is not labeled a clean release artifact. |
| Gateway/Vault compile-closure inspection | Actual client Gateway27, combined advisor Gateway29 and Vault51 source inputs; **neither changed browser adapter is in any closure**. Source compilation with write:false; no runtime launched. |
| Scope/whitespace | `git diff --check` passes; all1766 other base tracked files, all old tests, Root SDK4 and nine model/role pins remain byte-exact. |

Counts overlap and are not an aggregate portal acceptance score. Complete expanded commands, exits and timings are in `CHECKS.json`, `SENSITIVITY-RUNS.json` and `RUNTIME-SOURCE-RUN.json` under the own evidence root. Representative reproducible commands from this checkout:

```sh
export PATH=/Users/kanuj/.nvm/versions/node/v22.23.0/bin:$PATH
node --experimental-strip-types --test --test-concurrency=1 --test-timeout=10000 apps/portal/tests/rebuild-cookie-cancellation.test.mjs
node --experimental-strip-types --test --test-concurrency=1 apps/portal/tests/rebuild-review-request.test.mjs apps/portal/tests/rebuild-review-guidance-request.test.mjs
node --experimental-strip-types --test --test-concurrency=1 apps/portal/tests/rebuild-{app-session,app-ports,app-care-composition,care-ports,foundation-transport,advisor-app-integration,advisor-approval-authority,advisor-status-recovery}.test.mjs
node --experimental-strip-types --import ./.local-artifacts/portal-rebuild/w0-cookie-cancellation/load-frozen-cookie.mjs --test --test-concurrency=1 apps/portal/tests/rebuild-cookie-cancellation.test.mjs
W0_COOKIE_CANCELLATION_OBSERVATION=.local-artifacts/portal-rebuild/w0-cookie-cancellation/adapted-current.json node --experimental-strip-types --test .local-artifacts/portal-rebuild/w0-cookie-cancellation/adapted-t1.mjs
node --test --test-concurrency=1 .local-artifacts/portal-rebuild/w0-cookie-cancellation/{plan-channel,care-channel,review-guidance-channel}.test.mjs
npm --prefix apps/portal run typecheck:rebuild
npm --prefix apps/portal run typecheck:session
npm --prefix apps/portal run build:application
```

Raw setup qualifications remain visible. The initial new test file had six invalid same-runtime relogin controls after ApplicationSession.signOut had permanently disposed its transport, with unhandled rejections and one file timeout: **62 pass /35 fail /1 cancelled**. Correcting those new controls to public cookie.signOut/restore permits a live replacement lease and gives the completed97-case RED above. It changes no old test or product semantics. The first runtime bundle run was **0/3 setup failures**: packages marked external could not resolve actual `@supabase/auth-js` from the artifact directory. Rebundling actual installed dependencies with the unchanged runtime tsconfig gives34/34; no resolver stub or flag weakening. Initial default-tsconfig bundling emitted the retained missing `expo/tsconfig.base` warning; Node emits the existing Root typeless-package warning. Neither is suppressed or mislabeled product RED.

## Delta, preservation and terminal handoff

`SCOPE.json` binds the clean code checkpoint, base1768-file inventory, old-test preservation, all copied-input hashes and closure boundaries. Root SDK blobs remain:

- PortalReview.ts `028e6bf3bb293e68a60e472b3b6ee87f522ee3c3`
- Values `c1e2191cfd0c0b015c31c6e1e4d8066d199d8dd9`
- Validation `997afba2c0b1dd3daf129913d3c2b28d27ed5f71`
- Mapping `917b81da881ae8e091c2414ff4864fa936367bbd`

The standalone code commit is immediately reviewable/cherry-pickable. Own `CODE.patch` SHA256 **`dc1c2a692ace1fe7cd9fdbba236fc0b8862f78bc9fea7605e0c8fa2f06c6b9af`**; binary `CODE.diff` SHA256 **`0d7e6d11d525a36912d86efe92992b5c39aef2863c27e91dbadc7ef8dd21aaba`**. Final report-inclusive exports, hashes and clean status are in `FINAL-HANDOFF.json`, created after this report commit to avoid a self-referential commit hash. Local `EVIDENCE.json` inventories retained raw setup/RED/GREEN/runtime/scope/export artifacts and excludes itself/final handoff.

All owned source Node/test/build commands are terminal. **No Chrome/DOM/preview/process inventory, DB/Docker/Auth/credential/native/fixture or real-provider resource was acquired, launched, borrowed, polled or retained.** No statement about another worker's current custody is inferred. Parent native87/policy6b and R9 are not rerun, imported or relabeled; unchanged server/policy/crypto/Vault sources and the actual closure exclusion prevent this browser-only delta from changing those compiled inputs. The separate Select/S1 CSS is unchanged.

Skipped by this source-only allocation: full Root npm/application/test types/Expo/iOS, full portal/runtime/browser/MF suites, genuine Gateway/Vault/Auth/Edge/PostgREST/Storage, migrations/reset/pgTAP/RLS/permissions, real-provider traffic, visual/human checks, hosted behavior and exact-head CI. No backend, source/consumer business rule, grant, default or budget activation follows from finite HTTP tests. No push, PR, merge, deployment, external communication, live client/clinical/source/permission/money/retailer action.

**Return to coordinator now.** Integrate the bounded code/report only after review. A fresh separately granted actual browser regression must rerun the W3 new20 and retained117, followed by a **NEW independent review round** with the complete prior findings/responses and exact integrated head. W3 ordinal4 remains **19/20** until that work is performed; this source correction does not retroactively make it green. No browser wait, nested reviewer or resource request remains open in this task.

## Follow-up ordinal2: CK1/CK2 source correction

31 October 2026. This new implementation follow-up responds to the COMPLETE independent R1 report at **`bec620f681a155f393779ddbd4b95dcdf29684d3:docs/portal-rebuild/research/W7_COOKIE_CANCELLATION_REVIEW.md`**. R1's scoped original T1 PASS remains valid. CK1/P2 and CK2/P3 are separate retained deadline defects, not newly introduced regressions or demonstrated authentication bypasses. The following author verification addresses their exercised source cases; fresh independent R2 remains required.

### Exact follow-up identity and limits

- Same T3-owned workspace `/Users/kanuj/.t3/worktrees/shelv/t3-2d6813cc`, branch `t3/fix-cookie-abort-suspension`; verified initially clean at **`ac83b3d70332d458fe620d4c1c089deacd6a2657`**. The app composer's separately frozenac83 checkout is not touched.
- Authoritative NEW follow-up task ID, supplied explicitly by the coordinator: **`node:delegated-task:command%3Amcp%3A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%3Athread-send%3Aw0-cookie-deadline-ck1-ck2-fix-20261031`**. It is distinct from the original delegated task ID above.
- Same backing child thread: `thread:delegated-task:command%3Amcp%3A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%3Adelegate-task%3Aportal-rebuild-w0-cookie-cancellation-fix-20261031-r1`.
- Actual new run: **`run:thread:thread%3Adelegated-task%3Acommand%253Amcp%253A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%253Adelegate-task%253Aportal-rebuild-w0-cookie-cancellation-fix-20261031-r1:ordinal:2`**, started **21:22:05.154 UTC**. Live thread state confirms parent `d632030a-18f7-4dec-a2c9-f5c0418c3fd5`, workspace, branch and subagent relationship.
- Initial and final live catalog/configuration tools confirm **codex / gpt-6.1-sol / xhigh / default**, full-access/default interaction. Selected-model descriptors support xhigh/default; project/default-subagent plus all eight role TOMLs parse correctly and all nine hashes match. Node/npm/compiler commands explicitly select `/Users/kanuj/.nvm/versions/node/v22.23.0/bin`; actual **v22.23.0**. Existing own portal dependencies were reused; no installation or setting change in this round.

Applied Resume, review reception, systematic debugging, source TDD and verification. Read current AGENTS, the full R1 report, original/independent producers and controls, actual transport/application/factory/Root source, and retained evidence and setup qualifications. Approved specification and prior C1/AR1/privacy/uncertainty boundaries remain governing. This follow-up authors one runtime file, one NEW test and this report only; no Root/contracts/server/Gateway/Vault/policy/budget/action/path/return-type/App/Select/session UI change.

### Read-only evidence custody

Own new evidence root: **`.local-artifacts/portal-rebuild/w0-cookie-cancellation-ck1-ck2/`**. Copied all **76** retained R1 artifacts from `/Users/kanuj/.t3/worktrees/shelv/t3-0ce6270f/.local-artifacts/portal-rebuild/w7-cookie-cancellation/` into the own same-depth `.local-artifacts/portal-rebuild/w7-cookie-cancellation/`. Separately copied the complete report after comparing it with the exact committed Git object. `REVIEWER-COPIES.json` binds all77 source/copy paths, sizes and SHA256 values; all were rechecked after the runs. No foreign checkout execution or write occurred.

The original178 test, independent observation scripts, adapted original T1 producer, their raw logs/JSON/metadata, original142 source, W3 original producer/report and prior author RED/setup artifacts remain unmodified in those copies. The independent178 source hash remains **`3008653a20bab133c7ce52b1efb791906d751b7a6ce41f94b0074ba2504445ab`**. Its relative imports already bind this own actual source, so **no adaptation** is applied to the executed test. Observation scripts receive only own output filenames through their existing environment variables. The own compile script changes only its output-directory binding; real entries, dependencies, runtime tsconfig and compiler options remain unchanged. Copied compiler outputs are preserved, not executed as a substitute for current source.

### Finding-specific reproduction and minimal delta

**CK1/P2:** Real native Response401/403 headers arrive, JSON consumption drains a prefix, then the actual internal20ms deadline aborts that body. Before edits, the unchanged independent ten-case subset gives **0 pass/10 fail**, exactly eight incorrect known-denial classifications plus two CK2 successes. Full independent178 gives **168 pass/10 fail**,0 skips/cancellations. Own post-HTTP observations reproduce the same client/advisor401/403-to503/offline error for deadline-first cancellation, with absent or later caller cancellation. These are source classification observations, not genuine provider revocation.

The body catch now uses **`controller.signal.aborted`** instead of **`callerAborted`** when deciding whether an AbortError interrupted a known non-success HTTP body. Thus either actual cancellation source preserves the already known HTTP status.401 ends the current session;403 denies without shared suspension;503 remains unavailable/offline. An unrelated body error or malformed JSON still follows the existing503 normalization. HTTP200 internal cancellation still becomes503. No ready assignment, automatic restore/retry or current/role weakening is introduced.

This CK1-only change passes **78/78** new known-HTTP/stale-owner cases and changes the original ten to **8 pass/2 fail**. The remaining failures are precisely CK2. That intermediate result is retained in `CK1-RUNS.json` and raw logs.

**CK2/P3:** A finite supplied fetcher/body deliberately ignores its already observed internal AbortSignal and completes valid HTTP200 JSON. Before edits both original source-seam assertions return success, as R1 reported. This is **not proof that ordinary global fetch or a browser ignores AbortSignal**, and no private data is present in the original counterexample.

The final success guard now checks **`controller.signal.aborted`** instead of **`callerAborted`**. It rejects a success after either actual abort. The unchanged outer catch still uses the original **first-abort provenance**: caller-first AbortError remains local; deadline-first AbortError becomes CookieSessionError503 even when the caller aborts later. No default timeout, budget, action or return type changes. The known non-success HTTP check remains before this success fence, preserving CK1's distinction.

These are the only two changed production conditions, with explanatory comments, in `advisor-cookie-session.js` `_transport`. `client-cookie-session.js` inherits them without an edit. Factory-level `isCurrent(lease)` still runs before returning values or retiring/suspending a session: old owner/CSRF/epoch/generation results, errors and cleanup cannot mutate a replacement owner. Raw typed, legacy JSON, photo and multipart wrappers retain their original checks and public APIs. Direct `_transport` classifies errors; its calling factory still owns global suspension/retirement.

### New tests and exact preservation

NEW [deadline regressions](../../../apps/portal/tests/rebuild-cookie-cancellation-deadline.test.mjs) exercise the actual ApplicationSession, cookie classes, raw client/advisor Review/Guidance factories, Root parsing/positive mapping, direct typed/legacy Check-ins JSON, photo/multipart, direct transport GET and canonical Care Stop port. Ten surfaces use native Response/ReadableStream latches and the actual supplied signal/deadline. No successful port, source/current predicate or role is fabricated in the new tests.

The104 cases cover known401/403/503 with genuinely absent or later caller signal; signal-ignoring fetch and body completion; current-denial versus replacement owner/CSRF ordering; READ rejection versus WRITE uncertainty; mixed-case UUID bytes through the unverified raw seam; canonical Care UUID/CAS/wire; no automatic retry; public restore only after asserting genuine503/offline; explicit status and exact retry; and following positively mapped Review/Care requests after current403. Preparation DTOs plus finite Care receipts prove mapper/egress behavior, not actual backend care eligibility.

The old107 test file **and its helper remain byte-exactac83**, as do all other existing tests. No requirement mismatch or old assertion change was needed. New fixture modes never alter production permissions or authentication.

| Executed source check | Actual result |
| --- | --- |
| Unchanged original intended ten before any production edit | **0/10**,0 skipped/cancelled; exactly CK1eight and CK2two |
| Unchanged independent178 before edits | **168 pass/10 fail**,0 skipped/cancelled |
| Completed new104 before edits | **38 pass/66 intended fail**,0 skipped/cancelled |
| CK1-only correction | New CK1 **78/78**; original ten **8 pass/2 CK2 fail** |
| Final new104 | **104/104**,0 skipped/cancelled |
| Final unchanged original ten / independent178 | **10/10** / **178/178**,0 skipped/cancelled |
| Adapted original T1, unchanged independent producer | **1/1**; current ready, following Review/Care egress and strict mapping |
| Old107 / retained request45 / retained source197 | **107/107**, **45/45**, **197/197**, all0 skipped/cancelled; includes retained12 client requests and C1/AR1 |
| Existing Plan/Care/Review-Guidance runtime-source suites | **34/34**,0 skipped/cancelled; finite in-memory components only |
| Unchanged frontend/session strict checks | Both exit0 |
| Rebuild/application builds | Both exit0; no --serve, browser, gateway activation or runtime launch |
| Actual Gateway / combined Gateway / Vault compile closures | **27/29/51** inputs, exact correspondence with R1's complete closure JSON; neither browser adapter appears |

Counts overlap; they are not an aggregate acceptance score. `RED-RUNS.json`, `AUTHOR-RED-CORRECTED-RUN.json`, `CK1-RUNS.json`, `GREEN-RUNS.json`, `CHECKS.json` and `FINAL-PROBES.json` preserve exact argv/cwd/exits/timings and owned observation filenames. All commands select the explicit Node22 path. Representative commands from this checkout:

```sh
export PATH=/Users/kanuj/.nvm/versions/node/v22.23.0/bin:$PATH
node --experimental-strip-types --test --test-concurrency=1 --test-timeout=10000 apps/portal/tests/rebuild-cookie-cancellation-deadline.test.mjs
node --experimental-strip-types --test --test-concurrency=1 --test-timeout=3000 .local-artifacts/portal-rebuild/w7-cookie-cancellation/review.test.mjs
node --experimental-strip-types --test --test-concurrency=1 --test-timeout=10000 apps/portal/tests/rebuild-cookie-cancellation.test.mjs
node --experimental-strip-types --test --test-concurrency=1 apps/portal/tests/rebuild-{review-request,review-guidance-request}.test.mjs
node --experimental-strip-types --test --test-concurrency=1 apps/portal/tests/rebuild-{app-session,app-ports,app-care-composition,care-ports,foundation-transport,advisor-app-integration,advisor-approval-authority,advisor-status-recovery}.test.mjs
node .local-artifacts/portal-rebuild/w0-cookie-cancellation-ck1-ck2/compile.mjs
node --test --test-concurrency=1 .local-artifacts/portal-rebuild/w0-cookie-cancellation-ck1-ck2/{plan-channel,care-channel,review-guidance-channel}.test.mjs
npm --prefix apps/portal run typecheck:rebuild
npm --prefix apps/portal run typecheck:session
npm --prefix apps/portal run build:rebuild
npm --prefix apps/portal run build:application
```

**Raw setup qualifications:** The first new deadline test run used the legacy Operations endpoint outside the reused helper's finite router. That test setup produced **8 pass/28 fail/1 cancelled** across37 reported tests, including unrelated rejection/wait failures. Changing only the NEW legacy test surface to the supported legacy Check-ins endpoint yields the completed104-case **38/66** pre-edit RED above. The original independent ten had already reproduced correctly and needs no setup adaptation. Historical reviewer142 **97/45**, corrected142 **142/142**,157 **147/10** and final178 **168/10** plus original author setup logs are preserved/read, not newly rerun or relabeled. R1 documents their UUID-normalization, coincident-abort and artificial-role expectation errors; its passing artificial-role negatives are not genuine role revocation evidence. Existing Root typeless-package and compile-closure missing `expo/tsconfig.base` warnings remain unsuppressed. No config/flag/budget relaxation or product change responds to a setup fault.

### Terminal source handoff

`SCOPE-FINAL.json` records the exactac83 basis, three-path delta, old107/helper preservation, all1769 other base tracked files, project/eight role hashes and original/copy verification. The old T1 classifications, exact UUID/raw payload/CAS/no-auto-retry and status-READ/write-uncertainty semantics remain green. `CLOSURE-CORRESPONDENCE.json` records exact R1 Gateway/Vault input correspondence; parent native87/policy6b and the app composer are not accessed or recertified.

The coherent source/tests/report commit and patch/diff exports are bound by the excluded local **`FINAL-HANDOFF.json`** after commit, avoiding a self-referential report hash. It also records clean Git state, clean-head application provenance, runtime/task/thread/run identity, final source/evidence SHA256 and owned-handle return. Previous ownac83 application artifacts and the precommit build are preserved before the clean rebuild. No source/test change follows the final green source checks.

**No browser/preview/Chrome/DOM/process inventory/native/PG/DB/Docker/Auth/credential/fixture/shared-resource or real-provider access, execution, polling or nested work occurred.** All owned finite source commands are terminal; no grant or long-running handle is retained. No write occurred in the reviewer's or app composer's checkout. No Root install, push, PR, merge, deployment, live clinical/client/source/permission/communication/funds/retailer action.

Skipped: full Root npm/types/test-types/Expo/iOS, full portal/runtime/Miniflare/browser suites, App DOM activation, W3 new20/retained117, genuine current Gateway/Vault/Auth/Edge/PostgREST/SQL/Storage, migration/reset/pgTAP/RLS, hosted, visual/human and exact-head CI. **CK2 ordinary global-fetch/browser reachability remains unestablished.** W3's historical19/20 and all App/genuine/full-goal acceptance remain at their prior proof levels.

Return the exact committed correction to the coordinator now. **Fresh independent R2 must be a NEW delegate_task** carrying the original brief, complete R1, both findings, this response, exact integrated correction and all prior qualifications. No nested review or wait for browser/resources is opened by this source follow-up.
