import test from 'node:test';
import assert from 'node:assert/strict';
import {buildConciergeRpc} from '../supabase/functions/concierge-operations/commands.ts';
import {handleConciergeRequest} from '../supabase/functions/concierge-operations/handler.ts';
import {mapServiceView} from '../src/contracts/ConciergeService.ts';
const owner='10000000-0000-4000-8000-000000000001',advisor='10000000-0000-4000-8000-000000000003',requestId='10000000-0000-4000-8000-000000000010';
const review={action:'record_review',clientId:owner,requestId,expectedRevision:0,channel:'text',occurredOn:'2026-10-20',summary:'Talked about comfort',reportedUse:'Using existing products',decision:'Keep routine',nextReviewOn:'2026-11-03',privateNote:'PRIVATE_CANARY'};
const empty=()=>({revision:0,reviews:[],instructions:[],purchases:[],returns:[],cancellation:null});
test('advisor-origin review requires no client report and actor/time cannot be supplied',()=>{
 const call=buildConciergeRpc(review,advisor);assert.equal(call.name,'concierge_service_write');assert.deepEqual(call.args,{p_client_id:owner,p_action:'record_review',p_expected_revision:0,p_request_id:requestId,p_payload:Object.fromEntries(Object.entries(review).filter(([k])=>!['action','clientId','requestId','expectedRevision'].includes(k)))});
 for(const field of ['createdBy','recordedAt','checkinId'])assert.throws(()=>buildConciergeRpc({...review,[field]:advisor},advisor));
 assert.throws(()=>buildConciergeRpc({...review,channel:'email'},advisor));
});
test('client return ownership always comes from verified identity',()=>{
 const command={action:'request_return',requestId,expectedRevision:2,purchaseId:requestId,quantity:1,reason:'Unused',condition:'unopened'};
 const c=buildConciergeRpc(command,owner);assert.equal(c.name,'concierge_service_write');assert.equal(c.args.p_client_id,owner);
 assert.throws(()=>buildConciergeRpc({...command,clientId:advisor},owner));
});
test('service read reconstructs safe public fields and never copies private records',()=>{
 const view=mapServiceView({...empty(),privateNotes:[{note:'PRIVATE_CANARY'}],privatePurchases:[{orderReference:'SECRET'}]});assert.deepEqual(view,empty());assert.doesNotMatch(JSON.stringify(view),/PRIVATE|SECRET/);
});
test('service handler maps receipts and errors and preserves exact command retries',async()=>{
 const calls:unknown[]=[];const request=()=>new Request('https://service.invalid',{method:'POST',headers:{authorization:'Bearer synthetic','content-type':'application/json'},body:JSON.stringify(review)});
 const ports={allowedOrigins:[],authenticate:async()=>({id:advisor,is_anonymous:false}),rpc:async(_token:string,call:any)=>{calls.push(call);return {data:{revision:1,operation:'record_review',entityId:requestId,privateNote:'PRIVATE_CANARY'},error:null};}};
 for(let i=0;i<2;i++){const r=await handleConciergeRequest(request(),ports);assert.equal(r.status,200);assert.deepEqual(await r.json(),{revision:1,operation:'record_review',entityId:requestId});}assert.deepEqual(calls[0],calls[1]);
 for(const code of ['instruction_conflict','return_ineligible','return_quantity_exceeded','refund_exceeded','renewal_cancelled']){const r=await handleConciergeRequest(request(),{...ports,rpc:async()=>({data:null,error:{message:'concierge_'+code}})});assert.equal(r.status,409);}
});
