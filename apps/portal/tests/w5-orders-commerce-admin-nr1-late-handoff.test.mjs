// Current fd989e Source only. Actual retained Session/controller/transport/
// codecs, CLOSED synthetic replies. No actual financial command/persistence,
// AuthSQL, private payload, Root UI/hydration or genuine reachability proof.
// Run from the immutable current export Root CWD; no SourceRoot override.
import test from 'node:test';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
const {fixture,load,client,index}=await import(new URL('./w5-orders-commerce-admin-helper.mjs',import.meta.url));
const {createProductQuoteAdminController}=await load('apps/portal/src/features/orders/admin/controller.ts');

test('same-form late handoff is observed or blocked before an unsaved replacement creates from previous raw work',async t=>{
 const f=await fixture(t),writes=[];
 f.setReply(async command=>{
  if(command.action==='read_advisor_commerce_v1')return Response.json({...index(),entries:[]});
  if(command.action==='save_product_quote_draft_v1'){writes.push(structuredClone(command));return Response.json({code:'uncertain'},{status:503});}
  throw Error('unexpected finite command');
 });
 const old=createProductQuoteAdminController({runtime:f.runtime,clientId:client,request:f.request});t.after(()=>old.dispose());
 await old.refresh();assert.equal(old.newDraft(),true);
 assert.equal(old.setBody({...old.getSnapshot().preparation.body,note:'previous unsaved raw'}),true);
 let next=null,refreshing=null,entered=false;
 const stop=old.subscribe(()=>{
  if(entered||old.getSnapshot().preparation.body.note!=='final retained unsaved raw')return;
  entered=true;next=createProductQuoteAdminController({runtime:f.runtime,clientId:client,request:f.request});
  // Start the actual read BEFORE old terminal cleanup retains final raw work.
  refreshing=next.refresh();old.dispose();
 });t.after(stop);
 const oldEditReturned=old.setBody({...old.getSnapshot().preparation.body,note:'final retained unsaved raw'});
 assert.equal(entered,true);assert.ok(next);t.after(()=>next.dispose());
 try{
  await refreshing;
  const before=next.getSnapshot(),preSaveCookie=f.runtime.cookie.status;
  const retained=createProductQuoteAdminController({runtime:f.runtime,clientId:client,request:f.request});t.after(()=>retained.dispose());
  assert.equal(retained.getSnapshot().preparation.body.note,'final retained unsaved raw');
  assert.equal(before.loaded,null);assert.equal(before.pending,null);
  // No deliberate local re-edit/reapplication occurs after this handoff.
  await next.saveDraft();
  t.diagnostic(JSON.stringify({oldEditReturned,oldPhase:old.getSnapshot().phase,preSaveCookie,preSavePhase:before.phase,preSaveConflict:before.localEditConflict,preSaveNote:before.preparation.body.note,retainedNote:retained.getSnapshot().preparation.body.note,saves:writes.map(x=>({draftId:x.draftId,revision:x.expectedQuoteDraftRevision,note:x.body.note})),finalCookie:f.runtime.cookie.status}));
  // Preserve final same-form work or block for observation/reapplication.
  // This does not require a successful financial operation or backend result.
  assert.ok(writes.length===0||writes.every(x=>x.body.note==='final retained unsaved raw'),'late same-form cache handoff must not silently create from previous raw work');
 }finally{if(refreshing)await Promise.allSettled([refreshing]);}
});
