# W4 client reports and history

Owner: Kanuj. 31 October 2026. **Source implementation and pure/actual SSR verification only. Browser verification, enclosing application composition, backend activation and independent acceptance are pending.** This is the bounded C04/C05 client module, not full rebuild acceptance. No nested delegation.

## Verified identity and scope

- T3-owned workspace `/Users/kanuj/.t3/worktrees/shelv/t3-0706fba8`, branch `t3/check-ins-history-updates`. Actual clean base **`f1e9e9113cd75012c27fa97432b63d488b4b0c89`**. Already attached to its separate worktree at entry; no second checkout, reset or foreign-worktree write. Read-only remote inspection confirms main `d39a7d4943209080df7c4cf97d85784f462758bf`.
- Coordinator **`d632030a-18f7-4dec-a2c9-f5c0418c3fd5`**, project `ac0af19d-d404-4f53-a870-02bfd76c2a80`.
- Actual task handle, supplied from the coordinator's original receipt: `node:delegated-task:command%3Amcp%3A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%3Adelegate-task%3Aportal-rebuild-w4-report-history-ui-20261031-r1`.
- Actual child thread: `thread:delegated-task:command%3Amcp%3A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%3Adelegate-task%3Aportal-rebuild-w4-report-history-ui-20261031-r1`.
- Actual child run: `run:thread:thread%3Adelegated-task%3Acommand%253Amcp%253A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%253Adelegate-task%253Aportal-rebuild-w4-report-history-ui-20261031-r1:ordinal:1`.
- Both live `orchestrator_capabilities({search:'gpt-6.1-sol'})` and `t3_thread_configuration({})`, before implementation and at final source verification, establish **codex / gpt-6.1-sol / reasoningEffort=xhigh / serviceTier=default**. Supported descriptors include xhigh and default. All eight actual `.codex/agents/*.toml` files and project model/subagent defaults match Sol/xhigh. No substitution or configuration edit. Capabilities' `parentThreadId` repeats this child in this harness; actual parent comes from thread readback.
- Every Node/npm/compiler command selects **`PATH=/Users/kanuj/.nvm/versions/node/v22.23.0/bin:$PATH`**, verified **v22.23.0**. Portal-only `npm ci --offline --ignore-scripts --no-audit --no-fund` installed130 locked packages. Root dependencies remain absent; no root install, package/lock/configuration or compiler-flag change.

Early OWNED seam **`dacdcfb8a2a53bb438be5b277e763e9783e0de49`** was returned before the rest of the UI/controller. The source implementation checkpoint is the commit adding this report, resolved with `git log -1 --format=%H -- docs/portal-rebuild/research/W4_REPORT_HISTORY_UI.md`; its exact SHA is returned separately. Do not infer the final head from that command after later report updates.

## Separately attributed target imports

No W1 implementation, handler, migration or report was imported. Only these four exact files were authorized, in this checkout, with no authored byte changes:

| File | Blob at final authorized W1 source `96db032faf282d61f6a890eb38923dfd48893e39` |
| --- | --- |
| `src/contracts/PortalReview.ts` | `028e6bf3bb293e68a60e472b3b6ee87f522ee3c3` |
| `src/contracts/PortalReviewValues.ts` | `c1e2191cfd0c0b015c31c6e1e4d8066d199d8dd9` |
| `src/contracts/PortalReviewValidation.ts` | `997afba2c0b1dd3daf129913d3c2b28d27ed5f71` |
| `src/contracts/PortalReviewMapping.ts` | `917b81da881ae8e091c2414ff4864fa936367bbd` |

Initial exact30f40da import: **`9bc3fefa`**. First actual unchanged strict frontend compile produced six W1 metadata-presence diagnostics in Values18, Validation28 and Mapping49, promptly returned to the coordinator. No flags or imported bytes were weakened. Authorized exact96db correction: **`3b716562`**, separate from owned work. It uses authoritative presence narrowing and the separately pinned private source manifest. That private draft basis is outside this client UI. Strict frontend then passes with zero diagnostics. This is a compile-time target seam, not backend activation.

The coordinator subsequently authorized a separate six-file retained Review transport import **88d4e588**, to occur **after this coherent owned checkpoint**. It is not part of the evidence or source claims in this initial checkpoint. See a later appended receipt if imported.

## Requirements and design sources

Read root/portal AGENTS, rebuild entry point, the complete95,388-byte `source/APPROVED_INPUT.txt` in bounded contiguous chunks including appendices A/B/C, contracts, plan, workstreams/status, CARE_API_V1 and applicable acceptance rows. The standalone complete decisions, desktop spec and full manifest occur verbatim in the read original; all five original imported byte counts/SHA-256 match INPUT_PROVENANCE. Read the full W1 report at30f40da using `git show`, without importing it. Read relevant full W3_CONFLICT_PREVIEW, W3_RECOVERY_FIX, W7_CLIENT_R4, W3_CARE_USE, W3_CARE_ATTRIBUTION_FIX, W7_CARE_CLIENT_REVIEW/R2/R3 and W7_CARE_APP_COMPOSITION_R2, preserving their qualified scope and previous recovery/attribution lessons.

Figma design-to-code guidance preceded fresh high-fidelity context and screenshots for file **WGbMylNV4rPoMw3r0nceaw**, page **498:32**, C04 **498:304** and C05 **499:305**. Read-only session **`1f09e16b-d0df-41a8-9f55-97692620ab6c`**. Both live screenshots and retained exact local C04/C05 PNGs were inspected; no Figma writes. Retained contexts: C04 SHA`f518f6340d17d3f79a7b1d6dc11ccce89c0c2c7b1c66ad75c6785bd84c33684f`, C05 SHA`4cc8d469f833d866e6d703c878573e935ef0012f018eebe11882aa842f70e7bd`. Product asset provenance was inspected. These screens have interface icons, with exact matches in existing shared Lucide wrappers, and no new product-image slot. No screenshot is a runtime asset and no temporary Figma URL is used.

Applied the repository-local task-first UX skill and relevant Superpowers implementation, TDD, debugging, verification and review workflows, plus React review guidance. No nested reviewer was spawned because the task forbids delegation; coordinator must commission independent review. The owned report is the scoped continuation record under the explicit write-set. No generic handoff/status/context file was authored.

## Changed paths and exported seams

All authored runtime files are under `apps/portal/src/features/history/`:

- `types.ts`: `HistoryCommand`, `ReportCommand`, `HistoryPort`, finite `HistoryOutcome`, actual `HistorySession = PlanSessionBoundary`, `HistoryContext`, `HistoryState`, `HistoryController`, `HistoryProps`, `HistoryNavigation`, `ReportIntent`, `ReportReceipt`, and typed unavailable photo-integration request.
- `port.ts`: `historyActions`, `createHistoryPort(runtime:ApplicationSession,request:OperationPort<HistoryCommand,unknown>)`.
- `model.ts`: strict source-bound command capture, immutable event keys, page continuation checks and empty optional body.
- `controller.ts`: session-memory drafts, current/original publication reads, paging, submission/corrections, exact status/retry and deliberate conflict review.
- `History.tsx`: `ClientHistory({controller,screen:'history'|'update',navigation,...optional public label/contact/export ports})`.
- `Timeline.tsx`: client-only original/correction/public review/legacy/use/attention rendering.
- `history.css`: scoped composition using shared semantic tokens.
- `index.ts`: public feature exports.

New owned tests/helper files, all in `apps/portal/tests/`:

`rebuild-reports-model.test.mjs`, `rebuild-reports-controller.test.mjs`, `rebuild-history-helper.mjs`, `rebuild-history-port.test.mjs`, `rebuild-history-ssr-entry.tsx`, `rebuild-history-ssr.test.mjs`, `rebuild-history-types.ts`, `rebuild-history-browser-helper.tsx`.

The sole authored documentation path is this report. Four Root files are attributed exact imports above. No existing test, plan/advisor/App/UI/router/session/renderer, package/lock/configuration, API-family metadata, Root SQL/server, TASKS/CURRENT_STATUS/CONTEXT_SYNC or foreign-worktree edit. All57 canonical migration bytes remain identical to base.

Enclosing seams are deliberately callbacks/ports: `openUpdate`, `back`, optional `openVersion(version)`, actual export/contact callbacks and immutable public identity resolvers. This feature does not call raw window history, create a router, mount App routes, invent a final export or restore a published plan. A historical restore would need an explicitly supported future new draft; no unsupported restore control exists.

## Protocol and report behavior

The runtime egress allowlist is **only five actions**: `submit_goal_report_v1`, `amend_report_v1`, `read_care_history_v1`, `read_client_plan_v3`, `request_status_v1`. Client owner comes from the actual retained session. No advisor action, client selector, arbitrary RPC/URL, bearer, task grant or private-guidance UI/schema is accepted. Root `readReviewCommand`, `decodePortalReviewResponse` and `mapReviewResult` remain the positive validators. The larger Review15/Guidance9 target does not give the module extra actions.

`createHistoryPort` captures actual client audience/identity, cookie generation/epoch and application boundary at creation. It checks them before egress and after result/error. The supplied raw request is the coordinator's retained transport seam. Initial tests supply a controlled raw OperationPort through actual `runtime.transport`, and therefore **do not claim actual Review-cookie factory execution**. No cookie parser or action override workaround was introduced.

New answers are optional and use actual fetched authored goal IDs. Comfort, notes and known/unknown occurrence are optional. Actual-use selection references loaded immutable use-event UUIDs; it creates no Start or use event. New photo arrays are exactly `[]`, with no nonworking upload input. The typed photo request requires authorized completed purpose-specific Storage integration. Corrections retain their actual current photo references, including those added by an earlier correction; they cannot silently drop or fabricate references.

Empty/whitespace-only commands are structurally valid. Only the exact `no_op/no_observation` receipt maps, with unchanged revision and null event/amendment/attention/notification IDs. UI says **nothing was sent**, allowing further optional observations or return. It never implies saved history, attention or delivered notification. A real report/correction acknowledgement requires matching original action/request UUID, expected revision and correction target, through Root mapping. Malformed success remains uncertain with the original wire retained.

Unsent draft and pending exact command live only in actual session memory. No localStorage/sessionStorage/URL/history storage. Navigation/remount/failed reads retain intent. Starting a correction cannot overwrite a meaningful unsent report. Logout, owner/CSRF/session replacement or401 invalidates private state; disposed rendered snapshots contain no private draft. A business/status403 is not a session-ended claim: status403/409/503, absent/malformed status and failed reads retain the exact original pending UUID/payload. Only the original exact command can retry; status is READ and does not authorize a new mutation.

Every asynchronous read/write/detail/status/review has captured session/context epoch and unique operation ownership. Old result, error and finally cannot apply or release a newer operation. Current recovery can supersede an obsolete read without waiting for it. Read-only/demo/preview/historical modes cannot mutate. Actual read-only to active return requires fetched deliberate review, including across controller remount.

A deterministic mutation409 preserves intent, fetches current V3 plus history and exposes the fetched record. Deliberate review rereads and requires the same current active basis. Only then may another deliberate submit capture a **new UUID**. An old source publication remains attached until that deliberate review rebases it; orphaned goal answers remain visible until explicitly removed. An uncertain wire is never rebased. Corrections read the exact original publication's goals and preserve original identity/body. Their head is selected only after the complete matching history snapshot is loaded; newer corrections require review rather than blind overwrite.

## Client history and necessary-copy review

UI consumes `ClientCareHistoryPage` in controller state, never an advisor-private page prop. Positive Root mapping rejects private notes, conversations, legacy private notes and source manifests before state/render. Original reports and separate full amendments retain reason, body, actual actor and occurrence/recording times. Use originals and corrections include known/unknown frequency and amount. Historical product labels use an exact original product/publication resolver or explicit product/version identity, never a current product's label. Public guidance uses its actual `publishedBy`, independently of reporter/recorder or preparer.

Legacy reviews/replies retain unknown publication as null and are available unfiltered, with **publication not recorded**. Legacy instructions retain actual `planVersion`, original `source.publicationVersion`, original Start, author/time, full usage/reason and effective date. They are not converted to a new approval or inferred schema. Published no-change reviews display client report, conclusion/reason/changes/next step with no fabricated plan version or new Start.

All attention relationship events remain independently paginated and keyed by unique `eventId`, not stable attention ID. Both unresolved and resolved transitions link their actual prior/new published reviews without changing the original conclusion. Pages obey Root400000-byte and requested-count validation, may contain fewer items with a real continuation, bind selected version/heads/session/cursor, reject duplicate identities/loops/terminal continuation and discard mixed-head continuations.409 requires a current fetch/restart. History filtering does not claim a historical actual-use snapshot or immutable rollback.

| Priority / task | Source issue or requirement | Correction / recovery | Evidence |
| --- | --- | --- | --- |
| P2 returning client | unknown write/status can otherwise become a duplicate or false success | exact pending command, READ status, finite receipt/no-op, retained denied status | pure controller + actual session-bound transport and Root mapping |
| P2 correcting a report | original body/actor/photo refs can be lost | separate original/replacement/reason/actor/time; current retained photos; original publication goals | model + actual SSR |
| P2 direct entry/recovery | first failed read has no data to render | heading/status/retry before view; no fallback form | actual SSR + controller |
| P2 expired/restricted mode | old private content/ack can survive a transition | synchronous boundary invalidation, token epochs, fresh deliberate active review | actual cookie/session boundary + pure controller |
| approved C04/C05 | optional human-led check-in, meaningful history | optional source-goal controls, no upload fiction, text/call/video remain valid; dated report/decision/reason/next step | inspected native design and source/SSR, browser still pending |

Copy serves the task, provenance, uncertainty or recovery. No mandatory questionnaire, objective improvement score, invented next date, automatic Start/payment/notification, founder-name inference or clinical claim. Read-only UI offers no new care-write promise. No measured human comprehension or live usability claim.

## Executed source verification and raw qualifications

Artifact root `E` is this checkout's ignored `.local-artifacts/portal-rebuild/w4-history/`. All Node/npm commands below prepend the exact Node22 PATH above. No browser, DOM, preview, process-resource polling, DB/Auth/fixture/credential/Docker/native or hosted resource call occurred. Local reference image reads are filesystem-only.

| Command / scope | Actual result |
| --- | --- |
| `node --experimental-strip-types --test --test-concurrency=1 apps/portal/tests/rebuild-history*.test.mjs apps/portal/tests/rebuild-reports*.test.mjs apps/portal/tests/rebuild-foundation-transport.test.mjs apps/portal/tests/rebuild-foundation-routes.test.mjs tests/portal-care-contract.test.ts tests/portal-care-handler.test.ts` | **78/78**,0 failures/skips:35 new +43 retained, `E/source-final.log` |
| Portal `npm run typecheck:rebuild` | Exit0, zero diagnostics, unchanged strict/noUncheckedIndexedAccess flags, `frontend-types.log` |
| Direct portal TS6 compiler `--ignoreConfig --noEmit --strict --noUncheckedIndexedAccess --allowImportingTsExtensions --target ES2022 --module ESNext --moduleResolution Bundler --jsx react-jsx --types react,react-dom --typeRoots apps/portal/node_modules/@types` with existing `assets.d.ts`, new `rebuild-history-types.ts` and browser helper | Exit0; five expected forbidden-boundary errors remain active, `feature-types.log` |
| Portal `npm run typecheck:session` | Exit0, zero diagnostics, `session-types.log`; no session source change |
| Portal `npm run build:rebuild`; `npm run check:ui` | Both exit0; existing foundation build and UI guard, no color budget change. New feature CSS is separately bundled below |
| esbuild actual `tests/rebuild-history-browser-helper.tsx`, browser/ESM/bundle with unchanged frontend tsconfig | Exit0; actual source JS/CSS/metafile in `E/browser-candidate/`. **Compilation only; never launched** |
| Root `npm test` | Exit1 after initial existing tests: absent `zustand` in `src/stores/authStore.ts`, `root-tests.log` |
| Root unchanged config via pinned portal TS6 `node apps/portal/node_modules/typescript/bin/tsc --noEmit` | Exit2: absent React/Expo/native dependencies and Expo base/derived JSX settings, `root-types.log`; no flag change |
| Root `npm run typecheck:tests` | Exit127, root `tsc` absent, `root-test-types.log` |
| Root `EXPO_NO_TELEMETRY=1 npm_config_offline=true npx --no-install expo export -p web` | Exit1, package absent/offline npx cancellation, `root-expo.log`. No package download/install or export success |
| Exact target blobs, five imported originals, eight role/project defaults, source scope,57 migration preservation; `git diff --check` | Verified before owned commit; preserved originals and no unrelated tracked paths |

Meaningful RED/GREEN logs are preserved: initial paging/attention failures; controller7/9 with superseded-read authorization and disposed-private-snapshot failures, then9/9; photo/read-only13/15 then15/15; unsent intent10/11 then11/11; denied status10/11 then11/11; navigation-source/remount11/13 then13/13. Counts overlap and are **not additive acceptance**. Final35 new tests include all these regressions and Root page-budget/no-op/private projection, actual session owner/CSRF, correction/full actor/usage, legacy/null publication and no-change/attention SSR controls.

Raw setup qualifications are not hidden: the first model run had a dotted opaque goal ID rejected by the real identifier parser; corrected the synthetic ID, without changing Root. The initial port/SSR run11/15 included four test assumptions: an ignored synthetic server `generation` property did not replace the actual cookie epoch (removed that invalid case; actual owner/CSRF transitions remain); actual transport normalizes409 to `revision_conflict`; the public Maya adapter had no goal rows (added a valid explicit synthetic goal); React SSR writes `readOnly`, not the probe's lowercase regex. These are input/assertion corrections, not product failures. Initial six W1 strict errors were fixed only through the authorized exact96db import. Existing typeless-root-module warnings remain. Actual SSR is rendering evidence, not DOM interaction or real persistence.

## Pending browser/application gate and continuation

`rebuild-history-browser-helper.tsx` exports **`mountHistoryCandidate`**, which composes actual captured ApplicationSession, feature port/controller and React StrictMode, accepting the coordinator's actual retained Review raw request and supplied enclosing shell/navigation callbacks. Importing/bundling launches nothing. The helper invents no identity/cookie parser/action override/successful fallback/router. The initial source tests' controlled request is precisely qualified above.

The next explicitly authorized source step is the **separate88d4e588 retained transport import**, then actual factory/controller/SSR/type checks. The coordinator's reported44 transport and Root1213/type/export results are **coordinator-attributed**, not W4 executions.

**No Chrome grant exists for W4.** W2 has the separately named sole synthetic Chrome allocation. W4 must remain source-only, make no preview/resource poll, and notify readiness. Later module browser work must intercept only actual `/api/client/reviews` and actual session routes, use the actual retained factory, deny all unexpected traffic and compare1440/1280/390/320, keyboard/long/error/read-only states against native C04/C05. Callback/feature-state tests cannot be presented as complete App routing/native Back/Forward or genuine Auth acceptance. R7 is idle/ungranted; no inference of custody.

Not executed: full portal/session runtime suites (they include forbidden browser/resource work), browser/DOM/visual geometry or pixel comparison, keyboard/focus/scroll/native Back, genuine Auth/Edge/PostgREST/DB/Storage/RLS/outbox/notification delivery, canonical reset/pgTAP, iOS/native, hosted/CI, human/accessibility/clinical/legal/license/business/release acceptance. Root blockers are above. No push/PR/merge/deploy, actual client/source/permission/message/funds/order action or memory write. Shared routes/App/real Review gateway/backend activation and independent acceptance remain coordinator-owned. Keep the branch and worktree for the next bounded phase.
