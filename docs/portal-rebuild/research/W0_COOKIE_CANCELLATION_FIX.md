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
