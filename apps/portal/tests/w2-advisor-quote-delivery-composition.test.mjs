// Combined source evidence: real runtime/quote adapter/notification controller,
// closed synthetic HTTP; plan/payment-confirmation persistence is a memory fixture.
import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
import {createApplicationSession} from '../src/app/session.ts';
import {createAdvisorPorts} from '../src/app/ports.ts';
import {createAdvisorController} from '../src/features/advisor/controller.ts';
import {createNotificationsController} from '../src/features/notifications/controller.ts';
import {buildPaymentCallV2} from '../../../supabase/functions/concierge-payments/methods.ts';
import {fixture,ids,stamp} from './rebuild/advisor-fixture.mjs';
const output=new URL('../../../.local-artifacts/w2/quote-delivery-composition-ssr.cjs',import.meta.url);await mkdir(new URL('.',output),{recursive:true});
await build({absWorkingDir:new URL('..',import.meta.url).pathname,tsconfig:'tsconfig.frontend.json',stdin:{contents:`import React from 'react';import{renderToStaticMarkup}from'react-dom/server';import{OverlayProvider}from'./src/ui/index.ts';import{AdvisorWorkspace}from'./src/features/advisor/AdvisorWorkspace.tsx';export const render=(props)=>renderToStaticMarkup(React.createElement(OverlayProvider,null,React.createElement(AdvisorWorkspace,props)));`,resolveDir:new URL('..',import.meta.url).pathname,loader:'tsx'},outfile:output.pathname,platform:'node',format:'cjs',bundle:true,loader:{'.css':'empty'}});
const{render}=createRequire(import.meta.url)(output.pathname);
async function setup(t){
 const f=fixture({ready:true}),quote=structuredClone(f.context.payments.quotes[0]),claim=structuredClone(f.context.payments.claims[0]);f.context.payments.quotes=[];f.context.payments.claims=[];
 const calls=[],caps={view:true,edit:true,publish:true,confirmPayments:true};let quoteFailure=false,email='failed';
 const previousBroadcast=globalThis.BroadcastChannel;globalThis.BroadcastChannel=undefined;
 const runtime=createApplicationSession({audience:'advisor',locks:{request:async(_n,_o,run)=>run()},fetcher:async(url,init)=>{
  assert.equal(init.credentials,'same-origin');assert.equal(init.cache,'no-store');assert.equal(init.redirect,'error');assert.equal(new Headers(init.headers).has('authorization'),false);
  if(url==='/api/advisor/session')return Response.json({signedIn:true,ownerId:ids.actor,generation:1,csrf:'SYNTHETIC-combined',capabilities:caps,idleExpiresAt:'2099-01-01T00:00:00Z',absoluteExpiresAt:'2099-01-02T00:00:00Z'});
  if(url==='/api/advisor/logout')return Response.json({ok:true});
  assert.equal(new Headers(init.headers).get('X-Shelv-CSRF'),'SYNTHETIC-combined');const input=JSON.parse(init.body);calls.push({url,input});
  if(url==='/api/advisor/plans'){
   if(input.action==='read_draft_v1')return Response.json(f.getView());
   assert.equal(input.action,'read_advisor_gate_v1');return Response.json({schemaVersion:1,clientId:input.target.clientId,target:input.target,publisher:input.publisher,approval:f.context.approval,publication:f.context.publication,coverage:f.context.coverage,capabilities:{actorId:ids.actor,...caps,assign:true,review:true,approve:true},policy:{revision:1,ownerActorId:ids.actor,requireKanujApproval:true}});
  }
  if(url==='/api/advisor/payments'){
   assert.equal(input.action,'issue_quote');buildPaymentCallV2(input,ids.actor);if(quoteFailure)return Response.json({code:'unavailable'},{status:503});
   f.context.payments.quotes=[quote];f.context.payments.revision=2;
   return Response.json({schemaVersion:2,paymentOptionId:null,revision:2,operation:'issue_quote',quoteId:ids.quote,claimId:null,status:'payable',serviceUnlocked:false,serviceAccessStatus:null,productOrderStatus:null});
  }
  assert.equal(url,'/api/advisor/notifications','unexpected network route denied');
  if(input.action==='retry_failed_email_v1'){
   email='queued';return Response.json({requestId:input.requestId,action:input.action,deliveryId:input.deliveryId,previousRevision:input.expectedRevision,revision:input.expectedRevision+1,recordedAt:stamp,effect:'retry_queued'});
  }
  assert.equal(input.action,'read_event_deliveries_v1');assert.equal(input.eventId,ids.event);
  return Response.json({schemaVersion:1,consistency:'live_keyset',observedAt:stamp,cursor:null,event:{eventId:ids.event,createdAt:stamp,source:{kind:'publication',publicationVersion:1},destination:{kind:'plan_version',version:1}},items:[{deliveryId:ids.other,channel:'email',status:email,revision:email==='failed'?1:2,seenAt:null},{deliveryId:ids.claim,channel:'portal',status:'queued',revision:1,seenAt:null}],nextCursor:null});
 }});await runtime.restore();const adapter=createAdvisorPorts(runtime);await adapter.ports.plans.execute({schemaVersion:1,action:'read_draft_v1',draftId:ids.draft});
 f.options.session=runtime.getSnapshot().boundary;f.options.permissions=adapter.permissions;f.options.ports.issueQuote=adapter.ports.issueQuote;
 const c=createAdvisorController(f.options),notifications=createNotificationsController(runtime);
 t.after(()=>{notifications.dispose();c.dispose();adapter.dispose();runtime.dispose();globalThis.BroadcastChannel=previousBroadcast;});
 await c.open(ids.draft);await c.refreshContext();
 const html=(reader)=>render({controller:c,publicationNotifications:reader,navigation:{route:{name:'advisor-editor',draftId:ids.draft,section:'review-publish'},navigate(){}}});
 return{f,c,runtime,notifications,calls,caps,claim,html,failQuote(value){quoteFailure=value}};
}
async function publishAfterQuote(h){
 await h.c.issueFirstServiceQuote();assert.equal(h.c.getSnapshot().receipt,null);assert.equal(h.c.getSnapshot().publicationNotification,null);assert.equal(h.f.context.payments.service.status,'unpaid');
 h.f.context.payments.claims=[h.claim];await h.c.refreshContext();await h.c.approve();assert.equal(h.c.getSnapshot().receipt,null);
 await h.c.confirmPayment(ids.claim,'100.00',true);assert.equal(h.c.getSnapshot().receipt,null);assert.equal(h.c.canPublish(),true);
 await h.c.publish();return h.c.getSnapshot().publicationNotification;
}
test('one runtime composes actual quote transport, separate model approval/payment/publication and original delivery retry',async t=>{
 const h=await setup(t);assert.match(h.html(),/issue first service quote/);assert.match(h.html(),/does not verify payment or publish/);
 const pair=await publishAfterQuote(h);assert.ok(pair);assert.deepEqual(pair.command,h.f.calls.find(c=>c.action==='publish_plan_v1'));assert.equal(pair.receipt.notificationEventId,ids.event);
 assert.match(h.html(),/notification event recorded/);assert.match(h.html(),/current delivery status is unavailable/);assert.doesNotMatch(h.html(),/notification queued/);
 await h.notifications.openPublication(pair.command,pair.receipt);assert.match(h.html(h.notifications),/>failed</);
 const publish=structuredClone(pair),payments=h.calls.filter(c=>c.url==='/api/advisor/payments').length;
 h.notifications.prepareRetry(ids.other);await h.notifications.confirmRetry();assert.match(h.html(h.notifications),/>queued</);assert.doesNotMatch(h.html(h.notifications),/>accepted<|>delivered</);
 assert.equal(h.f.calls.filter(c=>c.action==='publish_plan_v1').length,1);assert.deepEqual(h.c.getSnapshot().publicationNotification,publish);assert.equal(h.calls.filter(c=>c.url==='/api/advisor/payments').length,payments);
 assert.equal(h.calls.filter(c=>c.input.action==='retry_failed_email_v1').length,1);
});
test('uncertain actual quote keeps the exact original and creates no publication or notification intent',async t=>{
 const h=await setup(t);h.failQuote(true);await h.c.issueFirstServiceQuote();const original=structuredClone(h.c.getSnapshot().pending);assert.equal(original.action,'issue_quote');assert.equal(h.runtime.cookie.status,'offline');
 await h.c.issueFirstServiceQuote();assert.equal(h.calls.filter(c=>c.url==='/api/advisor/payments').length,1);assert.equal(h.c.getSnapshot().publicationNotification,null);assert.equal(h.f.calls.filter(c=>c.action==='publish_plan_v1').length,0);
 h.failQuote(false);await h.runtime.restore();await h.c.retry();assert.deepEqual(h.calls.filter(c=>c.url==='/api/advisor/payments').map(c=>c.input),[original,original]);assert.equal(h.c.getSnapshot().pending,null);assert.equal(h.calls.filter(c=>c.url==='/api/advisor/notifications').length,0);
});
test('current VIEW-only notification status cannot retry and logout retires both feature projections',async t=>{
 const h=await setup(t),pair=await publishAfterQuote(h);h.caps.edit=false;await h.runtime.restore();await h.notifications.openPublication(pair.command,pair.receipt);
 assert.match(h.html(h.notifications),/>failed</);assert.doesNotMatch(h.html(h.notifications),/>retry email</);h.notifications.prepareRetry(ids.other);await h.notifications.confirmRetry();assert.equal(h.calls.filter(c=>c.input.action==='retry_failed_email_v1').length,0);
 await h.runtime.signOut();assert.equal(h.c.getSnapshot().ended,true);assert.equal(h.c.getSnapshot().publicationNotification,null);assert.equal(h.notifications.getSnapshot().phase,'ended');
});
