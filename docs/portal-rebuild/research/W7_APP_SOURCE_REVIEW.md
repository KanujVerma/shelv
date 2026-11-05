# W7 first application source review

30 October 2026. Independent application reviewer. No implementation fixes or nested agents. This round used source, pure execution, SSR, strict types and the isolated application build only. No browser or DOM runtime was launched, inspected or awaited.

## Scoped verdict

**Specification: CHANGES REQUIRED for the first application composition. Quality/correctness: CHANGES REQUIRED.** Three P2 findings below concern the new preview cursor, a post-transport advisor-port continuation and the retained callback protocol consumed by the new startup. The latter is a coordinator-owned retained protocol gap, not newly authored auth code. No server authorization bypass, real private-data disclosure or payment/publication transaction failure was demonstrated.

The selected checked-in source/pure/SSR/build suite passes **79/79**, zero failures/skips. Additional independent probes pass **40** late-success/error negatives, **3** startup lifecycle cases and **8** validation/SSR checks. These counts have different scopes and are not a full portal total. Diagnostic observations reproducing the findings are not passing acceptance tests. Browser, genuine cookie/Vault/Auth/Edge/database acceptance and feature/backend re-reviews remain separate gates.

## Identity, requirements and write boundary

- Workspace: `/Users/kanuj/.t3/worktrees/shelv/t3-70d27568`; branch `t3/w7-app-source-review`.
- Exact clean starting and reviewed source HEAD: **`06c5954782977edf8110943b2708cf51ce211661`**, matching the requested parent. `git status -sb`, `git log -5 --oneline` and `git rev-parse HEAD` were run before review. No reset, rebase or other checkout mutation.
- Live `orchestrator_capabilities({})` and `t3_thread_configuration({})`, both checked before source work, independently returned provider **`codex`**, model **`gpt-6.1-sol`**, **`reasoningEffort=xhigh`**, **`serviceTier=default`**, runtime `full-access`, interaction `default`. Delegated thread suffix: `portal-rebuild-w7-app-source-review-20261030-r1`.
- Original W0 author range: `5fe41666747fe918eccee46c68f29d1968495562..bd2abe291dc0e7973887c72d52ecf6c2cd854d93`. Early seam `2938df1` is composed as `9b2bbaa`; implementation `ee78d27` as `7c90818`; builder `7da3055` as `ce448f9`; tests `07dafec` as `3fbb9ed`; report as `61e31b1`. The parent already owns `381ba70`/`db27dea`, equivalent to author `45ae22b`/`9167e8e`; they are not new W0 changes.
- `git diff --quiet bd2abe2 HEAD --` all `src/app/**`, `src/main.tsx`, the application builder, all six application test files and `tests/rebuild/app-ssr-entry.tsx` exits 0. This is the actual composed application source. Parent package change adds only `build:application`. W2 `56bdb4d84ff365922987b1cd860fa28984eded02` and W3 `76b1527f37bbedcf69d82ee41065684d265008ca` are present in this head. Feature/backend review ownership stays separate.
- Local `origin/main` resolves to `d39a7d4943209080df7c4cf97d85784f462758bf`. No fresh fetch was performed in this bounded pass; no remote freshness claim.
- Every Node/npm command selected `PATH="/Users/kanuj/.nvm/versions/node/v22.23.0/bin:$PATH"`; live Node was `v22.23.0`. Portal dependencies only were installed using the checked-in lockfile, `npm ci --ignore-scripts --no-audit --no-fund`, 130 packages. No root dependencies or package/lock/configuration changes.
- Sole tracked write: this file, `docs/portal-rebuild/research/W7_APP_SOURCE_REVIEW.md`. Build/test-generated files remain ignored under this checkout's `.local-artifacts/portal-rebuild/`. No production fix, status/CONTEXT_SYNC edit, push, PR, merge or deployment.

Read the complete [W0 application report](W0_APP_COMPOSITION.md), applicable root/portal AGENTS, rebuild entry point, D01-D48, full desktop specification, implementation contracts, PLAN_API_V1, ADVISOR_READ_API_V1, workstreams/status and acceptance inventory. Reconciled the original W0/W2/W3 findings and responses, including foundation R2, W2_FIXES, W3_FIXES, client R2/R3, W3_CONFLICT_PREVIEW and W3_RECOVERY_FIX. Older status allocations are not substituted for the inspected Git head.

Applied Resume, review reception/requesting and verification guidance, repository `shelv-ux-review` and `shelv-design-polish`, relevant Figma design-to-code baseline guidance, React review and Cloudflare/Supabase boundary guidance. The explicit no-nested-agent/source-only brief governs this already-delegated review. No fresh Figma acquisition or browser visual match is claimed; the approved baseline is fixed.

Inspected every new application source file, the minimal main entry change, the application builder/template, all six application tests and SSR entry. Read the browser test file as source without executing it. Adjacent inspection covered retained callback/cookie classes and factories, unchanged session transport, canonical navigation/history, W2 controller/preview interfaces, W3 unpublished adapter/shared renderer, root request/response/URL validation, directory/payment mappers, finite gateway/provider/Vault routes and existing runtime harnesses.

## A1 / P2: preview native Forward overwrites retained scroll with stale cursor context

**Owner:** W0/coordinator application composition. **Source:** `apps/portal/src/app/preview-navigation.ts:44-67`, subscription at 88-99; adjacent canonical navigator `apps/portal/src/navigation/history.ts:40-70`. **Requirements:** D10 and exact preview Back/Forward/scroll recovery.

The enclosing navigator already captures outgoing scroll/focus on native traversal. The preview cursor keeps a second `Entry.context`, but captures it only on its own `navigate()`/`back()` calls. Native `popstate` switches entries without capturing the outgoing cursor. Its later animation-frame restoration then overrides the canonical navigator's correct context with the stale cursor value.

**Fresh pure reproduction:** actual `createPortalNavigator` plus actual `createBrowserPreviewNavigation`, a plain-object Window/history/event model, queued animation frames, no DOM/browser implementation. Start from editor `/routine`, enter preview, navigate to evening product, set scroll 250 and emit scroll, navigate to evidence, set scroll 600 and emit scroll, then native history Back/Forward. Observed:

```text
Back:    product / cerave / evening, scrollY=250
Forward: product-evidence / cerave / evening, scrollY=0
Forward canonical history marker: restore.scrollY=600
```

The route remains correct and no product identifier enters history. The defect is competing restoration ownership, not the older foundation history defect. Focus uses the same stale context path, but this probe asserts scroll only. Actual browser timing, nonzero integrated scrolling and focus remain pending.

**Smallest correction to evaluate:** preserve outgoing cursor context for native traversal, or consume the canonical navigator's context rather than overwriting it with a second stale copy. Preserve opaque markers, session-memory-only product routes, exact editor exit and re-entry reset. Add nonzero scroll and distinct focus on both entries, repeated native Back/Forward and session replacement. The current pure test checks route/exit/opener marker, not nonzero Forward scroll; the application browser test also omits it.

Reproduction body, from repo root under the Node PATH above:

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

Execute that body with `node --experimental-strip-types --input-type=module` on stdin. It does not instantiate a DOM or contact a network.

## A2 / P2: a post-transport draft continuation restores old adapter permissions after invalidation

**Owner:** W0 application ports. **Source:** `apps/portal/src/app/ports.ts:187-197`, `:224-249`. **Requirements:** captured owner/login applicability before permission mutation; no stale port side effects after relogin.

The unchanged transport correctly fences the fetched value before decoding. The async application `plans.execute()` adds another continuation after that fence. Invalidation increments `gateSequence` and clears permissions, but does not retire `selectionSequence`. After `await plan(...)`, the continuation checks only selection order. `select()` changes `selected` and calls `reset()` against the *new* cookie tuple before any new `current()` check. An unassigned result has no subsequent `gate()` call at all. An assigned result eventually throws 401 from `gate()`, after view/publish permission mutation already occurred.

**Fresh reproduced boundary:** real application session, actual advisor cookie/factory/transport/root mapper, finite synthetic Response.json fetcher. Schedule the actual cookie `_accept` transition at the promise boundary following transport decode. No operation, mapper or controller implementation is replaced. A microtask-offset sweep 1-23 identified offset 12; a separate four-variant run reproduced:

| Old result | New accepted login | Immediately after invalidation | After old continuation |
| --- | --- | --- | --- |
| unassigned draft | same owner, changed CSRF | view/edit/publish false | old port fulfills; view/edit/publish true |
| unassigned draft | different owner, changed CSRF | view/edit/publish false | old port fulfills; view/edit/publish true |
| assigned draft | same owner, changed CSRF | view/edit/publish false | old port rejects 401; view/publish true, edit false |
| assigned draft | different owner, changed CSRF | view/edit/publish false | old port rejects 401; view/publish true, edit false |

The old boundary is false in all four. A subsequent operation on the old port still rejects before network, so the author's old-port-start fix remains intact. This is a narrower **post-fence raw-port mutation**, not the old reverse A/B read issue. The actual W2 controller has its own session invalidation and does not become accepted merely because this raw port returns. No mounted-controller/server bypass is claimed.

Evidence limit: `_accept` is the real internal acceptance transition used by retained restore/complete, invoked directly here to control the exact interleaving. A separate 1-24 sweep initiating public `runtime.restore()` from the fetch boundary did **not** reproduce this permission restoration. Thus the internal-event race is reproduced, while ordinary restore/browser reachability remains unproven. The source still lacks the required application applicability fence before mutation; do not promote this probe into a genuine Auth/browser claim.

**Smallest correction to evaluate:** recheck the captured boundary, request abort and selection applicability immediately after the await and before `select`/`reset`; retire selection continuations on invalidation. Keep selection-start ordering and preserve manual permissions on uncertain saves. Gate checks after mutation do not satisfy this requirement.

Minimal reproduction body for `node --experimental-strip-types --input-type=module` on stdin:

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

## A3 / P2: partial credential fragments escape the retained startup scrubber

**Owner:** coordinator retained auth protocol. **Source:** `apps/portal/site/advisor/api.js:52-68`, consumed by `apps/portal/src/app/bootstrap.ts:20-39` and `start.tsx:13-28`. **Requirements:** synchronous credential removal before routing/auth/render; malformed callback recovery.

`consumeCallback` notices all listed secret keys in the query, but in the fragment it only reads access_token, refresh_token and error. A partial/malformed fragment containing only provider_token, provider_refresh_token, code or token_hash does not trigger `replaceState`. `prepareApplication` then returns `callback.error:false`, `kind:null`, audience client; startup follows ordinary session restore. The fragment remains in the address/history until some later navigation replaces it. A signed-out entry need not create the navigator that would eventually remove it.

Fresh direct execution of the actual `prepareApplication` returned:

```text
/plan#provider_token=SYNTHETIC -> href unchanged; replaceState calls 0; error false; audience client
/plan#code=SYNTHETIC           -> href unchanged; replaceState calls 0; error false; audience client
/plan#token_hash=SYNTHETIC     -> href unchanged; replaceState calls 0; error false; audience client
```

The normal query PKCE case and mixed query code/token_hash rejection scrub correctly. Fragment refresh_token alone is scrubbed but is not marked as an unsupported callback. Duplicate query codes also select the first value rather than reject ambiguity; that is an additional observed protocol edge, not a demonstrated exchange/replay bypass. No real credential, outgoing credential request, external leak or token exchange was used in these diagnostics.

**Smallest correction to evaluate:** the shared retained consumer should detect and synchronously scrub every supported credential/error key in both locations and return an explicit invalid/unsupported callback for malformed combinations. Keep one shared consumer and semantic audience return grammar. Regress partial fragments, empty/duplicate keys, mixed callback forms, unknown/public paths and immediate rejection handling before any auth request.

Reproduction body for the same Node stdin command:

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

## Positive boundary evidence and prior-fix disposition

| Area | Current evidence and limit |
| --- | --- |
| Startup ordering | Actual start module was bundled in memory and run with an injected mount/plain-object window. Public Maya with query code, unknown path with query code and invalid mixed query callback all scrub before mount; zero fetches and zero unhandled rejections. Startup is created once outside StrictMode and immediately caught. A3 is the remaining partial-fragment exception. |
| Cookie/session identity | Actual CookieClientSession/CookieAdvisorSession and actual factories are used. onState invalidates transport/private memory before publishing React snapshots. Boundary captures owner/audience/role/local generation/epoch/CSRF and expiry, with an opaque key. Same-owner CSRF replacement creates a fresh boundary. Server token-refresh generation is distinct from local login generation; it is not evidence of a new owner/login. |
| Independent late-result matrix | Both audiences, success and HTTP503 error, across owner replacement, same-owner CSRF replacement, local generation, epoch, role, audience, expiry, abort, offline and logout: **40/40** reject. Identity variants use the real restore response where applicable; role/epoch/generation negatives mutate the actual synthetic cookie instance and emit its real onState. No fake session.isCurrent/transport success. Abort returns503; other matrix cases return401. Relevant invalidations clear old manual memory. A2 tests the narrower later continuation window. |
| Offline manual work | Checked-in actual-factory 503/network tests preserve unexpired uncertain work and reject offline successes. Application offline expiry invokes actual `_end`, clears boundary memory and reports signedout. Uncertain advisor save retains the exact pending command and permits later manual text; no reset-at-request-start regression. |
| Reverse draft/gate ordering | Checked-in raw A/B and actual W2-controller-plus-port cases pass. Selection generation advances at request start; gate generation rejects older same-target success. Actual controller abort protection is preserved. Assigned permissions derive from target/actor-bound gate; W2 context selects exactly clientId/approval/publication/coverage. A2 is not misreported as a controller A/B failure. |
| Human bootstrap and finite commands | Unassigned assign/review derives only from real human cookie edit; approve stays false until actual assigned gate. Plan parser/mapper is per request and finite; client read supplies version:null and no clientId. Directory/payment builders validate strict input and use actual fixed channels/mappers. Agent direct API remains separate. No display-name/remembered approval authority, arbitrary RPC/URL or browser provider SDK is introduced. |
| Client initial/read states | Initial controller sequence protects newer reads and clears private state on invalidation. Actual application SSR covers preparation/unavailable modules. Independent actual-port/SSR checks cover read-only versus active presentation, safe unpublished view and ended advisor audit. No invented Start/use/export/self-purchase/report callbacks are passed. |
| Approval/payment/publication | Source and selected controller tests retain current exact human approval, separate payment reads/confirmation and deliberate publication. Gate binds actual publisher/target, and canonical advisor audit uses actual client/version/time and ended care, without fake ClientPlanView entitlement. These checks do not certify server commit-time gates or genuine receipt verification. |
| Preview provenance | Actual nested draft ID/contentRevision/assignmentRevision plus captured request/session feed bindPreview. Assigned full target binds; null target relies on the issuing caller. Direct entry rereads draft/preview/draft and rejects changed basis/session/abort. Safe UnpublishedPlanPreview uses the same PlanRenderer; no synthetic publication metadata or client business callbacks. |
| Client-safe/private/plain content | Independent actual client-port probes reject extra privateNotes, a private fact/source shape, script markup and a credential-bearing private image URL. Actual unpublished SSR omits raw issue paths and injected business props; ended audit says ended, not read-only entitlement. Root positive allowlists remain authoritative. No private raw-source fetch or server ACL acceptance was exercised. |
| Navigation/re-entry | Existing pure test preserves evening/product/evidence route, opaque history markers, exact editor section and opener marker. Source resets new outer-entry cursor basis and keeps private product routes/session contents out of history. A1 exposes the additional nonzero native-traversal context defect. |
| Escape and exact opener IDs | Advisor menu has Escape/outside cleanup and focus ref; all three parent preview IDs are present. Existing author browser evidence is attributed in W0_APP_COMPOSITION. This round did not rerun or independently certify keyboard, actual focus, scroll or mobile geometry. |
| Shared UI and scope | New shell composes existing wrappers/classes/tokens and Lucide; lowercase authored UI preserves proper identities/source text. No questionnaire, parallel control system, fake SMS destination, fake delivery/export/order/Start success or client-specific page generation. Unfinished routes and Maya clearly say unavailable in this candidate. This is an honest first application slice, not D01-D48 completion. |

W2 F1-F3 and W3 R3-1 are present in the composed feature source; their separate reviewers own fresh feature/browser dispositions. Their old failures/responses remain part of the review basis, not silently closed by the 79-case application run. Historical foundation R1-R4 remain addressed within their recorded scope; A1 concerns the added cursor, A2 concerns added app continuations, and A3 concerns a previously uncovered retained consumer edge.

## Candidate build, assets, CSP and notices

Fresh `npm run build:application` succeeds. Builder is `apps/portal/scripts/build-portal-app.mjs`; output is only this checkout's ignored `.local-artifacts/portal-rebuild/application`. It includes no gateway, release config or deployment. Source/template/input hashes are bound to clean reviewed source **06c5954**, `sourceDirty:false`, `gatewayIncluded:false`.

Independent output inspection verified **2,196** parsed inputs, **17** public/approved assets, **47** positive-byte emitted packages, **47** original legal files and **8** emitted local font files. Every manifest asset hash was compared to both original and output bytes; every copied legal-file hash matched. Asset source allowlist is the approved design assets, corrected public shelf mark and retained public Maya product images. No baseline screenshot/private walkthrough/source document is copied. Product URLs/identities are not remapped to guessed images.

`index.html` uses same-origin connect/script/font policy, self/data images, no-referrer and noindex. It has no remote Figma/font/CDN URL. Emitted positive-byte inputs contain no Supabase browser SDK, server Vault/upstream or root AI workflow implementation. Credential-related *field names* in validators are not provider credentials. No new auth token/localStorage persistence was introduced; retained logout-intent markers remain nonsensitive.

`application-provenance.json` SHA-256: **`5c0cf7f1150b50e9878b38f78fb10404d2250410a188d5861d51489cbc225d9c`**. This is the clean pre-report build at 06c5954, not a claim that a later report commit was the build head. `licenses/emitted-packages.json` retains the react-remove-scroll-bar@2.3.8 upstream-license exception, original hash `a79aae0c0f21990d9d963bb3c5a79cdcea9a46f8523ba55c58d7fe776b6ebc84`, and its explicit non-version-specific acquisition limit. No new legal clearance or upstream re-acquisition.

The application browser harness rewrites known public image origins for its synthetic origin and supplies fixture API results. That is useful intercepted UI evidence, not proof that this gateway-free candidate delivers original-origin assets or genuine cookies on a deployed/same-origin route. Static serving, semantic deep-link fallback, actual asset decoding and applicable response headers need the later connected round. CSP-blocked/missing photos use the existing neutral fallback.

## Concrete reuse seam for the parent's genuine connected round

No PG/Docker/Auth/credentials/parent fixture was read or run here. The following is inspected source and a continuation plan, not connected execution evidence:

1. Reuse `apps/portal/session-integration/runtime/tests/client-two-owner-browser.test.ts`'s `stack()`/`bind()` shape: bundle actual gateway and `workers/session-vault/index.ts`, use the actual SQLite Durable Object in Miniflare, bind ASSETS to this candidate, forward same-origin browser traffic to `mf.dispatchFetch`, preserve Set-Cookie and reject browser Authorization/external requests. For both audiences, the existing combined entry is **`server/advisor-candidate-gateway.ts`**, already used by `runtime/scripts/build.mjs`, with explicit local CLIENT_SHARED_SESSIONS/ADVISOR_SHARED_SESSIONS flags. Do not implement a second BFF.
2. Its current `outboundService` is synthetic: OTP/token/user/session-context/Edge responses and JWTs are invented locally; legacy feature stores answer domain operations. Replace only that finite provider boundary with real calls to the separately owned, attested loopback fixture for actual Auth, context RPCs and concierge Edge endpoints. Keep actual gateway, Vault, cookie classes, root parsing, credential envelope and pre/post context guards intact. `client-vault-dispatch.test.ts` provides direct real-Vault dispatch, cookie namespace and held-result/revocation patterns; direct session.initialize seeding is not genuine browser PKCE acceptance.
3. **Existing protocol prerequisite:** `server/policy.ts:6-7` pins portal and provider origins. `server/upstream.ts:24-26` requires token issuer `${SUPABASE_ORIGIN}/auth/v1`; SDK URLs, context RPCs and Edge calls use that pinned origin. `workers/session-vault/index.ts:60` creates actual providers with no caller-selected upstream. Network forwarding alone does not establish that a genuine local JWT satisfies the issuer guard. The parent needs an explicit reviewed local origin/issuer configuration or test-bundle seam with exact loopback containment and unchanged production constants/guards. Do not fake/re-sign the JWT or remove issuer/owner/session validation to call the lane genuine. This is a source-identified harness prerequisite; local issuer behavior was not queried here.
4. `tests/concierge-admission-native.mjs` and `apps/portal/scripts/local-admission.mjs` show the existing marked/attested selected fixture, actual Auth PKCE/Mailpit, PostgREST and native handler pattern. Its optional `runNativeAdmissionBrowser` passes injected handler/directory/readCase ports; it does **not** itself connect the production cookie/Vault path. Preserve that distinction. Obtain fixture paths/credentials only under the parent's existing allocation, never adopt/reset the older 53-migration snapshots.
5. The next connected test should drive actual advisor cookie login -> unassigned create/save/import -> deliberate assignment/reviews -> current approval + separately verified synthetic local service receipt -> deliberate publish -> actual client-cookie login/read/decision/reread. Verify persistence/one publication/outbox/service dates at the actual backend, then cross-owner/audience/role/session revocation, CSRF, late response, read-only/ended care and private-field negatives. The parent's genuine native Edge/SQL evidence cannot substitute for this chain. No hosted URL, real recipient or real financial action is necessary or authorized.

## Commands, results and limits

Commands ran from `apps/portal` unless labeled root, under the explicit Node PATH above. Tests were serial. No full portal, root/Expo or browser-containing glob was executed.

```sh
npm ci --ignore-scripts --no-audit --no-fund
node --experimental-strip-types --test --test-concurrency=1 \
  tests/rebuild-app-ports.test.mjs tests/rebuild-app-session.test.mjs \
  tests/rebuild-app-state.test.mjs tests/rebuild-app-render.test.mjs \
  tests/rebuild-app-build.test.mjs tests/rebuild-foundation-transport.test.mjs \
  tests/rebuild-foundation-navigation.test.mjs tests/rebuild-foundation-notices.test.mjs \
  tests/rebuild-advisor-controller.test.mjs
npm run typecheck:rebuild
npm run typecheck:session
npm run check:ui
npm run build:application
```

| Check | Fresh result |
| --- | --- |
| Portal install | Exit0,130 packages; existing lockfile unchanged. Audit intentionally not run; no advisory assessment. |
| Exact nine-file command above | **79/79 pass**, 0 fail/skip, 2.109 seconds. Application subset is26; counts overlap author results and are not additive. Build/notices checks build candidates only; none of these files launches Chrome. |
| Frontend and retained-session typechecks | Both exit0, zero diagnostics with original strict/noUncheckedIndexedAccess flags. |
| UI guard | Exit0,11 retained stylesheets; application builder separately guards all source CSS. |
| Application package script | Exit0; actual main/start bundle, fonts/assets/notices/provenance inspected above. |
| Root stdin, actual-cookie/application-port matrix | **40/40** negative assertions pass, both audiences and success/error, described above. Uses only finite injected fetch responses; no network. |
| Root stdin, in-memory bundled actual startup | **3/3** scrub-before-mount/public-unknown-malformed no-auth assertions pass; zero unhandledRejection events after settlement. No React mount or DOM implementation. |
| Root stdin, actual-port + actual-component SSR | **8/8** checks pass: active/read-only presentation; four malformed/private/HTML/URL refusals; unpublished safe/no-callback/no-path output; canonical ended audit. Seven finite fetch boundary calls. |
| Root stdin, independent A1/A2/A3 diagnostics | Reproductions above. A2 offset sweep and separate four-variant repetition; public restore sweep nonreproduction explicitly retained in interpretation. These observe defects, not acceptance passes. |
| Root output/hash/closure inspection | All17 source/output assets and47 legal files match; clean-head manifest, local fonts and no browser provider/server-workflow output confirmed. |
| Scope/whitespace/report links | `git diff --check` and report-only tracked scope checked before commit; local report links resolve. |

Independent stdin probes ran without saving additional scripts, consistent with the sole report write-set. The finding reproductions are retained inline above; remaining matrix/SSR procedures and exact observed assertions are specified here. Checked-in tests remain the durable runnable positive suite. Existing Node module-type warnings were emitted for root TypeScript modules; no compiler/package flags were relaxed to suppress them.

Not run: any browser/DOM interaction, screenshots/native Figma comparison, keyboard/focus/zoom/mobile visual acceptance, full portal/session/root suites, root dependency install, Expo web/iOS/native export, PostgreSQL/Docker/Supabase lifecycle/reset/pgTAP/RLS/Storage, real Auth/PKCE/Vault/Edge/PostgREST chain, notifications/delivery, hosted services, real client data/messages/money/orders, CI or human comprehension/clinical review. No pending process or resource allocation is handed back. Parent owns canonical status/context and a fresh review after bounded corrections. This report does not certify the full portal, security, clinical advice, licensing or release readiness.
