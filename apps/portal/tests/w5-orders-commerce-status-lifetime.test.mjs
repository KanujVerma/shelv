import test from 'node:test';
import assert from 'node:assert/strict';
import {createApplicationSession} from '../src/app/session.ts';
import {createOrdersController} from '../src/features/orders/controller.ts';
import {createCommercePort} from '../src/features/orders/port.ts';
import {quoteFixture,finiteRequest,owner,entity} from './w5-orders-commerce-fixtures.mjs';
// Actual current Root session/controller/port/codecs with finite synthetic
// requests only. No installed Commerce channel, actual Auth or funds operation.
test('permanent disposal denies a status request still waiting on its port hash',async t=>{
 const runtime=createApplicationSession({audience:'client',locks:{request:async(_n,_o,run)=>run()},fetcher:async url=>{
  assert.equal(url,'/api/client/session');return Response.json({signedIn:true,ownerId:owner,generation:1,csrf:'SYNTHETIC-w7-status-retirement',capabilities:{view:true,edit:false,publish:false,confirmPayments:false},idleExpiresAt:'2099-01-01T00:00:00Z',absoluteExpiresAt:'2099-01-02T00:00:00Z'});
 }});t.after(()=>runtime.dispose());await runtime.restore();
 const q=await quoteFixture(),fixed=finiteRequest(q),calls=[];
 const port=createCommercePort(runtime,{family:'commerce-v1',async execute(command,options){
  calls.push(command);
  if(command.action==='accept_product_quote_v1'||command.action==='request_status_v1'){const e=new Error('SYNTHETIC finite unavailable');e.status=503;throw e;}
  return fixed.execute(command,options);
 }});
 const controller=createOrdersController({port,session:runtime.getSnapshot().boundary,ownerId:owner,mode:'client',contextKey:'w7-status-retirement'});t.after(()=>controller.dispose());
 await controller.refresh();await controller.open(entity);controller.reviewQuote();await controller.acceptQuote();
 assert.equal(controller.getSnapshot().pending?.phase,'uncertain');
 const original=crypto.subtle.digest;let release,entered,count=0;
 const held=new Promise(resolve=>release=resolve),waiting=new Promise(resolve=>entered=resolve);
 crypto.subtle.digest=async function(...args){if(++count===2){entered();await held;}return original.apply(this,args);};
 let status;try{
  status=controller.checkStatus();await waiting;
  assert.equal(calls.filter(c=>c.action==='request_status_v1').length,0);
  const before=calls.length;controller.dispose();assert.equal(controller.getSnapshot().phase,'ended');
  release();await status;
  const after=calls.slice(before),statusAfter=after.filter(c=>c.action==='request_status_v1').length,newWrites=after.filter(c=>!c.action.startsWith('read_')&&c.action!=='request_status_v1').length;
  t.diagnostic(JSON.stringify({digestCalls:count,statusAfterDispose:statusAfter,newWritesAfterDispose:newWrites,phase:controller.getSnapshot().phase,cookie:runtime.cookie.status,setupSyntheticAcceptanceRequests:calls.filter(c=>c.action==='accept_product_quote_v1').length}));
  assert.equal(runtime.cookie.status,'ready');assert.equal(controller.getSnapshot().phase,'ended');assert.equal(newWrites,0);
  assert.equal(statusAfter,0,'disposed controller must deny a not-yet-dispatched fixed status request');
 }finally{release();crypto.subtle.digest=original;if(status)await Promise.allSettled([status]);}
});

// Owner finite current-only schedules. One unavailable synthetic acceptance
// creates recoverable uncertainty; it is never paid money or human approval.
async function statusFixture(t){
 const runtime=createApplicationSession({audience:'client',locks:{request:async(_n,_o,run)=>run()},fetcher:async url=>{assert.equal(url,'/api/client/session');return Response.json({signedIn:true,ownerId:owner,generation:1,csrf:'SYNTHETIC-status-owner',capabilities:{view:true,edit:false,publish:false,confirmPayments:false},idleExpiresAt:'2099-01-01T00:00:00Z',absoluteExpiresAt:'2099-01-02T00:00:00Z'});}});t.after(()=>runtime.dispose());await runtime.restore();
 const qA=await quoteFixture(),qB=await quoteFixture();qB.header.target.quoteId='10000000-0000-4000-8000-000000000022';
 const {hashFrozenCommerceTerms}=await import('../../../src/contracts/PortalCommerceMapping.ts');qB.header.target.termsHash=await hashFrozenCommerceTerms(qB.header,qB.lines,qB.options);
 const b={kind:'quote',id:qB.header.target.quoteId,revision:1},index=[entity,b].map(ref=>({entity:ref,label:'Exact quote',state:'awaiting_acceptance',recordedAt:qA.header.issuedAt})),aReq=finiteRequest(qA,{index}),bReq=finiteRequest(qB,{index}),calls=[];
 const port=createCommercePort(runtime,{family:'commerce-v1',async execute(c,o){calls.push(c);if(c.action==='accept_product_quote_v1'||c.action==='request_status_v1'){const e=new Error('SYNTHETIC finite unavailable');e.status=503;throw e;}return (c.entity?.id===b.id||c.quote?.target?.quoteId===b.id?bReq:aReq).execute(c,o);}});
 const session=runtime.getSnapshot().boundary,options={port,session,ownerId:owner,mode:'client',contextKey:'status-lifetime-source'},controller=createOrdersController(options);t.after(()=>controller.dispose());await controller.refresh();await controller.open(entity);controller.reviewQuote();await controller.acceptQuote();assert.equal(controller.getSnapshot().pending?.phase,'uncertain');
 return {runtime,session,controller,port,options,calls,b,original:structuredClone(controller.getSnapshot().pending),memory:()=>session.memory.get('orders-intent:'+owner)};
}
function digestGate(t,at){
 const original=crypto.subtle.digest;let release,entered,count=0;const held=new Promise(r=>release=r),waiting=new Promise(r=>entered=r);
 crypto.subtle.digest=async function(...args){if(++count===at){entered();await held;}return original.apply(this,args);};
 const restore=()=>{release();crypto.subtle.digest=original;};t.after(restore);
 return {release,restore,async entered(){let timer;try{await Promise.race([waiting,new Promise((_,reject)=>timer=setTimeout(()=>reject(Error('expected controlled digest was not reached')),5000))]);}finally{clearTimeout(timer);}}};
}
const statusCalls=f=>f.calls.filter(c=>c.action==='request_status_v1');
const acceptanceCalls=f=>f.calls.filter(c=>c.action==='accept_product_quote_v1');
test('disposing during status hash preserves the exact original for a new live controller',async t=>{
 const f=await statusFixture(t),saved=structuredClone(f.memory()),gate=digestGate(t,2);let checking;
 try{checking=f.controller.checkStatus();await gate.entered();f.controller.dispose();gate.release();await checking;assert.equal(statusCalls(f).length,0);assert.deepEqual(f.memory(),saved);assert.equal(f.runtime.cookie.status,'ready');
  const next=createOrdersController({...f.options,contextKey:'replacement-status-source'});t.after(()=>next.dispose());assert.equal(next.getSnapshot().pending.command.requestId,saved.command.requestId);await next.checkStatus();assert.equal(statusCalls(f).length,1);assert.equal(statusCalls(f)[0].requestId,saved.command.requestId);assert.equal(next.getSnapshot().pending.phase,'uncertain');assert.deepEqual(next.getSnapshot().pending.command,saved.command);assert.equal(next.getSnapshot().pending.rawWire,saved.rawWire);assert.equal(next.getSnapshot().pending.commandHash,saved.commandHash);assert.equal(acceptanceCalls(f).length,1);
 }finally{gate.release();if(checking)await Promise.allSettled([checking]);gate.restore();}
});
test('disposal during the controller status digest remains denied before entering the port',async t=>{
 const f=await statusFixture(t),saved=structuredClone(f.memory()),gate=digestGate(t,1);let checking;
 try{checking=f.controller.checkStatus();await gate.entered();f.controller.dispose();gate.release();await checking;assert.equal(statusCalls(f).length,0);assert.equal(f.controller.getSnapshot().phase,'ended');assert.deepEqual(f.memory(),saved);assert.equal(acceptanceCalls(f).length,1);
 }finally{gate.release();if(checking)await Promise.allSettled([checking]);gate.restore();}
});
test('a newer deliberate status check supersedes the older status still hashing',async t=>{
 const f=await statusFixture(t),gate=digestGate(t,2);let older,newer;
 try{older=f.controller.checkStatus();await gate.entered();newer=f.controller.checkStatus();await newer;assert.equal(statusCalls(f).length,1);const saved=structuredClone(f.memory());gate.release();await older;assert.equal(statusCalls(f).length,1);assert.deepEqual(f.memory(),saved);assert.equal(statusCalls(f)[0].requestId,f.original.command.requestId);assert.equal(acceptanceCalls(f).length,1);
 }finally{gate.release();await Promise.allSettled([older,newer].filter(Boolean));gate.restore();}
});
test('read navigation does not cancel status recovery or substitute a newer quote target',async t=>{
 const f=await statusFixture(t),gate=digestGate(t,2);let checking;
 try{checking=f.controller.checkStatus();await gate.entered();await f.controller.open(f.b);assert.equal(f.controller.getSnapshot().selection.entity.id,f.b.id);gate.release();await checking;assert.equal(statusCalls(f).length,1);assert.equal(statusCalls(f)[0].requestId,f.original.command.requestId);assert.equal(f.controller.getSnapshot().selection.entity.id,f.b.id);assert.deepEqual(f.controller.getSnapshot().pending.command,f.original.command);assert.equal(f.controller.getSnapshot().pending.rawWire,f.original.rawWire);assert.equal(f.controller.getSnapshot().pending.commandHash,f.original.commandHash);assert.equal(acceptanceCalls(f).length,1);
 }finally{gate.release();if(checking)await Promise.allSettled([checking]);gate.restore();}
});
test('an explicit exact retry supersedes an older status without replacing its original wire',async t=>{
 const f=await statusFixture(t),gate=digestGate(t,2);let checking;
 try{checking=f.controller.checkStatus();await gate.entered();await f.controller.retryIntent();assert.equal(statusCalls(f).length,0);assert.equal(acceptanceCalls(f).length,2);assert.deepEqual(acceptanceCalls(f)[1],f.original.command);const saved=structuredClone(f.memory());gate.release();await checking;assert.equal(statusCalls(f).length,0);assert.deepEqual(f.memory(),saved);assert.equal(f.controller.getSnapshot().pending.phase,'uncertain');assert.equal(f.controller.getSnapshot().pending.rawWire,f.original.rawWire);assert.equal(f.controller.getSnapshot().pending.commandHash,f.original.commandHash);
 }finally{gate.release();if(checking)await Promise.allSettled([checking]);gate.restore();}
});
