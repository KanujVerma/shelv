// New bounded client-context consumer: actual cookie/session + synthetic fixed HTTP + SSR only.
import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
import {createApplicationSession} from '../src/app/session.ts';
import {advisorCookieRequest} from '../src/app/retained.ts';
import {mapPlanResult} from '../../../src/contracts/PortalRebuildMapping.ts';
import {ids} from './rebuild/advisor-fixture.mjs';
const out=new URL('../../../.local-artifacts/w2/client-workspace-ssr.cjs',import.meta.url);await mkdir(new URL('.',out),{recursive:true});
await build({absWorkingDir:new URL('..',import.meta.url).pathname,tsconfig:'tsconfig.frontend.json',stdin:{contents:`import React from 'react';import{renderToStaticMarkup}from'react-dom/server';import * as api from './src/features/advisor/index.ts';export * from './src/features/advisor/index.ts';export const render=(props)=>renderToStaticMarkup(React.createElement(api.ClientWorkspace,props));`,resolveDir:new URL('..',import.meta.url).pathname,loader:'tsx'},outfile:out.pathname,platform:'node',format:'cjs',bundle:true,loader:{'.css':'empty'}});
const api=createRequire(import.meta.url)(out.pathname);
const empty=(nextCursor=null)=>({nextCursor,drafts:[],publications:[]});
const draft=(id=ids.draft,clientId=ids.client)=>({id,clientId,state:'working',contentRevision:1,assignmentRevision:1,savedAt:'2026-11-03T12:00:00Z'});
const publication=(clientId=ids.client)=>({clientId,version:1,publishedAt:'2026-11-03T12:00:00Z',documentSchemaVersion:3});
const nextCursor='d:'+ids.other;
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return{promise,resolve};};
async function setup(t){
 assert.equal(typeof api.createAdvisorClientWorkspaceController,'function');assert.equal(typeof api.ClientWorkspace,'function');
 let response=()=>empty();const commands=[],inputs=[];
 const runtime=createApplicationSession({audience:'advisor',locks:{request:async(_n,_o,run)=>run()},fetcher:async(url,init)=>{
  if(url==='/api/advisor/session')return Response.json({signedIn:true,ownerId:ids.actor,generation:1,csrf:'SYNTHETIC-client-context',capabilities:{view:true,edit:false,publish:false,confirmPayments:false},idleExpiresAt:'2099-01-01T00:00:00Z',absoluteExpiresAt:'2099-01-02T00:00:00Z'});
  if(url==='/api/advisor/logout')return Response.json({ok:true});
  assert.equal(url,'/api/advisor/plans');const command=JSON.parse(init.body);assert.equal(command.action,'list_plans_v1');assert.equal(command.clientId,ids.client);commands.push(command);
  const value=await response(command);return value instanceof Response?value:Response.json(value);
 }});t.after(()=>runtime.dispose());await runtime.restore();
 const request=advisorCookieRequest('plans',runtime.cookie);
 const readPlans={async execute(input,options){assert.deepEqual(Object.keys(input).sort(),['cursor','limit']);inputs.push({input:structuredClone(input),options});const command={schemaVersion:1,action:'list_plans_v1',clientId:ids.client,...input};return mapPlanResult(await request(command,options),command);}};
 const c=api.createAdvisorClientWorkspaceController({runtime,clientId:ids.client,readPlans});t.after(()=>c.dispose());
 return{c,runtime,readPlans,commands,inputs,respond(fn){response=fn},html(props={}){return api.render({controller:c,...props});}};
}
test('unknown client identity is honest and only a completed scoped empty record permits bounded absence copy',async t=>{
 const h=await setup(t);assert.match(h.html(),/client workspace/);assert.doesNotMatch(h.html(),/no working draft|untitled|client not found/);
 await h.c.refresh();assert.equal(h.c.getSnapshot().complete,true);assert.match(h.html(),/no working draft in the loaded record/);assert.match(h.html(),/refresh to check for changes/);assert.equal(h.commands.length,1);
});
test('an empty first page with a continuation cannot imply no working draft',async t=>{
 const h=await setup(t);h.respond(c=>c.cursor===null?empty(nextCursor):{...empty(),drafts:[draft()]});await h.c.refresh();assert.equal(h.c.getSnapshot().complete,false);assert.doesNotMatch(h.html(),/no working draft/);assert.match(h.html(),/load more plan records/);
 await h.c.loadMore();assert.equal(h.c.getSnapshot().directory.drafts[0].id,ids.draft);assert.equal(h.c.getSnapshot().complete,true);assert.doesNotMatch(h.html(),/no working draft/);assert.deepEqual(h.inputs.map(x=>x.input),[{cursor:null,limit:25},{cursor:nextCursor,limit:25}]);
});
test('publication identity is not a working draft and version navigation requires the actual callback',async t=>{
 const h=await setup(t);h.respond(()=>({...empty(),publications:[publication()]}));await h.c.refresh();assert.match(h.html(),/no working draft in the loaded record/);assert.doesNotMatch(h.html(),/>read version 1</);assert.match(h.html({onOpenPublication(){}}),/>read version 1</);assert.doesNotMatch(h.html(),/current publication|payment verified|reviewed/);
});
test('filter feedback is explicitly limited to loaded records and never removes pagination',async t=>{
 const h=await setup(t);h.respond(()=>({...empty(nextCursor),drafts:[draft()]}));await h.c.refresh();h.c.setFilter('not-on-this-page');assert.match(h.html(),/no matches in the loaded plan records/);assert.match(h.html(),/load more plan records/);assert.doesNotMatch(h.html(),/no working draft/);h.c.setFilter('');assert.doesNotMatch(h.html(),/no matches/);
});
test('refresh invalidates EOF absence before waiting and a transient failure is explicitly stale',async t=>{
 const h=await setup(t);await h.c.refresh();const wait=deferred();h.respond(()=>wait.promise);const pending=h.c.refresh();assert.equal(h.c.getSnapshot().phase,'loading');assert.equal(h.c.getSnapshot().complete,false);assert.doesNotMatch(h.html(),/no working draft/);wait.resolve(Response.json({code:'unavailable'},{status:409}));await pending;assert.equal(h.c.getSnapshot().phase,'error');assert.match(h.html(),/loaded records may be out of date/);assert.doesNotMatch(h.html(),/no working draft/);
});
test('failed next-page reads preserve clearly stale rows and retry the same scoped cursor',async t=>{
 const h=await setup(t);h.respond(c=>c.cursor===null?{...empty(nextCursor),drafts:[draft()]}:Response.json({code:'unavailable'},{status:409}));await h.c.refresh();await h.c.loadMore();assert.equal(h.c.getSnapshot().directory.drafts.length,1);assert.equal(h.c.getSnapshot().phase,'error');assert.match(h.html(),/loaded records may be out of date/);
 h.respond(()=>empty());await h.c.retry();assert.deepEqual(h.inputs.map(x=>x.input.cursor),[null,nextCursor,nextCursor]);assert.equal(h.c.getSnapshot().phase,'ready');assert.equal(h.c.getSnapshot().directory.drafts.length,1);
});
test('denial clears loaded private rows and the supplied private name',async t=>{
 const h=await setup(t);h.respond(()=>({...empty(),drafts:[draft()]}));await h.c.refresh();h.respond(()=>Response.json({code:'forbidden'},{status:403}));await h.c.refresh();assert.equal(h.c.getSnapshot().directory,null);assert.equal(h.c.getSnapshot().phase,'denied');assert.doesNotMatch(h.html({clientName:'Private Synthetic Name'}),/Private Synthetic Name|no working draft/);
});
test('a foreign-client row is unavailable rather than silently filtered or returned',async t=>{
 const h=await setup(t);h.respond(()=>({...empty(),drafts:[draft(ids.draft,ids.other)]}));await h.c.refresh();assert.equal(h.c.getSnapshot().phase,'error');assert.equal(h.c.getSnapshot().directory,null);assert.doesNotMatch(h.html(),new RegExp(ids.other));
});
test('a foreign-client publication is rejected without a guessed client or version link',async t=>{
 const h=await setup(t);h.respond(()=>({...empty(),publications:[publication(ids.other)]}));await h.c.refresh();assert.equal(h.c.getSnapshot().directory,null);assert.equal(h.c.getSnapshot().complete,false);assert.doesNotMatch(h.html({onOpenPublication(){}}),/read version/);
});
test('a current401 retires the private projection instead of claiming absence',async t=>{
 const h=await setup(t);h.respond(()=>Response.json({code:'unauthorized'},{status:401}));await h.c.refresh();assert.equal(h.c.getSnapshot().phase,'ended');assert.equal(h.c.getSnapshot().directory,null);assert.doesNotMatch(h.html(),/no working draft/);
});
test('logout discards a delayed successful read and aborts its options',{timeout:5000},async t=>{
 const h=await setup(t),started=deferred(),wait=deferred();h.respond(()=>{started.resolve();return wait.promise;});const pending=h.c.refresh();await started.promise;await h.runtime.signOut();wait.resolve({...empty(),drafts:[draft()]});await pending;assert.equal(h.c.getSnapshot().phase,'ended');assert.equal(h.c.getSnapshot().directory,null);assert.equal(h.inputs[0].options.signal.aborted,true);assert.equal(h.inputs[0].options.isApplicable(),false);
});
test('a newer refresh wins without old cleanup settling the new loading operation',{timeout:5000},async t=>{
 const h=await setup(t),first=deferred(),second=deferred(),enteredFirst=deferred(),enteredSecond=deferred();let n=0;h.respond(()=>{n++;if(n===1){enteredFirst.resolve();return first.promise;}enteredSecond.resolve();return second.promise;});const old=h.c.refresh();await enteredFirst.promise;const current=h.c.refresh();await enteredSecond.promise;first.resolve({...empty(),drafts:[draft()]});await old;assert.equal(h.c.getSnapshot().phase,'loading');assert.equal(h.c.getSnapshot().directory,null);second.resolve(empty());await current;assert.equal(h.c.getSnapshot().complete,true);assert.equal(h.c.getSnapshot().directory.drafts.length,0);
});
test('a loading observer can retire the actual session before dispatch',async t=>{
 const h=await setup(t);const off=h.c.subscribe(()=>{if(h.c.getSnapshot().phase==='loading')h.runtime.cookie._end();});t.after(off);await h.c.refresh();assert.equal(h.commands.length,0);assert.equal(h.c.getSnapshot().phase,'ended');
});
test('a successful port result after actual suspension cannot become a private projection',async t=>{
 const h=await setup(t),read=h.readPlans.execute;h.respond(()=>({...empty(),drafts:[draft()]}));h.readPlans.execute=async(i,o)=>{const value=await read(i,o);h.runtime.cookie.suspend();return value;};await h.c.refresh();assert.equal(h.c.getSnapshot().phase,'offline');assert.equal(h.c.getSnapshot().directory,null);assert.doesNotMatch(h.html({clientName:'Private Synthetic Name'}),/Private Synthetic Name|working draft/);
});
test('ordinary connection recovery rereads only the original client-scoped first page',async t=>{
 const h=await setup(t);h.respond(()=>Response.json({code:'unavailable'},{status:503}));await h.c.refresh();assert.equal(h.c.getSnapshot().phase,'offline');h.respond(()=>empty());await h.c.checkConnection();assert.equal(h.c.getSnapshot().phase,'ready');assert.deepEqual(h.commands.map(x=>[x.clientId,x.cursor]),[[ids.client,null],[ids.client,null]]);
});
test('a repeated continuation cursor stays unavailable and cannot produce EOF absence',async t=>{
 const h=await setup(t);h.respond(()=>empty(nextCursor));await h.c.refresh();await h.c.loadMore();assert.equal(h.c.getSnapshot().phase,'error');assert.equal(h.c.getSnapshot().complete,false);assert.doesNotMatch(h.html(),/no working draft/);
});
test('a disposed controller cannot read or expose a retained private result',async t=>{
 const h=await setup(t);h.respond(()=>({...empty(),drafts:[draft()]}));await h.c.refresh();h.c.dispose();await h.c.refresh();assert.equal(h.commands.length,1);assert.equal(h.c.getSnapshot().phase,'ended');assert.equal(h.c.getSnapshot().directory,null);
});

test('client scope rejects null and malformed identities rather than opening an unassigned directory',async t=>{
 const h=await setup(t);for(const clientId of [null,'not-a-client'])assert.throws(()=>api.createAdvisorClientWorkspaceController({runtime:h.runtime,clientId,readPlans:h.readPlans}));assert.equal(h.commands.length,0);
});
test('published and draft identities in a private snapshot cannot be mutated by its consumer',async t=>{
 const h=await setup(t);h.respond(()=>({...empty(),drafts:[draft()],publications:[publication()]}));await h.c.refresh();const state=h.c.getSnapshot();assert.throws(()=>{state.directory.drafts[0].clientId=ids.other});assert.throws(()=>{state.directory.publications[0].version=99});assert.equal(h.c.getSnapshot().directory.publications[0].version,1);
});
test('an abort callback can supersede another refresh before that refresh dispatches',{timeout:5000},async t=>{
 const h=await setup(t),entered=deferred(),wait=deferred();t.after(()=>wait.resolve(empty()));let n=0;h.respond(()=>{if(++n===1){entered.resolve();return wait.promise;}return empty();});
 const read=h.readPlans.execute;let once=true,latest;h.readPlans.execute=(input,options)=>{if(once){once=false;options.signal.addEventListener('abort',()=>{latest=h.c.refresh()},{once:true});}return read(input,options);};
 const first=h.c.refresh();await entered.promise;const second=h.c.refresh();await second;await latest;assert.equal(h.commands.length,2);assert.equal(h.c.getSnapshot().phase,'ready');wait.resolve({...empty(),drafts:[draft()]});await first;assert.equal(h.c.getSnapshot().directory.drafts.length,0);
});
