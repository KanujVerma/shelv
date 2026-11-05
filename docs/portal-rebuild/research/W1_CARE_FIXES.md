# W1 care legacy chronology and compatibility fixes

Owner: Kanuj. 31 October 2026. Bounded author response to the complete [W7 care review](W7_CARE_BACKEND_REVIEW.md), CB1/CB2. **Fresh independent review is required.** This does not accept care, activate v2, or establish genuine Auth/browser/full-portal/canonical acceptance.

## Exact task, source and runtime

- Worktree `/Users/kanuj/.t3/worktrees/shelv/t3-e26d8ab2`, branch `t3/fix-care-legacy-compat`. Clean automatic starting parent **`71852c0d4a13d04f918e071fd7838066ce432117`**. Resume verified Git/status/log and root/portal instructions. Fresh `git fetch origin` succeeded; main remains `d39a7d4943209080df7c4cf97d85784f462758bf`; initial head versus main127/0. No checkout/reset/import of another worker's work.
- Parent `d632030a-18f7-4dec-a2c9-f5c0418c3fd5`; project `ac0af19d-d404-4f53-a870-02bfd76c2a80`. Task ID `node:delegated-task:command%3Amcp%3A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%3Adelegate-task%3Aportal-rebuild-w1-care-legacy-fixes-20261031-r1`. Child thread has the same suffix after `thread:delegated-task:`. Actual run `run:thread:thread%3Adelegated-task%3Acommand%253Amcp%253A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%253Adelegate-task%253Aportal-rebuild-w1-care-legacy-fixes-20261031-r1:ordinal:1`.
- Care author `bd40f2e175eba6393af1c195ed267d083aa262bb`, integrated `9bd7e213266c12058819f6b208e25510c4318525`; reviewed source and fresh report are ancestors of this automatic base. Original care author base `8366dedd201a4eed224704eae185350be9aac1d4`; earlier seams408ccab/4565e46/5c612b2/d338ab1/1a0154b are retained history.
- Both live `orchestrator_capabilities` and `t3_thread_configuration` independently establish **codex / gpt-6.1-sol / reasoningEffort=xhigh / serviceTier=default**, full-access/default interaction, before work and again before delivery. Advertised reasoning descriptors low/medium/high/xhigh/max/ultra, default low; service default/priority, default default. Effective xhigh is explicit. Global/project configs and all eight role pins parse as Sol/xhigh; path/hash evidence is retained. No nested agents.
- Explicit `/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node`, verified v22.23.0. PostgreSQL `/opt/homebrew/opt/postgresql@15/bin`,15.19 Homebrew. Native subprocesses prepend that Node and PG path and clear ambient PG credentials/options.
- Exactly three tracked paths: this report, new [native regressions](../../../tests/portal-care-legacy-fixes-native.py), and the existing unreleased [M56](../../../supabase/migrations/20261031043655_portal_rebuild_care_use_v1.sql). M56 changes **only** `care_effective_use` and `care_v1_unsupported`; a function-exclusion byte comparison confirms the entire rest is unchanged. All55 older SQL files compare byte-for-byte with initial71852c0 and original8366ded.56 migrations total; no new timestamp.

The exact ending commit is the containing fix/test/report commit returned in the task handoff; resolve with `git log -1 --format=%H -- docs/portal-rebuild/research/W1_CARE_FIXES.md`. The report cannot embed its own containing SHA.

Read the full W7 care review, [W1 implementation](W1_CARE_IMPLEMENTATION.md), [CARE_API](../CARE_API_V1.md), relevant use/dependency/history/source-rights/notification/permission reconciliation sections, approved original input and desktop/D01-D48, contracts/status/workstreams, actual care ports/handlers and retained readers. Revisited [backend R1](W7_BACKEND_REVIEW.md), [R2](W7_BACKEND_R2.md), [R3](W7_BACKEND_R3.md), [W1 fixes](W1_FIXES.md) and [wait response](W1_WAIT_FIXES.md) for their live authority, immutable receipt and source boundaries. All five imported originals retain their provenance bytes/hashes. Applied systematic debugging, TDD and verification plus Supabase SQL boundary guidance. Current [function security guidance](https://supabase.com/docs/guides/database/functions) and [PG15.19 changelog](https://supabase.com/changelog/postgres-15-19-17-11-breaking-changes) were consulted; no platform/configuration/extension upgrade is introduced.

## CB1 response: preserved actual Start participates in conflict evaluation

The review correctly identified that the old activation supplied `originalStart` but was absent from contradiction evaluation. `care_effective_use` now also checks actual same-client, entitled, descriptor-compatible legacy activations when the selected effective non-Start report has a known occurrence before a preserved actual Start. It checks all applicable activations, including a later Start distinct from the earliest original Start. Future activations do not become current facts.

The conservative reported stop/pause state remains suppressed from unqualified continue guidance. A known backdated stop before an actual Start is `stopped` with `contradiction:true`, the original known Start, and the original stop event. **No automatic restoration to using, new winning truth, new activation, inferred occurred date or rewritten legacy record.** This is the approved explicit-conflict rule, not an advice decision. The existing known-date Chicago-midnight, unknown-date recording/amendment-instant ordering among care events is unchanged.

Unknown-date pause/stop remains prompt and visibly unknown. Equal/later known stops and an unknown stop do not acquire blanket legacy contradictions. Latest attributed amendment replacement supplies the date for the comparison; original occurred date, reporter/recorder/channel/body remain unchanged in history. New-event versus new-event ordering and authored publication carry retain the old tests and semantics.

## CB2 response: v1 must actually represent current use

`care_v1_unsupported` no longer exempts a using product merely because any activation shares its opaque ID. It examines the exact per-slot rows selected by the retained v1 `actualUse` projection (Chicago-current date, newest started date/id per slot), and verifies same-client entitlement and the existing exact immutable descriptor tuple. It requires a compatible selected known Start matching `originalStart`. A latest Start report with an unknown or different date cannot be silently replaced with that old date. All existing paused/stopped/different/unreviewed/contradiction fences remain.

For CB2, R2 Start2024-02-29 remains byte-identical. A deliberate human-reviewed/approved V3 publication reuses the ID with a different variant, without restarting service or creating activation. The actual Care handler's unknown-date Start yields v2 `using / originalStart:unknown`. The actual Plan handler for **version3** now returns exact **HTTP409 `{code:'use_version_required'}`**. Current version selection and advisor v1 also deny. Known new Starts cannot borrow an incompatible descriptor's activation either.

An exact same-tuple compatible legacy Start remains readable through v1 if v1 actually represents it. No-event descriptor changes with an ID-only old activation also fence, since returning that activation would misstate current facts. A same-ID activation displaced from v1's per-slot selection cannot supply an exemption. No name matching, new identity/formula authority, public raw-helper access or broad deny of compatible legacy content is added.

No handler or strict-mapper fix was needed. Existing `planErrorStatuses` already maps this code to409 and the existing focused handler test verifies the exact response. No duplicate production error mapping or weaker validation was added. Retained R1 readers still reject R2 content first; all retained R1/R2 readers still reject V3 with their existing `content_version_required`. R2-capable client/advisor/preview surfaces that reach the helper deny lossy R2 use with `use_version_required`. Tests preserve these earlier content fences instead of weakening them to force a later error.

## Meaningful RED and executed GREEN

Read and copied the reviewer's exact `candidates.py`, `r2-findings.py` and `r2-findings.json` from `/Users/kanuj/.t3/worktrees/shelv/t3-b3838853/.local-artifacts/w7-care-review-r1/` into **this own** ignored evidence directory with `original-` prefixes. Original SHA-256 values and paths are in `repro-copies.json`. Those scripts' exit0 asserts bad outcomes and is not correctness acceptance. They were read/copied, not run against the reviewer fixture.

New durable tests reproduce their mechanisms with **correct** assertions. The stronger R2 cases persist actual R2 publications1/2, canonical frozen service quote/claim/manual confirmation and `original`/`moisturizer` activation **before applying M56**, then verify exact original rows. V3 candidate cases independently reproduce both gaps. Actual Care and Plan handlers/parsers/positive mappers execute persisted authenticated-role SQL; only the Auth identity/session claims are synthetic.

**Before production edits:** all four R2/V3 cases fail meaningfully,0 errors: both CB1 assertions see `contradiction:false`; both CB2 assertions see actual Plan200 instead of exact409. `red-meaningful-four.log`,10.905s. Earlier fixture-only socket-length/preparation-identity/table-name errors are retained in setup logs, not counted as product RED.

| Executed check | Result |
| --- | --- |
| New durable native suite |11/11 pass,0 fail/skip,44.155s at final test source. CB1/CB2 R2 and V3, UTC/Honolulu/Tokyo, same-tuple readable controls, equal/later/unknown stops, same-tuple unknown/new restarts, all legacy Starts, actual per-slot selection, no-event variant mismatch, advisor amendment attribution/history, exact row preservation and no head/queue mutation by reads/denials |
| Unchanged retained native suite via ignored fixture-only copies |26/26 pass,0 fail/skip,43.583s; all assertions retained. Includes new-event ordering, known/unknown starts, cross-publication/current/historical carry, exact identity/owner, dependencies/deferred guards, expiry/cancellation/source waits, CAS/queue rollback and original history |
| Six focused root contract/handler files |37/37 pass,0 fail/skip,292.057ms |
| Strict bounded root compiler, all care modules and six focused test files/imported handlers |Exit0, zero diagnostics; TS6 from parent's installed dependency directory read-only, strict/noEmit/ES2022/bundler/allowImportingTsExtensions and actual node typeRoots; no flag relaxation |
| Full actual frontend + retained session typechecks |Both exit0, zero errors. Portal-only locked offline `npm ci --ignore-scripts --no-audit --no-fund` installed130 packages; no package/lock/config change |
| Native catalog/metadata |Exact TS/SQL13 care/26 plan schemas;14 TaskActions unchanged;12 private care/dependency tables;0 RLS/raw-table privilege violations,0 private helper EXECUTE/unpinned-search-path violations. Both public care/plan RPCs anon/authenticated/service_role = false/true/false |
| Preserved source |All55 historical migration hashes unchanged from8366ded and71852c0; all existing tests unchanged. Full M56 outside the two helpers unchanged; no contract/shape/grant/action/source/lock/receipt/deferred/publication authority edit |
| Scope/secrets/link/whitespace review |Only three owned paths; report links resolve; no secrets/temp artifacts in tracked diff; `git diff --check` passes |

The M55 retained wrapper's full SQL `prosrc` SHA is `805645db1c0d65516abfd8c708484986854240196c0dafe266c2f4b2d2318c7e`. Its whitespace-stripped `q()` readback SHA is the prior report's `f9cb9f72f427f1ae7447f7efaa905f147832f4e03d1fbdf840c975be03595d16`; these are different serializations of the same preserved body. The underlying M54 base's full SHA is `4be414067afedcf3456ae79523c69aaef25a964bddba0f9544836d3fff7552fa`. An initial audit assumption mixing those hash scopes was corrected without production changes.

Snapshots explicitly serialize timestamptz rows in UTC so session-timezone tests compare the same representation; immutable stored JSON remains exact. The first GREEN attempt's timezone-display and earlier-content-fence expectations were test framing corrections, not additional production fixes. Original histories/finance/receipts and pure-view head/outbox equality pass with those correct assertions.

## Reproduction and evidence

Evidence root: `/Users/kanuj/.t3/worktrees/shelv/t3-e26d8ab2/.local-artifacts/w1-care-fixes-r1/`. The new durable suite loads the existing native harness and actual bridge through ignored copies. Adaptations are only checkout/import/bridge paths, socket/port/database/marker/app-name constants. `harness-copy.json` retains source/copy hashes; no old assertion, tracked test or production source is replaced. Reproduction requires an independently owned running Unix-only cluster and matching fixture receipt. The suite refuses another workspace/socket/marker/data/PID.

```sh
export PATH=/Users/kanuj/.nvm/versions/node/v22.23.0/bin:/opt/homebrew/opt/postgresql@15/bin:$PATH
export PYTHONDONTWRITEBYTECODE=1
python3 tests/portal-care-legacy-fixes-native.py --prepare
python3 tests/portal-care-legacy-fixes-native.py
python3 tests/portal-care-legacy-fixes-native.py --retained
node --experimental-strip-types --test tests/portal-care-contract.test.ts tests/portal-care-handler.test.ts tests/portal-rebuild-domain.test.ts tests/portal-rebuild-handler.test.ts tests/portal-rebuild-advisor-reads.test.ts tests/portal-rebuild-advisor-handler.test.ts
npm --prefix apps/portal run typecheck:rebuild
npm --prefix apps/portal run typecheck:session
node /Users/kanuj/.t3/worktrees/shelv/kanuj-portal-rebuild-integration-20261030/node_modules/typescript/bin/tsc --ignoreConfig --noEmit --strict --allowImportingTsExtensions --target es2022 --module esnext --moduleResolution bundler --types node --typeRoots /Users/kanuj/.t3/worktrees/shelv/kanuj-portal-rebuild-integration-20261030/node_modules/@types src/contracts/PortalCare.ts src/contracts/PortalCareValues.ts src/contracts/PortalCareValidation.ts src/contracts/PortalCareMapping.ts tests/portal-care-contract.test.ts tests/portal-care-handler.test.ts tests/portal-rebuild-domain.test.ts tests/portal-rebuild-handler.test.ts tests/portal-rebuild-advisor-reads.test.ts tests/portal-rebuild-advisor-handler.test.ts
python3 .local-artifacts/w1-care-fixes-r1/audit.py
```

The selected RED command supplies the first four `LegacyFixTests.test_01...` through `test_04...` method names from the file; no baseline expected result is inverted into a pass. Logs retain all setup and failed attempts. The evidence manifest binds exact file/log hashes; final fixture/resource receipt is retained separately.

## Resources and limits

Fresh own minimal PG15: data `.local-artifacts/w1-care-fixes-r1/pg/data`, socket `/tmp/sh-cfix-e26d-6315294e`, port55473, database `shelv_cfix_e26d_synthetic`, marker `W1 care fixes e26d synthetic Unix-only 20261031`, owned PID49280. Fresh initdb, `listen_addresses=''`,12 max connections/16MB shared buffers, no TCP. Only this fixture is recreated by the minimal harness (15 concierge prerequisites +54/55/56), never the full canonical56 stack.

**STOPPED at2026-10-31T06:15:06.121270+00:00.** Final audit positively matched the exact data directory, marker, socket, port, empty listen_addresses and original PID, with **0 other client connections**. Exact owned `pg_ctl -D <data> -m fast stop` exited0; fresh status exited3/no server running, postmaster.pid absent and socket absent. All owned SQL/subprocess/test handles are closed. Data and logs are retained. No Docker/Colima, Auth service, Chrome/browser, parent credentials or other native fixture lifecycle action. W3 keeps sole Chrome. Parent R4/R5 remain untouched, with the user's stopped historical R4 and source-only retired R5 status retained as parent evidence. A new R6 after acceptance is parent-owned; no new canonical snapshot was allocated.

No `supabase db reset`, pgTAP, Deno serving, genuine JWT/Auth/Edge/PostgREST/cookie/Vault/Storage, full root/portal/session runtime suites, Expo/iOS export, security advisors or exact-head CI was executed in this bounded lane. Root app dependencies are absent; the strict bounded compiler and installed portal/session checks are the actual type evidence. Homebrew minimal PG is not canonical acceptance. Existing Node MODULE_TYPELESS_PACKAGE_JSON warnings remain. W7's earlier19 channel/21 controller/9 adversarial/105-descriptor/concurrent publication checks are retained reviewer evidence, not rerun or upgraded here.

No approval/money bypass is claimed or introduced. Care/plan UI and genuine Auth remain unaccepted. No live client/source/permission/finance/message/email/purchase action, push, PR, merge or deployment. Parent owns CARE_API/status/CONTEXT_SYNC/acceptance/receipt updates and must commission a **new independent review round** before canonical care acceptance. Owned fix/test/report completion returns this implementation slot, not completion of the full goal.

## Final evidence hashes

| Artifact | SHA-256 |
| --- | --- |
| `red-meaningful-four.log` | `946e5dae920e1bf023f447472b4bd289ac05712459f8ad349f8f82c26d02bacc` |
| `green-final11.log` | `3db72e2d49b1e34d3d983a742f3155a36d4e6820eb41c3355d15bade0ec3a808` |
| `retained26.log` | `ccc2d2752f16050417f157729aabd54697ff7dbf51cf78d53dbac5d05f403d59` |
| `focused37.log` | `94340407b66905fe7715c719aa90af09de4c608d571b5891e0dc681542a0e88f` |
| `final-catalog.json` | `824f30e5cf99cdb1ec6bc85635c6c0efd8b968a8f0e46c890ecfa5a6cdf834c7` |
| `preserved55.json` | `3d97f53d95cf569e3b261f3580ce5f7111da7a1e962bb7fb25183874dc847fe2` |
| `fixture.json` | `f9334078abdf11bae6f264764e7e42b13bf6af0024f71b69c5eb9a1d4db63945` |
| `repro-copies.json` | `dab75252fc4412101fc49b589daae11a3698e2755ff2507bd92611457db811a5` |
| `evidence-manifest.json` | `a37c359b346c4941264b647605b5b3b9588fb5046616d5c052fab6d1db7b69c6` |
| M56 | `d3a889ab03cba381cd8d2d65b8b567db74ac5f19e6000a0e913c78982fe901e1` |
| New native suite | `0e238943ac742114a511f85d88d10af3aec6aaf319a4e4485f5b74d9bfcfbae4` |
