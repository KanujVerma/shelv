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

// Owner extensions supply canonical detail/components that the exact original
// intentionally does not. No actual persisted record/finance authority follows.
const {draft:canonicalDraft,detail:detailEnvelope,components:componentEnvelope,option:manualOption}=await import(pathToFileURL(resolve('apps/portal/tests/w5-orders-commerce-admin-helper.mjs')));
async function canonicalRecovery(t){
 const f=await fixture(t),entered=deferred(),release=deferred();let original=null,available=true;
 f.setReply(async command=>{
  if(command.action==='read_advisor_commerce_v1')return Response.json(original?{...index(),entries:[{...index().entries[0],entity:{kind:'quote_draft',id:draftId,revision:1}}]}:{...index(),entries:[]});
  if(command.action==='save_product_quote_draft_v1'){if(!original)original=structuredClone(command);return Response.json({code:'uncertain'},{status:503});}
  if(command.action==='request_status_v1'){entered.release();await release.promise;return Response.json({status:'committed',receipt:await receipt(original)});}
  if(command.action==='read_advisor_commerce_detail_v1')return available?Response.json({...detailEnvelope(),detail:{...canonicalDraft(),target:{...canonicalDraft().target,revision:1},body:original.body,readyToIssue:false,issues:['incomplete_terms']}}):Response.json({code:'unavailable'},{status:503});
  if(command.action==='read_advisor_quote_components_v1')return Response.json({...componentEnvelope(command),quote:command.quote,total:command.component==='lines'?0:1,entries:command.component==='lines'?[]:[manualOption()]});
  throw Error('unexpected finite source command');
 });
 const c=createProductQuoteAdminController({runtime:f.runtime,clientId:client,request:f.request});t.after(()=>c.dispose());t.after(()=>release.release());await c.refresh();c.newDraft();c.setBody({...c.getSnapshot().preparation.body,note:'same form canonical recovery'});await c.saveDraft();assert.equal(c.getSnapshot().pending.phase,'uncertain');await f.runtime.restore();return {...f,c,entered,release,original:()=>original,canonical(value){available=value;}};
}
test('repeated same-form refreshes reconcile the original creation and the next save updates its ID',async t=>{
 const f=await canonicalRecovery(t);let checking;
 try{checking=f.c.checkStatus();await f.entered.promise;await f.c.refresh();await f.c.refresh();f.release.release();await checking;assert.equal(f.c.getSnapshot().loaded?.draft.target.draftId,draftId);assert.equal(f.c.getSnapshot().dirty,false);assert.equal(f.c.getSnapshot().pending,null);await f.c.saveDraft();const saves=f.calls.filter(x=>x.command.action==='save_product_quote_draft_v1').map(x=>x.command);assert.equal(saves.length,2);assert.equal(saves.filter(x=>x.draftId===null).length,1);assert.equal(saves[1].draftId,draftId);assert.equal(saves[1].expectedQuoteDraftRevision,1);
 }finally{f.release.release();if(checking)await Promise.allSettled([checking]);}
});
test('known creation binding survives unavailable canonical read into another current controller',async t=>{
 const f=await canonicalRecovery(t);let checking;
 try{checking=f.c.checkStatus();await f.entered.promise;await f.c.refresh();f.canonical(false);f.release.release();await checking;assert.equal(f.c.getSnapshot().pending,null);assert.equal(f.c.getSnapshot().loaded,null);assert.notEqual(f.c.getSnapshot().phase,'ready');
  // A concurrent live replacement reads the cache before old-controller dispose;
  // this is a Source memory schedule, not a second operational finance surface.
  await f.runtime.restore();f.canonical(true);const next=createProductQuoteAdminController({runtime:f.runtime,clientId:client,request:f.request});t.after(()=>next.dispose());await next.refresh();assert.equal(next.getSnapshot().loaded?.draft.target.draftId,draftId);await next.saveDraft();const saves=f.calls.filter(x=>x.command.action==='save_product_quote_draft_v1').map(x=>x.command);assert.equal(saves.filter(x=>x.draftId===null).length,1);assert.equal(saves.at(-1).draftId,draftId);
 }finally{f.release.release();if(checking)await Promise.allSettled([checking]);}
});
