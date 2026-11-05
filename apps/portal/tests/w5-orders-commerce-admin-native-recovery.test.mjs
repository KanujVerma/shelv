// Native PR245 Source findings, reproduced only on this NEW owner branch.
// Actual retained SDK/cookie/transport/codecs, CLOSED synthetic HTTP and receipts;
// no installed finance gateway, real persistence, funds, approval or UI mount.
import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture,load,client,draftId,draft,index,detail,components,receipt,option,line,deferred} from './w5-orders-commerce-admin-helper.mjs';
const {createProductQuoteAdminController}=await load('apps/portal/src/features/orders/admin/controller.ts');
async function localFirst(t){
 const f=await fixture(t);f.setReply(async command=>{assert.equal(command.action,'read_advisor_commerce_v1');return Response.json({...index(),entries:[]});});const c=createProductQuoteAdminController({runtime:f.runtime,clientId:client,request:f.request});t.after(()=>c.dispose());await c.refresh();assert.equal(c.getSnapshot().phase,'empty');assert.equal(c.newDraft(),true);assert.equal(c.setBody({...c.getSnapshot().preparation.body,note:'first local quote'}),true);return {...f,c};
}
test('refresh and remount preserve an editable first unsaved quote even when the canonical index is empty',async t=>{
 const f=await localFirst(t);await f.c.refresh();assert.equal(f.c.getSnapshot().phase,'ready','retained working quote must remain editable');assert.equal(f.c.getSnapshot().loaded,null);assert.equal(f.c.getSnapshot().preparation.body.note,'first local quote');assert.equal(f.c.getSnapshot().dirty,true);f.c.dispose();
 const next=createProductQuoteAdminController({runtime:f.runtime,clientId:client,request:f.request});t.after(()=>next.dispose());await next.refresh();assert.equal(next.getSnapshot().phase,'ready');assert.equal(next.getSnapshot().preparation.body.note,'first local quote');assert.equal(next.discardLocal(),true);assert.equal(next.getSnapshot().dirty,false);assert.equal(f.calls.some(x=>!x.command.action.startsWith('read_')),false);
});
async function lostCreation(t,{clean=false,second=false}={}){
 const f=await localFirst(t);if(clean)assert.equal(f.c.discardLocal(),true);let saved=null,beforeStatus=async()=>{};const secondId='e0000000-0000-4000-8000-000000000009';
 function stored(){return {...draft(),target:{...draft().target,revision:1},body:saved.body,readyToIssue:false,issues:['incomplete_terms']};}
 f.setReply(async command=>{
  if(command.action==='save_product_quote_draft_v1'){if(!saved)saved=structuredClone(command);return Response.json({code:'uncertain'},{status:503});}
  if(command.action==='request_status_v1'){await beforeStatus();return Response.json({status:'committed',receipt:await receipt(saved)});}
  if(command.action==='read_advisor_commerce_v1')return Response.json(saved?{...index(),entries:[{...index().entries[0],entity:{kind:'quote_draft',id:draftId,revision:1}},...(second?[{...index().entries[0],entity:{kind:'quote_draft',id:secondId,revision:7},label:'synthetic second draft'}]:[])]}:{...index(),entries:[]});
  if(command.action==='read_advisor_commerce_detail_v1')return Response.json({...detail(),detail:command.entity.id===secondId?{...draft(),target:{...draft().target,draftId:secondId}}:stored()});
  if(command.action==='read_advisor_quote_components_v1'){const isSecond=command.quote.target.draftId===secondId;return Response.json({...components(command),quote:command.quote,total:command.component==='lines'?(isSecond?1:0):1,entries:command.component==='lines'?(isSecond?[line()]:[]):[option()]});}
  throw Error('unexpected finite source command');
 });
 await f.c.saveDraft();assert.equal(f.c.getSnapshot().pending.phase,'uncertain');assert.equal(saved.draftId,null);assert.equal(saved.expectedQuoteDraftRevision,0);await f.runtime.restore();return {...f,saved:()=>saved,secondId,onStatus(callback){beforeStatus=callback;}};
}
test('committed first-save status selects and reloads the created draft before a later deliberate update',async t=>{
 const f=await lostCreation(t);await f.c.checkStatus();const state=f.c.getSnapshot();t.diagnostic(JSON.stringify({phase:state.phase,error:state.error,dirty:state.dirty,loaded:state.loaded?.draft.target,receipt:state.receipt?.entity,calls:f.calls.map(x=>({action:x.command.action,entity:x.command.entity,quote:x.command.quote}))}));assert.equal(state.pending,null);assert.equal(state.receipt.requestId,f.saved().requestId);assert.equal(state.loaded?.draft.target.draftId,draftId,'recovery must attach the actual acknowledged creation target');assert.equal(state.loaded.draft.target.revision,1);assert.equal(state.phase,'ready');assert.equal(state.dirty,false);
 assert.equal(f.c.setBody({...state.preparation.body,note:'later deliberate update'}),true);await f.c.saveDraft();const writes=f.calls.filter(x=>x.command.action==='save_product_quote_draft_v1');assert.equal(writes.length,2);assert.equal(writes[1].command.draftId,draftId);assert.equal(writes[1].command.expectedQuoteDraftRevision,1);assert.notEqual(writes[1].command.requestId,writes[0].command.requestId);
});

test('no unsaved local work keeps an empty canonical index genuinely empty',async t=>{
 const f=await fixture(t);f.setReply(async c=>{assert.equal(c.action,'read_advisor_commerce_v1');return Response.json({...index(),entries:[]});});const c=createProductQuoteAdminController({runtime:f.runtime,clientId:client,request:f.request});t.after(()=>c.dispose());await c.refresh();assert.equal(c.getSnapshot().phase,'empty');assert.equal(c.getSnapshot().dirty,false);assert.equal(c.getSnapshot().loaded,null);
});
test('remounted original uncertainty recovers the same created draft instead of another create',async t=>{
 const f=await lostCreation(t);const original=f.c.getSnapshot().pending;f.c.dispose();const next=createProductQuoteAdminController({runtime:f.runtime,clientId:client,request:f.request});t.after(()=>next.dispose());assert.equal(next.getSnapshot().pending.requestId,original.requestId);await next.refresh();await next.checkStatus();assert.equal(next.getSnapshot().loaded?.draft.target.draftId,draftId);assert.equal(next.getSnapshot().pending,null);assert.equal(f.calls.filter(x=>x.command.action==='save_product_quote_draft_v1').length,1);
});
test('a delayed original creation status cannot rebind a newer draft read context',async t=>{
 const f=await lostCreation(t,{clean:true,second:true});await f.c.refresh();const entered=deferred(),release=deferred();f.onStatus(async()=>{entered.release();await release.promise;});let checking;
 try{checking=f.c.checkStatus();await entered.promise;await f.c.openDraft(f.secondId);assert.equal(f.c.getSnapshot().loaded.draft.target.draftId,f.secondId);const before=f.calls.length;release.release();await checking;assert.equal(f.c.getSnapshot().loaded.draft.target.draftId,f.secondId);assert.equal(f.c.getSnapshot().receipt.entity.id,draftId,'historical original ACK stays separate');assert.equal(f.calls.slice(before).some(x=>x.command.action==='read_advisor_commerce_detail_v1'),false);assert.equal(f.calls.filter(x=>x.command.action==='save_product_quote_draft_v1').length,1);
 }finally{release.release();if(checking)await Promise.allSettled([checking]);}
});
test('recovered creation enters canonical reconciliation before observers can create again',async t=>{
 const f=await lostCreation(t);await f.c.refresh();let tried=false,newPending=0,attempt;const original=f.saved().requestId;
 const stop=f.c.subscribe(()=>{const s=f.c.getSnapshot();if(s.pending?.command?.action==='save_product_quote_draft_v1'&&s.pending.requestId!==original)newPending++;if(!tried&&s.receipt?.requestId===original&&!s.pending){tried=true;assert.equal(s.phase,'loading');attempt=f.c.saveDraft();}});t.after(stop);await f.c.checkStatus();if(attempt)await attempt;assert.equal(tried,true);assert.equal(newPending,0);assert.equal(f.calls.filter(x=>x.command.action==='save_product_quote_draft_v1').length,1);assert.equal(f.c.getSnapshot().loaded.draft.target.draftId,draftId);
});
