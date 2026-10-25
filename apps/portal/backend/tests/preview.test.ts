import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { buildConciergeRpc } from '../source/supabase/functions/concierge-operations/commands.ts';
import { handleConciergeRequest } from '../source/supabase/functions/concierge-operations/handler.ts';
import { createConciergeSupabasePorts } from '../source/supabase/functions/concierge-operations/runtime.ts';
const clientId='10000000-0000-4000-8000-000000000001', actor='10000000-0000-4000-8000-000000000003';
const command={action:'advisor_preview_read_v2',clientId,mode:'draft',expectedRevision:2};
const fixture=JSON.parse(readFileSync(new URL('../source/tests/fixtures/concierge-presentation.json',import.meta.url),'utf8'));
const recommendation={id:'moisturizer-v2',slot:'moisturizer',currentProductId:'original',proposedProductId:'replacement',priceCents:1600,currency:'USD',rationale:'Synthetic public rationale'};
const clientView={schemaVersion:2,revision:2,plan:null,history:[],orderProposal:{kind:'proposal',currency:'USD',items:[],subtotalCents:0,payable:false,shippingAndTaxConfirmed:false},routine:[],routineHistory:[],activeRoutine:[]};
const payments={revision:0,quotes:[],claims:[],service:{status:'unpaid',period:null},nextServicePeriod:null,shippingAddress:null,shippingAddresses:[]};
const checkins={revision:0,nextCheckinOn:null,reports:[]};
const envelope={schemaVersion:1,mode:'draft',clientId,revision:2,clientView,draft:{savedRevision:2,intakeVersion:1,presentation:fixture.presentation,recommendations:[recommendation]},payments,checkins};
function req(body:unknown=command){return new Request('https://example.invalid/operations',{method:'POST',headers:{authorization:'Bearer synthetic','content-type':'application/json'},body:JSON.stringify(body)});}
async function respond(data:unknown=envelope,body:unknown=command,error:null|{message:string}=null){let calls=0;const response=await handleConciergeRequest(req(body),{allowedOrigins:[],authenticate:async()=>({id:actor,is_anonymous:false}),rpc:async(_token,call)=>{calls++;assert.equal(call.name,'concierge_advisor_preview_v2');return {data,error};}});return {response,calls};}
test('preview action dispatches the one guarded read RPC with exact draft/published arguments',()=>{
 assert.deepEqual(buildConciergeRpc(command,actor),{name:'concierge_advisor_preview_v2',args:{p_client_id:clientId,p_mode:'draft',p_expected_revision:2}});
 assert.deepEqual(buildConciergeRpc({...command,mode:'published',expectedRevision:null},actor),{name:'concierge_advisor_preview_v2',args:{p_client_id:clientId,p_mode:'published',p_expected_revision:null}});
});
test('preview input rejects invalid mode, revision, UUID and any extra field before RPC',async()=>{
 for(const patch of [{mode:'sample'},{mode:null},{expectedRevision:null},{expectedRevision:-1},{expectedRevision:1.5},{expectedRevision:9007199254740992},{expectedRevision:'2'},{clientId:'other'},{advisor:true},{requestId:actor},{action:'advisor_preview_read_v2',mode:'published',expectedRevision:2}]){
  const {response,calls}=await respond(envelope,{...command,...patch});assert.equal(response.status,400,JSON.stringify(patch));assert.equal(calls,0);
 }
 const noRevision={...command} as any;delete noRevision.expectedRevision;assert.equal((await respond(envelope,noRevision)).response.status,400);
});
test('preview maps public data and removes private root/client/feature canaries',async()=>{
 const raw=structuredClone(envelope) as any;raw.meetingNotes='PRIVATE_ROOT';raw.clientView.advisorNote='PRIVATE_CLIENT';raw.draft.advisorNote='PRIVATE_DRAFT';raw.payments.private='PRIVATE_PAYMENT';raw.checkins.meetingNotes='PRIVATE_CHECKIN';
 const {response}=await respond(raw);assert.equal(response.status,200);const result=await response.json();assert.deepEqual(result,envelope);assert.ok(!JSON.stringify(result).includes('PRIVATE_'));
 assert.equal(response.headers.get('cache-control'),'private, no-store, max-age=0');
});
test('preview rejects returned target/mode/revision substitution and draft fallback',async()=>{
 for(const patch of [{clientId:actor},{mode:'published'},{revision:3},{draft:null},{draft:{...envelope.draft,savedRevision:1}},{draft:{...envelope.draft,intakeVersion:0}}])assert.equal((await respond({...envelope,...patch})).response.status,503,JSON.stringify(patch));
 const published={...envelope,mode:'published',draft:null};assert.equal((await respond(published,{...command,mode:'published',expectedRevision:null})).response.status,200);
 assert.equal((await respond({...published,draft:envelope.draft},{...command,mode:'published',expectedRevision:null})).response.status,503);
});
test('preview exact error codes have no successful fallback',async()=>{
 for(const [code,status] of [['stale_draft',409],['draft_missing',404],['unauthorized',401],['forbidden',403]] as const){const {response,calls}=await respond(null,command,{message:'concierge_'+code});assert.equal(response.status,status);assert.deepEqual(await response.json(),{code});assert.equal(calls,1);}
});
test('existing authenticated transport registry permits preview and keeps bearer/signal transport',async()=>{
 let requested='';const ports=createConciergeSupabasePorts({supabaseUrl:'https://example.invalid',publicKey:'synthetic-public',allowedOrigins:[],fetch:async(input,init)=>{requested=String(input);assert.equal(new Headers(init?.headers).get('authorization'),'Bearer synthetic');return new Response(JSON.stringify(envelope),{status:200,headers:{'content-type':'application/json'}});}});
 const result=await ports.rpc('synthetic',buildConciergeRpc(command,actor));assert.equal(result.error,null);assert.equal(requested,'https://example.invalid/rest/v1/rpc/concierge_advisor_preview_v2');
});
