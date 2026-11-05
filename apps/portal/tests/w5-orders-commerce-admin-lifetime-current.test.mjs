// DISTINCT current Quote Admin source controls; no recovered old raw/evidence.
// Actual retained runtime/transport/Root codecs, finite synthetic HTTP only.
// Operation-port acquisition counters are not raw HTTP/Auth/finance effects.
import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture,load,client,draftId,body,index,detail,components} from './w5-orders-commerce-admin-helper.mjs';
const {createProductQuoteAdminController}=await load('apps/portal/src/features/orders/admin/controller.ts');
test('disposal becomes terminal before read abort observers can acquire another operation',async t=>{
 const f=await fixture(t);let calls=0,signal,nested;
 const request={execute(command,options){calls++;signal=options.signal;return f.request.execute(command,options);}};
 const c=createProductQuoteAdminController({runtime:f.runtime,clientId:client,request});t.after(()=>{try{c.dispose();}catch{}});await c.refresh();assert.equal(calls,1);assert.ok(signal);
 signal.addEventListener('abort',()=>{nested=c.refresh();},{once:true});c.dispose();await nested;
 assert.equal(c.getSnapshot().phase,'ended');assert.equal(c.getSnapshot().index,null);assert.equal(f.runtime.cookie.status,'ready');
 assert.equal(calls,1,'cleanup observer must not acquire a new operation from this terminal controller');
});
test('one failing unsubscribe cannot prevent terminal state or remaining cleanup',async t=>{
 const f=await fixture(t);let stopped=0,calls=0;
 // Explicit unsubscribe-failure wrapper only; native currentness/transport stay
 // unchanged. This is not evidence about native Auth or financial authority.
 const runtime={...f.runtime,subscribe(fn){const stop=f.runtime.subscribe(fn);return()=>{stopped++;stop();throw Error('SYNTHETIC unsubscribe failure');};}};
 const request={execute(c,o){calls++;return f.request.execute(c,o);}};
 const c=createProductQuoteAdminController({runtime,clientId:client,request});t.after(()=>{try{c.dispose();}catch{}});await c.refresh();const before=calls;
 assert.doesNotThrow(()=>c.dispose());assert.equal(c.getSnapshot().phase,'ended');assert.equal(c.getSnapshot().index,null);assert.equal(stopped,1);await c.refresh();assert.equal(calls,before);assert.doesNotThrow(()=>c.dispose());assert.equal(stopped,1);
});

test('disposal during an edit notification preserves the final unsent values for this session',async t=>{
 const f=await fixture(t),c=createProductQuoteAdminController({runtime:f.runtime,clientId:client,request:f.request});t.after(()=>c.dispose());await c.refresh();await c.openDraft(draftId);
 const stop=c.subscribe(()=>{if(c.getSnapshot().dirty)c.dispose();});t.after(stop);c.setBody({...body(),note:'last unsent value'});assert.equal(c.getSnapshot().phase,'ended');
 const next=createProductQuoteAdminController({runtime:f.runtime,clientId:client,request:f.request});t.after(()=>next.dispose());assert.equal(next.getSnapshot().preparation.body.note,'last unsent value');assert.equal(next.getSnapshot().dirty,true);assert.equal(f.calls.some(x=>!x.command.action.startsWith('read_')),false);
});
test('terminal disposal retains an exact dispatched uncertain original for a current replacement',async t=>{
 const f=await fixture(t),c=createProductQuoteAdminController({runtime:f.runtime,clientId:client,request:f.request});t.after(()=>c.dispose());await c.refresh();await c.openDraft(draftId);
 f.setReply(async command=>Response.json(command.action==='read_advisor_commerce_v1'?index():command.action==='read_advisor_commerce_detail_v1'?detail():command.action==='read_advisor_quote_components_v1'?components(command):{code:'uncertain'},{status:command.action.startsWith('read_')?200:503}));
 await c.saveDraft();const original=c.getSnapshot().pending;assert.equal(original.phase,'uncertain');await f.runtime.restore();c.dispose();
 const next=createProductQuoteAdminController({runtime:f.runtime,clientId:client,request:f.request});t.after(()=>next.dispose());assert.equal(next.getSnapshot().pending.requestId,original.requestId);assert.equal(next.getSnapshot().pending.wire,original.wire);assert.equal(next.getSnapshot().pending.hash,original.hash);assert.equal(f.calls.filter(x=>x.command.action==='save_product_quote_draft_v1').length,1);
});
