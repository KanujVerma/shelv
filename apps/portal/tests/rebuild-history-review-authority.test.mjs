import {test} from 'node:test';import assert from 'node:assert/strict';
import {denialFixture,basis,history,uncertain,receipt,deferred,addNote,heldOriginal,fullDenial,displayedReturn,freshCommandRequiresReview,statusReceipt,writeCalls,observe} from './rebuild-history-review-authority-helper.mjs';
import {noop,uid,owner} from './rebuild-history-helper.mjs';
for(const operation of ['write','status'])for(const stage of ['plan','history'])test(`current full ${stage}403 retires older ${operation} ownership while retaining actual session and exact A`,async t=>{
 const f=await denialFixture(t),old=await heldOriginal(t,f,operation),boundary=f.runtime.getSnapshot().boundary;
 const identity={owner:f.runtime.cookie.identity.ownerId,generation:f.runtime.cookie.generation,epoch:f.runtime.cookie._epoch};
 await fullDenial(f,stage);const s=f.controller.getSnapshot();assert.equal(s.pending,old.pending);assert.equal(s.intent,old.intent);assert.equal(s.needsReview,true);assert.equal(s.checkingStatus,false);assert.equal(s.loadingMore,false);assert.equal(s.amendmentView,null);assert.equal(s.view,null);assert.deepEqual(s.pages,[]);
 assert.doesNotMatch(f.html(),/PRIVATE_HISTORY_|CURRENT_PRIVATE_PLAN/);assert.equal(f.runtime.getSnapshot().boundary,boundary);assert.equal(boundary.isCurrent(),true);assert.deepEqual({owner:f.runtime.cookie.identity.ownerId,generation:f.runtime.cookie.generation,epoch:f.runtime.cookie._epoch},identity);
 old.release();await old.work;assert.equal(f.controller.getSnapshot().pending,old.pending);assert.equal(JSON.stringify(f.controller.getSnapshot().pending),old.wire);assert.equal(f.controller.getSnapshot().receipt,null);assert.equal(f.controller.getSnapshot().mutation,'uncertain');assert.equal(f.controller.getSnapshot().needsReview,true);
 await observe(f,`full-${stage}-denial-old-${operation}`);
});
for(const operation of ['write','status'])for(const version of [1,2])test(`allowed old ${operation} receipt resolves A while preserving newer displayed review gate publication${version} without a denial`,async t=>{
 const f=await denialFixture(t),old=await heldOriginal(t,f,operation);const displayed=await displayedReturn(f,{version});
 old.release();await old.work;const s=f.controller.getSnapshot();
 assert.equal(s.pending,null);assert.equal(s.mutation,'confirmed');assert.equal(s.receipt.requestId,old.pending.requestId);assert.equal(s.view,displayed);assert.equal(s.needsReview,true,'receipt resolution is separate from current review acknowledgement');
 assert.equal(s.intent,old.intent);assert.equal(s.intent.body.publication.version,1);assert.match(f.html(f.controller,'update'),/current fetched record/);
 await observe(f,`allowed-old-${operation}-version${version}`);await freshCommandRequiresReview(f,old.pending,{version});
});
for(const denial of ['full','continuation'])for(const version of [1,2])test(`new deliberate positive status after ${denial}403 confirms A but preserves active publication${version} review before fresh UUID`,async t=>{
 const f=await denialFixture(t),old=await uncertain(f);
 if(denial==='full')await fullDenial(f);else{f.respond(c=>c.action==='read_care_history_v1'&&c.cursor?Response.json({code:'forbidden'},{status:403}):null);await f.controller.loadMore();}
 const displayed=await displayedReturn(f,{version});f.respond(c=>c.action==='request_status_v1'?statusReceipt(old.pending):null);const start=f.calls.length;await f.controller.checkStatus();
 const s=f.controller.getSnapshot();assert.equal(s.pending,null);assert.equal(s.mutation,'confirmed');assert.equal(s.receipt.requestId,old.pending.requestId);assert.equal(s.view,displayed);assert.equal(s.needsReview,true);
 assert.deepEqual(f.calls.slice(start).map(c=>c.command.action),['request_status_v1']);assert.equal(s.intent,old.intent);assert.equal(writeCalls(f).length,1);
 await observe(f,`new-status-${denial}-version${version}`);f.respond(null);await freshCommandRequiresReview(f,old.pending,{version});
});
for(const operation of ['write','status'])test(`full-history403 retired ${operation} cannot affect recovered active gate; a NEW status READ can still confirm A`,async t=>{
 const f=await denialFixture(t),old=await heldOriginal(t,f,operation);await fullDenial(f);const displayed=await displayedReturn(f);
 old.release();await old.work;assert.equal(f.controller.getSnapshot().pending,old.pending);assert.equal(f.controller.getSnapshot().view,displayed);assert.equal(f.controller.getSnapshot().needsReview,true);
 f.respond(c=>c.action==='request_status_v1'?statusReceipt(old.pending):null);await f.controller.checkStatus();assert.equal(f.controller.getSnapshot().pending,null);assert.equal(f.controller.getSnapshot().mutation,'confirmed');assert.equal(f.controller.getSnapshot().needsReview,true);
 await observe(f,`retired-${operation}-then-new-status`);f.respond(null);await freshCommandRequiresReview(f,old.pending);
});
test('positive status during read-only access resolves original A but cannot permit writes or erase the later active review',async t=>{
 const f=await denialFixture(t),old=await uncertain(f);await fullDenial(f);const v=basis(1,1);v.access='read_only';f.respond(null);f.data(v,history(1,1));await f.controller.load();
 f.respond(c=>c.action==='request_status_v1'?statusReceipt(old.pending):null);await f.controller.checkStatus();assert.equal(f.controller.getSnapshot().pending,null);assert.equal(f.controller.getSnapshot().mutation,'confirmed');assert.equal(f.controller.getSnapshot().needsReview,true);
 const count=f.calls.length;f.controller.startReport();await f.controller.submit();await f.controller.retryExact();assert.equal(f.calls.length,count);
 await displayedReturn(f,{readonly:false});await freshCommandRequiresReview(f,old.pending);
});
test('a new positive status after full denial resolves only A and leaves denial and deliberate gate intact',async t=>{
 const f=await denialFixture(t),old=await uncertain(f);await fullDenial(f);f.respond(c=>c.action==='request_status_v1'?statusReceipt(old.pending):null);await f.controller.checkStatus();
 const s=f.controller.getSnapshot();assert.equal(s.pending,null);assert.equal(s.receipt.requestId,old.pending.requestId);assert.equal(s.mutation,'confirmed');assert.equal(s.needsReview,true);assert.equal(s.phase,'denied');assert.equal(s.view,null);assert.deepEqual(s.pages,[]);assert.doesNotMatch(f.html(),/PRIVATE_HISTORY_|update recorded/);
 await displayedReturn(f,{readonly:false});await freshCommandRequiresReview(f,old.pending);
});
test('an immutable no-observation status preserves a newer review gate without saved-event fiction',async t=>{
 const f=await denialFixture(t);await f.controller.load();f.controller.startReport();addNote(f.controller,' \n\t ');f.respond(c=>c.action==='submit_goal_report_v1'?Response.json({code:'unavailable'},{status:503}):null);await f.controller.submit();await f.runtime.restore();const old=f.controller.getSnapshot().pending;
 await displayedReturn(f,{head:0});f.respond(c=>c.action==='request_status_v1'?Response.json({status:'committed',receipt:noop(old)}):null);await f.controller.checkStatus();const s=f.controller.getSnapshot();
 assert.equal(s.pending,null);assert.equal(s.mutation,'no_observation');assert.equal(s.receipt.event,null);assert.equal(s.receipt.notificationEventId,null);assert.equal(s.receipt.attentionEventId,null);assert.equal(s.needsReview,true);assert.equal(s.receipt.revision,0);
 f.respond(null);await freshCommandRequiresReview(f,old,{head:0});
});
for(const operation of ['write','status'])test(`operation-specific ${operation}403 preserves readable history instead of retiring all history authority`,async t=>{
 const f=await denialFixture(t);await f.controller.load();
 if(operation==='status'){await uncertain(f);f.respond(c=>c.action==='request_status_v1'?Response.json({code:'forbidden'},{status:403}):null);await f.controller.checkStatus();assert.ok(f.controller.getSnapshot().pending);}
 else{f.controller.startReport();addNote(f.controller);f.respond(c=>c.action==='submit_goal_report_v1'?Response.json({code:'forbidden'},{status:403}):null);await f.controller.submit();assert.equal(f.controller.getSnapshot().mutation,'denied');}
 assert.equal(f.controller.getSnapshot().phase,'ready');assert.match(f.html(),/PRIVATE_HISTORY_CONCLUSION/);assert.equal(f.boundary.isCurrent(),true);
});
test('superseded full-read403 cannot deny a newer held current view or release its owner',async t=>{
 const f=await denialFixture(t),old=await uncertain(f),denied=deferred(),entered=deferred(),next=deferred(),nextEntered=deferred();let count=0;
 t.after(()=>{denied.resolve(Response.json({code:'forbidden'},{status:403}));next.resolve(Response.json(basis()));});
 f.respond(c=>{if(c.action==='read_care_history_v1'&&++count===1){entered.resolve();return denied.promise;}if(c.action==='read_client_plan_v3'&&count){nextEntered.resolve();return next.promise;}return null;});
 const prior=f.controller.load();await entered.promise;const newer=f.controller.load();await nextEntered.promise;denied.resolve(Response.json({code:'forbidden'},{status:403}));await prior;
 assert.equal(f.controller.getSnapshot().phase,'loading');assert.equal(f.controller.getSnapshot().readError,false);assert.equal(f.controller.getSnapshot().pending,old.pending);next.resolve(Response.json(basis()));await newer;assert.equal(f.controller.getSnapshot().phase,'ready');assert.equal(f.controller.getSnapshot().readError,false);
});
