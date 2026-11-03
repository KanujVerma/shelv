import assert from 'node:assert/strict';
import {test} from 'node:test';
import {resolve} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
const root=process.env.W5_COMMERCE_SOURCE_ROOT??fileURLToPath(new URL('../../..',import.meta.url));
const {handleCommerceRequest}=await import(pathToFileURL(resolve(root,'supabase/functions/concierge-commerce/handler.ts')).href);
const {createCommercePorts}=await import(pathToFileURL(resolve(root,'supabase/functions/concierge-commerce/runtime.ts')).href);
const id='10000000-0000-4000-8000-000000000001',origin='https://portal.goshelv.com';
const status={schemaVersion:1,action:'request_status_v1',requestId:id},write={schemaVersion:1,action:'request_service_refund_v1',requestId:id,reason:null};
const request=(value=status,headers={})=>new Request('https://edge.invalid',{method:'POST',headers:{authorization:'Bearer synthetic','content-type':'application/json',origin,...headers},body:JSON.stringify(value)});
const ports={allowedOrigins:[origin],authenticate:async()=>({id,is_anonymous:false}),rpc:async()=>({data:{status:'absent'},error:null})};
globalThis.fetch=async()=>{throw Error('external_network_forbidden');};
test('Commerce actual retained Auth/runtime has one fixed RPC and public-key bearer plumbing (synthetic HTTP)',async()=>{
 const seen=[];const runtime=createCommercePorts({supabaseUrl:'https://synthetic.supabase.co',publicKey:'synthetic-public-key',allowedOrigins:[origin],fetch:async(input,init)=>{const url=String(input);seen.push(url);assert.equal(new Headers(init?.headers).get('authorization'),'Bearer synthetic');assert.equal(new Headers(init?.headers).get('apikey'),'synthetic-public-key');return new Response(JSON.stringify(url.endsWith('/user')?{id,is_anonymous:false}:{status:'absent'}),{status:200,headers:{'content-type':'application/json'}});}});
 const response=await handleCommerceRequest(request(),runtime);assert.equal(response.status,200);assert.deepEqual(await response.json(),{status:'absent'});assert.deepEqual(seen,['https://synthetic.supabase.co/auth/v1/user','https://synthetic.supabase.co/rest/v1/rpc/concierge_commerce_command_v1']);
 await assert.rejects(runtime.rpc('synthetic',{name:'concierge_write',args:{}}));
});
test('Commerce malformed WRITE acknowledgement and RPC loss remain uncertain; status is READ unavailable',async()=>{
 for(const rpc of [async()=>({data:{privateReference:'PRIVATE'},error:null}),async()=>{throw Error('PRIVATE_PROVIDER');}]){
  const w=await handleCommerceRequest(request(write),{...ports,rpc});assert.equal(w.status,503);assert.deepEqual(await w.json(),{code:'uncertain'});
  const r=await handleCommerceRequest(request(),{...ports,rpc});assert.equal(r.status,503);assert.deepEqual(await r.json(),{code:'unavailable'});
 }
});
test('Commerce strict input/owner/media/origin/anonymous/session and finite SQL errors remain closed',async()=>{
 for(const value of [{...write,clientId:id},{...write,actorId:id},{...write,bankTransfer:true},{...status,rpc:'other'}])assert.equal((await handleCommerceRequest(request(value),ports)).status,400);
 assert.equal((await handleCommerceRequest(request(),{...ports,authenticate:async()=>null})).status,401);assert.equal((await handleCommerceRequest(request(),{...ports,authenticate:async()=>({id,is_anonymous:true})})).status,403);
 assert.equal((await handleCommerceRequest(request(status,{origin:'https://other.invalid'}),ports)).status,403);
 assert.equal((await handleCommerceRequest(new Request('https://edge.invalid',{method:'POST',headers:{authorization:'Bearer synthetic','content-type':'application/json'},body:' '.repeat(500001)}),ports)).status,413);
 for(const [message,status,code] of [['concierge_revision_conflict',409,'revision_conflict'],['concierge_session_ended',401,'session_ended'],['concierge_refund_exceeded',409,'refund_exceeded']]){const r=await handleCommerceRequest(request(write),{...ports,rpc:async()=>({data:null,error:{message}})});assert.equal(r.status,status);assert.deepEqual(await r.json(),{code});}
 const privateError=await handleCommerceRequest(request(),{...ports,rpc:async()=>({data:null,error:{message:'PRIVATE_SQL_ACCOUNT'}})});assert.deepEqual(await privateError.json(),{code:'unavailable'});
});

function transport(send){return createCommercePorts({supabaseUrl:'https://synthetic.supabase.co',publicKey:'synthetic-public-key',allowedOrigins:[origin],fetch:send});}
for(const denied of [401,403])test('known Auth '+denied+' survives an unreadable body without RPC or private error disclosure',async()=>{
 let calls=0;
 const r=await handleCommerceRequest(request(),transport(async()=>{calls++;return new Response(new ReadableStream({start(c){c.error(Error('private-body'));}}),{status:denied});}));
 assert.equal(r.status,401);assert.deepEqual(await r.json(),{code:'unauthorized'});assert.equal(calls,1);
});
for(const denied of [401,403])test('known RPC '+denied+' survives an unreadable body as definite denial',async()=>{
 let calls=0;
 const r=await handleCommerceRequest(request(write),transport(async input=>{
  calls++;if(String(input).endsWith('/user'))return Response.json({id,is_anonymous:false});
  return new Response(new ReadableStream({start(c){c.error(Error('private-body'));}}),{status:denied});
 }));
 assert.equal(r.status,denied);assert.deepEqual(await r.json(),{code:denied===401?'session_ended':'forbidden'});assert.equal(calls,2);
});
test('fixed runtime requests manual redirects and never reads or waits for a redirect body',async()=>{
 let calls=0,reads=0,cancelled=0;
 const r=await handleCommerceRequest(request(write),transport(async(_input,init)=>{
  calls++;assert.equal(init.redirect,'manual');
  return new Response(new ReadableStream({pull(){reads++;},cancel(){cancelled++;return new Promise(()=>{});}},{highWaterMark:0}),{status:302,headers:{location:'https://untrusted.invalid/private'}});
 }));
 assert.equal(r.status,503);assert.deepEqual(await r.json(),{code:'unavailable'});assert.equal(calls,1);assert.equal(reads,0);assert.equal(cancelled,1);
});
test('RPC redirect cannot become committed status or an off-origin second request',async()=>{
 const seen=[];
 const r=await handleCommerceRequest(request(),transport(async(input,init)=>{
  const url=String(input);seen.push(url);assert.equal(init.redirect,'manual');
  return url.endsWith('/user')?Response.json({id,is_anonymous:false}):new Response('{"status":"absent"}',{status:307,headers:{location:'https://untrusted.invalid/receipt'}});
 }));
 assert.equal(r.status,503);assert.deepEqual(await r.json(),{code:'unavailable'});assert.deepEqual(seen,['https://synthetic.supabase.co/auth/v1/user','https://synthetic.supabase.co/rest/v1/rpc/concierge_commerce_command_v1']);
});
test('oversized provider success remains unavailable within finite envelope',async()=>{
 const r=await handleCommerceRequest(request(),transport(async input=>String(input).endsWith('/user')?Response.json({id,is_anonymous:false}):new Response(' '.repeat(2000001)+'{}')));
 assert.equal(r.status,503);assert.deepEqual(await r.json(),{code:'unavailable'});
});
