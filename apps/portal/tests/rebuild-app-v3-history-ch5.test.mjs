// CH5 source controls: actual Session/cookie/raw Review/Root/W4/SSR and a plain
// Window. No browser, DOM, resource/provider or successful-port substitution.
import test from 'node:test';import assert from 'node:assert/strict';
import {createClientComposition,createHistoryRestorationScope,createHistoryUpdateReader,deferClientHistoryRestoration} from '../src/app/client-composition.ts';
import {createPortalNavigator} from '../src/navigation/history.ts';
import {fixture,row,uid,deferred} from './rebuild-history-restoration-helper.mjs';
import {virtualNavigationWindow} from './rebuild-app-v3-history-helper.mjs';
async function host(t,f){
 const c=createClientComposition(f.runtime),h=c.history,boundary=f.runtime.getSnapshot().boundary,w=virtualNavigationWindow('/history/new'),frames=[],effects=[],delivered=[];
 const navigator=createPortalNavigator(w.win,{scopeKey:boundary.key,deferRestoration:deferClientHistoryRestoration}),off=navigator.subscribe(()=>{});
 w.win.requestAnimationFrame=fn=>{frames.push(fn);return frames.length;};w.win.document.querySelector=()=>({focus:()=>effects.push('focus')});w.win.scrollTo=()=>effects.push('scroll');
 const scope=createHistoryRestorationScope({controller:h,boundary,navigator,win:w.win}),detach=scope.attach();
 const reader=createHistoryUpdateReader(h,scope,result=>{delivered.push(result);});
 t.after(()=>{reader.dispose();detach();scope.retire();off();navigator.dispose();c.dispose();});
 return{f,c,h,boundary,w,navigator,scope,reader,delivered,effects,flush(){frames.splice(0).forEach(fn=>fn());}};
}
async function saved(t,f){const c=createClientComposition(f.runtime);await f.all(c.history);assert.ok(c.history.restoration.capture({kind:'update'}));c.dispose();return host(t,f);}
for(const failure of ['plan503','history503','history403','continuation503'])test('CH5 '+failure+' is applicable but cannot publish initial data readiness',async t=>{
 const f=await fixture(t,{count:3}),x=failure==='continuation503'?await saved(t,f):await host(t,f);
 f.fault(cmd=>(failure==='plan503'?cmd.action==='read_client_plan_v3':cmd.action==='read_care_history_v1'&&(failure!=='continuation503'||cmd.cursor!==null))?Response.json({code:failure==='history403'?'forbidden':'unavailable'},{status:failure==='history403'?403:503}):null);
 const n=f.calls.length;await x.reader.read();const s=x.h.getSnapshot(),result=s.timeline.result;
 assert.equal(x.h.restoration.isCurrent(result),true,'W4 applicability remains unchanged');assert.ok(Object.isFrozen(result));assert.equal(s.readError,true);assert.equal(x.reader.isAdmitted(),false);assert.deepEqual(x.delivered,[],'an error witness must never become App onReady data');assert.equal(s.intent,null);assert.equal(f.calls.length-n,failure==='plan503'?1:failure==='continuation503'?3:2,'no hidden automatic retry');x.flush();assert.deepEqual(x.effects,[]);
 assert.ok(f.html(x.h,{screen:'update'}).includes(failure==='history403'?'record access denied':failure==='continuation503'?'history is incomplete':'your record is unavailable'));
});
for(const [label,options]of[['empty',{count:0}],['ordinary first page',{count:3}]])test('CH5 '+label+' has real successful data without requiring all records',async t=>{
 const f=await fixture(t,options);if(label==='empty')f.data({parts:[[]]});const x=await host(t,f);await x.reader.read();const s=x.h.getSnapshot();assert.equal(x.reader.isAdmitted(),true);assert.equal(x.delivered.length,1);assert.equal(x.delivered[0].state,'fresh');assert.equal(s.pages.length,1);assert.equal(s.intent.kind,'new');assert.equal(s.intent.body.publication.version,1);assert.ok(s.view.plan.content.goals.length>0);assert.equal(f.calls.length,2);if(label!=='empty')assert.ok(s.pages[0].nextCursor);assert.ok(f.html(x.h,{screen:'update'}).includes('send update'));x.flush();assert.deepEqual(x.effects,[],'data alone is not a committed viewport signal');
});
test('CH5 declared saved extent is freshly reconstructed before admission with all original refs',async t=>{
 const f=await fixture(t,{count:3}),x=await saved(t,f);f.data({salt:45000});const n=f.calls.length;await x.reader.read();assert.equal(x.reader.isAdmitted(),true);assert.equal(x.delivered[0].state,'restored');assert.equal(x.delivered[0].loadedEntries,3);assert.equal(x.h.getSnapshot().pages.length,3);assert.deepEqual(x.h.getSnapshot().pages.flatMap(p=>p.entries.map(e=>e.event.id)),[row(0).event.id,row(1).event.id,row(2).event.id]);assert.equal(f.calls.length-n,4);assert.equal(x.delivered[0].basis.snapshot.manifestHash,'a'.repeat(64));
});
test('CH5 changed-basis fallback admits its successful actual current page without restoring old extent',async t=>{
 const f=await fixture(t,{count:3}),x=await saved(t,f);f.data({manifestHash:'b'.repeat(64)});const n=f.calls.length;await x.reader.read();assert.equal(x.reader.isAdmitted(),true);assert.equal(x.delivered[0].state,'fallback');assert.equal(x.delivered[0].reason,'basis_changed');assert.equal(x.delivered[0].basis.snapshot.manifestHash,'b'.repeat(64));assert.equal(x.h.getSnapshot().readError,false);assert.equal(x.h.getSnapshot().pages.length,1);assert.ok(x.h.getSnapshot().pages[0].nextCursor);assert.equal(f.calls.length-n,2);
});
test('CH5 complete read-only data is admitted without introducing write capability',async t=>{
 const f=await fixture(t,{count:0});f.data({parts:[[]],access:'read_only'});const x=await host(t,f);await x.reader.read();assert.equal(x.reader.isAdmitted(),true);assert.equal(x.h.getSnapshot().intent,null);assert.ok(f.html(x.h,{screen:'update'}).includes('read-only record'));const n=f.calls.length;x.reader.startReport();await x.h.submit();assert.equal(f.calls.length,n);
});
for(const corrupt of ['manifest','head','report-ref'])test('CH5 strict raw '+corrupt+' failure cannot admit missing or inconsistent basis',async t=>{
 const f=await fixture(t),x=await host(t,f);f.fault(cmd=>{if(corrupt==='manifest'&&cmd.action==='read_client_plan_v3'){const v=f.view();v.currentGuidance.snapshot.manifestHash='invalid-manifest';return Response.json(v);}if(cmd.action==='read_care_history_v1'&&corrupt!=='manifest'){const p=f.page(cmd);if(corrupt==='head')p.heads.reportHead++;else p.entries[0].event.id='invalid-report-reference';return Response.json(p);}return null;});await x.reader.read();assert.equal(x.reader.isAdmitted(),false);assert.deepEqual(x.delivered,[]);assert.equal(x.h.getSnapshot().readError,true);assert.equal(x.h.getSnapshot().view,null);
});
for(const change of ['error','partial','denial','filter','scope','dispose'])test('CH5 reentrant '+change+' notification cannot admit its superseded ready witness',async t=>{
 const f=await fixture(t),x=await host(t,f);let changed=false,next=null;const off=x.h.subscribe(()=>{if(changed||!x.h.getSnapshot().timeline.result)return;changed=true;if(change==='error'||change==='denial'){f.fault(cmd=>cmd.action==='read_care_history_v1'?Response.json({code:change==='denial'?'forbidden':'unavailable'},{status:change==='denial'?403:503}):null);next=x.h.load();}else if(change==='partial'){f.fault(cmd=>cmd.action==='read_care_history_v1'&&cmd.cursor!==null?Response.json({code:'unavailable'},{status:503}):null);next=x.h.loadMore();}else if(change==='filter')x.h.restoration.setFilter('changes');else if(change==='scope')x.scope.retire();else x.reader.dispose();});t.after(off);await x.reader.read();await next;assert.equal(changed,true);assert.equal(x.reader.isAdmitted(),false);assert.deepEqual(x.delivered,[]);x.flush();assert.deepEqual(x.effects,[]);
});
test('CH5 later unavailable result preserves earned admission and intent but emits no new ready callback',async t=>{
 const f=await fixture(t),x=await host(t,f);await x.reader.read();const intent=x.h.getSnapshot().intent,ready=x.delivered[0];f.fault(cmd=>cmd.action==='read_client_plan_v3'?Response.json({code:'unavailable'},{status:503}):null);await x.reader.read();assert.equal(x.reader.isAdmitted(),true);assert.equal(x.h.getSnapshot().intent,intent);assert.equal(x.h.getSnapshot().phase,'error');assert.equal(x.h.restoration.isCurrent(x.h.getSnapshot().timeline.result),true);assert.deepEqual(x.delivered,[ready],'later errors do not masquerade as newly committed data');
});
test('CH5 old held initial read cannot admit or notify after an actual new owner boundary',async t=>{
 const f=await fixture(t),x=await host(t,f),held=deferred(),entered=deferred();t.after(()=>held.resolve(Response.json(f.view())));f.fault(cmd=>{if(cmd.action==='read_client_plan_v3'){entered.resolve();return held.promise;}return null;});const work=x.reader.read();await entered.promise;f.login({ownerId:uid(90000)});await f.runtime.restore();held.resolve(Response.json(f.view()));await work;assert.equal(x.boundary.isCurrent(),false);assert.equal(x.reader.isAdmitted(),false);assert.deepEqual(x.delivered,[]);assert.equal(x.h.getSnapshot().view,null);x.flush();assert.deepEqual(x.effects,[]);
});
test('CH5 saved partial prefix earns admission after its declared extent without exhausting later pages',async t=>{
 const f=await fixture(t,{count:4}),prior=createClientComposition(f.runtime);await prior.history.load();await prior.history.loadMore();const point=prior.history.restoration.capture({kind:'update'});assert.equal(point.complete,false);assert.equal(point.entryKeys.length,2);prior.dispose();const x=await host(t,f);f.data({salt:47000});const n=f.calls.length;await x.reader.read();assert.equal(x.reader.isAdmitted(),true);assert.equal(x.delivered[0].state,'restored');assert.equal(x.delivered[0].loadedEntries,2);assert.equal(x.h.getSnapshot().pages.length,2);assert.ok(x.h.getSnapshot().pages.at(-1).nextCursor);assert.equal(f.calls.length-n,3);
});
test('CH5 a later partial reconstruction retains earned admission and original intent without a new data-ready callback',async t=>{
 const f=await fixture(t,{count:3}),x=await host(t,f);await x.reader.read();while(x.h.getSnapshot().pages.at(-1).nextCursor)await x.h.loadMore();const intent=structuredClone(x.h.getSnapshot().intent);intent.body.notes='PREVIOUSLY_ADMITTED_EXACT_BODY';x.h.edit(intent);const retained=x.h.getSnapshot().intent;assert.ok(x.h.restoration.capture({kind:'update'}));f.fault(cmd=>cmd.action==='read_care_history_v1'&&cmd.cursor!==null?Response.json({code:'unavailable'},{status:503}):null);await x.reader.read();assert.equal(x.h.getSnapshot().phase,'ready');assert.equal(x.h.getSnapshot().readError,true);assert.equal(x.h.getSnapshot().timeline.result.reason,'page_read_failed');assert.equal(x.reader.isAdmitted(),true);assert.equal(x.h.getSnapshot().intent,retained);assert.equal(x.delivered.length,1);assert.ok(f.html(x.h,{screen:'update'}).includes('PREVIOUSLY_ADMITTED_EXACT_BODY'));const n=f.calls.length;await x.h.submit();assert.equal(f.calls.length,n);
});
