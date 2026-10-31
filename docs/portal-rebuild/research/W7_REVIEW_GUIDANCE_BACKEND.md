# W7 independent M58 report and exact-guidance review, round 1

31 October 2026. Frozen W1 candidate **`d33e2587ec017aea50eea9f421be2a51d594997e`**, original W1 base **`08575a966a7cb22d464d9226fd95defdf2c96470`**. No earlier independent M58 review exists. This is a source, pure-contract, actual-handler and isolated native SQL review, with synthetic Auth. It is not genuine JWT/Auth/PostgREST/Storage/browser, canonical migration, application, hosted or release acceptance.

## Separate verdicts

- **Specification: FAIL for M58.** RG1, RG2 and RG3 below are independently reproduced **P2** violations of publish/read consistency, lossless legacy gating and exact source-locator validation.
- **Correctness and quality: FAIL for M58.** Valid bounded controls and all retained 33 native cases pass, but ordinary authenticated paths can commit content that subsequently makes history unavailable, and an alternate legacy reader silently omits published guidance. All three findings remain unresolved. No P1 or authorization-bypass finding is asserted.

The separately allocated M59 Plan wire-budget correction is an **acknowledged excluded dependency**, not an M58 finding closed by this review. No M59 source, tests, fixture state or later author work was imported, executed or adjudicated. Correcting that dependency alone cannot close these M58 findings. Full-goal acceptance still requires corrected M58, separately reviewed M59 and fresh canonical/genuine/integrated evidence.

## Exact task, runtime, checkout and source imports

| Field | Actual evidence |
| --- | --- |
| Role / workspace | Independent W7 reviewer; `/Users/kanuj/.t3/worktrees/shelv/t3-11a40ed2`, branch `t3/review-guidance-backend` |
| Starting parent | `28f6a2998a06575c973b3ab7a745ceaf752f4c21`, clean tree |
| Original W1 source base / frozen candidate | `08575a966a7cb22d464d9226fd95defdf2c96470` / `d33e2587ec017aea50eea9f421be2a51d594997e` |
| Reviewer assembled source HEAD | `165d5cc34065780ce359764616fd6ade1fe32a38`; parent plus only the seven authorized attributed imports below |
| T3 task key encoded in actual delegated thread/message IDs | `command:mcp:80ff67d2-459c-49fa-93e3-1b40a1f4cbcd:delegate-task:portal-rebuild-w7-review-guidance-backend-20261031-r1` |
| T3 thread | `thread:delegated-task:command%3Amcp%3A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%3Adelegate-task%3Aportal-rebuild-w7-review-guidance-backend-20261031-r1` |
| Actual T3 run | `run:thread:thread%3Adelegated-task%3Acommand%253Amcp%253A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%253Adelegate-task%253Aportal-rebuild-w7-review-guidance-backend-20261031-r1:ordinal:1` |
| Actual parent / project | `d632030a-18f7-4dec-a2c9-f5c0418c3fd5` / `ac0af19d-d404-4f53-a870-02bfd76c2a80`, from live thread readback |
| Codex harness thread | `01a1922d-53c1-7d21-9463-7e14ded8ca1c` |
| Effective runtime | Both live `orchestrator_capabilities({})` and `t3_thread_configuration({})`: **codex / gpt-6.1-sol / reasoningEffort=xhigh / serviceTier=default**, full-access/default |
| Supported descriptors | Sol reasoning `low, medium, high, xhigh, max, ultra`; service tier `default, priority`. The effective explicit xhigh/default values are supported; model descriptor default low was not mistaken for the effective effort |
| Project / role pins | Project model/default-subagent Sol/xhigh; exactly eight `w0_foundation` through `w7_verification` TOMLs each explicitly Sol/xhigh. All eight role files SHA256 `a1f57cf26da8626380cbaa101ca04dc39a92e4bd6aa6acb6cd9f5f24a05d9feb`; project config SHA256 `927e3dd532c0daabbb975f6879866aa99cbc12d3f20d080b0568867e37ee66ff` |
| Node | Actual `v22.23.0`; every Node/npm/compiler command used explicit `/Users/kanuj/.nvm/versions/node/v22.23.0/bin` in PATH. No settings or compiler flags were relaxed |

The capabilities response calls this child its `parentThreadId`; the actual parent above comes from `t3_thread_read`. Original full 17,145-character task text, untruncated, and actual run/thread metadata are retained in the ignored evidence `task-record.json`. Runtime responses are retained as `runtime-0.json` and `runtime-1.json`. No nested delegation occurred. The audit-context skill's dispatch instruction was superseded by the task's explicit no-nested-delegation boundary; call-path mapping was performed here.

Imports used `git cherry-pick -x` in this checkout only, in the required order. Original author attribution and source commit trailers remain intact. These are attributed review inputs, not reviewer-authored production changes.

| Authorized source commit | Local attributed import |
| --- | --- |
| `26f9ae3286a7878632ed7ffb058297bfbd2f9518` | `f549bb9b03276035f3a62b8febd29f86645ca328` |
| `a977b19048408607c5857ba98acf4fd79568ff98` | `9a14b24bd9506ad7ef7a2dd2ae3c9ed426eda175` |
| `9fcb17458c70fd770c961e03efc5f7224689df5d` | `e2fde0b33a37c03b8279228be5d33384f95c3197` |
| `7cdf86da2c83db4019826aac15921ee92846de68` | `a6334692a5a8f468c372b4c96e61bcf9db5e83ab` |
| `30f40da954f5f9f3f4c96c320237ace0aecdd6e4` | `c550247100272a8b7f8ae4f9edf20e1d64ad6502` |
| `96db032faf282d61f6a890eb38923dfd48893e39` | `577d8f900cb5bb97d92545be1372aed7dfe09d0d` |
| `d33e2587ec017aea50eea9f421be2a51d594997e` | `165d5cc34065780ce359764616fd6ade1fe32a38` |

No conflicts, semantic import edits, broad latest-branch checkout, rebase, reset or parent write occurred. Local `origin/main` was inspected at `d39a7d4943209080df7c4cf97d85784f462758bf`; this is a local freshness observation, not a new remote fetch claim. The unrelated raw client Review scaffold `88d4e588` already in the starting parent was not treated as server activation.

## Requirements and preserved prior qualifications

Read root/portal AGENTS, README, all 95,388 bytes / 1,005 lines of [APPROVED_INPUT](../source/APPROVED_INPUT.txt) in bounded chunks, including appendices A/B/C, the full compact and detailed manifests, implementation contracts, implementation plan, acceptance matrix, workstreams, current status and [DECISION_ADDENDA](../DECISION_ADDENDA.md). Verified the separately stored D01-D48 and desktop specification equal their fully read appendices, and the full JSON manifest equals appendix C. All five imported byte counts/SHA256 values match INPUT_PROVENANCE. No approved design was reopened.

Read [W1_REMAINING_API](W1_REMAINING_API.md) lines 175 through its end, and both complete frozen [W1_REPORT_GUIDANCE_CONTRACTS](W1_REPORT_GUIDANCE_CONTRACTS.md) and [W1_REPORT_GUIDANCE_IMPLEMENTATION](W1_REPORT_GUIDANCE_IMPLEMENTATION.md). Earlier checkpoint paragraphs are historical; later source-manifest, strict-consumer and M58 sections govern. Their exact frozen blobs are included below. Relevant canonical source inspection followed the new modules through actual retained parsers, handler/runtime, mapper, Care/Plan/advisor guards, original check-in/reply/service projection, source rights, publication barriers, request journals, decision row/provenance and outbox/constraint call paths.

Preserved prior independent reports were consulted for their exact qualified obligations, not recertified as new evidence:

- [W7_BACKEND_R3](W7_BACKEND_R3.md): source/session/authority after waits, immutable cached receipt access and original legacy write final fences.
- [W7_CARE_BACKEND_R2](W7_CARE_BACKEND_R2.md): actual legacy chronology, descriptor compatibility, honest known/unknown Start and selective legacy representability.
- [W7_CARE_HISTORY_FILTER_REVIEW](W7_CARE_HISTORY_FILTER_REVIEW.md): NULL-safe exact product membership and complete filtered pagination.
- [W7_STATUS_RECOVERY_R2](W7_STATUS_RECOVERY_R2.md): status is READ; errors/absence do not clear uncertain writes or replace exact pending UUID/payload with a fresh write.
- [W7_CARE_INTEGRATED_REVIEW](W7_CARE_INTEGRATED_REVIEW.md): prior genuine57/Node11/browser15 evidence remains its own bounded historical acceptance, not M58 evidence. Its R7 resources were not opened or polled.

D39 remains manual authorized deletion for audio/transcripts on never-started drafts, and 12 calendar months after actual support end once service starts. No abandonment timer, source/transmission/training/export grant or new real identity/grant was invented.

## Findings, all unresolved

### RG1 / P2: publish readiness accepts blank change entries that make public history unreadable

**Requirement:** safe incomplete saves remain possible, but publication must produce valid complete public guidance; an actual no-change review uses `changes:[]`. D16/D32/D48, original review brief items 6 and 12, and the frozen positive public-history mapper apply.

**Cause:** [M58:373](../../../supabase/migrations/20261031091520_portal_rebuild_reviews_guidance_v1.sql#L373) checks only `clientReport`, `conclusion`, `rationale` and `nextStep` for a review. It never checks nonblank supplied `changes` members. The positive [checkPublished mapper:78](../../../src/contracts/PortalReviewMapping.ts#L78) explicitly requires every change to be nonblank. The create/save parser intentionally accepts incomplete blank strings. Review, approval, output authority and deferred completion all reuse the incomplete readiness predicate, while the publish receipt contains no body to expose the mismatch.

**Actual reproduction:** on a freshly reviewed/funded/published synthetic V3 plan, use a normal otherwise complete review with `changes:[" \t"]`. Through the actual Guidance handler/parser/mapper/SQL bridge:

1. `create_guidance_draft_v1` returns200; its only issue is `review_required`.
2. `review_guidance_v1`, `approve_guidance_v1` and `publish_guidance_v1` each return200.
3. One canonical public output and its notification event are committed.
4. `read_care_history_v1` returns **503 `{code:'unavailable'}`**, because the committed review fails `checkPublished`. The retained private SQL/output and receipt demonstrate commit; this is not merely an uncertain failed write.

Final repeated receipt/output IDs and exact inputs are in `i01-blank-change.json`; correct expectation fails `200 != 400` in `independent-red3.log`. Both client history failures were independently repeated. Positive controls publish `changes:[]` and `changes:['use the authored schedule']` and read history200; an incomplete private draft remains silent. This isolates readiness versus read-contract disagreement. **Impact:** an ordinary permitted human publication can break history availability for that client until separately repaired. No auth bypass, automatic service start or provider delivery was demonstrated.

### RG2 / P2: legacy check-in reads silently omit a published reply's next step

**Requirement:** original brief item 10 requires alternate legacy operations/check-in/Plan/Care readers to return exact409 `content_version_required` / `guidance_version_required` whenever new guidance is not losslessly represented. Genuine lossless historical cases remain readable. D20/D32/D48 require guidance preservation.

**Cause:** [M58:669](../../../supabase/migrations/20261031091520_portal_rebuild_reviews_guidance_v1.sql#L669) and [M58:673](../../../supabase/migrations/20261031091520_portal_rebuild_reviews_guidance_v1.sql#L673) gate goal reports/amendments and some advisor-private additions, but neither gates typed published replies. The retained [checkin_projection:19](../../../supabase/migrations/20261024230829_concierge_checkin_replies.sql#L19) can return only reply ID/text/author/time. It cannot represent `GuidanceBody.reply.nextStep` or its explicit publication binding.

**Actual reproduction:** use the preserved synthetic legacy report and actual entitled R2 publication2. Through normal new Guidance create/review/exact-approve/publish, publish a reply with `reply:'reviewed reply'` and `nextStep:'material next step only in new guidance'`.

- New `read_care_history_v1` returns200 with that exact reply record, publication2 and the full next step.
- Actual old Checkins `client_read` returns **200**, with the same canonical reply UUID/text in `advisorReplies`, but **no next step**, instead of the required actionable409.
- No goal-report row/amendment is needed; therefore their unrelated gates do not mask the defect.

The exact canonical UUID and both results are retained in `i02-legacy-reply.json`. Correct expectation fails `200 != 409`, repeated in `independent-red3.log`. The genuine retained legacy reply without new fields reads200 as the lossless control. **Impact:** an older supported reader can present incomplete published follow-up guidance as a successful current read. The approved exact Checkins error-map and gateway prefix-alias changes work when SQL actually emits409; they cannot fix a missing SQL version fence. No funds, Start or permission escalation was demonstrated.

### RG3 / P2: direct Review RPC validates only one locator per source/version

**Requirement:** original brief items 3/7 require all exact source/version/whole/time/text/page tuples to be valid; manifest permission deduplication cannot skip locator validation. The fixed authenticated public SQL RPC must preserve the same closed validity rules as the handler. D20 preserves precise source provenance.

**Cause:** [review_source_check:84](../../../supabase/migrations/20261031091520_portal_rebuild_reviews_guidance_v1.sql#L84) applies `DISTINCT ON(sourceId,sourceVersion)` **before** its [range check:85](../../../supabase/migrations/20261031091520_portal_rebuild_reviews_guidance_v1.sql#L85). Shape validation checks scalar types/minima, not `end > start`. Consequently a representative valid locator can hide another reversed range for the same source/version. [review_conversation_check:145](../../../supabase/migrations/20261031091520_portal_rebuild_reviews_guidance_v1.sql#L145) relies on that function for the complete flattened relation. The TypeScript [checkSourceLocation](../../../src/contracts/PortalReviewValidation.ts#L104) checks every locator and therefore disagrees.

**Actual reproduction:** on an authorized human's same-client synthetic source/version1, record one fact containing, in this order:

```json
[
  {"locator":{"kind":"text","start":0,"end":1}},
  {"locator":{"kind":"text","start":8,"end":4}}
]
```

Each full tuple also carries the same actual source UUID and `sourceVersion:1`. Actual handler rejects400 `invalid_input`. Calling the **public fixed `concierge_review_command_v1`** under `SET LOCAL ROLE authenticated` and the synthetic human session instead returns a normal conversation receipt, commits both locators and advances the report revision. The next actual advisor history handler returns503/unavailable because its positive conversation mapper rejects the stored reversed range.

`i03-locator-validation.json` retains the full command/result, committed stored body, direct RPC exit0 and history503. Correct denial assertion fails in both independent runs. Valid two-locator inputs pass handler and SQL and remain readable; a single reversed locator correctly fails SQL with `concierge_invalid_input`. The same root cause also accepted two same-source **time** locators when only the second had `startMs:8,endMs:4`; that raw bad-outcome diagnostic is not counted as a passing validity requirement.

**Impact:** permitted direct authenticated RPC callers can persist invalid private provenance and make private history unavailable. This is a SQL validation gap, **not** an unauthenticated, cross-client, source-permission or service-role bypass. All exercised source ownership/permission checks were valid, and helper/raw-table ACLs remained denied.

## Independently executed evidence

All local evidence is under ignored **`E = .local-artifacts/w7-m58-r1-11a40ed2/`** in this reviewer checkout. These artifacts and the stopped PG data are retained locally, not committed or available merely by integrating the report. `evidence-hashes.json` inventories the small evidence files. Committed production and test source remained unchanged after import; all reviewer probes and copied resource bindings are ignored.

| Check | Actual independent result / limit |
| --- | --- |
| Frozen candidate preservation | All28 changed files byte-equal d33; all57 pre-M58 canonical migrations byte-equal085; seven imports clean with attribution |
| Full applicable original input | Five provenance hashes/byte counts match; D01-D48/spec/full-manifest appendix comparisons match |
| Focused actual source/handler suite | **76/76**,0 failed/skipped,6060.551833ms; `source76.log` |
| Source maximum-vector diagnostic from that run | Document497944 bytes; V3 **1555338** bytes; reported page399100; **2550 actual scopes**,26 pages, max59698; each full detail body120000. Cumulative detail bytes308799390 are separate reads, not one response.50 paused products retained. Pure synthetic values, not persisted maximum Plan acceptance |
| Exact consumer strict flags | Exit0, zero diagnostics; `consumer-strict.log`; `strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `skipLibCheck:false`, real ES2022/DOM/DOM.Iterable, react-jsx, ESNext/Bundler, actual React/ReactDOM types and transitive source imports |
| Strict actual test/handler imports | Corrected command exit0 / zero diagnostics, `tests-strict-corrected.log`; initial own-portal-only typeRoots lacked Node types and failed TS2688, recorded as setup, not a candidate defect |
| Real retained gateway JSON / ClientProvider.perform / safeError | **9 vectors** pass, external fetch denied; `gateway9.log`. Exact alias only, unknown prefixes remain closed |
| Retained no-network session source | **32/32**,0 failed/skipped,687.818208ms; `session32.log`. No session stack/build/fixture was started |
| Retained actual-handler/SQL native suite | **33/33**,0 failures/errors,89.896s; `native33.log`. Auth is synthetic; canonical concierge prerequisite subset plus exact M54-M58, not full57+Auth project |
| New defect assertions | **3/3 fail at intended correct assertions**, repeated; `independent-red3.log`,6.009s. They are RED evidence, not accepted behavior |
| Own bounded controls | Initial5 groups pass16.005s; corrected locator control plus new source-wait control2 pass4.312s. **Six distinct groups, not seven additive independent groups**. Locator time-range bad-result diagnostic is not a validity PASS |
| Own complete private manifest | **2000 exact locators** over two real immutable50-fact/20-locator conversations; independently computed complete tuple digest matches; replacing only last locator in a new immutable conversation changes hash while count stays2000; public canary absent and cross-client cursor409. `c04-manifest2000.json` |
| Own instruction detail/paging | Three actual typed published instruction scopes over three limit1 pages, all unique; matching exact detail200, wrong hash409, forged future snapshot day409. `c05-manifest-control.json` |
| Own private original-receipt source wait | Actual source row lock observed; cached original create receipt queried after latest draft becomes clean; natural one-second session expiry while blocked produces **401/session_ended**, no canary, original receipt unchanged. `c06-private-wait.json` |
| Retained-row migration rehearsal | Native fixture compares original rows across **89 pre-M58 concierge tables**, excluding only new report_format column after DDL; equal. `fixture/00eedd21b3f74dd18bd1f6e50cfb909d/legacy-preservation.json`. Synthetic retained-row evidence, not every historical production format |
| Own final catalog audit | **16 new private tables**,73 private helpers/retained bases;0 tested raw ACL/RLS violations,0 helper EXECUTE/search_path violations. Both new public RPCs deny service_role. `pre-stop-audit.json` and native metadata assertions |
| New canonical pgTAP42 | Source inspected; **UNRUN**. `pg_available_extensions` in owned PG has no pgtap. No replacement shim, weakened assertion, old test edit or canonical-stack adoption |

Six distinct control groups cover readable ordinary/no-change review and silent incomplete saving; lossless genuine legacy reply; valid versus reversed source ranges; complete manifest/hash/last-locator/privacy/cursor; instruction pagination/exact detail/day; and original private receipt after real source wait/natural expiry. The first exploratory four-probe invocation also had an unexecuted-publication hypothesis whose setup omitted required `requestId` on `create_draft_v1`; that is retained in `reviewer-probes.log` as a setup failure, excluded from findings. It was not presented as a fourth defect. An ignored probe syntax error was corrected before the source-wait run; no product code changed.

### Exact reproducible commands

Use this checkout and explicit Node PATH; every Python-to-Node child inherits it. The immutable source commands do not require a native fixture:

```sh
export PATH="/Users/kanuj/.nvm/versions/node/v22.23.0/bin:$PATH"
node --experimental-strip-types --test tests/portal-review-contract.test.ts tests/portal-review-handler.test.ts tests/portal-rebuild-domain.test.ts tests/portal-rebuild-handler.test.ts tests/portal-rebuild-advisor-reads.test.ts tests/portal-rebuild-advisor-handler.test.ts tests/portal-care-contract.test.ts tests/portal-care-handler.test.ts
node apps/portal/node_modules/typescript/bin/tsc --ignoreConfig --noEmit --strict --noUncheckedIndexedAccess --verbatimModuleSyntax --skipLibCheck false --allowImportingTsExtensions --target es2022 --module esnext --moduleResolution bundler --lib ES2022,DOM,DOM.Iterable --jsx react-jsx --types react,react-dom --typeRoots apps/portal/node_modules/@types src/contracts/PortalReview.ts src/contracts/PortalReviewValues.ts src/contracts/PortalReviewValidation.ts src/contracts/PortalReviewMapping.ts
node apps/portal/node_modules/typescript/bin/tsc --ignoreConfig --noEmit --strict --allowImportingTsExtensions --target es2022 --module esnext --moduleResolution bundler --types node --typeRoots /Users/kanuj/.t3/worktrees/shelv/kanuj-portal-rebuild-integration-20261030/node_modules/@types tests/portal-review-contract.test.ts tests/portal-review-handler.test.ts
node --loader ./tests/portal-review-gateway-loader.mjs tests/portal-review-gateway-errors.mjs
node --loader ./tests/portal-review-gateway-loader.mjs --import ./tests/portal-review-no-network.mjs --test --test-reporter=spec apps/portal/session-integration/runtime/tests/plan-channel.test.ts apps/portal/session-integration/runtime/tests/care-channel.test.ts apps/portal/session-integration/runtime/tests/manual-methods-policy.test.ts apps/portal/session-integration/runtime/tests/navigation-return.test.ts
```

Own locked portal install was `npm ci --ignore-scripts --no-audit --no-fund`,130 packages, from `apps/portal`; lockfiles/dependencies/flags were not edited. The existing gateway loader and corrected test strict command read parent compiler/package/type files as source dependencies only; **no parent install, fixture or service access**. Full application builds and parent resource access are not implied.

The native runner lifecycle/bindings and all imported helper call sites were inspected **before** any native execution. Ignored copies change only resource/root/input module bindings: `plan-native.py`, `review-native.py`, `review-native-edge.mjs`. Their original assertions remain unchanged; an AST comparison independently confirms the entire original ReviewTests class is identical. Old helper DB/socket are explicitly `DISABLED_NO_DATABASE` / `DISABLED_NO_RESOURCE`; the reused helper's raw/edge/DB/marker/env bindings are replaced before any helper runs. Bridge imports still execute this checkout's actual production parser/handler/mapper/SQL. `adaptation-hashes.json` and all three `.diff` files preserve original/copy hashes and exact adaptations. Originals: native Python SHA256 `15d7ae72894903b8bc3108fc970a36ddd84839dc6d2cddef7bf450f09a61bf3b`; bridge `335e6319cbaba4dff9e5e8397419dc86cca5a67226fe6f29b291520684c858df`.

The actual executed native sequence used these ignored files, only while this task held its own lane:

```sh
export PATH="/Users/kanuj/.nvm/versions/node/v22.23.0/bin:/opt/homebrew/opt/postgresql@15/bin:$PATH"
export PYTHONDONTWRITEBYTECODE=1
python3 .local-artifacts/w7-m58-r1-11a40ed2/review-native.py --start
python3 .local-artifacts/w7-m58-r1-11a40ed2/review-native.py --prepare
python3 .local-artifacts/w7-m58-r1-11a40ed2/review-native.py -v
python3 .local-artifacts/w7-m58-r1-11a40ed2/reviewer-probes.py
python3 .local-artifacts/w7-m58-r1-11a40ed2/independent-controls.py
python3 .local-artifacts/w7-m58-r1-11a40ed2/independent-controls.py test_c03_locator_relation_controls test_c06_original_private_receipt_natural_expiry_after_source_wait
```

The retained lifecycle/probe copies cannot be adopted without a new explicit allocation. The stopped `CURRENT.json` is an ownership record, not a live fixture grant. Do not rerun `--prepare` against any shared/author/parent lane.

## Requirement coverage and unresolved limits

| Pinned obligation | Review disposition |
| --- | --- |
| Review15/Guidance9; Plan26/Care13/Task14 frozen | Source and actual SQL metadata match; all new task agents denied; both fixed runtimes preserve caller bearer and exact RPC allowlist |
| Canonical report IDs, optional observations/no-op | Retained native no-op/exact retry/status, NULL goal legacy columns, wrong ownership/photo refs, report head/notifications and append-only amendment checks pass |
| Conversation / private preparation / actual photos | Provenance buckets and private canaries retained; private notes silent; direct tuple validation **RG3 fails**. Pending/missing/nonowner photo negatives only, no genuine Storage completion positive |
| Every prior published review attention | Retained native two-dependent-review relationships plus separate resolution events, unique event IDs, same stable relationship, full original/amendment and pagination pass; not an exhaustive lifetime stress |
| Legacy history truth / private legacy notes | Retained exact R2 instruction planVersion2/sourceVersion1 separation, publication-null review/reply, private empty note, cursor membership/hash and published-link-only dedup controls pass; alternate reply projection **RG2 fails** |
| Exact human guidance / atomic canonical output | Retained no-change/reply/instruction authority, publisher distinct preparer, revocation/staleness/CAS, missing receipt/queue rollback, concurrent once-only checks pass; publish/read consistency **RG1 fails** |
| Complete private source manifest / live rights | 101-locator retained native and own2000 complete digest/last mutation tests pass; same hash revocation/version/deletion and original private receipt waits deny. Own full100000 stress **not run**; author's count/duration/hash remain attributed claims in frozen W1 report |
| V3 / applicable instructions / honest Start | Pure full2550 scopes and50 paused states; actual bounded detail/pages, future-applicability and descriptor/unknown Start/Stop/native old-gate controls pass. Own actual2550-publication SQL stress **not run**; author211.924s/26 pages/486884-byte smaller V3 remains attributed |
| Canonical decision provenance / stable clinical hash | Retained actual latest v1 versus v2, same-value supersession, unreceipted state unbound, other decision/private prep/finance/unchanged-day stability and future applicability controls pass. Historical retry is not new guidance acknowledgement |
| Alternate legacy readers/writers / exact errors | Source and actual tests retain zero-instruction public-review gate, activated old writer barriers, direct helper/raw ACL denial, exact Checkins409 dictionary and sole exact upstream alias. **RG2 remains a concrete uncovered alternate**; no exhaustive recertification of every pre-M58 path |
| Safe advisor reported-product pages | Actual130 rows, variable byte-limited pages, exact current projection, head/cross-client cursor conflicts, ended-safe audit/access metadata and real VIEW revocation wait pass; safe view does not gain private history/source/edit rights |
| Idempotency / revisions / live after-wait authority | Retained cross-family collisions, concurrent exact retries/CAS and real cancellation/natural expiry/source revocation pass; own original-source receipt expiry after wait adds401/no-leak preservation. Fresh success, cached receipt and status remain distinct evidence |

Bounds remain request500000/response1800000/page400000 UTF8; goal body90000, conversation250000, guidance120000, text4000, comfort1000, goals50/photos100/refs100/facts50 total/20 source locators per fact. The retained actual250000-byte conversation and byte-driven complete history/130-product paging pass. SourceManifest compacts private evidence without changing provider2M or public caps. No cap was weakened for a passing test.

M59 exclusion is exact: old M54 `pg_column_size(p_command)>500000` rejects the retained source-valid490188-byte compact command with507318-byte JSONB storage. This review does **not** claim M58 full-max persistence. The own independently rerun pure497944-byte document /1555338-byte V3 vector is separate from the author's smaller native2550 rehearsal /486884-byte V3. The proposed derived rendered1M guard, compact500k/depth10/nodes250001 and parse/detoast/text-materialization caveat belong to separately owned M59. Its `20261031132531_portal_rebuild_plan_wire_budget_v1.sql` is absent from this assembled candidate; no later file was read or applied.

Unrun: full root npm test/application tsc/test-tsconfig/Expo web or native export, full portal/session builds or full suites, canonical58 reset/pgTAP42, genuine Auth/JWT/PostgREST/Edge/Storage/photo, new gateway/App/renderer activation, Chrome/DOM/preview/visual/accessibility/human comprehension, real email acceptance/delivery/webhooks, full cancellation/export/retention lifecycle, full-goal D01-D48/V01-V17 and exact-head CI. Root dependencies were not installed. No model/provider/private credential retrieval occurred. A hypothetical midnight transition was not represented as an actually elapsed server-day test; the exercised future-day rejection and private helper applicability controls are labelled as such.

Official primary documentation consulted read-only for [PostgreSQL15 constraint triggers](https://www.postgresql.org/docs/15/sql-createtrigger.html), [row/advisory lock semantics](https://www.postgresql.org/docs/15/explicit-locking.html), and [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security). Supabase changelog `.md` fetch returned unsupported content type; no platform upgrade or live Supabase change was attempted. Source and actual owned SQL, not general documentation, establish the findings. Some broad tool output was truncated; relevant bounded ranges were subsequently read. No claim depends on truncated generated metadata; full generated SQL/TS metadata equality was executed in retained native tests.

## Resource return and preservation

**STOPPED, own lane only.** PostgreSQL **15.19 Homebrew**, marker `W7 M58 11a40ed2 independent synthetic Unix-only 20261031`, database `shelv_w7_m58_11a40ed2_synthetic`, port55492, socket **`/tmp/sh-w7m58-00eedd21`**, PID5655. Data/logs/dumps retained under **`E/fixture/00eedd21b3f74dd18bd1f6e50cfb909d/`**. `listen_addresses=''`, socket permissions0700,12 connections/16MB buffers, no TCP. Actual server Chicago date was2026-10-31; service writes used the actual server day and explicit canonical confirmed-cancellation commands in the retained wait cases.

Before stop, exact PID/data/root/database markers passed and own `pg_stat_activity` showed **zero other client connections**. Final dump/logs were preserved; only this marked server was stopped through its guarded `pg_ctl -D <own data> -m fast -w stop`. Post-stop `pg_ctl status` exits3, **`pg_ctl: no server running`**. `pre-stop-audit.json` and `stop-receipt.json` preserve actual evidence. No other server was opened, adopted, reset, stopped, probed or polled. Synthetic Auth tables/claims in the bridge are not real JWT/Auth acceptance; Storage methods throw.

Author socket `/tmp/sh-rv7a-005fdf80:55487`, its worktree/data, parent R7/frozen57/native76, R6/R4/R5, Docker/Supabase stacks, Chrome/DOM/preview and W2's sole browser custody were untouched. No source/helper process remains running for this review. Node invocations were bounded command processes; all owned wait-locker processes closed. Owned data/logs, copied diagnostics and failed evidence are preserved, not deleted.

The source comparison preserves original client/publication/Start/payment/entitlement/service/private-walkthrough code and all57 earlier migration bytes; retained synthetic row equality is separately scoped above. No real-client data/grant/permission/mail, funds, purchase, deployment, production fix, committed failing test, push, PR or merge occurred. Coordinator owns TASKS/CURRENT_STATUS/CONTEXT_SYNC, import/integration, fixes and a fresh independent round. **Only this report is the final reviewer-owned tracked write and report-only commit for parent integration. Do not integrate its seven attributed input commits merely to integrate the report.**

## Exact candidate-owned blobs

All following Git blobs resolve identically in frozen d33 and the assembled reviewer source tree. `E/blobs.json` also retains SHA256 and path for every entry. M58 SQL SHA256 **`b663f897d669edf33d6c7b0c4e18be8f775ed23c3b539e5bb51620606d912a1e`**. Canonical new pgTAP SHA256 **`172b4fc1c4c98d54b8fd3370b7216ad058da250121b02d34de2f4fd4e77b3fb2`**.

| Path | Exact Git blob |
| --- | --- |
| `apps/portal/session-integration/runtime/server/upstream.ts` | `5af1192b52b90d61c3c8b98552eb0c4ddaf947e4` |
| `docs/portal-rebuild/research/W1_REPORT_GUIDANCE_CONTRACTS.md` | `3bf75f01a98355ca42b999097b4b65624183bc1b` |
| `docs/portal-rebuild/research/W1_REPORT_GUIDANCE_IMPLEMENTATION.md` | `f2bb7b439c281d4fec32c58f2d3ea08277c9829a` |
| `src/contracts/PortalRebuildValues.ts` | `3b034ae42f05a1f21fe9aac9b5c54e9b44243dd1` |
| `src/contracts/PortalReview.ts` | `028e6bf3bb293e68a60e472b3b6ee87f522ee3c3` |
| `src/contracts/PortalReviewMapping.ts` | `917b81da881ae8e091c2414ff4864fa936367bbd` |
| `src/contracts/PortalReviewValidation.ts` | `997afba2c0b1dd3daf129913d3c2b28d27ed5f71` |
| `src/contracts/PortalReviewValues.ts` | `c1e2191cfd0c0b015c31c6e1e4d8066d199d8dd9` |
| `supabase/functions/concierge-checkins/handler.ts` | `efcb8dafea842ee10bcfc1296e3c283df0039e4f` |
| `supabase/functions/concierge-guidance/handler.ts` | `b48a7d2c507b585fc81b728dd7cd1cefb77b1138` |
| `supabase/functions/concierge-guidance/index.ts` | `ec4611ae247da5722ece115f95e113ad7c6b8e9d` |
| `supabase/functions/concierge-guidance/runtime.ts` | `734be0750f0c78468c0131ff48defd869f8c315a` |
| `supabase/functions/concierge-reviews/handler.ts` | `1add119a94ed7f61f74d8e363ff94e8e08aa86ec` |
| `supabase/functions/concierge-reviews/index.ts` | `9a37c70417d96d916e09443d1330a9698dfec94e` |
| `supabase/functions/concierge-reviews/runtime.ts` | `73080e00df9b05811d556de4a25a03dbf370ffda` |
| `supabase/functions/concierge-reviews/shared.ts` | `eff030dc2a03b9657d577bf091d8f8d7b673b131` |
| `supabase/migrations/20261031091520_portal_rebuild_reviews_guidance_v1.sql` | `109404e28e33cea775252d31006e39e2c3a7bf79` |
| `supabase/tests/portal_review_guidance_v1.test.sql` | `cdcb605a20f83a943063702d54cc58e409374d4e` |
| `tests/portal-review-contract.test.ts` | `be3c2113a52eb71602f9e5ae35456b742623f5de` |
| `tests/portal-review-gateway-errors.mjs` | `2d4355818fcce0c9e0079cbc33e3224d0b16a710` |
| `tests/portal-review-gateway-loader.mjs` | `40199646926ca9d5477052206e095544207eb24a` |
| `tests/portal-review-handler.test.ts` | `b118d89bd5af261f7238cee88f8c33c37cff60d5` |
| `tests/portal-review-manifest-stress-native.py` | `e00af70316bc040e6ff6902d00ddb6903d79c6f9` |
| `tests/portal-review-native-edge.mjs` | `7b87e1c14a434811401ea04357fa7ec197fb8d11` |
| `tests/portal-review-native.py` | `784a3a5327ca13ed20805024ce1dfe336c91bc9d` |
| `tests/portal-review-no-network.mjs` | `f538c93cabf78baec72ad50bfcb88d958dc0e2a5` |
| `tests/portal-review-sql-metadata.mjs` | `32f0f6aa7326d43da7764cac3dd61a4d3c24b4e8` |
| `tests/portal-review-stress-native.py` | `2e7d6fc1add63f8e218bcd9823637c1a86a6aa33` |

The report's containing commit is returned with the handoff after final sole-path/diff/link/clean-tree verification, avoiding a self-referential hash inside its own content.

### Retained key evidence hashes

| Artifact relative to E | SHA256 |
| --- | --- |
| `runtime-0.json` | `a4649774610d93eb5db207c1285066e50399ead43d64c52f18d8873f35d60ca4` |
| `runtime-1.json` | `87d89e3a9e0a410393f12dd830cd8a7a618fd5a584df19c4339f45399a261f6c` |
| `task-record.json` | `6010ce92a46c9eba548d3974eb10f3126a82dedb8aca1bdf48985f46f1221cf4` |
| `blobs.json` | `d17c04875af1601d1039de5d868c3439b4d5a57fa1c96561e34fc9f83004a209` |
| `adaptation-hashes.json` | `f259fbc9db6fe4e53654ab1099287c90a88cfbba9573ecb5db5e588b83992acc` |
| `source76.log` | `5a7f3fb0fe499dbe5250531b2c1eebccfe7a6212f0888b67166cdf5003539f13` |
| `consumer-strict.log` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `tests-strict-corrected.log` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `gateway9.log` | `364d9daf3fbf418c6e49dd4e81e9a243cae3507cddbe98cc362a122298e9d31e` |
| `session32.log` | `6180a1dcd6409399369ca52cf663661420550c48fea444f2e91d3f0392f0f86b` |
| `native33.log` | `b757cc36e68f0c1388d2b5be04e48d245a461a3b7fb601e36266ba2d1361291e` |
| `independent-red3.log` | `0531cd409681339309f6ef9c25adf9782861b8afa6eca579a6c767d231563cdb` |
| `independent-controls.log` | `c9b8663eefffb312a62874d05ba6d84391587d51a4d2c98bd8bf19e636db38b4` |
| `independent-wait-controls.log` | `1c7bcf8f09c93bdd349768ee1831a73b8c2e41cdce31f2bd4290d55a091ff530` |
| `i01-blank-change.json` | `bc255d6e1b23bf7291cc75d70f7f233223b4c0008abae03ede02bb83313a444e` |
| `i02-legacy-reply.json` | `9f18f3e97a79a312dabdd762bf44a39b006e031c71169c392806f0a94f6ae5f0` |
| `i03-locator-validation.json` | `4fcb1a97786af459da0e6740e816678ea62f711fb7253b5bef81d1dfda92ba53` |
| `c04-manifest2000.json` | `cf1b91fcadb5d0417fb28177f3237e34cc3a55935ef473ca001653f5bb053558` |
| `c06-private-wait.json` | `1cd4ebd4090c3b2a3480bc5d6c4806bcfdb1b3598b0328422cf86d47bb81c392` |
| `pre-stop-audit.json` | `86db884bd36acce4fe93c355ace8006d5ce9af3f27e6a7ce581e87c9f579a896` |
| `stop-receipt.json` | `f83742f06dcbe02500cd4c3d6651d88b56d6086b53a2e78bc75078fcaaa8e168` |
