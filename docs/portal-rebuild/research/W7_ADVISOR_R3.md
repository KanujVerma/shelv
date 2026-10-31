# W7 independent advisor review, round 3

30 October 2026, completed 31 October UTC. Independent source, controller, actual-component and intercepted Chrome review. No production fixes, nested agents or connected acceptance claim.

## Scoped verdicts

- **Specification compliance: FAIL.** F1 and F2 are addressed. F3's disabled disclosure triggers are corrected, but complete authorized long text still cannot be read by keyboard. The retained round-two stale-read candidate is now independently reproduced through actual UI actions and is an important remaining defect.
- **Code quality/correctness: FAIL pending R3-1 and R3-2 below, both P2.** The canonical 60 focused cases pass. Fresh independent intended-behavior assertions fail on these two issues; passing existing tests do not override them. No critical/high issue, server publication/payment bypass, lost manual text or duplicate committed effect was demonstrated.
- **Browser phase: completed within this feature scope.** All contexts/browsers/test sessions are closed. Preview has no tab; final Chrome process inventory is `processPids=[]`. The exclusive allocation was explicitly released before writing this report.

| Original finding | Independent disposition | Evidence and remaining limit |
| --- | --- | --- |
| F1 / P2: older same-target authority restores revoked approval/coverage, or old errors change newer context | **ADDRESSED** | 20 independent controller cases plus the author's F1 cases pass. Actual overlapping refresh controls preserve newer revoked approval/inactive coverage against old success and 401/403/409/503. No server authorization claim follows. |
| F2 / P2: old status A clears pending B after retry A, losing B's exact retry | **ADDRESSED** | 42 independent outcome/order cases and actual status/retry/save UI sequence pass. B's entire command survives old A and B503, retries byte for byte, and clears only after B's valid acknowledgement. |
| F3 / P2: view-only/published readers cannot read complete authorized guidance | **NOT ADDRESSED in full** | All disclosure triggers now work by Tab/Shift+Tab/Enter, with mutations denied. The remaining disabled four-row text fields clip long retained guidance and cannot receive keyboard focus or scroll. R3-2 documents the concrete residual defect. |

## Exact source, configuration and scope

| Item | Fresh verified evidence |
| --- | --- |
| Workspace / branch | `/Users/kanuj/.t3/worktrees/shelv/t3-8ceb4588` / `t3/w7-advisor-review-round3` |
| Clean starting and reviewed application HEAD | `06c5954782977edf8110943b2708cf51ce211661`, exactly the requested parent |
| Original independent source | `134ca45ce6540da992bc774f82f76d53ea1f8744` |
| Original W2 range | `930dab999326796b880af67af26dafa270ae4aab..a432b1acabd94b993a4c3b0ff298758f4ef6bcd8` |
| W2 fix delivery / integration | `4b8f7013c4827b7c26caf83e3c560a3da3dac2a0` / `56bdb4d84ff365922987b1cd860fa28984eded02` |
| Retained incomplete round-two source | `9b2bbaa7e26d58be4a652976927bb7ca1b6a97b4` |
| Later advisor-only change | `db27dead087f74f650738b98e4206a25bded57a1`: three preview opener IDs only |
| Freshness | `git fetch origin` succeeded; `origin/main=d39a7d4943209080df7c4cf97d85784f462758bf`; `HEAD...origin/main=69 0` |
| Effective runtime, before review and before report | Both `orchestrator_capabilities({search:'gpt-6.1-sol'})` and `t3_thread_configuration({})`: `codex`, `gpt-6.1-sol`, `reasoningEffort=xhigh`, `serviceTier=default`, full-access/default modes |
| New delegated round | `portal-rebuild-w7-advisor-review-20261030-r3`, final component of the live delegated-thread identifier |
| Local execution | Explicit `/Users/kanuj/.nvm/versions/node/v22.23.0/bin` first in PATH, Node `v22.23.0`; installed Chrome `156.0.8078.79`; serial `--test-concurrency=1` |

The original W2 range contains 12 feature/test/helper/report paths. All seven fix-delivery blobs equal the retained round-two source. At this head six remain identical; only `AdvisorWorkspace.tsx` differs by the three expected IDs. Its blob is now `48189387a1186bd2a82211424958c434b59b3940`, previously `b7b53b7673c8012e55c0bffa382cfec3ea61dffd`. The controller remains `402a773dfc8091e6b86bb656f9e73be590ee32b7`, and fields remain `498401d2263b2932b0763fd5353d0919226e393e`. The unchanged model/types/exports/CSS, original controller tests and fixture also match `a432b1a`. Complete seven-path evidence is in ignored `source-blobs.json`.

`9b2bbaa..06c5954` also contains W0 application composition/build work and W3 recovery changes. Those are outside this advisor acceptance. This review bundles the actual advisor components/controller against the checked-in synthetic ports, not the final application root. The parent's reported application focus red/green evidence for the opener IDs is separate, not rerun here.

Only this report is a tracked write. Diagnostics are ignored under `.local-artifacts/portal-rebuild/w7-advisor-r3/`. No source, test, contract, migration, route, auth, package, lockfile, shared status or `CONTEXT_SYNC.md` was changed. The report commit is returned in the handoff instead of embedded as a self-referential SHA.

## Brief, prior findings and responses preserved

Read the full [original W7 review](W7_ADVISOR_REVIEW.md), [W2 response](W2_FIXES.md), [original W2 brief/delivery](W2_VERTICAL_ADVISOR.md), root/portal AGENTS, rebuild entry point, D01-D48, full desktop specification, implementation contracts, [plan API](../PLAN_API_V1.md), [advisor read API](../ADVISOR_READ_API_V1.md), ownership/status and acceptance matrix. Inspected all advisor source files, author tests/helpers, complete original/fix diffs and relevant shared control/session/contract boundaries. Applied Resume, review reception/reviewer guidance, verification, repository task-first UX/design and relevant Figma baseline guidance. No nested reviewer or external Figma/Supabase operation was created.

The full first-slice brief remains A00/A01/A02/A03/A04/A04P/A05/A06: independent client/plan directories; safe incomplete unassigned structured work; acknowledgement-only saving and exact retry; explicit existing-client assignment without Auth creation; exact section reviews; strict base/latest/proposed import comparison and manual-work preservation; actual client-safe unpublished callback; exact human approval, applicable verified first payment or later coverage, deliberate publication and truthful committed receipt/queued notification. No fabricated content, source authority, receipt, publication version/date or entitlement is acceptable. Templates, raw upload/lifecycle and email delivery/retry are unfinished and are not accepted here.

The previous `portal-rebuild-w7-advisor-review-20261030-r2` task is terminal with **no report commit or browser verdict**. Read its complete retained draft at `/Users/kanuj/.t3/worktrees/shelv/t3-695ed988/docs/portal-rebuild/research/W7_ADVISOR_R2.md` and read/inventoried its scripts, logs, runtime, generated SSR and artifacts under that checkout's `.local-artifacts/portal-rebuild/w7-advisor-r2/`. The prior log readback records 47 author pure passes, 62 independent F1/F2 passes and five generic-read failures, eight SSR renders and strict types. None is counted as a fresh result in this round. `prior-artifact-audit.json` retains filenames, bytes, hashes and parsed outcomes. The prepared `browser.mjs` had never run; it was copied, inspected, syntax-checked and executed here, then supplemented.

| Original objection | W2 response tested afresh | This round's obligation/result |
| --- | --- | --- |
| F1: same-target late older approval/coverage success or error overwrites a newer restrictive context | Context generation plus session/view/target and operation identity fences success/error; accepted writes invalidate old authority reads; current errors preserve a pending write's busy state | Both context/payment legs, revoked approval, inactive coverage, policy/source rejection, malformed response, owner/target/review replacement and current error during save pass. Actual refresh UI confirms the important reverse-completion cases. |
| F2: status A after exact retry A/new B clears B pending UUID/payload/busy; B503 then loses recovery | Execution/recovery generations and captured pending-object identity; exact retry keeps its original command | Seven old outcomes at six release stages pass: retry A, A acknowledged, B pending, B503, retry B, B acknowledged. Actual UI also verifies two identical B attempts and final saved/null pending. |
| F3: native disabled fieldset hides authorized product/decision/routine/source disclosures | Mutation context disables editing only; shared read Buttons remain active | Trigger correction passes in both modes at 1440/390/320; complete long-text reading does not. Disabled controls cannot substitute for a usable read-only presentation. |
| Provisional R2-1: generic older validate/preview/compare/list503 changes newer busy/notice; older validate409 blocks C | No correction in the reviewed advisor blobs | Five independent controller failures rerun; all four 503 paths and the 409-after-Back path independently reproduced through actual controls. Promoted to confirmed R3-1/P2. |

Mandatory original scripts `/Users/kanuj/.t3/worktrees/shelv/t3-a6bd86ec/.local-artifacts/portal-rebuild/w7-advisor/reproduce.mjs` and `ssr.tsx` were read and copied byte for byte. SHA-256 remains respectively `cfa1454a192c3e4d34532b2e9f9ffc01b265b9be92750377237f1a3dee6531bc` and `c41386b8dba4ce2573b32e9cf1897afac49fef19803159b7eed6d86166ee7208`.

The original F2 script incorrectly expects B pending **after awaiting successful B retry**. Its preceding real steps remain valid. Fresh execution gives 11 pass/1 fail solely at that wrong final assertion; the logged actual result has B pending/busy after old A, two B attempts, retained manual text and final saved/null pending. It is neither an all-green test nor evidence of a current F2 failure. Independent replacements assert pending exact B before acknowledgement/after503, byte-identical retry, and saved/null only after valid B acknowledgement. The original SSR script asserts historical defective disabled markup, so it was read as a defect detector; the intended-behavior eight-render replacement was run instead.

## R3-1 / P2: older read errors corrupt newer operation and conflict state

**Owner:** W2. **Requirements:** D16, D20 and the implementation contract's late-response/generation fences. **Paths:** [controller.ts](../../../apps/portal/src/features/advisor/controller.ts), `fail` lines164-195; directory catch437-439; validation catch597-599; compare catch646-648; preview catch747-749. [AdvisorWorkspace.tsx](../../../apps/portal/src/features/advisor/AdvisorWorkspace.tsx) allows editing/navigation while these reads are pending, and exposes recovery when a notice and pending command coexist.

The F1/F2 corrections fence their particular reads. These other catch paths still invoke generic `fail(e)` with no captured read/view/operation check. It clears `busy` unconditionally and sets `needsComparison` for409 against whatever view is current when the old response arrives.

Actual browser reproduction, independently for validation, preview, comparison and plan directory:

1. Start an actual read: click **validate draft**, **client preview**, submit **compare import** and close that dialog through its normal handler, or enter **plans** while its directory request is pending and click **new plan**.
2. Delay only that real fixture response. Enter manual summary B, click **save draft**, and delay its actual reducer-produced acknowledgement. Current state is `busy:true`, exact B pending, `save:'saving'`, notice null.
3. Release the older read as503. All four paths produce `busy:false`, `save:'saving'`, error notice **could not complete request** and visible **retry same request/check request status**, while B's first acknowledgement remains withheld. B's UUID/payload and manual text survive; only one B attempt has been sent at the observation.
4. Release B's valid acknowledgement to finish cleanup. It saves correctly. Intended assertions that the older read must leave B busy and its notice unchanged fail.

More consequential, actual Back/navigation case:

1. Click **validate draft** and delay its response for revision1. Open **review & publish**, click **back to draft**, then select **client context**.
2. Edit B and save it successfully: revision2, saved, pending null.
3. Release the obsolete validation as409. It displays **draft changed** and sets `needsComparison:true`, although it concerns the older revision.
4. Enter manual C. After the 900ms autosave interval, **save draft** remains disabled, C stays unsaved/retained, and save-call count remains1. No fresh revision conflict has occurred for C. The user is forced into an unnecessary comparison/recovery path.

This is confirmed UI reachability, not controller-only speculation. It is P2 because ordinary delayed reads can falsely release an in-flight write and block continued saving. It is not demonstrated loss of B's retry UUID, private text or server effects, and is not an assertion that every transport error should be ignored.

**Smallest correction:** fence each read's success/error/cleanup with its captured session/view/target, purpose generation and operation identity. An obsolete read cannot release a newer write, replace its notice or impose an old revision's conflict on acknowledged/new work. Retain actual current-session401 handling, real conflict comparison, manual edits and exact retries. Cover all four reproduced paths, both completion orders, current failures and the Back/B-ack/C sequence; inspect adjacent generic catch paths as the same family rather than fixing validation alone.

Artifacts: `independent.log`, `supplemental.log`, `stale-validate_draft_v1.png`, `stale-preview_draft_v1.png`, `stale-compare_import_v1.png`, `stale-list_plans_v1.png`, `stale-validation409-Back-C.png`.

## R3-2 / P2, residual F3: complete retained guidance remains inaccessible by keyboard

**Owner:** W2. **Requirements:** D04, D07, D15, D20 and complete retained guidance/keyboard behavior. **Path:** [fields.tsx](../../../apps/portal/src/features/advisor/fields.tsx), `TextField` lines78-109, especially disabled four-row Textarea95-100; reused by directions, reasons, guides, conclusions and evidence. The enabled `Disclosure` no longer inherits mutation disabling, but the content still does.

In both view-only and published modes, real Tab/Shift+Tab/Enter opens all22 supplied disclosures across client context, decisions, routine and authorized source locations at each of 1440/390/320px. Native/Radix editing controls remain disabled. Direct edit/save/assign/review/approve/publish/payment attempts send zero writes and retain identical content. This part of F3 is corrected.

However, the actual source-derived 511-character first decision reason is shown only in a disabled four-row textarea. Its last paragraph remains below the internal viewport. Fresh measurements:

| Width | Client height | Scroll height | Keyboard focus | Scroll top after Control+End, Meta+ArrowDown, End, PageDown, ArrowDown | Last line reached |
| --- | --- | --- | --- | --- | --- |
| 1440 | 114px | 206px | false | 0 | no |
| 390 | 114px | 321px | false | 0 | no |
| 320 | 114px | 390px | false | 0 | no |

Both modes have identical results. The value stays intact, but the keyboard user cannot read it completely. The page has no separate full-text presentation of that reason. The decisions section has8 clipped textareas at1440,21 at390 and25 at320 in each mode; these include the823-character azelaic directions and additional limitations/guide fields. The first reason is enough to reproduce the defect without relying on a new oversized fixture. Screenshots visibly show the clipping. No screen-reader or mouse-scroll impossibility is claimed.

**Smallest correction:** provide complete noneditable text, an auto-sized read presentation or an appropriately focusable read-only field with usable keyboard scrolling. Keep all mutations unavailable and retain source authorization. Regression assertions must reach the last retained line through user interaction, not only inspect `.value`, `isVisible()` or `aria-expanded`. Recheck product/decision/routine/source long content in both modes at all three widths.

Artifacts: `browser-initial.log` inventories clipping; `supplemental.log` records the six intended-behavior failures; `fulltext-{view-only,published}-{1440,390,320}.png` shows the real field. The author's short synthetic guide/uncertainty strings did not test this requirement.

## Positive evidence, approved frames and explicit gaps

All16 retained native context/PNG records for the eight advisor frames match acquisition byte counts/SHA-256. Read their context records and directly viewed all eight native PNGs, then compared fresh feature screenshots. These are retained approved fictional references, not fresh Figma retrieval, live client material or runtime assets. They do not establish an exact whole-screen pixel match. The synthetic test shell is deliberately narrower than final W0 composition.

| Frame / decisions | Fresh source and executed positive evidence | Limit or visible difference |
| --- | --- | --- |
| A00 `503:449`; D02-D07/D14 | Real client-directory port, search, enrolled identity/status; cream/forest shared controls and stable directory composition | Harness omits optional open-client composition; admission/add-client and full client workspace are not accepted. No invented appointment/readiness enrichment. |
| A01 `500:299`; D14/D16 | Independent draft/publication directory, unassigned filter, deliberate create/save; no Auth/admission call in the feature | Actual directory contract lacks title/readiness, so IDs and actual state are used. Templates/needs-review enrichment remain unfinished; no fabricated native row values. |
| A02 `500:383`; D15-D18/D26 | Free checklist; safe incomplete work; stable distinct product/slot IDs; all eight decision kinds; unknown/none; nonproduct/no-purchase content; selected days, comfort/actual-Start authored stages; rich guidance survives unrelated saving | Canonical browser tests assert1440 editor form `(456,228)`, width584; 168/336 columns reflow at1280/390/320 without horizontal overflow. Expanded modules require vertical flow; full-text read-only issue remains R3-2. |
| A03 `500:500`; D19-D20/D40 | Actual import modal/compare/apply shows base/latest/proposed, changes content only on deliberate apply and clears section reviews. Unsupported fields/code rejected; separate manual work preserved. Private fact text stays plain/untrusted and is excluded from the decoded unpublished callback | Raw file upload/storage/retention/source ACL enforcement and a complete native source-management screen are unfinished. Source-locator disclosure tests receive only an explicitly authorized synthetic projection. |
| A04 `500:592`; D21-D25 | Exact target/reviews/approval; missing/unverified/unknown funding blocks; current authority refresh and stale-response fences | Server current-policy/payment checks remain authoritative. No receipt inferred from copy or a screenshot. |
| A04P `503:672`; D22/D29 | Actual gross amount plus outside-portal receipt confirmation; legacy-v1 quote semantics survive v2 reads; frozen claim/quote/address/revision used; payment never auto-publishes | In-memory verification only. No bank/provider receipt, funds or real client claim was checked. |
| A05 `500:686`; D21-D25/D38 | Both gates still require deliberate publish; later active coverage sends no new first-payment claim; exact target unaffected by payment-only update | Canonical browser publication panel starts `(264,209)`, width736. No actual first service clock/database transaction rerun. |
| A06 `500:779`; D33-D34 | Exact committed receipt displayed separately; queued email/portal event and unconfirmed delivery stated; no automatic republish | Native failed-email/retry and canonical published-view actions are future scope here. Actual screenshot correctly says queued, rather than inventing delivery failure/access dates. |

Shared wrappers/Lucide, authored lowercase UI, preserved proper/source text and semantic tokens remain intact. No feature direct fetch, arbitrary endpoint, executable content, raw HTML injection, CSS lowercase transform or persistent browser draft storage was added. Source text is not authority. The actual preview callback is `mode:'advisor-preview', published:false` with private facts/locators excluded, and no manufactured version/publication time/entitlement. The separate shared-renderer adapter/final app navigation was not accepted by this fixture test.

Task-first review: an advisor can find plans, create before assignment, select any section, edit/save with explicit acknowledgement, inspect import/recovery, review, verify payment and deliberately publish. Actual assignment dialog Escape restores focus; unsupported imports and denied/uncertain writes preserve fields. The two P2 issues interrupt recoverability and complete reading. No copy-only or speculative visual defect is added, and no representative-human comprehension result is claimed.

## Fresh execution and reproducibility

All Node/npm commands use the explicit Node22 PATH above. Portal dependencies were installed from the existing lockfile with `npm ci --ignore-scripts --no-audit --no-fund`:130 packages, no tracked package/config changes. Commands run at repository root unless marked portal. Counts overlap and are not additive acceptance totals.

| Command / check | Actual result and scope |
| --- | --- |
| Portal `node --experimental-strip-types --test --test-concurrency=1 tests/rebuild-advisor-controller.test.mjs tests/rebuild-advisor-races.test.mjs tests/rebuild-advisor-browser.test.mjs` | **60 pass/0 fail/0 skip**:47 author pure plus13 author browser. Fresh rerun, not60 newly authored reviewer cases. |
| `node --experimental-strip-types --test --test-concurrency=1 .local-artifacts/portal-rebuild/w7-advisor-r3/independent.mjs` | **62 pass/5 fail/0 skip**,67 total. F1's20 and F2's42 pass; four old503 and one old409 assertions fail as R3-1. |
| Same command on `original-reproduce.mjs` | **11 pass/1 fail/0 skip**, solely the documented wrong final F2 assertion. Original steps and logs retained. |
| Same command with `--test-name-pattern='old context success\|old A committed released at pending-B'` on `independent-historical.mjs` | **0 pass/2 fail/0 skip** against the retained esbuild-loaded original134ca45 controller, confirming F1/F2 sensitivity. No production file replaced. |
| `node --check .../browser.mjs`, then `node --test --test-concurrency=1 .../browser.mjs` | Syntax pass; **8 pass/7 fail/0 skip**,15 total. Six complete disclosure/mutation cases and F1/F2 UI pass; six full-text cases plus stale validation fail. Original prepared probe's weak focus-or-scroll condition fails too; stronger last-line probes follow. |
| `node --check .../supplemental.mjs`, then `node --test --test-concurrency=1 .../supplemental.mjs` | Syntax pass; **0 pass/11 fail/0 skip**. Five actual UI intended-behavior assertions for R3-1 and six stronger full-text/last-line assertions for residual F3. Failing bug-presence tests are not relabeled passes. |
| `node --test --test-concurrency=1 .../browser-positives.mjs` | **6 pass/0 fail/0 skip**: reverse gate coverage success/errors plus actual A03 source/import/preview positive. |
| Actual `ssr.tsx` bundled with portal esbuild for Node/CJS, normal frontend tsconfig, portal node_modules and empty CSS loader; `node .../ssr.cjs` | Exit0; eight actual component mode/section renders. No DOM/browser result inferred from SSR. |
| Portal `npm run typecheck:rebuild` | Exit0; strict/noUncheckedIndexedAccess flags unchanged. |
| Original/fix/current path comparisons; selected acquisition verification | Expected three-ID-only feature difference; all16 native advisor records valid; original scripts copied with verified hashes. |
| Report links, scope and whitespace | All10 local links resolve; no em dash; `git diff --check` passes. Only this report is eligible for the commit. Final index/commit scope and clean readback are checked at delivery. |

Browser tests served only bundled local assets at finite `.invalid` origins, with blocked service workers, deny-by-default interception, unsupported traffic rejection and console/page-error assertions. There was no API network access: the real feature/controller used the checked-in in-memory reducer and strict production mappers. Faults delay genuine fixture responses, corrupt an acknowledgement or return a selected safe transport status. For initial-directory timing, an ignored esbuild test-entry hook installs that transport delay before the component's normal effect; it does not replace a production function or fabricate a successful feature result. Unexpected traffic/console/page-error assertions passed even in the failing intended-behavior cases.

Source/pure/SSR results, complete test output and screenshots are retained at `/Users/kanuj/.t3/worktrees/shelv/t3-8ceb4588/.local-artifacts/portal-rebuild/w7-advisor-r3/`. Canonical author screenshots are in this checkout's ignored `.local-artifacts/portal-rebuild/w2/`; fresh independent A03 and defect images are in the round-three directory. Full logs distinguish product assertion failures from setup results. Historical esbuild retains the known missing `expo/tsconfig.base` warning; no config was changed. No canonical test was skipped or weakened.

## Separate evidence and exclusions

The parent reports **55 canonical migrations,33 pgTAP files/groups,746 assertions**, **backend round-three scoped PASS**, and **11 genuine native Auth/Edge/PostgREST groups**. [Backend R3](W7_BACKEND_R3.md) and [W0 composition's attribution](W0_APP_COMPOSITION.md) retain their own exact scopes. These are separate parent/backend evidence, not this review's reruns or advisor browser acceptance. No SQL/Auth/Docker fixture, credential or parent retained environment was inspected, started, reset or adopted here.

Not run/accepted here: full portal/session/root suites, root app/test types, additional build/package or Expo web/iOS exports, canonical reset/pgTAP/RLS, real cookie/vault/Auth/Edge/PostgREST browser journey, hosted/deployed behavior, final W0 app or W3 microfix acceptance, raw-source bytes/rights/upload lifecycle, template lifecycle, transactional email delivery/inbox/retry, complete secondary pages/five-stage guide, exhaustive zoom/reduced-motion/screen-reader or human comprehension checks, exact-head CI or release authorization. These are explicit limitations, not passing or waived requirements. Current reported backend evidence does not erase the two frontend defects.

No production fix, other-worktree write, push, PR, merge, deployment, real client/source/permission change, message, funds or order action occurred. Coordinator owns integrating the report, allocating corrections and updating shared status/CONTEXT_SYNC. A fresh independent review must verify R3-1 and residual F3 after corrections before this advisor slice can be accepted.

## Resource release and final report validation

Called `preview_status` first; it had no tab. Opened one owned blank preview and closed it before the explicitly allocated repository Chrome harness. After all browser work, fresh `preview_status` returned no tab and process readback found no Chrome/Chromium processes. All bounded test sessions are terminal. `release.json` records release at `2026-10-31T01:54:33.932780+00:00`; the allocation was explicitly released in commentary before report writing. No browser handles are returned or retained.

The retained historical controller bundle was also freshly regenerated from `git show 134ca45:apps/portal/src/features/advisor/controller.ts` with portal esbuild, bundle/Node/ESM and an input-only source override. Its emitted bytes exactly match the retained historical bundle used by the two sensitivity tests. No current source was rewritten.

Final report validation resolves all10 local links, rejects an em dash and checks whitespace and the exact owned path. Index/commit inspection and clean worktree readback are performed at delivery. There is no source change after the tested application head.

`evidence-manifest.json` inventories every retained round-three diagnostic file except itself with byte counts and SHA-256; its SHA-256 is `4b44419d2ed513702c8cc0bfd5dd454a1f2e178d9b0645614903c6e1ef742714`. Selected immutable evidence digests:

| Artifact | SHA-256 |
| --- | --- |
| `canonical60.log` | `3801ca0f162bda80e64a511cc01cc7f1032c16c02545883ef9c19f2473c3c8db` |
| `independent.mjs` | `009a7fdbc936384dd76e98ebe4681e1ff7f4e3b2371162cc48adbab87d51604b` |
| `independent.log` | `81bdea2c0ca0a5d3ae878d40d5018cbba50fa36b0b2d25d52d0d2ef847dc00a2` |
| `browser.mjs` | `ba281a80e114435451e2cda0b7204f7a586728a3a11d166054c527803ed3ca6e` |
| `browser-initial.log` | `9a97009948cf0d4a4bac21d39aad3064f9d6574965eecdec8b36b420f67f2628` |
| `supplemental.mjs` | `d4358695399ef3ec22acaca069de59ac813e64c08da6aad3d10e6c33d9314984` |
| `supplemental.log` | `6c250f5b3b4bcbc4329e0c43d54475643f32bc2c0a37d6ee11c17ce4a919ad84` |
| `browser-positives.mjs` | `c74398322c83f94f782b49affab2b9ebfc12cc74f38844492b70006a9a07d77c` |
| `browser-positives.log` | `dd0ed90761d21d1348c2eeb29954af76195a3478c4aefb42b8d412d8c4bad40b` |
