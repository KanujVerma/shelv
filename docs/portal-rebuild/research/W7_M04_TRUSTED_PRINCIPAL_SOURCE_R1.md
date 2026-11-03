# M04 trusted principal executor: SOURCE R1

**SPEC/completeness gate: FAIL. Quality gate: FAIL. Conditional future trusted-setup resource-packet eligibility: WITHHELD. ACTUAL/genuine acceptance: NOT ASSESSED.** First material finding reproduced below. Dependent probes stopped; this is not a complete-source PASS. Parent must fix the candidate, freeze the successor, and request a NEW independent review.

Parent: <t3-thread://v2/3b335212-744e-4ce9-befe-80a8e38dd448/9b085ada-435f-48d6-8886-957c1ce3e82d>. Parent alone owns Root/shared/Auth/runtime/migration/resource/integration writes. The finding and correction were sent to Parent before report prose. No candidate fix was made.

**Identity and custody.** Reviewer cwd `/Users/kanuj/.t3/worktrees/shelv/t3-03465987`; prepared HEAD `772c4fae7904e39a9e793627023adf56de811d8e` is INPUT ancestry, not actual Root. Actual self and Parent `t3_thread_configure` READs, with `modelSelection` omitted, each returned `codex / gpt-6.1-sol / xhigh / default`. Explicit `/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node --version` returned `v22.23.0`, exit 0. After these reads and candidate materialization availability, the public `C/M04-PRINCIPAL-SOURCE-REVIEW-DISPATCH.json` named this literal NEW review task:

`node:delegated-task:command%3Amcp%3Aa56eb6fa-1435-4927-8890-15373d05f366%3Adelegate-task%3Amilestone-20261103-m04-principal-executor-source-r1`

`C` is `/Users/kanuj/.t3/worktrees/shelv/kanuj-portal-rebuild-co-4bb412d8e34c7ca1/.local-artifacts/portal-rebuild/acceptance-first`. Candidate is `/Users/kanuj/.t3/worktrees/shelv/t3-65d2a888/.local-artifacts/m04-trusted-principal-executor`. All 41 freeze entries independently match original regular-file kind, mode, length and SHA-256. All 41 were copied byte-exact into [ignored review evidence](/Users/kanuj/.t3/worktrees/shelv/t3-03465987/.local-artifacts/w7-m04-trusted-principal-source-r1). The freeze itself was copied too. No candidate edit or substitution occurred.

| Input | SHA-256 |
| --- | --- |
| `receipts/SOURCE-FREEZE.json` | `5431e2bc0df14db29bd5ecbd62ef34cd42cc844e121af5e4b4cf0f13a93f16fd` |
| Current `executor/principal-setup.mjs` | `bd17da2313016872a994270c7217aa9ffd795ad2dee281661e4ae00f68ba2bc5` |
| Fixed `source/principal-setup.sql` | `5a7963f718a6322cb56e88711823ee3e389ec1951f2285e91f1c2dae00345f49` |
| Copied helper | `ce531f59f8460ac4e1df7c750401b01d3f69250da3c857ad3ff2108d610e835d` |
| Copied public Root target | `be2e06bcbd45665e2f2e191dafb5d6d284f0a2591987ad236a6efce02e21eb1e` |
| Retained preliminary executor, not reviewed as current | `c2c387a5f9db33dc8792bdb8304924500442893646c0ee6009f5092dda6e85a2` |

**PRINCIPAL-R1-01, material source blocker: prototype-spoofed signals pass the real-native-signal gate. Owner: Parent.** [Current frozen executor line 169](/Users/kanuj/.t3/worktrees/shelv/t3-03465987/.local-artifacts/w7-m04-trusted-principal-source-r1/candidate/executor/principal-setup.mjs:169) accepts `input.signal instanceof AbortSignal`, then reads `input.signal.aborted`. `Object.create(AbortSignal.prototype)` with its own `aborted` getter and listener functions passes that check without native AbortSignal internal state. The native prototype getter rejects this object with `ERR_INVALID_THIS`.

The independent negative control required `E_PRINCIPAL_SIGNAL` before any private read. Actual exact-copy current behavior: `instanceofAbortSignal=true`, `nativeBrand=false`, caller getter invoked once, refusal delayed until `E_PRINCIPAL_GRANT_PATH`. Result **0/1 pass, 1 fail, 0 skipped, exit 1**. `/MUST-NOT-BE-READ` deliberately fails the lexical path gate, so no grant/private path was read and no candidate command, socket, HTTP, SQL or Auth function was reached. This is a negative input test, not successful resource or authority simulation.

The consequence extends beyond error labeling: the accepted object supplies callbacks used by `fence` at line 76, HTTP abort/listener/cleanup paths at lines 153-159, and the pinned helper's `JoinedCommands.issue` at lines 58, 68 and 72. In that helper, listener registration occurs after child creation; caller-provided listener methods can throw, including from close cleanup before the join is resolved. The required real-native-signal boundary therefore cannot support the claimed join/lifetime guarantees. Those downstream effects are source reachability, not executed resource findings.

**Required correction:** establish the native signal brand before reading caller-overridable members, and ensure fence, registration and cleanup use a native signal observation/listener path that cannot invoke supplied overrides. Rejecting overridden/subclass/prototype callback surfaces is another bounded option. Add refusal controls for prototype spoofing, own getters and listener overrides, while retaining real native abort behavior. Preserve the current failing test and original receipts. Parent fixes; a NEW task reviews the frozen successor.

**Evidence qualifications.** Complete current executor, fixed SQL, definitive `HANDOFF.json` and `ACK-REFINEMENTS.json`, pins/bindings, all three unit sources, and the actual helper import/JoinedCommands interface were read. The first material finding stopped further source traversal and dependent controls. Full helper-body review, fresh 68-migration/schema/trigger analysis, complete Root filesystem/index/status verification, old/current sensitivity runs, broader independent native-slot/data controls, and a complete SPEC closure remain uncompleted. No claim is made that another material issue is absent. Earlier host SOURCE PASS at `W7_M04_ADVISOR_FIXTURE_SOURCE_R1.md` remains an attributed, conditional prior gate and grants no genuine fixture permission here.

The declared Root is `/Users/kanuj/.t3/worktrees/shelv/kanuj-portal-rebuild-integration-20261030`, HEAD `359c6bf0c759357df648ca441e9e3d1c3d29398c`, full 2,376-file digest `f3ce304bc6fd3f52e5331c4dd3ddecf9dd58a7c5c989bcdb62534c150f27c58a`, logical stage `4201bfe6d92e73ab22611f41b23c6bfead1687d0dae26d7ddf8e257bb017d23b`, 68-source ledger `77ccff3337064baa8b7c1c0140023068f76d6588d213b0892b444a8dd72a498a`, with only the old untracked handoff status. These are required input pins, not fresh Root/currentness observations in this stopped review. Raw index custody remains distinct from code drift.

Actual independent test argv, cwd and exit are preserved in `signal-negative.command.json`; raw output is in the separate stdout/stderr files:

```text
/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node --test /Users/kanuj/.t3/worktrees/shelv/t3-03465987/.local-artifacts/w7-m04-trusted-principal-source-r1/signal-negative.test.mjs
cwd: /Users/kanuj/.t3/worktrees/shelv/t3-03465987
exit: 1
```

The Python capture wrapper exited 0 after preserving the failing Node result; that is not a passing test. An earlier reviewer `python3 -` setup attempt exited 1 because `.local-artifacts` did not yet exist, before copying/importing/testing the candidate. `setup-failed.json` records that separate setup error; only reviewer directory creation was corrected. A report-validation wrapper separately exited 1 after incorrectly requiring an added-file `git diff --no-index --check` to return 0; its actual exit was 1 with empty stdout/stderr. Direct whitespace/link checks and ordinary `git diff --check` pass. This reviewer harness error did not change a candidate assertion or source byte.

Author historical evidence is copied unchanged and not independently rerun:

| Distinct author run | Result | Exit |
| --- | --- | --- |
| Original baseline RED, `red.*` | 0/36 pass, 36 fail | 1 |
| Extension RED, `red-extension.*` | 40/43 pass, 3 fail | 1 |
| Captured-start RED, `red-start.*` | 0/4 pass, 4 fail | 1 |
| Current author repository, `final-root.*` | 47/47 pass, 0 skipped | 0 |
| Current author portal cwd, `final-portal.*` | 47/47 pass, 0 skipped | 0 |

Each author command receipt preserves the explicit Node executable, true argv and cwd. The author signal tests cover a plain fake object and a real already-aborted signal; they do not cover the reproduced prototype-spoof case. No original OLD/setup/current result is relabeled green.

Full D01-D48, 26 screens and 10 journeys remain unchanged. M01 own Account Name remains ACTUAL accepted 1 bounded item / 0 full screens / 0 journeys. This report establishes no actual roles, policy/currentness, publication, full M04 or genuine acceptance. Approval/payment/UI confirmation and deliberate publication remain separate canonical commands; D21's approval-first scenario remains allowed. Guidance-private-return/M65/provider-photo/A07 remain held, with no client V1 fallback.

No resource acquisition/query, privateBase/stopped-fixture query/reuse/reset, network/socket/engine/SQL/Auth/browser/SDK/compiler invocation, successful Page/HTTP/Response/DB/Auth/currentness/authority/OperationPort/Vault facade, grant, live email/funds/fulfillment, Root/foreign write, nested agent, commit, PR, push, merge or deployment occurred. Only this new uncommitted report and own ignored offline evidence were written. Final local validation: `git diff --check` passes; the only nonignored addition is this report.
