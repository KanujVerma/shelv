// Current c56 Source only. Actual retained Session/cookie/transport/codecs,
// CLOSED synthetic READ envelopes. No write, persistence, financial authority,
// private-payload, Root UI/hydration or genuine user reachability claim.
import test from 'node:test';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
const {fixture,load,client,draftId,index,draft,detail,components,body}=await import(new URL('./w5-orders-commerce-admin-helper.mjs',import.meta.url));
const {createProductQuoteAdminController}=await load('apps/portal/src/features/orders/admin/controller.ts');

test('replacement constructed during old final edit can persist its later B edits after old terminal cleanup',async t=>{
 const f=await fixture(t),idB='e0000000-0000-4000-8000-000000000009';
 f.setReply(async command=>{
  if(command.action==='read_advisor_commerce_v1')return Response.json({...index(),entries:[...index().entries,{...index().entries[0],entity:{kind:'quote_draft',id:idB,revision:7},label:'synthetic B'}]});
  if(command.action==='read_advisor_commerce_detail_v1')return Response.json(command.entity.id===idB?{...detail(),detail:{...draft(),target:{...draft().target,draftId:idB}}}:detail());
  if(command.action==='read_advisor_quote_components_v1')return Response.json({...components(command),quote:command.quote});
  throw Error('unexpected finite read-only command');
 });
 const old=createProductQuoteAdminController({runtime:f.runtime,clientId:client,request:f.request});t.after(()=>old.dispose());
 await old.refresh();await old.openDraft(draftId);
 assert.equal(old.setBody({...body(),note:'previous A cached edit'}),true);
 let next=null,entered=false,initialReplacementNote=null;
 const stop=old.subscribe(()=>{
  if(entered||old.getSnapshot().preparation.body.note!=='final A edit at handoff')return;
  entered=true;
  // Normal public observation: construct replacement before old effect cleanup.
  // Old terminal cleanup may retain its final raw edit. No old API runs later.
  next=createProductQuoteAdminController({runtime:f.runtime,clientId:client,request:f.request});
  initialReplacementNote=next.getSnapshot().preparation.body.note;
  old.dispose();
 });t.after(stop);
 const oldEditReturned=old.setBody({...body(),note:'final A edit at handoff'});
 assert.equal(entered,true);assert.ok(next);t.after(()=>next.dispose());
 assert.equal(old.getSnapshot().phase,'ended');
 assert.equal(initialReplacementNote,'previous A cached edit');
 await next.refresh();assert.equal(next.discardLocal(),true);
 await next.openDraft(idB);assert.equal(next.getSnapshot().loaded.draft.target.draftId,idB);
 assert.equal(next.setBody({...body(),note:'current replacement B edit'}),true);
 assert.equal(next.getSnapshot().preparation.body.note,'current replacement B edit');
 const remount=createProductQuoteAdminController({runtime:f.runtime,clientId:client,request:f.request});t.after(()=>remount.dispose());
 const recovered=remount.getSnapshot();
 t.diagnostic(JSON.stringify({oldEditReturned,cookie:f.runtime.cookie.status,oldPhase:old.getSnapshot().phase,initialReplacementNote,currentDraft:next.getSnapshot().loaded.draft.target.draftId,currentNote:next.getSnapshot().preparation.body.note,recoveredNote:recovered.preparation.body.note,nonReadCalls:f.calls.filter(x=>!x.command.action.startsWith('read_')).length}));
 assert.equal(recovered.preparation.body.note,'current replacement B edit','current replacement must not permanently lose cache custody after old final-edit cleanup');
});

// The W7 program above changes only its helper URL binding; canonical inert
// bytes remain preserved separately. These are current owner
// extensions on the R6 successor, never execution of stopped c56.
async function handoffFixture(t){
 const f=await fixture(t),idB='e0000000-0000-4000-8000-000000000009';
 f.setReply(async command=>{
  if(command.action==='read_advisor_commerce_v1')return Response.json({...index(),entries:[...index().entries,{...index().entries[0],entity:{kind:'quote_draft',id:idB,revision:7},label:'synthetic B'}]});
  if(command.action==='read_advisor_commerce_detail_v1')return Response.json(command.entity.id===idB?{...detail(),detail:{...draft(),target:{...draft().target,draftId:idB}}}:detail());
  if(command.action==='read_advisor_quote_components_v1')return Response.json({...components(command),quote:command.quote});
  throw Error('unexpected finite read-only command');
 });
 function controller(){const c=createProductQuoteAdminController({runtime:f.runtime,clientId:client,request:f.request});t.after(()=>c.dispose());return c;}
 const old=controller();await old.refresh();await old.openDraft(draftId);
 assert.equal(old.setBody({...body(),note:'previous A cached edit'}),true);
 return {...f,old,idB,controller};
}
test('same-draft final raw fields are reconciled without converting partial money into a fact',async t=>{
 const f=await handoffFixture(t);let next=null,entered=false;
 f.old.subscribe(()=>{
  if(entered||f.old.getSnapshot().inputs.header.note!=='final incomplete A')return;
  entered=true;next=f.controller();f.old.dispose();
 });
 assert.equal(f.old.setHeaderInputs({...f.old.getSnapshot().inputs.header,note:'final incomplete A',taxAmount:'1.'}),false);
 assert.ok(next);await next.refresh();
 assert.equal(next.getSnapshot().inputs.header.note,'final incomplete A');
 assert.equal(next.getSnapshot().inputs.header.taxAmount,'1.');
 assert.notEqual(next.getSnapshot().inputErrors.header,null);
 assert.equal(next.getSnapshot().dirty,true);next.dispose();
 const restored=f.controller();assert.equal(restored.getSnapshot().inputs.header.taxAmount,'1.');
 assert.equal(restored.getSnapshot().inputs.header.note,'final incomplete A');
 assert.equal(f.calls.some(x=>!x.command.action.startsWith('read_')),false);
});
test('authored old A cannot accept a mutation over the actual newer B cache',async t=>{
 const f=await handoffFixture(t),next=f.controller();await next.refresh();
 assert.equal(next.discardLocal(),true);await next.openDraft(f.idB);
 assert.equal(next.setBody({...body(),note:'new B owns cache'}),true);
 const before=f.old.getSnapshot();
 assert.equal(f.old.setBody({...body(),note:'stale A attempted overwrite'}),false);
 assert.equal(f.old.getSnapshot().localEditConflict,true);assert.equal(f.old.getSnapshot().error,409);assert.equal(f.old.getSnapshot().preparation,before.preparation);
 assert.equal(f.controller().getSnapshot().preparation.body.note,'new B owns cache');
 assert.equal(next.setBody({...body(),note:'new B still editable'}),true);f.old.dispose();
 assert.equal(f.controller().getSnapshot().preparation.body.note,'new B still editable');
 assert.equal(f.calls.some(x=>!x.command.action.startsWith('read_')),false);
});
test('a completed replacement read observes final handoff before deliberate editing',async t=>{
 const f=await handoffFixture(t);let next=null,refresh=null,entered=false;
 f.old.subscribe(()=>{
  if(entered||f.old.getSnapshot().preparation.body.note!=='final A arrived after read start')return;
  entered=true;next=f.controller();refresh=next.refresh();f.old.dispose();
 });
 assert.equal(f.old.setBody({...body(),note:'final A arrived after read start'}),false);
 await refresh;assert.ok(next);assert.equal(next.getSnapshot().phase,'ready');
 assert.equal(next.getSnapshot().preparation.body.note,'final A arrived after read start');
 assert.equal(next.getSnapshot().localEditConflict,false);
 assert.equal(next.setBody({...next.getSnapshot().preparation.body,note:'deliberate current A'}),true);
 assert.equal(f.controller().getSnapshot().preparation.body.note,'deliberate current A');
 assert.equal(f.calls.some(x=>!x.command.action.startsWith('read_')),false);
});
