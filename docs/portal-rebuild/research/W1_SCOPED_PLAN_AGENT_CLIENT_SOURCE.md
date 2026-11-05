# W1 scoped external Plan agent client

Owner: Kanuj. Date: 2 November 2026. Status: authored source candidate with focused pure/finite synthetic HTTP evidence. **Independent review and genuine integration are pending.** This is neither full scoped-agent enrollment/source-workflow acceptance nor release approval.

## Verdicts and delivery

- **Specification: scoped author checks PASS** for the allocated SDK and its approved private transport bound. The pinned factory uses the actual Plan API v1 command parser, response mapper, DTOs and fixed Edge route. Full D19/D40 agent/source workflow remains incomplete.
- **Correctness/quality: scoped author checks PASS**, 29 new tests plus 19 unchanged Plan/advisor tests, zero failures/skips. Three self-review findings below are corrected with failing regression evidence. Strict TypeScript compilation is **UNRUN**. These are author conclusions, not independent acceptance.

Implementation commit: **`a6b2ca06b2a0cd533e1799d9744b7bde7278e7ad`**, based on exact clean **`8af746d197b976972d4b16924155afa8c3b32d44`**. Only [PortalPlanAgent.ts](../../../src/clients/PortalPlanAgent.ts) and [its tests](../../../tests/portal-plan-agent-client.test.ts) are in that commit. This subsequent report-only commit is returned separately by its actual containing hash. No input-only commit was needed; no foreign production branch was imported.

Workspace: `/Users/kanuj/.t3/worktrees/shelv/t3-4a88cbcb`, branch `t3/portal-plan-agent-client`. Sole tracked allocation is those two NEW paths and this NEW report. All 2,128 pre-existing base paths, including all shared contracts, SQL, auth/runtime/route/UI/package/configuration files, remain unchanged. Parent integration/Maya work was not touched. No nested agents, push, PR, comments, watches, merge or remote write occurred.

Literal allocation taskId:

`node:delegated-task:command%3Amcp%3Aafb222dc-28b4-420b-9474-b05bc6eeba89%3Adelegate-task%3Acontinuation-20261102-scoped-plan-agent-client`

Initial and terminal `t3_thread_configure` calls, with `modelSelection` omitted, independently read self and Parent as **codex / gpt-6.1-sol / reasoningEffort=xhigh / serviceTier=default**, full-access/default. No selection changed. Every Node execution uses **`/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node`**, verified `v22.23.0`. The terminal tool receipt is preserved locally.

## Exact source and dependency manifest

Local evidence home: `.local-artifacts/portal-plan-agent-client/`. Its **`candidate-manifest.json` SHA-256 `151672a3a133dc156abc1cf77b83ddc28ddfaf969d124fd328d591620da2ddfe`** records exact source blobs, bytes/modes/hashes, full argv/cwd/exits/log hashes, original provenance, packages/locks, Node binary, runtime selection, negative fixtures and limitations.

| Owned postimage | Git blob | SHA-256 |
| --- | --- | --- |
| `src/clients/PortalPlanAgent.ts`, 12,664 bytes, 100644 | `a40e12c40df8f73e083c7b036ee469b13aa30043` | `04c875008c88ca8a2dda954ef283ac3d34baf8f44a12099b9bf388cdf83f2b61` |
| `tests/portal-plan-agent-client.test.ts`, 23,695 bytes, 100644 | `998a1bf90cf51cb0194bb4db71eab015306982a1` | `b9501d60f90a493c4ff49e29cb05a201f59fc1a812e4499b7f0745e33a3f86ab` |

`dependency-closure-current.json` is an actual Node builtin load-hook trace of the 12 executed own-checkout source inputs, including the SDK/test and unchanged Root parser/mapper/values, presentation/portal validation, Plan handler/runtime and shared HTTP body/Auth-RPC runtime. Its complete ordered input fingerprint is **`f73a3b90dc7959bc85fb2b2a8eb7859db0f976792980e5bcb72d64894f2a67c0`**; file SHA-256 is **`c2a39b908fcf4a7c1c08251d318c0f17474995898077f36b2cefc0086baa3892`**. Type-only imports are erased; this is an execution closure, not a compiler closure. The separate unchanged tracked91 session-runtime fingerprint is **`544d7d8b97cd0feec91e5eb659c5919313258fad910d10566df8241fc132a5cd`**.

Root, portal and session `node_modules` are absent. Node's builtin strip-types and Web APIs run the finite suite without third-party libraries. **No install, clone, shim, compiler/config/flag relaxation or dependency change occurred.** An APFS dependency clone was unnecessary and was not attempted; its conditional custody grant was not exercised. There is no approved compiler custody, so strict root/test typechecking remains unrun. Package files and the three tracked lockfiles are fingerprinted, not represented as installed dependency proof.

Read the applicable instructions, rebuild README/GOAL/D01-D48/full desktop specification/contracts/addenda/ownership/current-status context, [Plan API v1](../PLAN_API_V1.md), original W1 reconnaissance/implementation and original backend findings F1-F5/Q1-Q2, R2-1/R2-2, responses and R3 dispositions. Reviewed the complete actual Plan type/validation/mapping/value files and handler/runtime, plus relevant principal/session/grant/scope/replay/assignment/publication SQL call chains. Historical backend passes retain their historical scope; no old SQL/native outcome was rerun or promoted here. The refused Guidance/M65 reviews were not re-reviewed, renamed or rerouted.

The original approved input remains **95,388 bytes**, SHA-256 **`c45701f9f54fd2b1dbb09bbd7aa2b9b437e9059aa6032b6f39411fe2e7f6efbd`**. The separately supplied Parent continuation was hashed in place: **100,187 bytes**, SHA-256 **`b428b318598df52f12ce3e6ea4ebd350ff9333ee05d9fd8f04a8e845d0c722bc`**. These are different documents. No foreign artifact was executed or archive recursively copied; only the 12 needed own source inputs were materialized into ignored negative fixtures.

## API and behavior

```ts
createPortalPlanAgentClient(config: {
  supabaseUrl: string;
  anonKey: string;
  getAccessToken: (signal?: AbortSignal) => Promise<string | null>;
  fetch?: typeof fetch;
  timeoutMs?: number;
}): {
  execute(command: PlanCommand, options?: {signal?: AbortSignal}): Promise<PlanResult>;
}
```

The factory is the only module export. Construction performs zero token/network I/O. It captures validated HTTPS root origin, public publishable/legacy anon key, token callback, fetch and deadline once. Paths/query/credentials in the base URL, privileged keys and invalid deadlines reject. The route is always **`/functions/v1/concierge-plans`**, with fixed POST, bearer/apikey/JSON headers, omitted ambient credentials, no-store and redirect error. Commands cannot select a URL, RPC, role, actor, headers or source authority.

`execute` snapshots plain data without invoking getters/toJSON, validates through actual `readPlanCommand`, and serializes the detached command before awaiting credentials. Both nested content and request/revision identities are detached. Actual `planCommandMaxBytes=500000` bounds UTF8 request bytes inclusively. The SDK accepts incomplete valid drafts and exposes all permitted list/read/create/save/checkpoint/assign/import-diff/apply/validate/preview operations through this same execute path. It adds no success flag, approval or new command. Actual `mapPlanResult` strictly validates a complete response; private/unsupported fields or malformed successes never become saved results.

One absolute deadline, default 12,000ms, begins before input processing and covers token acquisition, pre-egress credential comparison, fetch, streamed body and final credential comparison. Native Response brand checks and byte-counted streaming enforce the bound even with a false Content-Length. Cancellation races every asynchronous wait; late responses are cancelled. Reader cancellation is observed without awaiting an uncooperative cancellation promise. All potentially reentrant successful reader cleanup precedes the final credential fence.

The callback must provide the real currently configured credential at resolution. The SDK checks JWT syntax/expiry only as a local denial condition; it does not verify signatures or derive authorization from role/client/grant claims. Missing/expired/changed credentials deny. A shared observed credential revision retires older concurrent operations, including observed ABA, without supplying cached credentials or granting authority. A final callback/revision/expiry check follows private decoding. The fixed API provides no synchronous external session observer: changes never exposed by the callback or another execution cannot be independently detected between callback resolution and return. Genuine server reauthorization remains mandatory.

Errors are safe `Error` instances named `PortalPlanAgentError`, with constant `message=code` and enumerable `status`, `code`, `outcome`. There is no raw remote message/cause/body/SQL/token. `outcome` is `not_dispatched`, `rejected` or `uncertain`. Matching Root safe error codes survive; received 401/403 remain denials even if body reading, decoding, cancellation or deadline fails. Unknown/mismatched codes fail closed. A dispatched write whose result cannot be trusted remains uncertain. The SDK never retries, generates a request UUID, checks status automatically or claims an interrupted write failed to commit. Callers retain the exact original command for an explicit `request_status_v1` or exact retry.

**Approved availability limit:** Parent explicitly approved a private **2,000,000-byte** response cap matching the retained gateway after source inspection found no Plan response-cap export in Root values. This is not an invented Root constant or domain maximum. Oversized responses reject with safe `too_large`/413 and uncertain dispatched-write outcome; nothing is truncated or partially mapped. Legitimate larger complete histories require owner-provided pagination/whole-history handling and remain a separate availability/integration gate. Root runtime `MAX_SAFE_INTEGER` is not adopted as a practical buffering limit.

## Existing server authority and missing producers

The SDK uses the same handler as manual operations. Actual SQL in `20261030223603_portal_rebuild_plan_v1.sql` already supports client-scoped explicit creation: exactly one live create-capable client grant for the actual actor/session is required; its intended client/origin grant are recorded privately on the unassigned draft. Subsequent edits/assignment cannot escape that client. Draft-scoped grants operate on the existing exact draft and do not grant creation. Directory results are scoped. `grant_task_v1` is owner-issued with finite actions, exact client XOR draft, provider session and expiry. No SQL right was changed or inferred from a synthetic Auth response.

The source gate exists; **genuine provisioning is not supplied by this SDK**. Parent/Root plan-platform ownership still owes the deliberate activated policy, enrolled permanent agent principal, live configured credential/session, owner-issued exact finite task/source grant and end-to-end proof of those facts. No new hardware key, paid program, enrollment product, billing dependency or public authority flag was introduced.

Human section review/approval is denied to agents by SQL. Publication still requires exact real human approval/client/revision/publisher grant, readiness and applicable verified first service payment or later coverage. The SDK forwards the ordinary pinned command; model-authored approval fields reject locally and forged exact targets remain server-denied. No financial/provider-held check is claimed. Raw Source upload/read/consent/storage actions are outside Plan API and remain unexposed. Source task rights, authenticated raw-source producers and full D40 workflow require separate owned work.

## Consolidated self-review findings

| ID / severity | Original observation and correction | Current proof / status |
| --- | --- | --- |
| **AG1 / P2** | Initial SDK released the native reader in `finally`, after choosing a private success. A deliberately wrapped native release callback changed credentials too late to be checked. Successful reader cleanup now completes before final credential acquisition/comparison. | Original `cleanup-red.log`: 23/24, missing expected rejection; corrected 24/24. Current identical suite with only this fence removed: 28/29, targeted cleanup case fails. **Corrected, source-only; natural mounted reachability unproved.** |
| **AG2 / P2** | An older pending credential callback could return the old token after another execute observed replacement; a token returning to the earlier value could revive that operation. Observed credential revision and per-operation comparison now retire both paths. | Original `concurrent-credential-red.log`: 24/26, both cases fail; corrected 26/26. Current identical suite with revision fences removed: 27/29, those same two cases fail. **Corrected, finite callback/concurrency evidence; no genuine session claim.** |
| **AG3 / P3** | Early generic 401/403 handling discarded a valid matching safe Root code. Bounded denial decoding now preserves matching codes while retaining received status if the body fails/stalls. | Current identical suite with early generic denial restored: 28/29; denial-code test fails. Current candidate 29/29. **Corrected.** The first added fixture used upstream403, which the actual handler intentionally normalizes to forbidden; correcting only the synthetic P0001 transcript to400 reaches the real handler's candidate_inactive→403 mapping. That setup failure remains preserved. |

No additional unresolved authored-source defect was identified in the complete candidate review. Missing compiler, genuine authority/persistence, large-history availability and independent acceptance remain required gates, not waived findings. No dependent resource execution was attempted after or before these findings.

## Commands and actual results

Every command below uses the full explicit Node path above. Logs retain raw TAP, warnings and actual exit values in the manifest. There are no assertion filters, opt-in skips or waived expectations in this suite.

| Invocation / preserved log | Exit / result |
| --- | --- |
| `node --experimental-strip-types tests/portal-plan-agent-client.test.ts`, `initial-red.log` | **1**, 19 failures because the allocated module was absent, one broad constructor-rejection case passed vacuously. This is initial missing-feature evidence, not behavior acceptance; constructor assertions now check exact safe error fields. |
| Same, `first-implementation.log` | **1**, 18/20; two error-code mapping failures. |
| Same, `first-green.log` | **0**, 20/20 after separating safe code from uncertain outcome. |
| Same, `cleanup-red.log` / `cleanup-green.log` | **1**, 23/24 / **0**, 24/24. |
| Same, `concurrent-credential-red.log` / `concurrent-credential-green.log` | **1**, 24/26 / **0**, 26/26. |
| Same, `sdk-final.log` | **0**, earlier 28/28, separate from current29. |
| Same, `denial-code-red.log` / `denial-code-green.log` | **1**, 28/29 in each. The latter includes the separately explained synthetic upstream-status setup fault; neither is called green. |
| Same, `denial-code-corrected-green.log` | **0**, current **29/29**, zero skipped/cancelled. |
| `node --experimental-strip-types .local-artifacts/portal-plan-agent-client/capture-dependencies-current.mjs` | **0**, unchanged current **29/29** plus complete actual source-load fingerprint. Earlier `dependency-trace.log`/manifest preserve earlier28 separately. |
| `node --experimental-strip-types tests/portal-rebuild-domain.test.ts` | **0**, unchanged **8/8**. |
| Same for `portal-rebuild-handler.test.ts` | **0**, unchanged **3/3**. |
| Same for `portal-rebuild-advisor-reads.test.ts` | **0**, unchanged **5/5**. |
| Same for `portal-rebuild-advisor-handler.test.ts` | **0**, unchanged **3/3**. |
| `node --experimental-strip-types --check src/clients/PortalPlanAgent.ts` | **0**, native syntax check only, not TypeScript typechecking. |
| `node --experimental-strip-types .local-artifacts/portal-plan-agent-client/regression-fixtures/AG1-cleanup/tests/portal-plan-agent-client.test.ts` | **1**, 28/29, only targeted AG1 regression fails. |
| Same path under `AG2-credential` | **1**, 27/29, targeted two AG2 regressions fail. |
| Same path under `AG3-denial` | **1**, 28/29, targeted AG3 regression fails. |
| `git diff --check`, staged checks and bounded base/owned-path comparison | **0** before implementation commit. Terminal report/link/scope checks follow before report commit. |

The negative fixtures deliberately mutate only the named SDK fence; all current test assertions and unchanged Root input bytes remain exact. They are explicitly labelled **mutations of CURRENT**, not fabricated immutable OLD source or an approved successor. There was no pre-existing SDK at the pinned base. Original raw author failures, setup faults, intermediate green runs and current29 remain distinct.

The actual SDK → Plan handler → native Auth/RPC runtime → strict Root input/output mapping executes with **closed synthetic Auth and RPC transcripts**, using real Request/Response/ReadableStream objects. Wrong-client/scope, forged-publication and stale-revision tests exercise the real transport of synthetic SQL denial transcripts; they do **not** execute SQL or establish genuine grant enforcement. Explicit identical retry and status commands preserve actual body/UUID through that chain; SQL journal idempotency is not re-proven by repeated transcript responses. No successful authority/currentness/operation/Vault substitute is claimed as genuine proof.

## Remaining integration gates

1. **NEW independent Sol/xhigh review** of exact implementation commit, full three-path delivery, manifest, original requirements, all raw failures and AG1-AG3 reproductions. No self-admission to server/CLI/application.
2. Parent-scheduled strict app/test typechecking with verified exact dependencies/compiler custody. Native strip-types/syntax is not a typecheck. Full npm/Expo/CI checks were deliberately not run in this bounded child.
3. Separately authorized real isolated Auth/Edge/PostgREST/SQL execution with an enrolled finite task principal and actual configured token supplier: permitted create/edit/save/import/assign/preview, wrong client/scope/source, expiry/revocation during waits, precise approval/payment/publication, exact retry/status and unchanged effects on denial. Historical backend reports do not accept this new client composition.
4. Actual external-agent/CLI/application enrollment and credential lifecycle composition, including logout/replacement and callback semantics, source-consent/byte producers and the approved large-history availability gate. These require their owners; this SDK provides no enrollment/source channel.
5. Later actual mounted browser, ordinary user flow, genuine integrated current-head CI and release acceptance where applicable. No native resources, DB/Auth/Storage/socket/listener/server/browser/provider/reset/process adoption, real account/session/network call, deployment or live business action occurred here.

Parent owns integration records and shared `CONTEXT_SYNC.md`; this task intentionally writes neither. Guidance/M65 remain held with no accepted verdict. The returned source candidate advances the real authenticated operation client, while leaving these explicit requirements open.
