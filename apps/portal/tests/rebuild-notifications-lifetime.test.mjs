// Additional direct finite-HTTP lifecycle controls. Original43 stays byte-unchanged.
import test from 'node:test';import assert from 'node:assert/strict';
import {createApplicationSession} from '../src/app/session.ts';
import {createNotificationRequest} from '../src/app/notification-request.ts';
import {createNotificationsController} from '../src/features/notifications/controller.ts';
import {readNotificationCommand} from '../../../src/contracts/PortalNotificationValidation.ts';
import {createNotificationPorts} from '../../../supabase/functions/concierge-notifications/runtime.ts';
import {handleNotificationRequest} from '../../../supabase/functions/concierge-notifications/handler.ts';
const id=n=>`20000000-0000-4000-8000-${String(n).padStart(12,'0')}`,at='2026-11-01T12:00:00Z';
const event={eventId:id(1),createdAt:at,source:{kind:'publication',publicationVersion:2},destination:{kind:'plan_version',version:2}};
const item={deliveryId:id(2),revision:4,seenAt:null,event,email:null};
const page=(revision=4)=>({schemaVersion:1,consistency:'live_keyset',observedAt:at,cursor:null,items:[{...item,revision}],nextCursor:null});
const gate=()=>{let release,enter;return {promise:new Promise(r=>release=r),entered:new Promise(r=>enter=r),release:()=>release(),enter:()=>enter()};};
async function fixture(t){
 let login={signedIn:true,ownerId:id(90),generation:1,csrf:'SYNTHETIC-lifetime',capabilities:{view:true,edit:false,publish:false,confirmPayments:false},idleExpiresAt:'2099-01-01',absoluteExpiresAt:'2099-01-02'};
 const steps=[],commands=[];let now=Date.parse(at);
 const ports=createNotificationPorts({supabaseUrl:'https://lifetime.synthetic.invalid',publicKey:'SYNTHETIC-public',allowedOrigins:[],fetch:async(url,init)=>{
  const p=new URL(String(url)).pathname;if(p==='/auth/v1/user')return Response.json({id:login.ownerId,is_anonymous:false});assert.equal(p,'/rest/v1/rpc/concierge_notification_command_v1');
  const command=readNotificationCommand(JSON.parse(init.body).p_command),step=steps.shift();assert.ok(step,'finite reply missing');assert.equal(command.action,step.action);commands.push(command);return Response.json(typeof step.body==='function'?step.body(command):step.body,{status:step.status??200});
 }});
 const runtime=createApplicationSession({audience:'client',now:()=>now,locks:{request:async(_n,_o,run)=>run()},fetcher:async(url,init)=>{
  if(url==='/api/client/session')return Response.json(login);assert.equal(url,'/api/client/notifications');const command=JSON.parse(init.body),step=steps[0];
  const result=await handleNotificationRequest(new Request('https://edge.synthetic.invalid',{method:'POST',headers:{authorization:'Bearer SYNTHETIC','content-type':'application/json'},body:init.body,signal:init.signal}),ports);
  if(step?.browserHold){step.browserHold.enter();await step.browserHold.promise;}
  return result;
 }});await runtime.restore();t.after(()=>runtime.dispose());
 return {runtime,commands,reply(action,body,status=200,browserHold){steps.push({action,body,status,browserHold});},login(patch){login={...login,...patch};},now:v=>now=v};
}
for(const change of ['owner','csrf','generation'])for(const status of [401,403])test(`same-class actual ${change} replacement keeps B live after A HTTP${status}`,async t=>{
 const f=await fixture(t),a=createNotificationRequest(f.runtime),hold=gate();t.after(()=>a.dispose());
 const originalOwner=f.runtime.cookie.identity.ownerId,originalCsrf=f.runtime.cookie._view.csrf,originalEpoch=f.runtime.cookie._epoch;
 f.reply('list_inbox_v1',{message:status===401?'concierge_session_ended':'concierge_forbidden'},status,hold);const old=a.execute({schemaVersion:1,action:'list_inbox_v1',cursor:null,limit:50});await hold.entered;
 f.login(change==='owner'?{ownerId:id(91)}:change==='csrf'?{csrf:'SYNTHETIC-new-lifetime'}:{generation:2});await f.runtime.restore();const boundary=f.runtime.getSnapshot().boundary,b=createNotificationsController(f.runtime);t.after(()=>b.dispose());f.reply('list_inbox_v1',page(8));await b.loadInbox();assert.equal(b.getSnapshot().phase,'ready');
 const rejected=assert.rejects(old);hold.release();await rejected;assert.equal(f.runtime.cookie.status,'ready');assert.equal(f.runtime.getSnapshot().boundary,boundary);assert.equal(boundary.isCurrent(),true);assert.equal(b.getSnapshot().inbox.items[0].revision,8);
 if(change==='generation'){assert.equal(f.runtime.cookie.identity.ownerId,originalOwner);assert.equal(f.runtime.cookie._view.csrf,originalCsrf);assert.equal(f.runtime.cookie._epoch,originalEpoch);}
});
for(const action of ['list_inbox_v1','mark_seen_v1'])test(`certified current HTTP401 ${action} ends original actual session and clears private state`,async t=>{
 const f=await fixture(t),c=createNotificationsController(f.runtime);t.after(()=>c.dispose());f.reply('list_inbox_v1',page());await c.loadInbox();const boundary=f.runtime.getSnapshot().boundary;
 f.reply(action,{message:'concierge_session_ended'},401);if(action==='list_inbox_v1')await c.loadInbox();else await c.markSeen(item.deliveryId);
 assert.equal(f.runtime.cookie.status,'signedout');assert.equal(boundary.isCurrent(),false);assert.equal(c.getSnapshot().phase,'ended');assert.equal(c.getSnapshot().inbox,null);
});
test('reentrant disposing and throwing observers cannot revive an older controller or alter the remounted original',async t=>{
 const f=await fixture(t),a=createNotificationsController(f.runtime);f.reply('list_inbox_v1',page());await a.loadInbox();let b=null;
 a.subscribe(()=>{if(a.getSnapshot().mutation==='saving'&&!b){a.dispose();b=createNotificationsController(f.runtime);b.subscribe(()=>{throw Error('PRIVATE_OBSERVER');});}});
 await a.markSeen(item.deliveryId);assert.ok(b);t.after(()=>b.dispose());f.reply('list_inbox_v1',page(7));await b.loadInbox();const original=b.getSnapshot().pending;assert.ok(original);assert.equal(f.commands.filter(c=>c.action==='mark_seen_v1').length,0);
 a.dispose();assert.deepEqual(b.getSnapshot().pending,original);assert.equal(b.getSnapshot().inbox.items[0].revision,7);assert.equal(a.getSnapshot().inbox,null);
});
