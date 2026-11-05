// Current7e6e consumer only. Actual Session/controller/cookie/transport/codecs,
// CLOSED synthetic READ envelopes. No financial write, AuthSQL, persistence,
// private-cache mutation, currentness facade or actual Root UI/browser claim.
import test from 'node:test';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
const {fixture,load,client,draftId,index,draft,detail,components,body}=await import(new URL('./w5-orders-commerce-admin-helper.mjs',import.meta.url));
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

// Canonical3805-byte W7 original is preserved inert; above only its helper URL
// binding changes. Current owner extensions below exercise
// explicit recovery; SSR is static source behavior, never hydration/typing.
const {deferred}=await import('./w5-orders-commerce-admin-helper.mjs');
async function firstHandoff(t){
 const f=await fixture(t),idB='e0000000-0000-4000-8000-000000000009';let held=null,failed=false;
 f.setReply(async command=>{
  if(command.action==='read_advisor_commerce_v1'){if(held){const h=held;held=null;h.enter.release();await h.release.promise;}return Response.json({...index(),entries:[...index().entries,{...index().entries[0],entity:{kind:'quote_draft',id:idB,revision:7},label:'synthetic B'}]});}
  if(command.action==='read_advisor_commerce_detail_v1')return failed?Response.json({code:'unavailable'},{status:503}):Response.json(command.entity.id===idB?{...detail(),detail:{...draft(),target:{...draft().target,draftId:idB}}}:detail());
  if(command.action==='read_advisor_quote_components_v1')return Response.json({...components(command),quote:command.quote});
  throw Error('unexpected non-read command');
 });
 function controller(){const c=createProductQuoteAdminController({runtime:f.runtime,clientId:client,request:f.request});t.after(()=>c.dispose());return c;}
 const old=controller();await old.refresh();await old.openDraft(draftId);let next=null,entered=false;
 old.subscribe(()=>{if(entered||old.getSnapshot().preparation.body.note!=='first retained A')return;entered=true;next=controller();old.dispose();});
 assert.equal(old.setBody({...body(),note:'first retained A'}),false);assert.ok(next);
 await next.refresh();await next.openDraft(idB);assert.equal(next.getSnapshot().loaded.draft.target.draftId,idB);
 assert.equal(next.getSnapshot().localEditConflict,true);assert.equal(next.getSnapshot().error,409);
 return {...f,old,next,idB,controller,holdRead(){const h={enter:deferred(),release:deferred()};held=h;return h;},failDetail(){failed=true;}};
}
async function renderRecovery(controller){
 const {fileURLToPath}=await import('node:url'),currentRoot=fileURLToPath(new URL('../../..',import.meta.url));
 const {mkdir,symlink,realpath}=await import('node:fs/promises'),{dirname}=await import('node:path'),{build}=await import('esbuild'),{createElement}=await import('react'),{renderToStaticMarkup}=await import('react-dom/server');
 const home=resolve(currentRoot,'.local-artifacts/w5-quote-admin-native-r8-20261105/ssr'),out=resolve(home,'runtime/ProductQuoteAdmin.mjs'),modules=resolve(currentRoot,'apps/portal/node_modules'),link=resolve(home,'node_modules');
 await mkdir(dirname(out),{recursive:true});try{await symlink(modules,link,'dir');}catch(e){if(e.code!=='EEXIST')throw e;}assert.equal(await realpath(link),await realpath(modules));
 await build({stdin:{contents:"export {ProductQuoteAdmin} from './features/orders/admin/ProductQuoteAdmin.tsx';export {OverlayProvider} from './ui/index.ts';",resolveDir:resolve(currentRoot,'apps/portal/src'),loader:'ts'},outfile:out,bundle:true,platform:'node',format:'esm',jsx:'automatic',packages:'external',loader:{'.css':'empty'},logLevel:'silent'});
 const m=await import(pathToFileURL(out));return renderToStaticMarkup(createElement(m.OverlayProvider,null,createElement(m.ProductQuoteAdmin,{controller})));
}
test('first-edit cache conflict has disabled fields and explicit read-only recovery before later B editing',async t=>{
 const f=await firstHandoff(t),before=f.calls.length,html=await renderRecovery(f.next);
 assert.match(html,/a retained local quote needs recovery/);assert.match(html,/recovering them replaces this form/);assert.match(html,/recover retained form/);assert.match(html,/<input[^>]*disabled=""/);assert.equal(f.calls.length,before,'SSR performs no reads or writes');
 assert.equal(f.next.setBody({...body(),note:'blocked B edit'}),false);
 assert.equal(await f.next.recoverLocalEdits(),true);let s=f.next.getSnapshot();
 assert.equal(s.loaded.draft.target.draftId,draftId);assert.equal(s.preparation.body.note,'first retained A');assert.equal(s.localEditConflict,false);assert.equal(s.dirty,true);
 assert.equal(f.next.setBody({...s.preparation.body,note:'deliberate recovered A edit'}),true);
 assert.equal(f.controller().getSnapshot().preparation.body.note,'deliberate recovered A edit');
 assert.equal(f.next.discardLocal(),true);await f.next.openDraft(f.idB);
 assert.equal(f.next.setBody({...body(),note:'deliberate B after recovery'}),true);
 assert.equal(f.controller().getSnapshot().preparation.body.note,'deliberate B after recovery');
 assert.equal(f.calls.some(x=>!x.command.action.startsWith('read_')),false);
});
test('retiring during explicit recovery joins its read without restoring a private view',async t=>{
 const f=await firstHandoff(t),h=f.holdRead();let recovery;
 try{recovery=f.next.recoverLocalEdits();await h.enter.promise;f.next.dispose();h.release.release();assert.equal(await recovery,false);assert.equal(f.next.getSnapshot().phase,'ended');assert.equal(f.next.getSnapshot().loaded,null);assert.equal(f.controller().getSnapshot().preparation.body.note,'first retained A');}
 finally{h.release.release();if(recovery)await Promise.allSettled([recovery]);}
 assert.equal(f.calls.some(x=>!x.command.action.startsWith('read_')),false);
});
test('unavailable canonical recovery retains raw A but cannot masquerade as a ready saved draft',async t=>{
 const f=await firstHandoff(t);f.failDetail();assert.equal(await f.next.recoverLocalEdits(),false);
 assert.equal(f.next.getSnapshot().loaded,null);assert.notEqual(f.next.getSnapshot().phase,'ready');
 assert.equal(f.next.setBody({...body(),note:'not accepted while unavailable'}),false);
 await f.next.saveDraft();assert.equal(f.controller().getSnapshot().preparation.body.note,'first retained A');
 assert.equal(f.calls.some(x=>!x.command.action.startsWith('read_')),false);
});
