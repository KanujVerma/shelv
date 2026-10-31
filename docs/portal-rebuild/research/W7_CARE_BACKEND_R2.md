# W7 independent care backend review, round 2

Owner: Kanuj. 31 October 2026. Report-only review at exact parent **`f69999a2dd7747682e6991f56d7db8d9bc23a500`**. No nested agents or production fixes.

## Separate verdicts

- **Specification compliance: PASS for the bounded CB1/CB2 backend corrections. Both original P2 findings are ADDRESSED.** Preserved actual Start participates in explicit conflict detection without resuming stopped use. A lossy v1 read cannot borrow an old descriptor's known Start for the current unknown Start.
- **Correctness / quality: PASS within this reviewed backend and finite transport scope.** Both exact original R2 mechanisms and V3 variants have meaningful historical sensitivity. Current new11, retained26 and focused37 pass, with the independent adjacent, descriptor and authority checks below. No new reproducible in-scope objection was identified.
- **Care acceptance / UI / release: NOT ESTABLISHED here.** This finishes the assigned source/native backend review. It does not activate v2, accept C07/C07C, certify genuine Auth/Edge/PostgREST/cookie/Vault behavior, accept the full portal, or authorize production actions. Application activation remains v1 pending the parent's actual care acceptance.

The parent may proceed with its separately owned fresh canonical R6 preparation. This review allocates or adopts no canonical snapshot and has no later Chrome phase.

## Exact identity, source and runtime

| Item | Verified evidence |
| --- | --- |
| Workspace / branch | `/Users/kanuj/.t3/worktrees/shelv/t3-d65c2daf` / `t3/w7-care-backend-review-r2` |
| Starting and tested application head | `f69999a2dd7747682e6991f56d7db8d9bc23a500`; initially clean; application source stayed at this head throughout testing |
| Fix author / integration | `957b7ac77ad1ae9059f9cb92a7211af23ec80529` / `f69999a2dd7747682e6991f56d7db8d9bc23a500`; all three fix/report/test blobs match exactly |
| Original care author / integration | `bd40f2e175eba6393af1c195ed267d083aa262bb` / `9bd7e213266c12058819f6b208e25510c4318525` |
| Original independent review / integration | `37775eb82d7d3b69e3d4b88e5ea5f976ab32ebf6` / `71852c0d4a13d04f918e071fd7838066ce432117` |
| Retained seams / core | Early408ccab/4565e46/5c612b2/d338ab1/1a0154b retained; channel/ports `75818aba37e366300e2cb01fb6fedef9b8b4934b`; current core `c8de1bd2b6492c4a5761edb6effe6a127e0981bc` |
| Migration scope |56 files; only M56 `20261031043655_portal_rebuild_care_use_v1.sql` changes in the fix,18 added/3 removed SQL lines. Entire SQL outside `care_effective_use` and `care_v1_unsupported` is byte-identical to bd40. All55 older files equal both8366dedd and71852c0d byte-for-byte |
| Git freshness boundary | Local `origin/main=d39a7d4943209080df7c4cf97d85784f462758bf`, initial divergence128/0. No remote fetch, checkout, rebase, reset or import; no remote-currentness or CI claim |
| Parent / project | Live `t3_thread_read`: `d632030a-18f7-4dec-a2c9-f5c0418c3fd5` / `ac0af19d-d404-4f53-a870-02bfd76c2a80` |
| Delegated round | `portal-rebuild-w7-care-backend-review-20261031-r2` |
| Actual child thread | `thread:delegated-task:command%3Amcp%3A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%3Adelegate-task%3Aportal-rebuild-w7-care-backend-review-20261031-r2` |
| Actual run | `run:thread:thread%3Adelegated-task%3Acommand%253Amcp%253A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%253Adelegate-task%253Aportal-rebuild-w7-care-backend-review-20261031-r2:ordinal:1` |
| Both live runtime tools | `orchestrator_capabilities({})` and `t3_thread_configuration({})`, before work and again before delivery: **codex / gpt-6.1-sol / reasoningEffort=xhigh / serviceTier=default**, full-access/default interaction |
| Supported descriptors | Reasoning low/medium/high/xhigh/max/ultra, catalog default low; service default/priority, catalog default default. Effective xhigh/default is explicit and supported |
| Configuration / overrides | Global selected model, project model/default-subagent settings and all eight actual role TOMLs parse as Sol/xhigh. Roles w0_foundation, w1_plan_platform, w2_advisor, w3_client_plan, w4_checkins_history, w5_orders, w6_account_service, w7_verification all checked and hashed. No global `.codex/agents/*.toml` files found. Installed Codex0.164.0 `features list` parses successfully. No child was spawned |
| Node / PG | Explicit `/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node`, verified **v22.23.0**; `/opt/homebrew/opt/postgresql@15/bin`, PostgreSQL15.19 Homebrew |

The parent-owned task correlation handle has the same suffix after `node:delegated-task:` as the child thread above. A bounded child `task_status` lookup returned `task_not_found` because that task belongs to the parent, not this child. Actual parent/project/workspace/branch/run are independently established by live thread readback; no terminal parent-task status is inferred from the rejected lookup. Capabilities' `parentThreadId` names this delegated child in this harness, so the real parent above comes from thread readback.

This report is the sole newly authored tracked path. Its containing commit is returned in the final handoff; obtain it with `git log -1 --format=%H -- docs/portal-rebuild/research/W7_CARE_BACKEND_R2.md`. The report commit is a child of the exact tested application head. Coordinator-owned status/CONTEXT_SYNC/acceptance records remain with the parent.

## Requirements and inspected source

Resume reconciled actual Git/status/log and root/portal AGENTS before substantive work. Applied verification-before-completion and Supabase boundary guidance. Read the complete [original care review](W7_CARE_BACKEND_REVIEW.md), [fix response](W1_CARE_FIXES.md), [care implementation](W1_CARE_IMPLEMENTATION.md), [CARE_API](../CARE_API_V1.md), [PLAN_API](../PLAN_API_V1.md), [advisor read contract](../ADVISOR_READ_API_V1.md), implementation contracts, D01-D48, desktop specification and original input. Original-input appendices exactly equal the separately read decision register/specification/manifest; all five imported byte counts/SHA-256 values match INPUT_PROVENANCE. No source input was rewritten.

Revisited original [backend R1](W7_BACKEND_REVIEW.md), [R2](W7_BACKEND_R2.md), [R3](W7_BACKEND_R3.md), [W1 original fixes](W1_FIXES.md), [wait response](W1_WAIT_FIXES.md), [native first-slice review](W7_NATIVE_BROWSER_REVIEW.md), [AR1 review](W7_APPROVAL_RECOVERY_REVIEW.md), [status R2](W7_STATUS_RECOVERY_R2.md), coordinator transport, workstreams/status and acceptance boundaries. Retain their qualified dispositions rather than treating passing care tests as recertification of every earlier feature.

Read the full delivered M56, including the long generated metadata and its tail in bounded output; both changed helpers and their pre-fix definitions; all four care contract/parser/mapper/value modules; actual Care and Plan handlers/runtime; retained client/advisor SQL readers and their exact per-slot projection; dependency extensions; all26 original native and11 new legacy cases; all26 canonical care pgTAP assertions. Followed current session/principal/source/care, legacy read and publication fences, and actual cookie/gateway/provider/port/controller composition relevant to this review. The fixed read-only v1 error is already409 in `planErrorStatuses`; no mapping gap is claimed.

Earlier prospective status lines in CARE_API/CURRENT_STATUS still describe care as unimplemented and an older R4 resource state. Actual f69999a2 source and this task's newer explicit resource boundaries govern this review. Those historical/prospective lines are not used to adopt, start or inspect R4/R5/R6. No coordinator document was independently corrected.

## CB1: ADDRESSED, without inventing a winning truth

[M56](../../../supabase/migrations/20261031043655_portal_rebuild_care_use_v1.sql), `care_effective_use`, compares the selected effective non-Start report's known date with actual same-client, entitled, descriptor-compatible legacy activations on or before Chicago today. A later compatible actual Start makes a backdated report explicit. Comparison uses the effective amendment replacement where present; an unknown date supplies no comparison date.

Independently repeated the stronger original sequence: create actual immutable R2 publications1/2, canonical service quote/claim/manual confirmation and `original`/`moisturizer` activation on **2026-10-31 before M56**. Apply care without changing original rows. Actual Care handler accepts the stop occurred **2026-10-30** with200. Actual v2 read now returns **stopped / originalStart known2026-10-31 / latest stop known2026-10-30 / contradiction:true**. The original event, actor/channel/date and activation remain unchanged. V1 refuses the lossy result.

This closes the omitted comparison. It does not restore using, revive continue guidance, discard the stop, create another activation, rewrite attribution, or choose new guidance. Equal/later dates and unknown stop/pause controls do not acquire blanket contradictions. Unknown stop remains promptly stopped with visibly unknown occurrence. Both the pre-care R2 and independent V3 cases pass; UTC/Honolulu/Tokyo controls pass in the new11. A later legacy Start distinct from the earliest original Start is also compared.

Fresh adjacent checks additionally cover a known backdated pause, equal-day pause, unknown pause, impossible/future date denial with no effects, a known-conflict amendment followed by an unknown-date correction, and retained video reporter/recorder/original history. An incompatible old descriptor supplies neither a fabricated Start nor a fabricated date conflict for the new descriptor's stop.

## CB2: ADDRESSED, with truthful v1 controls retained

`care_v1_unsupported` uses the **actual retained projection**: `distinct on(slot)`, started_on <= Chicago today, order by slot/date descending/id descending. It examines every projected activation for each selected product, requires descriptor compatibility and using state, and requires representation of the real original known Start. Effective latest Start occurrence must match that original Start; unknown or different reports cannot borrow it. It does not exempt any same-ID activation or require every compatible legacy plan to fail.

Independently repeated the exact R2 mechanism: persist Start **2024-02-29 on publication2 before M56**; deliberate human review/approval/publication of **V3 publication3**, same opaque ID with different exact variant; no first-service reset. Actual Care unknown-date Start returns using with originalStart unknown. Actual Plan `read_client_plan_v1 {version:3}` now returns exactly **HTTP409 `{code:'use_version_required'}`**. Current-selection and advisor paths deny too. Legacy R1/R2 surfaces retain their earlier `content_version_required` when applicable, with no weakening to force a later error. Original publication/presentation/activation/receipt bytes remain preserved.

Controls prove the fence is selective:

- Exact compatible legacy R2 and same-tuple V3 remain readable, including a latest Start that exactly matches the real legacy date.
- Same-tuple unknown Start, a new known restart date and a pause/Start cycle refuse v1. An amendment to the actual matching date allows it; an amendment back to unknown refuses it again.
- No-event changed-descriptor content cannot borrow the old activation. Independently changing **name, brand, variant, strength, sizeLabel, productUrl or reference** fences v1 both before and after an explicit unknown Start. Changing imageUrl alone retains truthful using/known-Start v1 access.
- A same-date higher-ID per-slot replacement wins the actual retained projection and cannot exempt the displaced product. A future replacement is ignored as a current fact. Two real products in separate slots remain readable; stopping one fences v1 without changing the other's using state.
- One compatible projected row does not hide a second incompatible same-ID projected row. Every projected descriptor is checked.

## Historical sensitivity and independently executed results

Evidence root: **`/Users/kanuj/.t3/worktrees/shelv/t3-d65c2daf/.local-artifacts/w7-care-r2/`**. All scripts, originals, complete logs and raw results are retained there. Test adaptations change only this checkout's paths, exact socket/port/database/marker/application name and bridge import paths. Original assertions are retained except the explicitly documented original-repro expectation changes below. No tracked source/test was edited.

Copied original `candidates.py`, `r2-findings.py`, `r2-findings.json` read-only from the original review's artifact directory, preserved exact bytes/hashes and retained raw original JSON. The original R2 script's bad-outcome assertions are **not acceptance assertions**. On an owned input-only bd40 SQL copy, it reproduces contradiction:false and actual Plan200. Its exit0 establishes the defect mechanism. The current copy changes only the two intended result expectations to contradiction:true and exact409; raw old/current envelopes are separately retained.

The independently adapted new four R2/V3 regression selectors against bd40 give **4 assertion failures /0 errors**, exit1,11.206s: two omitted contradiction flags and two actual Plan200-versus-409 errors. No delivered migration file is overwritten. The same current new suite is green. This is meaningful old-input sensitivity, not an import/setup failure labeled RED.

| Executed check | Result and scope |
| --- | --- |
| Owned minimal native prepare | Pass;15 concierge prerequisites +54/55/56, original IDs/bytes/dates/Start/money preserved, zero seeded principals/routes; not a full56 reset |
| New legacy native suite | **11/11**,0 failures/errors/skips,43.745s; actual Care/Plan handlers/parsers/mappers and authenticated-role persisted SQL |
| Retained native suite | **26/26**,0 failures/errors/skips,43.086s; all original assertions retained |
| Six focused root files | **37/37**,0 failures/skips,308.014ms; all care plus retained plan/advisor contract/handler tests |
| Fresh adjacent suite | **8/8**,0 failures/errors/skips,34.096s; boundary dates, cycles, amendments, descriptor-compatible conflict scope, per-slot ties/future rows, multiple products, every projected row, Start representability; full raw Care/Plan calls retained |
| Explicit later-known-pause control | **3/3 timezone controls**, UTC/Honolulu/Tokyo: legacy Start yesterday, known pause today remains paused/contradiction:false, real original Start and rows unchanged, exact Plan409 |
| Fresh descriptor controls | **8/8 groups**; all seven exact tuple fields versus image-only control; actual deliberate publication and both handlers |
| Original adversarial groups, own adapted copy | **9/9**,0 failures; cached status/retry natural expiry after verified wait; final-route wait; principal/edit loss; deleted/anonymous/profile/session denial; all14 old task rights grant no care; cross-family request rollback/actor-scoped status; attribution; maximum history entry/cursors; exact recipient/no-broadcast/silent retry/read |
| Final-fence sensitivity inside that9 | Current401/rollback, own fixture-only final-fence omission200/commit, restored401/rollback after the same route-row wait and natural expiry. Actual request lock wait observed. Original function restored in finally and exact source body verified before stop; no delivered defect is claimed |
| Fixed care + retained plan channel | **19/19**,0 failures/skips,192.862ms; actual finite policy/provider/gateway/cookie factories with synthetic ports, no browser or genuine Auth |
| Care ports/controller/model + retained app state | **21/21**,0 failures/skips,336.967ms; rejected status/read versus uncertain malformed write, held logout/owner/CSRF fencing, explicit v2/no fallback, strict canonical validation retaining original fetched v1/v2 object identity |
| Strict bounded root compiler | Exit0, no diagnostics; actual four care modules, six focused files and imported handlers/runtime, parent TS6/types read-only, strict/noEmit/ES2022/bundler/allowImportingTsExtensions; no root install or flag relaxation |
| Actual full frontend/session typechecks | Both exit0, no errors; checked-in flags unchanged |
| Actual catalog / metadata | Exact full TS/SQL metadata equality:13 care/26 plan/14 task.12 private care/dependency tables;0 RLS/raw-ACL violations;0 private helper/base EXECUTE or unpinned search-path violations. Public Care/Plan RPC ACLs anon/authenticated/service_role = **false/true/false** |
| Source preservation / input integrity | All55 historical migration hashes equal8366dedd and71852c0d. Entire M56 outside two helpers equal bd40. Author957b7ac fix blobs exact. All five imported original hashes/byte counts match |

Counts overlap and must not be summed as portal acceptance. Retained26 includes105 unique reported descriptors with bounded pagination, stale-head cursor denial, no fake activations, current/historical carry, exact owner/identity, read-only/ended state, live source/session/cancellation waits, CAS/queue rollback, explicit dependency rebase/fresh reviews/later publication and deferred head rollback. Focused37 retains the near500k/50-product mapping and exact400000/400001-byte boundaries. The original review's separate persisted near500k/50-product run,155-event full history stress and two publication-order races were **not rerun** or promoted to fresh evidence here.

Setup observations are retained separately: the first original-repro adaptation omitted the owned socket environment and was rejected before database access; corrected explicitly. The first channel bundle was emitted under the root artifact tree and could not resolve external `@supabase/auth-js`. Re-emitting through the retained runtime `.test-build/w7-care-r2/` layout resolves installed workspace packages and passes19. Root-dependency absence produces the existing esbuild missing `expo/tsconfig.base` warning and Node typeless-package warnings; strict bounded root and actual frontend/session compilers pass unchanged. None of these setup errors counts as defect sensitivity or a production finding. Portal-only locked offline `npm ci --ignore-scripts --no-audit --no-fund` installed130 packages; no package/lock/config change.

## Retained objections and authority boundaries

| Prior finding / boundary | Disposition in this round |
| --- | --- |
| Original CB1 / CB2 | **ADDRESSED**, exact original R2 and V3 mechanisms, historical sensitivity and selective controls above |
| Backend F1-F5/Q1-Q2 and R2-1/R2-2 | Prior R3 addressed dispositions retained. Reviewed54/55 byte-preserved; current source/session/care/dependency/queue checks rerun where in retained26/independent9. Original76-case backend R3 matrix was not recertified |
| Source/private receipt authority | Source-linked dependencies recheck actual authority after waits; cached Care status/retry expire after verified waits. Old committed receipts are historical acknowledgements, not new authority. No source grant or raw-media completion added |
| Human approval/payment/publication | No changed grant, public DTO/action, callback/auth, migration ordering, approval, money, first-service, receipt or Start write logic. Current dependency invalidation/rebase/deferred guards stay mandatory. No approval/money bypass is claimed |
| Task14 / old legacy guidance paths | No new task right. Granting all14 old actions still denies Care in executed checks. Dependency task denial remains explicit in the unchanged wrapper; view-only dependency denial is executed. Old activated guidance barriers remain in unchanged54/55 call chains; no caller flag or generic dispatch introduced |
| App A1-A3, C1, AR1 / current core | Qualified earlier dispositions retained, including A2 ordinary restore/browser reachability unproven and the original pending-after-valid-ack expectation being incorrect. Current21 confirms strict fetched-object identity and session/view fences; no global error clearing or weakened basis check |
| Native product-free main13 / readonly4 / H1/H2 | Prior scoped PASS remains at its actual recorded head; no new native/browser acceptance from this review |
| Sources/retention/notifications/privacy | Raw-source lifecycle/rights, manual never-started deletion and12-month retention remain separate. Durable queued events are not delivered/read email. No license/clinical/legal clearance or source/training/export authority follows |

## Reproduction commands

Commands run from the exact worktree root. Owned fixture must be independently allocated/verified first. The guarded legacy/adjacent/descriptor harnesses require the RUNNING receipt and refuse this now-STOPPED fixture; copied original probes additionally require the explicit owned socket. Do not start/adopt another reviewer/author or parent fixture. Preparation recreates only the positively marked own minimal database.

```sh
export PATH=/Users/kanuj/.nvm/versions/node/v22.23.0/bin:/opt/homebrew/opt/postgresql@15/bin:$PATH
export PYTHONDONTWRITEBYTECODE=1
python3 .local-artifacts/w7-care-r2/bootstrap.py
python3 .local-artifacts/w7-care-r2/legacy.py --prepare
python3 .local-artifacts/w7-care-r2/sensitivity.py
python3 .local-artifacts/w7-care-r2/legacy.py
python3 .local-artifacts/w7-care-r2/legacy.py --retained
python3 .local-artifacts/w7-care-r2/original-repros.py old
python3 .local-artifacts/w7-care-r2/original-repros.py current
python3 .local-artifacts/w7-care-r2/adjacent.py
SHELV_CARE_SOCKET=/tmp/sh-w7r2-d65c-91b04a78 python3 .local-artifacts/w7-care-r2/independent.py
python3 .local-artifacts/w7-care-r2/descriptor.py
python3 .local-artifacts/w7-care-r2/later-pause.py
node --experimental-strip-types --test tests/portal-care-contract.test.ts tests/portal-care-handler.test.ts tests/portal-rebuild-domain.test.ts tests/portal-rebuild-handler.test.ts tests/portal-rebuild-advisor-reads.test.ts tests/portal-rebuild-advisor-handler.test.ts
node --experimental-strip-types --test --test-concurrency=1 apps/portal/tests/rebuild-care-ports.test.mjs apps/portal/tests/rebuild-care-plan-model.test.mjs apps/portal/tests/rebuild-app-state.test.mjs
node --test --test-concurrency=1 apps/portal/session-integration/runtime/.test-build/w7-care-r2/*.js
npm --prefix apps/portal run typecheck:rebuild
npm --prefix apps/portal run typecheck:session
node /Users/kanuj/.t3/worktrees/shelv/kanuj-portal-rebuild-integration-20261030/node_modules/typescript/bin/tsc --ignoreConfig --noEmit --strict --allowImportingTsExtensions --target es2022 --module esnext --moduleResolution bundler --types node --typeRoots /Users/kanuj/.t3/worktrees/shelv/kanuj-portal-rebuild-integration-20261030/node_modules/@types src/contracts/PortalCare.ts src/contracts/PortalCareValues.ts src/contracts/PortalCareValidation.ts src/contracts/PortalCareMapping.ts tests/portal-care-contract.test.ts tests/portal-care-handler.test.ts tests/portal-rebuild-domain.test.ts tests/portal-rebuild-handler.test.ts tests/portal-rebuild-advisor-reads.test.ts tests/portal-rebuild-advisor-handler.test.ts
python3 .local-artifacts/w7-care-r2/audit.py
python3 .local-artifacts/w7-care-r2/stop.py
```

`bootstrap.py` intentionally refuses existing data/socket paths; the block is an execution record, not a blind restart recipe. `sensitivity.py` intentionally exits1 with the four expected assertions. The original old repro exits0 while asserting bad outcomes. Corrected current assertions, raw JSON and the adaptation source preserve that distinction. Channel bundling used installed esbuild with absolute working directory `apps/portal/session-integration/runtime`, entry points `tests/care-channel.test.ts` and `tests/plan-channel.test.ts`, outdir `.test-build/w7-care-r2`, bundle/node/esm/packages-external, matching the retained runner pattern without its broader fixture lifecycle.

## Returned resources and limits

**Own PG finally STOPPED at2026-10-31T06:32:54.465730+00:00.** Fresh cluster data `.local-artifacts/w7-care-r2/pg/data`, socket `/tmp/sh-w7r2-d65c-91b04a78`, port55479, database `shelv_w7r2_d65c_synthetic`, marker `W7 care R2 d65c independent synthetic Unix-only 20261031`. Initial PID83928 was stopped at06:29:16.039045UTC. After noticing the requested known-later-pause control had only adjacent coverage, positively rechecked the same owned stopped data/marker/absent PID/socket, restarted only it with `pg_ctl -D <data> -l <own-artifacts>/pg/final-control-server.log -w start`, and ran that control plus the complete source/catalog audit again. Final owned PID7190 was then stopped. Both custody receipts are retained.

Fresh checks before each stop matched exact data/marker/socket/port/PID/process command, empty listen_addresses,0 TCP handles and **0 other client connections**. Exact owned `pg_ctl -D <data> -m fast -w stop` exited0; fresh status exited3/no server running; postmaster.pid/socket absent. All owned test/SQL/subprocess handles closed. Data and every log retained; no deletion or broad kill.

Before stop, both patched helper bodies and the restored public Care dispatcher were compared exactly with delivered source, using full unstripped prosrc bytes. Final catalog/source audit is retained. No fixture-only mutant remains.

Read all26 new canonical pgTAP assertions but **did not execute** them: actual `pg_available_extensions` reports pgTAP unavailable. No full canonical56 `supabase db reset`/pgTAP, genuine JWT/Auth/served native Edge/PostgREST/cookie/Vault/Storage journey, full root/portal/session runtime suite/build/Expo/iOS, security advisors or exact-head CI was run. Those remain parent acceptance gates. The fixture substitutes only Auth identity/session claims and minimal prerequisite tables; persisted SQL and actual Care/Plan handlers/parsers/mappers execute. It is not genuine care acceptance.

No browser/Chrome/DOM/preview call, Docker/Colima, parent credentials, R4/R5/R6 fixture/helper lifecycle, author/fix/old review PG reuse, hosted action, real source/client/permission/finance/message/email/purchase/retailer action, push, PR, merge or deployment. W3 retains sole Chrome and active UI ownership. The parent's R4 stop/retained backups and retired source-only R5 remain parent-attributed custody facts, not this review's independent execution. Current early-form red cases were not rerun or accepted.

Only this report is committed after owned-path/link/secret/temp-file review and `git diff --check`. CB1/CB2 closure returns the backend review slot; no full-goal completion or release claim follows.

## Retained evidence hashes

The ignored `evidence-manifest.json` binds the scripts, raw results, setup/expected-failure/green logs, runtime/config/thread evidence, source/input audits and both stop receipts. PG data/logs remain separately retained. Selected SHA-256 values:

| Artifact | SHA-256 |
| --- | --- |
| Original `candidates.py` | `2c3611f03b4c24a89aa8bc8364ba0db3fca86990b7cb5ff03995f59df82285f8` |
| Original `r2-findings.py` | `e245349cc2ec9ab895e6ba20e801524e5c3803c9b44929bd39e937ea88f25743` |
| Original `r2-findings.json` | `7cdc7247dfdf10987f3fa4f085209daa9c433eaf289227555b12718a48b89588` |
| Current review `repro-old.json` | `cc9393a577f1581841a274384f498effca7a4115015b37ce0d4f9ad16cc4e7e7` |
| Current review `repro-current.json` | `e10f4430c2823314174b1d3311d87445e22e395b5a285550bc1c0211022c15dd` |
| `sensitivity-red.log` | `0c3e1145781191454af43c2074506480e83ba2188b6151f5f4984fbd623995b9` |
| `legacy11-green.log` | `60952220c6fd1cace81a57f864c93483f56bdc67728da77034bfd661ff56491c` |
| `retained26-green.log` | `f744765c3880b7c105c763b2cdfb73bf7942e17c2fbf1f1d8f1134d5f47dd98c` |
| `catalog.json` | `33addde472cc0ad7bc629146292a84bc607eb236b35f9d853664a806d93adabf` |
| Final `fixture.json` | `798fbdc7f04f9116f0325ac5dc406e70e0b694a13fc83ece9ee518b610ed10d5` |
| `evidence-manifest.json` | `30ccf6faaacded5aeefcc90e3b4a3347a39a033ec7f53829605e55f0dd22bfea` |
| Delivered M56 | `d3a889ab03cba381cd8d2d65b8b567db74ac5f19e6000a0e913c78982fe901e1` |
