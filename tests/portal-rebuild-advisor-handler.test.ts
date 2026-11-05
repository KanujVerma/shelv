import assert from 'node:assert/strict';
import {test} from 'node:test';
import {handlePlanRequest} from '../supabase/functions/concierge-plans/handler.ts';
import {createPlanPorts} from '../supabase/functions/concierge-plans/runtime.ts';
const id='10000000-0000-4000-8000-000000000001';
const target={draftId:id,clientId:id,contentRevision:1,assignmentRevision:1,contentHash:'a'.repeat(64)};
const publisher={kind:'human',actorId:id};
const gate={schemaVersion:1,clientId:id,target,publisher,approval:null,publication:'first',coverage:'inactive',capabilities:{actorId:id,view:true,edit:false,assign:false,review:false,approve:false,publish:false,confirmPayments:false},policy:{revision:2,ownerActorId:id,requireKanujApproval:true}};
const command={schemaVersion:1,action:'read_advisor_gate_v1',target,publisher};
const req=(body:unknown)=>new Request('https://edge.invalid',{method:'POST',headers:{'content-type':'application/json',origin:'https://portal.goshelv.com',authorization:'Bearer caller'},body:JSON.stringify(body)});
test('advisor read uses verified caller bearer and the one fixed plan RPC',async()=>{
 const calls:{url:string;init?:RequestInit}[]=[];
 const ports=createPlanPorts({supabaseUrl:'https://synthetic.supabase.co',publicKey:'public-key',allowedOrigins:['https://portal.goshelv.com'],fetch:async(input,init)=>{calls.push({url:String(input),init});return Response.json(calls.length===1?{id,is_anonymous:false}:gate);}});
 const r=await handlePlanRequest(req(command),ports);assert.equal(r.status,200);assert.deepEqual(await r.json(),gate);
 assert.deepEqual(calls.map(c=>new URL(c.url).pathname),['/auth/v1/user','/rest/v1/rpc/concierge_plan_command_v1']);assert.equal((calls[1]?.init?.headers as Record<string,string>).authorization,'Bearer caller');
});
test('advisor read rejects private/mismatched authority responses without leaking canaries',async()=>{
 for(const data of [{...gate,privateSource:'PRIVATE_CANARY'},{...gate,target:{...target,contentRevision:9}}]){
  const r=await handlePlanRequest(req(command),{allowedOrigins:['https://portal.goshelv.com'],authenticate:async()=>({id,is_anonymous:false}),rpc:async()=>({data,error:null})});
  assert.equal(r.status,503);assert.ok(!(await r.text()).includes('PRIVATE_CANARY'));
 }
});
test('read failure propagates safe authorization/session errors and cannot select another RPC',async()=>{
 const ports={allowedOrigins:['https://portal.goshelv.com'],authenticate:async()=>({id,is_anonymous:false}),rpc:async()=>({data:null,error:{message:'concierge_forbidden'}})};
 assert.equal((await handlePlanRequest(req(command),ports)).status,403);
 assert.equal((await handlePlanRequest(req({...command,rpc:'raw_private_table'}),ports)).status,400);
});
