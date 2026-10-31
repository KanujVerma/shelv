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
