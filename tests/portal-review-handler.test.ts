import assert from 'node:assert/strict';
import {test} from 'node:test';
import {handleReviewRequest} from '../supabase/functions/concierge-reviews/handler.ts';
import {handleGuidanceRequest} from '../supabase/functions/concierge-guidance/handler.ts';
import {createReviewPorts} from '../supabase/functions/concierge-reviews/runtime.ts';
import {createGuidancePorts} from '../supabase/functions/concierge-guidance/runtime.ts';
import {handlePlanRequest} from '../supabase/functions/concierge-plans/handler.ts';
const id='10000000-0000-4000-8000-000000000001',origin='https://portal.goshelv.com';
const status={schemaVersion:1,action:'request_status_v1',requestId:id};
const submit={schemaVersion:1,action:'submit_goal_report_v1',requestId:id,expectedReportRevision:0,occurredOn:{state:'unknown'},body:{publication:{version:1,documentSchemaVersion:3},answers:[],comfort:null,notes:null,actualUseEventIds:[],photoIds:[]}};
const req=(body:unknown=status,extra:Record<string,string>={})=>new Request('https://edge.invalid',{method:'POST',headers:{authorization:'Bearer synthetic','content-type':'application/json',origin,...extra},body:JSON.stringify(body)});
const ports={allowedOrigins:[origin],authenticate:async()=>({id,is_anonymous:false}),rpc:async()=>({data:{status:'absent'},error:null})};
test('fixed Review and Guidance runtime use actual retained bearer Auth and their one RPC only',async()=>{
 for(const [create,handle,rpc] of [[createReviewPorts,handleReviewRequest,'concierge_review_command_v1'],[createGuidancePorts,handleGuidanceRequest,'concierge_guidance_command_v1']] as const){
  const seen:string[]=[];const port=create({supabaseUrl:'https://synthetic.supabase.co',publicKey:'public-test-key',allowedOrigins:[origin],fetch:async(input,init)=>{const url=String(input);seen.push(url);assert.equal(new Headers(init?.headers).get('authorization'),'Bearer synthetic');return new Response(JSON.stringify(url.endsWith('/user')?{id,is_anonymous:false}:{status:'absent'}),{status:200,headers:{'content-type':'application/json'}});}});
  assert.equal((await handle(req(),port as never)).status,200);assert.deepEqual(seen,['https://synthetic.supabase.co/auth/v1/user',`https://synthetic.supabase.co/rest/v1/rpc/${rpc}`]);
 }
});
test('malformed write success and transport loss are uncertain; read/status failure stays unavailable',async()=>{
 const malformed={...ports,rpc:async()=>({data:{privateSql:'secret'},error:null})};
 assert.deepEqual(await (await handleReviewRequest(req(submit),malformed)).json(),{code:'uncertain'});
 assert.deepEqual(await (await handleReviewRequest(req(status),malformed)).json(),{code:'unavailable'});
 const lost={...ports,rpc:async()=>{throw Error('private password');}};
 assert.deepEqual(await (await handleReviewRequest(req(submit),lost)).json(),{code:'uncertain'});
 assert.deepEqual(await (await handleGuidanceRequest(req(status),lost)).json(),{code:'unavailable'});
});
test('strict handler input, raw byte bounds, current identity and safe error namespaces stay closed',async()=>{
 for(const body of [{...submit,clientId:id},{...submit,apiKey:'secret'},{schemaVersion:1,action:'record_review'}, {...status,rpc:'other'}])assert.equal((await handleReviewRequest(req(body),ports)).status,400);
 assert.equal((await handleReviewRequest(req(),{...ports,authenticate:async()=>({id,is_anonymous:true})})).status,403);
 assert.equal((await handleReviewRequest(req(),{...ports,authenticate:async()=>null})).status,401);
 assert.equal((await handleReviewRequest(req(),{...ports,authenticate:async()=>({id:'not-an-id',is_anonymous:false})})).status,401);
 assert.equal((await handleReviewRequest(req(status,{origin:'https://hostile.invalid'}),ports)).status,403);
 const over=new Request('https://edge.invalid',{method:'POST',headers:{authorization:'Bearer synthetic','content-type':'application/json'},body:' '.repeat(500001)});assert.equal((await handleReviewRequest(over,ports)).status,413);
 for(const code of ['guidance_version_required','guidance_conflict']){
  const response=await handleReviewRequest(req(status),{...ports,rpc:async()=>({data:null,error:{message:`concierge_${code}`}})});assert.equal(response.status,409);assert.deepEqual(await response.json(),{code});
 }
 assert.deepEqual(await (await handleReviewRequest(req(status),{...ports,rpc:async()=>({data:null,error:{message:'private SQL password'}})})).json(),{code:'unavailable'});
});
test('retained actual Plan handler must preserve finite409 when an old decision/read needs current guidance',async()=>{
 const command={schemaVersion:1,action:'record_decision_v1',requestId:id,expectedDecisionRevision:0,publicationVersion:1,decisionId:'decision',choice:'approved',reason:null};
 const response=await handlePlanRequest(req(command),{...ports,rpc:async()=>({data:null,error:{message:'concierge_guidance_version_required'}})});
 assert.equal(response.status,409);assert.deepEqual(await response.json(),{code:'guidance_version_required'});
});
