import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { buildConciergeRpc } from '../supabase/functions/concierge-operations/commands.ts';
import { handleConciergeRequest } from '../supabase/functions/concierge-operations/handler.ts';
import { ownerId, otherId, requestId, recommendation } from './fixtures/concierge.ts';
const fixture = () => JSON.parse(readFileSync(new URL('./fixtures/concierge-presentation.json', import.meta.url), 'utf8'));
function draft(p = fixture().presentation) { return {action:'save_draft_v2',clientId:otherId,requestId,expectedRevision:1,intakeVersion:1,recommendations:[recommendation],advisorNote:'PRIVATE_CANARY',presentation:p}; }
test('R2 draft preserves arbitrary products, significance, keep/deferred/no-addition and nonproduct instructions',()=>{
 const input=draft(), call=buildConciergeRpc(input,ownerId);
 assert.equal(call.name,'concierge_presentation_write');
 assert.deepEqual((call.args as any).p_payload.presentation,input.presentation);
 assert.equal((call.args as any).p_action,'save_draft_v2');
});
test('R2 intake preserves explicitly public consultation without copying private note',()=>{
 const f=fixture(), call=buildConciergeRpc({action:'save_intake_v2',clientId:otherId,requestId,expectedRevision:0,goal:'Goal',note:'PRIVATE',baseline:f.baseline,presentation:f.intakePresentation},ownerId);
 assert.equal(call.name,'concierge_presentation_write');assert.deepEqual((call.args as any).p_payload.presentation,f.intakePresentation);
});
test('R2 dedicated reads and publish route to fixed authenticated RPC names',()=>{
 assert.deepEqual(buildConciergeRpc({action:'client_read_v2'},ownerId),{name:'concierge_client_view_v2',args:{}});
 assert.deepEqual(buildConciergeRpc({action:'advisor_read_v2',clientId:otherId},ownerId),{name:'concierge_advisor_view_v2',args:{p_client_id:otherId}});
 assert.equal(buildConciergeRpc({action:'publish_v2',clientId:otherId,requestId,expectedRevision:2},ownerId).name,'concierge_presentation_write');
});
test('R2 rejects authority injection, mismatched binding, duplicate cards, unsafe URLs, unknown keys and unsafe dates',()=>{
 const mutations=[(p:any)=>p.categoryCards[0].proposedProduct.id='other',(p:any)=>p.categoryCards.push(p.categoryCards[0]),(p:any)=>p.sources[0].url='javascript:alert(1)',(p:any)=>p.categoryCards[0].proposedProduct.productUrl='https://user:password@example.com/',(p:any)=>p.categoryCards[0].proposedProduct.imageUrl='assets/../secret.png',(p:any)=>p.preparedOn='2026-02-30',(p:any)=>p.sources[0].url='https://127.1/',(p:any)=>p.extra='PRIVATE',(p:any)=>p.categoryCards[0].comparisons[0].ingredientGuideKey='made-up'];
 for(const mutate of mutations){const p=fixture().presentation;mutate(p);assert.throws(()=>buildConciergeRpc(draft(p),ownerId),/invalid_input/);}
 assert.throws(()=>buildConciergeRpc({...draft(),actorId:otherId},ownerId),/invalid_input/);
});
test('legacy-version fence is a specific 409 through the real operations handler',async()=>{
 const response=await handleConciergeRequest(new Request('https://example.com/operations',{method:'POST',headers:{authorization:'Bearer token','content-type':'application/json'},body:JSON.stringify({action:'client_read'})}),{allowedOrigins:[],authenticate:async()=>({id:ownerId,is_anonymous:false}),rpc:async()=>({data:null,error:{message:'concierge_content_version_required'}})});
 assert.equal(response.status,409);assert.deepEqual(await response.json(),{code:'concierge_content_version_required'});
});
test('R2 real handler keeps public snapshots and active baseline while excluding private fields',async()=>{
 const f=fixture();
 const data={schemaVersion:2,revision:3,plan:{version:1,recommendations:[recommendation],itemStates:[{recommendationId:recommendation.id,choice:null,reason:null,received:false,startedOn:null}],presentation:f.presentation},history:[],orderProposal:{kind:'proposal',currency:'USD',items:[],subtotalCents:0,payable:false,shippingAndTaxConfirmed:false},routine:f.baseline,routineHistory:[],activeRoutine:f.presentation.baselineRoutine.map((s:any)=>({...s,source:{kind:'baseline',publicationVersion:1,recommendationId:null},guides:[]})),meetingNotes:['PRIVATE_CANARY']};
 const response=await handleConciergeRequest(new Request('https://example.com/operations',{method:'POST',headers:{authorization:'Bearer token','content-type':'application/json'},body:JSON.stringify({action:'client_read_v2'})}),{allowedOrigins:[],authenticate:async()=>({id:ownerId,is_anonymous:false}),rpc:async()=>({data,error:null})});
 assert.equal(response.status,200);const v=await response.json();assert.deepEqual(v.plan.presentation,f.presentation);assert.equal(v.activeRoutine.length,4);assert.equal(JSON.stringify(v).includes('PRIVATE_CANARY'),false);
});
test('complete valid guide history is preserved above 24 guides and SQL key order is immaterial',async()=>{
 const {mapConciergeClientViewV2}=await import('../src/contracts/ConciergePresentationMapping.ts');
 const f=fixture(),p=f.presentation,pid='original';p.baselineRoutine=[];p.categoryCards=[];p.routineGuides=[];
 for(let i=0;i<26;i++){
  const sample=fixture(),s=sample.presentation.baselineRoutine[1],c=sample.presentation.categoryCards[0];s.id='step-'+i;s.slot='slot-'+i;s.productId=pid;s.product.id=pid;p.baselineRoutine.push(s);
  c.id='card-'+i;c.slot=s.slot;c.kind='keep';c.recommendationId=null;c.proposedProduct=null;c.how.productId=pid;c.how.id='guide-'+i;p.categoryCards.push(c);
 }
 const guides=p.categoryCards.map((c:any)=>c.how);const unordered=JSON.parse(JSON.stringify(guides),(key,value)=>value&&typeof value==='object'&&!Array.isArray(value)?Object.fromEntries(Object.entries(value).reverse()):value);
 const data={schemaVersion:2,revision:3,plan:{version:1,recommendations:[],itemStates:[],presentation:p},history:[],orderProposal:{kind:'proposal',currency:'USD',items:[],subtotalCents:0,payable:false,shippingAndTaxConfirmed:false},routine:p.baselineRoutine.map((s:any)=>({slot:s.slot,productId:s.productId})),routineHistory:[],activeRoutine:p.baselineRoutine.map((s:any)=>({...s,source:{kind:'baseline',publicationVersion:1,recommendationId:null},guides:unordered}))};
 assert.equal(mapConciergeClientViewV2(data).activeRoutine[0].guides.length,26);
});
test('URLs reject private signed uploads, credential queries, invalid ports and ambiguous IDNA as invalid input',()=>{
 for(const url of ['https://example.com:99999/','https://xn--a.example/','https://project.supabase.co/storage/v1/object/sign/concierge-checkin-photos/owner/photo.png?token=private-token','https://example.com/p?access_token=secret','https://example.com/%63oncierge-payment-evidence/photo.png']){
  const p=fixture().presentation;p.categoryCards[0].proposedProduct.imageUrl=url;
  assert.throws(()=>buildConciergeRpc(draft(p),ownerId),(error:any)=>error.message==='invalid_input');
 }
});
test('URL path normalization cannot conceal an authenticated private Storage route',()=>{
 for(const url of ['https://project.supabase.co/storage/v1/object/folder/../authenticated/customer-skin-photos/owner/private.jpg','https://project.supabase.co/storage/v1/object/folder/%2e%2e/authenticated/customer-skin-photos/private.jpg']){
  const p=fixture().presentation;p.categoryCards[0].proposedProduct.productUrl=url;
  assert.throws(()=>buildConciergeRpc(draft(p),ownerId),/invalid_input/);
 }
});
