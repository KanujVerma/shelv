# W7 notifications source R2

Owner: Kanuj. Review date: 1 November 2026. **SPEC: FAIL. Allocated-source completeness: INCOMPLETE. Correctness/quality: FAIL, N2/P2.** N1's bounded source relationship is addressed; this is not SQL/catalog/concurrency acceptance. Dependent acceptance stopped on the first new material finding. Historical R1 FAIL, its evidence and the original full goal remain unchanged and open. No production or test fix was authored.

## N2/P2: an unreadable RPC error body erases a known 401/403 denial

[`runtime.ts:17`](../../../supabase/functions/concierge-notifications/runtime.ts) reads and parses the entire RPC body before retaining its non-success HTTP status at line18. Empty/non-JSON, oversized or interrupted bodies throw from `readConciergeJson`. Consequently the actual [`handler.ts:24-29`](../../../supabase/functions/concierge-notifications/handler.ts) skips both its post-RPC Auth recheck and the explicit 401/403 branches, returning **503/unavailable for a read** or **503/uncertain for a write**. The same response status survives when the error body is valid JSON.

Concrete case: a synthetically authenticated caller submits `mark_seen_v1` through the actual fixed runtime. The fixed RPC returns HTTP403 with an empty body. The handler returns HTTP503 `{code:'uncertain'}`; the actual Root decoder reports an uncertain original write. In an actual ApplicationSession/retained-cookie/generic transport binding, the valid-JSON403 control produces `TransportError(403,'rejected')`, while the empty-body403 produces `TransportError(503,'uncertain')` and the instruction to check status before retrying. A received401 similarly loses `session_ended`. This violates the [safe error contract](../IMPLEMENTATION_CONTRACTS.md#commands-and-error-semantics) and the allocated current-Auth/status requirements: body availability must not change a known authority rejection into an unknown write outcome.

The existing handler explicitly intends to preserve status401/403, and the same runtime's Auth GET branch handles those statuses before reading the body. The failure is in RPC error handling, not a missing database fixture or a proposed new business rule. Runtime and handler blobs are byte-identical to e89; the N1 SQL correction neither introduces nor fixes N2.

Independent probe: `.local-artifacts/w7-notifications-r2/status-probe.mjs`. It imports the actual notification runtime/handler, Root parser/decoder, ApplicationSession, retained cookies and session transport. Only the exact synthetic Auth/user and notification RPC URLs receive finite synthetic responses; global fetch throws. No `authenticate`, ownership, current-rights or business-operation implementation was replaced with a successful port to claim connected authority. This is source composition and synthetic HTTP, **not genuine Auth/SQL or an admitted notification channel**. The actual retained notification cookie channel is independently observed unavailable.

| Adjacent case | Actual observation |
| --- | --- |
| 401/403, valid JSON error, read and mark-seen | 4/4 retain the status; two Auth calls and one RPC per case |
| 401/403, empty, HTML, oversized100001-byte or errored body, read and mark-seen | **16/16 lose the status**, returning503; one Auth call and one RPC, so the final Auth call is bypassed |
| 503, all five body forms, read and mark-seen | All10 retain bounded failure semantics: unavailable read / uncertain write |
| 200 with an invalid result, all five body forms, read and mark-seen | All10 fail closed; no malformed success or upstream private detail is returned |
| Actual generic session binding, valid versus empty403 mark-seen | rejected403 versus uncertain503; both use real retained session source, with notification channel still absent |

These are **40 enumerated HTTP observations plus two session-binding controls**, not40 passing tests or40 executed SQL cases. The aggregate assertion fails with `16 !== 0`, actual exit1. Raw argv/stdout/stderr/exit are in `status-probe.json`; all observations are in `status-observations.json`. The runner prints `TRUE_EXIT=1` before exclusive log creation. The probe ran once; it did not resend writes or retry/reroute a blocked provider task. No disclosure, successful unauthorized operation, genuine session bypass or mounted UI effect is claimed.

Required correction/re-review: preserve known safe401/403 independently of error-body decoding, preserve the current-identity/final-return fence across this error path, and retain uncertainty for malformed success/lost503 writes. Reproduce empty, invalid, oversized and interrupted bodies through these actual layers, with valid-body controls and final identity loss. No correction or successful mutation is supplied by this report.

## N1: old reproduction and bounded corrected-source result

The unchanged original R1 probe was copied into owned ignored evidence, its imports inspected (`node:fs`, `node:assert/strict`, `node:crypto`), then executed on the original e89 input **before** importing the successor. `original-r1-probe-old.json` records exit1: **20/20 old directed relationships, 0/10 new relationships, different request-lock prefixes**. No SQL was executed.

The raw unchanged probe on the successor remains separate: `original-r1-probe-current-raw.json`, exit1 at its historical assertion that the candidate contains only one trigger (`2 !== 1`). That predicate describes the old input; its failure is not a renewed N1 semantic failure and is not relabeled green.

The independent current-source inventory in `journal-current.mjs` reads the actual old helper and actual forward replacement/registration, then checks both directions and the command lock. `journal-current.json`, exit0, observes **30/30 directed relationships including10/10 new ones, common `concierge:request:` prefix**. Independent missing-registration and missing-lookup controls each fall to25/30; wrong-lock control detects disagreement. Removing only the bounded helper replacement/new registration and reversing the command-lock text restores the exact old migration. Removing only `or replace` and the new family from the replacement restores the exact old helper header/body. These are literal-source predicates, not a PostgreSQL parser,30 executed transactions,60 race schedules or catalog proof.

The inspected production delta is exactly the authorized proposal: patch SHA-256 `df096de064a22036fcc17ff3231b693ca3ccab1c740e076482acc6e658b84289`; current migration SHA-256 **`408b860074abb18a1c1452bd6d08af8009db7fb48e0d01476abd608932d2b684`**. `CREATE OR REPLACE` retains the old helper's source signature/invoker/default attributes/empty search path and adds only `notification_requests` to its lookup. The new table receives the same BEFORE INSERT helper, and the command uses the shared prefix. Old migration files and their five registrations remain byte-identical. Intended OID/owner/ACL/binding preservation remains **UNRUN**.

Thus **N1 source relationship addressed, with native acceptance withheld**. The independent R1 verdict itself remains FAIL. N2 blocks this R2 candidate's acceptance.

## Inputs, evidence and attribution

Evidence home: `.local-artifacts/w7-notifications-r2/`, reviewer-owned and ignored. Applicable root/portal AGENTS, rebuild README, full95388-byte approved input/A/B/C/D01-D48, specification/manifest, contracts, workstreams/status, acceptance/addenda, task/original author briefs, full R1 report and full author response/raws were retained and reconciled against actual source. No external fetch or live Figma was used. Exact bytes/hashes/modes and literal links are recorded in `preserved-inputs.json`; original evidence was never executed directly or overwritten.

- Current complete review brief:110449 bytes, SHA-256 `f074c9f5e041a5424d9b2c6fa893b7eb57db9bbf2acc254f05eb0f21236e4a7b`, recovered from its actual message with continuation offsets. Identity and Parent-advance steering are recorded separately; no new permission is inferred.
- Original author brief:101821 bytes, SHA-256 `0d631631ae2ba365155aad7d2a9ddeeb9ef52de72f8b4e4fd2f78a6208e8e793`; original R1 brief:106374 bytes, SHA-256 `5943d3cef2e636e55e8abd98a1d38dc0efc294f517313c8c0c5b4937b6f4969b`. Their approved-input suffix differs from the retained input only by its final newline; original bytes are preserved separately, not normalized.
- Approved input:95388 bytes, SHA-256 `c45701f9f54fd2b1dbb09bbd7aa2b9b437e9059aa6032b6f39411fe2e7f6efbd`.
- Full immutable R1 report:17769 bytes, SHA-256 `450e2adec7b78fec00d64b50cf2f474fdd33112c8ed5838a387bc33f5700f93e`, original commit `b22428b649ff4d68062170a2367e2420a2b8c990`.
- Current author report/append-only response:28864 bytes, SHA-256 `5a26709f9251d1e448764278a78c2176af8da0bf710c3cca1d2e3ac5af396c1c`. Its original e89 report remains independently available in Git and copied R1 evidence.
- Complete current `notification-kernel`, `notification-n1` and R1 evidence trees, plus retained documentary inputs:639 regular files copied and hashed, plus9 literal links,648 verified file/link entries overall. The original seven negative-test symlinks are retained exactly, alongside two later author links; no symlink was dereferenced. Current author-kernel sink files number282; this includes later reruns/negative/partial artifacts and does not relabel the original174 regular receipts plus seven links as a new acceptance count.

The author's current27/27 result, original19/19, new8/8, real synthetic.invalid filesystem receipts, actual retained-session/generic transport exercise,216-file strict closure/52 own source-test files and zero compiler errors remain **attributed author evidence**. The original215/51 strict result, configured frontend/session checks,13-input/five-output `write:false` bundle and UI guard remain separately attributed. The canonical pgTAP now contains **66 AUTHORED, UNRUN assertions** and60 AUTHORED, UNRUN two-session schedules, plus explicit genuine public-command/catalog case graphs. None was executed here.

Earlier raw failures remain intact: initial parser/handler/worker REDs; sink `/var` ancestor rejection; dependency containment setup rejection; original11/13 adversarial and7/8 session-worker attempts; mapper uncertainty/cursor failures; four then two strict type errors; incorrect first bundle import and config warning. The author's later27 does not erase these. `attributed-raw-summary.json` indexes retained raw exits; full logs and partial artifacts remain in the copied trees.

Reviewer setup qualifications: ambient Node was20.11.0, so only the explicit22.23.0 binary was used for source probes. An optional combined file search named a nonexistent care migration; the actual existing care source was then selected/read, with no SQL executed. The first provenance wrapper and inner proof used the same output name: inner checks returned0 and printed `TRUE_EXIT=0`, but exclusive raw-log creation correctly refused EEXIST and the outer command exited1. Original script/proof/tool transcript and `setup-failure-provenance.json` remain; a separately named v2 payload/raw result succeeds0. This is a reviewer harness failure, not N2 or a passing product result. Large tool displays were bounded/truncated; preserved raw result files contain the full captured output.

## Exact base, imports and protected paths

Own workspace `/Users/kanuj/.t3/worktrees/shelv/t3-edb3a736`, branch `t3/edb3a736`, began clean at exact frozen **`d4a3314ecd81e4c3b544a8919834429e90c05d06`**. The existing d4 type-only prerequisite was already present and was not replayed. Only these ordered candidates were inspected and imported with ordinary `git cherry-pick -x`, without conflict:

| Frozen candidate | Own attributed import |
| --- | --- |
| `e89f83ed3d4149dfaabf10d30aa3fa5b1dba59c3` | `9be2ce5fcd6cb830dc6f1e7bc9ebc5373e8239b9` |
| `1f9fe2be121dbf26740514cc14b677f23258e07f` | `f0dc364b068c83c782924870329f5c13e3f8e829` |

Parent physical HEAD was clean `a06fd0564ec189e8b9c8f2475d1742eb07834418` at initial inspection. Parent explicitly reconciled its intentional owner-policy code/test/docs advance. This review uses frozen Git d4 for all protected-file comparisons, not evolving Parent HEAD; it does not call physical Parent same-base. No rebase, unrelated ancestor import or Parent write occurred.

All **1991 original base files**, including **62 old migrations /113 old SQL files**, retain exact bytes and modes. Root/portal lock hashes remain `5c57c9aec9e4585066e032e234d610a77cbffd9a51f82700c158fc37fe01b5c2` and `bc914f3a9c9f24e44f02e3cff2804651147385ea5abda58a064531329ef23203`. Shared App/routes/transport, Root SchemaMetadata, packages/config, original clocks/emission and four old service RPC source bodies are untouched. This is file/Git preservation, not executed database preservation.

All17 final candidate paths match the exact frozen1f9 Git blobs and mode100644:

| Path | Git blob |
| --- | --- |
| `docs/portal-rebuild/research/W1_NOTIFICATIONS_SOURCE.md` | `819c6349bf079da9bdb1770b662989e4fecc67c3` |
| `src/contracts/PortalNotification.ts` | `b205850326db4558acb7e6a0de23a8dab93f0a1b` |
| `src/contracts/PortalNotificationMapping.ts` | `ac658e0ee3e2ffbf4ec1698b31373f4471baefbd` |
| `src/contracts/PortalNotificationValidation.ts` | `d4b41ef32f60a0b5f3f4960ab2bf6545a05bbaf4` |
| `src/contracts/PortalNotificationValues.ts` | `09bc3ee8dfd1fcb57684081a5c6af0aaaab40b88` |
| `supabase/functions/concierge-notifications/handler.ts` | `26d71e2366fefcb388cbfb62b2aadd9170ac9b00` |
| `supabase/functions/concierge-notifications/localSink.ts` | `1784079c51d7bc4070eb5d9662accf3a7942d2c1` |
| `supabase/functions/concierge-notifications/neutralPayload.ts` | `86eaf936e5554b36c4699b285918712d6925278f` |
| `supabase/functions/concierge-notifications/runtime.ts` | `5b3d60af28d8314d8f29c93f8fef208f1e2d876f` |
| `supabase/functions/concierge-notifications/worker.ts` | `962ec7e42f81f53c1f5f7471c4e3d7e456dff3ac` |
| `supabase/migrations/20261101191527_portal_rebuild_notifications_v1.sql` | `b25eadf338172f28550d796a613aa76032433748` |
| `supabase/tests/portal_rebuild_notifications_v1.test.sql` | `cac3d28dbb2191a69f39861748b10a9282315b62` |
| `tests/portal-notification-contract.test.ts` | `89605786f8136510ede022616213086e30c703f2` |
| `tests/portal-notification-handler.test.ts` | `df2323ea146456bc6e47a054a99787060738fdbe` |
| `tests/portal-notification-session.test.ts` | `2a93aad782e42ae6f9201977be2acf0c8897bd42` |
| `tests/portal-notification-worker.test.ts` | `38ca2f7b13766d002a408b9ef6510551f1388168` |
| `tests/portal-notification-journal.test.ts` | `a98d2017d130db9cdeb282389fffc5e07e6beb71` |

Current canonical pgTAP SHA-256 is `f66cf297604ab78c5aede7a659582fff326e2a7e2d673a8c9fb3f1ce87c99621`. Full path/byte/mode/hash proof is in `provenance-v2.json` and `base-files.json`.

## Commands, runtime and custody

All probes use `/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node` (initial and final output **v22.23.0**). With `E=.local-artifacts/w7-notifications-r2`, exact material probe commands were:

```text
node E/run.mjs original-r1-probe-old node E/review-r1/source-journal-probe.mjs
node E/run.mjs original-r1-probe-current-raw node E/review-r1/source-journal-probe.mjs
node E/run.mjs journal-current node E/journal-current.mjs
node E/run.mjs status-probe node --experimental-strip-types E/status-probe.mjs
node E/run.mjs provenance-command-v2 node E/provenance-v2.mjs
```

`node` above abbreviates that exact absolute binary and `E` abbreviates the literal evidence path; raw JSON records expanded argv/cwd. Exits are respectively1,1,0,1,0. Import commands/raws are `import-e89.json` and `import-1f9.json`, both0. Report-only diff/link/scope validation, final preservation/config comparison and ordinary report commit are retained in terminal evidence. No hook bypass flag is used; the actual trimmed Git hook directory contains only sample hooks.

- Authoritative **taskId**, separately forwarded by Parent after the initial gate: `node:delegated-task:command%3Amcp%3Add730894-0fab-4a94-873d-743422eae122%3Adelegate-task%3Aportal-rebuild-w7-notification-kernel-source-review-20261101-r2`.
- Backing **childThreadId**: `thread:delegated-task:command%3Amcp%3Add730894-0fab-4a94-873d-743422eae122%3Adelegate-task%3Aportal-rebuild-w7-notification-kernel-source-review-20261101-r2`.
- Actual live **runId**: `run:thread:thread%3Adelegated-task%3Acommand%253Amcp%253Add730894-0fab-4a94-873d-743422eae122%253Adelegate-task%253Aportal-rebuild-w7-notification-kernel-source-review-20261101-r2:ordinal:1`; **ordinal1**, not an inferred task handle.
- Initial and final LIVE capabilities/descriptors, self configuration and Parent `d632030a-18f7-4dec-a2c9-f5c0418c3fd5` configuration independently return **codex / gpt-6.1-sol / reasoningEffort=xhigh / serviceTier=default**, full-access/default interaction. Exact advertised descriptors include xhigh/default. Project `ac0af19d-d404-4f53-a870-02bfd76c2a80` has live defaultModelSelection:null; explicit thread selections supply runtime evidence. No model, options or config was changed.
- Own and Parent project/default/eight role file pins were inspected; original base pins/bytes/modes stay unchanged. No nesting, delegation, launch, tool-capacity inference or polling/wait loop occurred.
- Own root and portal node_modules remain absent. No installation, clone, shim, flag/declaration substitution, dependency or Parent write occurred. The optional clone grant was not exercised after the stop.
- No browser/preview/DOM, OS process inventory, native fixture, DB/SQL execution, Supabase allocation/CLI, Auth/Storage service, credentials/provider, external network service, real message, funds/publication/permission action, push/PR/merge/deploy or blocked Guidance/M65 retry/reroute occurred. Own-process handle observations contain only standard I/O/filesystem work; no persistent resource was acquired. This task used synthetic Responses, not a listener.

## Verdict and held gates

**SPEC: FAIL** for N2 safe error/current-Auth handling. **Allocated-source completeness: INCOMPLETE** because the required stop prevents completing independent acceptance. **Correctness/quality: FAIL, N2/P2**. N1 has a narrowly confirmed source correction, with no blanket approval for the rest of the candidate. Do not activate/pin this candidate from this report.

After N2, no dependent author27 rerun, broader handler/session matrix, worker/sink acceptance, compiler/typecheck, bundle/SSR, UI guard, full npm suite or Expo build was run. The independent worker current-context/private/cross-recipient/stale-lease/revision/replay/uncertainty/duplicate/concurrent-file matrix remains unrun; reading its source and author logs is not a PASS. No successful authority fixture substitutes for these gates. A new full independent source review must complete them after a correction.

Genuine SQL compilation/migration replay, real Auth/current rights/RLS/ACL/catalog/OID preservation, actual public-command journals/replay/purge, concurrency/rollback and native least privilege remain ungranted and unrun. Full notification delivery still needs actual cookie/gateway/App/inbox/A06/sidebar composition, A07 resolution, post-sign-in/current-route recovery, real isolated provider/reconciliation/authentic webhook and delivered/bounced evidence. Accepted remains distinct from delivered/seen. Browser/visual/accessibility, full26-screen/secondary/V01-V17, human comprehension/business launch, full suites, exact-head CI and explicit human release approval remain open.

The sole authored tracked deliverable is this report. Deliver only its new report commit, excluding both attributed import ancestors. Parent owns canonical status/CONTEXT_SYNC integration. The complete approved rebuild and notification goal remain open.
