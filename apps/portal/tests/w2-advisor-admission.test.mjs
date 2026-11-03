// Fixed synthetic HTTP + actual application cookie/session + model/SSR, never real Auth/admin.
import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
import {createApplicationSession} from '../src/app/session.ts';
import {advisorCookieRequest} from '../src/app/retained.ts';
import {parseAdmissionCommand,mapAdmissionReceipt} from '../../../src/contracts/ConciergeAdmission.ts';
import {fixture,ids} from './rebuild/advisor-fixture.mjs';
const output=new URL('../../../.local-artifacts/w2/admission-ssr.cjs',import.meta.url);await mkdir(new URL('.',output),{recursive:true});
await build({absWorkingDir:new URL('..',import.meta.url).pathname,tsconfig:'tsconfig.frontend.json',stdin:{contents:`import React from 'react';import{renderToStaticMarkup}from'react-dom/server';import{OverlayProvider}from'./src/ui/index.ts';import{AdvisorWorkspace}from'./src/features/advisor/AdvisorWorkspace.tsx';export * from './src/features/advisor/index.ts';export const render=(props)=>renderToStaticMarkup(React.createElement(OverlayProvider,null,React.createElement(AdvisorWorkspace,props)));`,resolveDir:new URL('..',import.meta.url).pathname,loader:'tsx'},outfile:output.pathname,platform:'node',format:'cjs',bundle:true,loader:{'.css':'empty'}});
const api=createRequire(import.meta.url)(output.pathname);
async function setup(t){
 assert.equal(typeof api.createAdvisorAdmissionController,'function');
 let enterAdd;const addStarted=new Promise(r=>enterAdd=r);
 const calls=[],login={signedIn:true,ownerId:ids.actor,generation:1,csrf:'SYNTHETIC-admission-csrf',capabilities:{view:true,edit:false,publish:false,confirmPayments:false},idleExpiresAt:'2099-01-01T00:00:00Z',absoluteExpiresAt:'2099-01-02T00:00:00Z'};
 let cap=true,failAdd=0,status='pending',statusFailure=0,overrideReceipt=null,hold=null,offlineNext=false;
 const runtime=createApplicationSession({audience:'advisor',locks:{request:async(_n,_o,run)=>run()},fetcher:async(url,init)=>{
  if(url==='/api/advisor/session')return Response.json(login);
  if(url==='/api/advisor/logout')return Response.json({ok:true});
  assert.equal(url,'/api/advisor/admission');const command=parseAdmissionCommand(JSON.parse(init.body));calls.push(structuredClone(command));
  if(offlineNext){offlineNext=false;throw new TypeError('SYNTHETIC connection failure');}
  if(command.action==='capabilities')return Response.json({canAddClient:cap});
  if(command.action==='add_client'){
   enterAdd();if(hold)await hold;if(failAdd)return Response.json({code:failAdd===409?'concierge_admission_conflict':'unavailable'},{status:failAdd});
   return Response.json(overrideReceipt?overrideReceipt(command):receipt(command));
  }
  if(statusFailure)return Response.json({code:statusFailure===404?'concierge_admission_not_found':'unavailable'},{status:statusFailure});
  return Response.json({requestId:command.requestId,status,client:status==='ready'?(overrideReceipt?overrideReceipt(command):receipt({...calls.find(c=>c.action==='add_client'),requestId:command.requestId})):null});
 }});t.after(()=>runtime.dispose());await runtime.restore();
 const request=advisorCookieRequest('admission',runtime.cookie);
 const ports={capabilities:{execute:(c,o)=>request(c,o)},add:{async execute(c,o){return mapAdmissionReceipt(await request(c,o));}},status:{execute:(c,o)=>request(c,o)}};
 const c=api.createAdvisorAdmissionController({runtime,ports});t.after(()=>c.dispose());
 const f=fixture({ready:true});f.options.session=runtime.getSnapshot().boundary;const workspace=api.createAdvisorController(f.options);t.after(()=>workspace.dispose());
 const html=()=>api.render({controller:workspace,admission:c,navigation:{route:{name:'advisor-clients'},navigate(){}},onOpenClient(){}});
 return {c,runtime,ports,calls,html,addStarted,cap(v){cap=v},fail(v){failAdd=v},status(v){status=v},statusFailure(v){statusFailure=v},receipt(v){overrideReceipt=v},hold(v){hold=v},offline(){offlineNext=true},login};
}
function receipt(command){return {requestId:command.requestId,status:'admitted',clientId:ids.client,email:command.email,displayName:command.displayName,emailSent:false,portalUrl:'https://portal.goshelv.com/'};}
async function prepared(t){const h=await setup(t);await h.c.refreshCapabilities();h.c.editFields({email:' Client@Example.TEST ',displayName:' Synthetic Client '});h.c.prepare();assert.ok(h.c.getSnapshot().confirmation);return h;}

test('admission UI never derives capability from general advisor edit/view flags',async t=>{
 const h=await setup(t);assert.equal(h.c.getSnapshot().canAddClient,null);assert.doesNotMatch(h.html(),/>add client</);
 h.cap(false);await h.c.refreshCapabilities();assert.equal(h.c.getSnapshot().canAddClient,false);h.c.prepare();await h.c.confirm();assert.equal(h.calls.filter(x=>x.action==='add_client').length,0);assert.doesNotMatch(h.html(),/>add client</);
 h.cap(true);await h.c.refreshCapabilities();assert.match(h.html(),/>add client</);
});
test('reviewing details does not add a client; deliberate confirmation sends only the canonical normalized payload',async t=>{
 const h=await prepared(t),original=h.c.getSnapshot().confirmation;assert.equal(h.calls.filter(x=>x.action==='add_client').length,0);
 await h.c.confirm();assert.deepEqual(h.calls.at(-1),{action:'add_client',requestId:original.requestId,email:'client@example.test',displayName:'Synthetic Client'});
 assert.equal(h.c.getSnapshot().receipt.emailSent,false);assert.equal(h.c.getSnapshot().receipt.clientId,ids.client);assert.equal(h.c.getSnapshot().pending,null);
});
test('uncertain add preserves one UUID/email and status does not silently resubmit it',async t=>{
 const h=await prepared(t);h.fail(503);await h.c.confirm();const original=structuredClone(h.c.getSnapshot().pending);assert.ok(original);
 h.c.editFields({email:'different@example.test'});h.c.prepare();await h.c.confirm();assert.equal(h.calls.filter(x=>x.action==='add_client').length,1);
 h.fail(0);await h.c.checkConnection();await h.c.refreshCapabilities();await h.c.checkStatus();assert.equal(h.c.getSnapshot().pending.requestId,original.requestId);assert.equal(h.calls.filter(x=>x.action==='add_client').length,1);
 await h.c.retry();assert.deepEqual(h.calls.filter(x=>x.action==='add_client'),[original,original]);assert.equal(h.c.getSnapshot().pending,null);
});
test('already-admitted receipt preserves the existing server name rather than renaming from the form',async t=>{
 const h=await prepared(t);h.receipt(c=>({...receipt(c),status:'already_admitted',displayName:'Existing Synthetic Name'}));await h.c.confirm();
 assert.equal(h.c.getSnapshot().receipt.status,'already_admitted');assert.equal(h.c.getSnapshot().receipt.displayName,'Existing Synthetic Name');
});
test('a status receipt for another request or email cannot settle the original add',async t=>{
 const h=await prepared(t);h.fail(503);await h.c.confirm();const original=structuredClone(h.c.getSnapshot().pending);
 h.fail(0);await h.c.checkConnection();await h.c.refreshCapabilities();h.status('ready');h.receipt(c=>({...receipt(c),requestId:ids.other,email:'other@example.test'}));await h.c.checkStatus();
 assert.equal(h.c.getSnapshot().pending.requestId,original.requestId);assert.equal(h.c.getSnapshot().receipt,null);assert.doesNotMatch(h.c.getSnapshot().message??'',/other@example.test/);
});
test('same-boundary offline state retains original pending but cannot expose a ready receipt or capability',async t=>{
 const h=await prepared(t);h.offline();await h.c.confirm();assert.equal(h.runtime.cookie.status,'offline');assert.equal(h.runtime.getSnapshot().boundary.isCurrent(),true);
 assert.ok(h.c.getSnapshot().pending);assert.equal(h.c.getSnapshot().canAddClient,null);assert.equal(h.c.getSnapshot().receipt,null);assert.doesNotMatch(h.html(),/>add client</);
 await h.c.checkConnection();await h.c.refreshCapabilities();await h.c.retry();assert.equal(h.c.getSnapshot().receipt.email,'client@example.test');
});
test('logout retires and clears private fields before a delayed admission result returns',{timeout:5000},async t=>{
 const h=await prepared(t);let release;h.hold(new Promise(r=>release=r));const writing=h.c.confirm();
 t.after(()=>release?.());await Promise.race([h.addStarted,writing.then(()=>{throw Error('add did not dispatch')})]);
 await h.runtime.signOut();release();await writing;assert.equal(h.c.getSnapshot().phase,'ended');assert.equal(h.c.getSnapshot().pending,null);assert.equal(h.c.getSnapshot().receipt,null);assert.equal(h.c.getSnapshot().fields.email,'');
});
test('remount restores original uncertainty but requires a new current capability read',async t=>{
 const h=await prepared(t);h.fail(503);await h.c.confirm();const original=structuredClone(h.c.getSnapshot().pending);h.c.dispose();
 await h.runtime.restore();const next=api.createAdvisorAdmissionController({runtime:h.runtime,ports:h.ports});t.after(()=>next.dispose());assert.equal(next.getSnapshot().canAddClient,null);assert.equal(next.getSnapshot().pending.requestId,original.requestId);
 await next.retry();assert.equal(h.calls.filter(x=>x.action==='add_client').length,1);h.fail(0);await next.refreshCapabilities();await next.retry();assert.deepEqual(h.calls.filter(x=>x.action==='add_client'),[original,original]);
});

test('a valid receipt returned after actual connection suspension stays unresolved',async t=>{
 const h=await prepared(t),execute=h.ports.add.execute;
 h.ports.add.execute=async(command,options)=>{const value=await execute(command,options);h.offline();try{await h.ports.capabilities.execute({action:'capabilities'});}catch{}return value;};
 await h.c.confirm();assert.equal(h.runtime.cookie.status,'offline');assert.equal(h.c.getSnapshot().canAddClient,null);assert.equal(h.c.getSnapshot().receipt,null);assert.ok(h.c.getSnapshot().pending);
});
test('a malformed email-sent receipt cannot become a completed client add',async t=>{
 const h=await prepared(t);h.receipt(command=>({...receipt(command),emailSent:true}));await h.c.confirm();
 assert.equal(h.c.getSnapshot().receipt,null);assert.ok(h.c.getSnapshot().pending);assert.equal(h.calls.filter(x=>x.action==='add_client').length,1);
});


test('truthy malformed capability data never exposes or dispatches client admission',async t=>{
 const h=await setup(t);h.cap('true');await h.c.refreshCapabilities();assert.equal(h.c.getSnapshot().canAddClient,null);assert.doesNotMatch(h.html(),/>add client</);
 h.c.editFields({email:'client@example.test',displayName:'Synthetic Client'});h.c.prepare();await h.c.confirm();assert.equal(h.calls.filter(x=>x.action==='add_client').length,0);
});


test('a definitively conflicted add and matching not-found status allow deliberate details correction',async t=>{
 const h=await prepared(t);h.fail(409);await h.c.confirm();const original=structuredClone(h.c.getSnapshot().pending);assert.ok(original);
 h.statusFailure(404);await h.c.checkStatus();assert.equal(h.c.getSnapshot().recovery,'rejected_no_intent');assert.equal(h.c.getSnapshot().pending.requestId,original.requestId);
 h.c.correctDetails();assert.equal(h.c.getSnapshot().pending,null);assert.equal(h.c.getSnapshot().fields.email,original.email);
 h.c.editFields({email:'corrected@example.test'});h.c.prepare();assert.notEqual(h.c.getSnapshot().confirmation.requestId,original.requestId);h.fail(0);await h.c.confirm();assert.equal(h.c.getSnapshot().receipt.email,'corrected@example.test');
});
test('bare not-found status after an uncertain write cannot abandon the original',async t=>{
 const h=await prepared(t);h.fail(503);await h.c.confirm();const original=structuredClone(h.c.getSnapshot().pending);h.fail(0);await h.c.checkConnection();await h.c.refreshCapabilities();h.statusFailure(404);await h.c.checkStatus();
 assert.equal(h.c.getSnapshot().recovery,'unresolved');h.c.correctDetails();assert.equal(h.c.getSnapshot().pending.requestId,original.requestId);
});
test('a conflict with a still-pending journal remains unresolved and cannot be discarded',async t=>{
 const h=await prepared(t);h.fail(409);await h.c.confirm();await h.c.checkStatus();const original=structuredClone(h.c.getSnapshot().pending);h.c.correctDetails();assert.equal(h.c.getSnapshot().pending.requestId,original.requestId);assert.equal(h.c.getSnapshot().recovery,'unresolved');
});
test('retrying a previously absent rejected add invalidates that absence before a new uncertain attempt',async t=>{
 const h=await prepared(t);h.fail(409);await h.c.confirm();h.statusFailure(404);await h.c.checkStatus();assert.equal(h.c.getSnapshot().recovery,'rejected_no_intent');const original=structuredClone(h.c.getSnapshot().pending);
 h.fail(503);await h.c.retry();assert.equal(h.c.getSnapshot().recovery,'unresolved');await h.c.checkConnection();await h.c.refreshCapabilities();await h.c.checkStatus();h.c.correctDetails();assert.equal(h.c.getSnapshot().pending.requestId,original.requestId);
});

test('a later conflict cannot erase an earlier uncertain attempt of the same original',async t=>{
 const h=await prepared(t);h.fail(503);await h.c.confirm();const original=structuredClone(h.c.getSnapshot().pending);await h.c.checkConnection();await h.c.refreshCapabilities();
 h.fail(409);await h.c.retry();h.statusFailure(404);await h.c.checkStatus();assert.equal(h.c.getSnapshot().recovery,'unresolved');h.c.correctDetails();assert.equal(h.c.getSnapshot().pending.requestId,original.requestId);
});
test('a remount keeps a definitive conflict but requires current access and a fresh absence read',async t=>{
 const h=await prepared(t);h.fail(409);await h.c.confirm();const original=structuredClone(h.c.getSnapshot().pending);h.c.dispose();
 const next=api.createAdvisorAdmissionController({runtime:h.runtime,ports:h.ports});t.after(()=>next.dispose());assert.equal(next.getSnapshot().recovery,'unresolved');next.correctDetails();assert.equal(next.getSnapshot().pending.requestId,original.requestId);
 await next.refreshCapabilities();h.statusFailure(404);await next.checkStatus();assert.equal(next.getSnapshot().recovery,'rejected_no_intent');next.correctDetails();assert.equal(next.getSnapshot().pending,null);assert.equal(next.getSnapshot().fields.email,original.email);
});
test('a status number without the canonical conflict code never proves rejection',async t=>{
 const h=await prepared(t);h.ports.add.execute=async()=>{throw Object.assign(Error('synthetic unrelated conflict'),{status:409,code:'unavailable'});};await h.c.confirm();const original=structuredClone(h.c.getSnapshot().pending);
 h.statusFailure(404);await h.c.checkStatus();assert.equal(h.c.getSnapshot().recovery,'unresolved');h.c.correctDetails();assert.equal(h.c.getSnapshot().pending.requestId,original.requestId);
});

test('not-found status without the canonical absence code cannot unlock details',async t=>{
 const h=await prepared(t);h.fail(409);await h.c.confirm();const original=structuredClone(h.c.getSnapshot().pending);
 h.ports.status.execute=async()=>{throw Object.assign(Error('synthetic unrelated missing record'),{status:404,code:'unavailable'});};await h.c.checkStatus();h.c.correctDetails();assert.equal(h.c.getSnapshot().recovery,'unresolved');assert.equal(h.c.getSnapshot().pending.requestId,original.requestId);
});
test('confirmed absence never substitutes for a current admission capability',async t=>{
 const h=await prepared(t);h.fail(409);await h.c.confirm();h.statusFailure(404);await h.c.checkStatus();const original=structuredClone(h.c.getSnapshot().pending);
 h.cap(false);await h.c.refreshCapabilities();h.c.correctDetails();assert.equal(h.c.getSnapshot().pending.requestId,original.requestId);h.c.editFields({email:'other@example.test'});assert.equal(h.c.getSnapshot().fields.email,original.email);assert.equal(h.calls.filter(x=>x.action==='add_client').length,1);
});
