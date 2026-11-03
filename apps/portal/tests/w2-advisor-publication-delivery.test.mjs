// Model/finite synthetic HTTP/SSR only. No genuine provider, Auth, DB or email.
import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
import {createAdvisorController} from '../src/features/advisor/controller.ts';
import {createApplicationSession} from '../src/app/session.ts';
import {createNotificationsController} from '../src/features/notifications/controller.ts';
import {fixture,ids,stamp} from './rebuild/advisor-fixture.mjs';
async function published(t){
 const f=fixture({ready:true}),c=createAdvisorController(f.options);t.after(()=>c.dispose());
 await c.open(ids.draft);await c.refreshContext();await c.approve();await c.confirmPayment(ids.claim,'100.00',true);await c.publish();
 return {f,c,command:structuredClone(f.calls.find(x=>x.action==='publish_plan_v1')),receipt:structuredClone(c.getSnapshot().receipt)};
}
test('A06 retains the acknowledged exact publication command and receipt atomically in session memory',async t=>{
 const {f,c,command,receipt}=await published(t);
 assert.deepEqual(c.getSnapshot().publicationNotification,{command,receipt});
 c.dispose();const remounted=createAdvisorController(f.options);t.after(()=>remounted.dispose());
 assert.deepEqual(remounted.getSnapshot().publicationNotification,{command,receipt});
 f.invalidate();assert.equal(remounted.getSnapshot().publicationNotification,null);
});
test('A06 original publication status recovery captures its original command, never a reconstructed target',async t=>{
 const f=fixture({ready:true}),execute=f.options.ports.plans.execute;let original;
 f.options.ports.plans.execute=async(command,options)=>{const result=await execute(command,options);if(command.action==='publish_plan_v1'){original=structuredClone(command);throw {status:503};}return result;};
 const c=createAdvisorController(f.options);t.after(()=>c.dispose());await c.open(ids.draft);await c.refreshContext();await c.approve();await c.confirmPayment(ids.claim,'100.00',true);await c.publish();
 assert.equal(c.getSnapshot().publicationNotification,null);await c.reconcile();
 assert.deepEqual(c.getSnapshot().publicationNotification.command,original);assert.equal(c.getSnapshot().publicationNotification.receipt.notificationEventId,ids.event);
});
const output=new URL('../../../.local-artifacts/w2/delivery-ssr.cjs',import.meta.url);await mkdir(new URL('.',output),{recursive:true});
await build({absWorkingDir:new URL('..',import.meta.url).pathname,tsconfig:'tsconfig.frontend.json',stdin:{contents:`import React from 'react';import{renderToStaticMarkup}from'react-dom/server';import{OverlayProvider}from'./src/ui/index.ts';import{AdvisorWorkspace}from'./src/features/advisor/AdvisorWorkspace.tsx';export const render=(props)=>renderToStaticMarkup(React.createElement(OverlayProvider,null,React.createElement(AdvisorWorkspace,props)));`,resolveDir:new URL('..',import.meta.url).pathname,loader:'tsx'},outfile:output.pathname,platform:'node',format:'cjs',bundle:true,loader:{'.css':'empty'}});
const {render}=createRequire(import.meta.url)(output.pathname);
const html=(c,publicationNotifications)=>render({controller:c,publicationNotifications,navigation:{route:{name:'advisor-editor',draftId:ids.draft,section:'review-publish'},navigate(){}}});
async function notifications(t,{command,receipt},edit=true){
 const calls=[];let email='failed';
 const runtime=createApplicationSession({audience:'advisor',locks:{request:async(_n,_o,run)=>run()},fetcher:async(url,init)=>{
  if(url==='/api/advisor/session')return Response.json({signedIn:true,ownerId:ids.actor,generation:1,csrf:'SYNTHETIC-a06-csrf',capabilities:{view:true,edit,publish:true,confirmPayments:false},idleExpiresAt:'2099-01-01T00:00:00Z',absoluteExpiresAt:'2099-01-02T00:00:00Z'});
  assert.equal(url,'/api/advisor/notifications');const input=JSON.parse(init.body);calls.push(input);
  if(input.action==='retry_failed_email_v1'){email='queued';return Response.json({requestId:input.requestId,action:input.action,deliveryId:input.deliveryId,previousRevision:input.expectedRevision,revision:input.expectedRevision+1,recordedAt:stamp,effect:'retry_queued'});}
  assert.equal(input.action,'read_event_deliveries_v1');return Response.json({schemaVersion:1,consistency:'live_keyset',observedAt:stamp,cursor:null,event:{eventId:input.eventId,createdAt:stamp,source:{kind:'publication',publicationVersion:receipt.publicationVersion},destination:{kind:'plan_version',version:receipt.publicationVersion}},items:[{deliveryId:ids.other,channel:'email',status:email,revision:email==='failed'?1:2,seenAt:null},{deliveryId:ids.claim,channel:'portal',status:'queued',revision:1,seenAt:null}],nextCursor:null});
 }});t.after(()=>runtime.dispose());await runtime.restore();const c=createNotificationsController(runtime);t.after(()=>c.dispose());await c.openPublication(command,receipt);return {c,calls};
}
test('A06 receipt alone records an event and never claims its current delivery is queued',async t=>{
 const h=await published(t),markup=html(h.c);assert.match(markup,/notification event recorded/);assert.match(markup,/current delivery status is unavailable/);assert.doesNotMatch(markup,/notification queued/);
});
test('A06 displays actual email failure with separate portal seen status and confirmed retry',async t=>{
 const h=await published(t),n=await notifications(t,h);const markup=html(h.c,n.c);
 assert.match(markup,/>failed</);assert.match(markup,/retry email/);assert.match(markup,/unread/);
 const before=h.f.calls.filter(x=>x.action==='publish_plan_v1').length;n.c.prepareRetry(ids.other);assert.equal(n.calls.length,1);
 await n.c.confirmRetry();assert.deepEqual(n.calls.map(x=>x.action),['read_event_deliveries_v1','retry_failed_email_v1','read_event_deliveries_v1']);
 assert.equal(h.f.calls.filter(x=>x.action==='publish_plan_v1').length,before);assert.deepEqual(h.c.getSnapshot().receipt,h.receipt);
 assert.match(html(h.c,n.c),/>queued</);assert.doesNotMatch(html(h.c,n.c),/retry email/);
});
test('A06 VIEW-only delivery status has no EDIT retry action',async t=>{
 const h=await published(t),n=await notifications(t,h,false),markup=html(h.c,n.c);
 assert.match(markup,/>failed</);assert.doesNotMatch(markup,/>retry email</);n.c.prepareRetry(ids.other);await n.c.confirmRetry();assert.equal(n.calls.length,1);
});

test('A06 first render never displays another selected event under this publication',async t=>{
 const h=await published(t),n=await notifications(t,{command:h.command,receipt:{...h.receipt,notificationEventId:ids.claim}});
 const markup=html(h.c,n.c);assert.match(markup,/current delivery status is unavailable/);assert.doesNotMatch(markup,/>failed<|>retry email</);assert.equal(n.calls.length,1);
});
test('A06 clearing a publication for another draft removes its acknowledged notification pair',async t=>{
 const {c,f}=await published(t);const before=structuredClone(c.getSnapshot().publicationNotification);assert.ok(before);
 await c.open(ids.other);assert.equal(c.getSnapshot().receipt,null);assert.equal(c.getSnapshot().publicationNotification,null);
 assert.equal(before.receipt.notificationEventId,ids.event);assert.equal(f.calls.filter(x=>x.action==='publish_plan_v1').length,1);
});
