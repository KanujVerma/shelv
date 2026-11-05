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

// Canonical3360-byte NR1 original is preserved inert; above only its helper
// import URL is adapted. Current owner extensions follow, on the R9 successor.
const {deferred}=await import('./w5-orders-commerce-admin-helper.mjs');
async function unsavedPair(t){
 const f=await fixture(t),writes=[];
 f.setReply(async command=>{
  if(command.action==='read_advisor_commerce_v1')return Response.json({...index(),entries:[]});
  if(command.action==='save_product_quote_draft_v1'){writes.push({command:structuredClone(command),wire:JSON.stringify(command)});return Response.json({code:'uncertain'},{status:503});}
  throw Error('unexpected finite command');
 });
 function controller(){const c=createProductQuoteAdminController({runtime:f.runtime,clientId:client,request:f.request});t.after(()=>c.dispose());return c;}
 const old=controller();await old.refresh();assert.equal(old.newDraft(),true);
 assert.equal(old.setBody({...old.getSnapshot().preparation.body,note:'previous local raw'}),true);
 const next=controller();await next.refresh();assert.equal(next.getSnapshot().preparation.body.note,'previous local raw');
 return {...f,writes,old,next,controller};
}
test('save observes a later retained form before a second deliberate action can prepare it',async t=>{
 const f=await unsavedPair(t);assert.equal(f.old.setBody({...f.old.getSnapshot().preparation.body,note:'final local raw'}),true);f.old.dispose();
 assert.equal(f.next.getSnapshot().preparation.body.note,'previous local raw');
 await f.next.saveDraft();assert.equal(f.writes.length,0);
 assert.equal(f.next.getSnapshot().preparation.body.note,'final local raw');assert.equal(f.next.getSnapshot().pending,null);
 await f.next.saveDraft();assert.equal(f.writes.length,1);assert.equal(f.writes[0].command.body.note,'final local raw');
});
test('fresh hash scheduling cannot dispatch stale raw when the retained form changes during the await',async t=>{
 const f=await unsavedPair(t),enter=deferred(),release=deferred(),subtle=crypto.subtle,original=subtle.digest,descriptor=Object.getOwnPropertyDescriptor(subtle,'digest');let held=false,saving;
 Object.defineProperty(subtle,'digest',{configurable:true,writable:true,value:function(...args){if(!held){held=true;enter.release();return release.promise.then(()=>Reflect.apply(original,this,args));}return Reflect.apply(original,this,args);}});
 try{
  saving=f.next.saveDraft();await enter.promise;
  assert.equal(f.old.setBody({...f.old.getSnapshot().preparation.body,note:'final during hash'}),true);f.old.dispose();
  release.release();await saving;
  assert.equal(f.writes.length,0);assert.equal(f.next.getSnapshot().pending,null);assert.equal(f.next.getSnapshot().localEditConflict,true);assert.equal(f.next.getSnapshot().error,409);
  assert.equal(await f.next.recoverLocalEdits(),true);assert.equal(f.next.getSnapshot().preparation.body.note,'final during hash');
  await f.next.saveDraft();assert.equal(f.writes.length,1);assert.equal(f.writes[0].command.body.note,'final during hash');
 }finally{release.release();if(saving)await Promise.allSettled([saving]);if(descriptor)Object.defineProperty(subtle,'digest',descriptor);else delete subtle.digest;}
});
test('exact original retry preserves UUID and payload despite a newer local retained form',async t=>{
 const f=await unsavedPair(t);await f.next.saveDraft();const pending=f.next.getSnapshot().pending;
 assert.equal(pending.phase,'uncertain');assert.equal(f.writes.length,1);
 await f.runtime.restore();await f.old.refresh();
 assert.equal(f.old.setBody({...f.old.getSnapshot().preparation.body,note:'newer retained local raw'}),true);
 await f.next.retryOriginal();assert.equal(f.writes.length,2);assert.equal(f.writes[1].wire,f.writes[0].wire);
 assert.equal(f.writes[1].command.requestId,pending.requestId);assert.equal(f.writes[1].command.body.note,'previous local raw');
 assert.equal(f.next.getSnapshot().pending.requestId,pending.requestId);assert.equal(f.next.getSnapshot().pending.wire,pending.wire);assert.equal(f.next.getSnapshot().pending.hash,pending.hash);
 assert.equal(f.controller().getSnapshot().preparation.body.note,'newer retained local raw');
});
