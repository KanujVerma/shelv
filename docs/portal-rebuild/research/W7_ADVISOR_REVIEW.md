# W7 independent W2 advisor source/controller review

30 October 2026. Independent reviewer, no implementation authorship or nested agents. This pass is limited to source, pure controller execution and server-rendered markup. Browser, visual, keyboard and connected acceptance are pending.

## Scoped verdicts

- **Specification compliance: FAIL pending F1-F3.** The first publication slice has the intended structured model, exact commands, acknowledgement-based saving and explicit publication gates. Reproduced overlapping-read defects can restore obsolete publication eligibility and lose a newer uncertain request's retry identity. View-only readers cannot expand retained guidance.
- **Code quality/correctness: FAIL pending F1-F3.** The existing **17/17 pure controller cases pass**. A new independent 12-case controller harness has **9 pass / 3 fail / 0 skip**: two failures demonstrate F1 and one demonstrates F2. Actual-component SSR separately confirms F3's disabled/hidden markup in three sections. These results do not establish server authorization, browser behavior or full portal acceptance.
- All three findings are **P2, important correctness/specification issues**. No critical finding or demonstrated server publication/payment bypass is claimed. Resolve these bounded defects and independently re-review before accepting this source/controller slice.

## Reviewed identity and evidence

| Item | Live verified value |
| --- | --- |
| Review workspace | `/Users/kanuj/.t3/worktrees/shelv/t3-a6bd86ec` |
| Branch | `t3/review-advisor-publication-slice` |
| Reviewed source HEAD / review base | `134ca45ce6540da992bc774f82f76d53ea1f8744` |
| Original W2 range | `930dab999326796b880af67af26dafa270ae4aab..a432b1acabd94b993a4c3b0ff298758f4ef6bcd8` |
| Integrated W2 commits | `732fa0eb96b1c9dfeb208d0b1457f88686971197`, `a66e803914dfcdbdb71a9d1d7e744caddbf807a1`, `23c2b599b81629322831960f702074a39c014495`, `f7be7e8449323de9da84f1588e8fca4c00909be6` |
| Freshness | Initial checkout clean; `git fetch origin` succeeded; `origin/main=d39a7d4943209080df7c4cf97d85784f462758bf`; `HEAD...origin/main=49 0` |
| Live runtime checks | Fresh `orchestrator_capabilities({})` and `t3_thread_configuration({})` independently returned instance `codex`, model `gpt-6.1-sol`, `reasoningEffort=xhigh`, `serviceTier=default`, full-access/default modes |
| Review task identity | `portal-rebuild-w7-advisor-review-20261030-r1`, final component of the live delegated-thread identifier |
| Node | Explicit `/Users/kanuj/.nvm/versions/node/v22.23.0/bin` first in PATH; `v22.23.0` |

`git diff a432b1a HEAD --` all seven advisor feature files, both advisor test files and both advisor helpers is empty. Thus the reviewed advisor implementation is byte-identical to the original delivery, running with the parent's later foundation, navigation and shared contracts. The original range changes only those 11 feature/test/helper paths and the W2 report, 12 paths total. This review adds only this document as a tracked change; its containing commit is returned in the handoff.

The actual parent head includes `fac95d1` strict shared indexing corrections, corrected W0, `af121d6` shared semantic route grammar, `07f63c9` read-only Back destination and **`134ca45` advisor read gateway allowlisting**. The last commit is newer than the brief's listed context. It adds the two fixed advisor read actions as `view` operations, outside the client allowlist; it does not integrate their SQL or create a W2 context adapter.

W1 advisor read implementation `69c55b2cdc7444a26e80c74581f99f961610c8ea` and delivery `428616ee6897ce052edf3583a3cd5abd13ba64c3` remain in `/Users/kanuj/.t3/worktrees/shelv/t3-97b66568`. Read their actual source/report for contract context only. No SQL was cherry-picked, no other checkout was edited, and no database was inspected. W1's reported native/read checks are author evidence, not this review's independent acceptance.

## Review coverage and prior open issues

Read the applicable root and portal AGENTS, rebuild entry point, D01-D48, desktop specification, implementation contracts, [PLAN_API_V1](../PLAN_API_V1.md), [ADVISOR_READ_API_V1](../ADVISOR_READ_API_V1.md), acceptance matrix, workstreams, current status/task ledger and [W2 report](W2_VERTICAL_ADVISOR.md). Reviewed the original [backend review](W7_BACKEND_REVIEW.md), [W1 responses](W1_FIXES.md), [backend round 2](W7_BACKEND_R2.md), original [client review](W7_CLIENT_REVIEW.md) and [W3 responses](W3_FIXES.md) to keep ownership and acceptance separate.

Inspected all advisor code/types/model/controller/fields/CSS, the 17 pure plus 11 browser author cases and both helpers. Inspected the relevant shared UI controls, overlay lifecycle, shell, navigation grammar/history, captured-session transport, root plan types/parser/mapper/handler, actual plan command SQL branches, and retained directory/payment contracts. Applied the requested Resume, requesting-code-review and verification workflows as the already-dispatched reviewer, plus repository UX/design guidance, relevant Figma baseline guidance and the Supabase contract/security guidance. No nested reviewer was created.

The earlier seven backend findings have a separate round-2 disposition. That review still leaves **R2-1** private receipt returns after session/task expiry during a source wait and **R2-2** check-in writes after session expiry/support cancellation during a client wait. This pass neither reproduces nor closes those database defects. The later read extension also needs its own independent review after the migration-54 fix is composed. W3 conflict/preview correction and connected rendering work remain disjoint; its browser allocation was not used or awaited here.

## F1 / P2: an older gate read restores eligibility after a newer restrictive read

**Paths:** [controller.ts](../../../apps/portal/src/features/advisor/controller.ts), lines 310-356; `invoke`, lines 143-159; `canPublish`, lines 127-141. The refresh control at [AdvisorWorkspace.tsx](../../../apps/portal/src/features/advisor/AdvisorWorkspace.tsx), lines 920-925, permits overlapping refreshes because these reads do not set `busy`. **Requirements:** D16, D22, D25, D38; current authority and late-view fences.

`refreshContext()` checks the session/draft epoch and exact target, but has no read-generation/order check. Two requests for the same target therefore remain equally applicable. A late older success can overwrite the newer context even after the newer response cleared approval or coverage.

Independent `reproduce.mjs` cases **F1a/F1b**, using the actual controller and existing synthetic ports:

1. Open a reviewed draft, obtain its exact approval, confirm its synthetic service claim, and verify `canPublish() === true`.
2. Start gate refresh A. Capture the actual port response, including the valid approval, then delay delivery only.
3. Update the synthetic authoritative port to return `approval:null`; run refresh B to completion. Publication is correctly blocked.
4. Release A. Observed **`approvalRestored:true, canPublish:true`**. The intended safety assertion fails `true !== false`.
5. Repeat for a later publication: A captures `coverage:'active'`, B returns `coverage:'inactive'`, then A arrives. Observed **`coverage:'active', canPublish:true`** again.

The controller can thus re-enable a deliberate publish action based on superseded authority. This is stale UI eligibility, **not proof that the server accepts a revoked approval or cancelled coverage**. The actual server must still enforce its current transactional checks. A late response that fails source/hash/policy validation should likewise not replace a newer context; those variants need regressions rather than a claim of separate reproduced backend defects.

Give gate reads a monotonic generation or equivalent cancellation/application token, bound to the current target and view lifecycle. Apply success and error only while that read remains current. Preserve a newer restriction, including null approval/inactive coverage. Test reverse completion order, failed refreshes, policy/source invalidation and owner/session replacement without granting permissions through a display name or remembered receipt.

## F2 / P2: a stale status response clears a later pending write and loses its retry

**Paths:** [controller.ts](../../../apps/portal/src/features/advisor/controller.ts), lines 777-814 (`reconcile`/`retry`), 213-290 (`accept`) and 161-194 (`fail`). Both recovery buttons are available together in [AdvisorWorkspace.tsx](../../../apps/portal/src/features/advisor/AdvisorWorkspace.tsx), lines 165-175. **Requirements:** D16; exact request retries, uncertain acknowledgement and recoverable manual work.

`reconcile()` captures pending command A but does not occupy `busy` or check that A remains the pending request when its read returns. `retry()` can resolve A while that status lookup is outstanding. After the user begins command B, the old lookup still calls `accept(A, receiptA)`, which replaces state and unconditionally clears `pending`/`busy`.

Independent **F2** reproduction:

1. Save A through the actual fixture reducer, which stores its committed result. Add an unsupported field only to the delivered acknowledgement; the real strict mapper rejects it and the controller retains A as uncertain.
2. Start `reconcile()` for A; capture and delay its committed status response.
3. Retry A exactly. Its valid receipt resolves the pending state. Edit a new manual summary and start save B.
4. The actual reducer commits B, but hold B's acknowledgement. Release A's old status response. Observed **`pending:null, busy:false`** while B remains outstanding.
5. End B with a simulated lost acknowledgement, HTTP 503. Observed **`save:'uncertain', pending:null`**. Calling `retry()` sends nothing: B has **one attempt**, and its original request UUID is no longer recoverable from controller memory. The manual summary remains intact.

The fault is loss of operation/recovery state, not demonstrated loss of the manual text or duplicate persisted publication. A normal network delay plus both exposed recovery controls is sufficient to reach it; no feature function is replaced by a success stub.

Fence each reconciliation/result/error against its captured request and current pending-operation generation. Alternatively serialize status/retry and invalidate old status reads when the operation resolves. Never let an older receipt clear a newer pending command. Add a delayed status -> exact retry -> newer write -> lost acknowledgement regression, and require the exact B command to survive and retry unchanged.

## F3 / P2: view-only readers cannot expand retained instructions and evidence

**Paths:** [AdvisorWorkspace.tsx](../../../apps/portal/src/features/advisor/AdvisorWorkspace.tsx), lines 537-557; [fields.tsx](../../../apps/portal/src/features/advisor/fields.tsx), lines 29-51, 852-864, 899-956, 1032-1040, 1251-1299 and 1440-1447. **Requirements:** D04, D15, D20; usable view-only reading distinct from editing and source authorization.

The whole content area is wrapped in `<fieldset disabled>` when `permissions.edit` is false or the draft is no longer working. The same fieldset contains ordinary Button disclosure triggers. Each disclosure initially has `aria-expanded="false"` with its content in a `hidden` div. These triggers are disabled by their fieldset ancestor along with the mutation controls, so a reader cannot open product directions/evidence, decision explanations/guides, complete routine guides or retained source-location disclosures that the server already authorized them to read.

Independent `ssr.tsx` bundles and server-renders the **actual** `AdvisorWorkspace`, real controller, shared controls and OverlayProvider with the existing public Maya source. It changes no feature implementation. For `client-context`, `decisions` and `routine`, the resulting HTML confirms:

```text
disabledAncestor:true, collapsedAndHidden:true
```

Each observation checks the real native button inside `<fieldset disabled="">` and its initially hidden content. This is structural SSR/source evidence plus native disabled-fieldset semantics, **not a browser click/keyboard/visual test**. The controller's stable view-only mutation denials pass separately; the remedy must preserve them.

Keep disclosure/read navigation operable and disable only editing/mutation controls, or render an equivalent readable view with expandable guidance. Do not grant edit/source permission to solve it. Add view-only and published-draft browser cases requiring all authorized guidance to open by keyboard while mutations remain unavailable.

## Positive evidence and its limits

| Area | Independent source/controller evidence |
| --- | --- |
| Structured authoring | One root `PlanContent`, repeated stable product/goal/decision/step IDs, eight decision kinds, none/unknown and authored schedules. No per-client page/code generation. Added storage probe preserves all eight synthetic kinds, two same-category distinct product IDs and the rich public-source product/decision/routine-guide data through an unrelated title save. It does not establish publish readiness for every synthetic combination. |
| Saving/imports | Existing cases preserve incomplete/manual work, reject unsupported fields, retain exact 503 retry IDs, block stale apply and require a new diff after rebasing. New overlength input probe retains all 201 title characters, reports error and sends no save. Denied save preserves manual content. Pending save can retain newer edits after the older acknowledgement. F2 limits overlapping recovery. |
| Identity/assignment | Root mapper binds draft reads to requested ID; controller also checks internal target consistency. New wrong-ID probe cannot open a draft. Assignment uses an existing active directory identity and exact expected revisions; the feature calls no Auth/admission operation. The memory fixture alone cannot prove actual absence of Auth side effects or transactional uniqueness. |
| Review/approval/payment | Exact section hashes and target-bound human approval commands are present. Actor comes from supplied authenticated capabilities, not founder names. Existing payment-independence case passes. Unknown first/later or coverage state blocks publication; later active coverage sends `firstServiceClaimId:null`. Retained v1/v2 payment mappers preserve actual quote/claim/option semantics. No finance/root backend change is proposed. |
| Session/draft races | Existing invalidation aborts/clears private memory and rejects late saves. Added probes discard a context or import response after switching drafts; refuse a draft switch during pending save, approve, publish and payment; and discard a preview callback after owner/session invalidation. Same-target overlapping reads remain F1/F2. |
| Preview/notification truth | Actual mapped `PlanPreview` remains `mode:'advisor-preview', published:false`, with safe content and no invented version/date/entitlement. The callback is the composition seam, not a second renderer. Receipt view uses the committed receipt/event and says delivery is unconfirmed; it does not call an email provider or republish a failed notification. |
| Plain content and capabilities | No feature `eval`, executable Function, raw HTML injection, direct fetch, localStorage/sessionStorage or CSS lowercasing was found. Source text is plain content; lowercase conversion is confined to search matching. Stable view-only controller denies edit/save/assign/review/approve/publish/payment commands and permits authorized preview. F3 limits actual read affordances. |

The checked-in fixture has synthetic permissions, hashes, readiness and in-memory command responses. It does not enforce the actual SQL CAS, request fingerprints, source ACLs, approval consumption or payment transaction. Passing controller tests are not independent acceptance of those server invariants. The real authoritative context/capability adapter remains absent at this head.

## Native baseline and UX source comparison

Read the retained native contexts and inspected PNGs for A00 `503:449`, A01 `500:299`, A02 `500:383`, A03 `500:500`, A04 `500:592`, A04P `503:672`, A05 `500:686` and A06 `500:779`. Their **16 context/PNG records** match acquisition byte counts and SHA-256 values. These are approved fictional design references, not fresh Figma retrieval or new rendered screenshots.

Source uses the shared control layer/Lucide, semantic colors, free section navigation, 168px checklist/336px context layout and 736/376 publication proportions. This supports implementation lineage only. No actual rendered geometry, desktop/mobile comparison, focus, Back/Forward, keyboard, zoom, reduced-motion or human-comprehension pass is claimed. SSR markup does not substitute for them.

| Priority | Advisor goal / observed issue | Why it matters | Smallest correction | Regression / evidence level |
| --- | --- | --- | --- | --- |
| P2 F1 | Know whether the current exact revision may publish; an older refresh restores revoked approval/coverage | A newer explicit blocker disappears | Fence gate reads by generation and exact target | Reverse-order restrictive reads; actual controller failure |
| P2 F2 | Recover an uncertain write; old status clears a newer request | Exact retry disappears while the result is unknown | Bind recovery to captured pending request/generation | Delayed status plus retry/new save/503; actual controller failure |
| P2 F3 | Read complete authorized guidance without edit permission | Hidden instructions/evidence cannot be expanded | Enable read disclosures, disable mutations separately | View-only/published keyboard opening; SSR/source confirmed, browser pending |

Copy distinctions such as **unpublished**, **not confirmed; publication is blocked**, **payment verification alone does not publish**, and **delivery has not been confirmed** serve real state/consequence/recovery purposes. No copy-only or speculative visual findings are added. Missing template/upload/delivery screens are explicit future scope, not disguised successes or additional defects in this bounded slice.

## Executed verification and retained reproductions

All Node/npm commands used the explicit Node 22 PATH above. Portal dependency setup was existing-lockfile `npm ci --ignore-scripts --no-audit --no-fund`: 130 packages, no tracked manifest/lock/config change.

| Command / check | Actual result |
| --- | --- |
| Portal `node --experimental-strip-types --test --test-concurrency=1 tests/rebuild-advisor-controller.test.mjs` | **17 passed**, zero failures/skips. These are pure cases, not the author's 28 combined pure/browser cases. |
| Root `node --experimental-strip-types --test --test-concurrency=1 .local-artifacts/portal-rebuild/w7-advisor/reproduce.mjs` | **Exit 1: 9 pass / 3 fail / 0 skip**, 12 cases. F1a/F1b/F2 are intended-behavior assertions that fail on the reviewed implementation. |
| Bundle actual-component `ssr.tsx` with portal esbuild, Node platform/CJS, normal frontend tsconfig, portal node_modules in `nodePaths`, CSS empty loader; run `node .local-artifacts/portal-rebuild/w7-advisor/ssr.cjs` | Exit 0; three structural F3 observations. No browser/DOM interaction. |
| Portal `npm run typecheck:rebuild` | Exit 0; no errors under unchanged strict/noUncheckedIndexedAccess flags. The W2 report's old five shared diagnostics are no longer current. |
| Portal `npm run build:rebuild` | Exit 0; semantic color guard and isolated foundation preview build. Does not compose final advisor app or prove connected behavior. SSR separately bundles the actual advisor components. |
| Portal `npm run check:ui` | Exit 0; 11 retained stylesheets. New CSS is additionally scanned by the rebuild build. |
| Original/integrated advisor path comparison; selected acquisition hashes | Advisor source/test/helper diff empty; 16 selected records valid. |
| Final report link/scope check and `git diff --check` | Pass; 14 local links resolve, no em dash, only this report staged, cached whitespace check clean. |

Evidence directory: `/Users/kanuj/.t3/worktrees/shelv/t3-a6bd86ec/.local-artifacts/portal-rebuild/w7-advisor/`. `reproduce.mjs` imports actual production controller/model/root parsers plus the unchanged checked-in synthetic ports. Its only transport faults are captured/delayed responses, malformed acknowledgement and 503. It neither replaces feature behavior nor simulates successful SQL. `ssr.tsx` renders actual components and writes three local synthetic HTML files.

| Retained artifact | SHA-256 |
| --- | --- |
| `reproduce.mjs` | `cfa1454a192c3e4d34532b2e9f9ffc01b265b9be92750377237f1a3dee6531bc` |
| `reproduce-final.log` | `3d5f0f2b9413fa2aa102df38a2067b068eae3f4f94ae76b96672fe98ba13f61d` |
| `ssr.tsx` | `c41386b8dba4ce2573b32e9cf1897afac49fef19803159b7eed6d86166ee7208` |
| `ssr.log` | `b997b123110b5fd08334c00cd2fdcd0415ac01610c40f814241a632d0ff6be1e` |

An initial supplemental data-preservation probe used the wrong fixture export; corrected to its actual `mayaPlan()` export before the final 12-case run. The initial SSR bundle lacked root-level React JSX resolution; explicitly adding the existing portal node_modules path fixed the harness. Neither setup error is a product finding. Original logs remain retained. Node emits the existing root typeless-package warning; no package configuration was changed.

## Pending checks and composition boundaries

No Chrome/browser stack was launched, opened, inspected or awaited. The exclusive browser allocation belongs to W3 conflict/preview work. The 11 browser author cases were read, not rerun. Actual rendered/visual/keyboard/navigation validation remains **pending**, including wrong-client route switches, import/payment form state across navigation, publication confirmations, view-only disclosure behavior, 1440/laptop/320/390 layouts, screen-reader semantics, focus/scroll return, zoom and reduced motion.

The coordinator still must connect real authenticated directory/payment ports, current gate-derived capabilities/approval, canonical advisor publication reads, the shared unpublished preview adapter and final application routes. Preserve the distinction between view, editing, publication and raw-source rights. Do not recover authority from founder names, old receipts or mutable draft reconstruction. Template lifecycle, raw upload/retention/deletion, full service permissions, complete delivery/inbox/retry and remaining portal modules remain explicit missing composition. A06 failed-email/retry acceptance cannot be inferred from the queued-event receipt.

Not run or accepted here: W1's new read/native tests, canonical DB reset/pgTAP/RLS, actual Auth/PostgREST/Edge/cookie journeys, root application/test types/full suite, Expo web/iOS exports, full portal/session suites, exact-head CI, hosted/deployed behavior or human comprehension. Those are separate coordinator/reviewer lanes. No Docker, PostgreSQL/Auth lifecycle, other-worker database, credentials, hosted resources, real clients, messages, money or orders were accessed. No production fix, push, PR, merge or deployment occurred.

Return the report-only commit from a clean tracked checkout. Coordinator owns integrating this report and updating shared status/CONTEXT_SYNC; this task does not edit their write-set.
