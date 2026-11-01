# Private Source implementation readiness plan

Owner: Kanuj. 1 November 2026. **PLANNING ONLY.**

> Future implementation should use the executing-plans workflow, task by task, only after a separate parent grant. No nested work is allocated. Every unchecked step below is a proposed future action, not work performed or permission granted by this report.

**Goal:** implement the missing private-source lifecycle using canonical Root identities, verified immutable content and actual current authority, then supply W2's missing reader without exposing raw sources to clients or public outputs.

**Architecture:** one canonical source registry, the frozen Source15 JSON model and existing cookie/Vault transport; private immutable version/payload/proof/lifecycle sidecars and bounded same-origin content reads. Trusted inspection and physical-cleanup producers are separate from human commands. Hashes, handles and historical receipts never become permission.

**Stack:** existing TypeScript/React consumer, canonical PostgreSQL/Supabase Edge/private Storage, retained Worker/Vault boundary. No new package, decoder, storage vendor or platform API version is recommended or verified here.

**Specifications:** complete [approved input](../source/APPROVED_INPUT.txt), [D01-D48](../APPROVED_DECISIONS.md), [desktop specification](../APPROVED_DESKTOP_SPEC.md), [contracts](../IMPLEMENTATION_CONTRACTS.md), [D39 addendum](../DECISION_ADDENDA.md), frozen Source model at d0f3a31c and the independent R1-R5/author-response chain. W6 reconciliation and current W2/R6 are exact source inputs, not backend grants.

## 1. Decision and custody boundary

The parent freezes **only the reviewed early MODEL** at `d0f3a31c778d8d08ee752dc1d4b49c4eec26874a`. Independent R5 `014bc0073262b274804fd711ff41b70964349b8d` gives scoped SOURCE/PURE specification and quality PASS. It does not pin roles, profiles/caps, disclosure, actual current rights, producer protocols, byte routing or API admission. Source15 remains unactivated, 8 READ / 7 WRITE / task0. The full portal goal is open.

The primary implementation comparison is **Parent `19c3ea1f106f0e123982d29fe2137f137312fdef`, canonical62/native87**. Its `research/COORDINATOR_SOURCE_PROPOSAL_FREEZE.md`, TASKS and CURRENT_STATUS are the current coordination source. W2 source at299929f3 is integrated as85fc0663 but UNMOUNTED; App remains Care2. Parent records R9 as coordinator-owned with its native87 closure unchanged. Those are inspected source/ledger facts, not a live resource inspection.

This child has65 migration files because it contains **UNADMITTED M63-M65 Commerce work**. They are frozen historical child inputs, NOT accepted Root62 dependencies, a migration-order reservation, a financial integrity verdict or a reason to resume/reroute the provider-blocked financial review. No financial implementation is assessed by this plan. Missing service/financial adapters stay unavailable.

Current task: `node:delegated-task:command%3Amcp%3A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%3Athread-send%3Aw1-source-implementation-readiness-plan-20261101`. Distinct backing run `run:thread:thread%3Adelegated-task%3Acommand%253Amcp%253A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%253Adelegate-task%253Aportal-rebuild-w1-report-guidance-contracts-20261031-r1:ordinal:15`, requested05:20:03.200Z, started05:20:04.467Z. Workspace `/Users/kanuj/.t3/worktrees/shelv/t3-7a7cac7e`, branch `t3/portal-review-contract-seam`, initially clean at exactd0f. Backing thread is the original W1 report-guidance thread, parent `d632030a-18f7-4dec-a2c9-f5c0418c3fd5`, project `ac0af19d-d404-4f53-a870-02bfd76c2a80`. No reviewer or prior ordinal handle is reused.

**No-go now:** implementation/code/test/runtime/consumer/config/role/policy edits, schema or SQL authoring/allocation, CLI/platform/resource calls, Root imports, grants, actual uploads/reads/deletion, private credentials, provider calls, financial review, nested work, push/PR/merge/deploy or live actions. The ONLY authored tracked path is this new report. Ignored source copies/hash/read notes are provenance only.

## 2. Exists, reviewed model, missing producer

| Area | EXISTS at Parent19c3/Root62 | Reviewed MODEL atd0f | MISSING before admission |
| --- | --- | --- | --- |
| Identity | `concierge.plan_sources(id,client_id,draft_id,version,active)`; `plan_source_permissions(actor_id,source_id)`; exact `plan_source_adoptions(source_id,source_version,origin_draft_id,draft_id,client_id,actor_id,created_at)` | SourceScope, SourceVersionRef, canonical origin/originDraftId, direct/adoption access, verified/legacy/tombstone metadata | Immutable version/payload registry, canonical object inventory and authorized enrollment producer. No second SourceId registry |
| Reference rights | M54 plan_guard/plan_authorize/plan_source_scope/content check; M55 live human/source reads; M62 validates every locator before permission dedup and canonicalizes safe integer scales | Exact purpose/grant/consent/lease shapes, agents deny | Actual raw-byte/purpose authorization and per-version consent/grant/revoke enforcement. Owner reference bypass is not raw access |
| Upload | Specialized payment evidence and optional check-in photo reservation/upload/completion; server-only no-upsert Storage | Upload intent/binding/status/receipt, separate completion UUID, old-readable-version preservation | Source reservation, parts, real hash/format inspection, immutable proof, atomic pointer switch and orphan handling |
| Read | Auth/session/Vault, fixed media proxy examples, positive Root readers | Detail/handle, Promise<SourceDetail> verifier, fixed byte intent, scalar chunk mapper | Real private content resolver/proxy, current-rights checkpoints, authenticated body/range producer and W2 adapter |
| Retention | First publication timestamps and service-period/cancellation records; profile deletion fence | Never-started/unconfirmed/confirmed cancellation/unavailable basis; END+12 calendar calculation | Trusted complete lineage/correction/renewal/obligation adapter. No general confirmed-end journal |
| Cleanup | Account deletion fences before cleanup; scanner/product namespaces plus two concierge buckets checked | Complete paged inventory, private proof refs, fenced/retry/unknown states and model digest checks | Source-aware complete physical inventory, actual proof-row linkage, durable worker, inline/derivative purge and safe Auth-cascade dependency |

The model's synchronous text mapper rejects unproven stored coordinates, wrong source/version/convention, unknown bounds and page/time-to-text fallback. Its declared handle/chunk hash equality is not cryptographic body inspection. Consumers must await `verifySourceDetailDigest` and use the returned deeply frozen detached graph; a later-mutated input is not verified. Real current authority must still be checked after every await.

### Source15 compatibility table

One proposed fixed `concierge_source_command_v1(p_command)`. Nothing here adds a command or infers its admission.

| Action | Class | Future authoritative behavior / positive result |
| --- | --- | --- |
| read_source_policy_v1 | READ | Real enabled profiles and exact disclosure versions, or source_storage_unconfigured/disclosure_unavailable; never advertise all enum formats as supported |
| list_sources_v1 | READ | Complete permission-filtered metadata pages, stable scope/snapshot/cursor/total; legacy metadata stays legacy_descriptor |
| read_source_detail_v1 | READ | Exact scope/selection/version, verified immutable descriptor and session handle, or the existing finite unavailable reason |
| source_upload_status_v1 | READ | Exact reservation binding and actual part/completion state. Unknown response is not complete |
| list_source_grants_v1 | READ | Exact version/scope, nonempty unique purpose-specific rights, expiry/revocation history; not authority by itself |
| read_source_retention_v1 | READ | Trusted lineage/date/mode/inventory/obligation projection. Unknown producer must not be mapped to no_override |
| read_source_cleanup_v1 | READ | Exact private job/progress/manifest pages and actual proof refs, with original incomplete/unknown states |
| request_status_v1 | READ | Current authorized access to the ORIGINAL actor/UUID/command/scope receipt, not fresh write eligibility; absent only if actually absent |
| record_source_consent_v1 | WRITE | Real manual confirmation/disclosure/purpose allow or withdrawal; server actor/time and honest known/unknown occurrence |
| begin_source_upload_v1 | WRITE | Server-created canonical identity/reservation for a new source or exact previous identity/next version; no pointer replacement yet |
| complete_source_upload_v1 | WRITE | Consume an actual trusted inspection proof for the exact binding/object/profile; atomically publish descriptor/current pointer/receipt |
| abort_source_upload_v1 | WRITE | Fence reservation and prevent completion; retain durable orphan cleanup, not false physical absence |
| grant_source_access_v1 | WRITE | Actual eligible human recipient, exact source version/purpose/rights/consent/expiry under a pinned issuer rule |
| revoke_source_access_v1 | WRITE | Append exact revocation, invalidate handles/current source-dependent authority; do not claim already-read bytes recalled |
| request_source_deletion_v1 | WRITE | Derive lawful eligibility, commit revocation/tombstone/job BEFORE physical work, return original fenced receipt |

All writes retain exact UUID/payload, current authorization before/after waits and cached retry, CAS and commandHash. Malformed positive WRITE replies remain uncertain; failed READ/status remains unavailable. Preserve the finite existing safe error namespace. No caller actor/current/eligibility/inspection-approved fields. Cross-family UUID reuse must not create a second effect.

**Head mapping needs a backend pin:** SourceSnapshot exposes registryRevision/authorityRevision/retentionRevision but no activated SQL heads exist. Recommended minimal first implementation: one scope CAS value, advance all three exposed revisions together for each successful Source write, and bind receipt.revision=expectedRevision+1; this adds no public counter. Alternative: separate clocks with registry actions using registryRevision, consent/grant/revoke using authorityRevision, deletion using retentionRevision plus atomic authority/registry invalidation. The latter avoids unrelated metadata page conflicts but needs an exact per-action table before implementation. Neither is silently inferred by this model. External session/role changes must be checked live regardless of head values.

## 3. Authority and disclosure matrix

**Fixed requirements:** raw storage, service review, source grant, clinical approval/payment, task transmission, internal quality review, training and raw export are independent. D40 gives Kanuj and specifically authorized task context an intended full-goal path; it does not enable current task byte access. Sami has only actual assigned source rights, not blanket access from edit/publish or approval-policy-off. Training is disabled. SourcePolicy also keeps modelTransmission/rawExport disabled and qualityReview unavailable. No automatic model call, recording, recognition or transcription.

Parent62 proves ordinary identity/session/reference guards, not the following raw rights. Every future admission needs active permanent actual principal, owned live session, no ban/deletion fence, lawful selected scope and exact source/version state. Scope, hash/count, retention duration and a handle are never permission. Do not pass upload/read/delete as invented bits to the existing capability function, whose current ordinary fields are view/edit/publish/confirmPayments.

| Principal / operation | Current proven boundary | Proposed bounded pin, NOT a grant | Default before pin/producer |
| --- | --- | --- | --- |
| Owner human, metadata/management | plan_policy.owner_actor_id plus active owner principal and ordinary capabilities, not a name/preparer guess | Owner is initial Source manager; actual scope and purpose/disclosure still checked. Management does not imply raw read | Unavailable/denied |
| Owner human, read own client source | Owner bypasses old per-source REFERENCE permission only | Require current service_review consent and explicit exact-version read grant even for owner; grant is not consent | access_unavailable/consent_required |
| Nonowner human/staff, prep/upload | Current EDIT can author private content; it is not a Source upload right | Actual assigned scope plus explicit service_storage upload grant and valid consent. First new identity needs a scoped reservation-management rule before a version grant can exist | Deny; no Sami blanket access |
| Nonowner human/staff, read | Current reference check also needs can_view+can_edit and per-source reference permission | Separately pin minimum ordinary role intersection and exact service_review read grant. Never derive bytes from VIEW/edit/publish alone | access_unavailable |
| Human delete/revoke/issue grants | No Source manager action exists | Owner-only issuer/revoker initially; an authorized advisor deletion rule must be explicitly pinned. Deletion authority is distinct from permission to read the body | Deny |
| Client | Permanent owner/current session supports existing account/admin; Source15 projection is advisor_private | No direct client raw route in the first stage. Manual actual client confirmation may be recorded by the authorized human. Client self-consent/copy-request requires its own safe C08 admission | No Source15 client dispatch |
| Agent/task/model | Existing finite Plan Task14 and sourceIds restrict references; all new Source task actions are empty | Later finite grant-v2/context/transmission protocol is a separate full-goal obligation. No inheritance from Task14 or human grants | All Source actions DENY |
| Inspector/background cleanup | Existing delivery service RPC discipline is a pattern, not Source authority | Dedicated server-only closed producer/lease identity; derive subject/original actor/session from persisted reservation/job, reauthorize actual state; never a user-selectable service key | No worker/API admitted |
| Anonymous/revoked/deleted/expired | Actual guards reject | Same denial before target existence/CAS/format leakage and after every wait | Deny |

Purpose/right sets remain exactly service_storage->{upload,delete} and service_review->{read}, nonempty/unique. New versions do not inherit old grants. Lawful adoption preserves original identity and requires explicit current scope permission; assigning a draft or owning a payment cannot transfer raw rights. Exact historical versions may be served only under a current lawful exact-version permission; never silently substitute the current version. Until that policy is pinned, unavailable is honest.

**Manual disclosure/consent pin:** recommend separate versioned service_storage and service_review statements, stating purpose, recipients/access, actual retention/manual-delete rule, revocation limits and disabled secondary uses. Record the real statement/evidence/channel and occurrence known/unknown; server derives recorder/time. Unknown occurrence time is not fabricated as recordedAt. A private reference string or policy hash alone is not evidence that the client agreed. Final words/issuer/withdrawal processing require Parent/product approval; this plan does not write or approve consent copy.

Withdrawal must immediately stop affected future reads/uploads and pending private return, even if bytes/hash are unchanged. Storage withdrawal is not automatically a lawful immediate-purge promise, and a withdrawn storage allow must not prevent a separately mandatory authorized purge. Worker deletion uses an actual deletion ground, not a read/upload consent bypass. Retention alone grants no post-service reading right; permitted purpose/window must be explicitly established. Any unresolved legal/obligation state blocks physical purge and irreversible account cascade, without inventing a freeform hold waiver.

## 4. Content profiles and real inspection

Existing global Storage config is10MiB. Existing payment evidence is JPEG/PNG,1..5MiB; its `validatePaymentImage` performs bounded PNG structure/CRC/decompression and vendored JPEG decode,PNG16*1024*1024-pixel/64*1024*1024-decoded-byte bounds and JPEG16MP/128-memory-limit parameters (both width/height<=8192). Check-in photos allow JPEG/PNG/WebP up to5MiB but `validateCheckinPhoto` is explicitly signature/metadata validation, NOT full decoding. These domain-specific profiles and buckets do not authorize new Source formats.

No current raw-source bucket, audio/PDF parser, duration producer or legacy text-unit mapping exists. The SourceFormat enum is not supported-format evidence. A caller MIME, filename extension, hash, Storage row or successful upload is not inspection. Do not reuse payment/check-in object identities as a Source body without a deliberate exact private linkage/consent/inventory path.

| Initial proposed profile | Actual prerequisite / truth | Bounded recommendation requiring pin |
| --- | --- | --- |
| UTF8 note/transcript | Fatal UTF8 decode, exact original bytes/BOM/CRLF/decomposition, SHA256 over actual bytes, scalar count and immutable scalar-to-byte mapping/hash | Enable first only after a real inspector. Candidate initial profile min0/max500000 raw bytes is a NEW engineering proposal, not derived entitlement from the500000 JSON cap. Alternative is keep disabled until a representative larger-text budget is proven |
| JPEG/PNG photo | Actual bounded decoder/structure proof, exact full bytes/hash/size and original immutable version; private rendering only | Reuse the inspected existing pure validator through an explicitly allocated dependency seam, at most the existing5MiB profile after actual Edge memory/bounds proof. Do not import unadmitted child financial/strict patches |
| WebP | Existing check-in signature parser is insufficient for a new full Source inspection claim | Keep unsupported_type/codec_unavailable until an actual approved bounded inspector/profile is pinned |
| PDF | No actual PDF/container/page/extraction/mapping producer | Keep unavailable; no page count or text invented from extension/MIME |
| MP3/MP4-audio/WAV/WebM-audio | No actual container/codec/duration/exact time-to-content proof | Keep unavailable until separately profiled. No128MiB allowance, automatic transcription or library guess |

Recommended staged choice is UTF8 plus existing-decoder JPEG/PNG first, other enum formats unavailable. Alternative is wait for all recording/PDF profiles before any content admission; it has broader immediate coverage but delays a bounded truthful reader. This is an implementation sequence, not a permanent narrowing of the approved recording/transcript/photo goal. Parent must pin exact min/max bytes, codec/container versions, inspector identity/resource limits and source bucket configuration before enabling each format. Actual configured bucket/global minimum remains a hard ceiling. No new public dependency is recommended here, so no package version/install or documentation claim is made; any later dependency proposal needs fresh primary documentation/version verification first.

The proposed256KiB binary quantum and16384-scalar text quantum are transport budgets, NOT object-size entitlements. Keep JSON request500000/response1800000/page400000 below the existing2MiB provider default. Source runtime must not inherit the generic R1 authenticated-port success decoder's Number.MAX_SAFE_INTEGER allowance. A future bounded internal configuration option/specialization must enforce the Source result cap before JSON materialization without changing old family meaning.

**Byte/text routing pin is still missing:** `SourceByteIntent.read` has handleId/offset/length; no representation field. Recommend the server bind representation/unit to the actual verified handle/descriptor: text_utf8 uses scalar offsets/16384 cap and SourceTextChunk JSON; enabled binary originals use byte offsets/262144 cap. The client cannot choose MIME/unit by a new flag. The common builder's larger numeric bound is not text authorization. Alternative: keep every read byte-indexed and introduce a separately reviewed explicit text seam before serving scalar chunks. Do not silently mix interpretations. This transport choice must be pinned before route implementation; PDF/time mappings remain unavailable either way. Existing stored nonwhole locators stay unproven even with a UUID. An actual legacy-unit binding producer, not guessed indexing, is required before any future compatible resolution/conversion.

An actually verified and admitted original may retain unknown page count/duration; only page/time range readiness needs those proofs. Disabling unimplemented formats in the first stage does not invent a requirement that every future original must have decoded text/duration.

Inspection must hash the actual concatenated immutable object bytes in actual part order; a hash of part hashes is not the frozen full-object SHA256. For the initial bounded profiles, use bounded actual buffers/current primitives and verify actual Storage content on collision/retry. A later larger-file streaming hash/decoder is a separate verified dependency/resource decision.

## 5. Persistence and trusted producer seams to pin

Future names below are **proposals**, not schema, SQL, allocated filenames or implementation. Preserve plan_sources as the sole identity/current pointer and its original IDs, numeric versions, nullable client+originDraft lineage and active reference semantics. Private immutable sidecars should cover versions/payload locators/inspection, reservations/parts, purpose consent/grants/revocations, scope heads/request journal, read handles/body coverage, service-lineage binding and cleanup jobs/items/attempt proofs. Use explicit keys/FKs and append-only events; RLS/raw ACL deny for public/anon/authenticated/service roles, fixed least-privilege functions and empty search_path. No exposed raw table or generic RPC.

1. Reserve a server-created canonical ID/version or exact previous-source next version under current scoped authority/CAS; preserve the prior readable version. Part keys are server-bound to reservation/source/version; do not accept bucket/path/URL or overwrite/upsert. Unknown upload response is receiving/unknown until verified, never complete.
2. A trusted inspector reads actual stored bytes, checks size/hash/container/profile/bounds and appends an immutable proof linked to exact reservation/object/version/inspection profile. A direct authenticated complete command cannot manufacture that row.
3. Complete consumes the actual unconsumed matching proof and atomically switches the pointer, immutable descriptor, minimal audit, receipt and required relationships. Recheck original operation/current rights after all client/source/reservation/part/object/inspection/policy waits, before CAS/existence/format exits and final acknowledgement. Old/current versions and financial/publication dates remain unchanged.
4. Abort fences completion first; orphan parts/assembled objects remain in durable inventory until actual cleanup. No abandoned-draft timer is added.

**Actual extra backend plumbing requires Parent pin.** Source15 is the human JSON family, not an already admitted proof producer. Recommend a separately enumerated server-only inspection-result/cleanup-claim/result protocol following the existing fixed delivery RPC discipline, plus a closed authenticated byte-authorizer/resolver. Candidate internal names may be `concierge_source_inspection_result_v1`, `concierge_source_cleanup_claim_v1`, `concierge_source_cleanup_result_v1` and `concierge_source_byte_authorize_v1`; these are NOT added actions or admitted RPCs by this plan. Parent must pin exact inputs/results/allowed caller and deferred linkage before implementation. Derive original actor/client/session/source from persisted reservation/job/handle; no caller actor/time/approved/current/eligibility fields, GUC, function-name or service-role override. Service-only proof submission cannot turn an unauthorized human operation into an authorized one.

Alternative is a private server broker reconstructing only existing Source commands from a Vault-owned handle binding, with no extra human JSON action. It still needs a trusted proof persistence channel and actual canonical payload resolution; it cannot claim that the frozen DTO alone provides those. Prefer explicit small fixed backend seams over a generic broker, subject to Parent review. This is an unresolved implementation-admission decision, not permission to expand Source15 or change its fixed RPC builder.

**Source-aware clinical/old-wrapper gate:** before enabling Source writes, allocate the necessary forward-only changes at actual `plan_content_check`, `plan_read_sources_live`, `review_source_check` and exact review/approval/publisher/final-status paths. New pending/unverified/fenced Source-controlled rows must never enter a current clinical basis through an older metadata-only/reference-owner path. Preserve safe incomplete draft saves and truthful old public reads; completeness of loaded evidence is a review/approval/publication condition, not a mandatory quiz or fake-complete-save rule. A raw-purpose revoke/version/deletion change must invalidate source-dependent authority even if the old reference permission row still exists. Prove direct legacy/current RPC denials and current cached receipt/read checks. Parent must pin this activation/linkage and exact write-set; do not blanket-rewrite old metadata rows or infer bytes for legacy refs.

Deferred constraints/status consistency must prove actual canonical business/version/inspection/job/proof rows, matching subject/actor/scope/hash/revision and exact immutable intent, not merely an effect kind label. Privileged missing/wrong/cross-subject same-kind specimens must roll back; retained contradictory data must fail closed, not be repaired or returned as committed success. Preserve OIDs/owner/ACL/search_path and all untouched bodies/rows in any later forward-only migration. Parent determines migration order against accepted Root, with actual CLI allocation only in a later granted task; do not assume child M66 or import M63-M65.

**Journal retention compatibility:** full completion receipts/intents contain originalName/descriptor metadata. Do not make those permanent raw-name audits or copy raw text into them. Keep minimal actor/UUID/hash/effect tombstones for once-only semantics. If lawful purge makes the old full private receipt unavailable under the frozen mapper, return safe unavailable on status/retry, NEVER absent or a reexecuted/new effect. A more expressive purged historical-receipt projection would require a separately pinned model extension; no fake blank name/redacted success fits the current complete receipt.

## 6. Proxy and every-await authority

Actual sources: server/policy.ts has no Source channel/Operation, gateway.ts has only existing preview/media/client-upload branches, SupabaseProvider.perform has no Source dispatch, and the durable worker handles only current operations. Add nothing until a separate W0/runtime claim and Parent pin.

Proposed public surface remains the fixed Source JSON route plus the existing proposed `/api/advisor/source-bytes` intent descriptor, with no caller URL/bucket/provider token. W0 must pin method/query/header/body representation, exact allowed content types/metadata bounds and same-origin/CSRF validation. The current POST validator expects application/json except explicitly handled client uploads; a new raw Source POST is not automatically accepted. Recommended Source GET also requires the current CSRF header through the controlled fetch path, in addition to authentication/current rights/private response; this is a transport pin, not an existing GET rule. Possession of a handle is not permission. No direct provider signed URL becomes a new Source client route.

Required real sequence for EACH bounded private unit:

- Capture actual audience/owner/providerSessionId, Vault epoch/generation/CSRF/deadlines and original operation/selected scope before awaits. Resolve the handle from server state, not caller-declared scope or actor.
- Validate actual current user/session/profile/principal/selected scope, policy/consent/grant/version/deletion state and requested range in canonical SQL. Preserve exact historical version; do not substitute a newer one.
- Read only the server-bound immutable object/SQL text, bounded by actual profile/selected representation. Validate actual hash/size/inspection/mapping identity, then reauthorize after network/decoder/hash/lock waits and before any private positive.
- Recheck after Vault's own context wait AND the durable worker's final alarm-persistence wait. Discard buffered private body on denial; never return a stale error/body/receipt merely because it was cached earlier.
- Perform final durable epoch/CSRF/status/deadline and source-specific authoritative checks, then create the bounded response without another callback-capable await. Each subsequent chunk repeats the full authority boundary. No unbounded transparent stream or long-lived signed URL bypass.

**Exact missing finalizer location:** `SessionVault.execute` lines119-148 fences after operation and optionally awaits auth.context. `runtime/workers/session-vault/index.ts` lines174-185 then awaits `#schedule()` and performs a session-only fence. There is no operation-specific Source revalidator after that last await. Therefore a check only inside SupabaseProvider.perform is insufficient. Propose an internally installed, closed Source-operation finalizer in that worker after alarm persistence, using the real fixed authoritative Source resolver, followed by the durable fence and immediate return. It is not a caller-supplied current callback or permission boolean. W0 owns its exact type/placement and must preserve all existing session/logout/error paths. SQL still rechecks rights after its own waits; the local Vault fence cannot replace SQL source/consent state.

Bounded responses should be private,no-store/no-cache with no public URL, raw filename/source/body in logs, analytics, notifications, walkthroughs or public plan/export. Clear session-owned buffers on logout/replacement/fence and reject pending results. These controls cannot recall bytes already read/copied or a previously issued legacy signed URL before expiry/actual removal. Do not claim absolute recall or atomic global permission freezing after the last server checkpoint.

## 7. Trusted service lineage and cleanup/account coupling

### Exact supported facts and honest missing states

First canonical publication starts service, not payment, handoff, product Start or upload age. Candidate `plan_review_schedule.first_publication_at` and immutable `publications.published_at` are actual Root facts; bind them to genuine applicable service/entitlement history, not a current draft or a minimum unrelated date. Legacy starts lacking a provable exact instant remain unavailable rather than a synthesized midnight. Never-started requires checking the complete lawful source/adoption lineage, not absence of one row in a selected draft.

Root62 `service_cancellations` is one immutable row per client; canonical cancel_service validates confirmedWithClient and stores kind/supportEndsOn/actor/time, suppressing renewals. It is a real supported cancellation reference, not a general end/correction/renewal journal. `plan_care_window` also falls back to max paid ends and30-day read access; neither is a confirmed raw-source end. Frozen SourceServiceBasis confirmed_end can name ONLY `service_cancellation`; it cannot truthfully name a lapse, new correction record or external historical service basis by pretending it is that cancellation.

**Precise cross-owner request:** W6/Root service owner should provide a trusted resolver returning the existing SourceServiceBasis for exact source scope/target and complete lawful adoption lineage, with private canonical publication/start/cancellation/renewal/correction/obligation refs and a generation/hash. For a single provable supported cancellation, derive confirmed_end only from the genuine record/current lineage; future end stays not due. For unconfirmed start/end return started_end_unconfirmed or the exact service_lineage_unproven/confirmed_end_unavailable; multiple unresolved service bases return multiple_service_bases. No financial M63-M65 dependency is required. General correction/lapse/renewal support needs a separately reviewed service journal and possibly a versioned Source basis extension; do not invent actions/dates or rewrite the unique immutable cancellation.

D39 is already fixed: never-started draft audio/transcripts use explicit authorized advisor manual deletion, NO abandonment timer. Started/actually confirmed ended raw material is due after12 CALENDAR months, with leap/month-end checks. Renewed/corrected end before physical work forces a fresh basis. Each worker claim/result must rederive eligibility using actual server Chicago day after waits; the model fingerprint intentionally excludes mode/day and cannot freeze either. `legalBasis.no_override` is not legal clearance; when the obligation producer is unknown, do NOT return it as no_override. The frozen success union has no unknown-obligation variant: use the finite unavailable error and keep cleanup blocked, or obtain an explicit later model refinement if an inline reason is desired.

### Full inventory and proof, not bucket counts

Inventory must cover every immutable version/object, pending and abandoned parts, assembled orphan objects, raw derivatives/caches, unassigned draft data, legacy inline transcript fields and every lawful adoption relation. Known `meeting_notes(kind=transcript)` is a concrete legacy SQL raw source. Private notes/conversation facts/published clinical history are separate classes; do not erase all history as a substitute for classifying raw copies. Unknown legacy classification blocks a complete physical-absence claim.

Use private durable item->actual locator/version/hash->job/manifest/basis linkage. Public cleanup pages expose only their frozen safe identity/state/proof refs; actual paths and SQL field locators stay private to the producer. Deduplicate physical deletion safely while preserving every immutable inventory relationship; aliases do not justify missing logical members. An actual attempt proof must bind job/item/object/version/expected absence/lease and real observation. Counts, UUIDs or a matching model manifest do not establish physical absence. Failed/unknown removal/verification remains durable retry, not deleted. Do not invent a proof-ID uniqueness policy from the pure model; pin actual batch/item proof relationships explicitly.

Commit the revocation/tombstone/profile-source fence before external delete. Recheck current lineage, consent/access restrictions, deletion ground, obligation and manifest before claim, after waits and before each destructive unit/result. No ordinary client/agent worker endpoint or service-role boolean bypass. Persist attempts/uncertainty and actual absence verification; worker crash between remove and acknowledgement must retry the same identity and verify absence. Preserve minimal IDs/version/hash/tombstone without permanent raw body/name audit. Hash-based model verification remains a local composition check, not the physical producer.

**Post-fence correction:** stop stale physical work immediately on changed end/renewal/basis. Keep fenced content unavailable while an actual reconciliation decides next steps. Existing Source15 has no un-delete/unfence command; do not silently restore through grant/retry. If all bytes remain, a later deliberate recovery protocol needs a separate pin. Already absent bytes cannot be restored by metadata. This is an engineering recovery dependency, not a freeform deadline waiver.

### C08, withdrawal and account cascade

`delete-customer-account/index.ts` calls begin_customer_account_deletion BEFORE inventory, checks customer-skin-photos/customer-product-evidence plus metadata, verifies absence, calls concierge cleanup, then Auth admin.deleteUser. Concierge cleanup covers ONLY payment-evidence/checkin-photo buckets and owner prefixes. Its10000-entry refusal is an honest existing failure bound, not proof of complete future Source inventory. Do not merely add a bucket name or assume creator Auth UUID equals client/draft ownership.

Before ANY Source upload admission, account/draft deletion must include the Source fence/inventory/worker dependency; otherwise existing Auth/draft cascades can remove the only metadata while raw objects survive. Durable jobs/minimal tombstones must survive the relevant identity cascade, without retaining raw body. Deleting a staff creator must not delete another client's source; deleting one adopted scope must not silently wipe another lawful binding. Unassigned drafts/all versions/inline copies must be resolved. Unknown obligation/source cleanup must prevent Auth cascade and return truthful pending/failure, never deleted:true. Do not clear the committed deletion fence on a failed attempt.

W6 owns C08/C08C/C08R and safe account/consent/copy-request status. Separate actual source withdrawal, account deletion, final client-safe plan export, unfinished billing/return/refund administration and raw-copy requests. A request for a copy is not permission for raw export, and SourcePolicy.rawExport remains disabled. Withdrawal stops affected current access immediately; physical disposition follows the actual approved ground/retention/obligation producer. Do not enable old clinical writes to keep administration reachable, or implement an unfinished financial adapter from this child stack. Until those dependencies are provable, report unavailable and block only the irreversible operation, not fabricate account success or financial clearance.

## 8. Exact W2 reader seam and ownership

Actual Parent19 W2 exports `GuidanceDependencyRequest` with `private_source_reader` unavailable. `guidanceEvidence` blocks nonzero basis.sourceManifest.count AND actual contributing conversation source locators even when count0. It also blocks changed unseen opaque legacy basis. EvidenceInput has history/reported/instruction completeness, NOT an actual Source reader. `createAdvisorGuidanceContext` composes existing fixed policy/draft/publication/capability reads and captures owner/session/selection; do not replace it with a fake Source context or new generic gate.

R6 also retains original G5 schedule4 as a qualified failure and the separate server-generation dependency as0/1; f163/session/App adoption is not supplied by this plan. Source readiness cannot conceal that cross-owner dependency or turn source/SSR PASS into mounted/current-session proof. Parent session/App ownership remains responsible before consumer admission.

A future W2 adapter must request exact `{scope, sourceId, numeric sourceVersion, SourceLocation/SourceSelection}` under its actual ApplicationSession/operation lease, then consume the awaited frozen SourceDetail, actual full selected body/metadata/provenance and complete pages. It must bind descriptor hash, source version, original/adoption relation, actual supported offset convention/mapping and current rights. Display actual unavailable/missing content and block clinical acknowledgement; hash/count or a handle is not a loaded record. No checkbox can bless an unseen raw source or unknown legacy range.

Old stored nonwhole coordinates cannot become explicit scalar/page/time merely because a current descriptor exists or a binding UUID is supplied. Only an actual immutable locator-binding/extraction producer can establish the old coordinate semantics. Current model deliberately keeps stored ranges unavailable; any future resolver/compatible model refinement is a separate pin. Fresh explicit selection uses the verified descriptor's actual convention; it must not retroactively relabel old references.

For up to100000 actual contributing tuples, derive the COMPLETE exact relation from immutable inputs/history/amendment heads, deduplicate version/body work without dropping locator relationships, and use bounded metadata/detail/body pages. No first100 cutoff or N full bodies per response. Human review requires all relevant loaded evidence and deliberate exact review; a server read-attempt record is not proof of human comprehension. To prevent direct blind source-bearing clinical commands, Parent must pin an internal exact human/session/basis/locator coverage linkage at existing review/approve/publish paths, with live source grants checked again. Do not add a caller reviewedAll:true or treat the public clinical manifest as the private source manifest.

| Future owner | Exact candidate paths / boundary | Admission dependency |
| --- | --- | --- |
| W1 sole Root writer | Frozen `src/contracts/PortalSource*`; NEW `supabase/functions/concierge-sources/{handler,runtime,index,inspection,storage,source-authority}.ts`, private lifecycle/producer modules and Source-focused tests | Names/write-set proposed only. Any shared authenticated-port change, private proof RPC and canonical forward migration needs exact Parent allocation |
| W0 sole transport/auth writer | `session-integration/runtime/server/{policy,gateway,upstream,protocol,types,session-vault}.ts`, actual `workers/session-vault/index.ts`; NEW source-policy/transport metadata and creation-bound `src/app/advisor-source-request.ts` | Current channel union/routes have no Source. Server-only finalizer/byte protocol and credentials remain internal; no Source grants from generic capabilities |
| W2 source/evidence owner | `features/advisor/guidance/{types,evidence,controller,...}.ts` and a bounded new Source reader/view adapter | Replace typed unavailable ONLY after real ports/producer/current proofs; retain G1-G8 ownership/read/error/uncertain-intent fences and complete private history |
| W6 account/service owner | C08 safe account/consent/withdrawal/deletion progress and trusted service-lineage/obligation adapter request | No duplicated finance, client raw route or fake end/consent; supported unavailable outcomes until separately pinned |
| Parent sole App/integration owner | `src/app/Application.tsx`, ports/navigation/module mount and native-source inventory/custody | Guidance/Source are unmounted. Do not infer mount from this plan, source SSR or model PASS |
| New independent reviewer | Source/runtime/backend/Storage/consumer composition in its separately allocated environment | Fresh task with original/R1-R5/responses, exact artifacts and no candidate-side successful ports |

Actual file prefix for frontend rows is `apps/portal/`; runtime rows are under `apps/portal/session-integration/runtime/`. No current file ownership is transferred by this proposed split.

## 9. Reviewable implementation stages after a separate grant

Each stage has one writer, a meaningful RED/GREEN gate and a small coherent commit. Disjoint source-only preparation may proceed in separately granted worktrees; migration ordering, shared contracts, auth/runtime and Root App never have concurrent writers. No endpoint should finish as a dummy success port.

### Stage A: admission pins and Root custody, Parent only

- [ ] Pin the decisions in section10, exact Source actions/audiences/head mapping, profiles/disclosure and trusted internal producer/byte/finalizer surfaces. Leave missing cells unavailable.
- [ ] Parent audits and backs up ONLY its selected R9 under the current lifecycle, proves the recorded source/data/session/helper custody, then stops it before ANY Source Root import. Do not query/reset/adopt old child/reviewer/parent fixtures by this plan.
- [ ] Select the actual accepted Root base and single migration writer/order. Source does not depend on unadmitted child65; no SQL filename is reserved here.
- [ ] Import only the reviewed frozen Source model and explicitly admitted dependencies into a fresh Source target after custody is closed; produce a NEW native inventory, never patch native87 in place.

**Gate:** exact byte/manifests/ownership/stop receipt and approved source policy/protocol record. If not met, no platform work.

### Stage B: identity, rights, registry and durable fence kernel, W1

Proposed files: new concierge-sources handler/runtime/private authority modules; Source canonical tests; one later allocated forward migration and response report. Consume existing model/common authenticated transport; produce real fixed Source15 guards/reads/request journal, immutable version/adoption links and fences. Existing raw object read/upload stays unavailable until Stage C.

- [ ] Write direct authenticated parser->handler->fixed RPC REDs for client/agent/unassigned/wrong-scope/version/owner-reference-only/consent/grant/expiry/deletion/extra-field cases, exact UUID/CAS/retry/status and complete pages.
- [ ] Implement actual current principal/session/profile/rights and all-after-wait guards, private rows/ACL/RLS, stable heads/cursors and canonical identities. Exercise real row/advisory waits, natural expiry, revocation and cached/status exits without forcing guards/clocks.
- [ ] Prove every retained old table column/row/ID/date, function OID/owner/ACL/search_path/attribute and untouched body exact; rollback wrong/missing business linkage and cross-family request reuse. New helper raw EXEC denied.
- [ ] Independently review the kernel and commit its exact source/migration/limitations before content admission.

### Stage C: trusted inspection, reservation/parts and verified completion, W1

Consume pinned profiles/private proof protocol; produce actual stored immutable bytes and bounded inspection proof, not metadata success.

- [ ] RED with missing object, wrong bytes/hash/order/size/MIME/container/bounds, forged direct complete, duplicate/cross-subject proof, collisions, lost responses, aborted/incomplete/orphan parts and late rights loss.
- [ ] Implement no-upsert storage, actual bounded inspector/proof production, atomic completion/pointer switch and exact historical retry. Keep old readable version until that verified commit.
- [ ] Prove UTF8/BOM/CRLF/scalars and image malformed/decompression/memory maxima, actual object/profile limits and inspection-to-reservation linkage. Unsupported formats stay finite unavailable.
- [ ] Test cleanup/account fence dependency BEFORE enabling the first Source write; independently review source/SQL/Storage paths. No claimed uploaded from an optimistic receipt or successful stub.

### Stage D: complete cleanup/service/account dependency, W1 with W6/Parent

Consume trusted lineage/obligation/classification and private worker protocol; produce real complete physical inventory/absence and safe account coupling.

- [ ] RED for forgotten draft/version/part/derivative/inline copy/adoption, duplicate/missing manifests, false proof, unknown removal, worker crash, renewal/end correction after fence, unknown obligation and premature Auth cascade.
- [ ] Implement fence-first actual worker, current rechecks at each destructive unit, durable retry/proof linkage, complete paged inventory and account/draft cascade dependency. Do not silently un-delete after a correction.
- [ ] Prove no abandonment timer; actual confirmed END+12 calendar including leap/century; manual never-started authorized deletion; unchanged public/finance/history facts and no permanent raw-body/name audits.
- [ ] Independently review destruction/retry/legacy preservation with an explicit isolated cleanup-resource grant. Unknown adapters remain unavailable; no financial acceptance is inferred.

Stage D's essential fence/account dependency precedes Stage C write admission; its broader due-worker proof can be independently prepared, but an uploaded object cannot be admitted into a lifecycle with no safe deletion path.

### Stage E: actual cookie byte/text proxy and finalizer, W0 with W1

Consume real canonical guards/inspection/object/handle and pinned byte units; produce fixed authenticated bounded responses.

- [ ] RED at every real await: decode/hash/Storage/SQL wait, Vault auth-context, alarm scheduling and final egress; revoke/logout/delete/policy/source-version/session expiry must deny without target/body leakage. Test no cookie/CSRF/wrong audience/owner and injection of URL/RPC/path/actor/current overrides.
- [ ] Implement fixed Source channel/byte operation, bounded decode before materialization, actual operation-specific final authoritative validator after the LAST wait, and final durable fence. Retain old family transports and error semantics.
- [ ] Reproduce S1-S10 raw/adapted cases through actual handlers; prove full max metadata/body pages and complete manifests, retry uncertainty/status READ, no source in errors/logs/public outputs and no direct signed URL leak.
- [ ] Independently review the actual gateway/Vault/native composition. Existing successful media/session tests are regressions, not Source admission.

### Stage F: W2 reader and C08/Root mount, W2/W6/Parent

- [ ] RED actual source-bearing and unknown-legacy evidence: no bytes/partial pages/current loss must block deliberate review/approval; complete exact actual source may proceed under fresh rights. No fabricated source context/domain success.
- [ ] Build creation-bound Source ports and actual private views with real body/descriptor/provenance; preserve selection/session/read-generation and uncertain original-intent ownership through success/error/finally/reentrancy and logout.
- [ ] Parent separately composes App/navigation/Back and C08 safe status. Verify actual ordinary React reachability, mounted error/recovery, keyboard/privacy and source/body loaded-before-ack, not only SSR or component source.
- [ ] Obtain NEW independent composed review and separately issued genuine/physical/human/browser grants. Full launch/CI/release gates remain open until their own actual proofs.

## 10. Concrete remaining pins, with bounded recommendations

These are reviewable choices, not user-facing questions or new approvals. D39, no fake source/consent, optional photos/forms, source/private separation, no automatic recording/transcription/training and exact retry are already fixed and are NOT reopened.

| Pin needed | Recommended bounded option | Other concrete option / tradeoff |
| --- | --- | --- |
| Initial human management/issuance and ordinary-role intersection | Owner-only management/issuer initially, explicit self/version/purpose consent+grant for raw read, scoped staff rights only when separately pinned; no new generic cap bits | Admit named active human EDIT+explicit-source-grant prep/read/delete subsets together. More useful staff operation, larger authority matrix to prove; never blanket Sami access |
| Disclosure and client path | Manual actual purpose-specific confirmation recorded by authorized human, with truthful occurrence and withdrawal handling; no direct client Source15 dispatch yet | Add a separately reviewed C08 self-consent/copy-request projection/issuer path. Better client autonomy but requires actual UI/auth/safe-field admission, not a clientId selector |
| First formats/numeric profiles | UTF8 plus existing-decoder JPEG/PNG, exact limits approved before enable (candidate500000 raw UTF8/5MiB images), unsupported others explicit | Wait for representative audio/PDF/WebP inspectors and all profile limits first. Broader first release but blocks the smallest truthful reader longer. Neither option admits unverified codecs or128MiB |
| CAS clocks | One scope CAS mirrored across the three frozen revision fields, all writes expected+1 | Exact per-action registry/authority/retention clocks. Less unrelated conflict but needs coordinated per-action fences/page semantics |
| Byte units and backend producer surfaces | Handle-bound verified representation/unit plus small fixed authenticated byte and server-only inspection/cleanup seams, exact admission review | Byte-only transport plus a separately versioned text seam/private broker. Avoids implicit unit switching but requires an explicit additional contract before scalar W2 reads. Neither is already admitted |
| Service/obligation and post-fence recovery | Supported Root cancellation-only resolver; all unprovable lineage/obligation states unavailable, no Auth cascade/purge; later explicit recovery pin | First implement the cross-owner confirmed-end/correction/renewal/obligation journal and any necessary Source model extension. More coverage, more cross-owner dependencies; no fake cancellation or deadline waiver |
| Receipt/journal raw metadata after purge | Keep minimal once-only hash/IDs, return unavailable when the old full private receipt is no longer lawfully retained | Pin a later safe historical tombstone receipt variant. Better long-term status UX but changes the frozen model and requires independent review |

Before implementation Parent should select/modify these concrete pins in a durable record, allocate exact write-sets and trusted producer privileges, and issue the separate phase/resource grant. Until then unsupported profiles, current rights, legacy units, service bases and obligation states remain unavailable.

## 11. Verification and resource preconditions

No runtime test, compiler, SQL, Storage, Auth, proxy, consent or cleanup execution occurred in THIS task. Prior source test/review counts are attributed evidence only. Future gates must include actual parser->handler->mapper->SQL composition, ordinary and privileged consistency faults, direct old-wrapper bypass/format preservation, late rights/expiry waits, once-only/deferred rollback/concurrency, stable full pages and every S1-S10 regression. A successful mock Storage/provider/permission/current/consent port cannot establish physical or authority success.

Retain raw17=16/17 and raw40=39/40 unsafe job-only exceptions, raw11=9/11 late-observer+pinned valid-start exception, same-original-pending scheduling-only10/11/all17 assertion texts unchanged, adapted returned-model11/11. R5's185 and separate16 overlap; no201-run or uniqueness claim. Do not weaken those original predicates or erase failed setups. The Source model's complete inventory digest verification is not actual absence proof.

**Resource prerequisites, NOT grants:** Parent selects the accepted Source head/config/migration/native membership and exact owner/purpose/workspace; closes selected R9 custody with audit/backup/stop before imports; issues a fresh isolated canonical/local environment and new auth/storage/byte/cleanup/browser purposes separately. No inheritance of old Root/reviewer/own PG, policies, sessions, CA, keys or Source fixture grants. Own65 is not canonical62. Actual migration count/order, reset/pgTAP/security, least privilege, real Auth/PostgREST/Edge/Storage, Vault/cookie/CSRF/logout/revocation, physical body/absence and mounted consumer evidence must be freshly verified on that selected closure. Hosted/CI/release/legal/human acceptance remains distinct. This report does not allocate a SQL filename, schedule deletion or reserve a resource.

## 12. Source/provenance ledger and this task's checks

Static source reference convention: Parent entries below are exact `19c3ea1f:path`, model entries exactd0f; complete copies/blobs/bytes/SHA256 are in own ignored `.local-artifacts/portal-rebuild/w1-source-readiness-plan/sources.json`. These are text/Git reads only, not imported/executed code or live deployment claims.

| Source anchor | SHA256 |
| --- | --- |
| Parent model-freeze report |cb48cee58d2720afe3d3c43e825d7a44c55c62bb681d6071ea95b5389eac3b77|
| M54 `20261030223603_portal_rebuild_plan_v1.sql` (registry17-21, guards70-149, care224-238, delivery814-819) |497d85ef3bd81b7085d112be8c751bbeac8925ce5472ad94bdbc520174aa768c|
| M55 `20261031003846_portal_rebuild_advisor_reads_v1.sql` (human/source43-64) |9953297d1243ba8c004b8972ff6205ea2536653817e177b26dc4b9407aed4335|
| M62 `20261031172109_portal_rebuild_source_locator_canonical_numbers_v1.sql` |bd3f54ea2f4bf82912428805b9da0e37f315f0131a9095d00dd1e2163c203861|
| `20261025221028_concierge_service_workflows.sql` (cancellation row13, command151-159) |5ebb75645abb8e1002a5a3c7bbc64e53b4bfe7e325a2dd63819ebd6d82671eec|
| `20260928000000_p0c_account_deletion_upload_fence.sql` |0b825b66f2ec9764e089d1cd4797b9d9c00f978b7a8c5961b7914a56804d1a6f|
| server/session-vault.ts |8a04ec017e9eddc3cc61a89d0f27342816fe70d74e1db0ffe5091ca380b4e243|
| workers/session-vault/index.ts |84a3f8361e75e964f1fa0a8183e6e2a6aabe3362927f96f33509a056dd346c4a|
| server/policy.ts / upstream.ts |6b6e6cf456b55e7624777fb65c8185f09a10db0d15f0c133b2be6b4b0b845dfc / 8e7d59ee0bfea50bc3c413b836a33b6b5ce5a288fb4ae9a125ed4794e6e8afba|
| server/gateway.ts |6c5677ae13740647593d926d5b270ad2928e0b2424d2d97b69c1e268a4d43ebe|
| concierge-payments/image.ts / concierge-checkins/photos.ts |7023a95b0105bcee20271209cc4bfc4e82bda0175058f8922f8a5c8c515bbf34 / 7b27a1b64592fbd66f18621eba902340624d83763b95e107aabec0ee39311f67|
| delete-customer-account/index.ts / concierge-operations/private-storage-cleanup.ts |a88f4365cde235a6621194fa5fe3e67eadce0fd6138e54aa118254ef93b6044d / 1c49ac9d4303a49a5d89d014f29a8acfb0d549494d8f0f1650afa828a2fe8e6e|
| W2 guidance/types.ts / evidence.ts |242e4faacfa576145b6569122ea24308edcc7fe4c52b68fe0977467bad5918de / 1bcf16bd5ddd5990df877ff74da1835bdc30c932f1b59b83045dc76168099311|
| app/advisor-guidance-context.ts |055b051f8f3d6fee0ad01c2dc9d6d526c796fc7ea0343789f8def3bb263aeaa5|
| d0f Source.ts / Values.ts |ae62f9d505453e6e7b3f5bbced1607d2eb73c155501591dabac91086008268e1 / fa24681a9221438c469e743f04ef26c4fd064e18fe90acb09bd3d29252a2ff8b|
| d0f SourceValidation.ts / Mapping.ts |9f0b02f9fff37f13f8c71e352f064f57f1a493d3c5fd3e793cd23bdb7e11610b / 3b789dc3bfb8b32316861c077ff97c7e5bb94d1d46e0b54a8a4809d53a335836|

Exact W6 `367662632ec6929b60e9eb53169b263849b94f4a`:51056 bytes/SHA256 b220c949d4233182542da3a463df4516ffcccfdaa4b449b6fa1888e28301a9a0. Exact W2 target299929f34a440e9087dc52b67eadf1e348c5d88a and independentR6 `10569f36` were read, together with Parent-integrated85fc source/types/evidence/context/dependency exports. No foreign generated output was executed. Source R1-R5 reports and complete author response were read/hash-bound, including all raw qualifications; R5's supplied file equals exact014bc007 Git report. Original95388 bytes/A/B/C and all five provenance originals/addendum are preserved.

Writing-plans, Supabase and Workers skills guided the staged/source/security checklist. Their generic implementation/CLI/resource/delegation defaults do not override this report-only allocation. No platform feature/dependency version is recommended from memory or verified by a live service; before a future new dependency or platform API change, retrieve current primary docs/version and actual config under that allocation. No additional plan file or execution-choice question is created.

Actual checks in this task: clean base/branch/Git-object and file equality; full static file/text/hash reads; parsed TASKS/status/provenance/project/default/eight pins; documentation scope/links/placeholder/API/action-count consistency and `git diff --check`. Explicit Node binary only ran --version, returning22.23.0. No source suite/compiler or service test was run. Initial static lookup guessed nonexistent checkins/runtime.ts and runtime/worker.ts, and one source-ledger display hit StopIteration on that missing worker path; actual checkins/index.ts and runtime/workers/session-vault/index.ts were then located/read/copied without changing any source. Broad combined output truncations were followed by narrower relevant ranges/full-byte read ledgers. These are read/setup qualifications, not implementation failures or test results.

BOTH initial/final LIVE tools establish codex/gpt-6.1-sol/xhigh/default, full-access/default, supported effort low/medium/high/xhigh/max/ultra and tier default/priority. Actual project default isnull; local project/default-subagent/global/eight role pins/max8 are individually verified, not inferred from that null. No settings change, fallback or nested task. Initial project read supplied Git identity and final repositoryIdentity isnull; project ID/root/null default remain stable and actual Git/source pins are independently verified. No settings are forced from that control-plane variation. Final report-only commit/hash/clean receipt is returned separately to avoid self-reference. All existing tracked files, four model modules/tests/SDK,65 child SQL, M65 source/report and905 evidence files remain byte-exact; Parent19 is compared through read-only Git text only. No Parent/R9/foreign resource, credential, Auth, Storage, CLI, SQL, browser, preview, process inventory, native fixture or financial review call occurred. No live source/client/permission/message/funds/retailer action, push/PR/merge/deploy or acceptance follows. Parent decides concrete pins and any separate phase after this terminal report; there is no resource wait or implementation continuation.
