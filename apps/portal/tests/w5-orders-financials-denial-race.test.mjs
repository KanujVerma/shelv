// Native review4462020377: finite response/abort settlement, no actual Auth/SQL.
import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture,command,origin,actor} from './w5-orders-financials-helper.mjs';
import {handleServiceFinancialsRequest} from '../../../supabase/functions/concierge-payments/service-financials-handler.ts';
globalThis.fetch=async()=>{throw Error('external_network_forbidden');};

for(const status of [401,403])test(`full handler preserves received RPC${status} through coincident native abort`,async()=>{
 const f=await fixture(),abort=new AbortController();
 f.setRpcReply(()=>{abort.abort();return new Response(null,{status});});
 const response=await f.run(f.request(command,{signal:abort.signal}));
 assert.equal(response.status,status);assert.deepEqual(await response.json(),{code:status===401?'session_ended':'forbidden'});assert.equal(f.calls.length,2);
});
for(const status of [401,403])test(`full handler preserves received Auth${status} as definite identity denial through abort`,async()=>{
 const f=await fixture(),abort=new AbortController();
 f.setAuthReply(()=>{abort.abort();return new Response(null,{status});});
 const response=await f.run(f.request(command,{signal:abort.signal}));
 assert.equal(response.status,401);assert.deepEqual(await response.json(),{code:'unauthorized'});assert.equal(f.calls.length,1);
});

function deferred(){let release;return {promise:new Promise(r=>{release=r;}),release:v=>release(v)};}
async function within(promise){let timer;try{return await Promise.race([promise,new Promise((_resolve,reject)=>{timer=setTimeout(()=>reject(Error('operation failed to settle after native abort')),250);})]);}finally{clearTimeout(timer);}}

for(const status of [401,403])test(`RPC${status} body is never read and cancellation never blocks definite denial`,async()=>{
 const f=await fixture(),abort=new AbortController();let reads=0,cancelled=0;
 f.setRpcReply(()=>{abort.abort();return new Response(new ReadableStream({pull(){reads++;},cancel(){cancelled++;return new Promise(()=>{});}},{highWaterMark:0}),{status});});
 const response=await within(f.run(f.request(command,{signal:abort.signal})));assert.equal(response.status,status);assert.equal(reads,0);assert.equal(cancelled,1);
});

test('a denial arriving after abort settlement cannot retroactively classify the request',async()=>{
 const f=await fixture(),abort=new AbortController(),entered=deferred(),late=deferred(),cancelled=deferred();let reads=0;
 f.setRpcReply(()=>{entered.release();return late.promise;});const pending=f.run(f.request(command,{signal:abort.signal}));await entered.promise;abort.abort();
 const response=await within(pending);assert.equal(response.status,503);assert.deepEqual(await response.json(),{code:'unavailable'});
 late.release(new Response(new ReadableStream({pull(){reads++;},cancel(){cancelled.release();}},{highWaterMark:0}),{status:403}));await within(cancelled.promise);assert.equal(reads,0);
});

test('concurrent handler signals never borrow another operation received denial',async()=>{
 const f=await fixture(),abort=new AbortController(),entered=deferred(),late=deferred(),cancelled=deferred();let calls=0;
 f.setRpcReply(()=>{calls++;if(calls===1){entered.release();return late.promise;}return new Response(null,{status:401});});
 const first=f.run(f.request(command,{signal:abort.signal}));await entered.promise;const second=await f.run(f.request());assert.equal(second.status,401);abort.abort();
 const response=await within(first);assert.equal(response.status,503);assert.deepEqual(await response.json(),{code:'unavailable'});
 late.release(new Response(new ReadableStream({cancel(){cancelled.release();}},{highWaterMark:0}),{status:403}));await within(cancelled.promise);
});

test('redirected response cannot be promoted to a received denial during abort',async()=>{
 const f=await fixture(),abort=new AbortController();let reads=0,cancelled=0;
 f.setRpcReply(()=>{const response=new Response(new ReadableStream({pull(){reads++;},cancel(){cancelled++;return new Promise(()=>{});}},{highWaterMark:0}),{status:401});Object.defineProperty(response,'redirected',{value:true});abort.abort();return response;});
 const response=await within(f.run(f.request(command,{signal:abort.signal})));assert.equal(response.status,503);assert.deepEqual(await response.json(),{code:'unavailable'});assert.equal(reads,0);assert.equal(cancelled,1);
});

for(const phase of ['Auth','RPC'])test(`outer handler keeps bounded abort settlement for noncooperative ${phase} ports`,async()=>{
 const f=await fixture(),abort=new AbortController(),entered=deferred(),late=deferred();let rpc=0;
 const ports={allowedOrigins:[origin],authenticate:async()=>{if(phase==='Auth'){entered.release();return late.promise;}return {id:actor,is_anonymous:false};},rpc:async()=>{rpc++;entered.release();return late.promise;}};
 const pending=handleServiceFinancialsRequest(f.request(command,{signal:abort.signal}),ports);await entered.promise;abort.abort();
 try{const response=await within(pending);assert.equal(response.status,503);assert.deepEqual(await response.json(),{code:'unavailable'});assert.equal(rpc,phase==='Auth'?0:1);}
 finally{late.release(phase==='Auth'?{id:actor,is_anonymous:false}:{data:null,error:null});await pending;}
});
