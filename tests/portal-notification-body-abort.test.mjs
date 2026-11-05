import test from 'node:test';import assert from 'node:assert/strict';
import {createApplicationSession} from '../apps/portal/src/app/session.ts';
import {createNotificationRequest} from '../apps/portal/src/app/notification-request.ts';
import {createPhotoInventoryRequest} from '../apps/portal/src/app/photo-inventory-request.ts';
globalThis.fetch=async()=>{throw Error('global_network_denied');};
for(const family of ['notification','inventory'])test(`actual ${family} success body pending at caller abort`,async()=>{
 let body,entered,reads=0,cancelled=0,api;
 const reading=new Promise(r=>entered=r),caller=new AbortController();
 const runtime=createApplicationSession({audience:'client',locks:{request:async(_n,_o,run)=>run()},fetcher:async(url)=>{
  assert.ok(['/api/client/session','/api/client/notifications','/api/client/checkins'].includes(url));
  if(url==='/api/client/session')return Response.json({signedIn:true,ownerId:'11111111-1111-4111-8111-111111111111',generation:1,csrf:'synthetic-r4-body',capabilities:{view:true},idleExpiresAt:'2099-01-01',absoluteExpiresAt:'2099-01-02'});
  return new Response(new ReadableStream({start(c){body=c;},pull(){reads++;entered();},cancel(){cancelled++;}}));
 }});
 let pending,timer;
 try{
  await runtime.restore();api=family==='notification'?createNotificationRequest(runtime):createPhotoInventoryRequest(runtime);
  pending=(family==='notification'?api.execute({schemaVersion:1,action:'list_inbox_v1',cursor:null,limit:5},{signal:caller.signal}):api.readPage({cursor:null,limit:5,expectedRevision:null},{signal:caller.signal})).then(value=>({state:'ok',value}),error=>({state:'error',status:error.status}));
  await reading;caller.abort();const observed=await Promise.race([pending,new Promise(r=>{timer=setTimeout(()=>r({state:'pending'}),100);})]);
  console.log(JSON.stringify({family,observed,aborted:caller.signal.aborted,reads,cancelled,cookie:runtime.cookie.status}));
  assert.equal(observed.state,'error','aborted private read must settle independently of a stalled success body');assert.equal(observed.status,503);
 }finally{clearTimeout(timer);try{body?.close();}catch{}await pending;api?.dispose();runtime.dispose();}
});
for(const mode of ['pending','rejected','throwing'])test(`notification caller abort refuses promptly when underlying cancellation is ${mode}`,async()=>{
 let body,entered,cancelled=0,api,pending,timer;
 const reading=new Promise(resolve=>{entered=resolve;}),caller=new AbortController();
 const runtime=createApplicationSession({audience:'client',locks:{request:async(_n,_o,run)=>run()},fetcher:async(url)=>{
  assert.ok(['/api/client/session','/api/client/notifications'].includes(url));
  if(url==='/api/client/session')return Response.json({signedIn:true,ownerId:'11111111-1111-4111-8111-111111111111',generation:1,csrf:'synthetic-nt4-cancel',capabilities:{view:true},idleExpiresAt:'2099-01-01',absoluteExpiresAt:'2099-01-02'});
  return new Response(new ReadableStream({start(controller){body=controller;},pull(){entered();},cancel(){
   cancelled++;
   if(mode==='pending')return new Promise(()=>{});
   if(mode==='rejected')return Promise.reject(Error('synthetic_cancel_rejected'));
   throw Error('synthetic_cancel_threw');
  }}));
 }});
 try{
  await runtime.restore();api=createNotificationRequest(runtime);const boundary=runtime.getSnapshot().boundary;
  pending=api.execute({schemaVersion:1,action:'list_inbox_v1',cursor:null,limit:5},{signal:caller.signal}).then(value=>({state:'ok',value}),error=>({state:'error',status:error.status}));
  await reading;caller.abort();
  const observed=await Promise.race([pending,new Promise(resolve=>{timer=setTimeout(()=>resolve({state:'pending'}),100);})]);
  assert.deepEqual(observed,{state:'error',status:503});assert.equal(cancelled,1);
  assert.equal(runtime.cookie.status,'ready');assert.equal(runtime.getSnapshot().boundary,boundary);assert.equal(boundary.isCurrent(),true);
 }finally{clearTimeout(timer);try{body?.close();}catch{}await pending;api?.dispose();runtime.dispose();}
});
