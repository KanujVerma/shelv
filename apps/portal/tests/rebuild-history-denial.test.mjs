import {test} from 'node:test';
import assert from 'node:assert/strict';
import {denialFixture,basis,history,addNote,uncertain,denyContinuation,uid,owner,receipt,deferred} from './rebuild-history-denial-helper.mjs';
function hidden(f,c=f.controller){
  const s=c.getSnapshot();assert.equal(s.phase,'denied');assert.equal(s.view,null);assert.deepEqual(s.pages,[]);assert.equal(s.amendmentView,null);
  assert.match(f.html(c),/record access denied/);assert.match(f.html(c),/retry current record/);
  for(const screen of ['history','update'])assert.doesNotMatch(f.html(c,screen),/PRIVATE_HISTORY_|CURRENT_PRIVATE_PLAN|RH1_UNSENT_NOTE|<form/);
}
async function beganReview(work,entered){
  assert.equal(await Promise.race([entered.promise.then(()=>true),work.then(()=>false)]),true,'deliberate retry must start a current-authority recheck before a mutation can finish');
}
for(const hasIntent of [false,true])test(`current continuation403 retires every readable projection; unsent intent ${hasIntent} and actual cookie survive`,async t=>{
  const f=await denialFixture(t);await f.controller.load();if(hasIntent){f.controller.startReport();addNote(f.controller);}
  const intent=f.controller.getSnapshot().intent,boundary=f.runtime.getSnapshot().boundary;
  const identity={owner:f.runtime.cookie.identity.ownerId,generation:f.runtime.cookie.generation,epoch:f.runtime.cookie._epoch};
  await denyContinuation(f);hidden(f);assert.equal(f.controller.getSnapshot().intent,intent);
  assert.equal(f.runtime.cookie.status,'ready');assert.equal(f.runtime.getSnapshot().boundary,boundary);assert.equal(boundary.isCurrent(),true);
  assert.deepEqual({owner:f.runtime.cookie.identity.ownerId,generation:f.runtime.cookie.generation,epoch:f.runtime.cookie._epoch},identity);
  const before=f.calls.length;await f.controller.submit();await f.controller.retryExact();assert.equal(f.calls.length,before);assert.equal(f.uuidCalls(),0);
});
test('current continuation403 preserves exact uncertain object/wire/status through denied status reads and failed current refresh',async t=>{
  const f=await denialFixture(t),original=await uncertain(f);await denyContinuation(f);hidden(f);
  assert.equal(f.controller.getSnapshot().pending,original.pending);assert.equal(f.controller.getSnapshot().intent,original.intent);assert.equal(f.controller.getSnapshot().mutation,'uncertain');
  for(const [status,code] of [[403,'forbidden'],[409,'revision_conflict'],[503,'unavailable']]){
    f.respond(()=>Response.json({code},{status}));await f.controller.checkStatus();
    assert.equal(f.controller.getSnapshot().pending,original.pending);assert.equal(JSON.stringify(f.controller.getSnapshot().pending),original.wire);assert.equal(f.controller.getSnapshot().mutation,'uncertain');
    if(status===503)await f.runtime.restore();
  }
  f.respond(()=>Response.json({status:'absent'}));await f.controller.checkStatus();assert.equal(f.controller.getSnapshot().pending,original.pending);
  f.respond(()=>Response.json({code:'unavailable'},{status:503}));await f.controller.load();await f.runtime.restore();
  assert.equal(f.controller.getSnapshot().phase,'error');assert.equal(f.controller.getSnapshot().pending,original.pending);
  const before=f.calls.length;await f.controller.retryExact();await f.controller.submit();assert.equal(f.calls.length,before);assert.equal(f.uuidCalls(),1);
});
test('fresh displayed current authority plus deliberate stable recheck retries the original wire once without rebasing it',async t=>{
  const f=await denialFixture(t),original=await uncertain(f);await denyContinuation(f);
  f.respond(null);f.data(basis(2,1,'DISPLAYED_CURRENT_AUTHORITY'),history(2,1));await f.controller.load();
  assert.match(f.html(f.controller,'update'),/DISPLAYED_CURRENT_AUTHORITY/);assert.equal(f.controller.getSnapshot().needsReview,true);
  const displayed=f.controller.getSnapshot().view,callStart=f.calls.length;
  f.respond(c=>c.action==='submit_goal_report_v1'?Response.json(receipt(c)):null);
  await f.controller.retryExact();
  assert.equal(f.controller.getSnapshot().mutation,'confirmed');assert.equal(f.controller.getSnapshot().view,displayed);
  const recovery=f.calls.slice(callStart);assert.deepEqual(recovery.map(c=>c.command.action),['read_client_plan_v3','read_care_history_v1','submit_goal_report_v1']);
  assert.equal(recovery.at(-1).wire,original.wire);assert.equal(recovery.at(-1).command.expectedReportRevision,0);assert.equal(recovery.at(-1).command.body.publication.version,1);
  assert.equal(f.controller.getSnapshot().intent.body.publication.version,1);assert.equal(f.uuidCalls(),1);
});
test('deliberate exact retry cannot accept unseen changed data discovered by its recheck',async t=>{
  const f=await denialFixture(t),original=await uncertain(f);await denyContinuation(f);f.respond(null);await f.controller.load();assert.match(f.html(f.controller,'update'),/CURRENT_PRIVATE_PLAN/);
  f.data(basis(2,1,'NEWLY_DISCOVERED_BASIS'),history(2,1));f.respond(c=>c.action==='submit_goal_report_v1'?Response.json(receipt(c)):null);
  await f.controller.retryExact();assert.equal(f.calls.filter(c=>c.command.action==='submit_goal_report_v1').length,1);assert.equal(f.controller.getSnapshot().needsReview,true);assert.equal(f.controller.getSnapshot().pending,original.pending);
  assert.match(f.html(f.controller,'update'),/NEWLY_DISCOVERED_BASIS/);
  await f.controller.retryExact();assert.equal(f.calls.filter(c=>c.command.action==='submit_goal_report_v1').length,2);assert.equal(f.calls.at(-1).wire,original.wire);assert.equal(f.uuidCalls(),1);
});
test('pending current-authority fetch cannot permit exact retry; read-only authority remains unable to write',async t=>{
  const f=await denialFixture(t),original=await uncertain(f);await denyContinuation(f);const held=deferred(),entered=deferred();
  f.respond(c=>{if(c.action==='read_client_plan_v3'){entered.resolve();return held.promise;}return null;});const read=f.controller.load();await entered.promise;
  const before=f.calls.length;await f.controller.retryExact();assert.equal(f.calls.length,before);assert.equal(f.controller.getSnapshot().pending,original.pending);
  const v=basis();v.access='read_only';held.resolve(Response.json(v));await read;
  assert.match(f.html(f.controller,'update'),/read-only record/);const after=f.calls.length;await f.controller.retryExact();await f.controller.submit();assert.equal(f.calls.length,after);assert.equal(f.controller.getSnapshot().pending,original.pending);
});
test('an exact retry recheck retired by a newer current read cannot write against the replacement view',async t=>{
  const f=await denialFixture(t),original=await uncertain(f);await denyContinuation(f);f.respond(null);await f.controller.load();const held=deferred(),entered=deferred();let first=true;
  f.respond(c=>{if(c.action==='read_client_plan_v3'&&first){first=false;entered.resolve();return held.promise;}return null;});const retry=f.controller.retryExact();await beganReview(retry,entered);
  await f.controller.load();const replacement=f.controller.getSnapshot().view;held.resolve(Response.json(basis()));await retry;
  assert.equal(f.controller.getSnapshot().view,replacement);assert.equal(f.controller.getSnapshot().pending,original.pending);assert.equal(f.controller.getSnapshot().needsReview,true);assert.equal(f.calls.filter(c=>c.command.action==='submit_goal_report_v1').length,1);
});
test('unmount during exact-retry review preserves session intent but cannot acknowledge/write on a replacement controller',async t=>{
  const f=await denialFixture(t),original=await uncertain(f);await denyContinuation(f);f.respond(null);await f.controller.load();const held=deferred(),entered=deferred();let first=true;
  f.respond(c=>{if(c.action==='read_client_plan_v3'&&first){first=false;entered.resolve();return held.promise;}return null;});const work=f.controller.retryExact();await beganReview(work,entered);
  f.controller.dispose();const next=f.make();await next.load();held.resolve(Response.json(basis()));await work;
  assert.equal(f.controller.getSnapshot().pending,null);assert.equal(next.getSnapshot().needsReview,true);assert.equal(JSON.stringify(next.getSnapshot().pending),original.wire);assert.equal(f.calls.filter(c=>c.command.action==='submit_goal_report_v1').length,1);
});
test('superseded continuation403 cannot deny or release a held newer read and its exact pending intent',async t=>{
  const f=await denialFixture(t),original=await uncertain(f),old=deferred(),oldEntered=deferred(),next=deferred(),nextEntered=deferred();let newer=false;
  f.respond(c=>{if(c.action==='read_care_history_v1'&&c.cursor){oldEntered.resolve();return old.promise;}if(c.action==='read_client_plan_v3'&&newer){nextEntered.resolve();return next.promise;}return null;});
  const prior=f.controller.loadMore();await oldEntered.promise;newer=true;const current=f.controller.load();await nextEntered.promise;old.resolve(Response.json({code:'forbidden'},{status:403}));await prior;
  assert.equal(f.controller.getSnapshot().phase,'loading');assert.equal(f.controller.getSnapshot().readError,false);assert.equal(f.controller.getSnapshot().pending,original.pending);
  next.resolve(Response.json(basis()));await current;assert.equal(f.controller.getSnapshot().phase,'ready');assert.equal(f.controller.getSnapshot().readError,false);assert.equal(f.controller.getSnapshot().pending,original.pending);
});
test('current denial retires a held write acknowledgement without dropping its original uncertain wire',async t=>{
  const f=await denialFixture(t);await f.controller.load();f.controller.startReport();addNote(f.controller);const held=deferred(),entered=deferred();let command;
  f.respond(c=>{if(c.action==='submit_goal_report_v1'){command=c;entered.resolve();return held.promise;}if(c.action==='read_care_history_v1'&&c.cursor)return Response.json({code:'forbidden'},{status:403});return null;});
  const write=f.controller.submit();await entered.promise;const pending=f.controller.getSnapshot().pending,wire=JSON.stringify(pending);await f.controller.loadMore();held.resolve(Response.json(receipt(command)));await write;
  hidden(f);assert.equal(f.controller.getSnapshot().pending,pending);assert.equal(JSON.stringify(f.controller.getSnapshot().pending),wire);assert.equal(f.controller.getSnapshot().mutation,'uncertain');assert.equal(f.controller.getSnapshot().receipt,null);
});
test('current denial retires a held status receipt and releases only its obsolete checking ownership',async t=>{
  const f=await denialFixture(t),original=await uncertain(f),held=deferred(),entered=deferred();
  f.respond(c=>{if(c.action==='request_status_v1'){entered.resolve();return held.promise;}if(c.action==='read_care_history_v1'&&c.cursor)return Response.json({code:'forbidden'},{status:403});return null;});
  const status=f.controller.checkStatus();await entered.promise;await f.controller.loadMore();assert.equal(f.controller.getSnapshot().checkingStatus,false);held.resolve(Response.json({status:'committed',receipt:receipt(original.pending)}));await status;
  hidden(f);assert.equal(f.controller.getSnapshot().pending,original.pending);assert.equal(f.controller.getSnapshot().receipt,null);assert.equal(f.controller.getSnapshot().mutation,'uncertain');
});
for(const status of [503,409])test(`continuation${status} still retains the readable loaded snapshot and incomplete write gate`,async t=>{
  const f=await denialFixture(t);await f.controller.load();f.controller.startReport();addNote(f.controller);f.respond(()=>Response.json({code:status===409?'cursor_conflict':'unavailable'},{status}));await f.controller.loadMore();
  assert.equal(f.controller.getSnapshot().phase,'ready');assert.ok(f.controller.getSnapshot().view);assert.equal(f.controller.getSnapshot().pages.length,1);assert.match(f.html(),/PRIVATE_HISTORY_CONCLUSION/);assert.match(f.html(),/history is incomplete/);
  const before=f.calls.length;await f.controller.submit();assert.equal(f.calls.length,before);assert.equal(f.uuidCalls(),0);
});
test('denial clears a loaded original-publication detail while preserving the unsent append-only correction',async t=>{
  const f=await denialFixture(t),p=history(1,1),v=basis(1,1);
  const original={kind:'goal_report',id:uid(140),body:{publication:{version:1,documentSchemaVersion:3},answers:[],comfort:null,actualUseEventIds:[],notes:'PRIVATE_ORIGINAL_DETAIL',photoIds:[uid(141)]},occurredOn:{state:'unknown'},channel:'portal',reportedBy:owner,recordedBy:owner,recordedAt:'2026-10-20T00:00:00Z'};
  p.entries.push({kind:'report',event:original});p.nextCursor=null;f.data(v,p);await f.controller.load();await f.controller.startAmendment(original);
  assert.ok(f.controller.getSnapshot().amendmentView);const intent=f.controller.getSnapshot().intent;
  p.nextCursor=`r:${'a'.repeat(64)}:${uid(800)}`;await f.controller.load();assert.ok(f.controller.getSnapshot().amendmentView);
  await denyContinuation(f);hidden(f);assert.equal(f.controller.getSnapshot().intent,intent);assert.equal(f.controller.getSnapshot().amendmentView,null);
  assert.doesNotMatch(f.html(f.controller,'update'),/PRIVATE_ORIGINAL_DETAIL/);assert.deepEqual(intent.replacement.body.photoIds,[uid(141)]);
});
test('unsent work without a pending command requires a successful displayed current fetch and deliberate review before a new UUID',async t=>{
  const f=await denialFixture(t);await f.controller.load();f.controller.startReport();addNote(f.controller);await denyContinuation(f);
  f.respond(null);f.data(basis(2,1,'REAUTHORIZED_DISPLAY'),history(2,1));await f.controller.load();assert.match(f.html(f.controller,'update'),/REAUTHORIZED_DISPLAY/);
  const before=f.calls.length;await f.controller.submit();assert.equal(f.calls.length,before);assert.equal(f.uuidCalls(),0);
  await f.controller.reviewCurrent();assert.equal(f.controller.getSnapshot().needsReview,false);f.respond(c=>c.action==='submit_goal_report_v1'?Response.json(receipt(c)):null);await f.controller.submit();
  assert.equal(f.uuidCalls(),1);assert.equal(f.calls.at(-1).command.body.notes,'RH1_UNSENT_NOTE');assert.equal(f.calls.at(-1).command.body.publication.version,2);assert.equal(f.calls.at(-1).command.expectedReportRevision,1);
});
for(const mode of ['historical','advisor-preview','public-demo','private-walkthrough'])test(`retiring a pending retry recheck into ${mode} cannot release a write or acknowledge private state`,async t=>{
  const f=await denialFixture(t),original=await uncertain(f);await denyContinuation(f);f.respond(null);await f.controller.load();const held=deferred(),entered=deferred();let first=true;
  f.respond(c=>{if(c.action==='read_client_plan_v3'&&first){first=false;entered.resolve();return held.promise;}return null;});const work=f.controller.retryExact();await beganReview(work,entered);
  f.controller.setContext({...f.context(),mode});held.resolve(Response.json(basis()));await work;
  assert.equal(f.controller.getSnapshot().phase,'idle');assert.equal(f.controller.getSnapshot().pending,original.pending);assert.equal(f.controller.getSnapshot().needsReview,true);assert.equal(f.calls.filter(c=>c.command.action==='submit_goal_report_v1').length,1);assert.doesNotMatch(f.html(f.controller,'update'),/RH1_UNSENT_NOTE|<form/);
});
test('actual CSRF replacement during a retry recheck still ends the obsolete feature and suppresses its late write',async t=>{
  const f=await denialFixture(t);await uncertain(f);await denyContinuation(f);f.respond(null);await f.controller.load();const held=deferred(),entered=deferred();let first=true;
  f.respond(c=>{if(c.action==='read_client_plan_v3'&&first){first=false;entered.resolve();return held.promise;}return null;});const work=f.controller.retryExact();await beganReview(work,entered);
  f.login({csrf:'replacement-rh1-csrf'});await f.runtime.restore();held.resolve(Response.json(basis()));await work;
  assert.equal(f.controller.getSnapshot().phase,'ended');assert.equal(f.controller.getSnapshot().pending,null);assert.equal(f.controller.getSnapshot().intent,null);assert.equal(f.calls.filter(c=>c.command.action==='submit_goal_report_v1').length,1);
});
for(const status of [403,503])test(`a failed${status} recheck of displayed authority cannot acknowledge or resend the original mutation`,async t=>{
  const f=await denialFixture(t),original=await uncertain(f);await denyContinuation(f);f.respond(null);await f.controller.load();assert.match(f.html(f.controller,'update'),/CURRENT_PRIVATE_PLAN/);
  f.respond(()=>Response.json({code:status===403?'forbidden':'unavailable'},{status}));await f.controller.retryExact();
  assert.equal(f.controller.getSnapshot().pending,original.pending);assert.equal(f.controller.getSnapshot().needsReview,true);assert.equal(f.controller.getSnapshot().mutation,'uncertain');assert.equal(f.calls.filter(c=>c.command.action==='submit_goal_report_v1').length,1);assert.doesNotMatch(f.html(f.controller,'update'),/CURRENT_PRIVATE_PLAN|RH1_UNSENT_NOTE|<form/);
  if(status===403)hidden(f);else assert.equal(f.controller.getSnapshot().phase,'error');
});
test('positive immutable request status resolves as READ without clinical acknowledgement or restoring denied history',async t=>{
  const f=await denialFixture(t),original=await uncertain(f);await denyContinuation(f);f.respond(c=>c.action==='request_status_v1'?Response.json({status:'committed',receipt:receipt(original.pending)}):null);await f.controller.checkStatus();
  assert.equal(f.controller.getSnapshot().phase,'denied');assert.equal(f.controller.getSnapshot().view,null);assert.deepEqual(f.controller.getSnapshot().pages,[]);assert.equal(f.controller.getSnapshot().pending,null);assert.equal(f.controller.getSnapshot().mutation,'confirmed');
  const before=f.calls.length;await f.controller.submit();await f.controller.retryExact();assert.equal(f.calls.length,before);assert.equal(f.calls.filter(c=>c.command.action==='submit_goal_report_v1').length,1);assert.doesNotMatch(f.html(),/PRIVATE_HISTORY_CONCLUSION/);
});
test('a retired original-publication detail read cannot repopulate the denied projection after current403',async t=>{
  const f=await denialFixture(t),p=history(1,1),v=basis(1,1);
  const original={kind:'goal_report',id:uid(150),body:{publication:{version:1,documentSchemaVersion:3},answers:[],comfort:null,actualUseEventIds:[],notes:'PRIVATE_LATE_DETAIL',photoIds:[]},occurredOn:{state:'unknown'},channel:'portal',reportedBy:owner,recordedBy:owner,recordedAt:'2026-10-20T00:00:00Z'};
  p.entries.push({kind:'report',event:original});p.nextCursor=null;f.data(v,p);await f.controller.load();await f.controller.startAmendment(original);
  const held=deferred(),entered=deferred();p.nextCursor=`r:${'a'.repeat(64)}:${uid(800)}`;
  f.respond(c=>{if(c.action==='read_client_plan_v3'&&c.version===1){entered.resolve();return held.promise;}if(c.action==='read_care_history_v1'&&c.cursor)return Response.json({code:'forbidden'},{status:403});return null;});
  const reload=f.controller.load();await entered.promise;await f.controller.loadMore();hidden(f);held.resolve(Response.json(v));await reload;hidden(f);assert.equal(f.controller.getSnapshot().intent.original.id,original.id);
});
