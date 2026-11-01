# W1 static final export: source implementation

Owner: Kanuj. This is the bounded C08/C08C/C08R producer slice under the [1 November approval](../DECISION_ADDENDA.md#static-final-export-after-the-read-only-window-1-november-2026). The full approved rebuild and Account remain unfinished.

## Identity and scope

- Fresh own T3 worktree `/Users/kanuj/.t3/worktrees/shelv/t3-b08e21c9`, branch `t3/static-final-export-source`, base `7812766b601c41f358bdc23104f33f5e81a2aa17`, containing the decision `2fda18ec`.
- Exact taskId: `node:delegated-task:command%3Amcp%3Add730894-0fab-4a94-873d-743422eae122%3Adelegate-task%3Aportal-rebuild-w1-final-export-source-20261101-r1`.
- Distinct childThreadId: `thread:delegated-task:command%3Amcp%3Add730894-0fab-4a94-873d-743422eae122%3Adelegate-task%3Aportal-rebuild-w1-final-export-source-20261101-r1`.
- Distinct runId: `run:thread:thread%3Adelegated-task%3Acommand%253Amcp%253Add730894-0fab-4a94-873d-743422eae122%253Adelegate-task%253Aportal-rebuild-w1-final-export-source-20261101-r1:ordinal:1`; ordinal `1`.
- Parent `d632030a-18f7-4dec-a2c9-f5c0418c3fd5`. LIVE capabilities, self and Parent configurations all returned `codex / gpt-6.1-sol / reasoningEffort=xhigh / serviceTier=default`, default interaction. Advertised Sol descriptors support those exact values. Project default is null; the explicit thread selections and all eight project role pins are Sol/xhigh, configured maximum8. Initial live project inventory: five active threads including Parent; no nesting/delegation.
- Initial Node `v22.23.0`. Own root/portal dependencies are absent. Parent authorized only its real TypeScript6.0.3 compiler/libs, Node22.20.3 declarations and undici-types6.21.0 as read-only compiler inputs. No installation, shim, copied Auth, package/lock or symlink edit.
- Installed Supabase CLI `2.121.0` help/version and exactly one `migration new portal_rebuild_final_export_v1` allocated `supabase/migrations/20261101173223_portal_rebuild_final_export_v1.sql`. Parent pinned the filename before SQL authoring. Empty receipt: zero bytes, SHA256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`. No second allocation or SQL/DB/fixture call.

Owned writes are only the four NEW PortalFinalExport contracts, NEW `concierge-final-export/` subtree, named final-export tests/helpers, the allocated migration, NEW pgTAP file and this report. Coordinator retains all shared transport, App, auth, roles, integration and documentation composition. W6 consent, W2 policy and W0 report ownership are unchanged. Old62 canonical migrations, all113 SQL inputs and every1968 baseline tracked path/mode are protected. Native87 and inspector/current candidate88 remain source provenance, not an acquired runtime. R9 stays stopped and unadopted.

Read prerequisites: actual root/portal AGENTS, README, full original, D01-D48, full desktop spec, both manifests, implementation contracts, workstreams, current status, addenda, acceptance matrix, all26-screen connectivity audit; relevant retained service/publication/presentation/Care/Review SQL, Root codecs, legacy exporter, original and current server transport. The actual original is95,388 bytes SHA256 `c45701f9f54fd2b1dbb09bbd7aa2b9b437e9059aa6032b6f39411fe2e7f6efbd`. All five INPUT_PROVENANCE files were checked against actual bytes; full decision/spec appendices match the original. Official [Supabase changelog](https://supabase.com/changelog) and [database function guidance](https://supabase.com/docs/guides/database/functions) were read. Empty search paths and explicit function execution ACLs follow the latter; this is not SQL execution evidence.

## Reconciliation and separate producer

Existing `plan_care_window` uses exclusive Chicago dates: paid period end, shortened by confirmed cancellation, followed by30 calendar days. `plan_care_access` denies expired care. Existing `read_client_plan_v3`, instruction manifest/detail and `review_snapshot_current` use live heads/current-day state; they cannot be repurposed into a static final record with a supplied old date. No old view, clock, actor, access flag, body, OID or ACL is changed.

The separate producer derives the final support end from actual started service periods and, when present, confirmed `service_cancellations.supportEndsOn`. Unknown/pending periods return unavailable. A future boundary returns `service_not_ended`. Midnight at that date in `America/Chicago` is exclusive; read-only end is the corresponding midnight30 calendar days later. The last entitled publication must join the actual paid period/claim, have entitlement start before end and publication before the exclusive instant. No later unentitled publication or instruction is followed.

V3 uses the exact immutable public `plan_documents.document`, validated against its actual public-context shape. R2 keeps its original publication presentation/recommendations and actual public intake goal, without converting to a synthetic plan DAG. R1's mutable `baselines` table cannot establish a historical final routine: it returns `legacy_snapshot_missing`. Missing immutable V3 data returns `public_document_missing`. Missing entitlement returns `entitled_publication_missing`. These are explicit retained-data gaps, not a completed legacy-snapshot producer or confirmed none.

Current applicable instructions are derived independently from completed authored outputs and legacy instruction publications for the selected publication, recorded before the support-end instant and effective before its exclusive date. Select the latest real version per declared slot/product scope, preserving every applicable scope. Incomplete canonical output/receipt linkage returns `instructions_incomplete`; absence is not substituted for an incomplete relation. Public directions, cautions, schedule, reason, original known/unknown Start and exact instruction identity/version/effective/publication dates survive. Drafts, private notes, raw Source and internal approval/evidence references are not returned.

Use state is reconstructed from actual pre-end immutable events, only pre-end amendments, compatible entitled publications and confirmed legacy Starts. Later reports/amendments cannot rewrite final use or Start. No delivery/choice/payment creates Start. Stop/pause/different state, uncertainty and contradictions remain separate from immutable advice. The immutable compatibility helper may inspect retained publications; no care view is made true and no current override is supplied.

## Exact early API/source checkpoint

One fixed SQL RPC `concierge_final_export_command_v1(p_command jsonb)`:

```ts
{schemaVersion:1, action:'read_final_export_manifest_v1'}
{schemaVersion:1, action:'read_final_export_part_v1', basis:FinalExportBasis, partIndex:number}
```

No JSON client/actor/role/current/clock/RPC/URL selector. The wrapper derives the actual authenticated own-client identity and checks live session, token expiry, enrollment, deletion and ban before/after the shared client advisory wait and at final return. It grants no advisor/task-agent access. Helpers remain private/invoker with empty search paths. Only the fixed wrapper grants authenticated execution; PUBLIC, anon and service_role execution are revoked. No table or old policy is changed.

`FinalCareBasis` contains `supportEndsOn`, exact UTC `supportEndsAt`, `readOnlyEndsOn`, exact UTC `readOnlyEndsAt`, selected `{version,documentSchemaVersion:2|3}` and `publishedAt`. `FinalExportBasis` adds `recordHash`, UTF8 `recordBytes`, Unicode code-point `recordCharacters`, `partCount` and actual `instructionCount`. A manifest is `{schemaVersion:1,status:'available',basis}` or `{schemaVersion:1,status:'unavailable',reason}`. A part is `{schemaVersion:1,basis,partIndex,text}`. Basis/hash is consistency only, never permission.

The hashed text is the complete public record's PostgreSQL JSONB text. Parts contain32768 Unicode code points each. Even worst-case JSON escaping fits the retained400000-byte page. The command uses the existing100000-byte small-channel bound. Complete record bounds derive from the retained1800000-byte plan response plus all2550 possible instruction scopes at400000 bytes each; no existing cap is raised, row is dropped, count is fabricated or content is truncated. Part reads rebuild the actual basis and require exact equality before returning any text. No manifest-sized list of every part is necessary.

`collectFinalExport` consumes this family only. It detaches borrowed JSON before any later await, validates every part/index/basis and exact byte/character/count completeness, validates the closed public record, freezes it before hashing, verifies the exact text digest, and performs a final current-authority manifest read. The returned deeply frozen model is precisely the parsed record that was hashed. A changed basis or current denial rejects the collection. No injected successful port is acceptance of SQL.

## Implementation plan and early verification

- [x] Reconcile actual retained producers and allocate the sole migration before SQL.
- [x] Implement fixed SQL source and Root types/strict parser/mapper/collector; publish this early source checkpoint for Parent review before any consumer depends on it.
- [ ] Complete the public-only deterministic serializer and bounded handler/runtime, with actual finite HTTP composition and negative tests.
- [ ] Author canonical pgTAP, preserve complete transitive strong/configured compiler closures and final owned/protected-file proof; inspect checks separately before terminal commits.

Early checks: actual Node4/4 contract cases pass; full transitive TS6 strict/noUncheckedIndexedAccess/verbatimModuleSyntax/skipLibCheck=false exits0. A meaningful parser RED accepted a support-end instant one microsecond after midnight; GREEN rejects it while preserving the real Chicago DST boundary. An initial missing-module test attempt and TS6 command-line TS5112 setup fault are retained. The latter was resolved with an own ignored explicit config, without weakening flags. A first mutation test correctly rejected a changed final manifest; its fixture was corrected to distinguish a borrowed old reply alias from authoritative final server state. These raw attempts remain separate from current green.

**EXISTS:** canonical service/publication/Care/Review retained producers. **IMPLEMENTED_SOURCE:** new SQL and Root protocol/collector at this checkpoint. **UNVERIFIED/UNRUN:** all new SQL execution, authorization/RLS/ACL behavior, native/genuine/browser/real post30 download, Account/App/shared transport activation, independent review and exact-head CI. The HTTP/serializer work continues in this task. No full feature, full Account, Source, commerce or full-goal acceptance is claimed.

Own ignored evidence: `.local-artifacts/portal-rebuild/w1-final-export-source/`, including runtime-initial.json, baseline-tracked.json, original five-file verification, compiler configuration and raw RED/GREEN logs. No PG/DB/Docker/Auth/Storage/SQLite/provider/credentials/browser/preview/process inventory/network service/real-client download/send/funds/notification/resource calls were made. No blocked Guidance/M65 question was retried or rerouted. No push/PR/merge/deploy/wait loop.
