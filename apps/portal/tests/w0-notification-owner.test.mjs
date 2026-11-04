import test from 'node:test';
import assert from 'node:assert/strict';
import {entryFixture,gate,id,at,event,ownerSource} from './w0-notification-owner-fixture.mjs';
const api=await ownerSource();
test('shared notification view lease is available without a caller authority or controller factory',()=>{
 assert.equal(typeof api.createNotificationViewLease,'function');
});
const memory=f=>f.runtime.getSnapshot().boundary.memory.get('notifications.original.v1');
function lease(t,f,options){const v=api.createNotificationViewLease(f.runtime,options);t.after(()=>v.dispose());return v;}
async function ready(t,options){const f=await entryFixture(t,options),a=lease(t,f);assert.equal(a.start(),true);f.reply('list_inbox_v1',f.page());await a.controller.loadInbox();return {f,a};}
test('constructing a view is inert and repeated start claims one actual feature memory owner',async t=>{
 const f=await entryFixture(t),a=lease(t,f);assert.equal(memory(f),undefined);assert.equal(a.controller.getSnapshot().phase,'idle');
 assert.equal(f.commands.length,0);assert.equal(a.start(),true);const owner=memory(f).owner;assert.ok(owner);
 assert.equal(a.start(),true);assert.equal(memory(f).owner,owner);assert.equal(f.commands.length,0);
});
test('two sequential view handles share one actual owner and clear A before replacement observers',async t=>{
 const {f,a}=await ready(t),owner=memory(f).owner;let cleared=false;
 a.controller.subscribe(()=>{cleared=true;assert.equal(a.controller.getSnapshot().phase,'ended');assert.equal(a.controller.getSnapshot().inbox,null);});
 const b=lease(t,f);assert.equal(b.start(),true);assert.ok(cleared);assert.equal(memory(f).owner,owner);
 f.reply('list_inbox_v1',f.page(9));await b.controller.loadInbox();a.dispose();
 assert.equal(b.controller.getSnapshot().inbox.items[0].revision,9);assert.equal(memory(f).owner,owner);
});
test('disposed old callbacks cannot read or dispatch against the current view',async t=>{
 const {f,a}=await ready(t),b=lease(t,f);b.start();f.reply('list_inbox_v1',f.page(7));await b.controller.loadInbox();const n=f.commands.length;
 await a.controller.loadInbox();await a.controller.markSeen(f.item.deliveryId);await a.controller.checkStatus();await a.controller.confirmRetry();
 a.controller.closeEvent();a.controller.cancelRetry();assert.equal(f.commands.length,n);
 assert.equal(a.controller.getSnapshot().inbox,null);assert.equal(b.controller.getSnapshot().inbox.items[0].revision,7);
});
test('a held old read cannot land in the replacement view or clear its actual owner',async t=>{
 const {f,a}=await ready(t),owner=memory(f).owner,held=gate();f.reply('list_inbox_v1',f.page(3),200,held);
 const old=a.controller.loadInbox();await held.entered;const b=lease(t,f);b.start();
 f.reply('list_inbox_v1',f.page(11));await b.controller.loadInbox();held.release();await old;
 assert.equal(a.controller.getSnapshot().phase,'ended');assert.equal(b.controller.getSnapshot().inbox.items[0].revision,11);assert.equal(memory(f).owner,owner);
});
test('an uncertain original survives view replacement without new UUID or automatic replay',async t=>{
 const {f,a}=await ready(t),owner=memory(f).owner;f.reply('mark_seen_v1',{message:'concierge_unavailable'},503);await a.controller.markSeen(f.item.deliveryId);
 const original=f.commands.at(-1);assert.equal(original.action,'mark_seen_v1');await f.runtime.restore();
 const b=lease(t,f);b.start();f.reply('list_inbox_v1',f.page(13));await b.controller.loadInbox();
 assert.equal(memory(f).owner,owner);assert.deepEqual(b.controller.getSnapshot().pending,original);
 assert.equal(f.commands.filter(x=>x.action==='mark_seen_v1').length,1);const n=f.commands.length;await a.controller.retryExact();assert.equal(f.commands.length,n);
});
for(const change of ['owner','csrf','generation'])test('actual '+change+' replacement retires the old private owner',async t=>{
 const {f,a}=await ready(t),oldBoundary=f.runtime.getSnapshot().boundary;
 f.login(change==='owner'?{ownerId:id(91)}:change==='csrf'?{csrf:'SYNTHETIC-owner-new'}:{generation:2});await f.runtime.restore();
 assert.equal(a.controller.getSnapshot().phase,'ended');assert.equal(a.controller.getSnapshot().inbox,null);assert.notEqual(f.runtime.getSnapshot().boundary,oldBoundary);
 const b=lease(t,f);assert.equal(b.start(),true);f.reply('list_inbox_v1',f.page(17));await b.controller.loadInbox();assert.equal(b.controller.getSnapshot().inbox.items[0].revision,17);
});
test('a newer reentrant C claim survives B replacement cleanup and A disposal',async t=>{
 const {f,a}=await ready(t),owner=memory(f).owner;let c,load;
 a.controller.subscribe(()=>{if(a.controller.getSnapshot().phase==='ended'&&!c){c=lease(t,f);assert.equal(c.start(),true);f.reply('list_inbox_v1',f.page(19));load=c.controller.loadInbox();}});
 const b=lease(t,f);assert.equal(b.start(),false);await load;a.dispose();b.dispose();
 assert.ok(c);assert.equal(c.controller.getSnapshot().inbox.items[0].revision,19);assert.equal(memory(f).owner,owner);
});
test('deny-only relevance suspension after callback prevents dispatch with the actual cookie offline',async t=>{
 const f=await entryFixture(t);let suspend=false;const a=lease(t,f,{isApplicable(){if(suspend)f.runtime.cookie.suspend();return true;}});a.start();
 suspend=true;await a.controller.loadInbox();assert.equal(f.runtime.cookie.status,'offline');assert.equal(f.commands.length,0);assert.equal(a.controller.getSnapshot().inbox,null);
});
test('false relevance cannot be reversed by a later true flag or revive a retired handle',async t=>{
 const f=await entryFixture(t);let relevant=true;const a=lease(t,f,{isApplicable:()=>relevant});a.start();
 relevant=false;assert.equal(a.controller.getSnapshot().phase,'ended');relevant=true;assert.equal(a.start(),false);await a.controller.loadInbox();assert.equal(f.commands.length,0);
});
test('an initial missing actual boundary cannot be adopted after a later restore',async t=>{
 const f=await entryFixture(t,{restore:false}),a=lease(t,f);assert.equal(a.start(),false);await f.runtime.restore();assert.equal(a.start(),false);assert.equal(f.commands.length,0);
 const b=lease(t,f);assert.equal(b.start(),true);
});
test('actual current HTTP403 clears rows without upgrading the view to an authority grant',async t=>{
 const {f,a}=await ready(t);f.reply('list_inbox_v1',{message:'concierge_forbidden'},403);await a.controller.loadInbox();
 assert.equal(a.controller.getSnapshot().phase,'denied');assert.equal(a.controller.getSnapshot().inbox,null);assert.equal(f.runtime.cookie.status,'ready');
});
test('actual current HTTP401 ends the runtime and clears the private view',async t=>{
 const {f,a}=await ready(t);f.reply('list_inbox_v1',{message:'concierge_session_ended'},401);await a.controller.loadInbox();
 assert.equal(f.runtime.cookie.status,'signedout');assert.equal(a.controller.getSnapshot().phase,'ended');assert.equal(a.controller.getSnapshot().inbox,null);
});
test('a true relevance callback cannot make an actual rejected VIEW session ready',async t=>{
 const f=await entryFixture(t,{restore:false});f.login({capabilities:{view:false,edit:false,publish:false,confirmPayments:false}});await assert.rejects(f.runtime.restore());
 const a=lease(t,f,{isApplicable:()=>true});assert.equal(a.start(),false);await a.controller.loadInbox();assert.equal(f.commands.length,0);assert.equal(a.controller.getSnapshot().inbox,null);
 assert.equal(a.controller.getSnapshot().phase,'ended');
});
test('callback-triggered actual session retirement cannot return a previously loaded private snapshot',async t=>{
 const f=await entryFixture(t);let end=false;const a=lease(t,f,{isApplicable(){if(end)f.runtime.cookie._end();return true;}});a.start();
 f.reply('list_inbox_v1',f.page());await a.controller.loadInbox();end=true;
 assert.equal(a.controller.getSnapshot().phase,'ended');assert.equal(a.controller.getSnapshot().inbox,null);
});
test('inbox to A06 shares the real owner while old confirmation callbacks cannot act on the newer view',async t=>{
 const {f,a}=await ready(t,{audience:'advisor',edit:true}),owner=memory(f).owner;
 const target={draftId:id(30),clientId:id(31),contentRevision:2,assignmentRevision:1,contentHash:'a'.repeat(64)};
 const command={schemaVersion:1,action:'publish_plan_v1',requestId:id(32),target,approvalId:id(33),firstServiceClaimId:null};
 const receipt={requestId:id(32),publicationReceiptId:id(34),target,kind:'care_plan',publicationVersion:3,instructionId:null,reviewId:null,publishedAt:at,firstServiceStarted:false,notificationEventId:event.eventId};
 const delivery=(status='failed',revision=2)=>({schemaVersion:1,consistency:'live_keyset',observedAt:at,cursor:null,event,items:[{deliveryId:id(3),channel:'email',status,revision,seenAt:null}],nextCursor:null});
 const b=lease(t,f);b.start();f.reply('read_event_deliveries_v1',delivery());await b.controller.openPublication(command,receipt);b.controller.prepareRetry(id(3));
 const confirmation=b.controller.getSnapshot().confirmation;assert.ok(confirmation);const n=f.commands.length;
 await a.controller.confirmRetry();a.controller.cancelRetry();assert.equal(f.commands.length,n);assert.equal(b.controller.getSnapshot().confirmation,confirmation);
 f.reply('retry_failed_email_v1',f.receipt);f.reply('list_inbox_v1',f.page());f.reply('read_event_deliveries_v1',delivery('queued',3));await b.controller.confirmRetry();
 assert.deepEqual(f.commands.slice(n).map(c=>c.action),['retry_failed_email_v1','list_inbox_v1','read_event_deliveries_v1']);
 assert.equal(b.controller.getSnapshot().deliveries.items[0].status,'queued');assert.equal(memory(f).owner,owner);
});
test('actual serial Vault queues the replacement read after a held write without losing original custody',async t=>{
 const {f,a}=await ready(t,{serial:true}),owner=memory(f).owner,held=gate();f.reply('mark_seen_v1',f.receipt,200,held);
 const old=a.controller.markSeen(f.item.deliveryId);await held.entered;const original=f.commands.at(-1);
 const b=lease(t,f);b.start();const n=f.queued();f.reply('list_inbox_v1',f.page(23,at));const loading=b.controller.loadInbox();await f.whenQueued(n+1);
 held.release();await Promise.all([old,loading]);assert.equal(b.controller.getSnapshot().inbox.items[0].revision,23);
 assert.deepEqual(b.controller.getSnapshot().pending,original);assert.equal(memory(f).owner,owner);assert.equal(f.record().status,'active');
});
for(const method of ['loadInbox','cancelRetry'])test('failed applicability on '+method+' permanently retires that view handle',async t=>{
 const f=await entryFixture(t);let relevant=true;const a=lease(t,f,{isApplicable:()=>relevant});a.start();
 relevant=false;await a.controller[method]();relevant=true;
 assert.equal(a.start(),false);assert.equal(a.controller.getSnapshot().phase,'ended');assert.equal(f.commands.length,0);
});
test('reentrant relevance option getter cannot observe a provisional ready phase',async t=>{
 const f=await entryFixture(t);let armed=false,nested=null,a;
 a=lease(t,f,{get isApplicable(){if(armed){nested=a.controller.getSnapshot().phase;return()=>false;}return()=>true;}});
 a.start();f.reply('list_inbox_v1',f.page());await a.controller.loadInbox();assert.equal(a.controller.getSnapshot().phase,'ready');
 armed=true;assert.equal(a.controller.getSnapshot().phase,'ended');assert.notEqual(nested,'ready');assert.equal(f.runtime.cookie.status,'ready');
});
