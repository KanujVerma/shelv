// Actual ApplicationSession/cookie/raw factories/Root, finite synthetic HTTP.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createCookieRequest} from '../site/auth/advisor-cookie-session.js';
import {createClientCookieRequest,createClientPhotoUpload} from '../site/auth/client-cookie-session.js';
import {fixture,rawRequest,positiveRoot,followingReviewAndStop,bodyRead,deferred,abortError,families,statusCommand,read,preparation,stop,stopReceipt,owner,requestId} from './rebuild-cookie-cancellation-helper.mjs';

test('T1: actual raw Review JSON-body cancellation keeps the lease and following Review/Care Stop egress',async t=>{
 const f=await fixture(t),boundary=f.runtime.getSnapshot().boundary,lease=await f.runtime.cookie.acquire(),generation=f.runtime.cookie.generation;
 const body=bodyRead(),controller=new AbortController();f.queue.push((_url,init)=>body.response(init));
 const result=rawRequest(f).execute(read,{signal:controller.signal}).catch(e=>({status:e.status,outcome:e.outcome}));
 await body.entered;controller.abort();const outcome=await result;
 const afterAbort=f.runtime.cookie.status;
 let following,care;
 f.reply(preparation);try{following=positiveRoot(await rawRequest(f).execute(read),read);}catch(e){following={status:e.status};}
 f.reply(stopReceipt);try{const {createClientPorts}=await import('../src/app/ports.ts');care=await createClientPorts(f.runtime,{care:true}).care.execute(stop);}catch(e){care={status:e.status,outcome:e.outcome};}
 const observation={outcome,afterAbort,followingStatus:following.schemaVersion===3?200:following.status,care,calls:f.calls.map(c=>JSON.parse(c.init.body))};
 if(process.env.W0_COOKIE_CANCELLATION_OBSERVATION)await fs.writeFile(process.env.W0_COOKIE_CANCELLATION_OBSERVATION,JSON.stringify(observation,null,2)+'\n');
 assert.deepEqual(outcome,{status:503,outcome:'rejected'});
 assert.equal(afterAbort,'ready','caller cancellation is not shared-cookie network unavailability');
 assert.equal(f.runtime.cookie.isCurrent(lease),true);assert.equal(f.runtime.cookie.generation,generation);assert.equal(f.runtime.getSnapshot().boundary,boundary);assert.equal(boundary.isCurrent(),true);
 assert.deepEqual(following,preparation);assert.deepEqual(care,stopReceipt);
 assert.deepEqual(observation.calls,[read,read,stop]);
});

for(const family of families){
 const audience=family.split('/')[0],channel=family.split('/')[1];
 for(const http of [401,403,503])test(`${family}: canceling a known HTTP${http} body cannot hide the actual denial/failure`,async t=>{
  const f=await fixture(t,{audience}),controller=new AbortController(),body=bodyRead({status:http});f.queue.push((_u,init)=>body.response(init));
  const pending=rawRequest(f,family).execute(statusCommand,{signal:controller.signal}),rejected=assert.rejects(pending,e=>e.status===http);await body.entered;controller.abort();await rejected;
  assert.equal(f.runtime.cookie.status,http===401?'signedout':http===503?'offline':'ready');
 });
 for(const phase of ['pre-aborted','fetch','body','late-success'])test(`${family}: ${phase} caller abort rejects only its operation`,async t=>{
  const f=await fixture(t,{audience}),request=rawRequest(f,family),controller=new AbortController(),lease=await f.runtime.cookie.acquire();
  const entered=deferred();let body,release;
  if(phase==='pre-aborted')controller.abort();
  else if(phase==='fetch')f.queue.push((_u,init)=>new Promise((_resolve,reject)=>{init.signal.addEventListener('abort',()=>reject(abortError()),{once:true});entered.resolve();}));
  else {body=bodyRead({errorOnAbort:phase!=='late-success'});f.queue.push((_u,init)=>body.response(init));release=()=>body.finish();}
  const pending=request.execute(statusCommand,{signal:controller.signal});const rejected=assert.rejects(pending,e=>e.status===503&&e.outcome==='rejected');
  if(phase!=='pre-aborted'){await(body?body.entered:entered.promise);controller.abort();if(release&&phase==='late-success')release();}
  await rejected;assert.equal(f.runtime.cookie.status,'ready');assert.equal(f.runtime.cookie.isCurrent(lease),true);assert.equal(f.calls.length,phase==='pre-aborted'?0:1);
  f.reply({status:'absent'});assert.deepEqual(positiveRoot(await request.execute(statusCommand),statusCommand,family),{status:'absent'});assert.equal(f.calls.at(-1).url,`/api/${family}`);
 });
 test(`${family}: direct typed-cookie pre-abort has zero egress without global suspension`,async t=>{
  const f=await fixture(t,{audience}),controller=new AbortController();controller.abort();
  const factory=audience==='client'?createClientCookieRequest:createCookieRequest;
  await assert.rejects(factory(channel,f.runtime.cookie)(statusCommand,{signal:controller.signal}),e=>e.name==='AbortError');
  assert.equal(f.calls.length,0);assert.equal(f.runtime.cookie.status,'ready');
 });
 for(const failure of ['network','malformed','http503','http401','abort-without-caller','deadline','deadline-before-caller','late-abort-network','late-abort-malformed','late-abort-http503','late-abort-http401'])test(`${family}: ${failure} retains actual failure semantics`,async t=>{
  const f=await fixture(t,{audience,timeoutMs:20}),request=rawRequest(f,family),controller=new AbortController();
  const knownBody=failure==='late-abort-http401'?bodyRead({status:401}):null;
  f.queue.push((_u,init)=>{
   if(knownBody)return knownBody.response(init);
   const late=failure.startsWith('late-abort-');if(late)controller.abort();
   if(failure.endsWith('network'))throw new TypeError('synthetic network unavailable');
   if(failure.endsWith('malformed'))return new Response('{',{status:200});
   if(failure.endsWith('http503'))return Response.json({code:'unavailable'},{status:503});
   if(failure.endsWith('http401'))return Response.json({code:'session_ended'},{status:401});
   if(failure==='abort-without-caller')throw abortError();
   return new Promise((_resolve,reject)=>init.signal.addEventListener('abort',()=>{if(failure==='deadline-before-caller')controller.abort();reject(abortError());},{once:true}));
  });
  const denied=failure.endsWith('http401');const rejection=assert.rejects(request.execute(statusCommand,{signal:controller.signal}),e=>e.status===(denied?401:503));
  if(knownBody){await knownBody.entered;controller.abort();}
  await rejection;
  assert.equal(f.runtime.cookie.status,denied?'signedout':'offline');assert.equal(f.calls.length,1);
  const before=f.calls.length;await assert.rejects(request.execute(statusCommand),e=>e.status===(denied?401:503));assert.equal(f.calls.length,before);
  await f.runtime.restore();f.reply({status:'absent'});assert.deepEqual(positiveRoot(await rawRequest(f,family).execute(statusCommand),statusCommand,family),{status:'absent'});
 });
 test(`${family}: a late caller signal cannot erase an actual current403`,async t=>{
  const f=await fixture(t,{audience}),controller=new AbortController(),body=bodyRead({status:403});f.queue.push((_u,init)=>body.response(init));
  const rejection=assert.rejects(rawRequest(f,family).execute(statusCommand,{signal:controller.signal}),e=>e.status===403&&e.outcome==='rejected');
  await body.entered;controller.abort();await rejection;assert.equal(f.runtime.cookie.status,'ready');
 });
 for(const replacement of ['owner','csrf','logout-epoch','generation'])test(`${family}: stale ${replacement} result/error/finally cannot retire the new lease`,async t=>{
  const f=await fixture(t,{audience}),old=rawRequest(f,family),oldBoundary=f.runtime.getSnapshot().boundary,entered=deferred(),held=deferred(),oldController=new AbortController();
  f.queue.push(async()=>{entered.resolve();await held.promise;return Response.json({status:'absent'});});
  const pending=old.execute(statusCommand,{signal:oldController.signal});const rejected=assert.rejects(pending,e=>e.status===401);await entered.promise;
  if(replacement==='owner')f.setLogin({ownerId:'22222222-2222-4222-8222-222222222222'});
  else if(replacement==='csrf')f.setLogin({csrf:'synthetic-replacement-csrf'});
  else if(replacement==='logout-epoch')await f.runtime.cookie.signOut();
  else {await f.runtime.cookie.signOut();await f.runtime.restore();await f.runtime.cookie.signOut();}
  await f.runtime.restore();const newLease=await f.runtime.cookie.acquire(),fresh=rawRequest(f,family),body=bodyRead({errorOnAbort:false});f.queue.push((_u,init)=>body.response(init));
  const current=fresh.execute(statusCommand);await body.entered;held.resolve();await rejected;oldController.abort();
  assert.equal(oldBoundary.isCurrent(),false);assert.equal(f.runtime.cookie.isCurrent(newLease),true);assert.equal(f.runtime.cookie.status,'ready');
  body.finish();assert.deepEqual(positiveRoot(await current,statusCommand,family),{status:'absent'});
  const count=f.calls.length;await assert.rejects(old.execute(statusCommand),e=>e.status===401);assert.equal(f.calls.length,count);
 });
}

test('actual Care Stop abort retains uncertain original CAS/UUID/wire and does not disable following Stop',async t=>{
 const f=await fixture(t),{createClientPorts}=await import('../src/app/ports.ts'),care=createClientPorts(f.runtime,{care:true}).care,body=bodyRead(),controller=new AbortController();
 f.queue.push((_u,init)=>body.response(init));const pending=care.execute(stop,{signal:controller.signal}),rejected=assert.rejects(pending,e=>e.status===503&&e.outcome==='uncertain');await body.entered;controller.abort();await rejected;
 assert.equal(f.runtime.cookie.status,'ready');assert.equal(f.calls.length,1);const wire=f.calls[0].init.body;
 f.reply(preparation);assert.deepEqual(positiveRoot(await rawRequest(f).execute(read),read),preparation);
 f.reply(stopReceipt);assert.deepEqual(await care.execute(stop),stopReceipt);assert.equal(f.calls.length,3);assert.equal(f.calls[2].init.body,wire);assert.equal(JSON.parse(wire).requestId,requestId);assert.equal(JSON.parse(wire).expectedUseRevision,0);
});

for(const family of families)test(`${family}: aborted WRITE remains uncertain and exact UUID/wire requires explicit retry`,async t=>{
 const f=await fixture(t,{audience:family.split('/')[0]}),request=rawRequest(f,family),controller=new AbortController(),body=bodyRead();
 const action=family==='client/reviews'?'submit_goal_report_v1':family==='advisor/reviews'?'record_conversation_v1':'create_guidance_draft_v1';
 // Raw factories intentionally leave domain validation to the enclosing feature.
 const command={schemaVersion:1,action,requestId,note:'captured'},wire=JSON.stringify(command);f.queue.push((_u,init)=>body.response(init));
 const pending=request.execute(command,{signal:controller.signal});command.note='later';const rejected=assert.rejects(pending,e=>e.status===503&&e.outcome==='uncertain');await body.entered;controller.abort();await rejected;
 assert.equal(f.runtime.cookie.status,'ready');assert.equal(f.calls.length,1);assert.equal(f.calls[0].init.body,wire);
 f.reply({status:'absent'});assert.deepEqual(positiveRoot(await request.execute(statusCommand),statusCommand,family),{status:'absent'});assert.equal(JSON.parse(f.calls[1].init.body).requestId,requestId);
 f.reply({captured:true});await request.execute(JSON.parse(wire));assert.equal(f.calls.length,3);assert.equal(f.calls[2].init.body,wire);
});

for(const kind of ['photo','payments-multipart','checkins-multipart']){
 function operation(f){
  const file=new File(['synthetic'],'private.jpg',{type:'image/jpeg'});
  if(kind==='photo')return options=>createClientPhotoUpload(f.runtime.cookie)({file,angle:'front',requestId,completionRequestId:owner,expectedRevision:0},options);
  const form=new FormData();form.set('file',file);form.set('action',kind.startsWith('payments')?'submit_claim':'submit_report');
  return options=>createClientCookieRequest(kind.split('-')[0],f.runtime.cookie)(form,options);
 }
 for(const phase of ['pre-aborted','fetch','body','late-success'])test(`${kind}: ${phase} caller cancellation preserves unrelated Review/Care`,async t=>{
  const f=await fixture(t),execute=operation(f),controller=new AbortController(),entered=deferred();let body;
  if(phase==='pre-aborted')controller.abort();
  else if(phase==='fetch')f.queue.push((_u,init)=>new Promise((_resolve,reject)=>{init.signal.addEventListener('abort',()=>reject(abortError()),{once:true});entered.resolve();}));
  else{body=bodyRead({errorOnAbort:phase!=='late-success'});f.queue.push((_u,init)=>body.response(init));}
  const pending=execute({signal:controller.signal});const rejected=assert.rejects(pending,e=>e.name==='AbortError');
  if(phase!=='pre-aborted'){await(body?body.entered:entered.promise);controller.abort();if(phase==='late-success')body.finish();}await rejected;
  assert.equal(f.runtime.cookie.status,'ready');assert.equal(f.calls.length,phase==='pre-aborted'?0:1);await followingReviewAndStop(f);
 });
 for(const failure of ['network','malformed','http503','http401','deadline','late-abort-network'])test(`${kind}: ${failure} still suspends or ends a current session`,async t=>{
  const f=await fixture(t,{timeoutMs:20}),controller=new AbortController();f.queue.push((_u,init)=>{
   if(failure==='late-abort-network')controller.abort();
   if(failure.endsWith('network'))throw new TypeError('synthetic unavailable');
   if(failure==='malformed')return new Response('{',{status:200});
   if(failure==='deadline')return new Promise((_r,reject)=>init.signal.addEventListener('abort',()=>reject(abortError()),{once:true}));
   return Response.json({code:'unavailable'},{status:failure==='http401'?401:503});
  });await assert.rejects(operation(f)({signal:controller.signal}),e=>e.status===(failure==='http401'?401:503));assert.equal(f.runtime.cookie.status,failure==='http401'?'signedout':'offline');
 });
}
