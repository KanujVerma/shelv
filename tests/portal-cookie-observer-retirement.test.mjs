import test from 'node:test';import assert from 'node:assert/strict';
import {createApplicationSession} from '../apps/portal/src/app/session.ts';
import {createNotificationRequest} from '../apps/portal/src/app/notification-request.ts';
globalThis.fetch=async()=>{throw Error('global_network_denied');};
const owner='11111111-1111-4111-8111-111111111111';
async function make(){const calls=[];const runtime=createApplicationSession({audience:'client',locks:{request:async(_n,_o,run)=>run()},fetcher:async(url,init)=>{calls.push(url);assert.ok(['/api/client/session','/api/client/logout'].includes(url));if(url==='/api/client/logout')return Response.json({providerRevoked:true});if(new Headers(init.headers).get('X-Shelv-Logout')==='1')return Response.json({csrf:'synthetic-observer'});return Response.json({signedIn:true,ownerId:owner,generation:1,csrf:'synthetic-observer',capabilities:{view:true},idleExpiresAt:'2099-01-01',absoluteExpiresAt:'2099-01-02'});}});await runtime.restore();return {runtime,calls};}
for(const throwing of [false,true])test(`actual ApplicationSession signOut isolates ${throwing?'throwing':'ordinary'} boundary invalidation observer`,async()=>{
 const {runtime,calls}=await make();const boundary=runtime.getSnapshot().boundary;let retired=0,error;const stop=boundary.subscribeInvalidation(()=>{if(throwing)throw Error('synthetic_observer_throw');});const stop2=boundary.subscribeInvalidation(()=>retired++);
 try{try{await runtime.signOut();}catch(e){error=e;}const observed={throwing,error:error?.message,retired,cookie:runtime.cookie.status,snapshot:runtime.getSnapshot().status,boundarySame:runtime.getSnapshot().boundary===boundary,logout: calls.includes('/api/client/logout')};console.log(JSON.stringify(observed));assert.equal(error,undefined,'observer must not prevent canonical logout');assert.equal(retired,1);assert.equal(runtime.cookie.status,'signedout');assert.equal(observed.logout,true);assert.equal(runtime.getSnapshot().boundary,null);}
 finally{stop();stop2();runtime.dispose();}
});
test('logout reaches the retained endpoint despite boundary, transport and App observer throws',async()=>{
 const {runtime,calls}=await make(),boundary=runtime.getSnapshot().boundary,seen=[];let laterBoundary=0,laterTransport=0,laterApp=0;
 boundary.memory.set('private','SYNTHETIC_BOUNDARY_MEMORY');runtime.transport.memory.set('private','SYNTHETIC_TRANSPORT_MEMORY');
 const stops=[boundary.subscribeInvalidation(()=>{seen.push({current:boundary.isCurrent(),boundary:boundary.memory.get('private'),transport:runtime.transport.memory.get('private'),snapshot:runtime.getSnapshot().boundary});throw Error('synthetic_boundary_throw');}),boundary.subscribeInvalidation(()=>laterBoundary++),runtime.transport.subscribeInvalidation(()=>{throw Error('synthetic_transport_throw');}),runtime.transport.subscribeInvalidation(()=>laterTransport++),runtime.subscribe(()=>{throw Error('synthetic_app_throw');}),runtime.subscribe(()=>laterApp++)];
 try{
  await runtime.signOut();assert.equal(calls.includes('/api/client/logout'),true);assert.equal(runtime.cookie.status,'signedout');
  assert.deepEqual(seen,[{current:false,boundary:undefined,transport:undefined,snapshot:null}]);assert.equal(laterBoundary,1);assert.ok(laterTransport>=1);assert.ok(laterApp>=1);
 }finally{for(const stop of stops)stop();runtime.dispose();}
});
test('actual held-request abort observes both private stores retired before disposal effects',async()=>{
 let entered,seen,api,pending;
 const waiting=new Promise(resolve=>{entered=resolve;}),runtime=createApplicationSession({audience:'client',locks:{request:async(_n,_o,run)=>run()},fetcher:async(url,init)=>{
  assert.ok(['/api/client/session','/api/client/notifications'].includes(url));
  if(url==='/api/client/session')return Response.json({signedIn:true,ownerId:owner,generation:1,csrf:'synthetic-abort-order',capabilities:{view:true},idleExpiresAt:'2099-01-01',absoluteExpiresAt:'2099-01-02'});
  entered();return new Promise(resolve=>{init.signal.addEventListener('abort',()=>{
   seen={snapshot:runtime.getSnapshot().boundary,current:boundary.isCurrent(),boundary:boundary.memory.get('private'),transport:runtime.transport.memory.get('private')};
   resolve(Response.json({schemaVersion:1,consistency:'live_keyset',observedAt:'2026-11-02T00:00:00Z',cursor:null,items:[],nextCursor:null}));
  },{once:true});});
 }});let boundary;
 try{
  await runtime.restore();boundary=runtime.getSnapshot().boundary;boundary.memory.set('private','SYNTHETIC_BOUNDARY_MEMORY');runtime.transport.memory.set('private','SYNTHETIC_TRANSPORT_MEMORY');api=createNotificationRequest(runtime);
  pending=api.execute({schemaVersion:1,action:'list_inbox_v1',cursor:null,limit:1}).then(value=>({state:'ok',value}),error=>({state:'error',status:error.status}));await waiting;runtime.dispose();
  assert.deepEqual(await pending,{state:'error',status:401});assert.deepEqual(seen,{snapshot:null,current:false,boundary:undefined,transport:undefined});
 }finally{api?.dispose();runtime.dispose();await pending;}
});
for(const throwing of [false,true])test(`actual ApplicationSession dispose fences before ${throwing?'throwing':'ordinary'} transport invalidation observer`,async()=>{
 const {runtime}=await make();const boundary=runtime.getSnapshot().boundary;boundary.memory.set('synthetic-private','SYNTHETIC_R5_PRIVATE_STATE');let retired=0,error,seen;
 const stop=runtime.transport.subscribeInvalidation(()=>{seen={boundaryCurrent:boundary.isCurrent(),memory:boundary.memory.get('synthetic-private')};if(throwing)throw Error('synthetic_observer_throw');});const stop2=boundary.subscribeInvalidation(()=>retired++);
 try{try{runtime.dispose();}catch(e){error=e;}const observed={throwing,error:error?.message,retired,cookie:runtime.cookie.status,boundaryCurrent:boundary.isCurrent(),privateMemory:boundary.memory.get('synthetic-private'),seen};console.log(JSON.stringify(observed));assert.equal(error,undefined,'observer must not prevent actual session disposal');assert.equal(retired,1);assert.equal(observed.boundaryCurrent,false);assert.equal(observed.privateMemory,undefined);assert.equal(seen.boundaryCurrent,false,'actual Application boundary must be fenced before observer callback');assert.equal(seen.memory,undefined);}
 finally{stop();stop2();runtime.dispose();}
});
