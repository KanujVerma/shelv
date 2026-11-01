// Actual ApplicationSession/cookie/Root codecs. HTTP ledger facts are synthetic.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createApplicationSession} from '../src/app/session.ts';
import {createAdvisorPorts} from '../src/app/ports.ts';
import {readPlanCommand,buildPlanRpc} from '../../../src/contracts/PortalRebuildValidation.ts';
import {mapPlanResult} from '../../../src/contracts/PortalRebuildMapping.ts';
const api=await import('../src/features/advisor/permissions/port.ts').catch(e=>{if(e.code!=='ERR_MODULE_NOT_FOUND')throw e;return null;});
const owner='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222';
const read={schemaVersion:1,action:'read_policy_v1'};
const initial={revision:7,ownerActorId:owner,requireKanujApproval:true};
const gate=()=>{let resolve,enter;const promise=new Promise(r=>resolve=r),entered=new Promise(r=>enter=r);return{promise,entered,resolve,enter};};
async function fixture(t){
 let login={signedIn:true,ownerId:owner,generation:1,csrf:'synthetic-policy-csrf',capabilities:{view:true,edit:true,publish:true,confirmPayments:false},idleExpiresAt:'2099-01-01T00:00:00Z',absoluteExpiresAt:'2099-01-02T00:00:00Z'};
 let policy={...initial},now=Date.parse('2026-11-01T12:00:00Z'),next=null,hold=null,acquires=0,acquireHold=null;
 const calls=[],receipts=new Map();
 const originalFetch=globalThis.fetch;globalThis.fetch=async()=>{throw Error('global fetch denied');};t.after(()=>{globalThis.fetch=originalFetch;});
 const runtime=createApplicationSession({audience:'advisor',now:()=>now,locks:{request:async(_n,_o,run)=>run()},fetcher:async(url,init)=>{
  assert.ok(['/api/advisor/session','/api/advisor/plans'].includes(url),'unexpected URL '+url);
  assert.equal(new Headers(init.headers).has('authorization'),false);assert.equal(new Headers(init.headers).has('apikey'),false);
  if(url.endsWith('/session'))return Response.json(login);
  const command=readPlanCommand(JSON.parse(init.body));assert.equal(buildPlanRpc(command).name,'concierge_plan_command_v1');calls.push({command,wire:init.body,init});
  const custom=next;next=null;let result,status=200;
  if(custom){result=custom.data;status=custom.status;}else if(command.action==='read_policy_v1')result={...policy};
  else if(command.action==='request_status_v1')result=receipts.has(command.requestId)?{status:'committed',receipt:receipts.get(command.requestId)}:{status:'absent'};
  else if(command.action==='set_sami_approval_policy_v1'){
   if(receipts.has(command.requestId))result=receipts.get(command.requestId);
   else if(command.expectedPolicyRevision!==policy.revision){result={code:'revision_conflict'};status=409;}
   else{policy={revision:policy.revision+1,ownerActorId:policy.ownerActorId,requireKanujApproval:command.requireKanujApproval};result={...policy};receipts.set(command.requestId,result);}
  }else throw Error('closed ledger unexpected action '+command.action);
  if(hold){const h=hold;hold=null;h.enter();await h.promise;}
  return Response.json(result,{status});
 }});
 await runtime.restore();const acquire=runtime.cookie.acquire.bind(runtime.cookie);runtime.cookie.acquire=async()=>{acquires++;if(acquireHold?.at===acquires){const h=acquireHold;acquireHold=null;h.enter();await h.promise;}return acquire();};
 t.after(()=>runtime.dispose());return{runtime,calls,receipts,policy:()=>policy,setPolicy:v=>policy={...v},reply:(data,status=200)=>next={data,status},login:v=>login={...login,...v},now:v=>now=v,hold(){hold=gate();return hold;},holdAcquire(at){acquireHold={...gate(),at:acquires+at};return acquireHold;}};
}
function port(f){return api?api.createOwnerPolicyPort(f.runtime):createAdvisorPorts(f.runtime).ports.plans;}
test('connected policy read reaches the retained cookie plans channel and returns Root policy truth',async t=>{
 const f=await fixture(t),p=port(f),result=await p.execute(read);
 assert.deepEqual(result,initial);assert.deepEqual(result,mapPlanResult(initial,read));assert.equal(f.calls.length,1);
 const {init}=f.calls[0];assert.equal(init.credentials,'same-origin');assert.equal(init.cache,'no-store');assert.equal(init.redirect,'error');assert.equal(new Headers(init.headers).get('x-shelv-csrf'),'synthetic-policy-csrf');
});
const requestId='33333333-3333-4333-8333-333333333333';
const set=(value=false,revision=7)=>({schemaVersion:1,action:'set_sami_approval_policy_v1',requestId,expectedPolicyRevision:revision,requireKanujApproval:value,confirmed:true});
test('strict finite policy commands use canonical Root command/result codecs and status receipts',async t=>{
 const f=await fixture(t),p=port(f);await p.execute(read);
 assert.deepEqual(await p.execute(set()),{...initial,revision:8,requireKanujApproval:false});
 assert.deepEqual(await p.execute({schemaVersion:1,action:'request_status_v1',requestId}),{status:'committed',receipt:f.policy()});
 for(const input of [{...set(),confirmed:false},{...read,ownerActorId:owner},{...set(),expectedPolicyRevision:-1},{...set(),requestId:'invalid'}])await assert.rejects(p.execute(input),e=>e.status===400);
 const before=f.calls.length;for(const action of ['grant_task_v1','revoke_task_v1','publish_plan_v1','read_draft_v1'])await assert.rejects(p.execute({schemaVersion:1,action}),e=>[400,403].includes(e.status));assert.equal(f.calls.length,before);
 f.reply({...initial,privateCanary:'excluded'});await assert.rejects(p.execute(read),e=>e.status===503);
 f.reply({status:'committed',receipt:{grantId:other}});await assert.rejects(p.execute({schemaVersion:1,action:'request_status_v1',requestId}),e=>e.status===503);
});
for(const change of ['no-read','other-owner','view-only'])test('setting never egresses for '+change,async t=>{
 const f=await fixture(t),p=port(f);
 if(change==='other-owner')f.setPolicy({...initial,ownerActorId:other});
 if(change!=='no-read')await p.execute(read);
 if(change==='view-only'){f.login({capabilities:{view:true,edit:false,publish:false,confirmPayments:false}});await f.runtime.restore();}
 const before=f.calls.length;await assert.rejects(p.execute(set()),e=>e.status===403);assert.equal(f.calls.length,before);
});
for(const at of [1,2])test('caller mutation and real lease wait '+at+' preserve captured command',async t=>{
 const f=await fixture(t),p=port(f);await p.execute(read);const input=set(),wire=JSON.stringify(input),h=f.holdAcquire(at),promise=p.execute(input);await h.entered;input.requestId=other;input.requireKanujApproval=true;input.expectedPolicyRevision=999;h.resolve();await promise;assert.equal(f.calls.at(-1).wire,wire);
});
for(const at of [1,2])test('local denial after real lease wait '+at+' causes no egress and no shared cookie suspension',async t=>{
 const f=await fixture(t),p=port(f);await p.execute(read);const h=f.holdAcquire(at);let relevant=true;const promise=p.execute(set(),{isApplicable:()=>relevant}),rejected=assert.rejects(promise,e=>e.status===503);await h.entered;relevant=false;h.resolve();await rejected;assert.equal(f.calls.length,1);assert.equal(f.runtime.cookie.status,'ready');
});
for(const responseStatus of [200,403,409,503])test('old creation-bound port discards held '+responseStatus+' after session replacement',async t=>{
 const f=await fixture(t),p=port(f);f.reply(responseStatus===200?initial:{code:'forbidden'},responseStatus);const h=f.hold(),promise=p.execute(read),rejected=assert.rejects(promise,e=>e.status===401);await h.entered;f.login({csrf:'synthetic-replacement'});await f.runtime.restore();h.resolve();await rejected;const before=f.calls.length;await assert.rejects(p.execute(read),e=>e.status===401);assert.equal(f.calls.length,before);
});
test('reentrant command serialization cannot dispatch after owner retirement',async t=>{
 const f=await fixture(t),p=port(f);await p.execute(read);const input=set();Object.defineProperty(input,'requireKanujApproval',{get(){f.runtime.cookie._end();return false;}});const before=f.calls.length;await assert.rejects(p.execute(input),e=>e.status===401);assert.equal(f.calls.length,before);
});
const controllerApi=()=>import('../src/features/advisor/permissions/controller.ts');
async function controlled(t){const f=await fixture(t),{createOwnerPolicyController}=await controllerApi();const c=createOwnerPolicyController(f.runtime);t.after(()=>c.dispose());return{...f,c};}
async function confirm(c){c.requestSave();const confirmation=c.getSnapshot().confirmation;assert.ok(confirmation,'deliberate save must stage confirmation');return c.confirmSave(confirmation);}
test('current policy is unread until actual read; local edit and save require a separate exact confirmation',async t=>{
 const f=await controlled(t),{c}=f;assert.equal(c.getSnapshot().current,null);assert.equal(c.getSnapshot().desired,null);c.edit(false);c.requestSave();assert.equal(f.calls.length,0);
 await c.refresh();assert.deepEqual(c.getSnapshot().current,initial);c.edit(false);assert.equal(c.getSnapshot().current.requireKanujApproval,true);assert.equal(f.calls.length,1);
 c.requestSave();const confirmation=c.getSnapshot().confirmation;assert.ok(confirmation);assert.equal(f.calls.length,1);assert.equal(c.getSnapshot().writeState,'confirming');
 await c.confirmSave(confirmation);assert.equal(c.getSnapshot().writeState,'saved');assert.deepEqual(c.getSnapshot().current,f.policy());assert.equal(f.calls[1].command.confirmed,true);assert.equal(f.calls[1].command.expectedPolicyRevision,7);
});
test('stale confirmation and view-only/nonowner callbacks never dispatch setting',async t=>{
 const f=await controlled(t),{c}=f;await c.refresh();c.edit(false);c.requestSave();const old=c.getSnapshot().confirmation;c.cancelConfirmation();c.edit(true);await c.confirmSave(old);assert.equal(f.calls.length,1);
 f.setPolicy({...initial,ownerActorId:other});await c.refresh();c.edit(false);assert.equal(c.getSnapshot().writable,false);assert.equal(c.requestSave(),null);await c.confirmSave(old);assert.equal(f.calls.length,2);
});
for(const status of [503,200])test('lost or malformed set '+status+' stays uncertain with exact status/original retry',async t=>{
 const f=await controlled(t),{c}=f;await c.refresh();c.edit(false);f.reply(status===503?{code:'unavailable'}:{garbage:'never saved'},status);await confirm(c);assert.equal(c.getSnapshot().writeState,'uncertain');const pending=c.getSnapshot().pending,wire=f.calls.at(-1).wire;
 c.requestSave();assert.equal(c.getSnapshot().pending,pending);await c.retryOriginal();assert.equal(f.calls.at(-2).wire,wire);assert.equal(c.getSnapshot().writeState,'saved');assert.equal(c.getSnapshot().pending,null);
});
test('committed recovery uses actual stored Root policy, never a fabricated receipt',async t=>{
 const f=await controlled(t),{c}=f;await c.refresh();c.edit(false);const h=f.hold();const saving=confirm(c);await h.entered;c.edit(true);h.resolve();await saving;assert.equal(c.getSnapshot().writeState,'uncertain');assert.equal(c.getSnapshot().desired,true);const id=c.getSnapshot().pending.requestId;await c.checkStatus();assert.equal(f.calls.at(-2).command.requestId,id);assert.equal(c.getSnapshot().current.requireKanujApproval,false);assert.equal(c.getSnapshot().desired,true);assert.equal(c.getSnapshot().pending,null);
});
test('absent status settles original uncertainty before a deliberate new UUID',async t=>{
 const f=await controlled(t),{c}=f;await c.refresh();c.edit(false);f.reply({code:'unavailable'},503);await confirm(c);const id=c.getSnapshot().pending.requestId;await c.checkStatus();assert.equal(c.getSnapshot().writeState,'absent');assert.equal(c.getSnapshot().pending,null);await confirm(c);assert.notEqual(f.calls.at(-1).command.requestId,id);
});
test('409 retains original desired/base, requires refresh and explicit reapply without automatic revision advance',async t=>{
 const f=await controlled(t),{c}=f;await c.refresh();c.edit(false);f.setPolicy({...initial,revision:8});await confirm(c);assert.equal(c.getSnapshot().writeState,'conflict');assert.equal(c.getSnapshot().base.revision,7);assert.equal(c.getSnapshot().desired,false);assert.equal(c.getSnapshot().current,null);
 await c.refresh();assert.equal(c.getSnapshot().current.revision,8);assert.equal(c.getSnapshot().base.revision,7);assert.equal(c.requestSave(),null);c.reapply();assert.equal(c.getSnapshot().base.revision,8);assert.equal(c.getSnapshot().desired,false);await confirm(c);assert.equal(f.calls.at(-1).command.expectedPolicyRevision,8);assert.equal(c.getSnapshot().current.revision,9);
});
for(const status of [401,403])test('current read '+status+' clears private state and late callbacks',async t=>{
 const f=await controlled(t),{c}=f;await c.refresh();c.edit(false);c.requestSave();const old=c.getSnapshot().confirmation;f.reply({code:'forbidden'},status);await c.refresh();assert.equal(c.getSnapshot().current,null);assert.equal(c.getSnapshot().base,null);assert.equal(c.getSnapshot().desired,null);const before=f.calls.length;await c.confirmSave(old);assert.equal(f.calls.length,before);
});
test('unavailable current read never displays an old policy as current',async t=>{
 const f=await controlled(t),{c}=f;await c.refresh();c.edit(false);f.reply({code:'unavailable'},503);await c.refresh();assert.equal(c.getSnapshot().current,null);assert.equal(c.getSnapshot().desired,false);assert.equal(c.getSnapshot().writable,false);
});
for(const event of ['publish','view','role','generation','owner','day','dispose'])test('held setting retires for actual '+event+' change without false saved',async t=>{
 const f=await controlled(t),{c}=f;await c.refresh();c.edit(false);const h=f.hold(),saving=confirm(c);await h.entered;
 if(event==='publish')f.login({capabilities:{view:true,edit:false,publish:false,confirmPayments:false}});
 if(event==='view')f.runtime.cookie._view.capabilities.view=false;
 if(event==='role')f.runtime.cookie.identity.role='client';
 if(event==='generation')f.runtime.cookie.generation++;
 if(event==='owner')f.login({ownerId:other});
 if(['publish','owner'].includes(event))await f.runtime.restore();
 if(event==='day')f.now(Date.parse('2026-11-02T12:00:00Z'));
 if(event==='dispose')c.dispose();h.resolve();await saving;assert.notEqual(c.getSnapshot().writeState,'saved');
 if(['role','generation','owner','view','dispose'].includes(event))assert.equal(c.getSnapshot().current,null);
});
test('reentrant saving subscriber can retire A and begin B without any A egress/cleanup of B',async t=>{
 const f=await controlled(t),{c}=f;await c.refresh();c.edit(false);let b=null,ran=false;const stop=c.subscribe(()=>{if(!ran&&c.getSnapshot().writeState==='saving'){ran=true;c.edit(true);b=c.refresh();}});await confirm(c);await b;stop();assert.equal(f.calls.filter(x=>x.command.action==='set_sami_approval_policy_v1').length,0);assert.equal(c.getSnapshot().current.revision,7);assert.equal(c.getSnapshot().desired,true);
});
test('offline uncertainty reflects unavailable write authority and status recovery restores actual current authority',async t=>{
 const f=await controlled(t),{c}=f;await c.refresh();c.edit(false);f.reply({code:'unavailable'},503);await confirm(c);assert.equal(c.getSnapshot().writable,false);
 const saved=c.getSnapshot().pending;f.setPolicy({...initial,revision:8,requireKanujApproval:false});f.receipts.set(saved.requestId,f.policy());c.dispose();const {createOwnerPolicyController}=await controllerApi(),replacement=createOwnerPolicyController(f.runtime);t.after(()=>replacement.dispose());
 assert.equal(replacement.getSnapshot().current,null);assert.equal(replacement.getSnapshot().pending.requestId,saved.requestId);await replacement.checkStatus();assert.equal(replacement.getSnapshot().current.revision,8);assert.equal(replacement.getSnapshot().writable,true);
});
for(const bad of [{...initial,revision:99,requireKanujApproval:false},{...initial,revision:8},{...initial,revision:8,ownerActorId:other,requireKanujApproval:false}])test('a shape-valid but mismatching acknowledgement cannot resolve original intent '+JSON.stringify(bad),async t=>{
 const f=await controlled(t),{c}=f;await c.refresh();c.edit(false);f.reply(bad);await confirm(c);assert.equal(c.getSnapshot().writeState,'uncertain');const original=c.getSnapshot().pending;f.reply({status:'committed',receipt:bad});await c.checkStatus();assert.equal(c.getSnapshot().pending,original);assert.equal(c.getSnapshot().writeState,'uncertain');assert.equal(c.getSnapshot().current.revision,7);
});
test('stored receipt resolves only original intent; a fresh policy read supplies current revision after recovery',async t=>{
 const f=await controlled(t),{c}=f;await c.refresh();c.edit(false);const h=f.hold(),saving=confirm(c);await h.entered;c.edit(true);h.resolve();await saving;
 f.setPolicy({...initial,revision:9,requireKanujApproval:true});const before=f.calls.length;await c.checkStatus();assert.equal(c.getSnapshot().pending,null);assert.equal(c.getSnapshot().current.revision,9);assert.deepEqual(f.calls.slice(before).map(x=>x.command.action),['request_status_v1','read_policy_v1']);assert.equal(c.getSnapshot().desired,true);
});
for(const at of [1,2])for(const loss of ['publish','view','deadline'])test('real lease wait '+at+' retires setting before egress on '+loss,async t=>{
 const f=await controlled(t),{c}=f;await c.refresh();c.edit(false);const h=f.holdAcquire(at),saving=confirm(c);await h.entered;
 if(loss==='deadline')f.now(Date.parse('2100-01-01T00:00:00Z'));
 else{f.login({capabilities:{view:loss!=='view',edit:false,publish:false,confirmPayments:false}});if(loss==='view')f.runtime.cookie._view.capabilities.view=false;else await f.runtime.restore();}
 h.resolve();await saving;assert.equal(f.calls.length,1);assert.notEqual(c.getSnapshot().writeState,'saved');if(loss!=='deadline')assert.equal(f.runtime.cookie.status,'ready');
});
for(const failure of [403,409,503])test('retired A '+failure+' cannot erase newer B read/local work',async t=>{
 const f=await controlled(t),{c}=f;await c.refresh();c.edit(false);f.reply({code:'forbidden'},failure);const h=f.hold(),saving=confirm(c);await h.entered;c.edit(true);await c.refresh();c.edit(false);const before=c.getSnapshot();h.resolve();await saving;assert.equal(c.getSnapshot().current,before.current);assert.equal(c.getSnapshot().base,before.base);assert.equal(c.getSnapshot().pending,before.pending);assert.equal(c.getSnapshot().writeState,before.writeState);assert.equal(c.getSnapshot().writable,failure===503?false:before.writable);assert.equal(c.getSnapshot().desired,false);assert.equal(c.getSnapshot().current.revision,7);
});
test('subscriber replacement after original settlement cannot be overwritten by automatic recovery read',async t=>{
 const f=await controlled(t),{c}=f;await c.refresh();c.edit(false);const h=f.hold(),saving=confirm(c);await h.entered;c.edit(true);h.resolve();await saving;
 let ran=false,b;const stop=c.subscribe(()=>{const s=c.getSnapshot();if(!ran&&!s.pending&&s.phase==='unread'){ran=true;c.edit(false);b=c.refresh();}});const before=f.calls.length;await c.checkStatus();await b;stop();assert.equal(f.calls.slice(before).filter(x=>x.command.action==='read_policy_v1').length,1);assert.equal(c.getSnapshot().desired,false);
});
test('disposal is idempotent, retires old callbacks and preserves only dispatched session-owned uncertainty',async t=>{
 const f=await controlled(t),{c}=f;await c.refresh();c.edit(false);c.requestSave();const old=c.getSnapshot().confirmation;c.dispose();c.dispose();const before=f.calls.length;await c.confirmSave(old);await c.refresh();await c.checkStatus();assert.equal(f.calls.length,before);assert.equal(c.getSnapshot().current,null);
});
// Actual React/shared-wrapper SSR and browser-target feature closure, no DOM.
const {build}=await import('esbuild');
const {createRequire}=await import('node:module');
const ssr=await build({tsconfig:'tsconfig.frontend.json',absWorkingDir:new URL('..',import.meta.url).pathname,stdin:{contents:"import React from 'react';import{renderToStaticMarkup}from'react-dom/server';import{OverlayProvider}from'./src/ui/index.ts';import{OwnerPolicy}from'./src/features/advisor/permissions/OwnerPolicy.tsx';export const render=(controller)=>renderToStaticMarkup(React.createElement(OverlayProvider,null,React.createElement(OwnerPolicy,{controller})));",resolveDir:new URL('..',import.meta.url).pathname,loader:'tsx'},bundle:true,write:false,format:'cjs',platform:'node',loader:{'.css':'empty'}});
const ssrModule={exports:{}};new Function('module','exports','require',ssr.outputFiles[0].text)(ssrModule,ssrModule.exports,createRequire(import.meta.url));
const render=ssrModule.exports.render;
test('SSR unread/current/local/uncertain/conflict states use actual controller and shared controls',async t=>{
 const f=await controlled(t),{c}=f;
 let html=render(c);assert.match(html,/workspace permissions/);assert.match(html,/current policy not loaded/);assert.doesNotMatch(html,/policy owner|approval required<\/span>/);
 await c.refresh();html=render(c);assert.match(html,/data-design-frame="503:558"/);assert.match(html,/Sami/);assert.match(html,/Kanuj/);assert.match(html,new RegExp(owner));assert.match(html,/approval required/);assert.match(html,/first-payment checks or section review/);assert.doesNotMatch(html,/manage source access|grant task|fictional demo|success badge|type="file"/);
 c.edit(false);html=render(c);assert.match(html,/requires Kanuj/);assert.doesNotMatch(html,/policy saved/);
 f.reply({code:'unavailable'},503);await confirm(c);html=render(c);assert.match(html,/original change is still uncertain/);assert.match(html,/check result/);assert.match(html,/retry original change/);assert.doesNotMatch(html,/policy saved/);
 await c.checkStatus();f.setPolicy({...initial,revision:9});await confirm(c);await c.refresh();html=render(c);assert.match(html,/your starting policy/);assert.match(html,/current policy/);assert.match(html,/reapply my change/);
});
test('SSR nonowner and denied states do not offer an enabled policy write',async t=>{
 const f=await controlled(t),{c}=f;f.setPolicy({...initial,ownerActorId:other});await c.refresh();c.edit(false);let html=render(c);assert.match(html,/only the current owner/);assert.match(html,/<button[^>]*disabled[^>]*>save policy<\/button>/);
 f.reply({code:'forbidden'},403);await c.refresh();html=render(c);assert.doesNotMatch(html,new RegExp(other));assert.doesNotMatch(html,/data-slot="select-trigger"/);assert.match(html,/do not have access/);
});
test('browser-target build includes the actual complete policy feature/request closure without writing output',async()=>{
 const result=await build({tsconfig:'tsconfig.frontend.json',absWorkingDir:new URL('..',import.meta.url).pathname,entryPoints:['src/app/session.ts','src/features/advisor/permissions/OwnerPolicy.tsx','src/features/advisor/permissions/controller.ts','src/features/advisor/permissions/port.ts','src/app/advisor-policy-request.ts'],outdir:'ignored-owner-policy-build',bundle:true,write:false,metafile:true,format:'esm',platform:'browser',target:'es2022'});
 const inputs=Object.keys(result.metafile.inputs);for(const file of ['src/app/session.ts','site/auth/advisor-cookie-session.js','src/transport/session.ts']){assert.ok(inputs.includes(file),'actual feature closure '+file);}
 assert.ok(inputs.some(p=>p.endsWith('/PortalRebuildValidation.ts')));assert.ok(inputs.some(p=>p.endsWith('/PortalRebuildMapping.ts')));assert.ok(result.outputFiles.length>0);
 const {writeFile}=await import('node:fs/promises');await writeFile(new URL('../../../.local-artifacts/portal-rebuild/w2-owner-policy-ui/feature-build-metafile.json',import.meta.url),JSON.stringify(result.metafile,null,2));
});
test('replacement controller owns the session policy lane; old A confirmation/cleanup cannot dispatch or erase B',async t=>{
 const f=await controlled(t),{c:a}=f;await a.refresh();a.edit(false);a.requestSave();const old=a.getSnapshot().confirmation;
 const {createOwnerPolicyController}=await controllerApi(),b=createOwnerPolicyController(f.runtime);t.after(()=>b.dispose());await b.refresh();const before=f.calls.length;await a.confirmSave(old);assert.equal(f.calls.length,before);assert.equal(a.getSnapshot().current,null);
 b.edit(false);f.reply({code:'unavailable'},503);await confirm(b);const intent=b.getSnapshot().pending;a.dispose();const next=createOwnerPolicyController(f.runtime);t.after(()=>next.dispose());assert.equal(next.getSnapshot().pending.requestId,intent.requestId);
});
test('private snapshot is rechecked after synchronous notification replaces its controller owner',async t=>{
 const f=await controlled(t),{c:a}=f;await a.refresh();const {createOwnerPolicyController}=await controllerApi();let b;const stop=a.subscribe(()=>{if(!b){b=createOwnerPolicyController(f.runtime);t.after(()=>b.dispose());}});
 f.runtime.cookie._view.capabilities.publish=false;const snapshot=a.getSnapshot();stop();assert.equal(snapshot.current,null);assert.equal(snapshot.base,null);assert.equal(snapshot.desired,null);
});
test('a throwing reentrant notification cannot turn local retirement into shared-cookie failure or A egress',async t=>{
 const f=await controlled(t),{c}=f;await c.refresh();c.edit(false);let ran=false,b;const stop=c.subscribe(()=>{if(!ran&&c.getSnapshot().writeState==='saving'){ran=true;c.edit(true);b=c.refresh();throw Error('synthetic subscriber failure');}});await confirm(c);await b;stop();assert.equal(f.calls.filter(x=>x.command.action==='set_sami_approval_policy_v1').length,0);assert.equal(f.runtime.cookie.status,'ready');assert.equal(c.getSnapshot().current.revision,7);assert.equal(c.getSnapshot().desired,true);
});
for(const failure of [403,503,200])test('failed current read '+failure+' retires the port owner basis before any later setting',async t=>{
 const f=await fixture(t),p=port(f);await p.execute(read);f.reply(failure===200?{malformed:true}:{code:'unavailable'},failure);await assert.rejects(p.execute(read));if(f.runtime.cookie.status!=='ready')await f.runtime.restore();const before=f.calls.length;await assert.rejects(p.execute(set()),e=>e.status===403);assert.equal(f.calls.length,before);
});
test('stale failed read cannot erase a newer successful policy port basis',async t=>{
 const f=await fixture(t),p=port(f);f.reply({code:'forbidden'},403);const h=f.hold(),a=p.execute(read),rejected=assert.rejects(a);await h.entered;await p.execute(read);h.resolve();await rejected;await p.execute(set());assert.equal(f.policy().revision,8);
});
test('stale successful read cannot replace the newer policy port owner basis',async t=>{
 const f=await fixture(t),p=port(f);f.reply({...initial,ownerActorId:other});const h=f.hold(),a=p.execute(read),rejected=assert.rejects(a,e=>e.status===503);await h.entered;await p.execute(read);h.resolve();await rejected;await p.execute(set());assert.equal(f.policy().revision,8);assert.equal(f.runtime.cookie.status,'ready');
});
