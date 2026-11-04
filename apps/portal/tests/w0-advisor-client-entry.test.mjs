// Actual runtime, canonical navigator, fixed scoped port and reviewed feature.
// HTTP replies and Window are isolated finite source fixtures. No browser/DB.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createApplicationSession} from '../src/app/session.ts';
import {createPortalNavigator} from '../src/navigation/history.ts';
import {buildRoute} from '../src/navigation/routes.ts';
import {virtualNavigationWindow} from './rebuild-app-v3-history-helper.mjs';
import {ids,stamp} from './rebuild/advisor-fixture.mjs';
const source=()=>import('../src/app/advisor-client-entry.ts');
const row=()=>({id:ids.draft,clientId:ids.client,state:'working',contentRevision:1,assignmentRevision:1,savedAt:stamp});
const page=(cursor=null,drafts=[])=>({drafts,publications:[],nextCursor:cursor});
function deferred(){let resolve;return{promise:new Promise(r=>resolve=r),resolve:value=>resolve(value)};}
async function setup(t){
 const bc=globalThis.BroadcastChannel;globalThis.BroadcastChannel=undefined;t.after(()=>{globalThis.BroadcastChannel=bc;});
 let reply=()=>Response.json(page()),login={signedIn:true,ownerId:ids.actor,generation:1,csrf:'synthetic-client-entry',capabilities:{view:true,edit:true,publish:false,confirmPayments:false},idleExpiresAt:'2099-01-01T00:00:00Z',absoluteExpiresAt:'2099-01-02T00:00:00Z'};const calls=[];
 const runtime=createApplicationSession({audience:'advisor',locks:{request:async(_n,_o,run)=>run()},fetcher:async(url,init)=>{
  if(url==='/api/advisor/session')return Response.json(login);
  assert.equal(url,'/api/advisor/plans');const command=JSON.parse(init.body);assert.equal(command.action,'list_plans_v1');assert.equal(command.clientId,ids.client);assert.equal(new Headers(init.headers).get('X-Shelv-CSRF'),login.csrf);calls.push(command);return reply(command);
 }});await runtime.restore();t.after(()=>runtime.dispose());
 const {win}=virtualNavigationWindow(buildRoute({name:'advisor-client',clientId:ids.client})),navigation=createPortalNavigator(win,{scopeKey:runtime.getSnapshot().boundary.key});t.after(()=>navigation.dispose());
 const api=await source(),entry=api.createAdvisorClientEntry(runtime,navigation,ids.client);t.after(()=>entry.dispose());
 return {runtime,navigation,entry,api,calls,set(fn){reply=fn;},login(patch){login={...login,...patch};}};
}
test('construction and activation are inert until the feature requests its scoped page',async t=>{
 const f=await setup(t);assert.equal(f.entry.getSnapshot().phase,'idle');f.entry.start();assert.equal(f.calls.length,0);assert.equal(f.entry.getSnapshot().controller.getSnapshot().phase,'idle');
 await f.entry.getSnapshot().controller.refresh();assert.deepEqual(f.calls.map(c=>[c.clientId,c.cursor]),[[ids.client,null]]);
});
test('later scoped pages find a working draft without a global client/draft scan',async t=>{
 const f=await setup(t),cursor='d:'+ids.draft;f.set(c=>Response.json(c.cursor===null?page(cursor):page(null,[row()])));f.entry.start();const c=f.entry.getSnapshot().controller;
 await c.refresh();assert.equal(c.getSnapshot().complete,false);assert.equal(c.getSnapshot().directory.drafts.length,0);
 await c.loadMore();assert.equal(c.getSnapshot().complete,true);assert.equal(c.getSnapshot().directory.drafts[0].id,ids.draft);assert.deepEqual(f.calls.map(c=>[c.clientId,c.cursor]),[[ids.client,null],[ids.client,cursor]]);
});
test('leaving a client route retires its private read before a held reply settles',async t=>{
 const f=await setup(t),entered=deferred(),held=deferred();t.after(()=>held.resolve());f.set(async()=>{entered.resolve();await held.promise;return Response.json(page(null,[row()]));});f.entry.start();const old=f.entry.getSnapshot().controller,pending=old.refresh();await entered.promise;
 f.navigation.navigate({name:'advisor-client',clientId:ids.other});assert.equal(f.entry.getSnapshot().controller,null);held.resolve();await pending;assert.equal(old.getSnapshot().directory,null);assert.equal(f.entry.getSnapshot().phase,'inactive');
});
test('a previously stopped entry cannot replace a newer same-route owner',async t=>{
 const f=await setup(t);f.entry.start();f.entry.stop();const next=f.api.createAdvisorClientEntry(f.runtime,f.navigation,ids.client);t.after(()=>next.dispose());next.start();f.entry.start();assert.equal(f.entry.getSnapshot().phase,'ended');assert.equal(next.getSnapshot().phase,'active');
});
test('actual session replacement clears the entry and loaded private rows',async t=>{
 const f=await setup(t);f.set(()=>Response.json(page(null,[row()])));f.entry.start();const c=f.entry.getSnapshot().controller;await c.refresh();f.login({ownerId:ids.other,generation:2,csrf:'replacement'});await f.runtime.restore();assert.equal(f.entry.getSnapshot().phase,'ended');assert.equal(c.getSnapshot().directory,null);
});
test('ordinary same-session restore preserves the entry and rereads through the actual fixed port',async t=>{
 const f=await setup(t);f.entry.start();const c=f.entry.getSnapshot().controller;await c.refresh();await f.runtime.restore();assert.equal(f.entry.getSnapshot().controller,c);await c.refresh();assert.equal(f.calls.length,2);
});
test('only a current loaded draft may open an editor, with no business command',async t=>{
 const f=await setup(t);f.set(()=>Response.json(page(null,[row()])));f.entry.start();const rendered=f.entry.getSnapshot();await rendered.controller.refresh();f.entry.openDraft(rendered,ids.other);assert.equal(f.navigation.getSnapshot(),buildRoute({name:'advisor-client',clientId:ids.client}));
 const before=f.calls.length;f.entry.openDraft(rendered,ids.draft);assert.equal(f.navigation.getSnapshot(),buildRoute({name:'advisor-editor',draftId:ids.draft,section:'sources'}));assert.equal(f.calls.length,before);assert.equal(f.entry.getSnapshot().controller,null);
});
test('a current server denial cannot be represented as no working draft',async t=>{
 const f=await setup(t);f.set(()=>Response.json({code:'forbidden'},{status:403}));f.entry.start();const c=f.entry.getSnapshot().controller;await c.refresh();assert.equal(c.getSnapshot().phase,'denied');assert.equal(c.getSnapshot().directory,null);assert.equal(c.getSnapshot().complete,false);
});
test('disposal clears entry ownership before entry observers run',async t=>{
 const f=await setup(t);f.entry.start();let seen;f.entry.subscribe(()=>{seen=f.entry.getSnapshot();});f.entry.dispose();assert.equal(seen.controller,null);assert.equal(seen.phase,'ended');
});
test('reentrant activation observers can stop the entry before any metadata dispatch',async t=>{
 const f=await setup(t);f.entry.subscribe(()=>{if(f.entry.getSnapshot().phase==='active')f.entry.stop();});f.entry.start();assert.equal(f.entry.getSnapshot().controller,null);assert.equal(f.entry.getSnapshot().phase,'idle');assert.equal(f.calls.length,0);
});
test('offline lifetime-current cookies cannot open an editor from an old render',async t=>{
 const f=await setup(t);f.set(()=>Response.json(page(null,[row()])));f.entry.start();const state=f.entry.getSnapshot();await state.controller.refresh();const path=f.navigation.getSnapshot();f.runtime.cookie.status='offline';assert.equal(f.runtime.getSnapshot().boundary.isCurrent(),true);f.entry.openDraft(state,ids.draft);assert.equal(f.navigation.getSnapshot(),path);
});
