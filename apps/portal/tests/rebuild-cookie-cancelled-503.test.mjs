// SYNTHETIC registered candidate source + actual session/cookie/transport/Root
// codecs and finite native HTTP. No successful authority or OperationPort stub.
import test from 'node:test';
import assert from 'node:assert/strict';
import {actual,recordedView,command} from './rebuild-client-orders-fixture.mjs';
import {createClientOrdersReadController} from '../src/features/orders/read/controller.ts';
import {clientCookieRequest} from '../src/app/retained.ts';
const gate=()=>{let enter,release;return {entered:new Promise(r=>enter=r),wait:new Promise(r=>release=r),enter:()=>enter(),release:()=>release()};};
for(const status of [200,401,403,503])test('SYNTHETIC cancelled old HTTP'+status+' arriving after abort cannot suspend newer actual Orders state',async t=>{
 const h=gate();t.after(()=>h.release());let count=0;
 const f=await actual(t,{allowOrders:true,ordersResponse:async()=>{if(++count===1){h.enter();await h.wait;return status===200?Response.json(recordedView()):Response.json({code:'unavailable'},{status});}return Response.json({...recordedView(),revision:19});}});
 const a=createClientOrdersReadController(f.runtime),b=createClientOrdersReadController(f.runtime);t.after(()=>{a.dispose();b.dispose();});
 const old=a.load();await h.entered;a.dispose();assert.equal(f.calls[1].init.signal.aborted,true);
 await b.load();const current=b.getSnapshot();assert.equal(current.phase,'ready');assert.equal(current.view.revision,19);
 h.release();await old;assert.equal(f.runtime.cookie.status,'ready');assert.equal(b.getSnapshot(),current);
 assert.equal(f.calls.length,3,'old completion causes no recovery dispatch');
});
for(const cancellation of ['abort','relevance'])test('SYNTHETIC local '+cancellation+' refuses old503 without poisoning newer data',async t=>{
 const h=gate();t.after(()=>h.release());let count=0,applies=true;const abort=new AbortController();
 const f=await actual(t,{allowOrders:true,ordersResponse:async()=>{if(++count===1){h.enter();await h.wait;return Response.json({code:'unavailable'},{status:503});}return Response.json({...recordedView(),revision:19});}});
 const request=clientCookieRequest('client-orders',f.runtime.cookie),old=request(command,{signal:abort.signal,isApplicable:()=>applies&&!abort.signal.aborted});
 await h.entered;if(cancellation==='abort')abort.abort();else applies=false;
 const b=createClientOrdersReadController(f.runtime);t.after(()=>b.dispose());await b.load();const current=b.getSnapshot();assert.equal(current.phase,'ready');
 h.release();await assert.rejects(old,e=>e.name==='AbortError');assert.equal(f.runtime.cookie.status,'ready');assert.equal(b.getSnapshot(),current);
});
for(const status of [401,403,503])test('SYNTHETIC current uncancelled HTTP'+status+' retains actual denial/offline behavior',async t=>{
 const f=await actual(t,{allowOrders:true,ordersResponse:()=>Response.json({code:'unavailable'},{status})}),c=createClientOrdersReadController(f.runtime);t.after(()=>c.dispose());await c.load();
 assert.equal(f.runtime.cookie.status,status===401?'signedout':status===503?'offline':'ready');
 assert.equal(c.getSnapshot().view,null);assert.equal(c.getSnapshot().error,status);
});
for(const status of [401,403])test('SYNTHETIC own-admin received HTTP'+status+' retires its unread body before a later caller abort',async t=>{
 let reads=0,cancels=0;
 const f=await actual(t,{allowOrders:true,ordersResponse:()=>new Response(new ReadableStream({pull(){reads++;return new Promise(()=>{});},cancel(){cancels++;}},{highWaterMark:0}),{status})});
 const abort=new AbortController(),request=clientCookieRequest('client-orders',f.runtime.cookie);
 const old=request(command,{signal:abort.signal});await assert.rejects(old,e=>e.status===status);abort.abort();
 assert.equal(reads,0);assert.equal(cancels,1);assert.equal(f.runtime.cookie.status,status===401?'signedout':'ready');
 assert.equal(f.calls.length,2,'known denial causes no recovery or follow-up dispatch');
});
