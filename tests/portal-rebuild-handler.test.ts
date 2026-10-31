import assert from 'node:assert/strict';
import {test} from 'node:test';
import {handlePlanRequest} from '../supabase/functions/concierge-plans/handler.ts';
import {createPlanPorts} from '../supabase/functions/concierge-plans/runtime.ts';
import {mapPlanResult} from '../src/contracts/PortalRebuildMapping.ts';
const id='10000000-0000-4000-8000-000000000001';
const command={schemaVersion:1 as const,action:'read_policy_v1' as const};
const policy={revision:1,ownerActorId:id,requireKanujApproval:true};
const req=(body:unknown,token='token')=>new Request('https://edge.invalid',{method:'POST',headers:{'content-type':'application/json',origin:'https://portal.goshelv.com',authorization:'Bearer '+token},body:JSON.stringify(body)});
test('fixed authenticated Auth and RPC transport retains bearer, with no service/admin or caller endpoint',async()=>{
 const calls:{url:string;init?:RequestInit}[]=[];
 const ports=createPlanPorts({supabaseUrl:'https://synthetic.supabase.co',publicKey:'public-key',allowedOrigins:['https://portal.goshelv.com'],fetch:async(input,init)=>{calls.push({url:String(input),init});return Response.json(calls.length===1?{id,is_anonymous:false}:policy);}});
 const reply=await handlePlanRequest(req(command),ports);assert.equal(reply.status,200);assert.deepEqual(await reply.json(),policy);
 assert.deepEqual(calls.map(c=>new URL(c.url).pathname),['/auth/v1/user','/rest/v1/rpc/concierge_plan_command_v1']);
 assert.equal(JSON.parse(String(calls[1].init?.body)).p_command.action,'read_policy_v1');
 assert.equal((calls[1].init?.headers as Record<string,string>).authorization,'Bearer token');
});
test('strict result mapper rejects an accidentally broadened private response',()=>{
 assert.deepEqual(mapPlanResult(policy,command),policy);
 assert.throws(()=>mapPlanResult({...policy,privateNote:'PRIVATE'},command));
});
test('unverified identities, code/unknown fields and unsafe upstream errors fail closed',async()=>{
 const base={allowedOrigins:['https://portal.goshelv.com'],authenticate:async()=>({id,is_anonymous:false}),rpc:async()=>({data:policy,error:null})};
 assert.equal((await handlePlanRequest(req(command),{...base,authenticate:async()=>null})).status,401);
 assert.equal((await handlePlanRequest(req(command),{...base,authenticate:async()=>({id,is_anonymous:true})})).status,403);
 assert.equal((await handlePlanRequest(req({...command,role:'owner'}),base)).status,400);
 const sql=await handlePlanRequest(req(command),{...base,rpc:async()=>({data:null,error:{message:'raw SQL PRIVATE',status:400}})});
 assert.equal(sql.status,503);assert.ok(!(await sql.text()).includes('PRIVATE'));
 const conflict=await handlePlanRequest(req(command),{...base,rpc:async()=>({data:null,error:{message:'concierge_approval_conflict'}})});assert.equal(conflict.status,409);
});
