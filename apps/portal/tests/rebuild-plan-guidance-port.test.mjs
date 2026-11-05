import test from 'node:test';import assert from 'node:assert/strict';
import {createClientReviewRequest} from '../src/app/review-request.ts';
import {guidancePlan,finiteSession,v3read,uid} from './rebuild-plan-guidance-fixture.mjs';
const module=await import('../src/features/plan/guidancePort.ts').catch(()=>({}));
const port=f=>module.createClientGuidancePort({request:createClientReviewRequest(f.runtime),session:f.runtime.getSnapshot().boundary,mode:'client'});
test('five-action feature port uses actual creation-bound cookie Review and canonical positive V3 mapping',async t=>{const f=await finiteSession(t);assert.equal(typeof module.createClientGuidancePort,'function');assert.deepEqual(await port(f).execute(v3read),guidancePlan());assert.deepEqual(f.calls.map(x=>[x.url,x.command]),[['/api/client/reviews',v3read]]);});
test('feature runtime refuses otherwise valid client Review actions and all foreign families before egress',async t=>{
 const f=await finiteSession(t),p=port(f);
 for(const command of [{schemaVersion:1,action:'read_care_history_v1',cursor:null,limit:1,version:null},{schemaVersion:1,action:'submit_goal_report_v1',requestId:uid(3),expectedReportRevision:0,body:{publication:{version:1,documentSchemaVersion:3},answers:[],comfort:null,notes:null,actualUseEventIds:[],photoIds:[]},occurredOn:{state:'unknown'}},{schemaVersion:1,action:'read_client_plan_v2',version:null},{...v3read,clientId:uid(4)},{schemaVersion:1,action:'read_guidance_draft_v1',draftId:uid(3)}])await assert.rejects(p.execute(command),e=>[400,403].includes(e.status));assert.equal(f.calls.length,0);
});
for(const patch of [{ownerId:uid(71)},{csrf:'replaced'}])test('feature port ends with actual cookie '+Object.keys(patch)[0]+' replacement',async t=>{const f=await finiteSession(t),p=port(f);f.login(patch);await f.runtime.restore();await assert.rejects(p.execute(v3read),e=>e.status===401);assert.equal(f.calls.length,0);});
test('status is a READ, malformed positives deny and exact root guidance failure codes survive',async t=>{
 let data={status:'absent'},status=200;const f=await finiteSession(t,{respond:()=>Response.json(data,{status})}),p=port(f);const command={schemaVersion:1,action:'request_status_v1',requestId:uid(1)};
 assert.deepEqual(await p.execute(command),data);data={...guidancePlan(),privateNote:'PRIVATE'};await assert.rejects(p.execute(v3read),e=>e.status===503&&e.outcome==='rejected');
 data={code:'guidance_conflict'};status=409;await assert.rejects(p.execute(v3read),e=>e.status===409&&e.code==='guidance_conflict');
 data={code:'unavailable'};status=503;await assert.rejects(p.execute(command),e=>e.outcome==='rejected');
});
test('public modes cannot construct a live guidance port',async t=>{const f=await finiteSession(t);for(const mode of ['public-demo','advisor-preview','historical','private-walkthrough'])assert.throws(()=>module.createClientGuidancePort({request:createClientReviewRequest(f.runtime),session:f.runtime.getSnapshot().boundary,mode}),e=>e.status===403);assert.equal(f.calls.length,0);});
