import test from 'node:test';
import assert from 'node:assert/strict';
import {createApplicationSession} from '../apps/portal/src/app/session.ts';
import {clientCookieRequest} from '../apps/portal/src/app/retained.ts';
import {createClientPhotoUpload} from '../apps/portal/site/auth/client-cookie-session.js';
import {CookieSessionError} from '../apps/portal/site/auth/advisor-cookie-session.js';

globalThis.fetch=async()=>{throw Error('global_network_denied');};
const owner='11111111-1111-4111-8111-111111111111';
const requestId='33333333-3333-4333-8333-333333333333';
const completionRequestId='44444444-4444-4444-8444-444444444444';
const deferred=()=>{let resolve;return {promise:new Promise(r=>{resolve=r;}),resolve:()=>resolve()};};
async function fixture(surface,status,respond){
 const entered=deferred(),held=deferred(),calls=[];let decoded=0;
 let login={signedIn:true,ownerId:owner,generation:1,csrf:'synthetic-sd1',capabilities:{view:true,edit:false,publish:false,confirmPayments:false},idleExpiresAt:'2099-01-01',absoluteExpiresAt:'2099-01-02'};
 const file=new Blob(['SYNTHETIC_PRIVATE_BINARY'],{type:'image/jpeg'});
 const runtime=createApplicationSession({audience:'client',locks:{request:async(_n,_o,run)=>run()},fetcher:async(url,init)=>{
  if(url==='/api/client/session')return Response.json(login);
  assert.ok(['/api/client/operations','/api/client/checkins/photos/upload','/api/client/payments','/api/client/checkins'].includes(url));
  assert.equal(init.credentials,'same-origin');assert.equal(init.cache,'no-store');assert.equal(init.redirect,'error');assert.equal(new Headers(init.headers).get('x-shelv-csrf'),'synthetic-sd1');
  if(url==='/api/client/operations')return Response.json({code:'unavailable'},{status:503});
  calls.push({url,body:init.body,signal:init.signal});
  if(surface==='photo'){assert.equal(init.body,file);assert.equal(new Headers(init.headers).get('x-request-id'),requestId);assert.equal(new Headers(init.headers).get('x-completion-request-id'),completionRequestId);}
  else {assert.ok(init.body instanceof FormData);assert.equal(init.body.get('requestId'),requestId);assert.equal(init.body.get('file').size,file.size);}
  entered.resolve();await held.promise;
  if(respond)return respond();
  return Response.json(status===200?{private:'SYNTHETIC_PRIVATE_REPLY'}:{code:status===401?'session_ended':status===403?'forbidden':'unavailable'},{status});
 }});
 await runtime.restore();
 const decode=value=>{decoded++;return value;};
 const port=surface==='photo'?runtime.transport.bind({kind:'write',invoke:createClientPhotoUpload(runtime.cookie),decode}):runtime.transport.bindCookieChannel(clientCookieRequest,surface,'write',decode);
 const form=new FormData();form.set('action',surface==='payments'?'submit_claim':'submit_report');form.set('requestId',requestId);form.set('file',file,'synthetic.jpg');
 const command=surface==='photo'?{file,angle:'front',requestId,completionRequestId,expectedRevision:0}:form;
 return {runtime,port,command,calls,entered,held,decoded:()=>decoded,async outage(){await assert.rejects(runtime.transport.bindCookieChannel(clientCookieRequest,'operations','read',v=>v).execute({action:'service_client_read'}),{status:503});},async restore(patch){login={...login,...patch};await runtime.restore();}};
}

for(const surface of ['photo','payments','checkins'])for(const parallel of [false,true])for(const status of [401,403])test(`${surface} received HTTP${status} ${parallel?'after sibling503':'while ready'} keeps its actual denial`,async()=>{
 const f=await fixture(surface,status);try{
  const boundary=f.runtime.getSnapshot().boundary,pending=f.port.execute(f.command),rejected=assert.rejects(pending,e=>e.status===status&&e.outcome===(status===401?'session-ended':'rejected'));
  await f.entered.promise;if(parallel)await f.outage();assert.equal(f.calls[0].signal.aborted,false);f.held.resolve();await rejected;
  assert.equal(f.decoded(),0);assert.equal(f.calls.length,1);assert.equal(f.runtime.cookie.status,status===401?'signedout':parallel?'offline':'ready');assert.equal(boundary.isCurrent(),status!==401);
 }finally{f.held.resolve();f.runtime.dispose();}
});
for(const surface of ['photo','payments','checkins'])test(`${surface} arbitrary unmarked local401 cannot end a valid session`,async()=>{
 const f=await fixture(surface,401,()=>{throw new CookieSessionError(401);});try{
  const boundary=f.runtime.getSnapshot().boundary,pending=f.port.execute(f.command),rejected=assert.rejects(pending,{status:401});await f.entered.promise;f.held.resolve();await rejected;assert.equal(f.runtime.cookie.status,'ready');assert.equal(boundary.isCurrent(),true);assert.equal(f.decoded(),0);
 }finally{f.held.resolve();f.runtime.dispose();}
});
for(const surface of ['photo','payments','checkins'])for(const status of [401,403])test(`${surface} post-abort HTTP${status} stays local and a following request works without restore`,async()=>{
 let first=true;const f=await fixture(surface,status,()=>{if(first){first=false;return Response.json({code:status===401?'session_ended':'forbidden'},{status});}return Response.json({fixture:'following-ready-request'});});try{
  const boundary=f.runtime.getSnapshot().boundary,abort=new AbortController(),pending=f.port.execute(f.command,{signal:abort.signal}),rejected=assert.rejects(pending,{status:503,outcome:'uncertain'});
  await f.entered.promise;abort.abort();f.held.resolve();await rejected;assert.equal(f.runtime.cookie.status,'ready');assert.equal(boundary.isCurrent(),true);assert.equal(f.decoded(),0);assert.deepEqual(await f.port.execute(f.command),{fixture:'following-ready-request'});assert.equal(f.calls.length,2);
 }finally{f.held.resolve();f.runtime.dispose();}
});
for(const surface of ['photo','payments','checkins'])for(const status of [200,503])test(`${surface} sibling503 never decodes HTTP${status} or fabricates a receipt`,async()=>{
 const f=await fixture(surface,status);try{
  const boundary=f.runtime.getSnapshot().boundary,pending=f.port.execute(f.command),rejected=assert.rejects(pending,{status:503,outcome:'uncertain'});
  await f.entered.promise;await f.outage();f.held.resolve();await rejected;assert.equal(f.decoded(),0);assert.equal(f.calls.length,1);assert.equal(f.runtime.cookie.status,'offline');assert.equal(boundary.isCurrent(),true);
 }finally{f.held.resolve();f.runtime.dispose();}
});
for(const surface of ['photo','payments','checkins'])test(`${surface} old certified401 cannot end actual same-owner/CSRF generation B`,async()=>{
 const f=await fixture(surface,401);try{
  const pending=f.port.execute(f.command),rejected=assert.rejects(pending,{status:401});await f.entered.promise;await f.restore({generation:2});const boundary=f.runtime.getSnapshot().boundary;f.held.resolve();await rejected;assert.equal(f.runtime.cookie.status,'ready');assert.equal(boundary.isCurrent(),true);assert.equal(f.decoded(),0);
 }finally{f.held.resolve();f.runtime.dispose();}
});
