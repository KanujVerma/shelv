# W1 template contracts and source intake

Owner: Kanuj. SOURCE/format only. This is not an installed template producer, Auth/SQL/RLS result, client permission, source/storage capability, migration allocation, browser acceptance or action activation. Principal44 and Guidance/M65/photo/private-return/final-egress holds remain untouched.

## Intent and owned implementation plan

Reusable structured templates require immutable version preview, explicit version selection and exact retry/status semantics. The old care-draft operation already carries templateVersionId and must remain the single original operation. W0 approved the separate five-action human management family, private journal strategy, catalog/version list scopes, version hash domain and tombstone refusal. W2 consumes that model; W0 owns registration, migration ordering and shared composition; W7 independently reviews exact frozen candidates.

The bounded plan is to add PortalPlanTemplate.ts for closed DTOs, Values for new-family bounds/transport classification, Validation for positive strict JSON/content/result correlation, Mapping for one fixed RPC, one new allocated-prefix test and this report. No existing contract, old action metadata, gateway, auth, UI, SDK, migration or feature is changed. Write the new-export tests first, preserve the failed missing-API gate, implement the four modules, run focused and existing Plan/agent compatibility plus configured checks, then freeze the exact six-file delta for a new W7 source review. Hosted CI and W0 serial integration follow independent review; actual backend/SQL/journey gates remain separate required work.

## Exact new declarations

`buildPlanTemplateRpc(input)` returns only concierge_plan_template_command_v1 with p_command. SchemaVersion1 has exactly five actions:

- list_plan_templates_v1: scope catalog, or versions with an actual templateId; opaque nullable cursor and limit1..100.
- read_plan_template_version_v1: one actual immutable templateVersionId.
- create_plan_template_v1: exact requestId/name/generic PlanContent.
- save_plan_template_version_v1: exact requestId/templateId/expectedVersion/name/content. ExpectedVersion is1..MAX_SAFE_INTEGER-1; acknowledgement binds the next immutable version.
- plan_template_request_status_v1: actor-own original request UUID. An actual absent result or full original write command plus exact historical receipt; no current/latest-head or write-authority claim.

Template list metadata includes actual template/version identities, versionHash/name/server actor/time. Catalog is latest metadata at its observation; version scope pages explicit immutable versions. The server uses templateId ascending for catalog and version descending within one template. Opaque scope-bound cursors are at most512 UTF8 bytes. Pages state live_keyset and actual observedAt, with no total/count/immutable-snapshot promise. The client validates scope, order, uniqueness, time/cardinality and progress; only the real producer can establish actual latest membership or cursor binding.

Version reads and receipts include complete validated content. Create acknowledgements bind version1; append acknowledgements bind the same template and expectedVersion+1. Both bind request/action/name/content exactly. Status validates the original through the same closed write parser and correlates it to the full receipt and requested UUID. A historical receipt remains historical when the head moves.

New-family caps only: command500000 bytes, full response1800000, metadata list100000, page100, cursor512, name200 Unicode scalars, auth8192 and operation10000ms. No old channel ceiling or traversal changes. The new-family JSON snapshot rejects getters without evaluating them, non-JSON values/classes/cycles/sparse or decorated arrays, unsafe numbers, NUL/lone surrogates and oversized/deep input; outputs are detached/frozen. Its linear node bound derives from that family's byte cap so a valid full original+receipt is not accidentally refused by another family's lower traversal ceiling. This is finite JSON handling, not an opaque/native identity claim.

## Generic content and authority

Use the actual existing PlanContent schema and relational reference checks, including public URL restrictions and incomplete saving. Reusable content requires unknown current-product context, no provenance facts/Source locations, consultation sections or preparation attribution/date, and no fact references. Product identity remains unresolved; decisions cannot carry a client's current-product list or old recommendation binding. Reject these structures instead of stripping them. Generic products, goals, instructions, schedules, public citations and cosmetic guidance remain representable. Arbitrary human prose cannot be proved private-data-free by a shape validator; legitimate authoring/review remains necessary.

Transport metadata permits human READ for list/read/status and human WRITE for create/append; client/task principals deny the entire new management family. This does not authenticate a human or grant VIEW/EDIT. The future producer must enforce actual permanent human VIEW for read/status and actual current EDIT for writes, with post-wait/final session/profile/principal/capability checks. No owner-role revocation bypass. Agents instantiate only through their same original scoped create_draft_v1(templateVersionId), full original fingerprint/grant/locks; no create-null/save fallback or task allowlist expansion.

## Stable storage/predecessor proposal, not SQL

W0 selected NEW private plan_template_requests_v1, not workflow_requests with a fake client and not old plan_requests/status with unrepresentable new receipts. Stable head plus append-only version rows, exact original command/fingerprint/receipt and minimal retained collision tombstones are required. Same UUID with a tombstone refuses unavailable; never absent/recreate/duplicate success. Purge/cascade/retention must preserve collision custody without inventing authority to retain private material. No table, trigger or permission is authored here.

Version hash basis is the exact closed object {schemaVersion,templateId,templateVersionId,version,name,content}, encoded as PostgreSQL JSONB::text, under the domain plan_template_version_v1. The prospective byte preimage is UTF8(domain + ':' + JSONB::text), SHA256. The DTO validates only hash format, not its actual production. Hashes are not approval, permission or client facts.

Supplemental collision checks must cover every actual supported existing family and future explicit plan_template_requests_v1 <-> commerce_requests in both insertion orders/concurrency/purge/cascades/tombstones under the SAME actor/request mutex. Preserve the exact current7/anticipatedSource9 helper body/OID/ACL/search_path/bindings and retained service69 predecessor expectations. Source presence, table state and race correctness are not established by this DTO.

The original plan core hook must start at wire-budget successor e1309a1f3e1fad3a952fe6a0786956d6237b2446bb37a5105ba03dbd42d29aa6, not original54 body4be414067afedcf3456ae79523c69aaef25a964bddba0f9544836d3fff7552fa. Preserve its complete original command/fingerprint, dispatcher chain, guards and post-wait checks. A future exact-preimage change may replace only template refusal/empty-content selection, setting actual immutable template origin/content without copying reviews/approvals/consent/client/source rights/basis/clocks/outbox. Template versions are immutable; do not add a late mutable-head lock to that original create path. Actual catalog/body/attributes proof remains unrun.

Migration ordering stays service143000 then resolver194339 before any later W0 actual-CLI allocation. Old68 bytes, service69 expectations, old list_plans_v1 and all existing receipts remain unchanged. No new migration timestamp, SQL file, dispatch or grant is created.

## Mapping

D14/D16/D17/D18 directly cover reusable/incomplete structured content; D15/D19/D20/D21/D22 remain preserved surrounding review/agent/provenance/publication boundaries, not newly accepted capabilities. D44 ownership and D48 recovery apply. Consumer frames are A01 plans(500:299) and A02 plan editor(500:383); A03 source/agent handling is only a preserved boundary. This DTO does not mount or accept a frame/journey.

## Evidence and remaining gates

Actual runtime was gpt-6.1-sol/xhigh/default, no nested agents. Node22.23.0. Raw evidence is own ignored .local-artifacts/w1-templates. Initial28 new-export controls fail28/28, exit1 (exports-red.log): a missing new API, not a historical product defect. Initial implementation passes28/28 (current28.log). Two added controls produce29/30 when the large fixture incorrectly uses50 guide steps; the canonical existing maximum is12. That fixture/setup failure is retained in current30.log. Correcting only the fixture to23 guides/12 steps yields30/30, zero skips/cancels (current30-fixture-corrected.log), including a valid accepted command whose complete replay exceeds100000 JSON nodes without truncation. The original42 Plan/domain/advisor-read/agent cases pass42/42 unchanged (legacy-plan-agent.log).

The first root app typecheck reports one descriptor-map inference error (root-app-types.log); an explicit Record<string,PropertyDescriptor> fixes that annotation, with runtime semantics unchanged. The corrected app graph exits0 (root-app-types-corrected.log); the configured test graph exits0 (root-test-types.log). The full root suite exits0 with1867 passes,0 failures/cancels and18 existing native opt-in skips across213 TAP summaries (root-suite.log); skips are not claimed passed or executed. EXPO_NO_TELEMETRY=1 web export exits0 (web-export.log). The final30 focused cases pass again,0 skips/cancels (final30.log), and the final configured test graph exits0 (root-test-types-final.log). Exact code/test SHA256 postimages remained stable during the broader checks (final-code-before.json). No native/Auth/SQL test flags were enabled.

Unrun: actual template/storage/journal/CAS/replay transactions, Auth/RLS/VIEW-without-EDIT/agent/client/current-revocation denials, cross-family collisions/tombstones/waits, old-action SQL parity, current catalog/ACL/upgrade/no-effects, original agent instantiation, browser/Figma and genuine integrated template/publication journeys. Backend dispatch and SQL activation are absent. These remain required milestones; format tests and source integration cannot replace them.
