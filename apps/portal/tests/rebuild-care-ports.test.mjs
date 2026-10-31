// Synthetic finite HTTP; actual application/cookie/transport/strict protocol.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createApplicationSession} from '../src/app/session.ts';
import {createClientCarePort,createAdvisorCarePort} from '../src/app/care-ports.ts';
const owner='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222',requestId='33333333-3333-4333-8333-333333333333';
const read={schemaVersion:1,action:'read_client_plan_v2',version:null};
const preparation={schemaVersion:2,access:'preparation',plan:null,decisionRevision:0,decisions:[],actualUse:[],nextReviewOn:null,use:{revision:0,planProducts:[],reportedProducts:{items:[],nextCursor:null}},latestPublicReview:null};
const use={schemaVersion:1,action:'report_product_use_v1',requestId,expectedUseRevision:0,product:{kind:'plan_product',publication:{version:1,documentSchemaVersion:3},productId:'cleanser',slotId:null},change:{kind:'stopped',details:null},sourcePublication:null,occurredOn:{state:'unknown'},channel:'portal',acquisition:'already_owned',identityEventId:null};
const receipt={requestId,event:{kind:'use',id:requestId},revision:1,recordedAt:'2026-10-30T00:00:00Z',notificationEventId:null};
async function fixture(t,audience='client'){
 let login={signedIn:true,ownerId:owner,generation:1,csrf:'care-csrf',capabilities:{view:true,edit:false,publish:false,confirmPayments:false},idleExpiresAt:new Date(Date.now()+3600000).toISOString(),absoluteExpiresAt:new Date(Date.now()+7200000).toISOString()};
 let data=preparation,status=200,hold=null;const calls=[];
 const runtime=createApplicationSession({audience,locks:{request:async(_n,_o,run)=>run()},fetcher:async(url,init)=>{
  assert.ok([`/api/${audience}/session`,`/api/${audience}/care`,`/api/${audience}/logout`].includes(url),'unexpected endpoint');calls.push({url,init});
  if(url.endsWith('/session'))return Response.json(login);
  if(url.endsWith('/logout'))return Response.json({signedOut:true});
  assert.equal(new Headers(init.headers).get('x-shelv-csrf'),login.csrf);
  if(hold){const current=hold;hold=null;current.enter();await current.promise;}
  return Response.json(data,{status});
 }});
 await runtime.restore();t.after(()=>runtime.dispose());
 return{runtime,calls,setData:(v,s=200)=>{data=v;status=s;},setLogin:v=>{login={...login,...v};},hold(){let enter,release;const entered=new Promise(r=>enter=r),promise=new Promise(r=>release=r);hold={enter,promise};return{entered,release};}};
}

test('client care port uses real cookie transport, strict v2 decoding and exact write receipts',async t=>{
 const f=await fixture(t),p=createClientCarePort(f.runtime);assert.deepEqual(await p.execute(read),preparation);
 f.setData(receipt);assert.deepEqual(await p.execute(use),receipt);
 assert.deepEqual(f.calls.filter(c=>c.url.endsWith('/care')).map(c=>JSON.parse(c.init.body)),[read,use]);
});
test('care ports deny wrong audience/actions and injected authority before any command egress',async t=>{
 const f=await fixture(t),p=createClientCarePort(f.runtime);const before=f.calls.length;
 assert.throws(()=>createAdvisorCarePort(f.runtime),e=>e.status===401);
 for(const c of [{...read,clientId:other},{schemaVersion:1,action:'read_advisor_use_history_v1',clientId:other,product:null,cursor:null,limit:10}])await assert.rejects(p.execute(c),e=>e.status===400||e.status===403);
 assert.equal(f.calls.length,before);
});
test('safe advisor care reads use their own captured audience and finite DTO',async t=>{
 const f=await fixture(t,'advisor'),p=createAdvisorCarePort(f.runtime),command={schemaVersion:1,action:'read_advisor_use_history_v1',clientId:owner,product:null,cursor:null,limit:10};
 const data={revision:0,entries:[],nextCursor:null};f.setData(data);assert.deepEqual(await p.execute(command),data);
 const before=f.calls.length;await assert.rejects(p.execute(read),e=>e.status===403);assert.equal(f.calls.length,before);
});
test('malformed write acknowledgements remain uncertain while read errors are rejected',async t=>{
 const f=await fixture(t),p=createClientCarePort(f.runtime);f.setData({...receipt,extra:true});
 await assert.rejects(p.execute(use),e=>e.status===503&&e.outcome==='uncertain');
 f.setData({...preparation,privateNotes:'PRIVATE_CARE_CANARY'});await assert.rejects(p.execute(read),e=>e.status===503&&e.outcome==='rejected');
});
for(const replacement of [{ownerId:other},{csrf:'replacement-csrf'}])test('a care port cannot initiate commands after '+Object.keys(replacement)[0]+' replacement',async t=>{
 const f=await fixture(t),old=createClientCarePort(f.runtime);f.setLogin(replacement);await f.runtime.restore();const before=f.calls.length;
 await assert.rejects(old.execute(read),e=>e.status===401);assert.equal(f.calls.length,before);
 assert.deepEqual(await createClientCarePort(f.runtime).execute(read),preparation);
});
test('logout fences a held care result through the actual cookie factory and transport',async t=>{
 const f=await fixture(t),p=createClientCarePort(f.runtime),h=f.hold(),pending=p.execute(read);await h.entered;await f.runtime.signOut();h.release();
 await assert.rejects(pending,e=>e.status===401);
});
