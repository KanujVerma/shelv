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

test('W7 returned draft target cannot retarget a quote without a fresh actual context',async t=>{
 const f=await setup(t);const selectedView=await f.select();
 assert.equal(selectedView.target.clientId,ids.client);
 selectedView.target.clientId=ids.other;
 const intended={...command(),clientId:ids.other};
 const before=f.calls.filter(c=>c.url==='/api/advisor/payments').length;
 await assert.rejects(f.adapter.ports.issueQuote.execute(intended),e=>[400,401,403,409,503].includes(e.status),
   'mutating a caller-owned returned DTO must not grant a different selected-client quote');
 assert.equal(f.calls.filter(c=>c.url==='/api/advisor/payments').length,before,'no foreign-client quote dispatch');
});
