# W3 care/use and identity implementation

31 October 2026. **Implemented and locally tested in the owned feature against the pinned care port. Fresh independent review, genuine connected care and canonical backend acceptance remain required.** No general application activation, complete-portal or release claim.

## exact workspace, runtime and ownership

- Worktree `/Users/kanuj/.t3/worktrees/shelv/t3-6130843a`, branch `t3/client-care-use-projection`; exact clean starting parent **`71c2a525b13206b99025fe5dda30869a86d24f4a`**. Initial Git status/log/instructions and fresh fetch were inspected. The unrelated dirty scanner checkout was untouched.
- Both live T3 `orchestrator_capabilities({search:'gpt-6.1-sol'})` and `t3_thread_configuration({})` establish **codex / gpt-6.1-sol / reasoningEffort=xhigh / serviceTier=default**, full-access/default interaction, before implementation and again at final verification. Catalog descriptors support xhigh/default. Project defaults and all eight role overrides pin Sol/xhigh; hashes are retained. No fallback or nested agents.
- Node is explicitly `/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node`, **v22.23.0**. Every Node/npm command prepended that directory to PATH. Portal-only locked `npm ci --offline --ignore-scripts --no-audit --no-fund` installed 130 packages. No dependency, lockfile, compiler flag or color budget changed.
- Owned early seam **`795a90cc`** exports compatible types/props and initial v2 normalization. Its initial two browser regressions were intentionally RED; it was not a completed form claim. The parent integrated that seam separately.
- Explicitly authorized parent-only imports: `dbdec5c250a4835ddb390624024cf650f573882e` as **`31cc6e93`**, and `c8de1bd2b6492c4a5761edb6effe6a127e0981bc` as **`42bf1ead`**. They change only parent `app/client-state.ts`, parent care-port tests and the coordinator transport report. These are imported parent work, not W3 authorship. Do not re-import them into the parent.
- W3 authors only `apps/portal/src/features/plan/**`, new `rebuild-care-plan*.test.mjs` / `rebuild-use*.test.mjs`, `tests/rebuild/care-*` helpers and this report. Existing client tests, Root contracts/SQL/Edge, session/ports/shared navigation/UI/dependencies/source assets and canonical status/context are unchanged by W3. The final owned implementation and report commits are returned in the handoff.

## requirements and native references

Read the complete 95,388-byte approved original in bounded chunks; D01-D48; full desktop specification and manifest; CARE_API_V1, PLAN_API_V1, ADVISOR_READ_API_V1; implementation/acceptance/status/workstreams and portal UI policy. Read full W1_REMAINING_API, W1_CARE_IMPLEMENTATION, COORDINATOR_CARE_TRANSPORT; W3 original/fixes/conflict-preview/recovery; original W7 client review/R2/R3/R4; fresh native product-free13/readonly4 and status-recovery R2 reports. Original F1-F8/Q1/Q2/F5/R3-1 keep their scoped dispositions. This work does not reinterpret those passes as care/backend or full-portal acceptance.

Resume, Figma design-to-code, repository task-first UX, TDD, verification-before-completion, React review and a bounded operation-ownership Variant Analysis informed this work. Session Handoff preserved this assigned report during long verification. No new design exploration or nested workflow was started.

The design skill preceded live high-fidelity context/screenshots for file **`WGbMylNV4rPoMw3r0nceaw`**, page498:32, C07 **499:584** and C07C **503:1174**, session **46004a14-7792-459a-9884-032abba6357f**. Native C01/C01E/C02/C02D/C03/C03D remain retained references. No Figma edits. All five imported originals match exact declared bytes/SHA-256; all 16 relevant retained context/PNG hashes and all catalogued assets match their catalogs.

| Preserved reference | SHA-256 |
| --- | --- |
| approved input,95388 bytes | `c45701f9f54fd2b1dbb09bbd7aa2b9b437e9059aa6032b6f39411fe2e7f6efbd` |
| C07 context / PNG | `381d439cd5204192bd5b32f14f5bea8f2fd3e8955008d657b11e9288645aa5eb` / `d54f05cadf2ba67157c6f8c3694b1c77cf8b879e0823939b7f272d42cccbfc02` |
| C07C context / PNG | `f1bc44aef2aa7dd7b4b04a5a937563d2f5c8c23e306ad07e459e6d06866c9f35` / `27389dfa84c66856d3f7ee78450374f383820988316f3258fcf4fd67f3136e52` |
| retained CeraVe native product asset | `af135b13a07dd0ab5e24e0c297ffd2243a85a65fb6d2bcaa7604fe707aef719d` |
| retained azelaic native product asset | `118d93c1ad24efd48090a9e91d246eb87567471db99024b9eb9b89a8ae535df1` |

Fresh contexts, actual source/test hashes, all 12 public-sample image paths/hashes and executed evidence are in ignored `.local-artifacts/portal-rebuild/w3-care/`. `evidence-manifest.json` inventories them; it excludes itself. Native screenshots are references, never runtime assets. Actual UI uses existing data-bound product photos, shared wrappers/tokens and Lucide. No global casing or parallel design system.

## public feature seam and behavior

`features/plan/index.ts` exports `ClientPlan`, `ClientPlanReadView`, `ClientCareCommand`, `ClientPlanProps`, `ClientPlanPorts`, existing v1 `ReadPlanCommand` / `DecisionCommand`, `DemoPlanPorts`, `PlanSessionBoundary`, `PlanRoute` / `PlanNavigationPort`, and the unchanged explicit unpublished-preview exports.

- `ClientPlanReadView = ClientPlanView | ClientPlanViewV2`; shared `PlanRenderView` also retains explicit `UnpublishedPlanView`.
- `ClientPlanPorts` keeps the exact v1 read and decision ports, adding optional `care: OperationPort<ClientCareCommand,CareResult>`. The client command derives from Root's finite client-action tuple. Production feature code never imports the app/auth factory. Tests use actual `createClientCarePort` and retained cookie/session transport.
- The `report-use` route subset is consumed from the already-pinned shared route. The parent supplies actual care ports and starts v2 only after backend acceptance. Missing care/v2 capability shows unavailable care actions; v2 reads never fall back to Start-only v1. Current application default activation remains v1.
- `onViewChange` must retain the strictly validated fetched view identity. The parent controller now validates with the proper finite mapper, requires equal decoded value and emits the supplied typed view. This preserves existing object/epoch review fences. No feature fence was weakened to accommodate remapping.

C07/C07C bind exact selected product name/variant/size and question, with yes/check, no/x and not-sure text. Identity remains a client report, independent of formula/professional verification. The form supports started today, earlier with a known or unknown actual date, paused/stopped, different frequency/amount/details, and an unreviewed product. Occurrence is the sole Start date input; there is no duplicate startedOn. Chicago today is captured only for the explicit today action; unknown stays unknown. Impossible/future dates reject with accessible date feedback/focus.

Acquisition is separate. Self-purchase emits care commands and no finance request. Stop/pause needs no choice approval, purchase, receipt, photo or advisor edit capability. Actual care/session/access gates still apply. Recording by an advisor remains a separate server-authorized human flow, never a client actor toggle.

No/not-sure/different-product flows retain the original identity answer and create a separate reported descriptor when needed. Each server-created UUID/version is used directly in later identity/use steps. No fake catalog/plan/slot object or PlanContent insertion. A direct `/plan/use` report needs no dummy selection. Reported products have their own descriptor sheet for direct Back; it uses no fabricated PlanProduct or reviewed guidance. Coincident strings in plan/reported namespaces refuse an ambiguous target rather than aliasing a write. Completed product-label source upload is not available, so no upload control or fake URL/success is offered; arrays remain empty. A future uploader must return actual completed authorized label-source UUIDs.

One renderer normalizes v2 use for routine/product/evidence/recommendations. Paused/stopped/different/unreviewed or contradictory current state suppresses unqualified continuation. Published advice and professional pause/exclusion reasons remain separate and inspectable, including when the client reports contrary use. A reported Start with an unknown date may use the correct authored guidance but creates no elapsed-day stage or automatic advance. An explicitly started unreviewed product shows its actual report/unknown date while remaining unreviewed and outside the advised routine. Null latest review produces no invented panel. Historical documents explicitly identify the current-use overlay.

Full report reads use the summary's original publication/product/slot. Effective amendment kind/date and original attribution remain distinguished; original body/reason are read from the paginated ledger. Reported-product pages retain exact server versions/cursors and head checks. Metadata references are not authorization. Global care history, amendment authoring and other W4 flows are not claimed by this selected-report reader.

## exact writes, recovery and prior findings

Each step captures a UUID/payload before egress, passes strict Root command/result mapping and rereads current v2 before progress/success. A mismatch can require identity -> descriptor creation -> reported identity -> use, each with its own current CAS, receipt and exact retry. Uncertain creation resumes before later steps, using the same server UUID. Identity-only completion never displays the entire report as saved.

Request-status is a read.403/409,503, malformed status and positive absence preserve the original pending intent. A post-ack current-read409 is also a read failure, not a rejected original mutation. Only a known mutation409 enters the rejected-write review path. That path retains attempted intent, requires successful fresh content plus deliberate same-basis active reread, and cannot unlock through navigation, failed/pending reads or a read-only -> active return.

View/mode/session epochs and unique operation ownership retire obsolete requests locally. Old success/error/finally cannot apply a new view, overwrite intent or release a newer lock. Session memory clears on actual owner/CSRF/logout/session replacement; private answers do not enter URL/history/localStorage/sessionStorage. The captured exact command remains the retry; no automatic new-version mutation is invented.

The bounded variant check calibrated the original R3-1 ownership pattern, then searched the repository for `busy=useRef(false)` / `busy.current=false`. One remaining candidate was `DecisionControls` submit/reviewLatest, reached through a superseded v2 reread. Its actual enabled retry emitted no request until the obsolete read settled. This **P2 recovery variant** reproduced with the real app controller/cookie/Root mappers, then passed after exact-token retirement/finally. Original `PendingReview` remains unchanged. The automatic browser regression is the CI guard; no shared CI/static-rule file was added. This is not a security scan or server bypass finding.

All original 58 regressions pass unchanged, retaining F1-F8/Q1/Q2/F5/R3-1, exact uncertain choices, current fetched review basis, real Back destinations/opener focus, all eight decision types, all seven rich Maya source cards/guides/cautions/comparisons and preview/ledger isolation. New care facts cannot be replaced by a v1 decision reread.

## task and visual review

| Task | Immediate feedback and recovery | Evidence |
| --- | --- | --- |
| Report exact product use | Visible identity, actual date and acquisition; deliberate record action | Actual installed-Chrome events through finite HTTP and real session/care factories |
| Report mismatch/new product | Unreviewed descriptor and partial completion stay explicit; server UUID only | Four-step CAS and uncertain descriptor recovery |
| Recover conflict/uncertainty | Retained answers, exact retry/status and successful fetch plus deliberate review | Late/403/409/503/malformed/absent/current-read/mode/owner cases |
| Return to advice | Actual destination label, native Back/Forward, retained unsent answers and equivalent current opener | Keyboard/Enter/Escape, sheet lifecycle and stable focus targets |

C07/C07C actual1440 geometry matches native main `(264,214,744)`, context `(1032,214,368)` and photo88x112. V2 C01 retains `(264,196,744)`; C03D retains main `(264,162,736)` and context x1024/width376. Actual1280/390/320 forms reflow without horizontal overflow. Six typed states, accessible question/field labels, date errors/focus, Tab/Enter/Escape, native history/unsent memory and200% **CSS zoom** are checked. Native browser zoom, full WCAG, physical mobile and representative-human comprehension are not claimed.

Actual screenshots were inspected against native references, including C07/C07C, narrow C07C and v2 C03D. Complete source names/guidance, explicit uncertainty, truthful acquisition defaults, reported state and required mismatch/recovery controls justify source-length/state differences. No pixel-identical claim. Screenshots identify the care fixture as synthetic. Copy serves task, consequence, provenance, uncertainty or recovery; it does not claim delivered email, verified formula or completed commerce.

## executed verification and honest limits

Commands use explicit Node22 PATH, root cwd unless noted. Logs are under ignored `w3-care/`. Counts overlap and must not be summed into acceptance.

| Command / evidence | Actual result |
| --- | --- |
| Initial `node --experimental-strip-types --test --test-concurrency=1 apps/portal/tests/rebuild-use-browser.test.mjs apps/portal/tests/rebuild-care-plan-model.test.mjs` before production edits | **0/8**, intended absent form/v2 suppression; `red.log`. Pure6 then6/6. |
| App-controller fetched-identity reproduction | RED0/1; authorized parent fix then actual-controller care 50/50. `app-identity-red.log`, `actual-controller-green-1.log`. |
| Added-unreviewed, post-ack read409, Back label, caption/read-only, decision-owner and reported-return/namespace/unknown-Start cases | Intended REDs retained; unchanged intended assertions pass after corrections. `*-red.log`, corresponding green logs. |
| `node --experimental-strip-types --test --test-concurrency=1 apps/portal/tests/*.test.mjs` | Final **980/980**,0 failures/skips,346.419s, exit0; `portal-complete-final.log`. Includes original 58, new 60 and parent care/controller 12 within this total. Earlier974/976/977 passes retain their earlier exact scope. |
| Portal `npm run test:session` | **171/171**,0 failures/skips, exit0; unchanged session/runtime source, `session-full.log`. Actual retained factories/canned provider/Miniflare evidence, not genuine Auth. |
| `node --experimental-strip-types --test --test-concurrency=1 tests/portal-care-contract.test.ts tests/portal-care-handler.test.ts` | **15/15**,0 failures/skips, exit0,394ms; `root-care-focused.log`. Strict canonical DTO/handler-port tests, not SQL/Auth. |
| Portal `npm run typecheck:rebuild` / `npm run typecheck:session` | Both exit0, zero diagnostics; final terminal logs. Strict/noUncheckedIndexedAccess flags unchanged. |
| Portal `npm run build:rebuild` / `npm run check:ui` | Both exit0; full new-source semantic-color guard and retained11-sheet UI check. No allowance change. |
| Portal `npm run build:application` / `npm run build` | Passed in verification driver; clean committed-source candidate and final hashes are recorded in the completion receipt below. Build does not activate care or deploy a gateway. |
| Root `npm test` | **Blocked**, exit1 at absent `zustand` in authStore after initial unchanged tests. No root install or full-root success. |
| Root `npm_config_offline=true npx --no-install tsc --noEmit` | Exit1, missing installed root compiler/cached unrelated tsc warning. Direct installed portal compiler with unchanged root config exits2 for absent React/Expo/native deps/base config. |
| Root `npm run typecheck:tests`; direct pinned-compiler retry | Exit127, root tsc absent; direct unchanged test config exits2 for absent node/react-native types and Expo base. |
| Root `EXPO_NO_TELEMETRY=1 npm_config_offline=true npx --no-install expo export -p web` | **Blocked**, exit1, Expo absent; no package downloaded. |
| `git diff --check`, owned-path/diff/source/artifact inspection | Pass before commits; no historical test weakening, secrets, temp bundles or source-asset edits staged. |

Raw diagnostic failures are retained. `focused-1.log` is89/90: the sole failure was a helper calling setMode before App committed. The helper now waits for its actual installed setter. `care-expanded.log` is37/38: a test expected Forward after a direct-entry semantic-parent replacement where no Forward entry exists; it now enters through actual plan -> sheet -> use history. No production gate was weakened. The provenance reading script initially had a relative import one directory too high; correcting that ignored script path produced all 16 native hash matches. Existing typeless-package/absent root Expo-base warnings remain recorded.

No canonical reset/pgTAP/RLS/Storage/Edge/native fixture, real Auth/provider session, genuine care DB/alert/finance effect or notification delivery was run. W1 owns new Root care SQL and its fixture; the protected55-migration R4 was never accessed/adopted/reset. No native/mobile runtime change, iOS export, hosted check or exact-head CI. Root dependencies, full canonical/genuine connected care, fresh independent review, remaining source uploader, global history, all five Maya stages, representative-human and release gates remain separately owned requirements.

## resource return and integration

**Chrome released 2026-10-31T06:26:57.274631Z**, immediately after the terminal 980 run and before final report work. All contexts/browser/test handles closed normally. Fresh inventory: **Chrome[] / workerd[] / owned Node tests[]**; live preview has **no tab**. No broad kill. `release.json` and live preview receipt are retained. The parent was explicitly notified; no browser/DOM call followed release. Later parent activity is outside that observation.

Parent should integrate only W3's owned implementation/report commits after the already-imported early seam; the two parent app imports are already parent-owned. Preserve all original reviews and this full response for fresh Sol/xhigh review. Pass the actual captured care port and activate v2 reads atomically only after backend/genuine acceptance. Preserve the validated view identity through onViewChange. Wire any future label uploader only to completed authorized source UUIDs. Parent owns canonical status, acceptance, TASKS and CONTEXT_SYNC updates.

No push, PR, merge, deploy, real client/source/permission action, communication, funds or retailer order. This is a reviewable local care UI module against stable contracts, not accepted connected care or the finished portal.

## completion receipt

Implementation/test/report commit: **`6b264169c0cf4cc286a60b0244fa17e9200cabe6`**. Early seam `795a90cc` is already parent-integrated. The final documentation-only suffix is returned as handoff head. No runtime/test source changed after the final 980 run.

Clean implementation candidate: `sourceHead=6b264169c0cf4cc286a60b0244fa17e9200cabe6`, `sourceDirty:false`, `gatewayIncluded:false`; immutable provenance copy SHA-256 `b6abae7f33b5c0133d2e5e7e275fc2478788562159c6cdc20b24c0b761e24438`. Application JS `51112ed5d5bf958b61aab62792c94fc42b434592b9cff42f672cceec22e59589`, CSS `e69bed1810171c81ff17a9382f65e640e629fd5000a10d73bf9168ad51bc412e`. Combined 138-asset ZIP `5b37305297a24c48c1ceea66bac85a3add01ab00e0cbd62089405058bb556498`, Vault `c162df6ba1979ac23c87eefe0b678fd46ad1f2d17d25cf55f9b4564bf462d4e0`. Both clean-head builds exit0; no care activation or deployment.

Evidence-manifest SHA-256 `91c59e3337c592ce2513880fae35f3e825ddefde2192c012a688ae30f20c3b41` inventories actual source/test hashes, 16 native references, 12 original runtime images and executed artifacts, excluding itself and the report. Both live runtime tools again verify Sol/xhigh/default; runtime-final.json and nine config hashes retained. Final source/diff/scope/whitespace checks pass. Parent retains Root-dependency checks, exact-head CI, canonical/genuine care acceptance and independent review. Chrome release above is unchanged.
