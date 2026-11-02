# W7 Account departure READ independent source R1

Owner: Kanuj. Date: 2 November 2026. **Specification verdict: FAIL. Correctness/quality verdict: FAIL.** Two actionable P2 findings block admission of this exact candidate. The complete eleven-path candidate and author report were reviewed; feasible semantic and focused transport review continued after the first finding. This is SOURCE, pure and finite synthetic HTTP evidence only, with a focused strict compiler check. SQL, genuine Auth/persistence, mounted Account and release acceptance remain unrun.

## Consolidated findings

### ADPR1 / P2: the producer rejects the actual persisted cancellation shape

At frozen candidate `64534a8455d61abb94c5bf1a391ee5a0e7254cef`, `supabase/migrations/20261102080000_portal_rebuild_account_departure_v1.sql:25` requires `x.data->'confirmedWithClient'='true'::jsonb` before recognizing a cancellation. The authoritative existing writer validates that confirmation on the command, then deliberately stores **`p_payload-'confirmedWithClient'`** in `service_cancellations` ([retained writer](../../../supabase/migrations/20261025221028_concierge_service_workflows.sql:155)). The plan migration moves this writer into `concierge.plan_legacy_service_write` and delegates to it; no later migration supplies the removed field. This is a mismatch with the real persisted contract, not missing user confirmation.

For an ordinary cancellation created by that writer while its actual paid period still contains today, `has_cancellation=true`, `cancel_valid=false`: the new read returns cancellation/access/end boundaries as unknown rather than retaining actual paid support and its known exclusive dates. Early departure has the same recognition problem. After support ends, if the existing canonical final-export selection is available, lines 63-64 instead raise unavailable because `support_end` remains null. If canonical export is unavailable, the DTO still loses actual cancellation and boundary facts. This does not mutate entitlement or move money; it breaks the requested C08C/C08R observation of existing records and D38 preservation.

The authored SQL cases at lines 57-67 manually insert `confirmedWithClient:true` into stored rows. Those rows bypass the actual writer's persisted shape and conceal this failure. Independent source regression `source-audit.mjs` first verifies the exact writer, validation, wrapper delegation and misleading fixture setup, then fails on the candidate's removed-field requirement: **3/4 source checks, exit 1**. This is a source-derived SQL-semantic finding; PostgreSQL was not executed.

**Required correction:** derive trustworthy cancellation facts from the existing canonical stored row/writer contract. Do not backfill invented confirmations or expand the financial/cancellation-write scope. Preserve conservative unknowns for genuinely unsupported or contradictory records. Add source regressions and, when separately granted, persisted ordinary/early cancellation cases created through the real canonical command, including current paid coverage and the post-support canonical-export branch.

### ADPR2 / P2: the deadline resets for each upstream call and omits the whole operation

Candidate `supabase/functions/concierge-account-departure/handler.ts:9-37` uses only `request.signal`; line 23 awaits the streamed request body without an operation deadline. The actual departure runtime delegates each of its five Auth/RPC calls to the retained runtime, whose `options()` creates a fresh `AbortSignal.timeout(10000)` for every call ([retained runtime](../../../supabase/functions/concierge-operations/runtime.ts:27)). There is no absolute operation budget spanning initial Auth, body, both RPCs, later Auth, and final return. An individually bounded body/call does not establish that required bound.

Independent probe `tests/reviewer-independent.test.ts`, through the exact candidate handler/runtime and retained Auth/RPC implementation, supplies five **signal-aware finite** HTTP stages of 2,200ms each. Every stage is individually below 10,000ms, yet the complete operation returns **HTTP 200 with the private departure DTO after 11,013.648ms**. The required whole-budget refusal assertion fails: **28/29, exit 1**, zero skip/cancel/filter. No clock, authority, currentness, Vault or operation-success stub is used. Global fetch is denied; only the injected closed HTTP transport supplies synthetic Auth/RPC responses. Source also shows an incomplete incoming body can wait without any internal deadline until caller abort; an infinite wait was not executed.

**Required correction:** capture one bounded operation deadline before the first await and apply its remaining budget to request streaming, all upstream stages and final return. A transport ignoring cancellation must not keep the handler pending indefinitely or permit a late successful value. Recheck applicability/abort after awaits and cleanup, preserve already received 401/403 despite body failure, initiate overflow/abort cancellation without joining an unending cancel, and report unresolved cleanup truthfully. Retain all current denial and ADEP1/ADEP2 regressions. This needs a bounded family correction, not shared timeout/config/dependency relaxation.

## Frozen inputs, identity and owned scope

- Review worktree: `/Users/kanuj/.t3/worktrees/shelv/t3-1112654f`; starting and pre-report HEAD **`8af746d197b976972d4b16924155afa8c3b32d44`**, initially clean.
- Parent: `9b085ada-435f-48d6-8886-957c1ce3e82d`. Parent's original integration and pending Maya17 were read only where authorized and never written, executed or adopted.
- Literal review taskId: `node:delegated-task:command%3Amcp%3Aafb222dc-28b4-420b-9474-b05bc6eeba89%3Adelegate-task%3Acontinuation-20261102-account-departure-review-r1`. The distinct self threadId has `thread:` in place of the leading `node:`. The parent forwarded the literal receipt separately; it is not inferred from a run ordinal.
- Initial and terminal `t3_thread_configure` reads, with `modelSelection` omitted, confirm actual self and parent **codex / gpt-6.1-sol / reasoningEffort=xhigh / serviceTier=default**. No model/configuration change, fallback or nested agent.
- All product/probe/compiler Node execution selects **`/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node`**, actual `v22.23.0`.
- Implementation **`64534a8455d61abb94c5bf1a391ee5a0e7254cef`** is a direct child of the base: eleven added paths, 584 additions, no existing-path edit. Author report **`44c918b82430ba79fd331f77e583cb5f96d1f480`** is its direct report-only child. No INPUT ancestors.
- Candidate manifest read and hashed **in place**: `/Users/kanuj/.t3/worktrees/shelv/t3-b8653684/.local-artifacts/portal-rebuild/account-departure-lane7/candidate-manifest.json`, 6,588 bytes, SHA256 **`5982173c57ec208430288962d4e1fa1e6392810a681032b15508a1ce79df6cce`**. All eleven postimages and sixteen listed dependencies match immutable Git blobs/hashes.
- Only exact source/test/import closure inputs were materialized from Git into own ignored `account-departure-review-r1/current/`. The initial fifty-file runtime/input fixture gained one exact base type-only dependency for compilation. No production import/cherry-pick/input commit was made in this review. Only this new report is a tracked deliverable.

Read authority: applicable AGENTS/personal workflow/tstack routing; rebuild README, GOAL, D01-D48, full desktop specification, contracts, addenda and ownership/status context; complete relevant continuation/custody sections; all eleven candidate files and full author report; retained service/period/cancellation/return/session/final-export source and relevant final-export findings. Historical rosters are not live grants. D13/D24/D25/D35-D40, exclusive Chicago boundaries, ordinary retained coverage, explicit early end and the post-30-day static-export addendum govern this read.

Original approved input is still **95,388 bytes**, SHA256 **`c45701f9f54fd2b1dbb09bbd7aa2b9b437e9059aa6032b6f39411fe2e7f6efbd`**. Parent's exact continuation file is 100,187 bytes, SHA256 `b428b318598df52f12ce3e6ea4ebd350ff9333ee05d9fd8f04a8e845d0c722bc`; it was read and hashed in place, not copied wholesale or executed.

### Complete candidate postimage manifest

| Path | Exact Git blob |
| --- | --- |
| `src/contracts/PortalAccountDeparture.ts` | `d9ac2302db3b02d57e460a432edfaff30b78e889` |
| `src/contracts/PortalAccountDepartureMapping.ts` | `eb8f130c5804767cadbe4ddedfb073895c7eec0b` |
| `src/contracts/PortalAccountDepartureValidation.ts` | `aed9d1cdf0abff1038bb79a11e3c67bc9513ff9c` |
| `src/contracts/PortalAccountDepartureValues.ts` | `f268ac7add49fac47dbe8848d45f32cfdc1bd230` |
| `supabase/functions/concierge-account-departure/body.ts` | `484672ca1a13639e861aed527a122f60a9eb97eb` |
| `supabase/functions/concierge-account-departure/handler.ts` | `6b9cbad8aa73347409dd1e7dbfd4d1f565255881` |
| `supabase/functions/concierge-account-departure/runtime.ts` | `d80f2ddae80153938c2050949f9a9681fc242ea0` |
| `supabase/migrations/20261102080000_portal_rebuild_account_departure_v1.sql` | `330bb3a0af2b2536b40c9e710c6641dff7aa2dd4` |
| `supabase/tests/portal_account_departure_v1.sql` | `702129fcbe848be8edb7563be47ec5458b5a1fb1` |
| `tests/portal-account-departure-contract.test.ts` | `4c714e3687c32db5604ac1ebf3b8ef41ee072d02` |
| `tests/portal-account-departure-http.test.ts` | `bd180652ddfcaea680cae17addc59707a5b40c1d` |

The manifest above binds complete source/test bytes, not just the two highlighted locations. The sole new migration SHA256 is `3008c885e44a599bcf298e57a8fd28fff49d75b7290d04bd6ac1f8a20780db9b`. All **2,128** base tracked paths and Git modes, including **66** existing migrations, remain exact. The review report commit is a direct report-only child of the base, with no input ancestors. Its final hash is returned separately to avoid self-reference.

## Findings retained, regressions and limits of OLD evidence

ADEP1/P2 and ADEP2/P2 are addressed for their original bounded vectors in current source. The actual runtime preserves received Auth403 as 403, and the Auth decoder retains its 2MiB budget while departure RPC replies use 4,096 bytes. Neither closure resolves ADPR1 or ADPR2.

All original author logs/receipts below were read and hashed **in their original directory**. No archive was recursively copied and no foreign probe/artifact was executed. Exact historical intermediate source snapshots were not retained by the author; this review does not fabricate those preimages or claim to have re-executed them.

| Original author raw | Outcome / meaning | Original log SHA256 |
| --- | --- | --- |
| `old-absent` | 0/2, exit 1, two module-load failures; feature absent | `e8d3a65eac71577fdb7f649241193cdde75e32d7fe4b0ad1143c8a3df80c246b` |
| `implemented-01` | 14/15, exit 1, March observation inherited October cancellation; fixture contradiction | `17f6c577fc362d688c02c0d8be462addefe73d46f20d790c8a1e790faff6fd99` |
| `auth403-red-02` | 15/16, exit 1, ADEP1 actual 401 instead of 403 | `dd99caa4e8e753ade5ca9719c6b30d58dba163e6f565812235d8949b879d5ae6` |
| `current-03` | 16/16, exit 0, after ADEP1 | `227785b52a1c620bc35bf6bc5f976d893dae36c6d6c7bf103469b5063676ba6f` |
| `auth-budget-red-04` | 18/19, exit 1, ADEP2 actual 503 instead of 200 | `97df91471d441ba1c29fa10cc8280c27fd5269390521a86cfa05d2bf5421077c` |
| `current-05` | 19/19, exit 0, author CURRENT | `695f7d9177fd2f94484c7bdca46919139739475227bf60d35154db209f7dfec4` |
| `retained-01` | 79/79, exit 0, author retained checks | `5924ca6645fc7864ed9340974c85390d75b24370221d1e74939a2768a780715e` |

The minimally fact-bound calendar fixture uses `cancellation:{state:'none'}` only for its calendar-only case; the original rejection remains a raw failure. It is not an approved wire successor, and no original assertion was waived. Raw OLD, fixture correction, current frozen source and diagnostic sensitivities remain distinct. No separate approved-successor equivalence is claimed.

Independent review runs use own immutable-input fixtures and unchanged original test assertions:

| Own receipt/log | Actual result | Raw SHA256 |
| --- | --- | --- |
| `current19` | **19/19, exit 0** | `0b0ea76713b756a4e5df605127d8f9d9a48e1754a243c45162f9b8f0c36d7266` |
| `retained79` | **79/79, exit 0** | `f63f08f3bee3eb06d24971f5ae83465e917fb39eb582676abb0bae313118ca89` |
| `independent-current` | **28/29, exit 1**, ADPR2 | `8ac72419602fa3f6d213eb43e1fcca18a90c49d05e50790a483860070636d56c` |
| `source-audit-corrected` | **3/4, exit 1**, ADPR1; lexical/source checks only | `29bc2da9da06cb08a949ace11014a12d37a2a2dc86ae65c2f9474d0a7bd48af8` |
| `old-absent-replay` | **0/2, exit 1**, own base without new departure modules, current tests fail loading | `e2447943972dd97f031a28878be477bb3d9f208921376d5b4e297189477612c4` |
| `sensitivity-auth403` | **18/19, exit 1**, current-derived ignored runtime with only Auth403 marker removed | `cf1a747ff6daca4ed90bc637345dfa598e8f60d758c6307a779636e0ae470d88` |
| `sensitivity-authbudget` | **18/19, exit 1**, current-derived ignored runtime with only Auth budget reduced | `8b31ffa53677f73203e272308daecc0816866fefc5e6e4ffb8994f810f9da8d1` |

Every test run has zero skips/cancellations/todos and no assertion filtering. Sensitivities establish the original assertions detect removal of each fix; they are **not exact original intermediate OLD**. Only own ignored diagnostic copies changed. Production and original tests remain untouched.

The new 29-case runtime matrix checks received 401/403 at all three actual Auth stages and both RPC stages, broken/pending bodies and unending cancellation, identity replacement at both later Auth checks, all nine stable public projection changes, captured origin/URL/key/transport/bearer, abort after each of five HTTP stages, invalid dates/status timing and cumulative deadline. Actual handler/runtime/retained Auth composition is used; synthetic responses do not prove real SQL currentness. The original 19 retain exact command/no-selector/no-write scope, schema/shape/private-field/accessor refusals, detached/frozen results, leap/month-end/DST/exclusive instants, unknowns, future cancellation, request caps and abort/overflow behavior. All 79 retained final-export authority/status/HTTP checks also ran unchanged. This review does not grant or re-review provider-refused Guidance/M65 work.

## Source semantic coverage beyond the author tests

The sole public RPC is `concierge_account_departure_command_v1({p_command})` and only command `{schemaVersion:1,action:'read_account_departure_v1'}`. No actor/session/client/date/URL/RPC selector is accepted. Public output is limited to schema 1, server observation, care access/known dates, cancellation, canonical final-export status and administrative statuses. No private notes/source, balance, money movement, care-write or support-restoration field is returned.

The SQL public wrapper reuses actual `final_export_authorize_v1`, not caller-supplied selection as authorization. Source calls existing session/target guards, excludes advisors and active/inactive task agents, rechecks after the identical current-client advisory lock and before final return, and compares complete fresh contexts including the internal canonical selection. Session deletion/not_after/JWT expiry, deletion/ban/enrollment and revocation checks remain in the retained guard. Helper/ACL source has empty search paths, a private invoker helper with explicit PUBLIC/anon/authenticated/service_role revokes, and only the exact definer RPC granted to authenticated. These are inspected source properties; ACL/RLS/lock behavior was not executed.

The context uses real period containment for active access, avoiding max(end) filling gaps; pending periods do not invent final dates. Thirty-day dates are Chicago calendar dates with exclusive midnight, not monthly billing or a fixed 90-day substitution. Recognized early end is explicit; ordinary cancellation cannot shorten paid coverage. **ADPR1 prevents those cancellation branches from recognizing actual canonical rows.** Canonical final-export unavailable reasons remain authoritative, including `legacy_snapshot_missing`; no private legacy lineage is reconstructed. Selection remains internal.

Positive unmatched orders, undelivered purchases and canonical unfinished return cases establish administrative availability. All joins filter the actual own client; absence remains unknown, not no obligations, a zero balance, money repaid or deletion clearance. `return_status` derives the latest canonical sequence or requested; only declined/client_repaid close that per-return signal. No complete service-refund/closure producer is supplied. A metadata read cannot establish all obligations are closed or that a later Account/admin route exists.

Only two functions, revokes and one grant are added by migration source. No existing function/table/RLS replacement or business DML is introduced. The authored pgTAP file remains **UNRUN**: its ordinary/early cancellation setup has the ADPR1 fixture flaw, and it is not a complete positive export/admin, denial, history-performance or concurrency matrix. No persisted positive/negative SQL case is counted as passing from a string audit.

## Commands, dependency custody and compiler evidence

Own evidence home: `.local-artifacts/portal-rebuild/account-departure-review-r1/`. Individual JSON receipts record actual executable, argv, cwd, subprocess exit/signal and complete raw-log hash. Capture wrappers themselves may exit normally after recording a failed test subprocess; the tables use the **test/compiler subprocess** exit. Preloaded own `deny-fetch.mjs` denies global external fetch before product imports. There is no server or socket.

In these exact command shapes, `NODE` is only the explicit Node path above, `E` is the absolute evidence home above. Tests run with cwd `E/current`; absence/sensitivity runs use their individually named own fixture cwd and identical test argv. Source audit and compiler run from the own worktree.

```text
NODE --import E/deny-fetch.mjs --experimental-strip-types --test --test-concurrency=1 tests/portal-account-departure-contract.test.ts tests/portal-account-departure-http.test.ts
NODE --import E/deny-fetch.mjs --experimental-strip-types --test --test-concurrency=1 tests/portal-final-export-authority-status.test.ts tests/portal-final-export-http.test.ts
NODE --import E/deny-fetch.mjs --experimental-strip-types --test --test-concurrency=1 tests/reviewer-independent.test.ts
NODE --import E/deny-fetch.mjs --test E/source-audit.mjs
NODE E/dependency-preflight.mjs
/bin/cp -cRp /Users/kanuj/.t3/worktrees/shelv/kanuj-portal-rebuild-integration-20261030/node_modules /Users/kanuj/.t3/worktrees/shelv/t3-1112654f/node_modules
NODE E/dependency-parity.mjs acquired
NODE /Users/kanuj/.t3/worktrees/shelv/t3-1112654f/node_modules/typescript/bin/tsc -p E/tsconfig.focused.json --listFiles
NODE E/dependency-parity.mjs terminal
git diff --check
git diff --cached --check
```

Root, portal and session-runtime packages and all three tracked locks match the frozen base/manifest. Lock SHA256 values: root `5c57c9aec9e4585066e032e234d610a77cbffd9a51f82700c158fc37fe01b5c2`; portal `bc914f3a9c9f24e44f02e3cff2804651147385ea5abda58a064531329ef23203`; session-runtime `4024b48fb339605a438a3bfe68f6e547dade8c86660c6f06b41c278aa2289ba0`. Retained Auth runtime SHA256 `abc245a3902366f56ad156813d50edb2b3137989f09133b4e2389150b5898ff6`; retained canonical final-export migration `54ab1bd50bcb84ec82ea1f6f04e4d837d59269abfe04edf009fbd28084184c8f` includes the actual base's grammar correction rather than the historical pre-correction blob.

Conditional dependency custody was satisfied before compiler use: own destinations absent, **four physical root/portal lock comparisons** plus package/runtime locks exact, both physical copies of all **91 tracked runtime files** exact to the base, nonsymlink ancestor/root and same-device checks, complete byte/mode/literal-link source inventory. Only root node_modules was APFS-cloned into own ignored node_modules, not a foreign generated runtime or evidence archive. All **43,213** entries, including root mode, match source-before/source-after/destination before compilation and at terminal. Source inventory hash is `30e8d528ec2bc9c6278186922f1102a4c34556ff548b79d83190a6c99601d4ef`. No external-to-root module links were admitted; no portal dependency clone was needed. No install, shim, package/lock/repository-config change or relaxed flag occurred.

Actual **TypeScript 6.0.3**, Node declarations **22.20.3** and undici-types **6.21.0** typecheck the complete focused candidate/retained graph: **212 program files, zero diagnostics, exit 0**. Options retain `strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `skipLibCheck:false`, DOM/ES2022 and actual Node types. Raw complete compiler log SHA256 `a20abd571b628b0d6f8963ae688650b957a9c57bafedebcf1da00021092696c1`. This is an ignored focused strict graph, not the full configured Root/Expo/frontend/session build or emitted-runtime acceptance.

Preserved reviewer setup failures: first source audit had a missing regular-expression slash and failed before assertions (`source-audit.log`, exit 1); only the own ignored harness was corrected before its semantic 3/4 result. First strict run exited 2 on missing `PortalRebuildMapping.ts`, omitted by the initial fixture copier's type-import scan; exact base blob `ac333d7864eea87a47cb3c581f9af8b770d02d3b` was added, with no compiler-option change, before the zero-diagnostic rerun. First full protected-file inventory hit Node's default child-output ENOBUFS on a tracked large JSON; a direct Git-blob-ID inventory completed successfully. These are setup failures, not candidate findings or passing checks. Existing typeless-package Node warnings remain in raw logs.

## Admission and remaining gates

**Do not admit or activate this candidate from this report.** Correct ADPR1 and ADPR2, retain original logs/assertions and both independent regressions, then obtain a fresh independent review of the complete amended candidate. Parent alone owns shared migration ordering and composition; reviewer authored no production/test correction, source Account/financial expansion, gateway/config change or Root activation.

SQL/native checks are **prevented by the explicit no-native/no-SQL grant**, not passed/skipped: exact migration replay and catalog/ACL/RLS/preservation; real own-client session/expiry/deletion/ban/revocation/agent/advisor denials before/after lock waits; concurrent cancellation/selection changes; genuine positive final-export/admin facts and maximum-history/performance. The original guard reuse and synthetic status cases do not substitute for these.

Full npm, configured Root/test/frontend/session types, Expo/native exports/builds and exact-head CI are **unrun here and centrally scheduled**, not waived. No DB/Auth/Storage/provider/socket/listener/server/browser/native fixture/reset/process adoption/deploy or real-client action occurred. Remote freshness/CI was not fetched for this source-only review.

After source correction/review and applicable native gates: pin/admit the fixed command into cookie/Vault/gateway, add the own-client request adapter, mount Account with actual ApplicationSession retirement/currentness and post-window reachability, keep separate unfinished administration, and connect the existing static final-export consumer. Genuine Auth/persistence/end-to-end/browser/visual/accessibility, durable download/staging, supported historical R1 public lineage, complete obligation production, final-product acceptance and release authorization remain separate open gates. The metadata DTO grants neither support nor care writes; SOURCE PASS, if later earned, cannot activate Root.

Sole tracked deliverable is this new report. No push, PR, comment, watch, merge or external write; no nested review or provider-refusal rerouting. Parent owns integration/status/CONTEXT_SYNC updates. Own raw receipts/probes and the frozen candidate manifest remain available for the correction and next independent round.
