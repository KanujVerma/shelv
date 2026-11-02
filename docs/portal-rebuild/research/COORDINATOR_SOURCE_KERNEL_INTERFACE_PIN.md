# Source kernel Phase 1 interface pin

Owner: Kanuj. Coordinator engineering pin, 1 November 2026 Chicago. This authorizes source implementation in the existing W1 allocation, not SQL execution, policy activation, raw admission or release.

## Scope and ownership

Frozen Parent: `3bd152a259b7b9b9971caa1546e65f69de12aab9`. The original task and actual returned identities are retained in TASKS and the ignored allocation receipt. The sole CLI-created migration is `supabase/migrations/20261102033048_portal_rebuild_source_kernel_v1.sql`; Parent directly verified zero bytes before this pin. No second migration allocation.

Approve exactly the proposed eight NEW `kernel-{types,validation,rpc,http}.ts` modules under `supabase/functions/concierge-sources/` and `supabase/functions/concierge-source-account/`, three NEW `apps/portal/tests/rebuild-source-kernel-{contract,root,http}.test.mjs`, NEW `supabase/tests/portal_source_kernel_v1.test.sql`, and NEW author report `W1_SOURCE_KERNEL_SOURCE.md`, plus the allocated migration. Source4 may enter as a separate attributed model INPUT commit only, with the four exact frozen blobs in [the freeze](COORDINATOR_SOURCE_PROPOSAL_FREEZE.md). The existing UTF8 inspector, Account4, all old tests/SQL/config/locks, shared Auth/gateway/UI and other paths remain frozen. The author remains sole writer of this migration; Parent owns eventual composition and new independent review.

## Public and fixed server seams

Preserve `SourceScope = {kind:'client';clientId:UUID} | {kind:'draft';draftId:UUID}`, Source15's exact eight reads/seven writes/task0, and Account's exact three actions. Preserve all Root DTOs, parsers, mappers and caps.

User command RPCs are exactly:

- `public.concierge_source_command_v1(p_command jsonb)`, with parsed `SourceCommand`, returning unchanged Source result DTOs.
- `public.concierge_source_account_command_v1(p_command jsonb)`, with parsed `SourceAccountCommand`, returning unchanged Account result DTOs.

Approve two fixed authenticated server journal-context RPCs:

- `public.concierge_source_request_context_v1(p_request_id uuid)`.
- `public.concierge_source_account_request_context_v1(p_request_id uuid)`.

Their result is strictly `{originalCommand,requestHash} | null`, with an original WRITE command from that exact family and matching canonical request ID/hash. No actor, client, scope, session, SQL/RPC/path selector or authority boolean is accepted. The adapter passes Account's original withdrawal as the frozen mapper's `originalWithdrawal` field. These lookups are server adapter inputs, not additional Source/Account user actions or browser routes.

Each wrapper infers actual actor/session from authenticated SQL context, rejects anonymous/task principals, and checks current stored scope/lineage authority before revealing existence, context or replay. Account infers its own client and permits authorized consent administration after care ends without granting care/raw rights. Cross-actor or currently inaccessible requests never reveal original context. A missing journal has no invented Source scope; return safe unavailable rather than claiming an authorized absent target. Null alone must not be turned into a purged/absent receipt.

The Source handler accepts POST application/json containing the unchanged command, uses fixed Source command/context calls only, and caps the request at Source `sourceJsonMaxBytes=500000`. Account uses its unchanged `sourceAccountCommandMaxBytes=100000`. Enforce existing response/page budgets before buffering/JSON decode (1800000 response and 400000 page) and a separately bounded 8192-byte Auth-user response. This phase exposes handlers over closed fixed-RPC native Response ports and bounds their streams before decode. It does not implement credential/network factories, index/route/bootstrap or shared runtime activation; actual public-key/Auth transport needs a later allocation. Closed synthetic responses are not actual authentication or current authority proof. Origin, method, content type, canonical shape, abort and safe error behavior remain explicit.

Authenticate the exact bearer through actual Auth user proof; only then derive canonical actor and `session_id` from that same token, checking matching subject/permanent user. JWT decoding is not authentication. SQL independently verifies current owned live session, user/principal/profile/policy and selected scope. Recheck actual SQL authority after waits and before cached receipts, target/CAS/errors/private results; native Auth revalidation never replaces scope authority. Known 401/403 must survive an unreadable or indefinitely pending body without waiting for disposal. Hash and callback waits must not expose stale captured private results. Final shared transport/private-egress integration remains a later allocated gate.

## Status, purge and once-only evidence

One amendment to the proposed null/purge wording is required by the unchanged [Account mapper](../../../src/contracts/PortalSourceAccountMapping.ts): even absent/purged status validates `originalWithdrawal` and `requestHash`. Preserve the actual minimal canonical client-safe withdrawal command plus its hash in the once-only Account journal/tombstone. That command contains only schema/action/request/revision and safe consent alias/group/purpose/disclosure refs; it contains no raw Source/draft ID, disclosure body, evidence or manual reference. After private result purge, the fixed lookup can still return that actual command/hash so the unchanged `request_purged` DTO maps honestly. If that minimal lawful context is unavailable, return unavailable; never fabricate it or weaken Account4. Source's private original commands/results may be purged separately, in which case the Source family returns safe unavailable and retains only its minimal once-only collision/effect tombstone, never a fresh effect or false absence.

For all Source writes and Account withdrawal, hash the detached, parsed canonical command with the exact frozen Source `sourceCanonicalJson` / `sourceHash` rule: SHA256 of UTF8, recursive sorted keys, no formatting spaces, original strings, safe integer semantics and parser-normalized UUIDs. Use the same rule for Account as this new producer pin; Account4 itself is unchanged. SQL must reproduce that exact byte framing. Existing `concierge.plan_hash(v::text)` has JSONB whitespace and is not an interchangeable hash implementation; do not change that old helper. Add meaningful command/hash cross-check vectors, including non-ASCII text, escaping, key order, UUID canonicalization, zero and safe integer limits. Never trust a caller hash.

Extend current six-family collision handling with both new journals in both insertion orders, under the same `concierge:request:` actor/UUID lock before effects. Preserve the existing helper OID/owner/ACL/attributes and trigger bindings. Minimal collision rows survive private purge and relevant cascades. Source's frozen error set lacks `request_conflict`: only the known shared collision error may map to existing `source_conflict`/409 at this family's handler. Account retains `request_conflict`/409. No generic error alias or unknown-success acceptance.

## Disclosures and policy

Approve private append-only immutable disclosure drafts binding purpose, positive version, exact UTF8 text and exact text-byte SHA256. Preserve BOM/CRLF/scalars; no trimming, normalization or canonical-JSON hash for disclosure text. Enforce the actual shared Account display bound of 4000 scalars. One purpose/version cannot ambiguously denote conflicting text/hash.

A separate append-only published-policy record references the exact storage/review draft tuples and immutable profile/config JSON. Its hash is the frozen canonical-JSON hash of the complete public SourcePolicy value with only its self-referential `ref` removed. `platform.configHash` separately binds the exact immutable config JSON with that same canonical rule. An explicit private current-policy selection must identify the selected published record; neither maximum UUID nor a draft's existence makes it current. Referential/uniqueness guards must prevent purpose/version/hash/profile mismatches.

No real disclosure text is approved here. No migration seed, public publish/activation API, principal provisioning or live current-policy activation. Synthetic pgTAP fixtures may create explicit draft/publication/current-selection facts inside authored tests only; those tests remain UNRUN. Production without a deliberately selected published policy returns unavailable. A staged, drafted or declared hash is not a current disclosure, actual client confirmation or raw permission.

## Canonical state and CAS

Approve P3's guarded nullable pending `plan_sources.version` pointer, never an alleged completed v1. Null requires inactive Source-managed enrollment/reservation and proof no version has ever completed. Prohibit active/null, legacy/null and completed-to-null. Preserve every existing legacy row/value and immutable origin/adoption. No second SourceId registry, dummy descriptor/hash or inherited consent/grant. Existing reference/review/publication paths must continue denying pending/inactive managed content. Within the new migration the only presently approved old-object changes are this guarded pending-pointer support and the shared collision helper extension. Surface any additional existing helper change before editing that object; independent new modules/tests proceed.

Use one shared private Source scope CAS mirrored into registry/authority/retention revisions, with separate coordinated Account CAS. Manual consent/portal withdrawal advances affected scope and Account heads atomically. Server supplies causal predecessor/sequence, recorder/time and safe alias/group identities. Keep manual confirmation and client_portal withdrawal distinct; occurrence may remain unknown. Replays require current stored authority, not historical receipts. Source manager is actual activated owner-policy owner plus active owner principal/live permanent session/unfenced profile/advisor VIEW+EDIT; manager is not raw-read authority.

## Acceptance boundary

This Phase 1 must implement its claimed persistence, reservations, consent, grant/revoke/withdraw/status/CAS and denials. Payload completion stays unavailable until actual Storage/inspection/object inventory/byte proxy/account-deletion dependencies exist. No successful raw storage/inspection/cleanup placeholders, byte/deletion service protocol, enabled format profile, disclosure activation or physical-absence claim. Keep supported source formats/full lifecycle work explicit rather than reducing the full goal to metadata.

Retain substantive RED/GREEN and setup failures distinctly. Author native pgTAP but do not run SQL, DB, Auth, Storage, browser or providers. Independent SOURCE review is required before Parent import; later genuine persistence/current authority/withdrawal/cascade and physical verification remain open. The full approved rebuild remains active.

