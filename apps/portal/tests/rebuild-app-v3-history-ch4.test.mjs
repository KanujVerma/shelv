// Source/real controller/SSR/plain Window controls. These do not execute React
// mount effects, DOM, StrictMode or a browser. R3 retains that attributed RED.
import test from 'node:test';import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createClientComposition,createHistoryRestorationScope,createHistoryUpdateReader,deferClientHistoryRestoration} from '../src/app/client-composition.ts';
import {createPortalNavigator} from '../src/navigation/history.ts';
import {virtualNavigationWindow} from './rebuild-app-v3-history-helper.mjs';
import {fixture,row,uid,receipt,deferred} from './rebuild-history-restoration-helper.mjs';
import {noop} from './rebuild-history-helper.mjs';
async function setup(t){
 const f=await fixture(t),original=structuredClone(row(0));original.event.body.answers=[{goalId:'authored-goal',change:'same'}];original.event.body.photoIds=[uid(800)];
 f.data({version:2,parts:[[original]],revision:3});let fault=null;
 f.fault(async c=>{const out=await fault?.(c);if(out)return out;
  if(c.action==='read_client_plan_v3'){const v=f.view();if(c.version===1){v.plan.version=1;v.currentGuidance.snapshot.publication.version=1;v.currentGuidance.mode='historical_document';v.use.planProducts.forEach(p=>p.product.publication.version=1);}v.plan.content.goals[0].text=c.version===1?'ORIGINAL_GOAL_PUBLICATION_1':'CURRENT_GOAL_PUBLICATION_2';return Response.json(v);}
  if(['submit_goal_report_v1','amend_report_v1'].includes(c.action))return Response.json(receipt(c));return null;
 });
 const c=createClientComposition(f.runtime),h=c.history,w=virtualNavigationWindow('/history/new'),boundary=f.runtime.getSnapshot().boundary,frames=[],effects=[];
 w.win.requestAnimationFrame=fn=>{frames.push(fn);return frames.length;};w.win.scrollTo=({top})=>effects.push(['scroll',top]);w.win.document.querySelector=()=>({focus:()=>effects.push(['focus'])});
 const navigator=createPortalNavigator(w.win,{scopeKey:boundary.key,deferRestoration:deferClientHistoryRestoration}),stop=navigator.subscribe(()=>{});
 const scope=createHistoryRestorationScope({controller:h,boundary,navigator,win:w.win}),detach=scope.attach();let result=null;
 const reader=createHistoryUpdateReader(h,scope,r=>{result=r;});t.after(()=>{reader.dispose();detach();c.dispose();stop();navigator.dispose();});
 const admitted=()=>reader.isAdmitted?.()??(!!result&&h.restoration.isCurrent(result));
 const autoStart=()=>reader.startReport?reader.startReport():h.startReport();
 return {f,c,h,w,boundary,navigator,scope,reader,frames,effects,original,admitted,autoStart,get result(){return result;},fault(fn){fault=fn;},html:()=>f.html(h,{screen:'update'}),flush:()=>frames.splice(0).forEach(fn=>fn())};
}
function note(h,text='ORIGINAL_PENDING_A'){const i=structuredClone(h.getSnapshot().intent);i.body.notes=text;h.edit(i);}
test('CH4 intended host requirement: admission survives actual in-flight A while viewport witness expires',async t=>{
 const x=await setup(t);await x.reader.read();assert.equal(x.admitted(),true);note(x.h);const held=deferred(),entered=deferred();t.after(()=>held.resolve(Response.json({code:'unavailable'},{status:503})));x.fault(c=>{if(c.action==='submit_goal_report_v1'){entered.resolve();return held.promise;}});
 const work=x.h.submit();await entered.promise;const pending=x.h.getSnapshot().pending;assert.ok(pending);assert.equal(x.h.restoration.isCurrent(x.result),false,'keep W4 pending-reference fence');assert.equal(x.admitted(),true,'pending must not remove the admitted module');assert.ok(x.html().includes('ORIGINAL_PENDING_A'));x.scope.onReady(x.result);x.flush();assert.deepEqual(x.effects,[]);held.resolve(Response.json(receipt(pending)));await work;assert.equal(x.admitted(),true);
});
for(const kind of ['new','amendment'])test('CH4 '+kind+'200 retains original receipt/intent through automatic ready and fresh-read entry',async t=>{
 const x=await setup(t);if(kind==='amendment'){await x.h.load();await x.h.startAmendment(x.original.event);const i=structuredClone(x.h.getSnapshot().intent);i.reason='correction source check';x.h.edit(i);}
 await x.reader.read();if(kind==='new')note(x.h,'NEW_REPORT_ACK_CANARY');const intent=x.h.getSnapshot().intent;await x.h.submit();const s=x.h.getSnapshot();assert.equal(s.mutation,'confirmed');const ack=s.receipt;x.autoStart();await x.reader.read();x.autoStart();assert.equal(x.h.getSnapshot().receipt,ack,'automatic readiness must not start another draft');assert.equal(x.h.getSnapshot().intent,intent);assert.equal(x.admitted(),true);assert.ok(x.html().includes(kind==='new'?'update recorded':'correction recorded'));
 const command=x.f.calls.find(v=>v.command.action===(kind==='new'?'submit_goal_report_v1':'amend_report_v1')).command;
 if(kind==='amendment'){assert.equal(command.replacement.body.publication.version,1);assert.equal(command.expectedReportRevision,3);assert.equal(command.expectedAmendmentHeadId,null);assert.deepEqual(command.replacement.body.photoIds,[uid(800)]);assert.ok(x.html().includes('ORIGINAL_GOAL_PUBLICATION_1'));}
 const before=x.f.calls.length;x.h.startReport();assert.equal(x.h.getSnapshot().receipt,null,'a separate deliberate real start may create another draft');assert.equal(x.h.getSnapshot().intent.kind,'new');assert.equal(x.h.getSnapshot().intent.body.publication.version,2);assert.equal(x.f.calls.length,before);
});
for(const fault of ['503','lost','malformed'])test('CH4 '+fault+' retains admission, exact A/status/retry and original private body',async t=>{
 const x=await setup(t);await x.reader.read();note(x.h);x.fault(c=>{if(c.action==='submit_goal_report_v1'){if(fault==='lost')throw Error('finite lost response');return fault==='503'?Response.json({code:'unavailable'},{status:503}):Response.json({unexpected:'malformed response'});}});await x.h.submit();const pending=x.h.getSnapshot().pending,wire=JSON.stringify(pending);assert.ok(pending);assert.equal(x.admitted(),true);assert.equal(x.h.restoration.isCurrent(x.result),false);assert.ok(x.html().includes('check update status'));assert.ok(x.html().includes('retry exact update'));assert.ok(x.html().includes('ORIGINAL_PENDING_A'));x.autoStart();await x.f.runtime.restore();await x.h.retryExact();const writes=x.f.calls.filter(v=>v.command.action==='submit_goal_report_v1');assert.equal(writes.length,2);assert.equal(writes[0].wire,writes[1].wire);assert.equal(writes[1].wire,wire);x.fault(c=>c.action==='request_status_v1'?Response.json({status:'committed',receipt:receipt(pending)}):null);await x.f.runtime.restore();await x.h.checkStatus();assert.equal(x.h.getSnapshot().pending,null);x.autoStart();assert.equal(x.h.getSnapshot().mutation,'confirmed');assert.equal(x.admitted(),true);assert.ok(x.html().includes('update recorded'));
});
test('CH4 no observation preserves truthful feedback until a deliberate edit',async t=>{
 const x=await setup(t);await x.reader.read();x.fault(c=>c.action==='submit_goal_report_v1'?Response.json(noop(c)):null);await x.h.submit();assert.equal(x.h.getSnapshot().mutation,'no_observation');const intent=x.h.getSnapshot().intent;x.autoStart();await x.reader.read();x.autoStart();assert.equal(x.h.getSnapshot().intent,intent);assert.ok(x.html().includes('nothing was sent'));note(x.h,'deliberate new observation');assert.equal(x.h.getSnapshot().mutation,'idle');assert.equal(x.admitted(),true);
});
test('CH4 current403 spends admission and clears readable projection while preserving lawful pending A',async t=>{
 const x=await setup(t);await x.reader.read();note(x.h);x.fault(c=>c.action==='submit_goal_report_v1'?Response.json({code:'unavailable'},{status:503}):null);await x.h.submit();await x.f.runtime.restore();const wire=JSON.stringify(x.h.getSnapshot().pending);x.fault(c=>c.action==='read_care_history_v1'?Response.json({code:'forbidden'},{status:403}):null);await x.reader.read();assert.equal(x.admitted(),false);assert.equal(x.h.getSnapshot().view,null);assert.deepEqual(x.h.getSnapshot().pages,[]);assert.equal(JSON.stringify(x.h.getSnapshot().pending),wire);assert.ok(!x.html().includes('PRIVATE_RESTORATION_ROW'));x.fault(null);await x.reader.read();assert.equal(x.admitted(),true);assert.equal(JSON.stringify(x.h.getSnapshot().pending),wire);assert.equal(x.h.getSnapshot().needsReview,true);
});
for(const change of ['route','same-entry-path','scope-retire','reader-dispose','owner','csrf','generation','logout','context'])test('CH4 admission cannot survive '+change,async t=>{
 const x=await setup(t);await x.reader.read();assert.equal(x.admitted(),true);x.scope.onReady(x.result);
 if(change==='route')x.navigator.navigate({name:'history'});else if(change==='same-entry-path')x.navigator.navigate({name:'history-new'});else if(change==='scope-retire')x.scope.retire();else if(change==='reader-dispose')x.reader.dispose();else if(change==='logout')await x.f.runtime.signOut();else if(change==='context')x.h.setContext({session:x.boundary,mode:'historical',port:x.f.port});else{x.f.login(change==='generation'?{generation:2}:change==='owner'?{ownerId:uid(99000)}:{csrf:'next-real-boundary'});await x.f.runtime.restore();}
 assert.equal(x.admitted(),false);const calls=x.f.calls.length;await x.reader.read();assert.equal(x.f.calls.length,calls);x.flush();assert.deepEqual(x.effects,[]);
});
test('CH4 admitted host gate is separate from the immutable viewport result in actual App source',async()=>{
 const source=await readFile(new URL('../src/app/ClientHistory.tsx',import.meta.url),'utf8'),update=source.slice(source.indexOf('function HistoryUpdate('),source.indexOf('function HistoryEntry('));
 assert.ok(update.includes('reader?.isAdmitted()'),'actual App must mount from its reader-owned admission');assert.ok(!/const current=.*isCurrent\(ready.result\)/.test(update),'original witness must not continuously govern mounting');assert.ok(update.includes('appScope.onReady('),'actual canonical viewport still uses the matching result');
});
test('CH4 an initial admission query cannot open the module or consume its legitimate fresh reader',async t=>{
 const x=await setup(t);assert.equal(x.admitted(),false);assert.equal(x.h.getSnapshot().view,null);await x.reader.read();assert.equal(x.admitted(),true);assert.ok(Object.isFrozen(x.result));
});
test('CH4 positive status A cannot acknowledge a changed current clinical basis or replay viewport',async t=>{
 const x=await setup(t);await x.reader.read();note(x.h);x.fault(c=>c.action==='submit_goal_report_v1'?Response.json({code:'unavailable'},{status:503}):null);await x.h.submit();const pending=x.h.getSnapshot().pending,wire=JSON.stringify(pending);await x.f.runtime.restore();x.f.data({access:'read_only'});x.fault(null);await x.reader.read();assert.equal(x.admitted(),true);assert.ok(x.html().includes('read-only record'));x.f.data({access:'active',manifestHash:'b'.repeat(64),version:3});await x.reader.read();assert.equal(x.admitted(),true);assert.equal(x.h.getSnapshot().needsReview,true);const result=x.result;x.scope.onReady(result);x.fault(c=>c.action==='request_status_v1'?Response.json({status:'committed',receipt:receipt(pending)}):null);await x.h.checkStatus();assert.equal(x.h.getSnapshot().pending,null);assert.equal(x.h.getSnapshot().needsReview,true);assert.equal(x.h.getSnapshot().intent.body.publication.version,2);assert.equal(x.h.restoration.isCurrent(result),false);assert.equal(x.admitted(),true);x.autoStart();x.flush();assert.deepEqual(x.effects,[]);assert.equal(JSON.stringify(pending),wire);const n=x.f.calls.length;await x.h.submit();assert.equal(x.f.calls.length,n);assert.ok(x.html().includes('review the current record'));
});
test('CH4 offline read and reconnect do not replace the admitted original intent',async t=>{
 const x=await setup(t);await x.reader.read();note(x.h,'UNSENT_RECONNECT_BODY');const intent=x.h.getSnapshot().intent;x.fault(c=>c.action==='read_client_plan_v3'?Response.json({code:'unavailable'},{status:503}):null);await x.reader.read();assert.equal(x.admitted(),true);assert.equal(x.h.getSnapshot().phase,'error');assert.equal(x.h.getSnapshot().intent,intent);assert.ok(x.html().includes('your unsent update is retained'));await x.f.runtime.restore();x.fault(null);await x.reader.read();assert.equal(x.admitted(),true);assert.equal(x.h.getSnapshot().intent,intent);assert.ok(x.html().includes('UNSENT_RECONNECT_BODY'));
});
test('CH4 old reader cleanup cannot spend the replacement reader admission or queued ready',async t=>{
 const x=await setup(t);await x.reader.read();const next=createHistoryUpdateReader(x.h,x.scope,r=>x.scope.onReady(r));t.after(()=>next.dispose());await next.read();x.reader.dispose();assert.equal(x.admitted(),false);assert.equal(next.isAdmitted(),true);x.reader.dispose();assert.equal(next.isAdmitted(),true);next.startReport();assert.ok(x.h.getSnapshot().intent);x.flush();assert.deepEqual(x.effects,[['focus'],['scroll',0]]);
});
test('CH4 real401 retires source, private intent and canonical deferred work',async t=>{
 const x=await setup(t);await x.reader.read();note(x.h);x.scope.onReady(x.result);x.fault(c=>c.action==='read_care_history_v1'?Response.json({code:'session_ended'},{status:401}):null);await x.reader.read();assert.equal(x.admitted(),false);assert.equal(x.boundary.isCurrent(),false);assert.equal(x.h.getSnapshot().view,null);assert.equal(x.h.getSnapshot().intent,null);x.flush();assert.deepEqual(x.effects,[]);
});
