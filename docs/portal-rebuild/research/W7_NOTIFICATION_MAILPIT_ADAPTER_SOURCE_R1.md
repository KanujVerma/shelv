# W7 standalone Mailpit SMTP adapter: independent source R1

Owner: Kanuj. Review date: 2 November 2026. Frozen candidate: `107a0678c58add60a3b47655ada49d3bb47f243d`.

**Specification: CHANGES REQUIRED, SMTP1/P2. Correctness/quality: CHANGES REQUIRED, SMTP1/P2.** Complete candidate semantics and the prior findings were reviewed. Independent execution acceptance is **INCOMPLETE**: the unchanged 29 SMTP tests pass, but a new finite VM counterexample returns uncertainty for a definitively undispatched body. Dependent retained regressions and compiler checks were held after that finding. No production/test correction, input commit, worker activation, actual socket, Mailpit operation or delivery acceptance is supplied.

## SMTP1/P2: dispatch is recorded before the body write's final guards

In candidate `supabase/functions/concierge-notifications/mailpitSmtp.ts:180`, `dispatched=true` precedes `await write(data)`. However, `write` first calls `check()` at line153 and calls it again at line164, before invoking the actual captured `ownSocket.write` at line165. Deadline expiry at either guard therefore prevents every body write while leaving `dispatched=true`. Both the catch at line189 and finalization at line198 classify that known-unsent exchange as `uncertain`.

The complete SMTP1 path reaches DATA/354 and successfully completes the fourth revalidation. The finite clock then reaches the already established absolute `notAfter` at one of those two final guards. The actual parser, exchange, checks, serializer and status logic run unchanged; the socket transcript records EHLO, MAIL, RCPT and DATA, **zero body writes**, and destruction of the captured socket. The result is nevertheless `{status:'uncertain',errorCode:'smtp_scope_ended'}`. This is a status-classification defect, not a late body write or an unauthorized recipient disclosure.

The allocation requires definitive failure before dispatch to be `failed`, reserving uncertainty for a body-write attempt whose side effect cannot be ruled out. The frozen kernel also deliberately refuses ordinary retry of uncertain notifications with `reconciliation_unavailable`. A future composition that faithfully records this adapter result could therefore strand an unsent notification behind the reconciliation gate. That composition consequence is source-derived; no worker/SQL state or real message was exercised here. No duplicate send, production incident, permanent loss or authority bypass is established.

**Required correction:** move the body-dispatch transition to the actual socket-write boundary, after every guard that can still definitively prevent the invocation, while keeping it before the potentially side-effecting/throwing socket write. Preserve uncertainty for synchronous socket-write throws, callback errors, lost/malformed/late final acknowledgments, cancellation and cleanup after an actual body attempt. Keep the absolute deadline, all revalidation fences and the frozen worker contract. Add the two boundary cases and adjacent controls without changing original predicates. The author must correct this; a fresh independent task must review the correction and complete the held checks.

## Independent finite proof

Evidence home: `.local-artifacts/smtp-r1/`, in this reviewer checkout only. `run.py` captures expanded argv/cwd, combined output, elapsed time, actual exit and output SHA256, printing `TRUE_EXIT` before exclusive result creation. Every Node invocation uses `/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node`, verified v22.23.0.

The unmodified candidate test file was materialized from Git into an ignored fixture with its exact neutral-codec graph. Its original finite `net.Socket` transcript harness executes the actual CommonJS-transpiled implementation. Only synthetic socket I/O is injected. Module-load socket construction, unexpected resource imports, external fetch, storage and random UUID generation are trapped. A no-op revalidation callback is a synthetic adapter-contract input, never genuine SQL/actor/session/lease authority. No adapter result or state machine is stubbed as accepted.

The reviewer programs reuse that inspected finite harness, with new assertions and a controlled nonregressing wall clock. After the fourth callback, selected clock-read positions advance to the fixed expiry; clocks, limits and authority implementations in production source are unchanged. This models an expiry crossing at a specific existing guard. It is not evidence of an observed native scheduling incident. The VM monotonic clock remains real, and every socket in these observations is a transcript double.

| Bounded v2 case | Actual body `Socket.write` calls | Actual outcome | Predicate |
| --- | --- | --- | --- |
| Live exchange, no expiry | 1 | accepted, parsed `Q-123` | PASS |
| Expiry at read4 after callback4, before dispatch flag | 0 | failed | PASS |
| Expiry at read5, outer body-write guard | 0 | uncertain | **FAIL: required failed** |
| Expiry at read6, inner guard immediately before socket write | 0 | uncertain | **FAIL: required failed** |
| Expiry at read7, after socket body write invocation | 1 | uncertain | PASS |

All five cases complete four revalidations and destroy their captured sockets. No body is resent. `dispatch-boundary-v2.json` records **3/5 pass, 2 fail, zero skipped/cancelled, exit1**. The original `independent-dispatch-boundary.json` remains separate: one failing test with seven enumerated clock positions, including the same two counterexamples, **exit1**. Those seven observations are not seven passing tests. V2 narrows the matrix and adds explicit body-attempt and destruction controls; it does not adapt production inputs, statuses or assertions to get green.

Exact commands, from the reviewer root:

```text
python3 .local-artifacts/smtp-r1/run.py current-author29 /Users/kanuj/.nvm/versions/node/v22.23.0/bin/node --experimental-strip-types --test .local-artifacts/smtp-r1/fixture/tests/portal-notification-mailpit-smtp.test.ts
python3 .local-artifacts/smtp-r1/run.py independent-dispatch-boundary /Users/kanuj/.nvm/versions/node/v22.23.0/bin/node --experimental-strip-types --test .local-artifacts/smtp-r1/fixture/tests/independent.test.ts
python3 .local-artifacts/smtp-r1/run.py dispatch-boundary-v2 /Users/kanuj/.nvm/versions/node/v22.23.0/bin/node --experimental-strip-types --test .local-artifacts/smtp-r1/fixture/tests/dispatch-boundary-v2.test.ts
```

Exits, respectively: **0, 1, 1**. The first command passes **29/29**, zero failed/skipped/cancelled, on the exact candidate. Existing Node typeless-package warnings are retained. The parent received SMTP1 immediately after the first failing probe. Only bounded finding controls, semantic source review, custody checks and reporting followed.

## Full allocated requirements and semantic review

The authoritative original `mailpit_adapter` entry was read in full from Parent's `refill-active-20261102-0615.json`. The literal brief is retained in ignored `author-allocation.json`; UTF8 brief SHA256 `9a6ec4a15204d9fec2d8e402f80b08ccd67ebe138b0a22331b631dff90fbbf5e`. The following preserves the full requirement set and its evidence limits rather than reducing the review to SMTP1.

| Original requirement | Candidate/source review and bounded evidence |
| --- | --- |
| Only three new author files; existing worker, neutral codec, filesystem sink, SQL, Root DTOs, shared Auth/routes frozen | Exact base-to-candidate diff contains only the three additions below. Existing worker kind remains literal `local_synthetic_filesystem`; no union widening, index, runner or self-activation. |
| Standalone `createMailpitNotificationAdapter`; new `local_mailpit_smtp` kind; actual `NeutralNotificationEmail` and `AdapterResult` | Exact public factory/type and actual type-only imports match the proposed seam. It cannot be passed to the existing worker without a separate integration pin. |
| Literal `127.0.0.1` or `::1`, integer port1..65535, fixed `shelv@synthetic.invalid`, integer timeout1..10000 | Closed own-data config copy; invalid/DNS/external/URL/credential/AUTH/routing/header fields deny before socket construction. Source and unchanged29 cover both families and malformed values. |
| Exact neutral payload; only synthetic recipients; no sensitive facts, control characters, injection or arbitrary headers | Actual frozen codec validates delivery UUID, fixed subject/text and allowed destination. Adapter restricts ASCII synthetic.invalid recipients and canonical synthetic HTTPS links without port/credentials/controls; MIME headers are fixed or validated. Unknown actor/authority fields, accessors and symbols deny. |
| No module-load I/O, config/credential discovery or invented identity | `new Socket` occurs inside send after initial revalidation. No environment read, AUTH command, random UUID or invented receipt exists. Actual delivery UUID gives the stable Message-ID. Same Message-ID is explicitly not SMTP deduplication; there is no retry/resend. |
| Mandatory operation notAfter, actual AbortSignal and async void revalidate; missing/failed clocks/context deny | Strict own-data operation copy, valid calendar/explicit offset parsing, finite/nonregressing wall and monotonic checks, async-void validation and no default authority callback. Current29 cover malformed callback values, expiry, bad clocks, abort and rollover. |
| One absolute minimum deadline through connection, command/revalidation/reply/write/backpressure/cleanup; never renewed | Fixed wall/monotonic endpoints and one timer are checked around awaits and writes. Pending callbacks cannot resume SMTP after retirement. SMTP1 is the remaining definitive-failure classification error at that boundary, not a renewed budget. |
| Revalidate before recipient exposure and DATA, including after354; future trusted actor/session/lease/body binding | Four callbacks: before constructing socket, before RCPT, before DATA, after354 before body. Captured neutral/config/operation values survive caller mutation. Actual fixed-SQL authority and immutable context binding remain future worker duties; no callback itself grants them. |
| Capture operation/socket ownership; fence waits, callbacks, abort, deadline and reentry; no socket reuse/late writes | Private active token rejects concurrent/reentrant send. Each send captures its own socket; finalization revokes alive before disposal and releases only its token. Late old socket/error/write callbacks cannot affect a later send. Current29 exercise these source seams. Already exposed bytes cannot be recalled. |
| Actual Node net.Socket implementation, bounded strict SMTP state/parser | Source imports Node Socket and runs greeting/EHLO/MAIL/RCPT/DATA/body/QUIT. CRLF, fatal UTF8, control/code/separator/multiline/state checks;512-byte lines,32 reply lines,8192 buffered and32768 total reply bytes. Unsolicited/wrong/interrupted replies fail closed. Genuine Node event scheduling is unrun. |
| Safe MIME, CRLF, dot stuffing, wire bounds, same-message identity | Fixed From/Subject, validated To, actual delivery Message-ID; neutral text CRLF conversion/dot stuffing,8192 total bytes and998-byte lines. The private serializer test is explicitly pure; non-neutral dot-line bodies still fail actual send before connect. |
| Acceptance only from final250 queue acknowledgment with bounded parsed provider ID | Actual final acknowledgment grammar requires one `250 2.0.0 Ok: queued as ID` line, bounded1..128 ASCII ID. QUIT/221, captured close and final checks precede accepted. Missing/malformed/lost final reply stays uncertain after a body attempt. Actual Mailpit version/grammar remain unverified. |
| Predispatch definitive failure failed; after-dispatch side effects uncertain; no fabricated delivery/read/dedup | **SMTP1 fails the predispatch half.** Source otherwise preserves uncertainty after actual socket-write attempts/errors/late ACK/abort/cleanup failure. Acceptance is queue acceptance only. |
| Abort/backpressure/throw/cleanup closes captured own socket; late callback rejection observed | `write` waits for callback plus drain where required; observed rejection handlers prevent late unhandled write errors. Stop/finalization destroy the captured socket. Current29 include throw, pending close and deliberately reentrant cleanup controls; no OS-close guarantee follows from a throwing double. |
| Finite VM transcripts through actual code, not adapter.accepted/authority/operation/Vault stubs | Exact29 reproduced and SMTP1 proved through actual state machine. No actual socket/listener/status/cached image/server/browser/native/provider was invoked. |
| Preserve original tests/raw failures, run focused regressions/strong actual types, leave full suites centrally scheduled | New29 reproduced unchanged. Retained39 and strong/configured type graphs held after SMTP1; author totals remain separately attributed below. No old test, flag, declaration, package or lock changed. |
| Future worker union, trusted fixed SQL/context and deadlines, explicit selected local fixture URL only | All remain separate unimplemented/unaccepted integration gates. No new SQL writer/allocation, caller authority selector or blanket HTTPS relaxation. Genuine local queue ACK, no-relay and provider/delivery verification remain separate. |

No additional actionable source finding was established after reading the entire206-line implementation, complete215-line candidate test and complete author report. This is semantic review coverage, not a blanket execution PASS. Deliberate VM fault hooks and accepted synthetic replies do not prove actual authority, native cancellation, physical close or delivery.

## Prior findings and OLD/current evidence

Read the complete W1 notification kernel report with N1/N2 responses, immutable kernel R1 `b22428b649ff4d68062170a2367e2420a2b8c990`, [kernel R2](W7_NOTIFICATIONS_SOURCE_R2.md), [kernel R3](W7_NOTIFICATIONS_SOURCE_R3.md), [transport R3](W7_NOTIFICATION_TRANSPORT_SOURCE_R3.md), and [native executor R4](W7_NOTIFICATIONS_NATIVE_EXECUTOR_SOURCE_R4.md), plus actual frozen `neutralPayload.ts`, `worker.ts`, `localSink.ts` and their relevant codec inputs.

N1 cross-family collision and N2 denial-body provenance retain kernel R3's bounded source closures; SQL/catalog/concurrency remain unrun. Shared NT2 final relevance and native NE4 setup/finalization retain their held historical scopes. This review neither reruns nor closes them. No provider-refused Guidance/M65 work was reopened or rerouted.

Author68 is **29 SMTP VM +39 retained**, not68 SMTP/socket tests. This reviewer independently reproduces only the exact29. The retained39 filesystem/finite-HTTP cases, strict TypeScript226 files/57 own, and configured Root app/test exit0 results remain **attributed author evidence**, not reviewer passes. Their underlying original logs were hashed in place, not executed from the foreign checkout or recursively copied.

Author OLD raw distinctions remain: missing-adapter0/20; first implementation8/20 with VM realm/test-expression issues; corrected boundary19/20; actual-source23/25 for malformed revalidation and unhandled late rejection; corrected25/25;65/65 with26+39;27/27 retirement cases; separate notAfter0/2; current68/68. Initial strict exit2 and later strict exit0 are separate. The two historical RED logs were read in full. Exact pre-fix SMTP postimages are not supplied as immutable commits in this packet, so no reconstruction or independent OLD replay of those author failures is claimed. Current29 confirms their present predicates without changing their old raw outcomes. There is no minimally adapted historical-green result or approved successor in this review.

## Exact source and dependency custody

Own T3-managed workspace `/Users/kanuj/.t3/worktrees/shelv/t3-32621cec`, initially clean at **`8af746d197b976972d4b16924155afa8c3b32d44`**, which is also the exact author candidate parent. No cherry-pick, rebase or input-only commit was made. Only necessary frozen source/test inputs were materialized from Git into ignored `fixture/`; candidate-manifest.json binds all18 input paths. The report commit contains no candidate production/test input.

The complete candidate manifest is `.local-artifacts/smtp-r1/candidate-complete-manifest.json`:

| Candidate addition, mode100644 | Exact Git blob | SHA256 |
| --- | --- | --- |
| `supabase/functions/concierge-notifications/mailpitSmtp.ts` | `dcbb75ffc15976ac215252cbd202a3d384a26639` | `877f40f80590adfc651def29666fb5bbd4b16333f53d21e1e69508809482445c` |
| `tests/portal-notification-mailpit-smtp.test.ts` | `f77e9e3b8e8bef5671639081c934dfaf8db25ebe` | `f47ac2955a0e72bc708c472ee127a24abec500046f39182b56eb536e8a2dc45b` |
| `docs/portal-rebuild/research/W1_NOTIFICATION_MAILPIT_ADAPTER_SOURCE.md` | `d364a6fee09d9c8659e3b27128a938c247afdf40` | `d2413dc2ea2d21c2641e5a33e08e488bd7da42ee28686fd66ea835de7fadbd6c` |

All2,128 initial tracked paths, including66 migrations/121 SQL files, existing notification code/tests, root/portal packages/locks, config/eight role files and91 tracked session-runtime files are preserved by full byte/mode/kind/literal-link readback. Candidate inputs remain exact and separate from owned output. Parent original integration and all foreign worktrees were read only.

Both own dependency roots were initially absent. Before the conditional root-only APFS clone, custody checked actual own/Parent packages and **four physical lock inputs**, all91 runtime paths, nonsymlink roots/ancestors, same device, ignored absent destinations and complete source byte/mode/kind/literal-link inventory. Relative root dependency links resolve within their own tree. Only `/bin/cp -cR Parent/node_modules ./node_modules` acquired dependencies; no portal dependency tree was cloned or needed. Complete before-probe and terminal parity is43,213 entries including the root. Root inventory fingerprint SHA256 is `1bbab5f58236f78d8eb05b76aa86bb06b77b6a5705c2bea4652ef2ba5517d0dd`; actual TypeScript package is6.0.3. No install, shim, generated runtime, foreign executable, package/config/lock/flag/declaration change occurred.

Own and Parent root lock SHA256 remains `5c57c9aec9e4585066e032e234d610a77cbffd9a51f82700c158fc37fe01b5c2`; portal lock remains `bc914f3a9c9f24e44f02e3cff2804651147385ea5abda58a064531329ef23203`. Raw author files are hashed in place in author-raw-hashes.json; no historical archive or Auth state was copied. The retained approved original is95,388 bytes, SHA256 `c45701f9f54fd2b1dbb09bbd7aa2b9b437e9059aa6032b6f39411fe2e7f6efbd`. Applicable AGENTS, WORKFLOW, rebuild entry/GOAL/D01-D48/desktop specification/contracts/addenda/workstreams, original notification sections and relevant complete continuation/custody sections govern. Historical roster labels supply no current authority.

Initial and final read-only `t3_thread_configure` with modelSelection omitted verify actual self and current Parent `9b085ada-435f-48d6-8886-957c1ce3e82d`: **codex/gpt-6.1-sol/reasoningEffort=xhigh/serviceTier=default**. Project config and eight role files remain Parent-exact Sol/xhigh bytes/modes. No model/config change, fallback or nested agent occurred. The separately forwarded authoritative taskId is:

`node:delegated-task:command%3Amcp%3Aafb222dc-28b4-420b-9474-b05bc6eeba89%3Adelegate-task%3Acontinuation-20261102-smtp-adapter-r1`

It is not inferred from the separate backing threadId or run. Parent retains sole integration/Maya ownership. Ordinary Git found no hooksPath override or active hook; no hook bypass, remote fetch/write, push/PR/comment/watch/merge or deployment occurred.

## Prevented checks, unrun gates and handoff

**Prevented by SMTP1:** independent retained39 execution, complete combined68 acceptance, dedicated strong transitive graph and configured Root application/test typechecks. Availability of own exact dependencies does not turn those unrun commands green. No broader compiler, bundle or product check ran after the finding.

**Unrun by allocation, independent of SMTP1:** full npm/portal/Expo/native builds and suites; actual socket/listener/Mailpit, genuine queue acknowledgment and version/ID grammar; actual SQL/Auth/current actor/session/lease/recipient/body/context, RLS/catalog/concurrency; native-executor recipe/grant; provider configuration/credentials/no-relay/no-auto-forward; authenticated delivery/bounce/reconciliation/webhooks; worker/Root/cookie/gateway/App mounting/inbox/A06/retry/sign-in destination behavior; browser/visual/accessibility/human/business/CI/release. Source/VM/SSR evidence grants none of these. No resource was acquired that required STOP, adoption or process cleanup.

**Integration gate:** do not admit this adapter from this report. The author must correct SMTP1, retain original29 plus new boundary controls, and obtain a fresh independent review completing the held focused matrix. A separately pinned worker union and trusted fixed-SQL context/deadline composition are still required afterward. Any explicit local fixture URL pin must preserve exact origin/port/path/credentials and fixed RPC/abort/deadline boundaries, with no blanket HTTPS relaxation. Genuine local no-relay queue proof needs a new exact resource grant and accepted executor. Even that proof would establish local queue acceptance, not real-recipient delivery/read or release acceptance.

Only this new report is authored in tracked files. Final own diff/link/whitespace checks, complete protected-source/dependency parity and the ordinary report-only commit are recorded in ignored terminal evidence. Return only that report commit, candidate manifest and SMTP1/P2; exclude every ignored fixture/probe/dependency. Parent owns canonical status/CONTEXT_SYNC and subsequent dispatch/composition. The complete approved portal goal remains open.
