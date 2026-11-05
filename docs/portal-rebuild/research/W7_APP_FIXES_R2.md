# W7 application fixes review, round 2

30 October 2026 America/Chicago, 31 October UTC. Fresh independent review, no production fixes or nested agents.

## Verdict and finding dispositions

**A1: ADDRESSED. A2: ADDRESSED within the original qualified source boundary. A3: ADDRESSED.** The bounded corrections meet their original requirements. **Specification verdict for the exact integrated application: CHANGES REQUIRED. Correctness/quality verdict for the exact integrated application: CHANGES REQUIRED**, due to the separately owned W2/controller composition regression R2-1 below. Do not turn the three corrected findings into an all-green application verdict.

The unchanged selected source suite is **94 pass / 1 fail / 0 skip**, 95 total. The unchanged actual application browser suite is **8 pass / 3 fail / 0 skip**, 11 total. Their failures concern assigned draft opening with the integrated W2 follow-up, not a reproduced A1/A2/A3 failure. Affected retained-session tests are **44/44 pass**. Additional independent source probes are **84/84 assertions pass**, including explicitly labeled historical defect observations, and an independent browser probe is **3/3 assertions pass**, including one current-defect observation. Observation tests are not acceptance passes for the observed defect; counts overlap other coverage and must not be added into a portal acceptance total.

| Original finding | Disposition and independently observed evidence | Qualification |
| --- | --- | --- |
| A1 / P2, W0 preview cursor | **ADDRESSED.** Original inline actual canonical-navigator/cursor probe reproduces Forward0 with canonical600 on original06c5954, then Forward600 on current source. Actual Chrome independently restores product250 and evidence600 with distinct real focus targets through four Back/Forward cycles, two-entry traversal, exact routine-editor/sidebar-opener return, morning re-entry, reload, same-owner/new-CSRF and different-owner replacement. | The unchanged browser suite's ordinary assigned-editor entry is blocked by R2-1. Independent A1 uses a lawful synthetic gate whose final permissions equal bootstrap permissions (`approve:false`), so the current controller can accept its draft. No controller/port/history implementation is replaced. This isolates A1 without claiming the default assigned-editor path passes. |
| A2 / P2, W0 post-transport continuation | **ADDRESSED.** All four original internal `_accept` variants reproduce on original source. Current assigned/unassigned results reject401, old capabilities remain false, old private intent clears, old ports cannot start another request, and fresh lawful ports work. Independent30 post-transport cases also exercise client read/decision, draft, context gate, directory, payment read/v1/v2 confirmation and canonical publication read under same/different owner and abort. | `_accept` is the actual internal transition, directly invoked to control the exact promise boundary. Independently rerun ordinary public `runtime.restore()` sweeps1-24 on original and current source produce **zero post-invalidation permission restorations on both**. Ordinary restore/browser reachability of the original A2 race remains unproven. No server authorization bypass or private-data disclosure is claimed. |
| A3 / P2, coordinator retained callback protocol | **ADDRESSED.** The one actual shared consumer detects all13 recognized keys by presence on either side, scrubs synchronously and rejects empty/partial/duplicate/mixed/error/oversized forms. Original inline partial-fragment probe fails on original and scrubs/rejects on current. Actual startup118 invalid cases pass in the unchanged suite, plus45 independent fresh-document cases with encoded keys, cross-side duplicates, invalid metadata and retained-but-app-unsupported token/implicit forms. | Retained valid PKCE/query token-hash/fragment implicit/access-only semantics and all six existing types pass direct actual-function positives. The new app continues to support PKCE only; it rejects retained token/implicit callbacks before any API request. These are finite synthetic protocol/browser checks, not genuine Auth exchange. |

## Identity, reviewed source and authority

- Workspace `/Users/kanuj/.t3/worktrees/shelv/t3-10611e8d`, branch `t3/w7-app-fixes-review`.
- Exact clean starting and reviewed application HEAD: **`cdc00bd9b5a0a02e897d67885c368bcd3126fc3c`**, matching requested parentcdc00bd. `git status -sb`, `git log -8 --oneline`, `git rev-parse HEAD` and later clean readbacks executed. The eventual report commit is a documentation-only child of this HEAD.
- First live `orchestrator_capabilities({})` **and** `t3_thread_configuration({})` independently verified **codex / gpt-6.1-sol / reasoningEffort=xhigh / serviceTier=default**, full-access/default interaction. Both checked again after browser closure with the same selection. Task suffix `portal-rebuild-w7-app-fix-review-20261030-r2`; `runtime-final.json` retains final structured results. No nested agent or fallback.
- Original application source06c5954, author range `5fe4166..bd2abe2`, initial source reviewd013 integrated566d627 remain the review basis. Complete author fix range **`284c04e94060543106e3a686d4aa7cd61c7bebfb..c4d5737d57789913b7a3abd211aa0f20e742ab71`** was inspected, including all production and test diffs. Shared callbackdb1829a is integrated as **af71ed794fa90ae71e23accb45d5726781da3340**; application0c1a2b0 as **9eeaaf4456de7aab3a2cff6133ba1d71d89796a8**; browser3ff66a7 as **b48f623d64ba784f7df1b397aa6dcfbd78cc8741**; report as **d31a31f42d43ab45a4533ddca3d280d40c32d597**.
- `git diff --quiet c4d5737 HEAD -- apps/portal/src/app apps/portal/site/advisor/api.js apps/portal/tests/rebuild-app* apps/portal/scripts/build-portal-app.mjs` exits0. Those application bytes match the fix delivery. Later advisor controller/fields/tests differ under W2 ownership, including d4ff9bc/ed51a06. W3 token microfix76b1527 is separate ownership. D39 no-service manual-source-deletion clarification changes no reviewed callback/history/port requirement.
- Local `origin/main=d39a7d4943209080df7c4cf97d85784f462758bf`, `HEAD...origin/main=81 0` before this report. No fresh fetch or remote-freshness claim in this exact-parent review. No rebase/reset/checkout mutation or other worktree write.
- Every Node/npm command explicitly selects `/Users/kanuj/.nvm/versions/node/v22.23.0/bin` first in PATH; live Node **v22.23.0**. Existing-lockfile portal install `npm ci --ignore-scripts --no-audit --no-fund`:130 packages, exit0, no tracked package/lock/config change. No root install or dependency upgrade.
- Sole tracked write is **this report**. Diagnostics/builds are ignored under this checkout's `.local-artifacts/portal-rebuild/` and normal ignored runtime candidate/test-build paths. No fixes, push, PR, merge, deployment, live client/source/permission change, external message, funds or order.

Read the full [original application review](W7_APP_SOURCE_REVIEW.md), [W0 composition](W0_APP_COMPOSITION.md), [W0 fixes](W0_APP_FIXES.md), applicable AGENTS, rebuild entry point, D01-D48, full desktop specification, implementation contracts, PLAN_API_V1, ADVISOR_READ_API_V1, workstreams/status and acceptance matrix. Reviewed prior W0/W2/W3 findings and responses to preserve ownership, including W2 F1/F2/F3 and R3-1/R3-2 follow-up, and W3 original findings, conflict/preview, recovery and R4 disposition. Earlier feature/backend/foundation PASS records are attributed evidence, not fresh passes in this review.

Applied Resume, review reception/requesting, systematic debugging and verification guidance; repository `shelv-ux-review`/`shelv-design-polish`; relevant Figma baseline, React, Supabase auth and Cloudflare boundary guidance. The explicit no-nested-agent review brief governs delegation. No design implementation/reacquisition, new business rule, provider/issuer/configuration change or hosted query was necessary or performed.

Inspected all A1-A3 source/test changes and adjacent actual startup, application session, captured-boundary lifecycle, retained cookie classes/factories/bridge/R2 session, strict transport/root mappers, canonical history, preview loading/composition, advisor controller and isolated builder/notices/CSP. No alternate callback parser, permission workaround or modified production input was introduced.

## R2-1 / P2: an assigned draft read invalidates its own new controller lease

**Owner:** W2 controller follow-up, with coordinator/W0 integration verification. **Paths:** [controller.ts](../../../apps/portal/src/features/advisor/controller.ts) `beginRead`107-128, `read`225-231 and `open`483-522; adjacent actual [ports.ts](../../../apps/portal/src/app/ports.ts) `select`235-247 and gate permission application232. **Requirements:** D14-D16 and the real app/controller composition; meaningful loading/recovery and authority fencing.

`beginRead('open')` snapshots `JSON.stringify(permissions)` and requires equality on delivery. The real app's `read_draft_v1` port selects the draft, resets bootstrap authority and awaits the authoritative assigned gate before returning the draft. A lawful current gate can change the same shared permission object, for example `approve:false` to `approve:true`. The controller then treats its own read as obsolete, discards the valid draft and never clears its `busy:true`. No competing read, owner change, cancellation, transport error or malicious result is required.

**Fresh actual browser reproduction at reviewed HEAD:**

1. Use the unchanged application fixture and enter `/advisor/plans/10000000-0000-4000-8000-000000000001/routine` with its ready assigned draft. Cookie bootstrap is current human view/edit/publish/payment; app bootstrap approval is false. The valid target-bound gate returns fixture approval capability true.
2. Actual requests finish: session, read_draft_v1, advisor_list, read_advisor_gate_v1, advisor_list. The page remains **loading private draft**, with **retry draft**. The routine heading/editor never appears in the initial journey.
3. The unchanged95 suite fails its actual-controller-plus-port reverse A/B case at `rebuild-app-ports.test.mjs:487`, `Cannot read properties of null (reading 'draft')`. The unchanged11 browser suite fails initial editor/preview opening in cases3/4 and cannot find publication checks in case5. These are genuine intended-behavior test failures, not counts reclassified as passing.
4. An independent pure real-cookie/factory/transport/root-mapper/controller probe, without A/B overlap, obtains `{view:null,busy:true,notice:null,approve:true}`. The same actual current ports with an input-only bundled **284c04e original controller** obtain `{view:ids.draft,busy:false,notice:null,approve:true}`. No current file is overwritten. A deliberate second `controller.open(ids.draft)` on current source succeeds once the final permission snapshot is already equal, confirming bounded retry recovery and the equality trigger. This is not an unrecoverable loss of content or permanent denial.
5. A lawful gate with `approve:false` and final permissions matching bootstrap also opens immediately. The independent A1 browser uses that explicit fixture precondition to exercise navigation without altering implementation or waiving this default assigned-flow failure.

Artifact `assigned-editor-blocked.png` was directly inspected: actual loading state/retry control, no draft form. Pure `ASSIGNED OPEN`/`ASSIGNED RETRY` output is retained in `independent-source.log`. Browser request sequence and screenshot are in `browser-independent.log` and the evidence directory below.

Minimal independent source reproduction, from repo root with the same Node22 stdin command as the original probes:

```js
import {createApplicationSession} from './apps/portal/src/app/session.ts';
import {createAdvisorPorts} from './apps/portal/src/app/ports.ts';
import {createAdvisorController} from './apps/portal/src/features/advisor/controller.ts';
import {draftView,ids} from './apps/portal/tests/rebuild/advisor-fixture.mjs';
const view=draftView(true);
const runtime=createApplicationSession({audience:'advisor',
  locks:{request:async(_,o,run)=>run(o.signal)},
  fetcher:async(url,options)=>{
    if(url==='/api/advisor/session')return Response.json({signedIn:true,
      ownerId:ids.actor,generation:1,csrf:'SYNTHETIC',
      capabilities:{view:true,edit:true,publish:true,confirmPayments:true},
      idleExpiresAt:'2099-01-01T00:00:00Z',absoluteExpiresAt:'2099-01-02T00:00:00Z'});
    if(url!=='/api/advisor/plans')throw Error('unexpected network');
    const c=JSON.parse(options.body);
    if(c.action==='read_draft_v1')return Response.json(view);
    if(c.action!=='read_advisor_gate_v1')throw Error('unexpected action');
    return Response.json({schemaVersion:1,clientId:ids.client,target:c.target,
      publisher:c.publisher,approval:null,publication:'first',coverage:'inactive',
      capabilities:{actorId:ids.actor,view:true,edit:true,assign:true,review:true,
        approve:true,publish:true,confirmPayments:true},
      policy:{revision:1,ownerActorId:ids.actor,requireKanujApproval:true}});
  }});
let adapter,controller;
try {
  await runtime.restore();adapter=createAdvisorPorts(runtime);
  controller=createAdvisorController({session:runtime.getSnapshot().boundary,
    permissions:adapter.permissions,ports:adapter.ports});
  await controller.open(ids.draft);
  const first=controller.getSnapshot();
  console.log({view:first.view,busy:first.busy,notice:first.notice});
  // Current: {view:null,busy:true,notice:null}; intended initial open has view.
  await controller.open(ids.draft);
  console.log({retryDraft:controller.getSnapshot().view?.draft.id,
    busy:controller.getSnapshot().busy}); // retry recovers in this stable case
} finally {controller?.dispose();adapter?.dispose();runtime.dispose();}
```

**Smallest correction to evaluate:** reconcile the controller's read-applicability contract with target-bound permission updates produced by that same current operation. Distinguish an external/superseding authority change from the operation's own authoritative gate transition; retain captured session, purpose, target, view, manual/pending and operation-generation fences. Ensure an obsolete open cannot strand its own busy state. Do not simply remove all capability checks, return obsolete private values or suppress the new application boundary checks. Test default assigned initial open, changed-capability gate refresh, restrictive/current failures and reverse A/B delivery through **actual app ports**, in addition to W2's fixed-permission feature fixture.

| Priority | Persona and goal | Exact observed issue | Why confusing | Bounded correction/regression | Evidence level |
| --- | --- | --- | --- | --- | --- |
| P2 R2-1 | advisor opening assigned work | successful current read/gate ends in loading with no editor | ordinary first entry looks unfinished despite completed requests; deliberate retry is needed | operation-aware capability applicability and owned cleanup, actual cookie-port integration positives/negatives | unchanged suite failure, independent actual browser, actual source execution, historical input-only sensitivity |

This is separate from W2's prior stale generic-read errors/full-text keyboard findings and from A2's post-invalidation mutation. It does not demonstrate server authorization/payment/publication bypass or private-data leakage. No production fix or W2 acceptance is authored here.

## A1 implementation and independent context evidence

The cursor no longer stores `Entry.context`, captures scroll/focus or schedules native-traversal restoration. The canonical navigator alone owns those contexts. The only cursor restoration is its no-history local parent fallback, guarded by cursor version/current boundary/listeners/route; it does not compete with a native traversal. Internal product/evidence selection remains session-memory-only, indexed by opaque canonical entry markers.

Independent Chrome used actual current app modules and the actual canonical navigator/cursor. After creating lawful stable gate permissions, it set a test-only long synthetic viewport, not page/design source. It recorded routine125/focus `plan-product-cerave-pm`, product250/focus the actual **back to plan** button, and evidence600/focus `portal-content`. Product's real button has an empty DOM id, so assertions additionally require its exact button text; empty id alone is not treated as sufficient focus evidence. Four repeated Back/Forward pairs retained250/600 and the two distinct real targets. `history.go(-2)` restored routine125/opener, `history.go(2)` restored evidence600. Exit reached the exact original `/routine` editor and `advisor-preview-open-plan`, not a heading fallback.

Re-entry resets morning, direct reload rereads the actual draft/preview/draft and starts morning. Actual public session restore after same-owner/new-CSRF and then different-owner replacement changes the opaque scope, removes the product sheet and resets morning; the post-replacement exit uses `/sources` fallback. No client-decision business write occurs. History/URL checks exclude product IDs/internal product-evidence route/private content. The canonical pure test also exercises frame cancellation/session replacement and restoration ownership release. The original inline reproduction below remains durable and sensitive.

## A2 post-await, scope, abort and recovery evidence

The fix retires selection generation and selected target on transport invalidation. Captured creation-boundary and request-abort checks run after async transport continuation and before selection/reset, gate/capability application or private return. Client reads/decisions, directory, payment and publication wrappers receive the same post-await check. Existing retained transport/factory fences remain unchanged. Assigned selection catches safe non401 gate failures as before, while the final current/abort check still rejects an aborted request before returning a private value. Aborted writes retain503/uncertain semantics.

Independent source84 comprises40 held actual-cookie/factory cases (two audiences, success/503, owner/CSRF/local-generation/epoch/role/audience/expiry/abort/offline/logout),30 post-transport cases across ten real ports and three events, six retained callback type-positive groups, one assigned-open sensitivity observation, four historical A2 observations, two ordinary restore sweeps and one reverse-A/B/manual-work group. No session.isCurrent, operation implementation, mapper or controller is replaced by a successful stub. Only finite fetch DTO/error/delay inputs and explicitly labeled internal transition controls are supplied.

All four historical A2 cases match the original finding: unassigned same/different-owner calls fulfill and restore view/edit/publish; assigned calls reject401 but restore view/publish. Current cases reject401 before those mutations and subsequent old calls make no request; fresh ports work. Abort checks preserve pre-request permission snapshots and reject503. Actual target/publisher/root mapping remains active. Reverse raw A/B cannot replace B's selection/capabilities; wrong-target context rejects409. Actual unassigned-controller save503 retains the exact UUID/payload, keeps the unexpired manual boundary current and permits new manual text without falsely saving it.

**Qualification retained and independently refreshed:** ordinary public restore offsets1-24 yielded original24 fulfill/current23 fulfill1 reject, with zero post-invalidation permission restorations after all actual restore/operation continuations settled. An already fulfilled promise may be consumed after a later invalidation; that is not a post-invalidation continuation mutation. This nonreproduction does not prove the internal transition is unreachable, and it does not prove ordinary browser reachability. No fence is weakened based on it.

Synthetic role/audience/generation/epoch mutation cases are artificial negative controls. A bare `_epoch++` without the real corresponding generation transition invalidates the app boundary and rejects the private result, but does not trigger the unchanged transport's generation/owner listener or clear its separately seeded raw transport map. The probe records that distinction; no real lifecycle case is claimed from this mutation. Pre-suspending an in-flight response causes the actual factory to reject401 even for an eventual503; it does not accept an offline success. A genuine current unexpired503 at the ordinary save boundary remains uncertain and preserves manual state. Expired offline state ends through actual cookie lifecycle in the checked-in cases.

## A3 protocol, startup and retained compatibility

Only the allocated retained `site/advisor/api.js::consumeCallback` changes shared auth behavior. It uses existing return/route/preview grammars, retains exported names and return fields/kinds, and introduces no second parser, issuer setting or provider change. Detection uses key presence across query and fragment, including empty strings and duplicates. Scrub happens before validation returns anything; invalid callbacks contain only null credential fields and explicit `error:true`. Unknown or invalid leftover navigation is removed/rejected. Recognized provider metadata is discarded rather than returned/persisted.

The unchanged source tests execute104 real startup invalid cases, with scrub-before-mount and no lock coordination, fetch or unhandled rejection. Actual retained client/advisor bridges and R2 PortalSession reject malformed callbacks before restore/complete/SDK exchange; their existing compatibility and44 affected session cases pass. Direct independent positives cover PKCE, token-hash and fragment implicit/access-only under all six existing types (`email`, `signup`, `invite`, `magiclink`, `recovery`, `email_change`). Provider metadata compatibility does not persist the provider token fields. The app's normal PKCE positive completes once and removes its synthetic code; no genuine provider exchange is claimed.

Actual browser118 checked-in cases and45 independent fresh documents cover all13 keys, both locations, empty/partial, same-side/across-side duplicates, encoded key spellings, mixed/error/long and public/unknown paths. New app token-hash/implicit forms deliberately reject as unsupported even when the shared retained consumer accepts their existing kind. No API request occurs in the independent45. URL/history/body/localStorage/sessionStorage checks contain no callback canary; final independent console checks contain no canary and no error/warning; all contexts have zero page errors and unexpected traffic. One known React DevTools **info** message per fresh development document remains, so a literal all-console-messages-zero claim is not made.

## Mandatory original inline reproductions and source qualification

The following three original bodies are carried forward from the full source review. Run from the repo root with the explicit Node22 PATH and `node --experimental-strip-types --input-type=module` on stdin. They are pure object/source execution, not DOM/browser or genuine Auth. This round also executed each against input-only esbuild bundles: original06c5954 input for the one affected module versus current input, resolving every other dependency from this checkout. That mechanism never rewrites current production files. `inline-repros.mjs` and emitted inputs/log remain ignored and inspectable.

A1 expected observation: original Back250, Forward0/canonical600; current Back250, Forward600/canonical600. The original inline body asserts scroll only; actual distinct-focus/multiple-depth Chrome evidence is separately described above.

```js
import {createPortalNavigator} from './apps/portal/src/navigation/history.ts';
import {createBrowserPreviewNavigation} from './apps/portal/src/app/preview-navigation.ts';
const entries=[{url:'/advisor/plans/draft/routine',state:null}],events=new Map();
let index=0;
const fire=n=>events.get(n)?.forEach(f=>f());
const setUrl=u=>{
  const x=new URL(u,'https://portal.invalid');
  w.location.pathname=x.pathname; w.location.search=x.search;
};
const w={
  location:{pathname:entries[0].url,search:''},
  document:{activeElement:{id:'opener'},getElementById(){return null;},querySelector(){return null;}},
  scrollY:100, scrollTo({top}){this.scrollY=top;},
  requestAnimationFrame(f){queueMicrotask(f);},
  addEventListener(n,f){if(!events.has(n))events.set(n,new Set());events.get(n).add(f);},
  removeEventListener(n,f){events.get(n)?.delete(f);},
  history:{scrollRestoration:'auto',get state(){return entries[index].state;},
    replaceState(s,_,u){entries[index]={state:s,url:u};setUrl(u);},
    pushState(s,_,u){entries.splice(++index);entries[index]={state:s,url:u};setUrl(u);},
    back(){this.go(-1);},
    go(d){index+=d;setUrl(entries[index].url);fire('popstate');}}
};
const settle=()=>new Promise(r=>setImmediate(r));
const outer=createPortalNavigator(w,{scopeKey:'session'}),stop=outer.subscribe(()=>{});
outer.navigate({name:'advisor-preview',draftId:'draft'}); await settle();
const cursor=createBrowserPreviewNavigation(w,outer,'draft'),unsub=cursor.subscribe(()=>{});
cursor.navigate({name:'product',productId:'cerave',routine:'evening'}); await settle();
w.scrollY=250;fire('scroll');
cursor.navigate({name:'product-evidence',productId:'cerave',routine:'evening'}); await settle();
w.scrollY=600;fire('scroll');
w.history.back();await settle();console.log('back',cursor.getSnapshot(),w.scrollY);
w.history.go(1);await settle();
console.log('forward',cursor.getSnapshot(),w.scrollY,w.history.state.shelvNavigation.restore.scrollY);
unsub();stop();cursor.dispose();outer.dispose();
```

A2 expected observation: original `invalidated false; after false true`. Current reaches `invalidated false`, then rejects401 from the captured post-await boundary. The unchanged original body has no catch, so its current standalone process exits1 with the expected `TransportError(401)`; that exit is an observed correction, not a falsely claimed passing test. Current intended-behavior checked-in and independent cases catch/assert the401 and require all permissions false. This exact microtask12 `_accept` diagnosis retains all ordinary-restore/browser/server qualifications stated above.

```js
import {createApplicationSession} from './apps/portal/src/app/session.ts';
import {createAdvisorPorts} from './apps/portal/src/app/ports.ts';
import {draftView,ids} from './apps/portal/tests/rebuild/advisor-fixture.mjs';
const dto=csrf=>({signedIn:true,ownerId:ids.actor,generation:1,
  capabilities:{view:true,edit:true,publish:true,confirmPayments:true},csrf,
  idleExpiresAt:'2099-01-01T00:00:00Z',absoluteExpiresAt:'2099-01-02T00:00:00Z'});
let runtime,step=0,adapter;
runtime=createApplicationSession({audience:'advisor',
  locks:{request:async(_,o,run)=>run(o.signal)},
  fetcher:async url=>{
    if(url==='/api/advisor/session')return Response.json(dto('old'));
    if(url!=='/api/advisor/plans')throw Error('unexpected network');
    const tick=()=>{
      if(++step===12){runtime.cookie._accept(dto('new'));console.log('invalidated',adapter.permissions.edit);}
      else queueMicrotask(tick);
    };
    queueMicrotask(tick);return Response.json(draftView(false));
  }});
try{
  await runtime.restore();const old=runtime.getSnapshot().boundary;
  adapter=createAdvisorPorts(runtime);
  await adapter.ports.plans.execute({schemaVersion:1,action:'read_draft_v1',draftId:ids.draft});
  console.log('after',old.isCurrent(),adapter.permissions.edit);
  // Observed: invalidated false; after false true.
}finally{adapter?.dispose();runtime.dispose();}
```

A3 expected observation: original four fragment-only credentials leave URL unchanged, no replacements and `error:false`; current replaces each with `/plan` and returns `error:true`, kind/code null. This body uses synthetic strings only and sends no request.

```js
import {prepareApplication} from './apps/portal/src/app/bootstrap.ts';
for(const fragment of ['provider_token','provider_refresh_token','code','token_hash']){
  const location={href:'https://portal.invalid/plan#'+fragment+'=SYNTHETIC'},events=[];
  const prepared=prepareApplication(location,{replaceState(_,__,p){
    events.push(p);location.href='https://portal.invalid'+p;
  }});
  console.log(fragment,location.href,events,prepared.callback,prepared.audience);
}
```

## Candidate, assets, notices and CSP

Fresh `npm run build:application` succeeds at clean reviewed cdc00bd with `sourceDirty:false`, `gatewayIncluded:false`. Output is only this checkout's ignored application candidate. No gateway, deployment/cutover/release configuration or live service is packaged.

Independent output inspection verifies **2,197** manifest inputs, **17** copied public/approved assets, **47** packages contributing positive emitted bytes, **47** original copied legal files and **8** emitted local font files. Every input and each asset's original/output bytes/size/hash match; the selected package inputs equal the positive-byte metafile selection; every emitted notice equals its original retained source/hash. No private walkthrough/source document or baseline screenshot is copied. Product identity is not guessed from a filename.

The HTML retains same-origin connect/script/font policies, self/data images, no-referrer/noindex and no external Figma/font/CDN URL. Positive emitted inputs contain no Supabase browser SDK, Vault implementation or server AI workflow. New app code stores no provider token or sensitive draft in browser durable storage; retained nonsensitive logout markers remain distinct. CSP-blocked original-origin imagery still uses the existing neutral fallback; this gateway-free candidate is not proof of same-origin deployed asset delivery.

`application-provenance.json` SHA-256 **f4c51c80f630a74812c57ed54a42c9dfcec6836e0c81e3e20ca0d8a5fedb8bee**. The retained `react-remove-scroll-bar@2.3.8` notice exception/hash `a79aae0c0f21990d9d963bb3c5a79cdcea9a46f8523ba55c58d7fe776b6ebc84` remains explicitly an upstream original acquisition, not a version-specific acquisition. No legal clearance/reacquisition or release certification is claimed.

Directly inspected the fresh blocked-editor and current unpublished CeraVe evidence images. Shared cream/forest tokens, wrapper/navigation/copy identity and product-specific evidence remain present; no visual redesign is part of these fixes. This is bounded synthetic state inspection, not fresh native Figma acquisition, exact frame/pixel match, complete visual/accessibility or human-comprehension acceptance.

## Exact fresh commands and results

All Node/npm commands use `PATH="/Users/kanuj/.nvm/versions/node/v22.23.0/bin:$PATH"`. Portal cwd unless labeled root. All tests use concurrency1, with one Chrome process at a time only while allocated.

```sh
npm ci --ignore-scripts --no-audit --no-fund
node --experimental-strip-types --test --test-concurrency=1 \
  tests/rebuild-app-ports.test.mjs tests/rebuild-app-session.test.mjs \
  tests/rebuild-app-state.test.mjs tests/rebuild-app-render.test.mjs \
  tests/rebuild-app-build.test.mjs tests/rebuild-foundation-transport.test.mjs \
  tests/rebuild-foundation-navigation.test.mjs tests/rebuild-foundation-notices.test.mjs \
  tests/rebuild-advisor-controller.test.mjs tests/rebuild-app-callback.test.mjs \
  tests/rebuild-app-continuation.test.mjs tests/rebuild-app-preview-context.test.mjs \
  tests/rebuild-app-start.test.mjs
node --experimental-strip-types --test --test-concurrency=1 tests/rebuild-app-browser.test.mjs
npm run typecheck:rebuild
npm run typecheck:session
npm run check:ui
npm run build:application
# repo root:
node --experimental-strip-types --test --test-concurrency=1 \
  .local-artifacts/portal-rebuild/w7-app-r2/independent-source.mjs
node --experimental-strip-types --test --test-concurrency=1 \
  .local-artifacts/portal-rebuild/w7-app-r2/browser-independent.mjs
node .local-artifacts/portal-rebuild/w7-app-r2/inline-repros.mjs
```

| Check | Fresh result and scope |
| --- | --- |
| Exact source command above | **94 pass / 1 fail / 0 skip**,95 total,3.375s. Failure actual W2 controller+app ports, described R2-1. No test filtered or rewritten. |
| Exact application browser file above | **8 pass / 3 fail / 0 skip**,11 total,36.392s. Cases3/4/5 block at assigned editor opening. Other eight include118 invalid startups, PKCE/client effects, reload/responsive recovery and logout; not genuine Auth/database. |
| Affected retained-session group | **44 pass / 0 fail / 0 skip**,0.606s. Existing six runtime files `auth-flow`, `adapter`, `client-adapter`, `client-transport`, `navigation-return`, `advisor-logout`. Current retained site copied to the normal ignored candidate directory, bundled with portal esbuild `bundle:true,platform:'node',format:'esm',packages:'external'`, original runtime tsconfig, outdir `runtime/.test-build/w7-app-r2`; run actual Node `--test --test-concurrency=1` on all six emitted files. No browser/infra file included. |
| Independent source final | **84/84 assertions pass**,0 fail/skip,0.244s;40 held,30 post-await,6 compatibility,1 current-open observation,4 historical observations,2 ordinary sweeps,1 reverse/manual group. Defect observations do not accept the defect. |
| Independent actual browser final | **3/3 assertions pass**,0 fail/skip,8.418s. One current-loading observation, one isolated real A1 lifecycle journey,45 additional callback documents. Strict finite `.invalid` APIs/local assets, service workers/background network blocked. |
| Original inline bodies, original/current | Six source executions recorded. Expected current A2 uncaught401 exit1; other five exit0. Historical A1/A2/A3 signatures and corrected signatures match above. |
| Frontend/session strict types | Both exit0, zero diagnostics; original strict/noUncheckedIndexedAccess flags. |
| UI guard / application build | Both exit0; UI guard11 retained stylesheets; builder independently checks source CSS. Output/hash/closure inspection described above. |
| Diff/links/scope | Report-only tracked scope, relative report links and `git diff --check` checked before commit; no production edits or temporary artifacts enter commit. |

Harness setup/interpretation corrections are preserved, not product passes: initial source-log path creation failed before tests and was corrected to root ignored artifacts; the first independent-browser import needed the installed portal Playwright path. The first completed independent browser run failed teardown because it required absolutely zero console messages, including the unchanged React DevTools info message; its sample draft also retained original remote images, causing real CSP console errors while network remained denied. The final fixture uses the already-supported exact local asset references from the same canonical synthetic content, asserts zero error/warning/page/unexpected-network messages, and records the info exception rather than changing CSP or application bytes. The first independent source run had six mistaken expectations: four demanded raw transport-memory clearing for bare synthetic epoch-only changes, and two expected503 after pre-suspending an in-flight request where the actual factory correctly returns401. Corrected expected lifecycle boundaries are explicit above; initial logs remain. The unchanged95/11 product failures remain failing and unmodified.

## Resource release, evidence and excluded acceptance

Called `preview_status` first: unavailable/no tab. `preview_open` created one owned blank incognito preview, then it was closed through normal tab lifecycle before the explicitly authorized repository serial Chrome harness. No external browser request was made. All Chrome contexts/processes close in `finally`/`after`; all shell test handles are terminal. After the final browser run, fresh `preview_status` returns no tab. Executable-name process readback finds **automationChromeProcesses:[]**. **Chrome was explicitly released in commentary at `2026-10-31T02:56:42.943616+00:00`, before report completion, for the waiting advisor reviewer. No browser/DOM calls follow release.** Local PNG inspection afterward uses file viewing only. Early process filters matched their own shell text/unrelated Electron crash handlers; the corrected executable inventory excludes both and touches no unrelated process.

Ignored evidence root: `/Users/kanuj/.t3/worktrees/shelv/t3-10611e8d/.local-artifacts/portal-rebuild/w7-app-r2/`. Retains exact scripts, historical input-only bundles, complete initial/final logs, current screenshots, checks/runtime/output/release receipts and SHA-256 inventory. No HTTP server, PG/Docker/Auth fixture or credential is handed off.

| Evidence | SHA-256 |
| --- | --- |
| `source95.log` | `15c86b15da1f5ae7d29bb6493052406b7813a5a1a935cb864afd846dbaab8963` |
| `browser11.log` | `648a2056958acc21b8cf91d0b2486ca7880b2c724d27d91d6776fd8b4feae05a` |
| `retained44.log` | `7c4f195710cc18ccdb9a97c7ad83060028f0ac61e2ce2c596672632ce1fbcf7c` |
| `independent-source.mjs` | `b562615503d53000a9c7df86f4a4090a27b6b52d48726eb4a5eebef62ea95835` |
| `independent-source.log` | `dcbf0322c700cb267d34b6707d8b67126f701d688b17f0decbf2e138d9b67ba1` |
| `browser-independent.mjs` | `b80b155f6a2c2ff57ee4b384691f5f260aa7cb97f5b0631ba65f7283589f210d` |
| `browser-independent.log` | `9fcc5fbc4c5316fd374eb82c452653ed967c6c7a5f8742ed10a3939d47ae7eeb` |
| `inline-repros.log` | `a22c1c02971bb2a300d6b8b77fc105448f0d0b9ba30788b3ec808f6a5e9157e5` |
| `checks.json` | `f9772a9906132c7e42f15e1e7ed3f706a8bab17033b26b0a2fa55201d60cee09` |
| `output-inspection.json` | `09552cec72d036a92871bdfd334f90b9fb21d551388366879a59b399220653a5` |
| `release.json` | `7149260c40a880868718b8fe8374428e128a76e5064ca4dffe6b3e3cf65ae57f` |
| `runtime-final.json` | `bdac5d011d44aa77830f3be23d360df76b9ba38eca3d22844fd22a46330ee267` |

The parent's genuine local Auth/native Edge/PostgREST11, canonical55 migrations/33 pgTAP groups/746 assertions and separate root1,195 pass/18 opt-in skips are **not rerun here**, not this report's acceptance, and not genuine cookie/Vault/browser proof. Their preserved provenance remains separate. No PG/Docker/Auth/provider credential/hosted/parent fixture was read, started, reset or adopted. No fake JWT is used as genuine Auth evidence.

Not run/accepted: full portal or broader163 runtime suite, root application/test suite/types, Expo web/iOS/native export, database reset/pgTAP/RLS/Storage, genuine cookie/Vault/Auth/Edge/PostgREST browser chain, hosted/deployed routes/assets, actual receipt/funds/publication/notifications/delivery, source permissions/uploads/retention lifecycle, remaining full pages/five-stage Maya/private sharing, exact-head CI, exhaustive visual/zoom/reduced-motion/screen-reader or representative-human comprehension. The user explicitly excluded heavy/hosted fixtures and authorized this bounded source/browser review. No full portal, clinical, legal, security or release certification follows.

Parent continuation: preserve A1-A3's qualified dispositions; route R2-1 to W2/coordinator, reconcile against the separate advisor review, and rerun the unchanged actual app95/11 plus the default changing-capability integration path after the owned correction. Do not solve it by weakening A2/transport/session fences or silently relabeling the currently failing tests. Canonical status/CONTEXT_SYNC and integration remain parent-owned.
