import test from 'node:test';
import assert from 'node:assert/strict';
import {createApplicationSession} from '../src/app/session.ts';
import {createAdvisorPorts} from '../src/app/ports.ts';
import {draftView,fixture,ids} from './rebuild/advisor-fixture.mjs';

const command=()=>({schemaVersion:2,action:'issue_quote',requestId:'77777777-7777-4777-8777-777777777777',clientId:ids.client,expectedRevision:3,publicationVersion:0,serviceCents:10000,servicePeriod:null,shippingAddressVersion:null,items:[],productSubtotalCents:0,taxCents:0,shippingCents:0,productTotalCents:0,totalCents:10000});
const receipt=()=>({schemaVersion:2,paymentOptionId:null,revision:4,operation:'issue_quote',quoteId:ids.quote,claimId:null,status:'payable',serviceUnlocked:false,serviceAccessStatus:null,productOrderStatus:null});
async function setup(t){
 const f=fixture({ready:true}),broadcast=globalThis.BroadcastChannel;globalThis.BroadcastChannel=undefined;t.after(()=>{globalThis.BroadcastChannel=broadcast;});
 const caps={view:true,edit:true,publish:true,confirmPayments:true},calls=[];
 let current=draftView(true),reply=()=>Response.json(receipt());
 const runtime=createApplicationSession({audience:'advisor',locks:{request:async(_n,_o,run)=>run()},fetcher:async(url,init)=>{
  assert.equal(init.credentials,'same-origin');assert.equal(init.cache,'no-store');assert.equal(init.redirect,'error');
  assert.equal(new Headers(init.headers).has('authorization'),false);
  if(url==='/api/advisor/session')return Response.json({signedIn:true,ownerId:ids.actor,generation:1,csrf:'synthetic-w0-quote',capabilities:caps,idleExpiresAt:'2099-01-01T00:00:00Z',absoluteExpiresAt:'2099-01-02T00:00:00Z'});
  assert.equal(new Headers(init.headers).get('X-Shelv-CSRF'),'synthetic-w0-quote');
  const c=JSON.parse(init.body);calls.push({url,command:c});
  if(url==='/api/advisor/plans'){
   if(c.action==='read_draft_v1')return Response.json(current);
   assert.equal(c.action,'read_advisor_gate_v1');
   return Response.json({schemaVersion:1,clientId:c.target.clientId,target:c.target,publisher:c.publisher,approval:f.context.approval,publication:f.context.publication,coverage:f.context.coverage,capabilities:{actorId:ids.actor,...caps,assign:true,review:true,approve:true},policy:{revision:1,ownerActorId:ids.actor,requireKanujApproval:true}});
  }
  assert.equal(url,'/api/advisor/payments','unexpected HTTP denied');assert.equal(c.action,'issue_quote');return reply(c);
 }});await runtime.restore();t.after(()=>runtime.dispose());const adapter=createAdvisorPorts(runtime);t.after(()=>adapter.dispose());
 return {runtime,adapter,calls,select:async()=>adapter.ports.plans.execute({schemaVersion:1,action:'read_draft_v1',draftId:current.draft.id}),setReply(v){reply=v;},setDraft(v){current=v;}};
}
// Only closed HTTP fixture DTOs. Actual cookie, transport, app ports and codecs;
// no Root handler/SQL/Auth/provider/funds or successful tested-port substitute.
test('selected exact human-client context issues only the fixed V2 quote and no service clock',async t=>{
 const f=await setup(t);await f.select();assert.ok(f.adapter.ports.issueQuote,'missing actual issueQuote bridge');
 const result=await f.adapter.ports.issueQuote.execute(command());assert.deepEqual(result,receipt());
 assert.deepEqual(f.calls.filter(c=>c.url==='/api/advisor/payments').map(c=>c.command),[command()]);
});
test('no selected client and a foreign selected client cannot issue a quote',async t=>{
 const f=await setup(t);assert.ok(f.adapter.ports.issueQuote);
 await assert.rejects(f.adapter.ports.issueQuote.execute(command()),e=>e.status===403);
 await f.select();await assert.rejects(f.adapter.ports.issueQuote.execute({...command(),clientId:ids.other}),e=>e.status===403);
 assert.equal(f.calls.filter(c=>c.url==='/api/advisor/payments').length,0);
});
test('unknown fields and non-quote writes never reach payment HTTP',async t=>{
 const f=await setup(t);await f.select();assert.ok(f.adapter.ports.issueQuote);
 await assert.rejects(f.adapter.ports.issueQuote.execute({...command(),rpc:'arbitrary'}),e=>e.status===400);
 await assert.rejects(f.adapter.ports.issueQuote.execute({...command(),action:'confirm_payment'}),e=>e.status===403);
 assert.equal(f.calls.filter(c=>c.url==='/api/advisor/payments').length,0);
});
for(const loss of ['offline','finance','disposed'])test('reentrant '+loss+' cannot be granted by a true callback',async t=>{
 const f=await setup(t);await f.select();assert.ok(f.adapter.ports.issueQuote);
 await assert.rejects(f.adapter.ports.issueQuote.execute(command(),{isApplicable:()=>{if(loss==='offline')f.runtime.cookie.status='offline';if(loss==='finance')f.runtime.cookie._view.capabilities.confirmPayments=false;if(loss==='disposed')f.runtime.dispose();return true;}}),e=>[401,403,503].includes(e.status));
 assert.equal(f.calls.filter(c=>c.url==='/api/advisor/payments').length,0);
});
test('claim-like or unlocked acknowledgement is rejected as an uncertain write',async t=>{
 const f=await setup(t);await f.select();assert.ok(f.adapter.ports.issueQuote);
 f.setReply(()=>Response.json({...receipt(),serviceUnlocked:true,serviceAccessStatus:'active'}));
 await assert.rejects(f.adapter.ports.issueQuote.execute(command()),e=>e.status===503);
});
test('actual payment HTTP403 is preserved',async t=>{
 const f=await setup(t);await f.select();assert.ok(f.adapter.ports.issueQuote);
 f.setReply(()=>Response.json({code:'forbidden'},{status:403}));await assert.rejects(f.adapter.ports.issueQuote.execute(command()),e=>e.status===403);
});
test('caller mutation during applicability cannot change selected customer or amount',async t=>{
 const f=await setup(t);await f.select();assert.ok(f.adapter.ports.issueQuote);const input=command();
 await f.adapter.ports.issueQuote.execute(input,{isApplicable:()=>{input.clientId=ids.other;input.totalCents=1;return true;}});
 const sent=f.calls.find(c=>c.url==='/api/advisor/payments').command;assert.equal(sent.clientId,ids.client);assert.equal(sent.totalCents,10000);
});
for(const loss of ['disposed','finance'])test('held quote acknowledgement is refused after actual '+loss+' loss',async t=>{
 const f=await setup(t);await f.select();assert.ok(f.adapter.ports.issueQuote);
 let entered,release;const started=new Promise(r=>{entered=r;}),held=new Promise(r=>{release=r;});t.after(()=>release());
 f.setReply(async()=>{entered();await held;return Response.json(receipt());});
 const pending=f.adapter.ports.issueQuote.execute(command()).then(value=>({value}),error=>({error}));await started;
 if(loss==='disposed')f.runtime.dispose();else f.adapter.permissions.confirmPayments=false;
 release();const outcome=await pending;assert.ok(outcome.error);assert.ok([401,403,503].includes(outcome.error.status));
});
