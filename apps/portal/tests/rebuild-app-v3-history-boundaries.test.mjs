import test from 'node:test';
import assert from 'node:assert/strict';
import {createClientComposition} from '../src/app/client-composition.ts';
import {createClientPlanController} from '../src/app/client-state.ts';
import {session,view,page,uid,owner,receipt,renderer,renderClient} from './rebuild-app-v3-history-helper.mjs';
import {readReviewCommand} from '../../../src/contracts/PortalReviewValidation.ts';
import {mapReviewResult} from '../../../src/contracts/PortalReviewMapping.ts';
const m=await renderer();
const read={schemaVersion:1,action:'read_client_plan_v3',version:null};
for(const status of [403,409,503])test('V3 direct care URLs preserve CA1 initial '+status+' retry and no blank form',async t=>{
 const f=await session(t,()=>Response.json({code:status===403?'forbidden':status===409?'revision_conflict':'unavailable'},{status})),c=createClientComposition(f.runtime);t.after(()=>c.dispose());await c.controller.refresh();
 assert.equal(c.controller.getSnapshot().error,status);
 for(const route of [{name:'report-use',routine:'evening'},{name:'product-use',productId:'cerave-pm',routine:'evening'}]){const html=renderClient(m,{...c,boundary:f.runtime.getSnapshot().boundary},route);assert.ok(html.includes('try again'));assert.ok(html.includes('record actual use'));assert.ok(!html.includes('<form'));assert.ok(!html.includes('notifications</h1>'));}
 assert.ok(f.calls.every(v=>v.url==='/api/client/reviews'));
});
for(const bad of [v=>({...v,privateNotes:'PRIVATE_CANARY'}),v=>({...v,currentGuidance:undefined}),v=>({...v,schemaVersion:2})])test('Root positive validation refuses malformed V3 without older channel fallback '+bad.toString(),async t=>{
 const f=await session(t,()=>bad(view())),c=createClientComposition(f.runtime);t.after(()=>c.dispose());await c.controller.refresh();assert.equal(c.controller.getSnapshot().error,503);assert.equal(c.controller.getSnapshot().view,null);assert.deepEqual(f.calls.map(v=>v.url),['/api/client/reviews']);
});
test('narrow Review capability rejects Care/advisor/report commands before egress',async t=>{
 const f=await session(t),c=createClientComposition(f.runtime);t.after(()=>c.dispose());
 for(const command of [{...read,clientId:uid(9)},{schemaVersion:1,action:'read_advisor_review_context_v1',clientId:owner},{schemaVersion:1,action:'submit_goal_report_v1'}, {...read,action:'read_client_plan_v2'}])await assert.rejects(c.ports.review.execute(command),e=>[400,403].includes(e.status));assert.equal(f.calls.length,0);
});
for(const change of [{ownerId:uid(30)},{csrf:'new-source-csrf'},{generation:2}])test('actual creation boundary refuses old ports after '+Object.keys(change)[0]+' replacement',async t=>{
 const f=await session(t),c=createClientComposition(f.runtime);t.after(()=>c.dispose());await c.controller.refresh();const old=f.runtime.getSnapshot().boundary;old.memory.set('unsent','PRIVATE_CANARY');f.login(change);await f.runtime.restore();assert.equal(old.isCurrent(),false);assert.equal(old.memory.get('unsent'),undefined);const count=f.calls.length;await assert.rejects(c.ports.review.execute(read),e=>e.status===401);await c.history.load();assert.equal(f.calls.length,count);assert.equal(c.controller.getSnapshot().view,null);
});
test('natural expiry clears actual session and owner-derived plan/history without an auth test service',async t=>{
 const f=await session(t),c=createClientComposition(f.runtime);t.after(()=>c.dispose());await c.controller.refresh();await c.history.load();const b=f.runtime.getSnapshot().boundary;b.memory.set('private','PRIVATE_CANARY');f.expire();assert.equal(b.isCurrent(),false);assert.equal(c.controller.getSnapshot().view,null);assert.equal(c.history.getSnapshot().phase,'ended');assert.equal(b.memory.get('private'),undefined);
});
test('logout fences a held actual Review result and clears both controllers before settlement',async t=>{
 let release,enter;const entered=new Promise(r=>enter=r),held=new Promise(r=>release=r);const f=await session(t,async()=>{enter();await held;return view();}),c=createClientComposition(f.runtime);t.after(()=>c.dispose());const pending=c.controller.refresh();await entered;await f.runtime.signOut();release();await pending;assert.equal(c.controller.getSnapshot().view,null);assert.equal(c.controller.getSnapshot().ended,true);assert.equal(c.history.getSnapshot().phase,'ended');
});
test('old displayed callback and reverse read completion cannot replace newly fetched canonical authority',async t=>{
 const f=await session(t),c=createClientComposition(f.runtime);t.after(()=>c.dispose());await c.controller.refresh();const original=c.controller.getSnapshot().view,accept=c.controller.acceptFrom(original);await c.controller.refresh();const current=c.controller.getSnapshot().view;accept(original);assert.equal(c.controller.getSnapshot().view,current);
 const supplied=view();const b=f.runtime.getSnapshot().boundary;const standalone=createClientPlanController(b,{...c.ports,review:{execute:async()=>supplied}},{readVersion:3});t.after(()=>standalone.dispose());await standalone.refresh();assert.equal(standalone.getSnapshot().view,supplied);
});
test('Care Stop carries only actual supported factual semantics, independent of identity/photo/order/payment',async t=>{
 const command={schemaVersion:1,action:'report_product_use_v1',requestId:uid(40),expectedUseRevision:0,product:{kind:'plan_product',publication:{version:1,documentSchemaVersion:3},productId:'cerave-pm',slotId:null},change:{kind:'stopped',details:null},sourcePublication:null,occurredOn:{state:'unknown'},channel:'portal',acquisition:'already_owned',identityEventId:null};
 const f=await session(t,()=>({requestId:command.requestId,event:{kind:'use',id:uid(41)},revision:1,recordedAt:'2026-10-31T12:00:00Z',notificationEventId:null})),c=createClientComposition(f.runtime);t.after(()=>c.dispose());const result=await c.ports.care.execute(command);assert.equal(result.revision,1);assert.equal(f.calls[0].url,'/api/client/care');assert.deepEqual(f.calls[0].command,command);
});
test('History current403 retires view/owners; old exact status resolves its wire without releasing the newer review gate',async t=>{
 const f=await session(t),c=createClientComposition(f.runtime);t.after(()=>c.dispose());await c.history.load();c.history.startReport();const intent=c.history.getSnapshot().intent;c.history.edit({...intent,body:{...intent.body,notes:'PRIVATE_UNSENT'}});f.set(()=>Response.json({code:'unavailable'},{status:503}));await c.history.submit();const pending=c.history.getSnapshot().pending,wire=JSON.stringify(pending);assert.ok(pending);await f.runtime.restore();
 f.set(()=>Response.json({code:'forbidden'},{status:403}));await c.history.load();let s=c.history.getSnapshot();assert.equal(s.phase,'denied');assert.equal(s.view,null);assert.equal(s.amendmentView,null);assert.deepEqual(s.pages,[]);assert.equal(JSON.stringify(s.pending),wire);assert.equal(s.needsReview,true);
 f.set(c=>c.action==='request_status_v1'?{status:'committed',receipt:receipt(pending)}:c.action==='read_client_plan_v3'?view():page());await c.history.checkStatus();s=c.history.getSnapshot();assert.equal(s.pending,null);assert.equal(s.mutation,'confirmed');assert.equal(s.needsReview,true);assert.equal(s.view,null);const count=f.calls.length;await c.history.submit();assert.equal(f.calls.length,count);
});
test('History source correction retains original publication/goals/photos and amendment head through actual request factory',async t=>{
 const old=view();old.currentGuidance.snapshot.currentPublication.version=2;old.currentGuidance.mode='historical_document';old.plan.content.goals=[{id:'original-goal',text:'Original public goal',factIds:[]}];
 const report={kind:'goal_report',id:uid(50),body:{publication:{version:1,documentSchemaVersion:3},answers:[{goalId:'original-goal',change:'same'}],comfort:'original comfort',actualUseEventIds:[],notes:'ORIGINAL_BODY',photoIds:[uid(51)]},occurredOn:{state:'unknown'},channel:'portal',reportedBy:owner,recordedBy:owner,recordedAt:'2026-10-30T12:00:00Z'};
 const p=page();p.entries=[{kind:'report',event:report}];const current=view();current.plan.version=2;current.currentGuidance.snapshot.publication.version=2;current.currentGuidance.snapshot.currentPublication.version=2;current.use.planProducts.forEach(v=>v.product.publication.version=2);p.heads.publicationVersion=2;
 const f=await session(t,c=>c.action==='read_client_plan_v3'?c.version===1?old:current:c.action==='amend_report_v1'?receipt(c):p),c=createClientComposition(f.runtime);t.after(()=>c.dispose());await c.history.load();await c.history.startAmendment(report);let s=c.history.getSnapshot();assert.equal(s.phase,'ready');assert.equal(s.amendmentView.plan.content.goals[0].id,'original-goal');assert.equal(s.intent.original.body.publication.version,1);assert.deepEqual(s.intent.retainedPhotoIds,[uid(51)]);assert.equal(s.intent.expectedAmendmentHeadId,null);
 c.history.edit({...s.intent,reason:'clarify original',replacement:{...s.intent.replacement,body:{...s.intent.replacement.body,notes:'APPENDED_CORRECTION'}}});await c.history.submit();const sent=f.calls.find(v=>v.command.action==='amend_report_v1').command;readReviewCommand(sent);assert.equal(sent.replacement.body.publication.version,1);assert.deepEqual(sent.replacement.body.photoIds,[uid(51)]);assert.equal(sent.expectedAmendmentHeadId,null);assert.ok(!JSON.stringify(sent).includes('clientId'));assert.equal(c.history.getSnapshot().mutation,'confirmed');
});
test('History cursor requests and version filter remain canonical, with no cursor in semantic URLs',async t=>{
 const p=page();p.entries=[{kind:'publication',publication:{version:1,documentSchemaVersion:3},publishedAt:'2026-10-31T12:00:00Z',recordedBy:owner}];p.nextCursor='r:'+'b'.repeat(64)+':'+uid(60);let pages=0;const f=await session(t,c=>{if(c.action==='read_client_plan_v3')return view();const out={...p,version:c.version};if(pages++){out.nextCursor=null;out.entries=[];}return out;}),c=createClientComposition(f.runtime);t.after(()=>c.dispose());await c.history.load(1);await c.history.loadMore();assert.equal(c.history.getSnapshot().pages.length,2);assert.deepEqual(f.calls.filter(v=>v.command.action==='read_care_history_v1').map(v=>[v.command.version,v.command.cursor]),[[1,null],[1,p.nextCursor]]);
});
