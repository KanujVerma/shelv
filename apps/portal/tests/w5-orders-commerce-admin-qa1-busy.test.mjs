import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture,client,draftId,index,detail,components,deferred,load} from './w5-orders-commerce-admin-helper.mjs';
const {createProductQuoteAdminController}=await load('apps/portal/src/features/orders/admin/controller.ts');
// Public controller API/source schedule only. The actual UI disables its new
// button during loading; no browser/Root mount/permission/finance proof follows.
// Root session/cookie/transport/codecs are actual, HTTP replies are CLOSED models.
test('busy newDraft is refused without changing local state or retiring the old read',async t=>{
 assert.equal(process.env.W5_COMMERCE_ADMIN_SOURCE_ROOT,undefined);
 const f=await fixture(t),controller=createProductQuoteAdminController({runtime:f.runtime,clientId:client,request:f.request});t.after(()=>controller.dispose());
 await controller.refresh();await controller.openDraft(draftId);
 assert.equal(controller.getSnapshot().loaded.draft.target.draftId,draftId);assert.equal(controller.getSnapshot().dirty,false);
 const entered=deferred(),release=deferred();let held=false; t.after(()=>release.release());
 f.setReply(async command=>{
  if(command.action==='read_advisor_commerce_v1')return Response.json(index());
  if(command.action==='read_advisor_commerce_detail_v1'){
   if(!held){held=true;entered.release();await release.promise;}
   return Response.json(detail());
  }
  if(command.action==='read_advisor_quote_components_v1')return Response.json(components(command));
  throw Error('unexpected command in finite read-only control');
 });
 const refresh=controller.refresh();let accepted;
 try{
  await entered.promise;assert.equal(controller.getSnapshot().phase,'loading');
  const loading=controller.getSnapshot();accepted=controller.newDraft();assert.equal(accepted,false,'the public method refuses a busy local-context change');
  assert.equal(controller.getSnapshot(),loading,'busy denial leaves the exact current state untouched');
 }finally{release.release();await refresh;}
 const state=controller.getSnapshot(),writes=f.calls.filter(c=>!c.command.action.startsWith('read_')).length;
 t.diagnostic(JSON.stringify({newDraftAccepted:accepted,phase:state.phase,loadedDraftId:state.loaded?.draft.target.draftId??null,workingLines:state.preparation.lines.length,writes,cookie:f.runtime.cookie.status,scope:'controller API; UI loading button disabled'}));
 assert.equal(writes,0);assert.equal(f.runtime.cookie.status,'ready');
 assert.equal(state.phase,'ready');assert.equal(state.loaded.draft.target.draftId,draftId,'the still-owned read completes normally after busy denial');
 assert.equal(state.preparation.lines.length,1);
});
