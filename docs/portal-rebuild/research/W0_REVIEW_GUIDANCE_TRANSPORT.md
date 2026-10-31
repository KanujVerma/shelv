# W0 reviewed Review/Guidance transport integration

Owner: Kanuj. 31 October 2026. Source-only implementation in the retained cookie/Vault gateway. No application/default activation, canonical SQL, genuine Auth, browser or release acceptance is claimed.

## Runtime, source and ownership

- T3 workspace `/Users/kanuj/.t3/worktrees/shelv/t3-de43a1b0`, branch `t3/wire-review-guidance-transport`, clean starting base `3edb0700eeb423082a99a4e7e617b348364bc3dd`. The ten reviewed backend imports through M61 are actual parent source. No source from another implementation branch was copied. Local origin/main was inspected at `d39a7d4943209080df7c4cf97d85784f462758bf`; no remote freshness or CI claim.
- Task correlation key `command:mcp:80ff67d2-459c-49fa-93e3-1b40a1f4cbcd:delegate-task:portal-rebuild-w0-review-guidance-transport-20261031-r1`. Actual backing thread `thread:delegated-task:command%3Amcp%3A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%3Adelegate-task%3Aportal-rebuild-w0-review-guidance-transport-20261031-r1`. Actual run `run:thread:thread%3Adelegated-task%3Acommand%253Amcp%253A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%253Adelegate-task%253Aportal-rebuild-w0-review-guidance-transport-20261031-r1:ordinal:1`, started `2026-10-31T17:01:40.195Z`. Live thread read identifies actual parent `d632030a-18f7-4dec-a2c9-f5c0418c3fd5` and project `ac0af19d-d404-4f53-a870-02bfd76c2a80`. Capabilities' parentThreadId repeats this child in this harness; it is not the actual parent. No parent task-status handle is invented.
- Both LIVE `orchestrator_capabilities` and `t3_thread_configuration` establish **codex / gpt-6.1-sol / reasoningEffort=xhigh / serviceTier=default**, full-access/default. Advertised reasoning descriptors low/medium/high/xhigh/max/ultra and service descriptors default/priority support the explicit selection. Catalog default low is not the effective effort. Project/default-subagent settings and all eight w0-w7 TOMLs explicitly pin Sol/xhigh. No nested delegation or settings change.
- Every Node/npm/compiler invocation explicitly selects `/Users/kanuj/.nvm/versions/node/v22.23.0/bin` in PATH and the actual v22.23.0 binary. Own portal locked offline `npm ci --offline --ignore-scripts --no-audit --no-fund` installed130 packages. No Root install, package/lock/dependency/config change.
- Root and portal AGENTS, full95388-byte input in three bounded ranges including A/B/C, D01-D48/desktop/full manifest, implementation contracts, CARE/PLAN/ADVISOR_READ, acceptance/ownership/status/addendum and reviewed W1 contract/implementation, W7 backend R1/R2/R3, integrated care/status/CA1/provenance records are the requirements. Their historical evidence and resource custody are not adopted. TDD, systematic debugging, review and verification workflows apply; independent NEW review stays coordinator-owned under the explicit no-nesting boundary. Cloudflare Workers/DO and Supabase skills were read before implementation.

## Coherent API seam

Only three new fixed JSON routes are admitted: `/api/client/reviews`, `/api/advisor/reviews`, `/api/advisor/guidance`. Client guidance stays404 and client action metadata remains exactly the retained eight actions. Advisor Review has exactly eight; Guidance has exactly nine. Root Review15/Guidance9/Care13/Plan26/Task14 are unchanged; SQL denies new task agents.

`review-policy.ts` and `guidance-policy.ts` consume canonical Root builders/parsers and positive `decodePortalReviewResponse`/mappers. No business DTO is redefined. Cookie boundary responses and provider responses are validated. Invalid write acknowledgement or503 transport loss remains uncertain; status and other reads remain unavailable/rejected. No automatic retry, new UUID or fresh authority follows a receipt. Request/status keeps the original request body and SQL's original receipt authorization.

Existing provider dispatch goes only to fixed reviewed `concierge-reviews` or `concierge-guidance` Edge endpoints. Their actual retained runtimes dispatch only `concierge_review_command_v1({p_command})` and `concierge_guidance_command_v1({p_command})`, with the actual provider public apikey and caller bearer. A new synthetic source vector executes provider -> actual handler -> actual runtime -> fixed RPC boundary; it is not SQL persistence or genuine Auth proof. Caller endpoints, RPCs, roles, actors, client owner selectors and extra fields reject before egress. No service credential or new transport is added.

| Gateway requirement | Actions | Inspected SQL authority, still independently enforced |
| --- | --- | --- |
| view | Review advisor publication3, reported products, instruction manifest/detail, status | M58 `review_guard` -> Care safe view. Status rechecks the actual original receipt's edit/source/publish rights before/after waits; view is not private receipt authority. |
| edit | Review conversation, private note, advisor care history | M58 `review_guard` -> `plan_guard`; history is private independently of READ classification. Source guards remain independent. |
| edit | Guidance create/read/save/rebase/review/approve/revoke/status | M58 public Guidance begins at `plan_guard`; private original source authority and exact policy/approver/revocation checks remain SQL-owned. Approval/revocation do not infer caller publication authority from selected publisher. |
| edit + publish | Guidance publish | M58 `review_guidance_publish`/`review_output_authority` requires actual caller publish, exact current human approval and selected publisher/source/coverage. |

Read classification uses the canonical closed metadata (including both request_status actions), never an action-name prefix. Static browser lists are parity-tested against Root. Client reviews preserve the existing eight-action/five-read/22-error/500000-byte semantics. No client guidance list exists.

New families use request500000 actual UTF8 bytes, response1800000 and page400000 through Root positive mappers under the retained provider2000000 ceiling. Plan/Care stay500000; existing operations/payments/checkins100000 and multipart/file limits remain unchanged. New families reject FormData. The sole existing exact `concierge_content_version_required` alias remains unchanged; no generic prefix stripping is introduced. All22 canonical finite errors are propagated with their exact tested statuses; unknown upstream namespace/private text is discarded.

The generic existing `session.execute` already invokes the audience-selected provider and retains CSRF/live context/logout/late-result fences. No Vault/DO class, binding, namespace, storage, credential, encryption, PKCE, key, alarm, remember or session-lease code needs modification.

## Test-first checkpoint

Evidence directory, own ignored files only: `.local-artifacts/w0-review-guidance/`.

- `runtime-red.log`:12 tests,1 retained Vault control pass/11 failures. Valid Root commands fail actual retained parser `action_forbidden`; three actual routes fail404 versus expected200. Missing static metadata is an additional assertion, not a module/import failure or the sole product RED.
- `runtime-green-first.log`:12/12,0 failure/skip/cancel,613.209ms after the bounded dispatch implementation.
- `seam-check-2.log`: retained Plan/Care/manual/navigation32/32,0 failure/skip/cancel. Global external fetch denies; no listener, resource or runtime stack.
- `seam-check-0.log` and `seam-check-1.log`: actual session and frontend strict typechecks exit0,0 diagnostics, original flags.

Exact commands from Root (all with explicit Node22 PATH):

```sh
env PATH=/Users/kanuj/.nvm/versions/node/v22.23.0/bin:$PATH /Users/kanuj/.nvm/versions/node/v22.23.0/bin/node --loader ./tests/portal-review-gateway-loader.mjs --import ./tests/portal-review-no-network.mjs --test --test-reporter=spec apps/portal/session-integration/runtime/tests/review-guidance-channel.test.ts
env PATH=/Users/kanuj/.nvm/versions/node/v22.23.0/bin:$PATH /Users/kanuj/.nvm/versions/node/v22.23.0/bin/node --loader ./tests/portal-review-gateway-loader.mjs --import ./tests/portal-review-no-network.mjs --test --test-reporter=spec apps/portal/session-integration/runtime/tests/plan-channel.test.ts apps/portal/session-integration/runtime/tests/care-channel.test.ts apps/portal/session-integration/runtime/tests/manual-methods-policy.test.ts apps/portal/session-integration/runtime/tests/navigation-return.test.ts
env PATH=/Users/kanuj/.nvm/versions/node/v22.23.0/bin:$PATH /Users/kanuj/.nvm/versions/node/v22.23.0/bin/npm --prefix apps/portal run typecheck:session
env PATH=/Users/kanuj/.nvm/versions/node/v22.23.0/bin:$PATH /Users/kanuj/.nvm/versions/node/v22.23.0/bin/npm --prefix apps/portal run typecheck:rebuild
```

Experimental loader warnings are preserved. The retained loader transpiles actual current source and reads parent TypeScript/Auth-JS packages only; it starts no parent fixture. Synthetic gateway tests use a namespace fake; Vault tests use only the existing in-memory store/envelope pattern, with no SQLite/Miniflare. Root deps are absent. Full Root npm/tests/types/Expo, full portal/session (which launches Chrome), canonical61/pgTAP, genuine R8, feature App composition, independent NEW review and exact-head CI remain separate gates. No full-goal claim.

## Final source delivery

Early coherent protocol commit: **`885aa414d2a37ea70927ba4cc6deb69c34bacf3d`**. Final production/test commit: **`020cf72510aa6db480233d5f23325d28a71a22ff`**. The later report-only commit does not relabel the clean build's executed source head.

New [advisor-review-request.ts](../../../apps/portal/src/app/advisor-review-request.ts) exports exactly `createAdvisorReviewRequest(runtime:ApplicationSession)` and `createAdvisorGuidanceRequest(runtime:ApplicationSession)`, each returning `OperationPort<unknown,unknown>`. They use the actual retained advisor factory/acquire/CSRF/session transport and capture the creation boundary. Owner, audience, local generation, cookie epoch and boundary replacement retire old ports before egress. Wire is detached synchronously before either awaited lease acquisition. Post-await result/error/abort fences and suspended unexpired lease semantics match the unchanged client raw request. No URL/RPC/owner/header/fetch/credential argument, token getter, new actor/session metadata, task grant, App port or default activation is introduced. A canonical domain adapter must positively validate the raw values; raw transport success alone is no business acknowledgement.

Two bounded regressions were addressed after the early checkpoint:

1. Enabling advisor Review metadata made the old retained client-factory assertion fail: calling `createClientCookieRequest('reviews', advisorSession)` no longer threw. The new-family-only client guard now denies that audience and denies guidance; the original12 client tests are unchanged and pass. Client actions/reads/errors and raw implementation remain exact.
2. Provider validation initially discarded the parsed command, leaving post-await mapping tied to a caller-owned object. `provider-capture-red.log` records the intended failed original-response assertion after mutation. New-family dispatch now retains the canonical parsed Operation as a const; advisor Review/Guidance and client Review held-response controls pass. Legacy channels keep their original operation path. An intermediate reassignment broke two existing TypeScript photo-closure narrowings; const capture fixes those diagnostics without editing photo behavior.

The initial raw-export run has one retained factory control pass and30 absence assertions. **Those missing-export assertions are not claimed as product RED.** `raw-green-first.log` records40/43: the unchanged client-factory regression above and two incorrect new test expectations. Real401 retires the actual private boundary, so its stale error code is deliberately discarded by the retained client-compatible fence. Only those new expectations were corrected to require session-ended401 with no stale code; other20 finite codes remain observable while current. No old assertion was changed.

Final bounded verification, all0 failures/skips/cancellations for the passing test commands:

| Check | Actual result / evidence |
| --- | --- |
| New raw advisor requests plus unchanged client requests | **45/45**:33 new +12 retained, clean-head `clean-requests.log`. Finite actions,22 statuses, READ/write503, exact UUID/body retry,500000/500001 UTF8, caller mutation, captured owner/CSRF/epoch/generation, held200/403/409/503, logout/source-policy denial/abort, audience and disposed boundary. No provider credentials. |
| New runtime channel tests + retained Plan/Care/manual/navigation + Vault | **59/59**:15 new +32 retained +12 retained Vault, `runtime-release.log`,1619.882ms. Actual parser/gateway/provider boundaries; synthetic namespace and memory Vault only. |
| Provider -> actual reviewed Edge handler/runtime -> fixed RPC | **1/1** grouped test for both families, `rpc-chain-final.log`. Exact public apikey, original caller bearer, `/auth/v1/user`, and only each fixed `{p_command}` RPC. It proves source/API correspondence, not current SQL rights or persistence. |
| Retained exact error alias/legacy401 behavior | **9 vectors**, `legacy-error-nine.log`; global external fetch denies, unknown namespaces stay closed. Entire existing provider `json` method equals base, including the sole exact alias. |
| Root pure domain/contracts/handlers | **80/80**, `root-focused.log`,7340.209ms. Includes existing maximum1555338-byte V3,2550 actual scopes/26 pages and120000-body individual details. These Root files remain exact reviewed35d blobs; no SQL replay or new canonical claim. |
| Actual frontend strict configuration | Exit0/0 diagnostics, `frontend-strict.log`; strict/noUncheckedIndexedAccess/verbatimModuleSyntax/skipLibCheck:false unchanged. Includes both new raw exports and actual transitive imports. |
| Actual session strict configuration | Exit0/0 diagnostics, `session-strict-final.log`; tracked configuration unchanged. |
| New runtime test strict check | Exit0/0 diagnostics, `test-strict-runtime-final.log`. Ignored config extends the exact tracked runtime config, adds only Node types and the new test to its include. |
| Exact Root consumer strict flags | Exit0/0 diagnostics, `consumer-strict.log`; four actual PortalReview modules/transitive imports, strict/noUncheckedIndexedAccess/verbatimModuleSyntax/skipLibCheck:false/React/ReactDOM. |
| New raw exports esbuild source | Exit0, `raw-source-bundle.log`, exactly the two exported factory names. No mounting/activation. |
| Clean actual application build | Exit0, `clean-application.log`; provenance sourceHead020cf725, sourceDirty:false, gatewayIncluded:false. Prior own dirty build retained separately. |
| Clean combined site/gateway/Vault packaging | Exit0, `clean-combined.log`;139 assets, exact three existing wildcard route families, sourceSnapshotUnchanged:true, productionDeploymentChanged:false. Fresh own output `combined-package-020cf725`. |
| Scope/provenance | `scope-source-receipt.json`: exactly16 owned paths, protected paths unchanged, exact alias method, clean application provenance and Root blobs. `input-role-provenance.json`: five originals exact and appendices A/B/C equal, all8 roles exact. `git diff --check` passes. |

New transport controls also accept an actual complete V3 DTO above1400000 bytes through both provider and cookie mapping with all50 paused products, full document,1000 legacy use facts,50 choice-provenance entries and byte-bounded reported products. No paused state or body is dropped. Wrong selected version rejects. A structurally valid private history page at exactly400000 bytes succeeds for edit, view-only403 remains independent, and400001 rejects. Client history positively excludes conversation/private_note/legacy_review_note and raw private manifest extras. Separate provider2000001 and domain1800001/400001 negative frames reject; no cap increase.

Additional exact command forms, from this Root with explicit Node22 PATH as above:

```sh
node --experimental-strip-types --import ./tests/portal-review-no-network.mjs --test --test-reporter=spec apps/portal/tests/rebuild-review-guidance-request.test.mjs apps/portal/tests/rebuild-review-request.test.mjs
node --loader ./tests/portal-review-gateway-loader.mjs --import ./tests/portal-review-no-network.mjs --test --test-reporter=spec apps/portal/tests/rebuild-review-guidance-request-rpc.test.mjs
node --loader ./tests/portal-review-gateway-loader.mjs --import ./tests/portal-review-no-network.mjs --test --test-reporter=spec apps/portal/session-integration/runtime/tests/review-guidance-channel.test.ts apps/portal/session-integration/runtime/tests/plan-channel.test.ts apps/portal/session-integration/runtime/tests/care-channel.test.ts apps/portal/session-integration/runtime/tests/manual-methods-policy.test.ts apps/portal/session-integration/runtime/tests/navigation-return.test.ts apps/portal/session-integration/runtime/tests/session-vault.test.ts
node apps/portal/node_modules/typescript/bin/tsc -p .local-artifacts/w0-review-guidance/tsconfig.runtime-tests.json
node apps/portal/node_modules/typescript/bin/tsc --ignoreConfig --noEmit --strict --noUncheckedIndexedAccess --verbatimModuleSyntax --skipLibCheck false --allowImportingTsExtensions --target es2022 --module esnext --moduleResolution bundler --lib ES2022,DOM,DOM.Iterable --jsx react-jsx --types react,react-dom --typeRoots apps/portal/node_modules/@types src/contracts/PortalReview.ts src/contracts/PortalReviewValues.ts src/contracts/PortalReviewValidation.ts src/contracts/PortalReviewMapping.ts
```

All actual invocations prepend `env PATH=/Users/kanuj/.nvm/versions/node/v22.23.0/bin:$PATH /Users/kanuj/.nvm/versions/node/v22.23.0/bin/` to the displayed executable. Full command lines and exact emitted artifacts remain in this turn/tool history and ignored logs. Root80 uses the ten exact files in the independent R3 source command, plus the no-network preload. Source packaging calls the existing `buildPortal` with the fresh own output directory; esbuild bundles only the new raw entry with the unchanged frontend tsconfig.

Preserved setup/verification faults are not product failures or passing checks: initial standalone strict test command lacked Node types; a DOM-wide test command improperly mixed Worker and Edge environments and surfaced existing platform/unchecked-index diagnostics plus four new test typing diagnostics. The latter were corrected explicitly (retained-JS annotation, typed header list and actual store-read narrowing). The actual handler/RPC composition test now lives in its own new mjs file rather than forcing its Edge DOM globals into the Cloudflare test graph. The final runtime check extends original strict settings; no tracked compiler flags were weakened. An initial client mutation control mistakenly supplied advisor capabilities, and the initial exact-page builder shaved too few bytes; both new setup inputs were corrected, with failed logs retained. Packaging retains the existing missing Root `expo/tsconfig.base` warnings because Root dependencies are absent; build still exits0. No Root install or config repair was attempted.

The final changed paths are seven server files (policy/client-policy/gateway/upstream/client-upstream plus new review-policy/guidance-policy), three retained site auth files, CookieChannel's type-only addition, one new raw advisor request file, three new test files and this report. No Root/contracts/SQL/package/lock/config/CI/old fixture or assertion, Application/session/bootstrap/routes/shell/feature, CSS, native attestor or pinned policy hash changed. `SessionVault`, protocol/types and the actual DO worker are byte-preserved. No shared contract or lifecycle writer was added.

## Readiness and remaining independent gates

This allocation's source implementation and bounded checks are delivered for coordinator review. **No independent acceptance verdict is self-issued.** A fresh independent NEW review must assess the complete owned diff and these qualifications. Later Root App/feature composition must deliberately select these raw ports and canonical positive adapters; the raw exports are not mounted. Complete private source evidence must still be loaded and reviewed under current SQL rights; a hash/receipt is not a grant or a human acknowledgement of unloaded evidence.

The coordinator's latest explicit update separately reports Root1256 +80 source/types/Expo passing, fresh R8 canonical61 reset PASS and coordinator-only pgTAP in progress. Those are attributed coordinator results, not executions here; no R8/DB/env/migration/grant call was made. This worktree has no Root node_modules, so own full Root npm test/application/test tsconfigs/Expo were not run. Full portal/session scripts are intentionally unrun because they launch Chrome/resources. Genuine R8/new native harness, canonical pgTAP completion, integrated feature App/renderer/auth flows, exact-head CI, hosted/release and complete D01-D48/V01-V17 remain separate gates. Existing reviewed backend35d/integration3ed and historical genuine care retain their precise evidence levels.

## Resource and provenance boundaries

No Chrome/DOM/preview, Docker/PG, genuine Auth/provider/credential/sharedfixture/resource acquisition or polling occurred. No Miniflare/listener was launched. Root R7's user-reported guarded stop16:53:19.789UTC, backup4275800/SHAabcfd9bf9d202c59a9bb281010c5db01d77f192a816e4bbb0a5070063ada79b4 and retained221 files/10 cases/fivehelpers/volume remain attributed coordinator state; they were never opened or probed. R6/R4/R5/child PG are likewise untouched. Old care/genuine attestors and policy hashes are unchanged; Root's new R8/canonical61/native harness stays separate.

Official primary references consulted read-only: [Workers best practices](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/), [DO stub](https://developers.cloudflare.com/durable-objects/api/stub/), [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys). Changelog markdown fetch returned unsupported content type; no platform upgrade or service action followed. Existing pinned signatures/source and strict compiler checks establish this change; no new platform API or dependency is introduced.

No push/PR/merge/deploy, real client/source/permission/communication/funds/retailer action. Status/TASKS/CONTEXT_SYNC, Root/contracts/SQL, auth/runtime lifecycle and later feature composition remain coordinator-owned. Resolve containing commits with `git log --format=%H -- docs/portal-rebuild/research/W0_REVIEW_GUIDANCE_TRANSPORT.md`; final head is returned separately to avoid a self-referential report hash.
