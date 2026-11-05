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
async function twoDrafts(t){
 const f=await fixture(t),native=f.runtime.getSnapshot().boundary;let callback;
 // Explicit controller-only currentness wrapper, not native consumer behavior.
 const wrapped={...native,isCurrent(){const run=callback;callback=undefined;run?.();return native.isCurrent();}},runtime={...f.runtime,getSnapshot(){return {...f.runtime.getSnapshot(),boundary:wrapped};}};
 const second='e0000000-0000-4000-8000-000000000008';const {draft}=await import('./w5-orders-commerce-admin-helper.mjs');
 f.setReply(async command=>{if(command.action==='read_advisor_commerce_v1'){const page=index();return Response.json({...page,entries:[...page.entries,{...page.entries[0],entity:{...page.entries[0].entity,id:second},label:'synthetic second draft'}]});}if(command.action==='read_advisor_commerce_detail_v1'&&command.entity.id===second)return Response.json({...detail(),detail:{...draft(),target:{...draft().target,draftId:second},body:{...body(),note:'second draft'}}});return Response.json(command.action==='read_advisor_commerce_detail_v1'?detail():{...components(command),quote:command.quote});});
 const acquisitions=[],request={execute(command,options){acquisitions.push(command);return f.request.execute(command,options);}};
 const c=createProductQuoteAdminController({runtime,clientId:client,request});t.after(()=>c.dispose());await c.refresh();return {...f,c,second,acquisitions,arm(run){callback=run;}};
}
test('a newer draft open from currentness owns the final selected draft',async t=>{
 const f=await twoDrafts(t);let newer;f.arm(()=>{newer=f.c.openDraft(f.second);});await f.c.openDraft(draftId);assert.ok(newer);await newer;
 assert.equal(f.c.getSnapshot().loaded?.draft.target.draftId,f.second);assert.equal(f.calls.some(x=>!x.command.action.startsWith('read_')),false);
});
test('an older refresh cannot reacquire a read after currentness opens a newer draft',async t=>{
 const f=await twoDrafts(t);const before=f.acquisitions.filter(x=>x.action==='read_advisor_commerce_v1').length;let newer;f.arm(()=>{newer=f.c.openDraft(f.second);});await f.c.refresh();assert.ok(newer);await newer;
 assert.equal(f.c.getSnapshot().loaded?.draft.target.draftId,f.second);assert.equal(f.acquisitions.filter(x=>x.action==='read_advisor_commerce_v1').length-before,1,'only the newer read should acquire a fresh index operation');
});

test('the distinct second-draft fixture loads normally without a reentry callback',async t=>{
 const f=await twoDrafts(t);await f.c.openDraft(f.second);assert.equal(f.c.getSnapshot().phase,'ready');assert.equal(f.c.getSnapshot().loaded.draft.target.draftId,f.second);assert.equal(f.c.getSnapshot().loaded.draft.body.note,'second draft');
});
test('a newer local edit from a ready observer survives the older refresh cache cleanup',async t=>{
 const f=await fixture(t),c=createProductQuoteAdminController({runtime:f.runtime,clientId:client,request:f.request});t.after(()=>c.dispose());await c.refresh();await c.openDraft(draftId);let edited=false;
 const stop=c.subscribe(()=>{const s=c.getSnapshot();if(!edited&&s.phase==='ready'&&s.loaded){edited=true;c.setBody({...body(),note:'newer observer edit'});}});t.after(stop);await c.refresh();assert.equal(c.getSnapshot().preparation.body.note,'newer observer edit');
 const next=createProductQuoteAdminController({runtime:f.runtime,clientId:client,request:f.request});t.after(()=>next.dispose());assert.equal(next.getSnapshot().preparation.body.note,'newer observer edit','old refresh cannot erase the cache written by a newer local edit');
});
