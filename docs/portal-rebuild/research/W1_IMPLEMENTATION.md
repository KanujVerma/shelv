# W1 plan platform implementation

Owner: Kanuj. Date: 30 October 2026. Scope: the first care-plan backend slice in [PLAN_API_V1](../PLAN_API_V1.md). This is not the complete portal or release approval. Independent review and the coordinator's real Auth/PostgREST/browser acceptance remain required.

## Workspace and runtime

- Worktree `/Users/kanuj/.t3/worktrees/shelv/t3-e29f4f78`, branch `t3/portal-plan-backend-slice`.
- Exact requested/inspected base `a7f4f36591a7965bcaa1ca3899c82f9b84fabe0c`; clean initially. `git fetch origin` succeeded; `HEAD...origin/main` was `11 0`.
- Live T3 `orchestrator_capabilities` returned provider instance `codex`, model `gpt-6.1-sol`, inherited options `reasoningEffort=xhigh`, `serviceTier=default`. `t3_thread_configuration` independently returned the same effective selection and `full-access`/`default` modes. Project `.codex/config.toml` also pins Sol/xhigh. No subagents were used.
- Every Node command explicitly selected `PATH="/Users/kanuj/.nvm/versions/node/v22.23.0/bin:$PATH"`; actual red/green output reports Node `v22.23.0`. `npm ci --ignore-scripts --no-audit --no-fund` installed the existing lockfile without changing dependencies or lockfiles.
- Installed Supabase CLI `2.121.0` created the actual canonical filename with `supabase migration new portal_rebuild_plan_v1`: **`20261030223603_portal_rebuild_plan_v1.sql`**. This was reported to the coordinator before further migration allocation. No historical migration was edited/reordered.

Commits before the final backend slice:

- `3c226a8b098d7ae0001d885c2e00d8b1db275a9f`: strict domain/command seam, empty factory, projection, initial adapter/tests. Sent to parent immediately after verification.
- `26a4e88df101ee2a8aacb5511f4bb3911cc0a4c8`: normalized legacy renderer fields, R1 identifiers and explicit unknown metadata. Sent to parent after the coordinator's concrete follow-up.
- `a9f073a11df356734cbe7f4a0adaece8611a3518`: final implementation head. The subsequent report-only delivery commit is returned to the parent/final response, avoiding a self-referential commit hash in this file.

## Implemented behavior

`PortalRebuild.ts`, `PortalRebuildValidation.ts`, `PortalRebuildValues.ts`, and `PortalRebuildMapping.ts` provide concrete closed types, strict input/output readers and fixed `readPlanCommand(value): PlanCommand` / `buildPlanRpc(value): PlanRpcCall`. The only plan RPC is `concierge_plan_command_v1(p_command jsonb)`. Protocol schema 1, content schema 1, and publication document format 3 remain distinct.

The SQL RPC and `supabase/functions/concierge-plans/{handler,runtime,index}.ts` implement:

- Empty unassigned creation with no Auth/admission/case side effect; incomplete compare-and-save; immutable checkpoint; explicit assignment to an existing admitted client; one assigned working draft; stale-write protection.
- Read-only base/latest/proposed comparison and exact hash-bound import application. Comparison does not mutate a draft or manufacture a saved result. A stale expected content/assignment revision rejects rather than overwrites.
- Separate readiness and authenticated human section review; exact target approval; append-only approval revocation; owner-only audited Sami policy; explicit task grants/revocation.
- Deliberate first publication requiring the existing verified quote/claim/confirmation/pending service period. Payment-only bookkeeping leaves the clinical target unchanged. Later publication uses active coverage and preserves the first clocks and all Starts.
- Canonical `concierge.publications(client_id,version)` identity plus immutable complete V3 document, approval/receipt linkage, entitlement, initial Chicago service/review schedule, one business event, email/portal rows and one receipt in the same transaction. Deferred constraints enforce complete linkage independently of the public handler. Outbox failure rolls everything back.
- Entitled version-aware client reads, including R1/R2 originals plus normalized content, and V3 native content. Client identity is inferred. Prepublication reads expose preparation, never draft advice. Read-only care access ends exclusively at support end plus 30 Chicago calendar days. Administration remains in its separate existing channels.
- Client decision responses on the selected canonical publication, including deferred, without creating a payment, order, receipt or Start. Historical legacy choices are projected with their original decision/card mapping; newer versioned responses take precedence. `actualUse` selects the latest occurred Start per slot, without changing immutable Start history.
- Restore V3 or R1/R2 history into a new working draft, with explicit current-draft conflict protection. Never replace a publication in place.
- Principal-scoped committed request lookup for both advisors/agents and clients recovering an uncertain decision response. No optimistic saved/sent/published result.

There is no necessary edit to an existing root command/mapper module. All new runtime/domain files are within the owned paths. No frontend, gateway, vault, package/lockfile, existing fixture snapshot, founder/status/shared document or counterpart branch was edited.

## Identity, scope and locks

Activation is a server-owned singleton policy for the whole candidate. It defaults to dormant with no owner, principals, task grants or source grants. There is no client opt-out or GUC bypass. Activation/enrollment must be performed deliberately in the coordinator's synthetic fixture, and separately authorized before any real cutover.

Owner/human/agent identities are persisted registrations tied to real permanent Auth identities. Source authority never comes from a role/name field or editable JWT metadata. The new Edge ports verify `/auth/v1/user`, propagate that same bearer to one fixed PostgREST RPC, and use only a publishable/legacy public key. SQL locks and checks the actual Auth user, profile deletion fence, `auth.sessions` ID/expiry, registered principal, advisor capability where applicable, and enrolled target.

Task grants have exactly **one client OR one existing draft** scope, finite actions, a real provider-session UUID, and expiry no more than 24 hours away. Both scopes together and wildcard/source escape are denied. Because the pinned create command has no grant selector, agent creation requires exactly one live create-capable client grant for that session; ambiguous grants fail closed until the owner revokes the extra grant. Client-scoped explicit create makes an unassigned draft with private originating grant/intended-client identity; the same agent can read/save and assign it to that exact client without creating an Auth user. A draft-scoped grant edits that exact draft; it does not grant client-wide creation or reassignment. Listing is filtered to the selected live grant's scope. Assignment cannot escape the originating client even under a later grant.

Only existing server-enrolled source metadata can be granted, with exact source IDs and matching client/draft scope. Human source access other than owner requires a persisted permission; task source access requires the specific grant. Source rows/versions/permissions and task grant/session rows are rechecked and locked. Raw source bytes, upload, retention and signed access APIs are not enabled here. The owner can recover a stale draft; readiness shows stale sources while publication still rejects them.

Lock order is policy/principal/session/grant, existing request advisory namespace, sorted old/new client advisory namespaces, then draft/approval/payment rows. Operations reauthorize after waits using new statement snapshots and `clock_timestamp()`. Expiry after a client wait and a task revocation committing during a grant wait are tested. Grant/session identifiers are durable audit values, not FKs that block session logout or erase a client's publication when an agent session ends.

Approval hashes bind draft/client/content revision/assignment revision, complete authoring body, current source manifest and review-relevant publication/use/intake/baseline basis. Payment heads, check-in bookkeeping and delivery attempts are excluded. Section hashes include their dependencies. Whole-publication approval never survives a content revision or reassignment. Payment can be verified before or after clinical approval.

Exact retries reauthorize before returning the committed receipt. Payload reuse and cross-stream collisions reject in both directions. Approval consumption has a unique durable constraint; two identical requests return the same receipt, while two distinct requests racing one approval yield one publication and one conflict.

## Legacy boundary and private projection

All activated-candidate legacy guidance routes are fenced: public R1 publish, R2 publish and their private chains, instruction publication, `record_review`, and `send_advisor_reply`. Public wrappers reject new unversioned guidance commands; insert triggers also cover private chains and low-level insertion. A caller cannot choose a legacy format to skip the gate. A bare V3 publication cannot commit without its exact complete document/approval/payment/entitlement/outbox/receipt linkage.

Historical exact guidance receipts are returned directly after current authorization and exact fingerprint verification, without rerunning the prior business handler or imposing a fresh payment. The explicitly dormant legacy setup test is compatibility evidence only, not candidate publication acceptance. New candidate gates were not weakened to satisfy publish-before-payment setup.

Old readers/writers that would truncate V3 semantics return `content_version_required`; new versioned reads support entitled legacy history even after V3 exists. R1/R2 originals remain immutable. The adapter's actual normalized renderer input retains preparation identity/date, consultation sections, product status, product/image/reference-price metadata, full routine and decision usage including order/short instructions, routine guides, comparisons, facts, source citations, cautions and conditions carried in those original fields. Stable product/decision/slot/step IDs stay opaque and unchanged. Unknown R1 metadata remains unknown/blank; no zero product price or fake intake is fabricated.

Complete authoring content lives in `plan_draft_private`; immutable `plan_documents` contains the client allowlist only. Private fact text/IDs, contradiction references and raw source IDs/version/locators never enter the client document. Permitted public conclusions and citations survive. Preview uses the same safe projection. Authenticated/service callers have no raw table or private helper access; RLS is enabled on every new plan table.

## Concrete internal outbox seam

`plan_events` deduplicates `(client_id,publication_version,kind)`. `plan_deliveries` deduplicates `(event_id,recipient_id,channel)` and separates queued/claimed/uncertain/accepted/delivered/failed/bounced from `seen_at`. `plan_delivery_attempts` retains attempt/lease/result attribution. Publication never performs an external send.

Fixed public RPCs, **service_role execute only**, with raw helpers/tables still inaccessible:

| RPC | Fields/result |
| --- | --- |
| `concierge_plan_delivery_claim_v1` | `p_limit` 1..50; transactionally claims queued email jobs with `FOR UPDATE SKIP LOCKED`; returns delivery ID, lease ID, recipient ID, event ID and stable delivery-ID idempotency key. |
| `concierge_plan_delivery_result_v1` | Exact delivery/lease IDs, `accepted|failed|uncertain`, optional bounded provider-message ID and safe error code; idempotent same result; no publication call. |
| `concierge_plan_delivery_retry_v1` | Delivery ID, expected delivery revision, provider-reconciled flag. Requeues failed jobs; uncertain jobs require reconciliation before retry. Preserves the original delivery/event IDs. |
| `concierge_plan_delivery_expire_v1` | Marks expired claims uncertain. It does not assume a provider failed or blindly resend. |

The subsequent real delivery worker must use a dedicated server-held credential, resolve an authorized test-only recipient/local sink, commit claim before contacting the provider, send neutral sign-in/deep-link content, and record provider outcomes under the same delivery idempotency key. Lost provider responses require reconciliation; provider acceptance is not delivery/read evidence. Provider webhook authentication, delivered/bounced processing, client notification inbox/seen and scoped UI retries remain required later work. No actual email was sent by this slice.

## Coordinator gateway and response seams

Proposed bounded integration, not edits to coordinator-owned files:

1. Add a finite plans function channel pointing only to `concierge-plans`; pass the existing vault-held caller bearer/public key. Preserve same-origin/CSRF, cookie ownership, lease/generation checks and no-store behavior. Request byte limit is 500,000; parser also bounds every nested field/array.
2. Client action allowlist: `read_client_plan_v1`, `record_decision_v1`, `request_status_v1`. No caller client ID on the first two.
3. Advisor action allowlist: the other pinned care-plan actions and `request_status_v1`. SQL remains authoritative for owner policy/human approval/task/source permissions. Do not expose service-only delivery RPCs through browser or agent channels.
4. Use `mapPlanResult` and its `PlanResult`/`PlanDirectory`/`PlanPreview`/`PlanImportComparison` types. `ClientPlanView.plan` is discriminated by document format 1/2/3; legacy variants include validated `legacyOriginal` plus normalized client content. Render normalized rich fields, not an ignored original blob.
5. Directory merges drafts/publications under one total page limit (1..100), returning `nextCursor`. Cursor is an opaque server sort token `d:<uuid>` or `p:<uuid>:<10-digit-version>`; pass it back unchanged. No generic URL or arbitrary RPC field is accepted.
6. Persisted successful responses are strict-mapped; added private/unknown response fields fail closed. SQL conflicts map to 409, denied/session to 403/401, readiness to 400, and unavailable/uncertain results to 503. After uncertain writes, query the same request ID; never automatically publish again under a new request ID.

## Verification and reproducibility

Final results on the implementation above:

| Check | Actual result |
| --- | --- |
| Native canonical-concierge migration rehearsal + focused suite | **29 tests passed**, zero failures/skips; final run 14.792 seconds. Exact historical snapshot comparison and zero owner/principal/grant seed assertions passed. |
| New domain tests | **7 passed**, zero failures/skips; root runner includes them. |
| New handler/transport/response tests | **3 passed**, zero failures/skips; root runner includes them. |
| `npm test` | Exit 0: **1,186 passed**, zero failures, **18 existing explicit opt-in native integration skips**, 1,204 total. No new skip was added. |
| `npx tsc --noEmit` | Exit 0, zero errors. |
| `npm run typecheck:tests` | Exit 0, zero errors, including imported handler/runtime/response modules. |
| Supabase security advisors, explicit owned Unix socket | Exit 0, no warn/error issues, results `[]`. |
| Native catalog ACL/RLS audit | No raw ACL/RLS violations. Plan command: anon false/authenticated true/service false. Four delivery RPCs: anon false/authenticated false/service true. |
| `git diff --check`, staged whitespace/scope check | Passed. Only the explicitly owned paths are changed. |
| Full canonical Supabase reset/pgTAP/actual Auth/PostgREST/browser | Not run by W1; coordinator-owned distinct snapshot. Homebrew has no pgTAP extension. New canonical pgTAP file contains 18 structural/ACL/constraint assertions. |
| Expo web/iOS export, full portal/session suites, exact-head CI | Not run by W1; coordinator integration gates. No mobile/native runtime was changed. |
| Deno index/runtime | Not run: Deno is not installed. No deployment/serve claim. |

The 18 root opt-in skips are existing native HTTP/SQL suites for check-in replies/uploads, explicit-none intake/Start, payment methods/evidence and payment HTTP behavior. The new persisted W1 native suite is separate and ran without skips; it does not substitute for their real-service fixture gates.

Meaningful red states were observed before implementation/fixes:

- New domain/handler imports initially failed because the modules did not exist; subsequent tests covered incomplete save, forbidden command fields, private exclusion, public URL safety and finite grants.
- Legacy normalized consultation/usage and R1 reference tests failed before the adapter fixes.
- Native SQL tests initially failed because plan tables/RPC did not exist. Later regression tests reproduced missing private-reference validation, client request-status denial, unassigned checkpoint response mismatch, unbounded directory, missing legacy read/restore, missing retry/service RPC, blank follow-up/contradiction readiness and duplicate current-use projection.
- The implementation was changed only after inspecting those failures. The native suite never substitutes a mocked SQL success.

Owned PostgreSQL fixture: `PostgreSQL 15.19 (Homebrew)`, Unix socket `/tmp/shelv-w1-plan-pg/socket`, port `55439`, `listen_addresses=''`, `max_connections=12`, `shared_buffers=16MB`, UTF-8 marked database `shelv_w1_plan_v1_synthetic`. Bootstrap provides explicitly synthetic Auth/profile/Storage table/function shells and replays canonical concierge migrations plus this new migration. `--prepare` can replace only this marked database. Parent Docker/Supabase/stopped fixtures and private credential files were never started/reset/read. The owned server was stopped successfully with `pg_ctl -D /tmp/shelv-w1-plan-pg/data -m fast stop` after verification; its data and `/tmp/shelv-w1-plan-pg/root-tests.log` / `advisors.log` are retained locally.

```sh
# Restart only this already-owned fixture if reproducing locally:
pg_ctl -D /tmp/shelv-w1-plan-pg/data -l /tmp/shelv-w1-plan-pg/server.log -o "-k /tmp/shelv-w1-plan-pg/socket -h '' -p 55439 -c max_connections=12 -c shared_buffers=16MB" start
python3 tests/portal-rebuild-native.py --prepare
python3 tests/portal-rebuild-native.py
env PATH="/Users/kanuj/.nvm/versions/node/v22.23.0/bin:$PATH" node --experimental-strip-types tests/portal-rebuild-domain.test.ts
env PATH="/Users/kanuj/.nvm/versions/node/v22.23.0/bin:$PATH" node --experimental-strip-types tests/portal-rebuild-handler.test.ts
env PATH="/Users/kanuj/.nvm/versions/node/v22.23.0/bin:$PATH" npx tsc --noEmit
env PATH="/Users/kanuj/.nvm/versions/node/v22.23.0/bin:$PATH" npm run typecheck:tests
```

The persisted Edge bridge uses synthetic session identity in place of the HTTP Auth service, then executes the real handler/parser/mapper and authenticated SQL role against real rows. It proves those boundaries and persisted behavior, not actual JWT verification or PostgREST. The separate transport unit test verifies fixed `/auth/v1/user` and `/rest/v1/rpc/concierge_plan_command_v1` routing and bearer propagation.

The migration rehearsal compares exact pre/post JSON bytes for historical publications, R2 sidecars, intakes, financial confirmations, periods, entitlements, receipts and Starts, excluding only the newly added discriminator column. No owner/principal/grant is seeded. Native tests cover activated positive/negative gates, stale imports/content/reassignment, source scope/version changes, human/agent distinctions, first and later publication, read-only access, legacy paths, request collisions, concurrency/revocation/expiry, outbox rollback/claim/retry, historical restore/read and decisions without actual-use effects.

Canonical pgTAP test added at `supabase/tests/portal_rebuild_plan_v1.test.sql`. Homebrew has no available `pgtap` extension; that test is intentionally left to the coordinator's distinct real Supabase reset/test snapshot. Deno is not installed here; the Edge index is not claimed Deno-runtime verified. Handler/runtime imports are checked by root test types and exercised natively.

Supabase security advisors ran successfully against the explicit owned Unix-socket URL (the CLI labels an explicit URL “remote” even though the host query is the owned Unix socket): no issues at warn/error level. An initial empty-host URL was rejected by the CLI parser; retrying with `localhost` plus the explicit encoded Unix-host query succeeded. No hosted connection was used. Official [functions](https://supabase.com/docs/guides/database/functions), [sessions](https://supabase.com/docs/guides/auth/sessions) and [changelog](https://supabase.com/changelog) guidance was checked. Raw new tables are deliberately not Data API grants; security-definer entry points have explicit narrow execute ACLs, empty search paths and live guards.

## Remaining acceptance and integration requests

- Coordinator: activate only the distinct synthetic candidate; run the full canonical reset/pgTAP, actual Auth/PostgREST positive/negative session journey, gateway/browser journey, full required application/portal/session checks and Expo export on the integrated exact head. Run the independent Sol/xhigh review before accepting this seam as ready for page fan-out.
- W5: new V3 product quotes must consume exact new decisions/products. Legacy product APIs fail closed rather than fabricate priced recommendations. This slice does not implement V3 purchasing/fulfillment/returns or invent prices.
- W6: original-anniversary renewal refinement, guarantee/coverage/cancellation/export/retention/deletion workflows remain coordinated follow-up. Existing periods and first-month Chicago behavior are preserved here.
- Sources: raw uploads, byte/type/storage checks, scoped signed retrieval, consent/retention/deletion processing and unassigned raw-source policy remain disabled and required future implementation. Existing source metadata/permissions are concrete guards, not a fake upload service.
- Delivery: real test sink/provider service and authenticated webhook/inbox/retry UI remain required. Durable queued rows are not successful external notification.
- Review/instruction/history/use modules need their own strict typed extension before public writes are enabled. Activated old guidance commands remain denied until then. Non-null template version creation honestly returns `template_unavailable`; template authoring/version lifecycle is later scope, not a fabricated template.
- No push, PR, merge, deployment, real client access, external send, money movement, order, real role change or parent fixture lifecycle action was performed.

Self-review status: no known unresolved blocking implementation defect in the exercised first slice. This is not independent review, full-stack acceptance, or complete-portal readiness. Missing integration and later-flow work above is explicit and must not be represented as completed.


## Exact changed paths

```text
src/contracts/PortalRebuild.ts
src/contracts/PortalRebuildValidation.ts
src/contracts/PortalRebuildValues.ts
src/contracts/PortalRebuildMapping.ts
supabase/functions/concierge-plans/handler.ts
supabase/functions/concierge-plans/runtime.ts
supabase/functions/concierge-plans/index.ts
supabase/migrations/20261030223603_portal_rebuild_plan_v1.sql
supabase/tests/portal_rebuild_plan_v1.test.sql
tests/portal-rebuild-domain.test.ts
tests/portal-rebuild-handler.test.ts
tests/portal-rebuild-native.py
tests/portal-rebuild-native-edge.mjs
docs/portal-rebuild/research/W1_IMPLEMENTATION.md
```

The coordinator owns updates to shared status, founder documents and `CONTEXT_SYNC.md`; this report is the explicitly allocated durable handoff. No other migration writer was allocated here. Independent review should use the entire base-to-delivery range, including the early contract commits, rather than only the final SQL commit.
