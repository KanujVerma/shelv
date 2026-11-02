# W7 notifications native executor: independent SOURCE R4

Owner: Kanuj. Review date: 1 November 2026 Chicago / 2 November UTC. **Report-only. SOURCE and pure negative assertion evidence; no accepted execution grant, native execution or resource acquisition.**

| Verdict | Result |
| --- | --- |
| Specification / completeness | **CHANGES REQUIRED; independent acceptance INCOMPLETE.** First new material finding **NE4/P2** leaves initial runtime preflight outside the absolute deadline and finalization boundary. Dependent acceptance stopped. |
| Correctness / evidence quality | **CHANGES REQUIRED, NE4/P2.** The actual runtime remains pending past its real cutoff until a delayed failing filesystem observation returns. NE1–NE3 have bounded current sensitivity only. |

The original executor R1 `cae64279b1735d0e46bfce8d8f36ed83ffadd325`, R2 `c0df8b29c162421868b7472d2a60c7e9eefa9dba` and R3 `b39a2ef449859dfbdfc4f37220b24be3a19453a1` FAILs remain immutable. Kernel R1/R2 FAIL and [kernel R3 bounded SOURCE PASS](W7_NOTIFICATIONS_SOURCE_R3.md) retain their scopes. This report issues **no `SOURCE_READY`, execution admission, notification acceptance or full-goal completion**. Guidance/M65 and refused tasks were not reopened.

## NE4/P2: initial runtime preflight can wait beyond the runtime cutoff

In the exact [executor](../../../tests/portal-notifications-native-executor.mjs), `Runtime.run` at line323 enters the runtime AsyncLocalStorage context, then calls `runRuntime`. The constructor has already established an absolute runtime deadline. However, lines325–329 execute **before** the `awaitDeadline` / `try` at line330 and its cleanup `finally` at line344:

- `fs/promises` import; `safeAncestors` and its awaited `lstat` calls; selected socket metadata and fresh-workdir absence.
- Network-module import and selected-port listen/close awaits.
- Initial workdir/evidence/Docker-config creation and config write, then the initial receipt.

The first filesystem await has neither a deadline wrapper nor an `operationDeadline` check. The initial receipt has its own bound, but it occurs after those earlier awaits and outside the cleanup `try/finally`. Thus a pending initial metadata operation can hold the native entry indefinitely instead of reaching the promised runtime deadline. An eventual error at that point bypasses the later cleanup/finalization boundary. This is a remaining finite-executor gap, not a claim that the later command-budget arithmetic still has the original NE3 defect.

**Independent bounded reproduction:** ignored `probes/preflight-deadline.mjs` loads exact own executor SHA256 **`33af5b6428939b03a3aa284b192fdf325d2743ab366a9c94c7207b857257908e`** in a closed Node VM and adds only an export of private `Runtime`. `import.meta.url` and ROOT bind the actual own candidate. It calls the actual **`Runtime.run -> runRuntime -> safeAncestors`** path with real Node AsyncLocalStorage. The filesystem module supplies only one deliberately delayed **failing** `lstat`; it supplies no successful path/socket/owner/Storage observation. All other dynamic resource imports and external fetch reject. A wrapper counts cleanup entry while retaining its actual implementation; cleanup is never called.

As in the prior NE3 private-method oracles, the private runtime cutoff is shortened for a finite source vector. `Date`, clocks, source statements and grant policy are unchanged. **No grant is validated or accepted**, and this is not an execution through a genuinely authorized native stack.

| Actual-method vector | Independently observed result |
| --- | --- |
| Runtime cutoff40ms; initial negative `lstat` delayed180ms | Still pending after the real75ms wait assertion; cleanup calls0. Rejects only at183ms with `negative_filesystem_metadata_failure`, beyond the cutoff. `returnedAt:null`; no RETURN output. |
| Immediate negative metadata control,400ms cutoff | Same exact failure in2ms; one metadata-adapter call, cleanup calls0. This verifies the failure transcript is reached without a timeout. |
| Existing deadline-guard control | After actual expiry, calling `operationDeadline('http')` in the runtime context rejects `phase_deadline`. The guard works where called; initial preflight does not call it. |

`preflight-deadline.json` records **exit0**, meaning these predicates and controls reproduced. A bounded evidence-only v2 adds an explicit pending-checkpoint receipt without changing predicates: at77ms, `settled:false`, cleanup calls0 and37ms past cutoff; eventual failure183ms and immediate control2ms, **exit0**. Both exact programs/raw results and VM warnings remain. The negative adapter never consults the real Docker socket, creates a path, binds a port, spawns a child or returns a successful resource result. No actual native hang, running-resource leak, missing real STOP, Auth session or database effect was observed. No resource existed to RETURN in this review.

Required correction: include initial runtime imports/preflight/setup in the finite deadline and failure boundary, with explicit handling for partially created setup and owned port probes. Retain original origin/deadline checks around awaited continuations so timed-out setup cannot later proceed into resource creation. Preserve the existing task/grant policy, ownership requirements, cleanup allocation and truthful uncertain outcomes. Add delayed/pending/failing preflight controls against actual methods. **No fix was made here.**

At this first new material finding, dependent broad tests, source-check, syntax/compiler, product and native acceptance stopped. Parent acknowledged that stop. Only bounded finding attribution, protected-file/evidence verification and this report followed.

## NE1–NE3: original OLD, historical CURRENT and bound CURRENT are distinct

All three unchanged original OLD programs ran **before any current probe**. Exact old executor bytes came from Git into own ignored projections. Only the executed programs were copied from prior evidence; no foreign-root executable ran. A small own wrapper denies global external fetch before importing each program. Original VM dynamic-import denials remain.

| Prior predicate | Original OLD reproduction | Historical CURRENT raw | SAME bound program: OLD / CURRENT |
| --- | --- | --- | --- |
| NE1, correct-code denial despite persisted sentinel corruption | d449, **exit0**: N010 incorrectly records PASS with revision+journal mutation and journal-only mutation. Unchanged/wrong-code/wrong-state/HTTP200 controls remain sensitive. | **Exit1**: original actor-only/no-readback fixture cannot provide corrected scope/readbacks; original PASS-row assertion throws. | **Exit1 / exit0**. Explicit actor and bounded persisted-read transcript; unchanged denial passes, both corruption transcripts reject, wrong-code/state/status controls reject. |
| NE2, bodyless local logout acknowledgment | 004c, **exit0**: empty204/200 reject `http_invalid_json`; valid negative400 parses; malformed200 rejects. No logout occurred. | **Exit1**: historical expected rejection now sees null error for empty204. | **Exit1 / exit0**. Only the two bodyless expected outcomes/receipt assertions and optional old-source binding adapt; all four HTTP transcripts remain the same. |
| NE3, command timeout can spend STOP reserve | 2edf, **exit0**: actual command admits60,000ms with1,000ms before reserve; admits15,000ms inventory with20ms left, then after real50ms delay refuses STOP. Inside-reserve and expired controls refuse. | **Exit1**: historical60,000ms expectation sees749ms. | **Exit1 / exit0**. Actual dump timeout749ms plus249ms grace fits999ms before reserve. Ordinary near-deadline inventory refuses without dispatch; real50ms expiry and expired STOP controls remain. |

The original NE1 program SHA256 is `5d6f755697babcca88901b8410c0bf0bd4a4bc5e8d757eb8217dfa18fce2a9ee`; NE2 is `700179d99ed954071d84c335a4ede4c7fc513bbb78a0653bf6277a466dcfee68`; NE3 is `71b51ab5d534db58dd7fcd00328529f5efa74dc7f064fa37e039b26e4dde4ec3`. The NE3 program is the actual `cleanup-budget.mjs` used by the prior `cleanup-budget-v2.json` receipt. The minimally bound NE3 program was copied from the author's exact retained `cleanup-budget-current.mjs`, inspected, and run unchanged on OLD and CURRENT.

These12 oracle invocations and the two separate NE4 evidence runs are **pure source assertion/timing evidence**. An N010 result's generated “genuine Auth/PostgREST” string is output under test. Synthetic HTTP acknowledgments do not establish logout, persisted transcript rows do not establish actual SQL state, and injected null OS exits do not establish Docker execution or termination.

The inspected current parser retains the exact empty-body200/204 local-logout exception and mandatory decoding for other responses. Cleanup source continues actors after individual errors and performs independent final session/refresh reads; acknowledgment and verified closure remain distinct. The command source clamps remaining budgets, retains operation maxima, fences identity/dispatch awaits and partitions the existing90-second reserve into12.5s ownership,60s STOP plus5s grace, and12.5s postchecks. **Those source observations and the bounded old-predicate controls do not accept the complete cleanup, termination/join, actor or schedule matrix.** NE4 prevents completeness acceptance.

## Frozen identity, exact imports and preservation

Own worktree `/Users/kanuj/.t3/worktrees/shelv/t3-f9601fd1`, branch `t3/native-executor-review`, began clean at exact frozen Parent **`f4023aeb0970718e94f9d580fd8b72e8446461ab`**. Later physical Parent HEAD/TASKS changes are not inputs. Existing export/consent/MIF and other base work remain separately attributed frozen inputs; no rebase or manual merge occurred.

Before **each** separate `cherry-pick -x`, full changed paths, original preimage modes/blobs, actual index and physical bytes/modes or new-path absence were checked, and the full-index patch passed `git apply --check`. All six imports were conflict-free:

| Original input | Attributed own review import |
| --- | --- |
| `0ca4fe8ca6da208deb70d7d5a89031671dc8b234` | `79b4714b73c94f8007f6ed2d76de75517879f51a` |
| `d449d2e12148e512856a8a92d7249bf5cf566c52` | `8236539c96fd65974e1ba419dbf1957c21fbf959` |
| `567a9238ba802f090614fca2d38b80f6ebd4b987` | `d854acd72e2c6987541332966ae1058708b36525` |
| `004c8be757b0c580873913a30729ceb5f9d3edd5` | `406289fdf5b882d2298461be09e25ac193714f06` |
| `2edf952915fefe4b2da025d2d2e5cd5918ec9506` | `fd684838052c0b06faa15b0dc8b048263afc422a` |
| `7a69dafe29cb8c9be7c0a1bfe72c5531cd57839a` | `524b609d07507cd3b7823087b5ec7a670f4016d3` |

All four final input files physically match exact7a69 and author `t3-35ff2229`, mode100644:

| Path | Exact final Git blob |
| --- | --- |
| `tests/portal-notifications-native.py` | `754e0b2edd7a2616baf16b9747b818f505c01cf8` |
| `tests/portal-notifications-native-executor.mjs` | `c1ca547d1e32d2ea62d94acb9cab1702bdc430f4` |
| `tests/portal-notifications-native-executor.test.mjs` | `888af6615d52c4c329bfb7b4141a0985c5d6b139` |
| `docs/portal-rebuild/research/W7_NOTIFICATIONS_NATIVE_R1.md` | `3205150f0ac72f0a310a939c06388daee97aecb2` |

Final readbacks preserve **all2,112 frozen-base tracked paths**, including **65 migrations /119 SQL files**, configuration, packages/locks, Root/runtime/auth/routes and old tests/reports. Original62 migrations separately remain byte-exact to `ab19cda33449e3dea8f228911ed1983ef7289ba1`. Notification migration remains SHA256 `408b860074abb18a1c1452bd6d08af8009db7fb48e0d01476abd608932d2b684`; canonical pgTAP remains `f66cf297604ab78c5aede7a659582fff326e2a7e2d673a8c9fb3f1ce87c99621`. No SQL was executed.

Frozen additional Parent migrations are notification above, photo-head SHA256 `b1f1a2ac93bfca7206f968d02e32e0451034364961caed87c8c7f4663f402632` at `c0f97e6b9da85ad96fe1b20709ce3a955018bbd4`, and final-export SHA256 `4991cce01a59e82aea46a2d4d37db95defe32e473854cd9e494c5a749a7d7166` at `eabc4f3485c47af548e544486e0cb3aab477bb92`. The executor's intended projection remains authentic **62 -> notification63**. Photo/export migrations are never additional executor targets.

**Updated literal kernel qualification:** R3's older base had17/18 original kernel matches. This frozen f402 base has **16/18**, plus the separately pinned unchanged kernel R3 report: **17/19** total plan candidate paths. Both differences predate this reviewer:

1. `tests/portal-notification-worker.test.ts`: existing `mkdir` import/top-level ignored-directory prerequisite, last frozen attribution `482557b47c4e8e61ea6032c8e3b9dc2452b60d38`.
2. `tests/portal-notification-journal.test.ts`: existing CI historical-baseline loader replaces direct `execFileSync('git', ['show', ...])` with `portalCiBaselines.readBytes(...)`, last frozen attribution `8ee18fda2b89e727f1efe7fd56255d3cb1fd05fd`.

`kernel-source-readbacks.json` retains exact original/current blobs/modes and both complete small diffs. No source pin was relaxed, either file edited, or raw historical provenance failure erased. No source-check was attempted on this differently composed root. These are frozen attribution qualifications, not a second product finding or a reason to invent source readiness.

## Runtime and task identity provenance

Initial and final **actual self and actual Parent** `d632030a-18f7-4dec-a2c9-f5c0418c3fd5` read-only configurations, plus live catalog/descriptors, verify **codex / gpt-6.1-sol / reasoningEffort=xhigh / serviceTier=default**, full-access/default interaction. The registered project default is separately **null**. Own and physical-Parent root config SHA256 remains `927e3dd532c0daabbb975f6879866aa99cbc12d3f20d080b0568867e37ee66ff`; all eight distinct role files remain `a1f57cf26da8626380cbaa101ca04dc39a92e4bd6aa6acb6cd9f5f24a05d9feb`, Sol/xhigh and Parent-exact. No settings changed. Every Node probe uses `/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node`, verified **v22.23.0** before imports/probes and again at finalization.

After the initial live gate, Parent forwarded this authoritative task identity:

```text
node:delegated-task:command%3Amcp%3Afab56c32-51e9-4c25-a214-3043797a2822%3Adelegate-task%3Aportal-rebuild-w7-notifications-native-executor-source-review-20261102-r4
```

**Precise provenance:** Parent subsequently qualified this as the taskId returned verbatim as `subagentId` by the **live Parent allocation record**, with separately read child metadata/run. The original `delegate_task` output artifact had not been located. This report relies on direct live allocation evidence, **not an original-return artifact, ledger-match claim or inferred thread/run suffix**. Parent's exact `native_r4_live_allocation_identity_20261102.json` and correction are retained. It is the same NEW R4 allocation, not a replacement. No nested task was started.

## Evidence and held complete matrix

Evidence home: **`.local-artifacts/w7-notifications-native-executor-source-r4/`**. It retains actual full allocation/R3 brief, task qualification/live settings, per-input patches/preflights, original/bound executed programs, old source projections, full stdout/stderr/true exits, NE4 proof and protected readbacks. True exits were disclosed before their result files were written. Prior author/reviewer archives were hashed **in place**: **1,866 regular-file/literal-link entries,29,109,044 regular-file bytes**, then verified unchanged. Literal links were inventoried without following them. No recursive archive or dependency copy occurred. Both own dependency roots remain absent; no install/projection was needed.

The full author report through7a69, its NE1/NE2/NE3 responses, exact independent R1/R2/R3 reports and original source allocation were reconciled. Approved original remains **95,388 bytes**, SHA256 `c45701f9f54fd2b1dbb09bbd7aa2b9b437e9059aa6032b6f39411fe2e7f6efbd`; its decision/specification appendices bind the separately read canonical documents. D01–D48/specification/contracts/AGENTS and later decision addenda retain precedence. Truncated displays and bounded path-search setup misses remain transcript qualifications, not semantic failures.

The author's `ne3-pure-terminal.json` records **67/67 pure tests,0 failures/skips**, and its source/syntax exit0 receipts remain **attributed author evidence**. They were not independently replayed after NE4. Historical20/27/39/46/47, planner443, kernel39, raw historical expectation failures, current bound controls, canonical66 and schedules60 are not combined into a pass count.

| Original allocated area | Independent status at the NE4 stop |
| --- | --- |
| Finite native entry, imports/preflight, origin and awaited side-effect/finally adjacency | **NE4 FAIL** before the timed runtime boundary. AsyncLocalStorage does not itself impose a timeout on the initial filesystem await. Remaining continuation/setup paths unaccepted. |
| Complete fixed grant/hash/task/expiry/argv/source/phase checks | Source was inspected, no grant accepted. Full guard/no-side-effect/source-read matrix **held**; no independent cold/source-check suite result claimed. |
| Remaining budget/maxima/identity+dispatch awaits, elapsed races, termination/grace/actual close/join | NE3 original predicate has bounded current sensitivity. Full actual process/cancel/reentry/pending/throw/join matrix **held**; injected failures never prove actual termination. |
| Existing90s reserve, fresh ownership,60s STOP+5s grace, postchecks and UTC RETURN | Source partition inspected. Complete sequencing/failed-start/STOP/network/return/receipt/stdout/write/diagnostic acceptance **held**, actual custody **UNRUN**. No reserve borrowing, deadline extension, ownership waiver or invented STOP accepted. |
| HTTP/body, SQL-session/query/close and alarm/lease waits | NE2 exact parser controls reproduced. Exhaustive delayed/cancelled/late continuation/session-close matrix **held**; actual sessions/process joins **UNRUN**. |
| Exact CLI SHA and1,919-byte embedded table; six cached ARM64 stock images; clean env/dotenv/ECR/slim=false/no-pull recipe | Supplied Parent receipts and concrete source remain attributed metadata/source only. Full recipe/cache/compatibility acceptance **held**. `allowPull:false` is not a CLI no-pull flag. CLI/table hashes remain `6e8be5fb2802ccdd247d3b47823c31ed8d7e792255048594ba32ee79a55208dc` / `74501a6cd95b9a3d9c4487174d52dfd0e377c6397e669261f67700a47d484929`. |
| Exact bridge ID/creation/labels/options, container attachments and loopback before Auth | Concrete source ordering inspected; complete fresh/negative/replacement/failed-start cleanup matrix **held**. Actual exposure **UNRUN**. |
| Strict62->notification63 membership/stages, full old OID/ACL/attributes/relations/RLS/trigger/index/row multisets | Physical source preservation verified. Complete native recipe/catalog/duplicate-sensitive preservation acceptance **held/UNRUN**. Frozen Parent export/photo/consent/MIF are separate inputs. |
| Canonical66,60 real schedules,50 functional callbacks, per-denial persisted no-effect and prerequisite producers | Authored graph remains concrete, **all native cases UNRUN**. Only original NE1 bounded HTTP predicate replayed here; SQL denials/companion replays/blocking/rollback/neighbours/counts and actual Auth/Plan/Payment producers **unaccepted**. Missing/genuine producers cannot be supplied by VM output. |
| Actual Auth fixture/cleanup, session and refresh-row absence, retained dump/STOP/network/RETURN | Exact parser acknowledgment has bounded sensitivity. Genuine current rights, exhaustive actor failures/final reads, actual retained dump/resource close and RETURN **UNRUN**. |

The proposed owner `8c0538fd-29c7-4d68-b8ca-b90a79bc461f`, project `shelv-portal-admission-8c0538fd29c7`, source plan/config, six images, bridge and API58491/DB58492/shadow58490/Mailpit58494/callback58500 remain proposals. Own/author stack paths remain absent. The source template's authorization/task/expiry are null and **NOT A GRANT**. Any future native execution needs a NEW exact task grant after complete source/recipe review.

No Docker/CLI/status/image/container/network/volume/process/port inventory, listener, SQL/Auth/Storage/provider/browser/native operation occurred. No resource needed STOP/RETURN. No R9/dump reuse, foreign-root execution, successful owner/Auth/row-absence/OS substitution, package/config edit, source fix, push, PR, merge, deployment, activation, real-client communication, funds or permission action occurred. Full npm/typechecks/Expo/backend/SQL/pgTAP/Auth/RLS/App/provider/browser/visual/human/CI/release gates remain unrun/open.

Only this new report is authored in tracked files. Parent is the sole canonical status/handoff/admission writer. Deliver **only this report commit, excluding all six review import ancestors**. The full notification and approved portal goals remain open.
