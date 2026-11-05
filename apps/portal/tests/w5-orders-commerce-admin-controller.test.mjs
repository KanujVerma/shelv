import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture,load,client,other,draftId,draft,body,line,index,detail,components,snapshot,deferred,receipt} from './w5-orders-commerce-admin-helper.mjs';
const module=await load('apps/portal/src/features/orders/admin/controller.ts').catch(error=>{if(error.code==='ERR_MODULE_NOT_FOUND'&&error.url?.endsWith('/orders/admin/controller.ts'))return {};throw error;});
function create(options){assert.equal(typeof module.createProductQuoteAdminController,'function','missing session-bound product quote controller');return module.createProductQuoteAdminController(options);}
async function opened(t){const f=await fixture(t),c=create({runtime:f.runtime,clientId:client,request:f.request});t.after(()=>c.dispose());await c.refresh();await c.openDraft(draftId);return {...f,c};}
const readReply=c=>c.action==='read_advisor_commerce_v1'?index():c.action==='read_advisor_commerce_detail_v1'?detail():components(c);
async function reached(promise){let timer;try{return await Promise.race([promise,new Promise((_resolve,reject)=>{timer=setTimeout(()=>reject(Error('expected raw request was not dispatched')),2000);})]);}finally{clearTimeout(timer);}}

test('absent fixed request stays unavailable and never infers empty or dispatches',async t=>{
 const f=await fixture(t),c=create({runtime:f.runtime,clientId:client});t.after(()=>c.dispose());await c.refresh();c.newDraft();await c.saveDraft();assert.equal(c.getSnapshot().phase,'unavailable');assert.equal(f.calls.length,0);assert.equal(c.getSnapshot().index,null);
});
test('strict session-bound read selects exact draft without any write or local readiness claim',async t=>{
 const f=await opened(t),s=f.c.getSnapshot();assert.equal(s.phase,'ready');assert.deepEqual(s.loaded.draft,draft());assert.equal(s.dirty,false);assert.equal(s.reviewed,false);assert.equal(f.calls.every(x=>x.command.action.startsWith('read_')),true);assert.equal(Object.isFrozen(s.loaded.draft.target),true);
});
test('local edits retain explicit zero and create no financial record',async t=>{
 const f=await opened(t),prior=f.calls.length,edited=body();edited.note='local unsent note';assert.equal(f.c.setBody(edited),true);assert.equal(f.c.getSnapshot().dirty,true);assert.equal(f.c.getSnapshot().preparation.body.note,'local unsent note');assert.equal(f.calls.length,prior);edited.note='caller mutation';assert.equal(f.c.getSnapshot().preparation.body.note,'local unsent note');
});
test('foreign client result retires projection rather than manufacturing a client-free editor',async t=>{
 const f=await fixture(t),c=create({runtime:f.runtime,clientId:other,request:f.request});t.after(()=>c.dispose());await c.refresh();assert.notEqual(c.getSnapshot().phase,'ready');assert.equal(c.getSnapshot().index,null);assert.equal(c.getSnapshot().loaded,null);await c.saveDraft();assert.equal(f.calls.length,1);
});
test('save ACK is immutable and cannot auto-issue, publish or grant a current draft',async t=>{
 const f=await opened(t);f.c.setBody({...body(),note:'deliberately saved'});f.setReply(async c=>c.action.startsWith('read_')?Response.json(readReply(c)):Response.json(await receipt(c)));
 await f.c.saveDraft();const s=f.c.getSnapshot();assert.equal(s.pending,null);assert.equal(s.receipt.action,'save_product_quote_draft_v1');assert.equal(s.receipt.entity.revision,8);assert.equal(s.phase,'conflict','stale canonical7 cannot become current after ACK8');assert.equal(s.reviewed,false);assert.equal(f.calls.filter(x=>!x.command.action.startsWith('read_')).length,1);
});
test('uncertain save preserves exact UUID/wire/hash across read and explicit original retry',async t=>{
 const f=await opened(t);let writes=0;f.setReply(async c=>c.action.startsWith('read_')?Response.json(readReply(c)):c.action==='request_status_v1'?Response.json({status:'absent'}):++writes===1?Response.json({code:'uncertain'},{status:503}):Response.json(await receipt(c)));
 await f.c.saveDraft();const original=f.c.getSnapshot().pending;assert.equal(original.phase,'uncertain');const first=f.calls.find(x=>x.command.action==='save_product_quote_draft_v1');await f.runtime.restore();await f.c.refresh();assert.equal(f.c.getSnapshot().pending.requestId,original.requestId);await f.c.checkStatus();assert.equal(f.c.getSnapshot().pending.status,'absent');await f.c.retryOriginal();const attempts=f.calls.filter(x=>x.command.action==='save_product_quote_draft_v1');assert.equal(attempts.length,2);assert.equal(attempts[0].wire,attempts[1].wire);assert.equal(attempts[1].wire,original.wire);assert.equal(f.c.getSnapshot().pending,null);assert.equal(f.c.getSnapshot().receipt.requestId,first.command.requestId);
});
test('a later quote read never resolves an original uncertain write',async t=>{
 const f=await opened(t);f.setReply(async c=>c.action.startsWith('read_')?Response.json(readReply(c)):Response.json({code:'uncertain'},{status:503}));await f.c.saveDraft();const original=f.c.getSnapshot().pending;await f.runtime.restore();await f.c.refresh();assert.equal(f.c.getSnapshot().pending.requestId,original.requestId);assert.equal(f.c.getSnapshot().receipt,null);assert.equal(f.c.reviewIssue(),false);
});
test('double submit while response is held emits only one original write',async t=>{
 const f=await opened(t),wait=deferred(),entered=deferred();let seen;f.setReply(async c=>{if(c.action.startsWith('read_'))return Response.json(readReply(c));seen=c;entered.release();return wait.promise;});const pending=f.c.saveDraft();await reached(entered.promise);await f.c.saveDraft();assert.equal(f.calls.filter(x=>x.command.action==='save_product_quote_draft_v1').length,1);wait.release(Response.json(await receipt(seen)));await pending;
});
test('same-session remount retains uncertain original but requires a new canonical read',async t=>{
 const f=await opened(t);f.setReply(async c=>c.action.startsWith('read_')?Response.json(readReply(c)):Response.json({code:'uncertain'},{status:503}));await f.c.saveDraft();const original=f.c.getSnapshot().pending;f.c.dispose();await f.runtime.restore();const c=create({runtime:f.runtime,clientId:client,request:f.request});t.after(()=>c.dispose());assert.equal(c.getSnapshot().pending.requestId,original.requestId);assert.equal(c.getSnapshot().loaded,null);assert.equal(c.reviewIssue(),false);
});
test('logout retires private state, edits and pending custody before a held ACK',async t=>{
 const f=await opened(t),wait=deferred(),entered=deferred();let seen;f.setReply(async c=>{seen=c;entered.release();return wait.promise;});const pending=f.c.saveDraft();await reached(entered.promise);f.setLogin({signedIn:false});await f.runtime.restore();assert.equal(f.c.getSnapshot().phase,'ended');assert.equal(f.c.getSnapshot().loaded,null);assert.equal(f.c.getSnapshot().pending,null);wait.release(Response.json(await receipt(seen)));await pending;assert.equal(f.c.getSnapshot().receipt,null);
});
test('denied read clears financial projections while retaining same-session original uncertainty',async t=>{
 const f=await opened(t);f.setReply(async()=>Response.json({code:'uncertain'},{status:503}));await f.c.saveDraft();const id=f.c.getSnapshot().pending.requestId;await f.runtime.restore();f.setReply(async()=>Response.json({code:'forbidden'},{status:403}));await f.c.refresh();assert.equal(f.c.getSnapshot().phase,'denied');assert.equal(f.c.getSnapshot().loaded,null);assert.equal(f.c.getSnapshot().index,null);assert.equal(f.c.getSnapshot().pending.requestId,id);
});
test('issue needs deliberate review of exact current complete draft and emits only canonical issue',async t=>{
 const f=await opened(t);assert.equal(f.c.getSnapshot().reviewed,false);await f.c.issueQuote();assert.equal(f.calls.some(x=>x.command.action==='issue_product_quote_v1'),false);assert.equal(f.c.reviewIssue(),true);f.setReply(async c=>c.action.startsWith('read_')?Response.json(readReply(c)):Response.json(await receipt(c)));await f.c.issueQuote();const command=f.calls.find(x=>x.command.action==='issue_product_quote_v1').command;assert.equal(command.expectedPaymentRevision,11);assert.deepEqual(command.target,draft().target);assert.equal(f.c.getSnapshot().receipt.quote.quoteVersion,1);assert.equal(Object.isFrozen(f.c.getSnapshot().receipt.quote),true);assert.equal(f.calls.some(x=>['publish_plan_v1','confirm_payment_v1','record_purchase_v2'].includes(x.command.action)),false);
});
test('edits invalidate issue review',async t=>{
 const f=await opened(t);assert.equal(f.c.reviewIssue(),true);f.c.setBody({...body(),note:'changed'});assert.equal(f.c.getSnapshot().reviewed,false);assert.equal(f.c.reviewIssue(),false);await f.c.issueQuote();assert.equal(f.calls.some(x=>x.command.action==='issue_product_quote_v1'),false);
});
test('dirty conflict preserves base/latest/proposed until deliberate use-latest choice',async t=>{
 const f=await opened(t);f.c.setBody({...body(),note:'unsent proposal'});const newer={...draft(),target:{...draft().target,revision:8,contentHash:'d'.repeat(64)},body:{...body(),note:'server latest'}};f.setReply(async c=>Response.json(c.action==='read_advisor_commerce_v1'?{...index(),entries:[{...index().entries[0],entity:{...index().entries[0].entity,revision:8}}]}:c.action==='read_advisor_commerce_detail_v1'?{...detail(),detail:newer}:{...components(c),quote:{kind:'draft',target:newer.target}}));
 await f.c.refresh();const s=f.c.getSnapshot();assert.equal(s.phase,'conflict');assert.equal(s.loaded.draft.body.note,null);assert.equal(s.latest.draft.body.note,'server latest');assert.equal(s.preparation.body.note,'unsent proposal');assert.equal(f.c.useLatest(),true);assert.equal(f.c.getSnapshot().preparation.body.note,'server latest');assert.equal(f.c.getSnapshot().dirty,false);
});

test('cancelling an undispatched original retry retains its earlier uncertainty',async t=>{
 const f=await opened(t);f.setReply(async c=>c.action.startsWith('read_')?Response.json(readReply(c)):Response.json({code:'uncertain'},{status:503}));await f.c.saveDraft();const original=f.c.getSnapshot().pending;await f.runtime.restore();
 const digest=crypto.subtle.digest,entered=deferred(),wait=deferred();crypto.subtle.digest=async function(...args){entered.release();await wait.promise;return digest.apply(this,args);};
 try{const pending=f.c.retryOriginal();await reached(entered.promise);await f.c.refresh();wait.release();await pending;const current=f.c.getSnapshot().pending;assert.ok(current,'original uncertainty cannot be cleared by cancelling only its retry');assert.equal(current.requestId,original.requestId);assert.equal(current.wire,original.wire);assert.equal(current.hash,original.hash);assert.equal(current.phase,'uncertain');assert.equal(f.calls.filter(x=>x.command.action==='save_product_quote_draft_v1').length,1);}
 finally{wait.release();crypto.subtle.digest=digest;}
});

test('offline transition during first hashing prevents new egress and manufactured custody',async t=>{
 const f=await opened(t),digest=crypto.subtle.digest,entered=deferred(),wait=deferred();crypto.subtle.digest=async function(...args){entered.release();await wait.promise;return digest.apply(this,args);};
 try{const pending=f.c.saveDraft();await reached(entered.promise);f.runtime.cookie.suspend();wait.release();await pending;assert.equal(f.calls.filter(x=>x.command.action==='save_product_quote_draft_v1').length,0);assert.equal(f.c.getSnapshot().pending,null);}
 finally{wait.release();crypto.subtle.digest=digest;}
});

test('complete empty receiving-option read cannot be upgraded by a ready-looking draft flag',async t=>{
 const f=await fixture(t),c=create({runtime:f.runtime,clientId:client,request:f.request});t.after(()=>c.dispose());f.setReply(async command=>Response.json(command.action==='read_advisor_quote_components_v1'&&command.component==='payment_options'?{...components(command),total:0,entries:[]}:readReply(command)));await c.refresh();await c.openDraft(draftId);assert.equal(c.reviewIssue(),false);await c.issueQuote();assert.equal(f.calls.some(x=>x.command.action==='issue_product_quote_v1'),false);
});

test('same-session remount retains unsent edits without treating the old base as current',async t=>{
 const f=await opened(t);f.c.setBody({...body(),note:'unsent across route'});f.c.dispose();const c=create({runtime:f.runtime,clientId:client,request:f.request});t.after(()=>c.dispose());assert.equal(c.getSnapshot().preparation.body.note,'unsent across route');assert.equal(c.getSnapshot().loaded,null);assert.equal(c.reviewIssue(),false);await c.refresh();assert.equal(c.getSnapshot().preparation.body.note,'unsent across route');assert.equal(c.getSnapshot().dirty,true);assert.equal(c.getSnapshot().phase,'ready');
});

test('saving one line reloads its actual new target without erasing other local edits',async t=>{
 const f=await opened(t);let current=draft(),currentLine=line(),snap=snapshot();
 const edited={...line(),unitPrice:{state:'known',value:{cents:1300,checkedOn:'2026-11-03'}}};assert.equal(f.c.setLine(edited),true);
 f.setReply(async command=>{
  if(command.action==='save_product_quote_line_v1'){current={...current,target:{...current.target,revision:8,contentHash:'d'.repeat(64)}};currentLine=command.body;snap={...snap,revision:20,hash:'d'.repeat(64)};return Response.json(await receipt(command));}
  return Response.json(command.action==='read_advisor_commerce_v1'?{...index(),snapshot:snap,entries:[{...index().entries[0],entity:{...index().entries[0].entity,revision:8}}]}:command.action==='read_advisor_commerce_detail_v1'?{...detail(),snapshot:snap,detail:current}:{...components(command),snapshot:snap,quote:{kind:'draft',target:current.target},...(command.component==='lines'?{entries:[currentLine]}:{})});
 });
 await f.c.saveLine('line-a');const state=f.c.getSnapshot();assert.equal(state.phase,'ready');assert.equal(state.loaded.draft.target.revision,8);assert.equal(state.preparation.lines[0].unitPrice.value.cents,1300);assert.equal(state.dirty,false);assert.equal(state.reviewed,false);assert.equal(f.calls.filter(x=>x.command.action==='save_product_quote_line_v1').length,1);
});

test('review cannot report success after a subscriber suspends the real cookie',async t=>{
 const f=await opened(t);const stop=f.c.subscribe(()=>{if(f.c.getSnapshot().reviewed)f.runtime.cookie.suspend();});t.after(stop);assert.equal(f.c.reviewIssue(),false);assert.equal(f.c.getSnapshot().reviewed,false);await f.c.issueQuote();assert.equal(f.calls.some(x=>x.command.action==='issue_product_quote_v1'),false);
});

test('old held acknowledgement cannot erase a newer uncertain request in shared session custody',async t=>{
 const f=await opened(t),first=deferred(),entered=deferred();let writes=0,firstCommand,current=draft(),snap=snapshot();
 f.setReply(async command=>{
  if(command.action==='save_product_quote_draft_v1'){
   writes++;if(writes===1){firstCommand=command;entered.release();return first.promise;}
   if(writes===2){current={...current,target:{...current.target,revision:8,contentHash:'d'.repeat(64)},body:command.body};snap={...snap,revision:20,hash:'d'.repeat(64)};return Response.json(await receipt(command));}
   return Response.json({code:'uncertain'},{status:503});
  }
  return Response.json(command.action==='read_advisor_commerce_v1'?{...index(),snapshot:snap,entries:[{...index().entries[0],entity:{...index().entries[0].entity,revision:current.target.revision}}]}:command.action==='read_advisor_commerce_detail_v1'?{...detail(),snapshot:snap,detail:current}:{...components(command),snapshot:snap,quote:{kind:'draft',target:current.target}});
 });
 const old=f.c.saveDraft();await reached(entered.promise);const second=create({runtime:f.runtime,clientId:client,request:f.request});t.after(()=>second.dispose());await second.refresh();await second.retryOriginal();await second.openDraft(draftId);assert.equal(second.setBody({...body(),note:'new deliberate draft save'}),true);await second.saveDraft();const newer=second.getSnapshot().pending;assert.ok(newer);assert.notEqual(newer.requestId,firstCommand.requestId);
 first.release(Response.json(await receipt(firstCommand)));await old;assert.equal(second.getSnapshot().pending.requestId,newer.requestId);const third=create({runtime:f.runtime,clientId:client,request:f.request});t.after(()=>third.dispose());assert.equal(third.getSnapshot().pending.requestId,newer.requestId);assert.equal(third.getSnapshot().pending.wire,newer.wire);
});
