import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {build} from '../node_modules/esbuild/lib/main.js';
const file=new URL('../src/features/notifications/Notifications.tsx',import.meta.url);
async function render(state,screen='inbox'){
 assert.ok(existsSync(file),'notification renderer is missing');
 const result=await build({stdin:{contents:`import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import {NotificationsView} from ${JSON.stringify(file.pathname)};export const render=(state,screen)=>renderToStaticMarkup(React.createElement(NotificationsView,{state,screen,actions:new Proxy({},{get:()=>()=>{throw Error('SSR invoked an action')}})}));`,resolveDir:new URL('..',import.meta.url).pathname},bundle:true,write:false,outdir:'.local-artifacts/w2-notifications/ssr-not-written',platform:'node',format:'esm',jsx:'automatic',banner:{js:`import {createRequire} from 'node:module';const require=createRequire(${JSON.stringify(new URL('../package.json',import.meta.url).href)});`}});
 const mod=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles.find(f=>f.path.endsWith('.js')).text).toString('base64'));return mod.render(state,screen);
}
const id=n=>`10000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const event={eventId:id(1),createdAt:'2026-11-01T12:00:00Z',source:{kind:'publication',publicationVersion:3},destination:{kind:'plan_version',version:3}};
const page={schemaVersion:1,consistency:'live_keyset',observedAt:'2026-11-01T12:01:00Z',cursor:null,items:[{deliveryId:id(2),revision:0,seenAt:null,event,email:{status:'accepted',revision:1}}],nextCursor:'n:'+id(2)};
const state={phase:'ready',audience:'client',inbox:page,deliveries:null,selectedEvent:null,loadingDeliveries:false,canPreviousInbox:false,canPreviousDeliveries:false,canRetryEmail:false,mutation:'idle',pending:null,receipt:null,checkingStatus:false,confirmation:null,message:null,missingInput:'trusted_notification_event_reference'};
test('inbox SSR uses shared controls, canonical open, explicit mark seen and truthful paging without IDs or totals',async()=>{
 const html=await render(state);for(const s of ['notifications','your plan is ready','unread','mark seen','open update','accepted','delivery is not confirmed','next page','observed','/history/versions/3','data-slot="button"'])assert.ok(html.includes(s),s);assert.doesNotMatch(html,/10000000|unreadCount|all notifications|email opened|type="text"/);
});
test('missing A06 trusted input and offline/denied/ended/errors render recovery without private rows',async()=>{
 const html=await render({...state,audience:'advisor',inbox:null},'delivery-status');assert.match(html,/select a notification|delivery status is unavailable/);assert.doesNotMatch(html,/input|textarea|10000000/);
 for(const phase of ['idle','loading','offline','denied','ended','error']){const h=await render({...state,phase,inbox:null});assert.ok(h.includes('notifications'));assert.doesNotMatch(h,/your plan is ready|10000000/);}
});
test('delivery SSR distinguishes all email states and portal seen; only failed email has retry',async()=>{
 const statuses=['queued','claimed','uncertain','accepted','delivered','failed','bounced'];const deliveries={...page,event,items:[...statuses.map((status,n)=>({deliveryId:id(n+4),channel:'email',status,revision:2,seenAt:null})),{deliveryId:id(12),channel:'portal',status:'queued',revision:1,seenAt:event.createdAt}],nextCursor:null};
 const html=await render({...state,audience:'advisor',deliveries,selectedEvent:event,canRetryEmail:true,missingInput:null},'delivery-status');for(const s of statuses)assert.ok(html.includes(s),s);assert.equal((html.match(/>retry email</g)??[]).length,1);assert.match(html,/portal.*seen/s);assert.doesNotMatch(html,/10000000|republish|client@|providerId/);
 const readOnly=await render({...state,audience:'advisor',deliveries,selectedEvent:event,canRetryEmail:false},'delivery-status');assert.doesNotMatch(readOnly,/>retry email</);
});
test('initial A06 missing input has plain recovery copy and no dead load or refresh action',async()=>{
 const html=await render({...state,audience:'advisor',phase:'idle',inbox:null},'delivery-status');assert.match(html,/delivery status is unavailable/);assert.doesNotMatch(html,/>load notifications</);assert.doesNotMatch(html,/>refresh</);
});
