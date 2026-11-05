// Finite synthetic HTTP; actual retained cookie, lease and application transport.
// These tests establish a raw request seam, not a Review server or domain response.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createApplicationSession} from '../src/app/session.ts';
import {createClientCookieRequest} from '../site/auth/client-cookie-session.js';
const api=await import('../src/app/review-request.ts').catch(()=>({}));
const owner='11111111-1111-4111-8111-111111111111';
const actions=['submit_goal_report_v1','amend_report_v1','read_care_history_v1','read_client_plan_v3','read_client_instruction_manifest_v1','read_client_instruction_v1','record_decision_v2','request_status_v1'];
const read={schemaVersion:1,action:'read_care_history_v1',cursor:null,limit:10,version:null};
async function fixture(t,audience='client'){
 let login={signedIn:true,ownerId:owner,generation:1,csrf:'review-csrf',capabilities:{view:true,edit:false,publish:false,confirmPayments:false},idleExpiresAt:'2099-01-01T00:00:00Z',absoluteExpiresAt:'2099-01-02T00:00:00Z'};
 let status=200,data={raw:'synthetic response'},held=null;const calls=[];
 const runtime=createApplicationSession({audience,locks:{request:async(_n,_o,run)=>run()},fetcher:async(url,init)=>{
  assert.ok([`/api/${audience}/session`,`/api/${audience}/reviews`,`/api/${audience}/logout`].includes(url),'unexpected endpoint '+url);
  calls.push({url,init});
  if(url.endsWith('/session'))return Response.json(login);
  if(url.endsWith('/logout'))return Response.json({signedOut:true});
  if(held){const h=held;held=null;h.enter();await h.promise;}
  return Response.json(data,{status});
 }});
 await runtime.restore();t.after(()=>runtime.dispose());
 return{runtime,calls,setReply(v,s=200){data=v;status=s;},setLogin(v){login={...login,...v};},hold(){let enter,release;const entered=new Promise(r=>enter=r),promise=new Promise(r=>release=r);held={enter,release,promise};return{entered,release};}};
}
function port(f){assert.equal(typeof api.createClientReviewRequest,'function');return api.createClientReviewRequest(f.runtime);}

test('retained client cookie factory recognizes only the pinned client Review channel',async t=>{
 const f=await fixture(t),request=createClientCookieRequest('reviews',f.runtime.cookie);
 await request(read);const c=f.calls.at(-1);assert.equal(c.url,'/api/client/reviews');
 for(const action of ['record_conversation_v1','read_advisor_care_history_v1','publish_guidance_v1','grant_task_v1'])await assert.rejects(request({schemaVersion:1,action}),e=>e.status===403);
 assert.equal(f.calls.filter(c=>c.url.endsWith('/reviews')).length,1);
});
test('creation-bound Review request uses actual opaque cookies/CSRF/no-store and fixed action metadata',async t=>{
 const f=await fixture(t),p=port(f);assert.deepEqual(await p.execute(read),{raw:'synthetic response'});
 const c=f.calls.at(-1);assert.equal(c.url,'/api/client/reviews');assert.equal(c.init.credentials,'same-origin');assert.equal(c.init.cache,'no-store');assert.equal(c.init.redirect,'error');
 assert.equal(new Headers(c.init.headers).get('x-shelv-csrf'),'review-csrf');assert.equal(new Headers(c.init.headers).has('authorization'),false);assert.equal(new Headers(c.init.headers).has('apikey'),false);
 const before=f.calls.length;
 for(const value of [null,{},[],{schemaVersion:2,action:read.action},{schemaVersion:1,action:'read_advisor_publication_v3'},{schemaVersion:1,action:'publish_guidance_v1'}])await assert.rejects(p.execute(value),e=>e.status===400||e.status===403);
 assert.equal(f.calls.length,before);
 // Shape and response validation remain the enclosing domain adapter's duty.
 for(const action of actions)await p.execute({schemaVersion:1,action});
 assert.deepEqual(f.calls.filter(c=>c.url.endsWith('/reviews')).slice(1).map(c=>JSON.parse(c.init.body).action),actions);
});
test('raw Review wire budget remains exactly500000 UTF8 bytes without lifting other channels',async t=>{
 const f=await fixture(t),p=port(f),base={schemaVersion:1,action:'submit_goal_report_v1',padding:''};
 const size=new TextEncoder().encode(JSON.stringify(base)).length;
 await p.execute({...base,padding:'a'.repeat(500000-size)});
 assert.equal(new TextEncoder().encode(f.calls.at(-1).init.body).length,500000);const before=f.calls.length;
 await assert.rejects(p.execute({...base,padding:'a'.repeat(500001-size)}),e=>e.status===413);
 await assert.rejects(p.execute({...base,padding:'é'.repeat(Math.floor((500000-size)/2)+1)}),e=>e.status===413);
 assert.equal(f.calls.length,before);
 const old=createClientCookieRequest('checkins',f.runtime.cookie);
 await assert.rejects(old({action:'submit_report',padding:'a'.repeat(100001)}),e=>e.status===413);
});
for(const change of [{ownerId:'22222222-2222-4222-8222-222222222222'},{csrf:'new-review-csrf'}])test('old Review request cannot initiate after '+Object.keys(change)[0]+' replacement',async t=>{
 const f=await fixture(t),p=port(f);f.setLogin(change);await f.runtime.restore();const before=f.calls.length;
 await assert.rejects(p.execute(read),e=>e.status===401);assert.equal(f.calls.length,before);await port(f).execute(read);
});
test('advisor audience cannot create the client Review request',async t=>{
 const f=await fixture(t,'advisor');assert.equal(typeof api.createClientReviewRequest,'function');assert.throws(()=>api.createClientReviewRequest(f.runtime),e=>e.status===401);
 assert.equal(f.calls.length,1);assert.throws(()=>createClientCookieRequest('reviews',f.runtime.cookie),e=>e.status===403);
});
test('logout rejects a held Review result and old ports stay retired',async t=>{
 const f=await fixture(t),p=port(f),h=f.hold(),pending=p.execute(read);await h.entered;await f.runtime.signOut();h.release();
 await assert.rejects(pending,e=>e.status===401);const before=f.calls.length;await assert.rejects(p.execute(read),e=>e.status===401);assert.equal(f.calls.length,before);
});
test('read status503 stays rejected while write503 stays uncertain and exact body remains caller-owned',async t=>{
 const f=await fixture(t),p=port(f);f.setReply({code:'unavailable'},503);
 await assert.rejects(p.execute({schemaVersion:1,action:'request_status_v1',requestId:owner}),e=>e.status===503&&e.outcome==='rejected');
 await f.runtime.restore();const write={schemaVersion:1,action:'submit_goal_report_v1',requestId:owner};
 await assert.rejects(p.execute(write),e=>e.status===503&&e.outcome==='uncertain');assert.deepEqual(write,{schemaVersion:1,action:'submit_goal_report_v1',requestId:owner});
});
test('exact safe Review failure code survives transport, unknown details do not',async t=>{
 const f=await fixture(t),p=port(f);f.setReply({code:'guidance_version_required'},409);
 await assert.rejects(p.execute(read),e=>e.status===409&&e.code==='guidance_version_required');
 f.setReply({code:'private_error_canary'},409);await assert.rejects(p.execute(read),e=>e.status===409&&e.code===undefined);
});
test('caller mutation during lease acquisition cannot replace the captured action or wire',async t=>{
 const f=await fixture(t),p=port(f),command={schemaVersion:1,action:'submit_goal_report_v1',requestId:owner,note:'captured'},wire=JSON.stringify(command);
 const pending=p.execute(command);command.action='publish_guidance_v1';command.note='later';await pending;
 assert.equal(f.calls.at(-1).init.body,wire);
});
for(const action of ['read_care_history_v1','submit_goal_report_v1'])test('aborted '+action+' has no command egress',async t=>{
 const f=await fixture(t),p=port(f),controller=new AbortController();controller.abort();const before=f.calls.length;
 await assert.rejects(p.execute({schemaVersion:1,action},{signal:controller.signal}),e=>e.status===503&&e.outcome===(action==='read_care_history_v1'?'rejected':'uncertain'));
 assert.equal(f.calls.length,before);
});
