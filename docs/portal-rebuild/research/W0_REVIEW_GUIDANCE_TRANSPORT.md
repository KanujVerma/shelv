# W0 reviewed Review/Guidance transport integration

Owner: Kanuj. 31 October 2026. Source-only implementation in the retained cookie/Vault gateway. No application/default activation, canonical SQL, genuine Auth, browser or release acceptance is claimed.

## Runtime, source and ownership

- T3 workspace `/Users/kanuj/.t3/worktrees/shelv/t3-de43a1b0`, branch `t3/wire-review-guidance-transport`, clean starting base `3edb0700` (resolve its full SHA with `git rev-parse 3edb0700`). The ten reviewed backend imports through M61 are actual parent source. No source from another implementation branch was copied.
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

## Remaining work in this allocation

Creation-bound raw advisor Review/Guidance exports, their captured wire/error/lease regressions, final scoped strict/package verification and final owned clean commits follow this early coherent seam. This checkpoint is not the final handoff.

## Resource and provenance boundaries

No Chrome/DOM/preview, Docker/PG, genuine Auth/provider/credential/sharedfixture/resource acquisition or polling occurred. No Miniflare/listener was launched. Root R7's user-reported guarded stop16:53:19.789UTC, backup4275800/SHAabcfd9bf9d202c59a9bb281010c5db01d77f192a816e4bbb0a5070063ada79b4 and retained221 files/10 cases/fivehelpers/volume remain attributed coordinator state; they were never opened or probed. R6/R4/R5/child PG are likewise untouched. Old care/genuine attestors and policy hashes are unchanged; Root's new R8/canonical61/native harness stays separate.

Official primary references consulted read-only: [Workers best practices](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/), [DO stub](https://developers.cloudflare.com/durable-objects/api/stub/), [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys). Changelog markdown fetch returned unsupported content type; no platform upgrade or service action followed. Existing pinned signatures/source and strict compiler checks establish this change; no new platform API or dependency is introduced.

No push/PR/merge/deploy, real client/source/permission/communication/funds/retailer action. Status/TASKS/CONTEXT_SYNC, Root/contracts/SQL, auth/runtime lifecycle and later feature composition remain coordinator-owned. Resolve containing commits with `git log --format=%H -- docs/portal-rebuild/research/W0_REVIEW_GUIDANCE_TRANSPORT.md`; final head is returned separately to avoid a self-referential report hash.
