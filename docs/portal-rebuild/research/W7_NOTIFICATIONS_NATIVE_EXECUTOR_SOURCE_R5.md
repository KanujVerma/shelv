# W7 notifications native executor: independent SOURCE R5

Owner: Kanuj. Date: 2 November 2026. Report-only review of the complete frozen executor and recipe, with pure failure-only VM evidence. No native execution, accepted execution grant or resource acquisition.

| Verdict | Result |
| --- | --- |
| Specification / completeness | **CHANGES REQUIRED: NE5/P2 and NE6/P2.** The original NE1-NE4 predicates have bounded current sensitivity. The complete executor, lifecycle and original recipe matrices are not accepted. |
| Correctness / quality | **CHANGES REQUIRED.** Unjoined command custody is not propagated into finalization; several frozen case variants and schedule requirements are absent from the executable assertions. |

This is one consolidated finding set. It does not issue `SOURCE_READY`, notification acceptance, an execution packet, a resource grant or full-goal completion. Kernel R1/R2 FAIL, kernel R3's bounded source PASS, and independent executor R1-R4 FAIL remain immutable. No production, original test or prior report was fixed.

## Exact allocation and immutable inputs

Own T3-managed checkout: `/Users/kanuj/.t3/worktrees/shelv/t3-8c20336a`. Initial clean HEAD: **`8af746d197b976972d4b16924155afa8c3b32d44`**. Parent is **`9b085ada-435f-48d6-8886-957c1ce3e82d`**, owning the original integration checkout and pending Maya17. This reviewer performed no foreign-worktree execution or writes, Root import, rebase or nested delegation.

Parent separately forwarded the authoritative taskId, distinct from the backing thread/run:

```text
node:delegated-task:command%3Amcp%3Aafb222dc-28b4-420b-9474-b05bc6eeba89%3Adelegate-task%3Acontinuation-20261102-native-executor-r5
```

Initial actual self and actual Parent `t3_thread_configure` reads, with `modelSelection` omitted, both returned **codex / gpt-6.1-sol / reasoningEffort=xhigh / serviceTier=default**. Every executed Node probe uses **`/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node`**, verified **v22.23.0**. No model, configuration, flags, package, lockfile or dependency changes occurred.

The current continuation was read from Parent's `docs/portal-rebuild/source/CONTINUATION_INPUT_20261102.txt`, SHA256 **`b428b318598df52f12ce3e6ea4ebd350ff9333ee05d9fd8f04a8e845d0c722bc`**. It is distinct from the original approved input, which remains **95,388 bytes**, SHA256 **`c45701f9f54fd2b1dbb09bbd7aa2b9b437e9059aa6032b6f39411fe2e7f6efbd`**. Applicable AGENTS, personal WORKFLOW, rebuild README/GOAL/D01-D48/full desktop specification/contracts/addenda/workstreams and current custody sections govern. Historical roster labels do not supply authority.

The full author history at candidate393419ca and independent reports at exact **cae64279b1735d0e46bfce8d8f36ed83ffadd325**, **c0df8b29c162421868b7472d2a60c7e9eefa9dba**, **b39a2ef449859dfbdfc4f37220b24be3a19453a1**, and sole R4 **831c158cadc7cbb7101e7ee46e094bdf4a87423d** were reconciled. R4's six input ancestors were not imported. The three supplied Parent receipts were read, including the qualification that R4's identity came from a live allocation record rather than a located original delegate-return artifact.

The complete original executor allocation is retained in Parent's `.local-artifacts/portal-rebuild/coordinator-active-20261101/native_r3_review_brief.md`, including its literal original feature brief. It requires authentic new Supabase bootstrap, exact62-to-notification63 source/ledger, full catalog and row preservation, genuine synthetic producer/session binding, complete66/60/50 recipes, no-effect observations, bounded failure cleanup, retained evidence/dump/volumes and prompt truthful UTC RETURN. Public-only producer prerequisites are part of that notification fixture; this review does not reopen provider-refused private Guidance/M65 work.

### Candidate manifest

Candidate: **`393419ca528047b7f79ebff78870c06a78427526`**, direct predecessor **`7a69dafe29cb8c9be7c0a1bfe72c5531cd57839a`**. All listed input files are mode100644.

| Frozen path | Candidate blob | Bytes | SHA256 |
| --- | --- | ---: | --- |
| `tests/portal-notifications-native-executor.mjs` | `82dfd83502cb9e82ede41004d829f1af11d40465` | 131903 | `582854f70272618152d8f236e8148e9c29d53ec594f5afa75e2350d16ff4a385` |
| `tests/portal-notifications-native-executor.test.mjs` | `ac2edeb5ff18095179b9497b1ead72b145196ac5` | 63156 | `3441119487932129bb44c2671220a3404a9f40aadc8701bfe0cc92c54db46a8d` |
| `docs/portal-rebuild/research/W7_NOTIFICATIONS_NATIVE_R1.md` | `5bfcb8666ea8f13cbb97d31f17b5dc3e49ca8938` | 94895 | `e1668ea5c442ba15826787430b550d1aa7adc23566c11baaadaddc924f36fd73` |
| unchanged `tests/portal-notifications-native.py` | `754e0b2edd7a2616baf16b9747b818f505c01cf8` | 35339 | `3913de91ca93848a02280ae06dd887b326ac1137e7a75be86c4e668f4a05f423` |

The candidate changes only executor/test/report. Predecessor executor blob is `c1ca547d1e32d2ea62d94acb9cab1702bdc430f4`, SHA256 `33af5b6428939b03a3aa284b192fdf325d2743ab366a9c94c7207b857257908e`. Its 51,005-byte test and 80,707-byte report prefixes remain retained. `ordered-candidate-commit-manifest.json` records full preimages/postimages for 0ca4fe8c, d449d2e1, 567a9238, 004c8be7, 2edf9529, 7a69dafe and393419ca.

No input commit was cherry-picked or authored as production. Exact Git input files were materialized only under own ignored evidence projections. Deliver only this report commit, whose parent is the frozen8af base.

## NE5/P2: unjoined lifecycle command loses cleanup-owned custody

**Locations in exact393419ca:** executor lines94-107 (`runOwnedProcess`),244-255 (`Runtime.command`),393-456 (`cleanup` and final disposition).

`runOwnedProcess` keeps its captured child in a local closure and resolves on actual close. If it does not close within the command's work-plus-grace interval, `Runtime.command` correctly creates failed evidence with `joined:false`. However, the timeout result has no captured child handle or pid, the method clears `activeCommand` in `finally`, and no outstanding-command registry is retained alongside `sessions` or setup operations.

Cleanup joins setup mutations/probes and SQL sessions, but never joins or accounts for this outstanding command. Its final errors consist of setup and cleanup-step errors; a preceding runtime command's `joined:false` is not added. `finish` can therefore select `STOPPED_RETAINED` after successful current-resource postchecks while a prior network-create/start command is still unjoined. A current absence/stopped observation cannot prove that an issued, unjoined lifecycle operation has finished producing effects. The overall run can still reject its original runtime error; that does not make the separate clean resource-disposition claim true.

**Independent pure proof:** `probes/unjoined-command-custody-v2.mjs` exposes only the private Runtime class by an additional export, and invokes the actual **Runtime.command -> runOwnedProcess** path. Static imports are restricted to assert/crypto/url/path; dynamic resource imports and external fetch reject. The spawn injection returns an EventEmitter representing a failing child, with a synthetic pid tag and no OS process. It supplies no successful ownership, Auth, row-absence, Docker or business observation. The evidence sink is in memory. Real clocks and actual source statements are retained.

| Vector | Observed on candidate393419ca |
| --- | --- |
| Captured child never emits close; command work20ms, remaining runtime2000ms | TERM and KILL callbacks occur; method rejects, logs `command_cancellation_unjoined`, `joined:false`, no pid, and clears `activeCommand`. At547ms a second failing `containers` command is admitted while the first child still has not closed. SQL-session registry is empty; no outstanding-command binding exists. |
| Adjacent failing child emits actual close on TERM | Method rejects at21ms with `joined:true` and the synthetic pid preserved. The follow-up dispatch occurs after close. It remains a failed command, not successful execution. |

The same probe exits0 on exact predecessor7a69. This is a remaining NE3-era command-custody gap, not a claim that the NE4 patch introduced it. The probe's exit0 means these failure predicates reproduced. No native leak, successful STOP, actual network mutation or resource RETURN was observed. The possible clean disposition follows from the complete inspected finalization code, not a stubbed successful cleanup run.

The first probe raw exits1 because it asserted KILL had already fired at the outer deadline. The separately scheduled grace timer can fire just afterward. V2 retains every original assertion and adds a real25ms wait before checking that callback; it changes no source, clock or successful outcome. Both programs/raws remain preserved. This timing qualification is not a waived product assertion.

**Required correction:** retain each dispatched child's exact captured handle and completion promise independently of a command's timed result, and carry any unjoined operation into final custody diagnostics. Attempt only bounded cleanup/signals of positively captured owned handles, preserving the existing phase/STOP allocation. Guarded cleanup inventories may still be necessary; their success must not erase an unresolved command. Until actual close/join is proven, return **UNCERTAIN**, including the operation/target and uncertainty, rather than absence or clean STOP. Add failure-only controls covering runtime network-create/start and cleanup command timeouts, late close, failed signals, evidence failure and the final disposition. Do not adopt, kill or delete an unknown/foreign resource or extend deadlines to make a test pass.

## NE6/P2: case labels do not implement the complete frozen recipe matrices

**Locations:** planner `EXTRA_CASES` and `schedules()`; executor lines514-530 (`journals`),533-655 (`functional` and helpers),659-673 (session setup/query/close).

`record` checks a hand-enumerated denial count, and completion checks only `results.length===50`. It never compares executed variant membership with each frozen recipe. Several callbacks omit explicit branches that the source plan requires. Examples are independently established by complete source comparison, without native execution:

| Frozen obligation | Actual source gap |
| --- | --- |
| N003 material use report **and amendments**; N004 report/conversation/amendment producers | `careCase` invokes only `report_unreviewed_product_v1`. `reviewCase` invokes only `submit_goal_report_v1`. No amendment or conversation producer is invoked by these groups. |
| N025 active-agent inbox/seen/status/advisor denials | Only `list_inbox_v1` is invoked. |
| N035 profile deletion / actual Auth deleted_at / ban / target paths | Only `profiles.deletion_started_at` is changed. No deleted_at or banned_until vector exists. |
| N036 principal/capability/policy/owner tuple, including current rights at reachable locks | Only policy activation is changed in N036. Other isolated groups cover one inactive principal and one EDIT loss; owner-tuple and the full before/after-lock matrix are absent. |
| N031 queued/claimed/accepted retry refusals; N040 wrong/portal/queued/unknown context | N031 exercises the current queued row only. N040 exercises wrong lease and portal only. |
| N043 route or capability change at a reachable lock; N044 source ID/version/kind/publication binding; N045 resolver-blocked reread | Source covers one rollback-only route disable, one missing publication/direct-helper denial, and one immediate immutable event UPDATE denial. The remaining route/capability, mismatched-source and resolver-blocked variants are absent. |
| N049 real mark **and retry** rollback | Only mark is rolled back and observed. |
| S001-S060 exact20-second schedule deadline,15-second statement timeout,20-second idle timeout and captured three-backend identities | The executor does not consume these schedule fields. Session setup fixes20s statement /15s lock /25s idle, query default25s. It records/checks A and B, but not an observer pid or schedule-wide20s deadline. Actual lock observation and six-family counts are present. |

These are gaps in the verification implementation, not observed bugs in the notification kernel or proof that a real stack passes. An original recipe must not be reduced to the easiest one of its variants while retaining the original group label. The complete per-group source matrix below records the other unaccepted obligations.

**Required correction:** enumerate and execute every frozen subcase and its exact source-derived expected branch, with returned producer identities, before/after state, original receipt/clock preservation and genuine versus GUC proof labels. Enforce the original schedule limits and retain observer/closure identities. Completion must check exact subcase membership, not just50 labels or a denial total. Missing producer capability remains an explicit failed/held subcase; it cannot become a fabricated receipt, successful authority stub, skipped green, private-Guidance reroute or financial acceptance.

## Original NE1-NE4: OLD, raw CURRENT and fact-bound CURRENT

All four unchanged original OLD probes ran before any CURRENT oracle. Exact old executor bytes came from Git into own ignored projections. Only the exact executed programs were copied from retained R4/author evidence. No foreign program was executed.

| Predicate | Original OLD, exit0 reproduction | Unchanged CURRENT raw | SAME fact-bound program OLD / CURRENT |
| --- | --- | --- | --- |
| NE1, correct-code denial with persisted mutation | d449 incorrectly records N010 PASS after revision+journal and journal-only corruption; wrong code/state/status controls reject. | Exit1: old actor-only/no-readback fixture cannot provide corrected scope. | Exit1 / exit0: explicit actor and bounded persisted-read transcript; both corruptions reject and original controls remain sensitive. |
| NE2, bodyless local logout | 004c rejects empty204/200 before its cleanup caller's supported status gate. | Exit1: historical rejection expectation now sees no parser error. | Exit1 / exit0: only empty acknowledgment expectations/receipt assertions and optional source binding differ; negative400 and malformed200 remain strict. |
| NE3, timeouts spending STOP reserve | 2edf admits60000ms dump with1000ms before reserve,15000ms inventory with20ms remaining; real50ms delay then prevents STOP. | Exit1: old60000ms expectation sees the clamped budget. | Exit1 / exit0: timeout plus grace fits reserve boundary; inside-reserve/expired refusals and real elapsed-time controls remain. This does not address NE5. |
| NE4, preflight before deadline/finally | 7a69 remains pending after40ms cutoff with cleanup0, then fails after delayed180ms lstat. | Exit1: old pending expectation now sees settled. | Exit1 / exit0: current settles at46ms, enters cleanup async context, and immediate negative metadata remains at3ms. |

Original probe SHA256s: NE1 `5d6f755697babcca88901b8410c0bf0bd4a4bc5e8d757eb8217dfa18fce2a9ee`; NE2 `700179d99ed954071d84c335a4ede4c7fc513bbb78a0653bf6277a466dcfee68`; NE3 `71b51ab5d534db58dd7fcd00328529f5efa74dc7f064fa37e039b26e4dde4ec3`; NE4 v2 `9465f75989e8b63dcb5f8e0ca7431ea5d70c8f9a52cb6c97e111ef0e45da61da`. NE3's actual program is `cleanup-budget.mjs`, not a guessed v2 filename. NE4's original fixture omits a valid cleanup budget; the bound successor explicitly requires `cleanup_budget_invalid` uncertainty. It is not an approved execution grant or a clean native cleanup result.

These16 oracle invocations, the separate NE5 failure proof and its predecessor attribution remain distinct. Generated genuine-Auth/RETURN strings are output under test. HTTP acknowledgments do not prove logout; synthetic persisted rows do not prove SQL state; EventEmitter exits/signals do not prove OS termination. No assertion was filtered to call an old fixture green.

## Complete source/recipe review matrix

After NE5, dependent broad suite, source-check, syntax/compiler, product and native execution were held. Feasible semantic review continued through the complete executor, matching tests, planner, original briefs, full report history and archived recipe metadata. The following is a source assessment, not a passed execution matrix.

| Required area | Source assessment and remaining gate |
| --- | --- |
| Supported modes / cold entry | CLI accepts only exact `--source-check` or seven execution arguments; missing/extra/reordered argv rejects. Import/createExecutor are inert. The original cold tests are inspected; no fresh accepted execution is attempted. |
| Grant/hash/task/expiry/stages | Private nonsymlink grant file/hash, exact self hash/current task, owner/project/workdir/endpoint, plan/config, phase order, budgets, exact six images/network and cleanup/no-pull policy are concrete. Original NOT-A-GRANT remains inert. A grant is never derived from this report. |
| Source ancestry / setup | Per-await runtime origin/deadline checks now enclose imports/source reads, lstat/catch/ENOENT, socket, selected probes, mkdir/copy/write and initial receipt. NE4 original predicate is addressed at this scope. Issued uncancellable setup work can remain uncertain; source fencing does not prove physical cancellation. |
| CLI / image/bootstrap lineage | Exact installed CLI path/version/hash and1919-byte embedded table are pinned; actual binary embedding and cache observations remain attributed Parent metadata. Fresh authentic CLI/PG bootstrap, not abbreviated tables/dump/R9, is the intended recipe. No current cache/service was inspected. |
| Clean environment / no pull | Closed environment, own empty Docker config, fixed Unix endpoint, ECR registry, slim=false, no inherited dotenv/temp overrides and exact cached closure are concrete. `allowPull:false` is policy; no no-pull CLI flag is invented. Installed-compatible cache-only behavior still needs the later exact native grant/observation. |
| Network / literal ports | Exact named bridge, labels/options/creation window/returned ID and attachments are checked before synthetic users. Actual published HostIP must be127.0.0.1 or::1; status API URL must be literal127.0.0.1:58491. The five selected availability probes use captured servers and source host0.0.0.0, not a proven loopback listener. Complete endpoint mapping/exposure and probe close are unrun and must be explicit in any future recipe review/packet. |
| Freshness / ownership / stages | Exact project-label listings and named collisions, no broad adoption, volume creation/labels, container ID/image/PID/start/labels, fresh network and stage receipts are concrete. Source copies exactly62 then notification63 and verifies applied ledger statements. Additional frozen Parent migrations are not fixture targets. |
| Native database identity | Fixed container-local psql argv is present. Original catalog recipe also requests backend/postmaster start/database/user/server/socket identity. Executor snapshot/ledger do not capture/recheck that complete database-identity tuple. Retain this source completeness gate with the recipe corrections; container PID alone is not that tuple. |
| Catalog / old rows | Full old function OIDs/signature/owner/ACL/attributes/definitions, relations/RLS/policies/triggers, indexes and duplicate-sensitive row multisets are queried. Only pinned collision-helper body changes at63; new function/table/index/trigger membership is checked. Final old rows use multiset inclusion with one exact fixture-policy delta. All actual SQL/catalog comparisons remain unrun. |
| Canonical P001-P066 | Original file/hash/plan66/order/no-skip/no-TODO/bailout/true exit remain strict. Separate eight identical denial replays plus30 same-subtransaction journal replays do not inflate TAP66. No native assertion ran. |
| S001-S060 | Concrete30 directed pairs times COMMIT/ROLLBACK, exact temporary helper, shared actor/request, two live sessions, positively observed advisory blocker, six-family counts and delivery-neighbour equality. NE6 holds exact timing/identity recipe completeness. All60 actual outcomes unrun. |
| Denial no-effect | Before/after bounded513-fetch/512-accept evidence covers events/deliveries/attempts/neighbours and all six journals; duplicates remain significant. Exact observed A row is the only permitted concurrent addition. Per-case50/38/30 inventories are not proof of missing variants. NE1 bounded HTTP predicate passes; complete SQL/concurrency observations remain unrun. |
| Auth / fixture prerequisites | Source uses actual local admin creation/password sign-in, verified email, issued session claims and session rows, then canonical Plan/Payment/publication prerequisites with returned quote/claim/approval/service/entitlement relationships. This is synthetic fixture preparation, not money correctness or actual observed Auth. Producer reachability remains unrun. |
| Current rights / private markers | Source checks several real session/enrollment/policy/capability/source/route/lease paths and canary exclusions. NE6 identifies missing variants. No genuine rights/marker scan or private-return acceptance is inferred from a VM; actual private status/raw artifacts stay0600 under private directories. |
| Deadline / side effects / captured handles | Remaining budgets, maxima, identity/dispatch checks, ALS origin separation and existing90s partition are concrete. SQL sessions/setup/probes retain their objects. NE5 prevents complete process join and final-custody acceptance. No runtime operation may borrow cleanup origin or act after RETURN. |
| Cleanup / Auth / dump / STOP / network | Source continues failed SQL/Auth actor closures, attempts independent final session/refresh reads, keeps acknowledgment separate from absence, attempts preservation/dump and guarded STOP/network cleanup with retention. Ownership failure authorizes no unknown cleanup. Setup-only/no-resource/uncertain states and receipt errors are distinguished. Complete native sequence, actual retained dump, closure and prompt UTC RETURN remain unrun; NE5 blocks clean disposition. |

### Every N001-N050 group

All entries below are **source only; native execution UNRUN**. “Present” identifies concrete source, not acceptance. Grouped IDs retain each original ID and do not combine result counts.

| IDs | Actual source and residual original obligations |
| --- | --- |
| N001 | Publication inbox/source/destination and private canary check present; real returned publication/event/recipient relationships unrun. |
| N002 | Review/instruction/reply public producers and source/destination binding present; genuine prerequisites unrun. No private Guidance review is reopened. |
| N003 | Initial unreviewed-product Care producer present; amendment variants missing, NE6. |
| N004 | Goal-report producer present; conversation/amendment variants and complete source-version binding missing, NE6. |
| N005 | Draft event-count equality present; complete delivery/DTO absence recipe remains unaccepted. |
| N006 | Private-note event absence and canary exclusion present; actual no-delivery/private projection unrun. |
| N007 | Seen effect/revision and email-row equality present; full journal/seenAt/attempt/clock observations remain unaccepted. |
| N008 | Exact replay receipt and journal count1 present; full live row/seenAt no-second-effect assertions remain unaccepted. |
| N009 | Already-seen effect/revision present; original seenAt/distinct journal once not directly asserted. |
| N010 | Fresh stale-CAS exact denial/no-effect present; bounded NE1 sensitivity independently replayed. |
| N011 | Changed action, actual owner portal and original UUID present; persisted no-effect boundary present. |
| N012 | Changed target with original UUID and no-effect present. |
| N013 | Changed CAS with original UUID and no-effect present. |
| N014 | Actual command/hash read and rollback-only deliberately bad raw fingerprint present; SQL assertion path unrun. |
| N015 | Committed status checks mark receipt; corresponding retry status and read-no-effect variants remain unaccepted. |
| N016 | Fresh status-unknown response present; no journal mutation assertion absent. |
| N017 | Purged journal in rollback transaction returns unknown; neighbour/unchanged effect coverage remains unaccepted. |
| N018 | Unknown missing-target response present; cross-client disclosure and no-write recipe unrun. |
| N019 | Each five old journals before mark, exact denial/readbacks/counts present. |
| N020 | Mark before each five journals, exact original status/receipt and no-effect present. |
| N021 | Each five journals before actual failed retry, exact denial/no-effect present. |
| N022 | Actual retry before each five journals, original receipt and denial/no-effect present. |
| N023 | Different actors/same UUID in two sessions with finite lock timeout and row check present; genuine observer/custody unrun. |
| N024 | Cross-client portal denial/no-effect present. |
| N025 | Agent inbox denial only; other required agent operations missing, NE6. |
| N026 | Inactive human principal rollback-only denial present; other principal/lock variants unrun or absent. |
| N027 | Human view=true/edit=false read and retry denial present. |
| N028 | Actual failed-writer then retry effect/revision present; explicit publication/service clock/event/attempt preservation recipe incomplete. |
| N029 | Retry replay receipt equality present; explicit live row/clock no-second-effect recipe incomplete. |
| N030 | Rollback-only uncertain writer/result refusal plus no-effect boundary present. |
| N031 | Queued current-status refusal present; claimed/accepted variants missing, NE6. |
| N032 | Session delete at reachable blocker, subsequent denial and reauthentication present. |
| N033 | Actual not_after ahead plus real SQL sleep present; complete lock-delayed expiry variant unaccepted. |
| N034 | Enrollment revocation at a blocker and restoration present; complete pre-command/target matrix unaccepted. |
| N035 | Profile deletion only; actual Auth deleted_at/ban/target cases missing, NE6. |
| N036 | Policy inactive only; full owner/principal/VIEW/EDIT matrix missing, NE6. |
| N037 | Actual cancellation/read-only and rollback historical-expiry basis present; mark denial uses not_found. No elapsed30-day observation is claimed. |
| N038 | Actual claim/context/neutral worker codec and identities present; real lease/recipient/source rows unrun. |
| N039 | Rollback-only unverified-email refusal and no-effect present. |
| N040 | Wrong lease and portal refusal present; unknown/queued-nonclaimed variants missing, NE6. |
| N041 | Real five-minute lease, actual delivery blocker, keepalive and expired-context refusal present; unrun. |
| N042 | Separate email delivery, lock before actual Auth email update and current returned address present; unrun. |
| N043 | One route-disable rollback refusal present; missing remaining route/capability/blocking variants, NE6. |
| N044 | Missing publication/FK cascade/direct-helper refusal present; missing mismatched source/eligibility variants, NE6. |
| N045 | Immediate immutable event UPDATE refusal present; resolver-blocked reread variant missing, NE6. |
| N046 | Natural claim expiry and unchanged expiry RPC once/idempotence present; full attempt/history preservation remains unaccepted. |
| N047 | Live keyset/next page plus rollback filtered empty advancing page and no-effect present; full bounded scan/continuation matrix unrun. |
| N048 | Original portal seenAt/revision check after email operations present; complete independent email attempt/history binding unrun. |
| N049 | Mark rollback/all delivery rows/journal absence present; retry rollback missing, NE6. |
| N050 | Four executed-role refusals and selected privilege metadata present; full new-function/table/private-helper ACL/RLS recipe remains native unrun. |

## Recipe pins, custody and preservation

Original ignored plan is **156018 bytes**, SHA256 **`927e248b7c0d703749367bda2ce8214ecb48264454c234b1237553b472992be4`**; config is **1031 bytes**, SHA256 **`f46cd892f9a944baeb72bafdb8418c1071e38d7326da4060ab1322703c8fa1e5`**. Protected original-base manifest is437089 bytes, SHA256 **`0ffd2aab38c7dada5d1ddb87ed67710279da3db71a4e4a4f93ddb7718d19e7ba`**. These were hashed in place; no full source/archive projection or source-check waiver was constructed.

CLI2.121.0 SHA256 is **`6e8be5fb2802ccdd247d3b47823c31ed8d7e792255048594ba32ee79a55208dc`**. Its exact1919-byte image table is **`74501a6cd95b9a3d9c4487174d52dfd0e377c6397e669261f67700a47d484929`**. Archived Parent metadata/source, not a current CLI/daemon/cache query, binds the six ARM64 stock inputs:

| Role / reference | Exact image ID |
| --- | --- |
| PostgreSQL `public.ecr.aws/supabase/postgres:17.11.0.004` | `sha256:b15d862126dd2dac02da524696ccfde2dcce2ceaee0a58973b2727befe492706` |
| Auth `public.ecr.aws/supabase/gotrue:v2.197.0` | `sha256:1736a63078f5922b198c4cbe50f80ab9a2d3b54fe8b7b6cfb2e9dc5dbbc12c6b` |
| Storage bootstrap `public.ecr.aws/supabase/storage-api:v1.82.1` | `sha256:ec2ad41411eac8fc2b769b4bb00d1af32ae37eca3745c15bdb329db27d218934` |
| Gateway `public.ecr.aws/supabase/kong:2.8.1` | `sha256:1b53405d8680a09d6f44494b7990bf7da2ea43f84a258c59717d4539abf09f6d` |
| Mailpit `public.ecr.aws/supabase/mailpit:v1.31.3` | `sha256:ed9b00c609e77e99c79b93f1178255ebc271868920f2c69a8d166bd5634ed10d` |
| PostgREST `public.ecr.aws/supabase/postgrest:v16.4` | `sha256:d155c6718ed9a9f990d159a2ab7c0a3f16944dbb6d0a0344557421042acfe0df` |

Proposed owner **8c0538fd-29c7-4d68-b8ca-b90a79bc461f**, project **shelv-portal-admission-8c0538fd29c7**, original author workdir, exact bridge and API58491/DB58492/shadow58490/Mailpit58494/callback58500 remain proposals. Proposed budgets remain1200 seconds runtime plus360 cleanup. Existing90s reserve remains12.5s ownership /60s STOP plus5s grace /12.5s postchecks. No fresh resource availability or actual cleanup was checked.

Latest NE4 template SHA256 **`fef67a42f435e9c5ed0b1f745b8a1038a2cc06d909ffb28474f36f0f4a32e082`** still has **authorization/taskId/expiresAt null**. It is **NOT A GRANT**. Binding metadata to this reviewer root for pure probes does not rebind the original plan into executable authority.

All **2128 frozen own-base tracked files** were independently byte/mode verified, including **66 migrations /121 SQL files**. Original62 migrations separately remain exact to ab19cda3. Notification migration remains **`408b860074abb18a1c1452bd6d08af8009db7fb48e0d01476abd608932d2b684`**, canonical test **`f66cf297604ab78c5aede7a659582fff326e2a7e2d673a8c9fb3f1ce87c99621`**. Current Parent's additional migrations are preserved base facts, not executor targets.

Literal original kernel comparison is **16/18**, as in R4's qualified base: worker-test ignored-directory prerequisite and journal-test historical CI-baseline loader differ. No source pin was relaxed and neither file was edited. A complete preserved-base projection is not claimed from sparse executed inputs.

Dependency fingerprint: root package SHA256 `7da6e48aa5e39a185f10ac117007ee15beb279c4125e1f30f99c92451ff6d968`; portal package `294dbd426b9840bd1d524e443edff4ff3c5026b39e9137c9bf897d156715bb02`. Three tracked lock SHAs are root `5c57c9aec9e4585066e032e234d610a77cbffd9a51f82700c158fc37fe01b5c2`, portal `bc914f3a9c9f24e44f02e3cff2804651147385ea5abda58a064531329ef23203`, runtime `4024b48fb339605a438a3bfe68f6e547dade8c86660c6f06b41c278aa2289ba0`. Own root/portal node_modules remain absent. All executed probes use Node built-ins and require no dependency projection. No APFS clone grant was invoked; no four-physical-lock/tracked91-runtime parity claim is made. An initial fingerprint included a guessed absent session-integration lock path; that absence is retained and is not presented as the fourth custody input.

Prior author archives were hashed **in place**: **1776 regular-file/literal-link entries,26549851 regular-file bytes**. Links were inventoried without following them. Only exact executed probe/source inputs and necessary reports/receipts were copied. No recursive foreign archive, dependency tree, generated runtime or cached resource was copied or executed.

## Commands, evidence and integration gate

Own ignored evidence home: **`.local-artifacts/w7-notifications-native-executor-source-r5/`**. Every executed probe receipt records expanded argv, own cwd, full stdout/stderr and true exit. Exit disclosure preceded exclusive receipt creation. The runner uses:

```text
/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node --experimental-vm-modules <own evidence>/probes/closed-runner.mjs <own copied probe>
```

Original runs use each exact OLD projection as cwd. Raw CURRENT uses the393419ca projection. Bound OLD uses that same current cwd and the program's explicit old-source argument; bound CURRENT omits it. `original-regression-summary.json`, the16 individual `ne*-*.json` receipts and `copied-executed-probes.json` retain all bindings and hashes. NE5 runs the own `unjoined-command-custody[-v2].mjs` with the explicit Node binary in candidate/predecessor projections; raw exits are1,0,0 respectively. The Python orchestration wrapper exiting0 does not convert any child exit1 into a pass.

The author's **84/84 pure**, source-check and syntax exit0 remain **attributed author evidence**. They were not independently rerun after NE5. Historical20/27/39/46/47/67/84, planner443, kernel39, native66/60/50 and this review's bounded probes are not combined. Complete suite/source-check/syntax/compiler/product checks were **prevented by the material-finding gate**; genuine Docker/DB/Auth/Storage/socket/listener/browser/provider and release checks were **unrun because no grant exists**. Neither category is a passed check or a dependency-install request.

Report validation checks owned scope, local links, whitespace, secret/private-marker patterns in newly authored tracked text, exact frozen input hashes and byte/mode/literal-link preservation. Final runtime reads retain the required model/options and Node pin. The sole tracked change is this NEW report. Parent owns canonical status/CONTEXT_SYNC and any integration decision.

**Integration gate:** correct NE5 and the complete NE6 source/recipe gaps, retain the original raw/bound evidence and get a NEW independent complete source review. Only accepted source/recipe work could enable Parent to prepare a **NEW exact native execution authorization packet**. Such acceptance would still grant no execution. Authentic fresh platform/fixture, exact endpoint/image/source ownership, all66/60/50/catalog/Auth/concurrency/cleanup observations, actual App/inbox/sink/provider/browser/visual/human evidence, centrally scheduled full suites, exact-head CI and release approval remain separate open gates.

No install, config/flag/lock change, socket/listener/server/process adoption, Docker/image/cache query, SQL/Auth/Storage/provider/native/browser operation, reset, deployment, remote write, push/PR/comment/watch/merge, real-client communication, real funds or permission change occurred. No resource existed to STOP or RETURN. No hardware key/program enrollment or provider-refused review reroute is introduced. The full approved portal rebuild remains open.
