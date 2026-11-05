# W7 coupled advisor/application and native harness source review

31 October 2026 UTC, 30 October America/Chicago. Independent SOURCE/PURE/SSR/TYPE review. No production fixes, nested agents or browser/native execution.

## Scoped verdicts

| Subject | Specification | Correctness / quality | Scope |
| --- | --- | --- | --- |
| Assigned-open R2-1 correction | **PASS / ADDRESSED** | **PASS for that correction** | Default first assigned open accepts the actual app's approve false-to-true gate. Current denial ends owned loading; identity, view, operation and abort fences remain. |
| Complete latest controller integration, including approval recovery | **CHANGES REQUIRED: C1/P2** | **CHANGES REQUIRED: C1/P2** | The WeakMap preserves a newer restrictive context that has already applied. A newer restrictive read still in flight can instead be discarded by an old approval acknowledgement, leaving an earlier permissive context publishable. |
| Native harness source assurance | **CHANGES REQUIRED: H1/P2** for complete original-response privacy assurance | **CHANGES REQUIRED**, H1 plus H2/P3 cleanup omission | Finite loopback forwarding and exact two-literal test configuration are sound in inspected source. The original-case private marker is missing from the pre-fulfillment scan configuration. Early readonly preflight failures also bypass explicit stack disposal. |

Fresh unchanged canonical checks: **95/95 source/pure/SSR/build**, **251/251 advisor pure**, **3/3 native pure guards**, and both strict typechecks pass. Independent application probes: **14 pass / 7 fail / 0 skip / 0 cancelled**, with four failures reproducing C1 through source-supported recovery controls; three additional failures use controller-only reapproval and are not claimed as UI reachability. Actual-component SSR confirms enabled recovery/refresh controls before C1 and an incorrectly enabled publish control afterward. Native boundary sensitivity: **3 pass / 1 fail**, identifying H1. Green canonical suites do not override these failures. Counts overlap and are not an aggregate acceptance total.

No demonstrated server authorization bypass, genuine private disclosure or payment/publication transaction failure is claimed. The separate late-single-claim `PaymentVerification` defect is excluded from acceptance here. Full genuine browser completion remains open.

## Identity, source correspondence and boundaries

- Workspace: `/Users/kanuj/.t3/worktrees/shelv/t3-06cff321`; branch `t3/review-advisor-native-harness`.
- Exact clean starting and tested HEAD: **`13a1e0b7fb6a2f4226ee7963b69b4ffb26b8d13f`**, matching requested parent13a1e0b. Fresh `git status -sb`, `git log -5 --oneline`, `git rev-parse HEAD` and branch readback preceded review. This report is a documentation-only child of that source head.
- Both live `orchestrator_capabilities({})` and `t3_thread_configuration({})` independently verified **codex / gpt-6.1-sol / reasoningEffort=xhigh / serviceTier=default**, runtime full-access, interaction default, before source work and again before finalization. No fallback or delegation. Task suffix `portal-rebuild-w7-coupled-source-review-20261030-r1`.
- Actual Node **v22.23.0**, selected explicitly with `/Users/kanuj/.nvm/versions/node/v22.23.0/bin` first in PATH for all Node/npm commands. Existing-lockfile portal install `npm ci --offline --ignore-scripts --no-audit --no-fund` installed130 packages, exit0. No package/lock/config change or root install.
- Local tracking reference `origin/main=d39a7d4943209080df7c4cf97d85784f462758bf`; `HEAD...origin/main=91 0`. No fetch or remote-freshness claim in this exact-parent review.
- Verified integration ancestors `a35c0a8`, `6c9d081`, `e32d81e`, `2af5299`, `ee33822`, `3ed76e1`, `77933bc`, `13a1e0b`. W2 controller and new integration-test blobs match **ba829bcc30870ba8a2debf2d595a0f8c3ba7973d**, integration **a35c0a8**, and HEAD exactly. Report receipt655b7bd is integrated6c9d081. W2's implementation changes only controller, one new test file and its report; **no old test changed**.
- All nine new `apps/portal/{scripts,tests}/rebuild-native-*` files match author **8c7c8c1**, integration13a1e0b and HEAD byte for byte. Reviewed the full source resulting from author77f85e6/0b07036/39364db/3346df5/36abdd0/8c7c8c1 and their six supplied integration commits. `source-provenance.json` preserves these comparisons and SHA-256 values.
- Sole tracked write/commit is this report. Diagnostics and builds are ignored under this worktree's `.local-artifacts/portal-rebuild/w7-coupled-source/` and normal ignored test/application output directories. No fixes, other-worktree write, push, PR, merge, deployment, real client/source/permission action, communication, funds, order or memory write.

Read the full [app R2 review](W7_APP_FIXES_R2.md), [latest W2 response](W2_APP_INTEGRATION_FIX.md), [advisor R4](W7_ADVISOR_R4.md), [W2 follow-up](W2_FOLLOWUP_FIXES.md), [W0 composition](W0_APP_COMPOSITION.md), [W0 fixes](W0_APP_FIXES.md), [original app findings](W7_APP_SOURCE_REVIEW.md), [original advisor findings](W7_ADVISOR_REVIEW.md), [first W2 response](W2_FIXES.md), [advisor R3](W7_ADVISOR_R3.md), original W2 delivery and [W6 genuine report](W6_GENUINE_BROWSER.md). Original objections/responses remain context, including their limitations and incorrect original F2 final assertion. Read applicable root/portal AGENTS, rebuild entry point, D01-D48, full desktop specification, implementation contracts, PLAN_API_V1, ADVISOR_READ_API_V1, workstreams/status, acceptance matrix and shared UI policy.

Applied Resume, receiving/requesting review, systematic debugging and verification guidance; repository task-first UX, Supabase Auth boundary and Workers review guidance. No nested reviewer was created. Platform inspection uses actual locked Miniflare **5.20261019.0-beta**, Workers types **5.20261019.1** and their source/type definitions. No new platform API assumption, external reference fetch, Figma acquisition, visual redesign or business rule was introduced.

## R2-1 disposition and retained findings

Inspected actual `createApplicationSession`, retained CookieAdvisorSession/factory facade and implementation, captured-session transport, `createAdvisorPorts`, root strict command/response mappers, advisor model/controller, workspace and fields. The positive app tests execute these actual layers. Only finite synthetic fetch DTOs/status/delivery timing and the checked-in in-memory reducer supply inputs. No application `current()` function, successful port, cookie factory or mapper was replaced.

`beginRead` now separates owned cleanup from private delivery. Ownership retains session/epoch, purpose generation, operation generation, view/target identity, local-content object and pending-command object. Delivery additionally requires captured actor and current view permission. Edit/assign/review/approve/publish/payment capability bits legitimately change during an authoritative read and are not login identity. `invoke`, retained factory, transport and app post-await checks preserve abort, owner/role/audience/generation/CSRF/deadline fences. Strict target/publisher mapping remains active.

Independent input-only historical sensitivity bundles just the exact pre-fix controller from `git show a35c0a8^:apps/portal/src/features/advisor/controller.ts`, resolving other dependencies from this checkout. Current production bytes are never overwritten. Both runs issue exactly `read_draft_v1`, `read_advisor_gate_v1` through the actual app stack, default final `approve:true`:

```text
before:  view:null, busy:true,  approve:true
current: view:requested draft, busy:false, approve:true
```

Current first open needs neither forced approve:false nor a second open. The unchanged251 suite covers default open, individual/all mutation restrictions and view-only denial of writes; lawful capability refreshes across read families; current view/source denial,401 and malformed target; actor, actual owner/CSRF/logout/expiry and artificial role negatives; aborted and reverse draft/gate A/B in both orders; exact old approval acknowledgement/retry/status and remount recovery. Independent adjacent probes additionally reject held private reads after view revocation, preserve changed manual content, and preserve B against obsolete403/409/503. A true401 at the real retained factory ends the session, even on that aborted old request; it is not weakened to preserve private B.

The WeakMap records original command issuance generation; exact retries reuse the same object, and remounted pending operations have no remembered approval basis. This correctly prevents an old immutable receipt from replacing a **completed newer restrictive context**. The unchanged author cases establish that completion order. C1 covers the missing opposite order.

Original A1/A2/A3 retain their independently closed, qualified dispositions. A2's ordinary restore/browser reachability remains unproven; this source pass does not broaden it into a server bypass. Original advisor F1-F3 and R3-1/R3-2 retain their scoped R4 PASS; no fresh keyboard/full-text/visual result is claimed. C1 is an adjacent in-flight authority/recovery variant, not a rewrite of those earlier tested sequences. The original F2 expectation of pending B after a valid awaited B acknowledgement remains incorrect; valid acknowledgement clears pending.

## C1 / P2: old approval recovery discards a newer restrictive read

**Owner:** W2, with coordinator app regression. **Requirements:** D16/D22/D25/D38; current authority and exact acknowledgement must remain separate. **Source:** [controller.ts](../../../apps/portal/src/features/advisor/controller.ts), `accept`248-269, `execute`337-359, `refreshContext`364-397, `reconcile`911-917 and `retry`922-929.

`accept` unconditionally increments `contextGeneration` before the WeakMap check. Exact retry also advances `operationGeneration`. A current authority read captured before that acknowledgement fails its context/operation applicability afterward. The WeakMap prevents installing the historical approval but leaves the previously displayed context intact. If that previous context was permissive, clearing pending restores `stable()` and re-enables publication despite the newer genuine-shaped restrictive gate result.

Fresh source reproduction uses actual cookies/factory/transport/root mappers/app ports/controller, without reapproving an already-approved UI:

1. Open a reviewed assigned draft, set later-publication/active-coverage synthetic backend state, and refresh current context with no approval.
2. Deliberately approve once. Let the fixture reducer commit; add one unsupported field only to the delivered acknowledgement. Strict mapping refuses it. Exact approval A remains pending/uncertain, busy false, with its UUID/payload intact.
3. Refresh publication checks successfully. The current gate returns committed approval A; context now has that approval and active coverage. Pending A still blocks publication.
4. Change the synthetic authoritative state to `approval:null` or `coverage:'inactive'`. Start another actual refresh C; capture its real gate DTO at the finite fetch boundary and delay only delivery.
5. While C is pending, invoke **retry same request** or **check request status** for A. Its valid immutable acknowledgement clears exact pending A. Retry sends byte-identical original A, not a new approval command.
6. Deliver C. The actual app gate accepts the current target/actor and returns its restrictive context. The controller discards it. Final observed state in all four combinations: **approval present, coverage active, pending null, canPublish true**. Expected publication remains blocked.

The four intended-behavior assertions fail consistently. Actual-component SSR before step4 confirms **refresh, retry and status enabled; publish disabled**. After status recovery/C delivery it renders **revision approved** and an **enabled publish plan** control. Shared `Button` really disables `busy` controls, so the primary evidence deliberately uses the nonbusy uncertain-recovery state. No browser click, timing or native/backend revocation is claimed from SSR. Three supplementary direct-controller reapproval variants also fail, but the UI disables reapproval while already approved; those variants are diagnostic only.

The passing author completion order is different: C finishes and installs restriction *before* A's acknowledgement. The new WeakMap protects that order. It does not protect the still-pending C above. This is stale UI authority, not evidence that SQL would publish after real approval revocation or coverage cancellation.

**Bounded correction to evaluate:** exact approval recovery must not leave older publishable authority after invalidating a newer authority read. Preserve a still-valid newer read or conservatively clear/reload authority before publication becomes eligible. Retain exact pending-command acknowledgement, mutation/read/session/view/target fences and the server's final checks. Add both completion orders for retry/status, revoked approval and inactive coverage; do not solve this with global permission-bit immutability or stale-result acceptance.

Runnable evidence from repository root, explicit Node22 PATH:

```sh
node --experimental-strip-types --test --test-timeout=10000 --test-concurrency=1 \
  --test-name-pattern='^reachable uncertain' \
  .local-artifacts/portal-rebuild/w7-coupled-source/adversarial.mjs
# 0 pass / 4 fail / 0 skip / 0 cancelled, expected intended-behavior failures
node .local-artifacts/portal-rebuild/w7-coupled-source/ssr-build.mjs
node .local-artifacts/portal-rebuild/w7-coupled-source/ssr-built.mjs
# build exit0; actual SSR emits enabled-control observation, then intended assertion exits1
```

| Priority | Advisor goal | Observed issue | Smallest correction / regression | Evidence |
| --- | --- | --- | --- | --- |
| P2 C1 | Recover exact uncertain approval while checking current publication authority | Old recovery discards newer restriction and enables publish from prior context | Keep/refresh current authority; test both completion orders and exact bytes | Actual app source4 failures; actual-component SSR control states |

## Native harness source assurance

Read all nine new native files in full, without executing/importing their infrastructure entry points. Traced the existing combined gateway, actual SQLite AdvisorSessionObject, CredentialEnvelope, SessionVault and provider request/issuer/context code. Source conclusions:

- `localPolicy` requires the exact production policy SHA-256 **c31adceba6e4457183af460d5ebfa3ead1549a772ba7004757885c20607175fc**, exactly one occurrence of each of the two named literal exports, and substitutes only portal `https://127.0.0.1:57430` and provider `http://127.0.0.1:57421`. In-memory esbuild substitution is applied to actual gateway and Vault bundles. Original policy, issuer/sub/session/role/expiry predicates and production source remain unchanged. This explicit test configuration is not JWT forgery or a production option.
- `providerTarget` validates before network. Only the exact provider origin, approved Auth path/query combinations, two named context RPCs and three named functions survive. Function destinations are exact loopback57440/57441/57442; redirects are refused. OTP has exact local redirect paths, `create_user:false`, `.invalid` recipients. Unexpected gateway outbound is denied. Actual response statuses/bodies flow through unchanged; no success/context/domain stub or re-signed token was found. Decoding JWT claims for token bookkeeping/scans does not supply gateway authority.
- Forwarding preserves real apikey/Authorization/Origin/content-type/API-version values server-side while removing incompatible workerd transport headers such as content-length. Browser interception restores only a missing API Origin after checking actual frame origin equals the exact local portal. Existing headers and server predicates remain. These are test transport normalizations; they do not prove Chrome's ordinary network header behavior.
- Both shared-session flags are explicit. Actual combined gateway and actual SQLite Vault are bundled, not another BFF. `useSQLite` and current Miniflare persistence paths agree with the installed locked types/source. Private per-stack directory and new random envelope key are test state. No direct session.initialize seeding is used by the genuine journeys. `nodeCookieClient` is a Node cookie jar, not browser Secure/HttpOnly enforcement.
- `attestFixture` is explicit opt-in and intentionally hardcodes the parent-owned fixture. It checks exact owner/project,55 migration names/hashes, prepared source, binding/volume/container lineage, DB attestation/ledger hashes, helper IDs/owner/running state, private-file permissions and activated synthetic owner policy. This exact fixture custody is intentional, not accidental universal portability. Its native queries/private reads were not run here.
- Fresh helper preparation compares parent/child source closures, records copies before start, uses pinned native image and loopback ports, preserves original stopped plan/container/environment, adds only the three listed TLS RPC routes and local origin, retains partial resources and has bounded plan-helper recovery. Reuse checks recorded IDs/labels/image/ports/env/stored-source hashes. No reset/truncate, old fixture adoption, global trust/config change or production write occurs in the source under review. Runtime custody/resource/source-copy correspondence remains author evidence.
- Setup creates labeled synthetic identities and only their local cases/viewer grant. Service-role is restricted to that explicit identity setup; temporary ordinary owner/client password sessions call the unmodified payment API for a synthetic quote/claim. They close in `finally` via supported provider local logout and explicit session/refresh-row checks. Stack token bookkeeping retains prior access/refresh strings across refresh rotation; cleanup attempts every known issued session and checks both session and refresh counts. Main/readonly normal execution has context/browser/stack cleanup in `finally`, subject to H2's preflight gap.
- Before `route.fulfill`, original header/body bytes are checked against exact issued access/refresh strings, including retained prior values, and fixture provider keys. Detection aborts, does not rewrite. Static token-related field names are not secrets. Client and safe-preview responses also check the W6 private marker, while authorized advisor draft responses positively count it. H1 limits original-case private-byte assurance.
- `inspectVault` opens actual generated SQLite files read-only, checks session-record JSON for exact plaintext issued credentials and versioned ciphertext envelopes. Actual AES-GCM sealing with object/owner additional data is in unchanged production source. This is a meaningful disk-row/envelope check when run, not proof that all raw SQLite/WAL/free-page bytes or a production filesystem are encrypted. This review neither opened SQLite nor reran that proof.

## H1 / P2: original-case private marker is absent from pre-fulfillment checks

**Owner:** W6 harness. **Source:** [rebuild-native-stack.mjs](../../../apps/portal/tests/rebuild-native-stack.mjs)157-164 and [rebuild-native-readonly-browser.mjs](../../../apps/portal/tests/rebuild-native-readonly-browser.mjs)42-43/66. **Requirement:** original-response private-fact exclusion before browser fulfillment; accurately bounded D40/D46 evidence.

The readonly journey uses the original client's **PRIVATE_REAL_AUTH_CANARY** and checks it in a parsed command result and DOM after responses have already reached the browser. The shared pre-fulfillment private list contains only **W6_PRIVATE_SYNTHETIC_ONLY**. Consequently zero `privateFactLeaks` over the145 original responses establishes that W6-marker check, not original-canary exclusion from every original header/body byte before fulfillment.

Pure sensitivity, using only the imported boundary function and the exact list verified in tracked stack source:

```js
assertBrowserBytes({'x-private':'PRIVATE_REAL_AUTH_CANARY'},
  Buffer.from('safe'), ['W6_PRIVATE_SYNTHETIC_ONLY']); // does not throw
assertBrowserBytes({'x-private':'PRIVATE_REAL_AUTH_CANARY'},
  Buffer.from('safe'), ['PRIVATE_REAL_AUTH_CANARY']); // correctly throws
```

The intended first-call refusal fails as **Missing expected exception**. Controls reject W6 marker in binary/header bytes and reject the original marker when supplied; routing negatives/positives pass. This is configuration coverage missing from the harness, not a faulty scanner primitive, fabricated success or observed leaked response. Authorized advisor private reads must remain possible.

**Bounded correction:** supply each journey's actual known private canary to the pre-fulfillment safe-response scanner, with header/binary sensitivity and an authorized-private positive. Preserve exact credential scans and original response bytes. Re-run the bounded readonly lane later under fresh custody/browser authorization before expanding its byte-level privacy claim. Existing parsed-value/DOM evidence remains useful within its actual scope.

## H2 / P3: readonly preflight is outside stack cleanup

**Owner:** W6 harness. **Source:** [rebuild-native-readonly-browser.mjs](../../../apps/portal/tests/rebuild-native-readonly-browser.mjs)12-18/38-40/69-73; adjacent `connectedStack` awaits `mf.ready` before returning a disposal handle.

The readonly script creates the Miniflare stack before validating selectedRun, reading prior receipts/private identities or computing its SQL snapshot, and enters `try/finally` only afterward. For example, an invalid `SHELV_REBUILD_NATIVE_CASE_RUN` throws at14 after stack creation; a missing prior receipt throws at15. Neither reaches `stack.dispose`. `connectedStack` itself also has no disposal catch if `mf.ready` rejects. This contradicts a literal cleanup-on-every-failure guarantee. It is a source-identified omission, **not an observed retained process/session**, and no provider session has been issued at that preflight stage.

Move preflight before stack acquisition where possible, and put acquisition plus all subsequent work under a disposal guard, including readiness failure. Verify under an authorized later runtime failure-injection round. No native reproducer was run here.

## Executed commands and evidence

All Node/npm commands use explicit Node22 PATH above; portal cwd unless labeled root. Full95 command is identical to the R2 report:

```sh
npm ci --offline --ignore-scripts --no-audit --no-fund
node --experimental-strip-types --test --test-concurrency=1 \
  tests/rebuild-app-ports.test.mjs tests/rebuild-app-session.test.mjs \
  tests/rebuild-app-state.test.mjs tests/rebuild-app-render.test.mjs \
  tests/rebuild-app-build.test.mjs tests/rebuild-foundation-transport.test.mjs \
  tests/rebuild-foundation-navigation.test.mjs tests/rebuild-foundation-notices.test.mjs \
  tests/rebuild-advisor-controller.test.mjs tests/rebuild-app-callback.test.mjs \
  tests/rebuild-app-continuation.test.mjs tests/rebuild-app-preview-context.test.mjs \
  tests/rebuild-app-start.test.mjs
node --experimental-strip-types --test --test-concurrency=1 \
  tests/rebuild-advisor-app-integration.test.mjs tests/rebuild-advisor-controller.test.mjs \
  tests/rebuild-advisor-races.test.mjs tests/rebuild-advisor-followup.test.mjs
npm run typecheck:rebuild
npm run typecheck:session
# repository root:
SHELV_REBUILD_NATIVE_GUARDS=1 node --test apps/portal/tests/rebuild-native-guards.mjs
node --experimental-strip-types --test --test-timeout=10000 --test-concurrency=1 \
  .local-artifacts/portal-rebuild/w7-coupled-source/adversarial.mjs
node --test .local-artifacts/portal-rebuild/w7-coupled-source/native-source-probes.mjs
node --experimental-strip-types .local-artifacts/portal-rebuild/w7-coupled-source/assigned-sensitivity.mjs
```

| Check | Actual result |
| --- | --- |
| Unchanged source95 | Exit0;95 pass/0 fail/0 skip/0 cancelled;3.209s. Includes actual-component SSR and isolated candidate/notices builds, no DOM/browser. |
| Advisor pure251 | Exit0;251 pass/0 fail/0 skip/0 cancelled;0.576s. Unchanged217 plus new34 actual app cases. |
| Native guards | Exit0;3 pass/0 fail/0 skip/0 cancelled;0.061s. Inspected imports first: only fs/assert/test and pure boundary crypto/URL/byte functions, no native calls. |
| Both strict types | Exit0, zero diagnostics; original frontend strict/noUncheckedIndexedAccess and retained-session flags. Native JavaScript is syntax-checked separately, not claimed fully typechecked. |
| Nine native files, each explicit `node --check <file>` |9/9 exit0. Syntax only, no imports or scripts executed. |
| Adversarial corrected matrix | Exit1;14 pass/7 fail/0 skip/0 cancelled,21 total;0.165s. Four source-supported C1 variants plus three controller-only diagnostic variants fail. |
| Focused reachable C1 command above | Exit1;0 pass/4 fail/0 skip/0 cancelled. No assertion weakened to make the finding green. |
| Actual advisor SSR | Final esbuild exit0; renderer exit1 at intended post-restriction disabled-publish assertion. Four prior actual-button state assertions pass; output before/after recorded. No DOM/browser. |
| Native source probes | Exit1;3 pass/1 fail/0 skip/0 cancelled;0.050s. H1 intended refusal fails. Only pure boundary module is imported; stack/fixture is read as tracked text, not executed. |
| Assigned-open historical/current sensitivity | Exit0 with both expected contrasting observations. This is defect sensitivity, not an acceptance pass for historical busy/null. |
| Source correspondence / final diff / report links | Git blob comparisons pass; only this report may enter the commit. `git diff --check`, local links and report scope checked before commit. |

Reviewer harness corrections are preserved: initial preview probe lacked `onPreview`, so it waited for a request the controller correctly did not issue; only that reviewer's two exact Node processes were terminated, and the ignored harness gained the real preview callback plus a10s test timeout. Initial obsolete401 expectation incorrectly demanded retained B; actual factory401 correctly ends the session, now explicitly asserted. Initial ESM SSR bundle needed Node `createRequire` for React's existing CommonJS dependency; final build adds only that ignored diagnostic banner. These setup/expectation failures are not product findings or green acceptance. Existing root module-type and historical-bundle missing Expo-base warnings remain; no flags/config were relaxed.

Evidence root: `/Users/kanuj/.t3/worktrees/shelv/t3-06cff321/.local-artifacts/portal-rebuild/w7-coupled-source/`. Contains scripts, initial/final logs, input-only historical bundle, synthetic SSR HTML, source correspondence, final live runtime receipt and SHA-256 manifest. No parent fixture, private credential or native output was copied. All test/install/type handles are terminal. No browser or native allocation was requested or awaited.


| Selected ignored evidence | SHA-256 |
| --- | --- |
| `source95.log` | `9c4fcf683a76d5a29eb8e2046890e8dd9eeb8e026d2d9034c92d69c994d910c7` |
| `pure251.log` | `67f787af4182471eb43383cc67668af7212e785f4da87cd288ba5b9a9aa95d34` |
| `native-guards.log` | `40bd99bdf7866cc2da5f5623f56394fd05bf5e6e9425fb4e20b94dba29a806b5` |
| `finding-c1.log` | `87bae080457461e4c7e19a5cd243c0fc194897bb9d01f4cc7b5bb00cd152323a` |
| `ssr-final.log` | `129e224d7be0eec59a72d6051c2c7ca1437066dc13c1c3d15428ff1dfd5beaf1` |
| `native-source-probes.log` | `7abfc879c9b6e85b3aeda25b0b6ec4c765d3f1e0d545925b3a58b2221973ad03` |
| `source-provenance.json` | `13b8b1dd460fcf8bd493b0f51ae2250489256da7964d0d40c7cd405b21014638` |

## Native/browser attribution and remaining gates

The W6 report is **author evidence only**, not this review's rerun or independent browser acceptance:

- Node cookie-jar proof reports both audiences, actual provider PKCE/live context/native reads and supported logout; later8 groups pass. Its disk check reports actual SQLite session rows/envelopes. Cookie attributes in Node are not browser enforcement.
- Genuine main browser chain reports **7 passing groups**, then blocks on the real late-single-claim `PaymentVerification` state. Confirmation/publication/new-client-decision continuation has not completed. It reports186 original responses with zero tested credential/W6-private-marker hits, safe-preview positives and authorized private-draft positives; no rewritten response. This remains partial.
- Separate readonly/negative browser reports **4/4 groups**,145 original responses, zero tested credential/W6-private-marker hits, original-canary parsed API/DOM exclusion, owner/audience/CSRF/view-only/revocation/held-result checks, and unchanged original business snapshot. H1 limits byte-level original-canary interpretation. This lane does not substitute for the blocked new-plan journey.
- Provider logout/session/refresh cleanup and running helper/custody readbacks are retained author receipts. This reviewer did not inspect the parent fixture, credentials, Docker, Auth, SQL, SQLite, helper processes or native cleanup outputs. No current-running/zero-session assertion is independently made here.

Not run or accepted: Chrome/browser/DOM, keyboard/full-text/visual/accessibility/representative-human checks, actual PKCE/Auth/DB/PostgREST/native Edge/SQLite harness execution, `attestFixture`, `connectedStack`, helpers/setup/native browser scripts, Docker, migrations/reset/pgTAP/RLS, real permission/source lifecycle, genuine payment/publication/notification effects, root/Expo/mobile suites, hosted behavior, exact-head CI or deployment. The author's11 app/35 combined synthetic browser passes are not rerun here. Full original objections and release gates remain bounded by their recorded scopes.

Parent continuation: integrate this report-only commit, retain R2-1's addressed disposition and earlier scoped passes, route C1 to W2 and H1/H2 to W6, and independently review corrections. A later fresh genuine browser round must finish the actual main chain after the separately owned payment UI fix; this source report neither waits for nor replaces that round. Coordinator owns canonical status/CONTEXT_SYNC updates.
