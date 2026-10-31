# W1 reports and guidance implementation

Owner: Kanuj. 31 October 2026. **Phase 2 in progress in the isolated child only.** No backend, canonical, genuine Auth/browser, application or full-goal acceptance. Parent R7's frozen57/native76 source remains untouched. Initial contract commits26f9ae3/a977b190 are pinned intended wire shapes, not independent implementation acceptance.

Workspace `/Users/kanuj/.t3/worktrees/shelv/t3-7a7cac7e`, branch `t3/portal-review-contract-seam`, Phase 2 starting HEAD `a977b19048408607c5857ba98acf4fd79568ff98`; original parent08575a966a7cb22d464d9226fd95defdf2c96470. Same exact task/thread/runtime as [Phase 1 report](W1_REPORT_GUIDANCE_CONTRACTS.md). Both live tools verify codex/gpt-6.1-sol/xhigh/default, advertised supported descriptors, eight role pins. Explicit Node22.23.0. No nested agent, parent integration, remote write, live client/source/grant/message/money/provider action or shared fixture.

## Actual sole allocation

Installed CLI `/opt/homebrew/Cellar/supabase/2.121.0/bin/supabase migration new --help` was inspected first. Then:

```sh
/opt/homebrew/Cellar/supabase/2.121.0/bin/supabase migration new portal_rebuild_reviews_guidance_v1 --workdir /Users/kanuj/.t3/worktrees/shelv/t3-7a7cac7e
```

Actual result: **`supabase/migrations/20261031091520_portal_rebuild_reviews_guidance_v1.sql`**, `Migration created`. This is logical M58 after the existing57, immediately reported to the coordinator. No invented timestamp, previous migration edit or parent allocation/copy. It is an allocation-only empty file at the early handler checkpoint, not an implemented SQL migration.

## Early actual handler/export seam

- `concierge-reviews/handler.ts`: `ReviewPorts`, `handleReviewRequest`; runtime exports `createReviewPorts`, only fixed `concierge_review_command_v1`.
- `concierge-guidance/handler.ts`: `GuidancePorts`, `handleGuidanceRequest`; runtime exports `createGuidancePorts`, only fixed `concierge_guidance_command_v1`.
- One new `concierge-reviews/shared.ts` boundary reuses actual retained authenticated transport, public key/caller bearer, strict body reader/parser/result mapper and finite errors. Each endpoint's index uses the retained Deno environment pattern. No service credential or caller-selected endpoint/RPC.
- Every read/status is classified by the closed action list. Malformed write success/transport loss stays503 uncertain; read/status failure is unavailable. Exact request remains available to the caller's existing retry protocol. No SQL/private upstream text leaks.
- Authorized existing Root change is only `PortalRebuildValues.planErrorStatuses` additions guidance_version_required409 and guidance_conflict409. New actual Plan-handler test first returned503 instead of409, then passes after that bounded namespace change. No Plan26/Care13/Task14 expansion, old test weakening, frontend/session/gateway/package/status/CONTEXT_SYNC edit.

Early new handler tests:4/4,0 failed/skipped; strict actual-import TS6 compile0 with unchanged --strict/ES2022/bundler/allowImportingTsExtensions settings and parent TS6/types read-only. Test module absence was a presence RED; the actual old Plan-handler503-versus409 is substantive RED. New tests cover both actual runtime Auth/RPC allowlists, retained bearer, anonymous/malformed identity, strict unknown fields, raw500001-byte refusal, private malformed success and uncertain write/read distinction. These are synthetic-port tests, not genuine Auth or SQL acceptance. Root dependencies are absent; full application/test-type/Expo/canonical/browser checks remain unrun.

## Required implementation sequence

1. Keep the exact14 Review/9 Guidance pinned shapes; all new agents deny. Implement typed canonical legacy/goal report variants, immutable detail/amendment/conversation/private-note/provenance and attention to every actually dependent review. Empty observation is no-op, no clinical head/event/notice. Reuse actual photo completion/owner checks; never fabricate a completed upload.
2. Separate guidance draft revisions, exact human reviews/approvals/publisher/scope/current policy/dependency/source guards and typed canonical output/receipt/outbox/deferred linkage. No bypass flag/GUC/function-name or role. No-change/reply/instruction preserve plan/service/Start clocks and actual first paid entitlement.
3. V3 immutable document/use plus bounded public guidance snapshots,2550 explicit actual scope completeness, pages/exact details/day/head CAS, current descriptor-compatible unknown Start, no instruction carry, current-guidance-bound decision2. Old readers/writers stay lossless or fail closed; old unversioned guidance stays denied. Facts/stop remain independent.
4. Own fresh Unix-only minimal PG15 fixture and actual parser/handler/mapper/role-switched SQL bridge, explicitly synthetic Auth. No old/parent fixture access. Meaningful persisted red/green, concurrency/after-wait/retry/rollback/source/privacy/ACL preservation and new canonical pgTAP additions. Stop only own fixture after guarded zero-other-connection check; preserve data/logs/failures. Parent later owns full58 canonical/genuine/new-app acceptance and independent review.

## Documentation retrieval scope

Applied Supabase skill and current public documentation only; no hosted project API or credentials. Changelog index was fetched read-only; current relevant notices concern regional tzdata/TLS, not this owned Unix PG15 protocol. [Supabase RLS guidance](https://supabase.com/docs/guides/database/postgres/row-level-security) and [PostgreSQL15 constraint-trigger semantics](https://www.postgresql.org/docs/15/sql-createtrigger.html) support least-privilege private tables/helpers and deferred linkage. The user's explicit owned forward migration workflow governs over generic skill suggestions to pull a migration from a hosted database. No hosted query, deployment, provider delivery or new access grant was performed.

Final SQL/native evidence, exact source hashes, fixture lifecycle/custody, preservation and remaining checks will be recorded here before final handoff. The full portal remains in progress.

## Current owned native lane checkpoint

Only a new child-owned PostgreSQL15.19 Homebrew cluster was created. Source helpers from tests/portal-rebuild-native.py are reused with every executable resource binding replaced before invocation; its old resource binding is disabled. No old or parent fixture was opened. Actual parser -> new handler -> mapper -> role-switched SQL bridge uses minimal synthetic Auth tables/identity, not a genuine JWT/Auth/PostgREST claim. The fixture is currently RUNNING for implementation, with listen_addresses empty, max_connections12/shared_buffers16MB; final guarded stop remains required.

- Socket `/tmp/sh-rv7a-005fdf80`, port `55487`, database `shelv_review_7a7cac7e_synthetic`, PID `67378`.
- Data `/Users/kanuj/.t3/worktrees/shelv/t3-7a7cac7e/.local-artifacts/portal-rebuild/w1-review/fixture/005fdf8052504212b0aedaafaaa2fc6b/data`; marker `W1 review 7a7cac7e synthetic Unix-only 20261031`; owner receipt `.local-artifacts/portal-rebuild/w1-review/CURRENT.json`, mode600.
- Fresh prerequisite replay includes canonical concierge prerequisites and exact M54/M55/M56/M57. Before M58 implementation, the new actual-handler native suite fails2 assertions/0 errors, expecting200 but observing503 uncertain for absent Review RPC. Log `.local-artifacts/portal-rebuild/w1-review/native-red-missing-sql.log`, preserved. This is substantive missing-SQL RED, not setup failure or acceptance.
- No completed-photo row, Storage object, real grant, provider action or inherited credential is fabricated. Native photo positives that need actual Storage completion remain later parent HTTP acceptance; pending/nonowner/nonexistent references will fail closed.

## Authorized bounded legacy error compatibility correction

The first retained Checkin regression used the wrong singular export and failed import; that is a setup fault, not a product RED. After correcting to actual `handleCheckinsRequest`, the test reproduced503 instead of409 for `concierge_content_version_required`. The coordinator authorized only the child dictionary key content_version_required409. That one key is added; actual response now409 `{code:'content_version_required',retryable:false}`. No parser/action/Auth/Storage/right or older test change.

Actual retained gateway source was then executed read-only with the new TS6 in-memory loader and injected error-only fetch. The chosen unprefixed Checkin code passed. The unchanged legacy Operations prefixed alias returned409/unavailable. The coordinator explicitly authorized the sole child shared-file change in `runtime/server/upstream.ts` json-error handling: normalize exactly `concierge_content_version_required` to `content_version_required` before the existing safeCodes lookup. This is two added lines replacing the old single expression; no generic prefix stripping or other namespace/status/Auth/action/permission change. Parent R7/gateway/runtime remains frozen and unmodified.

New direct `SupabaseProvider.json` and `ClientProvider.perform`/safeError vectors cover unprefixed/prefixed exact alias, two unrelated unknown prefixes, malformed/private errors. **9 vectors pass**, global external fetch DENIED; no actual provider/network call. **32 retained session checks pass**,0 fail/skip: plan-channel, care-channel, manual-methods-policy and navigation-return, using actual source through the same loader and global no-network preload. This avoids the ordinary full session script's generated-site removal/build and Miniflare fixture allocation. It is bounded source/runtime verification, not the full session build/types/Vault/genuine-Auth suite.

```sh
/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node --loader ./tests/portal-review-gateway-loader.mjs tests/portal-review-gateway-errors.mjs
/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node --loader ./tests/portal-review-gateway-loader.mjs --import ./tests/portal-review-no-network.mjs --test --test-reporter=spec apps/portal/session-integration/runtime/tests/plan-channel.test.ts apps/portal/session-integration/runtime/tests/care-channel.test.ts apps/portal/session-integration/runtime/tests/manual-methods-policy.test.ts apps/portal/session-integration/runtime/tests/navigation-return.test.ts
```

## Narrow Phase 2 history and acknowledgement clarifications

The already-pinned ALL-dependent-published-reviews obligation needs a closed `review_attention` history entry. Full original and amendment remain their own entries, not repeated per review. Each state-change event has unique eventId, while attention.id is the stable relationship; later immutable resolution events link a new actual published review and retain their own event/time identity. Publication comes from the actual bound prior published review/output, never a guessed report/current version or private draft/preparation record. The pure source vector includes two unresolved review relationships and a later resolution on its own page with the same attention.id; duplicate eventId rejects. No action/right expansion.

The coordinator also pinned a bounded V3 decisionGuidance projection, one row per actual canonical decision state (never untouched authored decisions). It carries actual recordedDecisionRevision when provable, acceptedSnapshot only for genuine v2, and current/stale/legacy_unbound acknowledgement provenance. Choice/reason/orders/use remain unchanged. Stable clinical manifest hash excludes counter/day/unrelated finance/private prep; fresh writes still bind full current heads/day and live scope. SQL association will use both immutable writer journals plus an immutable row-fingerprint association for new writes, not a new choice ledger or historical receipt/row backfill. Implementation and native tests are in progress; no completed acceptance is claimed.
