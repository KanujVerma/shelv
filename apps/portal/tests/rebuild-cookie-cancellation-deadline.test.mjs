// CK1/CK2 source regressions. Actual application/cookie/factories/Root only;
// finite signal-ignoring streams test the source seam, not browser reachability.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createCookieRequest} from '../site/auth/advisor-cookie-session.js';
import {createClientCookieRequest,createClientPhotoUpload} from '../site/auth/client-cookie-session.js';
import {createClientPorts} from '../src/app/ports.ts';
import {fixture,rawRequest,positiveRoot,followingReviewAndStop,deferred,abortError,families,statusCommand,stop,stopReceipt,requestId,owner} from './rebuild-cookie-cancellation-helper.mjs';

const surfaces=[
 ...families.map(family=>({name:family,audience:family.split('/')[0],family,kind:'app'})),
 ...['client','advisor'].flatMap(audience=>[
  {name:audience+'/typed',audience,family:audience+'/reviews',kind:'reviews'},
  {name:audience+'/legacy',audience,family:audience+'/reviews',kind:'checkins'},
 ]),
 ...['photo','payments-multipart','checkins-multipart'].map(kind=>({name:kind,audience:'client',family:'client/reviews',kind})),
];
function operation(f,surface){
 if(surface.kind==='app')return rawRequest(f,surface.family);
 if(surface.kind==='photo')return{execute(_input,options){return createClientPhotoUpload(f.runtime.cookie)({file:new File(['finite'],'synthetic.jpg',{type:'image/jpeg'}),angle:'front',requestId,completionRequestId:owner,expectedRevision:0},options);}};
 if(surface.kind.endsWith('multipart'))return{execute(_input,options){
  const channel=surface.kind.split('-')[0],form=new FormData();form.set('file',new File(['finite'],'synthetic.jpg',{type:'image/jpeg'}));form.set('action',channel==='payments'?'submit_claim':'submit_report');
  return createClientCookieRequest(channel,f.runtime.cookie)(form,options);
 }};
 const factory=surface.audience==='client'?createClientCookieRequest:createCookieRequest;
 return{execute(_input,options){return factory(surface.kind,f.runtime.cookie)(surface.kind==='checkins'?{action:surface.audience==='client'?'client_read':'advisor_read'}:statusCommand,options);}};
}
function stream({http=200,ignoreAbort=false}={}){
 const consuming=deferred(),aborted=deferred();let body;
 return{consuming:consuming.promise,aborted:aborted.promise,response(init){return new Response(new ReadableStream({
  start(controller){body=controller;controller.enqueue(new TextEncoder().encode('{"status":'));init.signal.addEventListener('abort',()=>{aborted.resolve();if(!ignoreAbort)controller.error(abortError());},{once:true});},
  pull(){consuming.resolve();},
 },{highWaterMark:0}),{status:http});},finish(){body.enqueue(new TextEncoder().encode('"absent"}'));body.close();},error(){body.error(abortError());}};
}
async function following(f,family){
 if(family==='client/reviews')return followingReviewAndStop(f);
 f.reply({status:'absent'});assert.deepEqual(positiveRoot(await rawRequest(f,family).execute(statusCommand),statusCommand,family),{status:'absent'});
}

for(const surface of surfaces){
 for(const http of [401,403,503])for(const caller of ['absent','late'])test(`CK1 ${surface.name} known HTTP${http}, deadline first, caller ${caller}`,async t=>{
  const f=await fixture(t,{audience:surface.audience,timeoutMs:20}),port=operation(f,surface),boundary=f.runtime.getSnapshot().boundary,lease=await f.runtime.cookie.acquire(),body=stream({http}),c=new AbortController();
  f.queue.push((_url,init)=>body.response(init));
  const pending=port.execute(statusCommand,caller==='absent'?undefined:{signal:c.signal});
  const rejected=assert.rejects(pending,e=>e.status===http&&(surface.kind!=='app'||e.outcome===(http===401?'session-ended':'rejected')));
  await body.consuming;await body.aborted;if(caller==='late')c.abort();await rejected;
  assert.equal(f.calls.length,1,'no automatic retry');assert.equal(f.runtime.cookie.status,http===401?'signedout':http===403?'ready':'offline');
  if(http===401){assert.equal(boundary.isCurrent(),false);assert.equal(f.runtime.cookie.isCurrent(lease),false);const count=f.calls.length;await assert.rejects(port.execute(statusCommand),e=>e.status===401);assert.equal(f.calls.length,count);}
  else if(http===403){assert.equal(f.runtime.getSnapshot().boundary,boundary);assert.equal(f.runtime.cookie.isCurrent(lease),true);await following(f,surface.family);}
  else {const count=f.calls.length;await assert.rejects(port.execute(statusCommand),e=>e.status===503);assert.equal(f.calls.length,count);await f.runtime.restore();await following(f,surface.family);}
 });
 for(const phase of ['fetch','body'])test(`CK2 ${surface.name} signal-ignoring ${phase} success after actual deadline rejects`,async t=>{
  const f=await fixture(t,{audience:surface.audience,timeoutMs:20}),port=operation(f,surface),body=stream({ignoreAbort:true}),entered=deferred(),aborted=deferred(),release=deferred();
  if(phase==='body')f.queue.push((_url,init)=>body.response(init));
  else f.queue.push(async(_url,init)=>{init.signal.addEventListener('abort',()=>aborted.resolve(),{once:true});entered.resolve();await release.promise;return Response.json({status:'absent'});});
  const pending=port.execute(statusCommand),rejected=assert.rejects(pending,e=>e.status===503&&(surface.kind!=='app'||e.outcome==='rejected'));
  if(phase==='body'){await body.consuming;await body.aborted;body.finish();}else{await entered.promise;await aborted.promise;release.resolve();}await rejected;
  assert.equal(f.calls.length,1);assert.equal(f.runtime.cookie.status,'offline');const count=f.calls.length;await assert.rejects(port.execute(statusCommand),e=>e.status===503);assert.equal(f.calls.length,count);
  await f.runtime.restore();await following(f,surface.family);
 });
}

for(const family of families)for(const http of [401,403,503])for(const replacement of ['owner','csrf'])test(`CK1 stale ${family} HTTP${http} deadline cannot retire replacement ${replacement}`,async t=>{
 const f=await fixture(t,{audience:family.split('/')[0],timeoutMs:20}),old=rawRequest(f,family),oldBoundary=f.runtime.getSnapshot().boundary,body=stream({http,ignoreAbort:true});f.queue.push((_url,init)=>body.response(init));
 const pending=old.execute(statusCommand),rejected=assert.rejects(pending,e=>e.status===401);await body.consuming;await body.aborted;
 f.setLogin(replacement==='owner'?{ownerId:'22222222-2222-4222-8222-222222222222'}:{csrf:'replacement-after-deadline'});await f.runtime.restore();const lease=await f.runtime.cookie.acquire();body.error();await rejected;
 assert.equal(oldBoundary.isCurrent(),false);assert.equal(f.runtime.cookie.status,'ready');assert.equal(f.runtime.cookie.isCurrent(lease),true);await following(f,family);
});

for(const family of families)test(`CK2 ${family} WRITE keeps mixed-case UUID/wire and uncertainty through exact retry`,async t=>{
 const f=await fixture(t,{audience:family.split('/')[0],timeoutMs:20}),port=rawRequest(f,family),body=stream({ignoreAbort:true}),c=new AbortController();
 const command={schemaVersion:1,action:family==='client/reviews'?'submit_goal_report_v1':family==='advisor/reviews'?'record_conversation_v1':'create_guidance_draft_v1',requestId:'aaaaaaaa-aaaa-4aaa-8aaa-0123456789aB',note:'captured'},wire=JSON.stringify(command);
 f.queue.push((_url,init)=>body.response(init));const pending=port.execute(command,{signal:c.signal}),rejected=assert.rejects(pending,e=>e.status===503&&e.outcome==='uncertain');command.note='later';await body.consuming;await body.aborted;c.abort();body.finish();await rejected;
 assert.equal(f.runtime.cookie.status,'offline');assert.equal(f.calls.length,1);assert.equal(f.calls[0].init.body,wire);
 await f.runtime.restore();f.reply({status:'absent'});assert.deepEqual(positiveRoot(await port.execute({...statusCommand,requestId:JSON.parse(wire).requestId}),{...statusCommand,requestId:JSON.parse(wire).requestId},family),{status:'absent'});
 f.reply({raw:'explicit retry acknowledgement'});await port.execute(JSON.parse(wire));assert.equal(f.calls.length,3);assert.equal(f.calls[2].init.body,wire);
});

test('CK2 actual Care Stop deadline retains canonical UUID/CAS/wire; status remains READ and retry is explicit',async t=>{
 const f=await fixture(t,{timeoutMs:20}),care=createClientPorts(f.runtime,{care:true}).care,body=stream({ignoreAbort:true});f.queue.push((_url,init)=>body.response(init));
 const pending=care.execute(stop),rejected=assert.rejects(pending,e=>e.status===503&&e.outcome==='uncertain');await body.consuming;await body.aborted;body.finish();await rejected;assert.equal(f.runtime.cookie.status,'offline');assert.equal(f.calls.length,1);const wire=f.calls[0].init.body;
 await f.runtime.restore();f.reply({status:'absent'});assert.deepEqual(await care.execute(statusCommand),{status:'absent'});assert.equal(JSON.parse(f.calls[1].init.body).action,'request_status_v1');
 f.reply(stopReceipt);assert.deepEqual(await care.execute(stop),stopReceipt);assert.equal(f.calls.length,3);assert.equal(f.calls[2].init.body,wire);assert.equal(JSON.parse(wire).expectedUseRevision,0);assert.equal(JSON.parse(wire).requestId,requestId);
});

for(const audience of ['client','advisor'])test(`CK2 direct ${audience} _transport GET success cannot pass its deadline`,async t=>{
 const f=await fixture(t,{audience,timeoutMs:20}),body=stream({ignoreAbort:true});f.queue.push((_url,init)=>{assert.equal(init.method,'GET');assert.equal(init.body,undefined);return body.response(init);});
 const pending=f.runtime.cookie._transport('reviews',{csrf:f.runtime.cookie._view.csrf}),rejected=assert.rejects(pending,e=>e.status===503);await body.consuming;await body.aborted;body.finish();await rejected;
 // The low-level transport classifies; only its calling factory owns suspension.
 assert.equal(f.runtime.cookie.status,'ready');await following(f,audience+'/reviews');
});
