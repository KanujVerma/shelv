// Native PR245/4477352335 Source correction. Actual retained Session/transport
// and codecs with CLOSED synthetic responses, not persistence or funds proof.
import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture,load,client,draftId,index,draft,detail,components,receipt,option,deferred} from './w5-orders-commerce-admin-helper.mjs';
const {createProductQuoteAdminController}=await load('apps/portal/src/features/orders/admin/controller.ts');
async function creation(t){
 const f=await fixture(t),writes=[];let saved=null,revision=0,hold=null;
 f.setReply(async command=>{
  if(command.action==='save_product_quote_draft_v1'){
   writes.push(structuredClone(command));
   if(writes.length>1&&command.draftId===null)return Response.json({code:'unexpected_second_create'},{status:503});
   saved=structuredClone(command.body);revision=command.expectedQuoteDraftRevision+1;
   if(hold){hold.enter.release();await hold.release.promise;}
   return Response.json(await receipt(command));
  }
  if(command.action==='read_advisor_commerce_v1')return Response.json({...index(),entries:saved?[{...index().entries[0],entity:{kind:'quote_draft',id:draftId,revision}}]:[]});
  if(command.action==='read_advisor_commerce_detail_v1')return Response.json({...detail(),detail:{...draft(),target:{...draft().target,revision},body:saved,readyToIssue:false,issues:['incomplete_terms']}});
  if(command.action==='read_advisor_quote_components_v1')return Response.json({...components(command),quote:command.quote,total:command.component==='lines'?0:1,entries:command.component==='lines'?[]:[option()]});
  throw Error('unexpected finite command: '+command.action);
 });
 function controller(){const c=createProductQuoteAdminController({runtime:f.runtime,clientId:client,request:f.request});t.after(()=>c.dispose());return c;}
 const old=controller();await old.refresh();assert.equal(old.newDraft(),true);assert.equal(old.setBody({...old.getSnapshot().preparation.body,note:'original first draft'}),true);
 return {...f,old,writes,controller,holdAck(){hold={enter:deferred(),release:deferred()};return hold;}};
}
test('receipt-observer disposal retains the created ID before a replacement deliberately updates it',async t=>{
 const f=await creation(t);let observed=false;
 f.old.subscribe(()=>{if(observed||!f.old.getSnapshot().receipt)return;observed=true;f.old.dispose();});
 await f.old.saveDraft();assert.equal(observed,true);assert.equal(f.old.getSnapshot().phase,'ended');
 const next=f.controller();await next.refresh();const before=next.getSnapshot();
 assert.equal(next.setBody({...before.preparation.body,note:'later deliberate update'}),true);await next.saveDraft();
 t.diagnostic(JSON.stringify({preSecondPhase:before.phase,preSecondLoaded:before.loaded?.draft.target??null,writeTargets:f.writes.map(c=>({draftId:c.draftId,revision:c.expectedQuoteDraftRevision,requestId:c.requestId})),cookie:f.runtime.cookie.status,oldPhase:f.old.getSnapshot().phase}));
 assert.equal(f.writes.length,2);assert.equal(f.writes[0].draftId,null);assert.equal(f.writes[1].draftId,draftId,'second deliberate save must update the acknowledged entity, never create another');assert.equal(f.writes[1].expectedQuoteDraftRevision,1);assert.notEqual(f.writes[1].requestId,f.writes[0].requestId);
 assert.equal(next.getSnapshot().loaded.draft.target.revision,2);
});
test('replacement constructed in the receipt observer sees the known ID before older cleanup',async t=>{
 const f=await creation(t);let next=null,phase=null,entered=false;
 f.old.subscribe(()=>{if(entered||!f.old.getSnapshot().receipt)return;entered=true;phase=f.old.getSnapshot().phase;next=f.controller();f.old.dispose();});
 await f.old.saveDraft();assert.ok(next);assert.equal(phase,'loading');await next.refresh();
 assert.equal(next.getSnapshot().loaded.draft.target.draftId,draftId);assert.equal(next.getSnapshot().loaded.draft.target.revision,1);assert.equal(next.getSnapshot().pending,null);assert.equal(f.writes.length,1);
});
test('same-form refresh during held direct ACK still canonically reconciles the created entity',async t=>{
 const f=await creation(t),h=f.holdAck();let saving;
 try{saving=f.old.saveDraft();await h.enter.promise;await f.old.refresh();assert.equal(f.old.getSnapshot().pending.phase,'sending');h.release.release();await saving;assert.equal(f.old.getSnapshot().loaded.draft.target.draftId,draftId);assert.equal(f.old.getSnapshot().pending,null);assert.equal(f.old.getSnapshot().dirty,false);assert.equal(f.writes.length,1);}
 finally{h.release.release();if(saving)await Promise.allSettled([saving]);}
});
