import test from 'node:test';
import assert from 'node:assert/strict';
import {createClientPlanController} from '../src/app/client-state.ts';
import {createClientPorts} from '../src/app/ports.ts';
import {createClientGuidancePort} from '../src/features/plan/guidancePort.ts';
import {createClientReviewRequest} from '../src/app/review-request.ts';
import {session,view,page,renderer,renderClient} from './rebuild-app-v3-history-helper.mjs';
const api=await import('../src/app/client-composition.ts').catch(()=>({}));
const m=await renderer();
test('actual App exports a creation-bound V3 and History activation seam without eager fetch',async t=>{
 assert.equal(typeof api.createClientComposition,'function');const f=await session(t),c=api.createClientComposition(f.runtime);t.after(()=>c.dispose());assert.equal(f.calls.length,0);
 await c.controller.refresh();assert.deepEqual(f.calls.map(c=>[c.url,c.command.action]),[['/api/client/reviews','read_client_plan_v3']]);assert.equal(c.controller.getSnapshot().view.schemaVersion,3);
 await c.history.load();assert.deepEqual(f.calls.slice(1).map(c=>c.command.action),['read_client_plan_v3','read_care_history_v1']);assert.equal(c.history.getSnapshot().phase,'ready');
});
test('canonical V3 care URLs compose forms in actual ClientContent',async t=>{
 const f=await session(t),boundary=f.runtime.getSnapshot().boundary,ports={...createClientPorts(f.runtime,{care:true}),review:createClientGuidancePort({request:createClientReviewRequest(f.runtime),session:boundary,mode:'client'})},controller=createClientPlanController(boundary,ports,{readVersion:3});t.after(()=>controller.dispose());await controller.refresh();
 const text=renderClient(m,{boundary,ports,controller},{name:'report-use',routine:'morning'});assert.match(text,/what changed\?/);assert.doesNotMatch(text,/this page is not connected yet/);
});
test('current full V3 read403 retires readable view and a late accepted callback',async t=>{
 const f=await session(t),boundary=f.runtime.getSnapshot().boundary,ports={...createClientPorts(f.runtime),review:createClientGuidancePort({request:createClientReviewRequest(f.runtime),session:boundary,mode:'client'})},c=createClientPlanController(boundary,ports,{readVersion:3});t.after(()=>c.dispose());await c.refresh();const old=c.getSnapshot().view;
 f.set(()=>Response.json({code:'forbidden'},{status:403}));await c.refresh();assert.equal(c.getSnapshot().error,403);assert.equal(c.getSnapshot().view,null);c.accept(old);assert.equal(c.getSnapshot().view,null);
});
test('accepted canonical V3 object retains original identity while downgrade refuses',async t=>{
 const f=await session(t),boundary=f.runtime.getSnapshot().boundary,c=createClientPlanController(boundary,createClientPorts(f.runtime));t.after(()=>c.dispose());const v=view();c.accept(v);assert.equal(c.getSnapshot().view,v);assert.throws(()=>c.accept({...v,schemaVersion:2,currentGuidance:undefined}),/invalid_view/);
});

test('actual App mounts source History on canonical C04 and C05 without unavailable fallback',async t=>{
 const f=await session(t),c=api.createClientComposition(f.runtime);t.after(()=>c.dispose());await c.history.load();
 assert.equal(typeof m.ClientHistoryContent,'function');
 for(const route of [{name:'history'},{name:'history-new'}]){
  if(route.name==='history-new')c.history.startReport();
  const nav={getSnapshot:()=>route.name==='history-new'?'/history/new':'/history',subscribe:()=>()=>{},navigate(){},back(){},backDestination:()=>({name:'history'})};
  const html=m.renderToStaticMarkup(m.createElement(m.OverlayProvider,null,m.createElement(m.NavigationProvider,{navigator:nav},m.createElement(m.ClientHistoryContent,{connection:c,boundary:f.runtime.getSnapshot().boundary,route,onSignOut(){}}))));
  assert.ok(!html.includes('this page is not connected yet'));assert.ok(html.includes(route.name==='history'?'your updates, our decisions':'send update'));
 }
});
test('History navigation maps only safe semantic routes and uses the canonical Back owner',async()=>{
 assert.equal(typeof api.createHistoryNavigation,'function');const calls=[],nav={navigate:r=>calls.push(r),back:()=>calls.push('back')};const n=api.createHistoryNavigation(nav);
 n.openUpdate();n.openVersion(2);n.back();assert.deepEqual(calls,[{name:'history-new'},{name:'history-version',version:'2'},'back']);
 for(const value of [0,-1,1.5,Infinity,Number.MAX_SAFE_INTEGER+1])assert.throws(()=>n.openVersion(value));
});
test('selected historical version uses actual strict Review read and no fabricated current document',async t=>{
 const f=await session(t,c=>{const v=view();if(c.action==='read_client_plan_v3'&&c.version===1){v.currentGuidance.mode='historical_document';v.currentGuidance.snapshot.currentPublication.version=2;return v;}return page();}),c=api.createClientComposition(f.runtime);t.after(()=>c.dispose());assert.equal(typeof c.createVersionController,'function');const old=c.createVersionController(1);await old.refresh();assert.equal(old.getSnapshot().error,null);assert.equal(old.getSnapshot().view.currentGuidance.mode,'historical_document');assert.deepEqual(f.calls[0].command,{schemaVersion:1,action:'read_client_plan_v3',version:1});
});
test('disposed composition retires its actual source ports while preserving uncertain History wire in actual session memory',async t=>{
 const f=await session(t),c=api.createClientComposition(f.runtime);await c.history.load();c.history.startReport();let intent=c.history.getSnapshot().intent;c.history.edit({...intent,body:{...intent.body,notes:'PRIVATE_UNSENT'}});f.set(()=>Response.json({code:'unavailable'},{status:503}));await c.history.submit();const pending=c.history.getSnapshot().pending;assert.ok(pending);c.dispose();await f.runtime.restore();const count=f.calls.length;await assert.rejects(c.ports.review.execute({schemaVersion:1,action:'read_client_plan_v3',version:null}),e=>e.status===401);assert.equal(f.calls.length,count);
 const replacement=api.createClientComposition(f.runtime);t.after(()=>replacement.dispose());assert.deepEqual(replacement.history.getSnapshot().pending,pending);assert.equal(replacement.history.getSnapshot().mutation,'uncertain');
});
test('same exact displayed view and operation retain the same App callback source across rerenders',async t=>{
 const f=await session(t),c=api.createClientComposition(f.runtime);t.after(()=>c.dispose());await c.controller.refresh();const v=c.controller.getSnapshot().view;assert.equal(c.controller.acceptFrom(v),c.controller.acceptFrom(v));
});
test('actual historical shared renderer labels current-use overlay and refuses care/choice writes',async t=>{
 const f=await session(t,c=>{const v=view();v.currentGuidance.mode='historical_document';v.currentGuidance.snapshot.currentPublication.version=2;return v;}),c=api.createClientComposition(f.runtime);t.after(()=>c.dispose());const historical=c.createVersionController(1);await historical.refresh();const nav={route:{name:'plan',routine:'morning'},navigate(){},back(){}};
 const outer={getSnapshot:()=>'/history/versions/1',subscribe:()=>()=>{},navigate(){},back(){},backDestination:()=>({name:'history'})};
 const html=m.renderToStaticMarkup(m.createElement(m.OverlayProvider,null,m.createElement(m.NavigationProvider,{navigator:outer},m.createElement(m.HistoricalPlanContent,{controller:historical,boundary:f.runtime.getSnapshot().boundary,ports:c.ports,navigation:nav}))));
 assert.ok(html.includes('historical plan'));assert.ok(html.includes('current reported use'));assert.ok(!html.includes('approve product'));assert.ok(!html.includes('record a change in use'));assert.ok(!html.includes('<form'));assert.equal(f.calls.length,1);
});
