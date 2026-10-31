# W6 genuine connected browser verification

Owner: Kanuj. Work in progress, 30 October 2026. This report is the sole allocated planning/evidence document for W6. No completed browser acceptance is claimed.

Starting source: `cdc00bd9b5a0a02e897d67885c368bcd3126fc3c`, clean branch `t3/native-browser-acceptance`, workspace `/Users/kanuj/.t3/worktrees/shelv/t3-45beee69`. Both live T3 capability/configuration tools verified `codex/gpt-6.1-sol/reasoningEffort=xhigh/serviceTier=default` before work.

## Implementation plan

Goal: exercise actual application, combined gateway, SQLite private Vault, genuine local Auth/native Edge/PostgREST/SQL in one bounded synthetic first slice. Requirements: D10/D14-D25/D27/D29/D33-D34/D40/D43-D47, pinned Plan/Advisor APIs and the coordinator's explicit custody/test-seam authorization.

Architecture: retain actual app, gateway and Vault. An exact-source-hash esbuild policy seam changes only the two pinned local origin literals in private test bundles. Finite provider dispatch forwards genuine requests to the sole positively attested parent R4 fixture. No fabricated domain/context/Auth response or token; no second BFF.

- [x] Attest existing parent-bound PREPARED/config/migration bytes, DB binding/ledger, Docker labels/volume and helper IDs before any lifecycle or data write. Reject child/foreign binding substitution.
- [x] Guard RED/GREEN: source seam rejects drift; provider routing rejects external/unlisted URLs before fetch. Bundle actual combined gateway/Vault and serve actual candidate with semantic deep links and response headers.
- [x] Genuine Node PKCE: actual gateway request, local Mailpit/verify redirect, idempotent complete with one provider exchange, genuine context and cookie/CSRF, actual native read; cleanup issued provider sessions with SQL proof. Prepare bounded operations/payments helpers through copy/start with source/owner receipts.
- [ ] Wait for explicit parent browser grant. Run one serial Chrome with local interception, actual app link/complete, draft/import/assignment/review/payment/publication and client decision/reread/no-Start, plus bounded isolation/CSRF/revocation/late-result negatives.
- [ ] Run scoped frontend/session types and candidate build, inspect unchanged production source and final diff, close every owned session/Chrome/Miniflare handle, retain synthetic rows/evidence and return fixture running. Commit only assigned new files; independent harness/chain review remains required.

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
