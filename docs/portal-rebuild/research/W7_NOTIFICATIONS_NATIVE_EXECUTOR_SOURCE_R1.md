# W7 notifications native executor: independent SOURCE R1

Owner: Kanuj. Date: 1 November 2026. **Report-only, SOURCE/PURE/closed synthetic HTTP assertion review. No native execution grant or resource was used.**

| Verdict | Result |
| --- | --- |
| Specification / completeness | **CHANGES REQUIRED: NE1/P2.** Several expected-denial callbacks omit the required persisted no-effect observation before recording PASS. Remaining dependent acceptance stopped at this first material finding. |
| Correctness / evidence quality | **CHANGES REQUIRED: NE1/P2.** The actual assertion path accepts a deliberately corrupted negative transcript. This is a verification-harness defect, not evidence of an actual database mutation or a notification-kernel defect. |

The prior kernel R1/R2 FAILs and [R3 bounded SOURCE PASS](W7_NOTIFICATIONS_SOURCE_R3.md) keep their original scope. This review does not reopen the blocked Guidance/M65 lane or claim notification, Auth, PostgreSQL, App, browser, provider, CI or release acceptance.

## NE1/P2: denial cases can record PASS without checking persisted effects

The original [preparation requirement](W7_NOTIFICATIONS_NATIVE_R1.md) explicitly requires, for every expected denial, exact `P0001` and business code **plus transaction rollback and persisted no-effect checks**. The planner also distinguishes a correct business denial from a committed mutation in `assert_denial`.

In [the executor](../../../tests/portal-notifications-native-executor.mjs), `Runtime.deny` at line173 only checks HTTP status >=400 and `assertBusinessDenial`. `Runtime.record` at line264 records PASS immediately after its callback resolves. The following direct callers add no before/after delivery, journal or neighbour observation:

- N010, line282: stale-CAS mark.
- N011, line283: changed action after an original mark.
- N012/N013, line284: changed target / changed CAS.
- N024/N025, lines294-295: cross-recipient / agent denial.
- N031, line301: retry in another status.

For example, N010 creates its denied request UUID inside the callback and retains no reference for a later journal lookup. The final preservation check at lines86-93 retains old multiset occurrences but permits new rows. Its baseline is captured before fixture creation at line189; it cannot prove that this later request added no journal row. Some other collision cases do perform explicit persisted checks at lines358-359, so this finding is limited to the unobserved denial paths.

**Minimal independent reproduction:** ignored `denial-noeffect-oracle-v3.mjs` loads the exact own executor text (SHA256 `a5c70a0f740fe9936d994ecd2cd7afdb317f4c979623a51653c805844283e43f`) into a Node VM module. The only source addition exposes the otherwise private `Runtime` class for this oracle. `import.meta.url` remains the actual own candidate path; both `ROOT` and proposed workdir are asserted to bind this checkout. Dynamic imports and global external fetch are denied. No executor `run`, accepted grant, source preparation, resource command, SQL session or real HTTP request is invoked.

The oracle calls the **actual `Runtime.http -> deny -> record('N010', ...)` methods**, using an injected negative-only fetch transcript and an in-memory evidence sink. The injected response is HTTP409 / `P0001` / `concierge_revision_conflict`. Its synthetic persisted-state sentinel deliberately changes before that response. This represents an erroneous-write transcript solely to test the assertions; it is not a successful authority mock or a native observation.

Observed results, exit0:

- Correct denial with unchanged sentinel: N010 PASS, as the positive control requires.
- Same denial with sentinel revision7 ->8 and journal0 ->1: N010 still records and saves PASS.
- Same denial with **journal0 ->1 only**, revision unchanged: N010 still records and saves PASS.
- Wrong business code, wrong SQLSTATE, and HTTP200: all reject before recording N010. The existing denial predicates are sensitive; the missing persisted-state predicate is the gap.

The raw generated `proofLevel` string says genuine Auth/PostgREST because that is what `record` writes. In this oracle that string is only output under test. **Every observation above is pure synthetic assertion evidence; actual native mutations, Auth sessions and PostgREST requests are zero.** This does not demonstrate that the full native suite passes with a real faulty backend.

Required author correction: retain the attempted actor/request/target and observe the relevant delivery, request journal and neighbours before and after each expected denial, requiring unchanged persisted state / no attempted receipt before PASS. Add a negative transcript or bounded mutation control that fails when the denial code is correct but an attempted effect remains, while retaining the exact-code positive controls. No production or test fix was made by this reviewer.

## Exact identity, imports and protected source

Review worktree: `/Users/kanuj/.t3/worktrees/shelv/t3-d68471e2`, branch `t3/notifications-executor-source-review`. Frozen review base and initial actual Parent HEAD: **`58c0669d0c5507c0eb7087fe0a0b0e0785743d5e`**. Parent's later dirty documentation/test/type work was not imported.

The live self configuration and actual Parent thread `d632030a-18f7-4dec-a2c9-f5c0418c3fd5` configuration both returned `codex / gpt-6.1-sol / reasoningEffort=xhigh / serviceTier=default`, full-access/default interaction. The live catalog supplies the matching model and option descriptors, including `xhigh` and `default`. Project `ac0af19d-d404-4f53-a870-02bfd76c2a80` separately has `defaultModelSelection:null`. All eight self and Parent role files pin Sol/xhigh; each has SHA256 `a1f57cf26da8626380cbaa101ca04dc39a92e4bd6aa6acb6cd9f5f24a05d9feb`, and both root configs have SHA256 `927e3dd532c0daabbb975f6879866aa99cbc12d3f20d080b0568867e37ee66ff`. No configuration was changed. Explicit Node throughout: `/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node`, verified **v22.23.0**.

After the initial live gate, Parent separately forwarded this authoritative actual returned taskId:

```text
node:delegated-task:command%3Amcp%3Add730894-0fab-4a94-873d-743422eae122%3Adelegate-task%3Aportal-rebuild-w7-notifications-native-executor-source-review-20261101-r1
```

It was not inferred from the separate backing thread/run/request suffix. Imports and probes began only after receipt. No nested delegation occurred.

| Exact original input | Separate conflict-free `cherry-pick -x` review import |
| --- | --- |
| `0ca4fe8ca6da208deb70d7d5a89031671dc8b234` | `927e575f7d5797b13a8b8e9350c5c5301d4dd80b` |
| `d449d2e12148e512856a8a92d7249bf5cf566c52` | `6836ac09ad6fe77c22eae27a81a87fa728f2d4da` |

Each original path manifest was checked before import, and each patch passed `git apply --check`. The only input paths are the new Python planner, executor, matching pure tests and original author report. All four final files and modes match d449 exactly. The 18 final paths attributed to the three prior kernel commits e89/1f9/82f already match byte-for-byte; those ancestors and the old R3 report ancestor were **not imported**. Deliver only this new report commit, excluding both review import ancestors.

All **2,058 frozen-base tracked paths** remain byte/mode exact. All **64 Parent source migrations** remain unchanged. The original62 are separately byte-exact against author base `ab19cda33449e3dea8f228911ed1983ef7289ba1`. The two additional frozen Parent migrations are:

- Notification `20261101191527_portal_rebuild_notifications_v1.sql`, SHA256 `408b860074abb18a1c1452bd6d08af8009db7fb48e0d01476abd608932d2b684`, last frozen attribution `cdc196199a4fc620c4119a20b9183a13c9c54899`.
- Photo head `20261101195359_portal_rebuild_photo_head_v1.sql`, SHA256 `b1f1a2ac93bfca7206f968d02e32e0451034364961caed87c8c7f4663f402632`, last frozen attribution `c0f97e6b9da85ad96fe1b20709ce3a955018bbd4`.

The notification pgTAP file remains SHA256 `f66cf297604ab78c5aede7a659582fff326e2a7e2d673a8c9fb3f1ce87c99621`. No migration or SQL was executed. The planner's canonical62 -> notification63 source projection is distinct from Parent's current64 source membership; the photo migration was not silently added to the proposed native stack.

## Evidence levels and stopped scope

Ignored current evidence: `.local-artifacts/w7-notifications-native-executor-source-r1/`. It contains the exact actual review brief, live gate, protected-file manifest, candidate/kernel provenance, executed probes, raw stdout/stderr and true-exit records. `immutable-reference-manifest.json` hashes historical reports, source plans and raw manifests **in place** under author `t3-35ff2229`; no recursive archive or dependency copy was made. No install, dependency projection, foreign executable, compiler flag relaxation or hook bypass was needed.

Executed commands, all from this review root with the explicit Node binary:

| Evidence | Command suffix / result |
| --- | --- |
| Cold CLI | `tests/portal-notifications-native-executor.mjs --execute`: exit1, exact `grant_missing_or_argv`, empty stdout, no own fixture created. |
| Raw source entry | `tests/portal-notifications-native-executor.mjs --source-check`: exit1, ENOENT for the absent own ignored `proposal-final/plan.json`. **Setup only**, not NE1 or a product verdict. No plan/archive was copied or source-check retried. |
| First test-copy setup | `--test .local-artifacts/w7-notifications-native-executor-source-r1/executor-adapted.test.mjs`: exit1 before tests, incorrect relative import in the ignored copy. This failed attempt is retained. |
| Corrected minimal adaptation | `--test .local-artifacts/w7-notifications-native-executor-source-r1/executor-adapted-v2.test.mjs`: exit0, **20/20**, no skips. Only the module import and hardcoded author root were bound to this own candidate; original assertions remain unchanged. This ran before NE1. The raw unadapted suite was not independently run because its cold-child cwd points to the author worktree. |
| First narrow oracle setup | `--experimental-vm-modules .../denial-noeffect-oracle.mjs`: exit1 because the isolated VM lacked `AbortSignal`. Retained as probe setup failure. |
| Corrected narrow oracle | `--experimental-vm-modules .../denial-noeffect-oracle-v2.mjs`: exit0, unchanged and corrupted sentinel controls plus exact-code sensitivity. |
| Minimal journal-only extension | `--experimental-vm-modules .../denial-noeffect-oracle-v3.mjs`: exit0, all six negative-transcript / positive-control vectors above. VM experimental warning retained. |

The author's original terminal20/20 and source-check exit0 remain separately attributed. Read-only original RED raws show0/8,9/11,12/13,13/14,16/17,17/18,18/19 and19/20 before the terminal20/20. They demonstrate historical guard-development stages, not NE1 sensitivity or a current native result. The Python443 oracle controls, earlier source checks, old failures, R3 raw2/5 versus corrected5/5, and current adapted20 are not merged into one count.

The source contains concrete `bootstrap62 -> migrate63 -> canonical66 -> journals60 -> functional -> cleanup` stages, real command/session code and50 callbacks rather than just a list of successful labels. Cold no-grant refusal was independently exercised. The authored finite graph remains **66 canonical assertions,60 two-session schedules and50 extra callback groups; native executions of every group are zero**. NE1 prevents a completeness PASS. Remaining guard/lifecycle/image/env/source/stage/STOP-reservation/Auth-cleanup/UTC-return obligations were inspected as source but are not independently accepted after the first-finding stop. No broader suite, compiler, syntax run, source-check retry or native case was run afterward.

Parent's authentic CLI2.121.0 / selected Colima Unix endpoint / stock PG17.11.0.004 metadata and stock pgTAP control1.3.3 proof remain attributed metadata, not SQL/bootstrap/Auth observations by this reviewer. Complete cached startup closure, installed-compatible loopback/selected-port proof and a fresh exact execution grant remain **separate Parent infrastructure readiness holds**. They are not NE1 and are not a user prerequisite. `allowPull:false` is not asserted to be a CLI no-pull flag. No `SOURCE_READY` for native execution is issued.

The proposed owner `8c0538fd-29c7-4d68-b8ca-b90a79bc461f`, project `shelv-portal-admission-8c0538fd29c7`, own ignored stack path, API58491/DB58492/shadow58490/Mailpit58494/callback58500 and config SHA256 `f46cd892f9a944baeb72bafdb8418c1071e38d7326da4060ab1322703c8fa1e5` remain proposals. The own stack path is absent. No Docker, service/status/process/port inventory, server, PostgreSQL, SQL, Auth, Storage, browser, provider, old database/dump/R9 or native resource was acquired or called. No custody existed to STOP or RETURN.

Only this report is newly authored in tracked files. Production/tests/old reports/configuration were not fixed or edited. Parent owns canonical status and CONTEXT_SYNC integration. No push, PR, merge, deployment, activation, real-client communication, funds, order or permission action occurred. Final handoff supplies the report-only commit SHA; application suites, genuine acceptance and exact-head CI remain unrun under this allocation.
