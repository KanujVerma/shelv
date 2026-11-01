// OP1 source-only regression. Actual runtime/cookie/Root codecs; HTTP facts are synthetic.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createApplicationSession} from '../src/app/session.ts';
import {createOwnerPolicyController} from '../src/features/advisor/permissions/controller.ts';
import {readPlanCommand,buildPlanRpc} from '../../../src/contracts/PortalRebuildValidation.ts';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
globalThis.fetch=async()=>{throw Error('external network denied for OP1');};
const actor='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222';
const start={revision:7,ownerActorId:actor,requireKanujApproval:true};
const deferred=()=>{let enter,release;return{entered:new Promise(r=>enter=r),wait:new Promise(r=>release=r),enter:()=>enter(),release:()=>release()};};
async function actual(t){
 let policy={...start},next=null,hold=null;
 let login={signedIn:true,ownerId:actor,generation:1,csrf:'op1-synthetic-csrf',capabilities:{view:true,edit:true,publish:true,confirmPayments:false},idleExpiresAt:'2026-11-01T20:00:00Z',absoluteExpiresAt:'2026-11-02T00:00:00Z'};
 const calls=[],receipts=new Map();
 const runtime=createApplicationSession({audience:'advisor',now:()=>Date.parse('2026-11-01T12:00:00Z'),locks:{request:async(_name,_options,run)=>run()},fetcher:async(url,init)=>{
  assert.ok(['/api/advisor/session','/api/advisor/plans'].includes(url),'closed finite synthetic HTTP');
  assert.equal(init.credentials,'same-origin');assert.equal(init.cache,'no-store');assert.equal(init.redirect,'error');
  assert.equal(new Headers(init.headers).has('authorization'),false);assert.equal(new Headers(init.headers).has('apikey'),false);
  if(url.endsWith('/session'))return Response.json(login);
  assert.equal(new Headers(init.headers).get('x-shelv-csrf'),login.csrf);
  const command=readPlanCommand(JSON.parse(init.body));assert.equal(buildPlanRpc(command).name,'concierge_plan_command_v1');calls.push({command,wire:init.body});
  const custom=next;next=null;let data,status=200;
  if(custom){data=custom.data;status=custom.status;}
  else if(command.action==='read_policy_v1')data={...policy};
  else if(command.action==='request_status_v1')data=receipts.has(command.requestId)?{status:'committed',receipt:receipts.get(command.requestId)}:{status:'absent'};
  else{
   assert.equal(command.action,'set_sami_approval_policy_v1');assert.equal(command.confirmed,true);
   if(receipts.has(command.requestId))data=receipts.get(command.requestId);
   else if(command.expectedPolicyRevision!==policy.revision){data={code:'revision_conflict'};status=409;}
   else{policy={...policy,revision:policy.revision+1,requireKanujApproval:command.requireKanujApproval};data={...policy};receipts.set(command.requestId,data);}
  }
  if(hold){const captured=hold;hold=null;captured.enter();await captured.wait;}
  return Response.json(data,{status});
 }});
 await runtime.restore();const c=createOwnerPolicyController(runtime);t.after(()=>{c.dispose();runtime.dispose();});
 return{runtime,c,calls,receipts,settings:()=>calls.filter(x=>x.command.action==='set_sami_approval_policy_v1'),setPolicy:value=>policy={...value},getPolicy:()=>policy,reply:(data,status=200)=>next={data,status},setLogin:value=>login={...login,...value},hold(){hold=deferred();return hold;}};
}
async function changed(f,value=true,revision=8){await f.c.refresh();f.c.edit(false);f.setPolicy({...start,revision,requireKanujApproval:value});await f.c.refresh();}
async function save(c){const token=c.requestSave();assert.ok(token,'separate save must offer exact confirmation');return c.confirmSave(token);}

test('same-revision refresh retains unsent work and the separate confirmation',async t=>{
 const f=await actual(t);await f.c.refresh();const base=f.c.getSnapshot().base;f.c.edit(false);await f.c.refresh();const s=f.c.getSnapshot();assert.equal(s.base,base);assert.equal(s.desired,false);assert.equal(s.writeState,'idle');assert.equal(f.settings().length,0);const token=f.c.requestSave();assert.ok(token);assert.equal(f.settings().length,0);await f.c.confirmSave(token);assert.equal(f.c.getSnapshot().current.requireKanujApproval,false);
});
test('OP1 refresh enters existing comparison while preserving base and desired until deliberate reapply',async t=>{
 const f=await actual(t);await changed(f);const s=f.c.getSnapshot();assert.equal(s.writeState,'conflict');assert.equal(s.current.revision,8);assert.equal(s.base.revision,7);assert.equal(s.desired,false);assert.equal(s.pending,null);assert.equal(s.confirmation,null);assert.equal(f.c.requestSave(),null);assert.equal(f.settings().length,0);
 f.c.reapply();assert.equal(f.c.getSnapshot().base.revision,8);assert.equal(f.c.getSnapshot().desired,false);assert.equal(f.c.getSnapshot().confirmation,null);assert.equal(f.settings().length,0);const token=f.c.requestSave();assert.ok(token);assert.equal(f.settings().length,0);await f.c.confirmSave(token);const write=f.settings()[0].command;assert.equal(write.expectedPolicyRevision,8);assert.equal(write.requireKanujApproval,false);assert.equal(write.confirmed,true);assert.match(write.requestId,/^[0-9a-f-]{36}$/);assert.equal(f.c.getSnapshot().current.revision,9);
});
test('newer current value already matching desired needs no extra write or false saved claim',async t=>{
 const f=await actual(t);await changed(f,false);assert.equal(f.c.getSnapshot().writeState,'conflict');assert.equal(f.c.getSnapshot().base.revision,7);assert.equal(f.c.getSnapshot().desired,false);assert.equal(f.c.requestSave(),null);f.c.reapply();const s=f.c.getSnapshot();assert.equal(s.base.revision,8);assert.equal(s.current.requireKanujApproval,s.desired);assert.equal(s.writeState,'idle');assert.match(s.message,/already matches/);assert.doesNotMatch(s.message,/saved|ready to.*save/);assert.equal(f.c.requestSave(),null);assert.equal(f.settings().length,0);
});
test('repeated fresh reads keep the original comparison base and never mint a setting intent',async t=>{
 const f=await actual(t);await changed(f);await f.c.refresh();f.setPolicy({...start,revision:9});await f.c.refresh();const s=f.c.getSnapshot();assert.equal(s.writeState,'conflict');assert.equal(s.base.revision,7);assert.equal(s.current.revision,9);assert.equal(s.desired,false);assert.equal(s.pending,null);assert.equal(s.confirmation,null);assert.equal(f.settings().length,0);f.c.reapply();assert.equal(f.c.getSnapshot().base.revision,9);
});
test('fresh policy without unsent local work replaces its ordinary read basis without a conflict',async t=>{
 const f=await actual(t);await f.c.refresh();f.setPolicy({...start,revision:8,requireKanujApproval:false});await f.c.refresh();const s=f.c.getSnapshot();assert.equal(s.base.revision,8);assert.equal(s.desired,false);assert.equal(s.writeState,'idle');assert.equal(f.c.requestSave(),null);assert.equal(f.settings().length,0);
});
test('refresh retires the earlier confirmation before comparison and preserves the new revision guard',async t=>{
 const f=await actual(t);await f.c.refresh();f.c.edit(false);const old=f.c.requestSave();f.setPolicy({...start,revision:8});await f.c.refresh();assert.equal(f.c.getSnapshot().writeState,'conflict');assert.equal(await f.c.confirmSave(old),false);assert.equal(f.settings().length,0);f.c.reapply();const next=f.c.requestSave();assert.notEqual(next,old);assert.equal(f.settings().length,0);await f.c.confirmSave(next);assert.equal(f.settings()[0].command.expectedPolicyRevision,8);
});
test('original explicit409 still requires actual refresh, reapply and separate new confirmation',async t=>{
 const f=await actual(t);await f.c.refresh();f.c.edit(false);f.setPolicy({...start,revision:8});await save(f.c);const rejected=f.settings()[0].command.requestId;assert.equal(f.c.getSnapshot().writeState,'conflict');assert.equal(f.c.getSnapshot().current,null);assert.equal(f.c.getSnapshot().base.revision,7);await f.c.refresh();assert.equal(f.c.getSnapshot().current.revision,8);f.c.reapply();assert.equal(f.settings().length,1);const token=f.c.requestSave();assert.ok(token);assert.equal(f.settings().length,1);await f.c.confirmSave(token);assert.notEqual(f.settings()[1].command.requestId,rejected);assert.equal(f.settings()[1].command.expectedPolicyRevision,8);
});
test('read racing a potentially committed setting preserves exact uncertainty and status receipt ownership',async t=>{
 const f=await actual(t);await f.c.refresh();f.c.edit(false);const hold=f.hold(),saving=save(f.c);await hold.entered;const wire=f.settings()[0].wire;f.c.edit(true);const intent=f.c.getSnapshot().pending;f.setPolicy({...start,revision:9});await f.c.refresh();assert.equal(f.c.getSnapshot().writeState,'uncertain');assert.equal(f.c.getSnapshot().pending,intent);assert.equal(f.c.getSnapshot().base.revision,7);assert.equal(f.c.getSnapshot().current.revision,9);f.c.reapply();assert.equal(f.c.getSnapshot().base.revision,7);assert.equal(f.c.requestSave(),null);hold.release();await saving;assert.equal(f.c.getSnapshot().pending,intent);assert.equal(f.settings()[0].wire,wire);
 await f.c.checkStatus();const s=f.c.getSnapshot();assert.equal(s.pending,null);assert.equal(s.current.revision,9);assert.equal(s.base.revision,8);assert.equal(s.desired,true);assert.equal(s.writeState,'conflict');assert.equal(f.calls.find(x=>x.command.action==='request_status_v1').command.requestId,intent.requestId);assert.equal(f.settings().length,1);f.c.reapply();assert.equal(f.c.requestSave(),null);assert.equal(f.settings().length,1);
});
test('absent original status remains distinct; a later fresh read offers deliberate reapply of unsent work',async t=>{
 const f=await actual(t);await f.c.refresh();f.c.edit(false);f.reply({code:'unavailable'},503);await save(f.c);const intent=f.c.getSnapshot().pending;f.setPolicy({...start,revision:8});await f.c.refresh();assert.equal(f.c.getSnapshot().writeState,'uncertain');assert.equal(f.c.getSnapshot().pending,intent);f.c.reapply();assert.equal(f.c.getSnapshot().base.revision,7);await f.c.checkStatus();assert.equal(f.c.getSnapshot().writeState,'absent');assert.equal(f.c.getSnapshot().pending,null);await f.c.refresh();assert.equal(f.c.getSnapshot().writeState,'conflict');f.c.reapply();const token=f.c.requestSave();assert.ok(token);await f.c.confirmSave(token);assert.notEqual(f.settings()[1].command.requestId,intent.requestId);assert.equal(f.settings()[1].command.expectedPolicyRevision,8);
});
test('original retry keeps its exact UUID/wire while refreshing actual current policy after acknowledgement',async t=>{
 const f=await actual(t);await f.c.refresh();f.c.edit(false);f.reply({code:'unavailable'},503);await save(f.c);const wire=f.settings()[0].wire,intent=f.c.getSnapshot().pending;await f.c.refresh();assert.equal(f.c.getSnapshot().pending,intent);assert.equal(f.c.getSnapshot().writeState,'uncertain');await f.c.retryOriginal();assert.equal(f.settings()[1].wire,wire);assert.equal(f.c.getSnapshot().pending,null);assert.equal(f.c.getSnapshot().current.revision,8);assert.equal(f.c.getSnapshot().writeState,'saved');
});
test('new read policy owner remains authoritative for comparison and cannot be locally reapplied by the old actor',async t=>{
 const f=await actual(t);await f.c.refresh();f.c.edit(false);f.setPolicy({...start,revision:8,ownerActorId:other});await f.c.refresh();assert.equal(f.c.getSnapshot().writeState,'conflict');assert.equal(f.c.getSnapshot().writable,false);f.c.reapply();assert.equal(f.c.getSnapshot().base.revision,7);assert.equal(f.c.requestSave(),null);assert.equal(f.settings().length,0);
});
for(const loss of ['role','view','session','dispose'])test('conflict notification respects actual '+loss+' loss before later callbacks',async t=>{
 const f=await actual(t);await f.c.refresh();f.c.edit(false);const old=f.c.requestSave();let observed=false;const stop=f.c.subscribe(()=>{if(observed||f.c.getSnapshot().writeState!=='conflict')return;observed=true;if(loss==='role')f.runtime.cookie.identity.role='client';if(loss==='view')f.runtime.cookie._view.capabilities.view=false;if(loss==='session')f.runtime.cookie._end();if(loss==='dispose')f.c.dispose();});f.setPolicy({...start,revision:8});await f.c.refresh();stop();assert.equal(observed,true);assert.equal(f.c.getSnapshot().current,null);assert.equal(f.c.getSnapshot().base,null);assert.equal(f.c.getSnapshot().desired,null);assert.equal(await f.c.confirmSave(old),false);assert.equal(f.settings().length,0);
});
test('owner-session replacement at conflict notification retires A and leaves the actual new session available for B',async t=>{
 const f=await actual(t);await f.c.refresh();f.c.edit(false);let observed=false,switched;const stop=f.c.subscribe(()=>{if(observed||f.c.getSnapshot().writeState!=='conflict')return;observed=true;f.setLogin({ownerId:other,csrf:'op1-other-owner'});switched=f.runtime.restore();});f.setPolicy({...start,revision:8});await f.c.refresh();await switched;stop();assert.equal(observed,true);assert.equal(f.c.getSnapshot().current,null);f.setPolicy({...start,revision:8,ownerActorId:other});const b=createOwnerPolicyController(f.runtime);t.after(()=>b.dispose());await b.refresh();assert.equal(b.getSnapshot().current.ownerActorId,other);assert.equal(b.getSnapshot().writable,true);assert.equal(f.settings().length,0);
});
test('reentrant read and throwing conflict subscriber cannot overwrite the newer comparison B',async t=>{
 const f=await actual(t);await f.c.refresh();f.c.edit(false);let observed=false,b;const stop=f.c.subscribe(()=>{if(observed||f.c.getSnapshot().writeState!=='conflict')return;observed=true;f.setPolicy({...start,revision:9});b=f.c.refresh();throw Error('synthetic conflict subscriber');});f.setPolicy({...start,revision:8});await f.c.refresh();await b;stop();const s=f.c.getSnapshot();assert.equal(observed,true);assert.equal(s.current.revision,9);assert.equal(s.base.revision,7);assert.equal(s.desired,false);assert.equal(s.writeState,'conflict');assert.equal(f.settings().length,0);assert.equal(f.runtime.cookie.status,'ready');f.c.reapply();assert.equal(f.c.getSnapshot().base.revision,9);
});

const bundled=await build({absWorkingDir:new URL('..',import.meta.url).pathname,tsconfig:'tsconfig.frontend.json',stdin:{contents:"import React from 'react';import{renderToStaticMarkup}from'react-dom/server';import{OverlayProvider}from'./src/ui/index.ts';import{OwnerPolicy}from'./src/features/advisor/permissions/OwnerPolicy.tsx';export const render=c=>renderToStaticMarkup(React.createElement(OverlayProvider,null,React.createElement(OwnerPolicy,{controller:c})));",resolveDir:new URL('..',import.meta.url).pathname,loader:'tsx'},bundle:true,write:false,format:'cjs',platform:'node',loader:{'.css':'empty'}});
const ssr={exports:{}};new Function('module','exports','require',bundled.outputFiles[0].text)(ssr,ssr.exports,createRequire(import.meta.url));
test('actual shared UI SSR exposes comparison and disables Save until existing deliberate reapply',async t=>{
 const f=await actual(t);await changed(f);const markup=ssr.exports.render(f.c);assert.match(markup,/your starting policy:.*revision 7/);assert.match(markup,/current policy:.*revision 8/);assert.match(markup,/your change: approval not required/);assert.match(markup,/reapply my change/);assert.match(markup,/<button[^>]*disabled[^>]*>save policy<\/button>/);assert.equal(f.settings().length,0);f.c.reapply();assert.match(ssr.exports.render(f.c),/your change is ready to review and save/);assert.equal(f.settings().length,0);
});
test('actual shared UI SSR reports an already-current value without a false saved claim',async t=>{
 const f=await actual(t);await changed(f,false);f.c.reapply();const markup=ssr.exports.render(f.c);assert.match(markup,/current policy already matches your change/);assert.match(markup,/<button[^>]*disabled[^>]*>save policy<\/button>/);assert.doesNotMatch(markup,/policy saved/);assert.equal(f.settings().length,0);
});
