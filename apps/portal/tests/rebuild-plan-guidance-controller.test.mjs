import test from 'node:test';import assert from 'node:assert/strict';
import {createClientPlanController} from '../src/app/client-state.ts';
import {createClientPorts} from '../src/app/ports.ts';
import {guidancePlan,finiteSession} from './rebuild-plan-guidance-fixture.mjs';
test('actual controller accepts the original canonical V3 object and rejects private extras',async t=>{
 const f=await finiteSession(t),c=createClientPlanController(f.runtime.getSnapshot().boundary,createClientPorts(f.runtime));t.after(()=>c.dispose());
 const v=guidancePlan();c.accept(v);assert.equal(c.getSnapshot().view,v);assert.throws(()=>c.accept({...v,privateNote:'PRIVATE'}));assert.equal(c.getSnapshot().view,v);
});
test('confirmed V3 without Review capability cannot fall back to plans or care',async t=>{
 const f=await finiteSession(t),c=createClientPlanController(f.runtime.getSnapshot().boundary,createClientPorts(f.runtime,{care:true}));t.after(()=>c.dispose());c.accept(guidancePlan());await c.refresh();assert.equal(c.getSnapshot().error,503);assert.equal(f.calls.length,0);assert.equal(c.getSnapshot().view.schemaVersion,3);
});

test('explicit V3 first read and every confirmed refresh use strict Review only',async t=>{
 const {createClientGuidancePort}=await import('../src/features/plan/guidancePort.ts');const {createClientReviewRequest}=await import('../src/app/review-request.ts');
 const f=await finiteSession(t),review=createClientGuidancePort({request:createClientReviewRequest(f.runtime),session:f.runtime.getSnapshot().boundary,mode:'client'}),ports={...createClientPorts(f.runtime,{care:true}),review};
 const c=createClientPlanController(f.runtime.getSnapshot().boundary,ports,{readVersion:3});t.after(()=>c.dispose());await c.refresh();assert.equal(c.getSnapshot().view.schemaVersion,3);assert.equal(c.getSnapshot().error,null);await c.refresh();assert.deepEqual(f.calls.map(x=>x.command.action),['read_client_plan_v3','read_client_plan_v3']);
 const fetched=await review.execute({schemaVersion:1,action:'read_client_plan_v3',version:null});c.accept(fetched);assert.equal(c.getSnapshot().view,fetched);
});
test('UseReport shared reread preserves V3 and never calls Care2 even with actual Care capability',async t=>{
 const {readCurrentPlan}=await import('../src/features/plan/care.ts');const {createClientGuidancePort}=await import('../src/features/plan/guidancePort.ts');const {createClientReviewRequest}=await import('../src/app/review-request.ts');
 const f=await finiteSession(t),session=f.runtime.getSnapshot().boundary,ports={...createClientPorts(f.runtime,{care:true}),review:createClientGuidancePort({request:createClientReviewRequest(f.runtime),session,mode:'client'})};
 const v=await readCurrentPlan({view:guidancePlan(),session,ports,mode:'client'});assert.equal(v.schemaVersion,3);assert.deepEqual(f.calls.map(x=>x.command.action),['read_client_plan_v3']);
 await assert.rejects(readCurrentPlan({view:guidancePlan(),session,ports:{...ports,review:undefined},mode:'client'}));assert.equal(f.calls.length,1);
});
test('V3 controller refuses duplicate/missing choice provenance and stale private response after logout',async t=>{
 const f=await finiteSession(t),c=createClientPlanController(f.runtime.getSnapshot().boundary,createClientPorts(f.runtime));t.after(()=>c.dispose());const v=guidancePlan();c.accept(v);
 for(const bad of [{...v,decisionGuidance:[{decisionId:'fake',recordedDecisionRevision:null,acceptedSnapshot:null,basisStatus:'legacy_unbound'}]},{...v,currentGuidance:{...v.currentGuidance,snapshot:{...v.currentGuidance.snapshot,useHead:2}}}])assert.throws(()=>c.accept(bad));
 assert.equal(c.getSnapshot().view,v);await f.runtime.signOut();c.accept(v);assert.equal(c.getSnapshot().view,null);assert.equal(c.getSnapshot().ended,true);
});
