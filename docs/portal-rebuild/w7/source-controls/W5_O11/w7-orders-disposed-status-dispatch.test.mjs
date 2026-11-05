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
