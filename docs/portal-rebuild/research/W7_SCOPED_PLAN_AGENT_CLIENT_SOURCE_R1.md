# W7 scoped Plan agent client independent source review R1

Owner: Kanuj. Date: 2 November 2026. Proof: source, native Node pure tests and closed finite synthetic HTTP only. Sole tracked deliverable: this new report. No production or original test changes.

## Independent verdicts

- **Specification: PASS for the complete allocated client source scope** at implementation `a6b2ca06b2a0cd533e1799d9744b7bde7278e7ad` and author report `ba9858ebb0f08accbae8f25d7cef66167101e67b`. The factory and executable read/create/edit/save/assign/import/validate/preview path use the actual Root Plan commands, parser, result mapper and fixed handler route. The approved private 2,000,000-byte response limit remains an availability boundary, not a new domain maximum.
- **Correctness/quality: PASS within this source/pure/finite HTTP scope.** No new reproducible actionable defect was found after reviewing the complete candidate, tests, author findings and relevant authority chain. Original AG1/P2, AG2/P2 and AG3/P3 are addressed for their concrete source vectors; the unchanged current suite detects all three negative controls.
- **Full D19/D40 workflow, API/application admission, genuine authorization and release: NOT ACCEPTED by this review.** Strict compilation, real enrolled principal/session/task/source grants, genuine persistence and revocation, actual external-agent/CLI composition, complete larger-history access and integrated acceptance remain open. A bounded transport client is useful implementation, but does not establish the full agent workflow.

Fresh results: author suite **29/29**, retained Plan/advisor suites **19/19**, independent probes **15/15**, syntax exit **0**. The separate trace run repeats unchanged **29/29** and matches the supplied executed-input fingerprint exactly. No skips, assertion filters, waived expectations or production fixes were used.

## Identity, ownership and frozen inputs

Literal authoritative taskId, forwarded by Parent:

`node:delegated-task:command%3Amcp%3Aafb222dc-28b4-420b-9474-b05bc6eeba89%3Adelegate-task%3Acontinuation-20261102-agent-client-review-r1`

Read-only `t3_thread_configure` calls with `modelSelection` omitted verified both actual self and Parent before review and at finalization: **codex / gpt-6.1-sol / reasoningEffort=xhigh / serviceTier=default**, full-access/default. Parent is T3 `9b085ada-435f-48d6-8886-957c1ce3e82d`. No model, configuration or fallback change occurred. Every Node command used **`/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node`**, verified `v22.23.0`; binary SHA-256 `cc61696726abdfe8392297ecd75aa9863cd9b6435b202c0dc2266039f493da10`.

| Input | Exact observed identity |
| --- | --- |
| Own T3-managed checkout / branch | `/Users/kanuj/.t3/worktrees/shelv/t3-629bedea` / `t3/review-plan-agent-client-source` |
| Own clean initial HEAD | `19b5946e860871deddf3eae762c02bc06fd245e7` |
| Candidate production base | `8af746d197b976972d4b16924155afa8c3b32d44`, tree `3ea533cefb0b926b5163576c600a95116f39a03b` |
| Implementation | `a6b2ca06b2a0cd533e1799d9744b7bde7278e7ad`, direct child of that base; exactly the two new implementation paths below |
| Author report | `ba9858ebb0f08accbae8f25d7cef66167101e67b`, direct child of implementation; exactly `W1_SCOPED_PLAN_AGENT_CLIENT_SOURCE.md` |
| Author candidate manifest | `/Users/kanuj/.t3/worktrees/shelv/t3-4a88cbcb/.local-artifacts/portal-plan-agent-client/candidate-manifest.json`; SHA-256 `151672a3a133dc156abc1cf77b83ddc28ddfaf969d124fd328d591620da2ddfe` |
| Approved original input | 95,388 bytes; SHA-256 `c45701f9f54fd2b1dbb09bbd7aa2b9b437e9059aa6032b6f39411fe2e7f6efbd` |
| Parent continuation, hashed in place | `docs/portal-rebuild/source/CONTINUATION_INPUT_20261102.txt` in the specified integration checkout; 100,187 bytes; SHA-256 `b428b318598df52f12ce3e6ea4ebd350ff9333ee05d9fd8f04a8e845d0c722bc` |

The own starting HEAD contains attributed SMTP input/correction ancestry. Parent explicitly confirmed that ancestry is **not** part of this Plan review target or report delivery. I did not review or execute that SMTP implementation, import the Plan production files into tracked paths, create an input-only commit, or change any ancestor. Deliver only this report's containing commit; do not import its ancestors. The report commit hash and report postimage hash are returned separately to avoid self-reference.

| Candidate postimage, mode 100644 | Bytes | Git blob | SHA-256 |
| --- | ---: | --- | --- |
| `src/clients/PortalPlanAgent.ts` | 12,664 | `a40e12c40df8f73e083c7b036ee469b13aa30043` | `04c875008c88ca8a2dda954ef283ac3d34baf8f44a12099b9bf388cdf83f2b61` |
| `tests/portal-plan-agent-client.test.ts` | 23,695 | `998a1bf90cf51cb0194bb4db71eab015306982a1` | `b9501d60f90a493c4ff49e29cb05a201f59fc1a812e4499b7f0745e33a3f86ab` |

The two paths were materialized from immutable Git blobs into the own ignored fixture, with their ten executed unchanged Root dependencies. The separate four retained tests and their exact JSON fixture were also materialized from frozen `8af746d`. No foreign artifact was executed and no archive was recursively copied. Raw author files were hashed in place against the supplied manifest, then only the required manifest, raw logs, receipts and three exact negative source variants were copied into own ignored evidence. The originals remain intact.

Read applicable root/portal instructions, personal workflow, the rebuild README/GOAL, D01-D48, complete desktop specification, implementation contracts, addenda, workstream ownership and relevant full continuation/custody sections. Read the complete author report and client/test candidate, [Plan API v1](../PLAN_API_V1.md), actual Root parser/mapper/values, actual Plan handler/runtime, shared body/Auth-RPC runtime, and relevant persisted principal/session/task/client/source/exact-approval/publication checks. Historical backend F1-F5/Q1-Q2 and R2-1/R2-2 dispositions were consulted as context; their historical SQL outcomes are not rerun or renewed here. Guidance/M65 refused reviews were not re-reviewed or rerouted.

## Dependency custody and execution fingerprint

Evidence home: **`/Users/kanuj/.t3/worktrees/shelv/t3-629bedea/.local-artifacts/plan-agent-client-r1/`**. `custody-initial.json`, `configure-terminal.json`, command result JSON, raw logs, source fixtures, `executed-closure.json` and `candidate-manifest.json` retain precise paths, modes, hashes, argv/cwd and exits.

Independent builtin Node load-hook tracing of the unchanged current29 run loaded exactly these **12** source inputs: the SDK and original new test; `ConciergePortalValidation.ts`, `ConciergePresentationValidation.ts`, `PortalRebuild.ts`, `PortalRebuildMapping.ts`, `PortalRebuildValidation.ts`, `PortalRebuildValues.ts`; Plan `handler.ts`/`runtime.ts`; shared operations `body.ts`/`runtime.ts`. No outside fixture path or symlink was accepted by that tracer. The ordered byte/mode/path fingerprint is exactly **`f73a3b90dc7959bc85fb2b2a8eb7859db0f976792980e5bcb72d64894f2a67c0`**. Type-only imports are erased; this is execution custody, not compiler-closure proof.

The six manifest package/lock inputs match own physical bytes and modes. All **91** tracked session-runtime entries match the author's exact inventory, SHA-256 aggregate **`544d7d8b97cd0feec91e5eb659c5919313258fad910d10566df8241fc132a5cd`**. Terminal verification rechecks these and the frozen execution inputs. Root, portal and session-runtime `node_modules` are absent. No install, dependency clone, shim, package/lock change or compiler/configuration relaxation occurred.

The conditional same-lock APFS grant was **not exercised**. Its complete four-physical-lock/Parent comparison and full dependency byte/mode/literal-link parity were not established, and no clone eligibility or installed compiler custody is claimed. The checked own paths include the three tracked physical package locks; `apps/portal/session-integration/package-lock.json` is absent. This does not replace or satisfy the separate four-physical-lock clone prerequisite. Native strip-types and syntax checking are not strict TypeScript compilation.

## Full allocated behavior assessment

The actual sole-export factory accepts `{supabaseUrl, anonKey, getAccessToken(signal), fetch?, timeoutMs?}` and exposes `execute(actualPlanCommand, {signal}?)`. It performs no construction-time I/O and captures trusted configuration once. It validates the HTTPS root, public key shape and bounded deadline, fixes POST to `/functions/v1/concierge-plans`, omits ambient credentials, rejects redirects and requests no-store. It adds no arbitrary RPC/path/header, actor/scope authority surface, executable content, self-issued authority or model approval field. Existing typed Plan selectors remain server-checked; the real server decides whether a parsed command is permitted for the actual actor.

Plain command data, nested content, revisions and caller request ID are detached and parsed by actual `readPlanCommand` before asynchronous credentials. Getter/toJSON/code/unknown-field and extra-selector inputs do not reach token acquisition. Actual `planCommandMaxBytes=500000` bounds serialized UTF8 bytes inclusively. Incomplete drafts remain saveable. The SDK forwards real create/save/assign/checkpoint/compare/apply/validate/preview commands, so this is not a read-only wrapper portrayed as full D19.

The absolute operation/body deadline starts before input processing and covers all credential calls, fetch, every streamed read and final credential comparison. Actual stream byte counting enforces the approved private 2,000,000-byte cap despite dishonest Content-Length. The inclusive limits and one-byte overflow are exercised. Oversized complete histories reject without truncating or partially mapping; larger legitimate histories still need an owned availability/pagination solution. Cancellation requests do not await an uncooperative cancel promise. Requesting cancellation is not physical producer-termination proof.

Native Response status/body brand checks prevent a response facade from establishing success. Actual `mapPlanResult` validates the complete data and relevant identities. The client isolates errors to safe status/code/outcome; private SQL/body/token messages do not enter the returned error. Known received 401/403 remain rejected even if body parsing, deadline, abort or cleanup fails; matching safe denial codes survive valid bounded decoding. Unknown/mismatched errors and untrusted write results remain uncertain. The SDK does not retry, manufacture UUIDs, automatically query status or assert an interrupted write failed to commit. Explicit retry/status retain the caller's original command identity.

Credential syntax/expiry checks are local denial checks, not signature verification or authorization. Real credentials are reacquired before dispatch and after decode. The shared observed credential revision prevents the tested pending-callback and observed ABA returns. Successful reader cleanup precedes the final credential check; intrinsic signal listener removal avoids another caller cleanup callback after selecting private success. Reentrant replacement, throwing credential/cleanup callbacks and final cancellation do not return private success in the executed cases. Like the author report, this review requires the real token supplier to expose the current credential: an unreported session change after its last snapshot cannot be discovered through this API alone. That is a genuine composition gate, not a successful session/currentness substitute.

Source inspection confirms the underlying Plan path uses the actual activated server policy, enrolled permanent principal, live provider session, finite task/client/draft/source scope, revision checks and exact approval target. Client-scoped create has originating scope; draft-scoped grants do not become create authority. Agents cannot mark human review/approval or issue their own grants. Exact publication still requires actual human authority, exact client/content/assignment/publisher/grant and applicable verified first payment or later coverage. The SDK changes none of those SQL rights and exposes no raw Source operation or financial authority. No new enrollment product, hardware key or paid provider prerequisite was introduced. These are inspected invariants, not executed SQL/ACL acceptance.

## Consolidated findings and original/regression evidence

**New actionable findings: none.** The complete allocated candidate was reviewed beyond the three known fixes. The following stable IDs retain their original severity and bounded proof:

| ID / severity | Historical OLD evidence, preserved separately | Independent CURRENT evidence and disposition |
| --- | --- | --- |
| **AG1 / P2** | Author `cleanup-red.log`, exit1, **23/24**, targeted stale successful return after reader cleanup; SHA-256 `adfc3f0558b5f6a3e9cdcf13449032d00ba87e7a9ff8dc4614446dffc3e29869`. Author correction24/24 is separately retained. | Exact supplied CURRENT mutation `caf70b9e88384e02fd70da98a10d7ab8cd7878f0b2a425f25f55cadf15a77841`, exit1 **28/29**, only cleanup predicate fails. Candidate29/29 plus independent abort/throw cleanup cases pass. **ADDRESSED for this deliberate native cleanup-hook vector**; naturally mounted reachability remains unproved. |
| **AG2 / P2** | Author `concurrent-credential-red.log`, exit1 **24/26**, pending credential replacement and observed ABA each miss required rejection; SHA-256 `2ef193b6283c2c998c429eeba7585f6db80340fe6f9eeb1ca45b1809b7941128`. Author correction26/26 is separate. | Exact CURRENT mutation `16a85de6cded66f112ce2f97556488fdccd977b1715b4ed24c8ade7f02c734b3`, exit1 **27/29**, the same two predicates fail. Candidate29/29 and independent final-callback reentrant peer replacement pass. **ADDRESSED for observed replacement/ABA**; no genuine revocation claim. |
| **AG3 / P3** | Author `denial-code-red.log`, exit1 **28/29**, `candidate_inactive` lost to `forbidden`; SHA-256 `065f053e202ff78e581921de3f7ef61647b5409082038c42907692cb17369552`. The separate file named `denial-code-green.log` also exits1 and is **not green**: its synthetic upstream403 is normalized by the real handler. Corrected400 transcript29/29 is separately retained. | Exact CURRENT mutation `ade53a60b151f77a8889e8294443a8793f8a853fd361312b0b94ee42ee6f59a9`, exit1 **28/29**, matching-code predicate fails. Candidate29/29 retains matching safe codes and received status on failed body/cleanup. **ADDRESSED.** |

All three negative fixtures retain the entire exact current29 test file, SHA-256 `b9501d60f90a493c4ff49e29cb05a201f59fc1a812e4499b7f0745e33a3f86ab`, and unchanged Root dependency bytes. Their SDK mutations are deliberately failing sensitivity controls of CURRENT, **not immutable OLD SDK revisions**. The implementation's first immutable commit already contains all three corrections; no older authored SDK source snapshot was supplied for exact historical replay. Historical raw logs were verified/read, not relabelled as fresh execution. No minimally adapted OLD or separately approved successor SDK was invented. Initial missing-module20 (1 pass/19 failures), intermediate20, cleanup24, concurrency26, earlier28, raw AG3 setup failure29 and current29 remain distinct.

## Fresh commands, exits and replay limitations

In the following table, `N` is exactly `/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node` and `E` is the absolute evidence home above. Full literal argv/cwd and raw output hashes are preserved in the result JSON and consolidated manifest. All commands execute inside the own checkout or own ignored fixtures.

| Command / cwd | Raw log | Exit and actual result |
| --- | --- | --- |
| `N --experimental-strip-types tests/portal-plan-agent-client.test.ts`, cwd `E/current` | `current.log` | **0, 29/29** |
| Same unchanged suite, cwd `E/negative-controls/AG1-cleanup` | `negative-controls-AG1-cleanup.log` | **1, 28/29**, targeted AG1 failure |
| Same, cwd `E/negative-controls/AG2-credential` | `negative-controls-AG2-credential.log` | **1, 27/29**, targeted two AG2 failures |
| Same, cwd `E/negative-controls/AG3-denial` | `negative-controls-AG3-denial.log` | **1, 28/29**, targeted AG3 failure |
| `N --experimental-strip-types tests/portal-rebuild-domain.test.ts`, cwd `E/current`, initial minimal fixture | `portal-rebuild-domain.log` | **1, 7/8**: missing `tests/fixtures/concierge-presentation.json`, reviewer setup failure |
| Identical command/assertions after materializing that exact frozen Git JSON fixture | `portal-rebuild-domain-complete-fixture.log` | **0, 8/8**; original failure retained |
| `N --experimental-strip-types tests/portal-rebuild-handler.test.ts`, cwd `E/current` | `portal-rebuild-handler.log` | **0, 3/3** |
| `N --experimental-strip-types tests/portal-rebuild-advisor-reads.test.ts`, cwd `E/current` | `portal-rebuild-advisor-reads.log` | **0, 5/5** |
| `N --experimental-strip-types tests/portal-rebuild-advisor-handler.test.ts`, cwd `E/current` | `portal-rebuild-advisor-handler.log` | **0, 3/3** |
| `N --experimental-strip-types tests/independent.test.ts`, cwd `E/current` | `independent-initial.log` | **0, 15/15**, own independent probes |
| `N --experimental-strip-types --check src/clients/PortalPlanAgent.ts`, cwd `E/current` | `syntax.log` | **0**, syntax only |
| `N --experimental-strip-types E/trace.mjs`, cwd `E/current` | `current-trace.log` | **0, unchanged29/29**, actual12 fingerprint matches |
| Final report link/scope/hash checks and `git diff --check` | `report-validation.json` and terminal manifest | **0** before sole report commit |

Independent15 exercise an ordered create/save/assign/compare/apply/validate/preview transcript through the **actual SDK, handler, Auth/RPC runtime and Root codecs**; malformed selector/header/actor/approval/code/symbol rejection before credentials; wrong returned draft identity; safe scope/revision/payment/approval denial transport; final-credential reentrant replacement; aborting/throwing cleanup and known denial fidelity; sequential pull/backpressure; split actual-byte overflow with rejecting cancellation; empty/truncated UTF8/unknown error handling; final callback abort; command detachment during held credentials; lawful parallel calls; and the single absolute deadline. The original unchanged29 separately cover inclusive500000/2000000 bounds, rich>100000 drafts, naturally expired token during body receipt, late fetch cancellation, all ten required draft DTO operations, exact retry/status, stalled credentials/body/cancel and observed ABA.

Every successful Auth response and RPC result is explicitly a **closed synthetic transcript**. The ordered workflow does not implement or prove persistence, enrollment, SQL grant enforcement, payment verification, exact approval or journal idempotency. Its denial cases test the real handler/client transport and mapping of synthetic SQL errors. Native Request/Response/ReadableStream objects and wall-clock deadlines are real Node behavior; no listener, server, browser or genuine network call was used. Existing Node typeless-package warnings remain in raw logs and were not bypassed by changing package configuration.

No material source finding invalidated dependent permitted execution. The one retained-suite setup failure prevented its omitted legacy fixture case until the exact input was supplied; it was not a product failure, assertion adaptation or waiver. Strict checks are **UNRUN because dependency/compiler custody is missing**. Full npm/Expo suites are **UNRUN by allocation and central scheduling**, not failures. DB/Auth/Storage/native/browser/provider/deployment/reset/process-adoption checks are **UNRUN because no grant exists**, not passed or attempted.

## Admission and remaining gates

1. Parent may use this scoped review for the exact two-path client source candidate. Before admission, compare exact owned postimages and dependencies with the live integration postimage; do not import unrelated ancestors. Run the required strict root/test graphs using legitimately acquired exact compiler dependencies. This review does not waive those checks or accept newer shared-runtime postimages by association.
2. Root/plan-platform ownership still owes actual activated policy, permanent agent principal, configured live credential/session, owner-issued finite task/client/draft/source permissions, and real same-handler persisted create/edit/save/assign/import/preview behavior. Genuine wrong-client/scope, expiry/revocation during waits, exact retry/status and unchanged denied effects need their own authorized execution.
3. Publication still requires independently verified human review/exact approval/client/revision/actor/grant and applicable first-service payment or later coverage, with real concurrency/rollback/outbox evidence. Synthetic denial transport is not SQL or financial acceptance. Sami's policy setting cannot supply agent or source authority.
4. Actual external-agent/CLI/application credential lifecycle and raw Source context/consent/storage producers remain separate owned work. The client supplies no enrollment/provisioning or Source capability. Unreported token-supplier changes and naturally mounted observer behavior need genuine composition verification.
5. The approved private response cap does not close complete-history availability above2,000,000 bytes. Parent/Root must provide and verify the permitted larger-history/pagination behavior before full agent workflow acceptance; silently dropping history or partial mapping is unacceptable.
6. Later genuine Auth/Edge/PostgREST/SQL/ACL/Storage, actual browser/user flows, integrated current-head CI, full required builds/migration checks, human/visual/accessibility and release gates remain. Historical backend passes retain their original heads and proof level. Guidance/M65 holds remain unaccepted and unchanged.

Only this report is an authored tracked change. No Root/foreign worktree writes, production/test fixes, dependency changes, nested agents, native resources, push/PR/comment/watch/merge, deployment or live client action occurred. Parent retains integration records and shared `CONTEXT_SYNC.md` ownership.
