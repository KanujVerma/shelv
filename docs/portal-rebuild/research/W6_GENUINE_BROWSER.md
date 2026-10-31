# W6 genuine connected browser verification

Owner: Kanuj. Completed bounded test-infrastructure implementation, 30 October 2026 (final execution31 October UTC). This report is the sole allocated planning/evidence document for W6. The genuine connected main journey passes13 groups; independent fresh harness/chain review and full portal/release acceptance remain separate.

**Final:** genuine main journey **13/13 retained**, with its exact W6-marker/credential byte coverage qualified below. Independent source review H1/H2 subsequently required broader original-client marker checks and early-failure disposal. Both harness corrections now have guard sensitivity **RED4/6 -> GREEN6/6**, **3/3 actual cleanup-negative probes**, and a fresh bounded **4/4 readonly browser** rerun with both known markers checked before fulfillment. No full main rerun was added. At04:10:03UTC Chrome/Miniflare are closed, whole R4 Auth session/refresh rows0, original client snapshot unchanged, helpers RUNNING, and Chrome/native fixture custody explicitly returned again. Product C1 remains separately owned and is not corrected or approved by this harness work. Earlier sections preserve intermediate evidence within its original scope.

Starting source: `cdc00bd9b5a0a02e897d67885c368bcd3126fc3c`, clean branch `t3/native-browser-acceptance`, workspace `/Users/kanuj/.t3/worktrees/shelv/t3-45beee69`. Both live T3 capability/configuration tools verified `codex/gpt-6.1-sol/reasoningEffort=xhigh/serviceTier=default` before work.

## Implementation plan

Goal: exercise actual application, combined gateway, SQLite private Vault, genuine local Auth/native Edge/PostgREST/SQL in one bounded synthetic first slice. Requirements: D10/D14-D25/D27/D29/D33-D34/D40/D43-D47, pinned Plan/Advisor APIs and the coordinator's explicit custody/test-seam authorization.

Architecture: retain actual app, gateway and Vault. An exact-source-hash esbuild policy seam changes only the two pinned local origin literals in private test bundles. Finite provider dispatch forwards genuine requests to the sole positively attested parent R4 fixture. No fabricated domain/context/Auth response or token; no second BFF.

- [x] Attest existing parent-bound PREPARED/config/migration bytes, DB binding/ledger, Docker labels/volume and helper IDs before any lifecycle or data write. Reject child/foreign binding substitution.
- [x] Guard RED/GREEN: source seam rejects drift; provider routing rejects external/unlisted URLs before fetch. Bundle actual combined gateway/Vault and serve actual candidate with semantic deep links and response headers.
- [x] Genuine Node PKCE: actual gateway request, local Mailpit/verify redirect, idempotent complete with one provider exchange, genuine context and cookie/CSRF, actual native read; cleanup issued provider sessions with SQL proof. Prepare bounded operations/payments helpers through copy/start with source/owner receipts.
- [x] Wait for explicit parent browser grant. Run one serial Chrome with local interception, actual app link/complete, draft/import/assignment/review/payment/publication and client decision/reread/no-Start, plus bounded isolation/CSRF/revocation/late-result negatives.
- [x] Run scoped frontend/session types and candidate build, inspect unchanged production source and final diff, close every owned session/Chrome/Miniflare handle, retain synthetic rows/evidence and return fixture running. Commit only assigned new files; independent harness/chain review remains required.

Only new `apps/portal/{tests,scripts}/rebuild-native-*`, new runtime rebuild-native helpers if needed and this report may be written. No production source, package/lockfile, migration, status/context or global configuration edits. No nested agents, hosted services, real recipients/funds/orders, reset/truncate/history rewrite or old fixture adoption.

Validation will be recorded below as it runs. Root heavy suites/exports are explicitly excluded by this allocation. Browser/DOM remains unallocated until the parent grants it.

## Early reusable harness checkpoint

All files use existing dependencies installed offline from the unchanged portal lockfile. Initial npm invocation inadvertently used Node20 through npm's shell resolution; the complete offline install was rerun with explicit `/Users/kanuj/.nvm/versions/node/v22.23.0/bin` first in PATH. All builds/tests use actual Node22.23.0. No dependency change or external documentation fetch was made under this task's no-external-network constraint.

`scripts/rebuild-native-fixture.mjs:attestFixture(sourceRoot)` passes the actual parent root/path to unchanged existing fixture helpers. It checks both source checkouts'55 migration membership/hashes, config, DB attestation equality, ledger/snapshot hashes, exact volume creation identity, all project/workdir labels, helper owner/IDs/running state and the registered synthetic owner/activated policy. It reads private files only with mode600 checks. No adoption of this parent fixture as child-owned occurs.

`tests/rebuild-native-stack.mjs:connectedStack(fixture)` bundles actual combined `server/advisor-candidate-gateway.ts` and actual `workers/session-vault/index.ts`, with both explicit shared-session flags and SQLite Durable Objects persisted in a new private ignored directory. `bind(context,index)` forwards only same-origin browser requests to `mf.dispatchFetch`, preserves cookie headers and denies browser Authorization/external origins. Its actual ASSETS handler serves built application bytes, semantic deep-link fallback and CSP/no-referrer/no-store/nosniff headers. This browser binding is prepared, not yet executed.

Only `server/policy.ts` in memory is transformed: exact source SHA-256 `c31adceba6e4457183af460d5ebfa3ead1549a772ba7004757885c20607175fc` to test-bundle hash `2ad8a427641259b57708f0f506f4230596afcd946bbddb2541ddd12ad74417c9`, two substitutions per gateway/Vault bundle. Portal becomes `https://127.0.0.1:57430`; Supabase becomes `http://127.0.0.1:57421`. Production bytes, JWTs and strict issuer/sub/session/role predicates remain unchanged. No gateway or bundle is copied into production output.

Provider injection is exclusively finite transport dispatch: unchanged OTP/token/user/logout requests and actual client/advisor context RPCs reach real local GoTrue/PostgREST; fixed plan/operations/payments paths reach native Edge57440/57441/57442. Domain bodies/statuses are actual backend results, with no fabricated response or rewritten JWT. A finite forwarding header set removes workerd transport headers, including its incompatible content-length; it preserves actual apikey/Authorization/Origin/content-type/API version values server-side. Reject-before-fetch routing excludes external/alternate hosts/ports, credentials/fragments, unexpected RPC/functions/query keys and redirects. No business-authority use of service-role occurs.

## Native helper adaptation

Executed only after full attestation under transferred exclusive custody. Original plan container `c293f0943b03cb19850cf906f1e176ad350a8e657f69f06f741d1a881c80086c` remains STOPPED as `portal-plan-edge-6214c3841fb3-w6-before`; original `-initial` remains untouched. Prechange ID/image/private environment hash/original source receipt hash are retained in parent fixture `edge/w6/PLAN-BEFORE.json` and mode600 `plan-before.private.env`.

New running containers use the same pinned native Edge image digest `ad45164b7548bf5820ed7be714789c17ac2865edce79a09cfb4c3756c3d365a8`, exact parent/child source bytes, Docker create/copy/start, container-only existing fixture CA and no .t3 bind mount:

| Container | ID | Port | Memory |
| --- | --- | --- | --- |
| portal-plan-edge-6214c3841fb3 | 7d701d3abefad72e43323834d3a51f15a2bca2c354ecbfb9aae0c38b864a7c75 | 57440 | 256MB |
| portal-w6-operations-6214c3841fb3 | f8f7c3dc2f8d5b53e1d8b234986708ed19a74dd29ca734bd0d8d7ffb025f952d | 57441 | 128MB |
| portal-w6-payments-6214c3841fb3 | eccee7ba7349d282b53fd05ed5321665f8a60b0baf0a1274f273e61f11bec8db | 57442 | 128MB |

Existing TLS helper retains ID `e616a14b5cbb65c1b612af09432cd3a5e5a10ed954566fb17ef18b9ad34a5760`. Its exact whitelist adds only `concierge_advisor_directory`, `concierge_payment_view_v2`, `concierge_payment_write_v2`; original Auth user/plan RPC remain and catch-all returns404. Original and adapted nginx files are preserved. CORS retains production origin and adds only exact local portal origin. Parent `edge/HELPERS.json` records current plan ID; `edge/w6/HELPERS.json` records all IDs/ports/source digest `e967c25e413774972fff6e61c51abf1ba0bd2624ffc52984ee4a836673ae4435`. No schema/policy/business row/reset/global setting/trust change.

## Executed checks before browser grant

Commands from repository root under explicit Node22 PATH unless portal cwd stated:

```sh
SHELV_REBUILD_NATIVE_GUARDS=1 node --test apps/portal/tests/rebuild-native-guards.mjs
SHELV_REBUILD_NATIVE=1 node apps/portal/scripts/rebuild-native-helpers.mjs
SHELV_REBUILD_NATIVE=1 node apps/portal/tests/rebuild-native-pkce.mjs
npm run build:application # apps/portal
```

- Guard RED:0/2 pass, expected missing origin substitution and missing destination refusal; GREEN:2/2 pass.
- Exact parent attestation PASS, source snapshot `34714ceb51c0cec880d15d6abd11fd341fd0abd5534c865fc55295dd6ba3f2a4`, ledger `5d416afa46638874c230d78db574137c315d80268ab6b08c08f3ede982d7e6b1`.
- Native helper create/copy/start and attested rerun PASS; unmodified production plan/operations/payments entries run in pinned actual native runtime.
- Genuine Node chain **5 groups PASS**: gateway/Vault/OTP/Mailpit/actual redirect/PKCE/live context; exact complete retry same session/one provider exchange; all three native Edge business reads; wrong CSRF403; actual gateway/provider logout. Final run captured **one local synthetic email**, zero real emails/hosted requests. Actual access-token issuer equals local Auth issuer without rewrite.
- Final Node run cleanup **1 issued /1 closed /0 auth.sessions /0 auth.refresh_tokens** for its owned issued session. All earlier token-issuing diagnostic runs also closed their owned sessions and proved both counts zero; no earlier failure masks cleanup.
- Actual candidate build PASS. Browser/DOM, Secure-cookie enforcement by Chrome and full UI journey are still pending.

Diagnostic harness errors are preserved as limits, not product bugs: workerd's transport content-length initially made Node fetch reject before Auth; exact completion was initially incorrectly expected to reject instead of return the existing idempotent receipt; initial CSRF probe used a malformed list command and hit400 before CSRF. Corrected command reaches real CSRF403. No production source change resolved these.

Ignored evidence is in child `.local-artifacts/portal-rebuild/w6-native/` and parent fixture `edge/w6/`. `node-pkce-result.json` contains only redacted statuses/paths/counts/seam hashes, never provider credentials or callback query values. Each Miniflare instance is disposed in finally; this early checkpoint holds no browser or running Miniflare handle. Native fixtures/helpers remain RUNNING under W6 custody.

## Prepared browser journey and newly reported prerequisite

Browser source is `tests/rebuild-native-browser.mjs`; synthetic setup/payment helpers are `scripts/rebuild-native-cases.mjs`. Both are explicit opt-in scripts outside automatic test globs. Browser/DOM has **not run**. The fixture contains no W6-created Auth users/cases/plans/quotes yet. The prospective test creates only new labeled `.invalid` synthetic clients and a view-only synthetic human advisor, retaining every ID/private identity file. It never rewrites existing plans/payments/history or owner policy. Any role revocation affects only the newly created viewer.

The planned plan has no products or real skincare advice:20 explicitly synthetic instruction rows, one no-addition decision, one private canary. It passes the actual root content validator. The journey uses actual UI import, assignment, review, approval, synthetic gross receipt confirmation, publication and client decision. Only frozen quote/sent-claim setup uses actual temporary password sessions and the unmodified native Payment API; those sessions close separately without ending browser sessions. No simulated context, fabricated API response or force-set approval is present.

Prepared browser source includes real Secure/HttpOnly checks, callback/history/storage credential exclusion, exact-basis client-safe preview, evening/native Back/Forward/nonzero-scroll/opener assertions, persisted transaction/outbox/clocks/no-Start checks, second-owner/audience/CSRF negatives, actual view-only-role revocation, held genuine backend reply after logout, and supported provider revocation. Coverage stays bounded to a first product-free vertical slice.

Parent steered a concrete prerequisite after W7 appfix R2 `f1ed20b`: W2 `beginRead('open')` snapshots all permission JSON, while the actual assigned read port legitimately updates `approve:false` to `approve:true`; controller then drops its own read and strands busy/view-null. Parent owns the controller fix and actual-app coupled regression. **No retry-twice workaround, false gate/context or forced approve:false is permitted or added.** W6 will apply only the parent's expressly supplied exact fix and wait for the fresh browser allocation after advisorR4 and the quick integration check.

Additional fresh Node checks: all actual gateway ASSETS document/JS/CSS bytes match candidate hashes, with same-origin CSP and semantic deep links. Added root-route assertion first returned500 (test-ASSETS root containment bug, zero issued sessions), then passes after allowing the exact candidate root before normal document fallback. Final full Node chain is now **6 groups PASS**, with one local email and1 issued/1 closed/zero session+refresh rows. Unique per-run result receipts now retain owned session IDs without tokens. Before browser work, Mailpit has6 messages total,5 created during W6, matching the five token-issuing Node proof runs at that point; no real recipient.

Scoped `typecheck:rebuild`, `typecheck:session` and `build:application` pass on unchanged application source. New browser/setup scripts pass `node --check`; these syntax checks are not browser acceptance. No root full suite/export was run. Production app/backend/gateway/policy/cookie/callback/package/lockfile diffs against `cdc00bd9` are empty.

## SQLite persistence sensitivity correction

The reused legacy `durableObjectsPersist` option is ignored by installed Miniflare5's V4 option conversion. Earlier actual live SQLite Durable Objects were real, but the report's assertion that their files were retained under the new artifact directory was premature. A new actual disk inspection assertion caught this: after genuine PKCE, **RED sqliteFiles0/activeSessions0**, while the issued provider session was still closed with both actual SQL counts0.

Installed Miniflare source/type definitions identify the current options `resourcePersistencePath`, `isolatedResourcePersistencePath`, `resourceTmpPath`. The harness now sets all three under its private ignored stack directory, with its Node listener explicitly loopback. No new native /tmp database/Auth fixture or production-source change. **GREEN7 Node groups PASS**: readonly SQLite inspection finds5 actual database files,3 session-record rows and1 active session with1 versioned credential envelope. The actual issued access/refresh credentials are checked against stored JSON and cannot appear in plaintext; flow payloads also retain their actual envelope shape. This diagnostic reads test-owned private SQLite only and never supplies identity or business authority.

The browser script now requires that same actual-disk/encrypted-envelope proof after genuine advisor PKCE. Its execution remains pending. The parent has explicitly retained Chrome for the short W2 integration RED/GREEN regression and will supply the exact fix SHA and fresh browser grant afterward.

## Both-audience Node proof

The fresh complete Node command now has **8 groups PASS**. The added client audience requests its own real PKCE link through the actual client gateway/Vault, captures a second local Mailpit email, follows actual Auth verify Location, completes through the actual client flow/cookie/context, reads the already-published original synthetic client's entitled safe plan through native Plan Edge, then logs out. No client selector is supplied to the owner-derived plan read. Both audience cookies retain their actual names and Secure/HttpOnly/SameSite shape; actual Chrome enforcement is still pending.

Latest run:2 local emails,2 issued provider sessions,2 closed,0 remaining auth.sessions and0 refresh rows for both IDs. Read-only original case/publication/Start/service JSON snapshot is byte-hash equal before/after, SHA-256 `48d2f62290f048927737ec6191f9fc98aeff3e1fb2001b9d5ee67a1d7537eb85`. An initial snapshot query used the wrong service-period ordering column (`id`); inspected canonical schema pins `claim_id`, corrected before the passing run. The earlier query failure still closed its one issued session with both SQL counts0. It did not execute a client plan mutation or reveal credentials.

## Exact browser-response credential and private-fact guard

Parent clarified the already-required byte-level boundary. Before **every** browser-visible response is fulfilled, the harness scans all headers and binary body bytes against exact actual issued access/refresh strings, including prior strings retained across refresh rotation, plus actual fixture provider keys. It never matches generic field names in static JavaScript. Any exact hit aborts fulfillment and records a redacted failure; no response is rewritten to pass. Guard sensitivity RED2/3, missing expected refusal, then GREEN3/3 verifies credential header/binary-body leakage, private sentinel bytes and lawful static token-field names.

Every client API response and actual advisor `preview_draft_v1` response also excludes `W6_PRIVATE_SYNTHETIC_ONLY` in original headers/body bytes. Authorized actual advisor `read_draft_v1` response bytes must positively contain it. Separate actual client API-value/DOM assertions remain. Only counters/statuses/paths are recorded; no provider strings are emitted. The full browser scanner is prepared and still unexecuted.

For the real view-only-role negative, source inspection shows ordinary plan-list authorization requires edit, while the existing client-directory view permits view. The prospective viewer signs in to existing `/advisor/clients`, a finite explicit allowed local callback path, then directly attempts a forbidden create. A second genuine viewer login permits an independent live role-revocation check rather than pretending an already ended session proves revocation. No permissions/context response is altered.

## First genuine browser allocation and source exception

Parent explicitly granted the sole serial Chrome allocation after W7 advisorR4 and W2 released it, and authorized only exact fix `ba829bcc30870ba8a2debf2d595a0f8c3ba7973d`. It is cherry-picked as `7652033` with identical controller/coupled-test/report bytes. This is the sole authorized production-source exception in this branch. No parent report-only/native-field commit was imported. Both live model tools again verified Sol/xhigh/default; initial `preview_status` returned unavailable/no tab. The expressly named repository installed-Chrome/Playwright-core interception workflow was used, one Chrome at a time, service workers/background network/DNS blocked.

Actual assigned gate `approve:true` is preserved. No duplicate retry, forced false permission, invented context/domain response or source patch masked the W2 bug. Its supplied read fix allows the real assignment/read/review/approval sequence to proceed.

### Actual main-chain progress and original byte scans

At `7652033` plus only W6 test changes, run `435546b8-89e5-4b27-971f-ba910becb80f` reaches **7 groups PASS**:

1. Actual advisor UI link request -> local Mailpit -> actual Auth Location -> app consumes/scrubs code once -> Secure HttpOnly SameSite cookie -> real SQLite Vault/context.
2. Actual new unassigned draft, incomplete title save, reload/read confirms persistence and incomplete readiness.
3. Unsupported/code import rejects; actual valid compare/apply persists the explicit private synthetic fact.
4. Actual deliberate existing-client selection/assignment, with Auth count unchanged.
5. Five exact sections deliberately reviewed through the actual UI; actual read confirms all reviewed and zero readiness issues.
6. Actual exact-basis safe preview, evening routine, native Back/Forward,250px scroll, correct heading fallback and exact original routine-editor opener focus; no private fact in preview API bytes or DOM.
7. Exact human UI approval; actual no-payment publication request returns409 `payment_required`; publication/event/outbox/service/review/Start counts remain0.

Then actual temporary owner/client password sessions create frozen quote and sent claim through the **unmodified native Payment Edge**, not direct business SQL or fabricated responses. Both temporary sessions close independently, preserving the browser's other owner session. Run retains actual draft `cde575e9-75b8-4d41-919e-18ef0ddbd5e7`, client `44f98b3d-3c5d-4c26-8bdd-65e798597689`, approval `765c7623-a3bf-4e5d-ae4d-d6bd5cfe6169`, quote `4d740030-5a47-4d7c-bd8c-17361e5e725f`, claim `094dfaa7-57ef-41ca-9922-a00eee9f4e95`. All are synthetic and retained.

That run scans **186 original browser responses**,20,522,746 body bytes, with **0 actual credential/provider-key hits**, **0 private-fact hits** in safe responses, **2 actual safe-preview responses** and **13 positive authorized advisor private draft responses**. No response is rewritten. Run cleanup is **3 issued/3 closed/0 session/0 refresh rows**. No W6 confirmation/publication/decision is counted as successful at this checkpoint.

### New actual payment UI finding: parent-owned, subsequently corrected

Source: `apps/portal/src/features/advisor/AdvisorWorkspace.tsx`, `PaymentVerification` near980-1016. Concrete trigger: refresh publication checks after a new real quote/claim, then open payment verification while its actual payment read is pending. The component initializes `claimId` from the previous empty `claims[0]`, then retains `''` after the actual context contains exactly one claim. The claim selector appears only for more than one claim. UI remains **no applicable unverified claim available** after genuine `advisor_read`200, so the amount/receipt controls cannot appear.

An additional read-only real password/native-Edge diagnostic confirms quote1 is `payable`, publication0, service10000, with its exact matching `submitted_unverified` claim and actual revision2. Diagnostic provider logout returns204 and actual session/refresh counts0. No payment or plan row is changed by that diagnostic. The exact new finding/minimal request was sent to the parent for bounded selection reconciliation and an actual-app regression. W6 authored **no production fix and no wait/retry/hardcoded selection workaround**. Main confirmation/publication/new-client-decision acceptance remains open.

### Independent genuine client/negative browser evidence

`tests/rebuild-native-readonly-browser.mjs` continues independently using the original published synthetic client's existing plan read-only and explicitly owned earlier W6 other/viewer cases. Successful run `b785118c-cccc-4246-9c7a-0483e790d6e4`: **4/4 groups PASS**,4 local emails,4 provider sessions issued/closed,0 remaining sessions/refresh rows:

- Actual client app PKCE/cookie/live context/native entitled safe read and reload, private original canary absent from actual API/DOM, no Start.
- Actual owner selector400, CSRF403 and cookie audience401; a distinct real owner receives only their own preparation state.
- Genuine view-only human has no author control and create403; a separate fresh genuine session loses authority after revoking only that newly created owned viewer grant.
- Actual UI server logout200 is acknowledged before releasing a held genuine backend reply, which returns401; supported provider logout invalidates another actual browser cookie.

**145 original responses**/22,145,393 body bytes scanned, **0 actual credential/provider-key hits**, **0 W6-marker hits**,27 client API responses. H1 later correctly limits this historical byte-level claim: `PRIVATE_REAL_AUTH_CANARY` was checked in parsed API/DOM only, not every original header/body byte before fulfillment. Fresh broader coverage is below. Root original case/publication/Start/service snapshot is unchanged before/after (this probe's serialization SHA-256 `1623f148c413dcefefb1cf3997b1923ebf2bf34c064b18a799631cd1b0834e74`). It uses different key names from the earlier Node snapshot, so the two hashes are not asserted equal across scripts. No client decision or original business record is mutated by this read-only probe. It does not replace the pending W6 new-plan publication/client decision chain.

### Harness diagnoses, preserved rather than promoted

- First two browser starts returned403 `origin_rejected` before Auth. Raw Playwright-intercepted GET metadata had no Origin/Fetch-Metadata/Host headers. The reused original bind already restores missing Origin. W6 now restores only that missing interception header after verifying actual `request.frame()` origin equals the exact local portal; existing headers are preserved and server predicates remain unchanged. No Auth token was issued in those two starts.
- Preview's initial scroll setup needed the established render/animation-frame settling step. A later focus assertion incorrectly expected the programmatically focused main element to survive a click on an unnamed-ID navigation control. Actual canonical navigation correctly restored250px and its specified page-heading fallback. The corrected test asserts that fallback plus separately the exact real editor opener. No navigation source was changed.
- A second viewer OTP hit actual429 because it was requested inside unchanged GoTrue `max_frequency="1s"`. The test honors1.1s; no provider limit/config change.
- The first held-result probe released on local signed-out form display, before asynchronous actual server logout. The standalone raw diagnostic fetch has no app lease fence and can still lawfully return during that gap. The test now waits for the actual UI logout200 acknowledgment, then releases; actual held response401 passes. It does not fake a server logout or apply the late data to the app.

All failed-attempt result/session ID receipts and synthetic rows remain retained. An early parent message misstated first-two-start identity totals; actual inventory is authoritative: **5 main attempts created15 new .invalid Auth users:10 clients/cases and5 view-only advisors**,3 assigned W6 drafts,1 approval,1 quote and1 sent claim at this checkpoint. No reset/cleanup erases them. Two own viewer grants were revoked by independent probes; owner policy and original grants remain unchanged.

## Resource release checkpoint

All Chrome contexts, Chrome processes, Miniflare instances and local runtime handles close through finally on every run. After the terminal independent PASS, `preview_status` again reports no tab and OS inventory reports `automationChromePids:[]`. Chrome was explicitly released to the parent immediately. Fresh positively attested R4 readback confirms **all** fixture `auth.sessions=0` and `auth.refresh_tokens=0`, and current plan/TLS/operations/payments helpers RUNNING. Native fixture custody remains with W6 pending continuation, with no ongoing browser or Miniflare handle.

`custody-checkpoint.json` under child W6 artifacts records every main run's owned identity/draft/approval/quote/claim IDs, cleanup counts, all mode600 private fixture hashes and current helper/binding receipts. Key private-only SHA-256 values (no file contents): original retained plan environment `34dc168e746eec29a725b7d12e73a58ef714e7145db7d4ac765361b83eb41766`; adapted environment `884335815ca3a8cc9580f17d205a03dd757180d78e1549c53829e86a98fa3144`; native source receipt `9972ec159f35098481d068f004bc231906df0e0678215ea3b03bdd6a711383d8`; current helper receipt `eb37bd8c5b5d2f8d6010ee584bf1e841f01afef77173edb67fcfb4689753889f`; unchanged runtime binding file `f49e7bec77b56f3885cfc527efd023b94337aa814feabc1e10ebf946a40890e6`.

Parent has assigned the exact late-single-claim race to a bounded W2 worker, solely PaymentVerification/scoped tests/report, with no fixture access. Its required fix binds selection and gross/verified intent to exact client/claim/frozen quote basis, resets replaced-basis intent and preserves unchanged-basis manual work. That worker now owns the sole intercepted Chrome allocation. W6 remains source/Node HTTP only under native custody until exact fix SHA and a fresh grant; no wait/reopen/retry/claim fabrication bypass will be introduced. Fresh scoped frontend/session types and application candidate build at clean `8c7c8c1` all pass; only authorized controller bytes differ from the original production source.

The next main test is prepared to hold an **unchanged actual native** `advisor_read` response until the real verification view is open, then release its actual late single claim. This strengthens deterministic sensitivity and never waits for new context before opening, forces a selection or rewrites any response. It is not yet executed. The prospective successful publication assertions also retain actual persisted review/service dates and independently check the service start against the publication instant's America/Chicago calendar date. These additions pass syntax/scope checks only at this checkpoint.

## Final genuine connected execution

Parent granted sole Chrome again and authorized only `db8a8980d1feb7ee98bc91012610c4e29d282912`, cherry-picked unchanged as `21346956e1f2775b9a69e7a74311026b70b07b2a`. This adds only the supplied PaymentVerification fix/test/report; exports are unchanged. Together with the earlier exact `ba829bcc`/`7652033` controller fix, these are the only production-source exceptions. W6 authored no production/UI/gateway/cookie/callback/policy/backend/migration/package/lockfile correction. `git diff --exit-code cdc00bd9 -- supabase src/contracts <runtime/server> <runtime/workers> <portal package/lock>` is clean.

Before browser work, `preview_status` returned no tab; the explicit named repository Chrome workflow was used. The application was built at clean **`21346956e1f2775b9a69e7a74311026b70b07b2a`**. Starting base/workspace/branch remain those at the top of this report. Both live model tools again confirm **codex / gpt-6.1-sol / reasoningEffort=xhigh / serviceTier=default** at final verification. No remote fetch was attempted under the task's no-external-network boundary; no current remote/CI claim follows from the local source check.

The prepared genuine late-claim sequence is **unchanged**: actual canonical quote/claim -> hold original native `advisor_read` response -> actual refresh -> ordinary verification open -> release original single-claim response -> actual amount/receipt controls recover. No wait-for-context, reopen, retry, forced claim, synthetic gate or response rewrite is used. The actual UI submits gross100.00 plus deliberate receipt-check flag to the actual native Payment Edge. The same approval ID survives; publication/event/outbox/service/review/Start counts remain0 until the separate publish click.

**Run:** `f1b451cd-4a8e-40eb-b05a-437584200544`. **Result:13/13 groups PASS**, original7 plus:

- Actual UI synthetic receipt confirmation succeeds through the genuine native service, preserving exact approval and null clocks.
- Deliberate UI publication creates exactly1 immutable publication,1 durable event,2 queued delivery rows,1 service start and1 review schedule, with0 Starts.
- Actual new-client app PKCE/cookie reads its entitled safe plan, deliberately records its no-addition decision, reloads/rereads the persisted approved choice, and leaves actualUse/Start and publication/clock/outbox counts unchanged.
- Actual caller-selected owner400, wrong CSRF403, wrong audience401 and another genuine owner's own preparation result.
- Actual view-only human denial, then a separate fresh genuine session loses authority after only its new local grant is revoked.
- Actual UI server logout acknowledgment precedes a held real backend response returning401; supported provider logout invalidates another actual browser session.

The previously reported payment race is **addressed for this exact genuine late-single-claim reproduction** by the supplied fix. No new cross-owner stale-notice failure occurred in these paths. This is not exhaustive adjudication of the broader notice concern or the author's entire basis/intent matrix; fresh independent review remains required.

### Final actual identities, transaction and clocks

| Record | Actual synthetic identity/value |
| --- | --- |
| client / other / viewer | `e58fca52-0012-4d2f-9f7e-ead2855808ca` / `c120e00c-0e31-43ec-959b-48f2b9f8eedf` / `b954bb86-920c-4cee-b920-acee2034dcf4` |
| draft / approval | `fb61b2b7-c500-4ace-aba7-aefe3fce9261` / `ab0afc83-46f3-4079-9f67-e27131333a23` |
| frozen quote / claim | `f2b3358d-44db-4437-8aab-98ad57216080` / `47c90dd8-1790-4e95-aa56-91c39929f66b` |
| publication instant | `2026-10-31T03:54:41.447579+00:00` |
| Chicago service period | `2026-10-30` through exclusive end `2026-11-30` |
| persisted review dates | `2026-11-13`, `2026-11-30`, `2026-12-30`, `2027-01-30` |

Actual advisor audit firstPublicationAt equals immutable plan publishedAt. Actual SQL service start equals that instant's independently formatted America/Chicago date; service end equals the persisted first-month review boundary. Confirmation alone left all clocks null; publication deliberately started them. Decision/receipt never creates Start.

Final main original-byte scanner: **343 responses**, **42,797,516 body bytes**, **0 exact access/refresh/provider-key hits**, **0 private sentinel hits in safe responses**, **31 client API responses**, **2 safe preview responses** and **13 positive authorized advisor private draft responses**. All headers and binary bodies are scanned before fulfillment, every issued token generation retained; no credential-bearing response is rewritten or fulfilled. DOM/page-error/unexpected-network checks pass. No callback URL, token, trace or screenshot was retained before scrub. This product-free fixture exercises real recommendation navigation and editor return; product-sheet/evidence/source-upload flows remain outside this particular journey.

Final main local Auth email count5, real emails0, hosted requests0, real funds0. Provider sessions **7 issued/7 closed/0 remaining auth.sessions/0 refresh rows**, including separately closed temporary payment setup sessions and idempotently tracked earlier sign-outs. All seven session IDs are retained in the redacted result; no bearer/refresh/password value is in source/report/result JSON. Actual private SQLite proof finds5 database files/3 record rows and an encrypted active session envelope before teardown.

### Final commands, artifact identities and limits

All Node/npm commands use explicit `/Users/kanuj/.nvm/versions/node/v22.23.0/bin` first in PATH, actual22.23.0. Commands from repository root:

```sh
SHELV_REBUILD_NATIVE_GUARDS=1 node --test apps/portal/tests/rebuild-native-guards.mjs
SHELV_REBUILD_NATIVE=1 node apps/portal/tests/rebuild-native-pkce.mjs
SHELV_REBUILD_NATIVE=1 SHELV_REBUILD_NATIVE_BROWSER=1 \
  node --experimental-strip-types apps/portal/tests/rebuild-native-browser.mjs
SHELV_REBUILD_NATIVE=1 SHELV_REBUILD_NATIVE_BROWSER=1 \
  SHELV_REBUILD_NATIVE_CASE_RUN=c63a85e1-76a3-4ffd-bb74-645bdf7cc0e0 \
  node --experimental-strip-types apps/portal/tests/rebuild-native-readonly-browser.mjs
npm --prefix apps/portal run typecheck:rebuild
npm --prefix apps/portal run typecheck:session
npm --prefix apps/portal run build:application
git diff --check
```

Main13 and auxiliary4 are genuine connected browser groups. Node8 is separately genuine HTTP/cookie/SQLite/native evidence, and guard3 is pure boundary sensitivity evidence; counts overlap and are not summed. The readonly helper consumes an explicitly owned active viewer grant by revoking it; its exact already-consumed run is retained evidence rather than a hidden grant reset. Main reruns create new labeled identities and preserve originals. The final guard3/typechecks/build all freshly pass at clean2134695 after Chrome release. Actual candidate JS/CSS bytes are unchanged after the fresh build.

| Child ignored artifact under `w6-native/` | SHA-256 |
| --- | --- |
| `browser-result.json` | `b870b68602af015c42469748da9420b2064c7ca431fd82539c8d9014972f5541` |
| `readonly-browser-result-b785118c-cccc-4246-9c7a-0483e790d6e4.json` | `115345e30de475b43d8a221abff6d8179ba41a8c091f2263788f431ab3cb6711` |
| `node-pkce-result.json` | `bc96eaee9ff1c884d62e5e430f9bb8ce78b3fba3b2112a47b79c41ff61a4cdea` |
| `final-resource-release.json` | `0d96eaf9b67f322757ee9468fa4cf059578605f161b16cd4459dd71f2adc57dd` |
| `candidate-browser-bytes.json` | `54514e1386dcc99f6b7786f2eedb5db73ffc5c04be9943ae5339e431a4defbc3` |

Actual tested candidate: application JS `47f519a2cf39872226c161e8f4c6da7db629cf49ef62ac062355b2492ed6c2c1`, CSS `6ac7a7bd018c751dc30c5db34eb01273806be9f716b23644760d5297c37423c1`, original clean-source application provenance `2730b2a0c0375362bdb5237b86f088f710324ee935155dc6d66c6f905a0dd0b0`. `FINAL-INVENTORY.json` retains all6 main attempts,18 new .invalid users:12 client/cases and6 viewers,4 drafts,2 approvals,2 quotes and2 sent claims, with1 W6 confirmation/publication. Failed attempts remain; no reset/truncate/plan-history/payment rewrite/delete occurred. All per-run owned IDs and mode600 identity-file hashes are included, including final identity SHA `e841e5ad02d6ec1b3a6384c9476005a393b193e3f104aa4b4a81f426e442d471`.

Additional original credential-file hashes, values never printed: status `8c735922898804dd68af30b225f5fdbbfc4d3bf770d37731c87e2e1d5e7c4090`; owner probe `c941267080902db329e1fec1fa6d84e92d2c30490e09916cd59ea975797e9d6b`; original plan identities `50af9f7457305efb51b69239706fd3e495d11fc7fd4e2551046ef87a3ef11a6b`. Native helper/binding/source/private environment hashes and exact IDs remain those recorded above.

At **03:55:41.660UTC**, fresh process/fixture evidence has `automationChromePids:[]`, preview no tab, entire R4 `auth.sessions=0`, `auth.refresh_tokens=0`, original Root client case/publication/Start/service hash still `48d2f62290f048927737ec6191f9fc98aeff3e1fb2001b9d5ee67a1d7537eb85`, and helpers RUNNING. **Both sole Chrome allocation and native fixture custody were explicitly returned to the parent immediately.** No browser/Miniflare handle or owned provider session remains. No fixture lifecycle/data write or browser call followed that return until the separate explicit H1/H2 regrant below; later parent activity is outside this checkpoint's zero-row observation.

No full root/portal suite or heavy Expo/iOS export, new reset/pgTAP/security-advisor run, hosted/CI/push/PR/merge/deploy, actual email delivery/webhook/retry, real clients/sources/money/orders, product Start/use reports, uploads/history/account/remaining pages/Maya stages, screenshot pixel comparison, complete accessibility, human comprehension, licensing, clinical or legal acceptance is claimed. Existing root/native author evidence retains its original scope. Independent fresh source/harness/chain review remains required before parent acceptance; passing this first vertical slice does not complete D01-D48 or authorize release.

## Independent source review follow-up: H1/H2

Read full `659e602:docs/portal-rebuild/research/W7_COUPLED_SOURCE_REVIEW.md`, including H1/P2, H2/P3, C1 and attribution limits, and applied receiving-review/verification workflows. Live source confirms both harness findings. The review is source/pure evidence, not an observed native private disclosure or retained-process claim. Parent temporarily regranted the same R4 fixture and sole Chrome solely for these corrections, bounded readonly rerun and cleanup-negative verification. No production/controller/notices correction, full-main replay or broader authorization was inferred.

### H1: original marker configuration corrected and sensitized

The original pre-fulfillment list covered only `W6_PRIVATE_SYNTHETIC_ONLY`. The original client's `PRIVATE_REAL_AUTH_CANARY` parsed-value/DOM checks did not establish original header/binary-body exclusion before delivery. Shared pure `safePrivateMarkers` now supplies **both exact known strings** to every client API/safe-preview pre-fulfillment scan. The exact credential rotation/key scanner is unchanged. Authorized advisor draft responses still apply credential guards while permitting their private facts and retaining the positive W6 draft counter.

Sensitivity uses the actual shared configuration, with separate header and binary-body tests so both failures are observed. Temporarily restoring only the old W6-only configuration gives **4 pass/2 expected fail** (`Missing expected exception` for the original marker in each location); restoring both markers gives **6/6 pass**. Existing credential/header/binary/static-field-name controls and the authorized-private positive remain passing. No fixture or Auth operation occurs in these pure reversions.

### H2: preflight and acquisition cleanup corrected

Readonly selected-run validation, receipt lookup, exact identity/private-file checks and original snapshot now occur **before** runtime acquisition. Exact synthetic viewer identity, unconsumed active local grant and actual original advisor-only marker presence are revalidated before the probe. Invalid run/missing receipt cannot allocate Miniflare or Chrome. Acquisition is inside the readonly `try/finally`; its cleanup/report path handles an unreturned stack. `connectedStack` guards construction/readiness and calls actual `mf.dispose()` before a readiness failure escapes. Unrelated disposal errors propagate as an aggregate failure, rather than being hidden.

Locked Miniflare source shows `dispose()` completes its independent/runtime/socket cleanup, then rethrows the **identical cached readiness error**. The helper accepts only that identical error as completed cleanup; a different error is not ignored. Failure instrumentation is opt-in, test-only and permits only an exact loopback listen port plus lifecycle observation, not Auth/context/domain replacement.

`tests/rebuild-native-cleanup.mjs` executes three meaningful real failures:

- An actual Node listener occupies one loopback ephemeral port. Actual Miniflare with unchanged gateway/Vault bundles is instructed to use it; `mf.ready` rejects `ERR_ADDRESS_IN_USE`. Before the fix, automatic-disposal count is0 and the assertion fails; after the fix the disposal event follows actual cleanup and **owned workerd PID inventory is empty before diagnostic rescue**.
- Invalid selected run exits1 before runtime directory allocation.
- Missing selected receipt exits1 before runtime directory allocation.

Final result **3/3 PASS**,0 Auth issued and actual session/refresh counts0. No Chrome starts in these probes. An initial probe-author `finally` let Miniflare's cached readiness error skip closing the diagnostic blocking listener. Only that probe's exact Node/child PIDs `68993/68997/69259` were terminated, then its nested `finally` was corrected and the intended RED/GREEN rerun completed normally. This is preserved as a diagnostic fault, not a claim that the original reviewed code left a production process or Auth session running. No Docker/Colima/helper resource was stopped or adopted.

### Fresh bounded readonly rerun and second return

Command under explicit Node22 PATH, after complete parent fixture/ownership/marker revalidation:

```sh
SHELV_REBUILD_NATIVE=1 SHELV_REBUILD_NATIVE_FAILURE_PROBES=1 \
  node --test --test-concurrency=1 apps/portal/tests/rebuild-native-cleanup.mjs
SHELV_REBUILD_NATIVE=1 SHELV_REBUILD_NATIVE_BROWSER=1 \
  SHELV_REBUILD_NATIVE_CASE_RUN=df71e446-dd84-4637-841f-df53a3680727 \
  node --experimental-strip-types apps/portal/tests/rebuild-native-readonly-browser.mjs
```

Used only an unconsumed earlier explicitly W6-owned viewer/other case; no new users/cases/plans/quotes, no reset or prior-revocation rewrite. Run **`d0b3cdaf-541b-4e61-8267-f45c5b02cddc`**, **4/4 groups PASS**,4 local Auth emails,4 provider sessions issued/closed,0 session/refresh rows. It rechecks entitled client read/reload, actual owner/audience/CSRF refusals, genuine view-only/role revocation and actual acknowledged logout/held reply401/provider revocation. This consumes that owned viewer's grant by revoking it, as intended.

**145 original responses**, **22,175,409 body bytes**, **27 client API responses**, **0 actual issued access/refresh/key hits**, and now **0 hits for either known private marker before original header/binary bytes are fulfilled**. Original marker existence in actual private advisor source is positively checked before acquisition. API/DOM checks remain. The main13 result is retained at its actual2134695 source and W6-marker coverage; no expanded original-marker byte claim is retroactively attached to that older main run. No full-main rerun was needed or performed.

At **04:10:03.675UTC**, actual process readback again has Chrome PID inventory empty, preview no tab, whole positively attested R4 sessions/refresh rows0, original case/publication/Start/service hash still `48d2f62290f048927737ec6191f9fc98aeff3e1fb2001b9d5ee67a1d7537eb85`, helpers RUNNING with unchanged IDs/binding/source/CA/origins. **Chrome and native fixture custody explicitly returned again to the parent.** No native data/lifecycle/browser work follows this second return.

| Follow-up child ignored artifact | SHA-256 |
| --- | --- |
| `readonly-browser-result.json` (fresh d0b3cdaf) | `7501e079239a5391a43e46e523e869d709a4e06b84ca53404567a52df62b2216` |
| `cleanup-negative-result.json` | `6ade20eb944c212d0fa003aceacfce2b8d3b2f1c1409d115e398754aa127dd87` |
| `h1-h2-resource-release.json` | `67f339eedc38f589c42e6d1ac7b28156c034e724c39c3439ec633f04d154df27` |

H1/H2 are addressed within this tested scope and require independent disposition. C1 and the separately assigned controller/notice issues remain outside W6 ownership; no controller edit, stale-notice suppression, gate fiction or overall application/source approval is claimed.

**Final clean native implementation/test head:** `f2330f4c3b7c15fb2caca4aea8114d61da232dc5`. Fresh guard6, frontend/session strict typechecks, application build and `git diff --check` all pass at that clean head after the second custody return. No fixture/browser work was rerun for these source-only checks. Both live T3 model tools again verify Codex/Sol/xhigh/default. The containing final report commit is documentation only; its hash is returned in the handoff. All authored native files remain inside the allocated rebuild-native prefixes; the two exact parent-supplied UI commits are the documented exceptions, and backend/contracts/gateway/policy/package/lock bytes are unchanged.
