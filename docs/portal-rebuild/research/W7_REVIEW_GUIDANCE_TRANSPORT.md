# W7 independent Review/Guidance transport review, R1

Owner: Kanuj. 31 October 2026. Independent source-only specification/correctness review of W0's frozen three-commit transport candidate. No production/test fixes, nested agents or connected resources. The only reviewer-authored tracked change is this report.

## Separate verdicts

- **Specification: scoped PASS.** The three fixed routes, canonical action/audience sets, capability mapping, finite errors/bounds, captured raw advisor factories and retained client behavior satisfy the inspected transport brief. No reproducible material in-scope finding was established.
- **Correctness / quality: scoped PASS.** Fresh retained tests, 28 independent memory/mock-HTTP cases, two actual retained-factory lease-race cases, strict checks and source packaging pass. Input-only sensitivity controls fail their intended assertions when the relevant fence is removed. These checks do not establish real SQL rights, persistence, provider Auth or genuine application acceptance.
- **Genuine R8, canonical61/M62, App/default activation, Root/native closure, hosted/release and full D01-D48/V01-V17: NOT ESTABLISHED here.** Parent received this evidence without promoting it to genuine acceptance. Parent's separately reported M62 numeric-source correction `6e4d38e2` is outside this frozen source and was not imported or reviewed.

## Exact task, runtime and provenance

| Field | Verified value |
| --- | --- |
| Workspace / branch | `/Users/kanuj/.t3/worktrees/shelv/t3-cf6b17d1` / `t3/review-guidance-transport` |
| Clean starting parent | `3edb0700eeb423082a99a4e7e617b348364bc3dd` |
| Frozen author head | `79d757e56e1111c437ffd21bf1c43fc465082e67`; production/test source last changed at `020cf72510aa6db480233d5f23325d28a71a22ff` |
| Exact reviewed source head | `08c1017cb2cf6e4ef94638f23c7d14a5c6816c8f`; clean throughout compilation/packaging |
| Actual parent / project | `d632030a-18f7-4dec-a2c9-f5c0418c3fd5` / `ac0af19d-d404-4f53-a870-02bfd76c2a80`, live thread readback |
| Actual taskId | `node:delegated-task:command%3Amcp%3A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%3Adelegate-task%3Aportal-rebuild-w7-review-guidance-transport-20261031-r1`, supplied by the parent as its authoritative current task handle |
| Live configuration, first and final | `codex / gpt-6.1-sol / reasoningEffort=xhigh / serviceTier=default`, full-access/default |
| Descriptor support | Reasoning low/medium/high/xhigh/max/ultra, catalog default low; service default/priority, default default. Effective xhigh/default is explicit and supported |
| Pins | Project model/default-subagent and all eight actual w0-w7 TOMLs pin Sol/xhigh; parsed and hashed |
| Node | Actual `v22.23.0`; every Node/npm/compiler invocation selects `/Users/kanuj/.nvm/versions/node/v22.23.0/bin` explicitly in PATH and uses its executable |
| Freshness limit | Local `origin/main=d39a7d4943209080df7c4cf97d85784f462758bf`; no remote-freshness/CI claim or broad branch adoption |

Actual backing thread:
`thread:delegated-task:command%3Amcp%3A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%3Adelegate-task%3Aportal-rebuild-w7-review-guidance-transport-20261031-r1`.

Actual ordinal1 run, started `2026-10-31T17:33:00.996Z`:
`run:thread:thread%3Adelegated-task%3Acommand%253Amcp%253A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%253Adelegate-task%253Aportal-rebuild-w7-review-guidance-transport-20261031-r1:ordinal:1`.

Both live `orchestrator_capabilities` and `t3_thread_configuration` were called before substantive review and again at finalization. Capabilities' parentThreadId repeats the child in this harness; actual parent/workspace/run are from `t3_thread_read`. No task-status handle was guessed. Raw receipts are retained in `E/runtime.json` and `E/runtime-final.json`, where **E = this checkout's ignored `.local-artifacts/w7-review-guidance/`**.

Only the requested source commits were imported, in order, without conflict or semantic resolution:

| Author input | Local import |
| --- | --- |
| `885aa414d2a37ea70927ba4cc6deb69c34bacf3d` | `da1806fb` |
| `020cf72510aa6db480233d5f23325d28a71a22ff` | `5c9d5bfe` |
| `79d757e56e1111c437ffd21bf1c43fc465082e67` | `08c1017cb2cf6e4ef94638f23c7d14a5c6816c8f` |

All **16** candidate-owned paths match author79d exactly by Git blob and SHA256, not just patch similarity. `E/provenance.json` records each. `E/review-source-inventory.json` preserves **180** source/config/contract/function/migration Git blobs and SHA256 values across the transitive review boundary. Author workspace `t3-de43a1b0` was not written or used to run anything; all execution was in this new worktree. Parent's uncommitted work was not copied.

Read root/portal AGENTS and the complete [W0 report](W0_REVIEW_GUIDANCE_TRANSPORT.md), including its initial failed/setup runs and final qualifications. The full 95,388-byte [approved input](../source/APPROVED_INPUT.txt) was read in three bounded ranges including appendices A/B/C. Standalone decisions/desktop text and full JSON manifest match their appendices. README, implementation contracts, CARE/PLAN/ADVISOR_READ, acceptance, ownership/workstreams/current status and D39 addendum remain authority. Inspected W1 contract/implementation and W7 backend R1/R2/R3 dispositions, integrated-care, status-recovery and CA1 qualifications against the current relevant source. Historical prose does not grant resources or replace current Git.

| Preserved original | Bytes | SHA256 |
| --- | --- | --- |
| `source/APPROVED_INPUT.txt` | 95388 | `c45701f9f54fd2b1dbb09bbd7aa2b9b437e9059aa6032b6f39411fe2e7f6efbd` |
| `APPROVED_DESKTOP_SPEC.md` | 36823 | `4ceafbaca13ab9324ea35e5e3cb94d09ba76178c9c5127a93da87c5b9c7e59a0` |
| `shelv_desktop_design_manifest.json` | 12642 | `64e9c782657dc6d927ddf255bc983e863c89974c13418287fa980e9f5ed35307` |
| `APPROVED_DECISIONS.md` | 24755 | `eefc74fcc1498cdbbe5ac21d4215cfb9c8936545a6dcc6437bf9e0dd98c21e60` |
| `SCREEN_MANIFEST.json` | 4300 | `55a375ede66a3c9c13139d90246fbc096b6bd1a11cb8c2ce49d30ee8bb44519b` |

Applied audit-context and verification workflows plus Cloudflare Workers/DO and Supabase source guidance. Explicit no-nesting overrides the audit skill's dispatch step. Current public primary [Workers guidance](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/), [DO stub reference](https://developers.cloudflare.com/durable-objects/api/stub/) and [Supabase key documentation](https://supabase.com/docs/guides/getting-started/api-keys) were read. No new platform API, dependency, configuration or provider-key migration is proposed. Existing locked types and actual compilers are the checked source signatures.

## Source and boundary findings

The exact admitted routes are `/api/client/reviews` with client8, `/api/advisor/reviews` with human8, and `/api/advisor/guidance` with human9. Client guidance remains404. Unknown schema/keys/family/audience and caller role/owner/RPC/endpoint selectors reject. Root metadata remains Review15/Guidance9/Care13/Plan26/Task14; all new task agents deny. Browser metadata parity and canonical parsing are exercised, including status as READ rather than action-prefix classification.

The retained gateway uses its existing origin/method/JSON/CSRF/cookie parser and audience namespace, then `session.execute`. The unchanged DO's audience selection invokes the existing provider. No parallel gateway, auth parser, credentials store or JWT shortcut is introduced. Providers positively reparse new-family operations before await and retain that canonical command for response binding. Both provider and cookie response boundaries invoke Root positive mappers; wrong client/version/family/private variants fail closed.

| Gateway capability | Actions / actual SQL authority inspected |
| --- | --- |
| view | Safe advisor V3/public instruction/reported-product reads and Review status. M58 `review_guard` calls retained `care_guard`; status authorizes the actual original receipt independently |
| edit | Conversation, private preparation note, advisor-private history. `review_guard` adds `plan_guard` for writes/private reads; referenced source authority is separately checked |
| edit | Guidance create/read/save/rebase/review/approve/revoke/status starts at `plan_guard`, rejects agents, and checks private client/source scope |
| edit + publish | Deliberate guidance publication; `review_output_authority` requires actual caller publish plus exact live approval/publisher/source/coverage and deferred linkage |

The mapping agrees with inspected M58 `review_guard`, Review/Guidance request/status dispatch, `review_request_authorize`, `review_guidance_publish` and output authority. Gateway view is not private receipt authority. Source waits, current role/session/policy/source/coverage and exact approval remain SQL-owned checks, not frozen snapshot permissions. No SQL execution here recertifies them.

Both fixed chains are actual source: cookie operation -> audience provider -> only `concierge-reviews` or `concierge-guidance` -> actual retained handler/runtime -> only `concierge_review_command_v1({p_command})` or `concierge_guidance_command_v1({p_command})`, using public apikey and original caller bearer. Own mock-HTTP traces reject every other endpoint; there is no service key, arbitrary RPC or added right.

`createAdvisorReviewRequest(runtime)` and `createAdvisorGuidanceRequest(runtime)` expose raw `OperationPort<unknown,unknown>` values. Domain decoding remains the caller's responsibility, matching the retained client seam. Each captures the actual application boundary and detaches input synchronously before awaited acquisitions; current owner/audience/generation/epoch/CSRF and abort/result/error fences remain active. There is no URL/fetch/header/owner/credential argument. No App port, renderer, default or activation change was found.

The subtle double-acquisition case is covered independently: an injected clock expires the retained cookie during the second acquire, which performs a real retained restore to a different owner/CSRF. Both new ports reject401 with **zero operation egress**. Application invalidation aborts the transport; the new-family pre-egress abort check prevents use of the replacement lease. Removing only that check in the ignored loader causes both zero-egress assertions to fail. The unchanged client raw source and its original12 cases pass; no client refactor was accepted.

Requests remain500000 actual UTF8 bytes only for the new families and retained Plan/Care; legacy operations/payments/checkins100000 and file/multipart bounds are unchanged. New-family FormData rejects. Provider2000000, domain1800000 and page400000 remain finite. Retained positive tests carry a full V3 above1400000, all50 paused products and exact400000 private page without trimming;400001/domain/provider overflow controls reject. Root80 retains its maximum1555338 V3/2550-scope/26-page/120000-detail synthetic vectors.

Every current finite error uses the retained safe namespace; unknown prefixed/private errors are discarded. Existing `SupabaseProvider.json` error normalization remains exactly the base method, including only `concierge_content_version_required -> content_version_required`. No generic upstream prefix allowance was added. Known session-ended401 and version409 behavior is retained. Malformed write success or503 transport loss stays uncertain; READ/status remains unavailable/rejected. No status failure becomes a failed original write, fresh acknowledgement, automatic retry or new UUID.

## Fresh executed evidence

Counts overlap and are not summed into acceptance totals. All normal passing test commands have zero failures/skips/cancellations.

| Check | Actual result / raw artifact in E |
| --- | --- |
| New raw requests + unchanged client requests | **45/45**, `requests.log` |
| New runtime + retained Plan/Care/manual/navigation/Vault | **59/59**, `runtime.log` |
| Actual provider/handler/runtime/fixed RPC, both families | **1 grouped test / both chains PASS**, `rpc.log` |
| Retained exact alias/legacy401 | **9 vectors PASS**, `errors.log` |
| Root pure contracts/domain/actual handlers | **80/80**, `root80.log` |
| Independent entire memory/mock-HTTP chain and cookie boundary | **28/28**, `independent-final.log` |
| Independent second-acquire expiry/owner replacement | **2/2**, `acquire-restored.log`; both zero egress and401 |
| Input-only pre-egress-abort removal | **2 intended assertion failures / exit1**, `acquire-mutant.log`; each observed replacement-CSRF egress instead of zero |
| Input-only cookie response-map removal | **3 intended assertion failures / exit1**, `cookie-map-mutant.log`; each returned200 instead of503 |
| Tracked frontend/session strict configurations | Both exit0/zero diagnostics, `frontend-strict.log`, `session-strict.log` |
| New runtime test + actual server/worker graph | Exit0/zero diagnostics, `runtime-test-strict.log`; ignored config extends tracked settings, retains both original include globs and adds new test/Node types |
| Exact Root consumer strict flags | Exit0/zero diagnostics, `consumer-strict.log`; strict/noUncheckedIndexedAccess/verbatimModuleSyntax/skipLibCheck:false, actual four modules/transitive imports |
| Raw factory esbuild | Exit0; exactly two named exports, `build.log` |
| Combined site/gateway/Vault package | Exit0; **139 assets**, exact retained three wildcard families, sourceSnapshotUnchanged:true, productionDeploymentChanged:false, `combined/BUILD-MANIFEST.json` |
| Clean actual application build | Exit0; sourceHead08c1017c/sourceDirty:false/gatewayIncluded:false, `application-build.log`, `build-receipt.json` |

Own28 uses actual in-memory `SessionVault` and `CredentialEnvelope` with injected synthetic context and finite HTTP, actual providers/handlers/runtime, and mock RPC responses. It covers all three complete source chains, real Vault CSRF refusal, post-await revocation/absolute-expiry/logout, private malformed READ output, unknown SQL namespace, exact client no-op, malformed WRITE uncertainty, exact route rejection and independent cookie projection. It proves source/API behavior, not the DO runtime or SQL persistence. Sensitive-looking canaries and access/refresh strings are synthetic.

Own locked portal-only install: `npm ci --offline --ignore-scripts --no-audit --no-fund`,130 packages. No Root dependency install or package/lock/config edit. The own loader uses this worktree's installed TypeScript/Auth-JS; the supplemental strict test's Node types are an explicitly read-only parent package input, not a parent fixture. Global external fetch is denied by the retained preload; all allowed business HTTP is injected finite mock functions. No listener or Miniflare is started.

`E/run-checks.py` and `E/checks.json` persist exact executable/arguments/PATH/exits/timings for the retained checks; `E/final-probes.py` and `E/final-probe-outcomes.json` do so for final independent/sensitivity/strict checks. Representative commands from this Root are:

```sh
env PATH=/Users/kanuj/.nvm/versions/node/v22.23.0/bin:$PATH /Users/kanuj/.nvm/versions/node/v22.23.0/bin/node --loader ./.local-artifacts/w7-review-guidance/loader.mjs --import ./tests/portal-review-no-network.mjs --test --test-reporter=spec .local-artifacts/w7-review-guidance/independent.mjs
env PATH=/Users/kanuj/.nvm/versions/node/v22.23.0/bin:$PATH /Users/kanuj/.nvm/versions/node/v22.23.0/bin/node apps/portal/node_modules/typescript/bin/tsc -p apps/portal/tsconfig.frontend.json
env PATH=/Users/kanuj/.nvm/versions/node/v22.23.0/bin:$PATH /Users/kanuj/.nvm/versions/node/v22.23.0/bin/node --import ./tests/portal-review-no-network.mjs .local-artifacts/w7-review-guidance/build.mjs
```

Setup faults are preserved and are **not product findings or intended assertion REDs**: initial skill path was stale and corrected before applying it; a guessed client-request filename was corrected to actual `review-request.ts`; own initial route-negative assertion expected400/404 although retained CSRF validation lawfully returned403 first, so only that probe's expected denial set was corrected; initial supplemental test config lacked Node types, then omitted original binding declaration include globs. Both compiler setup logs remain. Final config includes the unchanged original graph/flags and resolves Node types read-only. Existing experimental-loader warnings and packaging's absent Root `expo/tsconfig.base` warnings remain; builds exit0. No production assertion/compiler flag was weakened.

## Prior qualifications and remaining gates

Backend RG1-RG4 and M59 scoped closures, followed by RG5/M61 R3 scoped PASS, retain their documented limits. Existing invalid immutable public output is not silently repaired by M61. M59's JSONB parse/detoast/first materialization precedes its guard; source transport tests do not establish pre-parse protection. Full100000 private-manifest and actual2550 SQL stress remain their prior separately attributed evidence; only the pure Root maximum vectors were rerun here.

Status AR1/C1 retains immutable pending UUID/payload on lookup failure and does not promote a receipt over newer restrictive authority. CA1 retains route recovery before data and forms only after confirmed version. Integrated genuine care remains its precise historical57/native76 evidence. No old care/genuine attestor, pinned policy hash or native-source closure was changed to accommodate new code. This review does not recertify those complete earlier matrices.

Unrun under this explicit source-only allocation: full Root npm test/application/test tsconfigs/Expo web/native export because Root dependencies are absent; full portal/session scripts because they can launch Chrome/resources; canonical reset/pgTAP and SQL/native fixtures; genuine Auth/JWT/PKCE/PostgREST/Edge/Storage; App/feature/renderer composition and activation; provider delivery/webhooks; browser/DOM/visual/accessibility/human checks; complete cancellation/export/source retention; exact-head CI and release. No skipped check is counted as a pass.

No Chrome/DOM/preview/process inventory, Docker/PG, provider/Auth/credential/shared-fixture acquisition or polling occurred. No R7/R8/R6/R4/R5/author/previous-review fixture was opened, adopted or stopped. R7 stop/backup and R8 frozen61 custody remain parent-attributed state. No resource was acquired, so there is no resource to return. Public documentation retrieval and internal parent progress messages were the only external read/communication operations. No push/PR/merge/deploy, real client/source/permission/message/funds/retailer action.

## Preserved evidence and return

`E/artifact-hashes.json` inventories exact bytes/SHA256 for all small own probes, loaders, configs, runtime receipts and raw logs. The combined manifest and clean application provenance have separate hashes in `build-receipt.json`. Important anchors:

| Evidence | SHA256 |
| --- | --- |
| `provenance.json` | `45bac12ebaa77270a7d2941936112808a414df37aaa04399f442fb0c9d1d23ad` |
| `review-source-inventory.json` | `4ff28106d20f1346bfa3994788e9ea4f9ffdc7ff55903dfdf4750b7f089d6247` |
| `runtime-final.json` | `41413ca41334b49f58fdffd45facd2fcda19b172939819db2624a04b109cff41` |
| `independent.mjs` | `e2b710ecea63a6908db7313be056d90cb1dc4c4d25e840550da676cbd8122760` |
| `independent-final.log` | `a57a59294344aa5bb850ef66b97f4304448ed895a81741d12ac44794718faa6e` |
| `acquire-race.mjs` | `a13073be296739a9895daf8ba219fa206fdeff799953c01d289fc10c4b6a924e` |
| `acquire-restored.log` | `448cd316de90136109b547ec1a4515e6adf20a863e1b494fe91065946e4a6337` |
| `acquire-mutant.log` | `cff9dfe5fd69c3fc039cd1af4a1ccacd9612267ea0bee15a4ee16d39aac22401` |
| `cookie-map-mutant.log` | `64144c4a0a655eb24267712a924c0f4c3394cd71f1c60aad7b4b7fef639d1762` |
| `final-probe-outcomes.json` | `8507495820f9bb02a2346f819414482337d9ba342f26c158c99a385caf08625a` |

The sole report commit is returned after final source equality, local-link, hash and `git diff --check` validation. It is a child of08c1017c; its hash is not embedded self-referentially. Integrate **only that report commit**, not the three already-attributed source imports. Parent owns canonical status/TASKS/CONTEXT_SYNC, further composition, native/genuine allocation, M62 and release decisions. No reviewer production fix is required by the evidence established in this round.
