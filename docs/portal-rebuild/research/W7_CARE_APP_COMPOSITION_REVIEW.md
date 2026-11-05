# W7 independent care application composition review

Owner: Kanuj. 31 October 2026. Report-only review of exact parent **`18c78b7d477f7d8fe9bc7ff950544ab0081f8008`**. No nested agents or production fixes. Synthetic Chrome custody returned before report writing.

## Separate verdicts

| Subject | Specification | Correctness / quality |
| --- | --- | --- |
| Complete assigned application composition | **CHANGES REQUIRED: new CA1/P2** | **CHANGES REQUIRED**: supported direct care routes misclassify a failed first read as an unconnected page and omit its retry |
| Explicit care factories, v2 selection and successful application flows | **Scoped PASS** | Actual first load, care Stop/current v2 reread/reload, finite audience-bound ports, original decision/publication/navigation journeys and exercised late-result controls pass |
| Canonical advisor v2 audit | **Scoped PASS** | Actual preparation/active/read-only/ended distinctions and current-use attribution remain; error/private-extra/wrong-client results refuse without v1 fallback or fabricated client entitlement |
| Prior CU1/CU2/CU3 and earlier application/backend findings | **Prior qualified closures retained** | No new reproduction of those original mechanisms. CA1 is separate. Their recorded evidence is not recertified as current genuine care acceptance |
| Genuine care browser, independent R7, full goal and release | **NOT ESTABLISHED** | No genuine Auth/SQL/native resource access, deployment or live action was performed |

Unchanged checked-in source79 and actual-Application browser13 pass. Independent source/SSR is **2 pass /3 intended failures**; independent actual-Application browser is **11 pass /6 intended failures**, with the same six failures reproduced in a separate process. Passing counts do not override CA1. Counts overlap and must not be added into product acceptance.

## Exact source, runtime and ownership

| Item | Verified evidence |
| --- | --- |
| Workspace / branch | `/Users/kanuj/.t3/worktrees/shelv/t3-dd64ac3a` / `t3/review-care-app-composition` |
| Clean starting and tested application head | **`18c78b7d477f7d8fe9bc7ff950544ab0081f8008`**; actual Git status/log/worktree and root/portal AGENTS inspected before review; runtime/test source unchanged throughout |
| Composition commits | Factory `816b3a6554f988c5e98440c040611151fd6242b3`; actual Application/audit `18c78b7d477f7d8fe9bc7ff950544ab0081f8008` |
| Task suffix | `portal-rebuild-w7-care-app-composition-review-20261031-r1` |
| Actual child thread | `thread:delegated-task:command%3Amcp%3A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%3Adelegate-task%3Aportal-rebuild-w7-care-app-composition-review-20261031-r1` |
| Actual run | `run:thread:thread%3Adelegated-task%3Acommand%253Amcp%253A80ff67d2-459c-49fa-93e3-1b40a1f4cbcd%253Adelegate-task%253Aportal-rebuild-w7-care-app-composition-review-20261031-r1:ordinal:1` |
| Parent / project | Live thread readback: `d632030a-18f7-4dec-a2c9-f5c0418c3fd5` / `ac0af19d-d404-4f53-a870-02bfd76c2a80` |
| Both live model tools, before and after Chrome | `orchestrator_capabilities` and `t3_thread_configuration`: **codex / gpt-6.1-sol / reasoningEffort=xhigh / serviceTier=default**, full-access/default interaction |
| Supported descriptors | Reasoning low/medium/high/xhigh/max/ultra, catalog default low; service default/priority, catalog default default. Effective xhigh/default is explicitly selected |
| Eight role pins | Project defaults plus w0_foundation, w1_plan_platform, w2_advisor, w3_client_plan, w4_checkins_history, w5_orders, w6_account_service, w7_verification parsed and hashed; all Sol/xhigh |
| Node / dependencies | Actual **v22.23.0**, `/Users/kanuj/.nvm/versions/node/v22.23.0/bin/node`; portal-only locked offline install130 packages; no root install, package/lock/config/flag/budget edit |
| Git freshness boundary | Local `origin/main=d39a7d4943209080df7c4cf97d85784f462758bf`. No fetch, remote-currentness/CI claim, reset/rebase/import or foreign-worktree write |
| Tracked write-set | **Only this report**. Coordinator retains CURRENT_STATUS, acceptance, TASKS, CONTEXT_SYNC, integration and fixes |

The containing report-only commit is a child of the exact tested head and is returned in the final handoff. No push, PR, merge, deployment, real-client/source/permission change, communication, funds or order.

## Requirements and inspected scope

Read the complete **95,388-byte** [approved input](../source/APPROVED_INPUT.txt) in bounded ranges, including A/D01-D48, B/full desktop specification and C/full26-screen/component manifest. The decision/specification appendix text equals the standalone files; all five original byte counts/SHA-256 values match INPUT_PROVENANCE. Read [contracts](../IMPLEMENTATION_CONTRACTS.md), [CARE_API_V1](../CARE_API_V1.md), status, acceptance, ownership/AGENTS and the full [coordinator application composition](COORDINATOR_CARE_APP_COMPOSITION.md) and [transport response](COORDINATOR_CARE_TRANSPORT.md).

Read all three care-client reviews, the complete W3_CARE_USE including CU1/CU2 responses and the attribution response. Revisited original application A1/A2/A3 and fixes R2, W0 fixes/composition, C1/AR1/status-R2 notice qualifications, backend R3 and CB1/CB2 R2, CN1/M57, W6 care Node evidence, and original H1/H2 findings/dispositions. Historical resource/status prose is not a grant. In particular, prior reports' **Application=v1** describes their old source; this exact candidate now selects v2. No deployed behavior is inferred.

Inspected the actual diff and complete affected factory/Application/audit paths, current startup/session/cookie facade, creation-bound care port/captured transport, controller/accept mapping, Root positive care mapping/metadata, shared use/renderer/mode/review boundaries, route/return composition, changed tests and builder provenance. Since0755, exactly **three application source files** differ: `ports.ts`, `Application.tsx`, `PublicationAudit.tsx`. No feature, Root contract, SQL, gateway, auth/session, route, dependency, CSS or asset source change is hidden in this application patch. Separate native-test preparation and documentation do not authorize running a native entry here.

Applied Resume and verification-before-completion. This is a manual bounded specification/correctness review, not an exhaustive security scan or a new design review. No approved design was reopened.

## CA1 / P2: failed first reads lose direct care-route recovery

**Owner:** coordinator application composition. **Requirements:** D10/D46/D48, meaningful loading/denial/error recovery on real deep links; preserve the explicit confirmed-v2 gate before rendering a form. **Source:** [Application.tsx](../../../apps/portal/src/app/Application.tsx), `ClientContent`, lines401-447.

`supported` includes `product-use` and `report-use` only when `state.view?.schemaVersion===2`. Before a successful first read, `view` is null. The `!supported` branch runs **before** the error/loading branches, so a current failed v2 read never reaches the existing denial/error notice and `controller.refresh()` retry. `/plan/use` additionally falls through the unavailable title selection to **notifications**. No form is prematurely enabled; the defect is lost read-state/recovery presentation.

Independent actual-Application browser reproduction, with the original startup/session/cookie/factory/Root mapper/controller/components executing:

1. Directly enter `/plan/products/cerave-pm/use?routine=evening` or `/plan/use?routine=evening` at390px. Return the current signed-in synthetic cookie session.
2. The actual first domain command is exactly `read_client_plan_v2 {version:null}` through `/api/client/care`. Deliver403,409 or503 at that finite HTTP boundary.
3. The product URL shows **record actual use / this page is not connected yet / no action has been recorded**. The general URL shows **notifications** with the same notice. Both have **zero try again controls**.503 can retain the separate global connection banner; it does not supply this page's missing controller retry.
4. Open the real mobile menu, navigate via **your plan**, and observe the existing **try again** control. After a normal cookie restore for503 and removal of the injected HTTP failure, deliberately retry. The same real controller loads v2 normally. There is no v1 fallback, mutation or permission workaround.

The six intended direct-route retry assertions fail **0/6**, then **0/6** again in a separate serial browser process. Three actual-cookie/controller/ClientContent SSR cases independently fail the unsupported-page assertion for403/409/503; each also confirms `/plan` exposes retry. Both care route outputs are preserved in each SSR JSON. The actual `/plan/use` screenshot was inspected locally: it displays **notifications**, not a care-read failure. This is not a missing selector standing in for a product defect: final assertions explicitly compare the observed retry count **0** with required **1**, after the successful `/plan` recovery control.

**Bounded correction to evaluate:** recognize these known route names independently of whether data has arrived, present loading/error/denial/retry first, and keep actual care-form composition dependent on a confirmed valid v2 view. Preserve private fields, current-session/view fences and no-v1-fallback behavior. Use an appropriate care heading for the general route. Add durable actual-Application failed-first-read/deep-link regressions. No production fix was authored here.

This is P2 recovery/truthful-status behavior. It demonstrates no server authorization, SQL, publication/payment or source-access bypass, and no stored-report loss. A deliberate navigation through `/plan` is a working recovery path; that qualification does not make the direct page's unavailable status truthful.

## Positive composition and preserved boundaries

| Area | Independently observed evidence and limit |
| --- | --- |
| Factory / API selection | Optional `{care:true}` creates the existing actual audience-bound care port. Defaults retain legacy v1 composition. Client initial controller selects readVersion2. The checked-in factory4 and surrounding source tests pass. No second parser, BFF, caller URL/RPC/owner field or new right |
| No lossy fallback | Current source tests preserve confirmed v2 on409/503. Actual Stop, v2 reread, reload and reported-stopped display use care only; zero `read_client_plan_v1`. Decisions remain on their existing finite plan command and reread v2 |
| Actual care URL / callback | Own320px journey enters the real product-use PKCE URL, completes once, removes the synthetic code, retains the selected product/evening route, uses keyboard Enter for action/submission, records unknown occurrence plus exact supported Stop note, then reloads and returns to the proper product sheet |
| Actual state versus advice / finance | One actual synthetic care write, current stopped overlay and suppressed routine continuation; immutable advice remains separately readable. Original `actualUse` stays empty. No payment request, Start, fabricated order/product or private history control |
| Preparation / unavailable / read-only | Own preparation route shows preparation with no form; an unknown product shows item-unavailable with contextual Back. Checked-in general320 read-only case and SSR read-only product case reject care controls. CA1 qualifies first-read error/loading presentation |
| Raw care continuations | Two independent actual factory cases replace owner/CSRF through public `runtime.restore()` while a care response is held. Old port401, no further egress, private memory cleared; client controller stays ended/view-null even on later `accept`, and old advisor permissions stay false. No successful port/current()/mapper replacement |
| Mounted client late result | Actual Application public focus restore replaces owner/CSRF while old v2 delivery is held. New owner's current view loads; releasing old delivery cannot restore its private marker |
| Advisor canonical selection | Actual Application sends `read_advisor_publication_v2` with exact client/version-null. Preparation, active, read-only and ended clientAccess remain distinct. Shared UseFacts shows Stop, original advisor-recorded attribution and the actual correction-client actor |
| Audit effects / error / late projection | Care503, unexpected private field and wrong client produce unavailable audit, never a legacy read. Held old audit across public owner/CSRF restore cannot replace a newly loaded current audit. No rendered care-write, full-history, client-choice or publication controls |
| Optional legacy audit | Source chooses legacy read only when no care port exists; care rejection/mapping failure has no fallback catch. Existing v1 audit SSR compatibility remains in source79. No fabricated ClientPlanView/access/entitlement conversion |
| Auth / navigation / old11 | Unchanged actual App13 passes, retaining decisions/publication/no-Start, logout/late result, callback invalid-form scrubbing, default assigned-open, preview native Back/Forward with250/600 scroll and real focus assertions. No prior assertion weakened by this reviewer |
| CU1/CU2/CU3 and original58 | All eight original regression/helper files equal284c04e. Shared feature files have no delta since independently accepted0755/R3. Unsupported notes, complete correction body and actor mechanisms remain intact; this round exercises the audit's compact attribution, not another full CU1/CU2/CU3 browser matrix |
| Modes / public / rights | Public Maya remains explicitly unavailable for its five-stage tour and makes no auth call in unchanged App13. No public live care port; unpublished/preview/historical restrictions, agents, labels/photos and source rights are unchanged. Labels remain empty arrays until a real uploader exists |
| Browser persistence / bytes | Own successful flow has empty localStorage/sessionStorage and no note/callback in history/URL. Root strict decoding rejects the synthetic private-extra audit body from UI. This is not an original-response byte-scan or real credential-disclosure assessment |

Original A1/A3 remain addressed; A2 remains addressed only within its recorded internal-transition/source boundary, with ordinary browser reachability of the old race **unproven**. Default lawful assigned-open, C1/AR1 and matching notice/manual-payment recovery keep their accepted dispositions; the original pending-after-valid-ack objection remains incorrect. Backend F1-F5/Q1-Q2/R2 wait fences, CB1/CB2, CN1/M57 and native H1/H2 remain scoped historical closures, not fresh SQL/Auth assurance from synthetic browser data.

## Executed checks and raw qualifications

`E` means this review's own ignored `/Users/kanuj/.t3/worktrees/shelv/t3-dd64ac3a/.local-artifacts/w7-care-app-composition/`. All test commands select `PATH=/Users/kanuj/.nvm/versions/node/v22.23.0/bin:$PATH`; root cwd unless stated. All browser runs are **serial `--test-concurrency=1`**, with normal after/finally context/browser closure. Source/SSR and both strict types completed before the browser phase.

| Command / scope | Actual result |
| --- | --- |
| Portal cwd `npm ci --offline --ignore-scripts --no-audit --no-fund` | Exit0,130 packages; unchanged lock; no advisory assessment |
| Source command below | **79/79**,0 failures/skips/cancelled,3.294s; `source.log` |
| Same serial Node flags, `E/source-independent.test.mjs` | **2 pass /3 intended CA1 failures**,0 skipped/cancelled,252ms; two owner-replacement cases pass |
| Portal `npm run typecheck:rebuild`; `npm run typecheck:session` | Both exit0, zero diagnostics, unchanged strict flags |
| Portal `npm run build:application` before report creation | Exit0; exact clean18c candidate, no gateway; provenance below |
| `node --experimental-strip-types --test --test-concurrency=1 apps/portal/tests/rebuild-app-browser.test.mjs` | **13/13**,0 failures/skips/cancelled,25.382s; unchanged current author test bytes |
| Same flags plus `--test-timeout=60000 E/browser-independent.test.mjs` | **11 pass /6 intended CA1 failures**,0 skipped/cancelled,11.523s |
| Same flags plus `--test-name-pattern='^actual Application /plan/' E/browser-independent.test.mjs` | **0/6 intended CA1 failures**,0 skipped/cancelled,5.521s; separate process |
| Input/config/original-file/source audits; report links/scope/whitespace | Verified before report-only commit; no tested runtime/test bytes edited |

Exact source command:

```sh
node --experimental-strip-types --test --test-concurrency=1 \
  apps/portal/tests/rebuild-app-care-composition.test.mjs \
  apps/portal/tests/rebuild-app-care-render.test.mjs \
  apps/portal/tests/rebuild-app-ports.test.mjs \
  apps/portal/tests/rebuild-app-session.test.mjs \
  apps/portal/tests/rebuild-app-state.test.mjs \
  apps/portal/tests/rebuild-app-render.test.mjs \
  apps/portal/tests/rebuild-app-callback.test.mjs \
  apps/portal/tests/rebuild-app-start.test.mjs \
  apps/portal/tests/rebuild-app-preview-context.test.mjs \
  apps/portal/tests/rebuild-app-continuation.test.mjs \
  apps/portal/tests/rebuild-care-ports.test.mjs \
  tests/portal-care-contract.test.ts tests/portal-care-handler.test.ts
```

Raw setup qualifications are retained. Initial independent browser17 was11/17: the six error cases attempted to click the mobile **your plan** link without first opening **menu**, and timed out before the intended final assertion. The saved initial script/log is not accepted defect sensitivity. Only that probe navigation was corrected to open the real menu; all eleven controls pass again and all six intended retry-count assertions now fail, including in the separate repeat. No application, prior test or intended assertion changed. The first skill read used a nonexistent location before resolving the installed path. A source inventory tried three nonexistent transport filenames before resolving the actual cookie/session/upstream files. These discovery errors are not product findings. Initial `node --version` used inherited PATH, already resolving exact22.23.0; subsequent executions explicitly prefix it. Existing root MODULE_TYPELESS_PACKAGE_JSON and missing-root-Expo-base bundler warnings remain; strict frontend/session checks pass without relaxation.

The ignored browser helper is the inspected original App-browser helper prefix, with own absolute import/output paths, optional finite HTTP care-response callback, synthetic session owner selection and a care-CSRF assertion. It executes real main/start/Application, actual factories/cookie/transport/mappers/controller. Its HTTP DTOs and reducer state remain synthetic. It does not return successful replacement operation ports, session-current predicates, forced permissions or overwritten mapper/controller results. Unexpected network aborts and fails teardown; `.invalid` documents/APIs and exact public-sample assets use local bytes, with service workers/background networking/DNS blocked. No alternate browser or external service was used.

## Candidate, release and remaining gates

Fresh clean build: **sourceHead18c78b7d477f7d8fe9bc7ff950544ab0081f8008 / sourceDirty:false / gatewayIncluded:false**,2,207 provenance inputs. Own immutable provenance SHA-256 **`05d54734b8856574f231e2aa7927d492e2805215802d3c2554e136bfef55d7fb`**, exactly matching the parent-provided receipt. This is an independently regenerated local candidate receipt, not production deployment or genuine care acceptance. No CSS/design change or new whole-screen pixel/accessibility/zoom/human acceptance claim.

First browser tool was `preview_status`, no tab. The user expressly granted the documented installed-Chrome interception workflow; no collaborative tab or alternate browser opened. **Chrome explicitly RELEASED `2026-10-31T08:53:44.613948+00:00`.** All own tests/contexts/Chrome handles closed normally. Fresh process inventory: **Chrome[] / workerd[] / owned Node tests[]**. Last live preview: **available:false, tabId:null**. No broad kill and **no browser/DOM call after release**. Subsequent PNG inspection reads local files only.

No Docker/PG/Auth/credential/R4/R5/R6/R7/helper/reset/native/external-service call or resource polling occurred. Parent-provided R7 author93f015e8 at3a0e120,11groups/all13 positive care HTTP actions, exact filtered8/3/1/1,7issued/7closed/0/0,205 protected files and08:27:51.710UTC return are **attributed only**, not independently verified here. Parent57 reset/35pgTAP796/official SQL0WARN/ERROR229 and full portal1030/session171/Root1213+18opt-in/types/Expo are also not this review's runs. Historical older counts and failures retain their actual heads.

Not rerun: full portal/session/root suites, root types/test-types/Expo/iOS, canonical reset/pgTAP/RLS/Storage, genuine Auth/Vault/Edge/PostgREST/browser, notification delivery, hosted checks or exact-head CI. Bounded source/application review does not justify recertifying unchanged domains. Genuine care browser and a new independent R7 review remain separate. W2 dependency-rebase UI; reports/conversations/public-private guidance/history/amendment authoring; source lifecycle/consent/templates; commerce/orders/returns/refunds; account/coverage/cancellation/export; delivery/webhook/inbox/retry; all five Maya/private walkthrough stages; complete D01-D48/screens/V01-V17; human/mobile/accessibility/clinical/legal/license/business and release remain open within their owners.

Parent should integrate **only this report commit**, allocate CA1's bounded application correction and a new independent review, preserve all prior objections/raw qualifications, and continue the separately granted genuine-care work. No all-screen/full-goal/release approval follows.

## Evidence integrity

`E/source-audit.json` binds all five originals, nine project/role pins, eight original regression/helper files and reviewed source hashes. Runtime, thread, source/SSR outputs, browser scripts/raw logs/DTO-DOM/PNGs and release are retained. `E/evidence-manifest.json` inventories **47** files, excluding itself and this report; SHA-256 **`dd13edcfa72ef4e8604c48b498b0f6803636ac213c150847e3a99bce734b1eb3`**.

| Artifact | SHA-256 |
| --- | --- |
| source-audit.json | `54d90d129d63fcbdf6fff45d3a49ba36689fb7185f941b7a61a4b54c2694198a` |
| source-independent.test.mjs | `e799cee43e0ffe6689f33083a1fe0908215805ca5b724435fa8a487496ac8b11` |
| browser-independent.test.mjs | `3d66fa04763c753683bb8d6c045b5afeb9610f78c44c1231570e9090ff4c1e25` |
| source.log | `7012ec0af2122d216a9d198f48163a96006d3b75455f9bbd5f1019ef85359e9c` |
| source-independent.log | `8d2437fd665eb256945f94513f94e05e8c51055d6617be2f01b9c845f39140f4` |
| app-browser13.log | `d1a9df472db7aba5e313702501117be2366c9a9aecd0c28f7e68988e18c357ba` |
| browser-independent.log | `d0c39e313f20a2cedb3e2553f3dbf66e694078defa15710ef0aab51af6315891` |
| CA1-repeat.log | `39d4315536ea7305745ac9715a935afe792cacba2ca97f4c32e2a1710b978c22` |
| release.json | `b8048a61ccbdf6c528a538433f6639ce513a4b6d6e1a1605fac28aed286079b4` |
| CA1-409-general.png | `5083d174b7e9bcedf1f5ec126dfcd0332c10e7bfc2d97bdf16f1b1e4b58d058f` |

Final source/hash, report-link, whitespace and sole-tracked-path checks precede commit. Tested runtime/test source remains exact18c; the documentation-only commit hash is returned separately.
