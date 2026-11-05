// Current 96ff consumer source only. Actual Session/retained cookie/transport/
// codecs, closed synthetic HTTP and receipts. No installed finance gateway,
// actual commit/persistence, financial authority, browser or Root UI claim.
// Run from the pinned candidate export CWD; no source/authority override.
import test from 'node:test';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
const {fixture,load,client,draftId,index,receipt,deferred}=await import(pathToFileURL(resolve('apps/portal/tests/w5-orders-commerce-admin-helper.mjs')));
const {createProductQuoteAdminController}=await load('apps/portal/src/features/orders/admin/controller.ts');

test('same-form refresh during creation-status recovery cannot turn the acknowledged original into another create',async t=>{
 const f=await fixture(t),entered=deferred(),release=deferred();let original=null,checking;
 f.setReply(async command=>{
  if(command.action==='read_advisor_commerce_v1')return Response.json(original?{...index(),entries:[{...index().entries[0],entity:{kind:'quote_draft',id:draftId,revision:1}}]}:{...index(),entries:[]});
  if(command.action==='save_product_quote_draft_v1'){
   if(!original)original=structuredClone(command);
   return Response.json({code:'uncertain'},{status:503});
  }
  if(command.action==='request_status_v1'){
   entered.release();await release.promise;
   return Response.json({status:'committed',receipt:await receipt(original)});
  }
  throw Error('unexpected finite source command: '+command.action);
 });
 const c=createProductQuoteAdminController({runtime:f.runtime,clientId:client,request:f.request});t.after(()=>c.dispose());
 try{
  await c.refresh();assert.equal(c.getSnapshot().phase,'empty');
  assert.equal(c.newDraft(),true);
  assert.equal(c.setBody({...c.getSnapshot().preparation.body,note:'same original unsaved quote'}),true);
  await c.saveDraft();assert.equal(c.getSnapshot().pending.phase,'uncertain');
  assert.equal(original.draftId,null);assert.equal(original.expectedQuoteDraftRevision,0);
  await f.runtime.restore();assert.equal(f.runtime.cookie.status,'ready');
  checking=c.checkStatus();await entered.promise;
  // Refresh the SAME form, without newDraft/edit/open/discard or a new intent.
  await c.refresh();
  const refreshed=c.getSnapshot();assert.equal(refreshed.phase,'ready');
  assert.equal(refreshed.preparation.body.note,original.body.note);
  assert.equal(refreshed.loaded,null);assert.equal(refreshed.pending.requestId,original.requestId);
  release.release();await checking;
  const acknowledged=c.getSnapshot();assert.equal(acknowledged.pending,null);
  assert.equal(acknowledged.receipt.requestId,original.requestId);
  assert.deepEqual(acknowledged.receipt.entity,{kind:'quote_draft',id:draftId,revision:1});
  // Blocking until canonical reconciliation OR updating that exact draft are
  // both valid. A fresh draftId:null create for unchanged original work is not.
  await c.saveDraft();
  const saves=f.calls.filter(x=>x.command.action==='save_product_quote_draft_v1').map(x=>x.command);
  t.diagnostic(JSON.stringify({cookie:f.runtime.cookie.status,afterAck:{phase:acknowledged.phase,loaded:acknowledged.loaded?.draft.target??null,dirty:acknowledged.dirty,pending:acknowledged.pending,receipt:acknowledged.receipt.entity},saves:saves.map(x=>({requestId:x.requestId,draftId:x.draftId,expectedQuoteDraftRevision:x.expectedQuoteDraftRevision,note:x.body.note})),sameOriginalBody:saves.length>1&&JSON.stringify(saves[0].body)===JSON.stringify(saves[1].body),differentRequestIds:saves.length>1&&saves[0].requestId!==saves[1].requestId}));
  assert.equal(saves.filter(x=>x.draftId===null).length,1,'known committed original must not become a second create after a same-form refresh');
 }finally{release.release();if(checking)await Promise.allSettled([checking]);}
});
