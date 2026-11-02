# Account profile producer: independent SOURCE R1

Owner: Kanuj. Date: 2 November 2026. Review of frozen code/tests `9e5ee407ddfed7a56fb120e527d19ec35862e779` and sole author report `d0971a2b343410b476a4d30ca70da31cc9d4a1fc` against exact base `482f1d5e6277dc3365e3d92156eaa3ca862537ae`.

**SPEC/completeness: FAIL for the bounded producer, AP1/P2. Correctness/quality: FAIL, AP1/P2.** The deadline refuses the late value, but one late-response path never initiates body cancellation. The full family was reviewed after finding AP1; no second material finding was established. SQL semantics below are source assessments with native checks UNRUN, not SQL acceptance. No gateway, Account mount, Root admission, genuine acceptance or release follows this review.

The complete approved Profile/contact/Account and D01-D48/26-screen goal remains open. This two-command name/current-email producer intentionally does not implement email change/verification sending, complete contact forms, address/service/cancellation, consent, downloads or the complete connected journeys. Its narrower source allocation does not reduce those requirements. Those existing gaps are distinct from AP1.

## Consolidated finding

### AP1 / P2: wall-clock expiry before the timer callback strands the received response body

Frozen locations: `supabase/functions/concierge-account-profile/runtime.ts:20-26`, `body.ts:14-27`, `handler.ts:49-53`.

`accountProfileWait` checks the registered absolute deadline after the transport promise resolves. `exchange` retires a received success body only when `signal.aborted` is already true. A response can arrive after the absolute deadline while its timer callback has not run, for example after a synchronous callback/event-loop delay or a forward clock step. The wait then throws 503 before `decode` acquires the body. The handler's `finally` clears the timer. No path subsequently calls `response.body.cancel()` and the signal remains un-aborted.

Independent reproduction uses the actual frozen codec, handler and runtime with native Request/Response/ReadableStream and a closed injected fetch. At the first Auth exchange, the fetch advances mock wall time by 10,001 ms without firing timers and returns a native 200 Response whose stream records `cancel()`. The handler returns safe 503. After microtask turns and another 60,000 ms of mock timer advancement, the observed record is:

```json
{"status":503,"cancelled":0,"signalAborted":false,"clock":1793577670001}
```

The required cancellation assertion fails `0 !== 1`; the exact frozen candidate remains unchanged. The companion positive control aborts the real incoming request, releases a later native success and observes one cancellation. Received 401/403 still wins over a reentrant deadline and throwing cleanup. Thus AP1 concerns the deadline-without-abort success path, rather than denial classification generally.

Impact is failure to initiate promised best-effort retirement of a received late body. No private 200, completed physical provider work, real socket leak, real Auth revocation or persistence effect was demonstrated. The common exchange path is implicated by source; the executed AP1 case is first Auth, not every RPC position or a mounted browser.

The implementation owner should retire the received response when the **same registered absolute deadline** refuses it, including before an abort event fires. Keep known-received denial precedence, the one-operation budget, bounded cleanup and truthful uncertainty. Do not renew the timeout or claim physical cleanup completion. Retain this negative case and the abort/denial controls for a fresh complete independent round. No fix was made by this reviewer.

## Identity, authority and immutable inputs

- Literal actual task ID, separately forwarded by the coordinator: `node:delegated-task:command%3Amcp%3Aafb222dc-28b4-420b-9474-b05bc6eeba89%3Adelegate-task%3Acontinuation-20261102-account-profile-review-r1`.
- Actual self thread from configure READ: `thread:delegated-task:command%3Amcp%3Aafb222dc-28b4-420b-9474-b05bc6eeba89%3Adelegate-task%3Acontinuation-20261102-account-profile-review-r1`. Task and thread are not interchangeable.
- Parent T3 thread `9b085ada-435f-48d6-8886-957c1ce3e82d` was read, and both self and parent were independently read with `t3_thread_configure`, omitting `modelSelection`: instance `codex`, model `gpt-6.1-sol`, reasoning `xhigh`, service tier `default`, interaction `default`. Repeated readback and full results are in the ignored `thread-settings.json`; no settings changed.
- Own managed checkout `/Users/kanuj/.t3/worktrees/shelv/t3-2eb6463d`, branch `t3/account-profile-source-review`, initially clean at exact base `482f1d5e6277dc3365e3d92156eaa3ca862537ae`.
- Explicit executable `/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node`, observed `v22.23.0`.
- Author report is 21,934 bytes, SHA256 `72bf5ccda3af243945d5e10cb660217b8a863c32f2064a4dd62ede268be39e3e`, verified from its immutable Git blob.
- Original approved input is 95,388 bytes, SHA256 `c45701f9f54fd2b1dbb09bbd7aa2b9b437e9059aa6032b6f39411fe2e7f6efbd`. Invoked continuation at `/Users/kanuj/.t3/worktrees/shelv/kanuj-portal-rebuild-integration-20261030/docs/portal-rebuild/source/CONTINUATION_INPUT_20261102.txt` is 100,187 bytes, SHA256 `b428b318598df52f12ce3e6ea4ebd350ff9333ee05d9fd8f04a8e845d0c722bc`. Both were read and rehashed, with the original preserved. The continuation is a distinct complete document, not an asserted byte-equal prefix.
- Applicable inputs read: supplied/local AGENTS, portal AGENTS, personal WORKFLOW/TSTACK, rebuild entry point, full original including D01-D48/specification/manifest, continuation including its custody snapshot, C08/C08C/C08R, implementation contracts, addenda, workstreams and status. Historical roster/percentage/CI text was not promoted to current evidence. Source-only independent-review, Supabase source checklist and verification-before-completion instructions were applied within the explicit narrower grant. No network documentation, SQL or resource call was made.

All 2,180 baseline Git blobs/modes are identical between base and the frozen author head. The author's complete base-to-report diff contains exactly 13 NEW mode100644 paths below. All own physical baseline bytes/executable modes also match base before and at the terminal source guard. No production/test input was imported into this branch. Frozen files were extracted byte-exact into **own ignored** `candidate/`, with the two unchanged baseline runtime dependencies listed below; all execution used that owned closure. The delivery commit adds only this report directly to base. No W0/Entry/SMTP INPUT/correction ancestor, author code commit or author report commit is delivered as ancestry.

Coordinator-provided Root `b86`, draft PR211 stacked on PR210, all-three-CI-green and unmerged facts are context only. This child made no remote/PR/watch/merge/deployment call and did not newly certify them. Later disjoint parent App/gateway edits do not change these frozen review inputs.

## Full-family semantic review

| Surface | Source assessment and executed evidence | Remaining proof boundary |
| --- | --- | --- |
| Four contract modules | Exact schema1 read with no args and set with requestId/expectedRevision/displayName; fixed `concierge_account_profile_command_v1({p_command})`; unknown/authority/selector/email-write fields rejected. Required builder/result signatures and detached frozen records present. Six original contract tests reproduce. | Strip-types is execution, not strict TypeScript compilation. |
| Names and budgets | Exact case and boundary whitespace retained. `length(trim_text)`1..200 Unicode matches inspected legacy constraint/ECMAScript trim set, including non-trim NEL/MVS/ZWSP. NUL/unpaired UTF16 rejected. Independent Unicode/over-budget/exact-byte cases pass. No truncation or name reconstruction. | SQL character/byte enforcement UNRUN; invalid or over-budget legacy views remain unavailable at the mapper, not declared fully available. No new universal lawful name/email maximum is established. |
| Current email | Projection selects own actual `auth.users.email` and `email_confirmed_at`, missing/empty -> unknown. Pending email/JWT guesses do not supply contact facts. Codec accepts exact known address/verified fact or unknown, with no email-change/send operation. Independent email-only stable-view change returns409. | Actual Auth values, contact verification/change and UI remain separate. |
| Handler and closed runtime | Captures origins, methods, config URL/key/fetch, token, original identity and command across awaits. One actual operation signal; Auth -> fixed command -> Auth -> fixed own read -> Auth. Read compares stable mapped views; a write returns an immutable historical ACK despite a different later current name. Config mutation and identity-replacement controls pass. | No mounted adapter, actual Auth, genuine current SQL or browser proof. |
| Deadline, errors and cleanup | One deadline starts before first Auth; registered signal cannot be renewed; missing/unregistered/expired signals fail closed. Request8192/Auth8192/RPC16384 exact boundary controls pass. Request/Auth/RPC blocked reads and hanging overflow cleanup stay bounded. Local abort stays503; received401/403 captured before body/statusText/headers/cleanup. | AP1 remains. Cancelling a synthetic native stream is not physical provider cancellation. |
| Permanent own-client SQL authority | Public RPC grants only authenticated; server derives `auth.uid`, session UUID/expiry. Private authorizer calls actual `plan_session`, whose inspected body checks permanent Auth user, soft deletion/ban, profiles deletion fence and actual own unexpired session under SHARE locks. Any plan principal and active advisor deny; no selected-client/task right. Enrollment/case lookup follows identity checks; cancelled own clients can administer profile without care rights. | Actual SQL roles/signatures/RLS/Auth matrices and concurrency UNRUN. Caller token correlation alone is not authority. |
| Canonical CAS/all writers | Enrollment `FOR UPDATE` precedes request try-lock, lazy head and head/CAS. No enrollment SHARE authorizer followed by an UPDATE upgrade. New canonical-name AFTER trigger increments only on an actual distinct stored value, including existing explicit display-name writers. Same value creates no fake version. Actual Auth/role checks repeat after waits and before return; enrollment status and stable read projection are checked before return. Only canonical `enrollments.display_name` is updated. | Native same-profile races, legacy-writer ordering, reentrant expiry rollback and wait schedules are UNRUN. No global deadlock-freedom claim for all existing families. |
| Idempotency and privacy | Minimal private journal stores actor/request UUID,32-byte full accepted JSONB-command hash, previous/revision/time. No second name/email/command/result copy. Exact replay reauthorizes and reconstructs the historical accepted name only from the same verified original payload; changed payload conflicts. Receipt/current view remain strictly separate. Both new relations have RLS/revoked raw grants; helper EXECUTE revoked from PUBLIC/anon/authenticated/service_role. | Hash/UUID/time remain identifying metadata, not anonymization. Native hash/replay/grant behavior UNRUN. |
| Request lock/collisions | Same `concierge:request:<actor>:<uuid>` namespace uses `pg_try_advisory_xact_lock` after canonical row and before head/journal. Busy -> unavailable503, no stored request conflict. Actual authorization repeats after try-lock; existing trigger lock is reentrant. Whole six/eight predecessor preserved and profile appended only. | Native busy-lock503, bidirectional collisions and per-actor independence UNRUN. Commented multi-session schedules are not concurrency tests. |
| Source/type boundaries | Profile types carry only profile/current-contact or historical ACK fields, with no Source action, policy, raw material, consent or authority selector. The collision exception does not grant Source15/Account access or accept held Source kernel semantics. | Source SK2/SK3/SK4 and Guidance/M65 provider holds remain untouched and unaccepted. |
| Deletion and rollback | New head/journal FK to existing enrollment -> Auth cascade; existing Storage-first deletion fence/inventory/remove/verify/Auth-last endpoint bytes preserved. No new tombstone/retention exception, obligation clearance, deletion endpoint or cleanup claim. Rollback prose removes only new objects/hooks and guarded exact appended helper body, preserving actual accepted canonical names and six/eight restrictions. | Actual deletion/FK behavior, Storage/obligations and rollback rehearsal UNRUN. Unknown obligations are not clearance. |
| Existing domain preservation | Old2,180 paths/modes exact. New SQL writes no price, legacy amount, frozen order/address, payment/publication, approval/instruction, service/guarantee date or Source record. Authored nonempty quote/address/order/payment/approval/care sentinels were read. | Sentinel assertions and actual migration/data preservation remain UNRUN; source absence is not genuine financial clearance. |

### Collision-helper exception, entire predecessor and metadata

The exact Notifications six-journal helper body was independently extracted from base `20261101191527_portal_rebuild_notifications_v1.sql`:596 UTF8 bytes, SHA256 `26afa4244895b19a260c379b57a0c2a4292cd18983fa90241b805b8d102cc7dc`. The eight-journal body was separately extracted from immutable `b8a5dac9bb6b6cc69c0d6365d88f71b0b8117218:...20261102033048_portal_rebuild_source_kernel_v1.sql`:640 bytes, SHA256 `d5aa3b2a59c9f2cdf6cd10f67fa3d4f4bb8642d4cec56013255e1f029c418180`. The only body difference is both Source journals appended to all six prior journals. This is immutable helper-byte provenance only; the earlier Source migration remains unaccepted/unexecuted.

The new private **invoker** successor helper checks exact hash plus actual ordinary-table catalog membership: all six journals mandatory, Notifications body requires neither Source table, Source body requires both. Missing/partial/wrong-kind/newer body fails. It accepts no table list or authority flag. Fixed replacement appends only `account_profile_requests_v1`; no old restriction is dropped. This was independently verified against both immutable bodies, not inferred from the three regex tests.

The sole new migration snapshots the complete `pg_proc` JSON row excluding only `prosrc` and every old `pg_trigger` row. Its postcheck compares full row identity/OID, owner, ACL, defaults/attributes and all old bindings after CREATE OR REPLACE; unexpected changes abort the transaction. Only the new journal collision binding, new journal immutability binding and allocated additive enrollment name hook are added. No old trigger binding is rewritten. Actual metadata compatibility and both catalog lineages still require native replay; the pgTAP's lineage assertions do not perform that replay merely by existing.

## Executed commands, actual exits and preserved distinctions

Own ignored evidence home: `/Users/kanuj/.t3/worktrees/shelv/t3-2eb6463d/.local-artifacts/account-profile-review-r1/`. These files are not part of report delivery. A receiving owner must copy/hash exact inputs into its own authorized probe area before execution, rather than execute this foreign checkout.

| Run | True child exit / result | Scope and raw receipt |
| --- | --- | --- |
| Original absent-feature RED |1;0/2 test files pass, two module-not-found startup failures | Frozen contract/runtime tests copied unchanged into `original/`; base tree independently proves all producer paths absent. `original-red.{json,stdout,stderr}`. This is not32 behavioral failures. |
| Frozen candidate combined |0;32/32,0 fail/cancel/skip/todo |29 codec/handler/closed HTTP native-Response behaviors plus3 source-only migration text predicates. `candidate-32.{json,stdout,stderr}`. |
| Initial independent probes |1;7/8, AP1 fails | `independent.{json,stdout,stderr}`; no source/test fix. |
| Expanded independent probes |1;9/10, AP1 fails | `independent-final.{json,stdout,stderr}`; adds exact byte boundaries and hanging-cleanup checks. |
| Terminal independent probes |1;9/10, AP1 fails after additional mock time | `independent-terminal.{json,stdout,stderr}`; diagnostic above. |
| Independent source/custody guards |0 | `python3 .local-artifacts/account-profile-review-r1/source-guards.py`; checks all baseline Git/physical blobs/modes, frozen13-path copies, both input hashes and actual immutable six/eight bodies. No SQL execution. |
| Report-only validation |0 | Final `git diff --check`, staged diff check, link/scope and sole-path audit before commit; terminal clean-tree check after commit. |

Exact candidate argv, cwd `.../account-profile-review-r1/candidate`:

```sh
/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node --experimental-strip-types --test tests/portal-account-profile-contract.test.ts tests/portal-account-profile-runtime.test.ts tests/portal-account-profile-migration-source.test.ts
```

Exact original argv, cwd `.../account-profile-review-r1/original`:

```sh
/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node --experimental-strip-types --test tests/portal-account-profile-contract.test.ts tests/portal-account-profile-runtime.test.ts
```

Exact independent argv, cwd `.../account-profile-review-r1`:

```sh
/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node --experimental-strip-types --test independent.test.ts
```

The Python capture wrapper's own exit0 is not substituted for these child process exits; each JSON receipt records full argv, cwd and actual `subprocess.returncode`. Typeless-module and experimental MockTimers warnings were retained, with no package/config/flag suppression. The unchanged baseline closure consists of `src/contracts/ConciergePortalValidation.ts` and `supabase/migrations/20261101191527_portal_rebuild_notifications_v1.sql`; the transport configuration import is type-only and erased by strip-types. This minimal execution closure is not a strict compiler graph or a whole checkout/application build.

Independent controls exercise captured config mutation; stable-view email change without a name revision; identity replacement at both later Auth checks; received401/403 before deadline/body getters; expired/unregistered/nonrenewable signals; Unicode/raw whitespace and oversized legacy mapping; later-success cancellation after actual local abort; exact incoming/Auth/RPC byte limits; and hanging cancellation consuming the original deadline. These are independent negative controls through actual frozen code, without successful authority ports claimed as genuine proof. AP1 is the additional failing control. No author assertion was changed to obtain32/32.

Author report history is kept attributed: first implementation19/20 identity401-vs403 failure corrected before frozen code; later runtime18/19 wrong expected-bearer setup corrected without changing behavioral predicates; subsequent29 and32 passed. This reviewer did not execute those unavailable historical intermediate source states or relabel them green. Original absent-feature RED and frozen current32 were independently reproduced. There was no minimally adapted author fixture or approved successor needed for this replay; the ignored closure adds only exact retained imports. New independent results do not replace raw historical outcomes.

## Unrun, prevented and acceptance boundaries

- **Strict UNRUN.** Own Root and portal `node_modules` are absent. Read-only physical own/parent package manifests and all four root/portal lockfile comparison inputs match; the separate runtime lockfile matches too. Three tracked lockfiles and four physical own/parent root/portal lock inputs are different counts. This is only partial preflight. No APFS clone was acquired or needed for the bounded executable probes. Full ancestor/device/literal relative-link/source-byte/mode/link custody, runtime91 inventory and terminal clone parity were **not asserted**. The parent's declared five runtime target differences were not inferred away from a count. No compiler, dependency install, borrowed compiler or foreign generated runtime was used.
- **SQL/pgTAP/native/genuine UNRUN by explicit grant boundary, independently of AP1.** No SQL parsing/replay, Supabase CLI, database, actual catalog/RLS/role query, actual concurrency/session revocation, Auth/persistence, deletion/Storage or rollback execution. All186 authored pgTAP lines and schedules were read; the comments and regex tests supply no SQL pass.
- **Central/full checks UNRUN.** No full npm/Expo/iOS, configured full Root/frontend/session/test compiler graph or current CI. Parent historical green is not candidate acceptance.
- **Connected/browser/visual/human/release UNRUN.** No gateway/namespace/channel/Account mount, ordinary browser journey, actual profile/contact change, public preview,26-frame/mobile/a11y comparison, representative-human review, external provider, live client communication, funds, production permission/action or deployment.
- **Prevented by AP1:** an unqualified producer SOURCE acceptance and any dependent admission claim. The finding did not prevent the remaining static/finite semantic review, which was completed. Required genuine/browser/native checks remain separate gates rather than tests alleged to fail because of AP1.

No nested agents, source/test fixes, foreign execution/write, installs, config/flag/declaration edits, native resources or reset were performed. Source kernel SK2/SK3/SK4 and held Guidance/M65 reviews were neither retried nor rerouted. Only this report is committed; its commit and self-hash are supplied externally to avoid a self-reference cycle.

## Exact frozen13-path manifest

All entries are NEW mode100644 relative to exact base. Source/test entries belong to `9e5ee407`; the last entry is the separate `d0971a2b` report. Values were independently computed from Git and checked against the owned extracted bytes.

| Path | Bytes | SHA256 |
| --- | ---: | --- |
| `src/contracts/PortalAccountProfile.ts` |1425|`83ecdebe43b3e7e4f22f8e18aa2f87f333b49d8511bbf953ef5b341d4ec88529`|
| `src/contracts/PortalAccountProfileMapping.ts` |741|`356b42a2ea8f08db390a2bbed2c088e0a1287aebb1bbb1a289ab58321b22de49`|
| `src/contracts/PortalAccountProfileValidation.ts` |3806|`597de8113b9dbb9e0a6dbe947c7d8cd67c69ff587fe3ed3d245c21d0a3c64497`|
| `src/contracts/PortalAccountProfileValues.ts` |431|`26aca8407483a3f9ae9b3dedaa487864c1a69f717e8979eea65c655b373df6e3`|
| `supabase/functions/concierge-account-profile/body.ts` |2758|`29ed478b1359c1633f6e1dd6cee75f9c6c25919ccfa164780337c54c4e532ca3`|
| `supabase/functions/concierge-account-profile/handler.ts` |5139|`4f0263a34fb0c23de70934a252e3b085af510bb0d04143333b79a722c75d044f`|
| `supabase/functions/concierge-account-profile/runtime.ts` |4623|`1375ba754036ccb49be874300290dbfcfa72fa7588f822acbc7c644bab86985c`|
| `supabase/migrations/20261102110000_portal_rebuild_account_profile_v1.sql` |14756|`7dcde23039959d60dc1a964b50f22012991139e3d68d5889282ab4524c82b23b`|
| `supabase/tests/portal_account_profile_v1.sql` |26410|`847ff5166cb5e4d1a618d5f015487ddb65dd223bc894ede2607e0f3d12791957`|
| `tests/portal-account-profile-contract.test.ts` |4019|`3939deeb4f0d39641d0c0724edceb656ffbc0ff78a524e4764a7901cb1e59d1b`|
| `tests/portal-account-profile-migration-source.test.ts` |2994|`897f1ad3658cfecd6d662fdad46ee8753b727c0074fa70b416b304091a10c306`|
| `tests/portal-account-profile-runtime.test.ts` |12953|`dcbc076ae05bb8e7fd8674855b6c960ad06f77fd46d787be2c804cb275c5e8aa`|
| `docs/portal-rebuild/research/W1_ACCOUNT_PROFILE_PRODUCER_SOURCE.md` |21934|`72bf5ccda3af243945d5e10cb660217b8a863c32f2064a4dd62ede268be39e3e`|

Machine-readable local manifest: `manifest.json`; full baseline/lock custody: `source-custody.json`; final reproducible guard: `source-guards.py`. None is authority for Root admission or external resource execution. The next step is owner correction of AP1 with its regression, followed by a fresh complete independent source round and the still-separate strict, SQL, genuine, integration and full-goal gates.

Exact independent probe SHA256: `a39914f73ffe55a0a6f6a2c879843e36743504066ef2dbfb9098630d4270087f`. Exact source-guard script SHA256: `62a3ad6e54f30b405c84674c56368e9b6e4b50c2e5f5a55c1de4903c09abe9f2`. `receipt-manifest.json` preserves sizes/hashes of the local scripts, settings, input manifest, helper bodies and raw result receipts; terminal guard output/exit and the delivery receipt are recorded separately after the final audit.
