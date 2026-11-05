import test from 'node:test';
import assert from 'node:assert/strict';
import {createApplicationSession} from '../src/app/session.ts';
import {createClientPorts,createAdvisorPorts} from '../src/app/ports.ts';
import {createClientPlanController} from '../src/app/client-state.ts';

const owner='11111111-1111-4111-8111-111111111111';
const prepared={schemaVersion:2,access:'preparation',plan:null,decisionRevision:0,decisions:[],actualUse:[],nextReviewOn:null,use:{revision:0,planProducts:[],reportedProducts:{items:[],nextCursor:null}},latestPublicReview:null};
async function setup(t,audience='client'){
 const calls=[];let code=200,data=prepared;
 const runtime=createApplicationSession({audience,locks:{request:async(_n,_o,run)=>run()},fetcher:async(url,init)=>{
  if(url.endsWith('/session'))return Response.json({signedIn:true,ownerId:owner,generation:1,csrf:'care-app-csrf',capabilities:{view:true,edit:true,publish:true,confirmPayments:true},idleExpiresAt:new Date(Date.now()+3600000).toISOString(),absoluteExpiresAt:new Date(Date.now()+7200000).toISOString()});
  assert.equal(url,`/api/${audience}/care`,'care composition must not fall back to a Start-only plan endpoint');
  assert.equal(new Headers(init.headers).get('x-shelv-csrf'),'care-app-csrf');
  calls.push(JSON.parse(init.body));return Response.json(data,{status:code});
 }});await runtime.restore();t.after(()=>runtime.dispose());
 return {runtime,calls,response(value,status=200){data=value;code=status;}};
}
test('explicit client application care composition reads v2 on its first load',async t=>{
 const f=await setup(t),ports=createClientPorts(f.runtime,{care:true});
 assert.ok(ports.care,'the composed application requires a real creation-bound care port');
 const c=createClientPlanController(f.runtime.getSnapshot().boundary,ports,{readVersion:2});t.after(()=>c.dispose());await c.refresh();
 assert.deepEqual(c.getSnapshot().view,prepared);assert.equal(c.getSnapshot().error,null);
 assert.deepEqual(f.calls,[{schemaVersion:1,action:'read_client_plan_v2',version:null}]);
});
test('activated client care read errors never trigger a lossy v1 fallback',async t=>{
 const f=await setup(t),ports=createClientPorts(f.runtime,{care:true});assert.ok(ports.care);
 const c=createClientPlanController(f.runtime.getSnapshot().boundary,ports,{readVersion:2});t.after(()=>c.dispose());await c.refresh();const confirmed=c.getSnapshot().view;
 for(const status of [409,503]){f.response({code:status===409?'cursor_conflict':'unavailable'},status);await c.refresh();assert.equal(c.getSnapshot().view,confirmed);assert.equal(c.getSnapshot().error,status);}
 assert.equal(f.calls.length,3);assert.ok(f.calls.every(c=>c.action==='read_client_plan_v2'));
});
test('explicit advisor application composition uses finite advisor care reads only',async t=>{
 const f=await setup(t,'advisor'),adapter=createAdvisorPorts(f.runtime,{care:true});t.after(()=>adapter.dispose());assert.ok(adapter.care);
 const command={schemaVersion:1,action:'read_advisor_use_history_v1',clientId:owner,product:null,cursor:null,limit:10};f.response({revision:0,entries:[],nextCursor:null});
 assert.deepEqual(await adapter.care.execute(command),{revision:0,entries:[],nextCursor:null});
 await assert.rejects(adapter.care.execute({schemaVersion:1,action:'read_client_plan_v2',version:null}),e=>e.status===403);assert.deepEqual(f.calls,[command]);
});
test('legacy factory consumers retain their explicit v1 composition',async t=>{
 const f=await setup(t);assert.equal(createClientPorts(f.runtime).care,undefined);
});
