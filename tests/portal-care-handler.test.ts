import assert from 'node:assert/strict';
import {test} from 'node:test';
import {handleCareRequest} from '../supabase/functions/concierge-care/handler.ts';
import {createCarePorts} from '../supabase/functions/concierge-care/runtime.ts';
const id='10000000-0000-4000-8000-000000000001';
const command={schemaVersion:1,action:'request_status_v1',requestId:id};
const req=(body:unknown=command)=>new Request('https://edge.invalid',{method:'POST',headers:{authorization:'Bearer synthetic','content-type':'application/json',origin:'https://portal.goshelv.com'},body:JSON.stringify(body)});
test('same authenticated handler refuses unknown actions and private status payloads',async()=>{
 const ports={allowedOrigins:['https://portal.goshelv.com'],authenticate:async()=>({id,is_anonymous:false}),rpc:async()=>({data:{status:'absent'},error:null})};
 assert.equal((await handleCareRequest(req(),ports)).status,200);
 assert.equal((await handleCareRequest(req({...command,clientId:id}),ports)).status,400);
 assert.equal((await handleCareRequest(req(),{...ports,rpc:async()=>({data:{status:'absent',privateNote:'secret'},error:null})})).status,503);
 assert.equal((await handleCareRequest(req(),{...ports,rpc:async()=>({data:null,error:{message:'concierge_use_version_required'}})})).status,409);
 assert.deepEqual(await (await handleCareRequest(req(),{...ports,rpc:async()=>{throw Error('private sql');}})).json(),{code:'unavailable'});
});
test('fixed care runtime propagates caller bearer through retained Auth ports',async()=>{
 const seen:string[]=[];
 const ports=createCarePorts({supabaseUrl:'https://synthetic.supabase.co',publicKey:'public-test-key',allowedOrigins:['https://portal.goshelv.com'],fetch:async(input,init)=>{const url=String(input);seen.push(url);assert.equal(new Headers(init?.headers).get('authorization'),'Bearer synthetic');return new Response(JSON.stringify(url.endsWith('/user')?{id,is_anonymous:false}:{status:'absent'}),{status:200,headers:{'content-type':'application/json'}});}});
 assert.equal((await handleCareRequest(req(),ports)).status,200);assert.deepEqual(seen,['https://synthetic.supabase.co/auth/v1/user','https://synthetic.supabase.co/rest/v1/rpc/concierge_care_command_v1']);
});
test('retained Plan handler returns finite409 for care version requirement',async()=>{
 const {handlePlanRequest}=await import('../supabase/functions/concierge-plans/handler.ts');
 const response=await handlePlanRequest(req({schemaVersion:1,action:'read_client_plan_v1',version:1}),{allowedOrigins:['https://portal.goshelv.com'],authenticate:async()=>({id,is_anonymous:false}),rpc:async()=>({data:null,error:{message:'concierge_use_version_required'}})});
 assert.equal(response.status,409);assert.deepEqual(await response.json(),{code:'use_version_required'});
});
