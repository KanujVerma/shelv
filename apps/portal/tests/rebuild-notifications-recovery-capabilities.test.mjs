// Closed synthetic HTTP only: actual Session/cookie/Root/handler, no operation or authority overrides.
import test from 'node:test';import assert from 'node:assert/strict';
import {createApplicationSession} from '../src/app/session.ts';
import {handleNotificationRequest} from '../../../supabase/functions/concierge-notifications/handler.ts';
import {createNotificationPorts} from '../../../supabase/functions/concierge-notifications/runtime.ts';
import {readNotificationCommand} from '../../../src/contracts/PortalNotificationValidation.ts';
const api=await import('../src/features/notifications/controller.ts').catch(e=>{if(e.code!=='ERR_MODULE_NOT_FOUND')throw e;return null;});
const id=n=>`10000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const at='2026-11-01T12:00:00Z';
const event={eventId:id(1),createdAt:at,source:{kind:'publication',publicationVersion:3},destination:{kind:'plan_version',version:3}};
const item={deliveryId:id(2),revision:4,seenAt:null,event,email:{status:'failed',revision:2}};
const inbox=(items=[item],cursor=null,nextCursor=null)=>({schemaVersion:1,consistency:'live_keyset',observedAt:at,cursor,items,nextCursor});
const deliveries=(status='failed',revision=2)=>({schemaVersion:1,consistency:'live_keyset',observedAt:at,cursor:null,event,items:[{deliveryId:id(3),channel:'email',status,revision,seenAt:null},{deliveryId:id(4),channel:'portal',status:'queued',revision:0,seenAt:null}],nextCursor:null});
const receipt=c=>({requestId:c.requestId,action:c.action,deliveryId:c.deliveryId,previousRevision:c.expectedRevision,revision:c.expectedRevision+1,recordedAt:at,effect:c.action==='mark_seen_v1'?'seen':'retry_queued'});
const gate=()=>{let resolve,enter;return{promise:new Promise(r=>resolve=r),entered:new Promise(r=>enter=r),release:()=>resolve(),enter:()=>enter()};};
async function fixture(t,audience='client',edit=false){
 let login={signedIn:true,ownerId:id(90),generation:1,csrf:'SYNTHETIC-notification-csrf',capabilities:{view:true,edit,publish:false,confirmPayments:false},idleExpiresAt:'2099-01-01T00:00:00Z',absoluteExpiresAt:'2099-01-02T00:00:00Z'},now=Date.parse(at);
 const calls=[],steps=[],http=[];
 const ports=createNotificationPorts({supabaseUrl:'https://notification.synthetic.invalid',publicKey:'SYNTHETIC-public',allowedOrigins:['https://edge.synthetic.invalid'],fetch:async(url,init)=>{
  const path=new URL(String(url)).pathname;http.push(path);
  if(path==='/auth/v1/user')return Response.json({id:login.ownerId,is_anonymous:false});
  assert.equal(path,'/rest/v1/rpc/concierge_notification_command_v1');const c=readNotificationCommand(JSON.parse(init.body).p_command);const step=steps.shift();assert.ok(step,'unexpected command '+c.action);assert.equal(c.action,step.action);step.check?.(c);calls.push({command:c,wire:JSON.stringify(c),signal:init.signal});
  if(step.onAbort)init.signal.addEventListener('abort',step.onAbort,{once:true});
  if(step.hold){step.hold.enter();await step.hold.promise;}
  const body=typeof step.body==='function'?step.body(c):step.body;
  return step.raw??Response.json(body,{status:step.status??200});
 }});
 const runtime=createApplicationSession({audience,now:()=>now,locks:{request:async(_n,_o,run)=>run()},fetcher:async(url,init)=>{
  if(url===`/api/${audience}/session`)return Response.json(login);
  if(url===`/api/${audience}/logout`)return Response.json({signedOut:true});
  assert.equal(url,`/api/${audience}/notifications`);assert.equal(init.credentials,'same-origin');assert.equal(init.cache,'no-store');assert.equal(init.redirect,'error');assert.equal(new Headers(init.headers).get('x-shelv-csrf'),'SYNTHETIC-notification-csrf');
  return handleNotificationRequest(new Request('https://edge.synthetic.invalid',{method:'POST',headers:{authorization:'Bearer SYNTHETIC',origin:'https://edge.synthetic.invalid','content-type':'application/json'},body:init.body,signal:init.signal}),ports);
 }});await runtime.restore();t.after(()=>runtime.dispose());
 return{runtime,calls,http,steps,reply(action,body,status=200,extra={}){steps.push({action,body,status,...extra});},login(v){login={...login,...v};},now(v){now=v;}};
}
function controller(f,options){assert.ok(api,'actual notification controller is missing');return api.createNotificationsController(f.runtime,options);}
async function ready(t,audience='client',edit=false){const f=await fixture(t,audience,edit),c=controller(f);f.reply('list_inbox_v1',inbox());await c.loadInbox();t.after(()=>c.dispose());return{f,c};}

import {build} from '../node_modules/esbuild/lib/main.js';
const ssr=await build({stdin:{contents:`import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import {NotificationsView} from './src/features/notifications/Notifications.tsx';export const render=(state)=>renderToStaticMarkup(React.createElement(NotificationsView,{state,screen:'inbox',actions:new Proxy({},{get:()=>()=>{throw Error('SSR invoked action');}})}));`,resolveDir:new URL('..',import.meta.url).pathname},bundle:true,write:false,outdir:'.local-artifacts/w7-notifications-ui-r1/never-written',platform:'node',format:'esm',jsx:'automatic',banner:{js:`import {createRequire} from 'node:module';const require=createRequire(${JSON.stringify(new URL('../package.json',import.meta.url).href)});`}});
const renderer=await import('data:text/javascript;base64,'+Buffer.from(ssr.outputFiles.find(f=>f.path.endsWith('.js')).text).toString('base64'));
const render=state=>renderer.render(state);
const recoveryButtons=html=>[...html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)].map(m=>({attrs:m[1],text:m[2].replace(/<[^>]*>/g,'')})).filter(b=>['check original status','retry exact action'].includes(b.text)).map(b=>({...b,disabled:/\bdisabled(?:=|\s|$)/.test(b.attrs)}));
async function pendingEmail(t){
 const {f,c}=await ready(t,'advisor',true);f.reply('read_event_deliveries_v1',deliveries());await c.openEvent(item.deliveryId);c.prepareRetry(id(3));f.reply('retry_failed_email_v1',{message:'concierge_uncertain'},503);await c.confirmRetry();return {f,c,original:f.calls.at(-1).command};
}
async function restore(f,c,edit){f.login({capabilities:{view:true,edit,publish:false,confirmPayments:false}});await f.runtime.restore();f.reply('list_inbox_v1',inbox());await c.loadInbox();}
test('NUI1: actual same-session EDIT loss disables email recovery, explains denial and retains exact original',async t=>{
 const {f,c,original}=await pendingEmail(t),boundary=f.runtime.getSnapshot().boundary;await restore(f,c,false);assert.equal(f.runtime.getSnapshot().boundary,boundary);const state=c.getSnapshot(),buttons=recoveryButtons(render(state));assert.equal(buttons.length,2);assert.ok(buttons.every(b=>b.disabled));assert.equal(state.pendingRecovery.available,false);assert.match(state.pendingRecovery.reason,/editing access/);assert.match(render(state),/editing access/);assert.deepEqual(state.pending,original);assert.ok(Object.isFrozen(state.pendingRecovery));
 const n=f.calls.length;await c.checkStatus();await c.retryExact();assert.equal(f.calls.length,n);assert.match(c.getSnapshot().message,/editing access/);assert.deepEqual(c.getSnapshot().pending,original);assert.equal(c.getSnapshot().receipt,null);
});
test('actual EDIT restoration re-enables original status/exact retry with same UUID/body and three RPCs',async t=>{
 const {f,c,original}=await pendingEmail(t);await restore(f,c,false);await c.retryExact();await restore(f,c,true);const state=c.getSnapshot();assert.equal(state.pendingRecovery.available,true);assert.equal(state.pendingRecovery.reason,null);assert.ok(recoveryButtons(render(state)).every(b=>!b.disabled));const n=f.calls.length;
 f.reply('request_status_v1',{status:'unknown'});await c.checkStatus();assert.deepEqual(f.calls[n].command.original,original);assert.deepEqual(c.getSnapshot().pending,original);f.reply('retry_failed_email_v1',receipt);f.reply('list_inbox_v1',inbox());await c.retryExact();assert.deepEqual(f.calls[n+1].command,original);assert.equal(f.calls[n+1].wire,JSON.stringify(original));assert.equal(f.calls.length-n,3);assert.equal(c.getSnapshot().pending,null);assert.equal(c.getSnapshot().pendingRecovery.available,false);
});
for(const audience of ['client','advisor'])test(`VIEW-only ${audience} original mark-seen recovery remains available without EDIT`,async t=>{
 const {f,c}=await ready(t,audience,false);f.reply('mark_seen_v1',{message:'concierge_uncertain'},503);await c.markSeen(item.deliveryId);const original=f.calls.at(-1).command;await restore(f,c,false);assert.equal(c.getSnapshot().pendingRecovery.available,true);assert.ok(recoveryButtons(render(c.getSnapshot())).every(b=>!b.disabled));const n=f.calls.length;f.reply('request_status_v1',{status:'unknown'});await c.checkStatus();f.reply('mark_seen_v1',receipt);f.reply('list_inbox_v1',inbox([{...item,revision:5,seenAt:at}]));await c.retryExact();assert.equal(f.calls.length-n,3);assert.deepEqual(f.calls[n+1].command,original);assert.equal(c.getSnapshot().pending,null);
});
test('a stale enabled UI cannot dispatch after actual EDIT loss; denial explains without forcing ready',async t=>{
 const {f,c,original}=await pendingEmail(t);await restore(f,c,true);assert.equal(c.getSnapshot().pendingRecovery.available,true);f.login({capabilities:{view:true,edit:false,publish:false,confirmPayments:false}});await f.runtime.restore();assert.equal(c.getSnapshot().phase,'idle');const n=f.calls.length;await c.checkStatus();await c.retryExact();assert.equal(f.calls.length,n);assert.equal(c.getSnapshot().phase,'idle');assert.match(c.getSnapshot().message,/editing access/);assert.match(render(c.getSnapshot()),/editing access/);assert.equal(c.getSnapshot().pendingRecovery.available,false);assert.deepEqual(c.getSnapshot().pending,original);
});
test('late status receipt after actual EDIT loss cannot acknowledge original or revive current private display',async t=>{
 const {f,c,original}=await pendingEmail(t);await restore(f,c,true);const h=gate();f.reply('request_status_v1',{status:'committed',receipt:receipt(original)},200,{hold:h});const pending=c.checkStatus();await h.entered;f.login({capabilities:{view:true,edit:false,publish:false,confirmPayments:false}});await f.runtime.restore();h.release();await pending;f.reply('list_inbox_v1',inbox());await c.loadInbox();assert.deepEqual(c.getSnapshot().pending,original);assert.equal(c.getSnapshot().receipt,null);assert.equal(c.getSnapshot().pendingRecovery.available,false);assert.match(render(c.getSnapshot()),/editing access/);
});
for(const change of ['owner','csrf','generation','role','expiry','dispose'])test(`pending recovery never grants through actual ${change} retirement`,async t=>{
 const {f,c}=await pendingEmail(t);await restore(f,c,true);const n=f.calls.length;
 if(change==='dispose')c.dispose();else if(change==='expiry')f.now(Date.parse('2100-01-01'));else{f.login(change==='owner'?{ownerId:id(91)}:change==='csrf'?{csrf:'SYNTHETIC-new-csrf'}:change==='generation'?{generation:2}:{signedIn:false});await f.runtime.restore();}
 const state=c.getSnapshot();assert.equal(state.phase,'ended');assert.equal(state.pendingRecovery.available,false);assert.equal(state.pending,null);await c.checkStatus();await c.retryExact();assert.equal(f.calls.length,n);assert.match(render(c.getSnapshot()),/session has ended/);
});
test('denial observers may throw and remount without stale state clearing the new owner original',async t=>{
 const {f,c:a,original}=await pendingEmail(t);await restore(f,a,false);let b=null;a.subscribe(()=>{if(a.getSnapshot().message&&!b){a.dispose();b=controller(f);throw Error('PRIVATE_OBSERVER');}});const n=f.calls.length;await a.checkStatus();assert.ok(b);t.after(()=>b.dispose());assert.equal(f.calls.length,n);f.reply('list_inbox_v1',inbox());await b.loadInbox();assert.deepEqual(b.getSnapshot().pending,original);assert.equal(b.getSnapshot().pendingRecovery.available,false);assert.match(render(b.getSnapshot()),/editing access/);assert.equal(a.getSnapshot().pending,null);assert.doesNotMatch(JSON.stringify(b.getSnapshot()),/PRIVATE_OBSERVER/);
});
test('stable pending projection reads keep one frozen snapshot and cannot become an authority setter',async t=>{
 const {f,c,original}=await pendingEmail(t);await restore(f,c,false);const state=c.getSnapshot();let delivered=0;c.subscribe(()=>delivered++);for(let n=0;n<5;n++)assert.equal(c.getSnapshot(),state);assert.equal(delivered,0);assert.throws(()=>{state.pendingRecovery.available=true;},TypeError);const calls=f.calls.length;await c.retryExact();assert.equal(f.calls.length,calls);assert.deepEqual(c.getSnapshot().pending,original);
});
test('unavailable email recovery gives its access explanation once after a denied invocation',async t=>{
 const {f,c}=await pendingEmail(t);await restore(f,c,false);await c.checkStatus();const state=c.getSnapshot(),html=render(state);assert.equal(html.split(state.pendingRecovery.reason).length-1,1);
});
test('no-pending and eligible VIEW recovery return stable snapshots without read-time effects',async t=>{
 const {f,c}=await ready(t,'client',false),empty=c.getSnapshot();assert.deepEqual(empty.pendingRecovery,{available:false,reason:null});assert.equal(c.getSnapshot(),empty);assert.equal(recoveryButtons(render(empty)).length,0);f.reply('mark_seen_v1',{message:'concierge_uncertain'},503);await c.markSeen(item.deliveryId);await restore(f,c,false);const state=c.getSnapshot(),n=f.calls.length;assert.equal(state.pendingRecovery.available,true);for(let k=0;k<5;k++)assert.equal(c.getSnapshot(),state);assert.equal(f.calls.length,n);
});
