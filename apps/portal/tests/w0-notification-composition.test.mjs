import test from 'node:test';
import assert from 'node:assert/strict';
import {entryFixture,at,event,id,gate} from './rebuild-notifications-entry-fixture.mjs';
import {draftView,ids} from './rebuild/advisor-fixture.mjs';
const review={name:'advisor-editor',draftId:ids.draft,section:'review-publish'};
const target=draftView(true).target;
const publish={schemaVersion:1,action:'publish_plan_v1',requestId:ids.receipt,target,approvalId:ids.approval,firstServiceClaimId:null};
const receipt={requestId:ids.receipt,publicationReceiptId:ids.quote,target,kind:'care_plan',publicationVersion:3,instructionId:null,reviewId:null,publishedAt:at,firstServiceStarted:false,notificationEventId:event.eventId};
const deliveries={schemaVersion:1,consistency:'live_keyset',observedAt:at,cursor:null,event,items:[{deliveryId:id(3),channel:'email',status:'failed',revision:2,seenAt:null}],nextCursor:null};
const owner=f=>f.runtime.getSnapshot().boundary.memory.get('notifications.original.v1')?.owner;
async function setup(t){
 const f=await entryFixture(t,{audience:'advisor',edit:true,initialPath:'/advisor/notifications'}),advisor=f.advisor();
 f.replyPlan('read_draft_v1',draftView(true));
 f.replyPlan('read_advisor_gate_v1',{schemaVersion:1,clientId:ids.client,target,publisher:{kind:'human',actorId:f.runtime.cookie.identity.ownerId},approval:null,publication:'first',coverage:'inactive',
  capabilities:{actorId:f.runtime.cookie.identity.ownerId,view:true,edit:true,assign:true,review:true,approve:false,publish:false,confirmPayments:false},
  policy:{revision:1,ownerActorId:f.runtime.cookie.identity.ownerId,requireKanujApproval:true}});
 await advisor.open(ids.draft);
 assert.equal(advisor.getSnapshot().view.draft.id,ids.draft);assert.equal(f.runtime.cookie.status,'ready');return {f,advisor};
}
test('actual inbox StrictMode stop/start retains one feature memory owner',async t=>{
 const f=await entryFixture(t,{audience:'advisor',initialPath:'/advisor/notifications'}),entry=f.create();t.after(()=>entry.dispose());
 f.reply('list_inbox_v1',f.page());await entry.start();const boundary=f.runtime.getSnapshot().boundary;
 const first=boundary.memory.get('notifications.original.v1').owner;const old=entry.getSnapshot().controller;
 entry.stop();assert.equal(old.getSnapshot().phase,'ended');f.reply('list_inbox_v1',f.page(9));await entry.start();
 assert.equal(boundary.memory.get('notifications.original.v1').owner,first,'route remount must not construct a competing feature memory owner');
 assert.equal(entry.getSnapshot().controller.getSnapshot().inbox.items[0].revision,9);
});
test('actual inbox to publication and back shares one feature owner and retires old callbacks',async t=>{
 const {f,advisor}=await setup(t),inbox=f.create();t.after(()=>inbox.dispose());
 f.reply('list_inbox_v1',f.page());await inbox.start();const first=owner(f),old=inbox.getSnapshot().controller;
 f.navigation.navigate(review);assert.equal(inbox.getSnapshot().controller,null);
 const publication=f.createPublication(advisor);assert.ok(publication);t.after(()=>publication.dispose());assert.equal(publication.start(),true);
 f.reply('read_event_deliveries_v1',deliveries);await publication.controller.openPublication(publish,receipt);
 assert.equal(owner(f),first);assert.equal(publication.controller.getSnapshot().deliveries.event.eventId,event.eventId);
 await old.loadInbox();assert.equal(f.commands.length,2);
 f.navigation.navigate({name:'advisor-notifications'});assert.equal(publication.controller.getSnapshot().phase,'ended');
 const next=f.create();t.after(()=>next.dispose());f.reply('list_inbox_v1',f.page(9));await next.start();
 const count=f.commands.length;await publication.controller.loadDeliveries();await publication.controller.confirmRetry();publication.controller.cancelRetry();
 assert.equal(f.commands.length,count);assert.equal(next.getSnapshot().phase,'active');assert.equal(owner(f),first);
});
test('uncertain inbox intent survives the real publication view without new UUID or automatic replay',async t=>{
 const {f,advisor}=await setup(t),inbox=f.create();t.after(()=>inbox.dispose());f.reply('list_inbox_v1',f.page());await inbox.start();const first=owner(f);
 f.reply('mark_seen_v1',{message:'concierge_uncertain'},503);await inbox.getSnapshot().controller.markSeen(f.item.deliveryId);const original=f.commands.at(-1);
 await f.runtime.restore();f.navigation.navigate(review);const publication=f.createPublication(advisor);assert.ok(publication);t.after(()=>publication.dispose());publication.start();
 f.reply('read_event_deliveries_v1',deliveries);await publication.controller.openPublication(publish,receipt);
 assert.deepEqual(publication.controller.getSnapshot().pending,original);assert.equal(owner(f),first);
 assert.equal(f.commands.filter(c=>c.action==='mark_seen_v1').length,1);
});
test('publication factory cannot claim an actual inbox context or an unassigned editor',async t=>{
 const {f,advisor}=await setup(t),inbox=f.create();t.after(()=>inbox.dispose());f.reply('list_inbox_v1',f.page());await inbox.start();const first=owner(f);
 assert.equal(f.createPublication(advisor),null);assert.equal(inbox.getSnapshot().phase,'active');assert.equal(owner(f),first);
 const unassigned=await entryFixture(t,{audience:'advisor',edit:true,initialPath:'/advisor/plans/'+ids.draft+'/review-publish'}),other=unassigned.advisor();
 unassigned.replyPlan('read_draft_v1',draftView(false));await other.open(ids.draft);assert.equal(unassigned.runtime.cookie.status,'ready');
 assert.equal(other.getSnapshot().view.draft.clientId,null);assert.equal(unassigned.createPublication(other),null);
});
test('a captured publication view cannot retire a newer inbox after leaving its exact route',async t=>{
 const {f,advisor}=await setup(t);f.navigation.navigate(review);const publication=f.createPublication(advisor);assert.ok(publication);t.after(()=>publication.dispose());
 f.navigation.navigate({name:'advisor-notifications'});const inbox=f.create();t.after(()=>inbox.dispose());f.reply('list_inbox_v1',f.page());await inbox.start();const first=owner(f);
 assert.equal(publication.start(),false);assert.equal(inbox.getSnapshot().phase,'active');assert.equal(owner(f),first);
});
test('actual publication wrapper SSR is inert and adds no notification owner or read',async t=>{
 const {f,advisor}=await setup(t);f.navigation.navigate(review);assert.equal(owner(f),undefined);
 const html=f.workspaceHtml(advisor,review);assert.match(html,/review|publish/);assert.equal(owner(f),undefined);assert.equal(f.commands.length,0);
});
test('remount begins the fresh inbox read before publishing any prior cached ready page',async t=>{
 const f=await entryFixture(t),entry=f.create();t.after(()=>entry.dispose());f.reply('list_inbox_v1',f.page());await entry.start();entry.stop();
 const held=gate(),seen=[];entry.subscribe(()=>{const c=entry.getSnapshot().controller;if(c)seen.push({phase:c.getSnapshot().phase,inbox:c.getSnapshot().inbox});});
 f.reply('list_inbox_v1',f.page(11),200,held);const loading=entry.start();await held.entered;
 assert.ok(seen.length);assert.equal(seen[0].phase,'loading');assert.equal(seen[0].inbox,null);held.release();await loading;
});
test('publication effect cleanup/setup uses new view handles and one persistent feature owner',async t=>{
 const {f,advisor}=await setup(t);f.navigation.navigate(review);const a=f.createPublication(advisor);assert.ok(a);a.start();const first=owner(f);a.dispose();
 const b=f.createPublication(advisor);assert.ok(b);t.after(()=>b.dispose());assert.equal(b.start(),true);assert.equal(owner(f),first);
 assert.equal(a.controller.getSnapshot().phase,'ended');assert.equal(f.commands.length,0);
});
test('client audience cannot obtain the advisor publication view from a route or an actual foreign controller',async t=>{
 const {advisor}=await setup(t),client=await entryFixture(t,{initialPath:'/advisor/plans/'+ids.draft+'/review-publish'});
 assert.equal(client.createPublication(advisor),null);assert.equal(client.commands.length,0);assert.equal(owner(client),undefined);
});
test('parent-owned retirement denies an otherwise live same-session publication context',async t=>{
 const {f,advisor}=await setup(t);f.navigation.navigate(review);let active=true;
 const publication=f.createPublication(advisor,{isApplicable:()=>active});assert.ok(publication);t.after(()=>publication.dispose());publication.start();
 active=false;assert.equal(publication.controller.getSnapshot().phase,'ended');
 assert.equal(f.createPublication(advisor,{isApplicable:()=>active}),null);assert.equal(f.runtime.cookie.status,'ready');assert.equal(f.commands.length,0);
});
test('publication preparation restores an uncertain recovery view before the child receives its controller',async t=>{
 const {f,advisor}=await setup(t),inbox=f.create();t.after(()=>inbox.dispose());f.reply('list_inbox_v1',f.page());await inbox.start();
 f.reply('mark_seen_v1',{message:'concierge_uncertain'},503);await inbox.getSnapshot().controller.markSeen(f.item.deliveryId);const original=f.commands.at(-1);
 await f.runtime.restore();f.navigation.navigate(review);const publication=f.createPublication(advisor);assert.ok(publication);t.after(()=>publication.dispose());
 assert.equal(typeof publication.prepare,'function');f.reply('list_inbox_v1',f.page(10));assert.equal(await publication.prepare(),true);
 assert.equal(publication.controller.getSnapshot().phase,'ready');assert.deepEqual(publication.controller.getSnapshot().pending,original);
 assert.equal(f.commands.filter(c=>c.action==='mark_seen_v1').length,1);
});
test('preparation cannot publish a controller after its parent retires during the held recovery read',async t=>{
 const {f,advisor}=await setup(t),inbox=f.create();t.after(()=>inbox.dispose());f.reply('list_inbox_v1',f.page());await inbox.start();
 f.reply('mark_seen_v1',{message:'concierge_uncertain'},503);await inbox.getSnapshot().controller.markSeen(f.item.deliveryId);
 await f.runtime.restore();f.navigation.navigate(review);let active=true;const publication=f.createPublication(advisor,{isApplicable:()=>active});assert.ok(publication);t.after(()=>publication.dispose());
 const held=gate();f.reply('list_inbox_v1',f.page(11),200,held);const preparing=publication.prepare();await held.entered;active=false;held.release();
 assert.equal(await preparing,false);assert.equal(publication.controller.getSnapshot().phase,'ended');assert.equal(f.runtime.cookie.status,'ready');
});
