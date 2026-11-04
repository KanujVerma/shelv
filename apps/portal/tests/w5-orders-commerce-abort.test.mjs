import test from 'node:test';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';

const root=process.env.W5_COMMERCE_SOURCE_ROOT??fileURLToPath(new URL('../../..',import.meta.url));
const {createCommercePorts}=await import(pathToFileURL(resolve(root,'supabase/functions/concierge-commerce/runtime.ts')).href);
const {handleCommerceRequest}=await import(pathToFileURL(resolve(root,'supabase/functions/concierge-commerce/handler.ts')).href);
const id='10000000-0000-4000-8000-000000000001',origin='https://portal.example.invalid';
const command={schemaVersion:1,action:'request_status_v1',requestId:id};
const call={name:'concierge_commerce_command_v1',args:{p_command:command}};
const write={schemaVersion:1,action:'request_service_refund_v1',requestId:id,reason:null};
const user={id,is_anonymous:false};
globalThis.fetch=async()=>{throw Error('external_network_forbidden');};
const deferred=()=>{let resolve;const promise=new Promise(r=>{resolve=r;});return {promise,resolve};};
const runtime=send=>createCommercePorts({supabaseUrl:'https://synthetic.supabase.co',publicKey:'synthetic',allowedOrigins:[origin],fetch:send});
const settle=p=>p.then(value=>({kind:'fulfilled',value}),()=>({kind:'rejected'}));
async function within(p,milliseconds=100){let timer;try{return await Promise.race([p,new Promise(r=>{timer=setTimeout(()=>r({kind:'waiting'}),milliseconds);})]);}finally{clearTimeout(timer);}}
const request=(value=command,signal)=>new Request('https://edge.invalid',{method:'POST',headers:{authorization:'Bearer synthetic','content-type':'application/json',origin},body:JSON.stringify(value),signal});

for(const auth of [false,true])test(`stalled ${auth?'Auth':'RPC'} body retires on native abort without waiting for cancel`,{timeout:2000},async()=>{
 const entered=deferred(),abort=new AbortController();let source,cancelled=0,calls=0;
 const ports=runtime(async()=>{calls++;return new Response(new ReadableStream({start(c){source=c;},pull(){entered.resolve();},cancel(){cancelled++;return new Promise(()=>{});}},{highWaterMark:0}));});
 const pending=settle(auth?ports.authenticate('synthetic',abort.signal):ports.rpc('synthetic',call,abort.signal));
 await entered.promise;abort.abort();let early;
 try{early=await within(pending);}finally{try{source.enqueue(new TextEncoder().encode(JSON.stringify(auth?user:{status:'absent'})));source.close();}catch{}await pending;}
 assert.equal(early.kind,'rejected');assert.equal(cancelled,1);assert.equal(calls,1);
});

test('noncooperative fetch retires on abort and cancels its late response without reading it',{timeout:2000},async()=>{
 const entered=deferred(),release=deferred(),abort=new AbortController();let source,reads=0,cancelled=0;
 const ports=runtime(async()=>{entered.resolve();return release.promise;});
 const pending=settle(ports.rpc('synthetic',call,abort.signal));await entered.promise;abort.abort();const early=await within(pending);
 release.resolve(new Response(new ReadableStream({start(c){source=c;},pull(){reads++;},cancel(){cancelled++;return new Promise(()=>{});}},{highWaterMark:0})));
 await new Promise(r=>setImmediate(r));try{source.enqueue(new TextEncoder().encode('{"status":"absent"}'));source.close();}catch{}
 const final=await pending;
 assert.equal(early.kind,'rejected');assert.equal(final.kind,'rejected');assert.equal(reads,0);assert.equal(cancelled,1);
});

test('already aborted direct runtime calls never dispatch',async()=>{
 const abort=new AbortController();abort.abort();let calls=0;
 const ports=runtime(async()=>{calls++;return Response.json({status:'absent'});});
 await assert.rejects(ports.rpc('synthetic',call,abort.signal));await assert.rejects(ports.authenticate('synthetic',abort.signal));assert.equal(calls,0);
});

test('abort while the final JSON chunk is delivered cannot fulfill',async()=>{
 const abort=new AbortController();const ports=runtime(async()=>new Response(new ReadableStream({pull(c){c.enqueue(new TextEncoder().encode('{"status":"absent"}'));c.close();abort.abort();}},{highWaterMark:0})));
 await assert.rejects(ports.rpc('synthetic',call,abort.signal));
});

for(const status of [401,403])test(`received RPC ${status} wins over coincident abort without body read`,async()=>{
 const abort=new AbortController();let reads=0,cancelled=0;
 const ports=runtime(async()=>{abort.abort();return new Response(new ReadableStream({pull(){reads++;},cancel(){cancelled++;return new Promise(()=>{});}},{highWaterMark:0}),{status});});
 const result=await ports.rpc('synthetic',call,abort.signal);assert.equal(result.error.status,status);assert.equal(reads,0);assert.equal(cancelled,1);
});

for(const status of [401,403])test(`received Auth ${status} remains definite denial on coincident abort`,async()=>{
 const abort=new AbortController();let reads=0,cancelled=0;
 const ports=runtime(async()=>{abort.abort();return new Response(new ReadableStream({pull(){reads++;},cancel(){cancelled++;return new Promise(()=>{});}},{highWaterMark:0}),{status});});
 assert.equal(await ports.authenticate('synthetic',abort.signal),null);assert.equal(reads,0);assert.equal(cancelled,1);
});

test('oversize refusal never waits for an uncooperative cancellation',{timeout:2000},async()=>{
 let cancelled=0;const ports=runtime(async()=>new Response(new ReadableStream({pull(c){c.enqueue(new Uint8Array(2000001));},cancel(){cancelled++;return new Promise(()=>{});}},{highWaterMark:0})));
 assert.equal((await within(settle(ports.rpc('synthetic',call)))).kind,'rejected');assert.equal(cancelled,1);
});

test('handler request-body abort settles unavailable without RPC or invalid-input fiction',{timeout:2000},async()=>{
 const entered=deferred(),abort=new AbortController();let source,rpc=0,cancelled=0;
 const body=new ReadableStream({start(c){source=c;},pull(){entered.resolve();},cancel(){cancelled++;return new Promise(()=>{});}},{highWaterMark:0});
 const input=new Request('https://edge.invalid',{method:'POST',headers:{authorization:'Bearer synthetic','content-type':'application/json',origin},body,duplex:'half',signal:abort.signal});
 const pending=settle(handleCommerceRequest(input,{allowedOrigins:[origin],authenticate:async()=>user,rpc:async()=>{rpc++;return {data:{status:'absent'},error:null};}}));
 await entered.promise;abort.abort();const early=await within(pending);try{source.enqueue(new TextEncoder().encode(JSON.stringify(command)));source.close();}catch{}await pending;
 assert.equal(early.kind,'fulfilled');assert.equal(early.value.status,503);assert.deepEqual(await early.value.json(),{code:'unavailable'});assert.equal(rpc,0);assert.equal(cancelled,1);
});

test('handler abort after Auth prevents later body processing and RPC',async()=>{
 const abort=new AbortController();let rpc=0;
 const response=await handleCommerceRequest(request(command,abort.signal),{allowedOrigins:[origin],authenticate:async()=>{abort.abort();return user;},rpc:async()=>{rpc++;return {data:{status:'absent'},error:null};}});
 assert.equal(response.status,503);assert.deepEqual(await response.json(),{code:'unavailable'});assert.equal(rpc,0);
});

for(const status of [401,403])test(`handler preserves a received RPC ${status} if operation aborts at settlement`,async()=>{
 const abort=new AbortController();const response=await handleCommerceRequest(request(write,abort.signal),{allowedOrigins:[origin],authenticate:async()=>user,rpc:async()=>{abort.abort();return {data:null,error:{status}};}});
 assert.equal(response.status,status);assert.deepEqual(await response.json(),{code:status===401?'session_ended':'forbidden'});
});

test('one handler deadline spans Auth and RPC instead of renewing after each await',async()=>{
 const clock=Date.now;let now=clock(),rpc=0;Date.now=()=>now;
 try{
  const response=await handleCommerceRequest(request(),{allowedOrigins:[origin],authenticate:async()=>{now+=6000;return user;},rpc:async()=>{rpc++;now+=5000;return {data:{status:'absent'},error:null};}});
  assert.equal(response.status,503);assert.deepEqual(await response.json(),{code:'unavailable'});assert.equal(rpc,1);
 }finally{Date.now=clock;}
});

test('native ten-second deadline settles an uncooperative fetch without caller abort',{timeout:13000},async()=>{
 const release=deferred();let signal;const started=Date.now();const ports=runtime(async(_input,init)=>{signal=init.signal;return release.promise;});
 const pending=settle(ports.rpc('synthetic',call));const early=await within(pending,11000);
 release.resolve(Response.json({status:'absent'}));await pending;
 assert.equal(early.kind,'rejected');assert.equal(signal.aborted,true);assert.ok(Date.now()-started>=9000);
});

for(const auth of [false,true])for(const status of [401,403])test(`actual handler/retained ${auth?'Auth':'RPC'} ${status} denial survives coincident abort`,async()=>{
 const abort=new AbortController();let calls=0;
 const ports=runtime(async input=>{
  calls++;if(!auth&&String(input).endsWith('/user'))return Response.json(user);
  abort.abort();return new Response(null,{status});
 });
 const response=await handleCommerceRequest(request(write,abort.signal),ports);
 assert.equal(response.status,auth?401:status);assert.deepEqual(await response.json(),{code:auth?'unauthorized':status===401?'session_ended':'forbidden'});assert.equal(calls,auth?1:2);
});

for(const auth of [false,true])test(`actual handler/retained stalled ${auth?'Auth':'RPC'} body abort settles without a late success`,{timeout:2000},async()=>{
 const entered=deferred(),abort=new AbortController();let source,calls=0;
 const ports=runtime(async input=>{
  calls++;if(!auth&&String(input).endsWith('/user'))return Response.json(user);
  return new Response(new ReadableStream({start(c){source=c;},pull(){entered.resolve();}},{highWaterMark:0}));
 });
 const pending=settle(handleCommerceRequest(request(write,abort.signal),ports));await entered.promise;abort.abort();const early=await within(pending);
 try{source.enqueue(new TextEncoder().encode(JSON.stringify(auth?user:{status:'absent'})));source.close();}catch{}await pending;
 assert.equal(early.kind,'fulfilled');assert.equal(early.value.status,503);assert.deepEqual(await early.value.json(),{code:auth?'unavailable':'uncertain'});assert.equal(calls,auth?1:2);
});

test('redirected response cannot become a definite denial during abort',async()=>{
 const abort=new AbortController();let reads=0,cancelled=0;
 const ports=runtime(async()=>{
  const response=new Response(new ReadableStream({pull(){reads++;},cancel(){cancelled++;return new Promise(()=>{});}},{highWaterMark:0}),{status:401});
  Object.defineProperty(response,'redirected',{value:true});abort.abort();return response;
 });
 await assert.rejects(ports.rpc('synthetic',call,abort.signal));assert.equal(reads,0);assert.equal(cancelled,1);
});
