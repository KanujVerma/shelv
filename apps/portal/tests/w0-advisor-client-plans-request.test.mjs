// Actual session/cookie/transport and canonical directory codec, closed HTTP.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createApplicationSession} from '../src/app/session.ts';
import {ids,stamp} from './rebuild/advisor-fixture.mjs';
const source=()=>import('../src/app/advisor-client-plans-request.ts');
const row=(clientId=ids.client)=>({id:ids.draft,clientId,state:'working',contentRevision:1,assignmentRevision:1,savedAt:stamp});
const page=()=>({drafts:[row()],publications:[],nextCursor:null});
async function setup(t,{audience='advisor'}={}){
 const broadcast=globalThis.BroadcastChannel;globalThis.BroadcastChannel=undefined;t.after(()=>{globalThis.BroadcastChannel=broadcast;});
 const calls=[];let reply=()=>Response.json(page());
 let login={signedIn:true,ownerId:ids.actor,generation:1,csrf:'synthetic-scoped-list',capabilities:{view:true,edit:false,publish:false,confirmPayments:false},idleExpiresAt:'2099-01-01T00:00:00Z',absoluteExpiresAt:'2099-01-02T00:00:00Z'};
 const runtime=createApplicationSession({audience,locks:{request:async(_n,_o,run)=>run()},fetcher:async(url,init)=>{
  if(url===`/api/${audience}/session`)return Response.json(login);
  assert.equal(url,'/api/advisor/plans');assert.equal(init.redirect,'error');assert.equal(init.credentials,'same-origin');assert.equal(init.cache,'no-store');
  assert.equal(new Headers(init.headers).get('X-Shelv-CSRF'),login.csrf);const command=JSON.parse(init.body);calls.push(command);return reply(command);
 }});await runtime.restore();t.after(()=>runtime.dispose());
 const api=await source(),port=api.createAdvisorClientPlansRequest(runtime,ids.client);
 return {runtime,port,calls,setReply(value){reply=value;},setLogin(value){login={...login,...value};}};
}
test('a VIEW-only human can read the fixed selected client without any write capability',async t=>{
 const f=await setup(t);assert.deepEqual(await f.port.execute({cursor:null,limit:25}),page());
 assert.deepEqual(f.calls,[{schemaVersion:1,action:'list_plans_v1',clientId:ids.client,cursor:null,limit:25}]);
});
test('the next page keeps the creation-bound client and does not scan clients or drafts',async t=>{
 const f=await setup(t),cursor='d:'+ids.draft;await f.port.execute({cursor,limit:25});assert.equal(f.calls[0].clientId,ids.client);assert.equal(f.calls[0].cursor,cursor);assert.equal(f.calls.length,1);
});
test('caller authority and endpoint/action/client selectors never reach HTTP',async t=>{
 const f=await setup(t);for(const extra of [{clientId:ids.other},{action:'read_draft_v1'},{rpc:'other'},{ownerId:ids.actor}])await assert.rejects(f.port.execute({cursor:null,limit:25,...extra}),e=>e.status===400);assert.equal(f.calls.length,0);
});
test('a foreign or unassigned row is unavailable, not a partial successful scoped page',async t=>{
 const f=await setup(t);for(const clientId of [ids.other,null]){f.setReply(()=>Response.json({...page(),drafts:[row(clientId)]}));await assert.rejects(f.port.execute({cursor:null,limit:25}),e=>e.status===503);}
 f.setReply(()=>Response.json({...page(),publications:[{clientId:ids.other,version:1,publishedAt:stamp,documentSchemaVersion:3}]}));await assert.rejects(f.port.execute({cursor:null,limit:25}),e=>e.status===503);
});
test('oversized pages and repeated cursors cannot imply complete client context',async t=>{
 const f=await setup(t);f.setReply(()=>Response.json({...page(),drafts:[row(),{...row(),id:ids.other}]}));await assert.rejects(f.port.execute({cursor:null,limit:1}),e=>e.status===503);
 const cursor='d:'+ids.draft;f.setReply(()=>Response.json({...page(),nextCursor:cursor}));await assert.rejects(f.port.execute({cursor,limit:25}),e=>e.status===503);
});
test('READY is rechecked after caller relevance and input getters',async t=>{
 const f=await setup(t);await assert.rejects(f.port.execute({cursor:null,limit:25},{isApplicable:()=>{f.runtime.cookie.status='offline';return true;}}),e=>e.status===503);assert.equal(f.calls.length,0);
 await f.runtime.restore();let reads=0;const input={limit:25,get cursor(){reads++;return null;}};await assert.rejects(f.port.execute(input),e=>e.status===400);assert.equal(reads,0);assert.equal(f.calls.length,0);
});
for(const status of [401,403])test('actual directory denial '+status+' is retained',async t=>{
 const f=await setup(t);f.setReply(()=>Response.json({code:status===401?'session_ended':'forbidden'},{status}));await assert.rejects(f.port.execute({cursor:null,limit:25}),e=>e.status===status);
});
test('an adapter captured before actual actor replacement cannot read for the new actor',async t=>{
 const f=await setup(t);f.setLogin({ownerId:ids.other,generation:2,csrf:'replacement'});await f.runtime.restore();await assert.rejects(f.port.execute({cursor:null,limit:25}),e=>e.status===401);assert.equal(f.calls.length,0);
});
test('a client runtime and an unaccepted VIEW-less server session cannot dispatch',async t=>{
 const c=await setup(t,{audience:'client'});await assert.rejects(c.port.execute({cursor:null,limit:25}),e=>e.status===401);assert.equal(c.calls.length,0);
 const f=await setup(t);f.setLogin({capabilities:{view:false,edit:false,publish:false,confirmPayments:false}});
 await assert.rejects(f.runtime.restore(),e=>e.status===503);
 await assert.rejects(f.port.execute({cursor:null,limit:25}),e=>e.status===503);assert.equal(f.calls.length,0);
});
test('pre-aborted navigation read cannot dispatch',async t=>{
 const f=await setup(t),abort=new AbortController();abort.abort();await assert.rejects(f.port.execute({cursor:null,limit:25},{signal:abort.signal}),e=>e.status===503);assert.equal(f.calls.length,0);
});
test('late page cannot return private rows after actual actor replacement',async t=>{
 const f=await setup(t);let enter,release;const entered=new Promise(r=>enter=r),held=new Promise(r=>release=r);t.after(()=>release());
 f.setReply(async()=>{enter();await held;return Response.json(page());});const pending=f.port.execute({cursor:null,limit:25});await entered;
 f.setLogin({ownerId:ids.other,generation:2,csrf:'replacement'});await f.runtime.restore();release();await assert.rejects(pending,e=>[401,503].includes(e.status));
});
