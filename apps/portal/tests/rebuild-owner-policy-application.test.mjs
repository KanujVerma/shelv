// Source/SSR and finite synthetic HTTP only. No DOM, listener or genuine backend.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const appSource=readFileSync(new URL('../src/app/Application.tsx',import.meta.url),'utf8');
test('actual AdvisorApplication selects the owner-policy application on the canonical permissions branch',()=>{
 const advisor=appSource.slice(appSource.indexOf('function AdvisorApplication('),appSource.indexOf('function AdvisorClientRecovery('));
 assert.match(advisor,/if\s*\(route\.name === ["']advisor-permissions["']\)\s*content = \(\s*<OwnerPolicyApplication\s+runtime=\{runtime\}\s+win=\{win\}/,'A08 must mount its actual runtime-owned application, rather than the unavailable fallback');
 assert.match(appSource,/import \{ OwnerPolicyApplication \} from ["']\.\/OwnerPolicyApplication\.tsx["']/);
});
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {readPlanCommand,buildPlanRpc} from '../../../src/contracts/PortalRebuildValidation.ts';
const portal=new URL('../',import.meta.url).pathname;
const bundled=await build({absWorkingDir:portal,tsconfig:'tsconfig.frontend.json',stdin:{contents:`export * from './src/app/OwnerPolicyApplication.tsx';export {PortalApplication} from './src/app/Application.tsx';export {createApplicationSession} from './src/app/session.ts';export {createPortalNavigator} from './src/navigation/history.ts';export {NavigationProvider} from './src/navigation/react.tsx';export {ApplicationShell} from './src/app/Shell.tsx';export {OverlayProvider} from './src/ui/index.ts';export {createElement} from 'react';export {renderToStaticMarkup} from 'react-dom/server';`,resolveDir:portal,loader:'tsx'},bundle:true,write:false,platform:'node',format:'cjs',loader:{'.css':'empty'}});
const module={exports:{}};new Function('module','exports','require',bundled.outputFiles[0].text)(module,module.exports,createRequire(import.meta.url));
const api=module.exports;
const actor='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222';
const initial={revision:7,ownerActorId:actor,requireKanujApproval:true};
function windowModel(path='/advisor/permissions'){
 const entries=[{url:path,state:null}],events=new Map();let at=0;
 const location={pathname:path,search:''},setUrl=url=>{const u=new URL(url,'https://portal.invalid');location.pathname=u.pathname;location.search=u.search;};
 const win={location,document:{activeElement:null,getElementById:()=>null,querySelector:()=>null},scrollY:0,scrollTo(){},requestAnimationFrame:fn=>queueMicrotask(fn),addEventListener(n,fn){if(!events.has(n))events.set(n,new Set());events.get(n).add(fn);},removeEventListener(n,fn){events.get(n)?.delete(fn);},history:{scrollRestoration:'auto',get state(){return entries[at].state;},replaceState(state,_,url){entries[at]={state,url};setUrl(url);},pushState(state,_,url){entries.splice(++at);entries[at]={state,url};setUrl(url);},back(){this.go(-1);},go(delta){assert.ok(at+delta>=0&&at+delta<entries.length);at+=delta;setUrl(entries[at].url);events.get('popstate')?.forEach(fn=>fn());}}};
 return {win,entries};
}
function deferred(){let resolve;return{promise:new Promise(r=>resolve=r),resolve:x=>resolve(x)};}
async function fixture(t,{audience='advisor',path='/advisor/permissions',caps={},owner=actor}={}){
 let policy={...initial},fault=null,hold=null;
 let login={signedIn:true,ownerId:owner,generation:1,csrf:'app-policy-synthetic',capabilities:{view:true,edit:true,publish:true,confirmPayments:false,...caps},idleExpiresAt:'2026-11-01T20:00:00Z',absoluteExpiresAt:'2026-11-02T00:00:00Z'};
 const calls=[],receipts=new Map();
 const runtime=api.createApplicationSession({audience,now:()=>Date.parse('2026-11-01T12:00:00Z'),locks:{request:async(_n,_o,run)=>run()},fetcher:async(url,init)=>{
  assert.ok([`/api/${audience}/session`,`/api/${audience}/plans`,`/api/${audience}/logout`].includes(url),'closed finite HTTP');
  assert.equal(init.credentials,'same-origin');assert.equal(init.cache,'no-store');assert.equal(init.redirect,'error');
  const headers=new Headers(init.headers);assert.equal(headers.has('authorization'),false);assert.equal(headers.has('apikey'),false);
  if(url.endsWith('/session'))return Response.json(login);
  if(url.endsWith('/logout'))return Response.json({signedOut:true});
  assert.equal(audience,'advisor');assert.equal(headers.get('x-shelv-csrf'),login.csrf);
  const command=readPlanCommand(JSON.parse(init.body));assert.equal(buildPlanRpc(command).name,'concierge_plan_command_v1');calls.push({command,wire:init.body,signal:init.signal});
  const override=fault;fault=null;let response;
  if(override)response=await override(command);
  if(!response){
   if(command.action==='read_policy_v1')response=Response.json(policy);
   else if(command.action==='request_status_v1')response=Response.json(receipts.has(command.requestId)?{status:'committed',receipt:receipts.get(command.requestId)}:{status:'absent'});
   else{
    assert.equal(command.action,'set_sami_approval_policy_v1');assert.equal(command.confirmed,true);
    if(!receipts.has(command.requestId)){
     if(command.expectedPolicyRevision!==policy.revision)return Response.json({code:'revision_conflict'},{status:409});
     policy={...policy,revision:policy.revision+1,requireKanujApproval:command.requireKanujApproval};receipts.set(command.requestId,{...policy});
    }
    response=Response.json(receipts.get(command.requestId));
   }
  }
  if(hold){const h=hold;hold=null;h.entered.resolve();await h.release.promise;}
  return response;
 }});
 t.after(()=>runtime.dispose());
 await runtime.restore();
 const w=windowModel(path),navigator=api.createPortalNavigator(w.win,{scopeKey:runtime.getSnapshot().boundary.key}),stop=navigator.subscribe(()=>{});
 const scopes=[];const mount=()=>{const s=api.createOwnerPolicyApplicationScope({runtime,navigator,win:w.win});scopes.push(s);return s;};
 const scope=mount();
 t.after(()=>{scopes.forEach(s=>s.dispose());stop();navigator.dispose();runtime.dispose();});
 return {runtime,navigator,scope,mount,...w,calls,receipts,controller:()=>scope.getSnapshot().controller,settings:()=>calls.filter(x=>x.command.action==='set_sami_approval_policy_v1'),policy:x=>policy={...x},login:x=>login={...login,...x},fault:fn=>fault=fn,hold(){hold={entered:deferred(),release:deferred()};const captured=hold;t.after(()=>captured.release.resolve());return hold;},html(s=scope){const h=api.createElement;return api.renderToStaticMarkup(h(api.OverlayProvider,null,h(api.NavigationProvider,{navigator},h(api.ApplicationShell,{audience:'advisor',onSignOut(){}},h(api.OwnerPolicyApplicationContent,{scope:s})))));}};
}
async function read(f){const c=f.controller();assert.ok(c);await c.refresh();return c;}
async function confirm(c){c.edit(false);const token=c.requestSave();assert.ok(token);return c.confirmSave(token);}

test('actual scope is bound to the canonical entry and real advisor runtime; creation and SSR dispatch no read',async t=>{
 const f=await fixture(t),c=f.controller();assert.ok(c);assert.equal(c.getSnapshot().phase,'unread');assert.equal(f.calls.length,0);assert.match(f.html(),/workspace permissions/);assert.match(f.html(),/current policy not loaded/);assert.equal(f.calls.length,0);
 await c.refresh();assert.equal(c.getSnapshot().current.revision,7);assert.equal(f.calls.length,1);assert.deepEqual(f.calls[0].command,{schemaVersion:1,action:'read_policy_v1'});assert.match(f.html(),/Sami’s skincare updates/);assert.match(f.html(),/revision<\/dt><dd>7/);assert.match(f.html(),/specific authorization is always required/);assert.match(f.html(),/aria-current="page"[^>]*>.*?permissions/s);assert.doesNotMatch(f.html(),/manage source access|model training off|this page is not connected yet/);
});
for(const x of [{audience:'client'},{path:'/advisor/plans'}])test('no scope controller or egress outside real permissions admission '+JSON.stringify(x),async t=>{
 const f=await fixture(t,x);assert.equal(f.controller(),null);assert.equal(f.calls.length,0);assert.doesNotMatch(f.html(),/Sami’s skincare updates|policy owner/);
});
test('nonowner and publish-denied real sessions read without acquiring setting authority',async t=>{
 for(const config of [{owner:other},{caps:{publish:false}}]){
  const f=await fixture(t,config),c=await read(f);assert.equal(c.getSnapshot().writable,false);c.edit(false);assert.equal(c.requestSave(),null);assert.equal(f.settings().length,0);assert.match(f.html(),/only the current owner with publishing access/);
 }
});
test('loading and malformed empty reads stay truthful through the actual policy mapper',async t=>{
 const f=await fixture(t),c=f.controller(),held=f.hold(),work=c.refresh();await held.entered.promise;assert.match(f.html(),/reading the current policy/);assert.equal(c.getSnapshot().current,null);held.release.resolve();await work;
 f.fault(()=>Response.json({}));await c.refresh();assert.equal(c.getSnapshot().current,null);assert.equal(c.getSnapshot().phase,'error');assert.match(f.html(),/the current policy is unavailable/);assert.doesNotMatch(f.html(),/policy saved|revision<\/dt>/);
});
for(const status of [401,403,503])test('actual read '+status+' retires old display and preserves honest recovery',async t=>{
 const f=await fixture(t),c=await read(f);f.fault(()=>Response.json({code:status===401?'session_ended':status===403?'forbidden':'unavailable'},{status}));await c.refresh();assert.equal(c.getSnapshot().current,null);assert.doesNotMatch(f.html(),/revision<\/dt>|policy saved/);
 if(status===401){assert.equal(f.scope.getSnapshot().controller,null);assert.equal(f.runtime.getSnapshot().boundary,null);}else if(status===403){assert.equal(c.getSnapshot().phase,'denied');}else{assert.equal(f.runtime.cookie.status,'offline');assert.equal(c.getSnapshot().writable,false);await f.runtime.restore();await c.refresh();assert.equal(c.getSnapshot().current.revision,7);}
});
test('route-mounted policy preserves local edit on refresh and requires separate save then confirmation',async t=>{
 const f=await fixture(t),c=await read(f);c.edit(false);await c.refresh();assert.equal(c.getSnapshot().desired,false);assert.equal(f.settings().length,0);const token=c.requestSave();assert.ok(token);assert.equal(f.settings().length,0);await c.confirmSave(token);assert.equal(f.settings().length,1);assert.deepEqual(f.settings()[0].command,{schemaVersion:1,action:'set_sami_approval_policy_v1',requestId:f.settings()[0].command.requestId,expectedPolicyRevision:7,requireKanujApproval:false,confirmed:true});assert.match(f.settings()[0].command.requestId,/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);assert.match(f.html(),/policy saved/);
});
test('newer revision keeps original local edit in comparison until Reapply and a separate confirmation',async t=>{
 const f=await fixture(t),c=await read(f);c.edit(false);f.policy({...initial,revision:8});await c.refresh();assert.equal(c.getSnapshot().base.revision,7);assert.equal(c.getSnapshot().desired,false);assert.match(f.html(),/your starting policy:.*revision 7/);assert.match(f.html(),/current policy:.*revision 8/);assert.equal(c.requestSave(),null);c.reapply();assert.equal(c.getSnapshot().base.revision,8);assert.equal(c.getSnapshot().confirmation,null);assert.equal(f.settings().length,0);const token=c.requestSave();assert.ok(token);assert.equal(f.settings().length,0);await c.confirmSave(token);assert.equal(f.settings()[0].command.expectedPolicyRevision,8);
});
for(const loss of ['route','same-path-entry','view','generation','owner','session','role'])for(const kind of ['read','write'])test('held '+kind+' loses actual '+loss+' ownership before its result',async t=>{
 const f=await fixture(t),c=await read(f),held=f.hold();const work=kind==='read'?c.refresh():confirm(c);await held.entered.promise;
 if(loss==='route')f.navigator.navigate({name:'advisor-plans'});
 if(loss==='same-path-entry')f.navigator.navigate({name:'advisor-permissions'});
 if(loss==='view'){f.runtime.cookie._view.capabilities.view=false;f.runtime.cookie._emit();}
 if(loss==='generation'){f.login({generation:2});await f.runtime.restore();}
 if(loss==='owner'){f.login({ownerId:other,csrf:'app-other-owner'});await f.runtime.restore();}
 if(loss==='session')await f.runtime.signOut();
 if(loss==='role')f.runtime.cookie.identity.role='client';
 assert.equal(c.getSnapshot().current,null);assert.equal(c.getSnapshot().confirmation,null);assert.notEqual(f.scope.getSnapshot().controller,c);
 held.release.resolve();await work;assert.equal(c.getSnapshot().current,null);assert.equal(c.getSnapshot().pending,null);assert.equal(f.settings().length,kind==='write'?1:0);assert.doesNotMatch(f.html(),/policy saved/);
});
for(const failure of ['lost','503','malformed'])test('uncertain '+failure+' preserves exact pending status across actual route unmount/remount',async t=>{
 const f=await fixture(t),c=await read(f);f.fault(()=>{if(failure==='lost')throw Error('synthetic response lost');return Response.json(failure==='503'?{code:'unavailable'}:{revision:8},{status:failure==='503'?503:200});});await confirm(c);const pending=c.getSnapshot().pending;assert.ok(pending);const wire=f.settings()[0].wire;
 f.navigator.navigate({name:'advisor-plans'});assert.equal(c.getSnapshot().current,null);f.scope.dispose();f.navigator.navigate({name:'advisor-permissions'});const next=f.mount(),b=next.getSnapshot().controller;assert.ok(b);assert.deepEqual(b.getSnapshot().pending,pending);assert.match(f.html(next),/original change is still uncertain/);await b.refresh();assert.equal(b.getSnapshot().pending.requestId,pending.requestId);await b.retryOriginal();assert.equal(f.settings().length,2);assert.equal(f.settings()[1].wire,wire);assert.equal(b.getSnapshot().pending,null);assert.equal(b.getSnapshot().current.revision,8);
});
test('committed original status after remount resolves only its original receipt then reads newer current policy',async t=>{
 const f=await fixture(t),c=await read(f),held=f.hold(),work=confirm(c);await held.entered.promise;const original=f.settings()[0].command;f.navigator.navigate({name:'advisor-plans'});f.scope.dispose();held.release.resolve();await work;f.policy({...initial,revision:9});f.navigator.navigate({name:'advisor-permissions'});const next=f.mount(),b=next.getSnapshot().controller;await b.checkStatus();assert.equal(f.calls.find(x=>x.command.action==='request_status_v1').command.requestId,original.requestId);assert.equal(b.getSnapshot().pending,null);assert.equal(b.getSnapshot().current.revision,9);assert.equal(b.getSnapshot().base.revision,9);assert.equal(b.getSnapshot().desired,true);assert.equal(b.getSnapshot().current.requireKanujApproval,true);assert.equal(f.settings().length,1);
});
test('absent original status after remount requires deliberate new save with a different UUID',async t=>{
 const f=await fixture(t),c=await read(f);f.fault(()=>Response.json({code:'unavailable'},{status:503}));await confirm(c);const id=c.getSnapshot().pending.requestId;f.navigator.navigate({name:'advisor-plans'});f.scope.dispose();f.navigator.navigate({name:'advisor-permissions'});const next=f.mount(),b=next.getSnapshot().controller;await b.checkStatus();assert.equal(b.getSnapshot().writeState,'absent');assert.equal(b.getSnapshot().pending,null);assert.equal(f.settings().length,1);await b.refresh();const token=b.requestSave();assert.ok(token);assert.equal(f.settings().length,1);await b.confirmSave(token);assert.notEqual(f.settings()[1].command.requestId,id);
});
test('reentrant and throwing App subscribers cannot redisplay A or cancel replacement B',async t=>{
 const f=await fixture(t),a=await read(f);let b,ran=false;
 const stop=f.scope.subscribe(()=>{if(ran||f.scope.getSnapshot().controller)return;ran=true;f.navigator.navigate({name:'advisor-permissions'});b=f.mount();throw Error('synthetic local subscriber');});
 f.navigator.navigate({name:'advisor-plans'});assert.equal(ran,true);const next=b.getSnapshot().controller;assert.ok(next);await next.refresh();next.edit(false);const token=next.requestSave();assert.ok(token);f.scope.dispose();f.scope.dispose();assert.equal(a.getSnapshot().current,null);assert.equal(await a.confirmSave(token),false);assert.equal(next.getSnapshot().confirmation,token);await next.confirmSave(token);assert.equal(next.getSnapshot().current.revision,8);assert.equal(f.settings().length,1);stop();
});
test('actual PortalApplication SSR keeps the signed-in shell and connection recovery control, without running effects',async t=>{
 const f=await fixture(t),h=api.createElement;const render=()=>api.renderToStaticMarkup(h(api.OverlayProvider,null,h(api.PortalApplication,{runtime:f.runtime,startup:Promise.resolve(),win:f.win})));
 assert.match(render(),/loading workspace permissions/);assert.doesNotMatch(render(),/this page is not connected yet/);assert.equal(f.calls.length,0);f.fault(()=>Response.json({code:'unavailable'},{status:503}));await f.controller().refresh();assert.match(render(),/check connection/);assert.match(render(),/unconfirmed work stays in this session/);
});
test('a superseded App scope cannot reacquire the feature memory lane on a later navigation or session notification',async t=>{
 const f=await fixture(t),a=await read(f),bScope=f.mount(),b=bScope.getSnapshot().controller;await b.refresh();b.edit(false);const token=b.requestSave();assert.ok(token);assert.equal(f.scope.getSnapshot().controller,null);await f.runtime.restore();assert.equal(b.getSnapshot().confirmation,token);assert.equal(f.scope.getSnapshot().controller,null);f.navigator.navigate({name:'advisor-permissions'});const current=bScope.getSnapshot().controller;assert.ok(current);await current.refresh();assert.equal(f.scope.getSnapshot().controller,null);assert.equal(current.getSnapshot().writable,true);assert.equal(a.getSnapshot().phase,'ended');
});
test('each exact entry controller is disposed once across route exit, remount and repeated old cleanup',async t=>{
 const f=await fixture(t),a=await read(f),dispose=a.dispose;let count=0;a.dispose=()=>{count++;dispose();};f.navigator.navigate({name:'advisor-plans'});assert.equal(count,1);f.scope.dispose();f.scope.dispose();assert.equal(count,1);f.navigator.navigate({name:'advisor-permissions'});const next=f.mount(),b=next.getSnapshot().controller;assert.notEqual(a,b);await b.refresh();f.scope.dispose();assert.equal(b.getSnapshot().phase,'ready');assert.equal(count,1);
});
test('synthetic loss of actual view capability clears private policy and pending authority before another observer',async t=>{
 const f=await fixture(t),c=await read(f);f.fault(()=>Response.json({code:'unavailable'},{status:503}));await confirm(c);assert.ok(c.getSnapshot().pending);await f.runtime.restore();let observed;
 const stop=f.scope.subscribe(()=>{if(f.scope.getSnapshot().phase==='denied')observed=[c.getSnapshot().current,c.getSnapshot().pending,c.getSnapshot().desired];});f.runtime.cookie._view.capabilities.view=false;f.runtime.cookie._emit();assert.deepEqual(observed,[null,null,null]);assert.equal(f.controller(),null);assert.match(f.html(),/you do not have access/);f.runtime.cookie._view.capabilities.view=true;f.runtime.cookie._emit();const b=f.controller();assert.ok(b);assert.equal(b.getSnapshot().pending,null);assert.equal(f.settings().length,1);stop();
});
test('a reentrant fixed-feature callback navigating away cannot cancel a newer route owner or restore the old private view',async t=>{
 const f=await fixture(t),a=await read(f);let b,ran=false;const stop=a.subscribe(()=>{if(ran||a.getSnapshot().phase!=='loading')return;ran=true;f.navigator.navigate({name:'advisor-plans'});f.navigator.navigate({name:'advisor-permissions'});b=f.mount();throw Error('synthetic feature observer');});await a.refresh();assert.equal(ran,true);assert.equal(a.getSnapshot().current,null);const next=b.getSnapshot().controller;assert.ok(next);await next.refresh();next.edit(false);const token=next.requestSave();f.scope.dispose();assert.equal(next.getSnapshot().confirmation,token);assert.equal(f.settings().length,0);stop();
});
test('source lifecycle binds construction to after-commit effect and uses the fixed feature initial-read effect',()=>{
 const source=readFileSync(new URL('../src/app/OwnerPolicyApplication.tsx',import.meta.url),'utf8');
 const react=source.slice(source.indexOf('export function OwnerPolicyApplication({'));
 assert.match(react,/useEffect\(\(\) => \{[\s\S]*createOwnerPolicyApplicationScope\(\{ runtime, navigator, win \}\)/);
 assert.match(react,/return \(\) => next\.dispose\(\)/);
 assert.equal((react.match(/createOwnerPolicyApplicationScope\(/g)??[]).length,1);
 const fixed=readFileSync(new URL('../src/features/advisor/permissions/OwnerPolicy.tsx',import.meta.url),'utf8');
 assert.match(fixed,/useEffect\(\(\) => \{ void controller\.refresh\(\); \}, \[controller\]\)/);
 assert.doesNotMatch(source,/localStorage|sessionStorage|fetch\(|createOwnerPolicyPort|isOwner|Date\.now/);
});
test('reentrant feature notification during App reconciliation cannot retire a newer controller in the same scope',async t=>{
 const f=await fixture(t),a=await read(f);a.edit(false);assert.ok(a.requestSave());let b,ran=false;
 const stop=a.subscribe(()=>{if(ran||a.getSnapshot().writable)return;ran=true;f.navigator.navigate({name:'advisor-permissions'});b=f.controller();});
 f.runtime.cookie._view.capabilities.publish=false;f.runtime.cookie._emit();assert.equal(ran,true);assert.ok(b);assert.equal(f.controller(),b);assert.notEqual(b.getSnapshot().phase,'ended');await b.refresh();assert.equal(b.getSnapshot().current.revision,7);assert.equal(b.getSnapshot().writable,false);stop();
});
