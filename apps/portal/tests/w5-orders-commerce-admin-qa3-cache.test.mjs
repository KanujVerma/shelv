// Current CCC16 consumer only. Actual retained Session/cookie/transport/codecs,
// closed synthetic HTTP/receipts. No persistence, actual finance, Root UI or
// hydration claim. Source-only live-replacement/cache handoff schedule.
import test from 'node:test';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
const {fixture,load,client,draftId,index,receipt,draft,detail,components,line,option}=await import(pathToFileURL(resolve('apps/portal/tests/w5-orders-commerce-admin-helper.mjs')));
const {createProductQuoteAdminController}=await load('apps/portal/src/features/orders/admin/controller.ts');

test('older recovered-creation controller disposal preserves newer replacement draft edits in the same-owner cache',async t=>{
 const f=await fixture(t),idB='e0000000-0000-4000-8000-000000000009';let original=null,canonicalAvailable=false;
 f.setReply(async command=>{
  if(command.action==='read_advisor_commerce_v1')return Response.json(original?{...index(),entries:[{...index().entries[0],entity:{kind:'quote_draft',id:draftId,revision:1}},{...index().entries[0],entity:{kind:'quote_draft',id:idB,revision:7},label:'synthetic draft B'}]}:{...index(),entries:[]});
  if(command.action==='save_product_quote_draft_v1'){
   assert.equal(original,null,'this schedule sends only the first synthetic create');original=structuredClone(command);return Response.json({code:'uncertain'},{status:503});
  }
  if(command.action==='request_status_v1')return Response.json({status:'committed',receipt:await receipt(original)});
  if(command.action==='read_advisor_commerce_detail_v1'){
   if(!canonicalAvailable)return Response.json({code:'unavailable'},{status:503});
   return Response.json({...detail(),detail:command.entity.id===idB?{...draft(),target:{...draft().target,draftId:idB}}:{...draft(),target:{...draft().target,revision:1},body:original.body,readyToIssue:false,issues:['incomplete_terms']}});
  }
  if(command.action==='read_advisor_quote_components_v1'){
   const isB=command.quote.target.draftId===idB;
   return Response.json({...components(command),quote:command.quote,total:command.component==='lines'?(isB?1:0):1,entries:command.component==='lines'?(isB?[line()]:[]):[option()]});
  }
  throw Error('unexpected finite source command: '+command.action);
 });
 const old=createProductQuoteAdminController({runtime:f.runtime,clientId:client,request:f.request});t.after(()=>old.dispose());
 await old.refresh();assert.equal(old.newDraft(),true);
 assert.equal(old.setBody({...old.getSnapshot().preparation.body,note:'original first quote A'}),true);
 await old.saveDraft();assert.equal(old.getSnapshot().pending.phase,'uncertain');
 await f.runtime.restore();await old.checkStatus();
 assert.equal(old.getSnapshot().pending,null);assert.equal(old.getSnapshot().loaded,null);
 assert.notEqual(old.getSnapshot().phase,'ready');
 // New current controller recovers the known ID before old disposal, as the
 // new public source handoff promises. It then selects and edits genuine B.
 canonicalAvailable=true;await f.runtime.restore();
 const next=createProductQuoteAdminController({runtime:f.runtime,clientId:client,request:f.request});t.after(()=>next.dispose());
 await next.refresh();assert.equal(next.getSnapshot().loaded.draft.target.draftId,draftId);
 assert.equal(next.getSnapshot().dirty,false);
 await next.openDraft(idB);assert.equal(next.getSnapshot().loaded.draft.target.draftId,idB);
 assert.equal(next.setBody({...next.getSnapshot().preparation.body,note:'newer draft B unsent edits'}),true);
 assert.equal(next.getSnapshot().dirty,true);
 old.dispose();assert.equal(old.getSnapshot().phase,'ended');
 assert.equal(next.getSnapshot().loaded.draft.target.draftId,idB);
 assert.equal(next.getSnapshot().preparation.body.note,'newer draft B unsent edits');
 // Observe cache custody through another normal current constructor, not a
 // substituted memory implementation or private-cache mutation.
 const remount=createProductQuoteAdminController({runtime:f.runtime,clientId:client,request:f.request});t.after(()=>remount.dispose());
 const recovered=remount.getSnapshot();
 t.diagnostic(JSON.stringify({cookie:f.runtime.cookie.status,oldPhase:old.getSnapshot().phase,currentDraft:next.getSnapshot().loaded.draft.target.draftId,currentNote:next.getSnapshot().preparation.body.note,recoveredNote:recovered.preparation.body.note,recoveredDirty:recovered.dirty,writeCalls:f.calls.filter(x=>x.command.action==='save_product_quote_draft_v1').length}));
 assert.equal(recovered.preparation.body.note,'newer draft B unsent edits','terminal older controller must not overwrite a newer current unsent cache');
});

const {body:canonicalBody}=await import(pathToFileURL(resolve('apps/portal/tests/w5-orders-commerce-admin-helper.mjs')));
async function newerCache(t){
 const f=await fixture(t),idB='e0000000-0000-4000-8000-000000000009';
 f.setReply(async command=>{
  if(command.action==='read_advisor_commerce_v1')return Response.json({...index(),entries:[...index().entries,{...index().entries[0],entity:{kind:'quote_draft',id:idB,revision:7},label:'synthetic B'}]});
  if(command.action==='read_advisor_commerce_detail_v1')return Response.json(command.entity.id===idB?{...detail(),detail:{...draft(),target:{...draft().target,draftId:idB}}}:detail());
  if(command.action==='read_advisor_quote_components_v1')return Response.json({...components(command),quote:command.quote});
  throw Error('unexpected finite read-only command');
 });
 const old=createProductQuoteAdminController({runtime:f.runtime,clientId:client,request:f.request});t.after(()=>old.dispose());await old.refresh();await old.openDraft(draftId);old.setBody({...canonicalBody(),note:'older A raw'});
 const next=createProductQuoteAdminController({runtime:f.runtime,clientId:client,request:f.request});t.after(()=>next.dispose());await next.refresh();assert.equal(next.discardLocal(),true);await next.openDraft(idB);assert.equal(next.setBody({...canonicalBody(),note:'new B raw'}),true);
 return {...f,old,next,idB,remount(){const c=createProductQuoteAdminController({runtime:f.runtime,clientId:client,request:f.request});t.after(()=>c.dispose());return c;}};
}
test('an older background refresh cannot replace an already newer draft cache',async t=>{
 const f=await newerCache(t);await f.old.refresh();assert.equal(f.old.getSnapshot().preparation.body.note,'older A raw');const restored=f.remount();assert.equal(restored.getSnapshot().preparation.body.note,'new B raw');assert.equal(f.calls.some(x=>!x.command.action.startsWith('read_')),false);
});
test('older local discard cannot clear newer cache and the new owner continues editing',async t=>{
 const f=await newerCache(t);assert.equal(f.old.discardLocal(),true);assert.equal(f.remount().getSnapshot().preparation.body.note,'new B raw');assert.equal(f.next.setBody({...canonicalBody(),note:'newest B raw'}),true);f.old.dispose();assert.equal(f.remount().getSnapshot().preparation.body.note,'newest B raw');assert.equal(f.calls.some(x=>!x.command.action.startsWith('read_')),false);
});
