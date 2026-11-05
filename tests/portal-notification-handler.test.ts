import assert from 'node:assert/strict';import {test} from 'node:test';import {existsSync} from 'node:fs';
const id='10000000-0000-4000-8000-000000000001',origin='https://portal.synthetic.invalid';
const original={schemaVersion:1,action:'mark_seen_v1',requestId:id,deliveryId:id,expectedRevision:0};
const command={schemaVersion:1,action:'request_status_v1',original};
const request=(value:unknown=command)=>new Request('https://edge.synthetic.invalid',{method:'POST',headers:{authorization:'Bearer synthetic','content-type':'application/json',origin},body:JSON.stringify(value)});
test('actual fixed notification HTTP runtime authenticates retained caller and never passes private malformed success',async()=>{
 assert.ok(existsSync(new URL('../supabase/functions/concierge-notifications/handler.ts',import.meta.url)),'notification HTTP handler does not exist');
 const {handleNotificationRequest}=await import('../supabase/functions/concierge-notifications/handler.ts');
 const {createNotificationPorts}=await import('../supabase/functions/concierge-notifications/runtime.ts');
 const external=globalThis.fetch;globalThis.fetch=async()=>{throw Error('external_fetch_denied');};
 try{
 const paths:string[]=[];const ports=createNotificationPorts({supabaseUrl:'https://notification.synthetic.invalid',publicKey:'synthetic-public',allowedOrigins:[origin],fetch:async(input,init)=>{
 const path=new URL(String(input)).pathname;paths.push(path);assert.equal(new Headers(init?.headers).get('authorization'),'Bearer synthetic');
 if(path==='/auth/v1/user')return Response.json({id,is_anonymous:false});
 assert.equal(path,'/rest/v1/rpc/concierge_notification_command_v1');assert.deepEqual(JSON.parse(String(init?.body)),{p_command:command});return Response.json({status:'unknown'});
 }});
 assert.deepEqual(await (await handleNotificationRequest(request(),ports)).json(),{status:'unknown'});assert.equal(paths.length,3);
 const bad={...ports,rpc:async()=>({data:{privateAddress:'PRIVATE'},error:null})};
 assert.deepEqual(await (await handleNotificationRequest(request(),bad)).json(),{code:'unavailable'});
 assert.deepEqual(await (await handleNotificationRequest(request(original),bad)).json(),{code:'uncertain'});
 assert.equal((await handleNotificationRequest(request({...command,recipientId:id}),ports)).status,400);
 }finally{globalThis.fetch=external;}
});
import {handleNotificationRequest} from '../supabase/functions/concierge-notifications/handler.ts';
import {createNotificationPorts} from '../supabase/functions/concierge-notifications/runtime.ts';
import type {NotificationPorts} from '../supabase/functions/concierge-notifications/handler.ts';
const testPorts:NotificationPorts={allowedOrigins:[origin],authenticate:async()=>({id,is_anonymous:false}),rpc:async()=>({data:{status:'unknown'},error:null})};
test('current session loss after RPC, anonymous identity and cross-origin never expose success',async()=>{
 let auth=0;const late={...testPorts,authenticate:async()=>++auth===1?{id,is_anonymous:false}:null};assert.equal((await handleNotificationRequest(request(),late)).status,401);
 assert.equal((await handleNotificationRequest(request(),{...testPorts,authenticate:async()=>({id,is_anonymous:true})})).status,403);
 const hostile=new Request(request(),{headers:{authorization:'Bearer synthetic','content-type':'application/json',origin:'https://hostile.invalid'}});assert.equal((await handleNotificationRequest(hostile,testPorts)).status,403);
 assert.equal((await handleNotificationRequest(new Request('https://edge.synthetic.invalid',{method:'GET'}),testPorts)).status,405);
});
test('raw command and upstream response bounds stay enforced and error messages never leak',async()=>{
 const oversized=new Request('https://edge.synthetic.invalid',{method:'POST',headers:{authorization:'Bearer synthetic','content-type':'application/json'},body:' '.repeat(8193)});assert.equal((await handleNotificationRequest(oversized,testPorts)).status,413);
 for(const action of [command,original]){
 const bad={...testPorts,rpc:async()=>{throw Error('PRIVATE_SQL_email');}};const r=await handleNotificationRequest(request(action),bad);assert.equal(r.status,503);assert.deepEqual(await r.json(),{code:action===original?'uncertain':'unavailable'});
 }
 const ports=createNotificationPorts({supabaseUrl:'https://notification.synthetic.invalid',publicKey:'synthetic-public',allowedOrigins:[origin],fetch:async(input)=>String(input).endsWith('/user')?Response.json({id,is_anonymous:false}):new Response(' '.repeat(100001))});
 assert.equal((await handleNotificationRequest(request(),ports)).status,503);
 const forbidden={...testPorts,rpc:async()=>({data:null,error:{message:'concierge_forbidden'}})};assert.equal((await handleNotificationRequest(request(original),forbidden)).status,403);
 const uncertainRetry={...testPorts,rpc:async()=>({data:null,error:{message:'concierge_reconciliation_unavailable'}})};assert.deepEqual(await (await handleNotificationRequest(request(),uncertainRetry)).json(),{code:'reconciliation_unavailable'});
});

// Every test fails closed if any dependency falls back to global network.
import {before,after} from 'node:test';
const originalGlobalFetch=globalThis.fetch;before(()=>{globalThis.fetch=async()=>{throw Error('global_external_fetch_denied');};});after(()=>{globalThis.fetch=originalGlobalFetch;});
