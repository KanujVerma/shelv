// Advisor-owned model/SSR list recovery. No genuine session, database or browser.
import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
import {createAdvisorController} from '../src/features/advisor/controller.ts';
import {fixture,ids} from './rebuild/advisor-fixture.mjs';
function setup(t){
 const f=fixture({ready:true}),execute=f.options.ports.clients.execute,clientCalls=[];
 let clientFailure=0,hold=null;
 f.options.ports.clients.execute=async(command,options)=>{
  clientCalls.push(structuredClone(command));if(hold)await hold;
  if(clientFailure)throw {status:clientFailure};return execute(command,options);
 };
 const c=createAdvisorController(f.options);t.after(()=>c.dispose());
 return {f,c,clientCalls,failClients(v){clientFailure=v},holdClients(v){hold=v}};
}
const out=new URL('../../../.local-artifacts/w2/directory-ssr.cjs',import.meta.url);await mkdir(new URL('.',out),{recursive:true});
await build({absWorkingDir:new URL('..',import.meta.url).pathname,tsconfig:'tsconfig.frontend.json',stdin:{contents:`import React from 'react';import{renderToStaticMarkup}from'react-dom/server';import{OverlayProvider}from'./src/ui/index.ts';import{AdvisorWorkspace}from'./src/features/advisor/AdvisorWorkspace.tsx';export const render=(props)=>renderToStaticMarkup(React.createElement(OverlayProvider,null,React.createElement(AdvisorWorkspace,props)));`,resolveDir:new URL('..',import.meta.url).pathname,loader:'tsx'},outfile:out.pathname,platform:'node',format:'cjs',bundle:true,loader:{'.css':'empty'}});
const {render}=createRequire(import.meta.url)(out.pathname);
const html=(c,name='advisor-clients')=>render({controller:c,navigation:{route:{name},navigate(){}},onOpenClient(){}});

test('a failed client read shows a retry instead of indefinite loading and recovers through the same read',async t=>{
 const h=setup(t);h.failClients(503);await h.c.loadClients();const markup=html(h.c);
 assert.match(markup,/could not load clients/);assert.match(markup,/>retry clients</);assert.doesNotMatch(markup,/>loading clients</);
 h.failClients(0);await h.c.loadClients();assert.match(html(h.c),/Maya SYNTHETIC/);assert.equal(h.clientCalls.length,2);assert.equal(h.c.getSnapshot().clientsRead,'ready');
});
test('a failed plan page shows a reload action without claiming there are no plans',async t=>{
 const h=setup(t);h.f.fail=503;await h.c.loadDirectory();const markup=html(h.c,'advisor-plans');
 assert.match(markup,/could not load plans/);assert.match(markup,/>retry plans</);assert.doesNotMatch(markup,/loading plans|no plans yet/);
 h.f.fail=0;await h.c.loadDirectory();assert.equal(h.c.getSnapshot().directoryRead,'ready');assert.equal(h.c.getSnapshot().directory.drafts.length,1);
});
test('list read errors do not replace draft state or interrupt its autosave eligibility',async t=>{
 const h=setup(t);await h.c.open(ids.draft);h.c.edit(v=>({...v,title:'SYNTHETIC unsaved authoring'}));const before=h.c.getSnapshot().local;
 h.failClients(503);await h.c.loadClients();assert.equal(h.c.getSnapshot().notice,null);assert.deepEqual(h.c.getSnapshot().local,before);assert.equal(h.c.getSnapshot().save,'idle');
 await h.c.save();assert.equal(h.f.calls.filter(x=>x.action==='save_draft_v1').length,1);
});
test('a current403 clears previously loaded client rows but keeps the authorized retry available',async t=>{
 const h=setup(t);await h.c.loadClients();h.failClients(403);await h.c.loadClients();
 assert.equal(h.c.getSnapshot().clients,null);assert.equal(h.c.getSnapshot().clientsRead,'denied');assert.doesNotMatch(html(h.c),/Maya SYNTHETIC/);assert.match(html(h.c),/>retry clients</);
 h.failClients(0);await h.c.loadClients();assert.match(html(h.c),/Maya SYNTHETIC/);
});
test('a current401 list read ends the session and clears private draft and directory state',async t=>{
 const h=setup(t);await h.c.open(ids.draft);await h.c.loadDirectory();h.failClients(401);await h.c.loadClients();
 assert.equal(h.c.getSnapshot().ended,true);assert.equal(h.c.getSnapshot().local,null);assert.equal(h.c.getSnapshot().directory,null);assert.equal(h.c.getSnapshot().clients,null);
});
test('client loading feedback does not own or block draft mutation busy state',async t=>{
 const h=setup(t);let release;h.holdClients(new Promise(r=>release=r));const reading=h.c.loadClients();
 try{assert.equal(h.c.getSnapshot().clientsRead,'loading');assert.equal(h.c.getSnapshot().busy,false);assert.match(html(h.c),/loading clients/);}finally{release();await reading;}
 assert.equal(h.c.getSnapshot().clientsRead,'ready');
});
test('a canceled client read settles its loading phase and never applies stale rows',async t=>{
 const h=setup(t);await h.c.open(ids.draft);let release;h.holdClients(new Promise(r=>release=r));const reading=h.c.loadClients();h.c.edit(v=>({...v,title:'SYNTHETIC newer edit'}));release();await reading;
 assert.equal(h.c.getSnapshot().clients,null);assert.equal(h.c.getSnapshot().clientsRead,'idle');assert.equal(h.c.getSnapshot().local.title,'SYNTHETIC newer edit');
});
test('loading observers can retire a session before the client request dispatches',async t=>{
 const h=setup(t);h.c.subscribe(()=>{if(h.c.getSnapshot().clientsRead==='loading')h.f.invalidate();});await h.c.loadClients();
 assert.equal(h.clientCalls.length,0);assert.equal(h.c.getSnapshot().ended,true);assert.equal(h.c.getSnapshot().clients,null);
});

test('a stale client denial cannot clear a newer read or settle its loading feedback',async t=>{
 const f=fixture({ready:true}),original=f.options.ports.clients.execute;let releaseOld,releaseNew,index=0;
 const oldGate=new Promise(r=>releaseOld=r),newGate=new Promise(r=>releaseNew=r);
 f.options.ports.clients.execute=async(command,options)=>{if(++index===1){await oldGate;throw {status:403};}await newGate;return original(command,options);};
 const c=createAdvisorController(f.options);t.after(()=>c.dispose());const old=c.loadClients(),newer=c.loadClients();
 releaseOld();await old;assert.equal(c.getSnapshot().clientsRead,'loading');releaseNew();await newer;
 assert.equal(c.getSnapshot().clientsRead,'ready');assert.match(html(c),/Maya SYNTHETIC/);
});
test('a remounted directory can retry a read canceled with the prior controller',async t=>{
 const f=fixture({ready:true}),original=f.options.ports.clients.execute;let release;
 const gate=new Promise(r=>release=r);let held=true;
 f.options.ports.clients.execute=async(command,options)=>{if(held)await gate;return original(command,options);};
 const old=createAdvisorController(f.options),reading=old.loadClients();old.dispose();
 const current=createAdvisorController(f.options);t.after(()=>current.dispose());assert.equal(current.getSnapshot().clientsRead,'idle');
 held=false;await current.loadClients();release();await reading;
 assert.equal(current.getSnapshot().clientsRead,'ready');assert.match(html(current),/Maya SYNTHETIC/);
});
