import test from 'node:test';
import assert from 'node:assert/strict';
import {mapNotificationResult} from '../../../src/contracts/PortalNotificationMapping.ts';
const api=await import('../src/features/notifications/model.ts').catch(e=>{if(e.code!=='ERR_MODULE_NOT_FOUND')throw e;return null;});
const id=n=>`10000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const event={eventId:id(1),createdAt:'2026-11-01T12:00:00Z',source:{kind:'publication',publicationVersion:3},destination:{kind:'plan_version',version:3}};
const page={schemaVersion:1,consistency:'live_keyset',observedAt:'2026-11-01T12:01:00Z',cursor:null,items:[{deliveryId:id(2),revision:0,seenAt:null,event,email:{status:'accepted',revision:1}}],nextCursor:'n:'+id(2)};
test('Root-mapped inbox gives a canonical publication destination, neutral copy and independent seen/email state',()=>{
 assert.ok(api,'notification presentation is missing');
 const p=mapNotificationResult(page,{schemaVersion:1,action:'list_inbox_v1',cursor:null,limit:50});
 const view=api.presentInbox(p);assert.equal(view.items[0].href,'/history/versions/3');assert.equal(view.items[0].title,'your plan is ready');assert.equal(view.items[0].portalLabel,'unread');assert.equal(view.items[0].email.label,'accepted');assert.match(view.items[0].email.detail,/delivery.*not confirmed/);
 assert.equal(view.observedAt,page.observedAt);assert.equal(view.nextCursor,page.nextCursor);assert.equal('total'in view,false);assert.equal('unreadCount'in view,false);assert.equal('complete'in view,false);
});
test('guidance uses the exact public history serializer; care/review never guess A07',()=>{
 assert.ok(api,'notification presentation is missing');
 for(const kind of ['review','instruction','reply']){const e={...event,source:{kind:'guidance',recordId:id(3),version:1,eventKind:kind+'_published'},destination:{kind:'public_history',recordKind:kind,recordId:id(3)}};const v=api.presentEvent(e);assert.equal(v.href,'/history/'+encodeURIComponent('public_'+kind+':'+id(3)));}
 for(const kind of ['care','review']){const e={...event,source:{kind,recordId:id(4),version:1,eventKind:kind==='care'?'use_reported':'goal_reported'},destination:{kind:'unavailable',reason:'advisor_review_resolution_unavailable'}};const v=api.presentEvent(e);assert.equal(v.href,null);assert.equal(v.missingInput,'advisor_review_resolution_unavailable');assert.doesNotMatch(JSON.stringify(v),/\/advisor\/reviews|10000000/);}
});
test('all seven email states retain their meanings and portal seen is never email open',()=>{
 assert.ok(api,'notification presentation is missing');
 for(const status of ['queued','claimed','uncertain','accepted','delivered','failed','bounced']){const e=api.presentEmail(status);assert.equal(e.label,status);assert.ok(e.detail.length>0);assert.equal(e.retryable,status==='failed');assert.doesNotMatch(e.detail,/read by|opened by/);}
 const v=api.presentInbox({...page,items:[{...page.items[0],seenAt:'2026-11-01T12:00:30Z',email:null}]});assert.equal(v.items[0].portalLabel,'seen');assert.equal(v.items[0].email,null);
});
test('presentation fails closed for private fields, swapped destinations, excessive pages and bad cursor',()=>{
 assert.ok(api,'notification presentation is missing');
 for(const invalid of [{...page,privateNote:'PRIVATE_CANARY'},{...page,items:[{...page.items[0],email:{status:'accepted',revision:1,address:'PRIVATE_CANARY'}}]},{...page,items:Array.from({length:51},()=>page.items[0])},{...page,nextCursor:'n:bad'}])assert.throws(()=>api.presentInbox(invalid));
 assert.throws(()=>api.presentEvent({...event,destination:{kind:'plan_version',version:4}}));
});
