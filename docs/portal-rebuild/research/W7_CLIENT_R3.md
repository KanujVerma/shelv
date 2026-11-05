# W7 independent client-plan review, round 3

30 October 2026. Review only, with no production fixes or nested agents.

**Specification verdict: CHANGES REQUIRED, bounded to recovery.** Original F1-F8, Q1 and Q2 are addressed in the reviewed UI paths, including both independently reproduced R2 F5 false-unlock cases. The explicit unpublished adapter passes its bounded contract. New **R3-1 / P2** leaves the enabled latest-plan retry inert while an obsolete read remains pending.

**Correctness/quality verdict: CHANGES REQUIRED.** Fresh focused tests pass **49/49**; adapted independent R2 probes pass **8/8**; additional independent residuals pass **9/10**, with the new recovery defect repeated in a separate browser process. Pure/SSR, strict types, forbidden-field type assertions, build and UI guard pass. No unsafe gate clearance, automatic write or false saved claim was observed. This is a local UI verdict, not connected portal or release acceptance.

## Reviewed identity and authority

- Workspace: `/Users/kanuj/.t3/worktrees/shelv/t3-e0bfefc2`, branch `t3/w7-client-round3-review`. Clean starting source/head: **`5fe41666747fe918eccee46c68f29d1968495562`**, the exact requested parent. The returned report commit is documentation only; it does not change the reviewed implementation.
- Original W3 range `ec231df2e10671428ef7d98bbe80b6efedc1aa60..b4f43f7084a4cd3330805e2cf9e7bd0f637dac06`, integrated as `4ad0038d99520b0bcd5bfa087b6aec2c00d7c95a`. Original review `85ab24d75048a1d3b183fd9c2bdedd154a414d55`, integrated as `c63bbffcad832cc383f9ea0ef67ed4aa0aca8d47`.
- First correction range `c63bbff..d341ed7`, integrated as `98f4a5a`, `c2415a3`, `42555e0`. R2 reviewed source `36af02e` and report `71c18a5` are integrated through `fb853a3`. R2's F5 residual and Q2 remain the explicit starting objections.
- Follow-up `aaa46fd6094fc243d28d33f73cacaff259f5cd83` is integrated as `dd0ade98bcb7a38a9b888657b5fb65f7cba6884c`. Preview/Q2 `753e392` is integrated as `79bf0a0837bd0597e4478bef23ad374367a9f75c`. `git diff --quiet 753e392 HEAD --` the feature, all four feature tests, helper/type assertions and response report exits 0. Shared read-only Back seam `07f63c9` is already in this parent; it was not authored by this reviewer.
- `git fetch origin` succeeded; `origin/main` resolves to `d39a7d4943209080df7c4cf97d85784f462758bf`. No rebase, reset or writes to another checkout.
- First live `orchestrator_capabilities({})` and `t3_thread_configuration({})` both returned **`codex / gpt-6.1-sol / reasoningEffort=xhigh / serviceTier=default`**, full-access, default interaction. Both returned the same configuration again before reporting, retained in `runtime.json`. This is tool configuration evidence. No nested agents.
- Read root/portal AGENTS; Resume, review/verification and repository task-first UX/design skills; Figma design-to-code guidance; the complete original review, W3_FIXES, W7_CLIENT_R2 and W3_CONFLICT_PREVIEW; D01-D48, full desktop specification, implementation contracts, PLAN_API_V1, acceptance matrix, workstreams and current status. Current status still describes older allocations; supplied instructions plus exact Git history govern this review.
- Inspected all plan feature source/CSS/types/exports, changed tests and helpers, adjacent root mapping/content validation/projection and shared navigation/session/overlay boundaries. Read the original R2 `independent.test.mjs` and diagnostic `followthrough.test.mjs` in retained `t3-91dd91e7`. Adapted their intended assertions to current recovery; old bug-presence expectations are not acceptance tests.

## Per-finding disposition

The complete [original review](W7_CLIENT_REVIEW.md), [first fix responses](W3_FIXES.md), [R2 review](W7_CLIENT_R2.md) and [conflict/preview response](W3_CONFLICT_PREVIEW.md) remain the review basis. This round preserves their findings, responses and unresolved objections rather than limiting review to the nine new conflict cases.

| Finding | Disposition | Fresh evidence and limit |
| --- | --- | --- |
| **F1 / P1** | **ADDRESSED** | Effective advice suppresses paused/excluded baseline guidance in routine, sheet and evidence. Fresh focused cases and the independent original mutation retain the actual other-product identity, exact restriction reason and prior Start date; both pause/leave-out depths reject obsolete continuation. Earlier Start is explicitly unconfirmed current use; absence says start not recorded. No stop/date is invented. |
| **F2 / P1** | **ADDRESSED** | Canonical decision direction/caution/schedule renders without an R2 guide. Focused cases and independent 320px sheet/evidence probe require direction, caution, condition, Tuesday/Friday, gradual stage, comfort condition and actual-Start anchor without activating the proposal. |
| **F3 / P2** | **ADDRESSED** | Optional rows use the shared direction/schedule/product-detail path. Focused tests require full optional directions, selected days, condition, stage/comfort rule and exact product depth, plus full sunscreen directions beside the short summary. Only exact duplicate strings are removed. Near-duplicate source wording remains conservatively retained. |
| **F4 / P1** | **ADDRESSED** | Focused cases reject late active reads after read-only/publication/mode changes. Independent probes also reject same-version active replacement, read-only then the exact original object, mode roundtrip and logout without stale application/success or memory overwrite. Deliberate exact retry confirms after the obsolete read settles. UI fencing is not server authorization proof; R3-1 separately concerns recovery before that settlement. |
| **F5 / P2, original and R2 residual** | **ADDRESSED for premature gate clearance; new recovery issue below** | Both old independent failures now yield version 1, applied reads 0, gate 1, decline disabled, writes 1. Unseen version 2 is never acknowledged. Focused and independent cases retain attempted choice across navigation/removal, failed/pending/unmounted reads, new publication, same-version decisionRevision changes, read-only/mode/view roundtrips, exact object return and captured owner-generation replacement. A successful current read supplies reviewable content; deliberate review rereads and only then clears the same version/revision basis. Another revision requires another review. Old uncertain commands retry every byte, never auto-convert to a fresh-version command; a subsequent deliberate choice uses a fresh UUID/current version/revision. **R3-1 obstructs an enabled recovery action while a superseded read remains pending.** |
| **F6 / P2** | **ADDRESSED** | Fresh model fidelity test compares all seven source decisions, product names/images/guides and routine directions to the public Maya source. Focused browser traversal retains all original cards and meaningful reasons, comparisons, actions/guides and real image decoding. Current-product optional Hydro Boost qualification and actual comparison identity remain visible without importing Hydro Boost how-to or azelaic studies as CeraVe directions. Nonproduct comparisons and productless/other-product guide paths remain covered. |
| **F7 / P2** | **ADDRESSED** | Actual source two-serum pause and all eight kinds pass focused browser tests. Purchase vocabulary/self-purchase depends on purchase-relevant kind plus primary product; keep/pause/leave-out/no-addition use guidance-only consequences. Decision commands do not order, charge or record Start. |
| **F8 / P2** | **ADDRESSED** | Original formerly failing keyboard journey and expanded evening/history path pass: selected-product use callback, evidence, Back, Escape, real `plan-product-cerave-pm` opener, 300px scroll, evening selection and multi-depth Forward/Back. Unpublished scoped sheet/evidence/Back/Escape also restores the real opener. No heading fallback accepted while that opener exists. |
| **Q1 / P3** | **ADDRESSED, bounded** | Fresh geometry and visual comparison confirm C03D main `(264,162,736)`, green context x1024/width376, product-specific body-font title; C02D main `(264,214,744)`. C01 `(264,196,744)` and sheet `(904,72,536,888)` remain correct. Full original names/guidance legitimately increase height. No pixel-identical or whole-portal design verdict. |
| **Q2 / P3** | **ADDRESSED** | Evidence reads the actual shared/enclosing `backDestination`. Independent actual recommendation path says back to recommendation and reaches that recommendation. Focused direct entry says back to product and opens the semantic product parent. Unknown enclosing destination says generic back; it no longer claims a product destination. Scoped unpublished navigation retains the advisor preview URL, evening selection and opener. |

## R3-1 / P2: an obsolete pending read silently blocks the current enabled recovery action

**Owner:** W3. **Requirements:** D10/D16, recoverable latest-plan review without false clearance or blocked lawful recovery. **Source:** `apps/portal/src/features/plan/DecisionControls.tsx:39-62`, especially lines 45, 49 and 58.

`PendingReview` correctly fences a read against an enclosing view epoch. A new view resets `loading` to false, so **retry latest plan** becomes enabled. The same replacement does not retire `busy.current`; the handler returns immediately until the old read reaches `finally`. Thus the displayed current recovery control performs no operation, gives no feedback and depends on an already superseded request settling.

Independent intended-behavior reproduction:

1. On the treatment recommendation, return 409 for approval and 503 for its automatic current-plan read. Navigate back to plan; the conflict and attempted choice remain.
2. Set the read port to hold a successful response pending. Click **retry latest plan** and wait until the read is actually captured.
3. Supply a newer active enclosing view, at the same publication/revision but with distinguishable current context. Wait for that content to render. The old read is now correctly obsolete.
4. Make subsequent reads available immediately and click the enabled **retry latest plan**. Reads remain **2**, expected **3**; applied reads remain **0**, writes **1**, and the review gate remains. No current read starts.

The extra residual suite fails this intended assertion, and a separate single-case repeat fails identically: `{"before":2,"after":2,"enabled":true}`. This is not an optimistic click before the context renders.

A separate diagnostic follows the same root cause through **read-only -> exact original active object**. Two enabled retry clicks leave `{reads:2,applied:0,writes:1}` unchanged. Only after releasing the obsolete response does current retry plus deliberate review recover to `{reads:4,applied:2,writes:1}`. The obsolete result itself is never applied. The diagnostic's passing observation is **not** passing acceptance.

**Smallest correction to evaluate:** associate pending/busy state with the captured operation/context generation. Retire or cancel superseded reads so the current recovery action can issue a fresh read; retain all existing late-result fences and deliberate-review requirements. An old operation's cleanup must not clear the busy state of a newer one. Add a durable regression requiring lawful current retry before the old promise settles, plus late-old-result denial and unchanged exact uncertain-command bytes. No production fix was authored by this review.

| Priority | Persona / goal | Exact observed issue | Consequence | Bounded correction / regression | Evidence |
| --- | --- | --- | --- | --- | --- |
| P2 | client recovering a rejected choice | enabled latest-plan retry returns at stale `busy.current` after context supersession | no progress or feedback until an obsolete request settles | generation-bound pending state; new current read allowed, old completion still denied | independent intended failure, separate repeat and read-only/object-return follow-through |

## Preview contract and provenance limit

The adapter accepts root `PlanPreview` plus `source:{draftId,contentRevision,assignmentRevision,target}`, a captured `PlanSessionBoundary` and enclosing `PlanNavigationPort`. It constructs only `{kind:'unpublished',content}` and uses the same `PlanRenderer`, routine, recommendation, product, evidence, guidance and shared controls as published views. No publication version/time, entitlement, actual-use list, decision revision or review date is fabricated.

Finite root mapping rejects unsupported private fields, markup and unsafe URLs. Separate identity checks reject duplicate/dangling references and bind every assigned target field, including hash and both revisions, to source metadata. Issue paths are not rendered. Props for live/demo ports or business callbacks are ignored by runtime destructuring and excluded by the public TypeScript interface.

Fresh pure/SSR and browser tests cover assigned/null targets, every target identity field, content/assignment/source mismatch, invalid metadata, extra private data, markup, unsafe URLs, duplicates/dangling product/fact/goal/guide references, rejected-input recovery and 320/390px complete guidance. Preview clearly says not published and clocks not started by this preview, with unavailable actual-use/choice/service/review/notification dates. This does not claim an existing client's prior service clock never started. Malicious runtime ports/callbacks/kind/mode props cannot enable approve/decline/self-buy/use/update/history/export actions. Captured-session invalidation removes content and an open sheet; later input remains denied. Independent ledger sentinels remain byte-identical, with zero read/write/business callbacks. Enclosing-port Back/Escape and recommendation/product routes retain the outer advisor URL and selected routine. These are actual adapter/shared-renderer tests, not completed W2/app/gateway composition.

**Null-target limitation:** the actual root response contains no echoed draft/revision when `target:null`. A valid null response cannot independently establish which unassigned request produced the content. An independent pure probe confirms that the same content can pass with different valid source draft/revision metadata when both targets remain null. This is a documented API limitation, not stronger provenance evidence. W2/coordinator must bind the exact issued request, captured session and unchanged current draft before mounting. The adjacent W2 controller checks those through its read fence, `sameDraft`, dirty state and exact/null target check; final app composition remains separately unaccepted.

## Fresh verification receipt

All Node/npm invocations use `PATH=/Users/kanuj/.nvm/versions/node/v22.23.0/bin:$PATH`; fresh `node --version` is **v22.23.0**. Diagnostics live only in ignored `.local-artifacts/portal-rebuild/w7-client-r3/`.

Source/pure/SSR/type work alone ran before the parent's explicit Chrome handoff. After W2 reported every browser/context/preview closed, the parent granted this reviewer sole serial Chrome allocation. `preview_status` was called first and returned `available:false,tabId:null`. The explicitly authorized repository esbuild/Playwright-core installed-Chrome workflow then ran with concurrency 1, one browser at a time, blocked service workers/background networking, `.invalid` application routing and finite exact public-sample assets served from local bytes. Every unexpected request is aborted and asserted absent. No external browser request, live API or credential was permitted. Passing teardown checks assert empty page/console error and unexpected-network arrays, including the failing recovery assertion's teardown.

All browser test handles are now terminal and after hooks closed their browsers/contexts. Process readback found no matching headless/remote-debugging Chrome or reviewer Node test; final `preview_status` again returned no tab. No collaborative preview tab was opened. Chrome allocation was explicitly released to the parent before report completion; no further browser/DOM work followed.

| Check | Fresh result and scope |
| --- | --- |
| Portal `npm ci --ignore-scripts` | Exit 0, 130 packages, lockfile unchanged. Existing audit summary: two moderate and one high advisory; no upgrade or advisory assessment. |
| Root `node --experimental-strip-types --test --test-concurrency=1 apps/portal/tests/rebuild-plan*.test.mjs` | **49/49 pass**, 0 fail/skip, 31.332s; `focused.log`. All original and new feature groups. |
| Same serial Node test command on `.../w7-client-r3/independent.test.mjs` | **8/8 pass**, 0 skip, 5.646s; `independent.log`. Adapted R2 intended gate assertions plus F1/F2/F4/Q2. |
| Same command on `.../w7-client-r3/residuals.test.mjs` | **9 pass / 1 fail**, 0 skip, 7.111s; `residuals.log`. Intended current-retry failure is R3-1; remaining lawful recovery, removed decision, revision, owner and preview cases pass. |
| Same command with `--test-name-pattern='pending superseded'` on that residual script | **0 pass / 1 fail**, 0 skip, 2.372s; `busy-repeat.log`. Separate browser process repeats R3-1. |
| Same command on `.../w7-client-r3/busy-followthrough.test.mjs` | **1/1 diagnostic observation**, 2.720s; `busy-followthrough.log`. Confirms the stale busy lifecycle and eventual recovery, not acceptance. |
| Independent bundled pure/SSR `node --test --test-concurrency=1 .../pure.test.cjs` | **6/6 pass**, zero skips. Assigned/null identity, malformed/private/HTML/URL/reference rejection, actual shared SSR with malicious extra props, hidden issue paths and review-basis predicates. |
| `apps/portal/tests/rebuild-plan-model.test.mjs` | **6/6 pass**, zero skips; source fidelity and Start/advice separation. These six overlap the later focused suite and are not additive. |
| Portal `npm run typecheck:rebuild` | Exit 0, unchanged normal strict configuration. |
| Pinned portal `tsc -p .../tsconfig.boundary.json` | Exit 0; checked-in plus independent forbidden-field assertions active, normal strict flags and existing CSS/type declarations. |
| Portal `npm run build:rebuild` | Exit 0; isolated foundation preview, not final application composition. |
| Portal `npm run check:ui` | Exit 0, 11 retained stylesheets. |
| Native context/PNG hashes | **12/12** match `design/ACQUISITION.json`. |
| Final live capabilities/configuration | Both again return `codex/gpt-6.1-sol/xhigh/default`; `runtime.json`. |
| `git diff --check`; report-only scope/link/sensitive-pattern inspection | Pass before commit. No production, dependency/lock, shared contract, status/context or fixture changes. |

Initial diagnostic setup errors are retained and excluded from product findings: the first SSR bundle needed the installed portal node-resolution path; one pure fixture mutation incorrectly assumed a nonempty goals array; the first temporary type config omitted the existing CSS declaration. Corrected harness/config checks above pass without production edits or weakened compiler settings.

For reproduction, replace `.../w7-client-r3/` in the table with `.local-artifacts/portal-rebuild/w7-client-r3/`, from this repository root. Independent browser scripts import only this checkout's installed portal dependencies and source. The residual helper adds a captured session-generation rotation only to the existing synthetic browser entry at bundle time; production feature source is unchanged. All other faults use synthetic DTO/operation/session/navigation ports. The pure SSR bundle uses actual production modules with CSS omitted only for server rendering; it never constructs a DOM/browser. Temporary type configuration extends the unchanged strict frontend config and includes the existing portal CSS declarations/type roots.

| Artifact under `w7-client-r3/` | SHA-256 |
| --- | --- |
| `focused.log` | `45b6f4f1e6a9d4954442febdb2e8d7a18464b74bbc751f69d4284c62f62faaf8` |
| `independent.test.mjs` | `67a5a21264b39d345afa4c271f8f90b04f5435f7c2d70be2d218b61daa4d85c6` |
| `independent.log` | `3d56d57f330e58bfe9face4faf1ebff676aab972fbe12f4997be7f08d5747034` |
| `residuals.test.mjs` | `6917926c5a6c910d2c1940be55da5fa0cb06739e21b4d7752f62558149f7d191` |
| `residuals.log` | `053d463b230b2169b2caa207d64a2d0505649997127fdd5214b1878148063e92` |
| `busy-repeat.log` | `5761070ac126cc4ccec475f8e3e0953d635c913b29bc5def402c2f960ec9b449` |
| `busy-followthrough.test.mjs` | `c1e77fc8f536083a77e100d9431aa6862db33cfa9a4bed3eb392b2b547d1ac92` |
| `busy-followthrough.log` | `7db0e4ea53ddb5702a4ffb3ec07ed582027d14f51cb8188c4e24ca338e5e0a5a` |
| `pure.log` | `645d627bf9bf5ce62e3e98246108fe1da10305b6d4137cb171b6e3d2165a23d1` |
| `runtime.json` | `9b845c16e1438726994642542faf07069ec449a3043eb993e17e474a12f8a88b` |

## Visual and task evidence

Read retained native C01 `498:85`, C01E `503:926`, C02 `498:212`, C02D `499:766`, C03 `499:151`, C03D `503:1083` contexts and visually inspected all six PNGs. Repeated identical context lines were deduplicated only in an ignored reading aid; all original bytes remain intact. No fresh Figma acquisition/version claim.

Visually compared all six fresh published screenshots under sibling `.local-artifacts/portal-rebuild/w3/`: `C01-1440.png`, `C01E-1440.png`, `C02-1440.png`, `C03-1440.png`, `cerave-pm-evidence-1440.png`, `ordinary-azelaic-10-evidence-1440.png`. Also inspected actual unpublished CeraVe evidence at1440, complete azelaic evidence at320, and independent `probes/inert-current-retry.png`. Shared native origins/columns/sheet remain intact. Complete original identities/all seven cards/full guidance make pages taller; necessary unpublished status shifts preview content down. The unscheduled published follow-up and unavailable preview dates remain truthful. No fake native staged date or fabricated Start is introduced to fit a screenshot.

Task-first review: a client can follow source-derived morning/evening advice, inspect the exact selected product, distinguish prior reported use from current guidance, choose without payment/Start, and return through real keyboard/history paths. Preview identifies draft lifecycle and withholds unavailable live actions while preserving guidance. R3-1 breaks feedback/progress for the current recovery control; its priority, smallest correction and regression are explicit above. This is an automated/source cognitive walkthrough, not measured human comprehension. No new visual/copy system or business rule is proposed.

## Separate unfinished acceptance

The author's **468 portal** and retained/session/root/package results were not rerun. The **49 feature** results above are fresh independent evidence. The new recovery defect was isolated/repeated with targeted probes; it did not justify rerunning unrelated portal suites. Parent separately reports canonical55 reset/33 pgTAP/746 assertions and backend R3 scoped acceptance at `64d1c63`; these are parent/backend evidence, not this review's client acceptance. Genuine Auth/Edge remains pending.

Full application/root/native suites and Expo export, genuine Auth/PostgREST/persistence/permissions, production source/asset delivery, connected use reports, unknown Start dates, stop/pause/different-use events, latest published-review projection, final routing and all five Maya stages with Exit/Explore/Replay/Reset remain separate coordinator acceptance. Callbacks are seams, not completed reports, orders, exports or sent messages. Backend findings and other workstreams retain their own dispositions.

No Docker, PostgreSQL, Auth, credentials, hosted resources, real clients/sources, financial/retailer actions, communications, push, PR, merge or deployment. No full accessibility, zoom/reduced-motion, representative-human comprehension, legal, clinical, security or release acceptance is claimed. Coordinator owns canonical status/context integration; this reviewer commits only this report.

**Unresolved objection:** fix and independently review R3-1 with the original report/findings/responses and this full round preserved. Do not reopen the corrected false-unlock path, weaken the basis checks or treat an obsolete result as current to release busy state. The separately unfinished acceptance lanes remain open regardless of this bounded UI correction.
