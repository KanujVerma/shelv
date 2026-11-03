// SOURCE/finite HTTP only. Real retained Auth/RPC transport; no SQL, tokens,
// currentness facade, bank/provider, server, browser or financial truth.
import test from 'node:test';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
const owner='11111111-1111-4111-8111-111111111111';
const origin='https://shelv-financials.invalid';
const command={schemaVersion:1,action:'read_client_service_financials_v1',snapshot:null,cursor:null,limit:100};
const call={name:'concierge_client_service_financials_read_v1',args:{p_command:command}};
let loaded;
async function factory(){
 if(loaded)return loaded;
 const source=process.env.W5_FINANCIALS_SOURCE_ROOT?pathToFileURL(path.resolve(process.env.W5_FINANCIALS_SOURCE_ROOT,'supabase/functions/concierge-payments/service-financials-runtime.ts')):new URL('../../../supabase/functions/concierge-payments/service-financials-runtime.ts',import.meta.url);
 let api;try{api=await import(source);}catch(error){assert.fail('financial read source/dependency unavailable: '+error.message);}
 loaded=api.createServiceFinancialsPorts;return loaded;
}
async function runtime(send){const create=await factory();return create({supabaseUrl:'https://synthetic.supabase.co',publicKey:'synthetic-public-key',allowedOrigins:[origin],fetch:send});}
test('own financial transport binds the sole RPC and keeps credentials server-side',async()=>{
 const seen=[];const p=await runtime(async(input,init)=>{
  const url=String(input);seen.push(url);assert.equal(init.credentials,'omit');assert.equal(init.cache,'no-store');assert.equal(init.redirect,'manual');
  const h=new Headers(init.headers);assert.equal(h.get('authorization'),'Bearer synthetic');assert.equal(h.get('apikey'),'synthetic-public-key');
  if(url.endsWith('/user'))return Response.json({id:owner,is_anonymous:false});
  assert.deepEqual(JSON.parse(init.body),{p_command:command});return Response.json({source:'synthetic-transport-only'});
 });
 assert.deepEqual(await p.authenticate('synthetic'),{id:owner,is_anonymous:false});assert.deepEqual(await p.rpc('synthetic',call),{data:{source:'synthetic-transport-only'},error:null});
 assert.deepEqual(seen,['https://synthetic.supabase.co/auth/v1/user','https://synthetic.supabase.co/rest/v1/rpc/concierge_client_service_financials_read_v1']);
 await assert.rejects(p.rpc('synthetic',{name:'concierge_service_write',args:{}}));assert.equal(seen.length,2);
});
test('invalid fixed-call envelope or oversized command refuses before HTTP',async()=>{
 let calls=0;const p=await runtime(async()=>{calls++;throw Error('unexpected_HTTP');});
 for(const bad of [{...call,args:{...call.args,clientId:owner}},{...call,args:{}},{...call,args:{p_command:undefined}},{...call,args:{p_command:{pad:'x'.repeat(8193)}}}])await assert.rejects(p.rpc('synthetic',bad));
 assert.equal(calls,0);
});
for(const status of [401,403])test('received Auth '+status+' with unreadable body stays denied',async()=>{
 const p=await runtime(async()=>new Response(new ReadableStream({start(c){c.error(Error('private_body'));}}),{status}));assert.equal(await p.authenticate('synthetic'),null);
});
for(const status of [401,403])test('received RPC '+status+' remains definite despite unreadable body',async()=>{
 const p=await runtime(async()=>new Response(new ReadableStream({start(c){c.error(Error('private_body'));}}),{status}));const r=await p.rpc('synthetic',call);assert.equal(r.error.status,status);assert.equal(r.data,null);
});
test('redirect refuses before any body pull and never awaits remote cancel',async()=>{
 let pulls=0,cancels=0;const p=await runtime(async()=>new Response(new ReadableStream({pull(){pulls++;},cancel(){cancels++;return new Promise(()=>{});}},{highWaterMark:0}),{status:307,headers:{location:'https://off-origin.invalid/secret'}}));
 await assert.rejects(p.rpc('synthetic',call));assert.equal(pulls,0);assert.equal(cancels,1);
});
test('RPC provider success is bounded at256KiB instead of retained unbounded history',async()=>{
 const p=await runtime(async()=>new Response(' '.repeat(262145)+'{}'));await assert.rejects(p.rpc('synthetic',call));
});
test('a signal-ignoring late RPC success never returns private data after abort',async()=>{
 const abort=new AbortController();const p=await runtime(async()=>{abort.abort();return Response.json({privateValue:'must_not_return'});});await assert.rejects(p.rpc('synthetic',call,abort.signal));
});
test('already-aborted reads never begin HTTP and late Auth success cannot return an identity',async()=>{
 let calls=0;const abort=new AbortController();abort.abort();const p=await runtime(async()=>{calls++;return Response.json({id:owner,is_anonymous:false});});await assert.rejects(p.rpc('synthetic',call,abort.signal));await assert.rejects(p.authenticate('synthetic',abort.signal));assert.equal(calls,0);
 const late=new AbortController();const other=await runtime(async()=>{late.abort();return Response.json({id:owner,is_anonymous:false});});await assert.rejects(other.authenticate('synthetic',late.signal));
});
function held(){let release;return {promise:new Promise(r=>{release=r;}),release:value=>release(value)};}
async function settlesSoon(p){let timer;try{return await Promise.race([p.then(()=> 'fulfilled',()=> 'rejected'),new Promise(r=>{timer=setTimeout(()=>r('waiting'),250);})]);}finally{clearTimeout(timer);}}
test('an abort retires a stalled body even when the body ignores the fetch signal',async()=>{
 const abort=new AbortController(),entered=held();let source;
 const p=await runtime(async()=>new Response(new ReadableStream({start(c){source=c;},pull(){entered.release();}},{highWaterMark:0})));
 const pending=p.rpc('synthetic',call,abort.signal);await entered.promise;abort.abort();
 try{assert.equal(await settlesSoon(pending),'rejected');}finally{try{source.enqueue(new TextEncoder().encode('{}'));source.close();}catch{}await pending.catch(()=>{});}
});
test('an abort retires a signal-ignoring stalled fetch and discards its eventual response',async()=>{
 const abort=new AbortController(),entered=held(),release=held();let cancelled=0;
 const p=await runtime(async()=>{entered.release();await release.promise;return new Response(new ReadableStream({cancel(){cancelled++;}},{highWaterMark:0}));});
 const pending=p.rpc('synthetic',call,abort.signal);await entered.promise;abort.abort();
 try{assert.equal(await settlesSoon(pending),'rejected');}finally{release.release();await pending.catch(()=>{});await new Promise(r=>setImmediate(r));}
 assert.equal(cancelled,1);
});
test('Auth response obeys the pinned8KiB bound',async()=>{
 const p=await runtime(async()=>Response.json({id:owner,is_anonymous:false,pad:'x'.repeat(8193)}));await assert.rejects(p.authenticate('synthetic'));
});
for(const status of [401,403])test('already observed RPC '+status+' outranks a coincident abort',async()=>{
 const abort=new AbortController();const p=await runtime(async()=>{const response=new Response(null,{status});abort.abort();return response;});
 const result=await p.rpc('synthetic',call,abort.signal);assert.equal(result.error.status,status);
});

test('canonical command selectors and non-read actions refuse before RPC HTTP',async()=>{
 let calls=0;const p=await runtime(async()=>{calls++;throw Error('unexpected_HTTP');});
 for(const patch of [{clientId:owner},{actorId:owner},{role:'client'},{requestId:owner},{rpc:'other'},{url:'https://other.invalid'},{action:'submit_claim'}])await assert.rejects(p.rpc('synthetic',{...call,args:{p_command:{...command,...patch}}}));
 assert.equal(calls,0);
});
