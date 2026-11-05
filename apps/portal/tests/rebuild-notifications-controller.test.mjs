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
test('actual own inbox and mark-seen use Root commands, VIEW-only CSRF write, then fresh live rows',async t=>{
 const {f,c}=await ready(t);assert.equal(c.getSnapshot().inbox.items[0].seenAt,null);f.reply('mark_seen_v1',receipt);f.reply('list_inbox_v1',inbox([{...item,revision:5,seenAt:at}]));await c.markSeen(item.deliveryId);assert.equal(c.getSnapshot().mutation,'resolved');assert.equal(c.getSnapshot().inbox.items[0].revision,5);assert.equal(f.calls[1].command.expectedRevision,4);assert.equal(c.getSnapshot().pending,null);assert.deepEqual(f.calls.map(x=>x.command.action),['list_inbox_v1','mark_seen_v1','list_inbox_v1']);
});
test('keyset next/previous keeps actual cursors and empty advancing observations without totals',async t=>{
 const {f,c}=await ready(t);f.reply('list_inbox_v1',inbox([item],null,'n:'+id(2)));await c.loadInbox();f.reply('list_inbox_v1',inbox([],'n:'+id(2),'n:'+id(5)));await c.nextInbox();assert.equal(c.getSnapshot().inbox.items.length,0);assert.equal(c.getSnapshot().canPreviousInbox,true);assert.equal(f.calls.at(-1).command.cursor,'n:'+id(2));f.reply('list_inbox_v1',inbox());await c.previousInbox();assert.equal(c.getSnapshot().inbox.cursor,null);assert.equal('unreadCount'in c.getSnapshot(),false);
});
test('human loaded-event status is VIEW; retry is failed-only current EDIT and separately confirmed',async t=>{
 const {f,c}=await ready(t,'advisor',true);f.reply('read_event_deliveries_v1',deliveries());await c.openEvent(item.deliveryId);assert.equal(c.getSnapshot().canRetryEmail,true);c.prepareRetry(id(3));assert.ok(c.getSnapshot().confirmation);assert.equal(f.calls.length,2);f.reply('retry_failed_email_v1',receipt);f.reply('list_inbox_v1',inbox());f.reply('read_event_deliveries_v1',deliveries('queued',3));await c.confirmRetry();assert.equal(f.calls[2].command.expectedRevision,2);assert.equal(c.getSnapshot().deliveries.items[0].status,'queued');c.prepareRetry(id(3));assert.equal(c.getSnapshot().confirmation,null);assert.equal(f.calls.filter(x=>x.command.action==='publish_plan_v1').length,0);
 const v=await ready(t,'advisor',false);v.f.reply('read_event_deliveries_v1',deliveries());await v.c.openEvent(item.deliveryId);v.c.prepareRetry(id(3));await v.c.confirmRetry();assert.equal(v.f.calls.length,2);assert.equal(v.c.getSnapshot().confirmation,null);
});
test('unknown result retains exact original across offline dispose/remount, status and deliberate exact retry',async t=>{
 const {f,c}=await ready(t);f.reply('mark_seen_v1',{code:'uncertain'},503);await c.markSeen(item.deliveryId);const original=f.calls.at(-1).command;assert.equal(c.getSnapshot().phase,'offline');assert.equal(c.getSnapshot().inbox,null);c.dispose();await f.runtime.restore();const b=controller(f);t.after(()=>b.dispose());f.reply('list_inbox_v1',inbox());await b.loadInbox();assert.deepEqual(b.getSnapshot().pending,original);f.reply('request_status_v1',{status:'unknown'});await b.checkStatus();assert.equal(b.getSnapshot().mutation,'unknown');assert.deepEqual(f.calls.at(-1).command.original,original);const n=f.calls.length;await b.markSeen(item.deliveryId);assert.equal(f.calls.length,n);f.reply('mark_seen_v1',receipt);f.reply('list_inbox_v1',inbox([{...item,revision:5,seenAt:at}]));await b.retryExact();assert.deepEqual(f.calls[n].command,original);assert.equal(JSON.stringify(f.calls[n].command),JSON.stringify(original));assert.equal(b.getSnapshot().pending,null);
});
test('historical committed status resolves original only and displays freshly read newer revisions',async t=>{
 const {f,c}=await ready(t);f.reply('mark_seen_v1',{code:'uncertain'},503);await c.markSeen(item.deliveryId);const original=f.calls.at(-1).command;await f.runtime.restore();f.reply('list_inbox_v1',inbox([{...item,revision:8,seenAt:at}]));await c.loadInbox();f.reply('request_status_v1',{status:'committed',receipt:receipt(original)});f.reply('list_inbox_v1',inbox([{...item,revision:9,seenAt:at}]));await c.checkStatus();assert.equal(c.getSnapshot().receipt.revision,5);assert.equal(c.getSnapshot().inbox.items[0].revision,9);assert.equal(c.getSnapshot().pending,null);
});
test('unloaded event UUID and client human operations never dispatch',async t=>{
 const {f,c}=await ready(t);await c.openEvent(id(99));await c.loadDeliveries();c.prepareRetry(id(3));await c.confirmRetry();assert.equal(f.calls.length,1);assert.equal(c.getSnapshot().missingInput,'trusted_notification_event_reference');
});
test('expiry during an observer callback clears private state and retires the old notification before another delivery',async t=>{
 const {f,c}=await ready(t);let expire=false,afterExpiry=0;
 c.subscribe(()=>{if(c.getSnapshot().phase==='ready'&&!expire){expire=true;f.now(Date.parse('2100-01-01T00:00:00Z'));}});
 c.subscribe(()=>{if(expire)afterExpiry++;});f.reply('list_inbox_v1',inbox());await c.loadInbox();assert.equal(c.getSnapshot().phase,'ended');assert.equal(c.getSnapshot().inbox,null);assert.equal(afterExpiry,1,'only the cleared ended-state notification may be delivered');
});
test('newer loading observer operation B survives A completion/finally and observer exceptions never become network errors',async t=>{
 const {f,c}=await ready(t);const h=gate();f.reply('list_inbox_v1',inbox([{...item,revision:7}]),200,{hold:h});const a=c.loadInbox();await h.entered;f.reply('list_inbox_v1',inbox([{...item,revision:8}]));await c.loadInbox();h.release();await a;t.diagnostic(JSON.stringify({case:'late-A-read',phase:c.getSnapshot().phase,cookieStatus:f.runtime.cookie.status,boundaryPresent:!!f.runtime.getSnapshot().boundary}));assert.equal(c.getSnapshot().inbox.items[0].revision,8);assert.equal(c.getSnapshot().phase,'ready');
 c.subscribe(()=>{throw Error('PRIVATE_OBSERVER_CANARY');});f.reply('list_inbox_v1',inbox([{...item,revision:9}]));await c.loadInbox();assert.equal(c.getSnapshot().inbox.items[0].revision,9);assert.equal(c.getSnapshot().message,null);
});
test('ordinary remount claims session custody; old held write cannot clear the new owner original or private state',async t=>{
 const {f,c}=await ready(t);const h=gate();f.reply('mark_seen_v1',receipt,200,{hold:h});const a=c.markSeen(item.deliveryId);await h.entered;const original=f.calls.at(-1).command;c.dispose();const b=controller(f);t.after(()=>b.dispose());f.reply('list_inbox_v1',inbox([{...item,revision:7}]));await b.loadInbox();assert.deepEqual(b.getSnapshot().pending,original);h.release();await a;t.diagnostic(JSON.stringify({case:'old-write-new-controller',phase:b.getSnapshot().phase,cookieStatus:f.runtime.cookie.status,boundaryPresent:!!f.runtime.getSnapshot().boundary}));assert.equal(b.getSnapshot().inbox.items[0].revision,7);assert.deepEqual(b.getSnapshot().pending,original);assert.equal(c.getSnapshot().inbox,null);
});
for(const change of ['owner','generation','signedout','expiry'])test('actual session '+change+' invalidates held private results and old controllers never revive',async t=>{
 const {f,c}=await ready(t);const h=gate();f.reply('list_inbox_v1',inbox(),200,{hold:h});const a=c.loadInbox();await h.entered;
 if(change==='owner')f.login({ownerId:id(91)});if(change==='generation')f.login({generation:2});if(change==='signedout')f.login({signedIn:false});if(change==='expiry')f.now(Date.parse('2100-01-01T00:00:00Z'));
 if(change!=='expiry')await f.runtime.restore();assert.equal(c.getSnapshot().inbox,null);h.release();await a;assert.equal(c.getSnapshot().phase,'ended');assert.equal(c.getSnapshot().inbox,null);const n=f.calls.length;await c.loadInbox();assert.equal(f.calls.length,n);
});
test('disposal from a loading listener prevents first operation egress; getter and later callbacks observe cleared private state',async t=>{
 const {f,c}=await ready(t);let calls=0;c.subscribe(()=>{if(c.getSnapshot().phase==='loading')c.dispose();calls++;});await c.loadInbox();assert.equal(f.calls.length,1);assert.equal(c.getSnapshot().phase,'ended');assert.equal(c.getSnapshot().inbox,null);assert.ok(calls>=1);
});
test('deny-only applicability cannot revive a retired controller after returning true later',async t=>{
 const f=await fixture(t);let applicable=true;const c=controller(f,{isApplicable:()=>applicable});t.after(()=>c.dispose());f.reply('list_inbox_v1',inbox());await c.loadInbox();applicable=false;assert.equal(c.getSnapshot().phase,'ended');applicable=true;await c.loadInbox();assert.equal(f.calls.length,1);assert.equal(c.getSnapshot().inbox,null);
});
test('EDIT removal clears retry confirmation before an abort callback; only fresh VIEW reads can repopulate',async t=>{
 const {f,c}=await ready(t,'advisor',true);f.reply('read_event_deliveries_v1',deliveries());await c.openEvent(item.deliveryId);c.prepareRetry(id(3));f.login({capabilities:{view:true,edit:false,publish:true,confirmPayments:true}});await f.runtime.restore();assert.equal(c.getSnapshot().confirmation,null);assert.equal(c.getSnapshot().deliveries,null);const n=f.calls.length;await c.confirmRetry();assert.equal(f.calls.length,n);f.reply('list_inbox_v1',inbox());await c.loadInbox();f.reply('read_event_deliveries_v1',deliveries());await c.openEvent(item.deliveryId);assert.equal(c.getSnapshot().canRetryEmail,false);
});
test('reentrant deny-only applicability cannot let outer A cancel or overwrite the newer B read',async t=>{
 const f=await fixture(t);let armed=false,b=null,c;const applicable=()=>{if(armed){armed=false;b=c.loadInbox();}return true;};c=controller(f,{isApplicable:applicable});t.after(()=>c.dispose());f.reply('list_inbox_v1',inbox([{...item,revision:9}]));armed=true;await c.loadInbox();await b;assert.equal(f.calls.length,1);assert.equal(c.getSnapshot().phase,'ready');assert.equal(c.getSnapshot().inbox.items[0].revision,9);
});
test('a sibling actual HTTP suspension preserves unresolved original despite a later local401',async t=>{
 const {f,c}=await ready(t);const h=gate();f.reply('mark_seen_v1',receipt,200,{hold:h});const a=c.markSeen(item.deliveryId);await h.entered;const original=f.calls.at(-1).command;const {createNotificationRequest}=await import('../src/app/notification-request.ts');const sibling=createNotificationRequest(f.runtime);f.reply('list_inbox_v1',{code:'unavailable'},503);await assert.rejects(sibling.execute({schemaVersion:1,action:'list_inbox_v1',cursor:null,limit:50}));assert.equal(c.getSnapshot().phase,'offline');h.release();await a;assert.equal(f.runtime.cookie.status,'offline');await f.runtime.restore();c.dispose();const b=controller(f);t.after(()=>b.dispose());f.reply('list_inbox_v1',inbox());await b.loadInbox();assert.deepEqual(b.getSnapshot().pending,original);sibling.dispose();
});
const target={draftId:id(30),clientId:id(31),contentRevision:2,assignmentRevision:1,contentHash:'a'.repeat(64)};
const publicationCommand={schemaVersion:1,action:'publish_plan_v1',requestId:id(32),target,approvalId:id(33),firstServiceClaimId:null};
const publicationReceipt={requestId:id(32),publicationReceiptId:id(34),target,kind:'care_plan',publicationVersion:3,instructionId:null,reviewId:null,publishedAt:at,firstServiceStarted:false,notificationEventId:id(1)};
test('A06 opens only the original acknowledged publication event using actual human VIEW status, with no publish dispatch',async t=>{
 const f=await fixture(t,'advisor',true),c=controller(f);t.after(()=>c.dispose());f.reply('read_event_deliveries_v1',deliveries());await c.openPublication(publicationCommand,publicationReceipt);assert.equal(f.calls[0].command.eventId,event.eventId);assert.equal(c.getSnapshot().deliveries.event.source.publicationVersion,3);c.prepareRetry(id(3));f.reply('retry_failed_email_v1',receipt);f.reply('read_event_deliveries_v1',deliveries('queued',3));await c.confirmRetry();assert.deepEqual(f.calls.map(x=>x.command.action),['read_event_deliveries_v1','retry_failed_email_v1','read_event_deliveries_v1']);await c.openPublication(publicationCommand,{...publicationReceipt,requestId:id(99)});assert.equal(f.calls.length,3);
});
for(const status of ['queued','claimed','uncertain','accepted','delivered','bounced'])test('human email '+status+' never offers or dispatches a new failed-only retry',async t=>{
 const {f,c}=await ready(t,'advisor',true);f.reply('read_event_deliveries_v1',deliveries(status));await c.openEvent(item.deliveryId);c.prepareRetry(id(3));await c.confirmRetry();assert.equal(c.getSnapshot().confirmation,null);assert.equal(f.calls.length,2);
});
test('malformed acknowledgement and mismatched historical CAS preserve exact original, while private data never reaches a snapshot',async t=>{
 const {f,c}=await ready(t);f.reply('mark_seen_v1',cmd=>({...receipt(cmd),privateNote:'PRIVATE_NOTIFICATION_CANARY'}));await c.markSeen(item.deliveryId);const original=f.calls.at(-1).command;assert.equal(c.getSnapshot().phase,'offline');assert.doesNotMatch(JSON.stringify(c.getSnapshot()),/PRIVATE_NOTIFICATION_CANARY/);await f.runtime.restore();f.reply('list_inbox_v1',inbox());await c.loadInbox();f.reply('request_status_v1',{status:'committed',receipt:{...receipt(original),previousRevision:3}});await c.checkStatus();assert.deepEqual(f.calls.at(-1).command.original,original);assert.equal(c.getSnapshot().receipt,null);assert.equal(c.getSnapshot().phase,'offline');assert.equal(c.getSnapshot().pending,null);await f.runtime.restore();f.reply('list_inbox_v1',inbox());await c.loadInbox();assert.equal(c.getSnapshot().pending.requestId,original.requestId);assert.doesNotMatch(JSON.stringify(c.getSnapshot()),/PRIVATE_NOTIFICATION_CANARY/);
});
test('current denial and oversized/private pages clear display and do not create a mutation',async t=>{
 for(const reply of [{status:403,body:{message:'concierge_forbidden'}},{status:200,body:{...inbox(),privateSource:'PRIVATE_NOTIFICATION_CANARY'}},{status:200,body:{...inbox(),padding:'PRIVATE_NOTIFICATION_CANARY'.repeat(7000)}}]){
  const {f,c}=await ready(t);f.reply('list_inbox_v1',reply.body,reply.status);await c.loadInbox();assert.equal(c.getSnapshot().inbox,null);assert.equal(c.getSnapshot().pending,null);assert.doesNotMatch(JSON.stringify(c.getSnapshot()),/PRIVATE_NOTIFICATION_CANARY|privateSource/);assert.ok(['denied','offline'].includes(c.getSnapshot().phase));
 }
});
test('initial stale CAS rejection never claims seen or silently generates another UUID',async t=>{
 const {f,c}=await ready(t);f.reply('mark_seen_v1',{message:'concierge_revision_conflict'},409);await c.markSeen(item.deliveryId);const original=f.calls.at(-1).command;assert.equal(c.getSnapshot().mutation,'conflict');assert.deepEqual(c.getSnapshot().pending,original);assert.equal(c.getSnapshot().receipt,null);const n=f.calls.length;await c.markSeen(item.deliveryId);assert.equal(f.calls.length,n);f.reply('request_status_v1',{status:'unknown'});await c.checkStatus();assert.equal(c.getSnapshot().mutation,'unknown');assert.deepEqual(c.getSnapshot().pending,original);
});
test('observer exceptions are isolated from successful network validation and never leak their text',async t=>{
 const {f,c}=await ready(t);c.subscribe(()=>{throw Error('PRIVATE_OBSERVER_CANARY');});f.reply('list_inbox_v1',inbox([{...item,revision:9}]));await c.loadInbox();assert.equal(c.getSnapshot().inbox.items[0].revision,9);assert.equal(c.getSnapshot().message,null);assert.doesNotMatch(JSON.stringify(c.getSnapshot()),/PRIVATE_OBSERVER_CANARY/);
});
test('delivery keyset pages retain cursor observations and closing returns to the already loaded inbox',async t=>{
 const {f,c}=await ready(t,'advisor',true);f.reply('read_event_deliveries_v1',{...deliveries(),nextCursor:'n:'+id(4)});await c.openEvent(item.deliveryId);f.reply('read_event_deliveries_v1',{...deliveries(),cursor:'n:'+id(4),items:[],nextCursor:'n:'+id(7)});await c.nextDeliveries();assert.equal(c.getSnapshot().canPreviousDeliveries,true);assert.equal(c.getSnapshot().deliveries.cursor,'n:'+id(4));f.reply('read_event_deliveries_v1',deliveries());await c.previousDeliveries();assert.equal(c.getSnapshot().deliveries.cursor,null);c.closeEvent();assert.equal(c.getSnapshot().selectedEvent,null);assert.equal(c.getSnapshot().deliveries,null);assert.equal(c.getSnapshot().inbox.items[0].deliveryId,item.deliveryId);
});
test('private snapshots are cleared before actual abort listeners and late cleanup after disposal',async t=>{
 const {f,c}=await ready(t);const h=gate();let observed=null;f.reply('mark_seen_v1',receipt,200,{hold:h,onAbort:()=>{const s=c.getSnapshot();observed={phase:s.phase,inbox:s.inbox,deliveries:s.deliveries,pending:s.pending,receipt:s.receipt};}});const a=c.markSeen(item.deliveryId);await h.entered;c.dispose();assert.deepEqual(observed,{phase:'ended',inbox:null,deliveries:null,pending:null,receipt:null});h.release();await a;assert.equal(c.getSnapshot().inbox,null);
});
