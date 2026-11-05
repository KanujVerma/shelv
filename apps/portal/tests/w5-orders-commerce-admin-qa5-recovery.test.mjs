// Current7e6e consumer only. Actual Session/controller/cookie/transport/codecs,
// CLOSED synthetic READ envelopes. No financial write, AuthSQL, persistence,
// private-cache mutation, currentness facade or actual Root UI/browser claim.
import test from 'node:test';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
const {fixture,load,client,draftId,index,draft,detail,components,body}=await import(pathToFileURL(resolve('apps/portal/tests/w5-orders-commerce-admin-helper.mjs')));
const {createProductQuoteAdminController}=await load('apps/portal/src/features/orders/admin/controller.ts');

test('replacement after the first final-edit handoff can edit chosen B or exposes a blocked recovery state',async t=>{
 const f=await fixture(t),idB='e0000000-0000-4000-8000-000000000009';
 f.setReply(async command=>{
  if(command.action==='read_advisor_commerce_v1')return Response.json({...index(),entries:[...index().entries,{...index().entries[0],entity:{kind:'quote_draft',id:idB,revision:7},label:'synthetic B'}]});
  if(command.action==='read_advisor_commerce_detail_v1')return Response.json(command.entity.id===idB?{...detail(),detail:{...draft(),target:{...draft().target,draftId:idB}}}:detail());
  if(command.action==='read_advisor_quote_components_v1')return Response.json({...components(command),quote:command.quote});
  throw Error('unexpected finite read-only command');
 });
 const old=createProductQuoteAdminController({runtime:f.runtime,clientId:client,request:f.request});t.after(()=>old.dispose());
 await old.refresh();await old.openDraft(draftId);assert.equal(old.getSnapshot().dirty,false);
 let next=null,entered=false;
 const stop=old.subscribe(()=>{
  if(entered||old.getSnapshot().preparation.body.note!=='first final A raw')return;
  entered=true;next=createProductQuoteAdminController({runtime:f.runtime,clientId:client,request:f.request});old.dispose();
 });t.after(stop);
 // No previous unsent edit exists when replacement construction observes cache.
 const oldEditReturned=old.setBody({...body(),note:'first final A raw'});
 assert.equal(entered,true);assert.ok(next);t.after(()=>next.dispose());
 assert.equal(old.getSnapshot().phase,'ended');assert.equal(next.getSnapshot().loaded,null);
 await next.refresh();await next.openDraft(idB);
 const loaded=next.getSnapshot();assert.equal(loaded.loaded.draft.target.draftId,idB);
 assert.equal(loaded.phase,'ready');assert.equal(loaded.pending,null);assert.equal(loaded.inputErrors.header,null);
 const accepted=next.setBody({...loaded.preparation.body,note:'deliberate current B edit'}),after=next.getSnapshot();
 const remount=createProductQuoteAdminController({runtime:f.runtime,clientId:client,request:f.request});t.after(()=>remount.dispose());
 // This is exactly the shared component's field-enablement predicate, read as
 // Source only. It is not a rendered/hydrated or accessibility acceptance.
 const sourceFieldsEnabled=after.phase==='ready'&&!after.pending&&after.available&&after.choosingProduct===null&&!after.choosingAddress;
 t.diagnostic(JSON.stringify({oldEditReturned,cookie:f.runtime.cookie.status,oldPhase:old.getSnapshot().phase,target:after.loaded.draft.target.draftId,accepted,phase:after.phase,error:after.error,pending:after.pending,sourceFieldsEnabled,unchangedSnapshot:after===loaded,retainedFinalA:remount.getSnapshot().preparation.body.note,nonReadCalls:f.calls.filter(x=>!x.command.action.startsWith('read_')).length}));
 // Either retain deliberate B work OR visibly block the context for recovery.
 // Do not demand adoption/erasure of another draft's retained final raw fields.
 assert.ok(accepted||!sourceFieldsEnabled||after.error!==null,'a current loaded B must not look editable while silently rejecting its valid edit');
});
